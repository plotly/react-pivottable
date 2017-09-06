import React from 'react';

import { setAddon, storiesOf } from '@storybook/react';

import PivotTable from '../src/PivotTable'
import PivotTableUISmartWrapper from '../src/PivotTableUISmartWrapper'
import { mps } from './SampleData'

storiesOf('Canadian Parliament 2012', module)
  .add('PivotTable', () => <PivotTable
    cols={['Party']} rows={['Province']} data={(injectRecord) => mps.map(injectRecord)} />
  )
  .add('PivotTableUISmartWrapper', () => <PivotTableUISmartWrapper data={(injectRecord) => mps.map(injectRecord)}/>
  );



