'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) {descriptor.writable = true;} Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) {defineProperties(Constructor.prototype, protoProps);} if (staticProps) {defineProperties(Constructor, staticProps);} return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _Utilities = require('./Utilities');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) {Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;} }

// helper function for setting row/col-span in pivotTableRenderer
var spanSize = function spanSize(arr, i, j) {
  var x = void 0;
  if (i !== 0) {
    var asc = void 0,
        end = void 0;
    var noDraw = true;
    for (x = 0, end = j, asc = end >= 0; asc ? x <= end : x >= end; asc ? x++ : x--) {
      if (arr[i - 1][x] !== arr[i][x]) {
        noDraw = false;
      }
    }
    if (noDraw) {
      return -1;
    }
  }
  var len = 0;
  while (i + len < arr.length) {
    var asc1 = void 0,
        end1 = void 0;
    var stop = false;
    for (x = 0, end1 = j, asc1 = end1 >= 0; asc1 ? x <= end1 : x >= end1; asc1 ? x++ : x--) {
      if (arr[i][x] !== arr[i + len][x]) {
        stop = true;
      }
    }
    if (stop) {
      break;
    }
    len++;
  }
  return len;
};

function redColorScaleGenerator(values) {
  var min = Math.min.apply(Math, values);
  var max = Math.max.apply(Math, values);
  return function (x) {
    // eslint-disable-next-line no-magic-numbers
    var nonRed = 255 - Math.round(255 * (x - min) / (max - min));
    return { backgroundColor: 'rgb(255,' + nonRed + ',' + nonRed + ')' };
  };
}

