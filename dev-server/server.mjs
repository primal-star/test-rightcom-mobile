#!/usr/bin/env node
// Blog dev backend for the React / React Native tests. Single file, Node 20.19+.
//
//   npm install && npm start
//
// Server: http://localhost:1337/parse · App ID: blog-app · no JS key needed
// Env: PORT (1337) · DATABASE_URI (default: in-memory MongoDB, reset on restart) · PARSE_MASTER_KEY (default: random) · LOG_LEVEL (error)
// Seed users: alice / bob / carol — password: Password123!
//
// NOTE: do NOT share this file with backend candidates — it is the reference solution of their test.

import http from 'node:http';
import { randomBytes } from 'node:crypto';
import express from 'express';
import ParseServerPkg from 'parse-server';

const { ParseServer } = ParseServerPkg;
const PORT = Number(process.env.PORT ?? 1337);
const APP_ID = 'blog-app';
const MASTER_KEY = process.env.PARSE_MASTER_KEY ?? randomBytes(24).toString('hex');
const SERVER_URL = `http://localhost:${PORT}/parse`;

async function getDatabaseUri() {
  if (process.env.DATABASE_URI) return process.env.DATABASE_URI;
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongo = await MongoMemoryServer.create();
  return mongo.getUri('blog');
}

const publicRead = { find: { '*': true }, get: { '*': true }, count: { '*': true } };

const schema = {
  definitions: [
    {
      className: 'Post',
      fields: {
        title: { type: 'String' },
        body: { type: 'String' },
        author: { type: 'Pointer', targetClass: '_User' },
        likesCount: { type: 'Number', defaultValue: 0 },
        commentsCount: { type: 'Number', defaultValue: 0 },
      },
      classLevelPermissions: {
        ...publicRead,
        create: { requiresAuthentication: true },
        update: { '*': true },
        delete: { '*': true },
        addField: {},
      },
    },
    {
      className: 'Comment',
      fields: {
        post: { type: 'Pointer', targetClass: 'Post' },
        author: { type: 'Pointer', targetClass: '_User' },
        text: { type: 'String' },
      },
      classLevelPermissions: {
        ...publicRead,
        create: { requiresAuthentication: true },
        update: { '*': true },
        delete: { '*': true },
        addField: {},
      },
    },
    {
      className: 'Like',
      fields: {
        post: { type: 'Pointer', targetClass: 'Post' },
        user: { type: 'Pointer', targetClass: '_User' },
      },
      // Likes are only written by the `toggleLike` cloud function (master key).
      classLevelPermissions: { ...publicRead, create: {}, update: {}, delete: {}, addField: {} },
    },
  ],
  lockSchemas: true,
  strict: false,
};

