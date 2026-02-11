"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  hideNav?: boolean;
}

/**
 * 로그인된 사용자용 앱 셸.
 * TopBar + 콘텐츠 + BottomNav를 감싼다.
 */
export default function AppShell({ children, title, hideNav = false }: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title={title} />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-24">
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
