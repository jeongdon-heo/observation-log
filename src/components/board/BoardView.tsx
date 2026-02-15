"use client";

import { useState, useEffect } from "react";
import type { Post, LayoutType } from "@/types";
import WallLayout from "./WallLayout";
import StreamLayout from "./StreamLayout";
import GridLayout from "./GridLayout";
import LayoutToggle from "./LayoutToggle";
import { EmptyState } from "@/components/ui";

interface BoardViewProps {
  posts: Post[];
  defaultLayout?: LayoutType;
  onDelete?: (postId: string) => void;
}

export default function BoardView({ posts, defaultLayout = "wall", onDelete }: BoardViewProps) {
  const [layout, setLayout] = useState<LayoutType>(defaultLayout);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const activeLayout = isMobile ? "stream" : layout;

  if (posts.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="아직 작성된 관찰 일지가 없습니다"
        description="학생들이 관찰 일지를 작성하면 여기에 표시됩니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      {!isMobile && (
        <div className="flex justify-end">
          <LayoutToggle current={layout} onChange={setLayout} />
        </div>
      )}

      {activeLayout === "wall" && <WallLayout posts={posts} onDelete={onDelete} />}
      {activeLayout === "stream" && <StreamLayout posts={posts} onDelete={onDelete} />}
      {activeLayout === "grid" && <GridLayout posts={posts} onDelete={onDelete} />}
    </div>
  );
}
