# 最少转账AA计算器 (Wire-Min-Splitter)

这是一个 Python Web 应用，用于聚会AA结算，在保证公平的前提下**尽量减少转账次数**。

英文文档: [README.md](README.md)

## 主要功能

- 最少转账次数优化（`payer -> receiver`）
- 多次转账负担偏好:
  - 软偏好（同等解时最小化负担惩罚）
  - 严格偏好模式
- 每人输入:
  - `spent`（默认 `0`）
  - `extra_pay`（默认 `0`）
  - `extra_get`（默认 `0`）
- 每行支持 `repeat`（默认 `1`），可一次表示多个相同参与者
- 行拖拽排序（默认开启）
- 人数输入框 + 应用按钮
- 姓名批量重置:
  - 清空
  - `human 01, 02, ...`
  - 字母（`A, B, C, ...`）
- 覆盖姓名前弹出确认警告
- UI 语言切换: 英语 / 韩语 / 日语 / 中文

## 结算规则

按均摊计算:

`net = spent - share + extra_get - extra_pay`

- `net > 0`: 应收
- `net < 0`: 应付
- `net = 0`: 已结清

可行性条件:

`sum(extra_get) == sum(extra_pay)`

## 小数分配公平策略

为避免因行顺序导致的1分差异:

- 输入完全相同的人在可行时会被归一化为相同净额
- 剩余1分误差由主要收款人/付款人吸收

示例: 9人中1人支出 `151`，其余为0 -> 其余8人转账金额一致

## 运行

```bash
uv sync
uv run uvicorn wire_min_splitter.main:app --app-dir src --reload
```

打开: [http://127.0.0.1:8000](http://127.0.0.1:8000)

## 测试

```bash
uv run pytest
```

## API

`POST /api/settle`

请求示例:

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

返回:
- `summary`（`transactions`, `burden_penalty`）
- `balances`（name, net, role）
- `transfers`（`from`, `to`, `amount`）
