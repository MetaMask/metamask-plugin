#!/usr/bin/env bash

set -e
set -u
set -o pipefail

# Skip running e2e tests if the HEAD commit is tagged correctly
if git show --format='%B' --no-patch "$CIRCLE_SHA1" | grep --fixed-strings --quiet '[skip e2e]'
then
    printf '%s\n' "$CIRCLE_SHA1 contains the tag '[skip e2e]' so e2e tests will not run"
    exit 1
fi

exit 0
