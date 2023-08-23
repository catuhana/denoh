import { parse as parseJsonc } from 'std/jsonc/parse.ts';

import { ExitCodes, Operators } from './enums.ts';
import { error, warn } from './logger.ts';
import { DenohError } from './error.ts';

import { HOOKS } from './constants.ts';
import { DenoConfig, GitHooks } from './types.d.ts';

const operatorsRegex = new RegExp(
  `^(${Object.values(Operators).join('|')})$`,
);

export const createHooks = (
  gitHooks: Awaited<ReturnType<typeof readConfig>>['gitHooks'],
) => {
  const createdHooks: {
    name: string;
    script: string;
  }[] = [];

  for (
    const [gitHookName, gitHookCommands] of Object.entries(
      gitHooks,
    ) as [GitHooks, string[]][]
  ) {
    if (!HOOKS.includes(gitHookName)) {
      warn(`\`${gitHookName}\` Git hook does not exist. Skipping...`);
      continue;
    } else if (!Array.isArray(gitHookCommands)) {
      warn(`\`${gitHookName}\` Git hook's value is not an array. Skipping...`);
      continue;
    } else if (
      !gitHookCommands.every((command) => typeof command === 'string')
    ) {
      warn(
        `\`${gitHookName}\` Git hook's value should be an array of strings. Skipping...`,
      );
      continue;
    }

    createdHooks.push({
      name: gitHookName,
      script: generateGitHookScript(gitHookCommands),
    });
  }

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
      `${configPath}/${hooksPath}/${hook.name}`,
      hook.script,
      {
        mode: 0o755,
      },
    ).catch((err) => {
      throw new DenohError(
        `An error ocurred when creating ${hook.name} hook: ${err.message}`,
        ExitCodes.UnknownError,
      );
    });

    createdGitHooks.push(hook.name);
  }

  return createdGitHooks;
};

export const generateGitHookScript = (commands: string[]) => {
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
};

export const readConfig = async (configPath = '.') => {
  const fileExtensions = ['json', 'jsonc'];

  let configFile = '';
  let parsedConfigFile: DenoConfig;

  try {
    const fileInfo = await Deno.stat(configPath);

    if (fileInfo.isDirectory) {
      for await (const file of Deno.readDir(configPath)) {
        if (fileExtensions.some((ext) => file.name === `deno.${ext}`)) {
          configFile = await Deno.readTextFile(`${configPath}/${file.name}`);
          break;
        }
      }

      if (!configFile.length) {
        throw new DenohError(
          `Deno configuration file not found in \`${configPath}\` folder.`,
        );
      }
    } else {
      if (!fileExtensions.some((ext) => configPath.endsWith(`.${ext}`))) {
        throw new DenohError(
          'Entered file is not a Deno configuration file.',
          ExitCodes.NotAConfigFile,
        );
      }

      configFile = await Deno.readTextFile(configPath);
    }

    try {
      parsedConfigFile = parseJsonc(configFile) as DenoConfig;
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

    return { gitHooks: parsedConfigFile.githooks };
  } catch {
    throw new DenohError('Could not found specified file or folder.');
  }
};
