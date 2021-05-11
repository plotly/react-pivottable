'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = createPlotlyRenderers;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _Utilities = require('./Utilities');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

function makeRenderer(PlotlyComponent) {
  var traceOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var layoutOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var transpose = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  var Renderer = function (_React$PureComponent) {
    _inherits(Renderer, _React$PureComponent);

    function Renderer() {
      _classCallCheck(this, Renderer);

      return _possibleConstructorReturn(this, (Renderer.__proto__ || Object.getPrototypeOf(Renderer)).apply(this, arguments));
    }

    _createClass(Renderer, [{
      key: 'render',
      value: function render() {
        var pivotData = new _Utilities.PivotData(this.props);
        var rowKeys = pivotData.getRowKeys();
        var colKeys = pivotData.getColKeys();
        var traceKeys = transpose ? colKeys : rowKeys;
        if (traceKeys.length === 0) {
          traceKeys.push([]);
        }
        var datumKeys = transpose ? rowKeys : colKeys;
        if (datumKeys.length === 0) {
          datumKeys.push([]);
        }

        var fullAggName = this.props.aggregatorName;
        var numInputs = this.props.aggregators[fullAggName]([])().numInputs || 0;
        if (numInputs !== 0) {
          fullAggName += ' of ' + this.props.vals.slice(0, numInputs).join(', ');
        }

        var data = traceKeys.map(function (traceKey) {
          var values = [];
          var labels = [];
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = datumKeys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var datumKey = _step.value;

              var val = parseFloat(pivotData.getAggregator(transpose ? datumKey : traceKey, transpose ? traceKey : datumKey).value());
              values.push(isFinite(val) ? val : null);
              labels.push(datumKey.join('-') || ' ');
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

          var trace = { name: traceKey.join('-') || fullAggName };
          if (traceOptions.type === 'pie') {
            trace.values = values;
            trace.labels = labels.length > 1 ? labels : [fullAggName];
          } else {
            trace.x = transpose ? values : labels;
            trace.y = transpose ? labels : values;
          }
          return Object.assign(trace, traceOptions);
        });

        var titleText = fullAggName;
        var hAxisTitle = transpose ? this.props.rows.join('-') : this.props.cols.join('-');
        var groupByTitle = transpose ? this.props.cols.join('-') : this.props.rows.join('-');
        if (hAxisTitle !== '') {
          titleText += ' vs ' + hAxisTitle;
        }
        if (groupByTitle !== '') {
          titleText += ' by ' + groupByTitle;
        }

        var layout = {
          title: titleText,
          hovermode: 'closest',
          /* eslint-disable no-magic-numbers */
          width: window.innerWidth / 1.5,
          height: window.innerHeight / 1.4 - 50
          /* eslint-enable no-magic-numbers */
        };

        if (traceOptions.type === 'pie') {
          var columns = Math.ceil(Math.sqrt(data.length));
          var rows = Math.ceil(data.length / columns);
          layout.grid = { columns: columns, rows: rows };
          data.forEach(function (d, i) {
            d.domain = {
              row: Math.floor(i / columns),
              column: i - columns * Math.floor(i / columns)
            };
            if (data.length > 1) {
              d.title = d.name;
            }
          });
          if (data[0].labels.length === 1) {
            layout.showlegend = false;
          }
        } else {
          layout.xaxis = {
            title: transpose ? fullAggName : null,
            automargin: true
          };
          layout.yaxis = {
            title: transpose ? null : fullAggName,
            automargin: true
          };
        }

        return _react2.default.createElement(PlotlyComponent, {
          data: data,
          layout: Object.assign(layout, layoutOptions, this.props.plotlyOptions),
          config: this.props.plotlyConfig,
          onUpdate: this.props.onRendererUpdate
        });
      }
    }]);

    return Renderer;
  }(_react2.default.PureComponent);

  Renderer.defaultProps = Object.assign({}, _Utilities.PivotData.defaultProps, {
    plotlyOptions: {},
    plotlyConfig: {}
  });
  Renderer.propTypes = Object.assign({}, _Utilities.PivotData.propTypes, {
    plotlyOptions: _propTypes2.default.object,
    plotlyConfig: _propTypes2.default.object,
    onRendererUpdate: _propTypes2.default.func
  });

  return Renderer;
}

function makeScatterRenderer(PlotlyComponent) {
  var Renderer = function (_React$PureComponent2) {
    _inherits(Renderer, _React$PureComponent2);

    function Renderer() {
      _classCallCheck(this, Renderer);

      return _possibleConstructorReturn(this, (Renderer.__proto__ || Object.getPrototypeOf(Renderer)).apply(this, arguments));
    }

    _createClass(Renderer, [{
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

        var data = { x: [], y: [], text: [], type: 'scatter', mode: 'markers' };

        rowKeys.map(function (rowKey) {
          colKeys.map(function (colKey) {
            var v = pivotData.getAggregator(rowKey, colKey).value();
            if (v !== null) {
              data.x.push(colKey.join('-'));
              data.y.push(rowKey.join('-'));
              data.text.push(v);
            }
          });
        });

        var layout = {
          title: this.props.rows.join('-') + ' vs ' + this.props.cols.join('-'),
          hovermode: 'closest',
          /* eslint-disable no-magic-numbers */
          xaxis: { title: this.props.cols.join('-'), automargin: true },
          yaxis: { title: this.props.rows.join('-'), automargin: true },
          width: window.innerWidth / 1.5,
          height: window.innerHeight / 1.4 - 50
          /* eslint-enable no-magic-numbers */
        };

        return _react2.default.createElement(PlotlyComponent, {
          data: [data],
          layout: Object.assign(layout, this.props.plotlyOptions),
          config: this.props.plotlyConfig,
          onUpdate: this.props.onRendererUpdate
        });
      }
    }]);

    return Renderer;
  }(_react2.default.PureComponent);

  Renderer.defaultProps = Object.assign({}, _Utilities.PivotData.defaultProps, {
    plotlyOptions: {},
    plotlyConfig: {}
  });
  Renderer.propTypes = Object.assign({}, _Utilities.PivotData.propTypes, {
    plotlyOptions: _propTypes2.default.object,
    plotlyConfig: _propTypes2.default.object,
    onRendererUpdate: _propTypes2.default.func
  });

  return Renderer;
}

function createPlotlyRenderers(PlotlyComponent) {
  return {
    'Grouped Column Chart': makeRenderer(PlotlyComponent, { type: 'bar' }, { barmode: 'group' }),
    'Stacked Column Chart': makeRenderer(PlotlyComponent, { type: 'bar' }, { barmode: 'relative' }),
    'Grouped Bar Chart': makeRenderer(PlotlyComponent, { type: 'bar', orientation: 'h' }, { barmode: 'group' }, true),
    'Stacked Bar Chart': makeRenderer(PlotlyComponent, { type: 'bar', orientation: 'h' }, { barmode: 'relative' }, true),
    'Line Chart': makeRenderer(PlotlyComponent),
    'Dot Chart': makeRenderer(PlotlyComponent, { mode: 'markers' }, {}, true),
    'Area Chart': makeRenderer(PlotlyComponent, { stackgroup: 1 }),
    'Scatter Chart': makeScatterRenderer(PlotlyComponent),
    'Multiple Pie Chart': makeRenderer(PlotlyComponent, { type: 'pie', scalegroup: 1, hoverinfo: 'label+value', textinfo: 'none' }, {}, true)
  };
}
module.exports = exports['default'];
//# sourceMappingURL=PlotlyRenderers.js.map