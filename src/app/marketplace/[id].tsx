import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View, TouchableOpacity, Image, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { ThemedText } from '@/components/themedText';
import { Rating } from '@/components/rating';
import { container, RatingServiceToken } from '@/services';
import { FavoriteServiceToken } from '@/services/favoriteService';
import { LikeServiceToken } from '@/services/likeService';
import { MarketplaceServiceToken } from '@/services/marketplaceService';
import type { FavoriteService } from '@/services/favoriteService';
import type { LikeService } from '@/services/likeService';
import type { MarketplaceService } from '@/services/marketplaceService';
import type { RatingService } from '@/services';
import type { BikeListing } from '@/models/bikeListing';

export default function BikeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { isDark } = useThemeContext();
  const marketplaceService = useMemo(
    () => container.resolve<MarketplaceService>(MarketplaceServiceToken),
    [],
  );
  const favoriteService = useMemo(
    () => container.resolve<FavoriteService>(FavoriteServiceToken),
    [],
  );
  const likeService = useMemo(
    () => container.resolve<LikeService>(LikeServiceToken),
    [],
  );
  const ratingService = useMemo(
    () => container.resolve<RatingService>(RatingServiceToken),
    [],
  );

  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const [listing, setListing] = useState<BikeListing | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    let active = true;
    (async () => {
      const item = await marketplaceService.getListingById(id);
      if (active) {
        setListing(item ?? null);
      }
      if (active && item?.id) {
        const [favoriteState, likedState, ratingState] = await Promise.all([
          favoriteService.isFavorite(item.id),
          likeService.isLiked(item.id),
          ratingService.getRating(item.id),
        ]);
        if (active) {
          setIsFavorite(favoriteState);
          setIsLiked(likedState);
          setRating(ratingState.value);
          setRatingCount(ratingState.count);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [id, marketplaceService, favoriteService, likeService, ratingService]);

  const colors = useMemo(
    () => ({
      root: '#000000',
      header: '#000000',
      card: isDark ? '#121212' : '#FFFFFF',
      border: isDark ? '#232323' : '#E0E0E0',
      primary: isDark ? '#FFFFFF' : '#000000',
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const images = listing?.images?.length ? listing.images : listing?.imageUrl ? [listing.imageUrl] : [];

  function handleCall() {
    if (!listing?.phone) return;
    Linking.openURL(`tel:${listing.phone}`);
  }

  const toggleFavorite = async () => {
    if (!listing?.id) return;
    await favoriteService.toggleFavorite(listing.id);
    const favoriteState = await favoriteService.isFavorite(listing.id);
    setIsFavorite(favoriteState);
    const updated = await marketplaceService.getListingById(listing.id);
    if (updated) setListing(updated);
  };

  const toggleLike = async () => {
    if (!listing?.id) return;
    await likeService.toggleLike(listing.id);
    const likedState = await likeService.isLiked(listing.id);
    setIsLiked(likedState);
    const updated = await marketplaceService.getListingById(listing.id);
    if (updated) setListing(updated);
  };

  const handleRate = async (value: number) => {
    if (!listing?.id) return;
    const ratingState = await ratingService.submitRating(listing.id, value);
    setRating(ratingState.value);
    setRatingCount(ratingState.count);
  };

  function handleChat() {
    // Placeholder until chat screen is implemented.
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.root, paddingTop: insets.top }]}> 
      <View style={[styles.header, { backgroundColor: colors.header }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ThemedText style={[styles.headerTitle, { color: '#FFFFFF' }]}>{t.Title.bikeDetail}</ThemedText>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.actionBadge, { borderColor: colors.border, backgroundColor: isFavorite ? '#E85D04' : colors.card }]}> 
            <ThemedText style={[styles.actionBadgeText, { color: isFavorite ? '#FFFFFF' : colors.secondary }]}>{listing?.favoritesCount ?? 0}</ThemedText>
          </View>
          <TouchableOpacity onPress={toggleFavorite} hitSlop={10}>
            <MaterialIcons
              name={isFavorite ? 'favorite' : 'favorite-border'}
              size={20}
              color={isFavorite ? '#E85D04' : '#FFFFFF'}
            />
          </TouchableOpacity>
          <View style={[styles.actionBadge, { borderColor: colors.border, backgroundColor: isLiked ? '#E85D04' : colors.card }]}> 
            <ThemedText style={[styles.actionBadgeText, { color: isLiked ? '#FFFFFF' : colors.secondary }]}>{listing?.likeCount ?? 0}</ThemedText>
          </View>
          <TouchableOpacity onPress={toggleLike} hitSlop={10}>
            <MaterialIcons
              name={isLiked ? 'thumb-up' : 'thumb-up-off-alt'}
              size={20}
              color={isLiked ? '#E85D04' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {listing ? (
          <>
            <View style={styles.imageWrapper}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.carousel}
              >
                {images.length ? (
                images.map((source, index) => (
                  <Image key={`${source}-${index}`} source={{ uri: source }} style={styles.carouselImage} />
                ))
              ) : (
                <View style={[styles.carouselImage, { backgroundColor: colors.border }]} />
              )}
              </ScrollView>
            </View>

            <View style={styles.photoText}>
              <ThemedText style={[styles.title, { color: colors.primary }]}>{listing.title}</ThemedText>
              <ThemedText style={[styles.price, { color: colors.accent }]}>{listing.price ? `Ks ${listing.price.toLocaleString()}` : '-'}</ThemedText>
            </View>

            <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>{t.Title.specs}</ThemedText>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>{t.Title.make}</ThemedText>
                <ThemedText style={[styles.value, { color: colors.primary }]}>{listing.make}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>{t.Title.model}</ThemedText>
                <ThemedText style={[styles.value, { color: colors.primary }]}>{listing.model}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>{t.Title.modelYear}</ThemedText>
                <ThemedText style={[styles.value, { color: colors.primary }]}>{listing.year}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>{t.Title.cc}</ThemedText>
                <ThemedText style={[styles.value, { color: colors.primary }]}>{listing.cc}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>{t.Title.type}</ThemedText>
                <ThemedText style={[styles.value, { color: colors.primary }]}>{listing.type}</ThemedText>
              </View>
            </View>

            <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>{t.Title.sellerInfo}</ThemedText>
                <Rating value={rating} onRate={handleRate} />
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>{t.Title.sellerInfo}</ThemedText>
                <ThemedText style={[styles.value, { color: colors.primary }]}>{listing.sellerName}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>{t.Title.location}</ThemedText>
                <ThemedText style={[styles.value, { color: colors.primary }]}>{listing.location}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>{t.Title.phone}</ThemedText>
                <ThemedText style={[styles.value, { color: colors.primary }]}>{listing.phone ?? '-'}</ThemedText>
              </View>
              <View style={styles.ratingRow}>
                <ThemedText style={[styles.label, { color: colors.secondary }]}>Rating</ThemedText>
                <View style={styles.ratingValue}>
                  <Rating value={rating} />
                  <ThemedText style={[styles.ratingCount, { color: colors.secondary }]}>({ratingCount})</ThemedText>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={handleCall}>
                  <MaterialIcons name="call" size={16} color={colors.accent} />
                  <ThemedText style={[styles.actionLabel, { color: colors.accent }]}>{t.Title.call}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={handleChat}>
                  <MaterialIcons name="chat" size={16} color={colors.accent} />
                  <ThemedText style={[styles.actionLabel, { color: colors.accent }]}>{t.Title.chat}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.primary }]}>{t.Text.noListings}</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#000000',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  imageWrapper: {
    width: '100%',
    height: 260,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  group: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 16,
  },
  carousel: {
    width: '100%',
  },
  carouselImage: {
    width: Dimensions.get('window').width,
    height: 260,
    resizeMode: 'cover',
  },
  photoText: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  section: {
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 13,
    color: '#999999',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
