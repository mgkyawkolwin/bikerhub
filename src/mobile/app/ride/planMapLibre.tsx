// import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   TouchableOpacity,
//   Alert,
//   Modal,
//   TextInput,
//   ScrollView,
//   ActivityIndicator,
// } from 'react-native';
// import * as MapLibreGL from '@maplibre/maplibre-react-native';
// import * as Location from 'expo-location';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { getDatabase, saveDatabase } from '@/services/localDatabase';
// import { setRouteDraft } from '@/services/routeTransfer';
// import { useAuthContext } from '@/hooks/use-auth-context';
// import type { OSRMRoute } from '@/models/route';
// import { useThemeContext } from '@/hooks/use-theme-context';
// import { MaterialIcons } from '@expo/vector-icons';

// interface Waypoint {
//   id: string;
//   latitude: number;
//   longitude: number;
//   title: string;
//   type: 'start' | 'stop' | 'end';
//   order: number;
// }

// interface RouteSegment {
//   from: Waypoint;
//   to: Waypoint;
//   distance: number;
//   duration: number;
//   polyline: LatLng[];
//   osrmRoute?: OSRMRoute;
// }

// interface LatLng {
//   latitude: number;
//   longitude: number;
// }

// // Free OSM tile style (no API key required)
// // const MAP_STYLE_URL = "https://demotiles.maplibre.org/style.json"; // 'https://tiles.stadiamaps.com/styles/alidade_smooth.json';
// const MAP_STYLE_URL = 'https://tiles.stadiamaps.com/styles/alidade_smooth.json?api_key=ff8aa78e-2e01-432f-8303-1a7f32b2107d';

// const RoutePlanner: React.FC = () => {
//   const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
//   const [segments, setSegments] = useState<RouteSegment[]>([]);
//   const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
//   const [mapZoom, setMapZoom] = useState(12);
//   const [isLoading, setIsLoading] = useState(false);
//   const [totalDistance, setTotalDistance] = useState(0);
//   const [totalDuration, setTotalDuration] = useState(0);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [editingPoint, setEditingPoint] = useState<Waypoint | null>(null);
//   const [tempTitle, setTempTitle] = useState('');
//   const [saveModalVisible, setSaveModalVisible] = useState(false);
//   const [saveTitle, setSaveTitle] = useState('');
//   const [saveDescription, setSaveDescription] = useState('');
//   const [mapLoaded, setMapLoaded] = useState(false);
//   const params = useLocalSearchParams();
//   const planId = Array.isArray(params.id) ? params.id[0] : params.id;
//   const viewedUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
//   const [planOwnerId, setPlanOwnerId] = useState<string | null>(null);
//   const { getAuthUser } = useAuthContext();
//   const authUser = getAuthUser();
//   const currentUserId = authUser?.id;
//   const effectiveOwnerId = planOwnerId ?? viewedUserId;
//   const isOwnData = !effectiveOwnerId || effectiveOwnerId === currentUserId;
//   const [currentPlanId, setCurrentPlanId] = useState<string | null>(planId ?? null);
//   const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
//   const [showSavedModal, setShowSavedModal] = useState(false);
//   const insets = useSafeAreaInsets();
//   const router = useRouter();
//   const { colors } = useThemeContext();
//   const { colors } = useThemeContext();

//   const mapRef = useRef<MapLibreGL.MapRef>(null);
//   const cameraRef = useRef<MapLibreGL.CameraRef>(null);

//   // Convert route segments to GeoJSON for MapLibre
//   const routeGeoJSON = useMemo(() => {
//     if (segments.length === 0) return null;
    
//     const allCoordinates: [number, number][] = [];
//     segments.forEach(segment => {
//       segment.polyline.forEach(point => {
//         allCoordinates.push([point.longitude, point.latitude]);
//       });
//     });
    
