import { HOOKS } from './constants.ts';

export type GitHooks = typeof HOOKS[number];

export interface DenoConfig {
  githooks: Record<GitHooks, string[]>;
}

export interface CreatedHook {
  hooksPath: string;
  createdHooks: CreatedHookObject[];
}

export interface CreatedHookObject {
  gitHookName: string;
  gitHookScript: string;
}

export interface GitHookObject {
  githooks: DenoConfig['githooks'];
  configPath: string;
}
