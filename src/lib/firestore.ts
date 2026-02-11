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
} from "@/types";

// ==================== 헬퍼 ====================
const toDate = (ts: Timestamp | null | undefined): Date =>
  ts?.toDate() ?? new Date();

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

export async function joinClass(uid: string, classId: string) {
  await updateDoc(doc(db, "users", uid), { classId });
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

export async function getPostsByClass(classId: string): Promise<Post[]> {
  const q = query(
    collection(db, "posts"),
    where("classId", "==", classId),
    where("isPublic", "==", true)
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
