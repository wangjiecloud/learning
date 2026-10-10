/**
 * 统一存储服务
 * Web: IndexedDB (idb-keyval)
 * Android/iOS: @react-native-async-storage/async-storage
 */
import { Platform } from 'react-native';

// ── Web: idb-keyval ──────────────────────────────────────────
async function webSet(key: string, value: unknown): Promise<void> {
  const { set } = await import('idb-keyval');
  await set(key, value);
}

async function webGet<T>(key: string): Promise<T | undefined> {
  const { get } = await import('idb-keyval');
  return (await get(key)) as T | undefined;
}

async function webDel(key: string): Promise<void> {
  const { del } = await import('idb-keyval');
  await del(key);
}

async function webKeys(): Promise<string[]> {
  const { keys } = await import('idb-keyval');
  return (await keys()) as string[];
}

// ── Native: AsyncStorage ──────────────────────────────────────
async function nativeSet(key: string, value: unknown): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function nativeGet<T>(key: string): Promise<T | undefined> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

async function nativeDel(key: string): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.removeItem(key);
}

async function nativeKeys(): Promise<string[]> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  return (await AsyncStorage.getAllKeys()) as string[];
}

// ── 统一接口 ──────────────────────────────────────────────────
const isWeb = Platform.OS === 'web';

export const storage = {
  async set(key: string, value: unknown): Promise<void> {
    if (isWeb) {
      await webSet(key, value);
    } else {
      await nativeSet(key, value);
    }
  },

  async get<T>(key: string): Promise<T | undefined> {
    if (isWeb) {
      return webGet<T>(key);
    } else {
      return nativeGet<T>(key);
    }
  },

  async delete(key: string): Promise<void> {
    if (isWeb) {
      await webDel(key);
    } else {
      await nativeDel(key);
    }
  },

  async keys(): Promise<string[]> {
    if (isWeb) {
      return webKeys();
    } else {
      return nativeKeys();
    }
  },

  async getAll<T>(prefix: string): Promise<T[]> {
    const allKeys = await this.keys();
    const matchedKeys = allKeys.filter(
      (k) => typeof k === 'string' && k.startsWith(prefix)
    );
    const results = await Promise.all(matchedKeys.map((k) => this.get<T>(k)));
    return results.filter((v): v is Awaited<T> => v !== undefined) as T[];
  },
};

// ── 书籍文件内容存储（大文件，Web 用 Blob，Native 用文件系统）──
export const fileStorage = {
  async saveBookContent(bookId: string, format: string, content: string | Blob): Promise<void> {
    if (isWeb) {
      await storage.set(`book_content:${bookId}`, content);
    } else {
      const { File, Directory, Paths } = await import('expo-file-system');
      const booksDir = new Directory(Paths.document, 'books');
      if (!booksDir.exists) booksDir.create();
      const file = new File(booksDir, `${bookId}.${format}`);
      if (typeof content === 'string') {
        file.write(content);
      }
    }
  },

  async getBookContent(bookId: string, format: string): Promise<string | Blob | null> {
    if (isWeb) {
      return (await storage.get<string | Blob>(`book_content:${bookId}`)) ?? null;
    } else {
      const { File, Directory, Paths } = await import('expo-file-system');
      const booksDir = new Directory(Paths.document, 'books');
      const file = new File(booksDir, `${bookId}.${format}`);
      if (!file.exists) return null;
      return file.text();
    }
  },

  async deleteBookContent(bookId: string, format: string): Promise<void> {
    if (isWeb) {
      await storage.delete(`book_content:${bookId}`);
    } else {
      const { File, Directory, Paths } = await import('expo-file-system');
      const booksDir = new Directory(Paths.document, 'books');
      const file = new File(booksDir, `${bookId}.${format}`);
      if (file.exists) file.delete();
    }
  },

  async getBookUri(bookId: string, format: string): Promise<string | null> {
    if (isWeb) {
      const content = await storage.get<Blob | string>(`book_content:${bookId}`);
      if (!content) return null;
      if (content instanceof Blob) return URL.createObjectURL(content);
      const blob = new Blob([content as string], { type: 'text/plain' });
      return URL.createObjectURL(blob);
    } else {
      const { File, Directory, Paths } = await import('expo-file-system');
      const booksDir = new Directory(Paths.document, 'books');
      const file = new File(booksDir, `${bookId}.${format}`);
      return file.exists ? file.uri : null;
    }
  },
};
