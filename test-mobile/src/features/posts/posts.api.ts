import { Parse } from "@/shared/lib/parse";

export const POSTS_PAGE_SIZE = 10;

export type PostSummary = {
  id: string;
  title: string;
  body: string;
  authorUsername: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
};

export type PostComment = {
  id: string;
  text: string;
  authorUsername: string;
  createdAt: Date;
};

function toPostSummary(post: Parse.Object): PostSummary {
  return {
    id: post.id!,
    title: post.get("title"),
    body: post.get("body"),
    authorUsername: post.get("author")?.get("username") ?? "Utilisateur supprimé",
    createdAt: post.createdAt!,
    likesCount: post.get("likesCount") ?? 0,
    commentsCount: post.get("commentsCount") ?? 0,
  };
}

export async function fetchPostsPage(offset: number): Promise<PostSummary[]> {
  const query = new Parse.Query("Post");

  query.include("author");
  query.descending("createdAt");
  query.addDescending("objectId");
  query.skip(offset);
  query.limit(POSTS_PAGE_SIZE);

  const posts = await query.find();

  return posts.map(toPostSummary);
}

export async function fetchPostDetail(postId: string) {
  const query = new Parse.Query("Post");

  query.include("author");

  const post = await query.get(postId);
  const comments: PostComment[] = [];
  const pageSize = 100;
  let offset = 0;

  // Read every batch so the SDK's default limit does not hide comments.
  while (true) {
    const commentsQuery = new Parse.Query("Comment");

    commentsQuery.equalTo("post", post);
    commentsQuery.include("author");
    commentsQuery.ascending("createdAt");
    commentsQuery.addAscending("objectId");
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
    post: toPostSummary(post),
    comments,
  };
}
