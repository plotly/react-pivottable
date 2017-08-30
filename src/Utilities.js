/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS201: Simplify complex destructure assignments
 * DS203: Remove `|| {}` from converted for-own loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const addSeparators = function(nStr, thousandsSep, decimalSep) {
  const x = String(nStr).split('.');
  let x1 = x[0];
  const x2 = x.length > 1 ?  decimalSep + x[1] : '';
  const rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) { x1 = x1.replace(rgx, `$1${thousandsSep}$2`); }
  return x1 + x2;
};

const numberFormat = function(opts) {
  const defaults = {
    digitsAfterDecimal: 2, scaler: 1,
    thousandsSep: ",", decimalSep: ".",
    prefix: "", suffix: ""
  };
  opts = Object.assign({}, defaults, opts);
  return function(x) {
    if (isNaN(x) || !isFinite(x)) { return ""; }
    const result = addSeparators((opts.scaler*x).toFixed(opts.digitsAfterDecimal), opts.thousandsSep, opts.decimalSep);
    return `${opts.prefix}${result}${opts.suffix}`;
  };
};

//aggregator templates default to US number formatting but this is overrideable
const usFmt = numberFormat();
const usFmtInt = numberFormat({digitsAfterDecimal: 0});
const usFmtPct = numberFormat({digitsAfterDecimal:1, scaler: 100, suffix: "%"});

