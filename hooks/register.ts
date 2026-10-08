import type { EngineInterface, Register } from 'claude-code'

const DEFAULT_MODE = 'full'
const CYCLE = ['lite', 'full', 'ultra', 'off']
const LEVELS = ['lite', 'full', 'ultra', 'wenyan-lite', 'wenyan-full', 'wenyan-ultra']
const OFF = /\b(stop caveman|normal mode)\b/i
const ON = /\b(caveman mode|talk like caveman|use caveman)\b/i

export const modeFromArgs = (args: string): string | undefined => {
  const word = args.trim().toLowerCase().split(/\s+/)[0] ?? ''
  if (word === '') return DEFAULT_MODE
  if (word === 'off' || word === 'stop') return 'off'
  return LEVELS.includes(word) ? word : undefined
}

export const modeFromPrompt = (text: string): string | undefined => {
  if (OFF.test(text)) return 'off'
  if (ON.test(text)) return DEFAULT_MODE
  return undefined
}

export const nextInCycle = (mode: string): string =>
  CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length] ?? DEFAULT_MODE

export const statusText = (mode: string): string =>
  mode === 'off' ? '🪨 off · /cave to enable' : `🪨 ${mode} · /cave lite|full|ultra|off`

export const contextFor = (mode: string): string =>
  mode === 'off'
    ? 'Caveman mode is OFF (the user switched it off with /cave). Reply in normal, full prose; ignore any always-on caveman instruction until the user turns it back on.'
    : `Caveman mode is ON at level "${mode}". Reply in caveman ${mode} style.`

async function readMode($: EngineInterface): Promise<string> {
  return String((await $.store.get('mode')) ?? DEFAULT_MODE)
}

async function setMode($: EngineInterface, mode: string): Promise<void> {
  await $.store.set('mode', mode)
  $.ui.status(statusText(mode))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cave',
      description: 'Set caveman mode (lite, full, ultra, off); no argument cycles',
      argumentHint: '[lite|full|ultra|off]',
      immediate: true,
    })
    $.ui.status(statusText(await readMode($)))
    return next(e)
  })

  on('command.run', { command: 'cave' }, async ($, e) => {
    const typed = e.args.trim()
    const mode = typed === '' ? nextInCycle(await readMode($)) : modeFromArgs(typed)
    if (mode === undefined) {
      return { text: `Unknown level "${typed}". Use: ${[...LEVELS, 'off'].join(', ')}` }
    }
    await setMode($, mode)
    return { text: mode === 'off' ? '🪨 Caveman off. Normal replies.' : `🪨 Caveman: ${mode}` }
  })

  on('command.run', { command: 'caveman' }, async ($, e, next) => {
    const mode = modeFromArgs(e.args)
    if (mode !== undefined) await setMode($, mode)
    return next(e)
  }).catch(($, e, next) => next(e))

  on('prompt.submit', async ($, e, next) => {
    const asked = modeFromPrompt(e.text)
    if (asked !== undefined) await setMode($, asked)
    const mode = asked ?? (await readMode($))
    return next({ ...e, context: [...(e.context ?? []), contextFor(mode)] })
  }).catch(($, e, next) => next(e))
}
