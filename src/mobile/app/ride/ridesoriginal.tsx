import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    Dimensions,
} from 'react-native';
import MapView, { Polyline, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase, saveDatabase } from '@/services/localDatabase';
import { getRouteDraft, clearRouteDraft } from '@/services/routeTransfer';
import type { OSRMResponse } from '@/models/route';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LatLng {
    latitude: number;
    longitude: number;
    timestamp?: number;
}

interface TurnInstruction {
    id: string;
    instruction: string;
    action: 'straight' | 'slight-right' | 'right' | 'sharp-right' | 'left' | 'slight-left' | 'sharp-left' | 'destination';
    distanceToTurn: number;
    location: LatLng;
    streetName: string;
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
    const [currentInstruction, setCurrentInstruction] = useState('');
    const [currentStreetName, setCurrentStreetName] = useState('');
    const [totalDistance, setTotalDistance] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [saveModalVisible, setSaveModalVisible] = useState(false);
    const [rideTitle, setRideTitle] = useState('');
    const [rideDescription, setRideDescription] = useState('');
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    const [totalRouteDistance, setTotalRouteDistance] = useState(0);
    const [totalRouteDuration, setTotalRouteDuration] = useState(0);
    const [osrmResponse, setOsrmResponse] = useState<OSRMResponse | null>(null);

    const mapRef = useRef<MapView>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const timerRef = useRef<number | null>(null);

    const initialRegion: Region = {
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    useEffect(() => {
        const loadDraftRoute = async () => {
            const draft = getRouteDraft();
            if (draft && draft.locations.length > 0) {
                setIsCalculatingRoute(true);
                
                const routeData = await calculateFullRouteWithInstructions(draft.locations);
                
                if (routeData) {
                    setRoutePath(routeData.geometry);
                    setTurnInstructions(routeData.turnInstructions);
                    setTotalRouteDistance(routeData.totalDistance);
                    setTotalRouteDuration(routeData.totalDuration);
                    setOsrmResponse(routeData.osrmResponse ?? null);
                    
                    // Fit map to route
                    if (mapRef.current && routeData.geometry.length > 0) {
                        setTimeout(() => {
                            mapRef.current?.fitToCoordinates(routeData.geometry, {
                                edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
                                animated: true,
                            });
                        }, 500);
                    }
                }
                
                clearRouteDraft();
                setIsCalculatingRoute(false);
            }
        };
        
        loadDraftRoute();
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

    const calculateFullRouteWithInstructions = async (waypoints: LatLng[]) => {
        if (waypoints.length < 2) return null;
        
        try {
            const coordinates = waypoints.map(wp => `${wp.longitude},${wp.latitude}`).join(';');
            const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes[0]) {
                const route = data.routes[0];
                const allSteps: TurnInstruction[] = [];
                let cumulativeDistance = 0;
                
                // Process all legs
                for (const leg of route.legs) {
                    for (const step of leg.steps) {
                        const stepDistance = step.distance / 1000;
                        cumulativeDistance += stepDistance;
                        
                        const maneuver = step.maneuver;
                        
                        // Skip depart maneuvers, only process turn and arrive maneuvers
                        if (maneuver.type === 'depart') continue;
                        
                        // Generate instruction text
                        let instruction = '';
                        let action: TurnInstruction['action'] = 'straight';
                        
                        if (maneuver.type === 'arrive') {
                            instruction = 'Arrive at destination';
                            action = 'destination';
                        } else {
                            // Use OSRM's built-in instruction if available
                            if (maneuver.instruction) {
                                instruction = maneuver.instruction;
                            } else {
                                instruction = getInstructionFromManeuver(maneuver.type, maneuver.modifier);
                            }
                            action = mapModifierToAction(maneuver.modifier);
                        }
                        
                        allSteps.push({
                            id: `step_${allSteps.length}`,
                            instruction: instruction,
                            action: action,
                            distanceToTurn: cumulativeDistance,
                            location: {
                                latitude: maneuver.location[1],
                                longitude: maneuver.location[0],
                            },
                            streetName: step.name || '',
                        });
                    }
                }
                
                // Extract geometry
                const geometry = route.geometry.coordinates.map((coord: number[]) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                }));
                
                console.log('Generated instructions:', allSteps.length);
                return {
                    turnInstructions: allSteps,
                    geometry: geometry,
                    totalDistance: route.distance / 1000,
                    totalDuration: route.duration / 60,
                    osrmResponse: data,
                };
            }
        } catch (error) {
            console.error('Error calculating route:', error);
            Alert.alert('Route Error', 'Failed to calculate route. Check your internet connection.');
        }
        
        return null;
    };

