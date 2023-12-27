/**
 * All valid Git hooks as a constant array.
 */
export const HOOKS = [
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
  'push-to-checkout',
  'pre-auto-gc',
  'post-rewrite',
  'sendemail-validate',
  'fsmonitor-watchman',
  'p4-changelist',
  'p4-prepare-changelist',
  'p4-post-changelist',
  'p4-pre-submit',
  'post-index-change',
] as const;

/**
 * Denoh version.
 */
export const VERSION = '3.1.0';

/**
 * Help text for denoh CLI.
 */
export const HELP_TEXT = `
denoh - Generate Git hook by extending Deno's Configuration file.

Usage:
  denoh [config file or path, default: ./] [flags]

Flags:
  -h|--help => Shows this message
  -V        => Shows current version of denoh
  -g        => Where to generate Git hooks. [default: <config path>/.git/hooks]

Examples:
  denoh # Creates hooks in the current folder
  denoh .. # Looks for hooks in specified (in this case, previous) folder, creates them there
  denoh deno.jsonc # Scans specified file and creates hooks where the file is
  denoh ../meow -g meow-hooks # Looks for hooks in previous meow folder, creates hooks to current \`meow-hooks\` folder

Source Code:
  https://github.com/catuhana/denoh
`.trimEnd();
