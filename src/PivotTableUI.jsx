import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import {PivotData, sortAs, getSort} from './Utilities';
import Sortable from 'react-sortablejs';
import DraggableAttribute from './DraggableAttribute';
import PivotTable from './PivotTable';
import './pivottable.css';

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

class PivotTableUI extends React.Component {
    constructor(props) {
        super(props);
        this.state = {unusedOrder: []};
    }

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

    addValuesToFilter(attribute, values) {
        if (attribute in this.props.valueFilter) {
            this.sendPropUpdate({valueFilter: {[attribute]:
                values.reduce((r, v) => { r[v] = {$set: true}; return r; }, {})
            }});
        }
        else {
            this.sendPropUpdate({valueFilter: {[attribute]:
                {$set: values.reduce((r, v) => { r[v] = true; return r; }, {})}
            }});
        }
    }

    removeValuesFromFilter(attribute, values) {
        this.sendPropUpdate({valueFilter: {[attribute]: {$unset: values}}});
    }

    makeDnDCell(items, onChange, classes) {
        return <Sortable
            options={{
                group: 'shared', ghostClass: 'pvtPlaceholder',
                filter: '.pvtFilterBox', preventOnFilter: false
            }}
            tag="td" className={classes} onChange={onChange}
        >
            {items.map(x => <DraggableAttribute name={x} key={x}
                attrValues={this.attrValues[x]}
                valueFilter={this.props.valueFilter[x] || {}}
                sorter={getSort(this.props.sorters, x)}
                menuLimit={this.props.menuLimit}
                addValuesToFilter={this.addValuesToFilter.bind(this)}
                removeValuesFromFilter={this.removeValuesFromFilter.bind(this)}
            />)}
        </Sortable>;
    }

    render() {
        const numValsAllowed = this.props.aggregators[this.props.aggregatorName]([])().numInputs || 0;

        const renderers = Object.keys(this.props.renderers)
            .filter(r => !('dependenciesAreMet' in this.props.renderers[r])
                || this.props.renderers[r].dependenciesAreMet(this.props))
            .reduce((result, r) => {
                result[r] = this.props.renderers[r];
                return result;
            }, {});

        let rendererName = this.props.rendererName;

        if (!(rendererName in renderers)) {
            rendererName = Object.keys(renderers)[0];
        }

        const rendererCell = <td className="pvtRenderers">
            <select value={rendererName}
                onChange={({target: {value}}) =>
                    this.updateSingleProp('rendererName')(value)}
            >
                {Object.keys(renderers)
                    .map(r =>
                        <option value={r} key={r}>{r}</option>
                    )}
            </select>
        </td>;

        const sortIcons = {
            key_a_to_z: {rowSymbol: '↕', colSymbol: '↔', next: 'value_a_to_z'},
            value_a_to_z: {rowSymbol: '↓', colSymbol: '→', next: 'value_z_to_a'},
            value_z_to_a: {rowSymbol: '↑', colSymbol: '←', next: 'key_a_to_z'}
        };

        const aggregatorCell = <td className="pvtVals">
            <select value={this.props.aggregatorName}
                onChange={({target: {value}}) =>
                    this.updateSingleProp('aggregatorName')(value)}
            >
                {Object.keys(this.props.aggregators).map(n =>
                    <option key={`agg${n}`} value={n}>{n}</option>)}
            </select>
            <a role="button" className="pvtRowOrder" onClick={() =>
                this.updateSingleProp('rowOrder')(sortIcons[this.props.rowOrder].next)}
            >
                {sortIcons[this.props.rowOrder].rowSymbol}
            </a>
            <a role="button" className="pvtColOrder" onClick={() =>
                this.updateSingleProp('colOrder')(sortIcons[this.props.colOrder].next)}
            >
                {sortIcons[this.props.colOrder].colSymbol}
            </a>
            {(numValsAllowed > 0) && <br />}
            {new Array(numValsAllowed).fill().map((n, i) =>
                <select value={this.props.vals[i]} key={`val${i}`}
                    onChange={({target: {value}}) =>
                        this.sendPropUpdate({vals: {$splice: [[i, 1, value]]}})}
                >
                    <option key={`none${i}`} value=""></option>
                    {Object.keys(this.attrValues).filter(e =>
                        !this.props.hiddenAttributes.includes(e) &&
                    !this.props.hiddenFromAggregators.includes(e)).map((v, j) =>
                        <option key={`${i}-${j}`} value={v}>{v}</option>)}
                </select>
            )}
        </td>;

        const unusedAttrs = Object.keys(this.attrValues)
            .filter(e => !this.props.rows.includes(e) &&
                    !this.props.cols.includes(e) &&
                    !this.props.hiddenAttributes.includes(e) &&
                    !this.props.hiddenFromDragDrop.includes(e))
            .sort(sortAs(this.state.unusedOrder));

        const unusedLength = unusedAttrs.reduce(((r, e) => r + e.length), 0);
        const horizUnused = unusedLength < this.props.horizontalUnusedAreaMaxCharLength;

        const unusedAttrsCell = this.makeDnDCell(unusedAttrs, (order => this.setState({unusedOrder: order})),
            `pvtAxisContainer pvtUnused ${horizUnused ? 'pvtHorizList' : 'pvtVertList'}`);

        const colAttrs = this.props.cols.filter(e =>
            !this.props.hiddenAttributes.includes(e) &&
                    !this.props.hiddenFromDragDrop.includes(e));

        const colAttrsCell = this.makeDnDCell(colAttrs, this.updateSingleProp('cols'),
            'pvtAxisContainer pvtHorizList pvtCols');

        const rowAttrs = this.props.rows.filter(e =>
            !this.props.hiddenAttributes.includes(e) &&
                    !this.props.hiddenFromDragDrop.includes(e));
        const rowAttrsCell = this.makeDnDCell(rowAttrs, this.updateSingleProp('rows'),
            'pvtAxisContainer pvtVertList pvtRows');

        const outputCell = <td>
            <PivotTable {...update(this.props, {data: {$set: this.materializedInput}})} />
        </td>;

        if (horizUnused) {
            return <table className="pvtUi"><tbody>
                <tr>{rendererCell }{ unusedAttrsCell }</tr>
                <tr>{aggregatorCell }{ colAttrsCell }</tr>
                <tr>{rowAttrsCell }{ outputCell }</tr>
            </tbody></table>;
        }

        return <table className="pvtUi"><tbody>
            <tr>{rendererCell }{ aggregatorCell }{ colAttrsCell }</tr>
            <tr>{unusedAttrsCell }{ rowAttrsCell }{ outputCell }</tr>
        </tbody></table>;
    }
}

PivotTableUI.propTypes = Object.assign({}, PivotTable.propTypes, {
    hiddenAttributes: PropTypes.arrayOf(PropTypes.string),
    hiddenFromAggregators: PropTypes.arrayOf(PropTypes.string),
    hiddenFromDragDrop: PropTypes.arrayOf(PropTypes.string),
    horizontalUnusedAreaMaxCharLength: PropTypes.number,
    menuLimit: PropTypes.number
});

PivotTableUI.defaultProps = Object.assign({}, PivotTable.defaultProps, {
    hiddenAttributes: [],
    hiddenFromAggregators: [],
    hiddenFromDragDrop: [],
    horizontalUnusedAreaMaxCharLength: 85,
    menuLimit: 500
});

export default PivotTableUI;
