import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "IDEASPARK_WORKSPACES";

export type Workspace = {
  id: string;
  idea: string;
  category: string;
  updatedAt: number;
};


const load = async (): Promise<Workspace[]> => {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
};

const save = async (workspaces: Workspace[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(workspaces));
};


export const WorkspaceStore = {
  async getAll(): Promise<Workspace[]> {
    return load();
  },

  async add(workspace: Workspace) {
    const all = await load();
    await save([workspace, ...all]);
  },

  async count(): Promise<number> {
    const all = await load();
    return all.length;
  },
};