import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Linking, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';
import ImageCarousel from '@/components/imageCarousel';
import ImageGallery from '@/components/imageGallery';
import { container } from '@/services';
import { StolenBikeServiceToken } from '@/services/stolenBikeService';
import type { StolenBikeService } from '@/services/stolenBikeService';
import type { StolenBikeReport } from '@/models/stolenBikeReport';
import SnackBar from '@/components/snackbar';

export default function StolenReportDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useI18n();
  const { colors } = useThemeContext();
  const stolenBikeService = useMemo(
    () => container.resolve<StolenBikeService>(StolenBikeServiceToken),
    [],
  );

  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const [report, setReport] = useState<StolenBikeReport | null>(null);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    let active = true;

    (async () => {
      const response = await stolenBikeService.getReportById(id);
      if (!response.ok) {
        SnackBar.Error('Request failed. Please try again.');
        return;
      }

      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed response. Please try again.');
        return;
      }

      const item = responseJson.data as StolenBikeReport;
      if (active) {
        setReport(item ?? null);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, stolenBikeService]);

  const images = report?.medias?.map((media) => media.url) ?? [];

  const handleOpenGallery = (index: number) => {
    if (!images.length) return;
    setGalleryIndex(index);
    setGalleryVisible(true);
  };

  const handleCall = () => {
    if (!report?.phone) return;
    Linking.openURL(`tel:${report.phone}`);
  };

  const stolenDateText = report?.stolenDate ? new Date(report.stolenDate).toLocaleDateString() : '-';
  const reportedByText = report?.createdById ?? '-';

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.Title.reportStolen}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {report ? (
          <>
            <ImageCarousel images={images} imageHeight={240} onImagePress={handleOpenGallery} />
            <View style={styles.photoText}>
              <Text style={[styles.title, { color: colors.text }]}>{report.make} {report.model} {report.cc}cc {report.edition} {report.year ?? ''}</Text>
              <Text style={[styles.subtitle, { color: colors.secondaryText }]}>{t.Title.lostDate}: {stolenDateText}</Text>
            </View>

            <View style={[styles.group, { backgroundColor: colors.background }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.Title.specification}</Text>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.make}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.make ?? '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.model}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.model ?? '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.edition}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.edition ?? '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.type}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.type ?? '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.modelYear}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.year ?? '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.cc}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.cc ? `${report.cc} cc` : '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.vin}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.vin ?? 'NA'}</Text>
              </View>
              <View style={styles.sectionContent}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.description}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.description ?? '-'}</Text>
              </View>
            </View>

            <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.Title.reportedBy}</Text>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.name}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.reportedByName ?? '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.location}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.city ?? '-'}{report.city && report.country ? ', ' : ''}{report.country ?? ''}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.Title.phone}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{report.phone ?? '-'}</Text>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity disabled={!report.phone} style={[styles.actionButton, { borderColor: colors.border }]} onPress={handleCall}>
                  <MaterialIcons name="call" size={16} color={colors.accent} />
                  <Text style={[styles.actionLabel, { color: colors.accent }]}>{t.Title.call}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.text }]}>{'Report not found.'}</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
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
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  group: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionContent: {
    gap: 8,
    marginTop: 8,
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
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
