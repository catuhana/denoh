import { parse as parseJSONC } from 'https://deno.land/std@0.164.0/encoding/jsonc.ts';

const hooks = [
  'applypatch-msg',
  'pre-applypatch',
  'post-applypatch',
  'pre-commit',
  'pre-merge-commit',
  'prepare-commit-msg',
  'commit-msg',
  'post-commit',
  'pre-rebase',
  'post-checkout',
  'post-merge',
  'pre-push',
  'pre-receive',
  'update',
  'proc-receive',
  'post-receive',
  'post-update',
  'reference-transaction',
] as const;
type GitHooks = typeof hooks[number];

interface DenoConfig {
  githooks: Record<GitHooks, string[]>;
}

const log = (message: string) => {
  return {
    error() {
      console.error(
        `%cdenoh%c :: %c${message}`,
        'background-color: red; color: black; font-weight: bold',
        'color: grey',
        'color: white',
      );
    },
    warn() {
      console.log(
        `%cdenoh%c :: %c${message}`,
        'background-color: orange; color: black; font-weight: bold',
        'color: grey',
        'color: white',
      );
    },
    info() {
      console.log(
        `%cdenoh%c :: %c${message}`,
        'background-color: green; color: black; font-weight: bold',
        'color: grey',
        'color: white',
      );
    },
  };
};

const getGithooks = async (configPath: string) => {
  let configFile;
  try {
    const isDirectory = (await Deno.lstat(configPath)).isDirectory;
    if (!isDirectory) {
      configFile = await Deno.readTextFile(configPath);
    } else {
      for await (const file of Deno.readDir(configPath)) {
        if (['deno.json', 'deno.jsonc'].includes(file.name)) {
          configFile = await Deno.readTextFile(file.name);
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
      // deno-lint-ignore no-explicit-any
      githooks: (parseJSONC(configFile) as any as DenoConfig)?.githooks,
      configPath,
    };
  } catch (err) {
    let exitCode;

    if (err.name === 'NotFound') {
      log('Entered file does not exists.').error();
      exitCode = 243;
    } else if (err.name === 'SyntaxError') {
      log(`Couldn't parse Deno configuration\n    > ${err.message}`).error();
      exitCode = 244;
    } else {
      log(`Unknown error: ${err.message}`);
      exitCode = 255;
    }

    Deno.exit(exitCode);
  }
};

const setHooks = async (configPath = '.') => {
  const { githooks, configPath: path } = await getGithooks(configPath);

  if (!githooks) {
    log('Deno config file doesn\'t have `githooks` field.').error();
    Deno.exit(245);
  } else {
    const createdHooks: string[] = [];
    for (const githookName of Object.keys(githooks)) {
      if (!(hooks as readonly string[]).includes(githookName)) {
        log(`\`${githookName}\` is not a valid git hook, skipping...`).warn();
        continue;
      }

      const githookCommands = githooks[githookName as GitHooks];
      if (!Array.isArray(githookCommands)) {
        log(
          `\`${githookName}\` githook value must be in array format, skipping...`,
        ).warn();
        continue;
      } else if (githookCommands.length) {
        log(
          `\`${githookName}\` githook value does not include any command, skipping...`,
        ).warn();
        continue;
      }

      const createdGithookPath = `${path}/.git/hooks/${githookName}`;
      const createdGithookScript = [
        '#!/bin/sh',
        ...githookCommands.map((commandOrTask) =>
          commandOrTask.startsWith('!')
            ? commandOrTask.slice(1)
            : `deno task ${commandOrTask}`
        ),
      ].join('\n');

      await Deno.writeTextFile(createdGithookPath, createdGithookScript, {
        mode: 0o755,
      });

      createdHooks.push(githookName);
    }

    log(
      `Created ${
        (createdHooks.length > 1)
          ? `${createdHooks.join(', ')} hooks`
          : `${createdHooks[0]} hook`
      } successfully.`,
    ).info();
  }
};

if (import.meta.main) {
  await setHooks(Deno.args?.[0]);
}
