import {
  type JSONValue,
  parse as parseJSONC,
} from 'https://deno.land/std@0.180.0/jsonc/parse.ts';
import {
  parse as parsePath,
  resolve as resolvePath,
} from 'https://deno.land/std@0.180.0/path/mod.ts';

import { HOOKS, OPERATORS } from './constants.ts';
import { log } from './utils.ts';

import type { CreatedHookObject, DenoConfig, GitHooks } from './types.d.ts';

/**
 * Generates hooks with their name and script, returns parsed entered `configPath` and created hooks in an Object.
 * @param configPath Deno configuration file path.
 */
export const createHooks = async (configPath = '.') => {
  const { githooks, configPath: path } = await getGitHooks(configPath);

  if (!githooks) {
    log('Deno config file does not have `githooks` field.').error();
    Deno.exit(245);
  } else if (typeof githooks !== 'object' || Array.isArray(githooks)) {
    log('`githooks` field must be an Object.').error();
    Deno.exit(246);
  }

  const createdHooks: CreatedHookObject[] = [];
  for (const gitHookName of (Object.keys(githooks) as GitHooks[])) {
    if (!HOOKS.includes(gitHookName)) {
      log(`\`${gitHookName}\` is not a valid Git hook, skipping...`).warn();
      continue;
    }

    const gitHookCommands = githooks[gitHookName];
    if (
      !Array.isArray(gitHookCommands) ||
      gitHookCommands.every((c) => typeof c !== 'string')
    ) {
      log(
        `\`${gitHookName}\` Git hook value must be an array of strings, skipping...`,
      ).warn();
      continue;
    }

    createdHooks.push({
      gitHookName,
      gitHookScript: createGitHookScript(gitHookCommands),
    });
  }

  return {
    hooksPath: path,
    createdHooks,
  };
};

/**
 * Gets Git hooks and returns `githooks` object and parsed path as an Object.
 * @param configPath {@link createHooks.configPath}
 */
export const getGitHooks = async (configPath: string) => {
  let configFile;
  try {
    const isDirectory = (await Deno.lstat(configPath)).isDirectory;
    if (!isDirectory) {
      configFile = await Deno.readTextFile(configPath);
    } else {
      for await (const file of Deno.readDir(configPath)) {
        if (['deno.json', 'deno.jsonc'].includes(file.name)) {
          configFile = await Deno.readTextFile(`${configPath}/${file.name}`);
          break;
        }
      }

      if (!configFile) {
        log(
          `Deno configuration file (deno.{json,jsonc}) not found in ${configPath} folder.`,
        ).error();
        Deno.exit(243);
      }
    }

    return {
      githooks: (parseJSONC(configFile) as (JSONValue & DenoConfig))?.githooks,
      configPath: resolvePath(
        isDirectory ? configPath : parsePath(configPath).dir,
      ),
    };
  } catch (err) {
    let exitCode;

    if (err.name === 'NotFound') {
      log('Entered file does not exists.').error();
      exitCode = 243;
    } else if (err.name === 'SyntaxError') {
      log(`Could not parse Deno configuration\n    > ${err.message}`)
        .error();
      exitCode = 244;
    } else {
      log(`Unknown error: ${err.message}`).error();
      exitCode = 255;
    }

    Deno.exit(exitCode);
  }
};

/**
 * Creates Git hook scripts from hook's values.
 * @param commands Commands to generate.
 */
export const createGitHookScript = (commands: string[]) => {
  const script = ['#!/bin/sh'];

  for (const command of commands) {
    if (command.startsWith('!')) {
      script.push(command.slice(1));
    } else {
      const block = command.split(' ').map((w) => {
        switch (w) {
          case OPERATORS.AND:
          case OPERATORS.OR:
          case OPERATORS.SEPARATOR:
            return w;
          default:
            return `deno task ${w}`;
        }
      });

      script.push(block.join(' '));
    }
  }

  return script.join('\n');
};
