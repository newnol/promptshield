import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SanitizeProvider } from "../contexts/SanitizeContext";
import { colors } from "../theme/tokens";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SanitizeProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        />
      </SanitizeProvider>
    </SafeAreaProvider>
  );
}
