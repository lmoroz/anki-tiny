---
trigger: always_on
---

# Workflow Rule: Project Context & Sync

## 1. Documentation Authority (During Work)
* **Target Directory:** All planning files (`Task.md`, `Walkthrough.md`, `Implementation_Plan.md`) must be physically located and updated in the `./docs/` folder in the project root.
* **Sync Policy:** Ignore your internal profile/hidden directories. Any change to the plan or task status must be immediately written to the files in `./docs/`.
* **Naming:** Do not generate files with hashes or timestamps (e.g., `Task_123.md`). Use fixed filenames: `Task.md`, `Walkthrough.md`, `Implementation_Plan.md`. Overwrite their content with the current state to maintain a clear history via Git.

## 2. Session Wrap-up (Trigger: "Summarize session" or "Подытожь" or "Подытожь сессию")
Execute the following actions strictly in order:

### Phase A: Documentation Sync
1.  Ensure files in `./docs/` reflect the final state of the session.
2.  If the task is fully completed:
    * Move key highlights from `Task.md` to `docs/Changelog.md` (or project history).
    * Clear or reset `Task.md` for the next sprint.

### Phase B: Code & State Analysis
1.  **Environment Scan:** Run `git status` to detect any manual changes I made personally (files you did not touch).
2.  **Integration:** Incorporate these manual changes into `Walkthrough.md` so the documentation remains consistent with the actual code on disk.

### Phase C: Version Control Maintenance
1.  **Check Scope:** Analyze if the changes in this session warrant a version bump.
2.  **Update Versions:** If applicable, increment the `version` field in:
    * `frontend/package.json`
    * `backend/package.json` (if a `package.json` or `composer.json` exists and tracks versions)
3.  Follow **SemVer** principles (patch for fixes, minor for features).

### Phase D: Git Commit
1.  **Staging:** Stage (`git add`) all changed code files, updated `package.json` files, and the `./docs/` directory.
2.  **Commit Message:** Generate a semantic commit message (`type(scope): subject`).
    * Explicitly mention Vue 3/TS or Docker infrastructure changes if applicable.
    * Use `chore: bump version` logic if the version was updated.
3.  **Execution:** Commit the changes.