import React from 'react';
import PropTypes from 'prop-types';
import { PivotData, naturalSort } from './Utilities';
import update from 'immutability-helper';

// helper function for setting row/col-span in pivotTableRenderer
const spanSize = function (arr, i, j) {
  let x;
  if (i !== 0) {
    let asc, end;
    let noDraw = true;
    for (
      x = 0, end = j, asc = end >= 0;
      asc ? x <= end : x >= end;
      asc ? x++ : x--
    ) {
      if (arr[i - 1][x] !== arr[i][x]) {
        noDraw = false;
      }
    }
    if (noDraw) {
      return -1;
    }
  }
  let len = 0;
  while (i + len < arr.length) {
    let asc1, end1;
    let stop = false;
    for (
      x = 0, end1 = j, asc1 = end1 >= 0;
      asc1 ? x <= end1 : x >= end1;
      asc1 ? x++ : x--
    ) {
      if (arr[i][x] !== arr[i + len][x]) {
        stop = true;
      }
    }
    if (stop) {
      break;
    }
    len++;
  }
  return len;
};

const orders = {
  desc: {
    label: 'desc',
    fn: (a, b) => -naturalSort(a, b)
  },
  asc: {
    label: 'asc',
    fn: naturalSort
  }
}

function redColorScaleGenerator(values) {
  const min = Math.min.apply(Math, values);
  const max = Math.max.apply(Math, values);
  return x => {
    // eslint-disable-next-line no-magic-numbers
    const nonRed = 255 - Math.round((255 * (x - min)) / (max - min));
    return { backgroundColor: `rgb(255,${nonRed},${nonRed})` };
  };
}

