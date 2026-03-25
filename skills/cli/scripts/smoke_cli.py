#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys


def run(label: str, args: list[str], allow_failure: bool = False) -> None:
    print(f"== {label} ==")
    result = subprocess.run(args, text=True, capture_output=True)

    if result.stdout:
        print(result.stdout.strip())
    if result.stderr:
        print(result.stderr.strip(), file=sys.stderr)

    if result.returncode != 0 and not allow_failure:
        raise SystemExit(result.returncode)


def main() -> None:
    run("headlessx binary", ["headlessx", "--help"])
    print("ok: headlessx --help")

    run("init help", ["headlessx", "init", "--help"])
    print("ok: headlessx init --help")

    run("login help", ["headlessx", "login", "--help"])
    print("ok: headlessx login --help")

    run("config help", ["headlessx", "config", "--help"])
    print("ok: headlessx config --help")

    run("doctor help", ["headlessx", "doctor", "--help"])
    print("ok: headlessx doctor --help")

    run("logs help", ["headlessx", "logs", "--help"])
    print("ok: headlessx logs --help")

    run("status", ["headlessx", "status"], allow_failure=True)
    run("operators", ["headlessx", "operators", "list"], allow_failure=True)

    print("smoke check completed")


if __name__ == "__main__":
    main()
