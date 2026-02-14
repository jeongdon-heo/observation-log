import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  updatePassword,
  getAuth,
  deleteUser as firebaseDeleteUser,
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { auth } from "./firebase";
import { setUser, updateUser, deleteUser, migrateStudentUid } from "./firestore";
import type { UserRole } from "@/types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

function generateClassId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await setUser({
    uid: credential.user.uid,
    email,
    name,
    role,
    profileImageUrl: null,
    classId: role === "teacher" ? generateClassId() : "",
  });
  return credential.user;
}

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

/** 새 학급 만들기 취소 (이전 학급으로 되돌리기) */
export async function revertToPreviousClass(uid: string, currentClassId: string, previousClassIds: string[]): Promise<string> {
  if (previousClassIds.length === 0) throw new Error("이전 학급이 없습니다.");

  const lastClassId = previousClassIds[previousClassIds.length - 1];
  const remainingIds = previousClassIds.slice(0, -1);

  await updateUser(uid, {
    classId: lastClassId,
    previousClassIds: remainingIds,
  });

  return lastClassId;
}

/** 교사의 학급을 새로 생성 (새 classId 발급, 이전 학급 보관, 이전 갤러리 자동 마감) */
export async function createNewClass(uid: string, currentClassId: string, previousClassIds: string[] = []): Promise<string> {
  const newClassId = generateClassId();

  // 이전 classId를 previousClassIds에 추가
  const updatedPreviousIds = [...previousClassIds, currentClassId];

  await updateUser(uid, {
    classId: newClassId,
    previousClassIds: updatedPreviousIds,
  });

  // 이전 학급의 열린 갤러리 자동 마감
  const { closeOpenGalleriesByClass } = await import("./firestore");
  await closeOpenGalleriesByClass(currentClassId);

  return newClassId;
}

// Secondary Firebase App으로 학생 계정 생성 (교사 로그아웃 방지)
function generateRandomString(length: number, chars: string): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateDefaultEmail(): string {
  const tag = generateRandomString(6, "abcdefghijklmnopqrstuvwxyz0123456789");
  return `s${tag}@obs.school`;
}

export function generateDefaultPassword(): string {
  return generateRandomString(6, "0123456789");
}

export async function createStudentAccount(
  name: string,
  classId: string,
  customEmail?: string,
  customPassword?: string
): Promise<{ email: string; password: string }> {
  const email = customEmail || generateDefaultEmail();
  const password = customPassword || generateDefaultPassword();

  const tempApp = initializeApp(firebaseConfig, `temp-${Date.now()}`);
  const tempAuth = getAuth(tempApp);

  try {
    const credential = await createUserWithEmailAndPassword(tempAuth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await setUser({
      uid: credential.user.uid,
      email,
      name,
      role: "student",
      profileImageUrl: null,
      classId,
      managedPassword: password,
    });
    await firebaseSignOut(tempAuth);
    return { email, password };
  } finally {
    await deleteApp(tempApp);
  }
}

// 교사가 학생의 이메일/비밀번호를 수정
export async function updateStudentCredentials(
  uid: string,
  currentEmail: string,
  currentPassword: string,
  newEmail?: string,
  newPassword?: string
): Promise<void> {
  // 이메일 변경이 필요한 경우: 기존 계정 삭제 → 새 계정 생성 → uid 이전
  if (newEmail && newEmail !== currentEmail) {
    const password = newPassword || currentPassword;

    // 1. 기존 Auth 계정 삭제
    const tempApp1 = initializeApp(firebaseConfig, `temp-del-${Date.now()}`);
    const tempAuth1 = getAuth(tempApp1);
    try {
      const cred = await signInWithEmailAndPassword(tempAuth1, currentEmail, currentPassword);
      await firebaseDeleteUser(cred.user);
    } finally {
      await deleteApp(tempApp1);
    }

    // 2. 새 Auth 계정 생성
    const tempApp2 = initializeApp(firebaseConfig, `temp-new-${Date.now()}`);
    const tempAuth2 = getAuth(tempApp2);
    try {
      const newCred = await createUserWithEmailAndPassword(tempAuth2, newEmail, password);
      const newUid = newCred.user.uid;
      await updateProfile(newCred.user, { displayName: currentEmail }); // 임시

      // 3. Firestore: 유저 문서 이전 + posts/comments의 authorId 이전
      await migrateStudentUid(uid, newUid, newEmail, password);

      await firebaseSignOut(tempAuth2);
    } finally {
      await deleteApp(tempApp2);
    }
    return;
  }

  // 비밀번호만 변경하는 경우
  if (newPassword && newPassword !== currentPassword) {
    const tempApp = initializeApp(firebaseConfig, `temp-${Date.now()}`);
    const tempAuth = getAuth(tempApp);
    try {
      const credential = await signInWithEmailAndPassword(tempAuth, currentEmail, currentPassword);
      await updatePassword(credential.user, newPassword);
      await updateUser(uid, { managedPassword: newPassword });
      await firebaseSignOut(tempAuth);
    } finally {
      await deleteApp(tempApp);
    }
  }
}

// 교사가 학생 계정을 삭제 (Secondary App으로 학생 계정에 로그인 후 삭제)
export async function deleteStudentAccount(
  uid: string,
  email: string,
  managedPassword?: string
): Promise<void> {
  // managedPassword가 있으면 Firebase Auth 계정도 삭제
  if (managedPassword) {
    const tempApp = initializeApp(firebaseConfig, `temp-${Date.now()}`);
    const tempAuth = getAuth(tempApp);

    try {
      const credential = await signInWithEmailAndPassword(tempAuth, email, managedPassword);
      await firebaseDeleteUser(credential.user);
    } finally {
      await deleteApp(tempApp);
    }
  }

  // Firestore 유저 문서 삭제
  await deleteUser(uid);
}
