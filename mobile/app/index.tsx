import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { useSanitize } from "../contexts/SanitizeContext";
import { sanitizeContent } from "../utils/sanitize";
import { colors, fontSize, radius, spacing } from "../theme/tokens";

const DOCS_URL = "https://github.com/newnol/promptshield#readme";
const REPO_URL = "https://github.com/newnol/promptshield";

export default function HomeScreen() {
  const router = useRouter();
  const {
    original,
    setOriginal,
    setSession,
    ruleSettings,
    setRuleSettings,
    buildOptions,
    hydrated,
  } = useSanitize();

  const stats = useMemo(() => {
    const lines = original.length === 0 ? 0 : original.split("\n").length;
    return { lines, chars: original.length };
  }, [original]);

  const onSanitize = () => {
    const result = sanitizeContent(original, buildOptions());
    setSession({ input: original, result });
    router.push("/results");
  };

  const onPaste = async () => {
    const t = await Clipboard.getStringAsync();
    if (t) setOriginal(original + t);
  };

  const onPickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: "text/*",
    });
    if (res.canceled || !res.assets?.[0]) return;
    const uri = res.assets[0].uri;
    const text = await FileSystem.readAsStringAsync(uri);
    setOriginal(text);
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["left", "right", "bottom"]}>
      <AppHeader
        badge="100% Local Processing"
        right={
          <View style={styles.headerLinks}>
            <Pressable
              onPress={() => Linking.openURL(DOCS_URL)}
              accessibilityRole="link"
            >
              <Text style={styles.link}>Documentation</Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL(REPO_URL)}
              style={styles.gh}
              accessibilityRole="link"
            >
              <MaterialCommunityIcons
                name="github"
                size={18}
                color={colors.mutedForeground}
              />
              <Text style={styles.link}>GitHub</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/rules")}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="cog-outline"
                size={22}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainRow}>
          <View style={styles.inputCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={18}
                  color={colors.mutedForeground}
                />
                <Text style={styles.cardTitle}>Raw Input</Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable onPress={onPickFile} style={styles.miniBtn}>
                  <MaterialCommunityIcons
                    name="upload"
                    size={14}
                    color={colors.mutedForeground}
                  />
                  <Text style={styles.miniBtnText}>Upload</Text>
                </Pressable>
                <View style={styles.sep} />
                <Pressable onPress={onPaste} style={styles.miniBtn}>
                  <MaterialCommunityIcons
                    name="content-paste"
                    size={14}
                    color={colors.mutedForeground}
                  />
                  <Text style={styles.miniBtnText}>Paste</Text>
                </Pressable>
              </View>
            </View>
            <TextInput
              style={styles.textarea}
              multiline
              value={original}
              onChangeText={setOriginal}
              placeholderTextColor={colors.mutedForeground + "99"}
              placeholder='Paste prompt, logs, or JSON…'
              textAlignVertical="top"
            />
            <View style={styles.cardFooter}>
              <Text style={styles.footerMeta}>
                {stats.lines} lines · {stats.chars} chars
              </Text>
              <Pressable onPress={() => router.push("/about")}>
                <Text style={styles.footerLink}>Privacy</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.side}>
            <View style={styles.panel}>
              <View style={styles.panelHead}>
                <MaterialCommunityIcons
                  name="tune"
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.panelTitle}>Sanitization Rules</Text>
              </View>
              <RuleRow
                title="Prune API Keys"
                subtitle="OpenAI, AWS, Stripe, …"
                value={ruleSettings.pruneApiKeys}
                onValueChange={(v) =>
                  void setRuleSettings({ ...ruleSettings, pruneApiKeys: v })
                }
              />
              <RuleRow
                title="Redact PII"
                subtitle="Emails, phones, SSNs, …"
                value={ruleSettings.redactPii}
                onValueChange={(v) =>
                  void setRuleSettings({ ...ruleSettings, redactPii: v })
                }
              />
              <RuleRow
                title="Generic Secrets"
                subtitle="Labeled keys, JWT-like tokens"
                value={ruleSettings.genericSecrets}
                onValueChange={(v) =>
                  void setRuleSettings({ ...ruleSettings, genericSecrets: v })
                }
              />
              <Pressable style={styles.cta} onPress={onSanitize}>
                <MaterialCommunityIcons
                  name="magic-staff"
                  size={18}
                  color={colors.primaryForeground}
                />
                <Text style={styles.ctaText}>Sanitize Content</Text>
              </Pressable>
            </View>

            <View style={styles.audit}>
              <View style={styles.panelHead}>
                <MaterialCommunityIcons
                  name="radar"
                  size={18}
                  color={colors.foreground}
                />
                <Text style={styles.panelTitle}>Live Audit</Text>
              </View>
              <View style={styles.auditEmpty}>
                <MaterialCommunityIcons
                  name="shield-lock-outline"
                  size={40}
                  color={colors.mutedForeground + "88"}
                />
                <Text style={styles.auditTitle}>Awaiting input</Text>
                <Text style={styles.auditSub}>
                  Run Sanitize to scan locally. Data stays on device.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RuleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.ruleRow}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={styles.ruleTitle}>{title}</Text>
        <Text style={styles.ruleSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary + "88" }}
        thumbColor={value ? colors.primaryForeground : colors.mutedForeground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  headerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  link: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  gh: { flexDirection: "row", alignItems: "center", gap: 4 },
  mainRow: { gap: spacing.lg },
  inputCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    minHeight: 280,
    overflow: "hidden",
  },
  cardHeader: {
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.muted + "55",
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 6 },
  miniBtnText: { color: colors.mutedForeground, fontSize: fontSize.xs },
  sep: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
  },
  textarea: {
    minHeight: 200,
    padding: spacing.md,
    color: colors.foreground,
    fontFamily: "Menlo",
    fontSize: fontSize.sm,
    lineHeight: 20,
    backgroundColor: colors.input,
  },
  cardFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.muted + "44",
  },
  footerMeta: { color: colors.mutedForeground, fontSize: fontSize.xs },
  footerLink: { color: colors.primary, fontSize: fontSize.xs, fontWeight: "600" },
  side: { gap: spacing.lg },
  panel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  panelHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.xs,
  },
  panelTitle: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  ruleTitle: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  ruleSub: { color: colors.mutedForeground, fontSize: fontSize.xs, marginTop: 2 },
  cta: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    color: colors.primaryForeground,
    fontWeight: "700",
    fontSize: fontSize.sm,
  },
  audit: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    minHeight: 180,
  },
  auditEmpty: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  auditTitle: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  auditSub: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    textAlign: "center",
    maxWidth: 260,
  },
});
