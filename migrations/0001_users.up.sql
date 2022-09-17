CREATE TABLE "users" (
    "id"              SERIAL PRIMARY KEY,
    "stub"            TEXT NOT NULL UNIQUE,
    "email"           TEXT NOT NULL UNIQUE,
    "username"        TEXT NOT NULL UNIQUE,
    "password_hash"   TEXT NOT NULL,
    "active"          BOOLEAN NOT NULL DEFAULT true,
    "deleted"         BOOLEAN NOT NULL DEFAULT false,
    "created"         TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX "users_email_idx"    ON "users" ("email","deleted");
CREATE INDEX "users_stub_idx"     ON "users" ("stub","deleted");
CREATE INDEX "users_username_idx" ON "users" ("username","deleted");
CREATE INDEX "users_login_idx"    ON "users" ("email","password_hash","active","deleted");
