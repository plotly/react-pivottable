import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { linkTo } from '@storybook/addon-links';
import {PivotData} from '../src/Utilities';
import TableRenderer from '../src/TableRenderer'


storiesOf('SmartWrapper', module)
  .add('Table Renderer', function(){
    const data = [['a','b','c','d'],[1,1,1,1],[1,2,1,2],[2,1,2,1],[2,2,2,2]];
    const pivotData = new PivotData(data, {cols:['a','b'], rows:['c','d']});
    return <TableRenderer {...{pivotData}} />
    }
    );
