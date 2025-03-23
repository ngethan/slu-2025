import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  index,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  createdAt: timestamp("createdAt", {
    precision: 3,
    mode: "date",
  }).defaultNow(),
  lastDate: timestamp("lastDate", { precision: 3, mode: "date" }),
  chatName: text("chatName").default("New Chat").notNull(),
  userId: uuid("ownerId"),
  lastMessage: text("lastMessage"),
  preview: text("preview"),
});

export const conversationRelations = relations(conversations, ({ many }) => ({
    messages: many(messages, {
        relationName: "conversationMessages",
    }),
}));

export const messages = pgTable(
    "messages",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        conversationId: uuid("conversationId"),
        senderId: uuid("senderId"),
        content: text().notNull(),
        createdAt: timestamp("createdAt", {
            precision: 3,
            mode: "date",
        }).defaultNow(),
    },
    (table) => {
        return {
            conversationIdIdx: index("messages_conversationId_idx").on(table.conversationId),
        };
    }
);

export const users = pgTable(
    "users",
    {
        id: uuid().defaultRandom().primaryKey().notNull(),
        email: text().notNull(),
        fullName: text("fullName"),
        createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
    },
    (table) => {
        return {
            nameIdx: index("name_idx").on(table.fullName),
            emailKey: uniqueIndex("users_email_key").on(table.email),
        };
    }
);

export const userRelations = relations(users, ({ many, one }) => ({
    userMessages: many(messages, {
        relationName: "userMessages",
    }),
}));
