"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllPostsByClassIds, getAcademicYear } from "@/lib/firestore";
import { BoardView } from "@/components/board";
import { Spinner, EmptyState } from "@/components/ui";
import type { Post } from "@/types";

export default function GalleryPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = getAcademicYear();

  // 학생의 모든 classId (현재 + 이전)
  const allClassIds = user?.classId
    ? [user.classId, ...(user.previousClassIds || [])]
    : [];

  useEffect(() => {
    async function fetchPosts() {
      if (allClassIds.length === 0) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const postsData = await getAllPostsByClassIds(allClassIds);
        // 현재 학년도 이상의 글만 필터 + 공개 글 또는 본인 글
        const filtered = postsData.filter(
          (p) =>
            (p.academicYear ?? getAcademicYear(p.createdAt)) >= currentYear &&
            (p.isPublic || p.authorId === user?.uid)
        );
        setPosts(filtered);
      } catch (err) {
        console.error("갤러리 불러오기 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          친구들의 관찰 일지를 구경해보세요
        </p>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon="🖼️"
          title="아직 공개된 관찰 일지가 없습니다"
          description={`${currentYear}학년도에 작성된 관찰 일지가 없습니다.`}
        />
      ) : (
        <BoardView posts={posts} defaultLayout="wall" />
      )}
    </div>
  );
}