function makeRenderer(opts = {}) {
  class TableRenderer extends React.PureComponent {
    render() {
      const pivotData = new PivotData(this.props);
      const colAttrs = pivotData.props.cols;
      const rowAttrs = pivotData.props.rows;
      let rowKeys = pivotData.getRowKeys();
      const colKeys = pivotData.getColKeys();
      const grandTotalAggregator = pivotData.getAggregator([], []);
      const sorters = pivotData.props.sorters;
      const sortRow = pivotData.props.enableRowSort;
      const sortCol = pivotData.props.enableColSort;
      const { rowTotals, colTotals } = this.props;
      const sorterCol = this.props.sorterCol;

      if (sorterCol) {
        const { name, order } = sorterCol
        rowKeys = pivotData.getUserSortedRowKeys(name, order)
      }

      let valueCellColors = () => { };
      let rowTotalColors = () => { };
      let colTotalColors = () => { };
      if (opts.heatmapMode) {
        const colorScaleGenerator = this.props.tableColorScaleGenerator;
        const rowTotalValues = colKeys.map(x =>
          pivotData.getAggregator([], x).value()
        );
        rowTotalColors = colorScaleGenerator(rowTotalValues);
        const colTotalValues = rowKeys.map(x =>
          pivotData.getAggregator(x, []).value()
        );
        colTotalColors = colorScaleGenerator(colTotalValues);

        if (opts.heatmapMode === 'full') {
          const allValues = [];
          rowKeys.map(r =>
            colKeys.map(c =>
              allValues.push(pivotData.getAggregator(r, c).value())
            )
          );
          const colorScale = colorScaleGenerator(allValues);
          valueCellColors = (r, c, v) => colorScale(v);
        } else if (opts.heatmapMode === 'row') {
          const rowColorScales = {};
          rowKeys.map(r => {
            const rowValues = colKeys.map(x =>
              pivotData.getAggregator(r, x).value()
            );
            rowColorScales[r] = colorScaleGenerator(rowValues);
          });
          valueCellColors = (r, c, v) => rowColorScales[r](v);
        } else if (opts.heatmapMode === 'col') {
          const colColorScales = {};
          colKeys.map(c => {
            const colValues = rowKeys.map(x =>
              pivotData.getAggregator(x, c).value()
            );
            colColorScales[c] = colorScaleGenerator(colValues);
          });
          valueCellColors = (r, c, v) => colColorScales[c](v);
        }
      }

      const joiner = String.fromCharCode(0);
      const getSortRowClasses = (order, key) => {
        let classes = 'pvtTriangle sorterIcon ';
        if (order === orders.desc) {
          classes += 'rotate180 '
        }
        if (sorters[key] === order.fn) {
          classes += 'activeSorterIcon'
        }
        return classes;
      }

      const getSortedColClasses = (order, key, colKey) => {
        const keyStr = colKey.join(joiner);
        const sorter = this.props.sorterCol;
        let classes = 'pvtTriangle sorterIcon ';
        if (order === orders.desc.label) {
          classes += 'rotate180 ';
        }
        if (sorter && sorter.name === keyStr && sorter.order === order) {
          classes += 'activeSorterIcon';
        }
        return classes;
      }

      const handleRowClick = (order = orders.asc, key) => {
        // simple wrap the naturalSort fn so that it doesn't treated the same as asc func
        const wrapperFn = (a, b) => naturalSort(a, b)
        this.props.onChange(update(this.props, {
          sorters: { $merge: { [key]: sorters[key] === order.fn ? wrapperFn : order.fn } },
          sorterCol: { $set: {} },
        }))
      }

      const updateSorterCol = val => {
        this.props.onChange(update(this.props, {
          sorterCol: { $set: val },
          // only one works
          sorters: { $set: {} }
        }))
      }

      const handleColClick = (keys = [], key, order = orders.asc.label) => {
        const rows = pivotData.props.rows;
        if (rows.length < 1) { return }
        const valKey = keys.join(joiner)
        // handle last level of cols only
        if (keys.indexOf(key) === keys.length - 1) {
          if (sorterCol) {
            const { name, order: oldOrder } = sorterCol
            if (name === valKey && oldOrder === order) {
              updateSorterCol(null)
            } else {
              updateSorterCol({ name: valKey, order })
            }
          } else {
            updateSorterCol({ name: valKey, order })
          }
        }
      }

      const getClickHandler =
        this.props.tableOptions && this.props.tableOptions.clickCallback
          ? (value, rowValues, colValues) => {
            const filters = {};
            for (const i of Object.keys(colAttrs || {})) {
              const attr = colAttrs[i];
              if (colValues[i] !== null) {
                filters[attr] = colValues[i];
              }
            }
            for (const i of Object.keys(rowAttrs || {})) {
              const attr = rowAttrs[i];
              if (rowValues[i] !== null) {
                filters[attr] = rowValues[i];
              }
            }
            return e =>
              this.props.tableOptions.clickCallback(
                e,
                value,
                filters,
                pivotData
              );
          }
          : null;

      return (
        <table className="pvtTable">
          <thead>
            {colAttrs.map(function (c, j) {
              return (
                <tr key={`colAttr${j}`}>
                  {j === 0 && rowAttrs.length !== 0 && (
                    <th colSpan={rowAttrs.length} rowSpan={colAttrs.length} />
                  )}
                  <th className="pvtAxisLabel">{c}</th>
                  {colKeys.map(function (colKey, i) {
                    const x = spanSize(colKeys, i, j);
                    if (x === -1) {
                      return null;
                    }
                    return (
                      <th
                        className="pvtColLabel"
                        key={`colKey${i}`}
                        colSpan={x}
                        rowSpan={
                          j === colAttrs.length - 1 && rowAttrs.length !== 0
                            ? 2
                            : 1
                        }
                      >
                        <div className='flex-center'>
                          {colKey[j]}
                          {
                            (sortCol && colKey && colKey.indexOf(colKey[j]) === colKey.length - 1) ?
                              (<div className='sorters'>
                                <div className={getSortedColClasses(orders.asc.label, colKey[j], colKey)}
                                  onClick={() => handleColClick(colKey, colKey[j], orders.asc.label)}>▴</div>
                                <div className={getSortedColClasses(orders.desc.label, colKey[j], colKey)}
                                  onClick={() => handleColClick(colKey, colKey[j], orders.desc.label)}>▴</div>
                              </div>) : null
                          }
                        </div>
                      </th>
                    );
                  })}

                  {j === 0 && rowTotals && (
                    <th
                      className="pvtTotalLabel"
                      rowSpan={
                        colAttrs.length + (rowAttrs.length === 0 ? 0 : 1)
                      }
                    >
                      Totals
                    </th>
                  )}
                </tr>
              );
            })}

            {rowAttrs.length !== 0 && (
              <tr>
                {rowAttrs.map(function (r, i) {
                  return (
                    <th className="pvtAxisLabel" key={`rowAttr${i}`}>
                      <div className="centered-sorters-box">
                        {r}
                        {sortRow ? (
                          <div className='sorters'>
                            <div className={getSortRowClasses(orders.asc, r)}
                              onClick={() => handleRowClick(orders.asc, r)}>▴</div>
                            <div className={getSortRowClasses(orders.desc, r)}
                              onClick={() => handleRowClick(orders.desc, r)}>▴</div>
                          </div>
                        ) : null}
                      </div>
                    </th>
                  );
                })}
                <th className="pvtTotalLabel">
                  {colAttrs.length === 0 ? 'Totals' : null}
                </th>
              </tr>
            )}
          </thead>

          <tbody>
            {rowKeys.map(function (rowKey, i) {
              const totalAggregator = pivotData.getAggregator(rowKey, []);
              return (
                <tr key={`rowKeyRow${i}`}>
                  {rowKey.map(function (txt, j) {
                    const x = spanSize(rowKeys, i, j);
                    if (x === -1) {
                      return null;
                    }
                    return (
                      <th
                        key={`rowKeyLabel${i}-${j}`}
                        className="pvtRowLabel"
                        rowSpan={x}
                        colSpan={
                          j === rowAttrs.length - 1 && colAttrs.length !== 0
                            ? 2
                            : 1
                        }
                      >
                        {txt}
                      </th>
                    );
                  })}
                  {colKeys.map(function (colKey, j) {
                    const aggregator = pivotData.getAggregator(rowKey, colKey);
                    return (
                      <td
                        className="pvtVal"
                        key={`pvtVal${i}-${j}`}
                        onClick={
                          getClickHandler &&
                          getClickHandler(aggregator.value(), rowKey, colKey)
                        }
                        style={valueCellColors(
                          rowKey,
                          colKey,
                          aggregator.value()
                        )}
                      >
                        {aggregator.format(aggregator.value())}
                      </td>
                    );
                  })}
                   {
                    rowTotals && (
                      <td
                        className="pvtTotal"
                        onClick={
                          getClickHandler &&
                          getClickHandler(totalAggregator.value(), rowKey, [null])
                        }
                        style={colTotalColors(totalAggregator.value())}
                      >
                        {totalAggregator.format(totalAggregator.value())}
                      </td>
                  )}
                </tr>
              );
            })}
             {
              colTotals && (
                <tr>
                  <th
                    className="pvtTotalLabel"
                    colSpan={rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)}
                  >
                    Totals
                  </th>
                  {colKeys.map(function (colKey, i) {
                    const totalAggregator = pivotData.getAggregator([], colKey);
                    return (
                      <td
                        className="pvtTotal"
                        key={`total${i}`}
                        onClick={
                          getClickHandler &&
                          getClickHandler(totalAggregator.value(), [null], colKey)
                        }
                        style={rowTotalColors(totalAggregator.value())}
                      >
                        {totalAggregator.format(totalAggregator.value())}
                      </td>
                    );
                  })}
                  {
                    rowTotals && colTotals && (
                        <td
                        onClick={
                          getClickHandler &&
                          getClickHandler(grandTotalAggregator.value(), [null], [null])
                        }
                        className="pvtGrandTotal"
                      >
                        {grandTotalAggregator.format(grandTotalAggregator.value())}
                      </td>
                    )
                  }
                </tr>
            )}
          </tbody>
        </table>
      );
    }
  }

  TableRenderer.defaultProps = PivotData.defaultProps;
  TableRenderer.propTypes = PivotData.propTypes;
  TableRenderer.defaultProps.tableColorScaleGenerator = redColorScaleGenerator;
  TableRenderer.defaultProps.tableOptions = {};
  TableRenderer.defaultProps.rowTotals = true;
  TableRenderer.defaultProps.colTotals = true;
  TableRenderer.propTypes.tableColorScaleGenerator = PropTypes.func;
  TableRenderer.propTypes.tableOptions = PropTypes.object;
  return TableRenderer;
}

