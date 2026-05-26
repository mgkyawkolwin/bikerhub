import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthContext } from '@/mobile/hooks/use-auth-context';

const AUTH_USER_STORAGE_KEY = 'auth_user';

export default function IndexScreen() {
  const router = useRouter();
  const { setAuthUser } = useAuthContext();

  useEffect(() => {
    async function checkAuth() {
      const userJson = await SecureStore.getItemAsync(AUTH_USER_STORAGE_KEY);
      if (userJson) {
        try {
          setAuthUser(JSON.parse(userJson));
        } catch {
          setAuthUser(null);
        }
        router.replace('/social/posts' as any);
      } else {
        setAuthUser(null);
        router.replace('/auth/signIn' as any);
      }
    }

    checkAuth();
  }, [router, setAuthUser]);

  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
