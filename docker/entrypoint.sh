#!/usr/bin/env bash
set -e

# Start Xvfb
Xvfb -ac -screen scrn ${SCREEN_X}x${SCREEN_Y}x24 :9.0 &
export DISPLAY=:9.0

exec "$@"
