#!/bin/bash
set -eu
vibbit_bundle_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
vibbit_node_bin=""
for vibbit_candidate in "$HOME"/.workbuddy/binaries/node/versions/*/bin/node; do
  if [ -x "$vibbit_candidate" ] && "$vibbit_candidate" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 20 ? 0 : 1)' 2>/dev/null; then
    vibbit_node_bin="$vibbit_candidate"
  fi
done
if [ -z "$vibbit_node_bin" ] && command -v node >/dev/null 2>&1; then
  vibbit_node_bin="$(command -v node)"
fi
if [ -z "$vibbit_node_bin" ]; then
  echo '需要 Node.js 20+。可先启动并初始化 WorkBuddy，使用其自带 Node。'
  exit 1
fi
vibbit_result=0
"$vibbit_node_bin" "$vibbit_bundle_dir/install-workbuddy.cjs" --restart "$@" || vibbit_result=$?
if [ -t 0 ]; then
  read -r -p '按回车关闭安装窗口。' vibbit_reply || true
fi
exit "$vibbit_result"
