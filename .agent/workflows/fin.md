---
description: Rules and stages for completing a session
---

# Workflow Rule: Project Context & Sync

## Session Wrap-up

Execute the following actions strictly in order:

### Phase A: Documentation Sync

1. Ensure files in `./docs/` reflect the final state of the session.
2. Ensure that the `./readme.md` file reflects the current state of the project, and update the project status in this
   file as necessary.
3. Ensure that the `./openspec/project.md` file reflects the current state of the project, and update the project status
   in this file as necessary.
4. **Update History:**
   - **Mandatory:** Add a summary of this session's work to the `./docs/Changelog.md` file (create the file if it does
     not exist), **use English only**, and be as **concise** as possible.
   - Format: `## [package.json[version]] YYYY-MM-DD HH:MM\n- Change 1\n- Change 2`.
   - **Cleanup:** Only IF the task is fully completed, clear or reset `Task.md` for the next sprint.

### Phase B: Code & State Analysis

1. **Environment Scan:** Run `git status` to detect any manual changes I made personally.
2. **Check each changed file separately** using `git diff` to determine the nature of the changes.
3. **Integration:** Incorporate these manual changes into `Walkthrough.md` and `./docs/Changelog.md` so the
   documentation remains consistent with the actual code on disk.

### Phase C: Code & Documentation Quality Assurance

1. **Code quality** Сheck the code for compliance with **JavaScript/TypeScript code formatting rules**.
2. **Code Linting:** Run the standard linting script (`npm run lint` / `yarn lint`) for frontend and backend.
3. **Markdown Verification:**
   - **Formatting:** Ensure all `.md` files (especially in `./docs/`) are properly formatted. If `prettier` is
     available, run it on markdown files.
   - **Structure:** Check for malformed tables, unclosed code blocks, or broken reference links in `Task.md` and
     `Walkthrough.md`.
   - **Fix:** Correct any markdown syntax errors immediately.
4. **Auto-fix & Resolution:** Apply automatic fixes. If there are TS errors or lint issues that auto-fix cannot resolve,
   **fix them manually**. Do not ignore warnings. Do not proceed to commit with broken types or malformed docs.

### Phase D: Version Control Maintenance

1. **Check Scope:** Analyze if the changes in this session warrant a version bump.
2. **Update Versions:** If applicable, increment the `version` field in:
   - `./package.json`
   - `frontend/package.json`
   - `backend/package.json` (if a `package.json` or `composer.json` exists)
3. Follow **SemVer** principles.

### Phase E: Git Commit

1. **Staging:** Prepare (`git add`) all modified code files (including lint fixes), updated `package.json` files,
   readme.md, and the `./docs/` and `./openspec/` directories.
2. **Commit Message:** Generate a semantic commit message (`type(scope): subject`).
   - Explicitly mention Vue 3/TS or Docker infrastructure changes if applicable.
   - Use `chore: bump version` logic if the version was updated.
3. **Execution:** Commit the changes.
