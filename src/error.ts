import { ExitCodes } from './enums.ts';
import { error } from './logger.ts';

export class DenohError extends Error {
  constructor(message: string, public exitCode?: ExitCodes) {
    super(message);

    this.name = 'DenohError';
  }

  logAndExit() {
    error(this.message);
    return Deno.exit(this.exitCode ?? 1);
  }
}
