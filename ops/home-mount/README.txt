91hwl Browser Web Toys homepage mount

This package updates the existing 91hwl.cn homepage plus both project pages:

  /toys/dungeon-echo/
  /toys/moyu/

It does not deploy the playable games themselves. Game binaries are deployed by
the Dungeon Echo and Moyu play-tree bundles under /srv/91hwl-play.

Safety properties:

- verifies the live homepage against EXPECTED_INDEX_SHA256 before writing;
- backs up the homepage and both project-page directories;
- installs all three site pages before running health checks;
- validates origin and public routes for both games;
- rolls all three pages back together when a check fails.

SITE_VERSION is independent from either game's VERSION.

Current site release: 1.3.0
Current product versions shown by the site:
  Dungeon Echo 1.2.6
  Clock Out Alive / 摸鱼到下班 1.11.0

Build:
  ./ops/release/build-home-mount-bundle.sh /tmp/91hwl-home-web-toys-v1.3.0.zip

Deploy:
  unzip /tmp/91hwl-home-web-toys-v1.3.0.zip -d /tmp/91hwl-home-web-toys-v1.3.0
  sudo /tmp/91hwl-home-web-toys-v1.3.0/ops/deploy.sh

Success markers:
  web_toys_home_health=PASS
  web_toys_home_mount=PASS
