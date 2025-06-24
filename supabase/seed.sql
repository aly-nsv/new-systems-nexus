

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."advisor_priority_enum" AS ENUM (
    '1 - Highest',
    '2 - High',
    '3 - Medium',
    '4 - Low',
    '5 - Lowest',
    'Hold'
);


ALTER TYPE "public"."advisor_priority_enum" OWNER TO "postgres";


CREATE TYPE "public"."fund_type_enum" AS ENUM (
    'SPV',
    'Fund'
);


ALTER TYPE "public"."fund_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."priority_enum" AS ENUM (
    '1 - Highest',
    '2 - High',
    '3 - Medium',
    '4 - Low',
    '0 - On Hold'
);


ALTER TYPE "public"."priority_enum" OWNER TO "postgres";


CREATE TYPE "public"."round_stage_enum" AS ENUM (
    'Pre-Seed',
    'Seed',
    'Series A',
    'Series B',
    'Series C',
    'Series D',
    'Series E',
    'Series A Bridge',
    'Govt Funded',
    'Seed Extension',
    'Bridge',
    'Series B Bridge',
    'Convertible Note',
    'IPO',
    'Series A-1',
    'Series A-2',
    'Series B-2',
    'Other',
    'Series A-3',
    'Series C Bridge',
    'Dev Cap',
    'Angel',
    'Late Stage'
);


ALTER TYPE "public"."round_stage_enum" OWNER TO "postgres";


CREATE TYPE "public"."round_timing_enum" AS ENUM (
    'Q4 2023',
    'Q1 2024',
    'Q2 2024',
    'Q3 2024',
    'Q2 2023',
    'Q1 2023',
    'Q3 2023',
    'Q4 2024',
    'Q1 2025',
    'Q2 2025',
    'Q3 2025',
    'Q4 2025'
);


ALTER TYPE "public"."round_timing_enum" OWNER TO "postgres";


CREATE TYPE "public"."status_enum" AS ENUM (
    'Invested',
    'Diligence 3 (IC Memo)',
    'Diligence 2 (Screening Memo)',
    'Diligence 1',
    'Debrief',
    'New Company',
    'Meeting Booked',
    'To Be Scheduled',
    'To Pass',
    'Waiting for Lead',
    'Follow Up',
    'Actively Monitor',
    'Passively Monitor',
    'Out of Scope',
    'Pass',
    'Newlab Syndicate Investment'
);


ALTER TYPE "public"."status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."action_items_by_user" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "company_name",
    NULL::"text" AS "description_short",
    NULL::"text" AS "website",
    NULL::character varying(255) AS "geography",
    NULL::character varying(255) AS "company_contact",
    NULL::"public"."status_enum" AS "status",
    NULL::"public"."status_enum" AS "final_status",
    NULL::"public"."priority_enum" AS "priority",
    NULL::boolean AS "to_review",
    NULL::"public"."round_stage_enum" AS "round_stage",
    NULL::"public"."round_timing_enum" AS "round_timing",
    NULL::bigint AS "round_size",
    NULL::bigint AS "pre_money_valuation",
    NULL::numeric(15,2) AS "total_raised",
    NULL::numeric(15,2) AS "check_size_allocation",
    NULL::numeric(15,2) AS "most_recent_valuation",
    NULL::"date" AS "investment_date",
    NULL::"date" AS "pass_date",
    NULL::"date" AS "signed_nda",
    NULL::"text" AS "decision_overview",
    NULL::"text" AS "product_analysis",
    NULL::"text" AS "value_proposition",
    NULL::"text" AS "market_analysis",
    NULL::"text" AS "team_analysis",
    NULL::"text" AS "what_to_believe",
    NULL::"text" AS "deal_team_next_step",
    NULL::"text" AS "advisor_recommendation",
    NULL::"text" AS "completed_tasks",
    NULL::"text" AS "notes_links",
    NULL::"text" AS "review_material_link",
    NULL::"text" AS "deck_url",
    NULL::"text" AS "investments_drive_folder",
    NULL::"text" AS "data_room_url",
    NULL::"text" AS "notissia_deck_link",
    NULL::boolean AS "two_pager_ready",
    NULL::"public"."fund_type_enum" AS "fund_type",
    NULL::"public"."advisor_priority_enum" AS "advisor_priority",
    NULL::character varying(255) AS "investor_crm",
    NULL::timestamp with time zone AS "created_at",
    NULL::"uuid" AS "created_by",
    NULL::timestamp with time zone AS "updated_at",
    NULL::character varying(255) AS "airtable_record_id",
    NULL::timestamp with time zone AS "migrated_at",
    NULL::character varying(255) AS "assignee_name",
    NULL::character varying(255) AS "assignee_email",
    NULL::character varying[] AS "slr_categories";


