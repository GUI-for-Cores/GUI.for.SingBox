#!/bin/sh
# Post-install script for gui-for-singbox

set -eu

GROUP_NAME="gui-for-singbox"

if ! getent group "$GROUP_NAME" >/dev/null 2>&1; then
  if groupadd -r "$GROUP_NAME"; then
    echo "Note: Created system group '$GROUP_NAME'."
    echo "Note: To manage TUN interfaces and routing without Polkit password prompts, add your user to the '$GROUP_NAME' group."
  else
    echo "Warning: Failed to create group '$GROUP_NAME'." >&2
  fi
fi

exit 0
