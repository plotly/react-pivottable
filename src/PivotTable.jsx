import React from 'react';
import PropTypes from 'prop-types';
import {PivotData} from './Utilities';
import TableRenderer from './TableRenderer';
import PlotlyRenderers from './PlotlyRenderers';

/* eslint-disable react/prop-types */
// eslint can't see inherited propTypes!

class PivotTable extends React.PureComponent {
    render() {
        const renderers = Object.keys(this.props.renderers)
            .filter(r => !('dependenciesAreMet' in this.props.renderers[r])
                || this.props.renderers[r].dependenciesAreMet(this.props))
            .reduce((result, r) => {
                result[r] = this.props.renderers[r];
                return result;
            }, {});

        let rendererName = this.props.rendererName;

        if (!(rendererName in renderers)) {
            rendererName = Object.keys(renderers)[0];
        }


        const Renderer = renderers[rendererName];
        return <Renderer {...this.props} />;
    }
}


PivotTable.propTypes = Object.assign({}, PivotData.propTypes, {
    rendererName: PropTypes.string,
    renderers: PropTypes.objectOf(PropTypes.func)
});

PivotTable.defaultProps = Object.assign({}, PivotData.defaultProps, {
    renderers: [TableRenderer].concat(PlotlyRenderers)
        .reduce((result, r) => {
            result[r.defaultRendererName()] = r;
            return result;
        }, {})
});

export default PivotTable;
