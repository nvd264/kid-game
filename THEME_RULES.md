# UI Theme Rules — Kid Game (Farm Flip Style)

> **MANDATORY for all AI models working on this project.**
> Read this file before writing or editing any UI code. Every screen, component,
> and style decision must follow these rules. Do not invent new colors, layouts,
> or component patterns that contradict what is defined here.

---

## 1. Source of Truth

All design tokens live in **`/theme.js`** and are exported as:

```js
import { FARM, SHADOWS } from './theme';
```

- `FARM` — every color value, gradient, and icon used by the theme
- `SHADOWS` — every shadow preset (`card`, `cardMatched`, `button`, `header`)

**Rule:** Never hardcode a color that has an equivalent token in `FARM`. Always reference `FARM.tokenName`.

---

## 2. Visual Identity — "Farm Flip"

The app uses a warm, outdoor, clay-toy aesthetic inspired by farm animals and sunny skies.

| Trait | Value |
|---|---|
| Mood | Cheerful, soft, child-friendly |
| Palette | Sky blues + golden yellows + grass greens |
| Cards | Rounded, warm yellow, paw-print backs |
| Typography | Nunito (900Black / 800ExtraBold / 700Bold) |
| Shadows | Always present — cards and buttons must feel raised |
| Animations | Spring-based, bouncy — never linear or abrupt |

---

## 3. Color Tokens (from `FARM`)

### Backgrounds
| Token | Hex | Usage |
|---|---|---|
| `FARM.skyGradient` | `['#6DCFF6', '#A8DEFB']` | All game screens (primary background) |
| `FARM.skyGradientDeep` | `['#4BBDE8', '#87D8F5']` | Alternate deeper sky (overlays, modals) |

**Rule:** Game screens must use `<LinearGradient colors={FARM.skyGradient}>` as the root container. Never use a solid color or a non-sky gradient for a game screen.

### Cards
| Token | Hex | Usage |
|---|---|---|
| `FARM.cardBack` | `#FBBF24` | Card back face background (golden yellow) |
| `FARM.cardBackBorder` | `#F59E0B` | Card back border |
| `FARM.cardFront` | `#FEF9E7` | Card front face background (cream) |
| `FARM.cardFrontBorder` | `#FDE68A` | Card front border |
| `FARM.cardMatched` | `#DCFCE7` | Matched/completed card background |
| `FARM.cardMatchedBorder` | `#86EFAC` | Matched card border |
| `FARM.cardHintBorder` | `#FDE047` | Hint highlight border (bright yellow) |
| `FARM.cardShadow` | `#B45309` | Card shadow color |
| `FARM.cardBackIcon` | `🐾` | Symbol shown on the back of every card |

**Rule:** Card backs are always golden (`FARM.cardBack`) with a paw print emoji (`FARM.cardBackIcon`). Never use a `?` mark or a plain color block. Card fronts are cream (`FARM.cardFront`), not white.

### Buttons & Header Controls
| Token | Hex | Usage |
|---|---|---|
| `FARM.closeButtonBg` | `#EF4444` | Close / back button background (red circle) |
| `FARM.closeButtonBorder` | `#DC2626` | Close button border |
| `FARM.settingsButtonBg` | `#FBBF24` | Settings gear button background |
| `FARM.settingsBorderColor` | `#F59E0B` | Settings button border |
| `FARM.playButtonGradient` | `['#FBBF24', '#F59E0B']` | Primary CTA button gradient |
| `FARM.playButtonText` | `#7C2D12` | Text on primary CTA button |
| `FARM.playButtonShadow` | `#B45309` | Primary button shadow |

### Text
| Token | Hex | Usage |
|---|---|---|
| `FARM.headerTitleColor` | `#1B4F8B` | Header "Level X" title — dark navy blue |
| `FARM.titleColor` | `#7C2D12` | Large screen titles — dark brown |
| `FARM.subtitleColor` | `#92400E` | Subtitles and secondary headings |
| `FARM.bodyText` | `#374151` | Body copy, descriptions |

### Grass / Landscape Decoration
| Token | Hex | Usage |
|---|---|---|
| `FARM.grassLight` | `#86EFAC` | Top edge of grass bar |
| `FARM.grassMid` | `#4ADE80` | Main grass bar fill |
| `FARM.grassDark` | `#22C55E` | Grass border / shadow |
| `FARM.hillColor` | `#6EE7B7` | Rolling hill accent |

---

## 4. Shadow Presets (from `SHADOWS`)

