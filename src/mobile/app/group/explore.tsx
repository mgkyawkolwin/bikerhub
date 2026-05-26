import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/mobile/components/themedText';
import { useThemeContext } from '@/mobile/hooks/use-theme-context';
import { container } from '@/services';
import { GroupServiceToken } from '@/services/groupService';
import type { GroupService } from '@/services/groupService';
import type Group from '@/models/group';

export default function GroupExploreScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const params = useLocalSearchParams();
  const groupService = useMemo(() => container.resolve<GroupService>(GroupServiceToken), []);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'explore' | 'myGroups'>(() => {
    const section = Array.isArray(params.section) ? params.section[0] : params.section;
    return section === 'myGroups' ? 'myGroups' : 'explore';
  });

  const filteredGroups = useMemo(
    () =>
      groups.filter((group) =>
        [group.title, group.description ?? '']
          .join(' ')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      ),
    [groups, searchQuery],
  );

  const colors = useMemo(
    () => ({
      background: isDark ? '#000000' : '#FFFFFF',
      card: isDark ? '#121212' : '#F7F7F7',
      border: isDark ? '#232323' : '#E0E0E0',
      primary: isDark ? '#FFFFFF' : '#000000',
      secondary: isDark ? '#B0B0B0' : '#666666',
      accent: '#E85D04',
    }),
    [isDark],
  );

  const loadGroups = useCallback(async () => {
    const result = await groupService.getGroups();
    setGroups(result);
  }, [groupService]);

  useFocusEffect(
    useCallback(() => {
      void loadGroups();
    }, [loadGroups]),
  );

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => router.push(`/group/posts?groupId=${encodeURIComponent(item.id)}`)}
    >
      <View style={styles.groupRow}>
        <View style={[styles.groupIcon, { backgroundColor: colors.accent }]}> 
          <MaterialIcons name={item.icon as any} size={24} color={colors.background} />
        </View>
        <View style={styles.groupInfo}>
          <ThemedText style={[styles.groupTitle, { color: colors.primary }]}>{item.title}</ThemedText>
          {item.description ? (
            <ThemedText style={[styles.groupDescription, { color: colors.secondary }]}>{item.description}</ThemedText>
          ) : null}
          <View style={styles.groupMetaRow}>
            <ThemedText style={[styles.groupMetaText, { color: item.isPrivate ? colors.accent : colors.secondary }]}> 
              {item.isPrivate ? 'Private' : 'Public'}
            </ThemedText>
            <ThemedText style={[styles.groupMetaText, { color: colors.secondary }]}> 
              {item.membersCount ?? 0} members
            </ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14}>
            <MaterialIcons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.primary }]}>Groups</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.headerButtonRow}>
          <TouchableOpacity
            style={[styles.iconButton, activeSection === 'explore' && { backgroundColor: colors.accent }]}
            activeOpacity={0.8}
            onPress={() => setActiveSection('explore')}
          >
            <MaterialIcons name="explore" size={20} color={activeSection === 'explore' ? '#FFFFFF' : colors.primary} />
            <ThemedText style={[styles.iconButtonText, { color: activeSection === 'explore' ? '#FFFFFF' : colors.primary }]}>Explore</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, activeSection === 'myGroups' && { backgroundColor: colors.accent }]}
            activeOpacity={0.8}
            onPress={() => setActiveSection('myGroups')}
          >
            <MaterialIcons name="groups" size={20} color={activeSection === 'myGroups' ? '#FFFFFF' : colors.primary} />
            <ThemedText style={[styles.iconButtonText, { color: activeSection === 'myGroups' ? '#FFFFFF' : colors.primary }]}>My Groups</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/group/create' })}
          >
            <MaterialIcons name="group-add" size={20} color={colors.primary} />
            <ThemedText style={[styles.iconButtonText, { color: colors.primary }]}>Create</ThemedText>
          </TouchableOpacity>
        </View>

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search groups"
          placeholderTextColor={colors.secondary}
          style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.primary }]}
        />
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={[styles.emptyText, { color: colors.secondary }]}>No groups available.</ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 42,
  },
  headerButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  iconButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  iconButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchInput: {
    marginTop: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 14,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  groupDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  groupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  groupMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
