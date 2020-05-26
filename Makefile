
.DEFAULT_GOAL := help
.PHONY: setup start stop install lint test test_integration build

IMAGE_TAG ?= "local"
DOCKER_COMPOSE = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.yml
DOCKER_COMPOSE_TEST = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.test.yml
DOCKER_COMPOSE_BUILD = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.build.yml

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

setup: ## perform setup tasks
	-@ git submodule update --init --recursive
	-@ docker network create reviewer > /dev/null 2>&1 || true

start: ## start adaptor in development mode
	${DOCKER_COMPOSE} up

stop: ## stop all containers
	${DOCKER_COMPOSE_TEST} down
	${DOCKER_COMPOSE} down

install: ## install dependencies
	yarn

lint: install ## lint code
	yarn lint

test: install ## run unit tests
	yarn test

test_integration: ## run integration tests
	- ${DOCKER_COMPOSE_TEST} down
	${DOCKER_COMPOSE_TEST} up -d
	./.scripts/docker/wait-healthy.sh test_postgres 20
	./.scripts/docker/wait-healthy.sh test_reviewer_mocks 60
	./.scripts/docker/wait-healthy.sh test_continuum_adaptor 60
	CONFIG_PATH=./tests/config/continuum-adaptor.json yarn test:integration

build: ## build image for production
	${DOCKER_COMPOSE_BUILD} build continuum-adaptor
