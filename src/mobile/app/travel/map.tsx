import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useI18n } from '@/i18n';
import { useThemeContext } from '@/hooks/use-theme-context';

const INITIAL_REGION = {
  latitude: 16.8661,
  longitude: 96.1951,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { colors, isDark } = useThemeContext();
  const mapRef = useRef<MapView>(null);

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }] }>
        <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.Title.map}</Text>
      </View>

      {/* Map */}
      <View style={[styles.body, { backgroundColor: colors.background }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={INITIAL_REGION}
          showsUserLocation
          showsMyLocationButton
          customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 22,
  },
  body: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
