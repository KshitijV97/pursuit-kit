# The doc service: Hono on Node 26 with Tectonic and PDF/DOCX extraction (ADR 0007, KTD1).
# Build from the repository root: docker build -f services/doc/Dockerfile .

FROM node:26-slim AS doc

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production

# Tectonic needs fonts and a font cache; extraction needs poppler. curl fetches the TeX binary.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    fontconfig \
    fonts-dejavu-core \
    poppler-utils \
  && rm -rf /var/lib/apt/lists/*

# Node 26 no longer bundles corepack, so install it before enabling pnpm.
RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@10.34.9 --activate

# Tectonic is a single static binary, pinned so builds are repeatable. Dependabot can't bump an
# ARG, so docs/runbooks/update-tectonic.md says how to move to a new release. The download URL is
# not a GitHub API call, so the API's rate limit for anonymous callers never applies.
ARG TECTONIC_VERSION=0.17.0
RUN set -eux; \
  url="https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-musl.tar.gz"; \
  curl -fsSL "$url" | tar xz -C /usr/local/bin tectonic; \
  tectonic --version

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/doc/package.json services/doc/package.json
# --ignore-scripts skips the root prepare hook, which installs git hooks and needs git.
RUN pnpm install --frozen-lockfile --filter @pursuit-kit/doc... --ignore-scripts

COPY services/doc services/doc
WORKDIR /app/services/doc

# Render wipes the filesystem when the free service sleeps, so build the TeX bundle in now (KTD5).
RUN mkdir -p /tmp/tectonic-warm \
  && tectonic templates/placeholder.tex --outdir /tmp/tectonic-warm \
  && rm -rf /tmp/tectonic-warm

EXPOSE 8080

CMD ["node", "src/server.ts"]
