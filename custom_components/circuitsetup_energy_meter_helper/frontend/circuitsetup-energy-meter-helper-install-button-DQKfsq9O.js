const s = async (r) => {
  let t;
  import("./circuitsetup-energy-meter-helper-install-dialog-im156JnI-B7RvV7QK.js").then((function(e) {
    return e.i;
  }));
  try {
    t = await navigator.serial.requestPort();
  } catch (e) {
    return e.name === "NotFoundError" ? void import("./circuitsetup-energy-meter-helper-index-Dt9w-IG1-BAs2Mr7k.js").then(((i) => i.openNoPortPickedDialog((() => s(r))))) : void alert(`Error: ${e.message}`);
  }
  if (!t) return;
  try {
    await t.open({ baudRate: 115200, bufferSize: 8192 });
  } catch (e) {
    return void alert(e.message);
  }
  const n = document.createElement("ewt-install-dialog");
  n.port = t, n.manifestPath = r.manifest || r.getAttribute("manifest"), n.overrides = r.overrides, n.addEventListener("closed", (() => {
    t.close();
  }), { once: !0 }), document.body.appendChild(n);
};
class o extends HTMLElement {
  connectedCallback() {
    if (this.renderRoot) return;
    if (this.renderRoot = this.attachShadow({ mode: "open" }), !o.isSupported || !o.isAllowed) return this.toggleAttribute("install-unsupported", !0), void (this.renderRoot.innerHTML = o.isAllowed ? "<slot name='unsupported'>Your browser does not support installing things on ESP devices. Use Mozilla Firefox, Google Chrome or Microsoft Edge.</slot>" : "<slot name='not-allowed'>You can only install ESP devices on HTTPS websites or on the localhost.</slot>");
    this.toggleAttribute("install-supported", !0);
    const t = document.createElement("slot");
    t.addEventListener("click", (async (e) => {
      e.preventDefault(), s(this);
    })), t.name = "activate";
    const n = document.createElement("button");
    if (n.innerText = "Connect", t.append(n), "adoptedStyleSheets" in Document.prototype && "replaceSync" in CSSStyleSheet.prototype) {
      const e = new CSSStyleSheet();
      e.replaceSync(o.style), this.renderRoot.adoptedStyleSheets = [e];
    } else {
      const e = document.createElement("style");
      e.innerText = o.style, this.renderRoot.append(e);
    }
    this.renderRoot.append(t);
  }
}
o.isSupported = "serial" in navigator, o.isAllowed = window.isSecureContext, o.style = `
  button {
    position: relative;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    padding: 10px 24px;
    color: var(--esp-tools-button-text-color, #fff);
    background-color: var(--esp-tools-button-color, #03a9f4);
    border: none;
    border-radius: var(--esp-tools-button-border-radius, 9999px);
  }
  button::before {
    content: " ";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    opacity: 0.2;
    border-radius: var(--esp-tools-button-border-radius, 9999px);
  }
  button:hover::before {
    background-color: rgba(255,255,255,.8);
  }
  button:focus {
    outline: none;
  }
  button:focus::before {
    background-color: white;
  }
  button:active::before {
    background-color: grey;
  }
  :host([active]) button {
    color: rgba(0, 0, 0, 0.38);
    background-color: rgba(0, 0, 0, 0.12);
    box-shadow: none;
    cursor: unset;
    pointer-events: none;
  }
  .hidden {
    display: none;
  }`, customElements.define("esp-web-install-button", o);
