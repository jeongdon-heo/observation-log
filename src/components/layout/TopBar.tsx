"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

interface TopBarProps {
  title?: string;
  showProfile?: boolean;
}

export default function TopBar({ title = "관찰 일지", showProfile = true }: TopBarProps) {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="font-bold text-lg text-gray-900">{title}</h1>

        {showProfile && user && (
          <div className="flex items-center gap-3">
            {/* 프로필 아바타 */}
            <div className="flex items-center gap-2">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user.name}
              </span>
            </div>

            <button
              onClick={() => signOut().then(() => router.push("/login"))}
              className="text-xs text-gray-400 hover:text-red-500 transition"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
