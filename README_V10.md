
## V11 visual refinement
- Card-specific CSS variables isolate horizontal/vertical card colors from the global website theme.
- Horizontal and vertical member-name alignment is configurable (auto/center/left/right).
- Card action buttons use equal-size grid cells; vertical cards use a 2x2 action layout to prevent overlap with collapse controls.
- Card heights are content-aware for avatars, spouses, dates, titles and birth place.
- Website theme remaps legacy semantic colors and switches light/dark form-control color-scheme by preset.
# Gia Phả Đại Tộc — V10

## Fixes
- Content-aware horizontal cards: enabled avatar/spouse/date/title/birthplace content expands card height instead of clipping/escaping.
- Layout and node height use the same calculation, preventing overlap when optional card fields are enabled.
- Vertical card action buttons have equal flexible widths and the collapse control is separated below the content.
- Global interface theme now overrides legacy amber/red/slate utilities and common gradients so presets are consistent across pages/modals/navigation.
- Existing AdminCP Database/Supabase tools remain intact.
