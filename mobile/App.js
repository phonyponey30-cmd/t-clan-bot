import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler, Alert, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View, useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { INVITE, RULES, SAFETY, TOUR, INTRO, PARENT } from './content';

const STORAGE_KEY = 'tclan-onboarding-v1';
const STEPS = ['get', 'join', 'rules', 'verify', 'safety', 'tour', 'hello', 'done'];

const LIGHT = { bg: '#f7f4fc', card: '#ffffff', ink: '#1d1730', muted: '#5b5473', line: '#e2dcf0', brand: '#6d3fc0', onBrand: '#ffffff', soft: '#efe8fb', warn: '#8a5a00', warnBg: '#fff4d6' };
const DARK = { bg: '#14101f', card: '#1e1830', ink: '#f2eefc', muted: '#b4abcf', line: '#352b52', brand: '#a07cf0', onBrand: '#14101f', soft: '#2a2145', warn: '#ffd36b', warnBg: '#3a2e10' };

// ---------- helpers ----------
// Renders `code` and **bold** inline segments.
function Rich({ children, style, c }) {
  const parts = String(children).split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((p, i) => p.startsWith('`')
        ? <Text key={i} style={{ fontWeight: '700', backgroundColor: c.soft }}>{p.slice(1, -1)}</Text>
        : p.startsWith('**')
          ? <Text key={i} style={{ fontWeight: '800' }}>{p.slice(2, -2)}</Text>
          : p)}
    </Text>
  );
}

function useStyles(c) {
  return useMemo(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
    iconBtn: { minWidth: 44, minHeight: 44, borderRadius: 12, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' },
    iconTxt: { fontSize: 20, color: c.ink },
    track: { flex: 1, height: 10, borderRadius: 99, backgroundColor: c.soft, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: c.brand, borderRadius: 99 },
    scroll: { padding: 16, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
    hero: { fontSize: 56, marginTop: 20 },
    h1: { fontSize: 32, fontWeight: '800', color: c.ink, marginTop: 8, marginBottom: 6 },
    h2: { fontSize: 24, fontWeight: '800', color: c.ink, marginTop: 6, marginBottom: 6 },
    h3: { fontSize: 17, fontWeight: '800', color: c.ink, marginTop: 18, marginBottom: 4 },
    p: { fontSize: 17, lineHeight: 25, color: c.ink, marginVertical: 6 },
    muted: { fontSize: 15, lineHeight: 22, color: c.muted, marginVertical: 6 },
    card: { backgroundColor: c.card, borderColor: c.line, borderWidth: 1, borderRadius: 18, padding: 16, marginVertical: 10 },
    btn: { minHeight: 52, borderRadius: 14, borderWidth: 2, borderColor: c.brand, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 12, marginVertical: 8 },
    btnAlt: { backgroundColor: 'transparent' },
    btnOff: { opacity: 0.4 },
    btnTxt: { fontSize: 17, fontWeight: '700', color: c.onBrand, textAlign: 'center' },
    btnAltTxt: { color: c.brand },
    choice: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginVertical: 8, borderRadius: 18, borderWidth: 2, borderColor: c.line, backgroundColor: c.card },
    choiceEm: { fontSize: 32 },
    choiceT: { fontSize: 17, fontWeight: '800', color: c.ink },
    choiceS: { fontSize: 14, color: c.muted },
    check: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, marginVertical: 6, borderRadius: 14, borderWidth: 2, borderColor: c.line, backgroundColor: c.card },
    box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: c.brand, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
    boxOn: { backgroundColor: c.brand },
    tick: { color: c.onBrand, fontWeight: '900', fontSize: 16 },
    note: { backgroundColor: c.warnBg, borderRadius: 14, padding: 14, marginVertical: 10 },
    noteTxt: { color: c.warn, fontSize: 16, lineHeight: 23 },
    tip: { backgroundColor: c.soft, borderRadius: 14, padding: 14, marginVertical: 10 },
    li: { flexDirection: 'row', gap: 8, marginVertical: 4 },
    acc: { backgroundColor: c.card, borderColor: c.line, borderWidth: 1, borderRadius: 14, marginVertical: 6, overflow: 'hidden' },
    accHead: { minHeight: 48, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    accTitle: { fontSize: 17, fontWeight: '700', color: c.ink },
    accBody: { paddingHorizontal: 14, paddingBottom: 14 },
    tpl: { backgroundColor: c.soft, borderRadius: 14, padding: 14, marginVertical: 10 },
    badge: { alignItems: 'center', paddingVertical: 24 },
  }), [c]);
}

