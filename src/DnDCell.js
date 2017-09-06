import React from 'react';
import PropTypes from 'prop-types';
import Sortable from 'react-sortablejs';
import DraggableAttribute from './DraggableAttribute';

class DnDCell extends React.Component {
    render() {
        return <Sortable
            options={{
                group: 'shared',
                ghostClass: 'pvtPlaceholder'
            }}
            tag="td"
            className={this.props.classes}
            onChange={this.props.onChange}
        >
            {this.props.items.map(x => <DraggableAttribute name={x} key={x} />)}
        </Sortable>;
    }
}

DnDCell.propTypes = {
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
    classes: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
};

export default DnDCell;
