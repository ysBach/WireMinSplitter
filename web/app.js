const BUILD_VERSION = "__CACHE_VERSION__";

// Register Service Worker only when built and running in a secure browser context
if (
  !BUILD_VERSION.startsWith("__") &&
  typeof window !== "undefined" &&
  window.isSecureContext &&
  "serviceWorker" in navigator
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

const tbody = document.querySelector("#participants tbody");
const participantsTable = document.querySelector("#participants");
const rowTemplate = document.querySelector("#row-template");
const dragToggle = document.querySelector("#enable-drag");
const strictPreferenceToggle = document.querySelector("#strict-preference");
const repeatToggle = document.querySelector("#enable-repeat");
const extraPayToggle = document.querySelector("#enable-extra-pay");
const extraGetToggle = document.querySelector("#enable-extra-get");
const beforeRoundingLeftButton = document.querySelector("#rounding-before-left");
const beforeRoundingRightButton = document.querySelector("#rounding-before-right");
const beforeRoundingDisplay = document.querySelector("#rounding-before-display");
const afterRoundingLeftButton = document.querySelector("#rounding-after-left");
const afterRoundingRightButton = document.querySelector("#rounding-after-right");
const afterRoundingDisplay = document.querySelector("#rounding-after-display");
const beforeRoundingGroup = document.querySelector("#rounding-before-group");
const afterRoundingGroup = document.querySelector("#rounding-after-group");
const beforeRoundingLabel = document.querySelector("#rounding-before-label");
const afterRoundingLabel = document.querySelector("#rounding-after-label");
const multiplierInput = document.querySelector("#multiplier");
const numberStyleSelect = document.querySelector("#number-style");
const peopleCountInput = document.querySelector("#people-count");
const applyCountButton = document.querySelector("#apply-count");
const nameResetModeSelect = document.querySelector("#name-reset-mode");
const resetNamesButton = document.querySelector("#reset-names");
const languageButtons = document.querySelectorAll("[data-lang-button]");
const errorEl = document.querySelector("#error");
const resultEl = document.querySelector("#result");
const summaryEl = document.querySelector("#summary");
const balancesEl = document.querySelector("#balances");
const transfersEl = document.querySelector("#transfers");
const singleResultPanel = document.querySelector("#single-result-panel");
const dualResultPanel = document.querySelector("#dual-result-panel");
const originalSummaryEl = document.querySelector("#original-summary");
const originalBalancesEl = document.querySelector("#original-balances");
const originalTransfersEl = document.querySelector("#original-transfers");
const multipliedSummaryEl = document.querySelector("#multiplied-summary");
const multipliedBalancesEl = document.querySelector("#multiplied-balances");
const multipliedTransfersEl = document.querySelector("#multiplied-transfers");
const copyResultsButton = document.querySelector("#copy-results");
const screenshotResultsButton = document.querySelector("#screenshot-results");
const resultToolsFeedbackEl = document.querySelector("#result-tools-feedback");
const calculatingIndicatorEl = document.querySelector("#calculating-indicator");
const calculatingTimerEl = document.querySelector("#calculating-timer");
const cancelCalculateButton = document.querySelector("#cancel-calculate");
const roundingNoticeEl = document.querySelector("#rounding-notice");
const approximateNoticeEl = document.querySelector("#approximate-notice");
const offlineIndicatorEl = document.querySelector("#offline-indicator");

const INITIAL_PARTICIPANT_COUNT = 3;
const MIN_PARTICIPANT_COUNT = 1;
const LANGUAGE_STORAGE_KEY = "wire_min_splitter_language";
const NUMBER_STYLE_STORAGE_KEY = "wire_min_splitter_number_style";
const DEFAULT_LANGUAGE = "en";
const DEFAULT_NUMBER_STYLE = "comma_period";
const AUTO_CALC_DEBOUNCE_MS = 250;
const MIN_ROUNDING_DIGITS = -3;
const MAX_ROUNDING_DIGITS = 4;
const DEFAULT_ROUNDING_DIGITS = 2;
const MAX_PARTICIPANT_NAME_LENGTH = 120;

const TRANSLATIONS = {
  "en": {
    "title.document": "Wire-Min-Splitter",
    "app.title": "Wire-Min-Splitter",
    "app.subtitle": "Enter party spending and optional fairness adjustments, then generate minimal transfer instructions.",
    "button.add_person": "Add Person",
    "label.people": "People",
    "button.apply_count": "Apply Count",
    "label.name_reset": "Name Reset",
    "option.abcd": "ABCD",
    "option.empty": "Empty",
    "option.human_int": "Human 01, 02",
    "button.reset_names": "Reset Names",
    "label.enable_drag": "Enable drag reorder",
    "label.strict_preference": "Strict preference mode",
    "label.multiplier": "Multiplier",
    "label.number_style": "Number Format",
    "option.comma_period": "1,000.00",
    "option.period_comma": "1.000,00",
    "label.result_rounding_single": "Round numbers",
    "label.result_rounding_before": "Before Multiplier",
    "label.result_rounding_after": "After Multiplier",
    "table.drag": "Drag",
    "table.name": "Name",
    "table.repeat": "Repeat",
    "table.spent": "Spent",
    "table.extra_pay": "Extra Pay",
    "table.extra_get": "Extra Get",
    "table.preferred_multi": "Preferred Multi-Payer",
    "table.actions": "Actions",
    "button.calculate": "Calculate Settlement",
    "button.recalculate": "Force Recalculate",
    "button.copy_results": "Copy Results",
    "button.screenshot_results": "Screenshot",
    "section.result": "Result",
    "section.net_balances": "Net Balances",
    "section.transfers": "Transfers",
    "button.remove": "Remove",
    "placeholder.name": "Name",
    "title.drag_handle": "Drag to reorder",
    "tooltip.enable_drag": "Enable to reorder participant rows by dragging the :: handle.",
    "tooltip.strict_preference": "When on, only selected preferred payers can send to multiple people.",
    "tooltip.enable_repeat": "Enable editing of the Repeat column (default off for faster entry).",
    "tooltip.enable_extra_pay": "Enable editing of the Extra Pay column.",
    "tooltip.enable_extra_get": "Enable editing of the Extra Get column.",
    "tooltip.multiplier": "Multiply all entered amounts by this value (useful for currency conversion).",
    "tooltip.number_style": "Choose separator style for Result numbers.",
    "tooltip.result_rounding_single": "Choose how amounts are rounded in the Result section.",
    "tooltip.result_rounding_before": "Choose rounding for original amounts (before multiplier).",
    "tooltip.result_rounding_after": "Choose rounding for multiplied amounts (after multiplier).",
    "tooltip.rounding_left": "Round to a larger unit (0.01 -> 0.1 -> 1 -> 10 ...).",
    "tooltip.rounding_right": "Round to a smaller unit (10 -> 1 -> 0.1 -> 0.01 ...).",
    "tooltip.force_recalculate": "Fallback button: use this only if automatic result refresh appears not to work.",
    "tooltip.copy_results": "Copy full Result text to clipboard.",
    "tooltip.screenshot_results": "Download screenshot including top inputs and the Result section.",
    "tooltip.repeat": "Number of identical participants represented by this row.",
    "tooltip.preferred_multi": "Mark this person as allowed/preferred to handle multiple outgoing transfers.",
    "aria.drag_enabled": "Drag row to reorder",
    "aria.drag_disabled": "Enable drag reorder first",
    "error.people_count_invalid": "People count must be an integer greater than or equal to 1.",
    "error.multiplier_invalid": "Multiplier must be a number greater than 0.",
    "error.add_participant": "Add at least one participant with a name.",
    "error.result_not_ready": "Calculate results first.",
    "error.settlement_failed": "Settlement failed.",
    "error.network": "Network error: {error}",
    "summary.template": "Transactions: {transactions} | Burden penalty: {burdenPenalty}",
    "summary.no_transfers": "No transfers needed.",
    "confirm.reset_names": "This will erase Name inputs you entered. Do you want to continue?",
    "message.copy_success": "Results copied.",
    "message.copy_error": "Failed to copy results.",
    "message.screenshot_success": "Screenshot downloaded.",
    "message.screenshot_error": "Failed to create screenshot.",
    "label.original": "original",
    "label.multiplied": "multiplied",
    "role.payer": "payer",
    "role.receiver": "receiver",
    "role.settled": "settled",
    "button.cancel": "Cancel",
    "warning.calculating_long": "Finding the fewest transfers can take a long time. You can cancel.",
    "warning.calculating_time": "Finding the fewest transfers can take a long time ({time}). You can cancel.",
    "message.cancelled": "Calculation cancelled.",
    "error.blank_populated_name": "Name cannot be empty for a populated row.",
    "error.duplicate_name": "Duplicate participant name: {name}",
    "error.repeat_not_safe_integer": "Repeat count must be a positive safe integer.",
    "notice.rounding": "Note: Due to balanced-cent allocation, identical participants may differ by 0.01.",
    "notice.approximate_display": "Approximate display only (not exact payment instructions; sums may not conserve).",
    "status.offline": "Offline",
    "aria.row_name": "Row {row} Name",
    "aria.row_spent": "Row {row} Spent",
    "aria.row_repeat": "Row {row} Repeat",
    "aria.row_extra_pay": "Row {row} Extra Pay",
    "aria.row_extra_get": "Row {row} Extra Get",
    "aria.row_preferred": "Row {row} Preferred Multi-Payer",
    "aria.row_remove": "Row {row} Remove",
    "aria.row_drag": "Row {row} Drag to reorder",
    "heading.original_plan": "Original Settlement Plan (Before Multiplier)",
    "heading.multiplied_plan": "Multiplied Settlement Plan (After Multiplier)",
    "error.invalid_amount": "Invalid amount for {name} ({field}).",
    "field.spent": "spent",
    "field.extra_pay": "extra pay",
    "field.extra_get": "extra get",
    "algorithm.title": "How the algorithm works",
    "algorithm.intro": "The tool finds the plan with the fewest transfers. First, it computes each person's balance in whole cents. Then an exact search finds the best plan. Section 6 proves that this plan is optimal.",
    "algorithm.h.input": "1. Check the input",
    "algorithm.in.1": "Each name must be unique and not empty. The tool applies Unicode NFC, removes white space at both ends, and keeps at most 120 code points.",
    "algorithm.in.2": "The tool reads every amount as an exact fraction. It uses no floating-point numbers for money.",
    "algorithm.in.3": "Spent must be 0 or more. The multiplier $m$ must be more than 0. The Extra Get total must equal the Extra Pay total.",
    "algorithm.in.4": "A row with Repeat $n > 1$ becomes $n$ people. Each name gets a number with as many digits as $n$. For example, Repeat 12 gives Team 01 to Team 12. A row with $n = 1$ keeps its name.",
    "algorithm.h.balance": "2. Compute each balance",
    "algorithm.bal.lead": "The tool first computes the exact balance $b_i$ of each person $i$, in cents:",
    "algorithm.bal.def.b": "Exact balance of person $i$ in cents. It can be a fraction.",
    "algorithm.bal.def.sgp": "Spent, Extra Get, and Extra Pay of person $i$",
    "algorithm.bal.def.tn": "Total Spent and number of people",
    "algorithm.bal.def.m": "Multiplier",
    "algorithm.bal.sign": "$T/N$ is the equal share of the spending. A person with $b_i > 0$ gets money. A person with $b_i < 0$ pays money.",
    "algorithm.h.round": "3. Round to whole cents",
    "algorithm.round.lead": "Transfers use whole cents. The tool changes each $b_i$ to a whole number $c_i$ and keeps the total at exactly 0:",
    "algorithm.round.1": "Round each $b_i$ down to $⌊b_i⌋$, the largest whole number that is not more than $b_i$. For example, −33⅓ becomes −34.",
    "algorithm.round.2": "Count the missing cents $k$ with the formula below.",
    "algorithm.round.3": "Add 1 cent to the $k$ people with the largest remainders $b_i − ⌊b_i⌋$. If remainders tie, the name that comes first in Unicode code point order gets the cent first.",
    "algorithm.round.why": "The $b_i$ add up to 0, so $k$ is the sum of the remainders. Each remainder is at least 0 and less than 1. So $k$ is a whole number and $0 ≤ k < N$.",
    "algorithm.round.result": "Result: the $c_i$ add up to exactly 0. Each $c_i$ differs from $b_i$ by less than 1 cent. Two people with the same inputs can get balances that differ by 1 cent.",
    "algorithm.round.roles": "A person with $c_i < 0$ is a payer. A person with $c_i > 0$ is a receiver. A person with $c_i = 0$ takes no part in the search.",
    "algorithm.h.example": "Example",
    "algorithm.example.lead": "A spent 1.00. B and C spent 0. The multiplier is 1. The equal share is 33⅓ cents. All values in the table are in cents.",
    "algorithm.example.person": "Person",
    "algorithm.example.after": "The rounded-down values add up to −2, so $k = 2$. All three remainders are ⅔. A and B come first by name, so each gets 1 cent. The plan is B → A 0.33 and C → A 0.34.",
    "algorithm.h.goal": "4. Define the best plan",
    "algorithm.goal.lead": "A plan is a list of transfers. Each transfer goes from one payer to one receiver. The tool gives each plan a score of two numbers:",
    "algorithm.goal.def.c": "Number of transfers. The result shows it as Transactions.",
    "algorithm.goal.def.b": "Burden penalty. Each payer in $U$ adds 1 for each transfer after its first. The result shows it as Burden penalty.",
    "algorithm.goal.def.d": "Number of transfers that payer $i$ sends",
    "algorithm.goal.def.u": "Payers that are not marked Preferred Multi-Payer",
    "algorithm.goal.order": "The tool picks the plan with the smallest $C$. If plans tie on $C$, it picks the plan with the smallest $B$. In the formulas, lexmin means this order.",
    "algorithm.goal.strict": "Strict preference mode adds a rule: each payer in $U$ sends at most 1 transfer. Receivers have no limit. If no plan obeys this rule, the result shows a no-plan error.",
    "algorithm.h.search": "5. Search the plans",
    "algorithm.search.lead": "The search builds a plan one transfer at a time. It tries every useful next transfer, depth first, and keeps the best score.",
    "algorithm.search.state": "A state $S$ shows what is still open. Payer $i$ still owes $a_i$. Receiver $j$ still waits for $r_j$. Each payer also has two flags: preferred, and sent (it already sent a transfer).",
    "algorithm.search.move": "A move sends $min(a_i, r_j)$ from payer $i$ to receiver $j$. This settles payer $i$, receiver $j$, or both. So each move removes at least 1 person, and the search always ends.",
    "algorithm.search.def.s": "State after the move from payer $i$ to receiver $j$",
    "algorithm.search.def.e": "1 if payer $i$ is in $U$ and its sent flag is on, otherwise 0",
    "algorithm.search.base": "An empty state $∅$ has the score $(0, 0)$. The search skips a move if the state after it has no valid plan. In strict preference mode, it also skips every move with $e_i = 1$.",
    "algorithm.search.fast.lead": "These shortcuts make the search faster:",
    "algorithm.search.fast.1": "One payer or one receiver left: each open person must connect to that person. A direct formula gives $C$ and $B$ and applies the strict rule.",
    "algorithm.search.fast.2": "Equal choices: payers are equal if their amounts and both flags match. Receivers are equal if their amounts match. The search tries equal choices only once.",
    "algorithm.search.fast.3": "Memory: the search stores the score of each solved state and reuses it. The key is the sorted payers and the sorted receivers.",
    "algorithm.search.fast.4": "Lower bound: let $P'$ and $R'$ be the open payers and receivers after a move. Each of them needs at least 1 more transfer. So at least $max(|P'|, |R'|)$ more transfers are necessary.",
    "algorithm.search.fast.5": "Pruning: the search skips a move if $1 + max(|P'|, |R'|)$ is more than the best $C$ found so far for this state. A tie stays, so $B$ can still decide.",
    "algorithm.search.tie": "If two moves give the same score, the search keeps the first one. It uses a fixed order: amount, then flags, then name. So the same input always gives the same plan.",
    "algorithm.h.proof": "6. Why the plan is optimal",
    "algorithm.proof.lead": "Claim: the search returns the smallest score $(C, B)$ for the cent balances. Draw a plan as a graph. Each person is a node, and each transfer is an edge.",
    "algorithm.proof.1": "Remove cycles. Suppose some edges form a cycle (ignore their directions). Add $+δ$ and $−δ$ to the cycle edges in turn. Each person on the cycle gets one $+δ$ and one $−δ$, so no balance changes.",
    "algorithm.proof.2": "Set $δ$ to the smallest amount on the $−δ$ edges. Then at least 1 edge drops to 0, and the plan has fewer transfers. No payer sends more transfers, so the strict rule still holds. So an optimal plan has no cycle. Its graph is a forest.",
    "algorithm.proof.3": "Find a leaf. A forest with at least 1 edge has a leaf: a person with exactly 1 transfer. That transfer carries the leaf's full open amount. The other person's amount is at least as large. So the transfer is $min(a_i, r_j)$, a move that the search tries (or an equal choice).",
    "algorithm.proof.4": "Shrink the problem. Remove that transfer. The rest of the plan settles the smaller state $S_ij$ with the score $(C − 1, B − e_i)$. The same argument applies to $S_ij$, so the search finds a score there that is at least this good. Each round removes at least 1 person, so the argument ends.",
    "algorithm.proof.5": "Check the shortcuts. Pruning skips only moves that cannot win. The other shortcuts give exact scores. So the search returns the optimal score $(C, B)$.",
    "algorithm.proof.scope": "Scope: the plan is optimal for the cent balances $c_i$, among plans in which each transfer goes from a payer to a receiver. The tool makes no claim about other kinds of plan. Other plans can have the same score.",
    "algorithm.h.views": "7. Two plans with a multiplier",
    "algorithm.views.1": "If $m = 1$, the tool makes one plan.",
    "algorithm.views.2": "If $m ≠ 1$, the tool makes two plans. The Multiplied Settlement Plan uses $m$. The Original Settlement Plan uses $m = 1$.",
    "algorithm.views.3": "The tool computes each plan separately. In strict preference mode, one plan can show a no-plan error while the other shows a plan.",
    "algorithm.views.4": "The rounding controls change only the numbers on screen. A unit other than 0.01 shows approximate values. Use 0.01 for exact payment instructions.",
    "algorithm.h.limits": "8. Limits",
    "algorithm.lim.1": "The run time can grow exponentially with the number of payers and receivers.",
    "algorithm.lim.2": "The search runs in a background worker in your browser. It works offline after your browser caches the app.",
    "algorithm.lim.3": "The solver has no time limit and no limit on the number of people. Use Cancel to stop a long search.",
    "algorithm.lim.4": "Cancel, or a memory or stack failure, is not a no-plan result. It does not show whether a plan exists.",
    "algorithm.lim.5": "Only a search that completes returns the optimal plan for the cent balances.",
    "algorithm.source": "View the solver source code (JavaScript)"
  },
  "ko": {
    "title.document": "Wire-Min-Splitter (최소송금 N빵 계산기)",
    "app.title": "Wire-Min-Splitter (최소송금 N빵 계산기)",
    "app.subtitle": "파티 지출과 보정값을 입력하면 최소 송금 횟수 정산안을 계산합니다.",
    "button.add_person": "인원 추가",
    "label.people": "인원",
    "button.apply_count": "인원 적용",
    "label.name_reset": "이름 초기화",
    "option.abcd": "ABCD",
    "option.empty": "비우기",
    "option.human_int": "human 01, 02",
    "button.reset_names": "이름 초기화 실행",
    "label.enable_drag": "드래그 정렬 사용",
    "label.strict_preference": "엄격 선호 모드",
    "label.multiplier": "배율",
    "label.number_style": "숫자 형식",
    "option.comma_period": "1,000.00",
    "option.period_comma": "1.000,00",
    "label.result_rounding_single": "숫자 반올림",
    "label.result_rounding_before": "배율 전 반올림",
    "label.result_rounding_after": "배율 후 반올림",
    "table.drag": "드래그",
    "table.name": "이름",
    "table.repeat": "반복",
    "table.spent": "지출",
    "table.extra_pay": "추가 부담",
    "table.extra_get": "추가 수령",
    "table.preferred_multi": "다중 송금 선호자",
    "table.actions": "작업",
    "button.calculate": "정산 계산",
    "button.recalculate": "재계산 (새로고침)",
    "button.copy_results": "결과 복사",
    "button.screenshot_results": "스크린샷",
    "section.result": "결과",
    "section.net_balances": "순잔액",
    "section.transfers": "송금 지시",
    "button.remove": "삭제",
    "placeholder.name": "이름",
    "title.drag_handle": "드래그로 순서 변경",
    "tooltip.enable_drag": "켜면 :: 핸들을 잡아 참가자 행 순서를 드래그로 바꿀 수 있습니다.",
    "tooltip.strict_preference": "켜면 선호 대상으로 선택된 송금자만 여러 사람에게 송금할 수 있습니다.",
    "tooltip.enable_repeat": "반복 열 입력을 켭니다 (빠른 입력을 위해 기본은 꺼짐).",
    "tooltip.enable_extra_pay": "켜면 추가 부담 열을 직접 입력할 수 있습니다.",
    "tooltip.enable_extra_get": "켜면 추가 수령 열을 직접 입력할 수 있습니다.",
    "tooltip.multiplier": "입력 금액(지출/추가 부담/추가 수령)에 곱할 값입니다. 환율 변환에 쓸 수 있습니다.",
    "tooltip.number_style": "결과 숫자의 소수점/천 단위 구분 형식을 선택합니다.",
    "tooltip.result_rounding_single": "결과 섹션 금액을 어떤 단위로 반올림할지 선택합니다.",
    "tooltip.result_rounding_before": "원래값(배율 적용 전) 금액의 반올림 단위를 선택합니다.",
    "tooltip.result_rounding_after": "배율 적용 후 금액의 반올림 단위를 선택합니다.",
    "tooltip.rounding_left": "더 큰 단위로 반올림합니다 (0.01 -> 0.1 -> 1 -> 10 ...).",
    "tooltip.rounding_right": "더 작은 단위로 반올림합니다 (10 -> 1 -> 0.1 -> 0.01 ...).",
    "tooltip.force_recalculate": "자동 결과 갱신이 동작하지 않을 때만 사용하는 예비 버튼입니다.",
    "tooltip.copy_results": "결과 전체 텍스트를 클립보드에 복사합니다.",
    "tooltip.screenshot_results": "상단 입력 영역과 결과 섹션을 함께 PNG 스크린샷으로 저장합니다.",
    "tooltip.repeat": "이 행이 대표하는 동일 참가자 수입니다.",
    "tooltip.preferred_multi": "이 사람을 다중 송금을 맡길(또는 허용할) 대상으로 지정합니다.",
    "aria.drag_enabled": "행을 드래그해서 순서를 변경",
    "aria.drag_disabled": "먼저 드래그 정렬을 켜세요",
    "error.people_count_invalid": "인원 수는 1 이상의 정수여야 합니다.",
    "error.multiplier_invalid": "배율은 0보다 큰 숫자여야 합니다.",
    "error.add_participant": "이름이 있는 참가자를 최소 1명 추가하세요.",
    "error.result_not_ready": "먼저 결과를 계산하세요.",
    "error.settlement_failed": "정산 계산에 실패했습니다.",
    "error.network": "네트워크 오류: {error}",
    "summary.template": "송금 건수: {transactions} | 부담 패널티: {burdenPenalty}",
    "summary.no_transfers": "송금이 필요 없습니다.",
    "confirm.reset_names": "이 작업은 입력한 이름을 지웁니다. 계속 진행할까요?",
    "message.copy_success": "결과를 복사했습니다.",
    "message.copy_error": "결과 복사에 실패했습니다.",
    "message.screenshot_success": "스크린샷을 저장했습니다.",
    "message.screenshot_error": "스크린샷 생성에 실패했습니다.",
    "label.original": "원래값",
    "label.multiplied": "배율적용",
    "role.payer": "송금자",
    "role.receiver": "수령자",
    "role.settled": "정산 완료",
    "button.cancel": "취소",
    "warning.calculating_long": "최소 송금 횟수를 찾는 작업은 시간이 오래 걸릴 수 있습니다. 취소할 수 있습니다.",
    "warning.calculating_time": "최소 송금 횟수를 찾는 작업은 시간이 오래 걸릴 수 있습니다 ({time}). 취소할 수 있습니다.",
    "message.cancelled": "계산이 취소되었습니다.",
    "error.blank_populated_name": "입력된 값이 있는 행의 이름은 비워둘 수 없습니다.",
    "error.duplicate_name": "중복된 참가자 이름입니다: {name}",
    "error.repeat_not_safe_integer": "반복 횟수는 1 이상의 안전한 정수여야 합니다.",
    "notice.rounding": "참고: 균형 센트 단위 배분으로 인해 동일한 참가자 간에 0.01의 차이가 발생할 수 있습니다.",
    "notice.approximate_display": "근사 표시 전용 (정확한 송금 지침이 아니며 합계가 보존되지 않을 수 있습니다).",
    "status.offline": "오프라인",
    "aria.row_name": "{row}번 행 이름",
    "aria.row_spent": "{row}번 행 지출",
    "aria.row_repeat": "{row}번 행 반복",
    "aria.row_extra_pay": "{row}번 행 추가 부담",
    "aria.row_extra_get": "{row}번 행 추가 수령",
    "aria.row_preferred": "{row}번 행 다중 송금 선호자",
    "aria.row_remove": "{row}번 행 삭제",
    "aria.row_drag": "{row}번 행 드래그 정렬",
    "heading.original_plan": "원래 정산안 (배율 적용 전)",
    "heading.multiplied_plan": "배율 적용 정산안 (배율 적용 후)",
    "error.invalid_amount": "{name}의 {field} 금액이 올바르지 않습니다.",
    "field.spent": "지출",
    "field.extra_pay": "추가 부담",
    "field.extra_get": "추가 수령",
    "algorithm.title": "알고리즘 작동 방식",
    "algorithm.intro": "이 도구는 송금 횟수가 가장 적은 계획을 찾습니다. 먼저 각 사람의 잔액을 센트 단위 정수로 계산합니다. 그다음 정확한 탐색으로 가장 좋은 계획을 찾습니다. 6절에서 이 계획이 최적임을 증명합니다.",
    "algorithm.h.input": "1. 입력 확인",
    "algorithm.in.1": "이름은 비어 있으면 안 되고 서로 달라야 합니다. 도구는 유니코드 NFC로 정규화하고, 앞뒤 공백을 지우고, 최대 120 코드 포인트만 남깁니다.",
    "algorithm.in.2": "모든 금액을 정확한 분수로 읽습니다. 금액 계산에는 부동소수점을 쓰지 않습니다.",
    "algorithm.in.3": "지출은 0 이상이어야 합니다. 배율 $m$은 0보다 커야 합니다. 추가 수령 합계와 추가 부담 합계는 같아야 합니다.",
    "algorithm.in.4": "반복이 $n > 1$인 행은 $n$명이 됩니다. 각 이름 뒤에 $n$과 자릿수가 같은 번호가 붙습니다. 예: 반복 12는 팀 01 ~ 팀 12가 됩니다. 반복이 $n = 1$인 행은 입력한 이름을 그대로 씁니다.",
    "algorithm.h.balance": "2. 잔액 계산",
    "algorithm.bal.lead": "먼저 각 사람 $i$의 정확한 잔액 $b_i$를 센트 단위로 계산합니다.",
    "algorithm.bal.def.b": "사람 $i$의 정확한 잔액(센트). 분수일 수 있습니다.",
    "algorithm.bal.def.sgp": "사람 $i$의 지출, 추가 수령, 추가 부담",
    "algorithm.bal.def.tn": "지출 합계와 인원 수",
    "algorithm.bal.def.m": "배율",
    "algorithm.bal.sign": "$T/N$은 1인당 균등 분담액입니다. $b_i > 0$인 사람은 돈을 받습니다. $b_i < 0$인 사람은 돈을 냅니다.",
    "algorithm.h.round": "3. 센트 단위로 맞추기",
    "algorithm.round.lead": "송금은 센트 단위로만 합니다. 도구는 각 $b_i$를 정수 $c_i$로 바꾸고, 합계를 정확히 0으로 유지합니다.",
    "algorithm.round.1": "각 $b_i$를 $⌊b_i⌋$로 내림합니다. $⌊b_i⌋$는 $b_i$ 이하의 가장 큰 정수입니다. 예: −33⅓은 −34가 됩니다.",
    "algorithm.round.2": "아래 식으로 모자란 센트 수 $k$를 셉니다.",
    "algorithm.round.3": "나머지 $b_i − ⌊b_i⌋$가 가장 큰 $k$명에게 1센트씩 더합니다. 나머지가 같으면 이름이 유니코드 코드 포인트 순서로 앞선 사람이 먼저 받습니다.",
    "algorithm.round.why": "$b_i$의 합은 0이므로 $k$는 나머지의 합입니다. 각 나머지는 0 이상 1 미만입니다. 따라서 $k$는 $0 ≤ k < N$인 정수입니다.",
    "algorithm.round.result": "결과: $c_i$의 합은 정확히 0입니다. 각 $c_i$와 $b_i$의 차이는 1센트 미만입니다. 입력이 같은 두 사람도 잔액이 1센트 다를 수 있습니다.",
    "algorithm.round.roles": "$c_i < 0$인 사람은 송금자입니다. $c_i > 0$인 사람은 수령자입니다. $c_i = 0$인 사람은 탐색에 들어가지 않습니다.",
    "algorithm.h.example": "예시",
    "algorithm.example.lead": "A가 1.00을 지출하고, B와 C는 0을 지출합니다. 배율은 1입니다. 1인당 균등 분담액은 33⅓센트입니다. 표의 값은 모두 센트 단위입니다.",
    "algorithm.example.person": "사람",
    "algorithm.example.after": "내림 값의 합은 −2이므로 $k = 2$입니다. 세 나머지는 모두 ⅔입니다. 이름 순서로 A와 B가 앞서므로 둘이 1센트씩 받습니다. 계획: B → A 0.33, C → A 0.34.",
    "algorithm.h.goal": "4. 가장 좋은 계획의 기준",
    "algorithm.goal.lead": "계획은 송금의 목록입니다. 각 송금은 송금자 한 명이 수령자 한 명에게 보냅니다. 도구는 각 계획에 두 수로 된 점수를 매깁니다.",
    "algorithm.goal.def.c": "송금 횟수. 결과에는 '송금 건수'로 표시됩니다.",
    "algorithm.goal.def.b": "부담 패널티. $U$의 각 송금자는 첫 송금 다음의 송금마다 1을 더합니다. 결과에는 '부담 패널티'로 표시됩니다.",
    "algorithm.goal.def.d": "송금자 $i$가 보내는 송금 횟수",
    "algorithm.goal.def.u": "다중 송금 선호자로 표시되지 않은 송금자",
    "algorithm.goal.order": "도구는 $C$가 가장 작은 계획을 고릅니다. $C$가 같으면 $B$가 가장 작은 계획을 고릅니다. 식의 lexmin은 이 순서를 뜻합니다.",
    "algorithm.goal.strict": "엄격 선호 모드는 규칙을 하나 더합니다. $U$의 각 송금자는 최대 1번 송금합니다. 수령자는 제한이 없습니다. 이 규칙을 지키는 계획이 없으면 결과에 '계획 없음' 오류가 나옵니다.",
    "algorithm.h.search": "5. 계획 탐색",
    "algorithm.search.lead": "탐색은 송금을 하나씩 더해 계획을 만듭니다. 깊이 우선으로 쓸모 있는 다음 송금을 모두 시도하고, 가장 좋은 점수를 남깁니다.",
    "algorithm.search.state": "상태 $S$는 아직 남은 금액을 나타냅니다. 송금자 $i$는 아직 $a_i$를 보내야 합니다. 수령자 $j$는 아직 $r_j$를 받아야 합니다. 각 송금자에게는 표시가 두 개 있습니다: 선호, 그리고 송금함(이미 송금했음).",
    "algorithm.search.move": "이동 한 번은 송금자 $i$가 수령자 $j$에게 $min(a_i, r_j)$를 보내는 것입니다. 이 이동으로 송금자 $i$나 수령자 $j$, 또는 둘 다 정산이 끝납니다. 따라서 이동마다 최소 1명이 빠지고, 탐색은 반드시 끝납니다.",
    "algorithm.search.def.s": "송금자 $i$가 수령자 $j$에게 보낸 뒤의 상태",
    "algorithm.search.def.e": "송금자 $i$가 $U$에 속하고 송금함 표시가 켜져 있으면 1, 아니면 0",
    "algorithm.search.base": "빈 상태 $∅$의 점수는 $(0, 0)$입니다. 이동 뒤의 상태에 가능한 계획이 없으면 그 이동을 건너뜁니다. 엄격 선호 모드에서는 $e_i = 1$인 이동도 모두 건너뜁니다.",
    "algorithm.search.fast.lead": "다음 지름길로 탐색을 빠르게 합니다.",
    "algorithm.search.fast.1": "송금자나 수령자가 1명만 남은 경우: 남은 사람은 모두 그 1명과 연결되어야 합니다. 직접 계산하는 식으로 $C$와 $B$를 구하고, 엄격 규칙도 적용합니다.",
    "algorithm.search.fast.2": "같은 선택: 금액과 두 표시가 모두 같은 송금자는 같은 것으로 봅니다. 금액이 같은 수령자도 같은 것으로 봅니다. 같은 선택은 한 번만 시도합니다.",
    "algorithm.search.fast.3": "기억: 탐색은 푼 상태의 점수를 저장하고 다시 씁니다. 저장 키는 정렬한 송금자 목록과 정렬한 수령자 목록입니다.",
    "algorithm.search.fast.4": "하한: 이동 뒤에 남은 송금자를 $P'$, 남은 수령자를 $R'$라고 합니다. 이들은 각각 송금이 1건 이상 더 필요합니다. 따라서 송금이 최소 $max(|P'|, |R'|)$건 더 필요합니다.",
    "algorithm.search.fast.5": "가지치기: $1 + max(|P'|, |R'|)$가 이 상태에서 지금까지 찾은 가장 작은 $C$보다 크면 그 이동을 건너뜁니다. 같으면 남겨 두므로 $B$로 정할 수 있습니다.",
    "algorithm.search.tie": "두 이동의 점수가 같으면 먼저 찾은 이동을 남깁니다. 순서는 고정입니다: 금액, 그다음 표시, 그다음 이름. 따라서 같은 입력은 항상 같은 계획을 냅니다.",
    "algorithm.h.proof": "6. 이 계획이 최적인 이유",
    "algorithm.proof.lead": "주장: 탐색은 센트 잔액에 대해 가장 작은 점수 $(C, B)$를 돌려줍니다. 계획을 그래프로 그립니다. 사람은 꼭짓점이고, 송금은 변입니다.",
    "algorithm.proof.1": "순환 없애기. 어떤 변들이 순환을 이룬다고 합시다(방향은 무시). 순환의 변에 $+δ$와 $−δ$를 번갈아 더합니다. 순환 위의 각 사람은 $+δ$ 하나와 $−δ$ 하나를 받으므로 잔액이 바뀌지 않습니다.",
    "algorithm.proof.2": "$δ$를 $−δ$ 변의 가장 작은 금액으로 정합니다. 그러면 변 하나 이상이 0이 되어 송금이 줄어듭니다. 어떤 송금자도 송금이 늘지 않으므로 엄격 규칙도 그대로 지켜집니다. 따라서 최적 계획에는 순환이 없습니다. 그 그래프는 숲(forest)입니다.",
    "algorithm.proof.3": "잎 찾기. 변이 하나 이상인 숲에는 잎이 있습니다. 잎은 송금이 정확히 1건인 사람입니다. 그 송금은 잎의 남은 금액 전부를 옮깁니다. 상대의 금액은 그보다 작지 않습니다. 따라서 그 송금은 $min(a_i, r_j)$이고, 탐색이 시도하는 이동(또는 같은 선택)입니다.",
    "algorithm.proof.4": "문제 줄이기. 그 송금을 뺍니다. 나머지 계획은 더 작은 상태 $S_ij$를 정산하고, 점수는 $(C − 1, B − e_i)$입니다. 같은 논리가 $S_ij$에도 적용되므로, 탐색은 거기서 이보다 나쁘지 않은 점수를 찾습니다. 단계마다 최소 1명이 빠지므로 논리는 끝납니다.",
    "algorithm.proof.5": "지름길 확인. 가지치기는 이길 수 없는 이동만 건너뜁니다. 다른 지름길은 정확한 점수를 냅니다. 따라서 탐색은 최적 점수 $(C, B)$를 돌려줍니다.",
    "algorithm.proof.scope": "범위: 송금자가 수령자에게 직접 보내는 계획 중에서, 센트 잔액 $c_i$에 대해 최적입니다. 이 도구는 다른 종류의 계획에 대해서는 주장하지 않습니다. 다른 계획이 같은 점수를 낼 수도 있습니다.",
    "algorithm.h.views": "7. 배율이 있을 때의 두 계획",
    "algorithm.views.1": "$m = 1$이면 계획을 하나 만듭니다.",
    "algorithm.views.2": "$m ≠ 1$이면 계획을 두 개 만듭니다. 배율 적용 정산안은 $m$을 씁니다. 원래 정산안은 $m = 1$을 씁니다.",
    "algorithm.views.3": "각 계획은 따로 계산합니다. 엄격 선호 모드에서는 한 계획이 '계획 없음' 오류를 보이고 다른 계획은 정상으로 보일 수 있습니다.",
    "algorithm.views.4": "반올림 설정은 화면의 숫자만 바꿉니다. 0.01이 아닌 단위는 근삿값을 보여 줍니다. 정확한 송금 금액에는 0.01을 쓰세요.",
    "algorithm.h.limits": "8. 한계",
    "algorithm.lim.1": "실행 시간은 송금자와 수령자 수에 따라 지수적으로 늘 수 있습니다.",
    "algorithm.lim.2": "탐색은 브라우저의 백그라운드 워커에서 실행됩니다. 브라우저가 앱을 캐시한 뒤에는 오프라인에서도 작동합니다.",
    "algorithm.lim.3": "솔버에는 시간 제한도 인원 제한도 없습니다. 긴 탐색은 취소 버튼으로 멈춥니다.",
    "algorithm.lim.4": "취소, 또는 메모리·스택 실패는 '계획 없음' 결과가 아닙니다. 계획이 있는지 없는지를 알려 주지 않습니다.",
    "algorithm.lim.5": "탐색이 끝까지 완료되었을 때만 센트 잔액에 대한 최적 계획을 돌려줍니다.",
    "algorithm.source": "솔버 소스 코드 보기 (JavaScript)"
  },
  "ja": {
    "title.document": "Wire-Min-Splitter (最小送金バラバラ割り勘)",
    "app.title": "Wire-Min-Splitter (最小送金バラバラ割り勘)",
    "app.subtitle": "パーティーの支出と補正値を入力すると、送金回数が最小の精算案を計算します。",
    "button.add_person": "参加者を追加",
    "label.people": "人数",
    "button.apply_count": "人数を適用",
    "label.name_reset": "名前リセット",
    "option.abcd": "ABCD",
    "option.empty": "空欄",
    "option.human_int": "human 01, 02",
    "button.reset_names": "名前をリセット",
    "label.enable_drag": "ドラッグ並び替えを有効化",
    "label.strict_preference": "厳格優先モード",
    "label.multiplier": "倍率",
    "label.number_style": "数値形式",
    "option.comma_period": "1,000.00",
    "option.period_comma": "1.000,00",
    "label.result_rounding_single": "数値の丸め",
    "label.result_rounding_before": "倍率前の丸め",
    "label.result_rounding_after": "倍率後の丸め",
    "table.drag": "ドラッグ",
    "table.name": "名前",
    "table.repeat": "人数",
    "table.spent": "支出",
    "table.extra_pay": "追加負担",
    "table.extra_get": "追加受取",
    "table.preferred_multi": "複数送金の優先者",
    "table.actions": "操作",
    "button.calculate": "精算を計算",
    "button.recalculate": "強制再計算",
    "button.copy_results": "結果をコピー",
    "button.screenshot_results": "スクリーンショット",
    "section.result": "結果",
    "section.net_balances": "純残高",
    "section.transfers": "送金指示",
    "button.remove": "削除",
    "placeholder.name": "名前",
    "title.drag_handle": "ドラッグして並び替え",
    "tooltip.enable_drag": "有効にすると、:: ハンドルをドラッグして参加者の行順を変更できます。",
    "tooltip.strict_preference": "有効時は、優先対象として選んだ支払者だけが複数相手に送金できます。",
    "tooltip.enable_repeat": "人数列の編集を有効化します（入力を速くするため初期状態ではオフ）。",
    "tooltip.enable_extra_pay": "有効にすると、追加負担の列を編集できます。",
    "tooltip.enable_extra_get": "有効にすると、追加受取の列を編集できます。",
    "tooltip.multiplier": "入力金額（支出/追加負担/追加受取）に掛ける値です。通貨換算などに使えます。",
    "tooltip.number_style": "結果の数値で使う小数点と桁区切りの形式を選びます。",
    "tooltip.result_rounding_single": "結果セクションの金額をどの単位で丸めるか選択します。",
    "tooltip.result_rounding_before": "元の金額（倍率適用前）をどの単位で丸めるか選びます。",
    "tooltip.result_rounding_after": "倍率適用後の金額をどの単位で丸めるか選びます。",
    "tooltip.rounding_left": "より大きい単位で丸めます (0.01 -> 0.1 -> 1 -> 10 ...)。",
    "tooltip.rounding_right": "より小さい単位で丸めます (10 -> 1 -> 0.1 -> 0.01 ...)。",
    "tooltip.force_recalculate": "自動更新がうまく動かない場合だけ使う予備ボタンです。",
    "tooltip.copy_results": "結果全体のテキストをクリップボードへコピーします。",
    "tooltip.screenshot_results": "上部入力エリアと結果セクションをまとめて PNG スクリーンショットで保存します。",
    "tooltip.repeat": "この行で表す同一参加者の人数です。",
    "tooltip.preferred_multi": "この人を複数送金の担当（または許可）対象として指定します。",
    "aria.drag_enabled": "行をドラッグして並び替え",
    "aria.drag_disabled": "先にドラッグ並び替えを有効化してください",
    "error.people_count_invalid": "人数は1以上の整数で入力してください。",
    "error.multiplier_invalid": "倍率は 0 より大きい数値で入力してください。",
    "error.add_participant": "名前のある参加者を1人以上追加してください。",
    "error.result_not_ready": "先に結果を計算してください。",
    "error.settlement_failed": "精算計算に失敗しました。",
    "error.network": "ネットワークエラー: {error}",
    "summary.template": "送金件数: {transactions} | 負担ペナルティ: {burdenPenalty}",
    "summary.no_transfers": "送金は不要です。",
    "confirm.reset_names": "入力済みの名前が消去されます。続行しますか？",
    "message.copy_success": "結果をコピーしました。",
    "message.copy_error": "結果のコピーに失敗しました。",
    "message.screenshot_success": "スクリーンショットを保存しました。",
    "message.screenshot_error": "スクリーンショットの作成に失敗しました。",
    "label.original": "元の値",
    "label.multiplied": "倍率適用後",
    "role.payer": "支払者",
    "role.receiver": "受取者",
    "role.settled": "精算済み",
    "button.cancel": "キャンセル",
    "warning.calculating_long": "最小送金回数の探索には時間がかかる場合があります。いつでもキャンセルできます。",
    "warning.calculating_time": "最小送金回数の探索には時間がかかる場合があります ({time})。いつでもキャンセルできます。",
    "message.cancelled": "計算をキャンセルしました。",
    "error.blank_populated_name": "入力値がある行の名前を空にすることはできません。",
    "error.duplicate_name": "参加者名が重複しています: {name}",
    "error.repeat_not_safe_integer": "人数は正の安全な整数で入力してください。",
    "notice.rounding": "注意: 均衡セント単位の配分のため、同じ条件の参加者間で0.01の差が生じる場合があります。",
    "notice.approximate_display": "概算表示専用（正確な送金指示ではなく、合計が一致しない場合があります）。",
    "status.offline": "オフライン",
    "aria.row_name": "{row}行目の名前",
    "aria.row_spent": "{row}行目の支出",
    "aria.row_repeat": "{row}行目の人数",
    "aria.row_extra_pay": "{row}行目の追加負担",
    "aria.row_extra_get": "{row}行目の追加受取",
    "aria.row_preferred": "{row}行目の複数送金優先者",
    "aria.row_remove": "{row}行目の削除",
    "aria.row_drag": "{row}行目のドラッグ並び替え",
    "heading.original_plan": "元の精算案（倍率適用前）",
    "heading.multiplied_plan": "倍率適用後の精算案",
    "error.invalid_amount": "{name}の{field}の金額が正しくありません。",
    "field.spent": "支出",
    "field.extra_pay": "追加負担",
    "field.extra_get": "追加受取",
    "algorithm.title": "アルゴリズムの仕組み",
    "algorithm.intro": "このツールは、送金回数が最も少ない計画を探します。まず、各人の残高をセント単位の整数で計算します。次に、厳密な探索で最良の計画を見つけます。6 節で、この計画が最適であることを証明します。",
    "algorithm.h.input": "1. 入力の確認",
    "algorithm.in.1": "名前は空にできず、互いに異なる必要があります。Unicode NFC で正規化し、前後の空白を削除し、最大 120 コードポイントまで残します。",
    "algorithm.in.2": "すべての金額を正確な分数として読みます。金額の計算に浮動小数点数は使いません。",
    "algorithm.in.3": "支出は 0 以上です。倍率 $m$ は 0 より大きい必要があります。追加受取の合計と追加負担の合計は等しい必要があります。",
    "algorithm.in.4": "人数が $n > 1$ の行は $n$ 人になります。各名前には $n$ と同じ桁数の番号が付きます。例: 人数 12 なら チーム 01 〜 チーム 12 になります。人数が $n = 1$ の行は入力した名前をそのまま使います。",
    "algorithm.h.balance": "2. 残高の計算",
    "algorithm.bal.lead": "まず、各人 $i$ の正確な残高 $b_i$ をセント単位で計算します。",
    "algorithm.bal.def.b": "人 $i$ の正確な残高（セント）。分数になることがあります。",
    "algorithm.bal.def.sgp": "人 $i$ の支出、追加受取、追加負担",
    "algorithm.bal.def.tn": "支出の合計と人数",
    "algorithm.bal.def.m": "倍率",
    "algorithm.bal.sign": "$T/N$ は一人あたりの均等額です。$b_i > 0$ の人はお金を受け取ります。$b_i < 0$ の人はお金を支払います。",
    "algorithm.h.round": "3. セント単位への調整",
    "algorithm.round.lead": "送金はセント単位で行います。各 $b_i$ を整数 $c_i$ に変え、合計を正確に 0 に保ちます。",
    "algorithm.round.1": "各 $b_i$ を $⌊b_i⌋$ に切り下げます。$⌊b_i⌋$ は $b_i$ 以下の最大の整数です。例: −33⅓ は −34 になります。",
    "algorithm.round.2": "下の式で、不足するセント数 $k$ を数えます。",
    "algorithm.round.3": "余り $b_i − ⌊b_i⌋$ が最も大きい $k$ 人に 1 セントずつ加えます。余りが同じ場合は、名前が Unicode コードポイント順で先の人が先に受け取ります。",
    "algorithm.round.why": "$b_i$ の合計は 0 なので、$k$ は余りの合計です。各余りは 0 以上 1 未満です。したがって $k$ は $0 ≤ k < N$ の整数です。",
    "algorithm.round.result": "結果: $c_i$ の合計は正確に 0 です。各 $c_i$ と $b_i$ の差は 1 セント未満です。入力が同じ二人でも、残高が 1 セント異なることがあります。",
    "algorithm.round.roles": "$c_i < 0$ の人は支払者です。$c_i > 0$ の人は受取者です。$c_i = 0$ の人は探索に入りません。",
    "algorithm.h.example": "例",
    "algorithm.example.lead": "A が 1.00 を支出し、B と C の支出は 0 です。倍率は 1 です。一人あたりの均等額は 33⅓ セントです。表の値はすべてセント単位です。",
    "algorithm.example.person": "人",
    "algorithm.example.after": "切り下げた値の合計は −2 なので、$k = 2$ です。3 つの余りはすべて ⅔ です。名前順で A と B が先なので、二人が 1 セントずつ受け取ります。計画: B → A 0.33、C → A 0.34。",
    "algorithm.h.goal": "4. 最良の計画の基準",
    "algorithm.goal.lead": "計画は送金のリストです。各送金は、支払者一人から受取者一人へ送ります。各計画に、2 つの数からなるスコアを付けます。",
    "algorithm.goal.def.c": "送金回数。結果には「送金件数」と表示されます。",
    "algorithm.goal.def.b": "負担ペナルティ。$U$ の各支払者は、最初の送金より後の送金ごとに 1 を加えます。結果には「負担ペナルティ」と表示されます。",
    "algorithm.goal.def.d": "支払者 $i$ が送る送金の回数",
    "algorithm.goal.def.u": "複数送金の優先者に指定されていない支払者",
    "algorithm.goal.order": "$C$ が最小の計画を選びます。$C$ が同じなら、$B$ が最小の計画を選びます。式の lexmin はこの順序を表します。",
    "algorithm.goal.strict": "厳格優先モードでは規則が 1 つ加わります。$U$ の各支払者は最大 1 回だけ送金します。受取者には制限がありません。この規則を満たす計画がない場合、結果は「計画なし」エラーになります。",
    "algorithm.h.search": "5. 計画の探索",
    "algorithm.search.lead": "探索は送金を 1 件ずつ加えて計画を作ります。深さ優先で有用な次の送金をすべて試し、最良のスコアを残します。",
    "algorithm.search.state": "状態 $S$ は、まだ残っている金額を表します。支払者 $i$ はまだ $a_i$ を送る必要があります。受取者 $j$ はまだ $r_j$ を受け取る必要があります。各支払者には 2 つの印があります: 優先と、送金済み（すでに送金した）。",
    "algorithm.search.move": "1 回の移動では、支払者 $i$ が受取者 $j$ に $min(a_i, r_j)$ を送ります。これで支払者 $i$ か受取者 $j$、または両方の精算が終わります。したがって移動ごとに 1 人以上が抜け、探索は必ず終わります。",
    "algorithm.search.def.s": "支払者 $i$ が受取者 $j$ に送った後の状態",
    "algorithm.search.def.e": "支払者 $i$ が $U$ に属し、送金済みの印があれば 1、なければ 0",
    "algorithm.search.base": "空の状態 $∅$ のスコアは $(0, 0)$ です。移動後の状態に有効な計画がなければ、その移動を飛ばします。厳格優先モードでは、$e_i = 1$ の移動もすべて飛ばします。",
    "algorithm.search.fast.lead": "次の近道で探索を速くします。",
    "algorithm.search.fast.1": "支払者か受取者が 1 人だけ残った場合: 残りの人はすべてその 1 人とつながる必要があります。直接の式で $C$ と $B$ を求め、厳格規則も適用します。",
    "algorithm.search.fast.2": "同じ選択: 金額と 2 つの印がすべて同じ支払者は同じとみなします。金額が同じ受取者も同じとみなします。同じ選択は 1 回だけ試します。",
    "algorithm.search.fast.3": "記憶: 解いた状態のスコアを保存して再利用します。キーは、並べ替えた支払者のリストと受取者のリストです。",
    "algorithm.search.fast.4": "下界: 移動後に残る支払者を $P'$、受取者を $R'$ とします。それぞれ少なくとも 1 件の送金がさらに必要です。したがって、送金は少なくとも $max(|P'|, |R'|)$ 件さらに必要です。",
    "algorithm.search.fast.5": "枝刈り: $1 + max(|P'|, |R'|)$ が、この状態でこれまでに見つけた最小の $C$ より大きければ、その移動を飛ばします。等しい場合は残すので、$B$ で決められます。",
    "algorithm.search.tie": "2 つの移動のスコアが同じなら、先に見つけた移動を残します。順序は固定です: 金額、次に印、次に名前。したがって、同じ入力からは常に同じ計画が出ます。",
    "algorithm.h.proof": "6. この計画が最適である理由",
    "algorithm.proof.lead": "主張: 探索は、セント残高に対して最小のスコア $(C, B)$ を返します。計画をグラフとして描きます。人は頂点、送金は辺です。",
    "algorithm.proof.1": "閉路を消す。いくつかの辺が閉路を作るとします（向きは無視します）。閉路の辺に $+δ$ と $−δ$ を交互に加えます。閉路上の各人は $+δ$ と $−δ$ を 1 つずつ受けるので、残高は変わりません。",
    "algorithm.proof.2": "$δ$ を $−δ$ の辺の最小の金額にします。すると 1 本以上の辺が 0 になり、送金が減ります。どの支払者も送金が増えないので、厳格規則も守られます。したがって最適な計画に閉路はありません。そのグラフは森（forest）です。",
    "algorithm.proof.3": "葉を見つける。辺が 1 本以上ある森には葉があります。葉は送金がちょうど 1 件の人です。その送金は葉の残り金額をすべて運びます。相手の金額はそれ以上です。したがってその送金は $min(a_i, r_j)$ で、探索が試す移動（または同じ選択）です。",
    "algorithm.proof.4": "問題を小さくする。その送金を除きます。残りの計画はより小さい状態 $S_ij$ を精算し、スコアは $(C − 1, B − e_i)$ です。同じ議論が $S_ij$ にも当てはまるので、探索はそこでこれ以上悪くないスコアを見つけます。各段階で 1 人以上が抜けるので、議論は終わります。",
    "algorithm.proof.5": "近道を確かめる。枝刈りは勝てない移動だけを飛ばします。ほかの近道は正確なスコアを出します。したがって探索は最適なスコア $(C, B)$ を返します。",
    "algorithm.proof.scope": "範囲: 支払者が受取者へ直接送る計画の中で、セント残高 $c_i$ に対して最適です。このツールは、ほかの種類の計画については何も主張しません。ほかの計画が同じスコアになることもあります。",
    "algorithm.h.views": "7. 倍率があるときの 2 つの計画",
    "algorithm.views.1": "$m = 1$ なら、計画を 1 つ作ります。",
    "algorithm.views.2": "$m ≠ 1$ なら、計画を 2 つ作ります。倍率適用後の精算案は $m$ を使います。元の精算案は $m = 1$ を使います。",
    "algorithm.views.3": "各計画は別々に計算します。厳格優先モードでは、一方の計画が「計画なし」エラーを示し、もう一方が計画を示すことがあります。",
    "algorithm.views.4": "丸めの設定は画面の数値だけを変えます。0.01 以外の単位では近似値を表示します。正確な送金額には 0.01 を使ってください。",
    "algorithm.h.limits": "8. 制限",
    "algorithm.lim.1": "実行時間は、支払者と受取者の数に対して指数的に増えることがあります。",
    "algorithm.lim.2": "探索はブラウザのバックグラウンドワーカーで実行します。ブラウザがアプリをキャッシュした後は、オフラインでも動きます。",
    "algorithm.lim.3": "ソルバーに時間制限や人数制限はありません。長い探索は「キャンセル」で止めます。",
    "algorithm.lim.4": "キャンセル、またはメモリやスタックの失敗は、「計画なし」の結果ではありません。計画が存在するかどうかは示しません。",
    "algorithm.lim.5": "探索が最後まで完了したときだけ、セント残高に対する最適な計画を返します。",
    "algorithm.source": "ソルバーのソースコードを見る (JavaScript)"
  },
  "zh": {
    "title.document": "Wire-Min-Splitter (最少转账AA计算器)",
    "app.title": "Wire-Min-Splitter (最少转账AA计算器)",
    "app.subtitle": "输入聚会支出和调整项，生成转账次数最少的结算方案。",
    "button.add_person": "添加成员",
    "label.people": "人数",
    "button.apply_count": "应用人数",
    "label.name_reset": "姓名重置",
    "option.abcd": "ABCD",
    "option.empty": "清空",
    "option.human_int": "human 01, 02",
    "button.reset_names": "重置姓名",
    "label.enable_drag": "启用拖拽排序",
    "label.strict_preference": "严格偏好模式",
    "label.multiplier": "倍率",
    "label.number_style": "数字格式",
    "option.comma_period": "1,000.00",
    "option.period_comma": "1.000,00",
    "label.result_rounding_single": "数字取整",
    "label.result_rounding_before": "倍数前取整",
    "label.result_rounding_after": "倍数后取整",
    "table.drag": "拖拽",
    "table.name": "姓名",
    "table.repeat": "重复",
    "table.spent": "支出",
    "table.extra_pay": "额外支付",
    "table.extra_get": "额外收取",
    "table.preferred_multi": "多次转账优先者",
    "table.actions": "操作",
    "button.calculate": "计算结算",
    "button.recalculate": "强制重算",
    "button.copy_results": "复制结果",
    "button.screenshot_results": "截图",
    "section.result": "结果",
    "section.net_balances": "净余额",
    "section.transfers": "转账指令",
    "button.remove": "删除",
    "placeholder.name": "姓名",
    "title.drag_handle": "拖拽调整顺序",
    "tooltip.enable_drag": "开启后可拖拽 :: 手柄调整参与者行顺序。",
    "tooltip.strict_preference": "开启后，只有被选为优先者的付款人可以向多名对象转账。",
    "tooltip.enable_repeat": "启用“重复”列编辑（默认关闭以便快速录入）。",
    "tooltip.enable_extra_pay": "开启后可编辑“额外支付”列。",
    "tooltip.enable_extra_get": "开启后可编辑“额外收取”列。",
    "tooltip.multiplier": "用于乘以输入金额（支出/额外支付/额外收取），可用于汇率换算。",
    "tooltip.number_style": "选择结果数字的小数点与千位分隔格式。",
    "tooltip.result_rounding_single": "选择结果区域金额的取整方式。",
    "tooltip.result_rounding_before": "选择原始金额（倍数前）的取整方式。",
    "tooltip.result_rounding_after": "选择倍数后金额的取整方式。",
    "tooltip.rounding_left": "向更大单位取整（0.01 -> 0.1 -> 1 -> 10 ...）。",
    "tooltip.rounding_right": "向更小单位取整（10 -> 1 -> 0.1 -> 0.01 ...）。",
    "tooltip.force_recalculate": "仅在自动刷新结果似乎失效时使用的后备按钮。",
    "tooltip.copy_results": "将完整结果文本复制到剪贴板。",
    "tooltip.screenshot_results": "将上方输入区域和结果区一起保存为 PNG 截图。",
    "tooltip.repeat": "该行代表的相同参与者人数。",
    "tooltip.preferred_multi": "将此人标记为可优先承担多笔对外转账。",
    "aria.drag_enabled": "拖拽行以调整顺序",
    "aria.drag_disabled": "请先启用拖拽排序",
    "error.people_count_invalid": "人数必须是大于等于 1 的整数。",
    "error.multiplier_invalid": "倍率必须是大于 0 的数字。",
    "error.add_participant": "请至少添加一名有姓名的参与者。",
    "error.result_not_ready": "请先计算结果。",
    "error.settlement_failed": "结算失败。",
    "error.network": "网络错误: {error}",
    "summary.template": "转账笔数: {transactions} | 负担惩罚: {burdenPenalty}",
    "summary.no_transfers": "无需转账。",
    "confirm.reset_names": "此操作会清除你输入的姓名。是否继续？",
    "message.copy_success": "结果已复制。",
    "message.copy_error": "复制结果失败。",
    "message.screenshot_success": "截图已保存。",
    "message.screenshot_error": "生成截图失败。",
    "label.original": "原始值",
    "label.multiplied": "倍数后",
    "role.payer": "付款方",
    "role.receiver": "收款方",
    "role.settled": "已结清",
    "button.cancel": "取消",
    "warning.calculating_long": "寻找最少转账次数可能需要较长时间。您可以随时取消。",
    "warning.calculating_time": "寻找最少转账次数可能需要较长时间 ({time})。您可以随时取消。",
    "message.cancelled": "计算已取消。",
    "error.blank_populated_name": "已有输入内容的行，姓名不能为空。",
    "error.duplicate_name": "参与者姓名重复: {name}",
    "error.repeat_not_safe_integer": "重复人数必须为正安全整数。",
    "notice.rounding": "注意：由于采用均衡分（cent）分配方式，相同条件的参与者之间可能会有0.01的差异。",
    "notice.approximate_display": "仅供近似展示（非精确转账指令，总额可能不守恒）。",
    "status.offline": "离线",
    "aria.row_name": "第 {row} 行姓名",
    "aria.row_spent": "第 {row} 行支出",
    "aria.row_repeat": "第 {row} 行重复",
    "aria.row_extra_pay": "第 {row} 行额外支付",
    "aria.row_extra_get": "第 {row} 行额外收取",
    "aria.row_preferred": "第 {row} 行多次转账优先者",
    "aria.row_remove": "第 {row} 行删除",
    "aria.row_drag": "第 {row} 行拖拽排序",
    "heading.original_plan": "原始结算方案（倍数前）",
    "heading.multiplied_plan": "倍数结算方案（倍数后）",
    "error.invalid_amount": "{name} 的 {field} 金额无效。",
    "field.spent": "支出",
    "field.extra_pay": "额外支付",
    "field.extra_get": "额外收取",
    "algorithm.title": "算法如何工作",
    "algorithm.intro": "本工具寻找转账次数最少的方案。首先，它把每个人的余额计算为以分为单位的整数。然后，它用精确搜索找到最佳方案。第 6 节证明该方案最优。",
    "algorithm.h.input": "1. 检查输入",
    "algorithm.in.1": "姓名不能为空，且必须互不相同。工具先做 Unicode NFC 规范化，再删除首尾空白，最多保留 120 个码位。",
    "algorithm.in.2": "工具把每个金额读作精确分数。金额计算不使用浮点数。",
    "algorithm.in.3": "支出必须大于或等于 0。倍率 $m$ 必须大于 0。额外收取的总额必须等于额外支付的总额。",
    "algorithm.in.4": "重复为 $n > 1$ 的行会变成 $n$ 个人。每个姓名后加上与 $n$ 位数相同的编号。例如，重复 12 得到 团队 01 到 团队 12。重复为 $n = 1$ 的行保留输入的姓名。",
    "algorithm.h.balance": "2. 计算余额",
    "algorithm.bal.lead": "工具先以分为单位计算每个人 $i$ 的精确余额 $b_i$：",
    "algorithm.bal.def.b": "第 $i$ 个人的精确余额（分），可以是分数",
    "algorithm.bal.def.sgp": "第 $i$ 个人的支出、额外收取和额外支付",
    "algorithm.bal.def.tn": "支出总额和人数",
    "algorithm.bal.def.m": "倍率",
    "algorithm.bal.sign": "$T/N$ 是每人平均承担的支出。$b_i > 0$ 的人收款。$b_i < 0$ 的人付款。",
    "algorithm.h.round": "3. 取整到分",
    "algorithm.round.lead": "转账只以整分进行。工具把每个 $b_i$ 变为整数 $c_i$，并保持总和恰好为 0：",
    "algorithm.round.1": "把每个 $b_i$ 向下取整为 $⌊b_i⌋$，即不大于 $b_i$ 的最大整数。例如，−33⅓ 变为 −34。",
    "algorithm.round.2": "用下面的公式计算缺少的金额 $k$（单位：分）。",
    "algorithm.round.3": "给余数 $b_i − ⌊b_i⌋$ 最大的 $k$ 个人各加 1 分。余数相同时，姓名按 Unicode 码位顺序靠前的人先得到。",
    "algorithm.round.why": "所有 $b_i$ 之和为 0，所以 $k$ 等于余数之和。每个余数大于或等于 0 且小于 1。因此 $k$ 是满足 $0 ≤ k < N$ 的整数。",
    "algorithm.round.result": "结果：所有 $c_i$ 之和恰好为 0。每个 $c_i$ 与 $b_i$ 相差不到 1 分。输入相同的两个人，余额也可能相差 1 分。",
    "algorithm.round.roles": "$c_i < 0$ 的人是付款方。$c_i > 0$ 的人是收款方。$c_i = 0$ 的人不参加搜索。",
    "algorithm.h.example": "示例",
    "algorithm.example.lead": "A 支出 1.00，B 和 C 支出 0，倍率为 1。每人平均承担 33⅓ 分。表中所有数值都以分为单位。",
    "algorithm.example.person": "人",
    "algorithm.example.after": "向下取整后的和为 −2，所以 $k = 2$。三个余数都是 ⅔。按姓名顺序 A 和 B 在前，所以两人各得 1 分。方案：B → A 0.33，C → A 0.34。",
    "algorithm.h.goal": "4. 最佳方案的标准",
    "algorithm.goal.lead": "方案是一组转账。每笔转账由一个付款方转给一个收款方。工具用两个数给每个方案评分：",
    "algorithm.goal.def.c": "转账次数。结果中显示为“转账笔数”。",
    "algorithm.goal.def.b": "负担惩罚。$U$ 中的每个付款方，第一笔之后的每笔转账加 1。结果中显示为“负担惩罚”。",
    "algorithm.goal.def.d": "付款方 $i$ 发出的转账次数",
    "algorithm.goal.def.u": "未标记为多次转账优先者的付款方",
    "algorithm.goal.order": "工具选择 $C$ 最小的方案。$C$ 相同时，选择 $B$ 最小的方案。公式中的 lexmin 表示这种顺序。",
    "algorithm.goal.strict": "严格偏好模式增加一条规则：$U$ 中的每个付款方最多转账 1 次。收款方没有限制。如果没有方案满足此规则，结果会显示“无方案”错误。",
    "algorithm.h.search": "5. 搜索方案",
    "algorithm.search.lead": "搜索一次添加一笔转账来构建方案。它以深度优先方式尝试所有有用的下一笔转账，并保留最佳评分。",
    "algorithm.search.state": "状态 $S$ 表示尚未结清的部分。付款方 $i$ 还需付出 $a_i$。收款方 $j$ 还需收到 $r_j$。每个付款方还有两个标记：优先，以及已转账（已经转过一笔）。",
    "algorithm.search.move": "一步操作是付款方 $i$ 向收款方 $j$ 转账 $min(a_i, r_j)$。这会结清付款方 $i$、收款方 $j$ 或两者。所以每一步至少移除 1 个人，搜索一定会结束。",
    "algorithm.search.def.s": "付款方 $i$ 向收款方 $j$ 转账后的状态",
    "algorithm.search.def.e": "若付款方 $i$ 属于 $U$ 且有已转账标记，则为 1，否则为 0",
    "algorithm.search.base": "空状态 $∅$ 的评分为 $(0, 0)$。如果一步操作后的状态没有可行方案，搜索就跳过该操作。在严格偏好模式下，搜索还跳过所有 $e_i = 1$ 的操作。",
    "algorithm.search.fast.lead": "以下捷径可以加快搜索：",
    "algorithm.search.fast.1": "只剩 1 个付款方或 1 个收款方：其余每个人都必须与这 1 个人相连。直接公式给出 $C$ 和 $B$，并执行严格规则。",
    "algorithm.search.fast.2": "相同选择：金额和两个标记都相同的付款方视为相同。金额相同的收款方视为相同。相同的选择只尝试一次。",
    "algorithm.search.fast.3": "记忆：搜索保存每个已解状态的评分并重复使用。键是排序后的付款方列表和收款方列表。",
    "algorithm.search.fast.4": "下界：设 $P'$ 和 $R'$ 为一步操作后尚未结清的付款方和收款方。他们每人至少还需要 1 笔转账。所以至少还需要 $max(|P'|, |R'|)$ 笔转账。",
    "algorithm.search.fast.5": "剪枝：如果 $1 + max(|P'|, |R'|)$ 大于此状态下目前找到的最小 $C$，搜索就跳过该操作。相等时保留，因此仍可由 $B$ 决定。",
    "algorithm.search.tie": "如果两步操作的评分相同，搜索保留先找到的那一步。顺序是固定的：先金额，再标记，再姓名。所以相同的输入总是得到相同的方案。",
    "algorithm.h.proof": "6. 为什么该方案最优",
    "algorithm.proof.lead": "命题：搜索返回分余额下最小的评分 $(C, B)$。把方案画成图：每个人是一个顶点，每笔转账是一条边。",
    "algorithm.proof.1": "去掉环。假设某些边构成一个环（忽略方向）。在环上的边交替加上 $+δ$ 和 $−δ$。环上每个人各得到一个 $+δ$ 和一个 $−δ$，所以余额不变。",
    "algorithm.proof.2": "令 $δ$ 等于 $−δ$ 边上的最小金额。这样至少有一条边变为 0，转账笔数减少。没有付款方的转账次数增加，所以严格规则仍然成立。因此最优方案没有环。它的图是森林。",
    "algorithm.proof.3": "找到叶子。至少有一条边的森林一定有叶子：只有 1 笔转账的人。这笔转账转移了叶子剩余的全部金额。对方的金额不小于它。所以这笔转账等于 $min(a_i, r_j)$，是搜索会尝试的一步（或相同选择）。",
    "algorithm.proof.4": "缩小问题。去掉这笔转账。其余方案结清更小的状态 $S_ij$，评分为 $(C − 1, B − e_i)$。同样的论证适用于 $S_ij$，所以搜索在那里找到的评分不会更差。每一轮至少移除 1 个人，所以论证会结束。",
    "algorithm.proof.5": "检查捷径。剪枝只跳过不可能更好的操作。其他捷径给出精确评分。所以搜索返回最优评分 $(C, B)$。",
    "algorithm.proof.scope": "范围：在每笔转账都由付款方直接转给收款方的方案中，该方案对分余额 $c_i$ 最优。本工具不对其他类型的方案作任何声明。其他方案也可能得到相同的评分。",
    "algorithm.h.views": "7. 有倍率时的两个方案",
    "algorithm.views.1": "如果 $m = 1$，工具生成一个方案。",
    "algorithm.views.2": "如果 $m ≠ 1$，工具生成两个方案。倍数结算方案使用 $m$。原始结算方案使用 $m = 1$。",
    "algorithm.views.3": "工具分别计算每个方案。在严格偏好模式下，一个方案可能显示“无方案”错误，而另一个方案正常显示。",
    "algorithm.views.4": "取整设置只改变屏幕上的数字。0.01 以外的单位显示近似值。需要精确付款指令时，请使用 0.01。",
    "algorithm.h.limits": "8. 限制",
    "algorithm.lim.1": "运行时间可能随付款方和收款方的数量呈指数增长。",
    "algorithm.lim.2": "搜索在浏览器的后台 Worker 中运行。浏览器缓存应用后，可离线使用。",
    "algorithm.lim.3": "求解器没有时间限制，也没有人数限制。用“取消”停止长时间的搜索。",
    "algorithm.lim.4": "取消、内存不足或栈溢出都不是“无方案”结果。它们不能说明方案是否存在。",
    "algorithm.lim.5": "只有搜索完整结束时，才返回分余额下的最优方案。",
    "algorithm.source": "查看求解器源代码（JavaScript）"
  }
};

const NAME_MODE_OPTION_KEYS = {
  abcd: "option.abcd",
  empty: "option.empty",
  human_int: "option.human_int",
};

let currentLanguage = DEFAULT_LANGUAGE;
let lastResultData = null;
let draggedRow = null;
let activeHandle = null;
let pointerDragActive = false;
let dragStartIndex = -1;
let hasUserEditedInputs = false;
let suppressDirtyTracking = false;
let lastAppliedNameMode = nameResetModeSelect ? nameResetModeSelect.value : "abcd";
let autoCalculateTimer = null;
let requestSequence = 0;
let activeRequestId = 0;
let beforeRoundingDigits = DEFAULT_ROUNDING_DIGITS;
let afterRoundingDigits = DEFAULT_ROUNDING_DIGITS;
let numberStyle = DEFAULT_NUMBER_STYLE;
let lastUsedMultiplier = "1";
let resultFeedbackTimer = null;

// Worker and calculation tracking
let activeWorker = null;
let calculatingStartTime = null;
let calculatingTimer = null;

function rowList() {
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll("tr"));
}

