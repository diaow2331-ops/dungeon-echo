91hwl home mount · site v1.12.0

Download-first homepage: compact MilkFrog branding, clipboard/code form, public release badge and bilingual FAQ. Original mascot and language/theme controls remain visible on phones. One game gallery follows downloads; play links open new tabs. Existing ZH/EN, themes and game routes are preserved. The browser verifies codes through /api/milkfrog/; it contains no stock, keys or static binary links. Installer/portable files are served by a separate private gateway after order/code validation. Software itself needs no activation.

The immutable presentation bundle contains only public UI/image assets. The internal delivery panel, SQLite ledger, signing key and installers are deployed separately and never copied into this public repository or webroot.

Build: bash ops/release/build-home-mount-bundle.sh
The gateway must be healthy before this presentation is activated.
