# PromptShield (Expo / React Native)

Client-side sanitization UI aligned with the Sleek design tokens (dark theme, primary `#00E5C0`).

## Run

```bash
cd mobile
npm install
npx expo start
```

Then open in **iOS Simulator**, **Android emulator**, or **Expo Go**.

## Stack

- **expo-router** — `app/` file routes (`/`, `/results`, `/rules`, `/about`)
- **StyleSheet** + theme tokens in `theme/tokens.ts`
- **Sanitize engine** in `utils/sanitize.ts` (bundled `assets/api_key_rules.json`, same schema as the Python detector)
- **AsyncStorage** — rule toggles and per-provider disables

## Sync API key rules from the Python source

From the repo root:

```bash
python3 scripts/sync_api_key_rules.py
cp src/promptshield/detector/api_key_rules.json mobile/assets/api_key_rules.json
```

(Or copy `web/api_key_rules.json` after sync.)
