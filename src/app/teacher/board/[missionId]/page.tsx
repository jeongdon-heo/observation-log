"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePosts } from "@/hooks/usePosts";
import { getMission } from "@/lib/firestore";
import { BoardView } from "@/components/board";
import { Spinner } from "@/components/ui";
import type { Mission } from "@/types";

export default function BoardPage() {
  const params = useParams();
  const missionId = params.missionId as string;
  const { posts, loading: postsLoading } = usePosts(missionId);
  const [mission, setMission] = useState<Mission | null>(null);

  useEffect(() => {
    getMission(missionId).then(setMission);
  }, [missionId]);

  if (postsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/teacher/missions" className="text-sm text-gray-400 hover:text-gray-600">
            &larr; 미션 목록
          </Link>
          <h1 className="text-2xl font-bold mt-1">{mission?.title || "관찰 일지 보드"}</h1>
          {mission?.description && (
            <p className="text-sm text-gray-500 mt-1">{mission.description}</p>
          )}
        </div>
        <span className="text-sm text-gray-400">{posts.length}개의 관찰 일지</span>
      </div>

      <BoardView posts={posts} defaultLayout={mission?.layoutType || "wall"} />
    </div>
  );
}
