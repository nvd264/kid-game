# CONVENTIONS.md — Aider Project Guide

## Project Overview

Kid-game: A React Native mobile game for children.

## Tech Stack

- React Native + TypeScript (strict mode)
- State management: Zustand
- Navigation: React Navigation v6+
- Animations: React Native Reanimated + Gesture Handler
- Audio: expo-av
- Storage: AsyncStorage for local data
- Testing: Jest + React Native Testing Library

## Code Style

### Naming

- Components: PascalCase (`GameBoard.tsx`, `ScoreCard.tsx`)
- Hooks: `use` prefix, camelCase (`useGameState.ts`, `useSound.ts`)
- Utils/helpers: camelCase (`calculateScore.ts`, `formatTime.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_LIVES = 3`, `GAME_DURATION = 60`)
- Types/Interfaces: PascalCase with prefix (`IGameState`, `TDifficulty`)

### File Structure

```
src/
├── components/     # Reusable UI components (< 150 lines each)
├── screens/        # Screen-level components
├── hooks/          # Custom hooks
├── utils/          # Pure helper functions
├── constants/      # App-wide constants
├── types/          # TypeScript type definitions
├── assets/         # Images, sounds, fonts
├── navigation/     # Navigation config
└── stores/         # Zustand stores
```

### Component Rules

- One component per file, max 150 lines
- Extract logic into custom hooks
- Use `StyleSheet.create()` at bottom of file, never inline styles
- Props interface defined above component
- Default export for screen components, named export for shared components
- Wrap expensive renders in `React.memo()`

### TypeScript

- No `any` type — use `unknown` if type is uncertain
- Define all props interfaces explicitly
- Use discriminated unions for state machines (game states, screen states)
- Enums for fixed sets: `enum GameStatus { Idle, Playing, Paused, GameOver }`

### State Management

- Zustand for global state (score, settings, user progress)
- useState for local UI state only
- Never mutate state directly — use Zustand’s set()
- Keep stores small and focused (gameStore, settingsStore, progressStore)

### Performance (Critical for games)

- Animations: always use `useAnimatedStyle` + `useSharedValue` from Reanimated
- Never run animations on JS thread
- Use `React.memo()` on list items and frequently re-rendered components
- Images: preload with `Asset.loadAsync()` at app start
- Sounds: preload audio files, reuse Audio.Sound instances

### Kid-Friendly UX Rules

- Touch targets minimum 48x48dp
- Bright, high-contrast colors
- No text-heavy UI — use icons and images
- Positive feedback only (no harsh failure states)
- Simple navigation — max 2 taps to reach any game
- Safe: no external links, no ads, no in-app purchases

### Error Handling

- Wrap async calls in try/catch
- Use ErrorBoundary at screen level
- Graceful fallbacks — never show crash screen to kids
- Log errors silently, show friendly retry UI

### Git Commits

- Format: `type: short description`
- Types: feat, fix, refactor, style, test, chore
- Example: `feat: add star animation on correct answer`

## Important Notes for AI Assistant

- This is a children’s game. All content must be age-appropriate.
- Performance matters more than code elegance — games need 60fps.
- Prefer simple solutions. Kids’ games don’t need complex architecture.
- When editing, change only what’s asked. Don’t refactor unrelated code.
- If a file exceeds 150 lines, suggest splitting before adding more code.
- Always include TypeScript types — no implicit any.
- Test touch interactions work on both iOS and Android.
