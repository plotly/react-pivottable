import React from 'react';
import {PivotData} from './Utilities';
import createPlotlyComponent from 'plotly.js-react';

class PlotlyBarChartRenderer extends React.Component {
    render() {
        const pivotData = new PivotData(this.props);

        const rowKeys = pivotData.getRowKeys();
        if (rowKeys.length === 0) { rowKeys.push([]); }
        const colKeys = pivotData.getColKeys();
        if (colKeys.length === 0) { colKeys.push([]); }

        const data = rowKeys.map(rowKey => {
            const trace = {
                type: 'bar', name: rowKey.join('-'),
                x: [], y: []
            };
            for (const colKey of colKeys) {
                const val = parseFloat(pivotData.getAggregator(rowKey, colKey).value());
                trace.y.push(isFinite(val) ? val : null);
                trace.x.push(colKey.join('-'));
            }
            return trace;
        });

        const PlotlyComponent = createPlotlyComponent(this.props.Plotly);
        return <PlotlyComponent
            data={data}
            layout={{barmode: 'group'}}
        />;
    }
}

PlotlyBarChartRenderer.dependenciesAreMet = p => ('Plotly' in p) && ('version' in p.Plotly);

PlotlyBarChartRenderer.defaultProps = PivotData.defaultProps;

PlotlyBarChartRenderer.propTypes = PivotData.propTypes;

export default PlotlyBarChartRenderer;
