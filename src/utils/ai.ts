import { GoogleGenerativeAI, Part } from "@google/generative-ai";

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
}

const SYSTEM_INSTRUCTION = `당신은 다정하고 호기심 많은 초등학교 선생님입니다.

학생이 올린 관찰 일지(사진과 글)를 분석해서:
1. 학생의 관찰 내용 중 구체적인 부분을 골라 진심으로 칭찬해주세요.
2. 관찰 내용과 관련된 호기심을 자극하는 질문을 딱 하나 던져주세요.

규칙:
- 초등학생 눈높이에 맞는 쉽고 따뜻한 말투를 사용하세요.
- 3~4문장 이내로 짧게 작성하세요.
- 이모지를 1~2개 자연스럽게 사용하세요.
- JSON이 아닌, 바로 읽을 수 있는 문자열 댓글로 작성하세요.
- 사진이 있다면 사진에서 관찰할 수 있는 내용도 함께 언급해주세요.`;

/**
 * 이미지 URL을 fetch해서 Gemini에 전달할 수 있는 inline data로 변환
 */
async function urlToGenerativePart(imageUrl: string): Promise<Part | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = res.headers.get("content-type") || "image/jpeg";

    return {
      inlineData: { data: base64, mimeType },
    };
  } catch {
    return null;
  }
}

async function callWithRetry(
  fn: () => Promise<string>,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const is429 =
        err instanceof Error && err.message.includes("429");
      if (is429 && attempt < maxRetries - 1) {
        const delay = (attempt + 1) * 3000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("재시도 횟수 초과");
}

/**
 * 학생의 관찰 일지(글 + 사진)를 분석하여 AI 칭찬 댓글을 생성합니다.
 * 서버사이드(API Route)에서만 호출해야 합니다.
 */
export async function generateAIComment(params: {
  authorName: string;
  missionTitle: string;
  content: string;
  photoUrls: string[];
}): Promise<string> {
  const { authorName, missionTitle, content, photoUrls } = params;

  const model = getGenAI().getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const textPrompt = `학생 이름: ${authorName}
관찰 미션: ${missionTitle}
관찰 내용: ${content}`;

  // 이미지가 있으면 멀티모달로 전송 (최대 3장)
  const imageParts: Part[] = [];
  if (photoUrls.length > 0) {
    const targets = photoUrls.slice(0, 3);
    const results = await Promise.all(targets.map(urlToGenerativePart));
    for (const part of results) {
      if (part) imageParts.push(part);
    }
  }

  const parts: Part[] = [
    { text: textPrompt },
    ...imageParts,
  ];

  return callWithRetry(async () => {
    const result = await model.generateContent(parts);
    return result.response.text();
  });
}

const MISSION_DESCRIPTION_INSTRUCTION = `당신은 초등학교 자연 관찰 수업을 설계하는 베테랑 교사입니다.

미션 제목을 보고, 학생들에게 안내할 관찰 미션 설명을 작성해주세요.

규칙:
- 초등학생이 이해하기 쉬운 친근한 말투로 작성하세요.
- 무엇을 관찰해야 하는지 구체적으로 안내하세요.
- 반드시 관찰하면서 느낀 점이나 생각을 함께 적도록 유도하는 문장을 포함하세요.
  예: "관찰하면서 어떤 생각이 들었는지", "느낌이나 궁금한 점도 함께 적어보세요" 등
- 5~7문장 이내로 작성하세요.
- 이모지를 2~3개 자연스럽게 사용하세요.
- JSON이 아닌, 바로 읽을 수 있는 문자열로 작성하세요.`;

/**
 * 미션 제목을 기반으로 AI가 미션 설명을 생성합니다.
 */
export async function generateMissionDescription(title: string): Promise<string> {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: MISSION_DESCRIPTION_INSTRUCTION,
  });

  return callWithRetry(async () => {
    const result = await model.generateContent(`미션 제목: ${title}`);
    return result.response.text();
  });
}
