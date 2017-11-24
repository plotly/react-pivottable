import * as utils from '../Utilities';
/* eslint-disable no-magic-numbers */

/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fixtureData = [
  ['name', 'gender', 'colour', 'birthday', 'trials', 'successes'],
  ['Nick', 'male', 'blue', '1982-11-07', 103, 12],
  ['Jane', 'female', 'red', '1982-11-08', 95, 25],
  ['John', 'male', 'blue', '1982-12-08', 112, 30],
  ['Carol', 'female', 'yellow', '1983-12-08', 102, 14],
];

describe('  utils', function() {
  describe('.PivotData()', function() {
    describe('with no options', function() {
      const aoaInput = [['a', 'b'], [1, 2], [3, 4]];
      const pd = new utils.PivotData({data: aoaInput});

      it('has the correct grand total value', () =>
        expect(pd.getAggregator([], []).value()).toBe(2));
    });

    describe('with array-of-array input', function() {
      const aoaInput = [['a', 'b'], [1, 2], [3, 4]];
      const pd = new utils.PivotData({
        data: aoaInput,
        aggregatorName: 'Sum over Sum',
        vals: ['a', 'b'],
      });

      it('has the correct grand total value', () =>
        expect(pd.getAggregator([], []).value()).toBe((1 + 3) / (2 + 4)));
    });

    describe('with array-of-object input', function() {
      const aosInput = [{a: 1, b: 2}, {a: 3, b: 4}];
      const pd = new utils.PivotData({
        data: aosInput,
        aggregatorName: 'Sum over Sum',
        vals: ['a', 'b'],
      });

      it('has the correct grand total value', () =>
        expect(pd.getAggregator([], []).value()).toBe((1 + 3) / (2 + 4)));
    });

    describe('with ragged array-of-object input', function() {
      const raggedAosInput = [{a: 1}, {b: 4}, {a: 3, b: 2}];
      const pd = new utils.PivotData({
        data: raggedAosInput,
        aggregatorName: 'Sum over Sum',
        vals: ['a', 'b'],
      });

      it('has the correct grand total value', () =>
        expect(pd.getAggregator([], []).value()).toBe((1 + 3) / (2 + 4)));
    });

    describe('with function input', function() {
      const functionInput = function(record) {
        record({a: 1, b: 2});
        record({a: 3, b: 4});
      };
      const pd = new utils.PivotData({
        data: functionInput,
        aggregatorName: 'Sum over Sum',
        vals: ['a', 'b'],
      });

      it('has the correct grand total value', () =>
        expect(pd.getAggregator([], []).value()).toBe((1 + 3) / (2 + 4)));
    });

    describe('with rows/cols', function() {
      const pd = new utils.PivotData({
        data: fixtureData,
        rows: ['name', 'colour'],
        cols: ['trials', 'successes'],
      });

      it('has correctly-ordered row keys', () =>
        expect(pd.getRowKeys()).toEqual([
          ['Carol', 'yellow'],
          ['Jane', 'red'],
          ['John', 'blue'],
          ['Nick', 'blue'],
        ]));

      it('has correctly-ordered col keys', () =>
        expect(pd.getColKeys()).toEqual([
          [95, 25],
          [102, 14],
          [103, 12],
          [112, 30],
        ]));

      it('can be iterated over', function() {
        let numNotNull = 0;
        let numNull = 0;
        for (const r of Array.from(pd.getRowKeys())) {
          for (const c of Array.from(pd.getColKeys())) {
            if (pd.getAggregator(r, c).value() !== null) {
              numNotNull++;
            } else {
              numNull++;
            }
          }
        }
        expect(numNotNull).toBe(4);
        expect(numNull).toBe(12);
      });

      it('returns matching records', function() {
        const records = [];
        pd.forEachMatchingRecord({gender: 'male'}, x => records.push(x.name));
        expect(records).toEqual(['Nick', 'John']);
      });

      it('has a correct spot-checked aggregator', function() {
        const agg = pd.getAggregator(['Carol', 'yellow'], [102, 14]);
        const val = agg.value();
        expect(val).toBe(1);
        expect(agg.format(val)).toBe('1');
      });

      it('has a correct grand total aggregator', function() {
        const agg = pd.getAggregator([], []);
        const val = agg.value();
        expect(val).toBe(4);
        expect(agg.format(val)).toBe('4');
      });
    });
  });

  describe('.aggregatorTemplates', function() {
    const getVal = (agg, vals) => {
      return new utils.PivotData({
        data: fixtureData,
        aggregators: {agg},
        aggregatorName: 'agg',
        vals,
      })
        .getAggregator([], [])
        .value();
    };
    const tpl = utils.aggregatorTemplates;

    describe('.count', () =>
      it('works', () => expect(getVal(tpl.count(), [])).toBe(4)));

    describe('.countUnique', () =>
      it('works', () => expect(getVal(tpl.countUnique(), ['gender'])).toBe(2)));

    describe('.listUnique', () =>
      it('works', () =>
        expect(getVal(tpl.listUnique(), ['gender'])).toBe('male,female')));

    describe('.average', () =>
      it('works', () => expect(getVal(tpl.average(), ['trials'])).toBe(103)));

    describe('.sum', () =>
      it('works', () => expect(getVal(tpl.sum(), ['trials'])).toBe(412)));

    describe('.min', () =>
      it('works', () => expect(getVal(tpl.min(), ['trials'])).toBe(95)));

    describe('.max', () =>
      it('works', () => expect(getVal(tpl.max(), ['trials'])).toBe(112)));

    describe('.first', () =>
      it('works', () => expect(getVal(tpl.first(), ['name'])).toBe('Carol')));

    describe('.last', () =>
      it('works', () => expect(getVal(tpl.last(), ['name'])).toBe('Nick')));

    describe('.average', () =>
      it('works', () => expect(getVal(tpl.average(), ['trials'])).toBe(103)));

    describe('.median', () =>
      it('works', () => expect(getVal(tpl.median(), ['trials'])).toBe(102.5)));

    describe('.quantile', () =>
      it('works', function() {
        expect(getVal(tpl.quantile(0), ['trials'])).toBe(95);
        expect(getVal(tpl.quantile(0.1), ['trials'])).toBe(98.5);
        expect(getVal(tpl.quantile(0.25), ['trials'])).toBe(98.5);
        expect(getVal(tpl.quantile(1 / 3), ['trials'])).toBe(102);
        expect(getVal(tpl.quantile(1), ['trials'])).toBe(112);
      }));

    describe('.var', () =>
      it('works', () =>
        expect(getVal(tpl.var(), ['trials'])).toBe(48.666666666666686)));

    describe('.stdev', () =>
      it('works', () =>
        expect(getVal(tpl.stdev(), ['trials'])).toBe(6.976149845485451)));

    describe('.sumOverSum', () =>
      it('works', () =>
        expect(getVal(tpl.sumOverSum(), ['successes', 'trials'])).toBe(
          (12 + 25 + 30 + 14) / (95 + 102 + 103 + 112)
        )));

    describe('.fractionOf', () =>
      it('works', () =>
        expect(getVal(tpl.fractionOf(tpl.sum()), ['trials'])).toBe(1)));
  });

  describe('.naturalSort()', function() {
    const {naturalSort} = utils;

    const sortedArr = [
      null,
      NaN,
      -Infinity,
      '-Infinity',
      -3,
      '-3',
      -2,
      '-2',
      -1,
      '-1',
      0,
      '2e-1',
      1,
      '01',
      '1',
      2,
      '002',
      '002e0',
      '02',
      '2',
      '2e-0',
      3,
      10,
      '10',
      '11',
      '12',
      '1e2',
      '112',
      Infinity,
      'Infinity',
      '1a',
      '2a',
      '12a',
      '20a',
      'A',
      'A',
      'NaN',
      'a',
      'a',
      'a01',
      'a012',
      'a02',
      'a1',
      'a2',
      'a12',
      'a12',
      'a21',
      'a21',
      'b',
      'c',
      'd',
      'null',
    ];

    it('sorts naturally (null, NaN, numbers & numbery strings, Alphanum for text strings)', () =>
      expect(sortedArr.slice().sort(naturalSort)).toEqual(sortedArr));
  });

  describe('.sortAs()', function() {
    const {sortAs} = utils;

    it('sorts with unknown values sorted at the end', () =>
      expect([5, 2, 3, 4, 1].sort(sortAs([4, 3, 2]))).toEqual([4, 3, 2, 1, 5]));

    it('sorts lowercase after uppercase', () =>
      expect(['Ab', 'aA', 'aa', 'ab'].sort(sortAs(['Ab', 'Aa']))).toEqual([
        'Ab',
        'ab',
        'aa',
        'aA',
      ]));
  });

  describe('.numberFormat()', function() {
    const {numberFormat} = utils;

    it('formats numbers', function() {
      const nf = numberFormat();
      expect(nf(1234567.89123456)).toEqual('1,234,567.89');
    });

    it('formats booleans', function() {
      const nf = numberFormat();
      expect(nf(true)).toEqual('1.00');
    });

    it('formats numbers in strings', function() {
      const nf = numberFormat();
      expect(nf('1234567.89123456')).toEqual('1,234,567.89');
    });

    it("doesn't formats strings", function() {
      const nf = numberFormat();
      expect(nf('hi there')).toEqual('');
    });

    it("doesn't formats objects", function() {
      const nf = numberFormat();
      expect(nf({a: 1})).toEqual('');
    });

    it('formats percentages', function() {
      const nf = numberFormat({scaler: 100, suffix: '%'});
      expect(nf(0.12345)).toEqual('12.35%');
    });

    it('adds separators', function() {
      const nf = numberFormat({thousandsSep: 'a', decimalSep: 'b'});
      expect(nf(1234567.89123456)).toEqual('1a234a567b89');
    });

    it('adds prefixes and suffixes', function() {
      const nf = numberFormat({prefix: 'a', suffix: 'b'});
      expect(nf(1234567.89123456)).toEqual('a1,234,567.89b');
    });

    it('scales and rounds', function() {
      const nf = numberFormat({digitsAfterDecimal: 3, scaler: 1000});
      expect(nf(1234567.89123456)).toEqual('1,234,567,891.235');
    });
  });

  describe('.derivers', function() {
    describe('.dateFormat()', function() {
      const df = utils.derivers.dateFormat(
        'x',
        'abc % %% %%% %a %y %m %n %d %w %x %H %M %S',
        true
      );

      it('formats date objects', () =>
        expect(df({x: new Date('2015-01-02T23:43:11Z')})).toBe(
          'abc % %% %%% %a 2015 01 Jan 02 Fri 5 23 43 11'
        ));

      it('formats input parsed by Date.parse()', function() {
        expect(df({x: '2015-01-02T23:43:11Z'})).toBe(
          'abc % %% %%% %a 2015 01 Jan 02 Fri 5 23 43 11'
        );

        expect(df({x: 'bla'})).toBe('');
      });
    });

    describe('.bin()', function() {
      const binner = utils.derivers.bin('x', 10);

      it('bins numbers', function() {
        expect(binner({x: 11})).toBe(10);

        expect(binner({x: 9})).toBe(0);

        expect(binner({x: 111})).toBe(110);
      });

      it('bins booleans', () => expect(binner({x: true})).toBe(0));

      it('bins negative numbers', () => expect(binner({x: -12})).toBe(-10));

      it("doesn't bin strings", () => expect(binner({x: 'a'})).toBeNaN());

      it("doesn't bin objects", () => expect(binner({x: {a: 1}})).toBeNaN());
    });
  });
});
