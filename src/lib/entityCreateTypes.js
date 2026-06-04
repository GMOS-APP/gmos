import {
  Users, User, Skull, MapPin, Shield, GitBranch,
  Package, CalendarDays, BookOpen, Flame, Swords, ShoppingBag,
} from 'lucide-react';

// Single source of truth for the entity "Create…" actions shared by
// QuickCapture, the command palette, and the shortcuts help overlay.
// (Notes are not entities — capture them via QuickCapture's note composer,
// which writes to the Campaign Notes section.)
export const ENTITY_CREATE_TYPES = [
  { type: 'npc', label: 'NPC', Icon: Users },
  { type: 'player_character', label: 'Player Character', Icon: User },
  { type: 'creature', label: 'Creature', Icon: Skull },
  { type: 'location', label: 'Location', Icon: MapPin },
  { type: 'faction', label: 'Faction', Icon: Shield },
  { type: 'thread', label: 'Thread', Icon: GitBranch },
  { type: 'item', label: 'Item', Icon: Package },
  { type: 'event', label: 'Event', Icon: CalendarDays },
  { type: 'lore', label: 'Lore', Icon: BookOpen },
  { type: 'deity', label: 'Deity', Icon: Flame },
  { type: 'encounter', label: 'Encounter', Icon: Swords },
  { type: 'shop', label: 'Shop', Icon: ShoppingBag },
];
