#!/bin/bash
# =============================================================
#  cos% — Build Script
#  Recreates cos% x86_64 exactly as the original build
#  Run as root on a Debian/Ubuntu host
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
[[ $EUID -ne 0 ]] && die "Run as root!"

clear
echo -e "${CYAN}"
echo "  ██████╗ ██████╗ ███████╗    ██████╗ "
echo " ██╔════╝██╔═══██╗██╔════╝   ██╔═══██╗"
echo " ██║     ██║   ██║███████╗   ██║   ██║"
echo " ██║     ██║   ██║╚════██║   ██║▄▄ ██║"
echo " ╚██████╗╚██████╔╝███████║██╗╚██████╔╝"
echo "  ╚═════╝ ╚═════╝ ╚══════╝╚═╝ ╚══▀▀═╝"
echo -e "${NC}"
echo -e "  ${CYAN}cos% — Build Script${NC}"
echo ""

# ── Config ────────────────────────────────────────────────────
ROOTFS="/mnt/cos%"
ISO_DIR="$ROOTFS/iso"
OUTPUT_ISO="/root/cos-percent-1.0.iso"

# ── Step 1: Install host dependencies ────────────────────────
info "Installing host dependencies..."
apt install -y debootstrap squashfs-tools xorriso grub-pc-bin grub-efi-amd64-bin mtools dosfstools
success "Host dependencies ready."

# ── Step 2: Bootstrap ────────────────────────────────────────
info "Bootstrapping cos% base system..."
mkdir -p "$ROOTFS"
debootstrap --arch=amd64 --variant=minbase stable "$ROOTFS" http://deb.debian.org/debian
success "Bootstrap complete."

# ── Step 3: Mount virtuals ───────────────────────────────────
info "Mounting virtual filesystems..."
mount --bind /dev     "$ROOTFS/dev"
mount --bind /dev/pts "$ROOTFS/dev/pts"
mount --bind /proc    "$ROOTFS/proc"
mount --bind /sys     "$ROOTFS/sys"

cleanup() {
    umount -lf "$ROOTFS/dev/pts" 2>/dev/null || true
    umount -lf "$ROOTFS/dev"     2>/dev/null || true
    umount -lf "$ROOTFS/proc"    2>/dev/null || true
    umount -lf "$ROOTFS/sys"     2>/dev/null || true
}
trap cleanup EXIT

# ── Step 4: Chroot configuration ─────────────────────────────
info "Configuring cos% inside chroot..."
chroot "$ROOTFS" /bin/bash <<'CHROOT'

# DNS
echo "nameserver 1.1.1.1" > /etc/resolv.conf

# Hostname — exactly as original
echo "cosint" > /etc/hostname

# Hosts
cat > /etc/hosts <<EOF
127.0.0.1   localhost
127.0.1.1   cospercent
EOF

# APT sources — exactly as original
cat > /etc/apt/sources.list <<EOF
deb http://deb.debian.org/debian stable main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security stable-security main
deb http://deb.debian.org/debian stable-updates main
EOF

apt update -qq

# Install exactly the same packages as the original cos% build
apt install -y \
    linux-image-amd64 \
    systemd \
    systemd-sysv \
    systemd-timesyncd \
    systemd-cryptsetup \
    udev \
    initramfs-tools \
    apparmor \
    busybox \
    cpio \
    dbus \
    dbus-bin \
    dbus-daemon \
    dbus-session-bus-common \
    dbus-system-bus-common \
    dbus-user-session \
    dmsetup \
    dracut-install \
    kmod \
    klibc-utils \
    logsave \
    login \
    passwd \
    nano \
    tzdata \
    zstd

# os-release — exactly as original
cat > /etc/os-release <<EOF
PRETTY_NAME="Cos% GNU/Linux"
NAME="Cos% GNU/Linux"
VERSION_ID="1"
VERSION="1"
VERSION_CODENAME=cosint
ID=cospersent
EOF

# fstab placeholder — exactly as original
echo "# UNCONFIGURED FSTAB FOR BASE SYSTEM" > /etc/fstab

# Clean up
apt clean
rm -rf /var/lib/apt/lists/*
rm -f /etc/resolv.conf

CHROOT

success "Chroot configuration complete."

# ── Step 5: Unmount ───────────────────────────────────────────
cleanup
trap - EXIT
success "Virtual filesystems unmounted."

# ── Step 6: Build ISO structure ───────────────────────────────
info "Building ISO structure..."
mkdir -p "$ISO_DIR/live"
mkdir -p "$ISO_DIR/boot/grub"

# ── Step 7: Copy kernel & initrd ─────────────────────────────
info "Copying kernel and initrd..."
cp "$ROOTFS"/boot/vmlinuz-*  "$ISO_DIR/boot/vmlinuz"
cp "$ROOTFS"/boot/initrd.img-* "$ISO_DIR/boot/initrd.img"
success "Kernel and initrd copied."

# ── Step 8: Squash rootfs ─────────────────────────────────────
info "Compressing rootfs into squashfs..."
mksquashfs "$ROOTFS" "$ISO_DIR/live/filesystem.squashfs" \
    -comp xz \
    -noappend \
    -e "$ISO_DIR"
success "filesystem.squashfs created."

# ── Step 9: GRUB config ───────────────────────────────────────
info "Writing GRUB config..."
cat > "$ISO_DIR/boot/grub/grub.cfg" <<EOF
set timeout=5
set default=0

menuentry "cos% 1.0" {
    linux /boot/vmlinuz root=/dev/sda1 rw quiet
    initrd /boot/initrd.img
}
EOF
success "GRUB config written."

# ── Step 10: Build ISO ────────────────────────────────────────
info "Building final ISO..."
grub-mkrescue -o "$OUTPUT_ISO" "$ISO_DIR" -- -volid COSPERCENT
success "ISO built!"

# ── Done ─────────────────────────────────────────────────────
ISO_SIZE=$(du -sh "$OUTPUT_ISO" | cut -f1)
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  cos% ISO ready!${NC}"
echo -e "${GREEN}  File : $OUTPUT_ISO${NC}"
echo -e "${GREEN}  Size : $ISO_SIZE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  Test:  ${CYAN}qemu-system-x86_64 -m 512 -cdrom $OUTPUT_ISO${NC}"
echo -e "  Flash: ${CYAN}dd if=$OUTPUT_ISO of=/dev/sdX bs=4M status=progress${NC}"
echo ""
