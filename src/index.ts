// JSON data exports (existing)
import department from "./data/department.json";
import roles from "./data/roles.json";
import jobs from "./data/jobs.json";
import skills from "./data/skills.json";
import connectors from "./data/connectors.json";

export { department, roles, jobs, skills, connectors };

// Re-export connectors config types for consumers who want typed imports
export type { ConnectorsConfig } from "./data/connectors-config.js";

// Launch Readiness Service — VAL-DEPT-PRODUCT-TECH-001
export { LaunchReadinessService } from "./launch-readiness-service.js";
export type {
  LaunchReadinessPacket,
  ReadinessEvidence,
  ReadinessRisk,
  ReadinessMitigation,
  ReadinessDecision,
  FollowUpItem,
  CreateReadinessPacketParams,
  UpdateReadinessPacketParams,
  SubmitReadinessPacketParams,
  LaunchReadinessState,
  EvidenceLink,
} from "./types.js";

// Incident Learning Service
export { IncidentLearningService } from "./incident-learning-service.js";
export type {
  IncidentLearning,
  IncidentLearningReport,
  PersistentAction,
  ActionKind,
  IncidentSeverity,
  IncidentStatus,
  IngestIncidentLearningParams,
  CreatePersistentActionParams,
  LinkActionToInitiativeParams,
  UpdateActionStatusParams,
  IncidentLearningState,
} from "./types.js";

// Connector Health functions — XAF-007
export type {
  ConnectorHealthSummary,
  ConnectorHealthState,
  ConnectorHealthStatus,
  ToolkitLimitation,
} from "./types.js";
export type { RuntimeHealthCheckResult } from "./connector-health.js";
export {
  getRequiredToolkits,
  getExtendedConnectors,
  getExtendedConnector,
  getAllToolkitIds,
  getToolkitDisplayName,
  createInitialConnectorHealthState,
  updateConnectorHealthState,
  hasImpairedConnectors,
  getImpairedConnectors,
  generateToolkitLimitations,
  computeDepartmentHealthStatus,
  performRuntimeHealthCheck,
  formatLimitationMessage,
  formatAllLimitations,
} from "./connector-health.js";

// Zapier Health backend (connector health check implementation)
export { checkToolkitHealth } from "./zapier-health.js";

// Worker internal exports — for plugin runtime only
// Note: launchReadinessService and incidentLearningService are instantiated
// in worker.ts; re-exporting singletons helps consumers using the same worker
