CREATE TABLE "photos" (
    "id"              SERIAL PRIMARY KEY,
    "stub"            TEXT NOT NULL UNIQUE,
    "name"            TEXT NOT NULL,
    "description"     TEXT,
    "category_id"     INT REFERENCES "photo_categories" ON DELETE SET NULL,
    "active"          BOOLEAN NOT NULL DEFAULT true,
    "deleted"         BOOLEAN NOT NULL DEFAULT false,
    "edited"          BOOLEAN NOT NULL DEFAULT false,
    "created"         TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX "photos_stub_idx" ON "photos" ("stub", "deleted", "active");
CREATE INDEX "photos_edited_idx" ON "photos" ("edited");
CREATE INDEX "photos_category_idx" ON "photos" ("category_id", "deleted", "active");
