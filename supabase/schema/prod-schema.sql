-- snapshot-version: 20260713162712
-- Production schema only (no data), dumped by .github/workflows/schema-snapshot.yml on 2026-11-27.
-- Loaded by CI's db job to test new migrations. Never applied to production. Do not edit by hand.



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."broadcast_entity_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare cid uuid := coalesce(new.campaign_id, old.campaign_id);
begin
  if cid is not null then
    perform realtime.send(
      jsonb_build_object('at', extract(epoch from now())),
      'entities',
      'campaign:' || cid::text,
      false
    );
  end if;
  return null;
end $$;


ALTER FUNCTION "public"."broadcast_entity_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bump_campaign_pulse"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare cid uuid := coalesce(new.campaign_id, old.campaign_id);
begin
  if cid is not null and exists (select 1 from campaigns where id = cid) then
    insert into campaign_pulse(campaign_id, updated_at) values (cid, now())
    on conflict (campaign_id) do update set updated_at = now();
    -- Public broadcast channel "pulse:<campaign_id>"; secrets-free signal only.
    perform realtime.send(
      jsonb_build_object('at', now()),
      'bump',
      'pulse:' || cid::text,
      false
    );
  end if;
  return null;
end
$$;


ALTER FUNCTION "public"."bump_campaign_pulse"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_free_campaign_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
declare
  v_owner uuid := new.created_by;
  v_plan  text;
  v_count integer;
begin
  if v_owner is null then
    return new;
  end if;
  -- Demo campaigns are always allowed and never counted.
  if coalesce(new.is_demo, false) then
    return new;
  end if;
  select plan into v_plan from public.user_profiles where id = v_owner;
  if v_plan is null then
    v_plan := 'free';
  end if;
  if v_plan <> 'free' then
    return new;
  end if;
  select count(*) into v_count
    from public.campaigns
    where created_by = v_owner and coalesce(is_demo, false) = false;
  if v_count >= 1 then
    raise exception 'Free plan is limited to 1 campaign. Upgrade to create more.'
      using errcode = 'P0001', hint = 'CAMPAIGN_LIMIT_REACHED';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_free_campaign_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_campaign_shared"("cid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ select exists(select 1 from campaigns where id = cid and is_shared = true) $$;


ALTER FUNCTION "public"."is_campaign_shared"("cid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_date = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_date"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "level" "text" DEFAULT 'info'::"text" NOT NULL,
    "published" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "created_date" timestamp with time zone DEFAULT "now"(),
    "updated_date" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" "text" DEFAULT 'global'::"text" NOT NULL,
    "accent" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."battle_maps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "name" "text" DEFAULT 'Battle Map'::"text" NOT NULL,
    "image_url" "text",
    "grid_cols" integer DEFAULT 0 NOT NULL,
    "locked" boolean DEFAULT false NOT NULL,
    "active" boolean DEFAULT false NOT NULL,
    "tokens" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fog" "jsonb",
    "turn" "jsonb"
);


ALTER TABLE "public"."battle_maps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text",
    "body" "text",
    "cover_image" "text",
    "category" "text" DEFAULT 'GM Tips'::"text",
    "author" "text" DEFAULT 'GM/OS'::"text",
    "published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_maps" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "name" "text",
    "image_url" "text",
    "pins" "jsonb" DEFAULT '[]'::"jsonb",
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "linked_entity_id" "uuid",
    "linked_entity_name" "text"
);


