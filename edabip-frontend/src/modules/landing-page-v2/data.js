import dashboardIcon from "../../assets/newlanding-page/dashboard-icon.svg";
import dataSourceIcon from "../../assets/newlanding-page/platform-overview/data-source.svg";
import dataProcessingIcon from "../../assets/newlanding-page/platform-overview/data-processing.svg";
import analyticsEngineIcon from "../../assets/newlanding-page/platform-overview/analytics-engine.svg";
import aiPlatformIcon from "../../assets/newlanding-page/platform-overview/ai.svg";
import reportsIcon from "../../assets/newlanding-page/modular-overview/reports.svg";
import analyticsIcon from "../../assets/newlanding-page/modular-overview/analytics.svg";
import alertsIcon from "../../assets/newlanding-page/modular-overview/alerts.svg";
import userManagementIcon from "../../assets/newlanding-page/modular-overview/user-management.svg";
import dataCollectionIcon from "../../assets/newlanding-page/core/data-collection.svg";
import processDataIcon from "../../assets/newlanding-page/core/process-data.svg";
import aiAnalysisIcon from "../../assets/newlanding-page/core/ai-analysis.svg";
import visualizeInsightsIcon from "../../assets/newlanding-page/core/visualize-insights.svg";
import mfaIcon from "../../assets/newlanding-page/data-Sovereignty/MFA.svg";
import e2eeIcon from "../../assets/newlanding-page/data-Sovereignty/e2ee.svg";
import rbacIcon from "../../assets/newlanding-page/data-Sovereignty/rbac.svg";
import blockchainIcon from "../../assets/newlanding-page/data-Sovereignty/blockchain.svg";
import mfaLightIcon from "../../assets/newlanding-page/data-Sovereignty/MFA - light.svg";
import e2eeLightIcon from "../../assets/newlanding-page/data-Sovereignty/e2ee -light.svg";
import rbacLightIcon from "../../assets/newlanding-page/data-Sovereignty/rbac -light.svg";
import blockchainLightIcon from "../../assets/newlanding-page/data-Sovereignty/blockchain -light.svg";


export const platformStages = [
  {
    id: "centralized",
    icon: dataSourceIcon,
    itemKeys: ["i1", "i2", "i3", "i4"],
  },
  {
    id: "process",
    icon: dataProcessingIcon,
    itemKeys: ["i1", "i2", "i3", "i4"],
  },
  {
    id: "visualize",
    icon: analyticsEngineIcon,
    itemKeys: ["i1", "i2", "i3", "i4"],
  },
  {
    id: "ai",
    icon: aiPlatformIcon,
    itemKeys: ["i1", "i2", "i3", "i4"],
  },
  {
    id: "collaborate",
    itemKeys: ["i1", "i2", "i3", "i4"],
  },
];

export const modules = [
  {
    id: "dashboard",
    icon: dashboardIcon,
    featured: true,
  },
  {
    id: "reports",
    icon: reportsIcon,
    meta: true,
  },
  {
    id: "analytics",
    icon: analyticsIcon,
  },
  {
    id: "alerts",
    icon: alertsIcon,
  },
  {
    id: "userManagement",
    icon: userManagementIcon,
  },
];

export const lifecycleSteps = [
  {
    id: "dataCollection",
    icon: dataCollectionIcon,
    tags: ["api", "etl"],
  },
  {
    id: "processData",
    icon: processDataIcon,
    featured: true,
    tags: ["ai"],
  },
  {
    id: "aiAnalysis",
    icon: aiAnalysisIcon,
    wide: true,
    action: true,
  },
  {
    id: "visualizeInsights",
    icon: visualizeInsightsIcon,
  },
];

export const sovereigntyPillars = [
  {
    id: "mfa",
    icon: mfaIcon,
    iconLight: mfaLightIcon,
    tag: "fido",
  },
  {
    id: "encryption",
    icon: e2eeIcon,
    iconLight: e2eeLightIcon,
    tag: "aes",
  },
  {
    id: "rbac",
    icon: rbacIcon,
    iconLight: rbacLightIcon,
    tag: "permissions",
  },
  {
    id: "audit",
    icon: blockchainIcon,
    iconLight: blockchainLightIcon,
    tag: "blockchain",
  },
];
