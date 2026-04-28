/**
 * Connectors Configuration
 * 
 * This module exports the connectors configuration as a TypeScript object
 * to avoid JSON import issues across different module resolution modes.
 * 
 * Extended for UOS company operations: covers generic dev toolkits plus
 * Paperclip-native connectors (email, community, platform API) that are
 * required for revenue, customer, and outreach workflows.
 */

export const connectorsConfig = {
  // Toolkits required for core product-tech department operations
  requiredToolkits: [
    "github",
    "googledrive",
    "googledocs",
    "slack"
  ] as const,

  // Extended connector registry: includes Paperclip-native connectors
  // These are required for company-level revenue and outreach workflows
  extendedConnectors: [
    // Email — transactional and outreach email delivery
    {
      toolkitId: "resend",
      displayName: "Resend (Email)",
      category: "communication",
      description: "Transactional and outreach email via Resend API",
      affectedWorkflows: [
        "Customer onboarding notifications",
        "Partner outreach emails",
        "Transactional alerts",
        "Email marketing"
      ],
      healthCheckEndpoint: "GET /v1/domains",
      severityWhenDown: "critical" as const,
    },
    // Community/messaging — Telegram for community engagement
    {
      toolkitId: "telegram",
      displayName: "Telegram",
      category: "community",
      description: "Community outreach and engagement via Telegram bot",
      affectedWorkflows: [
        "Community outreach",
        "Customer support via chat",
        "Announcements and broadcasts"
      ],
      healthCheckEndpoint: "GET /getMe",
      severityWhenDown: "high" as const,
    },
    // Paperclip platform API — company/issue/agent management
    {
      toolkitId: "paperclip",
      displayName: "Paperclip API",
      category: "platform",
      description: "Paperclip company control plane — issues, agents, memory, webhooks",
      affectedWorkflows: [
        "Company issue management",
        "Agent coordination and handoffs",
        "Operational context and memory",
        "Webhook event processing",
        "Revenue and outreach workflows"
      ],
      healthCheckEndpoint: "GET /api/health",
      severityWhenDown: "critical" as const,
    },
    // Cloudflare — DNS, email routing, Workers for inbox
    {
      toolkitId: "cloudflare",
      displayName: "Cloudflare",
      category: "infrastructure",
      description: "DNS management, email routing, and agentic inbox Worker",
      affectedWorkflows: [
        "Domain DNS verification (required for Resend email)",
        "Email routing configuration",
        "Agentic inbox (portfolio-agentic-inbox Worker)"
      ],
      healthCheckEndpoint: "GET /cdn-cgi/trace",
      severityWhenDown: "critical" as const,
    },
    // GitHub — already in requiredToolkits but explicitly listed for visibility
    {
      toolkitId: "github",
      displayName: "GitHub",
      category: "development",
      description: "Code hosting, CI/CD, and repository management",
      affectedWorkflows: [
        "Code reviews and releases",
        "CI/CD pipeline execution",
        "GitHub Actions workflows"
      ],
      healthCheckEndpoint: "GET /repos",
      severityWhenDown: "high" as const,
    }
  ] as const,

  // Role-to-toolkit mapping for department roles
  roleToolkits: [
    {
      roleKey: "technology",
      toolkits: ["github", "slack"]
    },
    {
      roleKey: "product-research-lead",
      toolkits: ["googledrive", "googledocs"]
    },
    {
      roleKey: "technology-platform-lead",
      toolkits: ["github", "slack"]
    },
    {
      roleKey: "technology-engineering-lead",
      toolkits: ["github"]
    },
    {
      // Growth & Revenue — needs email (Resend) and community (Telegram)
      // to execute revenue and outreach workflows
      roleKey: "growth-revenue",
      toolkits: ["resend", "telegram", "paperclip"]
    },
    {
      // Product & Tech Manager — needs full platform access
      // to manage repos, issues, agents, and company operations
      roleKey: "product-tech",
      toolkits: ["github", "paperclip", "resend"]
    },
    {
      // Operations — needs Cloudflare and Paperclip for infrastructure
      // and operational context management
      roleKey: "operations",
      toolkits: ["cloudflare", "paperclip"]
    }
  ] as const
} as const;

export type ConnectorsConfig = typeof connectorsConfig;

/**
 * Extended connector descriptor for Paperclip-native connectors
 */
export interface ExtendedConnector {
  toolkitId: string;
  displayName: string;
  category: "communication" | "community" | "platform" | "infrastructure" | "development";
  description: string;
  affectedWorkflows: readonly string[];
  healthCheckEndpoint: string;
  severityWhenDown: "critical" | "high" | "medium" | "low";
}
