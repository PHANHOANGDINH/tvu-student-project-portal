#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root: sudo bash deploy/scripts/setup-server.sh" >&2
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This setup script supports Ubuntu/Debian servers with apt." >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl git ufw

. /etc/os-release
if [[ "$ID" != "ubuntu" && "$ID" != "debian" ]]; then
  echo "Unsupported distribution: $ID. Install Docker manually from official documentation." >&2
  exit 1
fi

install -m 0755 -d /etc/apt/keyrings
curl -fsSL "https://download.docker.com/linux/${ID}/gpg" \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

docker_arch="$(dpkg --print-architecture)"
echo "deb [arch=${docker_arch} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "Server base setup complete."
echo "Verify DNS, clone the repository, and configure .env.production before deployment."
