#!/bin/bash
# =============================================================
#  cos% 1.0 — Raspberry Pi Flash Script
#  https://arkanz4idan.github.io/cospercent/raspberrypi/flash.sh
# =============================================================

set -e

# ── Colors ────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${CYAN}[cos%]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
die()     { echo -e "${RED}[✗] $1${NC}"; exit 1; }

# ── Root check ────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && die "Run as root: sudo bash flash.sh"

clear
echo -e "${CYAN}"
echo "  ██████╗ ██████╗ ███████╗    ██████╗ "
echo " ██╔════╝██╔═══██╗██╔════╝   ██╔═══██╗"
echo " ██║     ██║   ██║███████╗   ██║   ██║"
echo " ██║     ██║   ██║╚════██║   ██║▄▄ ██║"
echo " ╚██████╗╚██████╔╝███████║██╗╚██████╔╝"
echo "  ╚═════╝ ╚═════╝ ╚══════╝╚═╝ ╚══▀▀═╝"
echo -e "${NC}"
echo -e "  ${CYAN}cos% 1.0 — Raspberry Pi Flash Script${NC}"
echo ""
warn "This will ERASE the selected SD card or USB. Make sure you have backups!"
echo ""

# ── Step 1: Image source ──────────────────────────────────────
info "Where is the cos% Raspberry Pi image?"
echo "  1) Download from GitHub releases"
echo "  2) I already have the .img file"
echo ""
read -rp "Choose (1/2): " SOURCE

if [[ "$SOURCE" == "1" ]]; then
    info "Downloading cos-percent-arm-1.0.img..."
    apt install -y wget
    wget -O /tmp/cos-percent-arm-1.0.img \
        https://github.com/arkanz4idan/cospercent/releases/download/v1.0/cos-percent-arm-1.0.img
    IMG="/tmp/cos-percent-arm-1.0.img"
    success "Downloaded."
elif [[ "$SOURCE" == "2" ]]; then
    read -rp "Enter full path to .img file: " IMG
    [[ ! -f "$IMG" ]] && die "File $IMG not found!"
else
    die "Invalid choice."
fi

# ── Step 2: SD card selection ─────────────────────────────────
echo ""
info "Available disks:"
lsblk -d -o NAME,SIZE,MODEL | grep -v loop
echo ""
warn "Make sure your SD card is plugged in!"
read -rp "Enter SD card device (e.g. sdb, mmcblk0): " SDCARD
SDCARD="/dev/$SDCARD"

[[ ! -b "$SDCARD" ]] && die "Device $SDCARD not found!"

# Safety check — don't flash to system disk
ROOTDISK=$(lsblk -no PKNAME $(findmnt -n -o SOURCE /))
[[ "$SDCARD" == "/dev/$ROOTDISK" ]] && die "That's your system disk! Aborted."

warn "ALL DATA ON $SDCARD WILL BE ERASED!"
read -rp "Are you sure? (yes/no): " CONFIRM
[[ "$CONFIRM" != "yes" ]] && die "Aborted."

# ── Step 3: Flash ─────────────────────────────────────────────
info "Flashing cos% to $SDCARD..."
info "This may take several minutes..."
dd if="$IMG" of="$SDCARD" bs=4M status=progress conv=fsync
sync

success "Flash complete!"
echo ""
echo -e "  ${GREEN}cos% is ready on your SD card!${NC}"
echo ""
echo -e "  Insert it into your Raspberry Pi and power on."
echo ""
echo -e "  Default login:"
echo -e "  ${CYAN}root${NC} password: ${CYAN}cos${NC}"
echo -e "  Change it after first boot with: ${CYAN}passwd${NC}"
echo ""
