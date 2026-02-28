from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Sequence


CENT = Decimal("0.01")
HUNDRED = Decimal("100")


class SettlementError(ValueError):
    """Raised when settlement inputs are invalid or infeasible."""


@dataclass(frozen=True)
class PartyMember:
    name: str
    spent_cents: int = 0
    extra_pay_cents: int = 0
    extra_get_cents: int = 0


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


@dataclass
class _BestSolution:
    tx_count: int
    penalty: int
    transfers: list[Transfer]


def to_cents(value: Decimal | float | int | str) -> int:
    """Convert a money-like value to integer cents."""
    try:
        dec = Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise SettlementError(f"Invalid monetary value: {value!r}") from exc

    if not dec.is_finite():
        raise SettlementError(f"Invalid monetary value: {value!r}")

    quantized = dec.quantize(CENT, rounding=ROUND_HALF_UP)
    return int((quantized * HUNDRED).to_integral_value(rounding=ROUND_HALF_UP))


def cents_to_decimal(cents: int) -> Decimal:
    return (Decimal(cents) / HUNDRED).quantize(CENT)


def _validate_members(members: Sequence[PartyMember]) -> None:
    if not members:
        raise SettlementError("At least one participant is required.")

    names_seen: set[str] = set()
    for member in members:
        name = member.name.strip()
        if not name:
            raise SettlementError("Participant names must be non-empty.")
        if name in names_seen:
            raise SettlementError(f"Duplicate participant name: {name}")
        names_seen.add(name)
        if member.spent_cents < 0:
            raise SettlementError(f"'spent' cannot be negative for participant: {name}")


def _equalize_identical_input_groups(
    members: Sequence[PartyMember], balances: Sequence[NetBalance]
) -> list[NetBalance]:
    """
    Keep participants with identical inputs on identical net values when possible.

    This avoids row-order artifacts (for example, two otherwise identical payers
    ending up one cent apart solely due to remainder distribution).
    """
    adjusted = [balance.cents for balance in balances]

    groups: dict[tuple[int, int, int], list[int]] = {}
    for idx, member in enumerate(members):
        key = (member.spent_cents, member.extra_pay_cents, member.extra_get_cents)
        groups.setdefault(key, []).append(idx)

    for indices in groups.values():
        if len(indices) < 2:
            continue

        values = [adjusted[idx] for idx in indices]
        low = min(values)
        high = max(values)
        if low == high:
            continue

        # Only normalize tiny rounding differences within the same role.
        if high - low > 1:
            continue
        signs = {0 if value == 0 else (1 if value > 0 else -1) for value in values}
        if len(signs) > 1:
            continue

        average = Decimal(sum(values)) / Decimal(len(values))
        target = int(average.to_integral_value(rounding=ROUND_HALF_UP))
        for idx in indices:
            adjusted[idx] = target

    total = sum(adjusted)
    if total != 0:
        if total < 0:
            absorber_index = max(
                range(len(adjusted)),
                key=lambda idx: (adjusted[idx], members[idx].spent_cents, -idx),
            )
            adjusted[absorber_index] += -total
        else:
            absorber_index = min(
                range(len(adjusted)),
                key=lambda idx: (adjusted[idx], -members[idx].spent_cents, idx),
            )
            adjusted[absorber_index] -= total

    return [
        NetBalance(name=balances[idx].name, cents=adjusted[idx])
        for idx in range(len(balances))
    ]


def compute_net_balances(members: Sequence[PartyMember]) -> list[NetBalance]:
    """Compute each participant's net position using equal split + adjustments."""
    _validate_members(members)

    total_spent = sum(member.spent_cents for member in members)
    participant_count = len(members)
    share_floor, remainder = divmod(total_spent, participant_count)

    balances: list[NetBalance] = []
    for index, member in enumerate(members):
        share = share_floor + (1 if index < remainder else 0)
        net_cents = (
            member.spent_cents
            + member.extra_get_cents
            - member.extra_pay_cents
            - share
        )
        balances.append(NetBalance(name=member.name.strip(), cents=net_cents))

    balances = _equalize_identical_input_groups(members, balances)

    total_net = sum(balance.cents for balance in balances)
    if total_net != 0:
        raise SettlementError(
            "Infeasible adjustments: total extra_get must equal total extra_pay."
        )

    return balances


def _penalty_for_outgoing(
    outgoing_counts: Sequence[int], payer_names: Sequence[str], preferred: set[str]
) -> int:
    penalty = 0
    for idx, transfer_count in enumerate(outgoing_counts):
        if transfer_count > 1 and payer_names[idx] not in preferred:
            penalty += transfer_count - 1
    return penalty


