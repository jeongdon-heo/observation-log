"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { getPost, getMission, updatePost } from "@/lib/firestore";
import { uploadMultipleImages } from "@/lib/storage";
import { PostForm } from "@/components/observation";
import { Spinner } from "@/components/ui";
import type { Post, Mission, WeatherType } from "@/types";
import { format } from "date-fns";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.postId as string;

  const [post, setPost] = useState<Post | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const postData = await getPost(postId);
      if (!postData) {
        setPageLoading(false);
        return;
      }
      setPost(postData);
      const missionData = await getMission(postData.missionId);
      setMission(missionData);
      setPageLoading(false);
    }
    fetchData();
  }, [postId]);

  // 본인 글이 아니면 접근 차단
  if (!pageLoading && post && user && post.authorId !== user.uid) {
    router.push("/student/my-log");
    return null;
  }

  const handleSubmit = async (data: {
    content: string;
    files: File[];
    weather: WeatherType;
    isPublic: boolean;
    observedAt: string;
  }) => {
    if (!user || !post) return;

    setLoading(true);
    try {
      // 새 사진이 있으면 업로드, 없으면 기존 사진 유지
      const newPhotoUrls =
        data.files.length > 0
          ? await uploadMultipleImages(data.files)
          : [];
      const photoUrls =
        newPhotoUrls.length > 0
          ? [...post.photoUrls, ...newPhotoUrls]
          : post.photoUrls;

      await updatePost(postId, {
        content: data.content,
        weather: data.weather,
        isPublic: data.isPublic,
        photoUrls,
        observedAt: Timestamp.fromDate(new Date(data.observedAt)),
      });

      router.push("/student/my-log");
    } catch (err) {
      console.error("관찰 일지 수정 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20 text-gray-500">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link
          href="/student/my-log"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          &larr; 내 기록으로
        </Link>
        <h1 className="text-2xl font-bold mt-1">관찰 일지 수정</h1>
        {mission && (
          <p className="text-sm text-gray-500 mt-1">
            미션:{" "}
            <span className="font-medium text-gray-700">{mission.title}</span>
          </p>
        )}
      </div>

      <PostForm
        onSubmit={handleSubmit}
        loading={loading}
        initialData={{
          content: post.content,
          weather: post.weather,
          isPublic: post.isPublic,
          observedAt: format(post.observedAt, "yyyy-MM-dd"),
          photoUrls: post.photoUrls,
        }}
      />
    </div>
  );
}
