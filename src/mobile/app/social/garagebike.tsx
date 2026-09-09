import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container } from '@/services';
import { GarageBikeServiceToken } from '@/services/garageBikeService';
import type { GarageBikeService } from '@/services/garageBikeService';
import type { GarageBike, GarageBikeServiceHistory } from '@/models/garageBike';
import SnackBar from '@/components/snackbar';
import MediaGallery from '@/components/mediaGallery';

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
  const [serviceHistory, setServiceHistory] = useState<GarageBikeServiceHistory[]>([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyForm, setHistoryForm] = useState({ name: '', serviceDate: '', mileage: '' });
  const [historyEditId, setHistoryEditId] = useState<string | null>(null);
  const [historyServiceType, setHistoryServiceType] = useState<'Oil' | 'Coolant' | 'Chain' | 'Spark Plug'>('Oil');
  const [isSavingHistory, setIsSavingHistory] = useState(false);

  const oilHistory = useMemo(
    () => serviceHistory.filter((entry) => entry.serviceType === 'Oil'),
    [serviceHistory],
  );

  const coolantHistory = useMemo(
    () => serviceHistory.filter((entry) => entry.serviceType === 'Coolant'),
    [serviceHistory],
  );

  const chainHistory = useMemo(
    () => serviceHistory.filter((entry) => entry.serviceType === 'Chain'),
    [serviceHistory],
  );

  const sparkPlugHistory = useMemo(
    () => serviceHistory.filter((entry) => entry.serviceType === 'Spark Plug'),
    [serviceHistory],
  );

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

  const loadServiceHistory = useCallback(async () => {
    if (!garageBikeId) return;

    try {
      const response = await garageBikeService.getServiceHistory(garageBikeId);
      if (!response.ok) return;
      const responseJson = await response.json();
      if (responseJson.success) {
        setServiceHistory(Array.isArray(responseJson.data) ? responseJson.data : []);
      }
    } catch {
      setServiceHistory([]);
    }
  }, [garageBikeId, garageBikeService]);

  useEffect(() => {
    void loadGarageBike();
    void loadServiceHistory();
  }, [loadGarageBike, loadServiceHistory]);

  useFocusEffect(
    useCallback(() => {
      void loadGarageBike();
      void loadServiceHistory();
    }, [loadGarageBike, loadServiceHistory]),
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

  const handleSellOnMarketplace = async () => {
    if (!garageBike) return;

    const payload = {
      make: garageBike.make,
      model: garageBike.model,
      edition: garageBike.edition,
      year: garageBike.year,
      cc: garageBike.cc,
      type: garageBike.type,
      vin: garageBike.vin,
      km: garageBike.km,
      images: (garageBike.images ?? []).map((image) => image.url ?? '').filter((url): url is string => Boolean(url)),
    };

    await AsyncStorage.setItem('marketplace_sell_garagebike_pending', JSON.stringify(payload));

    router.push({
      pathname: '/marketplace/create' as never,
      params: {
        garageBike: JSON.stringify(payload),
      } as never,
    });
  };

  const handleDeleteMedia = async (item: { id?: string; uri?: string; url?: string; contentType?: string; objectName?: string }, index: number) => {
    if (!garageBike?.id || !item.id) {
      SnackBar.Error('Unable to delete this photo.');
      return;
    }

    Alert.alert('Delete photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await garageBikeService.deleteGarageBikeMedia(garageBike.id!, item.id!);
            if (!response.ok) {
              SnackBar.Error('Unable to delete this photo.');
              return;
            }

            const responseJson = await response.json();
            if (!responseJson.success) {
              SnackBar.Error(responseJson.message || 'Unable to delete this photo.');
              return;
            }

            setGarageBike((prev) => prev ? ({ ...prev, images: (prev.images ?? []).filter((_, imageIndex) => imageIndex !== index) }) : prev);
            SnackBar.Success('Photo deleted.');
          } catch {
            SnackBar.Error('Unable to delete this photo.');
          }
        },
      },
    ]);
  };

  const openHistoryModal = (entry?: GarageBikeServiceHistory, type: 'Oil' | 'Coolant' | 'Chain' | 'Spark Plug' = 'Oil') => {
    setHistoryServiceType(type);
    if (entry) {
      setHistoryEditId(entry.id ?? null);
      setHistoryForm({
        name: entry.name ?? '',
        serviceDate: entry.serviceDate ? entry.serviceDate.slice(0, 10) : '',
        mileage: entry.mileage?.toString() ?? '',
      });
    } else {
      setHistoryEditId(null);
      setHistoryForm({ name: '', serviceDate: '', mileage: '' });
    }
    setHistoryModalVisible(true);
  };

  const submitHistory = async () => {
    if (!garageBikeId || !historyForm.name?.trim() || !historyForm.serviceDate || !historyForm.mileage) {
      SnackBar.Error('Name, date and mileage are required.');
      return;
    }

    const parsedMileage = Number(historyForm.mileage);
    if (Number.isNaN(parsedMileage) || parsedMileage < 0) {
      SnackBar.Error('Mileage must be a valid number.');
      return;
    }

    setIsSavingHistory(true);

    try {
      const payload: GarageBikeServiceHistory = {
        id: historyEditId ?? undefined,
        garageBikeId: garageBikeId,
        serviceType: historyServiceType,
        name: historyForm.name.trim(),
        serviceDate: historyForm.serviceDate,
        mileage: parsedMileage,
      };

      const response = historyEditId
        ? await garageBikeService.updateServiceHistory(garageBikeId, historyEditId, payload)
        : await garageBikeService.createServiceHistory(garageBikeId, payload);

      const responseJson = await response.json();
      if (!response.ok || !responseJson.success) {
        SnackBar.Error(responseJson.message || `Unable to save ${historyServiceType.toLowerCase()} history.`);
        return;
      }

      setHistoryModalVisible(false);
      setHistoryForm({ name: '', serviceDate: '', mileage: '' });
      setHistoryEditId(null);
      setHistoryServiceType('Oil');
      await loadServiceHistory();
      SnackBar.Success(`${historyServiceType} history saved.`);
    } catch {
      SnackBar.Error(`Unable to save ${historyServiceType.toLowerCase()} history.`);
    } finally {
      setIsSavingHistory(false);
    }
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[{ color: colors.accent }]}></Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}> 
        <MediaGallery
          medias={garageBike.images?.map((image) => ({
            id: image.id,
            url: image.url,
            contentType: image.contentType
          })) ?? []}
          canDelete={isOwner}
          onDelete={handleDeleteMedia}
        />

        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bike details</Text>
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Make</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.make || '—'}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Model</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.model || '—'}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Edition</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.edition || '—'}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Year</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.year || '—'}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>CC</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.cc || '—'}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Type</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.type || '—'}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>VIN</Text>
            <Text style={[styles.value, { color: colors.text }]}>{garageBike.vin || '—'}</Text>
          </View>
        </View>

        <View style={[styles.historyCard, { borderColor: colors.border, backgroundColor: colors.card }]}> 
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Engine Oil History</Text>
            {isOwner ? (
              <TouchableOpacity onPress={() => openHistoryModal(undefined, 'Oil')} hitSlop={10}>
                <MaterialIcons name="add" size={26} color={colors.accent} />
              </TouchableOpacity>
            ) : null}
          </View>

          {oilHistory.length === 0 ? (
            <Text style={[styles.emptyHistoryText, { color: colors.secondaryText }]}>No oil change history yet.</Text>
          ) : (
            oilHistory.map((entry, index) => {
              const isFirst = index === 0;
              const isLast = index === oilHistory.length - 1;

              return (
                <View
                  key={entry.id}
                  style={[
                    styles.historyItem,
                    {
                      borderTopWidth: isFirst ? StyleSheet.hairlineWidth : 0,
                      borderBottomWidth: isLast ? StyleSheet.hairlineWidth : 0,
                      borderTopColor: colors.border,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.historyInfoBlock}>
                    <View style={styles.historyPrimaryRow}>
                      <Text style={[styles.historyValue, { color: colors.text }]}>{entry.serviceDate ? new Date(entry.serviceDate).toISOString().slice(0, 10) : '—'}</Text>
                      <Text style={[styles.historyValue, { color: colors.text }]}>{entry.mileage ?? 0} km</Text>
                    </View>
                    <Text style={[styles.historyNameText, { color: colors.secondaryText }]}>{entry.name || 'Oil Change'}</Text>
                  </View>

                  {isOwner ? (
                    <TouchableOpacity onPress={() => openHistoryModal(entry, 'Oil')} hitSlop={10}>
                      <MaterialIcons name="edit" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        <View style={[styles.historyCard, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 8 }]}> 
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Coolant Service History</Text>
            {isOwner ? (
              <TouchableOpacity onPress={() => openHistoryModal(undefined, 'Coolant')} hitSlop={10}>
                <MaterialIcons name="add" size={26} color={colors.accent} />
              </TouchableOpacity>
            ) : null}
          </View>

          {coolantHistory.length === 0 ? (
            <Text style={[styles.emptyHistoryText, { color: colors.secondaryText }]}>No coolant service history yet.</Text>
          ) : (
            coolantHistory.map((entry, index) => {
              const isFirst = index === 0;
              const isLast = index === coolantHistory.length - 1;

              return (
                <View
                  key={entry.id}
                  style={[
                    styles.historyItem,
                    {
                      borderTopWidth: isFirst ? StyleSheet.hairlineWidth : 0,
                      borderBottomWidth: isLast ? StyleSheet.hairlineWidth : 0,
                      borderTopColor: colors.border,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.historyInfoBlock}>
                    <View style={styles.historyPrimaryRow}>
                      <Text style={[styles.historyValue, { color: colors.text }]}>{entry.serviceDate ? new Date(entry.serviceDate).toISOString().slice(0, 10) : '—'}</Text>
                      <Text style={[styles.historyValue, { color: colors.text }]}>{entry.mileage ?? 0} km</Text>
                    </View>
                    <Text style={[styles.historyNameText, { color: colors.secondaryText }]}>{entry.name || 'Coolant Service'}</Text>
                  </View>

                  {isOwner ? (
                    <TouchableOpacity onPress={() => openHistoryModal(entry, 'Coolant')} hitSlop={10}>
                      <MaterialIcons name="edit" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        <View style={[styles.historyCard, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 8 }]}> 
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Chain Service History</Text>
            {isOwner ? (
              <TouchableOpacity onPress={() => openHistoryModal(undefined, 'Chain')} hitSlop={10}>
                <MaterialIcons name="add" size={26} color={colors.accent} />
              </TouchableOpacity>
            ) : null}
          </View>

          {chainHistory.length === 0 ? (
            <Text style={[styles.emptyHistoryText, { color: colors.secondaryText }]}>No chain service history yet.</Text>
          ) : (
            chainHistory.map((entry, index) => {
              const isFirst = index === 0;
              const isLast = index === chainHistory.length - 1;

              return (
                <View
                  key={entry.id}
                  style={[
                    styles.historyItem,
                    {
                      borderTopWidth: isFirst ? StyleSheet.hairlineWidth : 0,
                      borderBottomWidth: isLast ? StyleSheet.hairlineWidth : 0,
                      borderTopColor: colors.border,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.historyInfoBlock}>
                    <View style={styles.historyPrimaryRow}>
                      <Text style={[styles.historyValue, { color: colors.text }]}>{entry.serviceDate ? new Date(entry.serviceDate).toISOString().slice(0, 10) : '—'}</Text>
                      <Text style={[styles.historyValue, { color: colors.text }]}>{entry.mileage ?? 0} km</Text>
                    </View>
                    <Text style={[styles.historyNameText, { color: colors.secondaryText }]}>{entry.name || 'Chain Service'}</Text>
                  </View>

                  {isOwner ? (
                    <TouchableOpacity onPress={() => openHistoryModal(entry, 'Chain')} hitSlop={10}>
                      <MaterialIcons name="edit" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        <View style={[styles.historyCard, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 8 }]}> 
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Spark Plug Service History</Text>
            {isOwner ? (
              <TouchableOpacity onPress={() => openHistoryModal(undefined, 'Spark Plug')} hitSlop={10}>
                <MaterialIcons name="add" size={26} color={colors.accent} />
              </TouchableOpacity>
            ) : null}
          </View>

          {sparkPlugHistory.length === 0 ? (
            <Text style={[styles.emptyHistoryText, { color: colors.secondaryText }]}>No spark plug service history yet.</Text>
          ) : (
            sparkPlugHistory.map((entry, index) => {
              const isFirst = index === 0;
              const isLast = index === sparkPlugHistory.length - 1;

              return (
                <View
                  key={entry.id}
                  style={[
                    styles.historyItem,
                    {
                      borderTopWidth: isFirst ? StyleSheet.hairlineWidth : 0,
                      borderBottomWidth: isLast ? StyleSheet.hairlineWidth : 0,
                      borderTopColor: colors.border,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.historyInfoBlock}>
                    <View style={styles.historyPrimaryRow}>
                      <Text style={[styles.historyValue, { color: colors.text }]}>{entry.serviceDate ? new Date(entry.serviceDate).toISOString().slice(0, 10) : '—'}</Text>
                      <Text style={[styles.historyValue, { color: colors.text }]}>{entry.mileage ?? 0} km</Text>
                    </View>
                    <Text style={[styles.historyNameText, { color: colors.secondaryText }]}>{entry.name || 'Spark Plug Service'}</Text>
                  </View>

                  {isOwner ? (
                    <TouchableOpacity onPress={() => openHistoryModal(entry, 'Spark Plug')} hitSlop={10}>
                      <MaterialIcons name="edit" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        {isOwner ? (
          <View style={styles.actions}>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.button }]} onPress={handleEdit}>
                <MaterialIcons name="edit" size={18} color={colors.buttonText} />
                <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.deleteButton, { backgroundColor: colors.error }]} onPress={handleDelete}>
                <MaterialIcons name="delete" size={18} color={colors.buttonText} />
                <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>Delete</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.sellButton, { backgroundColor: colors.accent }]} onPress={handleSellOnMarketplace}>
              <MaterialIcons name="sell" size={18} color={colors.buttonText} />
              <Text style={[styles.actionButtonText, { color: colors.buttonText }]}>Sell On Marketplace</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <Modal transparent visible={historyModalVisible} animationType="slide" onRequestClose={() => setHistoryModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <Text style={[styles.modalTitle, { color: colors.text }]}>{historyEditId ? `Edit ${historyServiceType} History` : `Add ${historyServiceType} History`}</Text>

              <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Name</Text>
              <TextInput
                value={historyForm.name}
                onChangeText={(value) => setHistoryForm((prev) => ({ ...prev, name: value }))}
                placeholder="Brand & Type (e.g., Castrol GTX 10W-40)"
                placeholderTextColor={colors.secondaryText}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Date</Text>
              <TextInput
                value={historyForm.serviceDate}
                onChangeText={(value) => setHistoryForm((prev) => ({ ...prev, serviceDate: value }))}
                placeholder="yyyy-mm-dd"
                placeholderTextColor={colors.secondaryText}
                keyboardType="numbers-and-punctuation"
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <Text style={[styles.inputLabel, { color: colors.secondaryText }]}>Mileage</Text>
              <TextInput
                value={historyForm.mileage}
                onChangeText={(value) => setHistoryForm((prev) => ({ ...prev, mileage: value }))}
                placeholder="Mileage"
                placeholderTextColor={colors.secondaryText}
                keyboardType="numeric"
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.modalSecondary, { borderColor: colors.border }]} onPress={() => setHistoryModalVisible(false)}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.accent }]} onPress={() => void submitHistory()} disabled={isSavingHistory}>
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>{isSavingHistory ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    padding: 8,
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 18,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    gap: 12,
  },
  actionRow: {
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
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyHistoryText: {
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  historyInfoBlock: {
    flex: 1,
    gap: 6,
  },
  historyPrimaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyNameText: {
    fontSize: 13,
    fontWeight: '500',
  },
  historyValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  historyEditButton: {
    borderWidth: 0,
    borderRadius: 8,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEditButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  modalButtonText: {
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
