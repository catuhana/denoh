import { createHooks } from './src/index.ts';
import { log } from './src/utils.ts';

if (import.meta.main) {
  const hooks = await createHooks(Deno.args[0]);

  const createdHooks: string[] = [];
  for (const hook of hooks.createdHooks) {
    await Deno.writeTextFile(
      `${hooks.hooksPath}/.git/hooks/${hook.gitHookName}`,
      hook.gitHookScript,
      {
        mode: 0o755,
      },
    ).catch(() => {
      log('Entered path is not valid or not a Git repository.').error();
      Deno.exit(248);
    });

    createdHooks.push(hook.gitHookName);
  }

  if (createdHooks.length) {
    log(
      `Created ${
        (createdHooks.length > 1)
          ? `${createdHooks.join(', ')} Git hooks`
          : `${createdHooks[0]} Git hook`
      } successfully.`,
    ).info();
  } else {
    log('No Git hook created, exiting...').warn();
    Deno.exit(247);
  }
}
