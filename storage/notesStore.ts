import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firestoreDB } from "../FirebaseConfig";

export type Note = {
  id?: string;
  content: string;
  createdAt?: any;
  updatedAt?: any;
};

export const NotesStore = {
  async addNote(userId: string, ideaId: string, content: string): Promise<string> {
    const docRef = await addDoc(
      collection(
        firestoreDB,
        "users",
        userId,
        "ideas",
        ideaId,
        "notes"
      ),
      {
        content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );
    return docRef.id;
  },

  async getNotes(userId: string, ideaId: string): Promise<Note[]> {
    const q = query(
      collection(
        firestoreDB,
        "users",
        userId,
        "ideas",
        ideaId,
        "notes"
      ),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
  },

  async updateNote(userId: string, ideaId: string, noteId: string, content: string): Promise<void> {
    const noteRef = doc(
      firestoreDB,
      "users",
      userId,
      "ideas",
      ideaId,
      "notes",
      noteId
    );
    await updateDoc(noteRef, {
      content,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteNote(userId: string, ideaId: string, noteId: string): Promise<void> {
    const noteRef = doc(
      firestoreDB,
      "users",
      userId,
      "ideas",
      ideaId,
      "notes",
      noteId
    );
    await deleteDoc(noteRef);
  },
};
