import { ESP32ROM as h } from "./circuitsetup-energy-meter-helper-esp32-DNPRK0Ay-vAclOYbI.js";
import "./circuitsetup-energy-meter-helper-install-dialog-im156JnI-BNCTyjx2.js";
import "./circuitsetup-energy-meter-helper-styles-sT2V1cOw-50QkNMEY.js";
let F = class extends h {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-C3", this.IMAGE_CHIP_ID = 5, this.EFUSE_BASE = 1610647552, this.MAC_EFUSE_REG = this.EFUSE_BASE + 68, this.UART_CLKDIV_REG = 1072955412, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612860, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 0, this.SPI_REG_BASE = 1610620928, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1115684864, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1006632960, 1015021568, "DROM"], [1070071808, 1070465024, "DRAM"], [1070104576, 1070596096, "BYTE_ACCESSIBLE"], [1072693248, 1072824320, "DROM_MASK"], [1073741824, 1074135040, "IROM_MASK"], [1107296256, 1115684864, "IROM"], [1077395456, 1077805056, "IRAM"], [1342177280, 1342185472, "RTC_IRAM"], [1342177280, 1342185472, "RTC_DRAM"], [1611653120, 1611661312, "MEM_INTERNAL2"]];
  }
  async getPkgVersion(s) {
    const t = this.EFUSE_BASE + 68 + 12;
    return await s.readReg(t) >> 21 & 7;
  }
  async getChipRevision(s) {
    const t = this.EFUSE_BASE + 68 + 12;
    return (await s.readReg(t) & 7 << 18) >> 18;
  }
  async getMinorChipVersion(s) {
    const t = this.EFUSE_BASE + 68 + 20, e = await s.readReg(t) >> 23 & 1, i = this.EFUSE_BASE + 68 + 12;
    return (e << 3) + (await s.readReg(i) >> 18 & 7);
  }
  async getMajorChipVersion(s) {
    const t = this.EFUSE_BASE + 68 + 20;
    return await s.readReg(t) >> 24 & 3;
  }
  async getChipDescription(s) {
    const t = await this.getPkgVersion(s), e = await this.getMajorChipVersion(s), i = await this.getMinorChipVersion(s);
    return `${{ 0: "ESP32-C3 (QFN32)", 1: "ESP8685 (QFN28)", 2: "ESP32-C3 AZ (QFN32)", 3: "ESP8686 (QFN24)" }[t] || "Unknown ESP32-C3"} (revision v${e}.${i})`;
  }
  async getFlashCap(s) {
    const t = this.EFUSE_BASE + 68 + 12;
    return await s.readReg(t) >> 27 & 7;
  }
  async getFlashVendor(s) {
    const t = this.EFUSE_BASE + 68 + 16;
    return { 1: "XMC", 2: "GD", 3: "FM", 4: "TT", 5: "ZBIT" }[await s.readReg(t) >> 0 & 7] || "";
  }
  async getChipFeatures(s) {
    const t = ["Wi-Fi", "BLE"], e = await this.getFlashCap(s), i = await this.getFlashVendor(s), E = { 0: null, 1: "Embedded Flash 4MB", 2: "Embedded Flash 2MB", 3: "Embedded Flash 1MB", 4: "Embedded Flash 8MB" }[e], a = E !== void 0 ? E : "Unknown Embedded Flash";
    return E !== null && t.push(`${a} (${i})`), t;
  }
  async getCrystalFreq(s) {
    return 40;
  }
  _d2h(s) {
    const t = (+s).toString(16);
    return t.length === 1 ? "0" + t : t;
  }
  async readMac(s) {
    let t = await s.readReg(this.MAC_EFUSE_REG);
    t >>>= 0;
    let e = await s.readReg(this.MAC_EFUSE_REG + 4);
    e = e >>> 0 & 65535;
    const i = new Uint8Array(6);
    return i[0] = e >> 8 & 255, i[1] = 255 & e, i[2] = t >> 24 & 255, i[3] = t >> 16 & 255, i[4] = t >> 8 & 255, i[5] = 255 & t, this._d2h(i[0]) + ":" + this._d2h(i[1]) + ":" + this._d2h(i[2]) + ":" + this._d2h(i[3]) + ":" + this._d2h(i[4]) + ":" + this._d2h(i[5]);
  }
  getEraseSize(s, t) {
    return t;
  }
};
export {
  F as ESP32C3ROM
};
