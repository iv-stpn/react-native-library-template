#!/usr/bin/env bash
#
# Ensure an Android device is ready for the vitest-mobile suite. Prepares only —
# it does NOT run tests. Chain it before the test command, e.g.
#
#   storybook/native/scripts/android-setup.sh && bun run test:native:android
#
# Idempotent + resumable. Each step is skipped when already satisfied, so this is
# safe to run repeatedly and after a machine/WSL restart:
#
#   1. Toolchain env  — ANDROID_HOME, JAVA_HOME (via jenv), PATH.
#   2. adb server     — pre-started detached (works around a WSL fork-hang where
#                       adb's auto-spawned server blocks the first client command).
#   3. Bootstrap      — build harness + create AVD, but ONLY if this project has
#                       never been bootstrapped (no entry in vitest-mobile's
#                       devices.json). Otherwise reused from ~/.cache/vitest-mobile.
#   4. Emulator boot  — booted here explicitly and waited on (sys.boot_completed),
#                       so the first test run doesn't race the ~1-2 min cold boot
#                       and hit vitest-mobile's 180s connect timeout. If an
#                       emulator for this project's AVD is already online, reused.
#
# Usage:   storybook/native/scripts/android-setup.sh
# Env:     HEADLESS=0   boot the emulator with a window (default 1 = headless)
#
set -euo pipefail

# ── 1. Toolchain env ────────────────────────────────────────────────────────
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
if command -v jenv >/dev/null 2>&1; then
  export PATH="$HOME/.jenv/bin:$PATH"
  export JAVA_HOME="$(jenv javahome 2>/dev/null || echo "${JAVA_HOME:-}")"
fi
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:${JAVA_HOME:+$JAVA_HOME/bin:}$PATH"

ADB="$ANDROID_HOME/platform-tools/adb"
EMULATOR="$ANDROID_HOME/emulator/emulator"
HEADLESS="${HEADLESS:-1}"

# App dir = the native workspace this script lives in (…/storybook/native).
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_DIR="${VITEST_MOBILE_CACHE_DIR:-$HOME/.cache/vitest-mobile}"

log() { printf '\033[36m[android-setup]\033[0m %s\n' "$*"; }
die() { printf '\033[31m[android-setup] ERROR:\033[0m %s\n' "$*" >&2; exit 1; }

[ -x "$ADB" ] || die "adb not found at $ADB — install the Android SDK first."
[ -x "$EMULATOR" ] || die "emulator not found at $EMULATOR — install the emulator package."

# ── 2. adb server (WSL-safe) ────────────────────────────────────────────────
# `adb devices` would normally auto-spawn the server, but on WSL that fork can
# hang indefinitely. Pre-start a detached nodaemon server and wait for the port.
if ! ss -ltn 2>/dev/null | grep -q '127.0.0.1:5037'; then
  log "Starting adb server (detached, WSL-safe)…"
  nohup "$ADB" -L tcp:5037 nodaemon server >"$CACHE_DIR/adb-server.log" 2>&1 &
  for _ in $(seq 1 20); do
    ss -ltn 2>/dev/null | grep -q '127.0.0.1:5037' && break
    sleep 0.5
  done
  ss -ltn 2>/dev/null | grep -q '127.0.0.1:5037' || die "adb server failed to start (see $CACHE_DIR/adb-server.log)"
fi
log "adb server up: $("$ADB" version | head -1)"

# ── 3. Bootstrap only if this project was never bootstrapped ─────────────────
# vitest-mobile records the project's AVD in devices.json once bootstrap succeeds.
DEVICES_JSON="$CACHE_DIR/devices.json"
avd_name=""
if [ -f "$DEVICES_JSON" ]; then
  avd_name="$(APP_DIR="$APP_DIR" DEVICES_JSON="$DEVICES_JSON" node -e '
    const fs=require("fs");
    const j=JSON.parse(fs.readFileSync(process.env.DEVICES_JSON,"utf8"));
    const e=j[process.env.APP_DIR];
    process.stdout.write(e?.android?.deviceName ?? "");
  ' 2>/dev/null || true)"
fi

if [ -z "$avd_name" ] || [ ! -d "$CACHE_DIR/avd/$avd_name.avd" ]; then
  log "Project not bootstrapped yet — running bootstrap (first-time, ~5-10 min)…"
  ( cd "$APP_DIR" && ./node_modules/.bin/vitest-mobile bootstrap --platform android --headless --verbose )
  # Re-read the AVD name bootstrap just registered.
  avd_name="$(APP_DIR="$APP_DIR" DEVICES_JSON="$DEVICES_JSON" node -e '
    const fs=require("fs");
    const j=JSON.parse(fs.readFileSync(process.env.DEVICES_JSON,"utf8"));
    process.stdout.write(j[process.env.APP_DIR]?.android?.deviceName ?? "");
  ' 2>/dev/null || true)"
  [ -n "$avd_name" ] || die "Bootstrap finished but no AVD was registered for this project."
  log "Bootstrap complete — AVD: $avd_name"
else
  log "Already bootstrapped — reusing AVD: $avd_name"
fi

# ── 4. Ensure an emulator for this AVD is booted ────────────────────────────
export ANDROID_AVD_HOME="$CACHE_DIR/avd"   # vitest-mobile keeps its AVDs here

running_serial=""
for serial in $("$ADB" devices | awk '/emulator-[0-9]+\tdevice/{print $1}'); do
  name="$("$ADB" -s "$serial" emu avd name 2>/dev/null | head -1 | tr -d '\r' || true)"
  if [ "$name" = "$avd_name" ]; then running_serial="$serial"; break; fi
done

if [ -n "$running_serial" ]; then
  log "Emulator already booted for $avd_name ($running_serial) — reusing."
else
  # Pick a free even console port (5554..5680).
  taken="$("$ADB" devices | grep -oE 'emulator-[0-9]+' | grep -oE '[0-9]+' || true)"
  port=5554
  while echo "$taken" | grep -qx "$port"; do port=$((port + 2)); done
  serial="emulator-$port"

  emu_args=(-avd "$avd_name" -no-audio -port "$port" -no-snapshot-save)
  [ "$HEADLESS" = "1" ] && emu_args+=(-no-window -gpu swiftshader_indirect -no-boot-anim)

  log "Booting emulator $avd_name on $serial (headless=$HEADLESS)…"
  nohup "$EMULATOR" "${emu_args[@]}" >"$CACHE_DIR/emulator-$port.log" 2>&1 &

  log "Waiting for boot (sys.boot_completed)…"
  "$ADB" -s "$serial" wait-for-device
  for _ in $(seq 1 120); do
    [ "$("$ADB" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] && break
    sleep 2
  done
  [ "$("$ADB" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] \
    || die "Emulator $serial did not finish booting (see $CACHE_DIR/emulator-$port.log)"
  running_serial="$serial"
  # Quiet the UI so taps land deterministically (mirrors vitest-mobile).
  "$ADB" -s "$serial" shell settings put global window_animation_scale 0 >/dev/null 2>&1 || true
  "$ADB" -s "$serial" shell settings put global transition_animation_scale 0 >/dev/null 2>&1 || true
  "$ADB" -s "$serial" shell settings put global animator_duration_scale 0 >/dev/null 2>&1 || true
  log "Emulator ready: $running_serial"
fi

log "Device ready ($running_serial). Run the suite with: bun run test:native:android"
