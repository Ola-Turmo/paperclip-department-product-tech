# @uos/department-product-tech

@uos/department-product-tech packages research, launch readiness, platform enablement, and reliability work into a product/technology operating overlay. It should help teams move from idea to dependable launch with structured evidence and readiness gates.

Built as part of the UOS split workspace on top of [Paperclip](https://github.com/paperclipai/paperclip), which remains the upstream control-plane substrate.

## What This Repo Owns

- Research capture and synthesis relevant to product/tech decisions.
- Launch readiness workflows, checklists, evidence packs, and sign-off support.
- Platform enablement assets, playbooks, and readiness coaching.
- Reliability-oriented planning and review loops.
- Decision memory connecting experiments, launches, and outcomes.

## Runtime Form

- Split repo with package code as the source of truth and a Paperclip plugin scaffold available for worker, manifest, UI, and validation surfaces when the repo needs runtime or operator-facing behavior.

## Highest-Value Workflows

- Preparing a launch readiness packet with evidence and risk framing.
- Synthesizing research from user, technical, and operational sources.
- Turning incident learnings into roadmap, enablement, or reliability actions.
- Running enablement programs for new platform capabilities.
- Tracking readiness health across concurrent initiatives.

## Key Connections and Operating Surfaces

- GitHub, CI/CD, Linear, Jira, incident systems, Sentry, Grafana, Datadog, feature-flag systems, product analytics, and cloud/admin consoles needed to move from idea to launch safely.
- Figma, docs, specs, runbooks, Notion, Google Docs/Sheets, Slack, email, and calendars when readiness evidence or coordination spans human and automated work.
- Browser and API access to customer research, analytics, experimentation systems, app stores, and competitive/product intelligence surfaces when product or reliability questions cannot be answered from internal systems alone.
- Any adjacent system required to connect discovery, launch readiness, production learning, release evidence, and reliability action into one closed loop.

## KPI Targets

- Launch readiness packets are produced for 100% of tier-1 launches and major platform changes.
- Post-launch incident rate falls by 25% across initiatives using the readiness workflow.
- Research synthesis turnaround stays <= 3 business days for standard product and technical questions.
- The top 10 active initiatives maintain a live readiness score with evidence links.

## Implementation Backlog

### Now
- Define the canonical launch readiness packet, score, and supporting evidence requirements.
- Connect product and reliability learnings into one action-tracking loop.
- Turn recurring enablement needs into reusable assets instead of one-off rollout work.

### Next
- Improve initiative health visibility across teams and release trains.
- Add stronger research synthesis workflows for user, technical, and operational inputs.
- Instrument whether readiness work actually lowers launch chaos and post-launch issues.

### Later
- Support more autonomous launch preparation with policy-aware checkpoints and risk scoring.
- Integrate product-tech readiness more tightly with the cockpit and core release flows.

## Local Plugin Use

```bash
curl -X POST http://127.0.0.1:3100/api/plugins/install \
  -H "Content-Type: application/json" \
  -d '{"packageName":"<absolute-path-to-this-repo>","isLocalPath":true}'
```

## Validation

```bash
npm install
npm run check
npm run plugin:typecheck
npm run plugin:test
```
