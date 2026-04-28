/**
 * Connector Health Service
 * 
 * Tracks health status of required connectors and generates explicit
 * limitation messaging when connectors are impaired.
 * 
 * This implements XAF-007: Department workflows degrade explicitly when
 * dependent connectors or tools are impaired.
 */

import { connectorsConfig, type ExtendedConnector } from "./data/connectors-config.js";
export { connectorsConfig };
import { checkToolkitHealth } from "./zapier-health.js";


export type ConnectorHealthStatus = "ok" | "degraded" | "error" | "unknown";

export interface ConnectorHealthState {
  toolkitId: string;
  status: ConnectorHealthStatus;
  lastChecked: string;
  error?: string;
  limitationMessage?: string;
  category?: ExtendedConnector["category"];
}

export interface ToolkitLimitation {
  toolkitId: string;
  displayName: string;
  limitationMessage: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedWorkflows: readonly string[];
  suggestedAction: string;
  category?: ExtendedConnector["category"];
}

// Connector display names mapping — extended with Paperclip-native connectors
const TOOLKIT_DISPLAY_NAMES: Record<string, string> = {
  github: "GitHub",
  googledrive: "Google Drive",
  googledocs: "Google Docs",
  slack: "Slack",
  // Paperclip-native connectors
  resend: "Resend (Email)",
  telegram: "Telegram",
  paperclip: "Paperclip API",
  cloudflare: "Cloudflare",
};

// Default limitation messages per connector
const DEFAULT_LIMITATION_MESSAGES: Record<string, string> = {
  github: "GitHub integration is currently unavailable. Code reviews, issue tracking, and release workflows may be delayed.",
  googledrive: "Google Drive integration is currently unavailable. Research document access may be limited.",
  googledocs: "Google Docs integration is currently unavailable. Documentation access may be limited.",
  slack: "Slack integration is currently unavailable. Team notifications and engineering updates may be delayed.",
  // Paperclip-native connectors
  resend: "Resend email integration is currently unavailable. Customer onboarding, transactional emails, and outreach may be blocked — this is a CRITICAL revenue impact.",
  telegram: "Telegram integration is currently unavailable. Community outreach and engagement workflows are blocked.",
  paperclip: "Paperclip API is currently unavailable. Company issue management, agent coordination, and operational context are impaired.",
  cloudflare: "Cloudflare integration is currently unavailable. DNS management, email routing, and inbox Worker are affected — CRITICAL for Resend DNS verification.",
};

/**
 * Get the list of required toolkits for this department
 */
export function getRequiredToolkits(): string[] {
  return [...connectorsConfig.requiredToolkits];
}

/**
 * Get all extended connectors (Paperclip-native + dev toolkits)
 * Use this to get the full picture of company connector dependencies
 */
export function getExtendedConnectors(): ExtendedConnector[] {
  return [...connectorsConfig.extendedConnectors];
}

/**
 * Get extended connector by toolkitId
 */
export function getExtendedConnector(toolkitId: string): ExtendedConnector | undefined {
  return connectorsConfig.extendedConnectors.find((c) => c.toolkitId === toolkitId);
}

/**
 * Get all toolkit IDs (required + extended)
 */
export function getAllToolkitIds(): string[] {
  const required = getRequiredToolkits();
  const extended = connectorsConfig.extendedConnectors.map((c) => c.toolkitId);
  return [...new Set([...required, ...extended])];
}

/**
 * Get toolkit display name
 */
export function getToolkitDisplayName(toolkitId: string): string {
  return TOOLKIT_DISPLAY_NAMES[toolkitId] || toolkitId;
}

/**
 * Create initial connector health state for all required toolkits.
 * Optionally includes extended connectors for full company-wide view.
 */
export function createInitialConnectorHealthState(includeExtended = false): ConnectorHealthState[] {
  const allToolkitIds = includeExtended
    ? getAllToolkitIds()
    : getRequiredToolkits();
  const now = new Date().toISOString();

  return allToolkitIds.map((toolkitId) => {
    const ext = getExtendedConnector(toolkitId);
    return {
      toolkitId,
      status: "unknown" as ConnectorHealthStatus,
      lastChecked: now,
      category: ext?.category,
    };
  });
}

/**
 * Update connector health state
 */
