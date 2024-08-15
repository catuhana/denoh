#!/usr/bin/env -S deno run --allow-write

import { HOOKS } from '../src/constants.ts';

import type { GitHooks } from '../src/types.ts';

let SCHEMA_FILE_RAW_URL =
  'https://github.com/denoland/deno/raw/{DENO_VERSION}/cli/schemas/config-file.v1.json';

const denoVersionInput = Deno.args[0];
if (denoVersionInput) {
  SCHEMA_FILE_RAW_URL = SCHEMA_FILE_RAW_URL.replace(
    '{DENO_VERSION}',
    denoVersionInput,
  );

  const response = await fetch(SCHEMA_FILE_RAW_URL);
  if (!response.ok) {
    console.error(
      `Could not fetch the schema file. Possibly wrong version (${denoVersionInput}) entered.`,
    );
    Deno.exit(1);
  }
} else {
  const response = await fetch(
    'https://api.github.com/repos/denoland/deno/releases/latest',
  );

  if (!response.ok) {
    console.error('Could not fetch the latest version of Deno.');
    Deno.exit(1);
  }

  const latest_version = (await response.json()).tag_name;
  SCHEMA_FILE_RAW_URL = SCHEMA_FILE_RAW_URL.replace(
    '{DENO_VERSION}',
    latest_version,
  );
}

const schema = {
  $id: 'https://deno.land/x/denoh/schema.json',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'JSON schema for denoh.',
  description:
    'Extended Deno JSON schema for denoh to add automatic completion and error handling for hooks.',
  type: 'object',
  allOf: [
    {
      $ref: SCHEMA_FILE_RAW_URL,
    },
  ],
  properties: {
    githooks: { '$ref': '#/$defs/githooksProperties' },
  },
  $defs: {
    githooksProperties: {
      title:
        'Git hooks object. Check https://git-scm.com/docs/githooks for information about Git hooks.',
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(
        HOOKS.map((
          hook,
        ) => [hook, {
          $ref: '#/$defs/hookProperties',
          description: `https://git-scm.com/docs/githooks#_${
            hook.replaceAll('-', '_')
          }`,
        }]),
      ) as Record<
        GitHooks,
        { $ref: '#/$defs/hookProperties'; description: string }
      >,
    },
    hookProperties: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['githooks'],
};

await Deno.writeTextFile('schema.json', JSON.stringify(schema, null, 2));

console.info('%cCreated JSON schema.', 'color: green');
