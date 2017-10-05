import React from 'react';
import {PivotData} from './Utilities';
import './pivottable.css';


// helper function for setting row/col-span in pivotTableRenderer
const spanSize = function(arr, i, j) {
    let x;
    if (i !== 0) {
        let asc, end;
        let noDraw = true;
        for (x = 0, end = j, asc = end >= 0; asc ? x <= end : x >= end; asc ? x++ : x--) {
            if (arr[i - 1][x] !== arr[i][x]) {
                noDraw = false;
            }
        }
        if (noDraw) {
            return -1;
        }
    }
    let len = 0;
    while ((i + len) < arr.length) {
        let asc1, end1;
        let stop = false;
        for (x = 0, end1 = j, asc1 = end1 >= 0; asc1 ? x <= end1 : x >= end1; asc1 ? x++ : x--) {
            if (arr[i][x] !== arr[i + len][x]) { stop = true; }
        }
        if (stop) { break; }
        len++;
    }
    return len;
};

class TableRenderer extends React.Component {

    static defaultRendererName = () => 'Table';

    render() {
        const pivotData = new PivotData(this.props);
        const colAttrs = pivotData.props.cols;
        const rowAttrs = pivotData.props.rows;
        const rowKeys = pivotData.getRowKeys();
        const colKeys = pivotData.getColKeys();
        const grandTotalAggregator = pivotData.getAggregator([], []);
        return (
            <table className="pvtTable">
                <thead>
                    {colAttrs.map(function(c, j) { return (
                        <tr key={`colAttr${j}`}>
                            {(j === 0 && rowAttrs.length !== 0) &&
                            <th colSpan={rowAttrs.length} rowSpan={colAttrs.length} />
                            }
                            <th className="pvtAxisLabel">{c}</th>
                            {colKeys.map(function(colKey, i) {
                                const x = spanSize(colKeys, i, j);
                                if (x === -1) {return null;}
                                return <th className="pvtColLabel" key={`colKey${i}`}
                                    colSpan={x} rowSpan={j === colAttrs.length - 1 && rowAttrs.length !== 0 ? 2 : 1}
                                >
                                    {colKey[j]}
                                </th>;
                            })}

                            {(j === 0) &&
                            <th className="pvtTotalLabel"
                                rowSpan={colAttrs.length + (rowAttrs.length === 0 ? 0 : 1)}
                            >Totals</th>
                            }
                        </tr>
                    );})}

                    {(rowAttrs.length !== 0) &&
          <tr>
              {rowAttrs.map(function(r, i) {
                  return <th className="pvtAxisLabel" key={`rowAttr${i}`}>{r}</th>;
              })}
              <th className="pvtTotalLabel">{colAttrs.length === 0 ? 'Totals' : null}</th>
          </tr>
                    }
                </thead>

                <tbody>
                    {rowKeys.map(function(rowKey, i) {
                        const totalAggregator = pivotData.getAggregator(rowKey, []);
                        return (
                            <tr key={`rowKeyRow${i}`}>
                                {rowKey.map(function(txt, j) {
                                    const x = spanSize(rowKeys, i, j);
                                    if (x === -1) {return null;}
                                    return <th key={`rowKeyLabel${i}-${j}`} className="pvtRowLabel"
                                        rowSpan={x} colSpan={j === rowAttrs.length - 1 && colAttrs.length !== 0 ? 2 : 1}
                                    >{txt}</th>;
                                })}
                                {colKeys.map(function(colKey, j) {
                                    const aggregator = pivotData.getAggregator(rowKey, colKey);
                                    return <td className="pvtVal" key={`pvtVal${i}-${j}`}>
                                        {aggregator.format(aggregator.value())}</td>;
                                })}
                                <td className="pvtTotal">{totalAggregator.format(totalAggregator.value())}</td>
                            </tr>
                        );
                    })}

                    <tr>
                        <th className="pvtTotalLabel"
                            colSpan={rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)}
                        >Totals</th>

                        {colKeys.map(function(colKey, i) {
                            const totalAggregator = pivotData.getAggregator([], colKey);
                            return <td className="pvtTotal" key={`total${i}`}>
                                {totalAggregator.format(totalAggregator.value())}
                            </td>;
                        })}

                        <td className="pvtGrandTotal">{grandTotalAggregator.format(grandTotalAggregator.value())}</td>
                    </tr>
                </tbody>
            </table>
        );
    }
}

TableRenderer.defaultProps = PivotData.defaultProps;

TableRenderer.propTypes = PivotData.propTypes;

export default TableRenderer;