ALTER VIEW "public"."action_items_by_user" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."deal_lead_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "color" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deal_lead_categories" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."investment_pipeline" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "company_name",
    NULL::"text" AS "description_short",
    NULL::"text" AS "website",
    NULL::character varying(255) AS "geography",
    NULL::character varying(255) AS "company_contact",
    NULL::"public"."status_enum" AS "status",
    NULL::"public"."status_enum" AS "final_status",
    NULL::"public"."priority_enum" AS "priority",
    NULL::boolean AS "to_review",
    NULL::"public"."round_stage_enum" AS "round_stage",
    NULL::"public"."round_timing_enum" AS "round_timing",
    NULL::bigint AS "round_size",
    NULL::bigint AS "pre_money_valuation",
    NULL::numeric(15,2) AS "total_raised",
    NULL::numeric(15,2) AS "check_size_allocation",
    NULL::numeric(15,2) AS "most_recent_valuation",
    NULL::"date" AS "investment_date",
    NULL::"date" AS "pass_date",
    NULL::"date" AS "signed_nda",
    NULL::"text" AS "decision_overview",
    NULL::"text" AS "product_analysis",
    NULL::"text" AS "value_proposition",
    NULL::"text" AS "market_analysis",
    NULL::"text" AS "team_analysis",
    NULL::"text" AS "what_to_believe",
    NULL::"text" AS "deal_team_next_step",
    NULL::"text" AS "advisor_recommendation",
    NULL::"text" AS "completed_tasks",
    NULL::"text" AS "notes_links",
    NULL::"text" AS "review_material_link",
    NULL::"text" AS "deck_url",
    NULL::"text" AS "investments_drive_folder",
    NULL::"text" AS "data_room_url",
    NULL::"text" AS "notissia_deck_link",
    NULL::boolean AS "two_pager_ready",
    NULL::"public"."fund_type_enum" AS "fund_type",
    NULL::"public"."advisor_priority_enum" AS "advisor_priority",
    NULL::character varying(255) AS "investor_crm",
    NULL::timestamp with time zone AS "created_at",
    NULL::"uuid" AS "created_by",
    NULL::timestamp with time zone AS "updated_at",
    NULL::character varying(255) AS "airtable_record_id",
    NULL::timestamp with time zone AS "migrated_at",
    NULL::character varying[] AS "slr_categories",
    NULL::character varying[] AS "assignees";


ALTER VIEW "public"."investment_pipeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investor_crm" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "title" character varying(255),
    "firm" character varying(255),
    "email" character varying(255),
    "linkedin" "text",
    "location" character varying(255),
    "relationship_owner_id" "uuid",
    "focus_areas" "text",
    "investor_type" character varying(100),
    "stage" character varying(100),
    "typical_check_size" character varying(100),
    "notable_investments" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "airtable_record_id" character varying(255)
);


