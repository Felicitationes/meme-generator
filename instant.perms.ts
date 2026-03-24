import type { InstantRules } from '@instantdb/core';

const rules: InstantRules = {
  memes: {
    allow: {
      view: 'true',
      create: 'auth.id != null',
      update: 'auth.id != null && auth.id in data.ref("author.$user.id")',
      delete: 'auth.id != null && auth.id in data.ref("author.$user.id")',
    },
  },
  votes: {
    allow: {
      view: 'true',
      create: 'auth.id != null',
      delete: 'auth.id != null && auth.id in data.ref("$user.id")',
    },
  },
  $files: {
    allow: {
      view: 'true',
      create: 'auth.id != null',
      update: 'auth.id != null',
    },
  },
  profiles: {
    allow: {
      view: 'true',
      create: 'auth.id != null',
      update: 'auth.id != null && auth.id in data.ref("$user.id")',
    },
  },
};

export default rules;
