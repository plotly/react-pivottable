import * as React from 'react'
import update from 'immutability-helper'
import {PivotData, sortAs, getSort, ObjectOfNumbers} from './Utilities'
import { PivotTable, IPivotTableProps } from './PivotTable'
import Sortable from 'react-sortablejs'
import Dropdown from './Dropdown'
import DraggableAttribute from './DraggableAttribute'

interface IProps {
  onChange: (Function) => any
  hiddenAttributes?: string[]
  hiddenFromAggregators?: string[]
  hiddenFromDragDrop?: string[]
  unusedOrientationCutoff?: number
  menuLimit?: number
}
interface IPivotTableUIProps extends IProps, IPivotTableProps {}
interface IState {
  unusedOrder: any[]
  zIndices: ObjectOfNumbers
  maxZIndex: number
  openDropdown: boolean | string
}
class PivotTableUI extends React.PureComponent<IPivotTableUIProps, IState> {
  static props: IPivotTableUIProps = {
    ...PivotTable.defaultProps,
    onChange: () => undefined,
    hiddenAttributes: [],
    hiddenFromAggregators: [],
    hiddenFromDragDrop: [],
    unusedOrientationCutoff: 85,
    menuLimit: 500,
  }
  public state = {
    unusedOrder: [],
    zIndices: {},
    maxZIndex: 1000,
    openDropdown: false,
  }
  public data = []
  public materializedInput: any[]
  public attrValues: any

  public componentWillMount() {
    this.materializeInput(this.props.data)
  }

  public componentWillUpdate(nextProps: IPivotTableUIProps) {
    this.materializeInput(nextProps.data)
  }

  private materializeInput(nextData) {
    if (this.data === nextData) {
      return
    }
    this.data = nextData
    const attrValues = {}
    const materializedInput: any[] = []
    let recordsProcessed = 0
    new PivotData().forEachRecord(this.data, this.props.derivedAttributes, function(record) {
      materializedInput.push(record)
      for (const attr of Object.keys(record)) {
        if (!(attr in attrValues)) {
          attrValues[attr] = {}
          if (recordsProcessed > 0) {
            attrValues[attr].null = recordsProcessed
          }
        }
      }
      for (const attr in attrValues) {
        const value = attr in record ? record[attr] : 'null'
        if (!(value in attrValues[attr])) {
          attrValues[attr][value] = 0
        }
        attrValues[attr][value]++
      }
      recordsProcessed++
    })

    this.materializedInput = materializedInput
    this.attrValues = attrValues
  }

  sendPropUpdate(command) {
    this.props.onChange(update(this.props, command))
  }

  propUpdater(key) {
    return value => this.sendPropUpdate({[key]: {$set: value}})
  }

  setValuesInFilter(attribute, values) {
    this.sendPropUpdate({
      valueFilter: {
        [attribute]: {
          $set: values.reduce((r, v) => {
            r[v] = true
            return r
          }, {}),
        },
      },
    })
  }

  addValuesToFilter(attribute, values) {
    if (attribute in this.props.valueFilter!) {
      this.sendPropUpdate({
        valueFilter: {
          [attribute]: values.reduce((r, v) => {
            r[v] = {$set: true}
            return r
          }, {}),
        },
      })
    } else {
      this.setValuesInFilter(attribute, values)
    }
  }

  removeValuesFromFilter(attribute, values) {
    this.sendPropUpdate({
      valueFilter: {[attribute]: {$unset: values}},
    })
  }

  moveFilterBoxToTop(attribute) {
    this.setState(
      update(this.state, {
        maxZIndex: {$set: this.state.maxZIndex + 1},
        zIndices: {[attribute]: {$set: this.state.maxZIndex + 1}},
      })
    )
  }

  isOpen(dropdown) {
    return this.state.openDropdown === dropdown
  }

  makeDnDCell(items, onChange, classes) {
    return (
      <Sortable
        options={{
          group: 'shared',
          ghostClass: 'pvtPlaceholder',
          filter: '.pvtFilterBox',
          preventOnFilter: false,
        }}
        tag="td"
        className={classes}
        onChange={onChange}
      >
        {items.map(x => (
          <DraggableAttribute
            name={x}
            key={x}
            attrValues={this.attrValues[x]}
            valueFilter={this.props.valueFilter![x] || {}}
            sorter={getSort(this.props.sorters, x)}
            menuLimit={this.props.menuLimit}
            setValuesInFilter={this.setValuesInFilter.bind(this)}
            addValuesToFilter={this.addValuesToFilter.bind(this)}
            moveFilterBoxToTop={this.moveFilterBoxToTop.bind(this)}
            removeValuesFromFilter={this.removeValuesFromFilter.bind(this)}
            zIndex={this.state.zIndices[x] || this.state.maxZIndex}
          />
        ))}
      </Sortable>
    )
  }

