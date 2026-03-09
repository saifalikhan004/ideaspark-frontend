import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  getCountFromServer,
  serverTimestamp,
  Timestamp,
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
};

const ideasCol = (userId: string) =>
  collection(firestoreDB, "ideas");

const userIdeasQuery = (userId: string) =>
  query(
    collection(firestoreDB, "ideas"),
    orderBy("updatedAt", "desc")
  );

export const WorkspaceStore = {
  async getAll(userId: string): Promise<Workspace[]> {
    const q = userIdeasQuery(userId);
    const snap = await getDocs(q);
    return snap.docs
      .filter((d) => d.data().userId === userId)
      .map((d) => ({ id: d.id, ...d.data() } as Workspace));
  },

  async add(userId: string, workspace: Omit<Workspace, "id"> & { id?: string }) {
    const docId = workspace.id || doc(collection(firestoreDB, "ideas")).id;
    const ref = doc(firestoreDB, "ideas", docId);
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
    const all = await this.getAll(userId);
    return all.length;
  },

  async update(ideaId: string, data: Partial<Workspace>) {
    const ref = doc(firestoreDB, "ideas", ideaId);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
};