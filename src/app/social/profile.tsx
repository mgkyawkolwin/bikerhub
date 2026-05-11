import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/themedText';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { SocialProfileServiceToken } from '@/services/socialProfileService';
import { SocialPostServiceToken } from '@/services/socialPostService';
import type { SocialProfileService } from '@/services/socialProfileService';
import type { SocialPostService } from '@/services/socialPostService';
import type SocialProfile from '@/models/socialProfile';
import type SocialPost from '@/models/socialPost';

export default function SocialProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const params = useLocalSearchParams();
  const profileService = useMemo(() => container.resolve<SocialProfileService>(SocialProfileServiceToken), []);
  const socialPostService = useMemo(() => container.resolve<SocialPostService>(SocialPostServiceToken), []);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;

  const colors = useMemo(
    () => ({
      background: isDark ? '#000000' : '#FFFFFF',
      card: isDark ? '#1C1C1E' : '#F8F9FA',
      border: isDark ? '#2C2C2E' : '#E5E5EA',
      primary: isDark ? '#FFFFFF' : '#000000',
      secondary: isDark ? '#8E8E93' : '#6C6C70',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [profileResult, postsResult] = await Promise.all([
        profileService.getProfileById(userId),
        socialPostService.getPostsByAuthor(userId, 1, 20),
      ]);
      setProfile(profileResult ?? null);
      setPosts(postsResult.items);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, profileService, socialPostService]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const renderPost = ({ item }: { item: SocialPost }) => (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>      
      <View style={styles.postHeader}>
        <Image source={{ uri: item.authorAvatarUrl ?? '' }} style={styles.postAvatar} />
        <View style={styles.postMeta}>
          <ThemedText style={[styles.authorName, { color: colors.primary }]} numberOfLines={1}>
            {item.authorName}
          </ThemedText>
          <View style={styles.metaRow}>
            <MaterialIcons name="schedule" size={12} color={colors.secondary} />
            <ThemedText style={[styles.metaText, { color: colors.secondary }]}> 
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
            </ThemedText>
          </View>
        </View>
      </View>
      <ThemedText style={[styles.postContent, { color: colors.primary }]}>{item.content}</ThemedText>

      {item.imageUrls?.length ? (
        <View style={styles.imageGrid}>
          {item.imageUrls.map((uri, idx) => (
            <Image
              key={`${item.id}-${idx}`}
              source={{ uri }}
              style={[styles.postImage, item.imageUrls?.length === 1 ? styles.singleImage : styles.multiImage]}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.postActions}>
        <View style={styles.actionBlock}>
          <MaterialIcons name="favorite-border" size={18} color={colors.secondary} />
          <ThemedText style={[styles.actionText, { color: colors.secondary }]}>{item.loveCount}</ThemedText>
        </View>
        <View style={styles.actionBlock}>
          <MaterialIcons name="comment" size={18} color={colors.secondary} />
          <ThemedText style={[styles.actionText, { color: colors.secondary }]}>{item.commentCount}</ThemedText>
        </View>
        <TouchableOpacity style={styles.postShareButton} activeOpacity={0.75}>
          <MaterialIcons name="share" size={18} color={colors.primary} />
          <ThemedText style={[styles.shareText, { color: colors.primary }]}>Share</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!userId) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: 16 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Profile</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <MaterialIcons name="person-off" size={48} color={colors.secondary} />
          <ThemedText style={[styles.emptyText, { color: colors.secondary, marginTop: 12 }]}>
            User not found
          </ThemedText>
        </View>
      </View>
    );
  }

  if (loading && !profile) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, paddingHorizontal: 16 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Profile</ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingState}>
          <ThemedText style={{ color: colors.secondary }}>Loading...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top, paddingHorizontal: 16 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: colors.primary }]} numberOfLines={1}>
          Profile
        </ThemedText>
        <TouchableOpacity hitSlop={14}>
          <MaterialIcons name="more-horiz" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item, index) => item.id ?? index.toString()}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        ListHeaderComponent={
          profile ? (
            <>
              <Image source={{ uri: profile.coverPhotoUrl }} style={styles.coverImage} />
              
              <View style={styles.profileContainer}>
                {/* Row 1: Avatar + Name + Social Icons */}
                <View style={styles.avatarNameRow}>
                  <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                  <View style={styles.nameAndSocial}>
                    <View style={styles.nameRow}>
                      <ThemedText style={[styles.profileName, { color: colors.primary }]}>
                      {profile.name}
                    </ThemedText>
                    <TouchableOpacity style={styles.shareButton} activeOpacity={0.8} onPress={() => {}}>
                      <MaterialIcons name="share" size={18} color={colors.accent} />
                      <ThemedText style={[styles.shareButtonText, { color: colors.accent }]}>Share</ThemedText>
                    </TouchableOpacity>
                    </View>
                    {profile.socialLinks.length > 0 && (
                      <View style={styles.socialIconRow}>
                        {profile.socialLinks.map((link) => (
                          <TouchableOpacity 
                            key={link.platform} 
                            style={styles.socialIconButton} 
                            activeOpacity={0.7}
                            onPress={() => {}}
                          >
                            <MaterialIcons name={mapPlatformIcon(link.platform)} size={16} color={colors.secondary} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Row 2: Bio */}
                {profile.bio ? (
                  <ThemedText style={[styles.profileBio, { color: colors.secondary }]}>
                    {profile.bio}
                  </ThemedText>
                ) : null}

                {/* Row 3: Followers, Following, Follow Button */}
                <View style={styles.statsAndFollowRow}>
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                        {profile.followersCount}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.secondary }]}>
                        Followers
                      </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                        {profile.followingCount}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: colors.secondary }]}>
                        Following
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={[styles.followButton, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
                      <ThemedText style={styles.followButtonText}>Follow</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.messageButton, { borderColor: colors.accent }]} activeOpacity={0.85}>
                      <ThemedText style={[styles.messageButtonText, { color: colors.accent }]}>Message</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Row 4: 5 Stats - Garages, Rides, Distance, Duration, Elevation */}
                <View style={[styles.fiveStatsGrid, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
                  {/* Garages */}
                  <View style={styles.fiveStatItem}>
                    <MaterialIcons name="garage" size={24} color={colors.accent} />
                    <ThemedText style={[styles.fiveStatValue, { color: colors.primary }]}>
                      {profile.garageCount}
                    </ThemedText>
                    <ThemedText style={[styles.fiveStatLabel, { color: colors.secondary }]}>
                      Garages
                    </ThemedText>
                  </View>

                  {/* Rides */}
                  <View style={styles.fiveStatItem}>
                    <MaterialIcons name="pedal-bike" size={24} color={colors.accent} />
                    <ThemedText style={[styles.fiveStatValue, { color: colors.primary }]}>
                      {profile.ridesCount}
                    </ThemedText>
                    <ThemedText style={[styles.fiveStatLabel, { color: colors.secondary }]}>
                      Rides
                    </ThemedText>
                  </View>

                  {/* Distance */}
                  <View style={styles.fiveStatItem}>
                    <MaterialIcons name="straighten" size={24} color={colors.accent} />
                    <ThemedText style={[styles.fiveStatValue, { color: colors.primary }]}>
                      {profile.rideDistance}
                    </ThemedText>
                    <ThemedText style={[styles.fiveStatLabel, { color: colors.secondary }]}>
                      Distance
                    </ThemedText>
                  </View>

                  {/* Duration */}
                  <View style={styles.fiveStatItem}>
                    <MaterialIcons name="schedule" size={24} color={colors.accent} />
                    <ThemedText style={[styles.fiveStatValue, { color: colors.primary }]}>
                      {profile.rideDuration}
                    </ThemedText>
                    <ThemedText style={[styles.fiveStatLabel, { color: colors.secondary }]}>
                      Duration
                    </ThemedText>
                  </View>

                  {/* Elevation */}
                  <View style={styles.fiveStatItem}>
                    <MaterialIcons name="terrain" size={24} color={colors.accent} />
                    <ThemedText style={[styles.fiveStatValue, { color: colors.primary }]}>
                      {profile.rideElevation}
                    </ThemedText>
                    <ThemedText style={[styles.fiveStatLabel, { color: colors.secondary }]}>
                      Elevation
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.profileActionRow}>
                  <TouchableOpacity
                    style={styles.profileActionButton}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/social/garage', params: { userId } })}
                  >
                    <MaterialIcons name="garage" size={20} color={colors.primary} />
                    <ThemedText style={[styles.profileActionLabel, { color: colors.primary }]}>Garages</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.profileActionButton} activeOpacity={0.8} onPress={() => router.push('/route')}>
                    <MaterialIcons name="pedal-bike" size={20} color={colors.primary} />
                    <ThemedText style={[styles.profileActionLabel, { color: colors.primary }]}>Rides</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileActionButton}
                    activeOpacity={0.8}
                    onPress={() => router.push({ pathname: '/social/listing', params: { userId } })}
                  >
                    <MaterialIcons name="storefront" size={20} color={colors.primary} />
                    <ThemedText style={[styles.profileActionLabel, { color: colors.primary }]}>Listing</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Posts Header */}
              <View style={styles.postsHeader}>
                <ThemedText style={[styles.postsTitle, { color: colors.primary }]}>Posts</ThemedText>
                <ThemedText style={[styles.postsCount, { color: colors.secondary }]}>{posts.length}</ThemedText>
              </View>
            </>
          ) : null
        }
        ListEmptyComponent={
          !loading && posts.length === 0 && profile ? (
            <View style={styles.emptyPosts}>
              <MaterialIcons name="post-add" size={48} color={colors.secondary} />
              <ThemedText style={[styles.emptyText, { color: colors.secondary, marginTop: 12 }]}>
                No posts yet
              </ThemedText>
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function mapPlatformIcon(platform: string): keyof typeof MaterialIcons.glyphMap {
  const icons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    facebook: 'facebook',
    instagram: 'camera-alt',
    youtube: 'play-circle',
    telegram: 'telegram',
    x: 'alternate-email',
    tiktok: 'music-note',
    web: 'language',
  };
  return icons[platform] || 'link';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  profileContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  // Row 1: Avatar + Name + Social Icons
  avatarNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  nameAndSocial: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  socialIconRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialIconButton: {
    padding: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Row 2: Bio
  profileBio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  // Row 3: Followers, Following, Follow Button
  statsAndFollowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  messageButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700'
  },
  statLabel: {
    fontSize: 13,
  },
  followButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  marketplaceButton: {
    marginTop: 14,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketplaceButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  profileActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  profileActionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Row 4: 5 Stats Grid
  fiveStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  fiveStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  fiveStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  fiveStatLabel: {
    fontSize: 11,
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  postsCount: {
    fontSize: 14,
  },
  postCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  postMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  postImage: {
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
  },
  singleImage: {
    width: '100%',
    height: 220,
  },
  multiImage: {
    width: '48%',
    height: 140,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    marginLeft: 4,
  },
  postShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});