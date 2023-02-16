# Denoh

A script for generating Git hooks by extending Deno's configuration file.

## Differences from [deno-githooks](https://github.com/deco-cx/deno-githooks)

- Support for JSONC configurations
- Support for shell commands
- Beautiful log messages
- Custom exit codes for scripting
- Check if hook is valid
- Support for running in another folder or entering custom Deno configuration file
- Support for logical AND (&&) and OR (||) operators.

## Installation or Running

You can install this script globally by running `deno install https://github.com/tuhanayim/denoh/raw/main/denoh.ts` command, or run without installing by running `deno run https://github.com/tuhanayim/denoh/raw/main/denoh.ts`

> **Note:** To run a specific version, replace `/raw/*main*/` part on URL with any valid tag. If you want to use version 1.0.0 for example, replace mentioned part with `/raw/v1.0.0/`.

## Usage

Since Git hooks are set by extending Deno's configuration file, we need to create a Deno config file (Deno.{json,jsonc}) if not exists. Denoh looks for `githooks` key of configuration file, so to create a Git hook, pass any valid Git hook name to `githooks` object, and pass your script/task commands inside of an array of strings. Let's say our Deno configuration file is this example below:

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

To generate Git hooks, run `denoh`. This will create `pre-commit`, `post-commit` and `post-checkout` hooks with the following contents:

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

### Running for different folder or configuration files

You can pass folder name or configuration file name by passing its path as an argument. If entered path is different, it will create Git hooks in passed folder.

```sh
❯ denoh ../my-beautiful-project
❯ denoh deno.dev.jsonc
```

## Exit Codes

| 0                        | 243                              | 244                                 | 245                                                | 246                                                      | 247              | 248                                   | 255            |
| ------------------------ | -------------------------------- | ----------------------------------- | -------------------------------------------------- | -------------------------------------------------------- | ---------------- | ------------------------------------- | -------------- |
| Script ran successfully. | Configuration file is not found. | Could not parse configuration file. | Configuration file does not have `githooks` field. | `githooks` value on configuration file is not an Object. | No hook created. | Entered path is not a Git repository. | Unknown error. |
