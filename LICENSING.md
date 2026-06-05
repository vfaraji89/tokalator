# Licensing

Tokalator is **dual-licensed**.

## 1. Open source (default)

All source in this repository is licensed under the **GNU Affero General
Public License v3.0 or later** (AGPL-3.0-or-later). See [LICENSE](./LICENSE).

AGPL is chosen on purpose: anyone may use, study, modify, and self-host
Tokalator, but if they modify it and offer it to others over a network
(a hosted/SaaS product), they must release their modified source under the
same license. This keeps the free version genuinely open while preventing a
competitor from taking the code closed into a hosted product.

## 2. Commercial license (Pro / Enterprise)

The AGPL's network-copyleft obligation does not fit every commercial use.
Organizations that want to embed Tokalator in a closed-source or proprietary
product, or avoid the AGPL source-disclosure requirement, may obtain a
separate commercial license.

Contact: vfaraji89@gmail.com

As the sole copyright holder, Tokalator can offer the same code under both
the AGPL and a commercial license. Contributors are asked to agree to the
contribution terms below so this remains possible.

## What is "free" vs "Pro"

The free version is everything in this repository: the token/context
calculator, the catalog, the VS Code extension, and the MCP server.

Pro/Enterprise features (Secure Workspace, SKILL.md generation, AI Settings,
and future additions) are **not protected by keeping code secret** — code
shipped to a browser or to a VS Code install is always extractable. They are
protected by running their defensible logic **server-side on tokalator.ai
behind authentication**, and by the commercial license above. The open client
may call those gated endpoints with a valid license key; it does not contain
the server logic.

## Contributions

By submitting a contribution (pull request, patch, etc.) you agree that:

1. You have the right to submit it, and
2. You license it to the project under both the AGPL-3.0-or-later and any
   commercial license the project offers, so the dual-license model is
   preserved.

## Trademarks

The "Tokalator" name and logo are not licensed under the AGPL. Forks must use
a different name and branding.
