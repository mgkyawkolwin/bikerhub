import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { RideServiceToken } from '@/services/rideService';
import type { RideService } from '@/services/rideService';
import Ride from '@/models/ride';
import polyline from '@mapbox/polyline';
import SnackBar from '@/components/snackbar';
import LoadingOverlay from '@/components/loadingOverlay';
import MediaGallery from '@/components/mediaGallery';

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

    const encodedPath = polyline.encode(safeLocations.map((p) => [p.latitude, p.longitude]));
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

export default function ViewRideScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useThemeContext();
    const params = useLocalSearchParams();
    const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId;
    const rideService = useMemo(() => container.resolve<RideService>(RideServiceToken), []);

    const [ride, setRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(false);

    const googleMapsApiKey = 'AIzaSyDhdk-puMVacWKP-sxoM205gR5Yl4LX4Wk';

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                if (!rideId) {
                    setRide(null);
                    return;
                }

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
    const rideMedias = ((ride as any)?.medias ?? []) as { id?: string; url?: string; contentType?: string }[];

    return (
        <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
            <LoadingOverlay isLoading={loading} />
            <View style={[styles.header, { backgroundColor: colors.background }]}> 
                <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Ride</Text>
                <View style={styles.actionsRow} />
            </View>

            <ScrollView style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <View style={styles.cardBody}> 
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
                        <Text style={[styles.titleText, { color: colors.text }]}>{ride.name || 'Untitled ride'}</Text>
                        <Text style={[styles.descriptionText, { color: colors.secondaryText }]}>{ride.description || 'No description provided.'}</Text>
                        <Text style={[styles.bikeText, { color: colors.secondaryText }]}>{`Bike: ${ride.bike || 'Not specified'}`}</Text>

                        <View style={styles.photoSection}>
                            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Photos</Text>
                            <MediaGallery
                                medias={rideMedias.map((media) => ({ id: media.id ?? media.url ?? '', url: media.url ?? '', contentType: media.contentType ?? 'image/jpeg' }))}
                                canDelete={false}
                            />
                        </View>
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
    card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden', margin: 16 },
    cardBody: { padding: 16, gap: 10 },
    mapPreview: { width: '100%', height: 300, borderRadius: 4, backgroundColor: '#EAEAEA' },
    mapPreviewPlaceholder: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#F3F3F3', alignItems: 'center', justifyContent: 'center', gap: 6 },
    mapPreviewPlaceholderText: { fontSize: 13, fontWeight: '600' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, marginTop: 2 },
    statItem: { flex: 1, alignItems: 'center', gap: 2 },
    statValue: { fontSize: 18, fontWeight: '800' },
    statLabel: { fontSize: 14 },
    titleText: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
    descriptionText: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
    bikeText: { fontSize: 14, fontWeight: '600', marginBottom: 14 },
    emptyState: { paddingTop: 60, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    fieldLabel: { fontSize: 13, marginBottom: 6 },
    uploadRouteButton: { maxWidth: 140, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, backgroundColor: 'transparent', alignItems: 'center' },
    uploadRouteText: { fontSize: 15, fontWeight: '700' },
    photoSection: { gap: 12, marginTop: 12 },
});
