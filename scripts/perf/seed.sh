#!/usr/bin/env bash
# Seed the local Postgres (docker container "postgres") with bulk perf data.
#   CREATORS=5000 POINTS=100000 ./scripts/perf/seed.sh
set -euo pipefail

CREATORS="${CREATORS:-5000}"
POINTS="${POINTS:-100000}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Perf1234!}"
CONTAINER="${PG_CONTAINER:-postgres}"
DB="${DB_DATABASE:-postgres}"
USER="${DB_USERNAME:-postgres}"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# bcrypt is a project dep; package is ESM so force a CommonJS one-liner.
HASH="$(node --input-type=commonjs -e \
  "console.log(require('bcrypt').hashSync(process.argv[1], 10))" "$ADMIN_PASSWORD")"

echo "Seeding: $CREATORS creators, $POINTS points (admin@perf.test / $ADMIN_PASSWORD)"

docker exec -i -e PGPASSWORD="${DB_PASSWORD:-postgres}" "$CONTAINER" \
  psql -U "$USER" -d "$DB" -q \
  -v creators="$CREATORS" -v points="$POINTS" -v admin_hash="$HASH" \
  < "$DIR/seed.sql"

echo "Done."
