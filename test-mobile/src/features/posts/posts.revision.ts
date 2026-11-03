let revision = 0;

export function getPostsRevision() {
  return revision;
}

export function invalidatePosts() {
  revision++;
}
