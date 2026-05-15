import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    Animated,
    Modal,
    TextInput,
    ScrollView,
} from 'react-native';
import MapView, { Polyline, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase, saveDatabase } from '@/services/localDatabase';
import { getRouteDraft, clearRouteDraft } from '@/services/routeTransfer';

// Types
interface LatLng {
    latitude: number;
    longitude: number;
    timestamp?: number;
}

interface TurnInstruction {
    id: string;
    instruction: string;
    action: 'straight' | 'slight-right' | 'right' | 'sharp-right' | 'left' | 'slight-left' | 'sharp-left' | 'destination';
    distanceToTurn: number; // Distance from previous turn in km
    location: LatLng; // Where this turn occurs
    bearing: number; // Direction to go after the turn
}

interface RouteSegment {
    start: LatLng;
    end: LatLng;
    distance: number;
    instructions: TurnInstruction[];
    polyline: LatLng[];
}

const RideRecorder: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [locations, setLocations] = useState<LatLng[]>([]);
    const [routePath, setRoutePath] = useState<LatLng[]>([]);
    const [turnInstructions, setTurnInstructions] = useState<TurnInstruction[]>([]);
    const [nextTurnIndex, setNextTurnIndex] = useState(0);
    const [distanceToNextTurn, setDistanceToNextTurn] = useState(0);
    const [currentInstruction, setCurrentInstruction] = useState('Loading route...');
    const [totalDistance, setTotalDistance] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [rideTitle, setRideTitle] = useState('');
    const [rideDescription, setRideDescription] = useState('');
    const [userLocation, setUserLocation] = useState<LatLng | null>(null);

    const mapRef = useRef<MapView>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const timerRef = useRef<number | null>(null);
    const nextTurnLocation = useRef<LatLng | null>(null);

    const initialRegion: Region = {
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 5,
        longitudeDelta: 5,
    };

    // Request location permissions on mount
    useEffect(() => {
        const draft = getRouteDraft();
        if (draft && draft.locations.length > 0) {
            setRoutePath(draft.locations);
            setTotalDistance(draft.totalDistance);
            clearRouteDraft();

            // Generate turn-by-turn instructions from the route
            const instructions = generateTurnInstructions(draft.locations);
            setTurnInstructions(instructions);
            
            if (instructions.length > 0) {
                setCurrentInstruction(instructions[0].instruction);
                nextTurnLocation.current = instructions[0].location;
            }

            if (mapRef.current) {
                mapRef.current.fitToCoordinates(draft.locations, {
                    edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
                    animated: true,
                });
            }
        }

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
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.BestForNavigation,
                });
                const initialPos = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    timestamp: location.timestamp,
                };
                setUserLocation(initialPos);
                
                mapRef.current?.animateToRegion({
                    latitude: initialPos.latitude,
                    longitude: initialPos.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            } else {
                Alert.alert(
                    'Permission Required',
                    'Location permission is needed for navigation. Please enable it in settings.'
                );
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
        }
    };

    // Calculate distance between two points (returns km)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const getBearing = (from: LatLng, to: LatLng): number => {
        const lat1 = toRad(from.latitude);
        const lon1 = toRad(from.longitude);
        const lat2 = toRad(to.latitude);
        const lon2 = toRad(to.longitude);

        const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

        return (Math.atan2(y, x) * 180) / Math.PI;
    };

    const toRad = (value: number): number => {
        return (value * Math.PI) / 180;
    };

    const getTurnAction = (bearingDelta: number): TurnInstruction['action'] => {
        if (bearingDelta >= 160 || bearingDelta <= -160) return 'sharp-right';
        if (bearingDelta > 60) return 'sharp-right';
        if (bearingDelta > 30) return 'right';
        if (bearingDelta > 15) return 'slight-right';
        if (bearingDelta < -60) return 'sharp-left';
        if (bearingDelta < -30) return 'left';
        if (bearingDelta < -15) return 'slight-left';
        return 'straight';
    };

    const getInstructionText = (action: TurnInstruction['action'], distance?: number): string => {
        switch (action) {
            case 'straight': return 'Continue straight';
            case 'slight-right': return 'Slight right';
            case 'right': return 'Turn right';
            case 'sharp-right': return 'Sharp right turn';
            case 'left': return 'Turn left';
            case 'slight-left': return 'Slight left';
            case 'sharp-left': return 'Sharp left turn';
            case 'destination': return 'Arrive at destination';
            default: return 'Continue';
        }
    };

    const generateTurnInstructions = (points: LatLng[]): TurnInstruction[] => {
        if (points.length < 2) return [];
        
        const instructions: TurnInstruction[] = [];
        let cumulativeDistance = 0;
        let previousBearing = getBearing(points[0], points[1]);
        
        // Sample points at regular intervals to detect turns
        const sampledPoints: { point: LatLng; index: number }[] = [];
        const sampleInterval = Math.max(1, Math.floor(points.length / 100));
        
        for (let i = 0; i < points.length; i += sampleInterval) {
            sampledPoints.push({ point: points[i], index: i });
        }
        
        for (let i = 1; i < sampledPoints.length - 1; i++) {
            const current = sampledPoints[i].point;
            const next = sampledPoints[i + 1].point;
            const currentBearing = getBearing(current, next);
            const bearingDelta = currentBearing - previousBearing;
            
            // Add segment distance
            const segmentDistance = calculateDistance(
                sampledPoints[i - 1].point.latitude,
                sampledPoints[i - 1].point.longitude,
                current.latitude,
                current.longitude
            );
            cumulativeDistance += segmentDistance;
            
            // Detect significant bearing changes (turns)
            if (Math.abs(bearingDelta) > 15 && cumulativeDistance > 0.05) {
                const action = getTurnAction(bearingDelta);
                instructions.push({
                    id: `turn_${instructions.length}`,
                    instruction: getInstructionText(action),
                    action,
                    distanceToTurn: cumulativeDistance,
                    location: current,
                    bearing: currentBearing,
                });
                
                cumulativeDistance = 0;
                previousBearing = currentBearing;
            }
        }
        
        // Add destination instruction
        const destination = points[points.length - 1];
        instructions.push({
            id: 'destination',
            instruction: 'Arrive at destination',
            action: 'destination',
            distanceToTurn: 0,
            location: destination,
            bearing: 0,
        });
        
        return instructions;
    };

    const updateNavigationProgress = useCallback((currentPos: LatLng) => {
        if (turnInstructions.length === 0 || nextTurnIndex >= turnInstructions.length) return;
        
        const nextTurn = turnInstructions[nextTurnIndex];
        const distanceToTurn = calculateDistance(
            currentPos.latitude, currentPos.longitude,
            nextTurn.location.latitude, nextTurn.location.longitude
        );
        
        setDistanceToNextTurn(distanceToTurn);
        
        // If within 50 meters of the turn, advance to next instruction
        if (distanceToTurn < 0.05) {
            const completedTurn = turnInstructions[nextTurnIndex];
            
            // Alert user about the upcoming turn
            if (completedTurn.action !== 'destination') {
                Alert.alert(
                    'Upcoming Maneuver',
                    completedTurn.instruction,
                    [{ text: 'OK' }]
                );
            }
            
            const newIndex = nextTurnIndex + 1;
            setNextTurnIndex(newIndex);
            
            if (newIndex < turnInstructions.length) {
                setCurrentInstruction(turnInstructions[newIndex].instruction);
                nextTurnLocation.current = turnInstructions[newIndex].location;
            } else {
                setCurrentInstruction('Arrived at destination!');
                nextTurnLocation.current = null;
                
                // Auto-stop when destination is reached
                if (sessionActive) {
                    Alert.alert(
                        'Destination Reached!',
                        'You have arrived at your destination.',
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    if (isRecording) stopRecording();
                                }
                            }
                        ]
                    );
                }
            }
        }
    }, [turnInstructions, nextTurnIndex, sessionActive, isRecording]);

    const subscribeLocationUpdates = async (preserveExisting = false) => {
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

        if (!preserveExisting) {
            setLocations([]);
            setTotalDistance(0);
            setElapsedTime(0);
            setNextTurnIndex(0);
            setDistanceToNextTurn(0);
            
            if (turnInstructions.length > 0) {
                setCurrentInstruction(turnInstructions[0].instruction);
                nextTurnLocation.current = turnInstructions[0].location;
            }
        }

        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 3,
            },
            (newLocation) => {
                const newPoint: LatLng = {
                    latitude: newLocation.coords.latitude,
                    longitude: newLocation.coords.longitude,
                    timestamp: newLocation.timestamp,
                };
                
                setUserLocation(newPoint);
                setLocations((prev) => [...prev, newPoint]);
                
                // Calculate distance traveled
                if (locations.length > 0) {
                    const lastPoint = locations[locations.length - 1];
                    const distance = calculateDistance(
                        lastPoint.latitude, lastPoint.longitude,
                        newPoint.latitude, newPoint.longitude
                    );
                    setTotalDistance((prev) => prev + distance);
                }
                
                // Update turn-by-turn navigation
                if (turnInstructions.length > 0 && !isPaused) {
                    updateNavigationProgress(newPoint);
                }
                
                // Auto-center map
                if (mapRef.current && !isPaused) {
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

        if (!preserveExisting && timerRef.current === null) {
            timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
    };

    const startRecording = async () => {
        setSessionActive(true);
        setIsPaused(false);
        setIsRecording(true);
        setNextTurnIndex(0);
        
        if (turnInstructions.length > 0) {
            setCurrentInstruction(turnInstructions[0].instruction);
            nextTurnLocation.current = turnInstructions[0].location;
        }
        
        await subscribeLocationUpdates(false);
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
        
        if (locations.length > 0) {
            setSaveModalVisible(true);
        } else {
            Alert.alert('Ride Stopped', 'No ride data was recorded.');
        }
    };

    const handleSaveRide = async () => {
        if (!rideTitle.trim() || !rideDescription.trim()) {
            Alert.alert('Error', 'Please enter a title and description.');
            return;
        }
        
        try {
            const db = await getDatabase();
            const collections = db.collections as any;
            collections.routes = collections.routes ?? [];
            collections.routes.push({
                id: Date.now().toString(),
                name: rideTitle.trim(),
                description: rideDescription.trim(),
                distance: formatDistance(totalDistance),
                duration: formatTime(elapsedTime),
                type: 'recorded',
                locations,
                routePath,
                createdAt: new Date().toISOString(),
            });
            await saveDatabase(db);
            setSaveModalVisible(false);
            setRideTitle('');
            setRideDescription('');
            Alert.alert('Saved', 'Ride has been saved successfully.');
        } catch (error) {
            console.error('Error saving:', error);
            Alert.alert('Error', 'Failed to save ride.');
        }
    };

    const formatDistance = (km: number): string => {
        if (km < 1) return `${Math.round(km * 1000)} m`;
        return `${km.toFixed(2)} km`;
    };

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const exportGPX = async () => {
        if (locations.length === 0) return;
        
        const gpxData = generateGPX(locations);
        const fileName = `ride_${new Date().toISOString().replace(/[:.]/g, '-')}.gpx`;
        
        try {
            const gpxFile = new File(Paths.document, fileName);
            gpxFile.write(gpxData);
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(gpxFile.uri, {
                    mimeType: 'application/gpx+xml',
                    dialogTitle: 'Export GPX',
                });
            }
        } catch (error) {
            console.error('Error exporting GPX:', error);
            Alert.alert('Export Failed', 'Could not export the GPX file');
        }
    };

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

    const getTurnIcon = (action: TurnInstruction['action']): string => {
        switch (action) {
            case 'straight': return '⬆️';
            case 'slight-right': return '↗️';
            case 'right': return '➡️';
            case 'sharp-right': return '🔀';
            case 'left': return '⬅️';
            case 'slight-left': return '↖️';
            case 'sharp-left': return '🔀';
            case 'destination': return '🏁';
            default: return '⬆️';
        }
    };

    return (
        <View style={styles.container}>
            {/* Stats Bar */}
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
                    <Text style={styles.statLabel}>Next Turn</Text>
                    <Text style={styles.statValue}>{distanceToNextTurn > 0 ? `${distanceToNextTurn.toFixed(1)} km` : '--'}</Text>
                </View>
            </View>

            {/* Map Container */}
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
                    {/* Planned Route */}
                    {routePath.length > 1 && (
                        <Polyline
                            coordinates={routePath}
                            strokeColor="#888"
                            strokeWidth={4}
                            lineDashPattern={[6, 8]}
                        />
                    )}
                    
                    {/* Recorded Path */}
                    {locations.length > 1 && (
                        <Polyline
                            coordinates={locations}
                            strokeColor="#FF4444"
                            strokeWidth={4}
                        />
                    )}
                    
                    {/* Turn Instruction Markers */}
                    {turnInstructions.map((instruction, idx) => (
                        idx < turnInstructions.length - 1 && (
                            <Marker
                                key={instruction.id}
                                coordinate={instruction.location}
                                title={instruction.instruction}
                                pinColor="#FF9800"
                            />
                        )
                    ))}
                    
                    {/* Start Marker */}
                    {routePath.length > 0 && (
                        <Marker coordinate={routePath[0]} title="Start" pinColor="green" />
                    )}
                    
                    {/* End Marker */}
                    {routePath.length > 1 && (
                        <Marker coordinate={routePath[routePath.length - 1]} title="Destination" pinColor="red" />
                    )}
                </MapView>

                {/* Turn-by-Turn Navigation Panel */}
                {sessionActive && turnInstructions.length > 0 && (
                    <View style={styles.navigationCard}>
                        <View style={styles.navigationIconContainer}>
                            <Text style={styles.navigationIcon}>
                                {getTurnIcon(turnInstructions[nextTurnIndex]?.action || 'straight')}
                            </Text>
                        </View>
                        <View style={styles.navigationTextContainer}>
                            <Text style={styles.navigationInstruction}>{currentInstruction}</Text>
                            {distanceToNextTurn > 0 && nextTurnIndex < turnInstructions.length && (
                                <Text style={styles.navigationDistance}>
                                    in {distanceToNextTurn.toFixed(1)} km
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Turn List for Preview */}
                {!sessionActive && turnInstructions.length > 0 && (
                    <View style={styles.turnListContainer}>
                        <ScrollView style={styles.turnList}>
                            <Text style={styles.turnListTitle}>Route Instructions</Text>
                            {turnInstructions.map((instruction, idx) => (
                                <View key={instruction.id} style={styles.turnListItem}>
                                    <Text style={styles.turnListIcon}>{getTurnIcon(instruction.action)}</Text>
                                    <View style={styles.turnListText}>
                                        <Text style={styles.turnListInstruction}>{instruction.instruction}</Text>
                                        {idx < turnInstructions.length - 1 && (
                                            <Text style={styles.turnListDistance}>
                                                in {instruction.distanceToTurn.toFixed(1)} km
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Export Button */}
                {!sessionActive && locations.length > 0 && (
                    <TouchableOpacity style={styles.floatingExportButton} onPress={exportGPX}>
                        <Text style={styles.floatingButtonText}>📤</Text>
                    </TouchableOpacity>
                )}

                {/* Control Buttons */}
                <View style={styles.controlBar}>
                    {!sessionActive ? (
                        <TouchableOpacity style={[styles.controlButton, styles.startButton]} onPress={startRecording}>
                            <Text style={styles.controlButtonText}>Start Navigation</Text>
                        </TouchableOpacity>
                    ) : isPaused ? (
                        <>
                            <TouchableOpacity style={[styles.controlButton, styles.resumeButton]} onPress={resumeRecording}>
                                <Text style={styles.controlButtonText}>Resume</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={stopRecording}>
                                <Text style={styles.controlButtonText}>Stop</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={[styles.controlButton, styles.pauseButton]} onPress={pauseRecording}>
                                <Text style={styles.controlButtonText}>Pause</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={stopRecording}>
                                <Text style={styles.controlButtonText}>Stop</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Save Modal */}
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
                                style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
                                placeholder="Description"
                                value={rideDescription}
                                onChangeText={setRideDescription}
                                multiline
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalButton, styles.cancelModalButton]} onPress={() => setSaveModalVisible(false)}>
                                    <Text style={styles.cancelModalText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalButton, styles.saveModalButton]} onPress={handleSaveRide}>
                                    <Text style={styles.saveModalText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
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
    },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, color: '#ccc', marginBottom: 4 },
    statValue: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    statDivider: { width: 1, height: 30, backgroundColor: '#444' },
    mapContainer: { flex: 1, position: 'relative' },
    map: { flex: 1 },
    navigationCard: {
        position: 'absolute',
        top: 80,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        zIndex: 20,
    },
    navigationIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FF9800',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    navigationIcon: { fontSize: 28 },
    navigationTextContainer: { flex: 1 },
    navigationInstruction: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    navigationDistance: { color: '#FF9800', fontSize: 14, marginTop: 4 },
    turnListContainer: {
        position: 'absolute',
        top: 80,
        right: 16,
        width: 280,
        maxHeight: 400,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 12,
        zIndex: 15,
    },
    turnList: { padding: 12 },
    turnListTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    turnListItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 4 },
    turnListIcon: { fontSize: 20, width: 32 },
    turnListText: { flex: 1 },
    turnListInstruction: { color: '#fff', fontSize: 12 },
    turnListDistance: { color: '#FF9800', fontSize: 10, marginTop: 2 },
    floatingExportButton: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(33,150,243,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    floatingButtonText: { fontSize: 24 },
    controlBar: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 12,
        zIndex: 20,
    },
    controlButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    controlButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    startButton: { backgroundColor: '#4CAF50' },
    pauseButton: { backgroundColor: '#FF9800' },
    resumeButton: { backgroundColor: '#4CAF50' },
    stopButton: { backgroundColor: '#f44336' },
    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#fff', margin: 20, borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    cancelModalButton: { backgroundColor: '#f5f5f5' },
    saveModalButton: { backgroundColor: '#2196F3' },
    cancelModalText: { color: '#666', fontWeight: 'bold' },
    saveModalText: { color: '#fff', fontWeight: 'bold' },
});

export default RideRecorder;