function t(key, variables = {}) {
  const fallbackTable = TRANSLATIONS[DEFAULT_LANGUAGE] || {};
  const table = TRANSLATIONS[currentLanguage] || fallbackTable;
  let text = table[key] ?? fallbackTable[key] ?? key;

  for (const [name, value] of Object.entries(variables)) {
    text = text.split("{" + name + "}").join(String(value));
  }

  return text;
}

function detectInitialLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && TRANSLATIONS[stored]) {
      return stored;
    }
  } catch (error) {
    // Ignore localStorage read failures.
  }

  const browserLanguage = (navigator.language || "").toLowerCase();
  if (browserLanguage.startsWith("ko")) return "ko";
  if (browserLanguage.startsWith("ja")) return "ja";
  if (browserLanguage.startsWith("zh")) return "zh";

  return DEFAULT_LANGUAGE;
}

function saveLanguage(language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    // Ignore localStorage write failures.
  }
}

function normalizeNumberStyle(style) {
  if (style === "period_comma") return "period_comma";
  return "comma_period";
}

function detectInitialNumberStyle() {
  try {
    const stored = localStorage.getItem(NUMBER_STYLE_STORAGE_KEY);
    if (stored) {
      return normalizeNumberStyle(stored);
    }
  } catch (error) {
    // Ignore localStorage read failures.
  }

  return DEFAULT_NUMBER_STYLE;
}

