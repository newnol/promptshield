import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Redirect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { useSanitize } from "../contexts/SanitizeContext";
import { colors, fontSize, radius, spacing } from "../theme/tokens";

type Tab = "diff" | "original" | "sanitized";

export default function ResultsScreen() {
  const router = useRouter();
  const { session, setSession } = useSanitize();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<Tab>("diff");

  const wide = width >= 720;

  if (!session) {
    return <Redirect href="/" />;
  }

  const data = useMemo(
    () => ({
      original: session.input,
      sanitized: session.result.sanitized,
      findings: session.result.findings,
      api: session.result.apiKeyCount,
      pii: session.result.piiCount,
    }),
    [session]
  );

  const onCopySanitized = () => {
    void Clipboard.setStringAsync(data.sanitized);
  };

  const onExportFindings = () => {
    void Clipboard.setStringAsync(
      JSON.stringify(data.findings, null, 2)
    );
  };

  const onNew = () => {
    setSession(null);
    router.replace("/");
  };

  const renderBody = () => {
    if (tab === "original") {
      return (
        <ScrollView style={styles.monoScroll}>
          <Text style={styles.mono} selectable>
            {data.original}
          </Text>
        </ScrollView>
      );
    }
    if (tab === "sanitized") {
      return (
        <ScrollView style={styles.monoScroll}>
          <Text style={styles.mono} selectable>
            {data.sanitized}
          </Text>
        </ScrollView>
      );
    }
    /* diff */
    if (wide) {
      return (
        <View style={styles.diffRow}>
          <View style={styles.diffCol}>
            <Text style={styles.colLabel}>Original Content</Text>
            <ScrollView style={styles.monoScroll}>
              <Text style={styles.mono} selectable>
                {data.original}
              </Text>
            </ScrollView>
          </View>
          <View style={styles.vsep} />
          <View style={styles.diffCol}>
            <Text style={styles.colLabel}>Sanitized Output</Text>
            <ScrollView style={styles.monoScroll}>
              <Text style={styles.mono} selectable>
                {data.sanitized}
              </Text>
            </ScrollView>
          </View>
        </View>
      );
    }
    return (
      <ScrollView>
        <Text style={styles.sectionLabel}>Original</Text>
        <Text style={styles.mono} selectable>
          {data.original}
        </Text>
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
          Sanitized
        </Text>
        <Text style={styles.mono} selectable>
          {data.sanitized}
        </Text>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={["left", "right", "bottom"]}>
      <AppHeader
        badge="100% Local Processing"
        right={
          <Pressable onPress={onNew} style={styles.backBtn}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={colors.mutedForeground}
            />
            <Text style={styles.backText}>New Input</Text>
          </Pressable>
        }
      />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.tabs}>
              {(["diff", "original", "sanitized"] as const).map((t) => (
                <Pressable key={t} onPress={() => setTab(t)} style={styles.tab}>
                  <Text
                    style={[
                      styles.tabText,
                      tab === t && styles.tabTextActive,
                    ]}
                  >
                    {t === "diff"
                      ? "Diff View"
                      : t === "original"
                        ? "Original"
                        : "Sanitized"}
                  </Text>
                  {tab === t ? <View style={styles.tabUnderline} /> : null}
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.copySm} onPress={onCopySanitized}>
              <MaterialCommunityIcons
                name="content-copy"
                size={14}
                color={colors.primaryForeground}
              />
              <Text style={styles.copySmText}>Copy Sanitized</Text>
            </Pressable>
          </View>
          <View style={styles.cardBody}>{renderBody()}</View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="alert-octagon"
                size={14}
                color={colors.destructive}
              />
              <Text style={styles.statText}>{data.api} Secrets detected</Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="account-cancel"
                size={14}
                color={colors.chart2}
              />
              <Text style={styles.statText}>{data.pii} PII redacted</Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons
                name="check-circle"
                size={14}
                color={colors.primary}
              />
              <Text style={styles.statText}>Done</Text>
            </View>
          </View>
        </View>

        <View style={styles.side}>
          <View style={styles.findingsCard}>
            <View style={styles.findingsHead}>
              <Text style={styles.findingsTitle}>Detailed Findings</Text>
              <Pressable onPress={onExportFindings}>
                <Text style={styles.exportLink}>Export JSON</Text>
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              {data.findings.slice(0, 50).map((f, i) => (
                <View key={`${f.start}-${i}`} style={styles.finding}>
                  <View style={styles.findingTop}>
                    <View
                      style={[
                        styles.badge,
                        f.type === "api_key"
                          ? styles.badgeApi
                          : styles.badgePii,
                      ]}
                    >
                      <Text
                        style={
                          f.type === "api_key"
                            ? styles.badgeApiText
                            : styles.badgePiiText
                        }
                      >
                        {f.type === "api_key" ? "API" : "PII"}
                      </Text>
                    </View>
                    <Text style={styles.lineHint}>
                      Line {f.lineNumber}:{f.colNumber}
                    </Text>
                  </View>
                  <Text style={styles.findingLabel}>{f.label}</Text>
                  <Text style={styles.findingSnippet} numberOfLines={2}>
                    {f.matched}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() =>
                void Clipboard.setStringAsync(
                  data.findings
                    .map(
                      (f) =>
                        `[${f.type}] ${f.label} L${f.lineNumber}: ${f.matched}`
                    )
                    .join("\n")
                )
              }
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={16}
                color={colors.foreground}
              />
              <Text style={styles.secondaryBtnText}>Copy Findings Report</Text>
            </Pressable>
          </View>
          <Pressable style={styles.bigCta} onPress={onNew}>
            <MaterialCommunityIcons
              name="refresh"
              size={22}
              color={colors.primaryForeground}
            />
            <Text style={styles.bigCtaText}>Sanitize New Content</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: colors.mutedForeground, fontSize: fontSize.sm },
  content: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.muted + "44",
  },
  tabs: { flexDirection: "row" },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  tabText: { color: colors.mutedForeground, fontSize: fontSize.sm },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  tabUnderline: {
    marginTop: 4,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  copySm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  copySmText: {
    color: colors.primaryForeground,
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  cardBody: {
    flex: 1,
    backgroundColor: colors.input,
    minHeight: 200,
  },
  diffRow: { flex: 1, flexDirection: "row" },
  diffCol: { flex: 1 },
  vsep: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  colLabel: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 10,
    fontWeight: "700",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border + "88",
  },
  monoScroll: { flex: 1 },
  mono: {
    padding: spacing.md,
    fontFamily: "Menlo",
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.foreground,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.mutedForeground,
    paddingHorizontal: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.muted + "33",
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { color: colors.foreground, fontSize: fontSize.xs, fontWeight: "600" },
  side: { gap: spacing.lg },
  findingsCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingBottom: spacing.sm,
  },
  findingsHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  findingsTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.foreground,
  },
  exportLink: { color: colors.mutedForeground, fontSize: fontSize.xs },
  finding: {
    marginHorizontal: spacing.sm,
    marginVertical: 4,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border + "88",
    backgroundColor: colors.muted + "33",
  },
  findingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    overflow: "hidden",
  },
  badgeApi: {
    backgroundColor: colors.destructive + "22",
    borderWidth: 1,
    borderColor: colors.destructive + "44",
  },
  badgePii: {
    backgroundColor: colors.chart2 + "22",
    borderWidth: 1,
    borderColor: colors.chart2 + "44",
  },
  badgeApiText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.destructive,
  },
  badgePiiText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.chart2,
  },
  lineHint: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontFamily: "Menlo",
  },
  findingLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.foreground,
  },
  findingSnippet: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: "Menlo",
    color: colors.mutedForeground,
  },
  secondaryBtn: {
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: { fontWeight: "600", color: colors.foreground },
  bigCta: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bigCtaText: {
    color: colors.primaryForeground,
    fontWeight: "800",
    fontSize: fontSize.sm,
  },
});
