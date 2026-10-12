from __future__ import annotations

import itertools

import pytest

from wire_min_splitter.optimizer import (
    NetBalance,
    PartyMember,
    SettlementError,
    SettlementInfeasibleError,
    SettlementResourceError,
    compute_net_balances,
    optimize_transfers,
    solve_payload,
    solve_settlement,
    to_cents,
)


def _balances(cents: list[int]) -> list[NetBalance]:
    return [NetBalance(name=f"n{i}", cents=c) for i, c in enumerate(cents)]


def test_balances_use_balanced_nearest_cent_allocation() -> None:
    members = [
        PartyMember(name="Alice", spent_cents=10_000),
        PartyMember(name="Bob"),
        PartyMember(name="Cara"),
    ]

    amounts = {b.name: b.cents for b in compute_net_balances(members)}

    assert amounts == {"Alice": 6_667, "Bob": -3_333, "Cara": -3_334}


def test_identical_inputs_may_differ_by_one_cent_only() -> None:
    members = [PartyMember(name="human 01", spent_cents=15_100)] + [
        PartyMember(name=f"human {i:02d}") for i in range(2, 10)
    ]

    amounts = {b.name: b.cents for b in compute_net_balances(members)}

    assert amounts["human 01"] == 13_423
    assert amounts["human 02"] == -1_677
    assert {amounts[f"human {i:02d}"] for i in range(3, 10)} == {-1_678}
    assert sum(amounts.values()) == 0


def test_balances_do_not_depend_on_row_order() -> None:
    members = [
        PartyMember(name=n, spent_cents=s) for n, s in [("a", 1), ("b", 0), ("c", 0)]
    ]

    expected = {b.name: b.cents for b in compute_net_balances(members)}
    for order in itertools.permutations(members):
        assert {b.name: b.cents for b in compute_net_balances(order)} == expected


def test_optimize_transfers_minimizes_transaction_count() -> None:
    transfers, penalty = optimize_transfers(_balances([-5_000, -3_000, 4_000, 4_000]))

    assert len(transfers) == 3
    assert penalty == 1
    assert sum(t.cents for t in transfers) == 8_000


@pytest.mark.parametrize("strict", [False, True])
def test_preferred_payer_splits_for_free(strict: bool) -> None:
    transfers, penalty = optimize_transfers(
        _balances([-200, -200, -200, 300, 300]), ["n0"], strict
    )

    assert len(transfers) == 4
    assert penalty == 0
    assert sum(1 for t in transfers if t.payer == "n0") == 2


def test_strict_preference_without_preferred_payer_is_infeasible() -> None:
    with pytest.raises(SettlementError, match="No feasible settlement"):
        optimize_transfers(_balances([-200, -200, -200, 300, 300]), [], True)


def test_non_payer_preferred_name_is_ignored() -> None:
    result = solve_settlement(
        [
            PartyMember(name="Alice", spent_cents=12_000),
            PartyMember(name="Bob"),
            PartyMember(name="Cara"),
        ],
        preferred_multi_payers=["Alice"],
    )

    assert result.transaction_count == 2


def test_one_creditor_with_many_debtors_needs_no_deep_recursion() -> None:
    members = [PartyMember(name="Payer", spent_cents=100_100)] + [
        PartyMember(name=f"p{i}") for i in range(1000)
    ]

    assert solve_settlement(members).transaction_count == 1000


def test_to_cents_rounds_half_away_and_rejects_float_and_text() -> None:
    assert to_cents("0.005") == 1
    assert to_cents("-0.005") == -1
    with pytest.raises(SettlementError, match="Invalid monetary value"):
        to_cents(1.5)  # type: ignore[arg-type]
    with pytest.raises(SettlementError, match="Invalid monetary value"):
        to_cents("not-a-number")


def test_payload_conserves_adjustments_before_the_multiplier() -> None:
    people = [{"name": "A", "extra_get": "0.004"}, {"name": "B", "extra_pay": "0.003"}]

    with pytest.raises(SettlementError, match="Infeasible adjustments"):
        solve_payload({"people": people, "multiplier": "1000"})


def test_payload_original_is_solved_without_the_multiplier() -> None:
    people = [{"name": "A", "spent": "10.01"}, {"name": "B"}, {"name": "C"}]

    multiplied = solve_payload({"people": people, "multiplier": "1.005"})
    plain = solve_payload({"people": people})

    assert multiplied["original"] == plain
    assert "original" not in plain
    assert multiplied["rounding_notice"] is True


def test_payload_rejects_non_boolean_strict_and_float_money() -> None:
    with pytest.raises(SettlementError, match="strict_preference"):
        solve_payload({"people": [{"name": "A"}], "strict_preference": "false"})
    with pytest.raises(SettlementError, match="Invalid monetary value"):
        solve_payload({"people": [{"name": "A", "spent": 1.5}]})


def test_huge_values_stay_exact() -> None:
    result = solve_payload({"people": [{"name": "A", "spent": "1e26"}, {"name": "B"}]})

    assert result["transfers"] == [
        {"from": "B", "to": "A", "amount": "50000000000000000000000000.00"}
    ]


def test_unreadably_long_integer_is_a_resource_error() -> None:
    with pytest.raises(SettlementResourceError):
        solve_payload({"people": [{"name": "A", "spent": "9" * 5000}, {"name": "B"}]})


def _strict_payload(spent: list[int], multiplier: str) -> dict[str, object]:
    return {
        "people": [{"name": f"P{i}", "spent": str(s)} for i, s in enumerate(spent)],
        "multiplier": multiplier,
        "strict_preference": True,
    }


def test_each_view_shows_its_own_plan_or_error() -> None:
    converted_only = solve_payload(_strict_payload([2, 3, 3], ".01"))
    assert "error" not in converted_only
    assert list(converted_only["original"]) == ["error"]  # type: ignore[call-overload]
    assert converted_only["original"]["error"]["resource"] is False  # type: ignore[index]

    original_only = solve_payload(_strict_payload([3, 2, 9, 1, 5, 0], "1.1"))
    assert list(original_only) == ["error", "original"]
    assert original_only["original"]["transfers"]  # type: ignore[index]


def test_infeasible_without_multiplier_raises_infeasible_error() -> None:
    with pytest.raises(SettlementInfeasibleError):
        solve_payload(_strict_payload([2, 3, 3], "1"))