function saveNumberStyle(style) {
  try {
    localStorage.setItem(NUMBER_STYLE_STORAGE_KEY, style);
  } catch (error) {
    // Ignore localStorage write failures.
  }
}

function syncPeopleCountInput() {
  if (peopleCountInput) {
    peopleCountInput.value = String(rowList().length);
  }
}

function markDirty() {
  if (suppressDirtyTracking) {
    return;
  }
  hasUserEditedInputs = true;
}

function toAlphabeticLabel(index) {
  let value = index;
  let label = "";

  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return label;
}

function buildNameFromMode(mode, index) {
  if (mode === "empty") return "";
  if (mode === "human_int") {
    return "human " + String(index + 1).padStart(2, "0");
  }
  return toAlphabeticLabel(index);
}

function parseRepeatCount(value) {
  const trimmed = String(value).trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

function withMaxLength(value, maxLength) {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

function confirmNameResetIfNeeded() {
  if (!hasUserEditedInputs) {
    return true;
  }
  return window.confirm(t("confirm.reset_names"));
}

function updateSelectOptionLabels() {
  if (!nameResetModeSelect) return;
  for (const [mode, key] of Object.entries(NAME_MODE_OPTION_KEYS)) {
    const option = nameResetModeSelect.querySelector('option[value="' + mode + '"]');
    if (option) {
      option.textContent = t(key);
    }
  }
}

function updateAllRowAriaLabels() {
  const rows = rowList();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const nameInput = row.querySelector(".name");
    const repeatInput = row.querySelector(".repeat");
    const spentInput = row.querySelector(".spent");
    const extraPayInput = row.querySelector(".extra-pay");
    const extraGetInput = row.querySelector(".extra-get");
    const preferredInput = row.querySelector(".preferred");
    const removeBtn = row.querySelector(".remove");
    const dragBtn = row.querySelector(".drag-handle");

    if (nameInput) nameInput.setAttribute("aria-label", t("aria.row_name", { row: rowNum }));
    if (repeatInput) repeatInput.setAttribute("aria-label", t("aria.row_repeat", { row: rowNum }));
    if (spentInput) spentInput.setAttribute("aria-label", t("aria.row_spent", { row: rowNum }));
    if (extraPayInput) extraPayInput.setAttribute("aria-label", t("aria.row_extra_pay", { row: rowNum }));
    if (extraGetInput) extraGetInput.setAttribute("aria-label", t("aria.row_extra_get", { row: rowNum }));
    if (preferredInput) preferredInput.setAttribute("aria-label", t("aria.row_preferred", { row: rowNum }));
    if (removeBtn) removeBtn.setAttribute("aria-label", t("aria.row_remove", { row: rowNum }));
    if (dragBtn) dragBtn.setAttribute("aria-label", t("aria.row_drag", { row: rowNum }));
  }
}

function localizeRow(row) {
  const nameInput = row.querySelector(".name");
  const removeButton = row.querySelector(".remove");
  const handle = row.querySelector(".drag-handle");
  const preferredCheckbox = row.querySelector(".preferred");

  if (nameInput) nameInput.placeholder = t("placeholder.name");
  if (removeButton) removeButton.textContent = t("button.remove");
  if (handle) handle.title = t("title.drag_handle");
  if (preferredCheckbox) preferredCheckbox.title = t("tooltip.preferred_multi");
}

function roleLabel(role) {
  if (role === "payer") return t("role.payer");
  if (role === "receiver") return t("role.receiver");
  return t("role.settled");
}

// ==========================================
// BigInt Decimal Arithmetic & Exact Formatting
// ==========================================

function parseDecimalScientific(str) {
  const trimmed = String(str).trim();
  const match = trimmed.match(/^([+-])?(\d*\.?\d+|\d+\.?\d*)(?:[eE]([+-]?\d+))?$/);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  const coeff = match[2];
  const exp = match[3] ? Number.parseInt(match[3], 10) : 0;
  if (!Number.isSafeInteger(exp)) return null;

  const [intPartRaw = "", fracPartRaw = ""] = coeff.split(".");
  const intPart = intPartRaw.replace(/^0+/, "") || "0";
  const fracPart = fracPartRaw.replace(/0+$/, "");
  const isZero = intPart === "0" && fracPart === "";

  return { sign, intPart, fracPart, exp, isZero, rawCoeff: coeff };
}

function isValidDecimalString(value) {
  return parseDecimalScientific(value) !== null;
}

function isPositiveDecimal(value) {
  const parsed = parseDecimalScientific(value);
  if (!parsed) return false;
  if (parsed.sign < 0) return false;
  return !parsed.isZero;
}

function decimalToBigIntCents(str) {
  const parsed = parseDecimalScientific(str);
  if (!parsed || parsed.isZero) return 0n;

  const coeffDigits = (parsed.intPart === "0" ? "" : parsed.intPart) + parsed.fracPart;
  if (!coeffDigits) return 0n;

  const fracPlaces = parsed.fracPart.length - parsed.exp;

  let centsBig;
  if (fracPlaces <= 0) {
    const zeros = -fracPlaces + 2;
    centsBig = BigInt(coeffDigits + "0".repeat(zeros));
  } else if (fracPlaces === 1) {
    centsBig = BigInt(coeffDigits + "0");
  } else if (fracPlaces === 2) {
    centsBig = BigInt(coeffDigits);
  } else {
    const cut = fracPlaces - 2;
    const big = BigInt(coeffDigits);
    const divisor = 10n ** BigInt(cut);
    const half = divisor / 2n;
    const rem = big % divisor;
    centsBig = big / divisor + (rem >= half ? 1n : 0n);
  }

  return parsed.sign < 0 ? -centsBig : centsBig;
}

function formatBigIntDecimal(scaledBigInt, scale = 2, style = "comma_period") {
  const isNegative = scaledBigInt < 0n;
  const absVal = isNegative ? -scaledBigInt : scaledBigInt;
  const thousandSep = style === "period_comma" ? "." : ",";
  const decimalSep = style === "period_comma" ? "," : ".";

  if (scale <= 0) {
    const intStr = absVal.toString();
    const grouped = intStr.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
    return (isNegative ? "-" : "") + grouped;
  }

  const divisor = 10n ** BigInt(scale);
  const intPart = (absVal / divisor).toString();
  const fracPart = (absVal % divisor).toString().padStart(scale, "0");
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  return (isNegative ? "-" : "") + groupedInt + decimalSep + fracPart;
}

function roundBigIntCents(centsBigInt, targetDigits) {
  if (targetDigits === 2) {
    return centsBigInt;
  }
  if (targetDigits > 2) {
    const scaleUp = 10n ** BigInt(targetDigits - 2);
    return centsBigInt * scaleUp;
  }
  const factor = 10n ** BigInt(2 - targetDigits);
  const half = factor / 2n;
  const isNeg = centsBigInt < 0n;
  const absVal = isNeg ? -centsBigInt : centsBigInt;
  let q = absVal / factor;
  const rem = absVal % factor;
  if (rem >= half) {
    q += 1n;
  }
  return isNeg ? -q : q;
}

function formatRoundedAmountBigInt(roundedVal, digits) {
  if (digits >= 0) {
    return formatBigIntDecimal(roundedVal, digits, numberStyle);
  }
  const integerVal = roundedVal * (10n ** BigInt(-digits));
  return formatBigIntDecimal(integerVal, 0, numberStyle);
}

function formatRoundingUnit(digits) {
  if (digits >= 0) {
    const frac = digits === 0 ? "1" : "0." + "0".repeat(digits - 1) + "1";
    return frac;
  }
  return "1" + "0".repeat(-digits);
}

function refreshRoundingControls() {
  if (!beforeRoundingDisplay) return;
  beforeRoundingDisplay.textContent = formatRoundingUnit(beforeRoundingDigits);
  beforeRoundingLeftButton.disabled = beforeRoundingDigits <= MIN_ROUNDING_DIGITS;
  beforeRoundingRightButton.disabled = beforeRoundingDigits >= MAX_ROUNDING_DIGITS;
  afterRoundingDisplay.textContent = formatRoundingUnit(afterRoundingDigits);
  afterRoundingLeftButton.disabled = afterRoundingDigits <= MIN_ROUNDING_DIGITS;
  afterRoundingRightButton.disabled = afterRoundingDigits >= MAX_ROUNDING_DIGITS;
  refreshSpentStep();
}

function isMultiplierOne(valStr) {
  const parsed = parseDecimalScientific(valStr);
  if (!parsed || parsed.sign < 0 || parsed.isZero) return false;

  const [intPartRaw = "", fracPartRaw = ""] = parsed.rawCoeff.split(".");
  const allDigits = intPartRaw + fracPartRaw;
  const nonZeroMatch = allDigits.match(/[1-9]/g);
  if (!nonZeroMatch || nonZeroMatch.length !== 1 || nonZeroMatch[0] !== "1") {
    return false;
  }

  let distanceToDecimal;
  const intIdx = intPartRaw.indexOf("1");
  if (intIdx !== -1) {
    distanceToDecimal = intPartRaw.length - 1 - intIdx;
  } else {
    const fracIdx = fracPartRaw.indexOf("1");
    distanceToDecimal = -(fracIdx + 1);
  }

  return distanceToDecimal + parsed.exp === 0;
}

function spentStepDigits() {
  const mult = multiplierInput ? multiplierInput.value.trim() : "1";
  if (isMultiplierOne(mult)) {
    return afterRoundingDigits;
  }
  return beforeRoundingDigits;
}

function refreshSpentStep() {
  const stepValue = formatRoundingUnit(spentStepDigits());
  for (const row of rowList()) {
    const spentEl = row.querySelector(".spent");
    if (spentEl) spentEl.step = stepValue;
  }
}

function refreshRoundingModeUI() {
  if (!beforeRoundingGroup) return;
  const mult = multiplierInput ? multiplierInput.value.trim() : "1";
  const singleMode = isMultiplierOne(mult);
  beforeRoundingGroup.classList.toggle("hidden", singleMode);
  refreshSpentStep();

  if (singleMode) {
    afterRoundingLabel.textContent = t("label.result_rounding_single");
    afterRoundingGroup.title = t("tooltip.result_rounding_single");
    return;
  }

  beforeRoundingLabel.textContent = t("label.result_rounding_before");
  afterRoundingLabel.textContent = t("label.result_rounding_after");
  beforeRoundingGroup.title = t("tooltip.result_rounding_before");
  afterRoundingGroup.title = t("tooltip.result_rounding_after");
}

const MATHML_NS = "http://www.w3.org/1998/Math/MathML";
const MATH_FENCES = { "(": ")", "⌊": "⌋", "|": "|" };
const MATH_TOKEN_RE = /[A-Za-z]{2,}|[A-Za-zα-ω∅]|\d+|_[A-Za-z0-9]+|\S/gu;

function mathElement(tag, content) {
  const element = document.createElementNS(MATHML_NS, tag);
  if (content !== undefined) element.textContent = content;
  return element;
}

// Inline brackets keep their text size, as in TeX inline math.
function mathFence(token) {
  const fence = mathElement("mo", token);
  fence.setAttribute("stretchy", "false");
  return fence;
}

// Build inline MathML for a short formula such as "min(a_i, r_j)". Supported:
// letters, numbers, operators, "_" subscripts, "'" primes, and (), ⌊⌋, || groups.
function inlineMath(source) {
  const groups = [{ row: mathElement("mrow"), close: null }];
  for (const token of source.match(MATH_TOKEN_RE) || []) {
    const group = groups[groups.length - 1];
    const previous = group.row.lastChild;
    if (token.length > 1 && token[0] === "_" && previous) {
      const script = mathElement("mrow");
      for (const char of token.slice(1)) script.append(mathElement(/\d/.test(char) ? "mn" : "mi", char));
      const node = mathElement("msub");
      node.append(previous, script);
      group.row.append(node);
    } else if (token === "'") {
      const prime = mathElement("mo", "′");
      prime.setAttribute("lspace", "0");
      prime.setAttribute("rspace", "0");
      group.row.append(prime);
    } else if (/^\d/.test(token)) {
      group.row.append(mathElement("mn", token));
    } else if (/^[A-Za-zα-ω∅]/u.test(token)) {
      group.row.append(mathElement("mi", token));
    } else if (token === group.close) {
      group.row.append(mathFence(token));
      groups.pop();
      groups[groups.length - 1].row.append(group.row);
    } else if (MATH_FENCES[token]) {
      const row = mathElement("mrow");
      row.append(mathFence(token));
      groups.push({ row, close: MATH_FENCES[token] });
    } else {
      group.row.append(mathElement("mo", token === "-" ? "−" : token));
    }
  }
  while (groups.length > 1) {
    const group = groups.pop();
    groups[groups.length - 1].row.append(group.row);
  }
  const math = mathElement("math");
  math.append(groups[0].row);
  return math;
}

// Show translated text. Each $...$ part becomes inline math.
function setMathText(element, text) {
  const parts = text.split("$");
  element.replaceChildren(...parts.map((part, index) => (index % 2 === 1 ? inlineMath(part) : part)));
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.title = t("title.document");

  for (const element of document.querySelectorAll("[data-i18n]")) {
    const key = element.dataset.i18n;
    element.textContent = t(key);
  }

  for (const element of document.querySelectorAll("[data-i18n-math]")) {
    setMathText(element, t(element.dataset.i18nMath));
  }

  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    const key = element.dataset.i18nPlaceholder;
    element.placeholder = t(key);
  }

  for (const element of document.querySelectorAll("[data-i18n-title]")) {
    const key = element.dataset.i18nTitle;
    element.title = t(key);
  }

  updateSelectOptionLabels();
  refreshRoundingControls();
  refreshRoundingModeUI();
  updateAllRowAriaLabels();

  for (const row of rowList()) {
    localizeRow(row);
  }

  for (const button of languageButtons) {
    const isActive = button.dataset.lang === currentLanguage;
    button.classList.toggle("active", isActive);
  }

  refreshDragState();
  if (lastResultData) {
    renderResult(lastResultData);
  }
}

