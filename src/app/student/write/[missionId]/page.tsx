"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { createPost, getMission } from "@/lib/firestore";
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

  useEffect(() => {
    getMission(missionId).then(setMission);
  }, [missionId]);

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
        observedAt: Timestamp.fromDate(new Date(data.observedAt)),
      });

      // AI 칭찬 댓글 생성 (완료될 때까지 대기)
      setLoadingMessage("AI 선생님이 댓글을 달고 있어요...");
      try {
        await fetch("/api/ai-comment", {
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

      <PostForm onSubmit={handleSubmit} loading={loading} loadingMessage={loadingMessage} />
    </div>
  );
}
