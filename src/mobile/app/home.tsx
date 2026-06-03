import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Link, type Href } from 'expo-router';
import { ThemedText } from '@/components/themedText';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useAuthContext } from '@/hooks/use-auth-context';
import { useI18n } from '@/i18n';

function useSections() {
  const { t } = useI18n();
  return [
    {
      title: t.Title.marketplace,
      icon: 'two-wheeler',
      items: [
        { label: t.Title.listing,     icon: 'two-wheeler',  link: '/marketplace' },
        { label: t.Title.sell,        icon: 'sell',         link: '/marketplace/create' },
        { label: t.Title.favorite,    icon: 'favorite',     link: '/marketplace/favorites' },
        { label: t.Title.buyHistory,  icon: 'receipt-long', link: '/marketplace/buy-history' },
        { label: t.Title.sellHistory, icon: 'history',      link: '/marketplace/sell-history' },
        { label: t.Title.myItems,     icon: 'garage',       link: '/marketplace/my-items' },
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
        { label: t.Title.news,     icon: 'feed',         link: '/news' },
        { label: t.Title.articles, icon: 'auto-stories', link: '/articles' },
      ],
    },
    {
      title: t.Title.community,
      icon: 'groups',
      items: [
        { label: t.Title.blogs,   icon: 'forum',              link: '/blog' },
        { label: t.Title.forums,  icon: 'forum',              link: '/forum' },
        { label: t.Title.chats,   icon: 'chat-bubble-outline', link: '/chat/chats' },
      ],
    },
    {
      title: t.Title.tools,
      icon: 'build',
      items: [
        { label: t.Title.reportStolen, icon: 'report-problem', link: '/blank' },
        { label: t.Title.vinSearch,    icon: 'manage-search',  link: '/blank' },
        { label: t.Title.stolenList,   icon: 'warning-amber',  link: '/blank' },
      ],
    }
  ];
}

export default function HomeScreen() {
  const ins = useSafeAreaInsets();
  const { colors } = useThemeContext();
  const { getAuthUser } = useAuthContext();
  const sections = useSections();
    const authUser = getAuthUser();

  const { colors } = useThemeContext();

  return (
    <View style={[$.root, { backgroundColor: colors.background }]}>

      {/* ── header ── */}
      <View style={[$.header, { paddingTop: ins.top + 8 }]}>
        {/* top row — icons + logo */}
        <View style={$.headerTop}>
          <View style={$.headerSide}>
            <Link href="/settings" asChild>
              <TouchableOpacity hitSlop={12}>
                <MaterialIcons name="tune" size={22} color={colors.text} />
              </TouchableOpacity>
            </Link>
            <Link href="/message/messages" asChild>
              <TouchableOpacity hitSlop={12}>
                <View>
                  <MaterialIcons name="notifications-none" size={22} color={colors.text} />
                  <View style={$.bellDot} />
                </View>
              </TouchableOpacity>
            </Link>
          </View>
          <ThemedText style={[$.logo, { color: colors.text }]}>BIKERHUB</ThemedText>
          <View style={$.headerSide}>
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

        {/* info row — welcome + weather */}
        <View style={$.infoRow}>
          <ThemedText style={[$.welcome, { color: colors.text }]}>Welcome, {authUser?.name ?? 'MM Biker'}</ThemedText>
          <View style={$.weatherRow}>
            <MaterialIcons name="wb-sunny" size={14} color="#FFC107" />
            <ThemedText style={$.weatherText}>34°C · Yangon</ThemedText>
          </View>
        </View>

        {/* stats row */}
        <View style={$.statsRow}>
          <View style={$.statItem}>
            <MaterialIcons name="two-wheeler" size={20} color={colors.text} />
            <ThemedText style={[$.statValue, { color: colors.text }]}>3</ThemedText>
          </View>
          <View style={[$.statDivider, { backgroundColor: '#333' }]} />
          <View style={$.statItem}>
            <MaterialIcons name="water-drop" size={20} color={colors.text} />
            <ThemedText style={[$.statValue, { color: colors.text }]}>3,000 Km</ThemedText>
          </View>
          <View style={[$.statDivider, { backgroundColor: '#333' }]} />
          <View style={$.statItem}>
            <MaterialIcons name="settings" size={20} color={colors.text} />
            <ThemedText style={[$.statValue, { color: colors.text }]}>5,000 Km</ThemedText>
          </View>
          <View style={[$.statDivider, { backgroundColor: '#333' }]} />
          <View style={$.statItem}>
            <MaterialIcons name="trip-origin" size={20} color={colors.text} />
            <ThemedText style={[$.statValue, { color: colors.text }]}>9,100 Km</ThemedText>
          </View>
        </View>
      </View>

      {/* ── body ── */}
      <ScrollView
        contentContainerStyle={[$.scroll, { paddingBottom: ins.bottom + 20 }]}
        showsVerticalScrollIndicator={false}>
        {sections.map((sec) => (
          <View key={sec.title} style={[$.group, { backgroundColor: c.card, borderColor: c.border }]}>

            {/* group header */}
            <View style={$.groupHead}>
              <MaterialIcons name={sec.icon as any} size={18} color={colors.secondaryText} />
              <ThemedText style={[$.groupTitle, { color: colors.text }]}>{sec.title}</ThemedText>
            </View>

            <View style={[$.divider, { backgroundColor: c.border }]} />

            {/* items grid — 3 columns */}
            <View style={$.grid}>
              {sec.items.map((item) => (
                <Link key={item.label} href={item.link as Href} asChild>
                  <TouchableOpacity style={$.tile} activeOpacity={0.5}>
                    <View style={[$.tileIcon, { backgroundColor: c.iconBg }]}>
                      <MaterialIcons name={item.icon as any} size={22} color={c.iconFg} />
                    </View>
                    <ThemedText style={[$.tileLabel, { color: colors.text }]} numberOfLines={2}>
                      {item.label}
                    </ThemedText>
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

  /* header */
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
  welcome: { fontSize: 15, fontWeight: '600' },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weatherText: { fontSize: 12, color: '#AAAAAA' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: 14,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statDivider: { width: 1, height: 28 },

  /* scroll */
  scroll: { paddingHorizontal: 12, paddingTop: 8, gap: 8 },

  /* group card */
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

  /* grid */
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
