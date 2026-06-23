import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { container } from '@/services';
import { SocialServiceClient, SocialServiceToken } from '@/services/socialService';
import SnackBar from '@/components/snackbar';

const platforms = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'x', label: 'X' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'web', label: 'Website' },
];

export default function SocialLinksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const { authUser } = useAuthContext();
  const socialService = useMemo(() => container.resolve<SocialServiceClient>(SocialServiceToken), []);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    facebook: '',
    instagram: '',
    youtube: '',
    telegram: '',
    x: '',
    tiktok: '',
    web: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSocialLinks = useCallback(async () => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await socialService.getProfileById(authUser.id);
      if (!response.ok) {
        SnackBar.Error('Unable to load your social links.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Unable to load your social links.');
        return;
      }

      const profileLinks: Array<{ platform: string; url: string }> = result.data?.socialLinks ?? [];
      setSocialLinks((current) => ({
        ...current,
        ...profileLinks.reduce<Record<string, string>>((acc, link) => {
          if (link.platform && typeof link.url === 'string') {
            acc[link.platform] = link.url;
          }
          return acc;
        }, {}),
      }));
    } catch (error) {
      console.error('Failed to load social links:', error);
      SnackBar.Error('Unable to load your social links.');
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, socialService]);

  useEffect(() => {
    void loadSocialLinks();
  }, [loadSocialLinks]);

  const handleChange = (platform: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  };

  const handleSave = async () => {
    if (!authUser?.id) {
      SnackBar.Error('Authentication required.');
      return;
    }

    setSaving(true);
    try {
      const linksPayload = platforms
        .map((platform) => ({ platform: platform.key, url: socialLinks[platform.key]?.trim() ?? '' }))
        .filter((link) => link.url.length > 0);

      const response = await socialService.updateSocialLinks(linksPayload);
      if (!response.ok) {
        SnackBar.Error('Unable to save social links.');
        return;
      }

      const result = await response.json();
      if (!result.success) {
        SnackBar.Error(result.message || 'Unable to save social links.');
        return;
      }

      SnackBar.Success('Social links updated.');
      router.back();
    } catch (error) {
      console.error('Failed to save social links:', error);
      SnackBar.Error('Unable to save social links.');
    } finally {
      setSaving(false);
    }
  };

  if (!authUser?.id) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}> 
        <Text style={[styles.title, { color: colors.text }]}>Social Links</Text>
        <Text style={[styles.message, { color: colors.secondaryText }]}>You must be signed in to edit your social links.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>Edit Social Links</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton} activeOpacity={0.7}>
          <MaterialIcons name="close" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Update the URLs for the social platforms you want to show on your profile.</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      ) : (
        platforms.map((platform) => (
          <View key={platform.key} style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{platform.label}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              placeholder={`Enter your ${platform.label} URL`}
              placeholderTextColor={colors.secondaryText}
              value={socialLinks[platform.key]}
              onChangeText={(text) => handleChange(platform.key, text)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.accent, opacity: saving ? 0.7 : 1 }]}
        activeOpacity={0.85}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Links'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  loader: {
    marginTop: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 46,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveButton: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
    borderRadius: 16,
  },
  message: {
    marginTop: 16,
    fontSize: 15,
  },
});
