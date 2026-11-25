// Appended to upstream's calibration_register_verification_test.cpp by the contract job.
#ifdef USE_HOST
#include <fstream>

namespace esphome::atm90e32::testing {

// Exercise the same named-entity dispatch that ESPHome generates for its buttons.
class ContractButton : public EntityBase {
 public:
  explicit ContractButton(const char *name) { this->configure_entity_(name, 0, 0); }
};

TEST(ATM90E32HelperContract, EmitsProductionCalibrationTranscripts) {
  const char *directory = std::getenv("ATM90E32_CONTRACT_LOG_DIR");
  ASSERT_NE(directory, nullptr);
  fs::create_directories(directory);
  const auto emit = [&](const char *name, const std::string &output) {
    std::ofstream file(fs::path(directory) / name);
    ASSERT_TRUE(file.is_open());
    file << output;
    ASSERT_TRUE(file.good());
  };

  Access access;
  auto &component = access.component;
  component.set_instance_id("meter_main1");
  component.set_enable_gain_calibration(true);
  component.set_enable_offset_calibration(true);
  access.prepare_finish(Access::GAIN);
  for (uint8_t phase = 0; phase < 3; ++phase) {
    // The upstream fake retains LASTSPIDATA on reads; equal raw RMS samples keep validation exact.
    access.write16(ATM90E32_REGISTER_URMS + phase, 2500);
    access.write16(ATM90E32_REGISTER_IRMS + phase, 2500);
  }
  ContractButton run_gain("3. Run Main Meter 1 Gain Cal");
  const auto success = capture_calibration_logs([&]() {
    component.press_calibration_button(&run_gain, &ATM90E32Component::run_gain_calibrations);
  });
  ASSERT_NE(success.find("Gain calibration completed and verified."), std::string::npos);
  emit("gain_success.log", success);
  emit("gain_success_dump.log", capture_calibration_logs([&]() { component.dump_config(); }));

  emit("gain_restore_operation.log", capture_calibration_logs([&]() { access.restore(Access::GAIN); }));
  const auto restore = capture_calibration_logs([&]() { component.dump_config(); });
  ASSERT_NE(restore.find("Gain calibration loaded and verified successfully."), std::string::npos);
  emit("gain_restore.log", restore);

  for (const auto &kind : {Access::OFFSET, Access::POWER_OFFSET}) {
    save_values(access.make_preference(kind), kind, SavedValue::SAVED_VALUE_OLD);
    capture_calibration_logs([&]() { access.restore(kind); });
    ASSERT_TRUE(component.*kind.restored);
  }
  emit("restore_all.log", capture_calibration_logs([&]() { component.dump_config(); }));
  for (uint8_t phase = 0; phase < 3; ++phase) {
    component.set_volt_gain(phase, 7305);
    component.set_ct_gain(phase, 27961);
  }
  const auto clear = capture_calibration_logs([&]() {
    ContractButton clear_gain("z3. Clear Main Meter 1 Gain Cal");
    component.press_calibration_button(&clear_gain, &ATM90E32Component::clear_gain_calibrations);
  });
  EXPECT_FALSE(component.*Access::GAIN.has_stored);
  EXPECT_FALSE(component.*Access::GAIN.restored);
  EXPECT_TRUE(component.*Access::OFFSET.restored);
  EXPECT_TRUE(component.*Access::POWER_OFFSET.restored);
  emit("gain_clear.log", clear);
  emit("gain_clear_dump.log", capture_calibration_logs([&]() { component.dump_config(); }));

  for (bool power : {false, true}) {
    const auto &kind = power ? Access::POWER_OFFSET : Access::OFFSET;
    ContractButton clear_offsets(power ? "z2. Clear Main Meter 1 Power Offset Cal" : "z1. Clear Main Meter 1 Offset Cal");
    emit(power ? "power_offset_clear.log" : "offset_clear.log", capture_calibration_logs([&]() {
      component.press_calibration_button(&clear_offsets, kind.clear);
    }));
    ASSERT_FALSE(component.*kind.has_stored);

    for (uint8_t phase = 0; phase < 3; ++phase) {
      access.write16(ATM90E32_REGISTER_URMS + phase, 0);
      access.write16(ATM90E32_REGISTER_IRMS + phase, 0);
      access.write16(ATM90E32_REGISTER_URMSLSB + phase, (phase + 1) << 7);
      access.write16(ATM90E32_REGISTER_IRMSLSB + phase, (phase + 4) << 7);
      access.write16(ATM90E32_REGISTER_PMEANLSB + phase, phase + 7);
      access.write16(ATM90E32_REGISTER_QMEANLSB + phase, phase + 10);
    }
    ContractButton run_offsets(power ? "2. Run Main Meter 1 Power Offset Cal" : "1. Run Main Meter 1 Offset Cal");
    emit(power ? "power_offset_run.log" : "offset_run.log", capture_calibration_logs([&]() {
      component.press_calibration_button(&run_offsets, power ? &ATM90E32Component::run_power_offset_calibrations
                                                            : &ATM90E32Component::run_offset_calibrations);
      // Newer firmware defers sampling and verification until the offsets settle.
      for (unsigned tick = 0; tick < 4 && !(component.*kind.has_stored); ++tick) {
        App.scheduler.call(millis());
        if (!(component.*kind.has_stored))
          delay(1100);
      }
    }));
    ASSERT_TRUE(component.*kind.has_stored);
  }

  // Keep the terminal failure and later subscription dump separate: either can arrive alone.
  Access failed;
  failed.component.set_instance_id("meter_main1");
  failed.component.set_enable_gain_calibration(true);
  failed.prepare_finish(Access::GAIN);
  save_values(failed.preference(Access::GAIN), Access::GAIN, SavedValue::SAVED_VALUE_OLD);
  failed.set_state(Access::GAIN, true, true);
  failed.delegate.corrupt_calibration_writes();
  const auto rollback = capture_calibration_logs([&]() {
    failed.component.press_calibration_button(&run_gain, &ATM90E32Component::run_gain_calibrations);
  });
  ASSERT_NE(rollback.find("rollback readback verification failed"), std::string::npos);
  emit("gain_rollback_failure.log", rollback);
  const auto reconnect = capture_calibration_logs([&]() { failed.component.dump_config(); });
  EXPECT_EQ(reconnect.find("Gain calibration loaded and verified successfully."), std::string::npos);
  emit("gain_rollback_dump.log", reconnect);
  emit("gain_restore_failure.log", capture_calibration_logs([&]() { failed.restore(Access::GAIN); }));
}

}  // namespace esphome::atm90e32::testing
#endif
