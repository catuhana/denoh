import { parse as parseFlags } from 'https://deno.land/std@0.199.0/flags/mod.ts';

import { createHooks, readConfig, writeHooks } from './src/hook.ts';
import { DenohError } from './src/error.ts';
import { info, warn } from './src/logger.ts';
import { ExitCodes } from './src/enums.ts';
import { HELP_TEXT, VERSION } from './src/constants.ts';

const listFormatter = new Intl.ListFormat('en', {
  style: 'long',
  type: 'conjunction',
});

if (import.meta.main) {
  const args = parseFlags(Deno.args, { alias: { h: ['help'] }, string: ['g'] });

  if (args.V) {
    console.log(`denoh v${VERSION}`);
  } else if (args.h) {
    console.log(HELP_TEXT);
  } else if (args._) {
    const configPath = args._[0] as string;
    const hooksPath = args.g;

    const { gitHooks } = await readConfig(configPath).catch((err: DenohError) =>
      err.logAndExit()
    );
    const hooks = createHooks(gitHooks);
    const writtenHooks = await writeHooks(hooks, hooksPath, configPath).catch((
      err: DenohError,
    ) => err.logAndExit());

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
