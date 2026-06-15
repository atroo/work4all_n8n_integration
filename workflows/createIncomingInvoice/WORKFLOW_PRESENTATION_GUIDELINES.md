# Workflow Presentation Guidelines

Best practices for presenting / organizing n8n workflows (sticky notes, sections,
layout). Use these when polishing `w4a-invoice-workflow-template.json` for
deployment / template submission.

The rules below follow the **official written guidelines** (canonical). The
"Emphasis / rationale" section keeps the extra reasoning we collected.

---

## Sticky note types

### Main overview sticky (required)

- Exactly **one** per workflow.
- **Yellow** color, positioned in the **top-left corner** of the canvas.
- **100–300 words** (concise, but not a one-liner).
- Includes `### How it works` and `### Setup`.
- Optional: `### Customization` tips.

### Section stickies (required for 4+ node workflows)

- Used to **group multiple nodes** into clear sections.
- **White** color (or grey in dark mode).
- **Under 50 words** — ideally just a short `##` heading + 1–2 short lines.
- Stretched to **cover / label multiple nodes** (not just one).

### Warning stickies (optional)

- Used to **draw the user's attention** to a critical setup step or risk.
- **Red** color, covering only **one** node.
- Use **sparingly or not at all**.

### Video stickies (optional, but recommended)

- If the workflow is complex or aimed at beginners, embed a walkthrough video to
  help users with the setup.
- Create a regular sticky note and add `@[youtube](VIDEO_ID)`
  (the part in `()` is the YouTube video ID).

---

## Emphasis / rationale (our notes)

- A workflow without stickies is bad — always include them.
- A main sticky note is required.
- Sections matter — they make the workflow easier to understand.
- Do **not** use too many colors — keep focus (yellow = overview, white =
  sections, red = warnings only).
- Avoid one sticky per node. Too many stickies (one for each node) is bad —
  better to group nodes and give the group a good, short title.
- Less text, with well-considered content.

---

## Quick checklist

- [ ] Exactly one **yellow** main sticky, top-left, 100–300 words
- [ ] Main sticky has `### How it works` + `### Setup` (optional `### Customization`)
- [ ] Nodes grouped into **white** section stickies (< 50 words each) when 4+ nodes
- [ ] Section stickies stretched to cover the nodes they label
- [ ] Red warning sticky only on a single setup/risk node, used sparingly
- [ ] YouTube walkthrough embedded via `@[youtube](VIDEO_ID)`
- [ ] Limited color palette (yellow / white / red), focused
