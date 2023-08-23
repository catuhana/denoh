import { parse as parseJsonc } from 'std/jsonc/parse.ts';

import { ExitCodes, Operators } from './enums.ts';
import { error } from './logger.ts';
import { DenohError } from './error.ts';

import { HOOKS } from './constants.ts';
import { DenoConfig, GitHooks } from './types.d.ts';

const operatorsRegex = new RegExp(
  `^(${Object.values(Operators).join('|')})$`,
);

export const createHooks = (
  config: Awaited<ReturnType<typeof readConfig>>,
) => {
  const createdHooks = Object.entries(config.githooks)
    .filter(
      ([gitHookName, gitHookCommands]) =>
        HOOKS.includes(gitHookName as GitHooks) &&
        Array.isArray(gitHookCommands) &&
        gitHookCommands.every((c) => typeof c === 'string'),
    )
    .map(([gitHookName, gitHookCommands]) => ({
      gitHookName,
      gitHookScript: generateGitHookScript(gitHookCommands),
    }));

  return createdHooks ?? null;
};

export const writeHooks = async (
  hooks: ReturnType<typeof createHooks>,
  hooksPath = '.git/hooks',
  configPath = '.',
) => {
  const createdGitHooks = [];

  for (const hook of hooks) {
    await Deno.writeTextFile(
      `${configPath}/${hooksPath}/${hook.gitHookName}`,
      hook.gitHookScript,
      {
        mode: 0o755,
      },
    ).catch((err) =>
      error(
        `An error ocurred when creating ${hook.gitHookName} hook: ${err.message}`,
      )
    );

    createdGitHooks.push(hook.gitHookName);
  }

  return createdGitHooks;
};

function generateGitHookScript(commands: string[]) {
  const script = ['#!/bin/sh'];

  for (const command of commands) {
    if (command.startsWith('!')) {
      script.push(command.slice(1));
    } else {
      const block = command.split(' ').map((w) =>
        operatorsRegex.test(w) ? w : `deno task ${w}`
      );

      script.push(block.join(' '));
    }
  }

  return script.join('\n');
}

export const readConfig = async (configPath = '.') => {
  const fileExtensions = ['json', 'jsonc'];

  let configFile: string;
  let parsedConfigFile: DenoConfig;

  try {
    const fileInfo = await Deno.stat(configPath);

    if (fileInfo.isDirectory) {
      for await (const file of Deno.readDir(configPath)) {
        if (fileExtensions.some((ext) => file.name === `deno.${ext}`)) {
          configFile = await Deno.readTextFile(
            `${configPath}/${file.name}`,
          );
        }
      }
    } else {
      if (!fileExtensions.some((ext) => configPath === `deno.${ext}`)) {
        throw new DenohError(
          'Entered file is not a Deno configuration file.',
          ExitCodes.NotAConfigFile,
        );
      }

      configFile = await Deno.readTextFile(configPath);
    }

    try {
      parsedConfigFile = parseJsonc(configFile!) as DenoConfig;
    } catch (err) {
      throw new DenohError(
        `Could not parse Deno configuration file: ${err.message}`,
        ExitCodes.ParseError,
      );
    }

    if (!parsedConfigFile.githooks) {
      throw new DenohError(
        'Deno config file does not have the `githooks` field.',
        ExitCodes.NoGitHookFields,
      );
    } else if (
      typeof parsedConfigFile.githooks !== 'object' ||
      Array.isArray(parsedConfigFile.githooks)
    ) {
      throw new DenohError(
        '`githooks` field must be an Object.',
        ExitCodes.GitHookFieldsNotObject,
      );
    }

    return {
      githooks: parsedConfigFile.githooks,
    };
  } catch (err) {
    throw err;
  }
};
