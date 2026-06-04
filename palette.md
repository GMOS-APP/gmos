# GM/OS Color Palette

The complete color system for GM/OS. The look is **Teenage Engineering** — a single
**signal-orange** accent over **warm-gray** neutrals (the K.O. II "desk + device" greys).

> **The override gotcha.** The TE look is built by **overriding Tailwind's `amber` and
> `zinc` scales** in `tailwind.config.js`, not by adding new color names. So
> `amber-500` renders signal-orange (`#ff4d1c`) and `zinc-800` renders warm-gray — the
> class names no longer match stock Tailwind values. Don't "fix" them to other names
> expecting the defaults. Categorical palettes below (entity rainbow, rarity, status,
> HP, Google) are intentional and left on stock hues.

Sources of truth: `tailwind.config.js` (amber/zinc scales), `src/index.css` (semantic
CSS variables), `src/lib/entityColors.js` (entity rainbow). Everything else is listed
with its defining file.

---

## 1. Accent — Amber (signal-orange)

Overrides Tailwind's `amber`. `amber-500` is the app-wide accent. Defined in `tailwind.config.js`.

| Token | Hex | |
|---|---|---|
| `amber-50`  | `#fff3ee` | ![](https://img.shields.io/badge/-fff3ee?style=flat-square&color=fff3ee) |
| `amber-100` | `#ffe4d8` | |
| `amber-200` | `#ffc6ad` | |
| `amber-300` | `#ff9e78` | |
| `amber-400` | `#ff6a3d` | |
| **`amber-500`** | **`#ff4d1c`** | ← primary accent |
| `amber-600` | `#ed3c0c` | |
| `amber-700` | `#c42f0a` | |
| `amber-800` | `#9c2810` | |
| `amber-900` | `#7e2511` | |
| `amber-950` | `#451206` | |

## 2. Neutrals — Zinc (warm-gray)

Overrides Tailwind's `zinc`. The app's surfaces, borders, and text. Defined in `tailwind.config.js`.

| Token | Hex | Typical use |
|---|---|---|
| `zinc-50`  | `#f7f7f6` | light page background tint |
| `zinc-100` | `#efefed` | light surfaces / inputs |
| `zinc-200` | `#e3e2df` | light borders |
| `zinc-300` | `#d0cfca` | light borders / dividers |
| `zinc-400` | `#a3a19b` | muted text |
| `zinc-500` | `#73716b` | secondary text / labels |
| `zinc-600` | `#56544f` | dark-mode secondary text |
| `zinc-700` | `#413f3a` | dark borders |
| `zinc-800` | `#272521` | dark surfaces / borders |
| `zinc-900` | `#1a1815` | dark cards |
| `zinc-950` | `#0d0c0a` | dark page background |

---

## 3. Semantic tokens (CSS variables)

Theme-aware roles consumed by shadcn/ui. Authored as **HSL** in `src/index.css` (`:root` =
light, `.dark` = dark). `--radius` is `0.375rem`.

| Variable | Light (`:root`) | Dark (`.dark`) |
|---|---|---|
| `--background` | `30 6% 95%` | `30 6% 7%` |
| `--foreground` | `0 0% 9%` | `0 0% 93%` |
| `--card` | `0 0% 100%` | `30 5% 10%` |
| `--popover` | `0 0% 100%` | `30 5% 10%` |
| `--primary` | `13 96% 42%` | `13 96% 50%` (≈ `#ff4d1c`) |
| `--primary-foreground` | `0 0% 100%` | `30 6% 7%` |
| `--secondary` | `0 0% 96%` | `30 5% 16%` |
| `--muted` | `0 0% 96%` | `30 5% 16%` |
| `--muted-foreground` | `0 0% 40%` | `30 4% 58%` |
| `--accent` | `13 96% 96%` | `30 5% 16%` |
| `--accent-foreground` | `13 85% 30%` | `0 0% 93%` |
| `--destructive` | `0 84% 55%` | `0 72% 58%` |
| `--border` / `--input` | `0 0% 88%` | `30 5% 18%` |
| `--ring` | `13 96% 42%` | `13 96% 50%` |
| `--success` | `142 76% 36%` | `142 70% 45%` |
| `--warning` | `13 96% 42%` | `13 96% 50%` |
| `--info` | `210 90% 48%` | `210 90% 60%` |
| `--surface-raised` | `0 0% 97%` | `30 5% 13%` |

**Charts** (`recharts`): `--chart-1` `13 96% 50%` (accent), `--chart-2` `173 58% 39/45%`
(teal), `--chart-3` `197 37% 36/55%` (slate-blue), `--chart-4` `43 74% 56/66%` (gold),
`--chart-5` `27 87% 55/67%` (orange).

**Sidebar:** `--sidebar-background` `13 30% 97%` / `30 6% 7%`, `--sidebar-primary`
`13 96% 42/50%`, `--sidebar-accent` `13 96% 96%` / `30 5% 16%`, `--sidebar-border`
`30 6% 90%` / (dark) `30 5% 16%`.

---

## 4. Entity-type rainbow (categorical)

Per-type accent for icons, dots, tags, and badges. Single source: `src/lib/entityColors.js`
(`ENTITY_TYPE_META`). Each type uses a Tailwind hue at the `-400/-500` steps
(`text-{c}-400`, `bg-{c}-500/10`, `tag = bg-{c}-500/15 text-{c}-400 border-{c}-500/30`).

| Entity type | Hue | Note |
|---|---|---|
| NPC | `violet` | |
| Creature | `red` | |
| Location | `emerald` | |
| Faction | `rose` | |
| Player Character | `cyan` | |
| Item | `amber` | renders **signal-orange** (overridden) |
| Event | `pink` | |
| Lore | `orange` | |
| Deity | `yellow` | |
| Encounter | `fuchsia` | |
| Shop | `teal` | |
| Thread | `blue` | |

> In the entity rainbow only `amber` (Item) is touched by the TE override (it renders
> signal-orange); the rest are stock Tailwind hues, kept distinct so the categories stay
> distinguishable. (`zinc`, the warm-gray neutral, is overridden everywhere but isn't an
> entity color. Notes are not entities — they live in the Campaign Notes section.)

---

## 5. Other categorical palettes

### Status (`src/pages/EntityDetail.jsx`)
| Status | Color |
|---|---|
| active | `green-400/500` |
| inactive · unknown | `zinc-400/500` |
| dead · destroyed | `red-400/500` |
| resolved | `blue-400/500` |

### Item rarity (`EntityTypeView.jsx`, `dashboard/PartyInventory.jsx`)
| Rarity | Color |
|---|---|
| Common | `zinc` |
| Uncommon | `green` |
| Rare | `blue` |
| Very Rare | `purple` |
| Legendary | `amber` (signal-orange) |
| Artifact | `red` |

### Thread urgency (`EntityTypeView.jsx`)
| Urgency | Color |
|---|---|
| Low | `zinc` |
| Medium | `sky` |
| High | `amber` |
| Critical | `red` |

### Player-view visibility (`PlayerView.jsx`, `PublicPlayerView.jsx`)
| Visibility | Color |
|---|---|
| Players Know ("Known") | `emerald-600 / emerald-400` |
| Players Suspect ("Rumored") | `amber-600 / amber-400` |

### Active-mode badge (`layout/Taskbar.jsx`)
| Mode | Dot / text |
|---|---|
| PREP | `amber-500` / `amber-600·400` |
| RUN | `emerald-500` (pulsing) / `emerald-600·400` |
| DEBRIEF | `sky-500` / `sky-600·400` |

### HP gradient (`EntityStatBlockView.jsx`, `session/CombatTracker.jsx`, `ResourceTracker.jsx`)
| HP remaining | Bar / text |
|---|---|
| > 50% | `emerald-500 / emerald-400` |
| 25–50% | `amber-500 / amber-400` |
| ≤ 25% | `red-500 / red-400` |
| unknown | `zinc-500` |

### GM-only marker (`EntityTypeView.jsx`)
Lock badge + left rail in `amber-500/40` over `amber-500/10`, text `amber-600 / amber-500`.

---

## 6. Brand exception — Google logo

Fixed brand hues on the "Continue with Google" button (`layout/AuthPanel.jsx`); never
restyle these:

| | Hex |
|---|---|
| Blue | `#4285F4` |
| Green | `#34A853` |
| Yellow | `#FBBC05` |
| Red | `#EA4335` |

---

*One-off utility colors throughout the app derive from the scales above. When in doubt,
reach for `amber` (accent), `zinc` (neutral), or the entity-type hue from
`getEntityColors()` rather than introducing a new color.*
