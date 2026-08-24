const Mi = globalThis, or = Mi.ShadowRoot && (Mi.ShadyCSS === void 0 || Mi.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ar = /* @__PURE__ */ Symbol(), Pr = /* @__PURE__ */ new WeakMap();
let _a = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== ar) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (or && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = Pr.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && Pr.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const lc = (s) => new _a(typeof s == "string" ? s : s + "", void 0, ar), cc = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, r, o) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1], s[0]);
  return new _a(e, s, ar);
}, dc = (s, t) => {
  if (or) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = Mi.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, s.appendChild(i);
  }
}, Ur = or ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return lc(e);
})(s) : s;
const { is: hc, defineProperty: Ac, getOwnPropertyDescriptor: pc, getOwnPropertyNames: gc, getOwnPropertySymbols: uc, getPrototypeOf: fc } = Object, Vi = globalThis, Qr = Vi.trustedTypes, mc = Qr ? Qr.emptyScript : "", vc = Vi.reactiveElementPolyfillSupport, He = (s, t) => s, Ys = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? mc : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, Ea = (s, t) => !hc(s, t), Hr = { attribute: !0, type: String, converter: Ys, reflect: !1, useDefault: !1, hasChanged: Ea };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), Vi.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let de = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = Hr) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && Ac(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: o } = pc(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: r, set(a) {
      const n = r?.call(this);
      o?.call(this, a), this.requestUpdate(t, n, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Hr;
  }
  static _$Ei() {
    if (this.hasOwnProperty(He("elementProperties"))) return;
    const t = fc(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(He("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(He("properties"))) {
      const e = this.properties, i = [...gc(e), ...uc(e)];
      for (const r of i) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, r] of e) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const r = this._$Eu(e, i);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const r of i) e.unshift(Ur(r));
    } else t !== void 0 && e.push(Ur(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return dc(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    const i = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, i);
    if (r !== void 0 && i.reflect === !0) {
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : Ys).toAttribute(e, i.type);
      this._$Em = t, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const o = i.getPropertyOptions(r), a = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : Ys;
      this._$Em = r;
      const n = a.fromAttribute(e, o.type);
      this[r] = n ?? this._$Ej?.get(r) ?? n, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, r = !1, o) {
    if (t !== void 0) {
      const a = this.constructor;
      if (r === !1 && (o = this[t]), i ??= a.getPropertyOptions(t), !((i.hasChanged ?? Ea)(o, e) || i.useDefault && i.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: o }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), o !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [r, o] of this._$Ep) this[r] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [r, o] of i) {
        const { wrapped: a } = o, n = this[r];
        a !== !0 || this._$AL.has(r) || n === void 0 || this.C(r, void 0, o, n);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
de.elementStyles = [], de.shadowRootOptions = { mode: "open" }, de[He("elementProperties")] = /* @__PURE__ */ new Map(), de[He("finalized")] = /* @__PURE__ */ new Map(), vc?.({ ReactiveElement: de }), (Vi.reactiveElementVersions ??= []).push("2.1.2");
const nr = globalThis, Gr = (s) => s, Qi = nr.trustedTypes, $r = Qi ? Qi.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, wa = "$lit$", Gt = `lit$${Math.random().toFixed(9).slice(2)}$`, ba = "?" + Gt, _c = `<${ba}>`, oe = document, Ze = () => oe.createComment(""), Xe = (s) => s === null || typeof s != "object" && typeof s != "function", lr = Array.isArray, Ec = (s) => lr(s) || typeof s?.[Symbol.iterator] == "function", cs = `[\x20\t
\f\r]`, xe = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Lr = /-->/g, Yr = />/g, Vt = RegExp(`>|${cs}(?:([^\\s"'>=/]+)(${cs}*=${cs}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), Nr = /'/g, Kr = /"/g, ya = /^(?:script|style|textarea|title)$/i, wc = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), B = wc(1), ve = /* @__PURE__ */ Symbol.for("lit-noChange"), O = /* @__PURE__ */ Symbol.for("lit-nothing"), zr = /* @__PURE__ */ new WeakMap(), te = oe.createTreeWalker(oe, 129);
function Ca(s, t) {
  if (!lr(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return $r !== void 0 ? $r.createHTML(t) : t;
}
const bc = (s, t) => {
  const e = s.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = xe;
  for (let n = 0; n < e; n++) {
    const l = s[n];
    let c, d, h = -1, g = 0;
    for (; g < l.length && (a.lastIndex = g, d = a.exec(l), d !== null); ) g = a.lastIndex, a === xe ? d[1] === "!--" ? a = Lr : d[1] !== void 0 ? a = Yr : d[2] !== void 0 ? (ya.test(d[2]) && (r = RegExp("</" + d[2], "g")), a = Vt) : d[3] !== void 0 && (a = Vt) : a === Vt ? d[0] === ">" ? (a = r ?? xe, h = -1) : d[1] === void 0 ? h = -2 : (h = a.lastIndex - d[2].length, c = d[1], a = d[3] === void 0 ? Vt : d[3] === '"' ? Kr : Nr) : a === Kr || a === Nr ? a = Vt : a === Lr || a === Yr ? a = xe : (a = Vt, r = void 0);
    const A = a === Vt && s[n + 1].startsWith("/>") ? " " : "";
    o += a === xe ? l + _c : h >= 0 ? (i.push(c), l.slice(0, h) + wa + l.slice(h) + Gt + A) : l + Gt + (h === -2 ? n : A);
  }
  return [Ca(s, o + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
let Ns = class Ba {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let o = 0, a = 0;
    const n = t.length - 1, l = this.parts, [c, d] = bc(t, e);
    if (this.el = Ba.createElement(c, i), te.currentNode = this.el.content, e === 2 || e === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (r = te.nextNode()) !== null && l.length < n; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const h of r.getAttributeNames()) if (h.endsWith(wa)) {
          const g = d[a++], A = r.getAttribute(h).split(Gt), _ = /([.?@])?(.*)/.exec(g);
          l.push({ type: 1, index: o, name: _[2], strings: A, ctor: _[1] === "." ? Cc : _[1] === "?" ? Bc : _[1] === "@" ? Ic : qi }), r.removeAttribute(h);
        } else h.startsWith(Gt) && (l.push({ type: 6, index: o }), r.removeAttribute(h));
        if (ya.test(r.tagName)) {
          const h = r.textContent.split(Gt), g = h.length - 1;
          if (g > 0) {
            r.textContent = Qi ? Qi.emptyScript : "";
            for (let A = 0; A < g; A++) r.append(h[A], Ze()), te.nextNode(), l.push({ type: 2, index: ++o });
            r.append(h[g], Ze());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ba) l.push({ type: 2, index: o });
      else {
        let h = -1;
        for (; (h = r.data.indexOf(Gt, h + 1)) !== -1; ) l.push({ type: 7, index: o }), h += Gt.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = oe.createElement("template");
    return i.innerHTML = t, i;
  }
};
function _e(s, t, e = s, i) {
  if (t === ve) return t;
  let r = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const o = Xe(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(s), r._$AT(s, e, i)), i !== void 0 ? (e._$Co ??= [])[i] = r : e._$Cl = r), r !== void 0 && (t = _e(s, r._$AS(s, t.values), r, i)), t;
}
let yc = class {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, r = (t?.creationScope ?? oe).importNode(e, !0);
    te.currentNode = r;
    let o = te.nextNode(), a = 0, n = 0, l = i[0];
    for (; l !== void 0; ) {
      if (a === l.index) {
        let c;
        l.type === 2 ? c = new cr(o, o.nextSibling, this, t) : l.type === 1 ? c = new l.ctor(o, l.name, l.strings, this, t) : l.type === 6 && (c = new xc(o, this, t)), this._$AV.push(c), l = i[++n];
      }
      a !== l?.index && (o = te.nextNode(), a++);
    }
    return te.currentNode = oe, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}, cr = class Ia {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, i, r) {
    this.type = 2, this._$AH = O, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = _e(this, t, e), Xe(t) ? t === O || t == null || t === "" ? (this._$AH !== O && this._$AR(), this._$AH = O) : t !== this._$AH && t !== ve && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Ec(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== O && Xe(this._$AH) ? this._$AA.nextSibling.data = t : this.T(oe.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = Ns.createElement(Ca(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === r) this._$AH.p(e);
    else {
      const o = new yc(r, this), a = o.u(this.options);
      o.p(e), this.T(a), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = zr.get(t.strings);
    return e === void 0 && zr.set(t.strings, e = new Ns(t)), e;
  }
  k(t) {
    lr(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const o of t) r === e.length ? e.push(i = new Ia(this.O(Ze()), this.O(Ze()), this, this.options)) : i = e[r], i._$AI(o), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = Gr(t).nextSibling;
      Gr(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}, qi = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, r, o) {
    this.type = 1, this._$AH = O, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = O;
  }
  _$AI(t, e = this, i, r) {
    const o = this.strings;
    let a = !1;
    if (o === void 0) t = _e(this, t, e, 0), a = !Xe(t) || t !== this._$AH && t !== ve, a && (this._$AH = t);
    else {
      const n = t;
      let l, c;
      for (t = o[0], l = 0; l < o.length - 1; l++) c = _e(this, n[i + l], e, l), c === ve && (c = this._$AH[l]), a ||= !Xe(c) || c !== this._$AH[l], c === O ? t = O : t !== O && (t += (c ?? "") + o[l + 1]), this._$AH[l] = c;
    }
    a && !r && this.j(t);
  }
  j(t) {
    t === O ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}, Cc = class extends qi {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === O ? void 0 : t;
  }
}, Bc = class extends qi {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== O);
  }
}, Ic = class extends qi {
  constructor(t, e, i, r, o) {
    super(t, e, i, r, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = _e(this, t, e, 0) ?? O) === ve) return;
    const i = this._$AH, r = t === O && i !== O || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== O && (i === O || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}, xc = class {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    _e(this, t);
  }
};
const Sc = nr.litHtmlPolyfillSupport;
Sc?.(Ns, cr), (nr.litHtmlVersions ??= []).push("3.3.3");
const Rc = (s, t, e) => {
  const i = e?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = r = new cr(t.insertBefore(Ze(), o), o, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
const dr = globalThis;
let Ge = class extends de {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Rc(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return ve;
  }
};
Ge._$litElement$ = !0, Ge.finalized = !0, dr.litElementHydrateSupport?.({ LitElement: Ge });
const Dc = dr.litElementPolyfillSupport;
Dc?.({ LitElement: Ge });
(dr.litElementVersions ??= []).push("4.2.2");
const Jr = "circuitsetup_energy_meter_helper/", Mc = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, Tc = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, kc = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, Fc = /[\u0000-\u001f\u007f-\u009f]/, Oc = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), Pc = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), Uc = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "indeterminate", "verified", "cancelled"]), hr = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), jr = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), Hi = /* @__PURE__ */ new Set(["A", "B", "C"]), Qc = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), Hc = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), Gc = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), $c = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), Lc = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), Yc = /^(?:ct(?:[1-9]|[1-3][0-9]|4[0-2])_name|current_cal_ct(?:[1-9]|[1-3][0-9]|4[0-2])|voltage_cal[12])$/, Nc = /^[0-9a-f]{12}$/, Kc = /^[0-9a-f]{64}$/, Wr = /^[0-9a-f]{32}$/, zc = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, xa = /^[a-z0-9][a-z0-9_-]{0,127}$/, Sa = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, Vr = /* @__PURE__ */ new Set(["preview_ct_config", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]);
function H(s, t) {
  if (s === null || typeof s != "object" || Array.isArray(s)) throw new Error(`${t} response is invalid`);
  return s;
}
function K(s, t, e = 100) {
  if (!Array.isArray(s) || s.length > e) throw new Error(`${t} response is invalid`);
  return s;
}
function T(s, t, e = !1) {
  if (e && s === null) return null;
  if (typeof s != "string" || s.length === 0) throw new Error(`${t} response is invalid`);
  return s;
}
function rt(s, t) {
  if (typeof s != "number" || !Number.isFinite(s)) throw new Error(`${t} response is invalid`);
  return s;
}
function $(s, t) {
  const e = rt(s, t);
  if (!Number.isInteger(e)) throw new Error(`${t} response is invalid`);
  return e;
}
function ht(s, t, e = !1) {
  if (e && s === null) return null;
  if (typeof s != "boolean") throw new Error(`${t} response is invalid`);
  return s;
}
function V(s, t, e) {
  const i = T(s, e);
  if (!t.has(i)) throw new Error(`${e} response is invalid`);
  return i;
}
function Ks(s, t) {
  s !== void 0 && T(s, t, !0);
}
function Ti(s, t) {
  return Math.abs(s - t) <= 1e-9 * Math.max(1, Math.abs(s), Math.abs(t));
}
function Ra(s, t) {
  const e = H(s, t);
  T(e.entry_id, t), T(e.title, t), T(e.project_name, t), T(e.project_version, t, !0), ht(e.importable, t, !0), T(e.configuration, t, !0);
}
function gi(s, t) {
  const e = H(s, t);
  if (V(e.state, Oc, t), K(e.devices, t).forEach((i) => Ra(i, t)), e.configuration_authoritative !== void 0 && ht(e.configuration_authoritative, t), e.installer_intent !== void 0) {
    const i = H(e.installer_intent, t), r = $(i.addon_count, t);
    if (r < 0 || r > 6) throw new Error(`${t} response is invalid`);
    if (V(i.connection_type, hr, t) === "unknown") throw new Error(`${t} response is invalid`);
    const a = i.firmware_product_id, n = i.esphome_version;
    if (a === void 0 != (n === void 0) || a !== void 0 && (typeof a != "string" || a.length > 160 || !xa.test(a)) || n !== void 0 && (typeof n != "string" || n.length > 160 || !Sa.test(n)))
      throw new Error(`${t} response is invalid`);
  }
  return s;
}
function qr(s, t) {
  const e = H(s, t), i = $(e.addon_count, t), r = $(e.board_count, t), o = $(e.ct_count, t), a = $(e.group_count, t);
  if (i < 0 || i > 6 || r < 1 || r > 7 || o < 6 || o > 42 || a < 2 || a > 14 || r !== i + 1 || o !== 6 * r || a !== 2 * r) throw new Error(`${t} response is invalid`);
  V(e.connection_type, hr, t), T(e.voltage_layout, t), T(e.project_name, t);
  const n = K(e.evidence, t);
  if (n.length < 1 || n.length > jr.size) throw new Error(`${t} response is invalid`);
  const l = n.map((c) => {
    const d = H(c, t), h = V(d.source, jr, t), g = $(d.addon_count, t);
    if (g < 0 || g > 6) throw new Error(`${t} response is invalid`);
    return T(d.detail, t), h;
  });
  if (new Set(l).size !== l.length || !l.some((c) => Lc.has(c))) throw new Error(`${t} response is invalid`);
  return s;
}
function Jc(s, t) {
  const e = H(s, t);
  return "topology" in e ? (qr(e.topology, t), e.configuration_authoritative !== void 0 && ht(e.configuration_authoritative, t), s) : qr(s, t);
}
function jc(s, t) {
  const e = H(s, t);
  T(e.plan_id, t), T(e.source_sha256, t);
  const i = K(e.channels, t);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${t} response is invalid`);
  i.forEach((a, n) => {
    const l = H(a, t), c = $(l.channel, t);
    T(l.name, t), $(l.raw_gain_ct, t), rt(l.reporting_multiplier, t), Ks(l.selected_model_id, t), ht(l.selection_verified_against_config, t), Ks(l.display_label, t);
    const d = H(l.address, t), h = $(d.channel, t), g = $(d.board_index, t), A = $(d.group_index, t), _ = V(d.phase, Hi, t), m = n + 1;
    if (c !== m || h !== m || g !== Math.floor(n / 6) || A !== Math.floor(n % 6 / 3) || _ !== ["A", "B", "C"][n % 3]) throw new Error(`${t} response is invalid`);
  });
  const r = H(e.catalog, t);
  T(r.source_repository, t), T(r.source_ref, t), $(r.schema_version, t);
  const o = K(r.presets, t);
  if (o.length > 64) throw new Error(`${t} response is invalid`);
  return o.forEach((a) => {
    const n = H(a, t);
    T(n.model_id, t), T(n.label, t), rt(n.rated_current_a, t), T(n.secondary, t), n.default_gain_ct !== null && $(n.default_gain_ct, t), ht(n.requires_burden_jumper_cut, t), T(n.notes, t);
  }), s;
}
function Fe(s, t) {
  const e = H(s, t);
  if (T(e.transaction_id, t), V(e.state, Pc, t), T(e.source_sha256, t), ht(e.rollback_available, t), T(e.redacted_diff, t), K(e.changes, t).forEach((i) => {
    const r = H(i, t), o = T(r.key, t);
    if (!Yc.test(o)) throw new Error(`${t} response is invalid`);
    r.old_value !== null && T(r.old_value, t), T(r.new_value, t);
  }), K(e.evidence, t).forEach((i) => V(i, Hc, t)), K(e.progress, t).forEach((i) => V(i, Gc, t)), e.validation_detail != null) {
    const i = H(e.validation_detail, t);
    for (const r of ["reported_error_count", "reported_warning_count"]) i[r] !== null && $(i[r], t);
    i.code !== null && $(i.code, t), $(i.error_record_count, t), $(i.warning_record_count, t);
  }
  return e.upload_progress !== void 0 && K(e.upload_progress, t).forEach((i) => {
    const r = H(i, t);
    if (V(r.stage, Qc, t), r.progress !== null && r.percentage !== null && r.progress !== void 0 && r.percentage !== void 0) throw new Error(`${t} response is invalid`);
    const o = r.progress ?? r.percentage;
    if (o != null) {
      const a = $(o, t);
      if (a < 0 || a > 100) throw new Error(`${t} response is invalid`);
    }
  }), s;
}
function he(s, t) {
  const e = H(s, t);
  T(e.session_id, t), T(e.device_id, t), V(e.state, Uc, t), ht(e.safety_acknowledged, t);
  const i = H(e.preflight, t);
  return K(i.issues, t).forEach((r) => {
    const o = H(r, t);
    V(o.code, $c, t), T(o.role, t), T(o.detail, t);
  }), K(i.zeroed_roles, t).forEach((r) => T(r, t)), e.calibration_sources !== void 0 && Object.values(H(e.calibration_sources, t)).forEach((r) => V(r, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), t)), s;
}
function Zr(s, t, e, i) {
  const r = H(s, t), o = V(r.target, /* @__PURE__ */ new Set(["voltage", "current"]), t);
  T(r.target_id, t);
  const a = ht(r.stable, t);
  if (o !== e || r.target_id !== i) throw new Error(`${t} response is invalid`);
  const n = K(r.windows, t, o === "voltage" ? 3 : 1);
  if (n.length !== (o === "voltage" ? 3 : 1)) throw new Error(`${t} response is invalid`);
  const l = n.map((c) => {
    const d = H(c, t), h = K(d.samples, t, 1).map((E) => rt(E, t));
    if (h.length !== 1) throw new Error(`${t} response is invalid`);
    const g = rt(d.mean, t), A = rt(d.standard_deviation, t), _ = rt(d.range_percent, t), m = h.reduce((E, u) => E + u, 0) / h.length, f = Math.sqrt(h.reduce((E, u) => E + (u - m) ** 2, 0) / h.length), b = 100 * (Math.max(...h) - Math.min(...h)) / Math.abs(m);
    if (!Ti(g, m) || !Ti(A, f) || !Ti(_, b)) throw new Error(`${t} response is invalid`);
    return _;
  });
  if (a !== l.every((c) => c <= 1)) throw new Error(`${t} response is invalid`);
  return s;
}
function Xr(s, t, e) {
  const i = H(s, t), r = V(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), t);
  T(i.group_key, t), i.phase !== null && V(i.phase, Hi, t);
  const o = $(i.iteration, t), a = K(i.changed_channels, t, 3).map((_) => $(_, t)), n = K(i.before_values, t, 3), l = K(i.after_values, t, 3), c = K(i.error_percent_values, t, 3);
  for (const _ of [n, l, c]) _.forEach((m) => rt(m, t));
  const d = e.target === "voltage" ? e.groupKey : Ar(e.references[0].channel), h = e.target === "voltage" ? Da(e.groupKey) : e.references.map((_) => _.channel), g = e.target === "current" && e.references.length === 1 ? ["A", "B", "C"][(e.references[0].channel - 1) % 3] : null, A = ht(i.retry_allowed, t);
  if (e.target === "voltage" && (!Number.isFinite(e.reference) || e.reference <= 0) || e.target === "current" && e.references.some((_) => !Number.isFinite(_.reference) || _.reference <= 0 || !Number.isFinite(_.rawReference) || _.rawReference <= 0) || ![1, 2, 3].includes(a.length) || r !== "indeterminate" && n.length !== a.length || new Set(a).size !== a.length || a.some((_) => _ < 1 || _ > 42) || o < 1 || o > 3 || i.group_key !== d || i.phase !== g || a.length !== h.length || a.some((_, m) => _ !== h[m]) || (r === "indeterminate" ? l.length !== 0 || c.length !== 0 : l.length !== a.length || c.length !== a.length)) throw new Error(`${t} response is invalid`);
  if (r === "indeterminate") {
    if (i.gain_evidence !== null || A) throw new Error(`${t} response is invalid`);
    i.restore_evidence != null && H(i.restore_evidence, t);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${t} response is invalid`);
    Wc(i.gain_evidence, t, e);
    const _ = e.target === "voltage" ? l.map(() => e.reference) : e.references.map((b) => b.reference), m = l.map((b, E) => 100 * Math.abs(rt(b, t) - _[E]) / _[E]);
    if (c.some((b, E) => rt(b, t) < 0 || !Ti(rt(b, t), m[E]))) throw new Error(`${t} response is invalid`);
    const f = Math.max(...m) > 1;
    if (r === "result_outside_tolerance" !== f || A !== (f && o < 3)) throw new Error(`${t} response is invalid`);
  }
  return s;
}
function Ar(s) {
  const t = Math.floor((s - 1) / 6), e = Math.floor((s - 1) % 6 / 3) + 1;
  return t === 0 ? `main_${e}` : `addon${t}_${e}`;
}
function Wc(s, t, e) {
  const i = H(s, t), r = $(i.connection_generation, t), o = $(i.operation_sequence, t), a = e.target === "voltage" ? e.groupKey : Ar(e.references[0].channel), n = a.startsWith("main_") ? `meter_main${a.slice(-1)}` : a;
  if (r < 1 || o < 1 || T(i.instance_id, t) !== n) throw new Error(`${t} response is invalid`);
  const l = e.target === "current" ? new Map(e.references.map((g) => [["A", "B", "C"][(g.channel - 1) % 3], g.rawReference])) : /* @__PURE__ */ new Map(), c = K(i.phases, t, 3);
  if (c.length !== 3) throw new Error(`${t} response is invalid`);
  c.forEach((g, A) => {
    const _ = H(g, t), m = V(_.phase, Hi, t);
    if (m !== ["A", "B", "C"][A]) throw new Error(`${t} response is invalid`);
    rt(_.measured_voltage, t), rt(_.measured_current, t);
    const f = rt(_.reference_voltage, t), b = rt(_.reference_current, t), E = $(_.old_voltage_gain, t), u = $(_.new_voltage_gain, t), I = $(_.old_current_gain, t), D = $(_.new_current_gain, t);
    if ([E, u, I, D].some((w) => w < 1 || w > 65535)) throw new Error(`${t} response is invalid`);
    if (e.target === "voltage") {
      if (Math.abs(f - e.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(f), e.reference)) || Math.abs(b) > 1e-6 || I !== D) throw new Error(`${t} response is invalid`);
    } else {
      const w = l.get(m);
      if (Math.abs(f) > 1e-6 || (w === void 0 ? Math.abs(b) > 1e-6 : Math.abs(b - w) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(b), w))) || E !== u || w === void 0 && I !== D) throw new Error(`${t} response is invalid`);
    }
  });
  const d = K(i.register_mismatch_phases, t, 3);
  d.forEach((g) => V(g, Hi, t));
  const h = K(i.matching_lines, t, 100);
  if (h.length === 0 || h.some((g) => typeof g != "string") || ht(i.flash_saved, t) !== !0 || d.length !== 0 || ht(i.calibration_disabled, t) !== !1) throw new Error(`${t} response is invalid`);
}
function Da(s) {
  const t = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(s);
  if (!t) return [];
  const e = t[2] === void 0 ? 0 : Number(t[2]), i = Number(t[1] ?? t[3]), r = e * 6 + (i - 1) * 3 + 1;
  return [r, r + 1, r + 2];
}
function zs(s, t, e) {
  const i = H(s, t);
  for (const A of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) T(i[A], t);
  const r = $(i.topology_addon_count, t);
  V(i.topology_connection_type, hr, t);
  const o = $(i.connection_generation, t), a = V(i.source_authority, /* @__PURE__ */ new Set(["saved_flash", "configuration"]), t), n = ht(i.source_handoff_available, t), l = ht(i.source_handoff_firmware_installed, t);
  Ks(i.source_handoff_transaction_id, t);
  const c = i.config_filename !== null || i.config_sha256 !== null;
  if (c && (T(i.config_filename, t), T(i.config_sha256, t), !zc.test(i.config_filename) || !Kc.test(i.config_sha256)))
    throw new Error(`${t} response is invalid`);
  if (i.config_filename === null != (i.config_sha256 === null) || n && (!c || l || i.source_handoff_transaction_id !== null || a !== "saved_flash") || !n && c && i.source_handoff_transaction_id === null || l && (!c || i.source_handoff_transaction_id === null) || a === "configuration" && (!l || n)) throw new Error(`${t} response is invalid`);
  if (!Nc.test(i.mac) || !Wr.test(i.verification_id) || o < 1 || i.source_handoff_transaction_id !== null && !Wr.test(i.source_handoff_transaction_id) || r !== e.addon_count || i.topology_project_name !== e.project_name || i.topology_connection_type !== e.connection_type || i.topology_voltage_layout !== e.voltage_layout) throw new Error(`${t} response is invalid`);
  const d = K(i.groups, t, 14), h = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: r }, (A, _) => [`addon${_ + 1}_1`, `addon${_ + 1}_2`]).flat()]), g = /* @__PURE__ */ new Set();
  if (d.length < 1) throw new Error(`${t} response is invalid`);
  return d.forEach((A) => {
    const _ = H(A, t), m = T(_.instance_id, t);
    if (!h.has(m) || g.has(m)) throw new Error(`${t} response is invalid`);
    g.add(m);
    const f = K(_.phase_gains, t, 3);
    if (f.length !== 3) throw new Error(`${t} response is invalid`);
    f.forEach((b) => {
      const E = K(b, t, 2);
      if (E.length !== 2) throw new Error(`${t} response is invalid`);
      E.forEach((u) => {
        const I = $(u, t);
        if (I < 1 || I > 65535) throw new Error(`${t} response is invalid`);
      });
    });
  }), s;
}
function Vc(s, t, e) {
  const i = H(s, t);
  return i.session !== null && he(i.session, t), i.transaction !== null && Fe(i.transaction, t), i.verified_calibration !== null && zs(i.verified_calibration, t, e), s;
}
class Gi {
  constructor(t, e) {
    this.hass = t, this.entryId = e, this.setupStatus = () => this.call("setup_status", (i) => gi(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (K(i, "list_meters").forEach((r) => Ra(r, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (r) => Jc(r, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (r) => jc(r, "get_ct_inventory"), { device_id: i }), this.getActiveWork = (i, r) => this.call("get_active_work", (o) => Vc(o, "get_active_work", r), { device_id: i }), this.getSession = (i) => this.call("get_session", (r) => he(r, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => H(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, r, o) => this.call("set_installer_intent", (a) => gi(a, "set_installer_intent"), {
      addon_count: i,
      connection_type: r,
      ...o && o.productId.length <= 160 && o.version.length <= 160 && xa.test(o.productId) && Sa.test(o.version) ? { firmware_product_id: o.productId, esphome_version: o.version } : {}
    }), this.rescan = () => this.call("rescan", (i) => gi(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (r) => {
      const o = H(r, "adopt_device");
      return T(o.device_id, "adopt_device"), T(o.configuration, "adopt_device"), r;
    }, { device_id: i }), this.previewCtConfig = (i, r, o, a) => this.call("preview_ct_config", (n) => Fe(n, "preview_ct_config"), {
      device_id: i,
      plan_id: r,
      source_sha256: o,
      changes: a
    }), this.setHaLabels = (i, r, o, a) => this.call("set_ha_labels", (n) => n, {
      device_id: i,
      plan_id: r,
      source_sha256: o,
      changes: a
    }), this.transaction = (i, r, o, a) => this.call(i, (n) => Fe(n, i), {
      device_id: r,
      transaction_id: o,
      source_sha256: a
    }), this.applyCtConfig = (i, r, o) => this.transaction("apply_ct_config", i, r, o), this.compileCtConfig = (i, r, o) => this.transaction("compile_ct_config", i, r, o), this.installCtConfig = (i, r, o) => this.transaction("install_ct_config", i, r, o), this.rollbackCtConfig = (i, r, o) => this.transaction("rollback_ct_config", i, r, o), this.startSession = (i) => this.call("start_session", (r) => he(r, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (r) => he(r, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, r, o) => this.call("check_stability", (a) => Zr(a, "check_stability", r, o), { session_id: i, target: r, target_id: o }), this.checkVoltageStability = (i, r) => r.length !== 2 || new Set(r).size !== 2 ? Promise.reject(new Error("check_stability board is invalid")) : this.call("check_stability", (o) => {
      const a = K(o, "check_stability", 2);
      if (a.length !== 2) throw new Error("check_stability response is invalid");
      return a.map((n, l) => Zr(n, "check_stability", "voltage", r[l]));
    }, { session_id: i, target: "voltage", target_ids: r }), this.calibrateVoltage = (i, r, o) => {
      const a = r.map((n) => Da(n.group_key));
      return r.length !== 2 || new Set(r.map((n) => n.group_key)).size !== 2 || a.some((n) => n.length !== 3) || new Set(a.map((n) => Math.floor((n[0] - 1) / 6))).size !== 1 || r.some((n) => !Number.isFinite(n.reference) || n.reference <= 0) ? Promise.reject(new Error("calibrate_voltage board is invalid")) : this.call("calibrate_voltage", (n) => {
        const l = K(n, "calibrate_voltage", 2);
        if (l.length !== 2) throw new Error("calibrate_voltage response is invalid");
        return l.map((c, d) => Xr(c, "calibrate_voltage", {
          target: "voltage",
          groupKey: r[d].group_key,
          reference: r[d].reference
        }));
      }, { session_id: i, references: r, confirm_iteration: o });
    }, this.calibrateCurrent = (i, r, o, a = []) => r.length < 1 || r.length > 3 || new Set(r.map((n) => n.channel)).size !== r.length || new Set(r.map((n) => Ar(n.channel))).size !== 1 || r.some((n) => !Number.isInteger(n.channel) || n.channel < 1 || n.channel > 42 || !Number.isFinite(n.reference) || n.reference <= 0 || !Number.isFinite(n.reporting_multiplier) || n.reporting_multiplier < 1e-3 || n.reporting_multiplier > 1e3) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (n) => Xr(n, "calibrate_current", {
      target: "current",
      references: r.map((l) => ({ channel: l.channel, reference: l.reference, rawReference: l.reference / l.reporting_multiplier }))
    }), {
      session_id: i,
      references: r,
      confirm_iteration: o,
      pending_multipliers: a
    }), this.restartAndVerify = (i, r) => this.call("restart_and_verify", (o) => zs(o, "restart_and_verify", r), { session_id: i }), this.previewCalibratedGains = (i, r, o = []) => this.call("preview_calibrated_gains", (a) => Fe(a, "preview_calibrated_gains"), {
      session_id: i,
      verification_id: r,
      changes: o
    }), this.clearCalibrationFlash = (i, r, o, a) => this.call("clear_calibration_flash", (n) => zs(n, "clear_calibration_flash", a), {
      session_id: i,
      verification_id: r,
      transaction_id: o
    }), this.cancelSession = (i) => this.call("cancel_session", (r) => he(r, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (r) => gi(r, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, r, o, a) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: r,
      source_sha256: o
    }, (n) => Fe(n, "subscribe_config_transaction"), a), this.subscribeSession = (i, r) => this.subscribe("subscribe_session", { session_id: i }, (o) => he(o, "subscribe_session"), r);
  }
  static assertPublicPayload(t, e = !1, i = 0, r = "", o = !1) {
    if (i > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(t)) {
      if (t.length > 100) throw new Error(`unsafe collection ${r || "value"} refused`);
      for (const a of t) this.assertPublicPayload(a, !1, i + 1, r);
      return;
    }
    if (typeof t == "string") {
      const a = t.includes(`
`) || t.includes("\r"), n = r === "redacted_diff" ? 32768 : 4096;
      if (t.length > n || kc.test(t) || Tc.test(t) || a && r !== "redacted_diff" || r === "redacted_diff" && t.includes("\r"))
        throw new Error(`unsafe string ${r || "value"} refused`);
      return;
    }
    if (!(t === null || typeof t != "object"))
      for (const [a, n] of Object.entries(t)) {
        if (a.length > 256 || Fc.test(a)) throw new Error("unsafe property name refused");
        if (a.toLowerCase() === "key" && !o) throw new Error(`private field ${a} refused`);
        if (a.toLowerCase() !== "raw_gain_ct" && Mc.test(a))
          throw new Error(`private field ${a} refused`);
        if (e && i === 0 && a === "changes" && Array.isArray(n)) {
          if (n.length > 100) throw new Error("unsafe collection changes refused");
          for (const l of n) this.assertPublicPayload(l, !1, i + 2, "", !0);
        } else
          this.assertPublicPayload(n, !1, i + 1, a.toLowerCase());
      }
  }
  async call(t, e, i = {}) {
    const r = await this.hass.callWS({
      type: `${Jr}${t}`,
      entry_id: this.entryId,
      ...i
    });
    return Gi.assertPublicPayload(r, Vr.has(t)), e(r);
  }
  subscribe(t, e, i, r) {
    return this.hass.connection.subscribeMessage((o) => {
      Gi.assertPublicPayload(o, Vr.has(t)), r(i(o));
    }, { type: `${Jr}${t}`, entry_id: this.entryId, ...e });
  }
}
function qc(s) {
  return B`
    <section class="review-region" aria-labelledby="review-heading">
      <h2 id="review-heading">Review changes</h2>
      <p class="warning-band">Changing a firmware name can also change its Home Assistant rename/entity-key binding. Review every substitution before Apply.</p>
      <pre aria-label="Redacted substitution diff">${s?.redacted_diff || "No reviewed substitutions yet."}</pre>
      <dl class="status-list">
        <div><dt>Validation</dt><dd>${s?.state === "validated" || s?.progress.includes("config_validated") ? "Validated" : "Pending"}</dd></div>
        <div><dt>Compile</dt><dd>${s?.state === "compiled" || s?.progress.includes("firmware_compiled") ? "Compiled" : "Pending"}</dd></div>
        <div><dt>Install</dt><dd>${s?.state === "install_confirmation_required" ? "Confirmation required" : s?.state ?? "Pending"}</dd></div>
      </dl>
    </section>
  `;
}
function Zc(s, t, e, i, r, o, a) {
  const n = s?.state ?? "previewed";
  return B`
    <section class="step-content" aria-labelledby="step-heading">
      ${qc(s)}
      ${n === "failed" ? B`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${s?.evidence.join(", ") || "The operation did not complete."}</p>
          ${s?.rollback_available ? B`<button class="danger" @click=${r}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${t} ?disabled=${n !== "previewed"}>Apply</button>
        <button class="secondary" @click=${e} ?disabled=${n !== "validated"}>Compile</button>
        <button class="primary" @click=${i} ?disabled=${n !== "install_confirmation_required"}>Install</button>
      </div>
      ${s?.validation_detail ? B`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${s.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${s.validation_detail.error_record_count} records (${s.validation_detail.reported_error_count ?? "unreported"} reported)</dd></div>
        <div><dt>Warnings</dt><dd>${s.validation_detail.warning_record_count} records (${s.validation_detail.reported_warning_count ?? "unreported"} reported)</dd></div>
      </dl>` : ""}
      ${s?.upload_progress?.length ? B`<ul class="upload-progress">${s.upload_progress.map((l) => B`
        <li>${l.stage}: ${l.percentage ?? l.progress ?? "in progress"}${l.percentage != null || l.progress != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" data-action="continue" @click=${a} ?disabled=${n !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const pr = (s, t) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(s.key)) return;
  s.preventDefault();
  const i = [...s.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], r = s.key === "ArrowRight" || s.key === "ArrowDown", o = s.key === "Home" ? 0 : s.key === "End" ? i.length - 1 : (t + (r ? 1 : i.length - 1)) % i.length;
  i[o]?.click(), i[o]?.focus();
}, Ma = (s, t, e) => (s?.default_gain_ct ?? e) == null || !Number.isFinite(t) || t <= 0 ? null : Math.round((s?.default_gain_ct ?? e) / t);
function Xc(s, t, e, i, r, o, a, n = !1, l = !1) {
  const c = Math.ceil(s.channels.length / 6), d = s.channels.filter((h) => h.address.board_index === t).slice(0, 8);
  return B`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: c }, (h, g) => B`
          <button role="tab" id=${`board-tab-${g}`} data-board-tab=${g} aria-selected=${g === t}
            aria-controls="board-panel" tabindex=${g === t ? "0" : "-1"}
            @keydown=${(A) => pr(A, g)}
            @click=${() => i(g)}>${g === 0 ? "Main Board" : `Add-on ${g}`}</button>
        `)}
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <p class="info-band">If you expect to measure more than 65.535 A on a CT, use a multiplier of 2 for a 120 A CT or 4 for a 200 A CT. The multiplier divides the gain and multiplies current and power output by the same amount.</p>
      <div id="board-panel" role="tabpanel" aria-labelledby=${`board-tab-${t}`}>
      <div class="ct-table" role="table" aria-rowcount=${s.channels.length + 1}>
        <div class="ct-header" role="row" aria-rowindex="1">
          <span role="columnheader">CT</span><span role="columnheader">Name</span><span role="columnheader">Model</span><span role="columnheader">Current gain</span><span role="columnheader">Multiplier</span><span role="columnheader">Resulting gain</span><span role="columnheader">Burden</span><span role="columnheader">Status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${d.map((h) => {
    const g = e.get(h.channel) ?? {
      name: h.name,
      modelId: h.selected_model_id ?? "",
      multiplier: h.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, A = s.catalog.presets.find((f) => f.model_id === g.modelId), _ = Ma(A, g.multiplier, g.modelId === "custom" ? g.customGainCt : void 0), m = gr(h, g);
    return B`
              <div class="ct-row" data-ct-row data-ct-group=${h.address.group_index} role="row" aria-rowindex=${h.channel + 1} aria-label=${`CT${h.channel}`}>
                <strong class="ct-index" role="cell">CT${h.channel}</strong>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${h.channel} name`} .value=${g.name}
                  @input=${(f) => r(h.channel, { name: f.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${h.channel} model`} ?disabled=${n}
                  @change=${(f) => {
      const b = f.target.value, E = s.catalog.presets.find((u) => u.model_id === b);
      r(h.channel, {
        modelId: b,
        burdenAcknowledged: h.selection_verified_against_config && b === h.selected_model_id && (b === "custom" || E?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${g.modelId === ""}>Choose model</option>
                  ${s.catalog.presets.map((f) => B`<option value=${f.model_id} ?selected=${g.modelId === f.model_id}>${f.label}</option>`)}
                  <option value="custom" ?selected=${g.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${h.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${h.channel} multiplier`} ?disabled=${n}
                  .value=${String(g.multiplier)} @input=${(f) => r(h.channel, { multiplier: Number(f.target.value) })} /></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${_ ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${A?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${g.expanded} @click=${() => r(h.channel, { expanded: !g.expanded })}>
                  ${g.modelId ? m ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${g.modelId === "custom" ? B`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${h.channel} custom gain`}
                  ?disabled=${n}
                  .value=${g.customGainCt === void 0 ? "" : String(g.customGainCt)}
                  @input=${(f) => r(h.channel, { customGainCt: Number(f.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${h.channel} custom label`} ?disabled=${n} .value=${g.customLabel ?? ""}
                  @input=${(f) => r(h.channel, { customLabel: f.target.value })} /></label>
              </div>` : O}
              ${g.modelId === "custom" || A?.requires_burden_jumper_cut ? B`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${h.channel} burden output acknowledgement`}
                  ?disabled=${n}
                  .checked=${g.burdenAcknowledged}
                  @change=${(f) => r(h.channel, { burdenAcknowledged: f.target.checked })} />
                  I checked the burden-output requirement for CT${h.channel}</label>
              </div>` : O}
              ${A && A.rated_current_a > 65.535 && g.multiplier === 1 ? B`<div class="warning-band" role="status">CT${h.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : O}
              ${g.expanded && A ? B`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${A.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${A.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${A.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${A.notes || (A.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : O}
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${d[0]?.channel ?? 0}–${d.at(-1)?.channel ?? 0} of ${s.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${l || !ed(s, e, n)} @click=${a}>${l ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
function Se(s, t) {
  return s.channels.flatMap((e) => {
    const i = t.get(e.channel);
    if (!i || !gr(e, i)) return [];
    const r = s.catalog.presets.find((a) => a.model_id === i.modelId), o = { channel: e.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (o.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (o.custom_label = i.customLabel.trim()), o.burden_output_acknowledged = i.burdenAcknowledged) : r?.requires_burden_jumper_cut && (o.burden_output_acknowledged = i.burdenAcknowledged), [o];
  });
}
function gr(s, t) {
  return t.name !== s.name || t.modelId !== (s.selected_model_id ?? "") || t.multiplier !== s.reporting_multiplier || t.modelId === "custom" && (Ma(void 0, t.multiplier, t.customGainCt) !== s.raw_gain_ct || (t.customLabel?.trim() ?? "") !== (s.display_label ?? ""));
}
function td(s, t) {
  if (!t.name.trim() || !t.modelId || !Number.isFinite(t.multiplier) || t.multiplier <= 0) return !1;
  if (t.modelId === "custom") return Number.isInteger(t.customGainCt) && t.customGainCt >= 1 && t.customGainCt <= 65535 && !!t.customLabel?.trim() && !/[\r\n]/.test(t.customLabel) && t.burdenAcknowledged;
  const e = s.catalog.presets.find((i) => i.model_id === t.modelId);
  return !!e && (!e?.requires_burden_jumper_cut || t.burdenAcknowledged);
}
function ed(s, t, e = !1) {
  if (e) return [...t].every(([i, r]) => {
    const o = s.channels.find((a) => a.channel === i);
    return !!o && !!r.name.trim() && r.modelId === (o.selected_model_id ?? "") && r.multiplier === o.reporting_multiplier;
  });
  for (const i of s.channels) {
    const r = t.get(i.channel);
    if (!r || gr(i, r) && !td(s, r))
      return !1;
  }
  return !0;
}
const Ut = (s) => s.toFixed(2);
function Ta(s, t, e) {
  const i = [s, !!t?.stable, !!e, !!e?.gain_evidence, !!e], r = i.findIndex((a) => !a);
  return B`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((a, n) => B`<li
    class=${i[n] ? "complete" : n === r ? "active" : "pending"}><span
      class="progress-number">${n + 1}</span><span>${a}</span></li>`)}</ol>`;
}
function ka(s, t) {
  const e = Object.entries(s?.calibration_sources ?? {}).filter(([i]) => t === void 0 || t.includes(i));
  return B`<section class="measurement-evidence calibration-source" aria-label="Current calibration source">
    <h3>Current calibration source</h3>
    ${e.length ? B`<table><thead><tr><th>Chip</th><th>Source</th><th>Saved in flash</th></tr></thead><tbody>
      ${e.map(([i, r]) => B`<tr><td>${i}</td><td>${r === "configuration" ? "Configuration" : r === "flash" ? "Saved flash" : "Unknown"}</td><td>${r === "flash" ? "Yes" : r === "configuration" ? "No" : "Unknown"}</td></tr>`)}
    </tbody></table>` : B`<p>Calibration source is not available.</p>`}
  </section>`;
}
function ur(s, t) {
  if (!s) return O;
  const e = s.target === "voltage" ? "V" : "A";
  return B`<section class="measurement-evidence" aria-label=${`${s.target} ${s.target_id} stability evidence`}>
    <h3>Stability evidence · ${s.target_id}</h3>
    ${s.windows.map((i, r) => B`<dl>
      <div><dt>${t?.[r] ?? (s.target === "voltage" ? `V${r % 3 + 1}` : `A${r + 1}`)}</dt>
        <dd>${i.samples.map((o) => `${Ut(o)} ${e}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}
function fr(s) {
  return s ? B`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${s.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${s.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${s.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${s.before_values.map(Ut).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${s.after_values.map(Ut).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${s.error_percent_values.map((t) => `${Ut(t)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${s.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${s.gain_evidence ? B`<h4>Gain evidence · ${s.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${s.gain_evidence.phases?.map((t) => B`<tr><td>${t.phase}</td><td>${Ut(t.measured_voltage)}</td><td>${Ut(t.measured_current)}</td><td>${Ut(t.reference_voltage)}</td><td>${Ut(t.reference_current)}</td><td>${t.old_voltage_gain} → ${t.new_voltage_gain}</td><td>${t.old_current_gain} → ${t.new_current_gain}</td></tr>`) ?? O}
      </tbody></table><p>Saved in flash: ${s.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : B`<p>Gain evidence unavailable.</p>`}
  </section>` : O;
}
function id(s, t, e, i, r, o, a, n, l, c, d, h, g, A, _) {
  const m = s?.ct_count ?? t?.channels.length ?? 6, f = Math.floor((i - 1) / 6), E = Math.floor((i - 1) / 3) * 3 + 1, u = Array.from({ length: 3 }, (x, S) => E + S).filter((x) => x <= m), I = u.filter((x) => (r.get(x) ?? 0) > 0), D = f === 0 ? ["meter_main1", "meter_main2"] : [`addon${f}_1`, `addon${f}_2`], w = t === null, M = o !== null && Number.isFinite(o) && o >= 1e-3 && o <= 1e3, R = I.length > 0 && (!w || M);
  return B`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Ta(R, a, n)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(m / 6) }, (x, S) => B`<button role="tab"
          id=${`current-board-tab-${S}`} aria-controls="current-board-panel"
          aria-selected=${S === f} tabindex=${S === f ? "0" : "-1"}
          @keydown=${(P) => pr(P, S)}
          @click=${() => l(S * 6 + 1)}>${S === 0 ? "Main Board" : `Add-on ${S}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${f}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((x) => {
    const S = f * 6 + x * 3 + 1;
    return B`<button
          aria-pressed=${S === E} @click=${() => l(S)}>Group ${f * 2 + x + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${E}–CT${E + 2}</h2>
      ${ka(e, D)}
      <div class="reference-block">
        ${u.map((x) => B`<label>CT${x} reference
          <input data-current-reference=${x} aria-label=${`CT${x} reference`} type="number" min="0.01" step="0.01"
            .value=${r.has(x) ? String(r.get(x)) : ""}
            @input=${(S) => {
    const P = S.target;
    c(x, P.value === "" ? null : Number(P.value));
  }} /></label>`)}
      ${w ? B`<label>Reporting multiplier <input data-role="reporting-multiplier" type="number" min="0.001" max="1000" step="0.001" required .value=${o === null ? "" : String(o)} @input=${(x) => {
    const S = Number(x.target.value);
    d(Number.isFinite(S) && S >= 1e-3 && S <= 1e3 ? S : null);
  }} /></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
        <button class="primary" @click=${g} ?disabled=${!R || !a?.stable || (n?.iteration ?? 0) >= 3 || !!(n && !n.retry_allowed && n.iteration > 0)}>${n?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${h} ?disabled=${!R}>Check stability</button></div>
      ${a ? B`<div class=${a.stable ? "success-band" : "warning-band"} role="status">${a.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${ur(a, I.map((x) => `CT${x}`))}
      ${fr(n)}
      ${n?.state.includes("indeterminate") ? B`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${A}>Reconnect and inspect</button><button class="danger" @click=${_}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Fa = async (s) => {
  let t;
  Promise.resolve().then(() => Fp).then((function(i) {
    return i.i;
  }));
  try {
    t = await navigator.serial.requestPort();
  } catch (i) {
    return i.name === "NotFoundError" ? void Promise.resolve().then(() => Pp).then(((r) => r.openNoPortPickedDialog((() => Fa(s))))) : void alert(`Error: ${i.message}`);
  }
  if (!t) return;
  try {
    await t.open({ baudRate: 115200, bufferSize: 8192 });
  } catch (i) {
    return void alert(i.message);
  }
  const e = document.createElement("ewt-install-dialog");
  e.port = t, e.manifestPath = s.manifest || s.getAttribute("manifest"), e.overrides = s.overrides, e.addEventListener("closed", (() => {
    t.close();
  }), { once: !0 }), document.body.appendChild(e);
};
let ui = class Ae extends HTMLElement {
  connectedCallback() {
    if (this.renderRoot) return;
    if (this.renderRoot = this.attachShadow({ mode: "open" }), !Ae.isSupported || !Ae.isAllowed) return this.toggleAttribute("install-unsupported", !0), void (this.renderRoot.innerHTML = Ae.isAllowed ? "<slot name='unsupported'>Your browser does not support installing things on ESP devices. Use Mozilla Firefox, Google Chrome or Microsoft Edge.</slot>" : "<slot name='not-allowed'>You can only install ESP devices on HTTPS websites or on the localhost.</slot>");
    this.toggleAttribute("install-supported", !0);
    const t = document.createElement("slot");
    t.addEventListener("click", (async (i) => {
      i.preventDefault(), Fa(this);
    })), t.name = "activate";
    const e = document.createElement("button");
    if (e.innerText = "Connect", t.append(e), "adoptedStyleSheets" in Document.prototype && "replaceSync" in CSSStyleSheet.prototype) {
      const i = new CSSStyleSheet();
      i.replaceSync(Ae.style), this.renderRoot.adoptedStyleSheets = [i];
    } else {
      const i = document.createElement("style");
      i.innerText = Ae.style, this.renderRoot.append(i);
    }
    this.renderRoot.append(t);
  }
};
ui.isSupported = "serial" in navigator, ui.isAllowed = window.isSecureContext, ui.style = `
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
  }`, customElements.define("esp-web-install-button", ui);
const Oa = "https://circuitsetup.github.io/ESPWebInstaller/", sd = new URL("manifests/firmware_index.json", Oa).href, Pa = 256 * 1024, rd = 100, od = 20, Ua = 160, ad = 1e4, nd = /^[a-z0-9][a-z0-9_-]{0,127}$/, ld = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, Qa = /[\u0000-\u001F\u007F-\u009F]/;
function Et(s) {
  throw new Error(`Invalid firmware index: ${s}`);
}
function to(s) {
  return typeof s == "object" && s !== null && !Array.isArray(s);
}
function ds(s) {
  return typeof s == "string" && s.length <= Ua && !Qa.test(s);
}
function Ha(s) {
  if (!nd.test(s)) throw new Error("Invalid firmware product ID");
}
function Ga(s) {
  if (!ld.test(s) || s.length > Ua || Qa.test(s))
    throw new Error("Invalid firmware version");
}
function $a(s) {
  return new TextEncoder().encode(s).byteLength;
}
function cd(s) {
  Array.isArray(s) || Et("top level must be an array"), $a(JSON.stringify(s)) > Pa && Et("payload is too large"), s.length > rd && Et("too many products");
  const t = /* @__PURE__ */ new Set();
  return s.map((e) => {
    (!to(e) || Object.keys(e).length !== 3 || !Object.hasOwn(e, "productId") || !Object.hasOwn(e, "name") || !Object.hasOwn(e, "versions")) && Et("invalid product");
    const { productId: i, name: r, versions: o } = e;
    (!ds(i) || !ds(r) || !Array.isArray(o)) && Et("invalid product fields"), Ha(i), t.has(i) && Et("duplicate product ID"), t.add(i), o.length > od && Et("too many versions");
    const a = /* @__PURE__ */ new Set();
    return {
      productId: i,
      name: r,
      versions: o.map((n) => ((!to(n) || Object.keys(n).length !== 1 || !Object.hasOwn(n, "version") || !ds(n.version)) && Et("invalid version"), Ga(n.version), a.has(n.version) && Et("duplicate version"), a.add(n.version), { version: n.version }))
    };
  });
}
async function dd(s = globalThis.fetch, t) {
  const e = new AbortController(), i = () => e.abort();
  t?.aborted ? i() : t?.addEventListener("abort", i, { once: !0 });
  const r = setTimeout(i, ad);
  try {
    const o = await s(sd, { cache: "no-cache", mode: "cors", signal: e.signal });
    if (!o.ok) throw new Error(`Firmware index request failed (${o.status})`);
    const a = await o.text();
    return $a(a) > Pa && Et("payload is too large"), cd(JSON.parse(a));
  } finally {
    clearTimeout(r), t?.removeEventListener("abort", i);
  }
}
function hd(s, t) {
  if (!Number.isInteger(s) || s < 0 || s > 6) return [];
  const e = s === 0 ? "6chan_energy_meter_main" : s === 1 ? "6chan_energy_meter_1-addon" : `6chan_energy_meter_${s}-addons`;
  return t === "wifi" ? [s === 0 ? `${e}_board` : e] : t === "ethernet_lilygo" ? [`${e}_ethernet`] : s === 0 ? [`${e}_ethernet_waveshare`, `${e}_ethernet_ws`] : [`${e}_ethernet_waveshare`];
}
function Ad(s, t) {
  const e = (o) => o.split(/[-.]/).map((a) => Number.isNaN(Number(a)) ? a : Number.parseInt(a, 10)), i = e(s), r = e(t);
  for (let o = 0; o < Math.max(i.length, r.length); o += 1) {
    const a = i[o], n = r[o];
    if (a === void 0) return -1;
    if (n === void 0) return 1;
    if (a > n) return -1;
    if (a < n) return 1;
  }
  return 0;
}
function pd(s, t, e) {
  const i = /* @__PURE__ */ new Map();
  for (const r of hd(t, e)) {
    const o = s.find((a) => a.productId === r);
    for (const a of o?.versions ?? [])
      i.has(a.version) || i.set(a.version, { productId: r, version: a.version });
  }
  return [...i.values()].sort((r, o) => Ad(r.version, o.version));
}
function gd(s, t) {
  return s.find((e) => e.version === t)?.version ?? s[0]?.version ?? null;
}
function ud(s, t) {
  Ha(s), Ga(t);
  const e = new URL(`manifests/manifest_${s}-${t}.json`, Oa);
  if (e.origin !== "https://circuitsetup.github.io" || !e.pathname.startsWith("/ESPWebInstaller/manifests/"))
    throw new Error("Invalid firmware manifest URL");
  return e.href;
}
function fd(s) {
  if (!s) return O;
  try {
    const t = ud(s.productId, s.version);
    return B`
      <esp-web-install-button class="esp-web-installer" .manifest=${t}>
        <button slot="activate" aria-label="Install firmware">Install firmware</button>
        <p slot="unsupported">Use a supported Chromium browser with Web Serial to install firmware.</p>
        <p slot="not-allowed">Open this helper on HTTPS or localhost to install firmware.</p>
      </esp-web-install-button>
    `;
  } catch {
    return O;
  }
}
function md(s, t, e, i, r, o) {
  const a = s.includes("failed") || s.includes("indeterminate");
  return B`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, and entity bindings.</p>
      <div class="status-band" role="status">${s || "Ready for restart verification"}</div>
      ${t ? B`<dl class="status-list"><div><dt>Verification</dt><dd>${t.verification_id}</dd></div><div><dt>Authority</dt><dd>${t.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${t.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${t.source_handoff_available ? t.config_filename : "Unavailable in runtime-only mode"}</dd></div></dl>` : ""}
      ${s === "cancelled" ? B`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${a ? B`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${e ? B`<button class="danger" data-action="rollback" @click=${r}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${o}>Back</button><button class="primary" @click=${i} ?disabled=${s === "cancelled" || !!t}>${s.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function vd(s) {
  return s ? s.preflight.issues.length ? B`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${s.preflight.issues.map((t) => B`<li>${t.role}: ${t.detail}</li>`)}</ul></div>` : B`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : B`<p>Starting a calibration session…</p>`;
}
function _d(s, t, e, i, r, o, a = !1) {
  return B`
    <section class="step-content" aria-labelledby="step-heading">
      ${vd(s)}
      ${s?.state === "cancelled" ? B`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
      <ul class="safety-list">
        <li>Mains voltage is hazardous.</li>
        <li>Use a properly rated true-RMS reference instrument.</li>
        <li>Clamp the same conductor represented by the selected CT and keep the load stable.</li>
        <li>Do not work inside an energized panel unless qualified.</li>
        <li>The helper cannot electrically verify a burden-jumper change.</li>
      </ul>
      <section class="warning-band" aria-labelledby="safety-heading">
        <h2 id="safety-heading">Safety acknowledgement</h2>
        <p>Confirm the test setup is safe, isolated, and accessible before calibration.</p>
        <label class="check-row"><input type="checkbox" .checked=${t} @change=${(n) => e(n.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${r}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" @click=${i} ?disabled=${a || s?.state === "cancelled" || !t || !!s?.preflight.issues.length}>${a ? "Loading calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const eo = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Ed = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function io(s, t, e, i, r, o, a, n, l = "", c = !1) {
  return B`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Configure an existing device</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        ${s?.devices.length ? B`<div class="meter-list">
          ${s.devices.map((d) => B`
            <div class="meter-row">
              <span><strong>${d.title}</strong><small>${d.project_name} · ${d.project_version ?? "version unavailable"}</small></span>
              <span>Device Builder: ${d.configuration ? "Yes" : d.importable ? "Yes — import available" : "No"}</span>
              ${d.importable && !d.configuration ? B`<button class="secondary" ?disabled=${!!l}
                @click=${() => n(d.entry_id)}>Import</button>` : ""}
              <button class="primary" data-action="configure-device" ?disabled=${!!l}
                @click=${() => a(d.entry_id)}>${l === `topology:${d.entry_id}` ? "Loading topology…" : "Configure"}</button>
            </div>
          `)}
        </div>` : B`<div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>`}
        <button class="rescan" data-action="rescan" ?disabled=${!!l} @click=${o}>${l === "rescan" ? "Rescanning…" : "Rescan for device"}</button>
      </section>
      ${c ? "" : B`<hr />
      <h2>Set up a new device</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (d, h) => B`
            <label class=${h === t ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(h)}
                .checked=${h === t} @change=${() => i(h)} />
              <span>${h}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${eo.map(([d, h]) => B`
            <label class=${d === e ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${d}
                .checked=${d === e} @change=${() => r(d)} />
              <span>${h}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>Add-on boards</dt><dd>${t}</dd></div>
          <div><dt>Connection</dt><dd>${eo.find(([d]) => d === e)?.[1]}</dd></div>
          ${Ed.slice(0, t).map((d, h) => B`<div><dt>Add-on ${h + 1}</dt><dd>${d}</dd></div>`)}
        </dl>
      </section>
      <p class="info-band">Use Web Serial in a supported Chromium browser and a USB data cable to install firmware.</p>
      <p class="info-band">${e === "wifi" ? "ESP Web Tools asks for your Wi-Fi network and password and sends them directly to your meter over USB. This helper does not store or send those credentials to Home Assistant. Complete the ESP Web Tools network setup and Add to Home Assistant when offered." : "Install firmware over USB, connect Ethernet and power, wait for an address, complete Add to Home Assistant, then return here. This helper continues when discovery reports your meter."}</p>
      `}
    </section>
  `;
}
function La(s, t, e, i, r, o = null) {
  return B`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${s?.evidence.map((a) => B`<li>${a.source}: ${a.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${t?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([a, n]) => B`<div data-target=${a}>${ur(n)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...r.entries()].map(([a, n]) => B`<div data-target=${a}>${fr(n)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${e?.evidence.join(", ") || "No build evidence."}</p><p>${e?.progress.join(", ") || "No transaction progress."}</p>
          ${e?.validation_detail ? B`<p>Validation code ${e.validation_detail.code ?? "unavailable"}; ${e.validation_detail.error_record_count} error records; ${e.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${e?.upload_progress?.length ? B`<ul>${e.upload_progress.map((a) => B`<li>${a.stage}: ${a.percentage ?? a.progress ?? "in progress"}${a.percentage != null || a.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Authority source</h3><p>${o?.source_authority.replaceAll("_", " ") ?? "Not yet established"}</p><p>${o ? `Verification ${o.verification_id}, generation ${o.connection_generation}` : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function wd(s, t, e, i, r, o, a, n, l) {
  const c = o?.source_authority === "saved_flash" && o.config_filename && (o.source_handoff_available || o.source_handoff_firmware_installed);
  return B`
    <section class="step-content" aria-labelledby="step-heading">
      ${o?.source_authority === "configuration" ? B`<div class="success-band" role="status">Calibration saved to YAML; flash values cleared.</div>` : o ? B`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : B`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${s?.ct_count ?? "—"} CTs in ${s?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${a ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${o?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${o?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${La(s, t, e, i, r, o)}
      <footer class="action-footer"><button class="secondary" @click=${l}>Back</button>
        ${c ? B`<button class="primary" data-action="save-calibration" @click=${n}>${o?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : ""}
      </footer>
    </section>
  `;
}
function Ya(s) {
  const t = s.addon_count, e = s.evidence.map((i) => i.source);
  return t < 0 || t > 6 || s.board_count !== t + 1 || s.ct_count !== 6 * (t + 1) || s.group_count !== 2 * (t + 1) || s.evidence.length < 1 || s.evidence.length > 5 || new Set(e).size !== e.length || !e.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || s.evidence.some((i) => i.addon_count !== t);
}
function bd(s, t, e, i, r = !1, o = !1) {
  const a = r || Ya(s);
  return B`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="identity-strip">
        <strong>${s.project_name}</strong>
        <span>Version ${t ?? "unavailable"}</span>
        <span>${s.board_count} boards</span><span>${s.ct_count} CTs</span>
        <span>${s.group_count} groups</span><span>${s.connection_type}</span>
      </div>
      <h2>Topology evidence</h2>
      <table class="evidence-table">
        <thead><tr><th>Source</th><th>Add-ons</th><th>Evidence</th></tr></thead>
        <tbody>${s.evidence.map((n) => B`
          <tr><td>${n.source.replaceAll("_", " ")}</td><td>${n.addon_count}</td><td>${n.detail}</td></tr>
        `)}</tbody>
      </table>
      ${a ? B`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : B`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${e}>Back</button>
        ${a ? "" : B`<button class="primary" data-action="continue" ?disabled=${o} @click=${i}>${o ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
function yd(s, t, e, i, r, o, a, n, l, c, d, h, g) {
  const A = s?.voltage_layout === "two_voltages" ? 2 : 1, _ = i.slice(0, A).every((f) => Number.isFinite(f) && f > 0), m = e === 0 ? ["meter_main1", "meter_main2"] : [`addon${e}_1`, `addon${e}_2`];
  return B`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Ta(_, r, o)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: s?.board_count ?? 1 }, (f, b) => B`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${b}`} aria-controls="voltage-board-panel"
          aria-selected=${b === e} tabindex=${b === e ? "0" : "-1"}
          @keydown=${(E) => pr(E, b)}
          @click=${() => n(b)}>${b === 0 ? "Main Board" : `Add-on ${b}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${e}`}>
      <h2>Calibrate Voltage</h2>
      ${ka(t, m)}
      <div class="reference-block">
        ${Array.from({ length: A }, (f, b) => B`<label>${A === 1 ? "Trusted instrument reference" : `Voltage ${b + 1} trusted reference`}
          <input type="number" min="0.01" step="0.01" .value=${i[b] ? String(i[b]) : ""}
            @input=${(E) => l(b, Number(E.target.value))} /></label>`)}
        <button class="primary" @click=${d} ?disabled=${a || !_ || !r?.stable || !!(o && !o.retry_allowed && o.iteration > 0)}>${o?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${c} ?disabled=${a}>${a ? "Loading live voltage data…" : "Check stability"}</button></div>
      ${r ? B`<div class=${r.stable ? "success-band" : "warning-band"} role="status">${r.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${ur(r)}
      ${fr(o)}
      ${o?.state === "indeterminate" ? B`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${h}>Reconnect and inspect</button><button class="danger" @click=${g}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Cd = cc`
  :host {
    --navy: #09284f;
    --orange: #c94f00;
    --orange-on-navy: #ff8a3d;
    --teal: #077f7a;
    --focus: #1769d3;
    --focus-on-navy: #4893f2;
    --muted: #5c687b;
    --band: #f5f7fa;
    --border: #d7dce3;
    --danger: #b42318;
    display: block;
    min-height: 100vh;
    color: var(--navy);
    background: #fff;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 15px;
    line-height: 1.45;
    overflow-x: hidden;
  }
  * { box-sizing: border-box; }
  button, input, select { font: inherit; color: inherit; }
  button, input, select, summary { min-height: 44px; }
  button { border: 1px solid #aeb7c4; background: #fff; border-radius: 5px; padding: 0.65rem 1rem; cursor: pointer; font-weight: 650; }
  button:hover:not(:disabled) { border-color: #1769d3; }
  button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  .primary { color: #fff; background: var(--orange); border-color: var(--orange); }
  .secondary { color: var(--navy); background: #fff; border-color: #42658d; }
  .danger { color: var(--danger); border-color: var(--danger); background: #fff; }
  .app { display: grid; grid-template-columns: 232px minmax(0, 1fr); min-height: 100vh; }
  aside.workflow { background: var(--navy); color: #fff; padding: 28px 24px; }
  .brand { color: var(--orange-on-navy); font-size: 20px; font-weight: 750; margin-bottom: 36px; }
  nav ol { list-style: none; margin: 0; padding: 0; }
  nav li { position: relative; min-height: 60px; }
  nav li:not(:last-child)::after { content: ""; position: absolute; left: 17px; top: 38px; width: 1px; height: 28px; background: #8fa2b9; }
  .step-button { display: grid; grid-template-columns: 36px 1fr; gap: 10px; align-items: center; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; font-weight: 500; }
  .step-button:focus-visible { outline-color: var(--focus-on-navy); }
  .step-button .number { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #d7e1ec; border-radius: 50%; }
  li.current .step-button { color: var(--orange-on-navy); font-weight: 750; }
  li.current .number { color: #fff; background: var(--orange); border-color: var(--orange); }
  main { min-width: 0; padding: 30px 34px 88px; }
  .mobile-progress { display: none; }
  .product-title { font-size: 32px; line-height: 1.15; font-weight: 760; margin: 0 0 22px; }
  h1 { margin: 0 0 20px; font-size: 26px; line-height: 1.2; }
  h2 { margin: 22px 0 8px; font-size: 18px; }
  h3 { font-size: 15px; }
  p { color: #344158; }
  .step-content { max-width: 1320px; }
  fieldset { border: 0; margin: 0 0 26px; padding: 0; }
  legend { font-size: 21px; font-weight: 750; }
  .name-mode { display: grid; gap: 8px; }
  .name-mode label { display: flex; align-items: center; gap: 8px; }
  .name-mode input { margin: 0; }
  .choice-field > p { margin: 3px 0 12px; }
  .addon-options { display: grid; grid-template-columns: repeat(7, minmax(52px, 1fr)); gap: 12px; max-width: 760px; }
  .addon-options label, .connection-options label { display: flex; align-items: center; border: 1px solid #b8c1cc; border-radius: 5px; cursor: pointer; }
  .addon-options label:focus-within, .connection-options label:focus-within, .meter-row:focus-within { outline: 3px solid var(--focus); outline-offset: 2px; }
  .addon-options label { justify-content: center; min-height: 56px; font-size: 18px; font-weight: 700; }
  .addon-options input, .connection-options input, .meter-row input { position: absolute; opacity: 0; pointer-events: none; }
  .addon-options .selected { color: #fff; background: var(--navy); border-color: var(--navy); }
  .connection-options { display: grid; gap: 10px; max-width: 760px; }
  .connection-options label { min-height: 58px; padding: 0 20px; font-size: 17px; font-weight: 700; }
  .connection-options label::before { content: ""; width: 22px; height: 22px; margin-right: 22px; border: 2px solid #aeb7c4; border-radius: 50%; }
  .connection-options .selected { border-color: #1769d3; }
  .connection-options .selected::before { border: 6px solid #1769d3; }
  .summary-band, .info-band, .success-band, .warning-band, .status-band { background: var(--band); border: 1px solid var(--border); border-radius: 5px; padding: 14px 16px; }
  dl { margin: 0; }
  dl div { display: flex; gap: 12px; }
  dt { font-weight: 700; }
  dd { margin: 0; }
  .summary-band strong, .success-band { color: var(--teal); }
  .esp-web-installer {
    --esp-tools-button-color: var(--orange);
    --esp-tools-button-text-color: #fff;
    --esp-tools-button-border-radius: 5px;
  }
  .esp-web-installer [slot="activate"] { min-height: 44px; color: #fff; background: var(--orange); border-color: var(--orange); }
  .esp-web-installer [slot="activate"]:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .error-panel, .recovery-panel { display: grid; gap: 6px; margin-top: 16px; padding: 16px; border: 1px solid var(--danger); border-radius: 5px; color: var(--danger); background: #fff; }
  .error-panel span, .error-panel li, .recovery-panel p { color: #4a3340; }
  .meter-list { display: grid; gap: 10px; }
  .meter-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 16px; border: 1px solid var(--border); cursor: pointer; }
  .meter-row.selected { border-color: #1769d3; background: var(--band); }
  .meter-row small { display: block; color: var(--muted); }
  .identity-strip { display: flex; flex-wrap: wrap; gap: 16px 28px; padding: 14px 18px; border: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 12px; border-bottom: 1px solid var(--border); text-align: left; }
  .board-tabs, .target-tabs { display: flex; gap: 18px; overflow-x: auto; border-bottom: 1px solid var(--border); }
  .board-tabs button, .target-tabs button { flex: 0 0 auto; border: 0; border-radius: 0; }
  .board-tabs button[aria-selected="true"], .target-tabs button[aria-pressed="true"] { color: #1769d3; border-bottom: 2px solid #1769d3; }
  .ct-table { border: 1px solid var(--border); }
  .ct-header, .ct-row { display: grid; grid-template-columns: .45fr 1.45fr 1.4fr .8fr .8fr .9fr .7fr .9fr; align-items: center; gap: 14px; padding: 11px 16px; }
  .ct-header { font-weight: 700; background: var(--band); }
  .ct-row { min-height: 66px; border-top: 1px solid var(--border); }
  .ct-index { font-weight: 750; }
  .ct-row input, .ct-row select { width: 100%; min-width: 0; padding: 8px; border: 1px solid #b8c1cc; border-radius: 4px; }
  .row-toggle { color: var(--teal); border: 0; padding: 4px; }
  .mobile-label { display: none; }
  .ct-detail { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 32px; padding: 16px 30px; background: var(--band); border-top: 1px solid var(--border); }
  .row-count { color: var(--muted); padding-left: 12px; }
  pre { max-height: 260px; overflow: auto; padding: 16px; color: #243047; background: var(--band); border: 1px solid var(--border); white-space: pre-wrap; }
  .status-list, .summary-list { display: grid; gap: 8px; }
  .confirmation-actions { display: flex; gap: 12px; margin-top: 20px; }
  .check-row { display: flex; align-items: center; gap: 10px; }
  .reference-block { display: grid; max-width: 420px; gap: 12px; }
  .reference-block label { display: grid; gap: 6px; font-weight: 700; }
  .reference-block .primary { justify-self: start; }
  .stability-line { display: block; margin: 18px 0 10px; }
  .calibration-step input { padding: 10px; border: 1px solid #b8c1cc; }
  .group-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
  .group-grid section { border: 1px solid var(--border); }
  .group-grid h2 { margin: 0; padding: 10px; border-bottom: 1px solid var(--border); }
  .group-grid button { width: 33.333%; border-width: 0 1px 0 0; border-radius: 0; }
  .group-grid button.selected { color: var(--orange); border-color: var(--orange); }
  .progress-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; margin: 20px 0; padding: 18px; border: 1px solid var(--border); list-style: none; }
  .progress-steps li { display: flex; gap: 6px; padding: 8px; }
  .progress-steps .complete { color: #65758b; background: #f3f5f7; }
  .progress-steps .active { color: #7a3500; background: #fff0df; font-weight: 700; }
  .progress-steps .pending { color: var(--navy); }
  .measurement-evidence { margin: 14px 0; padding: 12px 16px; border: 1px solid var(--border); background: var(--band); }
  .measurement-evidence h3 { margin-top: 0; }
  .measurement-evidence dl, .evidence-list, .upload-progress { display: grid; gap: 6px; }
  details { margin-top: 18px; border: 1px solid var(--border); }
  summary { display: flex; align-items: center; padding: 12px 16px; cursor: pointer; font-weight: 700; }
  .technical-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 28px; padding: 0 16px 16px; }
  .action-footer { position: fixed; z-index: 2; right: 0; bottom: 0; left: 232px; display: flex; justify-content: space-between; padding: 14px 34px; background: #fff; border-top: 1px solid var(--border); }
  .action-footer.single { justify-content: flex-end; }
  .rescan { color: #fff; background: var(--teal); border-color: var(--teal); }
  .sr-status { position: fixed; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; } }
  @media (max-width: 720px) {
    .app { display: block; }
    aside.workflow { display: none; }
    aside.workflow.mobile-open { display: block; position: fixed; z-index: 5; inset: 0 18% 0 0; overflow-y: auto; box-shadow: 10px 0 24px rgb(0 0 0 / 28%); }
    main { padding: 22px 18px 92px; }
    .product-title { font-size: 23px; text-align: center; padding-bottom: 18px; border-bottom: 1px solid var(--border); }
    .mobile-progress { display: flex; justify-content: space-between; align-items: center; margin: 0 -18px 24px; padding: 12px 18px; background: var(--band); border-bottom: 1px solid var(--border); }
    h1 { font-size: 22px; }
    .addon-options { grid-template-columns: repeat(7, minmax(42px, 1fr)); gap: 6px; }
    .addon-options label { min-height: 52px; }
    .ct-header { display: none; }
    .ct-row { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .ct-row > * { min-width: 0; }
    .mobile-label { display: block; color: var(--muted); font-size: 12px; font-weight: 700; }
    .ct-detail, .technical-grid, .group-grid { grid-template-columns: 1fr; }
    .progress-steps { grid-template-columns: 1fr; gap: 8px; }
    .action-footer { left: 0; padding: 12px 18px; }
    .identity-strip, .confirmation-actions { align-items: stretch; flex-direction: column; }
    .evidence-table { display: block; overflow-x: auto; }
  }
`, Re = [
  ["setup", "Setup Device"],
  ["discover", "Discover"],
  ["topology", "Topology"],
  ["ct", "CT Settings"],
  ["safety", "Safety"],
  ["voltage", "Voltage"],
  ["current", "Current"],
  ["restart", "Restart"],
  ["build", "Flash & Verify"],
  ["summary", "Summary"]
];
class Bd extends Ge {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.calibrationHandoff = !1, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.firmwareIndex = null, this.firmwareCatalogState = "idle", this.firmwareCatalogError = "", this.selectedEspHomeVersion = null, this.resolvedFirmwareOptions = [], this.firmwareFetchController = null, this.setupDeviceIds = /* @__PURE__ */ new Set(), this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.sessionStarting = !1, this.pendingAction = "", this.voltageBusy = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = Cd;
  }
  static {
    this.properties = {
      hass: { attribute: !1 },
      panel: { attribute: !1 }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    const t = ++this.connectionGeneration;
    this.loadFirmwareIndex(), this.ensureApi(t);
  }
  disconnectedCallback() {
    ++this.connectionGeneration, ++this.operationGeneration, ++this.transactionSubscriptionScope, ++this.sessionSubscriptionScope;
    for (const t of this.unsubs.splice(0))
      try {
        t();
      } catch {
      }
    this.transactionUnsub = null, this.sessionUnsub = null, this.api = null, this.firmwareFetchController?.abort(), this.firmwareFetchController = null, this.firmwareIndex = null, this.firmwareCatalogState = "idle", this.firmwareCatalogError = "", this.resolvedFirmwareOptions = [], this.setupDeviceIds = /* @__PURE__ */ new Set(), super.disconnectedCallback();
  }
  updated(t) {
    (t.has("hass") || t.has("panel")) && this.isConnected && this.ensureApi(this.connectionGeneration), this.error ? this.shadowRoot?.querySelector("[role=alert]")?.focus() : this.focusHeading && (this.focusHeading = !1, this.shadowRoot?.querySelector("#step-heading")?.focus());
  }
  async ensureApi(t) {
    if (this.api || !this.isConnected || !this.hass || !this.panel?.config.entry_id) return;
    const e = new Gi(this.hass, this.panel.config.entry_id);
    this.api = e;
    try {
      const i = await e.setupStatus();
      if (!this.owns(t, e)) return;
      this.setup = i, this.setupDeviceIds = new Set(i.devices.map((o) => o.entry_id));
      const r = this.setup.installer_intent;
      r && (this.addonCount = r.addon_count, this.connection = r.connection_type, this.refreshFirmwareOptions()), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.firstDeviceId(this.setup.devices)), await this.ownSubscription(e.subscribeSetup((o) => {
        if (!this.owns(t, e)) return;
        const a = o.devices.filter((n) => !this.setupDeviceIds.has(n.entry_id)).sort((n, l) => n.entry_id.localeCompare(l.entry_id));
        this.setup = o, this.setupDeviceIds = new Set(o.devices.map((n) => n.entry_id)), this.step === "setup" && a.length && (this.selectDevice(a[0].entry_id), this.navigate("discover"), this.announcement = "CircuitSetup energy meter discovered."), this.requestUpdate();
      }), t, e), this.transaction && await this.subscribeTransaction(t), this.session && this.session.state !== "cancelled" && await this.subscribeSession(t);
    } catch (i) {
      this.owns(t, e) && this.fail(i, "Setup status could not be loaded.");
    }
    this.requestUpdate();
  }
  owns(t, e) {
    return this.isConnected && t === this.connectionGeneration && e === this.api;
  }
  ownsFirmwareCatalog(t, e) {
    return this.isConnected && t === this.connectionGeneration && e === this.firmwareFetchController;
  }
  loadFirmwareIndex() {
    if (this.firmwareCatalogState === "loading" || this.firmwareIndex) return;
    const t = this.connectionGeneration, e = new AbortController();
    this.firmwareFetchController?.abort(), this.firmwareFetchController = e, this.firmwareCatalogState = "loading", this.firmwareCatalogError = "", this.requestUpdate(), dd(globalThis.fetch, e.signal).then((i) => {
      this.ownsFirmwareCatalog(t, e) && (this.firmwareIndex = i, this.firmwareFetchController = null, this.firmwareCatalogState = "ready", this.refreshFirmwareOptions());
    }).catch(() => {
      this.ownsFirmwareCatalog(t, e) && (this.firmwareFetchController = null, this.firmwareCatalogState = "error", this.firmwareCatalogError = "Firmware catalog could not be loaded.", this.requestUpdate());
    });
  }
  refreshFirmwareOptions() {
    const t = this.firmwareIndex ? pd(this.firmwareIndex, this.addonCount, this.connection) : [], e = this.selectedEspHomeVersion, i = gd(t, e);
    this.resolvedFirmwareOptions = t, this.selectedEspHomeVersion = i, e && i !== e && (this.announcement = i ? `Firmware version changed to ${i}.` : "No firmware version is available for this hardware."), this.requestUpdate();
  }
  selectFirmwareVersion(t) {
    this.resolvedFirmwareOptions.some((e) => e.version === t) && (this.selectedEspHomeVersion = t, this.requestUpdate());
  }
  retryFirmwareIndex() {
    this.firmwareCatalogError = "", this.firmwareCatalogState = "idle", this.requestUpdate(), this.loadFirmwareIndex();
  }
  selectedFirmware() {
    return this.resolvedFirmwareOptions.find((t) => t.version === this.selectedEspHomeVersion) ?? null;
  }
  ownsOperation(t, e, i) {
    return t === this.operationGeneration && e === this.api && i === this.selectedDeviceId;
  }
  async ownSubscription(t, e, i, r = () => !0, o = () => {
  }) {
    const a = await t;
    if (!this.owns(e, i) || !r()) {
      try {
        a();
      } catch {
      }
      return;
    }
    this.unsubs.push(a), o(a);
  }
  clearSubscription(t) {
    t === "transaction" ? ++this.transactionSubscriptionScope : ++this.sessionSubscriptionScope;
    const e = t === "transaction" ? this.transactionUnsub : this.sessionUnsub;
    if (t === "transaction" ? this.transactionUnsub = null : this.sessionUnsub = null, !e) return;
    const i = this.unsubs.indexOf(e);
    i >= 0 && this.unsubs.splice(i, 1);
    try {
      e();
    } catch {
    }
  }
  resetCalibrationRun() {
    this.safetyAcknowledged = !1, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.calibrationHandoff = !1, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null;
  }
  selectDevice(t) {
    ++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = t, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.board = 0, this.resetCalibrationRun();
  }
  firstDeviceId(t) {
    return t.map((e) => e.entry_id).sort((e, i) => e.localeCompare(i))[0] ?? null;
  }
  showTopology(t) {
    this.topology = t, this.navigate("topology"), this.error = Ya(t) || t.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
  }
  showInventory(t) {
    this.inventory = t, this.drafts = new Map(t.channels.map((e) => {
      const i = e.selected_model_id ?? "", r = t.catalog.presets.find((o) => o.model_id === i);
      return [e.channel, {
        name: e.name,
        modelId: i,
        multiplier: e.reporting_multiplier,
        customGainCt: i === "custom" || e.selected_model_id === null ? e.raw_gain_ct * e.reporting_multiplier : void 0,
        customLabel: e.display_label ?? void 0,
        burdenAcknowledged: e.selection_verified_against_config && (i === "custom" || r?.requires_burden_jumper_cut === !0),
        expanded: e.selected_model_id === null && e.raw_gain_ct === 27518
      }];
    })), this.navigate("ct"), this.error = "", this.requestUpdate();
  }
  showState(t) {
    this.navigate(t);
  }
  navigate(t) {
    this.step = t, this.error = "", this.mobileStepsOpen = !1, this.focusHeading = !0, this.requestUpdate();
  }
  back() {
    this.step === "topology" ? (this.selectDevice(null), this.navigate("setup")) : this.step === "ct" ? this.navigate("topology") : this.step === "safety" ? this.cancelSession("ct") : this.step === "voltage" ? this.navigate("safety") : this.step === "current" ? this.navigate("voltage") : this.step === "restart" ? this.navigate("current") : this.step === "build" ? this.navigate(this.calibrationHandoff ? "restart" : "ct") : this.step === "summary" && this.navigate("build");
  }
  returnToSetup() {
    this.session && this.session.state !== "cancelled" ? this.cancelSession("setup") : (this.selectDevice(null), this.navigate("setup"));
  }
  async configureDevice(t) {
    if (!this.pendingAction) {
      this.selectDevice(t), this.pendingAction = `topology:${t}`, this.requestUpdate();
      try {
        await this.loadTopology();
      } finally {
        this.pendingAction = "", this.requestUpdate();
      }
    }
  }
  selectedProjectVersion() {
    return this.setup?.devices.find((t) => t.entry_id === this.selectedDeviceId)?.project_version ?? null;
  }
  selectedProjectName() {
    return this.setup?.devices.find((t) => t.entry_id === this.selectedDeviceId)?.project_name ?? null;
  }
  showRecovery(t) {
    t === "calibration_outcome_indeterminate" ? (this.navigate("current"), this.calibrationByTarget = new Map(this.calibrationByTarget).set(`current:${this.channel}`, {
      state: t,
      group_key: "",
      phase: null,
      changed_channels: [],
      iteration: 1,
      before_values: [],
      after_values: [],
      error_percent_values: [],
      gain_evidence: null,
      restore_evidence: null,
      retry_allowed: !1
    })) : (this.navigate("restart"), this.session ? this.session = { ...this.session, state: t } : this.error = "Restart verification failed; review rollback and recovery evidence."), this.requestUpdate();
  }
  async rescan() {
    if (!this.api || this.pendingAction) return;
    this.pendingAction = "rescan", this.requestUpdate();
    const t = this.api, e = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      if (await t.setInstallerIntent(this.addonCount, this.connection, this.selectedFirmware()), !this.ownsOperation(i, t, e)) return;
      const r = await t.rescan();
      if (!this.ownsOperation(i, t, e)) return;
      const o = this.step === "discover" && this.selectedDeviceId !== null && r.devices.length === this.setupDeviceIds.size && r.devices.some((a) => a.entry_id === this.selectedDeviceId) && r.devices.every((a) => this.setupDeviceIds.has(a.entry_id));
      this.setup = r, this.setupDeviceIds = new Set(r.devices.map((a) => a.entry_id)), r.devices.length && !o ? (this.selectDevice(this.firstDeviceId(r.devices)), this.navigate("discover"), this.announcement = "CircuitSetup energy meter discovered.") : r.devices.length || (this.announcement = "No compatible meter found. Check the network and rescan.");
    }, "Rescan failed.", () => this.ownsOperation(i, t, e)), this.pendingAction = "", this.requestUpdate();
  }
  async adopt(t = this.selectedDeviceId) {
    if (!this.api || !t) return;
    t !== this.selectedDeviceId && this.selectDevice(t);
    const e = this.api, i = ++this.operationGeneration;
    await this.run(async () => {
      await e.adoptDevice(t), this.ownsOperation(i, e, t) && (this.announcement = "Meter adopted in Device Builder.");
    }, "Adoption is unavailable for this meter.", () => this.ownsOperation(i, e, t));
  }
  async loadTopology() {
    if (!this.api || !this.selectedDeviceId) return;
    const t = this.api, e = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      const r = await t.getTopology(e);
      this.ownsOperation(i, t, e) && this.showTopology("topology" in r ? r.topology : r);
    }, "Topology evidence could not be loaded.", () => this.ownsOperation(i, t, e));
  }
  async loadInventory() {
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    this.pendingAction = "inventory", this.requestUpdate();
    const t = this.api, e = this.selectedDeviceId, i = ++this.operationGeneration;
    try {
      await this.run(async () => {
        const r = await t.getCtInventory(e);
        this.ownsOperation(i, t, e) && this.showInventory(r);
      }, "CT inventory could not be loaded.", () => this.ownsOperation(i, t, e));
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
  }
  async recoverCtInventory(t, e, i, r) {
    const o = await t.getCtInventory(e);
    this.ownsOperation(i, t, e) && (this.clearSubscription("transaction"), this.transaction = null, this.showInventory(o), this.drafts = new Map(Array.from(this.drafts, ([a, n]) => [a, r.get(a) ?? n])), this.announcement = "Live CT data reloaded. Review the preserved changes again.");
  }
  updateDraft(t, e) {
    const i = this.drafts.get(t);
    i && (this.drafts = new Map(this.drafts).set(t, { ...i, ...e }), this.requestUpdate());
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    const t = Se(this.inventory, this.drafts);
    if (!t.length) return this.fail(new Error(), "Select at least one CT change before review.");
    const e = this.api, i = this.selectedDeviceId, r = this.inventory, o = ++this.operationGeneration;
    if (this.clearSubscription("transaction"), this.transaction = null, this.labelOnly) {
      const a = t.filter((n) => n.name !== this.inventory.channels.find((l) => l.channel === n.channel)?.name).map(({ channel: n, name: l }) => ({ channel: n, name: l }));
      if (!a.length || t.some((n) => {
        const l = this.inventory.channels.find((c) => c.channel === n.channel);
        return !l || n.model_id !== (l.selected_model_id ?? "") || (n.reporting_multiplier ?? 1) !== l.reporting_multiplier;
      }))
        return this.fail(new Error(), "Home Assistant label mode only permits display-name edits.");
      await this.run(
        async () => {
          await e.setHaLabels(i, r.plan_id, r.source_sha256, a), this.announcement = "Home Assistant labels saved.";
        },
        "Home Assistant labels could not be saved.",
        () => this.ownsOperation(o, e, i)
      );
      return;
    }
    await this.run(
      async () => {
        let a;
        try {
          const n = await e.getCtInventory(i);
          if (!this.ownsOperation(o, e, i)) return;
          a = await e.previewCtConfig(
            i,
            n.plan_id,
            n.source_sha256,
            t
          );
        } catch (n) {
          if (n.code !== "stale_confirmation") throw n;
          await this.recoverCtInventory(e, i, o, this.drafts);
          return;
        }
        this.ownsOperation(o, e, i) && (this.transaction = a, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "The configuration preview is stale. Reload the CT inventory and review again.",
      () => this.ownsOperation(o, e, i)
    );
  }
  async subscribeTransaction(t) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const e = this.api;
    this.clearSubscription("transaction");
    const i = this.transactionSubscriptionScope, r = this.selectedDeviceId, o = this.transaction.transaction_id, a = this.transaction.source_sha256;
    await this.ownSubscription(
      e.subscribeConfigTransaction(
        r,
        o,
        a,
        (n) => {
          this.owns(t, e) && i === this.transactionSubscriptionScope && this.selectedDeviceId === r && this.transaction?.transaction_id === o && this.transaction.source_sha256 === a && n.transaction_id === o && n.source_sha256 === a && (this.transaction = n, this.requestUpdate());
        }
      ),
      t,
      e,
      () => i === this.transactionSubscriptionScope && this.selectedDeviceId === r && this.transaction?.transaction_id === o && this.transaction.source_sha256 === a,
      (n) => {
        this.transactionUnsub = n;
      }
    );
  }
  async continueFromCt() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || this.pendingAction) return;
    const t = Se(this.inventory, this.drafts);
    if (this.labelOnly && t.length) {
      const e = t.map(({ channel: n, name: l }) => ({ channel: n, name: l })), i = this.api, r = this.selectedDeviceId, o = this.inventory, a = ++this.operationGeneration;
      if (this.pendingAction = "session", this.requestUpdate(), await this.run(async () => {
        await i.setHaLabels(r, o.plan_id, o.source_sha256, e), this.ownsOperation(a, i, r) && (this.inventory = { ...o, channels: o.channels.map((n) => {
          const l = e.find((c) => c.channel === n.channel);
          return l ? { ...n, name: l.name } : n;
        }) }, this.announcement = "Home Assistant labels saved.");
      }, "Home Assistant labels could not be saved.", () => this.ownsOperation(a, i, r)), this.pendingAction = "", this.error) return;
    }
    await this.startSession();
  }
  async reviewCalibrationHandoff() {
    if (!this.api || !this.session || !this.restartResult?.source_handoff_available) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, r = this.restartResult.verification_id, o = ++this.operationGeneration;
    this.clearSubscription("transaction"), this.transaction = null, await this.run(
      async () => {
        const a = this.inventory && !this.labelOnly ? Se(this.inventory, this.drafts) : [], n = await t.previewCalibratedGains(i, r, a);
        !this.ownsOperation(o, t, e) || this.session?.session_id !== i || this.restartResult?.verification_id !== r || (this.calibrationHandoff = !0, this.transaction = n, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "Calibration gains could not be prepared for YAML review.",
      () => this.ownsOperation(o, t, e)
    );
  }
  async clearCalibrationHandoff() {
    const t = this.restartResult;
    if (!this.api || !this.session || !this.topology || !t?.source_handoff_firmware_installed || !t.source_handoff_transaction_id) return;
    const e = this.api, i = this.selectedDeviceId, r = this.session.session_id, o = ++this.operationGeneration;
    await this.run(
      async () => {
        const a = await e.clearCalibrationFlash(
          r,
          t.verification_id,
          t.source_handoff_transaction_id,
          this.topology
        );
        !this.ownsOperation(o, e, i) || this.session?.session_id !== r || (this.restartResult = a, this.announcement = "Calibration saved to YAML; flash values cleared.", this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash."));
      },
      "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values.",
      () => this.ownsOperation(o, e, i)
    );
  }
  async transactionAction(t) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const e = this.api, i = this.selectedDeviceId, r = this.transaction, o = ++this.operationGeneration;
    await this.run(
      async () => {
        const a = [i, r.transaction_id, r.source_sha256];
        let n;
        try {
          n = t === "apply" ? await e.applyCtConfig(...a) : t === "compile" ? await e.compileCtConfig(...a) : t === "install" ? await e.installCtConfig(...a) : await e.rollbackCtConfig(...a);
        } catch (l) {
          if (l.code !== "stale_confirmation") throw l;
          await this.recoverCtInventory(e, i, o, this.drafts);
          return;
        }
        if (!(!this.ownsOperation(o, e, i) || this.transaction?.transaction_id !== r.transaction_id || this.transaction.source_sha256 !== r.source_sha256))
          if (this.transaction = n, this.announcement = `Configuration ${this.transaction.state}.`, t === "install" && this.calibrationHandoff && n.state === "verified" && this.session && this.topology && this.restartResult) {
            this.restartResult = {
              ...this.restartResult,
              source_handoff_available: !1,
              source_handoff_transaction_id: n.transaction_id,
              source_handoff_firmware_installed: !0
            }, this.navigate("summary");
            const l = await e.clearCalibrationFlash(
              this.session.session_id,
              this.restartResult.verification_id,
              n.transaction_id,
              this.topology
            );
            if (!this.ownsOperation(o, e, i)) return;
            this.restartResult = l, this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash.");
          } else t === "install" && n.state === "verified" && this.finishFlow("Configuration changes were installed and verified.");
      },
      t === "install" && this.calibrationHandoff ? "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values." : "This confirmation is stale. Reload the CT inventory before making another change.",
      () => this.ownsOperation(o, e, i)
    );
  }
  async startSession() {
    if (!(!this.api || !this.selectedDeviceId || this.sessionStarting || this.pendingAction)) {
      this.sessionStarting = !0, this.pendingAction = "session", this.requestUpdate();
      try {
        const t = this.api, e = this.selectedDeviceId, i = ++this.operationGeneration;
        this.clearSubscription("session"), this.session = null, this.resetCalibrationRun(), await this.run(async () => {
          if (!this.topology) throw new Error("Topology is required before calibration");
          const r = await t.getActiveWork(e, this.topology);
          if (!this.ownsOperation(i, t, e)) return;
          if (this.session = r.session?.state === "cancelled" ? null : r.session, this.transaction = r.transaction, this.safetyAcknowledged = this.session?.safety_acknowledged ?? !1, this.calibrationHandoff = !!(this.transaction && r.verified_calibration && r.verified_calibration.source_handoff_transaction_id === this.transaction.transaction_id), this.restartResult = this.calibrationHandoff || this.session?.state === "verified" ? r.verified_calibration : null, this.transaction) {
            this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration), this.session && await this.subscribeSession(this.connectionGeneration);
            return;
          }
          if (this.session) {
            this.navigate(this.session.state === "safety_required" || this.session.state === "preflight_failed" ? "safety" : this.session.state === "applied_pending_restart_verification" ? "restart" : this.session.state === "verified" && this.restartResult ? "summary" : "voltage"), await this.subscribeSession(this.connectionGeneration);
            return;
          }
          const o = await t.startSession(e);
          !this.ownsOperation(i, t, e) || o.device_id !== e || (this.session = o, this.navigate("safety"), await this.subscribeSession(this.connectionGeneration));
        }, "Calibration session could not be started.", () => this.ownsOperation(i, t, e));
      } finally {
        this.sessionStarting = !1, this.pendingAction = "", this.requestUpdate();
      }
    }
  }
  finishFlow(t) {
    this.selectDevice(null), this.navigate("setup"), this.announcement = t;
  }
  async subscribeSession(t) {
    if (!this.api || !this.session) return;
    const e = this.api;
    this.clearSubscription("session");
    const i = this.sessionSubscriptionScope, r = this.session.session_id, o = this.session.device_id;
    await this.ownSubscription(
      e.subscribeSession(r, (a) => {
        this.owns(t, e) && i === this.sessionSubscriptionScope && this.session?.session_id === r && this.session.device_id === o && a.session_id === r && a.device_id === o && (this.session = a, this.requestUpdate());
      }),
      t,
      e,
      () => i === this.sessionSubscriptionScope && this.session?.session_id === r && this.session.device_id === o,
      (a) => {
        this.sessionUnsub = a;
      }
    );
  }
  async acknowledgeSafety() {
    if (!this.api || !this.session || this.pendingAction) return;
    this.pendingAction = "safety", this.requestUpdate();
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, r = ++this.operationGeneration;
    await this.run(async () => {
      const o = await t.acknowledgeSafety(i);
      !this.ownsOperation(r, t, e) || o.session_id !== i || (this.session = o, this.navigate("voltage"));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(r, t, e)), this.pendingAction = "", this.requestUpdate();
  }
  async checkStability(t) {
    if (!this.api || !this.session || t === "voltage" && this.voltageBusy) return;
    const e = this.api, i = this.selectedDeviceId, r = this.session.session_id, o = ++this.operationGeneration, a = t === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((n) => String(n.channel));
    if (a.length) {
      t === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
      try {
        await this.run(async () => {
          if (t === "voltage") {
            const n = await e.checkVoltageStability(r, a);
            if (!this.ownsOperation(o, e, i) || this.session?.session_id !== r) return;
            const l = new Map(this.stabilityByTarget);
            n.forEach((c) => l.set(`voltage:${c.target_id}`, c)), this.stabilityByTarget = l, this.announcement = "Loaded voltage data from both chips on this board.";
            return;
          }
          for (const [n, l] of a.entries()) {
            const c = await e.checkStability(r, t, l);
            if (!this.ownsOperation(o, e, i) || this.session?.session_id !== r) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${t}:${l}`, c), n < a.length - 1 && this.requestUpdate();
          }
        }, "Stable samples could not be collected.", () => this.ownsOperation(o, e, i));
      } finally {
        t === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
      }
    }
  }
  async calibrate(t) {
    if (!this.api || !this.session || t === "voltage" && this.voltageBusy) return;
    const e = this.api, i = this.selectedDeviceId, r = this.session.session_id, o = ++this.operationGeneration, a = t === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((l) => String(l.channel)), n = this.currentReferenceEntries();
    if (t === "current" && !n.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      return;
    }
    t === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
    try {
      await this.run(
        async () => {
          if (t === "voltage") {
            const d = await e.calibrateVoltage(r, a.map((g, A) => ({
              group_key: g,
              reference: this.voltageReferences[this.topology?.voltage_layout === "two_voltages" ? A : 0]
            })), !0);
            if (!this.ownsOperation(o, e, i) || this.session?.session_id !== r) return;
            const h = new Map(this.calibrationByTarget);
            d.forEach((g) => h.set(`voltage:${g.group_key}`, g)), this.calibrationByTarget = h, this.announcement = "Calibrated both voltage chips on this board.";
            return;
          }
          const l = await e.calibrateCurrent(
            r,
            n,
            !0,
            this.inventory && !this.labelOnly ? Se(this.inventory, this.drafts).map((d) => ({
              channel: d.channel,
              reporting_multiplier: d.reporting_multiplier ?? 1
            })) : []
          );
          if (!this.ownsOperation(o, e, i) || this.session?.session_id !== r) return;
          const c = new Map(this.calibrationByTarget);
          n.forEach((d) => c.set(`current:${d.channel}`, l)), this.calibrationByTarget = c, this.announcement = `Calibration iteration ${l.iteration} finished with state ${l.state}.`;
        },
        "Calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(o, e, i)
      );
    } finally {
      t === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
    }
  }
  groupKey(t) {
    const e = Math.floor(t / 2), i = t % 2 + 1;
    return e === 0 ? `main_${i}` : `addon${e}_${i}`;
  }
  voltageGroupKeys() {
    return this.topology ? [this.groupKey(this.board * 2), this.groupKey(this.board * 2 + 1)] : [this.groupKey(this.group)];
  }
  currentReferenceEntries() {
    const t = Math.floor((this.channel - 1) / 3) * 3 + 1;
    return Array.from({ length: 3 }, (e, i) => t + i).flatMap((e) => {
      const i = this.currentReferences.get(e), r = this.drafts.get(e)?.multiplier ?? this.inventory?.channels[e - 1]?.reporting_multiplier ?? this.reportingMultiplier;
      return i && i > 0 && r !== null ? [{ channel: e, reference: i, reporting_multiplier: r }] : [];
    });
  }
  async restart() {
    if (!this.api || !this.session || !this.topology) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, r = this.topology, o = ++this.operationGeneration;
    this.restartResult = null, await this.run(
      async () => {
        let n;
        try {
          n = await t.restartAndVerify(i, r);
        } catch (l) {
          throw this.ownsOperation(o, t, e) && this.session?.session_id === i && this.topology === r && (this.restartResult = null, this.session = { ...this.session, state: "restart_failed" }), l;
        }
        !this.ownsOperation(o, t, e) || this.session?.session_id !== i || this.topology !== r || (this.restartResult = n, this.session = { ...this.session, state: "verified" });
      },
      "Restart verification failed; review recovery evidence before rollback.",
      () => this.ownsOperation(o, t, e)
    ), this.restartResult?.source_handoff_available && await this.reviewCalibrationHandoff();
  }
  async cancelSession(t = "safety") {
    if (!this.api || !this.session) return;
    const e = this.api, i = this.selectedDeviceId, r = this.session.session_id, o = ++this.operationGeneration;
    await this.run(async () => {
      const a = await e.cancelSession(r);
      !this.ownsOperation(o, e, i) || this.session?.session_id !== r || (this.clearSubscription("session"), this.session = a, this.restartResult = null, t && this.navigate(t), this.announcement = t === "setup" ? "No changes were made. Select another device to configure." : t === "ct" ? "Calibration session closed. Review CT names and types before continuing." : "Calibration session cancelled; cleanup completed without restart verification.");
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(o, e, i));
  }
  async finishWithoutCalibration() {
    if (this.pendingAction) return;
    this.pendingAction = "finish", this.requestUpdate();
    const t = this.inventory && !this.labelOnly ? Se(this.inventory, this.drafts) : [];
    try {
      if (await this.cancelSession(null), this.error) return;
      t.length ? await this.reviewChanges() : this.finishFlow("No changes were made. Select another device to configure.");
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
  }
  async reconnectSession() {
    if (!this.api || !this.session) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, r = ++this.operationGeneration;
    await this.run(
      async () => {
        const o = await t.getSession(i);
        !this.ownsOperation(r, t, e) || this.session?.session_id !== i || (this.session = o, this.announcement = `Session reconnected with state ${this.session.state}.`);
      },
      "Session reconnection failed. Retry only after checking the meter connection.",
      () => this.ownsOperation(r, t, e)
    );
  }
  resultFor(t) {
    const e = this.currentReferenceEntries().map((o) => String(o.channel)), i = Math.floor((this.channel - 1) / 3) * 3 + 1, r = t === "voltage" ? this.voltageGroupKeys() : e.length ? e : Array.from({ length: 3 }, (o, a) => String(i + a));
    for (const o of [...r].reverse()) {
      const a = this.calibrationByTarget.get(`${t}:${o}`);
      if (a) return a;
    }
    return null;
  }
  stabilityFor(t) {
    const e = t === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((r) => String(r.channel)), i = e.flatMap((r) => {
      const o = this.stabilityByTarget.get(`${t}:${r}`);
      return o ? [o] : [];
    });
    return i.length ? {
      target: t,
      target_id: t === "voltage" ? `Board ${this.board + 1}` : `Current group ${Math.floor((this.channel - 1) / 3) + 1}`,
      stable: i.length === e.length && i.every((r) => r.stable),
      windows: i.flatMap((r) => r.windows)
    } : null;
  }
  async run(t, e, i = () => !0) {
    this.error = "";
    try {
      await t();
    } catch (r) {
      if (!i()) return;
      const o = r.code;
      this.fail(r, o === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : e);
    }
    i() && this.requestUpdate();
  }
  fail(t, e) {
    this.error = e, this.announcement = e, this.requestUpdate();
  }
  stepBody() {
    return this.step === "setup" ? B`${io(
      this.setup,
      this.addonCount,
      this.connection,
      (t) => {
        this.addonCount = t, this.refreshFirmwareOptions();
      },
      (t) => {
        this.connection = t, this.refreshFirmwareOptions();
      },
      () => {
        this.rescan();
      },
      (t) => {
        this.configureDevice(t);
      },
      (t) => {
        this.adopt(t);
      },
      this.pendingAction
    )}
      ${this.firmwareCatalog()}` : this.step === "discover" ? io(
      this.setup,
      this.addonCount,
      this.connection,
      () => {
      },
      () => {
      },
      () => {
        this.rescan();
      },
      (t) => {
        this.configureDevice(t);
      },
      (t) => {
        this.adopt(t);
      },
      this.pendingAction,
      !0
    ) : this.step === "topology" && this.topology ? bd(
      this.topology,
      this.selectedProjectVersion(),
      () => this.back(),
      () => {
        this.setup?.devices.find((t) => t.entry_id === this.selectedDeviceId)?.configuration ? this.loadInventory() : this.startSession();
      },
      this.error === "Topology mismatch",
      this.pendingAction === "inventory" || this.pendingAction === "session"
    ) : this.step === "ct" && this.inventory ? B`<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
      this.labelOnly = !1, this.requestUpdate();
    }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
      this.labelOnly = !0, this.requestUpdate();
    }}>Home Assistant labels only</label></fieldset>${Xc(
      this.inventory,
      this.board,
      this.drafts,
      (t) => {
        this.board = t, this.requestUpdate();
      },
      (t, e) => this.updateDraft(t, e),
      () => this.back(),
      () => {
        this.continueFromCt();
      },
      this.labelOnly,
      this.pendingAction === "session"
    )}` : this.step === "build" ? Zc(
      this.transaction,
      () => {
        this.transactionAction("apply");
      },
      () => {
        this.transactionAction("compile");
      },
      () => {
        this.transactionAction("install");
      },
      () => {
        this.transactionAction("rollback");
      },
      () => this.back(),
      () => this.finishFlow("Configuration changes were installed and verified.")
    ) : this.step === "safety" ? _d(
      this.session,
      this.safetyAcknowledged,
      (t) => {
        this.safetyAcknowledged = t, this.requestUpdate();
      },
      () => {
        this.acknowledgeSafety();
      },
      () => {
        this.cancelSession();
      },
      () => this.back(),
      this.pendingAction === "safety"
    ) : this.step === "voltage" ? B`${yd(
      this.topology,
      this.session,
      this.board,
      this.voltageReferences,
      this.stabilityFor("voltage"),
      this.resultFor("voltage"),
      this.voltageBusy,
      (t) => {
        this.board = t, this.requestUpdate();
      },
      (t, e) => {
        this.voltageReferences = this.voltageReferences.map((i, r) => r === t ? e : i), this.requestUpdate();
      },
      () => {
        this.checkStability("voltage");
      },
      () => {
        this.calibrate("voltage");
      },
      () => {
        this.reconnectSession();
      },
      () => {
        this.cancelSession();
      }
    )}
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" ?disabled=${this.voltageBusy} @click=${() => this.navigate("current")}>${this.resultFor("voltage") ? "Continue" : "Skip voltage calibration"}</button></footer>` : this.step === "current" ? B`${id(
      this.topology,
      this.inventory,
      this.session,
      this.channel,
      this.currentReferences,
      this.reportingMultiplier,
      this.stabilityFor("current"),
      this.resultFor("current"),
      (t) => {
        this.channel = t, this.requestUpdate();
      },
      (t, e) => {
        const i = new Map(this.currentReferences);
        e === null || !Number.isFinite(e) || e <= 0 ? i.delete(t) : i.set(t, e), this.currentReferences = i, this.requestUpdate();
      },
      (t) => {
        this.reportingMultiplier = t, this.requestUpdate();
      },
      () => {
        this.checkStability("current");
      },
      () => {
        this.calibrate("current");
      },
      () => {
        this.reconnectSession();
      },
      () => {
        this.cancelSession();
      }
    )}
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" ?disabled=${this.pendingAction === "finish"} @click=${() => this.calibrationByTarget.size ? this.navigate("restart") : void this.finishWithoutCalibration()}>${this.pendingAction === "finish" ? "Finishing…" : this.resultFor("current") ? "Continue" : "Skip current calibration"}</button></footer>` : this.step === "restart" ? md(
      this.session?.state ?? this.error,
      this.restartResult,
      !!this.transaction?.rollback_available,
      () => {
        this.restart();
      },
      () => {
        this.transactionAction("rollback");
      },
      () => this.back()
    ) : this.step === "summary" ? wd(
      this.topology,
      this.session,
      this.transaction,
      this.stabilityByTarget,
      this.calibrationByTarget,
      this.restartResult,
      this.selectedProjectVersion(),
      () => {
        this.restartResult?.source_handoff_firmware_installed ? this.clearCalibrationHandoff() : this.reviewCalibrationHandoff();
      },
      () => this.back()
    ) : B`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct" ? "CT settings are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }
  firmwareCatalog() {
    const t = this.firmwareCatalogState === "loading";
    return B`<section class="step-content" aria-labelledby="firmware-heading">
      <h2 id="firmware-heading">Install firmware</h2>
      <label>ESPHome firmware version
        <select data-action="firmware-version" ?disabled=${t || this.firmwareCatalogState !== "ready" || !this.resolvedFirmwareOptions.length}
          @change=${(e) => this.selectFirmwareVersion(e.target.value)}>
          ${this.resolvedFirmwareOptions.map((e, i) => B`<option value=${e.version} ?selected=${e.version === this.selectedEspHomeVersion}>${e.version}${i === 0 ? " (newest)" : ""}</option>`)}
        </select>
      </label>
      ${this.firmwareCatalogState === "error" ? B`<div class="error-panel" role="status">
        <strong>${this.firmwareCatalogError}</strong>
        <button class="secondary" data-action="firmware-retry" @click=${() => this.retryFirmwareIndex()}>Retry</button>
      </div>` : O}
      ${t ? B`<p role="status">Loading firmware versions…</p>` : O}
      ${this.firmwareCatalogState === "ready" && !this.resolvedFirmwareOptions.length ? B`<p role="status">No firmware version is available for this hardware.</p>` : O}
      ${this.firmwareCatalogState === "ready" ? fd(this.selectedFirmware()) : O}
    </section>`;
  }
  render() {
    const t = Re.findIndex(([e]) => e === this.step);
    return B`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${Re.map(([e, i], r) => B`
            <li class=${r === t ? "current" : ""}>
              <button class="step-button" aria-current=${r === t ? "step" : O}
                ?disabled=${r > t || r < t && e !== "setup"}
                @click=${() => e === "setup" && r < t ? this.returnToSetup() : void 0}><span class="number">${r + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${t + 1} of ${Re.length} — ${Re[t]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${Re[t]?.[1]}</h1>
          ${this.error ? B`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : O}
          ${this.stepBody()}
          ${t >= 4 && this.step !== "summary" ? La(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult) : O}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", Bd);
function p(s, t, e, i) {
  var r, o = arguments.length, a = o < 3 ? t : i === null ? i = Object.getOwnPropertyDescriptor(t, e) : i;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") a = Reflect.decorate(s, t, e, i);
  else for (var n = s.length - 1; n >= 0; n--) (r = s[n]) && (a = (o < 3 ? r(a) : o > 3 ? r(t, e, a) : r(t, e)) || a);
  return o > 3 && a && Object.defineProperty(t, e, a), a;
}
const ki = globalThis, mr = ki.ShadowRoot && (ki.ShadyCSS === void 0 || ki.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, vr = /* @__PURE__ */ Symbol(), so = /* @__PURE__ */ new WeakMap();
let Na = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== vr) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (mr && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = so.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && so.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const L = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce(((i, r, o) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1]), s[0]);
  return new Na(e, s, vr);
}, ro = mr ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return ((i) => new Na(typeof i == "string" ? i : i + "", void 0, vr))(e);
})(s) : s, { is: Id, defineProperty: xd, getOwnPropertyDescriptor: Sd, getOwnPropertyNames: Rd, getOwnPropertySymbols: Dd, getPrototypeOf: Md } = Object, Ee = globalThis, oo = Ee.trustedTypes, Td = oo ? oo.emptyScript : "", ao = Ee.reactiveElementPolyfillSupport, $e = (s, t) => s, $i = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? Td : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, _r = (s, t) => !Id(s, t), no = { attribute: !0, type: String, converter: $i, reflect: !1, useDefault: !1, hasChanged: _r };
Symbol.metadata ?? (Symbol.metadata = /* @__PURE__ */ Symbol("metadata")), Ee.litPropertyMetadata ?? (Ee.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let pe = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = no) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && xd(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: o } = Sd(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: r, set(a) {
      const n = r?.call(this);
      o?.call(this, a), this.requestUpdate(t, n, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? no;
  }
  static _$Ei() {
    if (this.hasOwnProperty($e("elementProperties"))) return;
    const t = Md(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty($e("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty($e("properties"))) {
      const e = this.properties, i = [...Rd(e), ...Dd(e)];
      for (const r of i) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, r] of e) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const r = this._$Eu(e, i);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const r of i) e.unshift(ro(r));
    } else t !== void 0 && e.push(ro(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise(((e) => this.enableUpdating = e)), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) === null || t === void 0 || t.forEach(((e) => e(this)));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) === null || e === void 0 || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) === null || e === void 0 || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ((e, i) => {
      if (mr) e.adoptedStyleSheets = i.map(((r) => r instanceof CSSStyleSheet ? r : r.styleSheet));
      else for (const r of i) {
        const o = document.createElement("style"), a = ki.litNonce;
        a !== void 0 && o.setAttribute("nonce", a), o.textContent = r.cssText, e.appendChild(o);
      }
    })(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) === null || t === void 0 || t.forEach(((e) => {
      var i;
      return (i = e.hostConnected) === null || i === void 0 ? void 0 : i.call(e);
    }));
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) === null || t === void 0 || t.forEach(((e) => {
      var i;
      return (i = e.hostDisconnected) === null || i === void 0 ? void 0 : i.call(e);
    }));
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    const i = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, i);
    if (r !== void 0 && i.reflect === !0) {
      var o;
      const a = (((o = i.converter) === null || o === void 0 ? void 0 : o.toAttribute) !== void 0 ? i.converter : $i).toAttribute(e, i.type);
      this._$Em = t, a == null ? this.removeAttribute(r) : this.setAttribute(r, a), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      var o, a;
      const n = i.getPropertyOptions(r), l = typeof n.converter == "function" ? { fromAttribute: n.converter } : ((o = n.converter) === null || o === void 0 ? void 0 : o.fromAttribute) !== void 0 ? n.converter : $i;
      this._$Em = r, this[r] = l.fromAttribute(e, n.type) ?? ((a = this._$Ej) === null || a === void 0 ? void 0 : a.get(r)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(t, e, i) {
    if (t !== void 0) {
      var r;
      const o = this.constructor, a = this[t];
      if (i ?? (i = o.getPropertyOptions(t)), !((i.hasChanged ?? _r)(a, e) || i.useDefault && i.reflect && a === ((r = this._$Ej) === null || r === void 0 ? void 0 : r.get(t)) && !this.hasAttribute(o._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: o }, a) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), o !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [o, a] of this._$Ep) this[o] = a;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [o, a] of r) {
        const { wrapped: n } = a, l = this[o];
        n !== !0 || this._$AL.has(o) || l === void 0 || this.C(o, void 0, a, l);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      var i;
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (i = this._$EO) !== null && i !== void 0 && i.forEach(((r) => {
        var o;
        return (o = r.hostUpdate) === null || o === void 0 ? void 0 : o.call(r);
      })), this.update(e)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) !== null && e !== void 0 && e.forEach(((i) => {
      var r;
      return (r = i.hostUpdated) === null || r === void 0 ? void 0 : r.call(i);
    })), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach(((e) => this._$ET(e, this[e])))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
pe.elementStyles = [], pe.shadowRootOptions = { mode: "open" }, pe[$e("elementProperties")] = /* @__PURE__ */ new Map(), pe[$e("finalized")] = /* @__PURE__ */ new Map(), ao?.({ ReactiveElement: pe }), (Ee.reactiveElementVersions ?? (Ee.reactiveElementVersions = [])).push("2.1.0");
const Li = globalThis, Yi = Li.trustedTypes, lo = Yi ? Yi.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, Ka = "$lit$", $t = `lit$${Math.random().toFixed(9).slice(2)}$`, za = "?" + $t, kd = `<${za}>`, ae = document, ti = () => ae.createComment(""), ei = (s) => s === null || typeof s != "object" && typeof s != "function", Js = Array.isArray, hs = `[\x20\t
\f\r]`, De = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, co = /-->/g, ho = />/g, qt = RegExp(`>|${hs}(?:([^\\s"'>=/]+)(${hs}*=${hs}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ao = /'/g, po = /"/g, Ja = /^(?:script|style|textarea|title)$/i, ja = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), y = ja(1), ot = ja(2), ft = /* @__PURE__ */ Symbol.for("lit-noChange"), C = /* @__PURE__ */ Symbol.for("lit-nothing"), go = /* @__PURE__ */ new WeakMap(), ee = ae.createTreeWalker(ae, 129);
function Wa(s, t) {
  if (!Js(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return lo !== void 0 ? lo.createHTML(t) : t;
}
const Fd = (s, t) => {
  const e = s.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = De;
  for (let n = 0; n < e; n++) {
    const l = s[n];
    let c, d, h = -1, g = 0;
    for (; g < l.length && (a.lastIndex = g, d = a.exec(l), d !== null); ) g = a.lastIndex, a === De ? d[1] === "!--" ? a = co : d[1] !== void 0 ? a = ho : d[2] !== void 0 ? (Ja.test(d[2]) && (r = RegExp("</" + d[2], "g")), a = qt) : d[3] !== void 0 && (a = qt) : a === qt ? d[0] === ">" ? (a = r ?? De, h = -1) : d[1] === void 0 ? h = -2 : (h = a.lastIndex - d[2].length, c = d[1], a = d[3] === void 0 ? qt : d[3] === '"' ? po : Ao) : a === po || a === Ao ? a = qt : a === co || a === ho ? a = De : (a = qt, r = void 0);
    const A = a === qt && s[n + 1].startsWith("/>") ? " " : "";
    o += a === De ? l + kd : h >= 0 ? (i.push(c), l.slice(0, h) + Ka + l.slice(h) + $t + A) : l + $t + (h === -2 ? n : A);
  }
  return [Wa(s, o + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
let js = class Va {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let o = 0, a = 0;
    const n = t.length - 1, l = this.parts, [c, d] = Fd(t, e);
    if (this.el = Va.createElement(c, i), ee.currentNode = this.el.content, e === 2 || e === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (r = ee.nextNode()) !== null && l.length < n; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const h of r.getAttributeNames()) if (h.endsWith(Ka)) {
          const g = d[a++], A = r.getAttribute(h).split($t), _ = /([.?@])?(.*)/.exec(g);
          l.push({ type: 1, index: o, name: _[2], strings: A, ctor: _[1] === "." ? Pd : _[1] === "?" ? Ud : _[1] === "@" ? Qd : Zi }), r.removeAttribute(h);
        } else h.startsWith($t) && (l.push({ type: 6, index: o }), r.removeAttribute(h));
        if (Ja.test(r.tagName)) {
          const h = r.textContent.split($t), g = h.length - 1;
          if (g > 0) {
            r.textContent = Yi ? Yi.emptyScript : "";
            for (let A = 0; A < g; A++) r.append(h[A], ti()), ee.nextNode(), l.push({ type: 2, index: ++o });
            r.append(h[g], ti());
          }
        }
      } else if (r.nodeType === 8) if (r.data === za) l.push({ type: 2, index: o });
      else {
        let h = -1;
        for (; (h = r.data.indexOf($t, h + 1)) !== -1; ) l.push({ type: 7, index: o }), h += $t.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = ae.createElement("template");
    return i.innerHTML = t, i;
  }
};
function we(s, t, e = s, i) {
  var r, o, a, n;
  if (t === ft) return t;
  let l = i !== void 0 ? (r = e._$Co) === null || r === void 0 ? void 0 : r[i] : e._$Cl;
  const c = ei(t) ? void 0 : t._$litDirective$;
  return ((o = l) === null || o === void 0 ? void 0 : o.constructor) !== c && ((a = l) !== null && a !== void 0 && (n = a._$AO) !== null && n !== void 0 && n.call(a, !1), c === void 0 ? l = void 0 : (l = new c(s), l._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = l : e._$Cl = l), l !== void 0 && (t = we(s, l._$AS(s, t.values), l, i)), t;
}
let Od = class {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, r = (t?.creationScope ?? ae).importNode(e, !0);
    ee.currentNode = r;
    let o = ee.nextNode(), a = 0, n = 0, l = i[0];
    for (; l !== void 0; ) {
      var c;
      if (a === l.index) {
        let d;
        l.type === 2 ? d = new Er(o, o.nextSibling, this, t) : l.type === 1 ? d = new l.ctor(o, l.name, l.strings, this, t) : l.type === 6 && (d = new Hd(o, this, t)), this._$AV.push(d), l = i[++n];
      }
      a !== ((c = l) === null || c === void 0 ? void 0 : c.index) && (o = ee.nextNode(), a++);
    }
    return ee.currentNode = ae, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}, Er = class qa {
  get _$AU() {
    var t;
    return ((t = this._$AM) === null || t === void 0 ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, r) {
    this.type = 2, this._$AH = C, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    var t;
    let e = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && ((t = e) === null || t === void 0 ? void 0 : t.nodeType) === 11 && (e = i.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = we(this, t, e), ei(t) ? t === C || t == null || t === "" ? (this._$AH !== C && this._$AR(), this._$AH = C) : t !== this._$AH && t !== ft && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : ((i) => Js(i) || typeof i?.[Symbol.iterator] == "function")(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== C && ei(this._$AH) ? this._$AA.nextSibling.data = t : this.T(ae.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var e;
    const { values: i, _$litType$: r } = t, o = typeof r == "number" ? this._$AC(t) : (r.el === void 0 && (r.el = js.createElement(Wa(r.h, r.h[0]), this.options)), r);
    if (((e = this._$AH) === null || e === void 0 ? void 0 : e._$AD) === o) this._$AH.p(i);
    else {
      const a = new Od(o, this), n = a.u(this.options);
      a.p(i), this.T(n), this._$AH = a;
    }
  }
  _$AC(t) {
    let e = go.get(t.strings);
    return e === void 0 && go.set(t.strings, e = new js(t)), e;
  }
  k(t) {
    Js(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const o of t) r === e.length ? e.push(i = new qa(this.O(ti()), this.O(ti()), this, this.options)) : i = e[r], i._$AI(o), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for ((i = this._$AP) === null || i === void 0 || i.call(this, !1, !0, e); t && t !== this._$AB; ) {
      var i;
      const r = t.nextSibling;
      t.remove(), t = r;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) === null || e === void 0 || e.call(this, t));
  }
}, Zi = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, r, o) {
    this.type = 1, this._$AH = C, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = C;
  }
  _$AI(t, e = this, i, r) {
    const o = this.strings;
    let a = !1;
    if (o === void 0) t = we(this, t, e, 0), a = !ei(t) || t !== this._$AH && t !== ft, a && (this._$AH = t);
    else {
      const n = t;
      let l, c;
      for (t = o[0], l = 0; l < o.length - 1; l++) c = we(this, n[i + l], e, l), c === ft && (c = this._$AH[l]), a || (a = !ei(c) || c !== this._$AH[l]), c === C ? t = C : t !== C && (t += (c ?? "") + o[l + 1]), this._$AH[l] = c;
    }
    a && !r && this.j(t);
  }
  j(t) {
    t === C ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}, Pd = class extends Zi {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === C ? void 0 : t;
  }
}, Ud = class extends Zi {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== C);
  }
}, Qd = class extends Zi {
  constructor(t, e, i, r, o) {
    super(t, e, i, r, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = we(this, t, e, 0) ?? C) === ft) return;
    const i = this._$AH, r = t === C && i !== C || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== C && (i === C || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) === null || e === void 0 ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}, Hd = class {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    we(this, t);
  }
};
const uo = Li.litHtmlPolyfillSupport;
uo?.(js, Er), (Li.litHtmlVersions ?? (Li.litHtmlVersions = [])).push("3.3.0");
const wr = (s, t, e) => {
  const i = e?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = r = new Er(t.insertBefore(ti(), o), o, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
var As;
const ii = globalThis;
let G = class extends pe {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t;
    const e = super.createRenderRoot();
    return (t = this.renderOptions).renderBefore ?? (t.renderBefore = e.firstChild), e;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = wr(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) === null || t === void 0 || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) === null || t === void 0 || t.setConnected(!1);
  }
  render() {
    return ft;
  }
};
G._$litElement$ = !0, G.finalized = !0, (As = ii.litElementHydrateSupport) === null || As === void 0 || As.call(ii, { LitElement: G });
const fo = ii.litElementPolyfillSupport;
fo?.({ LitElement: G }), (ii.litElementVersions ?? (ii.litElementVersions = [])).push("4.2.0");
const Jt = (s) => (t, e) => {
  e !== void 0 ? e.addInitializer((() => {
    customElements.define(s, t);
  })) : customElements.define(s, t);
}, Gd = { attribute: !0, type: String, converter: $i, reflect: !1, hasChanged: _r }, $d = (s = Gd, t, e) => {
  const { kind: i, metadata: r } = e;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), o.set(e.name, s), i === "accessor") {
    const { name: a } = e;
    return { set(n) {
      const l = t.get.call(this);
      t.set.call(this, n), this.requestUpdate(a, l, s);
    }, init(n) {
      return n !== void 0 && this.C(a, void 0, s, n), n;
    } };
  }
  if (i === "setter") {
    const { name: a } = e;
    return function(n) {
      const l = this[a];
      t.call(this, n), this.requestUpdate(a, l, s);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function v(s) {
  return (t, e) => typeof e == "object" ? $d(s, t, e) : ((i, r, o) => {
    const a = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, i), a ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(s, t, e);
}
function F(s) {
  return v({ ...s, state: !0, attribute: !1 });
}
const Xi = (s, t, e) => (e.configurable = !0, e.enumerable = !0, Reflect.decorate && typeof t != "object" && Object.defineProperty(s, t, e), e);
function N(s, t) {
  return (e, i, r) => Xi(e, i, { get() {
    return ((o) => {
      var a;
      return ((a = o.renderRoot) === null || a === void 0 ? void 0 : a.querySelector(s)) ?? null;
    })(this);
  } });
}
function kt(s) {
  return (t, e) => {
    const { slot: i, selector: r } = s ?? {}, o = "slot" + (i ? `[name=${i}]` : ":not([name])");
    return Xi(t, e, { get() {
      var a;
      const n = (a = this.renderRoot) === null || a === void 0 ? void 0 : a.querySelector(o), l = n?.assignedElements(s) ?? [];
      return r === void 0 ? l : l.filter(((c) => c.matches(r)));
    } });
  };
}
const Ld = L`:host{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end);box-sizing:border-box;cursor:pointer;display:inline-flex;gap:8px;min-height:var(--_container-height);outline:none;padding-block:calc((var(--_container-height) - max(var(--_label-text-line-height),var(--_icon-size)))/2);padding-inline-start:var(--_leading-space);padding-inline-end:var(--_trailing-space);place-content:center;place-items:center;position:relative;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);text-overflow:ellipsis;text-wrap:nowrap;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);vertical-align:top;--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){cursor:default;pointer-events:none}.button{border-radius:inherit;cursor:inherit;display:inline-flex;align-items:center;justify-content:center;border:none;outline:none;-webkit-appearance:none;vertical-align:middle;background:rgba(0,0,0,0);text-decoration:none;min-width:calc(64px - var(--_leading-space) - var(--_trailing-space));width:100%;z-index:0;height:100%;font:inherit;color:var(--_label-text-color);padding:0;gap:inherit;text-transform:inherit}.button::-moz-focus-inner{padding:0;border:0}:host(:hover) .button{color:var(--_hover-label-text-color)}:host(:focus-within) .button{color:var(--_focus-label-text-color)}:host(:active) .button{color:var(--_pressed-label-text-color)}.background{background:var(--_container-color);border-radius:inherit;inset:0;position:absolute}.label{overflow:hidden}:is(.button,.label,.label slot),.label ::slotted(*){text-overflow:inherit}:host(:is([disabled],[soft-disabled])) .label{color:var(--_disabled-label-text-color);opacity:var(--_disabled-label-text-opacity)}:host(:is([disabled],[soft-disabled])) .background{background:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}@media(forced-colors: active){.background{border:1px solid CanvasText}:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1;--_disabled-container-opacity: 1;--_disabled-label-text-color: GrayText;--_disabled-label-text-opacity: 1}}:host([has-icon]:not([trailing-icon])){padding-inline-start:var(--_with-leading-icon-leading-space);padding-inline-end:var(--_with-leading-icon-trailing-space)}:host([has-icon][trailing-icon]){padding-inline-start:var(--_with-trailing-icon-leading-space);padding-inline-end:var(--_with-trailing-icon-trailing-space)}::slotted([slot=icon]){display:inline-flex;position:relative;writing-mode:horizontal-tb;fill:currentColor;flex-shrink:0;color:var(--_icon-color);font-size:var(--_icon-size);inline-size:var(--_icon-size);block-size:var(--_icon-size)}:host(:hover) ::slotted([slot=icon]){color:var(--_hover-icon-color)}:host(:focus-within) ::slotted([slot=icon]){color:var(--_focus-icon-color)}:host(:active) ::slotted([slot=icon]){color:var(--_pressed-icon-color)}:host(:is([disabled],[soft-disabled])) ::slotted([slot=icon]){color:var(--_disabled-icon-color);opacity:var(--_disabled-icon-opacity)}.touch{position:absolute;top:50%;height:48px;left:0;right:0;transform:translateY(-50%)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) 0}:host([touch-target=none]) .touch{display:none}
`, Za = /* @__PURE__ */ Symbol("attachableController");
let Xa;
Xa = new MutationObserver(((s) => {
  for (const e of s) {
    var t;
    (t = e.target[Za]) === null || t === void 0 || t.hostConnected();
  }
}));
let tn = class {
  get htmlFor() {
    return this.host.getAttribute("for");
  }
  set htmlFor(t) {
    t === null ? this.host.removeAttribute("for") : this.host.setAttribute("for", t);
  }
  get control() {
    return this.host.hasAttribute("for") ? this.htmlFor && this.host.isConnected ? this.host.getRootNode().querySelector(`#${this.htmlFor}`) : null : this.currentControl || this.host.parentElement;
  }
  set control(t) {
    t ? this.attach(t) : this.detach();
  }
  constructor(t, e) {
    var i;
    this.host = t, this.onControlChange = e, this.currentControl = null, t.addController(this), t[Za] = this, (i = Xa) === null || i === void 0 || i.observe(t, { attributeFilter: ["for"] });
  }
  attach(t) {
    t !== this.currentControl && (this.setCurrentControl(t), this.host.removeAttribute("for"));
  }
  detach() {
    this.setCurrentControl(null), this.host.setAttribute("for", "");
  }
  hostConnected() {
    this.setCurrentControl(this.control);
  }
  hostDisconnected() {
    this.setCurrentControl(null);
  }
  setCurrentControl(t) {
    this.onControlChange(this.currentControl, t), this.currentControl = t;
  }
};
const Yd = ["focusin", "focusout", "pointerdown"];
let Ws = class extends G {
  constructor() {
    super(...arguments), this.visible = !1, this.inward = !1, this.attachableController = new tn(this, this.onControlChange.bind(this));
  }
  get htmlFor() {
    return this.attachableController.htmlFor;
  }
  set htmlFor(t) {
    this.attachableController.htmlFor = t;
  }
  get control() {
    return this.attachableController.control;
  }
  set control(t) {
    this.attachableController.control = t;
  }
  attach(t) {
    this.attachableController.attach(t);
  }
  detach() {
    this.attachableController.detach();
  }
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  handleEvent(t) {
    var e;
    if (!t[mo]) {
      switch (t.type) {
        default:
          return;
        case "focusin":
          this.visible = ((e = this.control) === null || e === void 0 ? void 0 : e.matches(":focus-visible")) ?? !1;
          break;
        case "focusout":
        case "pointerdown":
          this.visible = !1;
      }
      t[mo] = !0;
    }
  }
  onControlChange(t, e) {
    for (const i of Yd) t?.removeEventListener(i, this), e?.addEventListener(i, this);
  }
  update(t) {
    t.has("visible") && this.dispatchEvent(new Event("visibility-changed")), super.update(t);
  }
};
p([v({ type: Boolean, reflect: !0 })], Ws.prototype, "visible", void 0), p([v({ type: Boolean, reflect: !0 })], Ws.prototype, "inward", void 0);
const mo = /* @__PURE__ */ Symbol("handledByFocusRing"), Nd = L`:host{animation-delay:0s,calc(var(--md-focus-ring-duration, 600ms)*.25);animation-duration:calc(var(--md-focus-ring-duration, 600ms)*.25),calc(var(--md-focus-ring-duration, 600ms)*.75);animation-timing-function:cubic-bezier(0.2, 0, 0, 1);box-sizing:border-box;color:var(--md-focus-ring-color, var(--md-sys-color-secondary, #625b71));display:none;pointer-events:none;position:absolute}:host([visible]){display:flex}:host(:not([inward])){animation-name:outward-grow,outward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));inset:calc(-1*var(--md-focus-ring-outward-offset, 2px));outline:var(--md-focus-ring-width, 3px) solid currentColor}:host([inward]){animation-name:inward-grow,inward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border:var(--md-focus-ring-width, 3px) solid currentColor;inset:var(--md-focus-ring-inward-offset, 0px)}@keyframes outward-grow{from{outline-width:0}to{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes outward-shrink{from{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-grow{from{border-width:0}to{border-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-shrink{from{border-width:var(--md-focus-ring-active-width, 8px)}}@media(prefers-reduced-motion){:host{animation:none}}
`;
let ps = class extends Ws {
};
ps.styles = [Nd], ps = p([Jt("md-focus-ring")], ps);
const Ht = { ATTRIBUTE: 1, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4 }, br = (s) => (...t) => ({ _$litDirective$: s, values: t });
let yr = class {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, i) {
    this._$Ct = t, this._$AM = e, this._$Ci = i;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
};
const At = br(class extends yr {
  constructor(s) {
    var t;
    if (super(s), s.type !== Ht.ATTRIBUTE || s.name !== "class" || ((t = s.strings) === null || t === void 0 ? void 0 : t.length) > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
  }
  render(s) {
    return " " + Object.keys(s).filter(((t) => s[t])).join(" ") + " ";
  }
  update(s, [t]) {
    if (this.st === void 0) {
      this.st = /* @__PURE__ */ new Set(), s.strings !== void 0 && (this.nt = new Set(s.strings.join(" ").split(/\s/).filter(((o) => o !== ""))));
      for (const o in t) {
        var e;
        t[o] && ((e = this.nt) === null || e === void 0 || !e.has(o)) && this.st.add(o);
      }
      return this.render(t);
    }
    const i = s.element.classList;
    for (const o of this.st) o in t || (i.remove(o), this.st.delete(o));
    for (const o in t) {
      var r;
      const a = !!t[o];
      a === this.st.has(o) || !((r = this.nt) === null || r === void 0) && r.has(o) || (a ? (i.add(o), this.st.add(o)) : (i.remove(o), this.st.delete(o)));
    }
    return ft;
  }
}), Bt = { STANDARD: "cubic-bezier(0.2, 0, 0, 1)", EMPHASIZED: "cubic-bezier(.3,0,0,1)", EMPHASIZED_ACCELERATE: "cubic-bezier(.3,0,.8,.15)" };
function Kd() {
  let s = null;
  return { start() {
    var t;
    return (t = s) === null || t === void 0 || t.abort(), s = new AbortController(), s.signal;
  }, finish() {
    s = null;
  } };
}
var it;
(function(s) {
  s[s.INACTIVE = 0] = "INACTIVE", s[s.TOUCH_DELAY = 1] = "TOUCH_DELAY", s[s.HOLDING = 2] = "HOLDING", s[s.WAITING_FOR_CLICK = 3] = "WAITING_FOR_CLICK";
})(it || (it = {}));
const zd = ["click", "contextmenu", "pointercancel", "pointerdown", "pointerenter", "pointerleave", "pointerup"], vo = window.matchMedia("(forced-colors: active)");
let Oe = class extends G {
  constructor() {
    super(...arguments), this.disabled = !1, this.hovered = !1, this.pressed = !1, this.rippleSize = "", this.rippleScale = "", this.initialSize = 0, this.state = it.INACTIVE, this.attachableController = new tn(this, this.onControlChange.bind(this));
  }
  get htmlFor() {
    return this.attachableController.htmlFor;
  }
  set htmlFor(t) {
    this.attachableController.htmlFor = t;
  }
  get control() {
    return this.attachableController.control;
  }
  set control(t) {
    this.attachableController.control = t;
  }
  attach(t) {
    this.attachableController.attach(t);
  }
  detach() {
    this.attachableController.detach();
  }
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  render() {
    const t = { hovered: this.hovered, pressed: this.pressed };
    return y`<div class="surface ${At(t)}"></div>`;
  }
  update(t) {
    t.has("disabled") && this.disabled && (this.hovered = !1, this.pressed = !1), super.update(t);
  }
  handlePointerenter(t) {
    this.shouldReactToEvent(t) && (this.hovered = !0);
  }
  handlePointerleave(t) {
    this.shouldReactToEvent(t) && (this.hovered = !1, this.state !== it.INACTIVE && this.endPressAnimation());
  }
  handlePointerup(t) {
    if (this.shouldReactToEvent(t)) {
      if (this.state !== it.HOLDING) return this.state === it.TOUCH_DELAY ? (this.state = it.WAITING_FOR_CLICK, void this.startPressAnimation(this.rippleStartEvent)) : void 0;
      this.state = it.WAITING_FOR_CLICK;
    }
  }
  async handlePointerdown(t) {
    if (this.shouldReactToEvent(t)) {
      if (this.rippleStartEvent = t, !this.isTouch(t)) return this.state = it.WAITING_FOR_CLICK, void this.startPressAnimation(t);
      this.state = it.TOUCH_DELAY, await new Promise(((e) => {
        setTimeout(e, 150);
      })), this.state === it.TOUCH_DELAY && (this.state = it.HOLDING, this.startPressAnimation(t));
    }
  }
  handleClick() {
    this.disabled || (this.state !== it.WAITING_FOR_CLICK ? this.state === it.INACTIVE && (this.startPressAnimation(), this.endPressAnimation()) : this.endPressAnimation());
  }
  handlePointercancel(t) {
    this.shouldReactToEvent(t) && this.endPressAnimation();
  }
  handleContextmenu() {
    this.disabled || this.endPressAnimation();
  }
  determineRippleSize() {
    const { height: t, width: e } = this.getBoundingClientRect(), i = Math.max(t, e), r = Math.max(0.35 * i, 75), o = this.currentCSSZoom ?? 1, a = Math.floor(0.2 * i / o), n = Math.sqrt(e ** 2 + t ** 2) + 10;
    this.initialSize = a;
    const l = (n + r) / a;
    this.rippleScale = "" + l / o, this.rippleSize = `${a}px`;
  }
  getNormalizedPointerEventCoords(t) {
    const { scrollX: e, scrollY: i } = window, { left: r, top: o } = this.getBoundingClientRect(), a = e + r, n = i + o, { pageX: l, pageY: c } = t, d = this.currentCSSZoom ?? 1;
    return { x: (l - a) / d, y: (c - n) / d };
  }
  getTranslationCoordinates(t) {
    const { height: e, width: i } = this.getBoundingClientRect(), r = this.currentCSSZoom ?? 1, o = { x: (i / r - this.initialSize) / 2, y: (e / r - this.initialSize) / 2 };
    let a;
    return a = t instanceof PointerEvent ? this.getNormalizedPointerEventCoords(t) : { x: i / r / 2, y: e / r / 2 }, a = { x: a.x - this.initialSize / 2, y: a.y - this.initialSize / 2 }, { startPoint: a, endPoint: o };
  }
  startPressAnimation(t) {
    var e;
    if (!this.mdRoot) return;
    this.pressed = !0, (e = this.growAnimation) === null || e === void 0 || e.cancel(), this.determineRippleSize();
    const { startPoint: i, endPoint: r } = this.getTranslationCoordinates(t), o = `${i.x}px, ${i.y}px`, a = `${r.x}px, ${r.y}px`;
    this.growAnimation = this.mdRoot.animate({ top: [0, 0], left: [0, 0], height: [this.rippleSize, this.rippleSize], width: [this.rippleSize, this.rippleSize], transform: [`translate(${o}) scale(1)`, `translate(${a}) scale(${this.rippleScale})`] }, { pseudoElement: "::after", duration: 450, easing: Bt.STANDARD, fill: "forwards" });
  }
  async endPressAnimation() {
    this.rippleStartEvent = void 0, this.state = it.INACTIVE;
    const t = this.growAnimation;
    let e = 1 / 0;
    typeof t?.currentTime == "number" ? e = t.currentTime : t != null && t.currentTime && (e = t.currentTime.to("ms").value), e >= 225 ? this.pressed = !1 : (await new Promise(((i) => {
      setTimeout(i, 225 - e);
    })), this.growAnimation === t && (this.pressed = !1));
  }
  shouldReactToEvent(t) {
    if (this.disabled || !t.isPrimary || this.rippleStartEvent && this.rippleStartEvent.pointerId !== t.pointerId) return !1;
    if (t.type === "pointerenter" || t.type === "pointerleave") return !this.isTouch(t);
    const e = t.buttons === 1;
    return this.isTouch(t) || e;
  }
  isTouch({ pointerType: t }) {
    return t === "touch";
  }
  async handleEvent(t) {
    if (vo == null || !vo.matches) switch (t.type) {
      case "click":
        this.handleClick();
        break;
      case "contextmenu":
        this.handleContextmenu();
        break;
      case "pointercancel":
        this.handlePointercancel(t);
        break;
      case "pointerdown":
        await this.handlePointerdown(t);
        break;
      case "pointerenter":
        this.handlePointerenter(t);
        break;
      case "pointerleave":
        this.handlePointerleave(t);
        break;
      case "pointerup":
        this.handlePointerup(t);
    }
  }
  onControlChange(t, e) {
    for (const i of zd) t?.removeEventListener(i, this), e?.addEventListener(i, this);
  }
};
p([v({ type: Boolean, reflect: !0 })], Oe.prototype, "disabled", void 0), p([F()], Oe.prototype, "hovered", void 0), p([F()], Oe.prototype, "pressed", void 0), p([N(".surface")], Oe.prototype, "mdRoot", void 0);
const Jd = L`:host{display:flex;margin:auto;pointer-events:none}:host([disabled]){display:none}@media(forced-colors: active){:host{display:none}}:host,.surface{border-radius:inherit;position:absolute;inset:0;overflow:hidden}.surface{-webkit-tap-highlight-color:rgba(0,0,0,0)}.surface::before,.surface::after{content:"";opacity:0;position:absolute}.surface::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));inset:0;transition:opacity 15ms linear,background-color 15ms linear}.surface::after{background:radial-gradient(closest-side, var(--md-ripple-pressed-color, var(--md-sys-color-on-surface, #1d1b20)) max(100% - 70px, 65%), transparent 100%);transform-origin:center center;transition:opacity 375ms linear}.hovered::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-ripple-hover-opacity, 0.08)}.pressed::after{opacity:var(--md-ripple-pressed-opacity, 0.12);transition-duration:105ms}
`;
let gs = class extends Oe {
};
gs.styles = [Jd], gs = p([Jt("md-ripple")], gs);
const en = ["role", "ariaAtomic", "ariaAutoComplete", "ariaBusy", "ariaChecked", "ariaColCount", "ariaColIndex", "ariaColSpan", "ariaCurrent", "ariaDisabled", "ariaExpanded", "ariaHasPopup", "ariaHidden", "ariaInvalid", "ariaKeyShortcuts", "ariaLabel", "ariaLevel", "ariaLive", "ariaModal", "ariaMultiLine", "ariaMultiSelectable", "ariaOrientation", "ariaPlaceholder", "ariaPosInSet", "ariaPressed", "ariaReadOnly", "ariaRequired", "ariaRoleDescription", "ariaRowCount", "ariaRowIndex", "ariaRowSpan", "ariaSelected", "ariaSetSize", "ariaSort", "ariaValueMax", "ariaValueMin", "ariaValueNow", "ariaValueText"], jd = en.map(sn);
function us(s) {
  return jd.includes(s);
}
function sn(s) {
  return s.replace("aria", "aria-").replace(/Elements?/g, "").toLowerCase();
}
const fi = /* @__PURE__ */ Symbol("privateIgnoreAttributeChangesFor");
function Ot(s) {
  var t;
  class e extends s {
    constructor() {
      super(...arguments), this[t] = /* @__PURE__ */ new Set();
    }
    attributeChangedCallback(r, o, a) {
      if (!us(r)) return void super.attributeChangedCallback(r, o, a);
      if (this[fi].has(r)) return;
      this[fi].add(r), this.removeAttribute(r), this[fi].delete(r);
      const n = ms(r);
      a === null ? delete this.dataset[n] : this.dataset[n] = a, this.requestUpdate(ms(r), o);
    }
    getAttribute(r) {
      return us(r) ? super.getAttribute(fs(r)) : super.getAttribute(r);
    }
    removeAttribute(r) {
      super.removeAttribute(r), us(r) && (super.removeAttribute(fs(r)), this.requestUpdate());
    }
  }
  return t = fi, (function(i) {
    for (const r of en) {
      const o = sn(r), a = fs(o), n = ms(o);
      i.createProperty(r, { attribute: o, noAccessor: !0 }), i.createProperty(Symbol(a), { attribute: a, noAccessor: !0 }), Object.defineProperty(i.prototype, r, { configurable: !0, enumerable: !0, get() {
        return this.dataset[n] ?? null;
      }, set(l) {
        const c = this.dataset[n] ?? null;
        l !== c && (l === null ? delete this.dataset[n] : this.dataset[n] = l, this.requestUpdate(r, c));
      } });
    }
  })(e), e;
}
function fs(s) {
  return `data-${s}`;
}
function ms(s) {
  return s.replace(/-\w/, ((t) => t[1].toUpperCase()));
}
const st = /* @__PURE__ */ Symbol("internals"), vs = /* @__PURE__ */ Symbol("privateInternals");
function hi(s) {
  return class extends s {
    get [st]() {
      return this[vs] || (this[vs] = this.attachInternals()), this[vs];
    }
  };
}
function rn(s) {
  s.addInitializer(((t) => {
    const e = t;
    e.addEventListener("click", (async (i) => {
      const { type: r, [st]: o } = e, { form: a } = o;
      a && r !== "button" && (await new Promise(((n) => {
        setTimeout(n);
      })), i.defaultPrevented || (r !== "reset" ? (a.addEventListener("submit", ((n) => {
        Object.defineProperty(n, "submitter", { configurable: !0, enumerable: !0, get: () => e });
      }), { capture: !0, once: !0 }), o.setFormValue(e.value), a.requestSubmit()) : a.reset()));
    }));
  }));
}
function on(s) {
  const t = new MouseEvent("click", { bubbles: !0 });
  return s.dispatchEvent(t), t;
}
function an(s) {
  return s.currentTarget === s.target && s.composedPath()[0] === s.target && !s.target.disabled && !(function(t) {
    const e = _s;
    return e && (t.preventDefault(), t.stopImmediatePropagation()), (async function() {
      _s = !0, await null, _s = !1;
    })(), e;
  })(s);
}
let _s = !1;
const Wd = Ot(hi(G));
let et = class extends Wd {
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(t) {
    this.setAttribute("name", t);
  }
  get form() {
    return this[st].form;
  }
  constructor() {
    super(), this.disabled = !1, this.softDisabled = !1, this.href = "", this.download = "", this.target = "", this.trailingIcon = !1, this.hasIcon = !1, this.type = "submit", this.value = "", this.addEventListener("click", this.handleClick.bind(this));
  }
  focus() {
    var t;
    (t = this.buttonElement) === null || t === void 0 || t.focus();
  }
  blur() {
    var t;
    (t = this.buttonElement) === null || t === void 0 || t.blur();
  }
  render() {
    var t;
    const e = this.disabled || this.softDisabled, i = this.href ? this.renderLink() : this.renderButton(), r = this.href ? "link" : "button";
    return y`
      ${(t = this.renderElevationOrOutline) === null || t === void 0 ? void 0 : t.call(this)}
      <div class="background"></div>
      <md-focus-ring part="focus-ring" for=${r}></md-focus-ring>
      <md-ripple
        part="ripple"
        for=${r}
        ?disabled="${e}"></md-ripple>
      ${i}
    `;
  }
  renderButton() {
    const { ariaLabel: t, ariaHasPopup: e, ariaExpanded: i } = this;
    return y`<button
      id="button"
      class="button"
      ?disabled=${this.disabled}
      aria-disabled=${this.softDisabled || C}
      aria-label="${t || C}"
      aria-haspopup="${e || C}"
      aria-expanded="${i || C}">
      ${this.renderContent()}
    </button>`;
  }
  renderLink() {
    const { ariaLabel: t, ariaHasPopup: e, ariaExpanded: i } = this;
    return y`<a
      id="link"
      class="button"
      aria-label="${t || C}"
      aria-haspopup="${e || C}"
      aria-expanded="${i || C}"
      aria-disabled=${this.disabled || this.softDisabled || C}
      tabindex="${this.disabled && !this.softDisabled ? -1 : C}"
      href=${this.href}
      download=${this.download || C}
      target=${this.target || C}
      >${this.renderContent()}
    </a>`;
  }
  renderContent() {
    const t = y`<slot
      name="icon"
      @slotchange="${this.handleSlotChange}"></slot>`;
    return y`
      <span class="touch"></span>
      ${this.trailingIcon ? C : t}
      <span class="label"><slot></slot></span>
      ${this.trailingIcon ? t : C}
    `;
  }
  handleClick(t) {
    if (this.softDisabled || this.disabled && this.href) return t.stopImmediatePropagation(), void t.preventDefault();
    an(t) && this.buttonElement && (this.focus(), on(this.buttonElement));
  }
  handleSlotChange() {
    this.hasIcon = this.assignedIcons.length > 0;
  }
};
rn(et), et.formAssociated = !0, et.shadowRootOptions = { mode: "open", delegatesFocus: !0 }, p([v({ type: Boolean, reflect: !0 })], et.prototype, "disabled", void 0), p([v({ type: Boolean, attribute: "soft-disabled", reflect: !0 })], et.prototype, "softDisabled", void 0), p([v()], et.prototype, "href", void 0), p([v()], et.prototype, "download", void 0), p([v()], et.prototype, "target", void 0), p([v({ type: Boolean, attribute: "trailing-icon", reflect: !0 })], et.prototype, "trailingIcon", void 0), p([v({ type: Boolean, attribute: "has-icon", reflect: !0 })], et.prototype, "hasIcon", void 0), p([v()], et.prototype, "type", void 0), p([v({ reflect: !0 })], et.prototype, "value", void 0), p([N(".button")], et.prototype, "buttonElement", void 0), p([kt({ slot: "icon", flatten: !0 })], et.prototype, "assignedIcons", void 0);
let Vd = class extends et {
};
const qd = L`:host{--_container-height: var(--md-text-button-container-height, 40px);--_disabled-label-text-color: var(--md-text-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-text-button-disabled-label-text-opacity, 0.38);--_focus-label-text-color: var(--md-text-button-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-text-button-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-text-button-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-text-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-text-button-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-text-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-text-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-text-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-text-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-text-button-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-text-button-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-text-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-text-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-text-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-text-button-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-icon-color: var(--md-text-button-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-color: var(--md-text-button-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-text-button-icon-size, 18px);--_pressed-icon-color: var(--md-text-button-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-text-button-container-shape-start-start, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-text-button-container-shape-start-end, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-text-button-container-shape-end-end, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-text-button-container-shape-end-start, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-text-button-leading-space, 12px);--_trailing-space: var(--md-text-button-trailing-space, 12px);--_with-leading-icon-leading-space: var(--md-text-button-with-leading-icon-leading-space, 12px);--_with-leading-icon-trailing-space: var(--md-text-button-with-leading-icon-trailing-space, 16px);--_with-trailing-icon-leading-space: var(--md-text-button-with-trailing-icon-leading-space, 16px);--_with-trailing-icon-trailing-space: var(--md-text-button-with-trailing-icon-trailing-space, 12px);--_container-color: none;--_disabled-container-color: none;--_disabled-container-opacity: 0}
`;
let _o = class extends Vd {
};
_o.styles = [Ld, qd], customElements.define("ew-text-button", _o);
let Le = class extends G {
  constructor() {
    super(...arguments), this.inset = !1, this.insetStart = !1, this.insetEnd = !1;
  }
};
p([v({ type: Boolean, reflect: !0 })], Le.prototype, "inset", void 0), p([v({ type: Boolean, reflect: !0, attribute: "inset-start" })], Le.prototype, "insetStart", void 0), p([v({ type: Boolean, reflect: !0, attribute: "inset-end" })], Le.prototype, "insetEnd", void 0);
const nn = L`:host{box-sizing:border-box;color:var(--md-divider-color, var(--md-sys-color-outline-variant, #cac4d0));display:flex;height:var(--md-divider-thickness, 1px);width:100%}:host([inset]),:host([inset-start]){padding-inline-start:16px}:host([inset]),:host([inset-end]){padding-inline-end:16px}:host::before{background:currentColor;content:"";height:100%;width:100%}@media(forced-colors: active){:host::before{background:CanvasText}}
`;
function ts(s, t) {
  !t.bubbles || s.shadowRoot && !t.composed || t.stopPropagation();
  const e = Reflect.construct(t.constructor, [t.type, t]), i = s.dispatchEvent(e);
  return i || t.preventDefault(), i;
}
let Es = class extends Le {
};
Es.styles = [nn], Es = p([Jt("md-divider")], Es);
const Zd = { dialog: [[[{ transform: "translateY(-50px)" }, { transform: "translateY(0)" }], { duration: 500, easing: Bt.EMPHASIZED }]], scrim: [[[{ opacity: 0 }, { opacity: 0.32 }], { duration: 500, easing: "linear" }]], container: [[[{ opacity: 0 }, { opacity: 1 }], { duration: 50, easing: "linear", pseudoElement: "::before" }], [[{ height: "35%" }, { height: "100%" }], { duration: 500, easing: Bt.EMPHASIZED, pseudoElement: "::before" }]], headline: [[[{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }], { duration: 250, easing: "linear", fill: "forwards" }]], content: [[[{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }], { duration: 250, easing: "linear", fill: "forwards" }]], actions: [[[{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 300, easing: "linear", fill: "forwards" }]] }, Xd = { dialog: [[[{ transform: "translateY(0)" }, { transform: "translateY(-50px)" }], { duration: 150, easing: Bt.EMPHASIZED_ACCELERATE }]], scrim: [[[{ opacity: 0.32 }, { opacity: 0 }], { duration: 150, easing: "linear" }]], container: [[[{ height: "100%" }, { height: "35%" }], { duration: 150, easing: Bt.EMPHASIZED_ACCELERATE, pseudoElement: "::before" }], [[{ opacity: "1" }, { opacity: "0" }], { delay: 100, duration: 50, easing: "linear", pseudoElement: "::before" }]], headline: [[[{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: "linear", fill: "forwards" }]], content: [[[{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: "linear", fill: "forwards" }]], actions: [[[{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: "linear", fill: "forwards" }]] }, th = Ot(G);
let W = class extends th {
  get open() {
    return this.isOpen;
  }
  set open(t) {
    t !== this.isOpen && (this.isOpen = t, t ? (this.setAttribute("open", ""), this.show()) : (this.removeAttribute("open"), this.close()));
  }
  constructor() {
    super(), this.quick = !1, this.returnValue = "", this.noFocusTrap = !1, this.getOpenAnimation = () => Zd, this.getCloseAnimation = () => Xd, this.isOpen = !1, this.isOpening = !1, this.isConnectedPromise = this.getIsConnectedPromise(), this.isAtScrollTop = !1, this.isAtScrollBottom = !1, this.nextClickIsFromContent = !1, this.hasHeadline = !1, this.hasActions = !1, this.hasIcon = !1, this.escapePressedWithoutCancel = !1, this.treewalker = document.createTreeWalker(this, NodeFilter.SHOW_ELEMENT), this.addEventListener("submit", this.handleSubmit);
  }
  async show() {
    var t;
    this.isOpening = !0, await this.isConnectedPromise, await this.updateComplete;
    const e = this.dialog;
    if (e.open || !this.isOpening) return void (this.isOpening = !1);
    if (!this.dispatchEvent(new Event("open", { cancelable: !0 }))) return this.open = !1, void (this.isOpening = !1);
    e.showModal(), this.open = !0, this.scroller && (this.scroller.scrollTop = 0), (t = this.querySelector("[autofocus]")) === null || t === void 0 || t.focus(), await this.animateDialog(this.getOpenAnimation()), this.dispatchEvent(new Event("opened")), this.isOpening = !1;
  }
  async close(t = this.returnValue) {
    if (this.isOpening = !1, !this.isConnected) return void (this.open = !1);
    await this.updateComplete;
    const e = this.dialog;
    if (!e.open || this.isOpening) return void (this.open = !1);
    const i = this.returnValue;
    this.returnValue = t, this.dispatchEvent(new Event("close", { cancelable: !0 })) ? (await this.animateDialog(this.getCloseAnimation()), e.close(t), this.open = !1, this.dispatchEvent(new Event("closed"))) : this.returnValue = i;
  }
  connectedCallback() {
    super.connectedCallback(), this.isConnectedPromiseResolve();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.isConnectedPromise = this.getIsConnectedPromise();
  }
  render() {
    const t = this.open && !(this.isAtScrollTop && this.isAtScrollBottom), e = { "has-headline": this.hasHeadline, "has-actions": this.hasActions, "has-icon": this.hasIcon, scrollable: t, "show-top-divider": t && !this.isAtScrollTop, "show-bottom-divider": t && !this.isAtScrollBottom }, i = this.open && !this.noFocusTrap, r = y`
      <div
        class="focus-trap"
        tabindex="0"
        aria-hidden="true"
        @focus=${this.handleFocusTrapFocus}></div>
    `, { ariaLabel: o } = this;
    return y`
      <div class="scrim"></div>
      <dialog
        class=${At(e)}
        aria-label=${o || C}
        aria-labelledby=${this.hasHeadline ? "headline" : C}
        role=${this.type === "alert" ? "alertdialog" : C}
        @cancel=${this.handleCancel}
        @click=${this.handleDialogClick}
        @close=${this.handleClose}
        @keydown=${this.handleKeydown}
        .returnValue=${this.returnValue || C}>
        ${i ? r : C}
        <div class="container" @click=${this.handleContentClick}>
          <div class="headline">
            <div class="icon" aria-hidden="true">
              <slot name="icon" @slotchange=${this.handleIconChange}></slot>
            </div>
            <h2 id="headline" aria-hidden=${!this.hasHeadline || C}>
              <slot
                name="headline"
                @slotchange=${this.handleHeadlineChange}></slot>
            </h2>
            <md-divider></md-divider>
          </div>
          <div class="scroller">
            <div class="content">
              <div class="top anchor"></div>
              <slot name="content"></slot>
              <div class="bottom anchor"></div>
            </div>
          </div>
          <div class="actions">
            <md-divider></md-divider>
            <slot name="actions" @slotchange=${this.handleActionsChange}></slot>
          </div>
        </div>
        ${i ? r : C}
      </dialog>
    `;
  }
  firstUpdated() {
    this.intersectionObserver = new IntersectionObserver(((t) => {
      for (const e of t) this.handleAnchorIntersection(e);
    }), { root: this.scroller }), this.intersectionObserver.observe(this.topAnchor), this.intersectionObserver.observe(this.bottomAnchor);
  }
  handleDialogClick() {
    if (this.nextClickIsFromContent) return void (this.nextClickIsFromContent = !1);
    !this.dispatchEvent(new Event("cancel", { cancelable: !0 })) || this.close();
  }
  handleContentClick() {
    this.nextClickIsFromContent = !0;
  }
  handleSubmit(t) {
    const e = t.target, { submitter: i } = t;
    e.getAttribute("method") === "dialog" && i && this.close(i.getAttribute("value") ?? this.returnValue);
  }
  handleCancel(t) {
    if (t.target !== this.dialog) return;
    this.escapePressedWithoutCancel = !1;
    const e = !ts(this, t);
    t.preventDefault(), e || this.close();
  }
  handleClose() {
    var t;
    this.escapePressedWithoutCancel && (this.escapePressedWithoutCancel = !1, (t = this.dialog) === null || t === void 0 || t.dispatchEvent(new Event("cancel", { cancelable: !0 })));
  }
  handleKeydown(t) {
    t.key === "Escape" && (this.escapePressedWithoutCancel = !0, setTimeout((() => {
      this.escapePressedWithoutCancel = !1;
    })));
  }
  async animateDialog(t) {
    var e;
    if ((e = this.cancelAnimations) === null || e === void 0 || e.abort(), this.cancelAnimations = new AbortController(), this.quick) return;
    const { dialog: i, scrim: r, container: o, headline: a, content: n, actions: l } = this;
    if (!(i && r && o && a && n && l)) return;
    const { container: c, dialog: d, scrim: h, headline: g, content: A, actions: _ } = t, m = [[i, d ?? []], [r, h ?? []], [o, c ?? []], [a, g ?? []], [n, A ?? []], [l, _ ?? []]], f = [];
    for (const [b, E] of m) for (const u of E) {
      const I = b.animate(...u);
      this.cancelAnimations.signal.addEventListener("abort", (() => {
        I.cancel();
      })), f.push(I);
    }
    await Promise.all(f.map(((b) => b.finished.catch((() => {
    })))));
  }
  handleHeadlineChange(t) {
    const e = t.target;
    this.hasHeadline = e.assignedElements().length > 0;
  }
  handleActionsChange(t) {
    const e = t.target;
    this.hasActions = e.assignedElements().length > 0;
  }
  handleIconChange(t) {
    const e = t.target;
    this.hasIcon = e.assignedElements().length > 0;
  }
  handleAnchorIntersection(t) {
    const { target: e, isIntersecting: i } = t;
    e === this.topAnchor && (this.isAtScrollTop = i), e === this.bottomAnchor && (this.isAtScrollBottom = i);
  }
  getIsConnectedPromise() {
    return new Promise(((t) => {
      this.isConnectedPromiseResolve = t;
    }));
  }
  handleFocusTrapFocus(t) {
    const [e, i] = this.getFirstAndLastFocusableChildren();
    var r;
    if (!e || !i) return void ((r = this.dialog) === null || r === void 0 || r.focus());
    const o = t.target === this.firstFocusTrap, a = !o, n = t.relatedTarget === e, l = t.relatedTarget === i, c = !n && !l;
    if (a && l || o && c) return void e.focus();
    (o && n || a && c) && i.focus();
  }
  getFirstAndLastFocusableChildren() {
    if (!this.treewalker) return [null, null];
    let t = null, e = null;
    for (this.treewalker.currentNode = this.treewalker.root; this.treewalker.nextNode(); ) {
      const i = this.treewalker.currentNode;
      eh(i) && (t || (t = i), e = i);
    }
    return [t, e];
  }
};
function eh(s) {
  var t;
  const e = ":not(:disabled,[disabled])";
  return s.matches(":is(button,input,select,textarea,object,:is(a,area)[href],[tabindex],[contenteditable=true])" + e + ':not([tabindex^="-"])') ? !0 : !!s.localName.includes("-") && !!s.matches(e) && (((t = s.shadowRoot) === null || t === void 0 ? void 0 : t.delegatesFocus) ?? !1);
}
p([v({ type: Boolean })], W.prototype, "open", null), p([v({ type: Boolean })], W.prototype, "quick", void 0), p([v({ attribute: !1 })], W.prototype, "returnValue", void 0), p([v()], W.prototype, "type", void 0), p([v({ type: Boolean, attribute: "no-focus-trap" })], W.prototype, "noFocusTrap", void 0), p([N("dialog")], W.prototype, "dialog", void 0), p([N(".scrim")], W.prototype, "scrim", void 0), p([N(".container")], W.prototype, "container", void 0), p([N(".headline")], W.prototype, "headline", void 0), p([N(".content")], W.prototype, "content", void 0), p([N(".actions")], W.prototype, "actions", void 0), p([F()], W.prototype, "isAtScrollTop", void 0), p([F()], W.prototype, "isAtScrollBottom", void 0), p([N(".scroller")], W.prototype, "scroller", void 0), p([N(".top.anchor")], W.prototype, "topAnchor", void 0), p([N(".bottom.anchor")], W.prototype, "bottomAnchor", void 0), p([N(".focus-trap")], W.prototype, "firstFocusTrap", void 0), p([F()], W.prototype, "hasHeadline", void 0), p([F()], W.prototype, "hasActions", void 0), p([F()], W.prototype, "hasIcon", void 0);
const ih = L`:host{border-start-start-radius:var(--md-dialog-container-shape-start-start, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-start-end-radius:var(--md-dialog-container-shape-start-end, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-end-end-radius:var(--md-dialog-container-shape-end-end, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-end-start-radius:var(--md-dialog-container-shape-end-start, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));display:contents;margin:auto;max-height:min(560px,100% - 48px);max-width:min(560px,100% - 48px);min-height:140px;min-width:280px;position:fixed;height:fit-content;width:fit-content}dialog{background:rgba(0,0,0,0);border:none;border-radius:inherit;flex-direction:column;height:inherit;margin:inherit;max-height:inherit;max-width:inherit;min-height:inherit;min-width:inherit;outline:none;overflow:visible;padding:0;width:inherit}dialog[open]{display:flex}::backdrop{background:none}.scrim{background:var(--md-sys-color-scrim, #000);display:none;inset:0;opacity:32%;pointer-events:none;position:fixed;z-index:1}:host([open]) .scrim{display:flex}h2{all:unset;align-self:stretch}.headline{align-items:center;color:var(--md-dialog-headline-color, var(--md-sys-color-on-surface, #1d1b20));display:flex;flex-direction:column;font-family:var(--md-dialog-headline-font, var(--md-sys-typescale-headline-small-font, var(--md-ref-typeface-brand, Roboto)));font-size:var(--md-dialog-headline-size, var(--md-sys-typescale-headline-small-size, 1.5rem));line-height:var(--md-dialog-headline-line-height, var(--md-sys-typescale-headline-small-line-height, 2rem));font-weight:var(--md-dialog-headline-weight, var(--md-sys-typescale-headline-small-weight, var(--md-ref-typeface-weight-regular, 400)));position:relative}slot[name=headline]::slotted(*){align-items:center;align-self:stretch;box-sizing:border-box;display:flex;gap:8px;padding:24px 24px 0}.icon{display:flex}slot[name=icon]::slotted(*){color:var(--md-dialog-icon-color, var(--md-sys-color-secondary, #625b71));fill:currentColor;font-size:var(--md-dialog-icon-size, 24px);margin-top:24px;height:var(--md-dialog-icon-size, 24px);width:var(--md-dialog-icon-size, 24px)}.has-icon slot[name=headline]::slotted(*){justify-content:center;padding-top:16px}.scrollable slot[name=headline]::slotted(*){padding-bottom:16px}.scrollable.has-headline slot[name=content]::slotted(*){padding-top:8px}.container{border-radius:inherit;display:flex;flex-direction:column;flex-grow:1;overflow:hidden;position:relative;transform-origin:top}.container::before{background:var(--md-dialog-container-color, var(--md-sys-color-surface-container-high, #ece6f0));border-radius:inherit;content:"";inset:0;position:absolute}.scroller{display:flex;flex:1;flex-direction:column;overflow:hidden;z-index:1}.scrollable .scroller{overflow-y:scroll}.content{color:var(--md-dialog-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-dialog-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-dialog-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-dialog-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));flex:1;font-weight:var(--md-dialog-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)));height:min-content;position:relative}slot[name=content]::slotted(*){box-sizing:border-box;padding:24px}.anchor{position:absolute}.top.anchor{top:0}.bottom.anchor{bottom:0}.actions{position:relative}slot[name=actions]::slotted(*){box-sizing:border-box;display:flex;gap:8px;justify-content:flex-end;padding:16px 24px 24px}.has-actions slot[name=content]::slotted(*){padding-bottom:8px}md-divider{display:none;position:absolute}.has-headline.show-top-divider .headline md-divider,.has-actions.show-bottom-divider .actions md-divider{display:flex}.headline md-divider{bottom:0}.actions md-divider{top:0}@media(forced-colors: active){dialog{outline:2px solid WindowText}}
`;
let Eo = class extends W {
};
Eo.styles = [ih], customElements.define("ew-dialog", Eo);
const ln = L`
  :host {
    --roboto-font: Roboto, system-ui;
    --text-color: rgba(0, 0, 0, 0.6);
    --danger-color: #db4437;

    --md-sys-color-primary: #03a9f4;
    --md-sys-color-on-primary: #fff;
    --md-ref-typeface-brand: var(--roboto-font);
    --md-ref-typeface-plain: var(--roboto-font);

    --md-sys-color-surface: #fff;
    --md-sys-color-surface-container: #fff;
    --md-sys-color-surface-container-high: #fff;
    --md-sys-color-surface-container-highest: #f5f5f5;
    --md-sys-color-secondary-container: #e0e0e0;

    --md-sys-typescale-headline-font: var(--roboto-font);
    --md-sys-typescale-title-font: var(--roboto-font);
  }

  a {
    color: var(--md-sys-color-primary);
  }
`;
let wo;
function cn(s, t = Ft) {
  const e = Cr(s, t);
  return e && (e.tabIndex = 0, e.focus()), e;
}
function dn(s, t = Ft) {
  const e = hn(s, t);
  return e && (e.tabIndex = 0, e.focus()), e;
}
function Ye(s, t = Ft) {
  for (let e = 0; e < s.length; e++) {
    const i = s[e];
    if (i.tabIndex === 0 && t(i)) return { item: i, index: e };
  }
  return null;
}
function Cr(s, t = Ft) {
  for (const e of s) if (t(e)) return e;
  return null;
}
function hn(s, t = Ft) {
  for (let e = s.length - 1; e >= 0; e--) {
    const i = s[e];
    if (t(i)) return i;
  }
  return null;
}
function bo(s, t, e = Ft, i = !0) {
  if (t) {
    const r = (function(o, a, n = Ft, l = !0) {
      for (let c = 1; c < o.length; c++) {
        const d = (c + a) % o.length;
        if (d < a && !l) return null;
        const h = o[d];
        if (n(h)) return h;
      }
      return o[a] ? o[a] : null;
    })(s, t.index, e, i);
    return r && (r.tabIndex = 0, r.focus()), r;
  }
  return cn(s, e);
}
function yo(s, t, e = Ft, i = !0) {
  if (t) {
    const r = (function(o, a, n = Ft, l = !0) {
      for (let c = 1; c < o.length; c++) {
        const d = (a - c + o.length) % o.length;
        if (d > a && !l) return null;
        const h = o[d];
        if (n(h)) return h;
      }
      return o[a] ? o[a] : null;
    })(s, t.index, e, i);
    return r && (r.tabIndex = 0, r.focus()), r;
  }
  return dn(s, e);
}
function Ft(s) {
  return !s.disabled;
}
const X = { ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowUp: "ArrowUp", ArrowRight: "ArrowRight", Home: "Home", End: "End" };
class An {
  constructor(t) {
    this.handleKeydown = (d) => {
      const h = d.key;
      if (d.defaultPrevented || !this.isNavigableKey(h)) return;
      const g = this.items;
      if (!g.length) return;
      const A = Ye(g, this.isActivatable);
      d.preventDefault();
      const _ = this.isRtl();
      let m = null;
      switch (h) {
        case X.ArrowDown:
        case (_ ? X.ArrowLeft : X.ArrowRight):
          m = bo(g, A, this.isActivatable, this.wrapNavigation());
          break;
        case X.ArrowUp:
        case (_ ? X.ArrowRight : X.ArrowLeft):
          m = yo(g, A, this.isActivatable, this.wrapNavigation());
          break;
        case X.Home:
          m = cn(g, this.isActivatable);
          break;
        case X.End:
          m = dn(g, this.isActivatable);
      }
      m && A && A.item !== m && (A.item.tabIndex = -1);
    }, this.onDeactivateItems = () => {
      const d = this.items;
      for (const h of d) this.deactivateItem(h);
    }, this.onRequestActivation = (d) => {
      this.onDeactivateItems();
      const h = d.target;
      this.activateItem(h), h.focus();
    }, this.onSlotchange = () => {
      const d = this.items;
      let h = !1;
      for (const A of d)
        !(!A.disabled && A.tabIndex > -1) || h ? A.tabIndex = -1 : (h = !0, A.tabIndex = 0);
      if (h) return;
      const g = Cr(d, this.isActivatable);
      g && (g.tabIndex = 0);
    };
    const { isItem: e, getPossibleItems: i, isRtl: r, deactivateItem: o, activateItem: a, isNavigableKey: n, isActivatable: l, wrapNavigation: c } = t;
    this.isItem = e, this.getPossibleItems = i, this.isRtl = r, this.deactivateItem = o, this.activateItem = a, this.isNavigableKey = n, this.isActivatable = l, this.wrapNavigation = c ?? (() => !0);
  }
  get items() {
    const t = this.getPossibleItems(), e = [];
    for (const i of t) {
      if (this.isItem(i)) {
        e.push(i);
        continue;
      }
      const r = i.item;
      r && this.isItem(r) && e.push(r);
    }
    return e;
  }
  activateNextItem() {
    const t = this.items, e = Ye(t, this.isActivatable);
    return e && (e.item.tabIndex = -1), bo(t, e, this.isActivatable, this.wrapNavigation());
  }
  activatePreviousItem() {
    const t = this.items, e = Ye(t, this.isActivatable);
    return e && (e.item.tabIndex = -1), yo(t, e, this.isActivatable, this.wrapNavigation());
  }
}
const sh = new Set(Object.values(X));
class pn extends G {
  get items() {
    return this.listController.items;
  }
  constructor() {
    super(), this.listController = new An({ isItem: (t) => t.hasAttribute("md-list-item"), getPossibleItems: () => this.slotItems, isRtl: () => getComputedStyle(this).direction === "rtl", deactivateItem: (t) => {
      t.tabIndex = -1;
    }, activateItem: (t) => {
      t.tabIndex = 0;
    }, isNavigableKey: (t) => sh.has(t), isActivatable: (t) => !t.disabled && t.type !== "text" }), this.internals = this.attachInternals(), this.internals.role = "list", this.addEventListener("keydown", this.listController.handleKeydown);
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
p([kt({ flatten: !0 })], pn.prototype, "slotItems", void 0);
const rh = L`:host{background:var(--md-list-container-color, var(--md-sys-color-surface, #fef7ff));color:unset;display:flex;flex-direction:column;outline:none;padding:8px 0;position:relative}
`;
class Co extends pn {
}
Co.styles = [rh], customElements.define("ew-list", Co);
class Vs extends G {
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
    let t = !1, e = 0;
    for (const i of this.textSlots) if (oh(i) && (e += 1), e > 1) {
      t = !0;
      break;
    }
    this.multiline = t;
  }
}
function oh(s) {
  for (const e of s.assignedNodes({ flatten: !0 })) {
    var t;
    const i = e.nodeType === Node.ELEMENT_NODE, r = e.nodeType === Node.TEXT_NODE && ((t = e.textContent) === null || t === void 0 ? void 0 : t.match(/\S/));
    if (i || r) return !0;
  }
  return !1;
}
p([v({ type: Boolean, reflect: !0 })], Vs.prototype, "multiline", void 0), p([/* @__PURE__ */ (function(s) {
  return (t, e) => Xi(t, e, { get() {
    return (this.renderRoot ?? wo ?? (wo = document.createDocumentFragment())).querySelectorAll(s);
  } });
})(".text slot")], Vs.prototype, "textSlots", void 0);
const ah = L`:host{color:var(--md-sys-color-on-surface, #1d1b20);font-family:var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-large-size, 1rem);font-weight:var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-large-line-height, 1.5rem);align-items:center;box-sizing:border-box;display:flex;gap:16px;min-height:56px;overflow:hidden;padding:12px 16px;position:relative;text-overflow:ellipsis}:host([multiline]){min-height:72px}[name=overline]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-medium-size, 0.875rem);font-weight:var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-medium-line-height, 1.25rem)}[name=trailing-supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=container]::slotted(*){inset:0;position:absolute}.default-slot{display:inline}.default-slot,.text ::slotted(*){overflow:hidden;text-overflow:ellipsis}.text{display:flex;flex:1;flex-direction:column;overflow:hidden}
`;
let ws = class extends Vs {
};
ws.styles = [ah], ws = p([Jt("md-item")], ws);
const gn = /* @__PURE__ */ Symbol.for(""), nh = (s) => {
  if (s?.r === gn) return s?._$litStatic$;
}, Yt = (s, ...t) => ({ _$litStatic$: t.reduce(((e, i, r) => e + ((o) => {
  if (o._$litStatic$ !== void 0) return o._$litStatic$;
  throw Error(`Value passed to 'literal' function must be a 'literal' result: ${o}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`);
})(i) + s[r + 1]), s[0]), r: gn }), Bo = /* @__PURE__ */ new Map(), es = /* @__PURE__ */ ((s) => (t, ...e) => {
  const i = e.length;
  let r, o;
  const a = [], n = [];
  let l, c = 0, d = !1;
  for (; c < i; ) {
    for (l = t[c]; c < i && (o = e[c], (r = nh(o)) !== void 0); ) l += r + t[++c], d = !0;
    c !== i && n.push(o), a.push(l), c++;
  }
  if (c === i && a.push(t[i]), d) {
    const h = a.join("$$lit$$");
    (t = Bo.get(h)) === void 0 && (a.raw = a, Bo.set(h, t = a)), e = n;
  }
  return s(t, ...e);
})(y), lh = Ot(G);
class Qt extends lh {
  constructor() {
    super(...arguments), this.disabled = !1, this.type = "text", this.isListItem = !0, this.href = "", this.target = "";
  }
  get isDisabled() {
    return this.disabled && this.type !== "link";
  }
  willUpdate(t) {
    this.href && (this.type = "link"), super.willUpdate(t);
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
  renderListItem(t) {
    const e = this.type === "link";
    let i;
    switch (this.type) {
      case "link":
        i = Yt`a`;
        break;
      case "button":
        i = Yt`button`;
        break;
      default:
        i = Yt`li`;
    }
    const r = this.type !== "text", o = e && this.target ? this.target : C;
    return es`
      <${i}
        id="item"
        tabindex="${this.isDisabled || !r ? -1 : 0}"
        ?disabled=${this.isDisabled}
        role="listitem"
        aria-selected=${this.ariaSelected || C}
        aria-checked=${this.ariaChecked || C}
        aria-expanded=${this.ariaExpanded || C}
        aria-haspopup=${this.ariaHasPopup || C}
        class="list-item ${At(this.getRenderClasses())}"
        href=${this.href || C}
        target=${o}
        @focus=${this.onFocus}
      >${t}</${i}>
    `;
  }
  renderRipple() {
    return this.type === "text" ? C : y` <md-ripple
      part="ripple"
      for="item"
      ?disabled=${this.isDisabled}></md-ripple>`;
  }
  renderFocusRing() {
    return this.type === "text" ? C : y` <md-focus-ring
      @visibility-changed=${this.onFocusRingVisibilityChanged}
      part="focus-ring"
      for="item"
      inward></md-focus-ring>`;
  }
  onFocusRingVisibilityChanged(t) {
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
    var t;
    (t = this.listItemRoot) === null || t === void 0 || t.focus();
  }
  click() {
    this.listItemRoot ? this.listItemRoot.click() : super.click();
  }
}
Qt.shadowRootOptions = { ...G.shadowRootOptions, delegatesFocus: !0 }, p([v({ type: Boolean, reflect: !0 })], Qt.prototype, "disabled", void 0), p([v({ reflect: !0 })], Qt.prototype, "type", void 0), p([v({ type: Boolean, attribute: "md-list-item", reflect: !0 })], Qt.prototype, "isListItem", void 0), p([v()], Qt.prototype, "href", void 0), p([v()], Qt.prototype, "target", void 0), p([N(".list-item")], Qt.prototype, "listItemRoot", void 0);
const ch = L`:host{display:flex;-webkit-tap-highlight-color:rgba(0,0,0,0);--md-ripple-hover-color: var(--md-list-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-list-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-list-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-list-item-pressed-state-layer-opacity, 0.12)}:host(:is([type=button]:not([disabled]),[type=link])){cursor:pointer}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;cursor:inherit;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);width:100%}.list-item.interactive{cursor:pointer}.list-item.disabled{opacity:var(--md-list-item-disabled-opacity, 0.3);pointer-events:none}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;height:100%;color:var(--md-list-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-list-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-list-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-list-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-list-item-one-line-container-height, 56px);padding-top:var(--md-list-item-top-space, 12px);padding-bottom:var(--md-list-item-bottom-space, 12px);padding-inline-start:var(--md-list-item-leading-space, 16px);padding-inline-end:var(--md-list-item-trailing-space, 16px)}md-item[multiline]{min-height:var(--md-list-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-list-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-list-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-list-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-list-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-list-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-list-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-list-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-list-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}@media(forced-colors: active){.disabled slot{color:GrayText}.list-item.disabled{color:GrayText;opacity:1}}
`;
class Io extends Qt {
}
Io.styles = [ch], customElements.define("ew-list-item", Io);
class xo extends Le {
}
xo.styles = [nn], customElements.define("ew-divider", xo);
const si = /* @__PURE__ */ Symbol("createValidator"), ri = /* @__PURE__ */ Symbol("getValidityAnchor"), bs = /* @__PURE__ */ Symbol("privateValidator"), St = /* @__PURE__ */ Symbol("privateSyncValidity"), mi = /* @__PURE__ */ Symbol("privateCustomValidationMessage");
function Br(s) {
  var t;
  class e extends s {
    constructor() {
      super(...arguments), this[t] = "";
    }
    get validity() {
      return this[St](), this[st].validity;
    }
    get validationMessage() {
      return this[St](), this[st].validationMessage;
    }
    get willValidate() {
      return this[St](), this[st].willValidate;
    }
    checkValidity() {
      return this[St](), this[st].checkValidity();
    }
    reportValidity() {
      return this[St](), this[st].reportValidity();
    }
    setCustomValidity(r) {
      this[mi] = r, this[St]();
    }
    requestUpdate(r, o, a) {
      super.requestUpdate(r, o, a), this[St]();
    }
    firstUpdated(r) {
      super.firstUpdated(r), this[St]();
    }
    [(t = mi, St)]() {
      this[bs] || (this[bs] = this[si]());
      const { validity: r, validationMessage: o } = this[bs].getValidity(), a = !!this[mi], n = this[mi] || o;
      this[st].setValidity({ ...r, customError: a }, n, this[ri]() ?? void 0);
    }
    [si]() {
      throw new Error("Implement [createValidator]");
    }
    [ri]() {
      throw new Error("Implement [getValidityAnchor]");
    }
  }
  return e;
}
const fe = /* @__PURE__ */ Symbol("getFormValue"), qs = /* @__PURE__ */ Symbol("getFormState");
function Ir(s) {
  class t extends s {
    get form() {
      return this[st].form;
    }
    get labels() {
      return this[st].labels;
    }
    get name() {
      return this.getAttribute("name") ?? "";
    }
    set name(i) {
      this.setAttribute("name", i);
    }
    get disabled() {
      return this.hasAttribute("disabled");
    }
    set disabled(i) {
      this.toggleAttribute("disabled", i);
    }
    attributeChangedCallback(i, r, o) {
      if (i !== "name" && i !== "disabled") super.attributeChangedCallback(i, r, o);
      else {
        const a = i === "disabled" ? r !== null : r;
        this.requestUpdate(i, a);
      }
    }
    requestUpdate(i, r, o) {
      super.requestUpdate(i, r, o), this[st].setFormValue(this[fe](), this[qs]());
    }
    [fe]() {
      throw new Error("Implement [getFormValue]");
    }
    [qs]() {
      return this[fe]();
    }
    formDisabledCallback(i) {
      this.disabled = i;
    }
  }
  return t.formAssociated = !0, p([v({ noAccessor: !0 })], t.prototype, "name", null), p([v({ type: Boolean, noAccessor: !0 })], t.prototype, "disabled", null), t;
}
class xr {
  constructor(t) {
    this.getCurrentState = t, this.currentValidity = { validity: {}, validationMessage: "" };
  }
  getValidity() {
    const t = this.getCurrentState();
    if (!(!this.prevState || !this.equals(this.prevState, t))) return this.currentValidity;
    const { validity: e, validationMessage: i } = this.computeValidity(t);
    return this.prevState = this.copy(t), this.currentValidity = { validationMessage: i, validity: { badInput: e.badInput, customError: e.customError, patternMismatch: e.patternMismatch, rangeOverflow: e.rangeOverflow, rangeUnderflow: e.rangeUnderflow, stepMismatch: e.stepMismatch, tooLong: e.tooLong, tooShort: e.tooShort, typeMismatch: e.typeMismatch, valueMissing: e.valueMissing } }, this.currentValidity;
  }
}
class dh extends xr {
  computeValidity(t) {
    return this.checkboxControl || (this.checkboxControl = document.createElement("input"), this.checkboxControl.type = "checkbox"), this.checkboxControl.checked = t.checked, this.checkboxControl.required = t.required, { validity: this.checkboxControl.validity, validationMessage: this.checkboxControl.validationMessage };
  }
  equals(t, e) {
    return t.checked === e.checked && t.required === e.required;
  }
  copy({ checked: t, required: e }) {
    return { checked: t, required: e };
  }
}
const hh = Ot(Br(Ir(hi(G))));
class wt extends hh {
  constructor() {
    super(), this.checked = !1, this.indeterminate = !1, this.required = !1, this.value = "on", this.prevChecked = !1, this.prevDisabled = !1, this.prevIndeterminate = !1, this.addEventListener("click", ((t) => {
      an(t) && this.input && (this.focus(), on(this.input));
    }));
  }
  update(t) {
    (t.has("checked") || t.has("disabled") || t.has("indeterminate")) && (this.prevChecked = t.get("checked") ?? this.checked, this.prevDisabled = t.get("disabled") ?? this.disabled, this.prevIndeterminate = t.get("indeterminate") ?? this.indeterminate), super.update(t);
  }
  render() {
    const t = !this.prevChecked && !this.prevIndeterminate, e = this.prevChecked && !this.prevIndeterminate, i = this.prevIndeterminate, r = this.checked && !this.indeterminate, o = this.indeterminate, a = At({ disabled: this.disabled, selected: r || o, unselected: !r && !o, checked: r, indeterminate: o, "prev-unselected": t, "prev-checked": e, "prev-indeterminate": i, "prev-disabled": this.prevDisabled }), { ariaLabel: n, ariaInvalid: l } = this;
    return y`
      <div class="container ${a}">
        <input
          type="checkbox"
          id="input"
          aria-checked=${o ? "mixed" : C}
          aria-label=${n || C}
          aria-invalid=${l || C}
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
  handleInput(t) {
    const e = t.target;
    this.checked = e.checked, this.indeterminate = e.indeterminate;
  }
  handleChange(t) {
    ts(this, t);
  }
  [fe]() {
    return !this.checked || this.indeterminate ? null : this.value;
  }
  [qs]() {
    return String(this.checked);
  }
  formResetCallback() {
    this.checked = this.hasAttribute("checked");
  }
  formStateRestoreCallback(t) {
    this.checked = t === "true";
  }
  [si]() {
    return new dh((() => this));
  }
  [ri]() {
    return this.input;
  }
}
wt.shadowRootOptions = { ...G.shadowRootOptions, delegatesFocus: !0 }, p([v({ type: Boolean })], wt.prototype, "checked", void 0), p([v({ type: Boolean })], wt.prototype, "indeterminate", void 0), p([v({ type: Boolean })], wt.prototype, "required", void 0), p([v()], wt.prototype, "value", void 0), p([F()], wt.prototype, "prevChecked", void 0), p([F()], wt.prototype, "prevDisabled", void 0), p([F()], wt.prototype, "prevIndeterminate", void 0), p([N("input")], wt.prototype, "input", void 0);
const Ah = L`:host{border-start-start-radius:var(--md-checkbox-container-shape-start-start, var(--md-checkbox-container-shape, 2px));border-start-end-radius:var(--md-checkbox-container-shape-start-end, var(--md-checkbox-container-shape, 2px));border-end-end-radius:var(--md-checkbox-container-shape-end-end, var(--md-checkbox-container-shape, 2px));border-end-start-radius:var(--md-checkbox-container-shape-end-start, var(--md-checkbox-container-shape, 2px));display:inline-flex;height:var(--md-checkbox-container-size, 18px);position:relative;vertical-align:top;width:var(--md-checkbox-container-size, 18px);-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer}:host([disabled]){cursor:default}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--md-checkbox-container-size, 18px))/2)}md-focus-ring{height:44px;inset:unset;width:44px}input{appearance:none;height:48px;margin:0;opacity:0;outline:none;position:absolute;width:48px;z-index:1;cursor:inherit}:host([touch-target=none]) input{height:100%;width:100%}.container{border-radius:inherit;display:flex;height:100%;place-content:center;place-items:center;position:relative;width:100%}.outline,.background,.icon{inset:0;position:absolute}.outline,.background{border-radius:inherit}.outline{border-color:var(--md-checkbox-outline-color, var(--md-sys-color-on-surface-variant, #49454f));border-style:solid;border-width:var(--md-checkbox-outline-width, 2px);box-sizing:border-box}.background{background-color:var(--md-checkbox-selected-container-color, var(--md-sys-color-primary, #6750a4))}.background,.icon{opacity:0;transition-duration:150ms,50ms;transition-property:transform,opacity;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15),linear;transform:scale(0.6)}:where(.selected) :is(.background,.icon){opacity:1;transition-duration:350ms,50ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1),linear;transform:scale(1)}md-ripple{border-radius:var(--md-checkbox-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));height:var(--md-checkbox-state-layer-size, 40px);inset:unset;width:var(--md-checkbox-state-layer-size, 40px);--md-ripple-hover-color: var(--md-checkbox-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-checkbox-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-pressed-opacity: var(--md-checkbox-pressed-state-layer-opacity, 0.12)}.selected md-ripple{--md-ripple-hover-color: var(--md-checkbox-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-hover-opacity: var(--md-checkbox-selected-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-selected-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-checkbox-selected-pressed-state-layer-opacity, 0.12)}.icon{fill:var(--md-checkbox-selected-icon-color, var(--md-sys-color-on-primary, #fff));height:var(--md-checkbox-icon-size, 18px);width:var(--md-checkbox-icon-size, 18px)}.mark.short{height:2px;transition-property:transform,height;width:2px}.mark.long{height:2px;transition-property:transform,width;width:10px}.mark{animation-duration:150ms;animation-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15);transition-duration:150ms;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15)}.selected .mark{animation-duration:350ms;animation-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1);transition-duration:350ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1)}.checked .mark,.prev-checked.unselected .mark{transform:scaleY(-1) translate(7px, -14px) rotate(45deg)}.checked .mark.short,.prev-checked.unselected .mark.short{height:5.6568542495px}.checked .mark.long,.prev-checked.unselected .mark.long{width:11.313708499px}.indeterminate .mark,.prev-indeterminate.unselected .mark{transform:scaleY(-1) translate(4px, -10px) rotate(0deg)}.prev-unselected .mark{transition-property:none}.prev-unselected.checked .mark.long{animation-name:prev-unselected-to-checked}@keyframes prev-unselected-to-checked{from{width:0}}:where(:hover) .outline{border-color:var(--md-checkbox-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-hover-outline-width, 2px)}:where(:hover) .background{background:var(--md-checkbox-selected-hover-container-color, var(--md-sys-color-primary, #6750a4))}:where(:hover) .icon{fill:var(--md-checkbox-selected-hover-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:focus-within) .outline{border-color:var(--md-checkbox-focus-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-focus-outline-width, 2px)}:where(:focus-within) .background{background:var(--md-checkbox-selected-focus-container-color, var(--md-sys-color-primary, #6750a4))}:where(:focus-within) .icon{fill:var(--md-checkbox-selected-focus-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:active) .outline{border-color:var(--md-checkbox-pressed-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-pressed-outline-width, 2px)}:where(:active) .background{background:var(--md-checkbox-selected-pressed-container-color, var(--md-sys-color-primary, #6750a4))}:where(:active) .icon{fill:var(--md-checkbox-selected-pressed-icon-color, var(--md-sys-color-on-primary, #fff))}:where(.disabled,.prev-disabled) :is(.background,.icon,.mark){animation-duration:0s;transition-duration:0s}:where(.disabled) .outline{border-color:var(--md-checkbox-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-disabled-outline-width, 2px);opacity:var(--md-checkbox-disabled-container-opacity, 0.38)}:where(.selected.disabled) .outline{visibility:hidden}:where(.selected.disabled) .background{background:var(--md-checkbox-selected-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-checkbox-selected-disabled-container-opacity, 0.38)}:where(.disabled) .icon{fill:var(--md-checkbox-selected-disabled-icon-color, var(--md-sys-color-surface, #fef7ff))}@media(forced-colors: active){.background{background-color:CanvasText}.selected.disabled .background{background-color:GrayText;opacity:1}.outline{border-color:CanvasText}.disabled .outline{border-color:GrayText;opacity:1}.icon{fill:Canvas}}
`;
class So extends wt {
}
So.styles = [Ah], customElements.define("ew-checkbox", So);
class ph {
  constructor(t) {
    this.targetElement = t, this.state = { bold: !1, italic: !1, underline: !1, strikethrough: !1, foregroundColor: null, backgroundColor: null, carriageReturn: !1, lines: [], secret: !1 };
  }
  logs() {
    return this.targetElement.innerText;
  }
  processLine(t) {
    const e = /(?:\033|\\033)(?:\[(.*?)[@-~]|\].*?(?:\007|\033\\))/g;
    let i = 0;
    const r = document.createElement("span");
    r.classList.add("line");
    const o = (a) => {
      if (a === "") return;
      const n = document.createElement("span");
      if (this.state.bold && n.classList.add("log-bold"), this.state.italic && n.classList.add("log-italic"), this.state.underline && n.classList.add("log-underline"), this.state.strikethrough && n.classList.add("log-strikethrough"), this.state.secret && n.classList.add("log-secret"), this.state.foregroundColor !== null && n.classList.add(`log-fg-${this.state.foregroundColor}`), this.state.backgroundColor !== null && n.classList.add(`log-bg-${this.state.backgroundColor}`), n.appendChild(document.createTextNode(a)), r.appendChild(n), this.state.secret) {
        const l = document.createElement("span");
        l.classList.add("log-secret-redacted"), l.appendChild(document.createTextNode("[redacted]")), r.appendChild(l);
      }
    };
    for (; ; ) {
      const a = e.exec(t);
      if (a === null) break;
      const n = a.index;
      if (o(t.substring(i, n)), i = n + a[0].length, a[1] !== void 0) for (const l of a[1].split(";")) switch (parseInt(l)) {
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
    return o(t.substring(i)), r;
  }
  processLines() {
    const t = this.targetElement.scrollTop > this.targetElement.scrollHeight - this.targetElement.offsetHeight - 50, e = this.state.carriageReturn, i = document.createDocumentFragment();
    if (this.state.lines.length != 0) {
      for (const r of this.state.lines) this.state.carriageReturn && r !== `
` && i.childElementCount && i.removeChild(i.lastChild), i.appendChild(this.processLine(r)), this.state.carriageReturn = r.includes("\r");
      e && this.state.lines[0] !== `
` ? this.targetElement.replaceChild(i, this.targetElement.lastChild) : this.targetElement.appendChild(i), this.state.lines = [], t && (this.targetElement.scrollTop = this.targetElement.scrollHeight);
    }
  }
  addLine(t) {
    this.state.lines.length == 0 && setTimeout((() => this.processLines()), 0), this.state.lines.push(t);
  }
}
const me = (s) => new Promise(((t) => setTimeout(t, s)));
class gh {
  constructor() {
    this.chunks = "";
  }
  transform(t, e) {
    this.chunks += t;
    const i = this.chunks.split(/\r?\n/);
    this.chunks = i.pop(), i.forEach(((r) => e.enqueue(r + `\r
`)));
  }
  flush(t) {
    t.enqueue(this.chunks);
  }
}
class uh {
  transform(t, e) {
    const i = /* @__PURE__ */ new Date(), r = i.getHours().toString().padStart(2, "0"), o = i.getMinutes().toString().padStart(2, "0"), a = i.getSeconds().toString().padStart(2, "0");
    e.enqueue(`[${r}:${o}:${a}]${t}`);
  }
}
class Q extends Error {
}
function Ie(s) {
  let t = s.length;
  for (; --t >= 0; ) s[t] = 0;
}
const Sr = 256, un = 286, Ne = 30, Ke = 15, Zs = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]), Fi = new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]), fh = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]), Ro = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Mt = new Array(576);
Ie(Mt);
const ze = new Array(60);
Ie(ze);
const oi = new Array(512);
Ie(oi);
const ai = new Array(256);
Ie(ai);
const Rr = new Array(29);
Ie(Rr);
const Ni = new Array(Ne);
function ys(s, t, e, i, r) {
  this.static_tree = s, this.extra_bits = t, this.extra_base = e, this.elems = i, this.max_length = r, this.has_stree = s && s.length;
}
let Do, Mo, To;
function Cs(s, t) {
  this.dyn_tree = s, this.max_code = 0, this.stat_desc = t;
}
Ie(Ni);
const fn = (s) => s < 256 ? oi[s] : oi[256 + (s >>> 7)], ni = (s, t) => {
  s.pending_buf[s.pending++] = 255 & t, s.pending_buf[s.pending++] = t >>> 8 & 255;
}, at = (s, t, e) => {
  s.bi_valid > 16 - e ? (s.bi_buf |= t << s.bi_valid & 65535, ni(s, s.bi_buf), s.bi_buf = t >> 16 - s.bi_valid, s.bi_valid += e - 16) : (s.bi_buf |= t << s.bi_valid & 65535, s.bi_valid += e);
}, yt = (s, t, e) => {
  at(s, e[2 * t], e[2 * t + 1]);
}, mn = (s, t) => {
  let e = 0;
  do
    e |= 1 & s, s >>>= 1, e <<= 1;
  while (--t > 0);
  return e >>> 1;
}, vn = (s, t, e) => {
  const i = new Array(16);
  let r, o, a = 0;
  for (r = 1; r <= Ke; r++) a = a + e[r - 1] << 1, i[r] = a;
  for (o = 0; o <= t; o++) {
    let n = s[2 * o + 1];
    n !== 0 && (s[2 * o] = mn(i[n]++, n));
  }
}, _n = (s) => {
  let t;
  for (t = 0; t < un; t++) s.dyn_ltree[2 * t] = 0;
  for (t = 0; t < Ne; t++) s.dyn_dtree[2 * t] = 0;
  for (t = 0; t < 19; t++) s.bl_tree[2 * t] = 0;
  s.dyn_ltree[512] = 1, s.opt_len = s.static_len = 0, s.sym_next = s.matches = 0;
}, En = (s) => {
  s.bi_valid > 8 ? ni(s, s.bi_buf) : s.bi_valid > 0 && (s.pending_buf[s.pending++] = s.bi_buf), s.bi_buf = 0, s.bi_valid = 0;
}, ko = (s, t, e, i) => {
  const r = 2 * t, o = 2 * e;
  return s[r] < s[o] || s[r] === s[o] && i[t] <= i[e];
}, Bs = (s, t, e) => {
  const i = s.heap[e];
  let r = e << 1;
  for (; r <= s.heap_len && (r < s.heap_len && ko(t, s.heap[r + 1], s.heap[r], s.depth) && r++, !ko(t, i, s.heap[r], s.depth)); ) s.heap[e] = s.heap[r], e = r, r <<= 1;
  s.heap[e] = i;
}, Fo = (s, t, e) => {
  let i, r, o, a, n = 0;
  if (s.sym_next !== 0) do
    i = 255 & s.pending_buf[s.sym_buf + n++], i += (255 & s.pending_buf[s.sym_buf + n++]) << 8, r = s.pending_buf[s.sym_buf + n++], i === 0 ? yt(s, r, t) : (o = ai[r], yt(s, o + Sr + 1, t), a = Zs[o], a !== 0 && (r -= Rr[o], at(s, r, a)), i--, o = fn(i), yt(s, o, e), a = Fi[o], a !== 0 && (i -= Ni[o], at(s, i, a)));
  while (n < s.sym_next);
  yt(s, 256, t);
}, Is = (s, t) => {
  const e = t.dyn_tree, i = t.stat_desc.static_tree, r = t.stat_desc.has_stree, o = t.stat_desc.elems;
  let a, n, l, c = -1;
  for (s.heap_len = 0, s.heap_max = 573, a = 0; a < o; a++) e[2 * a] !== 0 ? (s.heap[++s.heap_len] = c = a, s.depth[a] = 0) : e[2 * a + 1] = 0;
  for (; s.heap_len < 2; ) l = s.heap[++s.heap_len] = c < 2 ? ++c : 0, e[2 * l] = 1, s.depth[l] = 0, s.opt_len--, r && (s.static_len -= i[2 * l + 1]);
  for (t.max_code = c, a = s.heap_len >> 1; a >= 1; a--) Bs(s, e, a);
  l = o;
  do
    a = s.heap[1], s.heap[1] = s.heap[s.heap_len--], Bs(s, e, 1), n = s.heap[1], s.heap[--s.heap_max] = a, s.heap[--s.heap_max] = n, e[2 * l] = e[2 * a] + e[2 * n], s.depth[l] = (s.depth[a] >= s.depth[n] ? s.depth[a] : s.depth[n]) + 1, e[2 * a + 1] = e[2 * n + 1] = l, s.heap[1] = l++, Bs(s, e, 1);
  while (s.heap_len >= 2);
  s.heap[--s.heap_max] = s.heap[1], ((d, h) => {
    const g = h.dyn_tree, A = h.max_code, _ = h.stat_desc.static_tree, m = h.stat_desc.has_stree, f = h.stat_desc.extra_bits, b = h.stat_desc.extra_base, E = h.stat_desc.max_length;
    let u, I, D, w, M, R, x = 0;
    for (w = 0; w <= Ke; w++) d.bl_count[w] = 0;
    for (g[2 * d.heap[d.heap_max] + 1] = 0, u = d.heap_max + 1; u < 573; u++) I = d.heap[u], w = g[2 * g[2 * I + 1] + 1] + 1, w > E && (w = E, x++), g[2 * I + 1] = w, I > A || (d.bl_count[w]++, M = 0, I >= b && (M = f[I - b]), R = g[2 * I], d.opt_len += R * (w + M), m && (d.static_len += R * (_[2 * I + 1] + M)));
    if (x !== 0) {
      do {
        for (w = E - 1; d.bl_count[w] === 0; ) w--;
        d.bl_count[w]--, d.bl_count[w + 1] += 2, d.bl_count[E]--, x -= 2;
      } while (x > 0);
      for (w = E; w !== 0; w--) for (I = d.bl_count[w]; I !== 0; ) D = d.heap[--u], D > A || (g[2 * D + 1] !== w && (d.opt_len += (w - g[2 * D + 1]) * g[2 * D], g[2 * D + 1] = w), I--);
    }
  })(s, t), vn(e, c, s.bl_count);
}, Oo = (s, t, e) => {
  let i, r, o = -1, a = t[1], n = 0, l = 7, c = 4;
  for (a === 0 && (l = 138, c = 3), t[2 * (e + 1) + 1] = 65535, i = 0; i <= e; i++) r = a, a = t[2 * (i + 1) + 1], ++n < l && r === a || (n < c ? s.bl_tree[2 * r] += n : r !== 0 ? (r !== o && s.bl_tree[2 * r]++, s.bl_tree[32]++) : n <= 10 ? s.bl_tree[34]++ : s.bl_tree[36]++, n = 0, o = r, a === 0 ? (l = 138, c = 3) : r === a ? (l = 6, c = 3) : (l = 7, c = 4));
}, Po = (s, t, e) => {
  let i, r, o = -1, a = t[1], n = 0, l = 7, c = 4;
  for (a === 0 && (l = 138, c = 3), i = 0; i <= e; i++) if (r = a, a = t[2 * (i + 1) + 1], !(++n < l && r === a)) {
    if (n < c) do
      yt(s, r, s.bl_tree);
    while (--n != 0);
    else r !== 0 ? (r !== o && (yt(s, r, s.bl_tree), n--), yt(s, 16, s.bl_tree), at(s, n - 3, 2)) : n <= 10 ? (yt(s, 17, s.bl_tree), at(s, n - 3, 3)) : (yt(s, 18, s.bl_tree), at(s, n - 11, 7));
    n = 0, o = r, a === 0 ? (l = 138, c = 3) : r === a ? (l = 6, c = 3) : (l = 7, c = 4);
  }
};
let Uo = !1;
const wn = (s, t, e, i) => {
  at(s, 0 + (i ? 1 : 0), 3), En(s), ni(s, e), ni(s, ~e), e && s.pending_buf.set(s.window.subarray(t, t + e), s.pending), s.pending += e;
};
var mh = (s) => {
  Uo || ((() => {
    let t, e, i, r, o;
    const a = new Array(16);
    for (i = 0, r = 0; r < 28; r++) for (Rr[r] = i, t = 0; t < 1 << Zs[r]; t++) ai[i++] = r;
    for (ai[i - 1] = r, o = 0, r = 0; r < 16; r++) for (Ni[r] = o, t = 0; t < 1 << Fi[r]; t++) oi[o++] = r;
    for (o >>= 7; r < Ne; r++) for (Ni[r] = o << 7, t = 0; t < 1 << Fi[r] - 7; t++) oi[256 + o++] = r;
    for (e = 0; e <= Ke; e++) a[e] = 0;
    for (t = 0; t <= 143; ) Mt[2 * t + 1] = 8, t++, a[8]++;
    for (; t <= 255; ) Mt[2 * t + 1] = 9, t++, a[9]++;
    for (; t <= 279; ) Mt[2 * t + 1] = 7, t++, a[7]++;
    for (; t <= 287; ) Mt[2 * t + 1] = 8, t++, a[8]++;
    for (vn(Mt, 287, a), t = 0; t < Ne; t++) ze[2 * t + 1] = 5, ze[2 * t] = mn(t, 5);
    Do = new ys(Mt, Zs, 257, un, Ke), Mo = new ys(ze, Fi, 0, Ne, Ke), To = new ys(new Array(0), fh, 0, 19, 7);
  })(), Uo = !0), s.l_desc = new Cs(s.dyn_ltree, Do), s.d_desc = new Cs(s.dyn_dtree, Mo), s.bl_desc = new Cs(s.bl_tree, To), s.bi_buf = 0, s.bi_valid = 0, _n(s);
}, vh = (s, t, e, i) => {
  let r, o, a = 0;
  s.level > 0 ? (s.strm.data_type === 2 && (s.strm.data_type = ((n) => {
    let l, c = 4093624447;
    for (l = 0; l <= 31; l++, c >>>= 1) if (1 & c && n.dyn_ltree[2 * l] !== 0) return 0;
    if (n.dyn_ltree[18] !== 0 || n.dyn_ltree[20] !== 0 || n.dyn_ltree[26] !== 0) return 1;
    for (l = 32; l < Sr; l++) if (n.dyn_ltree[2 * l] !== 0) return 1;
    return 0;
  })(s)), Is(s, s.l_desc), Is(s, s.d_desc), a = ((n) => {
    let l;
    for (Oo(n, n.dyn_ltree, n.l_desc.max_code), Oo(n, n.dyn_dtree, n.d_desc.max_code), Is(n, n.bl_desc), l = 18; l >= 3 && n.bl_tree[2 * Ro[l] + 1] === 0; l--) ;
    return n.opt_len += 3 * (l + 1) + 5 + 5 + 4, l;
  })(s), r = s.opt_len + 3 + 7 >>> 3, o = s.static_len + 3 + 7 >>> 3, o <= r && (r = o)) : r = o = e + 5, e + 4 <= r && t !== -1 ? wn(s, t, e, i) : s.strategy === 4 || o === r ? (at(s, 2 + (i ? 1 : 0), 3), Fo(s, Mt, ze)) : (at(s, 4 + (i ? 1 : 0), 3), ((n, l, c, d) => {
    let h;
    for (at(n, l - 257, 5), at(n, c - 1, 5), at(n, d - 4, 4), h = 0; h < d; h++) at(n, n.bl_tree[2 * Ro[h] + 1], 3);
    Po(n, n.dyn_ltree, l - 1), Po(n, n.dyn_dtree, c - 1);
  })(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, a + 1), Fo(s, s.dyn_ltree, s.dyn_dtree)), _n(s), i && En(s);
}, _h = { _tr_init: mh, _tr_stored_block: wn, _tr_flush_block: vh, _tr_tally: (s, t, e) => (s.pending_buf[s.sym_buf + s.sym_next++] = t, s.pending_buf[s.sym_buf + s.sym_next++] = t >> 8, s.pending_buf[s.sym_buf + s.sym_next++] = e, t === 0 ? s.dyn_ltree[2 * e]++ : (s.matches++, t--, s.dyn_ltree[2 * (ai[e] + Sr + 1)]++, s.dyn_dtree[2 * fn(t)]++), s.sym_next === s.sym_end), _tr_align: (s) => {
  at(s, 2, 3), yt(s, 256, Mt), ((t) => {
    t.bi_valid === 16 ? (ni(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = 255 & t.bi_buf, t.bi_buf >>= 8, t.bi_valid -= 8);
  })(s);
} }, li = (s, t, e, i) => {
  let r = 65535 & s | 0, o = s >>> 16 & 65535 | 0, a = 0;
  for (; e !== 0; ) {
    a = e > 2e3 ? 2e3 : e, e -= a;
    do
      r = r + t[i++] | 0, o = o + r | 0;
    while (--a);
    r %= 65521, o %= 65521;
  }
  return r | o << 16 | 0;
};
const Eh = new Uint32Array((() => {
  let s, t = [];
  for (var e = 0; e < 256; e++) {
    s = e;
    for (var i = 0; i < 8; i++) s = 1 & s ? 3988292384 ^ s >>> 1 : s >>> 1;
    t[e] = s;
  }
  return t;
})());
var q = (s, t, e, i) => {
  const r = Eh, o = i + e;
  s ^= -1;
  for (let a = i; a < o; a++) s = s >>> 8 ^ r[255 & (s ^ t[a])];
  return -1 ^ s;
}, be = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" }, is = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_MEM_ERROR: -4, Z_BUF_ERROR: -5, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
const { _tr_init: wh, _tr_stored_block: Xs, _tr_flush_block: bh, _tr_tally: Nt, _tr_align: yh } = _h, { Z_NO_FLUSH: Kt, Z_PARTIAL_FLUSH: Ch, Z_FULL_FLUSH: Bh, Z_FINISH: gt, Z_BLOCK: Qo, Z_OK: Z, Z_STREAM_END: Ho, Z_STREAM_ERROR: Ct, Z_DATA_ERROR: Ih, Z_BUF_ERROR: xs, Z_DEFAULT_COMPRESSION: xh, Z_FILTERED: Sh, Z_HUFFMAN_ONLY: vi, Z_RLE: Rh, Z_FIXED: Dh, Z_DEFAULT_STRATEGY: Mh, Z_UNKNOWN: Th, Z_DEFLATED: Ki } = is, ie = 258, It = 262, ye = 42, Zt = 113, Pe = 666, Xt = (s, t) => (s.msg = be[t], t), Go = (s) => 2 * s - (s > 4 ? 9 : 0), Lt = (s) => {
  let t = s.length;
  for (; --t >= 0; ) s[t] = 0;
}, kh = (s) => {
  let t, e, i, r = s.w_size;
  t = s.hash_size, i = t;
  do
    e = s.head[--i], s.head[i] = e >= r ? e - r : 0;
  while (--t);
  t = r, i = t;
  do
    e = s.prev[--i], s.prev[i] = e >= r ? e - r : 0;
  while (--t);
};
let Dr = (s, t, e) => (t << s.hash_shift ^ e) & s.hash_mask;
const ne = (s, t) => {
  let e;
  if (s.legacy_hash) e = s.ins_h = Dr(s, s.ins_h, s.window[t + 3 - 1]);
  else {
    const r = s.window, o = r[t] | r[t + 1] << 8 | r[t + 2] << 16 | r[t + 3] << 24;
    e = s.ins_h = Math.imul(o, 66521) + 66521 >>> 16 & s.hash_mask;
  }
  const i = s.prev[t & s.w_mask] = s.head[e];
  return s.head[e] = t, i;
}, ct = (s) => {
  const t = s.state;
  let e = t.pending;
  e > s.avail_out && (e = s.avail_out), e !== 0 && (s.output.set(t.pending_buf.subarray(t.pending_out, t.pending_out + e), s.next_out), s.next_out += e, t.pending_out += e, s.total_out += e, s.avail_out -= e, t.pending -= e, t.pending === 0 && (t.pending_out = 0));
}, dt = (s, t) => {
  bh(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, t), s.block_start = s.strstart, ct(s.strm);
}, U = (s, t) => {
  s.pending_buf[s.pending++] = t;
}, Me = (s, t) => {
  s.pending_buf[s.pending++] = t >>> 8 & 255, s.pending_buf[s.pending++] = 255 & t;
}, tr = (s, t, e, i) => {
  let r = s.avail_in;
  return r > i && (r = i), r === 0 ? 0 : (s.avail_in -= r, t.set(s.input.subarray(s.next_in, s.next_in + r), e), s.state.wrap === 1 ? s.adler = li(s.adler, t, r, e) : s.state.wrap === 2 && (s.adler = q(s.adler, t, r, e)), s.next_in += r, s.total_in += r, r);
}, bn = (s, t) => {
  let e, i, r = s.max_chain_length, o = s.strstart, a = s.prev_length, n = s.nice_match;
  const l = s.strstart > s.w_size - It ? s.strstart - (s.w_size - It) : 0, c = s.window, d = s.w_mask, h = s.prev, g = s.strstart + ie;
  let A = c[o + a - 1], _ = c[o + a];
  s.prev_length >= s.good_match && (r >>= 2), n > s.lookahead && (n = s.lookahead);
  do
    if (e = t, c[e + a] === _ && c[e + a - 1] === A && c[e] === c[o] && c[++e] === c[o + 1]) {
      o += 2, e++;
      do
        ;
      while (c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && o < g);
      if (i = ie - (g - o), o = g - ie, i > a) {
        if (s.match_start = t, a = i, i >= n) break;
        A = c[o + a - 1], _ = c[o + a];
      }
    }
  while ((t = h[t & d]) > l && --r != 0);
  return a <= s.lookahead ? a : s.lookahead;
}, Ce = (s) => {
  const t = s.w_size;
  let e, i, r;
  do {
    if (i = s.window_size - s.lookahead - s.strstart, s.strstart >= t + (t - It) && (s.window.set(s.window.subarray(t, t + t - i), 0), s.match_start -= t, s.strstart -= t, s.block_start -= t, s.insert > s.strstart && (s.insert = s.strstart), kh(s), i += t), s.strm.avail_in === 0) break;
    if (e = tr(s.strm, s.window, s.strstart + s.lookahead, i), s.lookahead += e, s.legacy_hash) {
      if (s.lookahead + s.insert >= 3) for (r = s.strstart - s.insert, s.ins_h = s.window[r], s.ins_h = Dr(s, s.ins_h, s.window[r + 1]); s.insert && (ne(s, r), r++, s.insert--, !(s.lookahead + s.insert < 3)); ) ;
    } else if (s.lookahead + s.insert > 3) for (r = s.strstart - s.insert; s.insert && (ne(s, r), r++, s.insert--, !(s.lookahead + s.insert <= 3)); ) ;
  } while (s.lookahead < It && s.strm.avail_in !== 0);
}, yn = (s, t) => {
  let e, i, r, o = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5, a = 0, n = s.strm.avail_in;
  do {
    if (e = 65535, r = s.bi_valid + 42 >> 3, s.strm.avail_out < r || (r = s.strm.avail_out - r, i = s.strstart - s.block_start, e > i + s.strm.avail_in && (e = i + s.strm.avail_in), e > r && (e = r), e < o && (e === 0 && t !== gt || t === Kt || e !== i + s.strm.avail_in))) break;
    a = t === gt && e === i + s.strm.avail_in ? 1 : 0, Xs(s, 0, 0, a), s.pending_buf[s.pending - 4] = e, s.pending_buf[s.pending - 3] = e >> 8, s.pending_buf[s.pending - 2] = ~e, s.pending_buf[s.pending - 1] = ~e >> 8, ct(s.strm), i && (i > e && (i = e), s.strm.output.set(s.window.subarray(s.block_start, s.block_start + i), s.strm.next_out), s.strm.next_out += i, s.strm.avail_out -= i, s.strm.total_out += i, s.block_start += i, e -= i), e && (tr(s.strm, s.strm.output, s.strm.next_out, e), s.strm.next_out += e, s.strm.avail_out -= e, s.strm.total_out += e);
  } while (a === 0);
  return n -= s.strm.avail_in, n && (n >= s.w_size ? (s.matches = 2, s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0), s.strstart = s.w_size, s.insert = s.strstart) : (s.window_size - s.strstart <= n && (s.strstart -= s.w_size, s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0), s.matches < 2 && s.matches++, s.insert > s.strstart && (s.insert = s.strstart)), s.window.set(s.strm.input.subarray(s.strm.next_in - n, s.strm.next_in), s.strstart), s.strstart += n, s.insert += n > s.w_size - s.insert ? s.w_size - s.insert : n), s.block_start = s.strstart), s.high_water < s.strstart && (s.high_water = s.strstart), a ? 4 : t !== Kt && t !== gt && s.strm.avail_in === 0 && s.strstart === s.block_start ? 2 : (r = s.window_size - s.strstart, s.strm.avail_in > r && s.block_start >= s.w_size && (s.block_start -= s.w_size, s.strstart -= s.w_size, s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0), s.matches < 2 && s.matches++, r += s.w_size, s.insert > s.strstart && (s.insert = s.strstart)), r > s.strm.avail_in && (r = s.strm.avail_in), r && (tr(s.strm, s.window, s.strstart, r), s.strstart += r, s.insert += r > s.w_size - s.insert ? s.w_size - s.insert : r), s.high_water < s.strstart && (s.high_water = s.strstart), r = s.bi_valid + 42 >> 3, r = s.pending_buf_size - r > 65535 ? 65535 : s.pending_buf_size - r, o = r > s.w_size ? s.w_size : r, i = s.strstart - s.block_start, (i >= o || (i || t === gt) && t !== Kt && s.strm.avail_in === 0 && i <= r) && (e = i > r ? r : i, a = t === gt && s.strm.avail_in === 0 && e === i ? 1 : 0, Xs(s, s.block_start, e, a), s.block_start += e, ct(s.strm)), a ? 3 : 1);
}, Ss = (s, t) => {
  let e, i;
  for (; ; ) {
    if (s.lookahead < It) {
      if (Ce(s), s.lookahead < It && t === Kt) return 1;
      if (s.lookahead === 0) break;
    }
    if (e = 0, s.lookahead >= 3 && (e = ne(s, s.strstart)), e !== 0 && s.strstart - e <= s.w_size - It && (s.match_length = bn(s, e)), s.match_length >= 3) if (i = Nt(s, s.strstart - s.match_start, s.match_length - 3), s.lookahead -= s.match_length, s.match_length <= s.max_lazy_match && s.lookahead >= 3) {
      s.match_length--;
      do
        s.strstart++, e = ne(s, s.strstart);
      while (--s.match_length != 0);
      s.strstart++;
    } else s.strstart += s.match_length, s.match_length = 0, s.legacy_hash && (s.ins_h = s.window[s.strstart], s.ins_h = Dr(s, s.ins_h, s.window[s.strstart + 1]));
    else i = Nt(s, 0, s.window[s.strstart]), s.lookahead--, s.strstart++;
    if (i && (dt(s, !1), s.strm.avail_out === 0)) return 1;
  }
  return s.insert = s.strstart < 2 ? s.strstart : 2, t === gt ? (dt(s, !0), s.strm.avail_out === 0 ? 3 : 4) : s.sym_next && (dt(s, !1), s.strm.avail_out === 0) ? 1 : 2;
}, ce = (s, t) => {
  let e, i, r;
  for (; ; ) {
    if (s.lookahead < It) {
      if (Ce(s), s.lookahead < It && t === Kt) return 1;
      if (s.lookahead === 0) break;
    }
    if (e = 0, s.lookahead >= 3 && (e = ne(s, s.strstart)), s.prev_length = s.match_length, s.prev_match = s.match_start, s.match_length = 2, e !== 0 && s.prev_length < s.max_lazy_match && s.strstart - e <= s.w_size - It && (s.match_length = bn(s, e), s.match_length <= 5 && (s.strategy === Sh || s.match_length === 3 && s.strstart - s.match_start > 4096) && (s.match_length = 2)), s.prev_length >= 3 && s.match_length <= s.prev_length) {
      r = s.strstart + s.lookahead - 3, i = Nt(s, s.strstart - 1 - s.prev_match, s.prev_length - 3), s.lookahead -= s.prev_length - 1, s.prev_length -= 2;
      do
        ++s.strstart <= r && (e = ne(s, s.strstart));
      while (--s.prev_length != 0);
      if (s.match_available = 0, s.match_length = 2, s.strstart++, i && (dt(s, !1), s.strm.avail_out === 0)) return 1;
    } else if (s.match_available) {
      if (i = Nt(s, 0, s.window[s.strstart - 1]), i && dt(s, !1), s.strstart++, s.lookahead--, s.strm.avail_out === 0) return 1;
    } else s.match_available = 1, s.strstart++, s.lookahead--;
  }
  return s.match_available && (i = Nt(s, 0, s.window[s.strstart - 1]), s.match_available = 0), s.insert = s.strstart < 2 ? s.strstart : 2, t === gt ? (dt(s, !0), s.strm.avail_out === 0 ? 3 : 4) : s.sym_next && (dt(s, !1), s.strm.avail_out === 0) ? 1 : 2;
};
function _t(s, t, e, i, r) {
  this.good_length = s, this.max_lazy = t, this.nice_length = e, this.max_chain = i, this.func = r;
}
const Ue = [new _t(0, 0, 0, 0, yn), new _t(4, 4, 8, 4, Ss), new _t(4, 5, 16, 8, Ss), new _t(4, 6, 32, 32, Ss), new _t(4, 4, 16, 16, ce), new _t(8, 16, 32, 32, ce), new _t(8, 16, 128, 128, ce), new _t(8, 32, 128, 256, ce), new _t(32, 128, 258, 1024, ce), new _t(32, 258, 258, 4096, ce)];
function Fh() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Ki, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.legacy_hash = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(1146), this.dyn_dtree = new Uint16Array(122), this.bl_tree = new Uint16Array(78), Lt(this.dyn_ltree), Lt(this.dyn_dtree), Lt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(16), this.heap = new Uint16Array(573), Lt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(573), Lt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const Je = (s) => {
  if (!s) return 1;
  const t = s.state;
  return !t || t.strm !== s || t.status !== ye && t.status !== 57 && t.status !== 69 && t.status !== 73 && t.status !== 91 && t.status !== 103 && t.status !== Zt && t.status !== Pe ? 1 : 0;
}, Cn = (s) => {
  if (Je(s)) return Xt(s, Ct);
  s.total_in = s.total_out = 0, s.data_type = Th;
  const t = s.state;
  return t.pending = 0, t.pending_out = 0, t.wrap < 0 && (t.wrap = -t.wrap), t.status = t.wrap === 2 ? 57 : t.wrap ? ye : Zt, s.adler = t.wrap === 2 ? 0 : 1, t.last_flush = -2, wh(t), Z;
}, Bn = (s) => {
  const t = Cn(s);
  var e;
  return t === Z && ((e = s.state).window_size = 2 * e.w_size, Lt(e.head), e.max_lazy_match = Ue[e.level].max_lazy, e.good_match = Ue[e.level].good_length, e.nice_match = Ue[e.level].nice_length, e.max_chain_length = Ue[e.level].max_chain, e.strstart = 0, e.block_start = 0, e.lookahead = 0, e.insert = 0, e.match_length = e.prev_length = 2, e.match_available = 0, e.ins_h = 0), t;
}, $o = (s, t, e, i, r, o, a) => {
  if (!s) return Ct;
  let n = 1;
  if (t === xh && (t = 6), i < 0 ? (n = 0, i = -i) : i > 15 && (n = 2, i -= 16), r < 1 || r > 9 || e !== Ki || i < 8 || i > 15 || t < 0 || t > 9 || o < 0 || o > Dh || i === 8 && n !== 1) return Xt(s, Ct);
  i === 8 && (i = 9);
  const l = new Fh();
  return s.state = l, l.strm = s, l.status = ye, l.wrap = n, l.gzhead = null, l.w_bits = i, l.w_size = 1 << l.w_bits, l.w_mask = l.w_size - 1, l.legacy_hash = a ? 1 : 0, l.hash_bits = r + 7, !l.legacy_hash && l.hash_bits < 15 && (l.hash_bits = 15), l.hash_size = 1 << l.hash_bits, l.hash_mask = l.hash_size - 1, l.hash_shift = ~~((l.hash_bits + 3 - 1) / 3), l.window = new Uint8Array(2 * l.w_size), l.head = new Uint16Array(l.hash_size), l.prev = new Uint16Array(l.w_size), l.lit_bufsize = 1 << r + 6, l.pending_buf_size = 4 * l.lit_bufsize, l.pending_buf = new Uint8Array(l.pending_buf_size), l.sym_buf = l.lit_bufsize, l.sym_end = 3 * (l.lit_bufsize - 1), l.level = t, l.strategy = o, l.method = e, Bn(s);
};
var Oh = (s, t) => {
  let e = t.length;
  if (Je(s)) return Ct;
  const i = s.state, r = i.wrap;
  if (r === 2 || r === 1 && i.status !== ye || i.lookahead) return Ct;
  if (r === 1 && (s.adler = li(s.adler, t, e, 0)), i.wrap = 0, e >= i.w_size) {
    r === 0 && (Lt(i.head), i.strstart = 0, i.block_start = 0, i.insert = 0);
    let l = new Uint8Array(i.w_size);
    l.set(t.subarray(e - i.w_size, e), 0), t = l, e = i.w_size;
  }
  const o = s.avail_in, a = s.next_in, n = s.input;
  for (s.avail_in = e, s.next_in = 0, s.input = t, Ce(i); i.lookahead >= 3; ) {
    let l = i.strstart, c = i.lookahead - 2;
    do
      ne(i, l), l++;
    while (--c);
    i.strstart = l, i.lookahead = 2, Ce(i);
  }
  return i.strstart += i.lookahead, i.block_start = i.strstart, i.insert = i.lookahead, i.lookahead = 0, i.match_length = i.prev_length = 2, i.match_available = 0, s.next_in = a, s.input = n, s.avail_in = o, i.wrap = r, Z;
}, je = { deflateInit: (s, t) => $o(s, t, Ki, 15, 8, Mh), deflateInit2: $o, deflateReset: Bn, deflateResetKeep: Cn, deflateSetHeader: (s, t) => Je(s) || s.state.wrap !== 2 ? Ct : (s.state.gzhead = t, Z), deflate: (s, t) => {
  if (Je(s) || t > Qo || t < 0) return s ? Xt(s, Ct) : Ct;
  const e = s.state;
  if (!s.output || s.avail_in !== 0 && !s.input || e.status === Pe && t !== gt) return Xt(s, s.avail_out === 0 ? xs : Ct);
  const i = e.last_flush;
  if (e.last_flush = t, e.pending !== 0) {
    if (ct(s), s.avail_out === 0) return e.last_flush = -1, Z;
  } else if (s.avail_in === 0 && Go(t) <= Go(i) && t !== gt) return Xt(s, xs);
  if (e.status === Pe && s.avail_in !== 0) return Xt(s, xs);
  if (e.status === ye && e.wrap === 0 && (e.status = Zt), e.status === ye) {
    let r = Ki + (e.w_bits - 8 << 4) << 8, o = -1;
    if (o = e.strategy >= vi || e.level < 2 ? 0 : e.level < 6 ? 1 : e.level === 6 ? 2 : 3, r |= o << 6, e.strstart !== 0 && (r |= 32), r += 31 - r % 31, Me(e, r), e.strstart !== 0 && (Me(e, s.adler >>> 16), Me(e, 65535 & s.adler)), s.adler = 1, e.status = Zt, ct(s), e.pending !== 0) return e.last_flush = -1, Z;
  }
  if (e.status === 57) {
    if (s.adler = 0, U(e, 31), U(e, 139), U(e, 8), e.gzhead) U(e, (e.gzhead.text ? 1 : 0) + (e.gzhead.hcrc ? 2 : 0) + (e.gzhead.extra ? 4 : 0) + (e.gzhead.name ? 8 : 0) + (e.gzhead.comment ? 16 : 0)), U(e, 255 & e.gzhead.time), U(e, e.gzhead.time >> 8 & 255), U(e, e.gzhead.time >> 16 & 255), U(e, e.gzhead.time >> 24 & 255), U(e, e.level === 9 ? 2 : e.strategy >= vi || e.level < 2 ? 4 : 0), U(e, 255 & e.gzhead.os), e.gzhead.extra && e.gzhead.extra.length && (U(e, 255 & e.gzhead.extra.length), U(e, e.gzhead.extra.length >> 8 & 255)), e.gzhead.hcrc && (s.adler = q(s.adler, e.pending_buf, e.pending, 0)), e.gzindex = 0, e.status = 69;
    else if (U(e, 0), U(e, 0), U(e, 0), U(e, 0), U(e, 0), U(e, e.level === 9 ? 2 : e.strategy >= vi || e.level < 2 ? 4 : 0), U(e, 3), e.status = Zt, ct(s), e.pending !== 0) return e.last_flush = -1, Z;
  }
  if (e.status === 69) {
    if (e.gzhead.extra) {
      let r = e.pending, o = (65535 & e.gzhead.extra.length) - e.gzindex;
      for (; e.pending + o > e.pending_buf_size; ) {
        let n = e.pending_buf_size - e.pending;
        if (e.pending_buf.set(e.gzhead.extra.subarray(e.gzindex, e.gzindex + n), e.pending), e.pending = e.pending_buf_size, e.gzhead.hcrc && e.pending > r && (s.adler = q(s.adler, e.pending_buf, e.pending - r, r)), e.gzindex += n, ct(s), e.pending !== 0) return e.last_flush = -1, Z;
        r = 0, o -= n;
      }
      let a = new Uint8Array(e.gzhead.extra);
      e.pending_buf.set(a.subarray(e.gzindex, e.gzindex + o), e.pending), e.pending += o, e.gzhead.hcrc && e.pending > r && (s.adler = q(s.adler, e.pending_buf, e.pending - r, r)), e.gzindex = 0;
    }
    e.status = 73;
  }
  if (e.status === 73) {
    if (e.gzhead.name) {
      let r, o = e.pending;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > o && (s.adler = q(s.adler, e.pending_buf, e.pending - o, o)), ct(s), e.pending !== 0) return e.last_flush = -1, Z;
          o = 0;
        }
        r = e.gzindex < e.gzhead.name.length ? 255 & e.gzhead.name.charCodeAt(e.gzindex++) : 0, U(e, r);
      } while (r !== 0);
      e.gzhead.hcrc && e.pending > o && (s.adler = q(s.adler, e.pending_buf, e.pending - o, o)), e.gzindex = 0;
    }
    e.status = 91;
  }
  if (e.status === 91) {
    if (e.gzhead.comment) {
      let r, o = e.pending;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > o && (s.adler = q(s.adler, e.pending_buf, e.pending - o, o)), ct(s), e.pending !== 0) return e.last_flush = -1, Z;
          o = 0;
        }
        r = e.gzindex < e.gzhead.comment.length ? 255 & e.gzhead.comment.charCodeAt(e.gzindex++) : 0, U(e, r);
      } while (r !== 0);
      e.gzhead.hcrc && e.pending > o && (s.adler = q(s.adler, e.pending_buf, e.pending - o, o));
    }
    e.status = 103;
  }
  if (e.status === 103) {
    if (e.gzhead.hcrc) {
      if (e.pending + 2 > e.pending_buf_size && (ct(s), e.pending !== 0)) return e.last_flush = -1, Z;
      U(e, 255 & s.adler), U(e, s.adler >> 8 & 255), s.adler = 0;
    }
    if (e.status = Zt, ct(s), e.pending !== 0) return e.last_flush = -1, Z;
  }
  if (s.avail_in !== 0 || e.lookahead !== 0 || t !== Kt && e.status !== Pe) {
    let r = e.level === 0 ? yn(e, t) : e.strategy === vi ? ((o, a) => {
      let n;
      for (; ; ) {
        if (o.lookahead === 0 && (Ce(o), o.lookahead === 0)) {
          if (a === Kt) return 1;
          break;
        }
        if (o.match_length = 0, n = Nt(o, 0, o.window[o.strstart]), o.lookahead--, o.strstart++, n && (dt(o, !1), o.strm.avail_out === 0)) return 1;
      }
      return o.insert = 0, a === gt ? (dt(o, !0), o.strm.avail_out === 0 ? 3 : 4) : o.sym_next && (dt(o, !1), o.strm.avail_out === 0) ? 1 : 2;
    })(e, t) : e.strategy === Rh ? ((o, a) => {
      let n, l, c, d;
      const h = o.window;
      for (; ; ) {
        if (o.lookahead <= ie) {
          if (Ce(o), o.lookahead <= ie && a === Kt) return 1;
          if (o.lookahead === 0) break;
        }
        if (o.match_length = 0, o.lookahead >= 3 && o.strstart > 0 && (c = o.strstart - 1, l = h[c], l === h[++c] && l === h[++c] && l === h[++c])) {
          d = o.strstart + ie;
          do
            ;
          while (l === h[++c] && l === h[++c] && l === h[++c] && l === h[++c] && l === h[++c] && l === h[++c] && l === h[++c] && l === h[++c] && c < d);
          o.match_length = ie - (d - c), o.match_length > o.lookahead && (o.match_length = o.lookahead);
        }
        if (o.match_length >= 3 ? (n = Nt(o, 1, o.match_length - 3), o.lookahead -= o.match_length, o.strstart += o.match_length, o.match_length = 0) : (n = Nt(o, 0, o.window[o.strstart]), o.lookahead--, o.strstart++), n && (dt(o, !1), o.strm.avail_out === 0)) return 1;
      }
      return o.insert = 0, a === gt ? (dt(o, !0), o.strm.avail_out === 0 ? 3 : 4) : o.sym_next && (dt(o, !1), o.strm.avail_out === 0) ? 1 : 2;
    })(e, t) : Ue[e.level].func(e, t);
    if (r !== 3 && r !== 4 || (e.status = Pe), r === 1 || r === 3) return s.avail_out === 0 && (e.last_flush = -1), Z;
    if (r === 2 && (t === Ch ? yh(e) : t !== Qo && (Xs(e, 0, 0, !1), t === Bh && (Lt(e.head), e.lookahead === 0 && (e.strstart = 0, e.block_start = 0, e.insert = 0))), ct(s), s.avail_out === 0)) return e.last_flush = -1, Z;
  }
  return t !== gt ? Z : e.wrap <= 0 ? Ho : (e.wrap === 2 ? (U(e, 255 & s.adler), U(e, s.adler >> 8 & 255), U(e, s.adler >> 16 & 255), U(e, s.adler >> 24 & 255), U(e, 255 & s.total_in), U(e, s.total_in >> 8 & 255), U(e, s.total_in >> 16 & 255), U(e, s.total_in >> 24 & 255)) : (Me(e, s.adler >>> 16), Me(e, 65535 & s.adler)), ct(s), e.wrap > 0 && (e.wrap = -e.wrap), e.pending !== 0 ? Z : Ho);
}, deflateEnd: (s) => {
  if (Je(s)) return Ct;
  const t = s.state.status;
  return s.state = null, t === Zt ? Xt(s, Ih) : Z;
}, deflateSetDictionary: Oh, deflateInfo: "pako deflate (from Nodeca project)" };
const Ph = (s, t) => Object.prototype.hasOwnProperty.call(s, t);
var ss = { assign: function(s) {
  const t = Array.prototype.slice.call(arguments, 1);
  for (; t.length; ) {
    const e = t.shift();
    if (e) {
      if (typeof e != "object") throw new TypeError(e + "must be non-object");
      for (const i in e) Ph(e, i) && (s[i] = e[i]);
    }
  }
  return s;
}, flattenChunks: (s) => {
  let t = 0;
  for (let i = 0, r = s.length; i < r; i++) t += s[i].length;
  const e = new Uint8Array(t);
  for (let i = 0, r = 0, o = s.length; i < o; i++) {
    let a = s[i];
    e.set(a, r), r += a.length;
  }
  return e;
} };
let In = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  In = !1;
}
const ci = new Uint8Array(256);
for (let s = 0; s < 256; s++) ci[s] = s >= 252 ? 6 : s >= 248 ? 5 : s >= 240 ? 4 : s >= 224 ? 3 : s >= 192 ? 2 : 1;
ci[254] = ci[255] = 1;
var di = { string2buf: (s) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode) return new TextEncoder().encode(s);
  let t, e, i, r, o, a = s.length, n = 0;
  for (r = 0; r < a; r++) e = s.charCodeAt(r), (64512 & e) == 55296 && r + 1 < a && (i = s.charCodeAt(r + 1), (64512 & i) == 56320 && (e = 65536 + (e - 55296 << 10) + (i - 56320), r++)), n += e < 128 ? 1 : e < 2048 ? 2 : e < 65536 ? 3 : 4;
  for (t = new Uint8Array(n), o = 0, r = 0; o < n; r++) e = s.charCodeAt(r), (64512 & e) == 55296 && r + 1 < a && (i = s.charCodeAt(r + 1), (64512 & i) == 56320 && (e = 65536 + (e - 55296 << 10) + (i - 56320), r++)), e < 128 ? t[o++] = e : e < 2048 ? (t[o++] = 192 | e >>> 6, t[o++] = 128 | 63 & e) : e < 65536 ? (t[o++] = 224 | e >>> 12, t[o++] = 128 | e >>> 6 & 63, t[o++] = 128 | 63 & e) : (t[o++] = 240 | e >>> 18, t[o++] = 128 | e >>> 12 & 63, t[o++] = 128 | e >>> 6 & 63, t[o++] = 128 | 63 & e);
  return t;
}, buf2string: (s, t) => {
  const e = t || s.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode) return new TextDecoder().decode(s.subarray(0, t));
  let i, r;
  const o = new Array(2 * e);
  for (r = 0, i = 0; i < e; ) {
    let a = s[i++];
    if (a < 128) {
      o[r++] = a;
      continue;
    }
    let n = ci[a];
    if (n > 4) o[r++] = 65533, i += n - 1;
    else {
      for (a &= n === 2 ? 31 : n === 3 ? 15 : 7; n > 1 && i < e; ) a = a << 6 | 63 & s[i++], n--;
      n > 1 ? o[r++] = 65533 : a < 65536 ? o[r++] = a : (a -= 65536, o[r++] = 55296 | a >> 10 & 1023, o[r++] = 56320 | 1023 & a);
    }
  }
  return ((a, n) => {
    if (n < 65534 && a.subarray && In) return String.fromCharCode.apply(null, a.length === n ? a : a.subarray(0, n));
    let l = "";
    for (let c = 0; c < n; c++) l += String.fromCharCode(a[c]);
    return l;
  })(o, r);
}, utf8border: (s, t) => {
  (t = t || s.length) > s.length && (t = s.length);
  let e = t - 1;
  for (; e >= 0 && (192 & s[e]) == 128; ) e--;
  return e < 0 || e === 0 ? t : e + ci[s[e]] > t ? e : t;
} }, xn = function() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
};
const Sn = Object.prototype.toString, { Z_NO_FLUSH: Uh, Z_SYNC_FLUSH: Qh, Z_FULL_FLUSH: Hh, Z_FINISH: Gh, Z_OK: zi, Z_STREAM_END: $h, Z_DEFAULT_COMPRESSION: Lh, Z_DEFAULT_STRATEGY: Yh, Z_DEFLATED: Nh } = is, Kh = { level: Lh, method: Nh, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: Yh, legacyHash: !0 };
function Oi(s) {
  this.options = ss.assign({}, Kh, s || {});
  let t = this.options;
  t.raw && t.windowBits > 0 ? t.windowBits = -t.windowBits : t.gzip && t.windowBits > 0 && t.windowBits < 16 && (t.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new xn(), this.strm.avail_out = 0;
  let e = je.deflateInit2(this.strm, t.level, t.method, t.windowBits, t.memLevel, t.strategy, t.legacyHash);
  if (e !== zi) throw new Error(be[e]);
  if (t.header && je.deflateSetHeader(this.strm, t.header), t.dictionary) {
    let i;
    if (i = typeof t.dictionary == "string" ? di.string2buf(t.dictionary) : Sn.call(t.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(t.dictionary) : t.dictionary, e = je.deflateSetDictionary(this.strm, i), e !== zi) throw new Error(be[e]);
    this._dict_set = !0;
  }
}
Oi.prototype.push = function(s, t) {
  const e = this.strm, i = this.options.chunkSize;
  let r, o;
  if (this.ended) return !1;
  for (o = t === ~~t ? t : t === !0 ? Gh : Uh, typeof s == "string" ? e.input = di.string2buf(s) : Sn.call(s) === "[object ArrayBuffer]" ? e.input = new Uint8Array(s) : e.input = s, e.next_in = 0, e.avail_in = e.input.length; ; ) if (e.avail_out === 0 && (e.output = new Uint8Array(i), e.next_out = 0, e.avail_out = i), (o === Qh || o === Hh) && e.avail_out <= 6) this.onData(e.output.subarray(0, e.next_out)), e.avail_out = 0;
  else {
    if (r = je.deflate(e, o), r === $h) return e.next_out > 0 && this.onData(e.output.subarray(0, e.next_out)), r = je.deflateEnd(this.strm), this.onEnd(r), this.ended = !0, r === zi;
    if (e.avail_out !== 0) {
      if (o > 0 && e.next_out > 0) this.onData(e.output.subarray(0, e.next_out)), e.avail_out = 0;
      else if (e.avail_in === 0) break;
    } else this.onData(e.output);
  }
  return !0;
}, Oi.prototype.onData = function(s) {
  this.chunks.push(s);
}, Oi.prototype.onEnd = function(s) {
  s === zi && (this.result = ss.flattenChunks(this.chunks)), this.chunks = [], this.err = s, this.msg = this.strm.msg;
};
var zh = { deflate: function(s, t) {
  const e = new Oi(t);
  if (e.push(s, !0), e.err) throw e.msg || be[e.err];
  return e.result;
} };
const _i = 16209;
var Jh = function(s, t) {
  let e, i, r, o, a, n, l, c, d, h, g, A, _, m, f, b, E, u, I, D, w, M, R, x;
  const S = s.state;
  e = s.next_in, R = s.input, i = e + (s.avail_in - 5), r = s.next_out, x = s.output, o = r - (t - s.avail_out), a = r + (s.avail_out - 257), n = S.dmax, l = S.wsize, c = S.whave, d = S.wnext, h = S.window, g = S.hold, A = S.bits, _ = S.lencode, m = S.distcode, f = (1 << S.lenbits) - 1, b = (1 << S.distbits) - 1;
  t: do {
    A < 15 && (g += R[e++] << A, A += 8, g += R[e++] << A, A += 8), E = _[g & f];
    e: for (; ; ) {
      if (u = E >>> 24, g >>>= u, A -= u, u = E >>> 16 & 255, u === 0) x[r++] = 65535 & E;
      else {
        if (!(16 & u)) {
          if ((64 & u) == 0) {
            E = _[(65535 & E) + (g & (1 << u) - 1)];
            continue e;
          }
          if (32 & u) {
            S.mode = 16191;
            break t;
          }
          s.msg = "invalid literal/length code", S.mode = _i;
          break t;
        }
        I = 65535 & E, u &= 15, u && (A < u && (g += R[e++] << A, A += 8), I += g & (1 << u) - 1, g >>>= u, A -= u), A < 15 && (g += R[e++] << A, A += 8, g += R[e++] << A, A += 8), E = m[g & b];
        i: for (; ; ) {
          if (u = E >>> 24, g >>>= u, A -= u, u = E >>> 16 & 255, !(16 & u)) {
            if ((64 & u) == 0) {
              E = m[(65535 & E) + (g & (1 << u) - 1)];
              continue i;
            }
            s.msg = "invalid distance code", S.mode = _i;
            break t;
          }
          if (D = 65535 & E, u &= 15, A < u && (g += R[e++] << A, A += 8, A < u && (g += R[e++] << A, A += 8)), D += g & (1 << u) - 1, D > n) {
            s.msg = "invalid distance too far back", S.mode = _i;
            break t;
          }
          if (g >>>= u, A -= u, u = r - o, D > u) {
            if (u = D - u, u > c && S.sane) {
              s.msg = "invalid distance too far back", S.mode = _i;
              break t;
            }
            if (w = 0, M = h, d === 0) {
              if (w += l - u, u < I) {
                I -= u;
                do
                  x[r++] = h[w++];
                while (--u);
                w = r - D, M = x;
              }
            } else if (d < u) {
              if (w += l + d - u, u -= d, u < I) {
                I -= u;
                do
                  x[r++] = h[w++];
                while (--u);
                if (w = 0, d < I) {
                  u = d, I -= u;
                  do
                    x[r++] = h[w++];
                  while (--u);
                  w = r - D, M = x;
                }
              }
            } else if (w += d - u, u < I) {
              I -= u;
              do
                x[r++] = h[w++];
              while (--u);
              w = r - D, M = x;
            }
            for (; I > 2; ) x[r++] = M[w++], x[r++] = M[w++], x[r++] = M[w++], I -= 3;
            I && (x[r++] = M[w++], I > 1 && (x[r++] = M[w++]));
          } else {
            w = r - D;
            do
              x[r++] = x[w++], x[r++] = x[w++], x[r++] = x[w++], I -= 3;
            while (I > 2);
            I && (x[r++] = x[w++], I > 1 && (x[r++] = x[w++]));
          }
          break;
        }
      }
      break;
    }
  } while (e < i && r < a);
  I = A >> 3, e -= I, A -= I << 3, g &= (1 << A) - 1, s.next_in = e, s.next_out = r, s.avail_in = e < i ? i - e + 5 : 5 - (e - i), s.avail_out = r < a ? a - r + 257 : 257 - (r - a), S.hold = g, S.bits = A;
};
const Ei = 15, jh = new Uint16Array([3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0]), Wh = new Uint8Array([16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 199, 75]), Vh = new Uint16Array([1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0]), qh = new Uint8Array([16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64]);
var We = (s, t, e, i, r, o, a, n) => {
  const l = n.bits;
  let c, d, h, g, A, _, m = 0, f = 0, b = 0, E = 0, u = 0, I = 0, D = 0, w = 0, M = 0, R = 0, x = null;
  const S = new Uint16Array(16), P = new Uint16Array(16);
  let nt, Pt, mt, Wt = null;
  for (m = 0; m <= Ei; m++) S[m] = 0;
  for (f = 0; f < i; f++) S[t[e + f]]++;
  for (u = l, E = Ei; E >= 1 && S[E] === 0; E--) ;
  if (u > E && (u = E), E === 0) return r[o++] = 20971520, r[o++] = 20971520, n.bits = 1, 0;
  for (b = 1; b < E && S[b] === 0; b++) ;
  for (u < b && (u = b), w = 1, m = 1; m <= Ei; m++) if (w <<= 1, w -= S[m], w < 0) return -1;
  if (w > 0 && (s === 0 || E !== 1)) return -1;
  for (P[1] = 0, m = 1; m < Ei; m++) P[m + 1] = P[m] + S[m];
  for (f = 0; f < i; f++) t[e + f] !== 0 && (a[P[t[e + f]]++] = f);
  if (s === 0 ? (x = Wt = a, _ = 20) : s === 1 ? (x = jh, Wt = Wh, _ = 257) : (x = Vh, Wt = qh, _ = 0), R = 0, f = 0, m = b, A = o, I = u, D = 0, h = -1, M = 1 << u, g = M - 1, s === 1 && M > 852 || s === 2 && M > 592) return 1;
  for (; ; ) {
    nt = m - D, a[f] + 1 < _ ? (Pt = 0, mt = a[f]) : a[f] >= _ ? (Pt = Wt[a[f] - _], mt = x[a[f] - _]) : (Pt = 96, mt = 0), c = 1 << m - D, d = 1 << I, b = d;
    do
      d -= c, r[A + (R >> D) + d] = nt << 24 | Pt << 16 | mt | 0;
    while (d !== 0);
    for (c = 1 << m - 1; R & c; ) c >>= 1;
    if (c !== 0 ? (R &= c - 1, R += c) : R = 0, f++, --S[m] == 0) {
      if (m === E) break;
      m = t[e + a[f]];
    }
    if (m > u && (R & g) !== h) {
      for (D === 0 && (D = u), A += b, I = m - D, w = 1 << I; I + D < E && (w -= S[I + D], !(w <= 0)); ) I++, w <<= 1;
      if (M += 1 << I, s === 1 && M > 852 || s === 2 && M > 592) return 1;
      h = R & g, r[h] = u << 24 | I << 16 | A - o | 0;
    }
  }
  return R !== 0 && (r[A + R] = m - D << 24 | 64 << 16 | 0), n.bits = u, 0;
};
const { Z_FINISH: Lo, Z_BLOCK: Zh, Z_TREES: wi, Z_OK: se, Z_STREAM_END: Xh, Z_NEED_DICT: tA, Z_STREAM_ERROR: ut, Z_DATA_ERROR: Rn, Z_MEM_ERROR: Dn, Z_BUF_ERROR: eA, Z_DEFLATED: Yo } = is, rs = 16180, Ji = 16190, Rt = 16191, Rs = 16192, Ds = 16194, bi = 16199, yi = 16200, Ms = 16206, z = 16209, No = (s) => (s >>> 24 & 255) + (s >>> 8 & 65280) + ((65280 & s) << 8) + ((255 & s) << 24);
function iA() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const re = (s) => {
  if (!s) return 1;
  const t = s.state;
  return !t || t.strm !== s || t.mode < rs || t.mode > 16211 ? 1 : 0;
}, Mn = (s) => {
  if (re(s)) return ut;
  const t = s.state;
  return s.total_in = s.total_out = t.total = 0, s.msg = "", t.wrap && (s.adler = 1 & t.wrap), t.mode = rs, t.last = 0, t.havedict = 0, t.flags = -1, t.dmax = 32768, t.head = null, t.hold = 0, t.bits = 0, t.lencode = t.lendyn = new Int32Array(852), t.distcode = t.distdyn = new Int32Array(592), t.sane = 1, t.back = -1, se;
}, Tn = (s) => {
  if (re(s)) return ut;
  const t = s.state;
  return t.wsize = 0, t.whave = 0, t.wnext = 0, Mn(s);
}, kn = (s, t) => {
  let e;
  if (re(s)) return ut;
  const i = s.state;
  return t < 0 ? (e = 0, t = -t) : (e = 5 + (t >> 4), t < 48 && (t &= 15)), t && (t < 8 || t > 15) ? ut : (i.window !== null && i.wbits !== t && (i.window = null), i.wrap = e, i.wbits = t, Tn(s));
}, Ko = (s, t) => {
  if (!s) return ut;
  const e = new iA();
  s.state = e, e.strm = s, e.window = null, e.mode = rs;
  const i = kn(s, t);
  return i !== se && (s.state = null), i;
};
let Ts, ks, zo = !0;
const sA = (s) => {
  if (zo) {
    Ts = new Int32Array(512), ks = new Int32Array(32);
    let t = 0;
    for (; t < 144; ) s.lens[t++] = 8;
    for (; t < 256; ) s.lens[t++] = 9;
    for (; t < 280; ) s.lens[t++] = 7;
    for (; t < 288; ) s.lens[t++] = 8;
    for (We(1, s.lens, 0, 288, Ts, 0, s.work, { bits: 9 }), t = 0; t < 32; ) s.lens[t++] = 5;
    We(2, s.lens, 0, 32, ks, 0, s.work, { bits: 5 }), zo = !1;
  }
  s.lencode = Ts, s.lenbits = 9, s.distcode = ks, s.distbits = 5;
}, Fn = (s, t, e, i) => {
  let r;
  const o = s.state;
  return o.window === null && (o.window = new Uint8Array(1 << o.wbits)), o.wsize === 0 && (o.wsize = 1 << o.wbits, o.wnext = 0, o.whave = 0), i >= o.wsize ? (o.window.set(t.subarray(e - o.wsize, e), 0), o.wnext = 0, o.whave = o.wsize) : (r = o.wsize - o.wnext, r > i && (r = i), o.window.set(t.subarray(e - i, e - i + r), o.wnext), (i -= r) ? (o.window.set(t.subarray(e - i, e), 0), o.wnext = i, o.whave = o.wsize) : (o.wnext += r, o.wnext === o.wsize && (o.wnext = 0), o.whave < o.wsize && (o.whave += r))), 0;
};
var rA = (s, t) => {
  let e, i, r, o, a, n, l, c, d, h, g, A, _, m, f, b, E, u, I, D, w, M, R = 0;
  const x = new Uint8Array(4);
  let S, P;
  const nt = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  if (re(s) || !s.output || !s.input && s.avail_in !== 0) return ut;
  e = s.state, e.mode === Rt && (e.mode = Rs), a = s.next_out, r = s.output, l = s.avail_out, o = s.next_in, i = s.input, n = s.avail_in, c = e.hold, d = e.bits, h = n, g = l, M = se;
  t: for (; ; ) switch (e.mode) {
    case rs:
      if (e.wrap === 0) {
        e.mode = Rs;
        break;
      }
      for (; d < 16; ) {
        if (n === 0) break t;
        n--, c += i[o++] << d, d += 8;
      }
      if (2 & e.wrap && c === 35615) {
        e.wbits === 0 && (e.wbits = 15), e.check = 0, x[0] = 255 & c, x[1] = c >>> 8 & 255, e.check = q(e.check, x, 2, 0), c = 0, d = 0, e.mode = 16181;
        break;
      }
      if (e.head && (e.head.done = !1), !(1 & e.wrap) || (((255 & c) << 8) + (c >> 8)) % 31) {
        s.msg = "incorrect header check", e.mode = z;
        break;
      }
      if ((15 & c) !== Yo) {
        s.msg = "unknown compression method", e.mode = z;
        break;
      }
      if (c >>>= 4, d -= 4, w = 8 + (15 & c), e.wbits === 0 && (e.wbits = w), w > 15 || w > e.wbits) {
        s.msg = "invalid window size", e.mode = z;
        break;
      }
      e.dmax = 1 << e.wbits, e.flags = 0, s.adler = e.check = 1, e.mode = 512 & c ? 16189 : Rt, c = 0, d = 0;
      break;
    case 16181:
      for (; d < 16; ) {
        if (n === 0) break t;
        n--, c += i[o++] << d, d += 8;
      }
      if (e.flags = c, (255 & e.flags) !== Yo) {
        s.msg = "unknown compression method", e.mode = z;
        break;
      }
      if (57344 & e.flags) {
        s.msg = "unknown header flags set", e.mode = z;
        break;
      }
      e.head && (e.head.text = c >> 8 & 1), 512 & e.flags && 4 & e.wrap && (x[0] = 255 & c, x[1] = c >>> 8 & 255, e.check = q(e.check, x, 2, 0)), c = 0, d = 0, e.mode = 16182;
    case 16182:
      for (; d < 32; ) {
        if (n === 0) break t;
        n--, c += i[o++] << d, d += 8;
      }
      e.head && (e.head.time = c), 512 & e.flags && 4 & e.wrap && (x[0] = 255 & c, x[1] = c >>> 8 & 255, x[2] = c >>> 16 & 255, x[3] = c >>> 24 & 255, e.check = q(e.check, x, 4, 0)), c = 0, d = 0, e.mode = 16183;
    case 16183:
      for (; d < 16; ) {
        if (n === 0) break t;
        n--, c += i[o++] << d, d += 8;
      }
      e.head && (e.head.xflags = 255 & c, e.head.os = c >> 8), 512 & e.flags && 4 & e.wrap && (x[0] = 255 & c, x[1] = c >>> 8 & 255, e.check = q(e.check, x, 2, 0)), c = 0, d = 0, e.mode = 16184;
    case 16184:
      if (1024 & e.flags) {
        for (; d < 16; ) {
          if (n === 0) break t;
          n--, c += i[o++] << d, d += 8;
        }
        e.length = c, e.head && (e.head.extra_len = c), 512 & e.flags && 4 & e.wrap && (x[0] = 255 & c, x[1] = c >>> 8 & 255, e.check = q(e.check, x, 2, 0)), c = 0, d = 0;
      } else e.head && (e.head.extra = null);
      e.mode = 16185;
    case 16185:
      if (1024 & e.flags && (A = e.length, A > n && (A = n), A && (e.head && (w = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Uint8Array(e.head.extra_len)), e.head.extra.set(i.subarray(o, o + A), w)), 512 & e.flags && 4 & e.wrap && (e.check = q(e.check, i, A, o)), n -= A, o += A, e.length -= A), e.length)) break t;
      e.length = 0, e.mode = 16186;
    case 16186:
      if (2048 & e.flags) {
        if (n === 0) break t;
        A = 0;
        do
          w = i[o + A++], e.head && w && e.length < 65536 && (e.head.name += String.fromCharCode(w));
        while (w && A < n);
        if (512 & e.flags && 4 & e.wrap && (e.check = q(e.check, i, A, o)), n -= A, o += A, w) break t;
      } else e.head && (e.head.name = null);
      e.length = 0, e.mode = 16187;
    case 16187:
      if (4096 & e.flags) {
        if (n === 0) break t;
        A = 0;
        do
          w = i[o + A++], e.head && w && e.length < 65536 && (e.head.comment += String.fromCharCode(w));
        while (w && A < n);
        if (512 & e.flags && 4 & e.wrap && (e.check = q(e.check, i, A, o)), n -= A, o += A, w) break t;
      } else e.head && (e.head.comment = null);
      e.mode = 16188;
    case 16188:
      if (512 & e.flags) {
        for (; d < 16; ) {
          if (n === 0) break t;
          n--, c += i[o++] << d, d += 8;
        }
        if (4 & e.wrap && c !== (65535 & e.check)) {
          s.msg = "header crc mismatch", e.mode = z;
          break;
        }
        c = 0, d = 0;
      }
      e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), s.adler = e.check = 0, e.mode = Rt;
      break;
    case 16189:
      for (; d < 32; ) {
        if (n === 0) break t;
        n--, c += i[o++] << d, d += 8;
      }
      s.adler = e.check = No(c), c = 0, d = 0, e.mode = Ji;
    case Ji:
      if (e.havedict === 0) return s.next_out = a, s.avail_out = l, s.next_in = o, s.avail_in = n, e.hold = c, e.bits = d, tA;
      s.adler = e.check = 1, e.mode = Rt;
    case Rt:
      if (t === Zh || t === wi) break t;
    case Rs:
      if (e.last) {
        c >>>= 7 & d, d -= 7 & d, e.mode = Ms;
        break;
      }
      for (; d < 3; ) {
        if (n === 0) break t;
        n--, c += i[o++] << d, d += 8;
      }
      switch (e.last = 1 & c, c >>>= 1, d -= 1, 3 & c) {
        case 0:
          e.mode = 16193;
          break;
        case 1:
          if (sA(e), e.mode = bi, t === wi) {
            c >>>= 2, d -= 2;
            break t;
          }
          break;
        case 2:
          e.mode = 16196;
          break;
        case 3:
          s.msg = "invalid block type", e.mode = z;
      }
      c >>>= 2, d -= 2;
      break;
    case 16193:
      for (c >>>= 7 & d, d -= 7 & d; d < 32; ) {
        if (n === 0) break t;
        n--, c += i[o++] << d, d += 8;
      }
      if ((65535 & c) != (c >>> 16 ^ 65535)) {
        s.msg = "invalid stored block lengths", e.mode = z;
        break;
      }
      if (e.length = 65535 & c, c = 0, d = 0, e.mode = Ds, t === wi) break t;
    case Ds:
      e.mode = 16195;
    case 16195:
      if (A = e.length, A) {
        if (A > n && (A = n), A > l && (A = l), A === 0) break t;
        r.set(i.subarray(o, o + A), a), n -= A, o += A, l -= A, a += A, e.length -= A;
        break;
      }
      e.mode = Rt;
      break;
    case 16196:
      for (; d < 14; ) {
        if (n === 0) break t;
        n--, c += i[o++] << d, d += 8;
      }
      if (e.nlen = 257 + (31 & c), c >>>= 5, d -= 5, e.ndist = 1 + (31 & c), c >>>= 5, d -= 5, e.ncode = 4 + (15 & c), c >>>= 4, d -= 4, e.nlen > 286 || e.ndist > 30) {
        s.msg = "too many length or distance symbols", e.mode = z;
        break;
      }
      e.have = 0, e.mode = 16197;
    case 16197:
      for (; e.have < e.ncode; ) {
        for (; d < 3; ) {
          if (n === 0) break t;
          n--, c += i[o++] << d, d += 8;
        }
        e.lens[nt[e.have++]] = 7 & c, c >>>= 3, d -= 3;
      }
      for (; e.have < 19; ) e.lens[nt[e.have++]] = 0;
      if (e.lencode = e.lendyn, e.lenbits = 7, S = { bits: e.lenbits }, M = We(0, e.lens, 0, 19, e.lencode, 0, e.work, S), e.lenbits = S.bits, M) {
        s.msg = "invalid code lengths set", e.mode = z;
        break;
      }
      e.have = 0, e.mode = 16198;
    case 16198:
      for (; e.have < e.nlen + e.ndist; ) {
        for (; R = e.lencode[c & (1 << e.lenbits) - 1], f = R >>> 24, b = R >>> 16 & 255, E = 65535 & R, !(f <= d); ) {
          if (n === 0) break t;
          n--, c += i[o++] << d, d += 8;
        }
        if (E < 16) c >>>= f, d -= f, e.lens[e.have++] = E;
        else {
          if (E === 16) {
            for (P = f + 2; d < P; ) {
              if (n === 0) break t;
              n--, c += i[o++] << d, d += 8;
            }
            if (c >>>= f, d -= f, e.have === 0) {
              s.msg = "invalid bit length repeat", e.mode = z;
              break;
            }
            w = e.lens[e.have - 1], A = 3 + (3 & c), c >>>= 2, d -= 2;
          } else if (E === 17) {
            for (P = f + 3; d < P; ) {
              if (n === 0) break t;
              n--, c += i[o++] << d, d += 8;
            }
            c >>>= f, d -= f, w = 0, A = 3 + (7 & c), c >>>= 3, d -= 3;
          } else {
            for (P = f + 7; d < P; ) {
              if (n === 0) break t;
              n--, c += i[o++] << d, d += 8;
            }
            c >>>= f, d -= f, w = 0, A = 11 + (127 & c), c >>>= 7, d -= 7;
          }
          if (e.have + A > e.nlen + e.ndist) {
            s.msg = "invalid bit length repeat", e.mode = z;
            break;
          }
          for (; A--; ) e.lens[e.have++] = w;
        }
      }
      if (e.mode === z) break;
      if (e.lens[256] === 0) {
        s.msg = "invalid code -- missing end-of-block", e.mode = z;
        break;
      }
      if (e.lenbits = 9, S = { bits: e.lenbits }, M = We(1, e.lens, 0, e.nlen, e.lencode, 0, e.work, S), e.lenbits = S.bits, M) {
        s.msg = "invalid literal/lengths set", e.mode = z;
        break;
      }
      if (e.distbits = 6, e.distcode = e.distdyn, S = { bits: e.distbits }, M = We(2, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, S), e.distbits = S.bits, M) {
        s.msg = "invalid distances set", e.mode = z;
        break;
      }
      if (e.mode = bi, t === wi) break t;
    case bi:
      e.mode = yi;
    case yi:
      if (n >= 6 && l >= 258) {
        s.next_out = a, s.avail_out = l, s.next_in = o, s.avail_in = n, e.hold = c, e.bits = d, Jh(s, g), a = s.next_out, r = s.output, l = s.avail_out, o = s.next_in, i = s.input, n = s.avail_in, c = e.hold, d = e.bits, e.mode === Rt && (e.back = -1);
        break;
      }
      for (e.back = 0; R = e.lencode[c & (1 << e.lenbits) - 1], f = R >>> 24, b = R >>> 16 & 255, E = 65535 & R, !(f <= d); ) {
        if (n === 0) break t;
        n--, c += i[o++] << d, d += 8;
      }
      if (b && (240 & b) == 0) {
        for (u = f, I = b, D = E; R = e.lencode[D + ((c & (1 << u + I) - 1) >> u)], f = R >>> 24, b = R >>> 16 & 255, E = 65535 & R, !(u + f <= d); ) {
          if (n === 0) break t;
          n--, c += i[o++] << d, d += 8;
        }
        c >>>= u, d -= u, e.back += u;
      }
      if (c >>>= f, d -= f, e.back += f, e.length = E, b === 0) {
        e.mode = 16205;
        break;
      }
      if (32 & b) {
        e.back = -1, e.mode = Rt;
        break;
      }
      if (64 & b) {
        s.msg = "invalid literal/length code", e.mode = z;
        break;
      }
      e.extra = 15 & b, e.mode = 16201;
    case 16201:
      if (e.extra) {
        for (P = e.extra; d < P; ) {
          if (n === 0) break t;
          n--, c += i[o++] << d, d += 8;
        }
        e.length += c & (1 << e.extra) - 1, c >>>= e.extra, d -= e.extra, e.back += e.extra;
      }
      e.was = e.length, e.mode = 16202;
    case 16202:
      for (; R = e.distcode[c & (1 << e.distbits) - 1], f = R >>> 24, b = R >>> 16 & 255, E = 65535 & R, !(f <= d); ) {
        if (n === 0) break t;
        n--, c += i[o++] << d, d += 8;
      }
      if ((240 & b) == 0) {
        for (u = f, I = b, D = E; R = e.distcode[D + ((c & (1 << u + I) - 1) >> u)], f = R >>> 24, b = R >>> 16 & 255, E = 65535 & R, !(u + f <= d); ) {
          if (n === 0) break t;
          n--, c += i[o++] << d, d += 8;
        }
        c >>>= u, d -= u, e.back += u;
      }
      if (c >>>= f, d -= f, e.back += f, 64 & b) {
        s.msg = "invalid distance code", e.mode = z;
        break;
      }
      e.offset = E, e.extra = 15 & b, e.mode = 16203;
    case 16203:
      if (e.extra) {
        for (P = e.extra; d < P; ) {
          if (n === 0) break t;
          n--, c += i[o++] << d, d += 8;
        }
        e.offset += c & (1 << e.extra) - 1, c >>>= e.extra, d -= e.extra, e.back += e.extra;
      }
      if (e.offset > e.dmax) {
        s.msg = "invalid distance too far back", e.mode = z;
        break;
      }
      e.mode = 16204;
    case 16204:
      if (l === 0) break t;
      if (A = g - l, e.offset > A) {
        if (A = e.offset - A, A > e.whave && e.sane) {
          s.msg = "invalid distance too far back", e.mode = z;
          break;
        }
        A > e.wnext ? (A -= e.wnext, _ = e.wsize - A) : _ = e.wnext - A, A > e.length && (A = e.length), m = e.window;
      } else m = r, _ = a - e.offset, A = e.length;
      A > l && (A = l), l -= A, e.length -= A;
      do
        r[a++] = m[_++];
      while (--A);
      e.length === 0 && (e.mode = yi);
      break;
    case 16205:
      if (l === 0) break t;
      r[a++] = e.length, l--, e.mode = yi;
      break;
    case Ms:
      if (e.wrap) {
        for (; d < 32; ) {
          if (n === 0) break t;
          n--, c |= i[o++] << d, d += 8;
        }
        if (g -= l, s.total_out += g, e.total += g, 4 & e.wrap && g && (s.adler = e.check = e.flags ? q(e.check, r, g, a - g) : li(e.check, r, g, a - g)), g = l, 4 & e.wrap && (e.flags ? c : No(c)) !== e.check) {
          s.msg = "incorrect data check", e.mode = z;
          break;
        }
        c = 0, d = 0;
      }
      e.mode = 16207;
    case 16207:
      if (e.wrap && e.flags) {
        for (; d < 32; ) {
          if (n === 0) break t;
          n--, c += i[o++] << d, d += 8;
        }
        if (4 & e.wrap && c !== (4294967295 & e.total)) {
          s.msg = "incorrect length check", e.mode = z;
          break;
        }
        c = 0, d = 0;
      }
      e.mode = 16208;
    case 16208:
      M = Xh;
      break t;
    case z:
      M = Rn;
      break t;
    case 16210:
      return Dn;
    default:
      return ut;
  }
  return s.next_out = a, s.avail_out = l, s.next_in = o, s.avail_in = n, e.hold = c, e.bits = d, (e.wsize || g !== s.avail_out && e.mode < z && (e.mode < Ms || t !== Lo)) && Fn(s, s.output, s.next_out, g - s.avail_out), h -= s.avail_in, g -= s.avail_out, s.total_in += h, s.total_out += g, e.total += g, 4 & e.wrap && g && (s.adler = e.check = e.flags ? q(e.check, r, g, s.next_out - g) : li(e.check, r, g, s.next_out - g)), s.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === Rt ? 128 : 0) + (e.mode === bi || e.mode === Ds ? 256 : 0), (h === 0 && g === 0 || t === Lo) && M === se && (M = eA), M;
}, bt = { inflateReset: Tn, inflateReset2: kn, inflateResetKeep: Mn, inflateInit: (s) => Ko(s, 15), inflateInit2: Ko, inflate: rA, inflateEnd: (s) => {
  if (re(s)) return ut;
  let t = s.state;
  return t.window && (t.window = null), s.state = null, se;
}, inflateGetHeader: (s, t) => {
  if (re(s)) return ut;
  const e = s.state;
  return (2 & e.wrap) == 0 ? ut : (e.head = t, t.done = !1, se);
}, inflateSetDictionary: (s, t) => {
  const e = t.length;
  let i, r, o;
  return re(s) ? ut : (i = s.state, i.wrap !== 0 && i.mode !== Ji ? ut : i.mode === Ji && (r = 1, r = li(r, t, e, 0), r !== i.check) ? Rn : (o = Fn(s, t, e, e), o ? (i.mode = 16210, Dn) : (i.havedict = 1, se)));
}, inflateInfo: "pako inflate (from Nodeca project)" }, oA = function() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
};
const On = Object.prototype.toString, { Z_NO_FLUSH: aA, Z_FINISH: Jo, Z_OK: ge, Z_STREAM_END: Fs, Z_NEED_DICT: Os, Z_STREAM_ERROR: nA, Z_DATA_ERROR: jo, Z_MEM_ERROR: lA, Z_BUF_ERROR: Wo } = is, cA = { chunkSize: 65536, windowBits: 15, to: "" };
function Pi(s) {
  this.options = ss.assign({}, cA, s || {});
  const t = this.options;
  t.raw && t.windowBits >= 0 && t.windowBits < 16 && (t.windowBits = -t.windowBits, t.windowBits === 0 && (t.windowBits = -15)), !(t.windowBits >= 0 && t.windowBits < 16) || s && s.windowBits || (t.windowBits += 32), t.windowBits > 15 && t.windowBits < 48 && (15 & t.windowBits) == 0 && (t.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new xn(), this.strm.avail_out = 0;
  let e = bt.inflateInit2(this.strm, t.windowBits);
  if (e !== ge) throw new Error(be[e]);
  if (this.header = new oA(), bt.inflateGetHeader(this.strm, this.header), t.dictionary && (typeof t.dictionary == "string" ? t.dictionary = di.string2buf(t.dictionary) : On.call(t.dictionary) === "[object ArrayBuffer]" && (t.dictionary = new Uint8Array(t.dictionary)), t.raw && (e = bt.inflateSetDictionary(this.strm, t.dictionary), e !== ge))) throw new Error(be[e]);
}
Pi.prototype.push = function(s, t) {
  const e = this.strm, i = this.options.chunkSize, r = this.options.dictionary;
  let o, a, n;
  if (this.ended) return !1;
  for (a = t === ~~t ? t : t === !0 ? Jo : aA, On.call(s) === "[object ArrayBuffer]" ? e.input = new Uint8Array(s) : e.input = s, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    for (e.avail_out === 0 && (e.output = new Uint8Array(i), e.next_out = 0, e.avail_out = i), o = bt.inflate(e, a), o === Os && r && (o = bt.inflateSetDictionary(e, r), o === ge ? o = bt.inflate(e, a) : o === jo && (o = Os)); e.avail_in > 0 && o === Fs && 2 & e.state.wrap && e.state.flags !== 0 && e.input[e.next_in] !== 0; ) bt.inflateReset(e), o = bt.inflate(e, a);
    switch (o) {
      case nA:
      case jo:
      case Os:
      case lA:
        return this.onEnd(o), this.ended = !0, !1;
    }
    if (n = e.avail_out, e.next_out && (e.avail_out === 0 || o === Fs || a > 0)) if (this.options.to === "string") {
      let l = di.utf8border(e.output, e.next_out), c = e.next_out - l, d = di.buf2string(e.output, l);
      e.next_out = c, e.avail_out = i - c, c && e.output.set(e.output.subarray(l, l + c), 0), this.onData(d);
    } else this.onData(e.output.length === e.next_out ? e.output : e.output.subarray(0, e.next_out)), e.avail_out = 0, e.next_out = 0;
    if (o !== ge && o !== Wo || n !== 0) {
      if (o === Fs) return o = bt.inflateEnd(this.strm), this.onEnd(o), this.ended = !0, !0;
      if (e.avail_in === 0) {
        if (a === Jo) return o = bt.inflateEnd(this.strm), this.onEnd(o === ge ? Wo : o), this.ended = !0, !1;
        break;
      }
    }
  }
  return !0;
}, Pi.prototype.onData = function(s) {
  this.chunks.push(s);
}, Pi.prototype.onEnd = function(s) {
  s === ge && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = ss.flattenChunks(this.chunks)), this.chunks = [], this.err = s, this.msg = this.strm.msg;
};
var dA = { Inflate: Pi };
const { deflate: hA } = zh, { Inflate: AA } = dA;
var pA = hA, gA = AA;
function er(s, t, e = 255) {
  const i = s.length % t;
  if (i !== 0) {
    const r = new Uint8Array(t - i).fill(e), o = new Uint8Array(s.length + r.length);
    return o.set(s), o.set(r, s.length), o;
  }
  return s;
}
function Vo(s, t = 239) {
  for (let e = 0; e < s.length; e++) t ^= s[e];
  return t;
}
function os(s) {
  const t = new Uint8Array(s.length);
  for (let e = 0; e < s.length; e++) t[e] = s.charCodeAt(e);
  return t;
}
function Ve(s) {
  return new Promise(((t) => setTimeout(t, s)));
}
class Mr {
  constructor(t, e = !1, i = !0) {
    this.device = t, this.tracing = e, this.slipReaderEnabled = !1, this.baudrate = 0, this.traceLog = "", this.lastTraceTime = Date.now(), this.buffer = new Uint8Array(0), this.onDeviceLostCallback = null, this.SLIP_END = 192, this.SLIP_ESC = 219, this.SLIP_ESC_END = 220, this.SLIP_ESC_ESC = 221, this._DTR_state = !1, this.slipReaderEnabled = i;
  }
  setDeviceLostCallback(t) {
    this.onDeviceLostCallback = t;
  }
  updateDevice(t) {
    this.device = t, this.trace("Device reference updated");
  }
  getInfo() {
    const t = this.device.getInfo();
    return t.usbVendorId && t.usbProductId ? `WebSerial VendorID 0x${t.usbVendorId.toString(16)} ProductID 0x${t.usbProductId.toString(16)}` : "";
  }
  getPid() {
    return this.device.getInfo().usbProductId;
  }
  trace(t) {
    const e = `${`TRACE ${(Date.now() - this.lastTraceTime).toFixed(3)}`} ${t}`;
    console.log(e), this.traceLog += e + `
`;
  }
  async returnTrace() {
    try {
      await navigator.clipboard.writeText(this.traceLog), console.log("Text copied to clipboard!");
    } catch (t) {
      console.error("Failed to copy text:", t);
    }
  }
  hexify(t) {
    return Array.from(t).map(((e) => e.toString(16).padStart(2, "0"))).join("").padEnd(16, " ");
  }
  hexConvert(t, e = !0) {
    if (e && t.length > 16) {
      let i = "", r = t;
      for (; r.length > 0; ) {
        const o = r.slice(0, 16), a = String.fromCharCode(...o).split("").map(((n) => n === " " || n >= " " && n <= "~" && n !== "  " ? n : ".")).join("");
        r = r.slice(16), i += `
    ${this.hexify(o.slice(0, 8))} ${this.hexify(o.slice(8))} | ${a}`;
      }
      return i;
    }
    return this.hexify(t);
  }
  slipWriter(t) {
    const e = [];
    e.push(192);
    for (let i = 0; i < t.length; i++) t[i] === 219 ? e.push(219, 221) : t[i] === 192 ? e.push(219, 220) : e.push(t[i]);
    return e.push(192), new Uint8Array(e);
  }
  async write(t) {
    const e = this.slipWriter(t);
    if (this.device.writable) {
      const i = this.device.writable.getWriter();
      this.tracing && this.trace(`Write ${e.length} bytes: ${this.hexConvert(e)}`), await i.write(e), i.releaseLock();
    }
  }
  appendArray(t, e) {
    const i = new Uint8Array(t.length + e.length);
    return i.set(t), i.set(e, t.length), i;
  }
  async readLoop() {
    for (var t; this.device.readable; ) {
      this.reader = (t = this.device.readable) === null || t === void 0 ? void 0 : t.getReader();
      try {
        const { value: e, done: i } = await this.reader.read();
        if (i) {
          this.trace("Serial port done");
          break;
        }
        if (e && e.length) {
          const r = Uint8Array.from(e);
          this.buffer = this.appendArray(this.buffer, r);
        }
      } catch (e) {
        if (e instanceof Error) {
          if (["BufferOverrunError", "FramingError", "BreakError", "ParityError"].includes(e.name)) {
            this.trace(`Recoverable serial port error: ${e.message}`);
            continue;
          }
          this.trace(`Unrecoverable serial port error: ${e.message}`);
          break;
        }
        if (e instanceof DOMException) {
          this.onDeviceLostCallback ? this.onDeviceLostCallback() : this.trace(`Unrecoverable serial port error: ${e.message}`);
          break;
        }
        this.trace(`Unrecoverable serial port error: ${e}`);
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
        const t = this.device.writable.getWriter();
        await t.close(), t.releaseLock();
      }
    } catch (t) {
      this.trace(`Error while flushing output: ${t}`);
    }
  }
  inWaiting() {
    return this.buffer.length;
  }
  peek() {
    return this.buffer;
  }
  detectPanicHandler(t) {
    const e = new TextDecoder("utf-8").decode(t), i = e.match(/G?uru Meditation Error: (?:Core \d panic'ed \(([a-zA-Z ]*)\))?/) || e.match(/F?atal exception \(\d+\): (?:([a-zA-Z ]*)?.*epc)?/);
    if (i) {
      const r = i[1] || i[2];
      throw new Error("Guru Meditation Error detected" + (r ? ` (${r})` : ""));
    }
  }
  async read(t) {
    let e = null, i = !1, r = null;
    for (; ; ) {
      const o = Date.now();
      for (r = new Uint8Array(0); Date.now() - o < t; ) {
        if (this.buffer.length > 0) {
          r = this.buffer, this.buffer = new Uint8Array(0);
          break;
        }
        await Ve(1);
      }
      if (!r || r.length === 0) {
        const a = e === null ? "Serial data stream stopped: Possible serial noise or corruption." : "No serial data received.";
        throw this.tracing && this.trace(a), new Error(a);
      }
      this.tracing && this.trace(`Read ${r.length} bytes: ${this.hexConvert(r)}`);
      for (let a = 0; a < r.length; a++) {
        const n = r[a];
        if (e === null) {
          if (n !== this.SLIP_END) {
            this.tracing && this.trace(`Read invalid data: ${this.hexConvert(r)}`);
            const l = this.buffer;
            throw this.tracing && this.trace(`Remaining data in serial buffer: ${this.hexConvert(l)}`), this.detectPanicHandler(new Uint8Array([...r, ...l || []])), new Error(`Invalid head of packet (0x${n.toString(16)}): Possible serial noise or corruption.`);
          }
          e = new Uint8Array(0);
        } else if (i) if (i = !1, n === this.SLIP_ESC_END) e = this.appendArray(e, new Uint8Array([this.SLIP_END]));
        else {
          if (n !== this.SLIP_ESC_ESC) {
            this.tracing && this.trace(`Read invalid data: ${this.hexConvert(r)}`);
            const l = this.buffer;
            throw this.tracing && this.trace(`Remaining data in serial buffer: ${this.hexConvert(l)}`), this.detectPanicHandler(new Uint8Array([...r, ...l || []])), new Error(`Invalid SLIP escape (0xdb, 0x${n.toString(16)})`);
          }
          e = this.appendArray(e, new Uint8Array([this.SLIP_ESC]));
        }
        else if (n === this.SLIP_ESC) i = !0;
        else {
          if (n === this.SLIP_END) {
            if (this.tracing && this.trace(`Received full packet: ${this.hexConvert(e)}`), a + 1 < r.length) {
              const l = r.slice(a + 1);
              this.buffer = this.appendArray(l, this.buffer);
            }
            return e;
          }
          e = this.appendArray(e, new Uint8Array([n]));
        }
      }
    }
  }
  async rawRead(t, e) {
    let i;
    try {
      if (!this.device.readable) return;
      for (i = this.device.readable.getReader(); !e(); ) {
        const { value: r, done: o } = await i.read();
        if (o || !r) break;
        this.tracing && this.trace(`Read ${r.length} bytes: ${this.hexConvert(r)}`), t(r);
      }
    } catch (r) {
      this.trace(`Error reading from serial port: ${r}`), r instanceof Error && r.name === "NetworkError" && r.message.includes("device has been lost") && (this.trace("Device lost detected (NetworkError)"), this.onDeviceLostCallback && this.onDeviceLostCallback());
    } finally {
      i?.releaseLock();
    }
  }
  async setRTS(t) {
    await this.device.setSignals({ requestToSend: t }), await this.setDTR(this._DTR_state);
  }
  async setDTR(t) {
    this._DTR_state = t, await this.device.setSignals({ dataTerminalReady: t });
  }
  async connect(t = 115200, e = {}) {
    await this.device.open({ baudRate: t, dataBits: e?.dataBits, stopBits: e?.stopBits, bufferSize: e?.bufferSize, parity: e?.parity, flowControl: e?.flowControl }), this.baudrate = t;
  }
  async waitForUnlock(t) {
    for (; this.device.readable && this.device.readable.locked || this.device.writable && this.device.writable.locked; ) await Ve(t);
  }
  async disconnect() {
    var t, e;
    !((t = this.device.readable) === null || t === void 0) && t.locked && await ((e = this.reader) === null || e === void 0 ? void 0 : e.cancel()), await this.waitForUnlock(400), await this.device.close(), this.reader = void 0;
  }
}
function Tt(s) {
  return new Promise(((t) => setTimeout(t, s)));
}
class uA {
  constructor(t, e) {
    this.resetDelay = e, this.transport = t;
  }
  async reset() {
    await this.transport.setDTR(!1), await this.transport.setRTS(!0), await Tt(100), await this.transport.setDTR(!0), await this.transport.setRTS(!1), await Tt(this.resetDelay), await this.transport.setDTR(!1);
  }
}
class fA {
  constructor(t) {
    this.transport = t;
  }
  async reset() {
    await this.transport.setRTS(!1), await this.transport.setDTR(!1), await Tt(100), await this.transport.setDTR(!0), await this.transport.setRTS(!1), await Tt(100), await this.transport.setRTS(!0), await this.transport.setDTR(!1), await this.transport.setRTS(!0), await Tt(100), await this.transport.setRTS(!1), await this.transport.setDTR(!1);
  }
}
class Pn {
  constructor(t, e = !1) {
    this.transport = t, this.usingUsbOtg = e, this.transport = t;
  }
  async reset() {
    this.usingUsbOtg ? (await Tt(200), await this.transport.setRTS(!1), await Tt(200)) : (await Tt(100), await this.transport.setRTS(!1));
  }
}
class mA {
  constructor(t, e) {
    this.transport = t, this.sequenceString = e, this.transport = t;
  }
  async reset() {
    const t = { D: async (e) => await this.transport.setDTR(e), R: async (e) => await this.transport.setRTS(e), W: async (e) => await Tt(e) };
    try {
      if (!(function(i) {
        const r = ["D", "R", "W"], o = i.split("|");
        for (const a of o) {
          const n = a[0], l = a.slice(1);
          if (!r.includes(n)) return !1;
          if (n === "D" || n === "R") {
            if (l !== "0" && l !== "1") return !1;
          } else if (n === "W") {
            const c = parseInt(l);
            if (isNaN(c) || c <= 0) return !1;
          }
        }
        return !0;
      })(this.sequenceString)) return;
      const e = this.sequenceString.split("|");
      for (const i of e) {
        const r = i[0], o = i.slice(1);
        r === "W" ? await t.W(Number(o)) : r !== "D" && r !== "R" || await t[r](o === "1");
      }
    } catch {
      throw new Error("Invalid custom reset sequence");
    }
  }
}
function vA(s) {
  return s && s.__esModule && Object.prototype.hasOwnProperty.call(s, "default") ? s.default : s;
}
var qo, Zo, _A = vA(Zo ? qo : (Zo = 1, qo = function(s) {
  return atob(s);
}));
async function Xo(s, t) {
  let e;
  switch (s) {
    case "ESP32":
      e = await Promise.resolve().then(() => Qp);
      break;
    case "ESP32-C2":
      e = await Promise.resolve().then(() => Gp);
      break;
    case "ESP32-C3":
      e = await Promise.resolve().then(() => Lp);
      break;
    case "ESP32-C5":
      e = await Promise.resolve().then(() => Np);
      break;
    case "ESP32-C6":
      e = await Promise.resolve().then(() => zp);
      break;
    case "ESP32-C61":
      e = await Promise.resolve().then(() => jp);
      break;
    case "ESP32-H2":
      e = await Promise.resolve().then(() => Vp);
      break;
    case "ESP32-P4":
      e = t && t < 300 ? await Promise.resolve().then(() => Zp) : await Promise.resolve().then(() => tg);
      break;
    case "ESP32-S2":
      e = await Promise.resolve().then(() => ig);
      break;
    case "ESP32-S3":
      e = await Promise.resolve().then(() => rg);
      break;
    case "ESP8266":
      e = await Promise.resolve().then(() => ag);
  }
  if (e) return { bss_start: e.bss_start, data: e.data, data_start: e.data_start, entry: e.entry, text: e.text, text_start: e.text_start, decodedData: ta(e.data), decodedText: ta(e.text) };
}
function ta(s) {
  const t = _A(s).split("").map((function(e) {
    return e.charCodeAt(0);
  }));
  return new Uint8Array(t);
}
class Tr {
  constructor() {
    this.FLASH_SIZES = { "1MB": 0, "2MB": 16, "4MB": 32, "8MB": 48, "16MB": 64, "32MB": 80, "64MB": 96, "128MB": 112 }, this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "26m": 1, "20m": 2 };
  }
  getEraseSize(t, e) {
    return e;
  }
}
class Be extends Tr {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP8266", this.CHIP_DETECT_MAGIC_VALUE = [4293968129], this.EFUSE_RD_REG_BASE = 1072693328, this.UART_CLKDIV_REG = 1610612756, this.UART_CLKDIV_MASK = 1048575, this.XTAL_CLK_DIVIDER = 2, this.FLASH_WRITE_SIZE = 16384, this.BOOTLOADER_FLASH_OFFSET = 0, this.UART_DATE_REG_ADDR = 0, this.FLASH_SIZES = { "512KB": 0, "256KB": 16, "1MB": 32, "2MB": 48, "4MB": 64, "2MB-c1": 80, "4MB-c1": 96, "8MB": 128, "16MB": 144 }, this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "26m": 1, "20m": 2 }, this.MEMORY_MAP = [[1072693248, 1072693264, "DPORT"], [1073643520, 1073741824, "DRAM"], [1074790400, 1074823168, "IRAM"], [1075843088, 1076760592, "IROM"]], this.SPI_REG_BASE = 1610613248, this.SPI_USR_OFFS = 28, this.SPI_USR1_OFFS = 32, this.SPI_USR2_OFFS = 36, this.SPI_MOSI_DLEN_OFFS = 0, this.SPI_MISO_DLEN_OFFS = 0, this.SPI_W0_OFFS = 64, this.getChipFeatures = async (t) => {
      const e = ["WiFi"];
      return await this.getChipDescription(t) == "ESP8285" && e.push("Embedded Flash"), e;
    };
  }
  async readEfuse(t, e) {
    const i = this.EFUSE_RD_REG_BASE + 4 * e;
    return t.debug("Read efuse " + i), await t.readReg(i);
  }
  async getChipDescription(t) {
    const e = await this.readEfuse(t, 2);
    return (16 & await this.readEfuse(t, 0) | 65536 & e) != 0 ? "ESP8285" : "ESP8266EX";
  }
  async getCrystalFreq(t) {
    const e = await t.readReg(this.UART_CLKDIV_REG) & this.UART_CLKDIV_MASK, i = t.transport.baudrate * e / 1e6 / this.XTAL_CLK_DIVIDER;
    let r;
    return r = i > 33 ? 40 : 26, Math.abs(r - i) > 1 && t.info("WARNING: Detected crystal freq " + i + "MHz is quite different to normalized freq " + r + "MHz. Unsupported crystal in use?"), r;
  }
  _d2h(t) {
    const e = (+t).toString(16);
    return e.length === 1 ? "0" + e : e;
  }
  async readMac(t) {
    let e = await this.readEfuse(t, 0);
    e >>>= 0;
    let i = await this.readEfuse(t, 1);
    i >>>= 0;
    let r = await this.readEfuse(t, 3);
    r >>>= 0;
    const o = new Uint8Array(6);
    return r != 0 ? (o[0] = r >> 16 & 255, o[1] = r >> 8 & 255, o[2] = 255 & r) : (i >> 16 & 255) == 0 ? (o[0] = 24, o[1] = 254, o[2] = 52) : (i >> 16 & 255) == 1 ? (o[0] = 172, o[1] = 208, o[2] = 116) : t.error("Unknown OUI"), o[3] = i >> 8 & 255, o[4] = 255 & i, o[5] = e >> 24 & 255, this._d2h(o[0]) + ":" + this._d2h(o[1]) + ":" + this._d2h(o[2]) + ":" + this._d2h(o[3]) + ":" + this._d2h(o[4]) + ":" + this._d2h(o[5]);
  }
  getEraseSize(t, e) {
    return e;
  }
}
Be.IROM_MAP_START = 1075838976, Be.IROM_MAP_END = 1076887552;
var EA = Object.freeze({ __proto__: null, ESP8266ROM: Be });
const Ai = 233;
function qe(s, t) {
  return s + (t - 1 - s % t);
}
function Ps(s, t) {
  return s[t] | s[t + 1] << 8 | s[t + 2] << 16 | s[t + 3] << 24;
}
class zt {
  constructor(t, e, i = null, r = 0) {
    this.addr = t, this.data = e, this.fileOffs = i, this.flags = r, this.includeInChecksum = !0, this.addr !== 0 && this.padToAlignment(4);
  }
  copyWithNewAddr(t) {
    return new zt(t, this.data, 0);
  }
  splitImage(t) {
    const e = new zt(this.addr, this.data.slice(0, t), 0);
    return this.data = this.data.slice(t), this.addr += t, this.fileOffs = null, e;
  }
  toString() {
    let t = `len 0x${this.data.length.toString(16).padStart(5, "0")} load 0x${this.addr.toString(16).padStart(8, "0")}`;
    return this.fileOffs !== null && (t += ` file_offs 0x${this.fileOffs.toString(16).padStart(8, "0")}`), t;
  }
  getMemoryType(t) {
    return t.ROM_LOADER.MEMORY_MAP.filter(((e) => e[0] <= this.addr && this.addr < e[1])).map(((e) => e[2]));
  }
  padToAlignment(t) {
    this.data = er(this.data, t, 0);
  }
}
class ea extends zt {
  constructor(t, e, i, r) {
    super(e, i, null, r), this.name = t;
  }
  toString() {
    return `${this.name} ${super.toString()}`;
  }
}
class kr {
  constructor(t) {
    this.SEG_HEADER_LEN = 8, this.SHA256_DIGEST_LEN = 32, this.ELF_FLAG_WRITE = 1, this.ELF_FLAG_READ = 2, this.ELF_FLAG_EXEC = 4, this.segments = [], this.entrypoint = 0, this.elfSha256 = null, this.elfSha256Offset = 0, this.padToSize = 0, this.flashMode = 0, this.flashSizeFreq = 0, this.checksum = 0, this.datalength = 0, this.IROM_ALIGN = 0, this.MMU_PAGE_SIZE_CONF = [], this.ROM_LOADER = t;
  }
  loadCommonHeader(t, e, i) {
    const r = t[e], o = t[e + 1];
    if (this.flashMode = t[e + 2], this.flashSizeFreq = t[e + 3], this.entrypoint = Ps(t, e + 4), r !== i) throw new Q(`Invalid firmware image magic=0x${r.toString(16)}`);
    return o;
  }
  verify() {
    if (this.segments.length > 16) throw new Q(`Invalid segment count ${this.segments.length} (max 16). Usually this indicates a linker script problem.`);
  }
  loadSegment(t, e, i = !1) {
    const r = e, o = Ps(t, e), a = Ps(t, e + 4);
    this.warnIfUnusualSegment(o, a, i);
    const n = t.slice(e + 8, e + 8 + a);
    if (n.length < a) throw new Q(`End of file reading segment 0x${o.toString(16)}, length ${a} (actual length ${n.length})`);
    const l = new zt(o, n, r);
    return this.segments.push(l), l;
  }
  warnIfUnusualSegment(t, e, i) {
    i || (t > 1075838976 || t < 1073610752 || e > 65536) && console.warn(`WARNING: Suspicious segment 0x${t.toString(16)}, length ${e}`);
  }
  maybePatchSegmentData(t, e) {
    const i = t.length;
    if (this.elfSha256Offset >= e && this.elfSha256Offset < e + i) {
      const r = this.elfSha256Offset - e;
      if (r < this.SEG_HEADER_LEN || r + this.SHA256_DIGEST_LEN > i) throw new Q(`Cannot place SHA256 digest on segment boundary(elf_sha256_offset=${this.elfSha256Offset}, file_pos=${e}, segment_size=${i})`);
      const o = r - this.SEG_HEADER_LEN;
      if (!t.slice(o, o + this.SHA256_DIGEST_LEN).every(((d) => d === 0))) throw new Q(`Contents of segment at SHA256 digest offset 0x${this.elfSha256Offset.toString(16)} are not all zero. Refusing to overwrite.`);
      if (!this.elfSha256 || this.elfSha256.length !== this.SHA256_DIGEST_LEN) throw new Q("ELF SHA256 digest is not properly initialized");
      const a = t.slice(0, o), n = t.slice(o + this.SHA256_DIGEST_LEN), l = a.length + this.elfSha256.length + n.length, c = new Uint8Array(l);
      return c.set(a, 0), c.set(this.elfSha256, a.length), c.set(n, a.length + this.elfSha256.length), c;
    }
    return t;
  }
  saveSegment(t, e, i, r = null) {
    const o = this.maybePatchSegmentData(i.data, e), a = new DataView(t.buffer, e);
    return a.setUint32(0, i.addr, !0), a.setUint32(4, o.length, !0), t.set(o, e + 8), r !== null ? Vo(o, r) : 0;
  }
  saveFlashSegment(t, e, i, r = null) {
    if (this.ROM_LOADER.CHIP_NAME === "ESP32") {
      const o = (e + i.data.length + this.SEG_HEADER_LEN) % this.IROM_ALIGN;
      if (o < 36) {
        const a = new Uint8Array(i.data.length + (36 - o));
        a.set(i.data), a.fill(0, i.data.length), i.data = a;
      }
    }
    return this.saveSegment(t, e, i, r);
  }
  readChecksum(t, e) {
    return t[qe(e, 16)];
  }
  calculateChecksum() {
    let t = 239;
    for (const e of this.segments) e.includeInChecksum && (t = Vo(e.data, t));
    return t;
  }
  appendChecksum(t, e, i) {
    t[qe(e, 16)] = i;
  }
  writeCommonHeader(t, e, i) {
    t[e] = Ai, t[e + 1] = i, t[e + 2] = this.flashMode, t[e + 3] = this.flashSizeFreq, new DataView(t.buffer, e + 4).setUint32(0, this.entrypoint, !0);
  }
  isIromAddr(t) {
    return Be.IROM_MAP_START <= t && t < Be.IROM_MAP_END;
  }
  getIromSegment() {
    const t = this.segments.filter(((e) => this.isIromAddr(e.addr)));
    if (t.length > 0) {
      if (t.length !== 1) throw new Q(`Found ${t.length} segments that could be irom0. Bad ELF file?`);
      return t[0];
    }
    return null;
  }
  getNonIromSegments() {
    const t = this.getIromSegment();
    return this.segments.filter(((e) => e !== t));
  }
  sortSegments() {
    this.segments.length && this.segments.sort(((t, e) => t.addr - e.addr));
  }
  mergeAdjacentSegments() {
    if (!this.segments.length) return;
    const t = [];
    for (let e = this.segments.length - 1; e > 0; e--) {
      const i = this.segments[e - 1], r = this.segments[e];
      if (i.getMemoryType(this).join(",") === r.getMemoryType(this).join(",") && i.includeInChecksum === r.includeInChecksum && r.addr === i.addr + i.data.length && (r.flags & this.ELF_FLAG_EXEC) == (i.flags & this.ELF_FLAG_EXEC)) {
        const o = new Uint8Array(i.data.length + r.data.length);
        o.set(i.data), o.set(r.data, i.data.length), i.data = o;
      } else t.unshift(r);
    }
    t.unshift(this.segments[0]), this.segments = t;
  }
  setMmuPageSize(t) {
    if (this.MMU_PAGE_SIZE_CONF || t === this.IROM_ALIGN) {
      if (this.MMU_PAGE_SIZE_CONF && !this.MMU_PAGE_SIZE_CONF.includes(t)) {
        const e = this.MMU_PAGE_SIZE_CONF.map(((i) => i / 1024 + "KB")).join(", ");
        throw new Q(`${t} bytes is not a valid ${this.ROM_LOADER.CHIP_NAME} page size, select from ${e}.`);
      }
      this.IROM_ALIGN = t;
    } else console.warn(`WARNING: Changing MMU page size is not supported on ${this.ROM_LOADER.CHIP_NAME}! ` + (this.IROM_ALIGN !== 0 ? `Defaulting to ${this.IROM_ALIGN / 1024}KB.` : ""));
  }
}
class jt extends kr {
  constructor(t, e = null, i = !0, r = !1) {
    super(t), this.securePad = null, this.flashMode = 0, this.flashSizeFreq = 0, this.version = 1, this.WP_PIN_DISABLED = 238, this.wpPin = this.WP_PIN_DISABLED, this.clkDrv = 0, this.qDrv = 0, this.dDrv = 0, this.csDrv = 0, this.hdDrv = 0, this.wpDrv = 0, this.chipId = 0, this.minRev = 0, this.minRevFull = 0, this.maxRevFull = 0, this.storedDigest = null, this.calcDigest = null, this.dataLength = 0, this.IROM_ALIGN = 65536, this.ROM_LOADER = t, this.appendDigest = i, this.ramOnlyHeader = r, e !== null && this.loadFromFile(e);
  }
  async loadFromFile(t) {
    const e = t instanceof Uint8Array ? t : os(t);
    let i = 0;
    const r = this.loadCommonHeader(e, i, Ai);
    i += 8, this.loadExtendedHeader(e, i), i += 16;
    for (let o = 0; o < r; o++)
      i += 8 + this.loadSegment(e, i).data.length;
    if (this.checksum = this.readChecksum(e, i), i = qe(i, 16), this.appendDigest) {
      const o = i;
      this.storedDigest = e.slice(i, i + this.SHA256_DIGEST_LEN);
      const a = await crypto.subtle.digest("SHA-256", e.slice(0, o));
      this.calcDigest = new Uint8Array(a), this.dataLength = o - 0;
    }
    this.verify();
  }
  isFlashAddr(t) {
    return this.ROM_LOADER.IROM_MAP_START <= t && t < this.ROM_LOADER.IROM_MAP_END || this.ROM_LOADER.DROM_MAP_START <= t && t < this.ROM_LOADER.DROM_MAP_END;
  }
  async save() {
    let t = 0;
    const e = new Uint8Array(1048576);
    let i = 0;
    this.writeCommonHeader(e, i, this.segments.length), i += 8, this.saveExtendedHeader(e, i), i += 16;
    let r = 239;
    const o = this.segments.filter(((l) => this.isFlashAddr(l.addr))).sort(((l, c) => l.addr - c.addr)), a = this.segments.filter(((l) => !this.isFlashAddr(l.addr))).sort(((l, c) => l.addr - c.addr));
    for (let l = 0; l < o.length; l++) {
      const c = o[l];
      if (c instanceof ea && c.name === ".flash.appdesc") {
        o.splice(l, 1), o.unshift(c);
        break;
      }
    }
    for (let l = 0; l < a.length; l++) {
      const c = a[l];
      if (c instanceof ea && c.name === ".dram0.bootdesc") {
        a.splice(l, 1), a.unshift(c);
        break;
      }
    }
    if (o.length > 0) {
      let l = o[0].addr;
      for (const c of o.slice(1)) {
        if (Math.floor(c.addr / this.IROM_ALIGN) === Math.floor(l / this.IROM_ALIGN)) throw new Q(`Segment loaded at 0x${c.addr.toString(16)} lands in same 64KB flash mapping as segment loaded at 0x${l.toString(16)}. Can't generate binary. Suggest changing linker script or ELF to merge sections.`);
        l = c.addr;
      }
    }
    if (this.ramOnlyHeader) {
      for (const l of a) r = this.saveSegment(e, i, l, r), i += 8 + l.data.length, t++;
      this.appendChecksum(e, i, r), i = qe(i, 16);
      for (const l of o.reverse()) {
        let c = this.getAlignmentDataNeeded(l, i);
        if (c > 0) {
          c < this.ROM_LOADER.BOOTLOADER_FLASH_OFFSET - this.SEG_HEADER_LEN && (c += this.IROM_ALIGN), c -= this.ROM_LOADER.BOOTLOADER_FLASH_OFFSET;
          const d = new zt(0, new Uint8Array(c).fill(0), i);
          r = this.saveSegment(e, i, d, r), i += 8 + c, t++;
        }
        this.saveFlashSegment(e, i, l), i += 8 + l.data.length, t++;
      }
    } else {
      for (; o.length > 0; ) {
        const l = o[0], c = this.getAlignmentDataNeeded(l, i);
        if (c > 0) {
          if (a.length > 0 && c > this.SEG_HEADER_LEN) {
            const d = a[0].splitImage(c);
            a[0].data.length === 0 && a.shift(), r = this.saveSegment(e, i, d, r);
          } else {
            const d = new zt(0, new Uint8Array(c).fill(0), i);
            r = this.saveSegment(e, i, d, r);
          }
          i += 8 + c, t++;
        } else {
          if ((i + 8) % this.IROM_ALIGN != l.addr % this.IROM_ALIGN) throw new Error("Flash segment alignment mismatch");
          r = this.saveFlashSegment(e, i, l, r), o.shift(), i += 8 + l.data.length, t++;
        }
      }
      for (const l of a) r = this.saveSegment(e, i, l, r), i += 8 + l.data.length, t++;
    }
    if (this.securePad) {
      if (!this.appendDigest) throw new Error("secure_pad only applies if a SHA-256 digest is also appended to the image");
      const l = (i + this.SEG_HEADER_LEN) % this.IROM_ALIGN, c = 16;
      let d = 0;
      this.securePad === "1" ? d = 112 : this.securePad === "2" && (d = 32);
      const h = (this.IROM_ALIGN - l - c - d) % this.IROM_ALIGN, g = new zt(0, new Uint8Array(h).fill(0), i);
      r = this.saveSegment(e, i, g, r), i += 8 + h, t++;
    }
    this.ramOnlyHeader || (this.appendChecksum(e, i, r), i = qe(i, 16));
    const n = i;
    if (this.ramOnlyHeader ? e[1] = a.length : e[1] = t, this.appendDigest) {
      const l = await crypto.subtle.digest("SHA-256", e.slice(0, n)), c = new Uint8Array(l);
      e.set(c, n), i += 32;
    }
    if (this.padToSize && i % this.padToSize != 0) {
      const l = this.padToSize - i % this.padToSize, c = new Uint8Array(l);
      c.fill(255), e.set(c, i), i += l;
    }
    return e;
  }
  loadExtendedHeader(t, e) {
    const i = new DataView(t.buffer, e);
    this.wpPin = i.getUint8(0);
    const r = i.getUint8(1);
    [this.clkDrv, this.qDrv] = this.splitByte(r);
    const o = i.getUint8(2);
    [this.dDrv, this.csDrv] = this.splitByte(o);
    const a = i.getUint8(3);
    [this.hdDrv, this.wpDrv] = this.splitByte(a), this.chipId = i.getUint8(4), this.chipId !== this.ROM_LOADER.IMAGE_CHIP_ID && console.warn(`Unexpected chip id in image. Expected ${this.ROM_LOADER.IMAGE_CHIP_ID} but value was ${this.chipId}. Is this image for a different chip model?`), this.minRev = i.getUint8(5), this.minRevFull = i.getUint16(6, !0), this.maxRevFull = i.getUint16(8, !0);
    const n = i.getUint8(15);
    if (n !== 0 && n !== 1) throw new Error(`Invalid value for append_digest field (0x${n.toString(16)}). Should be 0 or 1.`);
    this.appendDigest = n === 1;
  }
  saveExtendedHeader(t, e) {
    const i = new ArrayBuffer(16), r = new DataView(i);
    r.setUint8(0, this.wpPin), r.setUint8(1, this.joinByte(this.clkDrv, this.qDrv)), r.setUint8(2, this.joinByte(this.dDrv, this.csDrv)), r.setUint8(3, this.joinByte(this.hdDrv, this.wpDrv)), r.setUint8(4, this.ROM_LOADER.IMAGE_CHIP_ID), r.setUint8(5, this.minRev), r.setUint16(6, this.minRevFull, !0), r.setUint16(8, this.maxRevFull, !0);
    for (let o = 9; o < 15; o++) r.setUint8(o, 0);
    r.setUint8(15, this.appendDigest ? 1 : 0), t.set(new Uint8Array(i), e);
  }
  splitByte(t) {
    return [15 & t, t >> 4 & 15];
  }
  joinByte(t, e) {
    return 15 & t | (15 & e) << 4;
  }
  getAlignmentDataNeeded(t, e) {
    const i = t.addr % this.IROM_ALIGN - this.SEG_HEADER_LEN;
    let r = this.IROM_ALIGN - e % this.IROM_ALIGN + i;
    return r === 0 || r === this.IROM_ALIGN ? 0 : (r -= this.SEG_HEADER_LEN, r < 0 && (r += this.IROM_ALIGN), r);
  }
}
class wA extends kr {
  constructor(t, e = null) {
    super(t), this.version = 1, this.ROM_LOADER = t, this.flashMode = 0, this.flashSizeFreq = 0, e !== null && this.loadFromFile(e);
  }
  loadFromFile(t) {
    const e = t instanceof Uint8Array ? t : os(t);
    let i = 0;
    const r = this.loadCommonHeader(e, i, Ai);
    i += 8;
    for (let o = 0; o < r; o++)
      i += 8 + this.loadSegment(e, i).data.length;
    this.checksum = this.readChecksum(e, i), this.verify();
  }
  defaultOutputName(t) {
    return t + "-";
  }
}
class le extends kr {
  constructor(t, e = null) {
    super(t), this.version = 2, this.ROM_LOADER = t, this.flashMode = 0, this.flashSizeFreq = 0, e !== null && this.loadFromFile(e);
  }
  async loadFromFile(t) {
    const e = t instanceof Uint8Array ? t : os(t);
    let i = 0;
    const r = this.loadCommonHeader(e, i, le.IMAGE_V2_MAGIC);
    i += 8, r !== le.IMAGE_V2_SEGMENT && console.warn(`Warning: V2 header has unexpected "segment" count ${r} (usually 4)`);
    const o = this.flashMode, a = this.flashSizeFreq, n = this.entrypoint, l = this.loadSegment(e, i, !0);
    l.addr = 0, l.includeInChecksum = !1, i += 8 + l.data.length;
    const c = this.loadCommonHeader(e, i, Ai);
    i += 8, o !== this.flashMode && console.warn(`WARNING: Flash mode value in first header (0x${o.toString(16)}) disagrees with second (0x${this.flashMode.toString(16)}). Using second value.`), a !== this.flashSizeFreq && console.warn(`WARNING: Flash size/freq value in first header (0x${a.toString(16)}) disagrees with second (0x${this.flashSizeFreq.toString(16)}). Using second value.`), n !== this.entrypoint && console.warn(`WARNING: Entrypoint address in first header (0x${n.toString(16)}) disagrees with second header (0x${this.entrypoint.toString(16)}). Using second value.`);
    for (let d = 0; d < c; d++)
      i += 8 + this.loadSegment(e, i).data.length;
    this.checksum = this.readChecksum(e, i), this.verify();
  }
  defaultOutputName(t) {
    const e = this.getIromSegment();
    let i = 0;
    return e !== null && (i = e.addr - Be.IROM_MAP_START), `${t.replace(/\.[^/.]+$/, "")}-0x${(-4096 & i).toString(16).padStart(5, "0")}.bin`;
  }
}
le.IMAGE_V2_MAGIC = 234, le.IMAGE_V2_SEGMENT = 4;
class bA extends jt {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class yA extends jt {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class CA extends jt {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class BA extends jt {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.MMU_PAGE_SIZE_CONF = [16384, 32768, 65536], this.ROM_LOADER = t;
  }
}
class Fr extends jt {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.MMU_PAGE_SIZE_CONF = [8192, 16384, 32768, 65536], this.ROM_LOADER = t;
  }
}
class IA extends Fr {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class xA extends jt {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class SA extends jt {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class RA extends Fr {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
async function ia(s, t) {
  const e = t instanceof Uint8Array ? t : os(t), i = s.CHIP_NAME.toLowerCase().replace(/[-()]/g, "");
  let r;
  if (i !== "esp8266") switch (i) {
    case "esp32":
      r = jt;
      break;
    case "esp32s2":
      r = bA;
      break;
    case "esp32s3":
      r = yA;
      break;
    case "esp32c3":
      r = CA;
      break;
    case "esp32c2":
      r = BA;
      break;
    case "esp32c6":
      r = Fr;
      break;
    case "esp32c61":
      r = IA;
      break;
    case "esp32c5":
      r = xA;
      break;
    case "esp32h2":
      r = RA;
      break;
    case "esp32p4":
      r = SA;
      break;
    default:
      throw new Q(`Unsupported chip name: ${i}`);
  }
  else {
    const n = e[0];
    if (n === Ai) r = wA;
    else {
      if (n !== le.IMAGE_V2_MAGIC) throw new Q(`Invalid image magic number: ${n}`);
      r = le;
    }
  }
  const o = new r(s), a = o;
  if (typeof a.loadFromFile == "function") {
    const n = a.loadFromFile(e);
    n instanceof Promise && await n;
  }
  return o;
}
class DA {
  constructor(t) {
    var e, i, r, o, a, n, l, c;
    this.ESP_RAM_BLOCK = 6144, this.ESP_FLASH_BEGIN = 2, this.ESP_FLASH_DATA = 3, this.ESP_FLASH_END = 4, this.ESP_MEM_BEGIN = 5, this.ESP_MEM_END = 6, this.ESP_MEM_DATA = 7, this.ESP_WRITE_REG = 9, this.ESP_READ_REG = 10, this.ESP_SPI_ATTACH = 13, this.ESP_CHANGE_BAUDRATE = 15, this.ESP_FLASH_DEFL_BEGIN = 16, this.ESP_FLASH_DEFL_DATA = 17, this.ESP_FLASH_DEFL_END = 18, this.ESP_SPI_FLASH_MD5 = 19, this.ESP_ERASE_FLASH = 208, this.ESP_ERASE_REGION = 209, this.ESP_READ_FLASH = 210, this.ESP_RUN_USER_CODE = 211, this.ESP_IMAGE_MAGIC = 233, this.ESP_CHECKSUM_MAGIC = 239, this.ROM_INVALID_RECV_MSG = 5, this.DEFAULT_TIMEOUT = 3e3, this.ERASE_REGION_TIMEOUT_PER_MB = 3e4, this.ERASE_WRITE_TIMEOUT_PER_MB = 4e4, this.MD5_TIMEOUT_PER_MB = 8e3, this.CHIP_ERASE_TIMEOUT = 12e4, this.FLASH_READ_TIMEOUT = 1e5, this.MAX_TIMEOUT = 2 * this.CHIP_ERASE_TIMEOUT, this.SPI_ADDR_REG_MSB = !0, this.CHIP_DETECT_MAGIC_REG_ADDR = 1073745920, this.DETECTED_FLASH_SIZES = { 18: "256KB", 19: "512KB", 20: "1MB", 21: "2MB", 22: "4MB", 23: "8MB", 24: "16MB", 25: "32MB", 26: "64MB", 27: "128MB", 28: "256MB", 32: "64MB", 33: "128MB", 34: "256MB", 50: "256KB", 51: "512KB", 52: "1MB", 53: "2MB", 54: "4MB", 55: "8MB", 56: "16MB", 57: "32MB", 58: "64MB" }, this.USB_JTAG_SERIAL_PID = 4097, this.romBaudrate = 115200, this.debugLogging = !1, this.syncStubDetected = !1, this.IS_STUB = !1, this.FLASH_WRITE_SIZE = 16384, this.transport = t.transport, this.baudrate = t.baudrate, this.resetConstructors = { classicReset: (d, h) => new uA(d, h), customReset: (d, h) => new mA(d, h), hardReset: (d, h) => new Pn(d, h), usbJTAGSerialReset: (d) => new fA(d) }, t.serialOptions && (this.serialOptions = t.serialOptions), t.terminal && (this.terminal = t.terminal, this.terminal.clean()), t.debugLogging !== void 0 && (this.debugLogging = t.debugLogging), t.port && (this.transport = new Mr(t.port)), t.enableTracing !== void 0 && (this.transport.tracing = t.enableTracing), !((e = t.resetConstructors) === null || e === void 0) && e.classicReset && (this.resetConstructors.classicReset = (i = t.resetConstructors) === null || i === void 0 ? void 0 : i.classicReset), !((r = t.resetConstructors) === null || r === void 0) && r.customReset && (this.resetConstructors.customReset = (o = t.resetConstructors) === null || o === void 0 ? void 0 : o.customReset), !((a = t.resetConstructors) === null || a === void 0) && a.hardReset && (this.resetConstructors.hardReset = (n = t.resetConstructors) === null || n === void 0 ? void 0 : n.hardReset), !((l = t.resetConstructors) === null || l === void 0) && l.usbJTAGSerialReset && (this.resetConstructors.usbJTAGSerialReset = (c = t.resetConstructors) === null || c === void 0 ? void 0 : c.usbJTAGSerialReset), this.info("esptool.js"), this.info("Serial port " + this.transport.getInfo());
  }
  write(t, e = !0) {
    this.terminal ? e ? this.terminal.writeLine(t) : this.terminal.write(t) : console.log(t);
  }
  error(t, e = !0) {
    this.write(`Error: ${t}`, e);
  }
  info(t, e = !0) {
    this.write(t, e);
  }
  debug(t, e = !0) {
    this.debugLogging && this.write(`Debug: ${t}`, e);
  }
  _shortToBytearray(t) {
    return new Uint8Array([255 & t, t >> 8 & 255]);
  }
  _intToByteArray(t) {
    return new Uint8Array([255 & t, t >> 8 & 255, t >> 16 & 255, t >> 24 & 255]);
  }
  _byteArrayToShort(t, e) {
    return t | e >> 8;
  }
  _byteArrayToInt(t, e, i, r) {
    return t | e << 8 | i << 16 | r << 24;
  }
  _appendBuffer(t, e) {
    const i = new Uint8Array(t.byteLength + e.byteLength);
    return i.set(new Uint8Array(t), 0), i.set(new Uint8Array(e), t.byteLength), i.buffer;
  }
  _appendArray(t, e) {
    const i = new Uint8Array(t.length + e.length);
    return i.set(t, 0), i.set(e, t.length), i;
  }
  ui8ToBstr(t) {
    let e = "";
    for (let i = 0; i < t.length; i++) e += String.fromCharCode(t[i]);
    return e;
  }
  bstrToUi8(t) {
    const e = new Uint8Array(t.length);
    for (let i = 0; i < t.length; i++) e[i] = t.charCodeAt(i);
    return e;
  }
  async readPacket(t = null, e = this.DEFAULT_TIMEOUT) {
    for (let i = 0; i < 100; i++) {
      const r = await this.transport.read(e);
      if (!r || r.length < 8) continue;
      const o = r[0];
      if (o !== 1) continue;
      const a = r[1], n = this._byteArrayToInt(r[4], r[5], r[6], r[7]), l = r.slice(8);
      if (o == 1) {
        if (t == null || a == t) return [n, l];
        if (l[0] != 0 && l[1] == this.ROM_INVALID_RECV_MSG) throw this.transport.flushInput(), new Q("unsupported command error");
      }
    }
    throw new Q("invalid response");
  }
  async command(t = null, e = new Uint8Array(0), i = 0, r = !0, o = this.DEFAULT_TIMEOUT) {
    if (t != null) {
      this.transport.tracing && this.transport.trace(`command op:0x${t.toString(16).padStart(2, "0")} data len=${e.length} wait_response=${r ? 1 : 0} timeout=${(o / 1e3).toFixed(3)} data=${this.transport.hexConvert(e)}`);
      const a = new Uint8Array(8 + e.length);
      let n;
      for (a[0] = 0, a[1] = t, a[2] = this._shortToBytearray(e.length)[0], a[3] = this._shortToBytearray(e.length)[1], a[4] = this._intToByteArray(i)[0], a[5] = this._intToByteArray(i)[1], a[6] = this._intToByteArray(i)[2], a[7] = this._intToByteArray(i)[3], n = 0; n < e.length; n++) a[8 + n] = e[n];
      await this.transport.write(a);
    }
    return r ? this.readPacket(t, o) : [0, new Uint8Array(0)];
  }
  async readReg(t, e = this.DEFAULT_TIMEOUT) {
    this.debug(`Read Register:${this.toHex(t)}`);
    const i = this._intToByteArray(t), r = await this.command(this.ESP_READ_REG, i, void 0, void 0, e);
    return this.debug(`Read Register Value:${r[0]}`), r[0];
  }
  async writeReg(t, e, i = 4294967295, r = 0, o = 0) {
    let a = this._appendArray(this._intToByteArray(t), this._intToByteArray(e));
    a = this._appendArray(a, this._intToByteArray(i)), a = this._appendArray(a, this._intToByteArray(r)), o > 0 && (a = this._appendArray(a, this._intToByteArray(this.chip.UART_DATE_REG_ADDR)), a = this._appendArray(a, this._intToByteArray(0)), a = this._appendArray(a, this._intToByteArray(0)), a = this._appendArray(a, this._intToByteArray(o))), await this.checkCommand("write target memory", this.ESP_WRITE_REG, a);
  }
  async sync() {
    this.debug("Sync");
    const t = new Uint8Array(36);
    let e;
    for (t[0] = 7, t[1] = 7, t[2] = 18, t[3] = 32, e = 0; e < 32; e++) t[4 + e] = 85;
    try {
      let i = await this.command(8, t, void 0, void 0, 100);
      this.syncStubDetected = i[0] === 0;
      for (let r = 0; r < 7; r++) i = await this.readPacket(8, 100), this.syncStubDetected = this.syncStubDetected && i[0] === 0;
      return i;
    } catch (i) {
      throw this.debug("Sync err " + i), i;
    }
  }
  async _connectAttempt(t = "default_reset", e) {
    this.debug("_connect_attempt " + t), e && await e.reset();
    const i = this.transport.peek(), r = Array.from(i, ((c) => String.fromCharCode(c))).join("").match(/boot:(0x[0-9a-fA-F]+)([\s\S]*?waiting for download)?/);
    let o = !1, a = "", n = !1;
    r && (o = !0, a = r[1], n = !!r[2]), this.debug(`bootMode:${a} downloadMode:${n}`);
    let l = "";
    for (let c = 0; c < 5; c++) try {
      this.debug(`Sync connect attempt ${c}`), this.transport.flushInput();
      const d = await this.sync();
      return this.debug(d[0].toString()), "success";
    } catch (d) {
      this.debug(`Error at sync ${d}`), l = d instanceof Error ? d.message : typeof d == "string" ? d : JSON.stringify(d);
    }
    return o && (l = `Wrong boot mode detected (${a}).
        This chip needs to be in download mode.`, n && (l = `Download mode successfully detected, but getting no sync reply:
           The serial TX path seems to be down.`)), l;
  }
  constructResetSequence(t) {
    if (t !== "no_reset") {
      if (t === "usb_reset" || this.transport.getPid() === this.USB_JTAG_SERIAL_PID) {
        if (this.resetConstructors.usbJTAGSerialReset) return this.debug("using USB JTAG Serial Reset"), [this.resetConstructors.usbJTAGSerialReset(this.transport)];
      } else if (this.resetConstructors.classicReset) return this.debug("using Classic Serial Reset"), [this.resetConstructors.classicReset(this.transport, 50), this.resetConstructors.classicReset(this.transport, 550)];
    }
    return [];
  }
  async connect(t = "default_reset", e = 7, i = !0) {
    let r;
    this.info("Connecting...", !1), await this.transport.connect(this.romBaudrate, this.serialOptions), this.transport.readLoop();
    const o = this.constructResetSequence(t);
    for (let a = 0; a < e; a++) {
      const n = o.length > 0 ? o[a % o.length] : null;
      if (r = await this._connectAttempt(t, n), r === "success") break;
    }
    if (r !== "success") throw new Q("Failed to connect with the device");
    if (this.debug("Connect attempt successful."), this.info(`
\r`, !1), i) {
      const a = await this.readReg(this.CHIP_DETECT_MAGIC_REG_ADDR) >>> 0;
      this.debug("Chip Magic " + a.toString(16));
      const n = await (async function(l) {
        switch (l) {
          case 15736195: {
            const { ESP32ROM: c } = await Promise.resolve().then(() => ng);
            return new c();
          }
          case 203546735:
          case 1867591791:
          case 2084675695: {
            const { ESP32C2ROM: c } = await Promise.resolve().then(() => dg);
            return new c();
          }
          case 1763790959:
          case 456216687:
          case 1216438383:
          case 1130455151: {
            const { ESP32C3ROM: c } = await Promise.resolve().then(() => lg);
            return new c();
          }
          case 752910447: {
            const { ESP32C6ROM: c } = await Promise.resolve().then(() => hg);
            return new c();
          }
          case 606167151:
          case 871374959:
          case 1333878895: {
            const { ESP32C61ROM: c } = await Promise.resolve().then(() => pg);
            return new c();
          }
          case 285294703:
          case 1675706479:
          case 1607549039: {
            const { ESP32C5ROM: c } = await Promise.resolve().then(() => ug);
            return new c();
          }
          case 3619110528:
          case 2548236392: {
            const { ESP32H2ROM: c } = await Promise.resolve().then(() => mg);
            return new c();
          }
          case 9: {
            const { ESP32S3ROM: c } = await Promise.resolve().then(() => _g);
            return new c();
          }
          case 1990: {
            const { ESP32S2ROM: c } = await Promise.resolve().then(() => wg);
            return new c();
          }
          case 4293968129: {
            const { ESP8266ROM: c } = await Promise.resolve().then((function() {
              return EA;
            }));
            return new c();
          }
          case 0:
          case 182303440:
          case 117676761: {
            const { ESP32P4ROM: c } = await Promise.resolve().then(() => yg);
            return new c();
          }
          default:
            return null;
        }
      })(a);
      if (typeof this.chip === null) throw new Q(`Unexpected CHIP magic value ${a}. Failed to autodetect chip type.`);
      this.chip = n;
    }
  }
  async detectChip(t = "default_reset") {
    await this.connect(t), this.info("Detecting chip type... ", !1), this.chip != null ? this.info(this.chip.CHIP_NAME) : this.info("unknown!");
  }
  async checkCommand(t = "", e = null, i = new Uint8Array(0), r = 0, o = 0, a = this.DEFAULT_TIMEOUT) {
    this.debug("check_command " + t);
    const n = await this.command(e, i, r, void 0, a);
    if (n && n[1] && n[1].length < o + 2) {
      const c = n[1].slice(0, 2);
      throw c[0] !== 0 ? new Q(`Failed to ${t} failed with status ${c}`) : new Q(`Failed to ${t}.
 Only got ${n[1].length} bytes of data.`);
    }
    const l = n[1].slice(o, o + 2);
    if (l[0] !== 0) throw new Q(`Failed to ${t} failed with status ${l}`);
    return o > 0 ? n[1].slice(0, o) : n[0];
  }
  async memBegin(t, e, i, r) {
    if (this.IS_STUB) {
      const a = r, n = r + t, l = this.chip.getChipRevision ? await this.chip.getChipRevision(this) : void 0, c = await Xo(this.chip.CHIP_NAME, l);
      if (c) {
        const d = [[c.bss_start || c.data_start, c.data_start + c.decodedData.length], [c.text_start, c.text_start + c.decodedText.length]];
        for (const [h, g] of d) if (a < g && n > h) throw new Q(`Software loader is resident at 0x${h.toString(16).padStart(8, "0")}-0x${g.toString(16).padStart(8, "0")}.
            Can't load binary at overlapping address range 0x${a.toString(16).padStart(8, "0")}-0x${n.toString(16).padStart(8, "0")}.
            Either change binary loading address, or use the no-stub option to disable the software loader.`);
      }
    }
    this.debug("mem_begin " + t + " " + e + " " + i + " " + r.toString(16));
    let o = this._appendArray(this._intToByteArray(t), this._intToByteArray(e));
    o = this._appendArray(o, this._intToByteArray(i)), o = this._appendArray(o, this._intToByteArray(r)), await this.checkCommand("enter RAM download mode", this.ESP_MEM_BEGIN, o);
  }
  checksum(t, e = this.ESP_CHECKSUM_MAGIC) {
    for (let i = 0; i < t.length; i++) e ^= t[i];
    return e;
  }
  async memBlock(t, e) {
    let i = this._appendArray(this._intToByteArray(t.length), this._intToByteArray(e));
    i = this._appendArray(i, this._intToByteArray(0)), i = this._appendArray(i, this._intToByteArray(0)), i = this._appendArray(i, t);
    const r = this.checksum(t);
    await this.checkCommand("write to target RAM", this.ESP_MEM_DATA, i, r);
  }
  async memFinish(t) {
    const e = t === 0 ? 1 : 0, i = this._appendArray(this._intToByteArray(e), this._intToByteArray(t));
    await this.checkCommand("leave RAM download mode", this.ESP_MEM_END, i, void 0, void 0, 200);
  }
  async flashSpiAttach(t) {
    const e = this._intToByteArray(t);
    await this.checkCommand("configure SPI flash pins", this.ESP_SPI_ATTACH, e);
  }
  timeoutPerMb(t, e) {
    const i = t * (e / 1e6);
    return i < 3e3 ? 3e3 : i;
  }
  async flashBegin(t, e) {
    const i = Math.floor((t + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), r = this.chip.getEraseSize(e, t), o = /* @__PURE__ */ new Date(), a = o.getTime();
    let n = 3e3;
    this.IS_STUB == 0 && (n = this.timeoutPerMb(this.ERASE_REGION_TIMEOUT_PER_MB, t)), this.debug("flash begin " + r + " " + i + " " + this.FLASH_WRITE_SIZE + " " + e + " " + t);
    let l = this._appendArray(this._intToByteArray(r), this._intToByteArray(i));
    l = this._appendArray(l, this._intToByteArray(this.FLASH_WRITE_SIZE)), l = this._appendArray(l, this._intToByteArray(e)), this.IS_STUB == 0 && (l = this._appendArray(l, this._intToByteArray(0))), await this.checkCommand("enter Flash download mode", this.ESP_FLASH_BEGIN, l, void 0, void 0, n);
    const c = o.getTime();
    return t != 0 && this.IS_STUB == 0 && this.info("Took " + (c - a) / 1e3 + "." + (c - a) % 1e3 + "s to erase flash block"), i;
  }
  async flashDeflBegin(t, e, i) {
    const r = Math.floor((e + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), o = Math.floor((t + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), a = /* @__PURE__ */ new Date(), n = a.getTime();
    let l, c;
    this.IS_STUB ? (l = t, c = this.DEFAULT_TIMEOUT) : (l = o * this.FLASH_WRITE_SIZE, c = this.timeoutPerMb(this.ERASE_REGION_TIMEOUT_PER_MB, l)), this.info("Compressed " + t + " bytes to " + e + "...");
    let d = this._appendArray(this._intToByteArray(l), this._intToByteArray(r));
    d = this._appendArray(d, this._intToByteArray(this.FLASH_WRITE_SIZE)), d = this._appendArray(d, this._intToByteArray(i)), this.chip.CHIP_NAME !== "ESP32-S2" && this.chip.CHIP_NAME !== "ESP32-S3" && this.chip.CHIP_NAME !== "ESP32-C3" && this.chip.CHIP_NAME !== "ESP32-C2" || this.IS_STUB !== !1 || (d = this._appendArray(d, this._intToByteArray(0))), await this.checkCommand("enter compressed flash mode", this.ESP_FLASH_DEFL_BEGIN, d, void 0, void 0, c);
    const h = a.getTime();
    return t != 0 && this.IS_STUB === !1 && this.info("Took " + (h - n) / 1e3 + "." + (h - n) % 1e3 + "s to erase flash block"), r;
  }
  async flashBlock(t, e, i) {
    let r = this._appendArray(this._intToByteArray(t.length), this._intToByteArray(e));
    r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, t);
    const o = this.checksum(t);
    await this.checkCommand("write to target Flash after seq " + e, this.ESP_FLASH_DATA, r, o, void 0, i);
  }
  async flashDeflBlock(t, e, i) {
    let r = this._appendArray(this._intToByteArray(t.length), this._intToByteArray(e));
    r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, t);
    const o = this.checksum(t);
    this.debug("flash_defl_block " + t[0].toString(16) + " " + t[1].toString(16)), await this.checkCommand("write compressed data to flash after seq " + e, this.ESP_FLASH_DEFL_DATA, r, o, void 0, i);
  }
  async flashFinish(t = !1, e = this.DEFAULT_TIMEOUT) {
    const i = t ? 0 : 1, r = this._intToByteArray(i);
    await this.checkCommand("leave Flash mode", this.ESP_FLASH_END, r, void 0, void 0, e);
  }
  async flashDeflFinish(t = !1, e = this.DEFAULT_TIMEOUT) {
    const i = t ? 0 : 1, r = this._intToByteArray(i);
    await this.checkCommand("leave compressed flash mode", this.ESP_FLASH_DEFL_END, r, void 0, void 0, e);
  }
  async runSpiflashCommand(t, e, i, r = null, o = 0, a = 0) {
    const n = this.chip.SPI_REG_BASE, l = n + 0, c = n + 4, d = n + this.chip.SPI_USR_OFFS, h = n + this.chip.SPI_USR1_OFFS, g = n + this.chip.SPI_USR2_OFFS, A = n + this.chip.SPI_W0_OFFS;
    let _;
    _ = this.chip.SPI_MOSI_DLEN_OFFS != null ? async (R, x) => {
      const S = n + this.chip.SPI_MOSI_DLEN_OFFS, P = n + this.chip.SPI_MISO_DLEN_OFFS;
      R > 0 && await this.writeReg(S, R - 1), x > 0 && await this.writeReg(P, x - 1);
      let nt = 0;
      a > 0 && (nt |= a - 1), o > 0 && (nt |= o - 1 << f), nt && await this.writeReg(h, nt);
    } : async (R, x) => {
      const S = h;
      let P = (x === 0 ? 0 : x - 1) << 8 | (R === 0 ? 0 : R - 1) << 17;
      a > 0 && (P |= a - 1), o > 0 && (P |= o - 1 << f), await this.writeReg(S, P);
    };
    const m = 1 << 18, f = 26;
    if (i > 32) throw new Q("Reading more than 32 bits back from a SPI flash operation is unsupported");
    if (e.length > 64) throw new Q("Writing more than 64 bytes of data with one SPI command is unsupported");
    const b = 8 * e.length, E = await this.readReg(d), u = await this.readReg(g);
    let I = 1 << 31;
    i > 0 && (I |= 268435456), b > 0 && (I |= 134217728), o > 0 && (I |= 1073741824), a > 0 && (I |= 536870912), await _(b, i), await this.writeReg(d, I);
    let D, w = 7 << 28 | t;
    if (await this.writeReg(g, w), r && o > 0 && (this.SPI_ADDR_REG_MSB && (r <<= 32 - o), await this.writeReg(c, r)), b == 0) await this.writeReg(A, 0);
    else {
      e = er(e, 4, 0);
      const R = [];
      for (let S = 0; S < e.length; S += 4) R.push((e[S] | e[S + 1] << 8 | e[S + 2] << 16 | e[S + 3] << 24) >>> 0);
      let x = A;
      for (const S of R) await this.writeReg(x, S), x += 4;
    }
    for (await this.writeReg(l, m), D = 0; D < 10 && (w = await this.readReg(l) & m, w != 0); D++) ;
    if (D === 10) throw new Q("SPI command did not complete in time");
    const M = await this.readReg(A);
    return await this.writeReg(d, E), await this.writeReg(g, u), M;
  }
  async readFlashId() {
    const t = new Uint8Array(0);
    return await this.runSpiflashCommand(159, t, 24);
  }
  async eraseFlash() {
    this.info("Erasing flash (this may take a while)...");
    let t = /* @__PURE__ */ new Date();
    const e = t.getTime(), i = await this.checkCommand("erase flash", this.ESP_ERASE_FLASH, void 0, void 0, void 0, this.CHIP_ERASE_TIMEOUT);
    t = /* @__PURE__ */ new Date();
    const r = t.getTime();
    return this.info("Chip erase completed successfully in " + (r - e) / 1e3 + "s"), i;
  }
  toHex(t) {
    return Array.prototype.map.call(t, ((e) => ("00" + e.toString(16)).slice(-2))).join("");
  }
  async flashMd5sum(t, e) {
    const i = this.timeoutPerMb(this.MD5_TIMEOUT_PER_MB, e);
    let r = this._appendArray(this._intToByteArray(t), this._intToByteArray(e));
    r = this._appendArray(r, this._intToByteArray(0)), r = this._appendArray(r, this._intToByteArray(0));
    const o = this.IS_STUB ? 16 : 32, a = await this.checkCommand("calculate md5sum", this.ESP_SPI_FLASH_MD5, r, void 0, o, i);
    return this.toHex(a);
  }
  async readFlash(t, e, i = null) {
    let r = this._appendArray(this._intToByteArray(t), this._intToByteArray(e));
    r = this._appendArray(r, this._intToByteArray(4096)), r = this._appendArray(r, this._intToByteArray(1024));
    const o = await this.checkCommand("read flash", this.ESP_READ_FLASH, r);
    if (o != 0) throw new Q("Failed to read memory: " + o);
    let a = new Uint8Array(0);
    for (; a.length < e; ) {
      const n = await this.transport.read(this.FLASH_READ_TIMEOUT);
      if (!(n instanceof Uint8Array)) throw new Q("Failed to read memory: " + n);
      n.length > 0 && (a = this._appendArray(a, n), await this.transport.write(this._intToByteArray(a.length)), i && i(n, a.length, e));
    }
    return a;
  }
  async runStub() {
    if (this.syncStubDetected) return this.info("Stub is already running. No upload is necessary."), this.chip;
    this.info("Uploading stub...");
    const t = this.chip.getChipRevision ? await this.chip.getChipRevision(this) : void 0, e = await Xo(this.chip.CHIP_NAME, t);
    if (e === void 0) throw this.debug("Error loading Stub json"), new Error("Error loading Stub json");
    const i = [e.decodedText, e.decodedData];
    for (let a = 0; a < i.length; a++) if (i[a]) {
      const n = a === 0 ? e.text_start : e.data_start, l = i[a].length, c = Math.floor((l + this.ESP_RAM_BLOCK - 1) / this.ESP_RAM_BLOCK);
      await this.memBegin(l, c, this.ESP_RAM_BLOCK, n);
      for (let d = 0; d < c; d++) {
        const h = d * this.ESP_RAM_BLOCK, g = h + this.ESP_RAM_BLOCK;
        await this.memBlock(i[a].slice(h, g), d);
      }
    }
    this.info("Running stub..."), await this.memFinish(e.entry);
    const r = await this.transport.read(this.DEFAULT_TIMEOUT), o = String.fromCharCode(...r);
    if (o !== "OHAI") throw new Q(`Failed to start stub. Unexpected response ${o}`);
    return this.info("Stub running..."), this.IS_STUB = !0, this.chip;
  }
  async changeBaud() {
    this.info("Changing baudrate to " + this.baudrate);
    const t = this.IS_STUB ? this.romBaudrate : 0, e = this._appendArray(this._intToByteArray(this.baudrate), this._intToByteArray(t));
    await this.command(this.ESP_CHANGE_BAUDRATE, e), this.info("Changed"), this.info("If the chip does not respond to any further commands, consider using a lower baud rate."), await Ve(50), await this.transport.disconnect(), await Ve(50), await this.transport.connect(this.baudrate, this.serialOptions), await Ve(50), this.transport.readLoop();
  }
  async main(t = "default_reset") {
    await this.detectChip(t);
    const e = await this.chip.getChipDescription(this);
    if (this.chip.getChipRevision) {
      const i = await this.chip.getChipRevision(this);
      this.info("Chip Revision: " + i);
    }
    this.info("Chip is " + e), this.info("Features: " + await this.chip.getChipFeatures(this)), this.info("Crystal is " + await this.chip.getCrystalFreq(this) + "MHz"), this.info("MAC: " + await this.chip.readMac(this)), await this.chip.readMac(this), this.chip.postConnect !== void 0 && await this.chip.postConnect(this), await this.runStub(), this.romBaudrate !== this.baudrate && await this.changeBaud();
    try {
      const i = await this.readFlashId();
      this.info("Flash ID: " + i.toString(16)), i !== 16777215 && i !== 0 || this.info(`WARNING: Failed to communicate with the flash chip,
read/write operations will fail.
Try checking the chip connections or removing
any other hardware connected to IOs.`);
    } catch (i) {
      throw new Q("Unable to verify flash chip connection " + i);
    }
    return e;
  }
  flashSizeBytes(t) {
    let e = -1;
    return this.transport.trace(`Flash size string ${t}`), t.toString().indexOf("KB") !== -1 ? e = 1024 * parseInt(t.toString().slice(0, t.toString().indexOf("KB"))) : t.toString().indexOf("MB") !== -1 && (e = 1024 * parseInt(t.toString().slice(0, t.toString().indexOf("MB"))) * 1024), this.transport.trace(`Flash size in bytes ${e}`), e;
  }
  parseFlashSizeArg(t) {
    if (this.chip.FLASH_SIZES[t] === void 0) throw new Q("Flash size " + t + " is not supported by this chip type. Supported sizes: " + this.chip.FLASH_SIZES);
    return this.chip.FLASH_SIZES[t];
  }
  async _updateImageFlashParams(t, e, i = "keep", r = "keep", o = "keep") {
    if (this.debug(`_update_image_flash_params ${o} ${i} ${r}`), t.length < 8 || e != this.chip.BOOTLOADER_FLASH_OFFSET) return t;
    if (o === "keep" && i === "keep" && r === "keep") return this.info("Not changing the image"), t;
    const a = t[0];
    let n = t[2];
    const l = t[3];
    if (a !== this.ESP_IMAGE_MAGIC) return this.info("Warning: Image file at 0x" + e.toString(16) + " doesn't look like an image file, so not changing any flash settings."), t;
    try {
      (await ia(this.chip, t)).verify();
    } catch {
      return this.debug(`Warning: Image file at 0x${e.toString(16)} is not a valid ${this.chip.CHIP_NAME} image, so not changing any flash settings.`), t;
    }
    const c = this.chip.CHIP_NAME !== "ESP8266" && t[23] === 49;
    i !== "keep" && (n = { qio: 0, qout: 1, dio: 2, dout: 3 }[i]);
    let d = 15 & l;
    r !== "keep" && (d = { "40m": 0, "26m": 1, "20m": 2, "80m": 15 }[r]);
    let h = 240 & l;
    if (o !== "keep") if (o === "detect") {
      this.info("Configuring flash size...");
      const _ = await this.detectFlashSize();
      this.info("Detected flash size set to " + _), h = this.parseFlashSizeArg(_);
    } else h = this.parseFlashSizeArg(o);
    const g = n << 8 | d + h;
    this.info("Flash params set to " + g.toString(16));
    const A = new Uint8Array(t);
    if (t[2] !== n && (A[2] = n), t[3] !== d + h && (A[3] = d + h), c) {
      const _ = await ia(this.chip, A), m = A.slice(0, _.datalength), f = A.slice(_.datalength + _.SHA256_DIGEST_LEN), b = await crypto.subtle.digest("SHA-256", f), E = new Uint8Array(b), u = new Uint8Array(m.length + E.length + f.length);
      u.set(m, 0), u.set(E, m.length), u.set(f, m.length + E.length);
      const I = u.slice(_.datalength, _.datalength + _.SHA256_DIGEST_LEN);
      return this.transport.hexify(E) === this.transport.hexify(I) ? this.info("SHA digest in image updated") : this.info(`WARNING: SHA recalculation for binary failed!
	Expected calculated SHA: ${this.transport.hexify(E)}
	SHA stored in binary:    ${this.transport.hexify(I)}`), u;
    }
    return A;
  }
  async writeFlash(t) {
    if (this.debug("EspLoader program"), t.flashSize !== "keep") {
      const r = this.flashSizeBytes(t.flashSize);
      for (let o = 0; o < t.fileArray.length; o++) if (t.fileArray[o].data.length + t.fileArray[o].address > r) throw new Q(`File ${o + 1} doesn't fit in the available flash`);
    }
    let e, i;
    this.IS_STUB === !0 && t.eraseAll === !0 && await this.eraseFlash();
    for (let r = 0; r < t.fileArray.length; r++) {
      if (this.debug("Data Length " + t.fileArray[r].data.length), e = t.fileArray[r].data, this.debug("Image Length " + e.length), e.length === 0) {
        this.debug("Warning: File is empty");
        continue;
      }
      e = er(e, 4), i = t.fileArray[r].address, e = await this._updateImageFlashParams(e, i, t.flashMode, t.flashFreq, t.flashSize);
      let o = null;
      t.calculateMD5Hash && (o = t.calculateMD5Hash(e), this.debug("Image MD5 " + o));
      const a = e.length;
      let n;
      t.compress ? (e = pA(e, { level: 9 }), n = await this.flashDeflBegin(a, e.length, i)) : n = await this.flashBegin(a, i);
      let l = 0, c = 0;
      const d = e.length;
      t.reportProgress && t.reportProgress(r, 0, d);
      let h = /* @__PURE__ */ new Date();
      const g = h.getTime();
      let A = 5e3;
      const _ = new gA({ chunkSize: 1 });
      let m = 0;
      _.onData = function(E) {
        m += E.byteLength;
      };
      let f = 0;
      for (; f < e.length; ) {
        this.debug("Write loop " + i + " " + l + " " + n), this.info("Writing at 0x" + (i + m).toString(16) + "... (" + Math.floor(100 * (l + 1) / n) + "%)");
        const E = Math.min(this.FLASH_WRITE_SIZE, e.length - f), u = e.slice(f, f + E), I = f + E >= e.length;
        if (!t.compress) throw new Q("Yet to handle Non Compressed writes");
        {
          const D = m;
          _.push(u, I);
          const w = m - D;
          let M = 3e3;
          this.timeoutPerMb(this.ERASE_WRITE_TIMEOUT_PER_MB, w) > 3e3 && (M = this.timeoutPerMb(this.ERASE_WRITE_TIMEOUT_PER_MB, w)), this.IS_STUB === !1 && (A = M), await this.flashDeflBlock(u, l, A), this.IS_STUB && (A = M);
        }
        c += u.length, f += E, l++, t.reportProgress && t.reportProgress(r, c, d);
      }
      this.IS_STUB && (t.compress ? await this.flashDeflFinish(!1, A) : await this.flashFinish(!1, A)), h = /* @__PURE__ */ new Date();
      const b = h.getTime() - g;
      if (t.compress && this.info("Wrote " + a + " bytes (" + c + " compressed) at 0x" + i.toString(16) + " in " + b / 1e3 + " seconds."), o) {
        this.info("File  md5: " + o);
        const E = await this.flashMd5sum(i, a);
        if (this.info("Flash md5: " + E), new String(E).valueOf() != new String(o).valueOf()) throw new Q("MD5 of file does not match data in flash!");
        this.info("Hash of data verified.");
      }
    }
    this.info("Leaving...");
  }
  async flashId() {
    this.debug("flash_id");
    const t = await this.readFlashId();
    this.info("Manufacturer: " + (255 & t).toString(16));
    const e = t >> 16 & 255;
    this.info("Device: " + (t >> 8 & 255).toString(16) + e.toString(16)), this.info("Detected flash size: " + this.DETECTED_FLASH_SIZES[e]);
  }
  async detectFlashSize() {
    this.debug("detectFlashSize");
    const t = await this.readFlashId() >> 16 & 255;
    let e = this.DETECTED_FLASH_SIZES[t];
    return e ? this.info("Auto-detected Flash size: " + e) : (e = "4MB", this.info("Could not auto-detect Flash size. defaulting to 4MB")), e;
  }
  async softReset(t) {
    if (this.IS_STUB) {
      if (this.chip.CHIP_NAME != "ESP8266") throw new Q("Soft resetting is currently only supported on ESP8266");
      t ? (await this.flashBegin(0, 0), await this.flashFinish(!0)) : await this.command(this.ESP_RUN_USER_CODE, void 0, void 0, !1);
    } else {
      if (t) return;
      await this.flashBegin(0, 0), await this.flashFinish(!1);
    }
  }
  async after(t = "hard_reset", e, i) {
    switch (t) {
      case "hard_reset":
        this.resetConstructors.hardReset && (this.info("Hard resetting via RTS pin..."), await this.resetConstructors.hardReset(this.transport, e).reset());
        break;
      case "soft_reset":
        this.info("Soft resetting..."), await this.softReset(!1);
        break;
      case "no_reset_stub":
        this.info("Staying in flasher stub.");
        break;
      case "custom_reset":
        i || this.info("Custom reset sequence not provided, doing nothing."), this.resetConstructors.customReset || this.info("Custom reset constructor not available, doing nothing."), this.resetConstructors.customReset && i && (this.info("Custom resetting using sequence " + i), await this.resetConstructors.customReset(this.transport, i).reset());
        break;
      default:
        this.info("Staying in bootloader."), this.IS_STUB && this.softReset(!0);
    }
  }
}
class MA extends HTMLElement {
  constructor() {
    super(...arguments), this.allowInput = !0;
  }
  logs() {
    var t;
    return ((t = this._console) === null || t === void 0 ? void 0 : t.logs()) || "";
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
    `, this._console = new ph(this.shadowRoot.querySelector("div")), this.allowInput) {
      const i = this.shadowRoot.querySelector("input");
      this.addEventListener("click", (() => {
        var r;
        ((r = getSelection()) === null || r === void 0 ? void 0 : r.toString()) === "" && i.focus();
      })), i.addEventListener("keydown", ((r) => {
        r.key === "Enter" && (r.preventDefault(), r.stopPropagation(), this._sendCommand());
      }));
    }
    const t = new AbortController(), e = this._connect(t.signal);
    this._cancelConnection = () => (t.abort(), e);
  }
  async _connect(t) {
    this.logger.debug("Starting console read loop");
    try {
      await this.port.readable.pipeThrough(new TextDecoderStream(), { signal: t }).pipeThrough(new TransformStream(new gh())).pipeThrough(new TransformStream(new uh())).pipeTo(new WritableStream({ write: (e) => {
        this._console.addLine(e.replace("\r", ""));
      } })), t.aborted || (this._console.addLine(""), this._console.addLine(""), this._console.addLine("Terminal disconnected"));
    } catch (e) {
      this._console.addLine(""), this._console.addLine(""), this._console.addLine(`Terminal disconnected: ${e}`);
    } finally {
      await me(100), this.logger.debug("Finished console read loop");
    }
  }
  async _sendCommand() {
    const t = this.shadowRoot.querySelector("input"), e = t.value, i = new TextEncoder(), r = this.port.writable.getWriter();
    await r.write(i.encode(e + `\r
`)), this._console.addLine(`> ${e}\r
`), t.value = "", t.focus();
    try {
      r.releaseLock();
    } catch (o) {
      console.error("Ignoring release lock error", o);
    }
  }
  async disconnect() {
    this._cancelConnection && (await this._cancelConnection(), this._cancelConnection = void 0);
  }
  async reset() {
    this.logger.debug("Triggering reset");
    const t = new Mr(this.port);
    await t.setRTS(!0), await me(100), await new Pn(t).reset();
  }
}
function sa(s, t = !0) {
  return t && getComputedStyle(s).getPropertyValue("direction").trim() === "rtl";
}
customElements.define("ewt-console", MA);
const TA = Ot(hi(G));
class tt extends TA {
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(t) {
    this.setAttribute("name", t);
  }
  get form() {
    return this[st].form;
  }
  get labels() {
    return this[st].labels;
  }
  constructor() {
    super(), this.disabled = !1, this.softDisabled = !1, this.flipIconInRtl = !1, this.href = "", this.download = "", this.target = "", this.ariaLabelSelected = "", this.toggle = !1, this.selected = !1, this.type = "submit", this.value = "", this.flipIcon = sa(this, this.flipIconInRtl), this.addEventListener("click", this.handleClick.bind(this));
  }
  willUpdate() {
    this.href && (this.disabled = !1, this.softDisabled = !1);
  }
  render() {
    const t = this.href ? Yt`div` : Yt`button`, { ariaLabel: e, ariaHasPopup: i, ariaExpanded: r } = this, o = e && this.ariaLabelSelected, a = this.toggle ? this.selected : C;
    let n = C;
    return this.href || (n = o && this.selected ? this.ariaLabelSelected : e), es`<${t}
        class="icon-button ${At(this.getRenderClasses())}"
        id="button"
        aria-label="${n || C}"
        aria-haspopup="${!this.href && i || C}"
        aria-expanded="${!this.href && r || C}"
        aria-pressed="${a}"
        aria-disabled=${!this.href && this.softDisabled || C}
        ?disabled="${!this.href && this.disabled}"
        @click="${this.handleClickOnChild}">
        ${this.renderFocusRing()}
        ${this.renderRipple()}
        ${this.selected ? C : this.renderIcon()}
        ${this.selected ? this.renderSelectedIcon() : C}
        ${this.href ? this.renderLink() : this.renderTouchTarget()}
  </${t}>`;
  }
  renderLink() {
    const { ariaLabel: t } = this;
    return y`
      <a
        class="link"
        id="link"
        href="${this.href}"
        download="${this.download || C}"
        target="${this.target || C}"
        aria-label="${t || C}">
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
    const t = !this.href && (this.disabled || this.softDisabled);
    return y`<md-ripple
      for=${this.href ? "link" : C}
      ?disabled="${t}"></md-ripple>`;
  }
  connectedCallback() {
    this.flipIcon = sa(this, this.flipIconInRtl), super.connectedCallback();
  }
  handleClick(t) {
    if (!this.href && this.softDisabled) return t.stopImmediatePropagation(), void t.preventDefault();
  }
  async handleClickOnChild(t) {
    await 0, !this.toggle || this.disabled || this.softDisabled || t.defaultPrevented || (this.selected = !this.selected, this.dispatchEvent(new InputEvent("input", { bubbles: !0, composed: !0 })), this.dispatchEvent(new Event("change", { bubbles: !0 })));
  }
}
rn(tt), tt.formAssociated = !0, tt.shadowRootOptions = { mode: "open", delegatesFocus: !0 }, p([v({ type: Boolean, reflect: !0 })], tt.prototype, "disabled", void 0), p([v({ type: Boolean, attribute: "soft-disabled", reflect: !0 })], tt.prototype, "softDisabled", void 0), p([v({ type: Boolean, attribute: "flip-icon-in-rtl" })], tt.prototype, "flipIconInRtl", void 0), p([v()], tt.prototype, "href", void 0), p([v()], tt.prototype, "download", void 0), p([v()], tt.prototype, "target", void 0), p([v({ attribute: "aria-label-selected" })], tt.prototype, "ariaLabelSelected", void 0), p([v({ type: Boolean })], tt.prototype, "toggle", void 0), p([v({ type: Boolean, reflect: !0 })], tt.prototype, "selected", void 0), p([v()], tt.prototype, "type", void 0), p([v({ reflect: !0 })], tt.prototype, "value", void 0), p([F()], tt.prototype, "flipIcon", void 0);
const kA = L`:host{display:inline-flex;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);height:var(--_container-height);width:var(--_container-width);justify-content:center}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) max(0px,(48px - var(--_container-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){pointer-events:none}.icon-button{place-items:center;background:none;border:none;box-sizing:border-box;cursor:pointer;display:flex;place-content:center;outline:none;padding:0;position:relative;text-decoration:none;user-select:none;z-index:0;flex:1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.icon ::slotted(*){font-size:var(--_icon-size);height:var(--_icon-size);width:var(--_icon-size);font-weight:inherit}md-ripple{z-index:-1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.flip-icon .icon{transform:scaleX(-1)}.icon{display:inline-flex}.link{display:grid;height:100%;outline:none;place-items:center;position:absolute;width:100%}.touch{position:absolute;height:max(48px,100%);width:max(48px,100%)}:host([touch-target=none]) .touch{display:none}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1}}
`, FA = L`:host{--_disabled-icon-color: var(--md-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-icon-button-disabled-icon-opacity, 0.38);--_icon-size: var(--md-icon-button-icon-size, 24px);--_selected-focus-icon-color: var(--md-icon-button-selected-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-icon-color: var(--md-icon-button-selected-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-color: var(--md-icon-button-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-opacity: var(--md-icon-button-selected-hover-state-layer-opacity, 0.08);--_selected-icon-color: var(--md-icon-button-selected-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-icon-color: var(--md-icon-button-selected-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-color: var(--md-icon-button-selected-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-opacity: var(--md-icon-button-selected-pressed-state-layer-opacity, 0.12);--_state-layer-height: var(--md-icon-button-state-layer-height, 40px);--_state-layer-shape: var(--md-icon-button-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));--_state-layer-width: var(--md-icon-button-state-layer-width, 40px);--_focus-icon-color: var(--md-icon-button-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-icon-color: var(--md-icon-button-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-icon-button-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-icon-button-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-icon-button-pressed-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-icon-button-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-icon-button-pressed-state-layer-opacity, 0.12);--_container-shape-start-start: 0;--_container-shape-start-end: 0;--_container-shape-end-end: 0;--_container-shape-end-start: 0;--_container-height: 0;--_container-width: 0;height:var(--_state-layer-height);width:var(--_state-layer-width)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_state-layer-height))/2) max(0px,(48px - var(--_state-layer-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_state-layer-shape);--md-focus-ring-shape-start-end: var(--_state-layer-shape);--md-focus-ring-shape-end-end: var(--_state-layer-shape);--md-focus-ring-shape-end-start: var(--_state-layer-shape)}.standard{background-color:rgba(0,0,0,0);color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.standard:hover{color:var(--_hover-icon-color)}.standard:focus{color:var(--_focus-icon-color)}.standard:active{color:var(--_pressed-icon-color)}.standard:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}md-ripple{border-radius:var(--_state-layer-shape)}.standard:is(:disabled,[aria-disabled=true]){opacity:var(--_disabled-icon-opacity)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_selected-pressed-icon-color)}.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_selected-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_selected-pressed-state-layer-opacity)}
`;
class ra extends tt {
}
ra.styles = [kA, FA], customElements.define("ew-icon-button", ra);
const OA = L`:host{--_active-indicator-color: var(--md-filled-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-text-field-active-indicator-height, 1px);--_caret-color: var(--md-filled-text-field-caret-color, var(--md-sys-color-primary, #6750a4));--_container-color: var(--md-filled-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_disabled-active-indicator-color: var(--md-filled-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-text-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-text-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-text-field-disabled-container-opacity, 0.04);--_disabled-input-text-color: var(--md-filled-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-input-text-opacity: var(--md-filled-text-field-disabled-input-text-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-text-field-disabled-label-text-opacity, 0.38);--_disabled-leading-icon-color: var(--md-filled-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-filled-text-field-disabled-leading-icon-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-text-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-icon-color: var(--md-filled-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-filled-text-field-disabled-trailing-icon-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-active-indicator-color: var(--md-filled-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-caret-color: var(--md-filled-text-field-error-focus-caret-color, var(--md-sys-color-error, #b3261e));--_error-focus-input-text-color: var(--md-filled-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-filled-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-icon-color: var(--md-filled-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-icon-color: var(--md-filled-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-input-text-color: var(--md-filled-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-icon-color: var(--md-filled-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-text-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-icon-color: var(--md-filled-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_error-input-text-color: var(--md-filled-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-label-text-color: var(--md-filled-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-icon-color: var(--md-filled-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-icon-color: var(--md-filled-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-text-field-focus-active-indicator-height, 3px);--_focus-input-text-color: var(--md-filled-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-filled-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-icon-color: var(--md-filled-text-field-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-text-field-hover-active-indicator-height, 1px);--_hover-input-text-color: var(--md-filled-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-text-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-icon-color: var(--md-filled-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-text-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-filled-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-color: var(--md-filled-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_input-text-font: var(--md-filled-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_input-text-line-height: var(--md-filled-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_input-text-placeholder-color: var(--md-filled-text-field-input-text-placeholder-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-prefix-color: var(--md-filled-text-field-input-text-prefix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-size: var(--md-filled-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_input-text-suffix-color: var(--md-filled-text-field-input-text-suffix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-weight: var(--md-filled-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_label-text-color: var(--md-filled-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-icon-color: var(--md-filled-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-icon-size: var(--md-filled-text-field-leading-icon-size, 24px);--_supporting-text-color: var(--md-filled-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-line-height: var(--md-filled-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-weight: var(--md-filled-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_trailing-icon-color: var(--md-filled-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-size: var(--md-filled-text-field-trailing-icon-size, 24px);--_container-shape-start-start: var(--md-filled-text-field-container-shape-start-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-text-field-container-shape-start-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-text-field-container-shape-end-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-text-field-container-shape-end-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_icon-input-space: var(--md-filled-text-field-icon-input-space, 16px);--_leading-space: var(--md-filled-text-field-leading-space, 16px);--_trailing-space: var(--md-filled-text-field-trailing-space, 16px);--_top-space: var(--md-filled-text-field-top-space, 16px);--_bottom-space: var(--md-filled-text-field-bottom-space, 16px);--_input-text-prefix-trailing-space: var(--md-filled-text-field-input-text-prefix-trailing-space, 2px);--_input-text-suffix-leading-space: var(--md-filled-text-field-input-text-suffix-leading-space, 2px);--_with-label-top-space: var(--md-filled-text-field-with-label-top-space, 8px);--_with-label-bottom-space: var(--md-filled-text-field-with-label-bottom-space, 8px);--_focus-caret-color: var(--md-filled-text-field-focus-caret-color, var(--md-sys-color-primary, #6750a4));--_with-leading-icon-leading-space: var(--md-filled-text-field-with-leading-icon-leading-space, 12px);--_with-trailing-icon-trailing-space: var(--md-filled-text-field-with-trailing-icon-trailing-space, 12px);--md-filled-field-active-indicator-color: var(--_active-indicator-color);--md-filled-field-active-indicator-height: var(--_active-indicator-height);--md-filled-field-bottom-space: var(--_bottom-space);--md-filled-field-container-color: var(--_container-color);--md-filled-field-container-shape-end-end: var(--_container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_container-shape-start-start);--md-filled-field-content-color: var(--_input-text-color);--md-filled-field-content-font: var(--_input-text-font);--md-filled-field-content-line-height: var(--_input-text-line-height);--md-filled-field-content-size: var(--_input-text-size);--md-filled-field-content-space: var(--_icon-input-space);--md-filled-field-content-weight: var(--_input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_error-active-indicator-color);--md-filled-field-error-content-color: var(--_error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_error-label-text-color);--md-filled-field-error-leading-content-color: var(--_error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_label-text-color);--md-filled-field-label-text-font: var(--_label-text-font);--md-filled-field-label-text-line-height: var(--_label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_label-text-populated-size);--md-filled-field-label-text-size: var(--_label-text-size);--md-filled-field-label-text-weight: var(--_label-text-weight);--md-filled-field-leading-content-color: var(--_leading-icon-color);--md-filled-field-leading-space: var(--_leading-space);--md-filled-field-supporting-text-color: var(--_supporting-text-color);--md-filled-field-supporting-text-font: var(--_supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_supporting-text-size);--md-filled-field-supporting-text-weight: var(--_supporting-text-weight);--md-filled-field-top-space: var(--_top-space);--md-filled-field-trailing-content-color: var(--_trailing-icon-color);--md-filled-field-trailing-space: var(--_trailing-space);--md-filled-field-with-label-bottom-space: var(--_with-label-bottom-space);--md-filled-field-with-label-top-space: var(--_with-label-top-space);--md-filled-field-with-leading-content-leading-space: var(--_with-leading-icon-leading-space);--md-filled-field-with-trailing-content-trailing-space: var(--_with-trailing-icon-trailing-space)}
`;
class J extends G {
  constructor() {
    super(...arguments), this.disabled = !1, this.error = !1, this.focused = !1, this.label = "", this.noAsterisk = !1, this.populated = !1, this.required = !1, this.resizable = !1, this.supportingText = "", this.errorText = "", this.count = -1, this.max = -1, this.hasStart = !1, this.hasEnd = !1, this.isAnimating = !1, this.refreshErrorAlert = !1, this.disableTransitions = !1;
  }
  get counterText() {
    const t = this.count ?? -1, e = this.max ?? -1;
    return t < 0 || e <= 0 ? "" : `${t} / ${e}`;
  }
  get supportingOrErrorText() {
    return this.error && this.errorText ? this.errorText : this.supportingText;
  }
  reannounceError() {
    this.refreshErrorAlert = !0;
  }
  update(t) {
    t.has("disabled") && t.get("disabled") !== void 0 && (this.disableTransitions = !0), this.disabled && this.focused && (t.set("focused", !0), this.focused = !1), this.animateLabelIfNeeded({ wasFocused: t.get("focused"), wasPopulated: t.get("populated") }), super.update(t);
  }
  render() {
    var t, e, i, r;
    const o = this.renderLabel(!0), a = this.renderLabel(!1), n = (t = this.renderOutline) === null || t === void 0 ? void 0 : t.call(this, o), l = { disabled: this.disabled, "disable-transitions": this.disableTransitions, error: this.error && !this.disabled, focused: this.focused, "with-start": this.hasStart, "with-end": this.hasEnd, populated: this.populated, resizable: this.resizable, required: this.required, "no-label": !this.label };
    return y`
      <div class="field ${At(l)}">
        <div class="container-overflow">
          ${(e = this.renderBackground) === null || e === void 0 ? void 0 : e.call(this)}
          <slot name="container"></slot>
          ${(i = this.renderStateLayer) === null || i === void 0 ? void 0 : i.call(this)} ${(r = this.renderIndicator) === null || r === void 0 ? void 0 : r.call(this)} ${n}
          <div class="container">
            <div class="start">
              <slot name="start"></slot>
            </div>
            <div class="middle">
              <div class="label-wrapper">
                ${a} ${n ? C : o}
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
  updated(t) {
    (t.has("supportingText") || t.has("errorText") || t.has("count") || t.has("max")) && this.updateSlottedAriaDescribedBy(), this.refreshErrorAlert && requestAnimationFrame((() => {
      this.refreshErrorAlert = !1;
    })), this.disableTransitions && requestAnimationFrame((() => {
      this.disableTransitions = !1;
    }));
  }
  renderSupportingText() {
    const { supportingOrErrorText: t, counterText: e } = this;
    if (!t && !e) return C;
    const i = y`<span>${t}</span>`, r = e ? y`<span class="counter">${e}</span>` : C, o = this.error && this.errorText && !this.refreshErrorAlert;
    return y`
      <div class="supporting-text" role=${o ? "alert" : C}>${i}${r}</div>
      <slot
        name="aria-describedby"
        @slotchange=${this.updateSlottedAriaDescribedBy}></slot>
    `;
  }
  updateSlottedAriaDescribedBy() {
    for (const t of this.slottedAriaDescribedBy) wr(y`${this.supportingOrErrorText} ${this.counterText}`, t), t.setAttribute("hidden", "");
  }
  renderLabel(t) {
    if (!this.label) return C;
    let e;
    e = t ? this.focused || this.populated || this.isAnimating : !this.focused && !this.populated && !this.isAnimating;
    const i = { hidden: !e, floating: t, resting: !t }, r = `${this.label}${this.required && !this.noAsterisk ? "*" : ""}`;
    return y`
      <span class="label ${At(i)}" aria-hidden=${!e}
        >${r}</span
      >
    `;
  }
  animateLabelIfNeeded({ wasFocused: t, wasPopulated: e }) {
    var i, r, o;
    this.label && (t ?? (t = this.focused), e ?? (e = this.populated), (t || e) !== (this.focused || this.populated) && (this.isAnimating = !0, (i = this.labelAnimation) === null || i === void 0 || i.cancel(), this.labelAnimation = (r = this.floatingLabelEl) === null || r === void 0 ? void 0 : r.animate(this.getLabelKeyframes(), { duration: 150, easing: Bt.STANDARD }), (o = this.labelAnimation) === null || o === void 0 || o.addEventListener("finish", (() => {
      this.isAnimating = !1;
    }))));
  }
  getLabelKeyframes() {
    const { floatingLabelEl: t, restingLabelEl: e } = this;
    if (!t || !e) return [];
    const { x: i, y: r, height: o } = t.getBoundingClientRect(), { x: a, y: n, height: l } = e.getBoundingClientRect(), c = t.scrollWidth, d = e.scrollWidth, h = d / c, g = `translateX(${a - i}px) translateY(${n - r + Math.round((l - o * h) / 2)}px) scale(${h})`, A = "translateX(0) translateY(0) scale(1)", _ = e.clientWidth, m = d > _ ? _ / h + "px" : "";
    return this.focused || this.populated ? [{ transform: g, width: m }, { transform: A, width: m }] : [{ transform: A, width: m }, { transform: g, width: m }];
  }
  getSurfacePositionClientRect() {
    return this.containerEl.getBoundingClientRect();
  }
}
p([v({ type: Boolean })], J.prototype, "disabled", void 0), p([v({ type: Boolean })], J.prototype, "error", void 0), p([v({ type: Boolean })], J.prototype, "focused", void 0), p([v()], J.prototype, "label", void 0), p([v({ type: Boolean, attribute: "no-asterisk" })], J.prototype, "noAsterisk", void 0), p([v({ type: Boolean })], J.prototype, "populated", void 0), p([v({ type: Boolean })], J.prototype, "required", void 0), p([v({ type: Boolean })], J.prototype, "resizable", void 0), p([v({ attribute: "supporting-text" })], J.prototype, "supportingText", void 0), p([v({ attribute: "error-text" })], J.prototype, "errorText", void 0), p([v({ type: Number })], J.prototype, "count", void 0), p([v({ type: Number })], J.prototype, "max", void 0), p([v({ type: Boolean, attribute: "has-start" })], J.prototype, "hasStart", void 0), p([v({ type: Boolean, attribute: "has-end" })], J.prototype, "hasEnd", void 0), p([kt({ slot: "aria-describedby" })], J.prototype, "slottedAriaDescribedBy", void 0), p([F()], J.prototype, "isAnimating", void 0), p([F()], J.prototype, "refreshErrorAlert", void 0), p([F()], J.prototype, "disableTransitions", void 0), p([N(".label.floating")], J.prototype, "floatingLabelEl", void 0), p([N(".label.resting")], J.prototype, "restingLabelEl", void 0), p([N(".container")], J.prototype, "containerEl", void 0);
class PA extends J {
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
const UA = L`@layer styles{:host{--_active-indicator-color: var(--md-filled-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-field-active-indicator-height, 1px);--_bottom-space: var(--md-filled-field-bottom-space, 16px);--_container-color: var(--md-filled-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_content-color: var(--md-filled-field-content-color, var(--md-sys-color-on-surface, #1d1b20));--_content-font: var(--md-filled-field-content-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_content-line-height: var(--md-filled-field-content-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_content-size: var(--md-filled-field-content-size, var(--md-sys-typescale-body-large-size, 1rem));--_content-space: var(--md-filled-field-content-space, 16px);--_content-weight: var(--md-filled-field-content-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_disabled-active-indicator-color: var(--md-filled-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-field-disabled-container-opacity, 0.04);--_disabled-content-color: var(--md-filled-field-disabled-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-content-opacity: var(--md-filled-field-disabled-content-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-field-disabled-label-text-opacity, 0.38);--_disabled-leading-content-color: var(--md-filled-field-disabled-leading-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-content-opacity: var(--md-filled-field-disabled-leading-content-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-content-color: var(--md-filled-field-disabled-trailing-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-content-opacity: var(--md-filled-field-disabled-trailing-content-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-content-color: var(--md-filled-field-error-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-active-indicator-color: var(--md-filled-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-content-color: var(--md-filled-field-error-focus-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-label-text-color: var(--md-filled-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-content-color: var(--md-filled-field-error-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-content-color: var(--md-filled-field-error-focus-trailing-content-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-content-color: var(--md-filled-field-error-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-content-color: var(--md-filled-field-error-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-content-color: var(--md-filled-field-error-hover-trailing-content-color, var(--md-sys-color-on-error-container, #410e0b));--_error-label-text-color: var(--md-filled-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-content-color: var(--md-filled-field-error-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-content-color: var(--md-filled-field-error-trailing-content-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-field-focus-active-indicator-height, 3px);--_focus-content-color: var(--md-filled-field-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-content-color: var(--md-filled-field-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-content-color: var(--md-filled-field-focus-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-field-hover-active-indicator-height, 1px);--_hover-content-color: var(--md-filled-field-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-content-color: var(--md-filled-field-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-content-color: var(--md-filled-field-hover-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-filled-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-content-color: var(--md-filled-field-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-space: var(--md-filled-field-leading-space, 16px);--_supporting-text-color: var(--md-filled-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-leading-space: var(--md-filled-field-supporting-text-leading-space, 16px);--_supporting-text-line-height: var(--md-filled-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-top-space: var(--md-filled-field-supporting-text-top-space, 4px);--_supporting-text-trailing-space: var(--md-filled-field-supporting-text-trailing-space, 16px);--_supporting-text-weight: var(--md-filled-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_top-space: var(--md-filled-field-top-space, 16px);--_trailing-content-color: var(--md-filled-field-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-space: var(--md-filled-field-trailing-space, 16px);--_with-label-bottom-space: var(--md-filled-field-with-label-bottom-space, 8px);--_with-label-top-space: var(--md-filled-field-with-label-top-space, 8px);--_with-leading-content-leading-space: var(--md-filled-field-with-leading-content-leading-space, 12px);--_with-trailing-content-trailing-space: var(--md-filled-field-with-trailing-content-trailing-space, 12px);--_container-shape-start-start: var(--md-filled-field-container-shape-start-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-field-container-shape-start-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-field-container-shape-end-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-field-container-shape-end-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)))}.background,.state-layer{border-radius:inherit;inset:0;pointer-events:none;position:absolute}.background{background:var(--_container-color)}.state-layer{visibility:hidden}.field:not(.disabled):hover .state-layer{visibility:visible}.label.floating{position:absolute;top:var(--_with-label-top-space)}.field:not(.with-start) .label-wrapper{margin-inline-start:var(--_leading-space)}.field:not(.with-end) .label-wrapper{margin-inline-end:var(--_trailing-space)}.active-indicator{inset:auto 0 0 0;pointer-events:none;position:absolute;width:100%;z-index:1}.active-indicator::before,.active-indicator::after{border-bottom:var(--_active-indicator-height) solid var(--_active-indicator-color);inset:auto 0 0 0;content:"";position:absolute;width:100%}.active-indicator::after{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .active-indicator::after{opacity:1}.field:not(.with-start) .content ::slotted(*){padding-inline-start:var(--_leading-space)}.field:not(.with-end) .content ::slotted(*){padding-inline-end:var(--_trailing-space)}.field:not(.no-label) .content ::slotted(:not(textarea)){padding-bottom:var(--_with-label-bottom-space);padding-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}.field:not(.no-label) .content ::slotted(textarea){margin-bottom:var(--_with-label-bottom-space);margin-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}:hover .active-indicator::before{border-bottom-color:var(--_hover-active-indicator-color);border-bottom-width:var(--_hover-active-indicator-height)}.active-indicator::after{border-bottom-color:var(--_focus-active-indicator-color);border-bottom-width:var(--_focus-active-indicator-height)}:hover .state-layer{background:var(--_hover-state-layer-color);opacity:var(--_hover-state-layer-opacity)}.disabled .active-indicator::before{border-bottom-color:var(--_disabled-active-indicator-color);border-bottom-width:var(--_disabled-active-indicator-height);opacity:var(--_disabled-active-indicator-opacity)}.disabled .background{background:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.error .active-indicator::before{border-bottom-color:var(--_error-active-indicator-color)}.error:hover .active-indicator::before{border-bottom-color:var(--_error-hover-active-indicator-color)}.error:hover .state-layer{background:var(--_error-hover-state-layer-color);opacity:var(--_error-hover-state-layer-opacity)}.error .active-indicator::after{border-bottom-color:var(--_error-focus-active-indicator-color)}.resizable .container{bottom:var(--_focus-active-indicator-height);clip-path:inset(var(--_focus-active-indicator-height) 0 0 0)}.resizable .container>*{top:var(--_focus-active-indicator-height)}}@layer hcm{@media(forced-colors: active){.disabled .active-indicator::before{border-color:GrayText;opacity:1}}}
`, QA = L`:host{display:inline-flex;resize:both}.field{display:flex;flex:1;flex-direction:column;writing-mode:horizontal-tb;max-width:100%}.container-overflow{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-end-radius:var(--_container-shape-end-end);border-end-start-radius:var(--_container-shape-end-start);display:flex;height:100%;position:relative}.container{align-items:center;border-radius:inherit;display:flex;flex:1;max-height:100%;min-height:100%;min-width:min-content;position:relative}.field,.container-overflow{resize:inherit}.resizable:not(.disabled) .container{resize:inherit;overflow:hidden}.disabled{pointer-events:none}slot[name=container]{border-radius:inherit}slot[name=container]::slotted(*){border-radius:inherit;inset:0;pointer-events:none;position:absolute}@layer styles{.start,.middle,.end{display:flex;box-sizing:border-box;height:100%;position:relative}.start{color:var(--_leading-content-color)}.end{color:var(--_trailing-content-color)}.start,.end{align-items:center;justify-content:center}.with-start .start{margin-inline:var(--_with-leading-content-leading-space) var(--_content-space)}.with-end .end{margin-inline:var(--_content-space) var(--_with-trailing-content-trailing-space)}.middle{align-items:stretch;align-self:baseline;flex:1}.content{color:var(--_content-color);display:flex;flex:1;opacity:0;transition:opacity 83ms cubic-bezier(0.2, 0, 0, 1)}.no-label .content,.focused .content,.populated .content{opacity:1;transition-delay:67ms}:is(.disabled,.disable-transitions) .content{transition:none}.content ::slotted(*){all:unset;color:currentColor;font-family:var(--_content-font);font-size:var(--_content-size);line-height:var(--_content-line-height);font-weight:var(--_content-weight);width:100%;overflow-wrap:revert;white-space:revert}.content ::slotted(:not(textarea)){padding-top:var(--_top-space);padding-bottom:var(--_bottom-space)}.content ::slotted(textarea){margin-top:var(--_top-space);margin-bottom:var(--_bottom-space)}:hover .content{color:var(--_hover-content-color)}:hover .start{color:var(--_hover-leading-content-color)}:hover .end{color:var(--_hover-trailing-content-color)}.focused .content{color:var(--_focus-content-color)}.focused .start{color:var(--_focus-leading-content-color)}.focused .end{color:var(--_focus-trailing-content-color)}.disabled .content{color:var(--_disabled-content-color)}.disabled.no-label .content,.disabled.focused .content,.disabled.populated .content{opacity:var(--_disabled-content-opacity)}.disabled .start{color:var(--_disabled-leading-content-color);opacity:var(--_disabled-leading-content-opacity)}.disabled .end{color:var(--_disabled-trailing-content-color);opacity:var(--_disabled-trailing-content-opacity)}.error .content{color:var(--_error-content-color)}.error .start{color:var(--_error-leading-content-color)}.error .end{color:var(--_error-trailing-content-color)}.error:hover .content{color:var(--_error-hover-content-color)}.error:hover .start{color:var(--_error-hover-leading-content-color)}.error:hover .end{color:var(--_error-hover-trailing-content-color)}.error.focused .content{color:var(--_error-focus-content-color)}.error.focused .start{color:var(--_error-focus-leading-content-color)}.error.focused .end{color:var(--_error-focus-trailing-content-color)}}@layer hcm{@media(forced-colors: active){.disabled :is(.start,.content,.end){color:GrayText;opacity:1}}}@layer styles{.label{box-sizing:border-box;color:var(--_label-text-color);overflow:hidden;max-width:100%;text-overflow:ellipsis;white-space:nowrap;z-index:1;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);width:min-content}.label-wrapper{inset:0;pointer-events:none;position:absolute}.label.resting{position:absolute;top:var(--_top-space)}.label.floating{font-size:var(--_label-text-populated-size);line-height:var(--_label-text-populated-line-height);transform-origin:top left}.label.hidden{opacity:0}.no-label .label{display:none}.label-wrapper{inset:0;position:absolute;text-align:initial}:hover .label{color:var(--_hover-label-text-color)}.focused .label{color:var(--_focus-label-text-color)}.disabled .label{color:var(--_disabled-label-text-color)}.disabled .label:not(.hidden){opacity:var(--_disabled-label-text-opacity)}.error .label{color:var(--_error-label-text-color)}.error:hover .label{color:var(--_error-hover-label-text-color)}.error.focused .label{color:var(--_error-focus-label-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .label:not(.hidden){color:GrayText;opacity:1}}}@layer styles{.supporting-text{color:var(--_supporting-text-color);display:flex;font-family:var(--_supporting-text-font);font-size:var(--_supporting-text-size);line-height:var(--_supporting-text-line-height);font-weight:var(--_supporting-text-weight);gap:16px;justify-content:space-between;padding-inline-start:var(--_supporting-text-leading-space);padding-inline-end:var(--_supporting-text-trailing-space);padding-top:var(--_supporting-text-top-space)}.supporting-text :nth-child(2){flex-shrink:0}:hover .supporting-text{color:var(--_hover-supporting-text-color)}.focus .supporting-text{color:var(--_focus-supporting-text-color)}.disabled .supporting-text{color:var(--_disabled-supporting-text-color);opacity:var(--_disabled-supporting-text-opacity)}.error .supporting-text{color:var(--_error-supporting-text-color)}.error:hover .supporting-text{color:var(--_error-hover-supporting-text-color)}.error.focus .supporting-text{color:var(--_error-focus-supporting-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .supporting-text{color:GrayText;opacity:1}}}
`;
let Us = class extends PA {
};
Us.styles = [QA, UA], Us = p([Jt("md-filled-field")], Us);
const HA = {}, oa = br(class extends yr {
  constructor(s) {
    if (super(s), s.type !== Ht.PROPERTY && s.type !== Ht.ATTRIBUTE && s.type !== Ht.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!((t) => t.strings === void 0)(s)) throw Error("`live` bindings can only contain a single expression");
  }
  render(s) {
    return s;
  }
  update(s, [t]) {
    if (t === ft || t === C) return t;
    const e = s.element, i = s.name;
    if (s.type === Ht.PROPERTY) {
      if (t === e[i]) return ft;
    } else if (s.type === Ht.BOOLEAN_ATTRIBUTE) {
      if (!!t === e.hasAttribute(i)) return ft;
    } else if (s.type === Ht.ATTRIBUTE && e.getAttribute(i) === t + "") return ft;
    return ((r, o = HA) => {
      r._$AH = o;
    })(s), t;
  }
}), Un = "important", GA = " !" + Un, ji = br(class extends yr {
  constructor(s) {
    var t;
    if (super(s), s.type !== Ht.ATTRIBUTE || s.name !== "style" || ((t = s.strings) === null || t === void 0 ? void 0 : t.length) > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
  }
  render(s) {
    return Object.keys(s).reduce(((t, e) => {
      const i = s[e];
      return i == null ? t : t + `${e = e.includes("-") ? e : e.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${i};`;
    }), "");
  }
  update(s, [t]) {
    const { style: e } = s.element;
    if (this.ft === void 0) return this.ft = new Set(Object.keys(t)), this.render(t);
    for (const i of this.ft) t[i] == null && (this.ft.delete(i), i.includes("-") ? e.removeProperty(i) : e[i] = null);
    for (const i in t) {
      const r = t[i];
      if (r != null) {
        this.ft.add(i);
        const o = typeof r == "string" && r.endsWith(GA);
        i.includes("-") || o ? e.setProperty(i, o ? r.slice(0, -11) : r, o ? Un : "") : e[i] = r;
      }
    }
    return ft;
  }
}), $A = { fromAttribute: (s) => s ?? "", toAttribute: (s) => s || null }, Wi = /* @__PURE__ */ Symbol("onReportValidity"), Ci = /* @__PURE__ */ Symbol("privateCleanupFormListeners"), Bi = /* @__PURE__ */ Symbol("privateDoNotReportInvalid"), Ii = /* @__PURE__ */ Symbol("privateIsSelfReportingValidity"), xi = /* @__PURE__ */ Symbol("privateCallOnReportValidity");
function Qn(s) {
  var t, e, i;
  class r extends s {
    constructor(...a) {
      super(...a), this[t] = new AbortController(), this[e] = !1, this[i] = !1, this.addEventListener("invalid", ((n) => {
        !this[Bi] && n.isTrusted && this.addEventListener("invalid", (() => {
          this[xi](n);
        }), { once: !0 });
      }), { capture: !0 });
    }
    checkValidity() {
      this[Bi] = !0;
      const a = super.checkValidity();
      return this[Bi] = !1, a;
    }
    reportValidity() {
      this[Ii] = !0;
      const a = super.reportValidity();
      return a && this[xi](null), this[Ii] = !1, a;
    }
    [(t = Ci, e = Bi, i = Ii, xi)](a) {
      const n = a?.defaultPrevented;
      n || (this[Wi](a), !n && a?.defaultPrevented && (this[Ii] || (function(l, c) {
        if (!l) return !0;
        let d;
        for (const h of l.elements) if (h.matches(":invalid")) {
          d = h;
          break;
        }
        return d === c;
      })(this[st].form, this)) && this.focus());
    }
    [Wi](a) {
      throw new Error("Implement [onReportValidity]");
    }
    formAssociatedCallback(a) {
      super.formAssociatedCallback && super.formAssociatedCallback(a), this[Ci].abort(), a && (this[Ci] = new AbortController(), (function(n, l, c, d) {
        const h = (function(m) {
          if (!Qs.has(m)) {
            const f = new EventTarget();
            Qs.set(m, f);
            for (const b of ["reportValidity", "requestSubmit"]) {
              const E = m[b];
              m[b] = function() {
                f.dispatchEvent(new Event("before"));
                const u = Reflect.apply(E, this, arguments);
                return f.dispatchEvent(new Event("after")), u;
              };
            }
          }
          return Qs.get(m);
        })(l);
        let g, A = !1, _ = !1;
        h.addEventListener("before", (() => {
          _ = !0, g = new AbortController(), A = !1, n.addEventListener("invalid", (() => {
            A = !0;
          }), { signal: g.signal });
        }), { signal: d }), h.addEventListener("after", (() => {
          var m;
          _ = !1, (m = g) === null || m === void 0 || m.abort(), A || c();
        }), { signal: d }), l.addEventListener("submit", (() => {
          _ || c();
        }), { signal: d });
      })(this, a, (() => {
        this[xi](null);
      }), this[Ci].signal));
    }
  }
  return r;
}
const Qs = /* @__PURE__ */ new WeakMap();
class LA extends xr {
  computeValidity({ state: t, renderedControl: e }) {
    let i = e;
    Te(t) && !i ? (i = this.inputControl || document.createElement("input"), this.inputControl = i) : i || (i = this.textAreaControl || document.createElement("textarea"), this.textAreaControl = i);
    const r = Te(t) ? i : null;
    if (r && (r.type = t.type), i.value !== t.value && (i.value = t.value), i.required = t.required, r) {
      const o = t;
      o.pattern ? r.pattern = o.pattern : r.removeAttribute("pattern"), o.min ? r.min = o.min : r.removeAttribute("min"), o.max ? r.max = o.max : r.removeAttribute("max"), o.step ? r.step = o.step : r.removeAttribute("step");
    }
    return (t.minLength ?? -1) > -1 ? i.setAttribute("minlength", String(t.minLength)) : i.removeAttribute("minlength"), (t.maxLength ?? -1) > -1 ? i.setAttribute("maxlength", String(t.maxLength)) : i.removeAttribute("maxlength"), { validity: i.validity, validationMessage: i.validationMessage };
  }
  equals({ state: t }, { state: e }) {
    const i = t.type === e.type && t.value === e.value && t.required === e.required && t.minLength === e.minLength && t.maxLength === e.maxLength;
    return Te(t) && Te(e) ? i && t.pattern === e.pattern && t.min === e.min && t.max === e.max && t.step === e.step : i;
  }
  copy({ state: t }) {
    return { state: Te(t) ? this.copyInput(t) : this.copyTextArea(t), renderedControl: null };
  }
  copyInput(t) {
    const { type: e, pattern: i, min: r, max: o, step: a } = t;
    return { ...this.copySharedState(t), type: e, pattern: i, min: r, max: o, step: a };
  }
  copyTextArea(t) {
    return { ...this.copySharedState(t), type: t.type };
  }
  copySharedState({ value: t, required: e, minLength: i, maxLength: r }) {
    return { value: t, required: e, minLength: i, maxLength: r };
  }
}
function Te(s) {
  return s.type !== "textarea";
}
const YA = Ot(Qn(Br(Ir(hi(G)))));
class k extends YA {
  constructor() {
    super(...arguments), this.error = !1, this.errorText = "", this.label = "", this.noAsterisk = !1, this.required = !1, this.value = "", this.prefixText = "", this.suffixText = "", this.hasLeadingIcon = !1, this.hasTrailingIcon = !1, this.supportingText = "", this.textDirection = "", this.rows = 2, this.cols = 20, this.inputMode = "", this.max = "", this.maxLength = -1, this.min = "", this.minLength = -1, this.noSpinner = !1, this.pattern = "", this.placeholder = "", this.readOnly = !1, this.multiple = !1, this.step = "", this.type = "text", this.autocomplete = "", this.dirty = !1, this.focused = !1, this.nativeError = !1, this.nativeErrorText = "";
  }
  get selectionDirection() {
    return this.getInputOrTextarea().selectionDirection;
  }
  set selectionDirection(t) {
    this.getInputOrTextarea().selectionDirection = t;
  }
  get selectionEnd() {
    return this.getInputOrTextarea().selectionEnd;
  }
  set selectionEnd(t) {
    this.getInputOrTextarea().selectionEnd = t;
  }
  get selectionStart() {
    return this.getInputOrTextarea().selectionStart;
  }
  set selectionStart(t) {
    this.getInputOrTextarea().selectionStart = t;
  }
  get valueAsNumber() {
    const t = this.getInput();
    return t ? t.valueAsNumber : NaN;
  }
  set valueAsNumber(t) {
    const e = this.getInput();
    e && (e.valueAsNumber = t, this.value = e.value);
  }
  get valueAsDate() {
    const t = this.getInput();
    return t ? t.valueAsDate : null;
  }
  set valueAsDate(t) {
    const e = this.getInput();
    e && (e.valueAsDate = t, this.value = e.value);
  }
  get hasError() {
    return this.error || this.nativeError;
  }
  select() {
    this.getInputOrTextarea().select();
  }
  setRangeText(...t) {
    this.getInputOrTextarea().setRangeText(...t), this.value = this.getInputOrTextarea().value;
  }
  setSelectionRange(t, e, i) {
    this.getInputOrTextarea().setSelectionRange(t, e, i);
  }
  showPicker() {
    const t = this.getInput();
    t && t.showPicker();
  }
  stepDown(t) {
    const e = this.getInput();
    e && (e.stepDown(t), this.value = e.value);
  }
  stepUp(t) {
    const e = this.getInput();
    e && (e.stepUp(t), this.value = e.value);
  }
  reset() {
    this.dirty = !1, this.value = this.getAttribute("value") ?? "", this.nativeError = !1, this.nativeErrorText = "";
  }
  attributeChangedCallback(t, e, i) {
    t === "value" && this.dirty || super.attributeChangedCallback(t, e, i);
  }
  render() {
    const t = { disabled: this.disabled, error: !this.disabled && this.hasError, textarea: this.type === "textarea", "no-spinner": this.noSpinner };
    return y`
      <span class="text-field ${At(t)}">
        ${this.renderField()}
      </span>
    `;
  }
  updated(t) {
    const e = this.getInputOrTextarea().value;
    this.value !== e && (this.value = e);
  }
  renderField() {
    return es`<${this.fieldTag}
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
    const t = { direction: this.textDirection }, e = this.ariaLabel || this.label || C, i = this.autocomplete, r = (this.maxLength ?? -1) > -1, o = (this.minLength ?? -1) > -1;
    if (this.type === "textarea") return y`
        <textarea
          class="input"
          style=${ji(t)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${e}
          autocomplete=${i || C}
          name=${this.name || C}
          ?disabled=${this.disabled}
          maxlength=${r ? this.maxLength : C}
          minlength=${o ? this.minLength : C}
          placeholder=${this.placeholder || C}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          rows=${this.rows}
          cols=${this.cols}
          .value=${oa(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent}></textarea>
      `;
    const a = this.renderPrefix(), n = this.renderSuffix(), l = this.inputMode;
    return y`
      <div class="input-wrapper">
        ${a}
        <input
          class="input"
          style=${ji(t)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${e}
          autocomplete=${i || C}
          name=${this.name || C}
          ?disabled=${this.disabled}
          inputmode=${l || C}
          max=${this.max || C}
          maxlength=${r ? this.maxLength : C}
          min=${this.min || C}
          minlength=${o ? this.minLength : C}
          pattern=${this.pattern || C}
          placeholder=${this.placeholder || C}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          ?multiple=${this.multiple}
          step=${this.step || C}
          type=${this.type}
          .value=${oa(this.value)}
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
  renderAffix(t, e) {
    return t ? y`<span class="${At({ suffix: e, prefix: !e })}">${t}</span>` : C;
  }
  getErrorText() {
    return this.error ? this.errorText : this.nativeErrorText;
  }
  handleFocusChange() {
    var t;
    this.focused = ((t = this.inputOrTextarea) === null || t === void 0 ? void 0 : t.matches(":focus")) ?? !1;
  }
  handleInput(t) {
    this.dirty = !0, this.value = t.target.value;
  }
  redispatchEvent(t) {
    ts(this, t);
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
  [fe]() {
    return this.value;
  }
  formResetCallback() {
    this.reset();
  }
  formStateRestoreCallback(t) {
    this.value = t;
  }
  focus() {
    this.getInputOrTextarea().focus();
  }
  [si]() {
    return new LA((() => ({ state: this, renderedControl: this.inputOrTextarea })));
  }
  [ri]() {
    return this.inputOrTextarea;
  }
  [Wi](t) {
    t?.preventDefault();
    const e = this.getErrorText();
    var i;
    this.nativeError = !!t, this.nativeErrorText = this.validationMessage, e === this.getErrorText() && ((i = this.field) === null || i === void 0 || i.reannounceError());
  }
}
k.shadowRootOptions = { ...G.shadowRootOptions, delegatesFocus: !0 }, p([v({ type: Boolean, reflect: !0 })], k.prototype, "error", void 0), p([v({ attribute: "error-text" })], k.prototype, "errorText", void 0), p([v()], k.prototype, "label", void 0), p([v({ type: Boolean, attribute: "no-asterisk" })], k.prototype, "noAsterisk", void 0), p([v({ type: Boolean, reflect: !0 })], k.prototype, "required", void 0), p([v()], k.prototype, "value", void 0), p([v({ attribute: "prefix-text" })], k.prototype, "prefixText", void 0), p([v({ attribute: "suffix-text" })], k.prototype, "suffixText", void 0), p([v({ type: Boolean, attribute: "has-leading-icon" })], k.prototype, "hasLeadingIcon", void 0), p([v({ type: Boolean, attribute: "has-trailing-icon" })], k.prototype, "hasTrailingIcon", void 0), p([v({ attribute: "supporting-text" })], k.prototype, "supportingText", void 0), p([v({ attribute: "text-direction" })], k.prototype, "textDirection", void 0), p([v({ type: Number })], k.prototype, "rows", void 0), p([v({ type: Number })], k.prototype, "cols", void 0), p([v({ reflect: !0 })], k.prototype, "inputMode", void 0), p([v()], k.prototype, "max", void 0), p([v({ type: Number })], k.prototype, "maxLength", void 0), p([v()], k.prototype, "min", void 0), p([v({ type: Number })], k.prototype, "minLength", void 0), p([v({ type: Boolean, attribute: "no-spinner" })], k.prototype, "noSpinner", void 0), p([v()], k.prototype, "pattern", void 0), p([v({ reflect: !0, converter: $A })], k.prototype, "placeholder", void 0), p([v({ type: Boolean, reflect: !0 })], k.prototype, "readOnly", void 0), p([v({ type: Boolean, reflect: !0 })], k.prototype, "multiple", void 0), p([v()], k.prototype, "step", void 0), p([v({ reflect: !0 })], k.prototype, "type", void 0), p([v({ reflect: !0 })], k.prototype, "autocomplete", void 0), p([F()], k.prototype, "dirty", void 0), p([F()], k.prototype, "focused", void 0), p([F()], k.prototype, "nativeError", void 0), p([F()], k.prototype, "nativeErrorText", void 0), p([N(".input")], k.prototype, "inputOrTextarea", void 0), p([N(".field")], k.prototype, "field", void 0), p([kt({ slot: "leading-icon" })], k.prototype, "leadingIcons", void 0), p([kt({ slot: "trailing-icon" })], k.prototype, "trailingIcons", void 0);
class NA extends k {
  constructor() {
    super(...arguments), this.fieldTag = Yt`md-filled-field`;
  }
}
const KA = L`:host{display:inline-flex;outline:none;resize:both;text-align:start;-webkit-tap-highlight-color:rgba(0,0,0,0)}.text-field,.field{width:100%}.text-field{display:inline-flex}.field{cursor:text}.disabled .field{cursor:default}.text-field,.textarea .field{resize:inherit}slot[name=container]{border-radius:inherit}.icon{color:currentColor;display:flex;align-items:center;justify-content:center;fill:currentColor;position:relative}.icon ::slotted(*){display:flex;position:absolute}[has-start] .icon.leading{font-size:var(--_leading-icon-size);height:var(--_leading-icon-size);width:var(--_leading-icon-size)}[has-end] .icon.trailing{font-size:var(--_trailing-icon-size);height:var(--_trailing-icon-size);width:var(--_trailing-icon-size)}.input-wrapper{display:flex}.input-wrapper>*{all:inherit;padding:0}.input{caret-color:var(--_caret-color);overflow-x:hidden;text-align:inherit}.input::placeholder{color:currentColor;opacity:1}.input::-webkit-calendar-picker-indicator{display:none}.input::-webkit-search-decoration,.input::-webkit-search-cancel-button{display:none}@media(forced-colors: active){.input{background:none}}.no-spinner .input::-webkit-inner-spin-button,.no-spinner .input::-webkit-outer-spin-button{display:none}.no-spinner .input[type=number]{-moz-appearance:textfield}:focus-within .input{caret-color:var(--_focus-caret-color)}.error:focus-within .input{caret-color:var(--_error-focus-caret-color)}.text-field:not(.disabled) .prefix{color:var(--_input-text-prefix-color)}.text-field:not(.disabled) .suffix{color:var(--_input-text-suffix-color)}.text-field:not(.disabled) .input::placeholder{color:var(--_input-text-placeholder-color)}.prefix,.suffix{text-wrap:nowrap;width:min-content}.prefix{padding-inline-end:var(--_input-text-prefix-trailing-space)}.suffix{padding-inline-start:var(--_input-text-suffix-leading-space)}
`;
class aa extends NA {
  constructor() {
    super(...arguments), this.fieldTag = Yt`md-filled-field`;
  }
}
aa.styles = [KA, OA], customElements.define("ew-filled-text-field", aa);
class zA extends G {
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  render() {
    return y`<span class="shadow"></span>`;
  }
}
const JA = L`:host,.shadow,.shadow::before,.shadow::after{border-radius:inherit;inset:0;position:absolute;transition-duration:inherit;transition-property:inherit;transition-timing-function:inherit}:host{display:flex;pointer-events:none;transition-property:box-shadow,opacity}.shadow::before,.shadow::after{content:"";transition-property:box-shadow,opacity;--_level: var(--md-elevation-level, 0);--_shadow-color: var(--md-elevation-shadow-color, var(--md-sys-color-shadow, #000))}.shadow::before{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 3,1) + 2*clamp(0,var(--_level) - 4,1))) calc(1px*(2*clamp(0,var(--_level),1) + clamp(0,var(--_level) - 2,1) + clamp(0,var(--_level) - 4,1))) 0px var(--_shadow-color);opacity:.3}.shadow::after{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 1,1) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(3*clamp(0,var(--_level),2) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(clamp(0,var(--_level),4) + 2*clamp(0,var(--_level) - 4,1))) var(--_shadow-color);opacity:.15}
`;
let Hs = class extends zA {
};
Hs.styles = [JA], Hs = p([Jt("md-elevation")], Hs);
const na = function(s, t) {
  return new CustomEvent("close-menu", { bubbles: !0, composed: !0, detail: { initiator: s, reason: t, itemPath: [s] } });
}, ir = { SPACE: "Space", ENTER: "Enter" }, jA = "click-selection", WA = "keydown", VA = { ESCAPE: "Escape", SPACE: ir.SPACE, ENTER: ir.ENTER };
function Hn(s) {
  return Object.values(VA).some(((t) => t === s));
}
function sr(s, t) {
  const e = new Event("md-contains", { bubbles: !0, composed: !0 });
  let i = [];
  const r = (o) => {
    i = o.composedPath();
  };
  return t.addEventListener("md-contains", r), s.dispatchEvent(e), t.removeEventListener("md-contains", r), i.length > 0;
}
const Ui = "none", qA = "list-root", rr = "first-item", Gn = "last-item", ZA = "end-start", XA = "start-start";
class tp {
  constructor(t, e) {
    this.host = t, this.getProperties = e, this.surfaceStylesInternal = { display: "none" }, this.lastValues = { isOpen: !1 }, this.host.addController(this);
  }
  get surfaceStyles() {
    return this.surfaceStylesInternal;
  }
  async position() {
    const { surfaceEl: t, anchorEl: e, anchorCorner: i, surfaceCorner: r, positioning: o, xOffset: a, yOffset: n, disableBlockFlip: l, disableInlineFlip: c, repositionStrategy: d } = this.getProperties(), h = i.toLowerCase().trim(), g = r.toLowerCase().trim();
    if (!t || !e) return;
    const A = window.innerWidth, _ = window.innerHeight, m = document.createElement("div");
    m.style.opacity = "0", m.style.position = "fixed", m.style.display = "block", m.style.inset = "0", document.body.appendChild(m);
    const f = m.getBoundingClientRect();
    m.remove();
    const b = window.innerHeight - f.bottom, E = window.innerWidth - f.right;
    this.surfaceStylesInternal = { display: "block", opacity: "0" }, this.host.requestUpdate(), await this.host.updateComplete, t.popover && t.isConnected && t.showPopover();
    const u = t.getSurfacePositionClientRect ? t.getSurfacePositionClientRect() : t.getBoundingClientRect(), I = e.getSurfacePositionClientRect ? e.getSurfacePositionClientRect() : e.getBoundingClientRect(), [D, w] = g.split("-"), [M, R] = h.split("-"), x = getComputedStyle(t).direction === "ltr";
    let { blockInset: S, blockOutOfBoundsCorrection: P, surfaceBlockProperty: nt } = this.calculateBlock({ surfaceRect: u, anchorRect: I, anchorBlock: M, surfaceBlock: D, yOffset: n, positioning: o, windowInnerHeight: _, blockScrollbarHeight: b });
    if (P && !l) {
      const ns = D === "start" ? "end" : "start", ls = M === "start" ? "end" : "start", xt = this.calculateBlock({ surfaceRect: u, anchorRect: I, anchorBlock: ls, surfaceBlock: ns, yOffset: n, positioning: o, windowInnerHeight: _, blockScrollbarHeight: b });
      P > xt.blockOutOfBoundsCorrection && (S = xt.blockInset, P = xt.blockOutOfBoundsCorrection, nt = xt.surfaceBlockProperty);
    }
    let { inlineInset: Pt, inlineOutOfBoundsCorrection: mt, surfaceInlineProperty: Wt } = this.calculateInline({ surfaceRect: u, anchorRect: I, anchorInline: R, surfaceInline: w, xOffset: a, positioning: o, isLTR: x, windowInnerWidth: A, inlineScrollbarWidth: E });
    if (mt && !c) {
      const ns = w === "start" ? "end" : "start", ls = R === "start" ? "end" : "start", xt = this.calculateInline({ surfaceRect: u, anchorRect: I, anchorInline: ls, surfaceInline: ns, xOffset: a, positioning: o, isLTR: x, windowInnerWidth: A, inlineScrollbarWidth: E });
      Math.abs(mt) > Math.abs(xt.inlineOutOfBoundsCorrection) && (Pt = xt.inlineInset, mt = xt.inlineOutOfBoundsCorrection, Wt = xt.surfaceInlineProperty);
    }
    d === "move" && (S -= P, Pt -= mt), this.surfaceStylesInternal = { display: "block", opacity: "1", [nt]: `${S}px`, [Wt]: `${Pt}px` }, d === "resize" && (P && (this.surfaceStylesInternal.height = u.height - P + "px"), mt && (this.surfaceStylesInternal.width = u.width - mt + "px")), this.host.requestUpdate();
  }
  calculateBlock(t) {
    const { surfaceRect: e, anchorRect: i, anchorBlock: r, surfaceBlock: o, yOffset: a, positioning: n, windowInnerHeight: l, blockScrollbarHeight: c } = t, d = n === "fixed" || n === "document" ? 1 : 0, h = n === "document" ? 1 : 0, g = o === "start" ? 1 : 0, A = o === "end" ? 1 : 0, _ = (r !== o ? 1 : 0) * i.height + a, m = g * i.top + A * (l - i.bottom - c);
    return { blockInset: d * m + h * (g * window.scrollY - A * window.scrollY) + _, blockOutOfBoundsCorrection: Math.abs(Math.min(0, l - m - _ - e.height)), surfaceBlockProperty: o === "start" ? "inset-block-start" : "inset-block-end" };
  }
  calculateInline(t) {
    const { isLTR: e, surfaceInline: i, anchorInline: r, anchorRect: o, surfaceRect: a, xOffset: n, positioning: l, windowInnerWidth: c, inlineScrollbarWidth: d } = t, h = l === "fixed" || l === "document" ? 1 : 0, g = l === "document" ? 1 : 0, A = e ? 1 : 0, _ = e ? 0 : 1, m = i === "start" ? 1 : 0, f = i === "end" ? 1 : 0, b = (r !== i ? 1 : 0) * o.width + n, E = A * (m * o.left + f * (c - o.right - d)) + _ * (m * (c - o.right - d) + f * o.left);
    let u = i === "start" ? "inset-inline-start" : "inset-inline-end";
    return l !== "document" && l !== "fixed" || (u = i === "start" && e || i === "end" && !e ? "left" : "right"), { inlineInset: h * E + b + g * (A * (m * window.scrollX - f * window.scrollX) + _ * (f * window.scrollX - m * window.scrollX)), inlineOutOfBoundsCorrection: Math.abs(Math.min(0, c - E - b - a.width)), surfaceInlineProperty: u };
  }
  hostUpdate() {
    this.onUpdate();
  }
  hostUpdated() {
    this.onUpdate();
  }
  async onUpdate() {
    const t = this.getProperties();
    let e = !1;
    for (const [a, n] of Object.entries(t)) if (e = e || n !== this.lastValues[a], e) break;
    const i = this.lastValues.isOpen !== t.isOpen, r = !!t.anchorEl, o = !!t.surfaceEl;
    e && r && o && (this.lastValues.isOpen = t.isOpen, t.isOpen ? (this.lastValues = t, await this.position(), t.onOpen()) : i && (await t.beforeClose(), this.close(), t.onClose()));
  }
  close() {
    this.surfaceStylesInternal = { display: "none" }, this.host.requestUpdate();
    const t = this.getProperties().surfaceEl;
    t != null && t.popover && t != null && t.isConnected && t.hidePopover();
  }
}
const la = 0, Dt = 1, ep = 2;
class ip {
  constructor(t) {
    this.getProperties = t, this.typeaheadRecords = [], this.typaheadBuffer = "", this.cancelTypeaheadTimeout = 0, this.isTypingAhead = !1, this.lastActiveRecord = null, this.onKeydown = (e) => {
      this.isTypingAhead ? this.typeahead(e) : this.beginTypeahead(e);
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
  beginTypeahead(t) {
    this.active && (t.code === "Space" || t.code === "Enter" || t.code.startsWith("Arrow") || t.code === "Escape" || (this.isTypingAhead = !0, this.typeaheadRecords = this.items.map(((e, i) => [i, e, e.typeaheadText.trim().toLowerCase()])), this.lastActiveRecord = this.typeaheadRecords.find(((e) => e[Dt].tabIndex === 0)) ?? null, this.lastActiveRecord && (this.lastActiveRecord[Dt].tabIndex = -1), this.typeahead(t)));
  }
  typeahead(t) {
    if (t.defaultPrevented) return;
    if (clearTimeout(this.cancelTypeaheadTimeout), t.code === "Enter" || t.code.startsWith("Arrow") || t.code === "Escape") return this.endTypeahead(), void (this.lastActiveRecord && (this.lastActiveRecord[Dt].tabIndex = -1));
    t.code === "Space" && t.preventDefault(), this.cancelTypeaheadTimeout = setTimeout(this.endTypeahead, this.getProperties().typeaheadBufferTime), this.typaheadBuffer += t.key.toLowerCase();
    const e = this.lastActiveRecord ? this.lastActiveRecord[la] : -1, i = this.typeaheadRecords.length, r = (l) => (l[la] + i - e) % i, o = this.typeaheadRecords.filter(((l) => !l[Dt].disabled && l[ep].startsWith(this.typaheadBuffer))).sort(((l, c) => r(l) - r(c)));
    if (o.length === 0) return clearTimeout(this.cancelTypeaheadTimeout), this.lastActiveRecord && (this.lastActiveRecord[Dt].tabIndex = -1), void this.endTypeahead();
    const a = this.typaheadBuffer.length === 1;
    let n;
    n = this.lastActiveRecord === o[0] && a ? o[1] ?? o[0] : o[0], this.lastActiveRecord && (this.lastActiveRecord[Dt].tabIndex = -1), this.lastActiveRecord = n, n[Dt].tabIndex = 0, n[Dt].focus();
  }
}
const $n = /* @__PURE__ */ new Set([X.ArrowDown, X.ArrowUp, X.Home, X.End]), sp = /* @__PURE__ */ new Set([X.ArrowLeft, X.ArrowRight, ...$n]);
class j extends G {
  get openDirection() {
    return this.menuCorner.split("-")[0] === "start" ? "DOWN" : "UP";
  }
  get anchorElement() {
    return this.anchor ? this.getRootNode().querySelector(`#${this.anchor}`) : this.currentAnchorElement;
  }
  set anchorElement(t) {
    this.currentAnchorElement = t, this.requestUpdate("anchorElement");
  }
  constructor() {
    super(), this.anchor = "", this.positioning = "absolute", this.quick = !1, this.hasOverflow = !1, this.open = !1, this.xOffset = 0, this.yOffset = 0, this.noHorizontalFlip = !1, this.noVerticalFlip = !1, this.typeaheadDelay = 200, this.anchorCorner = ZA, this.menuCorner = XA, this.stayOpenOnOutsideClick = !1, this.stayOpenOnFocusout = !1, this.skipRestoreFocus = !1, this.defaultFocus = rr, this.noNavigationWrap = !1, this.typeaheadActive = !0, this.isSubmenu = !1, this.pointerPath = [], this.isRepositioning = !1, this.openCloseAnimationSignal = Kd(), this.listController = new An({ isItem: (t) => t.hasAttribute("md-menu-item"), getPossibleItems: () => this.slotItems, isRtl: () => getComputedStyle(this).direction === "rtl", deactivateItem: (t) => {
      t.selected = !1, t.tabIndex = -1;
    }, activateItem: (t) => {
      t.selected = !0, t.tabIndex = 0;
    }, isNavigableKey: (t) => this.isSubmenu ? t === (getComputedStyle(this).direction === "rtl" ? X.ArrowLeft : X.ArrowRight) || $n.has(t) : sp.has(t), wrapNavigation: () => !this.noNavigationWrap }), this.lastFocusedElement = null, this.typeaheadController = new ip((() => ({ getItems: () => this.items, typeaheadBufferTime: this.typeaheadDelay, active: this.typeaheadActive }))), this.currentAnchorElement = null, this.internals = this.attachInternals(), this.menuPositionController = new tp(this, (() => ({ anchorCorner: this.anchorCorner, surfaceCorner: this.menuCorner, surfaceEl: this.surfaceEl, anchorEl: this.anchorElement, positioning: this.positioning === "popover" ? "document" : this.positioning, isOpen: this.open, xOffset: this.xOffset, yOffset: this.yOffset, disableBlockFlip: this.noVerticalFlip, disableInlineFlip: this.noHorizontalFlip, onOpen: this.onOpened, beforeClose: this.beforeClose, onClose: this.onClosed, repositionStrategy: this.hasOverflow && this.positioning !== "popover" ? "move" : "resize" }))), this.onWindowResize = () => {
      this.isRepositioning || this.positioning !== "document" && this.positioning !== "fixed" && this.positioning !== "popover" || (this.isRepositioning = !0, this.reposition(), this.isRepositioning = !1);
    }, this.handleFocusout = async (t) => {
      const e = this.anchorElement;
      if (this.stayOpenOnFocusout || !this.open || this.pointerPath.includes(e)) return;
      if (t.relatedTarget) {
        if (sr(t.relatedTarget, this) || this.pointerPath.length !== 0 && sr(t.relatedTarget, e)) return;
      } else if (this.pointerPath.includes(this)) return;
      const i = this.skipRestoreFocus;
      this.skipRestoreFocus = !0, this.close(), await this.updateComplete, this.skipRestoreFocus = i;
    }, this.onOpened = async () => {
      this.lastFocusedElement = (function(r = document) {
        let o = r.activeElement;
        for (; o && (a = o) !== null && a !== void 0 && (a = a.shadowRoot) !== null && a !== void 0 && a.activeElement; ) {
          var a;
          o = o.shadowRoot.activeElement;
        }
        return o;
      })();
      const t = this.items, e = Ye(t);
      e && this.defaultFocus !== Ui && (e.item.tabIndex = -1);
      let i = !this.quick;
      switch (this.quick ? this.dispatchEvent(new Event("opening")) : i = !!await this.animateOpen(), this.defaultFocus) {
        case rr:
          const r = Cr(t);
          r && (r.tabIndex = 0, r.focus(), await r.updateComplete);
          break;
        case Gn:
          const o = hn(t);
          o && (o.tabIndex = 0, o.focus(), await o.updateComplete);
          break;
        case qA:
          this.focus();
      }
      i || this.dispatchEvent(new Event("opened"));
    }, this.beforeClose = async () => {
      var t, e;
      this.open = !1, this.skipRestoreFocus || (t = this.lastFocusedElement) === null || t === void 0 || (e = t.focus) === null || e === void 0 || e.call(t), this.quick || await this.animateClose();
    }, this.onClosed = () => {
      this.quick && (this.dispatchEvent(new Event("closing")), this.dispatchEvent(new Event("closed")));
    }, this.onWindowPointerdown = (t) => {
      this.pointerPath = t.composedPath();
    }, this.onDocumentClick = (t) => {
      if (!this.open) return;
      const e = t.composedPath();
      this.stayOpenOnOutsideClick || e.includes(this) || e.includes(this.anchorElement) || (this.open = !1);
    }, this.internals.role = "menu", this.addEventListener("keydown", this.handleKeydown), this.addEventListener("keydown", this.captureKeydown, { capture: !0 }), this.addEventListener("focusout", this.handleFocusout);
  }
  get items() {
    return this.listController.items;
  }
  willUpdate(t) {
    t.has("open") && (this.open ? this.removeAttribute("aria-hidden") : this.setAttribute("aria-hidden", "true"));
  }
  update(t) {
    t.has("open") && (this.open ? this.setUpGlobalEventListeners() : this.cleanUpGlobalEventListeners()), t.has("positioning") && this.positioning === "popover" && !this.showPopover && (this.positioning = "fixed"), super.update(t);
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
        class="menu ${At(this.getSurfaceClasses())}"
        style=${ji(this.menuPositionController.surfaceStyles)}
        popover=${this.positioning === "popover" ? "manual" : C}>
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
  captureKeydown(t) {
    t.target === this && !t.defaultPrevented && Hn(t.code) && (t.preventDefault(), this.close()), this.typeaheadController.onKeydown(t);
  }
  async animateOpen() {
    const t = this.surfaceEl, e = this.slotEl;
    if (!t || !e) return !0;
    const i = this.openDirection;
    this.dispatchEvent(new Event("opening")), t.classList.toggle("animating", !0);
    const r = this.openCloseAnimationSignal.start(), o = t.offsetHeight, a = i === "UP", n = this.items, l = 250 / n.length, c = t.animate([{ height: "0px" }, { height: `${o}px` }], { duration: 500, easing: Bt.EMPHASIZED }), d = e.animate([{ transform: a ? `translateY(-${o}px)` : "" }, { transform: "" }], { duration: 500, easing: Bt.EMPHASIZED }), h = t.animate([{ opacity: 0 }, { opacity: 1 }], 50), g = [];
    for (let m = 0; m < n.length; m++) {
      const f = n[a ? n.length - 1 - m : m], b = f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: l * m });
      f.classList.toggle("md-menu-hidden", !0), b.addEventListener("finish", (() => {
        f.classList.toggle("md-menu-hidden", !1);
      })), g.push([f, b]);
    }
    let A = (m) => {
    };
    const _ = new Promise(((m) => {
      A = m;
    }));
    return r.addEventListener("abort", (() => {
      c.cancel(), d.cancel(), h.cancel(), g.forEach((([m, f]) => {
        m.classList.toggle("md-menu-hidden", !1), f.cancel();
      })), A(!0);
    })), c.addEventListener("finish", (() => {
      t.classList.toggle("animating", !1), this.openCloseAnimationSignal.finish(), A(!1);
    })), await _;
  }
  animateClose() {
    let t;
    const e = new Promise(((m) => {
      t = m;
    })), i = this.surfaceEl, r = this.slotEl;
    if (!i || !r) return t(!1), e;
    const o = this.openDirection === "UP";
    this.dispatchEvent(new Event("closing")), i.classList.toggle("animating", !0);
    const a = this.openCloseAnimationSignal.start(), n = i.offsetHeight, l = this.items, c = 150, d = 50 / l.length, h = i.animate([{ height: `${n}px` }, { height: 0.35 * n + "px" }], { duration: c, easing: Bt.EMPHASIZED_ACCELERATE }), g = r.animate([{ transform: "" }, { transform: o ? `translateY(-${0.65 * n}px)` : "" }], { duration: c, easing: Bt.EMPHASIZED_ACCELERATE }), A = i.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 50, delay: 100 }), _ = [];
    for (let m = 0; m < l.length; m++) {
      const f = l[o ? m : l.length - 1 - m], b = f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 50, delay: 50 + d * m });
      b.addEventListener("finish", (() => {
        f.classList.toggle("md-menu-hidden", !0);
      })), _.push([f, b]);
    }
    return a.addEventListener("abort", (() => {
      h.cancel(), g.cancel(), A.cancel(), _.forEach((([m, f]) => {
        f.cancel(), m.classList.toggle("md-menu-hidden", !1);
      })), t(!1);
    })), h.addEventListener("finish", (() => {
      i.classList.toggle("animating", !1), _.forEach((([m]) => {
        m.classList.toggle("md-menu-hidden", !1);
      })), this.openCloseAnimationSignal.finish(), this.dispatchEvent(new Event("closed")), t(!0);
    })), e;
  }
  handleKeydown(t) {
    this.pointerPath = [], this.listController.handleKeydown(t);
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
  onDeactivateItems(t) {
    t.stopPropagation(), this.listController.onDeactivateItems();
  }
  onRequestActivation(t) {
    t.stopPropagation(), this.listController.onRequestActivation(t);
  }
  handleDeactivateTypeahead(t) {
    t.stopPropagation(), this.typeaheadActive = !1;
  }
  handleActivateTypeahead(t) {
    t.stopPropagation(), this.typeaheadActive = !0;
  }
  handleStayOpenOnFocusout(t) {
    t.stopPropagation(), this.stayOpenOnFocusout = !0;
  }
  handleCloseOnFocusout(t) {
    t.stopPropagation(), this.stayOpenOnFocusout = !1;
  }
  close() {
    this.open = !1, this.slotItems.forEach(((t) => {
      var e;
      (e = t.close) === null || e === void 0 || e.call(t);
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
p([N(".menu")], j.prototype, "surfaceEl", void 0), p([N("slot")], j.prototype, "slotEl", void 0), p([v()], j.prototype, "anchor", void 0), p([v()], j.prototype, "positioning", void 0), p([v({ type: Boolean })], j.prototype, "quick", void 0), p([v({ type: Boolean, attribute: "has-overflow" })], j.prototype, "hasOverflow", void 0), p([v({ type: Boolean, reflect: !0 })], j.prototype, "open", void 0), p([v({ type: Number, attribute: "x-offset" })], j.prototype, "xOffset", void 0), p([v({ type: Number, attribute: "y-offset" })], j.prototype, "yOffset", void 0), p([v({ type: Boolean, attribute: "no-horizontal-flip" })], j.prototype, "noHorizontalFlip", void 0), p([v({ type: Boolean, attribute: "no-vertical-flip" })], j.prototype, "noVerticalFlip", void 0), p([v({ type: Number, attribute: "typeahead-delay" })], j.prototype, "typeaheadDelay", void 0), p([v({ attribute: "anchor-corner" })], j.prototype, "anchorCorner", void 0), p([v({ attribute: "menu-corner" })], j.prototype, "menuCorner", void 0), p([v({ type: Boolean, attribute: "stay-open-on-outside-click" })], j.prototype, "stayOpenOnOutsideClick", void 0), p([v({ type: Boolean, attribute: "stay-open-on-focusout" })], j.prototype, "stayOpenOnFocusout", void 0), p([v({ type: Boolean, attribute: "skip-restore-focus" })], j.prototype, "skipRestoreFocus", void 0), p([v({ attribute: "default-focus" })], j.prototype, "defaultFocus", void 0), p([v({ type: Boolean, attribute: "no-navigation-wrap" })], j.prototype, "noNavigationWrap", void 0), p([kt({ flatten: !0 })], j.prototype, "slotItems", void 0), p([F()], j.prototype, "typeaheadActive", void 0);
const rp = L`:host{--md-elevation-level: var(--md-menu-container-elevation, 2);--md-elevation-shadow-color: var(--md-menu-container-shadow-color, var(--md-sys-color-shadow, #000));min-width:112px;color:unset;display:contents}md-focus-ring{--md-focus-ring-shape: var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px))}.menu{border-radius:var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px));display:none;inset:auto;border:none;padding:0px;overflow:visible;background-color:rgba(0,0,0,0);color:inherit;opacity:0;z-index:20;position:absolute;user-select:none;max-height:inherit;height:inherit;min-width:inherit;max-width:inherit;scrollbar-width:inherit}.menu::backdrop{display:none}.fixed{position:fixed}.items{display:block;list-style-type:none;margin:0;outline:none;box-sizing:border-box;background-color:var(--md-menu-container-color, var(--md-sys-color-surface-container, #f3edf7));height:inherit;max-height:inherit;overflow:auto;min-width:inherit;max-width:inherit;border-radius:inherit;scrollbar-width:inherit}.item-padding{padding-block:var(--md-menu-top-space, 8px) var(--md-menu-bottom-space, 8px)}.has-overflow:not([popover]) .items{overflow:visible}.has-overflow.animating .items,.animating .items{overflow:hidden}.has-overflow.animating .items{pointer-events:none}.animating ::slotted(.md-menu-hidden){opacity:0}slot{display:block;height:inherit;max-height:inherit}::slotted(:is(md-divider,[role=separator])){margin:8px 0}@media(forced-colors: active){.menu{border-style:solid;border-color:CanvasText;border-width:1px}}
`;
let Gs = class extends j {
};
Gs.styles = [rp], Gs = p([Jt("md-menu")], Gs);
class op extends xr {
  computeValidity(t) {
    return this.selectControl || (this.selectControl = document.createElement("select")), wr(y`<option value=${t.value}></option>`, this.selectControl), this.selectControl.value = t.value, this.selectControl.required = t.required, { validity: this.selectControl.validity, validationMessage: this.selectControl.validationMessage };
  }
  equals(t, e) {
    return t.value === e.value && t.required === e.required;
  }
  copy({ value: t, required: e }) {
    return { value: t, required: e };
  }
}
var ca;
const Si = /* @__PURE__ */ Symbol("value"), ap = Ot(Qn(Br(Ir(hi(G)))));
class Y extends ap {
  get value() {
    return this[Si];
  }
  set value(t) {
    this.lastUserSetValue = t, this.select(t);
  }
  get options() {
    var t;
    return ((t = this.menu) === null || t === void 0 ? void 0 : t.items) ?? [];
  }
  get selectedIndex() {
    const [t, e] = (this.getSelectedOptions() ?? [])[0] ?? [];
    return e ?? -1;
  }
  set selectedIndex(t) {
    this.lastUserSetSelectedIndex = t, this.selectIndex(t);
  }
  get selectedOptions() {
    return (this.getSelectedOptions() ?? []).map((([t]) => t));
  }
  get hasError() {
    return this.error || this.nativeError;
  }
  constructor() {
    super(), this.quick = !1, this.required = !1, this.errorText = "", this.label = "", this.noAsterisk = !1, this.supportingText = "", this.error = !1, this.menuPositioning = "popover", this.clampMenuWidth = !1, this.typeaheadDelay = 200, this.hasLeadingIcon = !1, this.displayText = "", this.menuAlign = "start", this[ca] = "", this.lastUserSetValue = null, this.lastUserSetSelectedIndex = null, this.lastSelectedOption = null, this.lastSelectedOptionRecords = [], this.nativeError = !1, this.nativeErrorText = "", this.focused = !1, this.open = !1, this.defaultFocus = Ui, this.prevOpen = this.open, this.selectWidth = 0, this.addEventListener("focus", this.handleFocus.bind(this)), this.addEventListener("blur", this.handleBlur.bind(this));
  }
  select(t) {
    const e = this.options.find(((i) => i.value === t));
    e && this.selectItem(e);
  }
  selectIndex(t) {
    const e = this.options[t];
    e && this.selectItem(e);
  }
  reset() {
    for (const t of this.options) t.selected = t.hasAttribute("selected");
    this.updateValueAndDisplayText(), this.nativeError = !1, this.nativeErrorText = "";
  }
  showPicker() {
    this.open = !0;
  }
  [(ca = Si, Wi)](t) {
    t?.preventDefault();
    const e = this.getErrorText();
    var i;
    this.nativeError = !!t, this.nativeErrorText = this.validationMessage, e === this.getErrorText() && ((i = this.field) === null || i === void 0 || i.reannounceError());
  }
  update(t) {
    if (this.hasUpdated || this.initUserSelection(), this.prevOpen !== this.open && this.open) {
      const e = this.getBoundingClientRect();
      this.selectWidth = e.width;
    }
    this.prevOpen = this.open, super.update(t);
  }
  render() {
    return y`
      <span
        class="select ${At(this.getRenderClasses())}"
        @focusout=${this.handleFocusout}>
        ${this.renderField()} ${this.renderMenu()}
      </span>
    `;
  }
  async firstUpdated(t) {
    var e;
    await ((e = this.menu) === null || e === void 0 ? void 0 : e.updateComplete), this.lastSelectedOptionRecords.length || this.initUserSelection(), this.lastSelectedOptionRecords.length || this.options.length || setTimeout((() => {
      this.updateValueAndDisplayText();
    })), super.firstUpdated(t);
  }
  getRenderClasses() {
    return { disabled: this.disabled, error: this.error, open: this.open };
  }
  renderField() {
    const t = this.ariaLabel || this.label;
    return es`
      <${this.fieldTag}
          aria-haspopup="listbox"
          role="combobox"
          part="field"
          id="field"
          tabindex=${this.disabled ? "-1" : "0"}
          aria-label=${t || C}
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
    const t = this.label || this.ariaLabel;
    return y`<div class="menu-wrapper">
      <md-menu
        id="listbox"
        .defaultFocus=${this.defaultFocus}
        role="listbox"
        tabindex="-1"
        aria-label=${t || C}
        stay-open-on-focusout
        part="menu"
        exportparts="focus-ring: menu-focus-ring"
        anchor="field"
        style=${ji({ "--__menu-min-width": `${this.selectWidth}px`, "--__menu-max-width": this.clampMenuWidth ? `${this.selectWidth}px` : void 0 })}
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
  handleKeydown(t) {
    if (this.open || this.disabled || !this.menu) return;
    const e = this.menu.typeaheadController, i = t.code === "Space" || t.code === "ArrowDown" || t.code === "ArrowUp" || t.code === "End" || t.code === "Home" || t.code === "Enter";
    if (!e.isTypingAhead && i) {
      switch (t.preventDefault(), this.open = !0, t.code) {
        case "Space":
        case "ArrowDown":
        case "Enter":
          this.defaultFocus = Ui;
          break;
        case "End":
          this.defaultFocus = Gn;
          break;
        case "ArrowUp":
        case "Home":
          this.defaultFocus = rr;
      }
      return;
    }
    if (t.key.length === 1) {
      var r, o;
      e.onKeydown(t), t.preventDefault();
      const { lastActiveRecord: a } = e;
      if (!a) return;
      (r = this.labelEl) === null || r === void 0 || (o = r.setAttribute) === null || o === void 0 || o.call(r, "aria-live", "polite"), this.selectItem(a[Dt]) && this.dispatchInteractionEvents();
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
  handleFocusout(t) {
    t.relatedTarget && sr(t.relatedTarget, this) || (this.open = !1);
  }
  getSelectedOptions() {
    if (!this.menu) return this.lastSelectedOptionRecords = [], null;
    const t = this.menu.items;
    return this.lastSelectedOptionRecords = (function(e) {
      const i = [];
      for (let r = 0; r < e.length; r++) {
        const o = e[r];
        o.selected && i.push([o, r]);
      }
      return i;
    })(t), this.lastSelectedOptionRecords;
  }
  async getUpdateComplete() {
    var t;
    return await ((t = this.menu) === null || t === void 0 ? void 0 : t.updateComplete), super.getUpdateComplete();
  }
  updateValueAndDisplayText() {
    const t = this.getSelectedOptions() ?? [];
    let e = !1;
    if (t.length) {
      const [i] = t[0];
      e = this.lastSelectedOption !== i, this.lastSelectedOption = i, this[Si] = i.value, this.displayText = i.displayText;
    } else e = this.lastSelectedOption !== null, this.lastSelectedOption = null, this[Si] = "", this.displayText = "";
    return e;
  }
  async handleOpening(t) {
    var e, i, r;
    if ((e = this.labelEl) === null || e === void 0 || (i = e.removeAttribute) === null || i === void 0 || i.call(e, "aria-live"), this.redispatchEvent(t), this.defaultFocus !== Ui) return;
    const o = this.menu.items, a = (r = Ye(o)) === null || r === void 0 ? void 0 : r.item;
    let [n] = this.lastSelectedOptionRecords[0] ?? [null];
    a && a !== n && (a.tabIndex = -1), n = n ?? o[0], n && (n.tabIndex = 0, n.focus());
  }
  redispatchEvent(t) {
    ts(this, t);
  }
  handleClosed(t) {
    this.open = !1, this.redispatchEvent(t);
  }
  handleCloseMenu(t) {
    const e = t.detail.reason, i = t.detail.itemPath[0];
    this.open = !1;
    let r = !1;
    var o;
    e.kind === "click-selection" || e.kind === "keydown" && (o = e.key, Object.values(ir).some(((a) => a === o))) ? r = this.selectItem(i) : (i.tabIndex = -1, i.blur()), r && this.dispatchInteractionEvents();
  }
  selectItem(t) {
    return (this.getSelectedOptions() ?? []).forEach((([e]) => {
      t !== e && (e.selected = !1);
    })), t.selected = !0, this.updateValueAndDisplayText();
  }
  handleRequestSelection(t) {
    const e = t.target;
    this.lastSelectedOptionRecords.some((([i]) => i === e)) || this.selectItem(e);
  }
  handleRequestDeselection(t) {
    const e = t.target;
    this.lastSelectedOptionRecords.some((([i]) => i === e)) && this.updateValueAndDisplayText();
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
  [fe]() {
    return this.value;
  }
  formResetCallback() {
    this.reset();
  }
  formStateRestoreCallback(t) {
    this.value = t;
  }
  click() {
    var t;
    (t = this.field) === null || t === void 0 || t.click();
  }
  [si]() {
    return new op((() => this));
  }
  [ri]() {
    return this.field;
  }
}
Y.shadowRootOptions = { ...G.shadowRootOptions, delegatesFocus: !0 }, p([v({ type: Boolean })], Y.prototype, "quick", void 0), p([v({ type: Boolean })], Y.prototype, "required", void 0), p([v({ type: String, attribute: "error-text" })], Y.prototype, "errorText", void 0), p([v()], Y.prototype, "label", void 0), p([v({ type: Boolean, attribute: "no-asterisk" })], Y.prototype, "noAsterisk", void 0), p([v({ type: String, attribute: "supporting-text" })], Y.prototype, "supportingText", void 0), p([v({ type: Boolean, reflect: !0 })], Y.prototype, "error", void 0), p([v({ attribute: "menu-positioning" })], Y.prototype, "menuPositioning", void 0), p([v({ type: Boolean, attribute: "clamp-menu-width" })], Y.prototype, "clampMenuWidth", void 0), p([v({ type: Number, attribute: "typeahead-delay" })], Y.prototype, "typeaheadDelay", void 0), p([v({ type: Boolean, attribute: "has-leading-icon" })], Y.prototype, "hasLeadingIcon", void 0), p([v({ attribute: "display-text" })], Y.prototype, "displayText", void 0), p([v({ attribute: "menu-align" })], Y.prototype, "menuAlign", void 0), p([v()], Y.prototype, "value", null), p([v({ type: Number, attribute: "selected-index" })], Y.prototype, "selectedIndex", null), p([F()], Y.prototype, "nativeError", void 0), p([F()], Y.prototype, "nativeErrorText", void 0), p([F()], Y.prototype, "focused", void 0), p([F()], Y.prototype, "open", void 0), p([F()], Y.prototype, "defaultFocus", void 0), p([N(".field")], Y.prototype, "field", void 0), p([N("md-menu")], Y.prototype, "menu", void 0), p([N("#label")], Y.prototype, "labelEl", void 0), p([kt({ slot: "leading-icon", flatten: !0 })], Y.prototype, "leadingIcons", void 0);
class np extends Y {
  constructor() {
    super(...arguments), this.fieldTag = Yt`md-filled-field`;
  }
}
const lp = L`:host{--_text-field-active-indicator-color: var(--md-filled-select-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-active-indicator-height: var(--md-filled-select-text-field-active-indicator-height, 1px);--_text-field-container-color: var(--md-filled-select-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_text-field-disabled-active-indicator-color: var(--md-filled-select-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-active-indicator-height: var(--md-filled-select-text-field-disabled-active-indicator-height, 1px);--_text-field-disabled-active-indicator-opacity: var(--md-filled-select-text-field-disabled-active-indicator-opacity, 0.38);--_text-field-disabled-container-color: var(--md-filled-select-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-container-opacity: var(--md-filled-select-text-field-disabled-container-opacity, 0.04);--_text-field-disabled-input-text-color: var(--md-filled-select-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-input-text-opacity: var(--md-filled-select-text-field-disabled-input-text-opacity, 0.38);--_text-field-disabled-label-text-color: var(--md-filled-select-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-label-text-opacity: var(--md-filled-select-text-field-disabled-label-text-opacity, 0.38);--_text-field-disabled-leading-icon-color: var(--md-filled-select-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-leading-icon-opacity: var(--md-filled-select-text-field-disabled-leading-icon-opacity, 0.38);--_text-field-disabled-supporting-text-color: var(--md-filled-select-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-supporting-text-opacity: var(--md-filled-select-text-field-disabled-supporting-text-opacity, 0.38);--_text-field-disabled-trailing-icon-color: var(--md-filled-select-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-trailing-icon-opacity: var(--md-filled-select-text-field-disabled-trailing-icon-opacity, 0.38);--_text-field-error-active-indicator-color: var(--md-filled-select-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-active-indicator-color: var(--md-filled-select-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-input-text-color: var(--md-filled-select-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-focus-label-text-color: var(--md-filled-select-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-leading-icon-color: var(--md-filled-select-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-focus-supporting-text-color: var(--md-filled-select-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-trailing-icon-color: var(--md-filled-select-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-active-indicator-color: var(--md-filled-select-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-input-text-color: var(--md-filled-select-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-label-text-color: var(--md-filled-select-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-leading-icon-color: var(--md-filled-select-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-hover-state-layer-color: var(--md-filled-select-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-state-layer-opacity: var(--md-filled-select-text-field-error-hover-state-layer-opacity, 0.08);--_text-field-error-hover-supporting-text-color: var(--md-filled-select-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-trailing-icon-color: var(--md-filled-select-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-input-text-color: var(--md-filled-select-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-label-text-color: var(--md-filled-select-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-leading-icon-color: var(--md-filled-select-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-supporting-text-color: var(--md-filled-select-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-trailing-icon-color: var(--md-filled-select-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-focus-active-indicator-color: var(--md-filled-select-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-active-indicator-height: var(--md-filled-select-text-field-focus-active-indicator-height, 3px);--_text-field-focus-input-text-color: var(--md-filled-select-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-focus-label-text-color: var(--md-filled-select-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-leading-icon-color: var(--md-filled-select-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-supporting-text-color: var(--md-filled-select-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-trailing-icon-color: var(--md-filled-select-text-field-focus-trailing-icon-color, var(--md-sys-color-primary, #6750a4));--_text-field-hover-active-indicator-color: var(--md-filled-select-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-active-indicator-height: var(--md-filled-select-text-field-hover-active-indicator-height, 1px);--_text-field-hover-input-text-color: var(--md-filled-select-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-label-text-color: var(--md-filled-select-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-leading-icon-color: var(--md-filled-select-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-state-layer-color: var(--md-filled-select-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-state-layer-opacity: var(--md-filled-select-text-field-hover-state-layer-opacity, 0.08);--_text-field-hover-supporting-text-color: var(--md-filled-select-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-trailing-icon-color: var(--md-filled-select-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-input-text-color: var(--md-filled-select-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-input-text-font: var(--md-filled-select-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-input-text-line-height: var(--md-filled-select-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-input-text-size: var(--md-filled-select-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-input-text-weight: var(--md-filled-select-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-label-text-color: var(--md-filled-select-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-label-text-font: var(--md-filled-select-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-label-text-line-height: var(--md-filled-select-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-label-text-populated-line-height: var(--md-filled-select-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-label-text-populated-size: var(--md-filled-select-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-label-text-size: var(--md-filled-select-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-label-text-weight: var(--md-filled-select-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-leading-icon-color: var(--md-filled-select-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-leading-icon-size: var(--md-filled-select-text-field-leading-icon-size, 24px);--_text-field-supporting-text-color: var(--md-filled-select-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-supporting-text-font: var(--md-filled-select-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-supporting-text-line-height: var(--md-filled-select-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-supporting-text-size: var(--md-filled-select-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-supporting-text-weight: var(--md-filled-select-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-trailing-icon-color: var(--md-filled-select-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-trailing-icon-size: var(--md-filled-select-text-field-trailing-icon-size, 24px);--_text-field-container-shape-start-start: var(--md-filled-select-text-field-container-shape-start-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-start-end: var(--md-filled-select-text-field-container-shape-start-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-end: var(--md-filled-select-text-field-container-shape-end-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_text-field-container-shape-end-start: var(--md-filled-select-text-field-container-shape-end-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--md-filled-field-active-indicator-color: var(--_text-field-active-indicator-color);--md-filled-field-active-indicator-height: var(--_text-field-active-indicator-height);--md-filled-field-container-color: var(--_text-field-container-color);--md-filled-field-container-shape-end-end: var(--_text-field-container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_text-field-container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_text-field-container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_text-field-container-shape-start-start);--md-filled-field-content-color: var(--_text-field-input-text-color);--md-filled-field-content-font: var(--_text-field-input-text-font);--md-filled-field-content-line-height: var(--_text-field-input-text-line-height);--md-filled-field-content-size: var(--_text-field-input-text-size);--md-filled-field-content-weight: var(--_text-field-input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_text-field-disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_text-field-disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_text-field-disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_text-field-disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_text-field-disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_text-field-disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_text-field-disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_text-field-disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_text-field-disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_text-field-disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_text-field-disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_text-field-disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_text-field-disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_text-field-disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_text-field-disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_text-field-error-active-indicator-color);--md-filled-field-error-content-color: var(--_text-field-error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_text-field-error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_text-field-error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_text-field-error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_text-field-error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_text-field-error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_text-field-error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_text-field-error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_text-field-error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_text-field-error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_text-field-error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_text-field-error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_text-field-error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_text-field-error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_text-field-error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_text-field-error-label-text-color);--md-filled-field-error-leading-content-color: var(--_text-field-error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_text-field-error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_text-field-error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_text-field-focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_text-field-focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_text-field-focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_text-field-focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_text-field-focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_text-field-focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_text-field-focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_text-field-hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_text-field-hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_text-field-hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_text-field-hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_text-field-hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_text-field-hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_text-field-hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_text-field-hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_text-field-hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_text-field-label-text-color);--md-filled-field-label-text-font: var(--_text-field-label-text-font);--md-filled-field-label-text-line-height: var(--_text-field-label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_text-field-label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_text-field-label-text-populated-size);--md-filled-field-label-text-size: var(--_text-field-label-text-size);--md-filled-field-label-text-weight: var(--_text-field-label-text-weight);--md-filled-field-leading-content-color: var(--_text-field-leading-icon-color);--md-filled-field-supporting-text-color: var(--_text-field-supporting-text-color);--md-filled-field-supporting-text-font: var(--_text-field-supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_text-field-supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_text-field-supporting-text-size);--md-filled-field-supporting-text-weight: var(--_text-field-supporting-text-weight);--md-filled-field-trailing-content-color: var(--_text-field-trailing-icon-color)}[has-start] .icon.leading{font-size:var(--_text-field-leading-icon-size);height:var(--_text-field-leading-icon-size);width:var(--_text-field-leading-icon-size)}.icon.trailing{font-size:var(--_text-field-trailing-icon-size);height:var(--_text-field-trailing-icon-size);width:var(--_text-field-trailing-icon-size)}
`, cp = L`:host{color:unset;min-width:210px;display:flex}.field{cursor:default;outline:none}.select{position:relative;flex-direction:column}.icon.trailing svg,.icon ::slotted(*){fill:currentColor}.icon ::slotted(*){width:inherit;height:inherit;font-size:inherit}.icon slot{display:flex;height:100%;width:100%;align-items:center;justify-content:center}.icon.trailing :is(.up,.down){opacity:0;transition:opacity 75ms linear 75ms}.select:not(.open) .down,.select.open .up{opacity:1}.field,.select,md-menu{min-width:inherit;width:inherit;max-width:inherit;display:flex}md-menu{min-width:var(--__menu-min-width);max-width:var(--__menu-max-width, inherit)}.menu-wrapper{width:0px;height:0px;max-width:inherit}md-menu ::slotted(:not[disabled]){cursor:pointer}.field,.select{width:100%}:host{display:inline-flex}:host([disabled]){pointer-events:none}
`;
class da extends np {
}
da.styles = [cp, lp], customElements.define("ew-filled-select", da);
const dp = L`:host{display:flex;--md-ripple-hover-color: var(--md-menu-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-menu-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-menu-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-menu-item-pressed-state-layer-opacity, 0.12)}:host([disabled]){opacity:var(--md-menu-item-disabled-opacity, 0.3);pointer-events:none}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}.list-item:not(.disabled){cursor:pointer}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;color:var(--md-menu-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-menu-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-menu-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-menu-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-menu-item-one-line-container-height, 56px);padding-top:var(--md-menu-item-top-space, 12px);padding-bottom:var(--md-menu-item-bottom-space, 12px);padding-inline-start:var(--md-menu-item-leading-space, 16px);padding-inline-end:var(--md-menu-item-trailing-space, 16px)}md-item[multiline]{min-height:var(--md-menu-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-menu-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-menu-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-menu-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-menu-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-menu-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-menu-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-menu-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-menu-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}.list-item{background-color:var(--md-menu-item-container-color, transparent)}.list-item.selected{background-color:var(--md-menu-item-selected-container-color, var(--md-sys-color-secondary-container, #e8def8))}.selected:not(.disabled) ::slotted(*){color:var(--md-menu-item-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b))}@media(forced-colors: active){:host([disabled]),:host([disabled]) slot{color:GrayText;opacity:1}.list-item{position:relative}.list-item.selected::before{content:"";position:absolute;inset:0;box-sizing:border-box;border-radius:inherit;pointer-events:none;border:3px double CanvasText}}
`;
class hp {
  constructor(t, e) {
    this.host = t, this.internalTypeaheadText = null, this.onClick = () => {
      this.host.keepOpen || this.host.dispatchEvent(na(this.host, { kind: jA }));
    }, this.onKeydown = (i) => {
      if (this.host.href && i.code === "Enter") {
        const o = this.getInteractiveElement();
        o instanceof HTMLAnchorElement && o.click();
      }
      if (i.defaultPrevented) return;
      const r = i.code;
      this.host.keepOpen && r !== "Escape" || Hn(r) && (i.preventDefault(), this.host.dispatchEvent(na(this.host, { kind: WA, key: r })));
    }, this.getHeadlineElements = e.getHeadlineElements, this.getSupportingTextElements = e.getSupportingTextElements, this.getDefaultElements = e.getDefaultElements, this.getInteractiveElement = e.getInteractiveElement, this.host.addController(this);
  }
  get typeaheadText() {
    if (this.internalTypeaheadText !== null) return this.internalTypeaheadText;
    const t = this.getHeadlineElements(), e = [];
    return t.forEach(((i) => {
      i.textContent && i.textContent.trim() && e.push(i.textContent.trim());
    })), e.length === 0 && this.getDefaultElements().forEach(((i) => {
      i.textContent && i.textContent.trim() && e.push(i.textContent.trim());
    })), e.length === 0 && this.getSupportingTextElements().forEach(((i) => {
      i.textContent && i.textContent.trim() && e.push(i.textContent.trim());
    })), e.join(" ");
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
  setTypeaheadText(t) {
    this.internalTypeaheadText = t;
  }
}
class Ap {
  get role() {
    return this.menuItemController.role;
  }
  get typeaheadText() {
    return this.menuItemController.typeaheadText;
  }
  setTypeaheadText(t) {
    this.menuItemController.setTypeaheadText(t);
  }
  get displayText() {
    return this.internalDisplayText !== null ? this.internalDisplayText : this.menuItemController.typeaheadText;
  }
  setDisplayText(t) {
    this.internalDisplayText = t;
  }
  constructor(t, e) {
    this.host = t, this.internalDisplayText = null, this.firstUpdate = !0, this.onClick = () => {
      this.menuItemController.onClick();
    }, this.onKeydown = (i) => {
      this.menuItemController.onKeydown(i);
    }, this.lastSelected = this.host.selected, this.menuItemController = new hp(t, e), t.addController(this);
  }
  hostUpdate() {
    this.lastSelected !== this.host.selected && (this.host.ariaSelected = this.host.selected ? "true" : "false");
  }
  hostUpdated() {
    this.lastSelected === this.host.selected || this.firstUpdate || (this.host.selected ? this.host.dispatchEvent(new Event("request-selection", { bubbles: !0, composed: !0 })) : this.host.dispatchEvent(new Event("request-deselection", { bubbles: !0, composed: !0 }))), this.lastSelected = this.host.selected, this.firstUpdate = !1;
  }
}
const pp = Ot(G);
class pt extends pp {
  constructor() {
    super(...arguments), this.disabled = !1, this.isMenuItem = !0, this.selected = !1, this.value = "", this.type = "option", this.selectOptionController = new Ap(this, { getHeadlineElements: () => this.headlineElements, getSupportingTextElements: () => this.supportingTextElements, getDefaultElements: () => this.defaultElements, getInteractiveElement: () => this.listItemRoot });
  }
  get typeaheadText() {
    return this.selectOptionController.typeaheadText;
  }
  set typeaheadText(t) {
    this.selectOptionController.setTypeaheadText(t);
  }
  get displayText() {
    return this.selectOptionController.displayText;
  }
  set displayText(t) {
    this.selectOptionController.setDisplayText(t);
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
  renderListItem(t) {
    return y`
      <li
        id="item"
        tabindex=${this.disabled ? -1 : 0}
        role=${this.selectOptionController.role}
        aria-label=${this.ariaLabel || C}
        aria-selected=${this.ariaSelected || C}
        aria-checked=${this.ariaChecked || C}
        aria-expanded=${this.ariaExpanded || C}
        aria-haspopup=${this.ariaHasPopup || C}
        class="list-item ${At(this.getRenderClasses())}"
        @click=${this.selectOptionController.onClick}
        @keydown=${this.selectOptionController.onKeydown}
        >${t}</li
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
    var t;
    (t = this.listItemRoot) === null || t === void 0 || t.focus();
  }
}
pt.shadowRootOptions = { ...G.shadowRootOptions, delegatesFocus: !0 }, p([v({ type: Boolean, reflect: !0 })], pt.prototype, "disabled", void 0), p([v({ type: Boolean, attribute: "md-menu-item", reflect: !0 })], pt.prototype, "isMenuItem", void 0), p([v({ type: Boolean })], pt.prototype, "selected", void 0), p([v()], pt.prototype, "value", void 0), p([N(".list-item")], pt.prototype, "listItemRoot", void 0), p([kt({ slot: "headline" })], pt.prototype, "headlineElements", void 0), p([kt({ slot: "supporting-text" })], pt.prototype, "supportingTextElements", void 0), p([/* @__PURE__ */ (function(s) {
  return (t, e) => {
    const { slot: i } = s ?? {}, r = "slot" + (i ? `[name=${i}]` : ":not([name])");
    return Xi(t, e, { get() {
      var o;
      const a = (o = this.renderRoot) === null || o === void 0 ? void 0 : o.querySelector(r);
      return a?.assignedNodes(s) ?? [];
    } });
  };
})({ slot: "" })], pt.prototype, "defaultElements", void 0), p([v({ attribute: "typeahead-text" })], pt.prototype, "typeaheadText", null), p([v({ attribute: "display-text" })], pt.prototype, "displayText", null);
class ha extends pt {
}
ha.styles = [dp], customElements.define("ew-select-option", ha);
const gp = Ot(G);
class Qe extends gp {
  constructor() {
    super(...arguments), this.value = 0, this.max = 1, this.indeterminate = !1, this.fourColor = !1;
  }
  render() {
    const { ariaLabel: t } = this;
    return y`
      <div
        class="progress ${At(this.getRenderClasses())}"
        role="progressbar"
        aria-label="${t || C}"
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${this.indeterminate ? C : this.value}
        >${this.renderIndicator()}</div
      >
    `;
  }
  getRenderClasses() {
    return { indeterminate: this.indeterminate, "four-color": this.fourColor };
  }
}
p([v({ type: Number })], Qe.prototype, "value", void 0), p([v({ type: Number })], Qe.prototype, "max", void 0), p([v({ type: Boolean })], Qe.prototype, "indeterminate", void 0), p([v({ type: Boolean, attribute: "four-color" })], Qe.prototype, "fourColor", void 0);
class up extends Qe {
  renderIndicator() {
    return this.indeterminate ? this.renderIndeterminateContainer() : this.renderDeterminateContainer();
  }
  renderDeterminateContainer() {
    const t = 100 * (1 - this.value / this.max);
    return y`
      <svg viewBox="0 0 4800 4800">
        <circle class="track" pathLength="100"></circle>
        <circle
          class="active-track"
          pathLength="100"
          stroke-dashoffset=${t}></circle>
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
const fp = L`:host{--_active-indicator-color: var(--md-circular-progress-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-width: var(--md-circular-progress-active-indicator-width, 10);--_four-color-active-indicator-four-color: var(--md-circular-progress-four-color-active-indicator-four-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_four-color-active-indicator-one-color: var(--md-circular-progress-four-color-active-indicator-one-color, var(--md-sys-color-primary, #6750a4));--_four-color-active-indicator-three-color: var(--md-circular-progress-four-color-active-indicator-three-color, var(--md-sys-color-tertiary, #7d5260));--_four-color-active-indicator-two-color: var(--md-circular-progress-four-color-active-indicator-two-color, var(--md-sys-color-primary-container, #eaddff));--_size: var(--md-circular-progress-size, 48px);display:inline-flex;vertical-align:middle;width:var(--_size);height:var(--_size);position:relative;align-items:center;justify-content:center;contain:strict;content-visibility:auto}.progress{flex:1;align-self:stretch;margin:4px}.progress,.spinner,.left,.right,.circle,svg,.track,.active-track{position:absolute;inset:0}svg{transform:rotate(-90deg)}circle{cx:50%;cy:50%;r:calc(50%*(1 - var(--_active-indicator-width)/100));stroke-width:calc(var(--_active-indicator-width)*1%);stroke-dasharray:100;fill:rgba(0,0,0,0)}.active-track{transition:stroke-dashoffset 500ms cubic-bezier(0, 0, 0.2, 1);stroke:var(--_active-indicator-color)}.track{stroke:rgba(0,0,0,0)}.progress.indeterminate{animation:linear infinite linear-rotate;animation-duration:1568.2352941176ms}.spinner{animation:infinite both rotate-arc;animation-duration:5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.left{overflow:hidden;inset:0 50% 0 0}.right{overflow:hidden;inset:0 0 0 50%}.circle{box-sizing:border-box;border-radius:50%;border:solid calc(var(--_active-indicator-width)/100*(var(--_size) - 8px));border-color:var(--_active-indicator-color) var(--_active-indicator-color) rgba(0,0,0,0) rgba(0,0,0,0);animation:expand-arc;animation-iteration-count:infinite;animation-fill-mode:both;animation-duration:1333ms,5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.four-color .circle{animation-name:expand-arc,four-color}.left .circle{rotate:135deg;inset:0 -100% 0 0}.right .circle{rotate:100deg;inset:0 0 0 -100%;animation-delay:-666.5ms,0ms}@media(forced-colors: active){.active-track{stroke:CanvasText}.circle{border-color:CanvasText CanvasText Canvas Canvas}}@keyframes expand-arc{0%{transform:rotate(265deg)}50%{transform:rotate(130deg)}100%{transform:rotate(265deg)}}@keyframes rotate-arc{12.5%{transform:rotate(135deg)}25%{transform:rotate(270deg)}37.5%{transform:rotate(405deg)}50%{transform:rotate(540deg)}62.5%{transform:rotate(675deg)}75%{transform:rotate(810deg)}87.5%{transform:rotate(945deg)}100%{transform:rotate(1080deg)}}@keyframes linear-rotate{to{transform:rotate(360deg)}}@keyframes four-color{0%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}15%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}25%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}40%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}50%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}65%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}75%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}90%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}100%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}}
`;
class Aa extends up {
}
Aa.styles = [fp], customElements.define("ew-circular-progress", Aa);
class Ri extends G {
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
Ri.styles = L`
    :host {
      display: flex;
      flex-direction: column;
      text-align: center;
    }
    ew-circular-progress {
      margin-bottom: 16px;
    }
  `, p([v()], Ri.prototype, "label", void 0), p([v()], Ri.prototype, "progress", void 0), customElements.define("ewt-page-progress", Ri);
class Di extends G {
  render() {
    return y`
      <div class="icon">${this.icon}</div>
      ${this.label}
    `;
  }
}
Di.styles = L`
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
  `, p([v()], Di.prototype, "icon", void 0), p([v()], Di.prototype, "label", void 0), customElements.define("ewt-page-message", Di);
const mp = ot`
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
    />
  </svg>
`, vp = ot`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q95-97 219.5-148.5T480-800q137 0 261 51t219 149L480-120ZM174-540q67-48 145-74t161-26q83 0 161 26t145 74l58-58q-79-60-172-91t-192-31q-99 0-192 31t-172 91l58 58Z"
    />
  </svg>
`, _p = ot`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM232-482q53-38 116-59.5T480-563q69 0 132 21.5T728-482l116-116q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l116 116Z"
    />
  </svg>
`, Ep = ot`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM299-415q38-28 84-43.5t97-15.5q51 0 97 15.5t84 43.5l183-183q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l183 183Z"
    />
  </svg>
`, wp = ot`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM361-353q25-18 55.5-28t63.5-10q33 0 63.5 10t55.5 28l245-245q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l245 245Z"
    />
  </svg>
`, bp = ot`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"
    />
  </svg>
`, yp = ot`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M240-160h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM240-160v-400 400Zm0 80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h280v-80q0-83 58.5-141.5T720-920q83 0 141.5 58.5T920-720h-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80h120q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Z"
    />
  </svg>
`, pa = ot`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
  </svg>
`, Cp = ot`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z" />
  </svg>
`, ga = ot`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M20,19V7H4V19H20M20,3A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5C2,3.89 2.9,3 4,3H20M13,17V15H18V17H13M9.58,13L5.57,9H8.4L11.7,12.3C12.09,12.69 12.09,13.33 11.7,13.72L8.42,17H5.59L9.58,13Z" />
  </svg>
`, ua = ot`
  <svg slot="start" viewBox="0 0 24 24">
  <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
  </svg>
`, fa = ot`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="m12.151 1.5882c-.3262 0-.6523.1291-.8996.3867l-8.3848 8.7354c-.0619.0644-.1223.1368-.1807.2154-.0588.0789-.1151.1638-.1688.2534-.2593.4325-.4552.9749-.5232 1.4555-.0026.018-.0076.0369-.0094.0548-.0121.0987-.0184.1944-.0184.2857v8.0124a1.2731 1.2731 0 001.2731 1.2731h7.8313l-3.4484-3.593a1.7399 1.7399 0 111.0803-1.125l2.6847 2.7972v-10.248a1.7399 1.7399 0 111.5276-0v7.187l2.6702-2.782a1.7399 1.7399 0 111.0566 1.1505l-3.7269 3.8831v2.7299h8.174a1.2471 1.2471 0 001.2471-1.2471v-8.0375c0-.0912-.0059-.1868-.0184-.2855-.0603-.4935-.2636-1.0617-.5326-1.5105-.0537-.0896-.1101-.1745-.1684-.253-.0588-.079-.1191-.1513-.181-.2158l-8.3848-8.7363c-.2473-.2577-.5735-.3866-.8995-.3864" />
  </svg>
`, Bp = ot`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M15,14C17.67,14 23,15.33 23,18V20H7V18C7,15.33 12.33,14 15,14M15,12A4,4 0 0,1 11,8A4,4 0 0,1 15,4A4,4 0 0,1 19,8A4,4 0 0,1 15,12M5,9.59L7.12,7.46L8.54,8.88L6.41,11L8.54,13.12L7.12,14.54L5,12.41L2.88,14.54L1.46,13.12L3.59,11L1.46,8.88L2.88,7.46L5,9.59Z" />
  </svg>
`, Ip = ot`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
  </svg>
`, xp = [73, 77, 80, 82, 79, 86, 1];
var ue, vt;
(function(s) {
  s[s.CURRENT_STATE = 1] = "CURRENT_STATE", s[s.ERROR_STATE = 2] = "ERROR_STATE", s[s.RPC = 3] = "RPC", s[s.RPC_RESULT = 4] = "RPC_RESULT";
})(ue || (ue = {})), (function(s) {
  s[s.STOPPED = 0] = "STOPPED", s[s.READY = 2] = "READY", s[s.PROVISIONING = 3] = "PROVISIONING", s[s.PROVISIONED = 4] = "PROVISIONED";
})(vt || (vt = {}));
const Sp = { 0: "NO_ERROR", 1: "INVALID_RPC_PACKET", 2: "UNKNOWN_RPC_COMMAND", 3: "UNABLE_TO_CONNECT", 5: "BAD_HOSTNAME", 254: "TIMEOUT", 255: "UNKNOWN_ERROR" };
class Ln extends Error {
  constructor() {
    super("Port is not ready");
  }
}
const ma = (s) => "[" + s.map(((t) => ((e, i = 2) => {
  let r = e.toString(16).toUpperCase();
  return r.startsWith("-") ? "-0x" + r.substring(1).padStart(i, "0") : "0x" + r.padStart(i, "0");
})(t))).join(", ") + "]", Yn = (s) => s.sort(((t, e) => t.name.toLocaleLowerCase().localeCompare(e.name.toLocaleLowerCase()))), Rp = (s, t) => {
  const e = /* @__PURE__ */ new Map();
  for (const i of s) e.set(i.name, i);
  for (const i of t) e.set(i.name, i);
  return Yn(Array.from(e.values()));
}, Dp = (s, t) => s.length !== t.length || s.some(((e, i) => e.name !== t[i].name || e.rssi !== t[i].rssi || e.secured !== t[i].secured));
class Mp extends EventTarget {
  get error() {
    return this._error;
  }
  set error(t) {
    this._error = t, this.dispatchEvent(new CustomEvent("error-changed", { detail: this._error }));
  }
  constructor(t, e) {
    if (super(), this.port = t, this.logger = e, this._error = 0, this._rpcLock = Promise.resolve(), t.readable === null) throw new Error("Port is not readable");
    if (t.writable === null) throw new Error("Port is not writable");
  }
  async initialize(t = 1e3) {
    if (this.logger.log("Initializing Improv Serial"), this._processInput(), this._reader === void 0) throw new Ln();
    let e;
    try {
      await new Promise((async (i, r) => {
        setTimeout((() => r(new Error("Improv Wi-Fi Serial not detected"))), t), e = setInterval((() => this._sendRPC(2, [])), 1e3), await this.requestCurrentState(), i(void 0);
      })), clearInterval(e), await this.requestInfo();
    } catch (i) {
      throw await this.close(), i;
    } finally {
      clearInterval(e);
    }
    return this.info;
  }
  async close() {
    this._reader && await new Promise(((t) => {
      this._reader.cancel(), this.addEventListener("disconnect", t, { once: !0 });
    }));
  }
  async requestCurrentState() {
    var t;
    const e = new AbortController();
    let i;
    try {
      await new Promise(((r, o) => {
        this.addEventListener("state-changed", (() => r()), { once: !0, signal: e.signal }), i = this._sendRPCWithResponse(2, []), i.catch(o);
      }));
    } catch (r) {
      throw new Error(`Error fetching current state: ${r}`);
    } finally {
      e.abort();
    }
    this.state === vt.PROVISIONED ? this.nextUrl = (await i)[0] : (t = this._rpcFeedback) === null || t === void 0 || t.resolve([]);
  }
  async requestInfo(t) {
    const e = await this._sendRPCWithResponse(3, [], t);
    this.info = { firmware: e[0], version: e[1], name: e[3], chipFamily: e[2], osName: e.length > 4 ? e[4] : null, osVersion: e.length > 5 ? e[5] : null };
  }
  async provision(t, e, i) {
    const r = new TextEncoder(), o = r.encode(t), a = r.encode(e), n = [o.length, ...o, a.length, ...a], l = await this._sendRPCWithResponse(1, n, i);
    this.nextUrl = l[0];
  }
  async scan(t) {
    const e = (await this._sendRPCWithMultipleResponses(4, [], t)).map((([i, r, o]) => ({ name: i, rssi: parseInt(r), secured: o !== "NO" })));
    return Yn(e);
  }
  subscribeSSIDs(t) {
    let e, i, r = !0;
    const o = (async () => {
      for (; r; ) {
        let a;
        try {
          a = await this.scan(3e4);
        } catch (l) {
          this.logger.error("Error while scanning for Wi-Fi networks", l), r && e === void 0 && t(null);
          break;
        }
        if (!r) break;
        const n = e === void 0 ? a : Rp(e, a);
        (e === void 0 || Dp(e, n)) && (e = n, t(n)), await new Promise(((l) => {
          i = l, setTimeout(l, 3e3);
        }));
      }
    })();
    return () => (r = !1, i?.(), o);
  }
  async getHostname(t) {
    return (await this._sendRPCWithResponse(5, [], t))[0];
  }
  async setHostname(t, e) {
    const i = new TextEncoder();
    return (await this._sendRPCWithResponse(5, [...i.encode(t)], e))[0];
  }
  async getDeviceName(t) {
    return (await this._sendRPCWithResponse(6, [], t))[0];
  }
  async setDeviceName(t, e) {
    const i = new TextEncoder(), r = await this._sendRPCWithResponse(6, [...i.encode(t)], e);
    return this.info && (this.info.name = r[0]), r[0];
  }
  async requestNetworkState(t) {
    const e = await this._sendRPCWithResponse(7, [], t), i = parseInt(e[0]);
    return { online: (1 & i) != 0, supportsWifi: (2 & i) != 0, supportsEthernet: (4 & i) != 0, supportsThread: (8 & i) != 0, supportsModem: (16 & i) != 0, urls: e.slice(1) };
  }
  _sendRPC(t, e) {
    this.writePacketToStream(ue.RPC, [t, e.length, ...e]);
  }
  _enqueueRPC(t, e) {
    const i = () => this._awaitRPCResultWithTimeout(t(), e).finally((() => {
      this._rpcFeedback = void 0;
    })), r = this._rpcLock.then(i, i);
    return this._rpcLock = r.catch((() => {
    })), r;
  }
  _sendRPCWithResponse(t, e, i = 3e4) {
    return this._enqueueRPC((() => new Promise(((r, o) => {
      this._rpcFeedback = { command: t, resolve: r, reject: o }, this._sendRPC(t, e);
    }))), i);
  }
  _sendRPCWithMultipleResponses(t, e, i = 3e4) {
    return this._enqueueRPC((() => new Promise(((r, o) => {
      this._rpcFeedback = { command: t, resolve: r, reject: o, receivedData: [] }, this._sendRPC(t, e);
    }))), i);
  }
  async _awaitRPCResultWithTimeout(t, e) {
    if (!e) return await t;
    const i = setTimeout((() => this._setError(254)), e);
    try {
      return await t;
    } finally {
      clearTimeout(i);
    }
  }
  async _processInput() {
    this.logger.debug("Starting read loop"), this._reader = this.port.readable.getReader();
    try {
      let t, e = [], i = 0;
      for (; ; ) {
        const { value: r, done: o } = await this._reader.read();
        if (o) break;
        if (r && r.length !== 0) for (const a of r) {
          if (t === !1) {
            a === 10 && (t = void 0);
            continue;
          }
          if (t === !0) {
            e.push(a), e.length === i && (this._handleIncomingPacket(e), t = void 0, e = []);
            continue;
          }
          if (a === 10) {
            e = [];
            continue;
          }
          if (e.push(a), e.length === 9) {
            if (t = String.fromCharCode(...e.slice(0, 6)) === "IMPROV", !t) {
              e = [];
              continue;
            }
            i = 9 + e[8] + 1;
          }
        }
      }
    } catch (t) {
      this.logger.error("Error while reading serial port", t);
    } finally {
      this._reader.releaseLock(), this._reader = void 0;
    }
    this.logger.debug("Finished read loop"), this.dispatchEvent(new Event("disconnect"));
  }
  _handleIncomingPacket(t) {
    const e = t.slice(6), i = e[0], r = e[1], o = e[2], a = e.slice(3, 3 + o);
    if (this.logger.debug("PROCESS", { version: i, packetType: r, packetLength: o, data: ma(a) }), i !== 1) return void this.logger.error("Received unsupported version", i);
    let n = e[3 + o], l = 0;
    for (let c = 0; c < t.length - 1; c++) l += t[c];
    if (l &= 255, l === n) if (r === ue.CURRENT_STATE) this.state = a[0], this.dispatchEvent(new CustomEvent("state-changed", { detail: this.state }));
    else if (r === ue.ERROR_STATE) this._setError(a[0]);
    else if (r === ue.RPC_RESULT) {
      if (!this._rpcFeedback) return void this.logger.error("Received result while not waiting for one");
      const c = a[0];
      if (c !== this._rpcFeedback.command) return void this.logger.error(`Received result for command ${c} but expected ${this._rpcFeedback.command}`);
      const d = [], h = a[1], g = new TextDecoder("utf-8");
      let A = 2;
      for (; A < 2 + h; ) d.push(g.decode(new Uint8Array(a.slice(A + 1, A + a[A] + 1)))), A += a[A] + 1;
      "receivedData" in this._rpcFeedback ? d.length > 0 ? this._rpcFeedback.receivedData.push(d) : this._rpcFeedback.resolve(this._rpcFeedback.receivedData) : this._rpcFeedback.resolve(d);
    } else this.logger.error("Unable to handle packet", e);
    else this.logger.error(`Received invalid checksum ${n}. Expected ${l}`);
  }
  async writePacketToStream(t, e) {
    const i = new Uint8Array([...xp, t, e.length, ...e, 0, 0]);
    i[i.length - 2] = 255 & i.reduce(((o, a) => o + a), 0), i[i.length - 1] = 10, this.logger.debug("Writing to stream:", ma(new Array(...i)));
    const r = this.port.writable.getWriter();
    await r.write(i);
    try {
      r.releaseLock();
    } catch (o) {
      console.error("Ignoring release lock error", o);
    }
  }
  _setError(t) {
    t > 0 && this._rpcFeedback && this._rpcFeedback.reject(Sp[t] || `UNKNOWN_ERROR (${t})`), this.error = t;
  }
}
const ke = async (s, t) => {
  await s.setRTS(!0), await me(100), await t.after();
}, Tp = (s, t = "") => {
  const e = new Blob([s], { type: "text/plain" }), i = URL.createObjectURL(e);
  ((r, o = "") => {
    const a = document.createElement("a");
    a.target = "_blank", a.href = r, a.download = o, document.body.appendChild(a), a.dispatchEvent(new MouseEvent("click")), document.body.removeChild(a);
  })(i, t), setTimeout((() => URL.revokeObjectURL(i)), 0);
};
console.log("ESP Web Tools 10.4.0 by Open Home Foundation; https://esphome.github.io/esp-web-tools/");
const $s = "⚠️";
class lt extends G {
  constructor() {
    super(...arguments), this.logger = console, this._state = "DASHBOARD", this._installErase = !1, this._installConfirmed = !1, this._provisionForce = !1, this._wasProvisioned = !1, this._busy = !1, this._selectedSsid = null, this._manualSsid = "", this._bodyOverflow = null, this._handleDisconnect = () => {
      this._state = "ERROR", this._error = "Disconnected";
    };
  }
  render() {
    if (!this.port) return y``;
    let t, e, i = !1;
    return this._client === void 0 && this._state !== "INSTALL" && this._state !== "LOGS" ? this._error ? [t, e] = this._renderError(this._error) : e = this._renderProgress("Connecting") : this._state === "INSTALL" ? [t, e, i] = this._renderInstall() : this._state === "ASK_ERASE" ? [t, e] = this._renderAskErase() : this._state === "ERROR" ? [t, e] = this._renderError(this._error) : this._state === "DASHBOARD" ? [t, e, i] = this._client ? this._renderDashboard() : this._renderDashboardNoImprov() : this._state === "PROVISION" ? [t, e] = this._renderProvision() : this._state === "LOGS" && ([t, e] = this._renderLogs()), y`
      <ew-dialog
        open
        .heading=${t}
        @cancel=${this._preventDefault}
        @closed=${this._handleClose}
      >
        ${t ? y`<div slot="headline">${t}</div>` : ""}
        ${i ? y`
              <ew-icon-button slot="headline" @click=${this._closeDialog}>
                ${mp}
              </ew-icon-button>
            ` : ""}
        ${e}
      </ew-dialog>
    `;
  }
  _renderProgress(t, e) {
    return y`
      <ewt-page-progress
        slot="content"
        .label=${t}
        .progress=${e}
      ></ewt-page-progress>
    `;
  }
  _renderError(t) {
    return ["Error", y`
      <ewt-page-message
        slot="content"
        .icon=${$s}
        .label=${t}
      ></ewt-page-message>
      <div slot="actions">
        <ew-text-button @click=${this._closeDialog}>Close</ew-text-button>
      </div>
    `];
  }
  _renderDashboard() {
    const t = this._manifest.name;
    let e;
    return e = y`
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
                  ${pa}
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
                  ${ua}
                  <div slot="headline">Visit Device</div>
                </ew-list-item>
              `}
          ${this._manifest.home_assistant_domain && this._client.state === vt.PROVISIONED ? y`
                <ew-list-item
                  type="link"
                  href=${`https://my.home-assistant.io/redirect/config_flow_start/?domain=${this._manifest.home_assistant_domain}`}
                  target="_blank"
                >
                  ${fa}
                  <div slot="headline">Add to Home Assistant</div>
                </ew-list-item>
              ` : ""}
          <ew-list-item
            type="button"
            @click=${() => {
      this._state = "PROVISION", this._client.state === vt.PROVISIONED && (this._provisionForce = !0);
    }}
          >
            ${Cp}
            <div slot="headline">
              ${this._client.state === vt.PROVISIONED ? "Change Wi-Fi" : "Connect to Wi-Fi"}
            </div>
          </ew-list-item>
          <ew-list-item
            type="button"
            @click=${async () => {
      const i = this._client;
      i && (await this._closeClientWithoutEvents(i), await me(100)), this._client = void 0, this._state = "LOGS";
    }}
          >
            ${ga}
            <div slot="headline">Logs & Console</div>
          </ew-list-item>
          ${this._isSameFirmware && this._manifest.funding_url ? y`
                <ew-list-item
                  type="link"
                  href=${this._manifest.funding_url}
                  target="_blank"
                >
                  ${Ip}
                  <div slot="headline">Fund Development</div>
                </ew-list-item>
              ` : ""}
          ${this._isSameVersion ? y`
                <ew-list-item
                  type="button"
                  class="danger"
                  @click=${() => this._startInstall(!0)}
                >
                  ${Bp}
                  <div slot="headline">Erase User Data</div>
                </ew-list-item>
              ` : ""}
        </ew-list>
      </div>
    `, [t, e, !0];
  }
  _renderDashboardNoImprov() {
    const t = this._manifest.name;
    let e;
    return e = y`
      <div slot="content">
        <ew-list>
          <ew-list-item
            type="button"
            @click=${() => {
      this._manifest.new_install_prompt_erase ? this._state = "ASK_ERASE" : this._startInstall(!0);
    }}
          >
            ${pa}
            <div slot="headline">${`Install ${this._manifest.name}`}</div>
          </ew-list-item>
          <ew-list-item
            type="button"
            @click=${async () => {
      this._client = void 0, this._state = "LOGS";
    }}
          >
            ${ga}
            <div slot="headline">Logs & Console</div>
          </ew-list-item>
        </ew-list>
      </div>
    `, [t, e, !0];
  }
  _renderProvision() {
    var t;
    let e, i = "Configure Wi-Fi";
    if (this._busy) return [i, this._renderProgress("Trying to connect")];
    if (this._client.state === vt.STOPPED) i = void 0, e = y`
        <div slot="content">
          <ewt-page-message
            .icon=${$s}
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
    else if (this._provisionForce || this._client.state !== vt.PROVISIONED) if (this._ssids === void 0) e = this._renderProgress("Scanning for networks");
    else {
      let r;
      switch (this._client.error) {
        case 3:
          r = "Unable to connect";
          break;
        case 254:
          r = "Timeout";
          break;
        case 0:
        case 2:
          break;
        default:
          r = `Unknown error (${this._client.error})`;
      }
      const o = (t = this._ssids) === null || t === void 0 ? void 0 : t.find(((a) => a.name === this._selectedSsid));
      e = y`
        <div slot="content">
          <div>Connect your device to the network to start using it.</div>
          ${r ? y`<p class="error">${r}</p>` : ""}
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
        const n = (l = a.rssi) >= -50 ? { icon: vp, class: "signal-excellent" } : l >= -60 ? { icon: _p, class: "signal-good" } : l >= -70 ? { icon: Ep, class: "signal-fair" } : { icon: wp, class: "signal-weak" };
        var l;
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
                            ${a.secured ? bp : yp}
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
      i = void 0;
      const r = !this._wasProvisioned && (this._client.nextUrl !== void 0 || "home_assistant_domain" in this._manifest);
      e = y`
        <div slot="content">
          <ewt-page-message
            .icon=${"🎉"}
            label="Device connected to the network!"
          ></ewt-page-message>
          ${r ? y`
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
                          ${ua}
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
                          ${fa}
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

        ${r ? "" : y`
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
    return [i, e];
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
      const t = this.shadowRoot.querySelector("ew-checkbox");
      this._startInstall(t.checked);
    }}
        >
          Next
        </ew-text-button>
      </div>
    `];
  }
  _renderInstall() {
    let t, e;
    const i = !this._installErase && this._isSameFirmware;
    if (!this._installConfirmed && this._isSameVersion) t = "Erase User Data", e = y`
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
    else if (this._installConfirmed) if (this._installState && this._installState.state !== "initializing" && this._installState.state !== "preparing") if (this._installState.state === "erasing") t = "Installing", e = this._renderProgress("Erasing");
    else if (this._installState.state === "writing" || this._installState.state === "finished" && this._client === void 0) {
      let r, o;
      t = "Installing", this._installState.state === "finished" ? o = "Wrapping up" : this._installState.details.percentage < 4 ? o = "Installing" : r = this._installState.details.percentage, e = this._renderProgress(y`
          ${o ? y`${o}<br />` : ""}
          <br />
          This will take
          ${this._installState.chipFamily === "ESP8266" ? "a minute" : "2 minutes"}.<br />
          Keep this page visible to prevent slow down
        `, r);
    } else if (this._installState.state === "finished") {
      t = void 0;
      const r = this._client !== null;
      e = y`
        <ewt-page-message
          slot="content"
          .icon=${"🎉"}
          label="Installation complete!"
        ></ewt-page-message>

        <div slot="actions">
          <ew-text-button
            @click=${() => {
        this._state = r && this._installErase ? "PROVISION" : "DASHBOARD";
      }}
          >
            Next
          </ew-text-button>
        </div>
      `;
    } else this._installState.state === "error" && (t = "Installation failed", e = y`
        <ewt-page-message
          slot="content"
          .icon=${$s}
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
    else t = "Installing", e = this._renderProgress("Preparing installation");
    else {
      t = "Confirm Installation";
      const r = i ? "update to" : "install";
      e = y`
        <div slot="content">
          ${i ? y`Your device is running
                ${this._info.firmware}&nbsp;${this._info.version}.<br /><br />` : ""}
          Do you want to ${r}
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
    return [t, e, !1];
  }
  _renderLogs() {
    let t;
    return t = y`
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
      Tp(this.shadowRoot.querySelector("ewt-console").logs(), "esp-web-tools-logs.txt"), this.shadowRoot.querySelector("ewt-console").reset();
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
    `, ["Logs", t];
  }
  willUpdate(t) {
    t.has("_state") && (this._state !== "ERROR" && (this._error = void 0), this._state === "PROVISION" ? this._ssids = void 0 : this._provisionForce = !1, this._state === "INSTALL" && (this._installConfirmed = !1, this._installState = void 0));
  }
  get _showsProvisionForm() {
    var t;
    const e = (t = this._client) === null || t === void 0 ? void 0 : t.state;
    return e !== void 0 && e !== vt.STOPPED && (this._provisionForce || e !== vt.PROVISIONED);
  }
  _syncScanning() {
    const t = this._state === "PROVISION" && !this._busy && this._showsProvisionForm;
    t !== !!this._unsubSSIDs && (t ? (this._scanGraceTimeout = setTimeout((() => {
      this._scanGraceTimeout = void 0, this._ssids === void 0 && (this._ssids = [], this._selectedSsid = null);
    }), 9100), this._unsubSSIDs = this._client.subscribeSSIDs(((e) => {
      this._ssids === void 0 && e?.length === 0 && this._scanGraceTimeout || e === null && this._ssids || (this._ssids === void 0 ? this._selectedSsid = e === null ? null : ((i) => i.length ? i.reduce(((r, o) => o.rssi > r.rssi ? o : r)).name : null)(e) : this._selectedSsid === null || e?.some(((i) => i.name === this._selectedSsid)) || (this._manualSsid = this._selectedSsid, this._selectedSsid = null), this._ssids = e);
    }))) : this._stopScanning());
  }
  async _stopScanning() {
    clearTimeout(this._scanGraceTimeout), this._scanGraceTimeout = void 0;
    const t = this._unsubSSIDs;
    t && (this._unsubSSIDs = void 0, await t());
  }
  firstUpdated(t) {
    super.firstUpdated(t), this._bodyOverflow = document.body.style.overflow, document.body.style.overflow = "hidden", this._initialize();
  }
  updated(t) {
    super.updated(t), t.has("_state") && this.setAttribute("state", this._state), this._syncScanning(), this._state === "PROVISION" && (t.has("_selectedSsid") && this._selectedSsid === null ? this._focusFormElement("ew-filled-text-field[name=ssid]") : t.has("_ssids") && t.get("_ssids") === void 0 && this._focusFormElement());
  }
  _focusFormElement(t = "ew-filled-text-field, ew-filled-select") {
    const e = this.shadowRoot.querySelector(t);
    e && e.updateComplete.then((() => setTimeout((() => e.focus()), 100)));
  }
  async _initialize(t = !1) {
    if (this.port.readable === null || this.port.writable === null) return this._state = "ERROR", void (this._error = "Serial port is not readable/writable. Close any other application using it and try again.");
    try {
      this._manifest = await (async (i) => {
        const r = new URL(i, location.toString()).toString(), o = await fetch(r), a = await o.json();
        return "new_install_skip_erase" in a && (console.warn('Manifest option "new_install_skip_erase" is deprecated. Use "new_install_prompt_erase" instead.'), a.new_install_skip_erase && (a.new_install_prompt_erase = !0)), a;
      })(this.manifestPath);
    } catch {
      return this._state = "ERROR", void (this._error = "Failed to download manifest");
    }
    if (this._manifest.new_install_improv_wait_time === 0) return void (this._client = null);
    const e = new Mp(this.port, this.logger);
    e.addEventListener("state-changed", (() => {
      this.requestUpdate();
    })), e.addEventListener("error-changed", (() => this.requestUpdate()));
    try {
      const i = t ? this._manifest.new_install_improv_wait_time !== void 0 ? 1e3 * this._manifest.new_install_improv_wait_time : 1e4 : 1500;
      this._info = await e.initialize(i), this._client = e, e.addEventListener("disconnect", this._handleDisconnect);
    } catch (i) {
      this._info = void 0, i instanceof Ln ? (this._state = "ERROR", this._error = "Serial port is not ready. Close any other application using it and try again.") : (this._client = null, this.logger.error("Improv initialization failed.", i));
    }
  }
  _startInstall(t) {
    this._state = "INSTALL", this._installErase = t, this._installConfirmed = !1;
  }
  async _confirmInstall() {
    this._installConfirmed = !0, this._installState = void 0, this._client && await this._closeClientWithoutEvents(this._client), this._client = void 0, await this.port.close(), (async (t, e, i, r, o) => {
      let a, n;
      const l = (u) => t({ ...u, manifest: r, build: a, chipFamily: n }), c = new Mr(e), d = e.getInfo(), h = d && d.usbVendorId === 12346 && d.usbProductId !== void 0 && [4097, 4098, 4099, 2, 3].includes(d.usbProductId), g = new DA({ transport: c, baudrate: 115200, enableTracing: !1 });
      window.esploader = g, l({ state: "initializing", message: "Initializing...", details: { done: !1 } });
      try {
        await g.main(), await g.flashId();
      } catch (u) {
        return console.error(u), l({ state: "error", message: "Failed to initialize. Try resetting your device or holding the BOOT button while clicking INSTALL.", details: { error: "failed_initialize", details: u } }), await ke(c, g), void await c.disconnect();
      }
      n = g.chip.CHIP_NAME, l({ state: "initializing", message: `Initialized. Found ${n}`, details: { done: !0 } });
      const A = h ? "cdc" : "uart";
      if (a = r.builds.find(((u) => u.chipFamily === n && u.serialType === A)) || r.builds.find(((u) => u.chipFamily === n && u.serialType === void 0)), !a) return l({ state: "error", message: `Your ${n} board is not supported.`, details: { error: "not_supported", details: n } }), await ke(c, g), void await c.disconnect();
      l({ state: "preparing", message: "Preparing installation...", details: { done: !1 } });
      const _ = i.startsWith("blob:") || i.startsWith("data:") ? location.toString() : new URL(i, location.toString()).toString(), m = a.parts.map((async (u) => {
        const I = new URL(u.path, _).toString(), D = await fetch(I);
        if (!D.ok) throw new Error(`Downloading firmware ${u.path} failed: ${D.status}`);
        const w = new FileReader(), M = await D.blob();
        return new Promise(((R) => {
          w.addEventListener("load", (() => R(w.result))), w.readAsArrayBuffer(M);
        }));
      })), f = [];
      let b = 0;
      for (let u = 0; u < m.length; u++) try {
        const I = await m[u], D = new Uint8Array(I, 0, I.byteLength);
        f.push({ data: D, address: a.parts[u].offset }), b += D.length;
      } catch (I) {
        return l({ state: "error", message: I.message, details: { error: "failed_firmware_download", details: I.message } }), await ke(c, g), void await c.disconnect();
      }
      l({ state: "preparing", message: "Installation prepared", details: { done: !0 } }), o && (l({ state: "erasing", message: "Erasing device...", details: { done: !1 } }), await g.eraseFlash(), l({ state: "erasing", message: "Device erased", details: { done: !0 } })), l({ state: "writing", message: "Writing progress: 0%", details: { bytesTotal: b, bytesWritten: 0, percentage: 0 } });
      let E = 0;
      try {
        await g.writeFlash({ fileArray: f, flashSize: "keep", flashMode: "keep", flashFreq: "keep", eraseAll: !1, compress: !0, reportProgress: (u, I, D) => {
          const w = I / D * f[u].data.length, M = Math.floor((E + w) / b * 100);
          I !== D ? l({ state: "writing", message: `Writing progress: ${M}%`, details: { bytesTotal: b, bytesWritten: E + I, percentage: M } }) : E += w;
        } });
      } catch (u) {
        return l({ state: "error", message: u.message, details: { error: "write_failed", details: u } }), await ke(c, g), void await c.disconnect();
      }
      l({ state: "writing", message: "Writing complete", details: { bytesTotal: b, bytesWritten: E, percentage: 100 } }), await ke(c, g), console.log("DISCONNECT"), await c.disconnect(), l({ state: "finished", message: "All done!" });
    })(((t) => {
      this._installState = t, t.state === "finished" ? me(100).then((() => this.port.open({ baudRate: 115200, bufferSize: 8192 }))).then((() => this._initialize(!0))).then((() => this.requestUpdate())) : t.state === "error" && me(100).then((() => this.port.open({ baudRate: 115200, bufferSize: 8192 })));
    }), this.port, this.manifestPath, this._manifest, this._installErase);
  }
  async _doProvision() {
    var t;
    const e = this._selectedSsid === null ? this.shadowRoot.querySelector("ew-filled-text-field[name=ssid]").value : this._selectedSsid, i = ((t = this.shadowRoot.querySelector("ew-filled-text-field[name=password]")) === null || t === void 0 ? void 0 : t.value) || "";
    this._busy = !0, this._wasProvisioned = this._client.state === vt.PROVISIONED, await this._stopScanning();
    try {
      await this._client.provision(e, i, 45e3);
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
    this._client && await this._closeClientWithoutEvents(this._client), ((t, e, i, r) => {
      r = r || {};
      const o = new CustomEvent(e, { bubbles: r.bubbles === void 0 || r.bubbles, cancelable: !!r.cancelable, composed: r.composed === void 0 || r.composed, detail: i });
      t.dispatchEvent(o);
    })(this, "closed"), document.body.style.overflow = this._bodyOverflow, this.parentNode.removeChild(this);
  }
  get _isSameFirmware() {
    var t;
    return !!this._info && (!((t = this.overrides) === null || t === void 0) && t.checkSameFirmware ? this.overrides.checkSameFirmware(this._manifest, this._info) : this._info.firmware === this._manifest.name);
  }
  get _isSameVersion() {
    return this._isSameFirmware && this._info.version === this._manifest.version;
  }
  async _closeClientWithoutEvents(t) {
    await this._stopScanning(), t.removeEventListener("disconnect", this._handleDisconnect), await t.close();
  }
  _preventDefault(t) {
    t.preventDefault();
  }
}
lt.styles = [ln, L`
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
    `], p([F()], lt.prototype, "_client", void 0), p([F()], lt.prototype, "_state", void 0), p([F()], lt.prototype, "_installErase", void 0), p([F()], lt.prototype, "_installConfirmed", void 0), p([F()], lt.prototype, "_installState", void 0), p([F()], lt.prototype, "_provisionForce", void 0), p([F()], lt.prototype, "_error", void 0), p([F()], lt.prototype, "_busy", void 0), p([F()], lt.prototype, "_ssids", void 0), p([F()], lt.prototype, "_selectedSsid", void 0), customElements.define("ewt-install-dialog", lt);
var kp = Object.freeze({ __proto__: null, EwtInstallDialog: lt });
const Fp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  R: Tr,
  i: kp
}, Symbol.toStringTag, { value: "Module" })), va = ot`
  <svg
    version="1.1"
    id="Capa_1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    x="0px"
    y="0px"
    viewBox="0 0 510.322 510.322"
    xml:space="preserve"
    style="width: 28px; vertical-align: middle;"
  >
    <g>
      <path
        style="fill:currentColor;"
        d="M429.064,159.505c0-0.151,0.086-1.057,0.086-1.057c0-75.282-61.261-136.521-136.543-136.521    c-52.244,0-97.867,30.587-120.753,76.339c-11.67-9.081-25.108-15.682-40.273-15.682c-37.166,0-67.387,30.199-67.387,67.387    c0,0,0.453,3.279,0.798,5.824C27.05,168.716,0,203.423,0,244.516c0,25.389,9.901,49.268,27.848,67.171    c17.968,17.99,41.804,27.869,67.193,27.869h130.244v46.83h-54.66l97.694,102.008l95.602-102.008h-54.66v-46.83H419.25    c50.174,0,91.072-40.855,91.072-90.986C510.3,201.827,474.428,164.639,429.064,159.505z M419.207,312.744H309.26v-55.545h-83.975    v55.545H95.019c-18.184,0-35.333-7.075-48.211-19.996c-12.878-12.878-19.953-30.005-19.953-48.189    c0-32.68,23.21-60.808,55.264-66.956l12.511-2.394l-2.092-14.431l-1.488-10.785c0-22.347,18.184-40.51,40.531-40.51    c13.266,0,25.691,6.514,33.305,17.408l15.229,21.873l8.52-25.303c15.013-44.652,56.796-74.656,103.906-74.656    c60.506,0,109.709,49.203,109.709,109.644l-1.337,25.712l15.121,0.302l3.149-0.086c35.419,0,64.216,28.797,64.216,64.216    C483.401,283.969,454.604,312.744,419.207,312.744z"
      />
    </g>
  </svg>
`;
let Ls = class extends G {
  render() {
    const s = (() => {
      var t, e;
      const i = window.navigator.userAgent, r = ((e = (t = window.navigator) === null || t === void 0 ? void 0 : t.userAgentData) === null || e === void 0 ? void 0 : e.platform) || window.navigator.platform;
      return ["macOS", "Macintosh", "MacIntel", "MacPPC", "Mac68K"].indexOf(r) !== -1 ? "Mac OS" : ["iPhone", "iPad", "iPod"].indexOf(r) !== -1 ? "iOS" : ["Win32", "Win64", "Windows", "WinCE"].indexOf(r) !== -1 ? "Windows" : /Android/.test(i) ? "Android" : /Linux/.test(r) ? "Linux" : null;
    })();
    return y`
      <ew-dialog open @closed=${this._handleClose}>
        <div slot="headline">No port selected</div>
        <div slot="content">
          <div>
            If you didn't select a port because you didn't see your device
            listed, try the following steps:
          </div>
          <ol>
            <li>
              Make sure that the device is connected to this computer (the one
              that runs the browser that shows this website)
            </li>
            <li>
              Most devices have a tiny light when it is powered on. If yours has
              one, make sure it is on.
            </li>
            <li>
              Make sure that the USB cable you use can be used for data and is
              not a power-only cable.
            </li>
            ${s === "Linux" ? y`
                  <li>
                    If you are using a Linux flavor, make sure that your user is
                    part of the <code>dialout</code> group so it has permission
                    to access the device.
                    <code class="block"
                      >sudo usermod -a -G dialout YourUserName</code
                    >
                    You may need to log out & back in or reboot to activate the
                    new group access.
                  </li>
                ` : ""}
            <li>
              Make sure you have the right drivers installed. Below are the
              drivers for common chips used in ESP devices:
              <ul>
                <li>
                  CP2102 drivers:
                  <a
                    href="https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers"
                    target="_blank"
                    rel="noopener"
                    >Windows & Mac</a
                  >
                </li>
                <li>
                  CH342, CH343, CH9102 drivers:
                  <a
                    href="https://www.wch.cn/downloads/CH343SER_ZIP.html"
                    target="_blank"
                    rel="noopener"
                    >Windows</a
                  >,
                  <a
                    href="https://www.wch.cn/downloads/CH34XSER_MAC_ZIP.html"
                    target="_blank"
                    rel="noopener"
                    >Mac</a
                  >
                  <br />
                  (download via blue button with ${va} icon)
                </li>
                <li>
                  CH340, CH341 drivers:
                  <a
                    href="https://www.wch.cn/downloads/CH341SER_ZIP.html"
                    target="_blank"
                    rel="noopener"
                    >Windows</a
                  >,
                  <a
                    href="https://www.wch.cn/downloads/CH341SER_MAC_ZIP.html"
                    target="_blank"
                    rel="noopener"
                    >Mac</a
                  >
                  <br />
                  (download via blue button with ${va} icon)
                </li>
              </ul>
            </li>
          </ol>
        </div>
        <div slot="actions">
          ${this.doTryAgain ? y`
                <ew-text-button @click=${this.close}>Cancel</ew-text-button>
                <ew-text-button @click=${this.tryAgain}>
                  Try Again
                </ew-text-button>
              ` : y`
                <ew-text-button @click=${this.close}>Close</ew-text-button>
              `}
        </div>
      </ew-dialog>
    `;
  }
  tryAgain() {
    var s;
    this.close(), (s = this.doTryAgain) === null || s === void 0 || s.call(this);
  }
  close() {
    this.shadowRoot.querySelector("ew-dialog").close();
  }
  async _handleClose() {
    this.parentNode.removeChild(this);
  }
};
Ls.styles = [ln, L`
      li + li,
      li > ul {
        margin-top: 8px;
      }
      ul,
      ol {
        margin-bottom: 0;
        padding-left: 1.5em;
      }
      li code.block {
        display: block;
        margin: 0.5em 0;
      }
    `], Ls = p([Jt("ewt-no-port-picked-dialog")], Ls);
const Op = async (s) => {
  const t = document.createElement("ewt-no-port-picked-dialog");
  return t.doTryAgain = s, document.body.append(t), !0;
}, Pp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  openNoPortPickedDialog: Op
}, Symbol.toStringTag, { value: "Module" }));
var Nn = 1074521580, Kn = "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", zn = 1074520064, Jn = "DMD8P+znC0B/6AtAZ+0LQAbpC0Cf6AtABukLQGXpC0CC6gtA9OoLQJ3qC0CV5wtAGuoLQHTqC0CI6QtAGOsLQLDpC0AY6wtAbegLQMroC0AG6QtAZekLQIXoC0DI6wtAKe0LQLjmC0BL7QtAuOYLQLjmC0C45gtAuOYLQLjmC0C45gtAuOYLQLjmC0Bv6wtAuOYLQEnsC0Ap7QtA", jn = 1073605544, Wn = 1073528832, Up = { entry: Nn, text: Kn, text_start: zn, data: Jn, data_start: jn, bss_start: Wn };
const Qp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Wn,
  data: Jn,
  data_start: jn,
  default: Up,
  entry: Nn,
  text: Kn,
  text_start: zn
}, Symbol.toStringTag, { value: "Module" }));
var Vn = 1077413304, qn = "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", Zn = 1077411840, Xn = "DEDKP+AIOEAsCThAhAk4QFIKOEC+CjhAbAo4QKgHOEAOCjhATgo4QJgJOEBYBzhAzAk4QFgHOEC6CDhA/gg4QCwJOECECThAzAg4QBIIOEBCCDhAyAg4QBYNOEAsCThA1gs4QMoMOECkBjhA9Aw4QKQGOECkBjhApAY4QKQGOECkBjhApAY4QKQGOECkBjhAcgs4QKQGOEDyCzhAygw4QA==", tl = 1070295976, el = 1070219264, Hp = { entry: Vn, text: qn, text_start: Zn, data: Xn, data_start: tl, bss_start: el };
const Gp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: el,
  data: Xn,
  data_start: tl,
  default: Hp,
  entry: Vn,
  text: qn,
  text_start: Zn
}, Symbol.toStringTag, { value: "Module" }));
var il = 1077413584, sl = "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", rl = 1077411840, ol = "GEDIP8AKOEAQCzhAaAs4QDYMOECiDDhAUAw4QHIJOEDyCzhAMgw4QHwLOEAiCThAsAs4QCIJOECaCjhA4Ao4QBALOEBoCzhArAo4QNYJOEAgCjhAqAo4QPoOOEAQCzhAug04QLIOOEBiCDhA2g44QGIIOEBiCDhAYgg4QGIIOEBiCDhAYgg4QGIIOEBiCDhAVg04QGIIOEDYDThAsg44QA==", al = 1070164916, nl = 1070088192, $p = { entry: il, text: sl, text_start: rl, data: ol, data_start: al, bss_start: nl };
const Lp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: nl,
  data: ol,
  data_start: al,
  default: $p,
  entry: il,
  text: sl,
  text_start: rl
}, Symbol.toStringTag, { value: "Module" }));
var ll = 1082133128, cl = "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", dl = 1082130432, hl = "GACEQOYOgEBQD4BA5A+AQLgQgEAgEYBAzhCAQEINgEB0EIBAtBCAQAAQgEDyDIBAKBCAQPIMgEDEDoBADg+AQFAPgEDkD4BA1g6AQGoNgECYDYBA0g6AQBoTgEBQD4BA3BGAQNYSgEAwDIBA/BKAQDAMgEAwDIBAMAyAQDAMgEAwDIBAMAyAQDAMgEAwDIBAghGAQDAMgED0EYBA1hKAQA==", Al = 1082469304, pl = 1082392576, Yp = { entry: ll, text: cl, text_start: dl, data: hl, data_start: Al, bss_start: pl };
const Np = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: pl,
  data: hl,
  data_start: Al,
  default: Yp,
  entry: ll,
  text: cl,
  text_start: dl
}, Symbol.toStringTag, { value: "Module" }));
var gl = 1082132164, ul = "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", fl = 1082130432, ml = "FACEQHIKgEDCCoBAGguAQOgLgEBUDIBAAgyAQD4JgECkC4BA5AuAQC4LgEDuCIBAYguAQO4IgEBMCoBAkgqAQMIKgEAaC4BAXgqAQKIJgEDSCYBAWgqAQKwOgEDCCoBAbA2AQGQOgEAuCIBAjA6AQC4IgEAuCIBALgiAQC4IgEAuCIBALgiAQC4IgEAuCIBACA2AQC4IgECKDYBAZA6AQA==", vl = 1082469296, _l = 1082392576, Kp = { entry: gl, text: ul, text_start: fl, data: ml, data_start: vl, bss_start: _l };
const zp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: _l,
  data: ml,
  data_start: vl,
  default: Kp,
  entry: gl,
  text: ul,
  text_start: fl
}, Symbol.toStringTag, { value: "Module" }));
var El = 1082132164, wl = "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", bl = 1082130432, yl = "FECAQHQKgEDECoBAHAuAQOoLgEBWDIBABAyAQEAJgECmC4BA5guAQDALgEDwCIBAZAuAQPAIgEBOCoBAlAqAQMQKgEAcC4BAYAqAQKQJgEDUCYBAXAqAQK4OgEDECoBAbg2AQGYOgEAwCIBAjg6AQDAIgEAwCIBAMAiAQDAIgEAwCIBAMAiAQDAIgEAwCIBACg2AQDAIgECMDYBAZg6AQA==", Cl = 1082223536, Bl = 1082146816, Jp = { entry: El, text: wl, text_start: bl, data: yl, data_start: Cl, bss_start: Bl };
const jp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Bl,
  data: yl,
  data_start: Cl,
  default: Jp,
  entry: El,
  text: wl,
  text_start: bl
}, Symbol.toStringTag, { value: "Module" }));
var Il = 1082132164, xl = "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", Sl = 1082130432, Rl = "FACDQHIKgEDCCoBAGguAQOgLgEBUDIBAAgyAQD4JgECkC4BA5AuAQC4LgEDuCIBAYguAQO4IgEBMCoBAkgqAQMIKgEAaC4BAXgqAQKIJgEDSCYBAWgqAQKwOgEDCCoBAbA2AQGQOgEAuCIBAjA6AQC4IgEAuCIBALgiAQC4IgEAuCIBALgiAQC4IgEAuCIBACA2AQC4IgECKDYBAZA6AQA==", Dl = 1082403760, Ml = 1082327040, Wp = { entry: Il, text: xl, text_start: Sl, data: Rl, data_start: Dl, bss_start: Ml };
const Vp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Ml,
  data: Rl,
  data_start: Dl,
  default: Wp,
  entry: Il,
  text: xl,
  text_start: Sl
}, Symbol.toStringTag, { value: "Module" }));
var Tl = 1341196642, kl = "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", Fl = 1341194240, Ol = "YAD1T3gO8U/GDvFPZA/xT0oQ8U+kEPFPXBDxT8oM8U/+D/FPRhDxT4IP8U96DPFPqg/xT3oM8U9UDvFPkg7xT8YO8U9kD/FPZg7xT/QM8U8oDfFPYg7xT3YU8U/GDvFPGBLxTzYU8U8eC/FPWhTxTx4L8U8eC/FPHgvxTx4L8U8eC/FPHgvxTx4L8U8eC/FPthHxTx4L8U9SE/FPNhTxTw==", Pl = 1341533180, Ul = 1341456384, qp = { entry: Tl, text: kl, text_start: Fl, data: Ol, data_start: Pl, bss_start: Ul };
const Zp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Ul,
  data: Ol,
  data_start: Pl,
  default: qp,
  entry: Tl,
  text: kl,
  text_start: Fl
}, Symbol.toStringTag, { value: "Module" }));
var Ql = 1341459344, Hl = "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", Gl = 1341456384, $l = "YAD2T8oQ9U80EfVP0BH1T6wS9U8UE/VPwhL1TwQP9U9oEvVPqBL1T+wR9U+0DvVPFBL1T7QO9U+mEPVP8hD1TzQR9U/QEfVPuBD1TywP9U9gD/VPtBD1TxIV9U80EfVP2BP1T9IU9U9YDfVP9hT1T1gN9U9YDfVPWA31T1gN9U9YDfVPWA31T1gN9U9YDfVPdhP1T1gN9U/wE/VP0hT1Tw==", Ll = 1341598720, Yl = 1341521920, Xp = { entry: Ql, text: Hl, text_start: Gl, data: $l, data_start: Ll, bss_start: Yl };
const tg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Yl,
  data: $l,
  data_start: Ll,
  default: Xp,
  entry: Ql,
  text: Hl,
  text_start: Gl
}, Symbol.toStringTag, { value: "Module" }));
var Nl = 1073907716, Kl = "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", zl = 1073905664, Jl = "WAD9P0uLAkDdiwJA8pACQGaMAkD+iwJAZowCQMWMAkDejQJAUY4CQPmNAkDVigJAd40CQNCNAkDojAJAdI4CQBCNAkB0jgJAy4sCQCqMAkBmjAJAxYwCQOOLAkAXiwJAN48CQKqQAkDqiQJA0ZACQOqJAkDqiQJA6okCQOqJAkDqiQJA6okCQOqJAkDqiQJA1I4CQOqJAkDJjwJAqpACQA==", jl = 1073622012, Wl = 1073545216, eg = { entry: Nl, text: Kl, text_start: zl, data: Jl, data_start: jl, bss_start: Wl };
const ig = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Wl,
  data: Jl,
  data_start: jl,
  default: eg,
  entry: Nl,
  text: Kl,
  text_start: zl
}, Symbol.toStringTag, { value: "Module" }));
var Vl = 1077381760, ql = "FIADYACAA2BMAMo/BIADYDZBAIH7/wxJwCAAmQjGBAAAgfj/wCAAqAiB9/+goHSICOAIACH2/8AgAIgCJ+jhHfAAAAAIAABgHAAAYBAAAGA2QQAh/P/AIAA4AkH7/8AgACgEICCUnOJB6P9GBAAMODCIAcAgAKgIiASgoHTgCAALImYC6Ib0/yHx/8AgADkCHfAAAPQryz9sq8o/hIAAAEBAAACs68o/+CvLPzZBALH5/yCgdBARICU5AZYaBoH2/5KhAZCZEZqYwCAAuAmR8/+goHSaiMAgAJIYAJCQ9BvJwMD0wCAAwlgAmpvAIACiSQDAIACSGACB6v+QkPSAgPSHmUeB5f+SoQGQmRGamMAgAMgJoeX/seP/h5wXxgEAfOiHGt7GCADAIACJCsAgALkJRgIAwCAAuQrAIACJCZHX/5qIDAnAIACSWAAd8AAAVCAAYFQwAGA2QQCR/f/AIACICYCAJFZI/5H6/8AgAIgJgIAkVkj/HfAAAAAsIABgACAAYAAAAAg2QQAQESCl/P8h+v8MCMAgAIJiAJH6/4H4/8AgAJJoAMAgAJgIVnn/wCAAiAJ88oAiMCAgBB3wAAAAAEA2QQAQESDl+/8Wav+B7P+R+//AIACSaADAIACYCFZ5/x3wAADoCABAuAgAQDaBAIH9/+AIABwGBgwAAABgVEMMCAwa0JURDI05Me0CiWGpUZlBiSGJEdkBLA8MzAxLgfL/4AgAUETAWjNaIuYUzQwCHfAAABQoAEA2QQAgoiCB/f/gCAAd8AAAcOL6PwggAGC8CgBAyAoAQDZhABARIGXv/zH5/70BrQOB+v/gCABNCgwS7OqIAZKiAJCIEIkBEBEg5fP/kfL/oKIBwCAAiAmgiCDAIACJCbgBrQOB7v/gCACgJIMd8AAAXIDKP/8PAABoq8o/NkEAgfz/DBmSSAAwnEGZKJH6/zkYKTgwMLSaIiozMDxBOUgx9v8ioAAyAwAiaAUnEwmBv//gCABGAwAAEBEgZfb/LQqMGiKgxR3wAP///wAEIABg9AgAQAwJAEAACQBANoEAMeT/KEMWghEQESAl5v8W+hAM+AwEJ6gMiCMMEoCANIAkkyBAdBARICXo/xARIOXg/yHa/yICABYyCqgjgev/QCoRFvQEJyg8gaH/4AgAgej/4AgA6CMMAgwaqWGpURyPQO4RDI3CoNgMWylBKTEpISkRKQGBl//gCACBlP/gCACGAgAAAKCkIYHb/+AIABwKBiAAAAAnKDmBjf/gCACB1P/gCADoIwwSHI9A7hEMjSwMDFutAilhKVFJQUkxSSFJEUkBgYP/4AgAgYH/4AgARgEAgcn/4AgADBqGDQAAKCMMGUAiEZCJAcwUgIkBkb//kCIQkb7/wCAAImkAIVr/wCAAgmIAwCAAiAJWeP8cCgwSQKKDKEOgIsApQygjqiIpIx3wAAA2gQCBaf/gCAAsBoYPAAAAga//4AgAYFRDDAgMGtCVEe0CqWGpUYlBiTGZITkRiQEsDwyNwqASsqAEgVz/4AgAgVr/4AgAWjNaIlBEwOYUvx3wAAAUCgBANmEAQYT/WDRQM2MWYwtYFFpTUFxBRgEAEBEgZeb/aESmFgRoJGel7xARIGXM/xZq/1F6/2gUUgUAFkUGgUX/4AgAYFB0gqEAUHjAd7MIzQO9Aq0Ghg4AzQe9Aq0GUtX/EBEgZfT/OlVQWEEMCUYFAADCoQCZARARIOXy/5gBctcBG5mQkHRgp4BwsoBXOeFww8AQESAl8f+BLv/gCACGBQDNA70CrQaB1f/gCACgoHSMSiKgxCJkBSgUOiIpFCg0MCLAKTQd8ABcBwBANkEAgf7/4AgAggoYDAmCyPwMEoApkx3wNkEAgfj/4AgAggoYDAmCyP0MEoApkx3wvP/OP0gAyj9QAMo/QCYAQDQmAEDQJgBANmEAfMitAoeTLTH3/8YFAACoAwwcvQGB9//gCACBj/6iAQCICOAIAKgDgfP/4AgA5hrdxgoAAABmAyYMA80BDCsyYQCB7v/gCACYAYHo/zeZDagIZhoIMeb/wCAAokMAmQgd8EQAyj8CAMo/KCYAQDZBACH8/4Hc/8gCqAix+v+B+//gCAAMCIkCHfCQBgBANkEAEBEgpfP/jLqB8v+ICIxIEBEgpfz/EBEg5fD/FioAoqAEgfb/4AgAHfAAAMo/SAYAQDZBABARIGXw/00KvDox5P8MGYgDDAobSEkDMeL/ijOCyMGAqYMiQwCgQHTMqjKvQDAygDCUkxZpBBARIOX2/0YPAK0Cge7/4AgAEBEgZer/rMox6f886YITABuIgID0glMAhzkPgq9AiiIMGiCkk6CgdBaqAAwCEBEgJfX/IlMAHfAAADZBAKKgwBARICX3/x3wAAA2QQCCoMCtAoeSEaKg2xARIKX1/6Kg3EYEAAAAAIKg24eSCBARIGX0/6Kg3RARIOXz/x3wNkEAOjLGAgAAogIAGyIQESCl+/83kvEd8AAAAFwcAEAgCgBAaBwAQHQcAEA2ISGi0RCB+v/gCACGDwAAUdD+DBRARBGCBQBAQ2PNBL0BrQKMmBARICWm/8YBAAAAgfD/4AgAoKB0/DrNBL0BotEQge3/4AgASiJAM8BW4/siogsQIrCtArLREIHo/+AIAK0CHAsQESCl9v8tA4YAACKgYx3wAACIJgBAhBsAQJQmAECQGwBANkEAEBEgpdj/rIoME0Fm//AzAYyyqASB9v/gCACtA8YJAK0DgfT/4AgAqASB8//gCAAGCQAQESDl0/8MGPCIASwDoIODrQgWkgCB7P/gCACGAQAAgej/4AgAHfBgBgBANkEhYqQd4GYRGmZZBgwXUqAAYtEQUKUgQHcRUmYaEBEg5ff/R7cCxkIArQaBt//gCADGLwCRjP5Qc8CCCQBAd2PNB70BrQIWqAAQESBllf/GAQAAAIGt/+AIAKCgdIyqDAiCZhZ9CEYSAAAAEBEgpeP/vQetARARICXn/xARIKXi/80HELEgYKYggaH/4AgAeiJ6VTe1yIKhB8CIEZKkHRqI4JkRiAgamZgJgHXAlzeDxur/DAiCRmyipBsQqqCBz//gCABWCv+yoguiBmwQu7AQESClsgD36hL2Rw+Sog0QmbB6maJJABt3hvH/fOmXmsFmRxKSoQeCJhrAmREamYkJN7gCh7WLIqILECKwvQatAoGA/+AIABARIOXY/60CHAsQESBl3P8QESDl1/8MGhARIOXm/x3wAADKP09IQUmwgABgoTrYUJiAAGC4gABgKjEdj7SAAGD8K8s/rIA3QJggDGA8gjdArIU3QAgACGCAIQxgEIA3QBCAA2BQgDdADAAAYDhAAGCcLMs///8AACyBAGAQQAAAACzLPxAsyz98kABg/4///4CQAGCEkABgeJAAYFQAyj9YAMo/XCzLPxQAAGDw//8A/CvLP1wAyj90gMo/gAcAQHgbAEC4JgBAZCYAQHQfAEDsCgBABCAAQFQJAEBQCgBAAAYAQBwpAEAkJwBACCgAQOQGAEB0gQRAnAkAQPwJAEAICgBAqAYAQIQJAEBsCQBAkAkAQCgIAEDYBgBANgEBIcH/DAoiYRCB5f/gCAAQESDlrP8WigQxvP8hvP9Bvf/AIAApAwwCwCAAKQTAIAApA1G5/zG5/2G5/8AgADkFwCAAOAZ89BBEAUAzIMAgADkGwCAAKQWGAQBJAksiBgIAIaj/Ma//QqAANzLsEBEgJcD/DEuiwUAQESClw/8ioQEQESDlvv8xY/2QIhEqI8AgADkCQaT/ITv9SQIQESClpf8tChb6BSGa/sGb/qgCDCuBnf7gCABBnP+xnf8cGgwMwCAAqQSBt//gCAAMGvCqAYEl/+AIALGW/6gCDBWBsv/gCACoAoEd/+AIAKgCga//4AgAQZD/wCAAKARQIiDAIAApBIYWABARIGWd/6yaQYr/HBqxiv/AIACiZAAgwiCBoP/gCAAhh/8MRAwawCAASQLwqgHGCAAAALGD/80KDFqBmP/gCABBgP9SoQHAIAAoBCwKUCIgwCAAKQSBAv/gCACBk//gCAAhef/AIAAoAsy6HMRAIhAiwvgMFCCkgwwLgYz/4AgAgYv/4AgAXQqMmkGo/QwSIkQARhQAHIYMEmlBYsEgqWFpMakhqRGpAf0K7QopUQyNwqCfsqAEIKIggWr94AgAcgEiHGhix+dgYHRnuAEtBTyGDBV3NgEMBUGU/VAiICAgdCJEABbiAKFZ/4Fy/+AIAIFb/eAIAPFW/wwdDBwMG+KhAEDdEQDMEWC7AQwKgWr/4AgAMYT9YtMrhhYAwCAAUgcAUFB0FhUFDBrwqgHAIAAiRwCByf7gCACionHAqhGBX//gCACBXv/gCABxQv986MAgAFgHfPqAVRAQqgHAIABZB4FY/+AIAIFX/+AIACCiIIFW/+AIAHEn/kHp/MAgACgEFmL5DAfAIABYBAwSwCAAeQQiQTQiBQEMKHnhIkE1glEbHDd3EiQcR3cSIWaSISIFA3IFAoAiEXAiIGZCEiglwCAAKAIp4YYBAAAAHCIiURsQESBlmf+yoAiiwTQQESDlnP+yBQMiBQKAuxEgSyAhGf8gIPRHshqioMAQESCll/+ioO4QESAll/8QESDllf+G2P8iBQEcRyc3N/YiGwYJAQAiwi8gIHS2QgIGJQBxC/9wIqAoAqACAAAiwv4gIHQcJye3Akb/AHEF/3AioCgCoAIAcsIwcHB0tlfFhvkALEkMByKgwJcUAob3AHnhDHKtBxARIGWQ/60HEBEg5Y//EBEgZY7/EBEgJY7/DIuiwTQiwv8QESBlkf9WIv1GQAAMElakOcLBIL0ErQSBCP/gCABWqjgcS6LBIBARICWP/4bAAAwSVnQ3gQL/4AgAoCSDxtoAJoQEDBLG2AAoJXg1cIIggIC0Vtj+EBEgZT7/eiKsmgb4/0EN/aCsQYIEAIz4gSL94AgARgMActfwRgMAAACB8f7gCAAW6v4G7v9wosDMF8anAKCA9FaY/EYKAEH+/KCg9YIEAJwYgRP94AgAxgMAfPgAiBGKd8YCAIHj/uAIABbK/kbf/wwYAIgRcKLAdzjKhgkAQfD8oKxBggQAjOiBBv3gCAAGAwBy1/AGAwAAgdX+4AgAFvr+BtL/cKLAVif9hosADAcioMAmhAIGqgAMBy0HRqgAJrT1Bn4ADBImtAIGogC4NaglDAcQESClgf+gJ4OGnQAMGWa0X4hFIKkRDAcioMKHugIGmwC4VaglkmEWEBEgZTT/kiEWoJeDRg4ADBlmtDSIRSCpEQwHIqDCh7oCRpAAKDW4VaglIHiCkmEWEBEgZTH/IcH8DAiSIRaJYiLSK3JiAqCYgy0JBoMAkbv8DAeiCQAioMZ3mgKGgQB4JbLE8CKgwLeXAiIpBQwHkqDvRgIAeoWCCBgbd4CZMLcn8oIFBXIFBICIEXCIIHIFBgB3EYB3IIIFB4CIAXCIIICZwIKgwQwHkCiTxm0AgaP8IqDGkggAfQkWmRqYOAwHIqDIdxkCBmcAKFiSSABGYgAciQwHDBKXFAIGYgD4dehl2FXIRbg1qCWBev7gCAAMCH0KoCiDBlsADBImRAJGVgCRX/6BX/7AIAB4CUAiEYB3ECB3IKglwCAAeQmRWv4MC8AgAHgJgHcQIHcgwCAAeQmRVv7AIAB4CYB3ECB3IMAgAHkJkVL+wCAAeAmAdxAgJyDAIAApCYFb/uAIAAYgAABAkDQMByKgwHcZAoY9AEBEQYvFfPhGDwCoPIJhFZJhFsJhFIFU/uAIAMIhFIIhFSgseByoDJIhFnByECYCDcAgANgKICgw0CIQIHcgwCAAeQobmcLMEEc5vsZ//2ZEAkZ+/wwHIqDAhiYADBImtALGIQAhL/6IVXgliQIhLv55AgwCBh0A8Sr+DAfIDwwZssTwjQctB7Apk8CJgyCIECKgxneYYKEk/n0I2AoioMm3PVOw4BQioMBWrgQtCIYCAAAqhYhoSyKJB40JIO3AKny3Mu0WaNjpCnkPxl//DBJmhBghFP6CIgCMGIKgyAwHeQIhEP55AgwSgCeDDAdGAQAADAcioP8goHQQESClUv9woHQQESDlUf8QESClUP9W8rAiBQEcJyc3H/YyAkbA/iLC/SAgdAz3J7cCxrz+cf/9cCKgKAKgAgAAcqDSdxJfcqDUd5ICBiEARrX+KDVYJRARIKU0/40KVmqsoqJxwKoRgmEVgQD+4AgAcfH9kfH9wCAAeAeCIRVwtDXAdxGQdxBwuyAgu4KtCFC7woH//eAIAKKj6IH0/eAIAMag/gAA2FXIRbg1qCUQESAlXP8GnP4AsgUDIgUCgLsRILsgssvwosUYEBEgJR//BpX+ACIFA3IFAoAiEXAiIIHt/eAIAHH7+yLC8Ig3gCJjFjKjiBeKgoCMQUYDAAAAgmEVEBEgpQP/giEVkicEphkFkicCl6jnEBEgZen+Fmr/qBfNArLFGIHc/eAIAIw6UqDEWVdYFypVWRdYNyAlwCk3gdb94AgABnf+AAAiBQOCBQJyxRiAIhFYM4AiICLC8FZFCvZSAoYnACKgyUYsAFGz/YHY+6gFKfGgiMCJgYgmrQmHsgEMOpJhFqJhFBARIOX6/qIhFIGq/akB6AWhqf3dCL0HwsE88sEggmEVgbz94AgAuCbNCqjxkiEWoLvAuSagIsC4Bap3qIGCIRWquwwKuQXAqYOAu8Cg0HTMiuLbgK0N4KmDrCqtCIJhFZJhFsJhFBARIKUM/4IhFZIhFsIhFIkFBgEAAAwcnQyMslgzjHXAXzHAVcCWNfXWfAAioMcpUwZA/lbcjygzFoKPIqDIBvv/KCVW0o4QESBlIv+ionHAqhGBif3gCACBlv3gCACGNP4oNRbSjBARIGUg/6Kj6IGC/eAIAOACAAYu/h3wAAAANkEAnQKCoMAoA4eZD8wyDBKGBwAMAikDfOKGDwAmEgcmIhiGAwAAAIKg24ApI4eZKgwiKQN88kYIAAAAIqDcJ5kKDBIpAy0IBgQAAACCoN188oeZBgwSKQMioNsd8AAA", Zl = 1077379072, Xl = "XADKP16ON0AzjzdAR5Q3QL2PN0BTjzdAvY83QB2QN0A6kTdArJE3QFWRN0DpjTdA0JA3QCyRN0BAkDdA0JE3QGiQN0DQkTdAIY83QH6PN0C9jzdAHZA3QDmPN0AqjjdAkJI3QA2UN0AAjTdALZQ3QACNN0AAjTdAAI03QACNN0AAjTdAAI03QACNN0AAjTdAKpI3QACNN0AlkzdADZQ3QAQInwAAAAAAAAAYAQQIBQAAAAAAAAAIAQQIBgAAAAAAAAAAAQQIIQAAAAAAIAAAEQQI3AAAAAAAIAAAEQQIDAAAAAAAIAAAAQQIEgAAAAAAIAAAESAoDAAQAQAA", tc = 1070279676, ec = 1070202880, sg = { entry: Vl, text: ql, text_start: Zl, data: Xl, data_start: tc, bss_start: ec };
const rg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: ec,
  data: Xl,
  data_start: tc,
  default: sg,
  entry: Vl,
  text: ql,
  text_start: Zl
}, Symbol.toStringTag, { value: "Module" }));
var ic = 1074843652, sc = "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", rc = 1074843648, oc = "CIH+PwUFBAACAwcAAwMLANTXEEAL2BBAOdgQQNbYEECF5xBAOtkQQJDZEEDc2RBAhecQQKLaEEAf2xBA4NsQQIXnEECF5xBAeNwQQIXnEEBV3xBAHOAQQFfgEECF5xBAhecQQPPgEECF5xBA2+EQQIHiEEDA4xBAf+QQQFDlEECF5xBAhecQQIXnEECF5xBAfuYQQIXnEEB05xBAsN0QQKnYEEDC5RBAydoQQBvaEECF5xBACOcQQE/nEECF5xBAhecQQIXnEECF5xBAhecQQIXnEECF5xBAhecQQELaEEB/2hBA2uUQQAEAAAACAAAAAwAAAAQAAAAFAAAABwAAAAkAAAANAAAAEQAAABkAAAAhAAAAMQAAAEEAAABhAAAAgQAAAMEAAAABAQAAgQEAAAECAAABAwAAAQQAAAEGAAABCAAAAQwAAAEQAAABGAAAASAAAAEwAAABQAAAAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAgAAAAIAAAADAAAAAwAAAAQAAAAEAAAABQAAAAUAAAAGAAAABgAAAAcAAAAHAAAACAAAAAgAAAAJAAAACQAAAAoAAAAKAAAACwAAAAsAAAAMAAAADAAAAA0AAAANAAAAAAAAAAAAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAsAAAANAAAADwAAABEAAAATAAAAFwAAABsAAAAfAAAAIwAAACsAAAAzAAAAOwAAAEMAAABTAAAAYwAAAHMAAACDAAAAowAAAMMAAADjAAAAAgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgAAAAMAAAADAAAAAwAAAAMAAAAEAAAABAAAAAQAAAAEAAAABQAAAAUAAAAFAAAABQAAAAAAAAAAAAAAAAAAABAREgAIBwkGCgULBAwDDQIOAQ8AAQEAAAEAAAAEAAAA", ac = 1073720488, nc = 1073643776, og = { entry: ic, text: sc, text_start: rc, data: oc, data_start: ac, bss_start: nc };
const ag = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: nc,
  data: oc,
  data_start: ac,
  default: og,
  entry: ic,
  text: sc,
  text_start: rc
}, Symbol.toStringTag, { value: "Module" }));
let pi = class extends Tr {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32", this.IMAGE_CHIP_ID = 0, this.EFUSE_RD_REG_BASE = 1073061888, this.DR_REG_SYSCON_BASE = 1073111040, this.UART_CLKDIV_REG = 1072955412, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612856, this.XTAL_CLK_DIVIDER = 1, this.IROM_MAP_START = 1074593792, this.IROM_MAP_END = 1077936128, this.DROM_MAP_START = 1061158912, this.DROM_MAP_END = 1065353216, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1061158912, 1065353216, "DROM"], [1065353216, 1069547520, "EXTRAM_DATA"], [1073217536, 1073225728, "RTC_DRAM"], [1073283072, 1073741824, "BYTE_ACCESSIBLE"], [1073405952, 1073741824, "DRAM"], [1073610752, 1073741820, "DIRAM_DRAM"], [1073741824, 1074200576, "IROM"], [1074200576, 1074233344, "CACHE_PRO"], [1074233344, 1074266112, "CACHE_APP"], [1074266112, 1074397184, "IRAM"], [1074397184, 1074528252, "DIRAM_IRAM"], [1074528256, 1074536448, "RTC_IRAM"], [1074593792, 1077936128, "IROM"], [1342177280, 1342185472, "RTC_DATA"]], this.FLASH_SIZES = { "1MB": 0, "2MB": 16, "4MB": 32, "8MB": 48, "16MB": 64, "32MB": 80, "64MB": 96, "128MB": 112 }, this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "26m": 1, "20m": 2 }, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 4096, this.SPI_REG_BASE = 1072963584, this.SPI_USR_OFFS = 28, this.SPI_USR1_OFFS = 32, this.SPI_USR2_OFFS = 36, this.SPI_W0_OFFS = 128, this.SPI_MOSI_DLEN_OFFS = 40, this.SPI_MISO_DLEN_OFFS = 44;
  }
  async readEfuse(t, e) {
    const i = this.EFUSE_RD_REG_BASE + 4 * e;
    return t.debug("Read efuse " + i), await t.readReg(i);
  }
  async getPkgVersion(t) {
    const e = await this.readEfuse(t, 3);
    let i = e >> 9 & 7;
    return i += (e >> 2 & 1) << 3, i;
  }
  async getChipRevision(t) {
    const e = await this.readEfuse(t, 3), i = await this.readEfuse(t, 5), r = await t.readReg(this.DR_REG_SYSCON_BASE + 124);
    return (e >> 15 & 1) != 0 ? (i >> 20 & 1) != 0 ? (r >> 31 & 1) != 0 ? 3 : 2 : 1 : 0;
  }
  async getChipDescription(t) {
    const e = ["ESP32-D0WDQ6", "ESP32-D0WD", "ESP32-D2WD", "", "ESP32-U4WDH", "ESP32-PICO-D4", "ESP32-PICO-V3-02"];
    let i = "";
    const r = await this.getPkgVersion(t), o = await this.getChipRevision(t), a = o == 3;
    return (1 & await this.readEfuse(t, 3)) != 0 && (e[0] = "ESP32-S0WDQ6", e[1] = "ESP32-S0WD"), a && (e[5] = "ESP32-PICO-V3"), i = r >= 0 && r <= 6 ? e[r] : "Unknown ESP32", !a || r !== 0 && r !== 1 || (i += "-V3"), i + " (revision " + o + ")";
  }
  async getChipFeatures(t) {
    const e = ["Wi-Fi"], i = await this.readEfuse(t, 3);
    (2 & i) === 0 && e.push(" BT"), (1 & i) !== 0 ? e.push(" Single Core") : e.push(" Dual Core"), (8192 & i) !== 0 && ((4096 & i) !== 0 ? e.push(" 160MHz") : e.push(" 240MHz"));
    const r = await this.getPkgVersion(t);
    [2, 4, 5, 6].indexOf(r) !== -1 && e.push(" Embedded Flash"), r === 6 && e.push(" Embedded PSRAM"), (await this.readEfuse(t, 4) >> 8 & 31) !== 0 && e.push(" VRef calibration in efuse"), (i >> 14 & 1) !== 0 && e.push(" BLK3 partially reserved");
    const o = 3 & await this.readEfuse(t, 6);
    return e.push(" Coding Scheme " + ["None", "3/4", "Repeat (UNSUPPORTED)", "Invalid"][o]), e;
  }
  async getCrystalFreq(t) {
    const e = await t.readReg(this.UART_CLKDIV_REG) & this.UART_CLKDIV_MASK, i = t.transport.baudrate * e / 1e6 / this.XTAL_CLK_DIVIDER;
    let r;
    return r = i > 33 ? 40 : 26, Math.abs(r - i) > 1 && t.info("WARNING: Unsupported crystal in use"), r;
  }
  _d2h(t) {
    const e = (+t).toString(16);
    return e.length === 1 ? "0" + e : e;
  }
  async readMac(t) {
    let e = await this.readEfuse(t, 1);
    e >>>= 0;
    let i = await this.readEfuse(t, 2);
    i >>>= 0;
    const r = new Uint8Array(6);
    return r[0] = i >> 8 & 255, r[1] = 255 & i, r[2] = e >> 24 & 255, r[3] = e >> 16 & 255, r[4] = e >> 8 & 255, r[5] = 255 & e, this._d2h(r[0]) + ":" + this._d2h(r[1]) + ":" + this._d2h(r[2]) + ":" + this._d2h(r[3]) + ":" + this._d2h(r[4]) + ":" + this._d2h(r[5]);
  }
};
const ng = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32ROM: pi
}, Symbol.toStringTag, { value: "Module" }));
let Or = class extends pi {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-C3", this.IMAGE_CHIP_ID = 5, this.EFUSE_BASE = 1610647552, this.MAC_EFUSE_REG = this.EFUSE_BASE + 68, this.UART_CLKDIV_REG = 1072955412, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612860, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 0, this.SPI_REG_BASE = 1610620928, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1115684864, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1006632960, 1015021568, "DROM"], [1070071808, 1070465024, "DRAM"], [1070104576, 1070596096, "BYTE_ACCESSIBLE"], [1072693248, 1072824320, "DROM_MASK"], [1073741824, 1074135040, "IROM_MASK"], [1107296256, 1115684864, "IROM"], [1077395456, 1077805056, "IRAM"], [1342177280, 1342185472, "RTC_IRAM"], [1342177280, 1342185472, "RTC_DRAM"], [1611653120, 1611661312, "MEM_INTERNAL2"]];
  }
  async getPkgVersion(t) {
    const e = this.EFUSE_BASE + 68 + 12;
    return await t.readReg(e) >> 21 & 7;
  }
  async getChipRevision(t) {
    const e = this.EFUSE_BASE + 68 + 12;
    return (await t.readReg(e) & 7 << 18) >> 18;
  }
  async getMinorChipVersion(t) {
    const e = this.EFUSE_BASE + 68 + 20, i = await t.readReg(e) >> 23 & 1, r = this.EFUSE_BASE + 68 + 12;
    return (i << 3) + (await t.readReg(r) >> 18 & 7);
  }
  async getMajorChipVersion(t) {
    const e = this.EFUSE_BASE + 68 + 20;
    return await t.readReg(e) >> 24 & 3;
  }
  async getChipDescription(t) {
    const e = await this.getPkgVersion(t), i = await this.getMajorChipVersion(t), r = await this.getMinorChipVersion(t);
    return `${{ 0: "ESP32-C3 (QFN32)", 1: "ESP8685 (QFN28)", 2: "ESP32-C3 AZ (QFN32)", 3: "ESP8686 (QFN24)" }[e] || "Unknown ESP32-C3"} (revision v${i}.${r})`;
  }
  async getFlashCap(t) {
    const e = this.EFUSE_BASE + 68 + 12;
    return await t.readReg(e) >> 27 & 7;
  }
  async getFlashVendor(t) {
    const e = this.EFUSE_BASE + 68 + 16;
    return { 1: "XMC", 2: "GD", 3: "FM", 4: "TT", 5: "ZBIT" }[await t.readReg(e) >> 0 & 7] || "";
  }
  async getChipFeatures(t) {
    const e = ["Wi-Fi", "BLE"], i = await this.getFlashCap(t), r = await this.getFlashVendor(t), o = { 0: null, 1: "Embedded Flash 4MB", 2: "Embedded Flash 2MB", 3: "Embedded Flash 1MB", 4: "Embedded Flash 8MB" }[i], a = o !== void 0 ? o : "Unknown Embedded Flash";
    return o !== null && e.push(`${a} (${r})`), e;
  }
  async getCrystalFreq(t) {
    return 40;
  }
  _d2h(t) {
    const e = (+t).toString(16);
    return e.length === 1 ? "0" + e : e;
  }
  async readMac(t) {
    let e = await t.readReg(this.MAC_EFUSE_REG);
    e >>>= 0;
    let i = await t.readReg(this.MAC_EFUSE_REG + 4);
    i = i >>> 0 & 65535;
    const r = new Uint8Array(6);
    return r[0] = i >> 8 & 255, r[1] = 255 & i, r[2] = e >> 24 & 255, r[3] = e >> 16 & 255, r[4] = e >> 8 & 255, r[5] = 255 & e, this._d2h(r[0]) + ":" + this._d2h(r[1]) + ":" + this._d2h(r[2]) + ":" + this._d2h(r[3]) + ":" + this._d2h(r[4]) + ":" + this._d2h(r[5]);
  }
  getEraseSize(t, e) {
    return e;
  }
};
const lg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32C3ROM: Or
}, Symbol.toStringTag, { value: "Module" }));
let cg = class extends Or {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-C2", this.IMAGE_CHIP_ID = 12, this.EFUSE_BASE = 1610647552, this.MAC_EFUSE_REG = this.EFUSE_BASE + 64, this.UART_CLKDIV_REG = 1610612756, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612860, this.XTAL_CLK_DIVIDER = 1, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 0, this.SPI_REG_BASE = 1610620928, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1111490560, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1006632960, 1010827264, "DROM"], [1070202880, 1070465024, "DRAM"], [1070104576, 1070596096, "BYTE_ACCESSIBLE"], [1072693248, 1073020928, "DROM_MASK"], [1073741824, 1074331648, "IROM_MASK"], [1107296256, 1111490560, "IROM"], [1077395456, 1077673984, "IRAM"]];
  }
  async getPkgVersion(t) {
    const e = this.EFUSE_BASE + 64 + 4;
    return await t.readReg(e) >> 22 & 7;
  }
  async getChipRevision(t) {
    const e = this.EFUSE_BASE + 64 + 4;
    return (await t.readReg(e) & 3 << 20) >> 20;
  }
  async getChipDescription(t) {
    let e;
    const i = await this.getPkgVersion(t);
    return e = i === 0 || i === 1 ? "ESP32-C2" : "unknown ESP32-C2", e += " (revision " + await this.getChipRevision(t) + ")", e;
  }
  async getChipFeatures(t) {
    return ["Wi-Fi", "BLE"];
  }
  async getCrystalFreq(t) {
    const e = await t.readReg(this.UART_CLKDIV_REG) & this.UART_CLKDIV_MASK, i = t.transport.baudrate * e / 1e6 / this.XTAL_CLK_DIVIDER;
    let r;
    return r = i > 33 ? 40 : 26, Math.abs(r - i) > 1 && t.info("WARNING: Unsupported crystal in use"), r;
  }
  async changeBaudRate(t) {
    await this.getCrystalFreq(t) === 26 && t.changeBaud();
  }
  _d2h(t) {
    const e = (+t).toString(16);
    return e.length === 1 ? "0" + e : e;
  }
  async readMac(t) {
    let e = await t.readReg(this.MAC_EFUSE_REG);
    e >>>= 0;
    let i = await t.readReg(this.MAC_EFUSE_REG + 4);
    i = i >>> 0 & 65535;
    const r = new Uint8Array(6);
    return r[0] = i >> 8 & 255, r[1] = 255 & i, r[2] = e >> 24 & 255, r[3] = e >> 16 & 255, r[4] = e >> 8 & 255, r[5] = 255 & e, this._d2h(r[0]) + ":" + this._d2h(r[1]) + ":" + this._d2h(r[2]) + ":" + this._d2h(r[3]) + ":" + this._d2h(r[4]) + ":" + this._d2h(r[5]);
  }
  getEraseSize(t, e) {
    return e;
  }
};
const dg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32C2ROM: cg
}, Symbol.toStringTag, { value: "Module" }));
class as extends Or {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-C6", this.IMAGE_CHIP_ID = 13, this.EFUSE_BASE = 1611335680, this.EFUSE_BLOCK1_ADDR = this.EFUSE_BASE + 68, this.MAC_EFUSE_REG = this.EFUSE_BASE + 68, this.UART_CLKDIV_REG = 1072955412, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612860, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 0, this.SPI_REG_BASE = 1610620928, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1115684864, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1107296256, 1124073472, "DROM"], [1082130432, 1082654720, "DRAM"], [1082130432, 1082654720, "BYTE_ACCESSIBLE"], [1074048e3, 1074069504, "DROM_MASK"], [1073741824, 1074048e3, "IROM_MASK"], [1107296256, 1124073472, "IROM"], [1082130432, 1082654720, "IRAM"], [1342177280, 1342193664, "RTC_IRAM"], [1342177280, 1342193664, "RTC_DRAM"], [1611653120, 1611661312, "MEM_INTERNAL2"]];
  }
  async getPkgVersion(t) {
    const e = this.EFUSE_BASE + 68 + 12;
    return await t.readReg(e) >> 21 & 7;
  }
  async getChipRevision(t) {
    const e = this.EFUSE_BASE + 68 + 12;
    return (await t.readReg(e) & 7 << 18) >> 18;
  }
  async getChipDescription(t) {
    let e;
    return e = await this.getPkgVersion(t) === 0 ? "ESP32-C6" : "unknown ESP32-C6", e += " (revision " + await this.getChipRevision(t) + ")", e;
  }
  async getChipFeatures(t) {
    return ["Wi-Fi 6", "BT 5", "IEEE802.15.4"];
  }
  async getCrystalFreq(t) {
    return 40;
  }
  _d2h(t) {
    const e = (+t).toString(16);
    return e.length === 1 ? "0" + e : e;
  }
  async readMac(t) {
    let e = await t.readReg(this.MAC_EFUSE_REG);
    e >>>= 0;
    let i = await t.readReg(this.MAC_EFUSE_REG + 4);
    i = i >>> 0 & 65535;
    const r = new Uint8Array(6);
    return r[0] = i >> 8 & 255, r[1] = 255 & i, r[2] = e >> 24 & 255, r[3] = e >> 16 & 255, r[4] = e >> 8 & 255, r[5] = 255 & e, this._d2h(r[0]) + ":" + this._d2h(r[1]) + ":" + this._d2h(r[2]) + ":" + this._d2h(r[3]) + ":" + this._d2h(r[4]) + ":" + this._d2h(r[5]);
  }
  getEraseSize(t, e) {
    return e;
  }
}
const hg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32C6ROM: as
}, Symbol.toStringTag, { value: "Module" }));
let Ag = class extends as {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-C61", this.IMAGE_CHIP_ID = 20, this.CHIP_DETECT_MAGIC_VALUE = [871374959, 606167151], this.UART_DATE_REG_ADDR = 1610612860, this.EFUSE_BASE = 1611352064, this.EFUSE_BLOCK1_ADDR = this.EFUSE_BASE + 68, this.MAC_EFUSE_REG = this.EFUSE_BASE + 68, this.EFUSE_RD_REG_BASE = this.EFUSE_BASE + 48, this.EFUSE_PURPOSE_KEY0_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY0_SHIFT = 0, this.EFUSE_PURPOSE_KEY1_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY1_SHIFT = 4, this.EFUSE_PURPOSE_KEY2_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY2_SHIFT = 8, this.EFUSE_PURPOSE_KEY3_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY3_SHIFT = 12, this.EFUSE_PURPOSE_KEY4_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY4_SHIFT = 16, this.EFUSE_PURPOSE_KEY5_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY5_SHIFT = 20, this.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT_REG = this.EFUSE_RD_REG_BASE, this.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT = 1 << 20, this.EFUSE_SPI_BOOT_CRYPT_CNT_REG = this.EFUSE_BASE + 48, this.EFUSE_SPI_BOOT_CRYPT_CNT_MASK = 7 << 23, this.EFUSE_SECURE_BOOT_EN_REG = this.EFUSE_BASE + 52, this.EFUSE_SECURE_BOOT_EN_MASK = 1 << 26, this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "20m": 2 }, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1115684864, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1098907648, 1107296256, "DROM"], [1082130432, 1082523648, "DRAM"], [1082130432, 1082523648, "BYTE_ACCESSIBLE"], [1074048e3, 1074069504, "DROM_MASK"], [1073741824, 1074048e3, "IROM_MASK"], [1090519040, 1098907648, "IROM"], [1082130432, 1082523648, "IRAM"], [1342177280, 1342193664, "RTC_IRAM"], [1342177280, 1342193664, "RTC_DRAM"], [1611653120, 1611661312, "MEM_INTERNAL2"]], this.UF2_FAMILY_ID = 2010665156, this.EFUSE_MAX_KEY = 5, this.KEY_PURPOSES = { 0: "USER/EMPTY", 1: "ECDSA_KEY", 2: "XTS_AES_256_KEY_1", 3: "XTS_AES_256_KEY_2", 4: "XTS_AES_128_KEY", 5: "HMAC_DOWN_ALL", 6: "HMAC_DOWN_JTAG", 7: "HMAC_DOWN_DIGITAL_SIGNATURE", 8: "HMAC_UP", 9: "SECURE_BOOT_DIGEST0", 10: "SECURE_BOOT_DIGEST1", 11: "SECURE_BOOT_DIGEST2", 12: "KM_INIT_KEY", 13: "XTS_AES_256_KEY_1_PSRAM", 14: "XTS_AES_256_KEY_2_PSRAM", 15: "XTS_AES_128_KEY_PSRAM" };
  }
  async getPkgVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 8) >> 26 & 7;
  }
  async getMinorChipVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 8) >> 0 & 15;
  }
  async getMajorChipVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 8) >> 4 & 3;
  }
  async getChipDescription(t) {
    let e;
    return e = await this.getPkgVersion(t) === 0 ? "ESP32-C61" : "unknown ESP32-C61", `${e} (revision v${await this.getMajorChipVersion(t)}.${await this.getMinorChipVersion(t)})`;
  }
  async getChipFeatures(t) {
    return ["WiFi 6", "BT 5"];
  }
  async readMac(t) {
    let e = await t.readReg(this.MAC_EFUSE_REG);
    e >>>= 0;
    let i = await t.readReg(this.MAC_EFUSE_REG + 4);
    i = i >>> 0 & 65535;
    const r = new Uint8Array(6);
    return r[0] = i >> 8 & 255, r[1] = 255 & i, r[2] = e >> 24 & 255, r[3] = e >> 16 & 255, r[4] = e >> 8 & 255, r[5] = 255 & e, this._d2h(r[0]) + ":" + this._d2h(r[1]) + ":" + this._d2h(r[2]) + ":" + this._d2h(r[3]) + ":" + this._d2h(r[4]) + ":" + this._d2h(r[5]);
  }
};
const pg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32C61ROM: Ag
}, Symbol.toStringTag, { value: "Module" }));
let gg = class extends as {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-C5", this.IMAGE_CHIP_ID = 23, this.BOOTLOADER_FLASH_OFFSET = 8192, this.EFUSE_BASE = 1611352064, this.EFUSE_BLOCK1_ADDR = this.EFUSE_BASE + 68, this.MAC_EFUSE_REG = this.EFUSE_BASE + 68, this.UART_CLKDIV_REG = 1610612756, this.EFUSE_RD_REG_BASE = this.EFUSE_BASE + 48, this.EFUSE_FORCE_USE_KEY_MANAGER_KEY_REG = this.EFUSE_BASE + 52, this.EFUSE_FORCE_USE_KEY_MANAGER_KEY_SHIFT = 10, this.FORCE_USE_KEY_MANAGER_VAL_XTS_AES_KEY = 2, this.EFUSE_PURPOSE_KEY0_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY0_SHIFT = 22, this.EFUSE_PURPOSE_KEY1_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY1_SHIFT = 27, this.EFUSE_PURPOSE_KEY2_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY2_SHIFT = 0, this.EFUSE_PURPOSE_KEY3_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY3_SHIFT = 5, this.EFUSE_PURPOSE_KEY4_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY4_SHIFT = 10, this.EFUSE_PURPOSE_KEY5_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY5_SHIFT = 15, this.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT_REG = this.EFUSE_RD_REG_BASE, this.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT = 1 << 20, this.EFUSE_SPI_BOOT_CRYPT_CNT_REG = this.EFUSE_BASE + 52, this.EFUSE_SPI_BOOT_CRYPT_CNT_MASK = 7 << 18, this.EFUSE_SECURE_BOOT_EN_REG = this.EFUSE_BASE + 56, this.EFUSE_SECURE_BOOT_EN_MASK = 1 << 20, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1140850688, this.DROM_MAP_START = 1107296256, this.DROM_MAP_END = 1140850688, this.PCR_SYSCLK_CONF_REG = 1611227408, this.PCR_SYSCLK_XTAL_FREQ_V = 127 << 24, this.PCR_SYSCLK_XTAL_FREQ_S = 24, this.XTAL_CLK_DIVIDER = 1, this.UARTDEV_BUF_NO = 1082520852, this.CHIP_DETECT_MAGIC_VALUE = [285294703, 1675706479, 1607549039], this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "20m": 2 }, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1107296256, 1140850688, "DROM"], [1082130432, 1082523648, "DRAM"], [1082130432, 1082523648, "BYTE_ACCESSIBLE"], [1073979392, 1074003968, "DROM_MASK"], [1073741824, 1073979392, "IROM_MASK"], [1107296256, 1140850688, "IROM"], [1082130432, 1082523648, "IRAM"], [1342177280, 1342193664, "RTC_IRAM"], [1342177280, 1342193664, "RTC_DRAM"], [1611653120, 1611661312, "MEM_INTERNAL2"]], this.UF2_FAMILY_ID = 4145808195, this.EFUSE_MAX_KEY = 5, this.PURPOSE_VAL_XTS_AES128_KEY = 4, this.KEY_PURPOSES = { 0: "USER/EMPTY", 1: "ECDSA_KEY", 4: "XTS_AES_128_KEY", 5: "HMAC_DOWN_ALL", 6: "HMAC_DOWN_JTAG", 7: "HMAC_DOWN_DIGITAL_SIGNATURE", 8: "HMAC_UP", 9: "SECURE_BOOT_DIGEST0", 10: "SECURE_BOOT_DIGEST1", 11: "SECURE_BOOT_DIGEST2", 12: "KM_INIT_KEY", 15: "XTS_AES_128_PSRAM_KEY", 16: "ECDSA_KEY_P192", 17: "ECDSA_KEY_P384_L", 18: "ECDSA_KEY_P384_H" };
  }
  async getPkgVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 8) >> 26 & 7;
  }
  async getMinorChipVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 8) >> 0 & 15;
  }
  async getMajorChipVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 8) >> 4 & 3;
  }
  async getChipDescription(t) {
    let e;
    return e = await this.getPkgVersion(t) === 0 ? "ESP32-C5" : "unknown ESP32-C5", `${e} (revision v${await this.getMajorChipVersion(t)}.${await this.getMinorChipVersion(t)})`;
  }
  async getChipFeatures(t) {
    return ["Wi-Fi 6 (dual-band)", "BT 5 (LE)", "IEEE802.15.4", "Single Core + LP Core", "240MHz"];
  }
  async getCrystalFreq(t) {
    const e = await t.readReg(this.UART_CLKDIV_REG) & this.UART_CLKDIV_MASK, i = t.transport.baudrate * e / 1e6 / this.XTAL_CLK_DIVIDER;
    let r;
    return r = i > 45 ? 48 : i > 33 ? 40 : 26, Math.abs(r - i) > 1 && t.info("WARNING: Unsupported crystal in use"), r;
  }
  async getCrystalFreqRomExpect(t) {
    return (await t.readReg(this.PCR_SYSCLK_CONF_REG) & this.PCR_SYSCLK_XTAL_FREQ_V) >> this.PCR_SYSCLK_XTAL_FREQ_S;
  }
  async getKeyBlockPurpose(t, e) {
    if (e < 0 || e > this.EFUSE_MAX_KEY) throw new Error(`Valid key block numbers must be in range 0-${this.EFUSE_MAX_KEY}`);
    const i = [[this.EFUSE_PURPOSE_KEY0_REG, this.EFUSE_PURPOSE_KEY0_SHIFT], [this.EFUSE_PURPOSE_KEY1_REG, this.EFUSE_PURPOSE_KEY1_SHIFT], [this.EFUSE_PURPOSE_KEY2_REG, this.EFUSE_PURPOSE_KEY2_SHIFT], [this.EFUSE_PURPOSE_KEY3_REG, this.EFUSE_PURPOSE_KEY3_SHIFT], [this.EFUSE_PURPOSE_KEY4_REG, this.EFUSE_PURPOSE_KEY4_SHIFT], [this.EFUSE_PURPOSE_KEY5_REG, this.EFUSE_PURPOSE_KEY5_SHIFT]], [r, o] = i[e];
    return await t.readReg(r) >> o & 31;
  }
  async isFlashEncryptionKeyValid(t) {
    const e = [];
    for (let i = 0; i <= this.EFUSE_MAX_KEY; i++) {
      const r = await this.getKeyBlockPurpose(t, i);
      e.push(r);
    }
    return e.some(((i) => i === this.PURPOSE_VAL_XTS_AES128_KEY)) ? !0 : (await t.readReg(this.EFUSE_FORCE_USE_KEY_MANAGER_KEY_REG) >> this.EFUSE_FORCE_USE_KEY_MANAGER_KEY_SHIFT & this.FORCE_USE_KEY_MANAGER_VAL_XTS_AES_KEY) != 0;
  }
  checkSpiConnection(t, e) {
    if (!e.every(((i) => i >= 0 && i <= 28))) throw new Error("SPI Pin numbers must be in the range 0-28.");
    e.some(((i) => i === 13 || i === 14)) && t.info("GPIO pins 13 and 14 are used by USB-Serial/JTAG, consider using other pins for SPI flash connection.");
  }
  async usesUsbJtagSerial(t) {
    const e = this.UARTDEV_BUF_NO;
    return (255 & await t.readReg(e)) === 3;
  }
  async watchdogReset(t) {
    throw t.info("Hard resetting with a watchdog..."), new Error("watchdogReset not yet implemented for ESP32-C5");
  }
  async changeBaud(t) {
    if (!t.IS_STUB) {
      const e = await this.getCrystalFreqRomExpect(t), i = await this.getCrystalFreq(t);
      t.info(`ROM expects crystal freq: ${e} MHz, detected ${i} MHz.`), (i === 48 && e === 40 || i === 40 && e === 48) && t.info("Crystal frequency mismatch detected. Baud rate adjustment may be needed but is not fully implemented in this version.");
    }
    await t.changeBaud();
  }
};
const ug = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32C5ROM: gg
}, Symbol.toStringTag, { value: "Module" }));
class fg extends as {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-H2", this.IMAGE_CHIP_ID = 16, this.EFUSE_BASE = 1611335680, this.EFUSE_BLOCK1_ADDR = this.EFUSE_BASE + 68, this.MAC_EFUSE_REG = this.EFUSE_BASE + 68, this.UART_CLKDIV_REG = 1072955412, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612860, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 0, this.SPI_REG_BASE = 1610620928, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.USB_RAM_BLOCK = 2048, this.UARTDEV_BUF_NO_USB = 3, this.UARTDEV_BUF_NO = 1070526796, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1115684864, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1107296256, 1124073472, "DROM"], [1082130432, 1082654720, "DRAM"], [1082130432, 1082654720, "BYTE_ACCESSIBLE"], [1074048e3, 1074069504, "DROM_MASK"], [1073741824, 1074048e3, "IROM_MASK"], [1107296256, 1124073472, "IROM"], [1082130432, 1082654720, "IRAM"], [1342177280, 1342193664, "RTC_IRAM"], [1342177280, 1342193664, "RTC_DRAM"], [1611653120, 1611661312, "MEM_INTERNAL2"]];
  }
  async getPkgVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 16) >> 0 & 7;
  }
  async getMinorChipVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 12) >> 18 & 7;
  }
  async getMajorChipVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 12) >> 21 & 3;
  }
  async getChipDescription(t) {
    let e;
    return e = await this.getPkgVersion(t) === 0 ? "ESP32-H2" : "unknown ESP32-H2", `${e} (revision v${await this.getMajorChipVersion(t)}.${await this.getMinorChipVersion(t)})`;
  }
  async getChipFeatures(t) {
    return ["BT 5 (LE)", "IEEE802.15.4", "Single Core", "96MHz"];
  }
  async getCrystalFreq(t) {
    return 32;
  }
  _d2h(t) {
    const e = (+t).toString(16);
    return e.length === 1 ? "0" + e : e;
  }
  async postConnect(t) {
    const e = 255 & await t.readReg(this.UARTDEV_BUF_NO);
    t.debug("In _post_connect " + e), e == this.UARTDEV_BUF_NO_USB && (t.ESP_RAM_BLOCK = this.USB_RAM_BLOCK);
  }
  async readMac(t) {
    let e = await t.readReg(this.MAC_EFUSE_REG);
    e >>>= 0;
    let i = await t.readReg(this.MAC_EFUSE_REG + 4);
    i = i >>> 0 & 65535;
    const r = new Uint8Array(6);
    return r[0] = i >> 8 & 255, r[1] = 255 & i, r[2] = e >> 24 & 255, r[3] = e >> 16 & 255, r[4] = e >> 8 & 255, r[5] = 255 & e, this._d2h(r[0]) + ":" + this._d2h(r[1]) + ":" + this._d2h(r[2]) + ":" + this._d2h(r[3]) + ":" + this._d2h(r[4]) + ":" + this._d2h(r[5]);
  }
  getEraseSize(t, e) {
    return e;
  }
}
const mg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32H2ROM: fg
}, Symbol.toStringTag, { value: "Module" }));
class vg extends pi {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-S3", this.IMAGE_CHIP_ID = 9, this.EFUSE_BASE = 1610641408, this.MAC_EFUSE_REG = this.EFUSE_BASE + 68, this.EFUSE_BLOCK1_ADDR = this.EFUSE_BASE + 68, this.EFUSE_BLOCK2_ADDR = this.EFUSE_BASE + 92, this.UART_CLKDIV_REG = 1610612756, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612864, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 0, this.SPI_REG_BASE = 1610620928, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.USB_RAM_BLOCK = 2048, this.UARTDEV_BUF_NO_USB = 3, this.UARTDEV_BUF_NO = 1070526796, this.IROM_MAP_START = 1107296256, this.IROM_MAP_END = 1140850688, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1006632960, 1023410176, "DROM"], [1023410176, 1040187392, "EXTRAM_DATA"], [1611653120, 1611661312, "RTC_DRAM"], [1070104576, 1070596096, "BYTE_ACCESSIBLE"], [1070104576, 1077813248, "MEM_INTERNAL"], [1070104576, 1070596096, "DRAM"], [1073741824, 1073848576, "IROM_MASK"], [1077346304, 1077805056, "IRAM"], [1611653120, 1611661312, "RTC_IRAM"], [1107296256, 1115684864, "IROM"], [1342177280, 1342185472, "RTC_DATA"]];
  }
  async getChipDescription(t) {
    const e = await this.getMajorChipVersion(t), i = await this.getMinorChipVersion(t);
    return `${{ 0: "ESP32-S3 (QFN56)", 1: "ESP32-S3-PICO-1 (LGA56)" }[await this.getPkgVersion(t)] || "unknown ESP32-S3"} (revision v${e}.${i})`;
  }
  async getPkgVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 12) >> 21 & 7;
  }
  async getRawMinorChipVersion(t) {
    return ((await t.readReg(this.EFUSE_BLOCK1_ADDR + 20) >> 23 & 1) << 3) + (await t.readReg(this.EFUSE_BLOCK1_ADDR + 12) >> 18 & 7);
  }
  async getMinorChipVersion(t) {
    const e = await this.getRawMinorChipVersion(t);
    return await this.isEco0(t, e) ? 0 : this.getRawMinorChipVersion(t);
  }
  async getRawMajorChipVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 20) >> 24 & 3;
  }
  async getMajorChipVersion(t) {
    const e = await this.getRawMinorChipVersion(t);
    return await this.isEco0(t, e) ? 0 : this.getRawMajorChipVersion(t);
  }
  async getBlkVersionMajor(t) {
    return await t.readReg(this.EFUSE_BLOCK2_ADDR + 16) >> 0 & 3;
  }
  async getBlkVersionMinor(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 12) >> 24 & 7;
  }
  async isEco0(t, e) {
    return (7 & e) == 0 && await this.getBlkVersionMajor(t) === 1 && await this.getBlkVersionMinor(t) === 1;
  }
  async getFlashCap(t) {
    const e = this.EFUSE_BASE + 68 + 12;
    return await t.readReg(e) >> 27 & 7;
  }
  async getFlashVendor(t) {
    const e = this.EFUSE_BASE + 68 + 16;
    return { 1: "XMC", 2: "GD", 3: "FM", 4: "TT", 5: "BY" }[await t.readReg(e) >> 0 & 7] || "";
  }
  async getPsramCap(t) {
    const e = this.EFUSE_BASE + 68 + 16;
    return await t.readReg(e) >> 3 & 3;
  }
  async getPsramVendor(t) {
    const e = this.EFUSE_BASE + 68 + 16;
    return { 1: "AP_3v3", 2: "AP_1v8" }[await t.readReg(e) >> 7 & 3] || "";
  }
  async getChipFeatures(t) {
    const e = ["Wi-Fi", "BLE"], i = await this.getFlashCap(t), r = await this.getFlashVendor(t), o = { 0: null, 1: "Embedded Flash 8MB", 2: "Embedded Flash 4MB" }[i], a = o !== void 0 ? o : "Unknown Embedded Flash";
    o !== null && e.push(`${a} (${r})`);
    const n = await this.getPsramCap(t), l = await this.getPsramVendor(t), c = { 0: null, 1: "Embedded PSRAM 8MB", 2: "Embedded PSRAM 2MB" }[n], d = c !== void 0 ? c : "Unknown Embedded PSRAM";
    return c !== null && e.push(`${d} (${l})`), e;
  }
  async getCrystalFreq(t) {
    return 40;
  }
  _d2h(t) {
    const e = (+t).toString(16);
    return e.length === 1 ? "0" + e : e;
  }
  async postConnect(t) {
    const e = 255 & await t.readReg(this.UARTDEV_BUF_NO);
    t.debug("In _post_connect " + e), e == this.UARTDEV_BUF_NO_USB && (t.ESP_RAM_BLOCK = this.USB_RAM_BLOCK);
  }
  async readMac(t) {
    let e = await t.readReg(this.MAC_EFUSE_REG);
    e >>>= 0;
    let i = await t.readReg(this.MAC_EFUSE_REG + 4);
    i = i >>> 0 & 65535;
    const r = new Uint8Array(6);
    return r[0] = i >> 8 & 255, r[1] = 255 & i, r[2] = e >> 24 & 255, r[3] = e >> 16 & 255, r[4] = e >> 8 & 255, r[5] = 255 & e, this._d2h(r[0]) + ":" + this._d2h(r[1]) + ":" + this._d2h(r[2]) + ":" + this._d2h(r[3]) + ":" + this._d2h(r[4]) + ":" + this._d2h(r[5]);
  }
  getEraseSize(t, e) {
    return e;
  }
}
const _g = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32S3ROM: vg
}, Symbol.toStringTag, { value: "Module" }));
let Eg = class extends pi {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-S2", this.IMAGE_CHIP_ID = 2, this.IROM_MAP_START = 1074266112, this.IROM_MAP_END = 1085800448, this.DROM_MAP_START = 1056964608, this.DROM_MAP_END = 1061093376, this.CHIP_DETECT_MAGIC_VALUE = [1990], this.SPI_REG_BASE = 1061167104, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.SPI_ADDR_REG_MSB = !1, this.MAC_EFUSE_REG = 1061265476, this.UART_CLKDIV_REG = 1061158932, this.SUPPORTS_ENCRYPTED_FLASH = !0, this.FLASH_ENCRYPTED_WRITE_ALIGN = 16, this.EFUSE_BASE = 1061265408, this.EFUSE_RD_REG_BASE = this.EFUSE_BASE + 48, this.EFUSE_BLOCK1_ADDR = this.EFUSE_BASE + 68, this.EFUSE_BLOCK2_ADDR = this.EFUSE_BASE + 92, this.EFUSE_PURPOSE_KEY0_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY0_SHIFT = 24, this.EFUSE_PURPOSE_KEY1_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY1_SHIFT = 28, this.EFUSE_PURPOSE_KEY2_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY2_SHIFT = 0, this.EFUSE_PURPOSE_KEY3_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY3_SHIFT = 4, this.EFUSE_PURPOSE_KEY4_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY4_SHIFT = 8, this.EFUSE_PURPOSE_KEY5_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY5_SHIFT = 12, this.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT_REG = this.EFUSE_RD_REG_BASE, this.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT = 1 << 19, this.EFUSE_SPI_BOOT_CRYPT_CNT_REG = this.EFUSE_BASE + 52, this.EFUSE_SPI_BOOT_CRYPT_CNT_MASK = 7 << 18, this.EFUSE_SECURE_BOOT_EN_REG = this.EFUSE_BASE + 56, this.EFUSE_SECURE_BOOT_EN_MASK = 1 << 20, this.EFUSE_RD_REPEAT_DATA3_REG = this.EFUSE_BASE + 60, this.EFUSE_RD_REPEAT_DATA3_REG_FLASH_TYPE_MASK = 512, this.PURPOSE_VAL_XTS_AES256_KEY_1 = 2, this.PURPOSE_VAL_XTS_AES256_KEY_2 = 3, this.PURPOSE_VAL_XTS_AES128_KEY = 4, this.UARTDEV_BUF_NO = 1073741076, this.UARTDEV_BUF_NO_USB_OTG = 2, this.USB_RAM_BLOCK = 2048, this.GPIO_STRAP_REG = 1061175352, this.GPIO_STRAP_SPI_BOOT_MASK = 8, this.GPIO_STRAP_VDDSPI_MASK = 16, this.RTC_CNTL_OPTION1_REG = 1061191976, this.RTC_CNTL_FORCE_DOWNLOAD_BOOT_MASK = 1, this.RTCCNTL_BASE_REG = 1061191680, this.RTC_CNTL_WDTCONFIG0_REG = this.RTCCNTL_BASE_REG + 148, this.RTC_CNTL_WDTCONFIG1_REG = this.RTCCNTL_BASE_REG + 152, this.RTC_CNTL_WDTWPROTECT_REG = this.RTCCNTL_BASE_REG + 172, this.RTC_CNTL_WDT_WKEY = 1356348065, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1056964608, 1073217536, "DROM"], [1062207488, 1073217536, "EXTRAM_DATA"], [1073340416, 1073348608, "RTC_DRAM"], [1073340416, 1073741824, "BYTE_ACCESSIBLE"], [1073340416, 1074208768, "MEM_INTERNAL"], [1073414144, 1073741824, "DRAM"], [1073741824, 1073848576, "IROM_MASK"], [1073872896, 1074200576, "IRAM"], [1074200576, 1074208768, "RTC_IRAM"], [1074266112, 1082130432, "IROM"], [1342177280, 1342185472, "RTC_DATA"]], this.EFUSE_VDD_SPI_REG = this.EFUSE_BASE + 52, this.VDD_SPI_XPD = 16, this.VDD_SPI_TIEH = 32, this.VDD_SPI_FORCE = 64, this.UF2_FAMILY_ID = 3218951918, this.EFUSE_MAX_KEY = 5, this.KEY_PURPOSES = { 0: "USER/EMPTY", 1: "RESERVED", 2: "XTS_AES_256_KEY_1", 3: "XTS_AES_256_KEY_2", 4: "XTS_AES_128_KEY", 5: "HMAC_DOWN_ALL", 6: "HMAC_DOWN_JTAG", 7: "HMAC_DOWN_DIGITAL_SIGNATURE", 8: "HMAC_UP", 9: "SECURE_BOOT_DIGEST0", 10: "SECURE_BOOT_DIGEST1", 11: "SECURE_BOOT_DIGEST2" }, this.UART_CLKDIV_MASK = 1048575, this.UART_DATE_REG_ADDR = 1610612856, this.FLASH_WRITE_SIZE = 1024, this.BOOTLOADER_FLASH_OFFSET = 4096;
  }
  async getPkgVersion(t) {
    const e = this.EFUSE_BLOCK1_ADDR + 16;
    return await t.readReg(e) >> 0 & 15;
  }
  async getMinorChipVersion(t) {
    return ((await t.readReg(this.EFUSE_BLOCK1_ADDR + 12) >> 20 & 1) << 3) + (await t.readReg(this.EFUSE_BLOCK1_ADDR + 16) >> 4 & 7);
  }
  async getMajorChipVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 12) >> 18 & 3;
  }
  async getFlashVersion(t) {
    return await t.readReg(this.EFUSE_BLOCK1_ADDR + 12) >> 21 & 15;
  }
  async getChipDescription(t) {
    const e = await this.getFlashCap(t) + 100 * await this.getPsramCap(t), i = await this.getMajorChipVersion(t), r = await this.getMinorChipVersion(t);
    return `${{ 0: "ESP32-S2", 1: "ESP32-S2FH2", 2: "ESP32-S2FH4", 102: "ESP32-S2FNR2", 100: "ESP32-S2R2" }[e] || "unknown ESP32-S2"} (revision v${i}.${r})`;
  }
  async getFlashCap(t) {
    return await this.getFlashVersion(t);
  }
  async getPsramVersion(t) {
    const e = this.EFUSE_BLOCK1_ADDR + 12;
    return await t.readReg(e) >> 28 & 15;
  }
  async getPsramCap(t) {
    return await this.getPsramVersion(t);
  }
  async getBlock2Version(t) {
    const e = this.EFUSE_BLOCK2_ADDR + 16;
    return await t.readReg(e) >> 4 & 7;
  }
  async getChipFeatures(t) {
    const e = ["Wi-Fi"], i = { 0: "No Embedded Flash", 1: "Embedded Flash 2MB", 2: "Embedded Flash 4MB" }[await this.getFlashCap(t)] || "Unknown Embedded Flash";
    e.push(i);
    const r = { 0: "No Embedded Flash", 1: "Embedded PSRAM 2MB", 2: "Embedded PSRAM 4MB" }[await this.getPsramCap(t)] || "Unknown Embedded PSRAM";
    e.push(r);
    const o = { 0: "No calibration in BLK2 of efuse", 1: "ADC and temperature sensor calibration in BLK2 of efuse V1", 2: "ADC and temperature sensor calibration in BLK2 of efuse V2" }[await this.getBlock2Version(t)] || "Unknown Calibration in BLK2";
    return e.push(o), e;
  }
  async getCrystalFreq(t) {
    return 40;
  }
  _d2h(t) {
    const e = (+t).toString(16);
    return e.length === 1 ? "0" + e : e;
  }
  async readMac(t) {
    let e = await t.readReg(this.MAC_EFUSE_REG);
    e >>>= 0;
    let i = await t.readReg(this.MAC_EFUSE_REG + 4);
    i = i >>> 0 & 65535;
    const r = new Uint8Array(6);
    return r[0] = i >> 8 & 255, r[1] = 255 & i, r[2] = e >> 24 & 255, r[3] = e >> 16 & 255, r[4] = e >> 8 & 255, r[5] = 255 & e, this._d2h(r[0]) + ":" + this._d2h(r[1]) + ":" + this._d2h(r[2]) + ":" + this._d2h(r[3]) + ":" + this._d2h(r[4]) + ":" + this._d2h(r[5]);
  }
  getEraseSize(t, e) {
    return e;
  }
  async usingUsbOtg(t) {
    return (255 & await t.readReg(this.UARTDEV_BUF_NO)) === this.UARTDEV_BUF_NO_USB_OTG;
  }
  async postConnect(t) {
    const e = await this.usingUsbOtg(t);
    t.debug("In _post_connect using USB OTG ?" + e), e && (t.ESP_RAM_BLOCK = this.USB_RAM_BLOCK);
  }
};
const wg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32S2ROM: Eg
}, Symbol.toStringTag, { value: "Module" }));
class bg extends pi {
  constructor() {
    super(...arguments), this.CHIP_NAME = "ESP32-P4", this.IMAGE_CHIP_ID = 18, this.IROM_MAP_START = 1073741824, this.IROM_MAP_END = 1275068416, this.DROM_MAP_START = 1073741824, this.DROM_MAP_END = 1275068416, this.BOOTLOADER_FLASH_OFFSET = 8192, this.CHIP_DETECT_MAGIC_VALUE = [0, 182303440], this.UART_DATE_REG_ADDR = 1343004812, this.EFUSE_BASE = 1343410176, this.EFUSE_BLOCK1_ADDR = this.EFUSE_BASE + 68, this.MAC_EFUSE_REG = this.EFUSE_BASE + 68, this.SPI_REG_BASE = 1342754816, this.SPI_USR_OFFS = 24, this.SPI_USR1_OFFS = 28, this.SPI_USR2_OFFS = 32, this.SPI_MOSI_DLEN_OFFS = 36, this.SPI_MISO_DLEN_OFFS = 40, this.SPI_W0_OFFS = 88, this.SPI_ADDR_REG_MSB = !1, this.USES_MAGIC_VALUE = !1, this.EFUSE_RD_REG_BASE = this.EFUSE_BASE + 48, this.EFUSE_FORCE_USE_KEY_MANAGER_KEY_REG = this.EFUSE_BASE + 52, this.EFUSE_FORCE_USE_KEY_MANAGER_KEY_SHIFT = 9, this.FORCE_USE_KEY_MANAGER_VAL_XTS_AES_KEY = 2, this.EFUSE_PURPOSE_KEY0_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY0_SHIFT = 24, this.EFUSE_PURPOSE_KEY1_REG = this.EFUSE_BASE + 52, this.EFUSE_PURPOSE_KEY1_SHIFT = 28, this.EFUSE_PURPOSE_KEY2_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY2_SHIFT = 0, this.EFUSE_PURPOSE_KEY3_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY3_SHIFT = 4, this.EFUSE_PURPOSE_KEY4_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY4_SHIFT = 8, this.EFUSE_PURPOSE_KEY5_REG = this.EFUSE_BASE + 56, this.EFUSE_PURPOSE_KEY5_SHIFT = 12, this.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT_REG = this.EFUSE_RD_REG_BASE, this.EFUSE_DIS_DOWNLOAD_MANUAL_ENCRYPT = 1 << 20, this.EFUSE_SPI_BOOT_CRYPT_CNT_REG = this.EFUSE_BASE + 52, this.EFUSE_SPI_BOOT_CRYPT_CNT_MASK = 7 << 18, this.EFUSE_SECURE_BOOT_EN_REG = this.EFUSE_BASE + 56, this.EFUSE_SECURE_BOOT_EN_MASK = 1 << 20, this.PURPOSE_VAL_XTS_AES256_KEY_1 = 2, this.PURPOSE_VAL_XTS_AES256_KEY_2 = 3, this.PURPOSE_VAL_XTS_AES128_KEY = 4, this.SUPPORTS_ENCRYPTED_FLASH = !0, this.FLASH_ENCRYPTED_WRITE_ALIGN = 16, this.USB_RAM_BLOCK = 2048, this.GPIO_STRAP_REG = 1343094840, this.GPIO_STRAP_SPI_BOOT_MASK = 8, this.RTC_CNTL_OPTION1_REG = 1343291400, this.RTC_CNTL_FORCE_DOWNLOAD_BOOT_MASK = 4, this.DR_REG_LPAON_BASE = 1343291392, this.DR_REG_PMU_BASE = this.DR_REG_LPAON_BASE + 20480, this.DR_REG_LP_SYS_BASE = this.DR_REG_LPAON_BASE + 0, this.LP_SYSTEM_REG_ANA_XPD_PAD_GROUP_REG = this.DR_REG_LP_SYS_BASE + 268, this.PMU_EXT_LDO_P0_0P1A_ANA_REG = this.DR_REG_PMU_BASE + 444, this.PMU_ANA_0P1A_EN_CUR_LIM_0 = 1 << 27, this.PMU_EXT_LDO_P0_0P1A_REG = this.DR_REG_PMU_BASE + 440, this.PMU_0P1A_TARGET0_0 = 255 << 23, this.PMU_0P1A_FORCE_TIEH_SEL_0 = 128, this.PMU_DATE_REG = this.DR_REG_PMU_BASE + 1020, this.UARTDEV_BUF_NO_USB_OTG = 5, this.UARTDEV_BUF_NO_USB_JTAG_SERIAL = 6, this.DR_REG_LP_WDT_BASE = 1343315968, this.RTC_CNTL_WDTCONFIG0_REG = this.DR_REG_LP_WDT_BASE + 0, this.RTC_CNTL_WDTCONFIG1_REG = this.DR_REG_LP_WDT_BASE + 4, this.RTC_CNTL_WDTWPROTECT_REG = this.DR_REG_LP_WDT_BASE + 24, this.RTC_CNTL_WDT_WKEY = 1356348065, this.RTC_CNTL_SWD_CONF_REG = this.DR_REG_LP_WDT_BASE + 28, this.RTC_CNTL_SWD_AUTO_FEED_EN = 1 << 18, this.RTC_CNTL_SWD_WPROTECT_REG = this.DR_REG_LP_WDT_BASE + 32, this.RTC_CNTL_SWD_WKEY = 1356348065, this.MEMORY_MAP = [[0, 65536, "PADDING"], [1073741824, 1275068416, "DROM"], [1341128704, 1341784064, "DRAM"], [1341128704, 1341784064, "BYTE_ACCESSIBLE"], [1337982976, 1338114048, "DROM_MASK"], [1337982976, 1338114048, "IROM_MASK"], [1073741824, 1275068416, "IROM"], [1341128704, 1341784064, "IRAM"], [1343258624, 1343291392, "RTC_IRAM"], [1343258624, 1343291392, "RTC_DRAM"], [1611653120, 1611661312, "MEM_INTERNAL2"]], this.UF2_FAMILY_ID = 1026592404, this.EFUSE_MAX_KEY = 5, this.KEY_PURPOSES = { 0: "USER/EMPTY", 1: "ECDSA_KEY", 2: "XTS_AES_256_KEY_1", 3: "XTS_AES_256_KEY_2", 4: "XTS_AES_128_KEY", 5: "HMAC_DOWN_ALL", 6: "HMAC_DOWN_JTAG", 7: "HMAC_DOWN_DIGITAL_SIGNATURE", 8: "HMAC_UP", 9: "SECURE_BOOT_DIGEST0", 10: "SECURE_BOOT_DIGEST1", 11: "SECURE_BOOT_DIGEST2", 12: "KM_INIT_KEY" };
  }
  async getPkgVersion(t) {
    const e = this.EFUSE_BLOCK1_ADDR + 8;
    return await t.readReg(e) >> 20 & 7;
  }
  async getMinorChipVersion(t) {
    const e = this.EFUSE_BLOCK1_ADDR + 8;
    return await t.readReg(e) >> 0 & 15;
  }
  async getMajorChipVersion(t) {
    const e = this.EFUSE_BLOCK1_ADDR + 8, i = await t.readReg(e);
    return (i >> 23 & 1) << 2 | i >> 4 & 3;
  }
  async getChipRevision(t) {
    return 100 * await this.getMajorChipVersion(t) + await this.getMinorChipVersion(t);
  }
  async getStubJsonPath(t) {
    return await this.getChipRevision(t) < 300 ? "./targets/stub_flasher/stub_flasher_32p4rc1.json" : "./targets/stub_flasher/stub_flasher_32p4.json";
  }
  async getChipDescription(t) {
    return `${{ 0: "ESP32-P4" }[await this.getPkgVersion(t)] || "Unknown ESP32-P4"} (revision v${await this.getMajorChipVersion(t)}.${await this.getMinorChipVersion(t)})`;
  }
  async getChipFeatures(t) {
    return ["High-Performance MCU"];
  }
  async getCrystalFreq(t) {
    return 40;
  }
  async getFlashVoltage(t) {
  }
  async overrideVddsdio(t) {
    t.debug("VDD_SDIO overrides are not supported for ESP32-P4");
  }
  async readMac(t) {
    let e = await t.readReg(this.MAC_EFUSE_REG);
    e >>>= 0;
    let i = await t.readReg(this.MAC_EFUSE_REG + 4);
    i = i >>> 0 & 65535;
    const r = new Uint8Array(6);
    return r[0] = i >> 8 & 255, r[1] = 255 & i, r[2] = e >> 24 & 255, r[3] = e >> 16 & 255, r[4] = e >> 8 & 255, r[5] = 255 & e, this._d2h(r[0]) + ":" + this._d2h(r[1]) + ":" + this._d2h(r[2]) + ":" + this._d2h(r[3]) + ":" + this._d2h(r[4]) + ":" + this._d2h(r[5]);
  }
  async getFlashCryptConfig(t) {
  }
  async getSecureBootEnabled(t) {
    return (await t.readReg(this.EFUSE_SECURE_BOOT_EN_REG) & this.EFUSE_SECURE_BOOT_EN_MASK) != 0;
  }
  async getUartdevBufNo(t) {
    return (await this.getChipRevision(t) < 300 ? 1341390512 : 1341914800) + 24;
  }
  async usesUsbOtg(t) {
    const e = await this.getUartdevBufNo(t);
    return (255 & await t.readReg(e)) === this.UARTDEV_BUF_NO_USB_OTG;
  }
  async usesUsbJtagSerial(t) {
    const e = await this.getUartdevBufNo(t);
    return (255 & await t.readReg(e)) === this.UARTDEV_BUF_NO_USB_JTAG_SERIAL;
  }
  async getKeyBlockPurpose(t, e) {
    if (e < 0 || e > this.EFUSE_MAX_KEY) return void t.debug(`Valid key block numbers must be in range 0-${this.EFUSE_MAX_KEY}`);
    const i = [[this.EFUSE_PURPOSE_KEY0_REG, this.EFUSE_PURPOSE_KEY0_SHIFT], [this.EFUSE_PURPOSE_KEY1_REG, this.EFUSE_PURPOSE_KEY1_SHIFT], [this.EFUSE_PURPOSE_KEY2_REG, this.EFUSE_PURPOSE_KEY2_SHIFT], [this.EFUSE_PURPOSE_KEY3_REG, this.EFUSE_PURPOSE_KEY3_SHIFT], [this.EFUSE_PURPOSE_KEY4_REG, this.EFUSE_PURPOSE_KEY4_SHIFT], [this.EFUSE_PURPOSE_KEY5_REG, this.EFUSE_PURPOSE_KEY5_SHIFT]], [r, o] = i[e];
    return await t.readReg(r) >> o & 15;
  }
  async isFlashEncryptionKeyValid(t) {
    const e = [];
    for (let i = 0; i <= this.EFUSE_MAX_KEY; i++) {
      const r = await this.getKeyBlockPurpose(t, i);
      e.push(r);
    }
    return e.some(((i) => i === this.PURPOSE_VAL_XTS_AES128_KEY)) || e.some(((i) => i === this.PURPOSE_VAL_XTS_AES256_KEY_1)) && e.some(((i) => i === this.PURPOSE_VAL_XTS_AES256_KEY_2)) ? !0 : (await t.readReg(this.EFUSE_FORCE_USE_KEY_MANAGER_KEY_REG) >> this.EFUSE_FORCE_USE_KEY_MANAGER_KEY_SHIFT & this.FORCE_USE_KEY_MANAGER_VAL_XTS_AES_KEY) != 0;
  }
  async postConnect(t) {
    await this.usesUsbOtg(t) && (t.ESP_RAM_BLOCK = this.USB_RAM_BLOCK), t.IS_STUB || await this.disableWatchdogs(t);
  }
  async disableWatchdogs(t) {
    if (await this.usesUsbJtagSerial(t)) {
      await t.writeReg(this.RTC_CNTL_WDTWPROTECT_REG, this.RTC_CNTL_WDT_WKEY), await t.writeReg(this.RTC_CNTL_WDTCONFIG0_REG, 0), await t.writeReg(this.RTC_CNTL_WDTWPROTECT_REG, 0), await t.writeReg(this.RTC_CNTL_SWD_WPROTECT_REG, this.RTC_CNTL_SWD_WKEY);
      const e = await t.readReg(this.RTC_CNTL_SWD_CONF_REG);
      await t.writeReg(this.RTC_CNTL_SWD_CONF_REG, e | this.RTC_CNTL_SWD_AUTO_FEED_EN), await t.writeReg(this.RTC_CNTL_SWD_WPROTECT_REG, 0);
    }
  }
  checkSpiConnection(t, e) {
    if (!e.every(((i) => i >= 0 && i <= 54))) throw new Error("SPI Pin numbers must be in the range 0-54.");
    e.some(((i) => i === 24 || i === 25)) && t.debug("GPIO pins 24 and 25 are used by USB-Serial/JTAG, consider using other pins for SPI flash connection.");
  }
  async watchdogReset(t) {
    t.info("Hard resetting with a watchdog..."), await t.writeReg(this.RTC_CNTL_WDTWPROTECT_REG, this.RTC_CNTL_WDT_WKEY), await t.writeReg(this.RTC_CNTL_WDTCONFIG1_REG, 2e3), await t.writeReg(this.RTC_CNTL_WDTCONFIG0_REG, -805306110), await t.writeReg(this.RTC_CNTL_WDTWPROTECT_REG, 0), await new Promise(((e) => setTimeout(e, 500)));
  }
  async powerOnFlash(t) {
    if (await this.getChipRevision(t) <= 300) return;
    await t.writeReg(this.LP_SYSTEM_REG_ANA_XPD_PAD_GROUP_REG, 1), await new Promise(((i) => setTimeout(i, 10)));
    let e = await t.readReg(this.PMU_EXT_LDO_P0_0P1A_ANA_REG);
    await t.writeReg(this.PMU_EXT_LDO_P0_0P1A_ANA_REG, e | this.PMU_ANA_0P1A_EN_CUR_LIM_0), e = await t.readReg(this.PMU_EXT_LDO_P0_0P1A_REG), await t.writeReg(this.PMU_EXT_LDO_P0_0P1A_REG, e | this.PMU_0P1A_FORCE_TIEH_SEL_0), e = await t.readReg(this.PMU_DATE_REG), await t.writeReg(this.PMU_DATE_REG, 3 | e), await new Promise(((i) => setTimeout(i, 50))), e = await t.readReg(this.PMU_EXT_LDO_P0_0P1A_ANA_REG), await t.writeReg(this.PMU_EXT_LDO_P0_0P1A_ANA_REG, e & ~this.PMU_ANA_0P1A_EN_CUR_LIM_0), e = await t.readReg(this.PMU_EXT_LDO_P0_0P1A_REG), await t.writeReg(this.PMU_EXT_LDO_P0_0P1A_REG, e & ~this.PMU_0P1A_TARGET0_0), e = await t.readReg(this.PMU_EXT_LDO_P0_0P1A_REG), await t.writeReg(this.PMU_EXT_LDO_P0_0P1A_REG, 128 | e), e = await t.readReg(this.PMU_EXT_LDO_P0_0P1A_REG), await t.writeReg(this.PMU_EXT_LDO_P0_0P1A_REG, e & ~this.PMU_0P1A_FORCE_TIEH_SEL_0), await new Promise(((i) => setTimeout(i, 1800)));
  }
}
const yg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32P4ROM: bg
}, Symbol.toStringTag, { value: "Module" }));
export {
  Bd as CircuitSetupPanel
};
