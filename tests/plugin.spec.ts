import { describe, expect, it, beforeEach } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest.js";
import plugin from "../src/worker.js";

describe("plugin scaffold", () => {
  it("registers data, actions, and event handling", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities, "events.emit"] });
    await plugin.definition.setup(harness.ctx);

    await harness.emit("issue.created", { issueId: "iss_1" }, { entityId: "iss_1", entityType: "issue" });
    expect(harness.getState({ scopeKind: "issue", scopeId: "iss_1", stateKey: "seen" })).toBe(true);

    const data = await harness.getData<{ status: string; checkedAt: string }>("health");
    // Health can be "ok", "unknown", "degraded", or "error" depending on connector state
    expect(["ok", "unknown", "degraded", "error"]).toContain(data.status);

    const action = await harness.performAction<{ pong: boolean; at: string }>("ping");
    expect(action.pong).toBe(true);
  });
});

describe("launch readiness workflow (VAL-DEPT-PRODUCT-TECH-001)", () => {
  let harness: ReturnType<typeof createTestHarness>;

  beforeEach(async () => {
    harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities] });
    await plugin.definition.setup(harness.ctx);
  });

  it("creates a launch readiness packet", async () => {
    const result = await harness.performAction("readiness.createPacket", {
      initiativeId: "init-123",
      initiativeName: "New Feature Launch",
      ownerRoleKey: "product-management-lead",
    }) as { packet: { id: string; initiativeId: string; initiativeName: string; status: string; decision: string; readinessScore: number } };

    expect(result.packet).toBeDefined();
    expect(result.packet.id).toBeTruthy();
    expect(result.packet.initiativeId).toBe("init-123");
    expect(result.packet.initiativeName).toBe("New Feature Launch");
    expect(result.packet.status).toBe("draft");
    expect(result.packet.decision).toBe("deferred");
    expect(result.packet.readinessScore).toBe(0);
  });

  it("adds evidence to a readiness packet", async () => {
    const createResult = await harness.performAction("readiness.createPacket", {
      initiativeId: "init-456",
      initiativeName: "Platform Upgrade",
      ownerRoleKey: "technology-platform-lead",
    }) as { packet: { id: string } };

    const evidenceResult = await harness.performAction("readiness.addEvidence", {
      packetId: createResult.packet.id,
      evidence: {
        type: "technical",
        title: "Load test results",
        description: "System handles 10k concurrent users",
        source: "QA team",
        confidence: "high",
        tags: ["performance", "load-testing"],
      },
    }) as { evidence: { id: string; type: string } | null };

    expect(evidenceResult.evidence).toBeDefined();
    expect(evidenceResult.evidence?.id).toBeTruthy();
    expect(evidenceResult.evidence?.type).toBe("technical");
  });

  it("adds risks to a readiness packet", async () => {
    const createResult = await harness.performAction("readiness.createPacket", {
      initiativeId: "init-789",
      initiativeName: "Database Migration",
      ownerRoleKey: "technology-platform-lead",
    }) as { packet: { id: string } };

    const riskResult = await harness.performAction("readiness.addRisk", {
      packetId: createResult.packet.id,
      risk: {
        title: "Data migration timeout",
        description: "Large table migration may exceed maintenance window",
        severity: "high",
        likelihood: "possible",
        impact: "blocking",
        mitigationStatus: "pending",
      },
    }) as { risk: { id: string; severity: string } | null };

    expect(riskResult.risk).toBeDefined();
    expect(riskResult.risk?.id).toBeTruthy();
    expect(riskResult.risk?.severity).toBe("high");
  });

  it("generates a readiness packet report with go/no-go framing", async () => {
    const createResult = await harness.performAction("readiness.createPacket", {
      initiativeId: "init-report",
      initiativeName: "API v2 Launch",
      ownerRoleKey: "product-management-lead",
    }) as { packet: { id: string } };

    // Add evidence
    await harness.performAction("readiness.addEvidence", {
      packetId: createResult.packet.id,
      evidence: {
        type: "technical",
        title: "API tests pass",
        description: "All integration tests pass",
        source: "CI/CD",
        confidence: "high",
        tags: ["testing"],
      },
    });

    const reportResult = await harness.performAction("readiness.generateReport", {
      packetId: createResult.packet.id,
    }) as { report: { packet: object; summary: object; recommendation: string } | null };

    expect(reportResult.report).toBeDefined();
    expect(reportResult.report?.recommendation).toBeTruthy();
    // With evidence but no risks, should be conditional-go or go
    expect(["go", "conditional-go"]).toContain(reportResult.report?.recommendation.split(":")[0]);
  });

  it("submit with no-go decision when critical risks unresolved", async () => {
    const createResult = await harness.performAction("readiness.createPacket", {
      initiativeId: "init-nogo",
      initiativeName: "Risky Launch",
      ownerRoleKey: "product-management-lead",
    }) as { packet: { id: string } };

    // Add unresolved critical risk
    await harness.performAction("readiness.addRisk", {
      packetId: createResult.packet.id,
      risk: {
        title: "Security vulnerability",
        description: "Unfixed security issue in auth module",
        severity: "critical",
        likelihood: "likely",
        impact: "blocking",
        mitigationStatus: "pending",
      },
    });

    const submitResult = await harness.performAction("readiness.submitPacket", {
      packetId: createResult.packet.id,
      decision: "no-go",
      decisionRationale: "Critical security risk must be resolved before launch",
      decisionByRoleKey: "product-management-lead",
    }) as { packet: { status: string; decision: string; followUpItems: unknown[] } | null };

    expect(submitResult.packet?.status).toBe("rejected");
    expect(submitResult.packet?.decision).toBe("no-go");
    expect(submitResult.packet?.followUpItems.length).toBeGreaterThan(0);
  });
});

