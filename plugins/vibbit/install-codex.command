#!/bin/bash
set -eu

package_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
node_bin="$(command -v node || true)"
if [ -z "$node_bin" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -x "$candidate" ]; then
      node_bin="$candidate"
      break
    fi
  done
fi
if [ -z "$node_bin" ]; then
  echo "需要 Node.js 18 或更新版本。请安装后重新运行。"
  read -r -p "按回车关闭。" _
  exit 1
fi
result=0
"$node_bin" "$package_dir/install-codex.cjs" --restart "$@" || result=$?
if [ -t 0 ]; then
  read -r -p "按回车关闭。" _
fi
exit "$result"
