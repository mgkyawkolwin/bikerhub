import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Linking, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { Rating } from '@/components/rating';
import ImageCarousel from '@/components/imageCarousel';
import ImageGallery from '@/components/imageGallery';
import { container } from '@/services';
import { MarketplaceServiceToken } from '@/services/marketplaceService';
import type { MarketplaceService } from '@/services/marketplaceService';
import type { BikeListing } from '@/models/bikeListing';
import SnackBar from '@/components/snackbar';

export default function BikeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const marketplaceService = useMemo(
    () => container.resolve<MarketplaceService>(MarketplaceServiceToken),
    [],
  );

  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const [listing, setListing] = useState<BikeListing | null>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    let active = true;
    (async () => {
      const response = await marketplaceService.getListingById(id);
      if (!response.ok) {
        SnackBar.Error('Request failed. Please try again.');
        return;
      }
      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return;
      }
      const item = responseJson.data as BikeListing;
      if (active) {
        setListing(item ?? null);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, marketplaceService]);

  const images = listing?.images?.length ? listing.images : listing?.imageUrl ? [listing.imageUrl] : [];

  function handleCall() {
    if (!listing?.phone) return;
    Linking.openURL(`tel:${listing.phone}`);
  }

  const handleOpenGallery = (index: number) => {
    if (!images.length) return;
    setGalleryIndex(index);
    setGalleryVisible(true);
  };

  const toggleFavorite = async () => {
    if (!listing?.id) return;
    await marketplaceService.toggleFavorite(listing.id);
    const updatedResponse = await marketplaceService.getListingById(listing.id);
    if (!updatedResponse.ok) {
      SnackBar.Error('Request failed. Please try again.');
      return;
    }
    const updatedJson = await updatedResponse.json();
    if (!updatedJson.success) {
      SnackBar.Error(updatedJson.message || 'Failed response. Please try again.');
      return;
    }
    const updated = updatedJson.data as BikeListing;
    if (updated) setListing(updated);
  };

  const toggleLike = async () => {
    if (!listing?.id) return;
    await marketplaceService.toggleLike(listing.id);
    const updatedResponse = await marketplaceService.getListingById(listing.id);
    if (!updatedResponse.ok) {
      SnackBar.Error('Request failed. Please try again.');
      return;
    }
    const updatedJson = await updatedResponse.json();
    if (!updatedJson.success) {
      SnackBar.Error(updatedJson.message || 'Failed response. Please try again.');
      return;
    }
    const updated = updatedJson.data as BikeListing;
    if (updated) setListing(updated);
  };

  const handleRate = async (value: number) => {
    if (!listing?.id) return;
    const updatedResponse = await marketplaceService.submitRating(listing.id, value);
    if (!updatedResponse.ok) {
      SnackBar.Error('Request failed. Please try again.');
      return;
    }
    const updatedJson = await updatedResponse.json();
    if (!updatedJson.success) {
      SnackBar.Error(updatedJson.message || 'Failed response. Please try again.');
      return;
    }
    const updated = updatedJson.data as BikeListing;
    if (updated) {
      setListing(updated);
    }
  };

  function handleChat() {
    // Placeholder until chat screen is implemented.
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.Title.bikeDetail}</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.statAction}>
            <MaterialIcons name="visibility" size={20} color={colors.text} />
            <Text style={[styles.countText, { color: colors.text }]}>{listing?.viewCount ?? 0}</Text>
          </View>
          <TouchableOpacity style={styles.statAction} onPress={toggleFavorite} hitSlop={10}>
            <MaterialIcons
              name={listing?.isFavorite ? 'favorite' : 'favorite-border'}
              size={20}
              color={listing?.isFavorite ? '#E85D04' : colors.text}
            />
            <Text style={[styles.countText, { color: listing?.isFavorite ? '#E85D04' : colors.text }]}>{listing?.favoritesCount ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statAction} onPress={toggleLike} hitSlop={10}>
            <MaterialIcons
              name={listing?.isLiked ? 'thumb-up' : 'thumb-up-off-alt'}
              size={20}
              color={listing?.isLiked ? '#E85D04' : colors.text}
            />
            <Text style={[styles.countText, { color: listing?.isLiked ? '#E85D04' : colors.text }]}>{listing?.likeCount ?? 0}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {listing ? (
          <>
            <ImageCarousel images={images} imageHeight={260} onImagePress={handleOpenGallery} />
            <View style={styles.photoText}>
              <Text style={[styles.title, { color: colors.text }]}>{listing.title}</Text>
              <Text style={[styles.price, { color: colors.accent }]}>{listing.price ? `Ks ${listing.price.toLocaleString()}` : '-'}</Text>
            </View>

            <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.Title.specs}</Text>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.make}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.make}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.model}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.model}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.type}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.type}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.modelYear}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.year}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.cc}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.cc}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.km}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.km}</Text>
              </View>
            </View>

            <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.Title.sellerInfo}</Text>
                <Rating value={listing.rating ?? 0} onRate={handleRate} />
              </View>
              <View style={styles.sellerRow}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.sellerInfo}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.sellerName}</Text>
              </View>
              <View style={styles.sellerRow}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.location}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.location}</Text>
              </View>
              <View style={styles.sellerRow}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.phone}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.phone ?? '-'}</Text>
              </View>
              <View style={styles.sellerRow}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Rating</Text>
                <View style={styles.ratingValue}>
                  <Rating value={listing.rating ?? 0} />
                  <Text style={[styles.ratingCount, { color: colors.secondaryText }]}>({listing.ratingCount ?? 0})</Text>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={handleCall}>
                  <MaterialIcons name="call" size={16} color={colors.accent} />
                  <Text style={[styles.actionLabel, { color: colors.accent }]}>{t.Title.call}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={handleChat}>
                  <MaterialIcons name="chat" size={16} color={colors.accent} />
                  <Text style={[styles.actionLabel, { color: colors.accent }]}>{t.Title.chat}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.text }]}>{t.Text.noListings}</Text>
          </View>
        )}
      </ScrollView>

      <ImageGallery
        visible={galleryVisible}
        images={images}
        startIndex={galleryIndex}
        onClose={() => setGalleryVisible(false)}
      />
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
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
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
    gap: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden'
  },
  group: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16
  },
  photoText: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
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
    marginBottom: 16,
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#999999',
  },
  value: {
    fontSize: 14,
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