ALTER TABLE "public"."investor_crm" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."new_companies" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "company_name",
    NULL::"text" AS "description_short",
    NULL::"text" AS "website",
    NULL::character varying(255) AS "geography",
    NULL::character varying(255) AS "company_contact",
    NULL::"public"."status_enum" AS "status",
    NULL::"public"."status_enum" AS "final_status",
    NULL::"public"."priority_enum" AS "priority",
    NULL::boolean AS "to_review",
    NULL::"public"."round_stage_enum" AS "round_stage",
    NULL::"public"."round_timing_enum" AS "round_timing",
    NULL::bigint AS "round_size",
    NULL::bigint AS "pre_money_valuation",
    NULL::numeric(15,2) AS "total_raised",
    NULL::numeric(15,2) AS "check_size_allocation",
    NULL::numeric(15,2) AS "most_recent_valuation",
    NULL::"date" AS "investment_date",
    NULL::"date" AS "pass_date",
    NULL::"date" AS "signed_nda",
    NULL::"text" AS "decision_overview",
    NULL::"text" AS "product_analysis",
    NULL::"text" AS "value_proposition",
    NULL::"text" AS "market_analysis",
    NULL::"text" AS "team_analysis",
    NULL::"text" AS "what_to_believe",
    NULL::"text" AS "deal_team_next_step",
    NULL::"text" AS "advisor_recommendation",
    NULL::"text" AS "completed_tasks",
    NULL::"text" AS "notes_links",
    NULL::"text" AS "review_material_link",
    NULL::"text" AS "deck_url",
    NULL::"text" AS "investments_drive_folder",
    NULL::"text" AS "data_room_url",
    NULL::"text" AS "notissia_deck_link",
    NULL::boolean AS "two_pager_ready",
    NULL::"public"."fund_type_enum" AS "fund_type",
    NULL::"public"."advisor_priority_enum" AS "advisor_priority",
    NULL::character varying(255) AS "investor_crm",
    NULL::timestamp with time zone AS "created_at",
    NULL::"uuid" AS "created_by",
    NULL::timestamp with time zone AS "updated_at",
    NULL::character varying(255) AS "airtable_record_id",
    NULL::timestamp with time zone AS "migrated_at",
    NULL::character varying[] AS "slr_categories",
    NULL::character varying[] AS "assignees";


ALTER VIEW "public"."new_companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_name" "text" NOT NULL,
    "description_short" "text",
    "website" "text",
    "geography" character varying(255),
    "company_contact" character varying(255),
    "status" "public"."status_enum",
    "final_status" "public"."status_enum",
    "priority" "public"."priority_enum",
    "to_review" boolean DEFAULT false,
    "round_stage" "public"."round_stage_enum",
    "round_timing" "public"."round_timing_enum",
    "round_size" bigint,
    "pre_money_valuation" bigint,
    "total_raised" numeric(15,2),
    "check_size_allocation" numeric(15,2),
    "most_recent_valuation" numeric(15,2),
    "investment_date" "date",
    "pass_date" "date",
    "signed_nda" "date",
    "decision_overview" "text",
    "product_analysis" "text",
    "value_proposition" "text",
    "market_analysis" "text",
    "team_analysis" "text",
    "what_to_believe" "text",
    "deal_team_next_step" "text",
    "advisor_recommendation" "text",
    "completed_tasks" "text",
    "notes_links" "text",
    "review_material_link" "text",
    "deck_url" "text",
    "investments_drive_folder" "text",
    "data_room_url" "text",
    "notissia_deck_link" "text",
    "two_pager_ready" boolean DEFAULT false,
    "fund_type" "public"."fund_type_enum",
    "advisor_priority" "public"."advisor_priority_enum",
    "investor_crm" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "airtable_record_id" character varying(255),
    "migrated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_assignees" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_assignees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_attachments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "file_type" character varying(50) NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" bigint,
    "mime_type" character varying(100),
    "airtable_attachment_id" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_deal_lead" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "deal_lead_category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_deal_lead" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_investor_crm" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "investor_crm_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_investor_crm" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_pass_communicator" (
    "pipeline_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_pass_communicator" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_slr" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "slr_category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_slr" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_source" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "source_category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_source" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_theme" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pipeline_id" "uuid" NOT NULL,
    "theme_category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pipeline_theme" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."portfolio" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "company_name",
    NULL::"text" AS "description_short",
    NULL::"text" AS "website",
    NULL::character varying(255) AS "geography",
    NULL::character varying(255) AS "company_contact",
    NULL::"public"."status_enum" AS "status",
    NULL::"public"."status_enum" AS "final_status",
    NULL::"public"."priority_enum" AS "priority",
    NULL::boolean AS "to_review",
    NULL::"public"."round_stage_enum" AS "round_stage",
    NULL::"public"."round_timing_enum" AS "round_timing",
    NULL::bigint AS "round_size",
    NULL::bigint AS "pre_money_valuation",
    NULL::numeric(15,2) AS "total_raised",
    NULL::numeric(15,2) AS "check_size_allocation",
    NULL::numeric(15,2) AS "most_recent_valuation",
    NULL::"date" AS "investment_date",
    NULL::"date" AS "pass_date",
    NULL::"date" AS "signed_nda",
    NULL::"text" AS "decision_overview",
    NULL::"text" AS "product_analysis",
    NULL::"text" AS "value_proposition",
    NULL::"text" AS "market_analysis",
    NULL::"text" AS "team_analysis",
    NULL::"text" AS "what_to_believe",
    NULL::"text" AS "deal_team_next_step",
    NULL::"text" AS "advisor_recommendation",
    NULL::"text" AS "completed_tasks",
    NULL::"text" AS "notes_links",
    NULL::"text" AS "review_material_link",
    NULL::"text" AS "deck_url",
    NULL::"text" AS "investments_drive_folder",
    NULL::"text" AS "data_room_url",
    NULL::"text" AS "notissia_deck_link",
    NULL::boolean AS "two_pager_ready",
    NULL::"public"."fund_type_enum" AS "fund_type",
    NULL::"public"."advisor_priority_enum" AS "advisor_priority",
    NULL::character varying(255) AS "investor_crm",
    NULL::timestamp with time zone AS "created_at",
    NULL::"uuid" AS "created_by",
    NULL::timestamp with time zone AS "updated_at",
    NULL::character varying(255) AS "airtable_record_id",
    NULL::timestamp with time zone AS "migrated_at",
    NULL::character varying[] AS "slr_categories",
    NULL::double precision AS "ownership_percentage",
    NULL::double precision AS "valuation_step_up";


