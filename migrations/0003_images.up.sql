CREATE TABLE "images" (
    "id"              SERIAL PRIMARY KEY,
    "stub"            TEXT NOT NULL UNIQUE,
    "name"            TEXT NOT NULL,
    "description"     TEXT,
    "active"          BOOLEAN NOT NULL DEFAULT true,
    "deleted"         BOOLEAN NOT NULL DEFAULT false,
    "edited"          BOOLEAN NOT NULL DEFAULT false,
    "created"         TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX "images_stub_idx" ON "images" ("stub","deleted", "active");
CREATE INDEX "images_edited_idx" ON "images" ("edited");

CREATE TABLE "images_category_lookup" (
    "id"                SERIAL PRIMARY KEY,
    "image_id"          INTEGER NOT NULL REFERENCES "images" ("id"),
    "photo_category_id" INTEGER NOT NULL REFERENCES "photo_categories" ("id"),
    "created"           TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX "images_category_lookup_images_idx" ON "images_category_lookup" ("image_id");
CREATE INDEX "images_category_lookup_categories_idx" ON "images_category_lookup" ("photo_category_id");
CREATE INDEX "images_category_lookup_images_categories_idx" ON "images_category_lookup" ("image_id","photo_category_id");