function setNumberStyle(style, options = {}) {
  const { persist = true, rerender = true } = options;
  numberStyle = normalizeNumberStyle(style);
  if (numberStyleSelect) numberStyleSelect.value = numberStyle;
  if (persist) {
    saveNumberStyle(numberStyle);
  }
  if (rerender && lastResultData) {
    renderResult(lastResultData);
  }
}

function setLanguage(language, options = {}) {
  const { persist = true } = options;
  if (!TRANSLATIONS[language]) {
    return;
  }

  currentLanguage = language;
  if (persist) {
    saveLanguage(language);
  }
  applyLanguage();
}

function resetNames(mode, options = {}) {
  const { skipWarning = false } = options;
  if (!skipWarning && !confirmNameResetIfNeeded()) {
    return false;
  }

  suppressDirtyTracking = true;
  for (const [index, row] of rowList().entries()) {
    row.querySelector(".name").value = buildNameFromMode(mode, index);
  }
  suppressDirtyTracking = false;

  lastAppliedNameMode = mode;
  updateAllRowAriaLabels();
  return true;
}

function setParticipantCount(targetCount) {
  const currentRows = rowList();
  const currentCount = currentRows.length;

  if (targetCount === currentCount) {
    syncPeopleCountInput();
    return;
  }

  if (targetCount > currentCount) {
    for (let index = currentCount; index < targetCount; index += 1) {
      addRow({
        name: buildNameFromMode(nameResetModeSelect.value, index),
        spent: "0",
        extraPay: "0",
        extraGet: "0",
      });
    }
    updateAllRowAriaLabels();
    return;
  }

  for (let index = currentCount - 1; index >= targetCount; index -= 1) {
    const row = currentRows[index];
    if (draggedRow === row) {
      endPointerDrag();
    }
    row.remove();
  }

  syncPeopleCountInput();
  updateAllRowAriaLabels();
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
  setResultToolsEnabled(false);
}

