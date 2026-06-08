import { supabase } from './supabaseClient';

function parseSort(sortStr) {
  if (!sortStr) return null;
  const ascending = !sortStr.startsWith('-');
  const column = sortStr.replace(/^-/, '');
  return { column, ascending };
}

function createEntityAPI(tableName) {
  return {
    async list(sortBy) {
      let q = supabase.from(tableName).select('*');
      if (sortBy) {
        const { column, ascending } = parseSort(sortBy);
        q = q.order(column, { ascending });
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },

    async filter(query = {}, sortBy = null, limit = null) {
      let q = supabase.from(tableName).select('*');
      for (const [key, val] of Object.entries(query)) {
        if (val !== undefined && val !== null) {
          q = q.eq(key, val);
        }
      }
      if (sortBy) {
        const { column, ascending } = parseSort(sortBy);
        q = q.order(column, { ascending });
      }
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },

    async create(payload) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from(tableName)
        .insert({ ...payload, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...payload, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

export const Campaign = createEntityAPI('campaigns');
export const WorldEntity = createEntityAPI('world_entities');
export const Session = createEntityAPI('sessions');
export const Relationship = createEntityAPI('relationships');
export const CampaignMap = createEntityAPI('campaign_maps');
export const QuickNote = createEntityAPI('quick_notes');
export const RandomTable = createEntityAPI('random_tables');
export const PartyInventory = createEntityAPI('party_inventory');
export const PlayerNote = createEntityAPI('player_notes');
export const Feedback = createEntityAPI('feedback');
export const Announcement = createEntityAPI('announcements');
export const Changelog = createEntityAPI('changelog');
export const Setting = createEntityAPI('app_settings');
export const BattleMap = createEntityAPI('battle_maps');

export async function UploadFile({ file }) {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('uploads').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return { file_url: data.publicUrl };
}

export const functions = {
  invoke: async (name, payload) => {
    const FUNCTION_MAP = {
      exportCampaign: 'export-campaign',
      importCampaign: 'import-campaign',
      importDndBeyondCharacter: 'import-dndbeyond',
      exportAccount: 'export-account',
      deleteAccount: 'delete-account',
      partyInventory: 'party-inventory',
      battleMap: 'battle-map',
    };
    const fnName = FUNCTION_MAP[name] || name;
    const { data, error } = await supabase.functions.invoke(fnName, { body: payload });
    if (error) throw error;
    return { data };
  },
};

export const auth = {
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },
  logout: async (redirectUrl) => {
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
  },
  redirectToLogin: () => {},
};
