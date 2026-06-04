# GM-OS Tutorial

A step-by-step guide to using GM-OS for your tabletop RPG campaigns.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [The Campaign Dashboard](#the-campaign-dashboard)
3. [Building Your World (Entities)](#building-your-world-entities)
4. [Mapping Relationships](#mapping-relationships)
5. [Preparing a Session](#preparing-a-session)
6. [Running a Session](#running-a-session)
7. [After the Session (Debrief)](#after-the-session-debrief)
8. [Campaign Notes](#campaign-notes)
9. [Random Tables](#random-tables)
10. [The Campaign Map](#the-campaign-map)
11. [Campaign Timeline](#campaign-timeline)
12. [Player View](#player-view)
13. [Tips & Shortcuts](#tips--shortcuts)

---

## Getting Started

### Sign In

GM-OS uses Supabase Auth. From the landing page, click **Sign in** and choose **Continue with Google** or sign in with an email and password. All your data is private to your account.

### The Desktop

GM-OS is laid out like a small operating system:

- **Taskbar** (top) — a **Start** button, the current campaign's **mode badge** (Prep / Session / Debrief), breadcrumbs showing where you are, and a **system tray** on the right.
- **System tray** — quick search, the **audio player**, the **notification center**, a **light/dark theme toggle**, and a clock.
- **Sidebar** — your campaign navigation. Click the chevron (or the Start button) to **undock** it into a Start-menu dropdown; an icon docks it back to the left. Your preference is remembered.
- **Command Palette** — press **⌘K / Ctrl+K** anywhere to search, create, jump to a page, or roll dice inline (type `2d6` and press Enter).

### Take the Tour

The first time you open a campaign, GM/OS offers a **30-second guided tour** that spotlights each part of the interface — the Start button, the mode badge, the Command Palette, the system tray, your navigation, and Quick Capture. You can dismiss it ("I'll figure it out") and relaunch it any time: press **?** and click **Take the interactive tour**, or open the Command Palette (**⌘K**) and type "tour".

### Music & Ambience

Open the **audio player** in the system tray and paste a YouTube link (an ambient track, a battle loop, a tavern playlist). It keeps playing as a tray app while you navigate and run the game.

### Create Your First Campaign

From the campaigns list, click **New Campaign** and fill in:

- **Name** — your campaign title
- **Description** — an optional one-liner about the campaign
- **Setting** — a brief description of the world

GM/OS is built for **D&D 5e**.

Click **Save** to open the campaign dashboard.

### Try the Demo First

Not sure where to start? Click **Load Demo Campaign** on the campaigns list page. This creates a fully-populated sample campaign with entities, sessions, relationships, and prep notes you can explore before building your own.

---

## The Campaign Dashboard

The dashboard is your at-a-glance campaign HQ. Each widget is independently useful:

| Widget | What it does |
|--------|-------------|
| **Active Threads** | Lists your open plot arcs so you never lose the thread mid-campaign |
| **Recent Entities** | Quick links to the last entities you edited |
| **Party Passives** | Aggregated passive Perception, Investigation, and Insight for the party |
| **Party Inventory** | Shared and per-PC item tracking |
| **Private Scratchpad** | DM-only notes that never appear in Player View |
| **Weather Generator** | Procedural weather with atmospheric flavor text |
| **Rules Reference** | Quick lookup for conditions, actions, and common rules (system-dependent) |
| **Session Calendar** | Visual history of past session dates |

---

## Building Your World (Entities)

Entities are the core building block of GM-OS. Everything in your world — a villain, a haunted tavern, a cursed sword — is an entity.

### Entity Types

| Type | Use for |
|------|---------|
| **NPC** | Named characters the party interacts with (merchants, villains, allies) |
| **Player Character** | Your players' characters — import from D&D Beyond or fill manually |
| **Location** | Any place the party visits or knows about |
| **Faction** | Organizations, guilds, cults, governments |
| **Creature** | Monsters and combatants (has full stat block support) |
| **Item** | Notable gear, artifacts, quest items, MacGuffins |
| **Event** | World happenings tied to a date or trigger |
| **Encounter** | Pre-built combat or social challenges with linked creatures |
| **Shop** | Merchants and their inventory |
| **Lore** | Background facts, myths, histories, secrets |
| **Thread** | Active plot arcs and mysteries (great for linking to session Threads section) |
| **Deity** | Gods, patrons, cosmic forces with domains and portfolios |

### Creating an Entity

1. Click **All Entities** in the sidebar (or a specific type like **NPCs**)
2. Click **New Entity** (top right)
3. Select the type and fill in the fields
4. The **Summary** field is the most important — it's a 1-2 sentence description used by the AI throughout the app to understand this entity's role

### D&D Beyond Import (Player Characters)

1. Go to **Player Characters** in the sidebar
2. Click **Import from D&D Beyond**
3. Paste a public D&D Beyond character URL
4. GM-OS fetches and maps the character's stats, abilities, and inventory automatically

### The Summary Field

Every entity has a Summary. Keep it punchy and useful:

- **Bad:** "An NPC"
- **Good:** "A disgraced knight hiding under a false name who secretly knows the location of the King's tomb"

The AI uses these summaries when generating prep notes and dialogue, so the more specific they are, the better the output.

---

## Mapping Relationships

The Relationship Map gives you a visual web of how your entities connect.

### Opening the Map

Click **Relationship Map** in the sidebar. All entities with relationships will appear as nodes in a force-directed graph.

### Creating a Relationship

1. From any entity's detail page, click **Add Relationship**
2. Search for the target entity
3. Choose a relationship type:

| Type | Example |
|------|---------|
| allied_with | The Thieves' Guild is allied_with the Harbor Master |
| enemy_of | The Paladin is enemy_of the Cult of the Undying |
| knows | The innkeeper knows the secret passage |
| member_of | Sera is member_of the Keeper's Order |
| employed_by | The spy is employed_by the Duke |
| located_in | The vault is located_in the Old Cathedral |
| owns | Lord Vance owns the docks |
| rivals | The two wizards are rivals |
| mentors | The archmage mentors the apprentice |
| betrayed_by | The captain was betrayed_by their lieutenant |

4. Add a **note** to capture the nuance of the relationship
5. Click **Save**

### Filtering the Map

Use the filter controls above the graph to focus on specific entity types or relationship types. This is especially useful mid-campaign when the web gets dense.

---

## Preparing a Session

Sessions have three tabs: **Prep**, **Run**, and **Debrief**. Start here before game night.

### Creating a Session

1. Click **Sessions** in the sidebar
2. Click **New Session**
3. Give it a title and session number

### The 8-Section Prep Workflow

The Prep tab is structured around 8 sections. Work through them in order — each one feeds the next.

#### 1. Play Date
Set the date you're running. Used for the Session Calendar on the dashboard.

#### 2. Recap
Summarize what happened last session — the last major action, the most important discovery, and the cliffhanger where things ended.

**AI tip:** Click the sparkle button (✦) to generate a recap from your previous session notes. Works best after you've filled out the Debrief on your previous session.

#### 3. Intro
Draft a read-aloud opening scene. Something should already be in motion when the players arrive — a knock at the door, a fire on the horizon, an NPC who needs them *right now*.

**AI tip:** The AI generates a sensory-rich present-tense scene with a built-in inciting incident.

#### 4. Events
World-level events that happen during this session *regardless of player action*. These are your timed triggers and environmental pressure:

- The city gates close at midnight
- The bounty hunters arrive at the inn by dawn
- The eclipse begins — the ritual can only happen now

Link event entities using the **+ Add** button, then add freeform notes for timing and context.

#### 5. Locations
Link the locations the party will visit tonight. Add a sensory detail note for each: one specific smell, sound, or quality of light that makes each place feel distinct when you describe it aloud.

**AI tip:** Generates a location-by-location list of sensory details based on your linked entities.

#### 6. NPCs
Link the NPCs appearing tonight. For each, note their **immediate goal** (what do they want from this scene?) and a **roleplay quirk** (a consistent behavioral tell to keep their performance grounded).

**AI tip:** Generates goal + quirk bullets for all linked NPCs.

#### 7. Encounters
Link encounter and creature entities for combat and social challenges. Note quantities, brief context, and relevant DCs.

#### 8. Threads
Link the active plot threads and mysteries that are relevant tonight. Note the thread's current status, what players can learn tonight, and what to *withhold* for later.

**AI tip:** Generates a status report for each thread with reveal/withhold guidance.

#### 9. Rewards
List physical loot (items, currency, gear) and narrative boons (contacts, secrets, faction reputation) available this session.

**AI tip:** Generates a split physical/narrative rewards list based on your campaign context.

---

## Running a Session

Open your session and switch to the **Run** tab when game night starts.

### The GM Screen

Click **GM Screen** (top right of the Run tab) to open a floating panel that stays on top as you navigate. It contains:

- **Dice Roller** — d4 through d100, with roll history
- **Resource Tracker** — live HP, spell slots, and ability tracking per PC
- **Quick Notes** — scratch pad for mid-session captures that sync to the session
- **Entity Lookup** — search and view any entity without leaving the Run tab

### Resource Tracker

The Resource Tracker shows all Player Characters linked to the campaign. Click any value to edit it live during play. Changes are saved immediately.

### Quick Capture

The **+** button (floating, bottom-right corner) is available from *any page*. Click it to open a quick note that saves directly to your campaign. Use this when something happens mid-combat and you don't want to navigate away.

### Command Palette

Press **Cmd/Ctrl+K** (or click the search icon in the tray) to open the Command Palette. It searches all entities in the current campaign by name, offers quick **Create** and **Go to** actions, and rolls dice inline (type `2d6` and press Enter). Use it to pull up an NPC stat block or location detail when players go somewhere unexpected — without leaving the Run tab.

---

## After the Session (Debrief)

Switch the session status to **In Progress** when you start, then **Debriefed** when you're done.

The **Debrief** tab captures:
- **Session notes** — what actually happened (used by AI for future recap generation)
- **XP** — total XP awarded and per-player breakdown
- **Loot** — what the party found and who took what

Well-written debrief notes make the Recap AI feature dramatically better for your next session.

---

## Campaign Notes

**Notes** (in the sidebar) is your campaign notebook — a single place for ideas, reminders, clues, and reveals.

### Writing a Note

Use the composer at the top of the page:

1. Type your note. Use **@** to link any world entity (it becomes a clickable mention).
2. Tag it (Combat, Clue, NPC, Item, Plot, Important) so you can filter later.
3. Choose where it lives: **Campaign note** (the default — not tied to any session) or link it to a specific session.
4. Press **⌘/Ctrl+Enter** or the send button to save.

Notes you capture mid-session (the GM Screen's Quick Notes, or the **+** Quick Capture button) also show up here, grouped under their session.

### Organizing Notes

- **Pin** the notes that matter most — they float to a **Pinned** band at the top, across every session.
- **Mark done** (the check) when a note is handled — it dims and strikes through, and you can **Hide done** to clear the clutter. Reopen it any time.
- **Edit** a note's text and tags inline, or delete it.
- **Search** across every note, and filter by tag.

Notes are grouped **Pinned → Campaign → by session** (newest first), so the page reads as a running log of your campaign.

---

## Random Tables

Random tables are great for improvising on the fly — wandering encounters, NPC names, weather, rumors.

### Creating a Table

1. Click **Random Tables** in the sidebar
2. Click **New Table**
3. Add a title and description
4. Add options — each option can have a weight (higher weight = more likely to roll)

### Rolling a Table

Open any table and click **Roll**. The result is highlighted. Roll again for a new result.

### Table Scope

Tables belong to the campaign they're created in. To reuse a table across campaigns, export/import campaigns (the tables are included in the export).

---

## The Campaign Map

### Setting Up

1. Click **Campaign Map** in the sidebar
2. Click **Upload Map** to use a custom image (a region map, dungeon map, city plan, etc.)

### Pinning Locations

Once a map image is uploaded, click anywhere to place a pin. Search for a Location entity to attach to that pin. The pin displays the entity name.

### Using Pins

Click any pin to open a quick preview of the linked entity — name, summary, and a link to the full entity detail. Useful mid-session to quickly check what the party knows about a place.

---

## Campaign Timeline

Click **Timeline** in the sidebar to see a visual history of all sessions in chronological order. Each session appears as a node with its date, title, and status.

Use the Timeline to:
- Orient yourself before planning a new session ("where are we in the story?")
- Show players the arc of the campaign
- Spot gaps between sessions where time has passed in-world

---

## Player View

The Player View is a read-only, player-safe version of your campaign data.

### What Players Can See

Only entities you mark as **visible to players** appear in the Player View. By default, all entities are GM-only.

To make an entity player-visible:
1. Open the entity detail page
2. Toggle the **Visible to Players** setting
3. Save

### Sharing with Your Party

The Player View is available at a campaign-specific URL. Copy the URL and share it with your players. They don't need a GM-OS account to view it.

---

## Tips & Shortcuts

| Action | How |
|--------|-----|
| **Command Palette** (search / create / go to / roll dice) | **Cmd/Ctrl+K**, or click the tray search icon |
| **Quick-create menu** | **Alt/Option+N** |
| **Keyboard shortcuts help** | Press **?** |
| **Close any palette / menu / overlay** | Press **Esc** |
| **Take the interactive tour** | Press **?** → "Take the interactive tour", or **⌘K** → "tour" |
| **Quick note from anywhere** | Click the **+** button (bottom-right floating button) |
| **Dock / undock the sidebar** | Click the chevron on the sidebar, or the **Start** button |
| **Open entity quick-view** | @mention an entity in any text field — click the mention to preview |
| **Switch light / dark theme** | Click the theme toggle in the system tray |
| **Play music** | Open the audio player in the tray and paste a YouTube link |

> Shortcuts are suppressed while you're typing in a text field, so they won't fire mid-sentence.

### Workflow Tips

- **Fill the Summary field first.** The AI uses it for every generated section — a good summary is worth more than filling out every other field.
- **Create entities before prepping sessions.** The Prep tab's entity pickers search your existing entities. The more you have, the more useful the AI context.
- **Link everything.** Relationships, session entity links, map pins — the more connected your data is, the better the Relationship Map and AI outputs become.
- **Write debrief notes right after the session.** Memory fades fast. Even a few bullet points dramatically improves the next session's AI Recap.
- **Use Threads as your plot tracker.** Create a Thread entity for each active mystery or quest arc, then link it in every session's Threads section. The Active Threads widget on the dashboard surfaces them automatically.
