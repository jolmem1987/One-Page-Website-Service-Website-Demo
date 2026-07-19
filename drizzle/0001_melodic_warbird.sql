CREATE TABLE IF NOT EXISTS "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data" text NOT NULL,
	"content_type" text NOT NULL,
	"filename" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
