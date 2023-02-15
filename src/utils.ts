export const logger = (message: string) => {
  return {
    error() {
      console.error(
        `%cdenoh%c :: %c${message}`,
        'background-color: red; color: black; font-weight: bold',
        'color: grey',
        'color: initial',
      );
    },
    warn() {
      console.warn(
        `%cdenoh%c :: %c${message}`,
        'background-color: orange; color: black; font-weight: bold',
        'color: grey',
        'color: initial',
      );
    },
    info() {
      console.info(
        `%cdenoh%c :: %c${message}`,
        'background-color: green; color: black; font-weight: bold',
        'color: grey',
        'color: initial',
      );
    },
  };
}