export function updateConnectorHealthState(
  currentState: ConnectorHealthState[],
  toolkitId: string,
  status: ConnectorHealthStatus,
  error?: string
): ConnectorHealthState[] {
  const now = new Date().toISOString();

  return currentState.map((state) => {
    if (state.toolkitId === toolkitId) {
      return {
        ...state,
        status,
        lastChecked: now,
        error,
        limitationMessage:
          status !== "ok" ? DEFAULT_LIMITATION_MESSAGES[toolkitId] : undefined,
      };
    }
    return state;
  });
}

/**
 * Check if any connectors are impaired
 */
export function hasImpairedConnectors(states: ConnectorHealthState[]): boolean {
  return states.some(
    (state) => state.status === "degraded" || state.status === "error"
  );
}

/**
 * Get impaired connectors
 */
export function getImpairedConnectors(
  states: ConnectorHealthState[]
): ConnectorHealthState[] {
  return states.filter(
    (state) => state.status === "degraded" || state.status === "error"
  );
}

/**
 * Generate toolkit limitations based on impaired connectors.
 * Uses extended connector registry for accurate severity, workflows, and suggestions.
 */
export function generateToolkitLimitations(
  states: ConnectorHealthState[]
): ToolkitLimitation[] {
  const impaired = getImpairedConnectors(states);

  return impaired.map((connector) => {
    const ext = getExtendedConnector(connector.toolkitId);

    let severity: "critical" | "high" | "medium" | "low" = "high";
    if (connector.status === "error") {
      severity = ext?.severityWhenDown ?? "critical";
    } else if (connector.status === "degraded") {
      severity = ext ? (severity = "medium") : "medium";
    }

    // Use extended connector data for richer information
    const affectedWorkflows = ext?.affectedWorkflows
      ?? getAffectedWorkflows(connector.toolkitId);

    return {
      toolkitId: connector.toolkitId,
      displayName: getToolkitDisplayName(connector.toolkitId),
      limitationMessage:
        connector.limitationMessage
        ?? ext?.description
        ?? DEFAULT_LIMITATION_MESSAGES[connector.toolkitId]
        ?? `The ${getToolkitDisplayName(connector.toolkitId)} integration is currently unavailable.`,
      severity,
      affectedWorkflows,
      suggestedAction: getSuggestedAction(connector.toolkitId, connector.status, ext),
      category: ext?.category,
    };
  });
}

/**
 * Get workflows affected by a specific connector failure
 */
function getAffectedWorkflows(toolkitId: string): string[] {
  const workflowMap: Record<string, string[]> = {
    github: [
      "Code reviews",
      "Issue tracking",
      "Release management",
      "CI/CD pipelines",
    ],
    googledrive: [
      "Research document access",
      "Project planning documents",
    ],
    googledocs: [
      "Documentation access",
      "Technical specifications",
    ],
    slack: [
      "Team notifications",
      "Engineering updates",
      "Incident alerts",
    ],
  };

  return workflowMap[toolkitId] || ["General product-tech workflows"];
}

/**
 * Get suggested action for a connector failure.
 * Uses extended connector registry for connector-specific guidance.
 */
function getSuggestedAction(
  toolkitId: string,
  status: ConnectorHealthStatus,
  ext?: ExtendedConnector
): string {
  // Use extended connector's health check endpoint for more specific guidance
  if (status === "error") {
    if (ext?.healthCheckEndpoint) {
      return `Reconnect ${getToolkitDisplayName(toolkitId)} (health check: ${ext.healthCheckEndpoint}). Until restored, ${ext.affectedWorkflows[0] ?? "affected workflows"} are blocked.`;
    }
    return `Reconnect the ${getToolkitDisplayName(toolkitId)} integration to restore full functionality.`;
  }
  if (ext?.healthCheckEndpoint) {
    return `Check ${getToolkitDisplayName(toolkitId)} status (${ext.healthCheckEndpoint}) and retry when connectivity is restored.`;
  }
  return `Check ${getToolkitDisplayName(toolkitId)} status and retry operations when connectivity is restored.`;
}

/**
 * Generate overall department health status based on connector health.
 * 
 * IMPORTANT: This function does NOT treat "unknown" as "ok" - that would be
 * "registering ok blindly" which violates XAF-007. If connectors haven't been
 * checked yet (all unknown), we return "unknown" to indicate health hasn't
 * been verified.
 */