function clearResultToolsFeedback() {
  if (resultFeedbackTimer) {
    clearTimeout(resultFeedbackTimer);
    resultFeedbackTimer = null;
  }
  if (resultToolsFeedbackEl) {
    resultToolsFeedbackEl.textContent = "";
    resultToolsFeedbackEl.classList.add("hidden");
    resultToolsFeedbackEl.classList.remove("error");
  }
}

function showResultToolsFeedback(key, options = {}) {
  const { error = false } = options;
  if (resultFeedbackTimer) {
    clearTimeout(resultFeedbackTimer);
    resultFeedbackTimer = null;
  }

  if (resultToolsFeedbackEl) {
    resultToolsFeedbackEl.textContent = t(key);
    resultToolsFeedbackEl.classList.remove("hidden");
    resultToolsFeedbackEl.classList.toggle("error", error);
    resultFeedbackTimer = window.setTimeout(() => {
      clearResultToolsFeedback();
    }, 2200);
  }
}

function setResultToolsEnabled(enabled) {
  if (copyResultsButton) copyResultsButton.disabled = !enabled;
  if (screenshotResultsButton) screenshotResultsButton.disabled = false;
}

function hideResultAndError() {
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }
  if (resultEl) {
    resultEl.classList.add("hidden");
  }
  lastResultData = null;
  lastUsedMultiplier = "1";
  setResultToolsEnabled(false);
  clearResultToolsFeedback();
}

