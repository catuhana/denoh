import { assertSnapshot } from 'https://deno.land/std@0.177.0/testing/snapshot.ts';

Deno.test('createGitHookScript() tests', async (t) => {
  const createGitHookScript =
    (await import('../src/index.ts')).createGitHookScript;

  await assertSnapshot(t, createGitHookScript(['lint']));
  await assertSnapshot(
    t,
    createGitHookScript([
      '!echo \'Changed branch, running lint tasks...\'',
      'lint ; lint:fmt',
      '!echo \'Tasks ran successfully.\'',
    ]),
  );
  await assertSnapshot(t, createGitHookScript(['lint ; fmt && test ; notify']));
  await assertSnapshot(t, createGitHookScript(['test1 && test2 && test3']));
});

Deno.test('getGitHooks() tests', async (t) => {
  const getGitHooks = (await import('../src/index.ts')).getGitHooks;

  assertSnapshot(t, (await getGitHooks('tests/deno.test.jsonc')).githooks);
});

Deno.test('createHooks() tests', async (t) => {
  const createHooks = (await import('../src/index.ts')).createHooks;

  assertSnapshot(t, (await createHooks('tests/deno.test.jsonc')).createdHooks);
});