export function computeDepartmentHealthStatus(
  states: ConnectorHealthState[]
): "ok" | "degraded" | "error" | "unknown" {
  if (states.length === 0) {
    return "ok";
  }

  const hasError = states.some((s) => s.status === "error");
  const hasDegraded = states.some((s) => s.status === "degraded");
  const hasUnknown = states.some((s) => s.status === "unknown");
  const allUnknown = states.every((s) => s.status === "unknown");

  // Error takes priority
  if (hasError) {
    return "error";
  }
  // Degraded connectors
  if (hasDegraded) {
    return "degraded";
  }
  // If all are unknown, health hasn't been checked yet - return unknown
  if (allUnknown) {
    return "unknown";
  }
  // If some are unknown and others are ok, we have partially checked state
  if (hasUnknown) {
    return "degraded"; // Some connectors verified ok, but some haven't been checked
  }
  // All connectors verified and all are ok
  return "ok";
}

/**
 * Interface for runtime health check result
 */
export interface RuntimeHealthCheckResult {
  toolkitId: string;
  status: ConnectorHealthStatus;
  checkedAt: string;
  error?: string;
  wasChecked: boolean;
}

/**
 * Perform runtime health check for all required connectors.
 * Optionally includes extended connectors for full company-wide health view.
 *
 * XAF-007: Department workflows degrade explicitly when dependent connectors
 * or tools are impaired.
 */
export async function performRuntimeHealthCheck(
  currentState: ConnectorHealthState[],
  includeExtended = false
): Promise<{
  updatedStates: ConnectorHealthState[];
  checkResults: RuntimeHealthCheckResult[];
  overallStatus: "ok" | "degraded" | "error" | "unknown";
  hasChecked: boolean;
}> {
  const now = new Date().toISOString();
  const checkResults: RuntimeHealthCheckResult[] = [];
  let hasChecked = false;

  const updatedStates: ConnectorHealthState[] = [];
  for (const state of currentState) {
    // Real Zapier-based health check
    const healthResult = await checkToolkitHealth(state.toolkitId);

    if (!healthResult.checked) {
      // No Zapier connection for this toolkit — preserve existing state
      checkResults.push({
        toolkitId: state.toolkitId,
        status: state.status,
        checkedAt: now,
        error: state.error,
        wasChecked: false,
      });
      hasChecked = true;
      updatedStates.push(state);
      continue;
    }

    hasChecked = true;
    const checkResult: RuntimeHealthCheckResult = {
      toolkitId: state.toolkitId,
      status: healthResult.status as ConnectorHealthStatus,
      checkedAt: now,
      error: healthResult.error,
      wasChecked: true,
    };
    checkResults.push(checkResult);

    if (healthResult.status === "ok") {
      updatedStates.push({ ...state, status: "ok" as ConnectorHealthStatus, lastChecked: now, error: undefined });
      continue;
    }

    updatedStates.push({
      ...state,
      status: healthResult.status as ConnectorHealthStatus,
      lastChecked: now,
      error: healthResult.error,
      limitationMessage: DEFAULT_LIMITATION_MESSAGES[state.toolkitId],
      category: getExtendedConnector(state.toolkitId)?.category,
    });
  }
;

  const overallStatus = computeDepartmentHealthStatus(updatedStates);

  return {
    updatedStates,
    checkResults,
    overallStatus,
    hasChecked,
  };
}

/**
 * Format limitation message for display
 */
export function formatLimitationMessage(limitation: ToolkitLimitation): string {
  return `[${limitation.severity.toUpperCase()}] ${limitation.displayName}: ${limitation.limitationMessage}`;
}

/**
 * Format all limitations for operator display
 */
export function formatAllLimitations(limitations: ToolkitLimitation[]): string {
  if (limitations.length === 0) {
    return "No connector limitations detected.";
  }

  const lines = [
    "┌─────────────────────────────────────────────────────────────┐",
    "│ CONNECTOR LIMITATIONS DETECTED                              │",
    "├─────────────────────────────────────────────────────────────┤",
  ];

  for (const lim of limitations) {
    lines.push(`│ [${lim.severity.toUpperCase()}] ${lim.displayName.padEnd(45)}│`);
    lines.push(`│   ${lim.limitationMessage.substring(0, 52).padEnd(52)}│`);
    lines.push(`│   Affected: ${lim.affectedWorkflows.slice(0, 2).join(", ").substring(0, 44).padEnd(44)}│`);
    lines.push(`│   Action: ${lim.suggestedAction.substring(0, 47).padEnd(47)}│`);
    lines.push(`├─────────────────────────────────────────────────────────────┤`);
  }

  lines.push("└─────────────────────────────────────────────────────────────┘");

  return lines.join("\n");
}