function showCalculatingIndicator() {
  if (!calculatingIndicatorEl) return;
  calculatingStartTime = Date.now();
  updateCalculatingTimeDisplay();
  calculatingIndicatorEl.classList.remove("hidden");

  if (calculatingTimer) clearInterval(calculatingTimer);
  calculatingTimer = setInterval(() => {
    updateCalculatingTimeDisplay();
  }, 1000);
}

function hideCalculatingIndicator() {
  if (calculatingTimer) {
    clearInterval(calculatingTimer);
    calculatingTimer = null;
  }
  calculatingStartTime = null;
  if (calculatingTimerEl) {
    calculatingTimerEl.textContent = "";
  }
  if (calculatingIndicatorEl) {
    calculatingIndicatorEl.classList.add("hidden");
  }
}

function updateCalculatingTimeDisplay() {
  if (!calculatingTimerEl || !calculatingStartTime) return;
  const elapsedSec = Math.floor((Date.now() - calculatingStartTime) / 1000);
  calculatingTimerEl.textContent = elapsedSec > 0 ? " (" + elapsedSec + "s)" : "";
}

function terminateActiveWorker() {
  if (activeWorker) {
    try {
      activeWorker.terminate();
    } catch (e) {
      // Ignore
    }
    activeWorker = null;
  }
  hideCalculatingIndicator();
}

