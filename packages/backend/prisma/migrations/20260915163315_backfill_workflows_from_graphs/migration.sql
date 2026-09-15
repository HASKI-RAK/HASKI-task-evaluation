-- Fold every pre-workspace Graph row into a single workspace as a Workflow
-- (SPEC-0004/FR-007, AC-005).
--
-- Run as SQL inside the migration rather than as a script, because the production
-- runtime image copies only dist/, prisma/ and prisma.config.ts -- a scripts/*.ts
-- backfill would not exist there, and the only migration hook is the Dockerfile CMD.

-- tokenHash stays NULL so this workspace can never be reached with an access token.
-- It is administratively visible only, and LTI first launch adopts content out of it.
INSERT INTO "Workspace" ("id", "type", "label", "tokenHash", "ltiKey", "createdAt", "lastActiveAt")
VALUES (
  'legacy0000000000000000000',
  'LTI',
  'Legacy pre-workspace content',
  NULL,
  NULL,
  now(),
  now()
)
ON CONFLICT ("id") DO NOTHING;

-- The slug is 'legacy-<id>' rather than a slugified path on purpose: slugifying
-- '/ws/editor/{activity}/1/1' is not injective ('a/b' and 'a-b' collapse together), and a
-- collision would abort the whole migration on a production deploy. The readable value
-- lives in "name" and the exact original in "legacyPath".
INSERT INTO "Workflow" (
  "id", "workspaceId", "slug", "name", "content",
  "version", "contentSchema", "legacyPath", "createdAt", "updatedAt"
)
SELECT
  'lg' || lpad(g."id"::text, 23, '0'),
  'legacy0000000000000000000',
  'legacy-' || g."id"::text,
  g."path",
  g."graph",
  1,
  1,
  g."path",
  now(),
  now()
FROM "Graph" g
ON CONFLICT ("legacyPath") DO NOTHING;