function cloud(Parse = globalThis.Parse) {
  const fail = (code, message) => {
    throw new Parse.Error(code, message);
  };
  const ownerACL = (user) => {
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(true);
    acl.setWriteAccess(user.id, true);
    return acl;
  };
  const checkLength = (value, field, min, max) => {
    const text = typeof value === 'string' ? value.trim() : '';
    if (text.length < min || text.length > max) fail(142, `${field} must be ${min}-${max} characters`);
    return text;
  };

  Parse.Cloud.beforeSave('Post', ({ object, original, user, master }) => {
    object.set('title', checkLength(object.get('title'), 'title', 3, 120));
    object.set('body', checkLength(object.get('body'), 'body', 1, 5000));
    if (master) return; // seed + counters

    if (object.isNew()) {
      if (!user) fail(142, 'login required');
      object.set('author', user);
      object.set('likesCount', 0);
      object.set('commentsCount', 0);
      object.setACL(ownerACL(user));
      return;
    }
    for (const field of ['author', 'likesCount', 'commentsCount']) object.set(field, original.get(field));
  });

  Parse.Cloud.afterDelete('Post', async ({ object }) => {
    for (const className of ['Comment', 'Like']) {
      const rows = await new Parse.Query(className).equalTo('post', object).findAll({ useMasterKey: true });
      await Parse.Object.destroyAll(rows, { useMasterKey: true, context: { cascade: true } });
    }
  });

  Parse.Cloud.beforeSave('Comment', async ({ object, original, user, master }) => {
    object.set('text', checkLength(object.get('text'), 'text', 1, 500));
    if (master) return;

    if (object.isNew()) {
      if (!user) fail(142, 'login required');
      const postId = object.get('post')?.id;
      if (!postId) fail(142, 'post is required');
      await new Parse.Query('Post').get(postId, { useMasterKey: true }); // throws 101 if missing
      object.set('author', user);
      object.setACL(ownerACL(user));
      return;
    }
    object.set('post', original.get('post'));
    object.set('author', original.get('author'));
  });

  const bumpComments = async (comment, amount) => {
    const post = comment.get('post');
    post.increment('commentsCount', amount);
    await post.save(null, { useMasterKey: true });
  };
  Parse.Cloud.afterSave('Comment', async ({ object, original }) => {
    if (!original) await bumpComments(object, 1);
  });
  Parse.Cloud.afterDelete('Comment', async ({ object, context }) => {
    if (!context?.cascade) await bumpComments(object, -1);
  });

  Parse.Cloud.define(
    'toggleLike',
    async ({ params, user }) => {
      const post = await new Parse.Query('Post').get(params.postId, { useMasterKey: true });
      const existing = await new Parse.Query('Like')
        .equalTo('post', post)
        .equalTo('user', user)
        .first({ useMasterKey: true });

      if (existing) {
        await existing.destroy({ useMasterKey: true });
      } else {
        const like = new Parse.Object('Like', { post, user });
        const acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        like.setACL(acl);
        await like.save(null, { useMasterKey: true });
      }
      post.increment('likesCount', existing ? -1 : 1);
      await post.save(null, { useMasterKey: true });
      return { liked: !existing, likesCount: post.get('likesCount') };
    },
    { requireUser: true, fields: { postId: { type: String, required: true } } },
  );
}

async function seed(Parse) {
  const opts = { useMasterKey: true };
  if (await new Parse.Query(Parse.User).equalTo('username', 'alice').first(opts)) return;

  const users = [];
  for (const username of ['alice', 'bob', 'carol']) {
    users.push(await new Parse.User({ username, password: 'Password123!', email: `${username}@example.com` }).save(null, opts));
  }
  const acl = (user) => {
    const a = new Parse.ACL();
    a.setPublicReadAccess(true);
    if (user) a.setWriteAccess(user.id, true);
    return a;
  };

  const lorem =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
  for (let i = 1; i <= 25; i++) {
    const author = users[i % 3];
    const post = new Parse.Object('Post', {
      title: `Post #${i} by ${author.get('username')}`,
      body: lorem.repeat(1 + (i % 4)).trim(),
      author,
      likesCount: 0,
      commentsCount: 0,
    });
    post.setACL(acl(author));
    await post.save(null, opts);

    for (let c = 0; c < i % 4; c++) {
      const commenter = users[(i + c + 1) % 3];
      const comment = new Parse.Object('Comment', { post, author: commenter, text: `Comment ${c + 1} on post #${i}` });
      comment.setACL(acl(commenter));
      await comment.save(null, opts); // afterSave bumps commentsCount
    }
    const likers = users.slice(0, i % 4);
    for (const user of likers) {
      const like = new Parse.Object('Like', { post, user });
      like.setACL(acl());
      await like.save(null, opts);
    }
    post.set('likesCount', likers.length);
    await post.save(null, opts);
  }
}

const server = new ParseServer({
  databaseURI: await getDatabaseUri(),
  appId: APP_ID,
  masterKey: MASTER_KEY,
  serverURL: SERVER_URL,
  allowClientClassCreation: false,
  enforcePrivateUsers: false, // users publicly readable so posts can include('author'); email stays protected
  logLevel: process.env.LOG_LEVEL ?? 'error',
  liveQuery: { classNames: ['Post', 'Comment'] },
  schema,
  cloud,
});
await server.start();

const app = express();
app.use('/parse', server.app);
const httpServer = http.createServer(app);
await new Promise((resolve) => httpServer.listen(PORT, resolve));
await ParseServer.createLiveQueryServer(httpServer, { appId: APP_ID, masterKey: MASTER_KEY, serverURL: SERVER_URL });

await seed(globalThis.Parse);
console.log(`Parse Server on ${SERVER_URL} · LiveQuery ws://localhost:${PORT}/parse · appId=${APP_ID}`);
console.log('Users: alice / bob / carol — password: Password123!');
