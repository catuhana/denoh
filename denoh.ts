import {
  JSONValue,
  parse as parseJSONC,
} from 'https://deno.land/std@0.171.0/encoding/jsonc.ts';
import {
  parse as parsePath,
  resolve as resolvePath,
} from 'https://deno.land/std@0.171.0/path/mod.ts';

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
        'color: initial',
      );
    },
    warn() {
      console.warn(
        `%cdenoh%c :: %c${message}`,
        'background-color: orange; color: black; font-weight: bold',
        'color: grey',
        'color: initial',
      );
    },
    info() {
      console.log(
        `%cdenoh%c :: %c${message}`,
        'background-color: green; color: black; font-weight: bold',
        'color: grey',
        'color: initial',
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
      log(`Could not parse Deno configuration\n    > ${err.message}`).error();
      exitCode = 244;
    } else {
      log(`Unknown error: ${err.message}`).error();
      exitCode = 255;
    }

    Deno.exit(exitCode);
  }
};

const createGitHookScript = (commands: string[]) => {
  const script = ['#!/bin/sh'];

  for (const command of commands) {
    if (command.startsWith('!')) {
      script.push(command.slice(1));
    } else {
      command.split('|').forEach((command) =>
        script.push(`deno task ${command.trim()}`)
      );
    }
  }

  return script.join('\n');
};

const setHooks = async (configPath = '.') => {
  const { githooks, configPath: path } = await getGithooks(configPath);

  if (!githooks) {
    log('Deno config file does not have `githooks` field.').error();
    Deno.exit(245);
  } else if (typeof githooks !== 'object' || Array.isArray(githooks)) {
    log('`githooks` field must be an Object.').error();
    Deno.exit(246);
  }

  const createdHooks: string[] = [];
  for (const gitHookName of (Object.keys(githooks) as GitHooks[])) {
    if (!hooks.includes(gitHookName)) {
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
    } else if (!gitHookCommands.length) {
      log(
        `\`${gitHookName}\` Git hook value does not include any command, skipping...`,
      ).warn();
      continue;
    }

    const createdGitHookPath = `${path}/.git/hooks/${gitHookName}`;
    const createdGitHookScript = createGitHookScript(gitHookCommands);

    try {
      await Deno.writeTextFile(createdGitHookPath, createdGitHookScript, {
        mode: 0o755,
      });
    } catch {
      log('Entered path is not a Git repository.').error();
      Deno.exit(248);
    }

    createdHooks.push(gitHookName);
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
};

if (import.meta.main) {
  await setHooks(Deno.args?.[0]);
}
