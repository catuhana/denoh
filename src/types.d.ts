import { HOOKS } from './constants.ts';

import type { JsonValue } from 'https://deno.land/std@0.210.0/jsonc/parse.ts';

/**
 * Git hooks as an union type.
 */
export type GitHooks = typeof HOOKS[number];

/**
 * A JSON value, with `githooks` field included.
 */
export type DenoConfig = JsonValue & {
  githooks: Record<GitHooks, string[]>;
};
