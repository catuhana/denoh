import { HOOKS } from './constants.ts';

export type GitHooks = typeof HOOKS[number];

export interface DenoConfig {
  githooks: Record<GitHooks, string[]>;
}

export interface CreatedHookObject {
  gitHookName: string;
  gitHookScript: string;
}
