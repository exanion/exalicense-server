#!/bin/sh

# Check if a newer docker image is available.
# Pull and restart if so.
# Expects running service, will start it if not!
# Service will restart!

docker-compose pull
docker-compose up --force-recreate --build -d
docker image prune -f