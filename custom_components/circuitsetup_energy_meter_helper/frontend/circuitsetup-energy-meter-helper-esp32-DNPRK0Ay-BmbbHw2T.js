import { R as h } from "./circuitsetup-energy-meter-helper-install-dialog-im156JnI-B7RvV7QK.js";
import "./circuitsetup-energy-meter-helper-styles-sT2V1cOw-CuhdIKie.js";
let r = class extends h {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32", this.IMAGE_CHIP_ID = 0, this.EFUSE_RD_REG_BASE = 1073061888, this.DR_REG_SYSCON_BASE = 1073111040, this.UART_CLKDIV_REG = 1072955412, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612856, this.XTAL_CLK_DIVIDER = 1, this.IROM_MAP_START = 1074593792, this.IROM_MAP_END = 1077936128, this.DROM_MAP_START = 1061158912, this.DROM_MAP_END = 1065353216, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1061158912, 1065353216, "DROM"], [1065353216, 1069547520, "EXTRAM_DATA"], [1073217536, 1073225728, "RTC_DRAM"], [1073283072, 1073741824, "BYTE_ACCESSIBLE"], [1073405952, 1073741824, "DRAM"], [1073610752, 1073741820, "DIRAM_DRAM"], [1073741824, 1074200576, "IROM"], [1074200576, 1074233344, "CACHE_PRO"], [1074233344, 1074266112, "CACHE_APP"], [1074266112, 1074397184, "IRAM"], [1074397184, 1074528252, "DIRAM_IRAM"], [1074528256, 1074536448, "RTC_IRAM"], [1074593792, 1077936128, "IROM"], [1342177280, 1342185472, "RTC_DATA"]], this.FLASH_SIZES = { "1MB": 0, "2MB": 16, "4MB": 32, "8MB": 48, "16MB": 64, "32MB": 80, "64MB": 96, "128MB": 112 }, this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "26m": 1, "20m": 2 }, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 4096, this.SPI_REG_BASE = 1072963584, this.SPI_USR_OFFS = 28, this.SPI_USR1_OFFS = 32, this.SPI_USR2_OFFS = 36, this.SPI_W0_OFFS = 128, this.SPI_MOSI_DLEN_OFFS = 40, this.SPI_MISO_DLEN_OFFS = 44;
  }
  async readEfuse(i, s) {
    const e = this.EFUSE_RD_REG_BASE + 4 * s;
    return i.debug("Read efuse " + e), await i.readReg(e);
  }
  async getPkgVersion(i) {
    const s = await this.readEfuse(i, 3);
    let e = s >> 9 & 7;
    return e += (s >> 2 & 1) << 3, e;
  }
  async getChipRevision(i) {
    const s = await this.readEfuse(i, 3), e = await this.readEfuse(i, 5), t = await i.readReg(this.DR_REG_SYSCON_BASE + 124);
    return (s >> 15 & 1) != 0 ? (e >> 20 & 1) != 0 ? (t >> 31 & 1) != 0 ? 3 : 2 : 1 : 0;
  }
  async getChipDescription(i) {
    const s = ["ESP32-D0WDQ6", "ESP32-D0WD", "ESP32-D2WD", "", "ESP32-U4WDH", "ESP32-PICO-D4", "ESP32-PICO-V3-02"];
    let e = "";
    const t = await this.getPkgVersion(i), _ = await this.getChipRevision(i), a = _ == 3;
    return (1 & await this.readEfuse(i, 3)) != 0 && (s[0] = "ESP32-S0WDQ6", s[1] = "ESP32-S0WD"), a && (s[5] = "ESP32-PICO-V3"), e = t >= 0 && t <= 6 ? s[t] : "Unknown ESP32", !a || t !== 0 && t !== 1 || (e += "-V3"), e + " (revision " + _ + ")";
  }
  async getChipFeatures(i) {
    const s = ["Wi-Fi"], e = await this.readEfuse(i, 3);
    (2 & e) === 0 && s.push(" BT"), (1 & e) !== 0 ? s.push(" Single Core") : s.push(" Dual Core"), (8192 & e) !== 0 && ((4096 & e) !== 0 ? s.push(" 160MHz") : s.push(" 240MHz"));
    const t = await this.getPkgVersion(i);
    [2, 4, 5, 6].indexOf(t) !== -1 && s.push(" Embedded Flash"), t === 6 && s.push(" Embedded PSRAM"), (await this.readEfuse(i, 4) >> 8 & 31) !== 0 && s.push(" VRef calibration in efuse"), (e >> 14 & 1) !== 0 && s.push(" BLK3 partially reserved");
    const _ = 3 & await this.readEfuse(i, 6);
    return s.push(" Coding Scheme " + ["None", "3/4", "Repeat (UNSUPPORTED)", "Invalid"][_]), s;
  }
  async getCrystalFreq(i) {
    const s = await i.readReg(this.UART_CLKDIV_REG) & this.UART_CLKDIV_MASK, e = i.transport.baudrate * s / 1e6 / this.XTAL_CLK_DIVIDER;
    let t;
    return t = e > 33 ? 40 : 26, Math.abs(t - e) > 1 && i.info("WARNING: Unsupported crystal in use"), t;
  }
  _d2h(i) {
    const s = (+i).toString(16);
    return s.length === 1 ? "0" + s : s;
  }
  async readMac(i) {
    let s = await this.readEfuse(i, 1);
    s >>>= 0;
    let e = await this.readEfuse(i, 2);
    e >>>= 0;
    const t = new Uint8Array(6);
    return t[0] = e >> 8 & 255, t[1] = 255 & e, t[2] = s >> 24 & 255, t[3] = s >> 16 & 255, t[4] = s >> 8 & 255, t[5] = 255 & s, this._d2h(t[0]) + ":" + this._d2h(t[1]) + ":" + this._d2h(t[2]) + ":" + this._d2h(t[3]) + ":" + this._d2h(t[4]) + ":" + this._d2h(t[5]);
  }
};
export {
  r as ESP32ROM
};
