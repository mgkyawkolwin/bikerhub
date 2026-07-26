import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { useThemeContext } from '@/hooks/use-theme-context';

type LoadingOverlayProps = {
  isLoading: boolean;
};

export default function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  const { colors } = useThemeContext();

  if (!isLoading) {
    return null;
  }

  return (
    <Modal transparent visible={isLoading} animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.card }]}> 
          <ActivityIndicator size="large" color={colors.button} />
          <Text style={[styles.text, { color: colors.text }]}>Processing ...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    minWidth: 180,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  text: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
});
