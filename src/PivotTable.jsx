import React, {Component} from 'react';
import {PivotData} from '../src/Utilities';
import TableRenderer from '../src/TableRenderer';


export default class PivotTable extends Component {
    render() {
        return <TableRenderer pivotData={new PivotData(this.props)} />;
    }
}