//     return {
//       type: 'Feature' as const,
//       geometry: {
//         type: 'LineString' as const,
//         coordinates: allCoordinates,
//       },
//       properties: {},
//     };
//   }, [segments]);

//   const getBoundsFromCoordinates = (coordinates: [number, number][]): [number, number, number, number] => {
//     if (coordinates.length === 0) {
//       return [0, 0, 0, 0];
//     }

//     let west = coordinates[0][0];
//     let south = coordinates[0][1];
//     let east = coordinates[0][0];
//     let north = coordinates[0][1];

//     coordinates.forEach(([lon, lat]) => {
//       west = Math.min(west, lon);
//       south = Math.min(south, lat);
//       east = Math.max(east, lon);
//       north = Math.max(north, lat);
//     });

//     return [west, south, east, north];
//   };

//   // Load saved routes on mount
//   useEffect(() => {
//     initializeMap();
//     loadSavedRoutes();
//   }, []);

//   // Update totals when segments change
//   const calculateTotals = useCallback(() => {
//     const totalDist = segments.reduce((sum, seg) => sum + seg.distance, 0);
//     const totalDur = segments.reduce((sum, seg) => sum + seg.duration, 0);
//     setTotalDistance(totalDist);
//     setTotalDuration(totalDur);
//   }, [segments]);

//   useEffect(() => {
//     calculateTotals();
//   }, [calculateTotals]);

//   const initializeMap = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status === 'granted') {
//         const location = await Location.getCurrentPositionAsync({
//           accuracy: Location.Accuracy.Balanced,
//         });

//         setMapCenter([location.coords.longitude, location.coords.latitude]);
//         setMapZoom(14);
//       }
//     } catch (error) {
//       console.error('Error initializing map:', error);
//     }
//   };

//   // Calculate route between two points using OSRM API
//   const calculateRoute = async (
//     start: Waypoint,
//     end: Waypoint
//   ): Promise<RouteSegment | null> => {
//     try {
//       const url = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson&steps=true`;

//       const response = await fetch(url);
//       const data = await response.json();

//       if (data.code === 'Ok' && data.routes[0]) {
//         const route = data.routes[0];
//         const coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
//           latitude: coord[1],
//           longitude: coord[0],
//         }));

//         return {
//           from: start,
//           to: end,
//           distance: route.distance / 1000,
//           duration: route.duration / 60,
//           polyline: coordinates,
//           osrmRoute: route,
//         };
//       }
//       return null;
//     } catch (error) {
//       console.error('Error calculating route:', error);
//       return null;
//     }
//   };

//   // Calculate all route segments
//   const calculateAllRoutes = useCallback(async (waypointList: Waypoint[] = waypoints) => {
//     if (waypointList.length < 2) {
//       setSegments([]);
//       return [];
//     }

//     const normalizedList = normalizeWaypoints(waypointList);
//     setIsLoading(true);
//     const newSegments: RouteSegment[] = [];

//     // Request route segments sequentially based on marker order
//     const sortedWaypoints = [...normalizedList].sort((a, b) => a.order - b.order);

//     for (let i = 0; i < sortedWaypoints.length - 1; i++) {
//       const route = await calculateRoute(sortedWaypoints[i], sortedWaypoints[i + 1]);
//       if (route) {
//         newSegments.push(route);
//       } else {
//         Alert.alert('Error', `Failed to calculate route between ${sortedWaypoints[i].title} and ${sortedWaypoints[i + 1].title}`);
//         break;
//       }
//     }

//     setSegments(newSegments);
//     setIsLoading(false);

//     // Fit map to show all waypoints after map is ready
//     if (mapLoaded && cameraRef.current && waypointList.length > 0) {
//       const coordinates = waypointList.map(w => [w.longitude, w.latitude] as [number, number]);
//       const bounds = getBoundsFromCoordinates(coordinates);
//       cameraRef.current.fitBounds(bounds, { padding: { top: 50, right: 50, bottom: 50, left: 50 }, duration: 300 });
//     }

