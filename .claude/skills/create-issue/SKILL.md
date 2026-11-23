---
name: create-issue
description: Turn a requirement into properly structured issues — read the input (a description, a file in the repo, the current diff, or what was just discussed), read the code it touches, decide the shape (one issue, siblings, or a parent with tasks), decompose bigger work through the architect agent, check for duplicates, show the whole tree for one round of feedback, then create the issues from the template. Works with GitHub Issues or another tracker. Use when the user says "create an issue", "file this", "make an issue out of this", "write these TODOs as issues", or invokes /create-issue.
---

# Create issue

The opposite direction of [implement-issue](../implement-issue/SKILL.md): a requirement goes in,
issues come out. The invariant is **one issue = one reviewable PR's worth of work**. Anything larger
is a parent with tasks or several linked issues, never one big issue.

Tracker mechanics are in [implement-issue/TRACKER.md](../implement-issue/TRACKER.md). Templates are
in [TEMPLATES.md](TEMPLATES.md).

## Preflight

1. Resolve the tracker per TRACKER.md. Unavailable → STOP; never draft issues that cannot be created.
2. Resolve the input, in this order:

   | Argument                              | Input is                                               |
   | ------------------------------------- | ------------------------------------------------------ |
   | free text                             | that text                                              |
   | a path in the repo                    | that file (a spec, a design note, a TODO list)         |
   | an issue reference                    | that issue is the **parent**; the requirement is the ask |
   | `diff` / nothing + dirty tree         | the current work — see below                           |
   | nothing                               | what was just discussed in this session                |

   Nothing usable → ask what to file. Never invent a requirement.

## Gather context

In parallel:

- **File input** — read it whole, plus what it links to one level deep.
- **Git input** — `git status --short`, `git diff origin/main...HEAD`, and `TODO` / `FIXME` added by
  the diff. File what is _not done_, not what is.
- **Parent given** — read it: its labels and context are inherited by every child.
- **Always** — read the code the requirement touches firsthand. Acceptance criteria are written
  against what the code does today, not against an assumption about it.

## Duplicate check

Search open and closed issues over the key nouns (2–4 searches), per TRACKER.md. Judge by subject,
not wording. An **open** hit → propose updating it instead (the default). A **closed** hit → a
recurrence: a new issue that links it. Show each hit in the preview. Never file a silent twin.

## Decide the shape

| The requirement is                             | Create                                   |
| ---------------------------------------------- | ---------------------------------------- |
| one change worth one PR                        | one issue — **feature** or **bug**       |
| several independent changes                    | N sibling issues, with `Blocked by` lines |
| more than one PR, or a breakdown was asked for | a parent issue + a task list of children |

A **bug** is a defect in behaviour that already shipped. Work that was simply never done is a
**feature**, however annoying its absence is.

## Decompose

A small, unambiguous requirement is formatted 1:1 — do not pad it into a tree. Bigger or ambiguous
work goes to the `architect` agent; its tasks map 1:1 to children, each one PR that can merge on its
own.

An ambiguous or contradictory requirement is **never filled in by guessing** — ask before the
preview. A wrong guess ends up in the tracker and someone implements it.

## Preview and confirm

The only stop point. Print the whole tree before a single write, one line per issue:

```
feature  Copy action on assistant messages                     (new)
├─ feature  showCopyAction prop on AiChat / AiSidebar           (new)
└─ feature  copy label in en/cs, icon, story                    blocked by ↑
labels: enhancement
```

Ask for one round of feedback. Skip it only when the user said to go without questions.

## Create

Per [TEMPLATES.md](TEMPLATES.md): parent first, then children (a child needs the parent's
reference), then fill the parent's task list and the `Blocked by` lines once every reference exists.
A create that timed out may still have succeeded — search again before retrying.

## Report

The tree again, with references and URLs, then the hand-off: `→ /implement-issue #57`. State
anything you assumed and anything you left out.

## Constraints

- NEVER write anything before the preview round.
- NEVER invent acceptance criteria the input does not support — ask instead.
- NEVER edit an existing issue beyond the duplicate update or recurrence link the user confirmed.
- NEVER invent an issue reference.