def _lower_bound_transactions(
    payer_remaining: Sequence[int], receiver_remaining: Sequence[int]
) -> int:
    payers_left = sum(1 for amount in payer_remaining if amount > 0)
    receivers_left = sum(1 for amount in receiver_remaining if amount > 0)
    return max(payers_left, receivers_left)


def optimize_transfers(
    balances: Sequence[NetBalance],
    preferred_multi_payers: Sequence[str] | None = None,
    strict_preference: bool = False,
) -> tuple[list[Transfer], int]:
    """Find transfers minimizing transaction count, then burden penalty."""
    preferred_requested = set(preferred_multi_payers or [])

    payers: list[tuple[str, int]] = []
    receivers: list[tuple[str, int]] = []
    for balance in balances:
        if balance.cents < 0:
            payers.append((balance.name, -balance.cents))
        elif balance.cents > 0:
            receivers.append((balance.name, balance.cents))

    if not payers and not receivers:
        return [], 0

    total_pay = sum(amount for _, amount in payers)
    total_receive = sum(amount for _, amount in receivers)
    if total_pay != total_receive:
        raise SettlementError("Internal mismatch: payer and receiver totals differ.")

    payer_name_set = {name for name, _ in payers}
    preferred = preferred_requested.intersection(payer_name_set)

    payer_names = [name for name, _ in payers]
    receiver_names = [name for name, _ in receivers]
    payer_remaining = [amount for _, amount in payers]
    receiver_remaining = [amount for _, amount in receivers]

    outgoing_counts = [0 for _ in payers]
    current_transfers: list[Transfer] = []
    best = _BestSolution(tx_count=10**9, penalty=10**9, transfers=[])

    def backtrack() -> None:
        nonlocal best

        transfer_count = len(current_transfers)
        lower_bound = transfer_count + _lower_bound_transactions(
            payer_remaining, receiver_remaining
        )
        if lower_bound > best.tx_count:
            return
        if transfer_count > best.tx_count:
            return

        next_payer_index = -1
        for idx, amount in enumerate(payer_remaining):
            if amount > 0:
                next_payer_index = idx
                break

        if next_payer_index == -1:
            penalty = _penalty_for_outgoing(outgoing_counts, payer_names, preferred)
            if transfer_count < best.tx_count or (
                transfer_count == best.tx_count and penalty < best.penalty
            ):
                best = _BestSolution(
                    tx_count=transfer_count,
                    penalty=penalty,
                    transfers=current_transfers.copy(),
                )
            return

        receiver_indices = [idx for idx, amount in enumerate(receiver_remaining) if amount > 0]
        receiver_indices.sort(key=lambda idx: receiver_remaining[idx], reverse=True)

        seen_receiver_amounts: set[int] = set()
        payer_name = payer_names[next_payer_index]

        for receiver_index in receiver_indices:
            receiver_amount = receiver_remaining[receiver_index]
            if receiver_amount in seen_receiver_amounts:
                continue
            seen_receiver_amounts.add(receiver_amount)

            proposed_count = outgoing_counts[next_payer_index] + 1
            if (
                strict_preference
                and proposed_count > 1
                and payer_name not in preferred
            ):
                continue

            transfer_amount = min(
                payer_remaining[next_payer_index], receiver_remaining[receiver_index]
            )
            payer_remaining[next_payer_index] -= transfer_amount
            receiver_remaining[receiver_index] -= transfer_amount
            outgoing_counts[next_payer_index] = proposed_count
            current_transfers.append(
                Transfer(
                    payer=payer_name,
                    receiver=receiver_names[receiver_index],
                    cents=transfer_amount,
                )
            )

            backtrack()

            current_transfers.pop()
            outgoing_counts[next_payer_index] -= 1
            receiver_remaining[receiver_index] += transfer_amount
            payer_remaining[next_payer_index] += transfer_amount

    backtrack()

    if best.tx_count == 10**9:
        raise SettlementError(
            "No feasible settlement found with current strict preference constraints."
        )

    return best.transfers, best.penalty


def solve_settlement(
    members: Sequence[PartyMember],
    preferred_multi_payers: Sequence[str] | None = None,
    strict_preference: bool = False,
) -> SettlementComputation:
    balances = compute_net_balances(members)
    transfers, penalty = optimize_transfers(
        balances=balances,
        preferred_multi_payers=preferred_multi_payers,
        strict_preference=strict_preference,
    )
    return SettlementComputation(
        balances=balances,
        transfers=transfers,
        transaction_count=len(transfers),
        burden_penalty=penalty,
    )
