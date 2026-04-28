import { describe, expect, it } from "vitest";
import {
  connectorsConfig,
  getExtendedConnectors,
  getExtendedConnector,
  getAllToolkitIds,
  createInitialConnectorHealthState,
  generateToolkitLimitations,
  computeDepartmentHealthStatus,
  formatAllLimitations,
  getToolkitDisplayName,
} from "../src/connector-health";

describe("Extended connector registry", () => {
  it("includes Paperclip-native connectors (resend, telegram, paperclip, cloudflare)", () => {
    const extended = getExtendedConnectors();
    const ids = extended.map((c) => c.toolkitId);

    expect(ids).toContain("resend");
    expect(ids).toContain("telegram");
    expect(ids).toContain("paperclip");
    expect(ids).toContain("cloudflare");
  });

  it("marks email (resend) as critical severity when down", () => {
    const resend = getExtendedConnector("resend");
    expect(resend?.severityWhenDown).toBe("critical");
    expect(resend?.category).toBe("communication");
    expect(resend?.affectedWorkflows).toContain("Partner outreach emails");
  });

  it("marks paperclip API as critical severity when down", () => {
    const paperclip = getExtendedConnector("paperclip");
    expect(paperclip?.severityWhenDown).toBe("critical");
    expect(paperclip?.category).toBe("platform");
    expect(paperclip?.affectedWorkflows).toContain("Revenue and outreach workflows");
  });

  it("marks telegram as high severity when down", () => {
    const telegram = getExtendedConnector("telegram");
    expect(telegram?.severityWhenDown).toBe("high");
    expect(telegram?.category).toBe("community");
  });

  it("marks cloudflare as critical — DNS/email routing required for Resend", () => {
    const cloudflare = getExtendedConnector("cloudflare");
    expect(cloudflare?.severityWhenDown).toBe("critical");
    expect(cloudflare?.category).toBe("infrastructure");
    expect(cloudflare?.affectedWorkflows).toContain("Domain DNS verification (required for Resend email)");
  });

  it("returns undefined for unknown toolkitId", () => {
    expect(getExtendedConnector("unknown-connector")).toBeUndefined();
  });

  it("getAllToolkitIds merges required + extended without duplicates", () => {
    const all = getAllToolkitIds();
    // Should have all required (github, googledrive, googledocs, slack) plus extended
    expect(all).toContain("github");
    expect(all).toContain("resend");
    expect(all).toContain("telegram");
    expect(all).toContain("paperclip");
    expect(all).toContain("cloudflare");
    // github appears only once (both in required and extended)
    const githubCount = all.filter((id) => id === "github").length;
    expect(githubCount).toBe(1);
  });

  it("extendedConnectors in connectorsConfig matches getExtendedConnectors", () => {
    const fromConfig = connectorsConfig.extendedConnectors;
    const fromFn = getExtendedConnectors();
    expect(fromFn.length).toBe(fromConfig.length);
    expect(fromFn.map((c) => c.toolkitId)).toEqual(
      fromConfig.map((c) => c.toolkitId)
    );
  });
});

describe("createInitialConnectorHealthState with extended connectors", () => {
  it("creates only required toolkits by default", () => {
    const state = createInitialConnectorHealthState();
    const ids = state.map((s) => s.toolkitId);
    expect(ids).not.toContain("resend");
    expect(ids).not.toContain("telegram");
    expect(ids).not.toContain("paperclip");
    expect(ids).toContain("github");
  });

  it("creates all connectors including extended when includeExtended=true", () => {
    const state = createInitialConnectorHealthState(true);
    const ids = state.map((s) => s.toolkitId);

    expect(ids).toContain("resend");
    expect(ids).toContain("telegram");
    expect(ids).toContain("paperclip");
    expect(ids).toContain("cloudflare");
    expect(ids).toContain("github");

    // Category is set for extended connectors
    const resendState = state.find((s) => s.toolkitId === "resend");
    expect(resendState?.category).toBe("communication");
  });
});