//     return newSegments;
//   }, [waypoints, mapLoaded]);

//   const normalizeWaypoints = (waypointList: Waypoint[]) => {
//     const orderedList = [...waypointList].sort((a, b) => a.order - b.order);
//     if (orderedList.length === 0) return [];

//     return orderedList.map((wp, idx) => {
//       const type: Waypoint['type'] = idx === 0
//         ? 'start'
//         : idx === orderedList.length - 1
//           ? 'end'
//           : 'stop';

//       let title = wp.title;
//       if (wp.title === 'Start Point' && type !== 'start') {
//         title = type === 'end' ? 'End Point' : `Stop ${idx}`;
//       } else if (wp.title === 'End Point' && type !== 'end') {
//         title = `Stop ${idx}`;
//       } else if (wp.title?.startsWith('Stop ') && type === 'end') {
//         title = 'End Point';
//       } else if ((wp.title?.startsWith('Stop ') || wp.title === 'End Point') && type === 'start') {
//         title = 'Start Point';
//       }

//       return {
//         ...wp,
//         type,
//         order: idx,
//         title,
//       };
//     });
//   };

//   // Handle map press
//   const handleMapPress = async (event: any) => {
//     const lngLat = event?.nativeEvent?.lngLat;
//     if (!lngLat || lngLat.length !== 2) return;

//     const coordinate = {
//       latitude: lngLat[1],
//       longitude: lngLat[0],
//     };

//     if (waypoints.length === 0) {
//       addWaypoint(coordinate, 'start');
//     } else {
//       addWaypoint(coordinate, 'end');
//     }
//   };

//   // Add new waypoint
//   const addWaypoint = async (coordinate: LatLng, type: 'start' | 'end') => {
//     if (type === 'start' && waypoints.some(w => w.type === 'start')) {
//       Alert.alert('Error', 'Start point already exists');
//       return;
//     }

//     const newWaypoint: Waypoint = {
//       id: Date.now().toString(),
//       latitude: coordinate.latitude,
//       longitude: coordinate.longitude,
//       title: type === 'start' ? 'Start Point' : 'End Point',
//       type,
//       order: waypoints.length,
//     };

//     const newWaypoints = normalizeWaypoints([...waypoints, newWaypoint]);
//     setWaypoints(newWaypoints);

//     if (newWaypoints.length >= 2) {
//       await calculateAllRoutes(newWaypoints);
//     }
//   };

//   // Move marker
//   const deleteWaypoint = async (id: string) => {
//     const newWaypoints = waypoints.filter(w => w.id !== id);
//     if (newWaypoints.length === 0) {
//       setWaypoints([]);
//       setSegments([]);
//       setTotalDistance(0);
//       setTotalDuration(0);
//       return;
//     }

//     const normalizedWaypoints = normalizeWaypoints(newWaypoints);
//     setWaypoints(normalizedWaypoints);

//     if (normalizedWaypoints.length >= 2) {
//       await calculateAllRoutes(normalizedWaypoints);
//     } else {
//       setSegments([]);
//     }
//   };

//   const handleMarkerPress = async (waypoint: Waypoint) => {
//     const newWaypoints = waypoints.filter(w => w.id !== waypoint.id);
//     if (newWaypoints.length === 0) {
//       setWaypoints([]);
//       setSegments([]);
//       setTotalDistance(0);
//       setTotalDuration(0);
//       return;
//     }

//     const normalizedWaypoints = normalizeWaypoints(newWaypoints);
//     setWaypoints(normalizedWaypoints);

//     if (normalizedWaypoints.length >= 2) {
//       await calculateAllRoutes(normalizedWaypoints);
//     } else {
//       setSegments([]);
//     }
//   };

//   useEffect(() => {
//     if (!planId) return;

