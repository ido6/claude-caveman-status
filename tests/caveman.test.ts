import { expect, mock, test } from 'claude-code/testing'

import { contextFor, modeFromArgs, modeFromPrompt, nextInCycle, statusText } from '../hooks/register'

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

test('cycles lite -> full -> ultra -> off -> lite', () => {
  expect(nextInCycle('lite')).toBe('full')
  expect(nextInCycle('full')).toBe('ultra')
  expect(nextInCycle('ultra')).toBe('off')
  expect(nextInCycle('off')).toBe('lite')
  expect(nextInCycle('wenyan-full')).toBe('lite')
})

test('formats the status line and model context', () => {
  expect(statusText('full')).toBe('🪨 full · /cave lite|full|ultra|off')
  expect(statusText('off')).toBe('🪨 off · /cave to enable')
  expect(contextFor('off')).toContain('OFF')
  expect(contextFor('ultra')).toContain('"ultra"')
})

test('/cave sets a level, then cycles from the saved one', async ($, on) => {
  mock.store(on)
  const run = (args: string) => $.command.run({ command: 'cave', args } as never)

  expect(JSON.stringify(await run('ultra'))).toContain('Caveman: ultra')
  expect(JSON.stringify(await run(''))).toContain('Caveman off')
  expect(JSON.stringify(await run(''))).toContain('Caveman: lite')
  expect(JSON.stringify(await run('banana'))).toContain('Unknown level')
})
