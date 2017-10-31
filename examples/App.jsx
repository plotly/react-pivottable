import React from 'react';
import mps from './mps';
import PivotTableUI from '../src/PivotTableUI';
import '../src/pivottable.css';

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = props;
    }

    render() {
        return <PivotTableUI Plotly={window.Plotly}
            data={mps} {...this.state}
            onChange={s => this.setState(s)} />;
    }
}
