---
repo: "uos-department-product-tech"
display_name: "@uos/department-product-tech"
package_name: "@uos/department-product-tech"
lane: "department overlay"
artifact_class: "TypeScript package / business-domain overlay"
maturity: "domain overlay on shared UOS platform"
generated_on: "2026-04-03"
assumptions: "Grounded in the current split-repo contents, package metadata, README/PRD alignment pass, and the Paperclip plugin scaffold presence where applicable; deeper module-level inspection should refine implementation detail as the code evolves."
autonomy_mode: "maximum-capability autonomous work with deep research and explicit learning loops"
---

# PRD: @uos/department-product-tech

## 1. Product Intent

**Package / repo:** `@uos/department-product-tech`  
**Lane:** department overlay  
**Artifact class:** TypeScript package / business-domain overlay  
**Current maturity:** domain overlay on shared UOS platform  
**Source-of-truth assumption:** Department-specific operating overlay built on UOS and Paperclip primitives.
**Runtime form:** Split repo with package code as the source of truth and a Paperclip plugin scaffold available for worker, manifest, UI, and validation surfaces when the repo needs runtime or operator-facing behavior.

@uos/department-product-tech packages research, launch readiness, platform enablement, and reliability work into a product/technology operating overlay. It should help teams move from idea to dependable launch with structured evidence and readiness gates.

## 2. Problem Statement

Product and technology work often fragments across discovery notes, launch checklists, reliability work, and ad hoc coordination. This overlay should turn that sprawl into repeatable, automatable workflows with real learning loops.

## 3. Target Users and Jobs to Be Done

- Product and engineering leaders coordinating launches and reliability work.
- Teams running readiness reviews, experiments, and platform enablement.
- Operators needing a shared view of technical/product readiness.
- Autonomous agents executing research and release-prep tasks.

## 4. Outcome Thesis

**North star:** The overlay improves launch quality and reduces chaos: better readiness decisions, faster research synthesis, fewer preventable incidents, and tighter feedback from production reality back into product planning.

### 12-month KPI targets
- Launch readiness packets are produced for 100% of tier-1 launches and major platform changes.
- Post-launch incident rate falls by 25% across initiatives using the readiness workflow.
- Research synthesis turnaround stays <= 3 business days for standard product and technical questions.
- The top 10 active initiatives maintain a live readiness score with evidence links.
- At least 80% of major incidents result in a tracked roadmap, enablement, or reliability follow-up item.

### Acceptance thresholds for the next implementation wave
- A readiness packet template exists with launch evidence, risks, mitigations, and explicit go/no-go framing.
- Incident learnings are consistently converted into actions rather than left as postmortem dead ends.
- Product, technical, and operational research inputs can be synthesized into one reviewable artifact.
- Readiness health is visible across concurrent initiatives instead of being reconstructed ad hoc.

## 5. In Scope

- Research capture and synthesis relevant to product/tech decisions.
- Launch readiness workflows, checklists, evidence packs, and sign-off support.
- Platform enablement assets, playbooks, and readiness coaching.
- Reliability-oriented planning and review loops.
- Decision memory connecting experiments, launches, and outcomes.

## 6. Explicit Non-Goals

- Replacing core release engineering or runtime lifecycle ownership.
- Becoming a generic documentation repository for all technical content.
- Owning every reliability incident workflow across unrelated domains.

## 7. Maximum Tool and Connection Surface

- This repo should assume it may use any connection, API, browser flow, CLI, document surface, dataset, or storage system materially relevant to completing the job, as long as the access pattern is lawful, auditable, and proportionate to risk.
- Do not artificially limit execution to the tools already named in the repo if adjacent systems are clearly required to close the loop.
- Prefer first-party APIs and direct integrations when available, but use browser automation, provider CLIs, structured import/export, and human-review queues when they are the most reliable path to completion.
- Treat communication systems, docs, spreadsheets, issue trackers, code hosts, cloud consoles, dashboards, databases, and admin panels as valid operating surfaces whenever the repo's job depends on them.
- Escalate only when the action is irreversible, privacy-sensitive, financially material, or likely to create external side effects without adequate review.

### Priority surfaces for product and technology work
- GitHub, CI/CD, Linear, Jira, incident systems, Sentry, Grafana, Datadog, feature-flag systems, product analytics, and cloud/admin consoles needed to move from idea to launch safely.
- Figma, docs, specs, runbooks, Notion, Google Docs/Sheets, Slack, email, and calendars when readiness evidence or coordination spans human and automated work.
- Browser and API access to customer research, analytics, experimentation systems, app stores, and competitive/product intelligence surfaces when product or reliability questions cannot be answered from internal systems alone.
- Any adjacent system required to connect discovery, launch readiness, production learning, release evidence, and reliability action into one closed loop.

