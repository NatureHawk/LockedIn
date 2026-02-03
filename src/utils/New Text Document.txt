import * as FileSystem from "expo-file-system/legacy";


const BASE_DIR = FileSystem.documentDirectory + "logs/";

export async function ensureDayDir(date: string) {
  const dir = BASE_DIR + date + "/";
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

export async function savePhoto(date: string, uri: string, index: number) {
  const dir = await ensureDayDir(date);
  const dest = `${dir}${index + 1}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}
