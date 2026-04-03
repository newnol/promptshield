import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSize, spacing } from "../theme/tokens";

type Props = {
  badge?: string;
  right?: React.ReactNode;
};

export function AppHeader({ badge, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <Pressable
          style={styles.brand}
          accessibilityRole="button"
          onPress={() => router.push("/")}
        >
          <MaterialCommunityIcons
            name="shield-check"
            size={22}
            color={colors.primary}
          />
          <Text style={styles.title}>PromptShield</Text>
        </Pressable>
        {badge ? (
          <View style={styles.badge}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={14}
              color={colors.mutedForeground}
            />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.muted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
