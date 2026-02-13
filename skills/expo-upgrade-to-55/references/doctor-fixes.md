# Expo Doctor Fixes (SDK 55)

## 1) app.json schema error
Symptom: field not allowed (example: `android.edgeToEdgeEnabled`).
Action: remove unsupported field, rerun doctor.

## 2) Missing peer dependency
Symptom: doctor requests a peer package (example: `react-native-worklets`).
Action:
```bash
npx expo install react-native-worklets
```

## 3) Duplicate native module versions
Symptom: doctor reports duplicate native modules (example: `expo-image-loader`).
Action:
1. Identify source:
```bash
npm ls <module-name>
```
2. Remove or replace legacy package introducing duplicate version.
3. Reinstall and rerun doctor.

## 4) i18next plural resolver warning
Symptom: missing `Intl.PluralRules` support.
Action:
```bash
npm install intl-pluralrules
```
Import once in language bootstrap file:
```js
import 'intl-pluralrules';
```

## 5) Port collision when starting Metro
Symptom: `Port 8081 is being used`.
Action:
```bash
npx expo start --port 8082
```
