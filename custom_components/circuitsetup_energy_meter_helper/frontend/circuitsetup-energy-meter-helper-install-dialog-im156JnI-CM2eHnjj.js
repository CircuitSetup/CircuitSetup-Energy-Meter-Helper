import { c as ct$1, j as j$1, V as V$1, t, y as yt$1, n, m as mt$1, g as gt$1, p as pt$1, W as Wt$1, b as bt$1, l as le$1, f as ft$1, J as Jt$1, X as Xt$1, a as be$1, d as W$1, O as Ot$1, e as ae$1, h as te$1, Q as Qt$1, i as de$1, K as Kt$1, k as at$1, R as Rt$1, z as zt$1, o as kt$1, I as It$1, T as Tt$1, q as q$1 } from "./circuitsetup-energy-meter-helper-styles-sT2V1cOw-CrAdtexe.js";
let T;
function L(e, t2 = z) {
  const i = $(e, t2);
  return i && (i.tabIndex = 0, i.focus()), i;
}
function O(e, t2 = z) {
  const i = M(e, t2);
  return i && (i.tabIndex = 0, i.focus()), i;
}
function D(e, t2 = z) {
  for (let i = 0; i < e.length; i++) {
    const r = e[i];
    if (0 === r.tabIndex && t2(r)) return { item: r, index: i };
  }
  return null;
}
function $(e, t2 = z) {
  for (const i of e) if (t2(i)) return i;
  return null;
}
function M(e, t2 = z) {
  for (let i = e.length - 1; i >= 0; i--) {
    const r = e[i];
    if (t2(r)) return r;
  }
  return null;
}
function P(e, t2, i = z, r = true) {
  if (t2) {
    const s = (function(e2, t3, i2 = z, r2 = true) {
      for (let s2 = 1; s2 < e2.length; s2++) {
        const o = (s2 + t3) % e2.length;
        if (o < t3 && !r2) return null;
        const a = e2[o];
        if (i2(a)) return a;
      }
      return e2[t3] ? e2[t3] : null;
    })(e, t2.index, i, r);
    return s && (s.tabIndex = 0, s.focus()), s;
  }
  return L(e, i);
}
function F(e, t2, i = z, r = true) {
  if (t2) {
    const s = (function(e2, t3, i2 = z, r2 = true) {
      for (let s2 = 1; s2 < e2.length; s2++) {
        const o = (t3 - s2 + e2.length) % e2.length;
        if (o > t3 && !r2) return null;
        const a = e2[o];
        if (i2(a)) return a;
      }
      return e2[t3] ? e2[t3] : null;
    })(e, t2.index, i, r);
    return s && (s.tabIndex = 0, s.focus()), s;
  }
  return O(e, i);
}
function z(e) {
  return !e.disabled;
}
const B = { ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowUp: "ArrowUp", ArrowRight: "ArrowRight", Home: "Home", End: "End" };
class U {
  constructor(e) {
    this.handleKeydown = (e2) => {
      const t3 = e2.key;
      if (e2.defaultPrevented || !this.isNavigableKey(t3)) return;
      const i2 = this.items;
      if (!i2.length) return;
      const r2 = D(i2, this.isActivatable);
      e2.preventDefault();
      const s2 = this.isRtl();
      let o2 = null;
      switch (t3) {
        case B.ArrowDown:
        case (s2 ? B.ArrowLeft : B.ArrowRight):
          o2 = P(i2, r2, this.isActivatable, this.wrapNavigation());
          break;
        case B.ArrowUp:
        case (s2 ? B.ArrowRight : B.ArrowLeft):
          o2 = F(i2, r2, this.isActivatable, this.wrapNavigation());
          break;
        case B.Home:
          o2 = L(i2, this.isActivatable);
          break;
        case B.End:
          o2 = O(i2, this.isActivatable);
      }
      o2 && r2 && r2.item !== o2 && (r2.item.tabIndex = -1);
    }, this.onDeactivateItems = () => {
      const e2 = this.items;
      for (const t3 of e2) this.deactivateItem(t3);
    }, this.onRequestActivation = (e2) => {
      this.onDeactivateItems();
      const t3 = e2.target;
      this.activateItem(t3), t3.focus();
    }, this.onSlotchange = () => {
      const e2 = this.items;
      let t3 = false;
      for (const i3 of e2) {
        !(!i3.disabled && i3.tabIndex > -1) || t3 ? i3.tabIndex = -1 : (t3 = true, i3.tabIndex = 0);
      }
      if (t3) return;
      const i2 = $(e2, this.isActivatable);
      i2 && (i2.tabIndex = 0);
    };
    const { isItem: t2, getPossibleItems: i, isRtl: r, deactivateItem: s, activateItem: o, isNavigableKey: a, isActivatable: n2, wrapNavigation: l } = e;
    this.isItem = t2, this.getPossibleItems = i, this.isRtl = r, this.deactivateItem = s, this.activateItem = o, this.isNavigableKey = a, this.isActivatable = n2, this.wrapNavigation = l ?? (() => true);
  }
  get items() {
    const e = this.getPossibleItems(), t2 = [];
    for (const i of e) {
      if (this.isItem(i)) {
        t2.push(i);
        continue;
      }
      const e2 = i.item;
      e2 && this.isItem(e2) && t2.push(e2);
    }
    return t2;
  }
  activateNextItem() {
    const e = this.items, t2 = D(e, this.isActivatable);
    return t2 && (t2.item.tabIndex = -1), P(e, t2, this.isActivatable, this.wrapNavigation());
  }
  activatePreviousItem() {
    const e = this.items, t2 = D(e, this.isActivatable);
    return t2 && (t2.item.tabIndex = -1), F(e, t2, this.isActivatable, this.wrapNavigation());
  }
}
const N = new Set(Object.values(B));
class H extends ct$1 {
  get items() {
    return this.listController.items;
  }
  constructor() {
    super(), this.listController = new U({ isItem: (e) => e.hasAttribute("md-list-item"), getPossibleItems: () => this.slotItems, isRtl: () => "rtl" === getComputedStyle(this).direction, deactivateItem: (e) => {
      e.tabIndex = -1;
    }, activateItem: (e) => {
      e.tabIndex = 0;
    }, isNavigableKey: (e) => N.has(e), isActivatable: (e) => !e.disabled && "text" !== e.type }), this.internals = this.attachInternals(), this.internals.role = "list", this.addEventListener("keydown", this.listController.handleKeydown);
  }
  render() {
    return j$1`
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
t([yt$1({ flatten: true })], H.prototype, "slotItems", void 0);
const q = n`:host{background:var(--md-list-container-color, var(--md-sys-color-surface, #fef7ff));color:unset;display:flex;flex-direction:column;outline:none;padding:8px 0;position:relative}
`;
class G extends H {
}
G.styles = [q], customElements.define("ew-list", G);
class W extends ct$1 {
  constructor() {
    super(...arguments), this.multiline = false;
  }
  render() {
    return j$1`
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
    let e = false, t2 = 0;
    for (const i of this.textSlots) if (Z(i) && (t2 += 1), t2 > 1) {
      e = true;
      break;
    }
    this.multiline = e;
  }
}
function Z(e) {
  for (const i of e.assignedNodes({ flatten: true })) {
    var t2;
    const e2 = i.nodeType === Node.ELEMENT_NODE, r = i.nodeType === Node.TEXT_NODE && (null === (t2 = i.textContent) || void 0 === t2 ? void 0 : t2.match(/\S/));
    if (e2 || r) return true;
  }
  return false;
}
t([mt$1({ type: Boolean, reflect: true })], W.prototype, "multiline", void 0), t([/* @__PURE__ */ (function(t2) {
  return (i, r) => gt$1(i, r, { get() {
    return (this.renderRoot ?? T ?? (T = document.createDocumentFragment())).querySelectorAll(t2);
  } });
})(".text slot")], W.prototype, "textSlots", void 0);
const V = n`:host{color:var(--md-sys-color-on-surface, #1d1b20);font-family:var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-large-size, 1rem);font-weight:var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-large-line-height, 1.5rem);align-items:center;box-sizing:border-box;display:flex;gap:16px;min-height:56px;overflow:hidden;padding:12px 16px;position:relative;text-overflow:ellipsis}:host([multiline]){min-height:72px}[name=overline]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-medium-size, 0.875rem);font-weight:var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-medium-line-height, 1.25rem)}[name=trailing-supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=container]::slotted(*){inset:0;position:absolute}.default-slot{display:inline}.default-slot,.text ::slotted(*){overflow:hidden;text-overflow:ellipsis}.text{display:flex;flex:1;flex-direction:column;overflow:hidden}
`;
let j = class extends W {
};
j.styles = [V], j = t([pt$1("ewt-item")], j);
const K = /* @__PURE__ */ Symbol.for(""), Y = (e) => {
  if ((null == e ? void 0 : e.r) === K) return null == e ? void 0 : e._$litStatic$;
}, X = (e, ...t2) => ({ _$litStatic$: t2.reduce(((t3, i, r) => t3 + ((e2) => {
  if (void 0 !== e2._$litStatic$) return e2._$litStatic$;
  throw Error(`Value passed to 'literal' function must be a 'literal' result: ${e2}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`);
})(i) + e[r + 1]), e[0]), r: K }), J = /* @__PURE__ */ new Map(), Q = /* @__PURE__ */ ((e) => (t2, ...i) => {
  const r = i.length;
  let s, o;
  const a = [], n2 = [];
  let l, d = 0, c = false;
  for (; d < r; ) {
    for (l = t2[d]; d < r && void 0 !== (o = i[d], s = Y(o)); ) l += s + t2[++d], c = true;
    d !== r && n2.push(o), a.push(l), d++;
  }
  if (d === r && a.push(t2[r]), c) {
    const e2 = a.join("$$lit$$");
    void 0 === (t2 = J.get(e2)) && (a.raw = a, J.set(e2, t2 = a)), i = n2;
  }
  return e(t2, ...i);
})(j$1), ee = Wt$1(ct$1);
class te extends ee {
  constructor() {
    super(...arguments), this.disabled = false, this.type = "text", this.isListItem = true, this.href = "", this.target = "";
  }
  get isDisabled() {
    return this.disabled && "link" !== this.type;
  }
  willUpdate(e) {
    this.href && (this.type = "link"), super.willUpdate(e);
  }
  render() {
    return this.renderListItem(j$1`
      <ewt-item>
        <div slot="container">
          ${this.renderRipple()} ${this.renderFocusRing()}
        </div>
        <slot name="start" slot="start"></slot>
        <slot name="end" slot="end"></slot>
        ${this.renderBody()}
      </ewt-item>
    `);
  }
  renderListItem(e) {
    const t2 = "link" === this.type;
    let i;
    switch (this.type) {
      case "link":
        i = X`a`;
        break;
      case "button":
        i = X`button`;
        break;
      default:
        i = X`li`;
    }
    const r = "text" !== this.type, s = t2 && this.target ? this.target : W$1;
    return Q`
      <${i}
        id="item"
        tabindex="${this.isDisabled || !r ? -1 : 0}"
        ?disabled=${this.isDisabled}
        role="listitem"
        aria-selected=${this.ariaSelected || W$1}
        aria-checked=${this.ariaChecked || W$1}
        aria-expanded=${this.ariaExpanded || W$1}
        aria-haspopup=${this.ariaHasPopup || W$1}
        class="list-item ${Ot$1(this.getRenderClasses())}"
        href=${this.href || W$1}
        target=${s}
        @focus=${this.onFocus}
      >${e}</${i}>
    `;
  }
  renderRipple() {
    return "text" === this.type ? W$1 : j$1` <ewt-ripple
      part="ripple"
      for="item"
      ?disabled=${this.isDisabled}></ewt-ripple>`;
  }
  renderFocusRing() {
    return "text" === this.type ? W$1 : j$1` <ewt-focus-ring
      @visibility-changed=${this.onFocusRingVisibilityChanged}
      part="focus-ring"
      for="item"
      inward></ewt-focus-ring>`;
  }
  onFocusRingVisibilityChanged(e) {
  }
  getRenderClasses() {
    return { disabled: this.isDisabled };
  }
  renderBody() {
    return j$1`
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
    -1 === this.tabIndex && this.dispatchEvent(new Event("request-activation", { bubbles: true, composed: true }));
  }
  focus() {
    var e;
    null === (e = this.listItemRoot) || void 0 === e || e.focus();
  }
  click() {
    this.listItemRoot ? this.listItemRoot.click() : super.click();
  }
}
te.shadowRootOptions = { ...ct$1.shadowRootOptions, delegatesFocus: true }, t([mt$1({ type: Boolean, reflect: true })], te.prototype, "disabled", void 0), t([mt$1({ reflect: true })], te.prototype, "type", void 0), t([mt$1({ type: Boolean, attribute: "md-list-item", reflect: true })], te.prototype, "isListItem", void 0), t([mt$1()], te.prototype, "href", void 0), t([mt$1()], te.prototype, "target", void 0), t([bt$1(".list-item")], te.prototype, "listItemRoot", void 0);
const ie = n`:host{display:flex;-webkit-tap-highlight-color:rgba(0,0,0,0);--md-ripple-hover-color: var(--md-list-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-list-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-list-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-list-item-pressed-state-layer-opacity, 0.12)}:host(:is([type=button]:not([disabled]),[type=link])){cursor:pointer}ewt-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;cursor:inherit;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);width:100%}.list-item.interactive{cursor:pointer}.list-item.disabled{opacity:var(--md-list-item-disabled-opacity, 0.3);pointer-events:none}[slot=container]{pointer-events:none}ewt-ripple{border-radius:inherit}ewt-item{border-radius:inherit;flex:1;height:100%;color:var(--md-list-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-list-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-list-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-list-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-list-item-one-line-container-height, 56px);padding-top:var(--md-list-item-top-space, 12px);padding-bottom:var(--md-list-item-bottom-space, 12px);padding-inline-start:var(--md-list-item-leading-space, 16px);padding-inline-end:var(--md-list-item-trailing-space, 16px)}ewt-item[multiline]{min-height:var(--md-list-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-list-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-list-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-list-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-list-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-list-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-list-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-list-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-list-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}@media(forced-colors: active){.disabled slot{color:GrayText}.list-item.disabled{color:GrayText;opacity:1}}
`;
class re extends te {
}
re.styles = [ie], customElements.define("ew-list-item", re);
class se extends ae$1 {
}
se.styles = [le$1], customElements.define("ew-divider", se);
const oe = /* @__PURE__ */ Symbol("createValidator"), ae = /* @__PURE__ */ Symbol("getValidityAnchor"), ne = /* @__PURE__ */ Symbol("privateValidator"), le = /* @__PURE__ */ Symbol("privateSyncValidity"), de = /* @__PURE__ */ Symbol("privateCustomValidationMessage");
function ce(e) {
  var t2;
  class i extends e {
    constructor() {
      super(...arguments), this[t2] = "";
    }
    get validity() {
      return this[le](), this[Kt$1].validity;
    }
    get validationMessage() {
      return this[le](), this[Kt$1].validationMessage;
    }
    get willValidate() {
      return this[le](), this[Kt$1].willValidate;
    }
    checkValidity() {
      return this[le](), this[Kt$1].checkValidity();
    }
    reportValidity() {
      return this[le](), this[Kt$1].reportValidity();
    }
    setCustomValidity(e2) {
      this[de] = e2, this[le]();
    }
    requestUpdate(e2, t3, i2) {
      super.requestUpdate(e2, t3, i2), this[le]();
    }
    firstUpdated(e2) {
      super.firstUpdated(e2), this[le]();
    }
    [(t2 = de, le)]() {
      this[ne] || (this[ne] = this[oe]());
      const { validity: e2, validationMessage: t3 } = this[ne].getValidity(), i2 = !!this[de], r = this[de] || t3;
      this[Kt$1].setValidity({ ...e2, customError: i2 }, r, this[ae]() ?? void 0);
    }
    [oe]() {
      throw new Error("Implement [createValidator]");
    }
    [ae]() {
      throw new Error("Implement [getValidityAnchor]");
    }
  }
  return i;
}
const he = /* @__PURE__ */ Symbol("getFormValue"), pe = /* @__PURE__ */ Symbol("getFormState");
function ue(e) {
  class i extends e {
    get form() {
      return this[Kt$1].form;
    }
    get labels() {
      return this[Kt$1].labels;
    }
    get name() {
      return this.getAttribute("name") ?? "";
    }
    set name(e2) {
      this.setAttribute("name", e2);
    }
    get disabled() {
      return this.hasAttribute("disabled");
    }
    set disabled(e2) {
      this.toggleAttribute("disabled", e2);
    }
    attributeChangedCallback(e2, t2, i2) {
      if ("name" !== e2 && "disabled" !== e2) super.attributeChangedCallback(e2, t2, i2);
      else {
        const i3 = "disabled" === e2 ? null !== t2 : t2;
        this.requestUpdate(e2, i3);
      }
    }
    requestUpdate(e2, t2, i2) {
      super.requestUpdate(e2, t2, i2), this[Kt$1].setFormValue(this[he](), this[pe]());
    }
    [he]() {
      throw new Error("Implement [getFormValue]");
    }
    [pe]() {
      return this[he]();
    }
    formDisabledCallback(e2) {
      this.disabled = e2;
    }
  }
  return i.formAssociated = true, t([mt$1({ noAccessor: true })], i.prototype, "name", null), t([mt$1({ type: Boolean, noAccessor: true })], i.prototype, "disabled", null), i;
}
class fe {
  constructor(e) {
    this.getCurrentState = e, this.currentValidity = { validity: {}, validationMessage: "" };
  }
  getValidity() {
    const e = this.getCurrentState();
    if (!(!this.prevState || !this.equals(this.prevState, e))) return this.currentValidity;
    const { validity: t2, validationMessage: i } = this.computeValidity(e);
    return this.prevState = this.copy(e), this.currentValidity = { validationMessage: i, validity: { badInput: t2.badInput, customError: t2.customError, patternMismatch: t2.patternMismatch, rangeOverflow: t2.rangeOverflow, rangeUnderflow: t2.rangeUnderflow, stepMismatch: t2.stepMismatch, tooLong: t2.tooLong, tooShort: t2.tooShort, typeMismatch: t2.typeMismatch, valueMissing: t2.valueMissing } }, this.currentValidity;
  }
}
class me extends fe {
  computeValidity(e) {
    return this.checkboxControl || (this.checkboxControl = document.createElement("input"), this.checkboxControl.type = "checkbox"), this.checkboxControl.checked = e.checked, this.checkboxControl.required = e.required, { validity: this.checkboxControl.validity, validationMessage: this.checkboxControl.validationMessage };
  }
  equals(e, t2) {
    return e.checked === t2.checked && e.required === t2.required;
  }
  copy({ checked: e, required: t2 }) {
    return { checked: e, required: t2 };
  }
}
const ve = Wt$1(ce(ue(Jt$1(ct$1))));
class ge extends ve {
  constructor() {
    super(), this.checked = false, this.indeterminate = false, this.required = false, this.value = "on", this.prevChecked = false, this.prevDisabled = false, this.prevIndeterminate = false, this.addEventListener("click", ((e) => {
      te$1(e) && this.input && (this.focus(), Qt$1(this.input));
    }));
  }
  update(e) {
    (e.has("checked") || e.has("disabled") || e.has("indeterminate")) && (this.prevChecked = e.get("checked") ?? this.checked, this.prevDisabled = e.get("disabled") ?? this.disabled, this.prevIndeterminate = e.get("indeterminate") ?? this.indeterminate), super.update(e);
  }
  render() {
    const e = !this.prevChecked && !this.prevIndeterminate, t2 = this.prevChecked && !this.prevIndeterminate, i = this.prevIndeterminate, r = this.checked && !this.indeterminate, o = this.indeterminate, a = Ot$1({ disabled: this.disabled, selected: r || o, unselected: !r && !o, checked: r, indeterminate: o, "prev-unselected": e, "prev-checked": t2, "prev-indeterminate": i, "prev-disabled": this.prevDisabled }), { ariaLabel: n2, ariaInvalid: l } = this;
    return j$1`
      <div class="container ${a}">
        <input
          type="checkbox"
          id="input"
          aria-checked=${o ? "mixed" : W$1}
          aria-label=${n2 || W$1}
          aria-invalid=${l || W$1}
          ?disabled=${this.disabled}
          ?required=${this.required}
          .indeterminate=${this.indeterminate}
          .checked=${this.checked}
          @input=${this.handleInput}
          @change=${this.handleChange} />

        <div class="outline"></div>
        <div class="background"></div>
        <ewt-focus-ring part="focus-ring" for="input"></ewt-focus-ring>
        <ewt-ripple for="input" ?disabled=${this.disabled}></ewt-ripple>
        <svg class="icon" viewBox="0 0 18 18" aria-hidden="true">
          <rect class="mark short" />
          <rect class="mark long" />
        </svg>
      </div>
    `;
  }
  handleInput(e) {
    const t2 = e.target;
    this.checked = t2.checked, this.indeterminate = t2.indeterminate;
  }
  handleChange(e) {
    de$1(this, e);
  }
  [he]() {
    return !this.checked || this.indeterminate ? null : this.value;
  }
  [pe]() {
    return String(this.checked);
  }
  formResetCallback() {
    this.checked = this.hasAttribute("checked");
  }
  formStateRestoreCallback(e) {
    this.checked = "true" === e;
  }
  [oe]() {
    return new me((() => this));
  }
  [ae]() {
    return this.input;
  }
}
ge.shadowRootOptions = { ...ct$1.shadowRootOptions, delegatesFocus: true }, t([mt$1({ type: Boolean })], ge.prototype, "checked", void 0), t([mt$1({ type: Boolean })], ge.prototype, "indeterminate", void 0), t([mt$1({ type: Boolean })], ge.prototype, "required", void 0), t([mt$1()], ge.prototype, "value", void 0), t([ft$1()], ge.prototype, "prevChecked", void 0), t([ft$1()], ge.prototype, "prevDisabled", void 0), t([ft$1()], ge.prototype, "prevIndeterminate", void 0), t([bt$1("input")], ge.prototype, "input", void 0);
const _e = n`:host{border-start-start-radius:var(--md-checkbox-container-shape-start-start, var(--md-checkbox-container-shape, 2px));border-start-end-radius:var(--md-checkbox-container-shape-start-end, var(--md-checkbox-container-shape, 2px));border-end-end-radius:var(--md-checkbox-container-shape-end-end, var(--md-checkbox-container-shape, 2px));border-end-start-radius:var(--md-checkbox-container-shape-end-start, var(--md-checkbox-container-shape, 2px));display:inline-flex;height:var(--md-checkbox-container-size, 18px);position:relative;vertical-align:top;width:var(--md-checkbox-container-size, 18px);-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer}:host([disabled]){cursor:default}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--md-checkbox-container-size, 18px))/2)}ewt-focus-ring{height:44px;inset:unset;width:44px}input{appearance:none;height:48px;margin:0;opacity:0;outline:none;position:absolute;width:48px;z-index:1;cursor:inherit}:host([touch-target=none]) input{height:100%;width:100%}.container{border-radius:inherit;display:flex;height:100%;place-content:center;place-items:center;position:relative;width:100%}.outline,.background,.icon{inset:0;position:absolute}.outline,.background{border-radius:inherit}.outline{border-color:var(--md-checkbox-outline-color, var(--md-sys-color-on-surface-variant, #49454f));border-style:solid;border-width:var(--md-checkbox-outline-width, 2px);box-sizing:border-box}.background{background-color:var(--md-checkbox-selected-container-color, var(--md-sys-color-primary, #6750a4))}.background,.icon{opacity:0;transition-duration:150ms,50ms;transition-property:transform,opacity;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15),linear;transform:scale(0.6)}:where(.selected) :is(.background,.icon){opacity:1;transition-duration:350ms,50ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1),linear;transform:scale(1)}ewt-ripple{border-radius:var(--md-checkbox-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));height:var(--md-checkbox-state-layer-size, 40px);inset:unset;width:var(--md-checkbox-state-layer-size, 40px);--md-ripple-hover-color: var(--md-checkbox-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-checkbox-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-pressed-opacity: var(--md-checkbox-pressed-state-layer-opacity, 0.12)}.selected ewt-ripple{--md-ripple-hover-color: var(--md-checkbox-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-hover-opacity: var(--md-checkbox-selected-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-selected-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-checkbox-selected-pressed-state-layer-opacity, 0.12)}.icon{fill:var(--md-checkbox-selected-icon-color, var(--md-sys-color-on-primary, #fff));height:var(--md-checkbox-icon-size, 18px);width:var(--md-checkbox-icon-size, 18px)}.mark.short{height:2px;transition-property:transform,height;width:2px}.mark.long{height:2px;transition-property:transform,width;width:10px}.mark{animation-duration:150ms;animation-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15);transition-duration:150ms;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15)}.selected .mark{animation-duration:350ms;animation-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1);transition-duration:350ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1)}.checked .mark,.prev-checked.unselected .mark{transform:scaleY(-1) translate(7px, -14px) rotate(45deg)}.checked .mark.short,.prev-checked.unselected .mark.short{height:5.6568542495px}.checked .mark.long,.prev-checked.unselected .mark.long{width:11.313708499px}.indeterminate .mark,.prev-indeterminate.unselected .mark{transform:scaleY(-1) translate(4px, -10px) rotate(0deg)}.prev-unselected .mark{transition-property:none}.prev-unselected.checked .mark.long{animation-name:prev-unselected-to-checked}@keyframes prev-unselected-to-checked{from{width:0}}:where(:hover) .outline{border-color:var(--md-checkbox-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-hover-outline-width, 2px)}:where(:hover) .background{background:var(--md-checkbox-selected-hover-container-color, var(--md-sys-color-primary, #6750a4))}:where(:hover) .icon{fill:var(--md-checkbox-selected-hover-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:focus-within) .outline{border-color:var(--md-checkbox-focus-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-focus-outline-width, 2px)}:where(:focus-within) .background{background:var(--md-checkbox-selected-focus-container-color, var(--md-sys-color-primary, #6750a4))}:where(:focus-within) .icon{fill:var(--md-checkbox-selected-focus-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:active) .outline{border-color:var(--md-checkbox-pressed-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-pressed-outline-width, 2px)}:where(:active) .background{background:var(--md-checkbox-selected-pressed-container-color, var(--md-sys-color-primary, #6750a4))}:where(:active) .icon{fill:var(--md-checkbox-selected-pressed-icon-color, var(--md-sys-color-on-primary, #fff))}:where(.disabled,.prev-disabled) :is(.background,.icon,.mark){animation-duration:0s;transition-duration:0s}:where(.disabled) .outline{border-color:var(--md-checkbox-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-disabled-outline-width, 2px);opacity:var(--md-checkbox-disabled-container-opacity, 0.38)}:where(.selected.disabled) .outline{visibility:hidden}:where(.selected.disabled) .background{background:var(--md-checkbox-selected-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-checkbox-selected-disabled-container-opacity, 0.38)}:where(.disabled) .icon{fill:var(--md-checkbox-selected-disabled-icon-color, var(--md-sys-color-surface, #fef7ff))}@media(forced-colors: active){.background{background-color:CanvasText}.selected.disabled .background{background-color:GrayText;opacity:1}.outline{border-color:CanvasText}.disabled .outline{border-color:GrayText;opacity:1}.icon{fill:Canvas}}
`;
class be extends ge {
}
be.styles = [_e], customElements.define("ew-checkbox", be);
class ye {
  constructor(e) {
    this.targetElement = e, this.state = { bold: false, italic: false, underline: false, strikethrough: false, foregroundColor: null, backgroundColor: null, carriageReturn: false, lines: [], secret: false };
  }
  logs() {
    return this.targetElement.innerText;
  }
  processLine(e) {
    const t2 = /(?:\033|\\033)(?:\[(.*?)[@-~]|\].*?(?:\007|\033\\))/g;
    let i = 0;
    const r = document.createElement("span");
    r.classList.add("line");
    const s = (e2) => {
      if ("" === e2) return;
      const t3 = document.createElement("span");
      if (this.state.bold && t3.classList.add("log-bold"), this.state.italic && t3.classList.add("log-italic"), this.state.underline && t3.classList.add("log-underline"), this.state.strikethrough && t3.classList.add("log-strikethrough"), this.state.secret && t3.classList.add("log-secret"), null !== this.state.foregroundColor && t3.classList.add(`log-fg-${this.state.foregroundColor}`), null !== this.state.backgroundColor && t3.classList.add(`log-bg-${this.state.backgroundColor}`), t3.appendChild(document.createTextNode(e2)), r.appendChild(t3), this.state.secret) {
        const e3 = document.createElement("span");
        e3.classList.add("log-secret-redacted"), e3.appendChild(document.createTextNode("[redacted]")), r.appendChild(e3);
      }
    };
    for (; ; ) {
      const r2 = t2.exec(e);
      if (null === r2) break;
      const o = r2.index;
      if (s(e.substring(i, o)), i = o + r2[0].length, void 0 !== r2[1]) for (const e2 of r2[1].split(";")) switch (parseInt(e2)) {
        case 0:
          this.state.bold = false, this.state.italic = false, this.state.underline = false, this.state.strikethrough = false, this.state.foregroundColor = null, this.state.backgroundColor = null, this.state.secret = false;
          break;
        case 1:
          this.state.bold = true;
          break;
        case 3:
          this.state.italic = true;
          break;
        case 4:
          this.state.underline = true;
          break;
        case 5:
          this.state.secret = true;
          break;
        case 6:
          this.state.secret = false;
          break;
        case 9:
          this.state.strikethrough = true;
          break;
        case 22:
          this.state.bold = false;
          break;
        case 23:
          this.state.italic = false;
          break;
        case 24:
          this.state.underline = false;
          break;
        case 29:
          this.state.strikethrough = false;
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
    return s(e.substring(i)), r;
  }
  processLines() {
    const e = this.targetElement.scrollTop > this.targetElement.scrollHeight - this.targetElement.offsetHeight - 50, t2 = this.state.carriageReturn, i = document.createDocumentFragment();
    if (0 != this.state.lines.length) {
      for (const e2 of this.state.lines) this.state.carriageReturn && "\n" !== e2 && i.childElementCount && i.removeChild(i.lastChild), i.appendChild(this.processLine(e2)), this.state.carriageReturn = e2.includes("\r");
      t2 && "\n" !== this.state.lines[0] ? this.targetElement.replaceChild(i, this.targetElement.lastChild) : this.targetElement.appendChild(i), this.state.lines = [], e && (this.targetElement.scrollTop = this.targetElement.scrollHeight);
    }
  }
  addLine(e) {
    0 == this.state.lines.length && setTimeout((() => this.processLines()), 0), this.state.lines.push(e);
  }
}
const xe = (e) => new Promise(((t2) => setTimeout(t2, e)));
class we {
  constructor() {
    this.chunks = "";
  }
  transform(e, t2) {
    this.chunks += e;
    const i = this.chunks.split(/\r?\n/);
    this.chunks = i.pop(), i.forEach(((e2) => t2.enqueue(e2 + "\r\n")));
  }
  flush(e) {
    e.enqueue(this.chunks);
  }
}
class Ee {
  transform(e, t2) {
    const i = /* @__PURE__ */ new Date(), r = i.getHours().toString().padStart(2, "0"), s = i.getMinutes().toString().padStart(2, "0"), o = i.getSeconds().toString().padStart(2, "0");
    t2.enqueue(`[${r}:${s}:${o}]${e}`);
  }
}
class Se extends Error {
}
function ke(e) {
  let t2 = e.length;
  for (; --t2 >= 0; ) e[t2] = 0;
}
const Ae = 256, Re = 286, Ie = 30, Ce = 15, Te = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]), Le = new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]), Oe = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]), De = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), $e = new Array(576);
ke($e);
const Me = new Array(60);
ke(Me);
const Pe = new Array(512);
ke(Pe);
const Fe = new Array(256);
ke(Fe);
const ze = new Array(29);
ke(ze);
const Be = new Array(Ie);
function Ue(e, t2, i, r, s) {
  this.static_tree = e, this.extra_bits = t2, this.extra_base = i, this.elems = r, this.max_length = s, this.has_stree = e && e.length;
}
let Ne, He, qe;
function Ge(e, t2) {
  this.dyn_tree = e, this.max_code = 0, this.stat_desc = t2;
}
ke(Be);
const We = (e) => e < 256 ? Pe[e] : Pe[256 + (e >>> 7)], Ze = (e, t2) => {
  e.pending_buf[e.pending++] = 255 & t2, e.pending_buf[e.pending++] = t2 >>> 8 & 255;
}, Ve = (e, t2, i) => {
  e.bi_valid > 16 - i ? (e.bi_buf |= t2 << e.bi_valid & 65535, Ze(e, e.bi_buf), e.bi_buf = t2 >> 16 - e.bi_valid, e.bi_valid += i - 16) : (e.bi_buf |= t2 << e.bi_valid & 65535, e.bi_valid += i);
}, je = (e, t2, i) => {
  Ve(e, i[2 * t2], i[2 * t2 + 1]);
}, Ke = (e, t2) => {
  let i = 0;
  do {
    i |= 1 & e, e >>>= 1, i <<= 1;
  } while (--t2 > 0);
  return i >>> 1;
}, Ye = (e, t2, i) => {
  const r = new Array(16);
  let s, o, a = 0;
  for (s = 1; s <= Ce; s++) a = a + i[s - 1] << 1, r[s] = a;
  for (o = 0; o <= t2; o++) {
    let t3 = e[2 * o + 1];
    0 !== t3 && (e[2 * o] = Ke(r[t3]++, t3));
  }
}, Xe = (e) => {
  let t2;
  for (t2 = 0; t2 < Re; t2++) e.dyn_ltree[2 * t2] = 0;
  for (t2 = 0; t2 < Ie; t2++) e.dyn_dtree[2 * t2] = 0;
  for (t2 = 0; t2 < 19; t2++) e.bl_tree[2 * t2] = 0;
  e.dyn_ltree[512] = 1, e.opt_len = e.static_len = 0, e.sym_next = e.matches = 0;
}, Je = (e) => {
  e.bi_valid > 8 ? Ze(e, e.bi_buf) : e.bi_valid > 0 && (e.pending_buf[e.pending++] = e.bi_buf), e.bi_buf = 0, e.bi_valid = 0;
}, Qe = (e, t2, i, r) => {
  const s = 2 * t2, o = 2 * i;
  return e[s] < e[o] || e[s] === e[o] && r[t2] <= r[i];
}, et = (e, t2, i) => {
  const r = e.heap[i];
  let s = i << 1;
  for (; s <= e.heap_len && (s < e.heap_len && Qe(t2, e.heap[s + 1], e.heap[s], e.depth) && s++, !Qe(t2, r, e.heap[s], e.depth)); ) e.heap[i] = e.heap[s], i = s, s <<= 1;
  e.heap[i] = r;
}, tt = (e, t2, i) => {
  let r, s, o, a, n2 = 0;
  if (0 !== e.sym_next) do {
    r = 255 & e.pending_buf[e.sym_buf + n2++], r += (255 & e.pending_buf[e.sym_buf + n2++]) << 8, s = e.pending_buf[e.sym_buf + n2++], 0 === r ? je(e, s, t2) : (o = Fe[s], je(e, o + Ae + 1, t2), a = Te[o], 0 !== a && (s -= ze[o], Ve(e, s, a)), r--, o = We(r), je(e, o, i), a = Le[o], 0 !== a && (r -= Be[o], Ve(e, r, a)));
  } while (n2 < e.sym_next);
  je(e, 256, t2);
}, it = (e, t2) => {
  const i = t2.dyn_tree, r = t2.stat_desc.static_tree, s = t2.stat_desc.has_stree, o = t2.stat_desc.elems;
  let a, n2, l, d = -1;
  for (e.heap_len = 0, e.heap_max = 573, a = 0; a < o; a++) 0 !== i[2 * a] ? (e.heap[++e.heap_len] = d = a, e.depth[a] = 0) : i[2 * a + 1] = 0;
  for (; e.heap_len < 2; ) l = e.heap[++e.heap_len] = d < 2 ? ++d : 0, i[2 * l] = 1, e.depth[l] = 0, e.opt_len--, s && (e.static_len -= r[2 * l + 1]);
  for (t2.max_code = d, a = e.heap_len >> 1; a >= 1; a--) et(e, i, a);
  l = o;
  do {
    a = e.heap[1], e.heap[1] = e.heap[e.heap_len--], et(e, i, 1), n2 = e.heap[1], e.heap[--e.heap_max] = a, e.heap[--e.heap_max] = n2, i[2 * l] = i[2 * a] + i[2 * n2], e.depth[l] = (e.depth[a] >= e.depth[n2] ? e.depth[a] : e.depth[n2]) + 1, i[2 * a + 1] = i[2 * n2 + 1] = l, e.heap[1] = l++, et(e, i, 1);
  } while (e.heap_len >= 2);
  e.heap[--e.heap_max] = e.heap[1], ((e2, t3) => {
    const i2 = t3.dyn_tree, r2 = t3.max_code, s2 = t3.stat_desc.static_tree, o2 = t3.stat_desc.has_stree, a2 = t3.stat_desc.extra_bits, n3 = t3.stat_desc.extra_base, l2 = t3.stat_desc.max_length;
    let d2, c, h, p, u, f, m = 0;
    for (p = 0; p <= Ce; p++) e2.bl_count[p] = 0;
    for (i2[2 * e2.heap[e2.heap_max] + 1] = 0, d2 = e2.heap_max + 1; d2 < 573; d2++) c = e2.heap[d2], p = i2[2 * i2[2 * c + 1] + 1] + 1, p > l2 && (p = l2, m++), i2[2 * c + 1] = p, c > r2 || (e2.bl_count[p]++, u = 0, c >= n3 && (u = a2[c - n3]), f = i2[2 * c], e2.opt_len += f * (p + u), o2 && (e2.static_len += f * (s2[2 * c + 1] + u)));
    if (0 !== m) {
      do {
        for (p = l2 - 1; 0 === e2.bl_count[p]; ) p--;
        e2.bl_count[p]--, e2.bl_count[p + 1] += 2, e2.bl_count[l2]--, m -= 2;
      } while (m > 0);
      for (p = l2; 0 !== p; p--) for (c = e2.bl_count[p]; 0 !== c; ) h = e2.heap[--d2], h > r2 || (i2[2 * h + 1] !== p && (e2.opt_len += (p - i2[2 * h + 1]) * i2[2 * h], i2[2 * h + 1] = p), c--);
    }
  })(e, t2), Ye(i, d, e.bl_count);
}, rt = (e, t2, i) => {
  let r, s, o = -1, a = t2[1], n2 = 0, l = 7, d = 4;
  for (0 === a && (l = 138, d = 3), t2[2 * (i + 1) + 1] = 65535, r = 0; r <= i; r++) s = a, a = t2[2 * (r + 1) + 1], ++n2 < l && s === a || (n2 < d ? e.bl_tree[2 * s] += n2 : 0 !== s ? (s !== o && e.bl_tree[2 * s]++, e.bl_tree[32]++) : n2 <= 10 ? e.bl_tree[34]++ : e.bl_tree[36]++, n2 = 0, o = s, 0 === a ? (l = 138, d = 3) : s === a ? (l = 6, d = 3) : (l = 7, d = 4));
}, st = (e, t2, i) => {
  let r, s, o = -1, a = t2[1], n2 = 0, l = 7, d = 4;
  for (0 === a && (l = 138, d = 3), r = 0; r <= i; r++) if (s = a, a = t2[2 * (r + 1) + 1], !(++n2 < l && s === a)) {
    if (n2 < d) do {
      je(e, s, e.bl_tree);
    } while (0 != --n2);
    else 0 !== s ? (s !== o && (je(e, s, e.bl_tree), n2--), je(e, 16, e.bl_tree), Ve(e, n2 - 3, 2)) : n2 <= 10 ? (je(e, 17, e.bl_tree), Ve(e, n2 - 3, 3)) : (je(e, 18, e.bl_tree), Ve(e, n2 - 11, 7));
    n2 = 0, o = s, 0 === a ? (l = 138, d = 3) : s === a ? (l = 6, d = 3) : (l = 7, d = 4);
  }
};
let ot = false;
const at = (e, t2, i, r) => {
  Ve(e, 0 + (r ? 1 : 0), 3), Je(e), Ze(e, i), Ze(e, ~i), i && e.pending_buf.set(e.window.subarray(t2, t2 + i), e.pending), e.pending += i;
};
var nt = (e) => {
  ot || ((() => {
    let e2, t2, i, r, s;
    const o = new Array(16);
    for (i = 0, r = 0; r < 28; r++) for (ze[r] = i, e2 = 0; e2 < 1 << Te[r]; e2++) Fe[i++] = r;
    for (Fe[i - 1] = r, s = 0, r = 0; r < 16; r++) for (Be[r] = s, e2 = 0; e2 < 1 << Le[r]; e2++) Pe[s++] = r;
    for (s >>= 7; r < Ie; r++) for (Be[r] = s << 7, e2 = 0; e2 < 1 << Le[r] - 7; e2++) Pe[256 + s++] = r;
    for (t2 = 0; t2 <= Ce; t2++) o[t2] = 0;
    for (e2 = 0; e2 <= 143; ) $e[2 * e2 + 1] = 8, e2++, o[8]++;
    for (; e2 <= 255; ) $e[2 * e2 + 1] = 9, e2++, o[9]++;
    for (; e2 <= 279; ) $e[2 * e2 + 1] = 7, e2++, o[7]++;
    for (; e2 <= 287; ) $e[2 * e2 + 1] = 8, e2++, o[8]++;
    for (Ye($e, 287, o), e2 = 0; e2 < Ie; e2++) Me[2 * e2 + 1] = 5, Me[2 * e2] = Ke(e2, 5);
    Ne = new Ue($e, Te, 257, Re, Ce), He = new Ue(Me, Le, 0, Ie, Ce), qe = new Ue(new Array(0), Oe, 0, 19, 7);
  })(), ot = true), e.l_desc = new Ge(e.dyn_ltree, Ne), e.d_desc = new Ge(e.dyn_dtree, He), e.bl_desc = new Ge(e.bl_tree, qe), e.bi_buf = 0, e.bi_valid = 0, Xe(e);
}, lt = (e, t2, i, r) => {
  let s, o, a = 0;
  e.level > 0 ? (2 === e.strm.data_type && (e.strm.data_type = ((e2) => {
    let t3, i2 = 4093624447;
    for (t3 = 0; t3 <= 31; t3++, i2 >>>= 1) if (1 & i2 && 0 !== e2.dyn_ltree[2 * t3]) return 0;
    if (0 !== e2.dyn_ltree[18] || 0 !== e2.dyn_ltree[20] || 0 !== e2.dyn_ltree[26]) return 1;
    for (t3 = 32; t3 < Ae; t3++) if (0 !== e2.dyn_ltree[2 * t3]) return 1;
    return 0;
  })(e)), it(e, e.l_desc), it(e, e.d_desc), a = ((e2) => {
    let t3;
    for (rt(e2, e2.dyn_ltree, e2.l_desc.max_code), rt(e2, e2.dyn_dtree, e2.d_desc.max_code), it(e2, e2.bl_desc), t3 = 18; t3 >= 3 && 0 === e2.bl_tree[2 * De[t3] + 1]; t3--) ;
    return e2.opt_len += 3 * (t3 + 1) + 5 + 5 + 4, t3;
  })(e), s = e.opt_len + 3 + 7 >>> 3, o = e.static_len + 3 + 7 >>> 3, o <= s && (s = o)) : s = o = i + 5, i + 4 <= s && -1 !== t2 ? at(e, t2, i, r) : 4 === e.strategy || o === s ? (Ve(e, 2 + (r ? 1 : 0), 3), tt(e, $e, Me)) : (Ve(e, 4 + (r ? 1 : 0), 3), ((e2, t3, i2, r2) => {
    let s2;
    for (Ve(e2, t3 - 257, 5), Ve(e2, i2 - 1, 5), Ve(e2, r2 - 4, 4), s2 = 0; s2 < r2; s2++) Ve(e2, e2.bl_tree[2 * De[s2] + 1], 3);
    st(e2, e2.dyn_ltree, t3 - 1), st(e2, e2.dyn_dtree, i2 - 1);
  })(e, e.l_desc.max_code + 1, e.d_desc.max_code + 1, a + 1), tt(e, e.dyn_ltree, e.dyn_dtree)), Xe(e), r && Je(e);
}, dt = { _tr_init: nt, _tr_stored_block: at, _tr_flush_block: lt, _tr_tally: (e, t2, i) => (e.pending_buf[e.sym_buf + e.sym_next++] = t2, e.pending_buf[e.sym_buf + e.sym_next++] = t2 >> 8, e.pending_buf[e.sym_buf + e.sym_next++] = i, 0 === t2 ? e.dyn_ltree[2 * i]++ : (e.matches++, t2--, e.dyn_ltree[2 * (Fe[i] + Ae + 1)]++, e.dyn_dtree[2 * We(t2)]++), e.sym_next === e.sym_end), _tr_align: (e) => {
  Ve(e, 2, 3), je(e, 256, $e), ((e2) => {
    16 === e2.bi_valid ? (Ze(e2, e2.bi_buf), e2.bi_buf = 0, e2.bi_valid = 0) : e2.bi_valid >= 8 && (e2.pending_buf[e2.pending++] = 255 & e2.bi_buf, e2.bi_buf >>= 8, e2.bi_valid -= 8);
  })(e);
} };
var ct = (e, t2, i, r) => {
  let s = 65535 & e | 0, o = e >>> 16 & 65535 | 0, a = 0;
  for (; 0 !== i; ) {
    a = i > 2e3 ? 2e3 : i, i -= a;
    do {
      s = s + t2[r++] | 0, o = o + s | 0;
    } while (--a);
    s %= 65521, o %= 65521;
  }
  return s | o << 16 | 0;
};
const ht = new Uint32Array((() => {
  let e, t2 = [];
  for (var i = 0; i < 256; i++) {
    e = i;
    for (var r = 0; r < 8; r++) e = 1 & e ? 3988292384 ^ e >>> 1 : e >>> 1;
    t2[i] = e;
  }
  return t2;
})());
var pt = (e, t2, i, r) => {
  const s = ht, o = r + i;
  e ^= -1;
  for (let i2 = r; i2 < o; i2++) e = e >>> 8 ^ s[255 & (e ^ t2[i2])];
  return -1 ^ e;
}, ut = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" }, ft = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_MEM_ERROR: -4, Z_BUF_ERROR: -5, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
const { _tr_init: mt, _tr_stored_block: vt, _tr_flush_block: gt, _tr_tally: _t, _tr_align: bt } = dt, { Z_NO_FLUSH: yt, Z_PARTIAL_FLUSH: xt, Z_FULL_FLUSH: wt, Z_FINISH: Et, Z_BLOCK: St, Z_OK: kt, Z_STREAM_END: At, Z_STREAM_ERROR: Rt, Z_DATA_ERROR: It, Z_BUF_ERROR: Ct, Z_DEFAULT_COMPRESSION: Tt, Z_FILTERED: Lt, Z_HUFFMAN_ONLY: Ot, Z_RLE: Dt, Z_FIXED: $t, Z_DEFAULT_STRATEGY: Mt, Z_UNKNOWN: Pt, Z_DEFLATED: Ft } = ft, zt = 258, Bt = 262, Ut = 42, Nt = 113, Ht = 666, qt = (e, t2) => (e.msg = ut[t2], t2), Gt = (e) => 2 * e - (e > 4 ? 9 : 0), Wt = (e) => {
  let t2 = e.length;
  for (; --t2 >= 0; ) e[t2] = 0;
}, Zt = (e) => {
  let t2, i, r, s = e.w_size;
  t2 = e.hash_size, r = t2;
  do {
    i = e.head[--r], e.head[r] = i >= s ? i - s : 0;
  } while (--t2);
  t2 = s, r = t2;
  do {
    i = e.prev[--r], e.prev[r] = i >= s ? i - s : 0;
  } while (--t2);
};
let Vt = (e, t2, i) => (t2 << e.hash_shift ^ i) & e.hash_mask;
const jt = (e, t2) => {
  let i;
  if (e.legacy_hash) i = e.ins_h = Vt(e, e.ins_h, e.window[t2 + 3 - 1]);
  else {
    const r2 = e.window, s = r2[t2] | r2[t2 + 1] << 8 | r2[t2 + 2] << 16 | r2[t2 + 3] << 24;
    i = e.ins_h = Math.imul(s, 66521) + 66521 >>> 16 & e.hash_mask;
  }
  const r = e.prev[t2 & e.w_mask] = e.head[i];
  return e.head[i] = t2, r;
}, Kt = (e) => {
  const t2 = e.state;
  let i = t2.pending;
  i > e.avail_out && (i = e.avail_out), 0 !== i && (e.output.set(t2.pending_buf.subarray(t2.pending_out, t2.pending_out + i), e.next_out), e.next_out += i, t2.pending_out += i, e.total_out += i, e.avail_out -= i, t2.pending -= i, 0 === t2.pending && (t2.pending_out = 0));
}, Yt = (e, t2) => {
  gt(e, e.block_start >= 0 ? e.block_start : -1, e.strstart - e.block_start, t2), e.block_start = e.strstart, Kt(e.strm);
}, Xt = (e, t2) => {
  e.pending_buf[e.pending++] = t2;
}, Jt = (e, t2) => {
  e.pending_buf[e.pending++] = t2 >>> 8 & 255, e.pending_buf[e.pending++] = 255 & t2;
}, Qt = (e, t2, i, r) => {
  let s = e.avail_in;
  return s > r && (s = r), 0 === s ? 0 : (e.avail_in -= s, t2.set(e.input.subarray(e.next_in, e.next_in + s), i), 1 === e.state.wrap ? e.adler = ct(e.adler, t2, s, i) : 2 === e.state.wrap && (e.adler = pt(e.adler, t2, s, i)), e.next_in += s, e.total_in += s, s);
}, ei = (e, t2) => {
  let i, r, s = e.max_chain_length, o = e.strstart, a = e.prev_length, n2 = e.nice_match;
  const l = e.strstart > e.w_size - Bt ? e.strstart - (e.w_size - Bt) : 0, d = e.window, c = e.w_mask, h = e.prev, p = e.strstart + zt;
  let u = d[o + a - 1], f = d[o + a];
  e.prev_length >= e.good_match && (s >>= 2), n2 > e.lookahead && (n2 = e.lookahead);
  do {
    if (i = t2, d[i + a] === f && d[i + a - 1] === u && d[i] === d[o] && d[++i] === d[o + 1]) {
      o += 2, i++;
      do {
      } while (d[++o] === d[++i] && d[++o] === d[++i] && d[++o] === d[++i] && d[++o] === d[++i] && d[++o] === d[++i] && d[++o] === d[++i] && d[++o] === d[++i] && d[++o] === d[++i] && o < p);
      if (r = zt - (p - o), o = p - zt, r > a) {
        if (e.match_start = t2, a = r, r >= n2) break;
        u = d[o + a - 1], f = d[o + a];
      }
    }
  } while ((t2 = h[t2 & c]) > l && 0 != --s);
  return a <= e.lookahead ? a : e.lookahead;
}, ti = (e) => {
  const t2 = e.w_size;
  let i, r, s;
  do {
    if (r = e.window_size - e.lookahead - e.strstart, e.strstart >= t2 + (t2 - Bt) && (e.window.set(e.window.subarray(t2, t2 + t2 - r), 0), e.match_start -= t2, e.strstart -= t2, e.block_start -= t2, e.insert > e.strstart && (e.insert = e.strstart), Zt(e), r += t2), 0 === e.strm.avail_in) break;
    if (i = Qt(e.strm, e.window, e.strstart + e.lookahead, r), e.lookahead += i, e.legacy_hash) {
      if (e.lookahead + e.insert >= 3) for (s = e.strstart - e.insert, e.ins_h = e.window[s], e.ins_h = Vt(e, e.ins_h, e.window[s + 1]); e.insert && (jt(e, s), s++, e.insert--, !(e.lookahead + e.insert < 3)); ) ;
    } else if (e.lookahead + e.insert > 3) for (s = e.strstart - e.insert; e.insert && (jt(e, s), s++, e.insert--, !(e.lookahead + e.insert <= 3)); ) ;
  } while (e.lookahead < Bt && 0 !== e.strm.avail_in);
}, ii = (e, t2) => {
  let i, r, s, o = e.pending_buf_size - 5 > e.w_size ? e.w_size : e.pending_buf_size - 5, a = 0, n2 = e.strm.avail_in;
  do {
    if (i = 65535, s = e.bi_valid + 42 >> 3, e.strm.avail_out < s) break;
    if (s = e.strm.avail_out - s, r = e.strstart - e.block_start, i > r + e.strm.avail_in && (i = r + e.strm.avail_in), i > s && (i = s), i < o && (0 === i && t2 !== Et || t2 === yt || i !== r + e.strm.avail_in)) break;
    a = t2 === Et && i === r + e.strm.avail_in ? 1 : 0, vt(e, 0, 0, a), e.pending_buf[e.pending - 4] = i, e.pending_buf[e.pending - 3] = i >> 8, e.pending_buf[e.pending - 2] = ~i, e.pending_buf[e.pending - 1] = ~i >> 8, Kt(e.strm), r && (r > i && (r = i), e.strm.output.set(e.window.subarray(e.block_start, e.block_start + r), e.strm.next_out), e.strm.next_out += r, e.strm.avail_out -= r, e.strm.total_out += r, e.block_start += r, i -= r), i && (Qt(e.strm, e.strm.output, e.strm.next_out, i), e.strm.next_out += i, e.strm.avail_out -= i, e.strm.total_out += i);
  } while (0 === a);
  return n2 -= e.strm.avail_in, n2 && (n2 >= e.w_size ? (e.matches = 2, e.window.set(e.strm.input.subarray(e.strm.next_in - e.w_size, e.strm.next_in), 0), e.strstart = e.w_size, e.insert = e.strstart) : (e.window_size - e.strstart <= n2 && (e.strstart -= e.w_size, e.window.set(e.window.subarray(e.w_size, e.w_size + e.strstart), 0), e.matches < 2 && e.matches++, e.insert > e.strstart && (e.insert = e.strstart)), e.window.set(e.strm.input.subarray(e.strm.next_in - n2, e.strm.next_in), e.strstart), e.strstart += n2, e.insert += n2 > e.w_size - e.insert ? e.w_size - e.insert : n2), e.block_start = e.strstart), e.high_water < e.strstart && (e.high_water = e.strstart), a ? 4 : t2 !== yt && t2 !== Et && 0 === e.strm.avail_in && e.strstart === e.block_start ? 2 : (s = e.window_size - e.strstart, e.strm.avail_in > s && e.block_start >= e.w_size && (e.block_start -= e.w_size, e.strstart -= e.w_size, e.window.set(e.window.subarray(e.w_size, e.w_size + e.strstart), 0), e.matches < 2 && e.matches++, s += e.w_size, e.insert > e.strstart && (e.insert = e.strstart)), s > e.strm.avail_in && (s = e.strm.avail_in), s && (Qt(e.strm, e.window, e.strstart, s), e.strstart += s, e.insert += s > e.w_size - e.insert ? e.w_size - e.insert : s), e.high_water < e.strstart && (e.high_water = e.strstart), s = e.bi_valid + 42 >> 3, s = e.pending_buf_size - s > 65535 ? 65535 : e.pending_buf_size - s, o = s > e.w_size ? e.w_size : s, r = e.strstart - e.block_start, (r >= o || (r || t2 === Et) && t2 !== yt && 0 === e.strm.avail_in && r <= s) && (i = r > s ? s : r, a = t2 === Et && 0 === e.strm.avail_in && i === r ? 1 : 0, vt(e, e.block_start, i, a), e.block_start += i, Kt(e.strm)), a ? 3 : 1);
}, ri = (e, t2) => {
  let i, r;
  for (; ; ) {
    if (e.lookahead < Bt) {
      if (ti(e), e.lookahead < Bt && t2 === yt) return 1;
      if (0 === e.lookahead) break;
    }
    if (i = 0, e.lookahead >= 3 && (i = jt(e, e.strstart)), 0 !== i && e.strstart - i <= e.w_size - Bt && (e.match_length = ei(e, i)), e.match_length >= 3) if (r = _t(e, e.strstart - e.match_start, e.match_length - 3), e.lookahead -= e.match_length, e.match_length <= e.max_lazy_match && e.lookahead >= 3) {
      e.match_length--;
      do {
        e.strstart++, i = jt(e, e.strstart);
      } while (0 != --e.match_length);
      e.strstart++;
    } else e.strstart += e.match_length, e.match_length = 0, e.legacy_hash && (e.ins_h = e.window[e.strstart], e.ins_h = Vt(e, e.ins_h, e.window[e.strstart + 1]));
    else r = _t(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++;
    if (r && (Yt(e, false), 0 === e.strm.avail_out)) return 1;
  }
  return e.insert = e.strstart < 2 ? e.strstart : 2, t2 === Et ? (Yt(e, true), 0 === e.strm.avail_out ? 3 : 4) : e.sym_next && (Yt(e, false), 0 === e.strm.avail_out) ? 1 : 2;
}, si = (e, t2) => {
  let i, r, s;
  for (; ; ) {
    if (e.lookahead < Bt) {
      if (ti(e), e.lookahead < Bt && t2 === yt) return 1;
      if (0 === e.lookahead) break;
    }
    if (i = 0, e.lookahead >= 3 && (i = jt(e, e.strstart)), e.prev_length = e.match_length, e.prev_match = e.match_start, e.match_length = 2, 0 !== i && e.prev_length < e.max_lazy_match && e.strstart - i <= e.w_size - Bt && (e.match_length = ei(e, i), e.match_length <= 5 && (e.strategy === Lt || 3 === e.match_length && e.strstart - e.match_start > 4096) && (e.match_length = 2)), e.prev_length >= 3 && e.match_length <= e.prev_length) {
      s = e.strstart + e.lookahead - 3, r = _t(e, e.strstart - 1 - e.prev_match, e.prev_length - 3), e.lookahead -= e.prev_length - 1, e.prev_length -= 2;
      do {
        ++e.strstart <= s && (i = jt(e, e.strstart));
      } while (0 != --e.prev_length);
      if (e.match_available = 0, e.match_length = 2, e.strstart++, r && (Yt(e, false), 0 === e.strm.avail_out)) return 1;
    } else if (e.match_available) {
      if (r = _t(e, 0, e.window[e.strstart - 1]), r && Yt(e, false), e.strstart++, e.lookahead--, 0 === e.strm.avail_out) return 1;
    } else e.match_available = 1, e.strstart++, e.lookahead--;
  }
  return e.match_available && (r = _t(e, 0, e.window[e.strstart - 1]), e.match_available = 0), e.insert = e.strstart < 2 ? e.strstart : 2, t2 === Et ? (Yt(e, true), 0 === e.strm.avail_out ? 3 : 4) : e.sym_next && (Yt(e, false), 0 === e.strm.avail_out) ? 1 : 2;
};
function oi(e, t2, i, r, s) {
  this.good_length = e, this.max_lazy = t2, this.nice_length = i, this.max_chain = r, this.func = s;
}
const ai = [new oi(0, 0, 0, 0, ii), new oi(4, 4, 8, 4, ri), new oi(4, 5, 16, 8, ri), new oi(4, 6, 32, 32, ri), new oi(4, 4, 16, 16, si), new oi(8, 16, 32, 32, si), new oi(8, 16, 128, 128, si), new oi(8, 32, 128, 256, si), new oi(32, 128, 258, 1024, si), new oi(32, 258, 258, 4096, si)];
function ni() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Ft, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.legacy_hash = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(1146), this.dyn_dtree = new Uint16Array(122), this.bl_tree = new Uint16Array(78), Wt(this.dyn_ltree), Wt(this.dyn_dtree), Wt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(16), this.heap = new Uint16Array(573), Wt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(573), Wt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const li = (e) => {
  if (!e) return 1;
  const t2 = e.state;
  return !t2 || t2.strm !== e || t2.status !== Ut && 57 !== t2.status && 69 !== t2.status && 73 !== t2.status && 91 !== t2.status && 103 !== t2.status && t2.status !== Nt && t2.status !== Ht ? 1 : 0;
}, di = (e) => {
  if (li(e)) return qt(e, Rt);
  e.total_in = e.total_out = 0, e.data_type = Pt;
  const t2 = e.state;
  return t2.pending = 0, t2.pending_out = 0, t2.wrap < 0 && (t2.wrap = -t2.wrap), t2.status = 2 === t2.wrap ? 57 : t2.wrap ? Ut : Nt, e.adler = 2 === t2.wrap ? 0 : 1, t2.last_flush = -2, mt(t2), kt;
}, ci = (e) => {
  const t2 = di(e);
  var i;
  return t2 === kt && ((i = e.state).window_size = 2 * i.w_size, Wt(i.head), i.max_lazy_match = ai[i.level].max_lazy, i.good_match = ai[i.level].good_length, i.nice_match = ai[i.level].nice_length, i.max_chain_length = ai[i.level].max_chain, i.strstart = 0, i.block_start = 0, i.lookahead = 0, i.insert = 0, i.match_length = i.prev_length = 2, i.match_available = 0, i.ins_h = 0), t2;
}, hi = (e, t2, i, r, s, o, a) => {
  if (!e) return Rt;
  let n2 = 1;
  if (t2 === Tt && (t2 = 6), r < 0 ? (n2 = 0, r = -r) : r > 15 && (n2 = 2, r -= 16), s < 1 || s > 9 || i !== Ft || r < 8 || r > 15 || t2 < 0 || t2 > 9 || o < 0 || o > $t || 8 === r && 1 !== n2) return qt(e, Rt);
  8 === r && (r = 9);
  const l = new ni();
  return e.state = l, l.strm = e, l.status = Ut, l.wrap = n2, l.gzhead = null, l.w_bits = r, l.w_size = 1 << l.w_bits, l.w_mask = l.w_size - 1, l.legacy_hash = a ? 1 : 0, l.hash_bits = s + 7, !l.legacy_hash && l.hash_bits < 15 && (l.hash_bits = 15), l.hash_size = 1 << l.hash_bits, l.hash_mask = l.hash_size - 1, l.hash_shift = ~~((l.hash_bits + 3 - 1) / 3), l.window = new Uint8Array(2 * l.w_size), l.head = new Uint16Array(l.hash_size), l.prev = new Uint16Array(l.w_size), l.lit_bufsize = 1 << s + 6, l.pending_buf_size = 4 * l.lit_bufsize, l.pending_buf = new Uint8Array(l.pending_buf_size), l.sym_buf = l.lit_bufsize, l.sym_end = 3 * (l.lit_bufsize - 1), l.level = t2, l.strategy = o, l.method = i, ci(e);
};
var pi = (e, t2) => {
  let i = t2.length;
  if (li(e)) return Rt;
  const r = e.state, s = r.wrap;
  if (2 === s || 1 === s && r.status !== Ut || r.lookahead) return Rt;
  if (1 === s && (e.adler = ct(e.adler, t2, i, 0)), r.wrap = 0, i >= r.w_size) {
    0 === s && (Wt(r.head), r.strstart = 0, r.block_start = 0, r.insert = 0);
    let e2 = new Uint8Array(r.w_size);
    e2.set(t2.subarray(i - r.w_size, i), 0), t2 = e2, i = r.w_size;
  }
  const o = e.avail_in, a = e.next_in, n2 = e.input;
  for (e.avail_in = i, e.next_in = 0, e.input = t2, ti(r); r.lookahead >= 3; ) {
    let e2 = r.strstart, t3 = r.lookahead - 2;
    do {
      jt(r, e2), e2++;
    } while (--t3);
    r.strstart = e2, r.lookahead = 2, ti(r);
  }
  return r.strstart += r.lookahead, r.block_start = r.strstart, r.insert = r.lookahead, r.lookahead = 0, r.match_length = r.prev_length = 2, r.match_available = 0, e.next_in = a, e.input = n2, e.avail_in = o, r.wrap = s, kt;
}, ui = { deflateInit: (e, t2) => hi(e, t2, Ft, 15, 8, Mt), deflateInit2: hi, deflateReset: ci, deflateResetKeep: di, deflateSetHeader: (e, t2) => li(e) || 2 !== e.state.wrap ? Rt : (e.state.gzhead = t2, kt), deflate: (e, t2) => {
  if (li(e) || t2 > St || t2 < 0) return e ? qt(e, Rt) : Rt;
  const i = e.state;
  if (!e.output || 0 !== e.avail_in && !e.input || i.status === Ht && t2 !== Et) return qt(e, 0 === e.avail_out ? Ct : Rt);
  const r = i.last_flush;
  if (i.last_flush = t2, 0 !== i.pending) {
    if (Kt(e), 0 === e.avail_out) return i.last_flush = -1, kt;
  } else if (0 === e.avail_in && Gt(t2) <= Gt(r) && t2 !== Et) return qt(e, Ct);
  if (i.status === Ht && 0 !== e.avail_in) return qt(e, Ct);
  if (i.status === Ut && 0 === i.wrap && (i.status = Nt), i.status === Ut) {
    let t3 = Ft + (i.w_bits - 8 << 4) << 8, r2 = -1;
    if (r2 = i.strategy >= Ot || i.level < 2 ? 0 : i.level < 6 ? 1 : 6 === i.level ? 2 : 3, t3 |= r2 << 6, 0 !== i.strstart && (t3 |= 32), t3 += 31 - t3 % 31, Jt(i, t3), 0 !== i.strstart && (Jt(i, e.adler >>> 16), Jt(i, 65535 & e.adler)), e.adler = 1, i.status = Nt, Kt(e), 0 !== i.pending) return i.last_flush = -1, kt;
  }
  if (57 === i.status) {
    if (e.adler = 0, Xt(i, 31), Xt(i, 139), Xt(i, 8), i.gzhead) Xt(i, (i.gzhead.text ? 1 : 0) + (i.gzhead.hcrc ? 2 : 0) + (i.gzhead.extra ? 4 : 0) + (i.gzhead.name ? 8 : 0) + (i.gzhead.comment ? 16 : 0)), Xt(i, 255 & i.gzhead.time), Xt(i, i.gzhead.time >> 8 & 255), Xt(i, i.gzhead.time >> 16 & 255), Xt(i, i.gzhead.time >> 24 & 255), Xt(i, 9 === i.level ? 2 : i.strategy >= Ot || i.level < 2 ? 4 : 0), Xt(i, 255 & i.gzhead.os), i.gzhead.extra && i.gzhead.extra.length && (Xt(i, 255 & i.gzhead.extra.length), Xt(i, i.gzhead.extra.length >> 8 & 255)), i.gzhead.hcrc && (e.adler = pt(e.adler, i.pending_buf, i.pending, 0)), i.gzindex = 0, i.status = 69;
    else if (Xt(i, 0), Xt(i, 0), Xt(i, 0), Xt(i, 0), Xt(i, 0), Xt(i, 9 === i.level ? 2 : i.strategy >= Ot || i.level < 2 ? 4 : 0), Xt(i, 3), i.status = Nt, Kt(e), 0 !== i.pending) return i.last_flush = -1, kt;
  }
  if (69 === i.status) {
    if (i.gzhead.extra) {
      let t3 = i.pending, r2 = (65535 & i.gzhead.extra.length) - i.gzindex;
      for (; i.pending + r2 > i.pending_buf_size; ) {
        let s2 = i.pending_buf_size - i.pending;
        if (i.pending_buf.set(i.gzhead.extra.subarray(i.gzindex, i.gzindex + s2), i.pending), i.pending = i.pending_buf_size, i.gzhead.hcrc && i.pending > t3 && (e.adler = pt(e.adler, i.pending_buf, i.pending - t3, t3)), i.gzindex += s2, Kt(e), 0 !== i.pending) return i.last_flush = -1, kt;
        t3 = 0, r2 -= s2;
      }
      let s = new Uint8Array(i.gzhead.extra);
      i.pending_buf.set(s.subarray(i.gzindex, i.gzindex + r2), i.pending), i.pending += r2, i.gzhead.hcrc && i.pending > t3 && (e.adler = pt(e.adler, i.pending_buf, i.pending - t3, t3)), i.gzindex = 0;
    }
    i.status = 73;
  }
  if (73 === i.status) {
    if (i.gzhead.name) {
      let t3, r2 = i.pending;
      do {
        if (i.pending === i.pending_buf_size) {
          if (i.gzhead.hcrc && i.pending > r2 && (e.adler = pt(e.adler, i.pending_buf, i.pending - r2, r2)), Kt(e), 0 !== i.pending) return i.last_flush = -1, kt;
          r2 = 0;
        }
        t3 = i.gzindex < i.gzhead.name.length ? 255 & i.gzhead.name.charCodeAt(i.gzindex++) : 0, Xt(i, t3);
      } while (0 !== t3);
      i.gzhead.hcrc && i.pending > r2 && (e.adler = pt(e.adler, i.pending_buf, i.pending - r2, r2)), i.gzindex = 0;
    }
    i.status = 91;
  }
  if (91 === i.status) {
    if (i.gzhead.comment) {
      let t3, r2 = i.pending;
      do {
        if (i.pending === i.pending_buf_size) {
          if (i.gzhead.hcrc && i.pending > r2 && (e.adler = pt(e.adler, i.pending_buf, i.pending - r2, r2)), Kt(e), 0 !== i.pending) return i.last_flush = -1, kt;
          r2 = 0;
        }
        t3 = i.gzindex < i.gzhead.comment.length ? 255 & i.gzhead.comment.charCodeAt(i.gzindex++) : 0, Xt(i, t3);
      } while (0 !== t3);
      i.gzhead.hcrc && i.pending > r2 && (e.adler = pt(e.adler, i.pending_buf, i.pending - r2, r2));
    }
    i.status = 103;
  }
  if (103 === i.status) {
    if (i.gzhead.hcrc) {
      if (i.pending + 2 > i.pending_buf_size && (Kt(e), 0 !== i.pending)) return i.last_flush = -1, kt;
      Xt(i, 255 & e.adler), Xt(i, e.adler >> 8 & 255), e.adler = 0;
    }
    if (i.status = Nt, Kt(e), 0 !== i.pending) return i.last_flush = -1, kt;
  }
  if (0 !== e.avail_in || 0 !== i.lookahead || t2 !== yt && i.status !== Ht) {
    let r2 = 0 === i.level ? ii(i, t2) : i.strategy === Ot ? ((e2, t3) => {
      let i2;
      for (; ; ) {
        if (0 === e2.lookahead && (ti(e2), 0 === e2.lookahead)) {
          if (t3 === yt) return 1;
          break;
        }
        if (e2.match_length = 0, i2 = _t(e2, 0, e2.window[e2.strstart]), e2.lookahead--, e2.strstart++, i2 && (Yt(e2, false), 0 === e2.strm.avail_out)) return 1;
      }
      return e2.insert = 0, t3 === Et ? (Yt(e2, true), 0 === e2.strm.avail_out ? 3 : 4) : e2.sym_next && (Yt(e2, false), 0 === e2.strm.avail_out) ? 1 : 2;
    })(i, t2) : i.strategy === Dt ? ((e2, t3) => {
      let i2, r3, s, o;
      const a = e2.window;
      for (; ; ) {
        if (e2.lookahead <= zt) {
          if (ti(e2), e2.lookahead <= zt && t3 === yt) return 1;
          if (0 === e2.lookahead) break;
        }
        if (e2.match_length = 0, e2.lookahead >= 3 && e2.strstart > 0 && (s = e2.strstart - 1, r3 = a[s], r3 === a[++s] && r3 === a[++s] && r3 === a[++s])) {
          o = e2.strstart + zt;
          do {
          } while (r3 === a[++s] && r3 === a[++s] && r3 === a[++s] && r3 === a[++s] && r3 === a[++s] && r3 === a[++s] && r3 === a[++s] && r3 === a[++s] && s < o);
          e2.match_length = zt - (o - s), e2.match_length > e2.lookahead && (e2.match_length = e2.lookahead);
        }
        if (e2.match_length >= 3 ? (i2 = _t(e2, 1, e2.match_length - 3), e2.lookahead -= e2.match_length, e2.strstart += e2.match_length, e2.match_length = 0) : (i2 = _t(e2, 0, e2.window[e2.strstart]), e2.lookahead--, e2.strstart++), i2 && (Yt(e2, false), 0 === e2.strm.avail_out)) return 1;
      }
      return e2.insert = 0, t3 === Et ? (Yt(e2, true), 0 === e2.strm.avail_out ? 3 : 4) : e2.sym_next && (Yt(e2, false), 0 === e2.strm.avail_out) ? 1 : 2;
    })(i, t2) : ai[i.level].func(i, t2);
    if (3 !== r2 && 4 !== r2 || (i.status = Ht), 1 === r2 || 3 === r2) return 0 === e.avail_out && (i.last_flush = -1), kt;
    if (2 === r2 && (t2 === xt ? bt(i) : t2 !== St && (vt(i, 0, 0, false), t2 === wt && (Wt(i.head), 0 === i.lookahead && (i.strstart = 0, i.block_start = 0, i.insert = 0))), Kt(e), 0 === e.avail_out)) return i.last_flush = -1, kt;
  }
  return t2 !== Et ? kt : i.wrap <= 0 ? At : (2 === i.wrap ? (Xt(i, 255 & e.adler), Xt(i, e.adler >> 8 & 255), Xt(i, e.adler >> 16 & 255), Xt(i, e.adler >> 24 & 255), Xt(i, 255 & e.total_in), Xt(i, e.total_in >> 8 & 255), Xt(i, e.total_in >> 16 & 255), Xt(i, e.total_in >> 24 & 255)) : (Jt(i, e.adler >>> 16), Jt(i, 65535 & e.adler)), Kt(e), i.wrap > 0 && (i.wrap = -i.wrap), 0 !== i.pending ? kt : At);
}, deflateEnd: (e) => {
  if (li(e)) return Rt;
  const t2 = e.state.status;
  return e.state = null, t2 === Nt ? qt(e, It) : kt;
}, deflateSetDictionary: pi, deflateInfo: "pako deflate (from Nodeca project)" };
const fi = (e, t2) => Object.prototype.hasOwnProperty.call(e, t2);
var mi = { assign: function(e) {
  const t2 = Array.prototype.slice.call(arguments, 1);
  for (; t2.length; ) {
    const i = t2.shift();
    if (i) {
      if ("object" != typeof i) throw new TypeError(i + "must be non-object");
      for (const t3 in i) fi(i, t3) && (e[t3] = i[t3]);
    }
  }
  return e;
}, flattenChunks: (e) => {
  let t2 = 0;
  for (let i2 = 0, r = e.length; i2 < r; i2++) t2 += e[i2].length;
  const i = new Uint8Array(t2);
  for (let t3 = 0, r = 0, s = e.length; t3 < s; t3++) {
    let s2 = e[t3];
    i.set(s2, r), r += s2.length;
  }
  return i;
} };
let vi = true;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch (e) {
  vi = false;
}
const gi = new Uint8Array(256);
for (let e = 0; e < 256; e++) gi[e] = e >= 252 ? 6 : e >= 248 ? 5 : e >= 240 ? 4 : e >= 224 ? 3 : e >= 192 ? 2 : 1;
gi[254] = gi[255] = 1;
var _i = { string2buf: (e) => {
  if ("function" == typeof TextEncoder && TextEncoder.prototype.encode) return new TextEncoder().encode(e);
  let t2, i, r, s, o, a = e.length, n2 = 0;
  for (s = 0; s < a; s++) i = e.charCodeAt(s), 55296 == (64512 & i) && s + 1 < a && (r = e.charCodeAt(s + 1), 56320 == (64512 & r) && (i = 65536 + (i - 55296 << 10) + (r - 56320), s++)), n2 += i < 128 ? 1 : i < 2048 ? 2 : i < 65536 ? 3 : 4;
  for (t2 = new Uint8Array(n2), o = 0, s = 0; o < n2; s++) i = e.charCodeAt(s), 55296 == (64512 & i) && s + 1 < a && (r = e.charCodeAt(s + 1), 56320 == (64512 & r) && (i = 65536 + (i - 55296 << 10) + (r - 56320), s++)), i < 128 ? t2[o++] = i : i < 2048 ? (t2[o++] = 192 | i >>> 6, t2[o++] = 128 | 63 & i) : i < 65536 ? (t2[o++] = 224 | i >>> 12, t2[o++] = 128 | i >>> 6 & 63, t2[o++] = 128 | 63 & i) : (t2[o++] = 240 | i >>> 18, t2[o++] = 128 | i >>> 12 & 63, t2[o++] = 128 | i >>> 6 & 63, t2[o++] = 128 | 63 & i);
  return t2;
}, buf2string: (e, t2) => {
  const i = t2 || e.length;
  if ("function" == typeof TextDecoder && TextDecoder.prototype.decode) return new TextDecoder().decode(e.subarray(0, t2));
  let r, s;
  const o = new Array(2 * i);
  for (s = 0, r = 0; r < i; ) {
    let t3 = e[r++];
    if (t3 < 128) {
      o[s++] = t3;
      continue;
    }
    let a = gi[t3];
    if (a > 4) o[s++] = 65533, r += a - 1;
    else {
      for (t3 &= 2 === a ? 31 : 3 === a ? 15 : 7; a > 1 && r < i; ) t3 = t3 << 6 | 63 & e[r++], a--;
      a > 1 ? o[s++] = 65533 : t3 < 65536 ? o[s++] = t3 : (t3 -= 65536, o[s++] = 55296 | t3 >> 10 & 1023, o[s++] = 56320 | 1023 & t3);
    }
  }
  return ((e2, t3) => {
    if (t3 < 65534 && e2.subarray && vi) return String.fromCharCode.apply(null, e2.length === t3 ? e2 : e2.subarray(0, t3));
    let i2 = "";
    for (let r2 = 0; r2 < t3; r2++) i2 += String.fromCharCode(e2[r2]);
    return i2;
  })(o, s);
}, utf8border: (e, t2) => {
  (t2 = t2 || e.length) > e.length && (t2 = e.length);
  let i = t2 - 1;
  for (; i >= 0 && 128 == (192 & e[i]); ) i--;
  return i < 0 || 0 === i ? t2 : i + gi[e[i]] > t2 ? i : t2;
} };
var bi = function() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
};
const yi = Object.prototype.toString, { Z_NO_FLUSH: xi, Z_SYNC_FLUSH: wi, Z_FULL_FLUSH: Ei, Z_FINISH: Si, Z_OK: ki, Z_STREAM_END: Ai, Z_DEFAULT_COMPRESSION: Ri, Z_DEFAULT_STRATEGY: Ii, Z_DEFLATED: Ci } = ft, Ti = { level: Ri, method: Ci, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: Ii, legacyHash: true };
function Li(e) {
  this.options = mi.assign({}, Ti, e || {});
  let t2 = this.options;
  t2.raw && t2.windowBits > 0 ? t2.windowBits = -t2.windowBits : t2.gzip && t2.windowBits > 0 && t2.windowBits < 16 && (t2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new bi(), this.strm.avail_out = 0;
  let i = ui.deflateInit2(this.strm, t2.level, t2.method, t2.windowBits, t2.memLevel, t2.strategy, t2.legacyHash);
  if (i !== ki) throw new Error(ut[i]);
  if (t2.header && ui.deflateSetHeader(this.strm, t2.header), t2.dictionary) {
    let e2;
    if (e2 = "string" == typeof t2.dictionary ? _i.string2buf(t2.dictionary) : "[object ArrayBuffer]" === yi.call(t2.dictionary) ? new Uint8Array(t2.dictionary) : t2.dictionary, i = ui.deflateSetDictionary(this.strm, e2), i !== ki) throw new Error(ut[i]);
    this._dict_set = true;
  }
}
Li.prototype.push = function(e, t2) {
  const i = this.strm, r = this.options.chunkSize;
  let s, o;
  if (this.ended) return false;
  for (o = t2 === ~~t2 ? t2 : true === t2 ? Si : xi, "string" == typeof e ? i.input = _i.string2buf(e) : "[object ArrayBuffer]" === yi.call(e) ? i.input = new Uint8Array(e) : i.input = e, i.next_in = 0, i.avail_in = i.input.length; ; ) if (0 === i.avail_out && (i.output = new Uint8Array(r), i.next_out = 0, i.avail_out = r), (o === wi || o === Ei) && i.avail_out <= 6) this.onData(i.output.subarray(0, i.next_out)), i.avail_out = 0;
  else {
    if (s = ui.deflate(i, o), s === Ai) return i.next_out > 0 && this.onData(i.output.subarray(0, i.next_out)), s = ui.deflateEnd(this.strm), this.onEnd(s), this.ended = true, s === ki;
    if (0 !== i.avail_out) {
      if (o > 0 && i.next_out > 0) this.onData(i.output.subarray(0, i.next_out)), i.avail_out = 0;
      else if (0 === i.avail_in) break;
    } else this.onData(i.output);
  }
  return true;
}, Li.prototype.onData = function(e) {
  this.chunks.push(e);
}, Li.prototype.onEnd = function(e) {
  e === ki && (this.result = mi.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
var Oi = { deflate: function(e, t2) {
  const i = new Li(t2);
  if (i.push(e, true), i.err) throw i.msg || ut[i.err];
  return i.result;
} };
const Di = 16209;
var $i = function(e, t2) {
  let i, r, s, o, a, n2, l, d, c, h, p, u, f, m, v, g, _, b, y, x, w, E, S, k;
  const A = e.state;
  i = e.next_in, S = e.input, r = i + (e.avail_in - 5), s = e.next_out, k = e.output, o = s - (t2 - e.avail_out), a = s + (e.avail_out - 257), n2 = A.dmax, l = A.wsize, d = A.whave, c = A.wnext, h = A.window, p = A.hold, u = A.bits, f = A.lencode, m = A.distcode, v = (1 << A.lenbits) - 1, g = (1 << A.distbits) - 1;
  e: do {
    u < 15 && (p += S[i++] << u, u += 8, p += S[i++] << u, u += 8), _ = f[p & v];
    t: for (; ; ) {
      if (b = _ >>> 24, p >>>= b, u -= b, b = _ >>> 16 & 255, 0 === b) k[s++] = 65535 & _;
      else {
        if (!(16 & b)) {
          if (0 == (64 & b)) {
            _ = f[(65535 & _) + (p & (1 << b) - 1)];
            continue t;
          }
          if (32 & b) {
            A.mode = 16191;
            break e;
          }
          e.msg = "invalid literal/length code", A.mode = Di;
          break e;
        }
        y = 65535 & _, b &= 15, b && (u < b && (p += S[i++] << u, u += 8), y += p & (1 << b) - 1, p >>>= b, u -= b), u < 15 && (p += S[i++] << u, u += 8, p += S[i++] << u, u += 8), _ = m[p & g];
        i: for (; ; ) {
          if (b = _ >>> 24, p >>>= b, u -= b, b = _ >>> 16 & 255, !(16 & b)) {
            if (0 == (64 & b)) {
              _ = m[(65535 & _) + (p & (1 << b) - 1)];
              continue i;
            }
            e.msg = "invalid distance code", A.mode = Di;
            break e;
          }
          if (x = 65535 & _, b &= 15, u < b && (p += S[i++] << u, u += 8, u < b && (p += S[i++] << u, u += 8)), x += p & (1 << b) - 1, x > n2) {
            e.msg = "invalid distance too far back", A.mode = Di;
            break e;
          }
          if (p >>>= b, u -= b, b = s - o, x > b) {
            if (b = x - b, b > d && A.sane) {
              e.msg = "invalid distance too far back", A.mode = Di;
              break e;
            }
            if (w = 0, E = h, 0 === c) {
              if (w += l - b, b < y) {
                y -= b;
                do {
                  k[s++] = h[w++];
                } while (--b);
                w = s - x, E = k;
              }
            } else if (c < b) {
              if (w += l + c - b, b -= c, b < y) {
                y -= b;
                do {
                  k[s++] = h[w++];
                } while (--b);
                if (w = 0, c < y) {
                  b = c, y -= b;
                  do {
                    k[s++] = h[w++];
                  } while (--b);
                  w = s - x, E = k;
                }
              }
            } else if (w += c - b, b < y) {
              y -= b;
              do {
                k[s++] = h[w++];
              } while (--b);
              w = s - x, E = k;
            }
            for (; y > 2; ) k[s++] = E[w++], k[s++] = E[w++], k[s++] = E[w++], y -= 3;
            y && (k[s++] = E[w++], y > 1 && (k[s++] = E[w++]));
          } else {
            w = s - x;
            do {
              k[s++] = k[w++], k[s++] = k[w++], k[s++] = k[w++], y -= 3;
            } while (y > 2);
            y && (k[s++] = k[w++], y > 1 && (k[s++] = k[w++]));
          }
          break;
        }
      }
      break;
    }
  } while (i < r && s < a);
  y = u >> 3, i -= y, u -= y << 3, p &= (1 << u) - 1, e.next_in = i, e.next_out = s, e.avail_in = i < r ? r - i + 5 : 5 - (i - r), e.avail_out = s < a ? a - s + 257 : 257 - (s - a), A.hold = p, A.bits = u;
};
const Mi = 15, Pi = new Uint16Array([3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0]), Fi = new Uint8Array([16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 199, 75]), zi = new Uint16Array([1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0]), Bi = new Uint8Array([16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64]);
var Ui = (e, t2, i, r, s, o, a, n2) => {
  const l = n2.bits;
  let d, c, h, p, u, f, m = 0, v = 0, g = 0, _ = 0, b = 0, y = 0, x = 0, w = 0, E = 0, S = 0, k = null;
  const A = new Uint16Array(16), R = new Uint16Array(16);
  let I, C, T2, L2 = null;
  for (m = 0; m <= Mi; m++) A[m] = 0;
  for (v = 0; v < r; v++) A[t2[i + v]]++;
  for (b = l, _ = Mi; _ >= 1 && 0 === A[_]; _--) ;
  if (b > _ && (b = _), 0 === _) return s[o++] = 20971520, s[o++] = 20971520, n2.bits = 1, 0;
  for (g = 1; g < _ && 0 === A[g]; g++) ;
  for (b < g && (b = g), w = 1, m = 1; m <= Mi; m++) if (w <<= 1, w -= A[m], w < 0) return -1;
  if (w > 0 && (0 === e || 1 !== _)) return -1;
  for (R[1] = 0, m = 1; m < Mi; m++) R[m + 1] = R[m] + A[m];
  for (v = 0; v < r; v++) 0 !== t2[i + v] && (a[R[t2[i + v]]++] = v);
  if (0 === e ? (k = L2 = a, f = 20) : 1 === e ? (k = Pi, L2 = Fi, f = 257) : (k = zi, L2 = Bi, f = 0), S = 0, v = 0, m = g, u = o, y = b, x = 0, h = -1, E = 1 << b, p = E - 1, 1 === e && E > 852 || 2 === e && E > 592) return 1;
  for (; ; ) {
    I = m - x, a[v] + 1 < f ? (C = 0, T2 = a[v]) : a[v] >= f ? (C = L2[a[v] - f], T2 = k[a[v] - f]) : (C = 96, T2 = 0), d = 1 << m - x, c = 1 << y, g = c;
    do {
      c -= d, s[u + (S >> x) + c] = I << 24 | C << 16 | T2 | 0;
    } while (0 !== c);
    for (d = 1 << m - 1; S & d; ) d >>= 1;
    if (0 !== d ? (S &= d - 1, S += d) : S = 0, v++, 0 == --A[m]) {
      if (m === _) break;
      m = t2[i + a[v]];
    }
    if (m > b && (S & p) !== h) {
      for (0 === x && (x = b), u += g, y = m - x, w = 1 << y; y + x < _ && (w -= A[y + x], !(w <= 0)); ) y++, w <<= 1;
      if (E += 1 << y, 1 === e && E > 852 || 2 === e && E > 592) return 1;
      h = S & p, s[h] = b << 24 | y << 16 | u - o | 0;
    }
  }
  return 0 !== S && (s[u + S] = m - x << 24 | 64 << 16 | 0), n2.bits = b, 0;
};
const { Z_FINISH: Ni, Z_BLOCK: Hi, Z_TREES: qi, Z_OK: Gi, Z_STREAM_END: Wi, Z_NEED_DICT: Zi, Z_STREAM_ERROR: Vi, Z_DATA_ERROR: ji, Z_MEM_ERROR: Ki, Z_BUF_ERROR: Yi, Z_DEFLATED: Xi } = ft, Ji = 16180, Qi = 16190, er = 16191, tr = 16192, ir = 16194, rr = 16199, sr = 16200, or = 16206, ar = 16209, nr = (e) => (e >>> 24 & 255) + (e >>> 8 & 65280) + ((65280 & e) << 8) + ((255 & e) << 24);
function lr() {
  this.strm = null, this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const dr = (e) => {
  if (!e) return 1;
  const t2 = e.state;
  return !t2 || t2.strm !== e || t2.mode < Ji || t2.mode > 16211 ? 1 : 0;
}, cr = (e) => {
  if (dr(e)) return Vi;
  const t2 = e.state;
  return e.total_in = e.total_out = t2.total = 0, e.msg = "", t2.wrap && (e.adler = 1 & t2.wrap), t2.mode = Ji, t2.last = 0, t2.havedict = 0, t2.flags = -1, t2.dmax = 32768, t2.head = null, t2.hold = 0, t2.bits = 0, t2.lencode = t2.lendyn = new Int32Array(852), t2.distcode = t2.distdyn = new Int32Array(592), t2.sane = 1, t2.back = -1, Gi;
}, hr = (e) => {
  if (dr(e)) return Vi;
  const t2 = e.state;
  return t2.wsize = 0, t2.whave = 0, t2.wnext = 0, cr(e);
}, pr = (e, t2) => {
  let i;
  if (dr(e)) return Vi;
  const r = e.state;
  return t2 < 0 ? (i = 0, t2 = -t2) : (i = 5 + (t2 >> 4), t2 < 48 && (t2 &= 15)), t2 && (t2 < 8 || t2 > 15) ? Vi : (null !== r.window && r.wbits !== t2 && (r.window = null), r.wrap = i, r.wbits = t2, hr(e));
}, ur = (e, t2) => {
  if (!e) return Vi;
  const i = new lr();
  e.state = i, i.strm = e, i.window = null, i.mode = Ji;
  const r = pr(e, t2);
  return r !== Gi && (e.state = null), r;
};
let fr, mr, vr = true;
const gr = (e) => {
  if (vr) {
    fr = new Int32Array(512), mr = new Int32Array(32);
    let t2 = 0;
    for (; t2 < 144; ) e.lens[t2++] = 8;
    for (; t2 < 256; ) e.lens[t2++] = 9;
    for (; t2 < 280; ) e.lens[t2++] = 7;
    for (; t2 < 288; ) e.lens[t2++] = 8;
    for (Ui(1, e.lens, 0, 288, fr, 0, e.work, { bits: 9 }), t2 = 0; t2 < 32; ) e.lens[t2++] = 5;
    Ui(2, e.lens, 0, 32, mr, 0, e.work, { bits: 5 }), vr = false;
  }
  e.lencode = fr, e.lenbits = 9, e.distcode = mr, e.distbits = 5;
}, _r = (e, t2, i, r) => {
  let s;
  const o = e.state;
  return null === o.window && (o.window = new Uint8Array(1 << o.wbits)), 0 === o.wsize && (o.wsize = 1 << o.wbits, o.wnext = 0, o.whave = 0), r >= o.wsize ? (o.window.set(t2.subarray(i - o.wsize, i), 0), o.wnext = 0, o.whave = o.wsize) : (s = o.wsize - o.wnext, s > r && (s = r), o.window.set(t2.subarray(i - r, i - r + s), o.wnext), (r -= s) ? (o.window.set(t2.subarray(i - r, i), 0), o.wnext = r, o.whave = o.wsize) : (o.wnext += s, o.wnext === o.wsize && (o.wnext = 0), o.whave < o.wsize && (o.whave += s))), 0;
};
var br = (e, t2) => {
  let i, r, s, o, a, n2, l, d, c, h, p, u, f, m, v, g, _, b, y, x, w, E, S = 0;
  const k = new Uint8Array(4);
  let A, R;
  const I = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  if (dr(e) || !e.output || !e.input && 0 !== e.avail_in) return Vi;
  i = e.state, i.mode === er && (i.mode = tr), a = e.next_out, s = e.output, l = e.avail_out, o = e.next_in, r = e.input, n2 = e.avail_in, d = i.hold, c = i.bits, h = n2, p = l, E = Gi;
  e: for (; ; ) switch (i.mode) {
    case Ji:
      if (0 === i.wrap) {
        i.mode = tr;
        break;
      }
      for (; c < 16; ) {
        if (0 === n2) break e;
        n2--, d += r[o++] << c, c += 8;
      }
      if (2 & i.wrap && 35615 === d) {
        0 === i.wbits && (i.wbits = 15), i.check = 0, k[0] = 255 & d, k[1] = d >>> 8 & 255, i.check = pt(i.check, k, 2, 0), d = 0, c = 0, i.mode = 16181;
        break;
      }
      if (i.head && (i.head.done = false), !(1 & i.wrap) || (((255 & d) << 8) + (d >> 8)) % 31) {
        e.msg = "incorrect header check", i.mode = ar;
        break;
      }
      if ((15 & d) !== Xi) {
        e.msg = "unknown compression method", i.mode = ar;
        break;
      }
      if (d >>>= 4, c -= 4, w = 8 + (15 & d), 0 === i.wbits && (i.wbits = w), w > 15 || w > i.wbits) {
        e.msg = "invalid window size", i.mode = ar;
        break;
      }
      i.dmax = 1 << i.wbits, i.flags = 0, e.adler = i.check = 1, i.mode = 512 & d ? 16189 : er, d = 0, c = 0;
      break;
    case 16181:
      for (; c < 16; ) {
        if (0 === n2) break e;
        n2--, d += r[o++] << c, c += 8;
      }
      if (i.flags = d, (255 & i.flags) !== Xi) {
        e.msg = "unknown compression method", i.mode = ar;
        break;
      }
      if (57344 & i.flags) {
        e.msg = "unknown header flags set", i.mode = ar;
        break;
      }
      i.head && (i.head.text = d >> 8 & 1), 512 & i.flags && 4 & i.wrap && (k[0] = 255 & d, k[1] = d >>> 8 & 255, i.check = pt(i.check, k, 2, 0)), d = 0, c = 0, i.mode = 16182;
    case 16182:
      for (; c < 32; ) {
        if (0 === n2) break e;
        n2--, d += r[o++] << c, c += 8;
      }
      i.head && (i.head.time = d), 512 & i.flags && 4 & i.wrap && (k[0] = 255 & d, k[1] = d >>> 8 & 255, k[2] = d >>> 16 & 255, k[3] = d >>> 24 & 255, i.check = pt(i.check, k, 4, 0)), d = 0, c = 0, i.mode = 16183;
    case 16183:
      for (; c < 16; ) {
        if (0 === n2) break e;
        n2--, d += r[o++] << c, c += 8;
      }
      i.head && (i.head.xflags = 255 & d, i.head.os = d >> 8), 512 & i.flags && 4 & i.wrap && (k[0] = 255 & d, k[1] = d >>> 8 & 255, i.check = pt(i.check, k, 2, 0)), d = 0, c = 0, i.mode = 16184;
    case 16184:
      if (1024 & i.flags) {
        for (; c < 16; ) {
          if (0 === n2) break e;
          n2--, d += r[o++] << c, c += 8;
        }
        i.length = d, i.head && (i.head.extra_len = d), 512 & i.flags && 4 & i.wrap && (k[0] = 255 & d, k[1] = d >>> 8 & 255, i.check = pt(i.check, k, 2, 0)), d = 0, c = 0;
      } else i.head && (i.head.extra = null);
      i.mode = 16185;
    case 16185:
      if (1024 & i.flags && (u = i.length, u > n2 && (u = n2), u && (i.head && (w = i.head.extra_len - i.length, i.head.extra || (i.head.extra = new Uint8Array(i.head.extra_len)), i.head.extra.set(r.subarray(o, o + u), w)), 512 & i.flags && 4 & i.wrap && (i.check = pt(i.check, r, u, o)), n2 -= u, o += u, i.length -= u), i.length)) break e;
      i.length = 0, i.mode = 16186;
    case 16186:
      if (2048 & i.flags) {
        if (0 === n2) break e;
        u = 0;
        do {
          w = r[o + u++], i.head && w && i.length < 65536 && (i.head.name += String.fromCharCode(w));
        } while (w && u < n2);
        if (512 & i.flags && 4 & i.wrap && (i.check = pt(i.check, r, u, o)), n2 -= u, o += u, w) break e;
      } else i.head && (i.head.name = null);
      i.length = 0, i.mode = 16187;
    case 16187:
      if (4096 & i.flags) {
        if (0 === n2) break e;
        u = 0;
        do {
          w = r[o + u++], i.head && w && i.length < 65536 && (i.head.comment += String.fromCharCode(w));
        } while (w && u < n2);
        if (512 & i.flags && 4 & i.wrap && (i.check = pt(i.check, r, u, o)), n2 -= u, o += u, w) break e;
      } else i.head && (i.head.comment = null);
      i.mode = 16188;
    case 16188:
      if (512 & i.flags) {
        for (; c < 16; ) {
          if (0 === n2) break e;
          n2--, d += r[o++] << c, c += 8;
        }
        if (4 & i.wrap && d !== (65535 & i.check)) {
          e.msg = "header crc mismatch", i.mode = ar;
          break;
        }
        d = 0, c = 0;
      }
      i.head && (i.head.hcrc = i.flags >> 9 & 1, i.head.done = true), e.adler = i.check = 0, i.mode = er;
      break;
    case 16189:
      for (; c < 32; ) {
        if (0 === n2) break e;
        n2--, d += r[o++] << c, c += 8;
      }
      e.adler = i.check = nr(d), d = 0, c = 0, i.mode = Qi;
    case Qi:
      if (0 === i.havedict) return e.next_out = a, e.avail_out = l, e.next_in = o, e.avail_in = n2, i.hold = d, i.bits = c, Zi;
      e.adler = i.check = 1, i.mode = er;
    case er:
      if (t2 === Hi || t2 === qi) break e;
    case tr:
      if (i.last) {
        d >>>= 7 & c, c -= 7 & c, i.mode = or;
        break;
      }
      for (; c < 3; ) {
        if (0 === n2) break e;
        n2--, d += r[o++] << c, c += 8;
      }
      switch (i.last = 1 & d, d >>>= 1, c -= 1, 3 & d) {
        case 0:
          i.mode = 16193;
          break;
        case 1:
          if (gr(i), i.mode = rr, t2 === qi) {
            d >>>= 2, c -= 2;
            break e;
          }
          break;
        case 2:
          i.mode = 16196;
          break;
        case 3:
          e.msg = "invalid block type", i.mode = ar;
      }
      d >>>= 2, c -= 2;
      break;
    case 16193:
      for (d >>>= 7 & c, c -= 7 & c; c < 32; ) {
        if (0 === n2) break e;
        n2--, d += r[o++] << c, c += 8;
      }
      if ((65535 & d) != (d >>> 16 ^ 65535)) {
        e.msg = "invalid stored block lengths", i.mode = ar;
        break;
      }
      if (i.length = 65535 & d, d = 0, c = 0, i.mode = ir, t2 === qi) break e;
    case ir:
      i.mode = 16195;
    case 16195:
      if (u = i.length, u) {
        if (u > n2 && (u = n2), u > l && (u = l), 0 === u) break e;
        s.set(r.subarray(o, o + u), a), n2 -= u, o += u, l -= u, a += u, i.length -= u;
        break;
      }
      i.mode = er;
      break;
    case 16196:
      for (; c < 14; ) {
        if (0 === n2) break e;
        n2--, d += r[o++] << c, c += 8;
      }
      if (i.nlen = 257 + (31 & d), d >>>= 5, c -= 5, i.ndist = 1 + (31 & d), d >>>= 5, c -= 5, i.ncode = 4 + (15 & d), d >>>= 4, c -= 4, i.nlen > 286 || i.ndist > 30) {
        e.msg = "too many length or distance symbols", i.mode = ar;
        break;
      }
      i.have = 0, i.mode = 16197;
    case 16197:
      for (; i.have < i.ncode; ) {
        for (; c < 3; ) {
          if (0 === n2) break e;
          n2--, d += r[o++] << c, c += 8;
        }
        i.lens[I[i.have++]] = 7 & d, d >>>= 3, c -= 3;
      }
      for (; i.have < 19; ) i.lens[I[i.have++]] = 0;
      if (i.lencode = i.lendyn, i.lenbits = 7, A = { bits: i.lenbits }, E = Ui(0, i.lens, 0, 19, i.lencode, 0, i.work, A), i.lenbits = A.bits, E) {
        e.msg = "invalid code lengths set", i.mode = ar;
        break;
      }
      i.have = 0, i.mode = 16198;
    case 16198:
      for (; i.have < i.nlen + i.ndist; ) {
        for (; S = i.lencode[d & (1 << i.lenbits) - 1], v = S >>> 24, g = S >>> 16 & 255, _ = 65535 & S, !(v <= c); ) {
          if (0 === n2) break e;
          n2--, d += r[o++] << c, c += 8;
        }
        if (_ < 16) d >>>= v, c -= v, i.lens[i.have++] = _;
        else {
          if (16 === _) {
            for (R = v + 2; c < R; ) {
              if (0 === n2) break e;
              n2--, d += r[o++] << c, c += 8;
            }
            if (d >>>= v, c -= v, 0 === i.have) {
              e.msg = "invalid bit length repeat", i.mode = ar;
              break;
            }
            w = i.lens[i.have - 1], u = 3 + (3 & d), d >>>= 2, c -= 2;
          } else if (17 === _) {
            for (R = v + 3; c < R; ) {
              if (0 === n2) break e;
              n2--, d += r[o++] << c, c += 8;
            }
            d >>>= v, c -= v, w = 0, u = 3 + (7 & d), d >>>= 3, c -= 3;
          } else {
            for (R = v + 7; c < R; ) {
              if (0 === n2) break e;
              n2--, d += r[o++] << c, c += 8;
            }
            d >>>= v, c -= v, w = 0, u = 11 + (127 & d), d >>>= 7, c -= 7;
          }
          if (i.have + u > i.nlen + i.ndist) {
            e.msg = "invalid bit length repeat", i.mode = ar;
            break;
          }
          for (; u--; ) i.lens[i.have++] = w;
        }
      }
      if (i.mode === ar) break;
      if (0 === i.lens[256]) {
        e.msg = "invalid code -- missing end-of-block", i.mode = ar;
        break;
      }
      if (i.lenbits = 9, A = { bits: i.lenbits }, E = Ui(1, i.lens, 0, i.nlen, i.lencode, 0, i.work, A), i.lenbits = A.bits, E) {
        e.msg = "invalid literal/lengths set", i.mode = ar;
        break;
      }
      if (i.distbits = 6, i.distcode = i.distdyn, A = { bits: i.distbits }, E = Ui(2, i.lens, i.nlen, i.ndist, i.distcode, 0, i.work, A), i.distbits = A.bits, E) {
        e.msg = "invalid distances set", i.mode = ar;
        break;
      }
      if (i.mode = rr, t2 === qi) break e;
    case rr:
      i.mode = sr;
    case sr:
      if (n2 >= 6 && l >= 258) {
        e.next_out = a, e.avail_out = l, e.next_in = o, e.avail_in = n2, i.hold = d, i.bits = c, $i(e, p), a = e.next_out, s = e.output, l = e.avail_out, o = e.next_in, r = e.input, n2 = e.avail_in, d = i.hold, c = i.bits, i.mode === er && (i.back = -1);
        break;
      }
      for (i.back = 0; S = i.lencode[d & (1 << i.lenbits) - 1], v = S >>> 24, g = S >>> 16 & 255, _ = 65535 & S, !(v <= c); ) {
        if (0 === n2) break e;
        n2--, d += r[o++] << c, c += 8;
      }
      if (g && 0 == (240 & g)) {
        for (b = v, y = g, x = _; S = i.lencode[x + ((d & (1 << b + y) - 1) >> b)], v = S >>> 24, g = S >>> 16 & 255, _ = 65535 & S, !(b + v <= c); ) {
          if (0 === n2) break e;
          n2--, d += r[o++] << c, c += 8;
        }
        d >>>= b, c -= b, i.back += b;
      }
      if (d >>>= v, c -= v, i.back += v, i.length = _, 0 === g) {
        i.mode = 16205;
        break;
      }
      if (32 & g) {
        i.back = -1, i.mode = er;
        break;
      }
      if (64 & g) {
        e.msg = "invalid literal/length code", i.mode = ar;
        break;
      }
      i.extra = 15 & g, i.mode = 16201;
    case 16201:
      if (i.extra) {
        for (R = i.extra; c < R; ) {
          if (0 === n2) break e;
          n2--, d += r[o++] << c, c += 8;
        }
        i.length += d & (1 << i.extra) - 1, d >>>= i.extra, c -= i.extra, i.back += i.extra;
      }
      i.was = i.length, i.mode = 16202;
    case 16202:
      for (; S = i.distcode[d & (1 << i.distbits) - 1], v = S >>> 24, g = S >>> 16 & 255, _ = 65535 & S, !(v <= c); ) {
        if (0 === n2) break e;
        n2--, d += r[o++] << c, c += 8;
      }
      if (0 == (240 & g)) {
        for (b = v, y = g, x = _; S = i.distcode[x + ((d & (1 << b + y) - 1) >> b)], v = S >>> 24, g = S >>> 16 & 255, _ = 65535 & S, !(b + v <= c); ) {
          if (0 === n2) break e;
          n2--, d += r[o++] << c, c += 8;
        }
        d >>>= b, c -= b, i.back += b;
      }
      if (d >>>= v, c -= v, i.back += v, 64 & g) {
        e.msg = "invalid distance code", i.mode = ar;
        break;
      }
      i.offset = _, i.extra = 15 & g, i.mode = 16203;
    case 16203:
      if (i.extra) {
        for (R = i.extra; c < R; ) {
          if (0 === n2) break e;
          n2--, d += r[o++] << c, c += 8;
        }
        i.offset += d & (1 << i.extra) - 1, d >>>= i.extra, c -= i.extra, i.back += i.extra;
      }
      if (i.offset > i.dmax) {
        e.msg = "invalid distance too far back", i.mode = ar;
        break;
      }
      i.mode = 16204;
    case 16204:
      if (0 === l) break e;
      if (u = p - l, i.offset > u) {
        if (u = i.offset - u, u > i.whave && i.sane) {
          e.msg = "invalid distance too far back", i.mode = ar;
          break;
        }
        u > i.wnext ? (u -= i.wnext, f = i.wsize - u) : f = i.wnext - u, u > i.length && (u = i.length), m = i.window;
      } else m = s, f = a - i.offset, u = i.length;
      u > l && (u = l), l -= u, i.length -= u;
      do {
        s[a++] = m[f++];
      } while (--u);
      0 === i.length && (i.mode = sr);
      break;
    case 16205:
      if (0 === l) break e;
      s[a++] = i.length, l--, i.mode = sr;
      break;
    case or:
      if (i.wrap) {
        for (; c < 32; ) {
          if (0 === n2) break e;
          n2--, d |= r[o++] << c, c += 8;
        }
        if (p -= l, e.total_out += p, i.total += p, 4 & i.wrap && p && (e.adler = i.check = i.flags ? pt(i.check, s, p, a - p) : ct(i.check, s, p, a - p)), p = l, 4 & i.wrap && (i.flags ? d : nr(d)) !== i.check) {
          e.msg = "incorrect data check", i.mode = ar;
          break;
        }
        d = 0, c = 0;
      }
      i.mode = 16207;
    case 16207:
      if (i.wrap && i.flags) {
        for (; c < 32; ) {
          if (0 === n2) break e;
          n2--, d += r[o++] << c, c += 8;
        }
        if (4 & i.wrap && d !== (4294967295 & i.total)) {
          e.msg = "incorrect length check", i.mode = ar;
          break;
        }
        d = 0, c = 0;
      }
      i.mode = 16208;
    case 16208:
      E = Wi;
      break e;
    case ar:
      E = ji;
      break e;
    case 16210:
      return Ki;
    default:
      return Vi;
  }
  return e.next_out = a, e.avail_out = l, e.next_in = o, e.avail_in = n2, i.hold = d, i.bits = c, (i.wsize || p !== e.avail_out && i.mode < ar && (i.mode < or || t2 !== Ni)) && _r(e, e.output, e.next_out, p - e.avail_out), h -= e.avail_in, p -= e.avail_out, e.total_in += h, e.total_out += p, i.total += p, 4 & i.wrap && p && (e.adler = i.check = i.flags ? pt(i.check, s, p, e.next_out - p) : ct(i.check, s, p, e.next_out - p)), e.data_type = i.bits + (i.last ? 64 : 0) + (i.mode === er ? 128 : 0) + (i.mode === rr || i.mode === ir ? 256 : 0), (0 === h && 0 === p || t2 === Ni) && E === Gi && (E = Yi), E;
}, yr = { inflateReset: hr, inflateReset2: pr, inflateResetKeep: cr, inflateInit: (e) => ur(e, 15), inflateInit2: ur, inflate: br, inflateEnd: (e) => {
  if (dr(e)) return Vi;
  let t2 = e.state;
  return t2.window && (t2.window = null), e.state = null, Gi;
}, inflateGetHeader: (e, t2) => {
  if (dr(e)) return Vi;
  const i = e.state;
  return 0 == (2 & i.wrap) ? Vi : (i.head = t2, t2.done = false, Gi);
}, inflateSetDictionary: (e, t2) => {
  const i = t2.length;
  let r, s, o;
  return dr(e) ? Vi : (r = e.state, 0 !== r.wrap && r.mode !== Qi ? Vi : r.mode === Qi && (s = 1, s = ct(s, t2, i, 0), s !== r.check) ? ji : (o = _r(e, t2, i, i), o ? (r.mode = 16210, Ki) : (r.havedict = 1, Gi)));
}, inflateInfo: "pako inflate (from Nodeca project)" };
var xr = function() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
};
const wr = Object.prototype.toString, { Z_NO_FLUSH: Er, Z_FINISH: Sr, Z_OK: kr, Z_STREAM_END: Ar, Z_NEED_DICT: Rr, Z_STREAM_ERROR: Ir, Z_DATA_ERROR: Cr, Z_MEM_ERROR: Tr, Z_BUF_ERROR: Lr } = ft, Or = { chunkSize: 65536, windowBits: 15, to: "" };
function Dr(e) {
  this.options = mi.assign({}, Or, e || {});
  const t2 = this.options;
  t2.raw && t2.windowBits >= 0 && t2.windowBits < 16 && (t2.windowBits = -t2.windowBits, 0 === t2.windowBits && (t2.windowBits = -15)), !(t2.windowBits >= 0 && t2.windowBits < 16) || e && e.windowBits || (t2.windowBits += 32), t2.windowBits > 15 && t2.windowBits < 48 && 0 == (15 & t2.windowBits) && (t2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new bi(), this.strm.avail_out = 0;
  let i = yr.inflateInit2(this.strm, t2.windowBits);
  if (i !== kr) throw new Error(ut[i]);
  if (this.header = new xr(), yr.inflateGetHeader(this.strm, this.header), t2.dictionary && ("string" == typeof t2.dictionary ? t2.dictionary = _i.string2buf(t2.dictionary) : "[object ArrayBuffer]" === wr.call(t2.dictionary) && (t2.dictionary = new Uint8Array(t2.dictionary)), t2.raw && (i = yr.inflateSetDictionary(this.strm, t2.dictionary), i !== kr))) throw new Error(ut[i]);
}
Dr.prototype.push = function(e, t2) {
  const i = this.strm, r = this.options.chunkSize, s = this.options.dictionary;
  let o, a, n2;
  if (this.ended) return false;
  for (a = t2 === ~~t2 ? t2 : true === t2 ? Sr : Er, "[object ArrayBuffer]" === wr.call(e) ? i.input = new Uint8Array(e) : i.input = e, i.next_in = 0, i.avail_in = i.input.length; ; ) {
    for (0 === i.avail_out && (i.output = new Uint8Array(r), i.next_out = 0, i.avail_out = r), o = yr.inflate(i, a), o === Rr && s && (o = yr.inflateSetDictionary(i, s), o === kr ? o = yr.inflate(i, a) : o === Cr && (o = Rr)); i.avail_in > 0 && o === Ar && 2 & i.state.wrap && 0 !== i.state.flags && 0 !== i.input[i.next_in]; ) yr.inflateReset(i), o = yr.inflate(i, a);
    switch (o) {
      case Ir:
      case Cr:
      case Rr:
      case Tr:
        return this.onEnd(o), this.ended = true, false;
    }
    if (n2 = i.avail_out, i.next_out && (0 === i.avail_out || o === Ar || a > 0)) if ("string" === this.options.to) {
      let e2 = _i.utf8border(i.output, i.next_out), t3 = i.next_out - e2, s2 = _i.buf2string(i.output, e2);
      i.next_out = t3, i.avail_out = r - t3, t3 && i.output.set(i.output.subarray(e2, e2 + t3), 0), this.onData(s2);
    } else this.onData(i.output.length === i.next_out ? i.output : i.output.subarray(0, i.next_out)), i.avail_out = 0, i.next_out = 0;
    if (o !== kr && o !== Lr || 0 !== n2) {
      if (o === Ar) return o = yr.inflateEnd(this.strm), this.onEnd(o), this.ended = true, true;
      if (0 === i.avail_in) {
        if (a === Sr) return o = yr.inflateEnd(this.strm), this.onEnd(o === kr ? Lr : o), this.ended = true, false;
        break;
      }
    }
  }
  return true;
}, Dr.prototype.onData = function(e) {
  this.chunks.push(e);
}, Dr.prototype.onEnd = function(e) {
  e === kr && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = mi.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
var $r = { Inflate: Dr };
const { deflate: Mr } = Oi, { Inflate: Pr } = $r;
var Fr = Mr, zr = Pr;
function Br(e, t2, i = 255) {
  const r = e.length % t2;
  if (0 !== r) {
    const s = new Uint8Array(t2 - r).fill(i), o = new Uint8Array(e.length + s.length);
    return o.set(e), o.set(s, e.length), o;
  }
  return e;
}
function Ur(e, t2 = 239) {
  for (let i = 0; i < e.length; i++) t2 ^= e[i];
  return t2;
}
function Nr(e) {
  const t2 = new Uint8Array(e.length);
  for (let i = 0; i < e.length; i++) t2[i] = e.charCodeAt(i);
  return t2;
}
function Hr(e) {
  return new Promise(((t2) => setTimeout(t2, e)));
}
class qr {
  constructor(e, t2 = false, i = true) {
    this.device = e, this.tracing = t2, this.slipReaderEnabled = false, this.baudrate = 0, this.traceLog = "", this.lastTraceTime = Date.now(), this.buffer = new Uint8Array(0), this.onDeviceLostCallback = null, this.SLIP_END = 192, this.SLIP_ESC = 219, this.SLIP_ESC_END = 220, this.SLIP_ESC_ESC = 221, this._DTR_state = false, this.slipReaderEnabled = i;
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
    const t2 = `${`TRACE ${(Date.now() - this.lastTraceTime).toFixed(3)}`} ${e}`;
    console.log(t2), this.traceLog += t2 + "\n";
  }
  async returnTrace() {
    try {
      await navigator.clipboard.writeText(this.traceLog), console.log("Text copied to clipboard!");
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  }
  hexify(e) {
    return Array.from(e).map(((e2) => e2.toString(16).padStart(2, "0"))).join("").padEnd(16, " ");
  }
  hexConvert(e, t2 = true) {
    if (t2 && e.length > 16) {
      let t3 = "", i = e;
      for (; i.length > 0; ) {
        const e2 = i.slice(0, 16), r = String.fromCharCode(...e2).split("").map(((e3) => " " === e3 || e3 >= " " && e3 <= "~" && "  " !== e3 ? e3 : ".")).join("");
        i = i.slice(16), t3 += `
    ${this.hexify(e2.slice(0, 8))} ${this.hexify(e2.slice(8))} | ${r}`;
      }
      return t3;
    }
    return this.hexify(e);
  }
  slipWriter(e) {
    const t2 = [];
    t2.push(192);
    for (let i = 0; i < e.length; i++) 219 === e[i] ? t2.push(219, 221) : 192 === e[i] ? t2.push(219, 220) : t2.push(e[i]);
    return t2.push(192), new Uint8Array(t2);
  }
  async write(e) {
    const t2 = this.slipWriter(e);
    if (this.device.writable) {
      const e2 = this.device.writable.getWriter();
      this.tracing && this.trace(`Write ${t2.length} bytes: ${this.hexConvert(t2)}`), await e2.write(t2), e2.releaseLock();
    }
  }
  appendArray(e, t2) {
    const i = new Uint8Array(e.length + t2.length);
    return i.set(e), i.set(t2, e.length), i;
  }
  async readLoop() {
    for (var e; this.device.readable; ) {
      this.reader = null === (e = this.device.readable) || void 0 === e ? void 0 : e.getReader();
      try {
        const { value: e2, done: t2 } = await this.reader.read();
        if (t2) {
          this.trace("Serial port done");
          break;
        }
        if (e2 && e2.length) {
          const t3 = Uint8Array.from(e2);
          this.buffer = this.appendArray(this.buffer, t3);
        }
      } catch (e2) {
        if (e2 instanceof Error) {
          if (["BufferOverrunError", "FramingError", "BreakError", "ParityError"].includes(e2.name)) {
            this.trace(`Recoverable serial port error: ${e2.message}`);
            continue;
          }
          this.trace(`Unrecoverable serial port error: ${e2.message}`);
          break;
        }
        if (e2 instanceof DOMException) {
          this.onDeviceLostCallback ? this.onDeviceLostCallback() : this.trace(`Unrecoverable serial port error: ${e2.message}`);
          break;
        }
        this.trace(`Unrecoverable serial port error: ${e2}`);
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
    const t2 = new TextDecoder("utf-8").decode(e), i = t2.match(/G?uru Meditation Error: (?:Core \d panic'ed \(([a-zA-Z ]*)\))?/) || t2.match(/F?atal exception \(\d+\): (?:([a-zA-Z ]*)?.*epc)?/);
    if (i) {
      const e2 = i[1] || i[2];
      throw new Error("Guru Meditation Error detected" + (e2 ? ` (${e2})` : ""));
    }
  }
  async read(e) {
    let t2 = null, i = false, r = null;
    for (; ; ) {
      const s = Date.now();
      for (r = new Uint8Array(0); Date.now() - s < e; ) {
        if (this.buffer.length > 0) {
          r = this.buffer, this.buffer = new Uint8Array(0);
          break;
        }
        await Hr(1);
      }
      if (!r || 0 === r.length) {
        const e2 = null === t2 ? "Serial data stream stopped: Possible serial noise or corruption." : "No serial data received.";
        throw this.tracing && this.trace(e2), new Error(e2);
      }
      this.tracing && this.trace(`Read ${r.length} bytes: ${this.hexConvert(r)}`);
      for (let e2 = 0; e2 < r.length; e2++) {
        const s2 = r[e2];
        if (null === t2) {
          if (s2 !== this.SLIP_END) {
            this.tracing && this.trace(`Read invalid data: ${this.hexConvert(r)}`);
            const e3 = this.buffer;
            throw this.tracing && this.trace(`Remaining data in serial buffer: ${this.hexConvert(e3)}`), this.detectPanicHandler(new Uint8Array([...r, ...e3 || []])), new Error(`Invalid head of packet (0x${s2.toString(16)}): Possible serial noise or corruption.`);
          }
          t2 = new Uint8Array(0);
        } else if (i) if (i = false, s2 === this.SLIP_ESC_END) t2 = this.appendArray(t2, new Uint8Array([this.SLIP_END]));
        else {
          if (s2 !== this.SLIP_ESC_ESC) {
            this.tracing && this.trace(`Read invalid data: ${this.hexConvert(r)}`);
            const e3 = this.buffer;
            throw this.tracing && this.trace(`Remaining data in serial buffer: ${this.hexConvert(e3)}`), this.detectPanicHandler(new Uint8Array([...r, ...e3 || []])), new Error(`Invalid SLIP escape (0xdb, 0x${s2.toString(16)})`);
          }
          t2 = this.appendArray(t2, new Uint8Array([this.SLIP_ESC]));
        }
        else if (s2 === this.SLIP_ESC) i = true;
        else {
          if (s2 === this.SLIP_END) {
            if (this.tracing && this.trace(`Received full packet: ${this.hexConvert(t2)}`), e2 + 1 < r.length) {
              const t3 = r.slice(e2 + 1);
              this.buffer = this.appendArray(t3, this.buffer);
            }
            return t2;
          }
          t2 = this.appendArray(t2, new Uint8Array([s2]));
        }
      }
    }
  }
  async rawRead(e, t2) {
    let i;
    try {
      if (!this.device.readable) return;
      for (i = this.device.readable.getReader(); !t2(); ) {
        const { value: t3, done: r } = await i.read();
        if (r || !t3) break;
        this.tracing && this.trace(`Read ${t3.length} bytes: ${this.hexConvert(t3)}`), e(t3);
      }
    } catch (e2) {
      this.trace(`Error reading from serial port: ${e2}`), e2 instanceof Error && "NetworkError" === e2.name && e2.message.includes("device has been lost") && (this.trace("Device lost detected (NetworkError)"), this.onDeviceLostCallback && this.onDeviceLostCallback());
    } finally {
      null == i || i.releaseLock();
    }
  }
  async setRTS(e) {
    await this.device.setSignals({ requestToSend: e }), await this.setDTR(this._DTR_state);
  }
  async setDTR(e) {
    this._DTR_state = e, await this.device.setSignals({ dataTerminalReady: e });
  }
  async connect(e = 115200, t2 = {}) {
    await this.device.open({ baudRate: e, dataBits: null == t2 ? void 0 : t2.dataBits, stopBits: null == t2 ? void 0 : t2.stopBits, bufferSize: null == t2 ? void 0 : t2.bufferSize, parity: null == t2 ? void 0 : t2.parity, flowControl: null == t2 ? void 0 : t2.flowControl }), this.baudrate = e;
  }
  async waitForUnlock(e) {
    for (; this.device.readable && this.device.readable.locked || this.device.writable && this.device.writable.locked; ) await Hr(e);
  }
  async disconnect() {
    var e, t2;
    (null === (e = this.device.readable) || void 0 === e ? void 0 : e.locked) && await (null === (t2 = this.reader) || void 0 === t2 ? void 0 : t2.cancel()), await this.waitForUnlock(400), await this.device.close(), this.reader = void 0;
  }
}
function Gr(e) {
  return new Promise(((t2) => setTimeout(t2, e)));
}
class Wr {
  constructor(e, t2) {
    this.resetDelay = t2, this.transport = e;
  }
  async reset() {
    await this.transport.setDTR(false), await this.transport.setRTS(true), await Gr(100), await this.transport.setDTR(true), await this.transport.setRTS(false), await Gr(this.resetDelay), await this.transport.setDTR(false);
  }
}
class Zr {
  constructor(e) {
    this.transport = e;
  }
  async reset() {
    await this.transport.setRTS(false), await this.transport.setDTR(false), await Gr(100), await this.transport.setDTR(true), await this.transport.setRTS(false), await Gr(100), await this.transport.setRTS(true), await this.transport.setDTR(false), await this.transport.setRTS(true), await Gr(100), await this.transport.setRTS(false), await this.transport.setDTR(false);
  }
}
class Vr {
  constructor(e, t2 = false) {
    this.transport = e, this.usingUsbOtg = t2, this.transport = e;
  }
  async reset() {
    this.usingUsbOtg ? (await Gr(200), await this.transport.setRTS(false), await Gr(200)) : (await Gr(100), await this.transport.setRTS(false));
  }
}
class jr {
  constructor(e, t2) {
    this.transport = e, this.sequenceString = t2, this.transport = e;
  }
  async reset() {
    const e = { D: async (e2) => await this.transport.setDTR(e2), R: async (e2) => await this.transport.setRTS(e2), W: async (e2) => await Gr(e2) };
    try {
      if (!(function(e2) {
        const t3 = ["D", "R", "W"], i = e2.split("|");
        for (const e3 of i) {
          const i2 = e3[0], r = e3.slice(1);
          if (!t3.includes(i2)) return false;
          if ("D" === i2 || "R" === i2) {
            if ("0" !== r && "1" !== r) return false;
          } else if ("W" === i2) {
            const e4 = parseInt(r);
            if (isNaN(e4) || e4 <= 0) return false;
          }
        }
        return true;
      })(this.sequenceString)) return;
      const t2 = this.sequenceString.split("|");
      for (const i of t2) {
        const t3 = i[0], r = i.slice(1);
        "W" === t3 ? await e.W(Number(r)) : "D" !== t3 && "R" !== t3 || await e[t3]("1" === r);
      }
    } catch (e2) {
      throw new Error("Invalid custom reset sequence");
    }
  }
}
function Kr(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Yr, Xr;
var Jr = Kr(Xr ? Yr : (Xr = 1, Yr = function(e) {
  return atob(e);
}));
async function Qr(e, t2) {
  let i;
  switch (e) {
    case "ESP32":
      i = await import("./circuitsetup-energy-meter-helper-stub_flasher_32-BLbsWvxO-D30i_y3i.js");
      break;
    case "ESP32-C2":
      i = await import("./circuitsetup-energy-meter-helper-stub_flasher_32c2-wLQhZItC-BBtCrlqr.js");
      break;
    case "ESP32-C3":
      i = await import("./circuitsetup-energy-meter-helper-stub_flasher_32c3-DmSvHQKL-Bpvb0Iq1.js");
      break;
    case "ESP32-C5":
      i = await import("./circuitsetup-energy-meter-helper-stub_flasher_32c5-D1WK4DyB-BsO_p6Qw.js");
      break;
    case "ESP32-C6":
      i = await import("./circuitsetup-energy-meter-helper-stub_flasher_32c6-ZuxjUVr4-BxrQ0Eqa.js");
      break;
    case "ESP32-C61":
      i = await import("./circuitsetup-energy-meter-helper-stub_flasher_32c61-DeKkw9vN-NNL9VeJJ.js");
      break;
    case "ESP32-H2":
      i = await import("./circuitsetup-energy-meter-helper-stub_flasher_32h2-CZ4EIL3w-BISVcebL.js");
      break;
    case "ESP32-P4":
      i = t2 && t2 < 300 ? await import("./circuitsetup-energy-meter-helper-stub_flasher_32p4rc1-DyGqUAeZ-DVfuoGhE.js") : await import("./circuitsetup-energy-meter-helper-stub_flasher_32p4-CpHBYEwI-B3AImzDu.js");
      break;
    case "ESP32-S2":
      i = await import("./circuitsetup-energy-meter-helper-stub_flasher_32s2-CrsP1231-9mSCQz8X.js");
      break;
    case "ESP32-S3":
      i = await import("./circuitsetup-energy-meter-helper-stub_flasher_32s3-CiJyd6Fk-RjPSmnXX.js");
      break;
    case "ESP8266":
      i = await import("./circuitsetup-energy-meter-helper-stub_flasher_8266-CQFcqJ_a-DFaFRWu6.js");
  }
  if (i) return { bss_start: i.bss_start, data: i.data, data_start: i.data_start, entry: i.entry, text: i.text, text_start: i.text_start, decodedData: es(i.data), decodedText: es(i.text) };
}
function es(e) {
  const t2 = Jr(e).split("").map((function(e2) {
    return e2.charCodeAt(0);
  }));
  return new Uint8Array(t2);
}
class ts {
  constructor() {
    this.FLASH_SIZES = { "1MB": 0, "2MB": 16, "4MB": 32, "8MB": 48, "16MB": 64, "32MB": 80, "64MB": 96, "128MB": 112 }, this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "26m": 1, "20m": 2 };
  }
  getEraseSize(e, t2) {
    return t2;
  }
}
class is extends ts {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP8266", this.CHIP_DETECT_MAGIC_VALUE = [4293968129], this.EFUSE_RD_REG_BASE = 1072693328, this.UART_CLKDIV_REG = 1610612756, this.UART_CLKDIV_MASK = 1048575, this.XTAL_CLK_DIVIDER = 2, this.FLASH_WRITE_SIZE = 16384, this.BOOTLOADER_FLASH_OFFSET = 0, this.UART_DATE_REG_ADDR = 0, this.FLASH_SIZES = { "512KB": 0, "256KB": 16, "1MB": 32, "2MB": 48, "4MB": 64, "2MB-c1": 80, "4MB-c1": 96, "8MB": 128, "16MB": 144 }, this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "26m": 1, "20m": 2 }, this.MEMORY_MAP = [[1072693248, 1072693264, "DPORT"], [1073643520, 1073741824, "DRAM"], [1074790400, 1074823168, "IRAM"], [1075843088, 1076760592, "IROM"]], this.SPI_REG_BASE = 1610613248, this.SPI_USR_OFFS = 28, this.SPI_USR1_OFFS = 32, this.SPI_USR2_OFFS = 36, this.SPI_MOSI_DLEN_OFFS = 0, this.SPI_MISO_DLEN_OFFS = 0, this.SPI_W0_OFFS = 64, this.getChipFeatures = async (e) => {
      const t2 = ["WiFi"];
      return "ESP8285" == await this.getChipDescription(e) && t2.push("Embedded Flash"), t2;
    };
  }
  async readEfuse(e, t2) {
    const i = this.EFUSE_RD_REG_BASE + 4 * t2;
    return e.debug("Read efuse " + i), await e.readReg(i);
  }
  async getChipDescription(e) {
    const t2 = await this.readEfuse(e, 2);
    return 0 != (16 & await this.readEfuse(e, 0) | 65536 & t2) ? "ESP8285" : "ESP8266EX";
  }
  async getCrystalFreq(e) {
    const t2 = await e.readReg(this.UART_CLKDIV_REG) & this.UART_CLKDIV_MASK, i = e.transport.baudrate * t2 / 1e6 / this.XTAL_CLK_DIVIDER;
    let r;
    return r = i > 33 ? 40 : 26, Math.abs(r - i) > 1 && e.info("WARNING: Detected crystal freq " + i + "MHz is quite different to normalized freq " + r + "MHz. Unsupported crystal in use?"), r;
  }
  _d2h(e) {
    const t2 = (+e).toString(16);
    return 1 === t2.length ? "0" + t2 : t2;
  }
  async readMac(e) {
    let t2 = await this.readEfuse(e, 0);
    t2 >>>= 0;
    let i = await this.readEfuse(e, 1);
    i >>>= 0;
    let r = await this.readEfuse(e, 3);
    r >>>= 0;
    const s = new Uint8Array(6);
    return 0 != r ? (s[0] = r >> 16 & 255, s[1] = r >> 8 & 255, s[2] = 255 & r) : 0 == (i >> 16 & 255) ? (s[0] = 24, s[1] = 254, s[2] = 52) : 1 == (i >> 16 & 255) ? (s[0] = 172, s[1] = 208, s[2] = 116) : e.error("Unknown OUI"), s[3] = i >> 8 & 255, s[4] = 255 & i, s[5] = t2 >> 24 & 255, this._d2h(s[0]) + ":" + this._d2h(s[1]) + ":" + this._d2h(s[2]) + ":" + this._d2h(s[3]) + ":" + this._d2h(s[4]) + ":" + this._d2h(s[5]);
  }
  getEraseSize(e, t2) {
    return t2;
  }
}
is.IROM_MAP_START = 1075838976, is.IROM_MAP_END = 1076887552;
var rs = Object.freeze({ __proto__: null, ESP8266ROM: is });
const ss = 233;
function os(e, t2) {
  return e + (t2 - 1 - e % t2);
}
function as(e, t2) {
  return e[t2] | e[t2 + 1] << 8 | e[t2 + 2] << 16 | e[t2 + 3] << 24;
}
class ns {
  constructor(e, t2, i = null, r = 0) {
    this.addr = e, this.data = t2, this.fileOffs = i, this.flags = r, this.includeInChecksum = true, 0 !== this.addr && this.padToAlignment(4);
  }
  copyWithNewAddr(e) {
    return new ns(e, this.data, 0);
  }
  splitImage(e) {
    const t2 = new ns(this.addr, this.data.slice(0, e), 0);
    return this.data = this.data.slice(e), this.addr += e, this.fileOffs = null, t2;
  }
  toString() {
    let e = `len 0x${this.data.length.toString(16).padStart(5, "0")} load 0x${this.addr.toString(16).padStart(8, "0")}`;
    return null !== this.fileOffs && (e += ` file_offs 0x${this.fileOffs.toString(16).padStart(8, "0")}`), e;
  }
  getMemoryType(e) {
    return e.ROM_LOADER.MEMORY_MAP.filter(((e2) => e2[0] <= this.addr && this.addr < e2[1])).map(((e2) => e2[2]));
  }
  padToAlignment(e) {
    this.data = Br(this.data, e, 0);
  }
}
class ls extends ns {
  constructor(e, t2, i, r) {
    super(t2, i, null, r), this.name = e;
  }
  toString() {
    return `${this.name} ${super.toString()}`;
  }
}
class ds {
  constructor(e) {
    this.SEG_HEADER_LEN = 8, this.SHA256_DIGEST_LEN = 32, this.ELF_FLAG_WRITE = 1, this.ELF_FLAG_READ = 2, this.ELF_FLAG_EXEC = 4, this.segments = [], this.entrypoint = 0, this.elfSha256 = null, this.elfSha256Offset = 0, this.padToSize = 0, this.flashMode = 0, this.flashSizeFreq = 0, this.checksum = 0, this.datalength = 0, this.IROM_ALIGN = 0, this.MMU_PAGE_SIZE_CONF = [], this.ROM_LOADER = e;
  }
  loadCommonHeader(e, t2, i) {
    const r = e[t2], s = e[t2 + 1];
    if (this.flashMode = e[t2 + 2], this.flashSizeFreq = e[t2 + 3], this.entrypoint = as(e, t2 + 4), r !== i) throw new Se(`Invalid firmware image magic=0x${r.toString(16)}`);
    return s;
  }
  verify() {
    if (this.segments.length > 16) throw new Se(`Invalid segment count ${this.segments.length} (max 16). Usually this indicates a linker script problem.`);
  }
  loadSegment(e, t2, i = false) {
    const r = t2, s = as(e, t2), o = as(e, t2 + 4);
    this.warnIfUnusualSegment(s, o, i);
    const a = e.slice(t2 + 8, t2 + 8 + o);
    if (a.length < o) throw new Se(`End of file reading segment 0x${s.toString(16)}, length ${o} (actual length ${a.length})`);
    const n2 = new ns(s, a, r);
    return this.segments.push(n2), n2;
  }
  warnIfUnusualSegment(e, t2, i) {
    i || (e > 1075838976 || e < 1073610752 || t2 > 65536) && console.warn(`WARNING: Suspicious segment 0x${e.toString(16)}, length ${t2}`);
  }
  maybePatchSegmentData(e, t2) {
    const i = e.length;
    if (this.elfSha256Offset >= t2 && this.elfSha256Offset < t2 + i) {
      const r = this.elfSha256Offset - t2;
      if (r < this.SEG_HEADER_LEN || r + this.SHA256_DIGEST_LEN > i) throw new Se(`Cannot place SHA256 digest on segment boundary(elf_sha256_offset=${this.elfSha256Offset}, file_pos=${t2}, segment_size=${i})`);
      const s = r - this.SEG_HEADER_LEN;
      if (!e.slice(s, s + this.SHA256_DIGEST_LEN).every(((e2) => 0 === e2))) throw new Se(`Contents of segment at SHA256 digest offset 0x${this.elfSha256Offset.toString(16)} are not all zero. Refusing to overwrite.`);
      if (!this.elfSha256 || this.elfSha256.length !== this.SHA256_DIGEST_LEN) throw new Se("ELF SHA256 digest is not properly initialized");
      const o = e.slice(0, s), a = e.slice(s + this.SHA256_DIGEST_LEN), n2 = o.length + this.elfSha256.length + a.length, l = new Uint8Array(n2);
      return l.set(o, 0), l.set(this.elfSha256, o.length), l.set(a, o.length + this.elfSha256.length), l;
    }
    return e;
  }
  saveSegment(e, t2, i, r = null) {
    const s = this.maybePatchSegmentData(i.data, t2), o = new DataView(e.buffer, t2);
    return o.setUint32(0, i.addr, true), o.setUint32(4, s.length, true), e.set(s, t2 + 8), null !== r ? Ur(s, r) : 0;
  }
  saveFlashSegment(e, t2, i, r = null) {
    if ("ESP32" === this.ROM_LOADER.CHIP_NAME) {
      const e2 = (t2 + i.data.length + this.SEG_HEADER_LEN) % this.IROM_ALIGN;
      if (e2 < 36) {
        const t3 = new Uint8Array(i.data.length + (36 - e2));
        t3.set(i.data), t3.fill(0, i.data.length), i.data = t3;
      }
    }
    return this.saveSegment(e, t2, i, r);
  }
  readChecksum(e, t2) {
    return e[os(t2, 16)];
  }
  calculateChecksum() {
    let e = 239;
    for (const t2 of this.segments) t2.includeInChecksum && (e = Ur(t2.data, e));
    return e;
  }
  appendChecksum(e, t2, i) {
    e[os(t2, 16)] = i;
  }
  writeCommonHeader(e, t2, i) {
    e[t2] = ss, e[t2 + 1] = i, e[t2 + 2] = this.flashMode, e[t2 + 3] = this.flashSizeFreq;
    new DataView(e.buffer, t2 + 4).setUint32(0, this.entrypoint, true);
  }
  isIromAddr(e) {
    return is.IROM_MAP_START <= e && e < is.IROM_MAP_END;
  }
  getIromSegment() {
    const e = this.segments.filter(((e2) => this.isIromAddr(e2.addr)));
    if (e.length > 0) {
      if (1 !== e.length) throw new Se(`Found ${e.length} segments that could be irom0. Bad ELF file?`);
      return e[0];
    }
    return null;
  }
  getNonIromSegments() {
    const e = this.getIromSegment();
    return this.segments.filter(((t2) => t2 !== e));
  }
  sortSegments() {
    this.segments.length && this.segments.sort(((e, t2) => e.addr - t2.addr));
  }
  mergeAdjacentSegments() {
    if (!this.segments.length) return;
    const e = [];
    for (let t2 = this.segments.length - 1; t2 > 0; t2--) {
      const i = this.segments[t2 - 1], r = this.segments[t2];
      if (i.getMemoryType(this).join(",") === r.getMemoryType(this).join(",") && i.includeInChecksum === r.includeInChecksum && r.addr === i.addr + i.data.length && (r.flags & this.ELF_FLAG_EXEC) == (i.flags & this.ELF_FLAG_EXEC)) {
        const e2 = new Uint8Array(i.data.length + r.data.length);
        e2.set(i.data), e2.set(r.data, i.data.length), i.data = e2;
      } else e.unshift(r);
    }
    e.unshift(this.segments[0]), this.segments = e;
  }
  setMmuPageSize(e) {
    if (this.MMU_PAGE_SIZE_CONF || e === this.IROM_ALIGN) {
      if (this.MMU_PAGE_SIZE_CONF && !this.MMU_PAGE_SIZE_CONF.includes(e)) {
        const t2 = this.MMU_PAGE_SIZE_CONF.map(((e2) => e2 / 1024 + "KB")).join(", ");
        throw new Se(`${e} bytes is not a valid ${this.ROM_LOADER.CHIP_NAME} page size, select from ${t2}.`);
      }
      this.IROM_ALIGN = e;
    } else console.warn(`WARNING: Changing MMU page size is not supported on ${this.ROM_LOADER.CHIP_NAME}! ` + (0 !== this.IROM_ALIGN ? `Defaulting to ${this.IROM_ALIGN / 1024}KB.` : ""));
  }
}
class cs extends ds {
  constructor(e, t2 = null, i = true, r = false) {
    super(e), this.securePad = null, this.flashMode = 0, this.flashSizeFreq = 0, this.version = 1, this.WP_PIN_DISABLED = 238, this.wpPin = this.WP_PIN_DISABLED, this.clkDrv = 0, this.qDrv = 0, this.dDrv = 0, this.csDrv = 0, this.hdDrv = 0, this.wpDrv = 0, this.chipId = 0, this.minRev = 0, this.minRevFull = 0, this.maxRevFull = 0, this.storedDigest = null, this.calcDigest = null, this.dataLength = 0, this.IROM_ALIGN = 65536, this.ROM_LOADER = e, this.appendDigest = i, this.ramOnlyHeader = r, null !== t2 && this.loadFromFile(t2);
  }
  async loadFromFile(e) {
    const t2 = e instanceof Uint8Array ? e : Nr(e);
    let i = 0;
    const r = this.loadCommonHeader(t2, i, ss);
    i += 8, this.loadExtendedHeader(t2, i), i += 16;
    for (let e2 = 0; e2 < r; e2++) {
      i += 8 + this.loadSegment(t2, i).data.length;
    }
    if (this.checksum = this.readChecksum(t2, i), i = os(i, 16), this.appendDigest) {
      const e2 = i;
      this.storedDigest = t2.slice(i, i + this.SHA256_DIGEST_LEN);
      const r2 = await crypto.subtle.digest("SHA-256", t2.slice(0, e2));
      this.calcDigest = new Uint8Array(r2), this.dataLength = e2 - 0;
    }
    this.verify();
  }
  isFlashAddr(e) {
    return this.ROM_LOADER.IROM_MAP_START <= e && e < this.ROM_LOADER.IROM_MAP_END || this.ROM_LOADER.DROM_MAP_START <= e && e < this.ROM_LOADER.DROM_MAP_END;
  }
  async save() {
    let e = 0;
    const t2 = new Uint8Array(1048576);
    let i = 0;
    this.writeCommonHeader(t2, i, this.segments.length), i += 8, this.saveExtendedHeader(t2, i), i += 16;
    let r = 239;
    const s = this.segments.filter(((e2) => this.isFlashAddr(e2.addr))).sort(((e2, t3) => e2.addr - t3.addr)), o = this.segments.filter(((e2) => !this.isFlashAddr(e2.addr))).sort(((e2, t3) => e2.addr - t3.addr));
    for (let e2 = 0; e2 < s.length; e2++) {
      const t3 = s[e2];
      if (t3 instanceof ls && ".flash.appdesc" === t3.name) {
        s.splice(e2, 1), s.unshift(t3);
        break;
      }
    }
    for (let e2 = 0; e2 < o.length; e2++) {
      const t3 = o[e2];
      if (t3 instanceof ls && ".dram0.bootdesc" === t3.name) {
        o.splice(e2, 1), o.unshift(t3);
        break;
      }
    }
    if (s.length > 0) {
      let e2 = s[0].addr;
      for (const t3 of s.slice(1)) {
        if (Math.floor(t3.addr / this.IROM_ALIGN) === Math.floor(e2 / this.IROM_ALIGN)) throw new Se(`Segment loaded at 0x${t3.addr.toString(16)} lands in same 64KB flash mapping as segment loaded at 0x${e2.toString(16)}. Can't generate binary. Suggest changing linker script or ELF to merge sections.`);
        e2 = t3.addr;
      }
    }
    if (this.ramOnlyHeader) {
      for (const s2 of o) r = this.saveSegment(t2, i, s2, r), i += 8 + s2.data.length, e++;
      this.appendChecksum(t2, i, r), i = os(i, 16);
      for (const o2 of s.reverse()) {
        let s2 = this.getAlignmentDataNeeded(o2, i);
        if (s2 > 0) {
          s2 < this.ROM_LOADER.BOOTLOADER_FLASH_OFFSET - this.SEG_HEADER_LEN && (s2 += this.IROM_ALIGN), s2 -= this.ROM_LOADER.BOOTLOADER_FLASH_OFFSET;
          const o3 = new ns(0, new Uint8Array(s2).fill(0), i);
          r = this.saveSegment(t2, i, o3, r), i += 8 + s2, e++;
        }
        this.saveFlashSegment(t2, i, o2), i += 8 + o2.data.length, e++;
      }
    } else {
      for (; s.length > 0; ) {
        const a2 = s[0], n2 = this.getAlignmentDataNeeded(a2, i);
        if (n2 > 0) {
          if (o.length > 0 && n2 > this.SEG_HEADER_LEN) {
            const e2 = o[0].splitImage(n2);
            0 === o[0].data.length && o.shift(), r = this.saveSegment(t2, i, e2, r);
          } else {
            const e2 = new ns(0, new Uint8Array(n2).fill(0), i);
            r = this.saveSegment(t2, i, e2, r);
          }
          i += 8 + n2, e++;
        } else {
          if ((i + 8) % this.IROM_ALIGN != a2.addr % this.IROM_ALIGN) throw new Error("Flash segment alignment mismatch");
          r = this.saveFlashSegment(t2, i, a2, r), s.shift(), i += 8 + a2.data.length, e++;
        }
      }
      for (const s2 of o) r = this.saveSegment(t2, i, s2, r), i += 8 + s2.data.length, e++;
    }
    if (this.securePad) {
      if (!this.appendDigest) throw new Error("secure_pad only applies if a SHA-256 digest is also appended to the image");
      const s2 = (i + this.SEG_HEADER_LEN) % this.IROM_ALIGN, o2 = 16;
      let a2 = 0;
      "1" === this.securePad ? a2 = 112 : "2" === this.securePad && (a2 = 32);
      const n2 = (this.IROM_ALIGN - s2 - o2 - a2) % this.IROM_ALIGN, l = new ns(0, new Uint8Array(n2).fill(0), i);
      r = this.saveSegment(t2, i, l, r), i += 8 + n2, e++;
    }
    this.ramOnlyHeader || (this.appendChecksum(t2, i, r), i = os(i, 16));
    const a = i;
    if (this.ramOnlyHeader ? t2[1] = o.length : t2[1] = e, this.appendDigest) {
      const e2 = await crypto.subtle.digest("SHA-256", t2.slice(0, a)), r2 = new Uint8Array(e2);
      t2.set(r2, a), i += 32;
    }
    if (this.padToSize && i % this.padToSize != 0) {
      const e2 = this.padToSize - i % this.padToSize, r2 = new Uint8Array(e2);
      r2.fill(255), t2.set(r2, i), i += e2;
    }
    return t2;
  }
  loadExtendedHeader(e, t2) {
    const i = new DataView(e.buffer, t2);
    this.wpPin = i.getUint8(0);
    const r = i.getUint8(1);
    [this.clkDrv, this.qDrv] = this.splitByte(r);
    const s = i.getUint8(2);
    [this.dDrv, this.csDrv] = this.splitByte(s);
    const o = i.getUint8(3);
    [this.hdDrv, this.wpDrv] = this.splitByte(o), this.chipId = i.getUint8(4), this.chipId !== this.ROM_LOADER.IMAGE_CHIP_ID && console.warn(`Unexpected chip id in image. Expected ${this.ROM_LOADER.IMAGE_CHIP_ID} but value was ${this.chipId}. Is this image for a different chip model?`), this.minRev = i.getUint8(5), this.minRevFull = i.getUint16(6, true), this.maxRevFull = i.getUint16(8, true);
    const a = i.getUint8(15);
    if (0 !== a && 1 !== a) throw new Error(`Invalid value for append_digest field (0x${a.toString(16)}). Should be 0 or 1.`);
    this.appendDigest = 1 === a;
  }
  saveExtendedHeader(e, t2) {
    const i = new ArrayBuffer(16), r = new DataView(i);
    r.setUint8(0, this.wpPin), r.setUint8(1, this.joinByte(this.clkDrv, this.qDrv)), r.setUint8(2, this.joinByte(this.dDrv, this.csDrv)), r.setUint8(3, this.joinByte(this.hdDrv, this.wpDrv)), r.setUint8(4, this.ROM_LOADER.IMAGE_CHIP_ID), r.setUint8(5, this.minRev), r.setUint16(6, this.minRevFull, true), r.setUint16(8, this.maxRevFull, true);
    for (let e2 = 9; e2 < 15; e2++) r.setUint8(e2, 0);
    r.setUint8(15, this.appendDigest ? 1 : 0), e.set(new Uint8Array(i), t2);
  }
  splitByte(e) {
    return [15 & e, e >> 4 & 15];
  }
  joinByte(e, t2) {
    return 15 & e | (15 & t2) << 4;
  }
  getAlignmentDataNeeded(e, t2) {
    const i = e.addr % this.IROM_ALIGN - this.SEG_HEADER_LEN;
    let r = this.IROM_ALIGN - t2 % this.IROM_ALIGN + i;
    return 0 === r || r === this.IROM_ALIGN ? 0 : (r -= this.SEG_HEADER_LEN, r < 0 && (r += this.IROM_ALIGN), r);
  }
}
class hs extends ds {
  constructor(e, t2 = null) {
    super(e), this.version = 1, this.ROM_LOADER = e, this.flashMode = 0, this.flashSizeFreq = 0, null !== t2 && this.loadFromFile(t2);
  }
  loadFromFile(e) {
    const t2 = e instanceof Uint8Array ? e : Nr(e);
    let i = 0;
    const r = this.loadCommonHeader(t2, i, ss);
    i += 8;
    for (let e2 = 0; e2 < r; e2++) {
      i += 8 + this.loadSegment(t2, i).data.length;
    }
    this.checksum = this.readChecksum(t2, i), this.verify();
  }
  defaultOutputName(e) {
    return e + "-";
  }
}
class ps extends ds {
  constructor(e, t2 = null) {
    super(e), this.version = 2, this.ROM_LOADER = e, this.flashMode = 0, this.flashSizeFreq = 0, null !== t2 && this.loadFromFile(t2);
  }
  async loadFromFile(e) {
    const t2 = e instanceof Uint8Array ? e : Nr(e);
    let i = 0;
    const r = this.loadCommonHeader(t2, i, ps.IMAGE_V2_MAGIC);
    i += 8, r !== ps.IMAGE_V2_SEGMENT && console.warn(`Warning: V2 header has unexpected "segment" count ${r} (usually 4)`);
    const s = this.flashMode, o = this.flashSizeFreq, a = this.entrypoint, n2 = this.loadSegment(t2, i, true);
    n2.addr = 0, n2.includeInChecksum = false, i += 8 + n2.data.length;
    const l = this.loadCommonHeader(t2, i, ss);
    i += 8, s !== this.flashMode && console.warn(`WARNING: Flash mode value in first header (0x${s.toString(16)}) disagrees with second (0x${this.flashMode.toString(16)}). Using second value.`), o !== this.flashSizeFreq && console.warn(`WARNING: Flash size/freq value in first header (0x${o.toString(16)}) disagrees with second (0x${this.flashSizeFreq.toString(16)}). Using second value.`), a !== this.entrypoint && console.warn(`WARNING: Entrypoint address in first header (0x${a.toString(16)}) disagrees with second header (0x${this.entrypoint.toString(16)}). Using second value.`);
    for (let e2 = 0; e2 < l; e2++) {
      i += 8 + this.loadSegment(t2, i).data.length;
    }
    this.checksum = this.readChecksum(t2, i), this.verify();
  }
  defaultOutputName(e) {
    const t2 = this.getIromSegment();
    let i = 0;
    null !== t2 && (i = t2.addr - is.IROM_MAP_START);
    return `${e.replace(/\.[^/.]+$/, "")}-0x${(-4096 & i).toString(16).padStart(5, "0")}.bin`;
  }
}
ps.IMAGE_V2_MAGIC = 234, ps.IMAGE_V2_SEGMENT = 4;
class us extends cs {
  constructor(e, t2 = null, i = true, r = false) {
    super(e, t2, i, r), this.ROM_LOADER = e;
  }
}
class fs extends cs {
  constructor(e, t2 = null, i = true, r = false) {
    super(e, t2, i, r), this.ROM_LOADER = e;
  }
}
class ms extends cs {
  constructor(e, t2 = null, i = true, r = false) {
    super(e, t2, i, r), this.ROM_LOADER = e;
  }
}
class vs extends cs {
  constructor(e, t2 = null, i = true, r = false) {
    super(e, t2, i, r), this.MMU_PAGE_SIZE_CONF = [16384, 32768, 65536], this.ROM_LOADER = e;
  }
}
class gs extends cs {
  constructor(e, t2 = null, i = true, r = false) {
    super(e, t2, i, r), this.MMU_PAGE_SIZE_CONF = [8192, 16384, 32768, 65536], this.ROM_LOADER = e;
  }
}
class _s extends gs {
  constructor(e, t2 = null, i = true, r = false) {
    super(e, t2, i, r), this.ROM_LOADER = e;
  }
}
class bs extends cs {
  constructor(e, t2 = null, i = true, r = false) {
    super(e, t2, i, r), this.ROM_LOADER = e;
  }
}
class ys extends cs {
  constructor(e, t2 = null, i = true, r = false) {
    super(e, t2, i, r), this.ROM_LOADER = e;
  }
}
class xs extends gs {
  constructor(e, t2 = null, i = true, r = false) {
    super(e, t2, i, r), this.ROM_LOADER = e;
  }
}
async function ws(e, t2) {
  const i = t2 instanceof Uint8Array ? t2 : Nr(t2), r = e.CHIP_NAME.toLowerCase().replace(/[-()]/g, "");
  let s;
  if ("esp8266" !== r) switch (r) {
    case "esp32":
      s = cs;
      break;
    case "esp32s2":
      s = us;
      break;
    case "esp32s3":
      s = fs;
      break;
    case "esp32c3":
      s = ms;
      break;
    case "esp32c2":
      s = vs;
      break;
    case "esp32c6":
      s = gs;
      break;
    case "esp32c61":
      s = _s;
      break;
    case "esp32c5":
      s = bs;
      break;
    case "esp32h2":
      s = xs;
      break;
    case "esp32p4":
      s = ys;
      break;
    default:
      throw new Se(`Unsupported chip name: ${r}`);
  }
  else {
    const e2 = i[0];
    if (e2 === ss) s = hs;
    else {
      if (e2 !== ps.IMAGE_V2_MAGIC) throw new Se(`Invalid image magic number: ${e2}`);
      s = ps;
    }
  }
  const o = new s(e), a = o;
  if ("function" == typeof a.loadFromFile) {
    const e2 = a.loadFromFile(i);
    e2 instanceof Promise && await e2;
  }
  return o;
}
class Es {
  constructor(e) {
    var t2, i, r, s, o, a, n2, l;
    this.ESP_RAM_BLOCK = 6144, this.ESP_FLASH_BEGIN = 2, this.ESP_FLASH_DATA = 3, this.ESP_FLASH_END = 4, this.ESP_MEM_BEGIN = 5, this.ESP_MEM_END = 6, this.ESP_MEM_DATA = 7, this.ESP_WRITE_REG = 9, this.ESP_READ_REG = 10, this.ESP_SPI_ATTACH = 13, this.ESP_CHANGE_BAUDRATE = 15, this.ESP_FLASH_DEFL_BEGIN = 16, this.ESP_FLASH_DEFL_DATA = 17, this.ESP_FLASH_DEFL_END = 18, this.ESP_SPI_FLASH_MD5 = 19, this.ESP_ERASE_FLASH = 208, this.ESP_ERASE_REGION = 209, this.ESP_READ_FLASH = 210, this.ESP_RUN_USER_CODE = 211, this.ESP_IMAGE_MAGIC = 233, this.ESP_CHECKSUM_MAGIC = 239, this.ROM_INVALID_RECV_MSG = 5, this.DEFAULT_TIMEOUT = 3e3, this.ERASE_REGION_TIMEOUT_PER_MB = 3e4, this.ERASE_WRITE_TIMEOUT_PER_MB = 4e4, this.MD5_TIMEOUT_PER_MB = 8e3, this.CHIP_ERASE_TIMEOUT = 12e4, this.FLASH_READ_TIMEOUT = 1e5, this.MAX_TIMEOUT = 2 * this.CHIP_ERASE_TIMEOUT, this.SPI_ADDR_REG_MSB = true, this.CHIP_DETECT_MAGIC_REG_ADDR = 1073745920, this.DETECTED_FLASH_SIZES = { 18: "256KB", 19: "512KB", 20: "1MB", 21: "2MB", 22: "4MB", 23: "8MB", 24: "16MB", 25: "32MB", 26: "64MB", 27: "128MB", 28: "256MB", 32: "64MB", 33: "128MB", 34: "256MB", 50: "256KB", 51: "512KB", 52: "1MB", 53: "2MB", 54: "4MB", 55: "8MB", 56: "16MB", 57: "32MB", 58: "64MB" }, this.USB_JTAG_SERIAL_PID = 4097, this.romBaudrate = 115200, this.debugLogging = false, this.syncStubDetected = false, this.IS_STUB = false, this.FLASH_WRITE_SIZE = 16384, this.transport = e.transport, this.baudrate = e.baudrate, this.resetConstructors = { classicReset: (e2, t3) => new Wr(e2, t3), customReset: (e2, t3) => new jr(e2, t3), hardReset: (e2, t3) => new Vr(e2, t3), usbJTAGSerialReset: (e2) => new Zr(e2) }, e.serialOptions && (this.serialOptions = e.serialOptions), e.terminal && (this.terminal = e.terminal, this.terminal.clean()), void 0 !== e.debugLogging && (this.debugLogging = e.debugLogging), e.port && (this.transport = new qr(e.port)), void 0 !== e.enableTracing && (this.transport.tracing = e.enableTracing), (null === (t2 = e.resetConstructors) || void 0 === t2 ? void 0 : t2.classicReset) && (this.resetConstructors.classicReset = null === (i = e.resetConstructors) || void 0 === i ? void 0 : i.classicReset), (null === (r = e.resetConstructors) || void 0 === r ? void 0 : r.customReset) && (this.resetConstructors.customReset = null === (s = e.resetConstructors) || void 0 === s ? void 0 : s.customReset), (null === (o = e.resetConstructors) || void 0 === o ? void 0 : o.hardReset) && (this.resetConstructors.hardReset = null === (a = e.resetConstructors) || void 0 === a ? void 0 : a.hardReset), (null === (n2 = e.resetConstructors) || void 0 === n2 ? void 0 : n2.usbJTAGSerialReset) && (this.resetConstructors.usbJTAGSerialReset = null === (l = e.resetConstructors) || void 0 === l ? void 0 : l.usbJTAGSerialReset), this.info("esptool.js"), this.info("Serial port " + this.transport.getInfo());
  }
  write(e, t2 = true) {
    this.terminal ? t2 ? this.terminal.writeLine(e) : this.terminal.write(e) : console.log(e);
  }
  error(e, t2 = true) {
    this.write(`Error: ${e}`, t2);
  }
  info(e, t2 = true) {
    this.write(e, t2);
  }
  debug(e, t2 = true) {
    this.debugLogging && this.write(`Debug: ${e}`, t2);
  }
  _shortToBytearray(e) {
    return new Uint8Array([255 & e, e >> 8 & 255]);
  }
  _intToByteArray(e) {
    return new Uint8Array([255 & e, e >> 8 & 255, e >> 16 & 255, e >> 24 & 255]);
  }
  _byteArrayToShort(e, t2) {
    return e | t2 >> 8;
  }
  _byteArrayToInt(e, t2, i, r) {
    return e | t2 << 8 | i << 16 | r << 24;
  }
  _appendBuffer(e, t2) {
    const i = new Uint8Array(e.byteLength + t2.byteLength);
    return i.set(new Uint8Array(e), 0), i.set(new Uint8Array(t2), e.byteLength), i.buffer;
  }
  _appendArray(e, t2) {
    const i = new Uint8Array(e.length + t2.length);
    return i.set(e, 0), i.set(t2, e.length), i;
  }
  ui8ToBstr(e) {
    let t2 = "";
    for (let i = 0; i < e.length; i++) t2 += String.fromCharCode(e[i]);
    return t2;
  }
  bstrToUi8(e) {
    const t2 = new Uint8Array(e.length);
    for (let i = 0; i < e.length; i++) t2[i] = e.charCodeAt(i);
    return t2;
  }
  async readPacket(e = null, t2 = this.DEFAULT_TIMEOUT) {
    for (let i = 0; i < 100; i++) {
      const i2 = await this.transport.read(t2);
      if (!i2 || i2.length < 8) continue;
      const r = i2[0];
      if (1 !== r) continue;
      const s = i2[1], o = this._byteArrayToInt(i2[4], i2[5], i2[6], i2[7]), a = i2.slice(8);
      if (1 == r) {
        if (null == e || s == e) return [o, a];
        if (0 != a[0] && a[1] == this.ROM_INVALID_RECV_MSG) throw this.transport.flushInput(), new Se("unsupported command error");
      }
    }
    throw new Se("invalid response");
  }
  async command(e = null, t2 = new Uint8Array(0), i = 0, r = true, s = this.DEFAULT_TIMEOUT) {
    if (null != e) {
      this.transport.tracing && this.transport.trace(`command op:0x${e.toString(16).padStart(2, "0")} data len=${t2.length} wait_response=${r ? 1 : 0} timeout=${(s / 1e3).toFixed(3)} data=${this.transport.hexConvert(t2)}`);
      const o = new Uint8Array(8 + t2.length);
      let a;
      for (o[0] = 0, o[1] = e, o[2] = this._shortToBytearray(t2.length)[0], o[3] = this._shortToBytearray(t2.length)[1], o[4] = this._intToByteArray(i)[0], o[5] = this._intToByteArray(i)[1], o[6] = this._intToByteArray(i)[2], o[7] = this._intToByteArray(i)[3], a = 0; a < t2.length; a++) o[8 + a] = t2[a];
      await this.transport.write(o);
    }
    return r ? this.readPacket(e, s) : [0, new Uint8Array(0)];
  }
  async readReg(e, t2 = this.DEFAULT_TIMEOUT) {
    this.debug(`Read Register:${this.toHex(e)}`);
    const i = this._intToByteArray(e), r = await this.command(this.ESP_READ_REG, i, void 0, void 0, t2);
    return this.debug(`Read Register Value:${r[0]}`), r[0];
  }
  async writeReg(e, t2, i = 4294967295, r = 0, s = 0) {
    let o = this._appendArray(this._intToByteArray(e), this._intToByteArray(t2));
    o = this._appendArray(o, this._intToByteArray(i)), o = this._appendArray(o, this._intToByteArray(r)), s > 0 && (o = this._appendArray(o, this._intToByteArray(this.chip.UART_DATE_REG_ADDR)), o = this._appendArray(o, this._intToByteArray(0)), o = this._appendArray(o, this._intToByteArray(0)), o = this._appendArray(o, this._intToByteArray(s))), await this.checkCommand("write target memory", this.ESP_WRITE_REG, o);
  }
  async sync() {
    this.debug("Sync");
    const e = new Uint8Array(36);
    let t2;
    for (e[0] = 7, e[1] = 7, e[2] = 18, e[3] = 32, t2 = 0; t2 < 32; t2++) e[4 + t2] = 85;
    try {
      let t3 = await this.command(8, e, void 0, void 0, 100);
      this.syncStubDetected = 0 === t3[0];
      for (let e2 = 0; e2 < 7; e2++) t3 = await this.readPacket(8, 100), this.syncStubDetected = this.syncStubDetected && 0 === t3[0];
      return t3;
    } catch (e2) {
      throw this.debug("Sync err " + e2), e2;
    }
  }
  async _connectAttempt(e = "default_reset", t2) {
    this.debug("_connect_attempt " + e), t2 && await t2.reset();
    const i = this.transport.peek(), r = Array.from(i, ((e2) => String.fromCharCode(e2))).join("").match(/boot:(0x[0-9a-fA-F]+)([\s\S]*?waiting for download)?/);
    let s = false, o = "", a = false;
    r && (s = true, o = r[1], a = !!r[2]), this.debug(`bootMode:${o} downloadMode:${a}`);
    let n2 = "";
    for (let e2 = 0; e2 < 5; e2++) try {
      this.debug(`Sync connect attempt ${e2}`), this.transport.flushInput();
      const t3 = await this.sync();
      return this.debug(t3[0].toString()), "success";
    } catch (e3) {
      this.debug(`Error at sync ${e3}`), n2 = e3 instanceof Error ? e3.message : "string" == typeof e3 ? e3 : JSON.stringify(e3);
    }
    return s && (n2 = `Wrong boot mode detected (${o}).
        This chip needs to be in download mode.`, a && (n2 = "Download mode successfully detected, but getting no sync reply:\n           The serial TX path seems to be down.")), n2;
  }
  constructResetSequence(e) {
    if ("no_reset" !== e) if ("usb_reset" === e || this.transport.getPid() === this.USB_JTAG_SERIAL_PID) {
      if (this.resetConstructors.usbJTAGSerialReset) return this.debug("using USB JTAG Serial Reset"), [this.resetConstructors.usbJTAGSerialReset(this.transport)];
    } else {
      const e2 = 50, t2 = e2 + 500;
      if (this.resetConstructors.classicReset) return this.debug("using Classic Serial Reset"), [this.resetConstructors.classicReset(this.transport, e2), this.resetConstructors.classicReset(this.transport, t2)];
    }
    return [];
  }
  async connect(e = "default_reset", t2 = 7, i = true) {
    let r;
    this.info("Connecting...", false), await this.transport.connect(this.romBaudrate, this.serialOptions), this.transport.readLoop();
    const s = this.constructResetSequence(e);
    for (let i2 = 0; i2 < t2; i2++) {
      const t3 = s.length > 0 ? s[i2 % s.length] : null;
      if (r = await this._connectAttempt(e, t3), "success" === r) break;
    }
    if ("success" !== r) throw new Se("Failed to connect with the device");
    if (this.debug("Connect attempt successful."), this.info("\n\r", false), i) {
      const e2 = await this.readReg(this.CHIP_DETECT_MAGIC_REG_ADDR) >>> 0;
      this.debug("Chip Magic " + e2.toString(16));
      const t3 = await (async function(e3) {
        switch (e3) {
          case 15736195: {
            const { ESP32ROM: e4 } = await import("./circuitsetup-energy-meter-helper-esp32-DNPRK0Ay-DWAyJaNS.js");
            return new e4();
          }
          case 203546735:
          case 1867591791:
          case 2084675695: {
            const { ESP32C2ROM: e4 } = await import("./circuitsetup-energy-meter-helper-esp32c2-CQ3ns5Nm-BJPhw2-C.js");
            return new e4();
          }
          case 1763790959:
          case 456216687:
          case 1216438383:
          case 1130455151: {
            const { ESP32C3ROM: e4 } = await import("./circuitsetup-energy-meter-helper-esp32c3-2tchr35W-h-P1n4XS.js");
            return new e4();
          }
          case 752910447: {
            const { ESP32C6ROM: e4 } = await import("./circuitsetup-energy-meter-helper-esp32c6-DolpfL0e-D8esBcqJ.js");
            return new e4();
          }
          case 606167151:
          case 871374959:
          case 1333878895: {
            const { ESP32C61ROM: e4 } = await import("./circuitsetup-energy-meter-helper-esp32c61-C8HktcOt-vL20vvsO.js");
            return new e4();
          }
          case 285294703:
          case 1675706479:
          case 1607549039: {
            const { ESP32C5ROM: e4 } = await import("./circuitsetup-energy-meter-helper-esp32c5-CeCSizBL-DRPRd-cT.js");
            return new e4();
          }
          case 3619110528:
          case 2548236392: {
            const { ESP32H2ROM: e4 } = await import("./circuitsetup-energy-meter-helper-esp32h2-L0n5WuSo-UGifF57A.js");
            return new e4();
          }
          case 9: {
            const { ESP32S3ROM: e4 } = await import("./circuitsetup-energy-meter-helper-esp32s3-DQt_R3ZE-GJespXP5.js");
            return new e4();
          }
          case 1990: {
            const { ESP32S2ROM: e4 } = await import("./circuitsetup-energy-meter-helper-esp32s2-w9SUkb7o-AD4Kndou.js");
            return new e4();
          }
          case 4293968129: {
            const { ESP8266ROM: e4 } = await Promise.resolve().then((function() {
              return rs;
            }));
            return new e4();
          }
          case 0:
          case 182303440:
          case 117676761: {
            const { ESP32P4ROM: e4 } = await import("./circuitsetup-energy-meter-helper-esp32p4-MR0ikcda-C-FMJEu-.js");
            return new e4();
          }
          default:
            return null;
        }
      })(e2);
      if (null === typeof this.chip) throw new Se(`Unexpected CHIP magic value ${e2}. Failed to autodetect chip type.`);
      this.chip = t3;
    }
  }
  async detectChip(e = "default_reset") {
    await this.connect(e), this.info("Detecting chip type... ", false), null != this.chip ? this.info(this.chip.CHIP_NAME) : this.info("unknown!");
  }
  async checkCommand(e = "", t2 = null, i = new Uint8Array(0), r = 0, s = 0, o = this.DEFAULT_TIMEOUT) {
    this.debug("check_command " + e);
    const a = await this.command(t2, i, r, void 0, o);
    if (a && a[1] && a[1].length < s + 2) {
      const t3 = a[1].slice(0, 2);
      throw 0 !== t3[0] ? new Se(`Failed to ${e} failed with status ${t3}`) : new Se(`Failed to ${e}.
 Only got ${a[1].length} bytes of data.`);
    }
    const n2 = a[1].slice(s, s + 2);
    if (0 !== n2[0]) throw new Se(`Failed to ${e} failed with status ${n2}`);
    return s > 0 ? a[1].slice(0, s) : a[0];
  }
  async memBegin(e, t2, i, r) {
    if (this.IS_STUB) {
      const t3 = r, i2 = r + e, s2 = this.chip.getChipRevision ? await this.chip.getChipRevision(this) : void 0, o = await Qr(this.chip.CHIP_NAME, s2);
      if (o) {
        const e2 = [[o.bss_start || o.data_start, o.data_start + o.decodedData.length], [o.text_start, o.text_start + o.decodedText.length]];
        for (const [r2, s3] of e2) if (t3 < s3 && i2 > r2) throw new Se(`Software loader is resident at 0x${r2.toString(16).padStart(8, "0")}-0x${s3.toString(16).padStart(8, "0")}.
            Can't load binary at overlapping address range 0x${t3.toString(16).padStart(8, "0")}-0x${i2.toString(16).padStart(8, "0")}.
            Either change binary loading address, or use the no-stub option to disable the software loader.`);
      }
    }
    this.debug("mem_begin " + e + " " + t2 + " " + i + " " + r.toString(16));
    let s = this._appendArray(this._intToByteArray(e), this._intToByteArray(t2));
    s = this._appendArray(s, this._intToByteArray(i)), s = this._appendArray(s, this._intToByteArray(r)), await this.checkCommand("enter RAM download mode", this.ESP_MEM_BEGIN, s);
  }
  checksum(e, t2 = this.ESP_CHECKSUM_MAGIC) {
    for (let i = 0; i < e.length; i++) t2 ^= e[i];
    return t2;
  }
  async memBlock(e, t2) {
    let i = this._appendArray(this._intToByteArray(e.length), this._intToByteArray(t2));
    i = this._appendArray(i, this._intToByteArray(0)), i = this._appendArray(i, this._intToByteArray(0)), i = this._appendArray(i, e);
    const r = this.checksum(e);
    await this.checkCommand("write to target RAM", this.ESP_MEM_DATA, i, r);
  }
  async memFinish(e) {
    const t2 = 0 === e ? 1 : 0, i = this._appendArray(this._intToByteArray(t2), this._intToByteArray(e));
    await this.checkCommand("leave RAM download mode", this.ESP_MEM_END, i, void 0, void 0, 200);
  }
  async flashSpiAttach(e) {
    const t2 = this._intToByteArray(e);
    await this.checkCommand("configure SPI flash pins", this.ESP_SPI_ATTACH, t2);
  }
  timeoutPerMb(e, t2) {
    const i = e * (t2 / 1e6);
    return i < 3e3 ? 3e3 : i;
  }
  async flashBegin(e, t2) {
    const i = Math.floor((e + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), r = this.chip.getEraseSize(t2, e), s = /* @__PURE__ */ new Date(), o = s.getTime();
    let a = 3e3;
    0 == this.IS_STUB && (a = this.timeoutPerMb(this.ERASE_REGION_TIMEOUT_PER_MB, e)), this.debug("flash begin " + r + " " + i + " " + this.FLASH_WRITE_SIZE + " " + t2 + " " + e);
    let n2 = this._appendArray(this._intToByteArray(r), this._intToByteArray(i));
    n2 = this._appendArray(n2, this._intToByteArray(this.FLASH_WRITE_SIZE)), n2 = this._appendArray(n2, this._intToByteArray(t2)), 0 == this.IS_STUB && (n2 = this._appendArray(n2, this._intToByteArray(0))), await this.checkCommand("enter Flash download mode", this.ESP_FLASH_BEGIN, n2, void 0, void 0, a);
    const l = s.getTime();
    return 0 != e && 0 == this.IS_STUB && this.info("Took " + (l - o) / 1e3 + "." + (l - o) % 1e3 + "s to erase flash block"), i;
  }
  async flashDeflBegin(e, t2, i) {
    const r = Math.floor((t2 + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), s = Math.floor((e + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), o = /* @__PURE__ */ new Date(), a = o.getTime();
    let n2, l;
    this.IS_STUB ? (n2 = e, l = this.DEFAULT_TIMEOUT) : (n2 = s * this.FLASH_WRITE_SIZE, l = this.timeoutPerMb(this.ERASE_REGION_TIMEOUT_PER_MB, n2)), this.info("Compressed " + e + " bytes to " + t2 + "...");
    let d = this._appendArray(this._intToByteArray(n2), this._intToByteArray(r));
    d = this._appendArray(d, this._intToByteArray(this.FLASH_WRITE_SIZE)), d = this._appendArray(d, this._intToByteArray(i)), "ESP32-S2" !== this.chip.CHIP_NAME && "ESP32-S3" !== this.chip.CHIP_NAME && "ESP32-C3" !== this.chip.CHIP_NAME && "ESP32-C2" !== this.chip.CHIP_NAME || false !== this.IS_STUB || (d = this._appendArray(d, this._intToByteArray(0))), await this.checkCommand("enter compressed flash mode", this.ESP_FLASH_DEFL_BEGIN, d, void 0, void 0, l);
    const c = o.getTime();
    return 0 != e && false === this.IS_STUB && this.info("Took " + (c - a) / 1e3 + "." + (c - a) % 1e3 + "s to erase flash block"), r;
  }
  async flashBlock(e, t2, i) {
    let r = this._appendArray(this._intToByteArray(e.length), this._intToByteArray(t2));
    r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, e);
    const s = this.checksum(e);
    await this.checkCommand("write to target Flash after seq " + t2, this.ESP_FLASH_DATA, r, s, void 0, i);
  }
  async flashDeflBlock(e, t2, i) {
    let r = this._appendArray(this._intToByteArray(e.length), this._intToByteArray(t2));
    r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, e);
    const s = this.checksum(e);
    this.debug("flash_defl_block " + e[0].toString(16) + " " + e[1].toString(16)), await this.checkCommand("write compressed data to flash after seq " + t2, this.ESP_FLASH_DEFL_DATA, r, s, void 0, i);
  }
  async flashFinish(e = false, t2 = this.DEFAULT_TIMEOUT) {
    const i = e ? 0 : 1, r = this._intToByteArray(i);
    await this.checkCommand("leave Flash mode", this.ESP_FLASH_END, r, void 0, void 0, t2);
  }
  async flashDeflFinish(e = false, t2 = this.DEFAULT_TIMEOUT) {
    const i = e ? 0 : 1, r = this._intToByteArray(i);
    await this.checkCommand("leave compressed flash mode", this.ESP_FLASH_DEFL_END, r, void 0, void 0, t2);
  }
  async runSpiflashCommand(e, t2, i, r = null, s = 0, o = 0) {
    const a = this.chip.SPI_REG_BASE, n2 = a + 0, l = a + 4, d = a + this.chip.SPI_USR_OFFS, c = a + this.chip.SPI_USR1_OFFS, h = a + this.chip.SPI_USR2_OFFS, p = a + this.chip.SPI_W0_OFFS;
    let u;
    u = null != this.chip.SPI_MOSI_DLEN_OFFS ? async (e2, t3) => {
      const i2 = a + this.chip.SPI_MOSI_DLEN_OFFS, r2 = a + this.chip.SPI_MISO_DLEN_OFFS;
      e2 > 0 && await this.writeReg(i2, e2 - 1), t3 > 0 && await this.writeReg(r2, t3 - 1);
      let n3 = 0;
      o > 0 && (n3 |= o - 1), s > 0 && (n3 |= s - 1 << m), n3 && await this.writeReg(c, n3);
    } : async (e2, t3) => {
      const i2 = c;
      let r2 = (0 === t3 ? 0 : t3 - 1) << 8 | (0 === e2 ? 0 : e2 - 1) << 17;
      o > 0 && (r2 |= o - 1), s > 0 && (r2 |= s - 1 << m), await this.writeReg(i2, r2);
    };
    const f = 1 << 18, m = 26;
    if (i > 32) throw new Se("Reading more than 32 bits back from a SPI flash operation is unsupported");
    if (t2.length > 64) throw new Se("Writing more than 64 bytes of data with one SPI command is unsupported");
    const v = 8 * t2.length, g = await this.readReg(d), _ = await this.readReg(h);
    let b = 1 << 31;
    i > 0 && (b |= 268435456), v > 0 && (b |= 134217728), s > 0 && (b |= 1073741824), o > 0 && (b |= 536870912), await u(v, i), await this.writeReg(d, b);
    let y, x = 7 << 28 | e;
    if (await this.writeReg(h, x), r && s > 0 && (this.SPI_ADDR_REG_MSB && (r <<= 32 - s), await this.writeReg(l, r)), 0 == v) await this.writeReg(p, 0);
    else {
      t2 = Br(t2, 4, 0);
      const e2 = [];
      for (let i3 = 0; i3 < t2.length; i3 += 4) e2.push((t2[i3] | t2[i3 + 1] << 8 | t2[i3 + 2] << 16 | t2[i3 + 3] << 24) >>> 0);
      let i2 = p;
      for (const t3 of e2) await this.writeReg(i2, t3), i2 += 4;
    }
    for (await this.writeReg(n2, f), y = 0; y < 10 && (x = await this.readReg(n2) & f, 0 != x); y++) ;
    if (10 === y) throw new Se("SPI command did not complete in time");
    const w = await this.readReg(p);
    return await this.writeReg(d, g), await this.writeReg(h, _), w;
  }
  async readFlashId() {
    const e = new Uint8Array(0);
    return await this.runSpiflashCommand(159, e, 24);
  }
  async eraseFlash() {
    this.info("Erasing flash (this may take a while)...");
    let e = /* @__PURE__ */ new Date();
    const t2 = e.getTime(), i = await this.checkCommand("erase flash", this.ESP_ERASE_FLASH, void 0, void 0, void 0, this.CHIP_ERASE_TIMEOUT);
    e = /* @__PURE__ */ new Date();
    const r = e.getTime();
    return this.info("Chip erase completed successfully in " + (r - t2) / 1e3 + "s"), i;
  }
  toHex(e) {
    return Array.prototype.map.call(e, ((e2) => ("00" + e2.toString(16)).slice(-2))).join("");
  }
  async flashMd5sum(e, t2) {
    const i = this.timeoutPerMb(this.MD5_TIMEOUT_PER_MB, t2);
    let r = this._appendArray(this._intToByteArray(e), this._intToByteArray(t2));
    r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, this._intToByteArray(0));
    const s = this.IS_STUB ? 16 : 32, o = await this.checkCommand("calculate md5sum", this.ESP_SPI_FLASH_MD5, r, void 0, s, i);
    return this.toHex(o);
  }
  async readFlash(e, t2, i = null) {
    let r = this._appendArray(this._intToByteArray(e), this._intToByteArray(t2));
    r = this._appendArray(r, this._intToByteArray(4096)), r = this._appendArray(r, this._intToByteArray(1024));
    const s = await this.checkCommand("read flash", this.ESP_READ_FLASH, r);
    if (0 != s) throw new Se("Failed to read memory: " + s);
    let o = new Uint8Array(0);
    for (; o.length < t2; ) {
      const e2 = await this.transport.read(this.FLASH_READ_TIMEOUT);
      if (!(e2 instanceof Uint8Array)) throw new Se("Failed to read memory: " + e2);
      e2.length > 0 && (o = this._appendArray(o, e2), await this.transport.write(this._intToByteArray(o.length)), i && i(e2, o.length, t2));
    }
    return o;
  }
  async runStub() {
    if (this.syncStubDetected) return this.info("Stub is already running. No upload is necessary."), this.chip;
    this.info("Uploading stub...");
    const e = this.chip.getChipRevision ? await this.chip.getChipRevision(this) : void 0, t2 = await Qr(this.chip.CHIP_NAME, e);
    if (void 0 === t2) throw this.debug("Error loading Stub json"), new Error("Error loading Stub json");
    const i = [t2.decodedText, t2.decodedData];
    for (let e2 = 0; e2 < i.length; e2++) if (i[e2]) {
      const r2 = 0 === e2 ? t2.text_start : t2.data_start, s2 = i[e2].length, o = Math.floor((s2 + this.ESP_RAM_BLOCK - 1) / this.ESP_RAM_BLOCK);
      await this.memBegin(s2, o, this.ESP_RAM_BLOCK, r2);
      for (let t3 = 0; t3 < o; t3++) {
        const r3 = t3 * this.ESP_RAM_BLOCK, s3 = r3 + this.ESP_RAM_BLOCK;
        await this.memBlock(i[e2].slice(r3, s3), t3);
      }
    }
    this.info("Running stub..."), await this.memFinish(t2.entry);
    const r = await this.transport.read(this.DEFAULT_TIMEOUT), s = String.fromCharCode(...r);
    if ("OHAI" !== s) throw new Se(`Failed to start stub. Unexpected response ${s}`);
    return this.info("Stub running..."), this.IS_STUB = true, this.chip;
  }
  async changeBaud() {
    this.info("Changing baudrate to " + this.baudrate);
    const e = this.IS_STUB ? this.romBaudrate : 0, t2 = this._appendArray(this._intToByteArray(this.baudrate), this._intToByteArray(e));
    await this.command(this.ESP_CHANGE_BAUDRATE, t2), this.info("Changed"), this.info("If the chip does not respond to any further commands, consider using a lower baud rate."), await Hr(50), await this.transport.disconnect(), await Hr(50), await this.transport.connect(this.baudrate, this.serialOptions), await Hr(50), this.transport.readLoop();
  }
  async main(e = "default_reset") {
    await this.detectChip(e);
    const t2 = await this.chip.getChipDescription(this);
    if (this.chip.getChipRevision) {
      const e2 = await this.chip.getChipRevision(this);
      this.info("Chip Revision: " + e2);
    }
    this.info("Chip is " + t2), this.info("Features: " + await this.chip.getChipFeatures(this)), this.info("Crystal is " + await this.chip.getCrystalFreq(this) + "MHz"), this.info("MAC: " + await this.chip.readMac(this)), await this.chip.readMac(this), void 0 !== this.chip.postConnect && await this.chip.postConnect(this), await this.runStub(), this.romBaudrate !== this.baudrate && await this.changeBaud();
    try {
      const e2 = await this.readFlashId();
      this.info("Flash ID: " + e2.toString(16)), 16777215 !== e2 && 0 !== e2 || this.info("WARNING: Failed to communicate with the flash chip,\nread/write operations will fail.\nTry checking the chip connections or removing\nany other hardware connected to IOs.");
    } catch (e2) {
      throw new Se("Unable to verify flash chip connection " + e2);
    }
    return t2;
  }
  flashSizeBytes(e) {
    let t2 = -1;
    return this.transport.trace(`Flash size string ${e}`), -1 !== e.toString().indexOf("KB") ? t2 = 1024 * parseInt(e.toString().slice(0, e.toString().indexOf("KB"))) : -1 !== e.toString().indexOf("MB") && (t2 = 1024 * parseInt(e.toString().slice(0, e.toString().indexOf("MB"))) * 1024), this.transport.trace(`Flash size in bytes ${t2}`), t2;
  }
  parseFlashSizeArg(e) {
    if (void 0 === this.chip.FLASH_SIZES[e]) throw new Se("Flash size " + e + " is not supported by this chip type. Supported sizes: " + this.chip.FLASH_SIZES);
    return this.chip.FLASH_SIZES[e];
  }
  async _updateImageFlashParams(e, t2, i = "keep", r = "keep", s = "keep") {
    if (this.debug(`_update_image_flash_params ${s} ${i} ${r}`), e.length < 8) return e;
    if (t2 != this.chip.BOOTLOADER_FLASH_OFFSET) return e;
    if ("keep" === s && "keep" === i && "keep" === r) return this.info("Not changing the image"), e;
    const o = e[0];
    let a = e[2];
    const n2 = e[3];
    if (o !== this.ESP_IMAGE_MAGIC) return this.info("Warning: Image file at 0x" + t2.toString(16) + " doesn't look like an image file, so not changing any flash settings."), e;
    try {
      (await ws(this.chip, e)).verify();
    } catch (i2) {
      return this.debug(`Warning: Image file at 0x${t2.toString(16)} is not a valid ${this.chip.CHIP_NAME} image, so not changing any flash settings.`), e;
    }
    const l = "ESP8266" !== this.chip.CHIP_NAME && 49 === e[23];
    if ("keep" !== i) {
      a = { qio: 0, qout: 1, dio: 2, dout: 3 }[i];
    }
    let d = 15 & n2;
    if ("keep" !== r) {
      d = { "40m": 0, "26m": 1, "20m": 2, "80m": 15 }[r];
    }
    let c = 240 & n2;
    if ("keep" !== s) if ("detect" === s) {
      this.info("Configuring flash size...");
      const e2 = await this.detectFlashSize();
      this.info("Detected flash size set to " + e2), c = this.parseFlashSizeArg(e2);
    } else c = this.parseFlashSizeArg(s);
    const h = a << 8 | d + c;
    this.info("Flash params set to " + h.toString(16));
    const p = new Uint8Array(e);
    if (e[2] !== a && (p[2] = a), e[3] !== d + c && (p[3] = d + c), l) {
      const e2 = await ws(this.chip, p), t3 = p.slice(0, e2.datalength), i2 = p.slice(e2.datalength + e2.SHA256_DIGEST_LEN), r2 = await crypto.subtle.digest("SHA-256", i2), s2 = new Uint8Array(r2), o2 = new Uint8Array(t3.length + s2.length + i2.length);
      o2.set(t3, 0), o2.set(s2, t3.length), o2.set(i2, t3.length + s2.length);
      const a2 = o2.slice(e2.datalength, e2.datalength + e2.SHA256_DIGEST_LEN);
      return this.transport.hexify(s2) === this.transport.hexify(a2) ? this.info("SHA digest in image updated") : this.info(`WARNING: SHA recalculation for binary failed!
	Expected calculated SHA: ${this.transport.hexify(s2)}
	SHA stored in binary:    ${this.transport.hexify(a2)}`), o2;
    }
    return p;
  }
  async writeFlash(e) {
    if (this.debug("EspLoader program"), "keep" !== e.flashSize) {
      const t3 = this.flashSizeBytes(e.flashSize);
      for (let i2 = 0; i2 < e.fileArray.length; i2++) if (e.fileArray[i2].data.length + e.fileArray[i2].address > t3) throw new Se(`File ${i2 + 1} doesn't fit in the available flash`);
    }
    let t2, i;
    true === this.IS_STUB && true === e.eraseAll && await this.eraseFlash();
    for (let r = 0; r < e.fileArray.length; r++) {
      if (this.debug("Data Length " + e.fileArray[r].data.length), t2 = e.fileArray[r].data, this.debug("Image Length " + t2.length), 0 === t2.length) {
        this.debug("Warning: File is empty");
        continue;
      }
      t2 = Br(t2, 4), i = e.fileArray[r].address, t2 = await this._updateImageFlashParams(t2, i, e.flashMode, e.flashFreq, e.flashSize);
      let s = null;
      e.calculateMD5Hash && (s = e.calculateMD5Hash(t2), this.debug("Image MD5 " + s));
      const o = t2.length;
      let a;
      if (e.compress) {
        t2 = Fr(t2, { level: 9 }), a = await this.flashDeflBegin(o, t2.length, i);
      } else a = await this.flashBegin(o, i);
      let n2 = 0, l = 0;
      const d = t2.length;
      e.reportProgress && e.reportProgress(r, 0, d);
      let c = /* @__PURE__ */ new Date();
      const h = c.getTime();
      let p = 5e3;
      const u = new zr({ chunkSize: 1 });
      let f = 0;
      u.onData = function(e2) {
        f += e2.byteLength;
      };
      let m = 0;
      for (; m < t2.length; ) {
        this.debug("Write loop " + i + " " + n2 + " " + a), this.info("Writing at 0x" + (i + f).toString(16) + "... (" + Math.floor(100 * (n2 + 1) / a) + "%)");
        const s2 = Math.min(this.FLASH_WRITE_SIZE, t2.length - m), o2 = t2.slice(m, m + s2), c2 = m + s2 >= t2.length;
        if (!e.compress) throw new Se("Yet to handle Non Compressed writes");
        {
          const e2 = f;
          u.push(o2, c2);
          const t3 = f - e2;
          let i2 = 3e3;
          this.timeoutPerMb(this.ERASE_WRITE_TIMEOUT_PER_MB, t3) > 3e3 && (i2 = this.timeoutPerMb(this.ERASE_WRITE_TIMEOUT_PER_MB, t3)), false === this.IS_STUB && (p = i2), await this.flashDeflBlock(o2, n2, p), this.IS_STUB && (p = i2);
        }
        l += o2.length, m += s2, n2++, e.reportProgress && e.reportProgress(r, l, d);
      }
      this.IS_STUB && (e.compress ? await this.flashDeflFinish(false, p) : await this.flashFinish(false, p)), c = /* @__PURE__ */ new Date();
      const v = c.getTime() - h;
      if (e.compress && this.info("Wrote " + o + " bytes (" + l + " compressed) at 0x" + i.toString(16) + " in " + v / 1e3 + " seconds."), s) {
        this.info("File  md5: " + s);
        const e2 = await this.flashMd5sum(i, o);
        if (this.info("Flash md5: " + e2), new String(e2).valueOf() != new String(s).valueOf()) throw new Se("MD5 of file does not match data in flash!");
        this.info("Hash of data verified.");
      }
    }
    this.info("Leaving...");
  }
  async flashId() {
    this.debug("flash_id");
    const e = await this.readFlashId();
    this.info("Manufacturer: " + (255 & e).toString(16));
    const t2 = e >> 16 & 255;
    this.info("Device: " + (e >> 8 & 255).toString(16) + t2.toString(16)), this.info("Detected flash size: " + this.DETECTED_FLASH_SIZES[t2]);
  }
  async detectFlashSize() {
    this.debug("detectFlashSize");
    const e = await this.readFlashId() >> 16 & 255;
    let t2 = this.DETECTED_FLASH_SIZES[e];
    return t2 ? this.info("Auto-detected Flash size: " + t2) : (t2 = "4MB", this.info("Could not auto-detect Flash size. defaulting to 4MB")), t2;
  }
  async softReset(e) {
    if (this.IS_STUB) {
      if ("ESP8266" != this.chip.CHIP_NAME) throw new Se("Soft resetting is currently only supported on ESP8266");
      e ? (await this.flashBegin(0, 0), await this.flashFinish(true)) : await this.command(this.ESP_RUN_USER_CODE, void 0, void 0, false);
    } else {
      if (e) return;
      await this.flashBegin(0, 0), await this.flashFinish(false);
    }
  }
  async after(e = "hard_reset", t2, i) {
    switch (e) {
      case "hard_reset":
        if (this.resetConstructors.hardReset) {
          this.info("Hard resetting via RTS pin...");
          const e2 = this.resetConstructors.hardReset(this.transport, t2);
          await e2.reset();
        }
        break;
      case "soft_reset":
        this.info("Soft resetting..."), await this.softReset(false);
        break;
      case "no_reset_stub":
        this.info("Staying in flasher stub.");
        break;
      case "custom_reset":
        if (i || this.info("Custom reset sequence not provided, doing nothing."), this.resetConstructors.customReset || this.info("Custom reset constructor not available, doing nothing."), this.resetConstructors.customReset && i) {
          this.info("Custom resetting using sequence " + i);
          const e2 = this.resetConstructors.customReset(this.transport, i);
          await e2.reset();
        }
        break;
      default:
        this.info("Staying in bootloader."), this.IS_STUB && this.softReset(true);
    }
  }
}
class Ss extends HTMLElement {
  constructor() {
    super(...arguments), this.allowInput = true;
  }
  logs() {
    var e;
    return (null === (e = this._console) || void 0 === e ? void 0 : e.logs()) || "";
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
      ${this.allowInput ? "<form>\n                >\n                <input autofocus>\n              </form>\n            " : ""}
    `, this._console = new ye(this.shadowRoot.querySelector("div")), this.allowInput) {
      const e2 = this.shadowRoot.querySelector("input");
      this.addEventListener("click", (() => {
        var t3;
        "" === (null === (t3 = getSelection()) || void 0 === t3 ? void 0 : t3.toString()) && e2.focus();
      })), e2.addEventListener("keydown", ((e3) => {
        "Enter" === e3.key && (e3.preventDefault(), e3.stopPropagation(), this._sendCommand());
      }));
    }
    const e = new AbortController(), t2 = this._connect(e.signal);
    this._cancelConnection = () => (e.abort(), t2);
  }
  async _connect(e) {
    this.logger.debug("Starting console read loop");
    try {
      await this.port.readable.pipeThrough(new TextDecoderStream(), { signal: e }).pipeThrough(new TransformStream(new we())).pipeThrough(new TransformStream(new Ee())).pipeTo(new WritableStream({ write: (e2) => {
        this._console.addLine(e2.replace("\r", ""));
      } })), e.aborted || (this._console.addLine(""), this._console.addLine(""), this._console.addLine("Terminal disconnected"));
    } catch (e2) {
      this._console.addLine(""), this._console.addLine(""), this._console.addLine(`Terminal disconnected: ${e2}`);
    } finally {
      await xe(100), this.logger.debug("Finished console read loop");
    }
  }
  async _sendCommand() {
    const e = this.shadowRoot.querySelector("input"), t2 = e.value, i = new TextEncoder(), r = this.port.writable.getWriter();
    await r.write(i.encode(t2 + "\r\n")), this._console.addLine(`> ${t2}\r
`), e.value = "", e.focus();
    try {
      r.releaseLock();
    } catch (e2) {
      console.error("Ignoring release lock error", e2);
    }
  }
  async disconnect() {
    this._cancelConnection && (await this._cancelConnection(), this._cancelConnection = void 0);
  }
  async reset() {
    this.logger.debug("Triggering reset");
    const e = new qr(this.port);
    await e.setRTS(true), await xe(100);
    const t2 = new Vr(e);
    await t2.reset();
  }
}
function ks(e, t2 = true) {
  return t2 && "rtl" === getComputedStyle(e).getPropertyValue("direction").trim();
}
customElements.define("ewt-console", Ss);
const As = Wt$1(Jt$1(ct$1));
class Rs extends As {
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(e) {
    this.setAttribute("name", e);
  }
  get form() {
    return this[Kt$1].form;
  }
  get labels() {
    return this[Kt$1].labels;
  }
  constructor() {
    super(), this.disabled = false, this.softDisabled = false, this.flipIconInRtl = false, this.href = "", this.download = "", this.target = "", this.ariaLabelSelected = "", this.toggle = false, this.selected = false, this.type = "submit", this.value = "", this.flipIcon = ks(this, this.flipIconInRtl), this.addEventListener("click", this.handleClick.bind(this));
  }
  willUpdate() {
    this.href && (this.disabled = false, this.softDisabled = false);
  }
  render() {
    const e = this.href ? X`div` : X`button`, { ariaLabel: t2, ariaHasPopup: i, ariaExpanded: r } = this, s = t2 && this.ariaLabelSelected, o = this.toggle ? this.selected : W$1;
    let a = W$1;
    return this.href || (a = s && this.selected ? this.ariaLabelSelected : t2), Q`<${e}
        class="icon-button ${Ot$1(this.getRenderClasses())}"
        id="button"
        aria-label="${a || W$1}"
        aria-haspopup="${!this.href && i || W$1}"
        aria-expanded="${!this.href && r || W$1}"
        aria-pressed="${o}"
        aria-disabled=${!this.href && this.softDisabled || W$1}
        ?disabled="${!this.href && this.disabled}"
        @click="${this.handleClickOnChild}">
        ${this.renderFocusRing()}
        ${this.renderRipple()}
        ${this.selected ? W$1 : this.renderIcon()}
        ${this.selected ? this.renderSelectedIcon() : W$1}
        ${this.href ? this.renderLink() : this.renderTouchTarget()}
  </${e}>`;
  }
  renderLink() {
    const { ariaLabel: e } = this;
    return j$1`
      <a
        class="link"
        id="link"
        href="${this.href}"
        download="${this.download || W$1}"
        target="${this.target || W$1}"
        aria-label="${e || W$1}">
        ${this.renderTouchTarget()}
      </a>
    `;
  }
  getRenderClasses() {
    return { "flip-icon": this.flipIcon, selected: this.toggle && this.selected };
  }
  renderIcon() {
    return j$1`<span class="icon"><slot></slot></span>`;
  }
  renderSelectedIcon() {
    return j$1`<span class="icon icon--selected"
      ><slot name="selected"><slot></slot></slot
    ></span>`;
  }
  renderTouchTarget() {
    return j$1`<span class="touch"></span>`;
  }
  renderFocusRing() {
    return j$1`<ewt-focus-ring
      part="focus-ring"
      for=${this.href ? "link" : "button"}></ewt-focus-ring>`;
  }
  renderRipple() {
    const e = !this.href && (this.disabled || this.softDisabled);
    return j$1`<ewt-ripple
      for=${this.href ? "link" : W$1}
      ?disabled="${e}"></ewt-ripple>`;
  }
  connectedCallback() {
    this.flipIcon = ks(this, this.flipIconInRtl), super.connectedCallback();
  }
  handleClick(e) {
    if (!this.href && this.softDisabled) return e.stopImmediatePropagation(), void e.preventDefault();
  }
  async handleClickOnChild(e) {
    await 0, !this.toggle || this.disabled || this.softDisabled || e.defaultPrevented || (this.selected = !this.selected, this.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true })), this.dispatchEvent(new Event("change", { bubbles: true })));
  }
}
Xt$1(Rs), Rs.formAssociated = true, Rs.shadowRootOptions = { mode: "open", delegatesFocus: true }, t([mt$1({ type: Boolean, reflect: true })], Rs.prototype, "disabled", void 0), t([mt$1({ type: Boolean, attribute: "soft-disabled", reflect: true })], Rs.prototype, "softDisabled", void 0), t([mt$1({ type: Boolean, attribute: "flip-icon-in-rtl" })], Rs.prototype, "flipIconInRtl", void 0), t([mt$1()], Rs.prototype, "href", void 0), t([mt$1()], Rs.prototype, "download", void 0), t([mt$1()], Rs.prototype, "target", void 0), t([mt$1({ attribute: "aria-label-selected" })], Rs.prototype, "ariaLabelSelected", void 0), t([mt$1({ type: Boolean })], Rs.prototype, "toggle", void 0), t([mt$1({ type: Boolean, reflect: true })], Rs.prototype, "selected", void 0), t([mt$1()], Rs.prototype, "type", void 0), t([mt$1({ reflect: true })], Rs.prototype, "value", void 0), t([ft$1()], Rs.prototype, "flipIcon", void 0);
const Is = n`:host{display:inline-flex;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);height:var(--_container-height);width:var(--_container-width);justify-content:center}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) max(0px,(48px - var(--_container-width))/2)}ewt-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){pointer-events:none}.icon-button{place-items:center;background:none;border:none;box-sizing:border-box;cursor:pointer;display:flex;place-content:center;outline:none;padding:0;position:relative;text-decoration:none;user-select:none;z-index:0;flex:1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.icon ::slotted(*){font-size:var(--_icon-size);height:var(--_icon-size);width:var(--_icon-size);font-weight:inherit}ewt-ripple{z-index:-1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.flip-icon .icon{transform:scaleX(-1)}.icon{display:inline-flex}.link{display:grid;height:100%;outline:none;place-items:center;position:absolute;width:100%}.touch{position:absolute;height:max(48px,100%);width:max(48px,100%)}:host([touch-target=none]) .touch{display:none}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1}}
`, Cs = n`:host{--_disabled-icon-color: var(--md-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-icon-button-disabled-icon-opacity, 0.38);--_icon-size: var(--md-icon-button-icon-size, 24px);--_selected-focus-icon-color: var(--md-icon-button-selected-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-icon-color: var(--md-icon-button-selected-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-color: var(--md-icon-button-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-opacity: var(--md-icon-button-selected-hover-state-layer-opacity, 0.08);--_selected-icon-color: var(--md-icon-button-selected-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-icon-color: var(--md-icon-button-selected-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-color: var(--md-icon-button-selected-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-opacity: var(--md-icon-button-selected-pressed-state-layer-opacity, 0.12);--_state-layer-height: var(--md-icon-button-state-layer-height, 40px);--_state-layer-shape: var(--md-icon-button-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));--_state-layer-width: var(--md-icon-button-state-layer-width, 40px);--_focus-icon-color: var(--md-icon-button-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-icon-color: var(--md-icon-button-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-icon-button-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-icon-button-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-icon-button-pressed-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-icon-button-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-icon-button-pressed-state-layer-opacity, 0.12);--_container-shape-start-start: 0;--_container-shape-start-end: 0;--_container-shape-end-end: 0;--_container-shape-end-start: 0;--_container-height: 0;--_container-width: 0;height:var(--_state-layer-height);width:var(--_state-layer-width)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_state-layer-height))/2) max(0px,(48px - var(--_state-layer-width))/2)}ewt-focus-ring{--md-focus-ring-shape-start-start: var(--_state-layer-shape);--md-focus-ring-shape-start-end: var(--_state-layer-shape);--md-focus-ring-shape-end-end: var(--_state-layer-shape);--md-focus-ring-shape-end-start: var(--_state-layer-shape)}.standard{background-color:rgba(0,0,0,0);color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.standard:hover{color:var(--_hover-icon-color)}.standard:focus{color:var(--_focus-icon-color)}.standard:active{color:var(--_pressed-icon-color)}.standard:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}ewt-ripple{border-radius:var(--_state-layer-shape)}.standard:is(:disabled,[aria-disabled=true]){opacity:var(--_disabled-icon-opacity)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_selected-pressed-icon-color)}.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_selected-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_selected-pressed-state-layer-opacity)}
`;
class Ts extends Rs {
}
Ts.styles = [Is, Cs], customElements.define("ew-icon-button", Ts);
const Ls = n`:host{--_active-indicator-color: var(--md-filled-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-text-field-active-indicator-height, 1px);--_caret-color: var(--md-filled-text-field-caret-color, var(--md-sys-color-primary, #6750a4));--_container-color: var(--md-filled-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_disabled-active-indicator-color: var(--md-filled-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-text-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-text-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-text-field-disabled-container-opacity, 0.04);--_disabled-input-text-color: var(--md-filled-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-input-text-opacity: var(--md-filled-text-field-disabled-input-text-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-text-field-disabled-label-text-opacity, 0.38);--_disabled-leading-icon-color: var(--md-filled-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-filled-text-field-disabled-leading-icon-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-text-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-icon-color: var(--md-filled-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-filled-text-field-disabled-trailing-icon-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-active-indicator-color: var(--md-filled-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-caret-color: var(--md-filled-text-field-error-focus-caret-color, var(--md-sys-color-error, #b3261e));--_error-focus-input-text-color: var(--md-filled-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-filled-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-icon-color: var(--md-filled-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-icon-color: var(--md-filled-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-input-text-color: var(--md-filled-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-icon-color: var(--md-filled-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-text-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-icon-color: var(--md-filled-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_error-input-text-color: var(--md-filled-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-label-text-color: var(--md-filled-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-icon-color: var(--md-filled-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-icon-color: var(--md-filled-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-text-field-focus-active-indicator-height, 3px);--_focus-input-text-color: var(--md-filled-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-filled-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-icon-color: var(--md-filled-text-field-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-text-field-hover-active-indicator-height, 1px);--_hover-input-text-color: var(--md-filled-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-text-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-icon-color: var(--md-filled-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-text-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-filled-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-color: var(--md-filled-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_input-text-font: var(--md-filled-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_input-text-line-height: var(--md-filled-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_input-text-placeholder-color: var(--md-filled-text-field-input-text-placeholder-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-prefix-color: var(--md-filled-text-field-input-text-prefix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-size: var(--md-filled-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_input-text-suffix-color: var(--md-filled-text-field-input-text-suffix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-weight: var(--md-filled-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_label-text-color: var(--md-filled-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-icon-color: var(--md-filled-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-icon-size: var(--md-filled-text-field-leading-icon-size, 24px);--_supporting-text-color: var(--md-filled-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-line-height: var(--md-filled-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-weight: var(--md-filled-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_trailing-icon-color: var(--md-filled-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-size: var(--md-filled-text-field-trailing-icon-size, 24px);--_container-shape-start-start: var(--md-filled-text-field-container-shape-start-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-text-field-container-shape-start-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-text-field-container-shape-end-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-text-field-container-shape-end-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_icon-input-space: var(--md-filled-text-field-icon-input-space, 16px);--_leading-space: var(--md-filled-text-field-leading-space, 16px);--_trailing-space: var(--md-filled-text-field-trailing-space, 16px);--_top-space: var(--md-filled-text-field-top-space, 16px);--_bottom-space: var(--md-filled-text-field-bottom-space, 16px);--_input-text-prefix-trailing-space: var(--md-filled-text-field-input-text-prefix-trailing-space, 2px);--_input-text-suffix-leading-space: var(--md-filled-text-field-input-text-suffix-leading-space, 2px);--_with-label-top-space: var(--md-filled-text-field-with-label-top-space, 8px);--_with-label-bottom-space: var(--md-filled-text-field-with-label-bottom-space, 8px);--_focus-caret-color: var(--md-filled-text-field-focus-caret-color, var(--md-sys-color-primary, #6750a4));--_with-leading-icon-leading-space: var(--md-filled-text-field-with-leading-icon-leading-space, 12px);--_with-trailing-icon-trailing-space: var(--md-filled-text-field-with-trailing-icon-trailing-space, 12px);--md-filled-field-active-indicator-color: var(--_active-indicator-color);--md-filled-field-active-indicator-height: var(--_active-indicator-height);--md-filled-field-bottom-space: var(--_bottom-space);--md-filled-field-container-color: var(--_container-color);--md-filled-field-container-shape-end-end: var(--_container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_container-shape-start-start);--md-filled-field-content-color: var(--_input-text-color);--md-filled-field-content-font: var(--_input-text-font);--md-filled-field-content-line-height: var(--_input-text-line-height);--md-filled-field-content-size: var(--_input-text-size);--md-filled-field-content-space: var(--_icon-input-space);--md-filled-field-content-weight: var(--_input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_error-active-indicator-color);--md-filled-field-error-content-color: var(--_error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_error-label-text-color);--md-filled-field-error-leading-content-color: var(--_error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_label-text-color);--md-filled-field-label-text-font: var(--_label-text-font);--md-filled-field-label-text-line-height: var(--_label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_label-text-populated-size);--md-filled-field-label-text-size: var(--_label-text-size);--md-filled-field-label-text-weight: var(--_label-text-weight);--md-filled-field-leading-content-color: var(--_leading-icon-color);--md-filled-field-leading-space: var(--_leading-space);--md-filled-field-supporting-text-color: var(--_supporting-text-color);--md-filled-field-supporting-text-font: var(--_supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_supporting-text-size);--md-filled-field-supporting-text-weight: var(--_supporting-text-weight);--md-filled-field-top-space: var(--_top-space);--md-filled-field-trailing-content-color: var(--_trailing-icon-color);--md-filled-field-trailing-space: var(--_trailing-space);--md-filled-field-with-label-bottom-space: var(--_with-label-bottom-space);--md-filled-field-with-label-top-space: var(--_with-label-top-space);--md-filled-field-with-leading-content-leading-space: var(--_with-leading-icon-leading-space);--md-filled-field-with-trailing-content-trailing-space: var(--_with-trailing-icon-trailing-space)}
`;
class Os extends ct$1 {
  constructor() {
    super(...arguments), this.disabled = false, this.error = false, this.focused = false, this.label = "", this.noAsterisk = false, this.populated = false, this.required = false, this.resizable = false, this.supportingText = "", this.errorText = "", this.count = -1, this.max = -1, this.hasStart = false, this.hasEnd = false, this.isAnimating = false, this.refreshErrorAlert = false, this.disableTransitions = false;
  }
  get counterText() {
    const e = this.count ?? -1, t2 = this.max ?? -1;
    return e < 0 || t2 <= 0 ? "" : `${e} / ${t2}`;
  }
  get supportingOrErrorText() {
    return this.error && this.errorText ? this.errorText : this.supportingText;
  }
  reannounceError() {
    this.refreshErrorAlert = true;
  }
  update(e) {
    e.has("disabled") && void 0 !== e.get("disabled") && (this.disableTransitions = true), this.disabled && this.focused && (e.set("focused", true), this.focused = false), this.animateLabelIfNeeded({ wasFocused: e.get("focused"), wasPopulated: e.get("populated") }), super.update(e);
  }
  render() {
    var e, t2, i, r;
    const o = this.renderLabel(true), a = this.renderLabel(false), n2 = null === (e = this.renderOutline) || void 0 === e ? void 0 : e.call(this, o), l = { disabled: this.disabled, "disable-transitions": this.disableTransitions, error: this.error && !this.disabled, focused: this.focused, "with-start": this.hasStart, "with-end": this.hasEnd, populated: this.populated, resizable: this.resizable, required: this.required, "no-label": !this.label };
    return j$1`
      <div class="field ${Ot$1(l)}">
        <div class="container-overflow">
          ${null === (t2 = this.renderBackground) || void 0 === t2 ? void 0 : t2.call(this)}
          <slot name="container"></slot>
          ${null === (i = this.renderStateLayer) || void 0 === i ? void 0 : i.call(this)} ${null === (r = this.renderIndicator) || void 0 === r ? void 0 : r.call(this)} ${n2}
          <div class="container">
            <div class="start">
              <slot name="start"></slot>
            </div>
            <div class="middle">
              <div class="label-wrapper">
                ${a} ${n2 ? W$1 : o}
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
      this.refreshErrorAlert = false;
    })), this.disableTransitions && requestAnimationFrame((() => {
      this.disableTransitions = false;
    }));
  }
  renderSupportingText() {
    const { supportingOrErrorText: e, counterText: t2 } = this;
    if (!e && !t2) return W$1;
    const i = j$1`<span>${e}</span>`, r = t2 ? j$1`<span class="counter">${t2}</span>` : W$1, o = this.error && this.errorText && !this.refreshErrorAlert;
    return j$1`
      <div class="supporting-text" role=${o ? "alert" : W$1}>${i}${r}</div>
      <slot
        name="aria-describedby"
        @slotchange=${this.updateSlottedAriaDescribedBy}></slot>
    `;
  }
  updateSlottedAriaDescribedBy() {
    for (const e of this.slottedAriaDescribedBy) at$1(j$1`${this.supportingOrErrorText} ${this.counterText}`, e), e.setAttribute("hidden", "");
  }
  renderLabel(e) {
    if (!this.label) return W$1;
    let t2;
    t2 = e ? this.focused || this.populated || this.isAnimating : !this.focused && !this.populated && !this.isAnimating;
    const i = { hidden: !t2, floating: e, resting: !e }, r = `${this.label}${this.required && !this.noAsterisk ? "*" : ""}`;
    return j$1`
      <span class="label ${Ot$1(i)}" aria-hidden=${!t2}
        >${r}</span
      >
    `;
  }
  animateLabelIfNeeded({ wasFocused: e, wasPopulated: t2 }) {
    var i, r, s;
    if (!this.label) return;
    e ?? (e = this.focused), t2 ?? (t2 = this.populated);
    (e || t2) !== (this.focused || this.populated) && (this.isAnimating = true, null === (i = this.labelAnimation) || void 0 === i || i.cancel(), this.labelAnimation = null === (r = this.floatingLabelEl) || void 0 === r ? void 0 : r.animate(this.getLabelKeyframes(), { duration: 150, easing: Rt$1.STANDARD }), null === (s = this.labelAnimation) || void 0 === s || s.addEventListener("finish", (() => {
      this.isAnimating = false;
    })));
  }
  getLabelKeyframes() {
    const { floatingLabelEl: e, restingLabelEl: t2 } = this;
    if (!e || !t2) return [];
    const { x: i, y: r, height: s } = e.getBoundingClientRect(), { x: o, y: a, height: n2 } = t2.getBoundingClientRect(), l = e.scrollWidth, d = t2.scrollWidth, c = d / l, h = `translateX(${o - i}px) translateY(${a - r + Math.round((n2 - s * c) / 2)}px) scale(${c})`, p = "translateX(0) translateY(0) scale(1)", u = t2.clientWidth, f = d > u ? u / c + "px" : "";
    return this.focused || this.populated ? [{ transform: h, width: f }, { transform: p, width: f }] : [{ transform: p, width: f }, { transform: h, width: f }];
  }
  getSurfacePositionClientRect() {
    return this.containerEl.getBoundingClientRect();
  }
}
t([mt$1({ type: Boolean })], Os.prototype, "disabled", void 0), t([mt$1({ type: Boolean })], Os.prototype, "error", void 0), t([mt$1({ type: Boolean })], Os.prototype, "focused", void 0), t([mt$1()], Os.prototype, "label", void 0), t([mt$1({ type: Boolean, attribute: "no-asterisk" })], Os.prototype, "noAsterisk", void 0), t([mt$1({ type: Boolean })], Os.prototype, "populated", void 0), t([mt$1({ type: Boolean })], Os.prototype, "required", void 0), t([mt$1({ type: Boolean })], Os.prototype, "resizable", void 0), t([mt$1({ attribute: "supporting-text" })], Os.prototype, "supportingText", void 0), t([mt$1({ attribute: "error-text" })], Os.prototype, "errorText", void 0), t([mt$1({ type: Number })], Os.prototype, "count", void 0), t([mt$1({ type: Number })], Os.prototype, "max", void 0), t([mt$1({ type: Boolean, attribute: "has-start" })], Os.prototype, "hasStart", void 0), t([mt$1({ type: Boolean, attribute: "has-end" })], Os.prototype, "hasEnd", void 0), t([yt$1({ slot: "aria-describedby" })], Os.prototype, "slottedAriaDescribedBy", void 0), t([ft$1()], Os.prototype, "isAnimating", void 0), t([ft$1()], Os.prototype, "refreshErrorAlert", void 0), t([ft$1()], Os.prototype, "disableTransitions", void 0), t([bt$1(".label.floating")], Os.prototype, "floatingLabelEl", void 0), t([bt$1(".label.resting")], Os.prototype, "restingLabelEl", void 0), t([bt$1(".container")], Os.prototype, "containerEl", void 0);
class Ds extends Os {
  renderBackground() {
    return j$1` <div class="background"></div> `;
  }
  renderStateLayer() {
    return j$1` <div class="state-layer"></div> `;
  }
  renderIndicator() {
    return j$1`<div class="active-indicator"></div>`;
  }
}
const $s = n`@layer styles{:host{--_active-indicator-color: var(--md-filled-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-field-active-indicator-height, 1px);--_bottom-space: var(--md-filled-field-bottom-space, 16px);--_container-color: var(--md-filled-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_content-color: var(--md-filled-field-content-color, var(--md-sys-color-on-surface, #1d1b20));--_content-font: var(--md-filled-field-content-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_content-line-height: var(--md-filled-field-content-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_content-size: var(--md-filled-field-content-size, var(--md-sys-typescale-body-large-size, 1rem));--_content-space: var(--md-filled-field-content-space, 16px);--_content-weight: var(--md-filled-field-content-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_disabled-active-indicator-color: var(--md-filled-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-field-disabled-container-opacity, 0.04);--_disabled-content-color: var(--md-filled-field-disabled-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-content-opacity: var(--md-filled-field-disabled-content-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-field-disabled-label-text-opacity, 0.38);--_disabled-leading-content-color: var(--md-filled-field-disabled-leading-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-content-opacity: var(--md-filled-field-disabled-leading-content-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-content-color: var(--md-filled-field-disabled-trailing-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-content-opacity: var(--md-filled-field-disabled-trailing-content-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-content-color: var(--md-filled-field-error-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-active-indicator-color: var(--md-filled-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-content-color: var(--md-filled-field-error-focus-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-label-text-color: var(--md-filled-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-content-color: var(--md-filled-field-error-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-content-color: var(--md-filled-field-error-focus-trailing-content-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-content-color: var(--md-filled-field-error-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-content-color: var(--md-filled-field-error-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-content-color: var(--md-filled-field-error-hover-trailing-content-color, var(--md-sys-color-on-error-container, #410e0b));--_error-label-text-color: var(--md-filled-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-content-color: var(--md-filled-field-error-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-content-color: var(--md-filled-field-error-trailing-content-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-field-focus-active-indicator-height, 3px);--_focus-content-color: var(--md-filled-field-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-content-color: var(--md-filled-field-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-content-color: var(--md-filled-field-focus-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-field-hover-active-indicator-height, 1px);--_hover-content-color: var(--md-filled-field-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-content-color: var(--md-filled-field-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-content-color: var(--md-filled-field-hover-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-filled-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-content-color: var(--md-filled-field-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-space: var(--md-filled-field-leading-space, 16px);--_supporting-text-color: var(--md-filled-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-leading-space: var(--md-filled-field-supporting-text-leading-space, 16px);--_supporting-text-line-height: var(--md-filled-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-top-space: var(--md-filled-field-supporting-text-top-space, 4px);--_supporting-text-trailing-space: var(--md-filled-field-supporting-text-trailing-space, 16px);--_supporting-text-weight: var(--md-filled-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_top-space: var(--md-filled-field-top-space, 16px);--_trailing-content-color: var(--md-filled-field-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-space: var(--md-filled-field-trailing-space, 16px);--_with-label-bottom-space: var(--md-filled-field-with-label-bottom-space, 8px);--_with-label-top-space: var(--md-filled-field-with-label-top-space, 8px);--_with-leading-content-leading-space: var(--md-filled-field-with-leading-content-leading-space, 12px);--_with-trailing-content-trailing-space: var(--md-filled-field-with-trailing-content-trailing-space, 12px);--_container-shape-start-start: var(--md-filled-field-container-shape-start-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-field-container-shape-start-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-field-container-shape-end-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-field-container-shape-end-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)))}.background,.state-layer{border-radius:inherit;inset:0;pointer-events:none;position:absolute}.background{background:var(--_container-color)}.state-layer{visibility:hidden}.field:not(.disabled):hover .state-layer{visibility:visible}.label.floating{position:absolute;top:var(--_with-label-top-space)}.field:not(.with-start) .label-wrapper{margin-inline-start:var(--_leading-space)}.field:not(.with-end) .label-wrapper{margin-inline-end:var(--_trailing-space)}.active-indicator{inset:auto 0 0 0;pointer-events:none;position:absolute;width:100%;z-index:1}.active-indicator::before,.active-indicator::after{border-bottom:var(--_active-indicator-height) solid var(--_active-indicator-color);inset:auto 0 0 0;content:"";position:absolute;width:100%}.active-indicator::after{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .active-indicator::after{opacity:1}.field:not(.with-start) .content ::slotted(*){padding-inline-start:var(--_leading-space)}.field:not(.with-end) .content ::slotted(*){padding-inline-end:var(--_trailing-space)}.field:not(.no-label) .content ::slotted(:not(textarea)){padding-bottom:var(--_with-label-bottom-space);padding-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}.field:not(.no-label) .content ::slotted(textarea){margin-bottom:var(--_with-label-bottom-space);margin-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}:hover .active-indicator::before{border-bottom-color:var(--_hover-active-indicator-color);border-bottom-width:var(--_hover-active-indicator-height)}.active-indicator::after{border-bottom-color:var(--_focus-active-indicator-color);border-bottom-width:var(--_focus-active-indicator-height)}:hover .state-layer{background:var(--_hover-state-layer-color);opacity:var(--_hover-state-layer-opacity)}.disabled .active-indicator::before{border-bottom-color:var(--_disabled-active-indicator-color);border-bottom-width:var(--_disabled-active-indicator-height);opacity:var(--_disabled-active-indicator-opacity)}.disabled .background{background:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.error .active-indicator::before{border-bottom-color:var(--_error-active-indicator-color)}.error:hover .active-indicator::before{border-bottom-color:var(--_error-hover-active-indicator-color)}.error:hover .state-layer{background:var(--_error-hover-state-layer-color);opacity:var(--_error-hover-state-layer-opacity)}.error .active-indicator::after{border-bottom-color:var(--_error-focus-active-indicator-color)}.resizable .container{bottom:var(--_focus-active-indicator-height);clip-path:inset(var(--_focus-active-indicator-height) 0 0 0)}.resizable .container>*{top:var(--_focus-active-indicator-height)}}@layer hcm{@media(forced-colors: active){.disabled .active-indicator::before{border-color:GrayText;opacity:1}}}
`, Ms = n`:host{display:inline-flex;resize:both}.field{display:flex;flex:1;flex-direction:column;writing-mode:horizontal-tb;max-width:100%}.container-overflow{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-end-radius:var(--_container-shape-end-end);border-end-start-radius:var(--_container-shape-end-start);display:flex;height:100%;position:relative}.container{align-items:center;border-radius:inherit;display:flex;flex:1;max-height:100%;min-height:100%;min-width:min-content;position:relative}.field,.container-overflow{resize:inherit}.resizable:not(.disabled) .container{resize:inherit;overflow:hidden}.disabled{pointer-events:none}slot[name=container]{border-radius:inherit}slot[name=container]::slotted(*){border-radius:inherit;inset:0;pointer-events:none;position:absolute}@layer styles{.start,.middle,.end{display:flex;box-sizing:border-box;height:100%;position:relative}.start{color:var(--_leading-content-color)}.end{color:var(--_trailing-content-color)}.start,.end{align-items:center;justify-content:center}.with-start .start{margin-inline:var(--_with-leading-content-leading-space) var(--_content-space)}.with-end .end{margin-inline:var(--_content-space) var(--_with-trailing-content-trailing-space)}.middle{align-items:stretch;align-self:baseline;flex:1}.content{color:var(--_content-color);display:flex;flex:1;opacity:0;transition:opacity 83ms cubic-bezier(0.2, 0, 0, 1)}.no-label .content,.focused .content,.populated .content{opacity:1;transition-delay:67ms}:is(.disabled,.disable-transitions) .content{transition:none}.content ::slotted(*){all:unset;color:currentColor;font-family:var(--_content-font);font-size:var(--_content-size);line-height:var(--_content-line-height);font-weight:var(--_content-weight);width:100%;overflow-wrap:revert;white-space:revert}.content ::slotted(:not(textarea)){padding-top:var(--_top-space);padding-bottom:var(--_bottom-space)}.content ::slotted(textarea){margin-top:var(--_top-space);margin-bottom:var(--_bottom-space)}:hover .content{color:var(--_hover-content-color)}:hover .start{color:var(--_hover-leading-content-color)}:hover .end{color:var(--_hover-trailing-content-color)}.focused .content{color:var(--_focus-content-color)}.focused .start{color:var(--_focus-leading-content-color)}.focused .end{color:var(--_focus-trailing-content-color)}.disabled .content{color:var(--_disabled-content-color)}.disabled.no-label .content,.disabled.focused .content,.disabled.populated .content{opacity:var(--_disabled-content-opacity)}.disabled .start{color:var(--_disabled-leading-content-color);opacity:var(--_disabled-leading-content-opacity)}.disabled .end{color:var(--_disabled-trailing-content-color);opacity:var(--_disabled-trailing-content-opacity)}.error .content{color:var(--_error-content-color)}.error .start{color:var(--_error-leading-content-color)}.error .end{color:var(--_error-trailing-content-color)}.error:hover .content{color:var(--_error-hover-content-color)}.error:hover .start{color:var(--_error-hover-leading-content-color)}.error:hover .end{color:var(--_error-hover-trailing-content-color)}.error.focused .content{color:var(--_error-focus-content-color)}.error.focused .start{color:var(--_error-focus-leading-content-color)}.error.focused .end{color:var(--_error-focus-trailing-content-color)}}@layer hcm{@media(forced-colors: active){.disabled :is(.start,.content,.end){color:GrayText;opacity:1}}}@layer styles{.label{box-sizing:border-box;color:var(--_label-text-color);overflow:hidden;max-width:100%;text-overflow:ellipsis;white-space:nowrap;z-index:1;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);width:min-content}.label-wrapper{inset:0;pointer-events:none;position:absolute}.label.resting{position:absolute;top:var(--_top-space)}.label.floating{font-size:var(--_label-text-populated-size);line-height:var(--_label-text-populated-line-height);transform-origin:top left}.label.hidden{opacity:0}.no-label .label{display:none}.label-wrapper{inset:0;position:absolute;text-align:initial}:hover .label{color:var(--_hover-label-text-color)}.focused .label{color:var(--_focus-label-text-color)}.disabled .label{color:var(--_disabled-label-text-color)}.disabled .label:not(.hidden){opacity:var(--_disabled-label-text-opacity)}.error .label{color:var(--_error-label-text-color)}.error:hover .label{color:var(--_error-hover-label-text-color)}.error.focused .label{color:var(--_error-focus-label-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .label:not(.hidden){color:GrayText;opacity:1}}}@layer styles{.supporting-text{color:var(--_supporting-text-color);display:flex;font-family:var(--_supporting-text-font);font-size:var(--_supporting-text-size);line-height:var(--_supporting-text-line-height);font-weight:var(--_supporting-text-weight);gap:16px;justify-content:space-between;padding-inline-start:var(--_supporting-text-leading-space);padding-inline-end:var(--_supporting-text-trailing-space);padding-top:var(--_supporting-text-top-space)}.supporting-text :nth-child(2){flex-shrink:0}:hover .supporting-text{color:var(--_hover-supporting-text-color)}.focus .supporting-text{color:var(--_focus-supporting-text-color)}.disabled .supporting-text{color:var(--_disabled-supporting-text-color);opacity:var(--_disabled-supporting-text-opacity)}.error .supporting-text{color:var(--_error-supporting-text-color)}.error:hover .supporting-text{color:var(--_error-hover-supporting-text-color)}.error.focus .supporting-text{color:var(--_error-focus-supporting-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .supporting-text{color:GrayText;opacity:1}}}
`;
let Ps = class extends Ds {
};
Ps.styles = [Ms, $s], Ps = t([pt$1("ewt-filled-field")], Ps);
const Fs = {}, zs = kt$1(class extends It$1 {
  constructor(e) {
    if (super(e), e.type !== Tt$1.PROPERTY && e.type !== Tt$1.ATTRIBUTE && e.type !== Tt$1.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!((e2) => void 0 === e2.strings)(e)) throw Error("`live` bindings can only contain a single expression");
  }
  render(e) {
    return e;
  }
  update(e, [t2]) {
    if (t2 === q$1 || t2 === W$1) return t2;
    const i = e.element, r = e.name;
    if (e.type === Tt$1.PROPERTY) {
      if (t2 === i[r]) return q$1;
    } else if (e.type === Tt$1.BOOLEAN_ATTRIBUTE) {
      if (!!t2 === i.hasAttribute(r)) return q$1;
    } else if (e.type === Tt$1.ATTRIBUTE && i.getAttribute(r) === t2 + "") return q$1;
    return ((e2, t3 = Fs) => {
      e2._$AH = t3;
    })(e), t2;
  }
}), Bs = "important", Us = " !" + Bs, Ns = kt$1(class extends It$1 {
  constructor(e) {
    var t2;
    if (super(e), e.type !== Tt$1.ATTRIBUTE || "style" !== e.name || (null === (t2 = e.strings) || void 0 === t2 ? void 0 : t2.length) > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
  }
  render(e) {
    return Object.keys(e).reduce(((t2, i) => {
      const r = e[i];
      return null == r ? t2 : t2 + `${i = i.includes("-") ? i : i.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${r};`;
    }), "");
  }
  update(e, [t2]) {
    const { style: i } = e.element;
    if (void 0 === this.ft) return this.ft = new Set(Object.keys(t2)), this.render(t2);
    for (const e2 of this.ft) null == t2[e2] && (this.ft.delete(e2), e2.includes("-") ? i.removeProperty(e2) : i[e2] = null);
    for (const e2 in t2) {
      const r = t2[e2];
      if (null != r) {
        this.ft.add(e2);
        const t3 = "string" == typeof r && r.endsWith(Us);
        e2.includes("-") || t3 ? i.setProperty(e2, t3 ? r.slice(0, -11) : r, t3 ? Bs : "") : i[e2] = r;
      }
    }
    return q$1;
  }
}), Hs = { fromAttribute: (e) => e ?? "", toAttribute: (e) => e || null }, qs = /* @__PURE__ */ Symbol("onReportValidity"), Gs = /* @__PURE__ */ Symbol("privateCleanupFormListeners"), Ws = /* @__PURE__ */ Symbol("privateDoNotReportInvalid"), Zs = /* @__PURE__ */ Symbol("privateIsSelfReportingValidity"), Vs = /* @__PURE__ */ Symbol("privateCallOnReportValidity");
function js(e) {
  var t2, i, r;
  class s extends e {
    constructor(...e2) {
      super(...e2), this[t2] = new AbortController(), this[i] = false, this[r] = false, this.addEventListener("invalid", ((e3) => {
        !this[Ws] && e3.isTrusted && this.addEventListener("invalid", (() => {
          this[Vs](e3);
        }), { once: true });
      }), { capture: true });
    }
    checkValidity() {
      this[Ws] = true;
      const e2 = super.checkValidity();
      return this[Ws] = false, e2;
    }
    reportValidity() {
      this[Zs] = true;
      const e2 = super.reportValidity();
      return e2 && this[Vs](null), this[Zs] = false, e2;
    }
    [(t2 = Gs, i = Ws, r = Zs, Vs)](e2) {
      const t3 = null == e2 ? void 0 : e2.defaultPrevented;
      if (t3) return;
      this[qs](e2);
      !t3 && (null == e2 ? void 0 : e2.defaultPrevented) && (this[Zs] || (function(e3, t4) {
        if (!e3) return true;
        let i2;
        for (const t5 of e3.elements) if (t5.matches(":invalid")) {
          i2 = t5;
          break;
        }
        return i2 === t4;
      })(this[Kt$1].form, this)) && this.focus();
    }
    [qs](e2) {
      throw new Error("Implement [onReportValidity]");
    }
    formAssociatedCallback(e2) {
      super.formAssociatedCallback && super.formAssociatedCallback(e2), this[Gs].abort(), e2 && (this[Gs] = new AbortController(), (function(e3, t3, i2, r2) {
        const s2 = (function(e4) {
          if (!Ks.has(e4)) {
            const t4 = new EventTarget();
            Ks.set(e4, t4);
            for (const i3 of ["reportValidity", "requestSubmit"]) {
              const r3 = e4[i3];
              e4[i3] = function() {
                t4.dispatchEvent(new Event("before"));
                const e5 = Reflect.apply(r3, this, arguments);
                return t4.dispatchEvent(new Event("after")), e5;
              };
            }
          }
          return Ks.get(e4);
        })(t3);
        let o, a = false, n2 = false;
        s2.addEventListener("before", (() => {
          n2 = true, o = new AbortController(), a = false, e3.addEventListener("invalid", (() => {
            a = true;
          }), { signal: o.signal });
        }), { signal: r2 }), s2.addEventListener("after", (() => {
          var e4;
          n2 = false, null === (e4 = o) || void 0 === e4 || e4.abort(), a || i2();
        }), { signal: r2 }), t3.addEventListener("submit", (() => {
          n2 || i2();
        }), { signal: r2 });
      })(this, e2, (() => {
        this[Vs](null);
      }), this[Gs].signal));
    }
  }
  return s;
}
const Ks = /* @__PURE__ */ new WeakMap();
class Ys extends fe {
  computeValidity({ state: e, renderedControl: t2 }) {
    let i = t2;
    Xs(e) && !i ? (i = this.inputControl || document.createElement("input"), this.inputControl = i) : i || (i = this.textAreaControl || document.createElement("textarea"), this.textAreaControl = i);
    const r = Xs(e) ? i : null;
    if (r && (r.type = e.type), i.value !== e.value && (i.value = e.value), i.required = e.required, r) {
      const t3 = e;
      t3.pattern ? r.pattern = t3.pattern : r.removeAttribute("pattern"), t3.min ? r.min = t3.min : r.removeAttribute("min"), t3.max ? r.max = t3.max : r.removeAttribute("max"), t3.step ? r.step = t3.step : r.removeAttribute("step");
    }
    return (e.minLength ?? -1) > -1 ? i.setAttribute("minlength", String(e.minLength)) : i.removeAttribute("minlength"), (e.maxLength ?? -1) > -1 ? i.setAttribute("maxlength", String(e.maxLength)) : i.removeAttribute("maxlength"), { validity: i.validity, validationMessage: i.validationMessage };
  }
  equals({ state: e }, { state: t2 }) {
    const i = e.type === t2.type && e.value === t2.value && e.required === t2.required && e.minLength === t2.minLength && e.maxLength === t2.maxLength;
    return Xs(e) && Xs(t2) ? i && e.pattern === t2.pattern && e.min === t2.min && e.max === t2.max && e.step === t2.step : i;
  }
  copy({ state: e }) {
    return { state: Xs(e) ? this.copyInput(e) : this.copyTextArea(e), renderedControl: null };
  }
  copyInput(e) {
    const { type: t2, pattern: i, min: r, max: s, step: o } = e;
    return { ...this.copySharedState(e), type: t2, pattern: i, min: r, max: s, step: o };
  }
  copyTextArea(e) {
    return { ...this.copySharedState(e), type: e.type };
  }
  copySharedState({ value: e, required: t2, minLength: i, maxLength: r }) {
    return { value: e, required: t2, minLength: i, maxLength: r };
  }
}
function Xs(e) {
  return "textarea" !== e.type;
}
const Js = Wt$1(js(ce(ue(Jt$1(ct$1)))));
class Qs extends Js {
  constructor() {
    super(...arguments), this.error = false, this.errorText = "", this.label = "", this.noAsterisk = false, this.required = false, this.value = "", this.prefixText = "", this.suffixText = "", this.hasLeadingIcon = false, this.hasTrailingIcon = false, this.supportingText = "", this.textDirection = "", this.rows = 2, this.cols = 20, this.inputMode = "", this.max = "", this.maxLength = -1, this.min = "", this.minLength = -1, this.noSpinner = false, this.pattern = "", this.placeholder = "", this.readOnly = false, this.multiple = false, this.step = "", this.type = "text", this.autocomplete = "", this.dirty = false, this.focused = false, this.nativeError = false, this.nativeErrorText = "";
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
    const t2 = this.getInput();
    t2 && (t2.valueAsNumber = e, this.value = t2.value);
  }
  get valueAsDate() {
    const e = this.getInput();
    return e ? e.valueAsDate : null;
  }
  set valueAsDate(e) {
    const t2 = this.getInput();
    t2 && (t2.valueAsDate = e, this.value = t2.value);
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
  setSelectionRange(e, t2, i) {
    this.getInputOrTextarea().setSelectionRange(e, t2, i);
  }
  showPicker() {
    const e = this.getInput();
    e && e.showPicker();
  }
  stepDown(e) {
    const t2 = this.getInput();
    t2 && (t2.stepDown(e), this.value = t2.value);
  }
  stepUp(e) {
    const t2 = this.getInput();
    t2 && (t2.stepUp(e), this.value = t2.value);
  }
  reset() {
    this.dirty = false, this.value = this.getAttribute("value") ?? "", this.nativeError = false, this.nativeErrorText = "";
  }
  attributeChangedCallback(e, t2, i) {
    "value" === e && this.dirty || super.attributeChangedCallback(e, t2, i);
  }
  render() {
    const e = { disabled: this.disabled, error: !this.disabled && this.hasError, textarea: "textarea" === this.type, "no-spinner": this.noSpinner };
    return j$1`
      <span class="text-field ${Ot$1(e)}">
        ${this.renderField()}
      </span>
    `;
  }
  updated(e) {
    const t2 = this.getInputOrTextarea().value;
    this.value !== t2 && (this.value = t2);
  }
  renderField() {
    return Q`<${this.fieldTag}
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
      ?resizable=${"textarea" === this.type}
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
    return j$1`
      <span class="icon leading" slot="start">
        <slot name="leading-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderTrailingIcon() {
    return j$1`
      <span class="icon trailing" slot="end">
        <slot name="trailing-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderInputOrTextarea() {
    const e = { direction: this.textDirection }, t2 = this.ariaLabel || this.label || W$1, i = this.autocomplete, r = (this.maxLength ?? -1) > -1, o = (this.minLength ?? -1) > -1;
    if ("textarea" === this.type) return j$1`
        <textarea
          class="input"
          style=${Ns(e)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${t2}
          autocomplete=${i || W$1}
          name=${this.name || W$1}
          ?disabled=${this.disabled}
          maxlength=${r ? this.maxLength : W$1}
          minlength=${o ? this.minLength : W$1}
          placeholder=${this.placeholder || W$1}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          rows=${this.rows}
          cols=${this.cols}
          .value=${zs(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent}></textarea>
      `;
    const a = this.renderPrefix(), n2 = this.renderSuffix(), l = this.inputMode;
    return j$1`
      <div class="input-wrapper">
        ${a}
        <input
          class="input"
          style=${Ns(e)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${t2}
          autocomplete=${i || W$1}
          name=${this.name || W$1}
          ?disabled=${this.disabled}
          inputmode=${l || W$1}
          max=${this.max || W$1}
          maxlength=${r ? this.maxLength : W$1}
          min=${this.min || W$1}
          minlength=${o ? this.minLength : W$1}
          pattern=${this.pattern || W$1}
          placeholder=${this.placeholder || W$1}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          ?multiple=${this.multiple}
          step=${this.step || W$1}
          type=${this.type}
          .value=${zs(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent} />
        ${n2}
      </div>
    `;
  }
  renderPrefix() {
    return this.renderAffix(this.prefixText, false);
  }
  renderSuffix() {
    return this.renderAffix(this.suffixText, true);
  }
  renderAffix(e, t2) {
    if (!e) return W$1;
    return j$1`<span class="${Ot$1({ suffix: t2, prefix: !t2 })}">${e}</span>`;
  }
  getErrorText() {
    return this.error ? this.errorText : this.nativeErrorText;
  }
  handleFocusChange() {
    var e;
    this.focused = (null === (e = this.inputOrTextarea) || void 0 === e ? void 0 : e.matches(":focus")) ?? false;
  }
  handleInput(e) {
    this.dirty = true, this.value = e.target.value;
  }
  redispatchEvent(e) {
    de$1(this, e);
  }
  getInputOrTextarea() {
    return this.inputOrTextarea || (this.connectedCallback(), this.scheduleUpdate()), this.isUpdatePending && this.scheduleUpdate(), this.inputOrTextarea;
  }
  getInput() {
    return "textarea" === this.type ? null : this.getInputOrTextarea();
  }
  handleIconChange() {
    this.hasLeadingIcon = this.leadingIcons.length > 0, this.hasTrailingIcon = this.trailingIcons.length > 0;
  }
  [he]() {
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
  [oe]() {
    return new Ys((() => ({ state: this, renderedControl: this.inputOrTextarea })));
  }
  [ae]() {
    return this.inputOrTextarea;
  }
  [qs](e) {
    null == e || e.preventDefault();
    const t2 = this.getErrorText();
    var i;
    (this.nativeError = !!e, this.nativeErrorText = this.validationMessage, t2 === this.getErrorText()) && (null === (i = this.field) || void 0 === i || i.reannounceError());
  }
}
Qs.shadowRootOptions = { ...ct$1.shadowRootOptions, delegatesFocus: true }, t([mt$1({ type: Boolean, reflect: true })], Qs.prototype, "error", void 0), t([mt$1({ attribute: "error-text" })], Qs.prototype, "errorText", void 0), t([mt$1()], Qs.prototype, "label", void 0), t([mt$1({ type: Boolean, attribute: "no-asterisk" })], Qs.prototype, "noAsterisk", void 0), t([mt$1({ type: Boolean, reflect: true })], Qs.prototype, "required", void 0), t([mt$1()], Qs.prototype, "value", void 0), t([mt$1({ attribute: "prefix-text" })], Qs.prototype, "prefixText", void 0), t([mt$1({ attribute: "suffix-text" })], Qs.prototype, "suffixText", void 0), t([mt$1({ type: Boolean, attribute: "has-leading-icon" })], Qs.prototype, "hasLeadingIcon", void 0), t([mt$1({ type: Boolean, attribute: "has-trailing-icon" })], Qs.prototype, "hasTrailingIcon", void 0), t([mt$1({ attribute: "supporting-text" })], Qs.prototype, "supportingText", void 0), t([mt$1({ attribute: "text-direction" })], Qs.prototype, "textDirection", void 0), t([mt$1({ type: Number })], Qs.prototype, "rows", void 0), t([mt$1({ type: Number })], Qs.prototype, "cols", void 0), t([mt$1({ reflect: true })], Qs.prototype, "inputMode", void 0), t([mt$1()], Qs.prototype, "max", void 0), t([mt$1({ type: Number })], Qs.prototype, "maxLength", void 0), t([mt$1()], Qs.prototype, "min", void 0), t([mt$1({ type: Number })], Qs.prototype, "minLength", void 0), t([mt$1({ type: Boolean, attribute: "no-spinner" })], Qs.prototype, "noSpinner", void 0), t([mt$1()], Qs.prototype, "pattern", void 0), t([mt$1({ reflect: true, converter: Hs })], Qs.prototype, "placeholder", void 0), t([mt$1({ type: Boolean, reflect: true })], Qs.prototype, "readOnly", void 0), t([mt$1({ type: Boolean, reflect: true })], Qs.prototype, "multiple", void 0), t([mt$1()], Qs.prototype, "step", void 0), t([mt$1({ reflect: true })], Qs.prototype, "type", void 0), t([mt$1({ reflect: true })], Qs.prototype, "autocomplete", void 0), t([ft$1()], Qs.prototype, "dirty", void 0), t([ft$1()], Qs.prototype, "focused", void 0), t([ft$1()], Qs.prototype, "nativeError", void 0), t([ft$1()], Qs.prototype, "nativeErrorText", void 0), t([bt$1(".input")], Qs.prototype, "inputOrTextarea", void 0), t([bt$1(".field")], Qs.prototype, "field", void 0), t([yt$1({ slot: "leading-icon" })], Qs.prototype, "leadingIcons", void 0), t([yt$1({ slot: "trailing-icon" })], Qs.prototype, "trailingIcons", void 0);
class eo extends Qs {
  constructor() {
    super(...arguments), this.fieldTag = X`ewt-filled-field`;
  }
}
const to = n`:host{display:inline-flex;outline:none;resize:both;text-align:start;-webkit-tap-highlight-color:rgba(0,0,0,0)}.text-field,.field{width:100%}.text-field{display:inline-flex}.field{cursor:text}.disabled .field{cursor:default}.text-field,.textarea .field{resize:inherit}slot[name=container]{border-radius:inherit}.icon{color:currentColor;display:flex;align-items:center;justify-content:center;fill:currentColor;position:relative}.icon ::slotted(*){display:flex;position:absolute}[has-start] .icon.leading{font-size:var(--_leading-icon-size);height:var(--_leading-icon-size);width:var(--_leading-icon-size)}[has-end] .icon.trailing{font-size:var(--_trailing-icon-size);height:var(--_trailing-icon-size);width:var(--_trailing-icon-size)}.input-wrapper{display:flex}.input-wrapper>*{all:inherit;padding:0}.input{caret-color:var(--_caret-color);overflow-x:hidden;text-align:inherit}.input::placeholder{color:currentColor;opacity:1}.input::-webkit-calendar-picker-indicator{display:none}.input::-webkit-search-decoration,.input::-webkit-search-cancel-button{display:none}@media(forced-colors: active){.input{background:none}}.no-spinner .input::-webkit-inner-spin-button,.no-spinner .input::-webkit-outer-spin-button{display:none}.no-spinner .input[type=number]{-moz-appearance:textfield}:focus-within .input{caret-color:var(--_focus-caret-color)}.error:focus-within .input{caret-color:var(--_error-focus-caret-color)}.text-field:not(.disabled) .prefix{color:var(--_input-text-prefix-color)}.text-field:not(.disabled) .suffix{color:var(--_input-text-suffix-color)}.text-field:not(.disabled) .input::placeholder{color:var(--_input-text-placeholder-color)}.prefix,.suffix{text-wrap:nowrap;width:min-content}.prefix{padding-inline-end:var(--_input-text-prefix-trailing-space)}.suffix{padding-inline-start:var(--_input-text-suffix-leading-space)}
`;
class io extends eo {
  constructor() {
    super(...arguments), this.fieldTag = X`ewt-filled-field`;
  }
}
io.styles = [to, Ls], customElements.define("ew-filled-text-field", io);
class ro extends ct$1 {
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  render() {
    return j$1`<span class="shadow"></span>`;
  }
}
const so = n`:host,.shadow,.shadow::before,.shadow::after{border-radius:inherit;inset:0;position:absolute;transition-duration:inherit;transition-property:inherit;transition-timing-function:inherit}:host{display:flex;pointer-events:none;transition-property:box-shadow,opacity}.shadow::before,.shadow::after{content:"";transition-property:box-shadow,opacity;--_level: var(--md-elevation-level, 0);--_shadow-color: var(--md-elevation-shadow-color, var(--md-sys-color-shadow, #000))}.shadow::before{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 3,1) + 2*clamp(0,var(--_level) - 4,1))) calc(1px*(2*clamp(0,var(--_level),1) + clamp(0,var(--_level) - 2,1) + clamp(0,var(--_level) - 4,1))) 0px var(--_shadow-color);opacity:.3}.shadow::after{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 1,1) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(3*clamp(0,var(--_level),2) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(clamp(0,var(--_level),4) + 2*clamp(0,var(--_level) - 4,1))) var(--_shadow-color);opacity:.15}
`;
let oo = class extends ro {
};
oo.styles = [so], oo = t([pt$1("ewt-elevation")], oo);
const ao = function(e, t2) {
  return new CustomEvent("close-menu", { bubbles: true, composed: true, detail: { initiator: e, reason: t2, itemPath: [e] } });
}, no = { SPACE: "Space", ENTER: "Enter" }, lo = "click-selection", co = "keydown", ho = { ESCAPE: "Escape", SPACE: no.SPACE, ENTER: no.ENTER };
function po(e) {
  return Object.values(ho).some(((t2) => t2 === e));
}
function uo(e, t2) {
  const i = new Event("md-contains", { bubbles: true, composed: true });
  let r = [];
  const s = (e2) => {
    r = e2.composedPath();
  };
  t2.addEventListener("md-contains", s), e.dispatchEvent(i), t2.removeEventListener("md-contains", s);
  return r.length > 0;
}
const fo = "none", mo = "list-root", vo = "first-item", go = "last-item", _o = "end-start", bo = "start-start";
class yo {
  constructor(e, t2) {
    this.host = e, this.getProperties = t2, this.surfaceStylesInternal = { display: "none" }, this.lastValues = { isOpen: false }, this.host.addController(this);
  }
  get surfaceStyles() {
    return this.surfaceStylesInternal;
  }
  async position() {
    const { surfaceEl: e, anchorEl: t2, anchorCorner: i, surfaceCorner: r, positioning: s, xOffset: o, yOffset: a, disableBlockFlip: n2, disableInlineFlip: l, repositionStrategy: d } = this.getProperties(), c = i.toLowerCase().trim(), h = r.toLowerCase().trim();
    if (!e || !t2) return;
    const p = window.innerWidth, u = window.innerHeight, f = document.createElement("div");
    f.style.opacity = "0", f.style.position = "fixed", f.style.display = "block", f.style.inset = "0", document.body.appendChild(f);
    const m = f.getBoundingClientRect();
    f.remove();
    const v = window.innerHeight - m.bottom, g = window.innerWidth - m.right;
    this.surfaceStylesInternal = { display: "block", opacity: "0" }, this.host.requestUpdate(), await this.host.updateComplete, e.popover && e.isConnected && e.showPopover();
    const _ = e.getSurfacePositionClientRect ? e.getSurfacePositionClientRect() : e.getBoundingClientRect(), b = t2.getSurfacePositionClientRect ? t2.getSurfacePositionClientRect() : t2.getBoundingClientRect(), [y, x] = h.split("-"), [w, E] = c.split("-"), S = "ltr" === getComputedStyle(e).direction;
    let { blockInset: k, blockOutOfBoundsCorrection: A, surfaceBlockProperty: R } = this.calculateBlock({ surfaceRect: _, anchorRect: b, anchorBlock: w, surfaceBlock: y, yOffset: a, positioning: s, windowInnerHeight: u, blockScrollbarHeight: v });
    if (A && !n2) {
      const e2 = "start" === y ? "end" : "start", t3 = "start" === w ? "end" : "start", i2 = this.calculateBlock({ surfaceRect: _, anchorRect: b, anchorBlock: t3, surfaceBlock: e2, yOffset: a, positioning: s, windowInnerHeight: u, blockScrollbarHeight: v });
      A > i2.blockOutOfBoundsCorrection && (k = i2.blockInset, A = i2.blockOutOfBoundsCorrection, R = i2.surfaceBlockProperty);
    }
    let { inlineInset: I, inlineOutOfBoundsCorrection: C, surfaceInlineProperty: T2 } = this.calculateInline({ surfaceRect: _, anchorRect: b, anchorInline: E, surfaceInline: x, xOffset: o, positioning: s, isLTR: S, windowInnerWidth: p, inlineScrollbarWidth: g });
    if (C && !l) {
      const e2 = "start" === x ? "end" : "start", t3 = "start" === E ? "end" : "start", i2 = this.calculateInline({ surfaceRect: _, anchorRect: b, anchorInline: t3, surfaceInline: e2, xOffset: o, positioning: s, isLTR: S, windowInnerWidth: p, inlineScrollbarWidth: g });
      Math.abs(C) > Math.abs(i2.inlineOutOfBoundsCorrection) && (I = i2.inlineInset, C = i2.inlineOutOfBoundsCorrection, T2 = i2.surfaceInlineProperty);
    }
    "move" === d && (k -= A, I -= C), this.surfaceStylesInternal = { display: "block", opacity: "1", [R]: `${k}px`, [T2]: `${I}px` }, "resize" === d && (A && (this.surfaceStylesInternal.height = _.height - A + "px"), C && (this.surfaceStylesInternal.width = _.width - C + "px")), this.host.requestUpdate();
  }
  calculateBlock(e) {
    const { surfaceRect: t2, anchorRect: i, anchorBlock: r, surfaceBlock: s, yOffset: o, positioning: a, windowInnerHeight: n2, blockScrollbarHeight: l } = e, d = "fixed" === a || "document" === a ? 1 : 0, c = "document" === a ? 1 : 0, h = "start" === s ? 1 : 0, p = "end" === s ? 1 : 0, u = (r !== s ? 1 : 0) * i.height + o, f = h * i.top + p * (n2 - i.bottom - l);
    return { blockInset: d * f + c * (h * window.scrollY - p * window.scrollY) + u, blockOutOfBoundsCorrection: Math.abs(Math.min(0, n2 - f - u - t2.height)), surfaceBlockProperty: "start" === s ? "inset-block-start" : "inset-block-end" };
  }
  calculateInline(e) {
    const { isLTR: t2, surfaceInline: i, anchorInline: r, anchorRect: s, surfaceRect: o, xOffset: a, positioning: n2, windowInnerWidth: l, inlineScrollbarWidth: d } = e, c = "fixed" === n2 || "document" === n2 ? 1 : 0, h = "document" === n2 ? 1 : 0, p = t2 ? 1 : 0, u = t2 ? 0 : 1, f = "start" === i ? 1 : 0, m = "end" === i ? 1 : 0, v = (r !== i ? 1 : 0) * s.width + a, g = p * (f * s.left + m * (l - s.right - d)) + u * (f * (l - s.right - d) + m * s.left);
    let _ = "start" === i ? "inset-inline-start" : "inset-inline-end";
    return "document" !== n2 && "fixed" !== n2 || (_ = "start" === i && t2 || "end" === i && !t2 ? "left" : "right"), { inlineInset: c * g + v + h * (p * (f * window.scrollX - m * window.scrollX) + u * (m * window.scrollX - f * window.scrollX)), inlineOutOfBoundsCorrection: Math.abs(Math.min(0, l - g - v - o.width)), surfaceInlineProperty: _ };
  }
  hostUpdate() {
    this.onUpdate();
  }
  hostUpdated() {
    this.onUpdate();
  }
  async onUpdate() {
    const e = this.getProperties();
    let t2 = false;
    for (const [i2, r2] of Object.entries(e)) if (t2 = t2 || r2 !== this.lastValues[i2], t2) break;
    const i = this.lastValues.isOpen !== e.isOpen, r = !!e.anchorEl, s = !!e.surfaceEl;
    t2 && r && s && (this.lastValues.isOpen = e.isOpen, e.isOpen ? (this.lastValues = e, await this.position(), e.onOpen()) : i && (await e.beforeClose(), this.close(), e.onClose()));
  }
  close() {
    this.surfaceStylesInternal = { display: "none" }, this.host.requestUpdate();
    const e = this.getProperties().surfaceEl;
    null != e && e.popover && null != e && e.isConnected && e.hidePopover();
  }
}
const xo = 0, wo = 1, Eo = 2;
class So {
  constructor(e) {
    this.getProperties = e, this.typeaheadRecords = [], this.typaheadBuffer = "", this.cancelTypeaheadTimeout = 0, this.isTypingAhead = false, this.lastActiveRecord = null, this.onKeydown = (e2) => {
      this.isTypingAhead ? this.typeahead(e2) : this.beginTypeahead(e2);
    }, this.endTypeahead = () => {
      this.isTypingAhead = false, this.typaheadBuffer = "", this.typeaheadRecords = [];
    };
  }
  get items() {
    return this.getProperties().getItems();
  }
  get active() {
    return this.getProperties().active;
  }
  beginTypeahead(e) {
    this.active && ("Space" === e.code || "Enter" === e.code || e.code.startsWith("Arrow") || "Escape" === e.code || (this.isTypingAhead = true, this.typeaheadRecords = this.items.map(((e2, t2) => [t2, e2, e2.typeaheadText.trim().toLowerCase()])), this.lastActiveRecord = this.typeaheadRecords.find(((e2) => 0 === e2[wo].tabIndex)) ?? null, this.lastActiveRecord && (this.lastActiveRecord[wo].tabIndex = -1), this.typeahead(e)));
  }
  typeahead(e) {
    if (e.defaultPrevented) return;
    if (clearTimeout(this.cancelTypeaheadTimeout), "Enter" === e.code || e.code.startsWith("Arrow") || "Escape" === e.code) return this.endTypeahead(), void (this.lastActiveRecord && (this.lastActiveRecord[wo].tabIndex = -1));
    "Space" === e.code && e.preventDefault(), this.cancelTypeaheadTimeout = setTimeout(this.endTypeahead, this.getProperties().typeaheadBufferTime), this.typaheadBuffer += e.key.toLowerCase();
    const t2 = this.lastActiveRecord ? this.lastActiveRecord[xo] : -1, i = this.typeaheadRecords.length, r = (e2) => (e2[xo] + i - t2) % i, s = this.typeaheadRecords.filter(((e2) => !e2[wo].disabled && e2[Eo].startsWith(this.typaheadBuffer))).sort(((e2, t3) => r(e2) - r(t3)));
    if (0 === s.length) return clearTimeout(this.cancelTypeaheadTimeout), this.lastActiveRecord && (this.lastActiveRecord[wo].tabIndex = -1), void this.endTypeahead();
    const o = 1 === this.typaheadBuffer.length;
    let a;
    a = this.lastActiveRecord === s[0] && o ? s[1] ?? s[0] : s[0], this.lastActiveRecord && (this.lastActiveRecord[wo].tabIndex = -1), this.lastActiveRecord = a, a[wo].tabIndex = 0, a[wo].focus();
  }
}
const ko = /* @__PURE__ */ new Set([B.ArrowDown, B.ArrowUp, B.Home, B.End]), Ao = /* @__PURE__ */ new Set([B.ArrowLeft, B.ArrowRight, ...ko]);
class Ro extends ct$1 {
  get openDirection() {
    return "start" === this.menuCorner.split("-")[0] ? "DOWN" : "UP";
  }
  get anchorElement() {
    return this.anchor ? this.getRootNode().querySelector(`#${this.anchor}`) : this.currentAnchorElement;
  }
  set anchorElement(e) {
    this.currentAnchorElement = e, this.requestUpdate("anchorElement");
  }
  constructor() {
    super(), this.anchor = "", this.positioning = "absolute", this.quick = false, this.hasOverflow = false, this.open = false, this.xOffset = 0, this.yOffset = 0, this.noHorizontalFlip = false, this.noVerticalFlip = false, this.typeaheadDelay = 200, this.anchorCorner = _o, this.menuCorner = bo, this.stayOpenOnOutsideClick = false, this.stayOpenOnFocusout = false, this.skipRestoreFocus = false, this.defaultFocus = vo, this.noNavigationWrap = false, this.typeaheadActive = true, this.isSubmenu = false, this.pointerPath = [], this.isRepositioning = false, this.openCloseAnimationSignal = zt$1(), this.listController = new U({ isItem: (e) => e.hasAttribute("md-menu-item"), getPossibleItems: () => this.slotItems, isRtl: () => "rtl" === getComputedStyle(this).direction, deactivateItem: (e) => {
      e.selected = false, e.tabIndex = -1;
    }, activateItem: (e) => {
      e.selected = true, e.tabIndex = 0;
    }, isNavigableKey: (e) => {
      if (!this.isSubmenu) return Ao.has(e);
      return e === ("rtl" === getComputedStyle(this).direction ? B.ArrowLeft : B.ArrowRight) || ko.has(e);
    }, wrapNavigation: () => !this.noNavigationWrap }), this.lastFocusedElement = null, this.typeaheadController = new So((() => ({ getItems: () => this.items, typeaheadBufferTime: this.typeaheadDelay, active: this.typeaheadActive }))), this.currentAnchorElement = null, this.internals = this.attachInternals(), this.menuPositionController = new yo(this, (() => ({ anchorCorner: this.anchorCorner, surfaceCorner: this.menuCorner, surfaceEl: this.surfaceEl, anchorEl: this.anchorElement, positioning: "popover" === this.positioning ? "document" : this.positioning, isOpen: this.open, xOffset: this.xOffset, yOffset: this.yOffset, disableBlockFlip: this.noVerticalFlip, disableInlineFlip: this.noHorizontalFlip, onOpen: this.onOpened, beforeClose: this.beforeClose, onClose: this.onClosed, repositionStrategy: this.hasOverflow && "popover" !== this.positioning ? "move" : "resize" }))), this.onWindowResize = () => {
      this.isRepositioning || "document" !== this.positioning && "fixed" !== this.positioning && "popover" !== this.positioning || (this.isRepositioning = true, this.reposition(), this.isRepositioning = false);
    }, this.handleFocusout = async (e) => {
      const t2 = this.anchorElement;
      if (this.stayOpenOnFocusout || !this.open || this.pointerPath.includes(t2)) return;
      if (e.relatedTarget) {
        if (uo(e.relatedTarget, this) || 0 !== this.pointerPath.length && uo(e.relatedTarget, t2)) return;
      } else if (this.pointerPath.includes(this)) return;
      const i = this.skipRestoreFocus;
      this.skipRestoreFocus = true, this.close(), await this.updateComplete, this.skipRestoreFocus = i;
    }, this.onOpened = async () => {
      this.lastFocusedElement = (function(e2 = document) {
        let t3 = e2.activeElement;
        for (; t3 && null !== (i2 = t3) && void 0 !== i2 && null !== (i2 = i2.shadowRoot) && void 0 !== i2 && i2.activeElement; ) {
          var i2;
          t3 = t3.shadowRoot.activeElement;
        }
        return t3;
      })();
      const e = this.items, t2 = D(e);
      t2 && this.defaultFocus !== fo && (t2.item.tabIndex = -1);
      let i = !this.quick;
      switch (this.quick ? this.dispatchEvent(new Event("opening")) : i = !!await this.animateOpen(), this.defaultFocus) {
        case vo:
          const t3 = $(e);
          t3 && (t3.tabIndex = 0, t3.focus(), await t3.updateComplete);
          break;
        case go:
          const i2 = M(e);
          i2 && (i2.tabIndex = 0, i2.focus(), await i2.updateComplete);
          break;
        case mo:
          this.focus();
      }
      i || this.dispatchEvent(new Event("opened"));
    }, this.beforeClose = async () => {
      var e, t2;
      (this.open = false, this.skipRestoreFocus) || (null === (e = this.lastFocusedElement) || void 0 === e || null === (t2 = e.focus) || void 0 === t2 || t2.call(e));
      this.quick || await this.animateClose();
    }, this.onClosed = () => {
      this.quick && (this.dispatchEvent(new Event("closing")), this.dispatchEvent(new Event("closed")));
    }, this.onWindowPointerdown = (e) => {
      this.pointerPath = e.composedPath();
    }, this.onDocumentClick = (e) => {
      if (!this.open) return;
      const t2 = e.composedPath();
      this.stayOpenOnOutsideClick || t2.includes(this) || t2.includes(this.anchorElement) || (this.open = false);
    }, this.internals.role = "menu", this.addEventListener("keydown", this.handleKeydown), this.addEventListener("keydown", this.captureKeydown, { capture: true }), this.addEventListener("focusout", this.handleFocusout);
  }
  get items() {
    return this.listController.items;
  }
  willUpdate(e) {
    e.has("open") && (this.open ? this.removeAttribute("aria-hidden") : this.setAttribute("aria-hidden", "true"));
  }
  update(e) {
    e.has("open") && (this.open ? this.setUpGlobalEventListeners() : this.cleanUpGlobalEventListeners()), e.has("positioning") && "popover" === this.positioning && !this.showPopover && (this.positioning = "fixed"), super.update(e);
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
    return j$1`
      <div
        class="menu ${Ot$1(this.getSurfaceClasses())}"
        style=${Ns(this.menuPositionController.surfaceStyles)}
        popover=${"popover" === this.positioning ? "manual" : W$1}>
        ${this.renderElevation()}
        <div class="items">
          <div class="item-padding"> ${this.renderMenuItems()} </div>
        </div>
      </div>
    `;
  }
  renderMenuItems() {
    return j$1`<slot
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
    return j$1`<ewt-elevation part="elevation"></ewt-elevation>`;
  }
  getSurfaceClasses() {
    return { open: this.open, fixed: "fixed" === this.positioning, "has-overflow": this.hasOverflow };
  }
  captureKeydown(e) {
    e.target === this && !e.defaultPrevented && po(e.code) && (e.preventDefault(), this.close()), this.typeaheadController.onKeydown(e);
  }
  async animateOpen() {
    const e = this.surfaceEl, t2 = this.slotEl;
    if (!e || !t2) return true;
    const i = this.openDirection;
    this.dispatchEvent(new Event("opening")), e.classList.toggle("animating", true);
    const r = this.openCloseAnimationSignal.start(), s = e.offsetHeight, o = "UP" === i, a = this.items, n2 = 250 / a.length, l = e.animate([{ height: "0px" }, { height: `${s}px` }], { duration: 500, easing: Rt$1.EMPHASIZED }), d = t2.animate([{ transform: o ? `translateY(-${s}px)` : "" }, { transform: "" }], { duration: 500, easing: Rt$1.EMPHASIZED }), c = e.animate([{ opacity: 0 }, { opacity: 1 }], 50), h = [];
    for (let e2 = 0; e2 < a.length; e2++) {
      const t3 = a[o ? a.length - 1 - e2 : e2], i2 = t3.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: n2 * e2 });
      t3.classList.toggle("md-menu-hidden", true), i2.addEventListener("finish", (() => {
        t3.classList.toggle("md-menu-hidden", false);
      })), h.push([t3, i2]);
    }
    let p = (e2) => {
    };
    const u = new Promise(((e2) => {
      p = e2;
    }));
    return r.addEventListener("abort", (() => {
      l.cancel(), d.cancel(), c.cancel(), h.forEach((([e2, t3]) => {
        e2.classList.toggle("md-menu-hidden", false), t3.cancel();
      })), p(true);
    })), l.addEventListener("finish", (() => {
      e.classList.toggle("animating", false), this.openCloseAnimationSignal.finish(), p(false);
    })), await u;
  }
  animateClose() {
    let e;
    const t2 = new Promise(((t3) => {
      e = t3;
    })), i = this.surfaceEl, r = this.slotEl;
    if (!i || !r) return e(false), t2;
    const s = "UP" === this.openDirection;
    this.dispatchEvent(new Event("closing")), i.classList.toggle("animating", true);
    const o = this.openCloseAnimationSignal.start(), a = i.offsetHeight, n2 = this.items, l = 150, d = 50 / n2.length, c = i.animate([{ height: `${a}px` }, { height: 0.35 * a + "px" }], { duration: l, easing: Rt$1.EMPHASIZED_ACCELERATE }), h = r.animate([{ transform: "" }, { transform: s ? `translateY(-${0.65 * a}px)` : "" }], { duration: l, easing: Rt$1.EMPHASIZED_ACCELERATE }), p = i.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 50, delay: 100 }), u = [];
    for (let e2 = 0; e2 < n2.length; e2++) {
      const t3 = n2[s ? e2 : n2.length - 1 - e2], i2 = t3.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 50, delay: 50 + d * e2 });
      i2.addEventListener("finish", (() => {
        t3.classList.toggle("md-menu-hidden", true);
      })), u.push([t3, i2]);
    }
    return o.addEventListener("abort", (() => {
      c.cancel(), h.cancel(), p.cancel(), u.forEach((([e2, t3]) => {
        t3.cancel(), e2.classList.toggle("md-menu-hidden", false);
      })), e(false);
    })), c.addEventListener("finish", (() => {
      i.classList.toggle("animating", false), u.forEach((([e2]) => {
        e2.classList.toggle("md-menu-hidden", false);
      })), this.openCloseAnimationSignal.finish(), this.dispatchEvent(new Event("closed")), e(true);
    })), t2;
  }
  handleKeydown(e) {
    this.pointerPath = [], this.listController.handleKeydown(e);
  }
  setUpGlobalEventListeners() {
    document.addEventListener("click", this.onDocumentClick, { capture: true }), window.addEventListener("pointerdown", this.onWindowPointerdown), document.addEventListener("resize", this.onWindowResize, { passive: true }), window.addEventListener("resize", this.onWindowResize, { passive: true });
  }
  cleanUpGlobalEventListeners() {
    document.removeEventListener("click", this.onDocumentClick, { capture: true }), window.removeEventListener("pointerdown", this.onWindowPointerdown), document.removeEventListener("resize", this.onWindowResize), window.removeEventListener("resize", this.onWindowResize);
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
    e.stopPropagation(), this.typeaheadActive = false;
  }
  handleActivateTypeahead(e) {
    e.stopPropagation(), this.typeaheadActive = true;
  }
  handleStayOpenOnFocusout(e) {
    e.stopPropagation(), this.stayOpenOnFocusout = true;
  }
  handleCloseOnFocusout(e) {
    e.stopPropagation(), this.stayOpenOnFocusout = false;
  }
  close() {
    this.open = false;
    this.slotItems.forEach(((e) => {
      var t2;
      null === (t2 = e.close) || void 0 === t2 || t2.call(e);
    }));
  }
  show() {
    this.open = true;
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
t([bt$1(".menu")], Ro.prototype, "surfaceEl", void 0), t([bt$1("slot")], Ro.prototype, "slotEl", void 0), t([mt$1()], Ro.prototype, "anchor", void 0), t([mt$1()], Ro.prototype, "positioning", void 0), t([mt$1({ type: Boolean })], Ro.prototype, "quick", void 0), t([mt$1({ type: Boolean, attribute: "has-overflow" })], Ro.prototype, "hasOverflow", void 0), t([mt$1({ type: Boolean, reflect: true })], Ro.prototype, "open", void 0), t([mt$1({ type: Number, attribute: "x-offset" })], Ro.prototype, "xOffset", void 0), t([mt$1({ type: Number, attribute: "y-offset" })], Ro.prototype, "yOffset", void 0), t([mt$1({ type: Boolean, attribute: "no-horizontal-flip" })], Ro.prototype, "noHorizontalFlip", void 0), t([mt$1({ type: Boolean, attribute: "no-vertical-flip" })], Ro.prototype, "noVerticalFlip", void 0), t([mt$1({ type: Number, attribute: "typeahead-delay" })], Ro.prototype, "typeaheadDelay", void 0), t([mt$1({ attribute: "anchor-corner" })], Ro.prototype, "anchorCorner", void 0), t([mt$1({ attribute: "menu-corner" })], Ro.prototype, "menuCorner", void 0), t([mt$1({ type: Boolean, attribute: "stay-open-on-outside-click" })], Ro.prototype, "stayOpenOnOutsideClick", void 0), t([mt$1({ type: Boolean, attribute: "stay-open-on-focusout" })], Ro.prototype, "stayOpenOnFocusout", void 0), t([mt$1({ type: Boolean, attribute: "skip-restore-focus" })], Ro.prototype, "skipRestoreFocus", void 0), t([mt$1({ attribute: "default-focus" })], Ro.prototype, "defaultFocus", void 0), t([mt$1({ type: Boolean, attribute: "no-navigation-wrap" })], Ro.prototype, "noNavigationWrap", void 0), t([yt$1({ flatten: true })], Ro.prototype, "slotItems", void 0), t([ft$1()], Ro.prototype, "typeaheadActive", void 0);
const Io = n`:host{--md-elevation-level: var(--md-menu-container-elevation, 2);--md-elevation-shadow-color: var(--md-menu-container-shadow-color, var(--md-sys-color-shadow, #000));min-width:112px;color:unset;display:contents}ewt-focus-ring{--md-focus-ring-shape: var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px))}.menu{border-radius:var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px));display:none;inset:auto;border:none;padding:0px;overflow:visible;background-color:rgba(0,0,0,0);color:inherit;opacity:0;z-index:20;position:absolute;user-select:none;max-height:inherit;height:inherit;min-width:inherit;max-width:inherit;scrollbar-width:inherit}.menu::backdrop{display:none}.fixed{position:fixed}.items{display:block;list-style-type:none;margin:0;outline:none;box-sizing:border-box;background-color:var(--md-menu-container-color, var(--md-sys-color-surface-container, #f3edf7));height:inherit;max-height:inherit;overflow:auto;min-width:inherit;max-width:inherit;border-radius:inherit;scrollbar-width:inherit}.item-padding{padding-block:var(--md-menu-top-space, 8px) var(--md-menu-bottom-space, 8px)}.has-overflow:not([popover]) .items{overflow:visible}.has-overflow.animating .items,.animating .items{overflow:hidden}.has-overflow.animating .items{pointer-events:none}.animating ::slotted(.md-menu-hidden){opacity:0}slot{display:block;height:inherit;max-height:inherit}::slotted(:is(ewt-divider,[role=separator])){margin:8px 0}@media(forced-colors: active){.menu{border-style:solid;border-color:CanvasText;border-width:1px}}
`;
let Co = class extends Ro {
};
Co.styles = [Io], Co = t([pt$1("ewt-menu")], Co);
class To extends fe {
  computeValidity(e) {
    return this.selectControl || (this.selectControl = document.createElement("select")), at$1(j$1`<option value=${e.value}></option>`, this.selectControl), this.selectControl.value = e.value, this.selectControl.required = e.required, { validity: this.selectControl.validity, validationMessage: this.selectControl.validationMessage };
  }
  equals(e, t2) {
    return e.value === t2.value && e.required === t2.required;
  }
  copy({ value: e, required: t2 }) {
    return { value: e, required: t2 };
  }
}
var Lo;
const Oo = /* @__PURE__ */ Symbol("value"), Do = Wt$1(js(ce(ue(Jt$1(ct$1)))));
class $o extends Do {
  get value() {
    return this[Oo];
  }
  set value(e) {
    this.lastUserSetValue = e, this.select(e);
  }
  get options() {
    var e;
    return (null === (e = this.menu) || void 0 === e ? void 0 : e.items) ?? [];
  }
  get selectedIndex() {
    const [e, t2] = (this.getSelectedOptions() ?? [])[0] ?? [];
    return t2 ?? -1;
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
    super(), this.quick = false, this.required = false, this.errorText = "", this.label = "", this.noAsterisk = false, this.supportingText = "", this.error = false, this.menuPositioning = "popover", this.clampMenuWidth = false, this.typeaheadDelay = 200, this.hasLeadingIcon = false, this.displayText = "", this.menuAlign = "start", this[Lo] = "", this.lastUserSetValue = null, this.lastUserSetSelectedIndex = null, this.lastSelectedOption = null, this.lastSelectedOptionRecords = [], this.nativeError = false, this.nativeErrorText = "", this.focused = false, this.open = false, this.defaultFocus = fo, this.prevOpen = this.open, this.selectWidth = 0, this.addEventListener("focus", this.handleFocus.bind(this)), this.addEventListener("blur", this.handleBlur.bind(this));
  }
  select(e) {
    const t2 = this.options.find(((t3) => t3.value === e));
    t2 && this.selectItem(t2);
  }
  selectIndex(e) {
    const t2 = this.options[e];
    t2 && this.selectItem(t2);
  }
  reset() {
    for (const e of this.options) e.selected = e.hasAttribute("selected");
    this.updateValueAndDisplayText(), this.nativeError = false, this.nativeErrorText = "";
  }
  showPicker() {
    this.open = true;
  }
  [(Lo = Oo, qs)](e) {
    null == e || e.preventDefault();
    const t2 = this.getErrorText();
    var i;
    (this.nativeError = !!e, this.nativeErrorText = this.validationMessage, t2 === this.getErrorText()) && (null === (i = this.field) || void 0 === i || i.reannounceError());
  }
  update(e) {
    if (this.hasUpdated || this.initUserSelection(), this.prevOpen !== this.open && this.open) {
      const e2 = this.getBoundingClientRect();
      this.selectWidth = e2.width;
    }
    this.prevOpen = this.open, super.update(e);
  }
  render() {
    return j$1`
      <span
        class="select ${Ot$1(this.getRenderClasses())}"
        @focusout=${this.handleFocusout}>
        ${this.renderField()} ${this.renderMenu()}
      </span>
    `;
  }
  async firstUpdated(e) {
    var t2;
    await (null === (t2 = this.menu) || void 0 === t2 ? void 0 : t2.updateComplete), this.lastSelectedOptionRecords.length || this.initUserSelection(), this.lastSelectedOptionRecords.length || this.options.length || setTimeout((() => {
      this.updateValueAndDisplayText();
    })), super.firstUpdated(e);
  }
  getRenderClasses() {
    return { disabled: this.disabled, error: this.error, open: this.open };
  }
  renderField() {
    const e = this.ariaLabel || this.label;
    return Q`
      <${this.fieldTag}
          aria-haspopup="listbox"
          role="combobox"
          part="field"
          id="field"
          tabindex=${this.disabled ? "-1" : "0"}
          aria-label=${e || W$1}
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
    return j$1`
      <span class="icon leading" slot="start">
        <slot name="leading-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderTrailingIcon() {
    return j$1`
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
    return j$1`<div id="label">${this.displayText || j$1`&nbsp;`}</div>`;
  }
  renderMenu() {
    const e = this.label || this.ariaLabel;
    return j$1`<div class="menu-wrapper">
      <ewt-menu
        id="listbox"
        .defaultFocus=${this.defaultFocus}
        role="listbox"
        tabindex="-1"
        aria-label=${e || W$1}
        stay-open-on-focusout
        part="menu"
        exportparts="focus-ring: menu-focus-ring"
        anchor="field"
        style=${Ns({ "--__menu-min-width": `${this.selectWidth}px`, "--__menu-max-width": this.clampMenuWidth ? `${this.selectWidth}px` : void 0 })}
        no-navigation-wrap
        .open=${this.open}
        .quick=${this.quick}
        .positioning=${this.menuPositioning}
        .typeaheadDelay=${this.typeaheadDelay}
        .anchorCorner=${"start" === this.menuAlign ? "end-start" : "end-end"}
        .menuCorner=${"start" === this.menuAlign ? "start-start" : "start-end"}
        @opening=${this.handleOpening}
        @opened=${this.redispatchEvent}
        @closing=${this.redispatchEvent}
        @closed=${this.handleClosed}
        @close-menu=${this.handleCloseMenu}
        @request-selection=${this.handleRequestSelection}
        @request-deselection=${this.handleRequestDeselection}>
        ${this.renderMenuContent()}
      </ewt-menu>
    </div>`;
  }
  renderMenuContent() {
    return j$1`<slot></slot>`;
  }
  handleKeydown(e) {
    if (this.open || this.disabled || !this.menu) return;
    const t2 = this.menu.typeaheadController, i = "Space" === e.code || "ArrowDown" === e.code || "ArrowUp" === e.code || "End" === e.code || "Home" === e.code || "Enter" === e.code;
    if (!t2.isTypingAhead && i) {
      switch (e.preventDefault(), this.open = true, e.code) {
        case "Space":
        case "ArrowDown":
        case "Enter":
          this.defaultFocus = fo;
          break;
        case "End":
          this.defaultFocus = go;
          break;
        case "ArrowUp":
        case "Home":
          this.defaultFocus = vo;
      }
      return;
    }
    if (1 === e.key.length) {
      var r, s;
      t2.onKeydown(e), e.preventDefault();
      const { lastActiveRecord: i2 } = t2;
      if (!i2) return;
      null === (r = this.labelEl) || void 0 === r || null === (s = r.setAttribute) || void 0 === s || s.call(r, "aria-live", "polite");
      this.selectItem(i2[wo]) && this.dispatchInteractionEvents();
    }
  }
  handleClick() {
    this.open = !this.open;
  }
  handleFocus() {
    this.focused = true;
  }
  handleBlur() {
    this.focused = false;
  }
  handleFocusout(e) {
    e.relatedTarget && uo(e.relatedTarget, this) || (this.open = false);
  }
  getSelectedOptions() {
    if (!this.menu) return this.lastSelectedOptionRecords = [], null;
    const e = this.menu.items;
    return this.lastSelectedOptionRecords = (function(e2) {
      const t2 = [];
      for (let i = 0; i < e2.length; i++) {
        const r = e2[i];
        r.selected && t2.push([r, i]);
      }
      return t2;
    })(e), this.lastSelectedOptionRecords;
  }
  async getUpdateComplete() {
    var e;
    return await (null === (e = this.menu) || void 0 === e ? void 0 : e.updateComplete), super.getUpdateComplete();
  }
  updateValueAndDisplayText() {
    const e = this.getSelectedOptions() ?? [];
    let t2 = false;
    if (e.length) {
      const [i] = e[0];
      t2 = this.lastSelectedOption !== i, this.lastSelectedOption = i, this[Oo] = i.value, this.displayText = i.displayText;
    } else t2 = null !== this.lastSelectedOption, this.lastSelectedOption = null, this[Oo] = "", this.displayText = "";
    return t2;
  }
  async handleOpening(e) {
    var t2, i, r;
    if (null === (t2 = this.labelEl) || void 0 === t2 || null === (i = t2.removeAttribute) || void 0 === i || i.call(t2, "aria-live"), this.redispatchEvent(e), this.defaultFocus !== fo) return;
    const s = this.menu.items, o = null === (r = D(s)) || void 0 === r ? void 0 : r.item;
    let [a] = this.lastSelectedOptionRecords[0] ?? [null];
    o && o !== a && (o.tabIndex = -1), a = a ?? s[0], a && (a.tabIndex = 0, a.focus());
  }
  redispatchEvent(e) {
    de$1(this, e);
  }
  handleClosed(e) {
    this.open = false, this.redispatchEvent(e);
  }
  handleCloseMenu(e) {
    const t2 = e.detail.reason, i = e.detail.itemPath[0];
    this.open = false;
    let r = false;
    var s;
    "click-selection" === t2.kind || "keydown" === t2.kind && (s = t2.key, Object.values(no).some(((e2) => e2 === s))) ? r = this.selectItem(i) : (i.tabIndex = -1, i.blur()), r && this.dispatchInteractionEvents();
  }
  selectItem(e) {
    return (this.getSelectedOptions() ?? []).forEach((([t2]) => {
      e !== t2 && (t2.selected = false);
    })), e.selected = true, this.updateValueAndDisplayText();
  }
  handleRequestSelection(e) {
    const t2 = e.target;
    this.lastSelectedOptionRecords.some((([e2]) => e2 === t2)) || this.selectItem(t2);
  }
  handleRequestDeselection(e) {
    const t2 = e.target;
    this.lastSelectedOptionRecords.some((([e2]) => e2 === t2)) && this.updateValueAndDisplayText();
  }
  initUserSelection() {
    this.lastUserSetValue && !this.lastSelectedOptionRecords.length ? this.select(this.lastUserSetValue) : null === this.lastUserSetSelectedIndex || this.lastSelectedOptionRecords.length ? this.updateValueAndDisplayText() : this.selectIndex(this.lastUserSetSelectedIndex);
  }
  handleIconChange() {
    this.hasLeadingIcon = this.leadingIcons.length > 0;
  }
  dispatchInteractionEvents() {
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true })), this.dispatchEvent(new Event("change", { bubbles: true }));
  }
  getErrorText() {
    return this.error ? this.errorText : this.nativeErrorText;
  }
  [he]() {
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
    null === (e = this.field) || void 0 === e || e.click();
  }
  [oe]() {
    return new To((() => this));
  }
  [ae]() {
    return this.field;
  }
}
$o.shadowRootOptions = { ...ct$1.shadowRootOptions, delegatesFocus: true }, t([mt$1({ type: Boolean })], $o.prototype, "quick", void 0), t([mt$1({ type: Boolean })], $o.prototype, "required", void 0), t([mt$1({ type: String, attribute: "error-text" })], $o.prototype, "errorText", void 0), t([mt$1()], $o.prototype, "label", void 0), t([mt$1({ type: Boolean, attribute: "no-asterisk" })], $o.prototype, "noAsterisk", void 0), t([mt$1({ type: String, attribute: "supporting-text" })], $o.prototype, "supportingText", void 0), t([mt$1({ type: Boolean, reflect: true })], $o.prototype, "error", void 0), t([mt$1({ attribute: "menu-positioning" })], $o.prototype, "menuPositioning", void 0), t([mt$1({ type: Boolean, attribute: "clamp-menu-width" })], $o.prototype, "clampMenuWidth", void 0), t([mt$1({ type: Number, attribute: "typeahead-delay" })], $o.prototype, "typeaheadDelay", void 0), t([mt$1({ type: Boolean, attribute: "has-leading-icon" })], $o.prototype, "hasLeadingIcon", void 0), t([mt$1({ attribute: "display-text" })], $o.prototype, "displayText", void 0), t([mt$1({ attribute: "menu-align" })], $o.prototype, "menuAlign", void 0), t([mt$1()], $o.prototype, "value", null), t([mt$1({ type: Number, attribute: "selected-index" })], $o.prototype, "selectedIndex", null), t([ft$1()], $o.prototype, "nativeError", void 0), t([ft$1()], $o.prototype, "nativeErrorText", void 0), t([ft$1()], $o.prototype, "focused", void 0), t([ft$1()], $o.prototype, "open", void 0), t([ft$1()], $o.prototype, "defaultFocus", void 0), t([bt$1(".field")], $o.prototype, "field", void 0), t([bt$1("ewt-menu")], $o.prototype, "menu", void 0), t([bt$1("#label")], $o.prototype, "labelEl", void 0), t([yt$1({ slot: "leading-icon", flatten: true })], $o.prototype, "leadingIcons", void 0);
class Mo extends $o {
  constructor() {
    super(...arguments), this.fieldTag = X`ewt-filled-field`;
  }
}
const Po = n`:host{--_text-field-active-indicator-color: var(--md-filled-select-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-active-indicator-height: var(--md-filled-select-text-field-active-indicator-height, 1px);--_text-field-container-color: var(--md-filled-select-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_text-field-disabled-active-indicator-color: var(--md-filled-select-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-active-indicator-height: var(--md-filled-select-text-field-disabled-active-indicator-height, 1px);--_text-field-disabled-active-indicator-opacity: var(--md-filled-select-text-field-disabled-active-indicator-opacity, 0.38);--_text-field-disabled-container-color: var(--md-filled-select-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-container-opacity: var(--md-filled-select-text-field-disabled-container-opacity, 0.04);--_text-field-disabled-input-text-color: var(--md-filled-select-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-input-text-opacity: var(--md-filled-select-text-field-disabled-input-text-opacity, 0.38);--_text-field-disabled-label-text-color: var(--md-filled-select-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-label-text-opacity: var(--md-filled-select-text-field-disabled-label-text-opacity, 0.38);--_text-field-disabled-leading-icon-color: var(--md-filled-select-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-leading-icon-opacity: var(--md-filled-select-text-field-disabled-leading-icon-opacity, 0.38);--_text-field-disabled-supporting-text-color: var(--md-filled-select-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-supporting-text-opacity: var(--md-filled-select-text-field-disabled-supporting-text-opacity, 0.38);--_text-field-disabled-trailing-icon-color: var(--md-filled-select-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-trailing-icon-opacity: var(--md-filled-select-text-field-disabled-trailing-icon-opacity, 0.38);--_text-field-error-active-indicator-color: var(--md-filled-select-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-active-indicator-color: var(--md-filled-select-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-input-text-color: var(--md-filled-select-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-focus-label-text-color: var(--md-filled-select-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-leading-icon-color: var(--md-filled-select-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-focus-supporting-text-color: var(--md-filled-select-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-trailing-icon-color: var(--md-filled-select-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-active-indicator-color: var(--md-filled-select-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-input-text-color: var(--md-filled-select-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-label-text-color: var(--md-filled-select-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-leading-icon-color: var(--md-filled-select-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-hover-state-layer-color: var(--md-filled-select-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-state-layer-opacity: var(--md-filled-select-text-field-error-hover-state-layer-opacity, 0.08);--_text-field-error-hover-supporting-text-color: var(--md-filled-select-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-trailing-icon-color: var(--md-filled-select-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-input-text-color: var(--md-filled-select-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-label-text-color: var(--md-filled-select-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-leading-icon-color: var(--md-filled-select-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-supporting-text-color: var(--md-filled-select-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-trailing-icon-color: var(--md-filled-select-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-focus-active-indicator-color: var(--md-filled-select-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-active-indicator-height: var(--md-filled-select-text-field-focus-active-indicator-height, 3px);--_text-field-focus-input-text-color: var(--md-filled-select-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-focus-label-text-color: var(--md-filled-select-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-leading-icon-color: var(--md-filled-select-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-supporting-text-color: var(--md-filled-select-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-trailing-icon-color: var(--md-filled-select-text-field-focus-trailing-icon-color, var(--md-sys-color-primary, #6750a4));--_text-field-hover-active-indicator-color: var(--md-filled-select-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-active-indicator-height: var(--md-filled-select-text-field-hover-active-indicator-height, 1px);--_text-field-hover-input-text-color: var(--md-filled-select-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-label-text-color: var(--md-filled-select-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-leading-icon-color: var(--md-filled-select-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-state-layer-color: var(--md-filled-select-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-state-layer-opacity: var(--md-filled-select-text-field-hover-state-layer-opacity, 0.08);--_text-field-hover-supporting-text-color: var(--md-filled-select-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-trailing-icon-color: var(--md-filled-select-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-input-text-color: var(--md-filled-select-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-input-text-font: var(--md-filled-select-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-input-text-line-height: var(--md-filled-select-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-input-text-size: var(--md-filled-select-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-input-text-weight: var(--md-filled-select-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-label-text-color: var(--md-filled-select-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-label-text-font: var(--md-filled-select-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-label-text-line-height: var(--md-filled-select-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-label-text-populated-line-height: var(--md-filled-select-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-label-text-populated-size: var(--md-filled-select-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-label-text-size: var(--md-filled-select-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-label-text-weight: var(--md-filled-select-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-leading-icon-color: var(--md-filled-select-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-leading-icon-size: var(--md-filled-select-text-field-leading-icon-size, 24px);--_text-field-supporting-text-color: var(--md-filled-select-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-supporting-text-font: var(--md-filled-select-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-supporting-text-line-height: var(--md-filled-select-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-supporting-text-size: var(--md-filled-select-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-supporting-text-weight: var(--md-filled-select-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-trailing-icon-color: var(--md-filled-select-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-trailing-icon-size: var(--md-filled-select-text-field-trailing-icon-size, 24px);--_text-field-container-shape-start-start: var(--md-filled-select-text-field-container-shape-start-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-start-end: var(--md-filled-select-text-field-container-shape-start-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-end: var(--md-filled-select-text-field-container-shape-end-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_text-field-container-shape-end-start: var(--md-filled-select-text-field-container-shape-end-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--md-filled-field-active-indicator-color: var(--_text-field-active-indicator-color);--md-filled-field-active-indicator-height: var(--_text-field-active-indicator-height);--md-filled-field-container-color: var(--_text-field-container-color);--md-filled-field-container-shape-end-end: var(--_text-field-container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_text-field-container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_text-field-container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_text-field-container-shape-start-start);--md-filled-field-content-color: var(--_text-field-input-text-color);--md-filled-field-content-font: var(--_text-field-input-text-font);--md-filled-field-content-line-height: var(--_text-field-input-text-line-height);--md-filled-field-content-size: var(--_text-field-input-text-size);--md-filled-field-content-weight: var(--_text-field-input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_text-field-disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_text-field-disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_text-field-disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_text-field-disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_text-field-disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_text-field-disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_text-field-disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_text-field-disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_text-field-disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_text-field-disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_text-field-disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_text-field-disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_text-field-disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_text-field-disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_text-field-disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_text-field-error-active-indicator-color);--md-filled-field-error-content-color: var(--_text-field-error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_text-field-error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_text-field-error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_text-field-error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_text-field-error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_text-field-error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_text-field-error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_text-field-error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_text-field-error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_text-field-error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_text-field-error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_text-field-error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_text-field-error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_text-field-error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_text-field-error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_text-field-error-label-text-color);--md-filled-field-error-leading-content-color: var(--_text-field-error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_text-field-error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_text-field-error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_text-field-focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_text-field-focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_text-field-focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_text-field-focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_text-field-focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_text-field-focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_text-field-focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_text-field-hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_text-field-hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_text-field-hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_text-field-hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_text-field-hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_text-field-hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_text-field-hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_text-field-hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_text-field-hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_text-field-label-text-color);--md-filled-field-label-text-font: var(--_text-field-label-text-font);--md-filled-field-label-text-line-height: var(--_text-field-label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_text-field-label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_text-field-label-text-populated-size);--md-filled-field-label-text-size: var(--_text-field-label-text-size);--md-filled-field-label-text-weight: var(--_text-field-label-text-weight);--md-filled-field-leading-content-color: var(--_text-field-leading-icon-color);--md-filled-field-supporting-text-color: var(--_text-field-supporting-text-color);--md-filled-field-supporting-text-font: var(--_text-field-supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_text-field-supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_text-field-supporting-text-size);--md-filled-field-supporting-text-weight: var(--_text-field-supporting-text-weight);--md-filled-field-trailing-content-color: var(--_text-field-trailing-icon-color)}[has-start] .icon.leading{font-size:var(--_text-field-leading-icon-size);height:var(--_text-field-leading-icon-size);width:var(--_text-field-leading-icon-size)}.icon.trailing{font-size:var(--_text-field-trailing-icon-size);height:var(--_text-field-trailing-icon-size);width:var(--_text-field-trailing-icon-size)}
`, Fo = n`:host{color:unset;min-width:210px;display:flex}.field{cursor:default;outline:none}.select{position:relative;flex-direction:column}.icon.trailing svg,.icon ::slotted(*){fill:currentColor}.icon ::slotted(*){width:inherit;height:inherit;font-size:inherit}.icon slot{display:flex;height:100%;width:100%;align-items:center;justify-content:center}.icon.trailing :is(.up,.down){opacity:0;transition:opacity 75ms linear 75ms}.select:not(.open) .down,.select.open .up{opacity:1}.field,.select,ewt-menu{min-width:inherit;width:inherit;max-width:inherit;display:flex}ewt-menu{min-width:var(--__menu-min-width);max-width:var(--__menu-max-width, inherit)}.menu-wrapper{width:0px;height:0px;max-width:inherit}ewt-menu ::slotted(:not[disabled]){cursor:pointer}.field,.select{width:100%}:host{display:inline-flex}:host([disabled]){pointer-events:none}
`;
class zo extends Mo {
}
zo.styles = [Fo, Po], customElements.define("ew-filled-select", zo);
const Bo = n`:host{display:flex;--md-ripple-hover-color: var(--md-menu-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-menu-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-menu-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-menu-item-pressed-state-layer-opacity, 0.12)}:host([disabled]){opacity:var(--md-menu-item-disabled-opacity, 0.3);pointer-events:none}ewt-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}.list-item:not(.disabled){cursor:pointer}[slot=container]{pointer-events:none}ewt-ripple{border-radius:inherit}ewt-item{border-radius:inherit;flex:1;color:var(--md-menu-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-menu-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-menu-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-menu-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-menu-item-one-line-container-height, 56px);padding-top:var(--md-menu-item-top-space, 12px);padding-bottom:var(--md-menu-item-bottom-space, 12px);padding-inline-start:var(--md-menu-item-leading-space, 16px);padding-inline-end:var(--md-menu-item-trailing-space, 16px)}ewt-item[multiline]{min-height:var(--md-menu-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-menu-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-menu-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-menu-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-menu-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-menu-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-menu-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-menu-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-menu-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}.list-item{background-color:var(--md-menu-item-container-color, transparent)}.list-item.selected{background-color:var(--md-menu-item-selected-container-color, var(--md-sys-color-secondary-container, #e8def8))}.selected:not(.disabled) ::slotted(*){color:var(--md-menu-item-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b))}@media(forced-colors: active){:host([disabled]),:host([disabled]) slot{color:GrayText;opacity:1}.list-item{position:relative}.list-item.selected::before{content:"";position:absolute;inset:0;box-sizing:border-box;border-radius:inherit;pointer-events:none;border:3px double CanvasText}}
`;
class Uo {
  constructor(e, t2) {
    this.host = e, this.internalTypeaheadText = null, this.onClick = () => {
      this.host.keepOpen || this.host.dispatchEvent(ao(this.host, { kind: lo }));
    }, this.onKeydown = (e2) => {
      if (this.host.href && "Enter" === e2.code) {
        const e3 = this.getInteractiveElement();
        e3 instanceof HTMLAnchorElement && e3.click();
      }
      if (e2.defaultPrevented) return;
      const t3 = e2.code;
      this.host.keepOpen && "Escape" !== t3 || po(t3) && (e2.preventDefault(), this.host.dispatchEvent(ao(this.host, { kind: co, key: t3 })));
    }, this.getHeadlineElements = t2.getHeadlineElements, this.getSupportingTextElements = t2.getSupportingTextElements, this.getDefaultElements = t2.getDefaultElements, this.getInteractiveElement = t2.getInteractiveElement, this.host.addController(this);
  }
  get typeaheadText() {
    if (null !== this.internalTypeaheadText) return this.internalTypeaheadText;
    const e = this.getHeadlineElements(), t2 = [];
    return e.forEach(((e2) => {
      e2.textContent && e2.textContent.trim() && t2.push(e2.textContent.trim());
    })), 0 === t2.length && this.getDefaultElements().forEach(((e2) => {
      e2.textContent && e2.textContent.trim() && t2.push(e2.textContent.trim());
    })), 0 === t2.length && this.getSupportingTextElements().forEach(((e2) => {
      e2.textContent && e2.textContent.trim() && t2.push(e2.textContent.trim());
    })), t2.join(" ");
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
    return "option" === this.host.type ? "option" : "menuitem";
  }
  hostConnected() {
    this.host.toggleAttribute("md-menu-item", true);
  }
  hostUpdate() {
    this.host.href && (this.host.type = "link");
  }
  setTypeaheadText(e) {
    this.internalTypeaheadText = e;
  }
}
class No {
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
    return null !== this.internalDisplayText ? this.internalDisplayText : this.menuItemController.typeaheadText;
  }
  setDisplayText(e) {
    this.internalDisplayText = e;
  }
  constructor(e, t2) {
    this.host = e, this.internalDisplayText = null, this.firstUpdate = true, this.onClick = () => {
      this.menuItemController.onClick();
    }, this.onKeydown = (e2) => {
      this.menuItemController.onKeydown(e2);
    }, this.lastSelected = this.host.selected, this.menuItemController = new Uo(e, t2), e.addController(this);
  }
  hostUpdate() {
    this.lastSelected !== this.host.selected && (this.host.ariaSelected = this.host.selected ? "true" : "false");
  }
  hostUpdated() {
    this.lastSelected === this.host.selected || this.firstUpdate || (this.host.selected ? this.host.dispatchEvent(new Event("request-selection", { bubbles: true, composed: true })) : this.host.dispatchEvent(new Event("request-deselection", { bubbles: true, composed: true }))), this.lastSelected = this.host.selected, this.firstUpdate = false;
  }
}
const Ho = Wt$1(ct$1);
class qo extends Ho {
  constructor() {
    super(...arguments), this.disabled = false, this.isMenuItem = true, this.selected = false, this.value = "", this.type = "option", this.selectOptionController = new No(this, { getHeadlineElements: () => this.headlineElements, getSupportingTextElements: () => this.supportingTextElements, getDefaultElements: () => this.defaultElements, getInteractiveElement: () => this.listItemRoot });
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
    return this.renderListItem(j$1`
      <ewt-item>
        <div slot="container">
          ${this.renderRipple()} ${this.renderFocusRing()}
        </div>
        <slot name="start" slot="start"></slot>
        <slot name="end" slot="end"></slot>
        ${this.renderBody()}
      </ewt-item>
    `);
  }
  renderListItem(e) {
    return j$1`
      <li
        id="item"
        tabindex=${this.disabled ? -1 : 0}
        role=${this.selectOptionController.role}
        aria-label=${this.ariaLabel || W$1}
        aria-selected=${this.ariaSelected || W$1}
        aria-checked=${this.ariaChecked || W$1}
        aria-expanded=${this.ariaExpanded || W$1}
        aria-haspopup=${this.ariaHasPopup || W$1}
        class="list-item ${Ot$1(this.getRenderClasses())}"
        @click=${this.selectOptionController.onClick}
        @keydown=${this.selectOptionController.onKeydown}
        >${e}</li
      >
    `;
  }
  renderRipple() {
    return j$1` <ewt-ripple
      part="ripple"
      for="item"
      ?disabled=${this.disabled}></ewt-ripple>`;
  }
  renderFocusRing() {
    return j$1` <ewt-focus-ring
      part="focus-ring"
      for="item"
      inward></ewt-focus-ring>`;
  }
  getRenderClasses() {
    return { disabled: this.disabled, selected: this.selected };
  }
  renderBody() {
    return j$1`
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
    null === (e = this.listItemRoot) || void 0 === e || e.focus();
  }
}
qo.shadowRootOptions = { ...ct$1.shadowRootOptions, delegatesFocus: true }, t([mt$1({ type: Boolean, reflect: true })], qo.prototype, "disabled", void 0), t([mt$1({ type: Boolean, attribute: "md-menu-item", reflect: true })], qo.prototype, "isMenuItem", void 0), t([mt$1({ type: Boolean })], qo.prototype, "selected", void 0), t([mt$1()], qo.prototype, "value", void 0), t([bt$1(".list-item")], qo.prototype, "listItemRoot", void 0), t([yt$1({ slot: "headline" })], qo.prototype, "headlineElements", void 0), t([yt$1({ slot: "supporting-text" })], qo.prototype, "supportingTextElements", void 0), t([/* @__PURE__ */ (function(t2) {
  return (i, r) => {
    const { slot: s } = t2 ?? {}, o = "slot" + (s ? `[name=${s}]` : ":not([name])");
    return gt$1(i, r, { get() {
      var e;
      const i2 = null === (e = this.renderRoot) || void 0 === e ? void 0 : e.querySelector(o);
      return (null == i2 ? void 0 : i2.assignedNodes(t2)) ?? [];
    } });
  };
})({ slot: "" })], qo.prototype, "defaultElements", void 0), t([mt$1({ attribute: "typeahead-text" })], qo.prototype, "typeaheadText", null), t([mt$1({ attribute: "display-text" })], qo.prototype, "displayText", null);
class Go extends qo {
}
Go.styles = [Bo], customElements.define("ew-select-option", Go);
const Wo = Wt$1(ct$1);
class Zo extends Wo {
  constructor() {
    super(...arguments), this.value = 0, this.max = 1, this.indeterminate = false, this.fourColor = false;
  }
  render() {
    const { ariaLabel: e } = this;
    return j$1`
      <div
        class="progress ${Ot$1(this.getRenderClasses())}"
        role="progressbar"
        aria-label="${e || W$1}"
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${this.indeterminate ? W$1 : this.value}
        >${this.renderIndicator()}</div
      >
    `;
  }
  getRenderClasses() {
    return { indeterminate: this.indeterminate, "four-color": this.fourColor };
  }
}
t([mt$1({ type: Number })], Zo.prototype, "value", void 0), t([mt$1({ type: Number })], Zo.prototype, "max", void 0), t([mt$1({ type: Boolean })], Zo.prototype, "indeterminate", void 0), t([mt$1({ type: Boolean, attribute: "four-color" })], Zo.prototype, "fourColor", void 0);
class Vo extends Zo {
  renderIndicator() {
    return this.indeterminate ? this.renderIndeterminateContainer() : this.renderDeterminateContainer();
  }
  renderDeterminateContainer() {
    const e = 100 * (1 - this.value / this.max);
    return j$1`
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
    return j$1` <div class="spinner">
      <div class="left">
        <div class="circle"></div>
      </div>
      <div class="right">
        <div class="circle"></div>
      </div>
    </div>`;
  }
}
const jo = n`:host{--_active-indicator-color: var(--md-circular-progress-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-width: var(--md-circular-progress-active-indicator-width, 10);--_four-color-active-indicator-four-color: var(--md-circular-progress-four-color-active-indicator-four-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_four-color-active-indicator-one-color: var(--md-circular-progress-four-color-active-indicator-one-color, var(--md-sys-color-primary, #6750a4));--_four-color-active-indicator-three-color: var(--md-circular-progress-four-color-active-indicator-three-color, var(--md-sys-color-tertiary, #7d5260));--_four-color-active-indicator-two-color: var(--md-circular-progress-four-color-active-indicator-two-color, var(--md-sys-color-primary-container, #eaddff));--_size: var(--md-circular-progress-size, 48px);display:inline-flex;vertical-align:middle;width:var(--_size);height:var(--_size);position:relative;align-items:center;justify-content:center;contain:strict;content-visibility:auto}.progress{flex:1;align-self:stretch;margin:4px}.progress,.spinner,.left,.right,.circle,svg,.track,.active-track{position:absolute;inset:0}svg{transform:rotate(-90deg)}circle{cx:50%;cy:50%;r:calc(50%*(1 - var(--_active-indicator-width)/100));stroke-width:calc(var(--_active-indicator-width)*1%);stroke-dasharray:100;fill:rgba(0,0,0,0)}.active-track{transition:stroke-dashoffset 500ms cubic-bezier(0, 0, 0.2, 1);stroke:var(--_active-indicator-color)}.track{stroke:rgba(0,0,0,0)}.progress.indeterminate{animation:linear infinite linear-rotate;animation-duration:1568.2352941176ms}.spinner{animation:infinite both rotate-arc;animation-duration:5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.left{overflow:hidden;inset:0 50% 0 0}.right{overflow:hidden;inset:0 0 0 50%}.circle{box-sizing:border-box;border-radius:50%;border:solid calc(var(--_active-indicator-width)/100*(var(--_size) - 8px));border-color:var(--_active-indicator-color) var(--_active-indicator-color) rgba(0,0,0,0) rgba(0,0,0,0);animation:expand-arc;animation-iteration-count:infinite;animation-fill-mode:both;animation-duration:1333ms,5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.four-color .circle{animation-name:expand-arc,four-color}.left .circle{rotate:135deg;inset:0 -100% 0 0}.right .circle{rotate:100deg;inset:0 0 0 -100%;animation-delay:-666.5ms,0ms}@media(forced-colors: active){.active-track{stroke:CanvasText}.circle{border-color:CanvasText CanvasText Canvas Canvas}}@keyframes expand-arc{0%{transform:rotate(265deg)}50%{transform:rotate(130deg)}100%{transform:rotate(265deg)}}@keyframes rotate-arc{12.5%{transform:rotate(135deg)}25%{transform:rotate(270deg)}37.5%{transform:rotate(405deg)}50%{transform:rotate(540deg)}62.5%{transform:rotate(675deg)}75%{transform:rotate(810deg)}87.5%{transform:rotate(945deg)}100%{transform:rotate(1080deg)}}@keyframes linear-rotate{to{transform:rotate(360deg)}}@keyframes four-color{0%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}15%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}25%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}40%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}50%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}65%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}75%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}90%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}100%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}}
`;
class Ko extends Vo {
}
Ko.styles = [jo], customElements.define("ew-circular-progress", Ko);
class Yo extends ct$1 {
  render() {
    return j$1`
      <div>
        <ew-circular-progress
          active
          ?indeterminate=${void 0 === this.progress}
          .value=${void 0 !== this.progress ? this.progress / 100 : void 0}
        ></ew-circular-progress>
        ${void 0 !== this.progress ? j$1`<div>${this.progress}%</div>` : ""}
      </div>
      ${this.label}
    `;
  }
}
Yo.styles = n`
    :host {
      display: flex;
      flex-direction: column;
      text-align: center;
    }
    ew-circular-progress {
      margin-bottom: 16px;
    }
  `, t([mt$1()], Yo.prototype, "label", void 0), t([mt$1()], Yo.prototype, "progress", void 0), customElements.define("ewt-page-progress", Yo);
class Xo extends ct$1 {
  render() {
    return j$1`
      <div class="icon">${this.icon}</div>
      ${this.label}
    `;
  }
}
Xo.styles = n`
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
  `, t([mt$1()], Xo.prototype, "icon", void 0), t([mt$1()], Xo.prototype, "label", void 0), customElements.define("ewt-page-message", Xo);
const Jo = V$1`
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
    />
  </svg>
`, Qo = V$1`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q95-97 219.5-148.5T480-800q137 0 261 51t219 149L480-120ZM174-540q67-48 145-74t161-26q83 0 161 26t145 74l58-58q-79-60-172-91t-192-31q-99 0-192 31t-172 91l58 58Z"
    />
  </svg>
`, ea = V$1`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM232-482q53-38 116-59.5T480-563q69 0 132 21.5T728-482l116-116q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l116 116Z"
    />
  </svg>
`, ta = V$1`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM299-415q38-28 84-43.5t97-15.5q51 0 97 15.5t84 43.5l183-183q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l183 183Z"
    />
  </svg>
`, ia = V$1`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM361-353q25-18 55.5-28t63.5-10q33 0 63.5 10t55.5 28l245-245q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l245 245Z"
    />
  </svg>
`, ra = V$1`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"
    />
  </svg>
`, sa = V$1`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M240-160h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM240-160v-400 400Zm0 80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h280v-80q0-83 58.5-141.5T720-920q83 0 141.5 58.5T920-720h-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80h120q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Z"
    />
  </svg>
`, oa = V$1`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
  </svg>
`, aa = V$1`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z" />
  </svg>
`, na = V$1`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M20,19V7H4V19H20M20,3A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5C2,3.89 2.9,3 4,3H20M13,17V15H18V17H13M9.58,13L5.57,9H8.4L11.7,12.3C12.09,12.69 12.09,13.33 11.7,13.72L8.42,17H5.59L9.58,13Z" />
  </svg>
`, la = V$1`
  <svg slot="start" viewBox="0 0 24 24">
  <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
  </svg>
`, da = V$1`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="m12.151 1.5882c-.3262 0-.6523.1291-.8996.3867l-8.3848 8.7354c-.0619.0644-.1223.1368-.1807.2154-.0588.0789-.1151.1638-.1688.2534-.2593.4325-.4552.9749-.5232 1.4555-.0026.018-.0076.0369-.0094.0548-.0121.0987-.0184.1944-.0184.2857v8.0124a1.2731 1.2731 0 001.2731 1.2731h7.8313l-3.4484-3.593a1.7399 1.7399 0 111.0803-1.125l2.6847 2.7972v-10.248a1.7399 1.7399 0 111.5276-0v7.187l2.6702-2.782a1.7399 1.7399 0 111.0566 1.1505l-3.7269 3.8831v2.7299h8.174a1.2471 1.2471 0 001.2471-1.2471v-8.0375c0-.0912-.0059-.1868-.0184-.2855-.0603-.4935-.2636-1.0617-.5326-1.5105-.0537-.0896-.1101-.1745-.1684-.253-.0588-.079-.1191-.1513-.181-.2158l-8.3848-8.7363c-.2473-.2577-.5735-.3866-.8995-.3864" />
  </svg>
`, ca = V$1`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M15,14C17.67,14 23,15.33 23,18V20H7V18C7,15.33 12.33,14 15,14M15,12A4,4 0 0,1 11,8A4,4 0 0,1 15,4A4,4 0 0,1 19,8A4,4 0 0,1 15,12M5,9.59L7.12,7.46L8.54,8.88L6.41,11L8.54,13.12L7.12,14.54L5,12.41L2.88,14.54L1.46,13.12L3.59,11L1.46,8.88L2.88,7.46L5,9.59Z" />
  </svg>
`, ha = V$1`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
  </svg>
`, pa = ["I".charCodeAt(0), "M".charCodeAt(0), "P".charCodeAt(0), "R".charCodeAt(0), "O".charCodeAt(0), "V".charCodeAt(0), 1];
var ua, fa;
!(function(e) {
  e[e.CURRENT_STATE = 1] = "CURRENT_STATE", e[e.ERROR_STATE = 2] = "ERROR_STATE", e[e.RPC = 3] = "RPC", e[e.RPC_RESULT = 4] = "RPC_RESULT";
})(ua || (ua = {})), (function(e) {
  e[e.STOPPED = 0] = "STOPPED", e[e.READY = 2] = "READY", e[e.PROVISIONING = 3] = "PROVISIONING", e[e.PROVISIONED = 4] = "PROVISIONED";
})(fa || (fa = {}));
const ma = { 0: "NO_ERROR", 1: "INVALID_RPC_PACKET", 2: "UNKNOWN_RPC_COMMAND", 3: "UNABLE_TO_CONNECT", 5: "BAD_HOSTNAME", 254: "TIMEOUT", 255: "UNKNOWN_ERROR" };
class va extends Error {
  constructor() {
    super("Port is not ready");
  }
}
const ga = (e) => "[" + e.map(((e2) => ((e3, t2 = 2) => {
  let i = e3.toString(16).toUpperCase();
  return i.startsWith("-") ? "-0x" + i.substring(1).padStart(t2, "0") : "0x" + i.padStart(t2, "0");
})(e2))).join(", ") + "]", _a = (e) => e.sort(((e2, t2) => e2.name.toLocaleLowerCase().localeCompare(t2.name.toLocaleLowerCase()))), ba = (e, t2) => {
  const i = /* @__PURE__ */ new Map();
  for (const t3 of e) i.set(t3.name, t3);
  for (const e2 of t2) i.set(e2.name, e2);
  return _a(Array.from(i.values()));
}, ya = (e, t2) => e.length !== t2.length || e.some(((e2, i) => e2.name !== t2[i].name || e2.rssi !== t2[i].rssi || e2.secured !== t2[i].secured));
class xa extends EventTarget {
  get error() {
    return this._error;
  }
  set error(e) {
    this._error = e, this.dispatchEvent(new CustomEvent("error-changed", { detail: this._error }));
  }
  constructor(e, t2) {
    if (super(), this.port = e, this.logger = t2, this._error = 0, this._rpcLock = Promise.resolve(), null === e.readable) throw new Error("Port is not readable");
    if (null === e.writable) throw new Error("Port is not writable");
  }
  async initialize(e = 1e3) {
    if (this.logger.log("Initializing Improv Serial"), this._processInput(), void 0 === this._reader) throw new va();
    let t2;
    try {
      await new Promise((async (i, r) => {
        setTimeout((() => r(new Error("Improv Wi-Fi Serial not detected"))), e), t2 = setInterval((() => this._sendRPC(2, [])), 1e3), await this.requestCurrentState(), i(void 0);
      })), clearInterval(t2), await this.requestInfo();
    } catch (e2) {
      throw await this.close(), e2;
    } finally {
      clearInterval(t2);
    }
    return this.info;
  }
  async close() {
    this._reader && await new Promise(((e) => {
      this._reader.cancel(), this.addEventListener("disconnect", e, { once: true });
    }));
  }
  async requestCurrentState() {
    var e;
    const t2 = new AbortController();
    let i;
    try {
      await new Promise(((e2, r) => {
        this.addEventListener("state-changed", (() => e2()), { once: true, signal: t2.signal }), i = this._sendRPCWithResponse(2, []), i.catch(r);
      }));
    } catch (e2) {
      throw new Error(`Error fetching current state: ${e2}`);
    } finally {
      t2.abort();
    }
    this.state === fa.PROVISIONED ? this.nextUrl = (await i)[0] : null === (e = this._rpcFeedback) || void 0 === e || e.resolve([]);
  }
  async requestInfo(e) {
    const t2 = await this._sendRPCWithResponse(3, [], e);
    this.info = { firmware: t2[0], version: t2[1], name: t2[3], chipFamily: t2[2], osName: t2.length > 4 ? t2[4] : null, osVersion: t2.length > 5 ? t2[5] : null };
  }
  async provision(e, t2, i) {
    const r = new TextEncoder(), s = r.encode(e), o = r.encode(t2), a = [s.length, ...s, o.length, ...o], n2 = await this._sendRPCWithResponse(1, a, i);
    this.nextUrl = n2[0];
  }
  async scan(e) {
    const t2 = (await this._sendRPCWithMultipleResponses(4, [], e)).map((([e2, t3, i]) => ({ name: e2, rssi: parseInt(t3), secured: "NO" !== i })));
    return _a(t2);
  }
  subscribeSSIDs(e) {
    let t2, i, r = true;
    const s = (async () => {
      for (; r; ) {
        let s2;
        try {
          s2 = await this.scan(3e4);
        } catch (i2) {
          this.logger.error("Error while scanning for Wi-Fi networks", i2), r && void 0 === t2 && e(null);
          break;
        }
        if (!r) break;
        const o = void 0 === t2 ? s2 : ba(t2, s2);
        (void 0 === t2 || ya(t2, o)) && (t2 = o, e(o)), await new Promise(((e2) => {
          i = e2, setTimeout(e2, 3e3);
        }));
      }
    })();
    return () => (r = false, null == i || i(), s);
  }
  async getHostname(e) {
    return (await this._sendRPCWithResponse(5, [], e))[0];
  }
  async setHostname(e, t2) {
    const i = new TextEncoder();
    return (await this._sendRPCWithResponse(5, [...i.encode(e)], t2))[0];
  }
  async getDeviceName(e) {
    return (await this._sendRPCWithResponse(6, [], e))[0];
  }
  async setDeviceName(e, t2) {
    const i = new TextEncoder(), r = await this._sendRPCWithResponse(6, [...i.encode(e)], t2);
    return this.info && (this.info.name = r[0]), r[0];
  }
  async requestNetworkState(e) {
    const t2 = await this._sendRPCWithResponse(7, [], e), i = parseInt(t2[0]);
    return { online: 0 != (1 & i), supportsWifi: 0 != (2 & i), supportsEthernet: 0 != (4 & i), supportsThread: 0 != (8 & i), supportsModem: 0 != (16 & i), urls: t2.slice(1) };
  }
  _sendRPC(e, t2) {
    this.writePacketToStream(ua.RPC, [e, t2.length, ...t2]);
  }
  _enqueueRPC(e, t2) {
    const i = () => this._awaitRPCResultWithTimeout(e(), t2).finally((() => {
      this._rpcFeedback = void 0;
    })), r = this._rpcLock.then(i, i);
    return this._rpcLock = r.catch((() => {
    })), r;
  }
  _sendRPCWithResponse(e, t2, i = 3e4) {
    return this._enqueueRPC((() => new Promise(((i2, r) => {
      this._rpcFeedback = { command: e, resolve: i2, reject: r }, this._sendRPC(e, t2);
    }))), i);
  }
  _sendRPCWithMultipleResponses(e, t2, i = 3e4) {
    return this._enqueueRPC((() => new Promise(((i2, r) => {
      this._rpcFeedback = { command: e, resolve: i2, reject: r, receivedData: [] }, this._sendRPC(e, t2);
    }))), i);
  }
  async _awaitRPCResultWithTimeout(e, t2) {
    if (!t2) return await e;
    const i = setTimeout((() => this._setError(254)), t2);
    try {
      return await e;
    } finally {
      clearTimeout(i);
    }
  }
  async _processInput() {
    this.logger.debug("Starting read loop"), this._reader = this.port.readable.getReader();
    try {
      let e, t2 = [], i = 0;
      for (; ; ) {
        const { value: r, done: s } = await this._reader.read();
        if (s) break;
        if (r && 0 !== r.length) for (const s2 of r) {
          if (false === e) {
            10 === s2 && (e = void 0);
            continue;
          }
          if (true === e) {
            t2.push(s2), t2.length === i && (this._handleIncomingPacket(t2), e = void 0, t2 = []);
            continue;
          }
          if (10 === s2) {
            t2 = [];
            continue;
          }
          if (t2.push(s2), 9 !== t2.length) continue;
          if (e = "IMPROV" === String.fromCharCode(...t2.slice(0, 6)), !e) {
            t2 = [];
            continue;
          }
          i = 9 + t2[8] + 1;
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
    const t2 = e.slice(6), i = t2[0], r = t2[1], s = t2[2], o = t2.slice(3, 3 + s);
    if (this.logger.debug("PROCESS", { version: i, packetType: r, packetLength: s, data: ga(o) }), 1 !== i) return void this.logger.error("Received unsupported version", i);
    let a = t2[3 + s], n2 = 0;
    for (let t3 = 0; t3 < e.length - 1; t3++) n2 += e[t3];
    if (n2 &= 255, n2 === a) if (r === ua.CURRENT_STATE) this.state = o[0], this.dispatchEvent(new CustomEvent("state-changed", { detail: this.state }));
    else if (r === ua.ERROR_STATE) this._setError(o[0]);
    else if (r === ua.RPC_RESULT) {
      if (!this._rpcFeedback) return void this.logger.error("Received result while not waiting for one");
      const e2 = o[0];
      if (e2 !== this._rpcFeedback.command) return void this.logger.error(`Received result for command ${e2} but expected ${this._rpcFeedback.command}`);
      const t3 = [], i2 = o[1], r2 = new TextDecoder("utf-8");
      let s2 = 2;
      for (; s2 < 2 + i2; ) t3.push(r2.decode(new Uint8Array(o.slice(s2 + 1, s2 + o[s2] + 1)))), s2 += o[s2] + 1;
      "receivedData" in this._rpcFeedback ? t3.length > 0 ? this._rpcFeedback.receivedData.push(t3) : this._rpcFeedback.resolve(this._rpcFeedback.receivedData) : this._rpcFeedback.resolve(t3);
    } else this.logger.error("Unable to handle packet", t2);
    else this.logger.error(`Received invalid checksum ${a}. Expected ${n2}`);
  }
  async writePacketToStream(e, t2) {
    const i = new Uint8Array([...pa, e, t2.length, ...t2, 0, 0]);
    i[i.length - 2] = 255 & i.reduce(((e2, t3) => e2 + t3), 0), i[i.length - 1] = 10, this.logger.debug("Writing to stream:", ga(new Array(...i)));
    const r = this.port.writable.getWriter();
    await r.write(i);
    try {
      r.releaseLock();
    } catch (e2) {
      console.error("Ignoring release lock error", e2);
    }
  }
  _setError(e) {
    e > 0 && this._rpcFeedback && this._rpcFeedback.reject(ma[e] || `UNKNOWN_ERROR (${e})`), this.error = e;
  }
}
const wa = async (e, t2) => {
  await e.setRTS(true), await xe(100), await t2.after();
}, Ea = (e, t2 = "") => {
  const i = new Blob([e], { type: "text/plain" }), r = URL.createObjectURL(i);
  ((e2, t3 = "") => {
    const i2 = document.createElement("a");
    i2.target = "_blank", i2.href = e2, i2.download = t3, document.body.appendChild(i2), i2.dispatchEvent(new MouseEvent("click")), document.body.removeChild(i2);
  })(r, t2), setTimeout((() => URL.revokeObjectURL(r)), 0);
};
console.log("ESP Web Tools 10.4.0 by Open Home Foundation; https://esphome.github.io/esp-web-tools/");
const Sa = "⚠️";
class ka extends ct$1 {
  constructor() {
    super(...arguments), this.logger = console, this._state = "DASHBOARD", this._installErase = false, this._installConfirmed = false, this._provisionForce = false, this._wasProvisioned = false, this._busy = false, this._selectedSsid = null, this._manualSsid = "", this._bodyOverflow = null, this._handleDisconnect = () => {
      this._state = "ERROR", this._error = "Disconnected";
    };
  }
  render() {
    if (!this.port) return j$1``;
    let e, t2, i = false;
    return void 0 === this._client && "INSTALL" !== this._state && "LOGS" !== this._state ? this._error ? [e, t2] = this._renderError(this._error) : t2 = this._renderProgress("Connecting") : "INSTALL" === this._state ? [e, t2, i] = this._renderInstall() : "ASK_ERASE" === this._state ? [e, t2] = this._renderAskErase() : "ERROR" === this._state ? [e, t2] = this._renderError(this._error) : "DASHBOARD" === this._state ? [e, t2, i] = this._client ? this._renderDashboard() : this._renderDashboardNoImprov() : "PROVISION" === this._state ? [e, t2] = this._renderProvision() : "LOGS" === this._state && ([e, t2] = this._renderLogs()), j$1`
      <ew-dialog
        open
        .heading=${e}
        @cancel=${this._preventDefault}
        @closed=${this._handleClose}
      >
        ${e ? j$1`<div slot="headline">${e}</div>` : ""}
        ${i ? j$1`
              <ew-icon-button slot="headline" @click=${this._closeDialog}>
                ${Jo}
              </ew-icon-button>
            ` : ""}
        ${t2}
      </ew-dialog>
    `;
  }
  _renderProgress(e, t2) {
    return j$1`
      <ewt-page-progress
        slot="content"
        .label=${e}
        .progress=${t2}
      ></ewt-page-progress>
    `;
  }
  _renderError(e) {
    return ["Error", j$1`
      <ewt-page-message
        slot="content"
        .icon=${Sa}
        .label=${e}
      ></ewt-page-message>
      <div slot="actions">
        <ew-text-button @click=${this._closeDialog}>Close</ew-text-button>
      </div>
    `];
  }
  _renderDashboard() {
    const e = this._manifest.name;
    let t2;
    return t2 = j$1`
      <div slot="content">
        <ew-list>
          <ew-list-item>
            <div slot="headline">Connected to ${this._info.name}</div>
            <div slot="supporting-text">
              ${this._info.firmware}&nbsp;${this._info.version}
              (${this._info.chipFamily})
            </div>
          </ew-list-item>
          ${this._isSameVersion ? "" : j$1`
                <ew-list-item
                  type="button"
                  @click=${() => {
      this._isSameFirmware ? this._startInstall(false) : this._manifest.new_install_prompt_erase ? this._state = "ASK_ERASE" : this._startInstall(true);
    }}
                >
                  ${oa}
                  <div slot="headline">
                    ${this._isSameFirmware ? `Update ${this._manifest.name}` : `Install ${this._manifest.name}`}
                  </div>
                </ew-list-item>
              `}
          ${void 0 === this._client.nextUrl ? "" : j$1`
                <ew-list-item
                  type="link"
                  href=${this._client.nextUrl}
                  target="_blank"
                >
                  ${la}
                  <div slot="headline">Visit Device</div>
                </ew-list-item>
              `}
          ${this._manifest.home_assistant_domain && this._client.state === fa.PROVISIONED ? j$1`
                <ew-list-item
                  type="link"
                  href=${`https://my.home-assistant.io/redirect/config_flow_start/?domain=${this._manifest.home_assistant_domain}`}
                  target="_blank"
                >
                  ${da}
                  <div slot="headline">Add to Home Assistant</div>
                </ew-list-item>
              ` : ""}
          <ew-list-item
            type="button"
            @click=${() => {
      this._state = "PROVISION", this._client.state === fa.PROVISIONED && (this._provisionForce = true);
    }}
          >
            ${aa}
            <div slot="headline">
              ${this._client.state === fa.PROVISIONED ? "Change Wi-Fi" : "Connect to Wi-Fi"}
            </div>
          </ew-list-item>
          <ew-list-item
            type="button"
            @click=${async () => {
      const e2 = this._client;
      e2 && (await this._closeClientWithoutEvents(e2), await xe(100)), this._client = void 0, this._state = "LOGS";
    }}
          >
            ${na}
            <div slot="headline">Logs & Console</div>
          </ew-list-item>
          ${this._isSameFirmware && this._manifest.funding_url ? j$1`
                <ew-list-item
                  type="link"
                  href=${this._manifest.funding_url}
                  target="_blank"
                >
                  ${ha}
                  <div slot="headline">Fund Development</div>
                </ew-list-item>
              ` : ""}
          ${this._isSameVersion ? j$1`
                <ew-list-item
                  type="button"
                  class="danger"
                  @click=${() => this._startInstall(true)}
                >
                  ${ca}
                  <div slot="headline">Erase User Data</div>
                </ew-list-item>
              ` : ""}
        </ew-list>
      </div>
    `, [e, t2, true];
  }
  _renderDashboardNoImprov() {
    const e = this._manifest.name;
    let t2;
    return t2 = j$1`
      <div slot="content">
        <ew-list>
          <ew-list-item
            type="button"
            @click=${() => {
      this._manifest.new_install_prompt_erase ? this._state = "ASK_ERASE" : this._startInstall(true);
    }}
          >
            ${oa}
            <div slot="headline">${`Install ${this._manifest.name}`}</div>
          </ew-list-item>
          <ew-list-item
            type="button"
            @click=${async () => {
      this._client = void 0, this._state = "LOGS";
    }}
          >
            ${na}
            <div slot="headline">Logs & Console</div>
          </ew-list-item>
        </ew-list>
      </div>
    `, [e, t2, true];
  }
  _renderProvision() {
    var e;
    let t2, i = "Configure Wi-Fi";
    if (this._busy) return [i, this._renderProgress("Trying to connect")];
    if (this._client.state === fa.STOPPED) i = void 0, t2 = j$1`
        <div slot="content">
          <ewt-page-message
            .icon=${Sa}
            .label=${j$1`The connected device has Wi-Fi turned off, so it can't
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
    else if (this._provisionForce || this._client.state !== fa.PROVISIONED) if (void 0 === this._ssids) t2 = this._renderProgress("Scanning for networks");
    else {
      let i2;
      switch (this._client.error) {
        case 3:
          i2 = "Unable to connect";
          break;
        case 254:
          i2 = "Timeout";
          break;
        case 0:
        case 2:
          break;
        default:
          i2 = `Unknown error (${this._client.error})`;
      }
      const r = null === (e = this._ssids) || void 0 === e ? void 0 : e.find(((e2) => e2.name === this._selectedSsid));
      t2 = j$1`
        <div slot="content">
          <div>Connect your device to the network to start using it.</div>
          ${i2 ? j$1`<p class="error">${i2}</p>` : ""}
          ${null !== this._ssids ? j$1`
                <ew-filled-select
                  menu-positioning="fixed"
                  label="Network"
                  @change=${(e2) => {
        const t3 = e2.target.selectedIndex;
        this._selectedSsid = t3 === this._ssids.length ? null : this._ssids[t3].name, this._manualSsid = "";
      }}
                >
                  ${this._ssids.map(((e2) => {
        const t3 = (i3 = e2.rssi) >= -50 ? { icon: Qo, class: "signal-excellent" } : i3 >= -60 ? { icon: ea, class: "signal-good" } : i3 >= -70 ? { icon: ta, class: "signal-fair" } : { icon: ia, class: "signal-weak" };
        var i3;
        return j$1`
                      <ew-select-option
                        .selected=${r === e2}
                        .value=${e2.name}
                      >
                        <span slot="start" class=${t3.class}>
                          ${t3.icon}
                        </span>
                        <span slot="headline">${e2.name}</span>
                        <span slot="end" class="network-details">
                          <span class="signal-strength">${e2.rssi}dB</span>
                          <span
                            class=${e2.secured ? "lock-secured" : "lock-unsecured"}
                          >
                            ${e2.secured ? ra : sa}
                          </span>
                        </span>
                      </ew-select-option>
                    `;
      }))}
                  <ew-divider></ew-divider>
                  <ew-select-option .selected=${!r}>
                    Join other…
                  </ew-select-option>
                </ew-filled-select>
              ` : ""}
          ${r ? "" : j$1`
                  <ew-filled-text-field
                    label="Network Name"
                    name="ssid"
                    .value=${this._manualSsid}
                  ></ew-filled-text-field>
                `}
          ${!r || r.secured ? j$1`
                <ew-filled-text-field
                  label="Password"
                  name="password"
                  type="password"
                  @keydown=${(e2) => {
        "Enter" === e2.key && this._doProvision();
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
      i = void 0;
      const e2 = !this._wasProvisioned && (void 0 !== this._client.nextUrl || "home_assistant_domain" in this._manifest);
      t2 = j$1`
        <div slot="content">
          <ewt-page-message
            .icon=${"🎉"}
            label="Device connected to the network!"
          ></ewt-page-message>
          ${e2 ? j$1`
                <ew-list>
                  ${void 0 === this._client.nextUrl ? "" : j$1`
                        <ew-list-item
                          type="link"
                          href=${this._client.nextUrl}
                          target="_blank"
                          @click=${() => {
        this._state = "DASHBOARD";
      }}
                        >
                          ${la}
                          <div slot="headline">Visit Device</div>
                        </ew-list-item>
                      `}
                  ${this._manifest.home_assistant_domain ? j$1`
                        <ew-list-item
                          type="link"
                          href=${`https://my.home-assistant.io/redirect/config_flow_start/?domain=${this._manifest.home_assistant_domain}`}
                          target="_blank"
                          @click=${() => {
        this._state = "DASHBOARD";
      }}
                        >
                          ${da}
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

        ${e2 ? "" : j$1`
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
    return [i, t2];
  }
  _renderAskErase() {
    return ["Erase device", j$1`
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
    let e, t2;
    const i = !this._installErase && this._isSameFirmware;
    if (!this._installConfirmed && this._isSameVersion) e = "Erase User Data", t2 = j$1`
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
    else if (this._installConfirmed) if (this._installState && "initializing" !== this._installState.state && "preparing" !== this._installState.state) if ("erasing" === this._installState.state) e = "Installing", t2 = this._renderProgress("Erasing");
    else if ("writing" === this._installState.state || "finished" === this._installState.state && void 0 === this._client) {
      let i2, r;
      e = "Installing", "finished" === this._installState.state ? r = "Wrapping up" : this._installState.details.percentage < 4 ? r = "Installing" : i2 = this._installState.details.percentage, t2 = this._renderProgress(j$1`
          ${r ? j$1`${r}<br />` : ""}
          <br />
          This will take
          ${"ESP8266" === this._installState.chipFamily ? "a minute" : "2 minutes"}.<br />
          Keep this page visible to prevent slow down
        `, i2);
    } else if ("finished" === this._installState.state) {
      e = void 0;
      const i2 = null !== this._client;
      t2 = j$1`
        <ewt-page-message
          slot="content"
          .icon=${"🎉"}
          label="Installation complete!"
        ></ewt-page-message>

        <div slot="actions">
          <ew-text-button
            @click=${() => {
        this._state = i2 && this._installErase ? "PROVISION" : "DASHBOARD";
      }}
          >
            Next
          </ew-text-button>
        </div>
      `;
    } else "error" === this._installState.state && (e = "Installation failed", t2 = j$1`
        <ewt-page-message
          slot="content"
          .icon=${Sa}
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
    else e = "Installing", t2 = this._renderProgress("Preparing installation");
    else {
      e = "Confirm Installation";
      const r = i ? "update to" : "install";
      t2 = j$1`
        <div slot="content">
          ${i ? j$1`Your device is running
                ${this._info.firmware}&nbsp;${this._info.version}.<br /><br />` : ""}
          Do you want to ${r}
          ${this._manifest.name}&nbsp;${this._manifest.version}?
          ${this._installErase ? j$1`<br /><br />All data on the device will be erased.` : ""}
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
    return [e, t2, false];
  }
  _renderLogs() {
    let e;
    return e = j$1`
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
      Ea(this.shadowRoot.querySelector("ewt-console").logs(), "esp-web-tools-logs.txt"), this.shadowRoot.querySelector("ewt-console").reset();
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
    e.has("_state") && ("ERROR" !== this._state && (this._error = void 0), "PROVISION" === this._state ? this._ssids = void 0 : this._provisionForce = false, "INSTALL" === this._state && (this._installConfirmed = false, this._installState = void 0));
  }
  get _showsProvisionForm() {
    var e;
    const t2 = null === (e = this._client) || void 0 === e ? void 0 : e.state;
    return void 0 !== t2 && t2 !== fa.STOPPED && (this._provisionForce || t2 !== fa.PROVISIONED);
  }
  _syncScanning() {
    const e = "PROVISION" === this._state && !this._busy && this._showsProvisionForm;
    e !== !!this._unsubSSIDs && (e ? (this._scanGraceTimeout = setTimeout((() => {
      this._scanGraceTimeout = void 0, void 0 === this._ssids && (this._ssids = [], this._selectedSsid = null);
    }), 9100), this._unsubSSIDs = this._client.subscribeSSIDs(((e2) => {
      void 0 === this._ssids && 0 === (null == e2 ? void 0 : e2.length) && this._scanGraceTimeout || null === e2 && this._ssids || (void 0 === this._ssids ? this._selectedSsid = null === e2 ? null : ((e3) => e3.length ? e3.reduce(((e4, t2) => t2.rssi > e4.rssi ? t2 : e4)).name : null)(e2) : null === this._selectedSsid || (null == e2 ? void 0 : e2.some(((e3) => e3.name === this._selectedSsid))) || (this._manualSsid = this._selectedSsid, this._selectedSsid = null), this._ssids = e2);
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
    super.updated(e), e.has("_state") && this.setAttribute("state", this._state), this._syncScanning(), "PROVISION" === this._state && (e.has("_selectedSsid") && null === this._selectedSsid ? this._focusFormElement("ew-filled-text-field[name=ssid]") : e.has("_ssids") && void 0 === e.get("_ssids") && this._focusFormElement());
  }
  _focusFormElement(e = "ew-filled-text-field, ew-filled-select") {
    const t2 = this.shadowRoot.querySelector(e);
    t2 && t2.updateComplete.then((() => setTimeout((() => t2.focus()), 100)));
  }
  async _initialize(e = false) {
    if (null === this.port.readable || null === this.port.writable) return this._state = "ERROR", void (this._error = "Serial port is not readable/writable. Close any other application using it and try again.");
    try {
      this._manifest = await (async (e2) => {
        const t3 = new URL(e2, location.toString()).toString(), i = await fetch(t3), r = await i.json();
        return "new_install_skip_erase" in r && (console.warn('Manifest option "new_install_skip_erase" is deprecated. Use "new_install_prompt_erase" instead.'), r.new_install_skip_erase && (r.new_install_prompt_erase = true)), r;
      })(this.manifestPath);
    } catch (e2) {
      return this._state = "ERROR", void (this._error = "Failed to download manifest");
    }
    if (0 === this._manifest.new_install_improv_wait_time) return void (this._client = null);
    const t2 = new xa(this.port, this.logger);
    t2.addEventListener("state-changed", (() => {
      this.requestUpdate();
    })), t2.addEventListener("error-changed", (() => this.requestUpdate()));
    try {
      const i = e ? void 0 !== this._manifest.new_install_improv_wait_time ? 1e3 * this._manifest.new_install_improv_wait_time : 1e4 : 1500;
      this._info = await t2.initialize(i), this._client = t2, t2.addEventListener("disconnect", this._handleDisconnect);
    } catch (e2) {
      this._info = void 0, e2 instanceof va ? (this._state = "ERROR", this._error = "Serial port is not ready. Close any other application using it and try again.") : (this._client = null, this.logger.error("Improv initialization failed.", e2));
    }
  }
  _startInstall(e) {
    this._state = "INSTALL", this._installErase = e, this._installConfirmed = false;
  }
  async _confirmInstall() {
    this._installConfirmed = true, this._installState = void 0, this._client && await this._closeClientWithoutEvents(this._client), this._client = void 0, await this.port.close(), (async (e, t2, i, r, s) => {
      let o, a;
      const n2 = (t3) => e({ ...t3, manifest: r, build: o, chipFamily: a }), l = new qr(t2), d = t2.getInfo(), c = d && 12346 === d.usbVendorId && void 0 !== d.usbProductId && [4097, 4098, 4099, 2, 3].includes(d.usbProductId), h = new Es({ transport: l, baudrate: 115200, enableTracing: false });
      window.esploader = h, n2({ state: "initializing", message: "Initializing...", details: { done: false } });
      try {
        await h.main(), await h.flashId();
      } catch (e2) {
        return console.error(e2), n2({ state: "error", message: "Failed to initialize. Try resetting your device or holding the BOOT button while clicking INSTALL.", details: { error: "failed_initialize", details: e2 } }), await wa(l, h), void await l.disconnect();
      }
      a = h.chip.CHIP_NAME, n2({ state: "initializing", message: `Initialized. Found ${a}`, details: { done: true } });
      const p = c ? "cdc" : "uart";
      if (o = r.builds.find(((e2) => e2.chipFamily === a && e2.serialType === p)) || r.builds.find(((e2) => e2.chipFamily === a && void 0 === e2.serialType)), !o) return n2({ state: "error", message: `Your ${a} board is not supported.`, details: { error: "not_supported", details: a } }), await wa(l, h), void await l.disconnect();
      n2({ state: "preparing", message: "Preparing installation...", details: { done: false } });
      const u = i.startsWith("blob:") || i.startsWith("data:") ? location.toString() : new URL(i, location.toString()).toString(), f = o.parts.map((async (e2) => {
        const t3 = new URL(e2.path, u).toString(), i2 = await fetch(t3);
        if (!i2.ok) throw new Error(`Downloading firmware ${e2.path} failed: ${i2.status}`);
        const r2 = new FileReader(), s2 = await i2.blob();
        return new Promise(((e3) => {
          r2.addEventListener("load", (() => e3(r2.result))), r2.readAsArrayBuffer(s2);
        }));
      })), m = [];
      let v = 0;
      for (let e2 = 0; e2 < f.length; e2++) try {
        const t3 = await f[e2], i2 = new Uint8Array(t3, 0, t3.byteLength);
        m.push({ data: i2, address: o.parts[e2].offset }), v += i2.length;
      } catch (e3) {
        return n2({ state: "error", message: e3.message, details: { error: "failed_firmware_download", details: e3.message } }), await wa(l, h), void await l.disconnect();
      }
      n2({ state: "preparing", message: "Installation prepared", details: { done: true } }), s && (n2({ state: "erasing", message: "Erasing device...", details: { done: false } }), await h.eraseFlash(), n2({ state: "erasing", message: "Device erased", details: { done: true } })), n2({ state: "writing", message: "Writing progress: 0%", details: { bytesTotal: v, bytesWritten: 0, percentage: 0 } });
      let g = 0;
      try {
        await h.writeFlash({ fileArray: m, flashSize: "keep", flashMode: "keep", flashFreq: "keep", eraseAll: false, compress: true, reportProgress: (e2, t3, i2) => {
          const r2 = t3 / i2 * m[e2].data.length, s2 = Math.floor((g + r2) / v * 100);
          t3 !== i2 ? n2({ state: "writing", message: `Writing progress: ${s2}%`, details: { bytesTotal: v, bytesWritten: g + t3, percentage: s2 } }) : g += r2;
        } });
      } catch (e2) {
        return n2({ state: "error", message: e2.message, details: { error: "write_failed", details: e2 } }), await wa(l, h), void await l.disconnect();
      }
      n2({ state: "writing", message: "Writing complete", details: { bytesTotal: v, bytesWritten: g, percentage: 100 } }), await wa(l, h), console.log("DISCONNECT"), await l.disconnect(), n2({ state: "finished", message: "All done!" });
    })(((e) => {
      this._installState = e, "finished" === e.state ? xe(100).then((() => this.port.open({ baudRate: 115200, bufferSize: 8192 }))).then((() => this._initialize(true))).then((() => this.requestUpdate())) : "error" === e.state && xe(100).then((() => this.port.open({ baudRate: 115200, bufferSize: 8192 })));
    }), this.port, this.manifestPath, this._manifest, this._installErase);
  }
  async _doProvision() {
    var e;
    const t2 = null === this._selectedSsid ? this.shadowRoot.querySelector("ew-filled-text-field[name=ssid]").value : this._selectedSsid, i = (null === (e = this.shadowRoot.querySelector("ew-filled-text-field[name=password]")) || void 0 === e ? void 0 : e.value) || "";
    this._busy = true, this._wasProvisioned = this._client.state === fa.PROVISIONED, await this._stopScanning();
    try {
      await this._client.provision(t2, i, 45e3);
    } catch (e2) {
      return;
    } finally {
      this._busy = false, this._provisionForce = false;
    }
  }
  _closeDialog() {
    this.shadowRoot.querySelector("ew-dialog").close();
  }
  async _handleClose() {
    this._client && await this._closeClientWithoutEvents(this._client), ((e, t2, i, r) => {
      r = r || {};
      const s = new CustomEvent(t2, { bubbles: void 0 === r.bubbles || r.bubbles, cancelable: Boolean(r.cancelable), composed: void 0 === r.composed || r.composed, detail: i });
      e.dispatchEvent(s);
    })(this, "closed"), document.body.style.overflow = this._bodyOverflow, this.parentNode.removeChild(this);
  }
  get _isSameFirmware() {
    var e;
    return !!this._info && ((null === (e = this.overrides) || void 0 === e ? void 0 : e.checkSameFirmware) ? this.overrides.checkSameFirmware(this._manifest, this._info) : this._info.firmware === this._manifest.name);
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
ka.styles = [be$1, n`
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
    `], t([ft$1()], ka.prototype, "_client", void 0), t([ft$1()], ka.prototype, "_state", void 0), t([ft$1()], ka.prototype, "_installErase", void 0), t([ft$1()], ka.prototype, "_installConfirmed", void 0), t([ft$1()], ka.prototype, "_installState", void 0), t([ft$1()], ka.prototype, "_provisionForce", void 0), t([ft$1()], ka.prototype, "_error", void 0), t([ft$1()], ka.prototype, "_busy", void 0), t([ft$1()], ka.prototype, "_ssids", void 0), t([ft$1()], ka.prototype, "_selectedSsid", void 0), customElements.define("ewt-install-dialog", ka);
var Aa = Object.freeze({ __proto__: null, EwtInstallDialog: ka });
export {
  ts as R,
  Aa as i
};