    const getInstructionFromManeuver = (type: string, modifier: string): string => {
        switch (type) {
            case 'turn':
                return `Turn ${modifier}`;
            case 'roundabout':
                return `Enter roundabout, take exit`;
            case 'fork':
                return `Keep ${modifier} at fork`;
            case 'merge':
                return `Merge ${modifier}`;
            case 'new name':
                return `Continue onto ${modifier}`;
            case 'arrive':
                return 'Arrive at destination';
            default:
                return `Continue ${modifier || 'straight'}`;
        }
    };

    const mapModifierToAction = (modifier: string): TurnInstruction['action'] => {
        switch (modifier) {
            case 'left': return 'left';
            case 'right': return 'right';
            case 'slight left': return 'slight-left';
            case 'slight right': return 'slight-right';
            case 'sharp left': return 'sharp-left';
            case 'sharp right': return 'sharp-right';
            case 'straight': return 'straight';
            default: return 'straight';
        }
    };

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

    const toRad = (value: number): number => {
        return (value * Math.PI) / 180;
    };

    const updateNavigationProgress = useCallback((currentPos: LatLng) => {
        if (turnInstructions.length === 0 || nextTurnIndex >= turnInstructions.length) return;
        
        const nextTurn = turnInstructions[nextTurnIndex];
        const distanceToTurn = calculateDistance(
            currentPos.latitude, currentPos.longitude,
            nextTurn.location.latitude, nextTurn.location.longitude
        );
        
        setDistanceToNextTurn(distanceToTurn);
        
        // Within 30 meters of the turn
        if (distanceToTurn < 0.03) {
            const newIndex = nextTurnIndex + 1;
            setNextTurnIndex(newIndex);
            
            if (newIndex < turnInstructions.length) {
                setCurrentInstruction(turnInstructions[newIndex].instruction);
                setCurrentStreetName(turnInstructions[newIndex].streetName);
                
                // Alert for next maneuver
                Alert.alert('Next Maneuver', turnInstructions[newIndex].instruction);
            } else {
                setCurrentInstruction('Destination reached!');
                setCurrentStreetName('');
                
                if (sessionActive) {
                    Alert.alert('Destination Reached!', 'You have arrived.', [
                        { text: 'OK', onPress: () => stopRecording() }
                    ]);
                }
            }
        }
    }, [turnInstructions, nextTurnIndex, sessionActive]);

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
            setNextTurnIndex(0);
            setDistanceToNextTurn(0);
            
            if (turnInstructions.length > 0) {
                setCurrentInstruction(turnInstructions[0].instruction);
                setCurrentStreetName(turnInstructions[0].streetName);
            }
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
                
                setLocations((prev) => [...prev, newPoint]);
                
                if (locations.length > 0) {
                    const lastPoint = locations[locations.length - 1];
                    const distance = calculateDistance(
                        lastPoint.latitude, lastPoint.longitude,
                        newPoint.latitude, newPoint.longitude
                    );
                    setTotalDistance((prev) => prev + distance);
                }
                
                if (turnInstructions.length > 0 && !isPaused) {
                    updateNavigationProgress(newPoint);
                }
                
                if (mapRef.current && !isPaused) {
                    mapRef.current.animateCamera({
                        center: newPoint,
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
            setCurrentStreetName(turnInstructions[0].streetName);
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
        setNextTurnIndex(0);
        
        if (locations.length > 0) {
            setSaveModalVisible(true);
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
                osrmResponse,
                createdAt: new Date().toISOString(),
            });
            await saveDatabase(db);
            setSaveModalVisible(false);
            setRideTitle('');
            setRideDescription('');
            Alert.alert('Saved', 'Ride saved successfully.');
        } catch (error) {
            Alert.alert('Error', 'Failed to save ride.');
        }
    };

    const formatDistance = (km: number): string => {
        if (km < 1) return `${Math.round(km * 1000)} m`;
        return `${km.toFixed(2)} km`;
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (minutes > 0) return `${minutes}:${secs.toString().padStart(2, '0')}`;
        return `${secs}s`;
    };

