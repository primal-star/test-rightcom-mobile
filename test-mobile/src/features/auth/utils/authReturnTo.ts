import type { Href } from "expo-router";

type AuthReturnTo = {
  path: string;
  href: Href;
};

export function resolveAuthReturnTo(value: unknown): AuthReturnTo {
  if (value === "/publish" || value === "/posts/new") {
    return {
      path: "/publish",
      href: "/publish",
    };
  }

  const match = typeof value === "string"
    ? /^\/posts\/([a-zA-Z0-9_-]+)$/.exec(value)
    : null;

  if (match) {
    return {
      path: `/posts/${match[1]}`,
      href: {
        pathname: "/posts/[postId]",
        params: {
          postId: match[1],
        },
      },
    };
  }

  return {
    path: "/feed",
    href: "/feed",
  };
}
