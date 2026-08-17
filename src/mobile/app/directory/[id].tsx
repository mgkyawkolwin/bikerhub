import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useAuthContext } from '@/hooks/use-auth-context';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { DirectoryServiceToken } from '@/services/directoryService';
import type { DirectoryService } from '@/services/directoryService';
import Directory from '@/models/directory';
import { Rating } from '@/components/rating';

export default function DirectoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { authUser } = useAuthContext();
  const { colors } = useThemeContext();
  const directoryService = useMemo(() => container.resolve<DirectoryService>(DirectoryServiceToken), []);
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const [item, setItem] = useState<Directory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    void (async () => {
      const response = await directoryService.getDirectoryById(id);
      if (!active) return;
      if (!response.ok) {
        setItem(null);
        return;
      }
      const responseJson = await response.json();
      if (responseJson?.success !== true) {
        setItem(null);
        return;
      }
      setItem(responseJson.data ?? null);
    })();

    return () => {
      active = false;
    };
  }, [id, directoryService]);

  const isOwner = Boolean(item?.createdById && authUser?.id === item.createdById);

  const handleEdit = () => {
    if (!item?.id) return;
    router.push({ pathname: '/directory/new', params: { id: item.id } });
  };

  const handleDelete = async () => {
    if (!item?.id) return;
    setIsDeleting(true);
    try {
      const response = await directoryService.deleteDirectory(item.id);
      if (!response.ok) {
        Alert.alert('Delete failed', 'Unable to delete this directory listing.');
        return;
      }
      router.replace('/directory/directory');
    } catch {
      Alert.alert('Delete failed', 'Unable to delete this directory listing.');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete business',
      'Are you sure you want to delete this business listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    if (!item?.id) return;
    setIsTogglingFavorite(true);

    try {
      const response = await directoryService.toggleFavorite(item.id);
      if (!response.ok) {
        Alert.alert('Favorite failed', 'Unable to update favorite. Please try again.');
        return;
      }

      setItem((prev) => {
        if (!prev) return prev;
        const currentlyFavorited = Boolean(prev.isFavorited);
        const currentCount = prev.favoriteCount ?? 0;
        return {
          ...prev,
          isFavorited: !currentlyFavorited,
          favoriteCount: Math.max(0, currentCount + (currentlyFavorited ? -1 : 1)),
        };
      });
    } catch {
      Alert.alert('Favorite failed', 'Unable to update favorite. Please try again.');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!item?.id || isSubmittingRating) return;
    setIsSubmittingRating(true);

    try {
      const response = await directoryService.rateDirectory(item.id, rating);
      if (!response.ok) {
        Alert.alert('Rating failed', 'Unable to submit rating. Please try again.');
        return;
      }

      const responseJson = await response.json();
      if (responseJson?.success !== true) {
        Alert.alert('Rating failed', responseJson?.message || 'Unable to submit rating. Please try again.');
        return;
      }

      setItem((prev) => {
        if (!prev) return prev;

        const previousRating = typeof prev.myRating === 'number' ? prev.myRating : null;
        const currentCount = prev.ratingCount ?? 0;
        const currentAverage = prev.rating ?? 0;
        let updatedCount = currentCount;
        let totalRating = currentAverage * currentCount;

        if (previousRating === null) {
          updatedCount += 1;
          totalRating += rating;
        } else {
          totalRating += rating - previousRating;
        }

        const updatedRating = updatedCount > 0 ? totalRating / updatedCount : 0;

        return {
          ...prev,
          myRating: rating,
          rating: updatedRating,
          ratingCount: updatedCount,
        };
      });
    } catch {
      Alert.alert('Rating failed', 'Unable to submit rating. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.Title.directory}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {item ? (
          <View style={[styles.page, { backgroundColor: colors.background }]}>
            {item.coverImageUrl ? (
              <Image source={{ uri: item.coverImageUrl }} style={styles.image} />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: colors.border }]}>
                <MaterialIcons name="image" size={40} color={colors.secondaryText} />
              </View>
            )}
            <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.logoContainer, { backgroundColor: colors.background }]}>
                  {item.logoUrl ? (
                    <Image source={{ uri: item.logoUrl }} style={styles.logoImage} />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <MaterialIcons name="image" size={28} color={colors.secondaryText} />
                    </View>
                  )}
                </View>
                <View style={styles.titleBlock}>
                  <Text style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.subtitle, { color: colors.secondaryText }]} numberOfLines={1}>{item.businessType}</Text>
                  <View style={[styles.row, styles.favoriteRow, { alignItems: 'center' }]}>
                    <TouchableOpacity
                      style={[styles.favoriteButton]}
                      onPress={handleToggleFavorite}
                      activeOpacity={0.8}
                      disabled={isTogglingFavorite}
                    >
                      <MaterialIcons
                        name={item.isFavorited ? 'favorite' : 'favorite-border'}
                        size={24}
                        color={item.isFavorited ? '#E85D04' : colors.secondaryText}
                      />
                      <Text style={[styles.favoriteText, { color: colors.text }]}> {item.favoriteCount ?? 0}</Text>
                    </TouchableOpacity>
                    <Rating
                      value={item.myRating ?? 0}
                      max={5}
                      size={20}
                      color='#E85D04'
                      onRate={handleRate}
                      style={styles.ratingBlock}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.row}>
                <MaterialIcons name="location-on" size={24} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.address}</Text>
              </View>
              {item.city || item.state || item.country || item.postalCode ? (
                <View style={[styles.row, styles.wrapRow]}>
                  <MaterialIcons name="public" size={24} color={colors.secondaryText} />
                  <Text style={[styles.metaText, { color: colors.secondaryText }]}>
                    {[item.city, item.state, item.country].filter(Boolean).join(', ')}{item.postalCode ? ` • ${item.postalCode}` : ''}
                  </Text>
                </View>
              ) : null}
              {item.email ? (
                <View style={styles.row}>
                  <MaterialIcons name="email" size={24} color={colors.secondaryText} />
                  <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.email}</Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <MaterialIcons name="phone" size={24} color={colors.secondaryText} />
                <Text style={[styles.metaText, { color: colors.secondaryText }]}>{item.phone}</Text>
              </View>
              {item.googleMapUrl ? (
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => item.googleMapUrl && Linking.openURL(item.googleMapUrl)}
                >
                  <MaterialIcons name="map" size={24} color={colors.secondaryText} />
                  <Text style={[styles.metaLinkText, { color: colors.accent }]} numberOfLines={1} ellipsizeMode="tail">
                    View On Map
                  </Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.row}>
                <MaterialIcons name="star" size={24} color={colors.secondaryText} />
                <View style={styles.ratingValue}>
                  <Rating value={item.rating ?? 0} />
                  <Text style={[styles.ratingCount, { color: colors.secondaryText }]}>({item.ratingCount ?? 0})</Text>
                </View>
              </View>
              {isOwner ? (
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleEdit} activeOpacity={0.8}>
                    <Text style={[styles.actionText, { color: colors.text }]}>Edit </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.error || '#F8D7DA', borderColor: colors.border }]} onPress={confirmDelete} activeOpacity={0.8} disabled={isDeleting}>
                    <Text style={[styles.actionText, { color: '#B00020' }]}>{isDeleting ? 'Deleting…' : 'Delete '}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>{t.Text.noListings}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 22 },
  content: { paddingHorizontal: 16, gap: 16 },
  page: { flex: 1, gap: 16 },
  image: { width: '100%', height: 200, borderRadius: 4 },
  coverPlaceholder: { width: '100%', height: 300, borderRadius: 2, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 8, borderWidth: 0, padding: 0, gap: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoContainer: { width: 96, height: 96, borderRadius: 96, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logoImage: { width: '100%', height: '100%' },
  logoPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  titleBlock: { flex: 1, justifyContent: 'center' },
  titleText: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 16, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaText: { fontSize: 16, lineHeight: 20 },
  metaLinkText: { fontSize: 16, lineHeight: 20, textDecorationLine: 'underline' },
  wrapRow: { flexWrap: 'wrap' },
  favoriteRow: { paddingVertical: 8 },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  favoriteText: {
    marginLeft: 2,
    fontSize: 16,
    fontWeight: '700',
  },
  ratingBlock: {
    marginLeft: 16,
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  actionButton: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 14, fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14 },
});
