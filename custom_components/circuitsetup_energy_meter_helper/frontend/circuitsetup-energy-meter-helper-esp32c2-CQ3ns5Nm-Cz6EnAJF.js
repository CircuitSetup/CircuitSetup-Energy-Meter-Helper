import { ESP32C3ROM as e } from "./circuitsetup-energy-meter-helper-esp32c3-2tchr35W-KGtMGoyS.js";
import "./circuitsetup-energy-meter-helper-install-dialog-im156JnI-BNCTyjx2.js";
import "./circuitsetup-energy-meter-helper-styles-sT2V1cOw-50QkNMEY.js";
class S extends e {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-C2", this.IMAGE_CHIP_ID = 12, this.EFUSE_BASE = 1610647552, this.MAC_EFUSE_REG = this.EFUSE_BASE + 64, this.UART_CLKDIV_REG = 1610612756, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612860, this.XTAL_CLK_DIVIDER = 1, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 0, this.SPI_REG_BASE = 1610620928, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1111490560, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1006632960, 1010827264, "DROM"], [1070202880, 1070465024, "DRAM"], [1070104576, 1070596096, "BYTE_ACCESSIBLE"], [1072693248, 1073020928, "DROM_MASK"], [1073741824, 1074331648, "IROM_MASK"], [1107296256, 1111490560, "IROM"], [1077395456, 1077673984, "IRAM"]];
  }
  async getPkgVersion(s) {
    const t = this.EFUSE_BASE + 64 + 4;
    return await s.readReg(t) >> 22 & 7;
  }
  async getChipRevision(s) {
    const t = this.EFUSE_BASE + 64 + 4;
    return (await s.readReg(t) & 3 << 20) >> 20;
  }
  async getChipDescription(s) {
    let t;
    const _ = await this.getPkgVersion(s);
    return t = _ === 0 || _ === 1 ? "ESP32-C2" : "unknown ESP32-C2", t += " (revision " + await this.getChipRevision(s) + ")", t;
  }
  async getChipFeatures(s) {
    return ["Wi-Fi", "BLE"];
  }
  async getCrystalFreq(s) {
    const t = await s.readReg(this.UART_CLKDIV_REG) & this.UART_CLKDIV_MASK, _ = s.transport.baudrate * t / 1e6 / this.XTAL_CLK_DIVIDER;
    let i;
    return i = _ > 33 ? 40 : 26, Math.abs(i - _) > 1 && s.info("WARNING: Unsupported crystal in use"), i;
  }
  async changeBaudRate(s) {
    await this.getCrystalFreq(s) === 26 && s.changeBaud();
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
  S as ESP32C2ROM
};