describe("generateToolkitLimitations with extended connectors", () => {
  it("uses extended connector severity when error", () => {
    const state = [
      {
        toolkitId: "resend",
        status: "error" as const,
        lastChecked: new Date().toISOString(),
        limitationMessage: undefined,
      },
    ];

    const limitations = generateToolkitLimitations(state);
    expect(limitations).toHaveLength(1);
    expect(limitations[0].severity).toBe("critical"); // resend is critical
    expect(limitations[0].affectedWorkflows).toContain("Partner outreach emails");
  });

  it("uses extended connector description as fallback limitation message", () => {
    const state = [
      {
        toolkitId: "telegram",
        status: "error" as const,
        lastChecked: new Date().toISOString(),
        limitationMessage: undefined,
      },
    ];

    const limitations = generateToolkitLimitations(state);
    expect(limitations).toHaveLength(1);
    // Should use extended connector description when no explicit limitation message
    expect(limitations[0].affectedWorkflows).toContain("Community outreach");
    expect(limitations[0].category).toBe("community");
  });

  it("includes category in generated limitation", () => {
    const state = [
      {
        toolkitId: "cloudflare",
        status: "error" as const,
        lastChecked: new Date().toISOString(),
        limitationMessage: undefined,
      },
    ];

    const limitations = generateToolkitLimitations(state);
    expect(limitations[0].category).toBe("infrastructure");
    expect(limitations[0].severity).toBe("critical"); // cloudflare is critical
  });

  it("includes paperclip API criticality in limitation", () => {
    const state = [
      {
        toolkitId: "paperclip",
        status: "error" as const,
        lastChecked: new Date().toISOString(),
        limitationMessage: undefined,
      },
    ];

    const limitations = generateToolkitLimitations(state);
    expect(limitations).toHaveLength(1);
    expect(limitations[0].severity).toBe("critical");
    expect(limitations[0].affectedWorkflows).toContain("Revenue and outreach workflows");
    expect(limitations[0].category).toBe("platform");
  });
});

describe("computeDepartmentHealthStatus with extended connectors", () => {
  it("returns unknown when all extended connectors are unknown", () => {
    const state = createInitialConnectorHealthState(true);
    const status = computeDepartmentHealthStatus(state);
    expect(status).toBe("unknown");
  });

  it("returns critical when any critical extended connector has error", () => {
    const state = [
      ...createInitialConnectorHealthState(true),
      { toolkitId: "resend", status: "error" as const, lastChecked: new Date().toISOString() },
    ];
    const status = computeDepartmentHealthStatus(state);
    expect(status).toBe("error");
  });
});

describe("getToolkitDisplayName for extended connectors", () => {
  it("returns display name for resend", () => {
    expect(getToolkitDisplayName("resend")).toBe("Resend (Email)");
  });

  it("returns display name for telegram", () => {
    expect(getToolkitDisplayName("telegram")).toBe("Telegram");
  });

  it("returns display name for paperclip", () => {
    expect(getToolkitDisplayName("paperclip")).toBe("Paperclip API");
  });

  it("returns display name for cloudflare", () => {
    expect(getToolkitDisplayName("cloudflare")).toBe("Cloudflare");
  });
});

describe("formatAllLimitations for extended connectors", () => {
  it("formats Resend limitation with CRITICAL severity label", () => {
    const state = [
      {
        toolkitId: "resend",
        status: "error" as const,
        lastChecked: new Date().toISOString(),
        limitationMessage: undefined,
      },
    ];
    const limitations = generateToolkitLimitations(state);
    const formatted = formatAllLimitations(limitations);
    expect(formatted).toContain("[CRITICAL]");
    expect(formatted).toContain("Resend");
  });
});

describe("roleToolkits includes growth-revenue role", () => {
  it("growth-revenue role has resend, telegram, paperclip toolkits", () => {
    const roleToolkits = connectorsConfig.roleToolkits;
    const growthRole = roleToolkits.find((r) => r.roleKey === "growth-revenue");
    expect(growthRole?.toolkits).toContain("resend");
    expect(growthRole?.toolkits).toContain("telegram");
    expect(growthRole?.toolkits).toContain("paperclip");
  });

  it("product-tech role has paperclip, resend, github", () => {
    const roleToolkits = connectorsConfig.roleToolkits;
    const ptRole = roleToolkits.find((r) => r.roleKey === "product-tech");
    expect(ptRole?.toolkits).toContain("github");
    expect(ptRole?.toolkits).toContain("paperclip");
    expect(ptRole?.toolkits).toContain("resend");
  });

  it("operations role has cloudflare and paperclip", () => {
    const roleToolkits = connectorsConfig.roleToolkits;
    const opsRole = roleToolkits.find((r) => r.roleKey === "operations");
    expect(opsRole?.toolkits).toContain("cloudflare");
    expect(opsRole?.toolkits).toContain("paperclip");
  });
});
