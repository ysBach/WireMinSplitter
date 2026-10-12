"""Exact settlement solver (Python reference implementation).

Money is handled as exact rationals. Net balances are rounded to whole cents once,
at the end, with a balanced nearest-cent allocation.

Notes
-----
The transfer search takes one active payer and one active receiver per step and
moves the smaller of their two remaining amounts. A transportation graph with the
fewest edges has no cycle: shifting flow around a cycle removes an edge, adds none
and never raises an out-degree. So it is a forest. A forest with an edge has a leaf,
and the leaf edge carries all of the leaf's remaining amount, which is the smaller of
the two remaining amounts. Branching over every payer/receiver pair therefore reaches
every minimum-edge graph, with or without the strict out-degree limit. States are
memoised as sorted multisets. Payers with equal (amount, preferred, sent) are
interchangeable, so merging them is exact. Preferred and other payers are never
merged, because their penalties differ.
"""

from __future__ import annotations

import re
import unicodedata
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from decimal import Decimal
from fractions import Fraction
from typing import Any


class SettlementError(ValueError):
    """Raised when settlement inputs are invalid or infeasible."""


class SettlementResourceError(SettlementError):
    """Raised when the search runs out of resources (no feasibility conclusion)."""


class SettlementInfeasibleError(SettlementError):
    """Raised when valid input has no plan under the strict preference."""


@dataclass(frozen=True)
class PartyMember:
    name: str
    spent_cents: int = 0
    extra_pay_cents: int = 0
    extra_get_cents: int = 0


@dataclass(frozen=True)
class SourceMember:
    """One participant with exact source amounts (before any multiplier).

    Amounts are decimal strings, `int` or `Decimal`. `float` is rejected.
    """

    name: str
    spent: str | int | Decimal = 0
    extra_pay: str | int | Decimal = 0
    extra_get: str | int | Decimal = 0


@dataclass(frozen=True)
class NetBalance:
    name: str
    cents: int


@dataclass(frozen=True)
class Transfer:
    payer: str
    receiver: str
    cents: int


@dataclass(frozen=True)
class SettlementComputation:
    balances: list[NetBalance]
    transfers: list[Transfer]
    transaction_count: int
    burden_penalty: int
    rounding_notice: bool = False


_NAME_WHITESPACE = (
    "\t\n\x0b\x0c\r \xa0\u1680"
    + "".join(chr(code) for code in range(0x2000, 0x200B))
    + "\u2028\u2029\u202f\u205f\u3000\ufeff"
)
_DECIMAL_RE = re.compile(
    r"([+-]?)([0-9]*)(?:\.([0-9]*))?(?:[eE]([+-]?[0-9]+))?", re.ASCII
)
_ZERO = Fraction(0)
_ONE = Fraction(1)
_OPEN = object()


def _parse_decimal(value: object, field: str) -> Fraction:
    """Parse a decimal string, `int` or `Decimal` into an exact `Fraction`.

    Accepted text is `[+-]digits[.digits][e[+-]digits]` with ASCII digits, no
    spaces. There is no size limit. A value so large that Python cannot build it
    raises `SettlementResourceError`. Python also limits integer text to 4300
    digits; longer text is reported as a resource error, which the browser
    solver does not share.
    """
    if isinstance(value, bool) or not isinstance(value, (str, int, Decimal)):
        raise SettlementError(f"Invalid monetary value for {field}: {value!r}")
    try:
        text = str(value)
    except ValueError as exc:
        raise SettlementResourceError(f"Monetary value too large for {field}.") from exc
    match = _DECIMAL_RE.fullmatch(text)
    if match is None:
        raise SettlementError(f"Invalid monetary value for {field}: {value!r}")
    sign, whole, frac, exp = match.groups()
    whole, frac = whole or "", frac or ""
    if not whole + frac:
        raise SettlementError(f"Invalid monetary value for {field}: {value!r}")
    try:
        digits = int(whole + frac)
        if digits == 0:
            return _ZERO
        shift = (int(exp) if exp else 0) - len(frac)
        number = (
            Fraction(digits * 10**shift) if shift >= 0 else Fraction(digits, 10**-shift)
        )
    except (ValueError, OverflowError, MemoryError) as exc:
        raise SettlementResourceError(f"Monetary value too large for {field}.") from exc
    return -number if sign == "-" else number


