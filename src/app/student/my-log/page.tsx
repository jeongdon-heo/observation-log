"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPostsByAuthor } from "@/lib/firestore";
import { PostCard } from "@/components/observation";
import { Spinner, EmptyState } from "@/components/ui";
import type { Post } from "@/types";

export default function MyLogPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const data = await getPostsByAuthor(user.uid);
        setPosts(data);
      } catch (err) {
        console.error("내 기록 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">내 관찰 기록</h1>
        <p className="text-sm text-gray-500 mt-1">
          내가 작성한 관찰 일지 {posts.length}개
        </p>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon="📓"
          title="아직 작성한 관찰 일지가 없습니다"
          description="미션을 선택하고 첫 번째 관찰 일지를 작성해보세요!"
        />
      ) : (
        <div className="max-w-xl mx-auto space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} showAuthor={false} />
          ))}
        </div>
      )}
    </div>
  );
}
