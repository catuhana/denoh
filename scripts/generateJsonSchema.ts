#!/usr/bin/env -S deno run --allow-write

import { HOOKS } from '../src/constants.ts';

import type { GitHooks } from '../src/types.ts';

const schema = {
  $id: 'https://deno.land/x/denoh/schema.json',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'JSON schema for denoh.',
  description:
    'Extended Deno JSON schema for denoh to add automatic completion and error handling for hooks.',
  type: 'object',
  allOf: [
    {
      $ref:
        // TODO: Maybe create a CI action to update this automatically?
        'https://github.com/denoland/deno/raw/v1.45.5/cli/schemas/config-file.v1.json',
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
