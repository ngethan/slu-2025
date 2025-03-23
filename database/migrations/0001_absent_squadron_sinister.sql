ALTER TABLE "conversations" ALTER COLUMN "chatName" SET DEFAULT 'New Chat';--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "createdAt" timestamp (3) DEFAULT now();--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "preview" text;--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "participantIds";