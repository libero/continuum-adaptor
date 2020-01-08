ARG image_tag=latest

FROM node:10-alpine as source
MAINTAINER eLife Reviewer Product Team <reviewer-product@elifesciences.org>

WORKDIR /app

COPY  tsconfig.build.json \
      tsconfig.json \
      .eslintrc.js \
      .eslintignore \
      package.json \
      yarn.lock \
      ./

COPY src/ ./src/
RUN yarn &&\
    yarn build

FROM node:10-alpine
MAINTAINER eLife Reviewer Product Team <reviewer-product@elifesciences.org>

WORKDIR /app

COPY --from=source /app/node_modules/ ./node_modules/
COPY --from=source /app/dist/ ./dist/

EXPOSE 3000

HEALTHCHECK --interval=1m --timeout=1s \
	CMD echo -e "GET /health\n\n" | nc localhost 3000

CMD ["node", "dist/main.js"]