  render() {
    const numValsAllowed =
      this.props.aggregators![this.props.aggregatorName!]([])().numInputs || 0

    const rendererName =
      this.props.rendererName! in this.props.renderers
        ? this.props.rendererName
        : Object.keys(this.props.renderers)[0]

    const rendererCell = (
      <td className="pvtRenderers">
        <Dropdown
          current={rendererName!}
          values={Object.keys(this.props.renderers)}
          open={this.isOpen('renderer')}
          zIndex={this.isOpen('renderer') ? this.state.maxZIndex + 1 : 1}
          toggle={() =>
            this.setState((prevState: IState): IState => {
              return {
                ...prevState,
                openDropdown: this.isOpen('renderer') ? false : 'renderer',
              }
            })
          }
          setValue={this.propUpdater('rendererName')}
        />
      </td>
    )

    const sortIcons = {
      key_a_to_z: {
        rowSymbol: '↕',
        colSymbol: '↔',
        next: 'value_a_to_z',
      },
      value_a_to_z: {
        rowSymbol: '↓',
        colSymbol: '→',
        next: 'value_z_to_a',
      },
      value_z_to_a: {rowSymbol: '↑', colSymbol: '←', next: 'key_a_to_z'},
    }

    const aggregatorCell = (
      <td className="pvtVals">
        <Dropdown
          current={this.props.aggregatorName!}
          values={Object.keys(this.props.aggregators!)}
          open={this.isOpen('aggregators')}
          zIndex={this.isOpen('aggregators') ? this.state.maxZIndex + 1 : 1}
          toggle={() =>
            this.setState({
              openDropdown: this.isOpen('aggregators') ? false : 'aggregators',
            })
          }
          setValue={this.propUpdater('aggregatorName')}
        />
        <a
          role="button"
          className="pvtRowOrder"
          onClick={() =>
            this.propUpdater('rowOrder')(sortIcons[this.props.rowOrder!].next)
          }
        >
          {sortIcons[this.props.rowOrder!].rowSymbol}
        </a>
        <a
          role="button"
          className="pvtColOrder"
          onClick={() =>
            this.propUpdater('colOrder')(sortIcons[this.props.colOrder!].next)
          }
        >
          {sortIcons[this.props.colOrder!].colSymbol}
        </a>
        {numValsAllowed > 0 && <br />}
        { // Initialize new Array of length[numValsAllowed] with undefined, then immediately map data to it
          new Array(numValsAllowed).fill(undefined).map((n, i) => [
          <Dropdown
            key={i}
            current={this.props.vals![i]}
            values={Object.keys(this.attrValues).filter(
              e =>
                !this.props.hiddenAttributes!.includes(e) &&
                !this.props.hiddenFromAggregators!.includes(e)
            )}
            open={this.isOpen(`val${i}`)}
            zIndex={this.isOpen(`val${i}`) ? this.state.maxZIndex + 1 : 1}
            toggle={() =>
              this.setState({
                openDropdown: this.isOpen(`val${i}`) ? false : `val${i}`,
              })
            }
            setValue={value =>
              this.sendPropUpdate({
                vals: {$splice: [[i, 1, value]]},
              })
            }
          />,
          i + 1 !== numValsAllowed ? <br key={`br${i}`} /> : null,
        ])}
      </td>
    )

    const unusedAttrs = Object.keys(this.attrValues)
      .filter(
        e =>
          !this.props.rows!.includes(e) &&
          !this.props.cols!.includes(e) &&
          !this.props.hiddenAttributes!.includes(e) &&
          !this.props.hiddenFromDragDrop!.includes(e)
      )
      .sort(sortAs(this.state.unusedOrder))

    const unusedLength = unusedAttrs.reduce((r, e) => r + e.length, 0)
    const horizUnused = unusedLength < this.props.unusedOrientationCutoff!

    const unusedAttrsCell = this.makeDnDCell(
      unusedAttrs,
      order => this.setState({unusedOrder: order}),
      `pvtAxisContainer pvtUnused ${
        horizUnused ? 'pvtHorizList' : 'pvtVertList'
      }`
    )

    const colAttrs = this.props.cols!.filter(
      e =>
        !this.props.hiddenAttributes!.includes(e) &&
        !this.props.hiddenFromDragDrop!.includes(e)
    )

    const colAttrsCell = this.makeDnDCell(
      colAttrs,
      this.propUpdater('cols'),
      'pvtAxisContainer pvtHorizList pvtCols'
    )

    const rowAttrs = this.props.rows!.filter(
      e =>
        !this.props.hiddenAttributes!.includes(e) &&
        !this.props.hiddenFromDragDrop!.includes(e)
    )
    const rowAttrsCell = this.makeDnDCell(
      rowAttrs,
      this.propUpdater('rows'),
      'pvtAxisContainer pvtVertList pvtRows'
    )
    const outputCell = (
      <td className="pvtOutput">
        <PivotTable
          {...update(this.props, {
            data: {$set: this.materializedInput},
          })}
        />
      </td>
    )

    if (horizUnused) {
      return (
        <table className="pvtUi">
          <tbody onClick={() => this.setState({openDropdown: false})}>
            <tr>
              {rendererCell}
              {unusedAttrsCell}
            </tr>
            <tr>
              {aggregatorCell}
              {colAttrsCell}
            </tr>
            <tr>
              {rowAttrsCell}
              {outputCell}
            </tr>
          </tbody>
        </table>
      )
    }

    return (
      <table className="pvtUi">
        <tbody onClick={() => this.setState({openDropdown: false})}>
          <tr>
            {rendererCell}
            {aggregatorCell}
            {colAttrsCell}
          </tr>
          <tr>
            {unusedAttrsCell}
            {rowAttrsCell}
            {outputCell}
          </tr>
        </tbody>
      </table>
    )
  }
}

export default PivotTableUI
