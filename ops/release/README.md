# Release entrypoint

Before changing any production build/deploy path, read:

[`../../.agents/skills/91hwl-static-release/SKILL.md`](../../.agents/skills/91hwl-static-release/SKILL.md)

The governing rule is **build elsewhere, deploy artifacts only**.

Production is not a build machine. A normal release must be delivered as a fully prepared ZIP, uploaded to `/tmp`, and activated with one command. Production deployment must not depend on GitHub, Node/npm builders, `patch`, ad-hoc text transforms, or package installation.

The uploaded artifact must carry final static bytes, version/revision metadata, `SHA256SUMS`, activation/healthcheck logic and rollback protection. Existing live owned files are backed up for recovery; historical live-file hashes are not release prerequisites.

If any script in this directory conflicts with the Skill, fix the script rather than bypassing the Skill.