def to_cents(value: Decimal | int | str) -> int:
    """Convert a money-like value to integer cents, half away from zero.

    Legacy helper. Accepts `str`, `int` and `Decimal`; `float` is rejected
    because it cannot hold decimal money exactly. Prefer exact decimal strings
    with `solve_payload` so that amounts are not rounded one by one.
    """
    text: object = value.strip() if isinstance(value, str) else value
    try:
        exact = _parse_decimal(text, "value") * 100
    except SettlementResourceError:
        raise
    except SettlementError as exc:
        raise SettlementError(f"Invalid monetary value: {value!r}") from exc
    twice = 2 * abs(exact.numerator) + exact.denominator
    rounded = twice // (2 * exact.denominator)
    return -rounded if exact < 0 else rounded


def _format_cents(cents: int) -> str:
    whole, rest = divmod(abs(cents), 100)
    try:
        return f"{'-' if cents < 0 else ''}{whole}.{rest:02d}"
    except ValueError as exc:
        raise SettlementResourceError("Amount has too many digits to format.") from exc


def cents_to_decimal(cents: int) -> Decimal:
    """Return `cents / 100` as an exact `Decimal` with two decimals."""
    return Decimal(_format_cents(cents))


def _clean_name(name: object) -> str:
    if not isinstance(name, str):
        raise SettlementError("Participant names must be text.")
    cleaned = unicodedata.normalize("NFC", name).strip(_NAME_WHITESPACE)
    if not cleaned:
        raise SettlementError("Participant names must be non-empty.")
    return cleaned


@dataclass(frozen=True)
class _Person:
    name: str
    spent: Fraction
    pay: Fraction
    get: Fraction


