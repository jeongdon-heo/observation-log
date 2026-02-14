import { Timestamp } from "firebase/firestore";

// ============================================================
//  Firestore 컬렉션별 문서 타입 정의
//  컬렉션 경로: /users, /missions, /posts, /comments
// ============================================================

// ==================== 1. Users ====================
// 컬렉션: /users/{uid}
// 문서 ID = Firebase Auth uid

export type UserRole = "teacher" | "student";

export interface DBUser {
  uid: string;
  role: UserRole;
  name: string;                  // 이름 (예: "김민수", "박선생")
  profileImageUrl: string | null; // 프로필 사진 URL
  classId: string;               // 소속 학급 ID
  email: string;
  managedPassword?: string;      // 교사가 생성한 계정의 비밀번호 (교사 확인/수정용)
  previousClassIds?: string[];   // 이전 학급 ID 목록 (교사 전용, 새 학급 생성 시 기존 classId 보관)
  createdAt: Timestamp;
}

// ==================== 2. Missions ====================
// 컬렉션: /missions/{missionId}
// 교사가 매주 올리는 관찰 미션

export type LayoutType = "wall" | "stream" | "grid";

export interface DBMission {
  id: string;
  classId: string;                // 소속 학급 ID
  teacherId: string;              // 작성 교사 uid
  title: string;                  // 미션 제목 (예: "봄의 식물 관찰")
  description: string;            // 미션 설명 / 안내문
  exampleImageUrl: string | null; // 예시 사진 URL
  layoutType: LayoutType;         // 보드 레이아웃 선택 (담벼락/스트림/격자)
  isActive: boolean;              // 진행중 여부
  weekLabel: string;              // 주차 라벨 (예: "3주차", "4월 2주")
  startDate: Timestamp;           // 미션 시작일
  endDate: Timestamp;             // 미션 마감일
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== 3. Posts ====================
// 컬렉션: /posts/{postId}
// 학생이 올린 관찰 일지

export type WeatherType =
  | "sunny"    // 맑음 ☀️
  | "cloudy"   // 흐림 ☁️
  | "rainy"    // 비 🌧️
  | "snowy"    // 눈 ❄️
  | "windy";   // 바람 💨

export interface DBPost {
  id: string;
  authorId: string;              // 작성자 uid (→ users.uid)
  authorName: string;            // 작성자 이름 (비정규화, 목록 표시용)
  missionId: string;             // 소속 미션 ID (→ missions.id)
  classId: string;               // 소속 학급 ID
  photoUrls: string[];           // 관찰 사진 URL 배열 (최대 5장)
  content: string;               // 관찰 내용
  weather: WeatherType;          // 관찰 당시 날씨
  isPublic: boolean;             // 공개 여부 (false면 교사만 열람)
  academicYear?: number;         // 학년도 (예: 2025 = 2025학년도, 3월~익년2월)
  observedAt: Timestamp;         // 관찰 날짜 (학생이 선택)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ==================== 4. Comments ====================
// 컬렉션: /comments/{commentId}
// AI 자동 칭찬 댓글 + 친구 댓글 통합

export type CommentAuthorType = "ai" | "student" | "teacher";

export interface DBComment {
  id: string;
  postId: string;                // 대상 게시글 ID (→ posts.id)
  authorType: CommentAuthorType; // 작성자 유형: AI / 학생 / 교사
  authorId: string | null;       // 작성자 uid (AI일 경우 null)
  authorName: string;            // 표시 이름 ("AI 선생님" / 학생이름 / 교사이름)
  content: string;               // 댓글 내용
  createdAt: Timestamp;
}

// ==================== 5. Galleries ====================
// 컬렉션: /galleries/{galleryId}
// 학년도별 갤러리 관리

export type GalleryStatus = "open" | "closed";

export interface DBGallery {
  id: string;
  classId: string;               // 소속 학급 ID
  academicYear: number;          // 학년도 (예: 2025)
  status: GalleryStatus;         // 진행중 / 마감
  createdAt: Timestamp;
  closedAt?: Timestamp;          // 마감일
}

// ============================================================
//  클라이언트용 타입 (Timestamp → Date 변환 버전)
//  Firestore에서 읽은 뒤 변환하여 컴포넌트에서 사용
// ============================================================

export interface User extends Omit<DBUser, "createdAt"> {
  createdAt: Date;
}

export interface Mission extends Omit<DBMission, "startDate" | "endDate" | "createdAt" | "updatedAt"> {
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post extends Omit<DBPost, "observedAt" | "createdAt" | "updatedAt"> {
  observedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment extends Omit<DBComment, "createdAt"> {
  createdAt: Date;
}

export interface Gallery extends Omit<DBGallery, "createdAt" | "closedAt"> {
  createdAt: Date;
  closedAt?: Date;
}

// ============================================================
//  상수 / 셀렉트 옵션
// ============================================================

export interface LayoutOption {
  value: LayoutType;
  label: string;
  description: string;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  { value: "wall",   label: "담벼락형", description: "패들렛처럼 자유롭게 배치" },
  { value: "stream", label: "스트림형", description: "시간순 세로 나열" },
  { value: "grid",   label: "격자형",   description: "카드를 균일한 격자로 배치" },
];

export interface WeatherOption {
  value: WeatherType;
  label: string;
  emoji: string;
}

export const WEATHER_OPTIONS: WeatherOption[] = [
  { value: "sunny",  label: "맑음", emoji: "☀️" },
  { value: "cloudy", label: "흐림", emoji: "☁️" },
  { value: "rainy",  label: "비",   emoji: "🌧️" },
  { value: "snowy",  label: "눈",   emoji: "❄️" },
  { value: "windy",  label: "바람", emoji: "💨" },
];
