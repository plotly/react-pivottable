import React from 'react';
import mps from './mps'
import PivotTableUISmartWrapper from '../src/PivotTableUISmartWrapper';


export default class App extends React.Component {

    render() {
        return <PivotTableUISmartWrapper data={mps} Plotly={window.Plotly} />;
    }
}
