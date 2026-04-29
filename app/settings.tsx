import { StyleSheet, View, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';

const A = '#E85D04';

export default function SettingsScreen() {
  const ins = useSafeAreaInsets();
  const { isDark, toggleTheme } = useThemeContext();
  const { t, locale, setLocale } = useI18n();
  const dk = isDark;

  const c = {
    bg:      '#000000',
    card:    dk ? '#333333' : '#FFFFFF',
    border:  dk ? '#444444' : '#E0E0E0',
    pri:     dk ? '#FFFFFF' : '#000000',
    sec:     dk ? '#AAAAAA' : '#666666',
    headPri: '#FFFFFF',
  };

  return (
    <View style={[$.root, { backgroundColor: c.bg }]}>

      {/* header */}
      <View style={[$.header, { paddingTop: ins.top + 8 }]}>
        <TouchableOpacity hitSlop={14} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={c.headPri} />
        </TouchableOpacity>
        <ThemedText style={[$.title, { color: c.headPri }]}>{t.Title.settings}</ThemedText>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[$.scroll, { paddingBottom: ins.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>

        {/* language card */}
        <View style={[$.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={$.cardHead}>
            <MaterialIcons name="translate" size={18} color={c.sec} />
            <ThemedText style={[$.cardTitle, { color: c.pri }]}>{t.Title.language}</ThemedText>
          </View>
          <View style={[$.divider, { backgroundColor: c.border }]} />
          <View style={$.cardBody}>
            <ThemedText style={[$.desc, { color: c.sec }]}>{t.Text.selectLanguage}</ThemedText>
            <View style={$.langRow}>
              {(['en', 'my'] as const).map((code) => {
                const active = locale === code;
                const label = code === 'en' ? t.Title.english : t.Title.myanmar;
                return (
                  <TouchableOpacity
                    key={code}
                    onPress={() => setLocale(code)}
                    activeOpacity={0.6}
                    style={[
                      $.langBtn,
                      { borderColor: active ? A : c.border, backgroundColor: active ? A + '0C' : 'transparent' },
                    ]}>
                    {active && <MaterialIcons name="check" size={14} color={A} />}
                    <ThemedText style={[$.langText, { color: active ? A : c.sec }]}>
                      {label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* dark mode card */}
        <View style={[$.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[$.cardBody, $.switchRow]}>
            <MaterialIcons name={dk ? 'dark-mode' : 'light-mode'} size={18} color={c.sec} />
            <ThemedText style={[$.cardTitle, { color: c.pri, flex: 1 }]}>{t.Title.darkMode}</ThemedText>
            <Switch
              value={dk}
              onValueChange={toggleTheme}
              trackColor={{ false: c.border, true: A }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const $ = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: { fontSize: 17, fontWeight: '700', letterSpacing: 1 },
  scroll: { paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12 },
  cardBody: { padding: 12 },
  desc: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  langText: { fontSize: 13, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
