"""Remove PR author usernames from GitHub-generated release notes."""

import re
import sys

sys.stdout.write(
    re.sub(r" by @[A-Za-z0-9-]+(?:\[bot\])?", "", sys.stdin.read())
)
