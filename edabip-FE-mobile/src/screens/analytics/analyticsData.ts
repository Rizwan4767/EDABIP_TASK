export type ModelStatus = 'Training' | 'Active' | 'Pending';
export type KpiTrendTone = 'success' | 'danger' | 'info';
export type KpiTrendDirection = 'up' | 'down';
export type AnalyticsKpiId = 'accuracy' | 'precision' | 'recall' | 'f1';

export interface AnalyticsKpi {
  id: AnalyticsKpiId;
  title: string;
  value: string;
  trend: {
    label: string;
    tone: KpiTrendTone;
    direction: KpiTrendDirection;
  };
}

export interface RevenuePoint {
  month: string;
  value: number;
}

export interface DemandPoint {
  day: string;
  value: number;
  color: string;
}

export interface MlModel {
  id: string;
  name: string;
  category: string;
  accuracy: string;
  status: ModelStatus;
}

export interface AnalyticsData {
  kpis: AnalyticsKpi[];
  revenueForecast: RevenuePoint[];
  demandPrediction: DemandPoint[];
  models: MlModel[];
}

/**
 * Design data transcribed from the mobile Figma analytics screen (node 52:108).
 * Replaced by `analyticsApi` once the backend router exists — do not treat this
 * as a live contract.
 */
export const ANALYTICS_DATA: AnalyticsData = {
  kpis: [
    {
      id: 'accuracy',
      title: 'Model Accuracy',
      value: '98.4%',
      trend: { label: '+12% vs last month', tone: 'success', direction: 'up' },
    },
    {
      id: 'precision',
      title: 'Precision',
      value: '0.97',
      trend: { label: '+0.3% vs last month', tone: 'danger', direction: 'down' },
    },
    {
      id: 'recall',
      title: 'Recall',
      value: '0.96',
      trend: { label: '+45 new vs last week', tone: 'info', direction: 'up' },
    },
    {
      id: 'f1',
      title: 'F1 Score',
      value: '0.96',
      trend: { label: '+8.1% vs last quarter', tone: 'success', direction: 'up' },
    },
  ],
  revenueForecast: [
    { month: 'Jan', value: 24 },
    { month: 'Feb', value: 32 },
    { month: 'Mar', value: 28 },
    { month: 'Apr', value: 46 },
    { month: 'May', value: 54 },
    { month: 'Jun', value: 50 },
    { month: 'Jul', value: 63 },
    { month: 'Aug', value: 76 },
    { month: 'Sep', value: 82 },
  ],
  demandPrediction: [
    { day: 'Mon', value: 23000, color: '#ABF2E8' },
    { day: 'Tue', value: 35000, color: '#D8BFF2' },
    { day: 'Wed', value: 65000, color: '#C8D8F9' },
    { day: 'Thu', value: 95000, color: '#446665' },
    { day: 'Fri', value: 55000, color: 'rgba(19,75,74,0.5)' },
    { day: 'Sat', value: 45000, color: 'rgba(112,169,168,0.7)' },
    { day: 'Sun', value: 60000, color: '#EFB2B3' },
  ],
  models: [
    {
      id: 'sales-forecasting',
      name: 'Sales Forecasting',
      category: 'Regression',
      accuracy: '98.4%',
      status: 'Training',
    },
    {
      id: 'demand-prediction',
      name: 'Demand Prediction',
      category: 'Forecast',
      accuracy: '94.2%',
      status: 'Active',
    },
    {
      id: 'customer',
      name: 'Customer',
      category: 'Classification',
      accuracy: '91.8%',
      status: 'Active',
    },
    {
      id: 'inventory-optimization',
      name: 'Inventory Optimization',
      category: 'Use 14 Min ago',
      accuracy: '-',
      status: 'Pending',
    },
  ],
};
