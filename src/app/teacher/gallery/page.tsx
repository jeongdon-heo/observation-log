"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAllPostsByClassIds,
  getAcademicYear,
  deletePost,
} from "@/lib/firestore";
import { BoardView } from "@/components/board";
import { Spinner, EmptyState } from "@/components/ui";
import type { Post } from "@/types";

export default function TeacherGalleryPage() {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(getAcademicYear());
  const [loading, setLoading] = useState(true);

  const currentYear = getAcademicYear();

  // 교사의 모든 classId (현재 + 이전)
  const allClassIds = user?.classId
    ? [user.classId, ...(user.previousClassIds || [])]
    : [];

  // 전체 게시물 로드
  const fetchAll = async () => {
    if (allClassIds.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const postsData = await getAllPostsByClassIds(allClassIds);
      setAllPosts(postsData);
    } catch (err) {
      console.error("갤러리 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll(); }, [user?.classId]);

  // 연도 옵션: 게시물이 있는 연도 + 현재 학년도
  const postYears = allPosts.map((p) => p.academicYear ?? getAcademicYear(p.createdAt));
  const yearOptions = Array.from(
    new Set([currentYear, ...postYears])
  ).sort((a, b) => b - a);

  // 선택된 연도의 게시물 필터링
  const filteredPosts = allPosts.filter(
    (p) => (p.academicYear ?? getAcademicYear(p.createdAt)) === selectedYear
  );

  // 게시물 삭제
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setAllPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("게시물 삭제 실패:", err);
    }
  };

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
          학생들의 관찰 일지를 한눈에 확인하세요 (전체 {filteredPosts.length}개)
        </p>
      </div>

      {/* 학년도 선택 */}
      <div className="flex flex-wrap items-center gap-2">
        {yearOptions.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedYear === year
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {year}학년도
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <EmptyState
          icon="🖼️"
          title="아직 작성된 관찰 일지가 없습니다"
          description={`${selectedYear}학년도에 작성된 관찰 일지가 없습니다.`}
        />
      ) : (
        <BoardView posts={filteredPosts} defaultLayout="wall" onDelete={handleDeletePost} />
      )}
    </div>
  );
}
