import { expect, mock, test } from 'claude-code/testing'

import { contextFor, modeFromArgs, modeFromPrompt, statusText } from '../hooks/register'

const BAND = { hasSurvey: false, isWorking: false, maxRows: 5 }

test('reads the level from command args', () => {
  expect(modeFromArgs('')).toBe('full')
  expect(modeFromArgs('ultra')).toBe('ultra')
  expect(modeFromArgs(' Lite ')).toBe('lite')
  expect(modeFromArgs('off')).toBe('off')
  expect(modeFromArgs('banana')).toBe(undefined)
})

test('reads on/off phrases from prompts', () => {
  expect(modeFromPrompt('ok stop caveman please')).toBe('off')
  expect(modeFromPrompt('normal mode')).toBe('off')
  expect(modeFromPrompt('talk like caveman')).toBe('full')
  expect(modeFromPrompt('fix the bug')).toBe(undefined)
})

test('formats the status line and model context', () => {
  expect(statusText('full')).toBe('🪨 full · /cave lite|full|ultra|off')
  expect(statusText('off')).toBe('🪨 off · /cave to enable')
  expect(contextFor('off')).toContain('OFF')
  expect(contextFor('ultra')).toContain('"ultra"')
})

test('/cave with a level sets it; an unknown one is refused', async ($, on) => {
  mock.store(on)
  const run = (args: string) => $.command.run({ command: 'cave', args } as never)

  expect(JSON.stringify(await run('ultra'))).toContain('Caveman: ultra')
  expect(JSON.stringify(await run('banana'))).toContain('Unknown level')
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`/cave alone opens the picker; a press picks and closes it (${surface})`, async ($, on) => {
    mock.store(on)
    on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
      const { Box } = $.ui.resolve(e)
      return <Box key="engine" />
    })
    const ui = await $.ui.mount({ plugin: 'caveman-status', surface, component: 'AbovePrompt', props: BAND })
    expect(await ui.find({ key: 'ultra' })).toBe(undefined)

    expect(JSON.stringify(await $.command.run({ command: 'cave', args: '' } as never))).toContain('Pick')
    expect(await ui.find({ key: 'ultra' })).toBeDefined()

    await ui.press({ key: 'ultra' })
    expect(await ui.find({ key: 'ultra' })).toBe(undefined)

    await $.command.run({ command: 'cave', args: '' } as never)
    expect((await ui.find({ key: 'ultra' }))?.text).toContain('● ultra')

    await ui.press({ key: 'close' })
    expect(await ui.find({ key: 'off' })).toBe(undefined)
  })
}