//     const loadPlanById = async () => {
//       const db = await getDatabase();
//       const plan = (db.collections.plans ?? []).find((item: any) => item.id === planId);
//       if (plan) {
//         const normalizedWaypoints = normalizeWaypoints(plan.waypoints || []);
//         setCurrentPlanId(plan.id);
//         setSaveTitle(plan.name ?? '');
//         setSaveDescription(plan.description ?? '');
//         setWaypoints(normalizedWaypoints);
//         setSegments(plan.segments ?? []);
//         setTotalDistance(plan.totalDistance || 0);
//         setTotalDuration(plan.totalDuration || 0);
//         setShowSavedModal(false);

//         if (normalizedWaypoints.length > 0 && cameraRef.current && mapLoaded) {
//           const coordinates = normalizedWaypoints.map((w: Waypoint) => [w.longitude, w.latitude] as [number, number]);
//           const bounds = getBoundsFromCoordinates(coordinates);
//           cameraRef.current.fitBounds(bounds, { padding: { top: 50, right: 50, bottom: 50, left: 50 }, duration: 300 });
//         }

//         const ownerId = plan.createdById ?? plan.userId ?? null;
//         if (ownerId) {
//           setPlanOwnerId(ownerId);
//         }

//         if ((!plan.segments || plan.segments.length === 0) && normalizedWaypoints.length >= 2) {
//           await calculateAllRoutes(normalizedWaypoints);
//         }
//       }
//     };

//     void loadPlanById();
//   }, [planId, calculateAllRoutes, mapLoaded]);

//   // Clear all waypoints
//   const clearAllWaypoints = () => {
//     Alert.alert(
//       'Clear Route',
//       'Are you sure you want to clear all waypoints?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Clear',
//           style: 'destructive',
//           onPress: () => {
//             setWaypoints([]);
//             setSegments([]);
//             setTotalDistance(0);
//             setTotalDuration(0);
//           }
//         }
//       ]
//     );
//   };

//   const startRide = async () => {
//     if (waypoints.length < 2) {
//       Alert.alert('Error', 'Please add at least start and end points to ride.');
//       return;
//     }

//     let routeSegments = segments;
//     if (routeSegments.length < 1) {
//       routeSegments = await calculateAllRoutes(waypoints);
//     }

//     const routeCoordinates: LatLng[] = [];
//     routeSegments.forEach((segment) => {
//       segment.polyline.forEach((point) => {
//         const lastPoint = routeCoordinates[routeCoordinates.length - 1];
//         if (!lastPoint || lastPoint.latitude !== point.latitude || lastPoint.longitude !== point.longitude) {
//           routeCoordinates.push(point);
//         }
//       });
//     });

//     if (routeCoordinates.length < 2) {
//       Alert.alert('Error', 'Unable to load route for riding.');
//       return;
//     }

//     setRouteDraft({
//       locations: routeCoordinates,
//       totalDistance,
//       totalDuration,
//       waypoints,
//       segments: routeSegments,
//     });

//     router.push('/ride/rides');
//   };

//   const saveCurrentRoute = async (title: string, description: string) => {
//     const routeData = {
//       id: currentPlanId ?? Date.now().toString(),
//       name: title,
//       description,
//       waypoints,
//       segments,
//       osrmResponses: segments.map((segment) => segment.osrmRoute).filter(Boolean),
//       totalDistance,
//       totalDuration,
//       createdAt: currentPlanId ? undefined : new Date().toISOString(),
//     } as any;

//     try {
//       const db = await getDatabase();
//       const collections = db.collections as any;
//       const existingIndex = (collections.plans ?? []).findIndex((plan: any) => plan.id === routeData.id);
//       if (existingIndex !== -1) {
//         const existing = collections.plans[existingIndex];
//         collections.plans[existingIndex] = {
//           ...existing,
//           ...routeData,
//           createdAt: existing.createdAt ?? new Date().toISOString(),
//         };
//       } else {
//         collections.plans = [...(collections.plans ?? []), { ...routeData, createdAt: new Date().toISOString() }];
//       }
//       await saveDatabase(db);
//       setSavedRoutes(collections.plans);
//       setCurrentPlanId(routeData.id);
//       setSaveModalVisible(false);
//       Alert.alert('Success', 'Route saved successfully!');
//     } catch (error) {
//       console.error('Error saving route:', error);
//       Alert.alert('Error', 'Failed to save route');
//     }
//   };

