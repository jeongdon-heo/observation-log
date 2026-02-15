"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Mission } from "@/types";
import { LAYOUT_OPTIONS } from "@/types";
import Card from "@/components/ui/Card";

interface MissionCardProps {
  mission: Mission;
  role: "teacher" | "student";
  onDelete?: (missionId: string) => void;
}

export default function MissionCard({ mission, role, onDelete }: MissionCardProps) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(mission.startDate.getFullYear(), mission.startDate.getMonth(), mission.startDate.getDate());
  const endDay = new Date(mission.endDate.getFullYear(), mission.endDate.getMonth(), mission.endDate.getDate());
  const isWithinPeriod = today >= startDay && today <= endDay;

  const href =
    role === "teacher"
      ? `/teacher/board/${mission.id}`
      : isWithinPeriod
        ? `/student/write/${mission.id}`
        : undefined;

  const layoutLabel = LAYOUT_OPTIONS.find((o) => o.value === mission.layoutType)?.label ?? "";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`"${mission.title}" 미션을 삭제하시겠습니까?\n관련된 학생 일지는 유지됩니다.`)) {
      onDelete?.(mission.id);
    }
  };

  const cardContent = (
    <Card hover={!!href} className={`p-5 space-y-3 ${!href && role === "student" ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-gray-900 text-lg">{mission.title}</h3>
        <div className="flex items-center gap-2">
          {mission.weekLabel && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {mission.weekLabel}
            </span>
          )}
          {role === "student" && !isWithinPeriod ? (
            <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">
              {today < startDay ? "시작 전" : "마감"}
            </span>
          ) : mission.isActive ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              진행중
            </span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
              마감
            </span>
          )}
        </div>
      </div>

      {mission.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{mission.description}</p>
      )}

      {mission.exampleImageUrl && (
        <img
          src={mission.exampleImageUrl}
          alt="예시 사진"
          className="w-full h-32 object-cover rounded-lg"
        />
      )}

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>{layoutLabel}</span>
        <span>·</span>
        <span>
          {format(mission.startDate, "M/d", { locale: ko })} ~ {format(mission.endDate, "M/d", { locale: ko })}
        </span>
        {onDelete && (
          <button
            onClick={handleDelete}
            className="ml-auto text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition"
          >
            삭제
          </button>
        )}
      </div>
    </Card>
  );

  if (!href) {
    return <div>{cardContent}</div>;
  }

  return <Link href={href}>{cardContent}</Link>;
}
