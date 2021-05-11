'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PivotData = exports.sortAs = exports.getSort = exports.numberFormat = exports.naturalSort = exports.locales = exports.derivers = exports.aggregators = exports.aggregatorTemplates = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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

var addSeparators = function addSeparators(nStr, thousandsSep, decimalSep) {
  var x = String(nStr).split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? decimalSep + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + thousandsSep + '$2');
  }
  return x1 + x2;
};

var numberFormat = function numberFormat(opts_in) {
  var defaults = {
    digitsAfterDecimal: 2,
    scaler: 1,
    thousandsSep: ',',
    decimalSep: '.',
    prefix: '',
    suffix: ''
  };
  var opts = Object.assign({}, defaults, opts_in);
  return function (x) {
    if (isNaN(x) || !isFinite(x)) {
      return '';
    }
    var result = addSeparators((opts.scaler * x).toFixed(opts.digitsAfterDecimal), opts.thousandsSep, opts.decimalSep);
    return '' + opts.prefix + result + opts.suffix;
  };
};

var rx = /(\d+)|(\D+)/g;
var rd = /\d/;
var rz = /^0/;
var naturalSort = function naturalSort(as, bs) {
  // nulls first
  if (bs !== null && as === null) {
    return -1;
  }
  if (as !== null && bs === null) {
    return 1;
  }

  // then raw NaNs
  if (typeof as === 'number' && isNaN(as)) {
    return -1;
  }
  if (typeof bs === 'number' && isNaN(bs)) {
    return 1;
  }

  // numbers and numbery strings group together
  var nas = Number(as);
  var nbs = Number(bs);
  if (nas < nbs) {
    return -1;
  }
  if (nas > nbs) {
    return 1;
  }

  // within that, true numbers before numbery strings
  if (typeof as === 'number' && typeof bs !== 'number') {
    return -1;
  }
  if (typeof bs === 'number' && typeof as !== 'number') {
    return 1;
  }
  if (typeof as === 'number' && typeof bs === 'number') {
    return 0;
  }

  // 'Infinity' is a textual number, so less than 'A'
  if (isNaN(nbs) && !isNaN(nas)) {
    return -1;
  }
  if (isNaN(nas) && !isNaN(nbs)) {
    return 1;
  }

  // finally, "smart" string sorting per http://stackoverflow.com/a/4373421/112871
  var a = String(as);
  var b = String(bs);
  if (a === b) {
    return 0;
  }
  if (!rd.test(a) || !rd.test(b)) {
    return a > b ? 1 : -1;
  }

  // special treatment for strings containing digits
  a = a.match(rx);
  b = b.match(rx);
  while (a.length && b.length) {
    var a1 = a.shift();
    var b1 = b.shift();
    if (a1 !== b1) {
      if (rd.test(a1) && rd.test(b1)) {
        return a1.replace(rz, '.0') - b1.replace(rz, '.0');
      }
      return a1 > b1 ? 1 : -1;
    }
  }
  return a.length - b.length;
};

var sortAs = function sortAs(order) {
  var mapping = {};

  // sort lowercased keys similarly
  var l_mapping = {};
  for (var i in order) {
    var x = order[i];
    mapping[x] = i;
    if (typeof x === 'string') {
      l_mapping[x.toLowerCase()] = i;
    }
  }
  return function (a, b) {
    if (a in mapping && b in mapping) {
      return mapping[a] - mapping[b];
    } else if (a in mapping) {
      return -1;
    } else if (b in mapping) {
      return 1;
    } else if (a in l_mapping && b in l_mapping) {
      return l_mapping[a] - l_mapping[b];
    } else if (a in l_mapping) {
      return -1;
    } else if (b in l_mapping) {
      return 1;
    }
    return naturalSort(a, b);
  };
};

var getSort = function getSort(sorters, attr) {
  if (sorters) {
    if (typeof sorters === 'function') {
      var sort = sorters(attr);
      if (typeof sort === 'function') {
        return sort;
      }
    } else if (attr in sorters) {
      return sorters[attr];
    }
  }
  return naturalSort;
};