//   const openSaveModal = () => {
//     if (waypoints.length < 2) {
//       Alert.alert('Error', 'Please add at least start and end points');
//       return;
//     }
//     if (!currentPlanId) {
//       setSaveTitle('');
//       setSaveDescription('');
//     }
//     setSaveModalVisible(true);
//   };

//   const handleSaveRoute = async () => {
//     if (!saveTitle.trim() || !saveDescription.trim()) {
//       Alert.alert('Error', 'Please enter a title and description');
//       return;
//     }
//     await saveCurrentRoute(saveTitle.trim(), saveDescription.trim());
//   };

//   const loadSavedRoutes = async () => {
//     try {
//       const db = await getDatabase();
//       const collections = db.collections as any;
//       setSavedRoutes(collections.plans ?? []);
//     } catch (error) {
//       console.error('Error loading routes:', error);
//     }
//   };

//   const loadRoute = async (route: any) => {
//     const normalizedWaypoints = normalizeWaypoints(route.waypoints || []);
//     setCurrentPlanId(route.id);
//     setSaveTitle(route.name ?? '');
//     setSaveDescription(route.description ?? '');
//     setWaypoints(normalizedWaypoints);
//     setSegments(route.segments ?? []);
//     setTotalDistance(route.totalDistance);
//     setTotalDuration(route.totalDuration);
//     setShowSavedModal(false);

//     if (normalizedWaypoints.length > 0 && cameraRef.current && mapLoaded && mapLoaded) {
//       const coordinates = normalizedWaypoints.map((w: Waypoint) => [w.longitude, w.latitude] as [number, number]);
//       const bounds = getBoundsFromCoordinates(coordinates);
//       cameraRef.current.fitBounds(bounds, { padding: { top: 50, right: 50, bottom: 50, left: 50 }, duration: 300 });
//     }

//     if (!route.segments || route.segments.length === 0) {
//       await calculateAllRoutes(normalizedWaypoints);
//     }

//     Alert.alert('Success', `Loaded ${route.name}`);
//   };

//   useEffect(() => {
//     if (!mapLoaded || !cameraRef.current || waypoints.length === 0) return;

//     const coordinates = waypoints.map((w) => [w.longitude, w.latitude] as [number, number]);
//     const bounds = getBoundsFromCoordinates(coordinates);
//     cameraRef.current.fitBounds(bounds, {
//       padding: { top: 50, right: 50, bottom: 50, left: 50 },
//       duration: 300,
//     });
//   }, [mapLoaded, waypoints]);

//   const deleteSavedRoute = async (routeId: string) => {
//     try {
//       const db = await getDatabase();
//       const collections = db.collections as any;
//       collections.plans = (collections.plans ?? []).filter((r: any) => r.id !== routeId);
//       await saveDatabase(db);
//       setSavedRoutes(collections.plans);
//     } catch (error) {
//       console.error('Error deleting route:', error);
//     }
//   };

//   // Edit waypoint title
//   const editWaypointTitle = (waypoint: Waypoint) => {
//     setEditingPoint(waypoint);
//     setTempTitle(waypoint.title);
//     setModalVisible(true);
//   };

//   const saveWaypointTitle = () => {
//     if (!editingPoint || !tempTitle.trim()) return;

//     const updatedWaypoints = waypoints.map(wp =>
//       wp.id === editingPoint.id ? { ...wp, title: tempTitle } : wp
//     );
//     setWaypoints(updatedWaypoints);
//     setModalVisible(false);
//     setEditingPoint(null);
//     setTempTitle('');
//   };