function cancelCalculation() {
  terminateActiveWorker();
  activeRequestId = ++requestSequence;
  hideResultAndError();
  showError(t("message.cancelled"));
}

function applyParticipantCountFromInput() {
  const parsedCount = parseRepeatCount(peopleCountInput.value);
  if (parsedCount === null) {
    showError(t("error.people_count_invalid"));
    return;
  }

  const currentCount = rowList().length;
  if (parsedCount !== currentCount) {
    markDirty();
  }
  setParticipantCount(parsedCount);
  if (errorEl) errorEl.classList.add("hidden");
  scheduleAutoCalculate({ immediate: true });
}

function clearDropIndicators() {
  for (const row of rowList()) {
    row.classList.remove("drop-before", "drop-after");
  }
}

function endPointerDrag() {
  if (draggedRow) {
    draggedRow.classList.remove("dragging");
  }
  if (activeHandle) {
    activeHandle.classList.remove("dragging-handle");
  }
  draggedRow = null;
  activeHandle = null;
  pointerDragActive = false;
  clearDropIndicators();
}

function moveRowAtPointer(clientX, clientY) {
  if (!draggedRow) return;

  const element = document.elementFromPoint(clientX, clientY);
  const targetRow = element ? element.closest("#participants tbody tr") : null;
  clearDropIndicators();

  if (!targetRow || targetRow === draggedRow) return;

  const rect = targetRow.getBoundingClientRect();
  const placeAfter = clientY > rect.top + rect.height / 2;
  targetRow.classList.add(placeAfter ? "drop-after" : "drop-before");
  if (placeAfter) {
    tbody.insertBefore(draggedRow, targetRow.nextSibling);
  } else {
    tbody.insertBefore(draggedRow, targetRow);
  }
}

function onPointerMove(event) {
  if (!pointerDragActive || !draggedRow) return;
  moveRowAtPointer(event.clientX, event.clientY);
}

function onPointerUp() {
  document.removeEventListener("pointermove", onPointerMove);
  if (draggedRow && dragStartIndex >= 0) {
    const endIndex = rowList().indexOf(draggedRow);
    if (endIndex !== dragStartIndex) {
      markDirty();
      updateAllRowAriaLabels();
      scheduleAutoCalculate({ immediate: true });
    }
  }
  dragStartIndex = -1;
  endPointerDrag();
}

function applyDragStateToRow(row) {
  const enabled = dragToggle.checked;
  const handle = row.querySelector(".drag-handle");
  if (!handle) return;
  handle.draggable = false;
  handle.classList.toggle("inactive", !enabled);
  handle.setAttribute(
    "aria-label",
    enabled ? t("aria.drag_enabled") : t("aria.drag_disabled")
  );
}

function applyRepeatStateToRow(row) {
  const enabled = repeatToggle.checked;
  const repeatInput = row.querySelector(".repeat");
  if (repeatInput) {
    repeatInput.disabled = !enabled;
  }
}

function applyAdjustmentsStateToRow(row) {
  const extraPayEnabled = extraPayToggle.checked;
  const extraGetEnabled = extraGetToggle.checked;
  const extraPayInput = row.querySelector(".extra-pay");
  const extraGetInput = row.querySelector(".extra-get");

  if (extraPayInput) {
    extraPayInput.disabled = !extraPayEnabled;
  }
  if (extraGetInput) {
    extraGetInput.disabled = !extraGetEnabled;
  }
}

function addRow(data = {}) {
  const row = rowTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".name").value = data.name ?? "";
  row.querySelector(".repeat").value = String(parseRepeatCount(data.repeat ?? "1") || 1);
  row.querySelector(".spent").value = data.spent ?? "0";
  row.querySelector(".spent").step = formatRoundingUnit(spentStepDigits());
  row.querySelector(".extra-pay").value = data.extraPay ?? "0";
  row.querySelector(".extra-get").value = data.extraGet ?? "0";
  row.querySelector(".preferred").checked = Boolean(data.preferred);
  const handle = row.querySelector(".drag-handle");

  localizeRow(row);

  handle.addEventListener("pointerdown", (event) => {
    if (!dragToggle.checked) return;

    event.preventDefault();
    dragStartIndex = rowList().indexOf(row);
    draggedRow = row;
    activeHandle = handle;
    pointerDragActive = true;
    row.classList.add("dragging");
    handle.classList.add("dragging-handle");

    if (typeof handle.setPointerCapture === "function") {
      try {
        handle.setPointerCapture(event.pointerId);
      } catch (error) {
        // Ignore pointer capture errors in unsupported environments.
      }
    }

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp, { once: true });
    document.addEventListener("pointercancel", onPointerUp, { once: true });
  });

  row.querySelector(".remove").addEventListener("click", () => {
    if (draggedRow === row) {
      endPointerDrag();
    }
    markDirty();
    row.remove();
    syncPeopleCountInput();
    updateAllRowAriaLabels();
    scheduleAutoCalculate({ immediate: true });
  });

  tbody.appendChild(row);
  applyDragStateToRow(row);
  applyRepeatStateToRow(row);
  applyAdjustmentsStateToRow(row);
  syncPeopleCountInput();
  updateAllRowAriaLabels();
}

function refreshDragState() {
  if (!dragToggle.checked) {
    onPointerUp();
  }

  for (const row of rowList()) {
    applyDragStateToRow(row);
  }
}

function refreshAdjustmentsState() {
  participantsTable.classList.toggle("extra-pay-disabled", !extraPayToggle.checked);
  participantsTable.classList.toggle("extra-get-disabled", !extraGetToggle.checked);

  for (const row of rowList()) {
    applyAdjustmentsStateToRow(row);
  }
}

function refreshRepeatState() {
  participantsTable.classList.toggle("repeat-disabled", !repeatToggle.checked);

  for (const row of rowList()) {
    applyRepeatStateToRow(row);
  }
}


function isFieldPopulated(val) {
  const trimmed = String(val).trim();
  if (trimmed === "") return false;
  const parsed = parseDecimalScientific(trimmed);
  if (parsed) {
    return !parsed.isZero;
  }
  return true;
}

// ==========================================
// Payload Collection & Strict Validation
// ==========================================

function collectAndValidatePayload() {
  const multInputVal = multiplierInput ? multiplierInput.value.trim() : "1";
  if (!isPositiveDecimal(multInputVal)) {
    return { error: t("error.multiplier_invalid") };
  }

  const repeatEnabled = repeatToggle.checked;
  const extraPayEnabled = extraPayToggle.checked;
  const extraGetEnabled = extraGetToggle.checked;

  const rows = [];
  const populatedNamesSeen = new Set();
  let totalRepeatCount = 0;

  for (const row of rowList()) {
    const rawName = row.querySelector(".name").value;
    const trimmedName = rawName.trim();
    const rawSpent = row.querySelector(".spent").value.trim();
    const rawExtraPay = extraPayEnabled ? row.querySelector(".extra-pay").value.trim() : "0";
    const rawExtraGet = extraGetEnabled ? row.querySelector(".extra-get").value.trim() : "0";
    const rawRepeat = repeatEnabled ? row.querySelector(".repeat").value.trim() : "1";
    const preferred = row.querySelector(".preferred").checked;

    const spentPopulated = isFieldPopulated(rawSpent);
    const extraPayPopulated = isFieldPopulated(rawExtraPay);
    const extraGetPopulated = isFieldPopulated(rawExtraGet);
    const repeatCustom = repeatEnabled && rawRepeat !== "" && rawRepeat !== "1";

    const isPopulated = trimmedName !== "" || spentPopulated || extraPayPopulated || extraGetPopulated || repeatCustom || preferred;

    if (!isPopulated) {
      // Truly empty blank row, safely skip
      continue;
    }

    if (trimmedName === "") {
      return { error: t("error.blank_populated_name") };
    }

    const repeatParsed = parseRepeatCount(rawRepeat || "1");
    if (repeatParsed === null) {
      return { error: t("error.repeat_not_safe_integer") };
    }

    if (rawSpent !== "" && !isValidDecimalString(rawSpent)) {
      return { error: t("error.invalid_amount", { name: trimmedName, field: t("field.spent") }) };
    }
    if (rawExtraPay !== "" && !isValidDecimalString(rawExtraPay)) {
      return { error: t("error.invalid_amount", { name: trimmedName, field: t("field.extra_pay") }) };
    }
    if (rawExtraGet !== "" && !isValidDecimalString(rawExtraGet)) {
      return { error: t("error.invalid_amount", { name: trimmedName, field: t("field.extra_get") }) };
    }

    if (populatedNamesSeen.has(trimmedName)) {
      return { error: t("error.duplicate_name", { name: trimmedName }) };
    }
    populatedNamesSeen.add(trimmedName);

    totalRepeatCount += repeatParsed;
    if (!Number.isSafeInteger(totalRepeatCount)) {
      return { error: t("error.repeat_not_safe_integer") };
    }

    rows.push({
      name: trimmedName,
      spent: rawSpent === "" ? "0" : rawSpent,
      extra_pay: rawExtraPay === "" ? "0" : rawExtraPay,
      extra_get: rawExtraGet === "" ? "0" : rawExtraGet,
      repeat: repeatParsed,
      preferred,
    });
  }

  if (rows.length === 0) {
    return { error: t("error.add_participant"), empty: true };
  }

  // Always pass compact rows with repeat and preferred to worker
  return {
    payload: {
      rows,
      strict_preference: strictPreferenceToggle.checked,
      multiplier: multInputVal,
    },
  };
}

