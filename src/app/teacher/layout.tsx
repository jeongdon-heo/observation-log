"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user || user.role !== "teacher") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/teacher" className="font-bold text-lg text-blue-600">
            관찰 일지 - 선생님
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/teacher/missions" className="text-sm text-gray-600 hover:text-gray-900">
              미션 관리
            </Link>
            <span className="text-sm text-gray-400">{user.name}</span>
            <button
              onClick={() => signOut().then(() => router.push("/"))}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              로그아웃
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