// aggregator templates default to US number formatting but this is overrideable
var usFmt = numberFormat();
var usFmtInt = numberFormat({ digitsAfterDecimal: 0 });
var usFmtPct = numberFormat({
  digitsAfterDecimal: 1,
  scaler: 100,
  suffix: '%'
});

var aggregatorTemplates = {
  count: function count() {
    var formatter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : usFmtInt;

    return function () {
      return function () {
        return {
          count: 0,
          push: function push() {
            this.count++;
          },
          value: function value() {
            return this.count;
          },

          format: formatter
        };
      };
    };
  },
  uniques: function uniques(fn) {
    var formatter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : usFmtInt;

    return function (_ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          attr = _ref2[0];

      return function () {
        return {
          uniq: [],
          push: function push(record) {
            if (!Array.from(this.uniq).includes(record[attr])) {
              this.uniq.push(record[attr]);
            }
          },
          value: function value() {
            return fn(this.uniq);
          },

          format: formatter,
          numInputs: typeof attr !== 'undefined' ? 0 : 1
        };
      };
    };
  },
  sum: function sum() {
    var formatter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : usFmt;

    return function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 1),
          attr = _ref4[0];

      return function () {
        return {
          sum: 0,
          push: function push(record) {
            if (!isNaN(parseFloat(record[attr]))) {
              this.sum += parseFloat(record[attr]);
            }
          },
          value: function value() {
            return this.sum;
          },

          format: formatter,
          numInputs: typeof attr !== 'undefined' ? 0 : 1
        };
      };
    };
  },
  extremes: function extremes(mode) {
    var formatter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : usFmt;

    return function (_ref5) {
      var _ref6 = _slicedToArray(_ref5, 1),
          attr = _ref6[0];

      return function (data) {
        return {
          val: null,
          sorter: getSort(typeof data !== 'undefined' ? data.sorters : null, attr),
          push: function push(record) {
            var x = record[attr];
            if (['min', 'max'].includes(mode)) {
              x = parseFloat(x);
              if (!isNaN(x)) {
                this.val = Math[mode](x, this.val !== null ? this.val : x);
              }
            }
            if (mode === 'first' && this.sorter(x, this.val !== null ? this.val : x) <= 0) {
              this.val = x;
            }
            if (mode === 'last' && this.sorter(x, this.val !== null ? this.val : x) >= 0) {
              this.val = x;
            }
          },
          value: function value() {
            return this.val;
          },
          format: function format(x) {
            if (isNaN(x)) {
              return x;
            }
            return formatter(x);
          },

          numInputs: typeof attr !== 'undefined' ? 0 : 1
        };
      };
    };
  },
  quantile: function quantile(q) {
    var formatter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : usFmt;

    return function (_ref7) {
      var _ref8 = _slicedToArray(_ref7, 1),
          attr = _ref8[0];

      return function () {
        return {
          vals: [],
          push: function push(record) {
            var x = parseFloat(record[attr]);
            if (!isNaN(x)) {
              this.vals.push(x);
            }
          },
          value: function value() {
            if (this.vals.length === 0) {
              return null;
            }
            this.vals.sort(function (a, b) {
              return a - b;
            });
            var i = (this.vals.length - 1) * q;
            return (this.vals[Math.floor(i)] + this.vals[Math.ceil(i)]) / 2.0;
          },

          format: formatter,
          numInputs: typeof attr !== 'undefined' ? 0 : 1
        };
      };
    };
  },
  runningStat: function runningStat() {
    var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'mean';
    var ddof = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    var formatter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : usFmt;

    return function (_ref9) {
      var _ref10 = _slicedToArray(_ref9, 1),
          attr = _ref10[0];

      return function () {
        return {
          n: 0.0,
          m: 0.0,
          s: 0.0,
          push: function push(record) {
            var x = parseFloat(record[attr]);
            if (isNaN(x)) {
              return;
            }
            this.n += 1.0;
            if (this.n === 1.0) {
              this.m = x;
            }
            var m_new = this.m + (x - this.m) / this.n;
            this.s = this.s + (x - this.m) * (x - m_new);
            this.m = m_new;
          },
          value: function value() {
            if (mode === 'mean') {
              if (this.n === 0) {
                return 0 / 0;
              }
              return this.m;
            }
            if (this.n <= ddof) {
              return 0;
            }
            switch (mode) {
              case 'var':
                return this.s / (this.n - ddof);
              case 'stdev':
                return Math.sqrt(this.s / (this.n - ddof));
              default:
                throw new Error('unknown mode for runningStat');
            }
          },

          format: formatter,
          numInputs: typeof attr !== 'undefined' ? 0 : 1
        };
      };
    };
  },
  sumOverSum: function sumOverSum() {
    var formatter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : usFmt;

    return function (_ref11) {
      var _ref12 = _slicedToArray(_ref11, 2),
          num = _ref12[0],
          denom = _ref12[1];

      return function () {
        return {
          sumNum: 0,
          sumDenom: 0,
          push: function push(record) {
            if (!isNaN(parseFloat(record[num]))) {
              this.sumNum += parseFloat(record[num]);
            }
            if (!isNaN(parseFloat(record[denom]))) {
              this.sumDenom += parseFloat(record[denom]);
            }
          },
          value: function value() {
            return this.sumNum / this.sumDenom;
          },

          format: formatter,
          numInputs: typeof num !== 'undefined' && typeof denom !== 'undefined' ? 0 : 2
        };
      };
    };
  },
  fractionOf: function fractionOf(wrapped) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'total';
    var formatter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : usFmtPct;

    return function () {
      for (var _len = arguments.length, x = Array(_len), _key = 0; _key < _len; _key++) {
        x[_key] = arguments[_key];
      }

      return function (data, rowKey, colKey) {
        return {
          selector: { total: [[], []], row: [rowKey, []], col: [[], colKey] }[type],
          inner: wrapped.apply(undefined, _toConsumableArray(Array.from(x || [])))(data, rowKey, colKey),
          push: function push(record) {
            this.inner.push(record);
          },

          format: formatter,
          value: function value() {
            return this.inner.value() / data.getAggregator.apply(data, _toConsumableArray(Array.from(this.selector || []))).inner.value();
          },

          numInputs: wrapped.apply(undefined, _toConsumableArray(Array.from(x || [])))().numInputs
        };
      };
    };
  }
};

