import { type JSONValue, parse as parseJSONC } from 'std:encoding/jsonc';
import { parse as parsePath, resolve as resolvePath } from 'std:path';

import { HOOKS, Operators } from './constants.ts';
import { logger } from './utils.ts';

import type { CreatedHookObject, DenoConfig, GitHooks } from './types.d.ts';

export const createHooks = async (configPath = '.') => {
  const { githooks, configPath: path } = await getGitHooks(configPath);

  if (!githooks) {
    logger('Deno config file does not have `githooks` field.').error();
    Deno.exit(245);
  } else if (typeof githooks !== 'object' || Array.isArray(githooks)) {
    logger('`githooks` field must be an Object.').error();
    Deno.exit(246);
  }

  const createdHooks: CreatedHookObject[] = [];
  for (const gitHookName of (Object.keys(githooks) as GitHooks[])) {
    if (!HOOKS.includes(gitHookName)) {
      logger(`\`${gitHookName}\` is not a valid Git hook, skipping...`).warn();
      continue;
    }

    const gitHookCommands = githooks[gitHookName];
    if (
      !Array.isArray(gitHookCommands) ||
      gitHookCommands.every((c) => typeof c !== 'string')
    ) {
      logger(
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
        logger(
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
      logger('Entered file does not exists.').error();
      exitCode = 243;
    } else if (err.name === 'SyntaxError') {
      logger(`Could not parse Deno configuration\n    > ${err.message}`)
        .error();
      exitCode = 244;
    } else {
      logger(`Unknown error: ${err.message}`).error();
      exitCode = 255;
    }

    Deno.exit(exitCode);
  }
};

export const createGitHookScript = (commands: string[]) => {
  const script = ['#!/bin/sh'];

  for (const command of commands) {
    if (command.startsWith('!')) {
      script.push(command.slice(1));
    } else {
      const block = command.split(' ').map((w) => {
        switch (w) {
          case Operators.AND:
          case Operators.OR:
          case Operators.SEPARATOR:
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
