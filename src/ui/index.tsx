import * as React from "react";
import { usePluginAction, usePluginData, type PluginWidgetProps } from "@paperclipai/plugin-sdk/ui";

type HealthData = {
  status: "ok" | "degraded" | "error";
  checkedAt: string;
};

type ReadinessPacketsData = {
  packets: Array<{
    id: string;
    initiativeName: string;
    status: string;
    readinessScore: number;
    decision: string;
  }>;
};

type IncidentActionsData = {
  actions: Array<{
    id: string;
    title: string;
    kind: string;
    status: string;
    priority: string;
  }>;
};

type IncidentSummaryData = {
  summary: {
    totalLearnings: number;
    totalActions: number;
    openActionsByPriority: Record<string, number>;
  };
};

export function DashboardWidget(_props: PluginWidgetProps) {
  const { data, loading, error } = usePluginData<HealthData>("health");
  const ping = usePluginAction("ping");

  if (loading) return <div>Loading plugin health...</div>;
  if (error) return <div>Plugin error: {error.message}</div>;

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <strong>Department Product Tech</strong>
      <div>Health: {data?.status ?? "unknown"}</div>
      <div>Checked: {data?.checkedAt ?? "never"}</div>
      <button onClick={() => void ping()}>Ping Worker</button>
    </div>
  );
}

export function ReadinessWidget(_props: PluginWidgetProps) {
  const { data, loading, error } = usePluginData<ReadinessPacketsData>("readiness.packets");
  const getActivePackets = usePluginAction("readiness.getActivePackets");

  if (loading) return <div>Loading readiness packets...</div>;
  if (error) return <div>Error loading readiness: {error.message}</div>;

  const packets = data?.packets ?? [];

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <strong>Launch Readiness</strong>
      <div>Active Packets: {packets.length}</div>
      {packets.length > 0 ? (
        <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {packets.slice(0, 5).map((packet) => (
            <div key={packet.id} style={{ border: "1px solid #ccc", padding: "0.5rem", marginBottom: "0.25rem", borderRadius: "4px" }}>
              <div style={{ fontWeight: "bold" }}>{packet.initiativeName}</div>
              <div>Score: {packet.readinessScore}/100</div>
              <div>Decision: {packet.decision}</div>
              <div>Status: {packet.status}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "0.875rem", color: "#666" }}>No active readiness packets</div>
      )}
      <button onClick={() => void getActivePackets({})} style={{ marginTop: "0.5rem" }}>
        Refresh Packets
      </button>
    </div>
  );
}

export function IncidentLearningWidget(_props: PluginWidgetProps) {
  const { data, loading, error } = usePluginData<IncidentActionsData & IncidentSummaryData>("incident.actions");
  const getOpenActions = usePluginAction("incident.getOpenActions");
  const getSummary = usePluginAction("incident.getSummary");

  if (loading) return <div>Loading incident learning...</div>;
  if (error) return <div>Error loading incident learning: {error.message}</div>;

  const actions = data?.actions ?? [];
  const summary = data?.summary;

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <strong>Incident Learning</strong>
      {summary ? (
        <div style={{ fontSize: "0.875rem" }}>
          <div>Total Learnings: {summary.totalLearnings}</div>
          <div>Total Actions: {summary.totalActions}</div>
          <div>Open Critical: {summary.openActionsByPriority?.critical ?? 0}</div>
          <div>Open High: {summary.openActionsByPriority?.high ?? 0}</div>
        </div>
      ) : (
        <div style={{ fontSize: "0.875rem", color: "#666" }}>No summary available</div>
      )}
      {actions.length > 0 ? (
        <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {actions.slice(0, 5).map((action) => (
            <div key={action.id} style={{ border: "1px solid #ccc", padding: "0.5rem", marginBottom: "0.25rem", borderRadius: "4px" }}>
              <div style={{ fontWeight: "bold" }}>{action.title}</div>
              <div>Kind: {action.kind}</div>
              <div>Priority: {action.priority}</div>
              <div>Status: {action.status}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "0.875rem", color: "#666" }}>No open actions</div>
      )}
      <button onClick={() => void getOpenActions({})} style={{ marginTop: "0.5rem" }}>
        Refresh Actions
      </button>
    </div>
  );
}
