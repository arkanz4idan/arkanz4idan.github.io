#!/bin/bash
# =============================================================
#  cos% — ARM64 Build Script
#  Recreates cos% ARM64 exactly as the original build
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
echo -e "  ${CYAN}cos% — ARM64 Build Script${NC}"
echo ""

# ── Config ────────────────────────────────────────────────────
ROOTFS="/mnt/cos%arm"
ISO_DIR="/mnt/cos%arm-iso"
OUTPUT_ISO="/root/cos-percent-arm-1.0.iso"
OUTPUT_IMG="/root/cos-percent-arm-1.0.img"

# ── Step 1: Install host dependencies ────────────────────────
info "Installing host dependencies..."
apt install -y \
    debootstrap \
    squashfs-tools \
    xorriso \
    grub-pc-bin \
    grub-efi-arm64-bin \
    mtools \
    dosfstools \
    qemu-user-static \
    binfmt-support \
    rsync
success "Host dependencies ready."

# ── Step 2: Bootstrap ARM64 ──────────────────────────────────
info "Bootstrapping cos% ARM64 base system..."
mkdir -p "$ROOTFS"
debootstrap --arch=arm64 --variant=minbase --foreign stable "$ROOTFS" http://deb.debian.org/debian
success "First stage bootstrap complete."

# ── Step 3: Copy QEMU binary ─────────────────────────────────
info "Copying QEMU ARM64 binary..."
cp /usr/bin/qemu-aarch64-static "$ROOTFS/usr/bin/"
success "QEMU binary copied."

# ── Step 4: Complete bootstrap ───────────────────────────────
info "Completing ARM64 bootstrap (second stage)..."
chroot "$ROOTFS" /usr/bin/qemu-aarch64-static /bin/bash /debootstrap/debootstrap --second-stage
success "Second stage bootstrap complete."

# ── Step 5: Mount virtuals ───────────────────────────────────
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

# ── Step 6: Chroot configuration ─────────────────────────────
info "Configuring cos% ARM64 inside chroot..."
chroot "$ROOTFS" /usr/bin/qemu-aarch64-static /bin/bash <<'CHROOT'

# DNS
echo "nameserver 1.1.1.1" > /etc/resolv.conf

# Hostname — exactly as original
echo "cosint" > /etc/hostname

# Hosts
cat > /etc/hosts <<EOF
127.0.0.1   localhost
127.0.1.1   cospercent
EOF

# APT sources
cat > /etc/apt/sources.list <<EOF
deb http://deb.debian.org/debian stable main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security stable-security main
deb http://deb.debian.org/debian stable-updates main
EOF

apt update -qq

# Install same packages as original cos% ARM build
apt install -y \
    linux-image-arm64 \
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
    zstd \
    gnupg

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

# ── Step 7: Unmount ───────────────────────────────────────────
cleanup
trap - EXIT
success "Virtual filesystems unmounted."

# ── Step 8: Build ARM ISO ─────────────────────────────────────
info "Building ARM64 ISO structure..."
mkdir -p "$ISO_DIR/live"
mkdir -p "$ISO_DIR/boot/grub"

info "Copying kernel and initrd..."
cp "$ROOTFS"/boot/vmlinuz-*   "$ISO_DIR/boot/vmlinuz"
cp "$ROOTFS"/boot/initrd.img-* "$ISO_DIR/boot/initrd.img"

info "Compressing rootfs into squashfs..."
mksquashfs "$ROOTFS" "$ISO_DIR/live/filesystem.squashfs" \
    -comp xz \
    -noappend \
    -e "$ISO_DIR"

info "Writing GRUB config..."
cat > "$ISO_DIR/boot/grub/grub.cfg" <<EOF
set timeout=5
set default=0

menuentry "cos% 1.0 ARM64" {
    linux /boot/vmlinuz root=/dev/sda1 rw quiet
    initrd /boot/initrd.img
}
EOF

info "Building ARM64 ISO..."
grub-mkrescue -o "$OUTPUT_ISO" "$ISO_DIR" -- -volid COSPERCENT_ARM
success "ARM64 ISO built!"

# ── Step 9: Build Raspberry Pi image ─────────────────────────
info "Building Raspberry Pi image..."
dd if=/dev/zero of="$OUTPUT_IMG" bs=1M count=2048

fdisk "$OUTPUT_IMG" <<EOF
o
n
p
1

+256M
t
b
n
p
2


w
EOF

LOOP=$(losetup -fP --show "$OUTPUT_IMG")

mkfs.vfat -F 32 "${LOOP}p1"
mkfs.ext4 "${LOOP}p2"

mkdir -p /mnt/cosboot /mnt/cosroot
mount "${LOOP}p1" /mnt/cosboot
mount "${LOOP}p2" /mnt/cosroot

rsync -a "$ROOTFS/" /mnt/cosroot/

cp "$ROOTFS"/boot/vmlinuz-*   /mnt/cosboot/kernel8.img
cp "$ROOTFS"/boot/initrd.img-* /mnt/cosboot/initrd.img

cat > /mnt/cosboot/config.txt <<EOF
arm_64bit=1
kernel=kernel8.img
initramfs initrd.img followkernel
EOF

cat > /mnt/cosboot/cmdline.txt <<EOF
root=/dev/mmcblk0p2 rootfstype=ext4 rw rootwait console=ttyAMA0,115200 console=tty1
EOF

umount /mnt/cosboot
umount /mnt/cosroot
losetup -d "$LOOP"

success "Raspberry Pi image built!"

# ── Done ─────────────────────────────────────────────────────
ISO_SIZE=$(du -sh "$OUTPUT_ISO" | cut -f1)
IMG_SIZE=$(du -sh "$OUTPUT_IMG" | cut -f1)
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  cos% ARM64 builds ready!${NC}"
echo -e "${GREEN}  ARM ISO : $OUTPUT_ISO ($ISO_SIZE)${NC}"
echo -e "${GREEN}  Pi Image: $OUTPUT_IMG ($IMG_SIZE)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  Flash Pi: ${CYAN}dd if=$OUTPUT_IMG of=/dev/sdX bs=4M status=progress${NC}"
echo ""