const aggregatorTemplates = {
  count(formatter = usFmtInt) {
    return () => function(data, rowKey, colKey) {
      return {
        count: 0,
        push() { return this.count++; },
        value() { return this.count; },
        format: formatter
      };
    };
  },

  uniques(fn, formatter = usFmtInt) {
    return function([attr]) {
      return function(data, rowKey, colKey) {
        return {
          uniq: [],
          push(record) { if (!Array.from(this.uniq).includes(record[attr])) { return this.uniq.push(record[attr]); } },
          value() { return fn(this.uniq); },
          format: formatter,
          numInputs: (attr !== null) ? 0 : 1
        };
      };
    };
  },

  sum(formatter = usFmt) {
    return function([attr]) {
      return function(data, rowKey, colKey) {
        return {
          sum: 0,
          push(record) {
            if (!isNaN(parseFloat(record[attr]))) { return this.sum += parseFloat(record[attr]); }
          },
          value() { return this.sum; },
          format: formatter,
          numInputs: (attr !== null) ? 0 : 1
        };
      };
    };
  },

  extremes(mode, formatter = usFmt) {
    return function([attr]) {
      return function(data, rowKey, colKey) {
        return {
          val: null,
          sorter: getSort(data.sorters, attr),
          push(record) {
            let x = record[attr];
            if (["min", "max"].includes(mode)) {
              x = parseFloat(x);
              if (!isNaN(x)) { this.val = Math[mode](x, this.val !== null ? this.val : x); }
            }
            if (mode === "first") { if (this.sorter(x, this.val !== null ? this.val : x) <= 0) { this.val = x; } }
            if (mode === "last") {  if (this.sorter(x, this.val !== null ? this.val : x) >= 0) { return this.val = x; } }
          },
          value() { return this.val; },
          format(x) { if (isNaN(x)) { return x; } else { return formatter(x); } },
          numInputs: (attr !== null) ? 0 : 1
        };
      };
    };
  },

  quantile(q, formatter = usFmt) {
    return function([attr]) {
      return function(data, rowKey, colKey) {
        return {
          vals: [],
          push(record) {
            const x = parseFloat(record[attr]);
            if (!isNaN(x)) { return this.vals.push(x); }
          },
          value() {
            if (this.vals.length === 0) { return null; }
            this.vals.sort((a,b) => a-b);
            const i = (this.vals.length-1)*q;
            return (this.vals[Math.floor(i)] + this.vals[Math.ceil(i)])/2.0;
          },
          format: formatter,
          numInputs: (attr !== null) ? 0 : 1
        };
      };
    };
  },

  runningStat(mode="mean", ddof=1, formatter = usFmt) {
    return function([attr]) {
      return function(data, rowKey, colKey) {
        return {
          n: 0.0, m: 0.0, s: 0.0,
          push(record) {
            const x = parseFloat(record[attr]);
            if (isNaN(x)) { return; }
            this.n += 1.0;
            if (this.n === 1.0) {
              return this.m = x;
            } else {
              const m_new = this.m + ((x - this.m)/this.n);
              this.s = this.s + ((x - this.m)*(x - m_new));
              return this.m = m_new;
            }
          },
          value() {
            if (mode === "mean") {
              if (this.n === 0) { return 0/0; } else { return this.m; }
            }
            if (this.n <= ddof) { return 0; }
            switch (mode) {
              case "var":   return this.s/(this.n-ddof);
              case "stdev": return Math.sqrt(this.s/(this.n-ddof));
            }
          },
          format: formatter,
          numInputs: (attr !== null) ? 0 : 1
        };
      };
    };
  },

  sumOverSum(formatter = usFmt) {
    return function([num, denom]) {
      return function(data, rowKey, colKey) {
        return {
          sumNum: 0,
          sumDenom: 0,
          push(record) {
            if (!isNaN(parseFloat(record[num]))) { this.sumNum   += parseFloat(record[num]); }
            if (!isNaN(parseFloat(record[denom]))) { return this.sumDenom += parseFloat(record[denom]); }
          },
          value() { return this.sumNum/this.sumDenom; },
          format: formatter,
          numInputs: (num !== null) && (denom !== null) ? 0 : 2
        };
      };
    };
  },

  sumOverSumBound80(upper=true, formatter = usFmt) {
    return function([num, denom]) {
      return function(data, rowKey, colKey) {
        return {
          sumNum: 0,
          sumDenom: 0,
          push(record) {
            if (!isNaN(parseFloat(record[num]))) { this.sumNum   += parseFloat(record[num]); }
            if (!isNaN(parseFloat(record[denom]))) { return this.sumDenom += parseFloat(record[denom]); }
          },
          value() {
            const sign = upper ? 1 : -1;
            return ((0.821187207574908/this.sumDenom) + (this.sumNum/this.sumDenom) + (1.2815515655446004*sign*
              Math.sqrt((0.410593603787454/ (this.sumDenom*this.sumDenom)) + ((this.sumNum*(1 - (this.sumNum/ this.sumDenom)))/ (this.sumDenom*this.sumDenom)))))/
              (1 + (1.642374415149816/this.sumDenom));
          },
          format: formatter,
          numInputs: (num !== null) && (denom !== null) ? 0 : 2
        };
      };
    };
  },

  fractionOf(wrapped, type="total", formatter= usFmtPct) {
    return (...x) => function(data, rowKey, colKey) {
      return {
        selector: {total:[[],[]],row:[rowKey,[]],col:[[],colKey]}[type],
        inner: wrapped(...Array.from(x || []))(data, rowKey, colKey),
        push(record) { return this.inner.push(record); },
        format: formatter,
        value() { return this.inner.value() / data.getAggregator(...Array.from(this.selector || [])).inner.value(); },
        numInputs: wrapped(...Array.from(x || []))().numInputs
      };
    };
  }
};

aggregatorTemplates.countUnique = f => aggregatorTemplates.uniques((x => x.length), f);
aggregatorTemplates.listUnique =  s => aggregatorTemplates.uniques((x => x.join(s)), (x=> x));
aggregatorTemplates.max =     f => aggregatorTemplates.extremes('max', f);
aggregatorTemplates.min =     f => aggregatorTemplates.extremes('min', f);
aggregatorTemplates.first =     f => aggregatorTemplates.extremes('first', f);
aggregatorTemplates.last =    f => aggregatorTemplates.extremes('last', f);
aggregatorTemplates.median =    f => aggregatorTemplates.quantile(0.5, f);
aggregatorTemplates.average =   f => aggregatorTemplates.runningStat("mean", 1, f);
aggregatorTemplates.var =     (ddof, f) => aggregatorTemplates.runningStat("var", ddof, f);
aggregatorTemplates.stdev =     (ddof, f) => aggregatorTemplates.runningStat("stdev", ddof, f);

