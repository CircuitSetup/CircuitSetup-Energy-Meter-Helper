const e = async (t2) => {
  let o;
  import("./circuitsetup-energy-meter-helper-install-dialog-im156JnI-CM2eHnjj.js").then((function(e2) {
    return e2.i;
  }));
  try {
    o = await navigator.serial.requestPort();
  } catch (o2) {
    return "NotFoundError" === o2.name ? void import("./circuitsetup-energy-meter-helper-index-Dt9w-IG1-Bno0ig5j.js").then(((o3) => o3.openNoPortPickedDialog((() => e(t2))))) : void alert(`Error: ${o2.message}`);
  }
  if (!o) return;
  try {
    await o.open({ baudRate: 115200, bufferSize: 8192 });
  } catch (e2) {
    return void alert(e2.message);
  }
  const n = document.createElement("ewt-install-dialog");
  n.port = o, n.manifestPath = t2.manifest || t2.getAttribute("manifest"), n.overrides = t2.overrides, n.addEventListener("closed", (() => {
    o.close();
  }), { once: true }), document.body.appendChild(n);
};
class t extends HTMLElement {
  connectedCallback() {
    if (this.renderRoot) return;
    if (this.renderRoot = this.attachShadow({ mode: "open" }), !t.isSupported || !t.isAllowed) return this.toggleAttribute("install-unsupported", true), void (this.renderRoot.innerHTML = t.isAllowed ? "<slot name='unsupported'>Your browser does not support installing things on ESP devices. Use Mozilla Firefox, Google Chrome or Microsoft Edge.</slot>" : "<slot name='not-allowed'>You can only install ESP devices on HTTPS websites or on the localhost.</slot>");
    this.toggleAttribute("install-supported", true);
    const o = document.createElement("slot");
    o.addEventListener("click", (async (t2) => {
      t2.preventDefault(), e(this);
    })), o.name = "activate";
    const n = document.createElement("button");
    if (n.innerText = "Connect", o.append(n), "adoptedStyleSheets" in Document.prototype && "replaceSync" in CSSStyleSheet.prototype) {
      const e2 = new CSSStyleSheet();
      e2.replaceSync(t.style), this.renderRoot.adoptedStyleSheets = [e2];
    } else {
      const e2 = document.createElement("style");
      e2.innerText = t.style, this.renderRoot.append(e2);
    }
    this.renderRoot.append(o);
  }
}
t.isSupported = "serial" in navigator, t.isAllowed = window.isSecureContext, t.style = '\n  button {\n    position: relative;\n    cursor: pointer;\n    font-size: 14px;\n    font-weight: 500;\n    padding: 10px 24px;\n    color: var(--esp-tools-button-text-color, #fff);\n    background-color: var(--esp-tools-button-color, #03a9f4);\n    border: none;\n    border-radius: var(--esp-tools-button-border-radius, 9999px);\n  }\n  button::before {\n    content: " ";\n    position: absolute;\n    top: 0;\n    bottom: 0;\n    left: 0;\n    right: 0;\n    opacity: 0.2;\n    border-radius: var(--esp-tools-button-border-radius, 9999px);\n  }\n  button:hover::before {\n    background-color: rgba(255,255,255,.8);\n  }\n  button:focus {\n    outline: none;\n  }\n  button:focus::before {\n    background-color: white;\n  }\n  button:active::before {\n    background-color: grey;\n  }\n  :host([active]) button {\n    color: rgba(0, 0, 0, 0.38);\n    background-color: rgba(0, 0, 0, 0.12);\n    box-shadow: none;\n    cursor: unset;\n    pointer-events: none;\n  }\n  .hidden {\n    display: none;\n  }', customElements.define("esp-web-install-button", t);
