"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "teacher" ? "/teacher" : "/student");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">세상 돋보기</h1>
          <p className="text-gray-600 text-lg">우리 반 관찰 일지를 함께 기록해요</p>
        </div>
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full bg-blue-500 text-white py-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="block w-full bg-white text-blue-500 border-2 border-blue-500 py-3 rounded-lg text-lg font-medium hover:bg-blue-50 transition"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