//default aggregators & renderers use US naming and number formatting
const aggregators = (tpl =>
  ({
    "Count":        tpl.count(usFmtInt),
    "Count Unique Values":  tpl.countUnique(usFmtInt),
    "List Unique Values":   tpl.listUnique(", "),
    "Sum":          tpl.sum(usFmt),
    "Integer Sum":      tpl.sum(usFmtInt),
    "Average":        tpl.average(usFmt),
    "Median":         tpl.median(usFmt),
    "Sample Variance":    tpl.var(1, usFmt),
    "Sample Standard Deviation": tpl.stdev(1, usFmt),
    "Minimum":        tpl.min(usFmt),
    "Maximum":        tpl.max(usFmt),
    "First":        tpl.first(usFmt),
    "Last":         tpl.last(usFmt),
    "Sum over Sum":     tpl.sumOverSum(usFmt),
    "80% Upper Bound":    tpl.sumOverSumBound80(true, usFmt),
    "80% Lower Bound":    tpl.sumOverSumBound80(false, usFmt),
    "Sum as Fraction of Total":   tpl.fractionOf(tpl.sum(),   "total", usFmtPct),
    "Sum as Fraction of Rows":    tpl.fractionOf(tpl.sum(),   "row",   usFmtPct),
    "Sum as Fraction of Columns":   tpl.fractionOf(tpl.sum(),   "col",   usFmtPct),
    "Count as Fraction of Total":   tpl.fractionOf(tpl.count(), "total", usFmtPct),
    "Count as Fraction of Rows":  tpl.fractionOf(tpl.count(), "row",   usFmtPct),
    "Count as Fraction of Columns": tpl.fractionOf(tpl.count(), "col",   usFmtPct)
  })
)(aggregatorTemplates);

const locales = {
  en: {
    aggregators,
    localeStrings: {
      renderError: "An error occurred rendering the PivotTable results.",
      computeError: "An error occurred computing the PivotTable results.",
      uiRenderError: "An error occurred rendering the PivotTable UI.",
      selectAll: "Select All",
      selectNone: "Select None",
      tooMany: "(too many to list)",
      filterResults: "Filter values",
      apply: "Apply",
      cancel: "Cancel",
      totals: "Totals", //for table renderer
      vs: "vs", //for gchart renderer
      by: "by"
    }
  } //for gchart renderer
};

//dateFormat deriver l10n requires month and day names to be passed in directly
const mthNamesEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dayNamesEn = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const zeroPad = number => (`0${number}`).substr(-2,2);

const derivers = {
  bin(col, binWidth) { return record => record[col] - (record[col] % binWidth); },
  dateFormat(col, formatString, utcOutput, mthNames, dayNames) {
    if (utcOutput == null) { utcOutput = false; }
    if (mthNames == null) { mthNames = mthNamesEn; }
    if (dayNames == null) { dayNames = dayNamesEn; }
    const utc = utcOutput ? "UTC" : "";
    return function(record) { //thanks http://stackoverflow.com/a/12213072/112871
      const date = new Date(Date.parse(record[col]));
      if (isNaN(date)) { return ""; }
      return formatString.replace(/%(.)/g, function(m, p) {
        switch (p) {
          case "y": return date[`get${utc}FullYear`]();
          case "m": return zeroPad(date[`get${utc}Month`]()+1);
          case "n": return mthNames[date[`get${utc}Month`]()];
          case "d": return zeroPad(date[`get${utc}Date`]());
          case "w": return dayNames[date[`get${utc}Day`]()];
          case "x": return date[`get${utc}Day`]();
          case "H": return zeroPad(date[`get${utc}Hours`]());
          case "M": return zeroPad(date[`get${utc}Minutes`]());
          case "S": return zeroPad(date[`get${utc}Seconds`]());
          default: return `%${p}`;
        }
      });
    };
  }
};

