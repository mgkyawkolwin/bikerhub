import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import type { BikeListing } from '@/models/marketplace';
import { Rating } from '@/components/rating';

type MarketplaceCardItemProps = {
  item: BikeListing;
  onPress: () => void;
  onToggleFavorite: (listingId: string) => void;
  onToggleLike: (listingId: string) => void;
};

export default function MarketplaceCardItem({
  item,
  onPress,
  onToggleFavorite,
  onToggleLike,
}: MarketplaceCardItemProps) {
  const { colors } = useThemeContext();
  const favoriteColor = item.isFavorite ? '#E85D04' : colors.secondaryText;
  const likeColor = item.isLiked ? '#E85D04' : colors.secondaryText;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {item.make} {item.model} {item.cc}cc {item.edition} {item.year}
          </Text>
          <View style={styles.favoriteWrapper}>
            <TouchableOpacity onPress={() => void onToggleFavorite(item.id ?? '')} hitSlop={10}>
              <MaterialIcons
                name={item.isFavorite ? 'favorite' : 'favorite-border'}
                size={22}
                color={favoriteColor}
              />
            </TouchableOpacity>
            <Text style={[styles.countText, { color: favoriteColor }]}>{item.favoritesCount ?? 0}</Text>
          </View>
        </View>

        <View style={styles.imageWrapper}>
          <Image source={{ uri: item?.medias?.[0]?.url }} style={styles.cardImage} />
          {item.isSold ? (
            <View style={styles.soldBadge}>
              <View style={styles.soldBadgeContent}>
                <MaterialIcons name="local-offer" size={20} color={"#ffffff"} />
                <Text style={[styles.soldBadgeText, {  }]}>SOLD</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.cardPrice, { color: colors.accent }]}>Ks {item.price?.toLocaleString()}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.cardSeller, { color: colors.secondaryText }]}>{item.sellerName}</Text>
            <Rating value={item.rating ?? 0} size={12} style={{ gap: 0 }} />
          </View>
        </View>

        <View style={[styles.cardLocationRow, { justifyContent: 'space-between' }]}> 
          <View style={styles.locationRowLeft}>
            <MaterialIcons name="location-on" size={14} color={colors.secondaryText} />
            <Text style={[styles.cardLocationText, { color: colors.secondaryText }]}> 
              {item.sellerCity}
              {item.sellerCity && item.sellerCountry && ', '}
              {item.sellerCountry}
            </Text>
          </View>
          <View style={styles.statsRow}>
            {/* <View style={styles.viewsWrapper}>
              <MaterialIcons name="visibility" size={16} color={colors.secondaryText} />
              <Text style={[styles.countText, { color: colors.secondaryText }]}>{item.viewCount ?? 0}</Text>
            </View> */}
            <View style={styles.likeWrapper}>
              <TouchableOpacity onPress={() => void onToggleLike(item.id ?? '')} hitSlop={10}>
                <MaterialIcons
                  name={item.isLiked ? 'thumb-up' : 'thumb-up-off-alt'}
                  size={22}
                  color={likeColor}
                />
              </TouchableOpacity>
              <Text style={[styles.countText, { color: likeColor }]}>{item.likeCount ?? 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
    paddingVertical: 8,
  },
  favoriteWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  imageWrapper: {
    position: 'relative',
  },
  soldBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ff0000',
    width: 90,
    height: 40,
    borderRadius: 5,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardSeller: {
    fontSize: 16,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  cardLocationText: {
    fontSize: 13,
  },
});
