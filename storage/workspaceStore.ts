import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { firestoreDB } from "../FirebaseConfig";

export type Workspace = {
  id: string;
  idea: string;
  category: string;
  subCategory?: string | null;
  notes?: string;
  refinedIdea?: string | null;
  expansions?: string[];
  structureType?: string | null;
  actionSteps?: string[];
  isFavorite?: boolean;
  tags?: string[];
  createdAt?: any;
  updatedAt?: any;
  userId: string; // explicitly required now
};

const userIdeasCol = (userId: string) =>
  collection(firestoreDB, "users", userId, "ideas");

const userIdeasQuery = (userId: string) =>
  query(userIdeasCol(userId), orderBy("updatedAt", "desc"));

export const WorkspaceStore = {
  async getAll(userId: string): Promise<Workspace[]> {
    const q = userIdeasQuery(userId);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Workspace));
  },

  async add(userId: string, workspace: Omit<Workspace, "id" | "userId"> & { id?: string }) {
    const docId = workspace.id || doc(userIdeasCol(userId)).id;
    const ref = doc(firestoreDB, "users", userId, "ideas", docId);
    await setDoc(
      ref,
      {
        ...workspace,
        userId,
        updatedAt: serverTimestamp(),
        createdAt: workspace.createdAt || serverTimestamp(),
      },
      { merge: true }
    );
    return docId;
  },

  async count(userId: string): Promise<number> {
    const snap = await getDocs(userIdeasQuery(userId));
    return snap.size;
  },

  async get(userId: string, ideaId: string): Promise<Workspace | null> {
    const ref = doc(firestoreDB, "users", userId, "ideas", ideaId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Workspace;
    }
    return null;
  },

  async update(userId: string, ideaId: string, data: Partial<Workspace>) {
    const ref = doc(firestoreDB, "users", userId, "ideas", ideaId);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};
