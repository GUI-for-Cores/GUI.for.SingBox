#!/usr/bin/env bash
set -euo pipefail

# === env & metadata ===
ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

# Application metadata
APP_NAME="${APP_NAME:-"GUI.for.SingBox"}"

# Paths
BIN_DIR="build/bin"
PKGS_DIR="dist"

GOBIN="$(go env GOPATH)/bin"
NFPM_BIN="${GOBIN}/nfpm"

# Package descriptions
DESC="A GUI client for sing-box"

DEB_SUGGESTS="

Suggested Dependencies:
  * libkf6config-bin: Configure KDE system proxy
  * libglib2.0-bin: Configure GNOME system proxy
  * network-manager: Automatically configure system DNS"

RPM_SUGGESTS="

Suggested Dependencies:
  * kf6-kconfig: Configure KDE system proxy
  * glib2: Configure GNOME system proxy
  * NetworkManager: Automatically configure system DNS"

DESC_DEB="${DESC}${DEB_SUGGESTS}"
DESC_RPM="${DESC}${RPM_SUGGESTS}"

# Environment variables resolution
ARCH="${ARCH:-$(go env GOARCH)}"
APP_VERSION="${APP_VERSION:-$(git describe --tags --always 2>/dev/null || echo "v0.0.0-dev")}"

GIT_USER="$(git config user.name 2>/dev/null || true)"
GIT_EMAIL="$(git config user.email 2>/dev/null || true)"
if [[ -n "$GIT_USER" ]]; then
  DEFAULT_PACKAGER="${GIT_USER} <${GIT_EMAIL}>"
else
  DEFAULT_PACKAGER="Unknown Packager <user@example.com>"
fi
PACKAGER="${PACKAGER:-$DEFAULT_PACKAGER}"

# Version string conversions
ARCHIVE_VERSION="${APP_VERSION#v}"
PKG_VERSION="${ARCHIVE_VERSION//-/\~}"
ARCH_PKG_VERSION="${ARCHIVE_VERSION//-/}"

# Target architectures
DEB_ARCH="$ARCH"
case "$ARCH" in
amd64) SYS_ARCH="x86_64" ;;
arm64) SYS_ARCH="aarch64" ;;
*) SYS_ARCH="$ARCH" ;;
esac

# === packaging (nFPM) ===
check_binary() {
  if [[ ! -f "${BIN_DIR}/${APP_NAME}" ]]; then
    echo "==> Error: Linux binary '${BIN_DIR}/${APP_NAME}' not found. Build it before packaging." >&2
    exit 1
  fi
  if [[ ! -x "$NFPM_BIN" ]]; then
    echo "==> Error: nfpm not found at '${NFPM_BIN}'." >&2
    echo "    Install it with: go install github.com/goreleaser/nfpm/v2/cmd/nfpm@latest" >&2
    exit 1
  fi
}

package_deb() {
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging Debian (.deb) for ${DEB_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_DEB" ARCH="$DEB_ARCH" VERSION="$PKG_VERSION" \
    "$NFPM_BIN" package -f nfpm.yaml -p deb -t "${PKGS_DIR}/${APP_NAME}-${ARCHIVE_VERSION}-linux-${DEB_ARCH}.deb"
}

package_rpm() {
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging RPM (.rpm) for ${SYS_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC_RPM" ARCH="$SYS_ARCH" VERSION="$PKG_VERSION" \
    "$NFPM_BIN" package -f nfpm.yaml -p rpm -t "${PKGS_DIR}/${APP_NAME}-${ARCHIVE_VERSION}-linux-${SYS_ARCH}.rpm"
}

package_pacman() {
  check_binary
  mkdir -p "$PKGS_DIR"
  echo "==> Packaging Pacman (.pkg.tar.zst) for ${SYS_ARCH}..."
  PACKAGER="$PACKAGER" DESCRIPTION="$DESC" ARCH="$SYS_ARCH" VERSION="$ARCH_PKG_VERSION" \
    "$NFPM_BIN" package -f nfpm.yaml -p archlinux -t "${PKGS_DIR}/${APP_NAME}-${ARCHIVE_VERSION}-linux-${SYS_ARCH}.pkg.tar.zst"
}

# === help/main ===
show_help() {
  cat <<EOF
Usage: bash $(basename "$0") [format...]

Formats:
  deb     - Package Debian package (.deb)
  rpm     - Package RPM package (.rpm)
  pacman  - Package Arch package (.pkg.tar.zst)

With no arguments, all three formats are packaged.

Environment variable overrides:
  ARCH        - Override architecture (default: $(go env GOARCH))
  APP_VERSION - Override version tag (default: git describe or v0.0.0-dev)
  PACKAGER    - Override package maintainer info

Examples:
  bash $(basename "$0") deb
  bash $(basename "$0") deb rpm pacman
EOF
}

main() {
  if [[ $# -eq 0 ]]; then
    set -- "deb" "rpm" "pacman"
  fi

  for target in "$@"; do
    case "${target//_/-}" in
    deb) package_deb ;;
    rpm) package_rpm ;;
    pacman) package_pacman ;;
    -h | --help | help)
      show_help
      exit 0
      ;;
    *)
      echo "==> Error: Unknown format '${target}'" >&2
      echo "" >&2
      show_help >&2
      exit 1
      ;;
    esac
  done
}

main "$@"
