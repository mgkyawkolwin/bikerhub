import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container } from '@/services';
import { GarageBikeServiceToken } from '@/services/garageBikeService';
import type { GarageBikeService } from '@/services/garageBikeService';
import type { GarageBike } from '@/models/garageBike';
import SnackBar from '@/components/snackbar';

export default function GarageBikeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const { authUser } = useAuthContext();
  const params = useLocalSearchParams();
  const garageBikeService = useMemo(
    () => container.resolve<GarageBikeService>(GarageBikeServiceToken),
    [],
  );

  const garageBikeId = Array.isArray(params.garageBikeId) ? params.garageBikeId[0] : params.garageBikeId;
  const [garageBike, setGarageBike] = useState<GarageBike | null>(null);

  const loadGarageBike = useCallback(async () => {
    if (!garageBikeId) {
      setGarageBike(null);
      return;
    }

    try {
      const response = await garageBikeService.getGarageBikeById(garageBikeId);
      if (!response.ok) {
        return;
      }

      const responseJson = await response.json();
      if (responseJson.success) {
        setGarageBike(responseJson.data ?? null);
      }
    } catch {
      setGarageBike(null);
    }
  }, [garageBikeId, garageBikeService]);

  useEffect(() => {
    void loadGarageBike();
  }, [loadGarageBike]);

  useFocusEffect(
    useCallback(() => {
      void loadGarageBike();
    }, [loadGarageBike]),
  );

  const isOwner = Boolean(authUser?.id && garageBike?.createdById && authUser.id === garageBike.createdById);

  const handleDelete = async () => {
    if (!garageBike?.id) return;

    Alert.alert('Delete bike', 'Are you sure you want to delete this bike?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await garageBikeService.deleteGarageBike(garageBike.id!);
            if (!response.ok) {
              SnackBar.Error('Unable to delete garage bike right now.');
              return;
            }

            SnackBar.Success('Garage bike deleted.');
            setTimeout(() => router.back(), 600);
          } catch {
            SnackBar.Error('Unable to delete garage bike right now.');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (!garageBike) return;

    router.push({
      pathname: '/social/addGarageBike' as never,
      params: {
        mode: 'edit',
        garageBikeId: garageBike.id,
      } as never,
    });
  };

  if (!garageBike) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
        <View style={[styles.header, { borderBottomColor: colors.border }]}> 
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Garage Bike</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>This bike is not available.</Text>
        </View>
      </View>
    );
  }

  const imageUri = (() => {
    const firstImage = garageBike.images?.[0];
    if (typeof firstImage === 'string') {
      return firstImage;
    }
    if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
      return String((firstImage as { url?: string }).url || '');
    }
    return 'https://placehold.co/600x400/png?text=No+Image';
  })();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}> 
        <Image source={{ uri: imageUri }} style={styles.image} />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bike details</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Make</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.make || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Model</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.model || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Year</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.year || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>CC</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.cc || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Type</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.type || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>VIN</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.vin || '—'}</Text>
          </View>
        </View>

        {isOwner ? (
          <View style={styles.actions}> 
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.button }]} onPress={handleEdit}>
              <MaterialIcons name="edit" size={18} color={colors.buttonText} />
              <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.error }]} onPress={handleDelete}>
              <MaterialIcons name="delete" size={18} color={colors.buttonText} />
              <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#D64545',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
  },
});