ALTER VIEW "public"."portfolio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slr_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "color" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."slr_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."source_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "color" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."source_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."theme_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "color" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."theme_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."todos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "task" "text" NOT NULL,
    "priority" "public"."priority_enum",
    "assignee_id" "uuid",
    "pipeline_id" "uuid",
    "date_assigned" "date",
    "date_completed" "date",
    "done" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "airtable_record_id" character varying(255)
);


ALTER TABLE "public"."todos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "name" character varying(255),
    "airtable_user_id" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."deal_lead_categories"
    ADD CONSTRAINT "deal_lead_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."deal_lead_categories"
    ADD CONSTRAINT "deal_lead_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investor_crm"
    ADD CONSTRAINT "investor_crm_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."investor_crm"
    ADD CONSTRAINT "investor_crm_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline"
    ADD CONSTRAINT "pipeline_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."pipeline_assignees"
    ADD CONSTRAINT "pipeline_assignees_pipeline_id_user_id_key" UNIQUE ("pipeline_id", "user_id");



ALTER TABLE ONLY "public"."pipeline_assignees"
    ADD CONSTRAINT "pipeline_assignees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_attachments"
    ADD CONSTRAINT "pipeline_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_deal_lead"
    ADD CONSTRAINT "pipeline_deal_lead_pipeline_id_deal_lead_category_id_key" UNIQUE ("pipeline_id", "deal_lead_category_id");



ALTER TABLE ONLY "public"."pipeline_deal_lead"
    ADD CONSTRAINT "pipeline_deal_lead_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_investor_crm"
    ADD CONSTRAINT "pipeline_investor_crm_pipeline_id_investor_crm_id_key" UNIQUE ("pipeline_id", "investor_crm_id");



ALTER TABLE ONLY "public"."pipeline_investor_crm"
    ADD CONSTRAINT "pipeline_investor_crm_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_pass_communicator"
    ADD CONSTRAINT "pipeline_pass_communicator_pkey" PRIMARY KEY ("pipeline_id");