//   const markerColors: Record<Waypoint['type'], string> = {
//     start: '#4CAF50',
//     stop: '#FFD700',
//     end: '#f44336',
//   };

//   // Get marker color
//   const getMarkerColor = (type: Waypoint['type']) => markerColors[type] ?? '#FFD700';

//   // Format duration
//   const formatDuration = (minutes: number) => {
//     const hours = Math.floor(minutes / 60);
//     const mins = Math.round(minutes % 60);
//     if (hours > 0) {
//       return `${hours}h ${mins}m`;
//     }
//     return `${mins}m`;
//   };

//   return (
//     <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
//       <View style={[styles.header, { backgroundColor: colors.card }]}>
//         <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
//           <MaterialIcons name="arrow-back" size={24} color={colors.text} />
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, { color: colors.text }]}>Route Planner</Text>
//         <View style={styles.headerPlaceholder} />
//       </View>
//       <View style={[styles.actionButtonsRow, { backgroundColor: colors.card }]}>
//         <TouchableOpacity onPress={startRide} style={styles.headerButton}>
//           <MaterialIcons name="directions-bike" size={24} color={colors.text} />
//           <Text style={[styles.headerButtonText, { color: colors.text }]}>Ride</Text>
//         </TouchableOpacity>
//         {isOwnData ? ( 
//           <> 
//             <TouchableOpacity onPress={clearAllWaypoints} style={styles.headerButton}> 
//               <MaterialIcons name="close" size={24} color={colors.text} /> 
//               <Text style={[styles.headerButtonText, { color: colors.text }]}>Clear</Text> 
//             </TouchableOpacity> 
//             <TouchableOpacity onPress={openSaveModal} style={styles.headerButton}> 
//               <MaterialIcons name="save" size={24} color={colors.text} /> 
//               <Text style={[styles.headerButtonText, { color: colors.text }]}>Save</Text> 
//             </TouchableOpacity> 
//           </> 
//         ) : null} 
//       </View>
//       {/* Stats Bar */}
//       {waypoints.length > 0 && (
//         <View style={styles.statsBar}>
//           <View style={styles.statItem}>
//             <MaterialIcons name="location-on" size={16} color="#fff" />
//             <Text style={styles.statText}>{waypoints.length} points</Text>
//           </View>
//           <View style={styles.statItem}>
//             <MaterialIcons name="straighten" size={16} color="#fff" />
//             <Text style={styles.statText}>{totalDistance.toFixed(1)} km</Text>
//           </View>
//           <View style={styles.statItem}>
//             <MaterialIcons name="schedule" size={16} color="#fff" />
//             <Text style={styles.statText}>{formatDuration(totalDuration)}</Text>
//           </View>
//         </View>
//       )}

//       {/* Map View */}
//       <View style={styles.mapContainer}>
//         <MapLibreGL.Map
//           ref={mapRef}
//           style={styles.map}
//           mapStyle={MAP_STYLE_URL}
//           onPress={handleMapPress}
//           onDidFinishLoadingMap={() => setMapLoaded(true)}
//         >
//           <MapLibreGL.Camera
//             ref={cameraRef}
//             zoom={mapZoom}
//             center={mapCenter}
//           />
          
//           <MapLibreGL.UserLocation />

//           {/* Route Polylines */}
//           {routeGeoJSON && (
//             <MapLibreGL.GeoJSONSource id="routeSource" data={routeGeoJSON}>
//               <MapLibreGL.Layer
//                 id="routeLine"
//                 type="line"
//                 paint={{
//                   "line-color": '#FF9800',
//                   "line-width": 5,
//                 }}
//                 layout={{
//                   "line-cap": 'round',
//                   "line-join": 'round',
//                 }}
//               />
//             </MapLibreGL.GeoJSONSource>
//           )}

