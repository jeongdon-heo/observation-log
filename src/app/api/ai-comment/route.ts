import { NextRequest, NextResponse } from "next/server";
import { generateAIComment } from "@/utils/ai";
import { createComment } from "@/lib/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { postId, authorName, missionTitle, content, photoUrls } =
      await request.json();

    if (!postId || !authorName || !content) {
      return NextResponse.json(
        { error: "필수 항목이 누락되었습니다." },
        { status: 400 }
      );
    }

    // Gemini AI로 칭찬 댓글 생성 (글 + 사진 분석)
    const praiseContent = await generateAIComment({
      authorName,
      missionTitle: missionTitle || "관찰 미션",
      content,
      photoUrls: photoUrls || [],
    });

    // Firestore에 AI 댓글 저장
    const commentId = await createComment({
      postId,
      authorType: "ai",
      authorId: null,
      authorName: "AI 선생님",
      content: praiseContent,
    });

    return NextResponse.json({
      id: commentId,
      content: praiseContent,
    });
  } catch (error) {
    console.error("AI 댓글 생성 실패:", error);
    return NextResponse.json(
      { error: "AI 댓글 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
