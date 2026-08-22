# Hardware validation

Automated tests validate contracts only. None of the rows below has physical bench
evidence attached to this repository, so every row remains unchecked.

| Topology | Connection | Required validation | Bench evidence |
| --- | --- | --- | --- |
| Main only | Wi-Fi | Setup, name/preset update, CT1 and CT6 calibration | [ ] Not recorded |
| Main + 1 add-on | Wi-Fi | Topology 12, add-on package/entities, CT7 and CT12 calibration | [ ] Not recorded |
| Main + 3 add-ons | Special 2-voltage | Voltage-source grouping and CT24 | [ ] Not recorded |
| Main + 6 add-ons | Wi-Fi | 42-channel discovery/performance and CT42 | [ ] Not recorded |
| Main + add-ons | LilyGO Ethernet | Setup, install, reconnect | [ ] Not recorded |
| Main + add-ons | Waveshare Ethernet | Setup, install, reconnect | [ ] Not recorded |

Release blockers:

- HACS beta requires genuine main-only, one-add-on, and six-add-on hardware evidence.
- Stable requires every Ethernet and special-voltage row above.
- Web Installer publication is a separate external release gate; this repository
  cannot claim it complete.
