import { HOOKS } from "./constants.ts";

type GitHooks = typeof HOOKS[number];

interface DenoConfig {
  githooks: Record<GitHooks, string[]>;
}
