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
    "algorithm.intro": "This tool finds the fewest direct payer-to-receiver transfers for balances rounded to cents. It computes with exact fractions. The code runs in your browser. It works offline after your browser caches the app.",
    "algorithm.h.input": "1. Read the input",
    "algorithm.in.1": "Names: Unicode NFC, trimmed, cut to 120 code points. Each name must be non-empty and unique.",
    "algorithm.in.2": "Read money as exact BigInt fractions. The solver uses no floating-point money.",
    "algorithm.in.3": "Each spent value is 0 or more. The multiplier m must be above 0. Total Extra Get must equal total Extra Pay exactly.",
    "algorithm.in.4": "A Repeat row with n above 1 becomes n people with numbered names (for example, Team 01, Team 02). A row with n = 1 keeps the typed name.",
    "algorithm.h.balance": "2. Compute the cent balances",
    "algorithm.bal.formula": "N = number of people\nT = sum of spent\nm = multiplier\nb_i = 100 · m · (spent_i − T/N + get_i − pay_i)\nspent = Spent, get = Extra Get, pay = Extra Pay\nb_i = ideal balance in cents (exact fraction)",
    "algorithm.bal.1": "Compute each b_i as an exact fraction.",
    "algorithm.bal.2": "Round every b_i down to a whole cent (floor: the largest integer not above b_i). Example: −33⅓ becomes −34.",
    "algorithm.bal.3": "The sum is now 0 or below. It is short of 0 by fewer than N cents. Call the shortage k.",
    "algorithm.bal.4": "Add 1 cent to the k people with the largest fractional remainders. Break ties by name, in Unicode code point order.",
    "algorithm.bal.5": "Positive balance: the person receives. Negative: the person pays. Zero: removed from the search.",
    "algorithm.bal.note": "Each cent balance differs from its ideal value by less than 1 cent. The sum is exactly 0. This largest-remainder allocation preserves the total. Identical participants can differ by 1 cent.",
    "algorithm.h.example": "Example",
    "algorithm.example": "A paid 1.00. B and C paid 0. Multiplier 1.\nIdeal cents: A +66⅔, B −33⅓, C −33⅓\nRound down: 66, −34, −34 → sum −2, so k = 2\nRemainders: 2/3, 2/3, 2/3 (tie)\nTie by name: A and B get +1 cent\nBalances: A +0.67, B −0.33, C −0.34 (sum 0)\nTransfers: B → A 0.33, C → A 0.34",
    "algorithm.h.views": "3. Show the views",
    "algorithm.views.1": "Multiplier 1: one plan.",
    "algorithm.views.2": "Multiplier other than 1: the Multiplied plan uses m. The Original plan uses factor 1.",
    "algorithm.views.3": "The solver calculates each view independently. In strict mode, one view can show a no-plan error while the other shows a plan.",
    "algorithm.views.4": "The rounding controls change only the shown numbers. Units other than 0.01 are approximate. Use 0.01 for exact payment instructions.",
    "algorithm.h.goal": "4. Set the goal",
    "algorithm.goal.formula": "minimize (transfers, burden) in lexicographic order: fewest transfers first, then smallest burden\nburden = Σ max(0, out_i − 1), summed over non-preferred payers i\nout_i = number of transfers that payer i sends",
    "algorithm.goal.1": "Preferred payers (Preferred Multi-Payer) have no penalty.",
    "algorithm.goal.2": "Strict mode: each non-preferred payer sends at most 1 transfer. Receivers have no limit.",
    "algorithm.goal.3": "If strict mode allows no plan, the result is a no-plan error.",
    "algorithm.h.search": "5. Search the plans",
    "algorithm.search.formula": "state = payers [(amount, preferred, has_sent)] + receiver amounts\nhas_sent = 1: the payer already sent a transfer in this plan\nmove = payer i pays receiver j an amount of min(a_i, r_j)\nbest(state) = min_lex over all moves of (1 + child.count, extra + child.penalty)\nextra = 1 if the payer has_sent and is non-preferred, else 0\nbest(empty state) = (0, 0)\nSkip infeasible children. Strict mode: skip moves with extra = 1.\nmin_lex = smallest pair, compared by count first, then penalty",
    "algorithm.search.1": "Run an iterative depth-first search. Try every distinct payer/receiver pair. Move the smaller of the two remaining amounts. Each move removes at least 1 person from the state.",
    "algorithm.search.2": "Payers are equal only if amount, preferred flag, and has_sent flag all match. Receivers are equal if their amounts match. The search tries equal choices once.",
    "algorithm.search.3": "The search caches each state as sorted payer tuples and sorted receiver amounts.",
    "algorithm.search.4": "One payer left, or one receiver left: an exact closed form gives the answer. It follows the strict rule.",
    "algorithm.search.5": "Lower bound: max(payers left, receivers left), computed after the proposed move. Skip the move only if 1 + bound is more than the best count found. Equal counts stay, so burden can still decide.",
    "algorithm.search.note": "If plans tie, the search uses canonical amounts, payer flags and has_sent status, then normalized names to pick one plan in a fixed way.",
    "algorithm.h.proof": "6. Why the result is exact",
    "algorithm.proof.1": "Take any plan that has a cycle (ignore the arrow directions). Shift +δ and −δ alternately along the cycle edges. Every participant's balance stays the same. Stop when one transfer is 0.",
    "algorithm.proof.2": "This creates no new payer/receiver pair. It raises no payer's outgoing count. So the transfer count, the burden, and the strict rule are never worse.",
    "algorithm.proof.3": "So some optimal plan has no cycle. It is a forest.",
    "algorithm.proof.4": "A non-empty forest has a leaf: a person with 1 transfer. That transfer carries the leaf's whole remaining amount. This amount is the smaller remaining amount of the pair.",
    "algorithm.proof.5": "The search tries every such pair, then repeats on the rest. So it reaches an optimal plan.",
    "algorithm.proof.scope": "Scope: the plan is optimal among direct payer-to-receiver plans for the cent balances. This tool makes no claim for other kinds of plan. Other plans can tie.",
    "algorithm.h.limits": "7. Know the limits",
    "algorithm.lim.1": "Run time can grow exponentially with the number of payers and receivers.",
    "algorithm.lim.2": "The search runs in a local worker in your browser. It works offline after your browser caches the app code.",
    "algorithm.lim.3": "The solver adds no timeout and no limit on the number of people. Use Cancel to stop a long search.",
    "algorithm.lim.4": "Cancel, or a memory or stack failure, is not a no-plan result. It says nothing about feasibility.",
    "algorithm.lim.5": "Only a successfully completed search returns an optimum for the rounded balances.",
    "algorithm.source": "View the deployed solver source (JavaScript)"
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
    "algorithm.intro": "이 도구는 센트 단위로 배분한 잔액에서, 송금자가 수령자에게 직접 보내는 송금의 최소 횟수를 찾습니다. 정확한 분수로 계산합니다. 코드는 브라우저에서 실행됩니다. 브라우저가 앱 캐시를 마친 뒤에는 오프라인에서도 작동합니다.",
    "algorithm.h.input": "1. 입력 읽기",
    "algorithm.in.1": "이름: 유니코드 NFC로 정규화하고, 앞뒤 공백을 제거하고, 120코드 포인트까지 자릅니다. 이름은 비어 있으면 안 되고 서로 달라야 합니다.",
    "algorithm.in.2": "금액: BigInt 정확한 분수로 읽습니다. 부동소수점은 쓰지 않습니다.",
    "algorithm.in.3": "각 지출액은 0 이상입니다. 배수 m은 0보다 커야 합니다. 추가 수령 합계와 추가 부담 합계는 정확히 같아야 합니다.",
    "algorithm.in.4": "반복이 1보다 큰 n인 행은 번호가 붙은 이름을 가진 n명이 됩니다 (예: 팀 01, 팀 02). n = 1인 행은 입력한 이름을 그대로 씁니다.",
    "algorithm.h.balance": "2. 센트 잔액 계산",
    "algorithm.bal.formula": "N = 인원 수\nT = 지출 합계\nm = 배수\nb_i = 100 · m · (spent_i − T/N + get_i − pay_i)\nspent = 지출, get = 추가 수령, pay = 추가 부담\nb_i = 이상적인 센트 잔액 (정확한 분수)",
    "algorithm.bal.1": "각 b_i를 정확한 분수로 계산합니다.",
    "algorithm.bal.2": "모든 b_i를 정수 센트로 내림합니다 (바닥 함수: b_i 이하의 가장 큰 정수). 예: −33⅓은 −34가 됩니다.",
    "algorithm.bal.3": "합계는 이제 0 이하이며, 0에 모자란 양은 N센트 미만입니다. 모자란 양을 k라고 합니다.",
    "algorithm.bal.4": "소수 부분이 가장 큰 k명에게 1센트씩 더합니다. 같으면 이름의 유니코드 코드 포인트 순서로 앞선 사람이 먼저입니다.",
    "algorithm.bal.5": "잔액이 양수면 받는 사람, 음수면 내는 사람입니다. 0이면 탐색에서 제외합니다.",
    "algorithm.bal.note": "각 센트 잔액은 이상적인 값과 1센트 미만으로 다르고, 합계는 정확히 0입니다. 이 최대 나머지 배분은 합계를 보존합니다. 동일한 참가자도 1센트 차이가 날 수 있습니다.",
    "algorithm.h.example": "예시",
    "algorithm.example": "A가 1.00을 지출, B와 C는 0, 배수 1.\n이상적인 센트: A +66⅔, B −33⅓, C −33⅓\n내림: 66, −34, −34 → 합계 −2, 따라서 k = 2\n나머지: 2/3, 2/3, 2/3 (동률)\n이름 순서로 A와 B에게 +1센트\n잔액: A +0.67, B −0.33, C −0.34 (합계 0)\n송금: B → A 0.33, C → A 0.34",
    "algorithm.h.views": "3. 표시 방식",
    "algorithm.views.1": "배수가 1이면 계획은 하나입니다.",
    "algorithm.views.2": "배수가 1이 아니면 '배수 적용 계획'은 m을 쓰고, '원래 계획'은 배수 1로 계산합니다.",
    "algorithm.views.3": "각 표시는 따로 풉니다. 엄격 모드에서는 한 표시가 계획 없음 오류를 보이고 다른 표시는 계획을 보일 수 있습니다.",
    "algorithm.views.4": "반올림 설정은 숫자 표시만 바꿉니다. 0.01이 아닌 표시 단위는 근사값입니다. 정확한 송금 지침에는 0.01을 쓰세요.",
    "algorithm.h.goal": "4. 목표",
    "algorithm.goal.formula": "최소화 (송금 횟수, 부담) — 사전식 순서: 먼저 송금 횟수, 다음 부담\n부담 = Σ max(0, out_i − 1), 선호하지 않는 송금자 i에 대한 합\nout_i = 송금자 i가 보내는 송금 횟수",
    "algorithm.goal.1": "선호 송금자(다중 송금 선호자)에게는 벌점이 없습니다.",
    "algorithm.goal.2": "엄격 모드: 선호하지 않는 송금자는 최대 1번만 송금합니다. 수령자가 받는 횟수는 제한이 없습니다.",
    "algorithm.goal.3": "엄격 모드에서 가능한 계획이 없으면 결과는 계획 없음 오류입니다.",
    "algorithm.h.search": "5. 계획 탐색",
    "algorithm.search.formula": "state = 송금자 [(amount, preferred, has_sent)] + 수령자 금액\nhas_sent = 1: 이 송금자가 이 계획에서 이미 송금함\nmove = 송금자 i가 수령자 j에게 min(a_i, r_j)를 송금\nbest(state) = 모든 move에 대한 min_lex (1 + child.count, extra + child.penalty)\nextra = 송금자가 has_sent이고 선호자가 아니면 1, 아니면 0\nbest(빈 state) = (0, 0)\n실행 불가능한 자식은 건너뜁니다. 엄격 모드: extra = 1인 move는 건너뜁니다.\nmin_lex = 송금 횟수를 먼저, 그다음 벌점을 비교한 최솟값",
    "algorithm.search.1": "반복(iterative) 방식의 깊이 우선 탐색을 실행합니다. 서로 다른 송금자/수령자 쌍을 모두 시도합니다. 두 남은 금액 중 작은 쪽을 보냅니다. move 한 번마다 state에서 최소 1명이 빠집니다.",
    "algorithm.search.2": "송금자는 금액, preferred 플래그, has_sent 플래그가 모두 같을 때만 같은 것으로 봅니다. 수령자는 금액이 같으면 같은 것으로 봅니다. 같은 선택은 한 번만 시도합니다.",
    "algorithm.search.3": "각 state는 정렬된 송금자 튜플과 정렬된 수령자 금액으로 캐시합니다.",
    "algorithm.search.4": "송금자가 1명 또는 수령자가 1명 남으면 정확한 닫힌 형태로 답을 냅니다. 엄격 규칙을 따릅니다.",
    "algorithm.search.5": "하한: max(남은 송금자 수, 남은 수령자 수). 제안한 move를 적용한 뒤에 계산합니다. 1 + 하한이 지금까지 찾은 최선 횟수보다 클 때만 move를 건너뜁니다. 횟수가 같으면 남겨 두므로 부담으로 결정할 수 있습니다.",
    "algorithm.search.note": "동등한 계획이 여럿이면 정규화한 금액, 송금자 플래그와 has_sent 상태, 그다음 정규화한 이름 순서로 하나를 고정적으로 고릅니다.",
    "algorithm.h.proof": "6. 결과가 정확한 이유",
    "algorithm.proof.1": "순환이 있는 계획을 생각합니다 (화살표 방향은 무시). 순환의 변을 따라 +δ와 −δ를 번갈아 옮깁니다. 모든 참가자의 잔액은 그대로입니다. 송금 하나가 0이 되면 멈춥니다.",
    "algorithm.proof.2": "이렇게 해도 새로운 송금자/수령자 쌍이 생기지 않고, 송금자의 송금 횟수도 늘지 않습니다. 송금 횟수, 부담, 엄격 규칙은 나빠지지 않습니다.",
    "algorithm.proof.3": "따라서 순환이 없는 최적 계획이 있습니다. 그것은 포레스트입니다.",
    "algorithm.proof.4": "비어 있지 않은 포레스트에는 잎이 있습니다. 잎은 송금이 하나뿐인 사람입니다. 그 송금은 잎의 남은 금액 전부를 옮깁니다. 이 금액은 쌍의 두 남은 금액 중 작은 쪽입니다.",
    "algorithm.proof.5": "탐색은 이런 쌍을 모두 시도하고 나머지에서 같은 일을 반복합니다. 그래서 최적 계획에 도달합니다.",
    "algorithm.proof.scope": "범위: 센트 잔액에 대해 송금자가 수령자에게 직접 보내는 계획 중에서 최적입니다. 이 도구는 다른 종류의 계획에 대해서는 주장하지 않습니다. 다른 계획이 동률일 수 있습니다.",
    "algorithm.h.limits": "7. 한계",
    "algorithm.lim.1": "탐색은 탐욕법이 아닙니다. 일반적인 경우의 속도를 보장하지 않습니다. 실행 시간은 인원 수에 따라 지수적으로 늘 수 있습니다.",
    "algorithm.lim.2": "탐색은 브라우저의 로컬 워커에서 실행됩니다. 브라우저가 앱 코드 캐시를 마친 뒤에는 오프라인에서도 작동합니다.",
    "algorithm.lim.3": "솔버에는 시간 제한도 인원 수 제한도 없습니다. 긴 탐색은 취소 버튼으로 멈춥니다.",
    "algorithm.lim.4": "취소, 또는 메모리·스택 실패는 '계획 없음'이 아닙니다. 실행 가능성에 대해서는 아무것도 알려 주지 않습니다.",
    "algorithm.lim.5": "탐색이 성공적으로 끝난 경우에만 센트 단위로 배분한 잔액에 대한 최적해를 돌려줍니다.",
    "algorithm.source": "배포된 솔버 소스: solver.js (같은 출처 코드)"
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
    "algorithm.intro": "このツールは、セント単位に丸めた残高について、支払者から受取者への直接送金の最少回数を求めます。計算は正確な分数で行います。コードはブラウザ内で動きます。ブラウザがアプリのキャッシュを完了した後は、オフラインでも使えます。",
    "algorithm.h.input": "1. 入力の読み取り",
    "algorithm.in.1": "名前：Unicode NFC に正規化し、前後の空白を削除し、120 コードポイントまでに切ります。名前は空にできず、重複できません。",
    "algorithm.in.2": "金額：BigInt の正確な分数として読みます。浮動小数点は使いません。",
    "algorithm.in.3": "各支出額は 0 以上です。倍率 m は 0 より大きい値です。追加受取の合計と追加負担の合計は、正確に等しくなければなりません。",
    "algorithm.in.4": "人数が 1 より大きい n の行は、番号付きの名前を持つ n 人になります（例：チーム 01、チーム 02）。n = 1 の行は入力した名前をそのまま使います。",
    "algorithm.h.balance": "2. セント残高の計算",
    "algorithm.bal.formula": "N = 人数\nT = 支出の合計\nm = 倍率\nb_i = 100 · m · (spent_i − T/N + get_i − pay_i)\nspent = 支出、get = 追加受取、pay = 追加負担\nb_i = 理想のセント残高（正確な分数）",
    "algorithm.bal.1": "各 b_i を正確な分数で計算します。",
    "algorithm.bal.2": "すべての b_i を床関数で整数セントにします（b_i 以下で最大の整数）。0 方向への切り捨てではありません。例：−33⅓ は −34 になります。",
    "algorithm.bal.3": "合計は 0 以下になり、0 までの不足は N セント未満です。この不足を k とします。",
    "algorithm.bal.4": "小数部分が大きい順に k 人へ 1 セントずつ足します。同じ場合は、名前の Unicode コードポイント順で先の人が優先です。",
    "algorithm.bal.5": "残高が正なら受取、負なら支払です。0 の人は探索から除きます。",
    "algorithm.bal.note": "各セント残高は理想値との差が 1 セント未満で、合計は正確に 0 です。この最大剰余法の配分は合計を保ちます。同じ条件の参加者でも 1 セント差が出ることがあります。",
    "algorithm.h.example": "例",
    "algorithm.example": "A が 1.00 を支出、B と C は 0、倍率 1。\n理想のセント：A +66⅔、B −33⅓、C −33⅓\n切り捨て：66、−34、−34 → 合計 −2、よって k = 2\n剰余：2/3、2/3、2/3（同じ）\n名前順で A と B に +1 セント\n残高：A +0.67、B −0.33、C −0.34（合計 0）\n送金：B → A 0.33、C → A 0.34",
    "algorithm.h.views": "3. 表示",
    "algorithm.views.1": "倍率が 1 のとき、プランは 1 つです。",
    "algorithm.views.2": "倍率が 1 以外のとき、「倍率適用後プラン」は m を使い、「元のプラン」は倍率 1 で計算します。",
    "algorithm.views.3": "各表示は別々に解きます。厳格モードでは、片方の表示がプランなしのエラーになり、もう片方がプランを表示することがあります。",
    "algorithm.views.4": "丸め設定は数値の表示だけを変えます。表示単位が 0.01 以外のときは概算です。正確な送金指示には 0.01 を使ってください。",
    "algorithm.h.goal": "4. 目標",
    "algorithm.goal.formula": "最小化 (送金回数, 負担) — 辞書式順序：まず送金回数、次に負担\n負担 = Σ max(0, out_i − 1)、優先でない支払者 i について合計\nout_i = 支払者 i が送る送金の回数",
    "algorithm.goal.1": "優先者（複数送金の優先者）には罰則がありません。",
    "algorithm.goal.2": "厳格モード：優先でない支払者は送金を最大 1 回までにします。受取者の受取回数に制限はありません。",
    "algorithm.goal.3": "厳格モードで実行可能なプランがなければ、結果は「プランなし」エラーです。",
    "algorithm.h.search": "5. プランの探索",
    "algorithm.search.formula": "state = 支払者 [(amount, preferred, has_sent)] + 受取者の金額\nhas_sent = 1：この支払者がこのプランで既に送金した\nmove = 支払者 i が受取者 j に min(a_i, r_j) を支払う\nbest(state) = 全 move についての min_lex (1 + child.count, extra + child.penalty)\nextra = 支払者が has_sent かつ優先でなければ 1、そうでなければ 0\nbest(空の state) = (0, 0)\n実行不可能な子は除外。厳格モード：extra = 1 の move は除外。\nmin_lex = 送金回数を先に、次に罰則を比べた最小の組",
    "algorithm.search.1": "反復型の深さ優先探索を実行します。支払者と受取者の異なる組をすべて試します。残額の小さい方を送ります。1 回の move で state から少なくとも 1 人が消えます。",
    "algorithm.search.2": "支払者が等しいのは、金額・preferred フラグ・has_sent フラグがすべて一致するときだけです。受取者は金額が一致すれば等しいとみなします。等しい選択は 1 回だけ試します。",
    "algorithm.search.3": "各 state は、ソート済みの支払者タプルとソート済みの受取者金額としてキャッシュします。",
    "algorithm.search.4": "支払者が 1 人、または受取者が 1 人になったら、厳密な閉形式で答えを出します。厳格ルールに従います。",
    "algorithm.search.5": "下限：max(残りの支払者数, 残りの受取者数)。提案した move を適用した後で計算します。1 + 下限が、それまでの最良の回数より大きいときだけ move を省きます。回数が同じなら残すので、負担で決められます。",
    "algorithm.search.note": "同等のプランが並ぶ場合は、正規化した金額、支払者のフラグと has_sent の状態、次に正規化した名前の順で 1 つを固定的に選びます。",
    "algorithm.h.proof": "6. 結果が正確な理由",
    "algorithm.proof.1": "サイクルを持つプランを考えます（矢印の向きは無視）。サイクルの辺に沿って +δ と −δ を交互に動かします。各参加者の残高は変わりません。送金の 1 つが 0 になったら止めます。",
    "algorithm.proof.2": "この操作で新しい支払者・受取者の組は生じません。支払者の送金回数も増えません。送金回数、負担、厳格ルールは悪化しません。",
    "algorithm.proof.3": "したがって、サイクルのない最適プランが存在します。それはフォレストです。",
    "algorithm.proof.4": "空でないフォレストには葉があります。葉とは送金が 1 つの人です。その送金は葉の残額すべてを運びます。この額は、組の 2 つの残額のうち小さい方です。",
    "algorithm.proof.5": "探索はこのような組をすべて試し、残りで同じことを繰り返します。したがって最適プランに到達します。",
    "algorithm.proof.scope": "範囲：セント残高に対する、支払者から受取者への直接送金プランの中で最適です。このツールは他の種類のプランについては主張しません。他のプランが並ぶこともあります。",
    "algorithm.h.limits": "7. 制限",
    "algorithm.lim.1": "探索は貪欲法ではありません。典型的な場合の速さは主張しません。実行時間は人数に対して指数的に増えることがあります。",
    "algorithm.lim.2": "探索はブラウザ内のローカルワーカーで動きます。ブラウザがアプリのコードのキャッシュを完了した後は、オフラインでも動きます。",
    "algorithm.lim.3": "ソルバーにはタイムアウトも人数の上限もありません。長い探索は「キャンセル」で止めます。",
    "algorithm.lim.4": "キャンセル、またはメモリ・スタックの失敗は「プランなし」ではありません。実行可能性については何も言えません。",
    "algorithm.lim.5": "探索が正常に完了した場合にのみ、丸めた残高に対する最適解が得られます。",
    "algorithm.source": "デプロイ済みソルバーのソース：solver.js（同一オリジンのコード）"
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
    "algorithm.intro": "本工具针对已取整到分的余额，求出付款人直接转给收款人的最少转账次数。计算使用精确分数。代码在浏览器中运行。浏览器完成应用缓存后，离线也可使用。",
    "algorithm.h.input": "1. 读取输入",
    "algorithm.in.1": "名称：规范化为 Unicode NFC，去掉首尾空白，最多保留 120 个码位。名称不能为空，也不能重复。",
    "algorithm.in.2": "金额：按 BigInt 精确分数读取。不使用浮点数。",
    "algorithm.in.3": "每个支出不小于 0。倍数 m 必须大于 0。额外收取的总和必须与额外支付的总和完全相等。",
    "algorithm.in.4": "重复数 n 大于 1 的行会变成 n 个人，名称带编号（例如：团队 01、团队 02）。n = 1 的行保留输入的名称。",
    "algorithm.h.balance": "2. 计算分余额",
    "algorithm.bal.formula": "N = 人数\nT = 支出总和\nm = 倍数\nb_i = 100 · m · (spent_i − T/N + get_i − pay_i)\nspent = 支出，get = 额外收取，pay = 额外支付\nb_i = 理想的分余额（精确分数）",
    "algorithm.bal.1": "把每个 b_i 算成精确分数。",
    "algorithm.bal.2": "把所有 b_i 向下取整到整数分（取不大于 b_i 的最大整数）。例如：−33⅓ 变为 −34。",
    "algorithm.bal.3": "此时总和不大于 0，距离 0 的差额小于 N 分。把差额记为 k。",
    "algorithm.bal.4": "给小数部分最大的 k 个人各加 1 分。并列时，按名称的 Unicode 码位顺序，靠前者优先。",
    "algorithm.bal.5": "余额为正：收款。为负：付款。为 0：从搜索中移除。",
    "algorithm.bal.note": "每个分余额与理想值的差小于 1 分，总和恰好为 0。这种最大余数分配保持总和不变。相同的参与者可能相差 1 分。",
    "algorithm.h.example": "示例",
    "algorithm.example": "A 支出 1.00，B 和 C 支出 0，倍数 1。\n理想分数：A +66⅔，B −33⅓，C −33⅓\n向下取整：66，−34，−34 → 总和 −2，所以 k = 2\n余数：2/3，2/3，2/3（并列）\n按名称顺序，A 和 B 各加 1 分\n余额：A +0.67，B −0.33，C −0.34（总和 0）\n转账：B → A 0.33，C → A 0.34",
    "algorithm.h.views": "3. 显示视图",
    "algorithm.views.1": "倍数为 1 时，只有一个方案。",
    "algorithm.views.2": "倍数不为 1 时，“倍数后方案”使用 m，“原始方案”使用倍数 1 计算。",
    "algorithm.views.3": "每个视图各自独立求解。在严格模式下，一个视图可能显示无方案错误，另一个视图仍显示方案。",
    "algorithm.views.4": "取整设置只改变数字的显示。显示单位不是 0.01 时为近似值。需要精确的转账指令时，请使用 0.01。",
    "algorithm.h.goal": "4. 目标",
    "algorithm.goal.formula": "最小化 (转账次数, 负担)，按字典序：先比转账次数，再比负担\n负担 = Σ max(0, out_i − 1)，对非优先付款人 i 求和\nout_i = 付款人 i 发出的转账次数",
    "algorithm.goal.1": "优先者（多次转账优先者）没有惩罚。",
    "algorithm.goal.2": "严格模式：每个非优先付款人最多转出 1 笔。收款人收款次数不受限制。",
    "algorithm.goal.3": "严格模式下若没有可行方案，结果为无方案错误。",
    "algorithm.h.search": "5. 搜索方案",
    "algorithm.search.formula": "state = 付款人 [(amount, preferred, has_sent)] + 收款人金额\nhas_sent = 1：该付款人在此方案中已转出过\nmove = 付款人 i 向收款人 j 转 min(a_i, r_j)\nbest(state) = 对所有 move 取 min_lex (1 + child.count, extra + child.penalty)\nextra = 付款人 has_sent 且非优先则为 1，否则为 0\nbest(空 state) = (0, 0)\n跳过不可行的子状态。严格模式：跳过 extra = 1 的 move。\nmin_lex = 先比转账次数，再比惩罚的最小组合",
    "algorithm.search.1": "运行迭代式深度优先搜索。尝试每一个不同的付款人/收款人组合。转出两个剩余金额中较小的一个。每次 move 至少让 state 少 1 个人。",
    "algorithm.search.2": "只有金额、preferred 标记和 has_sent 标记都相同，付款人才视为相同。收款人金额相同即视为相同。相同的选择只尝试一次。",
    "algorithm.search.3": "每个 state 以排序后的付款人元组和排序后的收款人金额作为缓存键。",
    "algorithm.search.4": "只剩 1 个付款人或 1 个收款人时，用精确的封闭形式给出答案。它遵守严格规则。",
    "algorithm.search.5": "下界：max(剩余付款人数, 剩余收款人数)，在应用所提议的 move 之后计算。仅当 1 + 下界大于目前最佳次数时，才跳过该 move。次数相等时保留，因此仍可由负担决定。",
    "algorithm.search.note": "若多个方案并列，则依次按规范化金额、付款人标记与 has_sent 状态、规范化名称，固定地选出其中一个。",
    "algorithm.h.proof": "6. 为什么结果是精确的",
    "algorithm.proof.1": "取任何含环的方案（忽略箭头方向）。沿环的边交替移动 +δ 和 −δ。每位参与者的余额保持不变。某一笔转账变为 0 时停止。",
    "algorithm.proof.2": "这样不会产生新的付款人/收款人组合，也不会增加任何付款人的转出次数。因此转账次数、负担和严格规则都不会变差。",
    "algorithm.proof.3": "所以存在一个无环的最优方案，即森林。",
    "algorithm.proof.4": "非空森林有叶子：只有 1 笔转账的人。这笔转账承载叶子的全部剩余金额。该金额是这一对的两个剩余金额中较小的一个。",
    "algorithm.proof.5": "搜索会尝试每一个这样的组合，再对剩余部分重复。因此它能到达最优方案。",
    "algorithm.proof.scope": "范围：对分余额而言，在付款人直接转给收款人的方案中是最优的。本工具对其他类型的方案不作任何声明。其他方案可能并列。",
    "algorithm.h.limits": "7. 限制",
    "algorithm.lim.1": "搜索不是贪心法。不保证一般情况下速度很快。运行时间可能随人数呈指数增长。",
    "algorithm.lim.2": "搜索在浏览器的本地 worker 中运行。浏览器完成应用代码缓存后，离线也能工作。",
    "algorithm.lim.3": "求解器没有超时，也没有人数上限。用“取消”停止长时间的搜索。",
    "algorithm.lim.4": "取消，或内存、栈失败，都不是“无方案”。它不能说明可行性。",
    "algorithm.lim.5": "只有搜索成功完成时，才返回针对取整余额的最优解。",
    "algorithm.source": "已部署的求解器源码：solver.js（同源代码）"
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

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.title = t("title.document");

  for (const element of document.querySelectorAll("[data-i18n]")) {
    const key = element.dataset.i18n;
    element.textContent = t(key);
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
