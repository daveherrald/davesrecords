#!/bin/bash

# PostToolUse hook: Auto-format files after Edit/Write
# Receives JSON on stdin with tool_input.file_path

file_path=$(jq -r '.tool_input.file_path // empty')

# Exit if no file path
[ -z "$file_path" ] && exit 0

# Only format TypeScript/JavaScript files
if [[ "$file_path" =~ \.(ts|tsx|js|jsx)$ ]]; then
  # Use ESLint --fix for formatting
  npx eslint --fix "$file_path" 2>/dev/null || true
fi

exit 0
