"""FastAPI reference server for the settlement solver and the static web app."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.staticfiles import StaticFiles
from pydantic import (
    BaseModel,
    Field,
    StrictBool,
    StrictInt,
    StrictStr,
    field_validator,
)

from wire_min_splitter.optimizer import (
    SettlementError,
    SettlementResourceError,
    solve_payload,
)


def find_web_dir() -> Path:
    """Return the web app directory: the packaged copy, else the repository one."""
    package_dir = Path(__file__).resolve().parent
    for candidate in (package_dir / "web", package_dir.parents[1] / "web"):
        if candidate.is_dir():
            return candidate
    raise RuntimeError("The web directory was not found.")


WEB_DIR = find_web_dir()


Money = StrictStr | StrictInt


class ParticipantInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    spent: Money = "0"
    extra_pay: Money = "0"
    extra_get: Money = "0"

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("name must be non-empty")
        return value

    @field_validator("spent", "extra_pay", "extra_get", mode="before")
    @classmethod
    def empty_string_to_zero(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return "0"
        return value


class SettlementRequest(BaseModel):
    """Request body. Money is a decimal string or an exact integer, never a float."""

    people: list[ParticipantInput] = Field(min_length=1)
    preferred_multi_payers: list[str] = Field(default_factory=list)
    strict_preference: StrictBool = False
    multiplier: Money = "1"

    @field_validator("multiplier", mode="before")
    @classmethod
    def empty_multiplier_to_one(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return "1"
        return value


app = FastAPI(title="Wire-Min-Splitter")


@app.get("/api/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/settle")
async def settle(payload: SettlementRequest) -> dict[str, object]:
    """Solve a settlement in a worker thread (the search can be CPU heavy)."""
    data = {
        "people": [
            {
                "name": item.name,
                "spent": str(item.spent),
                "extra_pay": str(item.extra_pay),
                "extra_get": str(item.extra_get),
            }
            for item in payload.people
        ],
        "preferred_multi_payers": payload.preferred_multi_payers,
        "strict_preference": payload.strict_preference,
        "multiplier": str(payload.multiplier),
    }
    try:
        return await run_in_threadpool(solve_payload, data)
    except SettlementResourceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except SettlementError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# Mounted last so that the /api routes above take precedence.
app.mount("/", StaticFiles(directory=str(WEB_DIR), html=True), name="web")
