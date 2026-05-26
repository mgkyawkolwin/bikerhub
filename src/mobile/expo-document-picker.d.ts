declare module 'expo-document-picker' {
  export type DocumentResult =
    | { type: 'cancel' | 'dismissed'; name?: undefined; size?: undefined; uri?: undefined }
    | { type: 'success'; name: string; size: number; uri: string };

  export function getDocumentAsync(options?: {
    type?: string;
    copyToCacheDirectory?: boolean;
  }): Promise<DocumentResult>;
}
