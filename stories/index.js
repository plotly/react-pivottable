import React from 'react';

import { setAddon, storiesOf } from '@storybook/react';
import JSXAddon from 'storybook-addon-jsx'
setAddon(JSXAddon)

import PivotTable from '../src/PivotTable'
import { mps } from './SampleData'
const dataSetHider = (dataset) => (injectRecord) => dataset.map(injectRecord);

storiesOf('PivotTable', module)
  .addWithJSX('Canadian MPs 2012 dataset', () => <PivotTable
    cols={['Party']} rows={['Province']} data={dataSetHider(mps)} />
  );



