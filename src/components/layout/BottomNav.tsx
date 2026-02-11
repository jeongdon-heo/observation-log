"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/student",          label: "홈",       icon: "🏠", activeIcon: "🏠" },
  { href: "/student/gallery",  label: "갤러리",   icon: "🖼️", activeIcon: "🖼️" },
  { href: "/student/my-log",   label: "내 기록",  icon: "📓", activeIcon: "📓" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t safe-area-bottom">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="text-xl leading-none">
                {isActive ? item.activeIcon : item.icon}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? "text-blue-600" : ""}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
