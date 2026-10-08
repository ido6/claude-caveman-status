# caveman-status

A Claude Code mod for [caveman mode](https://github.com/JuliusBrussee/caveman): shows the current level in the status line and lets you switch level or turn it off with one command.

```
🪨 full · /cave lite|full|ultra|off
```

## Install

```
/plugin install caveman-status --marketplace ido6/claude-caveman-status
```

Pick the user scope so it loads in every session.

## Use

| Command | What it does |
| --- | --- |
| `/cave` | Cycle: lite → full → ultra → off → lite |
| `/cave ultra` | Set a level: `lite`, `full`, `ultra`, `wenyan-lite`, `wenyan-full`, `wenyan-ultra` |
| `/cave off` | Turn caveman off; Claude replies in normal prose |

It also follows the caveman skill's own triggers: `/caveman <level>`, "stop caveman", "normal mode", "talk like caveman".

The mode is saved, so a new session starts where you left it (default `full`).

## How it works

- Sets a status line entry with the current mode.
- Adds one hidden line of context to each prompt telling Claude the current mode (on at level X, or off), so switching takes effect on the next reply.
- Works best with the caveman skill installed; with mode `off` it tells Claude to ignore an always-on caveman instruction.

Needs a Claude Code build with function-hook plugins (2.1.29x or newer).

## Develop

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```

MIT license.
