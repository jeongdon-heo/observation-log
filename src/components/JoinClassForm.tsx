"use client";

import { useState } from "react";
import { findClassByInviteCode, joinClass } from "@/lib/firestore";
import { Button } from "@/components/ui";

interface JoinClassFormProps {
  uid: string;
  onJoined: () => void;
}

export default function JoinClassForm({ uid, onJoined }: JoinClassFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError("초대 코드는 6자리입니다.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const classId = await findClassByInviteCode(code);
      if (!classId) {
        setError("유효하지 않은 초대 코드입니다. 선생님에게 다시 확인해주세요.");
        return;
      }
      await joinClass(uid, classId);
      onJoined();
    } catch {
      setError("반 참여에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div>
          <div className="text-5xl mb-4">🏫</div>
          <h2 className="text-xl font-bold">반에 참여하기</h2>
          <p className="text-sm text-gray-500 mt-2">
            선생님이 알려준 6자리 초대 코드를 입력해주세요
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="초대 코드 6자리"
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, 6))}
            maxLength={6}
            className="w-full px-4 py-4 border-2 rounded-xl text-center text-2xl font-mono tracking-[0.5em] uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            type="submit"
            loading={loading}
            disabled={code.trim().length !== 6}
            className="w-full"
            size="lg"
          >
            반 참여하기
          </Button>
        </form>
      </div>
    </div>
  );
}
