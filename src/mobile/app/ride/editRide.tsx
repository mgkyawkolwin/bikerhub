import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { RideServiceToken } from '@/services/rideService';
import type { RideService } from '@/services/rideService';
import Ride from '@/models/ride';
import polyline from '@mapbox/polyline';
import * as ImagePicker from 'expo-image-picker';
import SnackBar from '@/components/snackbar';
import LoadingOverlay from '@/components/loadingOverlay';

const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0 min';

    const totalMinutes = Math.max(1, Math.ceil(seconds / 60));
    if (totalMinutes < 60) return `${totalMinutes} min`;

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
};

const formatDistance = (distance?: number) => {
    if (!distance || distance <= 0) return '0 km';
    if (distance < 1) return `${Math.round(distance * 1000)} m`;
    return `${distance.toFixed(2)} km`;
};

const formatAvgSpeed = (speed?: number) => {
    if (!speed || speed <= 0) return '0 km/h';
    return `${speed.toFixed(1)} km/h`;
};

const getStaticMapUrl = (locations: Ride['locations'], apiKey?: string) => {
    const safeLocations = (locations ?? []).filter((point) => point?.latitude != null && point?.longitude != null);
    if (safeLocations.length < 2 || !apiKey) return null;

    const encodedPath = polyline.encode(safeLocations.map(p => [p.latitude, p.longitude]));
    const start = safeLocations[0];
    const end = safeLocations[safeLocations.length - 1];

    const params = [
        'size=600x400',
        'scale=2',
        'maptype=roadmap',
        `path=color:0x2196F3|weight:5|enc:${encodedPath}`,
        `markers=color:green|label:S|${start.latitude},${start.longitude}`,
        `markers=color:red|label:E|${end.latitude},${end.longitude}`,
    ];

    return `https://maps.googleapis.com/maps/api/staticmap?${params.join('&')}&key=${encodeURIComponent(apiKey)}`;
};