// ---------- reusable pieces ----------
function Btn({ label, onPress, alt, disabled, st }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }}
      disabled={disabled} onPress={onPress}
      style={({ pressed }) => [st.btn, alt && st.btnAlt, disabled && st.btnOff, pressed && { opacity: 0.8 }]}>
      <Text style={[st.btnTxt, alt && st.btnAltTxt]}>{label}</Text>
    </Pressable>
  );
}
function Check({ label, on, onToggle, st, c }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onToggle} style={st.check}>
      <View style={[st.box, on && st.boxOn]}>{on ? <Text style={st.tick}>✓</Text> : null}</View>
      <Rich style={[st.p, { flex: 1, marginVertical: 0 }]} c={c}>{label}</Rich>
    </Pressable>
  );
}
function Bullets({ items, st, c }) {
  return items.map((t, i) => (
    <View key={i} style={st.li}><Text style={st.p}>•</Text><Rich style={[st.p, { flex: 1, marginVertical: 0 }]} c={c}>{t}</Rich></View>
  ));
}
function Accordion({ title, body, st, c }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={st.acc}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(o => !o)} style={st.accHead}>
        <Text style={st.accTitle}>{title}</Text><Text style={st.accTitle}>{open ? '–' : '+'}</Text>
      </Pressable>
      {open ? <View style={st.accBody}><Rich style={st.p} c={c}>{body}</Rich></View> : null}
    </View>
  );
}
const openUrl = url => Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));

