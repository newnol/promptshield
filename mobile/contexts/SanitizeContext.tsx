import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  SanitizeOptions,
  SanitizeResult,
  sanitizeContent,
} from "../utils/sanitize";

const STORAGE_KEY = "promptshield_rule_settings_v1";

export type RuleSettings = {
  pruneApiKeys: boolean;
  redactPii: boolean;
  genericSecrets: boolean;
  disabledApiProviders: string[];
  disabledPiiCategories: string[];
};

const defaultRuleSettings: RuleSettings = {
  pruneApiKeys: true,
  redactPii: true,
  genericSecrets: false,
  disabledApiProviders: [],
  disabledPiiCategories: [],
};

export type SanitizeSession = {
  input: string;
  result: SanitizeResult;
};

type Ctx = {
  original: string;
  setOriginal: (s: string) => void;
  session: SanitizeSession | null;
  setSession: (s: SanitizeSession | null) => void;
  ruleSettings: RuleSettings;
  setRuleSettings: (r: RuleSettings) => Promise<void>;
  buildOptions: () => SanitizeOptions;
  hydrated: boolean;
};

const SanitizeCtx = createContext<Ctx | null>(null);

export function SanitizeProvider({ children }: { children: React.ReactNode }) {
  const [original, setOriginal] = useState("");
  const [session, setSession] = useState<SanitizeSession | null>(null);
  const [ruleSettings, setRuleState] =
    useState<RuleSettings>(defaultRuleSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<RuleSettings>;
          setRuleState({ ...defaultRuleSettings, ...parsed });
        }
      } catch {
        /* ignore */
      }
      setHydrated(true);
    })();
  }, []);

  const setRuleSettings = useCallback(async (r: RuleSettings) => {
    setRuleState(r);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  }, []);

  const buildOptions = useCallback((): SanitizeOptions => {
    return {
      pruneApiKeys: ruleSettings.pruneApiKeys,
      redactPii: ruleSettings.redactPii,
      genericSecrets: ruleSettings.genericSecrets,
      disabledApiProviders: ruleSettings.disabledApiProviders,
      disabledPiiCategories: ruleSettings.disabledPiiCategories,
    };
  }, [ruleSettings]);

  const value = useMemo(
    () => ({
      original,
      setOriginal,
      session,
      setSession,
      ruleSettings,
      setRuleSettings,
      buildOptions,
      hydrated,
    }),
    [
      original,
      session,
      ruleSettings,
      setRuleSettings,
      buildOptions,
      hydrated,
    ]
  );

  return (
    <SanitizeCtx.Provider value={value}>{children}</SanitizeCtx.Provider>
  );
}

export function useSanitize() {
  const v = useContext(SanitizeCtx);
  if (!v) throw new Error("useSanitize must be used within SanitizeProvider");
  return v;
}
