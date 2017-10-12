import React from 'react';
import PropTypes from 'prop-types';
import {getSort} from '../src/Utilities';

class DraggableAttribute extends React.Component {
    constructor(props) {
        super(props);
        this.state = {open: false, top: 0, left: 0, filterText: ''};
    }

    onCheckboxChange(value, checked) {
        if (checked) {
            this.props.removeValueFromFilter(this.props.name, value);
        }
        else {
            this.props.addValueToFilter(this.props.name, value);
        }
    }

    getFilterBox() {
        return (
            <div className="pvtFilterBox" style={{
                display: 'block', cursor: 'initial',
                top: this.state.top + 'px', left: this.state.left + 'px'}}
            >
                <a onClick={() => this.setState({open: false})}
                    style={{position: 'absolute', right: '5px', top: '5px', fontSize: '18px', cursor: 'pointer'}}
                >×</a>
                <h4>{this.props.name}</h4>
                <p>
                    <input type="text" placeholder="Filter values" className="pvtSearch"
                        value={this.state.filterText}
                        onChange={e => this.setState({filterText: e.target.value})}
                    />
                </p>

                <div className="pvtCheckContainer">
                    {Object.keys(this.props.attrValues)
                        .sort(getSort(this.props.sorters, this.props.name))
                        .filter(x => x.toLowerCase().trim().includes(this.state.filterText.toLowerCase().trim()))
                        .map(x =>
                            <p key={x}>
                                <label>
                                    <input type="checkbox"
                                        onChange={e => this.onCheckboxChange(x, e.target.checked)}
                                        checked={!(x in this.props.valueFilter)}
                                    />
                                    {x}
                                </label>
                            </p>)}
                </div>
            </div>);
    }

    render() {
        const filtered = Object.keys(this.props.valueFilter).length !== 0 ? 'pvtFilteredAttribute' : '';
        return <li data-id={this.props.name}>
            <span className={'pvtAttr ' + filtered}>
                {this.props.name}
                <span className="pvtTriangle"
                    onClick={e => this.setState({open: !this.state.open, top: e.clientY, left: e.clientX})}
                > ▾</span>
            </span>

            {this.state.open ? this.getFilterBox() : null}

        </li>;
    }
}


DraggableAttribute.defaultProps = {
    valueFilter: {}, sorters: {}
};

DraggableAttribute.propTypes = {
    name: PropTypes.string.isRequired,
    addValueToFilter: PropTypes.func.isRequired,
    removeValueFromFilter: PropTypes.func.isRequired,
    attrValues: PropTypes.objectOf(PropTypes.number).isRequired,
    valueFilter: PropTypes.objectOf(PropTypes.bool),
    sorters: PropTypes.oneOfType([PropTypes.func, PropTypes.objectOf(PropTypes.func)])
};

export default DraggableAttribute;
