"""The reload endpoint preserves the reviewed transaction's public DTO."""

import asyncio
from typing import Any

import test_websocket_api as api_tests

from custom_components.circuitsetup_energy_meter_helper.config_transaction import (
    ConfigTransactionState,
    TransactionStatus,
)
from custom_components.circuitsetup_energy_meter_helper.const import DOMAIN
from custom_components.circuitsetup_energy_meter_helper.models import SubstitutionChange


def test_active_work_preserves_only_the_nested_transaction_change_identity() -> None:
    async def run() -> None:
        hass = api_tests.FakeHass()
        await api_tests.async_setup_entry(hass, api_tests.FakeEntry(data={}))
        controller = hass.data[DOMAIN]["helper"]["websocket_controller"]
        transaction = TransactionStatus(
            "transaction",
            ConfigTransactionState.VALIDATED,
            "a" * 64,
            (SubstitutionChange("ct1_name", "CT 1", "Kitchen"),),
            "Reviewed CT rename",
        )

        async def call(*args: Any) -> Any:
            return {
                "transaction": transaction,
                "session": {
                    "changes": [{"key": "channel.1.name", "password": "private"}]
                },
                "verified_calibration": None,
                "api_key": "private",
            }

        controller.async_call = call
        connection = api_tests.FakeConnection()
        await api_tests._invoke(
            hass, connection, api_tests._message(f"{DOMAIN}/get_active_work", 1)
        )
        result = connection.results[-1][1]
        assert result["transaction"]["changes"] == [
            {"key": "channel.1.name", "old_value": "CT 1", "new_value": "Kitchen"}
        ]
        assert result["session"]["changes"] == [{}]
        assert "private" not in repr(result)
        await api_tests._invoke(
            hass, connection, api_tests._message(f"{DOMAIN}/get_diagnostics_summary", 2)
        )
        assert "key" not in connection.results[-1][1]["transaction"]["changes"][0]

    asyncio.run(run())