//           {/* Waypoint Markers */}
//           {waypoints.map((waypoint) => (
//             <MapLibreGL.Marker
//               key={waypoint.id}
//               id={waypoint.id}
//               lngLat={[waypoint.longitude, waypoint.latitude]}
//               onPress={() => handleMarkerPress(waypoint)}
//             >
//               <View style={{ flex: 0, alignSelf: 'flex-start', overflow: 'visible' }}>
//                 <View style={[styles.customMarker, { backgroundColor: getMarkerColor(waypoint.type) }]}>
//                   <Text style={styles.markerText}>
//                     {waypoint.type === 'start' ? 'S' : waypoint.type === 'end' ? 'E' : (waypoint.order + 1).toString()}
//                   </Text>
//                 </View>
                
//                 <MapLibreGL.Callout>
//                   <View style={styles.callout}>
//                   <Text style={styles.calloutTitle}>{waypoint.title}</Text>
//                   <Text style={styles.calloutType}>{waypoint.type.toUpperCase()}</Text>
//                   {waypoint.type === 'stop' && (
//                     <TouchableOpacity
//                       onPress={() => deleteWaypoint(waypoint.id)}
//                       style={styles.calloutDelete}
//                     >
//                       <Text style={styles.calloutDeleteText}>Delete</Text>
//                     </TouchableOpacity>
//                   )}
//                   <TouchableOpacity
//                     onPress={() => editWaypointTitle(waypoint)}
//                     style={styles.calloutEdit}
//                   >
//                     <Text style={styles.calloutEditText}>Edit Title</Text>
//                   </TouchableOpacity>
//                 </View>
//               </MapLibreGL.Callout>
//             </View>
//             </MapLibreGL.Marker>
//           ))}
//         </MapLibreGL.Map>

//         {/* Loading Indicator */}
//         {isLoading && (
//           <View style={styles.loadingOverlay}>
//             <ActivityIndicator size="large" color="#FF9800" />
//             <Text style={styles.loadingText}>Calculating route...</Text>
//           </View>
//         )}

//         {/* Instructions */}
//         {waypoints.length === 0 && (
//           <View style={styles.instructions}>
//             <MaterialIcons name="touch-app" size={32} color="#fff" />
//             <Text style={styles.instructionsText}>Tap on map to set start point</Text>
//           </View>
//         )}
//       </View>

