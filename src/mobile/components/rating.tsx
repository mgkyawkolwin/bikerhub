import React from 'react';
import { View, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/mobile/components/themedText';

type RatingProps = {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  onRate?: (value: number) => void;
  style?: StyleProp<ViewStyle>;
};

export function Rating({
  value,
  max = 5,
  size = 18,
  color = '#E85D04',
  count,
  onRate,
  style,
}: RatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6 }, style]}> 
      {stars.map((star) => {
        const filled = value >= star;
        const iconName = filled ? 'star' : 'star-border';
        const starItem = (
          <MaterialIcons
            key={star}
            name={iconName}
            size={size}
            color={filled ? color : '#B0B0B0'}
          />
        );

        return onRate ? (
          <TouchableOpacity key={star} onPress={() => onRate(star)} hitSlop={6}>
            {starItem}
          </TouchableOpacity>
        ) : (
          starItem
        );
      })}
    </View>
  );
}
