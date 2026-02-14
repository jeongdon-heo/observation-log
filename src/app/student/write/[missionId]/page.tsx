"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { createPost, getMission, getAcademicYear, getGalleriesByClassIds } from "@/lib/firestore";
import { uploadMultipleImages } from "@/lib/storage";
import { PostForm } from "@/components/observation";
import type { Mission, WeatherType } from "@/types";

export default function WritePostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const missionId = params.missionId as string;

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [postAcademicYear, setPostAcademicYear] = useState<number>(getAcademicYear());

  useEffect(() => {
    getMission(missionId).then(setMission);
  }, [missionId]);

  // 학생의 모든 classId (현재 + 이전)
  const allClassIds = user?.classId
    ? [user.classId, ...(user.previousClassIds || [])]
    : [];

  // 현재 학년도 갤러리가 마감되었으면 다음 학년도로 설정
  useEffect(() => {
    async function checkGallery() {
      if (allClassIds.length === 0) return;
      // 학생의 모든 classId에서 갤러리 검색 (교사가 classId를 변경했을 수 있음)
      const galleries = await getGalleriesByClassIds(allClassIds);
      const currentYear = getAcademicYear();
      const gallery = galleries.find((g) => g.academicYear === currentYear);
      if (gallery?.status === "closed") {
        setPostAcademicYear(currentYear + 1);
      }
    }
    checkGallery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.classId]);

  const handleSubmit = async (data: {
    content: string;
    files: File[];
    weather: WeatherType;
    isPublic: boolean;
    observedAt: string;
  }) => {
    if (!user) return;

    setLoading(true);
    try {
      setLoadingMessage("사진 업로드 중...");
      const photoUrls = data.files.length > 0 ? await uploadMultipleImages(data.files) : [];

      setLoadingMessage("관찰 일지 저장 중...");
      const postId = await createPost({
        authorId: user.uid,
        authorName: user.name,
        missionId,
        classId: user.classId,
        photoUrls,
        content: data.content,
        weather: data.weather,
        isPublic: data.isPublic,
        academicYear: postAcademicYear,
        observedAt: Timestamp.fromDate(new Date(data.observedAt)),
      });

      // AI 칭찬 댓글 생성 (완료될 때까지 대기)
      setLoadingMessage("AI 선생님이 댓글을 달고 있어요...");
      try {
        const res = await fetch("/api/ai-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId,
            authorName: user.name,
            missionTitle: mission?.title || missionId,
            content: data.content,
            photoUrls,
          }),
        });
        const result = await res.json();
        if (result.content) {
          setAiComment(result.content);
          return; // 모달에서 확인 누르면 이동
        }
      } catch (err) {
        console.error("AI 댓글 생성 실패 (일지는 저장됨):", err);
      }

      router.push("/student");
    } catch (err) {
      console.error("관찰 일지 저장 실패:", err);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link href="/student" className="text-sm text-gray-400 hover:text-gray-600">
          &larr; 돌아가기
        </Link>
        <h1 className="text-2xl font-bold mt-1">관찰 일지 쓰기</h1>
        {mission && (
          <p className="text-sm text-gray-500 mt-1">
            미션: <span className="font-medium text-gray-700">{mission.title}</span>
          </p>
        )}
      </div>

      {postAcademicYear !== getAcademicYear() && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
          {getAcademicYear()}학년도 갤러리가 마감되어 <strong>{postAcademicYear}학년도</strong>에 기록됩니다.
        </div>
      )}

      <PostForm onSubmit={handleSubmit} loading={loading} loadingMessage={loadingMessage} />

      {/* AI 댓글 모달 */}
      {aiComment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="text-center">
              <span className="text-4xl">AI</span>
              <h2 className="text-lg font-bold mt-2">AI 선생님의 댓글</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-green-50 rounded-xl p-4">
              {aiComment}
            </p>
            <button
              onClick={() => router.push("/student")}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
