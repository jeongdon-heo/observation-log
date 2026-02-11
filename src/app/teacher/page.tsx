"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMissionsByClass } from "@/lib/firestore";
import { Card, Spinner } from "@/components/ui";
import type { Mission } from "@/types";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (!user?.classId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getMissionsByClass(user.classId);
        setMissions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeMissions = missions.filter((m) => m.isActive);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{user?.name} 선생님의 대시보드</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{missions.length}</p>
          <p className="text-sm text-gray-500 mt-1">전체 미션</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{activeMissions.length}</p>
          <p className="text-sm text-gray-500 mt-1">진행중 미션</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-lg font-mono font-bold text-purple-600 tracking-wider">
            {user?.classId?.slice(0, 6).toUpperCase() || "—"}
          </p>
          <p className="text-sm text-gray-500 mt-1">학급 초대 코드</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/teacher/missions">
          <Card hover className="p-6">
            <div className="text-2xl mb-2">📋</div>
            <h2 className="text-lg font-semibold mb-1">미션 관리</h2>
            <p className="text-gray-500 text-sm">주간 관찰 미션을 만들고, 학생들의 일지를 보드로 확인합니다</p>
          </Card>
        </Link>
        <Card className="p-6">
          <div className="text-2xl mb-2">👨‍🏫</div>
          <h2 className="text-lg font-semibold mb-1">학급 초대</h2>
          <p className="text-gray-500 text-sm mb-3">학생들에게 아래 초대 코드를 공유하세요</p>
          <div className="bg-gray-50 rounded-lg px-4 py-2 font-mono text-center text-lg tracking-widest font-bold text-gray-800">
            {user?.classId?.slice(0, 6).toUpperCase() || "—"}
          </div>
        </Card>
      </div>

      {activeMissions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">진행중인 미션</h2>
          <div className="space-y-2">
            {activeMissions.slice(0, 3).map((m) => (
              <Link key={m.id} href={`/teacher/board/${m.id}`}>
                <Card hover className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{m.title}</h3>
                    {m.description && (
                      <p className="text-sm text-gray-400 truncate max-w-md">{m.description}</p>
                    )}
                  </div>
                  <span className="text-gray-300">&rarr;</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
