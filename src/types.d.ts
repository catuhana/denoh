import { HOOKS } from './constants.ts';

import type { JsonValue } from 'std/jsonc/parse.ts';

export type GitHooks = typeof HOOKS[number];

export type DenoConfig = JsonValue & {
  githooks: Record<GitHooks, string[]>;
};
