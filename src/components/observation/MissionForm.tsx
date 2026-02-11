"use client";

import { useState } from "react";
import type { LayoutType } from "@/types";
import { LAYOUT_OPTIONS } from "@/types";
import Button from "@/components/ui/Button";

interface MissionFormData {
  title: string;
  description: string;
  layoutType: LayoutType;
  weekLabel: string;
  startDate: string;
  endDate: string;
  exampleImage?: File;
}

interface MissionFormProps {
  onSubmit: (data: MissionFormData) => Promise<void>;
  loading?: boolean;
  onCancel: () => void;
}

export default function MissionForm({ onSubmit, loading = false, onCancel }: MissionFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [layoutType, setLayoutType] = useState<LayoutType>("wall");
  const [weekLabel, setWeekLabel] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [exampleImage, setExampleImage] = useState<File | undefined>();
  const [preview, setPreview] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExampleImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ title, description, layoutType, weekLabel, startDate, endDate, exampleImage });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">미션 제목</label>
        <input
          type="text"
          placeholder="예: 봄의 식물 관찰"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
        <textarea
          placeholder="학생들에게 안내할 내용을 적어주세요"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">주차 라벨</label>
        <input
          type="text"
          placeholder="예: 3주차, 4월 2주"
          value={weekLabel}
          onChange={(e) => setWeekLabel(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 예시 사진 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          예시 사진 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition">
          {preview ? (
            <img src={preview} alt="예시" className="h-full object-cover rounded-lg" />
          ) : (
            <span className="text-sm text-gray-400">클릭하여 업로드</span>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        </label>
      </div>

      {/* 보드 레이아웃 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">보드 레이아웃</label>
        <div className="grid grid-cols-3 gap-2">
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLayoutType(opt.value)}
              className={`p-3 rounded-lg border-2 text-center transition ${
                layoutType === opt.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 미션 기간 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          취소
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          미션 만들기
        </Button>
      </div>
    </form>
  );
}
