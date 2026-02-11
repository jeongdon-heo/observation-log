"use client";

import type { Post } from "@/types";
import { PostCard } from "@/components/observation";

interface StreamLayoutProps {
  posts: Post[];
}

export default function StreamLayout({ posts }: StreamLayoutProps) {
  return (
    <div className="max-w-xl mx-auto space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
