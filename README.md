# Denoh

A script for generating Git hooks by extending Deno's configuration file.

## Installation or Running

You can install denoh globally by running `deno install https://deno.land/x/denoh/denoh.ts` command, or run by running `deno run https://deno.land/x/denoh/denoh.ts`.

> **Note**: To run/install a specific version, you can add version specifier after `/x/denoh/` part of URL with any valid tag. If you want to use version 1.0.0 for example, replace mentioned part with `/x/denoh@v1.0.0/`.

> **Note**: Older versions of denoh can be found at its GitHub repository, and can be run/installed like above with only changing the URL to a raw source file.

## Usage

Since Git hooks are set by extending Deno's configuration file, we need to create a Deno config file (Deno.json{,c}) if it does not exist. Denoh looks for `githooks` key of the configuration file, so to create a Git hook, pass any valid Git hook name to `githooks` object, and pass your script/task commands inside an array of strings. Let's say our Deno configuration file is this example below:

For auto completion in `githooks` field in Deno configuration file, [schema.json](schema.json) JSON schema file can be used, [as can be seen here](deno.json#L2). Denoh JSON schema extends Deno's latest JSON schema, so it's safe to use Denoh's schema, even after Deno changes theirs.

```jsonc
{
  "tasks": {
    "lint": "deno lint",
    "lint:fmt": "deno fmt --check"
  },
  // All hook values must be array of strings.
  "githooks": {
    // You can pass a Deno task by writing the exact name of it:
    "pre-commit": ["lint"],
    // Or you can pass any shell command with an exclamation point (!) at the beginning of the string:
    "post-commit": ["!echo 'Added commit'"],
    // And you can mix them together:
    "post-checkout": [
      "!echo 'Changed branch, running lint tasks...'",
      "lint ; lint:fmt", // denoh supports logical AND, OR and command separators
      "!echo 'Tasks ran successfully.'"
    ]
  }
}
```

To generate Git hooks, run `denoh`. This will create `pre-commit`, `post-commit` and `post-checkout` hooks in the current folder with the following contents:

```sh
## file -> .git/hooks/pre-commit

#!/bin/sh
deno task lint

## file -> .git/hooks/post-commit

#!/bin/sh
echo 'Added commit'

## file -> .git/hooks/post-checkout

#!/bin/sh
echo 'Changed branch, running lint tasks...'
deno task lint ; deno task lint:fmt
echo 'Tasks ran successfully.'
```

For help and information about flags, please refer to [src/constants.ts](src/constants.ts#L36-L54), or run `denoh -h`.

### Running at different folder or configuration files

You can pass folder name or configuration file name by passing its path as an argument. If the entered path is different, it will create Git hooks in the entered folder.

```sh
❯ denoh ../my-beautiful-project
❯ denoh deno.dev.jsonc -g dev-hooks/
```

## Exit Codes

| 0                           | 1                          | 243                              | 244                                 | 245                                                | 246                                | 247                  | 248                                                                                                      | 249                                | 255                        |
| --------------------------- | -------------------------- | -------------------------------- | ----------------------------------- | -------------------------------------------------- | ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------- |
| Hooks created successfully. | An unknown error occurred. | Configuration file is not found. | Could not parse configuration file. | `githooks` field is missing in configuration file. | `githooks` field is not an Object. | No Git hook created. | Current folder is not a Git repository. (To specify a folder to create hooks in, `-g` flag can be used.) | Entered file is not a config file. | An unknown error occurred. |
