import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';

export default function BlankScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.secondaryText }]}> 
        <View style={styles.headerRow}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Coming Soon</Text>
        </View>
      </View>
      <View style={[styles.content, { backgroundColor: colors.card }]}> 
        <Text style={[styles.message, { color: colors.text }]}>This feature is not available yet.</Text>
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
