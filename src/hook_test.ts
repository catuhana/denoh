import { assertEquals, assertExists } from 'jsr:@std/assert';

import type { GitHooks } from './types.ts';

Deno.test('Create Git Hook Scripts', async () => {
  const { generateGitHookScript } = await import('./hook.ts');

  assertEquals(generateGitHookScript(['lint']), '#!/bin/sh\ndeno task lint');
  assertEquals(
    generateGitHookScript(['test && fmt']),
    '#!/bin/sh\ndeno task test && deno task fmt',
  );
  assertEquals(
    generateGitHookScript(['fmt || lint ; test']),
    '#!/bin/sh\ndeno task fmt || deno task lint ; deno task test',
  );
  assertEquals(
    generateGitHookScript(['$git rev-parse HEAD >rev', 'doSomethingWithRev']),
    '#!/bin/sh\ngit rev-parse HEAD >rev\ndeno task doSomethingWithRev',
  );
  assertEquals(
    generateGitHookScript([
      '$echo "Changed branch, clearing cache..."',
      'clearCache',
      '$echo "Cache cleared successfully."',
    ]),
    '#!/bin/sh\necho "Changed branch, clearing cache..."\ndeno task clearCache\necho "Cache cleared successfully."',
  );
});

Deno.test('Read Config', async () => {
  const { readConfig } = await import('./hook.ts');

  assertExists(await readConfig());
});

Deno.test('Create Hooks', async () => {
  const { createHooks, generateGitHookScript } = await import('./hook.ts');

  const validGitHook = {
    'post-commit': ['$echo "Running post-commit hooks..."', 'runStuff'],
  } as Record<GitHooks, string[]>;
  const invalidGitHookName = { 'meow': ['meow', ':3'] };
  const invalidGitHookValue = { 'commit-msg': [6, 9] };
  const invalidGitHookValueString = { 'post-checkout': 'meow' };

  assertEquals(createHooks(validGitHook), [{
    'name': 'post-commit',
    script: generateGitHookScript(validGitHook['post-commit']),
  }]);
  // @ts-expect-error These will have type errors.
  assertEquals(createHooks(invalidGitHookName), []);
  // @ts-expect-error These will have type errors.
  assertEquals(createHooks(invalidGitHookValue), []);
  // @ts-expect-error These will have type errors.
  assertEquals(createHooks(invalidGitHookValueString), []);
});
