import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import MapView, { Polyline, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { container } from '@/services/diContainer';
import { RideServiceToken } from '@/services/rideService';
import type { RideService } from '@/services/rideService';
import Ride from '@/models/ride';
import { getRouteDraft, clearRouteDraft } from '@/services/routeTransfer';
import { useAuthContext } from '@/hooks/use-auth-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface LatLng {
    latitude: number;
    longitude: number;
    timestamp?: number;
}

const RideRecorder: React.FC = () => {
    const params = useLocalSearchParams();
    const viewedUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
    const rideId = Array.isArray(params.rideId) ? params.rideId[0] : params.rideId;
    const { getAuthUser } = useAuthContext();
    const authUser = getAuthUser();
    const currentUserId = authUser?.id;
    const isOwnData = !viewedUserId || viewedUserId === currentUserId;
    const rideService = useMemo(() => container.resolve<RideService>(RideServiceToken), []);

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [isSimulating] = useState(false);
    const [locations, setLocations] = useState<LatLng[]>([]);
    const [routePath, setRoutePath] = useState<LatLng[]>([]);
    const [totalDistance, setTotalDistance] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [rideTitle, setRideTitle] = useState('');
    const [rideDescription, setRideDescription] = useState('');
    const [totalRouteDistance, setTotalRouteDistance] = useState(0);
    const [totalRouteDuration, setTotalRouteDuration] = useState(0);
    const [currentUserLocation, setCurrentUserLocation] = useState<LatLng | null>(null);
    const [simulatedPosition] = useState<LatLng | null>(null);

    const mapRef = useRef<MapView>(null);
    const miniMapRef = useRef<MapView>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const timerRef = useRef<number | null>(null);
    const currentBearingRef = useRef<number>(0);

    const initialRegion: Region = {
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    useEffect(() => {
        const loadDraftRoute = async () => {
            const draft = getRouteDraft();
            if (!draft) {
                if (rideId) {
                    try {
                        const response = await rideService.getRideById(rideId);
                        if (!response.ok) {
                            throw new Error('Failed to load ride.');
                        }

                        const responseJson = await response.json().catch(() => null);
                        const rideData = responseJson?.data;
                        if (!rideData) {
                            throw new Error('Ride data is missing.');
                        }

                        const savedLocations: LatLng[] = Array.isArray(rideData.locations) ? rideData.locations : [];
                        setLocations(savedLocations);
                        setRoutePath(savedLocations);
                        setTotalDistance(rideData.distance ?? 0);
                        setElapsedTime(rideData.duration ?? 0);
                        setTotalRouteDistance(rideData.distance ?? 0);
                        setTotalRouteDuration(rideData.duration ? rideData.duration / 60 : 0);

                        if (savedLocations.length > 0) {
                            setTimeout(() => {
                                mapRef.current?.fitToCoordinates(savedLocations, {
                                    edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
                                    animated: true,
                                });
                            }, 500);
                        }
                    } catch (error) {
                        console.error('Failed to load ride by ID:', error);
                    }

                    requestLocationPermission();
                    return;
                }

                requestLocationPermission();
                return;
            }

            clearRouteDraft();

            const routeCoordinates = draft.locations as LatLng[];
            if (routeCoordinates.length > 0) {
                setRoutePath(routeCoordinates);
                setTimeout(() => {
                    mapRef.current?.fitToCoordinates(routeCoordinates, {
                        edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
                        animated: true,
                    });
                }, 500);
            }

            const draftSegments = draft.segments as any[] | undefined;
            let totalDist = 0;
            let totalDur = 0;
            if (draftSegments && draftSegments.length > 0) {
                for (const segment of draftSegments) {
                    totalDist += segment.distance || 0;
                    totalDur += segment.duration || 0;
                }
            }

            setTotalRouteDistance(totalDist);
            setTotalRouteDuration(totalDur);
            requestLocationPermission();
        };

        loadDraftRoute();
    }, [rideId, rideService]);

    // Utility functions
    const toRad = (value: number): number => (value * Math.PI) / 180;

    // Offset a coordinate by `distanceM` metres in the given compass bearing.
    // Used to shift the camera center forward so the vehicle appears in the
    // lower portion of the screen rather than dead-centre.
    const offsetCoordinate = (lat: number, lng: number, bearing: number, distanceM: number) => {
        const R = 6371000;
        const d = distanceM / R;
        const θ = (bearing * Math.PI) / 180;
        const φ1 = (lat * Math.PI) / 180;
        const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(θ));
        const λ1 = (lng * Math.PI) / 180;
        const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(d) * Math.cos(φ1), Math.cos(d) - Math.sin(φ1) * Math.sin(φ2));
        return {
            latitude: (φ2 * 180) / Math.PI,
            longitude: ((λ2 * 180) / Math.PI + 540) % 360 - 180,
        };
    };

    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    const calculateBearing = useCallback((from: LatLng, to: LatLng): number => {
        const lat1 = toRad(from.latitude);
        const lon1 = toRad(from.longitude);
        const lat2 = toRad(to.latitude);
        const lon2 = toRad(to.longitude);

        const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

        return (Math.atan2(y, x) * 180) / Math.PI;
    }, []);

    const getRouteHeading = useCallback((currentPosition: LatLng): number => {
        if (routePath.length < 2) {
            return currentBearingRef.current || 0;
        }

        let closestIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        routePath.forEach((point, index) => {
            const distance = calculateDistance(
                currentPosition.latitude,
                currentPosition.longitude,
                point.latitude,
                point.longitude,
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        const nextIndex = Math.min(closestIndex + 1, routePath.length - 1);
        const targetPoint = routePath[nextIndex];
        const heading = calculateBearing(currentPosition, targetPoint);
        return Number.isFinite(heading) ? heading : currentBearingRef.current || 0;
    }, [routePath, calculateBearing, calculateDistance]);

    const updateMapCamera = useCallback((currentPosition: LatLng, heading?: number) => {
        if (!mapRef.current) return;

        const nextHeading = heading ?? getRouteHeading(currentPosition);
        const cameraCenter = offsetCoordinate(
            currentPosition.latitude,
            currentPosition.longitude,
            nextHeading,
            250,
        );

        mapRef.current.animateCamera({
            center: cameraCenter,
            heading: nextHeading,
            pitch: 0,
            zoom: 16,
        }, { duration: 500 });

        if (miniMapRef.current) {
            const miniCameraCenter = offsetCoordinate(
                currentPosition.latitude,
                currentPosition.longitude,
                nextHeading,
                350,
            );
            miniMapRef.current.animateCamera({
                center: miniCameraCenter,
                heading: nextHeading,
                pitch: 0,
                zoom: 13,
            }, { duration: 500 });
        }
    }, [getRouteHeading]);

    const zoomToRouteAndRotate = useCallback(async () => {
        if (!mapRef.current) return;

        try {
            const userLoc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });

            const currentPos = {
                latitude: userLoc.coords.latitude,
                longitude: userLoc.coords.longitude,
            };

            const region: Region = {
                latitude: currentPos.latitude,
                longitude: currentPos.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };

            mapRef.current.animateToRegion(region, 1000);

            if (routePath.length > 1) {
                setTimeout(() => {
                    updateMapCamera(currentPos, getRouteHeading(currentPos));
                }, 1000);
            }
        } catch (error) {
            console.error('Error zooming to route:', error);
        }
    }, [routePath.length, getRouteHeading, updateMapCamera]);

    const startRecording = async () => {
        setIsPaused(false);
        setIsRecording(true);
        setSessionActive(true);
        await zoomToRouteAndRotate();
        await subscribeLocationUpdates(false);
    };

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setPermissionGranted(true);
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.BestForNavigation,
                });

                mapRef.current?.animateToRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            } else {
                Alert.alert('Permission Required', 'Location permission is needed for navigation.');
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
        }
    };

    const subscribeLocationUpdates = async (preserveExisting = false) => {
        if (!permissionGranted) {
            await requestLocationPermission();
            if (!permissionGranted) return;
        }

        if (locationSubscription.current) {
            await locationSubscription.current.remove();
            locationSubscription.current = null;
        }

        if (!preserveExisting) {
            setLocations([]);
            setTotalDistance(0);
            setElapsedTime(0);
        }

        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 5,
            },
            (newLocation) => {
                const newPoint: LatLng = {
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                    timestamp: newLocation.timestamp,
                };

                setCurrentUserLocation(newPoint);
                setLocations((prev) => {
                    const nextLocations = [...prev, newPoint];

                    if (prev.length > 0) {
                        const lastPoint = prev[prev.length - 1];
                        const distance = calculateDistance(
                            lastPoint.latitude,
                            lastPoint.longitude,
                            newPoint.latitude,
                            newPoint.longitude,
                        );
                        setTotalDistance((currentDistance) => currentDistance + distance);
                    }

                    return nextLocations;
                });

                if (mapRef.current && !isPaused) {
                    const gpsBearing = newLocation.coords.heading ?? currentBearingRef.current;
                    const shouldUseRouteCamera = routePath.length > 1;

                    if (shouldUseRouteCamera) {
                        const routeHeading = getRouteHeading(newPoint);
                        const nextHeading = Number.isFinite(routeHeading) ? routeHeading : gpsBearing;
                        currentBearingRef.current = nextHeading;
                        const gpsCameraCenter = offsetCoordinate(
                            newPoint.latitude,
                            newPoint.longitude,
                            nextHeading,
                            250,
                        );
                        mapRef.current.animateCamera({
                            center: gpsCameraCenter,
                            heading: nextHeading,
                            pitch: 0,
                            zoom: 16,
                        }, { duration: 500 });
                        if (miniMapRef.current) {
                            const gpsMinCameraCenter = offsetCoordinate(
                                newPoint.latitude,
                                newPoint.longitude,
                                nextHeading,
                                350,
                            );
                            miniMapRef.current.animateCamera({
                                center: gpsMinCameraCenter,
                                heading: nextHeading,
                                pitch: 0,
                                zoom: 13,
                            }, { duration: 500 });
                        }
                    } else {
                        mapRef.current.animateToRegion({
                            latitude: newPoint.latitude,
                            longitude: newPoint.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }, 500);
                    }
                }
            }
        );

        if (!preserveExisting && timerRef.current === null) {
            timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
    };

    const pauseRecording = async () => {
        if (locationSubscription.current) {
            await locationSubscription.current.remove();
            locationSubscription.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);
        setIsPaused(true);
    };

    const resumeRecording = async () => {
        setIsPaused(false);
        setIsRecording(true);
        await subscribeLocationUpdates(true);
    };

    const stopRecording = async () => {
        if (locationSubscription.current) {
            await locationSubscription.current.remove();
            locationSubscription.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);
        setIsPaused(false);
        setSessionActive(false);

        if (locations.length > 0 && routePath.length < 2) {
            setRoutePath(locations);
        }

        if (locations.length > 0 && isOwnData) {
            setSaveModalVisible(true);
        }
    };

    const handleSaveRide = async () => {
        if (!rideTitle.trim() || !rideDescription.trim()) {
            Alert.alert('Error', 'Please enter a title and description.');
            return;
        }

        const payload: Ride = {
            name: rideTitle.trim(),
            description: rideDescription.trim(),
            distance: totalDistance,
            duration: elapsedTime,
            createdById: String(currentUserId),
            locations,
        };

        try {
            const response = await rideService.createRide(payload);
            if (!response.ok) {
                const errorJson = await response.json().catch(() => null);
                const message = typeof errorJson === 'object' && errorJson?.message ? errorJson.message : 'Failed to save ride.';
                throw new Error(message);
            }

            setSaveModalVisible(false);
            setRideTitle('');
            setRideDescription('');
            Alert.alert('Saved', 'Ride saved successfully.');
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save ride.');
        }
    };

    const formatDistance = (km: number): string => {
        if (km < 1) return `${Math.round(km * 1000)} m`;
        return `${km.toFixed(2)} km`;
    };

    const formatTime = (seconds: number): string => {
        const totalSeconds = Math.max(0, Math.floor(seconds));
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;

        if (totalSeconds < 60) {
            return `${totalSeconds}s`;
        }

        if (minutes < 60) {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatEtaDuration = (seconds: number): string => {
        if (seconds < 60) {
            return `${Math.ceil(seconds)}s`;
        }

        const totalMinutes = Math.ceil(seconds / 60);
        if (totalMinutes < 60) {
            return `${totalMinutes} min`;
        }

        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                {routePath.length > 0 && !sessionActive && (
                    <View style={styles.routeStats}>
                        <View style={styles.routeStatItem}>
                            <Text style={styles.routeStatLabel}>Distance</Text>
                            <Text style={styles.routeStatValue}>{formatDistance(totalRouteDistance)}</Text>
                        </View>
                        <View style={styles.routeStatDivider} />
                        <View style={styles.routeStatItem}>
                            <Text style={styles.routeStatLabel}>Est. Time</Text>
                            <Text style={styles.routeStatValue}>{formatEtaDuration(totalRouteDuration)}</Text>
                        </View>
                        <View style={styles.routeStatDivider} />
                    </View>
                )}

                {sessionActive && (
                    <View style={styles.statsBar}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Distance</Text>
                            <Text style={styles.statValue}>{formatDistance(totalDistance)}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Time</Text>
                            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={initialRegion}
                        showsUserLocation={!isSimulating}
                        showsMyLocationButton={!isSimulating}
                        followsUserLocation={false}
                        showsCompass={true}
                        showsScale={true}
                        rotateEnabled={true}
                    >
                        {routePath.length > 1 && (
                            <Polyline coordinates={routePath} strokeColor="#2196F3" strokeWidth={5} />
                        )}

                        {locations.length > 1 && (
                            <Polyline coordinates={locations} strokeColor="#FF4444" strokeWidth={4} />
                        )}

                        {!sessionActive && routePath.length > 0 && (
                            <Marker coordinate={routePath[0]} title="Start" pinColor="#4CAF50" />
                        )}

                        {!sessionActive && routePath.length > 1 && (
                            <Marker coordinate={routePath[routePath.length - 1]} title="Destination" pinColor="#f44336" />
                        )}

                        {currentUserLocation && (
                            <Marker coordinate={currentUserLocation} tracksViewChanges={false}>
                                <View style={styles.userLocationDot} />
                            </Marker>
                        )}
                    </MapView>

                    {!sessionActive && !isRecording ? (
                        <View style={styles.recordControlOverlay} pointerEvents="box-none">
                            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                                <Text style={styles.recordButtonText}>Start Ride</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.recordControlOverlay} pointerEvents="box-none">
                            <View style={styles.recordControlRow}>
                                <TouchableOpacity
                                    style={[styles.recordActionButton, isPaused ? styles.resumeButton : styles.pauseButton]}
                                    onPress={isPaused ? resumeRecording : pauseRecording}
                                >
                                    <Text style={styles.recordActionText}>{isPaused ? 'Resume Ride' : 'Pause Ride'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.recordActionButton, styles.stopButton]} onPress={stopRecording}>
                                    <Text style={styles.recordActionText}>Stop Ride</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Mini-map thumbnail — bottom left, 5km range */}
                    {sessionActive && (simulatedPosition || currentUserLocation) && (
                        <View style={styles.miniMapContainer} pointerEvents="none">
                            <MapView
                                ref={miniMapRef}
                                style={styles.miniMap}
                                scrollEnabled={false}
                                zoomEnabled={true}
                                rotateEnabled={false}
                                pitchEnabled={false}
                                showsUserLocation={!isSimulating}
                                showsCompass={false}
                                showsScale={false}
                                showsMyLocationButton={false}
                                initialRegion={{
                                    latitude: (simulatedPosition || currentUserLocation)!.latitude,
                                    longitude: (simulatedPosition || currentUserLocation)!.longitude,
                                    latitudeDelta: 0.888,
                                    longitudeDelta: 0.888,
                                }}
                                pointerEvents="none"
                            >
                                {routePath.length > 1 && (
                                    <Polyline coordinates={routePath} strokeColor="#2196F3" strokeWidth={2} />
                                )}
                                {simulatedPosition && (
                                    <Marker coordinate={simulatedPosition} anchor={{ x: 0.5, y: 0.5 }}>
                                        <View style={styles.miniMapMarker}>
                                            <View style={styles.miniMapArrow} />
                                        </View>
                                    </Marker>
                                )}
                            </MapView>
                        </View>
                    )}




                    <Modal visible={saveModalVisible} transparent animationType="slide">
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Save Ride</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Title"
                                    value={rideTitle}
                                    onChangeText={setRideTitle}
                                />
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Description"
                                    value={rideDescription}
                                    onChangeText={setRideDescription}
                                    multiline
                                />
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity style={[styles.modalButton, styles.cancelModalButton]} onPress={() => setSaveModalVisible(false)}>
                                        <Text style={styles.cancelModalText}>Cancel</Text>
                                    </TouchableOpacity>
                                    {isOwnData ? (
                                        <TouchableOpacity style={[styles.modalButton, styles.saveModalButton]} onPress={handleSaveRide}>
                                            <Text style={styles.saveModalText}>Save</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>
            </View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    routeStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(33,150,243,0.95)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    routeStatItem: { flex: 1, alignItems: 'center' },
    routeStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
    routeStatValue: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    routeStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.85)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 11, color: '#ccc', marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    statDivider: { width: 1, height: 30, backgroundColor: '#444' },
    mapContainer: { flex: 1, position: 'relative' },
    map: { flex: 1 },

    vehicleMarker: {
        // Exact bounding box of the triangle: (borderLeft+borderRight) × borderBottom
        // = 24 × 28. No flex centering — marginLeft on child does the precise placement.
        width: 24,
        height: 28,
    },
    vehicleArrow: {
        width: 0,
        height: 0,
        // marginLeft = half of total width (12) → apex at x=12, left border→x=0, right border→x=24
        marginLeft: 12,
        borderLeftWidth: 12,
        borderRightWidth: 12,
        borderBottomWidth: 28,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#1565C0',
    },
    vehicleMarkerText: {
        fontSize: 32,
    },
    miniMapContainer: {
        position: 'absolute',
        bottom: 90,
        left: 16,
        width: 120,
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.6)',
        zIndex: 25,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    miniMap: {
        width: '100%',
        height: '100%',
    },
    miniMapMarker: {
        // Exact bounding box: (7+7) × 16 = 14 × 16
        width: 14,
        height: 16,
    },
    miniMapArrow: {
        width: 0,
        height: 0,
        marginLeft: 7,
        borderLeftWidth: 7,
        borderRightWidth: 7,
        borderBottomWidth: 16,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#1565C0',
    },
    miniMapMarkerText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 28,
    },

    navigationCard: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.92)',
        borderRadius: 20,
        padding: 16,
        zIndex: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    navigationIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#FF9800',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 16,
        left: 16,
    },
    navigationIcon: { fontSize: 28 },
    navigationTextContainer: { marginLeft: 70, marginBottom: 12 },
    navigationInstruction: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    navigationStreet: { color: '#FF9800', fontSize: 13, marginTop: 4 },
    navigationDistance: { color: '#4CAF50', fontSize: 13, marginTop: 4 },
    progressContainer: { marginTop: 8 },
    progressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 2 },
    controlBar: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 12,
        zIndex: 20,
    },
    controlButton: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    controlButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    startButton: { backgroundColor: '#4CAF50' },
    simulateButton: { backgroundColor: '#9C27B0' },
    pauseButton: { backgroundColor: '#FF9800' },
    resumeButton: { backgroundColor: '#4CAF50' },
    stopButton: { backgroundColor: '#f44336' },
    stopSimulateButton: { backgroundColor: '#f44336', flex: 0.5 },
    recordControlOverlay: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        alignItems: 'center',
        zIndex: 30,
    },
    recordButton: {
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 24,
        backgroundColor: '#d32f2f',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    recordButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
    recordControlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    recordActionButton: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordActionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    userLocationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#1565C0',
        borderWidth: 2,
        borderColor: '#fff',
    },
    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 16 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
    cancelModalButton: { backgroundColor: '#f5f5f5' },
    saveModalButton: { backgroundColor: '#2196F3' },
    cancelModalText: { color: '#666', fontWeight: 'bold' },
    saveModalText: { color: '#fff', fontWeight: 'bold' },
    clearButton: { backgroundColor: '#757575' },
    planningStatsBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,152,0,0.95)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    planningInstructions: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
    },
    planningInstructionsText: {
        backgroundColor: 'rgba(0,0,0,0.72)',
        color: '#fff',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        fontSize: 14,
    },
    planningLoading: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
    },
    planningLoadingText: {
        color: '#fff',
        marginTop: 12,
        fontSize: 14,
    },
});

export default RideRecorder;