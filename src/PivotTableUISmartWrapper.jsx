import React from 'react';
import PivotTableUI from './PivotTableUI';


class PivotTableUISmartWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = props;
    }

    render() {
        return (<PivotTableUI {...this.state} onChange={s => this.setState(s)} />);
    }
}

PivotTableUISmartWrapper.defaultProps = PivotTableUI.defaultProps;

PivotTableUISmartWrapper.propTypes = PivotTableUI.propTypes;

export default PivotTableUISmartWrapper;
