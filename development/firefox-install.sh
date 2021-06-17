#!/usr/bin/env bash

set -e
set -u
set -o pipefail

FIREFOX_VERSION='83.0'
FIREFOX_BINARY="firefox-${FIREFOX_VERSION}.tar.bz2"
FIREFOX_BINARY_URL="https://ftp.mozilla.org/pub/firefox/releases/${FIREFOX_VERSION}/linux-x86_64/en-US/${FIREFOX_BINARY}"
FIREFOX_PATH='/opt/firefox'

printf '%s\n' "Removing old Firefox installation"

sudo rm -rf "${FIREFOX_PATH}"

printf '%s\n' "Downloading & installing Firefox ${FIREFOX_VERSION}"

wget --quiet --show-progress -O- "${FIREFOX_BINARY_URL}" | sudo tar xj -C /opt

printf '%s\n' "Firefox ${FIREFOX_VERSION} installed"

{
  printf '%s\n' 'pref("general.config.filename", "firefox.cfg");'
  printf '%s\n' 'pref("general.config.obscure_value", 0);'
} | sudo tee "${FIREFOX_PATH}/defaults/pref/autoconfig.js"

sudo cp ./development/firefox.cfg "${FIREFOX_PATH}"

printf '%s\n' "Firefox ${FIREFOX_VERSION} configured"

# Set '/tmp/.X11-unix' to root to silence warning when running xvfb-run
sudo chown root:root /tmp/.X11-unix
