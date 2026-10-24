import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { JobApplication } from "@/types/application";

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
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateApplication(
  id: string,
  data: Partial<Omit<JobApplication, "id" | "userId" | "createdAt">>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteApplication(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
