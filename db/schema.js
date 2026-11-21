import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const clips = sqliteTable("clips", {
  slug: text("slug").primaryKey(),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  image: text("image").notNull(),
  genre: text("genre").notNull(),
  sub: text("sub").notNull()
});
