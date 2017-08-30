import { configure } from '@storybook/react';
import { setOptions } from '@storybook/addon-options';

setOptions({
  name: "React-PivotTable",
  url: "https://github.com/plotly/react-pivottable",
  showDownPanel: false,
});

function loadStories() {
  require('../stories');
}

configure(loadStories, module);
