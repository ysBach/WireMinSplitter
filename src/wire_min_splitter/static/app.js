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
  en: {
    "title.document": "Wire-Min-Splitter",
    "app.title": "Wire-Min-Splitter",
    "app.subtitle":
      "Enter party spending and optional fairness adjustments, then generate minimal transfer instructions.",
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
    "section.result": "Result",
    "section.net_balances": "Net Balances",
    "section.transfers": "Transfers",
    "button.remove": "Remove",
    "placeholder.name": "Name",
    "title.drag_handle": "Drag to reorder",
    "tooltip.enable_drag":
      "Enable to reorder participant rows by dragging the :: handle.",
    "tooltip.strict_preference":
      "When on, only selected preferred payers can send to multiple people.",
    "tooltip.enable_repeat":
      "Enable editing of the Repeat column (default off for faster entry).",
    "tooltip.enable_extra_pay": "Enable editing of the Extra Pay column.",
    "tooltip.enable_extra_get": "Enable editing of the Extra Get column.",
    "tooltip.multiplier":
      "Multiply all entered amounts by this value (useful for currency conversion).",
    "tooltip.number_style":
      "Choose separator style for Result numbers.",
    "tooltip.result_rounding_single":
      "Choose how amounts are rounded in the Result section.",
    "tooltip.result_rounding_before":
      "Choose rounding for original amounts (before multiplier).",
    "tooltip.result_rounding_after":
      "Choose rounding for multiplied amounts (after multiplier).",
    "tooltip.rounding_left":
      "Round to a larger unit (0.01 -> 0.1 -> 1 -> 10 ...).",
    "tooltip.rounding_right":
      "Round to a smaller unit (10 -> 1 -> 0.1 -> 0.01 ...).",
    "tooltip.force_recalculate":
      "Fallback button: use this only if automatic result refresh appears not to work.",
    "tooltip.repeat":
      "Number of identical participants represented by this row.",
    "tooltip.preferred_multi":
      "Mark this person as allowed/preferred to handle multiple outgoing transfers.",
    "aria.drag_enabled": "Drag row to reorder",
    "aria.drag_disabled": "Enable drag reorder first",
    "error.people_count_invalid":
      "People count must be an integer greater than or equal to 1.",
    "error.multiplier_invalid": "Multiplier must be a number greater than 0.",
    "error.add_participant": "Add at least one participant with a name.",
    "error.settlement_failed": "Settlement failed.",
    "error.network": "Network error: {error}",
    "summary.template":
      "Transactions: {transactions} | Burden penalty: {burdenPenalty}",
    "summary.no_transfers": "No transfers needed.",
    "confirm.reset_names":
      "This will erase Name inputs you entered. Do you want to continue?",
    "label.original": "original",
    "label.multiplied": "multiplied",
    "role.payer": "payer",
    "role.receiver": "receiver",
    "role.settled": "settled",
  },
  ko: {
    "title.document": "Wire-Min-Splitter (최소송금 N빵 계산기)",
    "app.title": "Wire-Min-Splitter (최소송금 N빵 계산기)",
    "app.subtitle":
      "파티 지출과 보정값을 입력하면 최소 송금 횟수 정산안을 계산합니다.",
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
    "section.result": "결과",
    "section.net_balances": "순잔액",
    "section.transfers": "송금 지시",
    "button.remove": "삭제",
    "placeholder.name": "이름",
    "title.drag_handle": "드래그로 순서 변경",
    "tooltip.enable_drag":
      "켜면 :: 핸들을 잡아 참가자 행 순서를 드래그로 바꿀 수 있습니다.",
    "tooltip.strict_preference":
      "켜면 선호 대상으로 선택된 송금자만 여러 사람에게 송금할 수 있습니다.",
    "tooltip.enable_repeat":
      "반복 열 입력을 켭니다 (빠른 입력을 위해 기본은 꺼짐).",
    "tooltip.enable_extra_pay": "켜면 추가 부담 열을 직접 입력할 수 있습니다.",
    "tooltip.enable_extra_get": "켜면 추가 수령 열을 직접 입력할 수 있습니다.",
    "tooltip.multiplier":
      "입력 금액(지출/추가 부담/추가 수령)에 곱할 값입니다. 환율 변환에 쓸 수 있습니다.",
    "tooltip.number_style": "결과 숫자의 소수점/천 단위 구분 형식을 선택합니다.",
    "tooltip.result_rounding_single":
      "결과 섹션 금액을 어떤 단위로 반올림할지 선택합니다.",
    "tooltip.result_rounding_before":
      "원래값(배율 적용 전) 금액의 반올림 단위를 선택합니다.",
    "tooltip.result_rounding_after":
      "배율 적용 후 금액의 반올림 단위를 선택합니다.",
    "tooltip.rounding_left":
      "더 큰 단위로 반올림합니다 (0.01 -> 0.1 -> 1 -> 10 ...).",
    "tooltip.rounding_right":
      "더 작은 단위로 반올림합니다 (10 -> 1 -> 0.1 -> 0.01 ...).",
    "tooltip.force_recalculate":
      "자동 결과 갱신이 동작하지 않을 때만 사용하는 예비 버튼입니다.",
    "tooltip.repeat": "이 행이 대표하는 동일 참가자 수입니다.",
    "tooltip.preferred_multi":
      "이 사람을 다중 송금을 맡길(또는 허용할) 대상으로 지정합니다.",
    "aria.drag_enabled": "행을 드래그해서 순서를 변경",
    "aria.drag_disabled": "먼저 드래그 정렬을 켜세요",
    "error.people_count_invalid": "인원 수는 1 이상의 정수여야 합니다.",
    "error.multiplier_invalid": "배율은 0보다 큰 숫자여야 합니다.",
    "error.add_participant": "이름이 있는 참가자를 최소 1명 추가하세요.",
    "error.settlement_failed": "정산 계산에 실패했습니다.",
    "error.network": "네트워크 오류: {error}",
    "summary.template": "송금 건수: {transactions} | 부담 패널티: {burdenPenalty}",
    "summary.no_transfers": "송금이 필요 없습니다.",
    "confirm.reset_names":
      "이 작업은 입력한 이름을 지웁니다. 계속 진행할까요?",
    "label.original": "원래값",
    "label.multiplied": "배율적용",
    "role.payer": "송금자",
    "role.receiver": "수령자",
    "role.settled": "정산 완료",
  },
  ja: {
    "title.document": "Wire-Min-Splitter (最小送金バラバラ割り勘)",
    "app.title": "Wire-Min-Splitter (最小送金バラバラ割り勘)",
    "app.subtitle":
      "パーティーの支出と補正値を入力すると、送金回数が最小の精算案を計算します。",
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
    "section.result": "結果",
    "section.net_balances": "純残高",
    "section.transfers": "送金指示",
    "button.remove": "削除",
    "placeholder.name": "名前",
    "title.drag_handle": "ドラッグして並び替え",
    "tooltip.enable_drag":
      "有効にすると、:: ハンドルをドラッグして参加者の行順を変更できます。",
    "tooltip.strict_preference":
      "有効時は、優先対象として選んだ支払者だけが複数相手に送金できます。",
    "tooltip.enable_repeat":
      "人数列の編集を有効化します（入力を速くするため初期状態ではオフ）。",
    "tooltip.enable_extra_pay": "有効にすると、追加負担の列を編集できます。",
    "tooltip.enable_extra_get": "有効にすると、追加受取の列を編集できます。",
    "tooltip.multiplier":
      "入力金額（支出/追加負担/追加受取）に掛ける値です。通貨換算などに使えます。",
    "tooltip.number_style":
      "結果の数値で使う小数点と桁区切りの形式を選びます。",
    "tooltip.result_rounding_single":
      "結果セクションの金額をどの単位で丸めるか選択します。",
    "tooltip.result_rounding_before":
      "元の金額（倍率適用前）をどの単位で丸めるか選びます。",
    "tooltip.result_rounding_after":
      "倍率適用後の金額をどの単位で丸めるか選びます。",
    "tooltip.rounding_left":
      "より大きい単位で丸めます (0.01 -> 0.1 -> 1 -> 10 ...)。",
    "tooltip.rounding_right":
      "より小さい単位で丸めます (10 -> 1 -> 0.1 -> 0.01 ...)。",
    "tooltip.force_recalculate":
      "自動更新がうまく動かない場合だけ使う予備ボタンです。",
    "tooltip.repeat": "この行で表す同一参加者の人数です。",
    "tooltip.preferred_multi":
      "この人を複数送金の担当（または許可）対象として指定します。",
    "aria.drag_enabled": "行をドラッグして並び替え",
    "aria.drag_disabled": "先にドラッグ並び替えを有効化してください",
    "error.people_count_invalid": "人数は1以上の整数で入力してください。",
    "error.multiplier_invalid": "倍率は 0 より大きい数値で入力してください。",
    "error.add_participant": "名前のある参加者を1人以上追加してください。",
    "error.settlement_failed": "精算計算に失敗しました。",
    "error.network": "ネットワークエラー: {error}",
    "summary.template":
      "送金件数: {transactions} | 負担ペナルティ: {burdenPenalty}",
    "summary.no_transfers": "送金は不要です。",
    "confirm.reset_names":
      "入力済みの名前が消去されます。続行しますか？",
    "label.original": "元の値",
    "label.multiplied": "倍率適用後",
    "role.payer": "支払者",
    "role.receiver": "受取者",
    "role.settled": "精算済み",
  },
  zh: {
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
    "section.result": "结果",
    "section.net_balances": "净余额",
    "section.transfers": "转账指令",
    "button.remove": "删除",
    "placeholder.name": "姓名",
    "title.drag_handle": "拖拽调整顺序",
    "tooltip.enable_drag": "开启后可拖拽 :: 手柄调整参与者行顺序。",
    "tooltip.strict_preference":
      "开启后，只有被选为优先者的付款人可以向多名对象转账。",
    "tooltip.enable_repeat": "启用“重复”列编辑（默认关闭以便快速录入）。",
    "tooltip.enable_extra_pay": "开启后可编辑“额外支付”列。",
    "tooltip.enable_extra_get": "开启后可编辑“额外收取”列。",
    "tooltip.multiplier":
      "用于乘以输入金额（支出/额外支付/额外收取），可用于汇率换算。",
    "tooltip.number_style": "选择结果数字的小数点与千位分隔格式。",
    "tooltip.result_rounding_single": "选择结果区域金额的取整方式。",
    "tooltip.result_rounding_before": "选择原始金额（倍数前）的取整方式。",
    "tooltip.result_rounding_after": "选择倍数后金额的取整方式。",
    "tooltip.rounding_left": "向更大单位取整（0.01 -> 0.1 -> 1 -> 10 ...）。",
    "tooltip.rounding_right": "向更小单位取整（10 -> 1 -> 0.1 -> 0.01 ...）。",
    "tooltip.force_recalculate":
      "仅在自动刷新结果似乎失效时使用的后备按钮。",
    "tooltip.repeat": "该行代表的相同参与者人数。",
    "tooltip.preferred_multi":
      "将此人标记为可优先承担多笔对外转账。",
    "aria.drag_enabled": "拖拽行以调整顺序",
    "aria.drag_disabled": "请先启用拖拽排序",
    "error.people_count_invalid": "人数必须是大于等于 1 的整数。",
    "error.multiplier_invalid": "倍率必须是大于 0 的数字。",
    "error.add_participant": "请至少添加一名有姓名的参与者。",
    "error.settlement_failed": "结算失败。",
    "error.network": "网络错误: {error}",
    "summary.template": "转账笔数: {transactions} | 负担惩罚: {burdenPenalty}",
    "summary.no_transfers": "无需转账。",
    "confirm.reset_names": "此操作会清除你输入的姓名。是否继续？",
    "label.original": "原始值",
    "label.multiplied": "倍数后",
    "role.payer": "付款方",
    "role.receiver": "收款方",
    "role.settled": "已结清",
  },
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
let lastAppliedNameMode = nameResetModeSelect.value;
let autoCalculateTimer = null;
let requestSequence = 0;
let latestHandledRequest = 0;
let beforeRoundingDigits = DEFAULT_ROUNDING_DIGITS;
let afterRoundingDigits = DEFAULT_ROUNDING_DIGITS;
let numberStyle = DEFAULT_NUMBER_STYLE;
let lastUsedMultiplier = 1;

