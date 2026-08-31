import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, type Href, useRouter } from 'expo-router';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { container, MessageServiceToken } from '@/services';
import type { MessageService } from '@/services';
import SnackBar from '@/components/snackbar';
import Message from '@/models/message';

function useSections() {
  const { t } = useI18n();
  return [
    {
      title: t.Title.marketplace,
      icon: 'two-wheeler',
      items: [
        { label: t.Title.listing, icon: 'two-wheeler', link: '/marketplace' },
        { label: t.Title.sell, icon: 'sell', link: '/marketplace/create' },
        { label: t.Title.favorite, icon: 'favorite', link: '/marketplace/favorites' },
        { label: t.Title.buyHistory, icon: 'receipt-long', link: '/marketplace/buy-history' },
        { label: t.Title.sellHistory, icon: 'history', link: '/marketplace/sell-history' },
        { label: t.Title.myItems, icon: 'garage', link: '/marketplace/my-items' },
      ],
    },
    {
      title: t.Title.travelMap,
      icon: 'explore',
      items: [
        { label: t.Title.map, icon: 'explore', link: '/travel/map' },
        { label: t.Title.directory, icon: 'folder', link: '/directory/directory' },
        { label: t.Title.routes, icon: 'route', link: '/route' },
        { label: t.Title.submitBusiness, icon: 'business', link: '/directory/new' },
      ],
    },
    {
      title: t.Title.newsUpdates,
      icon: 'feed',
      items: [
        { label: t.Title.news, icon: 'feed', link: '/news' },
        { label: t.Title.articles, icon: 'auto-stories', link: '/articles' },
      ],
    },
    {
      title: t.Title.community,
      icon: 'groups',
      items: [
        { label: t.Title.blogs, icon: 'newspaper', link: '/blog/list' },
        { label: t.Title.forums, icon: 'forum', link: '/forum' },
        { label: t.Title.chats, icon: 'chat-bubble-outline', link: '/chat/chats' },
      ],
    },
    {
      title: t.Title.tools,
      icon: 'build',
      items: [
        { label: t.Title.reportStolen, icon: 'report-problem', link: '/blank' },
        { label: t.Title.vinSearch, icon: 'manage-search', link: '/blank' },
        { label: t.Title.stolenList, icon: 'warning-amber', link: '/blank' },
      ],
    }
  ];
}

export default function HomeScreen() {
  const ins = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const router = useRouter();
  const sections = useSections();
  const messageService = useMemo(() => container.resolve<MessageService>(MessageServiceToken), []);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const loadUnreadMessages = useCallback(async () => {
    try {
      const response = await messageService.hasUnreadMessages();
      if (!response.ok) {
        SnackBar.Error(`${response.status} - ${response.statusText} : Invalid server response. Please try again.`);
        return;
      }
      const responseJson = await response.json();
      if (!responseJson.success) {
        SnackBar.Error(responseJson.message || 'Failed to load unread status. Please try again.');
        return;
      }

      const hasUnread = responseJson.data?.hasUnread === true;
      setHasUnreadMessages(hasUnread);
    } catch {
      // ignore polling failures silently
    }
  }, [messageService]);

  useEffect(() => {
    void loadUnreadMessages();
    const interval = setInterval(() => {
      void loadUnreadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadUnreadMessages]);

  return (
    <View style={[$.root, { backgroundColor: colors.background }]}>

      {/* ── header ── */}
      <View style={[$.header, { paddingTop: ins.top + 8 }]}> 
        <View style={$.headerTop}>
          <View style={$.headerSide}>
            <Link href="/settings" asChild>
              <TouchableOpacity hitSlop={12}>
                <MaterialIcons name="tune" size={22} color={colors.text} />
              </TouchableOpacity>
            </Link>
            <Text style={[$.logo, { color: colors.text, marginLeft: 10 }]}>BIKERHUB</Text>
          </View>
          <View style={$.headerSide}>
            <TouchableOpacity hitSlop={12} onPress={() => {}}>
              <MaterialIcons name="search" size={22} color={colors.text} />
            </TouchableOpacity>
            <Link href="/message/messages" asChild>
              <TouchableOpacity hitSlop={12}>
                <View>
                  <MaterialIcons name="notifications-none" size={22} color={colors.text} />
                  {hasUnreadMessages ? <View style={$.bellDot} /> : null}
                </View>
              </TouchableOpacity>
            </Link>
            <Link href="/chat/chats" asChild>
              <TouchableOpacity hitSlop={12}>
                <MaterialIcons name="chat-bubble-outline" size={20} color={colors.text} />
              </TouchableOpacity>
            </Link>
            <Link href="/profile" asChild>
              <TouchableOpacity hitSlop={12}>
                <MaterialIcons name="person-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={$.infoRow}>
          <View style={$.statItem}>
            <MaterialIcons name="settings" size={20} color={colors.text} />
            <Text style={[$.statValue, { color: colors.text }]}>5,000 Km</Text>
          </View>
          <View style={[$.statDivider, { backgroundColor: '#333' }]} />
          <View style={$.statItem}>
            <MaterialIcons name="trip-origin" size={20} color={colors.text} />
            <Text style={[$.statValue, { color: colors.text }]}>9,100 Km</Text>
          </View>
        </View>
      </View>

      {/* ── body ── */}
      <ScrollView
        contentContainerStyle={[$.scroll, { paddingBottom: ins.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((sec) => (
          <View key={sec.title} style={[$.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={$.groupHead}>
              <MaterialIcons name={sec.icon as any} size={18} color={colors.secondaryText} />
              <Text style={[$.groupTitle, { color: colors.text }]}>{sec.title}</Text>
            </View>
            <View style={[$.divider, { backgroundColor: colors.border }]} />
            <View style={$.grid}>
              {sec.items.map((item) => (
                <Link key={item.label} href={item.link as Href} asChild>
                  <TouchableOpacity style={$.tile} activeOpacity={0.5}>
                    <View style={[$.tileIcon, { backgroundColor: colors.icon }]}> 
                      <MaterialIcons name={item.icon as any} size={22} color={colors.icon} />
                    </View>
                    <Text style={[$.tileLabel, { color: colors.text }]} numberOfLines={2}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const $ = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { fontSize: 17, fontWeight: '700', letterSpacing: 3 },
  headerSide: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bellDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statDivider: { width: 1, height: 28 },
  scroll: { paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  group: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  tile: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
});
