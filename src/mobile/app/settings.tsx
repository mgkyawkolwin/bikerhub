import { StyleSheet, View, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import { Label } from '@react-navigation/elements';

export default function SettingsScreen() {
  const ins = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useThemeContext();
  const { t, locale, setLocale } = useI18n();


  return (
    <View style={[$.root, { backgroundColor: colors.background }]}>

      {/* header */}
      <View style={[$.header, { paddingTop: ins.top + 8 }]}>
        <TouchableOpacity hitSlop={14} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Label style={[$.title, { color: colors.text }]}>{t.Title.settings}</Label>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[$.scroll, { paddingBottom: ins.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>

        {/* language card */}
        <View style={[$.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={$.cardHead}>
            <MaterialIcons name="translate" size={18} color={colors.secondaryText} />
            <Label style={[$.cardTitle, { color: colors.text }]}>{t.Title.language}</Label>
          </View>
          <View style={[$.divider, { backgroundColor: colors.border }]} />
          <View style={$.cardBody}>
            <Label style={[$.desc, { color: colors.secondaryText }]}>{t.Text.selectLanguage}</Label>
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
                      { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent + '0C' : 'transparent' },
                    ]}>
                    {active && <MaterialIcons name="check" size={14} color={colors.accent} />}
                    <Label style={[$.langText, { color: active ? colors.accent : colors.secondaryText }]}>
                      {label}
                    </Label>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* dark mode card */}
        <View style={[$.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[$.cardBody, $.switchRow]}>
            <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={18} color={colors.secondaryText} />
            <Label style={[$.cardTitle, { color: colors.text, flex: 1 }]}>{t.Title.darkMode}</Label>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accent }}
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
