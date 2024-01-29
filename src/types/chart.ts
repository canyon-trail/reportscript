import {
  ChartConfiguration,
  ChartConfigurationCustomTypesPerDataset,
  ChartType,
  DefaultDataPoint,
} from "chart.js";

type ChartConfig<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown
> =
  | ChartConfiguration<TType, TData, TLabel>
  | ChartConfigurationCustomTypesPerDataset<TType, TData, TLabel>;

/**
 * Configuration options for a chart.js chart.
 */
export type Chart<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown
> = {
  /** chart.js chart configuration options. */
  config: ChartConfig<TType, TData, TLabel>;
  /** minimum height of the chart in points. Prevents fitting the chart
   * into too small of a vertical area and will cause a
   * page break to be inserted before the chart.
   */
  minHeight: number;
  /** maximum height of the chart in points. Helps to prevent the chart from taking up too
   * much vertical space
   */
  maxHeight?: number;
  /**
   * Width of the chart. If unspecified, will use the full width available.
   */
  width?: number;
};
