/**
 * Launch Readiness Packet Types
 * VAL-DEPT-PRODUCT-TECH-001: Launch readiness packet closes the loop from idea to go or no-go
 */

export interface ReadinessEvidence {
  id: string;
  type: "research" | "technical" | "operational" | "reliability" | "risk";
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;
  collectedAt: string;
  confidence: "high" | "medium" | "low";
  tags: string[];
}

export interface ReadinessRisk {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  likelihood: "likely" | "possible" | "unlikely";
  impact: "blocking" | "significant" | "minor";
  mitigation?: string;
  mitigationStatus: "pending" | "in-progress" | "completed" | "accepted";
  ownerRoleKey?: string;
}

export interface ReadinessMitigation {
  id: string;
  riskId: string;
  title: string;
  description: string;
  status: "planned" | "in-progress" | "completed" | "failed";
  ownerRoleKey?: string;
  dueDate?: string;
  completedAt?: string;
}

export type ReadinessDecision = "go" | "no-go" | "conditional-go" | "deferred";

export interface LaunchReadinessPacket {
  id: string;
  initiativeId: string;
  initiativeName: string;
  ownerRoleKey: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "in-review" | "approved" | "rejected" | "superseded";

  // Evidence gathering
  evidence: ReadinessEvidence[];

  // Risk assessment
  risks: ReadinessRisk[];

  // Mitigations
  mitigations: ReadinessMitigation[];

  // Decision
  decision: ReadinessDecision;
  decisionRationale: string;
  decisionByRoleKey?: string;
  decidedAt?: string;

  // Follow-up items for unresolved items
  followUpItems: FollowUpItem[];

  // Readiness score (0-100)
  readinessScore: number;

  // Evidence links for verification
  evidenceLinks: EvidenceLink[];
}

export interface FollowUpItem {
  id: string;
  title: string;
  description: string;
  relatedRiskId?: string;
  relatedEvidenceId?: string;
  status: "open" | "in-progress" | "completed" | "deferred";
  ownerRoleKey?: string;
  dueDate?: string;
  priority: "critical" | "high" | "medium" | "low";
}

export interface EvidenceLink {
  id: string;
  evidenceId: string;
  url: string;
  label: string;
  type: "document" | "system" | "dashboard" | "runbook" | "other";
}

/**
 * Incident Learning Types
 * VAL-DEPT-PRODUCT-TECH-002: Incident learning converts into tracked roadmap, enablement, or reliability action
 */

export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "resolved" | "closed" | "recurring";

export interface IncidentLearning {
  id: string;
  incidentId: string;
  incidentTitle: string;
  incidentSeverity: IncidentSeverity;
  incidentStatus: IncidentStatus;
  occurredAt: string;
  resolvedAt?: string;

  // Learning capture
  rootCause: string;
  lessonsLearned: string[];
  whatWentWell: string[];
  whatCouldImprove: string[];

  // Impact assessment
  affectedInitiatives: string[];
  affectedSystems: string[];
  userImpact?: string;

  // Captured by
  capturedByRoleKey?: string;
  capturedAt: string;
}

export type ActionKind = "roadmap" | "enablement" | "reliability" | "process" | "documentation";

export interface PersistentAction {
  id: string;
  title: string;
  description: string;

  // Classification
  kind: ActionKind;
  priority: "critical" | "high" | "medium" | "low";

  // Linkage to incident
  sourceIncidentId: string;
  sourceLearningId: string;

  // Initiative linkage
  linkedInitiatives: string[];

  // Status tracking
  status: "proposed" | "approved" | "in-progress" | "completed" | "deferred" | "rejected";
  ownerRoleKey?: string;

  // Timeline
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;

  // Evidence
  evidenceIds: string[];

  // Notes
  notes: string[];
}

export interface IncidentLearningReport {
  id: string;
  incidentId: string;
  learning: IncidentLearning;

  // Generated actions
  actions: PersistentAction[];

  // Summary
  totalActionsProposed: number;
  totalActionsApproved: number;
  totalActionsCompleted: number;

  // Report metadata
  generatedAt: string;
  generatedByRoleKey?: string;
}

/**
 * Service state types for plugin state management
 */

export interface LaunchReadinessState {
  packets: Record<string, LaunchReadinessPacket>;
  lastUpdated: string;
}

export interface IncidentLearningState {
  learnings: Record<string, IncidentLearning>;
  actions: Record<string, PersistentAction>;
  reports: Record<string, IncidentLearningReport>;
  lastUpdated: string;
}

/**
 * Action parameters
 */

export interface CreateReadinessPacketParams {
  initiativeId: string;
  initiativeName: string;
  ownerRoleKey: string;
}

export interface UpdateReadinessPacketParams {
  packetId: string;
  evidence?: ReadinessEvidence[];
  risks?: ReadinessRisk[];
  mitigations?: ReadinessMitigation[];
  decision?: ReadinessDecision;
  decisionRationale?: string;
  decisionByRoleKey?: string;
}

export interface SubmitReadinessPacketParams {
  packetId: string;
  decision: ReadinessDecision;
  decisionRationale: string;
  decisionByRoleKey: string;
}

export interface IngestIncidentLearningParams {
  incidentId: string;
  incidentTitle: string;
  incidentSeverity: IncidentSeverity;
  incidentStatus: IncidentStatus;
  occurredAt: string;
  resolvedAt?: string;
  rootCause: string;
  lessonsLearned: string[];
  whatWentWell: string[];
  whatCouldImprove: string[];
  affectedInitiatives: string[];
  affectedSystems: string[];
  userImpact?: string;
  capturedByRoleKey?: string;
}

export interface CreatePersistentActionParams {
  learningId: string;
  title: string;
  description: string;
  kind: ActionKind;
  priority: "critical" | "high" | "medium" | "low";
  linkedInitiatives: string[];
  ownerRoleKey?: string;
  dueDate?: string;
}

export interface LinkActionToInitiativeParams {
  actionId: string;
  initiativeId: string;
}

export interface UpdateActionStatusParams {
  actionId: string;
  status: PersistentAction["status"];
  notes?: string[];
}

// ============================================
// Connector Health Types (XAF-007)
// ============================================

export type ConnectorHealthStatus = "ok" | "degraded" | "error" | "unknown";

export interface ConnectorHealthState {
  toolkitId: string;
  status: ConnectorHealthStatus;
  lastChecked: string;
  error?: string;
  limitationMessage?: string;
}

export interface ToolkitLimitation {
  toolkitId: string;
  displayName: string;
  limitationMessage: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedWorkflows: readonly string[];
  suggestedAction: string;
}

export interface ConnectorHealthSummary {
  overallStatus: ConnectorHealthStatus;
  checkedAt: string;
  connectors: ConnectorHealthState[];
  limitations: ToolkitLimitation[];
  hasLimitations: boolean;
}

export interface SetConnectorHealthParams {
  toolkitId: string;
  status: ConnectorHealthStatus;
  error?: string;
}

export interface GetConnectorHealthParams {
  toolkitId?: string;
}
