import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { v4 as uuidv4 } from "uuid";

/**
 * 이미지를 Firebase Storage에 업로드하고 다운로드 URL을 반환합니다.
 */
export async function uploadImage(file: File, folder: string = "observations"): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${uuidv4()}.${ext}`;
  const storageRef = ref(storage, fileName);

  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

/**
 * 여러 이미지를 한 번에 업로드합니다.
 */
export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadImage(file));
  return Promise.all(uploadPromises);
}
