import React from 'react';
import PivotTableUI from './PivotTableUI';


export default class PivotTableUISmartWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = props;
    }

    render() {
        return (<PivotTableUI {...this.state} onChange={s => this.setState(s)} />);
    }
}