function rowList() {
  return Array.from(tbody.querySelectorAll("tr"));
}

function t(key, variables = {}) {
  const fallbackTable = TRANSLATIONS[DEFAULT_LANGUAGE];
  const table = TRANSLATIONS[currentLanguage] || fallbackTable;
  let text = table[key] ?? fallbackTable[key] ?? key;

  for (const [name, value] of Object.entries(variables)) {
    text = text.split(`{${name}}`).join(String(value));
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
  if (browserLanguage.startsWith("ko")) {
    return "ko";
  }
  if (browserLanguage.startsWith("ja")) {
    return "ja";
  }
  if (browserLanguage.startsWith("zh")) {
    return "zh";
  }

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
  if (style === "period_comma") {
    return "period_comma";
  }
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
  peopleCountInput.value = String(rowList().length);
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
  if (mode === "empty") {
    return "";
  }
  if (mode === "human_int") {
    return `human ${String(index + 1).padStart(2, "0")}`;
  }
  return toAlphabeticLabel(index);
}

function parseRepeatCount(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function withMaxLength(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }
  return value.slice(0, maxLength);
}

function uniquifyName(baseName, usedNames) {
  let candidate = withMaxLength(baseName, MAX_PARTICIPANT_NAME_LENGTH);
  if (!usedNames.has(candidate)) {
    usedNames.add(candidate);
    return candidate;
  }

  let serial = 2;
  while (true) {
    const suffix = ` (${serial})`;
    const maxBaseLength = Math.max(1, MAX_PARTICIPANT_NAME_LENGTH - suffix.length);
    candidate = `${withMaxLength(baseName, maxBaseLength)}${suffix}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
    serial += 1;
  }
}

function expandedNamesForRow(baseName, repeatCount, usedNames) {
  if (repeatCount === 1) {
    return [uniquifyName(baseName, usedNames)];
  }

  const width = String(repeatCount).length;
  const names = [];
  for (let index = 0; index < repeatCount; index += 1) {
    const suffix = ` ${String(index + 1).padStart(width, "0")}`;
    const maxBaseLength = Math.max(1, MAX_PARTICIPANT_NAME_LENGTH - suffix.length);
    names.push(uniquifyName(`${withMaxLength(baseName, maxBaseLength)}${suffix}`, usedNames));
  }
  return names;
}

function confirmNameResetIfNeeded() {
  if (!hasUserEditedInputs) {
    return true;
  }

  return window.confirm(t("confirm.reset_names"));
}

function updateSelectOptionLabels() {
  for (const [mode, key] of Object.entries(NAME_MODE_OPTION_KEYS)) {
    const option = nameResetModeSelect.querySelector(`option[value="${mode}"]`);
    if (option) {
      option.textContent = t(key);
    }
  }
}

function localizeRow(row) {
  const nameInput = row.querySelector(".name");
  const removeButton = row.querySelector(".remove");
  const handle = row.querySelector(".drag-handle");
  const preferredCheckbox = row.querySelector(".preferred");

  if (nameInput) {
    nameInput.placeholder = t("placeholder.name");
  }
  if (removeButton) {
    removeButton.textContent = t("button.remove");
  }
  if (handle) {
    handle.title = t("title.drag_handle");
  }
  if (preferredCheckbox) {
    preferredCheckbox.title = t("tooltip.preferred_multi");
  }
}

function roleLabel(role) {
  if (role === "payer") {
    return t("role.payer");
  }
  if (role === "receiver") {
    return t("role.receiver");
  }
  return t("role.settled");
}

function roundingUnitForDigits(digits) {
  return 10 ** -digits;
}

function formatRoundingUnit(digits) {
  const unit = roundingUnitForDigits(digits);
  if (digits >= 0) {
    return unit.toFixed(digits);
  }
  return String(Math.round(unit));
}

function formatNumberByStyle(valueText) {
  const normalized = String(valueText);
  const negative = normalized.startsWith("-");
  const absolute = negative ? normalized.slice(1) : normalized;
  const [integerPartRaw, fractionPart] = absolute.split(".");
  const integerPart = integerPartRaw || "0";
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, numberStyle === "period_comma" ? "." : ",");
  const decimalSeparator = numberStyle === "period_comma" ? "," : ".";
  const decimalPart = fractionPart ? `${decimalSeparator}${fractionPart}` : "";
  return `${negative ? "-" : ""}${groupedInteger}${decimalPart}`;
}

function refreshRoundingControls() {
  beforeRoundingDisplay.textContent = formatRoundingUnit(beforeRoundingDigits);
  beforeRoundingLeftButton.disabled = beforeRoundingDigits <= MIN_ROUNDING_DIGITS;
  beforeRoundingRightButton.disabled = beforeRoundingDigits >= MAX_ROUNDING_DIGITS;
  afterRoundingDisplay.textContent = formatRoundingUnit(afterRoundingDigits);
  afterRoundingLeftButton.disabled = afterRoundingDigits <= MIN_ROUNDING_DIGITS;
  afterRoundingRightButton.disabled = afterRoundingDigits >= MAX_ROUNDING_DIGITS;
  refreshSpentStep();
}

function isApproximatelyOne(value) {
  return Math.abs(value - 1) <= 1e-12;
}

function spentStepDigits() {
  const multiplierValue = parseMultiplier();
  if (multiplierValue !== null && isApproximatelyOne(multiplierValue)) {
    return afterRoundingDigits;
  }
  return beforeRoundingDigits;
}

function refreshSpentStep() {
  const stepValue = formatRoundingUnit(spentStepDigits());
  for (const row of rowList()) {
    row.querySelector(".spent").step = stepValue;
  }
}

function refreshRoundingModeUI() {
  const multiplierValue = parseMultiplier();
  const singleMode = multiplierValue !== null && isApproximatelyOne(multiplierValue);
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
  numberStyleSelect.value = numberStyle;
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
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
}

function hideResultAndError() {
  errorEl.textContent = "";
  errorEl.classList.add("hidden");
  resultEl.classList.add("hidden");
  lastResultData = null;
  lastUsedMultiplier = 1;
}

function applyParticipantCountFromInput() {
  const parsedCount = Number.parseInt(peopleCountInput.value, 10);
  if (!Number.isInteger(parsedCount) || parsedCount < MIN_PARTICIPANT_COUNT) {
    showError(t("error.people_count_invalid"));
    return;
  }

  const currentCount = rowList().length;
  if (parsedCount !== currentCount) {
    markDirty();
  }
  setParticipantCount(parsedCount);
  errorEl.classList.add("hidden");
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
  if (!draggedRow) {
    return;
  }

  const element = document.elementFromPoint(clientX, clientY);
  const targetRow = element ? element.closest("#participants tbody tr") : null;
  clearDropIndicators();

  if (!targetRow || targetRow === draggedRow) {
    return;
  }

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
  if (!pointerDragActive || !draggedRow) {
    return;
  }
  moveRowAtPointer(event.clientX, event.clientY);
}

function onPointerUp() {
  document.removeEventListener("pointermove", onPointerMove);
  if (draggedRow && dragStartIndex >= 0) {
    const endIndex = rowList().indexOf(draggedRow);
    if (endIndex !== dragStartIndex) {
      markDirty();
      scheduleAutoCalculate({ immediate: true });
    }
  }
  dragStartIndex = -1;
  endPointerDrag();
}

function applyDragStateToRow(row) {
  const enabled = dragToggle.checked;
  const handle = row.querySelector(".drag-handle");
  handle.draggable = false;
  handle.classList.toggle("inactive", !enabled);
  handle.setAttribute(
    "aria-label",
    enabled ? t("aria.drag_enabled") : t("aria.drag_disabled"),
  );
}

function applyTabStateToRow(row) {
  row.querySelector(".drag-handle").tabIndex = -1;
  row.querySelector(".preferred").tabIndex = -1;
  row.querySelector(".remove").tabIndex = -1;
}

function applyRepeatStateToRow(row) {
  const enabled = repeatToggle.checked;
  const repeatInput = row.querySelector(".repeat");
  repeatInput.disabled = !enabled;
  repeatInput.tabIndex = enabled ? 0 : -1;
}

function applyAdjustmentsStateToRow(row) {
  const extraPayEnabled = extraPayToggle.checked;
  const extraGetEnabled = extraGetToggle.checked;
  const extraPayInput = row.querySelector(".extra-pay");
  const extraGetInput = row.querySelector(".extra-get");

  extraPayInput.disabled = !extraPayEnabled;
  extraPayInput.tabIndex = extraPayEnabled ? 0 : -1;
  extraGetInput.disabled = !extraGetEnabled;
  extraGetInput.tabIndex = extraGetEnabled ? 0 : -1;
}

function addRow(data = {}) {
  const row = rowTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".name").value = data.name ?? "";
  row.querySelector(".repeat").value = String(parseRepeatCount(data.repeat ?? "1"));
  row.querySelector(".spent").value = data.spent ?? "0";
  row.querySelector(".spent").step = formatRoundingUnit(spentStepDigits());
  row.querySelector(".extra-pay").value = data.extraPay ?? "0";
  row.querySelector(".extra-get").value = data.extraGet ?? "0";
  row.querySelector(".preferred").checked = Boolean(data.preferred);
  const handle = row.querySelector(".drag-handle");

  localizeRow(row);

  handle.addEventListener("pointerdown", (event) => {
    if (!dragToggle.checked) {
      return;
    }

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
    scheduleAutoCalculate({ immediate: true });
  });

  tbody.appendChild(row);
  applyDragStateToRow(row);
  applyTabStateToRow(row);
  applyRepeatStateToRow(row);
  applyAdjustmentsStateToRow(row);
  syncPeopleCountInput();
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

function collectPayload(multiplierValue) {
  const people = [];
  const preferredMultiPayers = [];
  const repeatEnabled = repeatToggle.checked;
  const extraPayEnabled = extraPayToggle.checked;
  const extraGetEnabled = extraGetToggle.checked;
  const usedNames = new Set();

  for (const row of rowList()) {
    const name = row.querySelector(".name").value.trim();
    if (!name) {
      continue;
    }

    const repeatCount = repeatEnabled
      ? parseRepeatCount(row.querySelector(".repeat").value || "1")
      : 1;
    const expandedNames = expandedNamesForRow(name, repeatCount, usedNames);
    const spent = row.querySelector(".spent").value || "0";
    const extraPay = extraPayEnabled
      ? (row.querySelector(".extra-pay").value || "0")
      : "0";
    const extraGet = extraGetEnabled
      ? (row.querySelector(".extra-get").value || "0")
      : "0";
    const preferred = row.querySelector(".preferred").checked;

    for (const expandedName of expandedNames) {
      people.push({
        name: expandedName,
        spent,
        extra_pay: extraPay,
        extra_get: extraGet,
      });

      if (preferred) {
        preferredMultiPayers.push(expandedName);
      }
    }
  }

  return {
    people,
    preferred_multi_payers: preferredMultiPayers,
    strict_preference: strictPreferenceToggle.checked,
    multiplier: String(multiplierValue),
  };
}

function parseAmount(value) {
  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return parsed;
}

function parseMultiplier() {
  const parsed = Number.parseFloat(String(multiplierInput.value).trim());
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function roundSeriesKeepingTotal(values, digits) {
  const scale = 10 ** digits;
  const exactUnits = values.map((value) => value * scale);
  const roundedUnits = exactUnits.map((value) => Math.round(value));
  const targetSum = Math.round(
    exactUnits.reduce((sum, value) => sum + value, 0),
  );

  let diff = targetSum - roundedUnits.reduce((sum, value) => sum + value, 0);
  if (diff === 0 || roundedUnits.length === 0) {
    return roundedUnits.map((value) => value / scale);
  }

  const residuals = exactUnits.map((value, index) => ({
    index,
    residual: value - roundedUnits[index],
  }));

  if (diff > 0) {
    residuals.sort((a, b) => b.residual - a.residual || a.index - b.index);
    for (let step = 0; step < diff; step += 1) {
      const target = residuals[step % residuals.length];
      roundedUnits[target.index] += 1;
    }
  } else {
    const magnitude = -diff;
    residuals.sort((a, b) => a.residual - b.residual || a.index - b.index);
    for (let step = 0; step < magnitude; step += 1) {
      const target = residuals[step % residuals.length];
      roundedUnits[target.index] -= 1;
    }
  }

  return roundedUnits.map((value) => value / scale);
}

function formatRoundedAmount(value, digits) {
  const unit = roundingUnitForDigits(digits);
  const threshold = unit / 2;
  const safeValue = Math.abs(value) < threshold ? 0 : value;
  if (digits >= 0) {
    return formatNumberByStyle(safeValue.toFixed(digits));
  }

  const rounded = Math.round(safeValue / unit) * unit;
  return formatNumberByStyle(String(Math.round(rounded)));
}

function renderResult(data) {
  lastResultData = data;
  errorEl.classList.add("hidden");
  resultEl.classList.remove("hidden");

  const transactions = data.summary.transactions;
  const burdenPenalty = data.summary.burden_penalty;
  summaryEl.textContent = t("summary.template", { transactions, burdenPenalty });

  const afterDigits = afterRoundingDigits;
  const beforeDigits = beforeRoundingDigits;
  const roundedBalances = roundSeriesKeepingTotal(
    data.balances.map((item) => parseAmount(item.net)),
    afterDigits,
  );
  const roundedTransfers = roundSeriesKeepingTotal(
    data.transfers.map((item) => parseAmount(item.amount)),
    afterDigits,
  );
  const showOriginalAndMultiplied = Math.abs(lastUsedMultiplier - 1) > 1e-12;
  const originalBalances = showOriginalAndMultiplied
    ? roundSeriesKeepingTotal(
      data.balances.map((item) => parseAmount(item.net) / lastUsedMultiplier),
      beforeDigits,
    )
    : [];
  const originalTransfers = showOriginalAndMultiplied
    ? roundSeriesKeepingTotal(
      data.transfers.map((item) => parseAmount(item.amount) / lastUsedMultiplier),
      beforeDigits,
    )
    : [];

  balancesEl.innerHTML = "";
  for (const [index, item] of data.balances.entries()) {
    const li = document.createElement("li");
    if (showOriginalAndMultiplied) {
      li.textContent = `${item.name}: ${t("label.original")} ${formatRoundedAmount(originalBalances[index], beforeDigits)} | ${t("label.multiplied")} ${formatRoundedAmount(roundedBalances[index], afterDigits)} (${roleLabel(item.role)})`;
    } else {
      li.textContent = `${item.name}: ${formatRoundedAmount(roundedBalances[index], afterDigits)} (${roleLabel(item.role)})`;
    }
    balancesEl.appendChild(li);
  }

  transfersEl.innerHTML = "";
  for (const [index, transfer] of data.transfers.entries()) {
    const li = document.createElement("li");
    if (showOriginalAndMultiplied) {
      li.textContent = `${transfer.from} -> ${transfer.to}: ${t("label.original")} ${formatRoundedAmount(originalTransfers[index], beforeDigits)} | ${t("label.multiplied")} ${formatRoundedAmount(roundedTransfers[index], afterDigits)}`;
    } else {
      li.textContent = `${transfer.from} -> ${transfer.to}: ${formatRoundedAmount(roundedTransfers[index], afterDigits)}`;
    }
    transfersEl.appendChild(li);
  }

  if (data.transfers.length === 0) {
    const li = document.createElement("li");
    li.textContent = t("summary.no_transfers");
    transfersEl.appendChild(li);
  }
}

function scheduleAutoCalculate(options = {}) {
  const { immediate = false } = options;
  if (autoCalculateTimer) {
    clearTimeout(autoCalculateTimer);
    autoCalculateTimer = null;
  }

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
    Math.min(MAX_ROUNDING_DIGITS, currentDigits + delta),
  );
  if (nextDigits === currentDigits) {
    return;
  }

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
  const multiplierValue = parseMultiplier();
  if (multiplierValue === null) {
    if (silentEmpty) {
      hideResultAndError();
    } else {
      showError(t("error.multiplier_invalid"));
    }
    return;
  }

  const payload = collectPayload(multiplierValue);
  if (payload.people.length === 0) {
    if (silentEmpty) {
      hideResultAndError();
    } else {
      showError(t("error.add_participant"));
    }
    return;
  }

  const requestId = ++requestSequence;
  try {
    const response = await fetch("/api/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (requestId < latestHandledRequest) {
      return;
    }

    const body = await response.json();
    if (!response.ok) {
      latestHandledRequest = requestId;
      showError(body.detail || t("error.settlement_failed"));
      return;
    }

    latestHandledRequest = requestId;
    lastUsedMultiplier = multiplierValue;
    renderResult(body);
  } catch (error) {
    if (requestId < latestHandledRequest) {
      return;
    }
    latestHandledRequest = requestId;
    showError(t("error.network", { error: String(error) }));
  }
}

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
document.querySelector("#calculate").addEventListener("click", calculate);

for (const button of languageButtons) {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.lang);
  });
}

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
scheduleAutoCalculate({ immediate: true });
