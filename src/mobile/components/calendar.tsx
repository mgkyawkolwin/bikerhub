import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';

type CalendarProps = {
  value?: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  minimumYear?: number;
  maximumYear?: number;
  style?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: TextStyle;
  placeholderText?: string;
  disabled?: boolean;
};

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = monthNames[value.getMonth()];
  const day = value.getDate();
  return `${month} ${day}, ${year}`;
}

export default function Calendar({
  value,
  onChange,
  label,
  placeholder,
  minimumYear,
  maximumYear,
  style,
  inputStyle,
  labelStyle,
  placeholderText,
  disabled,
}: CalendarProps) {
  const { colors } = useThemeContext();
  const today = useMemo(() => new Date(), []);
  const minYear = minimumYear ?? today.getFullYear() - 20;
  const maxYear = maximumYear ?? today.getFullYear() + 10;

  const [visible, setVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(value?.getFullYear() ?? today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(value?.getMonth() ?? today.getMonth());
  const [selectedDay, setSelectedDay] = useState(value?.getDate() ?? today.getDate());

  const years = useMemo(() => {
    const list: number[] = [];
    for (let year = minYear; year <= maxYear; year += 1) {
      list.push(year);
    }
    return list;
  }, [minYear, maxYear]);

  useEffect(() => {
    if (value) {
      setSelectedYear(value.getFullYear());
      setSelectedMonth(value.getMonth());
      setSelectedDay(value.getDate());
    }
  }, [value]);

  useEffect(() => {
    const maxDay = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDay) {
      setSelectedDay(maxDay);
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  const days = useMemo(() => {
    return Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, index) => index + 1);
  }, [selectedMonth, selectedYear]);

  const selectedDate = useMemo(() => {
    if (!value) return null;
    return formatDate(value);
  }, [value]);

  const handleApply = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    onChange(newDate);
    setVisible(false);
  };

  return (
    <>
      {label ? <Text style={[styles.label, { color: colors.text }, labelStyle]}>{label}</Text> : null}
      <TouchableOpacity
        activeOpacity={disabled ? 1 : 0.8}
        onPress={() => {
          if (disabled) return;
          setVisible(true);
        }}
        style={[
          styles.inputContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
          style,
          disabled && styles.disabled,
          inputStyle,
        ]}
      >
        <View style={styles.inputContent}>
          <MaterialIcons name="calendar-month" size={18} color={disabled ? colors.secondaryText : colors.text} />
          <Text
            style={[
              styles.inputText,
              { color: value ? colors.text : colors.secondaryText },
            ]}
            numberOfLines={1}
          >
            {value ? formatDate(value) : placeholder ?? placeholderText ?? 'Select date'}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)} />
        <View style={[styles.modalSheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}> 
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.modalButtonText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select date</Text>
            <TouchableOpacity onPress={handleApply} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.modalButtonText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Text style={[styles.pickerLabel, { color: colors.secondaryText }]}>Year</Text>
              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {years.map((year) => (
                  <TouchableOpacity key={year} onPress={() => setSelectedYear(year)} style={styles.pickerItem}>
                    <Text style={[
                      styles.itemText,
                      { color: selectedYear === year ? colors.accent : colors.text },
                      selectedYear === year && styles.selectedItemText,
                    ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={[styles.pickerLabel, { color: colors.secondaryText }]}>Month</Text>
              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {monthNames.map((monthName, index) => (
                  <TouchableOpacity key={monthName} onPress={() => setSelectedMonth(index)} style={styles.pickerItem}>
                    <Text style={[
                      styles.itemText,
                      { color: selectedMonth === index ? colors.accent : colors.text },
                      selectedMonth === index && styles.selectedItemText,
                    ]}
                    >
                      {monthName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={[styles.pickerLabel, { color: colors.secondaryText }]}>Day</Text>
              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {days.map((day) => (
                  <TouchableOpacity key={day} onPress={() => setSelectedDay(day)} style={styles.pickerItem}>
                    <Text style={[
                      styles.itemText,
                      { color: selectedDay === day ? colors.accent : colors.text },
                      selectedDay === day && styles.selectedItemText,
                    ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
    maxHeight: 320,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 15,
  },
  selectedItemText: {
    fontWeight: '700',
  },
});
