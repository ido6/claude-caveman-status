import { expect, mock, test } from 'claude-code/testing'

import { buttonLabel, contextFor, modeFromArgs, modeFromPrompt } from '../hooks/register'

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
  expect(modeFromPrompt('Stop caveman.')).toBe('off')
  expect(modeFromPrompt('please use caveman')).toBe('full')
})

test('a prompt that only mentions a phrase does not flip the mode', () => {
  expect(modeFromPrompt('why does caveman mode reset my level?')).toBe(undefined)
  expect(modeFromPrompt('set the app to normal mode after login')).toBe(undefined)
  expect(modeFromPrompt('the button should stop caveman text from wrapping')).toBe(undefined)
})

for (const surface of ['terminal', 'desktop'] as const) {
  test(`a prompt follows a mode another session saved (${surface})`, async ($, on) => {
    mock.store(on, { mode: 'ultra' })
    const sent: { context?: readonly string[] }[] = []
    on('prompt.submit', ($, e) => {
      sent.push(e)
      return { text: e.text } as never
    })
    on('ui.render', ($, e) => {
      const { Box } = $.ui.resolve(e)
      return <Box key="engine" />
    })
    const footer = await $.ui.mount({ plugin: 'caveman-status', surface, component: 'SessionMode', props: { modes: [] } })
    expect((await footer.find({ key: 'cave' }))?.text).toContain('🪨 full')

    await $.prompt.submit({ text: 'hello', wait: false } as never)
    expect(sent[0]?.context?.join(' ')).toContain('level "ultra"')
    expect((await footer.find({ key: 'cave' }))?.text).toContain('🪨 ultra')
  })
}

test('formats the footer button and model context', () => {
  expect(buttonLabel('ultra')).toBe('🪨 ultra')
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

for (const surface of ['terminal', 'desktop'] as const) {
  test(`footer button shows the mode and toggles the picker (${surface})`, async ($, on) => {
    mock.store(on)
    on('ui.render', ($, e) => {
      const { Box } = $.ui.resolve(e)
      return <Box key="engine" />
    })
    const footer = await $.ui.mount({ plugin: 'caveman-status', surface, component: 'SessionMode', props: { modes: ['focus'] } })
    const band = await $.ui.mount({ plugin: 'caveman-status', surface, component: 'AbovePrompt', props: BAND })

    await $.command.run({ command: 'cave', args: 'lite' } as never)
    expect((await footer.find({ key: 'cave' }))?.text).toContain('🪨 lite')

    await footer.press({ key: 'cave' })
    expect(await band.find({ key: 'ultra' })).toBeDefined()

    await band.press({ key: 'off' })
    expect((await footer.find({ key: 'cave' }))?.text).toContain('🪨 off')
    expect(await band.find({ key: 'ultra' })).toBe(undefined)
  })
}