aggregatorTemplates.countUnique = function (f) {
  return aggregatorTemplates.uniques(function (x) {
    return x.length;
  }, f);
};
aggregatorTemplates.listUnique = function (s) {
  return aggregatorTemplates.uniques(function (x) {
    return x.join(s);
  }, function (x) {
    return x;
  });
};
aggregatorTemplates.max = function (f) {
  return aggregatorTemplates.extremes('max', f);
};
aggregatorTemplates.min = function (f) {
  return aggregatorTemplates.extremes('min', f);
};
aggregatorTemplates.first = function (f) {
  return aggregatorTemplates.extremes('first', f);
};
aggregatorTemplates.last = function (f) {
  return aggregatorTemplates.extremes('last', f);
};
aggregatorTemplates.median = function (f) {
  return aggregatorTemplates.quantile(0.5, f);
};
aggregatorTemplates.average = function (f) {
  return aggregatorTemplates.runningStat('mean', 1, f);
};
aggregatorTemplates.var = function (ddof, f) {
  return aggregatorTemplates.runningStat('var', ddof, f);
};
aggregatorTemplates.stdev = function (ddof, f) {
  return aggregatorTemplates.runningStat('stdev', ddof, f);
};

// default aggregators & renderers use US naming and number formatting
var aggregators = function (tpl) {
  return {
    Count: tpl.count(usFmtInt),
    'Count Unique Values': tpl.countUnique(usFmtInt),
    'List Unique Values': tpl.listUnique(', '),
    Sum: tpl.sum(usFmt),
    'Integer Sum': tpl.sum(usFmtInt),
    Average: tpl.average(usFmt),
    Median: tpl.median(usFmt),
    'Sample Variance': tpl.var(1, usFmt),
    'Sample Standard Deviation': tpl.stdev(1, usFmt),
    Minimum: tpl.min(usFmt),
    Maximum: tpl.max(usFmt),
    First: tpl.first(usFmt),
    Last: tpl.last(usFmt),
    'Sum over Sum': tpl.sumOverSum(usFmt),
    'Sum as Fraction of Total': tpl.fractionOf(tpl.sum(), 'total', usFmtPct),
    'Sum as Fraction of Rows': tpl.fractionOf(tpl.sum(), 'row', usFmtPct),
    'Sum as Fraction of Columns': tpl.fractionOf(tpl.sum(), 'col', usFmtPct),
    'Count as Fraction of Total': tpl.fractionOf(tpl.count(), 'total', usFmtPct),
    'Count as Fraction of Rows': tpl.fractionOf(tpl.count(), 'row', usFmtPct),
    'Count as Fraction of Columns': tpl.fractionOf(tpl.count(), 'col', usFmtPct)
  };
}(aggregatorTemplates);

