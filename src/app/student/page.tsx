"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMissionsByClass, getUser } from "@/lib/firestore";
import { MissionCard } from "@/components/observation";
import { Spinner, EmptyState } from "@/components/ui";
import JoinClassForm from "@/components/JoinClassForm";
import type { Mission } from "@/types";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState(user?.classId ?? "");

  const fetchMissions = useCallback(async (cid: string) => {
    if (!cid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getMissionsByClass(cid);
      setMissions(data.filter((m) => m.isActive));
    } catch (err) {
      console.error("미션 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.classId) {
      setClassId(user.classId);
      fetchMissions(user.classId);
    } else {
      setLoading(false);
    }
  }, [user?.classId, fetchMissions]);

  const handleJoined = async () => {
    if (!user) return;
    const updated = await getUser(user.uid);
    if (updated?.classId) {
      setClassId(updated.classId);
      fetchMissions(updated.classId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!classId && user) {
    return <JoinClassForm uid={user.uid} onJoined={handleJoined} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{user?.name}님의 관찰 일지</h1>

      {missions.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="진행 중인 미션이 없습니다"
          description="선생님이 새 미션을 만들면 여기에 표시됩니다."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} role="student" />
          ))}
        </div>
      )}
    </div>
  );
}
