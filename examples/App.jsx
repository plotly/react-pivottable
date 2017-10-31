import React from 'react';
import mps from './mps';
import PivotTableUI from '../src/PivotTableUI';
import TableRenderers from '../src/TableRenderers';
import createPlotlyRenderers from '../src/PlotlyRenderers';
import '../src/pivottable.css';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = props;
    }

    render() {
        return <PivotTableUI
            data={mps}
            renderers={Object.assign({}, TableRenderers, createPlotlyRenderers(window.Plotly))}
            {...this.state}
            onChange={s => this.setState(s)} />;
    }
}
