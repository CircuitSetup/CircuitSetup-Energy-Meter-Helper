const R = globalThis, j = R.ShadowRoot && (R.ShadyCSS === void 0 || R.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, z = /* @__PURE__ */ Symbol(), G = /* @__PURE__ */ new WeakMap();
let rt = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== z) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (j && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = G.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && G.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const ut = (n) => new rt(typeof n == "string" ? n : n + "", void 0, z), bt = (n, ...t) => {
  const e = n.length === 1 ? n[0] : t.reduce((i, s, r) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[r + 1], n[0]);
  return new rt(e, n, z);
}, gt = (n, t) => {
  if (j) n.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), s = R.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = e.cssText, n.appendChild(i);
  }
}, F = j ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return ut(e);
})(n) : n;
const { is: ft, defineProperty: mt, getOwnPropertyDescriptor: vt, getOwnPropertyNames: yt, getOwnPropertySymbols: $t, getPrototypeOf: _t } = Object, N = globalThis, K = N.trustedTypes, wt = K ? K.emptyScript : "", xt = N.reactiveElementPolyfillSupport, S = (n, t) => n, B = { toAttribute(n, t) {
  switch (t) {
    case Boolean:
      n = n ? wt : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, t) {
  let e = n;
  switch (t) {
    case Boolean:
      e = n !== null;
      break;
    case Number:
      e = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(n);
      } catch {
        e = null;
      }
  }
  return e;
} }, at = (n, t) => !ft(n, t), Z = { attribute: !0, type: String, converter: B, reflect: !1, useDefault: !1, hasChanged: at };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), N.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let w = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = Z) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(t, i, e);
      s !== void 0 && mt(this.prototype, t, s);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: s, set: r } = vt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: s, set(a) {
      const p = s?.call(this);
      r?.call(this, a), this.requestUpdate(t, p, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Z;
  }
  static _$Ei() {
    if (this.hasOwnProperty(S("elementProperties"))) return;
    const t = _t(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(S("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(S("properties"))) {
      const e = this.properties, i = [...yt(e), ...$t(e)];
      for (const s of i) this.createProperty(s, e[s]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, s] of e) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const s = this._$Eu(e, i);
      s !== void 0 && this._$Eh.set(s, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const s of i) e.unshift(F(s));
    } else t !== void 0 && e.push(F(t));
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
    return gt(t, this.constructor.elementStyles), t;
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
    const i = this.constructor.elementProperties.get(t), s = this.constructor._$Eu(t, i);
    if (s !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : B).toAttribute(e, i.type);
      this._$Em = t, r == null ? this.removeAttribute(s) : this.setAttribute(s, r), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, s = i._$Eh.get(t);
    if (s !== void 0 && this._$Em !== s) {
      const r = i.getPropertyOptions(s), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : B;
      this._$Em = s;
      const p = a.fromAttribute(e, r.type);
      this[s] = p ?? this._$Ej?.get(s) ?? p, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, s = !1, r) {
    if (t !== void 0) {
      const a = this.constructor;
      if (s === !1 && (r = this[t]), i ??= a.getPropertyOptions(t), !((i.hasChanged ?? at)(r, e) || i.useDefault && i.reflect && r === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: s, wrapped: r }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), r !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), s === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        for (const [s, r] of this._$Ep) this[s] = r;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [s, r] of i) {
        const { wrapped: a } = r, p = this[s];
        a !== !0 || this._$AL.has(s) || p === void 0 || this.C(s, void 0, r, p);
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
w.elementStyles = [], w.shadowRootOptions = { mode: "open" }, w[S("elementProperties")] = /* @__PURE__ */ new Map(), w[S("finalized")] = /* @__PURE__ */ new Map(), xt?.({ ReactiveElement: w }), (N.reactiveElementVersions ??= []).push("2.1.2");
const V = globalThis, J = (n) => n, M = V.trustedTypes, X = M ? M.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, ot = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, lt = "?" + v, At = `<${lt}>`, _ = document, E = () => _.createComment(""), T = (n) => n === null || typeof n != "object" && typeof n != "function", L = Array.isArray, Ct = (n) => L(n) || typeof n?.[Symbol.iterator] == "function", q = `[\x20\t
\f\r]`, C = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Q = /-->/g, Y = />/g, y = RegExp(`>|${q}(?:([^\\s"'>=/]+)(${q}*=${q}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), tt = /'/g, et = /"/g, dt = /^(?:script|style|textarea|title)$/i, St = (n) => (t, ...e) => ({ _$litType$: n, strings: t, values: e }), d = St(1), x = /* @__PURE__ */ Symbol.for("lit-noChange"), b = /* @__PURE__ */ Symbol.for("lit-nothing"), it = /* @__PURE__ */ new WeakMap(), $ = _.createTreeWalker(_, 129);
function ct(n, t) {
  if (!L(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return X !== void 0 ? X.createHTML(t) : t;
}
const kt = (n, t) => {
  const e = n.length - 1, i = [];
  let s, r = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = C;
  for (let p = 0; p < e; p++) {
    const c = n[p];
    let u, l, o = -1, h = 0;
    for (; h < c.length && (a.lastIndex = h, l = a.exec(c), l !== null); ) h = a.lastIndex, a === C ? l[1] === "!--" ? a = Q : l[1] !== void 0 ? a = Y : l[2] !== void 0 ? (dt.test(l[2]) && (s = RegExp("</" + l[2], "g")), a = y) : l[3] !== void 0 && (a = y) : a === y ? l[0] === ">" ? (a = s ?? C, o = -1) : l[1] === void 0 ? o = -2 : (o = a.lastIndex - l[2].length, u = l[1], a = l[3] === void 0 ? y : l[3] === '"' ? et : tt) : a === et || a === tt ? a = y : a === Q || a === Y ? a = C : (a = y, s = void 0);
    const f = a === y && n[p + 1].startsWith("/>") ? " " : "";
    r += a === C ? c + At : o >= 0 ? (i.push(u), c.slice(0, o) + ot + c.slice(o) + v + f) : c + v + (o === -2 ? p : f);
  }
  return [ct(n, r + (n[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class I {
  constructor({ strings: t, _$litType$: e }, i) {
    let s;
    this.parts = [];
    let r = 0, a = 0;
    const p = t.length - 1, c = this.parts, [u, l] = kt(t, e);
    if (this.el = I.createElement(u, i), $.currentNode = this.el.content, e === 2 || e === 3) {
      const o = this.el.content.firstChild;
      o.replaceWith(...o.childNodes);
    }
    for (; (s = $.nextNode()) !== null && c.length < p; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const o of s.getAttributeNames()) if (o.endsWith(ot)) {
          const h = l[a++], f = s.getAttribute(o).split(v), m = /([.?@])?(.*)/.exec(h);
          c.push({ type: 1, index: r, name: m[2], strings: f, ctor: m[1] === "." ? Tt : m[1] === "?" ? It : m[1] === "@" ? Pt : O }), s.removeAttribute(o);
        } else o.startsWith(v) && (c.push({ type: 6, index: r }), s.removeAttribute(o));
        if (dt.test(s.tagName)) {
          const o = s.textContent.split(v), h = o.length - 1;
          if (h > 0) {
            s.textContent = M ? M.emptyScript : "";
            for (let f = 0; f < h; f++) s.append(o[f], E()), $.nextNode(), c.push({ type: 2, index: ++r });
            s.append(o[h], E());
          }
        }
      } else if (s.nodeType === 8) if (s.data === lt) c.push({ type: 2, index: r });
      else {
        let o = -1;
        for (; (o = s.data.indexOf(v, o + 1)) !== -1; ) c.push({ type: 7, index: r }), o += v.length - 1;
      }
      r++;
    }
  }
  static createElement(t, e) {
    const i = _.createElement("template");
    return i.innerHTML = t, i;
  }
}
function A(n, t, e = n, i) {
  if (t === x) return t;
  let s = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const r = T(t) ? void 0 : t._$litDirective$;
  return s?.constructor !== r && (s?._$AO?.(!1), r === void 0 ? s = void 0 : (s = new r(n), s._$AT(n, e, i)), i !== void 0 ? (e._$Co ??= [])[i] = s : e._$Cl = s), s !== void 0 && (t = A(n, s._$AS(n, t.values), s, i)), t;
}
class Et {
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
    const { el: { content: e }, parts: i } = this._$AD, s = (t?.creationScope ?? _).importNode(e, !0);
    $.currentNode = s;
    let r = $.nextNode(), a = 0, p = 0, c = i[0];
    for (; c !== void 0; ) {
      if (a === c.index) {
        let u;
        c.type === 2 ? u = new P(r, r.nextSibling, this, t) : c.type === 1 ? u = new c.ctor(r, c.name, c.strings, this, t) : c.type === 6 && (u = new Ut(r, this, t)), this._$AV.push(u), c = i[++p];
      }
      a !== c?.index && (r = $.nextNode(), a++);
    }
    return $.currentNode = _, s;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class P {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, i, s) {
    this.type = 2, this._$AH = b, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    t = A(this, t, e), T(t) ? t === b || t == null || t === "" ? (this._$AH !== b && this._$AR(), this._$AH = b) : t !== this._$AH && t !== x && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Ct(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== b && T(this._$AH) ? this._$AA.nextSibling.data = t : this.T(_.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, s = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = I.createElement(ct(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(e);
    else {
      const r = new Et(s, this), a = r.u(this.options);
      r.p(e), this.T(a), this._$AH = r;
    }
  }
  _$AC(t) {
    let e = it.get(t.strings);
    return e === void 0 && it.set(t.strings, e = new I(t)), e;
  }
  k(t) {
    L(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, s = 0;
    for (const r of t) s === e.length ? e.push(i = new P(this.O(E()), this.O(E()), this, this.options)) : i = e[s], i._$AI(r), s++;
    s < e.length && (this._$AR(i && i._$AB.nextSibling, s), e.length = s);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = J(t).nextSibling;
      J(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class O {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, s, r) {
    this.type = 1, this._$AH = b, this._$AN = void 0, this.element = t, this.name = e, this._$AM = s, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = b;
  }
  _$AI(t, e = this, i, s) {
    const r = this.strings;
    let a = !1;
    if (r === void 0) t = A(this, t, e, 0), a = !T(t) || t !== this._$AH && t !== x, a && (this._$AH = t);
    else {
      const p = t;
      let c, u;
      for (t = r[0], c = 0; c < r.length - 1; c++) u = A(this, p[i + c], e, c), u === x && (u = this._$AH[c]), a ||= !T(u) || u !== this._$AH[c], u === b ? t = b : t !== b && (t += (u ?? "") + r[c + 1]), this._$AH[c] = u;
    }
    a && !s && this.j(t);
  }
  j(t) {
    t === b ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Tt extends O {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === b ? void 0 : t;
  }
}
class It extends O {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== b);
  }
}
class Pt extends O {
  constructor(t, e, i, s, r) {
    super(t, e, i, s, r), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = A(this, t, e, 0) ?? b) === x) return;
    const i = this._$AH, s = t === b && i !== b || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, r = t !== b && (i === b || s);
    s && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Ut {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    A(this, t);
  }
}
const Rt = V.litHtmlPolyfillSupport;
Rt?.(I, P), (V.litHtmlVersions ??= []).push("3.3.3");
const Mt = (n, t, e) => {
  const i = e?.renderBefore ?? t;
  let s = i._$litPart$;
  if (s === void 0) {
    const r = e?.renderBefore ?? null;
    i._$litPart$ = s = new P(t.insertBefore(E(), r), r, void 0, e ?? {});
  }
  return s._$AI(n), s;
};
const W = globalThis;
class k extends w {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Mt(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return x;
  }
}
k._$litElement$ = !0, k.finalized = !0, W.litElementHydrateSupport?.({ LitElement: k });
const Dt = W.litElementPolyfillSupport;
Dt?.({ LitElement: k });
(W.litElementVersions ??= []).push("4.2.2");
const st = "circuitsetup_energy_meter_helper/", Nt = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i;
class D {
  constructor(t, e) {
    this.hass = t, this.entryId = e, this.setupStatus = () => this.call("setup_status"), this.listMeters = () => this.call("list_meters"), this.getTopology = (i) => this.call("get_topology", { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", { device_id: i }), this.getSession = (i) => this.call("get_session", { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary"), this.setInstallerIntent = (i, s) => this.call("set_installer_intent", { addon_count: i, connection_type: s }), this.rescan = () => this.call("rescan"), this.adoptDevice = (i) => this.call("adopt_device", { device_id: i }), this.previewCtConfig = (i, s, r, a) => this.call("preview_ct_config", {
      device_id: i,
      plan_id: s,
      source_sha256: r,
      changes: a
    }), this.transaction = (i, s, r, a) => this.call(i, {
      device_id: s,
      transaction_id: r,
      source_sha256: a
    }), this.applyCtConfig = (i, s, r) => this.transaction("apply_ct_config", i, s, r), this.compileCtConfig = (i, s, r) => this.transaction("compile_ct_config", i, s, r), this.installCtConfig = (i, s, r) => this.transaction("install_ct_config", i, s, r), this.rollbackCtConfig = (i, s, r) => this.transaction("rollback_ct_config", i, s, r), this.startSession = (i) => this.call("start_session", { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, r) => this.call("check_stability", { session_id: i, target: s, target_id: r }), this.calibrateVoltage = (i, s, r, a) => this.call("calibrate_voltage", {
      session_id: i,
      group_key: s,
      reference: r,
      confirm_iteration: a
    }), this.calibrateCurrent = (i, s, r, a) => this.call("calibrate_current", {
      session_id: i,
      channel: s,
      reference: r,
      confirm_iteration: a
    }), this.restartAndVerify = (i) => this.call("restart_and_verify", { session_id: i }), this.cancelSession = (i) => this.call("cancel_session", { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, i), this.subscribeConfigTransaction = (i, s, r, a) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: s,
      source_sha256: r
    }, a), this.subscribeSession = (i, s) => this.subscribe("subscribe_session", { session_id: i }, s);
  }
  static assertPublicPayload(t, e = 0) {
    if (e > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(t)) {
      for (const i of t) this.assertPublicPayload(i, e + 1);
      return;
    }
    if (!(t === null || typeof t != "object"))
      for (const [i, s] of Object.entries(t)) {
        if (i.toLowerCase() !== "raw_gain_ct" && Nt.test(i))
          throw new Error(`private field ${i} refused`);
        this.assertPublicPayload(s, e + 1);
      }
  }
  async call(t, e = {}) {
    const i = await this.hass.callWS({
      type: `${st}${t}`,
      entry_id: this.entryId,
      ...e
    });
    return D.assertPublicPayload(i), i;
  }
  subscribe(t, e, i) {
    return this.hass.connection.subscribeMessage((s) => {
      D.assertPublicPayload(s), i(s);
    }, { type: `${st}${t}`, entry_id: this.entryId, ...e });
  }
}
function Ot(n, t, e, i, s) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Select the compatible meter discovered on your network.</p>
      <div class="meter-list">
        ${n.map((r) => d`
          <label class=${r.entry_id === t ? "meter-row selected" : "meter-row"}>
            <input type="radio" name="meter" .checked=${r.entry_id === t}
              @change=${() => e(r.entry_id)} />
            <span><strong>${r.title}</strong><small>${r.project_name}</small></span>
            <span>Device Builder: ${r.configuration ? "Configured" : r.importable ? "Importable" : r.importable === null ? "Unavailable" : "Not importable"}</span>
          </label>
        `)}
      </div>
      ${n.some((r) => r.entry_id === t && r.importable) ? d`
        <button class="secondary" @click=${i}>Adopt</button>
      ` : ""}
      <footer class="action-footer">
        <button class="secondary" data-action="back">Back</button>
        <button class="primary" data-action="continue" ?disabled=${!t} @click=${s}>Continue</button>
      </footer>
    </section>
  `;
}
function Ht(n) {
  return d`
    <section class="review-region" aria-labelledby="review-heading">
      <h2 id="review-heading">Review changes</h2>
      <p class="warning-band">Changing a firmware name can also change its Home Assistant rename/entity-key binding. Review every substitution before Apply.</p>
      <pre aria-label="Redacted substitution diff">${n?.redacted_diff || "No reviewed substitutions yet."}</pre>
      <dl class="status-list">
        <div><dt>Validation</dt><dd>${n?.state === "validated" || n?.progress.includes("config_validated") ? "Validated" : "Pending"}</dd></div>
        <div><dt>Compile</dt><dd>${n?.state === "compiled" || n?.progress.includes("firmware_compiled") ? "Compiled" : "Pending"}</dd></div>
        <div><dt>Install</dt><dd>${n?.state === "install_confirmation_required" ? "Confirmation required" : n?.state ?? "Pending"}</dd></div>
      </dl>
    </section>
  `;
}
function qt(n, t, e, i, s, r) {
  const a = n?.state ?? "previewed";
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${Ht(n)}
      ${a === "failed" ? d`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${n?.evidence.join(", ") || "The operation did not complete."}</p>
          ${n?.rollback_available ? d`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${t} ?disabled=${a !== "previewed"}>Apply</button>
        <button class="secondary" @click=${e} ?disabled=${a !== "validated"}>Compile</button>
        <button class="primary" @click=${i} ?disabled=${a !== "install_confirmation_required"}>Install</button>
      </div>
      <footer class="action-footer">
        <button class="secondary">Back</button>
        <button class="primary" data-action="continue" @click=${r} ?disabled=${a !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const Bt = (n, t) => n?.default_gain_ct == null || !Number.isFinite(t) || t <= 0 ? null : Math.round(n.default_gain_ct / t);
function jt(n, t, e, i, s, r, a, p) {
  const c = Math.ceil(n.channels.length / 6), u = n.channels.filter((l) => l.address.board_index === t).slice(0, 8);
  return d`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards">
        ${Array.from({ length: c }, (l, o) => d`
          <button role="tab" data-board-tab=${o} aria-selected=${o === t}
            @click=${() => s(o)}>${o === 0 ? "Main Board" : `Add-on ${o}`}</button>
        `)}
      </div>
      <div class="group-nav" aria-label="Three-channel groups">
        <button data-group-nav aria-current=${e === 0} @click=${() => r(0)}>Group 1 · CT${t * 6 + 1}–${t * 6 + 3}</button>
        <button data-group-nav aria-current=${e === 1} @click=${() => r(1)}>Group 2 · CT${t * 6 + 4}–${t * 6 + 6}</button>
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <div class="ct-table" role="table" aria-rowcount=${n.channels.length}>
        <div class="ct-header" role="row">
          <span>Name</span><span>Model</span><span>Current gain</span><span>Multiplier</span><span>Resulting gain</span><span>Burden</span><span>Status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${u.map((l) => {
    const o = i.get(l.channel) ?? {
      name: l.name,
      modelId: l.selected_model_id ?? "",
      multiplier: l.reporting_multiplier,
      expanded: !1
    }, h = n.catalog.presets.find((g) => g.model_id === o.modelId), f = Bt(h, o.multiplier), m = o.name !== l.name || o.modelId !== (l.selected_model_id ?? "") || o.multiplier !== l.reporting_multiplier;
    return d`
              <div class="ct-row" data-ct-row data-ct-group=${l.address.group_index - 1} role="row" aria-label=${`CT${l.channel}`}>
                <label><span class="mobile-label">Name</span><input aria-label=${`CT${l.channel} name`} .value=${o.name}
                  @input=${(g) => a(l.channel, { name: g.target.value })} /></label>
                <label><span class="mobile-label">Model</span><select aria-label=${`CT${l.channel} model`}
                  @change=${(g) => a(l.channel, { modelId: g.target.value, expanded: !0 })}>
                  <option value="" ?selected=${o.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((g) => d`<option value=${g.model_id} ?selected=${o.modelId === g.model_id}>${g.label}</option>`)}
                  <option value="custom" ?selected=${o.modelId === "custom"}>Custom</option>
                </select></label>
                <span><span class="mobile-label">Current gain</span>${l.raw_gain_ct}</span>
                <label><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${l.channel} multiplier`}
                  .value=${String(o.multiplier)} @input=${(g) => a(l.channel, { multiplier: Number(g.target.value) })} /></label>
                <span><span class="mobile-label">Resulting gain</span>${f ?? "—"}</span>
                <span><span class="mobile-label">Burden</span>${h?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button class="row-toggle" aria-expanded=${o.expanded} @click=${() => a(l.channel, { expanded: !o.expanded })}>
                  ${o.modelId ? m ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${h && h.rated_current_a > 65.535 && o.multiplier === 1 ? d`<div class="warning-band" role="status">CT${l.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : b}
              ${o.expanded && h ? d`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${h.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${h.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${h.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${h.notes || (h.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : b}
            `;
  })}
        </div>
      </div>
      <p class="row-count">Showing ${u.length} of ${n.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary">Back</button>
        <button class="primary" ?disabled=${[...i.values()].every((l, o) => {
    const h = n.channels[o];
    return h !== void 0 && l.name === h.name && l.modelId === (h.selected_model_id ?? "") && l.multiplier === h.reporting_multiplier;
  })} @click=${p}>Review changes</button>
      </footer>
    </section>
  `;
}
function zt(n, t) {
  return n.channels.flatMap((e) => {
    const i = t.get(e.channel);
    return !i || i.name === e.name && i.modelId === (e.selected_model_id ?? "") && i.multiplier === e.reporting_multiplier ? [] : [{ channel: e.channel, name: i.name, model_id: i.modelId, reporting_multiplier: i.multiplier }];
  });
}
function Vt(n, t, e, i, s, r, a, p, c, u, l) {
  const o = n?.ct_count ?? t?.channels.length ?? 6, h = Math.floor((e - 1) / 6), f = h * 6 + 1;
  return d`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(o / 6) }, (m, g) => d`<button role="tab" aria-selected=${g === h} @click=${() => a(g * 6 + 1)}>${g === 0 ? "Main Board" : `Add-on ${g}`}</button>`)}
      </div>
      <div class="group-grid">
        ${[0, 3].map((m) => d`<section><h2>Group ${h * 2 + m / 3 + 1}</h2>${Array.from({ length: 3 }, (g, ht) => {
    const H = f + m + ht;
    return d`<button class=${H === e ? "selected" : ""} @click=${() => a(H)}>CT${H}</button>`;
  })}</section>`)}
      </div>
      <h2>Calibrate CT${e}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(i)} @input=${(m) => p(Number(m.target.value))} /></label>
      <button class="secondary" @click=${c}>Check stability</button>
      ${s ? d`<div class=${s.stable ? "success-band" : "warning-band"} role="status">${s.stable ? "Stable" : "Retake samples"}</div>` : ""}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration ${r?.iteration ?? 1} of 3</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${u} ?disabled=${!s?.stable || (r?.iteration ?? 0) >= 3}>Calibrate CT${e}</button>
      ${r?.state.includes("indeterminate") ? d`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${l}>Reconnect and inspect</button></aside>` : ""}
    </section>
  `;
}
function Lt(n, t, e) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, and entity bindings.</p>
      <div class="status-band" role="status">${n || "Ready for restart verification"}</div>
      ${n.includes("failed") || n.includes("indeterminate") ? d`<div class="recovery-panel"><strong>Recovery required</strong><button class="danger" @click=${e}>Review rollback</button></div>` : ""}
      <button class="primary" @click=${t}>Restart and verify</button>
    </section>
  `;
}
function Wt(n) {
  return n ? n.preflight.issues.length ? d`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((t) => d`<li>${t.role}: ${t.detail}</li>`)}</ul></div>` : d`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : d`<p>Starting a calibration session…</p>`;
}
function Gt(n, t, e, i, s) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${Wt(n)}
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
        <label class="check-row"><input type="checkbox" .checked=${t} @change=${(r) => e(r.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${s}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary">Back</button>
        <button class="primary" @click=${i} ?disabled=${!t || !!n?.preflight.issues.length}>Continue</button>
      </footer>
    </section>
  `;
}
const nt = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Ft = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function Kt(n, t, e, i, s, r) {
  return d`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (a, p) => d`
            <label class=${p === t ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(p)}
                .checked=${p === t} @change=${() => i(p)} />
              <span>${p}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${nt.map(([a, p]) => d`
            <label class=${a === e ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${a}
                .checked=${a === e} @change=${() => s(a)} />
              <span>${p}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>IO0</dt><dd><strong>OPEN</strong> (not connected)</dd></div>
          <div><dt>Add-on boards</dt><dd>${t}</dd></div>
          <div><dt>Connection</dt><dd>${nt.find(([a]) => a === e)?.[1]}</dd></div>
          ${Ft.slice(0, t).map((a, p) => d`<div><dt>Add-on ${p + 1}</dt><dd>${a}</dd></div>`)}
        </dl>
      </section>
      <p class="info-band">Use Web Serial in a supported Chromium browser and a USB data cable to flash the firmware.</p>
      <section class="io-guidance" aria-labelledby="io-heading">
        <h2 id="io-heading">IO0 guidance</h2>
        <p>Keep IO0 OPEN (not connected) while flashing. Do not connect IO0 to GND.</p>
      </section>
      <p class="info-band">${e === "wifi" ? "The external installer collects Wi-Fi provisioning details; this helper does not." : "Connect Ethernet after flashing, then wait for the meter to appear on your network."}</p>
      <section aria-labelledby="installer-heading">
        <h2 id="installer-heading">Flash in external installer</h2>
        <p>Flashing happens in the external installer. This helper continues only after your device is on the network and discovered.</p>
        <button class="primary installer" @click=${() => window.open(
    "https://circuitsetup.github.io/ESPWebInstaller/",
    "_blank",
    "noopener,noreferrer"
  )}>Open CircuitSetup Web Installer</button>
      </section>
      ${n?.devices.length ? "" : d`
        <div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>
      `}
      <footer class="action-footer single">
        <button class="rescan" data-action="rescan" @click=${r}>Rescan</button>
      </footer>
    </section>
  `;
}
function pt(n, t, e, i) {
  return d`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((s) => d`<li>${s.source}: ${s.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${t?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows</h3><p>${i?.windows.length ?? 0} bounded sample windows.</p></section>
        <section><h3>Gains and parsed matching lines</h3><p>${e?.progress.join(", ") || "No transaction evidence."}</p></section>
        <section><h3>Authority source</h3><p>${n ? "Configuration and verified native API evidence" : "Not yet established"}</p></section>
      </div>
    </details>
  `;
}
function Zt(n, t, e, i) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="success-band" role="status">Setup and exact restart verification are complete.</div>
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Authority source</dt><dd>Verified configuration and native API evidence</dd></div></dl>
      ${pt(n, t, e, i)}
    </section>
  `;
}
function Jt(n) {
  const t = n.addon_count;
  return n.board_count !== t + 1 || n.ct_count !== 6 * (t + 1) || n.group_count !== 2 * (t + 1) || n.evidence.some((e) => e.addon_count !== t);
}
function Xt(n, t) {
  const e = Jt(n);
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="identity-strip">
        <strong>${n.project_name}</strong>
        <span>${n.board_count} boards</span><span>${n.ct_count} CTs</span>
        <span>${n.group_count} groups</span><span>${n.connection_type}</span>
      </div>
      <h2>Topology evidence</h2>
      <table class="evidence-table">
        <thead><tr><th>Source</th><th>Add-ons</th><th>Evidence</th></tr></thead>
        <tbody>${n.evidence.map((i) => d`
          <tr><td>${i.source.replaceAll("_", " ")}</td><td>${i.addon_count}</td><td>${i.detail}</td></tr>
        `)}</tbody>
      </table>
      ${e ? d`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : d`
        <div class="success-band" role="status">All topology evidence agrees.</div>
        <footer class="action-footer">
          <button class="secondary">Back</button>
          <button class="primary" data-action="continue" @click=${t}>Continue</button>
        </footer>
      `}
    </section>
  `;
}
function Qt(n, t, e, i, s, r, a, p) {
  const c = n?.group_count ?? 2;
  return d`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="target-tabs" role="tablist" aria-label="Voltage groups">
        ${Array.from({ length: c }, (u, l) => d`<button role="tab" aria-selected=${l === t} @click=${() => s(l)}>Group ${l + 1}</button>`)}
      </div>
      <h2>Calibrate voltage group ${t + 1}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(e)} @input=${(u) => r(Number(u.target.value))} /></label>
      <button class="secondary" @click=${a}>Check stability</button>
      ${i ? d`<div class=${i.stable ? "success-band" : "warning-band"} role="status">${i.stable ? "Stable sample window" : "Samples are not stable yet"}</div>` : ""}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${p} ?disabled=${!i?.stable}>Calibrate voltage</button>
    </section>
  `;
}
const Yt = bt`
  :host {
    --navy: #09284f;
    --orange: #ff6a00;
    --teal: #078c87;
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
  button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible { outline: 3px solid #1769d3; outline-offset: 2px; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  .primary { color: #fff; background: var(--orange); border-color: var(--orange); }
  .secondary { color: var(--navy); background: #fff; border-color: #42658d; }
  .danger { color: var(--danger); border-color: var(--danger); background: #fff; }
  .app { display: grid; grid-template-columns: 232px minmax(0, 1fr); min-height: 100vh; }
  aside.workflow { background: var(--navy); color: #fff; padding: 28px 24px; }
  .brand { color: var(--orange); font-size: 20px; font-weight: 750; margin-bottom: 36px; }
  nav ol { list-style: none; margin: 0; padding: 0; }
  nav li { position: relative; min-height: 60px; }
  nav li:not(:last-child)::after { content: ""; position: absolute; left: 17px; top: 38px; width: 1px; height: 28px; background: #8fa2b9; }
  .step-button { display: grid; grid-template-columns: 36px 1fr; gap: 10px; align-items: center; width: 100%; padding: 0; border: 0; background: transparent; color: inherit; text-align: left; font-weight: 500; }
  .step-button .number { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #d7e1ec; border-radius: 50%; }
  li.current .step-button { color: var(--orange); font-weight: 750; }
  li.current .number { color: var(--navy); background: var(--orange); border-color: var(--orange); }
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
  .choice-field > p { margin: 3px 0 12px; }
  .addon-options { display: grid; grid-template-columns: repeat(7, minmax(52px, 1fr)); gap: 12px; max-width: 760px; }
  .addon-options label, .connection-options label { display: flex; align-items: center; border: 1px solid #b8c1cc; border-radius: 5px; cursor: pointer; }
  .addon-options label { justify-content: center; min-height: 56px; font-size: 18px; font-weight: 700; }
  .addon-options input, .connection-options input, .meter-row input { position: absolute; opacity: 0; pointer-events: none; }
  .addon-options .selected { color: #fff; background: var(--navy); border-color: var(--navy); }
  .connection-options { display: grid; gap: 10px; max-width: 760px; }
  .connection-options label { min-height: 58px; padding: 0 20px; font-size: 17px; font-weight: 700; }
  .connection-options label::before { content: ""; width: 22px; height: 22px; margin-right: 22px; border: 2px solid #aeb7c4; border-radius: 50%; }
  .connection-options .selected { border-color: #1769d3; }
  .connection-options .selected::before { border: 6px solid #1769d3; }
  .summary-band, .info-band, .io-guidance, .success-band, .warning-band, .status-band { background: var(--band); border: 1px solid var(--border); border-radius: 5px; padding: 14px 16px; }
  dl { margin: 0; }
  dl div { display: flex; gap: 12px; }
  dt { font-weight: 700; }
  dd { margin: 0; }
  .summary-band strong, .success-band { color: var(--teal); }
  .io-guidance { border-color: #1769d3; background: #fff; }
  .io-guidance h2 { margin-top: 0; }
  .installer { width: min(100%, 760px); }
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
  .board-tabs button[aria-selected="true"], .target-tabs button[aria-selected="true"] { color: #1769d3; border-bottom: 2px solid #1769d3; }
  .group-nav { display: flex; gap: 8px; margin: 14px 0; }
  .ct-table { border: 1px solid var(--border); }
  .ct-header, .ct-row { display: grid; grid-template-columns: 1.45fr 1.4fr .8fr .8fr .9fr .7fr .9fr; align-items: center; gap: 14px; padding: 11px 16px; }
  .ct-header { font-weight: 700; background: var(--band); }
  .ct-row { min-height: 66px; border-top: 1px solid var(--border); }
  .ct-row input, .ct-row select { width: 100%; min-width: 0; padding: 8px; border: 1px solid #b8c1cc; border-radius: 4px; }
  .row-toggle { color: var(--teal); border: 0; padding: 4px; }
  .mobile-label { display: none; }
  .ct-detail { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 32px; padding: 16px 30px; background: var(--band); border-top: 1px solid var(--border); }
  .row-count { color: var(--muted); padding-left: 12px; }
  pre { max-height: 260px; overflow: auto; padding: 16px; color: #243047; background: var(--band); border: 1px solid var(--border); white-space: pre-wrap; }
  .status-list, .summary-list { display: grid; gap: 8px; }
  .confirmation-actions { display: flex; gap: 12px; margin-top: 20px; }
  .check-row { display: flex; align-items: center; gap: 10px; }
  .calibration-step > label { display: grid; max-width: 360px; gap: 6px; font-weight: 700; }
  .calibration-step input { padding: 10px; border: 1px solid #b8c1cc; }
  .group-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
  .group-grid section { border: 1px solid var(--border); }
  .group-grid h2 { margin: 0; padding: 10px; border-bottom: 1px solid var(--border); }
  .group-grid button { width: 33.333%; border-width: 0 1px 0 0; border-radius: 0; }
  .group-grid button.selected { color: var(--orange); border-color: var(--orange); }
  .progress-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; margin: 20px 0; padding: 18px 18px 18px 42px; border: 1px solid var(--border); }
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
    .identity-strip, .confirmation-actions, .group-nav { align-items: stretch; flex-direction: column; }
    .evidence-table { display: block; overflow-x: auto; }
  }
`, U = [
  ["setup", "Setup Device"],
  ["discover", "Discover"],
  ["topology", "Topology"],
  ["ct", "CT Configuration"],
  ["build", "Build & Install"],
  ["safety", "Safety"],
  ["voltage", "Voltage"],
  ["current", "Current"],
  ["restart", "Restart"],
  ["summary", "Summary"]
];
class te extends k {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stability = null, this.calibration = null, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.ctGroup = 0, this.group = 0, this.channel = 1, this.reference = 0, this.safetyAcknowledged = !1, this.drafts = /* @__PURE__ */ new Map(), this.error = "", this.announcement = "", this.unsubs = [];
  }
  static {
    this.styles = Yt;
  }
  static {
    this.properties = {
      hass: { attribute: !1 },
      panel: { attribute: !1 }
    };
  }
  connectedCallback() {
    super.connectedCallback(), this.ensureApi();
  }
  disconnectedCallback() {
    for (const t of this.unsubs.splice(0)) t();
    super.disconnectedCallback();
  }
  updated(t) {
    (t.has("hass") || t.has("panel")) && this.ensureApi(), this.error && this.shadowRoot?.querySelector("[role=alert]")?.focus();
  }
  async ensureApi() {
    if (!(this.api || !this.hass || !this.panel?.config.entry_id)) {
      this.api = new D(this.hass, this.panel.config.entry_id);
      try {
        this.setup = await this.api.setupStatus();
        const t = this.setup.installer_intent;
        t && (this.addonCount = t.addon_count, this.connection = t.connection_type), this.setup.devices.length && (this.selectedDeviceId = this.setup.devices[0]?.entry_id ?? null);
        const e = await this.api.subscribeSetup((i) => {
          this.setup = i, !this.selectedDeviceId && i.devices.length && (this.selectedDeviceId = i.devices[0]?.entry_id ?? null), this.requestUpdate();
        });
        this.unsubs.push(e);
      } catch (t) {
        this.fail(t, "Setup status could not be loaded.");
      }
      this.requestUpdate();
    }
  }
  showTopology(t) {
    this.topology = t, this.step = "topology", this.error = t.evidence.some((e) => e.addon_count !== t.addon_count) || t.ct_count !== 6 * t.board_count || t.group_count !== 2 * t.board_count ? "Topology mismatch" : "", this.requestUpdate();
  }
  showInventory(t) {
    this.inventory = t, this.drafts = new Map(t.channels.map((e) => [e.channel, {
      name: e.name,
      modelId: e.selected_model_id ?? "",
      multiplier: e.reporting_multiplier,
      expanded: e.selected_model_id === null && e.raw_gain_ct === 27518
    }])), this.step = "ct", this.error = "", this.requestUpdate();
  }
  showState(t) {
    this.step = t, this.error = "", this.requestUpdate();
  }
  showRecovery(t) {
    t === "calibration_outcome_indeterminate" ? (this.step = "current", this.calibration = {
      state: t,
      group_key: "",
      phase: null,
      changed_channels: [],
      iteration: 1,
      before_values: [],
      after_values: [],
      error_percent_values: [],
      retry_allowed: !1
    }) : (this.step = "restart", this.session ? this.session = { ...this.session, state: t } : this.error = "Restart verification failed; review rollback and recovery evidence."), this.requestUpdate();
  }
  async rescan() {
    if (!this.api) return;
    const t = this.api;
    await this.run(async () => {
      await t.setInstallerIntent(this.addonCount, this.connection);
      const e = await t.rescan();
      this.setup = e, e.devices.length ? (this.selectedDeviceId = e.devices[0]?.entry_id ?? null, this.step = "discover", this.announcement = "Compatible meter discovered.") : this.announcement = "No compatible meter found. Check the network and rescan.";
    }, "Rescan failed.");
  }
  async adopt() {
    !this.api || !this.selectedDeviceId || await this.run(async () => {
      await this.api?.adoptDevice(this.selectedDeviceId), this.announcement = "Meter adopted in Device Builder.";
    }, "Adoption is unavailable for this meter.");
  }
  async loadTopology() {
    !this.api || !this.selectedDeviceId || await this.run(async () => {
      const t = await this.api?.getTopology(this.selectedDeviceId);
      t && this.showTopology("topology" in t ? t.topology : t);
    }, "Topology evidence could not be loaded.");
  }
  async loadInventory() {
    !this.api || !this.selectedDeviceId || await this.run(async () => {
      const t = await this.api?.getCtInventory(this.selectedDeviceId);
      t && this.showInventory(t);
    }, "CT inventory could not be loaded.");
  }
  updateDraft(t, e) {
    const i = this.drafts.get(t);
    i && (this.drafts = new Map(this.drafts).set(t, { ...i, ...e }), this.requestUpdate());
  }
  selectCtGroup(t) {
    this.ctGroup = t, this.requestUpdate(), this.updateComplete.then(() => {
      this.shadowRoot?.querySelector(`[data-ct-group="${t}"] input`)?.focus();
    });
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    const t = zt(this.inventory, this.drafts);
    if (!t.length) return this.fail(new Error(), "Select at least one CT change before review.");
    await this.run(async () => {
      this.transaction = await this.api?.previewCtConfig(
        this.selectedDeviceId,
        this.inventory.plan_id,
        this.inventory.source_sha256,
        t
      ) ?? null, this.step = "build", await this.subscribeTransaction();
    }, "The configuration preview is stale. Reload the CT inventory and review again.");
  }
  async subscribeTransaction() {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const t = await this.api.subscribeConfigTransaction(
      this.selectedDeviceId,
      this.transaction.transaction_id,
      this.transaction.source_sha256,
      (e) => {
        this.transaction = e, this.requestUpdate();
      }
    );
    this.unsubs.push(t);
  }
  async transactionAction(t) {
    !this.api || !this.transaction || !this.selectedDeviceId || await this.run(async () => {
      const e = [this.selectedDeviceId, this.transaction.transaction_id, this.transaction.source_sha256];
      this.transaction = t === "apply" ? await this.api.applyCtConfig(...e) : t === "compile" ? await this.api.compileCtConfig(...e) : t === "install" ? await this.api.installCtConfig(...e) : await this.api.rollbackCtConfig(...e), this.announcement = `Configuration ${this.transaction.state}.`;
    }, "This confirmation is stale. Reload the CT inventory before making another change.");
  }
  async startSession() {
    !this.api || !this.selectedDeviceId || await this.run(async () => {
      this.session = await this.api.startSession(this.selectedDeviceId), this.step = "safety";
      const t = await this.api.subscribeSession(this.session.session_id, (e) => {
        this.session = e, this.requestUpdate();
      });
      this.unsubs.push(t);
    }, "Calibration session could not be started.");
  }
  async acknowledgeSafety() {
    !this.api || !this.session || await this.run(async () => {
      this.session = await this.api.acknowledgeSafety(this.session.session_id), this.step = "voltage";
    }, "Safety acknowledgement could not be accepted.");
  }
  async checkStability(t) {
    if (!this.api || !this.session) return;
    const e = t === "voltage" ? this.groupKey(this.group) : String(this.channel);
    await this.run(async () => {
      this.stability = await this.api.checkStability(this.session.session_id, t, e);
    }, "Stable samples could not be collected.");
  }
  async calibrate(t) {
    !this.api || !this.session || await this.run(async () => {
      this.calibration = t === "voltage" ? await this.api.calibrateVoltage(this.session.session_id, this.groupKey(this.group), this.reference, !0) : await this.api.calibrateCurrent(this.session.session_id, this.channel, this.reference, !0), this.announcement = `Calibration iteration ${this.calibration.iteration} finished with state ${this.calibration.state}.`;
    }, "Calibration did not complete. Reconnect and inspect before another attempt.");
  }
  groupKey(t) {
    const e = Math.floor(t / 2), i = t % 2 + 1;
    return e === 0 ? `meter_main${i}` : `addon${e}_${i}`;
  }
  async restart() {
    !this.api || !this.session || await this.run(async () => {
      await this.api.restartAndVerify(this.session.session_id), this.session = { ...this.session, state: "verified" }, this.step = "summary";
    }, "Restart verification failed; review recovery evidence before rollback.");
  }
  async cancelSession() {
    !this.api || !this.session || await this.run(async () => {
      this.session = await this.api.cancelSession(this.session.session_id), this.step = "summary";
    }, "The session cleanup could not be confirmed.");
  }
  async run(t, e) {
    this.error = "";
    try {
      await t();
    } catch (i) {
      const s = i.code;
      this.fail(i, s === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : e);
    }
    this.requestUpdate();
  }
  fail(t, e) {
    this.error = e, this.announcement = e, this.requestUpdate();
  }
  stepBody() {
    return this.step === "setup" ? Kt(
      this.setup,
      this.addonCount,
      this.connection,
      (t) => {
        this.addonCount = t, this.requestUpdate();
      },
      (t) => {
        this.connection = t, this.requestUpdate();
      },
      () => {
        this.rescan();
      }
    ) : this.step === "discover" ? Ot(
      this.setup?.devices ?? [],
      this.selectedDeviceId,
      (t) => {
        this.selectedDeviceId = t, this.requestUpdate();
      },
      () => {
        this.adopt();
      },
      () => {
        this.loadTopology();
      }
    ) : this.step === "topology" && this.topology ? Xt(this.topology, () => {
      this.loadInventory();
    }) : this.step === "ct" && this.inventory ? jt(
      this.inventory,
      this.board,
      this.ctGroup,
      this.drafts,
      (t) => {
        this.board = t, this.ctGroup = 0, this.requestUpdate();
      },
      (t) => this.selectCtGroup(t),
      (t, e) => this.updateDraft(t, e),
      () => {
        this.reviewChanges();
      }
    ) : this.step === "build" ? qt(
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
      () => {
        this.startSession();
      }
    ) : this.step === "safety" ? Gt(
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
      }
    ) : this.step === "voltage" ? d`${Qt(
      this.topology,
      this.group,
      this.reference,
      this.stability,
      (t) => {
        this.group = t, this.stability = null, this.requestUpdate();
      },
      (t) => {
        this.reference = t, this.requestUpdate();
      },
      () => {
        this.checkStability("voltage");
      },
      () => {
        this.calibrate("voltage");
      }
    )}
      <footer class="action-footer"><button class="secondary">Back</button><button class="primary" @click=${() => this.showState("current")}>Continue</button></footer>` : this.step === "current" ? d`${Vt(
      this.topology,
      this.inventory,
      this.channel,
      this.reference,
      this.stability,
      this.calibration,
      (t) => {
        this.channel = t, this.stability = null, this.requestUpdate();
      },
      (t) => {
        this.reference = t, this.requestUpdate();
      },
      () => {
        this.checkStability("current");
      },
      () => {
        this.calibrate("current");
      },
      () => {
        this.api?.getSession(this.session?.session_id ?? "");
      }
    )}
      <footer class="action-footer"><button class="secondary">Back</button><button class="primary" @click=${() => this.showState("restart")}>Continue</button></footer>` : this.step === "restart" ? Lt(this.session?.state ?? this.error, () => {
      this.restart();
    }, () => {
      this.transactionAction("rollback");
    }) : Zt(this.topology, this.session, this.transaction, this.stability);
  }
  render() {
    const t = U.findIndex(([e]) => e === this.step);
    return d`
      <div class="app">
        <aside class="workflow">
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${U.map(([e, i], s) => d`
            <li class=${s === t ? "current" : ""}>
              <button class="step-button" aria-current=${s === t ? "step" : b} ?disabled=${s > t}
                @click=${() => s <= t && this.showState(e)}><span class="number">${s + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${t + 1} of 10 — ${U[t]?.[1]}</span><button aria-label="Show setup steps">Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${U[t]?.[1]}</h1>
          ${this.error ? d`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : b}
          ${this.stepBody()}
          ${t >= 4 && this.step !== "summary" ? pt(this.topology, this.session, this.transaction, this.stability) : b}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", te);
export {
  te as CircuitSetupPanel
};
