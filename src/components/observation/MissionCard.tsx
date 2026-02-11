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
}

export default function MissionCard({ mission, role }: MissionCardProps) {
  const href =
    role === "teacher"
      ? `/teacher/board/${mission.id}`
      : `/student/write/${mission.id}`;

  const layoutLabel = LAYOUT_OPTIONS.find((o) => o.value === mission.layoutType)?.label ?? "";

  return (
    <Link href={href}>
      <Card hover className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-gray-900 text-lg">{mission.title}</h3>
          <div className="flex items-center gap-2">
            {mission.weekLabel && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {mission.weekLabel}
              </span>
            )}
            {mission.isActive ? (
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
        </div>
      </Card>
    </Link>
  );
}
