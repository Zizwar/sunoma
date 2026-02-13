---
name: expo-upgrade-to-55
description: Upgrade Expo projects to SDK 55 safely and reproducibly. Use when a project is on an older Expo SDK and needs migration to SDK 55 (stable or preview), dependency alignment, expo-doctor cleanup, and common issue fixes (app config schema errors, missing peer dependencies, duplicate native modules, or i18next Intl.PluralRules errors).
---

# Expo Upgrade To 55

## Quick Workflow
1. Check current Expo publish tags and project state.
2. Choose upgrade target (`latest` if SDK 55 is stable, otherwise `next` preview).
3. Upgrade Expo and run dependency alignment.
4. Run `expo-doctor`, fix all issues, rerun until fully green.
5. Verify final SDK and run the app.
6. Update docs and commit.

## Step 1: Preflight
Run:
```bash
node -v
npm view expo version
npm view expo dist-tags --json
git status --short
```
If worktree is dirty, commit or coordinate with existing changes before migration.

## Step 2: Select Install Channel
- If `latest` is SDK 55: use `expo@latest`.
- If SDK 55 is preview-only: use `expo@next`.

Run one of:
```bash
npm install expo@latest
```
or
```bash
npm install expo@next
```

## Step 3: Align Dependencies
Run:
```bash
npx expo install --fix
```
Then run:
```bash
npx expo-doctor
```

## Step 4: Fix Until Doctor Is Green
Handle common failures:
- App config schema errors in `app.json`/`app.config`.
- Missing peer deps (example: `react-native-worklets` for reanimated).
- Duplicate native modules (remove old/unused packages causing nested versions).
- i18next plural warnings (`Intl.PluralRules`) by adding polyfill.

Use the detailed fix playbook in `references/doctor-fixes.md`.

## Step 5: Verify Final State
Run:
```bash
CI=1 npx expo config --json
npx expo-doctor
npm start
```
Confirm:
- `sdkVersion` is `55.0.0`
- `expo-doctor` reports no issues
- Metro starts without runtime crash

## Step 6: Document + Commit
Update README with SDK channel (`latest` vs `preview`) and validation commands used.

Commit pattern:
```bash
git add .
git commit -m "Upgrade to Expo SDK 55 and fix compatibility issues"
```

## Output Expectations
After using this skill, the project should have:
- Expo SDK 55 installed
- dependencies aligned for SDK 55
- all doctor checks passing
- migration notes captured in project docs
