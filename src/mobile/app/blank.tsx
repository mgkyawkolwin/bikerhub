import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/mobile/components/themedText';
import { useThemeContext } from '@/mobile/hooks/use-theme-context';

export default function BlankScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const router = useRouter();
  const colors = {
    background: isDark ? '#000000' : '#F7F7F7',
    card: isDark ? '#121212' : '#FFFFFF',
    primary: isDark ? '#FFFFFF' : '#000000',
    secondary: isDark ? '#B0B0B0' : '#666666',
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.secondary }]}> 
        <View style={styles.headerRow}>
          <MaterialIcons name="arrow-back" size={22} color={colors.primary} onPress={() => router.back()} />
          <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Coming Soon</ThemedText>
        </View>
      </View>
      <View style={[styles.content, { backgroundColor: colors.card }]}> 
        <ThemedText style={[styles.message, { color: colors.primary }]}>This feature is not available yet.</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  message: { fontSize: 16, textAlign: 'center' },
});
