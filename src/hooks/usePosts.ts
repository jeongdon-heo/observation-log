"use client";

import { useState, useEffect } from "react";
import { getPostsByMission } from "@/lib/firestore";
import type { Post } from "@/types";

export function usePosts(missionId: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await getPostsByMission(missionId);
      setPosts(data);
      setError(null);
    } catch (err) {
      setError("관찰 일지를 불러오는데 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (missionId) {
      fetchPosts();
    }
  }, [missionId]);

  return { posts, loading, error, refetch: fetchPosts };
}
