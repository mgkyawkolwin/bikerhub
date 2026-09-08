import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Switch, ScrollView, Text, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useThemeContext } from '@/hooks/use-theme-context';
import { useI18n } from '@/i18n';
import appJson from '../app.json';

export default function SettingsScreen() {
  const ins = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useThemeContext();
  const { t, locale, setLocale, availableLocales, getLocaleDisplayName } = useI18n();
  const [showLangModal, setShowLangModal] = useState(false);

  const appVersion = appJson.expo.version;

  return (
    <View style={[$.root, { backgroundColor: colors.background }]}>

      {/* header */}
      <View style={[$.header, { paddingTop: ins.top + 8 }]}>
        <TouchableOpacity hitSlop={14} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[$.title, { color: colors.text }]}>{t.Title.settings}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[$.scroll, { paddingBottom: ins.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>

        {/* language card */}
        <View style={[$.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={[$.cardBody, $.switchRow]}> 
            <MaterialIcons name="translate" size={18} color={colors.secondaryText} />
            <Text style={[$.cardTitle, { color: colors.text, flex: 1 }]}>{t.Title.language}</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowLangModal(true)}
              style={[
                $.langSelect,
                { },
              ]}
            >
              <Text style={[$.langText, { color: colors.text }]}>{getLocaleDisplayName(locale)}</Text>
            </TouchableOpacity>
          </View>

          <Modal animationType="slide" transparent visible={showLangModal} onRequestClose={() => setShowLangModal(false)}>
            <View style={[stylesModal.modalBackdrop]}> 
              <View style={[stylesModal.modalContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}> 
                <View style={[stylesModal.modalHeader, { borderBottomColor: colors.border }]}> 
                  <Text style={[stylesModal.modalTitle, { color: colors.text }]}>Select language</Text>
                  <TouchableOpacity onPress={() => setShowLangModal(false)} hitSlop={14}>
                    <MaterialIcons name="close" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={stylesModal.modalBody}>
                    {availableLocales.map((code) => {
                      const label = getLocaleDisplayName(code as any);
                      const active = locale === code;
                    return (
                      <TouchableOpacity
                        key={code}
                        onPress={() => { setLocale(code); setShowLangModal(false); }}
                        style={[stylesModal.optionRow, { borderBottomColor: colors.border }]}
                      >
                          <Text style={[stylesModal.optionText, { color: colors.text }]}>{label}</Text>
                        {active ? <MaterialIcons name="check" size={20} color={colors.accent} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </Modal>
        </View>

        {/* dark mode card */}
        <View style={[$.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[$.cardBody, $.switchRow]}>
            <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={18} color={colors.secondaryText} />
            <Text style={[$.cardTitle, { color: colors.text, flex: 1 }]}>{t.Title.darkMode}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>
      <View style={[$.versionContainer, { bottom: ins.bottom + 16 }]}> 
        <Text style={[$.version, { color: colors.secondaryText }]}>Version {appVersion}</Text>
      </View>
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
  scroll: { paddingHorizontal: 12, paddingTop: 8, gap: 8, paddingBottom: 64 },
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
  langSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  versionContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    fontWeight: '500',
  },
});

const stylesModal = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    maxHeight: '50%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalBody: { padding: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  optionText: { fontSize: 15, fontWeight: '600' },
});
