#!/bin/sh
# Post-remove script for gui-for-singbox

set -eu

GROUP_NAME="gui-for-singbox"

if getent group "$GROUP_NAME" >/dev/null 2>&1; then
  echo "Note: System group '$GROUP_NAME' was not automatically removed."
fi

exit 0
