// 모든 타입을 db.ts에서 re-export
export {
  // 역할/상수 타입
  type UserRole,
  type LayoutType,
  type WeatherType,
  type CommentAuthorType,

  // Firestore 문서 타입 (Timestamp)
  type DBUser,
  type DBMission,
  type DBPost,
  type DBComment,

  // 클라이언트 타입 (Date)
  type User,
  type Mission,
  type Post,
  type Comment,

  // 옵션/상수
  type LayoutOption,
  type WeatherOption,
  LAYOUT_OPTIONS,
  WEATHER_OPTIONS,
} from "./db";
