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
    "notice.rounding": "Note: Due to nearest-cent allocation, identical participants may differ by 0.01.",
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
    "field.extra_get": "extra get"
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
    "notice.rounding": "참고: 가장 가까운 센트 단위 배분으로 인해 동일한 참가자 간에 0.01의 차이가 발생할 수 있습니다.",
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
    "field.extra_get": "추가 수령"
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
    "notice.rounding": "注意: 最も近いセント単位への配分のため、同じ条件の参加者間で0.01の差が生じる場合があります。",
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
    "field.extra_get": "追加受取"
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
    "notice.rounding": "注意：由于采用最接近分（cent）的分配方式，相同条件的参与者之间可能会有0.01的差异。",
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
    "field.extra_get": "额外收取"
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