ALTER TABLE ONLY "public"."pipeline"
    ADD CONSTRAINT "pipeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_slr"
    ADD CONSTRAINT "pipeline_slr_pipeline_id_slr_category_id_key" UNIQUE ("pipeline_id", "slr_category_id");



ALTER TABLE ONLY "public"."pipeline_slr"
    ADD CONSTRAINT "pipeline_slr_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_source"
    ADD CONSTRAINT "pipeline_source_pipeline_id_source_category_id_key" UNIQUE ("pipeline_id", "source_category_id");



ALTER TABLE ONLY "public"."pipeline_source"
    ADD CONSTRAINT "pipeline_source_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_theme"
    ADD CONSTRAINT "pipeline_theme_pipeline_id_theme_category_id_key" UNIQUE ("pipeline_id", "theme_category_id");



ALTER TABLE ONLY "public"."pipeline_theme"
    ADD CONSTRAINT "pipeline_theme_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slr_categories"
    ADD CONSTRAINT "slr_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."slr_categories"
    ADD CONSTRAINT "slr_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."source_categories"
    ADD CONSTRAINT "source_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."source_categories"
    ADD CONSTRAINT "source_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."theme_categories"
    ADD CONSTRAINT "theme_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."theme_categories"
    ADD CONSTRAINT "theme_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_airtable_record_id_key" UNIQUE ("airtable_record_id");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_airtable_user_id_key" UNIQUE ("airtable_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_pipeline_assignees_pipeline_id" ON "public"."pipeline_assignees" USING "btree" ("pipeline_id");



CREATE INDEX "idx_pipeline_assignees_user_id" ON "public"."pipeline_assignees" USING "btree" ("user_id");



CREATE INDEX "idx_pipeline_company_name" ON "public"."pipeline" USING "btree" ("company_name");



CREATE INDEX "idx_pipeline_created_at" ON "public"."pipeline" USING "btree" ("created_at");



CREATE INDEX "idx_pipeline_priority" ON "public"."pipeline" USING "btree" ("priority");



CREATE INDEX "idx_pipeline_round_stage" ON "public"."pipeline" USING "btree" ("round_stage");



CREATE INDEX "idx_pipeline_slr_category_id" ON "public"."pipeline_slr" USING "btree" ("slr_category_id");



CREATE INDEX "idx_pipeline_slr_pipeline_id" ON "public"."pipeline_slr" USING "btree" ("pipeline_id");



CREATE INDEX "idx_pipeline_status" ON "public"."pipeline" USING "btree" ("status");



CREATE INDEX "idx_pipeline_to_review" ON "public"."pipeline" USING "btree" ("to_review");



CREATE OR REPLACE VIEW "public"."new_companies" AS
 SELECT "p"."id",
    "p"."company_name",
    "p"."description_short",
    "p"."website",
    "p"."geography",
    "p"."company_contact",
    "p"."status",
    "p"."final_status",
    "p"."priority",
    "p"."to_review",
    "p"."round_stage",
    "p"."round_timing",
    "p"."round_size",
    "p"."pre_money_valuation",
    "p"."total_raised",
    "p"."check_size_allocation",
    "p"."most_recent_valuation",
    "p"."investment_date",
    "p"."pass_date",
    "p"."signed_nda",
    "p"."decision_overview",
    "p"."product_analysis",
    "p"."value_proposition",
    "p"."market_analysis",
    "p"."team_analysis",
    "p"."what_to_believe",
    "p"."deal_team_next_step",
    "p"."advisor_recommendation",
    "p"."completed_tasks",
    "p"."notes_links",
    "p"."review_material_link",
    "p"."deck_url",
    "p"."investments_drive_folder",
    "p"."data_room_url",
    "p"."notissia_deck_link",
    "p"."two_pager_ready",
    "p"."fund_type",
    "p"."advisor_priority",
    "p"."investor_crm",
    "p"."created_at",
    "p"."created_by",
    "p"."updated_at",
    "p"."airtable_record_id",
    "p"."migrated_at",
    "array_agg"(DISTINCT "sc"."name") AS "slr_categories",
    "array_agg"(DISTINCT "u"."name") AS "assignees"
   FROM (((("public"."pipeline" "p"
     LEFT JOIN "public"."pipeline_slr" "ps" ON (("p"."id" = "ps"."pipeline_id")))
     LEFT JOIN "public"."slr_categories" "sc" ON (("ps"."slr_category_id" = "sc"."id")))
     LEFT JOIN "public"."pipeline_assignees" "pa" ON (("p"."id" = "pa"."pipeline_id")))
     LEFT JOIN "public"."users" "u" ON (("pa"."user_id" = "u"."id")))
  WHERE (("p"."status" = 'New Company'::"public"."status_enum") OR ("p"."created_at" >= ("now"() - '30 days'::interval)))
  GROUP BY "p"."id"
  ORDER BY "p"."created_at" DESC;



