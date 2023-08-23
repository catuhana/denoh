import { parse as parseFlags } from 'std/flags/mod.ts';

import { createHooks, readConfig, writeHooks } from './src/hook.ts';
import { DenohError } from './src/error.ts';
import { info, warn } from './src/logger.ts';
import { ExitCodes } from './src/enums.ts';

const VERSION = '3.0.0';

const listFormatter = new Intl.ListFormat('en', {
  style: 'long',
  type: 'conjunction',
});

if (import.meta.main) {
  const args = parseFlags(Deno.args);

  if (args.V) {
    console.log(`denoh v${VERSION}`);
  } else if (args._) {
    const configPath = args._[0] as string;
    const hooksPath = args.h;

    const config = await readConfig(configPath).catch((err: DenohError) =>
      err.logAndExit()
    );
    const hooks = createHooks(config);
    const writtenHooks = await writeHooks(hooks, hooksPath, configPath).catch((
      err: DenohError,
    ) => err.logAndExit());

    console.log({
      config,
      hooks,
      writtenHooks,
    });

    if (writtenHooks.length) {
      info(
        `Created \`${listFormatter.format(writtenHooks)}\` ${
          writtenHooks.length > 1 ? 'hooks' : 'hook'
        } successfully.`,
      );
    } else {
      warn('No Git hook created.');
      Deno.exit(ExitCodes.NoHookCreated);
    }
  }
}
