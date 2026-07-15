---
title: dotfiles
description: Personal dotfiles for Pop!_OS, managed as GNU Stow packages with a custom CLI wrapper.
tech: [Shell, Lua, GNU Stow, Neovim]
repo: https://github.com/jakeryderv/.dots
featured: false
order: 5
---

Each tool (terminal emulators, Neovim, tmux, Starship, coding agents) lives as a
self-documenting Stow package that symlinks into `$HOME`. A `dots` CLI wraps Stow with
fixed `--dir`/`--target` plus `status`, `doctor`, and `check` commands, and a helper
script verifies every package ships a README.
