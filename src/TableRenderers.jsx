import React from 'react';
import PropTypes from 'prop-types';
import {PivotData, flatKey} from './Utilities';
import memoize from 'memoize-one';

function redColorScaleGenerator(values) {
  const min = Math.min.apply(Math, values);
  const max = Math.max.apply(Math, values);
  return x => {
    // eslint-disable-next-line no-magic-numbers
    const nonRed = 255 - Math.round(255 * (x - min) / (max - min));
    return {backgroundColor: `rgb(255,${nonRed},${nonRed})`};
  };
}

function makeRenderer(opts = {}) {
  class TableRenderer extends React.Component {
    constructor(props) {
      super(props);
        
      // We need state to record which entries are collapsed and which aren't.
      // This is an object with flat-keys indicating if the corresponding rows
      // should be collapsed.
      this.state = {collapsedRows: {}, collapsedCols: {}};
    }

    getBasePivotSettings = memoize(props => {
      // One-time extraction of pivot settings that we'll use throughout the render.
        
      const colAttrs = this.props.cols;
      const rowAttrs = this.props.rows;

      const tableOptions = {
        rowTotals: true,
        colTotals: true,
        ...this.props.tableOptions
      };
      const rowTotals = tableOptions.rowTotals || colAttrs.length === 0;
      const colTotals = tableOptions.colTotals || rowAttrs.length === 0;

      const subtotalOptions = {
        arrowCollapsed: "\u25B6",
        arrowExpanded: "\u25E2",
        ...this.props.subtotalOptions
      };
      const colSubtotalDisplay = {
        displayOnTop: true,
        enabled: colTotals,  // by default enable if col totals are enabled.
        hideOnExpand: false,
        ...subtotalOptions.colSubtotalDisplay
      };
      const rowSubtotalDisplay = {
        displayOnTop: false,
        enabled: rowTotals,  // by default enable if row totals are enabled.
        hideOnExpand: false,
        ...subtotalOptions.rowSubtotalDisplay
      };

      const pivotData = new PivotData(
          props,
          (!opts.subtotals) ? {} : {
            rowEnabled: rowSubtotalDisplay.enabled,
            colEnabled: colSubtotalDisplay.enabled,
            rowPartialOnTop: rowSubtotalDisplay.displayOnTop,
            colPartialOnTop: colSubtotalDisplay.displayOnTop,
          },
      );
      const rowKeys = pivotData.getRowKeys();
      const colKeys = pivotData.getColKeys();

      return {
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
        ...this.heatmapMappers(
          pivotData, 
          this.props.tableColorScaleGenerator,
          colTotals,
          rowTotals,
        ),
      };
    });

    toggleAttr = (rowOrCol, attrIdx, allKeys) => () => {
      // Toggle an entire attribute. This only collapses the entire
      // attribute. Important to keep things snappy.
      
      const keyLen = attrIdx + 1;
      const collapsed = allKeys.filter(k => k.length == keyLen).map(flatKey);
        
      const updates = {};
      collapsed.forEach(k => {updates[k] = true;});
        
      if (rowOrCol) {
        this.setState(state => ({collapsedRows: {...state.collapsedRows, ...updates}}));
      } else {
        this.setState(state => ({collapsedCols: {...state.collapsedCols, ...updates}}));
      }
    }
      
    toggleRowKey = flatRowKey => () => {
      this.setState(state => (
        {collapsedRows: {...state.collapsedRows, [flatRowKey]: !state.collapsedRows[flatRowKey]}}
      ))
    }
                    
    toggleColKey = flatColKey => () => {
      this.setState(state => (
        {collapsedCols: {...state.collapsedCols, [flatColKey]: !state.collapsedCols[flatColKey]}}
      ))
    }
                    
    calcAttrSpans = (attrArr, numAttrs) => {
      // Given an array of attribute values (i.e. each element is another array with
      // the value at every level), compute the spans for every attribute value at
      // every level. The return value is a nested array of the same shape. It has
      // -1's for repeated values and the span number otherwise.
    
      const spans = [];
      const li = Array(numAttrs).map(() => 0);  // Index of the last new value
      let lv = Array(numAttrs).map(() => null);
      for(let i = 0;i < attrArr.length;i++) {
        // Keep increasing span values as long as the last keys are the same. For
        // the rest, record spans of 1. Update the indices too.
        let cv = attrArr[i];
        let ent = [];
        let depth = 0;
        const limit = Math.min(lv.length, cv.length);
        while (depth < limit && lv[depth] === cv[depth]) {
          ent.push(-1);
          spans[li[depth]][depth]++;
          depth++;
        }
        while (depth < cv.length) {
          li[depth] = i;
          ent.push(1);
          depth++;
        }
        spans.push(ent);
        lv = cv;
      }
      return spans;
    }
      
    heatmapMappers = (pivotData, colorScaleGenerator, colTotals, rowTotals) => {
      let valueCellColors = () => {};
      let rowTotalColors = () => {};
      let colTotalColors = () => {};
      if (opts.heatmapMode) {
        if (colTotals) {
          const colTotalValues = Object.values(pivotData.colTotals).map(a => a.value());
          colTotalColors = colorScaleGenerator(colTotalValues);
        }
        if (rowTotals) {
          const rowTotalValues = Object.values(pivotData.rowTotals).map(a => a.value());
          rowTotalColors = colorScaleGenerator(rowTotalValues);
        }
        if (opts.heatmapMode === 'full') {
          const allValues = [];
          Object.values(pivotData.tree).map(cd =>
            Object.values(cd).map(a => allValues.push(a.value()))
          );
          const colorScale = colorScaleGenerator(allValues);
          valueCellColors = (r, c, v) => colorScale(v);
        } else if (opts.heatmapMode === 'row') {
          const rowColorScales = {};
          Object.entries(pivotData.tree).map(([rk, cd]) => {
            const rowValues = Object.values(cd).map(a => a.value());
            rowColorScales[rk] = colorScaleGenerator(rowValues);
          });
          valueCellColors = (r, c, v) => rowColorScales[flatKey(r)](v);
        } else if (opts.heatmapMode === 'col') {
          const colColorScales = {};
          const colValues = {};
          Object.values(pivotData.tree).map(cd =>
            Object.entries(cd).map(([ck, a]) => {
              if (!(ck in colValues)) {
                colValues[ck] = [];
              }
              colValues[ck].push(a.value());
            })
          );
          for (const k in colValues) {
            colColorScales[k] = colorScaleGenerator(colValues[k]);
          }
          valueCellColors = (r, c, v) => colColorScales[flatKey(c)](v);
        }
      }
      return {valueCellColors, rowTotalColors, colTotalColors};
    }

    clickHandler = (value, rowValues, colValues) => {
      const colAttrs = this.props.cols;
      const rowAttrs = this.props.rows;
      if (this.props.tableOptions && this.props.tableOptions.clickCallback) {
        const filters = {};
        const colLimit = Math.min(colAttrs.length, colValues.length);
        for (let i = 0; i < colLimit;i++) {
          const attr = colAttrs[i];
          if (colValues[i] !== null) {
            filters[attr] = colValues[i];
          }
        }
        const rowLimit = Math.min(rowAttrs.length, rowValues.length);
        for (let i = 0; i < rowLimit;i++) {
          const attr = rowAttrs[i];
          if (rowValues[i] !== null) {
            filters[attr] = rowValues[i];
          }
        }
        return e =>
          tableOptions.clickCallback(
            e,
            value,
            filters,
            pivotData
          );
      } else {
        return null;
      }
    }

    renderColHeaderRow = (attrName, attrIdx, pivotSettings) => {
      // Render a single row in the column header at the top of the pivot table.
      
      const {
        rowAttrs, 
        colAttrs,
        colKeys,
        visibleColKeys,
        colAttrSpans,
        rowTotals,
        arrowExpanded,
        arrowCollapsed,
      } = pivotSettings;

      const spaceCell = (attrIdx === 0 && rowAttrs.length !== 0)
        ? (<th key="padding" colSpan={rowAttrs.length} rowSpan={colAttrs.length}/>)
        : null;
    
      const needLabelToggle = opts.subtotals && attrIdx !== colAttrs.length - 1;
      const attrNameCell = (
        <th 
          key="label" 
          className="pvtAxisLabel" 
          onClick={needLabelToggle ? this.toggleAttr(false, attrIdx, colKeys) : null}
        >
          {needLabelToggle ? arrowExpanded + ' ' : null} {attrName}
        </th>
      );
    
      const attrValueCells = [];
      const rowIncrSpan = (rowAttrs.length !== 0) ? 1 : 0;
      // Iterate through columns. Jump over duplicate values.
      let i = 0;
      while (i < visibleColKeys.length) {
        const colKey = visibleColKeys[i]
        const colSpan = (attrIdx < colKey.length) ? colAttrSpans[i][attrIdx] : 1;
        if (attrIdx < colKey.length) {
          const rowSpan = 1 + ((attrIdx === colAttrs.length - 1) ? rowIncrSpan : 0);
          const flatColKey = flatKey(colKey.slice(0, attrIdx + 1));
          const needColToggle = opts.subtotals && attrIdx !== colAttrs.length - 1;
          const onClick = needColToggle ? this.toggleColKey(flatColKey) : null;
          attrValueCells.push(
            <th
              className="pvtColLabel"
              key={'colKey-' + flatColKey}
              colSpan={colSpan}
              rowSpan={rowSpan}
              onClick={onClick}
            >
              {needColToggle ? (this.state.collapsedCols[flatColKey] ? arrowCollapsed : arrowExpanded) + ' ' : null}
              {colKey[attrIdx]}
            </th>
          )
        } else if (attrIdx === colKey.length) {
          const rowSpan = colAttrs.length - colKey.length + rowIncrSpan;
          attrValueCells.push(
            <th
              className="pvtColLabel"
              key={'colKeyBuffer-' + flatKey(colKey)}
              colSpan={colSpan}
              rowSpan={rowSpan}
            />
          )
        }
        i = i + colSpan;  // The next colSpan columns will have the same value anyway...
      };

      const totalCell = (attrIdx === 0 && rowTotals)
        ? (
          <th
            key="total"
            className="pvtTotalLabel"
            rowSpan={colAttrs.length + Math.min(rowAttrs.length, 1)}
          >
            Totals
          </th>
        )
        : null;

      const cells = [
          spaceCell,
          attrNameCell,
          ...attrValueCells,
          totalCell,
      ];
      return <tr key={`colAttr-${attrIdx}`}>{cells}</tr>;
    }
    
    renderRowHeaderRow = (pivotSettings) => {
      // Render just the attribute names of the rows (the actual attribute values
      // will show up in the individual rows).
        
      const {rowAttrs, colAttrs, rowKeys, arrowExpanded} = pivotSettings;
      return (
        <tr key="rowHdr">
          {rowAttrs.map((r, i) => {
            const needLabelToggle = opts.subtotals && i !== rowAttrs.length - 1;
            return (
              <th 
                className="pvtAxisLabel" 
                key={`rowAttr-${i}`}
                onClick={needLabelToggle ? this.toggleAttr(true, i, rowKeys) : null}
              >
                {needLabelToggle ? arrowExpanded + ' ': null} {r}
              </th>
            );
          })}
          <th className="pvtTotalLabel" key="padding">
            {colAttrs.length === 0 ? 'Totals' : null}
          </th>
        </tr>
      );
    }
    
    renderTableRow = (rowKey, rowIdx, pivotSettings) => {
      // Render a single row in the pivot table.
        
      const {
        rowAttrs, 
        colAttrs, 
        visibleRowKeys, 
        rowAttrSpans,
        visibleColKeys, 
        pivotData,
        rowTotals,
        valueCellColors,
        rowTotalColors,
        arrowExpanded,
        arrowCollapsed,
      } = pivotSettings;
        
      const colIncrSpan = (colAttrs.length !== 0) ? 1 : 0
      const attrValueCells = rowKey.map((r, i) => {
        const rowSpan = rowAttrSpans[rowIdx][i];
        if (rowSpan > 0) {
          const flatRowKey = flatKey(rowKey.slice(0, i + 1));
          const colSpan = 1 + ((i === rowAttrs.length - 1) ? colIncrSpan : 0);
          const needRowToggle = opts.subtotals && i !== rowAttrs.length - 1
          const onClick = needRowToggle ? this.toggleRowKey(flatRowKey) : null;
          return (
            <th
              key={`rowKeyLabel-${i}`}
              className="pvtRowLabel"
              rowSpan={rowSpan}
              colSpan={colSpan}
              onClick={onClick}
            >
              {needRowToggle ? (this.state.collapsedRows[flatRowKey] ? arrowCollapsed : arrowExpanded) + ' ': null}
              {r}
            </th>
          )
        }
      });
    
      const attrValuePaddingCell = (rowKey.length < rowAttrs.length)
        ? (
          <th
            className="pvtRowLabel"
            key="rowKeyBuffer"
            colSpan={rowAttrs.length - rowKey.length + colIncrSpan}
            rowSpan={1}
          />
        )
        : null;
        
      const valueCells = visibleColKeys.map((colKey, j) => {
        const agg = pivotData.getAggregator(rowKey, colKey);
        const aggValue = agg.value();
        const style = valueCellColors(rowKey, colKey, aggValue);
        return (
          <td
            className="pvtVal"
            key={"pvtVal-" + flatKey(colKey)}
            onClick={this.clickHandler(aggValue, rowKey, colKey)}
            style={style}
          >
            {agg.format(aggValue)}
          </td>
        );
      });
        
      let totalCell = null;
      if (rowTotals) {
        const agg = pivotData.getAggregator(rowKey, []);
        const aggValue = agg.value();
        const style = rowTotalColors(aggValue);
        totalCell = (
          <td
            key="total"
            className="pvtTotal"
            onClick={this.clickHandler(aggValue, rowKey, [])}
            style={style}
          >
            {agg.format(aggValue)}
          </td>
        );
      }
        
      const rowCells = [
        ...attrValueCells,
        attrValuePaddingCell,
        ...valueCells,
        totalCell,
      ];

      return (<tr key={'keyRow-' + flatKey(rowKey)}>{rowCells}</tr>);
    }

    renderTotalsRow = (pivotSettings) => {
      // Render the final totals rows that has the totals for all the columns.
        
      const {
        rowAttrs,
        colAttrs,
        visibleColKeys,
        colTotalColors,
        rowTotals, 
        pivotData
      } = pivotSettings;
        
      const totalLabelCell = (
        <th
          key="label"
          className="pvtTotalLabel"
          colSpan={rowAttrs.length + Math.min(colAttrs.length, 1)}
        >
          Totals
        </th>
      );
        
      const totalValueCells = visibleColKeys.map((colKey, j) => {
        const agg = pivotData.getAggregator([], colKey);
        const aggValue = agg.value();
        const style = colTotalColors([], colKey, aggValue);
        return (
          <td
            className="pvtTotal"
            key={"total-" + flatKey(colKey)}
            onClick={this.clickHandler(aggValue, [], colKey)}
            style={style}
          >
            {agg.format(aggValue)}
          </td>
        );
      });
        
      let grandTotalCell = null;
      if (rowTotals) {
        const agg = pivotData.getAggregator([], []);
        const aggValue = agg.value();
        grandTotalCell = (
          <td
            key="total"
            className="pvtGrandTotal"
            onClick={this.clickHandler(aggValue, [], [])}
          >
            {agg.format(aggValue)}
          </td>
        );
      }
        
      const totalCells = [
        totalLabelCell,
        ...totalValueCells,
        grandTotalCell,
      ];

      return (<tr key="total">{totalCells}</tr>);
    }

    visibleKeys = (keys, collapsed, numAttrs, subtotalDisplay) => keys.filter(
      key => (
        // Is the key hidden by one of its parents?
        !key.slice(0, key.length - 1).some(
          (k, j) => collapsed[flatKey(key.slice(0, j + 1))]
        )
        && (
          key.length == numAttrs            // Leaf key.
          || flatKey(key) in collapsed      // Children hidden. Must show total.
          || !subtotalDisplay.hideOnExpand  // Don't hide totals.
        )
      )
    )
      
    render() {
      const basePivotSettings = this.getBasePivotSettings(this.props);
      const {
        colAttrs, 
        rowAttrs, 
        rowKeys, 
        colKeys, 
        colTotals,
        rowSubtotalDisplay,
        colSubtotalDisplay,
      } = basePivotSettings;
        
      // Need to account for exclusions to compute the effective row
      // and column keys.
      const visibleRowKeys = opts.subtotals
        ? this.visibleKeys(
            rowKeys,
            this.state.collapsedRows,
            rowAttrs.length,
            rowSubtotalDisplay,
          )
        : rowKeys;
      const visibleColKeys = opts.subtotals
        ? this.visibleKeys(
            colKeys,
            this.state.collapsedCols,
            colAttrs.length,
            colSubtotalDisplay,
          )
        : colKeys;
      const pivotSettings = {
        visibleRowKeys,
        visibleColKeys,
        rowAttrSpans: this.calcAttrSpans(visibleRowKeys, rowAttrs.length),
        colAttrSpans: this.calcAttrSpans(visibleColKeys, colAttrs.length),
        ...basePivotSettings,
      };

      return (
        <table className="pvtTable">
          <thead>
            {colAttrs.map((c, j) => this.renderColHeaderRow(c, j, pivotSettings))}
            {rowAttrs.length !== 0 && this.renderRowHeaderRow(pivotSettings)}
          </thead>
          <tbody>
            {visibleRowKeys.map((r, i) => this.renderTableRow(r, i, pivotSettings))}
            {colTotals && this.renderTotalsRow(pivotSettings)}
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
  'Table': makeRenderer(),
  'Table Heatmap': makeRenderer({heatmapMode: 'full'}),
  'Table Col Heatmap': makeRenderer({heatmapMode: 'col'}),
  'Table Row Heatmap': makeRenderer({heatmapMode: 'row'}),
  'Table With Subtotal': makeRenderer({subtotals: true}),
  'Table With Subtotal Heatmap': makeRenderer({heatmapMode: 'full', subtotals: true}),
  'Table With Subtotal Col Heatmap': makeRenderer({heatmapMode: 'col', subtotals: true}),
  'Table With Subtotal Row Heatmap': makeRenderer({heatmapMode: 'row', subtotals: true}),
  'Exportable TSV': TSVExportRenderer,
};