Always use these presets; do not define new shadow values inline.

| Preset | Use on |
|---|---|
| `SHADOWS.card` | Every game card (unmatched / unflipped) |
| `SHADOWS.cardMatched` | Matched / completed cards |
| `SHADOWS.button` | All action buttons and CTA buttons |
| `SHADOWS.header` | Header badges, intro cards, pill chips |

**Usage:**
```js
<View style={[styles.myCard, SHADOWS.card]}>
```

---

## 5. Layout Rules

### Screen structure (every game screen)
```
<LinearGradient colors={FARM.skyGradient} style={{ flex: 1 }}>
  <StatusBar barStyle="dark-content" />        ← always dark on sky blue
  <View style={[styles.farmPlayHeader, { marginTop: 44 }]}>
    {/* Close button | Level badge | Gear button */}
  </View>
  {/* Game content */}
  <View style={styles.farmGrassBar} />         ← always at the bottom
</LinearGradient>
```

### Header structure
```
Left:   farmCloseButton  (red circle, Ionicons "close", size 22, white)
Center: farmLevelBadge   (white pill, "Màn X" text, farmLevelText style)
Right:  farmGearButton   (golden circle, ⚙️ emoji, size 20)
```

**Rule:** The header row always has exactly these three elements. Do not add stats, score, or move counters to the header — those belong below the header or in a separate status row.

### Grass bar
Every game screen must end with the grass decoration bar:
```js
<View style={styles.farmGrassBar} />
```
It sits at the very bottom, above any modal overlays but below the game content.

---

## 6. Component Rules

### Close / Back button
```js
<AnimatedPressable onPress={handler}>
  <View style={styles.farmCloseButton}>
    <Ionicons name="close" size={22} color="#FFFFFF" />
  </View>
</AnimatedPressable>
```
- Always a **red circle** (`farmCloseButton` style, `FARM.closeButtonBg`)
- Always uses the Ionicons `"close"` icon, **never** a chevron or back arrow
- Never a text label

### Settings / Gear button
```js
<View style={styles.farmGearButton}>
  <Text style={{ fontSize: 20 }}>⚙️</Text>
</View>
```
- Always a **golden circle** (`farmGearButton` style, `FARM.settingsButtonBg`)
- Uses the `⚙️` emoji — not an icon component

### Primary action button (Play, Continue, etc.)
```js
<AnimatedPressable onPress={handler} style={{ width: '100%' }}>
  <LinearGradient colors={FARM.playButtonGradient} style={styles.farmPlayButton}>
    <Text style={styles.farmPlayButtonText}>CHƠI NGAY</Text>
  </LinearGradient>
</AnimatedPressable>
```
- Full-width, `borderRadius: 28`, `paddingVertical: 16`
- Text: uppercase or title-case, `fontWeight: '900'`, color `FARM.playButtonText`
- Always wrapped in `AnimatedPressable` (scale spring on press)
- Apply `SHADOWS.button` to the gradient view

### Theme / level selection cards
```js
<LinearGradient colors={themeGradient} style={styles.farmThemeCard}>
  <View style={styles.farmThemeEmojiWrap}>
    <Text style={styles.kidThemeEmoji}>{emoji}</Text>
  </View>
  <View style={styles.kidThemeTextWrap}>
    <Text style={styles.farmThemeName}>{name}</Text>
    <Text style={styles.farmThemeSub}>CHƠI NGAY ▶</Text>
  </View>
</LinearGradient>
```
- Each game may have its own gradient list but must use the `farmThemeCard` base style
- Emoji container: `farmThemeEmojiWrap` (semi-transparent white circle)
- Sub-text always reads "CHƠI NGAY ▶" (uppercase, white, 0.5 letter-spacing)

### Intro / info card (theme selection screen)
```js
<View style={styles.farmIntroCard}>
  <Text style={styles.farmIntroTitle}>{title}</Text>
  <Text style={styles.farmIntroSub}>{subtitle}</Text>
</View>
```
- White semi-transparent card, `borderRadius: 20`, amber border
- Sits between the header and the scrollable list

---

## 7. Typography Rules

| Role | Style | fontFamily | Size |
|---|---|---|---|
| Game / screen title | `farmHeaderTitle` | Nunito_900Black | 22 |
| Level badge | `farmLevelText` | Nunito_900Black | 18 |
| Intro card heading | `farmIntroTitle` | Nunito_900Black | 22 |
| Intro card sub | `farmIntroSub` | Nunito_800ExtraBold | 15 |
| Theme card name | `farmThemeName` | Nunito_900Black | 22 |
| Theme card sub | `farmThemeSub` | Nunito_800ExtraBold | 13 |
| Primary button | — | Nunito_900Black | 18 |
| Body / description | — | Nunito_700Bold | 15–16 |

