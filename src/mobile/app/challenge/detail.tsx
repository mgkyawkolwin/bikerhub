import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { ChallengeServiceToken } from '@/services/challengeService';
import type { ChallengeService } from '@/services/challengeService';
import type Challenge from '@/models/challenge';
import SnackBar from '@/components/snackbar';

export default function ChallengeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const params = useLocalSearchParams();
  const challengeService = useMemo(() => container.resolve<ChallengeService>(ChallengeServiceToken), []);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);
  const isCurrentChallenge = Boolean(challenge?.isStarted && !challenge?.isEnded);

  const loadChallenge = useCallback(async (isRefresh = false) => {
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await challengeService.getChallengeById(id);
      if (!response.ok) {
        SnackBar.Error(`(${response.status}): Request failed. Please try again.`);
        return;
      }
      const responseJson = await response.json();
      if(responseJson?.success === false) {
        SnackBar.Error(responseJson?.message ?? "Request failed. Please try again.");
        return;
      }
      setChallenge(responseJson?.data ?? null);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [challengeService, params.id]);

  const handleToggleMembership = useCallback(async () => {
    if (!challenge?.id || joining) return;
    setJoining(true);
    try {
      const response = challenge.isJoined
        ? await challengeService.leaveChallenge(challenge.id)
        : await challengeService.joinChallenge(challenge.id);
      const payload = await response.json().catch(() => null) as { success?: boolean; message?: string } | null;
      if (response.ok && payload?.success) {
        await loadChallenge(true);
      } else {
        SnackBar.Error(payload?.message ?? 'Unable to update membership. Please try again.');
      }
    } finally {
      setJoining(false);
    }
  }, [challenge?.id, challenge?.isJoined, challengeService, joining, loadChallenge]);

  React.useEffect(() => {
    void loadChallenge();
  }, [loadChallenge]);

  if (loading && !challenge) {
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
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

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
        {isCurrentChallenge ? (
          <TouchableOpacity
            style={[styles.joinButton, { borderColor: challenge.isJoined ? colors.border : colors.accent }]}
            activeOpacity={0.8}
            onPress={handleToggleMembership}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator size="small" color={challenge.isJoined ? colors.secondaryText : colors.accent} />
            ) : (
              <MaterialIcons name={challenge.isJoined ? 'check-circle' : 'group-add'} size={18} color={challenge.isJoined ? colors.secondaryText : colors.accent} />
            )}
            <Text style={[styles.joinButtonText, { color: challenge.isJoined ? colors.secondaryText : colors.accent }]}>
              {challenge.isJoined ? 'Leave' : 'Join'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadChallenge(true)}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        <View style={[styles.challengeCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          {challenge.coverImageUrl ? <Image source={{ uri: challenge.coverImageUrl }} style={styles.coverImage} /> : null}
          <View style={styles.challengeInfo}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{challenge.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaColumn}>
                <Text style={[styles.metaLabel, { color: colors.secondaryText }]}>Start</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{challenge.startDate ? new Date(challenge.startDate).toLocaleDateString() : 'TBD'}</Text>
              </View>
              <View style={styles.metaColumn}>
                <Text style={[styles.metaLabel, { color: colors.secondaryText }]}>End</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{challenge.endDate ? new Date(challenge.endDate).toLocaleDateString() : 'TBD'}</Text>
              </View>
              <View style={styles.metaColumn}>
                <Text style={[styles.metaLabel, { color: colors.secondaryText }]}>Participants</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{challenge.noOfParticipants ?? 0}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.sectionText, { color: colors.secondaryText }]}>{challenge.description}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Leaderboard</Text>
          <FlatList
            data={challenge.leaderboard ?? []}
            keyExtractor={(item) => item.rank.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.leaderRow}>
                <Text style={[styles.leaderRank, { color: colors.accent }]}>{item.rank}</Text>
                {item.profileImageUrl ? (
                  <Image source={{ uri: item.profileImageUrl }} style={styles.leaderAvatar} />
                ) : (
                  <View style={[styles.leaderAvatar, styles.leaderAvatarFallback, { borderColor: colors.border }]}> 
                    <MaterialIcons name="account-circle" size={24} color={colors.secondaryText} />
                  </View>
                )}
                <View style={styles.leaderTextBlock}>
                  <Text style={[styles.leaderName, { color: colors.text }]}>{item.riderName}</Text>
                </View>
                <View style={styles.leaderDistanceBlock}>
                  <Text style={[styles.leaderScore, { color: colors.secondaryText }]}>{`${item.km ?? 0} km`}</Text>
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
    paddingHorizontal: 8,
    paddingTop: 14,
    gap: 14,
  },
  challengeCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 220,
  },
  challengeInfo: {
    padding: 16,
    gap: 10,
  },
  section: {
    borderWidth: 1,
    borderRadius: 8,
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaColumn: {
    flex: 1,
    minWidth: 0,
  },
  metaLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
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
    width: 18,
    textAlign: 'center',
  },
  leaderTextBlock: {
    flex: 1,
  },
  leaderDistanceBlock: {
    maxWidth: 50,
  },
  leaderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  leaderAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  leaderName: {
    fontSize: 15,
    fontWeight: '600',
  },
  leaderScore: {
    fontSize: 15,
    fontWeight: '600',
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
