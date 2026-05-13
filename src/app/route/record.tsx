import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    Platform,
    ScrollView,
    Dimensions,
} from 'react-native';
import MapView, { Polyline, Marker, Region, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Animated } from 'react-native';

// Types for our ride recording
interface LatLng {
    latitude: number;
    longitude: number;
    timestamp?: number;
}

const RideRecorder: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [locations, setLocations] = useState<LatLng[]>([]);
    const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
    const [totalDistance, setTotalDistance] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);

    const mapRef = useRef<MapView>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const timerRef = useRef<number | null>(null);

    // OpenStreetMap tile layer configuration
    const osmTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    // Initial region (will be updated to user's location)
    const initialRegion: Region = {
        latitude: 20.5937, // Center of India (adjust as needed)
        longitude: 78.9629,
        latitudeDelta: 5,
        longitudeDelta: 5,
    };

    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isRecording) {
            startPulseAnimation();
        } else {
            pulseAnim.setValue(0);
        }
    }, [isRecording]);

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    // Request location permissions on mount
    useEffect(() => {
        requestLocationPermission();
        return () => {
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                setPermissionGranted(true);
                // Get initial position
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.BestForNavigation,
                });
                const initialPos = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    timestamp: location.timestamp,
                };
                setCurrentPosition(initialPos);

                // Center map on user's location
                mapRef.current?.animateToRegion({
                    latitude: initialPos.latitude,
                    longitude: initialPos.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            } else {
                Alert.alert(
                    'Permission Required',
                    'Location permission is needed to record your rides. Please enable it in settings.'
                );
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
        }
    };

    // Start tracking location
    const startRecording = async () => {
        if (!permissionGranted) {
            await requestLocationPermission();
            if (!permissionGranted) return;
        }

        if (locationSubscription.current) {
            try {
                await locationSubscription.current.remove();
            } catch (error) {
                console.warn('Failed to remove existing location subscription:', error);
            }
            locationSubscription.current = null;
        }

        // Clear previous ride data
        setLocations([]);
        setTotalDistance(0);
        setElapsedTime(0);

        // Start location tracking
        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000, // Update every second
                distanceInterval: 1, // Or every meter
            },
            (newLocation) => {
                const newPoint: LatLng = {
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                    timestamp: newLocation.timestamp,
                };

                setCurrentPosition(newPoint);

                setLocations((prev) => {
                    const updated = [...prev, newPoint];

                    // Calculate distance if we have at least 2 points
                    if (updated.length >= 2) {
                        const lastTwo = updated.slice(-2);
                        const distance = calculateDistance(
                            lastTwo[0].latitude, lastTwo[0].longitude,
                            lastTwo[1].latitude, lastTwo[1].longitude
                        );
                        setTotalDistance((prevDist) => prevDist + distance);
                    }

                    return updated;
                });

                // Auto-center map on current location while recording
                if (mapRef.current && isRecording) {
                    mapRef.current.animateCamera({
                        center: {
                            latitude: newPoint.latitude,
                            longitude: newPoint.longitude,
                        },
                        zoom: 18,
                    }, { duration: 500 });
                }
            }
        );

        setIsRecording(true);

        // Start timer
        timerRef.current = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);
    };

    // Stop recording
    const stopRecording = async () => {
        const currentSubscription = locationSubscription.current;

        if (currentSubscription) {
            try {
                await currentSubscription.remove();
            } catch (error) {
                console.warn('Failed to remove location subscription:', error);
            }
            locationSubscription.current = null;
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setIsRecording(false);

        if (locations.length > 0) {
            Alert.alert(
                'Ride Recorded',
                `Ride saved!\nDistance: ${formatDistance(totalDistance)}\nTime: ${formatTime(elapsedTime)}`,
                [
                    { text: 'OK', style: 'cancel' },
                    { text: 'Export GPX', onPress: exportGPX }
                ]
            );
        }
    };

    // Calculate distance between two points using Haversine formula (returns km)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const toRad = (value: number): number => {
        return (value * Math.PI) / 180;
    };

    // Format distance for display
    const formatDistance = (km: number): string => {
        if (km < 1) {
            return `${Math.round(km * 1000)} m`;
        }
        return `${km.toFixed(2)} km`;
    };

    // Format time for display (HH:MM:SS)
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Export ride as GPX file
    const exportGPX = async () => {
        if (locations.length === 0) {
            Alert.alert('No Data', 'No ride data to export.');
            return;
        }

        const gpxData = generateGPX(locations);
        const fileName = `ride_${new Date().toISOString().replace(/[:.]/g, '-')}.gpx`;

        try {
            // Create a File instance pointing to the document directory
            // Paths.document is a Directory object representing the app's document directory
            const gpxFile = new File(Paths.document, fileName);

            // Write the GPX content to the file
            // This will create/overwrite the file
            gpxFile.write(gpxData);

            // Check if sharing is available
            if (await Sharing.isAvailableAsync()) {
                // Share the file using its URI
                await Sharing.shareAsync(gpxFile.uri, {
                    mimeType: 'application/gpx+xml',
                    dialogTitle: 'Export GPX',
                });
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Error exporting GPX:', error);
            Alert.alert('Export Failed', 'Could not export the GPX file');
        }
    };

    // Generate GPX XML from location points
    const generateGPX = (points: LatLng[]): string => {
        const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Motorbike Ride Recorder" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Motorbike Ride - ${new Date().toLocaleString()}</name>
    <trkseg>`;

        const waypoints = points.map(point => {
            const time = point.timestamp ? new Date(point.timestamp).toISOString() : new Date().toISOString();
            return `      <trkpt lat="${point.latitude}" lon="${point.longitude}">
        <time>${time}</time>
      </trkpt>`;
        }).join('\n');

        const footer = `    </trkseg>
  </trk>
</gpx>`;

        return header + '\n' + waypoints + '\n' + footer;
    };

    // Clear current ride data
    const clearRide = () => {
        if (isRecording) {
            Alert.alert('Recording', 'Please stop recording first');
            return;
        }

        Alert.alert(
            'Clear Ride',
            'Are you sure you want to clear the current ride data?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        setLocations([]);
                        setTotalDistance(0);
                        setElapsedTime(0);
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Stats Bar - Keep this */}
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
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Points</Text>
                    <Text style={styles.statValue}>{locations.length}</Text>
                </View>
            </View>

            {/* Map takes full remaining space */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={initialRegion}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    followsUserLocation={false}
                    showsCompass={true}
                    mapType="standard"
                >
                    {locations.length > 1 && (
                        <Polyline
                            coordinates={locations}
                            strokeColor="#FF4444"
                            strokeWidth={4}
                            lineDashPattern={[0]}
                        />
                    )}

                    {locations.length > 0 && (
                        <Marker
                            coordinate={locations[0]}
                            title="Start Point"
                            pinColor="green"
                        />
                    )}

                    {locations.length > 1 && !isRecording && (
                        <Marker
                            coordinate={locations[locations.length - 1]}
                            title="End Point"
                            pinColor="red"
                        />
                    )}
                </MapView>

                {/* Floating Circular Recording Button */}
                <TouchableOpacity
                    style={[
                        styles.floatingRecordButton,
                        isRecording && styles.floatingRecordButtonActive
                    ]}
                    onPress={isRecording ? stopRecording : startRecording}
                    activeOpacity={0.8}
                >
                    <View style={styles.recordButtonInner}>
                        {isRecording ? (
                            <View style={styles.stopIcon} />
                        ) : (
                            <View style={styles.recordIcon} />
                        )}
                    </View>
                </TouchableOpacity>

                {/* Optional: Export button overlay (only shows when not recording and has data) */}
                {!isRecording && locations.length > 0 && (
                    <TouchableOpacity
                        style={styles.floatingExportButton}
                        onPress={exportGPX}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.floatingButtonText}>📤</Text>
                    </TouchableOpacity>
                )}

                {/* Recording indicator pulse animation */}
                {isRecording && (
                    <View style={styles.recordingPulse}>
                        <View style={styles.pulseRing} />
                        <View style={styles.pulseRing} />
                        <View style={styles.pulseDot} />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#ccc',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#444',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    // Floating circular record button
    floatingRecordButton: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        borderWidth: 2,
        borderColor: '#FF4444',
    },
    floatingRecordButtonActive: {
        backgroundColor: '#FF4444',
        borderColor: '#fff',
    },
    recordButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF4444',
    },
    stopIcon: {
        width: 20,
        height: 20,
        backgroundColor: '#fff',
    },
    // Floating export button
    floatingExportButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(33,150,243,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    floatingButtonText: {
        fontSize: 24,
    },
    // Recording pulse animation
    recordingPulse: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FF4444',
        opacity: 0,
        transform: [{ scale: 1 }],
    },
    pulseDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
        position: 'absolute',
    },
});

export default RideRecorder;