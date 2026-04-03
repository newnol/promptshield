import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { colors, fontSize, radius, spacing } from "../theme/tokens";

const REPO = "https://github.com/newnol/promptshield";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AboutScreen() {
  const router = useRouter();
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "1.0.0";

  const [open, setOpen] = useState<string | null>(null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.root} edges={["left", "right", "bottom"]}>
      <AppHeader
        right={
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>Back to Tool</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons
            name="shield-key"
            size={40}
            color={colors.primary}
          />
        </View>
        <Text style={styles.heroTitle}>Privacy, by Design.</Text>
        <Text style={styles.heroLead}>
          PromptShield helps prevent sensitive credentials from leaking into LLM
          prompts or shared logs.
        </Text>

        <View style={styles.card}>
          <Text style={styles.h2}>How we handle your data</Text>
          <Text style={styles.p}>
            This app processes text on-device. No PromptShield server receives
            your pasted content.
          </Text>
          <Bullet
            icon="network-off"
            title="No network required for scanning"
            body="Rules are bundled; processing runs in your app runtime."
          />
          <Bullet
            icon="cellphone-off"
            title="Client-side"
            body="Designed for offline-first use after the app bundle is installed."
          />
          <Bullet
            icon="eye-off"
            title="No content analytics"
            body="We do not collect your prompts for training."
          />
        </View>

        <Text style={styles.h2}>The Process</Text>
        <View style={styles.steps}>
          <Step
            n="01"
            title="Rule Loading"
            body="Regex patterns are loaded from bundled rule definitions."
          />
          <Step
            n="02"
            title="Local Scan"
            body="Input is scanned in memory on your device."
          />
          <Step
            n="03"
            title="Redaction"
            body="Matches are replaced with semantic placeholders."
          />
        </View>

        <Text style={styles.h2}>FAQ</Text>
        <Faq
          id="private"
          open={open}
          toggle={toggle}
          q="Is PromptShield private?"
          a="You can verify network requests in your OS network tools. This build does not ship telemetry to PromptShield."
        />
        <Faq
          id="oss"
          open={open}
          toggle={toggle}
          q="Is the source code available?"
          a="See the open-source repository on GitHub."
        />
        <Faq
          id="batch"
          open={open}
          toggle={toggle}
          q="Batch processing?"
          a="Use the file picker on the home screen to load large text files."
        />

        <View style={styles.footer}>
          <Text style={styles.versionText}>
            Version {version} · Open Source
          </Text>
          <Pressable onPress={() => Linking.openURL(REPO)}>
            <MaterialCommunityIcons
              name="github"
              size={28}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bullet({
  icon,
  title,
  body,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.bullet}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={colors.primary}
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.bulletTitle}>{title}</Text>
        <Text style={styles.p}>{body}</Text>
      </View>
    </View>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: string;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepNum}>{n}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepBody}>{body}</Text>
    </View>
  );
}

function Faq({
  id,
  open,
  toggle,
  q,
  a,
}: {
  id: string;
  open: string | null;
  toggle: (id: string) => void;
  q: string;
  a: string;
}) {
  const expanded = open === id;
  return (
    <View style={styles.faq}>
      <Pressable onPress={() => toggle(id)} style={styles.faqQ}>
        <Text style={styles.faqQText}>{q}</Text>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={22}
          color={colors.mutedForeground}
        />
      </Pressable>
      {expanded ? <Text style={styles.faqA}>{a}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  back: { color: colors.mutedForeground, fontSize: fontSize.sm },
  scroll: { padding: spacing.lg, paddingBottom: 48, maxWidth: 720, alignSelf: "center", width: "100%" },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + "22",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.foreground,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  heroLead: {
    fontSize: fontSize.lg,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    marginBottom: spacing.xl,
  },
  h2: {
    fontSize: fontSize.xl,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  p: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bullet: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bulletTitle: {
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 4,
    fontSize: fontSize.sm,
  },
  steps: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  step: { flex: 1, minWidth: 160 },
  stepNum: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  stepTitle: {
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 4,
    fontSize: fontSize.sm,
  },
  stepBody: { fontSize: fontSize.xs, color: colors.mutedForeground, lineHeight: 18 },
  faq: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  faqQ: {
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  faqQText: { flex: 1, fontWeight: "600", color: colors.foreground },
  faqA: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    lineHeight: 20,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: "center",
    gap: spacing.md,
  },
  versionText: { fontSize: fontSize.xs, color: colors.mutedForeground },
});
