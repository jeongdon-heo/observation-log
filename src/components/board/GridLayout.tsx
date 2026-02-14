"use client";

import type { Post } from "@/types";
import { PostCard } from "@/components/observation";

interface GridLayoutProps {
  posts: Post[];
  onDelete?: (postId: string) => void;
}

export default function GridLayout({ posts, onDelete }: GridLayoutProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={onDelete} />
      ))}
    </div>
  );
}
