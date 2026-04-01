#!/bin/sh
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__env = {
  SOCKET_URL: "${SOCKET_URL}"
};
EOF
exec nginx -g "daemon off;"
