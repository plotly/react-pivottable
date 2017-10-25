import React from 'react';
import {PivotData} from './Utilities';
import createPlotlyComponent from 'react-plotly.js/factory';

function makeRenderer(name, traceOptions = {}, layoutOptions = {}, transpose = false) {

    class PlotlyBaseRenderer extends React.Component {

        static defaultRendererName = () => name;

        componentWillMount() {
            this.PlotlyComponent = createPlotlyComponent(this.props.Plotly);
            this.pivotData = new PivotData(this.props);
        }

        componentWillUpdate(nextProps) {
            this.pivotData = new PivotData(nextProps);
        }

        static dependenciesAreMet = p => ('Plotly' in p) && ('version' in p.Plotly);

        render() {
            const rowKeys = this.pivotData.getRowKeys();
            const colKeys = this.pivotData.getColKeys();
            const traceKeys = transpose ? colKeys : rowKeys;
            if (traceKeys.length === 0) { traceKeys.push([]); }
            const datumKeys = transpose ? rowKeys : colKeys;
            if (datumKeys.length === 0) { datumKeys.push([]); }

            let fullAggName = this.props.aggregatorName;
            const numInputs = this.props.aggregators[this.props.aggregatorName]([])().numInputs;
            if (numInputs !== null && numInputs !== 0 && this.props.vals.length) {
                fullAggName += ` of ${this.props.vals.join(', ')}`;
            }

            const data = traceKeys.map(traceKey => {
                const values = [];
                const labels = [];
                for (const datumKey of datumKeys) {
                    const val = parseFloat(this.pivotData.getAggregator(
                        transpose ? datumKey : traceKey,
                        transpose ? traceKey : datumKey
                    ).value());
                    values.push(isFinite(val) ? val : null);
                    labels.push(datumKey.join('-') || ' ');
                }
                const trace = {name: traceKey.join('-') || fullAggName};
                trace.x = transpose ? values : labels;
                trace.y = transpose ? labels : values;
                return Object.assign(trace, traceOptions);
            });

            let titleText = fullAggName;
            const hAxisTitle = transpose ? this.props.rows.join('-') : this.props.cols.join('-');
            const groupByTitle = transpose ? this.props.cols.join('-') : this.props.rows.join('-');
            if (hAxisTitle !== '') { titleText += ` vs ${hAxisTitle}`; }
            if (groupByTitle !== '') { titleText += ` by ${groupByTitle}`; }

            const layout = {
                title: titleText,
                // eslint-disable-next-line no-magic-numbers
                width: window.innerWidth / 1.5, height: window.innerHeight / 1.4 - 50
            };

            // eslint-disable-next-line no-magic-numbers
            if (transpose) { layout.xaxis = {domain: [0.1, 1.0], title: fullAggName}; }
            else { layout.yaxis = {title: fullAggName}; }

            return <this.PlotlyComponent data={data}
                layout={Object.assign(layout, layoutOptions)}
            />;
        }
    }

    PlotlyBaseRenderer.defaultProps = PivotData.defaultProps;
    PlotlyBaseRenderer.propTypes = PivotData.propTypes;

    return PlotlyBaseRenderer;
}

export default [
    makeRenderer('Grouped Column Chart', {type: 'bar'}, {barmode: 'group'}),
    makeRenderer('Stacked Column Chart', {type: 'bar'}, {barmode: 'stack'}),
    makeRenderer('Grouped Bar Chart',
        {type: 'bar', orientation: 'h'}, {barmode: 'group'}, true),
    makeRenderer('Stacked Bar Chart',
        {type: 'bar', orientation: 'h'}, {barmode: 'stack'}, true),
    makeRenderer('Line Chart'),
    makeRenderer('Dot Chart', {mode: 'markers'}, {}, true)
];
