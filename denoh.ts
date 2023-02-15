import { setHooks } from './src/index.ts';

if (import.meta.main) {
  await setHooks(Deno.args[0]);
}
