FROM node:20 AS build

WORKDIR /tmp/work

COPY . .
#COPY .git ./

RUN git status

# Run the script
RUN set -eu && \
  cd _indexer && \
  npm ci && \
  npm run indexer && \
  npm run timestamper

RUN mkdir -p /tmp/out


RUN ls -la
RUN ls -la sge/endwalker
RUN cp _index.json /tmp/out/
RUN if [ -f version_info.txt ]; then cp version_info.txt /tmp/out/; fi; true
RUN find . -mindepth 1 -maxdepth 1 -type d -name "???" -exec cp -r {} /tmp/out/ \;

FROM nginx
RUN rm -rf /usr/share/nginx/html
COPY --from=build /tmp/out /usr/share/nginx/html