**Rule:** Never use `fontWeight: '900'` as a substitute for `Nunito_900Black`. Always set both `fontFamily` and a fallback weight so that pre-load and post-load states look similar.

```js
// Correct pattern
const F  = fontsLoaded ? 'Nunito_900Black'    : undefined;
const F8 = fontsLoaded ? 'Nunito_800ExtraBold': undefined;
const F7 = fontsLoaded ? 'Nunito_700Bold'     : undefined;

<Text style={[styles.farmHeaderTitle, { fontFamily: F }]}>Màn 1</Text>
```

---

## 8. Animation Rules

All interactions must feel springy and child-friendly.

| Interaction | Animation |
|---|---|
| Button press | `AnimatedPressable` — scale spring `toValue: 0.93` in, `1.0` out |
| Card flip | scaleX squish: `toValue: 0` → face swap → `toValue: 1`, 90ms each |
| Card match | Spring to `1.22` then back to `1.0` (bounciness 18/6) |
| Card hint | Looping scale pulse `1.0 → 1.07`, translateY `0 → -6`, 520ms |
| Stars (reward) | Sequential spring pop with delay between each star |
| Confetti | translateY upward + rotate + fade out |

**Rules:**
- Always use `useNativeDriver: true`
- Never use `Animated.timing` for interactive press feedback — use `Animated.spring`
- Do not add new animation types without updating these rules

---

## 9. Theme Gradient Palette per Game Section

Each game can use its own accent gradients for theme/level selection cards, but must keep the sky background. Approved gradients:

```js
// Memory game (Tìm Cặp)
animals:  ['#FB923C', '#FBBF24']   // orange → yellow
fruits:   ['#F472B6', '#FB923C']   // pink  → orange
vehicles: ['#60A5FA', '#34D399']   // blue  → green

// Use warm, saturated gradients. Avoid dark/muted colors on child-facing cards.
// Both stops must have enough contrast with white text.
```

---

## 10. Do-Nots (Forbidden Patterns)

| Do NOT | Instead |
|---|---|
| Use a purple/pink/red gradient as the game screen background | Use `FARM.skyGradient` |
| Show `?` on a card back | Show `🐾` (`FARM.cardBackIcon`) |
| Use a white card back | Use `FARM.cardBack` (#FBBF24 golden) |
| Use a chevron/back-arrow for the close button | Use Ionicons `"close"` in a red circle |
| Skip the grass bar at the bottom | Always include `<View style={styles.farmGrassBar} />` |
| Hardcode shadow values inline | Use `SHADOWS.card`, `SHADOWS.button`, etc. |
| Hardcode hex colors inline that exist in `FARM` | Reference `FARM.tokenName` |
| Use `fontWeight: '900'` without `fontFamily: Nunito_900Black` | Set both |
| Use `Animated.timing` for button press feedback | Use `Animated.spring` |
| Add score/moves/stats to the header row | Put them in a separate status row below the header |
| Use a non-round shape for close or settings buttons | Both are circles (44×44, borderRadius: 22) |

---

## 11. Adding a New Screen or Game

When building any new screen or mini-game, follow this checklist:

- [ ] Root container: `<LinearGradient colors={FARM.skyGradient}>`
- [ ] `<StatusBar barStyle="dark-content" />`
- [ ] Header: red close button | center badge | golden gear button
- [ ] All color values reference `FARM.*` tokens
- [ ] All shadows use `SHADOWS.*` presets
- [ ] All press interactions wrapped in `AnimatedPressable`
- [ ] Grass bar `<View style={styles.farmGrassBar} />` at the bottom
- [ ] Typography uses Nunito font family with the `fontsLoaded` guard
- [ ] No new shadow or color values invented — add to `theme.js` if a truly new token is needed

---

## 12. Updating the Theme

If a design decision requires a new color or shadow:

1. Add the new token to `/theme.js` under the appropriate section with a comment
2. Update this file (`THEME_RULES.md`) to document the token in the relevant table
3. Reference the new token everywhere it's used — never hardcode it at the use site

**Do not silently introduce new colors.** Every color in the UI must be traceable to a `FARM.*` token or justified by a specific constraint (e.g., a library's required prop).
