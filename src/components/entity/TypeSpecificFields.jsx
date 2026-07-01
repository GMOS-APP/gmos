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
import SchemaFields from './SchemaFields';

const FIELD_MAP = {
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

export default function TypeSpecificFields({ entityType, extraData, onChange, fields }) {
  const Component = FIELD_MAP[entityType];
  // Custom (user-defined) types have no bespoke component — render from schema.
  if (!Component) {
    if (!fields) return null;
    return <SchemaFields fields={fields} extraData={extraData} onChange={onChange} />;
  }
  return <Component extraData={extraData} onChange={onChange} />;
}