import React, { useState } from 'react';
import tips from './tips';
import {sortAs} from '../src/Utilities';
import TableRenderers from '../src/TableRenderers';
import createPlotlyComponent from 'react-plotly.js/factory';
import createPlotlyRenderers from '../src/PlotlyRenderers';
import PivotTableUI from '../src/PivotTableUI';
import '../src/pivottable.css';
import '../src/grouping.css';
import Dropzone from 'react-dropzone';
import Papa from 'papaparse';

const Plot = createPlotlyComponent(window.Plotly);

function Checkbox(props) {
    return <label className=" checkbox-inline" style={{textTransform: "capitalize"}}>
            <input type="checkbox"
                // onChange={e => props.update(e, props.name)}
                name={props.name}
                onChange={props.onChange}
                defaultChecked={!props.unchecked}></input> {props.name.replace( /([A-Z])/g, " $1" )}
        </label>
}

function Grouping(props) {
    const [disabled, setDisabled] = useState(true);

    const visible = !!props.rendererName && props.rendererName.startsWith('Table');

    if(!visible)
        return <div></div>;

    const onChange = e => {
        setDisabled(!e.target.checked);
        props.onChange(e);
    };

    return <div className="row text-center">
        <div className="col-md-2 col-md-offset-3">
            <Checkbox onChange={onChange} name="grouping" unchecked={true} />
        </div>
        <fieldset className="col-md-6" disabled={disabled}>
            <Checkbox onChange={props.onChange} name="compactRows"/>
            <Checkbox onChange={props.onChange} name="rowGroupBefore"/>
            <Checkbox onChange={props.onChange} name="colGroupBefore" unchecked={true} />
        </fieldset>
        <br/>
        <br/>
    </div>
  }

class PivotTableUISmartWrapper extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {pivotState: props};
    }

    componentWillReceiveProps(nextProps) {
        this.setState({pivotState: nextProps});
    }

    render() {
        return (
            <PivotTableUI
                renderers={Object.assign(
                    {},
                    TableRenderers,
                    createPlotlyRenderers(Plot)
                )}
                {...this.state.pivotState}
                // onChange={s => this.setState({pivotState: s}))}
                unusedOrientationCutoff={Infinity}
            />
        );
    }
}

export default class App extends React.Component {
    componentWillMount() {
        this.setState({
            mode: 'demo',
            filename: 'Sample Dataset: Tips',
            pivotState: {
                data: tips,
                rows: ['Payer Gender', "Meal"],
                cols: ["Payer Smoker", 'Party Size',],
                // aggregatorName: 'Sum over Sum',
                vals: ['Tip', 'Total Bill'],
                // rendererName: 'Grouped Column Chart',
                rendererName: 'Table',
                sorters: {
                    Meal: sortAs(['Lunch', 'Dinner']),
                    'Day of Week': sortAs([
                        'Thursday',
                        'Friday',
                        'Saturday',
                        'Sunday',
                    ]),
                },
                plotlyOptions: {width: 900, height: 500},
                plotlyConfig: {},
                tableOptions: {
                    clickCallback: function(e, value, filters, pivotData) {
                        var names = [];
                        pivotData.forEachMatchingRecord(filters, function(
                            record
                        ) {
                            names.push(record.Meal);
                        });
                        alert(names.join('\n'));
                    },
                },
            },
        });
    }

    onDrop(files) {
        this.setState(
            {
                mode: 'thinking',
                filename: '(Parsing CSV...)',
                textarea: '',
                pivotState: {data: []},
            },
            () =>
                Papa.parse(files[0], {
                    skipEmptyLines: true,
                    error: e => alert(e),
                    complete: parsed =>
                        this.setState({
                            mode: 'file',
                            filename: files[0].name,
                            pivotState: {data: parsed.data},
                        }),
                })
        );
    }

    onType(event) {
        Papa.parse(event.target.value, {
            skipEmptyLines: true,
            error: e => alert(e),
            complete: parsed =>
                this.setState({
                    mode: 'text',
                    filename: 'Data from <textarea>',
                    textarea: event.target.value,
                    pivotState: {data: parsed.data},
                }),
        });
    }

    onGrouping({target: {name, checked}}) {
        var pivotState = Object.assign({}, this.state.pivotState);
        pivotState[name] = checked;
        this.setState({pivotState});
    }

    render() {
        return (
            <div>
                <div className="row text-center">
                    <div className="col-md-3 col-md-offset-3">
                        <p>Try it right now on a file...</p>
                        <Dropzone
                            onDrop={this.onDrop.bind(this)}
                            accept="text/csv"
                            className="dropzone"
                            activeClassName="dropzoneActive"
                            rejectClassName="dropzoneReject"
                        >
                            <p>
                                Drop a CSV file here, or click to choose a file
                                from your computer.
                            </p>
                        </Dropzone>
                    </div>
                    <div className="col-md-3 text-center">
                        <p>...or paste some data:</p>
                        <textarea
                            value={this.state.textarea}
                            onChange={this.onType.bind(this)}
                            placeholder="Paste from a spreadsheet or CSV-like file"
                        />
                    </div>
                </div>
                <div className="row text-center">
                    <p>
                        <em>Note: the data never leaves your browser!</em>
                    </p>
                    <br />
                </div>
                <div className="row">
                    <h2 className="text-center">{this.state.filename}</h2>
                    <br />

                </div>
                <Grouping
                    onChange={this.onGrouping.bind(this)}
                    rendererName={this.state.pivotState.rendererName}
                />
                <div className="row">
                    <PivotTableUISmartWrapper {...this.state.pivotState} onChange={s => this.setState({pivotState: s})}/>
                </div>
            </div>
        );
    }
}
