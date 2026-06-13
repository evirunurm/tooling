---
name: digest
description: >
  Generate a visual HTML digest for a planned ticket. Reads the plan.md produced by /planning
  and creates a self-contained digest.html that explains the approach visually — not a list of
  files or steps, but a story of the problem, the solution strategy, and the phases. Saves to
  .claude/plans/<ticket-id>/digest.html and opens it in the browser.
  Use whenever the user says "/digest", "generate the digest", "make the visual", "open the
  digest", "show me the plan overview", or after /planning has produced a plan.md.
---

# digest

Generate a visual HTML digest from a plan.md file. The digest is a developer-facing overview
that explains the **approach** — what problem is being solved and how — without requiring the
reader to trace through code or file changes.

## Invocation

```
/digest <TICKET-ID>          # reads .claude/plans/<TICKET-ID>/plan.md
/digest                      # infer ticket ID from current branch or recent plan
```

## What the digest is (and isn't)

**Is:** A visual story of the solution approach. Someone can read it and understand *what is
changing in the system's behavior* and *why the approach makes sense*, without opening a single
file.

**Is not:** A file inventory, a step checklist, or a technical spec. Those live in plan.md.

The test: could a developer who just joined the team read this digest and confidently review
the implementation PR? If yes, it's right.

## Step-by-step

### 1. Read the plan

Read `.claude/plans/<TICKET-ID>/plan.md`. Extract:
- The overall goal (what changes in the system's behavior after this lands)
- The problem being solved (what's broken or missing today)
- The phases: what each one introduces conceptually, and why it's ordered this way
- Any key decisions or tradeoffs baked into the approach

Do not extract file lists or step checklists — those stay in plan.md.

### 2. Build the HTML

Save to `.claude/plans/<TICKET-ID>/digest.html`. Self-contained, no external dependencies,
all styles inline. No JS frameworks.

#### Overall page structure

```
HEADER          — ticket ID, title, one-line hook
PROBLEM         — why this work exists
APPROACH        — the strategy, visualised
PHASES          — one card per phase, concept-focused
FILES TABLE     — minimal reference table at the bottom
```

---

#### HEADER

Dark background. Large title. Ticket ID badge. A one-line hook (not the full summary —
just enough to orient the reader in five words).

---

#### PROBLEM BAND

A visually distinct section (slightly tinted background, left accent bar, or similar).
2–3 sentences max. Plain English. Answers: "What is wrong or missing today, and why does
it matter?" No implementation language.

---

#### APPROACH — the centrepiece

This is the most important section. It should make the solution strategy *immediately
legible* without reading anything else.

Use a visual layout — not prose, not a list. Good options:

**Before → After** (for migrations, refactors, data changes):
Three boxes in a row:
```
[ Current State ]  →→  [ This Work ]  →→  [ End State ]
"Carts have no         "Backfill +         "All orders
 improved_status"       mapping SQL"        queryable by
                                            new status"
```

**Concept map** (for new features or flows):
Show the key moving parts as labelled boxes with arrows between them. Not a full architecture
diagram — just the 3–5 concepts that interact in this solution.

**Decision diagram** (for branching logic or feature flags):
Show the flag/condition and what each branch enables.

Each visual should have a short caption (one sentence) below it explaining *why* this is
the right approach, not what it shows.

Use pure CSS (flexbox, borders, pseudo-elements for arrows). Keep it clean. No more than
3 visual elements — if you need more, the approach section has drifted into implementation.

---

#### PHASES

One card per phase. Each card:

**Phase name** — Descriptive, not "Phase 1". The name should say what the phase introduces
conceptually (e.g., "Schema foundation", "Backfill historical data", "Wire up the UI").

**Goal sentence** — What does the system do differently when this phase merges? Focus on
observable behavior, not file count.

**Concept paragraph** — 2–4 sentences describing what concept is being introduced or
changed, and *why this phase comes before the next*. If there's one phase, explain why it's
all together. Domain vocabulary is fine; file paths are not.

**Phase badge** — "Phase N of M" in the corner.

No checklists. No file names. No step bullets. The developer can open plan.md for those.

If there's only one phase, a single card works — just drop the badge.

---

#### FILES TABLE

At the bottom, visually separated from the rest. Titled "Files touched".

| File | Action | Why |
|------|--------|-----|
| `path/to/file.rb` | Modified | One sentence on what role it plays |

Keep the "Why" column brief. This table is reference material, not the story — the reader
should already understand the approach before they reach it.

Action values: Added / Modified / Generated (for db/structure.sql etc.)

---

### 3. Open the digest

```bash
open .claude/plans/<TICKET-ID>/digest.html
```

Tell the user where the file is and that plan.md has the full technical detail.

---

## Visual style guidance

- **Palette:** Dark navy header (`#0f1b35` or similar), white cards, subtle grey background.
  Use one accent colour consistently (blue `#0052cc`, or derive from the project if obvious).
- **Typography:** System font stack. Large heading for title. Comfortable line-height (1.6–1.7)
  for body text. Monospace only for file paths in the files table.
- **Cards:** Rounded corners (8px), thin border (`#dfe1e6`), generous padding (24–28px).
  Slight shadow for depth.
- **Approach visuals:** Boxes with dashed or solid borders, arrows via CSS `::after` or
  border tricks. Keep it minimal — the content matters more than the diagram aesthetics.
- **Spacing:** Breathe. More whitespace is better. Don't cram.
- **No icons, no emoji, no gradients** — they date quickly and add noise.

## What to avoid

- **File-first thinking.** Don't structure phases around "we add this file, then that file."
  Structure them around "this concept lands first, then this one builds on it."
- **Step bullets.** The digest is not a checklist. If you find yourself writing bullets, you've
  slipped into plan.md territory.
- **Code snippets.** None. Not even SQL. If the approach requires seeing a query to understand,
  describe the query's purpose in prose instead.
- **Exhaustive acceptance criteria.** The digest doesn't verify anything — it explains.
- **Passive voice for the approach.** "Data will be migrated" is weaker than "We backfill
  historical records to make all orders queryable under the new model." Use active voice.
