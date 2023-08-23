import { error } from './logger.ts';
import { ExitCodes } from './enums.ts';

/**
 * Custom error class for creating errors
 * and logging and exiting with {@link DenohError.logAndExit} function.
 */
export class DenohError extends Error {
  constructor(message: string, public exitCode?: ExitCodes) {
    super(message);

    this.name = 'DenohError';
  }

  /**
   * Logs the error to the console and exists with
   * specified exit code.
   */
  logAndExit() {
    error(this.message);
    return Deno.exit(this.exitCode ?? ExitCodes.UnknownError);
  }
}