// ==========================================
// Calculation & Asynchronous Worker Flow
// ==========================================

function invalidatePendingState() {
  terminateActiveWorker();
  activeRequestId = ++requestSequence;
  hideResultAndError();
}

function scheduleAutoCalculate(options = {}) {
  const { immediate = false } = options;
  if (autoCalculateTimer) {
    clearTimeout(autoCalculateTimer);
    autoCalculateTimer = null;
  }

  // Immediate invalidation on every input/structural change
  invalidatePendingState();

  if (immediate) {
    void calculate({ silentEmpty: true });
    return;
  }

  autoCalculateTimer = window.setTimeout(() => {
    autoCalculateTimer = null;
    void calculate({ silentEmpty: true });
  }, AUTO_CALC_DEBOUNCE_MS);
}

function shiftRoundingDigits(kind, delta) {
  const currentDigits = kind === "before" ? beforeRoundingDigits : afterRoundingDigits;
  const nextDigits = Math.max(
    MIN_ROUNDING_DIGITS,
    Math.min(MAX_ROUNDING_DIGITS, currentDigits + delta)
  );
  if (nextDigits === currentDigits) return;

  if (kind === "before") {
    beforeRoundingDigits = nextDigits;
  } else {
    afterRoundingDigits = nextDigits;
  }
  refreshRoundingControls();
  if (lastResultData) {
    renderResult(lastResultData);
  } else {
    scheduleAutoCalculate({ immediate: true });
  }
}

async function calculate(options = {}) {
  const { silentEmpty = false } = options;

  invalidatePendingState();

  const validated = collectAndValidatePayload();
  if (validated.error) {
    if (silentEmpty && validated.empty) {
      hideResultAndError();
    } else {
      showError(validated.error);
    }
    return;
  }

  const { payload } = validated;
  const currentReqId = ++requestSequence;
  activeRequestId = currentReqId;

  showCalculatingIndicator();

  try {
    activeWorker = new Worker("./solver-worker.js", { type: "module" });
  } catch (err) {
    hideCalculatingIndicator();
    showError(t("error.settlement_failed"));
    return;
  }

  activeWorker.onmessage = (event) => {
    if (event.data.id !== activeRequestId) {
      // Discard stale response
      return;
    }

    terminateActiveWorker();

    if (event.data.error) {
      showError(event.data.error.message || t("error.settlement_failed"));
      return;
    }

    if (event.data.result) {
      lastUsedMultiplier = payload.multiplier;
      renderResult(event.data.result);
    }
  };

  activeWorker.onerror = (error) => {
    if (currentReqId !== activeRequestId) return;
    terminateActiveWorker();
    showError(t("error.settlement_failed"));
  };

  activeWorker.postMessage({ id: currentReqId, payload });
}

// ==========================================
// Result Rendering & Notices
// ==========================================

function renderPlanIntoElements(planData, digits, elements) {
  const { summaryEl, balancesEl, transfersEl } = elements;
  balancesEl.innerHTML = "";
  transfersEl.innerHTML = "";

  if (planData.error) {
    const errMsg = planData.error.message || String(planData.error);
    summaryEl.textContent = errMsg;
    summaryEl.classList.add("error");
    return;
  }

  summaryEl.classList.remove("error");
  const transactions = planData.summary.transactions;
  const burdenPenalty = planData.summary.burden_penalty;
  summaryEl.textContent = t("summary.template", { transactions, burdenPenalty });

  for (const item of planData.balances || []) {
    const rawCents = decimalToBigIntCents(item.net);
    const rounded = roundBigIntCents(rawCents, digits);
    const formatted = formatRoundedAmountBigInt(rounded, digits);
    const li = document.createElement("li");
    li.textContent = item.name + ": " + formatted + " (" + roleLabel(item.role) + ")";
    balancesEl.appendChild(li);
  }

  for (const transfer of planData.transfers || []) {
    const rawCents = decimalToBigIntCents(transfer.amount);
    const rounded = roundBigIntCents(rawCents, digits);
    const formatted = formatRoundedAmountBigInt(rounded, digits);
    const approxTag = digits < 0 ? " ~" : "";
    const li = document.createElement("li");
    li.textContent = transfer.from + " -> " + transfer.to + ": " + formatted + approxTag;
    transfersEl.appendChild(li);
  }

  if ((planData.transfers || []).length === 0) {
    const li = document.createElement("li");
    li.textContent = t("summary.no_transfers");
    transfersEl.appendChild(li);
  }
}

function renderResult(data) {
  lastResultData = data;
  if (errorEl) errorEl.classList.add("hidden");
  if (resultEl) resultEl.classList.remove("hidden");
  setResultToolsEnabled(true);
  clearResultToolsFeedback();

  const hasRoundingNotice = Boolean(data.rounding_notice || data.original?.rounding_notice);
  if (roundingNoticeEl) {
    roundingNoticeEl.classList.toggle("hidden", !hasRoundingNotice);
  }

  const isApproximateView = beforeRoundingDigits !== 2 || afterRoundingDigits !== 2;
  if (approximateNoticeEl) {
    approximateNoticeEl.classList.toggle("hidden", !isApproximateView);
  }

  const hasOriginal = Boolean(data.original);
  if (hasOriginal) {
    if (singleResultPanel) singleResultPanel.classList.add("hidden");
    if (dualResultPanel) dualResultPanel.classList.remove("hidden");

    renderPlanIntoElements(data.original, beforeRoundingDigits, {
      summaryEl: originalSummaryEl,
      balancesEl: originalBalancesEl,
      transfersEl: originalTransfersEl,
    });

    renderPlanIntoElements(data, afterRoundingDigits, {
      summaryEl: multipliedSummaryEl,
      balancesEl: multipliedBalancesEl,
      transfersEl: multipliedTransfersEl,
    });
  } else {
    if (dualResultPanel) dualResultPanel.classList.add("hidden");
    if (singleResultPanel) singleResultPanel.classList.remove("hidden");

    renderPlanIntoElements(data, afterRoundingDigits, {
      summaryEl,
      balancesEl,
      transfersEl,
    });
  }
}

function appendPlanLines(lines, heading, planData, digits) {
  if (heading) {
    lines.push(heading);
    lines.push("");
  }
  if (planData.error) {
    const errMsg = planData.error.message || String(planData.error);
    lines.push(errMsg);
    return;
  }
  const transactions = planData.summary.transactions;
  const burdenPenalty = planData.summary.burden_penalty;
  lines.push(t("summary.template", { transactions, burdenPenalty }));
  lines.push("");
  lines.push(t("section.net_balances"));
  for (const item of planData.balances || []) {
    const rawCents = decimalToBigIntCents(item.net);
    const rounded = roundBigIntCents(rawCents, digits);
    const formatted = formatRoundedAmountBigInt(rounded, digits);
    lines.push("- " + item.name + ": " + formatted + " (" + roleLabel(item.role) + ")");
  }
  lines.push("");
  lines.push(t("section.transfers"));
  for (const transfer of planData.transfers || []) {
    const rawCents = decimalToBigIntCents(transfer.amount);
    const rounded = roundBigIntCents(rawCents, digits);
    const formatted = formatRoundedAmountBigInt(rounded, digits);
    const approxTag = digits < 0 ? " ~" : "";
    lines.push("- " + transfer.from + " -> " + transfer.to + ": " + formatted + approxTag);
  }
  if ((planData.transfers || []).length === 0) {
    lines.push("- " + t("summary.no_transfers"));
  }
}

function resultLines() {
  if (!lastResultData || resultEl.classList.contains("hidden")) {
    return [];
  }

  const lines = [];
  lines.push(t("section.result"));
  lines.push("");

  if (lastResultData.rounding_notice || lastResultData.original?.rounding_notice) {
    lines.push(t("notice.rounding"));
  }

  if (beforeRoundingDigits !== 2 || afterRoundingDigits !== 2) {
    lines.push(t("notice.approximate_display"));
  }
  lines.push("");

  if (lastResultData.original) {
    appendPlanLines(lines, t("heading.original_plan"), lastResultData.original, beforeRoundingDigits);
    lines.push("");
    appendPlanLines(lines, t("heading.multiplied_plan"), lastResultData, afterRoundingDigits);
  } else {
    appendPlanLines(lines, "", lastResultData, afterRoundingDigits);
  }

  return lines;
}

function fallbackCopyText(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(area);
  if (!copied) {
    throw new Error("copy failed");
  }
}

async function copyResults() {
  const lines = resultLines();
  if (lines.length === 0) {
    showResultToolsFeedback("error.result_not_ready", { error: true });
    return;
  }

  const text = lines.join("\n");
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      fallbackCopyText(text);
    }
    showResultToolsFeedback("message.copy_success");
  } catch (error) {
    try {
      fallbackCopyText(text);
      showResultToolsFeedback("message.copy_success");
    } catch (fallbackError) {
      showResultToolsFeedback("message.copy_error", { error: true });
    }
  }
}

function downloadCanvas(canvas, filename) {
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

async function screenshotResults() {
  const main = document.querySelector("main.container");
  if (!main || typeof window.html2canvas !== "function") {
    showResultToolsFeedback("message.screenshot_error", { error: true });
    return;
  }

  try {
    const canvas = await window.html2canvas(main, {
      backgroundColor: "#ffffff",
      scale: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
      useCORS: true,
    });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadCanvas(canvas, "wire-min-splitter-full-" + stamp + ".png");
    showResultToolsFeedback("message.screenshot_success");
  } catch (error) {
    showResultToolsFeedback("message.screenshot_error", { error: true });
  }
}

// ==========================================
// Event Listeners Initialization
// ==========================================

dragToggle.addEventListener("change", refreshDragState);
strictPreferenceToggle.addEventListener("change", () => {
  markDirty();
  scheduleAutoCalculate({ immediate: true });
});
repeatToggle.addEventListener("change", () => {
  markDirty();
  refreshRepeatState();
  scheduleAutoCalculate({ immediate: true });
});
extraPayToggle.addEventListener("change", () => {
  markDirty();
  refreshAdjustmentsState();
  scheduleAutoCalculate({ immediate: true });
});
extraGetToggle.addEventListener("change", () => {
  markDirty();
  refreshAdjustmentsState();
  scheduleAutoCalculate({ immediate: true });
});
beforeRoundingLeftButton.addEventListener("click", () => {
  shiftRoundingDigits("before", -1);
});
beforeRoundingRightButton.addEventListener("click", () => {
  shiftRoundingDigits("before", 1);
});
afterRoundingLeftButton.addEventListener("click", () => {
  shiftRoundingDigits("after", -1);
});
afterRoundingRightButton.addEventListener("click", () => {
  shiftRoundingDigits("after", 1);
});
numberStyleSelect.addEventListener("change", () => {
  setNumberStyle(numberStyleSelect.value);
});
copyResultsButton.addEventListener("click", () => {
  void copyResults();
});
screenshotResultsButton.addEventListener("click", () => {
  void screenshotResults();
});
multiplierInput.addEventListener("input", () => {
  markDirty();
  refreshRoundingModeUI();
  scheduleAutoCalculate();
});
multiplierInput.addEventListener("change", () => {
  markDirty();
  refreshRoundingModeUI();
  scheduleAutoCalculate({ immediate: true });
});
tbody.addEventListener("input", () => {
  markDirty();
  scheduleAutoCalculate();
});
tbody.addEventListener("change", () => {
  markDirty();
  scheduleAutoCalculate({ immediate: true });
});
document.querySelector("#add-row").addEventListener("click", () => {
  const index = rowList().length;
  addRow({ name: buildNameFromMode(nameResetModeSelect.value, index) });
  markDirty();
  scheduleAutoCalculate({ immediate: true });
});
applyCountButton.addEventListener("click", applyParticipantCountFromInput);
peopleCountInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyParticipantCountFromInput();
  }
});
nameResetModeSelect.addEventListener("change", () => {
  const selectedMode = nameResetModeSelect.value;
  const applied = resetNames(selectedMode);
  if (!applied) {
    nameResetModeSelect.value = lastAppliedNameMode;
    return;
  }
  scheduleAutoCalculate({ immediate: true });
});
resetNamesButton.addEventListener("click", () => {
  const applied = resetNames(nameResetModeSelect.value);
  if (applied) {
    scheduleAutoCalculate({ immediate: true });
  }
});
document.querySelector("#calculate").addEventListener("click", () => {
  void calculate({ silentEmpty: false });
});

if (cancelCalculateButton) {
  cancelCalculateButton.addEventListener("click", cancelCalculation);
}

for (const button of languageButtons) {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.lang);
  });
}

function updateOfflineBadge() {
  if (!offlineIndicatorEl) return;
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  offlineIndicatorEl.classList.toggle("hidden", !isOffline);
}

window.addEventListener("online", updateOfflineBadge);
window.addEventListener("offline", updateOfflineBadge);
updateOfflineBadge();

// Initialize initial state
for (let index = 0; index < INITIAL_PARTICIPANT_COUNT; index += 1) {
  addRow({ spent: "0", extraPay: "0", extraGet: "0", preferred: false });
}
resetNames(nameResetModeSelect.value, { skipWarning: true });
syncPeopleCountInput();
setNumberStyle(detectInitialNumberStyle(), { persist: false, rerender: false });
setLanguage(detectInitialLanguage(), { persist: false });
refreshDragState();
refreshRepeatState();
refreshAdjustmentsState();
setResultToolsEnabled(false);
clearResultToolsFeedback();
scheduleAutoCalculate({ immediate: true });
