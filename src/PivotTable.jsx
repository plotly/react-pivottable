import React from 'react';
import PropTypes from 'prop-types';
import {PivotData} from './Utilities';
import TableRenderer from './TableRenderer';
import PlotlyRenderers from './PlotlyRenderers';


class PivotTable extends React.Component {
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

PivotTable.defaultProps = PivotData.defaultProps;

PivotTable.defaultProps.renderers = [TableRenderer].concat(PlotlyRenderers)
    .reduce((result, r) => {
        result[r.defaultRendererName()] = r;
        return result;
    }, {});

PivotTable.propTypes = PivotData.propTypes;

PivotTable.propTypes.rendererName = PropTypes.string;
PivotTable.propTypes.renderers = PropTypes.objectOf(PropTypes.func);


export default PivotTable;
