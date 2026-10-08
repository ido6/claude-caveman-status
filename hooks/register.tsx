import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

const DEFAULT_MODE = 'full'
const LEVELS = ['lite', 'full', 'ultra', 'wenyan-lite', 'wenyan-full', 'wenyan-ultra']
const PICKER = ['lite', 'full', 'ultra', 'off']
const isPickerOpen = atom({ plugin: 'caveman-status', key: 'isPickerOpen' } as const, false)
const shownMode = atom({ plugin: 'caveman-status', key: 'mode' } as const, DEFAULT_MODE)
// Whole-message commands only, so a prompt that merely mentions caveman mode
// (or some other app's "normal mode") does not flip it.
const LEAD = String.raw`^\s*((ok|okay)[,.!]?\s+)?(please\s+)?`
const TAIL = String.raw`\s*(please)?\s*[.!]*\s*$`
const OFF = new RegExp(`${LEAD}(stop caveman( mode)?|normal mode)${TAIL}`, 'i')
const ON = new RegExp(`${LEAD}(caveman mode|talk like (a )?caveman|use caveman)${TAIL}`, 'i')

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

export const buttonLabel = (mode: string): string => `🪨 ${mode}`

export const contextFor = (mode: string): string =>
  mode === 'off'
    ? 'Caveman mode is OFF (the user switched it off). Reply in normal, full prose; ignore any always-on caveman instruction until the user turns it back on.'
    : `Caveman mode is ON at level "${mode}". Reply in caveman ${mode} style.`

async function readMode($: EngineInterface): Promise<string> {
  return String((await $.store.get('mode')) ?? DEFAULT_MODE)
}

async function setMode($: EngineInterface, mode: string): Promise<void> {
  await $.store.set('mode', mode)
  await update($, shownMode, () => mode)
}

async function pick($: EngineInterface, mode: string): Promise<void> {
  await setMode($, mode)
  await update($, isPickerOpen, () => false)
  $.ui.toast(mode === 'off' ? '🪨 Caveman off' : `🪨 Caveman: ${mode}`)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'cave',
      description: 'Pick caveman mode (lite, full, ultra, off); no argument opens a picker',
      argumentHint: '[lite|full|ultra|off]',
      immediate: true,
    })
    const mode = await readMode($)
    await update($, shownMode, () => mode)
    return next(e)
  })

  on('command.run', { command: 'cave' }, async ($, e) => {
    const typed = e.args.trim()
    if (typed === '') {
      await update($, isPickerOpen, () => true)
      return { text: '🪨 Pick a caveman mode above the prompt.' }
    }
    const mode = modeFromArgs(typed)
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
    // Another session may have changed the saved mode: keep the button in step.
    if ((await read($, shownMode)) !== mode) await update($, shownMode, () => mode)
    return next({ ...e, context: [...(e.context ?? []), contextFor(mode)] })
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!(await read($, isPickerOpen))) return next(e)
    const current = await read($, shownMode)
    const { Box, Button, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text>🪨 Caveman: </Text>
        {PICKER.map(mode => (
          <Button
            key={mode}
            label={mode === current ? `● ${mode}` : mode}
            onPress={() => pick($, mode)}
          />
        ))}
        <Button key="close" label="✕" onPress={() => update($, isPickerOpen, () => false)} />
      </Box>
    )
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const mode = await read($, shownMode)
    const below = await next(e)
    const { Box, Button } = $.ui.resolve(e)

    return (
      <Box>
        {below}
        <Button
          key="cave"
          label={buttonLabel(mode)}
          onPress={() => update($, isPickerOpen, open => !open)}
        />
      </Box>
    )
  })
}
