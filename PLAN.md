## Facts
- The repository workspace is currently empty.
- The requested deliverable is an MVP app for splitting party expenses and producing transfer instructions.
- Required inputs per person are:
  - Amount spent (default 0)
  - Extra amount they should pay (penalty; default 0)
  - Extra amount they should receive (benefit; default 0)
- A key requirement is minimizing the number of wire transfers while allowing control over who may handle multiple outgoing transfers.

## Assumptions
- Currency is a single unit (no FX conversion).
- Equal split is the default base rule before applying pay/get adjustments.
- Inputs are decimal amounts that can be rounded to cents.
- Typical party size is small-to-medium (e.g., <= 20 people), so an exact search with pruning is acceptable for MVP.
- A web app (mobile + desktop browser support) satisfies the cross-platform requirement for this phase.

## Proposed Approach
- Build a Python FastAPI web app with a JSON API and a simple HTML front-end.
- Implement settlement as:
  - Compute each person’s net balance.
  - Build transfers from debtors to creditors.
  - Use exact branch-and-bound search to minimize transfer count.
  - Tie-break with a penalty that discourages multiple outgoing transfers for non-selected payers.

## Failure Modes
- Invalid financial inputs (NaN, negative spent, inconsistent totals) can produce incorrect or impossible settlements.
- Floating-point precision can create tiny residuals that violate conservation constraints.
- Exact optimization can become slow for larger groups if pruning is insufficient.
- Burden preference may conflict with strict minimal transfer count expectations if tie-breaking is misunderstood.
- Missing runtime dependencies in environment may prevent local execution of API/tests.

## Mitigations
- Validate payload schema and enforce invariants (`sum(net) == 0` within tolerance).
- Use integer cents internally to avoid floating-point drift.
- Add branch-and-bound pruning and deterministic ordering for repeatability.
- Keep objective explicit: minimize transfer count first, burden score second.
- Add unit tests for correctness and edge cases.

## Addendum: Drag Reordering
- Add a user-controlled option to enable drag-and-move row ordering in the participant table.
- Keep drag behavior UI-only; settlement logic remains based on submitted payload order.
- Preserve existing behavior when drag option is off.
- Failure mode: accidental row move during editing.
- Mitigation: keep a clear drag toggle visible so users can disable reordering at any time.

## Addendum: Cross-Device Drag
- HTML5 drag-and-drop is inconsistent on touch browsers.
- Use Pointer Events for reorder interactions to support both mouse and touch.
- Failure mode: page scrolling conflicts with drag gestures on mobile.
- Mitigation: drag handle uses `touch-action: none` and drag starts only from handle.

## Addendum: Count + Name Reset Controls
- Add a participant-count numeric input and apply button to resize row count quickly.
- Add a name reset mode control with options:
  - empty names
  - `human 01`, `human 02`, ...
  - alphabetical (`A`, `B`, `C`, ...).
- Reset behavior applies to the Name column only.
- If user-edited input exists, show a warning confirmation before name reset.
- Failure mode: accidental overwrite of custom names.
- Mitigation: confirmation dialog on reset once user edits are detected.

## Addendum: UI Cache + Preference Robustness
- Browser static-file caching can keep an older frontend script after UI changes.
- Mitigation: add cache-busting query params to static JS/CSS references.
- Preferred multi-payer names may include participants who are not payers in a specific settlement.
- Mitigation: ignore non-payer preferred names instead of hard-failing the API request.

## Addendum: UI Localization
- Add client-side localization for English, Korean, and Japanese.
- Add a compact top-right language switch button group.
- Translate static labels and dynamic UI messages (validation, summary, role labels, warnings).
- Keep backend API payload and mode values language-agnostic to avoid behavior regressions.

## Addendum: Naming + README Localization
- Provide repository naming options in multiple languages with both clear and playful variants.
- Update README to reflect current implemented features and behavior.
- Include multilingual README sections for English, Korean, Japanese, and Chinese.
- Keep run/test/API instructions consistent across language descriptions.

## Addendum: Split READMEs + Chinese UI
- Create language-specific README files for Korean, Japanese, and Chinese.
- Keep the main README as index/entrypoint with links to each localized README.
- Add Chinese to the in-app language switch and translation bundle.
- Failure mode: divergence between localized docs.
- Mitigation: keep the same section structure and command examples across files.

## Addendum: Localized Brand Title
- Set English app title to `Wire-Min-Splitter`.
- For non-English UI languages, show `Wire-Min-Splitter (<localized app name>)`.
- Apply this consistently to both page heading and browser tab title.

## Addendum: Checkbox Hover Help
- Add hover descriptions (`title`) for checkbox controls to reduce ambiguity.
- Localize tooltip text per selected language.
- Cover toolbar checkboxes and row-level preferred checkbox.

## Addendum: Tooltip Hover Hitbox
- Some browsers only show native `title` tooltip reliably on the exact checkbox hit area.
- Mitigation: apply localized tooltip `title` to the enclosing label so hovering text also shows help.
- Failure mode: users assume tooltip is missing when only the tiny checkbox hotspot has the title.

## Addendum: Fast Tab Navigation
- Goal: reduce per-row tab stops so users can move from one person's Name to the next in ~2 tabs.
- Change: disable `Extra Pay`/`Extra Get` by default and provide an explicit toggle to enable them.
- Change: exclude row-level advanced controls (`preferred`, `remove`, `drag handle`) from default tab order.
- Failure mode: keyboard-only users may lose access to advanced row controls.
- Mitigation: keep controls clickable with mouse/touch and keep toolbar toggles keyboard-accessible.
- Assumption: primary data-entry flow focuses on Name + Spent fields.