var locales = {
  en: {
    aggregators: aggregators,
    localeStrings: {
      renderError: 'An error occurred rendering the PivotTable results.',
      computeError: 'An error occurred computing the PivotTable results.',
      uiRenderError: 'An error occurred rendering the PivotTable UI.',
      selectAll: 'Select All',
      selectNone: 'Select None',
      tooMany: '(too many to list)',
      filterResults: 'Filter values',
      apply: 'Apply',
      cancel: 'Cancel',
      totals: 'Totals',
      vs: 'vs',
      by: 'by'
    }
  }
};

// dateFormat deriver l10n requires month and day names to be passed in directly
var mthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var zeroPad = function zeroPad(number) {
  return ('0' + number).substr(-2, 2);
}; // eslint-disable-line no-magic-numbers

var derivers = {
  bin: function bin(col, binWidth) {
    return function (record) {
      return record[col] - record[col] % binWidth;
    };
  },
  dateFormat: function dateFormat(col, formatString) {
    var utcOutput = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var mthNames = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : mthNamesEn;
    var dayNames = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : dayNamesEn;

    var utc = utcOutput ? 'UTC' : '';
    return function (record) {
      var date = new Date(Date.parse(record[col]));
      if (isNaN(date)) {
        return '';
      }
      return formatString.replace(/%(.)/g, function (m, p) {
        switch (p) {
          case 'y':
            return date['get' + utc + 'FullYear']();
          case 'm':
            return zeroPad(date['get' + utc + 'Month']() + 1);
          case 'n':
            return mthNames[date['get' + utc + 'Month']()];
          case 'd':
            return zeroPad(date['get' + utc + 'Date']());
          case 'w':
            return dayNames[date['get' + utc + 'Day']()];
          case 'x':
            return date['get' + utc + 'Day']();
          case 'H':
            return zeroPad(date['get' + utc + 'Hours']());
          case 'M':
            return zeroPad(date['get' + utc + 'Minutes']());
          case 'S':
            return zeroPad(date['get' + utc + 'Seconds']());
          default:
            return '%' + p;
        }
      });
    };
  }
};

/*
Data Model class
*/