def _balanced_nets(
    people: Sequence[_Person], multiplier: Fraction
) -> tuple[list[NetBalance], bool]:
    """Round exact nets to cents so they sum to zero, each within one cent.

    The exact net of person i is
    `multiplier * (spent_i - total_spent / N + extra_get_i - extra_pay_i)`.
    Conservation (`sum extra_get == sum extra_pay`) is checked before the
    multiplier. Every net (in cents) is floored; the missing cents go to the
    largest fractional remainders, ties by name in code point order.

    Returns the balances and whether any exact net was not a whole cent.
    """
    if not people:
        raise SettlementError("At least one participant is required.")
    seen: set[str] = set()
    for person in people:
        if person.name in seen:
            raise SettlementError(f"Duplicate participant name: {person.name}")
        seen.add(person.name)
        if person.spent < 0:
            raise SettlementError(
                f"'spent' cannot be negative for participant: {person.name}"
            )
    if sum((p.pay for p in people), _ZERO) != sum((p.get for p in people), _ZERO):
        raise SettlementError(
            "Infeasible adjustments: total extra_get must equal total extra_pay."
        )
    share = sum((p.spent for p in people), _ZERO) / len(people)
    ideals = [100 * multiplier * (p.spent - share + p.get - p.pay) for p in people]
    floors = [v.numerator // v.denominator for v in ideals]
    missing = -sum(floors)
    if not 0 <= missing < len(people):
        raise SettlementError("Internal error: balances do not sum to zero.")
    order = sorted(
        range(len(people)), key=lambda k: (-(ideals[k] - floors[k]), people[k].name)
    )
    for k in order[:missing]:
        floors[k] += 1
    notice = any(v.denominator != 1 for v in ideals)
    return [NetBalance(p.name, c) for p, c in zip(people, floors)], notice


def _people_from_cents(members: Sequence[PartyMember]) -> list[_Person]:
    return [
        _Person(
            _clean_name(m.name),
            Fraction(m.spent_cents, 100),
            Fraction(m.extra_pay_cents, 100),
            Fraction(m.extra_get_cents, 100),
        )
        for m in members
    ]


def compute_net_balances(members: Sequence[PartyMember]) -> list[NetBalance]:
    """Compute balanced nearest-cent net positions from integer-cent members."""
    return _balanced_nets(_people_from_cents(members), _ONE)[0]


_Payer = tuple[int, int, int]  # (remaining cents, preferred 0/1, already sent 0/1)


def _closed_form(
    payers: Sequence[_Payer], receivers: Sequence[int], strict: bool
) -> Any:
    """Exact (count, penalty) when one side has a single party; `None` if infeasible.

    Returns `_OPEN` when both sides have at least two active parties.
    """
    count = len(payers)
    if count == 0:
        return (0, 0)
    if count == 1:
        _, preferred, sent = payers[0]
        edges = len(receivers)
        if preferred:
            return (edges, 0)
        if strict:
            return None if sent + edges > 1 else (edges, 0)
        return (edges, edges if sent else edges - 1)
    if len(receivers) == 1:
        extra = sum(1 for _, preferred, sent in payers if sent and not preferred)
        if strict and extra:
            return None
        return (count, extra)
    return _OPEN


def _moves(payers: Sequence[_Payer], receivers: Sequence[int]) -> list[tuple[int, int]]:
    firsts_p = [i for i in range(len(payers)) if i == 0 or payers[i] != payers[i - 1]]
    firsts_r = [
        j for j in range(len(receivers)) if j == 0 or receivers[j] != receivers[j - 1]
    ]
    return [(i, j) for i in firsts_p for j in firsts_r]


def _apply_move(
    payers: tuple[_Payer, ...], receivers: tuple[int, ...], i: int, j: int
) -> tuple[tuple[_Payer, ...], tuple[int, ...]]:
    amount, preferred, _ = payers[i]
    need = receivers[j]
    moved = min(amount, need)
    new_p = payers[:i] + payers[i + 1 :]
    if amount > moved:
        new_p = tuple(sorted(new_p + ((amount - moved, preferred, 1),)))
    new_r = receivers[:j] + receivers[j + 1 :]
    if need > moved:
        new_r = tuple(sorted(new_r + (need - moved,)))
    return new_p, new_r


def _fill_memo(
    start_p: tuple[_Payer, ...],
    start_r: tuple[int, ...],
    strict: bool,
    memo: dict[tuple, Any],
) -> None:
    """Iterative depth-first search that stores the best first move per state."""
    stack: list[list[Any]] = [[start_p, start_r, _moves(start_p, start_r), 0, None]]
    while stack:
        frame = stack[-1]
        payers, receivers, moves = frame[0], frame[1], frame[2]
        descended = False
        while frame[3] < len(moves):
            i, j = moves[frame[3]]
            _, preferred, sent = payers[i]
            cost = 1 if (sent and not preferred) else 0
            if strict and cost:
                frame[3] += 1
                continue
            next_p, next_r = _apply_move(payers, receivers, i, j)
            best = frame[4]
            if best is not None and 1 + max(len(next_p), len(next_r)) > best[0]:
                frame[3] += 1
                continue
            value = _closed_form(next_p, next_r, strict)
            if value is _OPEN:
                value = memo.get((next_p, next_r), _OPEN)
                if value is _OPEN:
                    stack.append([next_p, next_r, _moves(next_p, next_r), 0, None])
                    descended = True
                    break
            frame[3] += 1
            if value is None:
                continue
            count, penalty = 1 + value[0], cost + value[1]
            if best is None or (count, penalty) < (best[0], best[1]):
                frame[4] = (count, penalty, i, j)
        if descended:
            continue
        memo[(payers, receivers)] = frame[4]
        stack.pop()


def optimize_transfers(
    balances: Sequence[NetBalance],
    preferred_multi_payers: Sequence[str] | None = None,
    strict_preference: bool = False,
) -> tuple[list[Transfer], int]:
    """Find transfers with the fewest transactions, then the lowest burden penalty.

    The penalty counts, for each payer outside `preferred_multi_payers`, the
    outgoing transfers beyond the first. With `strict_preference` such payers may
    send only one transfer. Preferred names that are not payers are ignored. The
    result depends on the (name, cents) pairs only, not on their order. Ties are
    resolved by the first move in a fixed canonical order. The search is exact and
    has no size limit, so its run time can grow exponentially with the number of
    payers and receivers.

    Raises
    ------
    SettlementError
        For invalid balances or when no strict plan exists.
    SettlementResourceError
        When the search runs out of memory (no conclusion about feasibility).
    """
    seen: set[str] = set()
    payers: list[tuple[str, int]] = []
    receivers: list[tuple[str, int]] = []
    total = 0
    for balance in balances:
        name = _clean_name(balance.name)
        if name in seen:
            raise SettlementError(f"Duplicate participant name: {name}")
        seen.add(name)
        total += balance.cents
        if balance.cents < 0:
            payers.append((name, -balance.cents))
        elif balance.cents > 0:
            receivers.append((name, balance.cents))
    if total != 0:
        raise SettlementError("Internal mismatch: payer and receiver totals differ.")
    if not payers:
        return [], 0
    wanted = {_clean_name(name) for name in (preferred_multi_payers or [])}
    actual_p = sorted((amount, int(name in wanted), 0, name) for name, amount in payers)
    actual_r = sorted((amount, name) for name, amount in receivers)
    start_p = tuple(entry[:3] for entry in actual_p)
    start_r = tuple(entry[0] for entry in actual_r)
    memo: dict[tuple, Any] = {}
    try:
        root = _closed_form(start_p, start_r, strict_preference)
        if root is _OPEN:
            _fill_memo(start_p, start_r, strict_preference, memo)
            root = memo[(start_p, start_r)]
    except (MemoryError, RecursionError) as exc:
        raise SettlementResourceError(
            "The search ran out of resources; no feasibility conclusion is possible."
        ) from exc
    if root is None:
        raise SettlementInfeasibleError(
            "No feasible settlement found with current strict preference constraints."
        )

    transfers: list[Transfer] = []
    while actual_p:
        if len(actual_p) == 1:
            payer = actual_p[0][3]
            transfers.extend(Transfer(payer, name, need) for need, name in actual_r)
            break
        if len(actual_r) == 1:
            receiver = actual_r[0][1]
            transfers.extend(Transfer(e[3], receiver, e[0]) for e in actual_p)
            break
        key = (tuple(e[:3] for e in actual_p), tuple(e[0] for e in actual_r))
        _, _, i, j = memo[key]
        amount, preferred, _, payer = actual_p[i]
        need, receiver = actual_r[j]
        moved = min(amount, need)
        transfers.append(Transfer(payer, receiver, moved))
        actual_p = actual_p[:i] + actual_p[i + 1 :]
        if amount > moved:
            actual_p = sorted(actual_p + [(amount - moved, preferred, 1, payer)])
        actual_r = actual_r[:j] + actual_r[j + 1 :]
        if need > moved:
            actual_r = sorted(actual_r + [(need - moved, receiver)])
    transfers.sort(key=lambda t: (t.payer, t.receiver))
    return transfers, int(root[1])


def _solve_people(
    people: Sequence[_Person],
    multiplier: Fraction,
    preferred: Sequence[str],
    strict: bool,
) -> SettlementComputation:
    balances, notice = _balanced_nets(people, multiplier)
    transfers, penalty = optimize_transfers(balances, preferred, strict)
    return SettlementComputation(balances, transfers, len(transfers), penalty, notice)


def solve_settlement(
    members: Sequence[PartyMember],
    preferred_multi_payers: Sequence[str] | None = None,
    strict_preference: bool = False,
) -> SettlementComputation:
    """Solve a settlement from integer-cent members (no multiplier)."""
    return _solve_people(
        _people_from_cents(members),
        _ONE,
        preferred_multi_payers or [],
        strict_preference,
    )


def _people_from_source(members: Sequence[SourceMember]) -> list[_Person]:
    return [
        _Person(
            _clean_name(m.name),
            _parse_decimal(m.spent, "spent"),
            _parse_decimal(m.extra_pay, "extra_pay"),
            _parse_decimal(m.extra_get, "extra_get"),
        )
        for m in members
    ]


def _parse_multiplier(value: object) -> Fraction:
    factor = _parse_decimal(value, "multiplier")
    if factor <= 0:
        raise SettlementError("multiplier must be greater than 0")
    return factor


def solve_source_settlement(
    members: Sequence[SourceMember],
    multiplier: str | int | Decimal = 1,
    preferred_multi_payers: Sequence[str] | None = None,
    strict_preference: bool = False,
) -> SettlementComputation:
    """Solve from exact source amounts; the multiplier scales the exact nets."""
    return _solve_people(
        _people_from_source(members),
        _parse_multiplier(multiplier),
        preferred_multi_payers or [],
        strict_preference,
    )


def _to_dict(result: SettlementComputation) -> dict[str, object]:
    return {
        "summary": {
            "transactions": result.transaction_count,
            "burden_penalty": result.burden_penalty,
        },
        "balances": [
            {
                "name": b.name,
                "net": _format_cents(b.cents),
                "role": "payer"
                if b.cents < 0
                else "receiver"
                if b.cents > 0
                else "settled",
            }
            for b in result.balances
        ],
        "transfers": [
            {"from": t.payer, "to": t.receiver, "amount": _format_cents(t.cents)}
            for t in result.transfers
        ],
        "rounding_notice": result.rounding_notice,
    }


def _default(value: object, fallback: object) -> object:
    return fallback if value is None or value == "" else value


def solve_payload(payload: Mapping[str, object]) -> dict[str, object]:
    """Solve a JSON-style payload and return the same dict as the browser solver.

    Keys: `people` (items with `name`, `spent`, `extra_pay`, `extra_get`),
    `multiplier`, `preferred_multi_payers`, `strict_preference`. Amounts should be
    decimal strings; missing or empty amounts mean 0 and an empty multiplier means
    1. When the multiplier is not 1, the result also holds `original`, solved
    independently with multiplier 1. Each multiplied view holds its own plan or
    `error` when its strict plan is infeasible. Invalid inputs and resource
    failures raise instead.
    """
    if not isinstance(payload, Mapping):
        raise SettlementError("Payload must be an object.")
    raw_people = payload.get("people")
    if not isinstance(raw_people, (list, tuple)):
        raise SettlementError("'people' must be a list.")
    members: list[SourceMember] = []
    for item in raw_people:
        if not isinstance(item, Mapping):
            raise SettlementError("Each participant must be an object.")
        members.append(
            SourceMember(
                name=item.get("name"),  # type: ignore[arg-type]
                spent=_default(item.get("spent"), 0),  # type: ignore[arg-type]
                extra_pay=_default(item.get("extra_pay"), 0),  # type: ignore[arg-type]
                extra_get=_default(item.get("extra_get"), 0),  # type: ignore[arg-type]
            )
        )
    preferred = payload.get("preferred_multi_payers") or []
    if not isinstance(preferred, (list, tuple)) or not all(
        isinstance(name, str) for name in preferred
    ):
        raise SettlementError("'preferred_multi_payers' must be a list of names.")
    strict = payload.get("strict_preference", False)
    if not isinstance(strict, bool):
        raise SettlementError("'strict_preference' must be true or false.")
    factor = _parse_multiplier(_default(payload.get("multiplier"), 1))
    people = _people_from_source(members)
    if factor == 1:
        return _to_dict(_solve_people(people, _ONE, preferred, strict))
    result = _view(people, factor, preferred, strict)
    result["original"] = _view(people, _ONE, preferred, strict)
    return result


def _view(
    people: Sequence[_Person],
    multiplier: Fraction,
    preferred: Sequence[str],
    strict: bool,
) -> dict[str, object]:
    """Return one view of a multiplied payload: its plan, or its own error.

    Only a strict no-plan result becomes ``{"error": {...}}``. Invalid input and
    resource failures still raise, so no view reports a false "infeasible".
    """
    try:
        return _to_dict(_solve_people(people, multiplier, preferred, strict))
    except SettlementInfeasibleError as exc:
        return {"error": {"message": str(exc), "resource": False}}
