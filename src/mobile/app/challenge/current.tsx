import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { ChallengeServiceToken } from '@/services/challengeService';
import type { ChallengeService } from '@/services/challengeService';
import type Challenge from '@/models/challenge';

export default function ChallengeCurrentScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const challengeService = useMemo(() => container.resolve<ChallengeService>(ChallengeServiceToken), []);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'past' | 'current' | 'future'>('current');

  const loadChallenges = useCallback(async () => {
    let response: Response;
    switch (selectedPeriod) {
      case 'past':
        response = await challengeService.getPastChallenges();
        break;
      case 'future':
        response = await challengeService.getFutureChallenges();
        break;
      case 'current':
      default:
        response = await challengeService.getCurrentChallenges();
        break;
    }

    const payload = await response.json().catch(() => null) as { success?: boolean; data?: Challenge[] } | null;
    setChallenges(payload?.data ?? []);
  }, [challengeService, selectedPeriod]);

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
        <Image source={{ uri: item.coverImageUrl ?? item.imageUrl }} style={styles.challengeImage} />
        <View style={styles.challengeInfo}>
          <Text style={[styles.challengeTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.challengeSubtitle, { color: colors.secondaryText }]} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <View style={styles.headerTop}> 
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Current Challenges</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.headerTabs}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'past' && { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
            onPress={() => setSelectedPeriod('past')}
          >
            <MaterialIcons name="history" size={20} color={selectedPeriod === 'past' ? '#FFFFFF' : colors.text} />
            <Text style={[styles.periodLabel, { color: selectedPeriod === 'past' ? '#FFFFFF' : colors.text }]}>Past</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'current' && { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
            onPress={() => setSelectedPeriod('current')}
          >
            <MaterialIcons name="emoji-events" size={20} color={selectedPeriod === 'current' ? '#FFFFFF' : colors.text} />
            <Text style={[styles.periodLabel, { color: selectedPeriod === 'current' ? '#FFFFFF' : colors.text }]}>Current</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'future' && { backgroundColor: colors.accent }]}
            activeOpacity={0.85}
            onPress={() => setSelectedPeriod('future')}
          >
            <MaterialIcons name="trending-up" size={20} color={selectedPeriod === 'future' ? '#FFFFFF' : colors.text} />
            <Text style={[styles.periodLabel, { color: selectedPeriod === 'future' ? '#FFFFFF' : colors.text }]}>Future</Text>
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
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>No challenges available.</Text>
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
