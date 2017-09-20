import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import {PivotData, aggregators} from './Utilities';
import DnDCell from './DnDCell';
import TableRenderer from './TableRenderer';
import './pivottable.css';


class PivotTableUI extends React.Component {
    componentWillMount() {
        this.materializeInput(this.props.data);
    }

    componentWillUpdate(nextProps) {
        this.materializeInput(nextProps.data);
    }

    materializeInput(nextData) {
        if (this.data === nextData) { return; }
        this.data = nextData;
        const attrValues = {};
        const materializedInput = [];
        let recordsProcessed = 0;
        PivotData.forEachRecord(this.data, {}, function(record) {
            materializedInput.push(record);
            for (const attr of Object.keys(record)) {
                if (!(attr in attrValues)) {
                    attrValues[attr] = {};
                    if (recordsProcessed > 0) {
                        attrValues[attr].null = recordsProcessed;
                    }
                }
            }
            for (const attr in attrValues) {
                const value = attr in record ? record[attr] : 'null';
                if (!(value in attrValues[attr])) { attrValues[attr][value] = 0; }
                attrValues[attr][value]++;
            }
            recordsProcessed++;
        });

        this.materializedInput = materializedInput;
        this.attrValues = attrValues;
    }

    sendPropUpdate(command) {
        this.props.onChange(update(this.props, command));
    }

    updateSingleProp(key) {
        return value => this.sendPropUpdate({[key]: {$set: value}});
    }

    addValueToFilter(attribute, value) {
        if (attribute in this.props.valueFilter) {
            this.sendPropUpdate({valueFilter: {[attribute]: {[value]: {$set: true}}}});
        }
        else {
            this.sendPropUpdate({valueFilter: {[attribute]: {$set: {[value]: true}}}});
        }
    }

    removeValueFromFilter(attribute, value) {
        this.sendPropUpdate({valueFilter: {[attribute]: {$unset: [value]}}});
    }

    render() {
        const numValsAllowed = aggregators[this.props.aggregatorName]([])().numInputs || 0;
        return (
            <table className="pvtUi"><tbody>
                <tr>
                    <td><select><option>Table</option></select></td>
                    <DnDCell
                        items={Object.keys(this.attrValues)
                            .filter(e => !this.props.rows.includes(e) && !this.props.cols.includes(e))}
                        classes="pvtAxisContainer pvtUnused pvtHorizList"
                        onChange={function() {}}
                        attrValues={this.attrValues}
                        valueFilter={this.props.valueFilter}
                        addValueToFilter={this.addValueToFilter.bind(this)}
                        removeValueFromFilter={this.removeValueFromFilter.bind(this)}
                    />
                </tr>
                <tr>
                    <td className="pvtVals">
                        <select value={this.props.aggregatorName}
                            onChange={({target: {value}}) => this.updateSingleProp('aggregatorName')(value)}
                        >
                            {Object.keys(aggregators).map(n => <option key={`agg${n}`} value={n}>{n}</option>)}
                        </select>
                        {(numValsAllowed > 0) && <br />}
                        {new Array(numValsAllowed).fill().map((n, i) =>
                            <select value={this.props.vals[i]} key={`val${i}`}
                                onChange={({target: {value}}) =>
                                    this.sendPropUpdate({vals: {$splice: [[i, 1, value]]}})}
                            >
                                <option key={`none${i}`} value=""></option>
                                {Object.keys(this.attrValues).map((v, j) =>
                                    <option key={`${i}-${j}`} value={v}>{v}</option>)}
                            </select>
                        )}
                    </td>
                    <DnDCell
                        items={this.props.cols} classes="pvtAxisContainer pvtHorizList pvtCols"
                        onChange={this.updateSingleProp('cols')}
                        attrValues={this.attrValues}
                        valueFilter={this.props.valueFilter}
                        addValueToFilter={this.addValueToFilter.bind(this)}
                        removeValueFromFilter={this.removeValueFromFilter.bind(this)}
                    />
                </tr>
                <tr>
                    <DnDCell
                        items={this.props.rows} classes="pvtAxisContainer pvtVertList pvtRows"
                        onChange={this.updateSingleProp('rows')}
                        attrValues={this.attrValues}
                        valueFilter={this.props.valueFilter}
                        addValueToFilter={this.addValueToFilter.bind(this)}
                        removeValueFromFilter={this.removeValueFromFilter.bind(this)}
                    />
                    <td>
                        <TableRenderer pivotData={new PivotData(
                            update(this.props, {data: {$set: this.materializedInput}}))}
                        />
                    </td>
                </tr>

            </tbody></table>
        );
    }
}

PivotTableUI.defaultProps = {
    rows: [], cols: [], vals: [],
    aggregatorName: 'Count',
    valueFilter: {}
};

PivotTableUI.propTypes = {
    data: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.func]).isRequired,
    onChange: PropTypes.func.isRequired,
    aggregatorName: PropTypes.string,
    cols: PropTypes.arrayOf(PropTypes.string),
    rows: PropTypes.arrayOf(PropTypes.string),
    vals: PropTypes.arrayOf(PropTypes.string),
    valueFilter: PropTypes.objectOf(PropTypes.objectOf(PropTypes.bool))
};


export default PivotTableUI;
