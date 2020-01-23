
IMAGE_TAG ?= "local"

DOCKER_COMPOSE = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.build.yml

DOCKER_COMPOSE_TEST = IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.test.yml

PUSH_COMMAND = IMAGE_TAG=${IMAGE_TAG} .scripts/travis/push-image.sh

get_deps:
	yarn

lint: get_deps
	yarn lint

test: get_deps
	yarn test

test_integration:
	- ${DOCKER_COMPOSE_TEST} down
	${DOCKER_COMPOSE_TEST} up -d
	./.scripts/docker/wait-healthy.sh test_postgres 20
	./.scripts/docker/wait-healthy.sh test_rabbitmq 60
	./.scripts/docker/wait-healthy.sh test_reviewer_mocks 60
	./.scripts/docker/wait-healthy.sh test_continuum_adaptor 60
	${DOCKER_COMPOSE_TEST} exec continuum-adaptor node dist/migrate.js run
	CONFIG_PATH=./tests/config/continuum-adaptor.json yarn test:integration
	- ${DOCKER_COMPOSE_TEST} down
	
build:
	${DOCKER_COMPOSE} build continuum-adaptor 

push:
	${PUSH_COMMAND} continuum-adaptor
