import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      nickname: i.string().optional(),
    }),
    memes: i.entity({
      imageUrl: i.string().optional(),
      topText: i.string().optional(),
      bottomText: i.string().optional(),
      createdAt: i.number().indexed(),
    }),
    votes: i.entity({}),
  },
  links: {
    profileUser: {
      forward: { on: 'profiles', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
    memeAuthor: {
      forward: { on: 'memes', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'memes' },
    },
    memeVotes: {
      forward: { on: 'memes', has: 'many', label: 'votes' },
      reverse: { on: 'votes', has: 'one', label: 'meme' },
    },
    voteUser: {
      forward: { on: 'votes', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'many', label: 'votes' },
    },
    memeImage: {
      forward: { on: 'memes', has: 'one', label: '$file' },
      reverse: { on: '$files', has: 'one', label: 'meme' },
    },
  },
  rooms: {},
});

const schema = _schema;
export default schema;
