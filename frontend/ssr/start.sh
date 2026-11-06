#!/bin/sh
# Container entrypoint: runs the SSR renderer next to nginx.
# The renderer is restarted if it ever exits; while it is down nginx serves
# the static pages (see error_page 502 504 = @static in nginx.conf).
set -u

(
  while true; do
    node /srv/ssr/server.js
    echo "[start.sh] ssr renderer exited with status $?; restarting in 1s" >&2
    sleep 1
  done
) &

# Hand over to the stock nginx entrypoint (keeps its init scripts).
exec /docker-entrypoint.sh nginx -g 'daemon off;'
