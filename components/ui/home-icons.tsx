import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { View, StyleSheet } from 'react-native';

export function HomeIcon({
  name,
  color = '#fff',
  size = 24,
  bg = '#3B82F6',
}: {
  name: string;
  color?: string;
  size?: number;
  bg?: string;
}) {
  return (
    <View style={[styles.circle, { backgroundColor: bg, width: size + 20, height: size + 20, borderRadius: (size + 20) / 2 }]}>
      <MaterialIcons name={name} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
