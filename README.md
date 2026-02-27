# Judy — Mobile Workout App

Judy is a mobile-first workout execution app built with React Native and Expo. It allows athletes to plan, execute, and log workouts with minimal friction — designed around a single Today view that puts the active workout front and centre.

---

## Prerequisites

- Node.js 18+
- npm or yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- A [Supabase](https://supabase.com) project

---

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/pcdev333/judy-ui.git
cd judy-ui

# 2. Install dependencies
npm install

# 3. Set environment variables
cp .env.example .env
# Edit .env and fill in your Supabase URL and anon key

# 4. Start the development server
npx expo start
```

Scan the QR code with the [Expo Go](https://expo.dev/client) app or run on an emulator.

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
