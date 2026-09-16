#!/usr/bin/env bash
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
deploy_dir="$(cd -- "$script_dir" && pwd)"
cd "$deploy_dir"

: "${CLINI_ENV:?CLINI_ENV é obrigatório}"
: "${BACKEND_IMAGE:?BACKEND_IMAGE é obrigatório}"
: "${FRONTEND_IMAGE:?FRONTEND_IMAGE é obrigatório}"
: "${RELEASE_TAG:?RELEASE_TAG é obrigatório}"

export CLINI_ENV BACKEND_IMAGE FRONTEND_IMAGE
docker compose -f docker-compose.yml config --quiet
previous_frontend_image="$(docker inspect "$(docker compose -f docker-compose.yml ps -q frontend 2>/dev/null)" --format '{{.Config.Image}}' 2>/dev/null || true)"

docker compose -f docker-compose.yml pull frontend
if ! docker compose -f docker-compose.yml up -d --no-deps --wait frontend; then
  echo "Nova versão do frontend não ficou saudável; restaurando a imagem anterior." >&2
  if [[ -n "$previous_frontend_image" ]]; then
    FRONTEND_IMAGE="$previous_frontend_image" docker compose -f docker-compose.yml up -d --no-deps --wait frontend || true
  fi
  exit 1
fi

docker compose -f docker-compose.yml ps
