"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  const isTeacher = user?.role === "teacher";
  const color = isTeacher ? "text-blue-600" : "text-green-600";
  const homeLink = isTeacher ? "/teacher" : "/student";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={homeLink} className={`font-bold text-lg ${color}`}>
          {title || "세상 돋보기"}
        </Link>
        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-500">{user.name}</span>}
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-red-500 transition"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
