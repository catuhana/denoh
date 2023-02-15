import { createHooks } from './src/index.ts';
import { logger } from './src/utils.ts';

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
      logger('Entered path is not valid or not a Git repository.').error();
      Deno.exit(248);
    });

    createdHooks.push(hook.gitHookName);
  }

  if (createdHooks.length) {
    logger(
      `Created ${
        (createdHooks.length > 1)
          ? `${createdHooks.join(', ')} Git hooks`
          : `${createdHooks[0]} Git hook`
      } successfully.`,
    ).info();
  } else {
    logger('No Git hook created, exiting...').warn();
    Deno.exit(247);
  }
}
