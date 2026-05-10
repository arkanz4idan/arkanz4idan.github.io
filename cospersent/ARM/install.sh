#!/bin/bash
# =============================================================
#  cos% 1.0 — ARM64 Installer
#  https://arkanz4idan.github.io/cospercent/ARM/install.sh
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
[[ $EUID -ne 0 ]] && die "Run as root: sudo bash install.sh"

# ── Arch check ────────────────────────────────────────────────
[[ "$(uname -m)" != "aarch64" ]] && die "This installer is for ARM64 only!"

clear
echo -e "${CYAN}"
echo "  ██████╗ ██████╗ ███████╗    ██████╗ "
echo " ██╔════╝██╔═══██╗██╔════╝   ██╔═══██╗"
echo " ██║     ██║   ██║███████╗   ██║   ██║"
echo " ██║     ██║   ██║╚════██║   ██║▄▄ ██║"
echo " ╚██████╗╚██████╔╝███████║██╗╚██████╔╝"
echo "  ╚═════╝ ╚═════╝ ╚══════╝╚═╝ ╚══▀▀═╝"
echo -e "${NC}"
echo -e "  ${CYAN}cos% 1.0 — ARM64 Installer${NC}"
echo ""
warn "This will ERASE the selected disk. Make sure you have backups!"
echo ""

# ── Step 1: Disk selection ────────────────────────────────────
info "Available disks:"
lsblk -d -o NAME,SIZE,MODEL | grep -v loop
echo ""
read -rp "Enter disk to install to (e.g. sda, mmcblk0): " DISK
DISK="/dev/$DISK"

[[ ! -b "$DISK" ]] && die "Disk $DISK not found!"

warn "ALL DATA ON $DISK WILL BE ERASED!"
read -rp "Are you sure? (yes/no): " CONFIRM
[[ "$CONFIRM" != "yes" ]] && die "Aborted."

# ── Step 2: Username & password ───────────────────────────────
echo ""
read -rp "Enter username: " USERNAME
read -rsp "Enter password for $USERNAME: " USERPASS; echo
read -rsp "Enter root password: " ROOTPASS; echo

# ── Step 3: Hostname ──────────────────────────────────────────
read -rp "Enter hostname (default: cospercent): " HOSTNAME
HOSTNAME=${HOSTNAME:-cospercent}

# ── Step 4: Partition ─────────────────────────────────────────
info "Partitioning $DISK..."
wipefs -af "$DISK"
parted -s "$DISK" mklabel gpt
parted -s "$DISK" mkpart ESP fat32 1MiB 513MiB
parted -s "$DISK" set 1 esp on
parted -s "$DISK" mkpart primary ext4 513MiB 100%

# Detect partition naming
if [[ "$DISK" == *"mmcblk"* ]] || [[ "$DISK" == *"nvme"* ]]; then
    PART1="${DISK}p1"
    PART2="${DISK}p2"
else
    PART1="${DISK}1"
    PART2="${DISK}2"
fi

# ── Step 5: Format ────────────────────────────────────────────
info "Formatting partitions..."
mkfs.vfat -F 32 "$PART1"
mkfs.ext4 -F "$PART2"
success "Partitions formatted."

# ── Step 6: Mount ─────────────────────────────────────────────
info "Mounting partitions..."
mount "$PART2" /mnt
mkdir -p /mnt/boot/efi
mount "$PART1" /mnt/boot/efi

# ── Step 7: Install base system ───────────────────────────────
info "Installing cos% base system..."
apt install -y debootstrap
debootstrap --arch=arm64 --variant=minbase stable /mnt http://deb.debian.org/debian
success "Base system installed."

# ── Step 8: Configure ─────────────────────────────────────────
info "Configuring cos%..."
mount --bind /dev     /mnt/dev
mount --bind /dev/pts /mnt/dev/pts
mount --bind /proc    /mnt/proc
mount --bind /sys     /mnt/sys

chroot /mnt /bin/bash <<CHROOT
echo "nameserver 1.1.1.1" > /etc/resolv.conf

echo "$HOSTNAME" > /etc/hostname
cat > /etc/hosts <<EOF
127.0.0.1   localhost
127.0.1.1   $HOSTNAME
EOF

cat > /etc/apt/sources.list <<EOF
deb http://deb.debian.org/debian stable main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security stable-security main
deb http://deb.debian.org/debian stable-updates main
EOF

apt update -qq
apt install -y linux-image-arm64 systemd systemd-sysv udev initramfs-tools grub-efi-arm64 bash coreutils util-linux mount login passwd adduser sudo

echo "root:$ROOTPASS" | chpasswd
useradd -m -s /bin/bash -G sudo $USERNAME
echo "$USERNAME:$USERPASS" | chpasswd

cat > /etc/os-release <<EOF
PRETTY_NAME="cos% 1.0 ARM"
NAME="cos%"
VERSION_ID="1.0"
ID=cospercent
ID_LIKE=debian
EOF

# Generate fstab
PART2_UUID=\$(blkid -s UUID -o value $PART2)
PART1_UUID=\$(blkid -s UUID -o value $PART1)
cat > /etc/fstab <<EOF
UUID=\$PART2_UUID /          ext4 errors=remount-ro 0 1
UUID=\$PART1_UUID /boot/efi  vfat umask=0077        0 1
EOF

# Install GRUB
grub-install --target=arm64-efi --efi-directory=/boot/efi --bootloader-id=cospercent
update-grub

apt clean
rm -rf /var/lib/apt/lists/*
rm /etc/resolv.conf
CHROOT

# ── Step 9: Unmount ───────────────────────────────────────────
umount /mnt/dev/pts
umount /mnt/dev
umount /mnt/proc
umount /mnt/sys
umount /mnt/boot/efi
umount /mnt

success "cos% ARM64 installed successfully!"
echo ""
echo -e "  ${GREEN}Remove the ISO and reboot:${NC}"
echo -e "  ${CYAN}reboot${NC}"
echo ""