//       {/* Edit Title Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Edit Point Title</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter title"
//               value={tempTitle}
//               onChangeText={setTempTitle}
//               autoFocus
//             />
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.cancelModalButton]}
//                 onPress={() => setModalVisible(false)}
//               >
//                 <Text style={styles.cancelModalText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.saveModalButton]}
//                 onPress={saveWaypointTitle}
//               >
//                 <Text style={styles.saveModalText}>Save</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Save Route Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={saveModalVisible}
//         onRequestClose={() => setSaveModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Save Route</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Title"
//               value={saveTitle}
//               onChangeText={setSaveTitle}
//               autoFocus
//             />
//             <TextInput
//               style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
//               placeholder="Description"
//               value={saveDescription}
//               onChangeText={setSaveDescription}
//               multiline
//             />
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.cancelModalButton]}
//                 onPress={() => setSaveModalVisible(false)}
//               >
//                 <Text style={styles.cancelModalText}>Cancel</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.saveModalButton]}
//                 onPress={handleSaveRoute}
//               >
//                 <Text style={styles.saveModalText}>Save</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Saved Routes Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={showSavedModal}
//         onRequestClose={() => setShowSavedModal(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={[styles.modalContent, styles.savedModalContent]}>
//             <Text style={styles.modalTitle}>Saved Routes</Text>
//             <ScrollView style={styles.savedRoutesList}>
//               {savedRoutes.length === 0 ? (
//                 <Text style={styles.emptyText}>No saved routes yet</Text>
//               ) : (
//                 savedRoutes.map((route) => (
//                   <View key={route.id} style={styles.savedRouteItem}>
//                     <TouchableOpacity
//                       style={styles.savedRouteInfo}
//                       onPress={() => loadRoute(route)}
//                     >
//                       <Text style={styles.savedRouteName}>{route.name}</Text>
//                       <Text style={styles.savedRouteDetails}>
//                         {route.waypoints.length} points • {route.totalDistance.toFixed(1)} km • {formatDuration(route.totalDuration)}
//                       </Text>
//                       <Text style={styles.savedRouteDate}>
//                         {new Date(route.createdAt).toLocaleDateString()}
//                       </Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       onPress={() => deleteSavedRoute(route.id)}
//                       style={styles.deleteSavedButton}
//                     >
//                       <MaterialIcons name="delete" size={24} color="#f44336" />
//                     </TouchableOpacity>
//                   </View>
//                 ))
//               )}
//             </ScrollView>
//             <TouchableOpacity
//               style={[styles.modalButton, styles.closeModalButton]}
//               onPress={() => setShowSavedModal(false)}
//             >
//               <Text style={styles.closeModalText}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   headerLeft: {
//     flex: 1,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerRight: {
//     flexDirection: 'row',
//     gap: 16,
//   },
//   headerPlaceholder: {
//     width: 32,
//   },
//   actionButtonsRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 16,
//     paddingHorizontal: 16,
//     paddingBottom: 12,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     flex: 1,
//     textAlign: 'center',
//   },
//   headerButton: {
//     padding: 4,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   headerButtonText: {
//     fontSize: 13,
//     fontWeight: '600',
//   },
//   statsBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     backgroundColor: 'rgba(0,0,0,0.85)',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//   },
//   statItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   statText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   mapContainer: {
//     flex: 1,
//     position: 'relative',
//   },
//   map: {
//     flex: 1,
//   },
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginTop: 12,
//   },
//   instructions: {
//     position: 'absolute',
//     bottom: 100,
//     alignSelf: 'center',
//     backgroundColor: 'rgba(0,0,0,0.85)',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 25,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   instructionsText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   customMarker: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: '#fff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 2,
//     elevation: 3,
//   },
//   markerText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
//   callout: {
//     padding: 8,
//     minWidth: 120,
//     alignItems: 'center',
//   },
//   calloutTitle: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   calloutType: {
//     fontSize: 11,
//     color: '#666',
//     marginBottom: 8,
//   },
//   calloutDelete: {
//     backgroundColor: '#f44336',
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 4,
//     marginBottom: 4,
//   },
//   calloutDeleteText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   calloutEdit: {
//     backgroundColor: '#2196F3',
//     paddingHorizontal: 12,
//     paddingVertical: 4,
//     borderRadius: 4,
//   },
//   calloutEditText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: 'bold',
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     margin: 20,
//     borderRadius: 12,
//     padding: 20,
//   },
//   savedModalContent: {
//     maxHeight: '80%',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 16,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//     fontSize: 16,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 12,
//   },
//   modalButton: {
//     flex: 1,
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   cancelModalButton: {
//     backgroundColor: '#f5f5f5',
//   },
//   saveModalButton: {
//     backgroundColor: '#2196F3',
//   },
//   cancelModalText: {
//     color: '#666',
//     fontWeight: 'bold',
//   },
//   saveModalText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   closeModalButton: {
//     backgroundColor: '#2196F3',
//     marginTop: 16,
//   },
//   closeModalText: {
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   savedRoutesList: {
//     maxHeight: 400,
//   },
//   savedRouteItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   savedRouteInfo: {
//     flex: 1,
//   },
//   savedRouteName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   savedRouteDetails: {
//     fontSize: 12,
//     color: '#666',
//     marginBottom: 2,
//   },
//   savedRouteDate: {
//     fontSize: 10,
//     color: '#999',
//   },
//   deleteSavedButton: {
//     padding: 8,
//   },
//   emptyText: {
//     textAlign: 'center',
//     color: '#999',
//     padding: 20,
//   },
// });

// export default RoutePlanner;