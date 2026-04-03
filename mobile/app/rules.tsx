import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { useSanitize } from "../contexts/SanitizeContext";
import { colors, fontSize, radius, spacing } from "../theme/tokens";

const API_ITEMS: { key: string; title: string; desc: string }[] = [
  {
    key: "openai",
    title: "OpenAI API Keys",
    desc: "Detects sk-... patterns used by OpenAI.",
  },
  {
    key: "telegram_bot",
    title: "Telegram Bot Tokens",
    desc: "Detects bot id : token format.",
  },
  {
    key: "aws",
    title: "AWS Access Keys",
    desc: "Detects AKIA/ASIA style keys.",
  },
];

const PII_ITEMS: { key: string; title: string; desc: string }[] = [
  {
    key: "email",
    title: "Email Addresses",
    desc: "Common email patterns.",
  },
  {
    key: "phone",
    title: "Phone Numbers",
    desc: "International and local formats.",
  },
  {
    key: "credit_card",
    title: "Credit Card Numbers",
    desc: "13–16 digit sequences.",
  },
];

function toggleList(list: string[], key: string, enabled: boolean): string[] {
  if (enabled) return list.filter((k) => k !== key);
  if (list.includes(key)) return list;
  return [...list, key];
}

export default function RulesScreen() {
  const router = useRouter();
  const { ruleSettings, setRuleSettings } = useSanitize();
  const [apiOff, setApiOff] = useState<string[]>([]);
  const [piiOff, setPiiOff] = useState<string[]>([]);

  useEffect(() => {
    setApiOff(ruleSettings.disabledApiProviders ?? []);
    setPiiOff(ruleSettings.disabledPiiCategories ?? []);
  }, [ruleSettings]);

  const onSave = async () => {
    await setRuleSettings({
      ...ruleSettings,
      disabledApiProviders: apiOff,
      disabledPiiCategories: piiOff,
    });
    router.back();
  };

  const onReset = async () => {
    setApiOff([]);
    setPiiOff([]);
    await setRuleSettings({
      ...ruleSettings,
      disabledApiProviders: [],
      disabledPiiCategories: [],
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={["left", "right", "bottom"]}>
      <AppHeader
        badge="Settings saved locally"
        right={
          <Pressable onPress={() => router.back()}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Sanitization Rules</Text>
        <Text style={styles.lead}>
          Configure detection locally. Rules use regex pattern matching; no data
          is sent to a server.
        </Text>

        <View style={styles.sectionHead}>
          <MaterialCommunityIcons
            name="key-variant"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.h2}>API & Secret Keys</Text>
        </View>
        {API_ITEMS.map((item) => (
          <View key={item.key} style={styles.card}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={!apiOff.includes(item.key)}
              onValueChange={(on) =>
                setApiOff((prev) => toggleList(prev, item.key, on))
              }
              trackColor={{ false: colors.border, true: colors.primary + "88" }}
              thumbColor={
                !apiOff.includes(item.key)
                  ? colors.primaryForeground
                  : colors.mutedForeground
              }
            />
          </View>
        ))}

        <View style={[styles.sectionHead, { marginTop: spacing.xl }]}>
          <MaterialCommunityIcons
            name="card-account-details"
            size={20}
            color={colors.chart2}
          />
          <Text style={styles.h2}>Personally Identifiable Information</Text>
        </View>
        {PII_ITEMS.map((item) => (
          <View key={item.key} style={styles.card}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={!piiOff.includes(item.key)}
              onValueChange={(on) =>
                setPiiOff((prev) => toggleList(prev, item.key, on))
              }
              trackColor={{ false: colors.border, true: colors.primary + "88" }}
              thumbColor={
                !piiOff.includes(item.key)
                  ? colors.primaryForeground
                  : colors.mutedForeground
              }
            />
          </View>
        ))}

        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={() => void onSave()}>
            <Text style={styles.primaryText}>Save Rule Changes</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => void onReset()}>
            <Text style={styles.secondaryText}>Reset to Defaults</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  close: { color: colors.mutedForeground, fontSize: fontSize.sm },
  scroll: { padding: spacing.lg, paddingBottom: 48, maxWidth: 720, alignSelf: "center", width: "100%" },
  h1: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  lead: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  h2: { fontSize: fontSize.lg, fontWeight: "700", color: colors.foreground },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.foreground,
  },
  cardDesc: { fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 4 },
  actions: { marginTop: spacing.lg, gap: spacing.md },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: colors.primaryForeground, fontWeight: "800" },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  secondaryText: { color: colors.mutedForeground, fontWeight: "600" },
});
