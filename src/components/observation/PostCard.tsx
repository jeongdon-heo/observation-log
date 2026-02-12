"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import type { Post, Comment } from "@/types";
import { WEATHER_OPTIONS } from "@/types";
import { getCommentsByPost } from "@/lib/firestore";
import CommentBubble from "./CommentBubble";

interface PostCardProps {
  post: Post;
  showAuthor?: boolean;
  editable?: boolean;
}

export default function PostCard({ post, showAuthor = true, editable = false }: PostCardProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    getCommentsByPost(post.id).then(setComments);
  }, [post.id]);

  const hasImages = post.photoUrls.length > 0;
  const hasMultipleImages = post.photoUrls.length > 1;
  const weatherEmoji = WEATHER_OPTIONS.find((w) => w.value === post.weather)?.emoji ?? "";

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* 이미지 영역 */}
      {hasImages && (
        <div className="relative">
          <img
            src={post.photoUrls[imageIndex]}
            alt={`관찰 사진 ${imageIndex + 1}`}
            className="w-full h-48 object-cover"
          />
          {hasMultipleImages && (
            <>
              <button
                onClick={() => setImageIndex((prev) => (prev === 0 ? post.photoUrls.length - 1 : prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/60"
              >
                &lt;
              </button>
              <button
                onClick={() => setImageIndex((prev) => (prev === post.photoUrls.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/60"
              >
                &gt;
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {post.photoUrls.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i === imageIndex ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 글 내용 */}
      <div className="p-4 space-y-2">
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>

        <div className="flex items-center gap-2 flex-wrap pt-2">
          {showAuthor && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {post.authorName}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {weatherEmoji} {post.observedAt ? format(post.observedAt, "M월 d일", { locale: ko }) : ""}
          </span>
          {!post.isPublic && (
            <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
              비공개
            </span>
          )}
          <span className="text-xs text-gray-300 ml-auto">
            {post.createdAt ? format(post.createdAt, "a h:mm", { locale: ko }) : ""}
          </span>
          {editable && (
            <Link
              href={`/student/edit/${post.id}`}
              className="text-xs text-gray-400 hover:text-green-600 transition ml-1"
            >
              수정
            </Link>
          )}
        </div>
      </div>

      {/* 댓글 목록 */}
      {comments.length > 0 && (
        <div className="border-t">
          {comments.map((c) => (
            <CommentBubble key={c.id} comment={c} />
          ))}
        </div>
      )}
    </div>
  );
}
