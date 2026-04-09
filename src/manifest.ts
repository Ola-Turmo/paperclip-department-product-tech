import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "uos.department-product-tech",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Department Product Tech",
  description: "Department overlay for product and technology roles, jobs, skills, and connector policy.",
  author: "turmo.dev",
  categories: ["automation"],
  capabilities: [
    "events.subscribe",
    "plugin.state.read",
    "plugin.state.write"
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
      }
    ]
  }
};

export default manifest;
