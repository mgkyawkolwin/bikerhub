import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Clipboard, Modal, Pressable, ScrollView, StyleSheet, View, TouchableOpacity, Linking, Text, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
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
  const { getAuthUser } = useAuthContext();
  const authUser = getAuthUser();
  const currentUserId = authUser?.id;
  const marketplaceService = useMemo(
    () => container.resolve<MarketplaceService>(MarketplaceServiceToken),
    [],
  );

  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const [listing, setListing] = useState<BikeListing | null>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingAsSold, setIsMarkingAsSold] = useState(false);
  const [isReportingScam, setIsReportingScam] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);

  const shareUrl = useMemo(() => {
    if (!listing?.id) return '';
    return listing.shareUrl || `/share/marketplace/${listing.id}`;
  }, [listing]);

  const loadListing = useCallback(async (showRefreshIndicator = false) => {
    if (!id) return;

    if (showRefreshIndicator) {
      setRefreshing(true);
    }

    try {
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

      setListing((responseJson.data as BikeListing) ?? null);
    } finally {
      if (showRefreshIndicator) {
        setRefreshing(false);
      }
    }
  }, [id, marketplaceService]);

  useEffect(() => {
    void loadListing();
  }, [loadListing]);

  const images = listing?.medias?.map((media) => media.url) ?? [];

  function handleCall() {
    if (!listing?.sellerPhone) return;
    Linking.openURL(`tel:${listing.sellerPhone}`);
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
    if (!listing?.id || isSubmittingRating) return;
    setIsSubmittingRating(true);

    try {
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
        return;
      }

      setListing((prev) => {
        if (!prev) return prev;

        const previousRating = typeof prev.myRating === 'number' ? prev.myRating : null;
        const currentCount = prev.ratingCount ?? 0;
        const currentAverage = prev.rating ?? 0;
        let updatedCount = currentCount;
        let totalRating = currentAverage * currentCount;

        if (previousRating === null) {
          updatedCount += 1;
          totalRating += value;
        } else {
          totalRating += value - previousRating;
        }

        const updatedRating = updatedCount > 0 ? totalRating / updatedCount : 0;

        return {
          ...prev,
          myRating: value,
          rating: updatedRating,
          ratingCount: updatedCount,
        };
      });
    } catch {
      SnackBar.Error('Request failed. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  function handleChat() {
    const friendId = listing?.createdById ?? listing?.sellerId;
    if (!friendId) return;

    router.push({ pathname: '/chat/chat', params: { friendId } });
  }

  const canManageListing = Boolean(listing?.createdById && currentUserId && listing.createdById === currentUserId);

  const handleEdit = () => {
    if (!listing?.id) return;
    router.push({ pathname: '/marketplace/edit', params: { id: listing.id } });
  };

  const deleteListing = async () => {
    if (!listing?.id || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await marketplaceService.deleteListing(listing.id);
      if (!response.ok) {
        SnackBar.Error('Request failed. Please try again.');
        return;
      }

      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return;
      }

      SnackBar.Success('Listing deleted successfully.');
      setTimeout(() => router.back(), 500);
    } catch {
      SnackBar.Error('Unable to delete listing. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void deleteListing() },
      ],
    );
  };

  const handleRefresh = async () => {
    await loadListing(true);
  };

  const toggleSoldStatus = async () => {
    if (!listing?.id || isMarkingAsSold) return;

    const shouldMarkAsSold = !listing.isSold;
    setIsMarkingAsSold(true);
    try {
      const response = await marketplaceService.toggleSoldStatus(listing.id);
      if (!response.ok) {
        SnackBar.Error('Request failed. Please try again.');
        return;
      }

      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return;
      }

      const updated = responseJson.data as BikeListing;
      if (updated) {
        setListing(updated);
      }
      SnackBar.Success(shouldMarkAsSold ? 'Listing marked as sold.' : 'Listing unmarked as sold.');
    } catch {
      SnackBar.Error(shouldMarkAsSold ? 'Unable to mark as sold. Please try again.' : 'Unable to unmark sold status. Please try again.');
    } finally {
      setIsMarkingAsSold(false);
    }
  };

  const confirmToggleSoldStatus = () => {
    const actionText = listing?.isSold ? 'Unmark Sold' : 'Mark Sold';
    const message = listing?.isSold ? 'Are you sure you want to unmark this listing as sold?' : 'Are you sure you want to mark this listing as sold?';

    Alert.alert(
      actionText,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: actionText, onPress: () => void toggleSoldStatus() },
      ],
    );
  };

  const toggleReportStatus = async () => {
    if (!listing?.id || isReportingScam) return;

    setIsReportingScam(true);
    try {
      const response = await marketplaceService.toggleReportStatus(listing.id);
      if (!response.ok) {
        SnackBar.Error('Request failed. Please try again.');
        return;
      }

      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return;
      }

      const updated = responseJson.data as BikeListing;
      if (updated) {
        setListing(updated);
      }

      SnackBar.Success(updated?.isReported ? 'Listing reported as scam.' : 'Report removed from listing.');
    } catch {
      SnackBar.Error('Unable to update report status. Please try again.');
    } finally {
      setIsReportingScam(false);
    }
  };

  const confirmToggleReportStatus = () => {
    const actionText = listing?.isReported ? 'Unreport Scam' : 'Report Scam';
    const message = listing?.isReported
      ? 'Are you sure you want to remove the scam report from this listing?'
      : 'Are you sure you want to report this listing as a scam?';

    Alert.alert(
      actionText,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: actionText, onPress: () => void toggleReportStatus() },
      ],
    );
  };

  const handleShareAsPost = () => {
    setShareSheetVisible(false);
    if (!shareUrl) return;

    void router.push({ pathname: '/social/create', params: { shareUrl } });
  };

  const handleCopyShareLink = () => {
    if (!shareUrl) {
      setShareSheetVisible(false);
      return;
    }

    try {
      Clipboard.setString(shareUrl);
      SnackBar.Success('Link copied to clipboard.');
    } catch {
      SnackBar.Error('Unable to copy link.');
    } finally {
      setShareSheetVisible(false);
    }
  };

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
          <TouchableOpacity hitSlop={10} onPress={() => setShareSheetVisible(true)}>
            <MaterialIcons name="share" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={colors.text} />}
      >
        {listing ? (
          <>
            <ImageCarousel images={images} imageHeight={240} onImagePress={handleOpenGallery} />
            <View style={styles.photoText}>
              <View style={styles.priceRow}>
                <Text style={[styles.title, { color: colors.text, flex: 1 }]}>{listing.make} {listing.model} {listing.cc}cc {listing.year} {listing.edition}</Text>
                <View style={styles.priceActions}>
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
              <Text style={[styles.price, { color: colors.accent }]}>{listing.price ? `Ks ${listing.price.toLocaleString()}` : '-'}</Text>
              {listing.isSold ? (
                <View style={styles.soldBadge}>
                  <View style={styles.soldBadgeContent}>
                    <MaterialIcons name="local-offer" size={18} color="#ffffff" />
                    <Text style={styles.soldBadgeText}>SOLD</Text>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={[styles.group, { backgroundColor: colors.background }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.Title.specification}</Text>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.make}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.make}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.model}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.model}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.edition}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.edition}</Text>
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
                <Text style={[styles.value, { color: colors.text }]}>{listing.cc} cc</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.mileage} ({t.Title.km})</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.mileage} km</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.vin}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.vin ? listing.vin : "NA"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.description}</Text>
                <Text style={[styles.value, { color: colors.text, flex: 1, textAlign: 'right' }]} numberOfLines={3}>{listing.description ? listing.description : '-'}</Text>
              </View>
            </View>

            <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.Title.sellerInfo}</Text>
                <Rating value={listing.myRating ?? 0} onRate={handleRate} />
              </View>
              <View style={styles.sellerRow}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.sellerName}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.sellerName}</Text>
              </View>
              <View style={styles.sellerRow}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.location}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.sellerCity} {listing.sellerCity && listing.sellerCountry && ", "} {listing.sellerCountry}</Text>
              </View>
              <View style={styles.sellerRow}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.phone}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{listing.sellerPhone ?? '-'}</Text>
              </View>
              <View style={styles.sellerRow}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>Rating</Text>
                <View style={styles.ratingValue}>
                  <Rating value={listing.rating ?? 0} />
                  <Text style={[styles.ratingCount, { color: colors.secondaryText }]}>({listing.ratingCount ?? 0})</Text>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity disabled={!listing.sellerPhone} style={[styles.actionButton, { borderColor: colors.border }]} onPress={handleCall}>
                  <MaterialIcons name="call" size={16} color={colors.accent} />
                  <Text style={[styles.actionLabel, { color: colors.accent }]}>{t.Title.call}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={handleChat}>
                  <MaterialIcons name="chat" size={16} color={colors.accent} />
                  <Text style={[styles.actionLabel, { color: colors.accent }]}>{t.Title.chat}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {canManageListing ? (
              <View style={styles.ownerButtonRow}>
                <TouchableOpacity
                  style={[
                    styles.ownerActionButton,
                    { borderColor: listing?.isSold ? '#2E7D32' : colors.border, backgroundColor: colors.card },
                  ]}
                  onPress={confirmToggleSoldStatus}
                  disabled={isMarkingAsSold}
                >
                  <MaterialIcons name="sell" size={16} color={listing?.isSold ? '#2E7D32' : colors.accent} />
                  <Text style={[styles.ownerActionLabel, { color: listing?.isSold ? '#2E7D32' : colors.accent }]}>
                    {isMarkingAsSold ? (listing?.isSold ? 'Unmarking...' : 'Marking...') : (listing?.isSold ? 'Unmark Sold' : 'Mark Sold')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.ownerActionButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                  onPress={handleEdit}
                >
                  <MaterialIcons name="edit" size={16} color={colors.accent} />
                  <Text style={[styles.ownerActionLabel, { color: colors.accent }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.ownerActionButton, styles.deleteButton, { borderColor: '#C62828', backgroundColor: colors.card }]}
                  onPress={confirmDelete}
                  disabled={isDeleting}
                >
                  <MaterialIcons name="delete" size={16} color="#C62828" />
                  <Text style={[styles.ownerActionLabel, { color: '#C62828' }]}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            
              <TouchableOpacity
                style={[
                  styles.fullWidthReportButton,
                  {
                    backgroundColor: listing?.isReported ? '#B71C1C' : colors.accent,
                    borderColor: listing?.isReported ? '#B71C1C' : colors.accent,
                  },
                ]}
                onPress={confirmToggleReportStatus}
                disabled={isReportingScam}
              >
                <MaterialIcons name="report-problem" size={18} color="#fff" />
                <Text style={styles.fullWidthReportButtonText}>
                  {isReportingScam ? (listing?.isReported ? 'Removing...' : 'Reporting...') : (listing?.isReported ? 'Unreport Scam' : 'Report Scam')}
                </Text>
              </TouchableOpacity>
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

      <Modal visible={shareSheetVisible} animationType="slide" transparent onRequestClose={() => setShareSheetVisible(false)}>
        <Pressable style={styles.shareSheetOverlay} onPress={() => setShareSheetVisible(false)}>
          <View style={[styles.shareSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.shareSheetHandle} />
            <Text style={[styles.shareSheetTitle, { color: colors.text }]}>Share</Text>
            <TouchableOpacity activeOpacity={0.8} onPress={handleShareAsPost} style={[styles.shareSheetOption, { borderBottomColor: colors.border }]}>
              <Text style={[styles.shareSheetOptionText, { color: colors.text }]}>Share As A Post</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={handleCopyShareLink} style={styles.shareSheetOption}>
              <Text style={[styles.shareSheetOptionText, { color: colors.text }]}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    fontSize: 20,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  soldBadge: {
    marginTop: 8,
    backgroundColor: '#ff0000',
    width: 90,
    height: 38,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  soldBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  soldBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
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
    fontSize: 16,
    color: '#999999',
  },
  value: {
    fontSize: 16,
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
  ownerButtonRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  ownerActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  ownerActionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    borderWidth: 1,
  },
  fullWidthReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginTop: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  fullWidthReportButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  shareSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  shareSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },
  shareSheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9AA0A6',
    alignSelf: 'center',
    marginBottom: 12,
  },
  shareSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  shareSheetOption: {
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  shareSheetOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});