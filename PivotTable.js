'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _Utilities = require('./Utilities');

var _TableRenderers = require('./TableRenderers');

var _TableRenderers2 = _interopRequireDefault(_TableRenderers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

var PivotTable = function (_React$PureComponent) {
  _inherits(PivotTable, _React$PureComponent);

  function PivotTable() {
    _classCallCheck(this, PivotTable);

    return _possibleConstructorReturn(this, (PivotTable.__proto__ || Object.getPrototypeOf(PivotTable)).apply(this, arguments));
  }

  _createClass(PivotTable, [{
    key: 'render',
    value: function render() {
      var Renderer = this.props.renderers[this.props.rendererName in this.props.renderers ? this.props.rendererName : Object.keys(this.props.renderers)[0]];
      return _react2.default.createElement(Renderer, this.props);
    }
  }]);

  return PivotTable;
}(_react2.default.PureComponent);

PivotTable.propTypes = Object.assign({}, _Utilities.PivotData.propTypes, {
  rendererName: _propTypes2.default.string,
  renderers: _propTypes2.default.objectOf(_propTypes2.default.func)
});

PivotTable.defaultProps = Object.assign({}, _Utilities.PivotData.defaultProps, {
  rendererName: 'Table',
  renderers: _TableRenderers2.default
});

exports.default = PivotTable;
module.exports = exports['default'];
//# sourceMappingURL=PivotTable.js.map