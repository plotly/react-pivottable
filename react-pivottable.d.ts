export type AggregatorName =
  'Count' |
  'Count Unique Values' |
  'List Unique Values' |
  'Sum' |
  'Integer Sum' |
  'Average' |
  'Median' |
  'Sample Variance' |
  'Sample Standard Deviation' |
  'Minimum' |
  'Maximum' |
  'First' |
  'Last' |
  'Sum over Sum' |
  'Sum as Fraction of Total' |
  'Sum as Fraction of Rows' |
  'Sum as Fraction of Columns' |
  'Count as Fraction of Total' |
  'Count as Fraction of Rows' |
  'Count as Fraction of Columns'

export type PivotState = {
  data?: (string | number)[][] | (string | number)[]
  rows?: string[]
  cols?: string[]
  aggregatorName?: AggregatorName,
  vals?: string[],
  rendererName?: string,
  sorters?: any
  plotlyOptions?: any,
  plotlyConfig?: any,
  tableOptions?: any,
}

declare module 'react-plotly.js'
