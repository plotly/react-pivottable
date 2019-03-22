import * as React from 'react';
import {PivotDataDefaultProps, IPivotDataProps} from './Utilities';
import TableRenderers from './TableRenderers';

interface IProps {
  rendererName?: string
  renderers: any
}
export interface IPivotTableProps extends IProps, IPivotDataProps {}
export class PivotTable extends React.PureComponent<IPivotTableProps,{}> {
  static defaultProps = {
    ...PivotDataDefaultProps,
    rendererName: 'Table',
    renderers: TableRenderers,
  }
  render() {
    const Renderer = this.props.renderers[
      this.props.rendererName! in this.props.renderers
        ? this.props.rendererName!
        : Object.keys(this.props.renderers)[0]
    ];
    return <Renderer {...this.props} />;
  }
}
