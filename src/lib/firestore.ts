import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,

  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  User,
  DBUser,
  Mission,
  DBMission,
  Post,
  DBPost,
  Comment,
  DBComment,
  Gallery,
  DBGallery,
} from "@/types";

// ==================== 헬퍼 ====================
const toDate = (ts: Timestamp | null | undefined): Date =>
  ts?.toDate() ?? new Date();

/** 학년도 계산: 3월~익년2월 기준 (getMonth: 0=1월, 2=3월) */
export function getAcademicYear(date?: Date): number {
  const d = date || new Date();
  return d.getMonth() >= 2 ? d.getFullYear() : d.getFullYear() - 1;
}

// ==================== Users ====================

export async function setUser(data: Omit<DBUser, "createdAt">) {
  await setDoc(doc(db, "users", data.uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const d = snap.data() as DBUser;
  return { ...d, createdAt: toDate(d.createdAt) };
}

export async function updateUser(uid: string, data: Partial<DBUser>) {
  await updateDoc(doc(db, "users", uid), data);
}

export async function deleteUser(uid: string) {
  await deleteDoc(doc(db, "users", uid));
}

/** 학생 uid 이전: 유저 문서 복사 + posts/comments의 authorId 변경 */
export async function migrateStudentUid(
  oldUid: string,
  newUid: string,
  newEmail: string,
  newPassword: string
) {
  // 1. 기존 유저 문서 읽기
  const oldSnap = await getDoc(doc(db, "users", oldUid));
  if (!oldSnap.exists()) throw new Error("기존 유저 문서를 찾을 수 없습니다.");
  const oldData = oldSnap.data() as DBUser;

  // 2. 새 uid로 유저 문서 생성
  await setDoc(doc(db, "users", newUid), {
    ...oldData,
    uid: newUid,
    email: newEmail,
    managedPassword: newPassword,
  });

  // 3. 기존 유저 문서 삭제
  await deleteDoc(doc(db, "users", oldUid));

  // 4. posts의 authorId 업데이트
  const postsSnap = await getDocs(
    query(collection(db, "posts"), where("authorId", "==", oldUid))
  );
  for (const s of postsSnap.docs) {
    await updateDoc(doc(db, "posts", s.id), { authorId: newUid });
  }

  // 5. comments의 authorId 업데이트
  const commentsSnap = await getDocs(
    query(collection(db, "comments"), where("authorId", "==", oldUid))
  );
  for (const s of commentsSnap.docs) {
    await updateDoc(doc(db, "comments", s.id), { authorId: newUid });
  }
}

export async function findClassByInviteCode(code: string): Promise<string | null> {
  const normalizedCode = code.toLowerCase().trim();
  const q = query(
    collection(db, "users"),
    where("role", "==", "teacher")
  );
  const snap = await getDocs(q);
  for (const doc of snap.docs) {
    const d = doc.data() as DBUser;
    if (d.classId && d.classId.slice(0, 6) === normalizedCode) {
      return d.classId;
    }
  }
  return null;
}

/** 이전 학급 classId를 초대코드(앞6자리)로 갤러리/게시물에서 찾기 */
export async function findClassIdByCode(code: string): Promise<string | null> {
  const normalizedCode = code.toLowerCase().trim();
  // 갤러리에서 검색
  const gSnap = await getDocs(collection(db, "galleries"));
  for (const d of gSnap.docs) {
    const classId = (d.data() as DBGallery).classId;
    if (classId && classId.slice(0, 6) === normalizedCode) {
      return classId;
    }
  }
  // 게시물에서 검색
  const pSnap = await getDocs(query(collection(db, "posts"), where("classId", ">=", normalizedCode), where("classId", "<", normalizedCode + "\uf8ff")));
  if (pSnap.docs.length > 0) {
    return (pSnap.docs[0].data() as DBPost).classId;
  }
  return null;
}

export async function joinClass(uid: string, classId: string) {
  // 기존 classId가 있으면 previousClassIds에 보관
  const user = await getUser(uid);
  if (user && user.classId && user.classId !== classId) {
    const prev = user.previousClassIds || [];
    if (!prev.includes(user.classId)) {
      await updateDoc(doc(db, "users", uid), {
        classId,
        previousClassIds: [...prev, user.classId],
      });
      return;
    }
  }
  await updateDoc(doc(db, "users", uid), { classId });
}

export async function getStudentsByClass(classId: string): Promise<User[]> {
  const q = query(
    collection(db, "users"),
    where("classId", "==", classId),
    where("role", "==", "student")
  );
  const snap = await getDocs(q);
  const students = snap.docs.map((s) => {
    const d = s.data() as DBUser;
    return { ...d, createdAt: toDate(d.createdAt) };
  });
  return students.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

// ==================== Missions ====================

export async function createMission(
  data: Omit<DBMission, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "missions"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getMission(missionId: string): Promise<Mission | null> {
  const snap = await getDoc(doc(db, "missions", missionId));
  if (!snap.exists()) return null;
  const d = snap.data() as DBMission;
  return {
    ...d,
    id: snap.id,
    startDate: toDate(d.startDate),
    endDate: toDate(d.endDate),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export async function getMissionsByClass(classId: string): Promise<Mission[]> {
  const q = query(
    collection(db, "missions"),
    where("classId", "==", classId)
  );
  const snap = await getDocs(q);
  const missions = snap.docs.map((s) => {
    const d = s.data() as DBMission;
    return {
      ...d,
      id: s.id,
      startDate: toDate(d.startDate),
      endDate: toDate(d.endDate),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    };
  });
  return missions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updateMission(missionId: string, data: Partial<DBMission>) {
  await updateDoc(doc(db, "missions", missionId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMission(missionId: string) {
  await deleteDoc(doc(db, "missions", missionId));
}

// ==================== Posts ====================

export async function createPost(
  data: Omit<DBPost, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "posts"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPost(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, "posts", postId));
  if (!snap.exists()) return null;
  const d = snap.data() as DBPost;
  return {
    ...d,
    id: snap.id,
    observedAt: toDate(d.observedAt),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

export async function getPostsByMission(missionId: string): Promise<Post[]> {
  const q = query(
    collection(db, "posts"),
    where("missionId", "==", missionId)
  );
  const snap = await getDocs(q);
  const posts = snap.docs.map((s) => {
    const d = s.data() as DBPost;
    return {
      ...d,
      id: s.id,
      observedAt: toDate(d.observedAt),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    };
  });
  return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPostsByClass(classId: string, academicYear?: number): Promise<Post[]> {
  const q = query(
    collection(db, "posts"),
    where("classId", "==", classId),
    where("isPublic", "==", true)
  );
  const snap = await getDocs(q);
  let posts = snap.docs.map((s) => {
    const d = s.data() as DBPost;
    return {
      ...d,
      id: s.id,
      observedAt: toDate(d.observedAt),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    };
  });
  if (academicYear !== undefined) {
    posts = posts.filter((p) =>
      (p.academicYear ?? getAcademicYear(p.createdAt)) === academicYear
    );
  }
  return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getAllPostsByClass(classId: string, academicYear?: number): Promise<Post[]> {
  const q = query(
    collection(db, "posts"),
    where("classId", "==", classId)
  );
  const snap = await getDocs(q);
  let posts = snap.docs.map((s) => {
    const d = s.data() as DBPost;
    return {
      ...d,
      id: s.id,
      observedAt: toDate(d.observedAt),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    };
  });
  if (academicYear !== undefined) {
    posts = posts.filter((p) =>
      (p.academicYear ?? getAcademicYear(p.createdAt)) === academicYear
    );
  }
  return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** 여러 classId의 공개 게시물 조회 (학생 갤러리용) */
export async function getPostsByClassIds(classIds: string[], academicYear?: number): Promise<Post[]> {
  if (classIds.length === 0) return [];
  const results = await Promise.all(
    classIds.map((id) => getPostsByClass(id, academicYear))
  );
  const allPosts = results.flat();
  // 중복 제거 (같은 postId)
  const seen = new Set<string>();
  return allPosts
    .filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** 여러 classId의 전체 게시물 조회 (교사 갤러리용, 비공개 포함) */
export async function getAllPostsByClassIds(classIds: string[], academicYear?: number): Promise<Post[]> {
  if (classIds.length === 0) return [];
  const results = await Promise.all(
    classIds.map((id) => getAllPostsByClass(id, academicYear))
  );
  const allPosts = results.flat();
  const seen = new Set<string>();
  return allPosts
    .filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  const q = query(
    collection(db, "posts"),
    where("authorId", "==", authorId)
  );
  const snap = await getDocs(q);
  const posts = snap.docs.map((s) => {
    const d = s.data() as DBPost;
    return {
      ...d,
      id: s.id,
      observedAt: toDate(d.observedAt),
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
    };
  });
  return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updatePost(postId: string, data: Partial<DBPost>) {
  await updateDoc(doc(db, "posts", postId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(postId: string) {
  await deleteDoc(doc(db, "posts", postId));
}

// ==================== Comments ====================

export async function createComment(
  data: Omit<DBComment, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "comments"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  const q = query(
    collection(db, "comments"),
    where("postId", "==", postId)
  );
  const snap = await getDocs(q);
  const comments = snap.docs.map((s) => {
    const d = s.data() as DBComment;
    return {
      ...d,
      id: s.id,
      createdAt: toDate(d.createdAt),
    };
  });
  return comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// ==================== Galleries ====================

export async function createGallery(
  classId: string,
  academicYear: number
): Promise<string> {
  const ref = await addDoc(collection(db, "galleries"), {
    classId,
    academicYear,
    status: "open",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function closeGallery(galleryId: string) {
  await updateDoc(doc(db, "galleries", galleryId), {
    status: "closed",
    closedAt: serverTimestamp(),
  });
}

export async function reopenGallery(galleryId: string) {
  await updateDoc(doc(db, "galleries", galleryId), {
    status: "open",
    closedAt: null,
  });
}

export async function getGalleriesByClass(classId: string): Promise<Gallery[]> {
  const q = query(
    collection(db, "galleries"),
    where("classId", "==", classId)
  );
  const snap = await getDocs(q);
  const galleries = snap.docs.map((s) => {
    const d = s.data() as DBGallery;
    return {
      ...d,
      id: s.id,
      createdAt: toDate(d.createdAt),
      closedAt: d.closedAt ? toDate(d.closedAt) : undefined,
    };
  });
  return galleries.sort((a, b) => b.academicYear - a.academicYear);
}

/** 여러 classId의 갤러리를 한번에 가져오기 (교사의 현재 + 이전 학급) */
export async function getGalleriesByClassIds(classIds: string[]): Promise<Gallery[]> {
  if (classIds.length === 0) return [];
  const results = await Promise.all(
    classIds.map((id) => getGalleriesByClass(id))
  );
  const allGalleries = results.flat();
  // 중복 제거 (같은 galleryId)
  const seen = new Set<string>();
  return allGalleries
    .filter((g) => { if (seen.has(g.id)) return false; seen.add(g.id); return true; })
    .sort((a, b) => b.academicYear - a.academicYear);
}

/** 특정 학급의 열린 갤러리를 모두 마감 (새 학급 생성 시 호출) */
export async function closeOpenGalleriesByClass(classId: string) {
  const q = query(
    collection(db, "galleries"),
    where("classId", "==", classId),
    where("status", "==", "open")
  );
  const snap = await getDocs(q);
  const promises = snap.docs.map((s) =>
    updateDoc(doc(db, "galleries", s.id), {
      status: "closed",
      closedAt: serverTimestamp(),
    })
  );
  await Promise.all(promises);
}
