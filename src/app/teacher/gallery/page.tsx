"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllPostsByClass } from "@/lib/firestore";
import { BoardView } from "@/components/board";
import { Spinner, EmptyState } from "@/components/ui";
import type { Post } from "@/types";

export default function TeacherGalleryPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      if (!user?.classId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getAllPostsByClass(user.classId);
        setPosts(data);
      } catch (err) {
        console.error("갤러리 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [user?.classId]);

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
        <h1 className="text-2xl font-bold">우리 반 갤러리</h1>
        <p className="text-sm text-gray-500 mt-1">
          학생들의 관찰 일지를 한눈에 확인하세요 (비공개 포함 {posts.length}개)
        </p>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon="🖼️"
          title="아직 작성된 관찰 일지가 없습니다"
          description="학생들이 관찰 일지를 작성하면 여기에 표시됩니다."
        />
      ) : (
        <BoardView posts={posts} defaultLayout="wall" />
      )}
    </div>
  );
}
