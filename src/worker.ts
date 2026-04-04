import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import { LaunchReadinessService } from "./launch-readiness-service.js";
import { IncidentLearningService } from "./incident-learning-service.js";
import {
  createInitialConnectorHealthState,
  updateConnectorHealthState,
  computeDepartmentHealthStatus,
  generateToolkitLimitations,
  formatAllLimitations,
  performRuntimeHealthCheck,
  type ConnectorHealthState,
} from "./connector-health.js";
import type {
  CreateReadinessPacketParams,
  SubmitReadinessPacketParams,
  IngestIncidentLearningParams,
  CreatePersistentActionParams,
  LinkActionToInitiativeParams,
  UpdateActionStatusParams,
  ReadinessEvidence,
  ReadinessRisk,
  FollowUpItem,
  ConnectorHealthSummary,
  SetConnectorHealthParams,
  GetConnectorHealthParams,
} from "./types.js";

// Initialize services
const launchReadinessService = new LaunchReadinessService();
const incidentLearningService = new IncidentLearningService();

// Connector health state (XAF-007)
let connectorHealthState: ConnectorHealthState[] = createInitialConnectorHealthState();

const plugin = definePlugin({
  async setup(ctx) {
    ctx.events.on("issue.created", async (event) => {
      const issueId = event.entityId ?? "unknown";
      await ctx.state.set({ scopeKind: "issue", scopeId: issueId, stateKey: "seen" }, true);
      ctx.logger.info("Observed issue.created", { issueId });
    });

    // Health check (now includes connector health status - XAF-007)
    ctx.data.register("health", async () => {
      const limitations = generateToolkitLimitations(connectorHealthState);
      const overallStatus = computeDepartmentHealthStatus(connectorHealthState);
      return {
        status: overallStatus,
        checkedAt: new Date().toISOString(),
        hasLimitations: limitations.length > 0,
        limitations: limitations,
      };
    });

    // Connector health data (XAF-007)
    ctx.data.register("connectorHealth", async (params) => {
      const p = params as unknown as GetConnectorHealthParams;
      if (p?.toolkitId) {
        const state = connectorHealthState.find((s) => s.toolkitId === p.toolkitId);
        if (!state) {
          return { error: `Connector '${p.toolkitId}' not found` };
        }
        const limitations = state.status !== "ok"
          ? generateToolkitLimitations([state])
          : [];
        return { connector: state, limitations };
      }
      const limitations = generateToolkitLimitations(connectorHealthState);
      const overallStatus = computeDepartmentHealthStatus(connectorHealthState);
      const summary: ConnectorHealthSummary = {
        overallStatus,
        checkedAt: new Date().toISOString(),
        connectors: connectorHealthState,
        limitations,
        hasLimitations: limitations.length > 0,
      };
      return summary;
    });

    // Ping action for testing
    ctx.actions.register("ping", async () => {
      ctx.logger.info("Ping action invoked");
      return { pong: true, at: new Date().toISOString() };
    });

    // ============================================
    // Connector Health Actions (XAF-007)
    // ============================================

    /**
     * Set connector health status (for simulation/testing)
     * XAF-007: Simulate connector degradation to verify limitation messaging
     */
    ctx.actions.register("connector.setHealth", async (params) => {
      const p = params as unknown as SetConnectorHealthParams;
      ctx.logger.info("Setting connector health", { toolkitId: p.toolkitId, status: p.status });
      connectorHealthState = updateConnectorHealthState(
        connectorHealthState,
        p.toolkitId,
        p.status,
        p.error
      );
      const limitations = generateToolkitLimitations(connectorHealthState);
      const overallStatus = computeDepartmentHealthStatus(connectorHealthState);
      return {
        success: true,
        toolkitId: p.toolkitId,
        status: p.status,
        overallStatus,
        limitations,
        formattedLimitations: limitations.length > 0 ? formatAllLimitations(limitations) : undefined,
      };
    });

    /**
     * Get connector health summary
     * XAF-007
     */
    ctx.actions.register("connector.getHealth", async () => {
      const limitations = generateToolkitLimitations(connectorHealthState);
      const overallStatus = computeDepartmentHealthStatus(connectorHealthState);
      return {
        overallStatus,
        checkedAt: new Date().toISOString(),
        connectors: connectorHealthState,
        limitations,
        hasLimitations: limitations.length > 0,
      };
    });

    /**
     * Simulate connector degradation for testing
     * XAF-007
     */
    ctx.actions.register("connector.simulateDegradation", async (params) => {
      const p = params as unknown as { toolkitId: string; severity?: "degraded" | "error" };
      const status = p.severity ?? "degraded";
      ctx.logger.info("Simulating connector degradation", { toolkitId: p.toolkitId, status });
      connectorHealthState = updateConnectorHealthState(
        connectorHealthState,
        p.toolkitId,
        status,
        status === "error"
          ? "Simulated: Connector authentication failed"
          : "Simulated: Connector responding slowly"
      );
      const limitations = generateToolkitLimitations(connectorHealthState);
      const overallStatus = computeDepartmentHealthStatus(connectorHealthState);
      return {
        success: true,
        toolkitId: p.toolkitId,
        status,
        overallStatus,
        limitations,
        formattedLimitations: limitations.length > 0 ? formatAllLimitations(limitations) : undefined,
      };
    });

    /**
     * Restore connector to healthy state
     * XAF-007
     */
    ctx.actions.register("connector.restore", async (params) => {
      const p = params as unknown as { toolkitId: string };
      ctx.logger.info("Restoring connector health", { toolkitId: p.toolkitId });
      connectorHealthState = updateConnectorHealthState(
        connectorHealthState,
        p.toolkitId,
        "ok"
      );
      const limitations = generateToolkitLimitations(connectorHealthState);
      const overallStatus = computeDepartmentHealthStatus(connectorHealthState);
      return {
        success: true,
        toolkitId: p.toolkitId,
        status: "ok",
        overallStatus,
        limitations,
        hasLimitations: limitations.length > 0,
      };
    });

    /**
     * Perform actual runtime health check for all connectors.
     * 
     * This implements XAF-007: Department workflows degrade explicitly when
     * dependent connectors or tools are impaired, rather than blindly reporting ok.
     */
    ctx.actions.register("connector.checkHealth", async () => {
      ctx.logger.info("Performing runtime connector health check", { 
        connectorCount: connectorHealthState.length 
      });
      
      const checkResult = await performRuntimeHealthCheck(connectorHealthState);
      connectorHealthState = checkResult.updatedStates;
      
      ctx.logger.info("Connector health check completed", {
        overallStatus: checkResult.overallStatus,
        checkedConnectors: checkResult.checkResults.filter(r => r.wasChecked).length,
        hasImpaired: checkResult.checkResults.some(r => r.status !== "ok"),
      });
      
      const limitations = generateToolkitLimitations(connectorHealthState);
      
      return {
        success: true,
        overallStatus: checkResult.overallStatus,
        checkedAt: new Date().toISOString(),
        connectors: connectorHealthState,
        checkResults: checkResult.checkResults,
        limitations,
        hasLimitations: limitations.length > 0,
        formattedLimitations: limitations.length > 0 ? formatAllLimitations(limitations) : undefined,
      };
    });

    // ============================================
    // Launch Readiness Actions (VAL-DEPT-PRODUCT-TECH-001)
    // ============================================

    /**
     * Create a new launch readiness packet
     * VAL-DEPT-PRODUCT-TECH-001
     */
    ctx.actions.register("readiness.createPacket", async (params) => {
      const p = params as unknown as CreateReadinessPacketParams;
      ctx.logger.info("Creating launch readiness packet", { initiativeId: p.initiativeId });
      const packet = launchReadinessService.createPacket(p);
      return { packet };
    });

    /**
     * Get a readiness packet by ID
     * VAL-DEPT-PRODUCT-TECH-001
     */
    ctx.actions.register("readiness.getPacket", async (params) => {
      const p = params as unknown as { packetId: string };
      const packet = launchReadinessService.getPacket(p.packetId);
      return { packet: packet ?? null };
    });

    /**
     * Get all active readiness packets
     * VAL-DEPT-PRODUCT-TECH-001
     */
    ctx.actions.register("readiness.getActivePackets", async () => {
      const packets = launchReadinessService.getActivePackets();
      return { packets };
    });

    /**
     * Add evidence to a readiness packet
     * VAL-DEPT-PRODUCT-TECH-001
     */
    ctx.actions.register("readiness.addEvidence", async (params) => {
      const p = params as unknown as { packetId: string; evidence: Omit<ReadinessEvidence, "id"> };
      const evidence = launchReadinessService.addEvidence(p.packetId, {
        ...p.evidence,
        collectedAt: new Date().toISOString(),
      } as ReadinessEvidence);
      return { evidence: evidence ?? null };
    });

    /**
     * Add a risk to a readiness packet
     * VAL-DEPT-PRODUCT-TECH-001
     */
    ctx.actions.register("readiness.addRisk", async (params) => {
      const p = params as unknown as { packetId: string; risk: Omit<ReadinessRisk, "id"> };
      const risk = launchReadinessService.addRisk(p.packetId, p.risk as ReadinessRisk);
      return { risk: risk ?? null };
    });

    /**
     * Add a follow-up item to a readiness packet
     * VAL-DEPT-PRODUCT-TECH-001
     */
    ctx.actions.register("readiness.addFollowUp", async (params) => {
      const p = params as unknown as { packetId: string; item: Omit<FollowUpItem, "id"> };
      const item = launchReadinessService.addFollowUpItem(p.packetId, p.item as FollowUpItem);
      return { item: item ?? null };
    });

    /**
     * Submit a readiness packet with decision
     * VAL-DEPT-PRODUCT-TECH-001
     */
    ctx.actions.register("readiness.submitPacket", async (params) => {
      const p = params as unknown as SubmitReadinessPacketParams;
      ctx.logger.info("Submitting readiness packet", { packetId: p.packetId, decision: p.decision });
      const packet = launchReadinessService.submitPacket(p);
      return { packet: packet ?? null };
    });

    /**
     * Generate a readiness packet report
     * VAL-DEPT-PRODUCT-TECH-001
     */
    ctx.actions.register("readiness.generateReport", async (params) => {
      const p = params as unknown as { packetId: string };
      const report = launchReadinessService.generatePacketReport(p.packetId);
      return { report: report ?? null };
    });

    // ============================================
    // Incident Learning Actions (VAL-DEPT-PRODUCT-TECH-002)
    // ============================================

    /**
     * Ingest an incident learning and generate suggested actions
     * VAL-DEPT-PRODUCT-TECH-002
     */
    ctx.actions.register("incident.ingestLearning", async (params) => {
      const p = params as unknown as IngestIncidentLearningParams;
      ctx.logger.info("Ingesting incident learning", { incidentId: p.incidentId });
      const report = incidentLearningService.ingestLearning(p);
      return { report };
    });

    /**
     * Get an incident learning report
     * VAL-DEPT-PRODUCT-TECH-002
     */
    ctx.actions.register("incident.getReport", async (params) => {
      const p = params as unknown as { reportId: string };
      const report = incidentLearningService.getReport(p.reportId);
      return { report: report ?? null };
    });

    /**
     * Get reports by incident ID
     * VAL-DEPT-PRODUCT-TECH-002
     */
    ctx.actions.register("incident.getReportsByIncident", async (params) => {
      const p = params as unknown as { incidentId: string };
      const reports = incidentLearningService.getReportsByIncident(p.incidentId);
      return { reports };
    });

    /**
     * Create a persistent action from an incident learning
     * VAL-DEPT-PRODUCT-TECH-002
     */
    ctx.actions.register("incident.createAction", async (params) => {
      const p = params as unknown as CreatePersistentActionParams;
      const action = incidentLearningService.createAction(p);
      return { action: action ?? null };
    });

    /**
     * Get an action by ID
     * VAL-DEPT-PRODUCT-TECH-002
     */
    ctx.actions.register("incident.getAction", async (params) => {
      const p = params as unknown as { actionId: string };
      const action = incidentLearningService.getAction(p.actionId);
      return { action: action ?? null };
    });

    /**
     * Get all open actions
     * VAL-DEPT-PRODUCT-TECH-002
     */
    ctx.actions.register("incident.getOpenActions", async () => {
      const actions = incidentLearningService.getOpenActions();
      return { actions };
    });

    /**
     * Link an action to an initiative
     * VAL-DEPT-PRODUCT-TECH-002
     */
    ctx.actions.register("incident.linkActionToInitiative", async (params) => {
      const p = params as unknown as LinkActionToInitiativeParams;
      const action = incidentLearningService.linkActionToInitiative(p);
      return { action: action ?? null };
    });

    /**
     * Update action status
     * VAL-DEPT-PRODUCT-TECH-002
     */
    ctx.actions.register("incident.updateActionStatus", async (params) => {
      const p = params as unknown as UpdateActionStatusParams;
      const action = incidentLearningService.updateActionStatus(p);
      return { action: action ?? null };
    });

    /**
     * Approve an action
     * VAL-DEPT-PRODUCT-TECH-002
     */
    ctx.actions.register("incident.approveAction", async (params) => {
      const p = params as unknown as { actionId: string; approverRoleKey: string };
      const action = incidentLearningService.approveAction(p.actionId, p.approverRoleKey);
      return { action: action ?? null };
    });

    /**
     * Get incident learning summary
     * VAL-DEPT-PRODUCT-TECH-002
     */
    ctx.actions.register("incident.getSummary", async () => {
      const summary = incidentLearningService.generateSummary();
      return { summary };
    });
  },

  async onHealth() {
    return { status: "ok", message: "Plugin worker is running" };
  }
});

export default plugin;
// @ts-ignore - import.meta is only available in ES modules
runWorker(plugin, import.meta.url);
