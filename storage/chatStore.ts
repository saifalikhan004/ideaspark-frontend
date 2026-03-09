import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { firestoreDB } from "../FirebaseConfig";

export type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: any;
};

export const ChatStore = {
  async addMessage(ideaId: string, msg: { role: string; content: string }) {
    await addDoc(collection(firestoreDB, "ideas", ideaId, "chatHistory"), {
      role: msg.role,
      content: msg.content,
      createdAt: serverTimestamp(),
    });
  },

  async getMessages(ideaId: string): Promise<ChatMessage[]> {
    const q = query(
      collection(firestoreDB, "ideas", ideaId, "chatHistory"),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
  },
};
