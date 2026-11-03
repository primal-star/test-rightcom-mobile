#!/usr/bin/env node
// Black-box check of the blog API contract (used to grade backend candidates, and to sanity-check dev-server).
//
//   node check-api.mjs [http://localhost:1337/parse]
//
// Needs the seed-independent state only: it signs up two fresh users and cleans up after itself.
// No dependencies, Node 20.19+ (global fetch). Exit code = number of failed checks.

const BASE = process.argv[2] ?? 'http://localhost:1337/parse';
const APP_ID = process.env.APP_ID ?? 'blog-app';

async function call(method, path, body, token) {
  const headers = { 'X-Parse-Application-Id': APP_ID, 'Content-Type': 'application/json' };
  if (token) headers['X-Parse-Session-Token'] = token;
  const res = await fetch(BASE + path, { method, headers, body: body && JSON.stringify(body) });
  return res.json();
}
const ptr = (className, objectId) => ({ __type: 'Pointer', className, objectId });
const where = (q) => encodeURIComponent(JSON.stringify(q));
const settle = () => new Promise((resolve) => setTimeout(resolve, 500)); // afterSave/afterDelete run after the response

let failed = 0;
function check(id, label, ok, detail) {
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(4)} ${label}${ok ? '' : `  → ${JSON.stringify(detail)}`}`);
}

const suffix = Date.now().toString(36);
const signup = async (name) => {
  const res = await call('POST', '/users', { username: `${name}_${suffix}`, password: 'Password123!', email: `${name}_${suffix}@example.com` });
  return { id: res.objectId, token: res.sessionToken };
};

const health = await call('GET', '/health').catch((e) => ({ error: e.message }));
check('B1', 'server healthy', health.status === 'ok', health);
if (health.status !== 'ok') process.exit(99);

const a = await signup('ann');
const b = await signup('ben');
check('B2', 'sign up returns a session', Boolean(a.token && b.token), a);

// Posts
let r = await call('POST', '/classes/Post', { title: 'Anonymous', body: 'x' });
check('P1', 'anonymous cannot create a Post', Boolean(r.code), r);
r = await call('POST', '/classes/Post', { title: 'ab', body: 'x' }, a.token);
check('P2', 'title < 3 chars → 142', r.code === 142, r);
r = await call('POST', '/classes/Post', { title: 'Valid title', body: '' }, a.token);
check('P3', 'empty body → 142', r.code === 142, r);
r = await call('POST', '/classes/Foo', { x: 1 }, a.token);
check('P4', 'client class creation refused', Boolean(r.code), r);

const created = await call(
  'POST',
  '/classes/Post',
  { title: '  Hello world  ', body: 'First post', likesCount: 42, commentsCount: 7, author: ptr('_User', b.id) },
  a.token,
);
const postId = created.objectId;
let post = await call('GET', `/classes/Post/${postId}`);
check('P5', 'author forced to current user', post.author?.objectId === a.id, post.author);
check('P6', 'counters forced to 0 on create', post.likesCount === 0 && post.commentsCount === 0, post);
check('P7', 'title trimmed', post.title === 'Hello world', post.title);
check('P8', 'ACL: public read, author write only', post.ACL?.['*']?.read === true && !post.ACL?.['*']?.write && post.ACL?.[a.id]?.write === true, post.ACL);

r = await call('PUT', `/classes/Post/${postId}`, { title: 'Hacked' }, b.token);
check('P9', 'other user cannot update', Boolean(r.code), r);
r = await call('DELETE', `/classes/Post/${postId}`, null, b.token);
check('P10', 'other user cannot delete', Boolean(r.code), r);
await call('PUT', `/classes/Post/${postId}`, { title: 'Edited', likesCount: 99, author: ptr('_User', b.id) }, a.token);
post = await call('GET', `/classes/Post/${postId}`);
check('P11', 'author can edit; counters/author stay protected', post.title === 'Edited' && post.likesCount === 0 && post.author?.objectId === a.id, post);

const feed = await call('GET', `/classes/Post?order=-createdAt&limit=1&include=author`);
check('P12', 'feed: include(author) exposes username, hides email', feed.results?.[0]?.author?.username && !feed.results[0].author.email, feed.results?.[0]?.author);

// Comments
r = await call('POST', '/classes/Comment', { text: 'Hi', post: ptr('Post', postId) });
check('C1', 'anonymous cannot comment', Boolean(r.code), r);
r = await call('POST', '/classes/Comment', { text: '', post: ptr('Post', postId) }, b.token);
check('C2', 'empty text → 142', r.code === 142, r);
r = await call('POST', '/classes/Comment', { text: 'x'.repeat(501), post: ptr('Post', postId) }, b.token);
check('C3', 'text > 500 chars → 142', r.code === 142, r);
r = await call('POST', '/classes/Comment', { text: 'Hi', post: ptr('Post', 'doesNotExist') }, b.token);
check('C4', 'comment on unknown post → 101', r.code === 101, r);
const comment = await call('POST', '/classes/Comment', { text: 'Nice post', post: ptr('Post', postId), author: ptr('_User', a.id) }, b.token);
await settle();
const c = await call('GET', `/classes/Comment/${comment.objectId}`);
check('C5', 'comment author forced to current user', c.author?.objectId === b.id, c.author);
post = await call('GET', `/classes/Post/${postId}`);
check('C6', 'commentsCount incremented', post.commentsCount === 1, post.commentsCount);
r = await call('DELETE', `/classes/Comment/${comment.objectId}`, null, a.token);
check('C7', 'non-author cannot delete a comment', Boolean(r.code), r);
await call('DELETE', `/classes/Comment/${comment.objectId}`, null, b.token);
await settle();
post = await call('GET', `/classes/Post/${postId}`);
check('C8', 'commentsCount decremented on delete', post.commentsCount === 0, post.commentsCount);

// Likes
r = await call('POST', '/classes/Like', { post: ptr('Post', postId) }, b.token);
check('L1', 'client cannot create Like directly', Boolean(r.code), r);
r = await call('POST', '/functions/toggleLike', { postId });
check('L2', 'toggleLike anonymous → 142', r.code === 142, r);
r = await call('POST', '/functions/toggleLike', { postId: 'doesNotExist' }, b.token);
check('L3', 'toggleLike unknown post → 101', r.code === 101, r);
r = await call('POST', '/functions/toggleLike', { postId }, b.token);
check('L4', 'toggleLike → liked', r.result?.liked === true && r.result?.likesCount === 1, r);
r = await call('POST', '/functions/toggleLike', { postId }, a.token);
check('L5', 'second user like → count 2', r.result?.likesCount === 2, r);
r = await call('POST', '/functions/toggleLike', { postId }, b.token);
check('L6', 'toggle again → unliked', r.result?.liked === false && r.result?.likesCount === 1, r);
const likes = await call('GET', `/classes/Like?count=1&limit=0&where=${where({ post: ptr('Post', postId) })}`);
check('L7', 'one Like row per (user, post)', likes.count === 1, likes);

// Bonus: concurrency
await Promise.all(Array.from({ length: 5 }, () => call('POST', '/functions/toggleLike', { postId }, b.token)));
const after = await call('GET', `/classes/Like?count=1&limit=0&where=${where({ post: ptr('Post', postId), user: ptr('_User', b.id) })}`);
post = await call('GET', `/classes/Post/${postId}`);
const realCount = (await call('GET', `/classes/Like?count=1&limit=0&where=${where({ post: ptr('Post', postId) })}`)).count;
check('X1', '(bonus) 5 parallel toggles: ≤ 1 Like for user, likesCount consistent', after.count <= 1 && post.likesCount === realCount, {
  rows: after.count,
  likesCount: post.likesCount,
  realCount,
});

// Cascade
await call('POST', '/classes/Comment', { text: 'Orphan?', post: ptr('Post', postId) }, b.token);
await call('DELETE', `/classes/Post/${postId}`, null, a.token);
await settle();
const orphanComments = await call('GET', `/classes/Comment?count=1&limit=0&where=${where({ post: ptr('Post', postId) })}`);
const orphanLikes = await call('GET', `/classes/Like?count=1&limit=0&where=${where({ post: ptr('Post', postId) })}`);
check('D1', 'deleting a post deletes its comments and likes', orphanComments.count === 0 && orphanLikes.count === 0, {
  comments: orphanComments.count,
  likes: orphanLikes.count,
});

console.log(`\n${failed === 0 ? 'All checks passed' : `${failed} check(s) failed`}`);
process.exit(failed);
