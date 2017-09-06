import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import {PivotData} from './Utilities';
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

    onChange(command) { this.props.onChange(update(this.props, command)); }

    render() {
        return (
            <table className="pvtUi"><tbody>
                <tr>
                    <td>(renderers)</td>
                    <DnDCell
                        items={Object.keys(this.attrValues)
                            .filter(e => !this.props.rows.includes(e) && !this.props.cols.includes(e))}
                        classes="pvtAxisContainer pvtUnused pvtHorizList"
                        onChange={function() {}}
                    />
                </tr>
                <tr>
                    <td>(aggregators)</td>
                    <DnDCell
                        items={this.props.cols} classes="pvtAxisContainer pvtHorizList pvtCols"
                        onChange={newCols => this.onChange({cols: {$set: newCols}})}
                    />
                </tr>
                <tr>
                    <DnDCell
                        items={this.props.rows} classes="pvtAxisContainer pvtVertList pvtRows"
                        onChange={newRows => this.onChange({rows: {$set: newRows}})}
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
    rows: [], cols: []
};

PivotTableUI.propTypes = {
    data: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.func]).isRequired,
    onChange: PropTypes.func.isRequired,
    cols: PropTypes.arrayOf(PropTypes.string),
    rows: PropTypes.arrayOf(PropTypes.string)
};


export default PivotTableUI;
