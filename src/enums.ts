export enum ExitCodes {
  Success = 0,
  NotFound = 243,
  ParseError,
  NoGitHookFields,
  GitHookFieldsNotObject,
  NoHookCreated,
  NotGitRepository,
  NotAConfigFile,
  UnknownError = 255,
}

/**
 * Operators object for Logical AND, OR and separator.
 */
export enum Operators {
  And = '&&',
  Or = '||',
  Separator = ';',
}
