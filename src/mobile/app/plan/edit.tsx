import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import polyline from '@mapbox/polyline';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import SnackBar from '@/components/snackbar';
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

export default function PlanEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useThemeContext();
  const planService = useMemo(() => container.resolve<PlanService>(PlanServiceToken), []);
  const routeService = useMemo(() => container.resolve<RouteService>(RouteServiceToken), []);

  const planId = useMemo(() => {
    const value = Array.isArray(params.planId) ? params.planId[0] : params.planId;
    if (value) return String(value);
    const alt = Array.isArray(params.id) ? params.id[0] : params.id;
    return alt ? String(alt) : null;
  }, [params]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tripDate, setTripDate] = useState<Date | null>(null);
  const [tripTime, setTripTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'title' | 'description' | 'tripDate' | 'tripTime', string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(Boolean(planId));

  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [routePoints, setRoutePoints] = useState<Waypoint[]>([]);
  const [routeResponseJson, setRouteResponseJson] = useState<any | null>(null);
  const [routeImageUrl, setRouteImageUrl] = useState<string | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalElevation, setTotalElevation] = useState(0);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  const mapRef = useRef<MapView>(null);

  const formatTripDate = (value: Date | null) => {
    if (!value) return 'Select date';
    return value.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTripTime = (value: Date | null) => {
    if (!value) return 'Select time';
    return value.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseLocationsJson = useCallback((value: unknown) => {
    if (!value) return { points: [] as Waypoint[], route: null as any };

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return { points: [], route: null };
      }
    }

    return value as any;
  }, []);

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

  const buildTripDateTime = (): Date | null => {
    if (!tripDate || !tripTime) return null;
    return new Date(
      tripDate.getFullYear(),
      tripDate.getMonth(),
      tripDate.getDate(),
      tripTime.getHours(),
      tripTime.getMinutes(),
      tripTime.getSeconds(),
    );
  };

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

    if (!tripDate) {
      nextErrors.tripDate = 'Trip date is required.';
    }

    if (!tripTime) {
      nextErrors.tripTime = 'Trip time is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const loadPlan = useCallback(async (id: string) => {
    try {
      setIsLoadingPlan(true);
      const response = await planService.getPlanById(id);
      const responseJson = await response.json().catch(() => null);
      const success = responseJson?.success ?? responseJson?.Success;
      const data = responseJson?.data ?? responseJson?.Data;

      if (!response.ok || !success || !data) {
        const message = responseJson?.message ?? responseJson?.Message ?? 'Unable to load plan.';
        throw new Error(message);
      }

      const plan = data as any;
      const parsedDate = plan.tripDateTimeUtc ? new Date(plan.tripDateTimeUtc) : null;
      setTitle(plan.title ?? '');
      setDescription(plan.description ?? '');
      setTotalDistance(plan.distance ?? 0);
      setTotalDuration(plan.duration ?? 0);
      setTotalElevation(plan.elevation ?? 0);
      setRouteImageUrl(plan.staticMapUrl ?? null);

      if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
        setTripDate(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
        setTripTime(new Date(2000, 0, 1, parsedDate.getHours(), parsedDate.getMinutes(), parsedDate.getSeconds()));
      }

      const locations = parseLocationsJson(plan.locationsJson);
      const loadedPoints = Array.isArray(locations?.points) ? locations.points as Waypoint[] : [];
      if (loadedPoints.length > 0) {
        const normalizedPoints = normalizeWaypoints(loadedPoints);
        setRoutePoints(normalizedPoints);
        setRouteResponseJson(locations?.route ?? null);
        if (locations?.route) {
          const geoCoords = locations.route.routes?.[0]?.geometry?.coordinates?.map((coord: [number, number]) => ({
            latitude: coord[1],
            longitude: coord[0],
          })) ?? [];
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
        }
      }
    } catch (error) {
      console.error('Failed to load plan:', error);
      Alert.alert('Load Plan', error instanceof Error ? error.message : 'Unable to load plan.');
      router.back();
    } finally {
      setIsLoadingPlan(false);
    }
  }, [normalizeWaypoints, parseLocationsJson, planService, router]);

  useEffect(() => {
    if (!planId) {
      setIsLoadingPlan(false);
      return;
    }

    void loadPlan(planId);
  }, [loadPlan, planId]);

  const handleSave = async () => {
    if (!planId) {
      Alert.alert('Update Plan', 'Plan id is missing.');
      return;
    }

    if (!validate()) {
      return;
    }

    const parsedDate = buildTripDateTime();
    if (!parsedDate) {
      setErrors((prev) => ({ ...prev, tripDate: 'Trip date is required.', tripTime: 'Trip time is required.' }));
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

      const response = await planService.updatePlan(planId, requestBody as any);
      const responseJson = await response.json().catch(() => null);
      const success = responseJson?.success ?? responseJson?.Success;
      const data = responseJson?.data ?? responseJson?.Data;

      if (!response.ok || !success || !data) {
        const message = responseJson?.message ?? responseJson?.Message ?? 'Unable to update plan.';
        throw new Error(message);
      }

      router.replace('/plan/list');
    } catch (error) {
      console.error('Plan update failed:', error);
      Alert.alert('Update Plan', error instanceof Error ? error.message : 'Unable to update plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = useCallback(() => {
    if (!planId) {
      SnackBar.Error('Plan id is missing.');
      return;
    }

    Alert.alert('Delete Plan', 'Are you sure you want to delete this plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            const response = await planService.deletePlan(planId);
            const responseJson = await response.json().catch(() => null);
            const success = responseJson?.success ?? responseJson?.Success;

            if (!response.ok || !success) {
              const message = responseJson?.message ?? responseJson?.Message ?? 'Unable to delete plan.';
              throw new Error(message);
            }

            SnackBar.Success('Plan deleted successfully.');
            router.dismiss(2);
          } catch (error) {
            console.error('Plan delete failed:', error);
            SnackBar.Error(error instanceof Error ? error.message : 'Unable to delete plan.');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  }, [planId, planService, router]);

  if (isLoadingPlan) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
        <View style={[styles.header, { borderBottomColor: colors.border }]}> 
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Update Plan</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading plan...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Update Plan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}> 
        <View style={[styles.sectionGroup, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Plan Details</Text>
          </View>

          <View style={styles.sectionBody}> 
            <View style={styles.fieldGroupInline}> 
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

            <View style={styles.fieldGroupInline}> 
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

            <View style={styles.fieldGroupInline}> 
              <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Trip Date & Time *</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={[styles.datePickerButton, { borderColor: errors.tripDate ? '#E85D04' : colors.border, backgroundColor: colors.card, flex: 1 }]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.datePickerText, { color: tripDate ? colors.text : colors.placeholder }]}>
                    {formatTripDate(tripDate)}
                  </Text>
                  <MaterialIcons name="event" size={20} color={colors.secondaryText} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.datePickerButton, { borderColor: errors.tripTime ? '#E85D04' : colors.border, backgroundColor: colors.card, flex: 1 }]}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.datePickerText, { color: tripTime ? colors.text : colors.placeholder }]}>
                    {formatTripTime(tripTime)}
                  </Text>
                  <MaterialIcons name="access-time" size={20} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>

              {showDatePicker ? (
                <DateTimePicker
                  value={tripDate ?? new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setTripDate(selectedDate);
                      if (errors.tripDate) setErrors((prev) => ({ ...prev, tripDate: undefined }));
                    }
                  }}
                />
              ) : null}

              {showTimePicker ? (
                <DateTimePicker
                  value={tripTime ?? new Date()}
                  mode="time"
                  display="default"
                  onChange={(_, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      setTripTime(selectedTime);
                      if (errors.tripTime) setErrors((prev) => ({ ...prev, tripTime: undefined }));
                    }
                  }}
                />
              ) : null}

              {errors.tripDate || errors.tripTime ? (
                <Text style={styles.errorText}>{errors.tripDate ?? errors.tripTime}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={[styles.sectionGroup, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Route</Text>
          </View>
          <View style={styles.sectionBody}> 
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
          </View>
        </View>

        <View style={styles.actionRow}> 
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={[styles.cancelLabel, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={handleSave} activeOpacity={0.85} disabled={isSaving || isDeleting}>
            {isSaving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveLabel}>Update</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.card, borderColor: '#DC2626' }]}
          onPress={handleDelete}
          activeOpacity={0.85}
          disabled={isSaving || isDeleting}
        >
          {isDeleting ? <ActivityIndicator color="#DC2626" /> : <Text style={styles.deleteLabel}>Delete</Text>}
        </TouchableOpacity>
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
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 80,
  },
  loadingText: {
    fontSize: 15,
  },
  sectionGroup: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionBody: {
    padding: 16,
    gap: 16,
  },
  fieldGroupInline: {
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
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  datePickerButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  datePickerText: {
    fontSize: 15,
    flex: 1,
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
  deleteButton: {
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    color: '#DC2626',
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  mapModalContent: {
    flex: 1,
    padding: 12,
    gap: 12,
  },
  map: {
    width: '100%',
    height: '100%',
    minHeight: 340,
    borderRadius: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
