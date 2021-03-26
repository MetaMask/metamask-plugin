#!/usr/bin/env bash

# Print commands and their arguments as they are executed.
set -x
# Exit immediately if a command exits with a non-zero status.
set -e

yarn install --frozen-lockfile --har

# Move HAR file into directory with consistent name so that we can cache it
mkdir -p build-artifacts/yarn-install-har
har_files=(./*.har)
if [[ -f "${har_files[0]}" ]]
then
  mv ./*.har build-artifacts/yarn-install-har/
fi