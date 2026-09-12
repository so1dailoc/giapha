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
