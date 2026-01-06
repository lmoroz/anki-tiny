# 📚 OpenSpec Workflow — Working Guide

## What is OpenSpec?

**OpenSpec** is a **spec-driven development** methodology where:

- **Specs** (`openspec/specs/`) — are the **source of truth** about what is ALREADY built
- **Changes** (`openspec/changes/`) — are **proposals** about what SHOULD change
- Development process goes through three clear stages: **Proposal → Implementation → Archive**

This ensures:

- ✅ Changes transparency
- ✅ Quality control through review
- ✅ Documentation and code synchronization
- ✅ History of all architectural decisions

---

## 🔄 Three Development Stages

### **Stage 1: Creating Changes** (Creating proposals)

#### When should I create a Proposal?

✅ **Create a proposal** if:

- Adding new features or functionality
- Making breaking changes (API, DB schema)
- Changing architecture or patterns
- Optimizing performance (behavior changes)
- Updating security patterns

❌ **DON'T create a proposal** if:

- Fixing bugs (restoring intended behavior)
- Fixing typos, formatting, comments
- Updating dependencies (non-breaking)
- Changing configuration
- Adding tests for existing behavior

#### Proposal creation process

**Step 1:** Study context

```bash
openspec list              # What's already in progress?
openspec list --specs      # What capabilities exist?
```

**Step 2:** Choose unique `change-id` (kebab-case, verb at the start)

- Examples: `add-two-factor-auth`, `update-card-schema`, `remove-old-api`
- Use prefixes: `add-`, `update-`, `remove-`, `refactor-`

**Step 3:** Create structure in `openspec/changes/[change-id]/`:

```text
openspec/changes/add-card-batch-import/
├── proposal.md          # Why and what we're changing
├── tasks.md             # Implementation checklist
├── design.md            # (optional) Technical solutions
└── specs/               # Specification delta changes
    └── cards/
        └── spec.md      # ADDED/MODIFIED/REMOVED Requirements
```

**Step 4:** Write **spec deltas** (specification changes)

Delta file format:

```markdown
## ADDED Requirements

### Requirement: Batch Card Import

The system SHALL allow importing multiple cards from CSV.

#### Scenario: Successful import

- **WHEN** user uploads valid CSV file
- **THEN** all cards are created in the course

## MODIFIED Requirements

### Requirement: Card Creation API

[Complete updated requirement content with all scenarios]

## REMOVED Requirements

### Requirement: Old Single Import

**Reason**: Replaced by batch import
**Migration**: Use new batch endpoint
```

**Critically important:**

- Each requirement MUST have at least one `#### Scenario:`
- Scenarios use **4 hashtags** (`####`)
- In `MODIFIED` write COMPLETE requirement content, not just changes

**Step 5:** Validate

```bash
openspec validate [change-id] --strict
```

**Step 6:** Request approval

🚨 **AI agent does NOT start implementation until developer approves the proposal!**

---

### **Stage 2: Implementing Changes** (Implementation)

After proposal approval:

1. ✅ Read `proposal.md` — what we're building
2. ✅ Read `design.md` (if exists) — technical solutions
3. ✅ Read `tasks.md` — task checklist
4. ✅ Implement tasks **sequentially** (in order)
5. ✅ Confirm completion — verify everything is ready
6. ✅ Update checklist — mark `- [x]` only after **complete** finish
7. ✅ After implementation, validate all code (linting, tests)

**Workflow command for AI agent:**

```text
/openspec-apply [change-id]
```

---

### **Stage 3: Archiving Changes** (Archiving)

After deployment (when changes work in production):

1. Move `changes/[name]/` → `changes/archive/YYYY-MM-DD-[name]/`
2. Update `specs/` — apply deltas to main specifications
3. Validate archive:

```bash
openspec validate --strict
```

**Workflow command:**

```text
/openspec-archive [change-id]
```

---

## 🎯 Roles in the Process

### Developer (human)

1. **Requests feature** — "Add card import from CSV"
2. **Approves proposal** — checks that requirements are understood correctly
3. **Checks result** — tests implementation
4. **Triggers archiving** — when feature is deployed

### AI Agent

1. **Creates proposal** with detailed description of changes
2. **Waits for approval** — doesn't code without "OK"
3. **Implements according to tasks.md** — sequentially, updating checklists
4. **Synchronizes documentation** — updates `docs/Changelog.md`, `docs/Walkthrough.md`
5. **Archives changes** — after developer's command

---

## 🛠 Useful Commands

### For developer (human)

```bash
# What's currently in progress?
openspec list

# What capabilities already exist?
openspec list --specs

# View proposal details
openspec show [change-id]

# View specific specification
openspec show [spec-id] --type spec

# Validate proposal
openspec validate [change-id] --strict

# Validate all changes
openspec validate --strict
```

### Workflow commands (for AI agent)

```text
# Create new proposal
/openspec-proposal

# Implement approved proposal
/openspec-apply [change-id]

# Archive after deployment
/openspec-archive [change-id]
```

---

## 📋 Directory Structure

```text
openspec/
├── project.md              # Project conventions
├── AGENTS.md               # Detailed instructions for AI
├── specs/                  # Source of truth — what is BUILT
│   └── [capability]/
│       ├── spec.md         # Requirements and Scenarios
│       └── design.md       # Technical patterns
└── changes/                # Proposals — what SHOULD change
    ├── [change-name]/
    │   ├── proposal.md     # Why and what
    │   ├── tasks.md        # Checklist
    │   ├── design.md       # Technical solutions (optional)
    │   └── specs/
    │       └── [capability]/spec.md  # Deltas
    └── archive/            # Completed changes
        └── YYYY-MM-DD-[change-name]/
```

