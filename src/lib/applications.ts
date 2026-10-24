import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { JobApplication } from "@/types/application";
import { sanitizeApplicationData } from "./sanitize";

const COLLECTION_NAME = "applications";

export async function getApplications(
  userId: string
): Promise<JobApplication[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as JobApplication[];
}

export async function addApplication(
  userId: string,
  data: Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> {
  const sanitized = sanitizeApplicationData(data as Record<string, unknown>);
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...sanitized,
    userId,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateApplication(
  id: string,
  userId: string,
  data: Partial<Omit<JobApplication, "id" | "userId" | "createdAt">>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);

  // Verify ownership before updating
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists() || docSnap.data().userId !== userId) {
    throw new Error("Unauthorized");
  }

  const sanitized = sanitizeApplicationData({
    ...docSnap.data(),
    ...data,
  } as Record<string, unknown>);

  await updateDoc(docRef, {
    ...sanitized,
    userId,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteApplication(
  id: string,
  userId: string
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);

  // Verify ownership before deleting
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists() || docSnap.data().userId !== userId) {
    throw new Error("Unauthorized");
  }

  await deleteDoc(docRef);
}
