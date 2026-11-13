.PHONY: up up-detached down build logs ps help import-mds-to-blob

COMPOSE := docker compose

.DEFAULT_GOAL := up

## Build images and start all services (foreground)
up:
	$(COMPOSE) up --build

## Build images and start all services in the background
up-detached:
	$(COMPOSE) up -d --build

## Stop and remove containers
down:
	$(COMPOSE) down

## Build images only
build:
	$(COMPOSE) build

## Follow logs from all services
logs:
	$(COMPOSE) logs -f

## Show running services
ps:
	$(COMPOSE) ps

## Upload vercel/mds/*.md to Vercel Blob (requires BLOB_READ_WRITE_TOKEN)
import-mds-to-blob:
	npm run import-mds-to-blob

## Show available targets
help:
	@grep -E '^##' Makefile | sed 's/^## //'