// ---------- app ----------
function Main() {
  const scheme = useColorScheme();
  const c = scheme === 'dark' ? DARK : LIGHT;
  const st = useStyles(c);
  const insets = useSafeAreaInsets();
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState('welcome');
  const [mode, setMode] = useState(null); // 'adult' | 'teen'
  const [checks, setChecks] = useState({});
  const trail = useRef([]);
  const scroller = useRef(null);

  // restore progress (device-only; storage failure is non-fatal)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      try {
        const s = JSON.parse(raw || '{}');
        if (s.mode && STEPS.includes(s.screen)) { setMode(s.mode); setScreen(s.screen); }
        if (s.checks) setChecks(s.checks);
      } catch (e) {}
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ screen, mode, checks })).catch(() => {});
  }, [ready, screen, mode, checks]);

  const go = useCallback(next => { trail.current.push(screen); setScreen(next); scroller.current?.scrollTo({ y: 0, animated: false }); }, [screen]);
  const back = useCallback(() => {
    const prev = trail.current.pop();
    setScreen(prev || 'welcome'); scroller.current?.scrollTo({ y: 0, animated: false });
    return true;
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => (screen === 'welcome' ? false : back()));
    return () => sub.remove();
  }, [screen, back]);

  const restart = () => Alert.alert('Start over?', 'This clears your progress on this device.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Start over', style: 'destructive', onPress: () => { trail.current = []; setMode(null); setChecks({}); setScreen('welcome'); } },
  ]);
  const toggle = k => setChecks(p => ({ ...p, [k]: !p[k] }));
  const nextStep = () => go(STEPS[STEPS.indexOf(screen) + 1]);
  const teen = mode === 'teen';
  const stepIdx = STEPS.indexOf(screen);
  const allOn = keys => keys.every(k => checks[k]);

  const ChecksNext = ({ keys }) => <Btn st={st} label="Continue" disabled={!allOn(keys)} onPress={nextStep} />;

  const screens = {
    welcome: () => (<>
      <Text style={st.hero}>🎉</Text>
      <Text style={st.h1} accessibilityRole="header">Welcome to The T Clan!</Text>
      <Text style={st.muted}>A friendly TikTok creator community on Discord. This 5-minute guide gets you set up safely, whether you are a teen, an adult, or a parent.</Text>
      <Btn st={st} label="Let's go" onPress={() => go('who')} />
      <Text style={st.muted}>We don't ask for your name or email here. Your progress is saved only on this device.</Text>
    </>),
    who: () => (<>
      <Text style={st.h2} accessibilityRole="header">Who is joining?</Text>
      <Text style={st.muted}>This helps us show the right safety tips. You are not asked for a birthday.</Text>
      {[
        ['🧑', "I'm 18 or older", 'Adult member', () => { setMode('adult'); go('get'); }],
        ['🧒', "I'm 13 to 17", 'Teen member, with extra safety tips', () => { setMode('teen'); go('get'); }],
        ['🐥', "I'm under 13", "Let's get a grown-up", () => { setMode(null); go('under13'); }],
        ['👪', "I'm a parent or guardian", 'See how we keep the server safe', () => { setMode(null); go('parent'); }],
      ].map(([em, t, s, fn]) => (
        <Pressable key={t} accessibilityRole="button" accessibilityLabel={`${t}. ${s}`} onPress={fn} style={st.choice}>
          <Text style={st.choiceEm}>{em}</Text>
          <View style={{ flex: 1 }}><Text style={st.choiceT}>{t}</Text><Text style={st.choiceS}>{s}</Text></View>
        </Pressable>
      ))}
    </>),
    under13: () => (<>
      <Text style={st.hero}>🐥</Text>
      <Text style={st.h2} accessibilityRole="header">Thanks for stopping by!</Text>
      <Text style={st.p}>Discord is only for people <Text style={{ fontWeight: '800' }}>13 and older</Text>, so we can't help you join yet. That rule keeps kids safe, and it's a good one.</Text>
      <View style={st.tip}><Text style={st.p}>👉 Show this screen to a parent or guardian. They can read how our server works and decide what's best for your family.</Text></View>
      <Btn st={st} label="Open the grown-up guide" onPress={() => go('parent')} />
      <Btn st={st} alt label="Back" onPress={back} />
    </>),
    parent: () => (<>
      <Text style={st.h2} accessibilityRole="header">Guide for parents and guardians</Text>
      <Text style={st.p}>The T Clan is a community for TikTok creators. Members range from teens to adults, so we built in protections.</Text>
      <Text style={st.h3}>What the server does</Text>
      <Bullets items={PARENT.server} st={st} c={c} />
      <Text style={st.h3}>Do this on your teen's account</Text>
      <Bullets items={PARENT.account} st={st} c={c} />
      <View style={st.note}><Text style={st.noteTxt}>No automated system is perfect. Talk with your teen about never sharing personal info and always telling you if something feels off.</Text></View>
      <Btn st={st} alt label="Discord Family Center info ↗" onPress={() => openUrl(PARENT.familyCenterUrl)} />
      <Btn st={st} alt label="Back to start" onPress={() => { trail.current = []; setScreen('welcome'); }} />
    </>),
    get: () => (<>
      <Text style={st.h2} accessibilityRole="header">1. Get Discord</Text>
      <Text style={st.p}>You need a free Discord account. Pick a nickname that is <Text style={{ fontWeight: '800' }}>not your real full name</Text>{teen ? " and doesn't reveal your school or town" : ''}.</Text>
      <Btn st={st} label="Open Discord download ↗" onPress={() => openUrl('https://discord.com/download')} />
      <Check st={st} c={c} on={!!checks.hasDiscord} onToggle={() => toggle('hasDiscord')} label="I have Discord installed and I'm logged in" />
      {teen ? <View style={st.tip}><Text style={st.p}>💡 Use a strong password you don't use anywhere else, and turn on two-factor login if a parent can help.</Text></View> : null}
      <ChecksNext keys={['hasDiscord']} />
    </>),
    join: () => (<>
      <Text style={st.h2} accessibilityRole="header">2. Join the server</Text>
      <Text style={st.p}>Tap the button. Discord opens and asks you to accept the invite.</Text>
      <Btn st={st} label="Join The T Clan ↗" onPress={() => openUrl(INVITE)} />
      <Rich style={st.muted} c={c}>{'Invite link: `discord.gg/KG4b6n8ZdC`. Only trust this exact link. Staff will never DM you a different one.'}</Rich>
      <Check st={st} c={c} on={!!checks.joined} onToggle={() => toggle('joined')} label="I joined and can see the server" />
      <ChecksNext keys={['joined']} />
    </>),
    rules: () => {
      const list = [...RULES.common, ...RULES[teen ? 'teen' : 'adult']];
      const keys = list.map((_, i) => 'rule' + i);
      return (<>
        <Text style={st.h2} accessibilityRole="header">3. House rules</Text>
        <Rich style={st.p} c={c}>{'The full rules live in `#rules`. These are the big ones:'}</Rich>
        {list.map((r, i) => <Check key={i} st={st} c={c} on={!!checks[keys[i]]} onToggle={() => toggle(keys[i])} label={r} />)}
        <ChecksNext keys={keys} />
      </>);
    },
    verify: () => (<>
      <Text style={st.h2} accessibilityRole="header">4. Verify yourself</Text>
      <Rich style={st.p} c={c}>{"Right now you're in the `👋 Unverified` role. To unlock the server:"}</Rich>
      <Bullets st={st} c={c} items={['Open `#verify`', 'Tap the ✅ reaction on the message', 'You become a `🐣 Member` and the other channels appear']} />
      <View style={st.tip}><Rich style={st.p} c={c}>{"Don't see it? Pull to refresh Discord, or open a ticket in `#help-support`."}</Rich></View>
      <Check st={st} c={c} on={!!checks.verified} onToggle={() => toggle('verified')} label="I'm verified and can see all channels" />
      <ChecksNext keys={['verified']} />
    </>),
    safety: () => {
      const items = SAFETY[teen ? 'teen' : 'adult'];
      const keys = items.map(([k]) => 'safe_' + k);
      return (<>
        <Text style={st.h2} accessibilityRole="header">5. Stay safe</Text>
        <Text style={st.p}>Two minutes now saves headaches later.</Text>
        {items.map(([k, t]) => <Check key={k} st={st} c={c} on={!!checks['safe_' + k]} onToggle={() => toggle('safe_' + k)} label={t} />)}
        <View style={st.note}><Text style={st.noteTxt}>🚩 Red flags: asking for personal info, moving to another app, gifts or money, "don't tell anyone". Stop, screenshot, and report.</Text></View>
        <ChecksNext keys={keys} />
      </>);
    },
    tour: () => (<>
      <Text style={st.h2} accessibilityRole="header">6. Quick tour</Text>
      <Text style={st.p}>Tap a section to peek inside.</Text>
      {TOUR.map(([t, d]) => <Accordion key={t} title={t} body={d} st={st} c={c} />)}
      <Btn st={st} label="Continue" onPress={nextStep} />
    </>),
    hello: () => {
      const text = INTRO[teen ? 'teen' : 'adult'];
      return (<>
        <Text style={st.h2} accessibilityRole="header">7. Say hi 👋</Text>
        <Rich style={st.p} c={c}>{'Introduce yourself in `#introduce-yourself`. Copy this and fill in the brackets (no personal details needed!):'}</Rich>
        <View style={st.tpl}><Text style={st.p} selectable>{text}</Text></View>
        <Btn st={st} alt label="Copy message" onPress={async () => { try { await Clipboard.setStringAsync(text); Alert.alert('Copied!'); } catch (e) { Alert.alert('Press and hold the text to copy'); } }} />
        <Btn st={st} label="I said hi!" onPress={nextStep} />
        <Btn st={st} alt label="Skip for now" onPress={nextStep} />
      </>);
    },
    done: () => (<>
      <View style={[st.card, st.badge]}>
        <Text style={st.hero}>🏅</Text>
        <Text style={st.h1} accessibilityRole="header">You're all set!</Text>
        <Text style={st.p}>Welcome to the clan. You've earned the Onboarding Complete badge.</Text>
      </View>
      <Text style={st.h3}>What next?</Text>
      <Bullets st={st} c={c} items={['Post your first video in `#post-your-tiktok`', 'Register for live pings in `#tiktok-live`', 'Chat to earn XP and check `/rank`']} />
      <Btn st={st} label="Open Discord ↗" onPress={() => openUrl(INVITE)} />
      <Btn st={st} alt label="Invite a friend" onPress={() => Share.share({ message: `Join The T Clan on Discord! ${INVITE}`, url: INVITE }).catch(() => {})} />
      <Btn st={st} alt label="See the parent guide" onPress={() => go('parent')} />
    </>),
  };

  if (!ready) return <View style={st.root} />;
  return (
    <View style={[st.root, { paddingTop: insets.top, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {stepIdx >= 0 ? (
        <View style={st.topbar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={back} style={st.iconBtn}><Text style={st.iconTxt}>←</Text></Pressable>
          <View style={st.track} accessibilityRole="progressbar" accessibilityLabel="Setup progress"
            accessibilityValue={{ min: 0, max: 100, now: Math.round((stepIdx / (STEPS.length - 1)) * 100) }}>
            <View style={[st.fill, { width: `${(stepIdx / (STEPS.length - 1)) * 100}%` }]} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Start over" onPress={restart} style={st.iconBtn}><Text style={st.iconTxt}>⟲</Text></Pressable>
        </View>
      ) : null}
      <ScrollView ref={scroller} contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
        {(screens[screen] || screens.welcome)()}
      </ScrollView>
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><Main /></SafeAreaProvider>;
}
