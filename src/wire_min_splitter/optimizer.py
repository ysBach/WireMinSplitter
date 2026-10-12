"""Calculate exact expense settlements with the Python reference solver.

The solver uses exact rational amounts. It rounds final balances to whole cents
with an allocation that keeps their sum zero.

Notes
-----
Each search step selects an active payer and receiver. It transfers the smaller
remaining amount.

A graph with the fewest transfers has no cycle. Moving money around a cycle can
remove a transfer without adding transfers or increasing any payer's outgoing
count. Thus, an optimal graph is a forest, a graph without cycles.

A nonempty forest has a leaf, a participant with one transfer. That transfer
carries the leaf's whole remaining amount. This amount is the smaller remaining
amount of the pair. Searching all payer/receiver pairs therefore reaches every
minimum-transfer plan, including plans subject to strict payment limits.

The search caches states as sorted multisets. Payers with equal amount, preferred
status, and previous-payment status are interchangeable. Merging these payers
preserves the optimum. Preferred and other payers remain separate because their
penalties differ.
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
    """Report a resource failure without concluding whether a plan exists."""


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
    """Store one participant's exact amounts before multiplication.

    Amounts must be decimal strings, `int`, or `Decimal`. The solver rejects
    `float` amounts.
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

    Text must contain ASCII digits and no spaces. It can include a sign, decimal
    point, and signed exponent. At least one digit must precede the exponent.
    The solver sets no size limit. If Python cannot construct the value, this
    function raises `SettlementResourceError`.

    Notes
    -----
    Python's default integer-text limit is 4300 digits. Exceeding its configured
    limit causes a resource error. The browser solver does not use this limit.
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
    """Convert an amount to integer cents, rounding halves away from zero.

    This legacy helper accepts `str`, `int`, and `Decimal`. It rejects `float`
    because binary floating-point values cannot preserve all decimal amounts.
    Prefer decimal strings with ``solve_payload()`` to avoid rounding each
    source amount separately.
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
    """Return ``cents / 100`` as an exact `Decimal` with two decimal places."""
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
    """Round exact balances to cents while keeping their sum zero.

    Each rounded balance differs from its exact value by less than one cent.
    The exact net of participant i is
    ``multiplier * (spent_i - total_spent / N + extra_get_i - extra_pay_i)``,
    where N is the participant count.

    The source totals of `extra_get` and `extra_pay` must match before
    multiplication. Round each exact balance down to whole cents. Allocate the
    remaining cents to the largest fractional remainders. Resolve equal
    remainders by name in Unicode code-point order.

    Return the balances and a flag for any exact balance that required rounding.
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
    """Compute net balances in cents with an allocation that keeps their sum zero."""
    return _balanced_nets(_people_from_cents(members), _ONE)[0]


_Payer = tuple[int, int, int]  # (remaining cents, preferred 0/1, already sent 0/1)


def _closed_form(
    payers: Sequence[_Payer], receivers: Sequence[int], strict: bool
) -> Any:
    """Return the optimum for an empty state or a single payer or receiver.

    Return `None` if no strict plan exists. Return `_OPEN` when both sides have
    at least two active participants and need a search.
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
    """Find the best first transfer per state with iterative depth-first search."""
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

    The penalty counts each nonpreferred payer's outgoing transfers beyond the
    first. With `strict_preference`, these payers can send only one transfer.
    The solver ignores preferred names that are not payers.

    The result depends on the name/cent pairs, not their order. The first move in
    a fixed canonical order resolves ties. The search is exact and has no size
    limit. Its run time can grow exponentially with the number of payers and
    receivers.

    Raises
    ------
    SettlementError
        For invalid balances or when no strict plan exists.
    SettlementResourceError
        If the search exhausts memory. This error does not conclude whether a
        plan exists.
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
    """Calculate a settlement from integer-cent amounts without a multiplier."""
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
    """Calculate a settlement after multiplying exact source balances."""
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
    """Calculate a settlement and return the browser solver's result format.

    The payload contains `people`, `multiplier`, `preferred_multi_payers`, and
    `strict_preference`. Each participant contains `name`, `spent`, `extra_pay`,
    and `extra_get`.

    Send amounts as decimal strings. Missing or empty amounts mean 0. A missing
    or empty multiplier means 1.

    A multiplier other than 1 adds `original`, calculated independently with
    multiplier 1. Each multiplied view contains its own plan or strict-mode
    `error`. Invalid inputs and resource failures raise exceptions.
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
    """Return a multiplied view's plan or its own strict-mode error.

    Only a strict no-plan result becomes ``{"error": {...}}``. Invalid inputs
    and resource failures raise exceptions. They do not indicate infeasibility.
    """
    try:
        return _to_dict(_solve_people(people, multiplier, preferred, strict))
    except SettlementInfeasibleError as exc:
        return {"error": {"message": str(exc), "resource": False}}
