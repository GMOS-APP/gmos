import NPCFields from './NPCFields';
import CreatureFields from './CreatureFields';
import LocationFields from './LocationFields';
import FactionFields from './FactionFields';
import ThreadFields from './ThreadFields';
import ItemFields from './ItemFields';
import PlayerCharacterFields from './PlayerCharacterFields';
import EventFields from './EventFields';
import LoreFields from './LoreFields';
import DeityFields from './DeityFields';
import EncounterFields from './EncounterFields';
import ShopFields from './ShopFields';
import NoteFields from './NoteFields';

const FIELD_MAP = {
  note: NoteFields,
  npc: NPCFields,
  creature: CreatureFields,
  location: LocationFields,
  faction: FactionFields,
  thread: ThreadFields,
  item: ItemFields,
  player_character: PlayerCharacterFields,
  event: EventFields,
  lore: LoreFields,
  deity: DeityFields,
  encounter: EncounterFields,
  shop: ShopFields,
};

export default function TypeSpecificFields({ entityType, extraData, onChange }) {
  const Component = FIELD_MAP[entityType];
  if (!Component) return null;
  return <Component extraData={extraData} onChange={onChange} />;
}