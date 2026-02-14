"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getMissionsByClass, getStudentsByClass, findClassIdByCode, updateUser } from "@/lib/firestore";
import { createNewClass, revertToPreviousClass } from "@/lib/auth";
import { Card, Spinner } from "@/components/ui";
import type { Mission, User } from "@/types";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (!user?.classId) {
        setLoading(false);
        return;
      }
      try {
        const [missionData, studentData] = await Promise.all([
          getMissionsByClass(user.classId),
          getStudentsByClass(user.classId),
        ]);
        setMissions(missionData);
        setStudents(studentData);
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
      <h1 className="text-2xl font-bold">{user?.name}의 대시보드</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 text-center">
          <p className="text-3xl font-bold text-blue-600">{missions.length}</p>
          <p className="text-sm text-gray-500 mt-1">전체 미션</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{activeMissions.length}</p>
          <p className="text-sm text-gray-500 mt-1">진행중 미션</p>
        </Card>
        <Link href="/teacher/students">
          <Card hover className="p-5 text-center h-full">
            <p className="text-3xl font-bold text-orange-500">{students.length}</p>
            <p className="text-sm text-gray-500 mt-1">학생 수</p>
          </Card>
        </Link>
        <Card className="p-5 text-center">
          <p className="text-lg font-mono font-bold text-purple-600 tracking-wider">
            {user?.classId?.slice(0, 6).toUpperCase() || "—"}
          </p>
          <p className="text-sm text-gray-500 mt-1">학급 초대 코드</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/teacher/missions">
          <Card hover className="p-6 h-full">
            <div className="text-2xl mb-2">📋</div>
            <h2 className="text-lg font-semibold mb-1">미션 관리</h2>
            <p className="text-gray-500 text-sm">주간 관찰 미션을 만들고, 학생들의 일지를 보드로 확인합니다</p>
          </Card>
        </Link>
        <Link href="/teacher/students">
          <Card hover className="p-6 h-full">
            <div className="text-2xl mb-2">👩‍👧‍👦</div>
            <h2 className="text-lg font-semibold mb-1">학생 관리</h2>
            <p className="text-gray-500 text-sm">학생 명단을 확인하고, 회원가입이 어려운 학생의 계정을 만들어줍니다</p>
          </Card>
        </Link>
        <Card className="p-6">
          <div className="text-2xl mb-2">👨‍🏫</div>
          <h2 className="text-lg font-semibold mb-1">학급 관리</h2>
          <p className="text-gray-500 text-sm mb-3">학생들에게 아래 초대 코드를 공유하세요</p>
          <div className="bg-gray-50 rounded-lg px-4 py-2 font-mono text-center text-lg tracking-widest font-bold text-gray-800">
            {user?.classId?.slice(0, 6).toUpperCase() || "—"}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={async () => {
                if (!user) return;
                const confirmed = window.confirm(
                  "새 학급을 만들면 현재 학급의 미션·학생 목록이 새로 시작됩니다.\n이전 학년도 갤러리는 자동 마감되며 계속 열람 가능합니다.\n\n새 학년도를 위한 새 학급을 만드시겠습니까?"
                );
                if (!confirmed) return;
                try {
                  await createNewClass(user.uid, user.classId, user.previousClassIds || []);
                  window.location.reload();
                } catch (err) {
                  console.error("새 학급 생성 실패:", err);
                }
              }}
              className="flex-1 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-100 transition"
            >
              새 학급 만들기
            </button>
            {user?.previousClassIds && user.previousClassIds.length > 0 && (
              <button
                onClick={async () => {
                  if (!user) return;
                  const confirmed = window.confirm(
                    "이전 학급으로 되돌리시겠습니까?\n현재 학급의 초대 코드는 사라집니다."
                  );
                  if (!confirmed) return;
                  try {
                    await revertToPreviousClass(user.uid, user.classId, user.previousClassIds || []);
                    window.location.reload();
                  } catch (err) {
                    console.error("학급 되돌리기 실패:", err);
                  }
                }}
                className="flex-1 px-4 py-2 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-100 transition"
              >
                되돌리기
              </button>
            )}
          </div>
          <button
            onClick={async () => {
              if (!user) return;
              const code = window.prompt("이전 학급의 초대 코드 6자리를 입력하세요:");
              if (!code || code.trim().length < 6) return;
              try {
                const oldClassId = await findClassIdByCode(code.trim());
                if (!oldClassId) {
                  alert("해당 초대 코드의 학급을 찾을 수 없습니다.");
                  return;
                }
                if (oldClassId === user.classId) {
                  alert("현재 학급과 같은 코드입니다.");
                  return;
                }
                const prev = user.previousClassIds || [];
                if (prev.includes(oldClassId)) {
                  alert("이미 연결된 학급입니다.");
                  return;
                }
                await updateUser(user.uid, {
                  previousClassIds: [...prev, oldClassId],
                });
                alert("이전 학급이 연결되었습니다. 갤러리에서 확인하세요.");
                window.location.reload();
              } catch (err) {
                console.error("이전 학급 연결 실패:", err);
                alert("이전 학급 연결에 실패했습니다.");
              }
            }}
            className="w-full mt-2 px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-100 transition"
          >
            이전 학급 연결
          </button>
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
