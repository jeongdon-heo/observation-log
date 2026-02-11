"use client";

import { useState } from "react";
import type { Post, LayoutType } from "@/types";
import WallLayout from "./WallLayout";
import StreamLayout from "./StreamLayout";
import GridLayout from "./GridLayout";
import LayoutToggle from "./LayoutToggle";
import { EmptyState } from "@/components/ui";

interface BoardViewProps {
  posts: Post[];
  defaultLayout?: LayoutType;
}

export default function BoardView({ posts, defaultLayout = "wall" }: BoardViewProps) {
  const [layout, setLayout] = useState<LayoutType>(defaultLayout);

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
      <div className="flex justify-end">
        <LayoutToggle current={layout} onChange={setLayout} />
      </div>

      {layout === "wall" && <WallLayout posts={posts} />}
      {layout === "stream" && <StreamLayout posts={posts} />}
      {layout === "grid" && <GridLayout posts={posts} />}
    </div>
  );
}