CREATE OR REPLACE VIEW "public"."action_items_by_user" AS
 SELECT "p"."id",
    "p"."company_name",
    "p"."description_short",
    "p"."website",
    "p"."geography",
    "p"."company_contact",
    "p"."status",
    "p"."final_status",
    "p"."priority",
    "p"."to_review",
    "p"."round_stage",
    "p"."round_timing",
    "p"."round_size",
    "p"."pre_money_valuation",
    "p"."total_raised",
    "p"."check_size_allocation",
    "p"."most_recent_valuation",
    "p"."investment_date",
    "p"."pass_date",
    "p"."signed_nda",
    "p"."decision_overview",
    "p"."product_analysis",
    "p"."value_proposition",
    "p"."market_analysis",
    "p"."team_analysis",
    "p"."what_to_believe",
    "p"."deal_team_next_step",
    "p"."advisor_recommendation",
    "p"."completed_tasks",
    "p"."notes_links",
    "p"."review_material_link",
    "p"."deck_url",
    "p"."investments_drive_folder",
    "p"."data_room_url",
    "p"."notissia_deck_link",
    "p"."two_pager_ready",
    "p"."fund_type",
    "p"."advisor_priority",
    "p"."investor_crm",
    "p"."created_at",
    "p"."created_by",
    "p"."updated_at",
    "p"."airtable_record_id",
    "p"."migrated_at",
    "u"."name" AS "assignee_name",
    "u"."email" AS "assignee_email",
    "array_agg"(DISTINCT "sc"."name") AS "slr_categories"
   FROM (((("public"."pipeline" "p"
     JOIN "public"."pipeline_assignees" "pa" ON (("p"."id" = "pa"."pipeline_id")))
     JOIN "public"."users" "u" ON (("pa"."user_id" = "u"."id")))
     LEFT JOIN "public"."pipeline_slr" "ps" ON (("p"."id" = "ps"."pipeline_id")))
     LEFT JOIN "public"."slr_categories" "sc" ON (("ps"."slr_category_id" = "sc"."id")))
  WHERE ("p"."status" <> ALL (ARRAY['Pass'::"public"."status_enum", 'Invested'::"public"."status_enum", 'Out of Scope'::"public"."status_enum"]))
  GROUP BY "p"."id", "u"."name", "u"."email"
  ORDER BY "p"."priority", "p"."created_at" DESC;



