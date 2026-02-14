"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Post } from "@/types";
import { WEATHER_OPTIONS } from "@/types";

interface GalleryCardProps {
  post: Post;
  variant?: "wall" | "grid";
  onDelete?: (postId: string) => void;
}

export default function GalleryCard({ post, variant = "wall", onDelete }: GalleryCardProps) {
  const [imageIndex, setImageIndex] = useState(0);

  const hasImages = post.photoUrls.length > 0;
  const hasMultipleImages = post.photoUrls.length > 1;
  const weatherEmoji = WEATHER_OPTIONS.find((w) => w.value === post.weather)?.emoji ?? "";

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      {/* 이미지 */}
      {hasImages && (
        <div className="relative">
          <img
            src={post.photoUrls[imageIndex]}
            alt={`관찰 사진 ${imageIndex + 1}`}
            className={`w-full object-cover ${variant === "wall" ? "max-h-72" : "h-40"}`}
          />
          {hasMultipleImages && (
            <>
              <button
                onClick={() =>
                  setImageIndex((prev) => (prev === 0 ? post.photoUrls.length - 1 : prev - 1))
                }
                className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/60"
              >
                &lt;
              </button>
              <button
                onClick={() =>
                  setImageIndex((prev) => (prev === post.photoUrls.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/60"
              >
                &gt;
              </button>
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                {post.photoUrls.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i === imageIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 내용 */}
      <div className="p-3 space-y-1.5">
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
          {post.content}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
            {post.authorName}
          </span>
          <span className="text-xs text-gray-400">
            {weatherEmoji}{" "}
            {post.observedAt ? format(post.observedAt, "M월 d일", { locale: ko }) : ""}
          </span>
          {!post.isPublic && (
            <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
              비공개
            </span>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`${post.authorName} 학생의 글을 삭제하시겠습니까?`)) {
                  onDelete(post.id);
                }
              }}
              className="text-xs text-gray-300 hover:text-red-500 transition ml-auto"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
