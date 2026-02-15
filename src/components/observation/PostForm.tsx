"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useState, useRef, useEffect, useCallback } from "react";
import type { WeatherType } from "@/types";
import { WEATHER_OPTIONS } from "@/types";
import Button from "@/components/ui/Button";

interface PostFormData {
  content: string;
  files: File[];
  weather: WeatherType;
  isPublic: boolean;
  observedAt: string; // yyyy-MM-dd
}

interface PostFormInitialData {
  content: string;
  weather: WeatherType;
  isPublic: boolean;
  observedAt: string;
  photoUrls: string[];
}

interface PostFormProps {
  onSubmit: (data: PostFormData) => Promise<void>;
  loading?: boolean;
  loadingMessage?: string;
  initialData?: PostFormInitialData;
}

export default function PostForm({ onSubmit, loading = false, loadingMessage, initialData }: PostFormProps) {
  const isEdit = !!initialData;
  const [content, setContent] = useState(initialData?.content ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(initialData?.photoUrls ?? []);
  const [weather, setWeather] = useState<WeatherType>(initialData?.weather ?? "sunny");
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [observedAt, setObservedAt] = useState(
    initialData?.observedAt ?? new Date().toISOString().split("T")[0]
  );
  const [existingPhotos] = useState<string[]>(initialData?.photoUrls ?? []);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const wantListeningRef = useRef(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setSpeechSupported(true);
  }, []);

  const startRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const result = event.results[0];
      if (result.isFinal) {
        setContent((prev) => prev + result[0].transcript + " ");
        setInterimText("");
      } else {
        setInterimText(result[0].transcript);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (wantListeningRef.current) {
        // 사용자가 아직 듣기 원하면 자동 재시작
        startRecognition();
      } else {
        setIsListening(false);
        setInterimText("");
      }
    };

    recognition.onerror = (e: any) => {
      recognitionRef.current = null;
      // no-speech는 무시하고 재시작
      if (e.error === "no-speech" && wantListeningRef.current) {
        startRecognition();
        return;
      }
      wantListeningRef.current = false;
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      wantListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      wantListeningRef.current = true;
      setIsListening(true);
      startRecognition();
    }
  }, [isListening, startRecognition]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const totalCount = existingPhotos.length + selected.length;
    if (totalCount > 5) {
      alert("사진은 최대 5장까지 첨부할 수 있어요.");
      return;
    }
    // 새 파일 미리보기만 해제 (기존 URL은 유지)
    previews.filter((url) => !existingPhotos.includes(url)).forEach((url) => URL.revokeObjectURL(url));
    setFiles(selected);
    setPreviews([...existingPhotos, ...selected.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ content, files, weather, isPublic, observedAt });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 관찰 내용 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">관찰 내용</label>
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                isListening
                  ? "bg-red-100 text-red-600 animate-pulse"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {isListening ? "🔴 듣는 중..." : "🎤 음성 입력"}
            </button>
          )}
        </div>
        <div className="relative">
          <textarea
            placeholder="무엇을 관찰했나요? 자세히 적어보세요!"
            value={content + interimText}
            onChange={(e) => {
              setContent(e.target.value);
              setInterimText("");
            }}
            required
            rows={6}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
              isListening ? "border-red-300 bg-red-50/30" : "border-gray-300"
            }`}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {content.length}자
          {interimText && <span className="text-red-400 ml-2">음성 인식 중...</span>}
        </p>
      </div>

      {/* 사진 첨부 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사진 첨부 <span className="text-gray-400 font-normal">(최대 5장)</span>
        </label>
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition">
          <span className="text-2xl mb-1">📷</span>
          <span className="text-sm text-gray-500">클릭해서 사진을 선택하세요</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {previews.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {previews.map((src, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img src={src} alt={`미리보기 ${i + 1}`} className="h-20 w-20 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 날씨 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">오늘 날씨</label>
        <div className="flex gap-2">
          {WEATHER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setWeather(opt.value)}
              className={`flex flex-col items-center px-3 py-2 rounded-lg border-2 transition text-sm ${
                weather === opt.value
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-xs mt-0.5">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 관찰 날짜 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">관찰 날짜</label>
        <input
          type="date"
          value={observedAt}
          onChange={(e) => setObservedAt(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* 공개 여부 */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500" />
        </label>
        <span className="text-sm text-gray-600">
          {isPublic ? "친구들에게 공개" : "선생님만 볼 수 있음"}
        </span>
      </div>

      <Button type="submit" loading={loading} size="lg" className="w-full bg-green-500 hover:bg-green-600">
        {loading && loadingMessage ? loadingMessage : isEdit ? "수정 완료" : "관찰 일지 올리기"}
      </Button>
    </form>
  );
}
