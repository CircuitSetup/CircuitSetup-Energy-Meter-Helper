const $i = globalThis, ur = $i.ShadowRoot && ($i.ShadyCSS === void 0 || $i.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, fr = /* @__PURE__ */ Symbol(), zr = /* @__PURE__ */ new WeakMap();
let Mn = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== fr) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (ur && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = zr.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && zr.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const yc = (s) => new Mn(typeof s == "string" ? s : s + "", void 0, fr), Cc = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, r, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1], s[0]);
  return new Mn(e, s, fr);
}, Bc = (s, t) => {
  if (ur) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = $i.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, s.appendChild(i);
  }
}, Jr = ur ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return yc(e);
})(s) : s;
const { is: Ic, defineProperty: xc, getOwnPropertyDescriptor: Sc, getOwnPropertyNames: Rc, getOwnPropertySymbols: Dc, getPrototypeOf: Mc } = Object, rs = globalThis, jr = rs.trustedTypes, Tc = jr ? jr.emptyScript : "", kc = rs.reactiveElementPolyfillSupport, Ke = (s, t) => s, Xs = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? Tc : null;
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
} }, Tn = (s, t) => !Ic(s, t), Wr = { attribute: !0, type: String, converter: Xs, reflect: !1, useDefault: !1, hasChanged: Tn };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), rs.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let _e = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = Wr) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && xc(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: o } = Sc(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: r, set(n) {
      const a = r?.call(this);
      o?.call(this, n), this.requestUpdate(t, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Wr;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Ke("elementProperties"))) return;
    const t = Mc(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Ke("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Ke("properties"))) {
      const e = this.properties, i = [...Rc(e), ...Dc(e)];
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
      for (const r of i) e.unshift(Jr(r));
    } else t !== void 0 && e.push(Jr(t));
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
    return Bc(t, this.constructor.elementStyles), t;
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
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : Xs).toAttribute(e, i.type);
      this._$Em = t, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const o = i.getPropertyOptions(r), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : Xs;
      this._$Em = r;
      const a = n.fromAttribute(e, o.type);
      this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, r = !1, o) {
    if (t !== void 0) {
      const n = this.constructor;
      if (r === !1 && (o = this[t]), i ??= n.getPropertyOptions(t), !((i.hasChanged ?? Tn)(o, e) || i.useDefault && i.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(n._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: o }, n) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        const { wrapped: n } = o, a = this[r];
        n !== !0 || this._$AL.has(r) || a === void 0 || this.C(r, void 0, o, a);
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
_e.elementStyles = [], _e.shadowRootOptions = { mode: "open" }, _e[Ke("elementProperties")] = /* @__PURE__ */ new Map(), _e[Ke("finalized")] = /* @__PURE__ */ new Map(), kc?.({ ReactiveElement: _e }), (rs.reactiveElementVersions ??= []).push("2.1.2");
const mr = globalThis, Vr = (s) => s, zi = mr.trustedTypes, qr = zi ? zi.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, kn = "$lit$", zt = `lit$${Math.random().toFixed(9).slice(2)}$`, Fn = "?" + zt, Fc = `<${Fn}>`, he = document, ri = () => he.createComment(""), oi = (s) => s === null || typeof s != "object" && typeof s != "function", _r = Array.isArray, Oc = (s) => _r(s) || typeof s?.[Symbol.iterator] == "function", vs = `[\x20\t
\f\r]`, Fe = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Zr = /-->/g, Xr = />/g, ie = RegExp(`>|${vs}(?:([^\\s"'>=/]+)(${vs}*=${vs}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), to = /'/g, eo = /"/g, On = /^(?:script|style|textarea|title)$/i, Pc = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), y = Pc(1), Be = /* @__PURE__ */ Symbol.for("lit-noChange"), O = /* @__PURE__ */ Symbol.for("lit-nothing"), io = /* @__PURE__ */ new WeakMap(), ne = he.createTreeWalker(he, 129);
function Pn(s, t) {
  if (!_r(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return qr !== void 0 ? qr.createHTML(t) : t;
}
const Uc = (s, t) => {
  const e = s.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = Fe;
  for (let a = 0; a < e; a++) {
    const l = s[a];
    let c, d, h = -1, A = 0;
    for (; A < l.length && (n.lastIndex = A, d = n.exec(l), d !== null); ) A = n.lastIndex, n === Fe ? d[1] === "!--" ? n = Zr : d[1] !== void 0 ? n = Xr : d[2] !== void 0 ? (On.test(d[2]) && (r = RegExp("</" + d[2], "g")), n = ie) : d[3] !== void 0 && (n = ie) : n === ie ? d[0] === ">" ? (n = r ?? Fe, h = -1) : d[1] === void 0 ? h = -2 : (h = n.lastIndex - d[2].length, c = d[1], n = d[3] === void 0 ? ie : d[3] === '"' ? eo : to) : n === eo || n === to ? n = ie : n === Zr || n === Xr ? n = Fe : (n = ie, r = void 0);
    const p = n === ie && s[a + 1].startsWith("/>") ? " " : "";
    o += n === Fe ? l + Fc : h >= 0 ? (i.push(c), l.slice(0, h) + kn + l.slice(h) + zt + p) : l + zt + (h === -2 ? a : p);
  }
  return [Pn(s, o + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
let tr = class Un {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const a = t.length - 1, l = this.parts, [c, d] = Uc(t, e);
    if (this.el = Un.createElement(c, i), ne.currentNode = this.el.content, e === 2 || e === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (r = ne.nextNode()) !== null && l.length < a; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const h of r.getAttributeNames()) if (h.endsWith(kn)) {
          const A = d[n++], p = r.getAttribute(h).split(zt), _ = /([.?@])?(.*)/.exec(A);
          l.push({ type: 1, index: o, name: _[2], strings: p, ctor: _[1] === "." ? Hc : _[1] === "?" ? $c : _[1] === "@" ? Gc : os }), r.removeAttribute(h);
        } else h.startsWith(zt) && (l.push({ type: 6, index: o }), r.removeAttribute(h));
        if (On.test(r.tagName)) {
          const h = r.textContent.split(zt), A = h.length - 1;
          if (A > 0) {
            r.textContent = zi ? zi.emptyScript : "";
            for (let p = 0; p < A; p++) r.append(h[p], ri()), ne.nextNode(), l.push({ type: 2, index: ++o });
            r.append(h[A], ri());
          }
        }
      } else if (r.nodeType === 8) if (r.data === Fn) l.push({ type: 2, index: o });
      else {
        let h = -1;
        for (; (h = r.data.indexOf(zt, h + 1)) !== -1; ) l.push({ type: 7, index: o }), h += zt.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = he.createElement("template");
    return i.innerHTML = t, i;
  }
};
function Ie(s, t, e = s, i) {
  if (t === Be) return t;
  let r = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const o = oi(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== o && (r?._$AO?.(!1), o === void 0 ? r = void 0 : (r = new o(s), r._$AT(s, e, i)), i !== void 0 ? (e._$Co ??= [])[i] = r : e._$Cl = r), r !== void 0 && (t = Ie(s, r._$AS(s, t.values), r, i)), t;
}
let Qc = class {
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
    const { el: { content: e }, parts: i } = this._$AD, r = (t?.creationScope ?? he).importNode(e, !0);
    ne.currentNode = r;
    let o = ne.nextNode(), n = 0, a = 0, l = i[0];
    for (; l !== void 0; ) {
      if (n === l.index) {
        let c;
        l.type === 2 ? c = new vr(o, o.nextSibling, this, t) : l.type === 1 ? c = new l.ctor(o, l.name, l.strings, this, t) : l.type === 6 && (c = new Lc(o, this, t)), this._$AV.push(c), l = i[++a];
      }
      n !== l?.index && (o = ne.nextNode(), n++);
    }
    return ne.currentNode = he, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}, vr = class Qn {
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
    t = Ie(this, t, e), oi(t) ? t === O || t == null || t === "" ? (this._$AH !== O && this._$AR(), this._$AH = O) : t !== this._$AH && t !== Be && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Oc(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== O && oi(this._$AH) ? this._$AA.nextSibling.data = t : this.T(he.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = tr.createElement(Pn(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === r) this._$AH.p(e);
    else {
      const o = new Qc(r, this), n = o.u(this.options);
      o.p(e), this.T(n), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = io.get(t.strings);
    return e === void 0 && io.set(t.strings, e = new tr(t)), e;
  }
  k(t) {
    _r(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const o of t) r === e.length ? e.push(i = new Qn(this.O(ri()), this.O(ri()), this, this.options)) : i = e[r], i._$AI(o), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = Vr(t).nextSibling;
      Vr(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}, os = class {
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
    let n = !1;
    if (o === void 0) t = Ie(this, t, e, 0), n = !oi(t) || t !== this._$AH && t !== Be, n && (this._$AH = t);
    else {
      const a = t;
      let l, c;
      for (t = o[0], l = 0; l < o.length - 1; l++) c = Ie(this, a[i + l], e, l), c === Be && (c = this._$AH[l]), n ||= !oi(c) || c !== this._$AH[l], c === O ? t = O : t !== O && (t += (c ?? "") + o[l + 1]), this._$AH[l] = c;
    }
    n && !r && this.j(t);
  }
  j(t) {
    t === O ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}, Hc = class extends os {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === O ? void 0 : t;
  }
}, $c = class extends os {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== O);
  }
}, Gc = class extends os {
  constructor(t, e, i, r, o) {
    super(t, e, i, r, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = Ie(this, t, e, 0) ?? O) === Be) return;
    const i = this._$AH, r = t === O && i !== O || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== O && (i === O || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}, Lc = class {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    Ie(this, t);
  }
};
const Yc = mr.litHtmlPolyfillSupport;
Yc?.(tr, vr), (mr.litHtmlVersions ??= []).push("3.3.3");
const Nc = (s, t, e) => {
  const i = e?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = r = new vr(t.insertBefore(ri(), o), o, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
const Er = globalThis;
let ze = class extends _e {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Nc(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return Be;
  }
};
ze._$litElement$ = !0, ze.finalized = !0, Er.litElementHydrateSupport?.({ LitElement: ze });
const Kc = Er.litElementPolyfillSupport;
Kc?.({ LitElement: ze });
(Er.litElementVersions ??= []).push("4.2.2");
const so = "circuitsetup_energy_meter_helper/", zc = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, Jc = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, jc = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, Wc = /[\u0000-\u001f\u007f-\u009f]/, Vc = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), qc = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), Zc = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "partial", "indeterminate", "verified", "cancelled"]), wr = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), ro = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), Ji = /* @__PURE__ */ new Set(["A", "B", "C"]), Xc = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), td = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), ed = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), id = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), sd = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), rd = /^(?:ct(?:[1-9]|[1-3][0-9]|4[0-2])_name|current_cal_ct(?:[1-9]|[1-3][0-9]|4[0-2])|voltage_cal[12])$/, od = /^[0-9a-f]{12}$/, nd = /^[0-9a-f]{64}$/, oo = /^[0-9a-f]{32}$/, ad = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, Hn = /^[a-z0-9][a-z0-9_-]{0,127}$/, $n = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, no = /* @__PURE__ */ new Set(["preview_ct_config", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]), ld = /* @__PURE__ */ new Set(["available", "unavailable", "invalid"]), cd = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial"]), dd = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial", "indeterminate"]), hd = /* @__PURE__ */ new Set(["applied_pending_restart_verification", "partial", "indeterminate"]);
function P(s, t) {
  if (s === null || typeof s != "object" || Array.isArray(s)) throw new Error(`${t} response is invalid`);
  return s;
}
function H(s, t, e = 100) {
  if (!Array.isArray(s) || s.length > e) throw new Error(`${t} response is invalid`);
  return s;
}
function F(s, t, e = !1) {
  if (e && s === null) return null;
  if (typeof s != "string" || s.length === 0) throw new Error(`${t} response is invalid`);
  return s;
}
function K(s, t) {
  if (typeof s != "number" || !Number.isFinite(s)) throw new Error(`${t} response is invalid`);
  return s;
}
function U(s, t) {
  const e = K(s, t);
  if (!Number.isInteger(e)) throw new Error(`${t} response is invalid`);
  return e;
}
function ot(s, t, e = !1) {
  if (e && s === null) return null;
  if (typeof s != "boolean") throw new Error(`${t} response is invalid`);
  return s;
}
function V(s, t, e) {
  const i = F(s, e);
  if (!t.has(i)) throw new Error(`${e} response is invalid`);
  return i;
}
function er(s, t) {
  s !== void 0 && F(s, t, !0);
}
function Pt(s, t) {
  return Math.abs(s - t) <= 1e-9 * Math.max(1, Math.abs(s), Math.abs(t));
}
function Ut(s, t, e) {
  const i = Object.keys(s);
  if (i.length !== t.length || i.some((r) => !t.includes(r))) throw new Error(`${e} response is invalid`);
}
function bi(s, t) {
  return s.length === t.length && s.every((e, i) => e === t[i]);
}
function Gn(s, t) {
  const e = P(s, t);
  F(e.entry_id, t), F(e.title, t), F(e.project_name, t), F(e.project_version, t, !0), ot(e.importable, t, !0), F(e.configuration, t, !0);
}
function yi(s, t) {
  const e = P(s, t);
  if (V(e.state, Vc, t), H(e.devices, t).forEach((i) => Gn(i, t)), e.configuration_authoritative !== void 0 && ot(e.configuration_authoritative, t), e.installer_intent !== void 0) {
    const i = P(e.installer_intent, t), r = U(i.addon_count, t);
    if (r < 0 || r > 6) throw new Error(`${t} response is invalid`);
    if (V(i.connection_type, wr, t) === "unknown") throw new Error(`${t} response is invalid`);
    const n = i.firmware_product_id, a = i.esphome_version;
    if (n === void 0 != (a === void 0) || n !== void 0 && (typeof n != "string" || n.length > 160 || !Hn.test(n)) || a !== void 0 && (typeof a != "string" || a.length > 160 || !$n.test(a)))
      throw new Error(`${t} response is invalid`);
  }
  return s;
}
function ao(s, t) {
  const e = P(s, t), i = U(e.addon_count, t), r = U(e.board_count, t), o = U(e.ct_count, t), n = U(e.group_count, t);
  if (i < 0 || i > 6 || r < 1 || r > 7 || o < 6 || o > 42 || n < 2 || n > 14 || r !== i + 1 || o !== 6 * r || n !== 2 * r) throw new Error(`${t} response is invalid`);
  V(e.connection_type, wr, t), F(e.voltage_layout, t), F(e.project_name, t);
  const a = H(e.evidence, t);
  if (a.length < 1 || a.length > ro.size) throw new Error(`${t} response is invalid`);
  const l = a.map((c) => {
    const d = P(c, t), h = V(d.source, ro, t), A = U(d.addon_count, t);
    if (A < 0 || A > 6) throw new Error(`${t} response is invalid`);
    return F(d.detail, t), h;
  });
  if (new Set(l).size !== l.length || !l.some((c) => sd.has(c))) throw new Error(`${t} response is invalid`);
  return s;
}
function Ad(s, t) {
  const e = P(s, t);
  return "topology" in e ? (ao(e.topology, t), e.configuration_authoritative !== void 0 && ot(e.configuration_authoritative, t), s) : ao(s, t);
}
function pd(s, t) {
  const e = P(s, t);
  F(e.plan_id, t), F(e.source_sha256, t);
  const i = H(e.channels, t);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${t} response is invalid`);
  i.forEach((n, a) => {
    const l = P(n, t), c = U(l.channel, t);
    F(l.name, t), U(l.raw_gain_ct, t), K(l.reporting_multiplier, t), er(l.selected_model_id, t), ot(l.selection_verified_against_config, t), er(l.display_label, t);
    const d = P(l.address, t), h = U(d.channel, t), A = U(d.board_index, t), p = U(d.group_index, t), _ = V(d.phase, Ji, t), u = a + 1;
    if (c !== u || h !== u || A !== Math.floor(a / 6) || p !== Math.floor(a % 6 / 3) || _ !== ["A", "B", "C"][a % 3]) throw new Error(`${t} response is invalid`);
  });
  const r = P(e.catalog, t);
  F(r.source_repository, t), F(r.source_ref, t), U(r.schema_version, t);
  const o = H(r.presets, t);
  if (o.length > 64) throw new Error(`${t} response is invalid`);
  return o.forEach((n) => {
    const a = P(n, t);
    F(a.model_id, t), F(a.label, t), K(a.rated_current_a, t), F(a.secondary, t), a.default_gain_ct !== null && U(a.default_gain_ct, t), ot(a.requires_burden_jumper_cut, t), F(a.notes, t);
  }), s;
}
function $e(s, t) {
  const e = P(s, t);
  if (F(e.transaction_id, t), V(e.state, qc, t), F(e.source_sha256, t), ot(e.rollback_available, t), F(e.redacted_diff, t), H(e.changes, t).forEach((i) => {
    const r = P(i, t), o = F(r.key, t);
    if (!rd.test(o)) throw new Error(`${t} response is invalid`);
    r.old_value !== null && F(r.old_value, t), F(r.new_value, t);
  }), H(e.evidence, t).forEach((i) => V(i, td, t)), H(e.progress, t).forEach((i) => V(i, ed, t)), e.validation_detail != null) {
    const i = P(e.validation_detail, t);
    for (const r of ["reported_error_count", "reported_warning_count"]) i[r] !== null && U(i[r], t);
    i.code !== null && U(i.code, t), U(i.error_record_count, t), U(i.warning_record_count, t);
  }
  return e.upload_progress !== void 0 && H(e.upload_progress, t).forEach((i) => {
    const r = P(i, t);
    if (V(r.stage, Xc, t), r.progress !== null && r.percentage !== null && r.progress !== void 0 && r.percentage !== void 0) throw new Error(`${t} response is invalid`);
    const o = r.progress ?? r.percentage;
    if (o != null) {
      const n = U(o, t);
      if (n < 0 || n > 100) throw new Error(`${t} response is invalid`);
    }
  }), s;
}
function Lt(s, t) {
  const e = P(s, t);
  F(e.session_id, t), F(e.device_id, t), V(e.state, Zc, t), ot(e.safety_acknowledged, t);
  const i = P(e.preflight, t);
  H(i.issues, t).forEach((h) => {
    const A = P(h, t);
    V(A.code, id, t), F(A.role, t), F(A.detail, t);
  }), H(i.zeroed_roles, t).forEach((h) => F(h, t)), e.entity_role_counts !== void 0 && Object.values(P(e.entity_role_counts, t)).forEach((h) => {
    if (U(h, t) < 0) throw new Error(`${t} response is invalid`);
  }), e.calibration_sources !== void 0 && Object.values(P(e.calibration_sources, t)).forEach((h) => V(h, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), t));
  const r = [e.offset_capability, e.offset_disposition, e.offset_boards, e.has_pending_calibration];
  if (r.every((h) => h === void 0)) return s;
  if (r.some((h) => h === void 0)) throw new Error(`${t} response is invalid`);
  const o = P(e.offset_capability, t);
  if (Ut(o, ["status", "repair_reason"], t), V(o.status, ld, t) === "invalid") F(o.repair_reason, t);
  else if (o.repair_reason !== null) throw new Error(`${t} response is invalid`);
  const a = V(e.offset_disposition, cd, t), l = H(e.offset_boards, t, 7);
  if (l.length < 1) throw new Error(`${t} response is invalid`);
  const c = [];
  l.forEach((h, A) => {
    const p = P(h, t);
    if (Ut(p, ["board_index", "stages"], t), U(p.board_index, t) !== A) throw new Error(`${t} response is invalid`);
    const _ = H(p.stages, t, 2);
    if (_.length !== 2) throw new Error(`${t} response is invalid`);
    _.forEach((u, f) => {
      const w = P(u, t);
      if (Ut(w, ["stage", "state"], t), U(w.stage, t) !== f + 1) throw new Error(`${t} response is invalid`);
      c.push(V(w.state, dd, t));
    });
  });
  const d = c.every((h) => h === "skipped") ? "skipped" : c.every((h) => h === "completed") ? "completed" : c.every((h) => h === "not_started") ? "not_started" : c.some((h) => h === "partial" || h === "indeterminate") || c.some((h) => h === "skipped") ? "partial" : "in_progress";
  if (a !== d) throw new Error(`${t} response is invalid`);
  return ot(e.has_pending_calibration, t), s;
}
function gd(s, t, e, i) {
  const r = P(s, t);
  if (Ut(r, ["stage", "ready", "connection_generation", "entities", "reasons", "thresholds"], t), U(r.stage, t) !== i || e < 0 || e > 6) throw new Error(`${t} response is invalid`);
  const o = ot(r.ready, t), n = U(r.connection_generation, t);
  if (n < 1) throw new Error(`${t} response is invalid`);
  const a = P(r.thresholds, t);
  Ut(a, ["sample_count", "zero_voltage_peak_volts", "zero_voltage_spread_volts", "zero_current_peak_amps", "zero_current_spread_amps", "voltage_present_minimum_volts", "voltage_present_spread_volts"], t);
  const l = U(a.sample_count, t), c = K(a.zero_voltage_peak_volts, t), d = K(a.zero_voltage_spread_volts, t), h = K(a.zero_current_peak_amps, t), A = K(a.zero_current_spread_amps, t), p = K(a.voltage_present_minimum_volts, t), _ = K(a.voltage_present_spread_volts, t), u = [
    c,
    d,
    h,
    A,
    p,
    _
  ];
  if (l < 3 || l > 100 || u.some((T) => T < 0) || u[4] === 0) throw new Error(`${t} response is invalid`);
  const f = H(r.entities, t, 12);
  if (f.length !== 12) throw new Error(`${t} response is invalid`);
  const w = /* @__PURE__ */ new Map();
  for (const T of [0, 1]) {
    const k = e === 0 ? `main_${T + 1}` : `addon${e}_${T + 1}`;
    for (const N of ["a", "b", "c"]) w.set(`${k}.voltage_${N}`, "voltage");
    for (let N = 1; N <= 3; ++N) w.set(`ct${e * 6 + T * 3 + N}.current_sensor`, "current");
  }
  const b = "entity binding is not on the active connection generation", m = "fresh window unavailable: ", C = /* @__PURE__ */ new Set(), R = [];
  let E = 0;
  f.forEach((T) => {
    const k = P(T, t);
    Ut(k, ["role", "quantity", "ready", "reasons", "window"], t);
    const N = F(k.role, t), et = V(k.quantity, /* @__PURE__ */ new Set(["voltage", "current"]), t);
    if (C.has(N) || w.get(N) !== et) throw new Error(`${t} response is invalid`);
    C.add(N);
    const bt = ot(k.ready, t), yt = H(k.reasons, t, 12).map((q) => F(q, t));
    let nt;
    if (k.window === null) {
      if (bt || yt.length !== 1) throw new Error(`${t} response is invalid`);
      if (yt[0] === b) ++E;
      else if (!yt[0].startsWith(m) || yt[0].slice(m.length).trim().length === 0)
        throw new Error(`${t} response is invalid`);
      nt = yt;
    } else {
      const q = P(k.window, t);
      Ut(q, ["values", "received_at", "connection_generation", "mean", "minimum", "maximum", "absolute_peak", "absolute_spread"], t);
      const ue = H(q.values, t, l).map((ee) => K(ee, t)), fs = H(q.received_at, t, l).map((ee) => K(ee, t)), Ec = K(q.mean, t), ms = K(q.minimum, t), Kr = K(q.maximum, t), _s = K(q.absolute_peak, t), Ei = K(q.absolute_spread, t), wc = ue.reduce((ee, wi) => ee + wi, 0) / ue.length, bc = U(q.connection_generation, t);
      if (ue.length !== l || fs.length !== l || fs.some((ee, wi) => wi > 0 && ee <= fs[wi - 1]) || !Pt(Ec, wc) || !Pt(ms, Math.min(...ue)) || !Pt(Kr, Math.max(...ue)) || !Pt(_s, Math.max(...ue.map(Math.abs))) || !Pt(Ei, Kr - ms)) throw new Error(`${t} response is invalid`);
      nt = [], bc !== n ? nt.push("window is from another connection generation") : et === "current" ? (_s > h && nt.push("absolute peak exceeds zero_current_peak_amps"), Ei > A && nt.push("absolute spread exceeds zero_current_spread_amps")) : i === 1 ? (_s > c && nt.push("absolute peak exceeds zero_voltage_peak_volts"), Ei > d && nt.push("absolute spread exceeds zero_voltage_spread_volts")) : (ms < p && nt.push("minimum is below voltage_present_minimum_volts"), Ei > _ && nt.push("absolute spread exceeds voltage_present_spread_volts"));
    }
    if (!bi(yt, nt) || bt !== (nt.length === 0)) throw new Error(`${t} response is invalid`);
    R.push(...nt.map((q) => `${N}: ${q}`));
  });
  const M = H(r.reasons, t, 100).map((T) => F(T, t)), D = [...R, "connection generation changed while collecting readiness"], S = E === f.length && bi(M, [b]) || E === 0 && (bi(M, R) || bi(M, D));
  if (C.size !== w.size || !S || o !== (M.length === 0)) throw new Error(`${t} response is invalid`);
  return s;
}
function Ln(s, t) {
  const e = H(s, t, 3);
  if (e.length !== 3) throw new Error(`${t} response is invalid`);
  return e.forEach((i) => {
    const r = H(i, t, 2);
    if (r.length !== 2 || r.some((o) => {
      const n = U(o, t);
      return n < -32768 || n > 32767;
    })) throw new Error(`${t} response is invalid`);
  }), s;
}
function ud(s, t, e, i) {
  const r = P(s, t);
  Ut(r, ["state", "board_index", "stage", "expected_tables", "unfinished_group_keys", "retry_allowed", "error"], t);
  const o = V(r.state, hd, t);
  if (U(r.board_index, t) !== e || U(r.stage, t) !== i) throw new Error(`${t} response is invalid`);
  const n = e === 0 ? ["main_1", "main_2"] : [`addon${e}_1`, `addon${e}_2`], a = H(r.expected_tables, t, 2).map((h) => {
    const A = H(h, t, 2);
    if (A.length !== 2) throw new Error(`${t} response is invalid`);
    const p = F(A[0], t);
    if (!n.includes(p)) throw new Error(`${t} response is invalid`);
    return Ln(A[1], t), p;
  }), l = H(r.unfinished_group_keys, t, 2).map((h) => F(h, t)), c = [...a, ...l], d = ot(r.retry_allowed, t);
  if (c.length !== 2 || new Set(c).size !== 2 || c.some((h) => !n.includes(h))) throw new Error(`${t} response is invalid`);
  if (o === "applied_pending_restart_verification") {
    if (a.length !== 2 || l.length !== 0 || d || r.error !== null) throw new Error(`${t} response is invalid`);
  } else if (F(r.error, t), !d || a.length !== (o === "partial" ? 1 : 0)) throw new Error(`${t} response is invalid`);
  return s;
}
function lo(s, t, e, i) {
  const r = P(s, t), o = V(r.target, /* @__PURE__ */ new Set(["voltage", "current"]), t);
  F(r.target_id, t);
  const n = ot(r.stable, t);
  if (o !== e || r.target_id !== i) throw new Error(`${t} response is invalid`);
  const a = H(r.windows, t, o === "voltage" ? 3 : 1);
  if (a.length !== (o === "voltage" ? 3 : 1)) throw new Error(`${t} response is invalid`);
  const l = a.map((c) => {
    const d = P(c, t), h = H(d.samples, t, 1).map((b) => K(b, t));
    if (h.length !== 1) throw new Error(`${t} response is invalid`);
    const A = K(d.mean, t), p = K(d.standard_deviation, t), _ = K(d.range_percent, t), u = h.reduce((b, m) => b + m, 0) / h.length, f = Math.sqrt(h.reduce((b, m) => b + (m - u) ** 2, 0) / h.length), w = 100 * (Math.max(...h) - Math.min(...h)) / Math.abs(u);
    if (!Pt(A, u) || !Pt(p, f) || !Pt(_, w)) throw new Error(`${t} response is invalid`);
    return _;
  });
  if (n !== l.every((c) => c <= 1)) throw new Error(`${t} response is invalid`);
  return s;
}
function co(s, t, e) {
  const i = P(s, t), r = V(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), t);
  F(i.group_key, t), i.phase !== null && V(i.phase, Ji, t);
  const o = U(i.iteration, t), n = H(i.changed_channels, t, 3).map((_) => U(_, t)), a = H(i.before_values, t, 3), l = H(i.after_values, t, 3), c = H(i.error_percent_values, t, 3);
  for (const _ of [a, l, c]) _.forEach((u) => K(u, t));
  const d = e.target === "voltage" ? e.groupKey : br(e.references[0].channel), h = e.target === "voltage" ? Yn(e.groupKey) : e.references.map((_) => _.channel), A = e.target === "current" && e.references.length === 1 ? ["A", "B", "C"][(e.references[0].channel - 1) % 3] : null, p = ot(i.retry_allowed, t);
  if (e.target === "voltage" && (!Number.isFinite(e.reference) || e.reference <= 0) || e.target === "current" && e.references.some((_) => !Number.isFinite(_.reference) || _.reference <= 0 || !Number.isFinite(_.rawReference) || _.rawReference <= 0) || ![1, 2, 3].includes(n.length) || r !== "indeterminate" && a.length !== n.length || new Set(n).size !== n.length || n.some((_) => _ < 1 || _ > 42) || o < 1 || o > 3 || i.group_key !== d || i.phase !== A || n.length !== h.length || n.some((_, u) => _ !== h[u]) || (r === "indeterminate" ? l.length !== 0 || c.length !== 0 : l.length !== n.length || c.length !== n.length)) throw new Error(`${t} response is invalid`);
  if (r === "indeterminate") {
    if (i.gain_evidence !== null || p) throw new Error(`${t} response is invalid`);
    i.restore_evidence != null && P(i.restore_evidence, t);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${t} response is invalid`);
    fd(i.gain_evidence, t, e);
    const _ = e.target === "voltage" ? l.map(() => e.reference) : e.references.map((w) => w.reference), u = l.map((w, b) => 100 * Math.abs(K(w, t) - _[b]) / _[b]);
    if (c.some((w, b) => K(w, t) < 0 || !Pt(K(w, t), u[b]))) throw new Error(`${t} response is invalid`);
    const f = Math.max(...u) > 1;
    if (r === "result_outside_tolerance" !== f || p !== (f && o < 3)) throw new Error(`${t} response is invalid`);
  }
  return s;
}
function br(s) {
  const t = Math.floor((s - 1) / 6), e = Math.floor((s - 1) % 6 / 3) + 1;
  return t === 0 ? `main_${e}` : `addon${t}_${e}`;
}
function fd(s, t, e) {
  const i = P(s, t), r = U(i.connection_generation, t), o = U(i.operation_sequence, t), n = e.target === "voltage" ? e.groupKey : br(e.references[0].channel), a = n.startsWith("main_") ? `meter_main${n.slice(-1)}` : n;
  if (r < 1 || o < 1 || F(i.instance_id, t) !== a) throw new Error(`${t} response is invalid`);
  const l = e.target === "current" ? new Map(e.references.map((A) => [["A", "B", "C"][(A.channel - 1) % 3], A.rawReference])) : /* @__PURE__ */ new Map(), c = H(i.phases, t, 3);
  if (c.length !== 3) throw new Error(`${t} response is invalid`);
  c.forEach((A, p) => {
    const _ = P(A, t), u = V(_.phase, Ji, t);
    if (u !== ["A", "B", "C"][p]) throw new Error(`${t} response is invalid`);
    K(_.measured_voltage, t), K(_.measured_current, t);
    const f = K(_.reference_voltage, t), w = K(_.reference_current, t), b = U(_.old_voltage_gain, t), m = U(_.new_voltage_gain, t), C = U(_.old_current_gain, t), R = U(_.new_current_gain, t);
    if ([b, m, C, R].some((E) => E < 1 || E > 65535)) throw new Error(`${t} response is invalid`);
    if (e.target === "voltage") {
      if (Math.abs(f - e.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(f), e.reference)) || Math.abs(w) > 1e-6 || C !== R) throw new Error(`${t} response is invalid`);
    } else {
      const E = l.get(u);
      if (Math.abs(f) > 1e-6 || (E === void 0 ? Math.abs(w) > 1e-6 : Math.abs(w - E) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(w), E))) || b !== m || E === void 0 && C !== R) throw new Error(`${t} response is invalid`);
    }
  });
  const d = H(i.register_mismatch_phases, t, 3);
  d.forEach((A) => V(A, Ji, t));
  const h = H(i.matching_lines, t, 100);
  if (h.length === 0 || h.some((A) => typeof A != "string") || ot(i.flash_saved, t) !== !0 || d.length !== 0 || ot(i.calibration_disabled, t) !== !1) throw new Error(`${t} response is invalid`);
}
function Yn(s) {
  const t = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(s);
  if (!t) return [];
  const e = t[2] === void 0 ? 0 : Number(t[2]), i = Number(t[1] ?? t[3]), r = e * 6 + (i - 1) * 3 + 1;
  return [r, r + 1, r + 2];
}
function ir(s, t, e) {
  const i = P(s, t);
  for (const _ of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) F(i[_], t);
  const r = U(i.topology_addon_count, t);
  V(i.topology_connection_type, wr, t);
  const o = U(i.connection_generation, t), n = V(i.source_authority, /* @__PURE__ */ new Set(["saved_flash", "configuration"]), t), a = ot(i.source_handoff_available, t), l = ot(i.source_handoff_firmware_installed, t);
  er(i.source_handoff_transaction_id, t);
  const c = i.config_filename !== null || i.config_sha256 !== null;
  if (c && (F(i.config_filename, t), F(i.config_sha256, t), !ad.test(i.config_filename) || !nd.test(i.config_sha256)))
    throw new Error(`${t} response is invalid`);
  if (i.config_filename === null != (i.config_sha256 === null)) throw new Error(`${t} response is invalid`);
  if (!od.test(i.mac) || !oo.test(i.verification_id) || o < 1 || i.source_handoff_transaction_id !== null && !oo.test(i.source_handoff_transaction_id) || r !== e.addon_count || i.topology_project_name !== e.project_name || i.topology_connection_type !== e.connection_type || i.topology_voltage_layout !== e.voltage_layout) throw new Error(`${t} response is invalid`);
  const d = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: r }, (_, u) => [`addon${u + 1}_1`, `addon${u + 1}_2`]).flat()]), h = (_, u, f) => {
    const w = H(i[_] ?? [], t, 14), b = /* @__PURE__ */ new Set();
    return w.forEach((m) => {
      const C = P(m, t);
      Ut(C, ["instance_id", u], t);
      const R = F(C.instance_id, t);
      if (!d.has(R) || b.has(R)) throw new Error(`${t} response is invalid`);
      if (b.add(R), f) Ln(C[u], t);
      else {
        const E = H(C[u], t, 3);
        if (E.length !== 3) throw new Error(`${t} response is invalid`);
        E.forEach((M) => {
          const D = H(M, t, 2);
          if (D.length !== 2 || D.some((x) => {
            const S = U(x, t);
            return S < 1 || S > 65535;
          })) throw new Error(`${t} response is invalid`);
        });
      }
    }), w.length;
  }, A = h("groups", "phase_gains", !1), p = h("offset_groups", "phase_offsets", !0) + h("power_offset_groups", "phase_power_offsets", !0);
  if (A + p < 1 || a && (!c || l || i.source_handoff_transaction_id !== null || n !== "saved_flash" || p > 0) || !a && c && i.source_handoff_transaction_id === null && p === 0 || l && (!c || i.source_handoff_transaction_id === null || p > 0) || n === "configuration" && (!l || a || p > 0)) throw new Error(`${t} response is invalid`);
  return s;
}
function md(s, t, e) {
  const i = P(s, t);
  return i.session !== null && Lt(i.session, t), i.transaction !== null && $e(i.transaction, t), i.verified_calibration !== null && ir(i.verified_calibration, t, e), s;
}
class ji {
  constructor(t, e) {
    this.hass = t, this.entryId = e, this.setupStatus = () => this.call("setup_status", (i) => yi(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (H(i, "list_meters").forEach((r) => Gn(r, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (r) => Ad(r, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (r) => pd(r, "get_ct_inventory"), { device_id: i }), this.getActiveWork = (i, r) => this.call("get_active_work", (o) => md(o, "get_active_work", r), { device_id: i }), this.getSession = (i) => this.call("get_session", (r) => Lt(r, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => P(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, r, o) => this.call("set_installer_intent", (n) => yi(n, "set_installer_intent"), {
      addon_count: i,
      connection_type: r,
      ...o && o.productId.length <= 160 && o.version.length <= 160 && Hn.test(o.productId) && $n.test(o.version) ? { firmware_product_id: o.productId, esphome_version: o.version } : {}
    }), this.rescan = () => this.call("rescan", (i) => yi(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (r) => {
      const o = P(r, "adopt_device");
      return F(o.device_id, "adopt_device"), F(o.configuration, "adopt_device"), r;
    }, { device_id: i }), this.previewCtConfig = (i, r, o, n) => this.call("preview_ct_config", (a) => $e(a, "preview_ct_config"), {
      device_id: i,
      plan_id: r,
      source_sha256: o,
      changes: n
    }), this.setHaLabels = (i, r, o, n) => this.call("set_ha_labels", (a) => a, {
      device_id: i,
      plan_id: r,
      source_sha256: o,
      changes: n
    }), this.transaction = (i, r, o, n) => this.call(i, (a) => $e(a, i), {
      device_id: r,
      transaction_id: o,
      source_sha256: n
    }), this.applyCtConfig = (i, r, o) => this.transaction("apply_ct_config", i, r, o), this.compileCtConfig = (i, r, o) => this.transaction("compile_ct_config", i, r, o), this.installCtConfig = (i, r, o) => this.transaction("install_ct_config", i, r, o), this.rollbackCtConfig = (i, r, o) => this.transaction("rollback_ct_config", i, r, o), this.startSession = (i) => this.call("start_session", (r) => Lt(r, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (r) => Lt(r, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, r, o) => this.call("check_stability", (n) => lo(n, "check_stability", r, o), { session_id: i, target: r, target_id: o }), this.checkOffsetReadiness = (i, r, o) => this.call("check_offset_readiness", (n) => gd(n, "check_offset_readiness", r, o), {
      session_id: i,
      board_index: r,
      stage: o
    }), this.calibrateOffset = (i, r, o, n, a) => this.call("calibrate_offset", (l) => ud(l, "calibrate_offset", r, o), {
      session_id: i,
      board_index: r,
      stage: o,
      preparation_acknowledged: n,
      confirm_retry: a
    }), this.skipOffsetCalibration = (i) => this.call("skip_offset_calibration", (r) => Lt(r, "skip_offset_calibration"), { session_id: i }), this.checkVoltageStability = (i, r) => r.length !== 2 || new Set(r).size !== 2 ? Promise.reject(new Error("check_stability board is invalid")) : this.call("check_stability", (o) => {
      const n = H(o, "check_stability", 2);
      if (n.length !== 2) throw new Error("check_stability response is invalid");
      return n.map((a, l) => lo(a, "check_stability", "voltage", r[l]));
    }, { session_id: i, target: "voltage", target_ids: r }), this.calibrateVoltage = (i, r, o) => {
      const n = r.map((a) => Yn(a.group_key));
      return r.length !== 2 || new Set(r.map((a) => a.group_key)).size !== 2 || n.some((a) => a.length !== 3) || new Set(n.map((a) => Math.floor((a[0] - 1) / 6))).size !== 1 || r.some((a) => !Number.isFinite(a.reference) || a.reference <= 0) ? Promise.reject(new Error("calibrate_voltage board is invalid")) : this.call("calibrate_voltage", (a) => {
        const l = H(a, "calibrate_voltage", 2);
        if (l.length !== 2) throw new Error("calibrate_voltage response is invalid");
        return l.map((c, d) => co(c, "calibrate_voltage", {
          target: "voltage",
          groupKey: r[d].group_key,
          reference: r[d].reference
        }));
      }, { session_id: i, references: r, confirm_iteration: o });
    }, this.calibrateCurrent = (i, r, o, n = []) => r.length < 1 || r.length > 3 || new Set(r.map((a) => a.channel)).size !== r.length || new Set(r.map((a) => br(a.channel))).size !== 1 || r.some((a) => !Number.isInteger(a.channel) || a.channel < 1 || a.channel > 42 || !Number.isFinite(a.reference) || a.reference <= 0 || !Number.isFinite(a.reporting_multiplier) || a.reporting_multiplier < 1e-3 || a.reporting_multiplier > 1e3) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (a) => co(a, "calibrate_current", {
      target: "current",
      references: r.map((l) => ({ channel: l.channel, reference: l.reference, rawReference: l.reference / l.reporting_multiplier }))
    }), {
      session_id: i,
      references: r,
      confirm_iteration: o,
      pending_multipliers: n
    }), this.restartAndVerify = (i, r) => this.call("restart_and_verify", (o) => ir(o, "restart_and_verify", r), { session_id: i }), this.completeCalibrationWithoutChanges = (i) => this.call("complete_calibration_without_changes", (r) => {
      const o = Lt(r, "complete_calibration_without_changes");
      if (o.session_id !== i || o.state !== "verified" || o.has_pending_calibration !== !1)
        throw new Error("complete_calibration_without_changes response is invalid");
      return o;
    }, { session_id: i }), this.previewCalibratedGains = (i, r, o = []) => this.call("preview_calibrated_gains", (n) => $e(n, "preview_calibrated_gains"), {
      session_id: i,
      verification_id: r,
      changes: o
    }), this.clearCalibrationFlash = (i, r, o, n) => this.call("clear_calibration_flash", (a) => ir(a, "clear_calibration_flash", n), {
      session_id: i,
      verification_id: r,
      transaction_id: o
    }), this.cancelSession = (i) => this.call("cancel_session", (r) => Lt(r, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (r) => yi(r, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, r, o, n) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: r,
      source_sha256: o
    }, (a) => $e(a, "subscribe_config_transaction"), n), this.subscribeSession = (i, r) => this.subscribe("subscribe_session", { session_id: i }, (o) => Lt(o, "subscribe_session"), r);
  }
  static assertPublicPayload(t, e = !1, i = 0, r = "", o = !1) {
    if (i > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(t)) {
      if (t.length > 100) throw new Error(`unsafe collection ${r || "value"} refused`);
      for (const n of t) this.assertPublicPayload(n, !1, i + 1, r);
      return;
    }
    if (typeof t == "string") {
      const n = t.includes(`
`) || t.includes("\r"), a = r === "redacted_diff" ? 32768 : 4096;
      if (t.length > a || jc.test(t) || Jc.test(t) || n && r !== "redacted_diff" || r === "redacted_diff" && t.includes("\r"))
        throw new Error(`unsafe string ${r || "value"} refused`);
      return;
    }
    if (!(t === null || typeof t != "object"))
      for (const [n, a] of Object.entries(t)) {
        if (n.length > 256 || Wc.test(n)) throw new Error("unsafe property name refused");
        if (n.toLowerCase() === "key" && !o) throw new Error(`private field ${n} refused`);
        if (n.toLowerCase() !== "raw_gain_ct" && zc.test(n))
          throw new Error(`private field ${n} refused`);
        if (e && i === 0 && n === "changes" && Array.isArray(a)) {
          if (a.length > 100) throw new Error("unsafe collection changes refused");
          for (const l of a) this.assertPublicPayload(l, !1, i + 2, "", !0);
        } else
          this.assertPublicPayload(a, !1, i + 1, n.toLowerCase());
      }
  }
  async call(t, e, i = {}) {
    const r = await this.hass.callWS({
      type: `${so}${t}`,
      entry_id: this.entryId,
      ...i
    });
    return ji.assertPublicPayload(r, no.has(t)), e(r);
  }
  subscribe(t, e, i, r) {
    return this.hass.connection.subscribeMessage((o) => {
      ji.assertPublicPayload(o, no.has(t)), r(i(o));
    }, { type: `${so}${t}`, entry_id: this.entryId, ...e });
  }
}
function _d(s) {
  return y`
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
function vd(s, t, e, i, r, o, n) {
  const a = s?.state ?? "previewed";
  return y`
    <section class="step-content" aria-labelledby="step-heading">
      ${_d(s)}
      ${a === "failed" ? y`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${s?.evidence.join(", ") || "The operation did not complete."}</p>
          ${s?.rollback_available ? y`<button class="danger" @click=${r}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${t} ?disabled=${a !== "previewed"}>Apply</button>
        <button class="secondary" @click=${e} ?disabled=${a !== "validated"}>Compile</button>
        <button class="primary" @click=${i} ?disabled=${a !== "install_confirmation_required"}>Install</button>
      </div>
      ${s?.validation_detail ? y`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${s.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${s.validation_detail.error_record_count} records (${s.validation_detail.reported_error_count ?? "unreported"} reported)</dd></div>
        <div><dt>Warnings</dt><dd>${s.validation_detail.warning_record_count} records (${s.validation_detail.reported_warning_count ?? "unreported"} reported)</dd></div>
      </dl>` : ""}
      ${s?.upload_progress?.length ? y`<ul class="upload-progress">${s.upload_progress.map((l) => y`
        <li>${l.stage}: ${l.percentage ?? l.progress ?? "in progress"}${l.percentage != null || l.progress != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" data-action="continue" @click=${n} ?disabled=${a !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const ns = (s, t) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(s.key)) return;
  s.preventDefault();
  const i = [...s.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], r = s.key === "ArrowRight" || s.key === "ArrowDown", o = s.key === "Home" ? 0 : s.key === "End" ? i.length - 1 : (t + (r ? 1 : i.length - 1)) % i.length;
  i[o]?.click(), i[o]?.focus();
}, Nn = (s, t, e) => (s?.default_gain_ct ?? e) == null || !Number.isFinite(t) || t <= 0 ? null : Math.round((s?.default_gain_ct ?? e) / t);
function Ed(s, t, e, i, r, o, n, a = !1, l = !1) {
  const c = Math.ceil(s.channels.length / 6), d = s.channels.filter((h) => h.address.board_index === t).slice(0, 8);
  return y`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: c }, (h, A) => y`
          <button role="tab" id=${`board-tab-${A}`} data-board-tab=${A} aria-selected=${A === t}
            aria-controls="board-panel" tabindex=${A === t ? "0" : "-1"}
            @keydown=${(p) => ns(p, A)}
            @click=${() => i(A)}>${A === 0 ? "Main Board" : `Add-on ${A}`}</button>
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
    const A = e.get(h.channel) ?? {
      name: h.name,
      modelId: h.selected_model_id ?? "",
      multiplier: h.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, p = s.catalog.presets.find((f) => f.model_id === A.modelId), _ = Nn(p, A.multiplier, A.modelId === "custom" ? A.customGainCt : void 0), u = yr(h, A);
    return y`
              <div class="ct-row" data-ct-row data-ct-group=${h.address.group_index} role="row" aria-rowindex=${h.channel + 1} aria-label=${`CT${h.channel}`}>
                <strong class="ct-index" role="cell">CT${h.channel}</strong>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${h.channel} name`} .value=${A.name}
                  @input=${(f) => r(h.channel, { name: f.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${h.channel} model`} ?disabled=${a}
                  @change=${(f) => {
      const w = f.target.value, b = s.catalog.presets.find((m) => m.model_id === w);
      r(h.channel, {
        modelId: w,
        burdenAcknowledged: h.selection_verified_against_config && w === h.selected_model_id && (w === "custom" || b?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${A.modelId === ""}>Choose model</option>
                  ${s.catalog.presets.map((f) => y`<option value=${f.model_id} ?selected=${A.modelId === f.model_id}>${f.label}</option>`)}
                  <option value="custom" ?selected=${A.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${h.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${h.channel} multiplier`} ?disabled=${a}
                  .value=${String(A.multiplier)} @input=${(f) => r(h.channel, { multiplier: Number(f.target.value) })} /></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${_ ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${p?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${A.expanded} @click=${() => r(h.channel, { expanded: !A.expanded })}>
                  ${A.modelId ? u ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${A.modelId === "custom" ? y`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${h.channel} custom gain`}
                  ?disabled=${a}
                  .value=${A.customGainCt === void 0 ? "" : String(A.customGainCt)}
                  @input=${(f) => r(h.channel, { customGainCt: Number(f.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${h.channel} custom label`} ?disabled=${a} .value=${A.customLabel ?? ""}
                  @input=${(f) => r(h.channel, { customLabel: f.target.value })} /></label>
              </div>` : O}
              ${A.modelId === "custom" || p?.requires_burden_jumper_cut ? y`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${h.channel} burden output acknowledgement`}
                  ?disabled=${a}
                  .checked=${A.burdenAcknowledged}
                  @change=${(f) => r(h.channel, { burdenAcknowledged: f.target.checked })} />
                  I checked the burden-output requirement for CT${h.channel}</label>
              </div>` : O}
              ${p && p.rated_current_a > 65.535 && A.multiplier === 1 ? y`<div class="warning-band" role="status">CT${h.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : O}
              ${A.expanded && p ? y`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${p.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${p.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${p.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${p.notes || (p.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
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
        <button class="primary" data-action="continue" ?disabled=${l || !bd(s, e, a)} @click=${n}>${l ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
function fe(s, t) {
  return s.channels.flatMap((e) => {
    const i = t.get(e.channel);
    if (!i || !yr(e, i)) return [];
    const r = s.catalog.presets.find((n) => n.model_id === i.modelId), o = { channel: e.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (o.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (o.custom_label = i.customLabel.trim()), o.burden_output_acknowledged = i.burdenAcknowledged) : r?.requires_burden_jumper_cut && (o.burden_output_acknowledged = i.burdenAcknowledged), [o];
  });
}
function yr(s, t) {
  return t.name !== s.name || t.modelId !== (s.selected_model_id ?? "") || t.multiplier !== s.reporting_multiplier || t.modelId === "custom" && (Nn(void 0, t.multiplier, t.customGainCt) !== s.raw_gain_ct || (t.customLabel?.trim() ?? "") !== (s.display_label ?? ""));
}
function wd(s, t) {
  if (!t.name.trim() || !t.modelId || !Number.isFinite(t.multiplier) || t.multiplier <= 0) return !1;
  if (t.modelId === "custom") return Number.isInteger(t.customGainCt) && t.customGainCt >= 1 && t.customGainCt <= 65535 && !!t.customLabel?.trim() && !/[\r\n]/.test(t.customLabel) && t.burdenAcknowledged;
  const e = s.catalog.presets.find((i) => i.model_id === t.modelId);
  return !!e && (!e?.requires_burden_jumper_cut || t.burdenAcknowledged);
}
function bd(s, t, e = !1) {
  if (e) return [...t].every(([i, r]) => {
    const o = s.channels.find((n) => n.channel === i);
    return !!o && !!r.name.trim() && r.modelId === (o.selected_model_id ?? "") && r.multiplier === o.reporting_multiplier;
  });
  for (const i of s.channels) {
    const r = t.get(i.channel);
    if (!r || yr(i, r) && !wd(s, r))
      return !1;
  }
  return !0;
}
const Yt = (s) => s.toFixed(2);
function Kn(s, t, e) {
  const i = [s, !!t?.stable, !!e, !!e?.gain_evidence, !!e], r = i.findIndex((n) => !n);
  return y`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((n, a) => y`<li
    class=${i[a] ? "complete" : a === r ? "active" : "pending"}><span
      class="progress-number">${a + 1}</span><span>${n}</span></li>`)}</ol>`;
}
function zn(s, t) {
  const e = Object.entries(s?.calibration_sources ?? {}).filter(([i]) => t === void 0 || t.includes(i));
  return y`<section class="measurement-evidence calibration-source" aria-label="Current calibration source">
    <h3>Current calibration source</h3>
    ${e.length ? y`<table><thead><tr><th>Chip</th><th>Source</th><th>Saved in flash</th></tr></thead><tbody>
      ${e.map(([i, r]) => y`<tr><td>${i}</td><td>${r === "configuration" ? "Configuration" : r === "flash" ? "Saved flash" : "Unknown"}</td><td>${r === "flash" ? "Yes" : r === "configuration" ? "No" : "Unknown"}</td></tr>`)}
    </tbody></table>` : y`<p>Calibration source is not available.</p>`}
  </section>`;
}
function Cr(s, t) {
  if (!s) return O;
  const e = s.target === "voltage" ? "V" : "A";
  return y`<section class="measurement-evidence" aria-label=${`${s.target} ${s.target_id} stability evidence`}>
    <h3>Stability evidence · ${s.target_id}</h3>
    ${s.windows.map((i, r) => y`<dl>
      <div><dt>${t?.[r] ?? (s.target === "voltage" ? `V${r % 3 + 1}` : `A${r + 1}`)}</dt>
        <dd>${i.samples.map((o) => `${Yt(o)} ${e}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}
function Br(s) {
  return s ? y`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${s.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${s.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${s.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${s.before_values.map(Yt).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${s.after_values.map(Yt).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${s.error_percent_values.map((t) => `${Yt(t)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${s.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${s.gain_evidence ? y`<h4>Gain evidence · ${s.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${s.gain_evidence.phases?.map((t) => y`<tr><td>${t.phase}</td><td>${Yt(t.measured_voltage)}</td><td>${Yt(t.measured_current)}</td><td>${Yt(t.reference_voltage)}</td><td>${Yt(t.reference_current)}</td><td>${t.old_voltage_gain} → ${t.new_voltage_gain}</td><td>${t.old_current_gain} → ${t.new_current_gain}</td></tr>`) ?? O}
      </tbody></table><p>Saved in flash: ${s.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : y`<p>Gain evidence unavailable.</p>`}
  </section>` : O;
}
function yd(s, t, e, i, r, o, n, a, l, c, d, h, A, p, _) {
  const u = s?.ct_count ?? t?.channels.length ?? 6, f = Math.floor((i - 1) / 6), b = Math.floor((i - 1) / 3) * 3 + 1, m = Array.from({ length: 3 }, (x, S) => b + S).filter((x) => x <= u), C = m.filter((x) => (r.get(x) ?? 0) > 0), R = f === 0 ? ["meter_main1", "meter_main2"] : [`addon${f}_1`, `addon${f}_2`], E = t === null, M = o !== null && Number.isFinite(o) && o >= 1e-3 && o <= 1e3, D = C.length > 0 && (!E || M);
  return y`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Kn(D, n, a)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(u / 6) }, (x, S) => y`<button role="tab"
          id=${`current-board-tab-${S}`} aria-controls="current-board-panel"
          aria-selected=${S === f} tabindex=${S === f ? "0" : "-1"}
          @keydown=${(T) => ns(T, S)}
          @click=${() => l(S * 6 + 1)}>${S === 0 ? "Main Board" : `Add-on ${S}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${f}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((x) => {
    const S = f * 6 + x * 3 + 1;
    return y`<button
          aria-pressed=${S === b} @click=${() => l(S)}>Group ${f * 2 + x + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${b}–CT${b + 2}</h2>
      ${zn(e, R)}
      <div class="reference-block">
        ${m.map((x) => y`<label>CT${x} reference
          <input data-current-reference=${x} aria-label=${`CT${x} reference`} type="number" min="0.01" step="0.01"
            .value=${r.has(x) ? String(r.get(x)) : ""}
            @input=${(S) => {
    const T = S.target;
    c(x, T.value === "" ? null : Number(T.value));
  }} /></label>`)}
      ${E ? y`<label>Reporting multiplier <input data-role="reporting-multiplier" type="number" min="0.001" max="1000" step="0.001" required .value=${o === null ? "" : String(o)} @input=${(x) => {
    const S = Number(x.target.value);
    d(Number.isFinite(S) && S >= 1e-3 && S <= 1e3 ? S : null);
  }} /></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
        <button class="primary" @click=${A} ?disabled=${!D || !n?.stable || (a?.iteration ?? 0) >= 3 || !!(a && !a.retry_allowed && a.iteration > 0)}>${a?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${h} ?disabled=${!D}>Check stability</button></div>
      ${n ? y`<div class=${n.stable ? "success-band" : "warning-band"} role="status">${n.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${Cr(n, C.map((x) => `CT${x}`))}
      ${Br(a)}
      ${a?.state.includes("indeterminate") ? y`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${p}>Reconnect and inspect</button><button class="danger" @click=${_}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Jn = async (s) => {
  let t;
  Promise.resolve().then(() => sg).then((function(i) {
    return i.i;
  }));
  try {
    t = await navigator.serial.requestPort();
  } catch (i) {
    return i.name === "NotFoundError" ? void Promise.resolve().then(() => og).then(((r) => r.openNoPortPickedDialog((() => Jn(s))))) : void alert(`Error: ${i.message}`);
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
let Ci = class ve extends HTMLElement {
  connectedCallback() {
    if (this.renderRoot) return;
    if (this.renderRoot = this.attachShadow({ mode: "open" }), !ve.isSupported || !ve.isAllowed) return this.toggleAttribute("install-unsupported", !0), void (this.renderRoot.innerHTML = ve.isAllowed ? "<slot name='unsupported'>Your browser does not support installing things on ESP devices. Use Mozilla Firefox, Google Chrome or Microsoft Edge.</slot>" : "<slot name='not-allowed'>You can only install ESP devices on HTTPS websites or on the localhost.</slot>");
    this.toggleAttribute("install-supported", !0);
    const t = document.createElement("slot");
    t.addEventListener("click", (async (i) => {
      i.preventDefault(), Jn(this);
    })), t.name = "activate";
    const e = document.createElement("button");
    if (e.innerText = "Connect", t.append(e), "adoptedStyleSheets" in Document.prototype && "replaceSync" in CSSStyleSheet.prototype) {
      const i = new CSSStyleSheet();
      i.replaceSync(ve.style), this.renderRoot.adoptedStyleSheets = [i];
    } else {
      const i = document.createElement("style");
      i.innerText = ve.style, this.renderRoot.append(i);
    }
    this.renderRoot.append(t);
  }
};
Ci.isSupported = "serial" in navigator, Ci.isAllowed = window.isSecureContext, Ci.style = `
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
  }`, customElements.define("esp-web-install-button", Ci);
const jn = "https://circuitsetup.github.io/ESPWebInstaller/", Cd = new URL("manifests/firmware_index.json", jn).href, Wn = 256 * 1024, Bd = 100, Id = 20, Vn = 160, xd = 1e4, Sd = /^[a-z0-9][a-z0-9_-]{0,127}$/, Rd = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, qn = /[\u0000-\u001F\u007F-\u009F]/;
function Bt(s) {
  throw new Error(`Invalid firmware index: ${s}`);
}
function ho(s) {
  return typeof s == "object" && s !== null && !Array.isArray(s);
}
function Es(s) {
  return typeof s == "string" && s.length <= Vn && !qn.test(s);
}
function Zn(s) {
  if (!Sd.test(s)) throw new Error("Invalid firmware product ID");
}
function Xn(s) {
  if (!Rd.test(s) || s.length > Vn || qn.test(s))
    throw new Error("Invalid firmware version");
}
function ta(s) {
  return new TextEncoder().encode(s).byteLength;
}
function Dd(s) {
  Array.isArray(s) || Bt("top level must be an array"), ta(JSON.stringify(s)) > Wn && Bt("payload is too large"), s.length > Bd && Bt("too many products");
  const t = /* @__PURE__ */ new Set();
  return s.map((e) => {
    (!ho(e) || Object.keys(e).length !== 3 || !Object.hasOwn(e, "productId") || !Object.hasOwn(e, "name") || !Object.hasOwn(e, "versions")) && Bt("invalid product");
    const { productId: i, name: r, versions: o } = e;
    (!Es(i) || !Es(r) || !Array.isArray(o)) && Bt("invalid product fields"), Zn(i), t.has(i) && Bt("duplicate product ID"), t.add(i), o.length > Id && Bt("too many versions");
    const n = /* @__PURE__ */ new Set();
    return {
      productId: i,
      name: r,
      versions: o.map((a) => ((!ho(a) || Object.keys(a).length !== 1 || !Object.hasOwn(a, "version") || !Es(a.version)) && Bt("invalid version"), Xn(a.version), n.has(a.version) && Bt("duplicate version"), n.add(a.version), { version: a.version }))
    };
  });
}
async function Md(s = globalThis.fetch, t) {
  const e = new AbortController(), i = () => e.abort();
  t?.aborted ? i() : t?.addEventListener("abort", i, { once: !0 });
  const r = setTimeout(i, xd);
  try {
    const o = await s(Cd, { cache: "no-cache", mode: "cors", signal: e.signal });
    if (!o.ok) throw new Error(`Firmware index request failed (${o.status})`);
    const n = await o.text();
    return ta(n) > Wn && Bt("payload is too large"), Dd(JSON.parse(n));
  } finally {
    clearTimeout(r), t?.removeEventListener("abort", i);
  }
}
function Td(s, t) {
  if (!Number.isInteger(s) || s < 0 || s > 6) return [];
  const e = s === 0 ? "6chan_energy_meter_main" : s === 1 ? "6chan_energy_meter_1-addon" : `6chan_energy_meter_${s}-addons`;
  return t === "wifi" ? [s === 0 ? `${e}_board` : e] : t === "ethernet_lilygo" ? [`${e}_ethernet`] : s === 0 ? [`${e}_ethernet_waveshare`, `${e}_ethernet_ws`] : [`${e}_ethernet_waveshare`];
}
function kd(s, t) {
  const e = (o) => o.split(/[-.]/).map((n) => Number.isNaN(Number(n)) ? n : Number.parseInt(n, 10)), i = e(s), r = e(t);
  for (let o = 0; o < Math.max(i.length, r.length); o += 1) {
    const n = i[o], a = r[o];
    if (n === void 0) return -1;
    if (a === void 0) return 1;
    if (n > a) return -1;
    if (n < a) return 1;
  }
  return 0;
}
function Fd(s, t, e) {
  const i = /* @__PURE__ */ new Map();
  for (const r of Td(t, e)) {
    const o = s.find((n) => n.productId === r);
    for (const n of o?.versions ?? [])
      i.has(n.version) || i.set(n.version, { productId: r, version: n.version });
  }
  return [...i.values()].sort((r, o) => kd(r.version, o.version));
}
function Od(s, t) {
  return s.find((e) => e.version === t)?.version ?? s[0]?.version ?? null;
}
function Pd(s, t) {
  Zn(s), Xn(t);
  const e = new URL(`manifests/manifest_${s}-${t}.json`, jn);
  if (e.origin !== "https://circuitsetup.github.io" || !e.pathname.startsWith("/ESPWebInstaller/manifests/"))
    throw new Error("Invalid firmware manifest URL");
  return e.href;
}
function Ud(s) {
  if (!s) return O;
  try {
    const t = Pd(s.productId, s.version);
    return y`
      <p class="firmware-summary">${s.productId} · ESPHome ${s.version}</p>
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
const Ao = (s) => s === 0 ? "Main Board" : `Add-on ${s}`, Qd = (s) => s === 0 ? ["main_1", "main_2"] : [`addon${s}_1`, `addon${s}_2`];
function Hd(s, t, e, i, r, o, n, a, l, c, d, h, A, p, _, u, f, w, b) {
  const m = t?.offset_capability, C = t?.offset_boards ?? [], R = t?.offset_disposition === "completed" || t?.offset_disposition === "skipped" || t?.offset_disposition === "partial" && t.state === "applied_pending_restart_verification", E = C.length > 0 && C.every((k) => k.stages[0]?.state === "completed"), M = C[e]?.stages[i - 1]?.state ?? "not_started", D = !!a?.retry_allowed || M === "partial" || M === "indeterminate", x = m?.status !== "available", S = Qd(e), T = new Map(a?.expected_tables ?? []);
  return y`
    <section class="step-content offset-step" aria-labelledby="step-heading">
      ${x ? y`
        <div class="warning-band" role="status">
          <strong>Offset calibration is ${m?.status === "invalid" ? "not safely available" : "not available on this firmware"}.</strong>
          ${m?.status === "invalid" ? y`<p>Repair reason: ${m.repair_reason}</p>` : O}
          <p>Skip preserves the offset values already saved in flash. No clear control is invoked.</p>
        </div>
      ` : y`
        <ol class="offset-stage-stepper" aria-label="Offset calibration stages">
          <li class=${i === 1 ? "active" : E ? "complete" : "pending"}>
            <button data-offset-stage="1" aria-current=${i === 1 ? "step" : O} @click=${() => d(1)}>1. Voltage/current zero offset</button>
          </li>
          <li class=${i === 2 ? "active" : R ? "complete" : "pending"}>
            <button data-offset-stage="2" aria-current=${i === 2 ? "step" : O} ?disabled=${!E}
              @click=${() => d(2)}>2. Active/reactive power offset</button>
          </li>
        </ol>
        <div class="board-tabs" role="tablist" aria-label="Offset calibration boards">
          ${Array.from({ length: s?.board_count ?? C.length }, (k, N) => y`
            <button role="tab" data-offset-board id=${`offset-board-tab-${N}`} aria-controls="offset-board-panel"
              aria-selected=${N === e} tabindex=${N === e ? "0" : "-1"}
              @keydown=${(et) => ns(et, N)} @click=${() => c(N)}>
              ${Ao(N)}
            </button>
          `)}
        </div>
        <div id="offset-board-panel" role="tabpanel" aria-labelledby=${`offset-board-tab-${e}`}>
          <h2>Stage ${i} · ${Ao(e)}</h2>
          <div class="warning-band"><strong>Warning:</strong> An open-circuit current-output CT on a live conductor can be hazardous. De-energize conductors before unplugging any CT.</div>
          ${i === 1 ? y`
            <p>First, de-energize all conductors. Then unplug the voltage transformer/AC voltage input and CT inputs, power the meter from USB only, then check that every voltage/current phase reads near zero.</p>
          ` : y`
            <p>Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors, connect/enclose/energize only the voltage reference, then check that voltage is present on both chips and every current phase reads near zero.</p>
          `}
          <p>Measurements cannot prove that a transformer or CT is physically unplugged. Physical acknowledgement never substitutes for measured readiness.</p>
          <label class="check-row"><input type="checkbox" .checked=${r} @change=${(k) => h(k.target.checked)}>
            ${i === 1 ? "I completed the USB-only, de-energized preparation." : "I powered down for rewiring and safely enclosed and energized only the voltage reference."}
          </label>
          <div class="offset-actions">
            <button class="secondary" data-action="check-offset" ?disabled=${l || !r || M === "completed"} @click=${p}>
              ${l ? "Checking measured readiness…" : "Check measured readiness"}
            </button>
            <button class="primary" data-action="calibrate-offset"
              ?disabled=${l || !r || !n?.ready || M === "completed" || D && !o}
              @click=${_}>${a?.retry_allowed ? "Retry unfinished chip" : `Run Stage ${i} calibration`}</button>
          </div>
          ${n ? y`
            <section class="measurement-evidence" aria-label="Offset readiness evidence">
              <h3>Measured readiness</h3>
              <div class=${n.ready ? "success-band" : "warning-band"} role="status" aria-live="polite">
                ${n.ready ? "Measured readiness passed." : "Measured readiness did not pass. Physical acknowledgement is not enough."}
              </div>
              ${n.reasons.length ? y`<ul>${n.reasons.map((k) => y`<li>${k}</li>`)}</ul>` : O}
              <dl class="threshold-grid">
                <div><dt>Samples per phase</dt><dd>${n.thresholds.sample_count}</dd></div>
                <div><dt>Zero voltage peak</dt><dd>${n.thresholds.zero_voltage_peak_volts} V</dd></div>
                <div><dt>Zero voltage spread</dt><dd>${n.thresholds.zero_voltage_spread_volts} V</dd></div>
                <div><dt>Zero current peak</dt><dd>${n.thresholds.zero_current_peak_amps} A</dd></div>
                <div><dt>Zero current spread</dt><dd>${n.thresholds.zero_current_spread_amps} A</dd></div>
                <div><dt>Voltage present minimum</dt><dd>${n.thresholds.voltage_present_minimum_volts} V</dd></div>
                <div><dt>Voltage present spread</dt><dd>${n.thresholds.voltage_present_spread_volts} V</dd></div>
              </dl>
              <table class="evidence-table"><thead><tr><th>Phase role</th><th>Quantity</th><th>Status</th><th>Mean</th><th>Peak</th><th>Spread</th></tr></thead><tbody>
                ${n.entities.map((k) => y`<tr><td>${k.role}</td><td>${k.quantity}</td><td>${k.ready ? "Ready" : k.reasons.join("; ")}</td>
                  <td>${k.window?.mean ?? "—"}</td><td>${k.window?.absolute_peak ?? "—"}</td><td>${k.window?.absolute_spread ?? "—"}</td></tr>`)}
              </tbody></table>
            </section>
          ` : O}
          <section class="measurement-evidence" aria-label="Per-chip offset progress" aria-live="polite">
            <h3>Per-chip progress</h3>
            <table><thead><tr><th>Chip</th><th>State</th><th>Backend evidence</th></tr></thead><tbody>
              ${S.map((k) => y`<tr><td>${k}</td><td>${T.has(k) || M === "completed" ? "Saved; restart verification required." : a?.unfinished_group_keys.includes(k) ? "Unfinished" : M.replaceAll("_", " ")}</td>
                <td>${T.has(k) ? T.get(k).map(([N, et]) => `${N}/${et}`).join(", ") : "—"}</td></tr>`)}
            </tbody></table>
          </section>
          ${D ? y`<aside class="recovery-panel" role="status" aria-live="assertive">
            <strong>${a ? a.state === "partial" ? "One chip finished; recovery is required" : "Calibration outcome is indeterminate" : "Recovery is required"}</strong>
            <p>${a?.error ?? "The prior operation did not finish cleanly"}. Reconnect and inspect before retrying only the unfinished chip.</p>
            <label class="check-row"><input type="checkbox" .checked=${o} @change=${(k) => A(k.target.checked)}> I reviewed the evidence and confirm this retry.</label>
            <button class="secondary" @click=${u}>Reconnect and inspect</button>
          </aside>` : O}
        </div>
      `}
      <footer class="action-footer offset-footer">
        <button class="secondary" @click=${w}>Back</button>
        <button class="secondary" data-action="skip-offset" ?disabled=${l || R} @click=${f}>Skip offset calibration</button>
        <button class="primary" ?disabled=${l || !R} @click=${b}>Continue</button>
      </footer>
    </section>
  `;
}
function $d(s, t, e, i, r, o) {
  const n = s.includes("failed") || s.includes("indeterminate"), a = !!(t?.offset_groups?.length || t?.power_offset_groups?.length), l = t?.source_handoff_available ? t.config_filename : a ? "Unavailable; offset calibration remains saved in flash" : "Unavailable in runtime-only mode";
  return y`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, voltage/current offsets, power offsets, and entity bindings.</p>
      <div class="status-band" role="status">${s || "Ready for restart verification"}</div>
      ${t ? y`<dl class="status-list"><div><dt>Verification</dt><dd>${t.verification_id}</dd></div><div><dt>Authority</dt><dd>${t.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${t.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${l}</dd></div></dl>` : ""}
      ${s === "cancelled" ? y`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${n ? y`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${e ? y`<button class="danger" data-action="rollback" @click=${r}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${o}>Back</button><button class="primary" @click=${i} ?disabled=${s === "cancelled" || !!t}>${s.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Gd(s) {
  return s ? s.preflight.issues.length ? y`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${s.preflight.issues.map((t) => y`<li>${t.role}: ${t.detail}</li>`)}</ul></div>` : y`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : y`<p>Starting a calibration session…</p>`;
}
function Ld(s, t, e, i, r, o, n = !1) {
  return y`
    <section class="step-content" aria-labelledby="step-heading">
      ${Gd(s)}
      ${s?.state === "cancelled" ? y`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
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
        <label class="check-row"><input type="checkbox" .checked=${t} @change=${(a) => e(a.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${r}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" @click=${i} ?disabled=${n || s?.state === "cancelled" || !t || !!s?.preflight.issues.length}>${n ? "Loading calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const po = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Yd = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function go(s, t, e, i, r, o, n, a, l = "", c = !1, d = y``) {
  return y`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Configure an existing device</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        ${s?.devices.length ? y`<div class="meter-list">
          ${s.devices.map((h) => y`
            <div class="meter-row">
              <span><strong>${h.title}</strong><small>${h.project_name} · ${h.project_version ?? "version unavailable"}</small></span>
              <span>Device Builder: ${h.configuration ? "Yes" : h.importable ? "Yes — import available" : "No"}</span>
              ${h.importable && !h.configuration ? y`<button class="secondary" ?disabled=${!!l}
                @click=${() => a(h.entry_id)}>Import</button>` : ""}
              <button class="primary" data-action="configure-device" ?disabled=${!!l}
                @click=${() => n(h.entry_id)}>${l === `topology:${h.entry_id}` ? "Loading topology…" : "Configure"}</button>
            </div>
          `)}
        </div>` : y`<div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>`}
      </section>
      ${c ? "" : y`<hr />
      <h2>Set up a new device</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (h, A) => y`
            <label class=${A === t ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(A)}
                .checked=${A === t} @change=${() => i(A)} />
              <span>${A}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${po.map(([h, A]) => y`
            <label class=${h === e ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${h}
                .checked=${h === e} @change=${() => r(h)} />
              <span>${A}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>Add-on boards</dt><dd>${t}</dd></div>
          <div><dt>Connection</dt><dd>${po.find(([h]) => h === e)?.[1]}</dd></div>
          ${Yd.slice(0, t).map((h, A) => y`<div><dt>Add-on ${A + 1}</dt><dd>${h}</dd></div>`)}
        </dl>
      </section>
      ${d}
      <p class="info-band">${e === "wifi" ? "Use a USB data cable. ESP Web Tools asks for your Wi-Fi network and password and sends them directly to your meter. This helper does not store or send those credentials to Home Assistant. Complete the ESP Web Tools network setup and Add to Home Assistant when offered." : "Use a USB data cable to install firmware, connect Ethernet and power, wait for an address, complete Add to Home Assistant, then return here. This helper continues when discovery reports your meter."}</p>
      `}
      <button class="rescan" data-action="rescan" ?disabled=${!!l} @click=${o}>${l === "rescan" ? "Rescanning…" : "Rescan for device"}</button>
    </section>
  `;
}
function ea(s, t, e, i, r, o = null, n = !1) {
  return y`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${s?.evidence.map((a) => y`<li>${a.source}: ${a.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${t?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([a, l]) => y`<div data-target=${a}>${Cr(l)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...r.entries()].map(([a, l]) => y`<div data-target=${a}>${Br(l)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${e?.evidence.join(", ") || "No build evidence."}</p><p>${e?.progress.join(", ") || "No transaction progress."}</p>
          ${e?.validation_detail ? y`<p>Validation code ${e.validation_detail.code ?? "unavailable"}; ${e.validation_detail.error_record_count} error records; ${e.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${e?.upload_progress?.length ? y`<ul>${e.upload_progress.map((a) => y`<li>${a.stage}: ${a.percentage ?? a.progress ?? "in progress"}${a.percentage != null || a.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Calibration completion record</h3><p>${o ? `Restart-verified ${o.source_authority.replaceAll("_", " ")} calibration record` : n ? "No-change completion; no restart-verified record was created" : "Not yet established"}</p><p>${o ? `Verification ${o.verification_id}, generation ${o.connection_generation}; ${o.offset_groups?.length ?? 0} voltage/current offset tables; ${o.power_offset_groups?.length ?? 0} power-offset tables.` : n ? "The server confirmed there were no pending gain or offset changes." : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function Nd(s, t, e, i, r, o, n, a, l, c) {
  const d = !!(o?.offset_groups?.length || o?.power_offset_groups?.length), h = o?.source_authority === "saved_flash" && o.config_filename && !d && (o.source_handoff_available || o.source_handoff_firmware_installed);
  return y`
    <section class="step-content" aria-labelledby="step-heading">
      ${o && d ? y`<div class="success-band" role="status">Setup and exact restart verification are complete. Offset calibration remains saved in flash; YAML handoff and flash clearing are unavailable.</div>` : o?.source_authority === "configuration" ? y`<div class="success-band" role="status">Calibration saved to YAML; flash values cleared.</div>` : o ? y`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : n ? y`<div class="success-band" role="status">Completed without calibration changes. No restart or restart-verified calibration record was required.</div>` : y`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${s?.ct_count ?? "—"} CTs in ${s?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${a ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${o?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${o?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${ea(s, t, e, i, r, o, n)}
      <footer class="action-footer"><button class="secondary" @click=${c}>Back</button>
        ${h ? y`<button class="primary" data-action="save-calibration" @click=${l}>${o?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : ""}
      </footer>
    </section>
  `;
}
function ia(s) {
  const t = s.addon_count, e = s.evidence.map((i) => i.source);
  return t < 0 || t > 6 || s.board_count !== t + 1 || s.ct_count !== 6 * (t + 1) || s.group_count !== 2 * (t + 1) || s.evidence.length < 1 || s.evidence.length > 5 || new Set(e).size !== e.length || !e.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || s.evidence.some((i) => i.addon_count !== t);
}
function Kd(s, t, e, i, r = !1, o = !1) {
  const n = r || ia(s);
  return y`
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
        <tbody>${s.evidence.map((a) => y`
          <tr><td>${a.source.replaceAll("_", " ")}</td><td>${a.addon_count}</td><td>${a.detail}</td></tr>
        `)}</tbody>
      </table>
      ${n ? y`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : y`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${e}>Back</button>
        ${n ? "" : y`<button class="primary" data-action="continue" ?disabled=${o} @click=${i}>${o ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
function zd(s, t, e, i, r, o, n, a, l, c, d, h, A) {
  const p = s?.voltage_layout === "two_voltages" ? 2 : 1, _ = i.slice(0, p).every((f) => Number.isFinite(f) && f > 0), u = e === 0 ? ["meter_main1", "meter_main2"] : [`addon${e}_1`, `addon${e}_2`];
  return y`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Kn(_, r, o)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: s?.board_count ?? 1 }, (f, w) => y`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${w}`} aria-controls="voltage-board-panel"
          aria-selected=${w === e} tabindex=${w === e ? "0" : "-1"}
          @keydown=${(b) => ns(b, w)}
          @click=${() => a(w)}>${w === 0 ? "Main Board" : `Add-on ${w}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${e}`}>
      <h2>Calibrate Voltage</h2>
      ${zn(t, u)}
      <div class="reference-block">
        ${Array.from({ length: p }, (f, w) => y`<label>${p === 1 ? "Trusted instrument reference" : `Voltage ${w + 1} trusted reference`}
          <input type="number" min="0.01" step="0.01" .value=${i[w] ? String(i[w]) : ""}
            @input=${(b) => l(w, Number(b.target.value))} /></label>`)}
        <button class="primary" @click=${d} ?disabled=${n || !_ || !r?.stable || !!(o && !o.retry_allowed && o.iteration > 0)}>${o?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${c} ?disabled=${n}>${n ? "Loading live voltage data…" : "Check stability"}</button></div>
      ${r ? y`<div class=${r.stable ? "success-band" : "warning-band"} role="status">${r.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${Cr(r)}
      ${Br(o)}
      ${o?.state === "indeterminate" ? y`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${h}>Reconnect and inspect</button><button class="danger" @click=${A}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Jd = Cc`
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
  .offset-stage-stepper { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 0 0 20px; padding: 0; list-style: none; }
  .offset-stage-stepper button { width: 100%; text-align: left; }
  .offset-stage-stepper .active button { color: #fff; background: var(--navy); border-color: var(--navy); }
  .offset-stage-stepper .complete button { color: var(--teal); border-color: var(--teal); }
  .offset-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 18px 0; }
  .offset-footer { gap: 12px; }
  .threshold-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 24px; margin: 12px 0; }
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
    .ct-detail, .technical-grid, .group-grid, .offset-stage-stepper, .threshold-grid { grid-template-columns: 1fr; }
    .progress-steps { grid-template-columns: 1fr; gap: 8px; }
    .action-footer { left: 0; padding: 12px 18px; }
    .offset-footer { display: grid; grid-template-columns: 1fr 1fr; }
    .offset-footer .primary { grid-column: 1 / -1; }
    .offset-step { padding-bottom: 84px; }
    .identity-strip, .confirmation-actions, .group-nav { align-items: stretch; flex-direction: column; }
    .evidence-table { display: block; overflow-x: auto; }
  }
`, Oe = [
  ["setup", "Setup Device"],
  ["discover", "Discover"],
  ["topology", "Topology"],
  ["ct", "CT Settings"],
  ["safety", "Safety"],
  ["offset", "Offset"],
  ["voltage", "Voltage"],
  ["current", "Current"],
  ["restart", "Restart"],
  ["build", "Flash & Verify"],
  ["summary", "Summary"]
];
class jd extends ze {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.firmwareIndex = null, this.firmwareCatalogState = "idle", this.firmwareCatalogError = "", this.selectedEspHomeVersion = null, this.resolvedFirmwareOptions = [], this.firmwareFetchController = null, this.setupDeviceIds = /* @__PURE__ */ new Set(), this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.sessionStarting = !1, this.pendingAction = "", this.voltageBusy = !1, this.offsetBusy = !1, this.finishBusy = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = Jd;
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
    const e = new ji(this.hass, this.panel.config.entry_id);
    this.api = e;
    try {
      const i = await e.setupStatus();
      if (!this.owns(t, e)) return;
      this.setup = i, this.setupDeviceIds = new Set(i.devices.map((o) => o.entry_id));
      const r = this.setup.installer_intent;
      r && (this.addonCount = r.addon_count, this.connection = r.connection_type, this.refreshFirmwareOptions()), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.firstDeviceId(this.setup.devices)), await this.ownSubscription(e.subscribeSetup((o) => {
        if (!this.owns(t, e)) return;
        const n = o.devices.filter((a) => !this.setupDeviceIds.has(a.entry_id)).sort((a, l) => a.entry_id.localeCompare(l.entry_id));
        this.setup = o, this.setupDeviceIds = new Set(o.devices.map((a) => a.entry_id)), this.step === "setup" && n.length && (this.selectDevice(n[0].entry_id), this.navigate("discover"), this.announcement = "CircuitSetup energy meter discovered."), this.requestUpdate();
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
    this.firmwareFetchController?.abort(), this.firmwareFetchController = e, this.firmwareCatalogState = "loading", this.firmwareCatalogError = "", this.requestUpdate(), Md(globalThis.fetch, e.signal).then((i) => {
      this.ownsFirmwareCatalog(t, e) && (this.firmwareIndex = i, this.firmwareFetchController = null, this.firmwareCatalogState = "ready", this.refreshFirmwareOptions());
    }).catch(() => {
      this.ownsFirmwareCatalog(t, e) && (this.firmwareFetchController = null, this.firmwareCatalogState = "error", this.firmwareCatalogError = "Firmware catalog could not be loaded.", this.requestUpdate());
    });
  }
  refreshFirmwareOptions() {
    const t = this.firmwareIndex ? Fd(this.firmwareIndex, this.addonCount, this.connection) : [], e = this.selectedEspHomeVersion, i = Od(t, e);
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
    const n = await t;
    if (!this.owns(e, i) || !r()) {
      try {
        n();
      } catch {
      }
      return;
    }
    this.unsubs.push(n), o(n);
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
    this.safetyAcknowledged = !1, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.finishBusy = !1;
  }
  selectDevice(t) {
    ++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = t, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.board = 0, this.resetCalibrationRun();
  }
  firstDeviceId(t) {
    return t.map((e) => e.entry_id).sort((e, i) => e.localeCompare(i))[0] ?? null;
  }
  showTopology(t) {
    this.topology = t, this.navigate("topology"), this.error = ia(t) || t.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
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
    this.step === "topology" ? (this.selectDevice(null), this.navigate("setup")) : this.step === "ct" ? this.navigate("topology") : this.step === "safety" ? this.cancelSession("ct") : this.step === "offset" ? this.navigate("safety") : this.step === "voltage" ? this.navigate("offset") : this.step === "current" ? this.navigate("voltage") : this.step === "restart" ? this.navigate("current") : this.step === "build" ? this.navigate(this.calibrationHandoff ? "restart" : "ct") : this.step === "summary" && this.navigate("build");
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
      const o = this.step === "discover" && this.selectedDeviceId !== null && r.devices.length === this.setupDeviceIds.size && r.devices.some((n) => n.entry_id === this.selectedDeviceId) && r.devices.every((n) => this.setupDeviceIds.has(n.entry_id));
      this.setup = r, this.setupDeviceIds = new Set(r.devices.map((n) => n.entry_id)), r.devices.length && !o ? (this.selectDevice(this.firstDeviceId(r.devices)), this.navigate("discover"), this.announcement = "CircuitSetup energy meter discovered.") : r.devices.length || (this.announcement = "No compatible meter found. Check the network and rescan.");
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
    this.ownsOperation(i, t, e) && (this.clearSubscription("transaction"), this.transaction = null, this.showInventory(o), this.drafts = new Map(Array.from(this.drafts, ([n, a]) => [n, r.get(n) ?? a])), this.announcement = "Live CT data reloaded. Review the preserved changes again.");
  }
  updateDraft(t, e) {
    const i = this.drafts.get(t);
    i && (this.drafts = new Map(this.drafts).set(t, { ...i, ...e }), this.requestUpdate());
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    const t = fe(this.inventory, this.drafts);
    if (!t.length) return this.fail(new Error(), "Select at least one CT change before review.");
    const e = this.api, i = this.selectedDeviceId, r = this.inventory, o = ++this.operationGeneration;
    if (this.clearSubscription("transaction"), this.transaction = null, this.labelOnly) {
      const n = t.filter((a) => a.name !== this.inventory.channels.find((l) => l.channel === a.channel)?.name).map(({ channel: a, name: l }) => ({ channel: a, name: l }));
      if (!n.length || t.some((a) => {
        const l = this.inventory.channels.find((c) => c.channel === a.channel);
        return !l || a.model_id !== (l.selected_model_id ?? "") || (a.reporting_multiplier ?? 1) !== l.reporting_multiplier;
      }))
        return this.fail(new Error(), "Home Assistant label mode only permits display-name edits.");
      await this.run(
        async () => {
          await e.setHaLabels(i, r.plan_id, r.source_sha256, n), this.announcement = "Home Assistant labels saved.";
        },
        "Home Assistant labels could not be saved.",
        () => this.ownsOperation(o, e, i)
      );
      return;
    }
    await this.run(
      async () => {
        let n;
        try {
          const a = await e.getCtInventory(i);
          if (!this.ownsOperation(o, e, i)) return;
          n = await e.previewCtConfig(
            i,
            a.plan_id,
            a.source_sha256,
            t
          );
        } catch (a) {
          if (a.code !== "stale_confirmation") throw a;
          await this.recoverCtInventory(e, i, o, this.drafts);
          return;
        }
        this.ownsOperation(o, e, i) && (this.transaction = n, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "The configuration preview is stale. Reload the CT inventory and review again.",
      () => this.ownsOperation(o, e, i)
    );
  }
  async subscribeTransaction(t) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const e = this.api;
    this.clearSubscription("transaction");
    const i = this.transactionSubscriptionScope, r = this.selectedDeviceId, o = this.transaction.transaction_id, n = this.transaction.source_sha256;
    await this.ownSubscription(
      e.subscribeConfigTransaction(
        r,
        o,
        n,
        (a) => {
          this.owns(t, e) && i === this.transactionSubscriptionScope && this.selectedDeviceId === r && this.transaction?.transaction_id === o && this.transaction.source_sha256 === n && a.transaction_id === o && a.source_sha256 === n && (this.transaction = a, this.requestUpdate());
        }
      ),
      t,
      e,
      () => i === this.transactionSubscriptionScope && this.selectedDeviceId === r && this.transaction?.transaction_id === o && this.transaction.source_sha256 === n,
      (a) => {
        this.transactionUnsub = a;
      }
    );
  }
  async continueFromCt() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || this.pendingAction) return;
    const t = fe(this.inventory, this.drafts);
    if (this.labelOnly && t.length) {
      const e = t.map(({ channel: a, name: l }) => ({ channel: a, name: l })), i = this.api, r = this.selectedDeviceId, o = this.inventory, n = ++this.operationGeneration;
      if (this.pendingAction = "session", this.requestUpdate(), await this.run(async () => {
        await i.setHaLabels(r, o.plan_id, o.source_sha256, e), this.ownsOperation(n, i, r) && (this.inventory = { ...o, channels: o.channels.map((a) => {
          const l = e.find((c) => c.channel === a.channel);
          return l ? { ...a, name: l.name } : a;
        }) }, this.announcement = "Home Assistant labels saved.");
      }, "Home Assistant labels could not be saved.", () => this.ownsOperation(n, i, r)), this.pendingAction = "", this.error) return;
    }
    await this.startSession();
  }
  async reviewCalibrationHandoff() {
    if (!this.api || !this.session || !this.restartResult?.source_handoff_available) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, r = this.restartResult.verification_id, o = ++this.operationGeneration;
    this.clearSubscription("transaction"), this.transaction = null, await this.run(
      async () => {
        const n = this.inventory && !this.labelOnly ? fe(this.inventory, this.drafts) : [], a = await t.previewCalibratedGains(i, r, n);
        !this.ownsOperation(o, t, e) || this.session?.session_id !== i || this.restartResult?.verification_id !== r || (this.calibrationHandoff = !0, this.transaction = a, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
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
        const n = await e.clearCalibrationFlash(
          r,
          t.verification_id,
          t.source_handoff_transaction_id,
          this.topology
        );
        !this.ownsOperation(o, e, i) || this.session?.session_id !== r || (this.restartResult = n, this.announcement = "Calibration saved to YAML; flash values cleared.", this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash."));
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
        const n = [i, r.transaction_id, r.source_sha256];
        let a;
        try {
          a = t === "apply" ? await e.applyCtConfig(...n) : t === "compile" ? await e.compileCtConfig(...n) : t === "install" ? await e.installCtConfig(...n) : await e.rollbackCtConfig(...n);
        } catch (l) {
          if (l.code !== "stale_confirmation") throw l;
          await this.recoverCtInventory(e, i, o, this.drafts);
          return;
        }
        if (!(!this.ownsOperation(o, e, i) || this.transaction?.transaction_id !== r.transaction_id || this.transaction.source_sha256 !== r.source_sha256))
          if (this.transaction = a, this.announcement = `Configuration ${this.transaction.state}.`, t === "install" && this.calibrationHandoff && a.state === "verified" && this.session && this.topology && this.restartResult) {
            this.restartResult = {
              ...this.restartResult,
              source_handoff_available: !1,
              source_handoff_transaction_id: a.transaction_id,
              source_handoff_firmware_installed: !0
            }, this.navigate("summary");
            const l = await e.clearCalibrationFlash(
              this.session.session_id,
              this.restartResult.verification_id,
              a.transaction_id,
              this.topology
            );
            if (!this.ownsOperation(o, e, i)) return;
            this.restartResult = l, this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash.");
          } else t === "install" && a.state === "verified" && this.finishFlow("Configuration changes were installed and verified.");
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
            this.navigate(this.session.state === "safety_required" || this.session.state === "preflight_failed" ? "safety" : this.session.state === "applied_pending_restart_verification" ? "restart" : this.session.state === "verified" && this.restartResult ? "summary" : ["completed", "skipped"].includes(this.session.offset_disposition ?? "") ? "voltage" : "offset"), await this.subscribeSession(this.connectionGeneration);
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
      e.subscribeSession(r, (n) => {
        this.owns(t, e) && i === this.sessionSubscriptionScope && this.session?.session_id === r && this.session.device_id === o && n.session_id === r && n.device_id === o && (this.session = n, this.requestUpdate());
      }),
      t,
      e,
      () => i === this.sessionSubscriptionScope && this.session?.session_id === r && this.session.device_id === o,
      (n) => {
        this.sessionUnsub = n;
      }
    );
  }
  async acknowledgeSafety() {
    if (!this.api || !this.session || this.pendingAction) return;
    this.pendingAction = "safety", this.requestUpdate();
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, r = ++this.operationGeneration;
    await this.run(async () => {
      const o = await t.acknowledgeSafety(i);
      !this.ownsOperation(r, t, e) || o.session_id !== i || (this.session = o, this.navigate("offset"));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(r, t, e)), this.pendingAction = "", this.requestUpdate();
  }
  offsetKey(t = this.board, e = this.offsetStage) {
    return `${t}:${e}`;
  }
  async checkOffsetReadiness() {
    if (!this.api || !this.session || this.offsetBusy || !this.offsetAcknowledged[this.offsetStage - 1]) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, r = this.board, o = this.offsetStage, n = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const a = await t.checkOffsetReadiness(i, r, o);
          !this.ownsOperation(n, t, e) || this.session?.session_id !== i || (this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget).set(this.offsetKey(r, o), a), this.announcement = a.ready ? `Board ${r + 1} Stage ${o} measured readiness passed.` : `Board ${r + 1} Stage ${o} measured readiness did not pass.`);
        },
        "Measured offset readiness could not be collected. Reconnect and inspect the meter.",
        () => this.ownsOperation(n, t, e)
      );
    } finally {
      this.offsetBusy = !1, this.requestUpdate();
    }
  }
  async calibrateOffset() {
    if (!this.api || !this.session || this.offsetBusy) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, r = this.board, o = this.offsetStage, n = this.offsetKey(r, o), a = this.offsetResultByTarget.get(n), l = this.session.offset_boards?.[r]?.stages[o - 1]?.state, c = !!a?.retry_allowed || l === "partial" || l === "indeterminate";
    if (this.offsetAcknowledged[o - 1] !== !0 || c && !this.offsetRetryConfirmed) return;
    const d = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const h = await t.calibrateOffset(i, r, o, !0, c);
          if (!this.ownsOperation(d, t, e) || this.session?.session_id !== i) return;
          this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(n, h);
          const A = (this.session.offset_boards ?? []).map((u) => u.board_index !== r ? u : {
            ...u,
            stages: u.stages.map((f) => f.stage !== o ? f : {
              ...f,
              state: h.state === "applied_pending_restart_verification" ? "completed" : h.state
            })
          }), p = A.flatMap((u) => u.stages.map((f) => f.state)), _ = p.every((u) => u === "completed") ? "completed" : p.some((u) => u === "partial" || u === "indeterminate") ? "partial" : "in_progress";
          this.session = {
            ...this.session,
            offset_boards: A,
            offset_disposition: _,
            has_pending_calibration: this.session.has_pending_calibration || h.expected_tables.length > 0
          }, this.offsetAcknowledged = this.offsetAcknowledged.map((u, f) => f === o - 1 ? !1 : u), this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget), this.offsetReadinessByTarget.delete(n), this.offsetRetryConfirmed = !1, this.announcement = h.state === "applied_pending_restart_verification" ? `Board ${r + 1} Stage ${o} saved; restart verification required.` : `Board ${r + 1} Stage ${o} requires recovery before retry.`;
        },
        "Offset calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(d, t, e)
      );
    } finally {
      this.offsetBusy = !1, this.requestUpdate();
    }
  }
  async skipOffset() {
    if (!this.api || !this.session || this.offsetBusy) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, r = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(async () => {
        const o = await t.skipOffsetCalibration(i);
        !this.ownsOperation(r, t, e) || this.session?.session_id !== i || (this.session = o, this.announcement = "Offset calibration skipped; existing flash values were preserved.");
      }, "Offset calibration could not be skipped.", () => this.ownsOperation(r, t, e));
    } finally {
      this.offsetBusy = !1, this.requestUpdate();
    }
  }
  async finishCurrent() {
    if (!this.session || this.finishBusy) return;
    if (this.session.has_pending_calibration) {
      this.navigate("restart");
      return;
    }
    if (this.inventory && !this.labelOnly && fe(this.inventory, this.drafts).length) {
      await this.finishWithoutCalibration();
      return;
    }
    if (!this.api) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, r = ++this.operationGeneration;
    this.finishBusy = !0, this.requestUpdate();
    try {
      await this.run(async () => {
        const o = await t.completeCalibrationWithoutChanges(i);
        if (!(!this.ownsOperation(r, t, e) || this.session?.session_id !== i)) {
          if (o.session_id !== i || o.state !== "verified" || o.has_pending_calibration !== !1)
            throw new Error("No-change completion response is not authoritative");
          this.session = o, this.completedWithoutChanges = !0, this.navigate("summary"), this.announcement = "Completed without calibration changes; no restart was required.";
        }
      }, "Calibration completion could not be confirmed.", () => this.ownsOperation(r, t, e));
    } finally {
      this.finishBusy = !1, this.requestUpdate();
    }
  }
  async checkStability(t) {
    if (!this.api || !this.session || t === "voltage" && this.voltageBusy) return;
    const e = this.api, i = this.selectedDeviceId, r = this.session.session_id, o = ++this.operationGeneration, n = t === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((a) => String(a.channel));
    if (n.length) {
      t === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
      try {
        await this.run(async () => {
          if (t === "voltage") {
            const a = await e.checkVoltageStability(r, n);
            if (!this.ownsOperation(o, e, i) || this.session?.session_id !== r) return;
            const l = new Map(this.stabilityByTarget);
            a.forEach((c) => l.set(`voltage:${c.target_id}`, c)), this.stabilityByTarget = l, this.announcement = "Loaded voltage data from both chips on this board.";
            return;
          }
          for (const [a, l] of n.entries()) {
            const c = await e.checkStability(r, t, l);
            if (!this.ownsOperation(o, e, i) || this.session?.session_id !== r) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${t}:${l}`, c), a < n.length - 1 && this.requestUpdate();
          }
        }, "Stable samples could not be collected.", () => this.ownsOperation(o, e, i));
      } finally {
        t === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
      }
    }
  }
  async calibrate(t) {
    if (!this.api || !this.session || t === "voltage" && this.voltageBusy) return;
    const e = this.api, i = this.selectedDeviceId, r = this.session.session_id, o = ++this.operationGeneration, n = t === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((l) => String(l.channel)), a = this.currentReferenceEntries();
    if (t === "current" && !a.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      return;
    }
    t === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
    try {
      await this.run(
        async () => {
          if (t === "voltage") {
            const d = await e.calibrateVoltage(r, n.map((A, p) => ({
              group_key: A,
              reference: this.voltageReferences[this.topology?.voltage_layout === "two_voltages" ? p : 0]
            })), !0);
            if (!this.ownsOperation(o, e, i) || this.session?.session_id !== r) return;
            const h = new Map(this.calibrationByTarget);
            d.forEach((A) => h.set(`voltage:${A.group_key}`, A)), this.calibrationByTarget = h, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = "Calibrated both voltage chips on this board.";
            return;
          }
          const l = await e.calibrateCurrent(
            r,
            a,
            !0,
            this.inventory && !this.labelOnly ? fe(this.inventory, this.drafts).map((d) => ({
              channel: d.channel,
              reporting_multiplier: d.reporting_multiplier ?? 1
            })) : []
          );
          if (!this.ownsOperation(o, e, i) || this.session?.session_id !== r) return;
          const c = new Map(this.calibrationByTarget);
          a.forEach((d) => c.set(`current:${d.channel}`, l)), this.calibrationByTarget = c, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = `Calibration iteration ${l.iteration} finished with state ${l.state}.`;
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
        let a;
        try {
          a = await t.restartAndVerify(i, r);
        } catch (l) {
          throw this.ownsOperation(o, t, e) && this.session?.session_id === i && this.topology === r && (this.restartResult = null, this.session = { ...this.session, state: "restart_failed" }), l;
        }
        !this.ownsOperation(o, t, e) || this.session?.session_id !== i || this.topology !== r || (this.restartResult = a, this.completedWithoutChanges = !1, this.session = { ...this.session, state: "verified" });
      },
      "Restart verification failed; review recovery evidence before rollback.",
      () => this.ownsOperation(o, t, e)
    ), this.restartResult?.source_handoff_available && await this.reviewCalibrationHandoff();
  }
  async cancelSession(t = "safety") {
    if (!this.api || !this.session) return;
    const e = this.api, i = this.selectedDeviceId, r = this.session.session_id, o = ++this.operationGeneration;
    await this.run(async () => {
      const n = await e.cancelSession(r);
      !this.ownsOperation(o, e, i) || this.session?.session_id !== r || (this.clearSubscription("session"), this.session = n, this.restartResult = null, t && this.navigate(t), this.announcement = t === "setup" ? "No changes were made. Select another device to configure." : t === "ct" ? "Calibration session closed. Review CT names and types before continuing." : "Calibration session cancelled; cleanup completed without restart verification.");
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(o, e, i));
  }
  async finishWithoutCalibration() {
    if (this.pendingAction) return;
    this.pendingAction = "finish", this.requestUpdate();
    const t = this.inventory && !this.labelOnly ? fe(this.inventory, this.drafts) : [];
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
    const e = this.currentReferenceEntries().map((o) => String(o.channel)), i = Math.floor((this.channel - 1) / 3) * 3 + 1, r = t === "voltage" ? this.voltageGroupKeys() : e.length ? e : Array.from({ length: 3 }, (o, n) => String(i + n));
    for (const o of [...r].reverse()) {
      const n = this.calibrationByTarget.get(`${t}:${o}`);
      if (n) return n;
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
    return this.step === "setup" ? go(
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
      this.pendingAction,
      !1,
      this.firmwareCatalog()
    ) : this.step === "discover" ? go(
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
    ) : this.step === "topology" && this.topology ? Kd(
      this.topology,
      this.selectedProjectVersion(),
      () => this.back(),
      () => {
        this.setup?.devices.find((t) => t.entry_id === this.selectedDeviceId)?.configuration ? this.loadInventory() : this.startSession();
      },
      this.error === "Topology mismatch",
      this.pendingAction === "inventory" || this.pendingAction === "session"
    ) : this.step === "ct" && this.inventory ? y`<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
      this.labelOnly = !1, this.requestUpdate();
    }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
      this.labelOnly = !0, this.requestUpdate();
    }}>Home Assistant labels only</label></fieldset>${Ed(
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
    )}` : this.step === "build" ? vd(
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
    ) : this.step === "safety" ? Ld(
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
    ) : this.step === "offset" ? Hd(
      this.topology,
      this.session,
      this.board,
      this.offsetStage,
      this.offsetAcknowledged[this.offsetStage - 1] ?? !1,
      this.offsetRetryConfirmed,
      this.offsetReadinessByTarget.get(this.offsetKey()) ?? null,
      this.offsetResultByTarget.get(this.offsetKey()) ?? null,
      this.offsetBusy,
      (t) => {
        this.board = t, this.offsetRetryConfirmed = !1, this.requestUpdate();
      },
      (t) => {
        (t === 1 || this.session?.offset_boards?.every((e) => e.stages[0]?.state === "completed")) && (this.offsetStage = t, this.board = 0, this.offsetRetryConfirmed = !1, this.requestUpdate());
      },
      (t) => {
        this.offsetAcknowledged = this.offsetAcknowledged.map((e, i) => i === this.offsetStage - 1 ? t : e), this.requestUpdate();
      },
      (t) => {
        this.offsetRetryConfirmed = t, this.requestUpdate();
      },
      () => {
        this.checkOffsetReadiness();
      },
      () => {
        this.calibrateOffset();
      },
      () => {
        this.reconnectSession();
      },
      () => {
        this.skipOffset();
      },
      () => this.back(),
      () => this.navigate("voltage")
    ) : this.step === "voltage" ? y`${zd(
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" ?disabled=${this.voltageBusy} @click=${() => this.navigate("current")}>${this.resultFor("voltage") ? "Continue" : "Skip voltage calibration"}</button></footer>` : this.step === "current" ? y`${yd(
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" ?disabled=${this.finishBusy} @click=${() => {
      this.finishCurrent();
    }}>${this.finishBusy ? "Finishing…" : this.session?.has_pending_calibration ? "Continue to Restart" : "Finish without calibration"}</button></footer>` : this.step === "restart" ? $d(
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
    ) : this.step === "summary" ? Nd(
      this.topology,
      this.session,
      this.transaction,
      this.stabilityByTarget,
      this.calibrationByTarget,
      this.restartResult,
      this.completedWithoutChanges,
      this.selectedProjectVersion(),
      () => {
        this.restartResult?.source_handoff_firmware_installed ? this.clearCalibrationHandoff() : this.reviewCalibrationHandoff();
      },
      () => this.back()
    ) : y`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct" ? "CT settings are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }
  firmwareCatalog() {
    const t = this.firmwareCatalogState === "loading";
    return y`<section class="step-content" aria-labelledby="firmware-heading">
      <h2 id="firmware-heading">Install firmware</h2>
      <label>ESPHome firmware version
        <select data-action="firmware-version" ?disabled=${t || this.firmwareCatalogState !== "ready" || !this.resolvedFirmwareOptions.length}
          @change=${(e) => this.selectFirmwareVersion(e.target.value)}>
          ${this.resolvedFirmwareOptions.map((e, i) => y`<option value=${e.version} ?selected=${e.version === this.selectedEspHomeVersion}>${e.version}${i === 0 ? " (newest)" : ""}</option>`)}
        </select>
      </label>
      ${this.firmwareCatalogState === "error" ? y`<div class="error-panel" role="status">
        <strong>${this.firmwareCatalogError}</strong>
        <button class="secondary" data-action="firmware-retry" @click=${() => this.retryFirmwareIndex()}>Retry</button>
      </div>` : O}
      ${t ? y`<p role="status">Loading firmware versions…</p>` : O}
      ${this.firmwareCatalogState === "ready" && !this.resolvedFirmwareOptions.length ? y`<p role="status">No firmware version is available for this hardware.</p>` : O}
      ${this.firmwareCatalogState === "ready" ? Ud(this.selectedFirmware()) : O}
    </section>`;
  }
  render() {
    const t = Oe.findIndex(([e]) => e === this.step);
    return y`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${Oe.map(([e, i], r) => y`
            <li class=${r === t ? "current" : ""}>
              <button class="step-button" aria-current=${r === t ? "step" : O}
                ?disabled=${r > t || r < t && e !== "setup"}
                @click=${() => e === "setup" && r < t ? this.returnToSetup() : void 0}><span class="number">${r + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${t + 1} of ${Oe.length} — ${Oe[t]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${Oe[t]?.[1]}</h1>
          ${this.error ? y`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : O}
          ${this.stepBody()}
          ${t >= 4 && this.step !== "summary" ? ea(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : O}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", jd);
function g(s, t, e, i) {
  var r, o = arguments.length, n = o < 3 ? t : i === null ? i = Object.getOwnPropertyDescriptor(t, e) : i;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") n = Reflect.decorate(s, t, e, i);
  else for (var a = s.length - 1; a >= 0; a--) (r = s[a]) && (n = (o < 3 ? r(n) : o > 3 ? r(t, e, n) : r(t, e)) || n);
  return o > 3 && n && Object.defineProperty(t, e, n), n;
}
const Gi = globalThis, Ir = Gi.ShadowRoot && (Gi.ShadyCSS === void 0 || Gi.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, xr = /* @__PURE__ */ Symbol(), uo = /* @__PURE__ */ new WeakMap();
let sa = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== xr) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (Ir && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = uo.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && uo.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const z = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce(((i, r, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[o + 1]), s[0]);
  return new sa(e, s, xr);
}, fo = Ir ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return ((i) => new sa(typeof i == "string" ? i : i + "", void 0, xr))(e);
})(s) : s, { is: Wd, defineProperty: Vd, getOwnPropertyDescriptor: qd, getOwnPropertyNames: Zd, getOwnPropertySymbols: Xd, getPrototypeOf: th } = Object, xe = globalThis, mo = xe.trustedTypes, eh = mo ? mo.emptyScript : "", _o = xe.reactiveElementPolyfillSupport, Je = (s, t) => s, Wi = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? eh : null;
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
} }, Sr = (s, t) => !Wd(s, t), vo = { attribute: !0, type: String, converter: Wi, reflect: !1, useDefault: !1, hasChanged: Sr };
Symbol.metadata ?? (Symbol.metadata = /* @__PURE__ */ Symbol("metadata")), xe.litPropertyMetadata ?? (xe.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let Ee = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = vo) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && Vd(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: o } = qd(this.prototype, t) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: r, set(n) {
      const a = r?.call(this);
      o?.call(this, n), this.requestUpdate(t, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? vo;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Je("elementProperties"))) return;
    const t = th(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Je("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Je("properties"))) {
      const e = this.properties, i = [...Zd(e), ...Xd(e)];
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
      for (const r of i) e.unshift(fo(r));
    } else t !== void 0 && e.push(fo(t));
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
      if (Ir) e.adoptedStyleSheets = i.map(((r) => r instanceof CSSStyleSheet ? r : r.styleSheet));
      else for (const r of i) {
        const o = document.createElement("style"), n = Gi.litNonce;
        n !== void 0 && o.setAttribute("nonce", n), o.textContent = r.cssText, e.appendChild(o);
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
      const n = (((o = i.converter) === null || o === void 0 ? void 0 : o.toAttribute) !== void 0 ? i.converter : Wi).toAttribute(e, i.type);
      this._$Em = t, n == null ? this.removeAttribute(r) : this.setAttribute(r, n), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      var o, n;
      const a = i.getPropertyOptions(r), l = typeof a.converter == "function" ? { fromAttribute: a.converter } : ((o = a.converter) === null || o === void 0 ? void 0 : o.fromAttribute) !== void 0 ? a.converter : Wi;
      this._$Em = r, this[r] = l.fromAttribute(e, a.type) ?? ((n = this._$Ej) === null || n === void 0 ? void 0 : n.get(r)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(t, e, i) {
    if (t !== void 0) {
      var r;
      const o = this.constructor, n = this[t];
      if (i ?? (i = o.getPropertyOptions(t)), !((i.hasChanged ?? Sr)(n, e) || i.useDefault && i.reflect && n === ((r = this._$Ej) === null || r === void 0 ? void 0 : r.get(t)) && !this.hasAttribute(o._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: o }, n) {
    i && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, n ?? e ?? this[t]), o !== !0 || n !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
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
        for (const [o, n] of this._$Ep) this[o] = n;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [o, n] of r) {
        const { wrapped: a } = n, l = this[o];
        a !== !0 || this._$AL.has(o) || l === void 0 || this.C(o, void 0, n, l);
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
Ee.elementStyles = [], Ee.shadowRootOptions = { mode: "open" }, Ee[Je("elementProperties")] = /* @__PURE__ */ new Map(), Ee[Je("finalized")] = /* @__PURE__ */ new Map(), _o?.({ ReactiveElement: Ee }), (xe.reactiveElementVersions ?? (xe.reactiveElementVersions = [])).push("2.1.0");
const Vi = globalThis, qi = Vi.trustedTypes, Eo = qi ? qi.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, ra = "$lit$", Jt = `lit$${Math.random().toFixed(9).slice(2)}$`, oa = "?" + Jt, ih = `<${oa}>`, Ae = document, ni = () => Ae.createComment(""), ai = (s) => s === null || typeof s != "object" && typeof s != "function", sr = Array.isArray, ws = `[\x20\t
\f\r]`, Pe = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, wo = /-->/g, bo = />/g, se = RegExp(`>|${ws}(?:([^\\s"'>=/]+)(${ws}*=${ws}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), yo = /'/g, Co = /"/g, na = /^(?:script|style|textarea|title)$/i, aa = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), B = aa(1), ht = aa(2), Et = /* @__PURE__ */ Symbol.for("lit-noChange"), I = /* @__PURE__ */ Symbol.for("lit-nothing"), Bo = /* @__PURE__ */ new WeakMap(), ae = Ae.createTreeWalker(Ae, 129);
function la(s, t) {
  if (!sr(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Eo !== void 0 ? Eo.createHTML(t) : t;
}
const sh = (s, t) => {
  const e = s.length - 1, i = [];
  let r, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", n = Pe;
  for (let a = 0; a < e; a++) {
    const l = s[a];
    let c, d, h = -1, A = 0;
    for (; A < l.length && (n.lastIndex = A, d = n.exec(l), d !== null); ) A = n.lastIndex, n === Pe ? d[1] === "!--" ? n = wo : d[1] !== void 0 ? n = bo : d[2] !== void 0 ? (na.test(d[2]) && (r = RegExp("</" + d[2], "g")), n = se) : d[3] !== void 0 && (n = se) : n === se ? d[0] === ">" ? (n = r ?? Pe, h = -1) : d[1] === void 0 ? h = -2 : (h = n.lastIndex - d[2].length, c = d[1], n = d[3] === void 0 ? se : d[3] === '"' ? Co : yo) : n === Co || n === yo ? n = se : n === wo || n === bo ? n = Pe : (n = se, r = void 0);
    const p = n === se && s[a + 1].startsWith("/>") ? " " : "";
    o += n === Pe ? l + ih : h >= 0 ? (i.push(c), l.slice(0, h) + ra + l.slice(h) + Jt + p) : l + Jt + (h === -2 ? a : p);
  }
  return [la(s, o + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
let rr = class ca {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let o = 0, n = 0;
    const a = t.length - 1, l = this.parts, [c, d] = sh(t, e);
    if (this.el = ca.createElement(c, i), ae.currentNode = this.el.content, e === 2 || e === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (r = ae.nextNode()) !== null && l.length < a; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const h of r.getAttributeNames()) if (h.endsWith(ra)) {
          const A = d[n++], p = r.getAttribute(h).split(Jt), _ = /([.?@])?(.*)/.exec(A);
          l.push({ type: 1, index: o, name: _[2], strings: p, ctor: _[1] === "." ? oh : _[1] === "?" ? nh : _[1] === "@" ? ah : as }), r.removeAttribute(h);
        } else h.startsWith(Jt) && (l.push({ type: 6, index: o }), r.removeAttribute(h));
        if (na.test(r.tagName)) {
          const h = r.textContent.split(Jt), A = h.length - 1;
          if (A > 0) {
            r.textContent = qi ? qi.emptyScript : "";
            for (let p = 0; p < A; p++) r.append(h[p], ni()), ae.nextNode(), l.push({ type: 2, index: ++o });
            r.append(h[A], ni());
          }
        }
      } else if (r.nodeType === 8) if (r.data === oa) l.push({ type: 2, index: o });
      else {
        let h = -1;
        for (; (h = r.data.indexOf(Jt, h + 1)) !== -1; ) l.push({ type: 7, index: o }), h += Jt.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = Ae.createElement("template");
    return i.innerHTML = t, i;
  }
};
function Se(s, t, e = s, i) {
  var r, o, n, a;
  if (t === Et) return t;
  let l = i !== void 0 ? (r = e._$Co) === null || r === void 0 ? void 0 : r[i] : e._$Cl;
  const c = ai(t) ? void 0 : t._$litDirective$;
  return ((o = l) === null || o === void 0 ? void 0 : o.constructor) !== c && ((n = l) !== null && n !== void 0 && (a = n._$AO) !== null && a !== void 0 && a.call(n, !1), c === void 0 ? l = void 0 : (l = new c(s), l._$AT(s, e, i)), i !== void 0 ? (e._$Co ?? (e._$Co = []))[i] = l : e._$Cl = l), l !== void 0 && (t = Se(s, l._$AS(s, t.values), l, i)), t;
}
let rh = class {
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
    const { el: { content: e }, parts: i } = this._$AD, r = (t?.creationScope ?? Ae).importNode(e, !0);
    ae.currentNode = r;
    let o = ae.nextNode(), n = 0, a = 0, l = i[0];
    for (; l !== void 0; ) {
      var c;
      if (n === l.index) {
        let d;
        l.type === 2 ? d = new Rr(o, o.nextSibling, this, t) : l.type === 1 ? d = new l.ctor(o, l.name, l.strings, this, t) : l.type === 6 && (d = new lh(o, this, t)), this._$AV.push(d), l = i[++a];
      }
      n !== ((c = l) === null || c === void 0 ? void 0 : c.index) && (o = ae.nextNode(), n++);
    }
    return ae.currentNode = Ae, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}, Rr = class da {
  get _$AU() {
    var t;
    return ((t = this._$AM) === null || t === void 0 ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, i, r) {
    this.type = 2, this._$AH = I, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = r?.isConnected ?? !0;
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
    t = Se(this, t, e), ai(t) ? t === I || t == null || t === "" ? (this._$AH !== I && this._$AR(), this._$AH = I) : t !== this._$AH && t !== Et && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : ((i) => sr(i) || typeof i?.[Symbol.iterator] == "function")(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== I && ai(this._$AH) ? this._$AA.nextSibling.data = t : this.T(Ae.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var e;
    const { values: i, _$litType$: r } = t, o = typeof r == "number" ? this._$AC(t) : (r.el === void 0 && (r.el = rr.createElement(la(r.h, r.h[0]), this.options)), r);
    if (((e = this._$AH) === null || e === void 0 ? void 0 : e._$AD) === o) this._$AH.p(i);
    else {
      const n = new rh(o, this), a = n.u(this.options);
      n.p(i), this.T(a), this._$AH = n;
    }
  }
  _$AC(t) {
    let e = Bo.get(t.strings);
    return e === void 0 && Bo.set(t.strings, e = new rr(t)), e;
  }
  k(t) {
    sr(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const o of t) r === e.length ? e.push(i = new da(this.O(ni()), this.O(ni()), this, this.options)) : i = e[r], i._$AI(o), r++;
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
}, as = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, r, o) {
    this.type = 1, this._$AH = I, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = I;
  }
  _$AI(t, e = this, i, r) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) t = Se(this, t, e, 0), n = !ai(t) || t !== this._$AH && t !== Et, n && (this._$AH = t);
    else {
      const a = t;
      let l, c;
      for (t = o[0], l = 0; l < o.length - 1; l++) c = Se(this, a[i + l], e, l), c === Et && (c = this._$AH[l]), n || (n = !ai(c) || c !== this._$AH[l]), c === I ? t = I : t !== I && (t += (c ?? "") + o[l + 1]), this._$AH[l] = c;
    }
    n && !r && this.j(t);
  }
  j(t) {
    t === I ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}, oh = class extends as {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === I ? void 0 : t;
  }
}, nh = class extends as {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== I);
  }
}, ah = class extends as {
  constructor(t, e, i, r, o) {
    super(t, e, i, r, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = Se(this, t, e, 0) ?? I) === Et) return;
    const i = this._$AH, r = t === I && i !== I || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== I && (i === I || r);
    r && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) === null || e === void 0 ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}, lh = class {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    Se(this, t);
  }
};
const Io = Vi.litHtmlPolyfillSupport;
Io?.(rr, Rr), (Vi.litHtmlVersions ?? (Vi.litHtmlVersions = [])).push("3.3.0");
const Dr = (s, t, e) => {
  const i = e?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = r = new Rr(t.insertBefore(ni(), o), o, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
var bs;
const li = globalThis;
let Y = class extends Ee {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Dr(e, this.renderRoot, this.renderOptions);
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
    return Et;
  }
};
Y._$litElement$ = !0, Y.finalized = !0, (bs = li.litElementHydrateSupport) === null || bs === void 0 || bs.call(li, { LitElement: Y });
const xo = li.litElementPolyfillSupport;
xo?.({ LitElement: Y }), (li.litElementVersions ?? (li.litElementVersions = [])).push("4.2.0");
const Xt = (s) => (t, e) => {
  e !== void 0 ? e.addInitializer((() => {
    customElements.define(s, t);
  })) : customElements.define(s, t);
}, ch = { attribute: !0, type: String, converter: Wi, reflect: !1, hasChanged: Sr }, dh = (s = ch, t, e) => {
  const { kind: i, metadata: r } = e;
  let o = globalThis.litPropertyMetadata.get(r);
  if (o === void 0 && globalThis.litPropertyMetadata.set(r, o = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), o.set(e.name, s), i === "accessor") {
    const { name: n } = e;
    return { set(a) {
      const l = t.get.call(this);
      t.set.call(this, a), this.requestUpdate(n, l, s);
    }, init(a) {
      return a !== void 0 && this.C(n, void 0, s, a), a;
    } };
  }
  if (i === "setter") {
    const { name: n } = e;
    return function(a) {
      const l = this[n];
      t.call(this, a), this.requestUpdate(n, l, s);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function v(s) {
  return (t, e) => typeof e == "object" ? dh(s, t, e) : ((i, r, o) => {
    const n = r.hasOwnProperty(o);
    return r.constructor.createProperty(o, i), n ? Object.getOwnPropertyDescriptor(r, o) : void 0;
  })(s, t, e);
}
function $(s) {
  return v({ ...s, state: !0, attribute: !1 });
}
const ls = (s, t, e) => (e.configurable = !0, e.enumerable = !0, Reflect.decorate && typeof t != "object" && Object.defineProperty(s, t, e), e);
function j(s, t) {
  return (e, i, r) => ls(e, i, { get() {
    return ((o) => {
      var n;
      return ((n = o.renderRoot) === null || n === void 0 ? void 0 : n.querySelector(s)) ?? null;
    })(this);
  } });
}
function Ht(s) {
  return (t, e) => {
    const { slot: i, selector: r } = s ?? {}, o = "slot" + (i ? `[name=${i}]` : ":not([name])");
    return ls(t, e, { get() {
      var n;
      const a = (n = this.renderRoot) === null || n === void 0 ? void 0 : n.querySelector(o), l = a?.assignedElements(s) ?? [];
      return r === void 0 ? l : l.filter(((c) => c.matches(r)));
    } });
  };
}
const hh = z`:host{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end);box-sizing:border-box;cursor:pointer;display:inline-flex;gap:8px;min-height:var(--_container-height);outline:none;padding-block:calc((var(--_container-height) - max(var(--_label-text-line-height),var(--_icon-size)))/2);padding-inline-start:var(--_leading-space);padding-inline-end:var(--_trailing-space);place-content:center;place-items:center;position:relative;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);text-overflow:ellipsis;text-wrap:nowrap;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);vertical-align:top;--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){cursor:default;pointer-events:none}.button{border-radius:inherit;cursor:inherit;display:inline-flex;align-items:center;justify-content:center;border:none;outline:none;-webkit-appearance:none;vertical-align:middle;background:rgba(0,0,0,0);text-decoration:none;min-width:calc(64px - var(--_leading-space) - var(--_trailing-space));width:100%;z-index:0;height:100%;font:inherit;color:var(--_label-text-color);padding:0;gap:inherit;text-transform:inherit}.button::-moz-focus-inner{padding:0;border:0}:host(:hover) .button{color:var(--_hover-label-text-color)}:host(:focus-within) .button{color:var(--_focus-label-text-color)}:host(:active) .button{color:var(--_pressed-label-text-color)}.background{background:var(--_container-color);border-radius:inherit;inset:0;position:absolute}.label{overflow:hidden}:is(.button,.label,.label slot),.label ::slotted(*){text-overflow:inherit}:host(:is([disabled],[soft-disabled])) .label{color:var(--_disabled-label-text-color);opacity:var(--_disabled-label-text-opacity)}:host(:is([disabled],[soft-disabled])) .background{background:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}@media(forced-colors: active){.background{border:1px solid CanvasText}:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1;--_disabled-container-opacity: 1;--_disabled-label-text-color: GrayText;--_disabled-label-text-opacity: 1}}:host([has-icon]:not([trailing-icon])){padding-inline-start:var(--_with-leading-icon-leading-space);padding-inline-end:var(--_with-leading-icon-trailing-space)}:host([has-icon][trailing-icon]){padding-inline-start:var(--_with-trailing-icon-leading-space);padding-inline-end:var(--_with-trailing-icon-trailing-space)}::slotted([slot=icon]){display:inline-flex;position:relative;writing-mode:horizontal-tb;fill:currentColor;flex-shrink:0;color:var(--_icon-color);font-size:var(--_icon-size);inline-size:var(--_icon-size);block-size:var(--_icon-size)}:host(:hover) ::slotted([slot=icon]){color:var(--_hover-icon-color)}:host(:focus-within) ::slotted([slot=icon]){color:var(--_focus-icon-color)}:host(:active) ::slotted([slot=icon]){color:var(--_pressed-icon-color)}:host(:is([disabled],[soft-disabled])) ::slotted([slot=icon]){color:var(--_disabled-icon-color);opacity:var(--_disabled-icon-opacity)}.touch{position:absolute;top:50%;height:48px;left:0;right:0;transform:translateY(-50%)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) 0}:host([touch-target=none]) .touch{display:none}
`, ha = /* @__PURE__ */ Symbol("attachableController");
let Aa;
Aa = new MutationObserver(((s) => {
  for (const e of s) {
    var t;
    (t = e.target[ha]) === null || t === void 0 || t.hostConnected();
  }
}));
let pa = class {
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
    this.host = t, this.onControlChange = e, this.currentControl = null, t.addController(this), t[ha] = this, (i = Aa) === null || i === void 0 || i.observe(t, { attributeFilter: ["for"] });
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
const Ah = ["focusin", "focusout", "pointerdown"];
let or = class extends Y {
  constructor() {
    super(...arguments), this.visible = !1, this.inward = !1, this.attachableController = new pa(this, this.onControlChange.bind(this));
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
    if (!t[So]) {
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
      t[So] = !0;
    }
  }
  onControlChange(t, e) {
    for (const i of Ah) t?.removeEventListener(i, this), e?.addEventListener(i, this);
  }
  update(t) {
    t.has("visible") && this.dispatchEvent(new Event("visibility-changed")), super.update(t);
  }
};
g([v({ type: Boolean, reflect: !0 })], or.prototype, "visible", void 0), g([v({ type: Boolean, reflect: !0 })], or.prototype, "inward", void 0);
const So = /* @__PURE__ */ Symbol("handledByFocusRing"), ph = z`:host{animation-delay:0s,calc(var(--md-focus-ring-duration, 600ms)*.25);animation-duration:calc(var(--md-focus-ring-duration, 600ms)*.25),calc(var(--md-focus-ring-duration, 600ms)*.75);animation-timing-function:cubic-bezier(0.2, 0, 0, 1);box-sizing:border-box;color:var(--md-focus-ring-color, var(--md-sys-color-secondary, #625b71));display:none;pointer-events:none;position:absolute}:host([visible]){display:flex}:host(:not([inward])){animation-name:outward-grow,outward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));inset:calc(-1*var(--md-focus-ring-outward-offset, 2px));outline:var(--md-focus-ring-width, 3px) solid currentColor}:host([inward]){animation-name:inward-grow,inward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border:var(--md-focus-ring-width, 3px) solid currentColor;inset:var(--md-focus-ring-inward-offset, 0px)}@keyframes outward-grow{from{outline-width:0}to{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes outward-shrink{from{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-grow{from{border-width:0}to{border-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-shrink{from{border-width:var(--md-focus-ring-active-width, 8px)}}@media(prefers-reduced-motion){:host{animation:none}}
`;
let ys = class extends or {
};
ys.styles = [ph], ys = g([Xt("md-focus-ring")], ys);
const Kt = { ATTRIBUTE: 1, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4 }, Mr = (s) => (...t) => ({ _$litDirective$: s, values: t });
let Tr = class {
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
const ft = Mr(class extends Tr {
  constructor(s) {
    var t;
    if (super(s), s.type !== Kt.ATTRIBUTE || s.name !== "class" || ((t = s.strings) === null || t === void 0 ? void 0 : t.length) > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
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
      const n = !!t[o];
      n === this.st.has(o) || !((r = this.nt) === null || r === void 0) && r.has(o) || (n ? (i.add(o), this.st.add(o)) : (i.remove(o), this.st.delete(o)));
    }
    return Et;
  }
}), Dt = { STANDARD: "cubic-bezier(0.2, 0, 0, 1)", EMPHASIZED: "cubic-bezier(.3,0,0,1)", EMPHASIZED_ACCELERATE: "cubic-bezier(.3,0,.8,.15)" };
function gh() {
  let s = null;
  return { start() {
    var t;
    return (t = s) === null || t === void 0 || t.abort(), s = new AbortController(), s.signal;
  }, finish() {
    s = null;
  } };
}
var ct;
(function(s) {
  s[s.INACTIVE = 0] = "INACTIVE", s[s.TOUCH_DELAY = 1] = "TOUCH_DELAY", s[s.HOLDING = 2] = "HOLDING", s[s.WAITING_FOR_CLICK = 3] = "WAITING_FOR_CLICK";
})(ct || (ct = {}));
const uh = ["click", "contextmenu", "pointercancel", "pointerdown", "pointerenter", "pointerleave", "pointerup"], Ro = window.matchMedia("(forced-colors: active)");
let Ge = class extends Y {
  constructor() {
    super(...arguments), this.disabled = !1, this.hovered = !1, this.pressed = !1, this.rippleSize = "", this.rippleScale = "", this.initialSize = 0, this.state = ct.INACTIVE, this.attachableController = new pa(this, this.onControlChange.bind(this));
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
    return B`<div class="surface ${ft(t)}"></div>`;
  }
  update(t) {
    t.has("disabled") && this.disabled && (this.hovered = !1, this.pressed = !1), super.update(t);
  }
  handlePointerenter(t) {
    this.shouldReactToEvent(t) && (this.hovered = !0);
  }
  handlePointerleave(t) {
    this.shouldReactToEvent(t) && (this.hovered = !1, this.state !== ct.INACTIVE && this.endPressAnimation());
  }
  handlePointerup(t) {
    if (this.shouldReactToEvent(t)) {
      if (this.state !== ct.HOLDING) return this.state === ct.TOUCH_DELAY ? (this.state = ct.WAITING_FOR_CLICK, void this.startPressAnimation(this.rippleStartEvent)) : void 0;
      this.state = ct.WAITING_FOR_CLICK;
    }
  }
  async handlePointerdown(t) {
    if (this.shouldReactToEvent(t)) {
      if (this.rippleStartEvent = t, !this.isTouch(t)) return this.state = ct.WAITING_FOR_CLICK, void this.startPressAnimation(t);
      this.state = ct.TOUCH_DELAY, await new Promise(((e) => {
        setTimeout(e, 150);
      })), this.state === ct.TOUCH_DELAY && (this.state = ct.HOLDING, this.startPressAnimation(t));
    }
  }
  handleClick() {
    this.disabled || (this.state !== ct.WAITING_FOR_CLICK ? this.state === ct.INACTIVE && (this.startPressAnimation(), this.endPressAnimation()) : this.endPressAnimation());
  }
  handlePointercancel(t) {
    this.shouldReactToEvent(t) && this.endPressAnimation();
  }
  handleContextmenu() {
    this.disabled || this.endPressAnimation();
  }
  determineRippleSize() {
    const { height: t, width: e } = this.getBoundingClientRect(), i = Math.max(t, e), r = Math.max(0.35 * i, 75), o = this.currentCSSZoom ?? 1, n = Math.floor(0.2 * i / o), a = Math.sqrt(e ** 2 + t ** 2) + 10;
    this.initialSize = n;
    const l = (a + r) / n;
    this.rippleScale = "" + l / o, this.rippleSize = `${n}px`;
  }
  getNormalizedPointerEventCoords(t) {
    const { scrollX: e, scrollY: i } = window, { left: r, top: o } = this.getBoundingClientRect(), n = e + r, a = i + o, { pageX: l, pageY: c } = t, d = this.currentCSSZoom ?? 1;
    return { x: (l - n) / d, y: (c - a) / d };
  }
  getTranslationCoordinates(t) {
    const { height: e, width: i } = this.getBoundingClientRect(), r = this.currentCSSZoom ?? 1, o = { x: (i / r - this.initialSize) / 2, y: (e / r - this.initialSize) / 2 };
    let n;
    return n = t instanceof PointerEvent ? this.getNormalizedPointerEventCoords(t) : { x: i / r / 2, y: e / r / 2 }, n = { x: n.x - this.initialSize / 2, y: n.y - this.initialSize / 2 }, { startPoint: n, endPoint: o };
  }
  startPressAnimation(t) {
    var e;
    if (!this.mdRoot) return;
    this.pressed = !0, (e = this.growAnimation) === null || e === void 0 || e.cancel(), this.determineRippleSize();
    const { startPoint: i, endPoint: r } = this.getTranslationCoordinates(t), o = `${i.x}px, ${i.y}px`, n = `${r.x}px, ${r.y}px`;
    this.growAnimation = this.mdRoot.animate({ top: [0, 0], left: [0, 0], height: [this.rippleSize, this.rippleSize], width: [this.rippleSize, this.rippleSize], transform: [`translate(${o}) scale(1)`, `translate(${n}) scale(${this.rippleScale})`] }, { pseudoElement: "::after", duration: 450, easing: Dt.STANDARD, fill: "forwards" });
  }
  async endPressAnimation() {
    this.rippleStartEvent = void 0, this.state = ct.INACTIVE;
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
    if (Ro == null || !Ro.matches) switch (t.type) {
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
    for (const i of uh) t?.removeEventListener(i, this), e?.addEventListener(i, this);
  }
};
g([v({ type: Boolean, reflect: !0 })], Ge.prototype, "disabled", void 0), g([$()], Ge.prototype, "hovered", void 0), g([$()], Ge.prototype, "pressed", void 0), g([j(".surface")], Ge.prototype, "mdRoot", void 0);
const fh = z`:host{display:flex;margin:auto;pointer-events:none}:host([disabled]){display:none}@media(forced-colors: active){:host{display:none}}:host,.surface{border-radius:inherit;position:absolute;inset:0;overflow:hidden}.surface{-webkit-tap-highlight-color:rgba(0,0,0,0)}.surface::before,.surface::after{content:"";opacity:0;position:absolute}.surface::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));inset:0;transition:opacity 15ms linear,background-color 15ms linear}.surface::after{background:radial-gradient(closest-side, var(--md-ripple-pressed-color, var(--md-sys-color-on-surface, #1d1b20)) max(100% - 70px, 65%), transparent 100%);transform-origin:center center;transition:opacity 375ms linear}.hovered::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-ripple-hover-opacity, 0.08)}.pressed::after{opacity:var(--md-ripple-pressed-opacity, 0.12);transition-duration:105ms}
`;
let Cs = class extends Ge {
};
Cs.styles = [fh], Cs = g([Xt("md-ripple")], Cs);
const ga = ["role", "ariaAtomic", "ariaAutoComplete", "ariaBusy", "ariaChecked", "ariaColCount", "ariaColIndex", "ariaColSpan", "ariaCurrent", "ariaDisabled", "ariaExpanded", "ariaHasPopup", "ariaHidden", "ariaInvalid", "ariaKeyShortcuts", "ariaLabel", "ariaLevel", "ariaLive", "ariaModal", "ariaMultiLine", "ariaMultiSelectable", "ariaOrientation", "ariaPlaceholder", "ariaPosInSet", "ariaPressed", "ariaReadOnly", "ariaRequired", "ariaRoleDescription", "ariaRowCount", "ariaRowIndex", "ariaRowSpan", "ariaSelected", "ariaSetSize", "ariaSort", "ariaValueMax", "ariaValueMin", "ariaValueNow", "ariaValueText"], mh = ga.map(ua);
function Bs(s) {
  return mh.includes(s);
}
function ua(s) {
  return s.replace("aria", "aria-").replace(/Elements?/g, "").toLowerCase();
}
const Bi = /* @__PURE__ */ Symbol("privateIgnoreAttributeChangesFor");
function Gt(s) {
  var t;
  class e extends s {
    constructor() {
      super(...arguments), this[t] = /* @__PURE__ */ new Set();
    }
    attributeChangedCallback(r, o, n) {
      if (!Bs(r)) return void super.attributeChangedCallback(r, o, n);
      if (this[Bi].has(r)) return;
      this[Bi].add(r), this.removeAttribute(r), this[Bi].delete(r);
      const a = xs(r);
      n === null ? delete this.dataset[a] : this.dataset[a] = n, this.requestUpdate(xs(r), o);
    }
    getAttribute(r) {
      return Bs(r) ? super.getAttribute(Is(r)) : super.getAttribute(r);
    }
    removeAttribute(r) {
      super.removeAttribute(r), Bs(r) && (super.removeAttribute(Is(r)), this.requestUpdate());
    }
  }
  return t = Bi, (function(i) {
    for (const r of ga) {
      const o = ua(r), n = Is(o), a = xs(o);
      i.createProperty(r, { attribute: o, noAccessor: !0 }), i.createProperty(Symbol(n), { attribute: n, noAccessor: !0 }), Object.defineProperty(i.prototype, r, { configurable: !0, enumerable: !0, get() {
        return this.dataset[a] ?? null;
      }, set(l) {
        const c = this.dataset[a] ?? null;
        l !== c && (l === null ? delete this.dataset[a] : this.dataset[a] = l, this.requestUpdate(r, c));
      } });
    }
  })(e), e;
}
function Is(s) {
  return `data-${s}`;
}
function xs(s) {
  return s.replace(/-\w/, ((t) => t[1].toUpperCase()));
}
const dt = /* @__PURE__ */ Symbol("internals"), Ss = /* @__PURE__ */ Symbol("privateInternals");
function mi(s) {
  return class extends s {
    get [dt]() {
      return this[Ss] || (this[Ss] = this.attachInternals()), this[Ss];
    }
  };
}
function fa(s) {
  s.addInitializer(((t) => {
    const e = t;
    e.addEventListener("click", (async (i) => {
      const { type: r, [dt]: o } = e, { form: n } = o;
      n && r !== "button" && (await new Promise(((a) => {
        setTimeout(a);
      })), i.defaultPrevented || (r !== "reset" ? (n.addEventListener("submit", ((a) => {
        Object.defineProperty(a, "submitter", { configurable: !0, enumerable: !0, get: () => e });
      }), { capture: !0, once: !0 }), o.setFormValue(e.value), n.requestSubmit()) : n.reset()));
    }));
  }));
}
function ma(s) {
  const t = new MouseEvent("click", { bubbles: !0 });
  return s.dispatchEvent(t), t;
}
function _a(s) {
  return s.currentTarget === s.target && s.composedPath()[0] === s.target && !s.target.disabled && !(function(t) {
    const e = Rs;
    return e && (t.preventDefault(), t.stopImmediatePropagation()), (async function() {
      Rs = !0, await null, Rs = !1;
    })(), e;
  })(s);
}
let Rs = !1;
const _h = Gt(mi(Y));
let lt = class extends _h {
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(t) {
    this.setAttribute("name", t);
  }
  get form() {
    return this[dt].form;
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
    return B`
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
    return B`<button
      id="button"
      class="button"
      ?disabled=${this.disabled}
      aria-disabled=${this.softDisabled || I}
      aria-label="${t || I}"
      aria-haspopup="${e || I}"
      aria-expanded="${i || I}">
      ${this.renderContent()}
    </button>`;
  }
  renderLink() {
    const { ariaLabel: t, ariaHasPopup: e, ariaExpanded: i } = this;
    return B`<a
      id="link"
      class="button"
      aria-label="${t || I}"
      aria-haspopup="${e || I}"
      aria-expanded="${i || I}"
      aria-disabled=${this.disabled || this.softDisabled || I}
      tabindex="${this.disabled && !this.softDisabled ? -1 : I}"
      href=${this.href}
      download=${this.download || I}
      target=${this.target || I}
      >${this.renderContent()}
    </a>`;
  }
  renderContent() {
    const t = B`<slot
      name="icon"
      @slotchange="${this.handleSlotChange}"></slot>`;
    return B`
      <span class="touch"></span>
      ${this.trailingIcon ? I : t}
      <span class="label"><slot></slot></span>
      ${this.trailingIcon ? t : I}
    `;
  }
  handleClick(t) {
    if (this.softDisabled || this.disabled && this.href) return t.stopImmediatePropagation(), void t.preventDefault();
    _a(t) && this.buttonElement && (this.focus(), ma(this.buttonElement));
  }
  handleSlotChange() {
    this.hasIcon = this.assignedIcons.length > 0;
  }
};
fa(lt), lt.formAssociated = !0, lt.shadowRootOptions = { mode: "open", delegatesFocus: !0 }, g([v({ type: Boolean, reflect: !0 })], lt.prototype, "disabled", void 0), g([v({ type: Boolean, attribute: "soft-disabled", reflect: !0 })], lt.prototype, "softDisabled", void 0), g([v()], lt.prototype, "href", void 0), g([v()], lt.prototype, "download", void 0), g([v()], lt.prototype, "target", void 0), g([v({ type: Boolean, attribute: "trailing-icon", reflect: !0 })], lt.prototype, "trailingIcon", void 0), g([v({ type: Boolean, attribute: "has-icon", reflect: !0 })], lt.prototype, "hasIcon", void 0), g([v()], lt.prototype, "type", void 0), g([v({ reflect: !0 })], lt.prototype, "value", void 0), g([j(".button")], lt.prototype, "buttonElement", void 0), g([Ht({ slot: "icon", flatten: !0 })], lt.prototype, "assignedIcons", void 0);
let vh = class extends lt {
};
const Eh = z`:host{--_container-height: var(--md-text-button-container-height, 40px);--_disabled-label-text-color: var(--md-text-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-text-button-disabled-label-text-opacity, 0.38);--_focus-label-text-color: var(--md-text-button-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-text-button-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-text-button-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-text-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-text-button-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-text-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-text-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-text-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-text-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-text-button-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-text-button-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-text-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-text-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-text-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-text-button-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-icon-color: var(--md-text-button-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-color: var(--md-text-button-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-text-button-icon-size, 18px);--_pressed-icon-color: var(--md-text-button-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-text-button-container-shape-start-start, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-text-button-container-shape-start-end, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-text-button-container-shape-end-end, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-text-button-container-shape-end-start, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-text-button-leading-space, 12px);--_trailing-space: var(--md-text-button-trailing-space, 12px);--_with-leading-icon-leading-space: var(--md-text-button-with-leading-icon-leading-space, 12px);--_with-leading-icon-trailing-space: var(--md-text-button-with-leading-icon-trailing-space, 16px);--_with-trailing-icon-leading-space: var(--md-text-button-with-trailing-icon-leading-space, 16px);--_with-trailing-icon-trailing-space: var(--md-text-button-with-trailing-icon-trailing-space, 12px);--_container-color: none;--_disabled-container-color: none;--_disabled-container-opacity: 0}
`;
let Do = class extends vh {
};
Do.styles = [hh, Eh], customElements.define("ew-text-button", Do);
let je = class extends Y {
  constructor() {
    super(...arguments), this.inset = !1, this.insetStart = !1, this.insetEnd = !1;
  }
};
g([v({ type: Boolean, reflect: !0 })], je.prototype, "inset", void 0), g([v({ type: Boolean, reflect: !0, attribute: "inset-start" })], je.prototype, "insetStart", void 0), g([v({ type: Boolean, reflect: !0, attribute: "inset-end" })], je.prototype, "insetEnd", void 0);
const va = z`:host{box-sizing:border-box;color:var(--md-divider-color, var(--md-sys-color-outline-variant, #cac4d0));display:flex;height:var(--md-divider-thickness, 1px);width:100%}:host([inset]),:host([inset-start]){padding-inline-start:16px}:host([inset]),:host([inset-end]){padding-inline-end:16px}:host::before{background:currentColor;content:"";height:100%;width:100%}@media(forced-colors: active){:host::before{background:CanvasText}}
`;
function cs(s, t) {
  !t.bubbles || s.shadowRoot && !t.composed || t.stopPropagation();
  const e = Reflect.construct(t.constructor, [t.type, t]), i = s.dispatchEvent(e);
  return i || t.preventDefault(), i;
}
let Ds = class extends je {
};
Ds.styles = [va], Ds = g([Xt("md-divider")], Ds);
const wh = { dialog: [[[{ transform: "translateY(-50px)" }, { transform: "translateY(0)" }], { duration: 500, easing: Dt.EMPHASIZED }]], scrim: [[[{ opacity: 0 }, { opacity: 0.32 }], { duration: 500, easing: "linear" }]], container: [[[{ opacity: 0 }, { opacity: 1 }], { duration: 50, easing: "linear", pseudoElement: "::before" }], [[{ height: "35%" }, { height: "100%" }], { duration: 500, easing: Dt.EMPHASIZED, pseudoElement: "::before" }]], headline: [[[{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }], { duration: 250, easing: "linear", fill: "forwards" }]], content: [[[{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }], { duration: 250, easing: "linear", fill: "forwards" }]], actions: [[[{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 300, easing: "linear", fill: "forwards" }]] }, bh = { dialog: [[[{ transform: "translateY(0)" }, { transform: "translateY(-50px)" }], { duration: 150, easing: Dt.EMPHASIZED_ACCELERATE }]], scrim: [[[{ opacity: 0.32 }, { opacity: 0 }], { duration: 150, easing: "linear" }]], container: [[[{ height: "100%" }, { height: "35%" }], { duration: 150, easing: Dt.EMPHASIZED_ACCELERATE, pseudoElement: "::before" }], [[{ opacity: "1" }, { opacity: "0" }], { delay: 100, duration: 50, easing: "linear", pseudoElement: "::before" }]], headline: [[[{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: "linear", fill: "forwards" }]], content: [[[{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: "linear", fill: "forwards" }]], actions: [[[{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: "linear", fill: "forwards" }]] }, yh = Gt(Y);
let tt = class extends yh {
  get open() {
    return this.isOpen;
  }
  set open(t) {
    t !== this.isOpen && (this.isOpen = t, t ? (this.setAttribute("open", ""), this.show()) : (this.removeAttribute("open"), this.close()));
  }
  constructor() {
    super(), this.quick = !1, this.returnValue = "", this.noFocusTrap = !1, this.getOpenAnimation = () => wh, this.getCloseAnimation = () => bh, this.isOpen = !1, this.isOpening = !1, this.isConnectedPromise = this.getIsConnectedPromise(), this.isAtScrollTop = !1, this.isAtScrollBottom = !1, this.nextClickIsFromContent = !1, this.hasHeadline = !1, this.hasActions = !1, this.hasIcon = !1, this.escapePressedWithoutCancel = !1, this.treewalker = document.createTreeWalker(this, NodeFilter.SHOW_ELEMENT), this.addEventListener("submit", this.handleSubmit);
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
    const t = this.open && !(this.isAtScrollTop && this.isAtScrollBottom), e = { "has-headline": this.hasHeadline, "has-actions": this.hasActions, "has-icon": this.hasIcon, scrollable: t, "show-top-divider": t && !this.isAtScrollTop, "show-bottom-divider": t && !this.isAtScrollBottom }, i = this.open && !this.noFocusTrap, r = B`
      <div
        class="focus-trap"
        tabindex="0"
        aria-hidden="true"
        @focus=${this.handleFocusTrapFocus}></div>
    `, { ariaLabel: o } = this;
    return B`
      <div class="scrim"></div>
      <dialog
        class=${ft(e)}
        aria-label=${o || I}
        aria-labelledby=${this.hasHeadline ? "headline" : I}
        role=${this.type === "alert" ? "alertdialog" : I}
        @cancel=${this.handleCancel}
        @click=${this.handleDialogClick}
        @close=${this.handleClose}
        @keydown=${this.handleKeydown}
        .returnValue=${this.returnValue || I}>
        ${i ? r : I}
        <div class="container" @click=${this.handleContentClick}>
          <div class="headline">
            <div class="icon" aria-hidden="true">
              <slot name="icon" @slotchange=${this.handleIconChange}></slot>
            </div>
            <h2 id="headline" aria-hidden=${!this.hasHeadline || I}>
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
        ${i ? r : I}
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
    const e = !cs(this, t);
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
    const { dialog: i, scrim: r, container: o, headline: n, content: a, actions: l } = this;
    if (!(i && r && o && n && a && l)) return;
    const { container: c, dialog: d, scrim: h, headline: A, content: p, actions: _ } = t, u = [[i, d ?? []], [r, h ?? []], [o, c ?? []], [n, A ?? []], [a, p ?? []], [l, _ ?? []]], f = [];
    for (const [w, b] of u) for (const m of b) {
      const C = w.animate(...m);
      this.cancelAnimations.signal.addEventListener("abort", (() => {
        C.cancel();
      })), f.push(C);
    }
    await Promise.all(f.map(((w) => w.finished.catch((() => {
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
    const o = t.target === this.firstFocusTrap, n = !o, a = t.relatedTarget === e, l = t.relatedTarget === i, c = !a && !l;
    if (n && l || o && c) return void e.focus();
    (o && a || n && c) && i.focus();
  }
  getFirstAndLastFocusableChildren() {
    if (!this.treewalker) return [null, null];
    let t = null, e = null;
    for (this.treewalker.currentNode = this.treewalker.root; this.treewalker.nextNode(); ) {
      const i = this.treewalker.currentNode;
      Ch(i) && (t || (t = i), e = i);
    }
    return [t, e];
  }
};
function Ch(s) {
  var t;
  const e = ":not(:disabled,[disabled])";
  return s.matches(":is(button,input,select,textarea,object,:is(a,area)[href],[tabindex],[contenteditable=true])" + e + ':not([tabindex^="-"])') ? !0 : !!s.localName.includes("-") && !!s.matches(e) && (((t = s.shadowRoot) === null || t === void 0 ? void 0 : t.delegatesFocus) ?? !1);
}
g([v({ type: Boolean })], tt.prototype, "open", null), g([v({ type: Boolean })], tt.prototype, "quick", void 0), g([v({ attribute: !1 })], tt.prototype, "returnValue", void 0), g([v()], tt.prototype, "type", void 0), g([v({ type: Boolean, attribute: "no-focus-trap" })], tt.prototype, "noFocusTrap", void 0), g([j("dialog")], tt.prototype, "dialog", void 0), g([j(".scrim")], tt.prototype, "scrim", void 0), g([j(".container")], tt.prototype, "container", void 0), g([j(".headline")], tt.prototype, "headline", void 0), g([j(".content")], tt.prototype, "content", void 0), g([j(".actions")], tt.prototype, "actions", void 0), g([$()], tt.prototype, "isAtScrollTop", void 0), g([$()], tt.prototype, "isAtScrollBottom", void 0), g([j(".scroller")], tt.prototype, "scroller", void 0), g([j(".top.anchor")], tt.prototype, "topAnchor", void 0), g([j(".bottom.anchor")], tt.prototype, "bottomAnchor", void 0), g([j(".focus-trap")], tt.prototype, "firstFocusTrap", void 0), g([$()], tt.prototype, "hasHeadline", void 0), g([$()], tt.prototype, "hasActions", void 0), g([$()], tt.prototype, "hasIcon", void 0);
const Bh = z`:host{border-start-start-radius:var(--md-dialog-container-shape-start-start, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-start-end-radius:var(--md-dialog-container-shape-start-end, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-end-end-radius:var(--md-dialog-container-shape-end-end, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-end-start-radius:var(--md-dialog-container-shape-end-start, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));display:contents;margin:auto;max-height:min(560px,100% - 48px);max-width:min(560px,100% - 48px);min-height:140px;min-width:280px;position:fixed;height:fit-content;width:fit-content}dialog{background:rgba(0,0,0,0);border:none;border-radius:inherit;flex-direction:column;height:inherit;margin:inherit;max-height:inherit;max-width:inherit;min-height:inherit;min-width:inherit;outline:none;overflow:visible;padding:0;width:inherit}dialog[open]{display:flex}::backdrop{background:none}.scrim{background:var(--md-sys-color-scrim, #000);display:none;inset:0;opacity:32%;pointer-events:none;position:fixed;z-index:1}:host([open]) .scrim{display:flex}h2{all:unset;align-self:stretch}.headline{align-items:center;color:var(--md-dialog-headline-color, var(--md-sys-color-on-surface, #1d1b20));display:flex;flex-direction:column;font-family:var(--md-dialog-headline-font, var(--md-sys-typescale-headline-small-font, var(--md-ref-typeface-brand, Roboto)));font-size:var(--md-dialog-headline-size, var(--md-sys-typescale-headline-small-size, 1.5rem));line-height:var(--md-dialog-headline-line-height, var(--md-sys-typescale-headline-small-line-height, 2rem));font-weight:var(--md-dialog-headline-weight, var(--md-sys-typescale-headline-small-weight, var(--md-ref-typeface-weight-regular, 400)));position:relative}slot[name=headline]::slotted(*){align-items:center;align-self:stretch;box-sizing:border-box;display:flex;gap:8px;padding:24px 24px 0}.icon{display:flex}slot[name=icon]::slotted(*){color:var(--md-dialog-icon-color, var(--md-sys-color-secondary, #625b71));fill:currentColor;font-size:var(--md-dialog-icon-size, 24px);margin-top:24px;height:var(--md-dialog-icon-size, 24px);width:var(--md-dialog-icon-size, 24px)}.has-icon slot[name=headline]::slotted(*){justify-content:center;padding-top:16px}.scrollable slot[name=headline]::slotted(*){padding-bottom:16px}.scrollable.has-headline slot[name=content]::slotted(*){padding-top:8px}.container{border-radius:inherit;display:flex;flex-direction:column;flex-grow:1;overflow:hidden;position:relative;transform-origin:top}.container::before{background:var(--md-dialog-container-color, var(--md-sys-color-surface-container-high, #ece6f0));border-radius:inherit;content:"";inset:0;position:absolute}.scroller{display:flex;flex:1;flex-direction:column;overflow:hidden;z-index:1}.scrollable .scroller{overflow-y:scroll}.content{color:var(--md-dialog-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-dialog-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-dialog-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-dialog-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));flex:1;font-weight:var(--md-dialog-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)));height:min-content;position:relative}slot[name=content]::slotted(*){box-sizing:border-box;padding:24px}.anchor{position:absolute}.top.anchor{top:0}.bottom.anchor{bottom:0}.actions{position:relative}slot[name=actions]::slotted(*){box-sizing:border-box;display:flex;gap:8px;justify-content:flex-end;padding:16px 24px 24px}.has-actions slot[name=content]::slotted(*){padding-bottom:8px}md-divider{display:none;position:absolute}.has-headline.show-top-divider .headline md-divider,.has-actions.show-bottom-divider .actions md-divider{display:flex}.headline md-divider{bottom:0}.actions md-divider{top:0}@media(forced-colors: active){dialog{outline:2px solid WindowText}}
`;
let Mo = class extends tt {
};
Mo.styles = [Bh], customElements.define("ew-dialog", Mo);
const Ea = z`
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
let To;
function wa(s, t = $t) {
  const e = kr(s, t);
  return e && (e.tabIndex = 0, e.focus()), e;
}
function ba(s, t = $t) {
  const e = ya(s, t);
  return e && (e.tabIndex = 0, e.focus()), e;
}
function We(s, t = $t) {
  for (let e = 0; e < s.length; e++) {
    const i = s[e];
    if (i.tabIndex === 0 && t(i)) return { item: i, index: e };
  }
  return null;
}
function kr(s, t = $t) {
  for (const e of s) if (t(e)) return e;
  return null;
}
function ya(s, t = $t) {
  for (let e = s.length - 1; e >= 0; e--) {
    const i = s[e];
    if (t(i)) return i;
  }
  return null;
}
function ko(s, t, e = $t, i = !0) {
  if (t) {
    const r = (function(o, n, a = $t, l = !0) {
      for (let c = 1; c < o.length; c++) {
        const d = (c + n) % o.length;
        if (d < n && !l) return null;
        const h = o[d];
        if (a(h)) return h;
      }
      return o[n] ? o[n] : null;
    })(s, t.index, e, i);
    return r && (r.tabIndex = 0, r.focus()), r;
  }
  return wa(s, e);
}
function Fo(s, t, e = $t, i = !0) {
  if (t) {
    const r = (function(o, n, a = $t, l = !0) {
      for (let c = 1; c < o.length; c++) {
        const d = (n - c + o.length) % o.length;
        if (d > n && !l) return null;
        const h = o[d];
        if (a(h)) return h;
      }
      return o[n] ? o[n] : null;
    })(s, t.index, e, i);
    return r && (r.tabIndex = 0, r.focus()), r;
  }
  return ba(s, e);
}
function $t(s) {
  return !s.disabled;
}
const rt = { ArrowDown: "ArrowDown", ArrowLeft: "ArrowLeft", ArrowUp: "ArrowUp", ArrowRight: "ArrowRight", Home: "Home", End: "End" };
class Ca {
  constructor(t) {
    this.handleKeydown = (d) => {
      const h = d.key;
      if (d.defaultPrevented || !this.isNavigableKey(h)) return;
      const A = this.items;
      if (!A.length) return;
      const p = We(A, this.isActivatable);
      d.preventDefault();
      const _ = this.isRtl();
      let u = null;
      switch (h) {
        case rt.ArrowDown:
        case (_ ? rt.ArrowLeft : rt.ArrowRight):
          u = ko(A, p, this.isActivatable, this.wrapNavigation());
          break;
        case rt.ArrowUp:
        case (_ ? rt.ArrowRight : rt.ArrowLeft):
          u = Fo(A, p, this.isActivatable, this.wrapNavigation());
          break;
        case rt.Home:
          u = wa(A, this.isActivatable);
          break;
        case rt.End:
          u = ba(A, this.isActivatable);
      }
      u && p && p.item !== u && (p.item.tabIndex = -1);
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
      for (const p of d)
        !(!p.disabled && p.tabIndex > -1) || h ? p.tabIndex = -1 : (h = !0, p.tabIndex = 0);
      if (h) return;
      const A = kr(d, this.isActivatable);
      A && (A.tabIndex = 0);
    };
    const { isItem: e, getPossibleItems: i, isRtl: r, deactivateItem: o, activateItem: n, isNavigableKey: a, isActivatable: l, wrapNavigation: c } = t;
    this.isItem = e, this.getPossibleItems = i, this.isRtl = r, this.deactivateItem = o, this.activateItem = n, this.isNavigableKey = a, this.isActivatable = l, this.wrapNavigation = c ?? (() => !0);
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
    const t = this.items, e = We(t, this.isActivatable);
    return e && (e.item.tabIndex = -1), ko(t, e, this.isActivatable, this.wrapNavigation());
  }
  activatePreviousItem() {
    const t = this.items, e = We(t, this.isActivatable);
    return e && (e.item.tabIndex = -1), Fo(t, e, this.isActivatable, this.wrapNavigation());
  }
}
const Ih = new Set(Object.values(rt));
class Ba extends Y {
  get items() {
    return this.listController.items;
  }
  constructor() {
    super(), this.listController = new Ca({ isItem: (t) => t.hasAttribute("md-list-item"), getPossibleItems: () => this.slotItems, isRtl: () => getComputedStyle(this).direction === "rtl", deactivateItem: (t) => {
      t.tabIndex = -1;
    }, activateItem: (t) => {
      t.tabIndex = 0;
    }, isNavigableKey: (t) => Ih.has(t), isActivatable: (t) => !t.disabled && t.type !== "text" }), this.internals = this.attachInternals(), this.internals.role = "list", this.addEventListener("keydown", this.listController.handleKeydown);
  }
  render() {
    return B`
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
g([Ht({ flatten: !0 })], Ba.prototype, "slotItems", void 0);
const xh = z`:host{background:var(--md-list-container-color, var(--md-sys-color-surface, #fef7ff));color:unset;display:flex;flex-direction:column;outline:none;padding:8px 0;position:relative}
`;
class Oo extends Ba {
}
Oo.styles = [xh], customElements.define("ew-list", Oo);
class nr extends Y {
  constructor() {
    super(...arguments), this.multiline = !1;
  }
  render() {
    return B`
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
    for (const i of this.textSlots) if (Sh(i) && (e += 1), e > 1) {
      t = !0;
      break;
    }
    this.multiline = t;
  }
}
function Sh(s) {
  for (const e of s.assignedNodes({ flatten: !0 })) {
    var t;
    const i = e.nodeType === Node.ELEMENT_NODE, r = e.nodeType === Node.TEXT_NODE && ((t = e.textContent) === null || t === void 0 ? void 0 : t.match(/\S/));
    if (i || r) return !0;
  }
  return !1;
}
g([v({ type: Boolean, reflect: !0 })], nr.prototype, "multiline", void 0), g([/* @__PURE__ */ (function(s) {
  return (t, e) => ls(t, e, { get() {
    return (this.renderRoot ?? To ?? (To = document.createDocumentFragment())).querySelectorAll(s);
  } });
})(".text slot")], nr.prototype, "textSlots", void 0);
const Rh = z`:host{color:var(--md-sys-color-on-surface, #1d1b20);font-family:var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-large-size, 1rem);font-weight:var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-large-line-height, 1.5rem);align-items:center;box-sizing:border-box;display:flex;gap:16px;min-height:56px;overflow:hidden;padding:12px 16px;position:relative;text-overflow:ellipsis}:host([multiline]){min-height:72px}[name=overline]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-body-medium-size, 0.875rem);font-weight:var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400));line-height:var(--md-sys-typescale-body-medium-line-height, 1.25rem)}[name=trailing-supporting-text]{color:var(--md-sys-color-on-surface-variant, #49454f);font-family:var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto));font-size:var(--md-sys-typescale-label-small-size, 0.6875rem);font-weight:var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500));line-height:var(--md-sys-typescale-label-small-line-height, 1rem)}[name=container]::slotted(*){inset:0;position:absolute}.default-slot{display:inline}.default-slot,.text ::slotted(*){overflow:hidden;text-overflow:ellipsis}.text{display:flex;flex:1;flex-direction:column;overflow:hidden}
`;
let Ms = class extends nr {
};
Ms.styles = [Rh], Ms = g([Xt("md-item")], Ms);
const Ia = /* @__PURE__ */ Symbol.for(""), Dh = (s) => {
  if (s?.r === Ia) return s?._$litStatic$;
}, Wt = (s, ...t) => ({ _$litStatic$: t.reduce(((e, i, r) => e + ((o) => {
  if (o._$litStatic$ !== void 0) return o._$litStatic$;
  throw Error(`Value passed to 'literal' function must be a 'literal' result: ${o}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`);
})(i) + s[r + 1]), s[0]), r: Ia }), Po = /* @__PURE__ */ new Map(), ds = /* @__PURE__ */ ((s) => (t, ...e) => {
  const i = e.length;
  let r, o;
  const n = [], a = [];
  let l, c = 0, d = !1;
  for (; c < i; ) {
    for (l = t[c]; c < i && (o = e[c], (r = Dh(o)) !== void 0); ) l += r + t[++c], d = !0;
    c !== i && a.push(o), n.push(l), c++;
  }
  if (c === i && n.push(t[i]), d) {
    const h = n.join("$$lit$$");
    (t = Po.get(h)) === void 0 && (n.raw = n, Po.set(h, t = n)), e = a;
  }
  return s(t, ...e);
})(B), Mh = Gt(Y);
class Nt extends Mh {
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
    return this.renderListItem(B`
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
        i = Wt`a`;
        break;
      case "button":
        i = Wt`button`;
        break;
      default:
        i = Wt`li`;
    }
    const r = this.type !== "text", o = e && this.target ? this.target : I;
    return ds`
      <${i}
        id="item"
        tabindex="${this.isDisabled || !r ? -1 : 0}"
        ?disabled=${this.isDisabled}
        role="listitem"
        aria-selected=${this.ariaSelected || I}
        aria-checked=${this.ariaChecked || I}
        aria-expanded=${this.ariaExpanded || I}
        aria-haspopup=${this.ariaHasPopup || I}
        class="list-item ${ft(this.getRenderClasses())}"
        href=${this.href || I}
        target=${o}
        @focus=${this.onFocus}
      >${t}</${i}>
    `;
  }
  renderRipple() {
    return this.type === "text" ? I : B` <md-ripple
      part="ripple"
      for="item"
      ?disabled=${this.isDisabled}></md-ripple>`;
  }
  renderFocusRing() {
    return this.type === "text" ? I : B` <md-focus-ring
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
    return B`
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
Nt.shadowRootOptions = { ...Y.shadowRootOptions, delegatesFocus: !0 }, g([v({ type: Boolean, reflect: !0 })], Nt.prototype, "disabled", void 0), g([v({ reflect: !0 })], Nt.prototype, "type", void 0), g([v({ type: Boolean, attribute: "md-list-item", reflect: !0 })], Nt.prototype, "isListItem", void 0), g([v()], Nt.prototype, "href", void 0), g([v()], Nt.prototype, "target", void 0), g([j(".list-item")], Nt.prototype, "listItemRoot", void 0);
const Th = z`:host{display:flex;-webkit-tap-highlight-color:rgba(0,0,0,0);--md-ripple-hover-color: var(--md-list-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-list-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-list-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-list-item-pressed-state-layer-opacity, 0.12)}:host(:is([type=button]:not([disabled]),[type=link])){cursor:pointer}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;cursor:inherit;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);width:100%}.list-item.interactive{cursor:pointer}.list-item.disabled{opacity:var(--md-list-item-disabled-opacity, 0.3);pointer-events:none}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;height:100%;color:var(--md-list-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-list-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-list-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-list-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-list-item-one-line-container-height, 56px);padding-top:var(--md-list-item-top-space, 12px);padding-bottom:var(--md-list-item-bottom-space, 12px);padding-inline-start:var(--md-list-item-leading-space, 16px);padding-inline-end:var(--md-list-item-trailing-space, 16px)}md-item[multiline]{min-height:var(--md-list-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-list-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-list-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-list-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-list-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-list-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-list-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-list-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-list-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-list-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-list-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}@media(forced-colors: active){.disabled slot{color:GrayText}.list-item.disabled{color:GrayText;opacity:1}}
`;
class Uo extends Nt {
}
Uo.styles = [Th], customElements.define("ew-list-item", Uo);
class Qo extends je {
}
Qo.styles = [va], customElements.define("ew-divider", Qo);
const ci = /* @__PURE__ */ Symbol("createValidator"), di = /* @__PURE__ */ Symbol("getValidityAnchor"), Ts = /* @__PURE__ */ Symbol("privateValidator"), Tt = /* @__PURE__ */ Symbol("privateSyncValidity"), Ii = /* @__PURE__ */ Symbol("privateCustomValidationMessage");
function Fr(s) {
  var t;
  class e extends s {
    constructor() {
      super(...arguments), this[t] = "";
    }
    get validity() {
      return this[Tt](), this[dt].validity;
    }
    get validationMessage() {
      return this[Tt](), this[dt].validationMessage;
    }
    get willValidate() {
      return this[Tt](), this[dt].willValidate;
    }
    checkValidity() {
      return this[Tt](), this[dt].checkValidity();
    }
    reportValidity() {
      return this[Tt](), this[dt].reportValidity();
    }
    setCustomValidity(r) {
      this[Ii] = r, this[Tt]();
    }
    requestUpdate(r, o, n) {
      super.requestUpdate(r, o, n), this[Tt]();
    }
    firstUpdated(r) {
      super.firstUpdated(r), this[Tt]();
    }
    [(t = Ii, Tt)]() {
      this[Ts] || (this[Ts] = this[ci]());
      const { validity: r, validationMessage: o } = this[Ts].getValidity(), n = !!this[Ii], a = this[Ii] || o;
      this[dt].setValidity({ ...r, customError: n }, a, this[di]() ?? void 0);
    }
    [ci]() {
      throw new Error("Implement [createValidator]");
    }
    [di]() {
      throw new Error("Implement [getValidityAnchor]");
    }
  }
  return e;
}
const ye = /* @__PURE__ */ Symbol("getFormValue"), ar = /* @__PURE__ */ Symbol("getFormState");
function Or(s) {
  class t extends s {
    get form() {
      return this[dt].form;
    }
    get labels() {
      return this[dt].labels;
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
        const n = i === "disabled" ? r !== null : r;
        this.requestUpdate(i, n);
      }
    }
    requestUpdate(i, r, o) {
      super.requestUpdate(i, r, o), this[dt].setFormValue(this[ye](), this[ar]());
    }
    [ye]() {
      throw new Error("Implement [getFormValue]");
    }
    [ar]() {
      return this[ye]();
    }
    formDisabledCallback(i) {
      this.disabled = i;
    }
  }
  return t.formAssociated = !0, g([v({ noAccessor: !0 })], t.prototype, "name", null), g([v({ type: Boolean, noAccessor: !0 })], t.prototype, "disabled", null), t;
}
class Pr {
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
class kh extends Pr {
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
const Fh = Gt(Fr(Or(mi(Y))));
class It extends Fh {
  constructor() {
    super(), this.checked = !1, this.indeterminate = !1, this.required = !1, this.value = "on", this.prevChecked = !1, this.prevDisabled = !1, this.prevIndeterminate = !1, this.addEventListener("click", ((t) => {
      _a(t) && this.input && (this.focus(), ma(this.input));
    }));
  }
  update(t) {
    (t.has("checked") || t.has("disabled") || t.has("indeterminate")) && (this.prevChecked = t.get("checked") ?? this.checked, this.prevDisabled = t.get("disabled") ?? this.disabled, this.prevIndeterminate = t.get("indeterminate") ?? this.indeterminate), super.update(t);
  }
  render() {
    const t = !this.prevChecked && !this.prevIndeterminate, e = this.prevChecked && !this.prevIndeterminate, i = this.prevIndeterminate, r = this.checked && !this.indeterminate, o = this.indeterminate, n = ft({ disabled: this.disabled, selected: r || o, unselected: !r && !o, checked: r, indeterminate: o, "prev-unselected": t, "prev-checked": e, "prev-indeterminate": i, "prev-disabled": this.prevDisabled }), { ariaLabel: a, ariaInvalid: l } = this;
    return B`
      <div class="container ${n}">
        <input
          type="checkbox"
          id="input"
          aria-checked=${o ? "mixed" : I}
          aria-label=${a || I}
          aria-invalid=${l || I}
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
    cs(this, t);
  }
  [ye]() {
    return !this.checked || this.indeterminate ? null : this.value;
  }
  [ar]() {
    return String(this.checked);
  }
  formResetCallback() {
    this.checked = this.hasAttribute("checked");
  }
  formStateRestoreCallback(t) {
    this.checked = t === "true";
  }
  [ci]() {
    return new kh((() => this));
  }
  [di]() {
    return this.input;
  }
}
It.shadowRootOptions = { ...Y.shadowRootOptions, delegatesFocus: !0 }, g([v({ type: Boolean })], It.prototype, "checked", void 0), g([v({ type: Boolean })], It.prototype, "indeterminate", void 0), g([v({ type: Boolean })], It.prototype, "required", void 0), g([v()], It.prototype, "value", void 0), g([$()], It.prototype, "prevChecked", void 0), g([$()], It.prototype, "prevDisabled", void 0), g([$()], It.prototype, "prevIndeterminate", void 0), g([j("input")], It.prototype, "input", void 0);
const Oh = z`:host{border-start-start-radius:var(--md-checkbox-container-shape-start-start, var(--md-checkbox-container-shape, 2px));border-start-end-radius:var(--md-checkbox-container-shape-start-end, var(--md-checkbox-container-shape, 2px));border-end-end-radius:var(--md-checkbox-container-shape-end-end, var(--md-checkbox-container-shape, 2px));border-end-start-radius:var(--md-checkbox-container-shape-end-start, var(--md-checkbox-container-shape, 2px));display:inline-flex;height:var(--md-checkbox-container-size, 18px);position:relative;vertical-align:top;width:var(--md-checkbox-container-size, 18px);-webkit-tap-highlight-color:rgba(0,0,0,0);cursor:pointer}:host([disabled]){cursor:default}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--md-checkbox-container-size, 18px))/2)}md-focus-ring{height:44px;inset:unset;width:44px}input{appearance:none;height:48px;margin:0;opacity:0;outline:none;position:absolute;width:48px;z-index:1;cursor:inherit}:host([touch-target=none]) input{height:100%;width:100%}.container{border-radius:inherit;display:flex;height:100%;place-content:center;place-items:center;position:relative;width:100%}.outline,.background,.icon{inset:0;position:absolute}.outline,.background{border-radius:inherit}.outline{border-color:var(--md-checkbox-outline-color, var(--md-sys-color-on-surface-variant, #49454f));border-style:solid;border-width:var(--md-checkbox-outline-width, 2px);box-sizing:border-box}.background{background-color:var(--md-checkbox-selected-container-color, var(--md-sys-color-primary, #6750a4))}.background,.icon{opacity:0;transition-duration:150ms,50ms;transition-property:transform,opacity;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15),linear;transform:scale(0.6)}:where(.selected) :is(.background,.icon){opacity:1;transition-duration:350ms,50ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1),linear;transform:scale(1)}md-ripple{border-radius:var(--md-checkbox-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));height:var(--md-checkbox-state-layer-size, 40px);inset:unset;width:var(--md-checkbox-state-layer-size, 40px);--md-ripple-hover-color: var(--md-checkbox-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-checkbox-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-pressed-opacity: var(--md-checkbox-pressed-state-layer-opacity, 0.12)}.selected md-ripple{--md-ripple-hover-color: var(--md-checkbox-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--md-ripple-hover-opacity: var(--md-checkbox-selected-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-checkbox-selected-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-checkbox-selected-pressed-state-layer-opacity, 0.12)}.icon{fill:var(--md-checkbox-selected-icon-color, var(--md-sys-color-on-primary, #fff));height:var(--md-checkbox-icon-size, 18px);width:var(--md-checkbox-icon-size, 18px)}.mark.short{height:2px;transition-property:transform,height;width:2px}.mark.long{height:2px;transition-property:transform,width;width:10px}.mark{animation-duration:150ms;animation-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15);transition-duration:150ms;transition-timing-function:cubic-bezier(0.3, 0, 0.8, 0.15)}.selected .mark{animation-duration:350ms;animation-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1);transition-duration:350ms;transition-timing-function:cubic-bezier(0.05, 0.7, 0.1, 1)}.checked .mark,.prev-checked.unselected .mark{transform:scaleY(-1) translate(7px, -14px) rotate(45deg)}.checked .mark.short,.prev-checked.unselected .mark.short{height:5.6568542495px}.checked .mark.long,.prev-checked.unselected .mark.long{width:11.313708499px}.indeterminate .mark,.prev-indeterminate.unselected .mark{transform:scaleY(-1) translate(4px, -10px) rotate(0deg)}.prev-unselected .mark{transition-property:none}.prev-unselected.checked .mark.long{animation-name:prev-unselected-to-checked}@keyframes prev-unselected-to-checked{from{width:0}}:where(:hover) .outline{border-color:var(--md-checkbox-hover-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-hover-outline-width, 2px)}:where(:hover) .background{background:var(--md-checkbox-selected-hover-container-color, var(--md-sys-color-primary, #6750a4))}:where(:hover) .icon{fill:var(--md-checkbox-selected-hover-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:focus-within) .outline{border-color:var(--md-checkbox-focus-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-focus-outline-width, 2px)}:where(:focus-within) .background{background:var(--md-checkbox-selected-focus-container-color, var(--md-sys-color-primary, #6750a4))}:where(:focus-within) .icon{fill:var(--md-checkbox-selected-focus-icon-color, var(--md-sys-color-on-primary, #fff))}:where(:active) .outline{border-color:var(--md-checkbox-pressed-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-pressed-outline-width, 2px)}:where(:active) .background{background:var(--md-checkbox-selected-pressed-container-color, var(--md-sys-color-primary, #6750a4))}:where(:active) .icon{fill:var(--md-checkbox-selected-pressed-icon-color, var(--md-sys-color-on-primary, #fff))}:where(.disabled,.prev-disabled) :is(.background,.icon,.mark){animation-duration:0s;transition-duration:0s}:where(.disabled) .outline{border-color:var(--md-checkbox-disabled-outline-color, var(--md-sys-color-on-surface, #1d1b20));border-width:var(--md-checkbox-disabled-outline-width, 2px);opacity:var(--md-checkbox-disabled-container-opacity, 0.38)}:where(.selected.disabled) .outline{visibility:hidden}:where(.selected.disabled) .background{background:var(--md-checkbox-selected-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-checkbox-selected-disabled-container-opacity, 0.38)}:where(.disabled) .icon{fill:var(--md-checkbox-selected-disabled-icon-color, var(--md-sys-color-surface, #fef7ff))}@media(forced-colors: active){.background{background-color:CanvasText}.selected.disabled .background{background-color:GrayText;opacity:1}.outline{border-color:CanvasText}.disabled .outline{border-color:GrayText;opacity:1}.icon{fill:Canvas}}
`;
class Ho extends It {
}
Ho.styles = [Oh], customElements.define("ew-checkbox", Ho);
class Ph {
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
    const o = (n) => {
      if (n === "") return;
      const a = document.createElement("span");
      if (this.state.bold && a.classList.add("log-bold"), this.state.italic && a.classList.add("log-italic"), this.state.underline && a.classList.add("log-underline"), this.state.strikethrough && a.classList.add("log-strikethrough"), this.state.secret && a.classList.add("log-secret"), this.state.foregroundColor !== null && a.classList.add(`log-fg-${this.state.foregroundColor}`), this.state.backgroundColor !== null && a.classList.add(`log-bg-${this.state.backgroundColor}`), a.appendChild(document.createTextNode(n)), r.appendChild(a), this.state.secret) {
        const l = document.createElement("span");
        l.classList.add("log-secret-redacted"), l.appendChild(document.createTextNode("[redacted]")), r.appendChild(l);
      }
    };
    for (; ; ) {
      const n = e.exec(t);
      if (n === null) break;
      const a = n.index;
      if (o(t.substring(i, a)), i = a + n[0].length, n[1] !== void 0) for (const l of n[1].split(";")) switch (parseInt(l)) {
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
const Ce = (s) => new Promise(((t) => setTimeout(t, s)));
class Uh {
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
class Qh {
  transform(t, e) {
    const i = /* @__PURE__ */ new Date(), r = i.getHours().toString().padStart(2, "0"), o = i.getMinutes().toString().padStart(2, "0"), n = i.getSeconds().toString().padStart(2, "0");
    e.enqueue(`[${r}:${o}:${n}]${t}`);
  }
}
class L extends Error {
}
function ke(s) {
  let t = s.length;
  for (; --t >= 0; ) s[t] = 0;
}
const Ur = 256, xa = 286, Ve = 30, qe = 15, lr = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]), Li = new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]), Hh = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]), $o = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Ot = new Array(576);
ke(Ot);
const Ze = new Array(60);
ke(Ze);
const hi = new Array(512);
ke(hi);
const Ai = new Array(256);
ke(Ai);
const Qr = new Array(29);
ke(Qr);
const Zi = new Array(Ve);
function ks(s, t, e, i, r) {
  this.static_tree = s, this.extra_bits = t, this.extra_base = e, this.elems = i, this.max_length = r, this.has_stree = s && s.length;
}
let Go, Lo, Yo;
function Fs(s, t) {
  this.dyn_tree = s, this.max_code = 0, this.stat_desc = t;
}
ke(Zi);
const Sa = (s) => s < 256 ? hi[s] : hi[256 + (s >>> 7)], pi = (s, t) => {
  s.pending_buf[s.pending++] = 255 & t, s.pending_buf[s.pending++] = t >>> 8 & 255;
}, At = (s, t, e) => {
  s.bi_valid > 16 - e ? (s.bi_buf |= t << s.bi_valid & 65535, pi(s, s.bi_buf), s.bi_buf = t >> 16 - s.bi_valid, s.bi_valid += e - 16) : (s.bi_buf |= t << s.bi_valid & 65535, s.bi_valid += e);
}, St = (s, t, e) => {
  At(s, e[2 * t], e[2 * t + 1]);
}, Ra = (s, t) => {
  let e = 0;
  do
    e |= 1 & s, s >>>= 1, e <<= 1;
  while (--t > 0);
  return e >>> 1;
}, Da = (s, t, e) => {
  const i = new Array(16);
  let r, o, n = 0;
  for (r = 1; r <= qe; r++) n = n + e[r - 1] << 1, i[r] = n;
  for (o = 0; o <= t; o++) {
    let a = s[2 * o + 1];
    a !== 0 && (s[2 * o] = Ra(i[a]++, a));
  }
}, Ma = (s) => {
  let t;
  for (t = 0; t < xa; t++) s.dyn_ltree[2 * t] = 0;
  for (t = 0; t < Ve; t++) s.dyn_dtree[2 * t] = 0;
  for (t = 0; t < 19; t++) s.bl_tree[2 * t] = 0;
  s.dyn_ltree[512] = 1, s.opt_len = s.static_len = 0, s.sym_next = s.matches = 0;
}, Ta = (s) => {
  s.bi_valid > 8 ? pi(s, s.bi_buf) : s.bi_valid > 0 && (s.pending_buf[s.pending++] = s.bi_buf), s.bi_buf = 0, s.bi_valid = 0;
}, No = (s, t, e, i) => {
  const r = 2 * t, o = 2 * e;
  return s[r] < s[o] || s[r] === s[o] && i[t] <= i[e];
}, Os = (s, t, e) => {
  const i = s.heap[e];
  let r = e << 1;
  for (; r <= s.heap_len && (r < s.heap_len && No(t, s.heap[r + 1], s.heap[r], s.depth) && r++, !No(t, i, s.heap[r], s.depth)); ) s.heap[e] = s.heap[r], e = r, r <<= 1;
  s.heap[e] = i;
}, Ko = (s, t, e) => {
  let i, r, o, n, a = 0;
  if (s.sym_next !== 0) do
    i = 255 & s.pending_buf[s.sym_buf + a++], i += (255 & s.pending_buf[s.sym_buf + a++]) << 8, r = s.pending_buf[s.sym_buf + a++], i === 0 ? St(s, r, t) : (o = Ai[r], St(s, o + Ur + 1, t), n = lr[o], n !== 0 && (r -= Qr[o], At(s, r, n)), i--, o = Sa(i), St(s, o, e), n = Li[o], n !== 0 && (i -= Zi[o], At(s, i, n)));
  while (a < s.sym_next);
  St(s, 256, t);
}, Ps = (s, t) => {
  const e = t.dyn_tree, i = t.stat_desc.static_tree, r = t.stat_desc.has_stree, o = t.stat_desc.elems;
  let n, a, l, c = -1;
  for (s.heap_len = 0, s.heap_max = 573, n = 0; n < o; n++) e[2 * n] !== 0 ? (s.heap[++s.heap_len] = c = n, s.depth[n] = 0) : e[2 * n + 1] = 0;
  for (; s.heap_len < 2; ) l = s.heap[++s.heap_len] = c < 2 ? ++c : 0, e[2 * l] = 1, s.depth[l] = 0, s.opt_len--, r && (s.static_len -= i[2 * l + 1]);
  for (t.max_code = c, n = s.heap_len >> 1; n >= 1; n--) Os(s, e, n);
  l = o;
  do
    n = s.heap[1], s.heap[1] = s.heap[s.heap_len--], Os(s, e, 1), a = s.heap[1], s.heap[--s.heap_max] = n, s.heap[--s.heap_max] = a, e[2 * l] = e[2 * n] + e[2 * a], s.depth[l] = (s.depth[n] >= s.depth[a] ? s.depth[n] : s.depth[a]) + 1, e[2 * n + 1] = e[2 * a + 1] = l, s.heap[1] = l++, Os(s, e, 1);
  while (s.heap_len >= 2);
  s.heap[--s.heap_max] = s.heap[1], ((d, h) => {
    const A = h.dyn_tree, p = h.max_code, _ = h.stat_desc.static_tree, u = h.stat_desc.has_stree, f = h.stat_desc.extra_bits, w = h.stat_desc.extra_base, b = h.stat_desc.max_length;
    let m, C, R, E, M, D, x = 0;
    for (E = 0; E <= qe; E++) d.bl_count[E] = 0;
    for (A[2 * d.heap[d.heap_max] + 1] = 0, m = d.heap_max + 1; m < 573; m++) C = d.heap[m], E = A[2 * A[2 * C + 1] + 1] + 1, E > b && (E = b, x++), A[2 * C + 1] = E, C > p || (d.bl_count[E]++, M = 0, C >= w && (M = f[C - w]), D = A[2 * C], d.opt_len += D * (E + M), u && (d.static_len += D * (_[2 * C + 1] + M)));
    if (x !== 0) {
      do {
        for (E = b - 1; d.bl_count[E] === 0; ) E--;
        d.bl_count[E]--, d.bl_count[E + 1] += 2, d.bl_count[b]--, x -= 2;
      } while (x > 0);
      for (E = b; E !== 0; E--) for (C = d.bl_count[E]; C !== 0; ) R = d.heap[--m], R > p || (A[2 * R + 1] !== E && (d.opt_len += (E - A[2 * R + 1]) * A[2 * R], A[2 * R + 1] = E), C--);
    }
  })(s, t), Da(e, c, s.bl_count);
}, zo = (s, t, e) => {
  let i, r, o = -1, n = t[1], a = 0, l = 7, c = 4;
  for (n === 0 && (l = 138, c = 3), t[2 * (e + 1) + 1] = 65535, i = 0; i <= e; i++) r = n, n = t[2 * (i + 1) + 1], ++a < l && r === n || (a < c ? s.bl_tree[2 * r] += a : r !== 0 ? (r !== o && s.bl_tree[2 * r]++, s.bl_tree[32]++) : a <= 10 ? s.bl_tree[34]++ : s.bl_tree[36]++, a = 0, o = r, n === 0 ? (l = 138, c = 3) : r === n ? (l = 6, c = 3) : (l = 7, c = 4));
}, Jo = (s, t, e) => {
  let i, r, o = -1, n = t[1], a = 0, l = 7, c = 4;
  for (n === 0 && (l = 138, c = 3), i = 0; i <= e; i++) if (r = n, n = t[2 * (i + 1) + 1], !(++a < l && r === n)) {
    if (a < c) do
      St(s, r, s.bl_tree);
    while (--a != 0);
    else r !== 0 ? (r !== o && (St(s, r, s.bl_tree), a--), St(s, 16, s.bl_tree), At(s, a - 3, 2)) : a <= 10 ? (St(s, 17, s.bl_tree), At(s, a - 3, 3)) : (St(s, 18, s.bl_tree), At(s, a - 11, 7));
    a = 0, o = r, n === 0 ? (l = 138, c = 3) : r === n ? (l = 6, c = 3) : (l = 7, c = 4);
  }
};
let jo = !1;
const ka = (s, t, e, i) => {
  At(s, 0 + (i ? 1 : 0), 3), Ta(s), pi(s, e), pi(s, ~e), e && s.pending_buf.set(s.window.subarray(t, t + e), s.pending), s.pending += e;
};
var $h = (s) => {
  jo || ((() => {
    let t, e, i, r, o;
    const n = new Array(16);
    for (i = 0, r = 0; r < 28; r++) for (Qr[r] = i, t = 0; t < 1 << lr[r]; t++) Ai[i++] = r;
    for (Ai[i - 1] = r, o = 0, r = 0; r < 16; r++) for (Zi[r] = o, t = 0; t < 1 << Li[r]; t++) hi[o++] = r;
    for (o >>= 7; r < Ve; r++) for (Zi[r] = o << 7, t = 0; t < 1 << Li[r] - 7; t++) hi[256 + o++] = r;
    for (e = 0; e <= qe; e++) n[e] = 0;
    for (t = 0; t <= 143; ) Ot[2 * t + 1] = 8, t++, n[8]++;
    for (; t <= 255; ) Ot[2 * t + 1] = 9, t++, n[9]++;
    for (; t <= 279; ) Ot[2 * t + 1] = 7, t++, n[7]++;
    for (; t <= 287; ) Ot[2 * t + 1] = 8, t++, n[8]++;
    for (Da(Ot, 287, n), t = 0; t < Ve; t++) Ze[2 * t + 1] = 5, Ze[2 * t] = Ra(t, 5);
    Go = new ks(Ot, lr, 257, xa, qe), Lo = new ks(Ze, Li, 0, Ve, qe), Yo = new ks(new Array(0), Hh, 0, 19, 7);
  })(), jo = !0), s.l_desc = new Fs(s.dyn_ltree, Go), s.d_desc = new Fs(s.dyn_dtree, Lo), s.bl_desc = new Fs(s.bl_tree, Yo), s.bi_buf = 0, s.bi_valid = 0, Ma(s);
}, Gh = (s, t, e, i) => {
  let r, o, n = 0;
  s.level > 0 ? (s.strm.data_type === 2 && (s.strm.data_type = ((a) => {
    let l, c = 4093624447;
    for (l = 0; l <= 31; l++, c >>>= 1) if (1 & c && a.dyn_ltree[2 * l] !== 0) return 0;
    if (a.dyn_ltree[18] !== 0 || a.dyn_ltree[20] !== 0 || a.dyn_ltree[26] !== 0) return 1;
    for (l = 32; l < Ur; l++) if (a.dyn_ltree[2 * l] !== 0) return 1;
    return 0;
  })(s)), Ps(s, s.l_desc), Ps(s, s.d_desc), n = ((a) => {
    let l;
    for (zo(a, a.dyn_ltree, a.l_desc.max_code), zo(a, a.dyn_dtree, a.d_desc.max_code), Ps(a, a.bl_desc), l = 18; l >= 3 && a.bl_tree[2 * $o[l] + 1] === 0; l--) ;
    return a.opt_len += 3 * (l + 1) + 5 + 5 + 4, l;
  })(s), r = s.opt_len + 3 + 7 >>> 3, o = s.static_len + 3 + 7 >>> 3, o <= r && (r = o)) : r = o = e + 5, e + 4 <= r && t !== -1 ? ka(s, t, e, i) : s.strategy === 4 || o === r ? (At(s, 2 + (i ? 1 : 0), 3), Ko(s, Ot, Ze)) : (At(s, 4 + (i ? 1 : 0), 3), ((a, l, c, d) => {
    let h;
    for (At(a, l - 257, 5), At(a, c - 1, 5), At(a, d - 4, 4), h = 0; h < d; h++) At(a, a.bl_tree[2 * $o[h] + 1], 3);
    Jo(a, a.dyn_ltree, l - 1), Jo(a, a.dyn_dtree, c - 1);
  })(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, n + 1), Ko(s, s.dyn_ltree, s.dyn_dtree)), Ma(s), i && Ta(s);
}, Lh = { _tr_init: $h, _tr_stored_block: ka, _tr_flush_block: Gh, _tr_tally: (s, t, e) => (s.pending_buf[s.sym_buf + s.sym_next++] = t, s.pending_buf[s.sym_buf + s.sym_next++] = t >> 8, s.pending_buf[s.sym_buf + s.sym_next++] = e, t === 0 ? s.dyn_ltree[2 * e]++ : (s.matches++, t--, s.dyn_ltree[2 * (Ai[e] + Ur + 1)]++, s.dyn_dtree[2 * Sa(t)]++), s.sym_next === s.sym_end), _tr_align: (s) => {
  At(s, 2, 3), St(s, 256, Ot), ((t) => {
    t.bi_valid === 16 ? (pi(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = 255 & t.bi_buf, t.bi_buf >>= 8, t.bi_valid -= 8);
  })(s);
} }, gi = (s, t, e, i) => {
  let r = 65535 & s | 0, o = s >>> 16 & 65535 | 0, n = 0;
  for (; e !== 0; ) {
    n = e > 2e3 ? 2e3 : e, e -= n;
    do
      r = r + t[i++] | 0, o = o + r | 0;
    while (--n);
    r %= 65521, o %= 65521;
  }
  return r | o << 16 | 0;
};
const Yh = new Uint32Array((() => {
  let s, t = [];
  for (var e = 0; e < 256; e++) {
    s = e;
    for (var i = 0; i < 8; i++) s = 1 & s ? 3988292384 ^ s >>> 1 : s >>> 1;
    t[e] = s;
  }
  return t;
})());
var it = (s, t, e, i) => {
  const r = Yh, o = i + e;
  s ^= -1;
  for (let n = i; n < o; n++) s = s >>> 8 ^ r[255 & (s ^ t[n])];
  return -1 ^ s;
}, Re = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" }, hs = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_MEM_ERROR: -4, Z_BUF_ERROR: -5, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
const { _tr_init: Nh, _tr_stored_block: cr, _tr_flush_block: Kh, _tr_tally: Vt, _tr_align: zh } = Lh, { Z_NO_FLUSH: qt, Z_PARTIAL_FLUSH: Jh, Z_FULL_FLUSH: jh, Z_FINISH: _t, Z_BLOCK: Wo, Z_OK: st, Z_STREAM_END: Vo, Z_STREAM_ERROR: Rt, Z_DATA_ERROR: Wh, Z_BUF_ERROR: Us, Z_DEFAULT_COMPRESSION: Vh, Z_FILTERED: qh, Z_HUFFMAN_ONLY: xi, Z_RLE: Zh, Z_FIXED: Xh, Z_DEFAULT_STRATEGY: tA, Z_UNKNOWN: eA, Z_DEFLATED: Xi } = hs, le = 258, Mt = 262, De = 42, re = 113, Le = 666, oe = (s, t) => (s.msg = Re[t], t), qo = (s) => 2 * s - (s > 4 ? 9 : 0), jt = (s) => {
  let t = s.length;
  for (; --t >= 0; ) s[t] = 0;
}, iA = (s) => {
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
let Hr = (s, t, e) => (t << s.hash_shift ^ e) & s.hash_mask;
const pe = (s, t) => {
  let e;
  if (s.legacy_hash) e = s.ins_h = Hr(s, s.ins_h, s.window[t + 3 - 1]);
  else {
    const r = s.window, o = r[t] | r[t + 1] << 8 | r[t + 2] << 16 | r[t + 3] << 24;
    e = s.ins_h = Math.imul(o, 66521) + 66521 >>> 16 & s.hash_mask;
  }
  const i = s.prev[t & s.w_mask] = s.head[e];
  return s.head[e] = t, i;
}, gt = (s) => {
  const t = s.state;
  let e = t.pending;
  e > s.avail_out && (e = s.avail_out), e !== 0 && (s.output.set(t.pending_buf.subarray(t.pending_out, t.pending_out + e), s.next_out), s.next_out += e, t.pending_out += e, s.total_out += e, s.avail_out -= e, t.pending -= e, t.pending === 0 && (t.pending_out = 0));
}, ut = (s, t) => {
  Kh(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, t), s.block_start = s.strstart, gt(s.strm);
}, G = (s, t) => {
  s.pending_buf[s.pending++] = t;
}, Ue = (s, t) => {
  s.pending_buf[s.pending++] = t >>> 8 & 255, s.pending_buf[s.pending++] = 255 & t;
}, dr = (s, t, e, i) => {
  let r = s.avail_in;
  return r > i && (r = i), r === 0 ? 0 : (s.avail_in -= r, t.set(s.input.subarray(s.next_in, s.next_in + r), e), s.state.wrap === 1 ? s.adler = gi(s.adler, t, r, e) : s.state.wrap === 2 && (s.adler = it(s.adler, t, r, e)), s.next_in += r, s.total_in += r, r);
}, Fa = (s, t) => {
  let e, i, r = s.max_chain_length, o = s.strstart, n = s.prev_length, a = s.nice_match;
  const l = s.strstart > s.w_size - Mt ? s.strstart - (s.w_size - Mt) : 0, c = s.window, d = s.w_mask, h = s.prev, A = s.strstart + le;
  let p = c[o + n - 1], _ = c[o + n];
  s.prev_length >= s.good_match && (r >>= 2), a > s.lookahead && (a = s.lookahead);
  do
    if (e = t, c[e + n] === _ && c[e + n - 1] === p && c[e] === c[o] && c[++e] === c[o + 1]) {
      o += 2, e++;
      do
        ;
      while (c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && c[++o] === c[++e] && o < A);
      if (i = le - (A - o), o = A - le, i > n) {
        if (s.match_start = t, n = i, i >= a) break;
        p = c[o + n - 1], _ = c[o + n];
      }
    }
  while ((t = h[t & d]) > l && --r != 0);
  return n <= s.lookahead ? n : s.lookahead;
}, Me = (s) => {
  const t = s.w_size;
  let e, i, r;
  do {
    if (i = s.window_size - s.lookahead - s.strstart, s.strstart >= t + (t - Mt) && (s.window.set(s.window.subarray(t, t + t - i), 0), s.match_start -= t, s.strstart -= t, s.block_start -= t, s.insert > s.strstart && (s.insert = s.strstart), iA(s), i += t), s.strm.avail_in === 0) break;
    if (e = dr(s.strm, s.window, s.strstart + s.lookahead, i), s.lookahead += e, s.legacy_hash) {
      if (s.lookahead + s.insert >= 3) for (r = s.strstart - s.insert, s.ins_h = s.window[r], s.ins_h = Hr(s, s.ins_h, s.window[r + 1]); s.insert && (pe(s, r), r++, s.insert--, !(s.lookahead + s.insert < 3)); ) ;
    } else if (s.lookahead + s.insert > 3) for (r = s.strstart - s.insert; s.insert && (pe(s, r), r++, s.insert--, !(s.lookahead + s.insert <= 3)); ) ;
  } while (s.lookahead < Mt && s.strm.avail_in !== 0);
}, Oa = (s, t) => {
  let e, i, r, o = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5, n = 0, a = s.strm.avail_in;
  do {
    if (e = 65535, r = s.bi_valid + 42 >> 3, s.strm.avail_out < r || (r = s.strm.avail_out - r, i = s.strstart - s.block_start, e > i + s.strm.avail_in && (e = i + s.strm.avail_in), e > r && (e = r), e < o && (e === 0 && t !== _t || t === qt || e !== i + s.strm.avail_in))) break;
    n = t === _t && e === i + s.strm.avail_in ? 1 : 0, cr(s, 0, 0, n), s.pending_buf[s.pending - 4] = e, s.pending_buf[s.pending - 3] = e >> 8, s.pending_buf[s.pending - 2] = ~e, s.pending_buf[s.pending - 1] = ~e >> 8, gt(s.strm), i && (i > e && (i = e), s.strm.output.set(s.window.subarray(s.block_start, s.block_start + i), s.strm.next_out), s.strm.next_out += i, s.strm.avail_out -= i, s.strm.total_out += i, s.block_start += i, e -= i), e && (dr(s.strm, s.strm.output, s.strm.next_out, e), s.strm.next_out += e, s.strm.avail_out -= e, s.strm.total_out += e);
  } while (n === 0);
  return a -= s.strm.avail_in, a && (a >= s.w_size ? (s.matches = 2, s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0), s.strstart = s.w_size, s.insert = s.strstart) : (s.window_size - s.strstart <= a && (s.strstart -= s.w_size, s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0), s.matches < 2 && s.matches++, s.insert > s.strstart && (s.insert = s.strstart)), s.window.set(s.strm.input.subarray(s.strm.next_in - a, s.strm.next_in), s.strstart), s.strstart += a, s.insert += a > s.w_size - s.insert ? s.w_size - s.insert : a), s.block_start = s.strstart), s.high_water < s.strstart && (s.high_water = s.strstart), n ? 4 : t !== qt && t !== _t && s.strm.avail_in === 0 && s.strstart === s.block_start ? 2 : (r = s.window_size - s.strstart, s.strm.avail_in > r && s.block_start >= s.w_size && (s.block_start -= s.w_size, s.strstart -= s.w_size, s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0), s.matches < 2 && s.matches++, r += s.w_size, s.insert > s.strstart && (s.insert = s.strstart)), r > s.strm.avail_in && (r = s.strm.avail_in), r && (dr(s.strm, s.window, s.strstart, r), s.strstart += r, s.insert += r > s.w_size - s.insert ? s.w_size - s.insert : r), s.high_water < s.strstart && (s.high_water = s.strstart), r = s.bi_valid + 42 >> 3, r = s.pending_buf_size - r > 65535 ? 65535 : s.pending_buf_size - r, o = r > s.w_size ? s.w_size : r, i = s.strstart - s.block_start, (i >= o || (i || t === _t) && t !== qt && s.strm.avail_in === 0 && i <= r) && (e = i > r ? r : i, n = t === _t && s.strm.avail_in === 0 && e === i ? 1 : 0, cr(s, s.block_start, e, n), s.block_start += e, gt(s.strm)), n ? 3 : 1);
}, Qs = (s, t) => {
  let e, i;
  for (; ; ) {
    if (s.lookahead < Mt) {
      if (Me(s), s.lookahead < Mt && t === qt) return 1;
      if (s.lookahead === 0) break;
    }
    if (e = 0, s.lookahead >= 3 && (e = pe(s, s.strstart)), e !== 0 && s.strstart - e <= s.w_size - Mt && (s.match_length = Fa(s, e)), s.match_length >= 3) if (i = Vt(s, s.strstart - s.match_start, s.match_length - 3), s.lookahead -= s.match_length, s.match_length <= s.max_lazy_match && s.lookahead >= 3) {
      s.match_length--;
      do
        s.strstart++, e = pe(s, s.strstart);
      while (--s.match_length != 0);
      s.strstart++;
    } else s.strstart += s.match_length, s.match_length = 0, s.legacy_hash && (s.ins_h = s.window[s.strstart], s.ins_h = Hr(s, s.ins_h, s.window[s.strstart + 1]));
    else i = Vt(s, 0, s.window[s.strstart]), s.lookahead--, s.strstart++;
    if (i && (ut(s, !1), s.strm.avail_out === 0)) return 1;
  }
  return s.insert = s.strstart < 2 ? s.strstart : 2, t === _t ? (ut(s, !0), s.strm.avail_out === 0 ? 3 : 4) : s.sym_next && (ut(s, !1), s.strm.avail_out === 0) ? 1 : 2;
}, me = (s, t) => {
  let e, i, r;
  for (; ; ) {
    if (s.lookahead < Mt) {
      if (Me(s), s.lookahead < Mt && t === qt) return 1;
      if (s.lookahead === 0) break;
    }
    if (e = 0, s.lookahead >= 3 && (e = pe(s, s.strstart)), s.prev_length = s.match_length, s.prev_match = s.match_start, s.match_length = 2, e !== 0 && s.prev_length < s.max_lazy_match && s.strstart - e <= s.w_size - Mt && (s.match_length = Fa(s, e), s.match_length <= 5 && (s.strategy === qh || s.match_length === 3 && s.strstart - s.match_start > 4096) && (s.match_length = 2)), s.prev_length >= 3 && s.match_length <= s.prev_length) {
      r = s.strstart + s.lookahead - 3, i = Vt(s, s.strstart - 1 - s.prev_match, s.prev_length - 3), s.lookahead -= s.prev_length - 1, s.prev_length -= 2;
      do
        ++s.strstart <= r && (e = pe(s, s.strstart));
      while (--s.prev_length != 0);
      if (s.match_available = 0, s.match_length = 2, s.strstart++, i && (ut(s, !1), s.strm.avail_out === 0)) return 1;
    } else if (s.match_available) {
      if (i = Vt(s, 0, s.window[s.strstart - 1]), i && ut(s, !1), s.strstart++, s.lookahead--, s.strm.avail_out === 0) return 1;
    } else s.match_available = 1, s.strstart++, s.lookahead--;
  }
  return s.match_available && (i = Vt(s, 0, s.window[s.strstart - 1]), s.match_available = 0), s.insert = s.strstart < 2 ? s.strstart : 2, t === _t ? (ut(s, !0), s.strm.avail_out === 0 ? 3 : 4) : s.sym_next && (ut(s, !1), s.strm.avail_out === 0) ? 1 : 2;
};
function Ct(s, t, e, i, r) {
  this.good_length = s, this.max_lazy = t, this.nice_length = e, this.max_chain = i, this.func = r;
}
const Ye = [new Ct(0, 0, 0, 0, Oa), new Ct(4, 4, 8, 4, Qs), new Ct(4, 5, 16, 8, Qs), new Ct(4, 6, 32, 32, Qs), new Ct(4, 4, 16, 16, me), new Ct(8, 16, 32, 32, me), new Ct(8, 16, 128, 128, me), new Ct(8, 32, 128, 256, me), new Ct(32, 128, 258, 1024, me), new Ct(32, 258, 258, 4096, me)];
function sA() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Xi, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.legacy_hash = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(1146), this.dyn_dtree = new Uint16Array(122), this.bl_tree = new Uint16Array(78), jt(this.dyn_ltree), jt(this.dyn_dtree), jt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(16), this.heap = new Uint16Array(573), jt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(573), jt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const Xe = (s) => {
  if (!s) return 1;
  const t = s.state;
  return !t || t.strm !== s || t.status !== De && t.status !== 57 && t.status !== 69 && t.status !== 73 && t.status !== 91 && t.status !== 103 && t.status !== re && t.status !== Le ? 1 : 0;
}, Pa = (s) => {
  if (Xe(s)) return oe(s, Rt);
  s.total_in = s.total_out = 0, s.data_type = eA;
  const t = s.state;
  return t.pending = 0, t.pending_out = 0, t.wrap < 0 && (t.wrap = -t.wrap), t.status = t.wrap === 2 ? 57 : t.wrap ? De : re, s.adler = t.wrap === 2 ? 0 : 1, t.last_flush = -2, Nh(t), st;
}, Ua = (s) => {
  const t = Pa(s);
  var e;
  return t === st && ((e = s.state).window_size = 2 * e.w_size, jt(e.head), e.max_lazy_match = Ye[e.level].max_lazy, e.good_match = Ye[e.level].good_length, e.nice_match = Ye[e.level].nice_length, e.max_chain_length = Ye[e.level].max_chain, e.strstart = 0, e.block_start = 0, e.lookahead = 0, e.insert = 0, e.match_length = e.prev_length = 2, e.match_available = 0, e.ins_h = 0), t;
}, Zo = (s, t, e, i, r, o, n) => {
  if (!s) return Rt;
  let a = 1;
  if (t === Vh && (t = 6), i < 0 ? (a = 0, i = -i) : i > 15 && (a = 2, i -= 16), r < 1 || r > 9 || e !== Xi || i < 8 || i > 15 || t < 0 || t > 9 || o < 0 || o > Xh || i === 8 && a !== 1) return oe(s, Rt);
  i === 8 && (i = 9);
  const l = new sA();
  return s.state = l, l.strm = s, l.status = De, l.wrap = a, l.gzhead = null, l.w_bits = i, l.w_size = 1 << l.w_bits, l.w_mask = l.w_size - 1, l.legacy_hash = n ? 1 : 0, l.hash_bits = r + 7, !l.legacy_hash && l.hash_bits < 15 && (l.hash_bits = 15), l.hash_size = 1 << l.hash_bits, l.hash_mask = l.hash_size - 1, l.hash_shift = ~~((l.hash_bits + 3 - 1) / 3), l.window = new Uint8Array(2 * l.w_size), l.head = new Uint16Array(l.hash_size), l.prev = new Uint16Array(l.w_size), l.lit_bufsize = 1 << r + 6, l.pending_buf_size = 4 * l.lit_bufsize, l.pending_buf = new Uint8Array(l.pending_buf_size), l.sym_buf = l.lit_bufsize, l.sym_end = 3 * (l.lit_bufsize - 1), l.level = t, l.strategy = o, l.method = e, Ua(s);
};
var rA = (s, t) => {
  let e = t.length;
  if (Xe(s)) return Rt;
  const i = s.state, r = i.wrap;
  if (r === 2 || r === 1 && i.status !== De || i.lookahead) return Rt;
  if (r === 1 && (s.adler = gi(s.adler, t, e, 0)), i.wrap = 0, e >= i.w_size) {
    r === 0 && (jt(i.head), i.strstart = 0, i.block_start = 0, i.insert = 0);
    let l = new Uint8Array(i.w_size);
    l.set(t.subarray(e - i.w_size, e), 0), t = l, e = i.w_size;
  }
  const o = s.avail_in, n = s.next_in, a = s.input;
  for (s.avail_in = e, s.next_in = 0, s.input = t, Me(i); i.lookahead >= 3; ) {
    let l = i.strstart, c = i.lookahead - 2;
    do
      pe(i, l), l++;
    while (--c);
    i.strstart = l, i.lookahead = 2, Me(i);
  }
  return i.strstart += i.lookahead, i.block_start = i.strstart, i.insert = i.lookahead, i.lookahead = 0, i.match_length = i.prev_length = 2, i.match_available = 0, s.next_in = n, s.input = a, s.avail_in = o, i.wrap = r, st;
}, ti = { deflateInit: (s, t) => Zo(s, t, Xi, 15, 8, tA), deflateInit2: Zo, deflateReset: Ua, deflateResetKeep: Pa, deflateSetHeader: (s, t) => Xe(s) || s.state.wrap !== 2 ? Rt : (s.state.gzhead = t, st), deflate: (s, t) => {
  if (Xe(s) || t > Wo || t < 0) return s ? oe(s, Rt) : Rt;
  const e = s.state;
  if (!s.output || s.avail_in !== 0 && !s.input || e.status === Le && t !== _t) return oe(s, s.avail_out === 0 ? Us : Rt);
  const i = e.last_flush;
  if (e.last_flush = t, e.pending !== 0) {
    if (gt(s), s.avail_out === 0) return e.last_flush = -1, st;
  } else if (s.avail_in === 0 && qo(t) <= qo(i) && t !== _t) return oe(s, Us);
  if (e.status === Le && s.avail_in !== 0) return oe(s, Us);
  if (e.status === De && e.wrap === 0 && (e.status = re), e.status === De) {
    let r = Xi + (e.w_bits - 8 << 4) << 8, o = -1;
    if (o = e.strategy >= xi || e.level < 2 ? 0 : e.level < 6 ? 1 : e.level === 6 ? 2 : 3, r |= o << 6, e.strstart !== 0 && (r |= 32), r += 31 - r % 31, Ue(e, r), e.strstart !== 0 && (Ue(e, s.adler >>> 16), Ue(e, 65535 & s.adler)), s.adler = 1, e.status = re, gt(s), e.pending !== 0) return e.last_flush = -1, st;
  }
  if (e.status === 57) {
    if (s.adler = 0, G(e, 31), G(e, 139), G(e, 8), e.gzhead) G(e, (e.gzhead.text ? 1 : 0) + (e.gzhead.hcrc ? 2 : 0) + (e.gzhead.extra ? 4 : 0) + (e.gzhead.name ? 8 : 0) + (e.gzhead.comment ? 16 : 0)), G(e, 255 & e.gzhead.time), G(e, e.gzhead.time >> 8 & 255), G(e, e.gzhead.time >> 16 & 255), G(e, e.gzhead.time >> 24 & 255), G(e, e.level === 9 ? 2 : e.strategy >= xi || e.level < 2 ? 4 : 0), G(e, 255 & e.gzhead.os), e.gzhead.extra && e.gzhead.extra.length && (G(e, 255 & e.gzhead.extra.length), G(e, e.gzhead.extra.length >> 8 & 255)), e.gzhead.hcrc && (s.adler = it(s.adler, e.pending_buf, e.pending, 0)), e.gzindex = 0, e.status = 69;
    else if (G(e, 0), G(e, 0), G(e, 0), G(e, 0), G(e, 0), G(e, e.level === 9 ? 2 : e.strategy >= xi || e.level < 2 ? 4 : 0), G(e, 3), e.status = re, gt(s), e.pending !== 0) return e.last_flush = -1, st;
  }
  if (e.status === 69) {
    if (e.gzhead.extra) {
      let r = e.pending, o = (65535 & e.gzhead.extra.length) - e.gzindex;
      for (; e.pending + o > e.pending_buf_size; ) {
        let a = e.pending_buf_size - e.pending;
        if (e.pending_buf.set(e.gzhead.extra.subarray(e.gzindex, e.gzindex + a), e.pending), e.pending = e.pending_buf_size, e.gzhead.hcrc && e.pending > r && (s.adler = it(s.adler, e.pending_buf, e.pending - r, r)), e.gzindex += a, gt(s), e.pending !== 0) return e.last_flush = -1, st;
        r = 0, o -= a;
      }
      let n = new Uint8Array(e.gzhead.extra);
      e.pending_buf.set(n.subarray(e.gzindex, e.gzindex + o), e.pending), e.pending += o, e.gzhead.hcrc && e.pending > r && (s.adler = it(s.adler, e.pending_buf, e.pending - r, r)), e.gzindex = 0;
    }
    e.status = 73;
  }
  if (e.status === 73) {
    if (e.gzhead.name) {
      let r, o = e.pending;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > o && (s.adler = it(s.adler, e.pending_buf, e.pending - o, o)), gt(s), e.pending !== 0) return e.last_flush = -1, st;
          o = 0;
        }
        r = e.gzindex < e.gzhead.name.length ? 255 & e.gzhead.name.charCodeAt(e.gzindex++) : 0, G(e, r);
      } while (r !== 0);
      e.gzhead.hcrc && e.pending > o && (s.adler = it(s.adler, e.pending_buf, e.pending - o, o)), e.gzindex = 0;
    }
    e.status = 91;
  }
  if (e.status === 91) {
    if (e.gzhead.comment) {
      let r, o = e.pending;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > o && (s.adler = it(s.adler, e.pending_buf, e.pending - o, o)), gt(s), e.pending !== 0) return e.last_flush = -1, st;
          o = 0;
        }
        r = e.gzindex < e.gzhead.comment.length ? 255 & e.gzhead.comment.charCodeAt(e.gzindex++) : 0, G(e, r);
      } while (r !== 0);
      e.gzhead.hcrc && e.pending > o && (s.adler = it(s.adler, e.pending_buf, e.pending - o, o));
    }
    e.status = 103;
  }
  if (e.status === 103) {
    if (e.gzhead.hcrc) {
      if (e.pending + 2 > e.pending_buf_size && (gt(s), e.pending !== 0)) return e.last_flush = -1, st;
      G(e, 255 & s.adler), G(e, s.adler >> 8 & 255), s.adler = 0;
    }
    if (e.status = re, gt(s), e.pending !== 0) return e.last_flush = -1, st;
  }
  if (s.avail_in !== 0 || e.lookahead !== 0 || t !== qt && e.status !== Le) {
    let r = e.level === 0 ? Oa(e, t) : e.strategy === xi ? ((o, n) => {
      let a;
      for (; ; ) {
        if (o.lookahead === 0 && (Me(o), o.lookahead === 0)) {
          if (n === qt) return 1;
          break;
        }
        if (o.match_length = 0, a = Vt(o, 0, o.window[o.strstart]), o.lookahead--, o.strstart++, a && (ut(o, !1), o.strm.avail_out === 0)) return 1;
      }
      return o.insert = 0, n === _t ? (ut(o, !0), o.strm.avail_out === 0 ? 3 : 4) : o.sym_next && (ut(o, !1), o.strm.avail_out === 0) ? 1 : 2;
    })(e, t) : e.strategy === Zh ? ((o, n) => {
      let a, l, c, d;
      const h = o.window;
      for (; ; ) {
        if (o.lookahead <= le) {
          if (Me(o), o.lookahead <= le && n === qt) return 1;
          if (o.lookahead === 0) break;
        }
        if (o.match_length = 0, o.lookahead >= 3 && o.strstart > 0 && (c = o.strstart - 1, l = h[c], l === h[++c] && l === h[++c] && l === h[++c])) {
          d = o.strstart + le;
          do
            ;
          while (l === h[++c] && l === h[++c] && l === h[++c] && l === h[++c] && l === h[++c] && l === h[++c] && l === h[++c] && l === h[++c] && c < d);
          o.match_length = le - (d - c), o.match_length > o.lookahead && (o.match_length = o.lookahead);
        }
        if (o.match_length >= 3 ? (a = Vt(o, 1, o.match_length - 3), o.lookahead -= o.match_length, o.strstart += o.match_length, o.match_length = 0) : (a = Vt(o, 0, o.window[o.strstart]), o.lookahead--, o.strstart++), a && (ut(o, !1), o.strm.avail_out === 0)) return 1;
      }
      return o.insert = 0, n === _t ? (ut(o, !0), o.strm.avail_out === 0 ? 3 : 4) : o.sym_next && (ut(o, !1), o.strm.avail_out === 0) ? 1 : 2;
    })(e, t) : Ye[e.level].func(e, t);
    if (r !== 3 && r !== 4 || (e.status = Le), r === 1 || r === 3) return s.avail_out === 0 && (e.last_flush = -1), st;
    if (r === 2 && (t === Jh ? zh(e) : t !== Wo && (cr(e, 0, 0, !1), t === jh && (jt(e.head), e.lookahead === 0 && (e.strstart = 0, e.block_start = 0, e.insert = 0))), gt(s), s.avail_out === 0)) return e.last_flush = -1, st;
  }
  return t !== _t ? st : e.wrap <= 0 ? Vo : (e.wrap === 2 ? (G(e, 255 & s.adler), G(e, s.adler >> 8 & 255), G(e, s.adler >> 16 & 255), G(e, s.adler >> 24 & 255), G(e, 255 & s.total_in), G(e, s.total_in >> 8 & 255), G(e, s.total_in >> 16 & 255), G(e, s.total_in >> 24 & 255)) : (Ue(e, s.adler >>> 16), Ue(e, 65535 & s.adler)), gt(s), e.wrap > 0 && (e.wrap = -e.wrap), e.pending !== 0 ? st : Vo);
}, deflateEnd: (s) => {
  if (Xe(s)) return Rt;
  const t = s.state.status;
  return s.state = null, t === re ? oe(s, Wh) : st;
}, deflateSetDictionary: rA, deflateInfo: "pako deflate (from Nodeca project)" };
const oA = (s, t) => Object.prototype.hasOwnProperty.call(s, t);
var As = { assign: function(s) {
  const t = Array.prototype.slice.call(arguments, 1);
  for (; t.length; ) {
    const e = t.shift();
    if (e) {
      if (typeof e != "object") throw new TypeError(e + "must be non-object");
      for (const i in e) oA(e, i) && (s[i] = e[i]);
    }
  }
  return s;
}, flattenChunks: (s) => {
  let t = 0;
  for (let i = 0, r = s.length; i < r; i++) t += s[i].length;
  const e = new Uint8Array(t);
  for (let i = 0, r = 0, o = s.length; i < o; i++) {
    let n = s[i];
    e.set(n, r), r += n.length;
  }
  return e;
} };
let Qa = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  Qa = !1;
}
const ui = new Uint8Array(256);
for (let s = 0; s < 256; s++) ui[s] = s >= 252 ? 6 : s >= 248 ? 5 : s >= 240 ? 4 : s >= 224 ? 3 : s >= 192 ? 2 : 1;
ui[254] = ui[255] = 1;
var fi = { string2buf: (s) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode) return new TextEncoder().encode(s);
  let t, e, i, r, o, n = s.length, a = 0;
  for (r = 0; r < n; r++) e = s.charCodeAt(r), (64512 & e) == 55296 && r + 1 < n && (i = s.charCodeAt(r + 1), (64512 & i) == 56320 && (e = 65536 + (e - 55296 << 10) + (i - 56320), r++)), a += e < 128 ? 1 : e < 2048 ? 2 : e < 65536 ? 3 : 4;
  for (t = new Uint8Array(a), o = 0, r = 0; o < a; r++) e = s.charCodeAt(r), (64512 & e) == 55296 && r + 1 < n && (i = s.charCodeAt(r + 1), (64512 & i) == 56320 && (e = 65536 + (e - 55296 << 10) + (i - 56320), r++)), e < 128 ? t[o++] = e : e < 2048 ? (t[o++] = 192 | e >>> 6, t[o++] = 128 | 63 & e) : e < 65536 ? (t[o++] = 224 | e >>> 12, t[o++] = 128 | e >>> 6 & 63, t[o++] = 128 | 63 & e) : (t[o++] = 240 | e >>> 18, t[o++] = 128 | e >>> 12 & 63, t[o++] = 128 | e >>> 6 & 63, t[o++] = 128 | 63 & e);
  return t;
}, buf2string: (s, t) => {
  const e = t || s.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode) return new TextDecoder().decode(s.subarray(0, t));
  let i, r;
  const o = new Array(2 * e);
  for (r = 0, i = 0; i < e; ) {
    let n = s[i++];
    if (n < 128) {
      o[r++] = n;
      continue;
    }
    let a = ui[n];
    if (a > 4) o[r++] = 65533, i += a - 1;
    else {
      for (n &= a === 2 ? 31 : a === 3 ? 15 : 7; a > 1 && i < e; ) n = n << 6 | 63 & s[i++], a--;
      a > 1 ? o[r++] = 65533 : n < 65536 ? o[r++] = n : (n -= 65536, o[r++] = 55296 | n >> 10 & 1023, o[r++] = 56320 | 1023 & n);
    }
  }
  return ((n, a) => {
    if (a < 65534 && n.subarray && Qa) return String.fromCharCode.apply(null, n.length === a ? n : n.subarray(0, a));
    let l = "";
    for (let c = 0; c < a; c++) l += String.fromCharCode(n[c]);
    return l;
  })(o, r);
}, utf8border: (s, t) => {
  (t = t || s.length) > s.length && (t = s.length);
  let e = t - 1;
  for (; e >= 0 && (192 & s[e]) == 128; ) e--;
  return e < 0 || e === 0 ? t : e + ui[s[e]] > t ? e : t;
} }, Ha = function() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
};
const $a = Object.prototype.toString, { Z_NO_FLUSH: nA, Z_SYNC_FLUSH: aA, Z_FULL_FLUSH: lA, Z_FINISH: cA, Z_OK: ts, Z_STREAM_END: dA, Z_DEFAULT_COMPRESSION: hA, Z_DEFAULT_STRATEGY: AA, Z_DEFLATED: pA } = hs, gA = { level: hA, method: pA, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: AA, legacyHash: !0 };
function Yi(s) {
  this.options = As.assign({}, gA, s || {});
  let t = this.options;
  t.raw && t.windowBits > 0 ? t.windowBits = -t.windowBits : t.gzip && t.windowBits > 0 && t.windowBits < 16 && (t.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Ha(), this.strm.avail_out = 0;
  let e = ti.deflateInit2(this.strm, t.level, t.method, t.windowBits, t.memLevel, t.strategy, t.legacyHash);
  if (e !== ts) throw new Error(Re[e]);
  if (t.header && ti.deflateSetHeader(this.strm, t.header), t.dictionary) {
    let i;
    if (i = typeof t.dictionary == "string" ? fi.string2buf(t.dictionary) : $a.call(t.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(t.dictionary) : t.dictionary, e = ti.deflateSetDictionary(this.strm, i), e !== ts) throw new Error(Re[e]);
    this._dict_set = !0;
  }
}
Yi.prototype.push = function(s, t) {
  const e = this.strm, i = this.options.chunkSize;
  let r, o;
  if (this.ended) return !1;
  for (o = t === ~~t ? t : t === !0 ? cA : nA, typeof s == "string" ? e.input = fi.string2buf(s) : $a.call(s) === "[object ArrayBuffer]" ? e.input = new Uint8Array(s) : e.input = s, e.next_in = 0, e.avail_in = e.input.length; ; ) if (e.avail_out === 0 && (e.output = new Uint8Array(i), e.next_out = 0, e.avail_out = i), (o === aA || o === lA) && e.avail_out <= 6) this.onData(e.output.subarray(0, e.next_out)), e.avail_out = 0;
  else {
    if (r = ti.deflate(e, o), r === dA) return e.next_out > 0 && this.onData(e.output.subarray(0, e.next_out)), r = ti.deflateEnd(this.strm), this.onEnd(r), this.ended = !0, r === ts;
    if (e.avail_out !== 0) {
      if (o > 0 && e.next_out > 0) this.onData(e.output.subarray(0, e.next_out)), e.avail_out = 0;
      else if (e.avail_in === 0) break;
    } else this.onData(e.output);
  }
  return !0;
}, Yi.prototype.onData = function(s) {
  this.chunks.push(s);
}, Yi.prototype.onEnd = function(s) {
  s === ts && (this.result = As.flattenChunks(this.chunks)), this.chunks = [], this.err = s, this.msg = this.strm.msg;
};
var uA = { deflate: function(s, t) {
  const e = new Yi(t);
  if (e.push(s, !0), e.err) throw e.msg || Re[e.err];
  return e.result;
} };
const Si = 16209;
var fA = function(s, t) {
  let e, i, r, o, n, a, l, c, d, h, A, p, _, u, f, w, b, m, C, R, E, M, D, x;
  const S = s.state;
  e = s.next_in, D = s.input, i = e + (s.avail_in - 5), r = s.next_out, x = s.output, o = r - (t - s.avail_out), n = r + (s.avail_out - 257), a = S.dmax, l = S.wsize, c = S.whave, d = S.wnext, h = S.window, A = S.hold, p = S.bits, _ = S.lencode, u = S.distcode, f = (1 << S.lenbits) - 1, w = (1 << S.distbits) - 1;
  t: do {
    p < 15 && (A += D[e++] << p, p += 8, A += D[e++] << p, p += 8), b = _[A & f];
    e: for (; ; ) {
      if (m = b >>> 24, A >>>= m, p -= m, m = b >>> 16 & 255, m === 0) x[r++] = 65535 & b;
      else {
        if (!(16 & m)) {
          if ((64 & m) == 0) {
            b = _[(65535 & b) + (A & (1 << m) - 1)];
            continue e;
          }
          if (32 & m) {
            S.mode = 16191;
            break t;
          }
          s.msg = "invalid literal/length code", S.mode = Si;
          break t;
        }
        C = 65535 & b, m &= 15, m && (p < m && (A += D[e++] << p, p += 8), C += A & (1 << m) - 1, A >>>= m, p -= m), p < 15 && (A += D[e++] << p, p += 8, A += D[e++] << p, p += 8), b = u[A & w];
        i: for (; ; ) {
          if (m = b >>> 24, A >>>= m, p -= m, m = b >>> 16 & 255, !(16 & m)) {
            if ((64 & m) == 0) {
              b = u[(65535 & b) + (A & (1 << m) - 1)];
              continue i;
            }
            s.msg = "invalid distance code", S.mode = Si;
            break t;
          }
          if (R = 65535 & b, m &= 15, p < m && (A += D[e++] << p, p += 8, p < m && (A += D[e++] << p, p += 8)), R += A & (1 << m) - 1, R > a) {
            s.msg = "invalid distance too far back", S.mode = Si;
            break t;
          }
          if (A >>>= m, p -= m, m = r - o, R > m) {
            if (m = R - m, m > c && S.sane) {
              s.msg = "invalid distance too far back", S.mode = Si;
              break t;
            }
            if (E = 0, M = h, d === 0) {
              if (E += l - m, m < C) {
                C -= m;
                do
                  x[r++] = h[E++];
                while (--m);
                E = r - R, M = x;
              }
            } else if (d < m) {
              if (E += l + d - m, m -= d, m < C) {
                C -= m;
                do
                  x[r++] = h[E++];
                while (--m);
                if (E = 0, d < C) {
                  m = d, C -= m;
                  do
                    x[r++] = h[E++];
                  while (--m);
                  E = r - R, M = x;
                }
              }
            } else if (E += d - m, m < C) {
              C -= m;
              do
                x[r++] = h[E++];
              while (--m);
              E = r - R, M = x;
            }
            for (; C > 2; ) x[r++] = M[E++], x[r++] = M[E++], x[r++] = M[E++], C -= 3;
            C && (x[r++] = M[E++], C > 1 && (x[r++] = M[E++]));
          } else {
            E = r - R;
            do
              x[r++] = x[E++], x[r++] = x[E++], x[r++] = x[E++], C -= 3;
            while (C > 2);
            C && (x[r++] = x[E++], C > 1 && (x[r++] = x[E++]));
          }
          break;
        }
      }
      break;
    }
  } while (e < i && r < n);
  C = p >> 3, e -= C, p -= C << 3, A &= (1 << p) - 1, s.next_in = e, s.next_out = r, s.avail_in = e < i ? i - e + 5 : 5 - (e - i), s.avail_out = r < n ? n - r + 257 : 257 - (r - n), S.hold = A, S.bits = p;
};
const Ri = 15, mA = new Uint16Array([3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0]), _A = new Uint8Array([16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 199, 75]), vA = new Uint16Array([1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0]), EA = new Uint8Array([16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64]);
var ei = (s, t, e, i, r, o, n, a) => {
  const l = a.bits;
  let c, d, h, A, p, _, u = 0, f = 0, w = 0, b = 0, m = 0, C = 0, R = 0, E = 0, M = 0, D = 0, x = null;
  const S = new Uint16Array(16), T = new Uint16Array(16);
  let k, N, et, bt = null;
  for (u = 0; u <= Ri; u++) S[u] = 0;
  for (f = 0; f < i; f++) S[t[e + f]]++;
  for (m = l, b = Ri; b >= 1 && S[b] === 0; b--) ;
  if (m > b && (m = b), b === 0) return r[o++] = 20971520, r[o++] = 20971520, a.bits = 1, 0;
  for (w = 1; w < b && S[w] === 0; w++) ;
  for (m < w && (m = w), E = 1, u = 1; u <= Ri; u++) if (E <<= 1, E -= S[u], E < 0) return -1;
  if (E > 0 && (s === 0 || b !== 1)) return -1;
  for (T[1] = 0, u = 1; u < Ri; u++) T[u + 1] = T[u] + S[u];
  for (f = 0; f < i; f++) t[e + f] !== 0 && (n[T[t[e + f]]++] = f);
  if (s === 0 ? (x = bt = n, _ = 20) : s === 1 ? (x = mA, bt = _A, _ = 257) : (x = vA, bt = EA, _ = 0), D = 0, f = 0, u = w, p = o, C = m, R = 0, h = -1, M = 1 << m, A = M - 1, s === 1 && M > 852 || s === 2 && M > 592) return 1;
  for (; ; ) {
    k = u - R, n[f] + 1 < _ ? (N = 0, et = n[f]) : n[f] >= _ ? (N = bt[n[f] - _], et = x[n[f] - _]) : (N = 96, et = 0), c = 1 << u - R, d = 1 << C, w = d;
    do
      d -= c, r[p + (D >> R) + d] = k << 24 | N << 16 | et | 0;
    while (d !== 0);
    for (c = 1 << u - 1; D & c; ) c >>= 1;
    if (c !== 0 ? (D &= c - 1, D += c) : D = 0, f++, --S[u] == 0) {
      if (u === b) break;
      u = t[e + n[f]];
    }
    if (u > m && (D & A) !== h) {
      for (R === 0 && (R = m), p += w, C = u - R, E = 1 << C; C + R < b && (E -= S[C + R], !(E <= 0)); ) C++, E <<= 1;
      if (M += 1 << C, s === 1 && M > 852 || s === 2 && M > 592) return 1;
      h = D & A, r[h] = m << 24 | C << 16 | p - o | 0;
    }
  }
  return D !== 0 && (r[p + D] = u - R << 24 | 64 << 16 | 0), a.bits = m, 0;
};
const { Z_FINISH: Xo, Z_BLOCK: wA, Z_TREES: Di, Z_OK: ce, Z_STREAM_END: bA, Z_NEED_DICT: yA, Z_STREAM_ERROR: vt, Z_DATA_ERROR: Ga, Z_MEM_ERROR: La, Z_BUF_ERROR: CA, Z_DEFLATED: tn } = hs, ps = 16180, es = 16190, kt = 16191, Hs = 16192, $s = 16194, Mi = 16199, Ti = 16200, Gs = 16206, W = 16209, en = (s) => (s >>> 24 & 255) + (s >>> 8 & 65280) + ((65280 & s) << 8) + ((255 & s) << 24);
function BA() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const de = (s) => {
  if (!s) return 1;
  const t = s.state;
  return !t || t.strm !== s || t.mode < ps || t.mode > 16211 ? 1 : 0;
}, Ya = (s) => {
  if (de(s)) return vt;
  const t = s.state;
  return s.total_in = s.total_out = t.total = 0, s.msg = "", t.wrap && (s.adler = 1 & t.wrap), t.mode = ps, t.last = 0, t.havedict = 0, t.flags = -1, t.dmax = 32768, t.head = null, t.hold = 0, t.bits = 0, t.lencode = t.lendyn = new Int32Array(852), t.distcode = t.distdyn = new Int32Array(592), t.sane = 1, t.back = -1, ce;
}, Na = (s) => {
  if (de(s)) return vt;
  const t = s.state;
  return t.wsize = 0, t.whave = 0, t.wnext = 0, Ya(s);
}, Ka = (s, t) => {
  let e;
  if (de(s)) return vt;
  const i = s.state;
  return t < 0 ? (e = 0, t = -t) : (e = 5 + (t >> 4), t < 48 && (t &= 15)), t && (t < 8 || t > 15) ? vt : (i.window !== null && i.wbits !== t && (i.window = null), i.wrap = e, i.wbits = t, Na(s));
}, sn = (s, t) => {
  if (!s) return vt;
  const e = new BA();
  s.state = e, e.strm = s, e.window = null, e.mode = ps;
  const i = Ka(s, t);
  return i !== ce && (s.state = null), i;
};
let Ls, Ys, rn = !0;
const IA = (s) => {
  if (rn) {
    Ls = new Int32Array(512), Ys = new Int32Array(32);
    let t = 0;
    for (; t < 144; ) s.lens[t++] = 8;
    for (; t < 256; ) s.lens[t++] = 9;
    for (; t < 280; ) s.lens[t++] = 7;
    for (; t < 288; ) s.lens[t++] = 8;
    for (ei(1, s.lens, 0, 288, Ls, 0, s.work, { bits: 9 }), t = 0; t < 32; ) s.lens[t++] = 5;
    ei(2, s.lens, 0, 32, Ys, 0, s.work, { bits: 5 }), rn = !1;
  }
  s.lencode = Ls, s.lenbits = 9, s.distcode = Ys, s.distbits = 5;
}, za = (s, t, e, i) => {
  let r;
  const o = s.state;
  return o.window === null && (o.window = new Uint8Array(1 << o.wbits)), o.wsize === 0 && (o.wsize = 1 << o.wbits, o.wnext = 0, o.whave = 0), i >= o.wsize ? (o.window.set(t.subarray(e - o.wsize, e), 0), o.wnext = 0, o.whave = o.wsize) : (r = o.wsize - o.wnext, r > i && (r = i), o.window.set(t.subarray(e - i, e - i + r), o.wnext), (i -= r) ? (o.window.set(t.subarray(e - i, e), 0), o.wnext = i, o.whave = o.wsize) : (o.wnext += r, o.wnext === o.wsize && (o.wnext = 0), o.whave < o.wsize && (o.whave += r))), 0;
};
var xA = (s, t) => {
  let e, i, r, o, n, a, l, c, d, h, A, p, _, u, f, w, b, m, C, R, E, M, D = 0;
  const x = new Uint8Array(4);
  let S, T;
  const k = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  if (de(s) || !s.output || !s.input && s.avail_in !== 0) return vt;
  e = s.state, e.mode === kt && (e.mode = Hs), n = s.next_out, r = s.output, l = s.avail_out, o = s.next_in, i = s.input, a = s.avail_in, c = e.hold, d = e.bits, h = a, A = l, M = ce;
  t: for (; ; ) switch (e.mode) {
    case ps:
      if (e.wrap === 0) {
        e.mode = Hs;
        break;
      }
      for (; d < 16; ) {
        if (a === 0) break t;
        a--, c += i[o++] << d, d += 8;
      }
      if (2 & e.wrap && c === 35615) {
        e.wbits === 0 && (e.wbits = 15), e.check = 0, x[0] = 255 & c, x[1] = c >>> 8 & 255, e.check = it(e.check, x, 2, 0), c = 0, d = 0, e.mode = 16181;
        break;
      }
      if (e.head && (e.head.done = !1), !(1 & e.wrap) || (((255 & c) << 8) + (c >> 8)) % 31) {
        s.msg = "incorrect header check", e.mode = W;
        break;
      }
      if ((15 & c) !== tn) {
        s.msg = "unknown compression method", e.mode = W;
        break;
      }
      if (c >>>= 4, d -= 4, E = 8 + (15 & c), e.wbits === 0 && (e.wbits = E), E > 15 || E > e.wbits) {
        s.msg = "invalid window size", e.mode = W;
        break;
      }
      e.dmax = 1 << e.wbits, e.flags = 0, s.adler = e.check = 1, e.mode = 512 & c ? 16189 : kt, c = 0, d = 0;
      break;
    case 16181:
      for (; d < 16; ) {
        if (a === 0) break t;
        a--, c += i[o++] << d, d += 8;
      }
      if (e.flags = c, (255 & e.flags) !== tn) {
        s.msg = "unknown compression method", e.mode = W;
        break;
      }
      if (57344 & e.flags) {
        s.msg = "unknown header flags set", e.mode = W;
        break;
      }
      e.head && (e.head.text = c >> 8 & 1), 512 & e.flags && 4 & e.wrap && (x[0] = 255 & c, x[1] = c >>> 8 & 255, e.check = it(e.check, x, 2, 0)), c = 0, d = 0, e.mode = 16182;
    case 16182:
      for (; d < 32; ) {
        if (a === 0) break t;
        a--, c += i[o++] << d, d += 8;
      }
      e.head && (e.head.time = c), 512 & e.flags && 4 & e.wrap && (x[0] = 255 & c, x[1] = c >>> 8 & 255, x[2] = c >>> 16 & 255, x[3] = c >>> 24 & 255, e.check = it(e.check, x, 4, 0)), c = 0, d = 0, e.mode = 16183;
    case 16183:
      for (; d < 16; ) {
        if (a === 0) break t;
        a--, c += i[o++] << d, d += 8;
      }
      e.head && (e.head.xflags = 255 & c, e.head.os = c >> 8), 512 & e.flags && 4 & e.wrap && (x[0] = 255 & c, x[1] = c >>> 8 & 255, e.check = it(e.check, x, 2, 0)), c = 0, d = 0, e.mode = 16184;
    case 16184:
      if (1024 & e.flags) {
        for (; d < 16; ) {
          if (a === 0) break t;
          a--, c += i[o++] << d, d += 8;
        }
        e.length = c, e.head && (e.head.extra_len = c), 512 & e.flags && 4 & e.wrap && (x[0] = 255 & c, x[1] = c >>> 8 & 255, e.check = it(e.check, x, 2, 0)), c = 0, d = 0;
      } else e.head && (e.head.extra = null);
      e.mode = 16185;
    case 16185:
      if (1024 & e.flags && (p = e.length, p > a && (p = a), p && (e.head && (E = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Uint8Array(e.head.extra_len)), e.head.extra.set(i.subarray(o, o + p), E)), 512 & e.flags && 4 & e.wrap && (e.check = it(e.check, i, p, o)), a -= p, o += p, e.length -= p), e.length)) break t;
      e.length = 0, e.mode = 16186;
    case 16186:
      if (2048 & e.flags) {
        if (a === 0) break t;
        p = 0;
        do
          E = i[o + p++], e.head && E && e.length < 65536 && (e.head.name += String.fromCharCode(E));
        while (E && p < a);
        if (512 & e.flags && 4 & e.wrap && (e.check = it(e.check, i, p, o)), a -= p, o += p, E) break t;
      } else e.head && (e.head.name = null);
      e.length = 0, e.mode = 16187;
    case 16187:
      if (4096 & e.flags) {
        if (a === 0) break t;
        p = 0;
        do
          E = i[o + p++], e.head && E && e.length < 65536 && (e.head.comment += String.fromCharCode(E));
        while (E && p < a);
        if (512 & e.flags && 4 & e.wrap && (e.check = it(e.check, i, p, o)), a -= p, o += p, E) break t;
      } else e.head && (e.head.comment = null);
      e.mode = 16188;
    case 16188:
      if (512 & e.flags) {
        for (; d < 16; ) {
          if (a === 0) break t;
          a--, c += i[o++] << d, d += 8;
        }
        if (4 & e.wrap && c !== (65535 & e.check)) {
          s.msg = "header crc mismatch", e.mode = W;
          break;
        }
        c = 0, d = 0;
      }
      e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), s.adler = e.check = 0, e.mode = kt;
      break;
    case 16189:
      for (; d < 32; ) {
        if (a === 0) break t;
        a--, c += i[o++] << d, d += 8;
      }
      s.adler = e.check = en(c), c = 0, d = 0, e.mode = es;
    case es:
      if (e.havedict === 0) return s.next_out = n, s.avail_out = l, s.next_in = o, s.avail_in = a, e.hold = c, e.bits = d, yA;
      s.adler = e.check = 1, e.mode = kt;
    case kt:
      if (t === wA || t === Di) break t;
    case Hs:
      if (e.last) {
        c >>>= 7 & d, d -= 7 & d, e.mode = Gs;
        break;
      }
      for (; d < 3; ) {
        if (a === 0) break t;
        a--, c += i[o++] << d, d += 8;
      }
      switch (e.last = 1 & c, c >>>= 1, d -= 1, 3 & c) {
        case 0:
          e.mode = 16193;
          break;
        case 1:
          if (IA(e), e.mode = Mi, t === Di) {
            c >>>= 2, d -= 2;
            break t;
          }
          break;
        case 2:
          e.mode = 16196;
          break;
        case 3:
          s.msg = "invalid block type", e.mode = W;
      }
      c >>>= 2, d -= 2;
      break;
    case 16193:
      for (c >>>= 7 & d, d -= 7 & d; d < 32; ) {
        if (a === 0) break t;
        a--, c += i[o++] << d, d += 8;
      }
      if ((65535 & c) != (c >>> 16 ^ 65535)) {
        s.msg = "invalid stored block lengths", e.mode = W;
        break;
      }
      if (e.length = 65535 & c, c = 0, d = 0, e.mode = $s, t === Di) break t;
    case $s:
      e.mode = 16195;
    case 16195:
      if (p = e.length, p) {
        if (p > a && (p = a), p > l && (p = l), p === 0) break t;
        r.set(i.subarray(o, o + p), n), a -= p, o += p, l -= p, n += p, e.length -= p;
        break;
      }
      e.mode = kt;
      break;
    case 16196:
      for (; d < 14; ) {
        if (a === 0) break t;
        a--, c += i[o++] << d, d += 8;
      }
      if (e.nlen = 257 + (31 & c), c >>>= 5, d -= 5, e.ndist = 1 + (31 & c), c >>>= 5, d -= 5, e.ncode = 4 + (15 & c), c >>>= 4, d -= 4, e.nlen > 286 || e.ndist > 30) {
        s.msg = "too many length or distance symbols", e.mode = W;
        break;
      }
      e.have = 0, e.mode = 16197;
    case 16197:
      for (; e.have < e.ncode; ) {
        for (; d < 3; ) {
          if (a === 0) break t;
          a--, c += i[o++] << d, d += 8;
        }
        e.lens[k[e.have++]] = 7 & c, c >>>= 3, d -= 3;
      }
      for (; e.have < 19; ) e.lens[k[e.have++]] = 0;
      if (e.lencode = e.lendyn, e.lenbits = 7, S = { bits: e.lenbits }, M = ei(0, e.lens, 0, 19, e.lencode, 0, e.work, S), e.lenbits = S.bits, M) {
        s.msg = "invalid code lengths set", e.mode = W;
        break;
      }
      e.have = 0, e.mode = 16198;
    case 16198:
      for (; e.have < e.nlen + e.ndist; ) {
        for (; D = e.lencode[c & (1 << e.lenbits) - 1], f = D >>> 24, w = D >>> 16 & 255, b = 65535 & D, !(f <= d); ) {
          if (a === 0) break t;
          a--, c += i[o++] << d, d += 8;
        }
        if (b < 16) c >>>= f, d -= f, e.lens[e.have++] = b;
        else {
          if (b === 16) {
            for (T = f + 2; d < T; ) {
              if (a === 0) break t;
              a--, c += i[o++] << d, d += 8;
            }
            if (c >>>= f, d -= f, e.have === 0) {
              s.msg = "invalid bit length repeat", e.mode = W;
              break;
            }
            E = e.lens[e.have - 1], p = 3 + (3 & c), c >>>= 2, d -= 2;
          } else if (b === 17) {
            for (T = f + 3; d < T; ) {
              if (a === 0) break t;
              a--, c += i[o++] << d, d += 8;
            }
            c >>>= f, d -= f, E = 0, p = 3 + (7 & c), c >>>= 3, d -= 3;
          } else {
            for (T = f + 7; d < T; ) {
              if (a === 0) break t;
              a--, c += i[o++] << d, d += 8;
            }
            c >>>= f, d -= f, E = 0, p = 11 + (127 & c), c >>>= 7, d -= 7;
          }
          if (e.have + p > e.nlen + e.ndist) {
            s.msg = "invalid bit length repeat", e.mode = W;
            break;
          }
          for (; p--; ) e.lens[e.have++] = E;
        }
      }
      if (e.mode === W) break;
      if (e.lens[256] === 0) {
        s.msg = "invalid code -- missing end-of-block", e.mode = W;
        break;
      }
      if (e.lenbits = 9, S = { bits: e.lenbits }, M = ei(1, e.lens, 0, e.nlen, e.lencode, 0, e.work, S), e.lenbits = S.bits, M) {
        s.msg = "invalid literal/lengths set", e.mode = W;
        break;
      }
      if (e.distbits = 6, e.distcode = e.distdyn, S = { bits: e.distbits }, M = ei(2, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, S), e.distbits = S.bits, M) {
        s.msg = "invalid distances set", e.mode = W;
        break;
      }
      if (e.mode = Mi, t === Di) break t;
    case Mi:
      e.mode = Ti;
    case Ti:
      if (a >= 6 && l >= 258) {
        s.next_out = n, s.avail_out = l, s.next_in = o, s.avail_in = a, e.hold = c, e.bits = d, fA(s, A), n = s.next_out, r = s.output, l = s.avail_out, o = s.next_in, i = s.input, a = s.avail_in, c = e.hold, d = e.bits, e.mode === kt && (e.back = -1);
        break;
      }
      for (e.back = 0; D = e.lencode[c & (1 << e.lenbits) - 1], f = D >>> 24, w = D >>> 16 & 255, b = 65535 & D, !(f <= d); ) {
        if (a === 0) break t;
        a--, c += i[o++] << d, d += 8;
      }
      if (w && (240 & w) == 0) {
        for (m = f, C = w, R = b; D = e.lencode[R + ((c & (1 << m + C) - 1) >> m)], f = D >>> 24, w = D >>> 16 & 255, b = 65535 & D, !(m + f <= d); ) {
          if (a === 0) break t;
          a--, c += i[o++] << d, d += 8;
        }
        c >>>= m, d -= m, e.back += m;
      }
      if (c >>>= f, d -= f, e.back += f, e.length = b, w === 0) {
        e.mode = 16205;
        break;
      }
      if (32 & w) {
        e.back = -1, e.mode = kt;
        break;
      }
      if (64 & w) {
        s.msg = "invalid literal/length code", e.mode = W;
        break;
      }
      e.extra = 15 & w, e.mode = 16201;
    case 16201:
      if (e.extra) {
        for (T = e.extra; d < T; ) {
          if (a === 0) break t;
          a--, c += i[o++] << d, d += 8;
        }
        e.length += c & (1 << e.extra) - 1, c >>>= e.extra, d -= e.extra, e.back += e.extra;
      }
      e.was = e.length, e.mode = 16202;
    case 16202:
      for (; D = e.distcode[c & (1 << e.distbits) - 1], f = D >>> 24, w = D >>> 16 & 255, b = 65535 & D, !(f <= d); ) {
        if (a === 0) break t;
        a--, c += i[o++] << d, d += 8;
      }
      if ((240 & w) == 0) {
        for (m = f, C = w, R = b; D = e.distcode[R + ((c & (1 << m + C) - 1) >> m)], f = D >>> 24, w = D >>> 16 & 255, b = 65535 & D, !(m + f <= d); ) {
          if (a === 0) break t;
          a--, c += i[o++] << d, d += 8;
        }
        c >>>= m, d -= m, e.back += m;
      }
      if (c >>>= f, d -= f, e.back += f, 64 & w) {
        s.msg = "invalid distance code", e.mode = W;
        break;
      }
      e.offset = b, e.extra = 15 & w, e.mode = 16203;
    case 16203:
      if (e.extra) {
        for (T = e.extra; d < T; ) {
          if (a === 0) break t;
          a--, c += i[o++] << d, d += 8;
        }
        e.offset += c & (1 << e.extra) - 1, c >>>= e.extra, d -= e.extra, e.back += e.extra;
      }
      if (e.offset > e.dmax) {
        s.msg = "invalid distance too far back", e.mode = W;
        break;
      }
      e.mode = 16204;
    case 16204:
      if (l === 0) break t;
      if (p = A - l, e.offset > p) {
        if (p = e.offset - p, p > e.whave && e.sane) {
          s.msg = "invalid distance too far back", e.mode = W;
          break;
        }
        p > e.wnext ? (p -= e.wnext, _ = e.wsize - p) : _ = e.wnext - p, p > e.length && (p = e.length), u = e.window;
      } else u = r, _ = n - e.offset, p = e.length;
      p > l && (p = l), l -= p, e.length -= p;
      do
        r[n++] = u[_++];
      while (--p);
      e.length === 0 && (e.mode = Ti);
      break;
    case 16205:
      if (l === 0) break t;
      r[n++] = e.length, l--, e.mode = Ti;
      break;
    case Gs:
      if (e.wrap) {
        for (; d < 32; ) {
          if (a === 0) break t;
          a--, c |= i[o++] << d, d += 8;
        }
        if (A -= l, s.total_out += A, e.total += A, 4 & e.wrap && A && (s.adler = e.check = e.flags ? it(e.check, r, A, n - A) : gi(e.check, r, A, n - A)), A = l, 4 & e.wrap && (e.flags ? c : en(c)) !== e.check) {
          s.msg = "incorrect data check", e.mode = W;
          break;
        }
        c = 0, d = 0;
      }
      e.mode = 16207;
    case 16207:
      if (e.wrap && e.flags) {
        for (; d < 32; ) {
          if (a === 0) break t;
          a--, c += i[o++] << d, d += 8;
        }
        if (4 & e.wrap && c !== (4294967295 & e.total)) {
          s.msg = "incorrect length check", e.mode = W;
          break;
        }
        c = 0, d = 0;
      }
      e.mode = 16208;
    case 16208:
      M = bA;
      break t;
    case W:
      M = Ga;
      break t;
    case 16210:
      return La;
    default:
      return vt;
  }
  return s.next_out = n, s.avail_out = l, s.next_in = o, s.avail_in = a, e.hold = c, e.bits = d, (e.wsize || A !== s.avail_out && e.mode < W && (e.mode < Gs || t !== Xo)) && za(s, s.output, s.next_out, A - s.avail_out), h -= s.avail_in, A -= s.avail_out, s.total_in += h, s.total_out += A, e.total += A, 4 & e.wrap && A && (s.adler = e.check = e.flags ? it(e.check, r, A, s.next_out - A) : gi(e.check, r, A, s.next_out - A)), s.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === kt ? 128 : 0) + (e.mode === Mi || e.mode === $s ? 256 : 0), (h === 0 && A === 0 || t === Xo) && M === ce && (M = CA), M;
}, xt = { inflateReset: Na, inflateReset2: Ka, inflateResetKeep: Ya, inflateInit: (s) => sn(s, 15), inflateInit2: sn, inflate: xA, inflateEnd: (s) => {
  if (de(s)) return vt;
  let t = s.state;
  return t.window && (t.window = null), s.state = null, ce;
}, inflateGetHeader: (s, t) => {
  if (de(s)) return vt;
  const e = s.state;
  return (2 & e.wrap) == 0 ? vt : (e.head = t, t.done = !1, ce);
}, inflateSetDictionary: (s, t) => {
  const e = t.length;
  let i, r, o;
  return de(s) ? vt : (i = s.state, i.wrap !== 0 && i.mode !== es ? vt : i.mode === es && (r = 1, r = gi(r, t, e, 0), r !== i.check) ? Ga : (o = za(s, t, e, e), o ? (i.mode = 16210, La) : (i.havedict = 1, ce)));
}, inflateInfo: "pako inflate (from Nodeca project)" }, SA = function() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
};
const Ja = Object.prototype.toString, { Z_NO_FLUSH: RA, Z_FINISH: on, Z_OK: we, Z_STREAM_END: Ns, Z_NEED_DICT: Ks, Z_STREAM_ERROR: DA, Z_DATA_ERROR: nn, Z_MEM_ERROR: MA, Z_BUF_ERROR: an } = hs, TA = { chunkSize: 65536, windowBits: 15, to: "" };
function Ni(s) {
  this.options = As.assign({}, TA, s || {});
  const t = this.options;
  t.raw && t.windowBits >= 0 && t.windowBits < 16 && (t.windowBits = -t.windowBits, t.windowBits === 0 && (t.windowBits = -15)), !(t.windowBits >= 0 && t.windowBits < 16) || s && s.windowBits || (t.windowBits += 32), t.windowBits > 15 && t.windowBits < 48 && (15 & t.windowBits) == 0 && (t.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Ha(), this.strm.avail_out = 0;
  let e = xt.inflateInit2(this.strm, t.windowBits);
  if (e !== we) throw new Error(Re[e]);
  if (this.header = new SA(), xt.inflateGetHeader(this.strm, this.header), t.dictionary && (typeof t.dictionary == "string" ? t.dictionary = fi.string2buf(t.dictionary) : Ja.call(t.dictionary) === "[object ArrayBuffer]" && (t.dictionary = new Uint8Array(t.dictionary)), t.raw && (e = xt.inflateSetDictionary(this.strm, t.dictionary), e !== we))) throw new Error(Re[e]);
}
Ni.prototype.push = function(s, t) {
  const e = this.strm, i = this.options.chunkSize, r = this.options.dictionary;
  let o, n, a;
  if (this.ended) return !1;
  for (n = t === ~~t ? t : t === !0 ? on : RA, Ja.call(s) === "[object ArrayBuffer]" ? e.input = new Uint8Array(s) : e.input = s, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    for (e.avail_out === 0 && (e.output = new Uint8Array(i), e.next_out = 0, e.avail_out = i), o = xt.inflate(e, n), o === Ks && r && (o = xt.inflateSetDictionary(e, r), o === we ? o = xt.inflate(e, n) : o === nn && (o = Ks)); e.avail_in > 0 && o === Ns && 2 & e.state.wrap && e.state.flags !== 0 && e.input[e.next_in] !== 0; ) xt.inflateReset(e), o = xt.inflate(e, n);
    switch (o) {
      case DA:
      case nn:
      case Ks:
      case MA:
        return this.onEnd(o), this.ended = !0, !1;
    }
    if (a = e.avail_out, e.next_out && (e.avail_out === 0 || o === Ns || n > 0)) if (this.options.to === "string") {
      let l = fi.utf8border(e.output, e.next_out), c = e.next_out - l, d = fi.buf2string(e.output, l);
      e.next_out = c, e.avail_out = i - c, c && e.output.set(e.output.subarray(l, l + c), 0), this.onData(d);
    } else this.onData(e.output.length === e.next_out ? e.output : e.output.subarray(0, e.next_out)), e.avail_out = 0, e.next_out = 0;
    if (o !== we && o !== an || a !== 0) {
      if (o === Ns) return o = xt.inflateEnd(this.strm), this.onEnd(o), this.ended = !0, !0;
      if (e.avail_in === 0) {
        if (n === on) return o = xt.inflateEnd(this.strm), this.onEnd(o === we ? an : o), this.ended = !0, !1;
        break;
      }
    }
  }
  return !0;
}, Ni.prototype.onData = function(s) {
  this.chunks.push(s);
}, Ni.prototype.onEnd = function(s) {
  s === we && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = As.flattenChunks(this.chunks)), this.chunks = [], this.err = s, this.msg = this.strm.msg;
};
var kA = { Inflate: Ni };
const { deflate: FA } = uA, { Inflate: OA } = kA;
var PA = FA, UA = OA;
function hr(s, t, e = 255) {
  const i = s.length % t;
  if (i !== 0) {
    const r = new Uint8Array(t - i).fill(e), o = new Uint8Array(s.length + r.length);
    return o.set(s), o.set(r, s.length), o;
  }
  return s;
}
function ln(s, t = 239) {
  for (let e = 0; e < s.length; e++) t ^= s[e];
  return t;
}
function gs(s) {
  const t = new Uint8Array(s.length);
  for (let e = 0; e < s.length; e++) t[e] = s.charCodeAt(e);
  return t;
}
function ii(s) {
  return new Promise(((t) => setTimeout(t, s)));
}
class $r {
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
        const o = r.slice(0, 16), n = String.fromCharCode(...o).split("").map(((a) => a === " " || a >= " " && a <= "~" && a !== "  " ? a : ".")).join("");
        r = r.slice(16), i += `
    ${this.hexify(o.slice(0, 8))} ${this.hexify(o.slice(8))} | ${n}`;
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
        await ii(1);
      }
      if (!r || r.length === 0) {
        const n = e === null ? "Serial data stream stopped: Possible serial noise or corruption." : "No serial data received.";
        throw this.tracing && this.trace(n), new Error(n);
      }
      this.tracing && this.trace(`Read ${r.length} bytes: ${this.hexConvert(r)}`);
      for (let n = 0; n < r.length; n++) {
        const a = r[n];
        if (e === null) {
          if (a !== this.SLIP_END) {
            this.tracing && this.trace(`Read invalid data: ${this.hexConvert(r)}`);
            const l = this.buffer;
            throw this.tracing && this.trace(`Remaining data in serial buffer: ${this.hexConvert(l)}`), this.detectPanicHandler(new Uint8Array([...r, ...l || []])), new Error(`Invalid head of packet (0x${a.toString(16)}): Possible serial noise or corruption.`);
          }
          e = new Uint8Array(0);
        } else if (i) if (i = !1, a === this.SLIP_ESC_END) e = this.appendArray(e, new Uint8Array([this.SLIP_END]));
        else {
          if (a !== this.SLIP_ESC_ESC) {
            this.tracing && this.trace(`Read invalid data: ${this.hexConvert(r)}`);
            const l = this.buffer;
            throw this.tracing && this.trace(`Remaining data in serial buffer: ${this.hexConvert(l)}`), this.detectPanicHandler(new Uint8Array([...r, ...l || []])), new Error(`Invalid SLIP escape (0xdb, 0x${a.toString(16)})`);
          }
          e = this.appendArray(e, new Uint8Array([this.SLIP_ESC]));
        }
        else if (a === this.SLIP_ESC) i = !0;
        else {
          if (a === this.SLIP_END) {
            if (this.tracing && this.trace(`Received full packet: ${this.hexConvert(e)}`), n + 1 < r.length) {
              const l = r.slice(n + 1);
              this.buffer = this.appendArray(l, this.buffer);
            }
            return e;
          }
          e = this.appendArray(e, new Uint8Array([a]));
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
    for (; this.device.readable && this.device.readable.locked || this.device.writable && this.device.writable.locked; ) await ii(t);
  }
  async disconnect() {
    var t, e;
    !((t = this.device.readable) === null || t === void 0) && t.locked && await ((e = this.reader) === null || e === void 0 ? void 0 : e.cancel()), await this.waitForUnlock(400), await this.device.close(), this.reader = void 0;
  }
}
function Qt(s) {
  return new Promise(((t) => setTimeout(t, s)));
}
class QA {
  constructor(t, e) {
    this.resetDelay = e, this.transport = t;
  }
  async reset() {
    await this.transport.setDTR(!1), await this.transport.setRTS(!0), await Qt(100), await this.transport.setDTR(!0), await this.transport.setRTS(!1), await Qt(this.resetDelay), await this.transport.setDTR(!1);
  }
}
class HA {
  constructor(t) {
    this.transport = t;
  }
  async reset() {
    await this.transport.setRTS(!1), await this.transport.setDTR(!1), await Qt(100), await this.transport.setDTR(!0), await this.transport.setRTS(!1), await Qt(100), await this.transport.setRTS(!0), await this.transport.setDTR(!1), await this.transport.setRTS(!0), await Qt(100), await this.transport.setRTS(!1), await this.transport.setDTR(!1);
  }
}
class ja {
  constructor(t, e = !1) {
    this.transport = t, this.usingUsbOtg = e, this.transport = t;
  }
  async reset() {
    this.usingUsbOtg ? (await Qt(200), await this.transport.setRTS(!1), await Qt(200)) : (await Qt(100), await this.transport.setRTS(!1));
  }
}
class $A {
  constructor(t, e) {
    this.transport = t, this.sequenceString = e, this.transport = t;
  }
  async reset() {
    const t = { D: async (e) => await this.transport.setDTR(e), R: async (e) => await this.transport.setRTS(e), W: async (e) => await Qt(e) };
    try {
      if (!(function(i) {
        const r = ["D", "R", "W"], o = i.split("|");
        for (const n of o) {
          const a = n[0], l = n.slice(1);
          if (!r.includes(a)) return !1;
          if (a === "D" || a === "R") {
            if (l !== "0" && l !== "1") return !1;
          } else if (a === "W") {
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
function GA(s) {
  return s && s.__esModule && Object.prototype.hasOwnProperty.call(s, "default") ? s.default : s;
}
var cn, dn, LA = GA(dn ? cn : (dn = 1, cn = function(s) {
  return atob(s);
}));
async function hn(s, t) {
  let e;
  switch (s) {
    case "ESP32":
      e = await Promise.resolve().then(() => ag);
      break;
    case "ESP32-C2":
      e = await Promise.resolve().then(() => cg);
      break;
    case "ESP32-C3":
      e = await Promise.resolve().then(() => hg);
      break;
    case "ESP32-C5":
      e = await Promise.resolve().then(() => pg);
      break;
    case "ESP32-C6":
      e = await Promise.resolve().then(() => ug);
      break;
    case "ESP32-C61":
      e = await Promise.resolve().then(() => mg);
      break;
    case "ESP32-H2":
      e = await Promise.resolve().then(() => vg);
      break;
    case "ESP32-P4":
      e = t && t < 300 ? await Promise.resolve().then(() => wg) : await Promise.resolve().then(() => yg);
      break;
    case "ESP32-S2":
      e = await Promise.resolve().then(() => Bg);
      break;
    case "ESP32-S3":
      e = await Promise.resolve().then(() => xg);
      break;
    case "ESP8266":
      e = await Promise.resolve().then(() => Rg);
  }
  if (e) return { bss_start: e.bss_start, data: e.data, data_start: e.data_start, entry: e.entry, text: e.text, text_start: e.text_start, decodedData: An(e.data), decodedText: An(e.text) };
}
function An(s) {
  const t = LA(s).split("").map((function(e) {
    return e.charCodeAt(0);
  }));
  return new Uint8Array(t);
}
class Gr {
  constructor() {
    this.FLASH_SIZES = { "1MB": 0, "2MB": 16, "4MB": 32, "8MB": 48, "16MB": 64, "32MB": 80, "64MB": 96, "128MB": 112 }, this.FLASH_FREQUENCY = { "80m": 15, "40m": 0, "26m": 1, "20m": 2 };
  }
  getEraseSize(t, e) {
    return e;
  }
}
class Te extends Gr {
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
Te.IROM_MAP_START = 1075838976, Te.IROM_MAP_END = 1076887552;
var YA = Object.freeze({ __proto__: null, ESP8266ROM: Te });
const _i = 233;
function si(s, t) {
  return s + (t - 1 - s % t);
}
function zs(s, t) {
  return s[t] | s[t + 1] << 8 | s[t + 2] << 16 | s[t + 3] << 24;
}
class Zt {
  constructor(t, e, i = null, r = 0) {
    this.addr = t, this.data = e, this.fileOffs = i, this.flags = r, this.includeInChecksum = !0, this.addr !== 0 && this.padToAlignment(4);
  }
  copyWithNewAddr(t) {
    return new Zt(t, this.data, 0);
  }
  splitImage(t) {
    const e = new Zt(this.addr, this.data.slice(0, t), 0);
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
    this.data = hr(this.data, t, 0);
  }
}
class pn extends Zt {
  constructor(t, e, i, r) {
    super(e, i, null, r), this.name = t;
  }
  toString() {
    return `${this.name} ${super.toString()}`;
  }
}
class Lr {
  constructor(t) {
    this.SEG_HEADER_LEN = 8, this.SHA256_DIGEST_LEN = 32, this.ELF_FLAG_WRITE = 1, this.ELF_FLAG_READ = 2, this.ELF_FLAG_EXEC = 4, this.segments = [], this.entrypoint = 0, this.elfSha256 = null, this.elfSha256Offset = 0, this.padToSize = 0, this.flashMode = 0, this.flashSizeFreq = 0, this.checksum = 0, this.datalength = 0, this.IROM_ALIGN = 0, this.MMU_PAGE_SIZE_CONF = [], this.ROM_LOADER = t;
  }
  loadCommonHeader(t, e, i) {
    const r = t[e], o = t[e + 1];
    if (this.flashMode = t[e + 2], this.flashSizeFreq = t[e + 3], this.entrypoint = zs(t, e + 4), r !== i) throw new L(`Invalid firmware image magic=0x${r.toString(16)}`);
    return o;
  }
  verify() {
    if (this.segments.length > 16) throw new L(`Invalid segment count ${this.segments.length} (max 16). Usually this indicates a linker script problem.`);
  }
  loadSegment(t, e, i = !1) {
    const r = e, o = zs(t, e), n = zs(t, e + 4);
    this.warnIfUnusualSegment(o, n, i);
    const a = t.slice(e + 8, e + 8 + n);
    if (a.length < n) throw new L(`End of file reading segment 0x${o.toString(16)}, length ${n} (actual length ${a.length})`);
    const l = new Zt(o, a, r);
    return this.segments.push(l), l;
  }
  warnIfUnusualSegment(t, e, i) {
    i || (t > 1075838976 || t < 1073610752 || e > 65536) && console.warn(`WARNING: Suspicious segment 0x${t.toString(16)}, length ${e}`);
  }
  maybePatchSegmentData(t, e) {
    const i = t.length;
    if (this.elfSha256Offset >= e && this.elfSha256Offset < e + i) {
      const r = this.elfSha256Offset - e;
      if (r < this.SEG_HEADER_LEN || r + this.SHA256_DIGEST_LEN > i) throw new L(`Cannot place SHA256 digest on segment boundary(elf_sha256_offset=${this.elfSha256Offset}, file_pos=${e}, segment_size=${i})`);
      const o = r - this.SEG_HEADER_LEN;
      if (!t.slice(o, o + this.SHA256_DIGEST_LEN).every(((d) => d === 0))) throw new L(`Contents of segment at SHA256 digest offset 0x${this.elfSha256Offset.toString(16)} are not all zero. Refusing to overwrite.`);
      if (!this.elfSha256 || this.elfSha256.length !== this.SHA256_DIGEST_LEN) throw new L("ELF SHA256 digest is not properly initialized");
      const n = t.slice(0, o), a = t.slice(o + this.SHA256_DIGEST_LEN), l = n.length + this.elfSha256.length + a.length, c = new Uint8Array(l);
      return c.set(n, 0), c.set(this.elfSha256, n.length), c.set(a, n.length + this.elfSha256.length), c;
    }
    return t;
  }
  saveSegment(t, e, i, r = null) {
    const o = this.maybePatchSegmentData(i.data, e), n = new DataView(t.buffer, e);
    return n.setUint32(0, i.addr, !0), n.setUint32(4, o.length, !0), t.set(o, e + 8), r !== null ? ln(o, r) : 0;
  }
  saveFlashSegment(t, e, i, r = null) {
    if (this.ROM_LOADER.CHIP_NAME === "ESP32") {
      const o = (e + i.data.length + this.SEG_HEADER_LEN) % this.IROM_ALIGN;
      if (o < 36) {
        const n = new Uint8Array(i.data.length + (36 - o));
        n.set(i.data), n.fill(0, i.data.length), i.data = n;
      }
    }
    return this.saveSegment(t, e, i, r);
  }
  readChecksum(t, e) {
    return t[si(e, 16)];
  }
  calculateChecksum() {
    let t = 239;
    for (const e of this.segments) e.includeInChecksum && (t = ln(e.data, t));
    return t;
  }
  appendChecksum(t, e, i) {
    t[si(e, 16)] = i;
  }
  writeCommonHeader(t, e, i) {
    t[e] = _i, t[e + 1] = i, t[e + 2] = this.flashMode, t[e + 3] = this.flashSizeFreq, new DataView(t.buffer, e + 4).setUint32(0, this.entrypoint, !0);
  }
  isIromAddr(t) {
    return Te.IROM_MAP_START <= t && t < Te.IROM_MAP_END;
  }
  getIromSegment() {
    const t = this.segments.filter(((e) => this.isIromAddr(e.addr)));
    if (t.length > 0) {
      if (t.length !== 1) throw new L(`Found ${t.length} segments that could be irom0. Bad ELF file?`);
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
        throw new L(`${t} bytes is not a valid ${this.ROM_LOADER.CHIP_NAME} page size, select from ${e}.`);
      }
      this.IROM_ALIGN = t;
    } else console.warn(`WARNING: Changing MMU page size is not supported on ${this.ROM_LOADER.CHIP_NAME}! ` + (this.IROM_ALIGN !== 0 ? `Defaulting to ${this.IROM_ALIGN / 1024}KB.` : ""));
  }
}
class te extends Lr {
  constructor(t, e = null, i = !0, r = !1) {
    super(t), this.securePad = null, this.flashMode = 0, this.flashSizeFreq = 0, this.version = 1, this.WP_PIN_DISABLED = 238, this.wpPin = this.WP_PIN_DISABLED, this.clkDrv = 0, this.qDrv = 0, this.dDrv = 0, this.csDrv = 0, this.hdDrv = 0, this.wpDrv = 0, this.chipId = 0, this.minRev = 0, this.minRevFull = 0, this.maxRevFull = 0, this.storedDigest = null, this.calcDigest = null, this.dataLength = 0, this.IROM_ALIGN = 65536, this.ROM_LOADER = t, this.appendDigest = i, this.ramOnlyHeader = r, e !== null && this.loadFromFile(e);
  }
  async loadFromFile(t) {
    const e = t instanceof Uint8Array ? t : gs(t);
    let i = 0;
    const r = this.loadCommonHeader(e, i, _i);
    i += 8, this.loadExtendedHeader(e, i), i += 16;
    for (let o = 0; o < r; o++)
      i += 8 + this.loadSegment(e, i).data.length;
    if (this.checksum = this.readChecksum(e, i), i = si(i, 16), this.appendDigest) {
      const o = i;
      this.storedDigest = e.slice(i, i + this.SHA256_DIGEST_LEN);
      const n = await crypto.subtle.digest("SHA-256", e.slice(0, o));
      this.calcDigest = new Uint8Array(n), this.dataLength = o - 0;
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
    const o = this.segments.filter(((l) => this.isFlashAddr(l.addr))).sort(((l, c) => l.addr - c.addr)), n = this.segments.filter(((l) => !this.isFlashAddr(l.addr))).sort(((l, c) => l.addr - c.addr));
    for (let l = 0; l < o.length; l++) {
      const c = o[l];
      if (c instanceof pn && c.name === ".flash.appdesc") {
        o.splice(l, 1), o.unshift(c);
        break;
      }
    }
    for (let l = 0; l < n.length; l++) {
      const c = n[l];
      if (c instanceof pn && c.name === ".dram0.bootdesc") {
        n.splice(l, 1), n.unshift(c);
        break;
      }
    }
    if (o.length > 0) {
      let l = o[0].addr;
      for (const c of o.slice(1)) {
        if (Math.floor(c.addr / this.IROM_ALIGN) === Math.floor(l / this.IROM_ALIGN)) throw new L(`Segment loaded at 0x${c.addr.toString(16)} lands in same 64KB flash mapping as segment loaded at 0x${l.toString(16)}. Can't generate binary. Suggest changing linker script or ELF to merge sections.`);
        l = c.addr;
      }
    }
    if (this.ramOnlyHeader) {
      for (const l of n) r = this.saveSegment(e, i, l, r), i += 8 + l.data.length, t++;
      this.appendChecksum(e, i, r), i = si(i, 16);
      for (const l of o.reverse()) {
        let c = this.getAlignmentDataNeeded(l, i);
        if (c > 0) {
          c < this.ROM_LOADER.BOOTLOADER_FLASH_OFFSET - this.SEG_HEADER_LEN && (c += this.IROM_ALIGN), c -= this.ROM_LOADER.BOOTLOADER_FLASH_OFFSET;
          const d = new Zt(0, new Uint8Array(c).fill(0), i);
          r = this.saveSegment(e, i, d, r), i += 8 + c, t++;
        }
        this.saveFlashSegment(e, i, l), i += 8 + l.data.length, t++;
      }
    } else {
      for (; o.length > 0; ) {
        const l = o[0], c = this.getAlignmentDataNeeded(l, i);
        if (c > 0) {
          if (n.length > 0 && c > this.SEG_HEADER_LEN) {
            const d = n[0].splitImage(c);
            n[0].data.length === 0 && n.shift(), r = this.saveSegment(e, i, d, r);
          } else {
            const d = new Zt(0, new Uint8Array(c).fill(0), i);
            r = this.saveSegment(e, i, d, r);
          }
          i += 8 + c, t++;
        } else {
          if ((i + 8) % this.IROM_ALIGN != l.addr % this.IROM_ALIGN) throw new Error("Flash segment alignment mismatch");
          r = this.saveFlashSegment(e, i, l, r), o.shift(), i += 8 + l.data.length, t++;
        }
      }
      for (const l of n) r = this.saveSegment(e, i, l, r), i += 8 + l.data.length, t++;
    }
    if (this.securePad) {
      if (!this.appendDigest) throw new Error("secure_pad only applies if a SHA-256 digest is also appended to the image");
      const l = (i + this.SEG_HEADER_LEN) % this.IROM_ALIGN, c = 16;
      let d = 0;
      this.securePad === "1" ? d = 112 : this.securePad === "2" && (d = 32);
      const h = (this.IROM_ALIGN - l - c - d) % this.IROM_ALIGN, A = new Zt(0, new Uint8Array(h).fill(0), i);
      r = this.saveSegment(e, i, A, r), i += 8 + h, t++;
    }
    this.ramOnlyHeader || (this.appendChecksum(e, i, r), i = si(i, 16));
    const a = i;
    if (this.ramOnlyHeader ? e[1] = n.length : e[1] = t, this.appendDigest) {
      const l = await crypto.subtle.digest("SHA-256", e.slice(0, a)), c = new Uint8Array(l);
      e.set(c, a), i += 32;
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
    const n = i.getUint8(3);
    [this.hdDrv, this.wpDrv] = this.splitByte(n), this.chipId = i.getUint8(4), this.chipId !== this.ROM_LOADER.IMAGE_CHIP_ID && console.warn(`Unexpected chip id in image. Expected ${this.ROM_LOADER.IMAGE_CHIP_ID} but value was ${this.chipId}. Is this image for a different chip model?`), this.minRev = i.getUint8(5), this.minRevFull = i.getUint16(6, !0), this.maxRevFull = i.getUint16(8, !0);
    const a = i.getUint8(15);
    if (a !== 0 && a !== 1) throw new Error(`Invalid value for append_digest field (0x${a.toString(16)}). Should be 0 or 1.`);
    this.appendDigest = a === 1;
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
class NA extends Lr {
  constructor(t, e = null) {
    super(t), this.version = 1, this.ROM_LOADER = t, this.flashMode = 0, this.flashSizeFreq = 0, e !== null && this.loadFromFile(e);
  }
  loadFromFile(t) {
    const e = t instanceof Uint8Array ? t : gs(t);
    let i = 0;
    const r = this.loadCommonHeader(e, i, _i);
    i += 8;
    for (let o = 0; o < r; o++)
      i += 8 + this.loadSegment(e, i).data.length;
    this.checksum = this.readChecksum(e, i), this.verify();
  }
  defaultOutputName(t) {
    return t + "-";
  }
}
class ge extends Lr {
  constructor(t, e = null) {
    super(t), this.version = 2, this.ROM_LOADER = t, this.flashMode = 0, this.flashSizeFreq = 0, e !== null && this.loadFromFile(e);
  }
  async loadFromFile(t) {
    const e = t instanceof Uint8Array ? t : gs(t);
    let i = 0;
    const r = this.loadCommonHeader(e, i, ge.IMAGE_V2_MAGIC);
    i += 8, r !== ge.IMAGE_V2_SEGMENT && console.warn(`Warning: V2 header has unexpected "segment" count ${r} (usually 4)`);
    const o = this.flashMode, n = this.flashSizeFreq, a = this.entrypoint, l = this.loadSegment(e, i, !0);
    l.addr = 0, l.includeInChecksum = !1, i += 8 + l.data.length;
    const c = this.loadCommonHeader(e, i, _i);
    i += 8, o !== this.flashMode && console.warn(`WARNING: Flash mode value in first header (0x${o.toString(16)}) disagrees with second (0x${this.flashMode.toString(16)}). Using second value.`), n !== this.flashSizeFreq && console.warn(`WARNING: Flash size/freq value in first header (0x${n.toString(16)}) disagrees with second (0x${this.flashSizeFreq.toString(16)}). Using second value.`), a !== this.entrypoint && console.warn(`WARNING: Entrypoint address in first header (0x${a.toString(16)}) disagrees with second header (0x${this.entrypoint.toString(16)}). Using second value.`);
    for (let d = 0; d < c; d++)
      i += 8 + this.loadSegment(e, i).data.length;
    this.checksum = this.readChecksum(e, i), this.verify();
  }
  defaultOutputName(t) {
    const e = this.getIromSegment();
    let i = 0;
    return e !== null && (i = e.addr - Te.IROM_MAP_START), `${t.replace(/\.[^/.]+$/, "")}-0x${(-4096 & i).toString(16).padStart(5, "0")}.bin`;
  }
}
ge.IMAGE_V2_MAGIC = 234, ge.IMAGE_V2_SEGMENT = 4;
class KA extends te {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class zA extends te {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class JA extends te {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class jA extends te {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.MMU_PAGE_SIZE_CONF = [16384, 32768, 65536], this.ROM_LOADER = t;
  }
}
class Yr extends te {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.MMU_PAGE_SIZE_CONF = [8192, 16384, 32768, 65536], this.ROM_LOADER = t;
  }
}
class WA extends Yr {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class VA extends te {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class qA extends te {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
class ZA extends Yr {
  constructor(t, e = null, i = !0, r = !1) {
    super(t, e, i, r), this.ROM_LOADER = t;
  }
}
async function gn(s, t) {
  const e = t instanceof Uint8Array ? t : gs(t), i = s.CHIP_NAME.toLowerCase().replace(/[-()]/g, "");
  let r;
  if (i !== "esp8266") switch (i) {
    case "esp32":
      r = te;
      break;
    case "esp32s2":
      r = KA;
      break;
    case "esp32s3":
      r = zA;
      break;
    case "esp32c3":
      r = JA;
      break;
    case "esp32c2":
      r = jA;
      break;
    case "esp32c6":
      r = Yr;
      break;
    case "esp32c61":
      r = WA;
      break;
    case "esp32c5":
      r = VA;
      break;
    case "esp32h2":
      r = ZA;
      break;
    case "esp32p4":
      r = qA;
      break;
    default:
      throw new L(`Unsupported chip name: ${i}`);
  }
  else {
    const a = e[0];
    if (a === _i) r = NA;
    else {
      if (a !== ge.IMAGE_V2_MAGIC) throw new L(`Invalid image magic number: ${a}`);
      r = ge;
    }
  }
  const o = new r(s), n = o;
  if (typeof n.loadFromFile == "function") {
    const a = n.loadFromFile(e);
    a instanceof Promise && await a;
  }
  return o;
}
class XA {
  constructor(t) {
    var e, i, r, o, n, a, l, c;
    this.ESP_RAM_BLOCK = 6144, this.ESP_FLASH_BEGIN = 2, this.ESP_FLASH_DATA = 3, this.ESP_FLASH_END = 4, this.ESP_MEM_BEGIN = 5, this.ESP_MEM_END = 6, this.ESP_MEM_DATA = 7, this.ESP_WRITE_REG = 9, this.ESP_READ_REG = 10, this.ESP_SPI_ATTACH = 13, this.ESP_CHANGE_BAUDRATE = 15, this.ESP_FLASH_DEFL_BEGIN = 16, this.ESP_FLASH_DEFL_DATA = 17, this.ESP_FLASH_DEFL_END = 18, this.ESP_SPI_FLASH_MD5 = 19, this.ESP_ERASE_FLASH = 208, this.ESP_ERASE_REGION = 209, this.ESP_READ_FLASH = 210, this.ESP_RUN_USER_CODE = 211, this.ESP_IMAGE_MAGIC = 233, this.ESP_CHECKSUM_MAGIC = 239, this.ROM_INVALID_RECV_MSG = 5, this.DEFAULT_TIMEOUT = 3e3, this.ERASE_REGION_TIMEOUT_PER_MB = 3e4, this.ERASE_WRITE_TIMEOUT_PER_MB = 4e4, this.MD5_TIMEOUT_PER_MB = 8e3, this.CHIP_ERASE_TIMEOUT = 12e4, this.FLASH_READ_TIMEOUT = 1e5, this.MAX_TIMEOUT = 2 * this.CHIP_ERASE_TIMEOUT, this.SPI_ADDR_REG_MSB = !0, this.CHIP_DETECT_MAGIC_REG_ADDR = 1073745920, this.DETECTED_FLASH_SIZES = { 18: "256KB", 19: "512KB", 20: "1MB", 21: "2MB", 22: "4MB", 23: "8MB", 24: "16MB", 25: "32MB", 26: "64MB", 27: "128MB", 28: "256MB", 32: "64MB", 33: "128MB", 34: "256MB", 50: "256KB", 51: "512KB", 52: "1MB", 53: "2MB", 54: "4MB", 55: "8MB", 56: "16MB", 57: "32MB", 58: "64MB" }, this.USB_JTAG_SERIAL_PID = 4097, this.romBaudrate = 115200, this.debugLogging = !1, this.syncStubDetected = !1, this.IS_STUB = !1, this.FLASH_WRITE_SIZE = 16384, this.transport = t.transport, this.baudrate = t.baudrate, this.resetConstructors = { classicReset: (d, h) => new QA(d, h), customReset: (d, h) => new $A(d, h), hardReset: (d, h) => new ja(d, h), usbJTAGSerialReset: (d) => new HA(d) }, t.serialOptions && (this.serialOptions = t.serialOptions), t.terminal && (this.terminal = t.terminal, this.terminal.clean()), t.debugLogging !== void 0 && (this.debugLogging = t.debugLogging), t.port && (this.transport = new $r(t.port)), t.enableTracing !== void 0 && (this.transport.tracing = t.enableTracing), !((e = t.resetConstructors) === null || e === void 0) && e.classicReset && (this.resetConstructors.classicReset = (i = t.resetConstructors) === null || i === void 0 ? void 0 : i.classicReset), !((r = t.resetConstructors) === null || r === void 0) && r.customReset && (this.resetConstructors.customReset = (o = t.resetConstructors) === null || o === void 0 ? void 0 : o.customReset), !((n = t.resetConstructors) === null || n === void 0) && n.hardReset && (this.resetConstructors.hardReset = (a = t.resetConstructors) === null || a === void 0 ? void 0 : a.hardReset), !((l = t.resetConstructors) === null || l === void 0) && l.usbJTAGSerialReset && (this.resetConstructors.usbJTAGSerialReset = (c = t.resetConstructors) === null || c === void 0 ? void 0 : c.usbJTAGSerialReset), this.info("esptool.js"), this.info("Serial port " + this.transport.getInfo());
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
      const n = r[1], a = this._byteArrayToInt(r[4], r[5], r[6], r[7]), l = r.slice(8);
      if (o == 1) {
        if (t == null || n == t) return [a, l];
        if (l[0] != 0 && l[1] == this.ROM_INVALID_RECV_MSG) throw this.transport.flushInput(), new L("unsupported command error");
      }
    }
    throw new L("invalid response");
  }
  async command(t = null, e = new Uint8Array(0), i = 0, r = !0, o = this.DEFAULT_TIMEOUT) {
    if (t != null) {
      this.transport.tracing && this.transport.trace(`command op:0x${t.toString(16).padStart(2, "0")} data len=${e.length} wait_response=${r ? 1 : 0} timeout=${(o / 1e3).toFixed(3)} data=${this.transport.hexConvert(e)}`);
      const n = new Uint8Array(8 + e.length);
      let a;
      for (n[0] = 0, n[1] = t, n[2] = this._shortToBytearray(e.length)[0], n[3] = this._shortToBytearray(e.length)[1], n[4] = this._intToByteArray(i)[0], n[5] = this._intToByteArray(i)[1], n[6] = this._intToByteArray(i)[2], n[7] = this._intToByteArray(i)[3], a = 0; a < e.length; a++) n[8 + a] = e[a];
      await this.transport.write(n);
    }
    return r ? this.readPacket(t, o) : [0, new Uint8Array(0)];
  }
  async readReg(t, e = this.DEFAULT_TIMEOUT) {
    this.debug(`Read Register:${this.toHex(t)}`);
    const i = this._intToByteArray(t), r = await this.command(this.ESP_READ_REG, i, void 0, void 0, e);
    return this.debug(`Read Register Value:${r[0]}`), r[0];
  }
  async writeReg(t, e, i = 4294967295, r = 0, o = 0) {
    let n = this._appendArray(this._intToByteArray(t), this._intToByteArray(e));
    n = this._appendArray(n, this._intToByteArray(i)), n = this._appendArray(n, this._intToByteArray(r)), o > 0 && (n = this._appendArray(n, this._intToByteArray(this.chip.UART_DATE_REG_ADDR)), n = this._appendArray(n, this._intToByteArray(0)), n = this._appendArray(n, this._intToByteArray(0)), n = this._appendArray(n, this._intToByteArray(o))), await this.checkCommand("write target memory", this.ESP_WRITE_REG, n);
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
    let o = !1, n = "", a = !1;
    r && (o = !0, n = r[1], a = !!r[2]), this.debug(`bootMode:${n} downloadMode:${a}`);
    let l = "";
    for (let c = 0; c < 5; c++) try {
      this.debug(`Sync connect attempt ${c}`), this.transport.flushInput();
      const d = await this.sync();
      return this.debug(d[0].toString()), "success";
    } catch (d) {
      this.debug(`Error at sync ${d}`), l = d instanceof Error ? d.message : typeof d == "string" ? d : JSON.stringify(d);
    }
    return o && (l = `Wrong boot mode detected (${n}).
        This chip needs to be in download mode.`, a && (l = `Download mode successfully detected, but getting no sync reply:
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
    for (let n = 0; n < e; n++) {
      const a = o.length > 0 ? o[n % o.length] : null;
      if (r = await this._connectAttempt(t, a), r === "success") break;
    }
    if (r !== "success") throw new L("Failed to connect with the device");
    if (this.debug("Connect attempt successful."), this.info(`
\r`, !1), i) {
      const n = await this.readReg(this.CHIP_DETECT_MAGIC_REG_ADDR) >>> 0;
      this.debug("Chip Magic " + n.toString(16));
      const a = await (async function(l) {
        switch (l) {
          case 15736195: {
            const { ESP32ROM: c } = await Promise.resolve().then(() => Dg);
            return new c();
          }
          case 203546735:
          case 1867591791:
          case 2084675695: {
            const { ESP32C2ROM: c } = await Promise.resolve().then(() => kg);
            return new c();
          }
          case 1763790959:
          case 456216687:
          case 1216438383:
          case 1130455151: {
            const { ESP32C3ROM: c } = await Promise.resolve().then(() => Mg);
            return new c();
          }
          case 752910447: {
            const { ESP32C6ROM: c } = await Promise.resolve().then(() => Fg);
            return new c();
          }
          case 606167151:
          case 871374959:
          case 1333878895: {
            const { ESP32C61ROM: c } = await Promise.resolve().then(() => Pg);
            return new c();
          }
          case 285294703:
          case 1675706479:
          case 1607549039: {
            const { ESP32C5ROM: c } = await Promise.resolve().then(() => Qg);
            return new c();
          }
          case 3619110528:
          case 2548236392: {
            const { ESP32H2ROM: c } = await Promise.resolve().then(() => $g);
            return new c();
          }
          case 9: {
            const { ESP32S3ROM: c } = await Promise.resolve().then(() => Lg);
            return new c();
          }
          case 1990: {
            const { ESP32S2ROM: c } = await Promise.resolve().then(() => Ng);
            return new c();
          }
          case 4293968129: {
            const { ESP8266ROM: c } = await Promise.resolve().then((function() {
              return YA;
            }));
            return new c();
          }
          case 0:
          case 182303440:
          case 117676761: {
            const { ESP32P4ROM: c } = await Promise.resolve().then(() => zg);
            return new c();
          }
          default:
            return null;
        }
      })(n);
      if (typeof this.chip === null) throw new L(`Unexpected CHIP magic value ${n}. Failed to autodetect chip type.`);
      this.chip = a;
    }
  }
  async detectChip(t = "default_reset") {
    await this.connect(t), this.info("Detecting chip type... ", !1), this.chip != null ? this.info(this.chip.CHIP_NAME) : this.info("unknown!");
  }
  async checkCommand(t = "", e = null, i = new Uint8Array(0), r = 0, o = 0, n = this.DEFAULT_TIMEOUT) {
    this.debug("check_command " + t);
    const a = await this.command(e, i, r, void 0, n);
    if (a && a[1] && a[1].length < o + 2) {
      const c = a[1].slice(0, 2);
      throw c[0] !== 0 ? new L(`Failed to ${t} failed with status ${c}`) : new L(`Failed to ${t}.
 Only got ${a[1].length} bytes of data.`);
    }
    const l = a[1].slice(o, o + 2);
    if (l[0] !== 0) throw new L(`Failed to ${t} failed with status ${l}`);
    return o > 0 ? a[1].slice(0, o) : a[0];
  }
  async memBegin(t, e, i, r) {
    if (this.IS_STUB) {
      const n = r, a = r + t, l = this.chip.getChipRevision ? await this.chip.getChipRevision(this) : void 0, c = await hn(this.chip.CHIP_NAME, l);
      if (c) {
        const d = [[c.bss_start || c.data_start, c.data_start + c.decodedData.length], [c.text_start, c.text_start + c.decodedText.length]];
        for (const [h, A] of d) if (n < A && a > h) throw new L(`Software loader is resident at 0x${h.toString(16).padStart(8, "0")}-0x${A.toString(16).padStart(8, "0")}.
            Can't load binary at overlapping address range 0x${n.toString(16).padStart(8, "0")}-0x${a.toString(16).padStart(8, "0")}.
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
    const i = Math.floor((t + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), r = this.chip.getEraseSize(e, t), o = /* @__PURE__ */ new Date(), n = o.getTime();
    let a = 3e3;
    this.IS_STUB == 0 && (a = this.timeoutPerMb(this.ERASE_REGION_TIMEOUT_PER_MB, t)), this.debug("flash begin " + r + " " + i + " " + this.FLASH_WRITE_SIZE + " " + e + " " + t);
    let l = this._appendArray(this._intToByteArray(r), this._intToByteArray(i));
    l = this._appendArray(l, this._intToByteArray(this.FLASH_WRITE_SIZE)), l = this._appendArray(l, this._intToByteArray(e)), this.IS_STUB == 0 && (l = this._appendArray(l, this._intToByteArray(0))), await this.checkCommand("enter Flash download mode", this.ESP_FLASH_BEGIN, l, void 0, void 0, a);
    const c = o.getTime();
    return t != 0 && this.IS_STUB == 0 && this.info("Took " + (c - n) / 1e3 + "." + (c - n) % 1e3 + "s to erase flash block"), i;
  }
  async flashDeflBegin(t, e, i) {
    const r = Math.floor((e + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), o = Math.floor((t + this.FLASH_WRITE_SIZE - 1) / this.FLASH_WRITE_SIZE), n = /* @__PURE__ */ new Date(), a = n.getTime();
    let l, c;
    this.IS_STUB ? (l = t, c = this.DEFAULT_TIMEOUT) : (l = o * this.FLASH_WRITE_SIZE, c = this.timeoutPerMb(this.ERASE_REGION_TIMEOUT_PER_MB, l)), this.info("Compressed " + t + " bytes to " + e + "...");
    let d = this._appendArray(this._intToByteArray(l), this._intToByteArray(r));
    d = this._appendArray(d, this._intToByteArray(this.FLASH_WRITE_SIZE)), d = this._appendArray(d, this._intToByteArray(i)), this.chip.CHIP_NAME !== "ESP32-S2" && this.chip.CHIP_NAME !== "ESP32-S3" && this.chip.CHIP_NAME !== "ESP32-C3" && this.chip.CHIP_NAME !== "ESP32-C2" || this.IS_STUB !== !1 || (d = this._appendArray(d, this._intToByteArray(0))), await this.checkCommand("enter compressed flash mode", this.ESP_FLASH_DEFL_BEGIN, d, void 0, void 0, c);
    const h = n.getTime();
    return t != 0 && this.IS_STUB === !1 && this.info("Took " + (h - a) / 1e3 + "." + (h - a) % 1e3 + "s to erase flash block"), r;
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
  async runSpiflashCommand(t, e, i, r = null, o = 0, n = 0) {
    const a = this.chip.SPI_REG_BASE, l = a + 0, c = a + 4, d = a + this.chip.SPI_USR_OFFS, h = a + this.chip.SPI_USR1_OFFS, A = a + this.chip.SPI_USR2_OFFS, p = a + this.chip.SPI_W0_OFFS;
    let _;
    _ = this.chip.SPI_MOSI_DLEN_OFFS != null ? async (D, x) => {
      const S = a + this.chip.SPI_MOSI_DLEN_OFFS, T = a + this.chip.SPI_MISO_DLEN_OFFS;
      D > 0 && await this.writeReg(S, D - 1), x > 0 && await this.writeReg(T, x - 1);
      let k = 0;
      n > 0 && (k |= n - 1), o > 0 && (k |= o - 1 << f), k && await this.writeReg(h, k);
    } : async (D, x) => {
      const S = h;
      let T = (x === 0 ? 0 : x - 1) << 8 | (D === 0 ? 0 : D - 1) << 17;
      n > 0 && (T |= n - 1), o > 0 && (T |= o - 1 << f), await this.writeReg(S, T);
    };
    const u = 1 << 18, f = 26;
    if (i > 32) throw new L("Reading more than 32 bits back from a SPI flash operation is unsupported");
    if (e.length > 64) throw new L("Writing more than 64 bytes of data with one SPI command is unsupported");
    const w = 8 * e.length, b = await this.readReg(d), m = await this.readReg(A);
    let C = 1 << 31;
    i > 0 && (C |= 268435456), w > 0 && (C |= 134217728), o > 0 && (C |= 1073741824), n > 0 && (C |= 536870912), await _(w, i), await this.writeReg(d, C);
    let R, E = 7 << 28 | t;
    if (await this.writeReg(A, E), r && o > 0 && (this.SPI_ADDR_REG_MSB && (r <<= 32 - o), await this.writeReg(c, r)), w == 0) await this.writeReg(p, 0);
    else {
      e = hr(e, 4, 0);
      const D = [];
      for (let S = 0; S < e.length; S += 4) D.push((e[S] | e[S + 1] << 8 | e[S + 2] << 16 | e[S + 3] << 24) >>> 0);
      let x = p;
      for (const S of D) await this.writeReg(x, S), x += 4;
    }
    for (await this.writeReg(l, u), R = 0; R < 10 && (E = await this.readReg(l) & u, E != 0); R++) ;
    if (R === 10) throw new L("SPI command did not complete in time");
    const M = await this.readReg(p);
    return await this.writeReg(d, b), await this.writeReg(A, m), M;
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
    const o = this.IS_STUB ? 16 : 32, n = await this.checkCommand("calculate md5sum", this.ESP_SPI_FLASH_MD5, r, void 0, o, i);
    return this.toHex(n);
  }
  async readFlash(t, e, i = null) {
    let r = this._appendArray(this._intToByteArray(t), this._intToByteArray(e));
    r = this._appendArray(r, this._intToByteArray(4096)), r = this._appendArray(r, this._intToByteArray(1024));
    const o = await this.checkCommand("read flash", this.ESP_READ_FLASH, r);
    if (o != 0) throw new L("Failed to read memory: " + o);
    let n = new Uint8Array(0);
    for (; n.length < e; ) {
      const a = await this.transport.read(this.FLASH_READ_TIMEOUT);
      if (!(a instanceof Uint8Array)) throw new L("Failed to read memory: " + a);
      a.length > 0 && (n = this._appendArray(n, a), await this.transport.write(this._intToByteArray(n.length)), i && i(a, n.length, e));
    }
    return n;
  }
  async runStub() {
    if (this.syncStubDetected) return this.info("Stub is already running. No upload is necessary."), this.chip;
    this.info("Uploading stub...");
    const t = this.chip.getChipRevision ? await this.chip.getChipRevision(this) : void 0, e = await hn(this.chip.CHIP_NAME, t);
    if (e === void 0) throw this.debug("Error loading Stub json"), new Error("Error loading Stub json");
    const i = [e.decodedText, e.decodedData];
    for (let n = 0; n < i.length; n++) if (i[n]) {
      const a = n === 0 ? e.text_start : e.data_start, l = i[n].length, c = Math.floor((l + this.ESP_RAM_BLOCK - 1) / this.ESP_RAM_BLOCK);
      await this.memBegin(l, c, this.ESP_RAM_BLOCK, a);
      for (let d = 0; d < c; d++) {
        const h = d * this.ESP_RAM_BLOCK, A = h + this.ESP_RAM_BLOCK;
        await this.memBlock(i[n].slice(h, A), d);
      }
    }
    this.info("Running stub..."), await this.memFinish(e.entry);
    const r = await this.transport.read(this.DEFAULT_TIMEOUT), o = String.fromCharCode(...r);
    if (o !== "OHAI") throw new L(`Failed to start stub. Unexpected response ${o}`);
    return this.info("Stub running..."), this.IS_STUB = !0, this.chip;
  }
  async changeBaud() {
    this.info("Changing baudrate to " + this.baudrate);
    const t = this.IS_STUB ? this.romBaudrate : 0, e = this._appendArray(this._intToByteArray(this.baudrate), this._intToByteArray(t));
    await this.command(this.ESP_CHANGE_BAUDRATE, e), this.info("Changed"), this.info("If the chip does not respond to any further commands, consider using a lower baud rate."), await ii(50), await this.transport.disconnect(), await ii(50), await this.transport.connect(this.baudrate, this.serialOptions), await ii(50), this.transport.readLoop();
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
      throw new L("Unable to verify flash chip connection " + i);
    }
    return e;
  }
  flashSizeBytes(t) {
    let e = -1;
    return this.transport.trace(`Flash size string ${t}`), t.toString().indexOf("KB") !== -1 ? e = 1024 * parseInt(t.toString().slice(0, t.toString().indexOf("KB"))) : t.toString().indexOf("MB") !== -1 && (e = 1024 * parseInt(t.toString().slice(0, t.toString().indexOf("MB"))) * 1024), this.transport.trace(`Flash size in bytes ${e}`), e;
  }
  parseFlashSizeArg(t) {
    if (this.chip.FLASH_SIZES[t] === void 0) throw new L("Flash size " + t + " is not supported by this chip type. Supported sizes: " + this.chip.FLASH_SIZES);
    return this.chip.FLASH_SIZES[t];
  }
  async _updateImageFlashParams(t, e, i = "keep", r = "keep", o = "keep") {
    if (this.debug(`_update_image_flash_params ${o} ${i} ${r}`), t.length < 8 || e != this.chip.BOOTLOADER_FLASH_OFFSET) return t;
    if (o === "keep" && i === "keep" && r === "keep") return this.info("Not changing the image"), t;
    const n = t[0];
    let a = t[2];
    const l = t[3];
    if (n !== this.ESP_IMAGE_MAGIC) return this.info("Warning: Image file at 0x" + e.toString(16) + " doesn't look like an image file, so not changing any flash settings."), t;
    try {
      (await gn(this.chip, t)).verify();
    } catch {
      return this.debug(`Warning: Image file at 0x${e.toString(16)} is not a valid ${this.chip.CHIP_NAME} image, so not changing any flash settings.`), t;
    }
    const c = this.chip.CHIP_NAME !== "ESP8266" && t[23] === 49;
    i !== "keep" && (a = { qio: 0, qout: 1, dio: 2, dout: 3 }[i]);
    let d = 15 & l;
    r !== "keep" && (d = { "40m": 0, "26m": 1, "20m": 2, "80m": 15 }[r]);
    let h = 240 & l;
    if (o !== "keep") if (o === "detect") {
      this.info("Configuring flash size...");
      const _ = await this.detectFlashSize();
      this.info("Detected flash size set to " + _), h = this.parseFlashSizeArg(_);
    } else h = this.parseFlashSizeArg(o);
    const A = a << 8 | d + h;
    this.info("Flash params set to " + A.toString(16));
    const p = new Uint8Array(t);
    if (t[2] !== a && (p[2] = a), t[3] !== d + h && (p[3] = d + h), c) {
      const _ = await gn(this.chip, p), u = p.slice(0, _.datalength), f = p.slice(_.datalength + _.SHA256_DIGEST_LEN), w = await crypto.subtle.digest("SHA-256", f), b = new Uint8Array(w), m = new Uint8Array(u.length + b.length + f.length);
      m.set(u, 0), m.set(b, u.length), m.set(f, u.length + b.length);
      const C = m.slice(_.datalength, _.datalength + _.SHA256_DIGEST_LEN);
      return this.transport.hexify(b) === this.transport.hexify(C) ? this.info("SHA digest in image updated") : this.info(`WARNING: SHA recalculation for binary failed!
	Expected calculated SHA: ${this.transport.hexify(b)}
	SHA stored in binary:    ${this.transport.hexify(C)}`), m;
    }
    return p;
  }
  async writeFlash(t) {
    if (this.debug("EspLoader program"), t.flashSize !== "keep") {
      const r = this.flashSizeBytes(t.flashSize);
      for (let o = 0; o < t.fileArray.length; o++) if (t.fileArray[o].data.length + t.fileArray[o].address > r) throw new L(`File ${o + 1} doesn't fit in the available flash`);
    }
    let e, i;
    this.IS_STUB === !0 && t.eraseAll === !0 && await this.eraseFlash();
    for (let r = 0; r < t.fileArray.length; r++) {
      if (this.debug("Data Length " + t.fileArray[r].data.length), e = t.fileArray[r].data, this.debug("Image Length " + e.length), e.length === 0) {
        this.debug("Warning: File is empty");
        continue;
      }
      e = hr(e, 4), i = t.fileArray[r].address, e = await this._updateImageFlashParams(e, i, t.flashMode, t.flashFreq, t.flashSize);
      let o = null;
      t.calculateMD5Hash && (o = t.calculateMD5Hash(e), this.debug("Image MD5 " + o));
      const n = e.length;
      let a;
      t.compress ? (e = PA(e, { level: 9 }), a = await this.flashDeflBegin(n, e.length, i)) : a = await this.flashBegin(n, i);
      let l = 0, c = 0;
      const d = e.length;
      t.reportProgress && t.reportProgress(r, 0, d);
      let h = /* @__PURE__ */ new Date();
      const A = h.getTime();
      let p = 5e3;
      const _ = new UA({ chunkSize: 1 });
      let u = 0;
      _.onData = function(b) {
        u += b.byteLength;
      };
      let f = 0;
      for (; f < e.length; ) {
        this.debug("Write loop " + i + " " + l + " " + a), this.info("Writing at 0x" + (i + u).toString(16) + "... (" + Math.floor(100 * (l + 1) / a) + "%)");
        const b = Math.min(this.FLASH_WRITE_SIZE, e.length - f), m = e.slice(f, f + b), C = f + b >= e.length;
        if (!t.compress) throw new L("Yet to handle Non Compressed writes");
        {
          const R = u;
          _.push(m, C);
          const E = u - R;
          let M = 3e3;
          this.timeoutPerMb(this.ERASE_WRITE_TIMEOUT_PER_MB, E) > 3e3 && (M = this.timeoutPerMb(this.ERASE_WRITE_TIMEOUT_PER_MB, E)), this.IS_STUB === !1 && (p = M), await this.flashDeflBlock(m, l, p), this.IS_STUB && (p = M);
        }
        c += m.length, f += b, l++, t.reportProgress && t.reportProgress(r, c, d);
      }
      this.IS_STUB && (t.compress ? await this.flashDeflFinish(!1, p) : await this.flashFinish(!1, p)), h = /* @__PURE__ */ new Date();
      const w = h.getTime() - A;
      if (t.compress && this.info("Wrote " + n + " bytes (" + c + " compressed) at 0x" + i.toString(16) + " in " + w / 1e3 + " seconds."), o) {
        this.info("File  md5: " + o);
        const b = await this.flashMd5sum(i, n);
        if (this.info("Flash md5: " + b), new String(b).valueOf() != new String(o).valueOf()) throw new L("MD5 of file does not match data in flash!");
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
      if (this.chip.CHIP_NAME != "ESP8266") throw new L("Soft resetting is currently only supported on ESP8266");
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
class tp extends HTMLElement {
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
    `, this._console = new Ph(this.shadowRoot.querySelector("div")), this.allowInput) {
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
      await this.port.readable.pipeThrough(new TextDecoderStream(), { signal: t }).pipeThrough(new TransformStream(new Uh())).pipeThrough(new TransformStream(new Qh())).pipeTo(new WritableStream({ write: (e) => {
        this._console.addLine(e.replace("\r", ""));
      } })), t.aborted || (this._console.addLine(""), this._console.addLine(""), this._console.addLine("Terminal disconnected"));
    } catch (e) {
      this._console.addLine(""), this._console.addLine(""), this._console.addLine(`Terminal disconnected: ${e}`);
    } finally {
      await Ce(100), this.logger.debug("Finished console read loop");
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
    const t = new $r(this.port);
    await t.setRTS(!0), await Ce(100), await new ja(t).reset();
  }
}
function un(s, t = !0) {
  return t && getComputedStyle(s).getPropertyValue("direction").trim() === "rtl";
}
customElements.define("ewt-console", tp);
const ep = Gt(mi(Y));
class at extends ep {
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(t) {
    this.setAttribute("name", t);
  }
  get form() {
    return this[dt].form;
  }
  get labels() {
    return this[dt].labels;
  }
  constructor() {
    super(), this.disabled = !1, this.softDisabled = !1, this.flipIconInRtl = !1, this.href = "", this.download = "", this.target = "", this.ariaLabelSelected = "", this.toggle = !1, this.selected = !1, this.type = "submit", this.value = "", this.flipIcon = un(this, this.flipIconInRtl), this.addEventListener("click", this.handleClick.bind(this));
  }
  willUpdate() {
    this.href && (this.disabled = !1, this.softDisabled = !1);
  }
  render() {
    const t = this.href ? Wt`div` : Wt`button`, { ariaLabel: e, ariaHasPopup: i, ariaExpanded: r } = this, o = e && this.ariaLabelSelected, n = this.toggle ? this.selected : I;
    let a = I;
    return this.href || (a = o && this.selected ? this.ariaLabelSelected : e), ds`<${t}
        class="icon-button ${ft(this.getRenderClasses())}"
        id="button"
        aria-label="${a || I}"
        aria-haspopup="${!this.href && i || I}"
        aria-expanded="${!this.href && r || I}"
        aria-pressed="${n}"
        aria-disabled=${!this.href && this.softDisabled || I}
        ?disabled="${!this.href && this.disabled}"
        @click="${this.handleClickOnChild}">
        ${this.renderFocusRing()}
        ${this.renderRipple()}
        ${this.selected ? I : this.renderIcon()}
        ${this.selected ? this.renderSelectedIcon() : I}
        ${this.href ? this.renderLink() : this.renderTouchTarget()}
  </${t}>`;
  }
  renderLink() {
    const { ariaLabel: t } = this;
    return B`
      <a
        class="link"
        id="link"
        href="${this.href}"
        download="${this.download || I}"
        target="${this.target || I}"
        aria-label="${t || I}">
        ${this.renderTouchTarget()}
      </a>
    `;
  }
  getRenderClasses() {
    return { "flip-icon": this.flipIcon, selected: this.toggle && this.selected };
  }
  renderIcon() {
    return B`<span class="icon"><slot></slot></span>`;
  }
  renderSelectedIcon() {
    return B`<span class="icon icon--selected"
      ><slot name="selected"><slot></slot></slot
    ></span>`;
  }
  renderTouchTarget() {
    return B`<span class="touch"></span>`;
  }
  renderFocusRing() {
    return B`<md-focus-ring
      part="focus-ring"
      for=${this.href ? "link" : "button"}></md-focus-ring>`;
  }
  renderRipple() {
    const t = !this.href && (this.disabled || this.softDisabled);
    return B`<md-ripple
      for=${this.href ? "link" : I}
      ?disabled="${t}"></md-ripple>`;
  }
  connectedCallback() {
    this.flipIcon = un(this, this.flipIconInRtl), super.connectedCallback();
  }
  handleClick(t) {
    if (!this.href && this.softDisabled) return t.stopImmediatePropagation(), void t.preventDefault();
  }
  async handleClickOnChild(t) {
    await 0, !this.toggle || this.disabled || this.softDisabled || t.defaultPrevented || (this.selected = !this.selected, this.dispatchEvent(new InputEvent("input", { bubbles: !0, composed: !0 })), this.dispatchEvent(new Event("change", { bubbles: !0 })));
  }
}
fa(at), at.formAssociated = !0, at.shadowRootOptions = { mode: "open", delegatesFocus: !0 }, g([v({ type: Boolean, reflect: !0 })], at.prototype, "disabled", void 0), g([v({ type: Boolean, attribute: "soft-disabled", reflect: !0 })], at.prototype, "softDisabled", void 0), g([v({ type: Boolean, attribute: "flip-icon-in-rtl" })], at.prototype, "flipIconInRtl", void 0), g([v()], at.prototype, "href", void 0), g([v()], at.prototype, "download", void 0), g([v()], at.prototype, "target", void 0), g([v({ attribute: "aria-label-selected" })], at.prototype, "ariaLabelSelected", void 0), g([v({ type: Boolean })], at.prototype, "toggle", void 0), g([v({ type: Boolean, reflect: !0 })], at.prototype, "selected", void 0), g([v()], at.prototype, "type", void 0), g([v({ reflect: !0 })], at.prototype, "value", void 0), g([$()], at.prototype, "flipIcon", void 0);
const ip = z`:host{display:inline-flex;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0);height:var(--_container-height);width:var(--_container-width);justify-content:center}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) max(0px,(48px - var(--_container-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){pointer-events:none}.icon-button{place-items:center;background:none;border:none;box-sizing:border-box;cursor:pointer;display:flex;place-content:center;outline:none;padding:0;position:relative;text-decoration:none;user-select:none;z-index:0;flex:1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.icon ::slotted(*){font-size:var(--_icon-size);height:var(--_icon-size);width:var(--_icon-size);font-weight:inherit}md-ripple{z-index:-1;border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end)}.flip-icon .icon{transform:scaleX(-1)}.icon{display:inline-flex}.link{display:grid;height:100%;outline:none;place-items:center;position:absolute;width:100%}.touch{position:absolute;height:max(48px,100%);width:max(48px,100%)}:host([touch-target=none]) .touch{display:none}@media(forced-colors: active){:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1}}
`, sp = z`:host{--_disabled-icon-color: var(--md-icon-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-icon-button-disabled-icon-opacity, 0.38);--_icon-size: var(--md-icon-button-icon-size, 24px);--_selected-focus-icon-color: var(--md-icon-button-selected-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-icon-color: var(--md-icon-button-selected-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-color: var(--md-icon-button-selected-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-hover-state-layer-opacity: var(--md-icon-button-selected-hover-state-layer-opacity, 0.08);--_selected-icon-color: var(--md-icon-button-selected-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-icon-color: var(--md-icon-button-selected-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-color: var(--md-icon-button-selected-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_selected-pressed-state-layer-opacity: var(--md-icon-button-selected-pressed-state-layer-opacity, 0.12);--_state-layer-height: var(--md-icon-button-state-layer-height, 40px);--_state-layer-shape: var(--md-icon-button-state-layer-shape, var(--md-sys-shape-corner-full, 9999px));--_state-layer-width: var(--md-icon-button-state-layer-width, 40px);--_focus-icon-color: var(--md-icon-button-focus-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-icon-color: var(--md-icon-button-hover-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-icon-button-hover-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-opacity: var(--md-icon-button-hover-state-layer-opacity, 0.08);--_icon-color: var(--md-icon-button-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-icon-color: var(--md-icon-button-pressed-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-color: var(--md-icon-button-pressed-state-layer-color, var(--md-sys-color-on-surface-variant, #49454f));--_pressed-state-layer-opacity: var(--md-icon-button-pressed-state-layer-opacity, 0.12);--_container-shape-start-start: 0;--_container-shape-start-end: 0;--_container-shape-end-end: 0;--_container-shape-end-start: 0;--_container-height: 0;--_container-width: 0;height:var(--_state-layer-height);width:var(--_state-layer-width)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_state-layer-height))/2) max(0px,(48px - var(--_state-layer-width))/2)}md-focus-ring{--md-focus-ring-shape-start-start: var(--_state-layer-shape);--md-focus-ring-shape-start-end: var(--_state-layer-shape);--md-focus-ring-shape-end-end: var(--_state-layer-shape);--md-focus-ring-shape-end-start: var(--_state-layer-shape)}.standard{background-color:rgba(0,0,0,0);color:var(--_icon-color);--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}.standard:hover{color:var(--_hover-icon-color)}.standard:focus{color:var(--_focus-icon-color)}.standard:active{color:var(--_pressed-icon-color)}.standard:is(:disabled,[aria-disabled=true]){color:var(--_disabled-icon-color)}md-ripple{border-radius:var(--_state-layer-shape)}.standard:is(:disabled,[aria-disabled=true]){opacity:var(--_disabled-icon-opacity)}.selected:not(:disabled,[aria-disabled=true]){color:var(--_selected-icon-color)}.selected:not(:disabled,[aria-disabled=true]):hover{color:var(--_selected-hover-icon-color)}.selected:not(:disabled,[aria-disabled=true]):focus{color:var(--_selected-focus-icon-color)}.selected:not(:disabled,[aria-disabled=true]):active{color:var(--_selected-pressed-icon-color)}.selected{--md-ripple-hover-color: var(--_selected-hover-state-layer-color);--md-ripple-hover-opacity: var(--_selected-hover-state-layer-opacity);--md-ripple-pressed-color: var(--_selected-pressed-state-layer-color);--md-ripple-pressed-opacity: var(--_selected-pressed-state-layer-opacity)}
`;
class fn extends at {
}
fn.styles = [ip, sp], customElements.define("ew-icon-button", fn);
const rp = z`:host{--_active-indicator-color: var(--md-filled-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-text-field-active-indicator-height, 1px);--_caret-color: var(--md-filled-text-field-caret-color, var(--md-sys-color-primary, #6750a4));--_container-color: var(--md-filled-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_disabled-active-indicator-color: var(--md-filled-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-text-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-text-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-text-field-disabled-container-opacity, 0.04);--_disabled-input-text-color: var(--md-filled-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-input-text-opacity: var(--md-filled-text-field-disabled-input-text-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-text-field-disabled-label-text-opacity, 0.38);--_disabled-leading-icon-color: var(--md-filled-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-icon-opacity: var(--md-filled-text-field-disabled-leading-icon-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-text-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-icon-color: var(--md-filled-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-icon-opacity: var(--md-filled-text-field-disabled-trailing-icon-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-active-indicator-color: var(--md-filled-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-caret-color: var(--md-filled-text-field-error-focus-caret-color, var(--md-sys-color-error, #b3261e));--_error-focus-input-text-color: var(--md-filled-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-label-text-color: var(--md-filled-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-icon-color: var(--md-filled-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-icon-color: var(--md-filled-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-input-text-color: var(--md-filled-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-icon-color: var(--md-filled-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-text-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-icon-color: var(--md-filled-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_error-input-text-color: var(--md-filled-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_error-label-text-color: var(--md-filled-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-icon-color: var(--md-filled-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-icon-color: var(--md-filled-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-text-field-focus-active-indicator-height, 3px);--_focus-input-text-color: var(--md-filled-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-icon-color: var(--md-filled-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-icon-color: var(--md-filled-text-field-focus-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-text-field-hover-active-indicator-height, 1px);--_hover-input-text-color: var(--md-filled-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-text-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-icon-color: var(--md-filled-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-text-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-icon-color: var(--md-filled-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-color: var(--md-filled-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_input-text-font: var(--md-filled-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_input-text-line-height: var(--md-filled-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_input-text-placeholder-color: var(--md-filled-text-field-input-text-placeholder-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-prefix-color: var(--md-filled-text-field-input-text-prefix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-size: var(--md-filled-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_input-text-suffix-color: var(--md-filled-text-field-input-text-suffix-color, var(--md-sys-color-on-surface-variant, #49454f));--_input-text-weight: var(--md-filled-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_label-text-color: var(--md-filled-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-icon-color: var(--md-filled-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-icon-size: var(--md-filled-text-field-leading-icon-size, 24px);--_supporting-text-color: var(--md-filled-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-line-height: var(--md-filled-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-weight: var(--md-filled-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_trailing-icon-color: var(--md-filled-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-icon-size: var(--md-filled-text-field-trailing-icon-size, 24px);--_container-shape-start-start: var(--md-filled-text-field-container-shape-start-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-text-field-container-shape-start-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-text-field-container-shape-end-end, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-text-field-container-shape-end-start, var(--md-filled-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_icon-input-space: var(--md-filled-text-field-icon-input-space, 16px);--_leading-space: var(--md-filled-text-field-leading-space, 16px);--_trailing-space: var(--md-filled-text-field-trailing-space, 16px);--_top-space: var(--md-filled-text-field-top-space, 16px);--_bottom-space: var(--md-filled-text-field-bottom-space, 16px);--_input-text-prefix-trailing-space: var(--md-filled-text-field-input-text-prefix-trailing-space, 2px);--_input-text-suffix-leading-space: var(--md-filled-text-field-input-text-suffix-leading-space, 2px);--_with-label-top-space: var(--md-filled-text-field-with-label-top-space, 8px);--_with-label-bottom-space: var(--md-filled-text-field-with-label-bottom-space, 8px);--_focus-caret-color: var(--md-filled-text-field-focus-caret-color, var(--md-sys-color-primary, #6750a4));--_with-leading-icon-leading-space: var(--md-filled-text-field-with-leading-icon-leading-space, 12px);--_with-trailing-icon-trailing-space: var(--md-filled-text-field-with-trailing-icon-trailing-space, 12px);--md-filled-field-active-indicator-color: var(--_active-indicator-color);--md-filled-field-active-indicator-height: var(--_active-indicator-height);--md-filled-field-bottom-space: var(--_bottom-space);--md-filled-field-container-color: var(--_container-color);--md-filled-field-container-shape-end-end: var(--_container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_container-shape-start-start);--md-filled-field-content-color: var(--_input-text-color);--md-filled-field-content-font: var(--_input-text-font);--md-filled-field-content-line-height: var(--_input-text-line-height);--md-filled-field-content-size: var(--_input-text-size);--md-filled-field-content-space: var(--_icon-input-space);--md-filled-field-content-weight: var(--_input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_error-active-indicator-color);--md-filled-field-error-content-color: var(--_error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_error-label-text-color);--md-filled-field-error-leading-content-color: var(--_error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_label-text-color);--md-filled-field-label-text-font: var(--_label-text-font);--md-filled-field-label-text-line-height: var(--_label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_label-text-populated-size);--md-filled-field-label-text-size: var(--_label-text-size);--md-filled-field-label-text-weight: var(--_label-text-weight);--md-filled-field-leading-content-color: var(--_leading-icon-color);--md-filled-field-leading-space: var(--_leading-space);--md-filled-field-supporting-text-color: var(--_supporting-text-color);--md-filled-field-supporting-text-font: var(--_supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_supporting-text-size);--md-filled-field-supporting-text-weight: var(--_supporting-text-weight);--md-filled-field-top-space: var(--_top-space);--md-filled-field-trailing-content-color: var(--_trailing-icon-color);--md-filled-field-trailing-space: var(--_trailing-space);--md-filled-field-with-label-bottom-space: var(--_with-label-bottom-space);--md-filled-field-with-label-top-space: var(--_with-label-top-space);--md-filled-field-with-leading-content-leading-space: var(--_with-leading-icon-leading-space);--md-filled-field-with-trailing-content-trailing-space: var(--_with-trailing-icon-trailing-space)}
`;
class Z extends Y {
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
    const o = this.renderLabel(!0), n = this.renderLabel(!1), a = (t = this.renderOutline) === null || t === void 0 ? void 0 : t.call(this, o), l = { disabled: this.disabled, "disable-transitions": this.disableTransitions, error: this.error && !this.disabled, focused: this.focused, "with-start": this.hasStart, "with-end": this.hasEnd, populated: this.populated, resizable: this.resizable, required: this.required, "no-label": !this.label };
    return B`
      <div class="field ${ft(l)}">
        <div class="container-overflow">
          ${(e = this.renderBackground) === null || e === void 0 ? void 0 : e.call(this)}
          <slot name="container"></slot>
          ${(i = this.renderStateLayer) === null || i === void 0 ? void 0 : i.call(this)} ${(r = this.renderIndicator) === null || r === void 0 ? void 0 : r.call(this)} ${a}
          <div class="container">
            <div class="start">
              <slot name="start"></slot>
            </div>
            <div class="middle">
              <div class="label-wrapper">
                ${n} ${a ? I : o}
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
    if (!t && !e) return I;
    const i = B`<span>${t}</span>`, r = e ? B`<span class="counter">${e}</span>` : I, o = this.error && this.errorText && !this.refreshErrorAlert;
    return B`
      <div class="supporting-text" role=${o ? "alert" : I}>${i}${r}</div>
      <slot
        name="aria-describedby"
        @slotchange=${this.updateSlottedAriaDescribedBy}></slot>
    `;
  }
  updateSlottedAriaDescribedBy() {
    for (const t of this.slottedAriaDescribedBy) Dr(B`${this.supportingOrErrorText} ${this.counterText}`, t), t.setAttribute("hidden", "");
  }
  renderLabel(t) {
    if (!this.label) return I;
    let e;
    e = t ? this.focused || this.populated || this.isAnimating : !this.focused && !this.populated && !this.isAnimating;
    const i = { hidden: !e, floating: t, resting: !t }, r = `${this.label}${this.required && !this.noAsterisk ? "*" : ""}`;
    return B`
      <span class="label ${ft(i)}" aria-hidden=${!e}
        >${r}</span
      >
    `;
  }
  animateLabelIfNeeded({ wasFocused: t, wasPopulated: e }) {
    var i, r, o;
    this.label && (t ?? (t = this.focused), e ?? (e = this.populated), (t || e) !== (this.focused || this.populated) && (this.isAnimating = !0, (i = this.labelAnimation) === null || i === void 0 || i.cancel(), this.labelAnimation = (r = this.floatingLabelEl) === null || r === void 0 ? void 0 : r.animate(this.getLabelKeyframes(), { duration: 150, easing: Dt.STANDARD }), (o = this.labelAnimation) === null || o === void 0 || o.addEventListener("finish", (() => {
      this.isAnimating = !1;
    }))));
  }
  getLabelKeyframes() {
    const { floatingLabelEl: t, restingLabelEl: e } = this;
    if (!t || !e) return [];
    const { x: i, y: r, height: o } = t.getBoundingClientRect(), { x: n, y: a, height: l } = e.getBoundingClientRect(), c = t.scrollWidth, d = e.scrollWidth, h = d / c, A = `translateX(${n - i}px) translateY(${a - r + Math.round((l - o * h) / 2)}px) scale(${h})`, p = "translateX(0) translateY(0) scale(1)", _ = e.clientWidth, u = d > _ ? _ / h + "px" : "";
    return this.focused || this.populated ? [{ transform: A, width: u }, { transform: p, width: u }] : [{ transform: p, width: u }, { transform: A, width: u }];
  }
  getSurfacePositionClientRect() {
    return this.containerEl.getBoundingClientRect();
  }
}
g([v({ type: Boolean })], Z.prototype, "disabled", void 0), g([v({ type: Boolean })], Z.prototype, "error", void 0), g([v({ type: Boolean })], Z.prototype, "focused", void 0), g([v()], Z.prototype, "label", void 0), g([v({ type: Boolean, attribute: "no-asterisk" })], Z.prototype, "noAsterisk", void 0), g([v({ type: Boolean })], Z.prototype, "populated", void 0), g([v({ type: Boolean })], Z.prototype, "required", void 0), g([v({ type: Boolean })], Z.prototype, "resizable", void 0), g([v({ attribute: "supporting-text" })], Z.prototype, "supportingText", void 0), g([v({ attribute: "error-text" })], Z.prototype, "errorText", void 0), g([v({ type: Number })], Z.prototype, "count", void 0), g([v({ type: Number })], Z.prototype, "max", void 0), g([v({ type: Boolean, attribute: "has-start" })], Z.prototype, "hasStart", void 0), g([v({ type: Boolean, attribute: "has-end" })], Z.prototype, "hasEnd", void 0), g([Ht({ slot: "aria-describedby" })], Z.prototype, "slottedAriaDescribedBy", void 0), g([$()], Z.prototype, "isAnimating", void 0), g([$()], Z.prototype, "refreshErrorAlert", void 0), g([$()], Z.prototype, "disableTransitions", void 0), g([j(".label.floating")], Z.prototype, "floatingLabelEl", void 0), g([j(".label.resting")], Z.prototype, "restingLabelEl", void 0), g([j(".container")], Z.prototype, "containerEl", void 0);
class op extends Z {
  renderBackground() {
    return B` <div class="background"></div> `;
  }
  renderStateLayer() {
    return B` <div class="state-layer"></div> `;
  }
  renderIndicator() {
    return B`<div class="active-indicator"></div>`;
  }
}
const np = z`@layer styles{:host{--_active-indicator-color: var(--md-filled-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_active-indicator-height: var(--md-filled-field-active-indicator-height, 1px);--_bottom-space: var(--md-filled-field-bottom-space, 16px);--_container-color: var(--md-filled-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_content-color: var(--md-filled-field-content-color, var(--md-sys-color-on-surface, #1d1b20));--_content-font: var(--md-filled-field-content-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_content-line-height: var(--md-filled-field-content-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_content-size: var(--md-filled-field-content-size, var(--md-sys-typescale-body-large-size, 1rem));--_content-space: var(--md-filled-field-content-space, 16px);--_content-weight: var(--md-filled-field-content-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_disabled-active-indicator-color: var(--md-filled-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-active-indicator-height: var(--md-filled-field-disabled-active-indicator-height, 1px);--_disabled-active-indicator-opacity: var(--md-filled-field-disabled-active-indicator-opacity, 0.38);--_disabled-container-color: var(--md-filled-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-container-opacity: var(--md-filled-field-disabled-container-opacity, 0.04);--_disabled-content-color: var(--md-filled-field-disabled-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-content-opacity: var(--md-filled-field-disabled-content-opacity, 0.38);--_disabled-label-text-color: var(--md-filled-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-filled-field-disabled-label-text-opacity, 0.38);--_disabled-leading-content-color: var(--md-filled-field-disabled-leading-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-leading-content-opacity: var(--md-filled-field-disabled-leading-content-opacity, 0.38);--_disabled-supporting-text-color: var(--md-filled-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-supporting-text-opacity: var(--md-filled-field-disabled-supporting-text-opacity, 0.38);--_disabled-trailing-content-color: var(--md-filled-field-disabled-trailing-content-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-trailing-content-opacity: var(--md-filled-field-disabled-trailing-content-opacity, 0.38);--_error-active-indicator-color: var(--md-filled-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-content-color: var(--md-filled-field-error-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-focus-active-indicator-color: var(--md-filled-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_error-focus-content-color: var(--md-filled-field-error-focus-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-label-text-color: var(--md-filled-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-leading-content-color: var(--md-filled-field-error-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-focus-supporting-text-color: var(--md-filled-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-focus-trailing-content-color: var(--md-filled-field-error-focus-trailing-content-color, var(--md-sys-color-error, #b3261e));--_error-hover-active-indicator-color: var(--md-filled-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-content-color: var(--md-filled-field-error-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-label-text-color: var(--md-filled-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_error-hover-leading-content-color: var(--md-filled-field-error-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-hover-state-layer-color: var(--md-filled-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_error-hover-state-layer-opacity: var(--md-filled-field-error-hover-state-layer-opacity, 0.08);--_error-hover-supporting-text-color: var(--md-filled-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-hover-trailing-content-color: var(--md-filled-field-error-hover-trailing-content-color, var(--md-sys-color-on-error-container, #410e0b));--_error-label-text-color: var(--md-filled-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_error-leading-content-color: var(--md-filled-field-error-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_error-supporting-text-color: var(--md-filled-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_error-trailing-content-color: var(--md-filled-field-error-trailing-content-color, var(--md-sys-color-error, #b3261e));--_focus-active-indicator-color: var(--md-filled-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_focus-active-indicator-height: var(--md-filled-field-focus-active-indicator-height, 3px);--_focus-content-color: var(--md-filled-field-focus-content-color, var(--md-sys-color-on-surface, #1d1b20));--_focus-label-text-color: var(--md-filled-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_focus-leading-content-color: var(--md-filled-field-focus-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-supporting-text-color: var(--md-filled-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_focus-trailing-content-color: var(--md-filled-field-focus-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-active-indicator-color: var(--md-filled-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-active-indicator-height: var(--md-filled-field-hover-active-indicator-height, 1px);--_hover-content-color: var(--md-filled-field-hover-content-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-label-text-color: var(--md-filled-field-hover-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-leading-content-color: var(--md-filled-field-hover-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-state-layer-color: var(--md-filled-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_hover-state-layer-opacity: var(--md-filled-field-hover-state-layer-opacity, 0.08);--_hover-supporting-text-color: var(--md-filled-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_hover-trailing-content-color: var(--md-filled-field-hover-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-color: var(--md-filled-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_label-text-font: var(--md-filled-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-filled-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_label-text-populated-line-height: var(--md-filled-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_label-text-populated-size: var(--md-filled-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_label-text-size: var(--md-filled-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_label-text-weight: var(--md-filled-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_leading-content-color: var(--md-filled-field-leading-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_leading-space: var(--md-filled-field-leading-space, 16px);--_supporting-text-color: var(--md-filled-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_supporting-text-font: var(--md-filled-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_supporting-text-leading-space: var(--md-filled-field-supporting-text-leading-space, 16px);--_supporting-text-line-height: var(--md-filled-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_supporting-text-size: var(--md-filled-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_supporting-text-top-space: var(--md-filled-field-supporting-text-top-space, 4px);--_supporting-text-trailing-space: var(--md-filled-field-supporting-text-trailing-space, 16px);--_supporting-text-weight: var(--md-filled-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_top-space: var(--md-filled-field-top-space, 16px);--_trailing-content-color: var(--md-filled-field-trailing-content-color, var(--md-sys-color-on-surface-variant, #49454f));--_trailing-space: var(--md-filled-field-trailing-space, 16px);--_with-label-bottom-space: var(--md-filled-field-with-label-bottom-space, 8px);--_with-label-top-space: var(--md-filled-field-with-label-top-space, 8px);--_with-leading-content-leading-space: var(--md-filled-field-with-leading-content-leading-space, 12px);--_with-trailing-content-trailing-space: var(--md-filled-field-with-trailing-content-trailing-space, 12px);--_container-shape-start-start: var(--md-filled-field-container-shape-start-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-start-end: var(--md-filled-field-container-shape-start-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_container-shape-end-end: var(--md-filled-field-container-shape-end-end, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_container-shape-end-start: var(--md-filled-field-container-shape-end-start, var(--md-filled-field-container-shape, var(--md-sys-shape-corner-none, 0px)))}.background,.state-layer{border-radius:inherit;inset:0;pointer-events:none;position:absolute}.background{background:var(--_container-color)}.state-layer{visibility:hidden}.field:not(.disabled):hover .state-layer{visibility:visible}.label.floating{position:absolute;top:var(--_with-label-top-space)}.field:not(.with-start) .label-wrapper{margin-inline-start:var(--_leading-space)}.field:not(.with-end) .label-wrapper{margin-inline-end:var(--_trailing-space)}.active-indicator{inset:auto 0 0 0;pointer-events:none;position:absolute;width:100%;z-index:1}.active-indicator::before,.active-indicator::after{border-bottom:var(--_active-indicator-height) solid var(--_active-indicator-color);inset:auto 0 0 0;content:"";position:absolute;width:100%}.active-indicator::after{opacity:0;transition:opacity 150ms cubic-bezier(0.2, 0, 0, 1)}.focused .active-indicator::after{opacity:1}.field:not(.with-start) .content ::slotted(*){padding-inline-start:var(--_leading-space)}.field:not(.with-end) .content ::slotted(*){padding-inline-end:var(--_trailing-space)}.field:not(.no-label) .content ::slotted(:not(textarea)){padding-bottom:var(--_with-label-bottom-space);padding-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}.field:not(.no-label) .content ::slotted(textarea){margin-bottom:var(--_with-label-bottom-space);margin-top:calc(var(--_with-label-top-space) + var(--_label-text-populated-line-height))}:hover .active-indicator::before{border-bottom-color:var(--_hover-active-indicator-color);border-bottom-width:var(--_hover-active-indicator-height)}.active-indicator::after{border-bottom-color:var(--_focus-active-indicator-color);border-bottom-width:var(--_focus-active-indicator-height)}:hover .state-layer{background:var(--_hover-state-layer-color);opacity:var(--_hover-state-layer-opacity)}.disabled .active-indicator::before{border-bottom-color:var(--_disabled-active-indicator-color);border-bottom-width:var(--_disabled-active-indicator-height);opacity:var(--_disabled-active-indicator-opacity)}.disabled .background{background:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}.error .active-indicator::before{border-bottom-color:var(--_error-active-indicator-color)}.error:hover .active-indicator::before{border-bottom-color:var(--_error-hover-active-indicator-color)}.error:hover .state-layer{background:var(--_error-hover-state-layer-color);opacity:var(--_error-hover-state-layer-opacity)}.error .active-indicator::after{border-bottom-color:var(--_error-focus-active-indicator-color)}.resizable .container{bottom:var(--_focus-active-indicator-height);clip-path:inset(var(--_focus-active-indicator-height) 0 0 0)}.resizable .container>*{top:var(--_focus-active-indicator-height)}}@layer hcm{@media(forced-colors: active){.disabled .active-indicator::before{border-color:GrayText;opacity:1}}}
`, ap = z`:host{display:inline-flex;resize:both}.field{display:flex;flex:1;flex-direction:column;writing-mode:horizontal-tb;max-width:100%}.container-overflow{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-end-radius:var(--_container-shape-end-end);border-end-start-radius:var(--_container-shape-end-start);display:flex;height:100%;position:relative}.container{align-items:center;border-radius:inherit;display:flex;flex:1;max-height:100%;min-height:100%;min-width:min-content;position:relative}.field,.container-overflow{resize:inherit}.resizable:not(.disabled) .container{resize:inherit;overflow:hidden}.disabled{pointer-events:none}slot[name=container]{border-radius:inherit}slot[name=container]::slotted(*){border-radius:inherit;inset:0;pointer-events:none;position:absolute}@layer styles{.start,.middle,.end{display:flex;box-sizing:border-box;height:100%;position:relative}.start{color:var(--_leading-content-color)}.end{color:var(--_trailing-content-color)}.start,.end{align-items:center;justify-content:center}.with-start .start{margin-inline:var(--_with-leading-content-leading-space) var(--_content-space)}.with-end .end{margin-inline:var(--_content-space) var(--_with-trailing-content-trailing-space)}.middle{align-items:stretch;align-self:baseline;flex:1}.content{color:var(--_content-color);display:flex;flex:1;opacity:0;transition:opacity 83ms cubic-bezier(0.2, 0, 0, 1)}.no-label .content,.focused .content,.populated .content{opacity:1;transition-delay:67ms}:is(.disabled,.disable-transitions) .content{transition:none}.content ::slotted(*){all:unset;color:currentColor;font-family:var(--_content-font);font-size:var(--_content-size);line-height:var(--_content-line-height);font-weight:var(--_content-weight);width:100%;overflow-wrap:revert;white-space:revert}.content ::slotted(:not(textarea)){padding-top:var(--_top-space);padding-bottom:var(--_bottom-space)}.content ::slotted(textarea){margin-top:var(--_top-space);margin-bottom:var(--_bottom-space)}:hover .content{color:var(--_hover-content-color)}:hover .start{color:var(--_hover-leading-content-color)}:hover .end{color:var(--_hover-trailing-content-color)}.focused .content{color:var(--_focus-content-color)}.focused .start{color:var(--_focus-leading-content-color)}.focused .end{color:var(--_focus-trailing-content-color)}.disabled .content{color:var(--_disabled-content-color)}.disabled.no-label .content,.disabled.focused .content,.disabled.populated .content{opacity:var(--_disabled-content-opacity)}.disabled .start{color:var(--_disabled-leading-content-color);opacity:var(--_disabled-leading-content-opacity)}.disabled .end{color:var(--_disabled-trailing-content-color);opacity:var(--_disabled-trailing-content-opacity)}.error .content{color:var(--_error-content-color)}.error .start{color:var(--_error-leading-content-color)}.error .end{color:var(--_error-trailing-content-color)}.error:hover .content{color:var(--_error-hover-content-color)}.error:hover .start{color:var(--_error-hover-leading-content-color)}.error:hover .end{color:var(--_error-hover-trailing-content-color)}.error.focused .content{color:var(--_error-focus-content-color)}.error.focused .start{color:var(--_error-focus-leading-content-color)}.error.focused .end{color:var(--_error-focus-trailing-content-color)}}@layer hcm{@media(forced-colors: active){.disabled :is(.start,.content,.end){color:GrayText;opacity:1}}}@layer styles{.label{box-sizing:border-box;color:var(--_label-text-color);overflow:hidden;max-width:100%;text-overflow:ellipsis;white-space:nowrap;z-index:1;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);width:min-content}.label-wrapper{inset:0;pointer-events:none;position:absolute}.label.resting{position:absolute;top:var(--_top-space)}.label.floating{font-size:var(--_label-text-populated-size);line-height:var(--_label-text-populated-line-height);transform-origin:top left}.label.hidden{opacity:0}.no-label .label{display:none}.label-wrapper{inset:0;position:absolute;text-align:initial}:hover .label{color:var(--_hover-label-text-color)}.focused .label{color:var(--_focus-label-text-color)}.disabled .label{color:var(--_disabled-label-text-color)}.disabled .label:not(.hidden){opacity:var(--_disabled-label-text-opacity)}.error .label{color:var(--_error-label-text-color)}.error:hover .label{color:var(--_error-hover-label-text-color)}.error.focused .label{color:var(--_error-focus-label-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .label:not(.hidden){color:GrayText;opacity:1}}}@layer styles{.supporting-text{color:var(--_supporting-text-color);display:flex;font-family:var(--_supporting-text-font);font-size:var(--_supporting-text-size);line-height:var(--_supporting-text-line-height);font-weight:var(--_supporting-text-weight);gap:16px;justify-content:space-between;padding-inline-start:var(--_supporting-text-leading-space);padding-inline-end:var(--_supporting-text-trailing-space);padding-top:var(--_supporting-text-top-space)}.supporting-text :nth-child(2){flex-shrink:0}:hover .supporting-text{color:var(--_hover-supporting-text-color)}.focus .supporting-text{color:var(--_focus-supporting-text-color)}.disabled .supporting-text{color:var(--_disabled-supporting-text-color);opacity:var(--_disabled-supporting-text-opacity)}.error .supporting-text{color:var(--_error-supporting-text-color)}.error:hover .supporting-text{color:var(--_error-hover-supporting-text-color)}.error.focus .supporting-text{color:var(--_error-focus-supporting-text-color)}}@layer hcm{@media(forced-colors: active){.disabled .supporting-text{color:GrayText;opacity:1}}}
`;
let Js = class extends op {
};
Js.styles = [ap, np], Js = g([Xt("md-filled-field")], Js);
const lp = {}, mn = Mr(class extends Tr {
  constructor(s) {
    if (super(s), s.type !== Kt.PROPERTY && s.type !== Kt.ATTRIBUTE && s.type !== Kt.BOOLEAN_ATTRIBUTE) throw Error("The `live` directive is not allowed on child or event bindings");
    if (!((t) => t.strings === void 0)(s)) throw Error("`live` bindings can only contain a single expression");
  }
  render(s) {
    return s;
  }
  update(s, [t]) {
    if (t === Et || t === I) return t;
    const e = s.element, i = s.name;
    if (s.type === Kt.PROPERTY) {
      if (t === e[i]) return Et;
    } else if (s.type === Kt.BOOLEAN_ATTRIBUTE) {
      if (!!t === e.hasAttribute(i)) return Et;
    } else if (s.type === Kt.ATTRIBUTE && e.getAttribute(i) === t + "") return Et;
    return ((r, o = lp) => {
      r._$AH = o;
    })(s), t;
  }
}), Wa = "important", cp = " !" + Wa, is = Mr(class extends Tr {
  constructor(s) {
    var t;
    if (super(s), s.type !== Kt.ATTRIBUTE || s.name !== "style" || ((t = s.strings) === null || t === void 0 ? void 0 : t.length) > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
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
        const o = typeof r == "string" && r.endsWith(cp);
        i.includes("-") || o ? e.setProperty(i, o ? r.slice(0, -11) : r, o ? Wa : "") : e[i] = r;
      }
    }
    return Et;
  }
}), dp = { fromAttribute: (s) => s ?? "", toAttribute: (s) => s || null }, ss = /* @__PURE__ */ Symbol("onReportValidity"), ki = /* @__PURE__ */ Symbol("privateCleanupFormListeners"), Fi = /* @__PURE__ */ Symbol("privateDoNotReportInvalid"), Oi = /* @__PURE__ */ Symbol("privateIsSelfReportingValidity"), Pi = /* @__PURE__ */ Symbol("privateCallOnReportValidity");
function Va(s) {
  var t, e, i;
  class r extends s {
    constructor(...n) {
      super(...n), this[t] = new AbortController(), this[e] = !1, this[i] = !1, this.addEventListener("invalid", ((a) => {
        !this[Fi] && a.isTrusted && this.addEventListener("invalid", (() => {
          this[Pi](a);
        }), { once: !0 });
      }), { capture: !0 });
    }
    checkValidity() {
      this[Fi] = !0;
      const n = super.checkValidity();
      return this[Fi] = !1, n;
    }
    reportValidity() {
      this[Oi] = !0;
      const n = super.reportValidity();
      return n && this[Pi](null), this[Oi] = !1, n;
    }
    [(t = ki, e = Fi, i = Oi, Pi)](n) {
      const a = n?.defaultPrevented;
      a || (this[ss](n), !a && n?.defaultPrevented && (this[Oi] || (function(l, c) {
        if (!l) return !0;
        let d;
        for (const h of l.elements) if (h.matches(":invalid")) {
          d = h;
          break;
        }
        return d === c;
      })(this[dt].form, this)) && this.focus());
    }
    [ss](n) {
      throw new Error("Implement [onReportValidity]");
    }
    formAssociatedCallback(n) {
      super.formAssociatedCallback && super.formAssociatedCallback(n), this[ki].abort(), n && (this[ki] = new AbortController(), (function(a, l, c, d) {
        const h = (function(u) {
          if (!js.has(u)) {
            const f = new EventTarget();
            js.set(u, f);
            for (const w of ["reportValidity", "requestSubmit"]) {
              const b = u[w];
              u[w] = function() {
                f.dispatchEvent(new Event("before"));
                const m = Reflect.apply(b, this, arguments);
                return f.dispatchEvent(new Event("after")), m;
              };
            }
          }
          return js.get(u);
        })(l);
        let A, p = !1, _ = !1;
        h.addEventListener("before", (() => {
          _ = !0, A = new AbortController(), p = !1, a.addEventListener("invalid", (() => {
            p = !0;
          }), { signal: A.signal });
        }), { signal: d }), h.addEventListener("after", (() => {
          var u;
          _ = !1, (u = A) === null || u === void 0 || u.abort(), p || c();
        }), { signal: d }), l.addEventListener("submit", (() => {
          _ || c();
        }), { signal: d });
      })(this, n, (() => {
        this[Pi](null);
      }), this[ki].signal));
    }
  }
  return r;
}
const js = /* @__PURE__ */ new WeakMap();
class hp extends Pr {
  computeValidity({ state: t, renderedControl: e }) {
    let i = e;
    Qe(t) && !i ? (i = this.inputControl || document.createElement("input"), this.inputControl = i) : i || (i = this.textAreaControl || document.createElement("textarea"), this.textAreaControl = i);
    const r = Qe(t) ? i : null;
    if (r && (r.type = t.type), i.value !== t.value && (i.value = t.value), i.required = t.required, r) {
      const o = t;
      o.pattern ? r.pattern = o.pattern : r.removeAttribute("pattern"), o.min ? r.min = o.min : r.removeAttribute("min"), o.max ? r.max = o.max : r.removeAttribute("max"), o.step ? r.step = o.step : r.removeAttribute("step");
    }
    return (t.minLength ?? -1) > -1 ? i.setAttribute("minlength", String(t.minLength)) : i.removeAttribute("minlength"), (t.maxLength ?? -1) > -1 ? i.setAttribute("maxlength", String(t.maxLength)) : i.removeAttribute("maxlength"), { validity: i.validity, validationMessage: i.validationMessage };
  }
  equals({ state: t }, { state: e }) {
    const i = t.type === e.type && t.value === e.value && t.required === e.required && t.minLength === e.minLength && t.maxLength === e.maxLength;
    return Qe(t) && Qe(e) ? i && t.pattern === e.pattern && t.min === e.min && t.max === e.max && t.step === e.step : i;
  }
  copy({ state: t }) {
    return { state: Qe(t) ? this.copyInput(t) : this.copyTextArea(t), renderedControl: null };
  }
  copyInput(t) {
    const { type: e, pattern: i, min: r, max: o, step: n } = t;
    return { ...this.copySharedState(t), type: e, pattern: i, min: r, max: o, step: n };
  }
  copyTextArea(t) {
    return { ...this.copySharedState(t), type: t.type };
  }
  copySharedState({ value: t, required: e, minLength: i, maxLength: r }) {
    return { value: t, required: e, minLength: i, maxLength: r };
  }
}
function Qe(s) {
  return s.type !== "textarea";
}
const Ap = Gt(Va(Fr(Or(mi(Y)))));
class Q extends Ap {
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
    return B`
      <span class="text-field ${ft(t)}">
        ${this.renderField()}
      </span>
    `;
  }
  updated(t) {
    const e = this.getInputOrTextarea().value;
    this.value !== e && (this.value = e);
  }
  renderField() {
    return ds`<${this.fieldTag}
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
    return B`
      <span class="icon leading" slot="start">
        <slot name="leading-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderTrailingIcon() {
    return B`
      <span class="icon trailing" slot="end">
        <slot name="trailing-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderInputOrTextarea() {
    const t = { direction: this.textDirection }, e = this.ariaLabel || this.label || I, i = this.autocomplete, r = (this.maxLength ?? -1) > -1, o = (this.minLength ?? -1) > -1;
    if (this.type === "textarea") return B`
        <textarea
          class="input"
          style=${is(t)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${e}
          autocomplete=${i || I}
          name=${this.name || I}
          ?disabled=${this.disabled}
          maxlength=${r ? this.maxLength : I}
          minlength=${o ? this.minLength : I}
          placeholder=${this.placeholder || I}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          rows=${this.rows}
          cols=${this.cols}
          .value=${mn(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent}></textarea>
      `;
    const n = this.renderPrefix(), a = this.renderSuffix(), l = this.inputMode;
    return B`
      <div class="input-wrapper">
        ${n}
        <input
          class="input"
          style=${is(t)}
          aria-describedby="description"
          aria-invalid=${this.hasError}
          aria-label=${e}
          autocomplete=${i || I}
          name=${this.name || I}
          ?disabled=${this.disabled}
          inputmode=${l || I}
          max=${this.max || I}
          maxlength=${r ? this.maxLength : I}
          min=${this.min || I}
          minlength=${o ? this.minLength : I}
          pattern=${this.pattern || I}
          placeholder=${this.placeholder || I}
          ?readonly=${this.readOnly}
          ?required=${this.required}
          ?multiple=${this.multiple}
          step=${this.step || I}
          type=${this.type}
          .value=${mn(this.value)}
          @change=${this.redispatchEvent}
          @focus=${this.handleFocusChange}
          @blur=${this.handleFocusChange}
          @input=${this.handleInput}
          @select=${this.redispatchEvent} />
        ${a}
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
    return t ? B`<span class="${ft({ suffix: e, prefix: !e })}">${t}</span>` : I;
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
    cs(this, t);
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
  [ye]() {
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
  [ci]() {
    return new hp((() => ({ state: this, renderedControl: this.inputOrTextarea })));
  }
  [di]() {
    return this.inputOrTextarea;
  }
  [ss](t) {
    t?.preventDefault();
    const e = this.getErrorText();
    var i;
    this.nativeError = !!t, this.nativeErrorText = this.validationMessage, e === this.getErrorText() && ((i = this.field) === null || i === void 0 || i.reannounceError());
  }
}
Q.shadowRootOptions = { ...Y.shadowRootOptions, delegatesFocus: !0 }, g([v({ type: Boolean, reflect: !0 })], Q.prototype, "error", void 0), g([v({ attribute: "error-text" })], Q.prototype, "errorText", void 0), g([v()], Q.prototype, "label", void 0), g([v({ type: Boolean, attribute: "no-asterisk" })], Q.prototype, "noAsterisk", void 0), g([v({ type: Boolean, reflect: !0 })], Q.prototype, "required", void 0), g([v()], Q.prototype, "value", void 0), g([v({ attribute: "prefix-text" })], Q.prototype, "prefixText", void 0), g([v({ attribute: "suffix-text" })], Q.prototype, "suffixText", void 0), g([v({ type: Boolean, attribute: "has-leading-icon" })], Q.prototype, "hasLeadingIcon", void 0), g([v({ type: Boolean, attribute: "has-trailing-icon" })], Q.prototype, "hasTrailingIcon", void 0), g([v({ attribute: "supporting-text" })], Q.prototype, "supportingText", void 0), g([v({ attribute: "text-direction" })], Q.prototype, "textDirection", void 0), g([v({ type: Number })], Q.prototype, "rows", void 0), g([v({ type: Number })], Q.prototype, "cols", void 0), g([v({ reflect: !0 })], Q.prototype, "inputMode", void 0), g([v()], Q.prototype, "max", void 0), g([v({ type: Number })], Q.prototype, "maxLength", void 0), g([v()], Q.prototype, "min", void 0), g([v({ type: Number })], Q.prototype, "minLength", void 0), g([v({ type: Boolean, attribute: "no-spinner" })], Q.prototype, "noSpinner", void 0), g([v()], Q.prototype, "pattern", void 0), g([v({ reflect: !0, converter: dp })], Q.prototype, "placeholder", void 0), g([v({ type: Boolean, reflect: !0 })], Q.prototype, "readOnly", void 0), g([v({ type: Boolean, reflect: !0 })], Q.prototype, "multiple", void 0), g([v()], Q.prototype, "step", void 0), g([v({ reflect: !0 })], Q.prototype, "type", void 0), g([v({ reflect: !0 })], Q.prototype, "autocomplete", void 0), g([$()], Q.prototype, "dirty", void 0), g([$()], Q.prototype, "focused", void 0), g([$()], Q.prototype, "nativeError", void 0), g([$()], Q.prototype, "nativeErrorText", void 0), g([j(".input")], Q.prototype, "inputOrTextarea", void 0), g([j(".field")], Q.prototype, "field", void 0), g([Ht({ slot: "leading-icon" })], Q.prototype, "leadingIcons", void 0), g([Ht({ slot: "trailing-icon" })], Q.prototype, "trailingIcons", void 0);
class pp extends Q {
  constructor() {
    super(...arguments), this.fieldTag = Wt`md-filled-field`;
  }
}
const gp = z`:host{display:inline-flex;outline:none;resize:both;text-align:start;-webkit-tap-highlight-color:rgba(0,0,0,0)}.text-field,.field{width:100%}.text-field{display:inline-flex}.field{cursor:text}.disabled .field{cursor:default}.text-field,.textarea .field{resize:inherit}slot[name=container]{border-radius:inherit}.icon{color:currentColor;display:flex;align-items:center;justify-content:center;fill:currentColor;position:relative}.icon ::slotted(*){display:flex;position:absolute}[has-start] .icon.leading{font-size:var(--_leading-icon-size);height:var(--_leading-icon-size);width:var(--_leading-icon-size)}[has-end] .icon.trailing{font-size:var(--_trailing-icon-size);height:var(--_trailing-icon-size);width:var(--_trailing-icon-size)}.input-wrapper{display:flex}.input-wrapper>*{all:inherit;padding:0}.input{caret-color:var(--_caret-color);overflow-x:hidden;text-align:inherit}.input::placeholder{color:currentColor;opacity:1}.input::-webkit-calendar-picker-indicator{display:none}.input::-webkit-search-decoration,.input::-webkit-search-cancel-button{display:none}@media(forced-colors: active){.input{background:none}}.no-spinner .input::-webkit-inner-spin-button,.no-spinner .input::-webkit-outer-spin-button{display:none}.no-spinner .input[type=number]{-moz-appearance:textfield}:focus-within .input{caret-color:var(--_focus-caret-color)}.error:focus-within .input{caret-color:var(--_error-focus-caret-color)}.text-field:not(.disabled) .prefix{color:var(--_input-text-prefix-color)}.text-field:not(.disabled) .suffix{color:var(--_input-text-suffix-color)}.text-field:not(.disabled) .input::placeholder{color:var(--_input-text-placeholder-color)}.prefix,.suffix{text-wrap:nowrap;width:min-content}.prefix{padding-inline-end:var(--_input-text-prefix-trailing-space)}.suffix{padding-inline-start:var(--_input-text-suffix-leading-space)}
`;
class _n extends pp {
  constructor() {
    super(...arguments), this.fieldTag = Wt`md-filled-field`;
  }
}
_n.styles = [gp, rp], customElements.define("ew-filled-text-field", _n);
class up extends Y {
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  render() {
    return B`<span class="shadow"></span>`;
  }
}
const fp = z`:host,.shadow,.shadow::before,.shadow::after{border-radius:inherit;inset:0;position:absolute;transition-duration:inherit;transition-property:inherit;transition-timing-function:inherit}:host{display:flex;pointer-events:none;transition-property:box-shadow,opacity}.shadow::before,.shadow::after{content:"";transition-property:box-shadow,opacity;--_level: var(--md-elevation-level, 0);--_shadow-color: var(--md-elevation-shadow-color, var(--md-sys-color-shadow, #000))}.shadow::before{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 3,1) + 2*clamp(0,var(--_level) - 4,1))) calc(1px*(2*clamp(0,var(--_level),1) + clamp(0,var(--_level) - 2,1) + clamp(0,var(--_level) - 4,1))) 0px var(--_shadow-color);opacity:.3}.shadow::after{box-shadow:0px calc(1px*(clamp(0,var(--_level),1) + clamp(0,var(--_level) - 1,1) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(3*clamp(0,var(--_level),2) + 2*clamp(0,var(--_level) - 2,3))) calc(1px*(clamp(0,var(--_level),4) + 2*clamp(0,var(--_level) - 4,1))) var(--_shadow-color);opacity:.15}
`;
let Ws = class extends up {
};
Ws.styles = [fp], Ws = g([Xt("md-elevation")], Ws);
const vn = function(s, t) {
  return new CustomEvent("close-menu", { bubbles: !0, composed: !0, detail: { initiator: s, reason: t, itemPath: [s] } });
}, Ar = { SPACE: "Space", ENTER: "Enter" }, mp = "click-selection", _p = "keydown", vp = { ESCAPE: "Escape", SPACE: Ar.SPACE, ENTER: Ar.ENTER };
function qa(s) {
  return Object.values(vp).some(((t) => t === s));
}
function pr(s, t) {
  const e = new Event("md-contains", { bubbles: !0, composed: !0 });
  let i = [];
  const r = (o) => {
    i = o.composedPath();
  };
  return t.addEventListener("md-contains", r), s.dispatchEvent(e), t.removeEventListener("md-contains", r), i.length > 0;
}
const Ki = "none", Ep = "list-root", gr = "first-item", Za = "last-item", wp = "end-start", bp = "start-start";
class yp {
  constructor(t, e) {
    this.host = t, this.getProperties = e, this.surfaceStylesInternal = { display: "none" }, this.lastValues = { isOpen: !1 }, this.host.addController(this);
  }
  get surfaceStyles() {
    return this.surfaceStylesInternal;
  }
  async position() {
    const { surfaceEl: t, anchorEl: e, anchorCorner: i, surfaceCorner: r, positioning: o, xOffset: n, yOffset: a, disableBlockFlip: l, disableInlineFlip: c, repositionStrategy: d } = this.getProperties(), h = i.toLowerCase().trim(), A = r.toLowerCase().trim();
    if (!t || !e) return;
    const p = window.innerWidth, _ = window.innerHeight, u = document.createElement("div");
    u.style.opacity = "0", u.style.position = "fixed", u.style.display = "block", u.style.inset = "0", document.body.appendChild(u);
    const f = u.getBoundingClientRect();
    u.remove();
    const w = window.innerHeight - f.bottom, b = window.innerWidth - f.right;
    this.surfaceStylesInternal = { display: "block", opacity: "0" }, this.host.requestUpdate(), await this.host.updateComplete, t.popover && t.isConnected && t.showPopover();
    const m = t.getSurfacePositionClientRect ? t.getSurfacePositionClientRect() : t.getBoundingClientRect(), C = e.getSurfacePositionClientRect ? e.getSurfacePositionClientRect() : e.getBoundingClientRect(), [R, E] = A.split("-"), [M, D] = h.split("-"), x = getComputedStyle(t).direction === "ltr";
    let { blockInset: S, blockOutOfBoundsCorrection: T, surfaceBlockProperty: k } = this.calculateBlock({ surfaceRect: m, anchorRect: C, anchorBlock: M, surfaceBlock: R, yOffset: a, positioning: o, windowInnerHeight: _, blockScrollbarHeight: w });
    if (T && !l) {
      const yt = R === "start" ? "end" : "start", nt = M === "start" ? "end" : "start", q = this.calculateBlock({ surfaceRect: m, anchorRect: C, anchorBlock: nt, surfaceBlock: yt, yOffset: a, positioning: o, windowInnerHeight: _, blockScrollbarHeight: w });
      T > q.blockOutOfBoundsCorrection && (S = q.blockInset, T = q.blockOutOfBoundsCorrection, k = q.surfaceBlockProperty);
    }
    let { inlineInset: N, inlineOutOfBoundsCorrection: et, surfaceInlineProperty: bt } = this.calculateInline({ surfaceRect: m, anchorRect: C, anchorInline: D, surfaceInline: E, xOffset: n, positioning: o, isLTR: x, windowInnerWidth: p, inlineScrollbarWidth: b });
    if (et && !c) {
      const yt = E === "start" ? "end" : "start", nt = D === "start" ? "end" : "start", q = this.calculateInline({ surfaceRect: m, anchorRect: C, anchorInline: nt, surfaceInline: yt, xOffset: n, positioning: o, isLTR: x, windowInnerWidth: p, inlineScrollbarWidth: b });
      Math.abs(et) > Math.abs(q.inlineOutOfBoundsCorrection) && (N = q.inlineInset, et = q.inlineOutOfBoundsCorrection, bt = q.surfaceInlineProperty);
    }
    d === "move" && (S -= T, N -= et), this.surfaceStylesInternal = { display: "block", opacity: "1", [k]: `${S}px`, [bt]: `${N}px` }, d === "resize" && (T && (this.surfaceStylesInternal.height = m.height - T + "px"), et && (this.surfaceStylesInternal.width = m.width - et + "px")), this.host.requestUpdate();
  }
  calculateBlock(t) {
    const { surfaceRect: e, anchorRect: i, anchorBlock: r, surfaceBlock: o, yOffset: n, positioning: a, windowInnerHeight: l, blockScrollbarHeight: c } = t, d = a === "fixed" || a === "document" ? 1 : 0, h = a === "document" ? 1 : 0, A = o === "start" ? 1 : 0, p = o === "end" ? 1 : 0, _ = (r !== o ? 1 : 0) * i.height + n, u = A * i.top + p * (l - i.bottom - c);
    return { blockInset: d * u + h * (A * window.scrollY - p * window.scrollY) + _, blockOutOfBoundsCorrection: Math.abs(Math.min(0, l - u - _ - e.height)), surfaceBlockProperty: o === "start" ? "inset-block-start" : "inset-block-end" };
  }
  calculateInline(t) {
    const { isLTR: e, surfaceInline: i, anchorInline: r, anchorRect: o, surfaceRect: n, xOffset: a, positioning: l, windowInnerWidth: c, inlineScrollbarWidth: d } = t, h = l === "fixed" || l === "document" ? 1 : 0, A = l === "document" ? 1 : 0, p = e ? 1 : 0, _ = e ? 0 : 1, u = i === "start" ? 1 : 0, f = i === "end" ? 1 : 0, w = (r !== i ? 1 : 0) * o.width + a, b = p * (u * o.left + f * (c - o.right - d)) + _ * (u * (c - o.right - d) + f * o.left);
    let m = i === "start" ? "inset-inline-start" : "inset-inline-end";
    return l !== "document" && l !== "fixed" || (m = i === "start" && e || i === "end" && !e ? "left" : "right"), { inlineInset: h * b + w + A * (p * (u * window.scrollX - f * window.scrollX) + _ * (f * window.scrollX - u * window.scrollX)), inlineOutOfBoundsCorrection: Math.abs(Math.min(0, c - b - w - n.width)), surfaceInlineProperty: m };
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
    for (const [n, a] of Object.entries(t)) if (e = e || a !== this.lastValues[n], e) break;
    const i = this.lastValues.isOpen !== t.isOpen, r = !!t.anchorEl, o = !!t.surfaceEl;
    e && r && o && (this.lastValues.isOpen = t.isOpen, t.isOpen ? (this.lastValues = t, await this.position(), t.onOpen()) : i && (await t.beforeClose(), this.close(), t.onClose()));
  }
  close() {
    this.surfaceStylesInternal = { display: "none" }, this.host.requestUpdate();
    const t = this.getProperties().surfaceEl;
    t != null && t.popover && t != null && t.isConnected && t.hidePopover();
  }
}
const En = 0, Ft = 1, Cp = 2;
class Bp {
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
    this.active && (t.code === "Space" || t.code === "Enter" || t.code.startsWith("Arrow") || t.code === "Escape" || (this.isTypingAhead = !0, this.typeaheadRecords = this.items.map(((e, i) => [i, e, e.typeaheadText.trim().toLowerCase()])), this.lastActiveRecord = this.typeaheadRecords.find(((e) => e[Ft].tabIndex === 0)) ?? null, this.lastActiveRecord && (this.lastActiveRecord[Ft].tabIndex = -1), this.typeahead(t)));
  }
  typeahead(t) {
    if (t.defaultPrevented) return;
    if (clearTimeout(this.cancelTypeaheadTimeout), t.code === "Enter" || t.code.startsWith("Arrow") || t.code === "Escape") return this.endTypeahead(), void (this.lastActiveRecord && (this.lastActiveRecord[Ft].tabIndex = -1));
    t.code === "Space" && t.preventDefault(), this.cancelTypeaheadTimeout = setTimeout(this.endTypeahead, this.getProperties().typeaheadBufferTime), this.typaheadBuffer += t.key.toLowerCase();
    const e = this.lastActiveRecord ? this.lastActiveRecord[En] : -1, i = this.typeaheadRecords.length, r = (l) => (l[En] + i - e) % i, o = this.typeaheadRecords.filter(((l) => !l[Ft].disabled && l[Cp].startsWith(this.typaheadBuffer))).sort(((l, c) => r(l) - r(c)));
    if (o.length === 0) return clearTimeout(this.cancelTypeaheadTimeout), this.lastActiveRecord && (this.lastActiveRecord[Ft].tabIndex = -1), void this.endTypeahead();
    const n = this.typaheadBuffer.length === 1;
    let a;
    a = this.lastActiveRecord === o[0] && n ? o[1] ?? o[0] : o[0], this.lastActiveRecord && (this.lastActiveRecord[Ft].tabIndex = -1), this.lastActiveRecord = a, a[Ft].tabIndex = 0, a[Ft].focus();
  }
}
const Xa = /* @__PURE__ */ new Set([rt.ArrowDown, rt.ArrowUp, rt.Home, rt.End]), Ip = /* @__PURE__ */ new Set([rt.ArrowLeft, rt.ArrowRight, ...Xa]);
class X extends Y {
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
    super(), this.anchor = "", this.positioning = "absolute", this.quick = !1, this.hasOverflow = !1, this.open = !1, this.xOffset = 0, this.yOffset = 0, this.noHorizontalFlip = !1, this.noVerticalFlip = !1, this.typeaheadDelay = 200, this.anchorCorner = wp, this.menuCorner = bp, this.stayOpenOnOutsideClick = !1, this.stayOpenOnFocusout = !1, this.skipRestoreFocus = !1, this.defaultFocus = gr, this.noNavigationWrap = !1, this.typeaheadActive = !0, this.isSubmenu = !1, this.pointerPath = [], this.isRepositioning = !1, this.openCloseAnimationSignal = gh(), this.listController = new Ca({ isItem: (t) => t.hasAttribute("md-menu-item"), getPossibleItems: () => this.slotItems, isRtl: () => getComputedStyle(this).direction === "rtl", deactivateItem: (t) => {
      t.selected = !1, t.tabIndex = -1;
    }, activateItem: (t) => {
      t.selected = !0, t.tabIndex = 0;
    }, isNavigableKey: (t) => this.isSubmenu ? t === (getComputedStyle(this).direction === "rtl" ? rt.ArrowLeft : rt.ArrowRight) || Xa.has(t) : Ip.has(t), wrapNavigation: () => !this.noNavigationWrap }), this.lastFocusedElement = null, this.typeaheadController = new Bp((() => ({ getItems: () => this.items, typeaheadBufferTime: this.typeaheadDelay, active: this.typeaheadActive }))), this.currentAnchorElement = null, this.internals = this.attachInternals(), this.menuPositionController = new yp(this, (() => ({ anchorCorner: this.anchorCorner, surfaceCorner: this.menuCorner, surfaceEl: this.surfaceEl, anchorEl: this.anchorElement, positioning: this.positioning === "popover" ? "document" : this.positioning, isOpen: this.open, xOffset: this.xOffset, yOffset: this.yOffset, disableBlockFlip: this.noVerticalFlip, disableInlineFlip: this.noHorizontalFlip, onOpen: this.onOpened, beforeClose: this.beforeClose, onClose: this.onClosed, repositionStrategy: this.hasOverflow && this.positioning !== "popover" ? "move" : "resize" }))), this.onWindowResize = () => {
      this.isRepositioning || this.positioning !== "document" && this.positioning !== "fixed" && this.positioning !== "popover" || (this.isRepositioning = !0, this.reposition(), this.isRepositioning = !1);
    }, this.handleFocusout = async (t) => {
      const e = this.anchorElement;
      if (this.stayOpenOnFocusout || !this.open || this.pointerPath.includes(e)) return;
      if (t.relatedTarget) {
        if (pr(t.relatedTarget, this) || this.pointerPath.length !== 0 && pr(t.relatedTarget, e)) return;
      } else if (this.pointerPath.includes(this)) return;
      const i = this.skipRestoreFocus;
      this.skipRestoreFocus = !0, this.close(), await this.updateComplete, this.skipRestoreFocus = i;
    }, this.onOpened = async () => {
      this.lastFocusedElement = (function(r = document) {
        let o = r.activeElement;
        for (; o && (n = o) !== null && n !== void 0 && (n = n.shadowRoot) !== null && n !== void 0 && n.activeElement; ) {
          var n;
          o = o.shadowRoot.activeElement;
        }
        return o;
      })();
      const t = this.items, e = We(t);
      e && this.defaultFocus !== Ki && (e.item.tabIndex = -1);
      let i = !this.quick;
      switch (this.quick ? this.dispatchEvent(new Event("opening")) : i = !!await this.animateOpen(), this.defaultFocus) {
        case gr:
          const r = kr(t);
          r && (r.tabIndex = 0, r.focus(), await r.updateComplete);
          break;
        case Za:
          const o = ya(t);
          o && (o.tabIndex = 0, o.focus(), await o.updateComplete);
          break;
        case Ep:
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
    return B`
      <div
        class="menu ${ft(this.getSurfaceClasses())}"
        style=${is(this.menuPositionController.surfaceStyles)}
        popover=${this.positioning === "popover" ? "manual" : I}>
        ${this.renderElevation()}
        <div class="items">
          <div class="item-padding"> ${this.renderMenuItems()} </div>
        </div>
      </div>
    `;
  }
  renderMenuItems() {
    return B`<slot
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
    return B`<md-elevation part="elevation"></md-elevation>`;
  }
  getSurfaceClasses() {
    return { open: this.open, fixed: this.positioning === "fixed", "has-overflow": this.hasOverflow };
  }
  captureKeydown(t) {
    t.target === this && !t.defaultPrevented && qa(t.code) && (t.preventDefault(), this.close()), this.typeaheadController.onKeydown(t);
  }
  async animateOpen() {
    const t = this.surfaceEl, e = this.slotEl;
    if (!t || !e) return !0;
    const i = this.openDirection;
    this.dispatchEvent(new Event("opening")), t.classList.toggle("animating", !0);
    const r = this.openCloseAnimationSignal.start(), o = t.offsetHeight, n = i === "UP", a = this.items, l = 250 / a.length, c = t.animate([{ height: "0px" }, { height: `${o}px` }], { duration: 500, easing: Dt.EMPHASIZED }), d = e.animate([{ transform: n ? `translateY(-${o}px)` : "" }, { transform: "" }], { duration: 500, easing: Dt.EMPHASIZED }), h = t.animate([{ opacity: 0 }, { opacity: 1 }], 50), A = [];
    for (let u = 0; u < a.length; u++) {
      const f = a[n ? a.length - 1 - u : u], w = f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: l * u });
      f.classList.toggle("md-menu-hidden", !0), w.addEventListener("finish", (() => {
        f.classList.toggle("md-menu-hidden", !1);
      })), A.push([f, w]);
    }
    let p = (u) => {
    };
    const _ = new Promise(((u) => {
      p = u;
    }));
    return r.addEventListener("abort", (() => {
      c.cancel(), d.cancel(), h.cancel(), A.forEach((([u, f]) => {
        u.classList.toggle("md-menu-hidden", !1), f.cancel();
      })), p(!0);
    })), c.addEventListener("finish", (() => {
      t.classList.toggle("animating", !1), this.openCloseAnimationSignal.finish(), p(!1);
    })), await _;
  }
  animateClose() {
    let t;
    const e = new Promise(((u) => {
      t = u;
    })), i = this.surfaceEl, r = this.slotEl;
    if (!i || !r) return t(!1), e;
    const o = this.openDirection === "UP";
    this.dispatchEvent(new Event("closing")), i.classList.toggle("animating", !0);
    const n = this.openCloseAnimationSignal.start(), a = i.offsetHeight, l = this.items, c = 150, d = 50 / l.length, h = i.animate([{ height: `${a}px` }, { height: 0.35 * a + "px" }], { duration: c, easing: Dt.EMPHASIZED_ACCELERATE }), A = r.animate([{ transform: "" }, { transform: o ? `translateY(-${0.65 * a}px)` : "" }], { duration: c, easing: Dt.EMPHASIZED_ACCELERATE }), p = i.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 50, delay: 100 }), _ = [];
    for (let u = 0; u < l.length; u++) {
      const f = l[o ? u : l.length - 1 - u], w = f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 50, delay: 50 + d * u });
      w.addEventListener("finish", (() => {
        f.classList.toggle("md-menu-hidden", !0);
      })), _.push([f, w]);
    }
    return n.addEventListener("abort", (() => {
      h.cancel(), A.cancel(), p.cancel(), _.forEach((([u, f]) => {
        f.cancel(), u.classList.toggle("md-menu-hidden", !1);
      })), t(!1);
    })), h.addEventListener("finish", (() => {
      i.classList.toggle("animating", !1), _.forEach((([u]) => {
        u.classList.toggle("md-menu-hidden", !1);
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
g([j(".menu")], X.prototype, "surfaceEl", void 0), g([j("slot")], X.prototype, "slotEl", void 0), g([v()], X.prototype, "anchor", void 0), g([v()], X.prototype, "positioning", void 0), g([v({ type: Boolean })], X.prototype, "quick", void 0), g([v({ type: Boolean, attribute: "has-overflow" })], X.prototype, "hasOverflow", void 0), g([v({ type: Boolean, reflect: !0 })], X.prototype, "open", void 0), g([v({ type: Number, attribute: "x-offset" })], X.prototype, "xOffset", void 0), g([v({ type: Number, attribute: "y-offset" })], X.prototype, "yOffset", void 0), g([v({ type: Boolean, attribute: "no-horizontal-flip" })], X.prototype, "noHorizontalFlip", void 0), g([v({ type: Boolean, attribute: "no-vertical-flip" })], X.prototype, "noVerticalFlip", void 0), g([v({ type: Number, attribute: "typeahead-delay" })], X.prototype, "typeaheadDelay", void 0), g([v({ attribute: "anchor-corner" })], X.prototype, "anchorCorner", void 0), g([v({ attribute: "menu-corner" })], X.prototype, "menuCorner", void 0), g([v({ type: Boolean, attribute: "stay-open-on-outside-click" })], X.prototype, "stayOpenOnOutsideClick", void 0), g([v({ type: Boolean, attribute: "stay-open-on-focusout" })], X.prototype, "stayOpenOnFocusout", void 0), g([v({ type: Boolean, attribute: "skip-restore-focus" })], X.prototype, "skipRestoreFocus", void 0), g([v({ attribute: "default-focus" })], X.prototype, "defaultFocus", void 0), g([v({ type: Boolean, attribute: "no-navigation-wrap" })], X.prototype, "noNavigationWrap", void 0), g([Ht({ flatten: !0 })], X.prototype, "slotItems", void 0), g([$()], X.prototype, "typeaheadActive", void 0);
const xp = z`:host{--md-elevation-level: var(--md-menu-container-elevation, 2);--md-elevation-shadow-color: var(--md-menu-container-shadow-color, var(--md-sys-color-shadow, #000));min-width:112px;color:unset;display:contents}md-focus-ring{--md-focus-ring-shape: var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px))}.menu{border-radius:var(--md-menu-container-shape, var(--md-sys-shape-corner-extra-small, 4px));display:none;inset:auto;border:none;padding:0px;overflow:visible;background-color:rgba(0,0,0,0);color:inherit;opacity:0;z-index:20;position:absolute;user-select:none;max-height:inherit;height:inherit;min-width:inherit;max-width:inherit;scrollbar-width:inherit}.menu::backdrop{display:none}.fixed{position:fixed}.items{display:block;list-style-type:none;margin:0;outline:none;box-sizing:border-box;background-color:var(--md-menu-container-color, var(--md-sys-color-surface-container, #f3edf7));height:inherit;max-height:inherit;overflow:auto;min-width:inherit;max-width:inherit;border-radius:inherit;scrollbar-width:inherit}.item-padding{padding-block:var(--md-menu-top-space, 8px) var(--md-menu-bottom-space, 8px)}.has-overflow:not([popover]) .items{overflow:visible}.has-overflow.animating .items,.animating .items{overflow:hidden}.has-overflow.animating .items{pointer-events:none}.animating ::slotted(.md-menu-hidden){opacity:0}slot{display:block;height:inherit;max-height:inherit}::slotted(:is(md-divider,[role=separator])){margin:8px 0}@media(forced-colors: active){.menu{border-style:solid;border-color:CanvasText;border-width:1px}}
`;
let Vs = class extends X {
};
Vs.styles = [xp], Vs = g([Xt("md-menu")], Vs);
class Sp extends Pr {
  computeValidity(t) {
    return this.selectControl || (this.selectControl = document.createElement("select")), Dr(B`<option value=${t.value}></option>`, this.selectControl), this.selectControl.value = t.value, this.selectControl.required = t.required, { validity: this.selectControl.validity, validationMessage: this.selectControl.validationMessage };
  }
  equals(t, e) {
    return t.value === e.value && t.required === e.required;
  }
  copy({ value: t, required: e }) {
    return { value: t, required: e };
  }
}
var wn;
const Ui = /* @__PURE__ */ Symbol("value"), Rp = Gt(Va(Fr(Or(mi(Y)))));
class J extends Rp {
  get value() {
    return this[Ui];
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
    super(), this.quick = !1, this.required = !1, this.errorText = "", this.label = "", this.noAsterisk = !1, this.supportingText = "", this.error = !1, this.menuPositioning = "popover", this.clampMenuWidth = !1, this.typeaheadDelay = 200, this.hasLeadingIcon = !1, this.displayText = "", this.menuAlign = "start", this[wn] = "", this.lastUserSetValue = null, this.lastUserSetSelectedIndex = null, this.lastSelectedOption = null, this.lastSelectedOptionRecords = [], this.nativeError = !1, this.nativeErrorText = "", this.focused = !1, this.open = !1, this.defaultFocus = Ki, this.prevOpen = this.open, this.selectWidth = 0, this.addEventListener("focus", this.handleFocus.bind(this)), this.addEventListener("blur", this.handleBlur.bind(this));
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
  [(wn = Ui, ss)](t) {
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
    return B`
      <span
        class="select ${ft(this.getRenderClasses())}"
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
    return ds`
      <${this.fieldTag}
          aria-haspopup="listbox"
          role="combobox"
          part="field"
          id="field"
          tabindex=${this.disabled ? "-1" : "0"}
          aria-label=${t || I}
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
    return B`
      <span class="icon leading" slot="start">
        <slot name="leading-icon" @slotchange=${this.handleIconChange}></slot>
      </span>
    `;
  }
  renderTrailingIcon() {
    return B`
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
    return B`<div id="label">${this.displayText || B`&nbsp;`}</div>`;
  }
  renderMenu() {
    const t = this.label || this.ariaLabel;
    return B`<div class="menu-wrapper">
      <md-menu
        id="listbox"
        .defaultFocus=${this.defaultFocus}
        role="listbox"
        tabindex="-1"
        aria-label=${t || I}
        stay-open-on-focusout
        part="menu"
        exportparts="focus-ring: menu-focus-ring"
        anchor="field"
        style=${is({ "--__menu-min-width": `${this.selectWidth}px`, "--__menu-max-width": this.clampMenuWidth ? `${this.selectWidth}px` : void 0 })}
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
    return B`<slot></slot>`;
  }
  handleKeydown(t) {
    if (this.open || this.disabled || !this.menu) return;
    const e = this.menu.typeaheadController, i = t.code === "Space" || t.code === "ArrowDown" || t.code === "ArrowUp" || t.code === "End" || t.code === "Home" || t.code === "Enter";
    if (!e.isTypingAhead && i) {
      switch (t.preventDefault(), this.open = !0, t.code) {
        case "Space":
        case "ArrowDown":
        case "Enter":
          this.defaultFocus = Ki;
          break;
        case "End":
          this.defaultFocus = Za;
          break;
        case "ArrowUp":
        case "Home":
          this.defaultFocus = gr;
      }
      return;
    }
    if (t.key.length === 1) {
      var r, o;
      e.onKeydown(t), t.preventDefault();
      const { lastActiveRecord: n } = e;
      if (!n) return;
      (r = this.labelEl) === null || r === void 0 || (o = r.setAttribute) === null || o === void 0 || o.call(r, "aria-live", "polite"), this.selectItem(n[Ft]) && this.dispatchInteractionEvents();
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
    t.relatedTarget && pr(t.relatedTarget, this) || (this.open = !1);
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
      e = this.lastSelectedOption !== i, this.lastSelectedOption = i, this[Ui] = i.value, this.displayText = i.displayText;
    } else e = this.lastSelectedOption !== null, this.lastSelectedOption = null, this[Ui] = "", this.displayText = "";
    return e;
  }
  async handleOpening(t) {
    var e, i, r;
    if ((e = this.labelEl) === null || e === void 0 || (i = e.removeAttribute) === null || i === void 0 || i.call(e, "aria-live"), this.redispatchEvent(t), this.defaultFocus !== Ki) return;
    const o = this.menu.items, n = (r = We(o)) === null || r === void 0 ? void 0 : r.item;
    let [a] = this.lastSelectedOptionRecords[0] ?? [null];
    n && n !== a && (n.tabIndex = -1), a = a ?? o[0], a && (a.tabIndex = 0, a.focus());
  }
  redispatchEvent(t) {
    cs(this, t);
  }
  handleClosed(t) {
    this.open = !1, this.redispatchEvent(t);
  }
  handleCloseMenu(t) {
    const e = t.detail.reason, i = t.detail.itemPath[0];
    this.open = !1;
    let r = !1;
    var o;
    e.kind === "click-selection" || e.kind === "keydown" && (o = e.key, Object.values(Ar).some(((n) => n === o))) ? r = this.selectItem(i) : (i.tabIndex = -1, i.blur()), r && this.dispatchInteractionEvents();
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
  [ye]() {
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
  [ci]() {
    return new Sp((() => this));
  }
  [di]() {
    return this.field;
  }
}
J.shadowRootOptions = { ...Y.shadowRootOptions, delegatesFocus: !0 }, g([v({ type: Boolean })], J.prototype, "quick", void 0), g([v({ type: Boolean })], J.prototype, "required", void 0), g([v({ type: String, attribute: "error-text" })], J.prototype, "errorText", void 0), g([v()], J.prototype, "label", void 0), g([v({ type: Boolean, attribute: "no-asterisk" })], J.prototype, "noAsterisk", void 0), g([v({ type: String, attribute: "supporting-text" })], J.prototype, "supportingText", void 0), g([v({ type: Boolean, reflect: !0 })], J.prototype, "error", void 0), g([v({ attribute: "menu-positioning" })], J.prototype, "menuPositioning", void 0), g([v({ type: Boolean, attribute: "clamp-menu-width" })], J.prototype, "clampMenuWidth", void 0), g([v({ type: Number, attribute: "typeahead-delay" })], J.prototype, "typeaheadDelay", void 0), g([v({ type: Boolean, attribute: "has-leading-icon" })], J.prototype, "hasLeadingIcon", void 0), g([v({ attribute: "display-text" })], J.prototype, "displayText", void 0), g([v({ attribute: "menu-align" })], J.prototype, "menuAlign", void 0), g([v()], J.prototype, "value", null), g([v({ type: Number, attribute: "selected-index" })], J.prototype, "selectedIndex", null), g([$()], J.prototype, "nativeError", void 0), g([$()], J.prototype, "nativeErrorText", void 0), g([$()], J.prototype, "focused", void 0), g([$()], J.prototype, "open", void 0), g([$()], J.prototype, "defaultFocus", void 0), g([j(".field")], J.prototype, "field", void 0), g([j("md-menu")], J.prototype, "menu", void 0), g([j("#label")], J.prototype, "labelEl", void 0), g([Ht({ slot: "leading-icon", flatten: !0 })], J.prototype, "leadingIcons", void 0);
class Dp extends J {
  constructor() {
    super(...arguments), this.fieldTag = Wt`md-filled-field`;
  }
}
const Mp = z`:host{--_text-field-active-indicator-color: var(--md-filled-select-text-field-active-indicator-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-active-indicator-height: var(--md-filled-select-text-field-active-indicator-height, 1px);--_text-field-container-color: var(--md-filled-select-text-field-container-color, var(--md-sys-color-surface-container-highest, #e6e0e9));--_text-field-disabled-active-indicator-color: var(--md-filled-select-text-field-disabled-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-active-indicator-height: var(--md-filled-select-text-field-disabled-active-indicator-height, 1px);--_text-field-disabled-active-indicator-opacity: var(--md-filled-select-text-field-disabled-active-indicator-opacity, 0.38);--_text-field-disabled-container-color: var(--md-filled-select-text-field-disabled-container-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-container-opacity: var(--md-filled-select-text-field-disabled-container-opacity, 0.04);--_text-field-disabled-input-text-color: var(--md-filled-select-text-field-disabled-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-input-text-opacity: var(--md-filled-select-text-field-disabled-input-text-opacity, 0.38);--_text-field-disabled-label-text-color: var(--md-filled-select-text-field-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-label-text-opacity: var(--md-filled-select-text-field-disabled-label-text-opacity, 0.38);--_text-field-disabled-leading-icon-color: var(--md-filled-select-text-field-disabled-leading-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-leading-icon-opacity: var(--md-filled-select-text-field-disabled-leading-icon-opacity, 0.38);--_text-field-disabled-supporting-text-color: var(--md-filled-select-text-field-disabled-supporting-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-supporting-text-opacity: var(--md-filled-select-text-field-disabled-supporting-text-opacity, 0.38);--_text-field-disabled-trailing-icon-color: var(--md-filled-select-text-field-disabled-trailing-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-disabled-trailing-icon-opacity: var(--md-filled-select-text-field-disabled-trailing-icon-opacity, 0.38);--_text-field-error-active-indicator-color: var(--md-filled-select-text-field-error-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-active-indicator-color: var(--md-filled-select-text-field-error-focus-active-indicator-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-input-text-color: var(--md-filled-select-text-field-error-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-focus-label-text-color: var(--md-filled-select-text-field-error-focus-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-leading-icon-color: var(--md-filled-select-text-field-error-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-focus-supporting-text-color: var(--md-filled-select-text-field-error-focus-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-focus-trailing-icon-color: var(--md-filled-select-text-field-error-focus-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-active-indicator-color: var(--md-filled-select-text-field-error-hover-active-indicator-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-input-text-color: var(--md-filled-select-text-field-error-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-label-text-color: var(--md-filled-select-text-field-error-hover-label-text-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-hover-leading-icon-color: var(--md-filled-select-text-field-error-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-hover-state-layer-color: var(--md-filled-select-text-field-error-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-hover-state-layer-opacity: var(--md-filled-select-text-field-error-hover-state-layer-opacity, 0.08);--_text-field-error-hover-supporting-text-color: var(--md-filled-select-text-field-error-hover-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-hover-trailing-icon-color: var(--md-filled-select-text-field-error-hover-trailing-icon-color, var(--md-sys-color-on-error-container, #410e0b));--_text-field-error-input-text-color: var(--md-filled-select-text-field-error-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-error-label-text-color: var(--md-filled-select-text-field-error-label-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-leading-icon-color: var(--md-filled-select-text-field-error-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-error-supporting-text-color: var(--md-filled-select-text-field-error-supporting-text-color, var(--md-sys-color-error, #b3261e));--_text-field-error-trailing-icon-color: var(--md-filled-select-text-field-error-trailing-icon-color, var(--md-sys-color-error, #b3261e));--_text-field-focus-active-indicator-color: var(--md-filled-select-text-field-focus-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-active-indicator-height: var(--md-filled-select-text-field-focus-active-indicator-height, 3px);--_text-field-focus-input-text-color: var(--md-filled-select-text-field-focus-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-focus-label-text-color: var(--md-filled-select-text-field-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_text-field-focus-leading-icon-color: var(--md-filled-select-text-field-focus-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-supporting-text-color: var(--md-filled-select-text-field-focus-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-focus-trailing-icon-color: var(--md-filled-select-text-field-focus-trailing-icon-color, var(--md-sys-color-primary, #6750a4));--_text-field-hover-active-indicator-color: var(--md-filled-select-text-field-hover-active-indicator-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-active-indicator-height: var(--md-filled-select-text-field-hover-active-indicator-height, 1px);--_text-field-hover-input-text-color: var(--md-filled-select-text-field-hover-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-label-text-color: var(--md-filled-select-text-field-hover-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-leading-icon-color: var(--md-filled-select-text-field-hover-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-state-layer-color: var(--md-filled-select-text-field-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-hover-state-layer-opacity: var(--md-filled-select-text-field-hover-state-layer-opacity, 0.08);--_text-field-hover-supporting-text-color: var(--md-filled-select-text-field-hover-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-hover-trailing-icon-color: var(--md-filled-select-text-field-hover-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-input-text-color: var(--md-filled-select-text-field-input-text-color, var(--md-sys-color-on-surface, #1d1b20));--_text-field-input-text-font: var(--md-filled-select-text-field-input-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-input-text-line-height: var(--md-filled-select-text-field-input-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-input-text-size: var(--md-filled-select-text-field-input-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-input-text-weight: var(--md-filled-select-text-field-input-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-label-text-color: var(--md-filled-select-text-field-label-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-label-text-font: var(--md-filled-select-text-field-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-label-text-line-height: var(--md-filled-select-text-field-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));--_text-field-label-text-populated-line-height: var(--md-filled-select-text-field-label-text-populated-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-label-text-populated-size: var(--md-filled-select-text-field-label-text-populated-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-label-text-size: var(--md-filled-select-text-field-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));--_text-field-label-text-weight: var(--md-filled-select-text-field-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-leading-icon-color: var(--md-filled-select-text-field-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-leading-icon-size: var(--md-filled-select-text-field-leading-icon-size, 24px);--_text-field-supporting-text-color: var(--md-filled-select-text-field-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-supporting-text-font: var(--md-filled-select-text-field-supporting-text-font, var(--md-sys-typescale-body-small-font, var(--md-ref-typeface-plain, Roboto)));--_text-field-supporting-text-line-height: var(--md-filled-select-text-field-supporting-text-line-height, var(--md-sys-typescale-body-small-line-height, 1rem));--_text-field-supporting-text-size: var(--md-filled-select-text-field-supporting-text-size, var(--md-sys-typescale-body-small-size, 0.75rem));--_text-field-supporting-text-weight: var(--md-filled-select-text-field-supporting-text-weight, var(--md-sys-typescale-body-small-weight, var(--md-ref-typeface-weight-regular, 400)));--_text-field-trailing-icon-color: var(--md-filled-select-text-field-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f));--_text-field-trailing-icon-size: var(--md-filled-select-text-field-trailing-icon-size, 24px);--_text-field-container-shape-start-start: var(--md-filled-select-text-field-container-shape-start-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-start-end: var(--md-filled-select-text-field-container-shape-start-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-extra-small, 4px)));--_text-field-container-shape-end-end: var(--md-filled-select-text-field-container-shape-end-end, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--_text-field-container-shape-end-start: var(--md-filled-select-text-field-container-shape-end-start, var(--md-filled-select-text-field-container-shape, var(--md-sys-shape-corner-none, 0px)));--md-filled-field-active-indicator-color: var(--_text-field-active-indicator-color);--md-filled-field-active-indicator-height: var(--_text-field-active-indicator-height);--md-filled-field-container-color: var(--_text-field-container-color);--md-filled-field-container-shape-end-end: var(--_text-field-container-shape-end-end);--md-filled-field-container-shape-end-start: var(--_text-field-container-shape-end-start);--md-filled-field-container-shape-start-end: var(--_text-field-container-shape-start-end);--md-filled-field-container-shape-start-start: var(--_text-field-container-shape-start-start);--md-filled-field-content-color: var(--_text-field-input-text-color);--md-filled-field-content-font: var(--_text-field-input-text-font);--md-filled-field-content-line-height: var(--_text-field-input-text-line-height);--md-filled-field-content-size: var(--_text-field-input-text-size);--md-filled-field-content-weight: var(--_text-field-input-text-weight);--md-filled-field-disabled-active-indicator-color: var(--_text-field-disabled-active-indicator-color);--md-filled-field-disabled-active-indicator-height: var(--_text-field-disabled-active-indicator-height);--md-filled-field-disabled-active-indicator-opacity: var(--_text-field-disabled-active-indicator-opacity);--md-filled-field-disabled-container-color: var(--_text-field-disabled-container-color);--md-filled-field-disabled-container-opacity: var(--_text-field-disabled-container-opacity);--md-filled-field-disabled-content-color: var(--_text-field-disabled-input-text-color);--md-filled-field-disabled-content-opacity: var(--_text-field-disabled-input-text-opacity);--md-filled-field-disabled-label-text-color: var(--_text-field-disabled-label-text-color);--md-filled-field-disabled-label-text-opacity: var(--_text-field-disabled-label-text-opacity);--md-filled-field-disabled-leading-content-color: var(--_text-field-disabled-leading-icon-color);--md-filled-field-disabled-leading-content-opacity: var(--_text-field-disabled-leading-icon-opacity);--md-filled-field-disabled-supporting-text-color: var(--_text-field-disabled-supporting-text-color);--md-filled-field-disabled-supporting-text-opacity: var(--_text-field-disabled-supporting-text-opacity);--md-filled-field-disabled-trailing-content-color: var(--_text-field-disabled-trailing-icon-color);--md-filled-field-disabled-trailing-content-opacity: var(--_text-field-disabled-trailing-icon-opacity);--md-filled-field-error-active-indicator-color: var(--_text-field-error-active-indicator-color);--md-filled-field-error-content-color: var(--_text-field-error-input-text-color);--md-filled-field-error-focus-active-indicator-color: var(--_text-field-error-focus-active-indicator-color);--md-filled-field-error-focus-content-color: var(--_text-field-error-focus-input-text-color);--md-filled-field-error-focus-label-text-color: var(--_text-field-error-focus-label-text-color);--md-filled-field-error-focus-leading-content-color: var(--_text-field-error-focus-leading-icon-color);--md-filled-field-error-focus-supporting-text-color: var(--_text-field-error-focus-supporting-text-color);--md-filled-field-error-focus-trailing-content-color: var(--_text-field-error-focus-trailing-icon-color);--md-filled-field-error-hover-active-indicator-color: var(--_text-field-error-hover-active-indicator-color);--md-filled-field-error-hover-content-color: var(--_text-field-error-hover-input-text-color);--md-filled-field-error-hover-label-text-color: var(--_text-field-error-hover-label-text-color);--md-filled-field-error-hover-leading-content-color: var(--_text-field-error-hover-leading-icon-color);--md-filled-field-error-hover-state-layer-color: var(--_text-field-error-hover-state-layer-color);--md-filled-field-error-hover-state-layer-opacity: var(--_text-field-error-hover-state-layer-opacity);--md-filled-field-error-hover-supporting-text-color: var(--_text-field-error-hover-supporting-text-color);--md-filled-field-error-hover-trailing-content-color: var(--_text-field-error-hover-trailing-icon-color);--md-filled-field-error-label-text-color: var(--_text-field-error-label-text-color);--md-filled-field-error-leading-content-color: var(--_text-field-error-leading-icon-color);--md-filled-field-error-supporting-text-color: var(--_text-field-error-supporting-text-color);--md-filled-field-error-trailing-content-color: var(--_text-field-error-trailing-icon-color);--md-filled-field-focus-active-indicator-color: var(--_text-field-focus-active-indicator-color);--md-filled-field-focus-active-indicator-height: var(--_text-field-focus-active-indicator-height);--md-filled-field-focus-content-color: var(--_text-field-focus-input-text-color);--md-filled-field-focus-label-text-color: var(--_text-field-focus-label-text-color);--md-filled-field-focus-leading-content-color: var(--_text-field-focus-leading-icon-color);--md-filled-field-focus-supporting-text-color: var(--_text-field-focus-supporting-text-color);--md-filled-field-focus-trailing-content-color: var(--_text-field-focus-trailing-icon-color);--md-filled-field-hover-active-indicator-color: var(--_text-field-hover-active-indicator-color);--md-filled-field-hover-active-indicator-height: var(--_text-field-hover-active-indicator-height);--md-filled-field-hover-content-color: var(--_text-field-hover-input-text-color);--md-filled-field-hover-label-text-color: var(--_text-field-hover-label-text-color);--md-filled-field-hover-leading-content-color: var(--_text-field-hover-leading-icon-color);--md-filled-field-hover-state-layer-color: var(--_text-field-hover-state-layer-color);--md-filled-field-hover-state-layer-opacity: var(--_text-field-hover-state-layer-opacity);--md-filled-field-hover-supporting-text-color: var(--_text-field-hover-supporting-text-color);--md-filled-field-hover-trailing-content-color: var(--_text-field-hover-trailing-icon-color);--md-filled-field-label-text-color: var(--_text-field-label-text-color);--md-filled-field-label-text-font: var(--_text-field-label-text-font);--md-filled-field-label-text-line-height: var(--_text-field-label-text-line-height);--md-filled-field-label-text-populated-line-height: var(--_text-field-label-text-populated-line-height);--md-filled-field-label-text-populated-size: var(--_text-field-label-text-populated-size);--md-filled-field-label-text-size: var(--_text-field-label-text-size);--md-filled-field-label-text-weight: var(--_text-field-label-text-weight);--md-filled-field-leading-content-color: var(--_text-field-leading-icon-color);--md-filled-field-supporting-text-color: var(--_text-field-supporting-text-color);--md-filled-field-supporting-text-font: var(--_text-field-supporting-text-font);--md-filled-field-supporting-text-line-height: var(--_text-field-supporting-text-line-height);--md-filled-field-supporting-text-size: var(--_text-field-supporting-text-size);--md-filled-field-supporting-text-weight: var(--_text-field-supporting-text-weight);--md-filled-field-trailing-content-color: var(--_text-field-trailing-icon-color)}[has-start] .icon.leading{font-size:var(--_text-field-leading-icon-size);height:var(--_text-field-leading-icon-size);width:var(--_text-field-leading-icon-size)}.icon.trailing{font-size:var(--_text-field-trailing-icon-size);height:var(--_text-field-trailing-icon-size);width:var(--_text-field-trailing-icon-size)}
`, Tp = z`:host{color:unset;min-width:210px;display:flex}.field{cursor:default;outline:none}.select{position:relative;flex-direction:column}.icon.trailing svg,.icon ::slotted(*){fill:currentColor}.icon ::slotted(*){width:inherit;height:inherit;font-size:inherit}.icon slot{display:flex;height:100%;width:100%;align-items:center;justify-content:center}.icon.trailing :is(.up,.down){opacity:0;transition:opacity 75ms linear 75ms}.select:not(.open) .down,.select.open .up{opacity:1}.field,.select,md-menu{min-width:inherit;width:inherit;max-width:inherit;display:flex}md-menu{min-width:var(--__menu-min-width);max-width:var(--__menu-max-width, inherit)}.menu-wrapper{width:0px;height:0px;max-width:inherit}md-menu ::slotted(:not[disabled]){cursor:pointer}.field,.select{width:100%}:host{display:inline-flex}:host([disabled]){pointer-events:none}
`;
class bn extends Dp {
}
bn.styles = [Tp, Mp], customElements.define("ew-filled-select", bn);
const kp = z`:host{display:flex;--md-ripple-hover-color: var(--md-menu-item-hover-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-hover-opacity: var(--md-menu-item-hover-state-layer-opacity, 0.08);--md-ripple-pressed-color: var(--md-menu-item-pressed-state-layer-color, var(--md-sys-color-on-surface, #1d1b20));--md-ripple-pressed-opacity: var(--md-menu-item-pressed-state-layer-opacity, 0.12)}:host([disabled]){opacity:var(--md-menu-item-disabled-opacity, 0.3);pointer-events:none}md-focus-ring{z-index:1;--md-focus-ring-shape: 8px}a,button,li{background:none;border:none;padding:0;margin:0;text-align:unset;text-decoration:none}.list-item{border-radius:inherit;display:flex;flex:1;max-width:inherit;min-width:inherit;outline:none;-webkit-tap-highlight-color:rgba(0,0,0,0)}.list-item:not(.disabled){cursor:pointer}[slot=container]{pointer-events:none}md-ripple{border-radius:inherit}md-item{border-radius:inherit;flex:1;color:var(--md-menu-item-label-text-color, var(--md-sys-color-on-surface, #1d1b20));font-family:var(--md-menu-item-label-text-font, var(--md-sys-typescale-body-large-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-label-text-size, var(--md-sys-typescale-body-large-size, 1rem));line-height:var(--md-menu-item-label-text-line-height, var(--md-sys-typescale-body-large-line-height, 1.5rem));font-weight:var(--md-menu-item-label-text-weight, var(--md-sys-typescale-body-large-weight, var(--md-ref-typeface-weight-regular, 400)));min-height:var(--md-menu-item-one-line-container-height, 56px);padding-top:var(--md-menu-item-top-space, 12px);padding-bottom:var(--md-menu-item-bottom-space, 12px);padding-inline-start:var(--md-menu-item-leading-space, 16px);padding-inline-end:var(--md-menu-item-trailing-space, 16px)}md-item[multiline]{min-height:var(--md-menu-item-two-line-container-height, 72px)}[slot=supporting-text]{color:var(--md-menu-item-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-menu-item-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));font-weight:var(--md-menu-item-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)))}[slot=trailing-supporting-text]{color:var(--md-menu-item-trailing-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-menu-item-trailing-supporting-text-font, var(--md-sys-typescale-label-small-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-menu-item-trailing-supporting-text-size, var(--md-sys-typescale-label-small-size, 0.6875rem));line-height:var(--md-menu-item-trailing-supporting-text-line-height, var(--md-sys-typescale-label-small-line-height, 1rem));font-weight:var(--md-menu-item-trailing-supporting-text-weight, var(--md-sys-typescale-label-small-weight, var(--md-ref-typeface-weight-medium, 500)))}:is([slot=start],[slot=end])::slotted(*){fill:currentColor}[slot=start]{color:var(--md-menu-item-leading-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}[slot=end]{color:var(--md-menu-item-trailing-icon-color, var(--md-sys-color-on-surface-variant, #49454f))}.list-item{background-color:var(--md-menu-item-container-color, transparent)}.list-item.selected{background-color:var(--md-menu-item-selected-container-color, var(--md-sys-color-secondary-container, #e8def8))}.selected:not(.disabled) ::slotted(*){color:var(--md-menu-item-selected-label-text-color, var(--md-sys-color-on-secondary-container, #1d192b))}@media(forced-colors: active){:host([disabled]),:host([disabled]) slot{color:GrayText;opacity:1}.list-item{position:relative}.list-item.selected::before{content:"";position:absolute;inset:0;box-sizing:border-box;border-radius:inherit;pointer-events:none;border:3px double CanvasText}}
`;
class Fp {
  constructor(t, e) {
    this.host = t, this.internalTypeaheadText = null, this.onClick = () => {
      this.host.keepOpen || this.host.dispatchEvent(vn(this.host, { kind: mp }));
    }, this.onKeydown = (i) => {
      if (this.host.href && i.code === "Enter") {
        const o = this.getInteractiveElement();
        o instanceof HTMLAnchorElement && o.click();
      }
      if (i.defaultPrevented) return;
      const r = i.code;
      this.host.keepOpen && r !== "Escape" || qa(r) && (i.preventDefault(), this.host.dispatchEvent(vn(this.host, { kind: _p, key: r })));
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
class Op {
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
    }, this.lastSelected = this.host.selected, this.menuItemController = new Fp(t, e), t.addController(this);
  }
  hostUpdate() {
    this.lastSelected !== this.host.selected && (this.host.ariaSelected = this.host.selected ? "true" : "false");
  }
  hostUpdated() {
    this.lastSelected === this.host.selected || this.firstUpdate || (this.host.selected ? this.host.dispatchEvent(new Event("request-selection", { bubbles: !0, composed: !0 })) : this.host.dispatchEvent(new Event("request-deselection", { bubbles: !0, composed: !0 }))), this.lastSelected = this.host.selected, this.firstUpdate = !1;
  }
}
const Pp = Gt(Y);
class mt extends Pp {
  constructor() {
    super(...arguments), this.disabled = !1, this.isMenuItem = !0, this.selected = !1, this.value = "", this.type = "option", this.selectOptionController = new Op(this, { getHeadlineElements: () => this.headlineElements, getSupportingTextElements: () => this.supportingTextElements, getDefaultElements: () => this.defaultElements, getInteractiveElement: () => this.listItemRoot });
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
    return this.renderListItem(B`
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
    return B`
      <li
        id="item"
        tabindex=${this.disabled ? -1 : 0}
        role=${this.selectOptionController.role}
        aria-label=${this.ariaLabel || I}
        aria-selected=${this.ariaSelected || I}
        aria-checked=${this.ariaChecked || I}
        aria-expanded=${this.ariaExpanded || I}
        aria-haspopup=${this.ariaHasPopup || I}
        class="list-item ${ft(this.getRenderClasses())}"
        @click=${this.selectOptionController.onClick}
        @keydown=${this.selectOptionController.onKeydown}
        >${t}</li
      >
    `;
  }
  renderRipple() {
    return B` <md-ripple
      part="ripple"
      for="item"
      ?disabled=${this.disabled}></md-ripple>`;
  }
  renderFocusRing() {
    return B` <md-focus-ring
      part="focus-ring"
      for="item"
      inward></md-focus-ring>`;
  }
  getRenderClasses() {
    return { disabled: this.disabled, selected: this.selected };
  }
  renderBody() {
    return B`
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
mt.shadowRootOptions = { ...Y.shadowRootOptions, delegatesFocus: !0 }, g([v({ type: Boolean, reflect: !0 })], mt.prototype, "disabled", void 0), g([v({ type: Boolean, attribute: "md-menu-item", reflect: !0 })], mt.prototype, "isMenuItem", void 0), g([v({ type: Boolean })], mt.prototype, "selected", void 0), g([v()], mt.prototype, "value", void 0), g([j(".list-item")], mt.prototype, "listItemRoot", void 0), g([Ht({ slot: "headline" })], mt.prototype, "headlineElements", void 0), g([Ht({ slot: "supporting-text" })], mt.prototype, "supportingTextElements", void 0), g([/* @__PURE__ */ (function(s) {
  return (t, e) => {
    const { slot: i } = s ?? {}, r = "slot" + (i ? `[name=${i}]` : ":not([name])");
    return ls(t, e, { get() {
      var o;
      const n = (o = this.renderRoot) === null || o === void 0 ? void 0 : o.querySelector(r);
      return n?.assignedNodes(s) ?? [];
    } });
  };
})({ slot: "" })], mt.prototype, "defaultElements", void 0), g([v({ attribute: "typeahead-text" })], mt.prototype, "typeaheadText", null), g([v({ attribute: "display-text" })], mt.prototype, "displayText", null);
class yn extends mt {
}
yn.styles = [kp], customElements.define("ew-select-option", yn);
const Up = Gt(Y);
class Ne extends Up {
  constructor() {
    super(...arguments), this.value = 0, this.max = 1, this.indeterminate = !1, this.fourColor = !1;
  }
  render() {
    const { ariaLabel: t } = this;
    return B`
      <div
        class="progress ${ft(this.getRenderClasses())}"
        role="progressbar"
        aria-label="${t || I}"
        aria-valuemin="0"
        aria-valuemax=${this.max}
        aria-valuenow=${this.indeterminate ? I : this.value}
        >${this.renderIndicator()}</div
      >
    `;
  }
  getRenderClasses() {
    return { indeterminate: this.indeterminate, "four-color": this.fourColor };
  }
}
g([v({ type: Number })], Ne.prototype, "value", void 0), g([v({ type: Number })], Ne.prototype, "max", void 0), g([v({ type: Boolean })], Ne.prototype, "indeterminate", void 0), g([v({ type: Boolean, attribute: "four-color" })], Ne.prototype, "fourColor", void 0);
class Qp extends Ne {
  renderIndicator() {
    return this.indeterminate ? this.renderIndeterminateContainer() : this.renderDeterminateContainer();
  }
  renderDeterminateContainer() {
    const t = 100 * (1 - this.value / this.max);
    return B`
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
    return B` <div class="spinner">
      <div class="left">
        <div class="circle"></div>
      </div>
      <div class="right">
        <div class="circle"></div>
      </div>
    </div>`;
  }
}
const Hp = z`:host{--_active-indicator-color: var(--md-circular-progress-active-indicator-color, var(--md-sys-color-primary, #6750a4));--_active-indicator-width: var(--md-circular-progress-active-indicator-width, 10);--_four-color-active-indicator-four-color: var(--md-circular-progress-four-color-active-indicator-four-color, var(--md-sys-color-tertiary-container, #ffd8e4));--_four-color-active-indicator-one-color: var(--md-circular-progress-four-color-active-indicator-one-color, var(--md-sys-color-primary, #6750a4));--_four-color-active-indicator-three-color: var(--md-circular-progress-four-color-active-indicator-three-color, var(--md-sys-color-tertiary, #7d5260));--_four-color-active-indicator-two-color: var(--md-circular-progress-four-color-active-indicator-two-color, var(--md-sys-color-primary-container, #eaddff));--_size: var(--md-circular-progress-size, 48px);display:inline-flex;vertical-align:middle;width:var(--_size);height:var(--_size);position:relative;align-items:center;justify-content:center;contain:strict;content-visibility:auto}.progress{flex:1;align-self:stretch;margin:4px}.progress,.spinner,.left,.right,.circle,svg,.track,.active-track{position:absolute;inset:0}svg{transform:rotate(-90deg)}circle{cx:50%;cy:50%;r:calc(50%*(1 - var(--_active-indicator-width)/100));stroke-width:calc(var(--_active-indicator-width)*1%);stroke-dasharray:100;fill:rgba(0,0,0,0)}.active-track{transition:stroke-dashoffset 500ms cubic-bezier(0, 0, 0.2, 1);stroke:var(--_active-indicator-color)}.track{stroke:rgba(0,0,0,0)}.progress.indeterminate{animation:linear infinite linear-rotate;animation-duration:1568.2352941176ms}.spinner{animation:infinite both rotate-arc;animation-duration:5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.left{overflow:hidden;inset:0 50% 0 0}.right{overflow:hidden;inset:0 0 0 50%}.circle{box-sizing:border-box;border-radius:50%;border:solid calc(var(--_active-indicator-width)/100*(var(--_size) - 8px));border-color:var(--_active-indicator-color) var(--_active-indicator-color) rgba(0,0,0,0) rgba(0,0,0,0);animation:expand-arc;animation-iteration-count:infinite;animation-fill-mode:both;animation-duration:1333ms,5332ms;animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1)}.four-color .circle{animation-name:expand-arc,four-color}.left .circle{rotate:135deg;inset:0 -100% 0 0}.right .circle{rotate:100deg;inset:0 0 0 -100%;animation-delay:-666.5ms,0ms}@media(forced-colors: active){.active-track{stroke:CanvasText}.circle{border-color:CanvasText CanvasText Canvas Canvas}}@keyframes expand-arc{0%{transform:rotate(265deg)}50%{transform:rotate(130deg)}100%{transform:rotate(265deg)}}@keyframes rotate-arc{12.5%{transform:rotate(135deg)}25%{transform:rotate(270deg)}37.5%{transform:rotate(405deg)}50%{transform:rotate(540deg)}62.5%{transform:rotate(675deg)}75%{transform:rotate(810deg)}87.5%{transform:rotate(945deg)}100%{transform:rotate(1080deg)}}@keyframes linear-rotate{to{transform:rotate(360deg)}}@keyframes four-color{0%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}15%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}25%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}40%{border-top-color:var(--_four-color-active-indicator-two-color);border-right-color:var(--_four-color-active-indicator-two-color)}50%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}65%{border-top-color:var(--_four-color-active-indicator-three-color);border-right-color:var(--_four-color-active-indicator-three-color)}75%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}90%{border-top-color:var(--_four-color-active-indicator-four-color);border-right-color:var(--_four-color-active-indicator-four-color)}100%{border-top-color:var(--_four-color-active-indicator-one-color);border-right-color:var(--_four-color-active-indicator-one-color)}}
`;
class Cn extends Qp {
}
Cn.styles = [Hp], customElements.define("ew-circular-progress", Cn);
class Qi extends Y {
  render() {
    return B`
      <div>
        <ew-circular-progress
          active
          ?indeterminate=${this.progress === void 0}
          .value=${this.progress !== void 0 ? this.progress / 100 : void 0}
        ></ew-circular-progress>
        ${this.progress !== void 0 ? B`<div>${this.progress}%</div>` : ""}
      </div>
      ${this.label}
    `;
  }
}
Qi.styles = z`
    :host {
      display: flex;
      flex-direction: column;
      text-align: center;
    }
    ew-circular-progress {
      margin-bottom: 16px;
    }
  `, g([v()], Qi.prototype, "label", void 0), g([v()], Qi.prototype, "progress", void 0), customElements.define("ewt-page-progress", Qi);
class Hi extends Y {
  render() {
    return B`
      <div class="icon">${this.icon}</div>
      ${this.label}
    `;
  }
}
Hi.styles = z`
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
  `, g([v()], Hi.prototype, "icon", void 0), g([v()], Hi.prototype, "label", void 0), customElements.define("ewt-page-message", Hi);
const $p = ht`
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
    />
  </svg>
`, Gp = ht`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q95-97 219.5-148.5T480-800q137 0 261 51t219 149L480-120ZM174-540q67-48 145-74t161-26q83 0 161 26t145 74l58-58q-79-60-172-91t-192-31q-99 0-192 31t-172 91l58 58Z"
    />
  </svg>
`, Lp = ht`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM232-482q53-38 116-59.5T480-563q69 0 132 21.5T728-482l116-116q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l116 116Z"
    />
  </svg>
`, Yp = ht`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM299-415q38-28 84-43.5t97-15.5q51 0 97 15.5t84 43.5l183-183q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l183 183Z"
    />
  </svg>
`, Np = ht`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M480-120 0-600q96-98 220-149t260-51q137 0 261 51t219 149L480-120ZM361-353q25-18 55.5-28t63.5-10q33 0 63.5 10t55.5 28l245-245q-78-59-170.5-90.5T480-720q-101 0-193.5 31.5T116-598l245 245Z"
    />
  </svg>
`, Kp = ht`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"
    />
  </svg>
`, zp = ht`
  <svg viewBox="0 -960 960 960">
    <path
      fill="currentColor"
      d="M240-160h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM240-160v-400 400Zm0 80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h280v-80q0-83 58.5-141.5T720-920q83 0 141.5 58.5T920-720h-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80h120q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Z"
    />
  </svg>
`, Bn = ht`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
  </svg>
`, Jp = ht`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z" />
  </svg>
`, In = ht`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M20,19V7H4V19H20M20,3A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5C2,3.89 2.9,3 4,3H20M13,17V15H18V17H13M9.58,13L5.57,9H8.4L11.7,12.3C12.09,12.69 12.09,13.33 11.7,13.72L8.42,17H5.59L9.58,13Z" />
  </svg>
`, xn = ht`
  <svg slot="start" viewBox="0 0 24 24">
  <path d="M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
  </svg>
`, Sn = ht`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="m12.151 1.5882c-.3262 0-.6523.1291-.8996.3867l-8.3848 8.7354c-.0619.0644-.1223.1368-.1807.2154-.0588.0789-.1151.1638-.1688.2534-.2593.4325-.4552.9749-.5232 1.4555-.0026.018-.0076.0369-.0094.0548-.0121.0987-.0184.1944-.0184.2857v8.0124a1.2731 1.2731 0 001.2731 1.2731h7.8313l-3.4484-3.593a1.7399 1.7399 0 111.0803-1.125l2.6847 2.7972v-10.248a1.7399 1.7399 0 111.5276-0v7.187l2.6702-2.782a1.7399 1.7399 0 111.0566 1.1505l-3.7269 3.8831v2.7299h8.174a1.2471 1.2471 0 001.2471-1.2471v-8.0375c0-.0912-.0059-.1868-.0184-.2855-.0603-.4935-.2636-1.0617-.5326-1.5105-.0537-.0896-.1101-.1745-.1684-.253-.0588-.079-.1191-.1513-.181-.2158l-8.3848-8.7363c-.2473-.2577-.5735-.3866-.8995-.3864" />
  </svg>
`, jp = ht`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M15,14C17.67,14 23,15.33 23,18V20H7V18C7,15.33 12.33,14 15,14M15,12A4,4 0 0,1 11,8A4,4 0 0,1 15,4A4,4 0 0,1 19,8A4,4 0 0,1 15,12M5,9.59L7.12,7.46L8.54,8.88L6.41,11L8.54,13.12L7.12,14.54L5,12.41L2.88,14.54L1.46,13.12L3.59,11L1.46,8.88L2.88,7.46L5,9.59Z" />
  </svg>
`, Wp = ht`
  <svg slot="start" viewBox="0 0 24 24">
    <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
  </svg>
`, Vp = [73, 77, 80, 82, 79, 86, 1];
var be, wt;
(function(s) {
  s[s.CURRENT_STATE = 1] = "CURRENT_STATE", s[s.ERROR_STATE = 2] = "ERROR_STATE", s[s.RPC = 3] = "RPC", s[s.RPC_RESULT = 4] = "RPC_RESULT";
})(be || (be = {})), (function(s) {
  s[s.STOPPED = 0] = "STOPPED", s[s.READY = 2] = "READY", s[s.PROVISIONING = 3] = "PROVISIONING", s[s.PROVISIONED = 4] = "PROVISIONED";
})(wt || (wt = {}));
const qp = { 0: "NO_ERROR", 1: "INVALID_RPC_PACKET", 2: "UNKNOWN_RPC_COMMAND", 3: "UNABLE_TO_CONNECT", 5: "BAD_HOSTNAME", 254: "TIMEOUT", 255: "UNKNOWN_ERROR" };
class tl extends Error {
  constructor() {
    super("Port is not ready");
  }
}
const Rn = (s) => "[" + s.map(((t) => ((e, i = 2) => {
  let r = e.toString(16).toUpperCase();
  return r.startsWith("-") ? "-0x" + r.substring(1).padStart(i, "0") : "0x" + r.padStart(i, "0");
})(t))).join(", ") + "]", el = (s) => s.sort(((t, e) => t.name.toLocaleLowerCase().localeCompare(e.name.toLocaleLowerCase()))), Zp = (s, t) => {
  const e = /* @__PURE__ */ new Map();
  for (const i of s) e.set(i.name, i);
  for (const i of t) e.set(i.name, i);
  return el(Array.from(e.values()));
}, Xp = (s, t) => s.length !== t.length || s.some(((e, i) => e.name !== t[i].name || e.rssi !== t[i].rssi || e.secured !== t[i].secured));
class tg extends EventTarget {
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
    if (this.logger.log("Initializing Improv Serial"), this._processInput(), this._reader === void 0) throw new tl();
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
    this.state === wt.PROVISIONED ? this.nextUrl = (await i)[0] : (t = this._rpcFeedback) === null || t === void 0 || t.resolve([]);
  }
  async requestInfo(t) {
    const e = await this._sendRPCWithResponse(3, [], t);
    this.info = { firmware: e[0], version: e[1], name: e[3], chipFamily: e[2], osName: e.length > 4 ? e[4] : null, osVersion: e.length > 5 ? e[5] : null };
  }
  async provision(t, e, i) {
    const r = new TextEncoder(), o = r.encode(t), n = r.encode(e), a = [o.length, ...o, n.length, ...n], l = await this._sendRPCWithResponse(1, a, i);
    this.nextUrl = l[0];
  }
  async scan(t) {
    const e = (await this._sendRPCWithMultipleResponses(4, [], t)).map((([i, r, o]) => ({ name: i, rssi: parseInt(r), secured: o !== "NO" })));
    return el(e);
  }
  subscribeSSIDs(t) {
    let e, i, r = !0;
    const o = (async () => {
      for (; r; ) {
        let n;
        try {
          n = await this.scan(3e4);
        } catch (l) {
          this.logger.error("Error while scanning for Wi-Fi networks", l), r && e === void 0 && t(null);
          break;
        }
        if (!r) break;
        const a = e === void 0 ? n : Zp(e, n);
        (e === void 0 || Xp(e, a)) && (e = a, t(a)), await new Promise(((l) => {
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
    this.writePacketToStream(be.RPC, [t, e.length, ...e]);
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
        if (r && r.length !== 0) for (const n of r) {
          if (t === !1) {
            n === 10 && (t = void 0);
            continue;
          }
          if (t === !0) {
            e.push(n), e.length === i && (this._handleIncomingPacket(e), t = void 0, e = []);
            continue;
          }
          if (n === 10) {
            e = [];
            continue;
          }
          if (e.push(n), e.length === 9) {
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
    const e = t.slice(6), i = e[0], r = e[1], o = e[2], n = e.slice(3, 3 + o);
    if (this.logger.debug("PROCESS", { version: i, packetType: r, packetLength: o, data: Rn(n) }), i !== 1) return void this.logger.error("Received unsupported version", i);
    let a = e[3 + o], l = 0;
    for (let c = 0; c < t.length - 1; c++) l += t[c];
    if (l &= 255, l === a) if (r === be.CURRENT_STATE) this.state = n[0], this.dispatchEvent(new CustomEvent("state-changed", { detail: this.state }));
    else if (r === be.ERROR_STATE) this._setError(n[0]);
    else if (r === be.RPC_RESULT) {
      if (!this._rpcFeedback) return void this.logger.error("Received result while not waiting for one");
      const c = n[0];
      if (c !== this._rpcFeedback.command) return void this.logger.error(`Received result for command ${c} but expected ${this._rpcFeedback.command}`);
      const d = [], h = n[1], A = new TextDecoder("utf-8");
      let p = 2;
      for (; p < 2 + h; ) d.push(A.decode(new Uint8Array(n.slice(p + 1, p + n[p] + 1)))), p += n[p] + 1;
      "receivedData" in this._rpcFeedback ? d.length > 0 ? this._rpcFeedback.receivedData.push(d) : this._rpcFeedback.resolve(this._rpcFeedback.receivedData) : this._rpcFeedback.resolve(d);
    } else this.logger.error("Unable to handle packet", e);
    else this.logger.error(`Received invalid checksum ${a}. Expected ${l}`);
  }
  async writePacketToStream(t, e) {
    const i = new Uint8Array([...Vp, t, e.length, ...e, 0, 0]);
    i[i.length - 2] = 255 & i.reduce(((o, n) => o + n), 0), i[i.length - 1] = 10, this.logger.debug("Writing to stream:", Rn(new Array(...i)));
    const r = this.port.writable.getWriter();
    await r.write(i);
    try {
      r.releaseLock();
    } catch (o) {
      console.error("Ignoring release lock error", o);
    }
  }
  _setError(t) {
    t > 0 && this._rpcFeedback && this._rpcFeedback.reject(qp[t] || `UNKNOWN_ERROR (${t})`), this.error = t;
  }
}
const He = async (s, t) => {
  await s.setRTS(!0), await Ce(100), await t.after();
}, eg = (s, t = "") => {
  const e = new Blob([s], { type: "text/plain" }), i = URL.createObjectURL(e);
  ((r, o = "") => {
    const n = document.createElement("a");
    n.target = "_blank", n.href = r, n.download = o, document.body.appendChild(n), n.dispatchEvent(new MouseEvent("click")), document.body.removeChild(n);
  })(i, t), setTimeout((() => URL.revokeObjectURL(i)), 0);
};
console.log("ESP Web Tools 10.4.0 by Open Home Foundation; https://esphome.github.io/esp-web-tools/");
const qs = "⚠️";
class pt extends Y {
  constructor() {
    super(...arguments), this.logger = console, this._state = "DASHBOARD", this._installErase = !1, this._installConfirmed = !1, this._provisionForce = !1, this._wasProvisioned = !1, this._busy = !1, this._selectedSsid = null, this._manualSsid = "", this._bodyOverflow = null, this._handleDisconnect = () => {
      this._state = "ERROR", this._error = "Disconnected";
    };
  }
  render() {
    if (!this.port) return B``;
    let t, e, i = !1;
    return this._client === void 0 && this._state !== "INSTALL" && this._state !== "LOGS" ? this._error ? [t, e] = this._renderError(this._error) : e = this._renderProgress("Connecting") : this._state === "INSTALL" ? [t, e, i] = this._renderInstall() : this._state === "ASK_ERASE" ? [t, e] = this._renderAskErase() : this._state === "ERROR" ? [t, e] = this._renderError(this._error) : this._state === "DASHBOARD" ? [t, e, i] = this._client ? this._renderDashboard() : this._renderDashboardNoImprov() : this._state === "PROVISION" ? [t, e] = this._renderProvision() : this._state === "LOGS" && ([t, e] = this._renderLogs()), B`
      <ew-dialog
        open
        .heading=${t}
        @cancel=${this._preventDefault}
        @closed=${this._handleClose}
      >
        ${t ? B`<div slot="headline">${t}</div>` : ""}
        ${i ? B`
              <ew-icon-button slot="headline" @click=${this._closeDialog}>
                ${$p}
              </ew-icon-button>
            ` : ""}
        ${e}
      </ew-dialog>
    `;
  }
  _renderProgress(t, e) {
    return B`
      <ewt-page-progress
        slot="content"
        .label=${t}
        .progress=${e}
      ></ewt-page-progress>
    `;
  }
  _renderError(t) {
    return ["Error", B`
      <ewt-page-message
        slot="content"
        .icon=${qs}
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
    return e = B`
      <div slot="content">
        <ew-list>
          <ew-list-item>
            <div slot="headline">Connected to ${this._info.name}</div>
            <div slot="supporting-text">
              ${this._info.firmware}&nbsp;${this._info.version}
              (${this._info.chipFamily})
            </div>
          </ew-list-item>
          ${this._isSameVersion ? "" : B`
                <ew-list-item
                  type="button"
                  @click=${() => {
      this._isSameFirmware ? this._startInstall(!1) : this._manifest.new_install_prompt_erase ? this._state = "ASK_ERASE" : this._startInstall(!0);
    }}
                >
                  ${Bn}
                  <div slot="headline">
                    ${this._isSameFirmware ? `Update ${this._manifest.name}` : `Install ${this._manifest.name}`}
                  </div>
                </ew-list-item>
              `}
          ${this._client.nextUrl === void 0 ? "" : B`
                <ew-list-item
                  type="link"
                  href=${this._client.nextUrl}
                  target="_blank"
                >
                  ${xn}
                  <div slot="headline">Visit Device</div>
                </ew-list-item>
              `}
          ${this._manifest.home_assistant_domain && this._client.state === wt.PROVISIONED ? B`
                <ew-list-item
                  type="link"
                  href=${`https://my.home-assistant.io/redirect/config_flow_start/?domain=${this._manifest.home_assistant_domain}`}
                  target="_blank"
                >
                  ${Sn}
                  <div slot="headline">Add to Home Assistant</div>
                </ew-list-item>
              ` : ""}
          <ew-list-item
            type="button"
            @click=${() => {
      this._state = "PROVISION", this._client.state === wt.PROVISIONED && (this._provisionForce = !0);
    }}
          >
            ${Jp}
            <div slot="headline">
              ${this._client.state === wt.PROVISIONED ? "Change Wi-Fi" : "Connect to Wi-Fi"}
            </div>
          </ew-list-item>
          <ew-list-item
            type="button"
            @click=${async () => {
      const i = this._client;
      i && (await this._closeClientWithoutEvents(i), await Ce(100)), this._client = void 0, this._state = "LOGS";
    }}
          >
            ${In}
            <div slot="headline">Logs & Console</div>
          </ew-list-item>
          ${this._isSameFirmware && this._manifest.funding_url ? B`
                <ew-list-item
                  type="link"
                  href=${this._manifest.funding_url}
                  target="_blank"
                >
                  ${Wp}
                  <div slot="headline">Fund Development</div>
                </ew-list-item>
              ` : ""}
          ${this._isSameVersion ? B`
                <ew-list-item
                  type="button"
                  class="danger"
                  @click=${() => this._startInstall(!0)}
                >
                  ${jp}
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
    return e = B`
      <div slot="content">
        <ew-list>
          <ew-list-item
            type="button"
            @click=${() => {
      this._manifest.new_install_prompt_erase ? this._state = "ASK_ERASE" : this._startInstall(!0);
    }}
          >
            ${Bn}
            <div slot="headline">${`Install ${this._manifest.name}`}</div>
          </ew-list-item>
          <ew-list-item
            type="button"
            @click=${async () => {
      this._client = void 0, this._state = "LOGS";
    }}
          >
            ${In}
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
    if (this._client.state === wt.STOPPED) i = void 0, e = B`
        <div slot="content">
          <ewt-page-message
            .icon=${qs}
            .label=${B`The connected device has Wi-Fi turned off, so it can't
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
    else if (this._provisionForce || this._client.state !== wt.PROVISIONED) if (this._ssids === void 0) e = this._renderProgress("Scanning for networks");
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
      const o = (t = this._ssids) === null || t === void 0 ? void 0 : t.find(((n) => n.name === this._selectedSsid));
      e = B`
        <div slot="content">
          <div>Connect your device to the network to start using it.</div>
          ${r ? B`<p class="error">${r}</p>` : ""}
          ${this._ssids !== null ? B`
                <ew-filled-select
                  menu-positioning="fixed"
                  label="Network"
                  @change=${(n) => {
        const a = n.target.selectedIndex;
        this._selectedSsid = a === this._ssids.length ? null : this._ssids[a].name, this._manualSsid = "";
      }}
                >
                  ${this._ssids.map(((n) => {
        const a = (l = n.rssi) >= -50 ? { icon: Gp, class: "signal-excellent" } : l >= -60 ? { icon: Lp, class: "signal-good" } : l >= -70 ? { icon: Yp, class: "signal-fair" } : { icon: Np, class: "signal-weak" };
        var l;
        return B`
                      <ew-select-option
                        .selected=${o === n}
                        .value=${n.name}
                      >
                        <span slot="start" class=${a.class}>
                          ${a.icon}
                        </span>
                        <span slot="headline">${n.name}</span>
                        <span slot="end" class="network-details">
                          <span class="signal-strength">${n.rssi}dB</span>
                          <span
                            class=${n.secured ? "lock-secured" : "lock-unsecured"}
                          >
                            ${n.secured ? Kp : zp}
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
          ${o ? "" : B`
                  <ew-filled-text-field
                    label="Network Name"
                    name="ssid"
                    .value=${this._manualSsid}
                  ></ew-filled-text-field>
                `}
          ${!o || o.secured ? B`
                <ew-filled-text-field
                  label="Password"
                  name="password"
                  type="password"
                  @keydown=${(n) => {
        n.key === "Enter" && this._doProvision();
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
      e = B`
        <div slot="content">
          <ewt-page-message
            .icon=${"🎉"}
            label="Device connected to the network!"
          ></ewt-page-message>
          ${r ? B`
                <ew-list>
                  ${this._client.nextUrl === void 0 ? "" : B`
                        <ew-list-item
                          type="link"
                          href=${this._client.nextUrl}
                          target="_blank"
                          @click=${() => {
        this._state = "DASHBOARD";
      }}
                        >
                          ${xn}
                          <div slot="headline">Visit Device</div>
                        </ew-list-item>
                      `}
                  ${this._manifest.home_assistant_domain ? B`
                        <ew-list-item
                          type="link"
                          href=${`https://my.home-assistant.io/redirect/config_flow_start/?domain=${this._manifest.home_assistant_domain}`}
                          target="_blank"
                          @click=${() => {
        this._state = "DASHBOARD";
      }}
                        >
                          ${Sn}
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

        ${r ? "" : B`
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
    return ["Erase device", B`
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
    if (!this._installConfirmed && this._isSameVersion) t = "Erase User Data", e = B`
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
      t = "Installing", this._installState.state === "finished" ? o = "Wrapping up" : this._installState.details.percentage < 4 ? o = "Installing" : r = this._installState.details.percentage, e = this._renderProgress(B`
          ${o ? B`${o}<br />` : ""}
          <br />
          This will take
          ${this._installState.chipFamily === "ESP8266" ? "a minute" : "2 minutes"}.<br />
          Keep this page visible to prevent slow down
        `, r);
    } else if (this._installState.state === "finished") {
      t = void 0;
      const r = this._client !== null;
      e = B`
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
    } else this._installState.state === "error" && (t = "Installation failed", e = B`
        <ewt-page-message
          slot="content"
          .icon=${qs}
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
      e = B`
        <div slot="content">
          ${i ? B`Your device is running
                ${this._info.firmware}&nbsp;${this._info.version}.<br /><br />` : ""}
          Do you want to ${r}
          ${this._manifest.name}&nbsp;${this._manifest.version}?
          ${this._installErase ? B`<br /><br />All data on the device will be erased.` : ""}
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
    return t = B`
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
      eg(this.shadowRoot.querySelector("ewt-console").logs(), "esp-web-tools-logs.txt"), this.shadowRoot.querySelector("ewt-console").reset();
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
    return e !== void 0 && e !== wt.STOPPED && (this._provisionForce || e !== wt.PROVISIONED);
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
        const r = new URL(i, location.toString()).toString(), o = await fetch(r), n = await o.json();
        return "new_install_skip_erase" in n && (console.warn('Manifest option "new_install_skip_erase" is deprecated. Use "new_install_prompt_erase" instead.'), n.new_install_skip_erase && (n.new_install_prompt_erase = !0)), n;
      })(this.manifestPath);
    } catch {
      return this._state = "ERROR", void (this._error = "Failed to download manifest");
    }
    if (this._manifest.new_install_improv_wait_time === 0) return void (this._client = null);
    const e = new tg(this.port, this.logger);
    e.addEventListener("state-changed", (() => {
      this.requestUpdate();
    })), e.addEventListener("error-changed", (() => this.requestUpdate()));
    try {
      const i = t ? this._manifest.new_install_improv_wait_time !== void 0 ? 1e3 * this._manifest.new_install_improv_wait_time : 1e4 : 1500;
      this._info = await e.initialize(i), this._client = e, e.addEventListener("disconnect", this._handleDisconnect);
    } catch (i) {
      this._info = void 0, i instanceof tl ? (this._state = "ERROR", this._error = "Serial port is not ready. Close any other application using it and try again.") : (this._client = null, this.logger.error("Improv initialization failed.", i));
    }
  }
  _startInstall(t) {
    this._state = "INSTALL", this._installErase = t, this._installConfirmed = !1;
  }
  async _confirmInstall() {
    this._installConfirmed = !0, this._installState = void 0, this._client && await this._closeClientWithoutEvents(this._client), this._client = void 0, await this.port.close(), (async (t, e, i, r, o) => {
      let n, a;
      const l = (m) => t({ ...m, manifest: r, build: n, chipFamily: a }), c = new $r(e), d = e.getInfo(), h = d && d.usbVendorId === 12346 && d.usbProductId !== void 0 && [4097, 4098, 4099, 2, 3].includes(d.usbProductId), A = new XA({ transport: c, baudrate: 115200, enableTracing: !1 });
      window.esploader = A, l({ state: "initializing", message: "Initializing...", details: { done: !1 } });
      try {
        await A.main(), await A.flashId();
      } catch (m) {
        return console.error(m), l({ state: "error", message: "Failed to initialize. Try resetting your device or holding the BOOT button while clicking INSTALL.", details: { error: "failed_initialize", details: m } }), await He(c, A), void await c.disconnect();
      }
      a = A.chip.CHIP_NAME, l({ state: "initializing", message: `Initialized. Found ${a}`, details: { done: !0 } });
      const p = h ? "cdc" : "uart";
      if (n = r.builds.find(((m) => m.chipFamily === a && m.serialType === p)) || r.builds.find(((m) => m.chipFamily === a && m.serialType === void 0)), !n) return l({ state: "error", message: `Your ${a} board is not supported.`, details: { error: "not_supported", details: a } }), await He(c, A), void await c.disconnect();
      l({ state: "preparing", message: "Preparing installation...", details: { done: !1 } });
      const _ = i.startsWith("blob:") || i.startsWith("data:") ? location.toString() : new URL(i, location.toString()).toString(), u = n.parts.map((async (m) => {
        const C = new URL(m.path, _).toString(), R = await fetch(C);
        if (!R.ok) throw new Error(`Downloading firmware ${m.path} failed: ${R.status}`);
        const E = new FileReader(), M = await R.blob();
        return new Promise(((D) => {
          E.addEventListener("load", (() => D(E.result))), E.readAsArrayBuffer(M);
        }));
      })), f = [];
      let w = 0;
      for (let m = 0; m < u.length; m++) try {
        const C = await u[m], R = new Uint8Array(C, 0, C.byteLength);
        f.push({ data: R, address: n.parts[m].offset }), w += R.length;
      } catch (C) {
        return l({ state: "error", message: C.message, details: { error: "failed_firmware_download", details: C.message } }), await He(c, A), void await c.disconnect();
      }
      l({ state: "preparing", message: "Installation prepared", details: { done: !0 } }), o && (l({ state: "erasing", message: "Erasing device...", details: { done: !1 } }), await A.eraseFlash(), l({ state: "erasing", message: "Device erased", details: { done: !0 } })), l({ state: "writing", message: "Writing progress: 0%", details: { bytesTotal: w, bytesWritten: 0, percentage: 0 } });
      let b = 0;
      try {
        await A.writeFlash({ fileArray: f, flashSize: "keep", flashMode: "keep", flashFreq: "keep", eraseAll: !1, compress: !0, reportProgress: (m, C, R) => {
          const E = C / R * f[m].data.length, M = Math.floor((b + E) / w * 100);
          C !== R ? l({ state: "writing", message: `Writing progress: ${M}%`, details: { bytesTotal: w, bytesWritten: b + C, percentage: M } }) : b += E;
        } });
      } catch (m) {
        return l({ state: "error", message: m.message, details: { error: "write_failed", details: m } }), await He(c, A), void await c.disconnect();
      }
      l({ state: "writing", message: "Writing complete", details: { bytesTotal: w, bytesWritten: b, percentage: 100 } }), await He(c, A), console.log("DISCONNECT"), await c.disconnect(), l({ state: "finished", message: "All done!" });
    })(((t) => {
      this._installState = t, t.state === "finished" ? Ce(100).then((() => this.port.open({ baudRate: 115200, bufferSize: 8192 }))).then((() => this._initialize(!0))).then((() => this.requestUpdate())) : t.state === "error" && Ce(100).then((() => this.port.open({ baudRate: 115200, bufferSize: 8192 })));
    }), this.port, this.manifestPath, this._manifest, this._installErase);
  }
  async _doProvision() {
    var t;
    const e = this._selectedSsid === null ? this.shadowRoot.querySelector("ew-filled-text-field[name=ssid]").value : this._selectedSsid, i = ((t = this.shadowRoot.querySelector("ew-filled-text-field[name=password]")) === null || t === void 0 ? void 0 : t.value) || "";
    this._busy = !0, this._wasProvisioned = this._client.state === wt.PROVISIONED, await this._stopScanning();
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
pt.styles = [Ea, z`
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
    `], g([$()], pt.prototype, "_client", void 0), g([$()], pt.prototype, "_state", void 0), g([$()], pt.prototype, "_installErase", void 0), g([$()], pt.prototype, "_installConfirmed", void 0), g([$()], pt.prototype, "_installState", void 0), g([$()], pt.prototype, "_provisionForce", void 0), g([$()], pt.prototype, "_error", void 0), g([$()], pt.prototype, "_busy", void 0), g([$()], pt.prototype, "_ssids", void 0), g([$()], pt.prototype, "_selectedSsid", void 0), customElements.define("ewt-install-dialog", pt);
var ig = Object.freeze({ __proto__: null, EwtInstallDialog: pt });
const sg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  R: Gr,
  i: ig
}, Symbol.toStringTag, { value: "Module" })), Dn = ht`
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
let Zs = class extends Y {
  render() {
    const s = (() => {
      var t, e;
      const i = window.navigator.userAgent, r = ((e = (t = window.navigator) === null || t === void 0 ? void 0 : t.userAgentData) === null || e === void 0 ? void 0 : e.platform) || window.navigator.platform;
      return ["macOS", "Macintosh", "MacIntel", "MacPPC", "Mac68K"].indexOf(r) !== -1 ? "Mac OS" : ["iPhone", "iPad", "iPod"].indexOf(r) !== -1 ? "iOS" : ["Win32", "Win64", "Windows", "WinCE"].indexOf(r) !== -1 ? "Windows" : /Android/.test(i) ? "Android" : /Linux/.test(r) ? "Linux" : null;
    })();
    return B`
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
            ${s === "Linux" ? B`
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
                  (download via blue button with ${Dn} icon)
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
                  (download via blue button with ${Dn} icon)
                </li>
              </ul>
            </li>
          </ol>
        </div>
        <div slot="actions">
          ${this.doTryAgain ? B`
                <ew-text-button @click=${this.close}>Cancel</ew-text-button>
                <ew-text-button @click=${this.tryAgain}>
                  Try Again
                </ew-text-button>
              ` : B`
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
Zs.styles = [Ea, z`
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
    `], Zs = g([Xt("ewt-no-port-picked-dialog")], Zs);
const rg = async (s) => {
  const t = document.createElement("ewt-no-port-picked-dialog");
  return t.doTryAgain = s, document.body.append(t), !0;
}, og = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  openNoPortPickedDialog: rg
}, Symbol.toStringTag, { value: "Module" }));
var il = 1074521580, sl = "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", rl = 1074520064, ol = "DMD8P+znC0B/6AtAZ+0LQAbpC0Cf6AtABukLQGXpC0CC6gtA9OoLQJ3qC0CV5wtAGuoLQHTqC0CI6QtAGOsLQLDpC0AY6wtAbegLQMroC0AG6QtAZekLQIXoC0DI6wtAKe0LQLjmC0BL7QtAuOYLQLjmC0C45gtAuOYLQLjmC0C45gtAuOYLQLjmC0Bv6wtAuOYLQEnsC0Ap7QtA", nl = 1073605544, al = 1073528832, ng = { entry: il, text: sl, text_start: rl, data: ol, data_start: nl, bss_start: al };
const ag = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: al,
  data: ol,
  data_start: nl,
  default: ng,
  entry: il,
  text: sl,
  text_start: rl
}, Symbol.toStringTag, { value: "Module" }));
var ll = 1077413304, cl = "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", dl = 1077411840, hl = "DEDKP+AIOEAsCThAhAk4QFIKOEC+CjhAbAo4QKgHOEAOCjhATgo4QJgJOEBYBzhAzAk4QFgHOEC6CDhA/gg4QCwJOECECThAzAg4QBIIOEBCCDhAyAg4QBYNOEAsCThA1gs4QMoMOECkBjhA9Aw4QKQGOECkBjhApAY4QKQGOECkBjhApAY4QKQGOECkBjhAcgs4QKQGOEDyCzhAygw4QA==", Al = 1070295976, pl = 1070219264, lg = { entry: ll, text: cl, text_start: dl, data: hl, data_start: Al, bss_start: pl };
const cg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: pl,
  data: hl,
  data_start: Al,
  default: lg,
  entry: ll,
  text: cl,
  text_start: dl
}, Symbol.toStringTag, { value: "Module" }));
var gl = 1077413584, ul = "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", fl = 1077411840, ml = "GEDIP8AKOEAQCzhAaAs4QDYMOECiDDhAUAw4QHIJOEDyCzhAMgw4QHwLOEAiCThAsAs4QCIJOECaCjhA4Ao4QBALOEBoCzhArAo4QNYJOEAgCjhAqAo4QPoOOEAQCzhAug04QLIOOEBiCDhA2g44QGIIOEBiCDhAYgg4QGIIOEBiCDhAYgg4QGIIOEBiCDhAVg04QGIIOEDYDThAsg44QA==", _l = 1070164916, vl = 1070088192, dg = { entry: gl, text: ul, text_start: fl, data: ml, data_start: _l, bss_start: vl };
const hg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: vl,
  data: ml,
  data_start: _l,
  default: dg,
  entry: gl,
  text: ul,
  text_start: fl
}, Symbol.toStringTag, { value: "Module" }));
var El = 1082133128, wl = "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", bl = 1082130432, yl = "GACEQOYOgEBQD4BA5A+AQLgQgEAgEYBAzhCAQEINgEB0EIBAtBCAQAAQgEDyDIBAKBCAQPIMgEDEDoBADg+AQFAPgEDkD4BA1g6AQGoNgECYDYBA0g6AQBoTgEBQD4BA3BGAQNYSgEAwDIBA/BKAQDAMgEAwDIBAMAyAQDAMgEAwDIBAMAyAQDAMgEAwDIBAghGAQDAMgED0EYBA1hKAQA==", Cl = 1082469304, Bl = 1082392576, Ag = { entry: El, text: wl, text_start: bl, data: yl, data_start: Cl, bss_start: Bl };
const pg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Bl,
  data: yl,
  data_start: Cl,
  default: Ag,
  entry: El,
  text: wl,
  text_start: bl
}, Symbol.toStringTag, { value: "Module" }));
var Il = 1082132164, xl = "QREixCbCBsa39wBgEUc3BIRA2Mu39ABgEwQEANxAkYuR57JAIkSSREEBgoCIQBxAE3X1D4KX3bcBEbcHAGBOxoOphwBKyDcJhEAmylLEBs4izLcEAGB9WhMJCQDATBN09A8N4PJAYkQjqDQBQknSRLJJIkoFYYKAiECDJwkAE3X1D4KXfRTjGUT/yb8TBwAMlEGqh2MY5QCFR4XGI6AFAHlVgoAFR2OH5gAJRmONxgB9VYKAQgUTB7ANQYVjlecCiUecwfW3kwbADWMW1QCYwRMFAAyCgJMG0A19VWOV1wCYwRMFsA2CgLc1hUBBEZOFhboGxmE/Y0UFBrc3hUCThweyA6cHCAPWRwgTdfUPkwYWAMIGwYIjktcIMpcjAKcAA9dHCJFnk4cHBGMe9wI3t4RAEwcHsqFnupcDpgcIt/aEQLc3hUCThweyk4YGtmMf5gAjpscII6DXCCOSBwghoPlX4wb1/LJAQQGCgCOm1wgjoOcI3bc3NwBgfEudi/X/NycAYHxLnYv1/4KAQREGxt03tzcAYCOmBwI3BwAImMOYQ33/yFeyQBNF9f8FiUEBgoBBEQbG2T993TcHAEC3NwBgmMM3NwBgHEP9/7JAQQGCgEERIsQ3hIRAkwdEAUrAA6kHAQbGJsJjCgkERTc5xb1HEwREAYFEY9YnAQREvYiTtBQAfTeFPxxENwaAABOXxwCZ4DcGAAG39v8AdY+3NgBg2MKQwphCff9BR5HgBUczCelAupcjKCQBHMSyQCJEkkQCSUEBgoABEQbOIswlNzcEzj9sABMFRP+XAID/54Cg8qqHBUWV57JHk/cHID7GiTc3NwBgHEe3BkAAEwVE/9WPHMeyRZcAgP/ngCDwMzWgAPJAYkQFYYKAQRG3h4RABsaTh0cBBUcjgOcAE9fFAJjHBWd9F8zDyMf5jTqVqpWxgYzLI6oHAEE3GcETBVAMskBBAYKAAREizDeEhECTB0QBJsrER07GBs5KyKqJEwREAWPzlQCuhKnAAylEACaZE1nJABxIY1XwABxEY175ArU9fd1IQCaGzoWXAID/54Ag4xN19Q8BxZMHQAxcyFxAppdcwFxEhY9cxPJAYkTSREJJskkFYYKAaTVtv0ERBsaXAID/54BA1gNFhQGyQHUVEzUVAEEBgoBBEQbGxTcNxbcHhECThwcA1EOZzjdnCWATBwcRHEM3Bv3/fRbxjzcGAwDxjtWPHMOyQEEBgoBBEQbGbTcRwQ1FskBBARcDgP9nAIPMQREGxibCIsSqhJcAgP/ngODJWTcNyTcHhECTBgcAg9eGABMEBwCFB8IHwYMjlPYAkwYADGOG1AATB+ADY3X3AG03IxQEALJAIkSSREEBgoBBEQbGEwcADGMa5QATBbANRTcTBcANskBBAVm/EwewDeMb5f5xNxMF0A31t0ERIsQmwgbGKoSzBLUAYxeUALJAIkSSREEBgoADRQQABQRNP+23NXEmy07H/XKFaf10Is1KyVLFVsMGz5OEhPoWkZOHCQemlxgIs4TnACqJJoUuhJcAgP/ngIAsk4cJBxgIBWq6l7OKR0Ex5AVnfXWTBYX6kwcHBxMFhfkUCKqXM4XXAJMHBweul7OF1wAqxpcAgP/ngEApMkXBRZU3AUWFYhaR+kBqRNpESkm6SSpKmkoNYYKAooljc4oAhWlOhtaFSoWXAID/54DAxRN19Q8B7U6G1oUmhZcAgP/ngIAkTpkzBDRBUbcTBTAGVb8TBQAMSb0xcf1yBWdO11LVVtNezwbfIt0m20rZWtFizWbLaslux/13FpETBwcHPpccCLqXPsYjqgf4qokuirKKtov1M5MHAAIZwbcHAgA+hZcAgP/ngCAdhWdj5VcTBWR9eRMJifqTBwQHypcYCDOJ5wBKhZcAgP/ngKAbfXsTDDv5kwyL+RMHBAeTBwQHFAhil+aXgUQzDNcAs4zXAFJNY3xNCWPxpANBqJk/ooUIAY01uTcihgwBSoWXAID/54CAF6KZopRj9UQDs4ekQWPxdwMzBJpAY/OKAFaEIoYMAU6FlwCA/+eAALUTdfUPVd0CzAFEeV2NTaMJAQBihZcAgP/ngECkffkDRTEB5oWFNGNPBQDj4o3+hWeThwcHopcYCLqX2pcjiqf4BQTxt+MVpf2RR+MF9PYFZ311kwcHB5MFhfoTBYX5FAiqlzOF1wCTBwcHrpezhdcAKsaXAID/54CgDXE9MkXBRWUzUT3BMbcHAgAZ4ZMHAAI+hZcAgP/ngKAKhWIWkfpQalTaVEpZulkqWppaClv6S2pM2kxKTbpNKWGCgLdXQUkZcZOH94QBRYbeotym2srYztbS1NbS2tDezuLM5srqyO7GPs6XAID/54CAnaE5DcE3ZwlgEwcHERxDtwaEQCOi9gC3Bv3//Rb1j8Fm1Y8cwxU5Bc23JwtgN0fYUJOGh8ETBxeqmMIThgfAIyAGACOgBgCThgfCmMKTh8fBmEM3BgQAUY+YwyOgBgC3B4RANzeFQJOHBwATBwe7IaAjoAcAkQfj7ef+RTuRRWgIdTllM7e3hECThweyIWc+lyMg9wi3B4BANwmEQJOHhw4jIPkAtzmFQEU+EwkJAJOJCbJjBQUQtwcBYEVHI6DnDIVFRUWXAID/54AA9rcFgEABRpOFBQBFRZcAgP/ngAD3t/cAYBFHmMs3BQIAlwCA/+eAQPa3FwlgiF+BRbeEhEBxiWEVEzUVAJcAgP/ngACewWf9FxMHABCFZkFmtwUAAQFFk4REAbcKhEANapcAgP/ngACUE4tKASaag6fJCPXfg6vJCIVHI6YJCCMC8QKDxxsACUcjE+ECowLxAgLUTUdjgecIUUdjj+cGKUdjn+cAg8c7AAPHKwCiB9mPEUdjlucAg6eLAJxDPtRFMaFFSBB1NoPHOwADxysAogfZjxFnQQdjdPcEEwWwDRk+EwXADQE+EwXgDik2jTlBt7cFgEABRpOFhQMVRZcAgP/ngADoNwcAYFxHEwUAApPnFxBcxzG3yUcjE/ECTbcDxxsA0UZj5+YChUZj5uYAAUwTBPAPhah5FxN39w/JRuPo5v63NoVACgeThka7NpcYQwKHkwYHA5P29g8RRuNp1vwTB/cCE3f3D41GY+vmCLc2hUAKB5OGBsA2lxhDAocTB0ACY5jnEALUHUQBRaU0AUVVPPE26TahRUgQfRTRPHX0AUwBRBN19A9xPBN1/A9ZPH024x4E6oPHGwBJR2No9zAJR+N29+r1F5P39w89R+Ng9+o3N4VAigcTBwfBupecQ4KHBUSd63AQgUUBRZfwf//ngABxHeHRRWgQnTwBRDGoBUSB75fwf//ngAB2MzSgACmgIUdjhecABUQBTGG3A6yLAAOkywCzZ4wA0gf19+/wv4V98cFsIpz9HH19MwWMQFXcs3eVAZXjwWwzBYxAY+aMAv18MwWMQFXQMYGX8H//54CAclX5ZpT1tzGBl/B//+eAgHFV8WqU0bdBgZfwf//ngMBwUfkzBJRBwbchR+OJ5/ABTBMEAAwxt0FHzb9BRwVE45zn9oOlywADpYsA5TKxv0FHBUTjkuf2A6cLAZFnY+rnHoOlSwEDpYsA7/D/gDW/QUcFROOS5/SDpwsBEWdjavccA6fLAIOlSwEDpYsAM4TnAu/wb/4jrAQAIySKsDG3A8cEAGMDBxQDp4sAwRcTBAAMYxP3AMBIAUeTBvAOY0b3AoPHWwADx0sAAUyiB9mPA8drAEIHXY+Dx3sA4gfZj+OB9uYTBBAMqb0zhusAA0aGAQUHsY7ht4PHBAD9x9xEY50HFMBII4AEAH21YUdjlucCg6fLAQOniwGDpksBA6YLAYOlywADpYsAl/B//+eAQGEqjDM0oAAptQFMBUQRtRFHBUTjmufmt5cAYLRfZXd9FwVm+Y7RjgOliwC037RXgUX5jtGOtNf0X/mO0Y703/RTdY9Rj/jTl/B//+eAIGQpvRP39wDjFQfqk9xHABOEiwABTH1d43Sc20hEl/B//+eAIEgYRFRAEED5jmMHpwEcQhNH9/99j9mOFMIFDEEE2b8RR6W1QUcFROOX596Dp4sAA6dLASMo+QAjJukAdbuDJckAwReR5YnPAUwTBGAMibsDJwkBY2b3BhP3NwDjGQfiAygJAQFGAUczBehAs4blAGNp9wDjBAbSIyipACMm2QAxuzOG6wAQThEHkMIFRum/IUcFROOR59gDJAkBGcATBIAMIygJACMmCQAzNIAApbMBTBMEIAztsQFMEwSADM2xAUwTBJAM6bkTByANY4PnDBMHQA3jm+e4A8Q7AIPHKwAiBF2Ml/B//+eAQEcDrMQAQRRjc4QBIozjCQy2wEBilDGAnEhjVfAAnERjW/QK7/Cvy3XdyEBihpOFiwGX8H//54BAQwHFkwdADNzI3EDil9zA3ESzh4dB3MSX8H//54AgQiW2CWUTBQVxA6zLAAOkiwCX8H//54CgMrcHAGDYS7cGAAHBFpNXRwESB3WPvYvZj7OHhwMBRbPVhwKX8H//54DAMxMFgD6X8H//54BAL+m8g6ZLAQOmCwGDpcsAA6WLAO/w7/vRtIPFOwCDxysAE4WLAaIF3Y3BFe/wj9V1tO/w78Q9vwPEOwCDxysAE4yLASIEXYzcREEUzeORR4VLY/+HCJMHkAzcyEG0A6cNACLQBUizh+xAPtaDJ4qwY3P0AA1IQsY6xO/wb8AiRzJIN4WEQOKFfBCThkoBEBATBcUCl/B//+eAIDE3t4RAkwhHAYJXA6eIsIOlDQAdjB2PPpyyVyOk6LCqi76VI6C9AJOHSgGdjQHFoWdjl/UAWoXv8C/LI6BtAQnE3ESZw+NPcPdj3wsAkwdwDL23hUu3PYVAt4yEQJONDbuTjEwB6b/jnQuc3ETjigeckweADKm3g6eLAOOTB5zv8C/TCWUTBQVxl/B//+eAoBzv8K/Ol/B//+eA4CBVsgOkywDjDwSY7/Cv0BMFgD6X8H//54BAGu/wT8wClFGy7/DPy/ZQZlTWVEZZtlkmWpZaBlv2S2ZM1kxGTbZNCWGCgAAA", Sl = 1082130432, Rl = "FACEQHIKgEDCCoBAGguAQOgLgEBUDIBAAgyAQD4JgECkC4BA5AuAQC4LgEDuCIBAYguAQO4IgEBMCoBAkgqAQMIKgEAaC4BAXgqAQKIJgEDSCYBAWgqAQKwOgEDCCoBAbA2AQGQOgEAuCIBAjA6AQC4IgEAuCIBALgiAQC4IgEAuCIBALgiAQC4IgEAuCIBACA2AQC4IgECKDYBAZA6AQA==", Dl = 1082469296, Ml = 1082392576, gg = { entry: Il, text: xl, text_start: Sl, data: Rl, data_start: Dl, bss_start: Ml };
const ug = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Ml,
  data: Rl,
  data_start: Dl,
  default: gg,
  entry: Il,
  text: xl,
  text_start: Sl
}, Symbol.toStringTag, { value: "Module" }));
var Tl = 1082132164, kl = "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", Fl = 1082130432, Ol = "FECAQHQKgEDECoBAHAuAQOoLgEBWDIBABAyAQEAJgECmC4BA5guAQDALgEDwCIBAZAuAQPAIgEBOCoBAlAqAQMQKgEAcC4BAYAqAQKQJgEDUCYBAXAqAQK4OgEDECoBAbg2AQGYOgEAwCIBAjg6AQDAIgEAwCIBAMAiAQDAIgEAwCIBAMAiAQDAIgEAwCIBACg2AQDAIgECMDYBAZg6AQA==", Pl = 1082223536, Ul = 1082146816, fg = { entry: Tl, text: kl, text_start: Fl, data: Ol, data_start: Pl, bss_start: Ul };
const mg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Ul,
  data: Ol,
  data_start: Pl,
  default: fg,
  entry: Tl,
  text: kl,
  text_start: Fl
}, Symbol.toStringTag, { value: "Module" }));
var Ql = 1082132164, Hl = "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", $l = 1082130432, Gl = "FACDQHIKgEDCCoBAGguAQOgLgEBUDIBAAgyAQD4JgECkC4BA5AuAQC4LgEDuCIBAYguAQO4IgEBMCoBAkgqAQMIKgEAaC4BAXgqAQKIJgEDSCYBAWgqAQKwOgEDCCoBAbA2AQGQOgEAuCIBAjA6AQC4IgEAuCIBALgiAQC4IgEAuCIBALgiAQC4IgEAuCIBACA2AQC4IgECKDYBAZA6AQA==", Ll = 1082403760, Yl = 1082327040, _g = { entry: Ql, text: Hl, text_start: $l, data: Gl, data_start: Ll, bss_start: Yl };
const vg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Yl,
  data: Gl,
  data_start: Ll,
  default: _g,
  entry: Ql,
  text: Hl,
  text_start: $l
}, Symbol.toStringTag, { value: "Module" }));
var Nl = 1341196642, Kl = "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", zl = 1341194240, Jl = "YAD1T3gO8U/GDvFPZA/xT0oQ8U+kEPFPXBDxT8oM8U/+D/FPRhDxT4IP8U96DPFPqg/xT3oM8U9UDvFPkg7xT8YO8U9kD/FPZg7xT/QM8U8oDfFPYg7xT3YU8U/GDvFPGBLxTzYU8U8eC/FPWhTxTx4L8U8eC/FPHgvxTx4L8U8eC/FPHgvxTx4L8U8eC/FPthHxTx4L8U9SE/FPNhTxTw==", jl = 1341533180, Wl = 1341456384, Eg = { entry: Nl, text: Kl, text_start: zl, data: Jl, data_start: jl, bss_start: Wl };
const wg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: Wl,
  data: Jl,
  data_start: jl,
  default: Eg,
  entry: Nl,
  text: Kl,
  text_start: zl
}, Symbol.toStringTag, { value: "Module" }));
var Vl = 1341459344, ql = "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", Zl = 1341456384, Xl = "YAD2T8oQ9U80EfVP0BH1T6wS9U8UE/VPwhL1TwQP9U9oEvVPqBL1T+wR9U+0DvVPFBL1T7QO9U+mEPVP8hD1TzQR9U/QEfVPuBD1TywP9U9gD/VPtBD1TxIV9U80EfVP2BP1T9IU9U9YDfVP9hT1T1gN9U9YDfVPWA31T1gN9U9YDfVPWA31T1gN9U9YDfVPdhP1T1gN9U/wE/VP0hT1Tw==", tc = 1341598720, ec = 1341521920, bg = { entry: Vl, text: ql, text_start: Zl, data: Xl, data_start: tc, bss_start: ec };
const yg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: ec,
  data: Xl,
  data_start: tc,
  default: bg,
  entry: Vl,
  text: ql,
  text_start: Zl
}, Symbol.toStringTag, { value: "Module" }));
var ic = 1073907716, sc = "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", rc = 1073905664, oc = "WAD9P0uLAkDdiwJA8pACQGaMAkD+iwJAZowCQMWMAkDejQJAUY4CQPmNAkDVigJAd40CQNCNAkDojAJAdI4CQBCNAkB0jgJAy4sCQCqMAkBmjAJAxYwCQOOLAkAXiwJAN48CQKqQAkDqiQJA0ZACQOqJAkDqiQJA6okCQOqJAkDqiQJA6okCQOqJAkDqiQJA1I4CQOqJAkDJjwJAqpACQA==", nc = 1073622012, ac = 1073545216, Cg = { entry: ic, text: sc, text_start: rc, data: oc, data_start: nc, bss_start: ac };
const Bg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: ac,
  data: oc,
  data_start: nc,
  default: Cg,
  entry: ic,
  text: sc,
  text_start: rc
}, Symbol.toStringTag, { value: "Module" }));
var lc = 1077381760, cc = "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", dc = 1077379072, hc = "XADKP16ON0AzjzdAR5Q3QL2PN0BTjzdAvY83QB2QN0A6kTdArJE3QFWRN0DpjTdA0JA3QCyRN0BAkDdA0JE3QGiQN0DQkTdAIY83QH6PN0C9jzdAHZA3QDmPN0AqjjdAkJI3QA2UN0AAjTdALZQ3QACNN0AAjTdAAI03QACNN0AAjTdAAI03QACNN0AAjTdAKpI3QACNN0AlkzdADZQ3QAQInwAAAAAAAAAYAQQIBQAAAAAAAAAIAQQIBgAAAAAAAAAAAQQIIQAAAAAAIAAAEQQI3AAAAAAAIAAAEQQIDAAAAAAAIAAAAQQIEgAAAAAAIAAAESAoDAAQAQAA", Ac = 1070279676, pc = 1070202880, Ig = { entry: lc, text: cc, text_start: dc, data: hc, data_start: Ac, bss_start: pc };
const xg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: pc,
  data: hc,
  data_start: Ac,
  default: Ig,
  entry: lc,
  text: cc,
  text_start: dc
}, Symbol.toStringTag, { value: "Module" }));
var gc = 1074843652, uc = "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", fc = 1074843648, mc = "CIH+PwUFBAACAwcAAwMLANTXEEAL2BBAOdgQQNbYEECF5xBAOtkQQJDZEEDc2RBAhecQQKLaEEAf2xBA4NsQQIXnEECF5xBAeNwQQIXnEEBV3xBAHOAQQFfgEECF5xBAhecQQPPgEECF5xBA2+EQQIHiEEDA4xBAf+QQQFDlEECF5xBAhecQQIXnEECF5xBAfuYQQIXnEEB05xBAsN0QQKnYEEDC5RBAydoQQBvaEECF5xBACOcQQE/nEECF5xBAhecQQIXnEECF5xBAhecQQIXnEECF5xBAhecQQELaEEB/2hBA2uUQQAEAAAACAAAAAwAAAAQAAAAFAAAABwAAAAkAAAANAAAAEQAAABkAAAAhAAAAMQAAAEEAAABhAAAAgQAAAMEAAAABAQAAgQEAAAECAAABAwAAAQQAAAEGAAABCAAAAQwAAAEQAAABGAAAASAAAAEwAAABQAAAAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAgAAAAIAAAADAAAAAwAAAAQAAAAEAAAABQAAAAUAAAAGAAAABgAAAAcAAAAHAAAACAAAAAgAAAAJAAAACQAAAAoAAAAKAAAACwAAAAsAAAAMAAAADAAAAA0AAAANAAAAAAAAAAAAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAsAAAANAAAADwAAABEAAAATAAAAFwAAABsAAAAfAAAAIwAAACsAAAAzAAAAOwAAAEMAAABTAAAAYwAAAHMAAACDAAAAowAAAMMAAADjAAAAAgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAgAAAAMAAAADAAAAAwAAAAMAAAAEAAAABAAAAAQAAAAEAAAABQAAAAUAAAAFAAAABQAAAAAAAAAAAAAAAAAAABAREgAIBwkGCgULBAwDDQIOAQ8AAQEAAAEAAAAEAAAA", _c = 1073720488, vc = 1073643776, Sg = { entry: gc, text: uc, text_start: fc, data: mc, data_start: _c, bss_start: vc };
const Rg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  bss_start: vc,
  data: mc,
  data_start: _c,
  default: Sg,
  entry: gc,
  text: uc,
  text_start: fc
}, Symbol.toStringTag, { value: "Module" }));
let vi = class extends Gr {
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
    const r = await this.getPkgVersion(t), o = await this.getChipRevision(t), n = o == 3;
    return (1 & await this.readEfuse(t, 3)) != 0 && (e[0] = "ESP32-S0WDQ6", e[1] = "ESP32-S0WD"), n && (e[5] = "ESP32-PICO-V3"), i = r >= 0 && r <= 6 ? e[r] : "Unknown ESP32", !n || r !== 0 && r !== 1 || (i += "-V3"), i + " (revision " + o + ")";
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
const Dg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32ROM: vi
}, Symbol.toStringTag, { value: "Module" }));
let Nr = class extends vi {
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
    const e = ["Wi-Fi", "BLE"], i = await this.getFlashCap(t), r = await this.getFlashVendor(t), o = { 0: null, 1: "Embedded Flash 4MB", 2: "Embedded Flash 2MB", 3: "Embedded Flash 1MB", 4: "Embedded Flash 8MB" }[i], n = o !== void 0 ? o : "Unknown Embedded Flash";
    return o !== null && e.push(`${n} (${r})`), e;
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
const Mg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32C3ROM: Nr
}, Symbol.toStringTag, { value: "Module" }));
let Tg = class extends Nr {
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
const kg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32C2ROM: Tg
}, Symbol.toStringTag, { value: "Module" }));
class us extends Nr {
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
const Fg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32C6ROM: us
}, Symbol.toStringTag, { value: "Module" }));
let Og = class extends us {
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
const Pg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32C61ROM: Og
}, Symbol.toStringTag, { value: "Module" }));
let Ug = class extends us {
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
const Qg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32C5ROM: Ug
}, Symbol.toStringTag, { value: "Module" }));
class Hg extends us {
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
const $g = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32H2ROM: Hg
}, Symbol.toStringTag, { value: "Module" }));
class Gg extends vi {
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
    const e = ["Wi-Fi", "BLE"], i = await this.getFlashCap(t), r = await this.getFlashVendor(t), o = { 0: null, 1: "Embedded Flash 8MB", 2: "Embedded Flash 4MB" }[i], n = o !== void 0 ? o : "Unknown Embedded Flash";
    o !== null && e.push(`${n} (${r})`);
    const a = await this.getPsramCap(t), l = await this.getPsramVendor(t), c = { 0: null, 1: "Embedded PSRAM 8MB", 2: "Embedded PSRAM 2MB" }[a], d = c !== void 0 ? c : "Unknown Embedded PSRAM";
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
const Lg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32S3ROM: Gg
}, Symbol.toStringTag, { value: "Module" }));
let Yg = class extends vi {
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
const Ng = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32S2ROM: Yg
}, Symbol.toStringTag, { value: "Module" }));
class Kg extends vi {
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
const zg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ESP32P4ROM: Kg
}, Symbol.toStringTag, { value: "Module" }));
export {
  jd as CircuitSetupPanel
};