CREATE OR REPLACE VIEW "public"."investment_pipeline" AS
 SELECT "p"."id",
    "p"."company_name",
    "p"."description_short",
    "p"."website",
    "p"."geography",
    "p"."company_contact",
    "p"."status",
    "p"."final_status",
    "p"."priority",
    "p"."to_review",
    "p"."round_stage",
    "p"."round_timing",
    "p"."round_size",
    "p"."pre_money_valuation",
    "p"."total_raised",
    "p"."check_size_allocation",
    "p"."most_recent_valuation",
    "p"."investment_date",
    "p"."pass_date",
    "p"."signed_nda",
    "p"."decision_overview",
    "p"."product_analysis",
    "p"."value_proposition",
    "p"."market_analysis",
    "p"."team_analysis",
    "p"."what_to_believe",
    "p"."deal_team_next_step",
    "p"."advisor_recommendation",
    "p"."completed_tasks",
    "p"."notes_links",
    "p"."review_material_link",
    "p"."deck_url",
    "p"."investments_drive_folder",
    "p"."data_room_url",
    "p"."notissia_deck_link",
    "p"."two_pager_ready",
    "p"."fund_type",
    "p"."advisor_priority",
    "p"."investor_crm",
    "p"."created_at",
    "p"."created_by",
    "p"."updated_at",
    "p"."airtable_record_id",
    "p"."migrated_at",
    "array_agg"(DISTINCT "sc"."name") AS "slr_categories",
    "array_agg"(DISTINCT "u"."name") AS "assignees"
   FROM (((("public"."pipeline" "p"
     LEFT JOIN "public"."pipeline_slr" "ps" ON (("p"."id" = "ps"."pipeline_id")))
     LEFT JOIN "public"."slr_categories" "sc" ON (("ps"."slr_category_id" = "sc"."id")))
     LEFT JOIN "public"."pipeline_assignees" "pa" ON (("p"."id" = "pa"."pipeline_id")))
     LEFT JOIN "public"."users" "u" ON (("pa"."user_id" = "u"."id")))
  WHERE ("p"."status" = ANY (ARRAY['Diligence 1'::"public"."status_enum", 'Diligence 2 (Screening Memo)'::"public"."status_enum", 'Diligence 3 (IC Memo)'::"public"."status_enum", 'Meeting Booked'::"public"."status_enum", 'To Be Scheduled'::"public"."status_enum"]))
  GROUP BY "p"."id"
  ORDER BY "p"."priority", "p"."created_at" DESC;



CREATE OR REPLACE VIEW "public"."portfolio" AS
 SELECT "p"."id",
    "p"."company_name",
    "p"."description_short",
    "p"."website",
    "p"."geography",
    "p"."company_contact",
    "p"."status",
    "p"."final_status",
    "p"."priority",
    "p"."to_review",
    "p"."round_stage",
    "p"."round_timing",
    "p"."round_size",
    "p"."pre_money_valuation",
    "p"."total_raised",
    "p"."check_size_allocation",
    "p"."most_recent_valuation",
    "p"."investment_date",
    "p"."pass_date",
    "p"."signed_nda",
    "p"."decision_overview",
    "p"."product_analysis",
    "p"."value_proposition",
    "p"."market_analysis",
    "p"."team_analysis",
    "p"."what_to_believe",
    "p"."deal_team_next_step",
    "p"."advisor_recommendation",
    "p"."completed_tasks",
    "p"."notes_links",
    "p"."review_material_link",
    "p"."deck_url",
    "p"."investments_drive_folder",
    "p"."data_room_url",
    "p"."notissia_deck_link",
    "p"."two_pager_ready",
    "p"."fund_type",
    "p"."advisor_priority",
    "p"."investor_crm",
    "p"."created_at",
    "p"."created_by",
    "p"."updated_at",
    "p"."airtable_record_id",
    "p"."migrated_at",
    "array_agg"(DISTINCT "sc"."name") AS "slr_categories",
    ((("p"."check_size_allocation")::double precision / NULLIF((("p"."pre_money_valuation" + "p"."round_size"))::double precision, (0)::double precision)) * (100)::double precision) AS "ownership_percentage",
        CASE
            WHEN ("p"."pre_money_valuation" > 0) THEN (("p"."most_recent_valuation")::double precision / ("p"."pre_money_valuation")::double precision)
            ELSE NULL::double precision
        END AS "valuation_step_up"
   FROM (("public"."pipeline" "p"
     LEFT JOIN "public"."pipeline_slr" "ps" ON (("p"."id" = "ps"."pipeline_id")))
     LEFT JOIN "public"."slr_categories" "sc" ON (("ps"."slr_category_id" = "sc"."id")))
  WHERE ("p"."status" = 'Invested'::"public"."status_enum")
  GROUP BY "p"."id"
  ORDER BY "p"."investment_date" DESC;



