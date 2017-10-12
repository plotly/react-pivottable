import React from 'react';

import { setAddon, storiesOf } from '@storybook/react';

import PivotTable from '../src/PivotTable'
import {sortAs} from '../src/Utilities'
import PivotTableUISmartWrapper from '../src/PivotTableUISmartWrapper'
import { mps } from './SampleData'

storiesOf('Canadian Parliament 2012', module)
  .add('PivotTable', () =>
    <PivotTable cols={['Party']} rows={['Province']}
    data={(injectRecord) => mps.map(injectRecord)} />
  )
  .add('PivotTableUISmartWrapper', () =>
      <PivotTableUISmartWrapper cols={['Party']} rows={['Province']}
      data={(injectRecord) => mps.map(injectRecord)}/>
  )
  .add('PivotTableUISmartWrapper with Plotly', () =>
      <PivotTableUISmartWrapper cols={['Party']} rows={['Province']}
      rendererName="Bar Chart"
      data={(injectRecord) => mps.map(injectRecord)}
      Plotly={window.Plotly} />
  );



