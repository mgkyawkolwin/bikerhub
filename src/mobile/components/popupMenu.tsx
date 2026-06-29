import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemeContext } from '@/hooks/use-theme-context';

type PopupMenuItem = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type PopupMenuProps = {
  visible: boolean;
  onClose: () => void;
  items: PopupMenuItem[];
};

export default function PopupMenu({ visible, onClose, items }: PopupMenuProps) {
  const { colors } = useThemeContext();

  const handlePress = (item: PopupMenuItem) => {
    item.onPress();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.background} onPress={onClose} />
        <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          {items.map((item, index) => (
            <TouchableOpacity
              key={`${item.label}-${index}`}
              style={[styles.menuItem, index > 0 && styles.menuItemSeparator]}
              onPress={() => handlePress(item)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.menuItemText,
                  { color: item.destructive ? '#FF3B30' : colors.text },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  background: {
    flex: 1,
  },
  menu: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  menuItemSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
