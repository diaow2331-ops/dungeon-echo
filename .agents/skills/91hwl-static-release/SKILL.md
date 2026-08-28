---
name: 91hwl-static-release
description: Use when publishing or updating 91hwl.cn, Dungeon Echo, Clock Out Alive / Moyu, or any static browser-game/site release. Enforces prebuilt ZIP artifacts and offline production deployment.
---

# 91hwl Static Release Governance

## Prime directive

**Build elsewhere. Deploy artifacts only.**

The production server is an activation target, not a build machine. A release is not ready until the final static bytes have already been assembled and validated outside production.

For this project, the preferred handoff is:

`assistant/current workspace or CI builds final ZIP -> user uploads ZIP to /tmp -> one offline deployment command -> checksum -> stage/backup -> atomic switch -> healthcheck -> PASS`

## Hard rules

### Production MUST NOT

- run `git fetch`, `git pull`, `git checkout`, `git merge` or depend on GitHub availability;
- run Node/npm/build-time generators to create release content;
- apply `patch`, `sed`, Perl or ad-hoc text transforms to production content;
- assemble the release ZIP from source files on the server;
- install dependencies during deployment;
- use an old live-file hash as a prerequisite for accepting a newer immutable artifact;
- bypass checksum, healthcheck or rollback guards to force a release through.

A wrapper ZIP that performs `git fetch` or rebuilds the project on production is **not** a valid release artifact.

### Production MAY

- unpack the uploaded final ZIP into a temporary staging directory;
- verify `SHA256SUMS` and a release manifest;
- inspect versions and declared content markers;
- back up currently owned live paths or stage immutable release directories;
- atomically switch files/symlinks;
- run `nginx -t`, reload nginx and perform local/public health probes;
- automatically roll back to the previous known-good state when activation fails.

Network access during activation should only be needed for final public health probes. The release itself must not depend on GitHub or package registries.

## Required artifact contract

Every production ZIP must contain the **final bytes that will be served**, plus:

- `deploy.sh` — self-contained activation/rollback coordinator;
- `SHA256SUMS` — covers every deployable file and deployment script;
- `MANIFEST` or equivalent version files — source revision, component versions and cache generation(s);
- only the paths intentionally owned by this release.

The artifact must be immutable after validation. If its content changes, regenerate checksums and treat it as a new artifact.

For a multi-component launch, package Dungeon Echo, Moyu and the main site into one release artifact. The coordinator must know every component's previous state before switching anything.

## Build workflow

1. **Freeze source**
   - identify the exact source revision;
   - resolve semantic versions and cache generations once;
   - do not duplicate version/generation truth across unrelated scripts when a manifest can carry it.

2. **Build outside production**
   - generate final HTML/CSS/JS/assets;
   - apply build-time migrations/transforms here, never on the server;
   - ensure fixed Chinese/English routes, version endpoints and cache references are already final.

3. **Validate the final artifact, not only source**
   - run the smallest high-value tests that can falsify the release;
   - unpack the ZIP in a temporary directory;
   - run `sha256sum -c SHA256SUMS`;
   - verify required files, semantic versions, cache generation and critical route/content markers;
   - syntax-check deployment scripts;
   - ensure the artifact contains no dev-only files or stale runtime references.

4. **Deliver the ZIP to the user**
   - provide the ZIP directly in the current conversation/workspace whenever possible;
   - the normal user action is only to upload it to `/tmp`;
   - provide exactly one deployment command.

## Deployment workflow

The one server command may internally unpack the uploaded ZIP, but the user must not have to manually reconstruct or build anything.

Canonical shape:

```bash
rm -rf /tmp/<release-stage> && mkdir -p /tmp/<release-stage> && unzip -q /tmp/<release>.zip -d /tmp/<release-stage> && sudo bash /tmp/<release-stage>/deploy.sh
```

`deploy.sh` must:

1. verify root/required local commands;
2. verify artifact checksums before writes;
3. verify manifest/version/content contracts;
4. record the current state of every owned live path;
5. stage all new content before activation;
6. validate nginx configuration before/after the switch as appropriate;
7. atomically activate the new content;
8. run local-origin health checks;
9. run bounded public checks;
10. automatically roll back on any failure after activation;
11. print one unambiguous final marker such as `91hwl_public_release=PASS`.

## Live drift policy

The immutable artifact is the release authority. The current live homepage or game files are **not** a build baseline.

If a live owned file differs from the previous release:

- record/log its hash;
- back it up before replacement;
- continue with the validated artifact when ownership is clear.

Do not block a release merely because the live file hash differs from a historical hash. That pattern caused repeated false deployment failures after legitimate prior updates.

If ownership is unclear or the release would overwrite an undeclared path, fail before writes.

## Multi-component atomicity

For a coordinated Dungeon + Moyu + main-site release, avoid a state where two components are new and the third failed.

Preferred order:

1. verify all component artifacts first;
2. capture all previous activation targets/backups;
3. stage all components;
4. activate components in the chosen order;
5. if any later activation/healthcheck fails, restore every component already switched by this coordinator;
6. only print the global PASS marker after all public checks succeed.

If cross-component rollback cannot be guaranteed, publish components as explicit independent releases instead of calling the operation atomic.

## Ownership and rollback

Deployment may modify only declared owned paths. For 91hwl this commonly means the game mount(s), the two project detail pages and the homepage file—not unrelated API/backend/DNS/nginx configuration.

Rollback data must be created before the first destructive write and retained long enough for manual recovery.

Never use `rm -rf` outside an already validated release/staging/owned path.

## Recovery after a failure

1. Read the last printed `...=PASS` marker and the first concrete error.
2. Determine whether failure occurred before or after activation.
3. If activation occurred, trust/verify automatic rollback before retrying.
4. Fix the artifact or deployer outside production.
5. Produce a new final ZIP.
6. Upload and rerun the single deployment command.

Do **not** switch back to server-side Git/build/patch work merely because a release failed.

## Human acceptance

Automated health checks prove deployability, not game feel. After a successful release:

- verify the homepage visually on PC and mobile;
- verify Dungeon Chinese and fixed English routes without browser-induced retranslation;
- verify representative keyboard/touch/gamepad flows;
- verify Moyu PC/mobile presentation and its short run;
- then begin promotion.

Player feedback should drive later patches. Do not reopen broad art/architecture work during launch unless evidence requires it.

## Release decision shorthand

When an agent is unsure which path to use, apply this rule:

> **Can the server receive one already-final ZIP and activate it without GitHub, builders or text patching?**
>
> If no, the release is not packaged correctly yet.