class TSVExportRenderer extends React.PureComponent {
  render() {
    const pivotData = new PivotData(this.props);
    const rowKeys = pivotData.getRowKeys();
    const colKeys = pivotData.getColKeys();
    if (rowKeys.length === 0) {
      rowKeys.push([]);
    }
    if (colKeys.length === 0) {
      colKeys.push([]);
    }

    const headerRow = pivotData.props.rows.map(r => r);
    if (colKeys.length === 1 && colKeys[0].length === 0) {
      headerRow.push(this.props.aggregatorName);
    } else {
      colKeys.map(c => headerRow.push(c.join('-')));
    }

    const result = rowKeys.map(r => {
      const row = r.map(x => x);
      colKeys.map(c => {
        const v = pivotData.getAggregator(r, c).value();
        row.push(v ? v : '');
      });
      return row;
    });

    result.unshift(headerRow);

    return (
      <textarea
        value={result.map(r => r.join('\t')).join('\n')}
        style={{ width: window.innerWidth / 2, height: window.innerHeight / 2 }}
        readOnly={true}
      />
    );
  }
}

TSVExportRenderer.defaultProps = PivotData.defaultProps;
TSVExportRenderer.propTypes = PivotData.propTypes;

export default {
  Table: makeRenderer(),
  'Table Heatmap': makeRenderer({ heatmapMode: 'full' }),
  'Table Col Heatmap': makeRenderer({ heatmapMode: 'col' }),
  'Table Row Heatmap': makeRenderer({ heatmapMode: 'row' }),
  'Exportable TSV': TSVExportRenderer,
};