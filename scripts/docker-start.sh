#!/bin/sh
set -eu

pnpm exec prisma db push --skip-generate

if [ "${SEED_DATABASE:-true}" = "true" ]; then
  pnpm db:seed
fi

exec pnpm exec next start --hostname 0.0.0.0
