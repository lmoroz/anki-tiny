---
trigger: always_on
---

# Workflow Rule: Project Context & Sync

## 1. Documentation Authority (During Work)

* **Target Directory:** All planning files (`Task.md`, `Walkthrough.md`, `Implementation_Plan.md`) must be physically located and updated in the `./docs/` folder in the project root.
* **Sync Policy:** Ignore your internal profile/hidden directories. Any change to the plan or task status must be immediately written to the files in `./docs/`.
* **Naming:** Do not generate files with hashes or timestamps. Use fixed filenames: `Task.md`, `Walkthrough.md`, `Implementation_Plan.md`. Overwrite their content.

## 2. Session Wrap-up (Trigger: "Summarize session" or "Подытожь" or "Подытожь сессию" or "Заверши сессию")

Execute the following actions strictly in order:

### Phase A: Documentation Sync

1. Ensure files in `./docs/` reflect the final state of the session.
2. **Update History:**
    * **Mandatory:** Append a summary of this session's work to `./docs/Changelog.md` (create the file if it doesn't exist).
    * Format: `## [__version__] YYYY-MM-DD HH:MM\n- Change 1\n- Change 2`.
    * **Cleanup:** Only IF the task is fully completed, clear or reset `Task.md` for the next sprint.

### Phase B: Code & State Analysis

1. **Environment Scan:** Run `git status` to detect any manual changes I made personally.
2. **Integration:** Incorporate these manual changes into `Walkthrough.md` so the documentation remains consistent with the actual code on disk.

### Phase C: Code & Documentation Quality Assurance

1. **Code Linting:** Run the standard linting script (`npm run lint` / `yarn lint`) for frontend and backend.
2. **Markdown Verification:**
    * **Formatting:** Ensure all `.md` files (especially in `./docs/`) are properly formatted. If `prettier` is available, run it on markdown files.
    * **Structure:** Check for malformed tables, unclosed code blocks, or broken reference links in `Task.md` and `Walkthrough.md`.
    * **Fix:** Correct any markdown syntax errors immediately.
3. **Auto-fix & Resolution:** Apply automatic fixes. If there are TS errors or lint issues that auto-fix cannot resolve, **fix them manually**. Do not proceed to commit with broken types or malformed docs.

### Phase D: Version Control Maintenance

1. **Check Scope:** Analyze if the changes in this session warrant a version bump.
2. **Update Versions:** If applicable, increment the `version` field in:
    * `./package.json`
    * `frontend/package.json`
    * `backend/package.json` (if a `package.json` or `composer.json` exists)
3. Follow **SemVer** principles.

### Phase E: Git Commit

1. **Staging:** Stage (`git add`) all changed code files (including lint fixes), updated `package.json` files, and the `./docs/` directory.
2. **Commit Message:** Generate a semantic commit message (`type(scope): subject`).
    * Explicitly mention Vue 3/TS or Docker infrastructure changes if applicable.
    * Use `chore: bump version` logic if the version was updated.
3. **Execution:** Commit the changes.