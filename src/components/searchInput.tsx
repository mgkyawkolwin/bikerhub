import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  style?: object;
};

export default function SearchInput({ value, onChangeText, onClear, placeholder, style }: SearchInputProps) {
  const { isDark } = useThemeContext();
  const colors = {
    background: isDark ? '#121212' : '#FFFFFF',
    border: isDark ? '#2C2C2C' : '#E0E0E0',
    text: isDark ? '#FFFFFF' : '#000000',
    placeholder: isDark ? '#888888' : '#999999',
    icon: isDark ? '#FFFFFF' : '#666666',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }, style]}>
      <MaterialIcons name="search" size={18} color={colors.icon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={18} color={colors.icon} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    paddingVertical: 8,
  },
});
