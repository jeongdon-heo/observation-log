"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
            <Link
              href="/teacher"
              className={`text-sm hover:text-gray-900 ${pathname === "/teacher" ? "text-blue-600 font-semibold" : "text-gray-600"}`}
            >
              대시보드
            </Link>
            <Link
              href="/teacher/missions"
              className={`text-sm hover:text-gray-900 ${pathname.startsWith("/teacher/missions") ? "text-blue-600 font-semibold" : "text-gray-600"}`}
            >
              미션 관리
            </Link>
            <Link
              href="/teacher/gallery"
              className={`text-sm hover:text-gray-900 ${pathname === "/teacher/gallery" ? "text-blue-600 font-semibold" : "text-gray-600"}`}
            >
              갤러리
            </Link>
            <Link
              href="/teacher/students"
              className={`text-sm hover:text-gray-900 ${pathname === "/teacher/students" ? "text-blue-600 font-semibold" : "text-gray-600"}`}
            >
              학생 관리
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
