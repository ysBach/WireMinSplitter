from __future__ import annotations

from decimal import Decimal
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field, field_validator

from wire_min_splitter.optimizer import (
    PartyMember,
    SettlementError,
    cents_to_decimal,
    solve_settlement,
    to_cents,
)


BASE_DIR = Path(__file__).resolve().parent


class ParticipantInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    spent: Decimal = Decimal("0")
    extra_pay: Decimal = Decimal("0")
    extra_get: Decimal = Decimal("0")

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("name must be non-empty")
        return trimmed

    @field_validator("spent", "extra_pay", "extra_get", mode="before")
    @classmethod
    def empty_string_to_zero(cls, value: object) -> object:
        if value == "":
            return "0"
        return value


class SettlementRequest(BaseModel):
    people: list[ParticipantInput] = Field(min_length=1)
    preferred_multi_payers: list[str] = Field(default_factory=list)
    strict_preference: bool = False
    multiplier: Decimal = Decimal("1")

    @field_validator("multiplier", mode="before")
    @classmethod
    def empty_multiplier_to_one(cls, value: object) -> object:
        if value == "":
            return "1"
        return value

    @field_validator("multiplier")
    @classmethod
    def validate_multiplier(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("multiplier must be greater than 0")
        return value


app = FastAPI(title="Wire-Min-Splitter")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/settle")
async def settle(payload: SettlementRequest) -> dict[str, object]:
    multiplier = payload.multiplier
    members = [
        PartyMember(
            name=item.name,
            spent_cents=to_cents(item.spent * multiplier),
            extra_pay_cents=to_cents(item.extra_pay * multiplier),
            extra_get_cents=to_cents(item.extra_get * multiplier),
        )
        for item in payload.people
    ]

    try:
        result = solve_settlement(
            members=members,
            preferred_multi_payers=payload.preferred_multi_payers,
            strict_preference=payload.strict_preference,
        )
    except SettlementError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    balances_json = []
    for balance in result.balances:
        amount = cents_to_decimal(balance.cents)
        if balance.cents < 0:
            role = "payer"
        elif balance.cents > 0:
            role = "receiver"
        else:
            role = "settled"

        balances_json.append(
            {
                "name": balance.name,
                "net": f"{amount:.2f}",
                "role": role,
            }
        )

    transfers_json = [
        {
            "from": transfer.payer,
            "to": transfer.receiver,
            "amount": f"{cents_to_decimal(transfer.cents):.2f}",
        }
        for transfer in result.transfers
    ]

    return {
        "summary": {
            "transactions": result.transaction_count,
            "burden_penalty": result.burden_penalty,
        },
        "balances": balances_json,
        "transfers": transfers_json,
    }
