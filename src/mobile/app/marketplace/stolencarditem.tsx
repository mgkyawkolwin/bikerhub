import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import type { StolenBikeReport } from '@/models/stolenBikeReport';
import { useI18n } from '@/i18n';

type StolenCardItemProps = {
  item: StolenBikeReport;
  onPress: () => void;
};

export default function StolenCardItem({ item, onPress }: StolenCardItemProps) {
  const { t } = useI18n();
  const { colors } = useThemeContext();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}> 
            {item.make} {item.model} {item.cc}cc {item.edition} {item.year}
          </Text>
        </View>

        {item.medias?.[0]?.url ? (
          <Image source={{ uri: item.medias[0].url }} style={styles.cardImage} />
        ) : null}

        <View style={styles.cardContent}>
          <View style={styles.metaRow}>
            <MaterialIcons name="location-pin" size={14} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}> 
              {t.Title.lostLocation}: {item.city}, {item.country}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="schedule" size={14} color={colors.secondaryText} />
            <Text style={[styles.metaText, { color: colors.secondaryText }]}> 
              {t.Title.lostDate}: {item.stolenDate ? new Date(item.stolenDate).toLocaleDateString() : 'Unknown date'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardSubtitle: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
});
