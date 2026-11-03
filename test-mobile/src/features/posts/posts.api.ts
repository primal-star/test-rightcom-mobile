import { Parse } from "@/shared/lib/parse";

export const POSTS_PAGE_SIZE = 10;

export type PostSummary = {
  id: string;
  title: string;
  body: string;
  authorUsername: string;
  authorId: string | null;
  createdAt: Date;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
};

export type LikeResult = {
  liked: boolean;
  likesCount: number;
};

export type PostComment = {
  id: string;
  text: string;
  authorUsername: string;
  createdAt: Date;
};

function toPostSummary(post: Parse.Object, likedByMe = false): PostSummary {
  return {
    id: post.id!,
    title: post.get("title"),
    body: post.get("body"),
    authorUsername: post.get("author")?.get("username") ?? "Utilisateur supprimé",
    authorId: post.get("author")?.id ?? null,
    createdAt: post.createdAt!,
    likesCount: post.get("likesCount") ?? 0,
    likedByMe,
    commentsCount: post.get("commentsCount") ?? 0,
  };
}

async function getLikedPostIds(posts: Parse.Object[], user: Parse.User | null) {
  if (!user || posts.length === 0) {
    return new Set<string>();
  }

  const query = new Parse.Query("Like");

  query.equalTo("user", user);
  query.containedIn("post", posts);
  query.limit(posts.length);

  const likes = await query.find();

  return new Set<string>(likes.map((like) => like.get("post").id));
}

export async function togglePostLike(postId: string): Promise<LikeResult> {
  return Parse.Cloud.run("toggleLike", {
    postId,
  });
}

export async function createPost(values: {
  title: string;
  body: string;
}) {
  const post = new Parse.Object("Post");

  post.set("title", values.title);
  post.set("body", values.body);

  await post.save();

  return post.id!;
}

export async function deletePost(postId: string) {
  const post = new Parse.Object("Post");

  post.id = postId;

  await post.destroy();
}

export async function createComment(
  postId: string,
  text: string,
): Promise<Omit<PostComment, "authorUsername">> {
  const post = new Parse.Object("Post");
  const comment = new Parse.Object("Comment");

  post.id = postId;
  comment.set("post", post);
  comment.set("text", text);

  await comment.save();

  return {
    id: comment.id!,
    text: comment.get("text"),
    createdAt: comment.createdAt!,
  };
}

export async function fetchPostsPage(
  offset: number,
  user: Parse.User | null = null,
): Promise<PostSummary[]> {
  const query = new Parse.Query("Post");

  query.include("author");
  query.descending("createdAt");
  query.addDescending("objectId");
  query.skip(offset);
  query.limit(POSTS_PAGE_SIZE);

  const posts = await query.find();
  const likedIds = await getLikedPostIds(posts, user);

  return posts.map((post) => toPostSummary(post, likedIds.has(post.id!)));
}

export async function fetchPostDetail(postId: string, user: Parse.User | null = null) {
  const query = new Parse.Query("Post");

  query.include("author");

  const post = await query.get(postId);
  const likedIds = await getLikedPostIds([post], user);
  const comments: PostComment[] = [];
  const pageSize = 100;
  let offset = 0;

  // Read every batch so the SDK's default limit does not hide comments.
  while (true) {
    const commentsQuery = new Parse.Query("Comment");

    commentsQuery.equalTo("post", post);
    commentsQuery.include("author");
    commentsQuery.descending("createdAt");
    commentsQuery.addDescending("objectId");
    commentsQuery.skip(offset);
    commentsQuery.limit(pageSize);

    const page = await commentsQuery.find();

    comments.push(...page.map((comment) => ({
      id: comment.id!,
      text: comment.get("text"),
      authorUsername: comment.get("author")?.get("username") ?? "Utilisateur supprimé",
      createdAt: comment.createdAt!,
    })));

    if (page.length < pageSize) {
      break;
    }

    offset += page.length;
  }

  return {
    post: toPostSummary(post, likedIds.has(post.id!)),
    comments,
  };
}
