import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  updateEmail,
  updatePassword,
  getAuth,
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { auth } from "./firebase";
import { setUser, updateUser } from "./firestore";
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

// 교사가 학생의 이메일/비밀번호를 수정 (Secondary App으로 학생 계정에 로그인 후 변경)
export async function updateStudentCredentials(
  uid: string,
  currentEmail: string,
  currentPassword: string,
  newEmail?: string,
  newPassword?: string
): Promise<void> {
  const tempApp = initializeApp(firebaseConfig, `temp-${Date.now()}`);
  const tempAuth = getAuth(tempApp);

  try {
    const credential = await signInWithEmailAndPassword(tempAuth, currentEmail, currentPassword);

    if (newEmail && newEmail !== currentEmail) {
      await updateEmail(credential.user, newEmail);
    }
    if (newPassword && newPassword !== currentPassword) {
      await updatePassword(credential.user, newPassword);
    }

    // Firestore 문서 업데이트
    const updates: Record<string, string> = {};
    if (newEmail && newEmail !== currentEmail) updates.email = newEmail;
    if (newPassword && newPassword !== currentPassword) updates.managedPassword = newPassword;
    if (Object.keys(updates).length > 0) {
      await updateUser(uid, updates);
    }

    await firebaseSignOut(tempAuth);
  } finally {
    await deleteApp(tempApp);
  }
}
