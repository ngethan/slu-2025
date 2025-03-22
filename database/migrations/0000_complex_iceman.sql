CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lastDate" timestamp (3),
	"participantIds" uuid[] DEFAULT '{}' NOT NULL,
	"chatName" text DEFAULT '' NOT NULL,
	"ownerId" uuid,
	"lastMessage" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversationId" uuid,
	"senderId" uuid,
	"content" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"fullName" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "messages_conversationId_idx" ON "messages" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "name_idx" ON "users" USING btree ("fullName");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");