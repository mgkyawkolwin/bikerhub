import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const FILE_DIRECTORY = `${FileSystem.documentDirectory}files/`;

function getExtensionFromUri(uri: string) {
  const match = uri.match(/\.[^/.]+$/);
  return match ? match[0] : '';
}

export async function saveFileToLocalUri(uri: string): Promise<string> {
  if (!uri) {
    return uri;
  }

  if (Platform.OS === 'web') {
    return uri;
  }

  await FileSystem.makeDirectoryAsync(FILE_DIRECTORY, { intermediates: true });
  const extension = getExtensionFromUri(uri) || '.gpx';
  const targetUri = `${FILE_DIRECTORY}${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;

  try {
    await FileSystem.copyAsync({ from: uri, to: targetUri });
    return targetUri;
  } catch {
    return uri;
  }
}
