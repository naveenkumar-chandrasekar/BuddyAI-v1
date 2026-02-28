import RNFS from 'react-native-fs';
import { storage } from '../storage/mmkv';

const MODEL_URL =
  'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf';
const MODEL_FILENAME = 'llama-3.2-1b-instruct-q4_k_m.gguf';
const MODEL_PATH_KEY = 'model_path';

export function getModelDir(): string {
  return `${RNFS.DocumentDirectoryPath}/models`;
}

export function getModelPath(): string {
  return `${getModelDir()}/${MODEL_FILENAME}`;
}

export function getSavedModelPath(): string | null {
  return storage.getString(MODEL_PATH_KEY) ?? null;
}

export async function modelExists(): Promise<boolean> {
  const saved = getSavedModelPath();
  if (!saved) return false;
  return RNFS.exists(saved);
}

export async function downloadModel(
  onProgress: (percent: number, bytesWritten: number, contentLength: number) => void,
): Promise<string> {
  const dir = getModelDir();
  const dest = getModelPath();

  const dirExists = await RNFS.exists(dir);
  if (!dirExists) await RNFS.mkdir(dir);

  const { promise } = RNFS.downloadFile({
    fromUrl: MODEL_URL,
    toFile: dest,
    progressInterval: 500,
    progress: res => {
      const percent = Math.round((res.bytesWritten / res.contentLength) * 100);
      onProgress(percent, res.bytesWritten, res.contentLength);
    },
  });

  const result = await promise;
  if (result.statusCode !== 200) {
    await RNFS.unlink(dest).catch(() => {});
    throw new Error(`Download failed with status ${result.statusCode}`);
  }

  storage.set(MODEL_PATH_KEY, dest);
  return dest;
}

export async function deleteModel(): Promise<void> {
  const path = getModelPath();
  const exists = await RNFS.exists(path);
  if (exists) await RNFS.unlink(path);
  storage.remove(MODEL_PATH_KEY);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export { formatBytes };