## Addendum: Namespace Rename to wire_min_splitter
- Objective: rename package/module paths to `wire_min_splitter`.
- Scope: directory rename under `src/`, import path updates, run-command docs, project metadata names.
- Failure mode: stale import path in tests/docs causing runtime/import errors.
- Mitigation: `rg` sweep after edits and run `uv run pytest`.
- Assumption: requested rename targets Python namespace and related references, not repo folder name.

## Addendum: Final Old-Name Cleanup
- Objective: remove residual legacy names from Python and documentation files.
- Scope: `.py`, `.md`, and related run-command references.
- Failure mode: accidental replacement in literal filesystem paths that should remain unchanged.
- Mitigation: review `rg` results before/after and keep actual workspace path strings intact.

## Addendum: Result Rounding + Live Auto-Calc
- Add a result-rounding control for output presentation (`exact` vs `whole`).
- Implement deterministic rounding in the UI while keeping total consistency within each rendered list via residual correction.
- Add debounced auto-calculation on participant input edits and immediate recalculation on structural changes/toggles.
- Failure mode: out-of-order async responses can render stale results.
- Mitigation: request-sequence guard; ignore stale responses.
- Failure mode: auto-calc noise when no named participants.
- Mitigation: silent mode for auto-calc that hides results/errors until valid input exists.

## Addendum: Result Monospace + Arrow Rounding Stepper
- Apply fixed-width font styling to Result outputs for easier scan/comparison.
- Replace dropdown rounding choice with left/right arrow controls to shift rounding place.
- Represent rounding as digit position (e.g., 0.01, 0.1, 1, 10, 100) and re-render results immediately on change.
- Failure mode: negative-digit formatting can break `toFixed` usage.
- Mitigation: use custom formatter path for digits < 0.
- Failure mode: stale localized option labels after control redesign.
- Mitigation: remove obsolete option-label update logic and localize button labels/tooltips.

## Addendum: JP Name + Column Toggles + Manual Recalc
- Update Japanese localized app name to `最小送金バラバラ割り勘`.
- Replace single "Enable Extra Pay/Get" toolbar toggle with per-column toggles in `Extra Pay` and `Extra Get` headers.
- Move rounding stepper next to the manual calculation control in the action row.
- Keep manual calculate as a low-emphasis fallback button since auto-refresh exists.
- Failure mode: duplicated enable controls with stale selectors.
- Mitigation: remove old selector usage and rewire state logic to two header toggles.
- Failure mode: payload may include disabled-column values.
- Mitigation: force disabled column values to `0` during payload collection.

## Addendum: Force Recalculate Label + Fallback Tooltip
- Rename manual button label to emphasize it is a fallback action.
- Add localized tooltip clarifying it should be used only when auto-refresh appears not to work.
- Failure mode: untranslated tooltip key in some language.
- Mitigation: add key in all active language dictionaries.

## Addendum: Repeat Column Default Disabled
- Make `Repeat` input disabled by default, similar to optional extra columns.
- Add a header-level toggle for enabling/disabling the `Repeat` column.
- When disabled, force effective repeat count to `1` and remove repeat input from tab order.
- Failure mode: stale repeat values unexpectedly applied while disabled.
- Mitigation: payload builder ignores repeat input unless repeat toggle is enabled.

## Addendum: Global Multiplier
- Add a global `Multiplier` input (default `1`) to scale all monetary inputs before settlement.
- Primary use case: quick currency conversion while keeping entered per-person structure unchanged.
- Validate multiplier as a positive number (`> 0`); invalid values should block manual recalculation.
- Apply multiplier in backend using `Decimal` arithmetic to avoid frontend floating-point drift.
- Failure mode: temporary invalid multiplier during typing can spam errors.
- Mitigation: auto-refresh path suppresses hard errors for transient invalid multiplier states.

## Addendum: Dual Result Display + Numeric Separators
- When multiplier is not `1`, Result entries should show both `original` and `multiplied` amounts.
- Keep single-value display when multiplier equals `1`.
- Format result numbers with thousands separators.
- Add a user-facing selector to switch between:
  - comma-period (`1,000.00`)
  - period-comma (`1.000,00`)
- Failure mode: changing format could accidentally alter backend payload parsing.
- Mitigation: apply separator style only at result-rendering time; keep API payload numeric strings unchanged.

## Addendum: Separate Rounding Before/After Multiplier
- Split rounding controls into two independent settings:
  - `Before multiplier`
  - `After multiplier`
- Apply `before` rounding to original-value display and `after` rounding to multiplied-value display.
- Keep one-value mode (multiplier = 1) based on the `after` setting.
- Failure mode: UI still wired to old single-rounding control IDs.
- Mitigation: replace old DOM IDs/selectors and rebind listeners to both steppers.

## Addendum: Conditional Rounding Labels at Multiplier = 1
- When multiplier is exactly `1`, simplify rounding UI:
  - hide the `Before multiplier` control
  - rename `After multiplier` label to `Round numbers`
- When multiplier is changed away from `1`, restore both labeled controls.
- Failure mode: language switch can overwrite dynamic label text.
- Mitigation: re-apply rounding-mode UI state after localization pass.

## Addendum: Remove Redundant Header Labels
- Remove visible table header text for `Drag` and `Actions` columns.
- Keep both columns and functionality unchanged (drag handle and remove button still present).

## Addendum: Spent Step Follows Rounding
- Make `Spent` input step size track the active rounding unit.
- Rule:
  - multiplier = `1` -> use single visible rounding unit (`Round numbers`)
  - multiplier != `1` -> use `Before multiplier` rounding unit
- Apply to existing rows and newly added rows.
