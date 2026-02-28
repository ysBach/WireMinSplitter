from __future__ import annotations

import pytest

from wire_min_splitter.optimizer import (
    NetBalance,
    PartyMember,
    SettlementError,
    compute_net_balances,
    optimize_transfers,
    solve_settlement,
    to_cents,
)


def test_compute_net_balances_distributes_remainder_cents() -> None:
    members = [
        PartyMember(name="Alice", spent_cents=10_000),
        PartyMember(name="Bob", spent_cents=0),
        PartyMember(name="Cara", spent_cents=0),
    ]

    balances = compute_net_balances(members)
    amounts = {item.name: item.cents for item in balances}

    assert amounts["Alice"] == 6_666
    assert amounts["Bob"] == -3_333
    assert amounts["Cara"] == -3_333
    assert sum(amounts.values()) == 0


def test_compute_net_balances_equalizes_identical_inputs() -> None:
    members = [
        PartyMember(name="human 01", spent_cents=15_100),
        PartyMember(name="human 02", spent_cents=0),
        PartyMember(name="human 03", spent_cents=0),
        PartyMember(name="human 04", spent_cents=0),
        PartyMember(name="human 05", spent_cents=0),
        PartyMember(name="human 06", spent_cents=0),
        PartyMember(name="human 07", spent_cents=0),
        PartyMember(name="human 08", spent_cents=0),
        PartyMember(name="human 09", spent_cents=0),
    ]

    balances = compute_net_balances(members)
    amounts = {item.name: item.cents for item in balances}

    assert amounts["human 01"] == 13_424
    assert {amounts[f"human {idx:02d}"] for idx in range(2, 10)} == {-1_678}
    assert sum(amounts.values()) == 0


def test_optimize_transfers_minimizes_transaction_count() -> None:
    balances = [
        NetBalance(name="A", cents=-5_000),
        NetBalance(name="B", cents=-3_000),
        NetBalance(name="C", cents=4_000),
        NetBalance(name="D", cents=4_000),
    ]

    transfers, penalty = optimize_transfers(balances)

    assert len(transfers) == 3
    assert penalty == 1

    total_sent = sum(item.cents for item in transfers)
    assert total_sent == 8_000


def test_preferred_multi_payer_is_selected_when_strict() -> None:
    members = [
        PartyMember(name="Alice", spent_cents=0),
        PartyMember(name="Bob", spent_cents=0),
        PartyMember(name="R1", spent_cents=12_000),
        PartyMember(name="R2", spent_cents=9_000),
        PartyMember(name="R3", spent_cents=9_000),
    ]

    result = solve_settlement(
        members,
        preferred_multi_payers=["Alice"],
        strict_preference=True,
    )

    outgoing_counts = {"Alice": 0, "Bob": 0}
    for transfer in result.transfers:
        if transfer.payer in outgoing_counts:
            outgoing_counts[transfer.payer] += 1

    assert len(result.transfers) == 3
    assert outgoing_counts["Alice"] == 2
    assert outgoing_counts["Bob"] == 1


def test_strict_preference_without_allowed_multi_payer_can_fail() -> None:
    members = [
        PartyMember(name="Alice", spent_cents=0),
        PartyMember(name="Bob", spent_cents=0),
        PartyMember(name="R1", spent_cents=12_000),
        PartyMember(name="R2", spent_cents=9_000),
        PartyMember(name="R3", spent_cents=9_000),
    ]

    with pytest.raises(SettlementError, match="No feasible settlement"):
        solve_settlement(
            members,
            preferred_multi_payers=[],
            strict_preference=True,
        )


def test_to_cents_rejects_invalid_value() -> None:
    with pytest.raises(SettlementError, match="Invalid monetary value"):
        to_cents("not-a-number")


def test_non_payer_preferred_name_is_ignored() -> None:
    members = [
        PartyMember(name="Alice", spent_cents=12_000),
        PartyMember(name="Bob", spent_cents=0),
        PartyMember(name="Cara", spent_cents=0),
    ]

    result = solve_settlement(
        members,
        preferred_multi_payers=["Alice"],
        strict_preference=False,
    )

    assert result.transaction_count == 2
