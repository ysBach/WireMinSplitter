from __future__ import annotations

from fastapi.testclient import TestClient

from wire_min_splitter.main import app

client = TestClient(app)


def test_settle_returns_summary_balances_and_transfers() -> None:
    body = {"people": [{"name": "A", "spent": "1.00"}, {"name": "B"}, {"name": "C"}]}

    response = client.post("/api/settle", json=body)

    assert response.status_code == 200
    data = response.json()
    assert data["summary"] == {"transactions": 2, "burden_penalty": 0}
    assert [b["net"] for b in data["balances"]] == ["0.67", "-0.33", "-0.34"]


def test_float_money_is_rejected() -> None:
    response = client.post(
        "/api/settle", json={"people": [{"name": "A", "spent": 1.5}]}
    )

    assert response.status_code == 422


def test_invalid_amount_and_infeasible_strict_plan_return_400() -> None:
    bad = client.post("/api/settle", json={"people": [{"name": "A", "spent": "x"}]})
    people = [
        {"name": "A", "spent": "0"},
        {"name": "B"},
        {"name": "C", "extra_get": "1"},
    ]
    unbalanced = client.post("/api/settle", json={"people": people})

    assert bad.status_code == 400
    assert unbalanced.status_code == 400


def test_api_routes_win_over_static_files_and_home_is_served() -> None:
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/").status_code == 200


def test_infeasible_view_is_reported_inside_the_response() -> None:
    people = [{"name": f"P{i}", "spent": str(s)} for i, s in enumerate([2, 3, 3])]
    body = {"people": people, "multiplier": ".01", "strict_preference": True}

    response = client.post("/api/settle", json=body)

    assert response.status_code == 200
    assert response.json()["original"]["error"]["resource"] is False
