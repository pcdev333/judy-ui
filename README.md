# Judy — Mobile Workout App

Judy is a mobile-first workout execution app built with React Native and Expo. It allows athletes to plan, execute, and log workouts with minimal friction — designed around a single Today view that puts the active workout front and centre.

---

## Local Development Setup (Linux, clean machine)

Follow every step below in order. These instructions assume a fresh Linux install with nothing pre-installed.

### 1 — Install git

```bash
sudo apt update && sudo apt install -y git
```

Verify:

```bash
git --version
```

---

### 2 — Install Node.js 18+ via nvm

[nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) is the recommended way to install Node on Linux without needing `sudo` for npm globals.

```bash
# Download and run the nvm installer
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload your shell so the `nvm` command is available
source ~/.bashrc
```

> If you use zsh, replace `~/.bashrc` with `~/.zshrc`.

Install Node.js 18 (LTS) and set it as the default:

```bash
nvm install 18
nvm use 18
nvm alias default 18
```

Verify:

```bash
node --version   # should print v18.x.x
npm --version
```

---

### 3 — Clone the repository

```bash
git clone https://github.com/pcdev333/judy-ui.git
cd judy-ui
```

---

### 4 — Install dependencies

```bash
npm install
```

This installs all packages listed in `package.json`, including Expo, React Native, NativeWind, Supabase, and Zustand.

---

### 5 — Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign up / log in.
2. Click **New project**, give it a name (e.g. `judy`), choose a region, and set a database password.
3. Once the project is ready, navigate to **Project Settings → API**.
4. Copy the **Project URL** and the **anon / public** key — you will need them in the next step.

---

### 6 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` in any text editor and fill in the values from your Supabase project:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> `.env` is listed in `.gitignore` and will never be committed.

---

### 7 — Run the app on a physical device (recommended)

Install the **Expo Go** app on your phone:

- Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iOS: [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

Start the development server:

```bash
npx expo start
```

A QR code will appear in the terminal. Open the **Expo Go** app and scan it. Your phone and development machine must be on the **same Wi-Fi network**.

---

### 8 — Run on an Android emulator (alternative)

If you prefer an emulator instead of a physical device:

1. Install Android Studio:

   ```bash
   sudo snap install android-studio --classic
   ```

2. Open Android Studio → **More Actions → Virtual Device Manager → Create Device**.
3. Choose a device (e.g. Pixel 7), select a system image (API 34 / Android 14), and click **Finish**.
4. Start the emulator from Virtual Device Manager, then run:

   ```bash
   npx expo start --android
   ```

   Expo will automatically detect the running emulator and open the app.

---

### Useful dev-server commands

| Key | Action |
|-----|--------|
| `r` | Reload the app |
| `m` | Toggle the dev menu |
| `j` | Open the JavaScript debugger |
| `a` | Open on connected Android device/emulator |
| `Ctrl + C` | Stop the server |

---

## Folder Structure

```
judy-ui/
├── app/
│   ├── (auth)/
│   │   └── index.tsx           # Auth screen — email input + magic link
│   ├── (app)/
│   │   ├── index.tsx           # Today screen (home after login)
│   │   ├── workout/
│   │   │   └── [id].tsx        # Workout Execution screen
│   │   ├── planner.tsx         # Planner screen
│   │   ├── library.tsx         # Workout Library screen
│   │   └── create.tsx          # Create Workout screen
│   └── _layout.tsx             # Root layout + auth guard
├── components/
│   └── ui/
│       └── Button.tsx          # Reusable button component
├── lib/
│   └── supabase.ts             # Supabase client
├── store/
│   └── useWorkoutStore.ts      # Zustand store
├── types/
│   └── index.ts                # Shared TypeScript types
├── .env.example
├── app.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Phase Roadmap

| Phase | Description |
|-------|-------------|
| **Phase 1** | Project scaffold, Auth screen, Today screen shell |
| **Phase 2** | AI workout creation (natural language → structured JSON) |
| **Phase 3** | Workout Library — browse, search, create workouts |
| **Phase 4** | Planner — schedule workouts by date |
| **Phase 5** | Workout Execution — live set logging |
| **Phase 6** | Progress tracking, history, and analytics |
