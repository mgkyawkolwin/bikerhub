import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/hooks/use-theme-context';
import { container } from '@/services';
import { SocialProfileServiceToken } from '@/services/socialProfileService';
import type { SocialProfileService } from '@/services/socialProfileService';
import type SocialProfile from '@/models/socialProfile';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const router = useRouter();
  const profileService = useMemo(
    () => container.resolve<SocialProfileService>(SocialProfileServiceToken),
    [],
  );

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SocialProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    const timeout = setTimeout(() => {
      void (async () => {
        try {
          const response = await profileService.searchProfiles(query.trim());
          if (!response.ok) {
            throw new Error('Unable to search profiles.');
          }

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.message || 'Unable to search profiles.');
          }

          setResults(result.data ?? []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unable to search profiles.');
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      })();
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [query, profileService]);

  const renderProfileItem = ({ item }: { item: SocialProfile }) => {
    return (
      <TouchableOpacity
        style={[styles.resultItem, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => router.push({ pathname: '/social/profile', params: { userId: item.id } })}
      >
        <View style={[styles.avatar, { backgroundColor: colors.border }]}> 
          <Text style={[styles.avatarText, { color: colors.text }]}> {item.displayName?.[0] ?? item.userName?.[0] ?? '?'} </Text>
        </View>
        <View style={styles.resultContent}>
          <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
            {item.displayName}
          </Text>
          <Text style={[styles.resultSubtitle, { color: colors.secondaryText }]} numberOfLines={1}>
            @{item.userName}
          </Text>
          {item.bio ? (
            <Text style={[styles.resultBio, { color: colors.secondaryText }]} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}> 
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <MaterialIcons name="search" size={20} color={colors.secondaryText} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Search profiles"
          placeholderTextColor={colors.secondaryText}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <View style={styles.statusContainer}>
        {query.trim().length === 0 ? (
          <Text style={[styles.statusText, { color: colors.secondaryText }]}>Type a name or username to search profiles.</Text>
        ) : isSearching ? (
          <Text style={[styles.statusText, { color: colors.secondaryText }]}>Searching...</Text>
        ) : error ? (
          <Text style={[styles.statusText, { color: colors.error }]}>{error}</Text>
        ) : results.length === 0 ? (
          <Text style={[styles.statusText, { color: colors.secondaryText }]}>No profiles found.</Text>
        ) : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderProfileItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 40,
  },
  statusContainer: {
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 14,
  },
  list: {
    paddingBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultContent: {
    flex: 1,
    gap: 4,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
  },
  resultSubtitle: {
    fontSize: 13,
  },
  resultBio: {
    fontSize: 12,
    marginTop: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});