function makeRenderer() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var TableRenderer = function (_React$PureComponent) {
    _inherits(TableRenderer, _React$PureComponent);

    function TableRenderer() {
      _classCallCheck(this, TableRenderer);

      return _possibleConstructorReturn(this, (TableRenderer.__proto__ || Object.getPrototypeOf(TableRenderer)).apply(this, arguments));
    }

    _createClass(TableRenderer, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var pivotData = new _Utilities.PivotData(this.props);
        var colAttrs = pivotData.props.cols;
        var rowAttrs = pivotData.props.rows;
        var rowKeys = pivotData.getRowKeys();
        var colKeys = pivotData.getColKeys();
        var grandTotalAggregator = pivotData.getAggregator([], []);

        var valueCellColors = function valueCellColors() {};
        var rowTotalColors = function rowTotalColors() {};
        var colTotalColors = function colTotalColors() {};
        if (opts.heatmapMode) {
          var colorScaleGenerator = this.props.tableColorScaleGenerator;
          var rowTotalValues = colKeys.map(function (x) {
            return pivotData.getAggregator([], x).value();
          });
          rowTotalColors = colorScaleGenerator(rowTotalValues);
          var colTotalValues = rowKeys.map(function (x) {
            return pivotData.getAggregator(x, []).value();
          });
          colTotalColors = colorScaleGenerator(colTotalValues);

          if (opts.heatmapMode === 'full') {
            var allValues = [];
            rowKeys.map(function (r) {
              return colKeys.map(function (c) {
                return allValues.push(pivotData.getAggregator(r, c).value());
              });
            });
            var colorScale = colorScaleGenerator(allValues);
            valueCellColors = function valueCellColors(r, c, v) {
              return colorScale(v);
            };
          } else if (opts.heatmapMode === 'row') {
            var rowColorScales = {};
            rowKeys.map(function (r) {
              var rowValues = colKeys.map(function (x) {
                return pivotData.getAggregator(r, x).value();
              });
              rowColorScales[r] = colorScaleGenerator(rowValues);
            });
            valueCellColors = function valueCellColors(r, c, v) {
              return rowColorScales[r](v);
            };
          } else if (opts.heatmapMode === 'col') {
            var colColorScales = {};
            colKeys.map(function (c) {
              var colValues = rowKeys.map(function (x) {
                return pivotData.getAggregator(x, c).value();
              });
              colColorScales[c] = colorScaleGenerator(colValues);
            });
            valueCellColors = function valueCellColors(r, c, v) {
              return colColorScales[c](v);
            };
          }
        }

        var getClickHandler = this.props.tableOptions && this.props.tableOptions.clickCallback ? function (value, rowValues, colValues) {
          var filters = {};
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = Object.keys(colAttrs || {})[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var i = _step.value;

              var attr = colAttrs[i];
              if (colValues[i] !== null) {
                filters[attr] = colValues[i];
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

          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = Object.keys(rowAttrs || {})[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var _i = _step2.value;

              var attr = rowAttrs[_i];
              if (rowValues[_i] !== null) {
                filters[attr] = rowValues[_i];
              }
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          return function (e) {
            return _this2.props.tableOptions.clickCallback(e, value, filters, pivotData);
          };
        } : null;

        return _react2.default.createElement(
          'table',
          { className: 'pvtTable' },
          _react2.default.createElement(
            'thead',
            null,
            colAttrs.map(function (c, j) {
              return _react2.default.createElement(
                'tr',
                { key: 'colAttr' + j },
                j === 0 && rowAttrs.length !== 0 && _react2.default.createElement('th', { colSpan: rowAttrs.length, rowSpan: colAttrs.length }),
                _react2.default.createElement(
                  'th',
                  { className: 'pvtAxisLabel' },
                  c
                ),
                colKeys.map(function (colKey, i) {
                  var x = spanSize(colKeys, i, j);
                  if (x === -1) {
                    return null;
                  }
                  return _react2.default.createElement(
                    'th',
                    {
                      className: 'pvtColLabel',
                      key: 'colKey' + i,
                      colSpan: x,
                      rowSpan: j === colAttrs.length - 1 && rowAttrs.length !== 0 ? 2 : 1
                    },
                    colKey[j]
                  );
                }),
                j === 0 && _react2.default.createElement(
                  'th',
                  {
                    className: 'pvtTotalLabel',
                    rowSpan: colAttrs.length + (rowAttrs.length === 0 ? 0 : 1)
                  },
                  'Totais'
                )
              );
            }),
            rowAttrs.length !== 0 && _react2.default.createElement(
              'tr',
              null,
              rowAttrs.map(function (r, i) {
                return _react2.default.createElement(
                  'th',
                  { className: 'pvtAxisLabel', key: 'rowAttr' + i },
                  r
                );
              }),
              _react2.default.createElement(
                'th',
                { className: 'pvtTotalLabel' },
                colAttrs.length === 0 ? 'Totais' : null
              )
            )
          ),
          _react2.default.createElement(
            'tbody',
            null,
            rowKeys.map(function (rowKey, i) {
              var totalAggregator = pivotData.getAggregator(rowKey, []);
              return _react2.default.createElement(
                'tr',
                { key: 'rowKeyRow' + i },
                rowKey.map(function (txt, j) {
                  var x = spanSize(rowKeys, i, j);
                  if (x === -1) {
                    return null;
                  }
                  return _react2.default.createElement(
                    'th',
                    {
                      key: 'rowKeyLabel' + i + '-' + j,
                      className: 'pvtRowLabel',
                      rowSpan: x,
                      colSpan: j === rowAttrs.length - 1 && colAttrs.length !== 0 ? 2 : 1
                    },
                    txt
                  );
                }),
                colKeys.map(function (colKey, j) {
                  var aggregator = pivotData.getAggregator(rowKey, colKey);
                  return _react2.default.createElement(
                    'td',
                    {
                      className: 'pvtVal',
                      key: 'pvtVal' + i + '-' + j,
                      onClick: getClickHandler && getClickHandler(aggregator.value(), rowKey, colKey),
                      style: valueCellColors(rowKey, colKey, aggregator.value())
                    },
                    aggregator.format(aggregator.value())
                  );
                }),
                _react2.default.createElement(
                  'td',
                  {
                    className: 'pvtTotal',
                    onClick: getClickHandler && getClickHandler(totalAggregator.value(), rowKey, [null]),
                    style: colTotalColors(totalAggregator.value())
                  },
                  totalAggregator.format(totalAggregator.value())
                )
              );
            }),
            _react2.default.createElement(
              'tr',
              null,
              _react2.default.createElement(
                'th',
                {
                  className: 'pvtTotalLabel',
                  colSpan: rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)
                },
                'Totais'
              ),
              colKeys.map(function (colKey, i) {
                var totalAggregator = pivotData.getAggregator([], colKey);
                return _react2.default.createElement(
                  'td',
                  {
                    className: 'pvtTotal',
                    key: 'total' + i,
                    onClick: getClickHandler && getClickHandler(totalAggregator.value(), [null], colKey),
                    style: rowTotalColors(totalAggregator.value())
                  },
                  totalAggregator.format(totalAggregator.value())
                );
              }),
              _react2.default.createElement(
                'td',
                {
                  onClick: getClickHandler && getClickHandler(grandTotalAggregator.value(), [null], [null]),
                  className: 'pvtGrandTotal'
                },
                grandTotalAggregator.format(grandTotalAggregator.value())
              )
            )
          )
        );
      }
    }]);

    return TableRenderer;
  }(_react2.default.PureComponent);

  TableRenderer.defaultProps = _Utilities.PivotData.defaultProps;
  TableRenderer.propTypes = _Utilities.PivotData.propTypes;
  TableRenderer.defaultProps.tableColorScaleGenerator = redColorScaleGenerator;
  TableRenderer.defaultProps.tableOptions = {};
  TableRenderer.propTypes.tableColorScaleGenerator = _propTypes2.default.func;
  TableRenderer.propTypes.tableOptions = _propTypes2.default.object;
  return TableRenderer;
}

