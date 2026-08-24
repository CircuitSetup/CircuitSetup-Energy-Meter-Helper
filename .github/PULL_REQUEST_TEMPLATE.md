## Summary

-

## Verification

- [ ] `uv run ruff check .`
- [ ] `uv run mypy custom_components/circuitsetup_energy_meter_helper`
- [ ] `uv run pytest -q --cov=custom_components.circuitsetup_energy_meter_helper --cov-report=term-missing`
- [ ] `uv pip check`
- [ ] Frontend audit, typecheck, tests, build, and browser E2E checks are passing
- [ ] Home Assistant contract tests are passing when integration behavior changes
- [ ] Firmware contract checks are passing when firmware compatibility changes
- [ ] HACS and hassfest checks are passing

## Release Impact

- [ ] No release needed
- [ ] Patch release
- [ ] Minor release
- [ ] Major release or migration note needed

## Home Assistant Notes

- Affected platforms:
- Manual/live HA check performed:
- Restart/reload required:

## Merge Cleanup

- [ ] Delete this branch after merge
