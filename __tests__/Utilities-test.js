'use strict';

var _Utilities = require('../Utilities');

var utils = _interopRequireWildcard(_Utilities);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/* eslint-disable no-magic-numbers */

/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
var fixtureData = [['name', 'gender', 'colour', 'birthday', 'trials', 'successes'], ['Nick', 'male', 'blue', '1982-11-07', 103, 12], ['Jane', 'female', 'red', '1982-11-08', 95, 25], ['John', 'male', 'blue', '1982-12-08', 112, 30], ['Carol', 'female', 'yellow', '1983-12-08', 102, 14]];

describe('  utils', function () {
  describe('.PivotData()', function () {
    describe('with no options', function () {
      var aoaInput = [['a', 'b'], [1, 2], [3, 4]];
      var pd = new utils.PivotData({ data: aoaInput });

      it('has the correct grand total value', function () {
        return expect(pd.getAggregator([], []).value()).toBe(2);
      });
    });

    describe('with array-of-array input', function () {
      var aoaInput = [['a', 'b'], [1, 2], [3, 4]];
      var pd = new utils.PivotData({
        data: aoaInput,
        aggregatorName: 'Sum over Sum',
        vals: ['a', 'b']
      });

      it('has the correct grand total value', function () {
        return expect(pd.getAggregator([], []).value()).toBe((1 + 3) / (2 + 4));
      });
    });

    describe('with array-of-object input', function () {
      var aosInput = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
      var pd = new utils.PivotData({
        data: aosInput,
        aggregatorName: 'Sum over Sum',
        vals: ['a', 'b']
      });

      it('has the correct grand total value', function () {
        return expect(pd.getAggregator([], []).value()).toBe((1 + 3) / (2 + 4));
      });
    });

    describe('with ragged array-of-object input', function () {
      var raggedAosInput = [{ a: 1 }, { b: 4 }, { a: 3, b: 2 }];
      var pd = new utils.PivotData({
        data: raggedAosInput,
        aggregatorName: 'Sum over Sum',
        vals: ['a', 'b']
      });

      it('has the correct grand total value', function () {
        return expect(pd.getAggregator([], []).value()).toBe((1 + 3) / (2 + 4));
      });
    });

    describe('with function input', function () {
      var functionInput = function functionInput(record) {
        record({ a: 1, b: 2 });
        record({ a: 3, b: 4 });
      };
      var pd = new utils.PivotData({
        data: functionInput,
        aggregatorName: 'Sum over Sum',
        vals: ['a', 'b']
      });

      it('has the correct grand total value', function () {
        return expect(pd.getAggregator([], []).value()).toBe((1 + 3) / (2 + 4));
      });
    });

    describe('with rows/cols', function () {
      var pd = new utils.PivotData({
        data: fixtureData,
        rows: ['name', 'colour'],
        cols: ['trials', 'successes']
      });

      it('has correctly-ordered row keys', function () {
        return expect(pd.getRowKeys()).toEqual([['Carol', 'yellow'], ['Jane', 'red'], ['John', 'blue'], ['Nick', 'blue']]);
      });

      it('has correctly-ordered col keys', function () {
        return expect(pd.getColKeys()).toEqual([[95, 25], [102, 14], [103, 12], [112, 30]]);
      });

      it('can be iterated over', function () {
        var numNotNull = 0;
        var numNull = 0;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Array.from(pd.getRowKeys())[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var r = _step.value;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = Array.from(pd.getColKeys())[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var c = _step2.value;

                if (pd.getAggregator(r, c).value() !== null) {
                  numNotNull++;
                } else {
                  numNull++;
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

        expect(numNotNull).toBe(4);
        expect(numNull).toBe(12);
      });

      it('returns matching records', function () {
        var records = [];
        pd.forEachMatchingRecord({ gender: 'male' }, function (x) {
          return records.push(x.name);
        });
        expect(records).toEqual(['Nick', 'John']);
      });

      it('has a correct spot-checked aggregator', function () {
        var agg = pd.getAggregator(['Carol', 'yellow'], [102, 14]);
        var val = agg.value();
        expect(val).toBe(1);
        expect(agg.format(val)).toBe('1');
      });

      it('has a correct grand total aggregator', function () {
        var agg = pd.getAggregator([], []);
        var val = agg.value();
        expect(val).toBe(4);
        expect(agg.format(val)).toBe('4');
      });
    });
  });

  describe('.aggregatorTemplates', function () {
    var getVal = function getVal(agg, vals) {
      return new utils.PivotData({
        data: fixtureData,
        aggregators: { agg: agg },
        aggregatorName: 'agg',
        vals: vals
      }).getAggregator([], []).value();
    };
    var tpl = utils.aggregatorTemplates;

    describe('.count', function () {
      return it('works', function () {
        return expect(getVal(tpl.count(), [])).toBe(4);
      });
    });

    describe('.countUnique', function () {
      return it('works', function () {
        return expect(getVal(tpl.countUnique(), ['gender'])).toBe(2);
      });
    });

    describe('.listUnique', function () {
      return it('works', function () {
        return expect(getVal(tpl.listUnique(), ['gender'])).toBe('male,female');
      });
    });

    describe('.average', function () {
      return it('works', function () {
        return expect(getVal(tpl.average(), ['trials'])).toBe(103);
      });
    });

    describe('.sum', function () {
      return it('works', function () {
        return expect(getVal(tpl.sum(), ['trials'])).toBe(412);
      });
    });

    describe('.min', function () {
      return it('works', function () {
        return expect(getVal(tpl.min(), ['trials'])).toBe(95);
      });
    });

    describe('.max', function () {
      return it('works', function () {
        return expect(getVal(tpl.max(), ['trials'])).toBe(112);
      });
    });

    describe('.first', function () {
      return it('works', function () {
        return expect(getVal(tpl.first(), ['name'])).toBe('Carol');
      });
    });

    describe('.last', function () {
      return it('works', function () {
        return expect(getVal(tpl.last(), ['name'])).toBe('Nick');
      });
    });

    describe('.average', function () {
      return it('works', function () {
        return expect(getVal(tpl.average(), ['trials'])).toBe(103);
      });
    });

    describe('.median', function () {
      return it('works', function () {
        return expect(getVal(tpl.median(), ['trials'])).toBe(102.5);
      });
    });

    describe('.quantile', function () {
      return it('works', function () {
        expect(getVal(tpl.quantile(0), ['trials'])).toBe(95);
        expect(getVal(tpl.quantile(0.1), ['trials'])).toBe(98.5);
        expect(getVal(tpl.quantile(0.25), ['trials'])).toBe(98.5);
        expect(getVal(tpl.quantile(1 / 3), ['trials'])).toBe(102);
        expect(getVal(tpl.quantile(1), ['trials'])).toBe(112);
      });
    });

    describe('.var', function () {
      return it('works', function () {
        return expect(getVal(tpl.var(), ['trials'])).toBe(48.666666666666686);
      });
    });

    describe('.stdev', function () {
      return it('works', function () {
        return expect(getVal(tpl.stdev(), ['trials'])).toBe(6.976149845485451);
      });
    });

    describe('.sumOverSum', function () {
      return it('works', function () {
        return expect(getVal(tpl.sumOverSum(), ['successes', 'trials'])).toBe((12 + 25 + 30 + 14) / (95 + 102 + 103 + 112));
      });
    });

    describe('.fractionOf', function () {
      return it('works', function () {
        return expect(getVal(tpl.fractionOf(tpl.sum()), ['trials'])).toBe(1);
      });
    });
  });

  describe('.naturalSort()', function () {
    var naturalSort = utils.naturalSort;


    var sortedArr = [null, NaN, -Infinity, '-Infinity', -3, '-3', -2, '-2', -1, '-1', 0, '2e-1', 1, '01', '1', 2, '002', '002e0', '02', '2', '2e-0', 3, 10, '10', '11', '12', '1e2', '112', Infinity, 'Infinity', '1a', '2a', '12a', '20a', 'A', 'A', 'NaN', 'a', 'a', 'a01', 'a012', 'a02', 'a1', 'a2', 'a12', 'a12', 'a21', 'a21', 'b', 'c', 'd', 'null'];

    it('sorts naturally (null, NaN, numbers & numbery strings, Alphanum for text strings)', function () {
      return expect(sortedArr.slice().sort(naturalSort)).toEqual(sortedArr);
    });
  });

  describe('.sortAs()', function () {
    var sortAs = utils.sortAs;


    it('sorts with unknown values sorted at the end', function () {
      return expect([5, 2, 3, 4, 1].sort(sortAs([4, 3, 2]))).toEqual([4, 3, 2, 1, 5]);
    });

    it('sorts lowercase after uppercase', function () {
      return expect(['Ab', 'aA', 'aa', 'ab'].sort(sortAs(['Ab', 'Aa']))).toEqual(['Ab', 'ab', 'aa', 'aA']);
    });
  });

  describe('.numberFormat()', function () {
    var numberFormat = utils.numberFormat;


    it('formats numbers', function () {
      var nf = numberFormat();
      expect(nf(1234567.89123456)).toEqual('1,234,567.89');
    });

    it('formats booleans', function () {
      var nf = numberFormat();
      expect(nf(true)).toEqual('1.00');
    });

    it('formats numbers in strings', function () {
      var nf = numberFormat();
      expect(nf('1234567.89123456')).toEqual('1,234,567.89');
    });

    it("doesn't formats strings", function () {
      var nf = numberFormat();
      expect(nf('hi there')).toEqual('');
    });

    it("doesn't formats objects", function () {
      var nf = numberFormat();
      expect(nf({ a: 1 })).toEqual('');
    });

    it('formats percentages', function () {
      var nf = numberFormat({ scaler: 100, suffix: '%' });
      expect(nf(0.12345)).toEqual('12.35%');
    });

    it('adds separators', function () {
      var nf = numberFormat({ thousandsSep: 'a', decimalSep: 'b' });
      expect(nf(1234567.89123456)).toEqual('1a234a567b89');
    });

    it('adds prefixes and suffixes', function () {
      var nf = numberFormat({ prefix: 'a', suffix: 'b' });
      expect(nf(1234567.89123456)).toEqual('a1,234,567.89b');
    });

    it('scales and rounds', function () {
      var nf = numberFormat({ digitsAfterDecimal: 3, scaler: 1000 });
      expect(nf(1234567.89123456)).toEqual('1,234,567,891.235');
    });
  });

  describe('.derivers', function () {
    describe('.dateFormat()', function () {
      var df = utils.derivers.dateFormat('x', 'abc % %% %%% %a %y %m %n %d %w %x %H %M %S', true);

      it('formats date objects', function () {
        return expect(df({ x: new Date('2015-01-02T23:43:11Z') })).toBe('abc % %% %%% %a 2015 01 Jan 02 Fri 5 23 43 11');
      });

      it('formats input parsed by Date.parse()', function () {
        expect(df({ x: '2015-01-02T23:43:11Z' })).toBe('abc % %% %%% %a 2015 01 Jan 02 Fri 5 23 43 11');

        expect(df({ x: 'bla' })).toBe('');
      });
    });

    describe('.bin()', function () {
      var binner = utils.derivers.bin('x', 10);

      it('bins numbers', function () {
        expect(binner({ x: 11 })).toBe(10);

        expect(binner({ x: 9 })).toBe(0);

        expect(binner({ x: 111 })).toBe(110);
      });

      it('bins booleans', function () {
        return expect(binner({ x: true })).toBe(0);
      });

      it('bins negative numbers', function () {
        return expect(binner({ x: -12 })).toBe(-10);
      });

      it("doesn't bin strings", function () {
        return expect(binner({ x: 'a' })).toBeNaN();
      });

      it("doesn't bin objects", function () {
        return expect(binner({ x: { a: 1 } })).toBeNaN();
      });
    });
  });
});
//# sourceMappingURL=Utilities-test.js.map