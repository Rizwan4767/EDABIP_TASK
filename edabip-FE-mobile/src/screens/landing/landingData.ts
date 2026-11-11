import type { ImageSourcePropType } from 'react-native';

import {
  AiFeaturesIcon,
  AnalyticsEngineIcon,
  CollaborationToolsIcon,
  DataProcessingIcon,
  DataSourcesIcon,
  KpiMonitoringIcon,
  LifecycleAiIcon,
  LifecycleCollectIcon,
  LifecycleProcessIcon,
  LifecycleVisualizeIcon,
  LoremShieldIcon,
  ModuleAlertsIcon,
  ModuleAnalyticsIcon,
  ModuleDashboardsIcon,
  ModuleReportsClockIcon,
  ModuleReportsIcon,
  PillarAuditIcon,
  PillarE2eeIcon,
  PillarMfaIcon,
  PillarRbacIcon,
} from '@/assets/landing';

export type LandingSectionId = 'overview' | 'modules' | 'lifecycle' | 'pillars' | 'subscribe';

export const landingChips = [
  { label: 'Data Process', backgroundColor: '#FFCC59' },
  { label: 'AI Analysis Platform', backgroundColor: '#E1C9FF' },
  { label: 'Visualisation Insights', backgroundColor: '#91DBFF' },
] as const;

export const landingHighlights = [
  { label: 'Real Time KPI Monitoring', icon: KpiMonitoringIcon, width: 12, height: 12 },
  { label: 'Secure By Design', icon: LoremShieldIcon, width: 12, height: 16 },
] as const;

export interface OverviewStep {
  step: string;
  title: string;
  body: string;
  featureTitle: string;
  featureIcon: ImageSourcePropType;
  featureIconWidth: number;
  featureIconHeight: number;
  bullets: readonly [string, string, string, string];
}

export const overviewSteps: readonly OverviewStep[] = [
  {
    step: '1',
    title: 'Connect Your Data',
    body: 'Integrate data from ERP, CRM, HRMS, Finance, APIs, cloud platforms, and databases into a unified analytics ecosystem.',
    featureTitle: 'Data Sources',
    featureIcon: DataSourcesIcon,
    featureIconWidth: 18,
    featureIconHeight: 18,
    bullets: [
      '100+ Data Connectors',
      'Cloud & On-Premise',
      'Real-Time Data Sync',
      'API Integration',
    ],
  },
  {
    step: '2',
    title: 'Prepare & Transform',
    body: 'Clean, validate, enrich, and transform raw data into reliable datasets using powerful ETL and data processing pipelines.',
    featureTitle: 'Data Processing',
    featureIcon: DataProcessingIcon,
    featureIconWidth: 18,
    featureIconHeight: 18,
    bullets: ['Data Cleansing', 'Data Validation', 'ETL Pipelines', 'Data Enrichment'],
  },
  {
    step: '3',
    title: 'Visualize Business Insights',
    body: 'Create interactive dashboards and monitor key business metrics with powerful visual analytics and executive reporting.',
    featureTitle: 'Analytics Engine',
    featureIcon: AnalyticsEngineIcon,
    featureIconWidth: 18,
    featureIconHeight: 18,
    bullets: ['Interactive Dashboards', 'KPI Monitoring', 'Power BI', 'Tableau'],
  },
  {
    step: '4',
    title: 'AI-Powered Analytics',
    body: 'Leverage predictive analytics and machine learning to forecast trends, detect anomalies, and generate intelligent recommendations.',
    featureTitle: 'AI Features',
    featureIcon: AiFeaturesIcon,
    featureIconWidth: 16,
    featureIconHeight: 18,
    bullets: [
      'Predictive Analytics',
      'Trend Forecasting',
      'Anomaly Detection',
      'Smart Recommendations',
    ],
  },
  {
    step: '5',
    title: 'Collaborate & Automate',
    body: 'Share reports, schedule automated dashboards, receive real-time alerts, and enable collaboration across teams.',
    featureTitle: 'Collaboration Tools',
    featureIcon: CollaborationToolsIcon,
    featureIconWidth: 18,
    featureIconHeight: 18,
    bullets: ['Automated Reports', 'Smart Alerts', 'Workflow Automation', 'Team Collaboration'],
  },
];

