#!/usr/bin/env bash
# Atalho: scripts/sql.sh "select 1"  |  scripts/sql.sh -f arquivo.sql  (delega ao sql.mjs, que preserva UTF-8)
cd "$(dirname "$0")/.."
if [ "$1" = "-f" ]; then node scripts/sql.mjs "$2"; else node scripts/sql.mjs -e "$1"; fi
