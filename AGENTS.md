# Codex working agreement — Candy Tetris Crush

## Shared development procedure
**Canonical universal workflow:** https://docs.google.com/document/d/1DDy_ZG2y7Ark8P40Bl0ndJ9nQbgAU5kbvMCYvRUhAY4/edit

This repository follows the owner-approved ChatGPT → Codex → owner-acceptance process. The link is a process reference, not permission to begin coding. If the document cannot be opened, follow the safeguards here, disclose the access gap, and request only essential missing context. Do not pretend it was read.

1. **Design first.** The owner and ChatGPT choose major UX, requirements, feature boundaries and acceptance tests. Brainstorming, draft specs and documentation-only changes do **not** authorize implementation.
2. **Explicit approval gate.** Before editing application code, locate the owner's current unambiguous implementation approval, the specific task/issue, approved scope and exclusions. If missing, do planning only and request approval.
3. **Ground the task.** Review the current issue, latest owner decision, unmerged PR feedback, relevant handoffs, source branch and existing project tracker. Newer verified instructions supersede stale chat summaries; do not mistake an old issue's approved state for authorization for a new feature.
4. **Preserve project records.** Update the SAME existing GitHub issue and Google Drive project tracker and task handoff after approval; never create replacement trackers or conflate separate products. When links/permissions are missing, report the limitation and leave existing data intact.
5. **Codex implementation.** Use the agreed task branch/baseline; implement only approved changes. Handle routine engineering choices directly; escalate major design, scope, migration, security or destructive decisions. Preserve persisted user data and existing accepted behavior, IDs, permissions, compatibility and signing where applicable.
6. **Objective verification.** Run suitable automated tests, static analysis/lint, builds, packaging and realistic runtime checks where available. Report actual commands, failures and environmental limitations; never claim that unrun tests or device checks passed.
7. **Delivery.** Provide exact branch and commit SHA, change summary, version/build metadata, source/artifact links and checksums where relevant, test evidence, outstanding issues and a concise change-specific owner test checklist. Put deliverables in the project's established location when connected access permits.
8. **Owner acceptance gate.** Only the owner performs final visual/usability/device acceptance. Keep work in review; **do not merge PRs, close issues, delete project data or initiate deferred work without explicit owner approval.** A technical build success is not owner acceptance.

## Project-specific constraints
No root README was found on the audited default branch. Inspect the source to establish gameplay, framework and test/build commands. Preserve existing game state and rules when modifying gameplay.

Read other existing repository docs before changing code. Treat this file as additive guidance: retain stricter project safety, privacy, build, release and owner-approval rules. If local instructions conflict with the universal process, surface the discrepancy rather than silently overriding them.