    const formatDurationMinutes = (minutes: number): string => {
        if (minutes < 1) return '<1 min';
        if (minutes < 60) return `${Math.round(minutes)} min`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
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
            Alert.alert('Export Failed', 'Could not export the GPX file');
        }
    };

    const generateGPX = (points: LatLng[]): string => {
        const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Motorbike Ride Recorder" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Motorbike Ride</name>
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

    const getProgressPercentage = () => {
        if (turnInstructions.length <= 1) return 0;
        return (nextTurnIndex / (turnInstructions.length - 1)) * 100;
    };

    return (
        <View style={styles.container}>
            {/* Route Stats or Recording Stats */}
            {routePath.length > 0 && !sessionActive && (
                <View style={styles.routeStats}>
                    <View style={styles.routeStatItem}>
                        <Text style={styles.routeStatLabel}>Distance</Text>
                        <Text style={styles.routeStatValue}>{formatDistance(totalRouteDistance)}</Text>
                    </View>
                    <View style={styles.routeStatDivider} />
                    <View style={styles.routeStatItem}>
                        <Text style={styles.routeStatLabel}>Est. Time</Text>
                        <Text style={styles.routeStatValue}>{formatDurationMinutes(totalRouteDuration)}</Text>
                    </View>
                    <View style={styles.routeStatDivider} />
                    <View style={styles.routeStatItem}>
                        <Text style={styles.routeStatLabel}>Turns</Text>
                        <Text style={styles.routeStatValue}>{turnInstructions.length}</Text>
                    </View>
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
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Next</Text>
                        <Text style={styles.statValue}>{distanceToNextTurn > 0 ? `${distanceToNextTurn.toFixed(1)} km` : '--'}</Text>
                    </View>
                </View>
            )}

            {/* Map */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={initialRegion}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                    followsUserLocation={false}
                    showsCompass={true}
                >
                    {routePath.length > 1 && (
                        <Polyline coordinates={routePath} strokeColor="#2196F3" strokeWidth={5} />
                    )}
                    
                    {locations.length > 1 && (
                        <Polyline coordinates={locations} strokeColor="#FF4444" strokeWidth={4} />
                    )}
                    
                    {routePath.length > 0 && (
                        <Marker coordinate={routePath[0]} title="Start" pinColor="#4CAF50" />
                    )}
                    
                    {routePath.length > 1 && (
                        <Marker coordinate={routePath[routePath.length - 1]} title="Destination" pinColor="#f44336" />
                    )}
                </MapView>

                {isCalculatingRoute && (
                    <View style={styles.loadingOverlay}>
                        <Text style={styles.loadingText}>Calculating route...</Text>
                    </View>
                )}

                {/* Navigation Card */}
                {sessionActive && turnInstructions.length > 0 && (
                    <View style={styles.navigationCard}>
                        <View style={styles.navigationIconContainer}>
                            <Text style={styles.navigationIcon}>
                                {getTurnIcon(turnInstructions[nextTurnIndex]?.action || 'straight')}
                            </Text>
                        </View>
                        <View style={styles.navigationTextContainer}>
                            <Text style={styles.navigationInstruction}>{currentInstruction}</Text>
                            {currentStreetName ? (
                                <Text style={styles.navigationStreet}>{currentStreetName}</Text>
                            ) : null}
                            {distanceToNextTurn > 0 && (
                                <Text style={styles.navigationDistance}>
                                    in {distanceToNextTurn.toFixed(1)} km
                                </Text>
                            )}
                        </View>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
                            </View>
                        </View>
                    </View>
                )}

                {/* Turn List Preview */}
                {!sessionActive && turnInstructions.length > 0 && (
                    <View style={styles.turnListContainer}>
                        <View style={styles.turnListHeader}>
                            <Text style={styles.turnListTitle}>Route Instructions</Text>
                        </View>
                        <ScrollView style={styles.turnList}>
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

                {/* No Route Message */}
                {!sessionActive && routePath.length === 0 && !isCalculatingRoute && (
                    <View style={styles.noRouteContainer}>
                        <Text style={styles.noRouteIcon}>🗺️</Text>
                        <Text style={styles.noRouteTitle}>No Route Loaded</Text>
                        <Text style={styles.noRouteText}>Create a route in the Planner tab first.</Text>
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
                        <TouchableOpacity 
                            style={[styles.controlButton, styles.startButton]} 
                            onPress={startRecording}
                            disabled={routePath.length === 0}
                        >
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
    loadingOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 25,
    },
    loadingText: { color: '#fff', fontSize: 14 },
    navigationCard: {
        position: 'absolute',
        top: 70,
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
    turnListContainer: {
        position: 'absolute',
        top: 70,
        right: 16,
        width: SCREEN_WIDTH - 32,
        maxHeight: '60%',
        backgroundColor: 'rgba(0,0,0,0.92)',
        borderRadius: 16,
        zIndex: 15,
    },
    turnListHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    turnListTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    turnList: { padding: 12, maxHeight: 350 },
    turnListItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
    turnListIcon: { fontSize: 20, width: 32 },
    turnListText: { flex: 1 },
    turnListInstruction: { color: '#fff', fontSize: 14 },
    turnListDistance: { color: '#FF9800', fontSize: 11, marginTop: 4 },
    noRouteContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 15,
        paddingHorizontal: 40,
    },
    noRouteIcon: { fontSize: 64, marginBottom: 20 },
    noRouteTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    noRouteText: { color: '#ccc', fontSize: 14, textAlign: 'center' },
    floatingExportButton: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 52,
        height: 52,
        borderRadius: 26,
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
});

export default RideRecorder;