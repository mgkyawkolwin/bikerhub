import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import polyline from '@mapbox/polyline';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { PlanServiceToken } from '@/services/planService';
import { RouteServiceToken } from '@/services/routeService';
import type { PlanService } from '@/services/planService';
import type { RouteService } from '@/services/routeService';

interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  type: 'start' | 'stop' | 'end';
  order: number;
}

export default function PlanCreateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeContext();
  const planService = useMemo(() => container.resolve<PlanService>(PlanServiceToken), []);
  const routeService = useMemo(() => container.resolve<RouteService>(RouteServiceToken), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tripDateTime, setTripDateTime] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'title' | 'description' | 'tripDateTime', string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [routePoints, setRoutePoints] = useState<Waypoint[]>([]);
  const [routeResponseJson, setRouteResponseJson] = useState<any | null>(null);
  const [routeImageUrl, setRouteImageUrl] = useState<string | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalElevation, setTotalElevation] = useState(0);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  const mapRef = useRef<MapView>(null);

  const parseTripDate = (value: string): Date | null => {
    if (!value.trim()) return null;
    const normalized = value.trim().replace(' ', 'T');
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const normalizeWaypoints = useCallback((waypoints: Waypoint[]) => {
    const ordered = [...waypoints].sort((a, b) => a.order - b.order);
    return ordered.map((point, index) => {
      const type: Waypoint['type'] = index === 0 ? 'start' : index === ordered.length - 1 ? 'end' : 'stop';
      let title = point.title;
      if (type === 'start') title = 'Start Point';
      if (type === 'end') title = 'End Point';
      if (type === 'stop' && title.startsWith('Start Point')) title = `Stop ${index}`;
      if (type === 'stop' && title.startsWith('End Point')) title = `Stop ${index}`;
      return { ...point, order: index, type, title };
    });
  }, []);

  const calculateRouteFromWaypoints = useCallback(async (points: Waypoint[]) => {
    if (points.length < 2) return null;

    const ordered = normalizeWaypoints(points);
    const waypoints = ordered.map((wp) => ({ latitude: wp.latitude, longitude: wp.longitude }));

    try {
      const response = await routeService.calculateRoute(waypoints);
      const responseJson = await response.json().catch(() => null);
      const success = responseJson?.success ?? responseJson?.Success;
      const routeData = responseJson?.data ?? responseJson?.Data;

      if (!response.ok || !success || !routeData) {
        const message = responseJson?.message ?? responseJson?.Message ?? 'Unable to generate route on the map.';
        Alert.alert('Route error', message);
        return null;
      }

      return routeData;
    } catch (error) {
      console.error('Route API error:', error);
      Alert.alert('Route error', 'Unable to calculate route. Please try again.');
      return null;
    }
  }, [normalizeWaypoints, routeService]);

  const updateRoutePreview = useCallback(async (points: Waypoint[]) => {
    const normalized = normalizeWaypoints(points);
    setRoutePoints(normalized);

    const routeData = await calculateRouteFromWaypoints(normalized);

    if (!routeData) {
      setRouteResponseJson(null);
      setRouteImageUrl(null);
      setTotalDistance(0);
      setTotalDuration(0);
      setTotalElevation(0);
      return;
    }

    const geoCoords = routeData.routes?.[0]?.geometry?.coordinates?.map((coord: [number, number]) => ({
      latitude: coord[1],
      longitude: coord[0],
    })) ?? [];

    setRouteResponseJson(routeData);
    setTotalDistance(routeData.routes?.[0]?.distance ?? 0);
    setTotalDuration(routeData.routes?.[0]?.duration ?? 0);
    setTotalElevation(0);
    setMapRegion(
      geoCoords.length > 0
        ? {
            latitude: geoCoords[0].latitude,
            longitude: geoCoords[0].longitude,
            latitudeDelta: 0.2,
            longitudeDelta: 0.2,
          }
        : null,
    );
  }, [calculateRouteFromWaypoints, normalizeWaypoints]);

  const handleMapPress = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate as { latitude: number; longitude: number };
    const nextType = routePoints.length === 0 ? 'start' : routePoints.length === 1 ? 'end' : 'stop';
    const nextPoint: Waypoint = {
      id: Date.now().toString(),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      title: nextType === 'start' ? 'Start Point' : nextType === 'end' ? 'End Point' : `Stop ${routePoints.length}`,
      type: nextType,
      order: routePoints.length,
    };

    await updateRoutePreview([...routePoints, nextPoint]);
  };

  const handleMarkerDragEnd = async (id: string, coordinate: { latitude: number; longitude: number }) => {
    const updated = routePoints.map((point) =>
      point.id === id ? { ...point, latitude: coordinate.latitude, longitude: coordinate.longitude } : point,
    );
    await updateRoutePreview(updated);
  };

  const handleClearRoute = () => {
    Alert.alert('Clear route', 'Remove all points and route preview?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setRoutePoints([]);
          setRouteResponseJson(null);
          setRouteImageUrl(null);
          setTotalDistance(0);
          setTotalDuration(0);
          setTotalElevation(0);
        },
      },
    ]);
  };

  const fetchStaticMapUrl = useCallback(async (points: Waypoint[], routeData?: any) => {
    if (points.length === 0) return null;

    const waypoints = points.map((wp) => ({ latitude: wp.latitude, longitude: wp.longitude }));
    const geometry = routeData?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
    const encodedPolyline = geometry && geometry.length > 0
      ? polyline.encode(geometry.map(([longitude, latitude]) => [latitude, longitude]))
      : null;

    const response = await routeService.getStaticMapUrl({
      waypoints,
      encodedPolyline: encodedPolyline ?? undefined,
      width: 640,
      height: 320,
      scale: 2,
    });
    const responseJson = await response.json().catch(() => null);
    const success = responseJson?.success ?? responseJson?.Success;
    const url = responseJson?.data ?? responseJson?.Data;

    if (!response.ok || !success || !url) {
      const message = responseJson?.message ?? responseJson?.Message ?? 'Unable to generate map preview.';
      Alert.alert('Map error', message);
      return null;
    }

    return url as string;
  }, [routeService]);

  const formatDistance = (meters: number) => `${(meters / 1000).toFixed(1)} km`;
  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return '0m';
    const mins = Math.round(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remainder = mins % 60;
    return hours > 0 ? `${hours}h ${remainder}m` : `${remainder}m`;
  };

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (!title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (!tripDateTime.trim()) {
      nextErrors.tripDateTime = 'Trip date and time is required.';
    } else if (!parseTripDate(tripDateTime)) {
      nextErrors.tripDateTime = 'Enter date/time as YYYY-MM-DD HH:mm or ISO format.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    const parsedDate = parseTripDate(tripDateTime);
    if (!parsedDate) {
      setErrors((prev) => ({ ...prev, tripDateTime: 'Invalid date/time format.' }));
      return;
    }

    setIsSaving(true);

    try {
      const requestBody = {
        title: title.trim(),
        description: description.trim(),
        tripDateTimeUtc: parsedDate.toISOString(),
        distance: totalDistance,
        duration: totalDuration,
        elevation: totalElevation,
        locationsJson: JSON.stringify({ points: routePoints, route: routeResponseJson }),
      };

      const response = await planService.createPlan(requestBody as any);
      const responseJson = await response.json().catch(() => null);
      const success = responseJson?.success ?? responseJson?.Success;
      const data = responseJson?.data ?? responseJson?.Data;

      if (!response.ok || !success || !data) {
        const message = responseJson?.message ?? responseJson?.Message ?? 'Unable to create plan.';
        throw new Error(message);
      }

      router.replace('/plan/list');
    } catch (error) {
      console.error('Plan creation failed:', error);
      Alert.alert('Create Plan', error instanceof Error ? error.message : 'Unable to create plan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}> 
        <View style={[styles.fieldGroup, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Title *</Text>
          <TextInput
            style={[styles.textInput, { borderColor: errors.title ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="Enter plan title"
            placeholderTextColor={colors.placeholder}
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
        </View>

        <View style={[styles.fieldGroup, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Description *</Text>
          <TextInput
            style={[styles.textArea, { borderColor: errors.description ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="Describe the plan"
            placeholderTextColor={colors.placeholder}
            multiline
          />
          {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
        </View>

        <View style={[styles.fieldGroup, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Trip Date Time *</Text>
          <TextInput
            style={[styles.textInput, { borderColor: errors.tripDateTime ? '#E85D04' : colors.border, backgroundColor: colors.card, color: colors.text }]}
            value={tripDateTime}
            onChangeText={(value) => {
              setTripDateTime(value);
              if (errors.tripDateTime) setErrors((prev) => ({ ...prev, tripDateTime: undefined }));
            }}
            placeholder="YYYY-MM-DD HH:mm"
            placeholderTextColor={colors.placeholder}
          />
          {errors.tripDateTime ? <Text style={styles.errorText}>{errors.tripDateTime}</Text> : null}
        </View>

        <View style={[styles.routeHeader, { borderColor: colors.border }]}> 
          <Text style={[styles.routeLabel, { color: colors.text }]}>Route</Text>
        </View>

        {!routeImageUrl ? (
          <TouchableOpacity style={[styles.addRouteButton, { backgroundColor: colors.accent, alignSelf: 'flex-start', marginTop: 8 }]} onPress={() => setRouteModalVisible(true)} activeOpacity={0.85}>
            <MaterialIcons name="add-location" size={18} color="#fff" />
            <Text style={styles.addRouteText}>Add Route</Text>
          </TouchableOpacity>
        ) : null}

        {routeImageUrl ? (
          <TouchableOpacity onPress={() => setRouteModalVisible(true)} activeOpacity={0.85}>
            <Image source={{ uri: routeImageUrl }} style={styles.routeImage} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.routePlaceholder, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}> 
            <Text style={[styles.placeholderText, { color: colors.secondaryText }]}>No route selected yet</Text>
          </View>
        )}

        <View style={[styles.routeSummary, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={styles.routeStat}>
            <Text style={[styles.routeStatLabel, { color: colors.secondaryText }]}>Distance</Text>
            <Text style={[styles.routeStatValue, { color: colors.text }]}>{formatDistance(totalDistance)}</Text>
          </View>
          <View style={styles.routeStat}>
            <Text style={[styles.routeStatLabel, { color: colors.secondaryText }]}>Duration</Text>
            <Text style={[styles.routeStatValue, { color: colors.text }]}>{formatDuration(totalDuration)}</Text>
          </View>
          <View style={styles.routeStat}>
            <Text style={[styles.routeStatLabel, { color: colors.secondaryText }]}>Elevation</Text>
            <Text style={[styles.routeStatValue, { color: colors.text }]}>{totalElevation} m</Text>
          </View>
        </View>

        <View style={styles.actionRow}> 
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={[styles.cancelLabel, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSave} activeOpacity={0.85} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveLabel}>Save</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent visible={routeModalVisible} onRequestClose={() => setRouteModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}> 
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}> 
              <Text style={[styles.modalTitle, { color: colors.text }]}>Plan Route</Text>
              <TouchableOpacity onPress={() => setRouteModalVisible(false)} hitSlop={14}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.mapModalContent}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={mapRegion ?? { latitude: 16.8409, longitude: 96.1735, latitudeDelta: 0.5, longitudeDelta: 0.5 }}
                region={mapRegion ?? undefined}
                onPress={handleMapPress}
                onLongPress={handleMapPress}
                onRegionChangeComplete={setMapRegion}
              >
                {routeResponseJson && routePoints.length >= 2 ? (
                  <Polyline
                    coordinates={
                      routeResponseJson.routes?.[0]?.geometry?.coordinates?.map((coord: [number, number]) => ({
                        latitude: coord[1],
                        longitude: coord[0],
                      })) ?? []
                    }
                    strokeColor="#4285f4"
                    strokeWidth={4}
                  />
                ) : routePoints.length >= 2 ? (
                  <Polyline
                    coordinates={routePoints.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
                    strokeColor="#4285f4"
                    strokeWidth={4}
                  />
                ) : null}
                {routePoints.map((point) => (
                  <Marker
                    key={point.id}
                    coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                    pinColor={point.type === 'start' ? 'green' : point.type === 'end' ? 'red' : 'blue'}
                    draggable
                    onDragEnd={(e) => handleMarkerDragEnd(point.id, e.nativeEvent.coordinate)}
                    title={point.title}
                  />
                ))}
              </MapView>

              <View style={styles.modalActions}> 
                <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleClearRoute}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.accent }]}
                  onPress={async () => {
                    if (routePoints.length < 2) {
                      Alert.alert('Route required', 'Add at least a start and end point.');
                      return;
                    }

                    const staticMapUrl = await fetchStaticMapUrl(routePoints, routeResponseJson);
                    if (staticMapUrl) {
                      setRouteImageUrl(staticMapUrl);
                    }

                    setRouteModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 42,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },
  fieldGroup: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  textInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#E85D04',
    fontSize: 13,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  routeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  addRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addRouteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  routePlaceholder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
  },
  routeImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  routeSummary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeStat: {
    flex: 1,
    gap: 4,
  },
  routeStatLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  modalContainer: {
    width: '100%',
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  mapModalContent: {
    flex: 1,
    padding: 16,
  },
  map: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
