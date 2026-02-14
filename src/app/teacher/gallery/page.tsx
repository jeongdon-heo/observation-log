"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAllPostsByClassIds,
  getGalleriesByClassIds,
  getAcademicYear,
  createGallery,
  closeGallery,
  reopenGallery,
} from "@/lib/firestore";
import { BoardView } from "@/components/board";
import { Spinner, EmptyState } from "@/components/ui";
import type { Post, Gallery } from "@/types";

export default function TeacherGalleryPage() {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(getAcademicYear());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const currentYear = getAcademicYear();

  // 교사의 모든 classId (현재 + 이전)
  const allClassIds = user?.classId
    ? [user.classId, ...(user.previousClassIds || [])]
    : [];

  // 갤러리 + 전체 게시물 로드
  const fetchAll = async () => {
    if (allClassIds.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [galleriesData, postsData] = await Promise.all([
        getGalleriesByClassIds(allClassIds),
        getAllPostsByClassIds(allClassIds), // 연도 필터 없이 전체 로드
      ]);
      setGalleries(galleriesData);
      setAllPosts(postsData);
      // 가장 최신 글이 있는 연도를 기본 선택
      if (postsData.length > 0) {
        const latestYear = Math.max(
          ...postsData.map((p) => p.academicYear ?? getAcademicYear(p.createdAt))
        );
        setSelectedYear(latestYear);
      }
    } catch (err) {
      console.error("갤러리 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll(); }, [user?.classId]);

  // 현재 선택된 연도의 갤러리
  const selectedGallery = galleries.find((g) => g.academicYear === selectedYear);

  // 연도 옵션: 실제 갤러리 + 게시물이 있는 연도만 표시
  const postYears = allPosts.map((p) => p.academicYear ?? getAcademicYear(p.createdAt));
  const yearOptions = Array.from(
    new Set([...galleries.map((g) => g.academicYear), ...postYears])
  ).sort((a, b) => b - a);

  // 선택된 연도의 게시물 필터링
  const filteredPosts = allPosts.filter(
    (p) => (p.academicYear ?? getAcademicYear(p.createdAt)) === selectedYear
  );

  // 갤러리 생성 (지정 학년도)
  const handleCreateGallery = async (year: number) => {
    if (!user?.classId) return;
    setActionLoading(true);
    try {
      await createGallery(user.classId, year);
      await fetchAll();
      setSelectedYear(year);
    } catch (err) {
      console.error("갤러리 생성 실패:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // 갤러리 마감
  const handleCloseGallery = async () => {
    if (!selectedGallery) return;
    const confirmed = window.confirm(
      `${selectedYear}학년도 갤러리를 마감하시겠습니까?\n마감 후에도 게시물은 열람 가능합니다.`
    );
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await closeGallery(selectedGallery.id);
      await fetchAll();
    } catch (err) {
      console.error("갤러리 마감 실패:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // 갤러리 마감 취소
  const handleReopenGallery = async () => {
    if (!selectedGallery) return;
    const confirmed = window.confirm(
      `${selectedYear}학년도 갤러리 마감을 취소하시겠습니까?`
    );
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await reopenGallery(selectedGallery.id);
      await fetchAll();
    } catch (err) {
      console.error("갤러리 마감 취소 실패:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // 선택된 갤러리가 현재 학급의 것인지 확인 (이전 학급은 읽기 전용)
  const isCurrentClassGallery = !selectedGallery || selectedGallery.classId === user?.classId;

  // 현재 학급에 열린 갤러리가 하나라도 있는지 확인
  const hasOpenGallery = galleries.some(
    (g) => g.status === "open" && g.classId === user?.classId
  );

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
          학생들의 관찰 일지를 한눈에 확인하세요 (비공개 포함 {filteredPosts.length}개)
        </p>
      </div>

      {/* 학년도 선택 + 관리 버튼 */}
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
            {galleries.find((g) => g.academicYear === year)?.status === "closed" && (
              <span className="ml-1 text-xs opacity-75">(마감)</span>
            )}
          </button>
        ))}
      </div>

      {/* 갤러리 관리 액션 */}
      <div className="flex flex-wrap gap-2">
        {/* 현재 학급 갤러리만 관리 가능 (이전 학급은 읽기 전용) */}
        {isCurrentClassGallery && (
          <>
            {/* 선택된 갤러리가 열려있으면 마감 버튼 */}
            {selectedGallery?.status === "open" && (
              <button
                onClick={handleCloseGallery}
                disabled={actionLoading}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
              >
                {actionLoading ? "마감 중..." : `${selectedYear}학년도 마감`}
              </button>
            )}

            {/* 선택된 갤러리가 마감됐으면 마감 취소 버튼 */}
            {selectedGallery?.status === "closed" && (
              <button
                onClick={handleReopenGallery}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition disabled:opacity-50"
              >
                {actionLoading ? "처리 중..." : `${selectedYear}학년도 마감 취소`}
              </button>
            )}

            {/* 열린 갤러리가 없을 때만 새 갤러리 생성 버튼 */}
            {!hasOpenGallery && (
              <button
                onClick={() => {
                  // 가장 최근 마감 연도 + 1, 없으면 현재 학년도
                  const latestClosedYear = Math.max(0, ...galleries.filter(g => g.classId === user?.classId).map(g => g.academicYear));
                  const newYear = latestClosedYear > 0 ? latestClosedYear + 1 : currentYear;
                  handleCreateGallery(newYear);
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition disabled:opacity-50"
              >
                {actionLoading ? "생성 중..." : "새 학년도 갤러리 생성"}
              </button>
            )}
          </>
        )}

        {/* 이전 학급 갤러리일 때 안내 */}
        {selectedGallery && !isCurrentClassGallery && (
          <span className="px-3 py-2 text-xs text-gray-400">
            이전 학급의 갤러리입니다 (읽기 전용)
          </span>
        )}
      </div>

      {/* 갤러리 상태 표시 */}
      {selectedGallery && (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            selectedGallery.status === "open"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              selectedGallery.status === "open" ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {selectedGallery.status === "open" ? "진행중" : "마감됨"}
          {selectedGallery.closedAt && (
            <span className="text-gray-400">
              ({selectedGallery.closedAt.toLocaleDateString("ko-KR")} 마감)
            </span>
          )}
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <EmptyState
          icon="🖼️"
          title="아직 작성된 관찰 일지가 없습니다"
          description={
            !selectedGallery
              ? `${selectedYear}학년도 갤러리를 생성하면 학생들의 일지가 여기에 표시됩니다.`
              : `${selectedYear}학년도에 작성된 관찰 일지가 없습니다.`
          }
        />
      ) : (
        <BoardView posts={filteredPosts} defaultLayout="wall" />
      )}
    </div>
  );
}