const rx = /(\d+)|(\D+)/g;
const rd = /\d/;
const rz = /^0/;
const naturalSort = (as, bs) => {
  //nulls first
  if ((bs !== null) && (as === null)) { return -1; }
  if ((as !== null) && (bs === null)) { return  1; }

  //then raw NaNs
  if ((typeof as === "number") && isNaN(as)) { return -1; }
  if ((typeof bs === "number") && isNaN(bs)) { return  1; }

  //numbers and numbery strings group together
  const nas = +as;
  const nbs = +bs;
  if (nas < nbs) { return -1; }
  if (nas > nbs) { return  1; }

  //within that, true numbers before numbery strings
  if ((typeof as === "number") && (typeof bs !== "number")) { return -1; }
  if ((typeof bs === "number") && (typeof as !== "number")) { return  1; }
  if ((typeof as === "number") && (typeof bs === "number")) { return  0; }

  // 'Infinity' is a textual number, so less than 'A'
  if (isNaN(nbs) && !isNaN(nas)) { return -1; }
  if (isNaN(nas) && !isNaN(nbs)) { return  1; }

  //finally, "smart" string sorting per http://stackoverflow.com/a/4373421/112871
  let a = String(as);
  let b = String(bs);
  if (a === b) { return 0; }
  if (!rd.test(a) || !rd.test(b)) { return (a > b ? 1 : -1); }

  //special treatment for strings containing digits
  a = a.match(rx); //create digits vs non-digit chunks and iterate through
  b = b.match(rx);
  while (a.length && b.length) {
    const a1 = a.shift();
    const b1 = b.shift();
    if (a1 !== b1) {
      if (rd.test(a1) && rd.test(b1)) { //both are digit chunks
        return a1.replace(rz, ".0") - b1.replace(rz, ".0");
      } else {
        return (a1 > b1 ? 1 : -1);
      }
    }
  }
  return a.length - b.length;
};

const sortAs = function(order) {
  const mapping = {};
  const l_mapping = {}; // sort lowercased keys similarly
  for (let i in order) {
    const x = order[i];
    mapping[x] = i;
    if (typeof x === "string") { l_mapping[x.toLowerCase()] = i; }
  }
  return function(a, b) {
    if ((a in mapping) && (b in mapping)) { return mapping[a] - mapping[b];
    } else if (a in mapping) { return -1;
    } else if (b in mapping) { return 1;
    } else if ((a in l_mapping) && (b in l_mapping)) { return l_mapping[a] - l_mapping[b];
    } else if (a in l_mapping) { return -1;
    } else if (b in l_mapping) { return 1;
    } else { return naturalSort(a,b); }
  };
};

const getSort = function(sorters, attr) {
  if (sorters) {
    if (typeof sorters === "function") {
      const sort = sorters(attr);
      if (typeof sort === "function") { return sort; }
    } else if (attr in sorters) {
      return sorters[attr];
    }
  }
  return naturalSort;
};

/*
Data Model class
*/

class PivotData {
  constructor(opts = {}) {
    this.input = opts.data || [];
    this.aggregator = opts.aggregator || aggregatorTemplates.count()();
    this.aggregatorName = opts.aggregatorName || "Count";
    this.colAttrs = opts.cols || [];
    this.rowAttrs = opts.rows || [];
    this.valAttrs = opts.vals || [];
    this.sorters = opts.sorters || {};
    this.rowOrder = opts.rowOrder || "key_a_to_z";
    this.colOrder = opts.colOrder || "key_a_to_z";
    this.derivedAttributes = opts.derivedAttributes || {};
    this.filter = opts.filter || (() => true);
    this.tree = {};
    this.rowKeys = [];
    this.colKeys = [];
    this.rowTotals = {};
    this.colTotals = {};
    this.allTotal = this.aggregator(this, [], []);
    this.sorted = false;

    // iterate through input, accumulating data for cells
    PivotData.forEachRecord(this.input, this.derivedAttributes, record => {
      if (this.filter(record)) { return this.processRecord(record); }
    });
  }

  //can handle arrays or jQuery selections of tables
  static forEachRecord(input, derivedAttributes, f) {
    let addRecord, record;
    if (Object.getOwnPropertyNames(derivedAttributes).length  === 0) {
      addRecord = f;
    } else {
      addRecord = function(record) {
        for (let k in derivedAttributes) {
          let derived = derivedAttributes[k](record);
          if(derived !== null) {
            record[k] = derived;
          }
        }
        return f(record);
      };
    }

    //if it's a function, have it call us back
    if (typeof input  === "function") {
      return input(addRecord);
    } else if (Array.isArray(input)) {
      if (Array.isArray(input[0])) { //array of arrays
        return (() => {
          const result = [];
          for (let i of Object.keys(input || {})) {
            const compactRecord = input[i];
            if (i > 0) {
              record = {};
              for (let j of Object.keys(input[0] || {})) { const k = input[0][j]; record[k] = compactRecord[j]; }
              result.push(addRecord(record));
            }
          }
          return result;
        })();
      } else { //array of objects
        return (() => {
          const result1 = [];
          for (record of Array.from(input)) {               result1.push(addRecord(record));
          }
          return result1;
        })();
      }
    } else {
      throw new Error("unknown input format");
    }
  }

