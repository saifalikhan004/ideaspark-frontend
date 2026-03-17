import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { firestoreDB } from "../FirebaseConfig";

export type Activity = {
  id?: string;
  ideaId: string;
  ideaTitle: string;
  action: string; // "created" | "updated" | "refined" | "chatted"
  userId: string;
  timestamp?: any;
};

export const ActivityStore = {
  async log(userId: string, activity: Omit<Activity, "userId" | "timestamp">) {
    await addDoc(collection(firestoreDB, "users", userId, "activity"), {
      ...activity,
      userId,
      timestamp: serverTimestamp(),
    });
  },

  async getRecent(userId: string, count = 20): Promise<Activity[]> {
    const q = query(
      collection(firestoreDB, "users", userId, "activity"),
      orderBy("timestamp", "desc"),
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity));
  },
};
