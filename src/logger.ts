const LogLevels = {
  error: 'red',
  warn: 'orange',
  info: 'green',
} as const;

export const error = (...data: any[]) => {
  logMessage('error', ...data);
};

export const warn = (...data: any[]) => {
  logMessage('warn', ...data);
};

export const info = (...data: any[]) => {
  logMessage('info', ...data);
};

function logMessage(level: keyof typeof LogLevels, ...data: any[]) {
  console[level](
    `%cdenoh%c ::%c`,
    `background-color: ${LogLevels[level]}; font-weight: bold`,
    'color: grey',
    'color: initial',
    ...data,
  );
}
