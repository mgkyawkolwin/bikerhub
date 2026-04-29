import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const IMAGE_DIRECTORY = `${FileSystem.documentDirectory}images/`;

function getExtensionFromUri(uri: string) {
  const match = uri.match(/\.(jpe?g|png|gif|bmp|webp|heic|heif)(\?.*)?$/i);
  if (match) {
    return match[0];
  }

  const mimeMatch = uri.match(/data:image\/(\w+);/);
  if (mimeMatch) {
    return `.${mimeMatch[1]}`;
  }

  return '.jpg';
}

function isWebUrl(uri: string) {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function isFileUri(uri: string) {
  return uri.startsWith('file://') || uri.startsWith('content://');
}

export async function saveImageToLocalUri(uri: string): Promise<string> {
  if (!uri) {
    return uri;
  }

  if (Platform.OS === 'web') {
    return uri;
  }

  await FileSystem.makeDirectoryAsync(IMAGE_DIRECTORY, { intermediates: true });
  const fileExtension = getExtensionFromUri(uri);
  const targetUri = `${IMAGE_DIRECTORY}${Date.now()}-${Math.random().toString(36).slice(2, 8)}${fileExtension}`;

  try {
    if (isWebUrl(uri)) {
      const downloadResult = await FileSystem.downloadAsync(uri, targetUri);
      return downloadResult.uri;
    }

    if (isFileUri(uri)) {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.copyAsync({ from: uri, to: targetUri });
        return targetUri;
      }
    }

    return uri;
  } catch {
    return uri;
  }
}