var TSVExportRenderer = function (_React$PureComponent2) {
  _inherits(TSVExportRenderer, _React$PureComponent2);

  function TSVExportRenderer() {
    _classCallCheck(this, TSVExportRenderer);

    return _possibleConstructorReturn(this, (TSVExportRenderer.__proto__ || Object.getPrototypeOf(TSVExportRenderer)).apply(this, arguments));
  }

  _createClass(TSVExportRenderer, [{
    key: 'render',
    value: function render() {
      var pivotData = new _Utilities.PivotData(this.props);
      var rowKeys = pivotData.getRowKeys();
      var colKeys = pivotData.getColKeys();
      if (rowKeys.length === 0) {
        rowKeys.push([]);
      }
      if (colKeys.length === 0) {
        colKeys.push([]);
      }

      var headerRow = pivotData.props.rows.map(function (r) {
        return r;
      });
      if (colKeys.length === 1 && colKeys[0].length === 0) {
        headerRow.push(this.props.aggregatorName);
      } else {
        colKeys.map(function (c) {
          return headerRow.push(c.join('-'));
        });
      }

      var result = rowKeys.map(function (r) {
        var row = r.map(function (x) {
          return x;
        });
        colKeys.map(function (c) {
          var v = pivotData.getAggregator(r, c).value();
          row.push(v ? v : '');
        });
        return row;
      });

      result.unshift(headerRow);

      return _react2.default.createElement('textarea', {
        value: result.map(function (r) {
          return r.join('\t');
        }).join('\n'),
        style: { width: window.innerWidth / 2, height: window.innerHeight / 2 },
        readOnly: true
      });
    }
  }]);

  return TSVExportRenderer;
}(_react2.default.PureComponent);

TSVExportRenderer.defaultProps = _Utilities.PivotData.defaultProps;
TSVExportRenderer.propTypes = _Utilities.PivotData.propTypes;

exports.default = {
  Tabela: makeRenderer(),
  'Tabela Mapa de Calor': makeRenderer({ heatmapMode: 'full' }),
  'Tabela Mapa de Calor Colunas': makeRenderer({ heatmapMode: 'col' }),
  'Tabela Mapa de Calor Linhas': makeRenderer({ heatmapMode: 'row' }),
  'Exportar Para TSV': TSVExportRenderer
};
module.exports = exports.default;
// # sourceMappingURL=TableRenderers.js.map
