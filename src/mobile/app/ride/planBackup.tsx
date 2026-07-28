import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import MapView, { Polyline, Marker, Callout, Region, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { container, RouteServiceToken, type RouteService } from '@/services';
import { setRouteDraft } from '@/services/routeTransfer';
import { useAuthContext } from '@/hooks/use-auth-context';
import { useThemeContext } from '@/hooks/use-theme-context';
import { MaterialIcons } from '@expo/vector-icons';
import Route from '@/models/route';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  type: 'start' | 'stop' | 'end';
  order: number;
}


const RoutePlanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const planId = Array.isArray(params.id) ? params.id[0] : params.id;
  const viewedUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const { getAuthUser } = useAuthContext();
  const authUser = getAuthUser();
  const currentUserId = authUser?.id;
  const isOwnData = !viewedUserId || viewedUserId === currentUserId;
  const { colors } = useThemeContext();
  const routeService = useMemo(() => container.resolve<RouteService>(RouteServiceToken), []);

  const mapRef = useRef<MapView>(null);

  // Main state
  const [route, setRoute] = useState<Route>({ osrmResponseJson: '' });
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  // UI state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPoint, setEditingPoint] = useState<Waypoint | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  // Helper: Parse OSRM response from string
  const parseOsrmResponse = useCallback((jsonString: string) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Failed to parse OSRM response:', error);
      return null;
    }
  }, []);

  // Helper: Calculate route from waypoints (single API call)
  const calculateRouteFromWaypoints = useCallback(async (waypointList: Waypoint[]): Promise<string | null> => {
    if (waypointList.length < 2) return null;

    const sortedWaypoints = [...waypointList].sort((a, b) => a.order - b.order);
    const coordinates = sortedWaypoints.map(wp => `${wp.longitude},${wp.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== 'Ok') {
        Alert.alert('Error', 'Failed to calculate route');
        return null;
      }

      return JSON.stringify(data);
    } catch (error) {
      console.error('Error calculating route:', error);
      Alert.alert('Error', 'Network error while calculating route');
      return null;
    }
  }, []);

  // Helper: Extract waypoints from OSRM response
  const extractWaypointsFromOsrm = useCallback((osrmResponseJson: string): Waypoint[] => {
    const osrmData = parseOsrmResponse(osrmResponseJson);

    if (!osrmData || osrmData.code !== 'Ok' || !osrmData.waypoints) {
      return [];
    }

    return osrmData.waypoints.map((wp: any, index: number) => {
      let type: Waypoint['type'] = 'stop';
      if (index === 0) type = 'start';
      else if (index === osrmData.waypoints.length - 1) type = 'end';

      return {
        id: `wp_${index}`,
        latitude: wp.location[1],
        longitude: wp.location[0],
        title: wp.name || (type === 'start' ? 'Start Point' : type === 'end' ? 'End Point' : `Stop ${index}`),
        type: type,
        order: index,
      };
    });
  }, [parseOsrmResponse]);

  // Normalize waypoint types and titles
  const normalizeWaypoints = useCallback((waypointList: Waypoint[]): Waypoint[] => {
    const orderedList = [...waypointList].sort((a, b) => a.order - b.order);
    if (orderedList.length === 0) return [];

    return orderedList.map((wp, idx) => {
      const type: Waypoint['type'] = idx === 0 ? 'start' : idx === orderedList.length - 1 ? 'end' : 'stop';
      let title = wp.title;

      if (wp.title === 'Start Point' && type !== 'start') {
        title = type === 'end' ? 'End Point' : `Stop ${idx}`;
      } else if (wp.title === 'End Point' && type !== 'end') {
        title = `Stop ${idx}`;
      } else if (wp.title?.startsWith('Stop ') && type === 'end') {
        title = 'End Point';
      } else if ((wp.title?.startsWith('Stop ') || wp.title === 'End Point') && type === 'start') {
        title = 'Start Point';
      }

      return { ...wp, type, order: idx, title };
    });
  }, []);

  // Draw route on map from OSRM response
  const drawOnMap = useCallback((osrmResponseJson: string, waypointList: Waypoint[]) => {
    const osrmData = parseOsrmResponse(osrmResponseJson);

    if (!osrmData || osrmData.code !== 'Ok' || !osrmData.routes?.[0]) {
      return;
    }

    // Fit map to show all waypoints
    if (mapRef.current && waypointList.length > 0) {
      const coordinates = waypointList.map(w => ({
        latitude: w.latitude,
        longitude: w.longitude,
      }));
      const map = mapRef.current as any;
      map.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
        duration: 300,
      });
    }
  }, [parseOsrmResponse]);

  // Core function: Update waypoints and recalculate route (ONLY called when waypoints change)
  const updateWaypointsAndRoute = useCallback(async (newWaypoints: Waypoint[], shouldSaveToRoute = true) => {
    const normalizedWaypoints = normalizeWaypoints(newWaypoints);
    setWaypoints(normalizedWaypoints);

    if (normalizedWaypoints.length >= 2) {
      setIsLoading(true);
      const osrmJson = await calculateRouteFromWaypoints(normalizedWaypoints);
      setIsLoading(false);

      if (osrmJson) {
        const osrmData = parseOsrmResponse(osrmJson);
        if (shouldSaveToRoute) {
          setRoute(prev => ({
            ...prev,
            osrmResponseJson: osrmJson,
            distance: osrmData?.routes?.[0]?.distance,
            duration: osrmData?.routes?.[0]?.duration,
          }));
        }
        drawOnMap(osrmJson, normalizedWaypoints);
      }
    } else {
      // Clear route if less than 2 waypoints
      setRoute(prev => ({ ...prev, osrmResponseJson: '', distance: undefined, duration: undefined }));
    }
  }, [normalizeWaypoints, calculateRouteFromWaypoints, parseOsrmResponse, drawOnMap]);

  // Initialize map
  useEffect(() => {
    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const initialRegion: Region = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setMapRegion(initialRegion);
          mapRef.current?.animateToRegion(initialRegion, 300);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };
    init();
  }, []);

  // Load plan by ID from database
  useEffect(() => {
    console.log('Loading plan with ID:', planId);
    if (!planId) return;

    const loadPlan = async () => {
      try {
        const response = await routeService.getRouteById(planId);
        console.log('Route service response:', response.status);
        if (!response.ok) return;

        const responseJson = await response.json();
        console.log('Route service response JSON:', responseJson.success);
        if (!responseJson.success) return;

        const loadedRoute: Route = {
          id: responseJson.data.id,
          name: responseJson.data.name,
          description: responseJson.data.description,
          osrmResponseJson: responseJson.data.osrmResponseJson,
          distance: responseJson.data.distance,
          duration: responseJson.data.duration,
          createdById: responseJson.data.createdById,
        };

        setRoute(loadedRoute);
        setSaveTitle(loadedRoute.name || '');
        setSaveDescription(loadedRoute.description || '');

        // Extract waypoints from stored OSRM data
        const extractedWaypoints = extractWaypointsFromOsrm(loadedRoute.osrmResponseJson ?? '');
        setWaypoints(extractedWaypoints);

        // Draw on map
        if (extractedWaypoints.length >= 2) {
          drawOnMap(loadedRoute.osrmResponseJson ?? '', extractedWaypoints);
        }
      } catch (error) {
        console.error('Error loading plan:', error);
      }
    };

    loadPlan();
  }, [planId, routeService, extractWaypointsFromOsrm, drawOnMap]);

  // Add new waypoint
  const addWaypoint = async (coordinate: LatLng, type: 'start' | 'end') => {
    if (type === 'start' && waypoints.some(w => w.type === 'start')) {
      Alert.alert('Error', 'Start point already exists');
      return;
    }

    const newWaypoint: Waypoint = {
      id: Date.now().toString(),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      title: type === 'start' ? 'Start Point' : 'End Point',
      type,
      order: waypoints.length,
    };

    await updateWaypointsAndRoute([...waypoints, newWaypoint]);
  };

  // Handle long press on map
  const handleLongPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    if (waypoints.length === 0) {
      addWaypoint(coordinate, 'start');
    } else {
      addWaypoint(coordinate, 'end');
    }
  };

  // Move marker
  const handleMarkerDragEnd = async (id: string, coordinate: LatLng) => {
    const updatedWaypoints = waypoints.map(wp =>
      wp.id === id ? { ...wp, latitude: coordinate.latitude, longitude: coordinate.longitude } : wp
    );
    await updateWaypointsAndRoute(updatedWaypoints);
  };

  // Delete waypoint
  const deleteWaypoint = async (id: string) => {
    console.log('Deleting waypoint with ID:', id);
    const newWaypoints = waypoints.filter(w => w.id !== id);
    await updateWaypointsAndRoute(newWaypoints);
  };

  // Clear all waypoints
  const clearAllWaypoints = () => {
    Alert.alert('Clear Route', 'Clear all waypoints?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => updateWaypointsAndRoute([]) }
    ]);
  };

  // Start ride navigation - uses stored route data, no recalculation
  const startRide = () => {
    if (waypoints.length < 2) {
      Alert.alert('Error', 'Please add start and end points');
      return;
    }

    if (!route.osrmResponseJson) {
      Alert.alert('Error', 'Route not calculated yet. Please wait.');
      return;
    }

    const osrmData = parseOsrmResponse(route.osrmResponseJson);
    if (!osrmData?.routes?.[0]) {
      Alert.alert('Error', 'Unable to load route');
      return;
    }

    // Extract all coordinates for the ride
    const routeCoordinates: LatLng[] = [];
    const routeData = osrmData.routes[0];

    if (routeData.geometry?.coordinates) {
      routeData.geometry.coordinates.forEach((coord: [number, number]) => {
        routeCoordinates.push({ latitude: coord[1], longitude: coord[0] });
      });
    }

    setRouteDraft({
      locations: routeCoordinates,
      totalDistance: route.distance || 0,
      totalDuration: route.duration || 0,
      waypoints,
    });

    router.push('/ride/rideRecorder');
  };

  // Save current route - uses stored route data, no recalculation
  const saveCurrentRoute = async () => {
    if (waypoints.length < 2) {
      Alert.alert('Error', 'Please add start and end points');
      return;
    }

    if (!route.osrmResponseJson) {
      Alert.alert('Error', 'Route not calculated yet. Please wait.');
      return;
    }

    if (!saveTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setIsLoading(true);

    try {
      const routeData: Route = {
        ...route,
        name: saveTitle.trim(),
        description: saveDescription.trim(),
        osrmResponseJson: route.osrmResponseJson,
        distance: route.distance,
        duration: route.duration,
        createdById: String(currentUserId),
      };

      const apiResponse = route.id
        ? await routeService.updateRoute(route.id, routeData)
        : await routeService.createRoute(routeData);

      if (!apiResponse.ok) {
        Alert.alert('Error', 'Failed to save route');
        return;
      }

      const responseBody = await apiResponse.json();
      const savedRoute = responseBody?.Data ?? responseBody?.data ?? responseBody;
      if (!savedRoute) {
        Alert.alert('Error', 'Failed to save route');
        return;
      }

      setRoute(prev => ({ ...prev, ...savedRoute, name: saveTitle, description: saveDescription }));
      setSaveModalVisible(false);
      Alert.alert('Success', `Route "${saveTitle}" saved!`);
    } catch (error) {
      console.error('Error saving route:', error);
      Alert.alert('Error', 'Failed to save route');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit waypoint title
  const editWaypointTitle = (waypoint: Waypoint) => {
    setEditingPoint(waypoint);
    setTempTitle(waypoint.title);
    setModalVisible(true);
  };

  const saveWaypointTitle = () => {
    if (!editingPoint || !tempTitle.trim()) return;
    const updatedWaypoints = waypoints.map(wp =>
      wp.id === editingPoint.id ? { ...wp, title: tempTitle } : wp
    );
    updateWaypointsAndRoute(updatedWaypoints, false); // Don't save to route, just update waypoints
    setModalVisible(false);
    setEditingPoint(null);
    setTempTitle('');
  };

  const getMarkerColor = (type: Waypoint['type']) => {
    const colors = { start: '#4CAF50', stop: '#FFD700', end: '#f44336' };
    return colors[type];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0m';
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Render map polylines from stored route data
  const renderPolylines = () => {
    if (!route.osrmResponseJson || waypoints.length < 2) return null;

    const osrmData = parseOsrmResponse(route.osrmResponseJson);
    if (!osrmData?.routes?.[0]?.geometry?.coordinates) return null;

    const coordinates = osrmData.routes[0].geometry.coordinates.map((coord: [number, number]) => ({
      latitude: coord[1],
      longitude: coord[0],
    }));

    return <Polyline coordinates={coordinates} strokeColor="#FF9800" strokeWidth={4} />;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Route Planner</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionButtonsRow, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={startRide} style={styles.headerButton}>
            <MaterialIcons name="directions-bike" size={24} color={colors.text} />
            <Text style={[styles.headerButtonText, { color: colors.text }]}>Ride</Text>
          </TouchableOpacity>
          {isOwnData && (
            <>
              <TouchableOpacity onPress={clearAllWaypoints} style={styles.headerButton}>
                <MaterialIcons name="close" size={24} color={colors.text} />
                <Text style={[styles.headerButtonText, { color: colors.text }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSaveModalVisible(true)} style={styles.headerButton}>
                <MaterialIcons name="save" size={24} color={colors.text} />
                <Text style={[styles.headerButtonText, { color: colors.text }]}>Save</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats Bar */}
        {waypoints.length > 0 && (
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <MaterialIcons name="location-on" size={16} color="#fff" />
              <Text style={styles.statText}>{waypoints.length} points</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="straighten" size={16} color="#fff" />
              <Text style={styles.statText}>{((route.distance || 0) / 1000).toFixed(1)} km</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={16} color="#fff" />
              <Text style={styles.statText}>{formatDuration(route.duration)}</Text>
            </View>
          </View>
        )}

        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion || undefined}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onLongPress={handleLongPress}
            onPress={handleLongPress}
            onRegionChangeComplete={setMapRegion}
          >
            {renderPolylines()}

            {waypoints.map((waypoint) => (
              <Marker
                key={waypoint.id}
                coordinate={{ latitude: waypoint.latitude, longitude: waypoint.longitude }}
                pinColor={getMarkerColor(waypoint.type)}
                draggable
                onDragEnd={(e) => handleMarkerDragEnd(waypoint.id, e.nativeEvent.coordinate)}
                title={waypoint.title}
              >
                {/* <Callout>
                <View style={styles.callout}>
                  <TouchableOpacity  onPress={() => editWaypointTitle(waypoint)}>
                    <Text style={styles.calloutTitle}>{waypoint.title}</Text>
                    <Text style={styles.calloutType}>{waypoint.type.toUpperCase()}</Text>
                  </TouchableOpacity>
                  
                  {waypoint.type === 'stop' && (
                    <TouchableOpacity onPress={() => deleteWaypoint(waypoint.id)} style={styles.calloutDelete}>
                      <Text style={styles.calloutDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Callout> */}
              </Marker>
            ))}
          </MapView>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FF9800" />
              <Text style={styles.loadingText}>Calculating route...</Text>
            </View>
          )}

          {waypoints.length === 0 && (
            <View style={styles.instructions}>
              <MaterialIcons name="touch-app" size={32} color="#fff" />
              <Text style={styles.instructionsText}>Long press on map to set start point</Text>
            </View>
          )}
        </View>

        {/* Edit Title Modal */}
        <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Point Title</Text>
              <TextInput style={styles.input} placeholder="Enter title" value={tempTitle} onChangeText={setTempTitle} autoFocus />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelModalButton]} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveModalButton]} onPress={saveWaypointTitle}>
                  <Text style={styles.saveModalText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Save Route Modal */}
        <Modal animationType="slide" transparent visible={saveModalVisible} onRequestClose={() => setSaveModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Save Route</Text>
              <TextInput style={styles.input} placeholder="Title *" value={saveTitle} onChangeText={setSaveTitle} autoFocus />
              <TextInput
                style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
                placeholder="Description (optional)"
                value={saveDescription}
                onChangeText={setSaveDescription}
                multiline
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelModalButton]} onPress={() => setSaveModalVisible(false)}>
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveModalButton]} onPress={saveCurrentRoute}>
                  <Text style={styles.saveModalText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 8 },
  headerPlaceholder: { width: 32 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingBottom: 12 },
  headerButton: { padding: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerButtonText: { fontSize: 13, fontWeight: '600' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(0,0,0,0.85)', paddingVertical: 8, paddingHorizontal: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  instructions: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, flexDirection: 'row', alignItems: 'center', gap: 12 },
  instructionsText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  callout: { padding: 8, minWidth: 120, alignItems: 'center' },
  calloutTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  calloutType: { fontSize: 11, color: '#666', marginBottom: 8 },
  calloutDelete: { backgroundColor: '#f44336', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  calloutDeleteText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', margin: 20, borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelModalButton: { backgroundColor: '#f5f5f5' },
  saveModalButton: { backgroundColor: '#2196F3' },
  cancelModalText: { color: '#666', fontWeight: 'bold' },
  saveModalText: { color: '#fff', fontWeight: 'bold' },
});

export default RoutePlanner;