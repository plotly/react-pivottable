import React from 'react';
import {PivotData} from './Utilities';

function makeRenderer(PlotlyComponent, traceOptions = {}, layoutOptions = {}, transpose = false) {

    class Renderer extends React.PureComponent {

        componentWillMount() { this.pivotData = new PivotData(this.props); }

        componentWillUpdate(nextProps) { this.pivotData = new PivotData(nextProps); }

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
                hovermode: 'closest',
                // eslint-disable-next-line no-magic-numbers
                width: window.innerWidth / 1.5, height: window.innerHeight / 1.4 - 50
            };

            // eslint-disable-next-line no-magic-numbers
            if (transpose) { layout.xaxis = {domain: [0.1, 1.0], title: fullAggName}; }
            else { layout.yaxis = {title: fullAggName}; }

            return <PlotlyComponent data={data}
                layout={Object.assign(layout, layoutOptions)}
            />;
        }
    }

    Renderer.defaultProps = PivotData.defaultProps;
    Renderer.propTypes = PivotData.propTypes;

    return Renderer;
}

function makeScatterRenderer(PlotlyComponent) {

    class Renderer extends React.PureComponent {

        componentWillMount() { this.pivotData = new PivotData(this.props); }

        componentWillUpdate(nextProps) { this.pivotData = new PivotData(nextProps); }

        render() {
            const rowKeys = this.pivotData.getRowKeys();
            const colKeys = this.pivotData.getColKeys();
            if (rowKeys.length === 0) { rowKeys.push([]); }
            if (colKeys.length === 0) { colKeys.push([]); }

            const data = {x: [], y:[], text: [], type: 'scatter', mode: 'markers'};

            rowKeys.map(rowKey => {
                colKeys.map(colKey => {
                    const v = this.pivotData.getAggregator(rowKey, colKey).value();
                    if(v !== null) {
                        data.x.push(colKey.join("-"));
                        data.y.push(rowKey.join("-"));
                        data.text.push(v);
                    }
                });
            });

            const layout = {
                title: this.props.rows.join("-") + " vs " + this.props.cols.join("-"),
                hovermode: 'closest',
                xaxis: {title: this.props.cols.join("-"), domain: [0.1, 1.0]},
                yaxis: {title: this.props.rows.join("-")},
                // eslint-disable-next-line no-magic-numbers
                width: window.innerWidth / 1.5, height: window.innerHeight / 1.4 - 50
            };

            return <PlotlyComponent data={[data]}
                layout={layout}
            />;
        }
    }

    Renderer.defaultProps = PivotData.defaultProps;
    Renderer.propTypes = PivotData.propTypes;

    return Renderer;
}

export default function createPlotlyRenderers(PlotlyComponent) {
    return {
        'Grouped Column Chart': makeRenderer(PlotlyComponent, {type: 'bar'}, {barmode: 'group'}),
        'Stacked Column Chart': makeRenderer(PlotlyComponent, {type: 'bar'}, {barmode: 'stack'}),
        'Grouped Bar Chart': makeRenderer(PlotlyComponent, {type: 'bar', orientation: 'h'},
            {barmode: 'group'}, true),
        'Stacked Bar Chart': makeRenderer(PlotlyComponent, {type: 'bar', orientation: 'h'},
            {barmode: 'stack'}, true),
        'Line Chart': makeRenderer(PlotlyComponent, ),
        'Dot Chart': makeRenderer(PlotlyComponent, {mode: 'markers'}, {}, true),
        'Scatter Chart': makeScatterRenderer(PlotlyComponent)
    }
}