var PivotData = function () {
  function PivotData() {
    var _this = this;

    var inputProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PivotData);

    this.props = Object.assign({}, PivotData.defaultProps, inputProps);
    _propTypes2.default.checkPropTypes(PivotData.propTypes, this.props, 'prop', 'PivotData');

    this.aggregator = this.props.aggregators[this.props.aggregatorName](this.props.vals);
    this.tree = {};
    this.rowKeys = [];
    this.colKeys = [];
    this.rowTotals = {};
    this.colTotals = {};
    this.allTotal = this.aggregator(this, [], []);
    this.sorted = false;

    // iterate through input, accumulating data for cells
    PivotData.forEachRecord(this.props.data, this.props.derivedAttributes, function (record) {
      if (_this.filter(record)) {
        _this.processRecord(record);
      }
    });
  }

  _createClass(PivotData, [{
    key: 'filter',
    value: function filter(record) {
      for (var k in this.props.valueFilter) {
        if (record[k] in this.props.valueFilter[k]) {
          return false;
        }
      }
      return true;
    }
  }, {
    key: 'forEachMatchingRecord',
    value: function forEachMatchingRecord(criteria, callback) {
      var _this2 = this;

      return PivotData.forEachRecord(this.props.data, this.props.derivedAttributes, function (record) {
        if (!_this2.filter(record)) {
          return;
        }
        for (var k in criteria) {
          var v = criteria[k];
          if (v !== (k in record ? record[k] : 'null')) {
            return;
          }
        }
        callback(record);
      });
    }
  }, {
    key: 'arrSort',
    value: function arrSort(attrs) {
      var _this3 = this;

      var a = void 0;
      var sortersArr = function () {
        var result = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Array.from(attrs)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            a = _step.value;

            result.push(getSort(_this3.props.sorters, a));
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        return result;
      }();
      return function (a, b) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Object.keys(sortersArr || {})[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var i = _step2.value;

            var sorter = sortersArr[i];
            var comparison = sorter(a[i], b[i]);
            if (comparison !== 0) {
              return comparison;
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        return 0;
      };
    }
  }, {
    key: 'sortKeys',
    value: function sortKeys() {
      var _this4 = this;

      if (!this.sorted) {
        this.sorted = true;
        var v = function v(r, c) {
          return _this4.getAggregator(r, c).value();
        };
        switch (this.props.rowOrder) {
          case 'value_a_to_z':
            this.rowKeys.sort(function (a, b) {
              return naturalSort(v(a, []), v(b, []));
            });
            break;
          case 'value_z_to_a':
            this.rowKeys.sort(function (a, b) {
              return -naturalSort(v(a, []), v(b, []));
            });
            break;
          default:
            this.rowKeys.sort(this.arrSort(this.props.rows));
        }
        switch (this.props.colOrder) {
          case 'value_a_to_z':
            this.colKeys.sort(function (a, b) {
              return naturalSort(v([], a), v([], b));
            });
            break;
          case 'value_z_to_a':
            this.colKeys.sort(function (a, b) {
              return -naturalSort(v([], a), v([], b));
            });
            break;
          default:
            this.colKeys.sort(this.arrSort(this.props.cols));
        }
      }
    }
  }, {
    key: 'getColKeys',
    value: function getColKeys() {
      this.sortKeys();
      return this.colKeys;
    }
  }, {
    key: 'getRowKeys',
    value: function getRowKeys() {
      this.sortKeys();
      return this.rowKeys;
    }
  }, {
    key: 'processRecord',
    value: function processRecord(record) {
      // this code is called in a tight loop
      var colKey = [];
      var rowKey = [];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = Array.from(this.props.cols)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var x = _step3.value;

          colKey.push(x in record ? record[x] : 'null');
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = Array.from(this.props.rows)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _x16 = _step4.value;

          rowKey.push(_x16 in record ? record[_x16] : 'null');
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var flatRowKey = rowKey.join(String.fromCharCode(0));
      var flatColKey = colKey.join(String.fromCharCode(0));

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

      if (colKey.length !== 0 && rowKey.length !== 0) {
        if (!this.tree[flatRowKey]) {
          this.tree[flatRowKey] = {};
        }
        if (!this.tree[flatRowKey][flatColKey]) {
          this.tree[flatRowKey][flatColKey] = this.aggregator(this, rowKey, colKey);
        }
        this.tree[flatRowKey][flatColKey].push(record);
      }
    }
  }, {
    key: 'getAggregator',
    value: function getAggregator(rowKey, colKey) {
      var agg = void 0;
      var flatRowKey = rowKey.join(String.fromCharCode(0));
      var flatColKey = colKey.join(String.fromCharCode(0));
      if (rowKey.length === 0 && colKey.length === 0) {
        agg = this.allTotal;
      } else if (rowKey.length === 0) {
        agg = this.colTotals[flatColKey];
      } else if (colKey.length === 0) {
        agg = this.rowTotals[flatRowKey];
      } else {
        agg = this.tree[flatRowKey][flatColKey];
      }
      return agg || {
        value: function value() {
          return null;
        },
        format: function format() {
          return '';
        }
      };
    }
  }]);

  return PivotData;
}();

