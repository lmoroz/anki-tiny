# NPM Workspaces

## Overview

Since version 0.1.0, the project uses **npm workspaces** to manage the monorepo. This allows:

- Centralized dependency management
- Simplified development and build commands
- Sharing dependencies between frontend and backend
- Running commands for all workspaces simultaneously

## Workspaces Structure

```text
anki-tiny/
├── package.json          # Root package.json with workspaces
├── frontend/             # Frontend workspace (Vue 3 + Vite)
│   └── package.json
└── backend/              # Backend workspace (Express + Electron)
    └── package.json
```

## Core Commands

### From Project Root

```bash
# Install all dependencies (frontend + backend)
npm install
# Note: after installation, postinstall script will run automatically
# in backend workspace, triggering electron-rebuild for better-sqlite3.
# This may take 1-2 minutes on first install.

# Run app in dev mode
npm run dev

# Build production bundle
npm run bundle

# Lint all workspaces
npm run lint

# Format code in all workspaces
npm run format
```

### Workspace-specific commands

```bash
# Run command in frontend
npm run <script> --workspace=frontend

# Run command in backend
npm run <script> --workspace=backend

# Examples:
npm start --workspace=backend
npm run dev --workspace=frontend
npm run build --workspace=frontend
```

## Benefits

### Before (without workspaces)

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run dev mode
cd backend && npm run dev

# Build
cd frontend && npm run build
cd ../backend && npm run bundle
```

### After (with workspaces)

```bash
# Install dependencies
npm install

# Run dev mode
npm run dev

# Build
npm run bundle
```

## Adding Dependencies

### To specific workspace

```bash
# Add dependency to frontend
npm install <package> --workspace=frontend

# Add dev-dependency to backend
npm install -D <package> --workspace=backend
```

### To root package.json

For dependencies used at root level (e.g. for build or CI/CD):

```bash
npm install -D <package> -w root
```

## Important Notes

1. **`dev` command** in root `package.json` starts Electron app with hot reload for frontend
2. **`bundle` command** builds frontend, compiles backend, and creates installer
3. **PostInstall script**: After dependency installation, `postinstall` automatically runs in backend workspace,
   executing `electron-rebuild -f -w better-sqlite3` to build native module.
   This is required for proper SQLite operation.
4. All `node_modules` are stored in project root (due to hoisting)
5. Each workspace can have independent dependency versions in case of conflicts

## Migration

### What Changed

1. Created root `package.json` with `workspaces` field
2. Moved `dev` and `bundle` commands from `backend/package.json` to root
3. Updated documentation in `readme.md`

### What Remained Same

- Code structure of frontend and backend
- Configuration files (vite.config, tsconfig, etc.)
- package.json in each workspace (except removed `dev` and `bundle` commands in backend)

## Additional Resources

- [npm workspaces documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Managing Multiple Packages with Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces#managing-multiple-packages)
