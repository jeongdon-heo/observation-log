"use client";

import { useState, useEffect, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { createMission, getMissionsByClass, deleteMission } from "@/lib/firestore";
import { MissionCard } from "@/components/observation";
import { LAYOUT_OPTIONS } from "@/types";
import type { Mission, LayoutType } from "@/types";

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [layoutType, setLayoutType] = useState<LayoutType>("wall");
  const [weekLabel, setWeekLabel] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");

  const handleAIDescription = async () => {
    if (!title.trim()) {
      setError("미션 제목을 먼저 입력해주세요.");
      return;
    }
    setAiLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
      } else {
        setError("AI 설명 생성에 실패했습니다.");
      }
    } catch {
      setError("AI 설명 생성에 실패했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchMissions = useCallback(async () => {
    if (!user?.classId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getMissionsByClass(user.classId);
      setMissions(data);
    } catch (err) {
      console.error("미션 목록 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.classId]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createMission({
        classId: user.classId,
        teacherId: user.uid,
        title,
        description,
        exampleImageUrl: null,
        layoutType,
        isActive: true,
        weekLabel,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
      });

      setTitle("");
      setDescription("");
      setWeekLabel("");
      setEndDate("");
      setSuccess("미션이 생성되었습니다!");
      await fetchMissions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("미션 생성 실패:", err);
      setError(`미션 생성 실패: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">미션 관리</h1>

      {/* 미션 생성 폼 - 항상 표시 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-bold mb-4">새 미션 만들기</h2>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">미션 제목</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="예: 봄의 식물 관찰"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">설명</label>
              <button
                type="button"
                onClick={handleAIDescription}
                disabled={aiLoading || !title.trim()}
                className="px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full hover:bg-purple-600 transition disabled:opacity-50 flex items-center gap-1"
              >
                {aiLoading ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    생성 중...
                  </>
                ) : (
                  "AI 설명 생성"
                )}
              </button>
            </div>
            <textarea
              id="description"
              name="description"
              placeholder="학생들에게 안내할 내용을 적어주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label htmlFor="weekLabel" className="block text-sm font-medium text-gray-700 mb-1">주차 라벨</label>
            <input
              id="weekLabel"
              name="weekLabel"
              type="text"
              placeholder="예: 1주차, 4월 2주"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">보드 레이아웃</label>
            <select
              name="layoutType"
              value={layoutType}
              onChange={(e) => setLayoutType(e.target.value as LayoutType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LAYOUT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} - {opt.description}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50"
          >
            {submitting ? "생성 중..." : "미션 만들기"}
          </button>
        </form>
      </div>

      {/* 미션 목록 */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : missions.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">미션 목록</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                role="teacher"
                onDelete={async (id) => {
                  try {
                    await deleteMission(id);
                    setMissions((prev) => prev.filter((m) => m.id !== id));
                  } catch (err) {
                    console.error("미션 삭제 실패:", err);
                  }
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
