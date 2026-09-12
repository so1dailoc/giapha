# V15 — Card Designer + Layout Engine hardening

- Member name is centered in both axes by default on horizontal and vertical cards.
- Removed forced per-word vertical name splitting; long names now scale down to preserve whole words.
- Name background is opt-in per card orientation.
- Toolbar is fixed to the bottom of the card with equal primary button geometry.
- Collapse/expand control is positioned below the card with an Admin-configurable offset and size.
- ReactFlow canvas background, dot/grid color, and gap are independent from website theme.
- AdminCP gains controls for name background visibility and ReactFlow canvas palette.
- Layout vertical spacing reserves the actual collapse-control footprint to reduce overlaps.
- Mobile card controls use stable touch targets.

## V16 – Layout Engine V2 / Mobile Sheet / Canvas Theme
- Fix vertical card member names rendering as a single glued string by enforcing a real column layout.
- Center collapse/expand control against the actual card width and expose offset + size settings in AdminCP.
- Add Layout Engine V2 collision post-pass to prevent same-generation card overlap.
- Add Auto / Hybrid / Manual layout modes and persist Admin-dragged positions in `clan_info.default_tree_settings.manualTreeLayout`.
- Add mobile Member Sheet for touch-friendly detail, branch, spouse, child and burial actions.
- ReactFlow canvas can follow the active website theme by default, or be customized independently with a reset-to-theme option.