ALTER TABLE "public"."campaign_maps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaign_pulse" (
    "campaign_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."campaign_pulse" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "setting" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_session_number" integer DEFAULT 0,
    "active_mode" "text" DEFAULT 'session'::"text",
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "is_shared" boolean DEFAULT false,
    "player_share_token" "uuid" DEFAULT "gen_random_uuid"(),
    "system" "text" DEFAULT 'dnd5e'::"text" NOT NULL,
    "is_demo" boolean DEFAULT false,
    "background" "text",
    "hook" "text",
    "party_currency" "jsonb" DEFAULT '{}'::"jsonb",
    "enabled_entity_types" "jsonb",
    "disabled_entity_types" "jsonb",
    "player_notice" "text",
    CONSTRAINT "campaigns_active_mode_check" CHECK (("active_mode" = ANY (ARRAY['session'::"text", 'debrief'::"text"]))),
    CONSTRAINT "campaigns_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."changelog" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "version" "text" NOT NULL,
    "date" "text",
    "entries" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "published" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_date" timestamp with time zone DEFAULT "now"(),
    "updated_date" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."changelog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entity_types" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "label_singular" "text",
    "icon" "text" DEFAULT 'Shapes'::"text" NOT NULL,
    "color" "text" DEFAULT 'slate'::"text" NOT NULL,
    "group_label" "text" DEFAULT 'Custom'::"text" NOT NULL,
    "player_visible" boolean DEFAULT false NOT NULL,
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."entity_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text" DEFAULT 'feedback'::"text" NOT NULL,
    "message" "text" NOT NULL,
    "user_email" "text",
    "page" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_by" "uuid",
    "created_date" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."party_inventory" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "carried_by" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_date" timestamp with time zone DEFAULT "now"(),
    "updated_date" timestamp with time zone DEFAULT "now"(),
    "equipped" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."party_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "author" "text",
    "created_by" "uuid",
    "created_date" timestamp with time zone DEFAULT "now"(),
    "updated_date" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."player_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quick_notes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "session_id" "uuid",
    "content" "text" NOT NULL,
    "processed" boolean DEFAULT false,
    "extracted_entities" "text"[] DEFAULT '{}'::"text"[],
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "pinned" boolean DEFAULT false
);


ALTER TABLE "public"."quick_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."random_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'custom'::"text" NOT NULL,
    "entries" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."random_tables" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."relationships" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "source_entity_id" "uuid",
    "source_name" "text",
    "target_entity_id" "uuid",
    "target_name" "text",
    "relationship_type" "text" NOT NULL,
    "description" "text",
    "notes" "text",
    "status" "text" DEFAULT 'active'::"text",
    "strength" integer DEFAULT 5,
    "session_established" integer,
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "relationships_relationship_type_check" CHECK (("relationship_type" = ANY (ARRAY['allied_with'::"text", 'enemy_of'::"text", 'located_in'::"text", 'member_of'::"text", 'owns'::"text", 'seeks'::"text", 'knows'::"text", 'loves'::"text", 'hates'::"text", 'fears'::"text", 'owes'::"text", 'employed_by'::"text", 'rivals'::"text", 'mentors'::"text", 'parent_of'::"text", 'sibling_of'::"text", 'married_to'::"text", 'betrayed_by'::"text"]))),
    CONSTRAINT "relationships_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'broken'::"text", 'secret'::"text", 'suspected'::"text", 'historical'::"text"]))),
    CONSTRAINT "relationships_strength_check" CHECK ((("strength" >= 1) AND ("strength" <= 10)))
);


ALTER TABLE "public"."relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "session_number" integer NOT NULL,
    "title" "text",
    "date" timestamp with time zone,
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "previous_session_recap" "text",
    "strong_start" "text",
    "npc_notes" "text",
    "monster_notes" "text",
    "location_notes" "text",
    "rumors" "text",
    "treasure_notes" "text",
    "raw_notes" "text",
    "planned_encounters" "text"[] DEFAULT '{}'::"text"[],
    "creature_ids" "text"[] DEFAULT '{}'::"text"[],
    "planned_locations" "text"[] DEFAULT '{}'::"text"[],
    "npc_ids" "text"[] DEFAULT '{}'::"text"[],
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "linked_entities" "jsonb" DEFAULT '[]'::"jsonb",
    "session_goals" "jsonb" DEFAULT '[]'::"jsonb",
    "summary" "text",
    "next_session_primer" "text",
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "resources" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "planned_events" "uuid"[] DEFAULT '{}'::"uuid"[],
    "event_notes" "text",
    "thread_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "thread_notes" "text",
    "key_events" "jsonb" DEFAULT '[]'::"jsonb",
    "potential_scenes" "jsonb" DEFAULT '[]'::"jsonb",
    "secrets_and_clues" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "sessions_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'in_progress'::"text", 'completed'::"text", 'debriefed'::"text"])))
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_events" (
    "id" "text" NOT NULL,
    "type" "text",
    "received_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan_expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false NOT NULL,
    CONSTRAINT "user_profiles_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'plus'::"text", 'monthly'::"text", 'yearly'::"text", 'lifetime'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."world_entities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "campaign_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "summary" "text",
    "description" "text",
    "status" "text" DEFAULT 'active'::"text",
    "visibility" "text" DEFAULT 'gm_only'::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "key_facts" "text"[] DEFAULT '{}'::"text"[],
    "last_seen_session" integer,
    "image_url" "text",
    "npc_data" "jsonb" DEFAULT '{}'::"jsonb",
    "extra_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "world_entities_entity_type_check" CHECK ((("char_length"("entity_type") >= 1) AND ("char_length"("entity_type") <= 64))),
    CONSTRAINT "world_entities_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'dead'::"text", 'destroyed'::"text", 'resolved'::"text", 'unknown'::"text"]))),
    CONSTRAINT "world_entities_visibility_check" CHECK (("visibility" = ANY (ARRAY['gm_only'::"text", 'players_know'::"text", 'players_suspect'::"text", 'false_info'::"text"])))
);


