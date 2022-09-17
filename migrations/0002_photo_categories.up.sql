CREATE TABLE "photo_categories" (
    "id"              SERIAL PRIMARY KEY,
    "stub"            TEXT NOT NULL UNIQUE,
    "name"            TEXT NOT NULL,
    "description"     TEXT,
    "active"          BOOLEAN NOT NULL DEFAULT true,
    "deleted"         BOOLEAN NOT NULL DEFAULT false,
    "created"         TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX "photo_categories_stub_idx" ON "photo_categories" ("stub","deleted", "active");

