SHELL := /bin/bash
PORT ?= 8787

.PHONY: install dev lint typecheck test sanity build check docs-check e2e budget knip audit \
	doc-service-test regression

install:
	pnpm install

dev:
	pnpm dev --port $(PORT)

lint:
	pnpm lint

typecheck:
	pnpm typecheck

test:
	pnpm test

# The pre-commit pack: smoke tests and the critical checks added by later units. Under 10 s (ADR 0008).
sanity:
	pnpm test:sanity

build:
	pnpm build

# The pre-push gate. Under 60 s (ADR 0008).
check: lint typecheck test build

docs-check:
	pnpm docs-check

knip:
	pnpm knip

e2e:
	pnpm e2e

audit:
	pnpm audit --audit-level=high

# Renders the pages from a local dev server, then checks the gzipped budgets (KTD14).
budget:
	@mkdir -p .budget
	@pnpm dev --port $(PORT) > .budget/dev.log 2>&1 & \
	pid=$$!; trap 'kill $$pid 2>/dev/null || true' EXIT; \
	ready=0; \
	for i in $$(seq 1 90); do \
	  if curl -sf "http://127.0.0.1:$(PORT)/health" > /dev/null; then ready=1; break; fi; \
	  sleep 1; \
	done; \
	if [ "$$ready" != "1" ]; then echo "dev server did not start; see .budget/dev.log"; exit 1; fi; \
	curl -sf "http://127.0.0.1:$(PORT)/" > .budget/home.html; \
	node scripts/check-budget.ts .budget

# Builds the image with real Tectonic and runs the doc-service tests inside it (KTD10).
doc-service-test:
	docker build -f services/doc/Dockerfile -t pursuit-kit-doc-test .
	docker run --rm -e DOC_SERVICE_SECRET=test -e EXPECT_TECTONIC=1 pursuit-kit-doc-test pnpm test

# Everything that runs after a merge to main (ADR 0008).
regression: doc-service-test e2e budget knip audit
