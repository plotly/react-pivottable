import React from 'react';

import { setAddon, storiesOf } from '@storybook/react';

import PivotTable from '../src/PivotTable'
import { mps } from './SampleData'
const dataSetHider = (dataset) => (injectRecord) => dataset.map(injectRecord);

storiesOf('PivotTable', module)
  .add('Canadian MPs 2012 dataset', () => <PivotTable
    cols={['Party']} rows={['Province']} data={dataSetHider(mps)} />
  );



