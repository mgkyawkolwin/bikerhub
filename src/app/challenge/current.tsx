import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themedText';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { ChallengeServiceToken } from '@/services/challengeService';
import type { ChallengeService } from '@/services/challengeService';
import type Challenge from '@/models/challenge';

export default function ChallengeCurrentScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const challengeService = useMemo(() => container.resolve<ChallengeService>(ChallengeServiceToken), []);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'past' | 'current' | 'future'>('current');

  const colors = useMemo(
    () => ({
      background: isDark ? '#000000' : '#FFFFFF',
      card: isDark ? '#121212' : '#F7F7F7',
      border: isDark ? '#232323' : '#E0E0E0',
      primary: isDark ? '#FFFFFF' : '#000000',
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const loadChallenges = useCallback(async () => {
    const result = await challengeService.getCurrentChallenges();
    setChallenges(result);
  }, [challengeService]);

  useFocusEffect(
    useCallback(() => {
      void loadChallenges();
    }, [loadChallenges]),
  );

  const renderChallenge = ({ item }: { item: Challenge }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: '/challenge/detail', params: { id: item.id } })}
    >
      <View style={[styles.challengeCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Image source={{ uri: item.imageUrl }} style={styles.challengeImage} />
        <View style={styles.challengeInfo}>
          <ThemedText style={[styles.challengeTitle, { color: colors.primary }]}>{item.title}</ThemedText>
          <ThemedText style={[styles.challengeSubtitle, { color: colors.secondary }]} numberOfLines={2}>{item.description}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <View style={styles.headerTop}> 
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Current Challenges</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.headerTabs}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'past' && { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
            onPress={() => setSelectedPeriod('past')}
          >
            <MaterialIcons name="history" size={20} color={selectedPeriod === 'past' ? '#FFFFFF' : colors.primary} />
            <ThemedText style={[styles.periodLabel, { color: selectedPeriod === 'past' ? '#FFFFFF' : colors.primary }]}>Past</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'current' && { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
            onPress={() => setSelectedPeriod('current')}
          >
            <MaterialIcons name="emoji-events" size={20} color={selectedPeriod === 'current' ? '#FFFFFF' : colors.primary} />
            <ThemedText style={[styles.periodLabel, { color: selectedPeriod === 'current' ? '#FFFFFF' : colors.primary }]}>Current</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'future' && { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
            onPress={() => setSelectedPeriod('future')}
          >
            <MaterialIcons name="trending-up" size={20} color={selectedPeriod === 'future' ? '#FFFFFF' : colors.primary} />
            <ThemedText style={[styles.periodLabel, { color: selectedPeriod === 'future' ? '#FFFFFF' : colors.primary }]}>Future</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        renderItem={renderChallenge}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>No challenges available.</ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 42,
  },
  headerTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 12,
  },
  periodButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CCCCCC',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 14,
  },
  challengeCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  challengeImage: {
    width: '100%',
    height: 180,
  },
  challengeInfo: {
    padding: 14,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  challengeSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
