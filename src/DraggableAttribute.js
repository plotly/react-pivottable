import React from 'react';
import PropTypes from 'prop-types';

class DraggableAttribute extends React.Component {
    render() {
        return <li data-id={this.props.name}>
            <span className="pvtAttr">{this.props.name}</span>
        </li>;
    }
}

DraggableAttribute.propTypes = {
    name: PropTypes.string.isRequired
};

export default DraggableAttribute;
