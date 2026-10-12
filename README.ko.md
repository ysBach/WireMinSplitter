# 최소송금 N빵 계산기 (MoneySplit)

MoneySplit은 함께 쓴 비용을 나누고, 정산에 필요한 송금 횟수를 최소로 만듭니다.
브라우저에서 [moneysplit-e1m.pages.dev](https://moneysplit-e1m.pages.dev/)를 여세요. 계정과 설치는 필요 없습니다.

언어: [English](README.md) · [日本語](README.ja.md) · [中文](README.zh.md)

## 사용 방법

1. 각 사람의 이름과 지출을 입력합니다.
2. 선택: 추가 부담과 추가 수령을 입력합니다. 두 합계는 같아야 합니다.
3. 여러 번 송금해도 되는 사람을 다중 송금 선호자로 표시합니다.
4. 선택: 엄격 선호 모드를 켭니다. 그러면 표시한 사람만 여러 번 송금할 수 있습니다.
5. 송금 지시를 확인합니다. 결과 복사 또는 스크린샷으로 공유합니다.

앱은 브라우저 안에서 계산합니다. 이름과 금액을 서버로 보내지 않습니다.
지원하는 브라우저에서는 앱을 설치할 수 있습니다. 브라우저가 앱 파일을 모두 캐시한 뒤에는 오프라인에서도 작동합니다.
인원이 많으면 탐색이 오래 걸릴 수 있습니다. 취소를 누르면 멈춥니다.

## 작동 방식

앱은 각 잔액을 센트 단위 정수로 계산합니다. 그다음 정확한 탐색으로 송금 횟수가 가장 적은 계획을 찾습니다.
[docs/ALGORITHM.ko.md](docs/ALGORITHM.ko.md)에 각 단계와 최적성 증명이 있습니다.
앱의 **알고리즘 작동 방식**에도 같은 내용이 있습니다.

## 개발과 배포

Node.js 22 이상이 필요합니다.

```bash
npm ci
npm test
npm run build
npm run preview  # dist/를 http://127.0.0.1:8080 에서 엽니다
```

알고리즘 설명을 고치려면 `scripts/algorithm-content.mjs`를 수정하고 `npm run docs:algorithm`을 실행합니다.
이 명령은 앱과 `docs/ALGORITHM*.md`를 함께 갱신합니다. 둘이 다르면 `npm test`가 실패합니다.

`main`에 푸시하면 GitHub Actions가 테스트와 빌드를 마친 뒤 Cloudflare Pages 프로젝트 `moneysplit`에 배포합니다.
배포 설정, Python 검사, 로컬 API는 [영문 README](README.md)를 보세요.
