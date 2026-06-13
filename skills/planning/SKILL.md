---
name: planning
description: >
  Analyze a codebase and produce a structured implementation plan for a ticket or feature.
  Saves the plan as plan.md (full technical detail) and digest.html (functional overview, no code)
  under .claude/plans/<ticket-id>/. Splits work into independently shippable phases/PRs when it
  genuinely makes sense — for frontend complex screens uses vertical slices gated by feature flags.
  Use this skill whenever the user says "/planning", "make a plan", "plan this ticket", "break this
  down into phases", "create an implementation plan", or provides a ticket ID and wants to plan work.
  Also trigger when the user wants to know how to approach a feature before writing code.
---

# planning

Produce a structured implementation plan for a feature or ticket. Enter plan mode — no code is
written, only plan artifacts.

## Invocation

```
/planning <TICKET-ID>                    # fetches Jira ticket for description
/planning <TICKET-ID> <description>      # uses provided description directly
```

## Step-by-step flow

### 1. Enter plan mode

Call `EnterPlanMode` immediately. This is a planning-only skill — nothing in the codebase is ever
modified.

### 2. Get the description

- If a description was provided alongside the ticket ID: use it as-is.
- If only a ticket ID was given: fetch it with `jira issue view <TICKET-ID>` and extract the
  title, description, and acceptance criteria. Use these as the feature description.
- If no ticket ID is given at all: ask for one before proceeding (needed for folder naming).

### 3. Detect repo type

Read the working directory to understand context:

- `Gemfile` present → Rails backend (timon-style)
- `package.json` + React patterns → frontend app (merchant-portal or shopper-app)
- Both or neither → use judgment

This affects phase-splitting strategy (see Step 6).

### 4. Explore the codebase

Search freely — grep for relevant model names, module names, keywords from the description.
Read the most relevant files to understand:

- Which models/tables are involved
- Which packs own the domain (if Packwerk is present, read relevant `package.yml` files)
- Existing patterns you should follow (operations, jobs, consumers, etc.)
- Any feature flags already in place (`Flipper` for Rails, check `app/` and `packs/` for flag usage)

Don't over-read. Stop when you have enough to plan confidently.

### 5. Ask clarifying questions

Before writing anything, surface genuine uncertainties. Use `AskUserQuestion` — one question at a
time. Only ask when you're actually uncertain and the answer would meaningfully change the plan.
Don't ask for the sake of asking.

Good reasons to ask:
- Ambiguity about which model/table to extend vs. create new
- Unclear whether something should be behind a feature flag
- Multiple valid architectural approaches with different tradeoffs
- Scope uncertainty (does this include X or not?)

Bad reasons to ask:
- You just want confirmation of something obvious
- The answer is already clear from the codebase
- It's a minor detail you can decide yourself

### 6. Decide on phases

**The bar for splitting:** only split if each phase can be merged to main and used (or safely
ignored) without the next phase existing. No artificial splits.

**Backend (Rails):**
- Schema changes (migrations) often warrant a separate first phase
- API contract changes before consumer changes
- When a phase genuinely works and ships value alone

**Frontend complex screens:**
- Use vertical slices: each phase adds a complete, working slice of the screen
  (e.g., Phase 1: empty state + header, Phase 2: list view, Phase 3: detail panel)
- Gate incomplete work with feature flags so each phase can merge without showing broken UI
- This is about PR reviewability — keep diffs manageable

**When NOT to split:**
- Small-to-medium changes that belong together
- Splitting would just create overhead with no benefit
- When phases would be so thin they're meaningless

If the work is one phase, say so clearly. Don't invent phases.

### 7. Write plan.md

Save to `.claude/plans/<TICKET-ID>/plan.md`. Create the directory if it doesn't exist.

Structure:

```markdown
# <TICKET-ID>: <Title>

## Overview

<2-3 paragraphs: what this changes, why, what the end state looks like>

## Phase 1: <Descriptive name>

**Goal:** <One sentence — what this PR delivers and why it can ship alone>

**Steps:**
- [ ] <concrete step — e.g., "Add `otp_retry_count:integer` column to `shoppers` table">
- [ ] <next step>
- [ ] ...

## Phase 2: <Descriptive name>

...
```

Steps should be concrete enough to act on but not include the actual code. Name the tables,
columns, models, classes, and files involved. Describe the shape of the change, not the
implementation syntax.

Include code snippets only when a concept is genuinely hard to convey without one (e.g., a
non-obvious data structure or a subtle API contract). When in doubt, leave code out of plan.md
too — prose is enough.

### 8. Tell the user where to find the plan

Tell the user:
- `plan.md` is at `.claude/plans/<TICKET-ID>/plan.md`
- They can run `/digest <TICKET-ID>` to generate a visual HTML overview of the approach
