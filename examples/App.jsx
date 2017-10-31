import React from 'react';
import mps from './mps';
import {derivers} from '../src/Utilities';
import TableRenderers from '../src/TableRenderers';
import createPlotlyComponent from 'react-plotly.js/factory';
import createPlotlyRenderers from '../src/PlotlyRenderers';
import PivotTableUI from '../src/PivotTableUI';
import '../src/pivottable.css';

const Plot = createPlotlyComponent(window.Plotly);

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = props;
    }

    render() {
        return <PivotTableUI
            data={mps}
            renderers={Object.assign({}, TableRenderers, createPlotlyRenderers(Plot))}
            derivedAttributes={{"Age Bin": derivers.bin("Age", 10)}}
            {...this.state}
            onChange={s => this.setState(s)} />;
    }
}
