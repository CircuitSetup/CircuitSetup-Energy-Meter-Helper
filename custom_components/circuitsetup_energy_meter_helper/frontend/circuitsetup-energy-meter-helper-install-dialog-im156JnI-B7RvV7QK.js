import { c as U, j as y, V, t as h, y as At, n as N, m as g, g as Fr, p as Ge, W as Ft, b as J, l as ws, f as M, J as We, X as Es, a as Ss, d as R, O as ot, e as ks, h as As, Q as Rs, i as Ci, K as tt, k as zr, R as Xt, z as Is, o as Br, I as Ur, T as Ct, q as Jt } from "./circuitsetup-energy-meter-helper-styles-sT2V1cOw-CuhdIKie.js";
let Ui;
function Nr(i, e = _t) {
  const t = Ti(i, e);
  return t && (t.tabIndex = 0, t.focus()), t;
}
function Hr(i, e = _t) {
  const t = qr(i, e);
  return t && (t.tabIndex = 0, t.focus()), t;
}
function ie(i, e = _t) {
  for (let t = 0; t < i.length; t++) {
    const r = i[t];
    if (r.tabIndex === 0 && e(r)) return { item: r, index: t };
  }
  return null;
}
function Ti(i, e = _t) {
  for (const t of i) if (e(t)) return t;
  return null;
}
function qr(i, e = _t) {
  for (let t = i.length - 1; t >= 0; t--) {
    const r = i[t];
    if (e(r)) return r;
  }
  return null;
}
function Ni(i, e, t = _t, r = !0) {
  if (e) {
    const s = (function(o, a, n = _t, d = !0) {
      for (let l = 1; l < o.length; l++) {
        const c = (l + a) % o.length;
        if (c < a && !d) return null;
        const f = o[c];
        if (n(f)) return f;
      }
      return o[a] ? o[a] : null;
    })(i, e.index, t, r);
    return s && (s.tabIndex = 0, s.focus()), s;
  }
  return Nr(i, t);
}
function Hi(i, e, t = _t, r = !0) {
  if (e) {
    const s = (function(o, a, n = _t, d = !0) {
      for (let l = 1; l < o.length; l++) {
        const c = (a - l + o.length) % o.length;
        if (c > a && !d) return null;
        const f = o[c];
        if (n(f)) return f;
      }
      return o[a] ? o[a] : null;
    })(i, e.index, t, r);
    return s && (s.tabIndex = 0, s.focus()), s;
  }
  return Hr(i, t);
}
function _t(i) {
  return !i.disabled;
}
const G = { ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowUp: "ArrowUp", ArrowRight: "ArrowRight", Home: "Home", End: "End" };
class Gr {
  constructor(e) {
    this.handleKeydown = (c) => {
      const f = c.key;
      if (c.defaultPrevented || !this.isNavigableKey(f)) return;
      const m = this.items;
      if (!m.length) return;
      const p = ie(m, this.isActivatable);
      c.preventDefault();
      const E = this.isRtl();
      let v = null;
      switch (f) {
        case G.ArrowDown:
        case (E ? G.ArrowLeft : G.ArrowRight):
          v = Ni(m, p, this.isActivatable, this.wrapNavigation());
          break;
        case G.ArrowUp:
        case (E ? G.ArrowRight : G.ArrowLeft):
          v = Hi(m, p, this.isActivatable, this.wrapNavigation());
          break;
        case G.Home:
          v = Nr(m, this.isActivatable);
          break;
        case G.End:
          v = Hr(m, this.isActivatable);
      }
      v && p && p.item !== v && (p.item.tabIndex = -1);
    }, this.onDeactivateItems = () => {
      const c = this.items;
      for (const f of c) this.deactivateItem(f);
    }, this.onRequestActivation = (c) => {
      this.onDeactivateItems();
      const f = c.target;
      this.activateItem(f), f.focus();
    }, this.onSlotchange = () => {
      const c = this.items;
      let f = !1;
      for (const p of c)
        !(!p.disabled && p.tabIndex > -1) || f ? p.tabIndex = -1 : (f = !0, p.tabIndex = 0);
      if (f) return;
      const m = Ti(c, this.isActivatable);
      m && (m.tabIndex = 0);
    };
    const { isItem: t, getPossibleItems: r, isRtl: s, deactivateItem: o, activateItem: a, isNavigableKey: n, isActivatable: d, wrapNavigation: l } = e;
    this.isItem = t, this.getPossibleItems = r, this.isRtl = s, this.deactivateItem = o, this.activateItem = a, this.isNavigableKey = n, this.isActivatable = d, this.wrapNavigation = l ?? (() => !0);
  }
  get items() {
    const e = this.getPossibleItems(), t = [];
    for (const r of e) {
      if (this.isItem(r)) {
        t.push(r);
        continue;
      }
      const s = r.item;
      s && this.isItem(s) && t.push(s);
    }
    return t;
  }
  activateNextItem() {
    const e = this.items, t = ie(e, this.isActivatable);
    return t && (t.item.tabIndex = -1), Ni(e, t, this.isActivatable, this.wrapNavigation());
  }
  activatePreviousItem() {
    const e = this.items, t = ie(e, this.isActivatable);
    return t && (t.item.tabIndex = -1), Hi(e, t, this.isActivatable, this.wrapNavigation());
  }
}
const Cs = new Set(Object.values(G));
class Wr extends U {
  get items() {
    return this.listController.items;
  }
  constructor() {
    super(), this.listController = new Gr({ isItem: (e) => e.hasAttribute("md-list-item"), getPossibleItems: () => this.slotItems, isRtl: () => getComputedStyle(this).direction === "rtl", deactivateItem: (e) => {
      e.tabIndex = -1;
    }, activateItem: (e) => {
      e.tabIndex = 0;
    }, isNavigableKey: (e) => Cs.has(e), isActivatable: (e) => !e.disabled && e.type !== "text" }), this.internals = this.attachInternals(), this.internals.role = "list", this.addEventListener("keydown", this.listController.handleKeydown);
  }
  render() {
    return y`
      <slot
        @deactivate-items=${this.listController.onDeactivateItems}
        @request-activation=${this.listController.onRequestActivation}
        @slotchange=${this.listController.onSlotchange}>
      </slot>
    `;
  }
  activateNextItem() {
    return this.listController.activateNextItem();
  }
  activatePreviousItem() {
    return this.listController.activatePreviousItem();
  }
}
h([At({ flatten: !0 })], Wr.prototype, "slotItems", void 0);
const Ts = N`:host{background:var(--md-list-container-color, var(--md-sys-color-surface, #fef7ff));color:unset;display:flex;flex-direction:column;outline:none;padding:8px 0;position:relative}
`;
class qi extends Wr {
}
qi.styles = [Ts], customElements.define("ew-list", qi);
class yi extends U {
  constructor() {
    super(...arguments), this.multiline = !1;
  }
  render() {
    return y`
      <slot name="container"></slot>
      <slot class="non-text" name="start"></slot>
      <div class="text">
        <slot name="overline" @slotchange=${this.handleTextSlotChange}></slot>
        <slot
          class="default-slot"
          @slotchange=${this.handleTextSlotChange}></slot>
        <slot name="headline" @slotchange=${this.handleTextSlotChange}></slot>
        <slot
          name="supporting-text"
          @slotchange=${this.handleTextSlotChange}></slot>
      </div>
      <slot class="non-text" name="trailing-supporting-text"></slot>
      <slot class="non-text" name="end"></slot>
    `;
  }
  handleTextSlotChange() {
    let e = !1, t = 0;
    for (const r of this.textSlots) if ($s(r) && (t += 1), t > 1) {
      e = !0;
      break;
    }
    this.multiline = e;
  }
}
function $s(i) {
  for (const t of i.assignedNodes({ flatten: !0 })) {
    var e;
    const r = t.nodeType === Node.ELEMENT_NODE, s = t.nodeType === Node.TEXT_NODE && ((e = t.textContent) === null || e === void 0 ? void 0 : e.match(/\S/));
    if (r || s) return !0;
  }
  return !1;
}
h([g({ type: Boolean, reflect: !0 })], yi.prototype, "multiline", void 0), h([/* @__PURE__ */ (function(i) {
  return (e, t) => Fr(e, t, { get() {
    return (this.renderRoot ?? Ui ?? (Ui = document.createDocumentFragment())).querySelectorAll(i);
  } });
})(".text slot")], yi.prototype, "textSlots", void 0);
const Ls = N`:host{color:var(--md-sys-color-on-surface, #1d1b20);font-family:var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-large-size, 1rem);font-weight:var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-large-line-height, 1.5rem);align-items:center;box-sizing:border-box;display:flex;gap:16px;min-height:56px;overflow:hidden;padding:12px 16px;position:relative;text-overflow:ellipsis}:host([multiline]){min-height:72px}[name=overline]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-medium-size, 0.875rem);font-weight:var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-medium-line-height, 1.25rem)}[name=trailing-supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=container]::slotted(*){inset:0;position:absolute}.default-slot{display:inline}.default-slot,.text ::slotted(*){overflow:hidden;text-overflow:ellipsis}.text{display:flex;flex:1;flex-direction:column;overflow:hidden}
`;
let Qe = class extends yi {
};
Qe.styles = [Ls], Qe = h([Ge("md-item")], Qe);
const Zr = /* @__PURE__ */ Symbol.for(""), Os = (i) => {
  if (i?.r === Zr) return i?._$litStatic$;
}, wt = (i, ...e) => ({ _$litStatic$: e.reduce(((t, r, s) => t + ((o) => {
  if (o._$litStatic$ !== void 0) return o._$litStatic$;
  throw Error(`Value passed to 'literal' function must be a 'literal' result: ${o}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`);
})(r) + i[s + 1]), i[0]), r: Zr }), Gi = /* @__PURE__ */ new Map(), Ze = /* @__PURE__ */ ((i) => (e, ...t) => {
  const r = t.length;
  let s, o;
  const a = [], n = [];
  let d, l = 0, c = !1;
  for (; l < r; ) {
    for (d = e[l]; l < r && (o = t[l], (s = Os(o)) !== void 0); ) d += s + e[++l], c = !0;
    l !== r && n.push(o), a.push(d), l++;
  }
  if (l === r && a.push(e[r]), c) {
    const f = a.join("$$lit$$");
    (e = Gi.get(f)) === void 0 && (a.raw = a, Gi.set(f, e = a)), t = n;
  }
  return i(e, ...t);
})(y), Ds = Ft(U);
class yt extends Ds {
  constructor() {
    super(...arguments), this.disabled = !1, this.type = "text", this.isListItem = !0, this.href = "", this.target = "";
  }
  get isDisabled() {
    return this.disabled && this.type !== "link";
  }
  willUpdate(e) {
    this.href && (this.type = "link"), super.willUpdate(e);
  }
  render() {
    return this.renderListItem(y`
      <md-item>
        <div slot="container">
          ${this.renderRipple()} ${this.renderFocusRing()}
        </div>
        <slot name="start" slot="start"></slot>
        <slot name="end" slot="end"></slot>
        ${this.renderBody()}
      </md-item>
    `);
  }
  renderListItem(e) {
    const t = this.type === "link";
    let r;
    switch (this.type) {
      case "link":
        r = wt`a`;
        break;
      case "button":
        r = wt`button`;
        break;
      default:
        r = wt`li`;
    }
    const s = this.type !== "text", o = t && this.target ? this.target : R;
    return Ze`
      <${r}
        id="item"
        tabindex="${this.isDisabled || !s ? -1 : 0}"
        ?disabled=${this.isDisabled}
        role="listitem"
        aria-selected=${this.ariaSelected || R}
        aria-checked=${this.ariaChecked || R}
        aria-expanded=${this.ariaExpanded || R}
        aria-haspopup=${this.ariaHasPopup || R}
        class="list-item ${ot(this.getRenderClasses())}"
        href=${this.href || R}
        target=${o}
        @focus=${this.onFocus}
      >${e}</${r}>
    `;
  }
  renderRipple() {
    return this.type === "text" ? R : y` <md-ripple
      part="ripple"
      for="item"
      ?disabled=${this.isDisabled}></md-ripple>`;
  }
  renderFocusRing() {
    return this.type === "text" ? R : y` <md-focus-ring
      @visibility-changed=${this.onFocusRingVisibilityChanged}
      part="focus-ring"
      for="item"
      inward></md-focus-ring>`;
  }
  onFocusRingVisibilityChanged(e) {
  }
  getRenderClasses() {
    return { disabled: this.isDisabled };
  }
  renderBody() {
    return y`
      <slot></slot>
      <slot name="overline" slot="overline"></slot>
      <slot name="headline" slot="headline"></slot>
      <slot name="supporting-text" slot="supporting-text"></slot>
      <slot
        name="trailing-supporting-text"
        slot="trailing-supporting-text"></slot>
    `;
  }
  onFocus() {
    this.tabIndex === -1 && this.dispatchEvent(new Event("request-activation", { bubbles: !0, composed: !0 }));
  }
  focus() {
    var e;
    (e = this.listItemRoot) === null || e === void 0 || e.focus();
  }
  click() {
    this.listItemRoot ? this.listItemRoot.click() : super.click();
  }
}
yt.shadowRootOptions = { ...U.shadowRootOptions, delegatesFocus: !0 }, h([g({ type: Boolean, reflect: !0 })], yt.prototype, "disabled", void 0), h([g({ reflect: !0 })], yt.prototype, "type", void 0), h([g({ type: Boolean, attribute: "md-list-item", reflect: !0 })], yt.prototype, "isListItem", void 0), h([g()], yt.prototype, "href", void 0), h([g()], yt.prototype, "target", void 0), h([J(".list-item")], yt.prototype, "listItemRoot", void 0);
const Ms = N`:host{display:flex;-webkit-tap-highlight-color:rgba(0,0,0,0);--md-ripple-hover-color: var(--md-list-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-list-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-list-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-list-item-pressed-state-layer-opacity, 0.12)}:host(:is([type=button]:not([disabled]),[type=link])){cursor:pointer}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;cursor:inherit;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);width:100%}.list-item.interactive{cursor:pointer}.list-item.disabled{opacity:var(--md-list-item-disabled-opacity, 0.3);pointer-events:none}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;height:100%;color:var(--md-list-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-list-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-list-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-list-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-list-item-one-line-container-height, 56px);padding-top:var(--md-list-item-top-space, 12px);padding-bottom:var(--md-list-item-bottom-space, 12px);padding-inline-start:var(--md-list-item-leading-space, 16px);padding-inline-end:var(--md-list-item-trailing-space, 16px)}md-item[multiline]{min-height:var(--md-list-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-list-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-list-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-list-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-list-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-list-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-list-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-list-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-list-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}@media(forced-colors: active){.disabled slot{color:GrayText}.list-item.disabled{color:GrayText;opacity:1}}
`;
class Wi extends yt {
}
Wi.styles = [Ms], customElements.define("ew-list-item", Wi);
class Zi extends ks {
}
Zi.styles = [ws], customElements.define("ew-divider", Zi);
const he = /* @__PURE__ */ Symbol("createValidator"), pe = /* @__PURE__ */ Symbol("getValidityAnchor"), ti = /* @__PURE__ */ Symbol("privateValidator"), ut = /* @__PURE__ */ Symbol("privateSyncValidity"), ye = /* @__PURE__ */ Symbol("privateCustomValidationMessage");
function $i(i) {
  var e;
  class t extends i {
    constructor() {
      super(...arguments), this[e] = "";
    }
    get validity() {
      return this[ut](), this[tt].validity;
    }
    get validationMessage() {
      return this[ut](), this[tt].validationMessage;
    }
    get willValidate() {
      return this[ut](), this[tt].willValidate;
    }
    checkValidity() {
      return this[ut](), this[tt].checkValidity();
    }
    reportValidity() {
      return this[ut](), this[tt].reportValidity();
    }
    setCustomValidity(s) {
      this[ye] = s, this[ut]();
    }
    requestUpdate(s, o, a) {
      super.requestUpdate(s, o, a), this[ut]();
    }
    firstUpdated(s) {
      super.firstUpdated(s), this[ut]();
    }
    [(e = ye, ut)]() {
      this[ti] || (this[ti] = this[he]());
      const { validity: s, validationMessage: o } = this[ti].getValidity(), a = !!this[ye], n = this[ye] || o;
      this[tt].setValidity({ ...s, customError: a }, n, this[pe]() ?? void 0);
    }
    [he]() {
      throw new Error("Implement [createValidator]");
    }
    [pe]() {
      throw new Error("Implement [getValidityAnchor]");
    }
  }
  return t;
}
const Nt = /* @__PURE__ */ Symbol("getFormValue"), xi = /* @__PURE__ */ Symbol("getFormState");
function Li(i) {
  class e extends i {
    get form() {
      return this[tt].form;
    }
    get labels() {
      return this[tt].labels;
    }
    get name() {
      return this.getAttribute("name") ?? "";
    }
    set name(r) {
      this.setAttribute("name", r);
    }
    get disabled() {
      return this.hasAttribute("disabled");
    }
    set disabled(r) {
      this.toggleAttribute("disabled", r);
    }
    attributeChangedCallback(r, s, o) {
      if (r !== "name" && r !== "disabled") super.attributeChangedCallback(r, s, o);
      else {
        const a = r === "disabled" ? s !== null : s;
        this.requestUpdate(r, a);
      }
    }
    requestUpdate(r, s, o) {
      super.requestUpdate(r, s, o), this[tt].setFormValue(this[Nt](), this[xi]());
    }
    [Nt]() {
      throw new Error("Implement [getFormValue]");
    }
    [xi]() {
      return this[Nt]();
    }
    formDisabledCallback(r) {
      this.disabled = r;
    }
  }
  return e.formAssociated = !0, h([g({ noAccessor: !0 })], e.prototype, "name", null), h([g({ type: Boolean, noAccessor: !0 })], e.prototype, "disabled", null), e;
}
class Oi {
  constructor(e) {
    this.getCurrentState = e, this.currentValidity = { validity: {}, validationMessage: "" };
  }
  getValidity() {
    const e = this.getCurrentState();
    if (!(!this.prevState || !this.equals(this.prevState, e))) return this.currentValidity;
    const { validity: t, validationMessage: r } = this.computeValidity(e);
    return this.prevState = this.copy(e), this.currentValidity = { validationMessage: r, validity: { badInput: t.badInput, customError: t.customError, patternMismatch: t.patternMismatch, rangeOverflow: t.rangeOverflow, rangeUnderflow: t.rangeUnderflow, stepMismatch: t.stepMismatch, tooLong: t.tooLong, tooShort: t.tooShort, typeMismatch: t.typeMismatch, valueMissing: t.valueMissing } }, this.currentValidity;
  }
}
class Ps extends Oi {
  computeValidity(e) {
    return this.checkboxControl || (this.checkboxControl = document.createElement("input"), this.checkboxControl.type = "checkbox"), this.checkboxControl.checked = e.checked, this.checkboxControl.required = e.required, { validity: this.checkboxControl.validity, validationMessage: this.checkboxControl.validationMessage };
  }
  equals(e, t) {
    return e.checked === t.checked && e.required === t.required;
  }
  copy({ checked: e, required: t }) {
    return { checked: e, required: t };
  }
}
const Fs = Ft($i(Li(We(U))));
class nt extends Fs {
  constructor() {
    super(), this.checked = !1, this.indeterminate = !1, this.required = !1, this.value = "on", this.prevChecked = !1, this.prevDisabled = !1, this.prevIndeterminate = !1, this.addEventListener("click", ((e) => {
      As(e) && this.input && (this.focus(), Rs(this.input));
    }));
  }
  update(e) {
    (e.has("checked") || e.has("disabled") || e.has("indeterminate")) && (this.prevChecked = e.get("checked") ?? this.checked, this.prevDisabled = e.get("disabled") ?? this.disabled, this.prevIndeterminate = e.get("indeterminate") ?? this.indeterminate), super.update(e);
  }
  render() {
    const e = !this.prevChecked && !this.prevIndeterminate, t = this.prevChecked && !this.prevIndeterminate, r = this.prevIndeterminate, s = this.checked && !this.indeterminate, o = this.indeterminate, a = ot({ disabled: this.disabled, selected: s || o, unselected: !s && !o, checked: s, indeterminate: o, "prev-unselected": e, "prev-checked": t, "prev-indeterminate": r, "prev-disabled": this.prevDisabled }), { ariaLabel: n, ariaInvalid: d } = this;
    return y`
      <div class="container ${a}">
        <input
          type="checkbox"
          id="input"
          aria-checked=${o ? "mixed" : R}
          aria-label=${n || R}
          aria-invalid=${d || R}
          ?disabled=${this.disabled}
          ?required=${this.required}
          .indeterminate=${this.indeterminate}
          .checked=${this.checked}
          @input=${this.handleInput}
          @change=${this.handleChange} />

        <div class="outline"></div>
        <div class="background"></div>
        <md-focus-ring part="focus-ring" for="input"></md-focus-ring>
        <md-ripple for="input" ?disabled=${this.disabled}></md-ripple>
        <svg class="icon" viewBox="0 0 18 18" aria-hidden="true">
          <rect class="mark short" />
          <rect class="mark long" />
        </svg>
      </div>
    `;
  }
  handleInput(e) {
    const t = e.target;
    this.checked = t.checked, this.indeterminate = t.indeterminate;
  }
  handleChange(e) {
    Ci(this, e);
  }
  [Nt]() {
    return !this.checked || this.indeterminate ? null : this.value;
  }
  [xi]() {
    return String(this.checked);
  }
  formResetCallback() {
    this.checked = this.hasAttribute("checked");
  }
  formStateRestoreCallback(e) {
    this.checked = e === "true";
  }
  [he]() {
    return new Ps((() => this));
  }
  [pe]() {
    return this.input;
  }
}
nt.shadowRootOptions = { ...U.shadowRootOptions, delegatesFocus: !0 }, h([g({ type: Boolean })], nt.prototype, "checked", void 0), h([g({ type: Boolean })], nt.prototype, "indeterminate", void 0), h([g({ type: Boolean })], nt.prototype, "required", void 0), h([g()], nt.prototype, "value", void 0), h([M()], nt.prototype, "prevChecked", void 0), h([M()], nt.prototype, "prevDisabled", void 0), h([M()], nt.prototype, "prevIndeterminate", void 0), h([J("input")], nt.prototype, "input", void 0);
const zs = N`:host{border-start-start-radius:var(--md-checkbox-container-shape-start-start, var(--md-checkbox-container-shape, 2px));border-start-end-radius:var(--md-checkbox-container-shape-start-end, var(--md-checkbox-container-shape, 2px));border-end-end-radius:var(--md-checkbox-container-shape-end-end, var(--md-checkbox-container-shape, 2px));border-end-start-radius:var(--md-checkbox-container-shape-end-start, var(--md-checkbox-container-shape, 2px));display:inline-flex;height:var(--md-checkbox-container-size, 18px);position:relative;vertical-align:top;width:var(--md-checkbox-container-size, 18px);-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer}:host([disabled]){cursor:default}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--md-checkbox-container-size, 18px))/2)}md-focus-ring{height:44px;inset:unset;width:44px}input{appearance:none;height:48px;margin:0;opacity:0;outline:none;position:absolute;width:48px;z-index:1;cursor:inherit}:host([touch-target=none]) input{height:100%;width:100%}.container{border-radius:inherit;display:flex;height:100%;place-content:center;place-items:center;position:relative;width:100%}.outline,.background,.icon{inset:0;position:absolute}.outline,.background{border-radius:inherit}.outline{border-color:var(--md-checkbox-outline-color, var(--md-sys-color-on-surface-variant, #49454f));border-style:solid;border-width:var(--md-checkbox-outline-width, 2px);box-sizing:border-box}.background{background-color:var(--md-checkbox-selected-container-color, var(--md-sys-color-primary, #6750a4))}.background,.icon{opacity:0;transition-duration:150ms,50ms;transition-property:transform,opacity;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15),linear;transform:scale(0.6)}:where(.selected) :is(.background,.icon){opacity:1;transition-duration:350ms,50ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1),linear;transform:scale(1)}md-ripple{border-radius:var(--md-checkbox-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));height:var(--md-checkbox-state-layer-size, 40px);inset:unset;width:var(--md-checkbox-state-layer-size, 40px);--md-ripple-hover-color: var(--md-checkbox-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-checkbox-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-pressed-opacity: var(--md-checkbox-pressed-state-layer-opacity, 0.12)}.selected md-ripple{--md-ripple-hover-color: var(--md-checkbox-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-hover-opacity: var(--md-checkbox-selected-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-selected-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-checkbox-selected-pressed-state-layer-opacity, 0.12)}.icon{fill:var(--md-checkbox-selected-icon-color, var(--md-sys-color-on-primary, #fff));height:var(--md-checkbox-icon-size, 18px);width:var(--md-checkbox-icon-size, 18px)}.mark.short{height:2px;transition-property:transform,height;width:2px}.mark.long{height:2px;transition-property:transform,width;width:10px}.mark{animation-duration:150ms;animation-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15);transition-duration:150ms;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15)}.selected .mark{animation-duration:350ms;animation-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1);transition-duration:350ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1)}.checked .mark,.prev-checked.unselected .mark{transform:scaleY(-1) translate(7px, -14px) rotate(45deg)}.checked .mark.short,.prev-checked.unselected .mark.short{height:5.6568542495px}.checked .mark.long,.prev-checked.unselected .mark.long{width:11.313708499px}.indeterminate .mark,.prev-indeterminate.unselected .mark{transform:scaleY(-1) translate(4px, -10px) rotate(0deg)}.prev-unselected .mark{transition-property:none}.prev-unselected.checked .mark.long{animation-name:prev-unselected-to-checked}@keyframes prev-unselected-to-checked{from{width:0}}:where(:hover) .outline{border-color:var(--md-checkbox-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-hover-outline-width, 2px)}:where(:hover) .background{background:var(--md-checkbox-selected-hover-container-color, var(--md-sys-color-primary, #6750a4))}:where(:hover) .icon{fill:var(--md-checkbox-selected-hover-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:focus-within) .outline{border-color:var(--md-checkbox-focus-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-focus-outline-width, 2px)}:where(:focus-within) .background{background:var(--md-checkbox-selected-focus-container-color, var(--md-sys-color-primary, #6750a4))}:where(:focus-within) .icon{fill:var(--md-checkbox-selected-focus-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:active) .outline{border-color:var(--md-checkbox-pressed-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-pressed-outline-width, 2px)}:where(:active) .background{background:var(--md-checkbox-selected-pressed-container-color, var(--md-sys-color-primary, #6750a4))}:where(:active) .icon{fill:var(--md-checkbox-selected-pressed-icon-color, var(--md-sys-color-on-primary, #fff))}:where(.disabled,.prev-disabled) :is(.background,.icon,.mark){animation-duration:0s;transition-duration:0s}:where(.disabled) .outline{border-color:var(--md-checkbox-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-disabled-outline-width, 2px);opacity:var(--md-checkbox-disabled-container-opacity, 0.38)}:where(.selected.disabled) .outline{visibility:hidden}:where(.selected.disabled) .background{background:var(--md-checkbox-selected-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-checkbox-selected-disabled-container-opacity, 0.38)}:where(.disabled) .icon{fill:var(--md-checkbox-selected-disabled-icon-color, var(--md-sys-color-surface, #fef7ff))}@media(forced-colors: active){.background{background-color:CanvasText}.selected.disabled .background{background-color:GrayText;opacity:1}.outline{border-color:CanvasText}.disabled .outline{border-color:GrayText;opacity:1}.icon{fill:Canvas}}
`;
class Vi extends nt {
}
Vi.styles = [zs], customElements.define("ew-checkbox", Vi);
class Bs {
  constructor(e) {
    this.targetElement = e, this.state = { bold: !1, italic: !1, underline: !1, strikethrough: !1, foregroundColor: null, backgroundColor: null, carriageReturn: !1, lines: [], secret: !1 };
  }
  logs() {
    return this.targetElement.innerText;
  }
  processLine(e) {
    const t = /(?:\033|\\033)(?:\[(.*?)[@-~]|\].*?(?:\007|\033\\))/g;
    let r = 0;
    const s = document.createElement("span");
    s.classList.add("line");
    const o = (a) => {
      if (a === "") return;
      const n = document.createElement("span");
      if (this.state.bold && n.classList.add("log-bold"), this.state.italic && n.classList.add("log-italic"), this.state.underline && n.classList.add("log-underline"), this.state.strikethrough && n.classList.add("log-strikethrough"), this.state.secret && n.classList.add("log-secret"), this.state.foregroundColor !== null && n.classList.add(`log-fg-${this.state.foregroundColor}`), this.state.backgroundColor !== null && n.classList.add(`log-bg-${this.state.backgroundColor}`), n.appendChild(document.createTextNode(a)), s.appendChild(n), this.state.secret) {
        const d = document.createElement("span");
        d.classList.add("log-secret-redacted"), d.appendChild(document.createTextNode("[redacted]")), s.appendChild(d);
      }
    };
    for (; ; ) {
      const a = t.exec(e);
      if (a === null) break;
      const n = a.index;
      if (o(e.substring(r, n)), r = n + a[0].length, a[1] !== void 0) for (const d of a[1].split(";")) switch (parseInt(d)) {
        case 0:
          this.state.bold = !1, this.state.italic = !1, this.state.underline = !1, this.state.strikethrough = !1, this.state.foregroundColor = null, this.state.backgroundColor = null, this.state.secret = !1;
          break;
        case 1:
          this.state.bold = !0;
          break;
        case 3:
          this.state.italic = !0;
          break;
        case 4:
          this.state.underline = !0;
          break;
        case 5:
          this.state.secret = !0;
          break;
        case 6:
          this.state.secret = !1;
          break;
        case 9:
          this.state.strikethrough = !0;
          break;
        case 22:
          this.state.bold = !1;
          break;
        case 23:
          this.state.italic = !1;
          break;
        case 24:
          this.state.underline = !1;
          break;
        case 29:
          this.state.strikethrough = !1;
          break;
        case 30:
          this.state.foregroundColor = "black";
          break;
        case 31:
          this.state.foregroundColor = "red";
          break;
        case 32:
          this.state.foregroundColor = "green";
          break;
        case 33:
          this.state.foregroundColor = "yellow";
          break;
        case 34:
          this.state.foregroundColor = "blue";
          break;
        case 35:
          this.state.foregroundColor = "magenta";
          break;
        case 36:
          this.state.foregroundColor = "cyan";
          break;
        case 37:
          this.state.foregroundColor = "white";
          break;
        case 39:
          this.state.foregroundColor = null;
          break;
        case 41:
          this.state.backgroundColor = "red";
          break;
        case 42:
          this.state.backgroundColor = "green";
          break;
        case 43:
          this.state.backgroundColor = "yellow";
          break;
        case 44:
          this.state.backgroundColor = "blue";
          break;
        case 45:
          this.state.backgroundColor = "magenta";
          break;
        case 46:
          this.state.backgroundColor = "cyan";
          break;
        case 47:
          this.state.backgroundColor = "white";
          break;
        case 40:
        case 49:
          this.state.backgroundColor = null;
      }
    }
    return o(e.substring(r)), s;
  }
  processLines() {
    const e = this.targetElement.scrollTop > this.targetElement.scrollHeight - this.targetElement.offsetHeight - 50, t = this.state.carriageReturn, r = document.createDocumentFragment();
    if (this.state.lines.length != 0) {
      for (const s of this.state.lines) this.state.carriageReturn && s !== `
` && r.childElementCount && r.removeChild(r.lastChild), r.appendChild(this.processLine(s)), this.state.carriageReturn = s.includes("\r");
      t && this.state.lines[0] !== `
` ? this.targetElement.replaceChild(r, this.targetElement.lastChild) : this.targetElement.appendChild(r), this.state.lines = [], e && (this.targetElement.scrollTop = this.targetElement.scrollHeight);
    }
  }
  addLine(e) {
    this.state.lines.length == 0 && setTimeout((() => this.processLines()), 0), this.state.lines.push(e);
  }
}
const Ht = (i) => new Promise(((e) => setTimeout(e, i)));
class Us {
  constructor() {
    this.chunks = "";
  }
  transform(e, t) {
    this.chunks += e;
    const r = this.chunks.split(/\r?\n/);
    this.chunks = r.pop(), r.forEach(((s) => t.enqueue(s + `\r
`)));
  }
  flush(e) {
    e.enqueue(this.chunks);
  }
}
class Ns {
  transform(e, t) {
    const r = /* @__PURE__ */ new Date(), s = r.getHours().toString().padStart(2, "0"), o = r.getMinutes().toString().padStart(2, "0"), a = r.getSeconds().toString().padStart(2, "0");
    t.enqueue(`[${s}:${o}:${a}]${e}`);
  }
}
class O extends Error {
}
function Vt(i) {
  let e = i.length;
  for (; --e >= 0; ) i[e] = 0;
}
const Di = 256, Vr = 286, re = 30, se = 15, wi = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]), De = new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]), Hs = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]), Ki = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), vt = new Array(576);
Vt(vt);
const oe = new Array(60);
Vt(oe);
const ue = new Array(512);
Vt(ue);
const fe = new Array(256);
Vt(fe);
const Mi = new Array(29);
Vt(Mi);
const ze = new Array(re);
function ei(i, e, t, r, s) {
  this.static_tree = i, this.extra_bits = e, this.extra_base = t, this.elems = r, this.max_length = s, this.has_stree = i && i.length;
}
let ji, Yi, Xi;
function ii(i, e) {
  this.dyn_tree = i, this.max_code = 0, this.stat_desc = e;
}
Vt(ze);
const Kr = (i) => i < 256 ? ue[i] : ue[256 + (i >>> 7)], me = (i, e) => {
  i.pending_buf[i.pending++] = 255 & e, i.pending_buf[i.pending++] = e >>> 8 & 255;
}, Z = (i, e, t) => {
  i.bi_valid > 16 - t ? (i.bi_buf |= e << i.bi_valid & 65535, me(i, i.bi_buf), i.bi_buf = e >> 16 - i.bi_valid, i.bi_valid += t - 16) : (i.bi_buf |= e << i.bi_valid & 65535, i.bi_valid += t);
}, dt = (i, e, t) => {
  Z(i, t[2 * e], t[2 * e + 1]);
}, jr = (i, e) => {
  let t = 0;
  do
    t |= 1 & i, i >>>= 1, t <<= 1;
  while (--e > 0);
  return t >>> 1;
}, Yr = (i, e, t) => {
  const r = new Array(16);
  let s, o, a = 0;
  for (s = 1; s <= se; s++) a = a + t[s - 1] << 1, r[s] = a;
  for (o = 0; o <= e; o++) {
    let n = i[2 * o + 1];
    n !== 0 && (i[2 * o] = jr(r[n]++, n));
  }
}, Xr = (i) => {
  let e;
  for (e = 0; e < Vr; e++) i.dyn_ltree[2 * e] = 0;
  for (e = 0; e < re; e++) i.dyn_dtree[2 * e] = 0;
  for (e = 0; e < 19; e++) i.bl_tree[2 * e] = 0;
  i.dyn_ltree[512] = 1, i.opt_len = i.static_len = 0, i.sym_next = i.matches = 0;
}, Jr = (i) => {
  i.bi_valid > 8 ? me(i, i.bi_buf) : i.bi_valid > 0 && (i.pending_buf[i.pending++] = i.bi_buf), i.bi_buf = 0, i.bi_valid = 0;
}, Ji = (i, e, t, r) => {
  const s = 2 * e, o = 2 * t;
  return i[s] < i[o] || i[s] === i[o] && r[e] <= r[t];
}, ri = (i, e, t) => {
  const r = i.heap[t];
  let s = t << 1;
  for (; s <= i.heap_len && (s < i.heap_len && Ji(e, i.heap[s + 1], i.heap[s], i.depth) && s++, !Ji(e, r, i.heap[s], i.depth)); ) i.heap[t] = i.heap[s], t = s, s <<= 1;
  i.heap[t] = r;
}, Qi = (i, e, t) => {
  let r, s, o, a, n = 0;
  if (i.sym_next !== 0) do
    r = 255 & i.pending_buf[i.sym_buf + n++], r += (255 & i.pending_buf[i.sym_buf + n++]) << 8, s = i.pending_buf[i.sym_buf + n++], r === 0 ? dt(i, s, e) : (o = fe[s], dt(i, o + Di + 1, e), a = wi[o], a !== 0 && (s -= Mi[o], Z(i, s, a)), r--, o = Kr(r), dt(i, o, t), a = De[o], a !== 0 && (r -= ze[o], Z(i, r, a)));
  while (n < i.sym_next);
  dt(i, 256, e);
}, si = (i, e) => {
  const t = e.dyn_tree, r = e.stat_desc.static_tree, s = e.stat_desc.has_stree, o = e.stat_desc.elems;
  let a, n, d, l = -1;
  for (i.heap_len = 0, i.heap_max = 573, a = 0; a < o; a++) t[2 * a] !== 0 ? (i.heap[++i.heap_len] = l = a, i.depth[a] = 0) : t[2 * a + 1] = 0;
  for (; i.heap_len < 2; ) d = i.heap[++i.heap_len] = l < 2 ? ++l : 0, t[2 * d] = 1, i.depth[d] = 0, i.opt_len--, s && (i.static_len -= r[2 * d + 1]);
  for (e.max_code = l, a = i.heap_len >> 1; a >= 1; a--) ri(i, t, a);
  d = o;
  do
    a = i.heap[1], i.heap[1] = i.heap[i.heap_len--], ri(i, t, 1), n = i.heap[1], i.heap[--i.heap_max] = a, i.heap[--i.heap_max] = n, t[2 * d] = t[2 * a] + t[2 * n], i.depth[d] = (i.depth[a] >= i.depth[n] ? i.depth[a] : i.depth[n]) + 1, t[2 * a + 1] = t[2 * n + 1] = d, i.heap[1] = d++, ri(i, t, 1);
  while (i.heap_len >= 2);
  i.heap[--i.heap_max] = i.heap[1], ((c, f) => {
    const m = f.dyn_tree, p = f.max_code, E = f.stat_desc.static_tree, v = f.stat_desc.has_stree, _ = f.stat_desc.extra_bits, k = f.stat_desc.extra_base, w = f.stat_desc.max_length;
    let u, x, C, b, T, A, S = 0;
    for (b = 0; b <= se; b++) c.bl_count[b] = 0;
    for (m[2 * c.heap[c.heap_max] + 1] = 0, u = c.heap_max + 1; u < 573; u++) x = c.heap[u], b = m[2 * m[2 * x + 1] + 1] + 1, b > w && (b = w, S++), m[2 * x + 1] = b, x > p || (c.bl_count[b]++, T = 0, x >= k && (T = _[x - k]), A = m[2 * x], c.opt_len += A * (b + T), v && (c.static_len += A * (E[2 * x + 1] + T)));
    if (S !== 0) {
      do {
        for (b = w - 1; c.bl_count[b] === 0; ) b--;
        c.bl_count[b]--, c.bl_count[b + 1] += 2, c.bl_count[w]--, S -= 2;
      } while (S > 0);
      for (b = w; b !== 0; b--) for (x = c.bl_count[b]; x !== 0; ) C = c.heap[--u], C > p || (m[2 * C + 1] !== b && (c.opt_len += (b - m[2 * C + 1]) * m[2 * C], m[2 * C + 1] = b), x--);
    }
  })(i, e), Yr(t, l, i.bl_count);
}, tr = (i, e, t) => {
  let r, s, o = -1, a = e[1], n = 0, d = 7, l = 4;
  for (a === 0 && (d = 138, l = 3), e[2 * (t + 1) + 1] = 65535, r = 0; r <= t; r++) s = a, a = e[2 * (r + 1) + 1], ++n < d && s === a || (n < l ? i.bl_tree[2 * s] += n : s !== 0 ? (s !== o && i.bl_tree[2 * s]++, i.bl_tree[32]++) : n <= 10 ? i.bl_tree[34]++ : i.bl_tree[36]++, n = 0, o = s, a === 0 ? (d = 138, l = 3) : s === a ? (d = 6, l = 3) : (d = 7, l = 4));
}, er = (i, e, t) => {
  let r, s, o = -1, a = e[1], n = 0, d = 7, l = 4;
  for (a === 0 && (d = 138, l = 3), r = 0; r <= t; r++) if (s = a, a = e[2 * (r + 1) + 1], !(++n < d && s === a)) {
    if (n < l) do
      dt(i, s, i.bl_tree);
    while (--n != 0);
    else s !== 0 ? (s !== o && (dt(i, s, i.bl_tree), n--), dt(i, 16, i.bl_tree), Z(i, n - 3, 2)) : n <= 10 ? (dt(i, 17, i.bl_tree), Z(i, n - 3, 3)) : (dt(i, 18, i.bl_tree), Z(i, n - 11, 7));
    n = 0, o = s, a === 0 ? (d = 138, l = 3) : s === a ? (d = 6, l = 3) : (d = 7, l = 4);
  }
};
let ir = !1;
const Qr = (i, e, t, r) => {
  Z(i, 0 + (r ? 1 : 0), 3), Jr(i), me(i, t), me(i, ~t), t && i.pending_buf.set(i.window.subarray(e, e + t), i.pending), i.pending += t;
};
var qs = (i) => {
  ir || ((() => {
    let e, t, r, s, o;
    const a = new Array(16);
    for (r = 0, s = 0; s < 28; s++) for (Mi[s] = r, e = 0; e < 1 << wi[s]; e++) fe[r++] = s;
    for (fe[r - 1] = s, o = 0, s = 0; s < 16; s++) for (ze[s] = o, e = 0; e < 1 << De[s]; e++) ue[o++] = s;
    for (o >>= 7; s < re; s++) for (ze[s] = o << 7, e = 0; e < 1 << De[s] - 7; e++) ue[256 + o++] = s;
    for (t = 0; t <= se; t++) a[t] = 0;
    for (e = 0; e <= 143; ) vt[2 * e + 1] = 8, e++, a[8]++;
    for (; e <= 255; ) vt[2 * e + 1] = 9, e++, a[9]++;
    for (; e <= 279; ) vt[2 * e + 1] = 7, e++, a[7]++;
    for (; e <= 287; ) vt[2 * e + 1] = 8, e++, a[8]++;
    for (Yr(vt, 287, a), e = 0; e < re; e++) oe[2 * e + 1] = 5, oe[2 * e] = jr(e, 5);
    ji = new ei(vt, wi, 257, Vr, se), Yi = new ei(oe, De, 0, re, se), Xi = new ei(new Array(0), Hs, 0, 19, 7);
  })(), ir = !0), i.l_desc = new ii(i.dyn_ltree, ji), i.d_desc = new ii(i.dyn_dtree, Yi), i.bl_desc = new ii(i.bl_tree, Xi), i.bi_buf = 0, i.bi_valid = 0, Xr(i);
}, Gs = (i, e, t, r) => {
  let s, o, a = 0;
  i.level > 0 ? (i.strm.data_type === 2 && (i.strm.data_type = ((n) => {
    let d, l = 4093624447;
    for (d = 0; d <= 31; d++, l >>>= 1) if (1 & l && n.dyn_ltree[2 * d] !== 0) return 0;
    if (n.dyn_ltree[18] !== 0 || n.dyn_ltree[20] !== 0 || n.dyn_ltree[26] !== 0) return 1;
    for (d = 32; d < Di; d++) if (n.dyn_ltree[2 * d] !== 0) return 1;
    return 0;
  })(i)), si(i, i.l_desc), si(i, i.d_desc), a = ((n) => {
    let d;
    for (tr(n, n.dyn_ltree, n.l_desc.max_code), tr(n, n.dyn_dtree, n.d_desc.max_code), si(n, n.bl_desc), d = 18; d >= 3 && n.bl_tree[2 * Ki[d] + 1] === 0; d--) ;
    return n.opt_len += 3 * (d + 1) + 5 + 5 + 4, d;
  })(i), s = i.opt_len + 3 + 7 >>> 3, o = i.static_len + 3 + 7 >>> 3, o <= s && (s = o)) : s = o = t + 5, t + 4 <= s && e !== -1 ? Qr(i, e, t, r) : i.strategy === 4 || o === s ? (Z(i, 2 + (r ? 1 : 0), 3), Qi(i, vt, oe)) : (Z(i, 4 + (r ? 1 : 0), 3), ((n, d, l, c) => {
    let f;
    for (Z(n, d - 257, 5), Z(n, l - 1, 5), Z(n, c - 4, 4), f = 0; f < c; f++) Z(n, n.bl_tree[2 * Ki[f] + 1], 3);
    er(n, n.dyn_ltree, d - 1), er(n, n.dyn_dtree, l - 1);
  })(i, i.l_desc.max_code + 1, i.d_desc.max_code + 1, a + 1), Qi(i, i.dyn_ltree, i.dyn_dtree)), Xr(i), r && Jr(i);
}, Ws = { _tr_init: qs, _tr_stored_block: Qr, _tr_flush_block: Gs, _tr_tally: (i, e, t) => (i.pending_buf[i.sym_buf + i.sym_next++] = e, i.pending_buf[i.sym_buf + i.sym_next++] = e >> 8, i.pending_buf[i.sym_buf + i.sym_next++] = t, e === 0 ? i.dyn_ltree[2 * t]++ : (i.matches++, e--, i.dyn_ltree[2 * (fe[t] + Di + 1)]++, i.dyn_dtree[2 * Kr(e)]++), i.sym_next === i.sym_end), _tr_align: (i) => {
  Z(i, 2, 3), dt(i, 256, vt), ((e) => {
    e.bi_valid === 16 ? (me(e, e.bi_buf), e.bi_buf = 0, e.bi_valid = 0) : e.bi_valid >= 8 && (e.pending_buf[e.pending++] = 255 & e.bi_buf, e.bi_buf >>= 8, e.bi_valid -= 8);
  })(i);
} }, ve = (i, e, t, r) => {
  let s = 65535 & i | 0, o = i >>> 16 & 65535 | 0, a = 0;
  for (; t !== 0; ) {
    a = t > 2e3 ? 2e3 : t, t -= a;
    do
      s = s + e[r++] | 0, o = o + s | 0;
    while (--a);
    s %= 65521, o %= 65521;
  }
  return s | o << 16 | 0;
};
const Zs = new Uint32Array((() => {
  let i, e = [];
  for (var t = 0; t < 256; t++) {
    i = t;
    for (var r = 0; r < 8; r++) i = 1 & i ? 3988292384 ^ i >>> 1 : i >>> 1;
    e[t] = i;
  }
  return e;
})());
var H = (i, e, t, r) => {
  const s = Zs, o = r + t;
  i ^= -1;
  for (let a = r; a < o; a++) i = i >>> 8 ^ s[255 & (i ^ e[a])];
  return -1 ^ i;
}, qt = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" }, Ve = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_MEM_ERROR: -4, Z_BUF_ERROR: -5, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
const { _tr_init: Vs, _tr_stored_block: Ei, _tr_flush_block: Ks, _tr_tally: Et, _tr_align: js } = Ws, { Z_NO_FLUSH: St, Z_PARTIAL_FLUSH: Ys, Z_FULL_FLUSH: Xs, Z_FINISH: et, Z_BLOCK: rr, Z_OK: q, Z_STREAM_END: sr, Z_STREAM_ERROR: ct, Z_DATA_ERROR: Js, Z_BUF_ERROR: oi, Z_DEFAULT_COMPRESSION: Qs, Z_FILTERED: to, Z_HUFFMAN_ONLY: xe, Z_RLE: eo, Z_FIXED: io, Z_DEFAULT_STRATEGY: ro, Z_UNKNOWN: so, Z_DEFLATED: Be } = Ve, Lt = 258, ht = 262, Gt = 42, Tt = 113, Qt = 666, $t = (i, e) => (i.msg = qt[e], e), or = (i) => 2 * i - (i > 4 ? 9 : 0), xt = (i) => {
  let e = i.length;
  for (; --e >= 0; ) i[e] = 0;
}, oo = (i) => {
  let e, t, r, s = i.w_size;
  e = i.hash_size, r = e;
  do
    t = i.head[--r], i.head[r] = t >= s ? t - s : 0;
  while (--e);
  e = s, r = e;
  do
    t = i.prev[--r], i.prev[r] = t >= s ? t - s : 0;
  while (--e);
};
let Pi = (i, e, t) => (e << i.hash_shift ^ t) & i.hash_mask;
const Mt = (i, e) => {
  let t;
  if (i.legacy_hash) t = i.ins_h = Pi(i, i.ins_h, i.window[e + 3 - 1]);
  else {
    const s = i.window, o = s[e] | s[e + 1] << 8 | s[e + 2] << 16 | s[e + 3] << 24;
    t = i.ins_h = Math.imul(o, 66521) + 66521 >>> 16 & i.hash_mask;
  }
  const r = i.prev[e & i.w_mask] = i.head[t];
  return i.head[t] = e, r;
}, Y = (i) => {
  const e = i.state;
  let t = e.pending;
  t > i.avail_out && (t = i.avail_out), t !== 0 && (i.output.set(e.pending_buf.subarray(e.pending_out, e.pending_out + t), i.next_out), i.next_out += t, e.pending_out += t, i.total_out += t, i.avail_out -= t, e.pending -= t, e.pending === 0 && (e.pending_out = 0));
}, X = (i, e) => {
  Ks(i, i.block_start >= 0 ? i.block_start : -1, i.strstart - i.block_start, e), i.block_start = i.strstart, Y(i.strm);
}, L = (i, e) => {
  i.pending_buf[i.pending++] = e;
}, Kt = (i, e) => {
  i.pending_buf[i.pending++] = e >>> 8 & 255, i.pending_buf[i.pending++] = 255 & e;
}, Si = (i, e, t, r) => {
  let s = i.avail_in;
  return s > r && (s = r), s === 0 ? 0 : (i.avail_in -= s, e.set(i.input.subarray(i.next_in, i.next_in + s), t), i.state.wrap === 1 ? i.adler = ve(i.adler, e, s, t) : i.state.wrap === 2 && (i.adler = H(i.adler, e, s, t)), i.next_in += s, i.total_in += s, s);
}, ts = (i, e) => {
  let t, r, s = i.max_chain_length, o = i.strstart, a = i.prev_length, n = i.nice_match;
  const d = i.strstart > i.w_size - ht ? i.strstart - (i.w_size - ht) : 0, l = i.window, c = i.w_mask, f = i.prev, m = i.strstart + Lt;
  let p = l[o + a - 1], E = l[o + a];
  i.prev_length >= i.good_match && (s >>= 2), n > i.lookahead && (n = i.lookahead);
  do
    if (t = e, l[t + a] === E && l[t + a - 1] === p && l[t] === l[o] && l[++t] === l[o + 1]) {
      o += 2, t++;
      do
        ;
      while (l[++o] === l[++t] && l[++o] === l[++t] && l[++o] === l[++t] && l[++o] === l[++t] && l[++o] === l[++t] && l[++o] === l[++t] && l[++o] === l[++t] && l[++o] === l[++t] && o < m);
      if (r = Lt - (m - o), o = m - Lt, r > a) {
        if (i.match_start = e, a = r, r >= n) break;
        p = l[o + a - 1], E = l[o + a];
      }
    }
  while ((e = f[e & c]) > d && --s != 0);
  return a <= i.lookahead ? a : i.lookahead;
}, Wt = (i) => {
  const e = i.w_size;
  let t, r, s;
  do {
    if (r = i.window_size - i.lookahead - i.strstart, i.strstart >= e + (e - ht) && (i.window.set(i.window.subarray(e, e + e - r), 0), i.match_start -= e, i.strstart -= e, i.block_start -= e, i.insert > i.strstart && (i.insert = i.strstart), oo(i), r += e), i.strm.avail_in === 0) break;
    if (t = Si(i.strm, i.window, i.strstart + i.lookahead, r), i.lookahead += t, i.legacy_hash) {
      if (i.lookahead + i.insert >= 3) for (s = i.strstart - i.insert, i.ins_h = i.window[s], i.ins_h = Pi(i, i.ins_h, i.window[s + 1]); i.insert && (Mt(i, s), s++, i.insert--, !(i.lookahead + i.insert < 3)); ) ;
    } else if (i.lookahead + i.insert > 3) for (s = i.strstart - i.insert; i.insert && (Mt(i, s), s++, i.insert--, !(i.lookahead + i.insert <= 3)); ) ;
  } while (i.lookahead < ht && i.strm.avail_in !== 0);
}, es = (i, e) => {
  let t, r, s, o = i.pending_buf_size - 5 > i.w_size ? i.w_size : i.pending_buf_size - 5, a = 0, n = i.strm.avail_in;
  do {
    if (t = 65535, s = i.bi_valid + 42 >> 3, i.strm.avail_out < s || (s = i.strm.avail_out - s, r = i.strstart - i.block_start, t > r + i.strm.avail_in && (t = r + i.strm.avail_in), t > s && (t = s), t < o && (t === 0 && e !== et || e === St || t !== r + i.strm.avail_in))) break;
    a = e === et && t === r + i.strm.avail_in ? 1 : 0, Ei(i, 0, 0, a), i.pending_buf[i.pending - 4] = t, i.pending_buf[i.pending - 3] = t >> 8, i.pending_buf[i.pending - 2] = ~t, i.pending_buf[i.pending - 1] = ~t >> 8, Y(i.strm), r && (r > t && (r = t), i.strm.output.set(i.window.subarray(i.block_start, i.block_start + r), i.strm.next_out), i.strm.next_out += r, i.strm.avail_out -= r, i.strm.total_out += r, i.block_start += r, t -= r), t && (Si(i.strm, i.strm.output, i.strm.next_out, t), i.strm.next_out += t, i.strm.avail_out -= t, i.strm.total_out += t);
  } while (a === 0);
  return n -= i.strm.avail_in, n && (n >= i.w_size ? (i.matches = 2, i.window.set(i.strm.input.subarray(i.strm.next_in - i.w_size, i.strm.next_in), 0), i.strstart = i.w_size, i.insert = i.strstart) : (i.window_size - i.strstart <= n && (i.strstart -= i.w_size, i.window.set(i.window.subarray(i.w_size, i.w_size + i.strstart), 0), i.matches < 2 && i.matches++, i.insert > i.strstart && (i.insert = i.strstart)), i.window.set(i.strm.input.subarray(i.strm.next_in - n, i.strm.next_in), i.strstart), i.strstart += n, i.insert += n > i.w_size - i.insert ? i.w_size - i.insert : n), i.block_start = i.strstart), i.high_water < i.strstart && (i.high_water = i.strstart), a ? 4 : e !== St && e !== et && i.strm.avail_in === 0 && i.strstart === i.block_start ? 2 : (s = i.window_size - i.strstart, i.strm.avail_in > s && i.block_start >= i.w_size && (i.block_start -= i.w_size, i.strstart -= i.w_size, i.window.set(i.window.subarray(i.w_size, i.w_size + i.strstart), 0), i.matches < 2 && i.matches++, s += i.w_size, i.insert > i.strstart && (i.insert = i.strstart)), s > i.strm.avail_in && (s = i.strm.avail_in), s && (Si(i.strm, i.window, i.strstart, s), i.strstart += s, i.insert += s > i.w_size - i.insert ? i.w_size - i.insert : s), i.high_water < i.strstart && (i.high_water = i.strstart), s = i.bi_valid + 42 >> 3, s = i.pending_buf_size - s > 65535 ? 65535 : i.pending_buf_size - s, o = s > i.w_size ? i.w_size : s, r = i.strstart - i.block_start, (r >= o || (r || e === et) && e !== St && i.strm.avail_in === 0 && r <= s) && (t = r > s ? s : r, a = e === et && i.strm.avail_in === 0 && t === r ? 1 : 0, Ei(i, i.block_start, t, a), i.block_start += t, Y(i.strm)), a ? 3 : 1);
}, ai = (i, e) => {
  let t, r;
  for (; ; ) {
    if (i.lookahead < ht) {
      if (Wt(i), i.lookahead < ht && e === St) return 1;
      if (i.lookahead === 0) break;
    }
    if (t = 0, i.lookahead >= 3 && (t = Mt(i, i.strstart)), t !== 0 && i.strstart - t <= i.w_size - ht && (i.match_length = ts(i, t)), i.match_length >= 3) if (r = Et(i, i.strstart - i.match_start, i.match_length - 3), i.lookahead -= i.match_length, i.match_length <= i.max_lazy_match && i.lookahead >= 3) {
      i.match_length--;
      do
        i.strstart++, t = Mt(i, i.strstart);
      while (--i.match_length != 0);
      i.strstart++;
    } else i.strstart += i.match_length, i.match_length = 0, i.legacy_hash && (i.ins_h = i.window[i.strstart], i.ins_h = Pi(i, i.ins_h, i.window[i.strstart + 1]));
    else r = Et(i, 0, i.window[i.strstart]), i.lookahead--, i.strstart++;
    if (r && (X(i, !1), i.strm.avail_out === 0)) return 1;
  }
  return i.insert = i.strstart < 2 ? i.strstart : 2, e === et ? (X(i, !0), i.strm.avail_out === 0 ? 3 : 4) : i.sym_next && (X(i, !1), i.strm.avail_out === 0) ? 1 : 2;
}, zt = (i, e) => {
  let t, r, s;
  for (; ; ) {
    if (i.lookahead < ht) {
      if (Wt(i), i.lookahead < ht && e === St) return 1;
      if (i.lookahead === 0) break;
    }
    if (t = 0, i.lookahead >= 3 && (t = Mt(i, i.strstart)), i.prev_length = i.match_length, i.prev_match = i.match_start, i.match_length = 2, t !== 0 && i.prev_length < i.max_lazy_match && i.strstart - t <= i.w_size - ht && (i.match_length = ts(i, t), i.match_length <= 5 && (i.strategy === to || i.match_length === 3 && i.strstart - i.match_start > 4096) && (i.match_length = 2)), i.prev_length >= 3 && i.match_length <= i.prev_length) {
      s = i.strstart + i.lookahead - 3, r = Et(i, i.strstart - 1 - i.prev_match, i.prev_length - 3), i.lookahead -= i.prev_length - 1, i.prev_length -= 2;
      do
        ++i.strstart <= s && (t = Mt(i, i.strstart));
      while (--i.prev_length != 0);
      if (i.match_available = 0, i.match_length = 2, i.strstart++, r && (X(i, !1), i.strm.avail_out === 0)) return 1;
    } else if (i.match_available) {
      if (r = Et(i, 0, i.window[i.strstart - 1]), r && X(i, !1), i.strstart++, i.lookahead--, i.strm.avail_out === 0) return 1;
    } else i.match_available = 1, i.strstart++, i.lookahead--;
  }
  return i.match_available && (r = Et(i, 0, i.window[i.strstart - 1]), i.match_available = 0), i.insert = i.strstart < 2 ? i.strstart : 2, e === et ? (X(i, !0), i.strm.avail_out === 0 ? 3 : 4) : i.sym_next && (X(i, !1), i.strm.avail_out === 0) ? 1 : 2;
};
function at(i, e, t, r, s) {
  this.good_length = i, this.max_lazy = e, this.nice_length = t, this.max_chain = r, this.func = s;
}
const te = [new at(0, 0, 0, 0, es), new at(4, 4, 8, 4, ai), new at(4, 5, 16, 8, ai), new at(4, 6, 32, 32, ai), new at(4, 4, 16, 16, zt), new at(8, 16, 32, 32, zt), new at(8, 16, 128, 128, zt), new at(8, 32, 128, 256, zt), new at(32, 128, 258, 1024, zt), new at(32, 258, 258, 4096, zt)];
function ao() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Be, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.legacy_hash = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(1146), this.dyn_dtree = new Uint16Array(122), this.bl_tree = new Uint16Array(78), xt(this.dyn_ltree), xt(this.dyn_dtree), xt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(16), this.heap = new Uint16Array(573), xt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(573), xt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const ae = (i) => {
  if (!i) return 1;
  const e = i.state;
  return !e || e.strm !== i || e.status !== Gt && e.status !== 57 && e.status !== 69 && e.status !== 73 && e.status !== 91 && e.status !== 103 && e.status !== Tt && e.status !== Qt ? 1 : 0;
}, is = (i) => {
  if (ae(i)) return $t(i, ct);
  i.total_in = i.total_out = 0, i.data_type = so;
  const e = i.state;
  return e.pending = 0, e.pending_out = 0, e.wrap < 0 && (e.wrap = -e.wrap), e.status = e.wrap === 2 ? 57 : e.wrap ? Gt : Tt, i.adler = e.wrap === 2 ? 0 : 1, e.last_flush = -2, Vs(e), q;
}, rs = (i) => {
  const e = is(i);
  var t;
  return e === q && ((t = i.state).window_size = 2 * t.w_size, xt(t.head), t.max_lazy_match = te[t.level].max_lazy, t.good_match = te[t.level].good_length, t.nice_match = te[t.level].nice_length, t.max_chain_length = te[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = 2, t.match_available = 0, t.ins_h = 0), e;
}, ar = (i, e, t, r, s, o, a) => {
  if (!i) return ct;
  let n = 1;
  if (e === Qs && (e = 6), r < 0 ? (n = 0, r = -r) : r > 15 && (n = 2, r -= 16), s < 1 || s > 9 || t !== Be || r < 8 || r > 15 || e < 0 || e > 9 || o < 0 || o > io || r === 8 && n !== 1) return $t(i, ct);
  r === 8 && (r = 9);
  const d = new ao();
  return i.state = d, d.strm = i, d.status = Gt, d.wrap = n, d.gzhead = null, d.w_bits = r, d.w_size = 1 << d.w_bits, d.w_mask = d.w_size - 1, d.legacy_hash = a ? 1 : 0, d.hash_bits = s + 7, !d.legacy_hash && d.hash_bits < 15 && (d.hash_bits = 15), d.hash_size = 1 << d.hash_bits, d.hash_mask = d.hash_size - 1, d.hash_shift = ~~((d.hash_bits + 3 - 1) / 3), d.window = new Uint8Array(2 * d.w_size), d.head = new Uint16Array(d.hash_size), d.prev = new Uint16Array(d.w_size), d.lit_bufsize = 1 << s + 6, d.pending_buf_size = 4 * d.lit_bufsize, d.pending_buf = new Uint8Array(d.pending_buf_size), d.sym_buf = d.lit_bufsize, d.sym_end = 3 * (d.lit_bufsize - 1), d.level = e, d.strategy = o, d.method = t, rs(i);
};
var no = (i, e) => {
  let t = e.length;
  if (ae(i)) return ct;
  const r = i.state, s = r.wrap;
  if (s === 2 || s === 1 && r.status !== Gt || r.lookahead) return ct;
  if (s === 1 && (i.adler = ve(i.adler, e, t, 0)), r.wrap = 0, t >= r.w_size) {
    s === 0 && (xt(r.head), r.strstart = 0, r.block_start = 0, r.insert = 0);
    let d = new Uint8Array(r.w_size);
    d.set(e.subarray(t - r.w_size, t), 0), e = d, t = r.w_size;
  }
  const o = i.avail_in, a = i.next_in, n = i.input;
  for (i.avail_in = t, i.next_in = 0, i.input = e, Wt(r); r.lookahead >= 3; ) {
    let d = r.strstart, l = r.lookahead - 2;
    do
      Mt(r, d), d++;
    while (--l);
    r.strstart = d, r.lookahead = 2, Wt(r);
  }
  return r.strstart += r.lookahead, r.block_start = r.strstart, r.insert = r.lookahead, r.lookahead = 0, r.match_length = r.prev_length = 2, r.match_available = 0, i.next_in = a, i.input = n, i.avail_in = o, r.wrap = s, q;
}, ne = { deflateInit: (i, e) => ar(i, e, Be, 15, 8, ro), deflateInit2: ar, deflateReset: rs, deflateResetKeep: is, deflateSetHeader: (i, e) => ae(i) || i.state.wrap !== 2 ? ct : (i.state.gzhead = e, q), deflate: (i, e) => {
  if (ae(i) || e > rr || e < 0) return i ? $t(i, ct) : ct;
  const t = i.state;
  if (!i.output || i.avail_in !== 0 && !i.input || t.status === Qt && e !== et) return $t(i, i.avail_out === 0 ? oi : ct);
  const r = t.last_flush;
  if (t.last_flush = e, t.pending !== 0) {
    if (Y(i), i.avail_out === 0) return t.last_flush = -1, q;
  } else if (i.avail_in === 0 && or(e) <= or(r) && e !== et) return $t(i, oi);
  if (t.status === Qt && i.avail_in !== 0) return $t(i, oi);
  if (t.status === Gt && t.wrap === 0 && (t.status = Tt), t.status === Gt) {
    let s = Be + (t.w_bits - 8 << 4) << 8, o = -1;
    if (o = t.strategy >= xe || t.level < 2 ? 0 : t.level < 6 ? 1 : t.level === 6 ? 2 : 3, s |= o << 6, t.strstart !== 0 && (s |= 32), s += 31 - s % 31, Kt(t, s), t.strstart !== 0 && (Kt(t, i.adler >>> 16), Kt(t, 65535 & i.adler)), i.adler = 1, t.status = Tt, Y(i), t.pending !== 0) return t.last_flush = -1, q;
  }
  if (t.status === 57) {
    if (i.adler = 0, L(t, 31), L(t, 139), L(t, 8), t.gzhead) L(t, (t.gzhead.text ? 1 : 0) + (t.gzhead.hcrc ? 2 : 0) + (t.gzhead.extra ? 4 : 0) + (t.gzhead.name ? 8 : 0) + (t.gzhead.comment ? 16 : 0)), L(t, 255 & t.gzhead.time), L(t, t.gzhead.time >> 8 & 255), L(t, t.gzhead.time >> 16 & 255), L(t, t.gzhead.time >> 24 & 255), L(t, t.level === 9 ? 2 : t.strategy >= xe || t.level < 2 ? 4 : 0), L(t, 255 & t.gzhead.os), t.gzhead.extra && t.gzhead.extra.length && (L(t, 255 & t.gzhead.extra.length), L(t, t.gzhead.extra.length >> 8 & 255)), t.gzhead.hcrc && (i.adler = H(i.adler, t.pending_buf, t.pending, 0)), t.gzindex = 0, t.status = 69;
    else if (L(t, 0), L(t, 0), L(t, 0), L(t, 0), L(t, 0), L(t, t.level === 9 ? 2 : t.strategy >= xe || t.level < 2 ? 4 : 0), L(t, 3), t.status = Tt, Y(i), t.pending !== 0) return t.last_flush = -1, q;
  }
  if (t.status === 69) {
    if (t.gzhead.extra) {
      let s = t.pending, o = (65535 & t.gzhead.extra.length) - t.gzindex;
      for (; t.pending + o > t.pending_buf_size; ) {
        let n = t.pending_buf_size - t.pending;
        if (t.pending_buf.set(t.gzhead.extra.subarray(t.gzindex, t.gzindex + n), t.pending), t.pending = t.pending_buf_size, t.gzhead.hcrc && t.pending > s && (i.adler = H(i.adler, t.pending_buf, t.pending - s, s)), t.gzindex += n, Y(i), t.pending !== 0) return t.last_flush = -1, q;
        s = 0, o -= n;
      }
      let a = new Uint8Array(t.gzhead.extra);
      t.pending_buf.set(a.subarray(t.gzindex, t.gzindex + o), t.pending), t.pending += o, t.gzhead.hcrc && t.pending > s && (i.adler = H(i.adler, t.pending_buf, t.pending - s, s)), t.gzindex = 0;
    }
    t.status = 73;
  }
  if (t.status === 73) {
    if (t.gzhead.name) {
      let s, o = t.pending;
      do {
        if (t.pending === t.pending_buf_size) {
          if (t.gzhead.hcrc && t.pending > o && (i.adler = H(i.adler, t.pending_buf, t.pending - o, o)), Y(i), t.pending !== 0) return t.last_flush = -1, q;
          o = 0;
        }
        s = t.gzindex < t.gzhead.name.length ? 255 & t.gzhead.name.charCodeAt(t.gzindex++) : 0, L(t, s);
      } while (s !== 0);
      t.gzhead.hcrc && t.pending > o && (i.adler = H(i.adler, t.pending_buf, t.pending - o, o)), t.gzindex = 0;
    }
    t.status = 91;
  }
  if (t.status === 91) {
    if (t.gzhead.comment) {
      let s, o = t.pending;
      do {
        if (t.pending === t.pending_buf_size) {
          if (t.gzhead.hcrc && t.pending > o && (i.adler = H(i.adler, t.pending_buf, t.pending - o, o)), Y(i), t.pending !== 0) return t.last_flush = -1, q;
          o = 0;
        }
        s = t.gzindex < t.gzhead.comment.length ? 255 & t.gzhead.comment.charCodeAt(t.gzindex++) : 0, L(t, s);
      } while (s !== 0);
      t.gzhead.hcrc && t.pending > o && (i.adler = H(i.adler, t.pending_buf, t.pending - o, o));
    }
    t.status = 103;
  }
  if (t.status === 103) {
    if (t.gzhead.hcrc) {
      if (t.pending + 2 > t.pending_buf_size && (Y(i), t.pending !== 0)) return t.last_flush = -1, q;
      L(t, 255 & i.adler), L(t, i.adler >> 8 & 255), i.adler = 0;
    }
    if (t.status = Tt, Y(i), t.pending !== 0) return t.last_flush = -1, q;
  }
  if (i.avail_in !== 0 || t.lookahead !== 0 || e !== St && t.status !== Qt) {
    let s = t.level === 0 ? es(t, e) : t.strategy === xe ? ((o, a) => {
      let n;
      for (; ; ) {
        if (o.lookahead === 0 && (Wt(o), o.lookahead === 0)) {
          if (a === St) return 1;
          break;
        }
        if (o.match_length = 0, n = Et(o, 0, o.window[o.strstart]), o.lookahead--, o.strstart++, n && (X(o, !1), o.strm.avail_out === 0)) return 1;
      }
      return o.insert = 0, a === et ? (X(o, !0), o.strm.avail_out === 0 ? 3 : 4) : o.sym_next && (X(o, !1), o.strm.avail_out === 0) ? 1 : 2;
    })(t, e) : t.strategy === eo ? ((o, a) => {
      let n, d, l, c;
      const f = o.window;
      for (; ; ) {
        if (o.lookahead <= Lt) {
          if (Wt(o), o.lookahead <= Lt && a === St) return 1;
          if (o.lookahead === 0) break;
        }
        if (o.match_length = 0, o.lookahead >= 3 && o.strstart > 0 && (l = o.strstart - 1, d = f[l], d === f[++l] && d === f[++l] && d === f[++l])) {
          c = o.strstart + Lt;
          do
            ;
          while (d === f[++l] && d === f[++l] && d === f[++l] && d === f[++l] && d === f[++l] && d === f[++l] && d === f[++l] && d === f[++l] && l < c);
          o.match_length = Lt - (c - l), o.match_length > o.lookahead && (o.match_length = o.lookahead);
        }
        if (o.match_length >= 3 ? (n = Et(o, 1, o.match_length - 3), o.lookahead -= o.match_length, o.strstart += o.match_length, o.match_length = 0) : (n = Et(o, 0, o.window[o.strstart]), o.lookahead--, o.strstart++), n && (X(o, !1), o.strm.avail_out === 0)) return 1;
      }
      return o.insert = 0, a === et ? (X(o, !0), o.strm.avail_out === 0 ? 3 : 4) : o.sym_next && (X(o, !1), o.strm.avail_out === 0) ? 1 : 2;
    })(t, e) : te[t.level].func(t, e);
    if (s !== 3 && s !== 4 || (t.status = Qt), s === 1 || s === 3) return i.avail_out === 0 && (t.last_flush = -1), q;
    if (s === 2 && (e === Ys ? js(t) : e !== rr && (Ei(t, 0, 0, !1), e === Xs && (xt(t.head), t.lookahead === 0 && (t.strstart = 0, t.block_start = 0, t.insert = 0))), Y(i), i.avail_out === 0)) return t.last_flush = -1, q;
  }
  return e !== et ? q : t.wrap <= 0 ? sr : (t.wrap === 2 ? (L(t, 255 & i.adler), L(t, i.adler >> 8 & 255), L(t, i.adler >> 16 & 255), L(t, i.adler >> 24 & 255), L(t, 255 & i.total_in), L(t, i.total_in >> 8 & 255), L(t, i.total_in >> 16 & 255), L(t, i.total_in >> 24 & 255)) : (Kt(t, i.adler >>> 16), Kt(t, 65535 & i.adler)), Y(i), t.wrap > 0 && (t.wrap = -t.wrap), t.pending !== 0 ? q : sr);
}, deflateEnd: (i) => {
  if (ae(i)) return ct;
  const e = i.state.status;
  return i.state = null, e === Tt ? $t(i, Js) : q;
}, deflateSetDictionary: no, deflateInfo: "pako deflate (from Nodeca project)" };
const lo = (i, e) => Object.prototype.hasOwnProperty.call(i, e);
var Ke = { assign: function(i) {
  const e = Array.prototype.slice.call(arguments, 1);
  for (; e.length; ) {
    const t = e.shift();
    if (t) {
      if (typeof t != "object") throw new TypeError(t + "must be non-object");
      for (const r in t) lo(t, r) && (i[r] = t[r]);
    }
  }
  return i;
}, flattenChunks: (i) => {
  let e = 0;
  for (let r = 0, s = i.length; r < s; r++) e += i[r].length;
  const t = new Uint8Array(e);
  for (let r = 0, s = 0, o = i.length; r < o; r++) {
    let a = i[r];
    t.set(a, s), s += a.length;
  }
  return t;
} };
let ss = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  ss = !1;
}
const ge = new Uint8Array(256);
for (let i = 0; i < 256; i++) ge[i] = i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1;
ge[254] = ge[255] = 1;
var _e = { string2buf: (i) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode) return new TextEncoder().encode(i);
  let e, t, r, s, o, a = i.length, n = 0;
  for (s = 0; s < a; s++) t = i.charCodeAt(s), (64512 & t) == 55296 && s + 1 < a && (r = i.charCodeAt(s + 1), (64512 & r) == 56320 && (t = 65536 + (t - 55296 << 10) + (r - 56320), s++)), n += t < 128 ? 1 : t < 2048 ? 2 : t < 65536 ? 3 : 4;
  for (e = new Uint8Array(n), o = 0, s = 0; o < n; s++) t = i.charCodeAt(s), (64512 & t) == 55296 && s + 1 < a && (r = i.charCodeAt(s + 1), (64512 & r) == 56320 && (t = 65536 + (t - 55296 << 10) + (r - 56320), s++)), t < 128 ? e[o++] = t : t < 2048 ? (e[o++] = 192 | t >>> 6, e[o++] = 128 | 63 & t) : t < 65536 ? (e[o++] = 224 | t >>> 12, e[o++] = 128 | t >>> 6 & 63, e[o++] = 128 | 63 & t) : (e[o++] = 240 | t >>> 18, e[o++] = 128 | t >>> 12 & 63, e[o++] = 128 | t >>> 6 & 63, e[o++] = 128 | 63 & t);
  return e;
}, buf2string: (i, e) => {
  const t = e || i.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode) return new TextDecoder().decode(i.subarray(0, e));
  let r, s;
  const o = new Array(2 * t);
  for (s = 0, r = 0; r < t; ) {
    let a = i[r++];
    if (a < 128) {
      o[s++] = a;
      continue;
    }
    let n = ge[a];
    if (n > 4) o[s++] = 65533, r += n - 1;
    else {
      for (a &= n === 2 ? 31 : n === 3 ? 15 : 7; n > 1 && r < t; ) a = a << 6 | 63 & i[r++], n--;
      n > 1 ? o[s++] = 65533 : a < 65536 ? o[s++] = a : (a -= 65536, o[s++] = 55296 | a >> 10 & 1023, o[s++] = 56320 | 1023 & a);
    }
  }
  return ((a, n) => {
    if (n < 65534 && a.subarray && ss) return String.fromCharCode.apply(null, a.length === n ? a : a.subarray(0, n));
    let d = "";
    for (let l = 0; l < n; l++) d += String.fromCharCode(a[l]);
    return d;
  })(o, s);
}, utf8border: (i, e) => {
  (e = e || i.length) > i.length && (e = i.length);
  let t = e - 1;
  for (; t >= 0 && (192 & i[t]) == 128; ) t--;
  return t < 0 || t === 0 ? e : t + ge[i[t]] > e ? t : e;
} }, os = function() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
};
const as = Object.prototype.toString, { Z_NO_FLUSH: co, Z_SYNC_FLUSH: ho, Z_FULL_FLUSH: po, Z_FINISH: uo, Z_OK: Ue, Z_STREAM_END: fo, Z_DEFAULT_COMPRESSION: mo, Z_DEFAULT_STRATEGY: vo, Z_DEFLATED: go } = Ve, _o = { level: mo, method: go, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: vo, legacyHash: !0 };
function Me(i) {
  this.options = Ke.assign({}, _o, i || {});
  let e = this.options;
  e.raw && e.windowBits > 0 ? e.windowBits = -e.windowBits : e.gzip && e.windowBits > 0 && e.windowBits < 16 && (e.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new os(), this.strm.avail_out = 0;
  let t = ne.deflateInit2(this.strm, e.level, e.method, e.windowBits, e.memLevel, e.strategy, e.legacyHash);
  if (t !== Ue) throw new Error(qt[t]);
  if (e.header && ne.deflateSetHeader(this.strm, e.header), e.dictionary) {
    let r;
    if (r = typeof e.dictionary == "string" ? _e.string2buf(e.dictionary) : as.call(e.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(e.dictionary) : e.dictionary, t = ne.deflateSetDictionary(this.strm, r), t !== Ue) throw new Error(qt[t]);
    this._dict_set = !0;
  }
}
Me.prototype.push = function(i, e) {
  const t = this.strm, r = this.options.chunkSize;
  let s, o;
  if (this.ended) return !1;
  for (o = e === ~~e ? e : e === !0 ? uo : co, typeof i == "string" ? t.input = _e.string2buf(i) : as.call(i) === "[object ArrayBuffer]" ? t.input = new Uint8Array(i) : t.input = i, t.next_in = 0, t.avail_in = t.input.length; ; ) if (t.avail_out === 0 && (t.output = new Uint8Array(r), t.next_out = 0, t.avail_out = r), (o === ho || o === po) && t.avail_out <= 6) this.onData(t.output.subarray(0, t.next_out)), t.avail_out = 0;
  else {
    if (s = ne.deflate(t, o), s === fo) return t.next_out > 0 && this.onData(t.output.subarray(0, t.next_out)), s = ne.deflateEnd(this.strm), this.onEnd(s), this.ended = !0, s === Ue;
    if (t.avail_out !== 0) {
      if (o > 0 && t.next_out > 0) this.onData(t.output.subarray(0, t.next_out)), t.avail_out = 0;
      else if (t.avail_in === 0) break;
    } else this.onData(t.output);
  }
  return !0;
}, Me.prototype.onData = function(i) {
  this.chunks.push(i);
}, Me.prototype.onEnd = function(i) {
  i === Ue && (this.result = Ke.flattenChunks(this.chunks)), this.chunks = [], this.err = i, this.msg = this.strm.msg;
};
var bo = { deflate: function(i, e) {
  const t = new Me(e);
  if (t.push(i, !0), t.err) throw t.msg || qt[t.err];
  return t.result;
} };
const we = 16209;
var yo = function(i, e) {
  let t, r, s, o, a, n, d, l, c, f, m, p, E, v, _, k, w, u, x, C, b, T, A, S;
  const I = i.state;
  t = i.next_in, A = i.input, r = t + (i.avail_in - 5), s = i.next_out, S = i.output, o = s - (e - i.avail_out), a = s + (i.avail_out - 257), n = I.dmax, d = I.wsize, l = I.whave, c = I.wnext, f = I.window, m = I.hold, p = I.bits, E = I.lencode, v = I.distcode, _ = (1 << I.lenbits) - 1, k = (1 << I.distbits) - 1;
  t: do {
    p < 15 && (m += A[t++] << p, p += 8, m += A[t++] << p, p += 8), w = E[m & _];
    e: for (; ; ) {
      if (u = w >>> 24, m >>>= u, p -= u, u = w >>> 16 & 255, u === 0) S[s++] = 65535 & w;
      else {
        if (!(16 & u)) {
          if ((64 & u) == 0) {
            w = E[(65535 & w) + (m & (1 << u) - 1)];
            continue e;
          }
          if (32 & u) {
            I.mode = 16191;
            break t;
          }
          i.msg = "invalid literal/length code", I.mode = we;
          break t;
        }
        x = 65535 & w, u &= 15, u && (p < u && (m += A[t++] << p, p += 8), x += m & (1 << u) - 1, m >>>= u, p -= u), p < 15 && (m += A[t++] << p, p += 8, m += A[t++] << p, p += 8), w = v[m & k];
        i: for (; ; ) {
          if (u = w >>> 24, m >>>= u, p -= u, u = w >>> 16 & 255, !(16 & u)) {
            if ((64 & u) == 0) {
              w = v[(65535 & w) + (m & (1 << u) - 1)];
              continue i;
            }
            i.msg = "invalid distance code", I.mode = we;
            break t;
          }
          if (C = 65535 & w, u &= 15, p < u && (m += A[t++] << p, p += 8, p < u && (m += A[t++] << p, p += 8)), C += m & (1 << u) - 1, C > n) {
            i.msg = "invalid distance too far back", I.mode = we;
            break t;
          }
          if (m >>>= u, p -= u, u = s - o, C > u) {
            if (u = C - u, u > l && I.sane) {
              i.msg = "invalid distance too far back", I.mode = we;
              break t;
            }
            if (b = 0, T = f, c === 0) {
              if (b += d - u, u < x) {
                x -= u;
                do
                  S[s++] = f[b++];
                while (--u);
                b = s - C, T = S;
              }
            } else if (c < u) {
              if (b += d + c - u, u -= c, u < x) {
                x -= u;
                do
                  S[s++] = f[b++];
                while (--u);
                if (b = 0, c < x) {
                  u = c, x -= u;
                  do
                    S[s++] = f[b++];
                  while (--u);
                  b = s - C, T = S;
                }
              }
            } else if (b += c - u, u < x) {
              x -= u;
              do
                S[s++] = f[b++];
              while (--u);
              b = s - C, T = S;
            }
            for (; x > 2; ) S[s++] = T[b++], S[s++] = T[b++], S[s++] = T[b++], x -= 3;
            x && (S[s++] = T[b++], x > 1 && (S[s++] = T[b++]));
          } else {
            b = s - C;
            do
              S[s++] = S[b++], S[s++] = S[b++], S[s++] = S[b++], x -= 3;
            while (x > 2);
            x && (S[s++] = S[b++], x > 1 && (S[s++] = S[b++]));
          }
          break;
        }
      }
      break;
    }
  } while (t < r && s < a);
  x = p >> 3, t -= x, p -= x << 3, m &= (1 << p) - 1, i.next_in = t, i.next_out = s, i.avail_in = t < r ? r - t + 5 : 5 - (t - r), i.avail_out = s < a ? a - s + 257 : 257 - (s - a), I.hold = m, I.bits = p;
};
const Ee = 15, xo = new Uint16Array([3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0]), wo = new Uint8Array([16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 199, 75]), Eo = new Uint16Array([1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0]), So = new Uint8Array([16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64]);
var le = (i, e, t, r, s, o, a, n) => {
  const d = n.bits;
  let l, c, f, m, p, E, v = 0, _ = 0, k = 0, w = 0, u = 0, x = 0, C = 0, b = 0, T = 0, A = 0, S = null;
  const I = new Uint16Array(16), D = new Uint16Array(16);
  let K, bt, rt, It = null;
  for (v = 0; v <= Ee; v++) I[v] = 0;
  for (_ = 0; _ < r; _++) I[e[t + _]]++;
  for (u = d, w = Ee; w >= 1 && I[w] === 0; w--) ;
  if (u > w && (u = w), w === 0) return s[o++] = 20971520, s[o++] = 20971520, n.bits = 1, 0;
  for (k = 1; k < w && I[k] === 0; k++) ;
  for (u < k && (u = k), b = 1, v = 1; v <= Ee; v++) if (b <<= 1, b -= I[v], b < 0) return -1;
  if (b > 0 && (i === 0 || w !== 1)) return -1;
  for (D[1] = 0, v = 1; v < Ee; v++) D[v + 1] = D[v] + I[v];
  for (_ = 0; _ < r; _++) e[t + _] !== 0 && (a[D[e[t + _]]++] = _);
  if (i === 0 ? (S = It = a, E = 20) : i === 1 ? (S = xo, It = wo, E = 257) : (S = Eo, It = So, E = 0), A = 0, _ = 0, v = k, p = o, x = u, C = 0, f = -1, T = 1 << u, m = T - 1, i === 1 && T > 852 || i === 2 && T > 592) return 1;
  for (; ; ) {
    K = v - C, a[_] + 1 < E ? (bt = 0, rt = a[_]) : a[_] >= E ? (bt = It[a[_] - E], rt = S[a[_] - E]) : (bt = 96, rt = 0), l = 1 << v - C, c = 1 << x, k = c;
    do
      c -= l, s[p + (A >> C) + c] = K << 24 | bt << 16 | rt | 0;
    while (c !== 0);
    for (l = 1 << v - 1; A & l; ) l >>= 1;
    if (l !== 0 ? (A &= l - 1, A += l) : A = 0, _++, --I[v] == 0) {
      if (v === w) break;
      v = e[t + a[_]];
    }
    if (v > u && (A & m) !== f) {
      for (C === 0 && (C = u), p += k, x = v - C, b = 1 << x; x + C < w && (b -= I[x + C], !(b <= 0)); ) x++, b <<= 1;
      if (T += 1 << x, i === 1 && T > 852 || i === 2 && T > 592) return 1;
      f = A & m, s[f] = u << 24 | x << 16 | p - o | 0;
    }
  }
  return A !== 0 && (s[p + A] = v - C << 24 | 64 << 16 | 0), n.bits = u, 0;
};
const { Z_FINISH: nr, Z_BLOCK: ko, Z_TREES: Se, Z_OK: Ot, Z_STREAM_END: Ao, Z_NEED_DICT: Ro, Z_STREAM_ERROR: it, Z_DATA_ERROR: ns, Z_MEM_ERROR: ls, Z_BUF_ERROR: Io, Z_DEFLATED: lr } = Ve, je = 16180, Ne = 16190, ft = 16191, ni = 16192, li = 16194, ke = 16199, Ae = 16200, di = 16206, F = 16209, dr = (i) => (i >>> 24 & 255) + (i >>> 8 & 65280) + ((65280 & i) << 8) + ((255 & i) << 24);
function Co() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const Dt = (i) => {
  if (!i) return 1;
  const e = i.state;
  return !e || e.strm !== i || e.mode < je || e.mode > 16211 ? 1 : 0;
}, ds = (i) => {
  if (Dt(i)) return it;
  const e = i.state;
  return i.total_in = i.total_out = e.total = 0, i.msg = "", e.wrap && (i.adler = 1 & e.wrap), e.mode = je, e.last = 0, e.havedict = 0, e.flags = -1, e.dmax = 32768, e.head = null, e.hold = 0, e.bits = 0, e.lencode = e.lendyn = new Int32Array(852), e.distcode = e.distdyn = new Int32Array(592), e.sane = 1, e.back = -1, Ot;
}, cs = (i) => {
  if (Dt(i)) return it;
  const e = i.state;
  return e.wsize = 0, e.whave = 0, e.wnext = 0, ds(i);
}, hs = (i, e) => {
  let t;
  if (Dt(i)) return it;
  const r = i.state;
  return e < 0 ? (t = 0, e = -e) : (t = 5 + (e >> 4), e < 48 && (e &= 15)), e && (e < 8 || e > 15) ? it : (r.window !== null && r.wbits !== e && (r.window = null), r.wrap = t, r.wbits = e, cs(i));
}, cr = (i, e) => {
  if (!i) return it;
  const t = new Co();
  i.state = t, t.strm = i, t.window = null, t.mode = je;
  const r = hs(i, e);
  return r !== Ot && (i.state = null), r;
};
let ci, hi, hr = !0;
const To = (i) => {
  if (hr) {
    ci = new Int32Array(512), hi = new Int32Array(32);
    let e = 0;
    for (; e < 144; ) i.lens[e++] = 8;
    for (; e < 256; ) i.lens[e++] = 9;
    for (; e < 280; ) i.lens[e++] = 7;
    for (; e < 288; ) i.lens[e++] = 8;
    for (le(1, i.lens, 0, 288, ci, 0, i.work, { bits: 9 }), e = 0; e < 32; ) i.lens[e++] = 5;
    le(2, i.lens, 0, 32, hi, 0, i.work, { bits: 5 }), hr = !1;
  }
  i.lencode = ci, i.lenbits = 9, i.distcode = hi, i.distbits = 5;
}, ps = (i, e, t, r) => {
  let s;
  const o = i.state;
  return o.window === null && (o.window = new Uint8Array(1 << o.wbits)), o.wsize === 0 && (o.wsize = 1 << o.wbits, o.wnext = 0, o.whave = 0), r >= o.wsize ? (o.window.set(e.subarray(t - o.wsize, t), 0), o.wnext = 0, o.whave = o.wsize) : (s = o.wsize - o.wnext, s > r && (s = r), o.window.set(e.subarray(t - r, t - r + s), o.wnext), (r -= s) ? (o.window.set(e.subarray(t - r, t), 0), o.wnext = r, o.whave = o.wsize) : (o.wnext += s, o.wnext === o.wsize && (o.wnext = 0), o.whave < o.wsize && (o.whave += s))), 0;
};
var $o = (i, e) => {
  let t, r, s, o, a, n, d, l, c, f, m, p, E, v, _, k, w, u, x, C, b, T, A = 0;
  const S = new Uint8Array(4);
  let I, D;
  const K = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  if (Dt(i) || !i.output || !i.input && i.avail_in !== 0) return it;
  t = i.state, t.mode === ft && (t.mode = ni), a = i.next_out, s = i.output, d = i.avail_out, o = i.next_in, r = i.input, n = i.avail_in, l = t.hold, c = t.bits, f = n, m = d, T = Ot;
  t: for (; ; ) switch (t.mode) {
    case je:
      if (t.wrap === 0) {
        t.mode = ni;
        break;
      }
      for (; c < 16; ) {
        if (n === 0) break t;
        n--, l += r[o++] << c, c += 8;
      }
      if (2 & t.wrap && l === 35615) {
        t.wbits === 0 && (t.wbits = 15), t.check = 0, S[0] = 255 & l, S[1] = l >>> 8 & 255, t.check = H(t.check, S, 2, 0), l = 0, c = 0, t.mode = 16181;
        break;
      }
      if (t.head && (t.head.done = !1), !(1 & t.wrap) || (((255 & l) << 8) + (l >> 8)) % 31) {
        i.msg = "incorrect header check", t.mode = F;
        break;
      }
      if ((15 & l) !== lr) {
        i.msg = "unknown compression method", t.mode = F;
        break;
      }
      if (l >>>= 4, c -= 4, b = 8 + (15 & l), t.wbits === 0 && (t.wbits = b), b > 15 || b > t.wbits) {
        i.msg = "invalid window size", t.mode = F;
        break;
      }
      t.dmax = 1 << t.wbits, t.flags = 0, i.adler = t.check = 1, t.mode = 512 & l ? 16189 : ft, l = 0, c = 0;
      break;
    case 16181:
      for (; c < 16; ) {
        if (n === 0) break t;
        n--, l += r[o++] << c, c += 8;
      }
      if (t.flags = l, (255 & t.flags) !== lr) {
        i.msg = "unknown compression method", t.mode = F;
        break;
      }
      if (57344 & t.flags) {
        i.msg = "unknown header flags set", t.mode = F;
        break;
      }
      t.head && (t.head.text = l >> 8 & 1), 512 & t.flags && 4 & t.wrap && (S[0] = 255 & l, S[1] = l >>> 8 & 255, t.check = H(t.check, S, 2, 0)), l = 0, c = 0, t.mode = 16182;
    case 16182:
      for (; c < 32; ) {
        if (n === 0) break t;
        n--, l += r[o++] << c, c += 8;
      }
      t.head && (t.head.time = l), 512 & t.flags && 4 & t.wrap && (S[0] = 255 & l, S[1] = l >>> 8 & 255, S[2] = l >>> 16 & 255, S[3] = l >>> 24 & 255, t.check = H(t.check, S, 4, 0)), l = 0, c = 0, t.mode = 16183;
    case 16183:
      for (; c < 16; ) {
        if (n === 0) break t;
        n--, l += r[o++] << c, c += 8;
      }
      t.head && (t.head.xflags = 255 & l, t.head.os = l >> 8), 512 & t.flags && 4 & t.wrap && (S[0] = 255 & l, S[1] = l >>> 8 & 255, t.check = H(t.check, S, 2, 0)), l = 0, c = 0, t.mode = 16184;
    case 16184:
      if (1024 & t.flags) {
        for (; c < 16; ) {
          if (n === 0) break t;
          n--, l += r[o++] << c, c += 8;
        }
        t.length = l, t.head && (t.head.extra_len = l), 512 & t.flags && 4 & t.wrap && (S[0] = 255 & l, S[1] = l >>> 8 & 255, t.check = H(t.check, S, 2, 0)), l = 0, c = 0;
      } else t.head && (t.head.extra = null);
      t.mode = 16185;
    case 16185:
      if (1024 & t.flags && (p = t.length, p > n && (p = n), p && (t.head && (b = t.head.extra_len - t.length, t.head.extra || (t.head.extra = new Uint8Array(t.head.extra_len)), t.head.extra.set(r.subarray(o, o + p), b)), 512 & t.flags && 4 & t.wrap && (t.check = H(t.check, r, p, o)), n -= p, o += p, t.length -= p), t.length)) break t;
      t.length = 0, t.mode = 16186;
    case 16186:
      if (2048 & t.flags) {
        if (n === 0) break t;
        p = 0;
        do
          b = r[o + p++], t.head && b && t.length < 65536 && (t.head.name += String.fromCharCode(b));
        while (b && p < n);
        if (512 & t.flags && 4 & t.wrap && (t.check = H(t.check, r, p, o)), n -= p, o += p, b) break t;
      } else t.head && (t.head.name = null);
      t.length = 0, t.mode = 16187;
    case 16187:
      if (4096 & t.flags) {
        if (n === 0) break t;
        p = 0;
        do
          b = r[o + p++], t.head && b && t.length < 65536 && (t.head.comment += String.fromCharCode(b));
        while (b && p < n);
        if (512 & t.flags && 4 & t.wrap && (t.check = H(t.check, r, p, o)), n -= p, o += p, b) break t;
      } else t.head && (t.head.comment = null);
      t.mode = 16188;
    case 16188:
      if (512 & t.flags) {
        for (; c < 16; ) {
          if (n === 0) break t;
          n--, l += r[o++] << c, c += 8;
        }
        if (4 & t.wrap && l !== (65535 & t.check)) {
          i.msg = "header crc mismatch", t.mode = F;
          break;
        }
        l = 0, c = 0;
      }
      t.head && (t.head.hcrc = t.flags >> 9 & 1, t.head.done = !0), i.adler = t.check = 0, t.mode = ft;
      break;
    case 16189:
      for (; c < 32; ) {
        if (n === 0) break t;
        n--, l += r[o++] << c, c += 8;
      }
      i.adler = t.check = dr(l), l = 0, c = 0, t.mode = Ne;
    case Ne:
      if (t.havedict === 0) return i.next_out = a, i.avail_out = d, i.next_in = o, i.avail_in = n, t.hold = l, t.bits = c, Ro;
      i.adler = t.check = 1, t.mode = ft;
    case ft:
      if (e === ko || e === Se) break t;
    case ni:
      if (t.last) {
        l >>>= 7 & c, c -= 7 & c, t.mode = di;
        break;
      }
      for (; c < 3; ) {
        if (n === 0) break t;
        n--, l += r[o++] << c, c += 8;
      }
      switch (t.last = 1 & l, l >>>= 1, c -= 1, 3 & l) {
        case 0:
          t.mode = 16193;
          break;
        case 1:
          if (To(t), t.mode = ke, e === Se) {
            l >>>= 2, c -= 2;
            break t;
          }
          break;
        case 2:
          t.mode = 16196;
          break;
        case 3:
          i.msg = "invalid block type", t.mode = F;
      }
      l >>>= 2, c -= 2;
      break;
    case 16193:
      for (l >>>= 7 & c, c -= 7 & c; c < 32; ) {
        if (n === 0) break t;
        n--, l += r[o++] << c, c += 8;
      }
      if ((65535 & l) != (l >>> 16 ^ 65535)) {
        i.msg = "invalid stored block lengths", t.mode = F;
        break;
      }
      if (t.length = 65535 & l, l = 0, c = 0, t.mode = li, e === Se) break t;
    case li:
      t.mode = 16195;
    case 16195:
      if (p = t.length, p) {
        if (p > n && (p = n), p > d && (p = d), p === 0) break t;
        s.set(r.subarray(o, o + p), a), n -= p, o += p, d -= p, a += p, t.length -= p;
        break;
      }
      t.mode = ft;
      break;
    case 16196:
      for (; c < 14; ) {
        if (n === 0) break t;
        n--, l += r[o++] << c, c += 8;
      }
      if (t.nlen = 257 + (31 & l), l >>>= 5, c -= 5, t.ndist = 1 + (31 & l), l >>>= 5, c -= 5, t.ncode = 4 + (15 & l), l >>>= 4, c -= 4, t.nlen > 286 || t.ndist > 30) {
        i.msg = "too many length or distance symbols", t.mode = F;
        break;
      }
      t.have = 0, t.mode = 16197;
    case 16197:
      for (; t.have < t.ncode; ) {
        for (; c < 3; ) {
          if (n === 0) break t;
          n--, l += r[o++] << c, c += 8;
        }
        t.lens[K[t.have++]] = 7 & l, l >>>= 3, c -= 3;
      }
      for (; t.have < 19; ) t.lens[K[t.have++]] = 0;
      if (t.lencode = t.lendyn, t.lenbits = 7, I = { bits: t.lenbits }, T = le(0, t.lens, 0, 19, t.lencode, 0, t.work, I), t.lenbits = I.bits, T) {
        i.msg = "invalid code lengths set", t.mode = F;
        break;
      }
      t.have = 0, t.mode = 16198;
    case 16198:
      for (; t.have < t.nlen + t.ndist; ) {
        for (; A = t.lencode[l & (1 << t.lenbits) - 1], _ = A >>> 24, k = A >>> 16 & 255, w = 65535 & A, !(_ <= c); ) {
          if (n === 0) break t;
          n--, l += r[o++] << c, c += 8;
        }
        if (w < 16) l >>>= _, c -= _, t.lens[t.have++] = w;
        else {
          if (w === 16) {
            for (D = _ + 2; c < D; ) {
              if (n === 0) break t;
              n--, l += r[o++] << c, c += 8;
            }
            if (l >>>= _, c -= _, t.have === 0) {
              i.msg = "invalid bit length repeat", t.mode = F;
              break;
            }
            b = t.lens[t.have - 1], p = 3 + (3 & l), l >>>= 2, c -= 2;
          } else if (w === 17) {
            for (D = _ + 3; c < D; ) {
              if (n === 0) break t;
              n--, l += r[o++] << c, c += 8;
            }
            l >>>= _, c -= _, b = 0, p = 3 + (7 & l), l >>>= 3, c -= 3;
          } else {
            for (D = _ + 7; c < D; ) {
              if (n === 0) break t;
              n--, l += r[o++] << c, c += 8;
            }
            l >>>= _, c -= _, b = 0, p = 11 + (127 & l), l >>>= 7, c -= 7;
          }
          if (t.have + p > t.nlen + t.ndist) {
            i.msg = "invalid bit length repeat", t.mode = F;
            break;
          }
          for (; p--; ) t.lens[t.have++] = b;
        }
      }
      if (t.mode === F) break;
      if (t.lens[256] === 0) {
        i.msg = "invalid code -- missing end-of-block", t.mode = F;
        break;
      }
      if (t.lenbits = 9, I = { bits: t.lenbits }, T = le(1, t.lens, 0, t.nlen, t.lencode, 0, t.work, I), t.lenbits = I.bits, T) {
        i.msg = "invalid literal/lengths set", t.mode = F;
        break;
      }
      if (t.distbits = 6, t.distcode = t.distdyn, I = { bits: t.distbits }, T = le(2, t.lens, t.nlen, t.ndist, t.distcode, 0, t.work, I), t.distbits = I.bits, T) {
        i.msg = "invalid distances set", t.mode = F;
        break;
      }
      if (t.mode = ke, e === Se) break t;
    case ke:
      t.mode = Ae;
    case Ae:
      if (n >= 6 && d >= 258) {
        i.next_out = a, i.avail_out = d, i.next_in = o, i.avail_in = n, t.hold = l, t.bits = c, yo(i, m), a = i.next_out, s = i.output, d = i.avail_out, o = i.next_in, r = i.input, n = i.avail_in, l = t.hold, c = t.bits, t.mode === ft && (t.back = -1);
        break;
      }
      for (t.back = 0; A = t.lencode[l & (1 << t.lenbits) - 1], _ = A >>> 24, k = A >>> 16 & 255, w = 65535 & A, !(_ <= c); ) {
        if (n === 0) break t;
        n--, l += r[o++] << c, c += 8;
      }
      if (k && (240 & k) == 0) {
        for (u = _, x = k, C = w; A = t.lencode[C + ((l & (1 << u + x) - 1) >> u)], _ = A >>> 24, k = A >>> 16 & 255, w = 65535 & A, !(u + _ <= c); ) {
          if (n === 0) break t;
          n--, l += r[o++] << c, c += 8;
        }
        l >>>= u, c -= u, t.back += u;
      }
      if (l >>>= _, c -= _, t.back += _, t.length = w, k === 0) {
        t.mode = 16205;
        break;
      }
      if (32 & k) {
        t.back = -1, t.mode = ft;
        break;
      }
      if (64 & k) {
        i.msg = "invalid literal/length code", t.mode = F;
        break;
      }
      t.extra = 15 & k, t.mode = 16201;
    case 16201:
      if (t.extra) {
        for (D = t.extra; c < D; ) {
          if (n === 0) break t;
          n--, l += r[o++] << c, c += 8;
        }
        t.length += l & (1 << t.extra) - 1, l >>>= t.extra, c -= t.extra, t.back += t.extra;
      }
      t.was = t.length, t.mode = 16202;
    case 16202:
      for (; A = t.distcode[l & (1 << t.distbits) - 1], _ = A >>> 24, k = A >>> 16 & 255, w = 65535 & A, !(_ <= c); ) {
        if (n === 0) break t;
        n--, l += r[o++] << c, c += 8;
      }
      if ((240 & k) == 0) {
        for (u = _, x = k, C = w; A = t.distcode[C + ((l & (1 << u + x) - 1) >> u)], _ = A >>> 24, k = A >>> 16 & 255, w = 65535 & A, !(u + _ <= c); ) {
          if (n === 0) break t;
          n--, l += r[o++] << c, c += 8;
        }
        l >>>= u, c -= u, t.back += u;
      }
      if (l >>>= _, c -= _, t.back += _, 64 & k) {
        i.msg = "invalid distance code", t.mode = F;
        break;
      }
      t.offset = w, t.extra = 15 & k, t.mode = 16203;
    case 16203:
      if (t.extra) {
        for (D = t.extra; c < D; ) {
          if (n === 0) break t;
          n--, l += r[o++] << c, c += 8;
        }
        t.offset += l & (1 << t.extra) - 1, l >>>= t.extra, c -= t.extra, t.back += t.extra;
      }
      if (t.offset > t.dmax) {
        i.msg = "invalid distance too far back", t.mode = F;
        break;
      }
      t.mode = 16204;
    case 16204:
      if (d === 0) break t;
      if (p = m - d, t.offset > p) {
        if (p = t.offset - p, p > t.whave && t.sane) {
          i.msg = "invalid distance too far back", t.mode = F;
          break;
        }
        p > t.wnext ? (p -= t.wnext, E = t.wsize - p) : E = t.wnext - p, p > t.length && (p = t.length), v = t.window;
      } else v = s, E = a - t.offset, p = t.length;
      p > d && (p = d), d -= p, t.length -= p;
      do
        s[a++] = v[E++];
      while (--p);
      t.length === 0 && (t.mode = Ae);
      break;
    case 16205:
      if (d === 0) break t;
      s[a++] = t.length, d--, t.mode = Ae;
      break;
    case di:
      if (t.wrap) {
        for (; c < 32; ) {
          if (n === 0) break t;
          n--, l |= r[o++] << c, c += 8;
        }
        if (m -= d, i.total_out += m, t.total += m, 4 & t.wrap && m && (i.adler = t.check = t.flags ? H(t.check, s, m, a - m) : ve(t.check, s, m, a - m)), m = d, 4 & t.wrap && (t.flags ? l : dr(l)) !== t.check) {
          i.msg = "incorrect data check", t.mode = F;
          break;
        }
        l = 0, c = 0;
      }
      t.mode = 16207;
    case 16207:
      if (t.wrap && t.flags) {
        for (; c < 32; ) {
          if (n === 0) break t;
          n--, l += r[o++] << c, c += 8;
        }
        if (4 & t.wrap && l !== (4294967295 & t.total)) {
          i.msg = "incorrect length check", t.mode = F;
          break;
        }
        l = 0, c = 0;
      }
      t.mode = 16208;
    case 16208:
      T = Ao;
      break t;
    case F:
      T = ns;
      break t;
    case 16210:
      return ls;
    default:
      return it;
  }
  return i.next_out = a, i.avail_out = d, i.next_in = o, i.avail_in = n, t.hold = l, t.bits = c, (t.wsize || m !== i.avail_out && t.mode < F && (t.mode < di || e !== nr)) && ps(i, i.output, i.next_out, m - i.avail_out), f -= i.avail_in, m -= i.avail_out, i.total_in += f, i.total_out += m, t.total += m, 4 & t.wrap && m && (i.adler = t.check = t.flags ? H(t.check, s, m, i.next_out - m) : ve(t.check, s, m, i.next_out - m)), i.data_type = t.bits + (t.last ? 64 : 0) + (t.mode === ft ? 128 : 0) + (t.mode === ke || t.mode === li ? 256 : 0), (f === 0 && m === 0 || e === nr) && T === Ot && (T = Io), T;
}, lt = { inflateReset: cs, inflateReset2: hs, inflateResetKeep: ds, inflateInit: (i) => cr(i, 15), inflateInit2: cr, inflate: $o, inflateEnd: (i) => {
  if (Dt(i)) return it;
  let e = i.state;
  return e.window && (e.window = null), i.state = null, Ot;
}, inflateGetHeader: (i, e) => {
  if (Dt(i)) return it;
  const t = i.state;
  return (2 & t.wrap) == 0 ? it : (t.head = e, e.done = !1, Ot);
}, inflateSetDictionary: (i, e) => {
  const t = e.length;
  let r, s, o;
  return Dt(i) ? it : (r = i.state, r.wrap !== 0 && r.mode !== Ne ? it : r.mode === Ne && (s = 1, s = ve(s, e, t, 0), s !== r.check) ? ns : (o = ps(i, e, t, t), o ? (r.mode = 16210, ls) : (r.havedict = 1, Ot)));
}, inflateInfo: "pako inflate (from Nodeca project)" }, Lo = function() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
};
const us = Object.prototype.toString, { Z_NO_FLUSH: Oo, Z_FINISH: pr, Z_OK: Bt, Z_STREAM_END: pi, Z_NEED_DICT: ui, Z_STREAM_ERROR: Do, Z_DATA_ERROR: ur, Z_MEM_ERROR: Mo, Z_BUF_ERROR: fr } = Ve, Po = { chunkSize: 65536, windowBits: 15, to: "" };
function Pe(i) {
  this.options = Ke.assign({}, Po, i || {});
  const e = this.options;
  e.raw && e.windowBits >= 0 && e.windowBits < 16 && (e.windowBits = -e.windowBits, e.windowBits === 0 && (e.windowBits = -15)), !(e.windowBits >= 0 && e.windowBits < 16) || i && i.windowBits || (e.windowBits += 32), e.windowBits > 15 && e.windowBits < 48 && (15 & e.windowBits) == 0 && (e.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new os(), this.strm.avail_out = 0;
  let t = lt.inflateInit2(this.strm, e.windowBits);
  if (t !== Bt) throw new Error(qt[t]);
  if (this.header = new Lo(), lt.inflateGetHeader(this.strm, this.header), e.dictionary && (typeof e.dictionary == "string" ? e.dictionary = _e.string2buf(e.dictionary) : us.call(e.dictionary) === "[object ArrayBuffer]" && (e.dictionary = new Uint8Array(e.dictionary)), e.raw && (t = lt.inflateSetDictionary(this.strm, e.dictionary), t !== Bt))) throw new Error(qt[t]);
}
Pe.prototype.push = function(i, e) {
  const t = this.strm, r = this.options.chunkSize, s = this.options.dictionary;
  let o, a, n;
  if (this.ended) return !1;
  for (a = e === ~~e ? e : e === !0 ? pr : Oo, us.call(i) === "[object ArrayBuffer]" ? t.input = new Uint8Array(i) : t.input = i, t.next_in = 0, t.avail_in = t.input.length; ; ) {
    for (t.avail_out === 0 && (t.output = new Uint8Array(r), t.next_out = 0, t.avail_out = r), o = lt.inflate(t, a), o === ui && s && (o = lt.inflateSetDictionary(t, s), o === Bt ? o = lt.inflate(t, a) : o === ur && (o = ui)); t.avail_in > 0 && o === pi && 2 & t.state.wrap && t.state.flags !== 0 && t.input[t.next_in] !== 0; ) lt.inflateReset(t), o = lt.inflate(t, a);
    switch (o) {
      case Do:
      case ur:
      case ui:
      case Mo:
        return this.onEnd(o), this.ended = !0, !1;
    }
    if (n = t.avail_out, t.next_out && (t.avail_out === 0 || o === pi || a > 0)) if (this.options.to === "string") {
      let d = _e.utf8border(t.output, t.next_out), l = t.next_out - d, c = _e.buf2string(t.output, d);
      t.next_out = l, t.avail_out = r - l, l && t.output.set(t.output.subarray(d, d + l), 0), this.onData(c);
    } else this.onData(t.output.length === t.next_out ? t.output : t.output.subarray(0, t.next_out)), t.avail_out = 0, t.next_out = 0;
    if (o !== Bt && o !== fr || n !== 0) {
      if (o === pi) return o = lt.inflateEnd(this.strm), this.onEnd(o), this.ended = !0, !0;
      if (t.avail_in === 0) {
        if (a === pr) return o = lt.inflateEnd(this.strm), this.onEnd(o === Bt ? fr : o), this.ended = !0, !1;
        break;
      }
    }
  }
  return !0;
}, Pe.prototype.onData = function(i) {
  this.chunks.push(i);
}, Pe.prototype.onEnd = function(i) {
  i === Bt && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = Ke.flattenChunks(this.chunks)), this.chunks = [], this.err = i, this.msg = this.strm.msg;
};
var Fo = { Inflate: Pe };
const { deflate: zo } = bo, { Inflate: Bo } = Fo;
var Uo = zo, No = Bo;
function ki(i, e, t = 255) {
  const r = i.length % e;
  if (r !== 0) {
    const s = new Uint8Array(e - r).fill(t), o = new Uint8Array(i.length + s.length);
    return o.set(i), o.set(s, i.length), o;
  }
  return i;
}
function mr(i, e = 239) {
  for (let t = 0; t < i.length; t++) e ^= i[t];
  return e;
}
function Ye(i) {
  const e = new Uint8Array(i.length);
  for (let t = 0; t < i.length; t++) e[t] = i.charCodeAt(t);
  return e;
}
function de(i) {
  return new Promise(((e) => setTimeout(e, i)));
}
class Fi {
  constructor(e, t = !1, r = !0) {
    this.device = e, this.tracing = t, this.slipReaderEnabled = !1, this.baudrate = 0, this.traceLog = "", this.lastTraceTime = Date.now(), this.buffer = new Uint8Array(0), this.onDeviceLostCallback = null, this.SLIP_END = 192, this.SLIP_ESC = 219, this.SLIP_ESC_END = 220, this.SLIP_ESC_ESC = 221, this._DTR_state = !1, this.slipReaderEnabled = r;
  }
  setDeviceLostCallback(e) {
    this.onDeviceLostCallback = e;
  }
  updateDevice(e) {
    this.device = e, this.trace("Device reference updated");
  }
  getInfo() {
    const e = this.device.getInfo();
    return e.usbVendorId && e.usbProductId ? `WebSerial VendorID 0x${e.usbVendorId.toString(16)} ProductID 0x${e.usbProductId.toString(16)}` : "";
  }
  getPid() {
    return this.device.getInfo().usbProductId;
  }
  trace(e) {
    const t = `${`TRACE ${(Date.now() - this.lastTraceTime).toFixed(3)}`} ${e}`;
    console.log(t), this.traceLog += t + `
`;
  }
  async returnTrace() {
    try {
      await navigator.clipboard.writeText(this.traceLog), console.log("Text copied to clipboard!");
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  }
  hexify(e) {
    return Array.from(e).map(((t) => t.toString(16).padStart(2, "0"))).join("").padEnd(16, " ");
  }
  hexConvert(e, t = !0) {
    if (t && e.length > 16) {
      let r = "", s = e;
      for (; s.length > 0; ) {
        const o = s.slice(0, 16), a = String.fromCharCode(...o).split("").map(((n) => n === " " || n >= " " && n <= "~" && n !== "  " ? n : ".")).join("");
        s = s.slice(16), r += `
    ${this.hexify(o.slice(0, 8))} ${this.hexify(o.slice(8))} | ${a}`;
      }
      return r;
    }
    return this.hexify(e);
  }
  slipWriter(e) {
    const t = [];
    t.push(192);
    for (let r = 0; r < e.length; r++) e[r] === 219 ? t.push(219, 221) : e[r] === 192 ? t.push(219, 220) : t.push(e[r]);
    return t.push(192), new Uint8Array(t);
  }
  async write(e) {
    const t = this.slipWriter(e);
    if (this.device.writable) {
      const r = this.device.writable.getWriter();
      this.tracing && this.trace(`Write ${t.length} bytes: ${this.hexConvert(t)}`), await r.write(t), r.releaseLock();
    }
  }
  appendArray(e, t) {
    const r = new Uint8Array(e.length + t.length);
    return r.set(e), r.set(t, e.length), r;
  }
  async readLoop() {
    for (var e; this.device.readable; ) {
      this.reader = (e = this.device.readable) === null || e === void 0 ? void 0 : e.getReader();
      try {
        const { value: t, done: r } = await this.reader.read();
        if (r) {
          this.trace("Serial port done");
          break;
        }
        if (t && t.length) {
          const s = Uint8Array.from(t);
          this.buffer = this.appendArray(this.buffer, s);
        }
      } catch (t) {
        if (t instanceof Error) {
          if (["BufferOverrunError", "FramingError", "BreakError", "ParityError"].includes(t.name)) {
            this.trace(`Recoverable serial port error: ${t.message}`);
            continue;
          }
          this.trace(`Unrecoverable serial port error: ${t.message}`);
          break;
        }
        if (t instanceof DOMException) {
          this.onDeviceLostCallback ? this.onDeviceLostCallback() : this.trace(`Unrecoverable serial port error: ${t.message}`);
          break;
        }
        this.trace(`Unrecoverable serial port error: ${t}`);
        break;
      } finally {
        this.reader.releaseLock();
      }
    }
    this.trace("readLoop exited");
  }
  flushInput() {
    this.buffer = new Uint8Array(0);
  }
  async flushOutput() {
    try {
      if (this.device.writable) {
        const e = this.device.writable.getWriter();
        await e.close(), e.releaseLock();
      }
    } catch (e) {
      this.trace(`Error while flushing output: ${e}`);
    }
  }
  inWaiting() {
    return this.buffer.length;
  }
  peek() {
    return this.buffer;
  }
  detectPanicHandler(e) {
    const t = new TextDecoder("utf-8").decode(e), r = t.match(/G?uru Meditation Error: (?:Core \d panic'ed \(([a-zA-Z ]*)\))?/) || t.match(/F?atal exception \(\d+\): (?:([a-zA-Z ]*)?.*epc)?/);
    if (r) {
      const s = r[1] || r[2];
      throw new Error("Guru Meditation Error detected" + (s ? ` (${s})` : ""));
    }
  }
  async read(e) {
    let t = null, r = !1, s = null;
    for (; ; ) {
      const o = Date.now();
      for (s = new Uint8Array(0); Date.now() - o < e; ) {
        if (this.buffer.length > 0) {
          s = this.buffer, this.buffer = new Uint8Array(0);
          break;
        }
        await de(1);
      }
      if (!s || s.length === 0) {
        const a = t === null ? "Serial data stream stopped: Possible serial noise or corruption." : "No serial data received.";
        throw this.tracing && this.trace(a), new Error(a);
      }
      this.tracing && this.trace(`Read ${s.length} bytes: ${this.hexConvert(s)}`);
      for (let a = 0; a < s.length; a++) {
        const n = s[a];
        if (t === null) {
          if (n !== this.SLIP_END) {
            this.tracing && this.trace(`Read invalid data: ${this.hexConvert(s)}`);
            const d = this.buffer;
            throw this.tracing && this.trace(`Remaining data in serial buffer: ${this.hexConvert(d)}`), this.detectPanicHandler(new Uint8Array([...s, ...d || []])), new Error(`Invalid head of packet (0x${n.toString(16)}): Possible serial noise or corruption.`);
          }
          t = new Uint8Array(0);
        } else if (r) if (r = !1, n === this.SLIP_ESC_END) t = this.appendArray(t, new Uint8Array([this.SLIP_END]));
        else {
          if (n !== this.SLIP_ESC_ESC) {
            this.tracing && this.trace(`Read invalid data: ${this.hexConvert(s)}`);
            const d = this.buffer;
            throw this.tracing && this.trace(`Remaining data in serial buffer: ${this.hexConvert(d)}`), this.detectPanicHandler(new Uint8Array([...s, ...d || []])), new Error(`Invalid SLIP escape (0xdb, 0x${n.toString(16)})`);
          }
          t = this.appendArray(t, new Uint8Array([this.SLIP_ESC]));
        }
        else if (n === this.SLIP_ESC) r = !0;
        else {
          if (n === this.SLIP_END) {
            if (this.tracing && this.trace(`Received full packet: ${this.hexConvert(t)}`), a + 1 < s.length) {
              const d = s.slice(a + 1);
              this.buffer = this.appendArray(d, this.buffer);
            }
            return t;
          }
          t = this.appendArray(t, new Uint8Array([n]));
        }
      }
    }
  }
  async rawRead(e, t) {
    let r;
    try {
      if (!this.device.readable) return;
      for (r = this.device.readable.getReader(); !t(); ) {
        const { value: s, done: o } = await r.read();
        if (o || !s) break;
        this.tracing && this.trace(`Read ${s.length} bytes: ${this.hexConvert(s)}`), e(s);
      }
    } catch (s) {
      this.trace(`Error reading from serial port: ${s}`), s instanceof Error && s.name === "NetworkError" && s.message.includes("device has been lost") && (this.trace("Device lost detected (NetworkError)"), this.onDeviceLostCallback && this.onDeviceLostCallback());
    } finally {
      r?.releaseLock();
    }
  }
  async setRTS(e) {
    await this.device.setSignals({ requestToSend: e }), await this.setDTR(this._DTR_state);
  }
  async setDTR(e) {
    this._DTR_state = e, await this.device.setSignals({ dataTerminalReady: e });
  }
  async connect(e = 115200, t = {}) {
    await this.device.open({ baudRate: e, dataBits: t?.dataBits, stopBits: t?.stopBits, bufferSize: t?.bufferSize, parity: t?.parity, flowControl: t?.flowControl }), this.baudrate = e;
  }
  async waitForUnlock(e) {
    for (; this.device.readable && this.device.readable.locked || this.device.writable && this.device.writable.locked; ) await de(e);
  }
  async disconnect() {
    var e, t;
    !((e = this.device.readable) === null || e === void 0) && e.locked && await ((t = this.reader) === null || t === void 0 ? void 0 : t.cancel()), await this.waitForUnlock(400), await this.device.close(), this.reader = void 0;
  }
}
function gt(i) {
  return new Promise(((e) => setTimeout(e, i)));
}
class Ho {
  constructor(e, t) {
    this.resetDelay = t, this.transport = e;
  }
  async reset() {
    await this.transport.setDTR(!1), await this.transport.setRTS(!0), await gt(100), await this.transport.setDTR(!0), await this.transport.setRTS(!1), await gt(this.resetDelay), await this.transport.setDTR(!1);
  }
}
class qo {
  constructor(e) {
    this.transport = e;
  }
  async reset() {
    await this.transport.setRTS(!1), await this.transport.setDTR(!1), await gt(100), await this.transport.setDTR(!0), await this.transport.setRTS(!1), await gt(100), await this.transport.setRTS(!0), await this.transport.setDTR(!1), await this.transport.setRTS(!0), await gt(100), await this.transport.setRTS(!1), await this.transport.setDTR(!1);
  }
}
class fs {
  constructor(e, t = !1) {
    this.transport = e, this.usingUsbOtg = t, this.transport = e;
  }
  async reset() {
    this.usingUsbOtg ? (await gt(200), await this.transport.setRTS(!1), await gt(200)) : (await gt(100), await this.transport.setRTS(!1));
  }
}
class Go {
  constructor(e, t) {
    this.transport = e, this.sequenceString = t, this.transport = e;
  }
  async reset() {
    const e = { D: async (t) => await this.transport.setDTR(t), R: async (t) => await this.transport.setRTS(t), W: async (t) => await gt(t) };
    try {
      if (!(function(r) {
        const s = ["D", "R", "W"], o = r.split("|");
        for (const a of o) {
          const n = a[0], d = a.slice(1);
          if (!s.includes(n)) return !1;
          if (n === "D" || n === "R") {
            if (d !== "0" && d !== "1") return !1;
          } else if (n === "W") {
            const l = parseInt(d);
            if (isNaN(l) || l <= 0) return !1;
          }
        }
        return !0;
      })(this.sequenceString)) return;
      const t = this.sequenceString.split("|");
      for (const r of t) {
        const s = r[0], o = r.slice(1);
        s === "W" ? await e.W(Number(o)) : s !== "D" && s !== "R" || await e[s](o === "1");
      }
    } catch {
      throw new Error("Invalid custom reset sequence");
    }
  }
}
function Wo(i) {
  return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i;
}
var vr, gr, Zo = Wo(gr ? vr : (gr = 1, vr = function(i) {
  return atob(i);
}));
async function _r(i, e) {
  let t;
  switch (i) {
    case "ESP32":
      t = await import("./circuitsetup-energy-meter-helper-stub_flasher_32-BLbsWvxO-D30i_y3i.js");
      break;
    case "ESP32-C2":
      t = await import("./circuitsetup-energy-meter-helper-stub_flasher_32c2-wLQhZItC-BBtCrlqr.js");
      break;
    case "ESP32-C3":
      t = await import("./circuitsetup-energy-meter-helper-stub_flasher_32c3-DmSvHQKL-Bpvb0Iq1.js");
      break;
    case "ESP32-C5":
      t = await import("./circuitsetup-energy-meter-helper-stub_flasher_32c5-D1WK4DyB-BsO_p6Qw.js");
      break;
    case "ESP32-C6":
      t = await import("./circuitsetup-energy-meter-helper-stub_flasher_32c6-ZuxjUVr4-BxrQ0Eqa.js");
      break;
    case "ESP32-C61":
      t = await import("./circuitsetup-energy-meter-helper-stub_flasher_32c61-DeKkw9vN-NNL9VeJJ.js");
      break;
    case "ESP32-H2":
      t = await import("./circuitsetup-energy-meter-helper-stub_flasher_32h2-CZ4EIL3w-BISVcebL.js");
      break;
    case "ESP32-P4":
      t = e && e < 300 ? await import("./circuitsetup-energy-meter-helper-stub_flasher_32p4rc1-DyGqUAeZ-DVfuoGhE.js") : await import("./circuitsetup-energy-meter-helper-stub_flasher_32p4-CpHBYEwI-B3AImzDu.js");
      break;
    case "ESP32-S2":
      t = await import("./circuitsetup-energy-meter-helper-stub_flasher_32s2-CrsP1231-9mSCQz8X.js");
      break;
    case "ESP32-S3":
      t = await import("./circuitsetup-energy-meter-helper-stub_flasher_32s3-CiJyd6Fk-RjPSmnXX.js");
      break;
    case "ESP8266":
      t = await import("./circuitsetup-energy-meter-helper-stub_flasher_8266-CQFcqJ_a-DFaFRWu6.js");
  }
  if (t) return { bss_start: t.bss_start, data: t.data, data_start: t.data_start, entry: t.entry, text: t.text, text_start: t.text_start, decodedData: br(t.data), decodedText: br(t.text) };
}
function br(i) {
  const e = Zo(i).split("").map((function(t) {
    return t.charCodeAt(0);
  }));
  return new Uint8Array(e);
}
class Vo {
  constructor() {
    this.FLASH_SIZES = { "1MB": 0, "2MB": 16, "4MB": 32, "8MB": 48, "16MB": 64, "32MB": 80, "64MB": 96, "128MB": 112 }, this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "26m": 1, "20m": 2 };
  }
  getEraseSize(e, t) {
    return t;
  }
}
class Zt extends Vo {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP8266", this.CHIP_DETECT_MAGIC_VALUE = [4293968129], this.EFUSE_RD_REG_BASE = 1072693328, this.UART_CLKDIV_REG = 1610612756, this.UART_CLKDIV_MASK = 1048575, this.XTAL_CLK_DIVIDER = 2, this.FLASH_WRITE_SIZE = 16384, this.BOOTLOADER_FLASH_OFFSET = 0, this.UART_DATE_REG_ADDR = 0, this.FLASH_SIZES = { "512KB": 0, "256KB": 16, "1MB": 32, "2MB": 48, "4MB": 64, "2MB-c1": 80, "4MB-c1": 96, "8MB": 128, "16MB": 144 }, this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "26m": 1, "20m": 2 }, this.MEMORY_MAP = [[1072693248, 1072693264, "DPORT"], [1073643520, 1073741824, "DRAM"], [1074790400, 1074823168, "IRAM"], [1075843088, 1076760592, "IROM"]], this.SPI_REG_BASE = 1610613248, this.SPI_USR_OFFS = 28, this.SPI_USR1_OFFS = 32, this.SPI_USR2_OFFS = 36, this.SPI_MOSI_DLEN_OFFS = 0, this.SPI_MISO_DLEN_OFFS = 0, this.SPI_W0_OFFS = 64, this.getChipFeatures = async (e) => {
      const t = ["WiFi"];
      return await this.getChipDescription(e) == "ESP8285" && t.push("Embedded Flash"), t;
    };
  }
  async readEfuse(e, t) {
    const r = this.EFUSE_RD_REG_BASE + 4 * t;
    return e.debug("Read efuse " + r), await e.readReg(r);
  }
  async getChipDescription(e) {
    const t = await this.readEfuse(e, 2);
    return (16 & await this.readEfuse(e, 0) | 65536 & t) != 0 ? "ESP8285" : "ESP8266EX";
  }
  async getCrystalFreq(e) {
    const t = await e.readReg(this.UART_CLKDIV_REG) & this.UART_CLKDIV_MASK, r = e.transport.baudrate * t / 1e6 / this.XTAL_CLK_DIVIDER;
    let s;
    return s = r > 33 ? 40 : 26, Math.abs(s - r) > 1 && e.info("WARNING: Detected crystal freq " + r + "MHz is quite different to normalized freq " + s + "MHz. Unsupported crystal in use?"), s;
  }
  _d2h(e) {
    const t = (+e).toString(16);
    return t.length === 1 ? "0" + t : t;
  }
  async readMac(e) {
    let t = await this.readEfuse(e, 0);
    t >>>= 0;
    let r = await this.readEfuse(e, 1);
    r >>>= 0;
    let s = await this.readEfuse(e, 3);
    s >>>= 0;
    const o = new Uint8Array(6);
    return s != 0 ? (o[0] = s >> 16 & 255, o[1] = s >> 8 & 255, o[2] = 255 & s) : (r >> 16 & 255) == 0 ? (o[0] = 24, o[1] = 254, o[2] = 52) : (r >> 16 & 255) == 1 ? (o[0] = 172, o[1] = 208, o[2] = 116) : e.error("Unknown OUI"), o[3] = r >> 8 & 255, o[4] = 255 & r, o[5] = t >> 24 & 255, this._d2h(o[0]) + ":" + this._d2h(o[1]) + ":" + this._d2h(o[2]) + ":" + this._d2h(o[3]) + ":" + this._d2h(o[4]) + ":" + this._d2h(o[5]);
  }
  getEraseSize(e, t) {
    return t;
  }
}
Zt.IROM_MAP_START = 1075838976, Zt.IROM_MAP_END = 1076887552;
var Ko = Object.freeze({ __proto__: null, ESP8266ROM: Zt });
const be = 233;
function ce(i, e) {
  return i + (e - 1 - i % e);
}
function fi(i, e) {
  return i[e] | i[e + 1] << 8 | i[e + 2] << 16 | i[e + 3] << 24;
}
class kt {
  constructor(e, t, r = null, s = 0) {
    this.addr = e, this.data = t, this.fileOffs = r, this.flags = s, this.includeInChecksum = !0, this.addr !== 0 && this.padToAlignment(4);
  }
  copyWithNewAddr(e) {
    return new kt(e, this.data, 0);
  }
  splitImage(e) {
    const t = new kt(this.addr, this.data.slice(0, e), 0);
    return this.data = this.data.slice(e), this.addr += e, this.fileOffs = null, t;
  }
  toString() {
    let e = `len 0x${this.data.length.toString(16).padStart(5, "0")} load 0x${this.addr.toString(16).padStart(8, "0")}`;
    return this.fileOffs !== null && (e += ` file_offs 0x${this.fileOffs.toString(16).padStart(8, "0")}`), e;
  }
  getMemoryType(e) {
    return e.ROM_LOADER.MEMORY_MAP.filter(((t) => t[0] <= this.addr && this.addr < t[1])).map(((t) => t[2]));
  }
  padToAlignment(e) {
    this.data = ki(this.data, e, 0);
  }
}
class yr extends kt {
  constructor(e, t, r, s) {
    super(t, r, null, s), this.name = e;
  }
  toString() {
    return `${this.name} ${super.toString()}`;
  }
}
class zi {
  constructor(e) {
    this.SEG_HEADER_LEN = 8, this.SHA256_DIGEST_LEN = 32, this.ELF_FLAG_WRITE = 1, this.ELF_FLAG_READ = 2, this.ELF_FLAG_EXEC = 4, this.segments = [], this.entrypoint = 0, this.elfSha256 = null, this.elfSha256Offset = 0, this.padToSize = 0, this.flashMode = 0, this.flashSizeFreq = 0, this.checksum = 0, this.datalength = 0, this.IROM_ALIGN = 0, this.MMU_PAGE_SIZE_CONF = [], this.ROM_LOADER = e;
  }
  loadCommonHeader(e, t, r) {
    const s = e[t], o = e[t + 1];
    if (this.flashMode = e[t + 2], this.flashSizeFreq = e[t + 3], this.entrypoint = fi(e, t + 4), s !== r) throw new O(`Invalid firmware image magic=0x${s.toString(16)}`);
    return o;
  }
  verify() {
    if (this.segments.length > 16) throw new O(`Invalid segment count ${this.segments.length} (max 16). Usually this indicates a linker script problem.`);
  }
  loadSegment(e, t, r = !1) {
    const s = t, o = fi(e, t), a = fi(e, t + 4);
    this.warnIfUnusualSegment(o, a, r);
    const n = e.slice(t + 8, t + 8 + a);
    if (n.length < a) throw new O(`End of file reading segment 0x${o.toString(16)}, length ${a} (actual length ${n.length})`);
    const d = new kt(o, n, s);
    return this.segments.push(d), d;
  }
  warnIfUnusualSegment(e, t, r) {
    r || (e > 1075838976 || e < 1073610752 || t > 65536) && console.warn(`WARNING: Suspicious segment 0x${e.toString(16)}, length ${t}`);
  }
  maybePatchSegmentData(e, t) {
    const r = e.length;
    if (this.elfSha256Offset >= t && this.elfSha256Offset < t + r) {
      const s = this.elfSha256Offset - t;
      if (s < this.SEG_HEADER_LEN || s + this.SHA256_DIGEST_LEN > r) throw new O(`Cannot place SHA256 digest on segment boundary(elf_sha256_offset=${this.elfSha256Offset}, file_pos=${t}, segment_size=${r})`);
      const o = s - this.SEG_HEADER_LEN;
      if (!e.slice(o, o + this.SHA256_DIGEST_LEN).every(((c) => c === 0))) throw new O(`Contents of segment at SHA256 digest offset 0x${this.elfSha256Offset.toString(16)} are not all zero. Refusing to overwrite.`);
      if (!this.elfSha256 || this.elfSha256.length !== this.SHA256_DIGEST_LEN) throw new O("ELF SHA256 digest is not properly initialized");
      const a = e.slice(0, o), n = e.slice(o + this.SHA256_DIGEST_LEN), d = a.length + this.elfSha256.length + n.length, l = new Uint8Array(d);
      return l.set(a, 0), l.set(this.elfSha256, a.length), l.set(n, a.length + this.elfSha256.length), l;
    }
    return e;
  }
  saveSegment(e, t, r, s = null) {
    const o = this.maybePatchSegmentData(r.data, t), a = new DataView(e.buffer, t);
    return a.setUint32(0, r.addr, !0), a.setUint32(4, o.length, !0), e.set(o, t + 8), s !== null ? mr(o, s) : 0;
  }
  saveFlashSegment(e, t, r, s = null) {
    if (this.ROM_LOADER.CHIP_NAME === "ESP32") {
      const o = (t + r.data.length + this.SEG_HEADER_LEN) % this.IROM_ALIGN;
      if (o < 36) {
        const a = new Uint8Array(r.data.length + (36 - o));
        a.set(r.data), a.fill(0, r.data.length), r.data = a;
      }
    }
    return this.saveSegment(e, t, r, s);
  }
  readChecksum(e, t) {
    return e[ce(t, 16)];
  }
  calculateChecksum() {
    let e = 239;
    for (const t of this.segments) t.includeInChecksum && (e = mr(t.data, e));
    return e;
  }
  appendChecksum(e, t, r) {
    e[ce(t, 16)] = r;
  }
  writeCommonHeader(e, t, r) {
    e[t] = be, e[t + 1] = r, e[t + 2] = this.flashMode, e[t + 3] = this.flashSizeFreq, new DataView(e.buffer, t + 4).setUint32(0, this.entrypoint, !0);
  }
  isIromAddr(e) {
    return Zt.IROM_MAP_START <= e && e < Zt.IROM_MAP_END;
  }
  getIromSegment() {
    const e = this.segments.filter(((t) => this.isIromAddr(t.addr)));
    if (e.length > 0) {
      if (e.length !== 1) throw new O(`Found ${e.length} segments that could be irom0. Bad ELF file?`);
      return e[0];
    }
    return null;
  }
  getNonIromSegments() {
    const e = this.getIromSegment();
    return this.segments.filter(((t) => t !== e));
  }
  sortSegments() {
    this.segments.length && this.segments.sort(((e, t) => e.addr - t.addr));
  }
  mergeAdjacentSegments() {
    if (!this.segments.length) return;
    const e = [];
    for (let t = this.segments.length - 1; t > 0; t--) {
      const r = this.segments[t - 1], s = this.segments[t];
      if (r.getMemoryType(this).join(",") === s.getMemoryType(this).join(",") && r.includeInChecksum === s.includeInChecksum && s.addr === r.addr + r.data.length && (s.flags & this.ELF_FLAG_EXEC) == (r.flags & this.ELF_FLAG_EXEC)) {
        const o = new Uint8Array(r.data.length + s.data.length);
        o.set(r.data), o.set(s.data, r.data.length), r.data = o;
      } else e.unshift(s);
    }
    e.unshift(this.segments[0]), this.segments = e;
  }
  setMmuPageSize(e) {
    if (this.MMU_PAGE_SIZE_CONF || e === this.IROM_ALIGN) {
      if (this.MMU_PAGE_SIZE_CONF && !this.MMU_PAGE_SIZE_CONF.includes(e)) {
        const t = this.MMU_PAGE_SIZE_CONF.map(((r) => r / 1024 + "KB")).join(", ");
        throw new O(`${e} bytes is not a valid ${this.ROM_LOADER.CHIP_NAME} page size, select from ${t}.`);
      }
      this.IROM_ALIGN = e;
    } else console.warn(`WARNING: Changing MMU page size is not supported on ${this.ROM_LOADER.CHIP_NAME}! ` + (this.IROM_ALIGN !== 0 ? `Defaulting to ${this.IROM_ALIGN / 1024}KB.` : ""));
  }
}
class Rt extends zi {
  constructor(e, t = null, r = !0, s = !1) {
    super(e), this.securePad = null, this.flashMode = 0, this.flashSizeFreq = 0, this.version = 1, this.WP_PIN_DISABLED = 238, this.wpPin = this.WP_PIN_DISABLED, this.clkDrv = 0, this.qDrv = 0, this.dDrv = 0, this.csDrv = 0, this.hdDrv = 0, this.wpDrv = 0, this.chipId = 0, this.minRev = 0, this.minRevFull = 0, this.maxRevFull = 0, this.storedDigest = null, this.calcDigest = null, this.dataLength = 0, this.IROM_ALIGN = 65536, this.ROM_LOADER = e, this.appendDigest = r, this.ramOnlyHeader = s, t !== null && this.loadFromFile(t);
  }
  async loadFromFile(e) {
    const t = e instanceof Uint8Array ? e : Ye(e);
    let r = 0;
    const s = this.loadCommonHeader(t, r, be);
    r += 8, this.loadExtendedHeader(t, r), r += 16;
    for (let o = 0; o < s; o++)
      r += 8 + this.loadSegment(t, r).data.length;
    if (this.checksum = this.readChecksum(t, r), r = ce(r, 16), this.appendDigest) {
      const o = r;
      this.storedDigest = t.slice(r, r + this.SHA256_DIGEST_LEN);
      const a = await crypto.subtle.digest("SHA-256", t.slice(0, o));
      this.calcDigest = new Uint8Array(a), this.dataLength = o - 0;
    }
    this.verify();
  }
  isFlashAddr(e) {
    return this.ROM_LOADER.IROM_MAP_START <= e && e < this.ROM_LOADER.IROM_MAP_END || this.ROM_LOADER.DROM_MAP_START <= e && e < this.ROM_LOADER.DROM_MAP_END;
  }
  async save() {
    let e = 0;
    const t = new Uint8Array(1048576);
    let r = 0;
    this.writeCommonHeader(t, r, this.segments.length), r += 8, this.saveExtendedHeader(t, r), r += 16;
    let s = 239;
    const o = this.segments.filter(((d) => this.isFlashAddr(d.addr))).sort(((d, l) => d.addr - l.addr)), a = this.segments.filter(((d) => !this.isFlashAddr(d.addr))).sort(((d, l) => d.addr - l.addr));
    for (let d = 0; d < o.length; d++) {
      const l = o[d];
      if (l instanceof yr && l.name === ".flash.appdesc") {
        o.splice(d, 1), o.unshift(l);
        break;
      }
    }
    for (let d = 0; d < a.length; d++) {
      const l = a[d];
      if (l instanceof yr && l.name === ".dram0.bootdesc") {
        a.splice(d, 1), a.unshift(l);
        break;
      }
    }
    if (o.length > 0) {
      let d = o[0].addr;
      for (const l of o.slice(1)) {
        if (Math.floor(l.addr / this.IROM_ALIGN) === Math.floor(d / this.IROM_ALIGN)) throw new O(`Segment loaded at 0x${l.addr.toString(16)} lands in same 64KB flash mapping as segment loaded at 0x${d.toString(16)}. Can't generate binary. Suggest changing linker script or ELF to merge sections.`);
        d = l.addr;
      }
    }
    if (this.ramOnlyHeader) {
      for (const d of a) s = this.saveSegment(t, r, d, s), r += 8 + d.data.length, e++;
      this.appendChecksum(t, r, s), r = ce(r, 16);
      for (const d of o.reverse()) {
        let l = this.getAlignmentDataNeeded(d, r);
        if (l > 0) {
          l < this.ROM_LOADER.BOOTLOADER_FLASH_OFFSET - this.SEG_HEADER_LEN && (l += this.IROM_ALIGN), l -= this.ROM_LOADER.BOOTLOADER_FLASH_OFFSET;
          const c = new kt(0, new Uint8Array(l).fill(0), r);
          s = this.saveSegment(t, r, c, s), r += 8 + l, e++;
        }
        this.saveFlashSegment(t, r, d), r += 8 + d.data.length, e++;
      }
    } else {
      for (; o.length > 0; ) {
        const d = o[0], l = this.getAlignmentDataNeeded(d, r);
        if (l > 0) {
          if (a.length > 0 && l > this.SEG_HEADER_LEN) {
            const c = a[0].splitImage(l);
            a[0].data.length === 0 && a.shift(), s = this.saveSegment(t, r, c, s);
          } else {
            const c = new kt(0, new Uint8Array(l).fill(0), r);
            s = this.saveSegment(t, r, c, s);
          }
          r += 8 + l, e++;
        } else {
          if ((r + 8) % this.IROM_ALIGN != d.addr % this.IROM_ALIGN) throw new Error("Flash segment alignment mismatch");
          s = this.saveFlashSegment(t, r, d, s), o.shift(), r += 8 + d.data.length, e++;
        }
      }
      for (const d of a) s = this.saveSegment(t, r, d, s), r += 8 + d.data.length, e++;
    }
    if (this.securePad) {
      if (!this.appendDigest) throw new Error("secure_pad only applies if a SHA-256 digest is also appended to the image");
      const d = (r + this.SEG_HEADER_LEN) % this.IROM_ALIGN, l = 16;
      let c = 0;
      this.securePad === "1" ? c = 112 : this.securePad === "2" && (c = 32);
      const f = (this.IROM_ALIGN - d - l - c) % this.IROM_ALIGN, m = new kt(0, new Uint8Array(f).fill(0), r);
      s = this.saveSegment(t, r, m, s), r += 8 + f, e++;
    }
    this.ramOnlyHeader || (this.appendChecksum(t, r, s), r = ce(r, 16));
    const n = r;
    if (this.ramOnlyHeader ? t[1] = a.length : t[1] = e, this.appendDigest) {
      const d = await crypto.subtle.digest("SHA-256", t.slice(0, n)), l = new Uint8Array(d);
      t.set(l, n), r += 32;
    }
    if (this.padToSize && r % this.padToSize != 0) {
      const d = this.padToSize - r % this.padToSize, l = new Uint8Array(d);
      l.fill(255), t.set(l, r), r += d;
    }
    return t;
  }
  loadExtendedHeader(e, t) {
    const r = new DataView(e.buffer, t);
    this.wpPin = r.getUint8(0);
    const s = r.getUint8(1);
    [this.clkDrv, this.qDrv] = this.splitByte(s);
    const o = r.getUint8(2);
    [this.dDrv, this.csDrv] = this.splitByte(o);
    const a = r.getUint8(3);
    [this.hdDrv, this.wpDrv] = this.splitByte(a), this.chipId = r.getUint8(4), this.chipId !== this.ROM_LOADER.IMAGE_CHIP_ID && console.warn(`Unexpected chip id in image. Expected ${this.ROM_LOADER.IMAGE_CHIP_ID} but value was ${this.chipId}. Is this image for a different chip model?`), this.minRev = r.getUint8(5), this.minRevFull = r.getUint16(6, !0), this.maxRevFull = r.getUint16(8, !0);
    const n = r.getUint8(15);
    if (n !== 0 && n !== 1) throw new Error(`Invalid value for append_digest field (0x${n.toString(16)}). Should be 0 or 1.`);
    this.appendDigest = n === 1;
  }
  saveExtendedHeader(e, t) {
    const r = new ArrayBuffer(16), s = new DataView(r);
    s.setUint8(0, this.wpPin), s.setUint8(1, this.joinByte(this.clkDrv, this.qDrv)), s.setUint8(2, this.joinByte(this.dDrv, this.csDrv)), s.setUint8(3, this.joinByte(this.hdDrv, this.wpDrv)), s.setUint8(4, this.ROM_LOADER.IMAGE_CHIP_ID), s.setUint8(5, this.minRev), s.setUint16(6, this.minRevFull, !0), s.setUint16(8, this.maxRevFull, !0);
    for (let o = 9; o < 15; o++) s.setUint8(o, 0);
    s.setUint8(15, this.appendDigest ? 1 : 0), e.set(new Uint8Array(r), t);
  }
  splitByte(e) {
    return [15 & e, e >> 4 & 15];
  }
  joinByte(e, t) {
    return 15 & e | (15 & t) << 4;
  }
  getAlignmentDataNeeded(e, t) {
    const r = e.addr % this.IROM_ALIGN - this.SEG_HEADER_LEN;
    let s = this.IROM_ALIGN - t % this.IROM_ALIGN + r;
    return s === 0 || s === this.IROM_ALIGN ? 0 : (s -= this.SEG_HEADER_LEN, s < 0 && (s += this.IROM_ALIGN), s);
  }
}
class jo extends zi {
  constructor(e, t = null) {
    super(e), this.version = 1, this.ROM_LOADER = e, this.flashMode = 0, this.flashSizeFreq = 0, t !== null && this.loadFromFile(t);
  }
  loadFromFile(e) {
    const t = e instanceof Uint8Array ? e : Ye(e);
    let r = 0;
    const s = this.loadCommonHeader(t, r, be);
    r += 8;
    for (let o = 0; o < s; o++)
      r += 8 + this.loadSegment(t, r).data.length;
    this.checksum = this.readChecksum(t, r), this.verify();
  }
  defaultOutputName(e) {
    return e + "-";
  }
}
class Pt extends zi {
  constructor(e, t = null) {
    super(e), this.version = 2, this.ROM_LOADER = e, this.flashMode = 0, this.flashSizeFreq = 0, t !== null && this.loadFromFile(t);
  }
  async loadFromFile(e) {
    const t = e instanceof Uint8Array ? e : Ye(e);
    let r = 0;
    const s = this.loadCommonHeader(t, r, Pt.IMAGE_V2_MAGIC);
    r += 8, s !== Pt.IMAGE_V2_SEGMENT && console.warn(`Warning: V2 header has unexpected "segment" count ${s} (usually 4)`);
    const o = this.flashMode, a = this.flashSizeFreq, n = this.entrypoint, d = this.loadSegment(t, r, !0);
    d.addr = 0, d.includeInChecksum = !1, r += 8 + d.data.length;
    const l = this.loadCommonHeader(t, r, be);
    r += 8, o !== this.flashMode && console.warn(`WARNING: Flash mode value in first header (0x${o.toString(16)}) disagrees with second (0x${this.flashMode.toString(16)}). Using second value.`), a !== this.flashSizeFreq && console.warn(`WARNING: Flash size/freq value in first header (0x${a.toString(16)}) disagrees with second (0x${this.flashSizeFreq.toString(16)}). Using second value.`), n !== this.entrypoint && console.warn(`WARNING: Entrypoint address in first header (0x${n.toString(16)}) disagrees with second header (0x${this.entrypoint.toString(16)}). Using second value.`);
    for (let c = 0; c < l; c++)
      r += 8 + this.loadSegment(t, r).data.length;
    this.checksum = this.readChecksum(t, r), this.verify();
  }
  defaultOutputName(e) {
    const t = this.getIromSegment();
    let r = 0;
    return t !== null && (r = t.addr - Zt.IROM_MAP_START), `${e.replace(/\.[^/.]+$/, "")}-0x${(-4096 & r).toString(16).padStart(5, "0")}.bin`;
  }
}
Pt.IMAGE_V2_MAGIC = 234, Pt.IMAGE_V2_SEGMENT = 4;
class Yo extends Rt {
  constructor(e, t = null, r = !0, s = !1) {
    super(e, t, r, s), this.ROM_LOADER = e;
  }
}
class Xo extends Rt {
  constructor(e, t = null, r = !0, s = !1) {
    super(e, t, r, s), this.ROM_LOADER = e;
  }
}
class Jo extends Rt {
  constructor(e, t = null, r = !0, s = !1) {
    super(e, t, r, s), this.ROM_LOADER = e;
  }
}
class Qo extends Rt {
  constructor(e, t = null, r = !0, s = !1) {
    super(e, t, r, s), this.MMU_PAGE_SIZE_CONF = [16384, 32768, 65536], this.ROM_LOADER = e;
  }
}
class Bi extends Rt {
  constructor(e, t = null, r = !0, s = !1) {
    super(e, t, r, s), this.MMU_PAGE_SIZE_CONF = [8192, 16384, 32768, 65536], this.ROM_LOADER = e;
  }
}
class ta extends Bi {
  constructor(e, t = null, r = !0, s = !1) {
    super(e, t, r, s), this.ROM_LOADER = e;
  }
}
class ea extends Rt {
  constructor(e, t = null, r = !0, s = !1) {
    super(e, t, r, s), this.ROM_LOADER = e;
  }
}
class ia extends Rt {
  constructor(e, t = null, r = !0, s = !1) {
    super(e, t, r, s), this.ROM_LOADER = e;
  }
}
class ra extends Bi {
  constructor(e, t = null, r = !0, s = !1) {
    super(e, t, r, s), this.ROM_LOADER = e;
  }
}
async function xr(i, e) {
  const t = e instanceof Uint8Array ? e : Ye(e), r = i.CHIP_NAME.toLowerCase().replace(/[-()]/g, "");
  let s;
  if (r !== "esp8266") switch (r) {
    case "esp32":
      s = Rt;
      break;
    case "esp32s2":
      s = Yo;
      break;
    case "esp32s3":
      s = Xo;
      break;
    case "esp32c3":
      s = Jo;
      break;
    case "esp32c2":
      s = Qo;
      break;
    case "esp32c6":
      s = Bi;
      break;
    case "esp32c61":
      s = ta;
      break;
    case "esp32c5":
      s = ea;
      break;
    case "esp32h2":
      s = ra;
      break;
    case "esp32p4":
      s = ia;
      break;
    default:
      throw new O(`Unsupported chip name: ${r}`);
  }
  else {
    const n = t[0];
    if (n === be) s = jo;
    else {
      if (n !== Pt.IMAGE_V2_MAGIC) throw new O(`Invalid image magic number: ${n}`);
      s = Pt;
    }
  }
  const o = new s(i), a = o;
  if (typeof a.loadFromFile == "function") {
    const n = a.loadFromFile(t);
    n instanceof Promise && await n;
  }
  return o;
}
class sa {
  constructor(e) {
    var t, r, s, o, a, n, d, l;
    this.ESP_RAM_BLOCK = 6144, this.ESP_FLASH_BEGIN = 2, this.ESP_FLASH_DATA = 3, this.ESP_FLASH_END = 4, this.ESP_MEM_BEGIN = 5, this.ESP_MEM_END = 6, this.ESP_MEM_DATA = 7, this.ESP_WRITE_REG = 9, this.ESP_READ_REG = 10, this.ESP_SPI_ATTACH = 13, this.ESP_CHANGE_BAUDRATE = 15, this.ESP_FLASH_DEFL_BEGIN = 16, this.ESP_FLASH_DEFL_DATA = 17, this.ESP_FLASH_DEFL_END = 18, this.ESP_SPI_FLASH_MD5 = 19, this.ESP_ERASE_FLASH = 208, this.ESP_ERASE_REGION = 209, this.ESP_READ_FLASH = 210, this.ESP_RUN_USER_CODE = 211, this.ESP_IMAGE_MAGIC = 233, this.ESP_CHECKSUM_MAGIC = 239, this.ROM_INVALID_RECV_MSG = 5, this.DEFAULT_TIMEOUT = 3e3, this.ERASE_REGION_TIMEOUT_PER_MB = 3e4, this.ERASE_WRITE_TIMEOUT_PER_MB = 4e4, this.MD5_TIMEOUT_PER_MB = 8e3, this.CHIP_ERASE_TIMEOUT = 12e4, this.FLASH_READ_TIMEOUT = 1e5, this.MAX_TIMEOUT = 2 * this.CHIP_ERASE_TIMEOUT, this.SPI_ADDR_REG_MSB = !0, this.CHIP_DETECT_MAGIC_REG_ADDR = 1073745920, this.DETECTED_FLASH_SIZES = { 18: "256KB", 19: "512KB", 20: "1MB", 21: "2MB", 22: "4MB", 23: "8MB", 24: "16MB", 25: "32MB", 26: "64MB", 27: "128MB", 28: "256MB", 32: "64MB", 33: "128MB", 34: "256MB", 50: "256KB", 51: "512KB", 52: "1MB", 53: "2MB", 54: "4MB", 55: "8MB", 56: "16MB", 57: "32MB", 58: "64MB" }, this.USB_JTAG_SERIAL_PID = 4097, this.romBaudrate = 115200, this.debugLogging = !1, this.syncStubDetected = !1, this.IS_STUB = !1, this.FLASH_WRITE_SIZE = 16384, this.transport = e.transport, this.baudrate = e.baudrate, this.resetConstructors = { classicReset: (c, f) => new Ho(c, f), customReset: (c, f) => new Go(c, f), hardReset: (c, f) => new fs(c, f), usbJTAGSerialReset: (c) => new qo(c) }, e.serialOptions && (this.serialOptions = e.serialOptions), e.terminal && (this.terminal = e.terminal, this.terminal.clean()), e.debugLogging !== void 0 && (this.debugLogging = e.debugLogging), e.port && (this.transport = new Fi(e.port)), e.enableTracing !== void 0 && (this.transport.tracing = e.enableTracing), !((t = e.resetConstructors) === null || t === void 0) && t.classicReset && (this.resetConstructors.classicReset = (r = e.resetConstructors) === null || r === void 0 ? void 0 : r.classicReset), !((s = e.resetConstructors) === null || s === void 0) && s.customReset && (this.resetConstructors.customReset = (o = e.resetConstructors) === null || o === void 0 ? void 0 : o.customReset), !((a = e.resetConstructors) === null || a === void 0) && a.hardReset && (this.resetConstructors.hardReset = (n = e.resetConstructors) === null || n === void 0 ? void 0 : n.hardReset), !((d = e.resetConstructors) === null || d === void 0) && d.usbJTAGSerialReset && (this.resetConstructors.usbJTAGSerialReset = (l = e.resetConstructors) === null || l === void 0 ? void 0 : l.usbJTAGSerialReset), this.info("esptool.js"), this.info("Serial port " + this.transport.getInfo());
  }
  write(e, t = !0) {
    this.terminal ? t ? this.terminal.writeLine(e) : this.terminal.write(e) : console.log(e);
  }
  error(e, t = !0) {
    this.write(`Error: ${e}`, t);
  }
  info(e, t = !0) {
    this.write(e, t);
  }
  debug(e, t = !0) {
    this.debugLogging && this.write(`Debug: ${e}`, t);
  }
  _shortToBytearray(e) {
    return new Uint8Array([255 & e, e >> 8 & 255]);
  }
  _intToByteArray(e) {
    return new Uint8Array([255 & e, e >> 8 & 255, e >> 16 & 255, e >> 24 & 255]);
  }
  _byteArrayToShort(e, t) {
    return e | t >> 8;
  }
  _byteArrayToInt(e, t, r, s) {
    return e | t << 8 | r << 16 | s << 24;
  }
  _appendBuffer(e, t) {
    const r = new Uint8Array(e.byteLength + t.byteLength);
    return r.set(new Uint8Array(e), 0), r.set(new Uint8Array(t), e.byteLength), r.buffer;
  }
  _appendArray(e, t) {
    const r = new Uint8Array(e.length + t.length);
    return r.set(e, 0), r.set(t, e.length), r;
  }
  ui8ToBstr(e) {
    let t = "";
    for (let r = 0; r < e.length; r++) t += String.fromCharCode(e[r]);
    return t;
  }
  bstrToUi8(e) {
    const t = new Uint8Array(e.length);
    for (let r = 0; r < e.length; r++) t[r] = e.charCodeAt(r);
    return t;
  }
  async readPacket(e = null, t = this.DEFAULT_TIMEOUT) {
    for (let r = 0; r < 100; r++) {
      const s = await this.transport.read(t);
      if (!s || s.length < 8) continue;
      const o = s[0];
      if (o !== 1) continue;
      const a = s[1], n = this._byteArrayToInt(s[4], s[5], s[6], s[7]), d = s.slice(8);
      if (o == 1) {
        if (e == null || a == e) return [n, d];
        if (d[0] != 0 && d[1] == this.ROM_INVALID_RECV_MSG) throw this.transport.flushInput(), new O("unsupported command error");
      }
    }
    throw new O("invalid response");
  }
  async command(e = null, t = new Uint8Array(0), r = 0, s = !0, o = this.DEFAULT_TIMEOUT) {
    if (e != null) {
      this.transport.tracing && this.transport.trace(`command op:0x${e.toString(16).padStart(2, "0")} data len=${t.length} wait_response=${s ? 1 : 0} timeout=${(o / 1e3).toFixed(3)} data=${this.transport.hexConvert(t)}`);
      const a = new Uint8Array(8 + t.length);
      let n;
      for (a[0] = 0, a[1] = e, a[2] = this._shortToBytearray(t.length)[0], a[3] = this._shortToBytearray(t.length)[1], a[4] = this._intToByteArray(r)[0], a[5] = this._intToByteArray(r)[1], a[6] = this._intToByteArray(r)[2], a[7] = this._intToByteArray(r)[3], n = 0; n < t.length; n++) a[8 + n] = t[n];
      await this.transport.write(a);
    }
    return s ? this.readPacket(e, o) : [0, new Uint8Array(0)];
  }
  async readReg(e, t = this.DEFAULT_TIMEOUT) {
    this.debug(`Read Register:${this.toHex(e)}`);
    const r = this._intToByteArray(e), s = await this.command(this.ESP_READ_REG, r, void 0, void 0, t);
    return this.debug(`Read Register Value:${s[0]}`), s[0];
  }
  async writeReg(e, t, r = 4294967295, s = 0, o = 0) {
    let a = this._appendArray(this._intToByteArray(e), this._intToByteArray(t));
    a = this._appendArray(a, this._intToByteArray(r)), a = this._appendArray(a, this._intToByteArray(s)), o > 0 && (a = this._appendArray(a, this._intToByteArray(this.chip.UART_DATE_REG_ADDR)), a = this._appendArray(a, this._intToByteArray(0)), a = this._appendArray(a, this._intToByteArray(0)), a = this._appendArray(a, this._intToByteArray(o))), await this.checkCommand("write target memory", this.ESP_WRITE_REG, a);
  }
  async sync() {
    this.debug("Sync");
    const e = new Uint8Array(36);
    let t;
    for (e[0] = 7, e[1] = 7, e[2] = 18, e[3] = 32, t = 0; t < 32; t++) e[4 + t] = 85;
    try {
      let r = await this.command(8, e, void 0, void 0, 100);
      this.syncStubDetected = r[0] === 0;
      for (let s = 0; s < 7; s++) r = await this.readPacket(8, 100), this.syncStubDetected = this.syncStubDetected && r[0] === 0;
      return r;
    } catch (r) {
      throw this.debug("Sync err " + r), r;
    }
  }
  async _connectAttempt(e = "default_reset", t) {
    this.debug("_connect_attempt " + e), t && await t.reset();
    const r = this.transport.peek(), s = Array.from(r, ((l) => String.fromCharCode(l))).join("").match(/boot:(0x[0-9a-fA-F]+)([\s\S]*?waiting for download)?/);
    let o = !1, a = "", n = !1;
    s && (o = !0, a = s[1], n = !!s[2]), this.debug(`bootMode:${a} downloadMode:${n}`);
    let d = "";
    for (let l = 0; l < 5; l++) try {
      this.debug(`Sync connect attempt ${l}`), this.transport.flushInput();
      const c = await this.sync();
      return this.debug(c[0].toString()), "success";
    } catch (c) {
      this.debug(`Error at sync ${c}`), d = c instanceof Error ? c.message : typeof c == "string" ? c : JSON.stringify(c);
    }
    return o && (d = `Wrong boot mode detected (${a}).
        This chip needs to be in download mode.`, n && (d = `Download mode successfully detected, but getting no sync reply:
           The serial TX path seems to be down.`)), d;
  }
  constructResetSequence(e) {
    if (e !== "no_reset") {
      if (e === "usb_reset" || this.transport.getPid() === this.USB_JTAG_SERIAL_PID) {
        if (this.resetConstructors.usbJTAGSerialReset) return this.debug("using USB JTAG Serial Reset"), [this.resetConstructors.usbJTAGSerialReset(this.transport)];
      } else if (this.resetConstructors.classicReset) return this.debug("using Classic Serial Reset"), [this.resetConstructors.classicReset(this.transport, 50), this.resetConstructors.classicReset(this.transport, 550)];
    }
    return [];
  }
  async connect(e = "default_reset", t = 7, r = !0) {
    let s;
    this.info("Connecting...", !1), await this.transport.connect(this.romBaudrate, this.serialOptions), this.transport.readLoop();
    const o = this.constructResetSequence(e);
    for (let a = 0; a < t; a++) {
      const n = o.length > 0 ? o[a % o.length] : null;
      if (s = await this._connectAttempt(e, n), s === "success") break;
    }
    if (s !== "success") throw new O("Failed to connect with the device");
    if (this.debug("Connect attempt successful."), this.info(`
\r`, !1), r) {
      const a = await this.readReg(this.CHIP_DETECT_MAGIC_REG_ADDR) >>> 0;
      this.debug("Chip Magic " + a.toString(16));
      const n = await (async function(d) {
        switch (d) {
          case 15736195: {
            const { ESP32ROM: l } = await import("./circuitsetup-energy-meter-helper-esp32-DNPRK0Ay-BmbbHw2T.js");
            return new l();
          }
          case 203546735:
          case 1867591791:
          case 2084675695: {
            const { ESP32C2ROM: l } = await import("./circuitsetup-energy-meter-helper-esp32c2-CQ3ns5Nm-BUJYNPjW.js");
            return new l();
          }
          case 1763790959:
          case 456216687:
          case 1216438383:
          case 1130455151: {
            const { ESP32C3ROM: l } = await import("./circuitsetup-energy-meter-helper-esp32c3-2tchr35W-CpokVQ-e.js");
            return new l();
          }
          case 752910447: {
            const { ESP32C6ROM: l } = await import("./circuitsetup-energy-meter-helper-esp32c6-DolpfL0e-DcEcTipd.js");
            return new l();
          }
          case 606167151:
          case 871374959:
          case 1333878895: {
            const { ESP32C61ROM: l } = await import("./circuitsetup-energy-meter-helper-esp32c61-C8HktcOt-CuX_qBol.js");
            return new l();
          }
          case 285294703:
          case 1675706479:
          case 1607549039: {
            const { ESP32C5ROM: l } = await import("./circuitsetup-energy-meter-helper-esp32c5-CeCSizBL-DIxrpAK0.js");
            return new l();
          }
          case 3619110528:
          case 2548236392: {
            const { ESP32H2ROM: l } = await import("./circuitsetup-energy-meter-helper-esp32h2-L0n5WuSo-YvAmWDxO.js");
            return new l();
          }
          case 9: {
            const { ESP32S3ROM: l } = await import("./circuitsetup-energy-meter-helper-esp32s3-DQt_R3ZE-BP99ecmH.js");
            return new l();
          }
          case 1990: {
            const { ESP32S2ROM: l } = await import("./circuitsetup-energy-meter-helper-esp32s2-w9SUkb7o-CxMg6-N5.js");
            return new l();
          }
          case 4293968129: {
            const { ESP8266ROM: l } = await Promise.resolve().then((function() {
              return Ko;
            }));
            return new l();
          }
          case 0:
          case 182303440:
          case 117676761: {
            const { ESP32P4ROM: l } = await import("./circuitsetup-energy-meter-helper-esp32p4-MR0ikcda-D0PwMVc5.js");
            return new l();
          }
          default:
            return null;
        }
      })(a);
      if (typeof this.chip === null) throw new O(`Unexpected CHIP magic value ${a}. Failed to autodetect chip type.`);
      this.chip = n;
    }
  }
  async detectChip(e = "default_reset") {
    await this.connect(e), this.info("Detecting chip type... ", !1), this.chip != null ? this.info(this.chip.CHIP_NAME) : this.info("unknown!");
  }
  async checkCommand(e = "", t = null, r = new Uint8Array(0), s = 0, o = 0, a = this.DEFAULT_TIMEOUT) {
    this.debug("check_command " + e);
    const n = await this.command(t, r, s, void 0, a);
    if (n && n[1] && n[1].length < o + 2) {
      const l = n[1].slice(0, 2);
      throw l[0] !== 0 ? new O(`Failed to ${e} failed with status ${l}`) : new O(`Failed to ${e}.
 Only got ${n[1].length} bytes of data.`);
    }
    const d = n[1].slice(o, o + 2);
    if (d[0] !== 0) throw new O(`Failed to ${e} failed with status ${d}`);
    return o > 0 ? n[1].slice(0, o) : n[0];
  }
  async memBegin(e, t, r, s) {
    if (this.IS_STUB) {
      const a = s, n = s + e, d = this.chip.getChipRevision ? await this.chip.getChipRevision(this) : void 0, l = await _r(this.chip.CHIP_NAME, d);
      if (l) {
        const c = [[l.bss_start || l.data_start, l.data_start + l.decodedData.length], [l.text_start, l.text_start + l.decodedText.length]];
        for (const [f, m] of c) if (a < m && n > f) throw new O(`Software loader is resident at 0x${f.toString(16).padStart(8, "0")}-0x${m.toString(16).padStart(8, "0")}.
            Can't load binary at overlapping address range 0x${a.toString(16).padStart(8, "0")}-0x${n.toString(16).padStart(8, "0")}.
            Either change binary loading address, or use the no-stub option to disable the software loader.`);
      }
    }
    this.debug("mem_begin " + e + " " + t + " " + r + " " + s.toString(16));
    let o = this._appendArray(this._intToByteArray(e), this._intToByteArray(t));
    o = this._appendArray(o, this._intToByteArray(r)), o = this._appendArray(o, this._intToByteArray(s)), await this.checkCommand("enter RAM download mode", this.ESP_MEM_BEGIN, o);
  }
  checksum(e, t = this.ESP_CHECKSUM_MAGIC) {
    for (let r = 0; r < e.length; r++) t ^= e[r];
    return t;
  }
  async memBlock(e, t) {
    let r = this._appendArray(this._intToByteArray(e.length), this._intToByteArray(t));
    r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, e);
    const s = this.checksum(e);
    await this.checkCommand("write to target RAM", this.ESP_MEM_DATA, r, s);
  }
  async memFinish(e) {
    const t = e === 0 ? 1 : 0, r = this._appendArray(this._intToByteArray(t), this._intToByteArray(e));
    await this.checkCommand("leave RAM download mode", this.ESP_MEM_END, r, void 0, void 0, 200);
  }
  async flashSpiAttach(e) {
    const t = this._intToByteArray(e);
    await this.checkCommand("configure SPI flash pins", this.ESP_SPI_ATTACH, t);
  }
  timeoutPerMb(e, t) {
    const r = e * (t / 1e6);
    return r < 3e3 ? 3e3 : r;
  }
  async flashBegin(e, t) {
    const r = Math.floor((e + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), s = this.chip.getEraseSize(t, e), o = /* @__PURE__ */ new Date(), a = o.getTime();
    let n = 3e3;
    this.IS_STUB == 0 && (n = this.timeoutPerMb(this.ERASE_REGION_TIMEOUT_PER_MB, e)), this.debug("flash begin " + s + " " + r + " " + this.FLASH_WRITE_SIZE + " " + t + " " + e);
    let d = this._appendArray(this._intToByteArray(s), this._intToByteArray(r));
    d = this._appendArray(d, this._intToByteArray(this.FLASH_WRITE_SIZE)), d = this._appendArray(d, this._intToByteArray(t)), this.IS_STUB == 0 && (d = this._appendArray(d, this._intToByteArray(0))), await this.checkCommand("enter Flash download mode", this.ESP_FLASH_BEGIN, d, void 0, void 0, n);
    const l = o.getTime();
    return e != 0 && this.IS_STUB == 0 && this.info("Took " + (l - a) / 1e3 + "." + (l - a) % 1e3 + "s to erase flash block"), r;
  }
  async flashDeflBegin(e, t, r) {
    const s = Math.floor((t + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), o = Math.floor((e + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), a = /* @__PURE__ */ new Date(), n = a.getTime();
    let d, l;
    this.IS_STUB ? (d = e, l = this.DEFAULT_TIMEOUT) : (d = o * this.FLASH_WRITE_SIZE, l = this.timeoutPerMb(this.ERASE_REGION_TIMEOUT_PER_MB, d)), this.info("Compressed " + e + " bytes to " + t + "...");
    let c = this._appendArray(this._intToByteArray(d), this._intToByteArray(s));
    c = this._appendArray(c, this._intToByteArray(this.FLASH_WRITE_SIZE)), c = this._appendArray(c, this._intToByteArray(r)), this.chip.CHIP_NAME !== "ESP32-S2" && this.chip.CHIP_NAME !== "ESP32-S3" && this.chip.CHIP_NAME !== "ESP32-C3" && this.chip.CHIP_NAME !== "ESP32-C2" || this.IS_STUB !== !1 || (c = this._appendArray(c, this._intToByteArray(0))), await this.checkCommand("enter compressed flash mode", this.ESP_FLASH_DEFL_BEGIN, c, void 0, void 0, l);
    const f = a.getTime();
    return e != 0 && this.IS_STUB === !1 && this.info("Took " + (f - n) / 1e3 + "." + (f - n) % 1e3 + "s to erase flash block"), s;
  }
  async flashBlock(e, t, r) {
    let s = this._appendArray(this._intToByteArray(e.length), this._intToByteArray(t));
    s = this._appendArray(s, this._intToByteArray(0)), s = this._appendArray(s, this._intToByteArray(0)), s = this._appendArray(s, e);
    const o = this.checksum(e);
    await this.checkCommand("write to target Flash after seq " + t, this.ESP_FLASH_DATA, s, o, void 0, r);
  }
  async flashDeflBlock(e, t, r) {
    let s = this._appendArray(this._intToByteArray(e.length), this._intToByteArray(t));
    s = this._appendArray(s, this._intToByteArray(0)), s = this._appendArray(s, this._intToByteArray(0)), s = this._appendArray(s, e);
    const o = this.checksum(e);
    this.debug("flash_defl_block " + e[0].toString(16) + " " + e[1].toString(16)), await this.checkCommand("write compressed data to flash after seq " + t, this.ESP_FLASH_DEFL_DATA, s, o, void 0, r);
  }
  async flashFinish(e = !1, t = this.DEFAULT_TIMEOUT) {
    const r = e ? 0 : 1, s = this._intToByteArray(r);
    await this.checkCommand("leave Flash mode", this.ESP_FLASH_END, s, void 0, void 0, t);
  }
  async flashDeflFinish(e = !1, t = this.DEFAULT_TIMEOUT) {
    const r = e ? 0 : 1, s = this._intToByteArray(r);
    await this.checkCommand("leave compressed flash mode", this.ESP_FLASH_DEFL_END, s, void 0, void 0, t);
  }
  async runSpiflashCommand(e, t, r, s = null, o = 0, a = 0) {
    const n = this.chip.SPI_REG_BASE, d = n + 0, l = n + 4, c = n + this.chip.SPI_USR_OFFS, f = n + this.chip.SPI_USR1_OFFS, m = n + this.chip.SPI_USR2_OFFS, p = n + this.chip.SPI_W0_OFFS;
    let E;
    E = this.chip.SPI_MOSI_DLEN_OFFS != null ? async (A, S) => {
      const I = n + this.chip.SPI_MOSI_DLEN_OFFS, D = n + this.chip.SPI_MISO_DLEN_OFFS;
      A > 0 && await this.writeReg(I, A - 1), S > 0 && await this.writeReg(D, S - 1);
      let K = 0;
      a > 0 && (K |= a - 1), o > 0 && (K |= o - 1 << _), K && await this.writeReg(f, K);
    } : async (A, S) => {
      const I = f;
      let D = (S === 0 ? 0 : S - 1) << 8 | (A === 0 ? 0 : A - 1) << 17;
      a > 0 && (D |= a - 1), o > 0 && (D |= o - 1 << _), await this.writeReg(I, D);
    };
    const v = 1 << 18, _ = 26;
    if (r > 32) throw new O("Reading more than 32 bits back from a SPI flash operation is unsupported");
    if (t.length > 64) throw new O("Writing more than 64 bytes of data with one SPI command is unsupported");
    const k = 8 * t.length, w = await this.readReg(c), u = await this.readReg(m);
    let x = 1 << 31;
    r > 0 && (x |= 268435456), k > 0 && (x |= 134217728), o > 0 && (x |= 1073741824), a > 0 && (x |= 536870912), await E(k, r), await this.writeReg(c, x);
    let C, b = 7 << 28 | e;
    if (await this.writeReg(m, b), s && o > 0 && (this.SPI_ADDR_REG_MSB && (s <<= 32 - o), await this.writeReg(l, s)), k == 0) await this.writeReg(p, 0);
    else {
      t = ki(t, 4, 0);
      const A = [];
      for (let I = 0; I < t.length; I += 4) A.push((t[I] | t[I + 1] << 8 | t[I + 2] << 16 | t[I + 3] << 24) >>> 0);
      let S = p;
      for (const I of A) await this.writeReg(S, I), S += 4;
    }
    for (await this.writeReg(d, v), C = 0; C < 10 && (b = await this.readReg(d) & v, b != 0); C++) ;
    if (C === 10) throw new O("SPI command did not complete in time");
    const T = await this.readReg(p);
    return await this.writeReg(c, w), await this.writeReg(m, u), T;
  }
  async readFlashId() {
    const e = new Uint8Array(0);
    return await this.runSpiflashCommand(159, e, 24);
  }
  async eraseFlash() {
    this.info("Erasing flash (this may take a while)...");
    let e = /* @__PURE__ */ new Date();
    const t = e.getTime(), r = await this.checkCommand("erase flash", this.ESP_ERASE_FLASH, void 0, void 0, void 0, this.CHIP_ERASE_TIMEOUT);
    e = /* @__PURE__ */ new Date();
    const s = e.getTime();
    return this.info("Chip erase completed successfully in " + (s - t) / 1e3 + "s"), r;
  }
  toHex(e) {
    return Array.prototype.map.call(e, ((t) => ("00" + t.toString(16)).slice(-2))).join("");
  }
  async flashMd5sum(e, t) {
    const r = this.timeoutPerMb(this.MD5_TIMEOUT_PER_MB, t);
    let s = this._appendArray(this._intToByteArray(e), this._intToByteArray(t));
    s = this._appendArray(s, this._intToByteArray(0)), s = this._appendArray(s, this._intToByteArray(0));
    const o = this.IS_STUB ? 16 : 32, a = await this.checkCommand("calculate md5sum", this.ESP_SPI_FLASH_MD5, s, void 0, o, r);
    return this.toHex(a);
  }
  async readFlash(e, t, r = null) {
    let s = this._appendArray(this._intToByteArray(e), this._intToByteArray(t));
    s = this._appendArray(s, this._intToByteArray(4096)), s = this._appendArray(s, this._intToByteArray(1024));
    const o = await this.checkCommand("read flash", this.ESP_READ_FLASH, s);
    if (o != 0) throw new O("Failed to read memory: " + o);
    let a = new Uint8Array(0);
    for (; a.length < t; ) {
      const n = await this.transport.read(this.FLASH_READ_TIMEOUT);
      if (!(n instanceof Uint8Array)) throw new O("Failed to read memory: " + n);
      n.length > 0 && (a = this._appendArray(a, n), await this.transport.write(this._intToByteArray(a.length)), r && r(n, a.length, t));
    }
    return a;
  }
  async runStub() {
    if (this.syncStubDetected) return this.info("Stub is already running. No upload is necessary."), this.chip;
    this.info("Uploading stub...");
    const e = this.chip.getChipRevision ? await this.chip.getChipRevision(this) : void 0, t = await _r(this.chip.CHIP_NAME, e);
    if (t === void 0) throw this.debug("Error loading Stub json"), new Error("Error loading Stub json");
    const r = [t.decodedText, t.decodedData];
    for (let a = 0; a < r.length; a++) if (r[a]) {
      const n = a === 0 ? t.text_start : t.data_start, d = r[a].length, l = Math.floor((d + this.ESP_RAM_BLOCK - 1) / this.ESP_RAM_BLOCK);
      await this.memBegin(d, l, this.ESP_RAM_BLOCK, n);
      for (let c = 0; c < l; c++) {
        const f = c * this.ESP_RAM_BLOCK, m = f + this.ESP_RAM_BLOCK;
        await this.memBlock(r[a].slice(f, m), c);
      }
    }
    this.info("Running stub..."), await this.memFinish(t.entry);
    const s = await this.transport.read(this.DEFAULT_TIMEOUT), o = String.fromCharCode(...s);
    if (o !== "OHAI") throw new O(`Failed to start stub. Unexpected response ${o}`);
    return this.info("Stub running..."), this.IS_STUB = !0, this.chip;
  }
  async changeBaud() {
    this.info("Changing baudrate to " + this.baudrate);
    const e = this.IS_STUB ? this.romBaudrate : 0, t = this._appendArray(this._intToByteArray(this.baudrate), this._intToByteArray(e));
    await this.command(this.ESP_CHANGE_BAUDRATE, t), this.info("Changed"), this.info("If the chip does not respond to any further commands, consider using a lower baud rate."), await de(50), await this.transport.disconnect(), await de(50), await this.transport.connect(this.baudrate, this.serialOptions), await de(50), this.transport.readLoop();
  }
  async main(e = "default_reset") {
    await this.detectChip(e);
    const t = await this.chip.getChipDescription(this);
    if (this.chip.getChipRevision) {
      const r = await this.chip.getChipRevision(this);
      this.info("Chip Revision: " + r);
    }
    this.info("Chip is " + t), this.info("Features: " + await this.chip.getChipFeatures(this)), this.info("Crystal is " + await this.chip.getCrystalFreq(this) + "MHz"), this.info("MAC: " + await this.chip.readMac(this)), await this.chip.readMac(this), this.chip.postConnect !== void 0 && await this.chip.postConnect(this), await this.runStub(), this.romBaudrate !== this.baudrate && await this.changeBaud();
    try {
      const r = await this.readFlashId();
      this.info("Flash ID: " + r.toString(16)), r !== 16777215 && r !== 0 || this.info(`WARNING: Failed to communicate with the flash chip,
read/write operations will fail.
Try checking the chip connections or removing
any other hardware connected to IOs.`);
    } catch (r) {
      throw new O("Unable to verify flash chip connection " + r);
    }
    return t;
  }
  flashSizeBytes(e) {
    let t = -1;
    return this.transport.trace(`Flash size string ${e}`), e.toString().indexOf("KB") !== -1 ? t = 1024 * parseInt(e.toString().slice(0, e.toString().indexOf("KB"))) : e.toString().indexOf("MB") !== -1 && (t = 1024 * parseInt(e.toString().slice(0, e.toString().indexOf("MB"))) * 1024), this.transport.trace(`Flash size in bytes ${t}`), t;
  }
  parseFlashSizeArg(e) {
    if (this.chip.FLASH_SIZES[e] === void 0) throw new O("Flash size " + e + " is not supported by this chip type. Supported sizes: " + this.chip.FLASH_SIZES);
    return this.chip.FLASH_SIZES[e];
  }
  async _updateImageFlashParams(e, t, r = "keep", s = "keep", o = "keep") {
    if (this.debug(`_update_image_flash_params ${o} ${r} ${s}`), e.length < 8 || t != this.chip.BOOTLOADER_FLASH_OFFSET) return e;
    if (o === "keep" && r === "keep" && s === "keep") return this.info("Not changing the image"), e;
    const a = e[0];
    let n = e[2];
    const d = e[3];
    if (a !== this.ESP_IMAGE_MAGIC) return this.info("Warning: Image file at 0x" + t.toString(16) + " doesn't look like an image file, so not changing any flash settings."), e;
    try {
      (await xr(this.chip, e)).verify();
    } catch {
      return this.debug(`Warning: Image file at 0x${t.toString(16)} is not a valid ${this.chip.CHIP_NAME} image, so not changing any flash settings.`), e;
    }
    const l = this.chip.CHIP_NAME !== "ESP8266" && e[23] === 49;
    r !== "keep" && (n = { qio: 0, qout: 1, dio: 2, dout: 3 }[r]);
    let c = 15 & d;
    s !== "keep" && (c = { "40m": 0, "26m": 1, "20m": 2, "80m": 15 }[s]);
    let f = 240 & d;
    if (o !== "keep") if (o === "detect") {
      this.info("Configuring flash size...");
      const E = await this.detectFlashSize();
      this.info("Detected flash size set to " + E), f = this.parseFlashSizeArg(E);
    } else f = this.parseFlashSizeArg(o);
    const m = n << 8 | c + f;
    this.info("Flash params set to " + m.toString(16));
    const p = new Uint8Array(e);
    if (e[2] !== n && (p[2] = n), e[3] !== c + f && (p[3] = c + f), l) {
      const E = await xr(this.chip, p), v = p.slice(0, E.datalength), _ = p.slice(E.datalength + E.SHA256_DIGEST_LEN), k = await crypto.subtle.digest("SHA-256", _), w = new Uint8Array(k), u = new Uint8Array(v.length + w.length + _.length);
      u.set(v, 0), u.set(w, v.length), u.set(_, v.length + w.length);
      const x = u.slice(E.datalength, E.datalength + E.SHA256_DIGEST_LEN);
      return this.transport.hexify(w) === this.transport.hexify(x) ? this.info("SHA digest in image updated") : this.info(`WARNING: SHA recalculation for binary failed!
	Expected calculated SHA: ${this.transport.hexify(w)}
	SHA stored in binary:    ${this.transport.hexify(x)}`), u;
    }
    return p;
  }
  async writeFlash(e) {
    if (this.debug("EspLoader program"), e.flashSize !== "keep") {
      const s = this.flashSizeBytes(e.flashSize);
      for (let o = 0; o < e.fileArray.length; o++) if (e.fileArray[o].data.length + e.fileArray[o].address > s) throw new O(`File ${o + 1} doesn't fit in the available flash`);
    }
    let t, r;
    this.IS_STUB === !0 && e.eraseAll === !0 && await this.eraseFlash();
    for (let s = 0; s < e.fileArray.length; s++) {
      if (this.debug("Data Length " + e.fileArray[s].data.length), t = e.fileArray[s].data, this.debug("Image Length " + t.length), t.length === 0) {
        this.debug("Warning: File is empty");
        continue;
      }
      t = ki(t, 4), r = e.fileArray[s].address, t = await this._updateImageFlashParams(t, r, e.flashMode, e.flashFreq, e.flashSize);
      let o = null;
      e.calculateMD5Hash && (o = e.calculateMD5Hash(t), this.debug("Image MD5 " + o));
      const a = t.length;
      let n;
      e.compress ? (t = Uo(t, { level: 9 }), n = await this.flashDeflBegin(a, t.length, r)) : n = await this.flashBegin(a, r);
      let d = 0, l = 0;
      const c = t.length;
      e.reportProgress && e.reportProgress(s, 0, c);
      let f = /* @__PURE__ */ new Date();
      const m = f.getTime();
      let p = 5e3;
      const E = new No({ chunkSize: 1 });
      let v = 0;
      E.onData = function(w) {
        v += w.byteLength;
      };
      let _ = 0;
      for (; _ < t.length; ) {
        this.debug("Write loop " + r + " " + d + " " + n), this.info("Writing at 0x" + (r + v).toString(16) + "... (" + Math.floor(100 * (d + 1) / n) + "%)");
        const w = Math.min(this.FLASH_WRITE_SIZE, t.length - _), u = t.slice(_, _ + w), x = _ + w >= t.length;
        if (!e.compress) throw new O("Yet to handle Non Compressed writes");
        {
          const C = v;
          E.push(u, x);
          const b = v - C;
          let T = 3e3;
          this.timeoutPerMb(this.ERASE_WRITE_TIMEOUT_PER_MB, b) > 3e3 && (T = this.timeoutPerMb(this.ERASE_WRITE_TIMEOUT_PER_MB, b)), this.IS_STUB === !1 && (p = T), await this.flashDeflBlock(u, d, p), this.IS_STUB && (p = T);
        }
        l += u.length, _ += w, d++, e.reportProgress && e.reportProgress(s, l, c);
      }
      this.IS_STUB && (e.compress ? await this.flashDeflFinish(!1, p) : await this.flashFinish(!1, p)), f = /* @__PURE__ */ new Date();
      const k = f.getTime() - m;
      if (e.compress && this.info("Wrote " + a + " bytes (" + l + " compressed) at 0x" + r.toString(16) + " in " + k / 1e3 + " seconds."), o) {
        this.info("File  md5: " + o);
        const w = await this.flashMd5sum(r, a);
        if (this.info("Flash md5: " + w), new String(w).valueOf() != new String(o).valueOf()) throw new O("MD5 of file does not match data in flash!");
        this.info("Hash of data verified.");
      }
    }
    this.info("Leaving...");
  }
  async flashId() {
    this.debug("flash_id");
    const e = await this.readFlashId();
    this.info("Manufacturer: " + (255 & e).toString(16));
    const t = e >> 16 & 255;
    this.info("Device: " + (e >> 8 & 255).toString(16) + t.toString(16)), this.info("Detected flash size: " + this.DETECTED_FLASH_SIZES[t]);
  }
  async detectFlashSize() {
    this.debug("detectFlashSize");
    const e = await this.readFlashId() >> 16 & 255;
    let t = this.DETECTED_FLASH_SIZES[e];
    return t ? this.info("Auto-detected Flash size: " + t) : (t = "4MB", this.info("Could not auto-detect Flash size. defaulting to 4MB")), t;
  }
  async softReset(e) {
    if (this.IS_STUB) {
      if (this.chip.CHIP_NAME != "ESP8266") throw new O("Soft resetting is currently only supported on ESP8266");
      e ? (await this.flashBegin(0, 0), await this.flashFinish(!0)) : await this.command(this.ESP_RUN_USER_CODE, void 0, void 0, !1);
    } else {
      if (e) return;
      await this.flashBegin(0, 0), await this.flashFinish(!1);
    }
  }
  async after(e = "hard_reset", t, r) {
    switch (e) {
      case "hard_reset":
        this.resetConstructors.hardReset && (this.info("Hard resetting via RTS pin..."), await this.resetConstructors.hardReset(this.transport, t).reset());
        break;
      case "soft_reset":
        this.info("Soft resetting..."), await this.softReset(!1);
        break;
      case "no_reset_stub":
        this.info("Staying in flasher stub.");
        break;
      case "custom_reset":
        r || this.info("Custom reset sequence not provided, doing nothing."), this.resetConstructors.customReset || this.info("Custom reset constructor not available, doing nothing."), this.resetConstructors.customReset && r && (this.info("Custom resetting using sequence " + r), await this.resetConstructors.customReset(this.transport, r).reset());
        break;
      default:
        this.info("Staying in bootloader."), this.IS_STUB && this.softReset(!0);
    }
  }
}
class oa extends HTMLElement {
  constructor() {
    super(...arguments), this.allowInput = !0;
  }
  logs() {
    var e;
    return ((e = this._console) === null || e === void 0 ? void 0 : e.logs()) || "";
  }
  connectedCallback() {
    if (this._console) return;
    if (this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host, input {
          background-color: #1c1c1c;
          color: #ddd;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
            monospace;
          line-height: 1.45;
          display: flex;
          flex-direction: column;
        }
        form {
          display: flex;
          align-items: center;
          padding: 0 8px 0 16px;
        }
        input {
          flex: 1;
          padding: 4px;
          margin: 0 8px;
          border: 0;
          outline: none;
        }
\x20\x20\x20\x20\x20\x20\x20\x20
  .log {
    flex: 1;
    background-color: #1c1c1c;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
      monospace;
    font-size: 12px;
    padding: 16px;
    overflow: auto;
    line-height: 1.45;
    border-radius: 3px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    color: #ddd;
  }

  .log-bold {
    font-weight: bold;
  }
  .log-italic {
    font-style: italic;
  }
  .log-underline {
    text-decoration: underline;
  }
  .log-strikethrough {
    text-decoration: line-through;
  }
  .log-underline.log-strikethrough {
    text-decoration: underline line-through;
  }
  .log-secret {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  .log-secret-redacted {
    opacity: 0;
    width: 1px;
    font-size: 1px;
  }
  .log-fg-black {
    color: rgb(128, 128, 128);
  }
  .log-fg-red {
    color: rgb(255, 0, 0);
  }
  .log-fg-green {
    color: rgb(0, 255, 0);
  }
  .log-fg-yellow {
    color: rgb(255, 255, 0);
  }
  .log-fg-blue {
    color: rgb(0, 0, 255);
  }
  .log-fg-magenta {
    color: rgb(255, 0, 255);
  }
  .log-fg-cyan {
    color: rgb(0, 255, 255);
  }
  .log-fg-white {
    color: rgb(187, 187, 187);
  }
  .log-bg-black {
    background-color: rgb(0, 0, 0);
  }
  .log-bg-red {
    background-color: rgb(255, 0, 0);
  }
  .log-bg-green {
    background-color: rgb(0, 255, 0);
  }
  .log-bg-yellow {
    background-color: rgb(255, 255, 0);
  }
  .log-bg-blue {
    background-color: rgb(0, 0, 255);
  }
  .log-bg-magenta {
    background-color: rgb(255, 0, 255);
  }
  .log-bg-cyan {
    background-color: rgb(0, 255, 255);
  }
  .log-bg-white {
    background-color: rgb(255, 255, 255);
  }

      </style>
      <div class="log"></div>
      ${this.allowInput ? `<form>
                >
                <input autofocus>
              </form>
            ` : ""}
    `, this._console = new Bs(this.shadowRoot.querySelector("div")), this.allowInput) {
      const r = this.shadowRoot.querySelector("input");
      this.addEventListener("click", (() => {
        var s;
        ((s = getSelection()) === null || s === void 0 ? void 0 : s.toString()) === "" && r.focus();
      })), r.addEventListener("keydown", ((s) => {
        s.key === "Enter" && (s.preventDefault(), s.stopPropagation(), this._sendCommand());
      }));
    }
    const e = new AbortController(), t = this._connect(e.signal);
    this._cancelConnection = () => (e.abort(), t);
  }
  async _connect(e) {
    this.logger.debug("Starting console read loop");
    try {
      await this.port.readable.pipeThrough(new TextDecoderStream(), { signal: e }).pipeThrough(new TransformStream(new Us())).pipeThrough(new TransformStream(new Ns())).pipeTo(new WritableStream({ write: (t) => {
        this._console.addLine(t.replace("\r", ""));
      } })), e.aborted || (this._console.addLine(""), this._console.addLine(""), this._console.addLine("Terminal disconnected"));
    } catch (t) {
      this._console.addLine(""), this._console.addLine(""), this._console.addLine(`Terminal disconnected: ${t}`);
    } finally {
      await Ht(100), this.logger.debug("Finished console read loop");
    }
  }
  async _sendCommand() {
    const e = this.shadowRoot.querySelector("input"), t = e.value, r = new TextEncoder(), s = this.port.writable.getWriter();
    await s.write(r.encode(t + `\r
`)), this._console.addLine(`> ${t}\r
`), e.value = "", e.focus();
    try {
      s.releaseLock();
    } catch (o) {
      console.error("Ignoring release lock error", o);
    }
  }
  async disconnect() {
    this._cancelConnection && (await this._cancelConnection(), this._cancelConnection = void 0);
  }
  async reset() {
    this.logger.debug("Triggering reset");
    const e = new Fi(this.port);
    await e.setRTS(!0), await Ht(100), await new fs(e).reset();
  }
}
function wr(i, e = !0) {
  return e && getComputedStyle(i).getPropertyValue("direction").trim() === "rtl";
}
customElements.define("ewt-console", oa);
const aa = Ft(We(U));
class W extends aa {
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(e) {
    this.setAttribute("name", e);
  }
  get form() {
    return this[tt].form;
  }
  get labels() {
    return this[tt].labels;
  }
  constructor() {
    super(), this.disabled = !1, this.softDisabled = !1, this.flipIconInRtl = !1, this.href = "", this.download = "", this.target = "", this.ariaLabelSelected = "", this.toggle = !1, this.selected = !1, this.type = "submit", this.value = "", this.flipIcon = wr(this, this.flipIconInRtl), this.addEventListener("click", this.handleClick.bind(this));
  }
  willUpdate() {
    this.href && (this.disabled = !1, this.softDisabled = !1);
  }
  render() {
    const e = this.href ? wt`div` : wt`button`, { ariaLabel: t, ariaHasPopup: r, ariaExpanded: s } = this, o = t && this.ariaLabelSelected, a = this.toggle ? this.selected : R;
    let n = R;
    return this.href || (n = o && this.selected ? this.ariaLabelSelected : t), Ze`<${e}
        class="icon-button ${ot(this.getRenderClasses())}"
        id="button"
        aria-label="${n || R}"
        aria-haspopup="${!this.href && r || R}"
        aria-expanded="${!this.href && s || R}"
        aria-pressed="${a}"
        aria-disabled=${!this.href && this.softDisabled || R}
        ?disabled="${!this.href && this.disabled}"
        @click="${this.handleClickOnChild}">
        ${this.renderFocusRing()}
        ${this.renderRipple()}
        ${this.selected ? R : this.renderIcon()}
        ${this.selected ? this.renderSelectedIcon() : R}
        ${this.href ? this.renderLink() : this.renderTouchTarget()}
  </${e}>`;
  }
  renderLink() {
    const { ariaLabel: e } = this;
    return y`
      <a
        class="link"
        id="link"
        href="${this.href}"
        download="${this.download || R}"
        target="${this.target || R}"
        aria-label="${e || R}">
        ${this.renderTouchTarget()}
      </a>
    `;
  }
  getRenderClasses() {
    return { "flip-icon": this.flipIcon, selected: this.toggle && this.selected };
  }
  renderIcon() {
    return y`<span class="icon"><slot></slot></span>`;
  }
  renderSelectedIcon() {
    return y`<span class="icon icon--selected"
      ><slot name="selected"><slot></slot></slot
    ></span>`;
  }
  renderTouchTarget() {
    return y`<span class="touch"></span>`;
  }
  renderFocusRing() {
    return y`<md-focus-ring
      part="focus-ring"
      for=${this.href ? "link" : "button"}></md-focus-ring>`;
  }
  renderRipple() {
    const e = !this.href && (this.disabled || this.softDisabled);
    return y`<md-ripple
      for=${this.href ? "link" : R}
      ?disabled="${e}"></md-ripple>`;
  }
  connectedCallback() {
    this.flipIcon = wr(this, this.flipIconInRtl), super.connectedCallback();
  }
  handleClick(e) {
    if (!this.href && this.softDisabled) return e.stopImmediatePropagation(), void e.preventDefault();
  }
  async handleClickOnChild(e) {
    await 0, !this.toggle || this.disabled || this.softDisabled || e.defaultPrevented || (this.selected = !this.selected, this.dispatchEvent(new InputEvent("input", { bubbles: !0, composed: !0 })), this.dispatchEvent(new Event("change", { bubbles: !0 })));
  }
}
Es(W), W.formAssociated = !0, W.shadowRootOptions = { mode: "open", delegatesFocus: !0 }, h([g({ type: Boolean, reflect: !0 })], W.prototype, "disabled", void 0), h([g({ type: Boolean, attribute: "soft-disabled", reflect: !0 })], W.prototype, "softDisabled", void 0), h([g({ type: Boolean, attribute: "flip-icon-in-rtl" })], W.prototype, "flipIconInRtl", void 0), h([g()], W.prototype, "href", void 0), h([g()], W.prototype, "download", void 0), h([g()], W.prototype, "target", void 0), h([g({ attribute: "aria-label-selected" })], W.prototype, "ariaLabelSelected", void 0), h([g({ type: Boolean })], W.prototype, "toggle", void 0), h([g({ type: Boolean, reflect: !0 })], W.prototype, "selected", void 0), h([g()], W.prototype, "type", void 0), h([g({ reflect: !0 })], W.prototype, "value", void 0), h([M()], W.prototype, "flipIcon", void 0);
const na = N`:host{display:inline-flex;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);height:var(--_container-height);width:var(--_container-width);justify-content:center}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) max(0px,(48px - var(--_container-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){pointer-events:none}.icon-button{place-items:center;background:none;border:none;box-sizing:border-box;cursor:pointer;display:flex;place-content:center;outline:none;padding:0;position:relative;text-decoration:none;user-select:none;z-index:0;flex:1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.icon ::slotted(*){font-size:var(--_icon-size);height:var(--_icon-size);width:var(--_icon-size);font-weight:inherit}md-ripple{z-index:-1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.flip-icon .icon{transform:scaleX(-1)}.icon{display:inline-flex}.link{display:grid;height:100%;outline:none;place-items:center;position:absolute;width:100%}.touch{position:absolute;height:max(48px,100%);width:max(48px,100%)}:host([touch-target=none]) .touch{display:none}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1}}
`, la = N`:host{--_disabled-icon-color: var(--md-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-icon-button-disabled-icon-opacity, 0.38);--_icon-size: var(--md-icon-button-icon-size, 24px);--_selected-focus-icon-color: var(--md-icon-button-selected-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-icon-color: var(--md-icon-button-selected-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-color: var(--md-icon-button-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-opacity: var(--md-icon-button-selected-hover-state-layer-opacity, 0.08);--_selected-icon-color: var(--md-icon-button-selected-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-icon-color: var(--md-icon-button-selected-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-color: var(--md-icon-button-selected-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-opacity: var(--md-icon-button-selected-pressed-state-layer-opacity, 0.12);--_state-layer-height: var(--md-icon-button-state-layer-height, 40px);--_state-layer-shape: var(--md-icon-button-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));--_state-layer-width: var(--md-icon-button-state-layer-width, 40px);--_focus-icon-color: var(--md-icon-button-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-icon-color: var(--md-icon-button-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-icon-button-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-icon-button-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-icon-button-pressed-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-icon-button-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-icon-button-pressed-state-layer-opacity, 0.12);--_container-shape-start-start: 0;--_container-shape-start-end: 0;--_container-shape-end-end: 0;--_container-shape-end-start: 0;--_container-height: 0;--_container-width: 0;height:var(--_state-layer-height);width:var(--_state-layer-width)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_state-layer-height))/2) max(0px,(48px - var(--_state-layer-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_state-layer-shape);--md-focus-ring-shape-start-end: var(--_state-layer-shape);--md-focus-ring-shape-end-end: var(--_state-layer-shape);--md-focus-ring-shape-end-start: var(--_state-layer-shape)}.standard{background-color:rgba(0,0,0,0);color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.standard:hover{color:var(--_hover-icon-color)}.standard:focus{color:var(--_focus-icon-color)}.standard:active{color:var(--_pressed-icon-color)}.standard:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}md-ripple{border-radius:var(--_state-layer-shape)}.standard:is(:disabled,[aria-disabled=true]){opacity:var(--_disabled-icon-opacity)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_selected-pressed-icon-color)}.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_selected-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_selected-pressed-state-layer-opacity)}
`;
class Er extends W {
}
Er.styles = [na, la], customElements.define("ew-icon-button", Er);
const da = N`:host{--_active-indicator-color: var(--md-filled-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-text-field-active-indicator-height, 1px);--_caret-color: var(--md-filled-text-field-caret-color, var(--md-sys-color-primary, #6750a4));--_container-color: var(--md-filled-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_disabled-active-indicator-color: var(--md-filled-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-text-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-text-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-text-field-disabled-container-opacity, 0.04);--_disabled-input-text-color: var(--md-filled-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-input-text-opacity: var(--md-filled-text-field-disabled-input-text-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-text-field-disabled-label-text-opacity, 0.38);--_disabled-leading-icon-color: var(--md-filled-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-filled-text-field-disabled-leading-icon-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-text-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-icon-color: var(--md-filled-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-filled-text-field-disabled-trailing-icon-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-active-indicator-color: var(--md-filled-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-caret-color: var(--md-filled-text-field-error-focus-caret-color, var(--md-sys-color-error, #b3261e));--_error-focus-input-text-color: var(--md-filled-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-filled-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-icon-color: var(--md-filled-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-icon-color: var(--md-filled-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-input-text-color: var(--md-filled-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-icon-color: var(--md-filled-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-text-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-icon-color: var(--md-filled-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_error-input-text-color: var(--md-filled-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-label-text-color: var(--md-filled-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-icon-color: var(--md-filled-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-icon-color: var(--md-filled-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-text-field-focus-active-indicator-height, 3px);--_focus-input-text-color: var(--md-filled-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-filled-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-icon-color: var(--md-filled-text-field-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-text-field-hover-active-indicator-height, 1px);--_hover-input-text-color: var(--md-filled-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-text-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-icon-color: var(--md-filled-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-text-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-filled-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-color: var(--md-filled-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_input-text-font: var(--md-filled-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_input-text-line-height: var(--md-filled-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_input-text-placeholder-color: var(--md-filled-text-field-input-text-placeholder-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-prefix-color: var(--md-filled-text-field-input-text-prefix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-size: var(--md-filled-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_input-text-suffix-color: var(--md-filled-text-field-input-text-suffix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-weight: var(--md-filled-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_label-text-color: var(--md-filled-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-icon-color: var(--md-filled-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-icon-size: var(--md-filled-text-field-leading-icon-size, 24px);--_supporting-text-color: var(--md-filled-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-line-height: var(--md-filled-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-weight: var(--md-filled-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_trailing-icon-color: var(--md-filled-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-size: var(--md-filled-text-field-trailing-icon-size, 24px);--_container-shape-start-start: var(--md-filled-text-field-container-shape-start-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-text-field-container-shape-start-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-text-field-container-shape-end-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-text-field-container-shape-end-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_icon-input-space: var(--md-filled-text-field-icon-input-space, 16px);--_leading-space: var(--md-filled-text-field-leading-space, 16px);--_trailing-space: var(--md-filled-text-field-trailing-space, 16px);--_top-space: var(--md-filled-text-field-top-space, 16px);--_bottom-space: var(--md-filled-text-field-bottom-space, 16px);--_input-text-prefix-trailing-space: var(--md-filled-text-field-input-text-prefix-trailing-space, 2px);--_input-text-suffix-leading-space: var(--md-filled-text-field-input-text-suffix-leading-space, 2px);--_with-label-top-space: var(--md-filled-text-field-with-label-top-space, 8px);--_with-label-bottom-space: var(--md-filled-text-field-with-label-bottom-space, 8px);--_focus-caret-color: var(--md-filled-text-field-focus-caret-color, var(--md-sys-color-primary, #6750a4));--_with-leading-icon-leading-space: var(--md-filled-text-field-with-leading-icon-leading-space, 12px);--_with-trailing-icon-trailing-space: var(--md-filled-text-field-with-trailing-icon-trailing-space, 12px);--md-filled-field-active-indicator-color: var(--_active-indicator-color);--md-filled-field-active-indicator-height: var(--_active-indicator-height);--md-filled-field-bottom-space: var(--_bottom-space);--md-filled-field-container-color: var(--_container-color);--md-filled-field-container-shape-end-end: var(--_container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_container-shape-start-start);--md-filled-field-content-color: var(--_input-text-color);--md-filled-field-content-font: var(--_input-text-font);--md-filled-field-content-line-height: var(--_input-text-line-height);--md-filled-field-content-size: var(--_input-text-size);--md-filled-field-content-space: var(--_icon-input-space);--md-filled-field-content-weight: var(--_input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_error-active-indicator-color);--md-filled-field-error-content-color: var(--_error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_error-label-text-color);--md-filled-field-error-leading-content-color: var(--_error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_label-text-color);--md-filled-field-label-text-font: var(--_label-text-font);--md-filled-field-label-text-line-height: var(--_label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_label-text-populated-size);--md-filled-field-label-text-size: var(--_label-text-size);--md-filled-field-label-text-weight: var(--_label-text-weight);--md-filled-field-leading-content-color: var(--_leading-icon-color);--md-filled-field-leading-space: var(--_leading-space);--md-filled-field-supporting-text-color: var(--_supporting-text-color);--md-filled-field-supporting-text-font: var(--_supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_supporting-text-size);--md-filled-field-supporting-text-weight: var(--_supporting-text-weight);--md-filled-field-top-space: var(--_top-space);--md-filled-field-trailing-content-color: var(--_trailing-icon-color);--md-filled-field-trailing-space: var(--_trailing-space);--md-filled-field-with-label-bottom-space: var(--_with-label-bottom-space);--md-filled-field-with-label-top-space: var(--_with-label-top-space);--md-filled-field-with-leading-content-leading-space: var(--_with-leading-icon-leading-space);--md-filled-field-with-trailing-content-trailing-space: var(--_with-trailing-icon-trailing-space)}
`;
class z extends U {
  constructor() {
    super(...arguments), this.disabled = !1, this.error = !1, this.focused = !1, this.label = "", this.noAsterisk = !1, this.populated = !1, this.required = !1, this.resizable = !1, this.supportingText = "", this.errorText = "", this.count = -1, this.max = -1, this.hasStart = !1, this.hasEnd = !1, this.isAnimating = !1, this.refreshErrorAlert = !1, this.disableTransitions = !1;
  }
  get counterText() {
    const e = this.count ?? -1, t = this.max ?? -1;
    return e < 0 || t <= 0 ? "" : `${e} / ${t}`;
  }
  get supportingOrErrorText() {
    return this.error && this.errorText ? this.errorText : this.supportingText;
  }
  reannounceError() {
    this.refreshErrorAlert = !0;
  }
  update(e) {
    e.has("disabled") && e.get("disabled") !== void 0 && (this.disableTransitions = !0), this.disabled && this.focused && (e.set("focused", !0), this.focused = !1), this.animateLabelIfNeeded({ wasFocused: e.get("focused"), wasPopulated: e.get("populated") }), super.update(e);
  }
  render() {
    var e, t, r, s;
    const o = this.renderLabel(!0), a = this.renderLabel(!1), n = (e = this.renderOutline) === null || e === void 0 ? void 0 : e.call(this, o), d = { disabled: this.disabled, "disable-transitions": this.disableTransitions, error: this.error && !this.disabled, focused: this.focused, "with-start": this.hasStart, "with-end": this.hasEnd, populated: this.populated, resizable: this.resizable, required: this.required, "no-label": !this.label };
    return y`
      <div class="field ${ot(d)}">
        <div class="container-overflow">
          ${(t = this.renderBackground) === null || t === void 0 ? void 0 : t.call(this)}
          <slot name="container"></slot>
          ${(r = this.renderStateLayer) === null || r === void 0 ? void 0 : r.call(this)} ${(s = this.renderIndicator) === null || s === void 0 ? void 0 : s.call(this)} ${n}
          <div class="container">
            <div class="start">
              <slot name="start"></slot>
            </div>
            <div class="middle">
              <div class="label-wrapper">
                ${a} ${n ? R : o}
              </div>
              <div class="content">
                <slot></slot>
              </div>
            </div>
            <div class="end">
              <slot name="end"></slot>
            </div>
          </div>
        </div>
        ${this.renderSupportingText()}
      </div>
    `;
  }
  updated(e) {
    (e.has("supportingText") || e.has("errorText") || e.has("count") || e.has("max")) && this.updateSlottedAriaDescribedBy(), this.refreshErrorAlert && requestAnimationFrame((() => {
      this.refreshErrorAlert = !1;
    })), this.disableTransitions && requestAnimationFrame((() => {
      this.disableTransitions = !1;
    }));
  }
  renderSupportingText() {
    const { supportingOrErrorText: e, counterText: t } = this;
    if (!e && !t) return R;
    const r = y`<span>${e}</span>`, s = t ? y`<span class="counter">${t}</span>` : R, o = this.error && this.errorText && !this.refreshErrorAlert;
    return y`
      <div class="supporting-text" role=${o ? "alert" : R}>${r}${s}</div>
      <slot
        name="aria-describedby"
        @slotchange=${this.updateSlottedAriaDescribedBy}></slot>
    `;
  }
  updateSlottedAriaDescribedBy() {
    for (const e of this.slottedAriaDescribedBy) zr(y`${this.supportingOrErrorText} ${this.counterText}`, e), e.setAttribute("hidden", "");
  }
  renderLabel(e) {
    if (!this.label) return R;
    let t;
    t = e ? this.focused || this.populated || this.isAnimating : !this.focused && !this.populated && !this.isAnimating;
    const r = { hidden: !t, floating: e, resting: !e }, s = `${this.label}${this.required && !this.noAsterisk ? "*" : ""}`;
    return y`
      <span class="label ${ot(r)}" aria-hidden=${!t}
        >${s}</span
      >
    `;
  }
  animateLabelIfNeeded({ wasFocused: e, wasPopulated: t }) {
    var r, s, o;
    this.label && (e ?? (e = this.focused), t ?? (t = this.populated), (e || t) !== (this.focused || this.populated) && (this.isAnimating = !0, (r = this.labelAnimation) === null || r === void 0 || r.cancel(), this.labelAnimation = (s = this.floatingLabelEl) === null || s === void 0 ? void 0 : s.animate(this.getLabelKeyframes(), { duration: 150, easing: Xt.STANDARD }), (o = this.labelAnimation) === null || o === void 0 || o.addEventListener("finish", (() => {
      this.isAnimating = !1;
    }))));
  }
  getLabelKeyframes() {
    const { floatingLabelEl: e, restingLabelEl: t } = this;
    if (!e || !t) return [];
    const { x: r, y: s, height: o } = e.getBoundingClientRect(), { x: a, y: n, height: d } = t.getBoundingClientRect(), l = e.scrollWidth, c = t.scrollWidth, f = c / l, m = `translateX(${a - r}px) translateY(${n - s + Math.round((d - o * f) / 2)}px) scale(${f})`, p = "translateX(0) translateY(0) scale(1)", E = t.clientWidth, v = c > E ? E / f + "px" : "";
    return this.focused || this.populated ? [{ transform: m, width: v }, { transform: p, width: v }] : [{ transform: p, width: v }, { transform: m, width: v }];
  }
  getSurfacePositionClientRect() {
    return this.containerEl.getBoundingClientRect();
  }
}
h([g({ type: Boolean })], z.prototype, "disabled", void 0), h([g({ type: Boolean })], z.prototype, "error", void 0), h([g({ type: Boolean })], z.prototype, "focused", void 0), h([g()], z.prototype, "label", void 0), h([g({ type: Boolean, attribute: "no-asterisk" })], z.prototype, "noAsterisk", void 0), h([g({ type: Boolean })], z.prototype, "populated", void 0), h([g({ type: Boolean })], z.prototype, "required", void 0), h([g({ type: Boolean })], z.prototype, "resizable", void 0), h([g({ attribute: "supporting-text" })], z.prototype, "supportingText", void 0), h([g({ attribute: "error-text" })], z.prototype, "errorText", void 0), h([g({ type: Number })], z.prototype, "count", void 0), h([g({ type: Number })], z.prototype, "max", void 0), h([g({ type: Boolean, attribute: "has-start" })], z.prototype, "hasStart", void 0), h([g({ type: Boolean, attribute: "has-end" })], z.prototype, "hasEnd", void 0), h([At({ slot: "aria-describedby" })], z.prototype, "slottedAriaDescribedBy", void 0), h([M()], z.prototype, "isAnimating", void 0), h([M()], z.prototype, "refreshErrorAlert", void 0), h([M()], z.prototype, "disableTransitions", void 0), h([J(".label.floating")], z.prototype, "floatingLabelEl", void 0), h([J(".label.resting")], z.prototype, "restingLabelEl", void 0), h([J(".container")], z.prototype, "containerEl", void 0);
class ca extends z {
  renderBackground() {
    return y` <div class="background"></div> `;
  }
  renderStateLayer() {
    return y` <div class="state-layer"></div> `;
  }
  renderIndicator() {
    return y`<div class="active-indicator"></div>`;
  }
}
const ha = N`@layer styles{:host{--_active-indicator-color: var(--md-filled-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-field-active-indicator-height, 1px);--_bottom-space: var(--md-filled-field-bottom-space, 16px);--_container-color: var(--md-filled-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_content-color: var(--md-filled-field-content-color, var(--md-sys-color-on-surface, #1d1b20));--_content-font: var(--md-filled-field-content-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_content-line-height: var(--md-filled-field-content-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_content-size: var(--md-filled-field-content-size, var(--md-sys-typescale-body-large-size, 1rem));--_content-space: var(--md-filled-field-content-space, 16px);--_content-weight: var(--md-filled-field-content-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_disabled-active-indicator-color: var(--md-filled-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-field-disabled-container-opacity, 0.04);--_disabled-content-color: var(--md-filled-field-disabled-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-content-opacity: var(--md-filled-field-disabled-content-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-field-disabled-label-text-opacity, 0.38);--_disabled-leading-content-color: var(--md-filled-field-disabled-leading-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-content-opacity: var(--md-filled-field-disabled-leading-content-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-content-color: var(--md-filled-field-disabled-trailing-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-content-opacity: var(--md-filled-field-disabled-trailing-content-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-content-color: var(--md-filled-field-error-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-active-indicator-color: var(--md-filled-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-content-color: var(--md-filled-field-error-focus-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-label-text-color: var(--md-filled-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-content-color: var(--md-filled-field-error-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-content-color: var(--md-filled-field-error-focus-trailing-content-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-content-color: var(--md-filled-field-error-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-content-color: var(--md-filled-field-error-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-content-color: var(--md-filled-field-error-hover-trailing-content-color, var(--md-sys-color-on-error-container, #410e0b));--_error-label-text-color: var(--md-filled-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-content-color: var(--md-filled-field-error-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-content-color: var(--md-filled-field-error-trailing-content-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-field-focus-active-indicator-height, 3px);--_focus-content-color: var(--md-filled-field-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-content-color: var(--md-filled-field-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-content-color: var(--md-filled-field-focus-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-field-hover-active-indicator-height, 1px);--_hover-content-color: var(--md-filled-field-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-content-color: var(--md-filled-field-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-content-color: var(--md-filled-field-hover-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-filled-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-content-color: var(--md-filled-field-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-space: var(--md-filled-field-leading-space, 16px);--_supporting-text-color: var(--md-filled-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-leading-space: var(--md-filled-field-supporting-text-leading-space, 16px);--_supporting-text-line-height: var(--md-filled-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-top-space: var(--md-filled-field-supporting-text-top-space, 4px);--_supporting-text-trailing-space: var(--md-filled-field-supporting-text-trailing-space, 16px);--_supporting-text-weight: var(--md-filled-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_top-space: var(--md-filled-field-top-space, 16px);--_trailing-content-color: var(--md-filled-field-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-space: var(--md-filled-field-trailing-space, 16px);--_with-label-bottom-space: var(--md-filled-field-with-label-bottom-space, 8px);--_with-label-top-space: var(--md-filled-field-with-label-top-space, 8px);--_with-leading-content-leading-space: var(--md-filled-field-with-leading-content-leading-space, 12px);--_with-trailing-content-trailing-space: var(--md-filled-field-with-trailing-content-trailing-space, 12px);--_container-shape-start-start: var(--md-filled-field-container-shape-start-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-field-container-shape-start-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-field-container-shape-end-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-field-container-shape-end-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)))}.background,.state-layer{border-radius:inherit;inset:0;pointer-events:none;position:absolute}.background{background:var(--_container-color)}.state-layer{visibility:hidden}.field:not(.disabled):hover .state-layer{visibility:visible}.label.floating{position:absolute;top:var(--_with-label-top-space)}.field:not(.with-start) .label-wrapper{margin-inline-start:var(--_leading-space)}.field:not(.with-end) .label-wrapper{margin-inline-end:var(--_trailing-space)}.active-indicator{inset:auto 0 0 0;pointer-events:none;position:absolute;width:100%;z-index:1}.active-indicator::before,.active-indicator::after{border-bottom:var(--_active-indicator-height) solid var(--_active-indicator-color);inset:auto 0 0 0;content:"";position:absolute;width:100%}.active-indicator::after{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .active-indicator::after{opacity:1}.field:not(.with-start) .content ::slotted(*){padding-inline-start:var(--_leading-space)}.field:not(.with-end) .content ::slotted(*){padding-inline-end:var(--_trailing-space)}.field:not(.no-label) .content ::slotted(:not(textarea)){padding-bottom:var(--_with-label-bottom-space);padding-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}.field:not(.no-label) .content ::slotted(textarea){margin-bottom:var(--_with-label-bottom-space);margin-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}:hover .active-indicator::before{border-bottom-color:var(--_hover-active-indicator-color);border-bottom-width:var(--_hover-active-indicator-height)}.active-indicator::after{border-bottom-color:var(--_focus-active-indicator-color);border-bottom-width:var(--_focus-active-indicator-height)}:hover .state-layer{background:var(--_hover-state-layer-color);opacity:var(--_hover-state-layer-opacity)}.disabled .active-indicator::before{border-bottom-color:var(--_disabled-active-indicator-color);border-bottom-width:var(--_disabled-active-indicator-height);opacity:var(--_disabled-active-indicator-opacity)}.disabled .background{background:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.error .active-indicator::before{border-bottom-color:var(--_error-active-indicator-color)}.error:hover .active-indicator::before{border-bottom-color:var(--_error-hover-active-indicator-color)}.error:hover .state-layer{background:var(--_error-hover-state-layer-color);opacity:var(--_error-hover-state-layer-opacity)}.error .active-indicator::after{border-bottom-color:var(--_error-focus-active-indicator-color)}.resizable .container{bottom:var(--_focus-active-indicator-height);clip-path:inset(var(--_focus-active-indicator-height) 0 0 0)}.resizable .container>*{top:var(--_focus-active-indicator-height)}}@layer hcm{@media(forced-colors: active){.disabled .active-indicator::before{border-color:GrayText;opacity:1}}}
`, pa = N`:host{display:inline-flex;resize:both}.field{display:flex;flex:1;flex-direction:column;writing-mode:horizontal-tb;max-width:100%}.container-overflow{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-end-radius:var(--_container-shape-end-end);border-end-start-radius:var(--_container-shape-end-start);display:flex;height:100%;position:relative}.container{align-items:center;border-radius:inherit;display:flex;flex:1;max-height:100%;min-height:100%;min-width:min-content;position:relative}.field,.container-overflow{resize:inherit}.resizable:not(.disabled) .container{resize:inherit;overflow:hidden}.disabled{pointer-events:none}slot[name=container]{border-radius:inherit}slot[name=container]::slotted(*){border-radius:inherit;inset:0;pointer-events:none;position:absolute}@layer styles{.start,.middle,.end{display:flex;box-sizing:border-box;height:100%;position:relative}.start{color:var(--_leading-content-color)}.end{color:var(--_trailing-content-color)}.start,.end{align-items:center;justify-content:center}.with-start .start{margin-inline:var(--_with-leading-content-leading-space) var(--_content-space)}.with-end .end{margin-inline:var(--_content-space) var(--_with-trailing-content-trailing-space)}.middle{align-items:stretch;align-self:baseline;flex:1}.content{color:var(--_content-color);display:flex;flex:1;opacity:0;transition:opacity 83ms cubic-bezier(0.2, 0, 0, 1)}.no-label .content,.focused .content,.populated .content{opacity:1;transition-delay:67ms}:is(.disabled,.disable-transitions) .content{transition:none}.content ::slotted(*){all:unset;color:currentColor;font-family:var(--_content-font);font-size:var(--_content-size);line-height:var(--_content-line-height);font-weight:var(--_content-weight);width:100%;overflow-wrap:revert;white-space:revert}.content ::slotted(:not(textarea)){padding-top:var(--_top-space);padding-bottom:var(--_bottom-space)}.content ::slotted(textarea){margin-top:var(--_top-space);margin-bottom:var(--_bottom-space)}:hover .content{color:var(--_hover-content-color)}:hover .start{color:var(--_hover-leading-content-color)}:hover .end{color:var(--_hover-trailing-content-color)}.focused .content{color:var(--_focus-content-color)}.focused .start{color:var(--_focus-leading-content-color)}.focused .end{color:var(--_focus-trailing-content-color)}.disabled .content{color:var(--_disabled-content-color)}.disabled.no-label .content,.disabled.focused .content,.disabled.populated .content{opacity:var(--_disabled-content-opacity)}.disabled .start{color:var(--_disabled-leading-content-color);opacity:var(--_disabled-leading-content-opacity)}.disabled .end{color:var(--_disabled-trailing-content-color);opacity:var(--_disabled-trailing-content-opacity)}.error .content{color:var(--_error-content-color)}.error .start{color:var(--_error-leading-content-color)}.error .end{color:var(--_error-trailing-content-color)}.error:hover .content{color:var(--_error-hover-content-color)}.error:hover .start{color:var(--_error-hover-leading-content-color)}.error:hover .end{color:var(--_error-hover-trailing-content-color)}.error.focused .content{color:var(--_error-focus-content-color)}.error.focused .start{color:var(--_error-focus-leading-content-color)}.error.focused .end{color:var(--_error-focus-trailing-content-color)}}@layer hcm{@media(forced-colors: active){.disabled :is(.start,.content,.end){color:GrayText;opacity:1}}}@layer styles{.label{box-sizing:border-box;color:var(--_label-text-color);overflow:hidden;max-width:100%;text-overflow:ellipsis;white-space:nowrap;z-index:1;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);width:min-content}.label-wrapper{inset:0;pointer-events:none;position:absolute}.label.resting{position:absolute;top:var(--_top-space)}.label.floating{font-size:var(--_label-text-populated-size);line-height:var(--_label-text-populated-line-height);transform-origin:top left}.label.hidden{opacity:0}.no-label .label{display:none}.label-wrapper{inset:0;position:absolute;text-align:initial}:hover .label{color:var(--_hover-label-text-color)}.focused .label{color:var(--_focus-label-text-color)}.disabled .label{color:var(--_disabled-label-text-color)}.disabled .label:not(.hidden){opacity:var(--_disabled-label-text-opacity)}.error .label{color:var(--_error-label-text-color)}.error:hover .label{color:var(--_error-hover-label-text-color)}.error.focused .label{color:var(--_error-focus-label-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .label:not(.hidden){color:GrayText;opacity:1}}}@layer styles{.supporting-text{color:var(--_supporting-text-color);display:flex;font-family:var(--_supporting-text-font);font-size:var(--_supporting-text-size);line-height:var(--_supporting-text-line-height);font-weight:var(--_supporting-text-weight);gap:16px;justify-content:space-between;padding-inline-start:var(--_supporting-text-leading-space);padding-inline-end:var(--_supporting-text-trailing-space);padding-top:var(--_supporting-text-top-space)}.supporting-text :nth-child(2){flex-shrink:0}:hover .supporting-text{color:var(--_hover-supporting-text-color)}.focus .supporting-text{color:var(--_focus-supporting-text-color)}.disabled .supporting-text{color:var(--_disabled-supporting-text-color);opacity:var(--_disabled-supporting-text-opacity)}.error .supporting-text{color:var(--_error-supporting-text-color)}.error:hover .supporting-text{color:var(--_error-hover-supporting-text-color)}.error.focus .supporting-text{color:var(--_error-focus-supporting-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .supporting-text{color:GrayText;opacity:1}}}
`;
let mi = class extends ca {
};
mi.styles = [pa, ha], mi = h([Ge("md-filled-field")], mi);
const ua = {}, Sr = Br(class extends Ur {
  constructor(i) {
    if (super(i), i.type !== Ct.PROPERTY && i.type !== Ct.ATTRIBUTE && i.type !== Ct.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!((e) => e.strings === void 0)(i)) throw Error("`live` bindings can only contain a single expression");
  }
  render(i) {
    return i;
  }
  update(i, [e]) {
    if (e === Jt || e === R) return e;
    const t = i.element, r = i.name;
    if (i.type === Ct.PROPERTY) {
      if (e === t[r]) return Jt;
    } else if (i.type === Ct.BOOLEAN_ATTRIBUTE) {
      if (!!e === t.hasAttribute(r)) return Jt;
    } else if (i.type === Ct.ATTRIBUTE && t.getAttribute(r) === e + "") return Jt;
    return ((s, o = ua) => {
      s._$AH = o;
    })(i), e;
  }
}), ms = "important", fa = " !" + ms, He = Br(class extends Ur {
  constructor(i) {
    var e;
    if (super(i), i.type !== Ct.ATTRIBUTE || i.name !== "style" || ((e = i.strings) === null || e === void 0 ? void 0 : e.length) > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
  }
  render(i) {
    return Object.keys(i).reduce(((e, t) => {
      const r = i[t];
      return r == null ? e : e + `${t = t.includes("-") ? t : t.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${r};`;
    }), "");
  }
  update(i, [e]) {
    const { style: t } = i.element;
    if (this.ft === void 0) return this.ft = new Set(Object.keys(e)), this.render(e);
    for (const r of this.ft) e[r] == null && (this.ft.delete(r), r.includes("-") ? t.removeProperty(r) : t[r] = null);
    for (const r in e) {
      const s = e[r];
      if (s != null) {
        this.ft.add(r);
        const o = typeof s == "string" && s.endsWith(fa);
        r.includes("-") || o ? t.setProperty(r, o ? s.slice(0, -11) : s, o ? ms : "") : t[r] = s;
      }
    }
    return Jt;
  }
}), ma = { fromAttribute: (i) => i ?? "", toAttribute: (i) => i || null }, qe = /* @__PURE__ */ Symbol("onReportValidity"), Re = /* @__PURE__ */ Symbol("privateCleanupFormListeners"), Ie = /* @__PURE__ */ Symbol("privateDoNotReportInvalid"), Ce = /* @__PURE__ */ Symbol("privateIsSelfReportingValidity"), Te = /* @__PURE__ */ Symbol("privateCallOnReportValidity");
function vs(i) {
  var e, t, r;
  class s extends i {
    constructor(...a) {
      super(...a), this[e] = new AbortController(), this[t] = !1, this[r] = !1, this.addEventListener("invalid", ((n) => {
        !this[Ie] && n.isTrusted && this.addEventListener("invalid", (() => {
          this[Te](n);
        }), { once: !0 });
      }), { capture: !0 });
    }
    checkValidity() {
      this[Ie] = !0;
      const a = super.checkValidity();
      return this[Ie] = !1, a;
    }
    reportValidity() {
      this[Ce] = !0;
      const a = super.reportValidity();
      return a && this[Te](null), this[Ce] = !1, a;
    }
    [(e = Re, t = Ie, r = Ce, Te)](a) {
      const n = a?.defaultPrevented;
      n || (this[qe](a), !n && a?.defaultPrevented && (this[Ce] || (function(d, l) {
        if (!d) return !0;
        let c;
        for (const f of d.elements) if (f.matches(":invalid")) {
          c = f;
          break;
        }
        return c === l;
      })(this[tt].form, this)) && this.focus());
    }
    [qe](a) {
      throw new Error("Implement [onReportValidity]");
    }
    formAssociatedCallback(a) {
      super.formAssociatedCallback && super.formAssociatedCallback(a), this[Re].abort(), a && (this[Re] = new AbortController(), (function(n, d, l, c) {
        const f = (function(v) {
          if (!vi.has(v)) {
            const _ = new EventTarget();
            vi.set(v, _);
            for (const k of ["reportValidity", "requestSubmit"]) {
              const w = v[k];
              v[k] = function() {
                _.dispatchEvent(new Event("before"));
                const u = Reflect.apply(w, this, arguments);
                return _.dispatchEvent(new Event("after")), u;
              };
            }
          }
          return vi.get(v);
        })(d);
        let m, p = !1, E = !1;
        f.addEventListener("before", (() => {
          E = !0, m = new AbortController(), p = !1, n.addEventListener("invalid", (() => {
            p = !0;
          }), { signal: m.signal });
        }), { signal: c }), f.addEventListener("after", (() => {
          var v;
          E = !1, (v = m) === null || v === void 0 || v.abort(), p || l();
        }), { signal: c }), d.addEventListener("submit", (() => {
          E || l();
        }), { signal: c });
      })(this, a, (() => {
        this[Te](null);
      }), this[Re].signal));
    }
  }
  return s;
}
const vi = /* @__PURE__ */ new WeakMap();
class va extends Oi {
  computeValidity({ state: e, renderedControl: t }) {
    let r = t;
    jt(e) && !r ? (r = this.inputControl || document.createElement("input"), this.inputControl = r) : r || (r = this.textAreaControl || document.createElement("textarea"), this.textAreaControl = r);
    const s = jt(e) ? r : null;
    if (s && (s.type = e.type), r.value !== e.value && (r.value = e.value), r.required = e.required, s) {
      const o = e;
      o.pattern ? s.pattern = o.pattern : s.removeAttribute("pattern"), o.min ? s.min = o.min : s.removeAttribute("min"), o.max ? s.max = o.max : s.removeAttribute("max"), o.step ? s.step = o.step : s.removeAttribute("step");
    }
    return (e.minLength ?? -1) > -1 ? r.setAttribute("minlength", String(e.minLength)) : r.removeAttribute("minlength"), (e.maxLength ?? -1) > -1 ? r.setAttribute("maxlength", String(e.maxLength)) : r.removeAttribute("maxlength"), { validity: r.validity, validationMessage: r.validationMessage };
  }
  equals({ state: e }, { state: t }) {
    const r = e.type === t.type && e.value === t.value && e.required === t.required && e.minLength === t.minLength && e.maxLength === t.maxLength;
    return jt(e) && jt(t) ? r && e.pattern === t.pattern && e.min === t.min && e.max === t.max && e.step === t.step : r;
  }
  copy({ state: e }) {
    return { state: jt(e) ? this.copyInput(e) : this.copyTextArea(e), renderedControl: null };
  }
  copyInput(e) {
    const { type: t, pattern: r, min: s, max: o, step: a } = e;
    return { ...this.copySharedState(e), type: t, pattern: r, min: s, max: o, step: a };
  }
  copyTextArea(e) {
    return { ...this.copySharedState(e), type: e.type };
  }
  copySharedState({ value: e, required: t, minLength: r, maxLength: s }) {
    return { value: e, required: t, minLength: r, maxLength: s };
  }
}
function jt(i) {
  return i.type !== "textarea";
}
const ga = Ft(vs($i(Li(We(U)))));
class $ extends ga {
  constructor() {
    super(...arguments), this.error = !1, this.errorText = "", this.label = "", this.noAsterisk = !1, this.required = !1, this.value = "", this.prefixText = "", this.suffixText = "", this.hasLeadingIcon = !1, this.hasTrailingIcon = !1, this.supportingText = "", this.textDirection = "", this.rows = 2, this.cols = 20, this.inputMode = "", this.max = "", this.maxLength = -1, this.min = "", this.minLength = -1, this.noSpinner = !1, this.pattern = "", this.placeholder = "", this.readOnly = !1, this.multiple = !1, this.step = "", this.type = "text", this.autocomplete = "", this.dirty = !1, this.focused = !1, this.nativeError = !1, this.nativeErrorText = "";
  }
  get selectionDirection() {
    return this.getInputOrTextarea().selectionDirection;
  }
  set selectionDirection(e) {
    this.getInputOrTextarea().selectionDirection = e;
  }
  get selectionEnd() {
    return this.getInputOrTextarea().selectionEnd;
  }
  set selectionEnd(e) {
    this.getInputOrTextarea().selectionEnd = e;
  }
  get selectionStart() {
    return this.getInputOrTextarea().selectionStart;
  }
  set selectionStart(e) {
    this.getInputOrTextarea().selectionStart = e;
  }
  get valueAsNumber() {
    const e = this.getInput();
    return e ? e.valueAsNumber : NaN;
  }
  set valueAsNumber(e) {
    const t = this.getInput();
    t && (t.valueAsNumber = e, this.value = t.value);
  }
  get valueAsDate() {
    const e = this.getInput();
    return e ? e.valueAsDate : null;
  }
  set valueAsDate(e) {
    const t = this.getInput();
    t && (t.valueAsDate = e, this.value = t.value);
  }
  get hasError() {
    return this.error || this.nativeError;
  }
  select() {
    this.getInputOrTextarea().select();
  }
  setRangeText(...e) {
    this.getInputOrTextarea().setRangeText(...e), this.value = this.getInputOrTextarea().value;
  }
  setSelectionRange(e, t, r) {
    this.getInputOrTextarea().setSelectionRange(e, t, r);
  }
  showPicker() {
    const e = this.getInput();
    e && e.showPicker();
  }
  stepDown(e) {
    const t = this.getInput();
    t && (t.stepDown(e), this.value = t.value);
  }
  stepUp(e) {
    const t = this.getInput();
    t && (t.stepUp(e), this.value = t.value);
  }
  reset() {
    this.dirty = !1, this.value = this.getAttribute("value") ?? "", this.nativeError = !1, this.nativeErrorText = "";
  }
  attributeChangedCallback(e, t, r) {
    e === "value" && this.dirty || super.attributeChangedCallback(e, t, r);
  }
  render() {
    const e = { disabled: this.disabled, error: !this.disabled && this.hasError, textarea: this.type === "textarea", "no-spinner": this.noSpinner };
    return y`
      <span class="text-field ${ot(e)}">
        ${this.renderField()}
      </span>
    `;
  }
  updated(e) {
    const t = this.getInputOrTextarea().value;
    this.value !== t && (this.value = t);
  }
  renderField() {
    return Ze`<${this.fieldTag}
      class="field"
      count=${this.value.length}
      ?disabled=${this.disabled}
      ?error=${this.hasError}
      error-text=${this.getErrorText()}
      ?focused=${this.focused}
      ?has-end=${this.hasTrailingIcon}
      ?has-start=${this.hasLeadingIcon}
      label=${this.label}
      ?no-asterisk=${this.noAsterisk}
      max=${this.maxLength}
      ?populated=${!!this.value}
      ?required=${this.required}
      ?resizable=${this.type === "textarea"}
      supporting-text=${this.supportingText}
    >
      ${this.renderLeadingIcon()}
      ${this.renderInputOrTextarea()}
      ${this.renderTrailingIcon()}
      <div id="description" slot="aria-describedby"></div>
      <slot name="container" slot="container"></slot>
    </${this.fieldTag}>`;
  }
  renderLeadingIcon() {
    return y`
      <span class="icon leading" slot="start">
        <slot name="leading-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderTrailingIcon() {
    return y`
      <span class="icon trailing" slot="end">
        <slot name="trailing-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderInputOrTextarea() {
    const e = { direction: this.textDirection }, t = this.ariaLabel || this.label || R, r = this.autocomplete, s = (this.maxLength ?? -1) > -1, o = (this.minLength ?? -1) > -1;
    if (this.type === "textarea") return y`
        <textarea
          class="input"
          style=${He(e)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${t}
          autocomplete=${r || R}
          name=${this.name || R}
          ?disabled=${this.disabled}
          maxlength=${s ? this.maxLength : R}
          minlength=${o ? this.minLength : R}
          placeholder=${this.placeholder || R}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          rows=${this.rows}
          cols=${this.cols}
          .value=${Sr(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent}></textarea>
      `;
    const a = this.renderPrefix(), n = this.renderSuffix(), d = this.inputMode;
    return y`
      <div class="input-wrapper">
        ${a}
        <input
          class="input"
          style=${He(e)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${t}
          autocomplete=${r || R}
          name=${this.name || R}
          ?disabled=${this.disabled}
          inputmode=${d || R}
          max=${this.max || R}
          maxlength=${s ? this.maxLength : R}
          min=${this.min || R}
          minlength=${o ? this.minLength : R}
          pattern=${this.pattern || R}
          placeholder=${this.placeholder || R}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          ?multiple=${this.multiple}
          step=${this.step || R}
          type=${this.type}
          .value=${Sr(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent} />
        ${n}
      </div>
    `;
  }
  renderPrefix() {
    return this.renderAffix(this.prefixText, !1);
  }
  renderSuffix() {
    return this.renderAffix(this.suffixText, !0);
  }
  renderAffix(e, t) {
    return e ? y`<span class="${ot({ suffix: t, prefix: !t })}">${e}</span>` : R;
  }
  getErrorText() {
    return this.error ? this.errorText : this.nativeErrorText;
  }
  handleFocusChange() {
    var e;
    this.focused = ((e = this.inputOrTextarea) === null || e === void 0 ? void 0 : e.matches(":focus")) ?? !1;
  }
  handleInput(e) {
    this.dirty = !0, this.value = e.target.value;
  }
  redispatchEvent(e) {
    Ci(this, e);
  }
  getInputOrTextarea() {
    return this.inputOrTextarea || (this.connectedCallback(), this.scheduleUpdate()), this.isUpdatePending && this.scheduleUpdate(), this.inputOrTextarea;
  }
  getInput() {
    return this.type === "textarea" ? null : this.getInputOrTextarea();
  }
  handleIconChange() {
    this.hasLeadingIcon = this.leadingIcons.length > 0, this.hasTrailingIcon = this.trailingIcons.length > 0;
  }
  [Nt]() {
    return this.value;
  }
  formResetCallback() {
    this.reset();
  }
  formStateRestoreCallback(e) {
    this.value = e;
  }
  focus() {
    this.getInputOrTextarea().focus();
  }
  [he]() {
    return new va((() => ({ state: this, renderedControl: this.inputOrTextarea })));
  }
  [pe]() {
    return this.inputOrTextarea;
  }
  [qe](e) {
    e?.preventDefault();
    const t = this.getErrorText();
    var r;
    this.nativeError = !!e, this.nativeErrorText = this.validationMessage, t === this.getErrorText() && ((r = this.field) === null || r === void 0 || r.reannounceError());
  }
}
$.shadowRootOptions = { ...U.shadowRootOptions, delegatesFocus: !0 }, h([g({ type: Boolean, reflect: !0 })], $.prototype, "error", void 0), h([g({ attribute: "error-text" })], $.prototype, "errorText", void 0), h([g()], $.prototype, "label", void 0), h([g({ type: Boolean, attribute: "no-asterisk" })], $.prototype, "noAsterisk", void 0), h([g({ type: Boolean, reflect: !0 })], $.prototype, "required", void 0), h([g()], $.prototype, "value", void 0), h([g({ attribute: "prefix-text" })], $.prototype, "prefixText", void 0), h([g({ attribute: "suffix-text" })], $.prototype, "suffixText", void 0), h([g({ type: Boolean, attribute: "has-leading-icon" })], $.prototype, "hasLeadingIcon", void 0), h([g({ type: Boolean, attribute: "has-trailing-icon" })], $.prototype, "hasTrailingIcon", void 0), h([g({ attribute: "supporting-text" })], $.prototype, "supportingText", void 0), h([g({ attribute: "text-direction" })], $.prototype, "textDirection", void 0), h([g({ type: Number })], $.prototype, "rows", void 0), h([g({ type: Number })], $.prototype, "cols", void 0), h([g({ reflect: !0 })], $.prototype, "inputMode", void 0), h([g()], $.prototype, "max", void 0), h([g({ type: Number })], $.prototype, "maxLength", void 0), h([g()], $.prototype, "min", void 0), h([g({ type: Number })], $.prototype, "minLength", void 0), h([g({ type: Boolean, attribute: "no-spinner" })], $.prototype, "noSpinner", void 0), h([g()], $.prototype, "pattern", void 0), h([g({ reflect: !0, converter: ma })], $.prototype, "placeholder", void 0), h([g({ type: Boolean, reflect: !0 })], $.prototype, "readOnly", void 0), h([g({ type: Boolean, reflect: !0 })], $.prototype, "multiple", void 0), h([g()], $.prototype, "step", void 0), h([g({ reflect: !0 })], $.prototype, "type", void 0), h([g({ reflect: !0 })], $.prototype, "autocomplete", void 0), h([M()], $.prototype, "dirty", void 0), h([M()], $.prototype, "focused", void 0), h([M()], $.prototype, "nativeError", void 0), h([M()], $.prototype, "nativeErrorText", void 0), h([J(".input")], $.prototype, "inputOrTextarea", void 0), h([J(".field")], $.prototype, "field", void 0), h([At({ slot: "leading-icon" })], $.prototype, "leadingIcons", void 0), h([At({ slot: "trailing-icon" })], $.prototype, "trailingIcons", void 0);
class _a extends $ {
  constructor() {
    super(...arguments), this.fieldTag = wt`md-filled-field`;
  }
}
const ba = N`:host{display:inline-flex;outline:none;resize:both;text-align:start;-webkit-tap-highlight-color:rgba(0,0,0,0)}.text-field,.field{width:100%}.text-field{display:inline-flex}.field{cursor:text}.disabled .field{cursor:default}.text-field,.textarea .field{resize:inherit}slot[name=container]{border-radius:inherit}.icon{color:currentColor;display:flex;align-items:center;justify-content:center;fill:currentColor;position:relative}.icon ::slotted(*){display:flex;position:absolute}[has-start] .icon.leading{font-size:var(--_leading-icon-size);height:var(--_leading-icon-size);width:var(--_leading-icon-size)}[has-end] .icon.trailing{font-size:var(--_trailing-icon-size);height:var(--_trailing-icon-size);width:var(--_trailing-icon-size)}.input-wrapper{display:flex}.input-wrapper>*{all:inherit;padding:0}.input{caret-color:var(--_caret-color);overflow-x:hidden;text-align:inherit}.input::placeholder{color:currentColor;opacity:1}.input::-webkit-calendar-picker-indicator{display:none}.input::-webkit-search-decoration,.input::-webkit-search-cancel-button{display:none}@media(forced-colors: active){.input{background:none}}.no-spinner .input::-webkit-inner-spin-button,.no-spinner .input::-webkit-outer-spin-button{display:none}.no-spinner .input[type=number]{-moz-appearance:textfield}:focus-within .input{caret-color:var(--_focus-caret-color)}.error:focus-within .input{caret-color:var(--_error-focus-caret-color)}.text-field:not(.disabled) .prefix{color:var(--_input-text-prefix-color)}.text-field:not(.disabled) .suffix{color:var(--_input-text-suffix-color)}.text-field:not(.disabled) .input::placeholder{color:var(--_input-text-placeholder-color)}.prefix,.suffix{text-wrap:nowrap;width:min-content}.prefix{padding-inline-end:var(--_input-text-prefix-trailing-space)}.suffix{padding-inline-start:var(--_input-text-suffix-leading-space)}
`;
class kr extends _a {
  constructor() {
    super(...arguments), this.fieldTag = wt`md-filled-field`;
  }
}
kr.styles = [ba, da], customElements.define("ew-filled-text-field", kr);
class ya extends U {
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  render() {
    return y`<span class="shadow"></span>`;
  }
}
const xa = N`:host,.shadow,.shadow::before,.shadow::after{border-radius:inherit;inset:0;position:absolute;transition-duration:inherit;transition-property:inherit;transition-timing-function:inherit}:host{display:flex;pointer-events:none;transition-property:box-shadow,opacity}.shadow::before,.shadow::after{content:"";transition-property:box-shadow,opacity;--_level: var(--md-elevation-level, 0);--_shadow-color: var(--md-elevation-shadow-color, var(--md-sys-color-shadow, #000))}.shadow::before{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 3,1) + 2*clamp(0,var(--_level) - 4,1))) calc(1px*(2*clamp(0,var(--_level),1) + clamp(0,var(--_level) - 2,1) + clamp(0,var(--_level) - 4,1))) 0px var(--_shadow-color);opacity:.3}.shadow::after{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 1,1) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(3*clamp(0,var(--_level),2) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(clamp(0,var(--_level),4) + 2*clamp(0,var(--_level) - 4,1))) var(--_shadow-color);opacity:.15}
`;
let gi = class extends ya {
};
gi.styles = [xa], gi = h([Ge("md-elevation")], gi);
const Ar = function(i, e) {
  return new CustomEvent("close-menu", { bubbles: !0, composed: !0, detail: { initiator: i, reason: e, itemPath: [i] } });
}, Ai = { SPACE: "Space", ENTER: "Enter" }, wa = "click-selection", Ea = "keydown", Sa = { ESCAPE: "Escape", SPACE: Ai.SPACE, ENTER: Ai.ENTER };
function gs(i) {
  return Object.values(Sa).some(((e) => e === i));
}
function Ri(i, e) {
  const t = new Event("md-contains", { bubbles: !0, composed: !0 });
  let r = [];
  const s = (o) => {
    r = o.composedPath();
  };
  return e.addEventListener("md-contains", s), i.dispatchEvent(t), e.removeEventListener("md-contains", s), r.length > 0;
}
const Fe = "none", ka = "list-root", Ii = "first-item", _s = "last-item", Aa = "end-start", Ra = "start-start";
class Ia {
  constructor(e, t) {
    this.host = e, this.getProperties = t, this.surfaceStylesInternal = { display: "none" }, this.lastValues = { isOpen: !1 }, this.host.addController(this);
  }
  get surfaceStyles() {
    return this.surfaceStylesInternal;
  }
  async position() {
    const { surfaceEl: e, anchorEl: t, anchorCorner: r, surfaceCorner: s, positioning: o, xOffset: a, yOffset: n, disableBlockFlip: d, disableInlineFlip: l, repositionStrategy: c } = this.getProperties(), f = r.toLowerCase().trim(), m = s.toLowerCase().trim();
    if (!e || !t) return;
    const p = window.innerWidth, E = window.innerHeight, v = document.createElement("div");
    v.style.opacity = "0", v.style.position = "fixed", v.style.display = "block", v.style.inset = "0", document.body.appendChild(v);
    const _ = v.getBoundingClientRect();
    v.remove();
    const k = window.innerHeight - _.bottom, w = window.innerWidth - _.right;
    this.surfaceStylesInternal = { display: "block", opacity: "0" }, this.host.requestUpdate(), await this.host.updateComplete, e.popover && e.isConnected && e.showPopover();
    const u = e.getSurfacePositionClientRect ? e.getSurfacePositionClientRect() : e.getBoundingClientRect(), x = t.getSurfacePositionClientRect ? t.getSurfacePositionClientRect() : t.getBoundingClientRect(), [C, b] = m.split("-"), [T, A] = f.split("-"), S = getComputedStyle(e).direction === "ltr";
    let { blockInset: I, blockOutOfBoundsCorrection: D, surfaceBlockProperty: K } = this.calculateBlock({ surfaceRect: u, anchorRect: x, anchorBlock: T, surfaceBlock: C, yOffset: n, positioning: o, windowInnerHeight: E, blockScrollbarHeight: k });
    if (D && !d) {
      const Xe = C === "start" ? "end" : "start", Je = T === "start" ? "end" : "start", pt = this.calculateBlock({ surfaceRect: u, anchorRect: x, anchorBlock: Je, surfaceBlock: Xe, yOffset: n, positioning: o, windowInnerHeight: E, blockScrollbarHeight: k });
      D > pt.blockOutOfBoundsCorrection && (I = pt.blockInset, D = pt.blockOutOfBoundsCorrection, K = pt.surfaceBlockProperty);
    }
    let { inlineInset: bt, inlineOutOfBoundsCorrection: rt, surfaceInlineProperty: It } = this.calculateInline({ surfaceRect: u, anchorRect: x, anchorInline: A, surfaceInline: b, xOffset: a, positioning: o, isLTR: S, windowInnerWidth: p, inlineScrollbarWidth: w });
    if (rt && !l) {
      const Xe = b === "start" ? "end" : "start", Je = A === "start" ? "end" : "start", pt = this.calculateInline({ surfaceRect: u, anchorRect: x, anchorInline: Je, surfaceInline: Xe, xOffset: a, positioning: o, isLTR: S, windowInnerWidth: p, inlineScrollbarWidth: w });
      Math.abs(rt) > Math.abs(pt.inlineOutOfBoundsCorrection) && (bt = pt.inlineInset, rt = pt.inlineOutOfBoundsCorrection, It = pt.surfaceInlineProperty);
    }
    c === "move" && (I -= D, bt -= rt), this.surfaceStylesInternal = { display: "block", opacity: "1", [K]: `${I}px`, [It]: `${bt}px` }, c === "resize" && (D && (this.surfaceStylesInternal.height = u.height - D + "px"), rt && (this.surfaceStylesInternal.width = u.width - rt + "px")), this.host.requestUpdate();
  }
  calculateBlock(e) {
    const { surfaceRect: t, anchorRect: r, anchorBlock: s, surfaceBlock: o, yOffset: a, positioning: n, windowInnerHeight: d, blockScrollbarHeight: l } = e, c = n === "fixed" || n === "document" ? 1 : 0, f = n === "document" ? 1 : 0, m = o === "start" ? 1 : 0, p = o === "end" ? 1 : 0, E = (s !== o ? 1 : 0) * r.height + a, v = m * r.top + p * (d - r.bottom - l);
    return { blockInset: c * v + f * (m * window.scrollY - p * window.scrollY) + E, blockOutOfBoundsCorrection: Math.abs(Math.min(0, d - v - E - t.height)), surfaceBlockProperty: o === "start" ? "inset-block-start" : "inset-block-end" };
  }
  calculateInline(e) {
    const { isLTR: t, surfaceInline: r, anchorInline: s, anchorRect: o, surfaceRect: a, xOffset: n, positioning: d, windowInnerWidth: l, inlineScrollbarWidth: c } = e, f = d === "fixed" || d === "document" ? 1 : 0, m = d === "document" ? 1 : 0, p = t ? 1 : 0, E = t ? 0 : 1, v = r === "start" ? 1 : 0, _ = r === "end" ? 1 : 0, k = (s !== r ? 1 : 0) * o.width + n, w = p * (v * o.left + _ * (l - o.right - c)) + E * (v * (l - o.right - c) + _ * o.left);
    let u = r === "start" ? "inset-inline-start" : "inset-inline-end";
    return d !== "document" && d !== "fixed" || (u = r === "start" && t || r === "end" && !t ? "left" : "right"), { inlineInset: f * w + k + m * (p * (v * window.scrollX - _ * window.scrollX) + E * (_ * window.scrollX - v * window.scrollX)), inlineOutOfBoundsCorrection: Math.abs(Math.min(0, l - w - k - a.width)), surfaceInlineProperty: u };
  }
  hostUpdate() {
    this.onUpdate();
  }
  hostUpdated() {
    this.onUpdate();
  }
  async onUpdate() {
    const e = this.getProperties();
    let t = !1;
    for (const [a, n] of Object.entries(e)) if (t = t || n !== this.lastValues[a], t) break;
    const r = this.lastValues.isOpen !== e.isOpen, s = !!e.anchorEl, o = !!e.surfaceEl;
    t && s && o && (this.lastValues.isOpen = e.isOpen, e.isOpen ? (this.lastValues = e, await this.position(), e.onOpen()) : r && (await e.beforeClose(), this.close(), e.onClose()));
  }
  close() {
    this.surfaceStylesInternal = { display: "none" }, this.host.requestUpdate();
    const e = this.getProperties().surfaceEl;
    e != null && e.popover && e != null && e.isConnected && e.hidePopover();
  }
}
const Rr = 0, mt = 1, Ca = 2;
class Ta {
  constructor(e) {
    this.getProperties = e, this.typeaheadRecords = [], this.typaheadBuffer = "", this.cancelTypeaheadTimeout = 0, this.isTypingAhead = !1, this.lastActiveRecord = null, this.onKeydown = (t) => {
      this.isTypingAhead ? this.typeahead(t) : this.beginTypeahead(t);
    }, this.endTypeahead = () => {
      this.isTypingAhead = !1, this.typaheadBuffer = "", this.typeaheadRecords = [];
    };
  }
  get items() {
    return this.getProperties().getItems();
  }
  get active() {
    return this.getProperties().active;
  }
  beginTypeahead(e) {
    this.active && (e.code === "Space" || e.code === "Enter" || e.code.startsWith("Arrow") || e.code === "Escape" || (this.isTypingAhead = !0, this.typeaheadRecords = this.items.map(((t, r) => [r, t, t.typeaheadText.trim().toLowerCase()])), this.lastActiveRecord = this.typeaheadRecords.find(((t) => t[mt].tabIndex === 0)) ?? null, this.lastActiveRecord && (this.lastActiveRecord[mt].tabIndex = -1), this.typeahead(e)));
  }
  typeahead(e) {
    if (e.defaultPrevented) return;
    if (clearTimeout(this.cancelTypeaheadTimeout), e.code === "Enter" || e.code.startsWith("Arrow") || e.code === "Escape") return this.endTypeahead(), void (this.lastActiveRecord && (this.lastActiveRecord[mt].tabIndex = -1));
    e.code === "Space" && e.preventDefault(), this.cancelTypeaheadTimeout = setTimeout(this.endTypeahead, this.getProperties().typeaheadBufferTime), this.typaheadBuffer += e.key.toLowerCase();
    const t = this.lastActiveRecord ? this.lastActiveRecord[Rr] : -1, r = this.typeaheadRecords.length, s = (d) => (d[Rr] + r - t) % r, o = this.typeaheadRecords.filter(((d) => !d[mt].disabled && d[Ca].startsWith(this.typaheadBuffer))).sort(((d, l) => s(d) - s(l)));
    if (o.length === 0) return clearTimeout(this.cancelTypeaheadTimeout), this.lastActiveRecord && (this.lastActiveRecord[mt].tabIndex = -1), void this.endTypeahead();
    const a = this.typaheadBuffer.length === 1;
    let n;
    n = this.lastActiveRecord === o[0] && a ? o[1] ?? o[0] : o[0], this.lastActiveRecord && (this.lastActiveRecord[mt].tabIndex = -1), this.lastActiveRecord = n, n[mt].tabIndex = 0, n[mt].focus();
  }
}
const bs = /* @__PURE__ */ new Set([G.ArrowDown, G.ArrowUp, G.Home, G.End]), $a = /* @__PURE__ */ new Set([G.ArrowLeft, G.ArrowRight, ...bs]);
class B extends U {
  get openDirection() {
    return this.menuCorner.split("-")[0] === "start" ? "DOWN" : "UP";
  }
  get anchorElement() {
    return this.anchor ? this.getRootNode().querySelector(`#${this.anchor}`) : this.currentAnchorElement;
  }
  set anchorElement(e) {
    this.currentAnchorElement = e, this.requestUpdate("anchorElement");
  }
  constructor() {
    super(), this.anchor = "", this.positioning = "absolute", this.quick = !1, this.hasOverflow = !1, this.open = !1, this.xOffset = 0, this.yOffset = 0, this.noHorizontalFlip = !1, this.noVerticalFlip = !1, this.typeaheadDelay = 200, this.anchorCorner = Aa, this.menuCorner = Ra, this.stayOpenOnOutsideClick = !1, this.stayOpenOnFocusout = !1, this.skipRestoreFocus = !1, this.defaultFocus = Ii, this.noNavigationWrap = !1, this.typeaheadActive = !0, this.isSubmenu = !1, this.pointerPath = [], this.isRepositioning = !1, this.openCloseAnimationSignal = Is(), this.listController = new Gr({ isItem: (e) => e.hasAttribute("md-menu-item"), getPossibleItems: () => this.slotItems, isRtl: () => getComputedStyle(this).direction === "rtl", deactivateItem: (e) => {
      e.selected = !1, e.tabIndex = -1;
    }, activateItem: (e) => {
      e.selected = !0, e.tabIndex = 0;
    }, isNavigableKey: (e) => this.isSubmenu ? e === (getComputedStyle(this).direction === "rtl" ? G.ArrowLeft : G.ArrowRight) || bs.has(e) : $a.has(e), wrapNavigation: () => !this.noNavigationWrap }), this.lastFocusedElement = null, this.typeaheadController = new Ta((() => ({ getItems: () => this.items, typeaheadBufferTime: this.typeaheadDelay, active: this.typeaheadActive }))), this.currentAnchorElement = null, this.internals = this.attachInternals(), this.menuPositionController = new Ia(this, (() => ({ anchorCorner: this.anchorCorner, surfaceCorner: this.menuCorner, surfaceEl: this.surfaceEl, anchorEl: this.anchorElement, positioning: this.positioning === "popover" ? "document" : this.positioning, isOpen: this.open, xOffset: this.xOffset, yOffset: this.yOffset, disableBlockFlip: this.noVerticalFlip, disableInlineFlip: this.noHorizontalFlip, onOpen: this.onOpened, beforeClose: this.beforeClose, onClose: this.onClosed, repositionStrategy: this.hasOverflow && this.positioning !== "popover" ? "move" : "resize" }))), this.onWindowResize = () => {
      this.isRepositioning || this.positioning !== "document" && this.positioning !== "fixed" && this.positioning !== "popover" || (this.isRepositioning = !0, this.reposition(), this.isRepositioning = !1);
    }, this.handleFocusout = async (e) => {
      const t = this.anchorElement;
      if (this.stayOpenOnFocusout || !this.open || this.pointerPath.includes(t)) return;
      if (e.relatedTarget) {
        if (Ri(e.relatedTarget, this) || this.pointerPath.length !== 0 && Ri(e.relatedTarget, t)) return;
      } else if (this.pointerPath.includes(this)) return;
      const r = this.skipRestoreFocus;
      this.skipRestoreFocus = !0, this.close(), await this.updateComplete, this.skipRestoreFocus = r;
    }, this.onOpened = async () => {
      this.lastFocusedElement = (function(s = document) {
        let o = s.activeElement;
        for (; o && (a = o) !== null && a !== void 0 && (a = a.shadowRoot) !== null && a !== void 0 && a.activeElement; ) {
          var a;
          o = o.shadowRoot.activeElement;
        }
        return o;
      })();
      const e = this.items, t = ie(e);
      t && this.defaultFocus !== Fe && (t.item.tabIndex = -1);
      let r = !this.quick;
      switch (this.quick ? this.dispatchEvent(new Event("opening")) : r = !!await this.animateOpen(), this.defaultFocus) {
        case Ii:
          const s = Ti(e);
          s && (s.tabIndex = 0, s.focus(), await s.updateComplete);
          break;
        case _s:
          const o = qr(e);
          o && (o.tabIndex = 0, o.focus(), await o.updateComplete);
          break;
        case ka:
          this.focus();
      }
      r || this.dispatchEvent(new Event("opened"));
    }, this.beforeClose = async () => {
      var e, t;
      this.open = !1, this.skipRestoreFocus || (e = this.lastFocusedElement) === null || e === void 0 || (t = e.focus) === null || t === void 0 || t.call(e), this.quick || await this.animateClose();
    }, this.onClosed = () => {
      this.quick && (this.dispatchEvent(new Event("closing")), this.dispatchEvent(new Event("closed")));
    }, this.onWindowPointerdown = (e) => {
      this.pointerPath = e.composedPath();
    }, this.onDocumentClick = (e) => {
      if (!this.open) return;
      const t = e.composedPath();
      this.stayOpenOnOutsideClick || t.includes(this) || t.includes(this.anchorElement) || (this.open = !1);
    }, this.internals.role = "menu", this.addEventListener("keydown", this.handleKeydown), this.addEventListener("keydown", this.captureKeydown, { capture: !0 }), this.addEventListener("focusout", this.handleFocusout);
  }
  get items() {
    return this.listController.items;
  }
  willUpdate(e) {
    e.has("open") && (this.open ? this.removeAttribute("aria-hidden") : this.setAttribute("aria-hidden", "true"));
  }
  update(e) {
    e.has("open") && (this.open ? this.setUpGlobalEventListeners() : this.cleanUpGlobalEventListeners()), e.has("positioning") && this.positioning === "popover" && !this.showPopover && (this.positioning = "fixed"), super.update(e);
  }
  connectedCallback() {
    super.connectedCallback(), this.open && this.setUpGlobalEventListeners();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.cleanUpGlobalEventListeners();
  }
  getBoundingClientRect() {
    return this.surfaceEl ? this.surfaceEl.getBoundingClientRect() : super.getBoundingClientRect();
  }
  getClientRects() {
    return this.surfaceEl ? this.surfaceEl.getClientRects() : super.getClientRects();
  }
  render() {
    return this.renderSurface();
  }
  renderSurface() {
    return y`
      <div
        class="menu ${ot(this.getSurfaceClasses())}"
        style=${He(this.menuPositionController.surfaceStyles)}
        popover=${this.positioning === "popover" ? "manual" : R}>
        ${this.renderElevation()}
        <div class="items">
          <div class="item-padding"> ${this.renderMenuItems()} </div>
        </div>
      </div>
    `;
  }
  renderMenuItems() {
    return y`<slot
      @close-menu=${this.onCloseMenu}
      @deactivate-items=${this.onDeactivateItems}
      @request-activation=${this.onRequestActivation}
      @deactivate-typeahead=${this.handleDeactivateTypeahead}
      @activate-typeahead=${this.handleActivateTypeahead}
      @stay-open-on-focusout=${this.handleStayOpenOnFocusout}
      @close-on-focusout=${this.handleCloseOnFocusout}
      @slotchange=${this.listController.onSlotchange}></slot>`;
  }
  renderElevation() {
    return y`<md-elevation part="elevation"></md-elevation>`;
  }
  getSurfaceClasses() {
    return { open: this.open, fixed: this.positioning === "fixed", "has-overflow": this.hasOverflow };
  }
  captureKeydown(e) {
    e.target === this && !e.defaultPrevented && gs(e.code) && (e.preventDefault(), this.close()), this.typeaheadController.onKeydown(e);
  }
  async animateOpen() {
    const e = this.surfaceEl, t = this.slotEl;
    if (!e || !t) return !0;
    const r = this.openDirection;
    this.dispatchEvent(new Event("opening")), e.classList.toggle("animating", !0);
    const s = this.openCloseAnimationSignal.start(), o = e.offsetHeight, a = r === "UP", n = this.items, d = 250 / n.length, l = e.animate([{ height: "0px" }, { height: `${o}px` }], { duration: 500, easing: Xt.EMPHASIZED }), c = t.animate([{ transform: a ? `translateY(-${o}px)` : "" }, { transform: "" }], { duration: 500, easing: Xt.EMPHASIZED }), f = e.animate([{ opacity: 0 }, { opacity: 1 }], 50), m = [];
    for (let v = 0; v < n.length; v++) {
      const _ = n[a ? n.length - 1 - v : v], k = _.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: d * v });
      _.classList.toggle("md-menu-hidden", !0), k.addEventListener("finish", (() => {
        _.classList.toggle("md-menu-hidden", !1);
      })), m.push([_, k]);
    }
    let p = (v) => {
    };
    const E = new Promise(((v) => {
      p = v;
    }));
    return s.addEventListener("abort", (() => {
      l.cancel(), c.cancel(), f.cancel(), m.forEach((([v, _]) => {
        v.classList.toggle("md-menu-hidden", !1), _.cancel();
      })), p(!0);
    })), l.addEventListener("finish", (() => {
      e.classList.toggle("animating", !1), this.openCloseAnimationSignal.finish(), p(!1);
    })), await E;
  }
  animateClose() {
    let e;
    const t = new Promise(((v) => {
      e = v;
    })), r = this.surfaceEl, s = this.slotEl;
    if (!r || !s) return e(!1), t;
    const o = this.openDirection === "UP";
    this.dispatchEvent(new Event("closing")), r.classList.toggle("animating", !0);
    const a = this.openCloseAnimationSignal.start(), n = r.offsetHeight, d = this.items, l = 150, c = 50 / d.length, f = r.animate([{ height: `${n}px` }, { height: 0.35 * n + "px" }], { duration: l, easing: Xt.EMPHASIZED_ACCELERATE }), m = s.animate([{ transform: "" }, { transform: o ? `translateY(-${0.65 * n}px)` : "" }], { duration: l, easing: Xt.EMPHASIZED_ACCELERATE }), p = r.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 50, delay: 100 }), E = [];
    for (let v = 0; v < d.length; v++) {
      const _ = d[o ? v : d.length - 1 - v], k = _.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 50, delay: 50 + c * v });
      k.addEventListener("finish", (() => {
        _.classList.toggle("md-menu-hidden", !0);
      })), E.push([_, k]);
    }
    return a.addEventListener("abort", (() => {
      f.cancel(), m.cancel(), p.cancel(), E.forEach((([v, _]) => {
        _.cancel(), v.classList.toggle("md-menu-hidden", !1);
      })), e(!1);
    })), f.addEventListener("finish", (() => {
      r.classList.toggle("animating", !1), E.forEach((([v]) => {
        v.classList.toggle("md-menu-hidden", !1);
      })), this.openCloseAnimationSignal.finish(), this.dispatchEvent(new Event("closed")), e(!0);
    })), t;
  }
  handleKeydown(e) {
    this.pointerPath = [], this.listController.handleKeydown(e);
  }
  setUpGlobalEventListeners() {
    document.addEventListener("click", this.onDocumentClick, { capture: !0 }), window.addEventListener("pointerdown", this.onWindowPointerdown), document.addEventListener("resize", this.onWindowResize, { passive: !0 }), window.addEventListener("resize", this.onWindowResize, { passive: !0 });
  }
  cleanUpGlobalEventListeners() {
    document.removeEventListener("click", this.onDocumentClick, { capture: !0 }), window.removeEventListener("pointerdown", this.onWindowPointerdown), document.removeEventListener("resize", this.onWindowResize), window.removeEventListener("resize", this.onWindowResize);
  }
  onCloseMenu() {
    this.close();
  }
  onDeactivateItems(e) {
    e.stopPropagation(), this.listController.onDeactivateItems();
  }
  onRequestActivation(e) {
    e.stopPropagation(), this.listController.onRequestActivation(e);
  }
  handleDeactivateTypeahead(e) {
    e.stopPropagation(), this.typeaheadActive = !1;
  }
  handleActivateTypeahead(e) {
    e.stopPropagation(), this.typeaheadActive = !0;
  }
  handleStayOpenOnFocusout(e) {
    e.stopPropagation(), this.stayOpenOnFocusout = !0;
  }
  handleCloseOnFocusout(e) {
    e.stopPropagation(), this.stayOpenOnFocusout = !1;
  }
  close() {
    this.open = !1, this.slotItems.forEach(((e) => {
      var t;
      (t = e.close) === null || t === void 0 || t.call(e);
    }));
  }
  show() {
    this.open = !0;
  }
  activateNextItem() {
    return this.listController.activateNextItem() ?? null;
  }
  activatePreviousItem() {
    return this.listController.activatePreviousItem() ?? null;
  }
  reposition() {
    this.open && this.menuPositionController.position();
  }
}
h([J(".menu")], B.prototype, "surfaceEl", void 0), h([J("slot")], B.prototype, "slotEl", void 0), h([g()], B.prototype, "anchor", void 0), h([g()], B.prototype, "positioning", void 0), h([g({ type: Boolean })], B.prototype, "quick", void 0), h([g({ type: Boolean, attribute: "has-overflow" })], B.prototype, "hasOverflow", void 0), h([g({ type: Boolean, reflect: !0 })], B.prototype, "open", void 0), h([g({ type: Number, attribute: "x-offset" })], B.prototype, "xOffset", void 0), h([g({ type: Number, attribute: "y-offset" })], B.prototype, "yOffset", void 0), h([g({ type: Boolean, attribute: "no-horizontal-flip" })], B.prototype, "noHorizontalFlip", void 0), h([g({ type: Boolean, attribute: "no-vertical-flip" })], B.prototype, "noVerticalFlip", void 0), h([g({ type: Number, attribute: "typeahead-delay" })], B.prototype, "typeaheadDelay", void 0), h([g({ attribute: "anchor-corner" })], B.prototype, "anchorCorner", void 0), h([g({ attribute: "menu-corner" })], B.prototype, "menuCorner", void 0), h([g({ type: Boolean, attribute: "stay-open-on-outside-click" })], B.prototype, "stayOpenOnOutsideClick", void 0), h([g({ type: Boolean, attribute: "stay-open-on-focusout" })], B.prototype, "stayOpenOnFocusout", void 0), h([g({ type: Boolean, attribute: "skip-restore-focus" })], B.prototype, "skipRestoreFocus", void 0), h([g({ attribute: "default-focus" })], B.prototype, "defaultFocus", void 0), h([g({ type: Boolean, attribute: "no-navigation-wrap" })], B.prototype, "noNavigationWrap", void 0), h([At({ flatten: !0 })], B.prototype, "slotItems", void 0), h([M()], B.prototype, "typeaheadActive", void 0);
const La = N`:host{--md-elevation-level: var(--md-menu-container-elevation, 2);--md-elevation-shadow-color: var(--md-menu-container-shadow-color, var(--md-sys-color-shadow, #000));min-width:112px;color:unset;display:contents}md-focus-ring{--md-focus-ring-shape: var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px))}.menu{border-radius:var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px));display:none;inset:auto;border:none;padding:0px;overflow:visible;background-color:rgba(0,0,0,0);color:inherit;opacity:0;z-index:20;position:absolute;user-select:none;max-height:inherit;height:inherit;min-width:inherit;max-width:inherit;scrollbar-width:inherit}.menu::backdrop{display:none}.fixed{position:fixed}.items{display:block;list-style-type:none;margin:0;outline:none;box-sizing:border-box;background-color:var(--md-menu-container-color, var(--md-sys-color-surface-container, #f3edf7));height:inherit;max-height:inherit;overflow:auto;min-width:inherit;max-width:inherit;border-radius:inherit;scrollbar-width:inherit}.item-padding{padding-block:var(--md-menu-top-space, 8px) var(--md-menu-bottom-space, 8px)}.has-overflow:not([popover]) .items{overflow:visible}.has-overflow.animating .items,.animating .items{overflow:hidden}.has-overflow.animating .items{pointer-events:none}.animating ::slotted(.md-menu-hidden){opacity:0}slot{display:block;height:inherit;max-height:inherit}::slotted(:is(md-divider,[role=separator])){margin:8px 0}@media(forced-colors: active){.menu{border-style:solid;border-color:CanvasText;border-width:1px}}
`;
let _i = class extends B {
};
_i.styles = [La], _i = h([Ge("md-menu")], _i);
class Oa extends Oi {
  computeValidity(e) {
    return this.selectControl || (this.selectControl = document.createElement("select")), zr(y`<option value=${e.value}></option>`, this.selectControl), this.selectControl.value = e.value, this.selectControl.required = e.required, { validity: this.selectControl.validity, validationMessage: this.selectControl.validationMessage };
  }
  equals(e, t) {
    return e.value === t.value && e.required === t.required;
  }
  copy({ value: e, required: t }) {
    return { value: e, required: t };
  }
}
var Ir;
const $e = /* @__PURE__ */ Symbol("value"), Da = Ft(vs($i(Li(We(U)))));
class P extends Da {
  get value() {
    return this[$e];
  }
  set value(e) {
    this.lastUserSetValue = e, this.select(e);
  }
  get options() {
    var e;
    return ((e = this.menu) === null || e === void 0 ? void 0 : e.items) ?? [];
  }
  get selectedIndex() {
    const [e, t] = (this.getSelectedOptions() ?? [])[0] ?? [];
    return t ?? -1;
  }
  set selectedIndex(e) {
    this.lastUserSetSelectedIndex = e, this.selectIndex(e);
  }
  get selectedOptions() {
    return (this.getSelectedOptions() ?? []).map((([e]) => e));
  }
  get hasError() {
    return this.error || this.nativeError;
  }
  constructor() {
    super(), this.quick = !1, this.required = !1, this.errorText = "", this.label = "", this.noAsterisk = !1, this.supportingText = "", this.error = !1, this.menuPositioning = "popover", this.clampMenuWidth = !1, this.typeaheadDelay = 200, this.hasLeadingIcon = !1, this.displayText = "", this.menuAlign = "start", this[Ir] = "", this.lastUserSetValue = null, this.lastUserSetSelectedIndex = null, this.lastSelectedOption = null, this.lastSelectedOptionRecords = [], this.nativeError = !1, this.nativeErrorText = "", this.focused = !1, this.open = !1, this.defaultFocus = Fe, this.prevOpen = this.open, this.selectWidth = 0, this.addEventListener("focus", this.handleFocus.bind(this)), this.addEventListener("blur", this.handleBlur.bind(this));
  }
  select(e) {
    const t = this.options.find(((r) => r.value === e));
    t && this.selectItem(t);
  }
  selectIndex(e) {
    const t = this.options[e];
    t && this.selectItem(t);
  }
  reset() {
    for (const e of this.options) e.selected = e.hasAttribute("selected");
    this.updateValueAndDisplayText(), this.nativeError = !1, this.nativeErrorText = "";
  }
  showPicker() {
    this.open = !0;
  }
  [(Ir = $e, qe)](e) {
    e?.preventDefault();
    const t = this.getErrorText();
    var r;
    this.nativeError = !!e, this.nativeErrorText = this.validationMessage, t === this.getErrorText() && ((r = this.field) === null || r === void 0 || r.reannounceError());
  }
  update(e) {
    if (this.hasUpdated || this.initUserSelection(), this.prevOpen !== this.open && this.open) {
      const t = this.getBoundingClientRect();
      this.selectWidth = t.width;
    }
    this.prevOpen = this.open, super.update(e);
  }
  render() {
    return y`
      <span
        class="select ${ot(this.getRenderClasses())}"
        @focusout=${this.handleFocusout}>
        ${this.renderField()} ${this.renderMenu()}
      </span>
    `;
  }
  async firstUpdated(e) {
    var t;
    await ((t = this.menu) === null || t === void 0 ? void 0 : t.updateComplete), this.lastSelectedOptionRecords.length || this.initUserSelection(), this.lastSelectedOptionRecords.length || this.options.length || setTimeout((() => {
      this.updateValueAndDisplayText();
    })), super.firstUpdated(e);
  }
  getRenderClasses() {
    return { disabled: this.disabled, error: this.error, open: this.open };
  }
  renderField() {
    const e = this.ariaLabel || this.label;
    return Ze`
      <${this.fieldTag}
          aria-haspopup="listbox"
          role="combobox"
          part="field"
          id="field"
          tabindex=${this.disabled ? "-1" : "0"}
          aria-label=${e || R}
          aria-describedby="description"
          aria-expanded=${this.open ? "true" : "false"}
          aria-controls="listbox"
          class="field"
          label=${this.label}
          ?no-asterisk=${this.noAsterisk}
          .focused=${this.focused || this.open}
          .populated=${!!this.displayText}
          .disabled=${this.disabled}
          .required=${this.required}
          .error=${this.hasError}
          ?has-start=${this.hasLeadingIcon}
          has-end
          supporting-text=${this.supportingText}
          error-text=${this.getErrorText()}
          @keydown=${this.handleKeydown}
          @click=${this.handleClick}>
         ${this.renderFieldContent()}
         <div id="description" slot="aria-describedby"></div>
      </${this.fieldTag}>`;
  }
  renderFieldContent() {
    return [this.renderLeadingIcon(), this.renderLabel(), this.renderTrailingIcon()];
  }
  renderLeadingIcon() {
    return y`
      <span class="icon leading" slot="start">
        <slot name="leading-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderTrailingIcon() {
    return y`
      <span class="icon trailing" slot="end">
        <slot name="trailing-icon" @slotchange=${this.handleIconChange}>
          <svg height="5" viewBox="7 10 10 5" focusable="false">
            <polygon
              class="down"
              stroke="none"
              fill-rule="evenodd"
              points="7 10 12 15 17 10"></polygon>
            <polygon
              class="up"
              stroke="none"
              fill-rule="evenodd"
              points="7 15 12 10 17 15"></polygon>
          </svg>
        </slot>
      </span>
    `;
  }
  renderLabel() {
    return y`<div id="label">${this.displayText || y`&nbsp;`}</div>`;
  }
  renderMenu() {
    const e = this.label || this.ariaLabel;
    return y`<div class="menu-wrapper">
      <md-menu
        id="listbox"
        .defaultFocus=${this.defaultFocus}
        role="listbox"
        tabindex="-1"
        aria-label=${e || R}
        stay-open-on-focusout
        part="menu"
        exportparts="focus-ring: menu-focus-ring"
        anchor="field"
        style=${He({ "--__menu-min-width": `${this.selectWidth}px`, "--__menu-max-width": this.clampMenuWidth ? `${this.selectWidth}px` : void 0 })}
        no-navigation-wrap
        .open=${this.open}
        .quick=${this.quick}
        .positioning=${this.menuPositioning}
        .typeaheadDelay=${this.typeaheadDelay}
        .anchorCorner=${this.menuAlign === "start" ? "end-start" : "end-end"}
        .menuCorner=${this.menuAlign === "start" ? "start-start" : "start-end"}
        @opening=${this.handleOpening}
        @opened=${this.redispatchEvent}
        @closing=${this.redispatchEvent}
        @closed=${this.handleClosed}
        @close-menu=${this.handleCloseMenu}
        @request-selection=${this.handleRequestSelection}
        @request-deselection=${this.handleRequestDeselection}>
        ${this.renderMenuContent()}
      </md-menu>
    </div>`;
  }
  renderMenuContent() {
    return y`<slot></slot>`;
  }
  handleKeydown(e) {
    if (this.open || this.disabled || !this.menu) return;
    const t = this.menu.typeaheadController, r = e.code === "Space" || e.code === "ArrowDown" || e.code === "ArrowUp" || e.code === "End" || e.code === "Home" || e.code === "Enter";
    if (!t.isTypingAhead && r) {
      switch (e.preventDefault(), this.open = !0, e.code) {
        case "Space":
        case "ArrowDown":
        case "Enter":
          this.defaultFocus = Fe;
          break;
        case "End":
          this.defaultFocus = _s;
          break;
        case "ArrowUp":
        case "Home":
          this.defaultFocus = Ii;
      }
      return;
    }
    if (e.key.length === 1) {
      var s, o;
      t.onKeydown(e), e.preventDefault();
      const { lastActiveRecord: a } = t;
      if (!a) return;
      (s = this.labelEl) === null || s === void 0 || (o = s.setAttribute) === null || o === void 0 || o.call(s, "aria-live", "polite"), this.selectItem(a[mt]) && this.dispatchInteractionEvents();
    }
  }
  handleClick() {
    this.open = !this.open;
  }
  handleFocus() {
    this.focused = !0;
  }
  handleBlur() {
    this.focused = !1;
  }
  handleFocusout(e) {
    e.relatedTarget && Ri(e.relatedTarget, this) || (this.open = !1);
  }
  getSelectedOptions() {
    if (!this.menu) return this.lastSelectedOptionRecords = [], null;
    const e = this.menu.items;
    return this.lastSelectedOptionRecords = (function(t) {
      const r = [];
      for (let s = 0; s < t.length; s++) {
        const o = t[s];
        o.selected && r.push([o, s]);
      }
      return r;
    })(e), this.lastSelectedOptionRecords;
  }
  async getUpdateComplete() {
    var e;
    return await ((e = this.menu) === null || e === void 0 ? void 0 : e.updateComplete), super.getUpdateComplete();
  }
  updateValueAndDisplayText() {
    const e = this.getSelectedOptions() ?? [];
    let t = !1;
    if (e.length) {
      const [r] = e[0];
      t = this.lastSelectedOption !== r, this.lastSelectedOption = r, this[$e] = r.value, this.displayText = r.displayText;
    } else t = this.lastSelectedOption !== null, this.lastSelectedOption = null, this[$e] = "", this.displayText = "";
    return t;
  }
  async handleOpening(e) {
    var t, r, s;
    if ((t = this.labelEl) === null || t === void 0 || (r = t.removeAttribute) === null || r === void 0 || r.call(t, "aria-live"), this.redispatchEvent(e), this.defaultFocus !== Fe) return;
    const o = this.menu.items, a = (s = ie(o)) === null || s === void 0 ? void 0 : s.item;
    let [n] = this.lastSelectedOptionRecords[0] ?? [null];
    a && a !== n && (a.tabIndex = -1), n = n ?? o[0], n && (n.tabIndex = 0, n.focus());
  }
  redispatchEvent(e) {
    Ci(this, e);
  }
  handleClosed(e) {
    this.open = !1, this.redispatchEvent(e);
  }
  handleCloseMenu(e) {
    const t = e.detail.reason, r = e.detail.itemPath[0];
    this.open = !1;
    let s = !1;
    var o;
    t.kind === "click-selection" || t.kind === "keydown" && (o = t.key, Object.values(Ai).some(((a) => a === o))) ? s = this.selectItem(r) : (r.tabIndex = -1, r.blur()), s && this.dispatchInteractionEvents();
  }
  selectItem(e) {
    return (this.getSelectedOptions() ?? []).forEach((([t]) => {
      e !== t && (t.selected = !1);
    })), e.selected = !0, this.updateValueAndDisplayText();
  }
  handleRequestSelection(e) {
    const t = e.target;
    this.lastSelectedOptionRecords.some((([r]) => r === t)) || this.selectItem(t);
  }
  handleRequestDeselection(e) {
    const t = e.target;
    this.lastSelectedOptionRecords.some((([r]) => r === t)) && this.updateValueAndDisplayText();
  }
  initUserSelection() {
    this.lastUserSetValue && !this.lastSelectedOptionRecords.length ? this.select(this.lastUserSetValue) : this.lastUserSetSelectedIndex === null || this.lastSelectedOptionRecords.length ? this.updateValueAndDisplayText() : this.selectIndex(this.lastUserSetSelectedIndex);
  }
  handleIconChange() {
    this.hasLeadingIcon = this.leadingIcons.length > 0;
  }
  dispatchInteractionEvents() {
    this.dispatchEvent(new Event("input", { bubbles: !0, composed: !0 })), this.dispatchEvent(new Event("change", { bubbles: !0 }));
  }
  getErrorText() {
    return this.error ? this.errorText : this.nativeErrorText;
  }
  [Nt]() {
    return this.value;
  }
  formResetCallback() {
    this.reset();
  }
  formStateRestoreCallback(e) {
    this.value = e;
  }
  click() {
    var e;
    (e = this.field) === null || e === void 0 || e.click();
  }
  [he]() {
    return new Oa((() => this));
  }
  [pe]() {
    return this.field;
  }
}
P.shadowRootOptions = { ...U.shadowRootOptions, delegatesFocus: !0 }, h([g({ type: Boolean })], P.prototype, "quick", void 0), h([g({ type: Boolean })], P.prototype, "required", void 0), h([g({ type: String, attribute: "error-text" })], P.prototype, "errorText", void 0), h([g()], P.prototype, "label", void 0), h([g({ type: Boolean, attribute: "no-asterisk" })], P.prototype, "noAsterisk", void 0), h([g({ type: String, attribute: "supporting-text" })], P.prototype, "supportingText", void 0), h([g({ type: Boolean, reflect: !0 })], P.prototype, "error", void 0), h([g({ attribute: "menu-positioning" })], P.prototype, "menuPositioning", void 0), h([g({ type: Boolean, attribute: "clamp-menu-width" })], P.prototype, "clampMenuWidth", void 0), h([g({ type: Number, attribute: "typeahead-delay" })], P.prototype, "typeaheadDelay", void 0), h([g({ type: Boolean, attribute: "has-leading-icon" })], P.prototype, "hasLeadingIcon", void 0), h([g({ attribute: "display-text" })], P.prototype, "displayText", void 0), h([g({ attribute: "menu-align" })], P.prototype, "menuAlign", void 0), h([g()], P.prototype, "value", null), h([g({ type: Number, attribute: "selected-index" })], P.prototype, "selectedIndex", null), h([M()], P.prototype, "nativeError", void 0), h([M()], P.prototype, "nativeErrorText", void 0), h([M()], P.prototype, "focused", void 0), h([M()], P.prototype, "open", void 0), h([M()], P.prototype, "defaultFocus", void 0), h([J(".field")], P.prototype, "field", void 0), h([J("md-menu")], P.prototype, "menu", void 0), h([J("#label")], P.prototype, "labelEl", void 0), h([At({ slot: "leading-icon", flatten: !0 })], P.prototype, "leadingIcons", void 0);
class Ma extends P {
  constructor() {
    super(...arguments), this.fieldTag = wt`md-filled-field`;
  }
}
const Pa = N`:host{--_text-field-active-indicator-color: var(--md-filled-select-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-active-indicator-height: var(--md-filled-select-text-field-active-indicator-height, 1px);--_text-field-container-color: var(--md-filled-select-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_text-field-disabled-active-indicator-color: var(--md-filled-select-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-active-indicator-height: var(--md-filled-select-text-field-disabled-active-indicator-height, 1px);--_text-field-disabled-active-indicator-opacity: var(--md-filled-select-text-field-disabled-active-indicator-opacity, 0.38);--_text-field-disabled-container-color: var(--md-filled-select-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-container-opacity: var(--md-filled-select-text-field-disabled-container-opacity, 0.04);--_text-field-disabled-input-text-color: var(--md-filled-select-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-input-text-opacity: var(--md-filled-select-text-field-disabled-input-text-opacity, 0.38);--_text-field-disabled-label-text-color: var(--md-filled-select-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-label-text-opacity: var(--md-filled-select-text-field-disabled-label-text-opacity, 0.38);--_text-field-disabled-leading-icon-color: var(--md-filled-select-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-leading-icon-opacity: var(--md-filled-select-text-field-disabled-leading-icon-opacity, 0.38);--_text-field-disabled-supporting-text-color: var(--md-filled-select-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-supporting-text-opacity: var(--md-filled-select-text-field-disabled-supporting-text-opacity, 0.38);--_text-field-disabled-trailing-icon-color: var(--md-filled-select-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-trailing-icon-opacity: var(--md-filled-select-text-field-disabled-trailing-icon-opacity, 0.38);--_text-field-error-active-indicator-color: var(--md-filled-select-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-active-indicator-color: var(--md-filled-select-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-input-text-color: var(--md-filled-select-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-focus-label-text-color: var(--md-filled-select-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-leading-icon-color: var(--md-filled-select-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-focus-supporting-text-color: var(--md-filled-select-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-trailing-icon-color: var(--md-filled-select-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-active-indicator-color: var(--md-filled-select-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-input-text-color: var(--md-filled-select-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-label-text-color: var(--md-filled-select-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-leading-icon-color: var(--md-filled-select-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-hover-state-layer-color: var(--md-filled-select-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-state-layer-opacity: var(--md-filled-select-text-field-error-hover-state-layer-opacity, 0.08);--_text-field-error-hover-supporting-text-color: var(--md-filled-select-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-trailing-icon-color: var(--md-filled-select-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-input-text-color: var(--md-filled-select-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-label-text-color: var(--md-filled-select-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-leading-icon-color: var(--md-filled-select-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-supporting-text-color: var(--md-filled-select-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-trailing-icon-color: var(--md-filled-select-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-focus-active-indicator-color: var(--md-filled-select-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-active-indicator-height: var(--md-filled-select-text-field-focus-active-indicator-height, 3px);--_text-field-focus-input-text-color: var(--md-filled-select-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-focus-label-text-color: var(--md-filled-select-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-leading-icon-color: var(--md-filled-select-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-supporting-text-color: var(--md-filled-select-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-trailing-icon-color: var(--md-filled-select-text-field-focus-trailing-icon-color, var(--md-sys-color-primary, #6750a4));--_text-field-hover-active-indicator-color: var(--md-filled-select-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-active-indicator-height: var(--md-filled-select-text-field-hover-active-indicator-height, 1px);--_text-field-hover-input-text-color: var(--md-filled-select-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-label-text-color: var(--md-filled-select-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-leading-icon-color: var(--md-filled-select-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-state-layer-color: var(--md-filled-select-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-state-layer-opacity: var(--md-filled-select-text-field-hover-state-layer-opacity, 0.08);--_text-field-hover-supporting-text-color: var(--md-filled-select-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-trailing-icon-color: var(--md-filled-select-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-input-text-color: var(--md-filled-select-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-input-text-font: var(--md-filled-select-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-input-text-line-height: var(--md-filled-select-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-input-text-size: var(--md-filled-select-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-input-text-weight: var(--md-filled-select-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-label-text-color: var(--md-filled-select-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-label-text-font: var(--md-filled-select-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-label-text-line-height: var(--md-filled-select-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-label-text-populated-line-height: var(--md-filled-select-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-label-text-populated-size: var(--md-filled-select-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-label-text-size: var(--md-filled-select-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-label-text-weight: var(--md-filled-select-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-leading-icon-color: var(--md-filled-select-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-leading-icon-size: var(--md-filled-select-text-field-leading-icon-size, 24px);--_text-field-supporting-text-color: var(--md-filled-select-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-supporting-text-font: var(--md-filled-select-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-supporting-text-line-height: var(--md-filled-select-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-supporting-text-size: var(--md-filled-select-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-supporting-text-weight: var(--md-filled-select-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-trailing-icon-color: var(--md-filled-select-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-trailing-icon-size: var(--md-filled-select-text-field-trailing-icon-size, 24px);--_text-field-container-shape-start-start: var(--md-filled-select-text-field-container-shape-start-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-start-end: var(--md-filled-select-text-field-container-shape-start-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-end: var(--md-filled-select-text-field-container-shape-end-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_text-field-container-shape-end-start: var(--md-filled-select-text-field-container-shape-end-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--md-filled-field-active-indicator-color: var(--_text-field-active-indicator-color);--md-filled-field-active-indicator-height: var(--_text-field-active-indicator-height);--md-filled-field-container-color: var(--_text-field-container-color);--md-filled-field-container-shape-end-end: var(--_text-field-container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_text-field-container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_text-field-container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_text-field-container-shape-start-start);--md-filled-field-content-color: var(--_text-field-input-text-color);--md-filled-field-content-font: var(--_text-field-input-text-font);--md-filled-field-content-line-height: var(--_text-field-input-text-line-height);--md-filled-field-content-size: var(--_text-field-input-text-size);--md-filled-field-content-weight: var(--_text-field-input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_text-field-disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_text-field-disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_text-field-disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_text-field-disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_text-field-disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_text-field-disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_text-field-disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_text-field-disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_text-field-disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_text-field-disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_text-field-disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_text-field-disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_text-field-disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_text-field-disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_text-field-disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_text-field-error-active-indicator-color);--md-filled-field-error-content-color: var(--_text-field-error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_text-field-error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_text-field-error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_text-field-error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_text-field-error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_text-field-error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_text-field-error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_text-field-error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_text-field-error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_text-field-error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_text-field-error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_text-field-error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_text-field-error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_text-field-error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_text-field-error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_text-field-error-label-text-color);--md-filled-field-error-leading-content-color: var(--_text-field-error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_text-field-error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_text-field-error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_text-field-focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_text-field-focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_text-field-focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_text-field-focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_text-field-focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_text-field-focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_text-field-focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_text-field-hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_text-field-hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_text-field-hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_text-field-hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_text-field-hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_text-field-hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_text-field-hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_text-field-hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_text-field-hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_text-field-label-text-color);--md-filled-field-label-text-font: var(--_text-field-label-text-font);--md-filled-field-label-text-line-height: var(--_text-field-label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_text-field-label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_text-field-label-text-populated-size);--md-filled-field-label-text-size: var(--_text-field-label-text-size);--md-filled-field-label-text-weight: var(--_text-field-label-text-weight);--md-filled-field-leading-content-color: var(--_text-field-leading-icon-color);--md-filled-field-supporting-text-color: var(--_text-field-supporting-text-color);--md-filled-field-supporting-text-font: var(--_text-field-supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_text-field-supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_text-field-supporting-text-size);--md-filled-field-supporting-text-weight: var(--_text-field-supporting-text-weight);--md-filled-field-trailing-content-color: var(--_text-field-trailing-icon-color)}[has-start] .icon.leading{font-size:var(--_text-field-leading-icon-size);height:var(--_text-field-leading-icon-size);width:var(--_text-field-leading-icon-size)}.icon.trailing{font-size:var(--_text-field-trailing-icon-size);height:var(--_text-field-trailing-icon-size);width:var(--_text-field-trailing-icon-size)}
`, Fa = N`:host{color:unset;min-width:210px;display:flex}.field{cursor:default;outline:none}.select{position:relative;flex-direction:column}.icon.trailing svg,.icon ::slotted(*){fill:currentColor}.icon ::slotted(*){width:inherit;height:inherit;font-size:inherit}.icon slot{display:flex;height:100%;width:100%;align-items:center;justify-content:center}.icon.trailing :is(.up,.down){opacity:0;transition:opacity 75ms linear 75ms}.select:not(.open) .down,.select.open .up{opacity:1}.field,.select,md-menu{min-width:inherit;width:inherit;max-width:inherit;display:flex}md-menu{min-width:var(--__menu-min-width);max-width:var(--__menu-max-width, inherit)}.menu-wrapper{width:0px;height:0px;max-width:inherit}md-menu ::slotted(:not[disabled]){cursor:pointer}.field,.select{width:100%}:host{display:inline-flex}:host([disabled]){pointer-events:none}
`;
class Cr extends Ma {
}
Cr.styles = [Fa, Pa], customElements.define("ew-filled-select", Cr);
const za = N`:host{display:flex;--md-ripple-hover-color: var(--md-menu-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-menu-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-menu-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-menu-item-pressed-state-layer-opacity, 0.12)}:host([disabled]){opacity:var(--md-menu-item-disabled-opacity, 0.3);pointer-events:none}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}.list-item:not(.disabled){cursor:pointer}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;color:var(--md-menu-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-menu-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-menu-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-menu-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-menu-item-one-line-container-height, 56px);padding-top:var(--md-menu-item-top-space, 12px);padding-bottom:var(--md-menu-item-bottom-space, 12px);padding-inline-start:var(--md-menu-item-leading-space, 16px);padding-inline-end:var(--md-menu-item-trailing-space, 16px)}md-item[multiline]{min-height:var(--md-menu-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-menu-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-menu-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-menu-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-menu-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-menu-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-menu-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-menu-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-menu-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}.list-item{background-color:var(--md-menu-item-container-color, transparent)}.list-item.selected{background-color:var(--md-menu-item-selected-container-color, var(--md-sys-color-secondary-container, #e8def8))}.selected:not(.disabled) ::slotted(*){color:var(--md-menu-item-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b))}@media(forced-colors: active){:host([disabled]),:host([disabled]) slot{color:GrayText;opacity:1}.list-item{position:relative}.list-item.selected::before{content:"";position:absolute;inset:0;box-sizing:border-box;border-radius:inherit;pointer-events:none;border:3px double CanvasText}}
`;
class Ba {
  constructor(e, t) {
    this.host = e, this.internalTypeaheadText = null, this.onClick = () => {
      this.host.keepOpen || this.host.dispatchEvent(Ar(this.host, { kind: wa }));
    }, this.onKeydown = (r) => {
      if (this.host.href && r.code === "Enter") {
        const o = this.getInteractiveElement();
        o instanceof HTMLAnchorElement && o.click();
      }
      if (r.defaultPrevented) return;
      const s = r.code;
      this.host.keepOpen && s !== "Escape" || gs(s) && (r.preventDefault(), this.host.dispatchEvent(Ar(this.host, { kind: Ea, key: s })));
    }, this.getHeadlineElements = t.getHeadlineElements, this.getSupportingTextElements = t.getSupportingTextElements, this.getDefaultElements = t.getDefaultElements, this.getInteractiveElement = t.getInteractiveElement, this.host.addController(this);
  }
  get typeaheadText() {
    if (this.internalTypeaheadText !== null) return this.internalTypeaheadText;
    const e = this.getHeadlineElements(), t = [];
    return e.forEach(((r) => {
      r.textContent && r.textContent.trim() && t.push(r.textContent.trim());
    })), t.length === 0 && this.getDefaultElements().forEach(((r) => {
      r.textContent && r.textContent.trim() && t.push(r.textContent.trim());
    })), t.length === 0 && this.getSupportingTextElements().forEach(((r) => {
      r.textContent && r.textContent.trim() && t.push(r.textContent.trim());
    })), t.join(" ");
  }
  get tagName() {
    switch (this.host.type) {
      case "link":
        return "a";
      case "button":
        return "button";
      default:
        return "li";
    }
  }
  get role() {
    return this.host.type === "option" ? "option" : "menuitem";
  }
  hostConnected() {
    this.host.toggleAttribute("md-menu-item", !0);
  }
  hostUpdate() {
    this.host.href && (this.host.type = "link");
  }
  setTypeaheadText(e) {
    this.internalTypeaheadText = e;
  }
}
class Ua {
  get role() {
    return this.menuItemController.role;
  }
  get typeaheadText() {
    return this.menuItemController.typeaheadText;
  }
  setTypeaheadText(e) {
    this.menuItemController.setTypeaheadText(e);
  }
  get displayText() {
    return this.internalDisplayText !== null ? this.internalDisplayText : this.menuItemController.typeaheadText;
  }
  setDisplayText(e) {
    this.internalDisplayText = e;
  }
  constructor(e, t) {
    this.host = e, this.internalDisplayText = null, this.firstUpdate = !0, this.onClick = () => {
      this.menuItemController.onClick();
    }, this.onKeydown = (r) => {
      this.menuItemController.onKeydown(r);
    }, this.lastSelected = this.host.selected, this.menuItemController = new Ba(e, t), e.addController(this);
  }
  hostUpdate() {
    this.lastSelected !== this.host.selected && (this.host.ariaSelected = this.host.selected ? "true" : "false");
  }
  hostUpdated() {
    this.lastSelected === this.host.selected || this.firstUpdate || (this.host.selected ? this.host.dispatchEvent(new Event("request-selection", { bubbles: !0, composed: !0 })) : this.host.dispatchEvent(new Event("request-deselection", { bubbles: !0, composed: !0 }))), this.lastSelected = this.host.selected, this.firstUpdate = !1;
  }
}
const Na = Ft(U);
class Q extends Na {
  constructor() {
    super(...arguments), this.disabled = !1, this.isMenuItem = !0, this.selected = !1, this.value = "", this.type = "option", this.selectOptionController = new Ua(this, { getHeadlineElements: () => this.headlineElements, getSupportingTextElements: () => this.supportingTextElements, getDefaultElements: () => this.defaultElements, getInteractiveElement: () => this.listItemRoot });
  }
  get typeaheadText() {
    return this.selectOptionController.typeaheadText;
  }
  set typeaheadText(e) {
    this.selectOptionController.setTypeaheadText(e);
  }
  get displayText() {
    return this.selectOptionController.displayText;
  }
  set displayText(e) {
    this.selectOptionController.setDisplayText(e);
  }
  render() {
    return this.renderListItem(y`
      <md-item>
        <div slot="container">
          ${this.renderRipple()} ${this.renderFocusRing()}
        </div>
        <slot name="start" slot="start"></slot>
        <slot name="end" slot="end"></slot>
        ${this.renderBody()}
      </md-item>
    `);
  }
  renderListItem(e) {
    return y`
      <li
        id="item"
        tabindex=${this.disabled ? -1 : 0}
        role=${this.selectOptionController.role}
        aria-label=${this.ariaLabel || R}
        aria-selected=${this.ariaSelected || R}
        aria-checked=${this.ariaChecked || R}
        aria-expanded=${this.ariaExpanded || R}
        aria-haspopup=${this.ariaHasPopup || R}
        class="list-item ${ot(this.getRenderClasses())}"
        @click=${this.selectOptionController.onClick}
        @keydown=${this.selectOptionController.onKeydown}
        >${e}</li
      >
    `;
  }
  renderRipple() {
    return y` <md-ripple
      part="ripple"
      for="item"
      ?disabled=${this.disabled}></md-ripple>`;
  }
  renderFocusRing() {
    return y` <md-focus-ring
      part="focus-ring"
      for="item"
      inward></md-focus-ring>`;
  }
  getRenderClasses() {
    return { disabled: this.disabled, selected: this.selected };
  }
  renderBody() {
    return y`
      <slot></slot>
      <slot name="overline" slot="overline"></slot>
      <slot name="headline" slot="headline"></slot>
      <slot name="supporting-text" slot="supporting-text"></slot>
      <slot
        name="trailing-supporting-text"
        slot="trailing-supporting-text"></slot>
    `;
  }
  focus() {
    var e;
    (e = this.listItemRoot) === null || e === void 0 || e.focus();
  }
}
Q.shadowRootOptions = { ...U.shadowRootOptions, delegatesFocus: !0 }, h([g({ type: Boolean, reflect: !0 })], Q.prototype, "disabled", void 0), h([g({ type: Boolean, attribute: "md-menu-item", reflect: !0 })], Q.prototype, "isMenuItem", void 0), h([g({ type: Boolean })], Q.prototype, "selected", void 0), h([g()], Q.prototype, "value", void 0), h([J(".list-item")], Q.prototype, "listItemRoot", void 0), h([At({ slot: "headline" })], Q.prototype, "headlineElements", void 0), h([At({ slot: "supporting-text" })], Q.prototype, "supportingTextElements", void 0), h([/* @__PURE__ */ (function(i) {
  return (e, t) => {
    const { slot: r } = i ?? {}, s = "slot" + (r ? `[name=${r}]` : ":not([name])");
    return Fr(e, t, { get() {
      var o;
      const a = (o = this.renderRoot) === null || o === void 0 ? void 0 : o.querySelector(s);
      return a?.assignedNodes(i) ?? [];
    } });
  };
})({ slot: "" })], Q.prototype, "defaultElements", void 0), h([g({ attribute: "typeahead-text" })], Q.prototype, "typeaheadText", null), h([g({ attribute: "display-text" })], Q.prototype, "displayText", null);
class Tr extends Q {
}
Tr.styles = [za], customElements.define("ew-select-option", Tr);
const Ha = Ft(U);
class ee extends Ha {
  constructor() {
    super(...arguments), this.value = 0, this.max = 1, this.indeterminate = !1, this.fourColor = !1;
  }
  render() {
    const { ariaLabel: e } = this;
    return y`
      <div
        class="progress ${ot(this.getRenderClasses())}"
        role="progressbar"
        aria-label="${e || R}"
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${this.indeterminate ? R : this.value}
        >${this.renderIndicator()}</div
      >
    `;
  }
  getRenderClasses() {
    return { indeterminate: this.indeterminate, "four-color": this.fourColor };
  }
}
h([g({ type: Number })], ee.prototype, "value", void 0), h([g({ type: Number })], ee.prototype, "max", void 0), h([g({ type: Boolean })], ee.prototype, "indeterminate", void 0), h([g({ type: Boolean, attribute: "four-color" })], ee.prototype, "fourColor", void 0);
class qa extends ee {
  renderIndicator() {
    return this.indeterminate ? this.renderIndeterminateContainer() : this.renderDeterminateContainer();
  }
  renderDeterminateContainer() {
    const e = 100 * (1 - this.value / this.max);
    return y`
      <svg viewBox="0 0 4800 4800">
        <circle class="track" pathLength="100"></circle>
        <circle
          class="active-track"
          pathLength="100"
          stroke-dashoffset=${e}></circle>
      </svg>
    `;
  }
  renderIndeterminateContainer() {
    return y` <div class="spinner">
      <div class="left">
        <div class="circle"></div>
      </div>
      <div class="right">
        <div class="circle"></div>
      </div>
    </div>`;
  }
}
const Ga = N`:host{--_active-indicator-color: var(--md-circular-progress-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-width: var(--md-circular-progress-active-indicator-width, 10);--_four-color-active-indicator-four-color: var(--md-circular-progress-four-color-active-indicator-four-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_four-color-active-indicator-one-color: var(--md-circular-progress-four-color-active-indicator-one-color, var(--md-sys-color-primary, #6750a4));--_four-color-active-indicator-three-color: var(--md-circular-progress-four-color-active-indicator-three-color, var(--md-sys-color-tertiary, #7d5260));--_four-color-active-indicator-two-color: var(--md-circular-progress-four-color-active-indicator-two-color, var(--md-sys-color-primary-container, #eaddff));--_size: var(--md-circular-progress-size, 48px);display:inline-flex;vertical-align:middle;width:var(--_size);height:var(--_size);position:relative;align-items:center;justify-content:center;contain:strict;content-visibility:auto}.progress{flex:1;align-self:stretch;margin:4px}.progress,.spinner,.left,.right,.circle,svg,.track,.active-track{position:absolute;inset:0}svg{transform:rotate(-90deg)}circle{cx:50%;cy:50%;r:calc(50%*(1 - var(--_active-indicator-width)/100));stroke-width:calc(var(--_active-indicator-width)*1%);stroke-dasharray:100;fill:rgba(0,0,0,0)}.active-track{transition:stroke-dashoffset 500ms cubic-bezier(0, 0, 0.2, 1);stroke:var(--_active-indicator-color)}.track{stroke:rgba(0,0,0,0)}.progress.indeterminate{animation:linear infinite linear-rotate;animation-duration:1568.2352941176ms}.spinner{animation:infinite both rotate-arc;animation-duration:5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.left{overflow:hidden;inset:0 50% 0 0}.right{overflow:hidden;inset:0 0 0 50%}.circle{box-sizing:border-box;border-radius:50%;border:solid calc(var(--_active-indicator-width)/100*(var(--_size) - 8px));border-color:var(--_active-indicator-color) var(--_active-indicator-color) rgba(0,0,0,0) rgba(0,0,0,0);animation:expand-arc;animation-iteration-count:infinite;animation-fill-mode:both;animation-duration:1333ms,5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.four-color .circle{animation-name:expand-arc,four-color}.left .circle{rotate:135deg;inset:0 -100% 0 0}.right .circle{rotate:100deg;inset:0 0 0 -100%;animation-delay:-666.5ms,0ms}@media(forced-colors: active){.active-track{stroke:CanvasText}.circle{border-color:CanvasText CanvasText Canvas Canvas}}@keyframes expand-arc{0%{transform:rotate(265deg)}50%{transform:rotate(130deg)}100%{transform:rotate(265deg)}}@keyframes rotate-arc{12.5%{transform:rotate(135deg)}25%{transform:rotate(270deg)}37.5%{transform:rotate(405deg)}50%{transform:rotate(540deg)}62.5%{transform:rotate(675deg)}75%{transform:rotate(810deg)}87.5%{transform:rotate(945deg)}100%{transform:rotate(1080deg)}}@keyframes linear-rotate{to{transform:rotate(360deg)}}@keyframes four-color{0%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}15%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}25%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}40%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}50%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}65%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}75%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}90%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}100%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}}
`;
class $r extends qa {
}
$r.styles = [Ga], customElements.define("ew-circular-progress", $r);
class Le extends U {
  render() {
    return y`
      <div>
        <ew-circular-progress
          active
          ?indeterminate=${this.progress === void 0}
          .value=${this.progress !== void 0 ? this.progress / 100 : void 0}
        ></ew-circular-progress>
        ${this.progress !== void 0 ? y`<div>${this.progress}%</div>` : ""}
      </div>
      ${this.label}
    `;
  }
}
Le.styles = N`
    :host {
      display: flex;
      flex-direction: column;
      text-align: center;
    }
    ew-circular-progress {
      margin-bottom: 16px;
    }
  `, h([g()], Le.prototype, "label", void 0), h([g()], Le.prototype, "progress", void 0), customElements.define("ewt-page-progress", Le);
class Oe extends U {
  render() {
    return y`
      <div class="icon">${this.icon}</div>
      ${this.label}
    `;
  }
}
Oe.styles = N`
    :host {
      display: flex;
      flex-direction: column;
      text-align: center;
    }
    .icon {
      font-size: 50px;
      line-height: 80px;
      color: black;
    }
  `, h([g()], Oe.prototype, "icon", void 0), h([g()], Oe.prototype, "label", void 0), customElements.define("ewt-page-message", Oe);
const Wa = V`
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
    />
  </svg>
`, Za = V`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q95-97 219.5-148.5T480-800q137 0 261 51t219 149L480-120ZM174-540q67-48 145-74t161-26q83 0 161 26t145 74l58-58q-79-60-172-91t-192-31q-99 0-192 31t-172 91l58 58Z"
    />
  </svg>
`, Va = V`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM232-482q53-38 116-59.5T480-563q69 0 132 21.5T728-482l116-116q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l116 116Z"
    />
  </svg>
`, Ka = V`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM299-415q38-28 84-43.5t97-15.5q51 0 97 15.5t84 43.5l183-183q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l183 183Z"
    />
  </svg>
`, ja = V`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM361-353q25-18 55.5-28t63.5-10q33 0 63.5 10t55.5 28l245-245q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l245 245Z"
    />
  </svg>
`, Ya = V`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"
    />
  </svg>
`, Xa = V`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M240-160h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM240-160v-400 400Zm0 80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h280v-80q0-83 58.5-141.5T720-920q83 0 141.5 58.5T920-720h-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80h120q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Z"
    />
  </svg>
`, Lr = V`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
  </svg>
`, Ja = V`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z" />
  </svg>
`, Or = V`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M20,19V7H4V19H20M20,3A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5C2,3.89 2.9,3 4,3H20M13,17V15H18V17H13M9.58,13L5.57,9H8.4L11.7,12.3C12.09,12.69 12.09,13.33 11.7,13.72L8.42,17H5.59L9.58,13Z" />
  </svg>
`, Dr = V`
  <svg slot="start" viewBox="0 0 24 24">
  <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
  </svg>
`, Mr = V`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="m12.151 1.5882c-.3262 0-.6523.1291-.8996.3867l-8.3848 8.7354c-.0619.0644-.1223.1368-.1807.2154-.0588.0789-.1151.1638-.1688.2534-.2593.4325-.4552.9749-.5232 1.4555-.0026.018-.0076.0369-.0094.0548-.0121.0987-.0184.1944-.0184.2857v8.0124a1.2731 1.2731 0 001.2731 1.2731h7.8313l-3.4484-3.593a1.7399 1.7399 0 111.0803-1.125l2.6847 2.7972v-10.248a1.7399 1.7399 0 111.5276-0v7.187l2.6702-2.782a1.7399 1.7399 0 111.0566 1.1505l-3.7269 3.8831v2.7299h8.174a1.2471 1.2471 0 001.2471-1.2471v-8.0375c0-.0912-.0059-.1868-.0184-.2855-.0603-.4935-.2636-1.0617-.5326-1.5105-.0537-.0896-.1101-.1745-.1684-.253-.0588-.079-.1191-.1513-.181-.2158l-8.3848-8.7363c-.2473-.2577-.5735-.3866-.8995-.3864" />
  </svg>
`, Qa = V`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M15,14C17.67,14 23,15.33 23,18V20H7V18C7,15.33 12.33,14 15,14M15,12A4,4 0 0,1 11,8A4,4 0 0,1 15,4A4,4 0 0,1 19,8A4,4 0 0,1 15,12M5,9.59L7.12,7.46L8.54,8.88L6.41,11L8.54,13.12L7.12,14.54L5,12.41L2.88,14.54L1.46,13.12L3.59,11L1.46,8.88L2.88,7.46L5,9.59Z" />
  </svg>
`, tn = V`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
  </svg>
`, en = [73, 77, 80, 82, 79, 86, 1];
var Ut, st;
(function(i) {
  i[i.CURRENT_STATE = 1] = "CURRENT_STATE", i[i.ERROR_STATE = 2] = "ERROR_STATE", i[i.RPC = 3] = "RPC", i[i.RPC_RESULT = 4] = "RPC_RESULT";
})(Ut || (Ut = {})), (function(i) {
  i[i.STOPPED = 0] = "STOPPED", i[i.READY = 2] = "READY", i[i.PROVISIONING = 3] = "PROVISIONING", i[i.PROVISIONED = 4] = "PROVISIONED";
})(st || (st = {}));
const rn = { 0: "NO_ERROR", 1: "INVALID_RPC_PACKET", 2: "UNKNOWN_RPC_COMMAND", 3: "UNABLE_TO_CONNECT", 5: "BAD_HOSTNAME", 254: "TIMEOUT", 255: "UNKNOWN_ERROR" };
class ys extends Error {
  constructor() {
    super("Port is not ready");
  }
}
const Pr = (i) => "[" + i.map(((e) => ((t, r = 2) => {
  let s = t.toString(16).toUpperCase();
  return s.startsWith("-") ? "-0x" + s.substring(1).padStart(r, "0") : "0x" + s.padStart(r, "0");
})(e))).join(", ") + "]", xs = (i) => i.sort(((e, t) => e.name.toLocaleLowerCase().localeCompare(t.name.toLocaleLowerCase()))), sn = (i, e) => {
  const t = /* @__PURE__ */ new Map();
  for (const r of i) t.set(r.name, r);
  for (const r of e) t.set(r.name, r);
  return xs(Array.from(t.values()));
}, on = (i, e) => i.length !== e.length || i.some(((t, r) => t.name !== e[r].name || t.rssi !== e[r].rssi || t.secured !== e[r].secured));
class an extends EventTarget {
  get error() {
    return this._error;
  }
  set error(e) {
    this._error = e, this.dispatchEvent(new CustomEvent("error-changed", { detail: this._error }));
  }
  constructor(e, t) {
    if (super(), this.port = e, this.logger = t, this._error = 0, this._rpcLock = Promise.resolve(), e.readable === null) throw new Error("Port is not readable");
    if (e.writable === null) throw new Error("Port is not writable");
  }
  async initialize(e = 1e3) {
    if (this.logger.log("Initializing Improv Serial"), this._processInput(), this._reader === void 0) throw new ys();
    let t;
    try {
      await new Promise((async (r, s) => {
        setTimeout((() => s(new Error("Improv Wi-Fi Serial not detected"))), e), t = setInterval((() => this._sendRPC(2, [])), 1e3), await this.requestCurrentState(), r(void 0);
      })), clearInterval(t), await this.requestInfo();
    } catch (r) {
      throw await this.close(), r;
    } finally {
      clearInterval(t);
    }
    return this.info;
  }
  async close() {
    this._reader && await new Promise(((e) => {
      this._reader.cancel(), this.addEventListener("disconnect", e, { once: !0 });
    }));
  }
  async requestCurrentState() {
    var e;
    const t = new AbortController();
    let r;
    try {
      await new Promise(((s, o) => {
        this.addEventListener("state-changed", (() => s()), { once: !0, signal: t.signal }), r = this._sendRPCWithResponse(2, []), r.catch(o);
      }));
    } catch (s) {
      throw new Error(`Error fetching current state: ${s}`);
    } finally {
      t.abort();
    }
    this.state === st.PROVISIONED ? this.nextUrl = (await r)[0] : (e = this._rpcFeedback) === null || e === void 0 || e.resolve([]);
  }
  async requestInfo(e) {
    const t = await this._sendRPCWithResponse(3, [], e);
    this.info = { firmware: t[0], version: t[1], name: t[3], chipFamily: t[2], osName: t.length > 4 ? t[4] : null, osVersion: t.length > 5 ? t[5] : null };
  }
  async provision(e, t, r) {
    const s = new TextEncoder(), o = s.encode(e), a = s.encode(t), n = [o.length, ...o, a.length, ...a], d = await this._sendRPCWithResponse(1, n, r);
    this.nextUrl = d[0];
  }
  async scan(e) {
    const t = (await this._sendRPCWithMultipleResponses(4, [], e)).map((([r, s, o]) => ({ name: r, rssi: parseInt(s), secured: o !== "NO" })));
    return xs(t);
  }
  subscribeSSIDs(e) {
    let t, r, s = !0;
    const o = (async () => {
      for (; s; ) {
        let a;
        try {
          a = await this.scan(3e4);
        } catch (d) {
          this.logger.error("Error while scanning for Wi-Fi networks", d), s && t === void 0 && e(null);
          break;
        }
        if (!s) break;
        const n = t === void 0 ? a : sn(t, a);
        (t === void 0 || on(t, n)) && (t = n, e(n)), await new Promise(((d) => {
          r = d, setTimeout(d, 3e3);
        }));
      }
    })();
    return () => (s = !1, r?.(), o);
  }
  async getHostname(e) {
    return (await this._sendRPCWithResponse(5, [], e))[0];
  }
  async setHostname(e, t) {
    const r = new TextEncoder();
    return (await this._sendRPCWithResponse(5, [...r.encode(e)], t))[0];
  }
  async getDeviceName(e) {
    return (await this._sendRPCWithResponse(6, [], e))[0];
  }
  async setDeviceName(e, t) {
    const r = new TextEncoder(), s = await this._sendRPCWithResponse(6, [...r.encode(e)], t);
    return this.info && (this.info.name = s[0]), s[0];
  }
  async requestNetworkState(e) {
    const t = await this._sendRPCWithResponse(7, [], e), r = parseInt(t[0]);
    return { online: (1 & r) != 0, supportsWifi: (2 & r) != 0, supportsEthernet: (4 & r) != 0, supportsThread: (8 & r) != 0, supportsModem: (16 & r) != 0, urls: t.slice(1) };
  }
  _sendRPC(e, t) {
    this.writePacketToStream(Ut.RPC, [e, t.length, ...t]);
  }
  _enqueueRPC(e, t) {
    const r = () => this._awaitRPCResultWithTimeout(e(), t).finally((() => {
      this._rpcFeedback = void 0;
    })), s = this._rpcLock.then(r, r);
    return this._rpcLock = s.catch((() => {
    })), s;
  }
  _sendRPCWithResponse(e, t, r = 3e4) {
    return this._enqueueRPC((() => new Promise(((s, o) => {
      this._rpcFeedback = { command: e, resolve: s, reject: o }, this._sendRPC(e, t);
    }))), r);
  }
  _sendRPCWithMultipleResponses(e, t, r = 3e4) {
    return this._enqueueRPC((() => new Promise(((s, o) => {
      this._rpcFeedback = { command: e, resolve: s, reject: o, receivedData: [] }, this._sendRPC(e, t);
    }))), r);
  }
  async _awaitRPCResultWithTimeout(e, t) {
    if (!t) return await e;
    const r = setTimeout((() => this._setError(254)), t);
    try {
      return await e;
    } finally {
      clearTimeout(r);
    }
  }
  async _processInput() {
    this.logger.debug("Starting read loop"), this._reader = this.port.readable.getReader();
    try {
      let e, t = [], r = 0;
      for (; ; ) {
        const { value: s, done: o } = await this._reader.read();
        if (o) break;
        if (s && s.length !== 0) for (const a of s) {
          if (e === !1) {
            a === 10 && (e = void 0);
            continue;
          }
          if (e === !0) {
            t.push(a), t.length === r && (this._handleIncomingPacket(t), e = void 0, t = []);
            continue;
          }
          if (a === 10) {
            t = [];
            continue;
          }
          if (t.push(a), t.length === 9) {
            if (e = String.fromCharCode(...t.slice(0, 6)) === "IMPROV", !e) {
              t = [];
              continue;
            }
            r = 9 + t[8] + 1;
          }
        }
      }
    } catch (e) {
      this.logger.error("Error while reading serial port", e);
    } finally {
      this._reader.releaseLock(), this._reader = void 0;
    }
    this.logger.debug("Finished read loop"), this.dispatchEvent(new Event("disconnect"));
  }
  _handleIncomingPacket(e) {
    const t = e.slice(6), r = t[0], s = t[1], o = t[2], a = t.slice(3, 3 + o);
    if (this.logger.debug("PROCESS", { version: r, packetType: s, packetLength: o, data: Pr(a) }), r !== 1) return void this.logger.error("Received unsupported version", r);
    let n = t[3 + o], d = 0;
    for (let l = 0; l < e.length - 1; l++) d += e[l];
    if (d &= 255, d === n) if (s === Ut.CURRENT_STATE) this.state = a[0], this.dispatchEvent(new CustomEvent("state-changed", { detail: this.state }));
    else if (s === Ut.ERROR_STATE) this._setError(a[0]);
    else if (s === Ut.RPC_RESULT) {
      if (!this._rpcFeedback) return void this.logger.error("Received result while not waiting for one");
      const l = a[0];
      if (l !== this._rpcFeedback.command) return void this.logger.error(`Received result for command ${l} but expected ${this._rpcFeedback.command}`);
      const c = [], f = a[1], m = new TextDecoder("utf-8");
      let p = 2;
      for (; p < 2 + f; ) c.push(m.decode(new Uint8Array(a.slice(p + 1, p + a[p] + 1)))), p += a[p] + 1;
      "receivedData" in this._rpcFeedback ? c.length > 0 ? this._rpcFeedback.receivedData.push(c) : this._rpcFeedback.resolve(this._rpcFeedback.receivedData) : this._rpcFeedback.resolve(c);
    } else this.logger.error("Unable to handle packet", t);
    else this.logger.error(`Received invalid checksum ${n}. Expected ${d}`);
  }
  async writePacketToStream(e, t) {
    const r = new Uint8Array([...en, e, t.length, ...t, 0, 0]);
    r[r.length - 2] = 255 & r.reduce(((o, a) => o + a), 0), r[r.length - 1] = 10, this.logger.debug("Writing to stream:", Pr(new Array(...r)));
    const s = this.port.writable.getWriter();
    await s.write(r);
    try {
      s.releaseLock();
    } catch (o) {
      console.error("Ignoring release lock error", o);
    }
  }
  _setError(e) {
    e > 0 && this._rpcFeedback && this._rpcFeedback.reject(rn[e] || `UNKNOWN_ERROR (${e})`), this.error = e;
  }
}
const Yt = async (i, e) => {
  await i.setRTS(!0), await Ht(100), await e.after();
}, nn = (i, e = "") => {
  const t = new Blob([i], { type: "text/plain" }), r = URL.createObjectURL(t);
  ((s, o = "") => {
    const a = document.createElement("a");
    a.target = "_blank", a.href = s, a.download = o, document.body.appendChild(a), a.dispatchEvent(new MouseEvent("click")), document.body.removeChild(a);
  })(r, e), setTimeout((() => URL.revokeObjectURL(r)), 0);
};
console.log("ESP Web Tools 10.4.0 by Open Home Foundation; https://esphome.github.io/esp-web-tools/");
const bi = "⚠️";
class j extends U {
  constructor() {
    super(...arguments), this.logger = console, this._state = "DASHBOARD", this._installErase = !1, this._installConfirmed = !1, this._provisionForce = !1, this._wasProvisioned = !1, this._busy = !1, this._selectedSsid = null, this._manualSsid = "", this._bodyOverflow = null, this._handleDisconnect = () => {
      this._state = "ERROR", this._error = "Disconnected";
    };
  }
  render() {
    if (!this.port) return y``;
    let e, t, r = !1;
    return this._client === void 0 && this._state !== "INSTALL" && this._state !== "LOGS" ? this._error ? [e, t] = this._renderError(this._error) : t = this._renderProgress("Connecting") : this._state === "INSTALL" ? [e, t, r] = this._renderInstall() : this._state === "ASK_ERASE" ? [e, t] = this._renderAskErase() : this._state === "ERROR" ? [e, t] = this._renderError(this._error) : this._state === "DASHBOARD" ? [e, t, r] = this._client ? this._renderDashboard() : this._renderDashboardNoImprov() : this._state === "PROVISION" ? [e, t] = this._renderProvision() : this._state === "LOGS" && ([e, t] = this._renderLogs()), y`
      <ew-dialog
        open
        .heading=${e}
        @cancel=${this._preventDefault}
        @closed=${this._handleClose}
      >
        ${e ? y`<div slot="headline">${e}</div>` : ""}
        ${r ? y`
              <ew-icon-button slot="headline" @click=${this._closeDialog}>
                ${Wa}
              </ew-icon-button>
            ` : ""}
        ${t}
      </ew-dialog>
    `;
  }
  _renderProgress(e, t) {
    return y`
      <ewt-page-progress
        slot="content"
        .label=${e}
        .progress=${t}
      ></ewt-page-progress>
    `;
  }
  _renderError(e) {
    return ["Error", y`
      <ewt-page-message
        slot="content"
        .icon=${bi}
        .label=${e}
      ></ewt-page-message>
      <div slot="actions">
        <ew-text-button @click=${this._closeDialog}>Close</ew-text-button>
      </div>
    `];
  }
  _renderDashboard() {
    const e = this._manifest.name;
    let t;
    return t = y`
      <div slot="content">
        <ew-list>
          <ew-list-item>
            <div slot="headline">Connected to ${this._info.name}</div>
            <div slot="supporting-text">
              ${this._info.firmware}&nbsp;${this._info.version}
              (${this._info.chipFamily})
            </div>
          </ew-list-item>
          ${this._isSameVersion ? "" : y`
                <ew-list-item
                  type="button"
                  @click=${() => {
      this._isSameFirmware ? this._startInstall(!1) : this._manifest.new_install_prompt_erase ? this._state = "ASK_ERASE" : this._startInstall(!0);
    }}
                >
                  ${Lr}
                  <div slot="headline">
                    ${this._isSameFirmware ? `Update ${this._manifest.name}` : `Install ${this._manifest.name}`}
                  </div>
                </ew-list-item>
              `}
          ${this._client.nextUrl === void 0 ? "" : y`
                <ew-list-item
                  type="link"
                  href=${this._client.nextUrl}
                  target="_blank"
                >
                  ${Dr}
                  <div slot="headline">Visit Device</div>
                </ew-list-item>
              `}
          ${this._manifest.home_assistant_domain && this._client.state === st.PROVISIONED ? y`
                <ew-list-item
                  type="link"
                  href=${`https://my.home-assistant.io/redirect/config_flow_start/?domain=${this._manifest.home_assistant_domain}`}
                  target="_blank"
                >
                  ${Mr}
                  <div slot="headline">Add to Home Assistant</div>
                </ew-list-item>
              ` : ""}
          <ew-list-item
            type="button"
            @click=${() => {
      this._state = "PROVISION", this._client.state === st.PROVISIONED && (this._provisionForce = !0);
    }}
          >
            ${Ja}
            <div slot="headline">
              ${this._client.state === st.PROVISIONED ? "Change Wi-Fi" : "Connect to Wi-Fi"}
            </div>
          </ew-list-item>
          <ew-list-item
            type="button"
            @click=${async () => {
      const r = this._client;
      r && (await this._closeClientWithoutEvents(r), await Ht(100)), this._client = void 0, this._state = "LOGS";
    }}
          >
            ${Or}
            <div slot="headline">Logs & Console</div>
          </ew-list-item>
          ${this._isSameFirmware && this._manifest.funding_url ? y`
                <ew-list-item
                  type="link"
                  href=${this._manifest.funding_url}
                  target="_blank"
                >
                  ${tn}
                  <div slot="headline">Fund Development</div>
                </ew-list-item>
              ` : ""}
          ${this._isSameVersion ? y`
                <ew-list-item
                  type="button"
                  class="danger"
                  @click=${() => this._startInstall(!0)}
                >
                  ${Qa}
                  <div slot="headline">Erase User Data</div>
                </ew-list-item>
              ` : ""}
        </ew-list>
      </div>
    `, [e, t, !0];
  }
  _renderDashboardNoImprov() {
    const e = this._manifest.name;
    let t;
    return t = y`
      <div slot="content">
        <ew-list>
          <ew-list-item
            type="button"
            @click=${() => {
      this._manifest.new_install_prompt_erase ? this._state = "ASK_ERASE" : this._startInstall(!0);
    }}
          >
            ${Lr}
            <div slot="headline">${`Install ${this._manifest.name}`}</div>
          </ew-list-item>
          <ew-list-item
            type="button"
            @click=${async () => {
      this._client = void 0, this._state = "LOGS";
    }}
          >
            ${Or}
            <div slot="headline">Logs & Console</div>
          </ew-list-item>
        </ew-list>
      </div>
    `, [e, t, !0];
  }
  _renderProvision() {
    var e;
    let t, r = "Configure Wi-Fi";
    if (this._busy) return [r, this._renderProgress("Trying to connect")];
    if (this._client.state === st.STOPPED) r = void 0, t = y`
        <div slot="content">
          <ewt-page-message
            .icon=${bi}
            .label=${y`The connected device has Wi-Fi turned off, so it can't
              be configured right now.<br />Enable the device's Wi-Fi, then try
              again.`}
          ></ewt-page-message>
        </div>
        <div slot="actions">
          <ew-text-button
            @click=${() => {
      this._state = "DASHBOARD";
    }}
          >
            Back
          </ew-text-button>
        </div>
      `;
    else if (this._provisionForce || this._client.state !== st.PROVISIONED) if (this._ssids === void 0) t = this._renderProgress("Scanning for networks");
    else {
      let s;
      switch (this._client.error) {
        case 3:
          s = "Unable to connect";
          break;
        case 254:
          s = "Timeout";
          break;
        case 0:
        case 2:
          break;
        default:
          s = `Unknown error (${this._client.error})`;
      }
      const o = (e = this._ssids) === null || e === void 0 ? void 0 : e.find(((a) => a.name === this._selectedSsid));
      t = y`
        <div slot="content">
          <div>Connect your device to the network to start using it.</div>
          ${s ? y`<p class="error">${s}</p>` : ""}
          ${this._ssids !== null ? y`
                <ew-filled-select
                  menu-positioning="fixed"
                  label="Network"
                  @change=${(a) => {
        const n = a.target.selectedIndex;
        this._selectedSsid = n === this._ssids.length ? null : this._ssids[n].name, this._manualSsid = "";
      }}
                >
                  ${this._ssids.map(((a) => {
        const n = (d = a.rssi) >= -50 ? { icon: Za, class: "signal-excellent" } : d >= -60 ? { icon: Va, class: "signal-good" } : d >= -70 ? { icon: Ka, class: "signal-fair" } : { icon: ja, class: "signal-weak" };
        var d;
        return y`
                      <ew-select-option
                        .selected=${o === a}
                        .value=${a.name}
                      >
                        <span slot="start" class=${n.class}>
                          ${n.icon}
                        </span>
                        <span slot="headline">${a.name}</span>
                        <span slot="end" class="network-details">
                          <span class="signal-strength">${a.rssi}dB</span>
                          <span
                            class=${a.secured ? "lock-secured" : "lock-unsecured"}
                          >
                            ${a.secured ? Ya : Xa}
                          </span>
                        </span>
                      </ew-select-option>
                    `;
      }))}
                  <ew-divider></ew-divider>
                  <ew-select-option .selected=${!o}>
                    Join other…
                  </ew-select-option>
                </ew-filled-select>
              ` : ""}
          ${o ? "" : y`
                  <ew-filled-text-field
                    label="Network Name"
                    name="ssid"
                    .value=${this._manualSsid}
                  ></ew-filled-text-field>
                `}
          ${!o || o.secured ? y`
                <ew-filled-text-field
                  label="Password"
                  name="password"
                  type="password"
                  @keydown=${(a) => {
        a.key === "Enter" && this._doProvision();
      }}
                ></ew-filled-text-field>
              ` : ""}
        </div>
        <div slot="actions">
          <ew-text-button
            @click=${() => {
        this._state = "DASHBOARD";
      }}
          >
            ${this._installState && this._installErase ? "Skip" : "Back"}
          </ew-text-button>
          <ew-text-button @click=${this._doProvision}>Connect</ew-text-button>
        </div>
      `;
    }
    else {
      r = void 0;
      const s = !this._wasProvisioned && (this._client.nextUrl !== void 0 || "home_assistant_domain" in this._manifest);
      t = y`
        <div slot="content">
          <ewt-page-message
            .icon=${"🎉"}
            label="Device connected to the network!"
          ></ewt-page-message>
          ${s ? y`
                <ew-list>
                  ${this._client.nextUrl === void 0 ? "" : y`
                        <ew-list-item
                          type="link"
                          href=${this._client.nextUrl}
                          target="_blank"
                          @click=${() => {
        this._state = "DASHBOARD";
      }}
                        >
                          ${Dr}
                          <div slot="headline">Visit Device</div>
                        </ew-list-item>
                      `}
                  ${this._manifest.home_assistant_domain ? y`
                        <ew-list-item
                          type="link"
                          href=${`https://my.home-assistant.io/redirect/config_flow_start/?domain=${this._manifest.home_assistant_domain}`}
                          target="_blank"
                          @click=${() => {
        this._state = "DASHBOARD";
      }}
                        >
                          ${Mr}
                          <div slot="headline">Add to Home Assistant</div>
                        </ew-list-item>
                      ` : ""}
                  <ew-list-item
                    type="button"
                    @click=${() => {
        this._state = "DASHBOARD";
      }}
                  >
                    <div slot="start" class="fake-icon"></div>
                    <div slot="headline">Skip</div>
                  </ew-list-item>
                </ew-list>
              ` : ""}
        </div>

        ${s ? "" : y`
              <div slot="actions">
                <ew-text-button
                  @click=${() => {
        this._state = "DASHBOARD";
      }}
                >
                  Continue
                </ew-text-button>
              </div>
            `}
      `;
    }
    return [r, t];
  }
  _renderAskErase() {
    return ["Erase device", y`
      <div slot="content">
        <div>
          Do you want to erase the device before installing
          ${this._manifest.name}? All data on the device will be lost.
        </div>
        <label class="formfield">
          <ew-checkbox touch-target="wrapper" class="danger"></ew-checkbox>
          Erase device
        </label>
      </div>
      <div slot="actions">
        <ew-text-button
          @click=${() => {
      this._state = "DASHBOARD";
    }}
        >
          Back
        </ew-text-button>
        <ew-text-button
          @click=${() => {
      const e = this.shadowRoot.querySelector("ew-checkbox");
      this._startInstall(e.checked);
    }}
        >
          Next
        </ew-text-button>
      </div>
    `];
  }
  _renderInstall() {
    let e, t;
    const r = !this._installErase && this._isSameFirmware;
    if (!this._installConfirmed && this._isSameVersion) e = "Erase User Data", t = y`
        <div slot="content">
          Do you want to reset your device and erase all user data from your
          device?
        </div>
        <div slot="actions">
          <ew-text-button class="danger" @click=${this._confirmInstall}>
            Erase User Data
          </ew-text-button>
        </div>
      `;
    else if (this._installConfirmed) if (this._installState && this._installState.state !== "initializing" && this._installState.state !== "preparing") if (this._installState.state === "erasing") e = "Installing", t = this._renderProgress("Erasing");
    else if (this._installState.state === "writing" || this._installState.state === "finished" && this._client === void 0) {
      let s, o;
      e = "Installing", this._installState.state === "finished" ? o = "Wrapping up" : this._installState.details.percentage < 4 ? o = "Installing" : s = this._installState.details.percentage, t = this._renderProgress(y`
          ${o ? y`${o}<br />` : ""}
          <br />
          This will take
          ${this._installState.chipFamily === "ESP8266" ? "a minute" : "2 minutes"}.<br />
          Keep this page visible to prevent slow down
        `, s);
    } else if (this._installState.state === "finished") {
      e = void 0;
      const s = this._client !== null;
      t = y`
        <ewt-page-message
          slot="content"
          .icon=${"🎉"}
          label="Installation complete!"
        ></ewt-page-message>

        <div slot="actions">
          <ew-text-button
            @click=${() => {
        this._state = s && this._installErase ? "PROVISION" : "DASHBOARD";
      }}
          >
            Next
          </ew-text-button>
        </div>
      `;
    } else this._installState.state === "error" && (e = "Installation failed", t = y`
        <ewt-page-message
          slot="content"
          .icon=${bi}
          .label=${this._installState.message}
        ></ewt-page-message>
        <div slot="actions">
          <ew-text-button
            @click=${async () => {
      this._initialize(), this._state = "DASHBOARD";
    }}
          >
            Back
          </ew-text-button>
        </div>
      `);
    else e = "Installing", t = this._renderProgress("Preparing installation");
    else {
      e = "Confirm Installation";
      const s = r ? "update to" : "install";
      t = y`
        <div slot="content">
          ${r ? y`Your device is running
                ${this._info.firmware}&nbsp;${this._info.version}.<br /><br />` : ""}
          Do you want to ${s}
          ${this._manifest.name}&nbsp;${this._manifest.version}?
          ${this._installErase ? y`<br /><br />All data on the device will be erased.` : ""}
        </div>
        <div slot="actions">
          <ew-text-button
            @click=${() => {
        this._state = "DASHBOARD";
      }}
          >
            Back
          </ew-text-button>
          <ew-text-button @click=${this._confirmInstall}>
            Install
          </ew-text-button>
        </div>
      `;
    }
    return [e, t, !1];
  }
  _renderLogs() {
    let e;
    return e = y`
      <div slot="content">
        <ewt-console .port=${this.port} .logger=${this.logger}></ewt-console>
      </div>
      <div slot="actions">
        <ew-text-button
          @click=${async () => {
      await this.shadowRoot.querySelector("ewt-console").reset();
    }}
        >
          Reset Device
        </ew-text-button>
        <ew-text-button
          @click=${() => {
      nn(this.shadowRoot.querySelector("ewt-console").logs(), "esp-web-tools-logs.txt"), this.shadowRoot.querySelector("ewt-console").reset();
    }}
        >
          Download Logs
        </ew-text-button>
        <ew-text-button
          @click=${async () => {
      await this.shadowRoot.querySelector("ewt-console").disconnect(), this._state = "DASHBOARD", this._initialize();
    }}
        >
          Back
        </ew-text-button>
      </div>
    `, ["Logs", e];
  }
  willUpdate(e) {
    e.has("_state") && (this._state !== "ERROR" && (this._error = void 0), this._state === "PROVISION" ? this._ssids = void 0 : this._provisionForce = !1, this._state === "INSTALL" && (this._installConfirmed = !1, this._installState = void 0));
  }
  get _showsProvisionForm() {
    var e;
    const t = (e = this._client) === null || e === void 0 ? void 0 : e.state;
    return t !== void 0 && t !== st.STOPPED && (this._provisionForce || t !== st.PROVISIONED);
  }
  _syncScanning() {
    const e = this._state === "PROVISION" && !this._busy && this._showsProvisionForm;
    e !== !!this._unsubSSIDs && (e ? (this._scanGraceTimeout = setTimeout((() => {
      this._scanGraceTimeout = void 0, this._ssids === void 0 && (this._ssids = [], this._selectedSsid = null);
    }), 9100), this._unsubSSIDs = this._client.subscribeSSIDs(((t) => {
      this._ssids === void 0 && t?.length === 0 && this._scanGraceTimeout || t === null && this._ssids || (this._ssids === void 0 ? this._selectedSsid = t === null ? null : ((r) => r.length ? r.reduce(((s, o) => o.rssi > s.rssi ? o : s)).name : null)(t) : this._selectedSsid === null || t?.some(((r) => r.name === this._selectedSsid)) || (this._manualSsid = this._selectedSsid, this._selectedSsid = null), this._ssids = t);
    }))) : this._stopScanning());
  }
  async _stopScanning() {
    clearTimeout(this._scanGraceTimeout), this._scanGraceTimeout = void 0;
    const e = this._unsubSSIDs;
    e && (this._unsubSSIDs = void 0, await e());
  }
  firstUpdated(e) {
    super.firstUpdated(e), this._bodyOverflow = document.body.style.overflow, document.body.style.overflow = "hidden", this._initialize();
  }
  updated(e) {
    super.updated(e), e.has("_state") && this.setAttribute("state", this._state), this._syncScanning(), this._state === "PROVISION" && (e.has("_selectedSsid") && this._selectedSsid === null ? this._focusFormElement("ew-filled-text-field[name=ssid]") : e.has("_ssids") && e.get("_ssids") === void 0 && this._focusFormElement());
  }
  _focusFormElement(e = "ew-filled-text-field, ew-filled-select") {
    const t = this.shadowRoot.querySelector(e);
    t && t.updateComplete.then((() => setTimeout((() => t.focus()), 100)));
  }
  async _initialize(e = !1) {
    if (this.port.readable === null || this.port.writable === null) return this._state = "ERROR", void (this._error = "Serial port is not readable/writable. Close any other application using it and try again.");
    try {
      this._manifest = await (async (r) => {
        const s = new URL(r, location.toString()).toString(), o = await fetch(s), a = await o.json();
        return "new_install_skip_erase" in a && (console.warn('Manifest option "new_install_skip_erase" is deprecated. Use "new_install_prompt_erase" instead.'), a.new_install_skip_erase && (a.new_install_prompt_erase = !0)), a;
      })(this.manifestPath);
    } catch {
      return this._state = "ERROR", void (this._error = "Failed to download manifest");
    }
    if (this._manifest.new_install_improv_wait_time === 0) return void (this._client = null);
    const t = new an(this.port, this.logger);
    t.addEventListener("state-changed", (() => {
      this.requestUpdate();
    })), t.addEventListener("error-changed", (() => this.requestUpdate()));
    try {
      const r = e ? this._manifest.new_install_improv_wait_time !== void 0 ? 1e3 * this._manifest.new_install_improv_wait_time : 1e4 : 1500;
      this._info = await t.initialize(r), this._client = t, t.addEventListener("disconnect", this._handleDisconnect);
    } catch (r) {
      this._info = void 0, r instanceof ys ? (this._state = "ERROR", this._error = "Serial port is not ready. Close any other application using it and try again.") : (this._client = null, this.logger.error("Improv initialization failed.", r));
    }
  }
  _startInstall(e) {
    this._state = "INSTALL", this._installErase = e, this._installConfirmed = !1;
  }
  async _confirmInstall() {
    this._installConfirmed = !0, this._installState = void 0, this._client && await this._closeClientWithoutEvents(this._client), this._client = void 0, await this.port.close(), (async (e, t, r, s, o) => {
      let a, n;
      const d = (u) => e({ ...u, manifest: s, build: a, chipFamily: n }), l = new Fi(t), c = t.getInfo(), f = c && c.usbVendorId === 12346 && c.usbProductId !== void 0 && [4097, 4098, 4099, 2, 3].includes(c.usbProductId), m = new sa({ transport: l, baudrate: 115200, enableTracing: !1 });
      window.esploader = m, d({ state: "initializing", message: "Initializing...", details: { done: !1 } });
      try {
        await m.main(), await m.flashId();
      } catch (u) {
        return console.error(u), d({ state: "error", message: "Failed to initialize. Try resetting your device or holding the BOOT button while clicking INSTALL.", details: { error: "failed_initialize", details: u } }), await Yt(l, m), void await l.disconnect();
      }
      n = m.chip.CHIP_NAME, d({ state: "initializing", message: `Initialized. Found ${n}`, details: { done: !0 } });
      const p = f ? "cdc" : "uart";
      if (a = s.builds.find(((u) => u.chipFamily === n && u.serialType === p)) || s.builds.find(((u) => u.chipFamily === n && u.serialType === void 0)), !a) return d({ state: "error", message: `Your ${n} board is not supported.`, details: { error: "not_supported", details: n } }), await Yt(l, m), void await l.disconnect();
      d({ state: "preparing", message: "Preparing installation...", details: { done: !1 } });
      const E = r.startsWith("blob:") || r.startsWith("data:") ? location.toString() : new URL(r, location.toString()).toString(), v = a.parts.map((async (u) => {
        const x = new URL(u.path, E).toString(), C = await fetch(x);
        if (!C.ok) throw new Error(`Downloading firmware ${u.path} failed: ${C.status}`);
        const b = new FileReader(), T = await C.blob();
        return new Promise(((A) => {
          b.addEventListener("load", (() => A(b.result))), b.readAsArrayBuffer(T);
        }));
      })), _ = [];
      let k = 0;
      for (let u = 0; u < v.length; u++) try {
        const x = await v[u], C = new Uint8Array(x, 0, x.byteLength);
        _.push({ data: C, address: a.parts[u].offset }), k += C.length;
      } catch (x) {
        return d({ state: "error", message: x.message, details: { error: "failed_firmware_download", details: x.message } }), await Yt(l, m), void await l.disconnect();
      }
      d({ state: "preparing", message: "Installation prepared", details: { done: !0 } }), o && (d({ state: "erasing", message: "Erasing device...", details: { done: !1 } }), await m.eraseFlash(), d({ state: "erasing", message: "Device erased", details: { done: !0 } })), d({ state: "writing", message: "Writing progress: 0%", details: { bytesTotal: k, bytesWritten: 0, percentage: 0 } });
      let w = 0;
      try {
        await m.writeFlash({ fileArray: _, flashSize: "keep", flashMode: "keep", flashFreq: "keep", eraseAll: !1, compress: !0, reportProgress: (u, x, C) => {
          const b = x / C * _[u].data.length, T = Math.floor((w + b) / k * 100);
          x !== C ? d({ state: "writing", message: `Writing progress: ${T}%`, details: { bytesTotal: k, bytesWritten: w + x, percentage: T } }) : w += b;
        } });
      } catch (u) {
        return d({ state: "error", message: u.message, details: { error: "write_failed", details: u } }), await Yt(l, m), void await l.disconnect();
      }
      d({ state: "writing", message: "Writing complete", details: { bytesTotal: k, bytesWritten: w, percentage: 100 } }), await Yt(l, m), console.log("DISCONNECT"), await l.disconnect(), d({ state: "finished", message: "All done!" });
    })(((e) => {
      this._installState = e, e.state === "finished" ? Ht(100).then((() => this.port.open({ baudRate: 115200, bufferSize: 8192 }))).then((() => this._initialize(!0))).then((() => this.requestUpdate())) : e.state === "error" && Ht(100).then((() => this.port.open({ baudRate: 115200, bufferSize: 8192 })));
    }), this.port, this.manifestPath, this._manifest, this._installErase);
  }
  async _doProvision() {
    var e;
    const t = this._selectedSsid === null ? this.shadowRoot.querySelector("ew-filled-text-field[name=ssid]").value : this._selectedSsid, r = ((e = this.shadowRoot.querySelector("ew-filled-text-field[name=password]")) === null || e === void 0 ? void 0 : e.value) || "";
    this._busy = !0, this._wasProvisioned = this._client.state === st.PROVISIONED, await this._stopScanning();
    try {
      await this._client.provision(t, r, 45e3);
    } catch {
      return;
    } finally {
      this._busy = !1, this._provisionForce = !1;
    }
  }
  _closeDialog() {
    this.shadowRoot.querySelector("ew-dialog").close();
  }
  async _handleClose() {
    this._client && await this._closeClientWithoutEvents(this._client), ((e, t, r, s) => {
      s = s || {};
      const o = new CustomEvent(t, { bubbles: s.bubbles === void 0 || s.bubbles, cancelable: !!s.cancelable, composed: s.composed === void 0 || s.composed, detail: r });
      e.dispatchEvent(o);
    })(this, "closed"), document.body.style.overflow = this._bodyOverflow, this.parentNode.removeChild(this);
  }
  get _isSameFirmware() {
    var e;
    return !!this._info && (!((e = this.overrides) === null || e === void 0) && e.checkSameFirmware ? this.overrides.checkSameFirmware(this._manifest, this._info) : this._info.firmware === this._manifest.name);
  }
  get _isSameVersion() {
    return this._isSameFirmware && this._info.version === this._manifest.version;
  }
  async _closeClientWithoutEvents(e) {
    await this._stopScanning(), e.removeEventListener("disconnect", this._handleDisconnect), await e.close();
  }
  _preventDefault(e) {
    e.preventDefault();
  }
}
j.styles = [Ss, N`
      :host {
        --mdc-dialog-max-width: 390px;
      }
      div[slot="headline"] {
        padding-right: 48px;
      }
      ew-icon-button[slot="headline"] {
        position: absolute;
        right: 4px;
        top: 8px;
      }
      ew-icon-button[slot="headline"] svg {
        padding: 8px;
        color: var(--text-color);
      }
      .dialog-nav svg {
        color: var(--text-color);
      }
      .table-row {
        display: flex;
      }
      .table-row.last {
        margin-bottom: 16px;
      }
      .table-row svg {
        width: 20px;
        margin-right: 8px;
      }
      ew-filled-text-field,
      ew-filled-select {
        display: block;
        margin-top: 16px;
      }
      ew-select-option svg {
        width: 24px;
        height: 24px;
        display: block;
      }
      .network-details {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 16px;
        color: var(--text-color);
        font-size: 12px;
      }
      .signal-excellent,
      .signal-good,
      .lock-secured {
        color: #34a853;
      }
      .signal-fair {
        color: #fbbc04;
      }
      .signal-weak,
      .lock-unsecured {
        color: var(--danger-color);
      }
      label.formfield {
        display: inline-flex;
        align-items: center;
        padding-right: 8px;
      }
      ew-list {
        margin: 0 -24px;
        padding: 0;
      }
      ew-list-item svg {
        height: 24px;
      }
      ewt-page-message + ew-list {
        padding-top: 16px;
      }
      .fake-icon {
        width: 24px;
      }
      .error {
        color: var(--danger-color);
      }
      .danger {
        --mdc-theme-primary: var(--danger-color);
        --mdc-theme-secondary: var(--danger-color);
        --md-sys-color-primary: var(--danger-color);
        --md-sys-color-on-surface: var(--danger-color);
      }
      button.link {
        background: none;
        color: inherit;
        border: none;
        padding: 0;
        font: inherit;
        text-align: left;
        text-decoration: underline;
        cursor: pointer;
      }
      :host([state="LOGS"]) ew-dialog {
        max-width: 90vw;
        max-height: 90vh;
      }
      ewt-console {
        width: calc(80vw - 48px);
        height: calc(90vh - 168px);
      }
    `], h([M()], j.prototype, "_client", void 0), h([M()], j.prototype, "_state", void 0), h([M()], j.prototype, "_installErase", void 0), h([M()], j.prototype, "_installConfirmed", void 0), h([M()], j.prototype, "_installState", void 0), h([M()], j.prototype, "_provisionForce", void 0), h([M()], j.prototype, "_error", void 0), h([M()], j.prototype, "_busy", void 0), h([M()], j.prototype, "_ssids", void 0), h([M()], j.prototype, "_selectedSsid", void 0), customElements.define("ewt-install-dialog", j);
var dn = Object.freeze({ __proto__: null, EwtInstallDialog: j });
export {
  Vo as R,
  dn as i
};
