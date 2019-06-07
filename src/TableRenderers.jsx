import React from 'react';
import PropTypes from 'prop-types';
import {PivotData} from './Utilities';
import memoize from 'memoize-one';

// helper function for setting row/col-span in pivotTableRenderer
const sliceSame = function(arr, i1, i2, j) {
  // Compare a slice of the passed in column/row attribute array up to depth j.
  for (let x = 0; x <= j; x++) {
    if (arr[i1][x] !== arr[i2][x]) {
      return false;
    }
  }
  return true;
}

const spanSize = function(arr, i, j) {
  if (i !== 0 && sliceSame(arr, i, i - 1, j)) {
    return -1;
  }
  let k = i + 1;
  while (k < arr.length && sliceSame(arr, i, k, j)) {
    k++;
  }
  return k - i;
};

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
    getPivotSettings = memoize(props => {
      // One-time extraction of pivot settings that we'll use throughout the render.
        
      const pivotData = new PivotData(props);
      const colAttrs = pivotData.props.cols;
      const rowAttrs = pivotData.props.rows;
      const rowKeys = pivotData.getRowKeys();
      const colKeys = pivotData.getColKeys();

      const tableOptions = {
        rowTotals: true,
        colTotals: true,
        ...this.props.tableOptions
      };
      const rowTotals = tableOptions.rowTotals || colAttrs.length === 0;
      const colTotals = tableOptions.colTotals || rowAttrs.length === 0;

      return {
        pivotData,
        colAttrs,
        rowAttrs,
        colKeys,
        rowKeys,
        rowTotals,
        colTotals,
        ...this.heatmapMappers(
          pivotData, 
          this.props.tableColorScaleGenerator,
          colTotals,
          rowTotals,
        ),
      };
    });
      
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
          valueCellColors = (r, c, v) => rowColorScales[r.join(String.fromCharCode(0))](v);
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
          valueCellColors = (r, c, v) => colColorScales[c.join(String.fromCharCode(0))](v);
        }
      }
      return {valueCellColors, rowTotalColors, colTotalColors};
    }

    clickHandler = (value, rowValues, colValues) => {
      const colAttrs = this.props.cols;
      const rowAttrs = this.props.rows;
      if (this.props.tableOptions && this.props.tableOptions.clickCallback ) {
        const filters = {};
        for (const i of Object.keys(colAttrs)) {
          const attr = colAttrs[i];
          if (colValues[i] !== null) {
            filters[attr] = colValues[i];
          }
        }
        for (const i of Object.keys(rowAttrs)) {
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
      
      const {rowAttrs, colAttrs, colKeys, rowTotals} = pivotSettings;

      const spaceCell = (attrIdx === 0 && rowAttrs.length !== 0)
        ? (<th colSpan={rowAttrs.length} rowSpan={colAttrs.length}/>)
        : null;
    
      const attrNameCell = (<th className="pvtAxisLabel">{attrName}</th>);
    
      const rowSpan = (attrIdx === colAttrs.length - 1 && rowAttrs.length !== 0) ? 2 : 1;
      const attrValueCells = colKeys.map((c, i) => {
        const colSpan = spanSize(colKeys, i, attrIdx);
        if (colSpan !== -1) {
          return (
            <th
              className="pvtColLabel"
              key={`colKey${i}`}
              colSpan={colSpan}
              rowSpan={rowSpan}
            >
              {colKeys[i][attrIdx]}
            </th>
          )
        }
      });

      const totalCell = (attrIdx === 0 && rowTotals)
        ? (
          <th
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
      return <tr key={`colAttr${attrIdx}`}>{cells}</tr>;
    }
    
    renderRowHeaderRow = (pivotSettings) => {
      // Render just the attribute names of the rows (the actual attribute values
      // will show up in the individual rows).
        
      const {rowAttrs, colAttrs} = pivotSettings;
      return (
        <tr>
          {rowAttrs.map((r, i) => (
            <th className="pvtAxisLabel" key={`rowAttr${i}`}>
              {r}
            </th>
          ))}
          <th className="pvtTotalLabel">
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
        rowKeys, 
        colKeys, 
        pivotData,
        rowTotals,
        valueCellColors,
        rowTotalColors,
      } = pivotSettings;
        
      const attrValueCells = rowKey.map((r, i) => {
        const rowSpan = spanSize(rowKeys, rowIdx, i);
        if (rowSpan > 0) {
          const colSpan = (i === rowKey.length - 1 && colAttrs.length !== 0) ? 2 : 1;
          return (
            <th
              key={`rowKeyLabel${rowIdx}-${i}`}
              className="pvtRowLabel"
              rowSpan={rowSpan}
              colSpan={colSpan}
            >
              {r}
            </th>
          )
        }
      });
        
      const valueCells = colKeys.map((colKey, j) => {
        const agg = pivotData.getAggregator(rowKey, colKey);
        const aggValue = agg.value();
        const style = valueCellColors(rowKey, colKey, aggValue);
        return (
          <td
            className="pvtVal"
            key={`pvtVal${rowIdx}-${j}`}
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
        ...valueCells,
        totalCell,
      ];
        
      return (<tr key={`rowKeyRow${rowIdx}`}>{rowCells}</tr>);
    }

    renderTotalsRow = (pivotSettings) => {
      // Render the final totals rows that has the totals for all the columns.
        
      const {
        rowAttrs,
        colAttrs,
        colKeys,
        colTotalColors,
        rowTotals, 
        pivotData
      } = pivotSettings;
        
      const totalLabelCell = (
        <th
          className="pvtTotalLabel"
          colSpan={rowAttrs.length + Math.min(colAttrs.length, 1)}
        >
          Totals
        </th>
      );
        
      const totalValueCells = colKeys.map((colKey, j) => {
        const agg = pivotData.getAggregator([], colKey);
        const aggValue = agg.value();
        const style = colTotalColors([], colKey, aggValue);
        return (
          <td
            className="pvtTotal"
            key={`total${j}`}
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
        
      return (<tr>{totalCells}</tr>);
    }

    render() {
      const pivotSettings = this.getPivotSettings(this.props);
      const {colAttrs, rowAttrs, rowKeys, colTotals} = pivotSettings;
      return (
        <table className="pvtTable">
          <thead>
            {colAttrs.map((c, j) => this.renderColHeaderRow(c, j, pivotSettings))}
            {rowAttrs.length !== 0 && this.renderRowHeaderRow(pivotSettings)}
          </thead>
          <tbody>
            {rowKeys.map((r, i) => this.renderTableRow(r, i, pivotSettings))}
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
  Table: makeRenderer(),
  'Table Heatmap': makeRenderer({heatmapMode: 'full'}),
  'Table Col Heatmap': makeRenderer({heatmapMode: 'col'}),
  'Table Row Heatmap': makeRenderer({heatmapMode: 'row'}),
  'Exportable TSV': TSVExportRenderer,
};
