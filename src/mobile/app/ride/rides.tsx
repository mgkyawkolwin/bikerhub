import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import MapView, { Polyline, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { getDatabase, saveDatabase } from '@/services/localDatabase';
import { getRouteDraft, clearRouteDraft } from '@/services/routeTransfer';
import { useAuthContext } from '@/hooks/use-auth-context';
import type { OSRMResponse } from '@/models/route';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    bearing?: number;
}

interface TurnArrowInfo {
    visible: boolean;
    position: 'top-left' | 'center-left' | 'center-right' | 'top-right';
    action: 'straight' | 'slight-right' | 'right' | 'sharp-right' | 'left' | 'slight-left' | 'sharp-left' | 'destination';
    label: string;
    distanceMeters: number;
}

interface Waypoint {
    id: string;
    latitude: number;
    longitude: number;
    title: string;
    type: 'start' | 'stop' | 'end';
    order: number;
}

interface RouteSegment {
    from: Waypoint;
    to: Waypoint;
    distance: number; // km
    duration: number; // minutes
    polyline: LatLng[];
    osrmRoute?: any;
}

const RideRecorder: React.FC = () => {
    const params = useLocalSearchParams();
    const viewedUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
    const { getAuthUser } = useAuthContext();
    const authUser = getAuthUser();
    const currentUserId = authUser?.id;
    const isOwnData = !viewedUserId || viewedUserId === currentUserId;

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
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
    const [turnArrow, setTurnArrow] = useState<TurnArrowInfo>({
        visible: false,
        position: 'top-left',
        action: 'straight',
        label: '',
        distanceMeters: 0,
    });
    const [currentUserLocation, setCurrentUserLocation] = useState<LatLng | null>(null);
    const [simulatedPosition, setSimulatedPosition] = useState<LatLng | null>(null);
    const [straightDistanceMeters, setStraightDistanceMeters] = useState<number>(0);

    // Planning mode state (active when no draft route is passed in)
    const [planningMode, setPlanningMode] = useState(false);
    const [planWaypoints, setPlanWaypoints] = useState<Waypoint[]>([]);
    const [planSegments, setPlanSegments] = useState<RouteSegment[]>([]);
    const [planIsLoading, setPlanIsLoading] = useState(false);
    const [planTotalDistance, setPlanTotalDistance] = useState(0);
    const [planTotalDuration, setPlanTotalDuration] = useState(0); // minutes

    const mapRef = useRef<MapView>(null);
    const miniMapRef = useRef<MapView>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const timerRef = useRef<number | null>(null);
    const simulationIntervalRef = useRef<number | null>(null);
    const simulationPointIndexRef = useRef<number>(0);
    const simTurnIndexRef = useRef<number>(0);
    const currentBearingRef = useRef<number>(0);

    const initialRegion: Region = {
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    // Speed: 60 km/h = 16.67 m/s = 0.01667 km/s
    const SIMULATION_SPEED_KM_PER_SECOND = 0.01667;
    const SIMULATION_UPDATE_INTERVAL_MS = 500; // Update every 500ms

    useEffect(() => {
        const loadDraftRoute = async () => {
            const draft = getRouteDraft();
            if (!draft) {
                setPlanningMode(true);
                requestLocationPermission();
                return;
            }

            clearRouteDraft();

            // Set route geometry from stored coordinates
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

            // Parse turn instructions from stored segment OSRM data (avoids re-fetching with wrong waypoints)
            const draftSegments = draft.segments as any[] | undefined;
            if (draftSegments && draftSegments.length > 0 && draftSegments.some((s: any) => s.osrmRoute)) {
                const modifierToAction = (modifier: string): TurnInstruction['action'] => {
                    const map: Record<string, TurnInstruction['action']> = {
                        'left': 'left',
                        'right': 'right',
                        'slight left': 'slight-left',
                        'slight right': 'slight-right',
                        'sharp left': 'sharp-left',
                        'sharp right': 'sharp-right',
                        'straight': 'straight',
                    };
                    return map[modifier] ?? 'straight';
                };

                const buildInstruction = (type: string, modifier: string): string => {
                    switch (type) {
                        case 'turn': return `Turn ${modifier}`;
                        case 'roundabout': return 'Enter roundabout';
                        case 'fork': return `Keep ${modifier} at fork`;
                        case 'merge': return `Merge ${modifier}`;
                        case 'end of road': return `Turn ${modifier}`;
                        case 'new name': return 'Continue';
                        default: return `Continue ${modifier || 'straight'}`;
                    }
                };

                const allSteps: TurnInstruction[] = [];
                let cumulativeDistance = 0;
                let totalDist = 0;
                let totalDur = 0;

                for (const segment of draftSegments) {
                    totalDist += segment.distance || 0;
                    totalDur += segment.duration || 0;
                    const route = segment.osrmRoute;
                    if (!route) continue;

                    for (const leg of route.legs) {
                        for (const step of leg.steps) {
                            cumulativeDistance += step.distance / 1000;
                            const maneuver = step.maneuver;
                            if (maneuver.type === 'depart') continue;

                            let instruction = '';
                            let action: TurnInstruction['action'] = 'straight';

                            if (maneuver.type === 'arrive') {
                                instruction = 'Arrive at destination';
                                action = 'destination';
                            } else {
                                action = modifierToAction(maneuver.modifier);
                                instruction = buildInstruction(maneuver.type, maneuver.modifier);
                            }

                            allSteps.push({
                                id: `step_${allSteps.length}`,
                                instruction,
                                action,
                                distanceToTurn: cumulativeDistance,
                                location: {
                                    latitude: maneuver.location[1],
                                    longitude: maneuver.location[0],
                                },
                                streetName: step.name || '',
                                bearing: maneuver.bearing_after,
                            });
                        }
                    }
                }

                setTurnInstructions(allSteps);
                setTotalRouteDistance(totalDist);
                setTotalRouteDuration(totalDur);
                if (allSteps.length > 0) {
                    setCurrentInstruction(allSteps[0].instruction);
                    setCurrentStreetName(allSteps[0].streetName);
                }
            } else {
                // Fallback: re-fetch using original user waypoints (not full geometry)
                const waypointCoords: LatLng[] = (draft.waypoints && (draft.waypoints as any[]).length >= 2)
                    ? (draft.waypoints as any[]).map((wp: any) => ({ latitude: wp.latitude, longitude: wp.longitude }))
                    : draft.locations as LatLng[];
                const routeData = await calculateFullRouteWithInstructions(waypointCoords);
                if (routeData) {
                    setRoutePath(routeData.geometry);
                    setTurnInstructions(routeData.turnInstructions);
                    setTotalRouteDistance(routeData.totalDistance);
                    setTotalRouteDuration(routeData.totalDuration);
                    setOsrmResponse(routeData.osrmResponse ?? null);
                    if (routeData.turnInstructions.length > 0) {
                        setCurrentInstruction(routeData.turnInstructions[0].instruction);
                        setCurrentStreetName(routeData.turnInstructions[0].streetName);
                    }
                }
            }

            requestLocationPermission();
        };

        loadDraftRoute();
    }, []);

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

    // Arrow Display Component
    const TurnArrowDisplay = ({ action }: { action: string }) => {
        const getArrowSymbol = () => {
            switch (action) {
                case 'left':
                case 'sharp-left':
                    return '←';
                case 'right':
                case 'sharp-right':
                    return '→';
                case 'slight-left':
                    return '↖';
                case 'slight-right':
                    return '↗';
                default:
                    return '↑';
            }
        };

        return (
            <View style={styles.arrowSymbolContainer}>
                <Text style={styles.arrowSymbol}>{getArrowSymbol()}</Text>
            </View>
        );
    };

    const getArrowPosition = (action: string): TurnArrowInfo['position'] => {
        switch (action) {
            case 'left':
            case 'sharp-left':
                return 'top-left';
            case 'slight-left':
                return 'center-left';
            case 'slight-right':
                return 'center-right';
            case 'right':
            case 'sharp-right':
                return 'top-right';
            default:
                return 'top-left';
        }
    };

    const getTurnLabel = (action: string): string => {
        switch (action) {
            case 'left': return 'Turn Left';
            case 'right': return 'Turn Right';
            case 'sharp-left': return 'Sharp Left';
            case 'sharp-right': return 'Sharp Right';
            case 'slight-left': return 'Slight Left';
            case 'slight-right': return 'Slight Right';
            case 'straight': return 'Continue Straight';
            default: return 'Continue';
        }
    };

    const updateTurnArrow = useCallback((distanceToTurn: number, currentTurn: TurnInstruction | undefined) => {
        if (!currentTurn || currentTurn.action === 'destination') {
            setTurnArrow(prev => ({ ...prev, visible: false }));
            return;
        }

        const position = getArrowPosition(currentTurn.action);
        const distanceMeters = Math.round(distanceToTurn * 1000);
        const label = getTurnLabel(currentTurn.action);

        // Only show turn arrow within 2km of the turn, and not for straight
        setTurnArrow({
            visible: distanceToTurn <= 2 && currentTurn.action !== 'straight',
            position,
            action: currentTurn.action,
            label,
            distanceMeters,
        });
        setStraightDistanceMeters(distanceMeters);
    }, []);

    const updateNavigationProgress = useCallback((currentPos: LatLng) => {
        if (turnInstructions.length === 0 || nextTurnIndex >= turnInstructions.length) return;
        
        const nextTurn = turnInstructions[nextTurnIndex];
        const distanceToTurn = calculateDistance(
            currentPos.latitude, currentPos.longitude,
            nextTurn.location.latitude, nextTurn.location.longitude
        );
        
        setDistanceToNextTurn(distanceToTurn);
        updateTurnArrow(distanceToTurn, nextTurn);
        
        if (distanceToTurn < 0.03) {
            const newIndex = nextTurnIndex + 1;
            setNextTurnIndex(newIndex);
            
            if (newIndex < turnInstructions.length) {
                setCurrentInstruction(turnInstructions[newIndex].instruction);
                setCurrentStreetName(turnInstructions[newIndex].streetName);
                // Immediately update to next turn arrow
                updateTurnArrow(calculateDistance(
                    currentPos.latitude, currentPos.longitude,
                    turnInstructions[newIndex].location.latitude, turnInstructions[newIndex].location.longitude
                ), turnInstructions[newIndex]);
            } else {
                setCurrentInstruction('Destination reached!');
                setCurrentStreetName('');
                
                if (isSimulating) {
                    stopSimulation();
                }
            }
        }
    }, [turnInstructions, nextTurnIndex, isSimulating, updateTurnArrow, calculateDistance]);

    const zoomToRouteAndRotate = useCallback(async () => {
        if (!mapRef.current || turnInstructions.length === 0) return;
        
        const nextTurn = turnInstructions[0];
        if (!nextTurn) return;
        
        try {
            const userLoc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            });
            
            const currentPos = {
                latitude: userLoc.coords.latitude,
                longitude: userLoc.coords.longitude,
            };
            
            const bearing = calculateBearing(currentPos, nextTurn.location);
            
            const region: Region = {
                latitude: currentPos.latitude,
                longitude: currentPos.longitude,
                latitudeDelta: 0.009,
                longitudeDelta: 0.009,
            };
            
            mapRef.current.animateToRegion(region, 1000);
            
            setTimeout(() => {
                mapRef.current?.animateCamera({
                    center: region,
                    heading: bearing,
                    pitch: 30,
                    zoom: 16,
                }, { duration: 1000 });
            }, 1000);
        } catch (error) {
            console.error('Error zooming to route:', error);
        }
    }, [turnInstructions, calculateBearing]);

    const getArrowContainerStyle = (position: string) => {
        switch (position) {
            case 'top-left': return styles.arrowTopLeft;
            case 'center-left': return styles.arrowCenterLeft;
            case 'center-right': return styles.arrowCenterRight;
            case 'top-right': return styles.arrowTopRight;
            default: return styles.arrowTopLeft;
        }
    };

    // Stop Simulation Function
    const stopSimulation = useCallback(() => {
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        setIsSimulating(false);
        setSessionActive(false);
        setSimulatedPosition(null);
        setStraightDistanceMeters(0);
        
        // Hide turn arrow
        setTurnArrow(prev => ({ ...prev, visible: false }));
    }, []);

    // Simulation Function
    const startSimulation = useCallback(() => {
        if (routePath.length < 2) {
            Alert.alert('Error', 'No route to simulate');
            return;
        }

        setIsSimulating(true);
        setSessionActive(true);
        setLocations([]);
        setTotalDistance(0);
        setElapsedTime(0);
        setNextTurnIndex(0);
        simTurnIndexRef.current = 0;
        simulationPointIndexRef.current = 1; // Start from first point after start

        // Set initial position to start point
        const startPoint = routePath[0];
        setSimulatedPosition(startPoint);
        setCurrentUserLocation(startPoint);
        
        if (turnInstructions.length > 0) {
            setCurrentInstruction(turnInstructions[0].instruction);
            setCurrentStreetName(turnInstructions[0].streetName);
        }

        // Center map on start point with initial bearing
        if (mapRef.current && routePath.length > 1) {
            const initialBearing = calculateBearing(routePath[0], routePath[1]);
            mapRef.current.animateCamera({
                center: {
                    latitude: startPoint.latitude,
                    longitude: startPoint.longitude,
                },
                heading: initialBearing,
                pitch: 45,
                zoom: 18,
            }, { duration: 1000 });
        }

        // Start simulation interval
        const startTime = Date.now();
        let lastDistance = 0;
        let lastIndex = 1;
        let previousPosition = startPoint;

        simulationIntervalRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000; // seconds
            const distanceTraveled = elapsed * SIMULATION_SPEED_KM_PER_SECOND; // km

            // Find the current position along the route
            let accumulatedDistance = 0;
            let currentPointIndex = 1;
            let currentLatLng = routePath[0];
            let nextWaypoint = routePath[1];

            for (let i = 1; i < routePath.length; i++) {
                const segmentDistance = calculateDistance(
                    routePath[i - 1].latitude, routePath[i - 1].longitude,
                    routePath[i].latitude, routePath[i].longitude
                );
                
                if (accumulatedDistance + segmentDistance >= distanceTraveled) {
                    // Interpolate between points
                    const remaining = distanceTraveled - accumulatedDistance;
                    const fraction = remaining / segmentDistance;
                    
                    currentLatLng = {
                        latitude: routePath[i - 1].latitude + (routePath[i].latitude - routePath[i - 1].latitude) * fraction,
                        longitude: routePath[i - 1].longitude + (routePath[i].longitude - routePath[i - 1].longitude) * fraction,
                    };
                    currentPointIndex = i;
                    nextWaypoint = routePath[i];
                    break;
                }
                accumulatedDistance += segmentDistance;
                currentLatLng = routePath[i];
                currentPointIndex = i;
                nextWaypoint = routePath[Math.min(i + 1, routePath.length - 1)];
            }

            // Calculate bearing for map rotation
            const bearing = calculateBearing(previousPosition, currentLatLng);
            previousPosition = currentLatLng;

            // Update position
            setSimulatedPosition(currentLatLng);
            setCurrentUserLocation(currentLatLng);
            
            // Add to recorded locations
            setLocations(prev => [...prev, currentLatLng]);
            
            // Update total distance
            if (lastIndex < currentPointIndex) {
                let newDistance = lastDistance;
                for (let i = lastIndex; i <= currentPointIndex; i++) {
                    newDistance += calculateDistance(
                        routePath[i - 1].latitude, routePath[i - 1].longitude,
                        routePath[i].latitude, routePath[i].longitude
                    );
                }
                setTotalDistance(newDistance);
                lastDistance = newDistance;
                lastIndex = currentPointIndex;
            } else if (currentPointIndex > 1) {
                const partialDistance = calculateDistance(
                    routePath[currentPointIndex - 1].latitude, routePath[currentPointIndex - 1].longitude,
                    currentLatLng.latitude, currentLatLng.longitude
                );
                let newDistance = lastDistance;
                for (let i = lastIndex; i < currentPointIndex; i++) {
                    newDistance += calculateDistance(
                        routePath[i - 1].latitude, routePath[i - 1].longitude,
                        routePath[i].latitude, routePath[i].longitude
                    );
                }
                newDistance += partialDistance;
                setTotalDistance(newDistance);
                lastDistance = newDistance;
                lastIndex = currentPointIndex;
            }
            
            // Update elapsed time
            setElapsedTime(elapsed);
            
            // Update navigation progress using ref to avoid stale closure
            if (turnInstructions.length > 0) {
                const currentTurnIdx = simTurnIndexRef.current;
                if (currentTurnIdx < turnInstructions.length) {
                    const nextTurn = turnInstructions[currentTurnIdx];
                    const distToTurn = calculateDistance(
                        currentLatLng.latitude, currentLatLng.longitude,
                        nextTurn.location.latitude, nextTurn.location.longitude
                    );
                    setDistanceToNextTurn(distToTurn);

                    // Update the arrow with decreasing distance, only show within 2km and not for straight
                    if (nextTurn.action !== 'destination') {
                        const distMeters = Math.round(distToTurn * 1000);
                        setStraightDistanceMeters(distMeters);
                        setTurnArrow({
                            visible: distToTurn <= 2 && nextTurn.action !== 'straight',
                            position: getArrowPosition(nextTurn.action),
                            action: nextTurn.action,
                            label: getTurnLabel(nextTurn.action),
                            distanceMeters: distMeters,
                        });
                    }

                    // Advance to next turn when within 30m
                    if (distToTurn < 0.03) {
                        const newIdx = currentTurnIdx + 1;
                        simTurnIndexRef.current = newIdx;
                        setNextTurnIndex(newIdx);
                        // Reset straight distance after turn
                        setStraightDistanceMeters(0);
                        setTurnArrow(prev => ({ ...prev, visible: false }));
                        if (newIdx < turnInstructions.length) {
                            setCurrentInstruction(turnInstructions[newIdx].instruction);
                            setCurrentStreetName(turnInstructions[newIdx].streetName);
                        } else {
                            setCurrentInstruction('Destination reached!');
                            setCurrentStreetName('');
                        }
                    }
                }
            }
            
            // Animate map camera to follow simulated position with rotation.
            // Offset the camera center forward (in bearing direction) so that
            // the vehicle marker appears in the lower portion of the viewport.
            if (!isNaN(bearing)) {
                currentBearingRef.current = bearing;
                const cameraCenter = offsetCoordinate(
                    currentLatLng.latitude,
                    currentLatLng.longitude,
                    bearing,
                    250, // metres ahead — puts vehicle near the bottom of the viewport
                );
                if (mapRef.current) {
                    mapRef.current.animateCamera({
                        center: cameraCenter,
                        heading: bearing,
                        pitch: 75,
                        zoom: 18,
                    }, { duration: 500 });
                }
                if (miniMapRef.current) {
                    const miniCameraCenter = offsetCoordinate(
                        currentLatLng.latitude,
                        currentLatLng.longitude,
                        bearing,
                        350, // zoom-14 mini-map: ~350m shifts marker to bottom 20% of the thumbnail
                    );
                    miniMapRef.current.animateCamera({
                        center: miniCameraCenter,
                        heading: bearing,
                        pitch: 0,
                        zoom: 14,
                    }, { duration: 500 });
                }
            }
            
            // Check if destination reached
            if (distanceTraveled >= totalRouteDistance) {
                stopSimulation();
            }
        }, SIMULATION_UPDATE_INTERVAL_MS);
    }, [routePath, turnInstructions, totalRouteDistance, calculateBearing, calculateDistance, stopSimulation]);

    const startRecording = async () => {
        setSessionActive(true);
        setIsPaused(false);
        setIsRecording(true);
        setNextTurnIndex(0);
        
        if (turnInstructions.length > 0) {
            setCurrentInstruction(turnInstructions[0].instruction);
            setCurrentStreetName(turnInstructions[0].streetName);
            
            // Get current location and show initial arrow if within range
            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.BestForNavigation,
                });
                const currentPos = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                updateNavigationProgress(currentPos);
            } catch (error) {
                console.error('Error getting initial location:', error);
            }
        }
        
        await zoomToRouteAndRotate();
        await subscribeLocationUpdates(false);
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
                
                for (const leg of route.legs) {
                    for (const step of leg.steps) {
                        const stepDistance = step.distance / 1000;
                        cumulativeDistance += stepDistance;
                        
                        const maneuver = step.maneuver;
                        
                        if (maneuver.type === 'depart') continue;
                        
                        let instruction = '';
                        let action: TurnInstruction['action'] = 'straight';
                        let bearing = maneuver.bearing_after || 0;
                        
                        if (maneuver.type === 'arrive') {
                            instruction = 'Arrive at destination';
                            action = 'destination';
                        } else {
                            instruction = maneuver.instruction || getInstructionFromManeuver(maneuver.type, maneuver.modifier);
                            action = mapModifierToAction(maneuver.modifier);
                            bearing = maneuver.bearing_after;
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
                            bearing: bearing,
                        });
                    }
                }
                
                const geometry = route.geometry.coordinates.map((coord: number[]) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                }));
                
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
            Alert.alert('Route Error', 'Failed to calculate route.');
        }
        
        return null;
    };

    const getInstructionFromManeuver = (type: string, modifier: string): string => {
        switch (type) {
            case 'turn': return `Turn ${modifier}`;
            case 'roundabout': return `Enter roundabout`;
            case 'fork': return `Keep ${modifier} at fork`;
            case 'merge': return `Merge ${modifier}`;
            case 'new name': return `Continue`;
            case 'arrive': return 'Arrive at destination';
            default: return `Continue ${modifier || 'straight'}`;
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

    // ─── Planning mode functions ─────────────────────────────────────────────

    const normalizePlanWaypoints = (list: Waypoint[]): Waypoint[] => {
        const sorted = [...list].sort((a, b) => a.order - b.order);
        return sorted.map((wp, idx) => ({
            ...wp,
            type: (idx === 0 ? 'start' : idx === sorted.length - 1 ? 'end' : 'stop') as Waypoint['type'],
            order: idx,
            title: idx === 0 ? 'Start' : idx === sorted.length - 1 ? 'End' : `Stop ${idx}`,
        }));
    };

    const calculatePlanSegment = async (from: Waypoint, to: Waypoint): Promise<RouteSegment | null> => {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=true`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.code === 'Ok' && data.routes[0]) {
                const route = data.routes[0];
                const polyline: LatLng[] = route.geometry.coordinates.map((coord: [number, number]) => ({
                    latitude: coord[1],
                    longitude: coord[0],
                }));
                return { from, to, distance: route.distance / 1000, duration: route.duration / 60, polyline, osrmRoute: route };
            }
            return null;
        } catch {
            return null;
        }
    };

    const calculateAllPlanRoutes = async (waypointList: Waypoint[]) => {
        if (waypointList.length < 2) {
            setPlanSegments([]);
            setPlanTotalDistance(0);
            setPlanTotalDuration(0);
            return;
        }
        setPlanIsLoading(true);
        const sorted = [...waypointList].sort((a, b) => a.order - b.order);
        const newSegments: RouteSegment[] = [];
        for (let i = 0; i < sorted.length - 1; i++) {
            const seg = await calculatePlanSegment(sorted[i], sorted[i + 1]);
            if (seg) newSegments.push(seg);
        }
        setPlanSegments(newSegments);
        setPlanTotalDistance(newSegments.reduce((s, seg) => s + seg.distance, 0));
        setPlanTotalDuration(newSegments.reduce((s, seg) => s + seg.duration, 0));
        setPlanIsLoading(false);
        if (mapRef.current && waypointList.length > 0) {
            mapRef.current.fitToCoordinates(
                waypointList.map(w => ({ latitude: w.latitude, longitude: w.longitude })),
                { edgePadding: { top: 80, right: 40, bottom: 120, left: 40 }, animated: true },
            );
        }
    };

    const handlePlanLongPress = (event: any) => {
        const { coordinate } = event.nativeEvent;
        const newWaypoint: Waypoint = {
            id: Date.now().toString(),
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            title: 'End',
            type: 'end',
            order: planWaypoints.length,
        };
        const updated = normalizePlanWaypoints([...planWaypoints, newWaypoint]);
        setPlanWaypoints(updated);
        if (updated.length >= 2) void calculateAllPlanRoutes(updated);
    };

    const handlePlanMarkerDragEnd = async (id: string, coordinate: LatLng) => {
        const updated = planWaypoints.map(wp =>
            wp.id === id ? { ...wp, latitude: coordinate.latitude, longitude: coordinate.longitude } : wp,
        );
        setPlanWaypoints(updated);
        if (updated.length >= 2) await calculateAllPlanRoutes(updated);
    };

    const handlePlanMarkerPress = (id: string) => {
        const filtered = planWaypoints.filter(wp => wp.id !== id);
        const updated = normalizePlanWaypoints(filtered);
        setPlanWaypoints(updated);
        if (updated.length >= 2) {
            void calculateAllPlanRoutes(updated);
        } else {
            setPlanSegments([]);
            setPlanTotalDistance(0);
            setPlanTotalDuration(0);
        }
    };

    const clearPlanWaypoints = () => {
        setPlanWaypoints([]);
        setPlanSegments([]);
        setPlanTotalDistance(0);
        setPlanTotalDuration(0);
    };

    /** Convert the planned segments into a navigation-ready route, then exit planning mode. */
    const startNavigating = () => {
        if (planSegments.length === 0) {
            Alert.alert('No Route', 'Long press the map to add start and destination points first.');
            return;
        }
        // Build flat route geometry (deduplicate consecutive identical points)
        const routeCoordinates: LatLng[] = [];
        for (const seg of planSegments) {
            for (const pt of seg.polyline) {
                const last = routeCoordinates[routeCoordinates.length - 1];
                if (!last || last.latitude !== pt.latitude || last.longitude !== pt.longitude) {
                    routeCoordinates.push(pt);
                }
            }
        }
        // Parse turn instructions from OSRM step data stored in each segment
        const allSteps: TurnInstruction[] = [];
        let cumulativeDist = 0;
        let totalDist = 0;
        let totalDur = 0; // minutes
        for (const seg of planSegments) {
            totalDist += seg.distance;
            totalDur += seg.duration;
            const route = seg.osrmRoute;
            if (!route) continue;
            for (const leg of route.legs) {
                for (const step of leg.steps) {
                    cumulativeDist += step.distance / 1000;
                    const m = step.maneuver;
                    if (m.type === 'depart') continue;
                    const action: TurnInstruction['action'] = m.type === 'arrive'
                        ? 'destination'
                        : mapModifierToAction(m.modifier);
                    const instruction = m.type === 'arrive'
                        ? 'Arrive at destination'
                        : getInstructionFromManeuver(m.type, m.modifier);
                    allSteps.push({
                        id: `step_${allSteps.length}`,
                        instruction,
                        action,
                        distanceToTurn: cumulativeDist,
                        location: { latitude: m.location[1], longitude: m.location[0] },
                        streetName: step.name || '',
                        bearing: m.bearing_after,
                    });
                }
            }
        }
        setRoutePath(routeCoordinates);
        setTurnInstructions(allSteps);
        setTotalRouteDistance(totalDist);
        setTotalRouteDuration(totalDur);
        setPlanningMode(false);
        setTimeout(() => {
            mapRef.current?.fitToCoordinates(routeCoordinates, {
                edgePadding: { top: 80, right: 40, bottom: 120, left: 40 },
                animated: true,
            });
        }, 300);
    };

    // ─────────────────────────────────────────────────────────────────────────

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
                
                setCurrentUserLocation(newPoint);
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
                    const gpsBearing = newLocation.coords.heading ?? currentBearingRef.current;
                    currentBearingRef.current = gpsBearing;
                    const gpsCameraCenter = offsetCoordinate(
                        newPoint.latitude,
                        newPoint.longitude,
                        gpsBearing,
                        250,
                    );
                    mapRef.current.animateCamera({
                        center: gpsCameraCenter,
                        heading: gpsBearing,
                        pitch: 75,
                        zoom: 18,
                    }, { duration: 500 });
                    if (miniMapRef.current) {
                        const gpsMinCameraCenter = offsetCoordinate(
                            newPoint.latitude,
                            newPoint.longitude,
                            gpsBearing,
                            350,
                        );
                        miniMapRef.current.animateCamera({
                            center: gpsMinCameraCenter,
                            heading: gpsBearing,
                            pitch: 0,
                            zoom: 13,
                        }, { duration: 500 });
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
        setNextTurnIndex(0);
        setStraightDistanceMeters(0);
        
        // Hide turn arrow
        setTurnArrow(prev => ({ ...prev, visible: false }));
        
        if (locations.length > 0 && isOwnData) {
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
            {/* Planning stats bar — shown while planning a new route */}
            {planningMode && !sessionActive && planSegments.length > 0 && (
                <View style={styles.planningStatsBar}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Points</Text>
                        <Text style={styles.statValue}>{planWaypoints.length}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Distance</Text>
                        <Text style={styles.statValue}>{planTotalDistance.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Est. Time</Text>
                        <Text style={styles.statValue}>{formatEtaDuration(planTotalDuration * 60)}</Text>
                    </View>
                </View>
            )}

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
                    onLongPress={planningMode && !sessionActive ? handlePlanLongPress : undefined}
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
                    
                    {/* Simulated position marker */}
                    {isSimulating && simulatedPosition && (
                        <Marker coordinate={simulatedPosition} anchor={{ x: 0.5, y: 0.5 }}>
                            <View style={styles.vehicleMarker}>
                                <View style={styles.vehicleArrow} />
                            </View>
                        </Marker>
                    )}

                    {/* Planning: route segments */}
                    {planningMode && planSegments.map((seg) => (
                        <Polyline
                            key={`${seg.from.id}-${seg.to.id}`}
                            coordinates={seg.polyline}
                            strokeColor="#FF9800"
                            strokeWidth={4}
                        />
                    ))}

                    {/* Planning: waypoint markers — tap to remove, drag to reposition */}
                    {planningMode && planWaypoints.map((wp) => (
                        <Marker
                            key={wp.id}
                            coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
                            pinColor={wp.type === 'start' ? '#4CAF50' : wp.type === 'end' ? '#f44336' : '#FFD700'}
                            draggable
                            title={wp.title}
                            description="Tap to remove · drag to move"
                            onDragEnd={(e) => void handlePlanMarkerDragEnd(wp.id, e.nativeEvent.coordinate)}
                            onPress={() => handlePlanMarkerPress(wp.id)}
                        />
                    ))}
                </MapView>

                {/* Planning: instruction prompts */}
                {planningMode && !sessionActive && planWaypoints.length === 0 && (
                    <View style={styles.planningInstructions}>
                        <Text style={styles.planningInstructionsText}>Long press on map to set start point</Text>
                    </View>
                )}
                {planningMode && !sessionActive && planWaypoints.length === 1 && (
                    <View style={styles.planningInstructions}>
                        <Text style={styles.planningInstructionsText}>Long press again to set destination</Text>
                    </View>
                )}
                {/* Planning: route calculation loading overlay */}
                {planIsLoading && (
                    <View style={styles.planningLoading}>
                        <ActivityIndicator size="large" color="#FF9800" />
                        <Text style={styles.planningLoadingText}>Calculating route…</Text>
                    </View>
                )}

                {sessionActive && turnArrow.visible && (
                    <View style={getArrowContainerStyle(turnArrow.position)}>
                        <Text style={styles.arrowLabel}>{turnArrow.label}</Text>
                        <TurnArrowDisplay action={turnArrow.action} />
                        <Text style={styles.arrowDistance}>
                            {turnArrow.distanceMeters >= 1000
                                ? `${(turnArrow.distanceMeters / 1000).toFixed(1)} km`
                                : `${turnArrow.distanceMeters} m`}
                        </Text>
                    </View>
                )}

                {/* Straight-ahead indicator — always visible during session */}
                {sessionActive && straightDistanceMeters > 0 && (
                    <View style={styles.straightIndicator}>
                        <Text style={styles.straightArrow}>↑</Text>
                        <Text style={styles.straightDistance}>
                            {straightDistanceMeters >= 1000
                                ? `${(straightDistanceMeters / 1000).toFixed(1)} km`
                                : `${straightDistanceMeters} m`}
                        </Text>
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



                <View style={styles.controlBar}>
                    {planningMode && !sessionActive ? (
                        <>
                            {isOwnData ? (
                                <TouchableOpacity
                                    style={[styles.controlButton, styles.clearButton]}
                                    onPress={clearPlanWaypoints}
                                    disabled={planWaypoints.length === 0}
                                >
                                    <Text style={styles.controlButtonText}>Clear</Text>
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity
                                style={[styles.controlButton, styles.startButton]}
                                onPress={startNavigating}
                                disabled={planSegments.length === 0 || planIsLoading}
                            >
                                <Text style={styles.controlButtonText}>Start Navigating</Text>
                            </TouchableOpacity>
                        </>
                    ) : !sessionActive ? (
                        <>
                            {/* Simulate Start Button */}
                            <TouchableOpacity 
                                style={[styles.controlButton, styles.simulateButton]} 
                                onPress={startSimulation}
                                disabled={routePath.length === 0 || isSimulating}
                            >
                                <Text style={styles.controlButtonText}>🎬 Simulate</Text>
                            </TouchableOpacity>
                            
                            {/* Start Navigation Button */}
                            <TouchableOpacity 
                                style={[styles.controlButton, styles.startButton]} 
                                onPress={startRecording}
                                disabled={routePath.length === 0}
                            >
                                <Text style={styles.controlButtonText}>Start Navigation</Text>
                            </TouchableOpacity>
                        </>
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
                    
                    {/* Stop Simulation Button */}
                    {isSimulating && (
                        <TouchableOpacity style={[styles.controlButton, styles.stopSimulateButton]} onPress={stopSimulation}>
                            <Text style={styles.controlButtonText}>Stop Sim</Text>
                        </TouchableOpacity>
                    )}
                </View>

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
    
    arrowTopLeft: {
        position: 'absolute',
        top: 80,
        left: 16,
        zIndex: 25,
        alignItems: 'center',
        padding: 0,
    },
    arrowCenterLeft: {
        position: 'absolute',
        top: SCREEN_HEIGHT / 2 - 80,
        left: 16,
        zIndex: 25,
        alignItems: 'center',
        padding: 0,
    },
    arrowCenterRight: {
        position: 'absolute',
        top: SCREEN_HEIGHT / 2 - 80,
        right: 16,
        zIndex: 25,
        alignItems: 'center',
        padding: 0,
    },
    arrowTopRight: {
        position: 'absolute',
        top: 80,
        right: 16,
        zIndex: 25,
        alignItems: 'center',
        padding: 0,
    },
    arrowIndicator: {
        alignItems: 'center',
        marginTop: -50
    },
    arrowLabel: {
        color: '#000',
        fontSize: 23,
        fontWeight: 'bold',
        marginBottom: 2,
        textAlign: 'center',
        textShadowColor: 'rgba(255,255,255,0.9)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
        marginTop: 0,
    },
    arrowSymbolContainer: {
        marginVertical: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -20,
    },
    arrowSymbol: {
        fontSize: 128,
        color: '#000',
        fontWeight: 'bold',
        textShadowColor: 'rgba(255,255,255,0.9)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
        marginTop: -72,
    },
    arrowDistance: {
        color: '#000',
        fontSize: 36,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255,255,255,0.9)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
        marginTop: -40,
    },
    straightIndicator: {
        position: 'absolute',
        bottom: 90,
        right: 16,
        zIndex: 25,
        alignItems: 'center',
    },
    straightArrow: {
        fontSize: 92,
        color: '#000',
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 255, 255, 0.9)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
        marginBottom: -30,
    },
    straightDistance: {
        color: '#000',
        fontSize: 36,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadowColor: 'rgba(255, 255, 255, 0.9)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
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
    controlButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    controlButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    startButton: { backgroundColor: '#4CAF50' },
    simulateButton: { backgroundColor: '#9C27B0' },
    pauseButton: { backgroundColor: '#FF9800' },
    resumeButton: { backgroundColor: '#4CAF50' },
    stopButton: { backgroundColor: '#f44336' },
    stopSimulateButton: { backgroundColor: '#f44336', flex: 0.5 },
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
        bottom: 90,
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