ALTER TABLE "public"."world_entities" OWNER TO "postgres";


ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."battle_maps"
    ADD CONSTRAINT "battle_maps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."campaign_maps"
    ADD CONSTRAINT "campaign_maps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaign_pulse"
    ADD CONSTRAINT "campaign_pulse_pkey" PRIMARY KEY ("campaign_id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."changelog"
    ADD CONSTRAINT "changelog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entity_types"
    ADD CONSTRAINT "entity_types_created_by_key_key" UNIQUE ("created_by", "key");



ALTER TABLE ONLY "public"."entity_types"
    ADD CONSTRAINT "entity_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."party_inventory"
    ADD CONSTRAINT "party_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_notes"
    ADD CONSTRAINT "player_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quick_notes"
    ADD CONSTRAINT "quick_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."random_tables"
    ADD CONSTRAINT "random_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_events"
    ADD CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."world_entities"
    ADD CONSTRAINT "world_entities_pkey" PRIMARY KEY ("id");



CREATE INDEX "battle_maps_campaign_idx" ON "public"."battle_maps" USING "btree" ("campaign_id");



CREATE INDEX "blog_posts_published_idx" ON "public"."blog_posts" USING "btree" ("published", "published_at" DESC);



CREATE INDEX "campaigns_created_by_idx" ON "public"."campaigns" USING "btree" ("created_by");



CREATE INDEX "entity_types_created_by_idx" ON "public"."entity_types" USING "btree" ("created_by");



CREATE INDEX "feedback_status_idx" ON "public"."feedback" USING "btree" ("status", "created_date" DESC);



CREATE INDEX "idx_campaign_maps_campaign_id" ON "public"."campaign_maps" USING "btree" ("campaign_id");



CREATE INDEX "idx_campaign_maps_created_by" ON "public"."campaign_maps" USING "btree" ("created_by");



CREATE INDEX "idx_campaign_maps_linked_entity_id" ON "public"."campaign_maps" USING "btree" ("linked_entity_id");



CREATE INDEX "idx_quick_notes_campaign_id" ON "public"."quick_notes" USING "btree" ("campaign_id");



CREATE INDEX "idx_quick_notes_created_by" ON "public"."quick_notes" USING "btree" ("created_by");



CREATE INDEX "idx_quick_notes_session_id" ON "public"."quick_notes" USING "btree" ("session_id");



CREATE INDEX "idx_random_tables_created_by" ON "public"."random_tables" USING "btree" ("created_by");



CREATE INDEX "idx_relationships_campaign_id" ON "public"."relationships" USING "btree" ("campaign_id");



CREATE INDEX "idx_relationships_created_by" ON "public"."relationships" USING "btree" ("created_by");



CREATE INDEX "idx_relationships_source_entity_id" ON "public"."relationships" USING "btree" ("source_entity_id");



CREATE INDEX "idx_relationships_target_entity_id" ON "public"."relationships" USING "btree" ("target_entity_id");



CREATE INDEX "idx_sessions_campaign_id" ON "public"."sessions" USING "btree" ("campaign_id");



CREATE INDEX "idx_sessions_created_by" ON "public"."sessions" USING "btree" ("created_by");



CREATE INDEX "idx_world_entities_campaign_id" ON "public"."world_entities" USING "btree" ("campaign_id");



CREATE INDEX "idx_world_entities_created_by" ON "public"."world_entities" USING "btree" ("created_by");



CREATE UNIQUE INDEX "newsletter_subscribers_email_lower_idx" ON "public"."newsletter_subscribers" USING "btree" ("lower"("email"));



CREATE INDEX "party_inventory_campaign_idx" ON "public"."party_inventory" USING "btree" ("campaign_id");



CREATE INDEX "player_notes_campaign_idx" ON "public"."player_notes" USING "btree" ("campaign_id");



CREATE INDEX "random_tables_campaign_id_idx" ON "public"."random_tables" USING "btree" ("campaign_id");



CREATE OR REPLACE TRIGGER "campaign_maps_updated_date" BEFORE UPDATE ON "public"."campaign_maps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_date"();



CREATE OR REPLACE TRIGGER "campaigns_updated_date" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_date"();



CREATE OR REPLACE TRIGGER "quick_notes_updated_date" BEFORE UPDATE ON "public"."quick_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_date"();



CREATE OR REPLACE TRIGGER "relationships_updated_date" BEFORE UPDATE ON "public"."relationships" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_date"();



CREATE OR REPLACE TRIGGER "sessions_updated_date" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_date"();



CREATE OR REPLACE TRIGGER "trg_enforce_free_campaign_limit" BEFORE INSERT ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_free_campaign_limit"();



CREATE OR REPLACE TRIGGER "world_entities_pulse" AFTER INSERT OR DELETE OR UPDATE ON "public"."world_entities" FOR EACH ROW EXECUTE FUNCTION "public"."bump_campaign_pulse"();



CREATE OR REPLACE TRIGGER "world_entities_updated_date" BEFORE UPDATE ON "public"."world_entities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_date"();



ALTER TABLE ONLY "public"."battle_maps"
    ADD CONSTRAINT "battle_maps_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_maps"
    ADD CONSTRAINT "campaign_maps_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaign_maps"
    ADD CONSTRAINT "campaign_maps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaign_maps"
    ADD CONSTRAINT "campaign_maps_linked_entity_id_fkey" FOREIGN KEY ("linked_entity_id") REFERENCES "public"."world_entities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campaign_pulse"
    ADD CONSTRAINT "campaign_pulse_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."entity_types"
    ADD CONSTRAINT "entity_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."party_inventory"
    ADD CONSTRAINT "party_inventory_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_notes"
    ADD CONSTRAINT "player_notes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quick_notes"
    ADD CONSTRAINT "quick_notes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quick_notes"
    ADD CONSTRAINT "quick_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quick_notes"
    ADD CONSTRAINT "quick_notes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."random_tables"
    ADD CONSTRAINT "random_tables_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."random_tables"
    ADD CONSTRAINT "random_tables_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_source_entity_id_fkey" FOREIGN KEY ("source_entity_id") REFERENCES "public"."world_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relationships"
    ADD CONSTRAINT "relationships_target_entity_id_fkey" FOREIGN KEY ("target_entity_id") REFERENCES "public"."world_entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."world_entities"
    ADD CONSTRAINT "world_entities_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."world_entities"
    ADD CONSTRAINT "world_entities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



CREATE POLICY "Anyone reads app settings" ON "public"."app_settings" FOR SELECT USING (true);



CREATE POLICY "Owners manage party inventory" ON "public"."party_inventory" USING ((EXISTS ( SELECT 1
   FROM "public"."campaigns" "c"
  WHERE (("c"."id" = "party_inventory"."campaign_id") AND ("c"."created_by" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."campaigns" "c"
  WHERE (("c"."id" = "party_inventory"."campaign_id") AND ("c"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Owners manage player notes" ON "public"."player_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."campaigns" "c"
  WHERE (("c"."id" = "player_notes"."campaign_id") AND ("c"."created_by" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."campaigns" "c"
  WHERE (("c"."id" = "player_notes"."campaign_id") AND ("c"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Read published announcements" ON "public"."announcements" FOR SELECT USING (("published" = true));



CREATE POLICY "Read published blog posts" ON "public"."blog_posts" FOR SELECT USING (("published" = true));



CREATE POLICY "Read published changelog" ON "public"."changelog" FOR SELECT USING (("published" = true));



CREATE POLICY "Users insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "id") AND (COALESCE("is_admin", false) = false) AND (COALESCE("plan", 'free'::"text") = 'free'::"text")));



CREATE POLICY "Users read own feedback" ON "public"."feedback" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "Users read own profile" ON "public"."user_profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users submit feedback" ON "public"."feedback" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anyone can subscribe" ON "public"."newsletter_subscribers" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battle_maps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "battle_maps_owner" ON "public"."battle_maps" TO "authenticated" USING (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaign_maps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaign_maps_owner" ON "public"."campaign_maps" USING (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."campaign_pulse" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "campaigns_owner" ON "public"."campaigns" USING ((( SELECT "auth"."uid"() AS "uid") = "created_by")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



ALTER TABLE "public"."changelog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."entity_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_all" ON "public"."entity_types" USING ((( SELECT "auth"."uid"() AS "uid") = "created_by")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



CREATE POLICY "owner_all" ON "public"."random_tables" USING ((( SELECT "auth"."uid"() AS "uid") = "created_by")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "created_by"));



ALTER TABLE "public"."party_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quick_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quick_notes_owner" ON "public"."quick_notes" USING (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."random_tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."relationships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "relationships_owner" ON "public"."relationships" USING (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessions_owner" ON "public"."sessions" USING (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid")))));



ALTER TABLE "public"."stripe_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."world_entities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "world_entities_owner" ON "public"."world_entities" USING (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("campaign_id" IN ( SELECT "campaigns"."id"
   FROM "public"."campaigns"
  WHERE ("campaigns"."created_by" = ( SELECT "auth"."uid"() AS "uid")))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."battle_maps";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."campaign_pulse";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."broadcast_entity_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."broadcast_entity_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."bump_campaign_pulse"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."bump_campaign_pulse"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."enforce_free_campaign_limit"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enforce_free_campaign_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_free_campaign_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_free_campaign_limit"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_campaign_shared"("cid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_campaign_shared"("cid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_campaign_shared"("cid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_date"() TO "service_role";


















GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT SELECT("id") ON TABLE "public"."announcements" TO "anon";



GRANT SELECT("title") ON TABLE "public"."announcements" TO "anon";



GRANT SELECT("body") ON TABLE "public"."announcements" TO "anon";



GRANT SELECT("level") ON TABLE "public"."announcements" TO "anon";



GRANT SELECT("published") ON TABLE "public"."announcements" TO "anon";



GRANT SELECT("created_date") ON TABLE "public"."announcements" TO "anon";



GRANT SELECT("updated_date") ON TABLE "public"."announcements" TO "anon";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."battle_maps" TO "anon";
GRANT ALL ON TABLE "public"."battle_maps" TO "authenticated";
GRANT ALL ON TABLE "public"."battle_maps" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."campaign_maps" TO "anon";
GRANT ALL ON TABLE "public"."campaign_maps" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_maps" TO "service_role";



GRANT ALL ON TABLE "public"."campaign_pulse" TO "anon";
GRANT ALL ON TABLE "public"."campaign_pulse" TO "authenticated";
GRANT ALL ON TABLE "public"."campaign_pulse" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."changelog" TO "anon";
GRANT ALL ON TABLE "public"."changelog" TO "authenticated";
GRANT ALL ON TABLE "public"."changelog" TO "service_role";



GRANT ALL ON TABLE "public"."entity_types" TO "anon";
GRANT ALL ON TABLE "public"."entity_types" TO "authenticated";
GRANT ALL ON TABLE "public"."entity_types" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."party_inventory" TO "anon";
GRANT ALL ON TABLE "public"."party_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."party_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."player_notes" TO "anon";
GRANT ALL ON TABLE "public"."player_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."player_notes" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."quick_notes" TO "anon";
GRANT ALL ON TABLE "public"."quick_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."quick_notes" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."random_tables" TO "anon";
GRANT ALL ON TABLE "public"."random_tables" TO "authenticated";
GRANT ALL ON TABLE "public"."random_tables" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."relationships" TO "anon";
GRANT ALL ON TABLE "public"."relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."relationships" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_events" TO "anon";
GRANT ALL ON TABLE "public"."stripe_events" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_events" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."world_entities" TO "anon";
GRANT ALL ON TABLE "public"."world_entities" TO "authenticated";
GRANT ALL ON TABLE "public"."world_entities" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































