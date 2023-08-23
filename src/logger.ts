const LogLevels = {
  error: 'red',
  warn: 'orange',
  info: 'green',
} as const;

export const error = (...data: unknown[]) => {
  logMessage('error', ...data);
};

export const warn = (...data: unknown[]) => {
  logMessage('warn', ...data);
};

export const info = (...data: unknown[]) => {
  logMessage('info', ...data);
};

function logMessage(level: keyof typeof LogLevels, ...data: unknown[]) {
  console[level](
    `%cdenoh%c ::%c`,
    `background-color: ${LogLevels[level]}; font-weight: bold`,
    'color: grey',
    'color: initial',
    ...data,
  );
}
