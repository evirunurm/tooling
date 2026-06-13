# Vault of Tooling

This is my personal vault of tooling, configurations, and custom agent skills. It's a grab-bag of things I use across projects — mostly Pi (coding agent) extensions and skills.

## What's in here

- **`pi/extensions/`** — Pi extensions for my local setup. Currently just a permission gate that confirms before destructive tool calls (`bash`, `edit`, `write`).
- **`skills/`** — Custom agent skills (digest, planning, etc.) with their own evals and configurations.

## Why this repo exists

I got tired of re-creating the same configs and extensions in every project. This repo keeps them versioned and portable. I clone it or symlink it when I need my setup on a new machine.

## Usage

Most of this is meant to be consumed by [Pi](https://github.com/earendil-works/pi-coding-agent) directly via auto-discovery:

- `pi/extensions/` → picked up as project-local extensions
- `skills/` → picked up as project-local skills (or symlinked globally)

Otherwise, nothing here is meant to be a standalone product. It's just my stuff.
