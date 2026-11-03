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

export async function fetchPostsPage(offset: number): Promise<PostSummary[]> {
  const query = new Parse.Query("Post");

  query.include("author");
  query.descending("createdAt");
  query.addDescending("objectId");
  query.skip(offset);
  query.limit(POSTS_PAGE_SIZE);

  const posts = await query.find();

  return posts.map((post) => ({
    id: post.id!,
    title: post.get("title"),
    body: post.get("body"),
    authorUsername: post.get("author")?.get("username") ?? "Utilisateur supprimé",
    createdAt: post.createdAt!,
    likesCount: post.get("likesCount") ?? 0,
    commentsCount: post.get("commentsCount") ?? 0,
  }));
}
