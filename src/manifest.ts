import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "uos.department-product-tech",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Department Product Tech",
  description: "Department overlay for product and technology roles, jobs, skills, and connector policy. Provides launch readiness workflows and incident learning conversion.",
  author: "turmo.dev",
  categories: ["automation", "ui"],
  capabilities: [
    "events.subscribe",
    "plugin.state.read",
    "plugin.state.write",
    "ui.dashboardWidget.register"
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui"
  },
  ui: {
    slots: [
      {
        type: "dashboardWidget",
        id: "health-widget",
        displayName: "Department Product Tech Health",
        exportName: "DashboardWidget"
      },
      {
        type: "dashboardWidget",
        id: "readiness-widget",
        displayName: "Launch Readiness",
        exportName: "ReadinessWidget"
      },
      {
        type: "dashboardWidget",
        id: "incident-learning-widget",
        displayName: "Incident Learning",
        exportName: "IncidentLearningWidget"
      }
    ]
  }
};

export default manifest;
