# caveman-status

A Claude Code mod for [caveman mode](https://github.com/JuliusBrussee/caveman): puts a clickable `🪨 <mode>` button in the prompt footer; click it to pick a level or turn caveman off.

```
[🪨 full]                                        (footer button, click it)
🪨 Caveman: [lite] [● full] [ultra] [off] [✕]   (picker above the prompt)
```

## Install

```
/plugin install caveman-status --marketplace ido6/claude-caveman-status
```

Pick the user scope so it loads in every session.

## Use

| Command | What it does |
| --- | --- |
| click `🪨` / `/cave` | Opens a picker above the prompt: `lite` `full` `ultra` `off` `✕`. Click one; the current mode is marked `●` |
| `/cave ultra` | Set a level: `lite`, `full`, `ultra`, `wenyan-lite`, `wenyan-full`, `wenyan-ultra` |
| `/cave off` | Turn caveman off; Claude replies in normal prose |

It also follows the caveman skill's own triggers: `/caveman <level>`, "stop caveman", "normal mode", "talk like caveman".

The mode is saved, so a new session starts where you left it (default `full`).

## How it works

- Draws a `🪨 <mode>` button at the right of the prompt footer, beside the mode labels. In a terminal, mouse clicks need the fullscreen UI; otherwise use `/cave`.
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
