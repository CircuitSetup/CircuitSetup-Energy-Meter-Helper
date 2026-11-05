// Appended to upstream's calibration_register_verification_test.cpp by the contract job.
#ifdef USE_HOST
#include <fstream>

namespace esphome::atm90e32::testing {

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
  const auto success = capture_calibration_logs([&]() { component.run_gain_calibrations(); });
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
  const auto clear = capture_calibration_logs([&]() {
    component.clear_gain_calibrations();
    component.dump_config();
  });
  EXPECT_FALSE(component.*Access::GAIN.has_stored);
  EXPECT_FALSE(component.*Access::GAIN.restored);
  EXPECT_TRUE(component.*Access::OFFSET.restored);
  EXPECT_TRUE(component.*Access::POWER_OFFSET.restored);
  emit("gain_clear.log", clear);

  // Keep the terminal failure and later subscription dump separate: either can arrive alone.
  Access failed;
  failed.component.set_instance_id("meter_main1");
  failed.component.set_enable_gain_calibration(true);
  failed.prepare_finish(Access::GAIN);
  save_values(failed.preference(Access::GAIN), Access::GAIN, SavedValue::SAVED_VALUE_OLD);
  failed.set_state(Access::GAIN, true, true);
  failed.delegate.corrupt_calibration_writes();
  const auto rollback = capture_calibration_logs([&]() { failed.component.run_gain_calibrations(); });
  ASSERT_NE(rollback.find("rollback readback verification failed"), std::string::npos);
  emit("gain_rollback_failure.log", rollback);
  const auto reconnect = capture_calibration_logs([&]() { failed.component.dump_config(); });
  EXPECT_EQ(reconnect.find("Gain calibration loaded and verified successfully."), std::string::npos);
  emit("gain_rollback_dump.log", reconnect);
}

}  // namespace esphome::atm90e32::testing
#endif