### Selection rules
- Start by identifying the systems that would let the repo complete the real job end to end, not just produce an intermediate artifact.
- Use the narrowest safe action for high-risk domains, but not the narrowest tool surface by default.
- When one system lacks the evidence or authority needed to finish the task, step sideways into the adjacent system that does have it.
- Prefer a complete, reviewable workflow over a locally elegant but operationally incomplete one.

## 8. Autonomous Operating Model

This PRD assumes **maximum-capability autonomous work**. The repo should not merely accept tasks; it should research deeply, compare options, reduce uncertainty, ship safely, and learn from every outcome. Autonomy here means higher standards for evidence, reversibility, observability, and knowledge capture—not just faster execution.

### Required research before every material task
1. Read the repo README, this PRD, touched source modules, existing tests, and recent change history before proposing a solution.
1. Trace impact across adjacent UOS repos and shared contracts before changing interfaces, schemas, or runtime behavior.
1. Prefer evidence over assumption: inspect current code paths, add repro cases, and study real failure modes before implementing a fix.
1. Use external official documentation and standards for any upstream dependency, provider API, framework, CLI, or format touched by the task.
1. For non-trivial work, compare at least two approaches and explicitly choose based on reversibility, operational safety, and long-term maintainability.

### Repo-specific decision rules
- Readiness evidence beats optimism.
- Reliability work should be tied to concrete launch or operational outcomes.
- Research that does not inform a decision or system improvement is incomplete.
- The overlay should reduce coordination load, not add ceremonial status work.

### Mandatory escalation triggers
- High-risk launch decisions with unresolved reliability or compliance concerns.
- Conflicts between product urgency and operational readiness.
- Any automation that could misrepresent readiness or suppress dissenting evidence.

## 9. Continuous Learning Requirements

### Required learning loop after every task
- Every completed task must leave behind at least one durable improvement: a test, benchmark, runbook, migration note, ADR, or automation asset.
- Capture the problem, evidence, decision, outcome, and follow-up questions in repo-local learning memory so the next task starts smarter.
- Promote repeated fixes into reusable abstractions, templates, linters, validators, or code generation rather than solving the same class of issue twice.
- Track confidence and unknowns; unresolved ambiguity becomes a research backlog item, not a silent assumption.
- Prefer instrumented feedback loops: telemetry, evaluation harnesses, fixtures, or replayable traces should be added whenever feasible.

### Repo-specific research agenda
- What readiness signals most accurately predict smooth launches?
- Which recurring incident types should feed pre-launch guardrails?
- How can research synthesis be made faster without losing rigor?
- What enablement assets are repeatedly rebuilt and should become standardized?
- Where does platform complexity still block product teams from moving autonomously?

### Repo-specific memory objects that must stay current
- Launch readiness pattern library.
- Reliability risk catalog.
- Research synthesis archive.
- Enablement asset index.
- Post-launch feedback ledger.

## 10. Core Workflows the Repo Must Master

1. Preparing a launch readiness packet with evidence and risk framing.
1. Synthesizing research from user, technical, and operational sources.
1. Turning incident learnings into roadmap, enablement, or reliability actions.
1. Running enablement programs for new platform capabilities.
1. Tracking readiness health across concurrent initiatives.

## 11. Interfaces and Dependencies

- Paperclip plugin scaffold for worker, manifest, UI, and validation surfaces.

- `@uos/core` for operational lifecycle hooks.
- `@uos/paperclip-compat` for shared models and department composition.
- `@uos/plugin-operations-cockpit` for readiness and health visibility.
- Other department overlays when launches span multiple functions.

## 12. Implementation Backlog

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

## 13. Risks and Mitigations

- Checklists masquerading as true readiness.
- Research accumulation with weak decision linkage.
- Overlapping responsibilities with core or operations overlays.
- Reliability work remaining reactive rather than preventative.

## 14. Definition of Done

A task in this repo is only complete when all of the following are true:

- The code, configuration, or skill behavior has been updated with clear intent.
- Tests, evals, replay cases, or validation artifacts were added or updated to protect the changed behavior.
- Documentation, runbooks, or decision records were updated when the behavior, contract, or operating model changed.
- The task produced a durable learning artifact rather than only a code diff.
- Cross-repo consequences were checked wherever this repo touches shared contracts, orchestration, or downstream users.

### Repo-specific completion requirements
- Each new workflow ties research, readiness, and measurable outcomes together.
- Launch/reliability changes leave behind reusable playbooks or evaluation assets.
- The overlay captures what was learned, not only what was shipped.

## 15. Recommended Repo-Local Knowledge Layout

- `/docs/research/` for research briefs, benchmark notes, and upstream findings.
- `/docs/adrs/` for decision records and contract changes.
- `/docs/lessons/` for task-by-task learning artifacts and postmortems.
- `/evals/` for executable quality checks, golden cases, and regression suites.
- `/playbooks/` for operator runbooks, migration guides, and incident procedures.
