/**
 * Log levels enum with their background colurs.
 */
const LogLevels = {
  error: 'red',
  warn: 'orange',
  info: 'green',
} as const;

/**
 * Logs to console as an error to stderr, with red background.
 */
export const error = (...data: unknown[]) => {
  logMessage('error', ...data);
};

/**
 * Logs to console as a warning, with orange background.
 */
export const warn = (...data: unknown[]) => {
  logMessage('warn', ...data);
};

/**
 * Logs to console as an information, with green background.
 */
export const info = (...data: unknown[]) => {
  logMessage('info', ...data);
};

/**
 * A private function for styling the output and handling logging.
 * @param level {@link LogLevels}
 */
function logMessage(level: keyof typeof LogLevels, ...data: unknown[]) {
  console[level](
    `%cdenoh%c ::%c`,
    `background-color: ${LogLevels[level]}; font-weight: bold`,
    'color: grey',
    'color: initial',
    ...data,
  );
}