export interface ModuleCard {
  title: string;
  body: string;
  icon: ImageSourcePropType;
  meta?: { icon: ImageSourcePropType; label: string };
  showViewMore?: boolean;
}

export const moduleCards: readonly ModuleCard[] = [
  {
    title: 'Dashboards',
    body: 'Gain complete visibility into your enterprise with interactive dashboards, real-time analytics, and AI-powered insights.',
    icon: ModuleDashboardsIcon,
    showViewMore: true,
  },
  {
    title: 'Reports',
    body: 'Automated PDF/XLS export of scheduled compliance and performance audits.',
    icon: ModuleReportsIcon,
    meta: { icon: ModuleReportsClockIcon, label: 'Last generated 2h ago' },
  },
  {
    title: 'Analytics',
    body: 'Deep-dive engine for multi-dimensional data exploration and predictive testing. Leverage AI-driven insights to uncover hidden patterns.',
    icon: ModuleAnalyticsIcon,
  },
  {
    title: 'Alerts',
    body: 'Smart notification system with multi-channel routing (Slack, SMS, Email). Never miss a critical threshold breach with intelligent escalation.',
    icon: ModuleAlertsIcon,
  },
];

export interface LifecycleCard {
  title: string;
  body: string;
  phase: string;
  icon: ImageSourcePropType;
}

export const lifecycleCards: readonly LifecycleCard[] = [
  {
    title: 'Data Collection',
    body: "Unlock deeper business intelligence with EDABIP's AI-powered analytics engine.",
    phase: 'Phase 01',
    icon: LifecycleCollectIcon,
  },
  {
    title: 'Process Data',
    body: "Transform raw data into trusted business intelligence with EDABIP's intelligent data preparation engine.",
    phase: 'Phase 02',
    icon: LifecycleProcessIcon,
  },
  {
    title: 'AI Analysis',
    body: "Unlock deeper business intelligence with EDABIP's AI-powered analytics engine.",
    phase: 'Phase 03',
    icon: LifecycleAiIcon,
  },
  {
    title: 'Visualize Insights',
    body: 'Transform complex enterprise data into intuitive, interactive dashboards designed for executive decision-making.',
    phase: 'Phase 04',
    icon: LifecycleVisualizeIcon,
  },
];

export interface PillarCard {
  title: string;
  body: string;
  tag: string;
  icon: ImageSourcePropType;
}

export const pillarCards: readonly PillarCard[] = [
  {
    title: 'MFA Authentication',
    body: 'Identity-first security with biometric and FIDO2 hardware token support across all endpoints.',
    tag: 'FIDO2 & BIOMETRIC READY',
    icon: PillarMfaIcon,
  },
  {
    title: 'E2EE Encryption',
    body: 'Military-grade AES-256 standards applied to data both at rest and in active transit.',
    tag: 'AES-256 STANDARD',
    icon: PillarE2eeIcon,
  },
  {
    title: 'RBAC Control',
    body: 'Precision attribute-based access control (ABAC) down to the individual cell level.',
    tag: 'GRANULAR PERMISSIONS',
    icon: PillarRbacIcon,
  },
  {
    title: 'Immutable Audit Logs',
    body: 'Tamper-proof, blockchain-verified tracking of every single user and system interaction.',
    tag: 'BLOCKCHAIN VERIFIED',
    icon: PillarAuditIcon,
  },
];

export const footerColumns = [
  {
    title: 'Platform',
    links: [
      { label: 'Feature', section: 'overview' as const },
      { label: 'Dashboard', section: 'modules' as const },
      { label: 'Integration', section: 'overview' as const },
      { label: 'Security', section: 'pillars' as const },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'By Industry', section: 'modules' as const },
      { label: 'By Department', section: 'modules' as const },
      { label: 'Use Cases', section: 'lifecycle' as const },
      { label: 'AI Analytics', section: 'overview' as const },
    ],
  },
] as const;
