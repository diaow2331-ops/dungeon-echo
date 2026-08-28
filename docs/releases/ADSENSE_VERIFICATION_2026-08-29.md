# AdSense site verification — 2026-08-29

This change connects the public `91hwl.cn` site surface to Google AdSense for site ownership/review using publisher client `ca-pub-2648680835467283`.

Scope is intentionally limited:

- inject the AdSense loader into the built `91hwl.cn` homepage and the two `91hwl.cn/toys/*` project pages;
- do not add AdSense code to the playable `play.91hwl.cn` game runtime;
- keep ad placement/Auto Ads disabled until the AdSense site review is complete and a separate placement decision is made;
- make GitHub Actions validate the 91hwl home-mount contract and build the immutable site ZIP after merges to `main`.

Production remains artifact-only: build outside production, upload the immutable ZIP, then activate with the packaged deployer.
