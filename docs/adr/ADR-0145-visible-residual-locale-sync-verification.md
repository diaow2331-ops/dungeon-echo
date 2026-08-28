# ADR-0145 verification matrix

Source-contract scope only; no browser PASS is claimed by this change.

Manual browser verification should cover:

1. English title screen renders fully English after load.
2. Opening class select translates only class select.
3. Pausing from active dungeon play translates pause after the state transition.
4. Death/win overlay remains English.
5. Bumping the dungeon merchant opens an English shop.
6. Return Scroll / death transition opens an English town without a page stall.
7. During ordinary dungeon movement/combat, no residual locale tree is visible and therefore no legacy tree scan is performed.
8. Chinese route remains unaffected because the legacy bridge is English-only in bootstrap.
