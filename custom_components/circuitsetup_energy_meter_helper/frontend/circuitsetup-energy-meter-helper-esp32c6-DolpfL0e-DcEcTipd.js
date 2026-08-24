import { ESP32C3ROM as E } from "./circuitsetup-energy-meter-helper-esp32c3-2tchr35W-CpokVQ-e.js";
import "./circuitsetup-energy-meter-helper-install-dialog-im156JnI-B7RvV7QK.js";
import "./circuitsetup-energy-meter-helper-styles-sT2V1cOw-CuhdIKie.js";
class R extends E {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-C6", this.IMAGE_CHIP_ID = 13, this.EFUSE_BASE = 1611335680, this.EFUSE_BLOCK1_ADDR = this.EFUSE_BASE + 68, this.MAC_EFUSE_REG = this.EFUSE_BASE + 68, this.UART_CLKDIV_REG = 1072955412, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612860, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 0, this.SPI_REG_BASE = 1610620928, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1115684864, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1107296256, 1124073472, "DROM"], [1082130432, 1082654720, "DRAM"], [1082130432, 1082654720, "BYTE_ACCESSIBLE"], [1074048e3, 1074069504, "DROM_MASK"], [1073741824, 1074048e3, "IROM_MASK"], [1107296256, 1124073472, "IROM"], [1082130432, 1082654720, "IRAM"], [1342177280, 1342193664, "RTC_IRAM"], [1342177280, 1342193664, "RTC_DRAM"], [1611653120, 1611661312, "MEM_INTERNAL2"]];
  }
  async getPkgVersion(s) {
    const t = this.EFUSE_BASE + 68 + 12;
    return await s.readReg(t) >> 21 & 7;
  }
  async getChipRevision(s) {
    const t = this.EFUSE_BASE + 68 + 12;
    return (await s.readReg(t) & 7 << 18) >> 18;
  }
  async getChipDescription(s) {
    let t;
    return t = await this.getPkgVersion(s) === 0 ? "ESP32-C6" : "unknown ESP32-C6", t += " (revision " + await this.getChipRevision(s) + ")", t;
  }
  async getChipFeatures(s) {
    return ["Wi-Fi 6", "BT 5", "IEEE802.15.4"];
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
    let _ = await s.readReg(this.MAC_EFUSE_REG + 4);
    _ = _ >>> 0 & 65535;
    const i = new Uint8Array(6);
    return i[0] = _ >> 8 & 255, i[1] = 255 & _, i[2] = t >> 24 & 255, i[3] = t >> 16 & 255, i[4] = t >> 8 & 255, i[5] = 255 & t, this._d2h(i[0]) + ":" + this._d2h(i[1]) + ":" + this._d2h(i[2]) + ":" + this._d2h(i[3]) + ":" + this._d2h(i[4]) + ":" + this._d2h(i[5]);
  }
  getEraseSize(s, t) {
    return t;
  }
}
export {
  R as ESP32C6ROM
};
