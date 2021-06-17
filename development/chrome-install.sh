#!/usr/bin/env bash

set -e
set -u
set -o pipefail

CHROME_VERSION='91.0.4472.101-1'
CHROME_BINARY="google-chrome-stable_${CHROME_VERSION}_amd64.deb"
CHROME_BINARY_URL="http://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/${CHROME_BINARY}"

wget -qO "${CHROME_BINARY}" -t 5 "${CHROME_BINARY_URL}"

(sudo dpkg -i "${CHROME_BINARY}" || sudo apt-get -fy install)

rm -rf "${CHROME_BINARY}"

sudo sed -i 's|$HERE/chrome"|$HERE/chrome" --disable-setuid-sandbox --no-sandbox --disable-dev-shm-usage|g' "/opt/google/chrome/google-chrome"

printf '%s\n' "CHROME ${CHROME_VERSION} configured"

# Set '/tmp/.X11-unix' to root to silence warning when running xvfb-run
sudo chown root:root /tmp/.X11-unix
