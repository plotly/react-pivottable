import React from 'react';
import PropTypes from 'prop-types';
import Sortable from 'react-sortablejs';
import DraggableAttribute from './DraggableAttribute';

class DnDCell extends React.Component {
    render() {
        return <Sortable
            options={{
                group: 'shared', ghostClass: 'pvtPlaceholder', filter: '.pvtFilterBox',
                preventOnFilter: false
            }}
            tag="td"
            className={this.props.classes}
            onChange={this.props.onChange}
        >
            {this.props.items.map(x => <DraggableAttribute name={x} key={x}
                attrValues={this.props.attrValues[x]}
                valueFilter={this.props.valueFilter[x]}
                sorters={this.props.sorters}
                addValueToFilter={this.props.addValueToFilter}
                removeValueFromFilter={this.props.removeValueFromFilter}
            />)}
        </Sortable>;
    }
}

DnDCell.defaultProps = {
    valueFilter: {}, attrValues: {}, sorters: {}
};

DnDCell.propTypes = {
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
    classes: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    addValueToFilter: PropTypes.func.isRequired,
    removeValueFromFilter: PropTypes.func.isRequired,
    attrValues: PropTypes.objectOf(PropTypes.objectOf(PropTypes.number)),
    valueFilter: PropTypes.objectOf(PropTypes.objectOf(PropTypes.bool)),
    sorters: PropTypes.oneOfType([PropTypes.func, PropTypes.objectOf(PropTypes.func)])
};

export default DnDCell;
