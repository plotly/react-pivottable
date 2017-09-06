import React from 'react';
import {PivotData} from './Utilities';
import TableRenderer from './TableRenderer';


export default class PivotTable extends React.Component {
    render() {
        return <TableRenderer pivotData={new PivotData(this.props)} />;
    }
}
