"use client";

/**
 * 담벼락형(Masonry) 레이아웃
 * CSS columns를 사용한 라이브러리-프리 Masonry 구현.
 * columns 속성은 브라우저가 자동으로 높이 균형을 맞춰준다.
 */

import type { Post } from "@/types";
import GalleryCard from "./GalleryCard";

interface WallLayoutProps {
  posts: Post[];
  onDelete?: (postId: string) => void;
}

export default function WallLayout({ posts, onDelete }: WallLayoutProps) {
  return (
    <div
      className="
        [column-count:1] sm:[column-count:2] lg:[column-count:3] xl:[column-count:4]
        [column-gap:1rem]
      "
    >
      {posts.map((post, i) => (
        <div
          key={post.id}
          className="break-inside-avoid mb-4"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="animate-fade-in-up">
            <GalleryCard post={post} variant="wall" onDelete={onDelete} />
          </div>
        </div>
      ))}
    </div>
  );
}
