import { NextRequest, NextResponse } from "next/server";
import { generateMissionDescription } from "@/utils/ai";

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "미션 제목이 필요합니다." },
        { status: 400 }
      );
    }

    const description = await generateMissionDescription(title);

    return NextResponse.json({ description });
  } catch (error) {
    console.error("AI 설명 생성 실패:", error);
    return NextResponse.json(
      { error: "AI 설명 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
