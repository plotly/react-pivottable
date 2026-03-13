import React from 'react';
import PropTypes from 'prop-types';
import {PivotData, flatKey} from './Utilities';

function redColorScaleGenerator(values) {
  const min = Math.min.apply(Math, values);
  const max = Math.max.apply(Math, values);
  return x => {
    // eslint-disable-next-line no-magic-numbers
    const nonRed = 255 - Math.round((255 * (x - min)) / (max - min));
    return {backgroundColor: `rgb(255,${nonRed},${nonRed})`};
  };
}

function makeRenderer(opts = {}) {
  class SubtotalRenderer extends React.Component {
    constructor(props) {
      super(props);
      this.state = {collapsedRows: {}, collapsedCols: {}};
    }

    componentDidMount() {
      if (
        opts.subtotals &&
        !document.getElementById('react-pivottable-subtotal-styles')
      ) {
        const style = document.createElement('style');
        style.id = 'react-pivottable-subtotal-styles';
        style.innerHTML = `
          .pvtSubtotal {
            font-weight: bold;
            background-color: #f0f0f0;
          }
          .pvtSubtotalRow {
            border-top: 1px solid #ddd;
          }
          .pvtSubtotalVal {
            color: #777;
            font-style: italic;
          }
        `;
        document.head.appendChild(style);
      }
    }

    getBasePivotSettings() {
      const props = this.props;
      const colAttrs = props.cols;
      const rowAttrs = props.rows;

      const tableOptions = Object.assign(
        {
          rowTotals: true,
          colTotals: true,
        },
        props.tableOptions
      );
      const rowTotals = tableOptions.rowTotals || colAttrs.length === 0;
      const colTotals = tableOptions.colTotals || rowAttrs.length === 0;

      const subtotalOptions = Object.assign(
        {
          arrowCollapsed: '\u25B6',
          arrowExpanded: '\u25E2',
        },
        props.subtotalOptions
      );

      const colSubtotalDisplay = Object.assign(
        {
          displayOnTop: false,
          enabled: rowTotals,
          hideOnExpand: false,
        },
        subtotalOptions.colSubtotalDisplay
      );

      const rowSubtotalDisplay = Object.assign(
        {
          displayOnTop: true,
          enabled: colTotals,
          hideOnExpand: false,
        },
        subtotalOptions.rowSubtotalDisplay
      );

      const pivotData = new PivotData(
        props,
        !opts.subtotals
          ? {}
          : {
              rowEnabled: rowSubtotalDisplay.enabled,
              colEnabled: colSubtotalDisplay.enabled,
              rowPartialOnTop: rowSubtotalDisplay.displayOnTop,
              colPartialOnTop: colSubtotalDisplay.displayOnTop,
            }
      );
      const rowKeys = pivotData.getRowKeys();
      const colKeys = pivotData.getColKeys();

      const cellCallbacks = {};
      const rowTotalCallbacks = {};
      const colTotalCallbacks = {};
      let grandTotalCallback = null;
      if (tableOptions.clickCallback) {
        rowKeys.forEach(rowKey => {
          const flatRowKey = flatKey(rowKey);
          cellCallbacks[flatRowKey] = {};
          colKeys.forEach(colKey => {
            const flatColKey = flatKey(colKey);
            if (!(flatRowKey in cellCallbacks)) {
              cellCallbacks[flatRowKey] = {};
            }
            cellCallbacks[flatRowKey][flatColKey] = this.clickHandler(
              pivotData,
              rowKey,
              colKey
            );
          });
          rowTotalCallbacks[flatRowKey] = this.clickHandler(
            pivotData,
            rowKey,
            []
          );
        });
        colKeys.forEach(colKey => {
          const flatColKey = flatKey(colKey);
          colTotalCallbacks[flatColKey] = this.clickHandler(
            pivotData,
            [],
            colKey
          );
        });
        grandTotalCallback = this.clickHandler(pivotData, [], []);
      }

      return Object.assign(
        {
          pivotData,
          colAttrs,
          rowAttrs,
          colKeys,
          rowKeys,
          rowTotals,
          colTotals,
          arrowCollapsed: subtotalOptions.arrowCollapsed,
          arrowExpanded: subtotalOptions.arrowExpanded,
          colSubtotalDisplay,
          rowSubtotalDisplay,
          cellCallbacks,
          rowTotalCallbacks,
          colTotalCallbacks,
          grandTotalCallback,
        },
        SubtotalRenderer.heatmapMappers(
          pivotData,
          props.tableColorScaleGenerator,
          colTotals,
          rowTotals
        )
      );
    }

    clickHandler(pivotData, rowValues, colValues) {
      const colAttrs = this.props.cols;
      const rowAttrs = this.props.rows;
      const value = pivotData.getAggregator(rowValues, colValues).value();
      const filters = {};
      const colLimit = Math.min(colAttrs.length, colValues.length);
      for (let i = 0; i < colLimit; i++) {
        const attr = colAttrs[i];
        if (colValues[i] !== null) {
          filters[attr] = colValues[i];
        }
      }
      const rowLimit = Math.min(rowAttrs.length, rowValues.length);
      for (let i = 0; i < rowLimit; i++) {
        const attr = rowAttrs[i];
        if (rowValues[i] !== null) {
          filters[attr] = rowValues[i];
        }
      }
      return e =>
        this.props.tableOptions.clickCallback(e, value, filters, pivotData);
    }

    collapseAttr(rowOrCol, attrIdx, allKeys) {
      return function() {
        var flatCollapseKeys = {};
        for (var i = 0; i < allKeys.length; i++) {
          var k = allKeys[i];
          var slicedKey = k.slice(0, attrIdx + 1);
          flatCollapseKeys[flatKey(slicedKey)] = true;
        }
        this.setState(function(prevState) {
          if (rowOrCol === 'row') {
            return {
              collapsedRows: Object.assign(
                {},
                prevState.collapsedRows,
                flatCollapseKeys
              ),
            };
          } else if (rowOrCol === 'col') {
            return {
              collapsedCols: Object.assign(
                {},
                prevState.collapsedCols,
                flatCollapseKeys
              ),
            };
          }
          return null;
        });
      }.bind(this);
    }

    expandAttr(rowOrCol, attrIdx, allKeys) {
      return function() {
        var flatCollapseKeys = {};
        for (var i = 0; i < allKeys.length; i++) {
          var k = allKeys[i];
          var slicedKey = k.slice(0, attrIdx + 1);
          flatCollapseKeys[flatKey(slicedKey)] = false;
        }
        this.setState(function(prevState) {
          if (rowOrCol === 'row') {
            return {
              collapsedRows: Object.assign(
                {},
                prevState.collapsedRows,
                flatCollapseKeys
              ),
            };
          } else if (rowOrCol === 'col') {
            return {
              collapsedCols: Object.assign(
                {},
                prevState.collapsedCols,
                flatCollapseKeys
              ),
            };
          }
          return null;
        });
      }.bind(this);
    }

    toggleRowKey(flatRowKey) {
      return function() {
        this.setState(function(prevState) {
          var newCollapsedRows = Object.assign({}, prevState.collapsedRows);
          newCollapsedRows[flatRowKey] = !prevState.collapsedRows[flatRowKey];
          return {collapsedRows: newCollapsedRows};
        });
      }.bind(this);
    }

    toggleColKey(flatColKey) {
      return function() {
        this.setState(function(prevState) {
          var newCollapsedCols = Object.assign({}, prevState.collapsedCols);
          newCollapsedCols[flatColKey] = !prevState.collapsedCols[flatColKey];
          return {collapsedCols: newCollapsedCols};
        });
      }.bind(this);
    }

    // Given an array of attribute values (i.e. each element is another array with
    // the value at every level), compute the spans for every attribute value at
    // each level.
    calcAttrSpans(attrArr, numAttrs) {
      const spans = [];
      const li = Array(numAttrs).map(() => 0);
      let lv = Array(numAttrs).map(() => null);
      for (let i = 0; i < attrArr.length; i++) {
        const cv = attrArr[i];
        const isSubtotal = cv[cv.length - 1] === '__subtotal__';
        const actualCv = isSubtotal ? cv.slice(0, -1) : cv;

        const ent = [];
        let depth = 0;
        const limit = Math.min(lv.length, actualCv.length);
        while (depth < limit && lv[depth] === actualCv[depth]) {
          ent.push(-1);
          spans[li[depth]][depth]++;
          depth++;
        }
        while (depth < actualCv.length) {
          li[depth] = i;
          ent.push(1);
          depth++;
        }
        spans.push(ent);
        lv = actualCv;
      }
      return spans;
    }

    static heatmapMappers(
      pivotData,
      colorScaleGenerator,
      colTotals,
      rowTotals
    ) {
      const colMapper = {};
      const rowMapper = {};

      if (colorScaleGenerator && opts.heatmapMode) {
        const valueCellColors = {};
        const rowTotalColors = {};
        const colTotalColors = {};
        let grandTotalColor = null;

        const allValues = [];
        const rowValues = {};
        const colValues = {};

        pivotData.forEachCell((val, rowKey, colKey) => {
          if (val !== null && !isNaN(val)) {
            allValues.push(val);

            const flatRow = flatKey(rowKey);
            if (!rowValues[flatRow]) {
              rowValues[flatRow] = [];
            }
            rowValues[flatRow].push(val);

            const flatCol = flatKey(colKey);
            if (!colValues[flatCol]) {
              colValues[flatCol] = [];
            }
            colValues[flatCol].push(val);
          }
        });

        if (opts.heatmapMode === 'row' && colTotals) {
          pivotData.getRowKeys().forEach(rowKey => {
            let rowTotal = 0;
            let hasValidValues = false;
            pivotData.getColKeys().forEach(colKey => {
              const agg = pivotData.getAggregator(rowKey, colKey);
              if (agg) {
                const val = agg.value();
                if (val !== null && !isNaN(val)) {
                  rowTotal += val;
                  hasValidValues = true;
                }
              }
            });

            if (hasValidValues && rowTotal !== 0) {
              const flatRow = flatKey(rowKey);
              if (!rowValues[flatRow]) {
                rowValues[flatRow] = [];
              }
              rowValues[flatRow].push(rowTotal);
            }
          });
        }

        if (opts.heatmapMode === 'col' && rowTotals) {
          pivotData.getColKeys().forEach(colKey => {
            let colTotal = 0;
            let hasValidValues = false;
            pivotData.getRowKeys().forEach(rowKey => {
              const agg = pivotData.getAggregator(rowKey, colKey);
              if (agg) {
                const val = agg.value();
                if (val !== null && !isNaN(val)) {
                  colTotal += val;
                  hasValidValues = true;
                }
              }
            });

            if (hasValidValues && colTotal !== 0) {
              const flatCol = flatKey(colKey);
              if (!colValues[flatCol]) {
                colValues[flatCol] = [];
              }
              colValues[flatCol].push(colTotal);
            }
          });
        }

        if (colTotals) {
          const rowTotalValues = [];
          pivotData.forEachTotal(([valKey, _x]) => {
            const val = pivotData.getAggregator([valKey], []).value();
            if (val !== null && !isNaN(val)) {
              rowTotalValues.push(val);
              if (opts.heatmapMode === 'full') {
                allValues.push(val);
              }
            }
          });

          const rowTotalColorScale =
            opts.heatmapMode === 'full'
              ? colorScaleGenerator(allValues)
              : colorScaleGenerator(rowTotalValues);

          pivotData.forEachTotal(([valKey, _x]) => {
            const val = pivotData.getAggregator([valKey], []).value();
            if (val !== null && !isNaN(val)) {
              rowTotalColors[flatKey([valKey])] = rowTotalColorScale(val);
            }
          });
        }

        if (rowTotals) {
          const colTotalValues = [];
          pivotData.forEachTotal(([_x, valKey]) => {
            const val = pivotData.getAggregator([], [valKey]).value();
            if (val !== null && !isNaN(val)) {
              colTotalValues.push(val);
              if (opts.heatmapMode === 'full') {
                allValues.push(val);
              }
            }
          });

          const colTotalColorScale =
            opts.heatmapMode === 'full'
              ? colorScaleGenerator(allValues)
              : colorScaleGenerator(colTotalValues);

          pivotData.forEachTotal(([_x, valKey]) => {
            const val = pivotData.getAggregator([], [valKey]).value();
            if (val !== null && !isNaN(val)) {
              colTotalColors[flatKey([valKey])] = colTotalColorScale(val);
            }
          });
        }

        if (colTotals && rowTotals) {
          const grandTotalVal = pivotData.getAggregator([], []).value();
          if (grandTotalVal !== null && !isNaN(grandTotalVal)) {
            if (opts.heatmapMode === 'full') {
              allValues.push(grandTotalVal);
              const grandTotalColorScale = colorScaleGenerator(allValues);
              grandTotalColor = grandTotalColorScale(grandTotalVal);
            }
          }
        }

        if (rowTotals) {
          colMapper.totalColor = key => colTotalColors[flatKey([key])];
        }
        if (colTotals) {
          rowMapper.totalColor = key => rowTotalColors[flatKey([key])];
        }
        if (grandTotalColor) {
          colMapper.grandTotalColor = grandTotalColor;
        }

        if (opts.heatmapMode === 'full') {
          // Full heatmap: Compare values across the entire table
          // Note: allValues already contains all cell values from earlier collection
          const colorScale = colorScaleGenerator(allValues);
          pivotData.forEachCell((val, rowKey, colKey) => {
            if (val !== null && !isNaN(val)) {
              valueCellColors[
                `${flatKey(rowKey)}_${flatKey(colKey)}`
              ] = colorScale(val);
            }
          });

          colMapper.bgColorFromRowColKey = (rowKey, colKey) =>
            valueCellColors[`${flatKey(rowKey)}_${flatKey(colKey)}`];

          colMapper.bgColorFromSubtotalValue = value => {
            if (value !== null && !isNaN(value)) {
              return colorScale(value);
            }
            return null;
          };
        } else if (opts.heatmapMode === 'row') {
          // Row heatmap: Compare values within each row
          // Note: rowValues already populated from earlier collection
          const rowColorScales = {};
          Object.entries(rowValues).forEach(([flatRow, values]) => {
            if (values.length > 0) {
              rowColorScales[flatRow] = colorScaleGenerator(values);
            }
          });

          pivotData.forEachCell((val, rowKey, colKey) => {
            const flatRow = flatKey(rowKey);
            if (val !== null && !isNaN(val) && rowColorScales[flatRow]) {
              valueCellColors[`${flatRow}_${flatKey(colKey)}`] = rowColorScales[
                flatRow
              ](val);
            }
          });

          colMapper.bgColorFromRowColKey = (rowKey, colKey) =>
            valueCellColors[`${flatKey(rowKey)}_${flatKey(colKey)}`];

          colMapper.bgColorFromSubtotalValue = (value, rowKey) => {
            if (value !== null && !isNaN(value)) {
              const flatRow = flatKey(rowKey);
              if (rowColorScales[flatRow]) {
                return rowColorScales[flatRow](value);
              }
            }
            return null;
          };
        } else if (opts.heatmapMode === 'col') {
          // Column heatmap: Compare values within each column
          // Note: colValues already populated from earlier collection
          const colColorScales = {};
          Object.entries(colValues).forEach(([flatCol, values]) => {
            if (values.length > 0) {
              colColorScales[flatCol] = colorScaleGenerator(values);
            }
          });

          pivotData.forEachCell((val, rowKey, colKey) => {
            const flatCol = flatKey(colKey);
            if (val !== null && !isNaN(val) && colColorScales[flatCol]) {
              valueCellColors[`${flatKey(rowKey)}_${flatCol}`] = colColorScales[
                flatCol
              ](val);
            }
          });

          colMapper.bgColorFromRowColKey = (rowKey, colKey) =>
            valueCellColors[`${flatKey(rowKey)}_${flatKey(colKey)}`];

          colMapper.bgColorFromSubtotalValue = (value, rowKey, colKey) => {
            if (value !== null && !isNaN(value)) {
              const flatCol = flatKey(colKey);
              if (colColorScales[flatCol]) {
                return colColorScales[flatCol](value);
              }
            }
            return null;
          };
        }
      }
      return {colMapper, rowMapper};
    }

    renderColHeaderRow(attrName, attrIdx, pivotSettings) {
      const {
        rowAttrs,
        colAttrs,
        visibleColKeys,
        colAttrSpans,
        rowTotals,
        arrowExpanded,
        arrowCollapsed,
        colSubtotalDisplay,
      } = pivotSettings;

      const spaceCell =
        attrIdx === 0 && rowAttrs.length !== 0 ? (
          <th
            key="padding"
            colSpan={rowAttrs.length}
            rowSpan={colAttrs.length}
          />
        ) : null;

      const needToggle =
        opts.subtotals &&
        colSubtotalDisplay.enabled &&
        attrIdx !== colAttrs.length - 1;
      const attrNameCell = (
        <th key="label" className="pvtAxisLabel">
          {attrName}
        </th>
      );

      const attrValueCells = [];
      const rowIncrSpan = rowAttrs.length !== 0 ? 1 : 0;
      let i = 0;
      while (i < visibleColKeys.length) {
        const colKey = visibleColKeys[i];
        const isSubtotalCol = colKey[colKey.length - 1] === '__subtotal__';
        const actualColKey = isSubtotalCol ? colKey.slice(0, -1) : colKey;

        const colSpan =
          attrIdx < actualColKey.length ? colAttrSpans[i][attrIdx] : 1;
        if (attrIdx < actualColKey.length) {
          const rowSpan =
            1 + (attrIdx === colAttrs.length - 1 ? rowIncrSpan : 0);
          const flatColKey = flatKey(actualColKey.slice(0, attrIdx + 1));
          const onClick = needToggle ? this.toggleColKey(flatColKey) : null;

          let headerText = actualColKey[attrIdx];
          let headerClass = 'pvtColLabel';

          const isCollapsedParent =
            this.state.collapsedCols[flatColKey] &&
            actualColKey.length < colAttrs.length;

          if (isSubtotalCol) {
            headerText = `${headerText} (Subtotal)`;
            headerClass += ' pvtSubtotal';
          } else if (isCollapsedParent) {
            headerClass += ' pvtSubtotal';
          }

          attrValueCells.push(
            <th
              className={headerClass}
              key={'colKey-' + flatColKey + (isSubtotalCol ? '-subtotal' : '')}
              colSpan={colSpan}
              rowSpan={rowSpan}
              onClick={onClick}
              style={{cursor: needToggle ? 'pointer' : 'default'}}
            >
              {needToggle
                ? (this.state.collapsedCols[flatColKey]
                    ? arrowCollapsed
                    : arrowExpanded) + ' '
                : null}
              {headerText}
            </th>
          );
        } else if (attrIdx === actualColKey.length) {
          const rowSpan = colAttrs.length - actualColKey.length + rowIncrSpan;
          const flatColKey = flatKey(actualColKey);
          const isCollapsedParent =
            this.state.collapsedCols[flatColKey] &&
            actualColKey.length < colAttrs.length;

          attrValueCells.push(
            <th
              className={`pvtColLabel ${
                isSubtotalCol || isCollapsedParent ? 'pvtSubtotal' : ''
              }`}
              key={
                'colKeyBuffer-' +
                flatKey(actualColKey) +
                (isSubtotalCol ? '-subtotal' : '')
              }
              colSpan={colSpan}
              rowSpan={rowSpan}
            />
          );
        }
        i = i + colSpan;
      }

      const totalCell =
        attrIdx === 0 && rowTotals ? (
          <th
            key="total"
            className="pvtTotalLabel"
            rowSpan={colAttrs.length + Math.min(rowAttrs.length, 1)}
          >
            Totals
          </th>
        ) : null;

      const cells = [spaceCell, attrNameCell, ...attrValueCells, totalCell];
      return cells;
    }

    renderRowHeaderRow(pivotSettings) {
      const {colAttrs, rowAttrs} = pivotSettings;
      const cells = [];
      if (rowAttrs.length !== 0) {
        rowAttrs.map(function(r, i) {
          cells.push(
            <th className="pvtAxisLabel" key={`rowAttr${i}`}>
              {r}
            </th>
          );
        });
        cells.push(
          <th className="pvtTotalLabel" key="total">
            {colAttrs.length === 0 ? 'Totals' : null}
          </th>
        );
      }
      return cells;
    }

    renderTableRow(rowKey, rowIdx, pivotSettings) {
      const {
        colKeys,
        rowAttrs,
        colAttrs,
        rowTotals,
        pivotData,
        rowMapper,
        colMapper,
        cellCallbacks,
        rowTotalCallbacks,
      } = pivotSettings;

      const visibleColKeys = this.visibleKeys(
        colKeys,
        this.state.collapsedCols
      );

      const cells = [];
      const isSubtotalRow = rowKey[rowKey.length - 1] === '__subtotal__';
      const actualRowKey = isSubtotalRow ? rowKey.slice(0, -1) : rowKey;

      visibleColKeys.forEach((colKey, i) => {
        try {
          if (!actualRowKey || !colKey) {
            cells.push(<td className="pvtVal" key={`pvtVal-${i}`} />);
            return;
          }

          let aggregator,
            className,
            valCss = {};

          const isSubtotalCol = colKey[colKey.length - 1] === '__subtotal__';
          const actualColKey = isSubtotalCol ? colKey.slice(0, -1) : colKey;

          const needsSubtotalValue =
            isSubtotalRow ||
            isSubtotalCol ||
            (actualColKey.length < colAttrs.length &&
              this.state.collapsedCols[flatKey(actualColKey)]) ||
            (actualRowKey.length < rowAttrs.length &&
              this.state.collapsedRows[flatKey(actualRowKey)]);

          if (needsSubtotalValue) {
            const value = this.calculateSubtotal(
              pivotData,
              actualRowKey,
              actualColKey,
              pivotSettings
            );
            className = 'pvtSubtotal';

            const tempAggregator = this.safeGetAggregator(pivotData, [], []);
            aggregator = {
              value: () => value,
              format: tempAggregator ? tempAggregator.format : x => x,
            };

            if (opts.heatmapMode && colMapper.bgColorFromSubtotalValue) {
              let cellColor;
              if (opts.heatmapMode === 'full') {
                cellColor = colMapper.bgColorFromSubtotalValue(value);
              } else if (opts.heatmapMode === 'row') {
                cellColor = colMapper.bgColorFromSubtotalValue(
                  value,
                  actualRowKey
                );
              } else if (opts.heatmapMode === 'col') {
                cellColor = colMapper.bgColorFromSubtotalValue(
                  value,
                  actualRowKey,
                  actualColKey
                );
              }

              if (cellColor) {
                valCss = cellColor;
              }
            }
          } else {
            aggregator = this.safeGetAggregator(
              pivotData,
              actualRowKey,
              actualColKey
            );
            className = 'pvtVal';

            if (opts.heatmapMode && colMapper.bgColorFromRowColKey) {
              const cellColor = colMapper.bgColorFromRowColKey(
                actualRowKey,
                actualColKey
              );
              if (cellColor) {
                valCss = cellColor;
              }
            }
          }

          if (!aggregator || aggregator.value() === null) {
            cells.push(
              <td className={className} key={`pvtVal-${i}`} style={valCss} />
            );
            return;
          }

          const val = aggregator.value();

          let formattedVal;
          if (val === null) {
            formattedVal = '';
          } else if (className === 'pvtSubtotal' && val === 0) {
            formattedVal = '';
          } else {
            formattedVal = aggregator.format(val);
          }

          const cellKey = flatKey(actualRowKey);
          const colCellKey = flatKey(actualColKey);

          cells.push(
            <td
              className={className}
              key={`pvtVal-${i}`}
              style={valCss}
              onClick={
                cellCallbacks[cellKey] && colCellKey in cellCallbacks[cellKey]
                  ? cellCallbacks[cellKey][colCellKey]
                  : null
              }
            >
              {formattedVal}
            </td>
          );
        } catch (error) {
          cells.push(<td className="pvtVal" key={`pvtVal-${i}`} />);
        }
      });

      if (rowTotals) {
        try {
          const className = isSubtotalRow ? 'pvtTotal pvtSubtotal' : 'pvtTotal';
          let valCss = {};

          let totalVal = 0;
          let formattedTotal = '';

          if (isSubtotalRow) {
            totalVal = this.calculateSubtotal(
              pivotData,
              actualRowKey,
              [],
              pivotSettings
            );

            if (opts.heatmapMode && colMapper.bgColorFromSubtotalValue) {
              let cellColor;
              if (opts.heatmapMode === 'full') {
                cellColor = colMapper.bgColorFromSubtotalValue(totalVal);
              } else if (opts.heatmapMode === 'row') {
                cellColor = colMapper.bgColorFromSubtotalValue(
                  totalVal,
                  actualRowKey
                );
              } else if (opts.heatmapMode === 'col') {
                cellColor = colMapper.bgColorFromSubtotalValue(
                  totalVal,
                  actualRowKey,
                  []
                );
              }

              if (cellColor) {
                valCss = cellColor;
              }
            }
          } else if (
            actualRowKey.length < rowAttrs.length &&
            this.state.collapsedRows[flatKey(actualRowKey)]
          ) {
            totalVal = this.calculateSubtotal(
              pivotData,
              actualRowKey,
              [],
              pivotSettings
            );

            if (opts.heatmapMode && colMapper.bgColorFromSubtotalValue) {
              let cellColor;
              if (opts.heatmapMode === 'full') {
                cellColor = colMapper.bgColorFromSubtotalValue(totalVal);
              } else if (opts.heatmapMode === 'row') {
                cellColor = colMapper.bgColorFromSubtotalValue(
                  totalVal,
                  actualRowKey
                );
              } else if (opts.heatmapMode === 'col') {
                cellColor = colMapper.bgColorFromSubtotalValue(
                  totalVal,
                  actualRowKey,
                  []
                );
              }

              if (cellColor) {
                valCss = cellColor;
              }
            }
          } else {
            pivotData.getColKeys().forEach(colKey => {
              const agg = this.safeGetAggregator(
                pivotData,
                actualRowKey,
                colKey
              );
              if (agg) {
                const val = agg.value();
                if (val !== null && !isNaN(val)) {
                  totalVal += val;
                }
              }
            });

            if (opts.heatmapMode && totalVal !== 0) {
              if (
                opts.heatmapMode === 'row' &&
                colMapper.bgColorFromSubtotalValue
              ) {
                const cellColor = colMapper.bgColorFromSubtotalValue(
                  totalVal,
                  actualRowKey
                );
                if (cellColor) {
                  valCss = cellColor;
                }
              } else if (rowMapper.totalColor) {
                const cellColor = rowMapper.totalColor(actualRowKey[0]);
                if (cellColor) {
                  valCss = cellColor;
                }
              }
            }
          }

          if (totalVal !== 0 || isSubtotalRow) {
            const tempAggregator = this.safeGetAggregator(pivotData, [], []);
            const formatFunc =
              tempAggregator && tempAggregator.format
                ? tempAggregator.format
                : x => x;
            if (className.includes('pvtSubtotal') && totalVal === 0) {
              formattedTotal = '';
            } else {
              formattedTotal =
                totalVal === null || totalVal === 0 ? '' : formatFunc(totalVal);
            }
          }

          const cellKey = flatKey(actualRowKey);

          cells.push(
            <td
              className={className}
              key="total"
              style={valCss}
              onClick={rowTotalCallbacks[cellKey]}
            >
              {formattedTotal}
            </td>
          );
        } catch (error) {
          cells.push(<td className="pvtTotal" key="total" />);
        }
      }

      return cells;
    }

    renderTotalsRow(pivotSettings) {
      const {
        colKeys,
        colAttrs,
        rowAttrs,
        colTotals,
        pivotData,
        colMapper,
        grandTotalCallback,
        colTotalCallbacks,
      } = pivotSettings;

      const visibleColKeys = this.visibleKeys(
        colKeys,
        this.state.collapsedCols
      );

      const cells = [];
      cells.push(
        <th
          key="labelTotal"
          className="pvtTotalLabel"
          colSpan={rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)}
        >
          Totals
        </th>
      );

      visibleColKeys.forEach((colKey, i) => {
        try {
          const isSubtotalCol = colKey[colKey.length - 1] === '__subtotal__';
          const actualColKey = isSubtotalCol ? colKey.slice(0, -1) : colKey;

          if (!actualColKey) {
            cells.push(<td className="pvtTotal" key={`total-${i}`} />);
            return;
          }

          let colTotal = 0;

          const flatColKey = flatKey(actualColKey);
          const isCollapsedParent =
            this.state.collapsedCols[flatColKey] &&
            actualColKey.length < colAttrs.length;

          if (isSubtotalCol || isCollapsedParent) {
            colTotal = this.calculateSubtotal(
              pivotData,
              [],
              actualColKey,
              pivotSettings
            );
          } else {
            pivotData.getRowKeys().forEach(rowKey => {
              const agg = this.safeGetAggregator(
                pivotData,
                rowKey,
                actualColKey
              );
              if (agg) {
                const val = agg.value();
                if (val !== null && !isNaN(val)) {
                  colTotal += val;
                }
              }
            });
          }

          let valCss = {};
          if (isSubtotalCol || isCollapsedParent) {
            if (opts.heatmapMode && colMapper.bgColorFromSubtotalValue) {
              let cellColor;
              if (opts.heatmapMode === 'full') {
                cellColor = colMapper.bgColorFromSubtotalValue(colTotal);
              } else if (opts.heatmapMode === 'row') {
                cellColor = colMapper.bgColorFromSubtotalValue(colTotal, []);
              } else if (opts.heatmapMode === 'col') {
                cellColor = colMapper.bgColorFromSubtotalValue(
                  colTotal,
                  [],
                  actualColKey
                );
              }

              if (cellColor) {
                valCss = cellColor;
              }
            }
          } else {
            if (opts.heatmapMode && colTotal !== 0) {
              if (
                opts.heatmapMode === 'col' &&
                colMapper.bgColorFromSubtotalValue
              ) {
                const cellColor = colMapper.bgColorFromSubtotalValue(
                  colTotal,
                  [],
                  actualColKey
                );
                if (cellColor) {
                  valCss = cellColor;
                }
              } else if (colMapper.totalColor) {
                const cellColor = colMapper.totalColor(actualColKey[0]);
                if (cellColor) {
                  valCss = cellColor;
                }
              }
            }
          }

          const tempAggregator = this.safeGetAggregator(pivotData, [], []);
          const format =
            tempAggregator && tempAggregator.format
              ? tempAggregator.format
              : x => x;

          let displayValue;
          if (colTotal === null || colTotal === 0) {
            displayValue = '';
          } else {
            displayValue = format ? format(colTotal) : colTotal;
          }

          cells.push(
            <td
              className={`pvtTotal ${
                isSubtotalCol || isCollapsedParent ? 'pvtSubtotal' : ''
              }`}
              key={`total-${i}`}
              style={valCss}
              onClick={colTotalCallbacks[flatKey(actualColKey)]}
            >
              {displayValue}
            </td>
          );
        } catch (error) {
          cells.push(<td className="pvtTotal" key={`total-${i}`} />);
        }
      });

      if (colTotals) {
        try {
          let grandTotal = 0;
          let validValuesFound = false;

          try {
            const grandTotalAggregator = pivotData.getAggregator([], []);
            if (grandTotalAggregator) {
              const val = grandTotalAggregator.value();
              if (val !== null && !isNaN(val)) {
                grandTotal = val;
                validValuesFound = true;
              }
            }
          } catch (e) {
            // Error getting grand total directly, will calculate manually
          }

          if (!validValuesFound) {
            pivotData.getRowKeys().forEach(rowKey => {
              pivotData.getColKeys().forEach(colKey => {
                try {
                  const agg = this.safeGetAggregator(pivotData, rowKey, colKey);
                  if (agg) {
                    const val = agg.value();
                    if (val !== null && !isNaN(val)) {
                      grandTotal += val;
                      validValuesFound = true;
                    }
                  }
                } catch (e) {
                  // Ignore errors for missing combinations
                }
              });
            });
          }

          const tempAggregator = this.safeGetAggregator(pivotData, [], []);
          const format =
            tempAggregator && tempAggregator.format
              ? tempAggregator.format
              : x => x;

          cells.push(
            <td
              className="pvtGrandTotal"
              key="grandTotal"
              style={
                opts.heatmapMode && colMapper.grandTotalColor
                  ? colMapper.grandTotalColor
                  : {}
              }
              onClick={grandTotalCallback}
            >
              {validValuesFound && grandTotal !== 0
                ? format
                  ? format(grandTotal)
                  : grandTotal
                : ''}
            </td>
          );
        } catch (error) {
          cells.push(<td className="pvtGrandTotal" key="grandTotal" />);
        }
      }

      return cells;
    }

    visibleKeys(keys, collapsed) {
      if (!opts.subtotals) {
        return keys;
      }

      const sortedKeys = keys.slice().sort((a, b) => {
        const minLength = Math.min(a.length, b.length);
        for (let i = 0; i < minLength; i++) {
          const aStr = String(a[i]);
          const bStr = String(b[i]);
          const cmp = aStr.localeCompare(bStr);
          if (cmp !== 0) {
            return cmp;
          }
        }
        return a.length - b.length;
      });

      const result = [];
      const processedKeys = new Set();

      for (const key of sortedKeys) {
        let parentCollapsed = false;
        let deepestCollapsedParent = null;

        for (let i = 0; i < key.length; i++) {
          const parentKey = key.slice(0, i + 1);
          const flatParentKey = flatKey(parentKey);
          if (collapsed[flatParentKey]) {
            parentCollapsed = true;
            deepestCollapsedParent = parentKey;
            break;
          }
        }

        if (parentCollapsed) {
          const flatParentKey = flatKey(deepestCollapsedParent);
          if (!processedKeys.has(flatParentKey)) {
            result.push(deepestCollapsedParent);
            processedKeys.add(flatParentKey);
          }
        } else {
          const flatKey_ = flatKey(key);
          if (!processedKeys.has(flatKey_)) {
            result.push(key);
            processedKeys.add(flatKey_);
          }
        }
      }

      const finalResult = [];
      const addedSubtotals = new Set();

      const parentGroups = new Map();
      for (const key of result) {
        for (let level = 1; level < key.length; level++) {
          const parentKey = key.slice(0, level);
          const parentKeyStr = flatKey(parentKey);

          if (!parentGroups.has(parentKeyStr)) {
            parentGroups.set(parentKeyStr, {
              key: parentKey,
              level: level,
              lastChildIndex: -1,
            });
          }
        }
      }

      for (let i = 0; i < result.length; i++) {
        const key = result[i];
        for (let level = 1; level < key.length; level++) {
          const parentKey = key.slice(0, level);
          const parentKeyStr = flatKey(parentKey);
          const parentGroup = parentGroups.get(parentKeyStr);

          if (parentGroup) {
            parentGroup.lastChildIndex = Math.max(
              parentGroup.lastChildIndex,
              i
            );
          }
        }
      }

      for (let i = 0; i < result.length; i++) {
        const key = result[i];
        finalResult.push(key);

        const subtotalsToAdd = [];

        for (let level = key.length - 1; level >= 1; level--) {
          const parentKey = key.slice(0, level);
          const parentKeyStr = flatKey(parentKey);
          const parentGroup = parentGroups.get(parentKeyStr);

          if (collapsed[parentKeyStr]) {
            continue;
          }

          if (parentGroup && parentGroup.lastChildIndex === i) {
            const subtotalKey = [...parentKey, '__subtotal__'];
            const subtotalKeyStr = flatKey(subtotalKey);

            if (!addedSubtotals.has(subtotalKeyStr)) {
              subtotalsToAdd.push(subtotalKey);
              addedSubtotals.add(subtotalKeyStr);
            }
          }
        }

        finalResult.push(...subtotalsToAdd);
      }

      return finalResult;
    }

    getSubtotal(rowKey, colKey, pivotSettings) {
      const {pivotData} = pivotSettings;
      return pivotData.getAggregator(rowKey, colKey).value();
    }

    hasSubtotals(rowOrCol, key, pivotSettings) {
      const {rowAttrs, colAttrs} = pivotSettings;
      const attrs = rowOrCol === 'row' ? rowAttrs : colAttrs;

      return key.length < attrs.length;
    }

    safeGetAggregator(pivotData, rowKey, colKey) {
      try {
        return pivotData.getAggregator(rowKey, colKey);
      } catch (error) {
        return null;
      }
    }

    calculateSubtotal(pivotData, rowKey, colKey, pivotSettings) {
      const {rowAttrs, colAttrs} = pivotSettings;

      if (
        rowKey.length === rowAttrs.length &&
        colKey.length === colAttrs.length
      ) {
        const agg = this.safeGetAggregator(pivotData, rowKey, colKey);
        return agg ? agg.value() : 0;
      }

      let total = 0;
      let hasValidValues = false;

      const childRowKeys = [];
      if (rowKey.length < rowAttrs.length) {
        pivotData.getRowKeys().forEach(fullRowKey => {
          let isChild = true;
          for (let i = 0; i < rowKey.length; i++) {
            if (fullRowKey[i] !== rowKey[i]) {
              isChild = false;
              break;
            }
          }

          if (isChild) {
            childRowKeys.push(fullRowKey);
          }
        });
      } else {
        childRowKeys.push(rowKey);
      }

      const childColKeys = [];
      if (colKey.length < colAttrs.length) {
        pivotData.getColKeys().forEach(fullColKey => {
          let isChild = true;
          for (let i = 0; i < colKey.length; i++) {
            if (fullColKey[i] !== colKey[i]) {
              isChild = false;
              break;
            }
          }

          if (isChild) {
            childColKeys.push(fullColKey);
          }
        });
      } else {
        childColKeys.push(colKey);
      }

      if (childRowKeys.length === 0 || childColKeys.length === 0) {
        const agg = this.safeGetAggregator(pivotData, rowKey, colKey);
        return agg ? agg.value() || 0 : 0;
      }

      childRowKeys.forEach(childRowKey => {
        childColKeys.forEach(childColKey => {
          const agg = this.safeGetAggregator(
            pivotData,
            childRowKey,
            childColKey
          );
          if (agg) {
            const val = agg.value();
            if (val !== null && !isNaN(val)) {
              total += val;
              hasValidValues = true;
            }
          }
        });
      });

      return hasValidValues ? total : 0;
    }

    render() {
      const pivotSettings = this.getBasePivotSettings();
      const {colAttrs, rowAttrs, rowKeys, colKeys, rowTotals} = pivotSettings;

      const renderedLabels = {};

      const visibleRowKeys = opts.subtotals
        ? this.visibleKeys(rowKeys, this.state.collapsedRows)
        : rowKeys;
      const visibleColKeys = opts.subtotals
        ? this.visibleKeys(colKeys, this.state.collapsedCols)
        : colKeys;

      const finalPivotSettings = Object.assign(
        {
          visibleRowKeys,
          maxRowVisible: Math.max(...visibleRowKeys.map(k => k.length)),
          visibleColKeys,
          maxColVisible: Math.max(...visibleColKeys.map(k => k.length)),
          rowAttrSpans: this.calcAttrSpans(visibleRowKeys, rowAttrs.length),
          colAttrSpans: this.calcAttrSpans(visibleColKeys, colAttrs.length),
        },
        pivotSettings
      );

      const rowspans = {};
      visibleRowKeys.forEach((rowKey, rowIdx) => {
        const isSubtotalRow = rowKey[rowKey.length - 1] === '__subtotal__';
        const actualRowKey = isSubtotalRow ? rowKey.slice(0, -1) : rowKey;

        for (let level = 0; level < actualRowKey.length; level++) {
          const cellKey = `${rowIdx}-${level}`;

          let span = 1;
          let j = rowIdx + 1;
          while (j < visibleRowKeys.length) {
            const nextKey = visibleRowKeys[j];
            const isNextSubtotal =
              nextKey[nextKey.length - 1] === '__subtotal__';
            const actualNextKey = isNextSubtotal
              ? nextKey.slice(0, -1)
              : nextKey;

            if (level >= actualNextKey.length) {
              break;
            }

            let matches = true;
            for (let l = 0; l <= level; l++) {
              if (
                l >= actualNextKey.length ||
                actualNextKey[l] !== actualRowKey[l]
              ) {
                matches = false;
                break;
              }
            }

            if (!matches) {
              break;
            }
            span++;
            j++;
          }

          rowspans[cellKey] = span;
        }
      });

      const renderedRows = visibleRowKeys.map((rowKey, i) => {
        const rowCells = [];

        const isSubtotalRow = rowKey[rowKey.length - 1] === '__subtotal__';
        const actualRowKey = isSubtotalRow ? rowKey.slice(0, -1) : rowKey;

        if (isSubtotalRow) {
          rowCells.push(
            <th
              key="subtotalLabel"
              className="pvtRowLabel pvtSubtotal"
              colSpan={rowAttrs.length - actualRowKey.length + 1}
            />
          );
        } else {
          for (let level = 0; level < actualRowKey.length; level++) {
            const labelKey = `${actualRowKey.slice(0, level + 1).join('|')}`;

            if (!renderedLabels[labelKey]) {
              renderedLabels[labelKey] = true;

              const cellKey = `${i}-${level}`;
              const rowspan = rowspans[cellKey] || 1;

              const flatRowKey = flatKey(actualRowKey.slice(0, level + 1));
              const isCollapsed = this.state.collapsedRows[flatRowKey];

              let className = 'pvtRowLabel';

              let icon = null;

              if (level + 1 < rowAttrs.length) {
                if (isCollapsed) {
                  className += ' collapsed';
                  icon = pivotSettings.arrowCollapsed;
                } else {
                  className += ' expanded';
                  icon = pivotSettings.arrowExpanded;
                }
                rowCells.push(
                  <th
                    key={`rowLabel-${level}`}
                    className={className}
                    rowSpan={rowspan}
                    onClick={this.toggleRowKey(flatRowKey)}
                    style={{cursor: 'pointer'}}
                  >
                    {icon && (
                      <span className="pvtAttr" style={{marginRight: '6px'}}>
                        {icon}
                      </span>
                    )}
                    <span>{actualRowKey[level]}</span>
                  </th>
                );
                continue;
              }

              const isLeafLevel =
                level === actualRowKey.length - 1 &&
                actualRowKey.length === rowAttrs.length;
              const leafColspan = isLeafLevel ? 2 : 1;

              rowCells.push(
                <th
                  key={`rowLabel-${level}`}
                  className={className}
                  rowSpan={rowspan}
                  colSpan={leafColspan}
                  onClick={this.toggleRowKey(flatRowKey)}
                >
                  {icon && <span className="pvtAttr">{icon}</span>}
                  <span>{actualRowKey[level]}</span>
                </th>
              );
            }
          }

          if (actualRowKey.length < rowAttrs.length) {
            rowCells.push(
              <th
                key="padding"
                className="pvtRowLabel"
                colSpan={rowAttrs.length - actualRowKey.length + 1}
              />
            );
          }
        }

        const dataCells = this.renderTableRow(rowKey, i, finalPivotSettings);

        return (
          <tr
            key={`row-${i}`}
            className={isSubtotalRow && opts.subtotals ? 'pvtSubtotalRow' : ''}
          >
            {rowCells}
            {dataCells}
          </tr>
        );
      });

      const colAttrsHeaders = colAttrs.map((attrName, i) => {
        return (
          <tr key={`colAttr-${i}`}>
            {this.renderColHeaderRow(attrName, i, finalPivotSettings)}
          </tr>
        );
      });

      let rowAttrsHeader = null;
      if (rowAttrs.length > 0) {
        rowAttrsHeader = (
          <tr key="rowAttr-0">{this.renderRowHeaderRow(finalPivotSettings)}</tr>
        );
      }

      let totalHeader = null;
      if (rowTotals) {
        totalHeader = (
          <tr key="total">{this.renderTotalsRow(finalPivotSettings)}</tr>
        );
      }

      return (
        <table className="pvtTable">
          <thead>
            {colAttrsHeaders}
            {rowAttrsHeader}
          </thead>
          <tbody>
            {renderedRows}
            {totalHeader}
          </tbody>
        </table>
      );
    }
  }

  SubtotalRenderer.defaultProps = Object.assign({}, PivotData.defaultProps, {
    tableColorScaleGenerator: redColorScaleGenerator,
    tableOptions: {},
  });
  SubtotalRenderer.propTypes = Object.assign({}, PivotData.propTypes, {
    tableColorScaleGenerator: PropTypes.func,
    tableOptions: PropTypes.object,
  });
  return SubtotalRenderer;
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
        const aggregator = pivotData.getAggregator(r, c);
        row.push(aggregator.value());
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
  'Table With Subtotal': makeRenderer({subtotals: true}),
  'Heatmap With Subtotal': makeRenderer({
    heatmapMode: 'full',
    subtotals: true,
  }),
  'Col Heatmap With Subtotal': makeRenderer({
    heatmapMode: 'col',
    subtotals: true,
  }),
  'Row Heatmap With Subtotal': makeRenderer({
    heatmapMode: 'row',
    subtotals: true,
  }),
  'Exportable TSV': TSVExportRenderer,
};