describe("incident learning workflow (VAL-DEPT-PRODUCT-TECH-002)", () => {
  let harness: ReturnType<typeof createTestHarness>;

  beforeEach(async () => {
    harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities] });
    await plugin.definition.setup(harness.ctx);
  });

  it("ingests incident learning and generates actions", async () => {
    const result = await harness.performAction("incident.ingestLearning", {
      incidentId: "inc-001",
      incidentTitle: "Database connection pool exhaustion",
      incidentSeverity: "high",
      incidentStatus: "resolved",
      occurredAt: "2026-04-01T10:00:00Z",
      resolvedAt: "2026-04-01T12:00:00Z",
      rootCause: "Connection pool size too small for peak load",
      lessonsLearned: [
        "Need auto-scaling for connection pools",
        "Monitoring should alert before exhaustion",
      ],
      whatWentWell: [
        "Quick detection and response",
      ],
      whatCouldImprove: [
        "Better capacity planning",
      ],
      affectedInitiatives: ["init-123"],
      affectedSystems: ["postgres-primary", "api-service"],
      userImpact: "500 errors for 2 hours",
      capturedByRoleKey: "technology-platform-lead",
    }) as { report: { id: string; incidentId: string; actions: unknown[]; totalActionsProposed: number } };

    expect(result.report).toBeDefined();
    expect(result.report.id).toBeTruthy();
    expect(result.report.incidentId).toBe("inc-001");
    expect(result.report.actions.length).toBeGreaterThan(0);
    expect(result.report.totalActionsProposed).toBeGreaterThan(0);
  });

  it("creates persistent roadmap, enablement, or reliability actions", async () => {
    const ingestResult = await harness.performAction("incident.ingestLearning", {
      incidentId: "inc-002",
      incidentTitle: "Authentication service outage",
      incidentSeverity: "critical",
      incidentStatus: "resolved",
      occurredAt: "2026-04-02T08:00:00Z",
      resolvedAt: "2026-04-02T09:30:00Z",
      rootCause: "Expired TLS certificate",
      lessonsLearned: ["Certificate rotation automation needed"],
      whatWentWell: ["Incident response was fast"],
      whatCouldImprove: ["Monitoring for cert expiry"],
      affectedInitiatives: ["auth-overhaul"],
      affectedSystems: ["auth-service"],
      capturedByRoleKey: "technology-platform-lead",
    }) as { report: { actions: Array<{ kind: string }> } };

    const report = ingestResult.report;

    // Verify actions were created
    expect(report.actions.length).toBeGreaterThan(0);

    // Check that we have actions of different kinds
    const actionKinds = new Set(report.actions.map((a) => a.kind));
    expect(actionKinds.has("reliability")).toBe(true);
    expect(actionKinds.has("enablement")).toBe(true);
  });

  it("links actions to initiatives", async () => {
    const ingestResult = await harness.performAction("incident.ingestLearning", {
      incidentId: "inc-003",
      incidentTitle: "Cache invalidation bug",
      incidentSeverity: "medium",
      incidentStatus: "resolved",
      occurredAt: "2026-04-03T14:00:00Z",
      rootCause: "Cache keys not invalidated on update",
      lessonsLearned: ["Need cache invalidation strategy"],
      whatWentWell: [],
      whatCouldImprove: ["Add cache invalidation tests"],
      affectedInitiatives: ["feature-cache-v2"],
      affectedSystems: ["cache-service"],
      capturedByRoleKey: "technology-platform-lead",
    }) as { report: { actions: Array<{ linkedInitiatives: string[] }> } };

    const action = ingestResult.report.actions[0];
    expect(action.linkedInitiatives).toContain("feature-cache-v2");
  });

  it("updates action status through lifecycle", async () => {
    const ingestResult = await harness.performAction("incident.ingestLearning", {
      incidentId: "inc-004",
      incidentTitle: "API rate limiting issue",
      incidentSeverity: "low",
      incidentStatus: "resolved",
      occurredAt: "2026-04-03T16:00:00Z",
      rootCause: "No rate limiting on public endpoints",
      lessonsLearned: ["Rate limiting should be default"],
      whatWentWell: [],
      whatCouldImprove: ["Add rate limiting middleware"],
      affectedInitiatives: ["api-gateway-v1"],
      affectedSystems: ["api-gateway"],
      capturedByRoleKey: "technology-platform-lead",
    }) as { report: { actions: Array<{ id: string; status: string; completedAt?: string }> } };

    const action = ingestResult.report.actions[0];

    // Approve the action
    const approveResult = await harness.performAction("incident.approveAction", {
      actionId: action.id,
      approverRoleKey: "product-management-lead",
    }) as { action: { status: string } | null };
    expect(approveResult.action?.status).toBe("approved");

    // Start the action
    const startResult = await harness.performAction("incident.updateActionStatus", {
      actionId: action.id,
      status: "in-progress",
    }) as { action: { status: string } | null };
    expect(startResult.action?.status).toBe("in-progress");

    // Complete the action
    const completeResult = await harness.performAction("incident.updateActionStatus", {
      actionId: action.id,
      status: "completed",
      notes: ["Implemented rate limiting on all public endpoints"],
    }) as { action: { status: string; completedAt?: string } | null };
    expect(completeResult.action?.status).toBe("completed");
    expect(completeResult.action?.completedAt).toBeTruthy();
  });

  it("generates incident learning summary", async () => {
    // Ingest two incidents
    await harness.performAction("incident.ingestLearning", {
      incidentId: "inc-summary-1",
      incidentTitle: "Incident 1",
      incidentSeverity: "high",
      incidentStatus: "resolved",
      occurredAt: "2026-04-01T10:00:00Z",
      rootCause: "Root cause 1",
      lessonsLearned: ["Lesson 1"],
      whatWentWell: [],
      whatCouldImprove: [],
      affectedInitiatives: ["init-1"],
      affectedSystems: ["sys-1"],
      capturedByRoleKey: "technology-platform-lead",
    });

    await harness.performAction("incident.ingestLearning", {
      incidentId: "inc-summary-2",
      incidentTitle: "Incident 2",
      incidentSeverity: "critical",
      incidentStatus: "resolved",
      occurredAt: "2026-04-02T10:00:00Z",
      rootCause: "Root cause 2",
      lessonsLearned: ["Lesson 2"],
      whatWentWell: [],
      whatCouldImprove: [],
      affectedInitiatives: ["init-2"],
      affectedSystems: ["sys-2"],
      capturedByRoleKey: "technology-platform-lead",
    });

    const summaryResult = await harness.performAction("incident.getSummary") as { summary: { totalLearnings: number; totalActions: number; averageActionsPerIncident: number } };

    expect(summaryResult.summary.totalLearnings).toBeGreaterThanOrEqual(2);
    expect(summaryResult.summary.totalActions).toBeGreaterThan(0);
    expect(summaryResult.summary.averageActionsPerIncident).toBeGreaterThan(0);
  });
});
