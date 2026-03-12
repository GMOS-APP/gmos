/**
 * Drop-in replacement for the base44 SDK.
 * Provides the same interface (entities, auth, integrations, functions)
 * backed by Supabase + Vercel API routes.
 */
import { supabase } from './supabaseClient';

// Table name mapping (base44 entity name → Supabase table name)
const TABLE_MAP = {
  Campaign: 'campaigns',
  WorldEntity: 'world_entities',
  Session: 'sessions',
  Relationship: 'relationships',
  QuickNote: 'quick_notes',
  CampaignMap: 'campaign_maps',
};

/**
 * Parse base44-style sort string (e.g. "-created_date" → { column, ascending })
 */
function parseSort(sort) {
  if (!sort) return null;
  const ascending = !sort.startsWith('-');
  const column = sort.replace(/^-/, '');
  return { column, ascending };
}

/**
 * Build a Supabase entity API for a given table.
 */
function buildEntityApi(tableName) {
  return {
    async list(sort, limit = 1000) {
      let query = supabase.from(tableName).select('*');
      const s = parseSort(sort);
      if (s) query = query.order(s.column, { ascending: s.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async filter(filters = {}, sort, limit = 1000) {
      let query = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }
      const s = parseSort(sort);
      if (s) query = query.order(s.column, { ascending: s.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async create(record) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from(tableName)
        .insert({ ...record, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async bulkCreate(records) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from(tableName)
        .insert(records.map(r => ({ ...r, created_by: user?.id })))
        .select();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id };
    },
  };
}

// Build entity APIs for all tables
const entities = Object.fromEntries(
  Object.entries(TABLE_MAP).map(([name, table]) => [name, buildEntityApi(table)])
);

// =====================
// AUTH
// =====================
const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
    return user;
  },

  async logout(returnUrl) {
    await supabase.auth.signOut();
    if (returnUrl) {
      window.location.href = returnUrl;
    }
  },

  redirectToLogin(returnUrl) {
    const loginUrl = `/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
    window.location.href = loginUrl;
  },
};

// =====================
// INTEGRATIONS (LLM + File Upload via Vercel API routes)
// =====================
const integrations = {
  Core: {
    async InvokeLLM({ prompt, response_json_schema, add_context_from_internet }) {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, response_json_schema, add_context_from_internet }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'LLM request failed');
      }
      const data = await res.json();
      // If a JSON schema was requested, parse the structured response
      if (response_json_schema) {
        return typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      }
      return data.content;
    },

    async UploadFile({ file }) {
      const { data: { user } } = await supabase.auth.getUser();
      const ext = file.name.split('.').pop();
      const path = `${user?.id ?? 'anon'}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('maps').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('maps').getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
  },
};

// =====================
// FUNCTIONS (edge functions → Vercel API routes)
// =====================
const functions = {
  async invoke(functionName, payload) {
    const res = await fetch(`/api/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Object.assign(new Error(err.error || `Function ${functionName} failed`), {
        response: { data: err },
      });
    }
    return res.json();
  },
};

export const base44 = { entities, auth, integrations, functions };