CREATE OR REPLACE TRIGGER "update_pipeline_updated_at" BEFORE UPDATE ON "public"."pipeline" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."investor_crm"
    ADD CONSTRAINT "investor_crm_relationship_owner_id_fkey" FOREIGN KEY ("relationship_owner_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pipeline_assignees"
    ADD CONSTRAINT "pipeline_assignees_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_assignees"
    ADD CONSTRAINT "pipeline_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_attachments"
    ADD CONSTRAINT "pipeline_attachments_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline"
    ADD CONSTRAINT "pipeline_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."pipeline_deal_lead"
    ADD CONSTRAINT "pipeline_deal_lead_deal_lead_category_id_fkey" FOREIGN KEY ("deal_lead_category_id") REFERENCES "public"."deal_lead_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_deal_lead"
    ADD CONSTRAINT "pipeline_deal_lead_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_investor_crm"
    ADD CONSTRAINT "pipeline_investor_crm_investor_crm_id_fkey" FOREIGN KEY ("investor_crm_id") REFERENCES "public"."investor_crm"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_investor_crm"
    ADD CONSTRAINT "pipeline_investor_crm_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_pass_communicator"
    ADD CONSTRAINT "pipeline_pass_communicator_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_pass_communicator"
    ADD CONSTRAINT "pipeline_pass_communicator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_slr"
    ADD CONSTRAINT "pipeline_slr_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_slr"
    ADD CONSTRAINT "pipeline_slr_slr_category_id_fkey" FOREIGN KEY ("slr_category_id") REFERENCES "public"."slr_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_source"
    ADD CONSTRAINT "pipeline_source_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_source"
    ADD CONSTRAINT "pipeline_source_source_category_id_fkey" FOREIGN KEY ("source_category_id") REFERENCES "public"."source_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_theme"
    ADD CONSTRAINT "pipeline_theme_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_theme"
    ADD CONSTRAINT "pipeline_theme_theme_category_id_fkey" FOREIGN KEY ("theme_category_id") REFERENCES "public"."theme_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."todos"
    ADD CONSTRAINT "todos_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipeline"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."action_items_by_user" TO "anon";
GRANT ALL ON TABLE "public"."action_items_by_user" TO "authenticated";
GRANT ALL ON TABLE "public"."action_items_by_user" TO "service_role";



GRANT ALL ON TABLE "public"."deal_lead_categories" TO "anon";
GRANT ALL ON TABLE "public"."deal_lead_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_lead_categories" TO "service_role";



GRANT ALL ON TABLE "public"."investment_pipeline" TO "anon";
GRANT ALL ON TABLE "public"."investment_pipeline" TO "authenticated";
GRANT ALL ON TABLE "public"."investment_pipeline" TO "service_role";



GRANT ALL ON TABLE "public"."investor_crm" TO "anon";
GRANT ALL ON TABLE "public"."investor_crm" TO "authenticated";
GRANT ALL ON TABLE "public"."investor_crm" TO "service_role";



GRANT ALL ON TABLE "public"."new_companies" TO "anon";
GRANT ALL ON TABLE "public"."new_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."new_companies" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline" TO "anon";
GRANT ALL ON TABLE "public"."pipeline" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_assignees" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_assignees" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_assignees" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_attachments" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_deal_lead" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_deal_lead" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_deal_lead" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_investor_crm" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_investor_crm" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_investor_crm" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_pass_communicator" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_pass_communicator" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_pass_communicator" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_slr" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_slr" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_slr" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_source" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_source" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_source" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_theme" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_theme" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_theme" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio" TO "anon";
GRANT ALL ON TABLE "public"."portfolio" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio" TO "service_role";



GRANT ALL ON TABLE "public"."slr_categories" TO "anon";
GRANT ALL ON TABLE "public"."slr_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."slr_categories" TO "service_role";



GRANT ALL ON TABLE "public"."source_categories" TO "anon";
GRANT ALL ON TABLE "public"."source_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."source_categories" TO "service_role";



GRANT ALL ON TABLE "public"."theme_categories" TO "anon";
GRANT ALL ON TABLE "public"."theme_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."theme_categories" TO "service_role";



GRANT ALL ON TABLE "public"."todos" TO "anon";
GRANT ALL ON TABLE "public"."todos" TO "authenticated";
GRANT ALL ON TABLE "public"."todos" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









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






























RESET ALL;