  forEachMatchingRecord(criteria, callback) {
    return PivotData.forEachRecord(this.input, this.derivedAttributes, record => {
      if (!this.filter(record)) { return; }
      for (let k in criteria) {
        const v = criteria[k];
        if (v !== (k in record ? record[k] : "null")) { return; }
      }
      return callback(record);
    });
  }

  arrSort(attrs) {
    let a;
    const sortersArr = ((() => {
      const result = [];
      for (a of Array.from(attrs)) {           result.push(getSort(this.sorters, a));
      }
      return result;
    })());
    return function(a,b) {
      for (let i of Object.keys(sortersArr || {})) {
        const sorter = sortersArr[i];
        const comparison = sorter(a[i], b[i]);
        if (comparison !== 0) { return comparison; }
      }
      return 0;
    };
  }

  sortKeys() {
    if (!this.sorted) {
      this.sorted = true;
      const v = (r,c) => this.getAggregator(r,c).value();
      switch (this.rowOrder) {
        case "value_a_to_z":  this.rowKeys.sort((a,b) =>  naturalSort(v(a,[]), v(b,[]))); break;
        case "value_z_to_a": this.rowKeys.sort((a,b) => -naturalSort(v(a,[]), v(b,[]))); break;
        default:       this.rowKeys.sort(this.arrSort(this.rowAttrs));
      }
      switch (this.colOrder) {
        case "value_a_to_z":  return this.colKeys.sort((a,b) =>  naturalSort(v([],a), v([],b)));
        case "value_z_to_a": return this.colKeys.sort((a,b) => -naturalSort(v([],a), v([],b)));
        default:       return this.colKeys.sort(this.arrSort(this.colAttrs));
      }
    }
  }

  getColKeys() {
    this.sortKeys();
    return this.colKeys;
  }

  getRowKeys() {
    this.sortKeys();
    return this.rowKeys;
  }

  processRecord(record) { //this code is called in a tight loop
    const colKey = [];
    const rowKey = [];
    for (let x of Array.from(this.colAttrs)) { colKey.push(x in record ? record[x] : "null"); }
    for (let x of Array.from(this.rowAttrs)) { rowKey.push(x in record ? record[x] : "null"); }
    const flatRowKey = rowKey.join(String.fromCharCode(0));
    const flatColKey = colKey.join(String.fromCharCode(0));

    this.allTotal.push(record);

    if (rowKey.length !== 0) {
      if (!this.rowTotals[flatRowKey]) {
        this.rowKeys.push(rowKey);
        this.rowTotals[flatRowKey] = this.aggregator(this, rowKey, []);
      }
      this.rowTotals[flatRowKey].push(record);
    }

    if (colKey.length !== 0) {
      if (!this.colTotals[flatColKey]) {
        this.colKeys.push(colKey);
        this.colTotals[flatColKey] = this.aggregator(this, [], colKey);
      }
      this.colTotals[flatColKey].push(record);
    }

    if ((colKey.length !== 0) && (rowKey.length !== 0)) {
      if (!this.tree[flatRowKey]) {
        this.tree[flatRowKey] = {};
      }
      if (!this.tree[flatRowKey][flatColKey]) {
        this.tree[flatRowKey][flatColKey] = this.aggregator(this, rowKey, colKey);
      }
      return this.tree[flatRowKey][flatColKey].push(record);
    }
  }

  getAggregator(rowKey, colKey) {
    let agg;
    const flatRowKey = rowKey.join(String.fromCharCode(0));
    const flatColKey = colKey.join(String.fromCharCode(0));
    if ((rowKey.length === 0) && (colKey.length === 0)) {
      agg = this.allTotal;
    } else if (rowKey.length === 0) {
      agg = this.colTotals[flatColKey];
    } else if (colKey.length === 0) {
      agg = this.rowTotals[flatRowKey];
    } else {
      agg = this.tree[flatRowKey][flatColKey];
    }
    return agg || {value() { return null; }, format() { return ""; }};
  }
}

//expose these to the outside world
export {aggregatorTemplates, aggregators, derivers, locales,
  naturalSort, numberFormat, sortAs, PivotData};