---

## 💡 Full Cycle Example

### 1️⃣ Developer says

> "Need to add card import from CSV file"

### 2️⃣ AI agent responds

> "Will create proposal for `add-card-csv-import`. Wait, studying existing specs..."

Then creates:

- `openspec/changes/add-card-csv-import/proposal.md`
- `openspec/changes/add-card-csv-import/tasks.md`
- `openspec/changes/add-card-csv-import/specs/cards/spec.md`

And says:

> "✅ Proposal ready! Check `proposal.md` and `tasks.md`. If everything is OK — say 'approve', and I'll
> start implementation."

### 3️⃣ Developer responds

> "approve" (or "approve")

### 4️⃣ AI agent implements

```text
✅ 1.1 Create CSV parser service
✅ 1.2 Add import endpoint to Cards API
✅ 1.3 Create frontend upload component
✅ 1.4 Write tests
```

And updates `docs/Changelog.md`, `docs/Walkthrough.md`

### 5️⃣ Developer tests and says

> "/openspec-archive add-card-csv-import"

### 6️⃣ AI agent archives

- Moves to `changes/archive/2026-01-06-add-card-csv-import/`
- Updates `specs/cards/spec.md` with new requirements
- Validates everything via `--strict`

---

## 📝 Specification Format

### Correct Scenario format

```markdown
#### Scenario: User imports valid CSV

- **WHEN** user uploads CSV with 10 cards
- **THEN** all 10 cards are created
- **AND** success notification is shown
```

### Incorrect formats

```markdown
- **Scenario: Import CSV** ❌ (bullet)
  **Scenario**: Import CSV ❌ (bold label)
  ### Scenario: Import CSV ❌ (3 hashtags)
```

### Operations with Requirements

#### ADDED

Use for new capabilities that can exist independently.

```markdown
## ADDED Requirements

### Requirement: CSV Batch Import

The system SHALL support importing multiple cards from CSV files.

#### Scenario: Valid CSV upload

- **WHEN** user uploads valid CSV
- **THEN** all cards are created
```

#### MODIFIED

Use for changing existing behavior.

**IMPORTANT**: copy COMPLETE requirement content from `openspec/specs/[capability]/spec.md`,
then edit.

```markdown
## MODIFIED Requirements

### Requirement: Card Creation

[Complete requirement content + all its scenarios]
```

#### REMOVED

Use for removing obsolete features.

```markdown
## REMOVED Requirements

### Requirement: Single Card Import

**Reason**: Replaced by batch import API
**Migration**: Use POST /api/cards/batch endpoint
```

#### RENAMED

Use only for renaming without logic changes.

```markdown
## RENAMED Requirements

- FROM: `### Requirement: Login`
- TO: `### Requirement: User Authentication`
```

---

## ⚠️ Critically Important

1. **Specs = Source of Truth** — always sync specifications with code
2. **No implementation without approval** — AI doesn't code without proposal approval
3. **Strict validation** — always check via `--strict` before commit
4. **Sequential tasks** — tasks are executed in order, marked after completion
5. **At least one scenario** — each requirement must have at least one scenario

---

## 🎓 Best Practices

### Simplicity First

- By default <100 lines of new code
- Implementation in one file until proven need for separation
- Avoid frameworks without clear justification
- Choose proven, boring patterns

### Complexity Triggers

Add complexity only when:

- Performance data showing current solution is too slow
- Specific scale requirements (> 1000 users, > 100MB data)
- Multiple proven use cases requiring abstraction

### Clear References

- Use `file.ts:42` format for code references
- Reference specifications as `specs/auth/spec.md`
- Link related changes and PRs

### Capability Naming

- Use verb-noun: `user-auth`, `payment-capture`
- One goal per capability
- 10-minute clarity rule
- Split if description requires "AND"

### Change ID Naming

- Use kebab-case, short and descriptive: `add-two-factor-auth`
- Prefer verb prefixes: `add-`, `update-`, `remove-`, `refactor-`
- Ensure uniqueness; if taken, add `-2`, `-3`, etc.

---

## 🔧 Troubleshooting

### Common Errors

#### "Change must have at least one delta"

- Check that `changes/[name]/specs/` exists with .md files
- Ensure files have operations (## ADDED Requirements)

#### "Requirement must have at least one scenario"

- Check that scenarios use `#### Scenario:` format (4 hashtags)
- Don't use bullet points or bold for scenario headers

#### Silent scenario parsing failures

- Exact format required: `#### Scenario: Name`
- For debugging: `openspec show [change] --json --deltas-only`

### Validation tips

```bash
# Always use strict mode for comprehensive checks
openspec validate [change] --strict

# Debug delta parsing
openspec show [change] --json | jq '.deltas'

# Check specific requirement
openspec show [spec] --json -r 1
```

---

## 📚 Additional Resources

- **Detailed instructions**: see `openspec/AGENTS.md`
- **Project conventions**: see `openspec/project.md`
- **Workflow commands**: see `.agent/workflows/openspec-*.md`

---

**Remember:** Specs are truth. Changes are proposals. Keep them synchronized! 🚀