export default function EditRideScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useThemeContext();
    const params = useLocalSearchParams();
    const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId;
    const rideService = useMemo(() => container.resolve<RideService>(RideServiceToken), []);

    const [ride, setRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [bike, setBike] = useState('');
    const [photos, setPhotos] = useState<{ uri: string; id?: string; isExisting?: boolean }[]>([]);
    const [saving, setSaving] = useState(false);

    const googleMapsApiKey = 'AIzaSyDhdk-puMVacWKP-sxoM205gR5Yl4LX4Wk';
    const rideServiceClient = useMemo(() => container.resolve<RideService>(RideServiceToken), []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Load from API when rideId is provided
                if (rideId) {
                    const response = await rideService.getRideById(rideId);
                    if (!response.ok) {
                        SnackBar.Error(`${response.status} ${response.statusText} : Invalid response. Please try again.`);
                        return;
                    }
                    const responseJson = await response.json();
                    if (!responseJson.success) {
                        SnackBar.Error(responseJson?.message ?? 'Request failed. Please try again.');
                        return;
                    }
                    const rideData = responseJson?.data;

                    setRide(rideData as Ride);
                    setTitle((rideData as Ride).name ?? '');
                    setDescription((rideData as Ride).description ?? '');
                    setBike((rideData as Ride).bike ?? '');
                    setPhotos(((rideData as any)?.medias ?? []).map((m: any) => ({ uri: m.url ?? m.Url ?? '', id: m.id?.toString?.() ?? m.id, isExisting: true })).filter((p: any) => p.uri));
                } else {
                    // No rideId provided — do not use route draft; show empty state
                    setRide(null);
                }
            } catch (err) {
                SnackBar.Error('Failed to load ride data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [rideId, rideService]);

    if (!ride) {
        return (
            <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                <View style={[styles.header, { backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Ride</Text>
                    <View style={styles.actionsRow} />
                </View>
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: colors.secondaryText }]}>{loading ? 'Loading...' : 'No ride data'}</Text>
                </View>
            </View>
        );
    }

    const staticMapUrl = getStaticMapUrl(ride.locations, googleMapsApiKey);
    const hasRoutePreview = Boolean(staticMapUrl);

    const handleSave = async () => {
        if (!ride?.id) return;
        setSaving(true);
        try {
            const payload = { name: title, description, bike };
            const response = await rideServiceClient.updateRideInfo(ride.id!, payload);
            if (!response.ok) {
                SnackBar.Error(`${response.status} ${response.statusText} : Invalid response. Please try again.`);
                return;
            }

            const responseJson = await response.json();
            if (!responseJson.success) {
                SnackBar.Error(responseJson?.message ?? 'Request failed. Please try again.');
                return;
            }
            const updated = responseJson?.data ?? null;
            setRide((prev) => ({ ...(prev ?? {}), ...(updated ?? {}) } as Ride));
            SnackBar.Success('Ride updated successfully');
            await uploadPendingPhotos();
        } catch (err) {
            SnackBar.Error('Failed to update ride. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getFileName = (uri: string) => {
        const parts = uri.split('/');
        return parts[parts.length - 1] ?? `image-${Date.now()}`;
    };

    const getMimeType = (uri: string) => {
        const extension = uri.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            default:
                return 'application/octet-stream';
        }
    };

    const requestCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Camera permission is required.');
            return false;
        }
        return true;
    };

    const requestLibrary = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Gallery permission is required.');
            return false;
        }
        return true;
    };

    const handleImagePick = async (fromCamera: boolean) => {
        const canPick = fromCamera ? await requestCamera() : await requestLibrary();
        if (!canPick) return;

        const result = fromCamera
            ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false })
            : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: false, allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images });

        const assets = Array.isArray(result.assets) ? result.assets : [];
        const uris = assets.map((a: any) => a.uri).filter(Boolean);
        if (!result.canceled && uris.length) {
            setPhotos((prev) => [...uris.map((uri) => ({ uri })), ...prev]);
        }
    };

    const uploadPendingPhotos = async () => {
        if (!ride?.id) return;
        const pending = photos.filter((p) => !p.isExisting);
        if (pending.length === 0) return;

        for (const photo of pending) {
            try {
                const response = await rideServiceClient.uploadRideImage(ride.id!, { uri: photo.uri, name: getFileName(photo.uri), type: getMimeType(photo.uri) });
                if (!response.ok) {
                    SnackBar.Error(`Failed to upload photo: ${response.status} ${response.statusText}`);
                    continue;
                }
            } catch (err) {
                console.error('Upload failed', err);
                SnackBar.Error('Image upload failed.');
            }
        }

        // reload ride medias
        const resp = await rideServiceClient.getRideById(ride.id!);
        if (!resp.ok) {
            SnackBar.Error(`Failed to load ride data: ${resp.status} ${resp.statusText}`);
            return;
        }
        const json = await resp.json();
        if (!json.success) {
            SnackBar.Error(json?.message ?? 'Request failed. Please try again.');
            return;
        }
        const updated = json?.data;
        setPhotos(((updated?.medias ?? []) as any[]).map((m: any) => ({ uri: m.url ?? m.Url ?? '', id: m.id?.toString?.() ?? m.id, isExisting: true })).filter((p: any) => p.uri));
    };

    const removePhoto = async (index: number) => {
        const photo = photos[index];
        if (!photo) return;
        if (photo.isExisting && photo.id && ride?.id) {
            try {
                const response = await rideServiceClient.deleteRideImage(ride.id!, photo.id!);
                if (!response.ok) {
                    SnackBar.Error('Unable to delete this photo right now.');
                    return;
                }
                setPhotos((prev) => prev.filter((_, i) => i !== index));
                SnackBar.Success('Photo deleted.');
                return;
            } catch (err) {
                SnackBar.Error('Unable to delete this photo right now.');
                return;
            }
        }

        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <LoadingOverlay isLoading={loading || saving} />
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Ride</Text>
                <View style={styles.actionsRow} />
            </View>

            <ScrollView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardBody}>
                    {/* Title moved below stats and editable */}
                    {hasRoutePreview ? (
                        <Image source={{ uri: staticMapUrl! }} style={styles.mapPreview} resizeMode="cover" />
                    ) : (
                        <View style={styles.mapPreviewPlaceholder}>
                            <MaterialIcons name="map" size={24} color={colors.secondaryText} />
                            <Text style={[styles.mapPreviewPlaceholderText, { color: colors.secondaryText }]}>Route preview unavailable</Text>
                        </View>
                    )}
                    <View style={{ marginTop: 8, alignItems: 'center' }}>
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/ride/rideRecorder', params: { rideId: ride.id } })}
                            style={[styles.uploadRouteButton, { borderColor: colors.accent }]}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.uploadRouteText, { color: colors.accent }]}>View Map</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <MaterialIcons name="straighten" size={28} color={colors.accent} />
                            <Text style={[styles.statValue, { color: colors.text }]}>{formatDistance(ride.distance)}</Text>
                            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Distance</Text>
                        </View>
                        <View style={styles.statItem}>
                            <MaterialIcons name="schedule" size={28} color={colors.accent} />
                            <Text style={[styles.statValue, { color: colors.text }]}>{formatDuration(ride.duration)}</Text>
                            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Duration</Text>
                        </View>
                        <View style={styles.statItem}>
                            <MaterialIcons name="speed" size={28} color={colors.accent} />
                            <Text style={[styles.statValue, { color: colors.text }]}>{formatAvgSpeed(ride.averageSpeed)}</Text>
                            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Avg. Speed</Text>
                        </View>
                        <View style={styles.statItem}>
                            <MaterialIcons name="terrain" size={28} color={colors.accent} />
                            <Text style={[styles.statValue, { color: colors.text }]}>{ride.elevation ?? 0} ft</Text>
                            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Elevation</Text>
                        </View>
                    </View>
                    <View style={{ marginTop: 12 }}>
                        <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Bike</Text>
                        <TextInput
                            value={bike}
                            onChangeText={setBike}
                            placeholder="Bike"
                            placeholderTextColor={colors.secondaryText}
                            style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                        />

                        <Text style={[styles.fieldLabel, { color: colors.secondaryText, marginTop: 12 }]}>Title</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Title"
                            placeholderTextColor={colors.secondaryText}
                            style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                        />

                        <Text style={[styles.fieldLabel, { color: colors.secondaryText, marginTop: 12 }]}>Description</Text>
                        <TextInput
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Description"
                            placeholderTextColor={colors.secondaryText}
                            multiline
                            numberOfLines={4}
                            style={[styles.textArea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
                        />

                        <View style={styles.photoSection}>
                            <View style={styles.photoHeader}>
                                <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Photos</Text>
                                <View style={styles.photoActions}>
                                    <TouchableOpacity
                                        style={[styles.photoActionButton, { borderColor: colors.border }]}
                                        onPress={() => void handleImagePick(true)}
                                    >
                                        <MaterialIcons name="photo-camera" size={20} color={colors.text} />
                                        <Text style={[styles.photoActionLabel, { color: colors.text }]}>Camera</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.photoActionButton, { borderColor: colors.border }]}
                                        onPress={() => void handleImagePick(false)}
                                    >
                                        <MaterialIcons name="photo-library" size={20} color={colors.text} />
                                        <Text style={[styles.photoActionLabel, { color: colors.text }]}>Gallery</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {photos.length ? (
                                <View style={[styles.photoGrid, photos.length >= 3 ? { justifyContent: 'space-between' } : { justifyContent: 'flex-start' }]}>
                                    {photos.map((photo, index) => (
                                        <View
                                            key={`${photo.uri}-${index}`}
                                            style={[
                                                styles.photoGridItem,
                                                { backgroundColor: colors.card },
                                                (index + 1) % 3 === 0 ? { marginRight: 0 } : undefined,
                                            ]}
                                        >
                                            <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                                            <TouchableOpacity style={styles.photoRemove} onPress={() => void removePhoto(index)} hitSlop={10}>
                                                <MaterialIcons name="close" size={16} color="#FFFFFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={[styles.photoPlaceholder, { borderColor: colors.border }]}>
                                    <Text style={[styles.photoPlaceholderText, { color: colors.secondaryText }]}>No photos yet. Use camera or gallery to add ride images.</Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.accent }]}
                            onPress={handleSave}
                            activeOpacity={0.8}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={[styles.downloadText]}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backButton: { padding: 8 },
    title: { fontSize: 22, fontWeight: '700', flex: 1, textAlign: 'center', color: '#FFFFFF' },
    actionsRow: { flexDirection: 'row', alignItems: 'center' },
    list: { paddingHorizontal: 16, gap: 12 },
    card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden', margin: 16 },
    cardBody: { padding: 16, gap: 10 },
    mapPreview: { width: '100%', height: 300, borderRadius: 4, backgroundColor: '#EAEAEA' },
    mapPreviewPlaceholder: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#F3F3F3', alignItems: 'center', justifyContent: 'center', gap: 6 },
    mapPreviewPlaceholderText: { fontSize: 13, fontWeight: '600' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 4 },
    cardTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, marginTop: 2 },
    statItem: { flex: 1, alignItems: 'center', gap: 2 },
    statValue: { fontSize: 18, fontWeight: '800' },
    statLabel: { fontSize: 14 },
    cardSummary: { fontSize: 14, lineHeight: 20, marginTop: 8 },
    emptyState: { paddingTop: 60, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    fieldLabel: { fontSize: 13, marginBottom: 6 },
    textInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15 },
    textArea: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, textAlignVertical: 'top', minHeight: 100 },
    submitButton: { marginTop: 12, borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    downloadText: { alignSelf: 'center', fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    uploadRouteButton: { maxWidth: 140, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, backgroundColor: 'transparent', alignItems: 'center' },
    uploadRouteText: { fontSize: 15, fontWeight: '700' },
    photoSection: { gap: 12, marginTop: 12 },
    photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    photoActions: { flexDirection: 'row', gap: 10 },
    photoActionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
    photoActionLabel: { fontSize: 13, fontWeight: '600' },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    photoGridItem: { width: '29%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', position: 'relative', marginBottom: 12, marginRight: 6 },
    photoThumb: { width: '100%', height: '100%' },
    photoRemove: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    photoPlaceholder: { minHeight: 120, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 16 },
    photoPlaceholderText: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
