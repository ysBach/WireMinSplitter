# 최소송금 N빵 계산기 (Wire-Min-Splitter)

파티/모임 정산에서 **송금 횟수를 최소화**하면서 공정하게 금액을 나누는 Python 기반 웹 앱입니다.

영문 문서: [README.md](README.md)

## 주요 기능

- 송금 횟수 최소화 정산 (`payer -> receiver`)
- 다중 송금 부담 선호:
  - 완화 모드 (동률 시 패널티 최소화)
  - 엄격 모드
- 인원별 입력:
  - `spent` (기본 `0`)
  - `extra_pay` (기본 `0`)
  - `extra_get` (기본 `0`)
- 행별 `repeat` (기본 `1`)로 동일 참가자를 여러 명 묶어 입력
- 행 드래그 정렬 (기본 활성화)
- 인원수 입력 + 적용 버튼
- 이름 일괄 초기화:
  - 비우기
  - `human 01, 02, ...`
  - 알파벳 (`A, B, C, ...`)
- 이름 삭제 전 경고 확인창
- UI 언어 전환: 영어 / 한국어 / 일본어 / 중국어

## 정산 규칙

균등 분할 기준:

`net = spent - share + extra_get - extra_pay`

- `net > 0`: 받아야 하는 사람
- `net < 0`: 보내야 하는 사람
- `net = 0`: 정산 완료

성립 조건:

`sum(extra_get) == sum(extra_pay)`

## 센트(원 단위) 공정 처리

반올림으로 같은 입력의 사람이 1원 차이나는 문제를 줄이기 위해:

- 입력이 동일한 사람들은 가능한 경우 같은 순액으로 정규화
- 남는 1원 오차는 대표 수령자/송금자에 흡수

예: 9명 중 1명만 `151` 지출, 나머지 0 -> 나머지 8명 송금액 동일

## 실행

```bash
uv sync
uv run uvicorn wire_min_splitter.main:app --app-dir src --reload
```

브라우저: [http://127.0.0.1:8000](http://127.0.0.1:8000)

## 테스트

```bash
uv run pytest
```

## API

`POST /api/settle`

요청 예시:

```json
{
  "people": [
    { "name": "Alice", "spent": "120.00", "extra_pay": "0", "extra_get": "0" },
    { "name": "Bob", "spent": "0.00", "extra_pay": "0", "extra_get": "0" }
  ],
  "preferred_multi_payers": ["Alice"],
  "strict_preference": false
}
```

응답:
- `summary` (`transactions`, `burden_penalty`)
- `balances` (name, net, role)
- `transfers` (`from`, `to`, `amount`)
