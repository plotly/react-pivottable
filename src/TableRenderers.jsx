import React from 'react';
import PropTypes from 'prop-types';
import {PivotData} from './Utilities';

// helper function for setting row/col-span in pivotTableRenderer
const spanSize = function(arr, i, j, no_loop = false) {
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
      x = no_loop ? j : 0, end1 = j, asc1 = end1 >= 0;
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

function redColorScaleGenerator(values) {
  const min = Math.min.apply(Math, values);
  const max = Math.max.apply(Math, values);
  return x => {
    // eslint-disable-next-line no-magic-numbers
    const nonRed = 255 - Math.round((255 * (x - min)) / (max - min));
    return {backgroundColor: `rgb(255,${nonRed},${nonRed})`};
  };
}

const flatKey = arr => arr.join(String.fromCharCode(0));
const has = (set, arr) => arr.every(set.has, set);
const add = (set, arr) => (arr.forEach(set.add, set) || set);
const remove = (set, arr) => (arr.forEach(set.delete, set) || set);
const toggle = (set, arr) => (has(set, arr) ? remove : add)(set, arr);

function makeRenderer(opts = {}) {
  class TableRenderer extends React.PureComponent {
    render() {
      const pivotData = new PivotData(this.props);
      const colAttrs = pivotData.props.cols;
      const rowAttrs = pivotData.props.rows;
      let rowKeys = pivotData.getRowKeys(true);
      let colKeys = pivotData.getColKeys(true);
      const grandTotalAggregator = pivotData.getAggregator([], []);

      const grouping = pivotData.props.grouping;
      const compactRows = grouping && this.props.compactRows;
      // speacial case for spanSize counting (no_loop)
      const specialCase = grouping && !this.props.rowGroupBefore;
      const folded = (this.state || {}).folded || new Set();
      const isFolded = keys => has(folded, keys.map(flatKey));
      const fold = keys => this.setState({folded: toggle(new Set(folded), keys.map(flatKey))});

      if(grouping){
        for (const key of folded) {
          colKeys = colKeys.filter(colKey => !flatKey(colKey).startsWith(key + String.fromCharCode(0)));
          rowKeys = rowKeys.filter(rowKey => !flatKey(rowKey).startsWith(key + String.fromCharCode(0)));
        }
      }

      let valueCellColors = () => {};
      let rowTotalColors = () => {};
      let colTotalColors = () => {};
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

      const rbClass = grouping? this.props.rowGroupBefore ? "rowGroupBefore" : "rowGroupAfter" : "";
      const cbClass = grouping? this.props.colGroupBefore ? "colGroupBefore" : "colGroupAfter" : "";
      const clickClass = (pred, closed) => pred? " pvtClickable" + (closed? " closed": "") : "";
      return (
        <table className={`pvtTable ${rbClass} ${cbClass}`}>
          <thead>
            {colAttrs.map(function(c, j) {
              const clickable = grouping && colAttrs.length > j + 1;
              const levelKeys = colKeys.filter(x => x.length === j+1);
              return (
                <tr key={`colAttr${j}`}>
                  {j === 0 && rowAttrs.length !== 0 && (
                    <th colSpan={rowAttrs.length} rowSpan={colAttrs.length} />
                  )}
                  <th className={"pvtAxisLabel" + clickClass(clickable, isFolded(levelKeys))}
                   onClick={clickable? _ => fold(levelKeys): null}
                  >{c}</th>
                  {colKeys.map(function(colKey, i) {
                    const x = spanSize(colKeys, i, j);
                    if (x === -1) {
                      return null;
                    }
                    return (
                      <th
                        className={"pvtColLabel" + clickClass(clickable && colKey[j], isFolded([colKey.slice(0, j + 1)]))}
                        key={`colKey${i}`}
                        colSpan={x}
                        rowSpan={
                          j === colAttrs.length - 1 && rowAttrs.length !== 0
                            ? 2
                            : 1
                        }
                        onClick={clickable && colKey[j] ? _ => fold([colKey.slice(0, j + 1)]) : null}
                      >
                        {colKey[j]}
                      </th>
                    );
                  })}

                  {j === 0 && (
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
                {rowAttrs.map(function(r, i) {
                  const clickable = grouping && rowAttrs.length > i + 1;
                  const levelKeys = rowKeys.filter(x => x.length === i+1);
                  return (
                    <th className={"pvtAxisLabel" + clickClass(clickable, isFolded(levelKeys))}
                      onClick={clickable? _ => fold(levelKeys): null}
                      key={`rowAttr${i}`}>
                      {r}
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
            {rowKeys.map(function(rowKey, i) {
              const totalAggregator = pivotData.getAggregator(rowKey, []);
              const rowGap = rowAttrs.length - rowKey.length;
              return (
                <tr key={`rowKeyRow${i}`}
                  className={rowGap ? "pvtLevel" + rowGap : "pvtData"}>
                  {rowKey.map(function(txt, j) {
                    if (compactRows && j < rowKey.length - 1) {
                      return null;
                    }
                    const clickable =  grouping && rowAttrs.length > j + 1;
                    const x = compactRows ? 1 : spanSize(rowKeys, i, j, specialCase);
                    if (x === -1) {
                      return null;
                    }
                    return (
                      <th
                        key={`rowKeyLabel${i}-${j}`}
                        className={"pvtRowLabel" + clickClass(clickable && rowKey[j], isFolded([rowKey.slice(0, j + 1)]))}
                        rowSpan={x}
                        colSpan={
                          compactRows ?
                          rowAttrs.length + 1 :
                          j === rowAttrs.length - 1 && colAttrs.length !== 0
                            ? 2
                            : 1
                        }
                        style={{paddingLeft: compactRows ? `calc(var(--pvt-row-padding, 5px) + ${j} * var(--pvt-row-indent, 20px))` : null}}
                        onClick={clickable && rowKey[j] ? _ => fold([rowKey.slice(0, j + 1)]) : null}
                      >
                        {txt}
                      </th>
                    );
                  })}
                  {!compactRows && rowGap
                    ? <th className="pvtRowLabel" colSpan={rowGap + 1}>{"Total (" + rowKey[rowKey.length - 1] + ")"}</th>
                    : null
                  }
                  {colKeys.map(function(colKey, j) {
                    const aggregator = pivotData.getAggregator(rowKey, colKey);
                    const colGap = colAttrs.length - colKey.length;
                    return (
                      <td
                        className={"pvtVal" + (colGap ? " pvtLevel" + colGap : "")}
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
                </tr>
              );
            })}

            <tr>
              <th
                className="pvtTotalLabel"
                colSpan={rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)}
              >
                Totals
              </th>

              {colKeys.map(function(colKey, i) {
                const totalAggregator = pivotData.getAggregator([], colKey);
                const colGap = colAttrs.length - colKey.length;
                return (
                  <td
                    className={"pvtTotal" + (colGap ? " pvtLevel" + colGap : "")}
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

              <td
                onClick={
                  getClickHandler &&
                  getClickHandler(grandTotalAggregator.value(), [null], [null])
                }
                className="pvtGrandTotal"
              >
                {grandTotalAggregator.format(grandTotalAggregator.value())}
              </td>
            </tr>
          </tbody>
        </table>
      );
    }
  }

  TableRenderer.defaultProps = PivotData.defaultProps;
  TableRenderer.propTypes = PivotData.propTypes;
  TableRenderer.defaultProps.tableColorScaleGenerator = redColorScaleGenerator;
  TableRenderer.defaultProps.tableOptions = {};
  TableRenderer.propTypes.tableColorScaleGenerator = PropTypes.func;
  TableRenderer.propTypes.tableOptions = PropTypes.object;
  TableRenderer.defaultProps.compactRows = true;
  TableRenderer.propTypes.compactRows = PropTypes.bool;
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
        style={{width: window.innerWidth / 2, height: window.innerHeight / 2}}
        readOnly={true}
      />
    );
  }
}

TSVExportRenderer.defaultProps = PivotData.defaultProps;
TSVExportRenderer.propTypes = PivotData.propTypes;

export default {
  Table: makeRenderer(),
  'Table Heatmap': makeRenderer({heatmapMode: 'full'}),
  'Table Col Heatmap': makeRenderer({heatmapMode: 'col'}),
  'Table Row Heatmap': makeRenderer({heatmapMode: 'row'}),
  'Exportable TSV': TSVExportRenderer,
};
