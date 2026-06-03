import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { ChallengeServiceToken } from '@/services/challengeService';
import type { ChallengeService } from '@/services/challengeService';
import type Challenge from '@/models/challenge';

export default function ChallengeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const params = useLocalSearchParams();
  const challengeService = useMemo(() => container.resolve<ChallengeService>(ChallengeServiceToken), []);
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  const loadChallenge = useCallback(async () => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return;
    const result = await challengeService.getChallengeById(id);
    setChallenge(result ?? null);
  }, [challengeService, params.id]);

  React.useEffect(() => {
    void loadChallenge();
  }, [loadChallenge]);

  if (!challenge) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
        <View style={[styles.header, { borderBottomColor: colors.border }]}> 
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Challenge detail</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Challenge not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{challenge.title}</Text>
        <TouchableOpacity style={[styles.joinButton, { borderColor: colors.accent }]} activeOpacity={0.8} onPress={() => {}}>
          <MaterialIcons name="group-add" size={18} color={colors.accent} />
          <Text style={[styles.joinButtonText, { color: colors.accent }]}>Join</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Image source={{ uri: challenge.coverImageUrl }} style={styles.coverImage} />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.sectionText, { color: colors.secondaryText }]}>{challenge.description}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Leaderboard</Text>
          <FlatList
            data={challenge.leaderboard}
            keyExtractor={(item) => item.rank.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.leaderRow}>
                <Text style={[styles.leaderRank, { color: colors.accent }]}>{item.rank}</Text>
                <View style={styles.leaderTextBlock}>
                  <Text style={[styles.leaderName, { color: colors.text }]}>{item.riderName}</Text>
                  <Text style={[styles.leaderScore, { color: colors.secondaryText }]}>{`${item.score} pts`}</Text>
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: 16,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 42,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  coverImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginBottom: 14,
  },
  section: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  leaderRank: {
    fontSize: 18,
    fontWeight: '700',
    width: 32,
    textAlign: 'center',
  },
  leaderTextBlock: {
    flex: 1,
  },
  leaderName: {
    fontSize: 15,
    fontWeight: '600',
  },
  leaderScore: {
    fontSize: 13,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#CCCCCC',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