// can handle arrays or jQuery selections of tables


PivotData.forEachRecord = function (input, derivedAttributes, f) {
  var addRecord = void 0,
      record = void 0;
  if (Object.getOwnPropertyNames(derivedAttributes).length === 0) {
    addRecord = f;
  } else {
    addRecord = function addRecord(record) {
      for (var k in derivedAttributes) {
        var derived = derivedAttributes[k](record);
        if (derived !== null) {
          record[k] = derived;
        }
      }
      return f(record);
    };
  }

  // if it's a function, have it call us back
  if (typeof input === 'function') {
    return input(addRecord);
  } else if (Array.isArray(input)) {
    if (Array.isArray(input[0])) {
      // array of arrays
      return function () {
        var result = [];
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = Object.keys(input || {})[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var i = _step5.value;

            var compactRecord = input[i];
            if (i > 0) {
              record = {};
              var _iteratorNormalCompletion6 = true;
              var _didIteratorError6 = false;
              var _iteratorError6 = undefined;

              try {
                for (var _iterator6 = Object.keys(input[0] || {})[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                  var j = _step6.value;

                  var k = input[0][j];
                  record[k] = compactRecord[j];
                }
              } catch (err) {
                _didIteratorError6 = true;
                _iteratorError6 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion6 && _iterator6.return) {
                    _iterator6.return();
                  }
                } finally {
                  if (_didIteratorError6) {
                    throw _iteratorError6;
                  }
                }
              }

              result.push(addRecord(record));
            }
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        return result;
      }();
    }

    // array of objects
    return function () {
      var result1 = [];
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = Array.from(input)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          record = _step7.value;

          result1.push(addRecord(record));
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7.return) {
            _iterator7.return();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }

      return result1;
    }();
  }
  throw new Error('unknown input format');
};

PivotData.defaultProps = {
  aggregators: aggregators,
  cols: [],
  rows: [],
  vals: [],
  aggregatorName: 'Count',
  sorters: {},
  valueFilter: {},
  rowOrder: 'key_a_to_z',
  colOrder: 'key_a_to_z',
  derivedAttributes: {}
};

PivotData.propTypes = {
  data: _propTypes2.default.oneOfType([_propTypes2.default.array, _propTypes2.default.object, _propTypes2.default.func]).isRequired,
  aggregatorName: _propTypes2.default.string,
  cols: _propTypes2.default.arrayOf(_propTypes2.default.string),
  rows: _propTypes2.default.arrayOf(_propTypes2.default.string),
  vals: _propTypes2.default.arrayOf(_propTypes2.default.string),
  valueFilter: _propTypes2.default.objectOf(_propTypes2.default.objectOf(_propTypes2.default.bool)),
  sorters: _propTypes2.default.oneOfType([_propTypes2.default.func, _propTypes2.default.objectOf(_propTypes2.default.func)]),
  derivedAttributes: _propTypes2.default.objectOf(_propTypes2.default.func),
  rowOrder: _propTypes2.default.oneOf(['key_a_to_z', 'value_a_to_z', 'value_z_to_a']),
  colOrder: _propTypes2.default.oneOf(['key_a_to_z', 'value_a_to_z', 'value_z_to_a'])
};

exports.aggregatorTemplates = aggregatorTemplates;
exports.aggregators = aggregators;
exports.derivers = derivers;
exports.locales = locales;
exports.naturalSort = naturalSort;
exports.numberFormat = numberFormat;
exports.getSort = getSort;
exports.sortAs = sortAs;
exports.PivotData = PivotData;
//# sourceMappingURL=Utilities.js.map