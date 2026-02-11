"use client";

import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { createMission, getMissionsByClass } from "@/lib/firestore";
import { uploadImage } from "@/lib/storage";
import { MissionCard, MissionForm } from "@/components/observation";
import { Button, Modal, EmptyState, Spinner } from "@/components/ui";
import type { Mission, LayoutType } from "@/types";

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchMissions = async () => {
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
  };

  useEffect(() => {
    fetchMissions();
  }, [user?.classId]);

  const handleCreate = async (data: {
    title: string;
    description: string;
    layoutType: LayoutType;
    weekLabel: string;
    startDate: string;
    endDate: string;
    exampleImage?: File;
  }) => {
    if (!user) return;
    setSubmitting(true);
    try {
      let exampleImageUrl: string | null = null;
      if (data.exampleImage) {
        exampleImageUrl = await uploadImage(data.exampleImage, "missions");
      }

      await createMission({
        classId: user.classId,
        teacherId: user.uid,
        title: data.title,
        description: data.description,
        exampleImageUrl,
        layoutType: data.layoutType,
        isActive: true,
        weekLabel: data.weekLabel,
        startDate: Timestamp.fromDate(new Date(data.startDate)),
        endDate: Timestamp.fromDate(new Date(data.endDate)),
      });
      setShowModal(false);
      await fetchMissions();
    } catch (err) {
      console.error("미션 생성 실패:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">미션 관리</h1>
        <Button onClick={() => setShowModal(true)}>+ 새 미션 만들기</Button>
      </div>

      {missions.length === 0 ? (
        <EmptyState
          icon="📋"
          title="아직 만든 미션이 없습니다"
          description="새 미션을 만들어 학생들의 관찰 활동을 시작해보세요!"
        >
          <Button onClick={() => setShowModal(true)} size="sm">
            첫 미션 만들기
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} role="teacher" />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="새 미션 만들기">
        <MissionForm
          onSubmit={handleCreate}
          loading={submitting}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
