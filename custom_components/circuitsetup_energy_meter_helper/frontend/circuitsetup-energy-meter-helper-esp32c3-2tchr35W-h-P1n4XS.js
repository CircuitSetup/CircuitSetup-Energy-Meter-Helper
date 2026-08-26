import { ESP32ROM as s$2 } from "./circuitsetup-energy-meter-helper-esp32-DNPRK0Ay-DWAyJaNS.js";
import "./circuitsetup-energy-meter-helper-install-dialog-im156JnI-CM2eHnjj.js";
import "./circuitsetup-energy-meter-helper-styles-sT2V1cOw-CrAdtexe.js";
let s$1 = class s extends s$2 {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-C3", this.IMAGE_CHIP_ID = 5, this.EFUSE_BASE = 1610647552, this.MAC_EFUSE_REG = this.EFUSE_BASE + 68, this.UART_CLKDIV_REG = 1072955412, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612860, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 0, this.SPI_REG_BASE = 1610620928, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1115684864, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1006632960, 1015021568, "DROM"], [1070071808, 1070465024, "DRAM"], [1070104576, 1070596096, "BYTE_ACCESSIBLE"], [1072693248, 1072824320, "DROM_MASK"], [1073741824, 1074135040, "IROM_MASK"], [1107296256, 1115684864, "IROM"], [1077395456, 1077805056, "IRAM"], [1342177280, 1342185472, "RTC_IRAM"], [1342177280, 1342185472, "RTC_DRAM"], [1611653120, 1611661312, "MEM_INTERNAL2"]];
  }
  async getPkgVersion(t) {
    const s2 = this.EFUSE_BASE + 68 + 12;
    return await t.readReg(s2) >> 21 & 7;
  }
  async getChipRevision(t) {
    const s2 = this.EFUSE_BASE + 68 + 12;
    return (await t.readReg(s2) & 7 << 18) >> 18;
  }
  async getMinorChipVersion(t) {
    const s2 = this.EFUSE_BASE + 68 + 20, i = await t.readReg(s2) >> 23 & 1, e = this.EFUSE_BASE + 68 + 12;
    return (i << 3) + (await t.readReg(e) >> 18 & 7);
  }
  async getMajorChipVersion(t) {
    const s2 = this.EFUSE_BASE + 68 + 20;
    return await t.readReg(s2) >> 24 & 3;
  }
  async getChipDescription(t) {
    const s2 = await this.getPkgVersion(t), i = await this.getMajorChipVersion(t), e = await this.getMinorChipVersion(t);
    return `${{ 0: "ESP32-C3 (QFN32)", 1: "ESP8685 (QFN28)", 2: "ESP32-C3 AZ (QFN32)", 3: "ESP8686 (QFN24)" }[s2] || "Unknown ESP32-C3"} (revision v${i}.${e})`;
  }
  async getFlashCap(t) {
    const s2 = this.EFUSE_BASE + 68 + 12;
    return await t.readReg(s2) >> 27 & 7;
  }
  async getFlashVendor(t) {
    const s2 = this.EFUSE_BASE + 68 + 16;
    return { 1: "XMC", 2: "GD", 3: "FM", 4: "TT", 5: "ZBIT" }[await t.readReg(s2) >> 0 & 7] || "";
  }
  async getChipFeatures(t) {
    const s2 = ["Wi-Fi", "BLE"], i = await this.getFlashCap(t), e = await this.getFlashVendor(t), a = { 0: null, 1: "Embedded Flash 4MB", 2: "Embedded Flash 2MB", 3: "Embedded Flash 1MB", 4: "Embedded Flash 8MB" }[i], E = void 0 !== a ? a : "Unknown Embedded Flash";
    return null !== a && s2.push(`${E} (${e})`), s2;
  }
  async getCrystalFreq(t) {
    return 40;
  }
  _d2h(t) {
    const s2 = (+t).toString(16);
    return 1 === s2.length ? "0" + s2 : s2;
  }
  async readMac(t) {
    let s2 = await t.readReg(this.MAC_EFUSE_REG);
    s2 >>>= 0;
    let i = await t.readReg(this.MAC_EFUSE_REG + 4);
    i = i >>> 0 & 65535;
    const e = new Uint8Array(6);
    return e[0] = i >> 8 & 255, e[1] = 255 & i, e[2] = s2 >> 24 & 255, e[3] = s2 >> 16 & 255, e[4] = s2 >> 8 & 255, e[5] = 255 & s2, this._d2h(e[0]) + ":" + this._d2h(e[1]) + ":" + this._d2h(e[2]) + ":" + this._d2h(e[3]) + ":" + this._d2h(e[4]) + ":" + this._d2h(e[5]);
  }
  getEraseSize(t, s2) {
    return s2;
  }
};
export {
  s$1 as ESP32C3ROM
};
