FROM node:22-alpine

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV SESSION_SECRET=docker-build-secret-only-change-runtime-secret
ENV DATABASE_URL=postgresql://marketplace:marketplace@postgres:5432/marketplace?schema=public
ENV APP_URL=http://localhost:3000

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build && chmod +x scripts/docker-start.sh

EXPOSE 3000

CMD ["sh", "scripts/docker-start.sh"]
