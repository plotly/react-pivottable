'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Dropdown = exports.DraggableAttribute = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _immutabilityHelper = require('immutability-helper');

var _immutabilityHelper2 = _interopRequireDefault(_immutabilityHelper);

var _Utilities = require('./Utilities');

var _PivotTable = require('./PivotTable');

var _PivotTable2 = _interopRequireDefault(_PivotTable);

var _reactSortablejs = require('react-sortablejs');

var _reactSortablejs2 = _interopRequireDefault(_reactSortablejs);

var _reactDraggable = require('react-draggable');

var _reactDraggable2 = _interopRequireDefault(_reactDraggable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

var DraggableAttribute = exports.DraggableAttribute = function (_React$Component) {
  _inherits(DraggableAttribute, _React$Component);

  function DraggableAttribute(props) {
    _classCallCheck(this, DraggableAttribute);

    var _this = _possibleConstructorReturn(this, (DraggableAttribute.__proto__ || Object.getPrototypeOf(DraggableAttribute)).call(this, props));

    _this.state = { open: false, filterText: '' };
    return _this;
  }

  _createClass(DraggableAttribute, [{
    key: 'toggleValue',
    value: function toggleValue(value) {
      if (value in this.props.valueFilter) {
        this.props.removeValuesFromFilter(this.props.name, [value]);
      } else {
        this.props.addValuesToFilter(this.props.name, [value]);
      }
    }
  }, {
    key: 'matchesFilter',
    value: function matchesFilter(x) {
      return x.toLowerCase().trim().includes(this.state.filterText.toLowerCase().trim());
    }
  }, {
    key: 'selectOnly',
    value: function selectOnly(e, value) {
      e.stopPropagation();
      this.props.setValuesInFilter(this.props.name, Object.keys(this.props.attrValues).filter(function (y) {
        return y !== value;
      }));
    }
  }, {
    key: 'getFilterBox',
    value: function getFilterBox() {
      var _this2 = this;

      var showMenu = Object.keys(this.props.attrValues).length < this.props.menuLimit;

      var values = Object.keys(this.props.attrValues);
      var shown = values.filter(this.matchesFilter.bind(this)).sort(this.props.sorter);

      return _react2.default.createElement(
        _reactDraggable2.default,
        { handle: '.pvtDragHandle' },
        _react2.default.createElement(
          'div',
          {
            className: 'pvtFilterBox',
            style: {
              display: 'block',
              cursor: 'initial',
              zIndex: this.props.zIndex
            },
            onClick: function onClick() {
              return _this2.props.moveFilterBoxToTop(_this2.props.name);
            }
          },
          _react2.default.createElement(
            'a',
            { onClick: function onClick() {
                return _this2.setState({ open: false });
              }, className: 'pvtCloseX' },
            '\xD7'
          ),
          _react2.default.createElement(
            'span',
            { className: 'pvtDragHandle' },
            '\u2630'
          ),
          _react2.default.createElement(
            'h4',
            null,
            this.props.name
          ),
          showMenu || _react2.default.createElement(
            'p',
            null,
            '(too many values to show)'
          ),
          showMenu && _react2.default.createElement(
            'p',
            null,
            _react2.default.createElement('input', {
              type: 'text',
              placeholder: 'Filter values',
              className: 'pvtSearch',
              value: this.state.filterText,
              onChange: function onChange(e) {
                return _this2.setState({
                  filterText: e.target.value
                });
              }
            }),
            _react2.default.createElement('br', null),
            _react2.default.createElement(
              'a',
              {
                role: 'button',
                className: 'pvtButton',
                onClick: function onClick() {
                  return _this2.props.removeValuesFromFilter(_this2.props.name, Object.keys(_this2.props.attrValues).filter(_this2.matchesFilter.bind(_this2)));
                }
              },
              'Select ',
              values.length === shown.length ? 'All' : shown.length
            ),
            ' ',
            _react2.default.createElement(
              'a',
              {
                role: 'button',
                className: 'pvtButton',
                onClick: function onClick() {
                  return _this2.props.addValuesToFilter(_this2.props.name, Object.keys(_this2.props.attrValues).filter(_this2.matchesFilter.bind(_this2)));
                }
              },
              'Deselect ',
              values.length === shown.length ? 'All' : shown.length
            )
          ),
          showMenu && _react2.default.createElement(
            'div',
            { className: 'pvtCheckContainer' },
            shown.map(function (x) {
              return _react2.default.createElement(
                'p',
                {
                  key: x,
                  onClick: function onClick() {
                    return _this2.toggleValue(x);
                  },
                  className: x in _this2.props.valueFilter ? '' : 'selected'
                },
                _react2.default.createElement(
                  'a',
                  { className: 'pvtOnly', onClick: function onClick(e) {
                      return _this2.selectOnly(e, x);
                    } },
                  'only'
                ),
                _react2.default.createElement(
                  'a',
                  { className: 'pvtOnlySpacer' },
                  '\xA0'
                ),
                x === '' ? _react2.default.createElement(
                  'em',
                  null,
                  'null'
                ) : x
              );
            })
          )
        )
      );
    }
  }, {
    key: 'toggleFilterBox',
    value: function toggleFilterBox() {
      this.setState({ open: !this.state.open });
      this.props.moveFilterBoxToTop(this.props.name);
    }
  }, {
    key: 'render',
    value: function render() {
      var filtered = Object.keys(this.props.valueFilter).length !== 0 ? 'pvtFilteredAttribute' : '';
      return _react2.default.createElement(
        'li',
        { 'data-id': this.props.name },
        _react2.default.createElement(
          'span',
          { className: 'pvtAttr ' + filtered },
          this.props.name,
          _react2.default.createElement(
            'span',
            {
              className: 'pvtTriangle',
              onClick: this.toggleFilterBox.bind(this)
            },
            ' ',
            '\u25BE'
          )
        ),
        this.state.open ? this.getFilterBox() : null
      );
    }
  }]);

  return DraggableAttribute;
}(_react2.default.Component);

DraggableAttribute.defaultProps = {
  valueFilter: {}
};

DraggableAttribute.propTypes = {
  name: _propTypes2.default.string.isRequired,
  addValuesToFilter: _propTypes2.default.func.isRequired,
  removeValuesFromFilter: _propTypes2.default.func.isRequired,
  attrValues: _propTypes2.default.objectOf(_propTypes2.default.number).isRequired,
  valueFilter: _propTypes2.default.objectOf(_propTypes2.default.bool),
  moveFilterBoxToTop: _propTypes2.default.func.isRequired,
  sorter: _propTypes2.default.func.isRequired,
  menuLimit: _propTypes2.default.number,
  zIndex: _propTypes2.default.number
};

var Dropdown = exports.Dropdown = function (_React$PureComponent) {
  _inherits(Dropdown, _React$PureComponent);

  function Dropdown() {
    _classCallCheck(this, Dropdown);

    return _possibleConstructorReturn(this, (Dropdown.__proto__ || Object.getPrototypeOf(Dropdown)).apply(this, arguments));
  }

  _createClass(Dropdown, [{
    key: 'render',
    value: function render() {
      var _this4 = this;

      return _react2.default.createElement(
        'div',
        { className: 'pvtDropdown', style: { zIndex: this.props.zIndex } },
        _react2.default.createElement(
          'div',
          {
            onClick: function onClick(e) {
              e.stopPropagation();
              _this4.props.toggle();
            },
            className: 'pvtDropdownValue pvtDropdownCurrent ' + (this.props.open ? 'pvtDropdownCurrentOpen' : ''),
            role: 'button'
          },
          _react2.default.createElement(
            'div',
            { className: 'pvtDropdownIcon' },
            this.props.open ? '×' : '▾'
          ),
          this.props.current || _react2.default.createElement(
            'span',
            null,
            '\xA0'
          )
        ),
        this.props.open && _react2.default.createElement(
          'div',
          { className: 'pvtDropdownMenu' },
          this.props.values.map(function (r) {
            return _react2.default.createElement(
              'div',
              {
                key: r,
                role: 'button',
                onClick: function onClick(e) {
                  e.stopPropagation();
                  if (_this4.props.current === r) {
                    _this4.props.toggle();
                  } else {
                    _this4.props.setValue(r);
                  }
                },
                className: 'pvtDropdownValue ' + (r === _this4.props.current ? 'pvtDropdownActiveValue' : '')
              },
              r
            );
          })
        )
      );
    }
  }]);

  return Dropdown;
}(_react2.default.PureComponent);

var PivotTableUI = function (_React$PureComponent2) {
  _inherits(PivotTableUI, _React$PureComponent2);

  function PivotTableUI(props) {
    _classCallCheck(this, PivotTableUI);

    var _this5 = _possibleConstructorReturn(this, (PivotTableUI.__proto__ || Object.getPrototypeOf(PivotTableUI)).call(this, props));

    _this5.state = {
      unusedOrder: [],
      zIndices: {},
      maxZIndex: 1000,
      openDropdown: false,
      attrValues: {},
      materializedInput: []
    };
    return _this5;
  }

  _createClass(PivotTableUI, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.materializeInput(this.props.data);
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      this.materializeInput(this.props.data);
    }
  }, {
    key: 'materializeInput',
    value: function materializeInput(nextData) {
      if (this.state.data === nextData) {
        return;
      }
      var newState = {
        data: nextData,
        attrValues: {},
        materializedInput: []
      };
      var recordsProcessed = 0;
      _Utilities.PivotData.forEachRecord(newState.data, this.props.derivedAttributes, function (record) {
        newState.materializedInput.push(record);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Object.keys(record)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var attr = _step.value;

            if (!(attr in newState.attrValues)) {
              newState.attrValues[attr] = {};
              if (recordsProcessed > 0) {
                newState.attrValues[attr].null = recordsProcessed;
              }
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        for (var _attr in newState.attrValues) {
          var value = _attr in record ? record[_attr] : 'null';
          if (!(value in newState.attrValues[_attr])) {
            newState.attrValues[_attr][value] = 0;
          }
          newState.attrValues[_attr][value]++;
        }
        recordsProcessed++;
      });
      this.setState(newState);
    }
  }, {
    key: 'sendPropUpdate',
    value: function sendPropUpdate(command) {
      this.props.onChange((0, _immutabilityHelper2.default)(this.props, command));
    }
  }, {
    key: 'propUpdater',
    value: function propUpdater(key) {
      var _this6 = this;

      return function (value) {
        return _this6.sendPropUpdate(_defineProperty({}, key, { $set: value }));
      };
    }
  }, {
    key: 'setValuesInFilter',
    value: function setValuesInFilter(attribute, values) {
      this.sendPropUpdate({
        valueFilter: _defineProperty({}, attribute, {
          $set: values.reduce(function (r, v) {
            r[v] = true;
            return r;
          }, {})
        })
      });
    }
  }, {
    key: 'addValuesToFilter',
    value: function addValuesToFilter(attribute, values) {
      if (attribute in this.props.valueFilter) {
        this.sendPropUpdate({
          valueFilter: _defineProperty({}, attribute, values.reduce(function (r, v) {
            r[v] = { $set: true };
            return r;
          }, {}))
        });
      } else {
        this.setValuesInFilter(attribute, values);
      }
    }
  }, {
    key: 'removeValuesFromFilter',
    value: function removeValuesFromFilter(attribute, values) {
      this.sendPropUpdate({
        valueFilter: _defineProperty({}, attribute, { $unset: values })
      });
    }
  }, {
    key: 'moveFilterBoxToTop',
    value: function moveFilterBoxToTop(attribute) {
      this.setState((0, _immutabilityHelper2.default)(this.state, {
        maxZIndex: { $set: this.state.maxZIndex + 1 },
        zIndices: _defineProperty({}, attribute, { $set: this.state.maxZIndex + 1 })
      }));
    }
  }, {
    key: 'isOpen',
    value: function isOpen(dropdown) {
      return this.state.openDropdown === dropdown;
    }
  }, {
    key: 'makeDnDCell',
    value: function makeDnDCell(items, onChange, classes) {
      var _this7 = this;

      return _react2.default.createElement(
        _reactSortablejs2.default,
        {
          options: {
            group: 'shared',
            ghostClass: 'pvtPlaceholder',
            filter: '.pvtFilterBox',
            preventOnFilter: false
          },
          tag: 'td',
          className: classes,
          onChange: onChange
        },
        items.map(function (x) {
          return _react2.default.createElement(DraggableAttribute, {
            name: x,
            key: x,
            attrValues: _this7.state.attrValues[x],
            valueFilter: _this7.props.valueFilter[x] || {},
            sorter: (0, _Utilities.getSort)(_this7.props.sorters, x),
            menuLimit: _this7.props.menuLimit,
            setValuesInFilter: _this7.setValuesInFilter.bind(_this7),
            addValuesToFilter: _this7.addValuesToFilter.bind(_this7),
            moveFilterBoxToTop: _this7.moveFilterBoxToTop.bind(_this7),
            removeValuesFromFilter: _this7.removeValuesFromFilter.bind(_this7),
            zIndex: _this7.state.zIndices[x] || _this7.state.maxZIndex
          });
        })
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var _this8 = this;

      var numValsAllowed = this.props.aggregators[this.props.aggregatorName]([])().numInputs || 0;

      var aggregatorCellOutlet = this.props.aggregators[this.props.aggregatorName]([])().outlet;

      var rendererName = this.props.rendererName in this.props.renderers ? this.props.rendererName : Object.keys(this.props.renderers)[0];

      var rendererCell = _react2.default.createElement(
        'td',
        { className: 'pvtRenderers' },
        _react2.default.createElement(Dropdown, {
          current: rendererName,
          values: Object.keys(this.props.renderers),
          open: this.isOpen('renderer'),
          zIndex: this.isOpen('renderer') ? this.state.maxZIndex + 1 : 1,
          toggle: function toggle() {
            return _this8.setState({
              openDropdown: _this8.isOpen('renderer') ? false : 'renderer'
            });
          },
          setValue: this.propUpdater('rendererName')
        })
      );

      var sortIcons = {
        key_a_to_z: {
          rowSymbol: '↕',
          colSymbol: '↔',
          next: 'value_a_to_z'
        },
        value_a_to_z: {
          rowSymbol: '↓',
          colSymbol: '→',
          next: 'value_z_to_a'
        },
        value_z_to_a: { rowSymbol: '↑', colSymbol: '←', next: 'key_a_to_z' }
      };

      var aggregatorCell = _react2.default.createElement(
        'td',
        { className: 'pvtVals' },
        _react2.default.createElement(Dropdown, {
          current: this.props.aggregatorName,
          values: Object.keys(this.props.aggregators),
          open: this.isOpen('aggregators'),
          zIndex: this.isOpen('aggregators') ? this.state.maxZIndex + 1 : 1,
          toggle: function toggle() {
            return _this8.setState({
              openDropdown: _this8.isOpen('aggregators') ? false : 'aggregators'
            });
          },
          setValue: this.propUpdater('aggregatorName')
        }),
        _react2.default.createElement(
          'a',
          {
            role: 'button',
            className: 'pvtRowOrder',
            onClick: function onClick() {
              return _this8.propUpdater('rowOrder')(sortIcons[_this8.props.rowOrder].next);
            }
          },
          sortIcons[this.props.rowOrder].rowSymbol
        ),
        _react2.default.createElement(
          'a',
          {
            role: 'button',
            className: 'pvtColOrder',
            onClick: function onClick() {
              return _this8.propUpdater('colOrder')(sortIcons[_this8.props.colOrder].next);
            }
          },
          sortIcons[this.props.colOrder].colSymbol
        ),
        numValsAllowed > 0 && _react2.default.createElement('br', null),
        new Array(numValsAllowed).fill().map(function (n, i) {
          return [_react2.default.createElement(Dropdown, {
            key: i,
            current: _this8.props.vals[i],
            values: Object.keys(_this8.state.attrValues).filter(function (e) {
              return !_this8.props.hiddenAttributes.includes(e) && !_this8.props.hiddenFromAggregators.includes(e);
            }),
            open: _this8.isOpen('val' + i),
            zIndex: _this8.isOpen('val' + i) ? _this8.state.maxZIndex + 1 : 1,
            toggle: function toggle() {
              return _this8.setState({
                openDropdown: _this8.isOpen('val' + i) ? false : 'val' + i
              });
            },
            setValue: function setValue(value) {
              return _this8.sendPropUpdate({
                vals: { $splice: [[i, 1, value]] }
              });
            }
          }), i + 1 !== numValsAllowed ? _react2.default.createElement('br', { key: 'br' + i }) : null];
        }),
        aggregatorCellOutlet && aggregatorCellOutlet(this.props.data)
      );

      var unusedAttrs = Object.keys(this.state.attrValues).filter(function (e) {
        return !_this8.props.rows.includes(e) && !_this8.props.cols.includes(e) && !_this8.props.hiddenAttributes.includes(e) && !_this8.props.hiddenFromDragDrop.includes(e);
      }).sort((0, _Utilities.sortAs)(this.state.unusedOrder));

      var unusedLength = unusedAttrs.reduce(function (r, e) {
        return r + e.length;
      }, 0);
      var horizUnused = unusedLength < this.props.unusedOrientationCutoff;

      var unusedAttrsCell = this.makeDnDCell(unusedAttrs, function (order) {
        return _this8.setState({ unusedOrder: order });
      }, 'pvtAxisContainer pvtUnused ' + (horizUnused ? 'pvtHorizList' : 'pvtVertList'));

      var colAttrs = this.props.cols.filter(function (e) {
        return !_this8.props.hiddenAttributes.includes(e) && !_this8.props.hiddenFromDragDrop.includes(e);
      });

      var colAttrsCell = this.makeDnDCell(colAttrs, this.propUpdater('cols'), 'pvtAxisContainer pvtHorizList pvtCols');

      var rowAttrs = this.props.rows.filter(function (e) {
        return !_this8.props.hiddenAttributes.includes(e) && !_this8.props.hiddenFromDragDrop.includes(e);
      });
      var rowAttrsCell = this.makeDnDCell(rowAttrs, this.propUpdater('rows'), 'pvtAxisContainer pvtVertList pvtRows');
      var outputCell = _react2.default.createElement(
        'td',
        { className: 'pvtOutput' },
        _react2.default.createElement(_PivotTable2.default, (0, _immutabilityHelper2.default)(this.props, {
          data: { $set: this.state.materializedInput }
        }))
      );

      if (horizUnused) {
        return _react2.default.createElement(
          'table',
          { className: 'pvtUi' },
          _react2.default.createElement(
            'tbody',
            { onClick: function onClick() {
                return _this8.setState({ openDropdown: false });
              } },
            _react2.default.createElement(
              'tr',
              null,
              rendererCell,
              unusedAttrsCell
            ),
            _react2.default.createElement(
              'tr',
              null,
              aggregatorCell,
              colAttrsCell
            ),
            _react2.default.createElement(
              'tr',
              null,
              rowAttrsCell,
              outputCell
            )
          )
        );
      }

      return _react2.default.createElement(
        'table',
        { className: 'pvtUi' },
        _react2.default.createElement(
          'tbody',
          { onClick: function onClick() {
              return _this8.setState({ openDropdown: false });
            } },
          _react2.default.createElement(
            'tr',
            null,
            rendererCell,
            aggregatorCell,
            colAttrsCell
          ),
          _react2.default.createElement(
            'tr',
            null,
            unusedAttrsCell,
            rowAttrsCell,
            outputCell
          )
        )
      );
    }
  }]);

  return PivotTableUI;
}(_react2.default.PureComponent);

PivotTableUI.propTypes = Object.assign({}, _PivotTable2.default.propTypes, {
  onChange: _propTypes2.default.func.isRequired,
  hiddenAttributes: _propTypes2.default.arrayOf(_propTypes2.default.string),
  hiddenFromAggregators: _propTypes2.default.arrayOf(_propTypes2.default.string),
  hiddenFromDragDrop: _propTypes2.default.arrayOf(_propTypes2.default.string),
  unusedOrientationCutoff: _propTypes2.default.number,
  menuLimit: _propTypes2.default.number
});

PivotTableUI.defaultProps = Object.assign({}, _PivotTable2.default.defaultProps, {
  hiddenAttributes: [],
  hiddenFromAggregators: [],
  hiddenFromDragDrop: [],
  unusedOrientationCutoff: 85,
  menuLimit: 500
});

exports.default = PivotTableUI;
//# sourceMappingURL=PivotTableUI.js.map