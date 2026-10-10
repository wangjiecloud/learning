/**
 * 文件读取服务 - 平台分支
 * Web: FileReader API + expo-document-picker
 * Android: expo-file-system + expo-document-picker
 */
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

export interface PickedFile {
  name: string;
  size: number;
  uri: string;         // Web: blob URL; Android: file:// path
  mimeType?: string;
  format: 'txt' | 'pdf' | 'md';
  // Web 专有
  fileObject?: File;
  // 文本内容（TXT/MD 直接读取）
  textContent?: string;
}

function getFormat(name: string): 'txt' | 'pdf' | 'md' | null {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'txt') return 'txt';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'md' || ext === 'markdown') return 'md';
  return null;
}

// Web: 用 FileReader 读取文本内容
async function readTextWeb(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });
}

export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/plain', 'application/pdf', 'text/markdown', '*/*'],
    multiple: false,
    copyToCacheDirectory: true,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  const format = getFormat(asset.name);
  if (!format) {
    throw new Error(`不支持的文件格式: ${asset.name}`);
  }

  const picked: PickedFile = {
    name: asset.name,
    size: asset.size ?? 0,
    uri: asset.uri,
    mimeType: asset.mimeType,
    format,
  };

  if (Platform.OS === 'web') {
    // Web: asset.file 是原生 File 对象
    const fileObj = (asset as any).file as File | undefined;
    if (fileObj) {
      picked.fileObject = fileObj;
      if (format === 'txt' || format === 'md') {
        picked.textContent = await readTextWeb(fileObj);
      }
    }
  } else {
    // Android: 从文件系统读取文本
    if (format === 'txt' || format === 'md') {
      const { File, Paths } = await import('expo-file-system');
      const file = new File(asset.uri);
      picked.textContent = await file.text();
    }
  }

  return picked;
}

export async function savePdfToStorage(bookId: string, file: PickedFile): Promise<string> {
  if (Platform.OS === 'web') {
    // Web: 存 Blob 到 IndexedDB，返回 Blob URL
    const { storage } = await import('./storage');
    let blob: Blob;
    if (file.fileObject) {
      blob = file.fileObject;
    } else {
      // uri 是 blob URL，fetch 转 Blob
      const resp = await fetch(file.uri);
      blob = await resp.blob();
    }
    await storage.set(`book_content:${bookId}`, blob);
    return URL.createObjectURL(blob);
  } else {
    // Android: 复制到 DocumentDirectory
    const { File, Directory, Paths } = await import('expo-file-system');
    const booksDir = new Directory(Paths.document, 'books');
    if (!booksDir.exists) booksDir.create();
    const dest = new File(booksDir, `${bookId}.pdf`);
    const src = new File(file.uri);
    src.copy(dest);
    return dest.uri;
  }
}
