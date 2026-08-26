const we = globalThis, Fe = we.ShadowRoot && (we.ShadyCSS === void 0 || we.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ze = /* @__PURE__ */ Symbol(), Je = /* @__PURE__ */ new WeakMap();
let kt = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== ze) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Fe && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = Je.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Je.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Qt = (n) => new kt(typeof n == "string" ? n : n + "", void 0, ze), ei = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, s, r) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[r + 1], n[0]);
  return new kt(t, n, ze);
}, ti = (n, e) => {
  if (Fe) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = we.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, n.appendChild(i);
  }
}, Qe = Fe ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return Qt(t);
})(n) : n;
const { is: ii, defineProperty: si, getOwnPropertyDescriptor: ni, getOwnPropertyNames: ri, getOwnPropertySymbols: oi, getPrototypeOf: ai } = Object, Ce = globalThis, et = Ce.trustedTypes, ci = et ? et.emptyScript : "", li = Ce.reactiveElementPolyfillSupport, de = (n, e) => n, Ue = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? ci : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, e) {
  let t = n;
  switch (e) {
    case Boolean:
      t = n !== null;
      break;
    case Number:
      t = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(n);
      } catch {
        t = null;
      }
  }
  return t;
} }, Ct = (n, e) => !ii(n, e), tt = { attribute: !0, type: String, converter: Ue, reflect: !1, useDefault: !1, hasChanged: Ct };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), Ce.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let re = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = tt) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && si(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: r } = ni(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: s, set(o) {
      const a = s?.call(this);
      r?.call(this, o), this.requestUpdate(e, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? tt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(de("elementProperties"))) return;
    const e = ai(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(de("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(de("properties"))) {
      const t = this.properties, i = [...ri(t), ...oi(t)];
      for (const s of i) this.createProperty(s, t[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, s] of t) this.elementProperties.set(i, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const s = this._$Eu(t, i);
      s !== void 0 && this._$Eh.set(s, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const s of i) t.unshift(Qe(s));
    } else e !== void 0 && t.push(Qe(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ti(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    const i = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, i);
    if (s !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : Ue).toAttribute(t, i.type);
      this._$Em = e, r == null ? this.removeAttribute(s) : this.setAttribute(s, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const r = i.getPropertyOptions(s), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : Ue;
      this._$Em = s;
      const a = o.fromAttribute(t, r.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, r) {
    if (e !== void 0) {
      const o = this.constructor;
      if (s === !1 && (r = this[e]), i ??= o.getPropertyOptions(e), !((i.hasChanged ?? Ct)(r, t) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: r }, o) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), r !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
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
        const { wrapped: o } = r, a = this[s];
        o !== !0 || this._$AL.has(s) || a === void 0 || this.C(s, void 0, r, a);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
re.elementStyles = [], re.shadowRootOptions = { mode: "open" }, re[de("elementProperties")] = /* @__PURE__ */ new Map(), re[de("finalized")] = /* @__PURE__ */ new Map(), li?.({ ReactiveElement: re }), (Ce.reactiveElementVersions ??= []).push("2.1.2");
const He = globalThis, it = (n) => n, $e = He.trustedTypes, st = $e ? $e.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, At = "$lit$", K = `lit$${Math.random().toFixed(9).slice(2)}$`, Et = "?" + K, di = `<${Et}>`, te = document, ue = () => te.createComment(""), fe = (n) => n === null || typeof n != "object" && typeof n != "function", Le = Array.isArray, hi = (n) => Le(n) || typeof n?.[Symbol.iterator] == "function", Oe = `[\x20\t
\f\r]`, ce = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, nt = /-->/g, rt = />/g, X = RegExp(`>|${Oe}(?:([^\\s"'>=/]+)(${Oe}*=${Oe}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), ot = /'/g, at = /"/g, xt = /^(?:script|style|textarea|title)$/i, pi = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), h = pi(1), Y = /* @__PURE__ */ Symbol.for("lit-noChange"), R = /* @__PURE__ */ Symbol.for("lit-nothing"), ct = /* @__PURE__ */ new WeakMap(), Q = te.createTreeWalker(te, 129);
function It(n, e) {
  if (!Le(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return st !== void 0 ? st.createHTML(e) : e;
}
const ui = (n, e) => {
  const t = n.length - 1, i = [];
  let s, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = ce;
  for (let a = 0; a < t; a++) {
    const c = n[a];
    let l, f, p = -1, _ = 0;
    for (; _ < c.length && (o.lastIndex = _, f = o.exec(c), f !== null); ) _ = o.lastIndex, o === ce ? f[1] === "!--" ? o = nt : f[1] !== void 0 ? o = rt : f[2] !== void 0 ? (xt.test(f[2]) && (s = RegExp("</" + f[2], "g")), o = X) : f[3] !== void 0 && (o = X) : o === X ? f[0] === ">" ? (o = s ?? ce, p = -1) : f[1] === void 0 ? p = -2 : (p = o.lastIndex - f[2].length, l = f[1], o = f[3] === void 0 ? X : f[3] === '"' ? at : ot) : o === at || o === ot ? o = X : o === nt || o === rt ? o = ce : (o = X, s = void 0);
    const y = o === X && n[a + 1].startsWith("/>") ? " " : "";
    r += o === ce ? c + di : p >= 0 ? (i.push(l), c.slice(0, p) + At + c.slice(p) + K + y) : c + K + (p === -2 ? a : y);
  }
  return [It(n, r + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class ge {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let r = 0, o = 0;
    const a = e.length - 1, c = this.parts, [l, f] = ui(e, t);
    if (this.el = ge.createElement(l, i), Q.currentNode = this.el.content, t === 2 || t === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (s = Q.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const p of s.getAttributeNames()) if (p.endsWith(At)) {
          const _ = f[o++], y = s.getAttribute(p).split(K), d = /([.?@])?(.*)/.exec(_);
          c.push({ type: 1, index: r, name: d[2], strings: y, ctor: d[1] === "." ? gi : d[1] === "?" ? _i : d[1] === "@" ? vi : Ae }), s.removeAttribute(p);
        } else p.startsWith(K) && (c.push({ type: 6, index: r }), s.removeAttribute(p));
        if (xt.test(s.tagName)) {
          const p = s.textContent.split(K), _ = p.length - 1;
          if (_ > 0) {
            s.textContent = $e ? $e.emptyScript : "";
            for (let y = 0; y < _; y++) s.append(p[y], ue()), Q.nextNode(), c.push({ type: 2, index: ++r });
            s.append(p[_], ue());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Et) c.push({ type: 2, index: r });
      else {
        let p = -1;
        for (; (p = s.data.indexOf(K, p + 1)) !== -1; ) c.push({ type: 7, index: r }), p += K.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const i = te.createElement("template");
    return i.innerHTML = e, i;
  }
}
function ae(n, e, t = n, i) {
  if (e === Y) return e;
  let s = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const r = fe(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== r && (s?._$AO?.(!1), r === void 0 ? s = void 0 : (s = new r(n), s._$AT(n, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = s : t._$Cl = s), s !== void 0 && (e = ae(n, s._$AS(n, e.values), s, i)), e;
}
class fi {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, s = (e?.creationScope ?? te).importNode(t, !0);
    Q.currentNode = s;
    let r = Q.nextNode(), o = 0, a = 0, c = i[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let l;
        c.type === 2 ? l = new _e(r, r.nextSibling, this, e) : c.type === 1 ? l = new c.ctor(r, c.name, c.strings, this, e) : c.type === 6 && (l = new mi(r, this, e)), this._$AV.push(l), c = i[++a];
      }
      o !== c?.index && (r = Q.nextNode(), o++);
    }
    return Q.currentNode = te, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class _e {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = R, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = ae(this, e, t), fe(e) ? e === R || e == null || e === "" ? (this._$AH !== R && this._$AR(), this._$AH = R) : e !== this._$AH && e !== Y && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : hi(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== R && fe(this._$AH) ? this._$AA.nextSibling.data = e : this.T(te.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = ge.createElement(It(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const r = new fi(s, this), o = r.u(this.options);
      r.p(t), this.T(o), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = ct.get(e.strings);
    return t === void 0 && ct.set(e.strings, t = new ge(e)), t;
  }
  k(e) {
    Le(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const r of e) s === t.length ? t.push(i = new _e(this.O(ue()), this.O(ue()), this, this.options)) : i = t[s], i._$AI(r), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = it(e).nextSibling;
      it(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class Ae {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, r) {
    this.type = 1, this._$AH = R, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = R;
  }
  _$AI(e, t = this, i, s) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) e = ae(this, e, t, 0), o = !fe(e) || e !== this._$AH && e !== Y, o && (this._$AH = e);
    else {
      const a = e;
      let c, l;
      for (e = r[0], c = 0; c < r.length - 1; c++) l = ae(this, a[i + c], t, c), l === Y && (l = this._$AH[c]), o ||= !fe(l) || l !== this._$AH[c], l === R ? e = R : e !== R && (e += (l ?? "") + r[c + 1]), this._$AH[c] = l;
    }
    o && !s && this.j(e);
  }
  j(e) {
    e === R ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class gi extends Ae {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === R ? void 0 : e;
  }
}
class _i extends Ae {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== R);
  }
}
class vi extends Ae {
  constructor(e, t, i, s, r) {
    super(e, t, i, s, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = ae(this, e, t, 0) ?? R) === Y) return;
    const i = this._$AH, s = e === R && i !== R || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== R && (i === R || s);
    s && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class mi {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    ae(this, e);
  }
}
const bi = He.litHtmlPolyfillSupport;
bi?.(ge, _e), (He.litHtmlVersions ??= []).push("3.3.3");
const wi = (n, e, t) => {
  const i = t?.renderBefore ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const r = t?.renderBefore ?? null;
    i._$litPart$ = s = new _e(e.insertBefore(ue(), r), r, void 0, t ?? {});
  }
  return s._$AI(n), s;
};
const je = globalThis;
let he = class extends re {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = wi(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return Y;
  }
};
he._$litElement$ = !0, he.finalized = !0, je.litElementHydrateSupport?.({ LitElement: he });
const $i = je.litElementPolyfillSupport;
$i?.({ LitElement: he });
(je.litElementVersions ??= []).push("4.2.2");
const lt = "circuitsetup_energy_meter_helper/", yi = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, Si = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, ki = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, Ci = /[\u0000-\u001f\u007f-\u009f]/, Ai = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), Ei = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), xi = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "partial", "indeterminate", "verified", "cancelled"]), Ve = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), Rt = /* @__PURE__ */ new Set(["split_phase_120_240", "single_phase_230", "three_phase", "custom"]), dt = /* @__PURE__ */ new Set(["standard", "multi_reference", "custom"]), ht = /* @__PURE__ */ new Set(["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"]), Ii = /* @__PURE__ */ new Set(["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"]), Ri = /* @__PURE__ */ new Set(["none", "consumption", "bidirectional", "generation"]), Ti = /* @__PURE__ */ new Set([1, 2, 5, 10, 30, 60]), pt = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), ye = /* @__PURE__ */ new Set(["A", "B", "C"]), Oi = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), Mi = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), Ui = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), qi = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), Pi = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), Di = /^(?:meter|voltage_reference|channel|aggregate|package)\.[a-z0-9_.-]+$/, Ni = /^[0-9a-f]{12}$/, Ee = /^[0-9a-f]{64}$/, qe = /^[0-9a-f]{32}$/, Bi = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, Tt = /^[a-z0-9][a-z0-9_-]{0,127}$/, Ot = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, ut = /* @__PURE__ */ new Set(["preview_ct_config", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]), Fi = /* @__PURE__ */ new Set(["available", "unavailable", "invalid"]), zi = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial"]), Hi = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial", "indeterminate"]), Li = /* @__PURE__ */ new Set(["applied_pending_restart_verification", "partial", "indeterminate"]);
function C(n, e) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function A(n, e, t = 100) {
  if (!Array.isArray(n) || n.length > t) throw new Error(`${e} response is invalid`);
  return n;
}
function b(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${e} response is invalid`);
  return n;
}
function L(n, e) {
  const t = b(n, e);
  if (t.length > 128) throw new Error(`${e} response is invalid`);
  return t;
}
function q(n, e) {
  if (typeof n != "number" || !Number.isFinite(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function E(n, e) {
  const t = q(n, e);
  if (!Number.isInteger(t)) throw new Error(`${e} response is invalid`);
  return t;
}
function D(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "boolean") throw new Error(`${e} response is invalid`);
  return n;
}
function N(n, e, t) {
  const i = b(n, t);
  if (!e.has(i)) throw new Error(`${t} response is invalid`);
  return i;
}
function Pe(n, e) {
  n !== void 0 && b(n, e, !0);
}
function V(n, e) {
  return Math.abs(n - e) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(e));
}
function P(n, e, t) {
  const i = Object.keys(n);
  if (i.length !== e.length || i.some((s) => !e.includes(s))) throw new Error(`${t} response is invalid`);
}
function ee(n, e) {
  return n.length === e.length && n.every((t, i) => t === e[i]);
}
function Mt(n, e) {
  const t = C(n, e);
  b(t.entry_id, e), b(t.title, e), b(t.project_name, e), b(t.project_version, e, !0), D(t.importable, e, !0), b(t.configuration, e, !0);
}
function be(n, e) {
  const t = C(n, e);
  if (N(t.state, Ai, e), A(t.devices, e).forEach((i) => Mt(i, e)), t.configuration_authoritative !== void 0 && D(t.configuration_authoritative, e), t.bound_device_id !== void 0 && t.bound_device_id !== null && b(t.bound_device_id, e), t.installer_intent !== void 0) {
    const i = C(t.installer_intent, e), s = E(i.addon_count, e);
    if (s < 0 || s > 6) throw new Error(`${e} response is invalid`);
    if (N(i.connection_type, Ve, e) === "unknown") throw new Error(`${e} response is invalid`);
    if (i.power_quality === void 0 != (i.status_fields === void 0))
      throw new Error(`${e} response is invalid`);
    i.power_quality !== void 0 && Ut(i, e, s + 1);
    const o = i.firmware_product_id, a = i.esphome_version;
    if (o === void 0 != (a === void 0) || o !== void 0 && (typeof o != "string" || o.length > 160 || !Tt.test(o)) || a !== void 0 && (typeof a != "string" || a.length > 160 || !Ot.test(a)))
      throw new Error(`${e} response is invalid`);
    if (i.electrical_system === void 0 != (i.line_frequency_hz === void 0) || i.electrical_system !== void 0 && (!Rt.has(i.electrical_system) || ![50, 60].includes(E(i.line_frequency_hz, e))))
      throw new Error(`${e} response is invalid`);
  }
  return n;
}
function De(n, e) {
  const t = C(n, e);
  P(t, ["addon_count", "board_count", "ct_count", "group_count", "connection_type", "voltage_layout", "project_name", "evidence"], e);
  const i = E(t.addon_count, e), s = E(t.board_count, e), r = E(t.ct_count, e), o = E(t.group_count, e);
  if (i < 0 || i > 6 || s < 1 || s > 7 || r < 6 || r > 42 || o < 2 || o > 14 || s !== i + 1 || r !== 6 * s || o !== 2 * s) throw new Error(`${e} response is invalid`);
  N(t.connection_type, Ve, e), b(t.voltage_layout, e), b(t.project_name, e);
  const a = A(t.evidence, e);
  if (a.length < 1 || a.length > pt.size) throw new Error(`${e} response is invalid`);
  const c = a.map((l) => {
    const f = C(l, e);
    P(f, ["source", "addon_count", "detail"], e);
    const p = N(f.source, pt, e), _ = E(f.addon_count, e);
    if (_ < 0 || _ > 6) throw new Error(`${e} response is invalid`);
    return b(f.detail, e), p;
  });
  if (new Set(c).size !== c.length || !c.some((l) => Pi.has(l))) throw new Error(`${e} response is invalid`);
  return n;
}
function ji(n, e) {
  const t = C(n, e);
  if ("topology" in t) {
    const i = De(t.topology, e);
    return t.configuration_authoritative !== void 0 && D(t.configuration_authoritative, e), t.package_options !== void 0 && Ut(t.package_options, e, i.board_count), n;
  }
  return De(n, e);
}
function Vi(n, e) {
  const t = C(n, e);
  P(t, ["plan_id", "source_sha256", "topology", "configuration", "capabilities", "voltage_topology", "voltage_transformer_catalog", "ct_catalog", "warnings", "channels", "catalog"], e);
  const i = b(t.plan_id, e);
  if (!qe.test(i) || !Ee.test(b(t.source_sha256, e))) throw new Error(`${e} response is invalid`);
  const s = De(t.topology, e), r = C(t.configuration, e);
  P(r, ["meter", "channels", "aggregates", "power_quality", "status_fields", "multi_reference_preparation_acknowledged"], e);
  const o = C(r.meter, e);
  P(o, ["friendly_name", "electrical_system", "line_frequency_hz", "update_interval_s", "voltage_layout", "voltage_references"], e), b(o.friendly_name, e), N(o.electrical_system, Rt, e);
  const a = E(o.line_frequency_hz, e);
  if (a !== 50 && a !== 60) throw new Error(`${e} response is invalid`);
  const c = E(o.update_interval_s, e);
  if (!Ti.has(c) || !dt.has(N(o.voltage_layout, dt, e))) throw new Error(`${e} response is invalid`);
  const l = A(o.voltage_references, e, 8).map(($) => {
    const w = C($, e);
    P(w, ["reference_id", "label", "phase_label", "nominal_voltage_v", "transformer_model_id", "gain_voltage", "group_keys"], e);
    const O = L(w.reference_id, e), S = b(w.label, e);
    b(w.phase_label, e);
    const M = q(w.nominal_voltage_v, e);
    if (M < 1 || M > 600) throw new Error(`${e} response is invalid`);
    L(w.transformer_model_id, e);
    const I = E(w.gain_voltage, e);
    if (I < 1 || I > 65535) throw new Error(`${e} response is invalid`);
    const B = A(w.group_keys, e, 14).map((F) => L(F, e));
    if (!B.length) throw new Error(`${e} response is invalid`);
    return { reference_id: O, label: S, group_keys: B };
  });
  if (!l.length || new Set(l.map(($) => $.reference_id)).size !== l.length)
    throw new Error(`${e} response is invalid`);
  const f = Array.from({ length: s.board_count }, ($, w) => w === 0 ? ["main_1", "main_2"] : [`addon${w}_1`, `addon${w}_2`]).flat(), p = l.flatMap(($) => $.group_keys);
  if (p.length !== s.group_count || new Set(p).size !== p.length || !ee([...p].sort(), [...f].sort())) throw new Error(`${e} response is invalid`);
  const _ = A(r.channels, e, 42);
  if (_.length !== s.ct_count) throw new Error(`${e} response is invalid`);
  _.forEach(($, w) => {
    const O = C($, e);
    if (P(O, ["channel", "enabled", "name", "model_id", "reporting_multiplier", "role", "voltage_reference_id", "custom_gain_ct", "custom_label", "burden_output_acknowledged"], e), E(O.channel, e) !== w + 1 || ![1, 2, 4, 8].includes(q(O.reporting_multiplier, e)) || !l.some((I) => I.reference_id === L(O.voltage_reference_id, e))) throw new Error(`${e} response is invalid`);
    const S = D(O.enabled, e);
    b(O.name, e), L(O.model_id, e);
    const M = N(O.role, ht, e);
    if (S && M === "unused" || !S && M !== "unused") throw new Error(`${e} response is invalid`);
    if (O.custom_gain_ct !== null && (E(O.custom_gain_ct, e) < 1 || E(O.custom_gain_ct, e) > 65535)) throw new Error(`${e} response is invalid`);
    O.custom_label !== null && b(O.custom_label, e), D(O.burden_output_acknowledged, e);
  });
  const y = /* @__PURE__ */ new Set(), d = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Map();
  A(r.aggregates, e, 32).forEach(($) => {
    const w = C($, e);
    P(w, ["aggregate_id", "name", "role", "channels", "measurement_method", "parent_id", "energy_mode", "expose_power", "expose_current"], e);
    const O = L(w.aggregate_id, e);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(O) || y.has(O)) throw new Error(`${e} response is invalid`);
    y.add(O), b(w.name, e), N(w.role, ht, e);
    const S = A(w.channels, e, 42).map((F) => E(F, e)), M = N(w.measurement_method, Ii, e), I = M === "two_ct_sum" ? 2 : M === "one_ct_double_power" || M === "both_conductors_one_ct" ? 1 : void 0;
    if (!S.length || new Set(S).size !== S.length || S.some((F) => F < 1 || F > s.ct_count || d.has(F) || !D(C(_[F - 1], e).enabled, e)) || I !== void 0 && S.length !== I) throw new Error(`${e} response is invalid`);
    S.forEach((F) => d.add(F));
    const B = w.parent_id === null ? null : L(w.parent_id, e);
    u.set(O, B), N(w.energy_mode, Ri, e), D(w.expose_power, e), D(w.expose_current, e);
  });
  for (const [$, w] of u) {
    const O = /* @__PURE__ */ new Set();
    for (let S = w; S !== null; S = u.get(S) ?? null) {
      if (!y.has(S) || S === $ || O.has(S)) throw new Error(`${e} response is invalid`);
      O.add(S);
    }
  }
  for (const $ of ["power_quality", "status_fields"]) {
    const w = A(r[$], e, 7);
    if (w.length !== s.board_count) throw new Error(`${e} response is invalid`);
    w.forEach((O) => D(O, e));
  }
  D(r.multi_reference_preparation_acknowledged, e);
  const g = C(t.capabilities, e);
  P(g, ["configuration_authoritative", "managed_totals", "multi_reference", "reason_codes"], e), D(g.configuration_authoritative, e), D(g.managed_totals, e), D(g.multi_reference, e), A(g.reason_codes, e, 8).forEach(($) => b($, e));
  const k = C(t.voltage_topology, e);
  P(k, ["references", "source"], e), N(k.source, /* @__PURE__ */ new Set(["helper", "legacy"]), e);
  const x = A(k.references, e, 8).map(($) => {
    const w = A($, e, 2);
    if (w.length !== 2) throw new Error(`${e} response is invalid`);
    const O = L(w[0], e), S = A(w[1], e, 14).map((M) => L(M, e));
    if (!S.length) throw new Error(`${e} response is invalid`);
    return [O, S];
  });
  if (x.length !== l.length || !ee(x.map(([$]) => $), l.map(($) => $.reference_id)) || !x.every(([$, w], O) => ee(w, l[O].group_keys))) throw new Error(`${e} response is invalid`);
  const v = C(t.voltage_transformer_catalog, e);
  if (P(v, ["presets", "source_repository", "source_ref", "schema_version"], e), b(v.source_repository, e), !/^[0-9a-f]{40}$/.test(b(v.source_ref, e)) || E(v.schema_version, e) !== 1) throw new Error(`${e} response is invalid`);
  const m = A(v.presets, e, 64);
  if (!m.length) throw new Error(`${e} response is invalid`);
  const U = /* @__PURE__ */ new Set();
  m.forEach(($) => {
    const w = C($, e);
    P(w, ["model_id", "label", "primary_nominal_v", "secondary_nominal_v", "default_gain_voltage", "notes"], e);
    const O = L(w.model_id, e);
    if (U.has(O)) throw new Error(`${e} response is invalid`);
    if (U.add(O), b(w.label, e), q(w.primary_nominal_v, e) <= 0 || q(w.secondary_nominal_v, e) <= 0) throw new Error(`${e} response is invalid`);
    const S = E(w.default_gain_voltage, e);
    if (S < 1 || S > 65535) throw new Error(`${e} response is invalid`);
    b(w.notes, e);
  }), Ne({ plan_id: t.plan_id, source_sha256: t.source_sha256, channels: t.channels, catalog: t.catalog }, e);
  const T = C(t.ct_catalog, e);
  return P(T, ["presets", "source_repository", "source_ref", "schema_version"], e), Ne({ plan_id: t.plan_id, source_sha256: t.source_sha256, channels: t.channels, catalog: t.ct_catalog }, e), A(t.warnings, e, 32).map(($) => b($, e)), n;
}
function Ut(n, e, t) {
  const i = C(n, e);
  for (const s of ["power_quality", "status_fields"]) {
    const r = A(i[s], e, 7);
    if (r.length !== t) throw new Error(`${e} response is invalid`);
    r.forEach((o) => D(o, e));
  }
  return n;
}
function Ne(n, e) {
  const t = C(n, e);
  if (P(t, ["plan_id", "source_sha256", "channels", "catalog"], e), b(t.plan_id, e), !Ee.test(b(t.source_sha256, e))) throw new Error(`${e} response is invalid`);
  const i = A(t.channels, e);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${e} response is invalid`);
  i.forEach((o, a) => {
    const c = C(o, e);
    P(c, ["channel", "name", "raw_gain_ct", "reporting_multiplier", "selected_model_id", "selection_verified_against_config", "address", "display_label", "stored_selection_present"], e);
    const l = E(c.channel, e);
    b(c.name, e), E(c.raw_gain_ct, e), q(c.reporting_multiplier, e), Pe(c.selected_model_id, e), D(c.selection_verified_against_config, e), Pe(c.display_label, e), D(c.stored_selection_present, e);
    const f = C(c.address, e);
    P(f, ["channel", "board_index", "group_index", "phase"], e);
    const p = E(f.channel, e), _ = E(f.board_index, e), y = E(f.group_index, e), d = N(f.phase, ye, e), u = a + 1;
    if (l !== u || p !== u || _ !== Math.floor(a / 6) || y !== Math.floor(a % 6 / 3) || d !== ["A", "B", "C"][a % 3]) throw new Error(`${e} response is invalid`);
  });
  const s = C(t.catalog, e);
  P(s, ["presets", "source_repository", "source_ref", "schema_version"], e), b(s.source_repository, e), b(s.source_ref, e), E(s.schema_version, e);
  const r = A(s.presets, e);
  if (r.length > 64) throw new Error(`${e} response is invalid`);
  return r.forEach((o) => {
    const a = C(o, e);
    P(a, ["model_id", "label", "rated_current_a", "secondary", "default_gain_ct", "requires_burden_jumper_cut", "notes"], e), b(a.model_id, e), b(a.label, e), q(a.rated_current_a, e), b(a.secondary, e), a.default_gain_ct !== null && E(a.default_gain_ct, e), D(a.requires_burden_jumper_cut, e), b(a.notes, e);
  }), n;
}
function oe(n, e) {
  const t = C(n, e);
  if (P(t, ["transaction_id", "state", "source_sha256", "changes", "redacted_diff", "rollback_available", "evidence", "progress", "validation_detail", "upload_progress", "aggregate_entity_mismatch", "full_meter_configuration_verified"], e), b(t.transaction_id, e), N(t.state, Ei, e), !Ee.test(b(t.source_sha256, e))) throw new Error(`${e} response is invalid`);
  if (D(t.rollback_available, e), typeof t.redacted_diff != "string") throw new Error(`${e} response is invalid`);
  if (A(t.changes, e).forEach((i) => {
    const s = C(i, e);
    P(s, ["key", "old_value", "new_value"], e);
    const r = b(s.key, e);
    if (!Di.test(r)) throw new Error(`${e} response is invalid`);
    s.old_value !== null && b(s.old_value, e), b(s.new_value, e);
  }), A(t.evidence, e).forEach((i) => N(i, Mi, e)), A(t.progress, e).forEach((i) => N(i, Ui, e)), t.validation_detail !== null) {
    const i = C(t.validation_detail, e);
    P(i, ["code", "reported_error_count", "reported_warning_count", "error_record_count", "warning_record_count"], e);
    for (const s of ["reported_error_count", "reported_warning_count"]) i[s] !== null && E(i[s], e);
    i.code !== null && E(i.code, e), E(i.error_record_count, e), E(i.warning_record_count, e);
  }
  return A(t.upload_progress, e).forEach((i) => {
    const s = C(i, e);
    if (P(s, ["stage", "percentage"], e), N(s.stage, Oi, e), s.percentage !== null) {
      const r = E(s.percentage, e);
      if (r < 0 || r > 100) throw new Error(`${e} response is invalid`);
    }
  }), D(t.aggregate_entity_mismatch, e), D(t.full_meter_configuration_verified, e), n;
}
function G(n, e) {
  const t = C(n, e);
  b(t.session_id, e), b(t.device_id, e), N(t.state, xi, e), D(t.safety_acknowledged, e);
  const i = C(t.preflight, e);
  A(i.issues, e).forEach((p) => {
    const _ = C(p, e);
    N(_.code, qi, e), b(_.role, e), b(_.detail, e);
  }), A(i.zeroed_roles, e).forEach((p) => b(p, e)), t.entity_role_counts !== void 0 && Object.values(C(t.entity_role_counts, e)).forEach((p) => {
    if (E(p, e) < 0) throw new Error(`${e} response is invalid`);
  }), t.calibration_sources !== void 0 && Object.values(C(t.calibration_sources, e)).forEach((p) => N(p, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), e));
  const s = [t.offset_capability, t.offset_disposition, t.offset_boards, t.has_pending_calibration];
  if (s.every((p) => p === void 0)) return n;
  if (s.some((p) => p === void 0)) throw new Error(`${e} response is invalid`);
  const r = C(t.offset_capability, e);
  if (P(r, ["status", "repair_reason"], e), N(r.status, Fi, e) === "invalid") b(r.repair_reason, e);
  else if (r.repair_reason !== null) throw new Error(`${e} response is invalid`);
  const a = N(t.offset_disposition, zi, e), c = A(t.offset_boards, e, 7);
  if (c.length < 1) throw new Error(`${e} response is invalid`);
  const l = [];
  c.forEach((p, _) => {
    const y = C(p, e);
    if (P(y, ["board_index", "stages"], e), E(y.board_index, e) !== _) throw new Error(`${e} response is invalid`);
    const d = A(y.stages, e, 2);
    if (d.length !== 2) throw new Error(`${e} response is invalid`);
    d.forEach((u, g) => {
      const k = C(u, e);
      if (P(k, ["stage", "state"], e), E(k.stage, e) !== g + 1) throw new Error(`${e} response is invalid`);
      l.push(N(k.state, Hi, e));
    });
  });
  const f = l.every((p) => p === "skipped") ? "skipped" : l.every((p) => p === "completed") ? "completed" : l.every((p) => p === "not_started") ? "not_started" : l.some((p) => p === "partial" || p === "indeterminate") || l.some((p) => p === "skipped") ? "partial" : "in_progress";
  if (a !== f) throw new Error(`${e} response is invalid`);
  return D(t.has_pending_calibration, e), n;
}
function Gi(n, e, t, i) {
  const s = C(n, e);
  if (P(s, ["stage", "ready", "connection_generation", "entities", "reasons", "thresholds"], e), E(s.stage, e) !== i || t < 0 || t > 6) throw new Error(`${e} response is invalid`);
  const r = D(s.ready, e), o = E(s.connection_generation, e);
  if (o < 1) throw new Error(`${e} response is invalid`);
  const a = C(s.thresholds, e);
  P(a, ["sample_count", "zero_voltage_peak_volts", "zero_voltage_spread_volts", "zero_current_peak_amps", "zero_current_spread_amps", "voltage_present_minimum_volts", "voltage_present_spread_volts"], e);
  const c = E(a.sample_count, e), l = q(a.zero_voltage_peak_volts, e), f = q(a.zero_voltage_spread_volts, e), p = q(a.zero_current_peak_amps, e), _ = q(a.zero_current_spread_amps, e), y = q(a.voltage_present_minimum_volts, e), d = q(a.voltage_present_spread_volts, e), u = [
    l,
    f,
    p,
    _,
    y,
    d
  ];
  if (c < 3 || c > 100 || u.some((M) => M < 0) || u[4] === 0) throw new Error(`${e} response is invalid`);
  const g = A(s.entities, e, 12);
  if (g.length !== 12) throw new Error(`${e} response is invalid`);
  const k = /* @__PURE__ */ new Map();
  for (const M of [0, 1]) {
    const I = t === 0 ? `main_${M + 1}` : `addon${t}_${M + 1}`;
    for (const B of ["a", "b", "c"]) k.set(`${I}.voltage_${B}`, "voltage");
    for (let B = 1; B <= 3; ++B) k.set(`ct${t * 6 + M * 3 + B}.current_sensor`, "current");
  }
  const x = "entity binding is not on the active connection generation", v = "fresh window unavailable: ", m = /* @__PURE__ */ new Set(), U = [];
  let T = 0;
  g.forEach((M) => {
    const I = C(M, e);
    P(I, ["role", "quantity", "ready", "reasons", "window"], e);
    const B = b(I.role, e), F = N(I.quantity, /* @__PURE__ */ new Set(["voltage", "current"]), e);
    if (m.has(B) || k.get(B) !== F) throw new Error(`${e} response is invalid`);
    m.add(B);
    const Ze = D(I.ready, e), ie = A(I.reasons, e, 12).map((z) => b(z, e));
    let H;
    if (I.window === null) {
      if (Ze || ie.length !== 1) throw new Error(`${e} response is invalid`);
      if (ie[0] === x) ++T;
      else if (!ie[0].startsWith(v) || ie[0].slice(v.length).trim().length === 0)
        throw new Error(`${e} response is invalid`);
      H = ie;
    } else {
      const z = C(I.window, e);
      P(z, ["values", "received_at", "connection_generation", "mean", "minimum", "maximum", "absolute_peak", "absolute_spread"], e);
      const se = A(z.values, e, c).map((Z) => q(Z, e)), Ie = A(z.received_at, e, c).map((Z) => q(Z, e)), Zt = q(z.mean, e), Re = q(z.minimum, e), Xe = q(z.maximum, e), Te = q(z.absolute_peak, e), ve = q(z.absolute_spread, e), Xt = se.reduce((Z, me) => Z + me, 0) / se.length, Jt = E(z.connection_generation, e);
      if (se.length !== c || Ie.length !== c || Ie.some((Z, me) => me > 0 && Z <= Ie[me - 1]) || !V(Zt, Xt) || !V(Re, Math.min(...se)) || !V(Xe, Math.max(...se)) || !V(Te, Math.max(...se.map(Math.abs))) || !V(ve, Xe - Re)) throw new Error(`${e} response is invalid`);
      H = [], Jt !== o ? H.push("window is from another connection generation") : F === "current" ? (Te > p && H.push("absolute peak exceeds zero_current_peak_amps"), ve > _ && H.push("absolute spread exceeds zero_current_spread_amps")) : i === 1 ? (Te > l && H.push("absolute peak exceeds zero_voltage_peak_volts"), ve > f && H.push("absolute spread exceeds zero_voltage_spread_volts")) : (Re < y && H.push("minimum is below voltage_present_minimum_volts"), ve > d && H.push("absolute spread exceeds voltage_present_spread_volts"));
    }
    if (!ee(ie, H) || Ze !== (H.length === 0)) throw new Error(`${e} response is invalid`);
    U.push(...H.map((z) => `${B}: ${z}`));
  });
  const $ = A(s.reasons, e, 100).map((M) => b(M, e)), w = [...U, "connection generation changed while collecting readiness"], S = T === g.length && ee($, [x]) || T === 0 && (ee($, U) || ee($, w));
  if (m.size !== k.size || !S || r !== ($.length === 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function qt(n, e) {
  const t = A(n, e, 3);
  if (t.length !== 3) throw new Error(`${e} response is invalid`);
  return t.forEach((i) => {
    const s = A(i, e, 2);
    if (s.length !== 2 || s.some((r) => {
      const o = E(r, e);
      return o < -32768 || o > 32767;
    })) throw new Error(`${e} response is invalid`);
  }), n;
}
function Wi(n, e, t, i) {
  const s = C(n, e);
  P(s, ["state", "board_index", "stage", "expected_tables", "unfinished_group_keys", "retry_allowed", "error"], e);
  const r = N(s.state, Li, e);
  if (E(s.board_index, e) !== t || E(s.stage, e) !== i) throw new Error(`${e} response is invalid`);
  const o = t === 0 ? ["main_1", "main_2"] : [`addon${t}_1`, `addon${t}_2`], a = A(s.expected_tables, e, 2).map((p) => {
    const _ = A(p, e, 2);
    if (_.length !== 2) throw new Error(`${e} response is invalid`);
    const y = b(_[0], e);
    if (!o.includes(y)) throw new Error(`${e} response is invalid`);
    return qt(_[1], e), y;
  }), c = A(s.unfinished_group_keys, e, 2).map((p) => b(p, e)), l = [...a, ...c], f = D(s.retry_allowed, e);
  if (l.length !== 2 || new Set(l).size !== 2 || l.some((p) => !o.includes(p))) throw new Error(`${e} response is invalid`);
  if (r === "applied_pending_restart_verification") {
    if (a.length !== 2 || c.length !== 0 || f || s.error !== null) throw new Error(`${e} response is invalid`);
  } else if (b(s.error, e), !f || a.length !== (r === "partial" ? 1 : 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function Ki(n, e, t, i) {
  const s = C(n, e), r = N(s.target, /* @__PURE__ */ new Set(["voltage", "current"]), e);
  b(s.target_id, e);
  const o = D(s.stable, e);
  if (r !== t || s.target_id !== i) throw new Error(`${e} response is invalid`);
  const a = A(s.windows, e, r === "voltage" ? 42 : 1);
  if (r === "voltage" ? a.length < 3 || a.length % 3 !== 0 : a.length !== 1) throw new Error(`${e} response is invalid`);
  const c = a.map((l) => {
    const f = C(l, e), p = A(f.samples, e, 1).map((x) => q(x, e));
    if (p.length !== 1) throw new Error(`${e} response is invalid`);
    const _ = q(f.mean, e), y = q(f.standard_deviation, e), d = q(f.range_percent, e), u = p.reduce((x, v) => x + v, 0) / p.length, g = Math.sqrt(p.reduce((x, v) => x + (v - u) ** 2, 0) / p.length), k = 100 * (Math.max(...p) - Math.min(...p)) / Math.abs(u);
    if (!V(_, u) || !V(y, g) || !V(d, k)) throw new Error(`${e} response is invalid`);
    return d;
  });
  if (o !== c.every((l) => l <= 1)) throw new Error(`${e} response is invalid`);
  return n;
}
function ft(n, e, t) {
  const i = C(n, e), s = N(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e);
  b(i.group_key, e), i.phase !== null && N(i.phase, ye, e);
  const r = E(i.iteration, e), o = A(i.changed_channels, e, 3).map((d) => E(d, e)), a = A(i.before_values, e, 3), c = A(i.after_values, e, 3), l = A(i.error_percent_values, e, 3);
  for (const d of [a, c, l]) d.forEach((u) => q(u, e));
  const f = t.target === "voltage" ? t.groupKey : Ge(t.references[0].channel), p = t.target === "voltage" ? Zi(t.groupKey) : t.references.map((d) => d.channel), _ = t.target === "current" && t.references.length === 1 ? ["A", "B", "C"][(t.references[0].channel - 1) % 3] : null, y = D(i.retry_allowed, e);
  if (t.target === "voltage" && (!Number.isFinite(t.reference) || t.reference <= 0) || t.target === "current" && t.references.some((d) => !Number.isFinite(d.reference) || d.reference <= 0 || !Number.isFinite(d.rawReference) || d.rawReference <= 0) || ![1, 2, 3].includes(o.length) || s !== "indeterminate" && a.length !== o.length || new Set(o).size !== o.length || o.some((d) => d < 1 || d > 42) || r < 1 || r > 3 || i.group_key !== f || i.phase !== _ || o.length !== p.length || o.some((d, u) => d !== p[u]) || (s === "indeterminate" ? c.length !== 0 || l.length !== 0 : c.length !== o.length || l.length !== o.length)) throw new Error(`${e} response is invalid`);
  if (s === "indeterminate") {
    if (i.gain_evidence !== null || y) throw new Error(`${e} response is invalid`);
    i.restore_evidence != null && C(i.restore_evidence, e);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${e} response is invalid`);
    Yi(i.gain_evidence, e, t);
    const d = t.target === "voltage" ? c.map(() => t.reference) : t.references.map((k) => k.reference), u = c.map((k, x) => 100 * Math.abs(q(k, e) - d[x]) / d[x]);
    if (l.some((k, x) => q(k, e) < 0 || !V(q(k, e), u[x]))) throw new Error(`${e} response is invalid`);
    const g = Math.max(...u) > 1;
    if (s === "result_outside_tolerance" !== g || y !== (g && r < 3)) throw new Error(`${e} response is invalid`);
  }
  return n;
}
function Ge(n) {
  const e = Math.floor((n - 1) / 6), t = Math.floor((n - 1) % 6 / 3) + 1;
  return e === 0 ? `main_${t}` : `addon${e}_${t}`;
}
function Yi(n, e, t) {
  const i = C(n, e), s = E(i.connection_generation, e), r = E(i.operation_sequence, e), o = t.target === "voltage" ? t.groupKey : Ge(t.references[0].channel), a = o.startsWith("main_") ? `meter_main${o.slice(-1)}` : o;
  if (s < 1 || r < 1 || b(i.instance_id, e) !== a) throw new Error(`${e} response is invalid`);
  const c = t.target === "current" ? new Map(t.references.map((_) => [["A", "B", "C"][(_.channel - 1) % 3], _.rawReference])) : /* @__PURE__ */ new Map(), l = A(i.phases, e, 3);
  if (l.length !== 3) throw new Error(`${e} response is invalid`);
  l.forEach((_, y) => {
    const d = C(_, e), u = N(d.phase, ye, e);
    if (u !== ["A", "B", "C"][y]) throw new Error(`${e} response is invalid`);
    q(d.measured_voltage, e), q(d.measured_current, e);
    const g = q(d.reference_voltage, e), k = q(d.reference_current, e), x = E(d.old_voltage_gain, e), v = E(d.new_voltage_gain, e), m = E(d.old_current_gain, e), U = E(d.new_current_gain, e);
    if ([x, v, m, U].some((T) => T < 1 || T > 65535)) throw new Error(`${e} response is invalid`);
    if (t.target === "voltage") {
      if (Math.abs(g - t.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(g), t.reference)) || Math.abs(k) > 1e-6 || m !== U) throw new Error(`${e} response is invalid`);
    } else {
      const T = c.get(u);
      if (Math.abs(g) > 1e-6 || (T === void 0 ? Math.abs(k) > 1e-6 : Math.abs(k - T) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(k), T))) || x !== v || T === void 0 && m !== U) throw new Error(`${e} response is invalid`);
    }
  });
  const f = A(i.register_mismatch_phases, e, 3);
  f.forEach((_) => N(_, ye, e));
  const p = A(i.matching_lines, e, 100);
  if (p.length === 0 || p.some((_) => typeof _ != "string") || D(i.flash_saved, e) !== !0 || f.length !== 0 || D(i.calibration_disabled, e) !== !1) throw new Error(`${e} response is invalid`);
}
function Zi(n) {
  const e = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(n);
  if (!e) return [];
  const t = e[2] === void 0 ? 0 : Number(e[2]), i = Number(e[1] ?? e[3]), s = t * 6 + (i - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}
function Be(n, e, t) {
  const i = C(n, e);
  for (const d of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) b(i[d], e);
  const s = E(i.topology_addon_count, e);
  N(i.topology_connection_type, Ve, e);
  const r = E(i.connection_generation, e), o = N(i.source_authority, /* @__PURE__ */ new Set(["saved_flash", "configuration"]), e), a = D(i.source_handoff_available, e), c = D(i.source_handoff_firmware_installed, e);
  Pe(i.source_handoff_transaction_id, e);
  const l = i.config_filename !== null || i.config_sha256 !== null;
  if (l && (b(i.config_filename, e), b(i.config_sha256, e), !Bi.test(i.config_filename) || !Ee.test(i.config_sha256)))
    throw new Error(`${e} response is invalid`);
  if (i.config_filename === null != (i.config_sha256 === null)) throw new Error(`${e} response is invalid`);
  if (!Ni.test(i.mac) || !qe.test(i.verification_id) || r < 1 || i.source_handoff_transaction_id !== null && !qe.test(i.source_handoff_transaction_id) || s !== t.addon_count || i.topology_project_name !== t.project_name || i.topology_connection_type !== t.connection_type || i.topology_voltage_layout !== t.voltage_layout) throw new Error(`${e} response is invalid`);
  const f = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: s }, (d, u) => [`addon${u + 1}_1`, `addon${u + 1}_2`]).flat()]), p = (d, u, g) => {
    const k = A(i[d] ?? [], e, 14), x = /* @__PURE__ */ new Set();
    return k.forEach((v) => {
      const m = C(v, e);
      P(m, ["instance_id", u], e);
      const U = b(m.instance_id, e);
      if (!f.has(U) || x.has(U)) throw new Error(`${e} response is invalid`);
      if (x.add(U), g) qt(m[u], e);
      else {
        const T = A(m[u], e, 3);
        if (T.length !== 3) throw new Error(`${e} response is invalid`);
        T.forEach(($) => {
          const w = A($, e, 2);
          if (w.length !== 2 || w.some((O) => {
            const S = E(O, e);
            return S < 1 || S > 65535;
          })) throw new Error(`${e} response is invalid`);
        });
      }
    }), k.length;
  }, _ = p("groups", "phase_gains", !1), y = p("offset_groups", "phase_offsets", !0) + p("power_offset_groups", "phase_power_offsets", !0);
  if (_ + y < 1 || a && (!l || c || i.source_handoff_transaction_id !== null || o !== "saved_flash" || y > 0) || !a && l && i.source_handoff_transaction_id === null && y === 0 || c && (!l || i.source_handoff_transaction_id === null || y > 0) || o === "configuration" && (!c || a || y > 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function Xi(n, e, t) {
  const i = C(n, e);
  return i.session !== null && G(i.session, e), i.transaction !== null && oe(i.transaction, e), i.verified_calibration !== null && Be(i.verified_calibration, e, t), n;
}
class Se {
  constructor(e, t) {
    this.hass = e, this.entryId = t, this.setupStatus = () => this.call("setup_status", (i) => be(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (A(i, "list_meters").forEach((s) => Mt(s, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (s) => ji(s, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (s) => Ne(s, "get_ct_inventory"), { device_id: i }), this.getMeterConfiguration = (i) => this.call("get_meter_configuration", (s) => Vi(s, "get_meter_configuration"), { device_id: i }), this.getActiveWork = (i, s) => this.call("get_active_work", (r) => Xi(r, "get_active_work", s), { device_id: i }), this.getSession = (i) => this.call("get_session", (s) => G(s, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => C(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, s, r, o, a, c) => this.call("set_installer_intent", (l) => be(l, "set_installer_intent"), {
      addon_count: i,
      connection_type: s,
      ...o ?? {},
      ...r && r.productId.length <= 160 && r.version.length <= 160 && Tt.test(r.productId) && Ot.test(r.version) ? { firmware_product_id: r.productId, esphome_version: r.version } : {},
      ...a != null && c !== null && c !== void 0 ? { electrical_system: a, line_frequency_hz: c } : {}
    }), this.rescan = () => this.call("rescan", (i) => be(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (s) => {
      const r = C(s, "adopt_device");
      return b(r.device_id, "adopt_device"), b(r.configuration, "adopt_device"), s;
    }, { device_id: i }), this.previewCtConfig = (i, s, r, o, a) => this.call("preview_ct_config", (c) => oe(c, "preview_ct_config"), {
      device_id: i,
      plan_id: s,
      source_sha256: r,
      changes: o,
      ...a ? { package_options: a } : {}
    }), this.previewMeterConfiguration = (i, s, r, o) => this.call("preview_meter_configuration", (a) => oe(a, "preview_meter_configuration"), {
      device_id: i,
      plan_id: s,
      source_sha256: r,
      configuration: o
    }), this.setHaLabels = (i, s, r, o) => this.call("set_ha_labels", (a) => a, {
      device_id: i,
      plan_id: s,
      source_sha256: r,
      changes: o
    }), this.transaction = (i, s, r, o) => this.call(i, (a) => oe(a, i), {
      device_id: s,
      transaction_id: r,
      source_sha256: o
    }), this.applyCtConfig = (i, s, r) => this.transaction("apply_ct_config", i, s, r), this.compileCtConfig = (i, s, r) => this.transaction("compile_ct_config", i, s, r), this.installCtConfig = (i, s, r) => this.transaction("install_ct_config", i, s, r), this.rollbackCtConfig = (i, s, r) => this.transaction("rollback_ct_config", i, s, r), this.startSession = (i) => this.call("start_session", (s) => G(s, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (s) => G(s, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, r) => this.call("check_stability", (o) => Ki(o, "check_stability", s, r), { session_id: i, target: s, target_id: r }), this.checkOffsetReadiness = (i, s, r) => this.call("check_offset_readiness", (o) => Gi(o, "check_offset_readiness", s, r), {
      session_id: i,
      board_index: s,
      stage: r
    }), this.calibrateOffset = (i, s, r, o, a) => this.call("calibrate_offset", (c) => Wi(c, "calibrate_offset", s, r), {
      session_id: i,
      board_index: s,
      stage: r,
      preparation_acknowledged: o,
      confirm_retry: a
    }), this.skipOffsetCalibration = (i) => this.call("skip_offset_calibration", (s) => G(s, "skip_offset_calibration"), { session_id: i }), this.calibrateVoltage = (i, s, r, o) => !s || !Number.isFinite(r) || r < 1 || r > 600 ? Promise.reject(new Error("calibrate_voltage reference is invalid")) : this.call("calibrate_voltage", (a) => A(a, "calibrate_voltage", 14).map((c) => ft(c, "calibrate_voltage", {
      target: "voltage",
      groupKey: b(C(c, "calibrate_voltage").group_key, "calibrate_voltage"),
      reference: r
    })), { session_id: i, reference_id: s, reference_voltage: r, confirm_iteration: o }), this.calibrateCurrent = (i, s, r, o = []) => s.length < 1 || s.length > 3 || new Set(s.map((a) => a.channel)).size !== s.length || new Set(s.map((a) => Ge(a.channel))).size !== 1 || s.some((a) => !Number.isInteger(a.channel) || a.channel < 1 || a.channel > 42 || !Number.isFinite(a.reference) || a.reference <= 0 || ![1, 2, 4, 8].includes(a.reporting_multiplier)) || o.some((a) => ![1, 2, 4, 8].includes(a.reporting_multiplier)) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (a) => ft(a, "calibrate_current", {
      target: "current",
      references: s.map((c) => ({ channel: c.channel, reference: c.reference, rawReference: c.reference / c.reporting_multiplier }))
    }), {
      session_id: i,
      references: s,
      confirm_iteration: r,
      pending_multipliers: o
    }), this.restartAndVerify = (i, s) => this.call("restart_and_verify", (r) => Be(r, "restart_and_verify", s), { session_id: i }), this.completeCalibrationWithoutChanges = (i) => this.call("complete_calibration_without_changes", (s) => {
      const r = G(s, "complete_calibration_without_changes");
      if (r.session_id !== i || r.state !== "verified" || r.has_pending_calibration !== !1)
        throw new Error("complete_calibration_without_changes response is invalid");
      return r;
    }, { session_id: i }), this.previewCalibratedGains = (i, s, r = [], o) => this.call("preview_calibrated_gains", (a) => oe(a, "preview_calibrated_gains"), {
      session_id: i,
      verification_id: s,
      changes: r,
      ...o ? { package_options: o } : {}
    }), this.clearCalibrationFlash = (i, s, r, o) => this.call("clear_calibration_flash", (a) => Be(a, "clear_calibration_flash", o), {
      session_id: i,
      verification_id: s,
      transaction_id: r
    }), this.cancelSession = (i) => this.call("cancel_session", (s) => G(s, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (s) => be(s, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, s, r, o) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: s,
      source_sha256: r
    }, (a) => oe(a, "subscribe_config_transaction"), o), this.subscribeSession = (i, s) => this.subscribe("subscribe_session", { session_id: i }, (r) => G(r, "subscribe_session"), s);
  }
  static assertPublicPayload(e, t = !1, i = 0, s = "", r = !1) {
    if (i > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(e)) {
      if (e.length > 100) throw new Error(`unsafe collection ${s || "value"} refused`);
      for (const o of e) this.assertPublicPayload(o, !1, i + 1, s);
      return;
    }
    if (typeof e == "string") {
      const o = e.includes(`
`) || e.includes("\r"), a = s === "redacted_diff" ? 32768 : 4096;
      if (e.length > a || ki.test(e) || Si.test(e) || o && s !== "redacted_diff" || s === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${s || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [o, a] of Object.entries(e)) {
        if (o.length > 256 || Ci.test(o)) throw new Error("unsafe property name refused");
        if (o.toLowerCase() === "key" && !r) throw new Error(`private field ${o} refused`);
        if (o.toLowerCase() !== "raw_gain_ct" && yi.test(o))
          throw new Error(`private field ${o} refused`);
        if (t && i === 0 && o === "changes" && Array.isArray(a)) {
          if (a.length > 100) throw new Error("unsafe collection changes refused");
          for (const c of a) this.assertPublicPayload(c, !1, i + 2, "", !0);
        } else
          this.assertPublicPayload(a, !1, i + 1, o.toLowerCase());
      }
  }
  async call(e, t, i = {}) {
    const s = await this.hass.callWS({
      type: `${lt}${e}`,
      entry_id: this.entryId,
      ...i
    });
    return Se.assertPublicPayload(s, ut.has(e)), t(s);
  }
  subscribe(e, t, i, s) {
    return this.hass.connection.subscribeMessage((r) => {
      Se.assertPublicPayload(r, ut.has(e)), s(i(r));
    }, { type: `${lt}${e}`, entry_id: this.entryId, ...t });
  }
}
function Ji(n) {
  const e = (n?.redacted_diff || "No reviewed configuration changes yet.").split(`
`);
  return h`
    <section class="review-region" aria-labelledby="review-heading">
      <h2 id="review-heading">Review changes</h2>
      <p class="warning-band">Firmware configuration changes can alter Home Assistant rename/entity-key bindings. Review every change before Apply.</p>
      <pre class="config-diff" aria-label="Redacted substitution diff"><code>${e.map((t, i) => h`<span class=${`diff-line ${t.startsWith("+") ? "added" : t.startsWith("-") ? "removed" : "context"}`}>${t}</span>${i < e.length - 1 ? `
` : ""}`)}</code></pre>
      <dl class="status-list">
        <div><dt>Validation</dt><dd>${n?.state === "validated" || n?.progress.includes("config_validated") ? "Validated" : "Pending"}</dd></div>
        <div><dt>Compile</dt><dd>${n?.state === "compiled" || n?.progress.includes("firmware_compiled") ? "Compiled" : "Pending"}</dd></div>
        <div><dt>Install</dt><dd>${n?.state === "install_confirmation_required" ? "Confirmation required" : n?.state ?? "Pending"}</dd></div>
      </dl>
    </section>
  `;
}
function Qi(n, e, t, i, s, r, o) {
  const a = n?.state ?? "previewed", c = a === "rolled_back" && n?.evidence.includes("validation_failed");
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      ${Ji(n)}
      ${a === "failed" ? h`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${n?.evidence.join(", ") || "The operation did not complete."}</p>
          ${n?.rollback_available ? h`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      ${c ? h`<div class="recovery-panel" role="status"><strong>ESPHome rejected the config (code ${n?.validation_detail?.code ?? "unavailable"})</strong><p>The original config was restored. Review the config changes and open ESPHome Device Builder logs for the exact validation error.</p></div>` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${e} ?disabled=${a !== "previewed"}>Apply</button>
        <button class="secondary" @click=${t} ?disabled=${a !== "validated"}>Compile</button>
        <button class="primary" @click=${i} ?disabled=${a !== "install_confirmation_required"}>Install</button>
      </div>
      ${n?.validation_detail ? h`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${n.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${n.validation_detail.error_record_count} records (${n.validation_detail.reported_error_count === null ? "unreported" : `${n.validation_detail.reported_error_count} reported`})</dd></div>
        <div><dt>Warnings</dt><dd>${n.validation_detail.warning_record_count} records (${n.validation_detail.reported_warning_count === null ? "unreported" : `${n.validation_detail.reported_warning_count} reported`})</dd></div>
      </dl>` : ""}
      ${n?.upload_progress?.length ? h`<ul class="upload-progress">${n.upload_progress.map((l) => h`
        <li>${l.stage}: ${l.percentage ?? "in progress"}${l.percentage != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" data-action="continue" @click=${o} ?disabled=${a !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const xe = (n, e) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(n.key)) return;
  n.preventDefault();
  const i = [...n.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], s = n.key === "ArrowRight" || n.key === "ArrowDown", r = n.key === "Home" ? 0 : n.key === "End" ? i.length - 1 : (e + (s ? 1 : i.length - 1)) % i.length;
  i[r]?.click(), i[r]?.focus();
}, Pt = (n, e, t) => (n?.default_gain_ct ?? t) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((n?.default_gain_ct ?? t) / e);
function es(n, e, t, i, s, r, o, a = !1, c = !1, l = null, f = () => {
}, p = () => {
}) {
  const _ = Math.ceil(n.channels.length / 6), y = n.channels.filter((d) => d.address.board_index === e).slice(0, 8);
  return h`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: _ }, (d, u) => h`
          <button role="tab" id=${`board-tab-${u}`} data-board-tab=${u} aria-selected=${u === e}
            aria-controls="board-panel" tabindex=${u === e ? "0" : "-1"}
            @keydown=${(g) => xe(g, u)}
            @click=${() => i(u)}>${u === 0 ? "Main Board" : `Add-on ${u}`}</button>
        `)}
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <p class="info-band">If you expect to measure more than 65.535 A on a CT, use a multiplier of 2 for a 120 A CT or 4 for a 200 A CT. The multiplier divides the gain and multiplies current and power output by the same amount.</p>
      <div id="board-panel" role="tabpanel" aria-labelledby=${`board-tab-${e}`}>
      <div class="ct-table" role="table" aria-rowcount=${n.channels.length + 1}>
        <div class="ct-header" role="row" aria-rowindex="1">
          <span role="columnheader">CT</span><span role="columnheader">Name</span><span role="columnheader">Model</span><span role="columnheader">Current gain</span><span role="columnheader">Multiplier</span><span role="columnheader">Resulting gain</span><span role="columnheader">Burden</span><span role="columnheader">Status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${y.map((d) => {
    const u = t.get(d.channel) ?? {
      name: d.name,
      modelId: d.selected_model_id ?? "",
      multiplier: d.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, g = n.catalog.presets.find((v) => v.model_id === u.modelId), k = Pt(g, u.multiplier, u.modelId === "custom" ? u.customGainCt : void 0), x = We(d, u);
    return h`
              <div class="ct-row" data-ct-row data-ct-group=${d.address.group_index} role="row" aria-rowindex=${d.channel + 1} aria-label=${`CT${d.channel}`}>
                <strong class="ct-index" role="cell">CT${d.channel}</strong>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${d.channel} name`} .value=${u.name}
                  @input=${(v) => s(d.channel, { name: v.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${d.channel} model`} ?disabled=${a}
                  @change=${(v) => {
      const m = v.target.value, U = n.catalog.presets.find((T) => T.model_id === m);
      s(d.channel, {
        modelId: m,
        burdenAcknowledged: d.selection_verified_against_config && m === d.selected_model_id && (m === "custom" || U?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${u.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((v) => h`<option value=${v.model_id} ?selected=${u.modelId === v.model_id}>${v.label}</option>`)}
                  <option value="custom" ?selected=${u.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${d.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><select aria-label=${`CT${d.channel} multiplier`} ?disabled=${a}
                  @change=${(v) => s(d.channel, { multiplier: Number(v.target.value) })}>
                  ${[1, 2, 4, 8].map((v) => h`<option value=${v} ?selected=${u.multiplier === v}>${v}</option>`)}
                </select></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${k ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${g?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${u.expanded} @click=${() => s(d.channel, { expanded: !u.expanded })}>
                  ${u.modelId ? x ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${u.modelId === "custom" ? h`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${d.channel} custom gain`}
                  ?disabled=${a}
                  .value=${u.customGainCt === void 0 ? "" : String(u.customGainCt)}
                  @input=${(v) => s(d.channel, { customGainCt: Number(v.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${d.channel} custom label`} ?disabled=${a} .value=${u.customLabel ?? ""}
                  @input=${(v) => s(d.channel, { customLabel: v.target.value })} /></label>
              </div>` : R}
              ${u.modelId === "custom" || g?.requires_burden_jumper_cut ? h`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${d.channel} burden output acknowledgement`}
                  ?disabled=${a}
                  .checked=${u.burdenAcknowledged}
                  @change=${(v) => s(d.channel, { burdenAcknowledged: v.target.checked })} />
                  I checked the burden-output requirement for CT${d.channel}</label>
              </div>` : R}
              ${g && g.rated_current_a > 65.535 && u.multiplier === 1 ? h`<div class="warning-band" role="status">CT${d.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : R}
              ${u.expanded && g ? h`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${g.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${g.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${g.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${g.notes || (g.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : R}
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${y[0]?.channel ?? 0}–${y.at(-1)?.channel ?? 0} of ${n.channels.length} CTs</p>
      ${l ? ss(l, f, p) : R}
      <footer class="action-footer">
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${c || !os(n, t, a)} @click=${o}>${c ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const gt = ["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"], ts = ["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"], is = ["none", "consumption", "bidirectional", "generation"];
function ss(n, e, t) {
  const i = (a, c) => e({
    ...n,
    channels: n.channels.map((l) => l.channel === a ? { ...l, ...c } : l)
  }), s = (a, c) => e({
    ...n,
    aggregates: n.aggregates.map((l, f) => f === a ? { ...l, ...c } : l)
  }), r = n.meter.voltage_references, o = n.aggregates.some((a) => a.channels.length > 1) ? "Totals include multiple circuits. Do not also count a child circuit in the same dashboard total." : "";
  return h`<section class="step-content" aria-labelledby="circuits-heading">
    <h2 id="circuits-heading">Circuit assignments</h2>
    <p>These fields are part of the meter configuration. Calibration values remain internal.</p>
    ${n.channels.map((a) => h`<section class="ct-detail" aria-label=${`CT${a.channel} circuit`}>
      <strong>CT${a.channel}</strong>
      <label class="check-row"><input type="checkbox" aria-label=${`CT${a.channel} used`} .checked=${a.enabled}
        @change=${(c) => c.target.checked ? i(a.channel, { enabled: !0, role: a.role === "unused" ? "branch" : a.role }) : t(a.channel)} />Used</label>
      <label>Name <input aria-label=${`CT${a.channel} circuit name`} maxlength="64" .value=${a.name}
        @input=${(c) => i(a.channel, { name: c.target.value })} /></label>
      <label>Role <select aria-label=${`CT${a.channel} role`} .value=${a.role}
        @change=${(c) => i(a.channel, { role: c.target.value })}>${gt.map((c) => h`<option value=${c}>${c.replaceAll("_", " ")}</option>`)}</select></label>
      <label>Voltage reference <select aria-label=${`CT${a.channel} voltage reference`} .value=${a.voltage_reference_id}
        @change=${(c) => i(a.channel, { voltage_reference_id: c.target.value })}>${r.map((c) => h`<option value=${c.reference_id}>${c.label || c.reference_id}</option>`)}</select></label>
      <span>${a.enabled ? `${a.model_id || "No CT model"}; ${a.role.replaceAll("_", " ")}` : "Unused"}</span>
    </section>`)}
    <h2>Aggregate totals</h2>
    ${o ? h`<p class="warning-band" role="status">${o}</p>` : R}
    ${n.aggregates.map((a, c) => h`<section class="ct-detail" aria-label=${`${a.name} aggregate`}>
      <label>Name <input aria-label=${`${a.aggregate_id} aggregate name`} maxlength="64" .value=${a.name}
        @input=${(l) => s(c, { name: l.target.value })} /></label>
      <label>Role <select aria-label=${`${a.aggregate_id} aggregate role`} .value=${a.role}
        @change=${(l) => s(c, { role: l.target.value })}>${gt.filter((l) => l !== "unused").map((l) => h`<option value=${l}>${l.replaceAll("_", " ")}</option>`)}</select></label>
      <label>Method <select aria-label=${`${a.aggregate_id} aggregate method`} .value=${a.measurement_method}
        @change=${(l) => s(c, { measurement_method: l.target.value })}>${ts.map((l) => h`<option value=${l}>${l.replaceAll("_", " ")}</option>`)}</select></label>
      <label>Energy <select aria-label=${`${a.aggregate_id} aggregate energy`} .value=${a.energy_mode}
        @change=${(l) => s(c, { energy_mode: l.target.value })}>${is.map((l) => h`<option value=${l}>${l}</option>`)}</select></label>
      <label>Channels <input aria-label=${`${a.aggregate_id} aggregate channels`} .value=${a.channels.join(",")}
        @change=${(l) => s(c, { channels: l.target.value.split(",").map(Number).filter(Number.isInteger) })} /></label>
      <label>Parent <select aria-label=${`${a.aggregate_id} aggregate parent`} .value=${a.parent_id ?? ""}
        @change=${(l) => s(c, { parent_id: l.target.value || null })}><option value="">None</option>${n.aggregates.filter((l) => l.aggregate_id !== a.aggregate_id).map((l) => h`<option value=${l.aggregate_id}>${l.name}</option>`)}</select></label>
      <label class="check-row"><input type="checkbox" aria-label=${`${a.aggregate_id} expose power`} .checked=${a.expose_power}
        @change=${(l) => s(c, { expose_power: l.target.checked })} />Power</label>
      <label class="check-row"><input type="checkbox" aria-label=${`${a.aggregate_id} expose current`} .checked=${a.expose_current}
        @change=${(l) => s(c, { expose_current: l.target.checked })} />Current</label>
    </section>`)}
    <button class="secondary" @click=${() => e({ ...n, aggregates: [...n.aggregates, {
    aggregate_id: `aggregate-${n.aggregates.length + 1}`,
    name: "New aggregate",
    role: "branch",
    channels: [],
    measurement_method: "direct",
    parent_id: null,
    energy_mode: "consumption",
    expose_power: !0,
    expose_current: !1
  }] })}>Add aggregate</button>
    <button class="secondary" @click=${() => e({ ...n, aggregates: [...n.aggregates, {
    aggregate_id: `main-service-${n.aggregates.length + 1}`,
    name: "Main service",
    role: "grid",
    channels: [1, 2],
    measurement_method: "two_ct_sum",
    parent_id: null,
    energy_mode: "bidirectional",
    expose_power: !0,
    expose_current: !0
  }] })}>Add main-service preset</button>
  </section>`;
}
function ns(n, e) {
  const t = new Set(n.meter.voltage_references.map((o) => o.reference_id));
  if (n.channels.length !== e || new Set(n.channels.map((o) => o.channel)).size !== e || n.channels.some((o) => o.channel < 1 || o.channel > e || !o.name.trim() || !t.has(o.voltage_reference_id) || o.enabled === (o.role === "unused"))) return !1;
  const i = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Map();
  for (const o of n.aggregates) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(o.aggregate_id) || i.has(o.aggregate_id) || !o.name.trim() || !o.channels.length || new Set(o.channels).size !== o.channels.length) return !1;
    i.add(o.aggregate_id), r.set(o.aggregate_id, o.parent_id);
    const a = o.measurement_method === "two_ct_sum" ? 2 : o.measurement_method === "one_ct_double_power" || o.measurement_method === "both_conductors_one_ct" ? 1 : void 0;
    if (a !== void 0 && o.channels.length !== a || o.channels.some((c) => c < 1 || c > e || s.has(c) || !n.channels[c - 1]?.enabled)) return !1;
    o.channels.forEach((c) => s.add(c));
  }
  for (const [o, a] of r) {
    const c = /* @__PURE__ */ new Set();
    for (let l = a; l !== null; l = r.get(l) ?? null) {
      if (!i.has(l) || l === o || c.has(l)) return !1;
      c.add(l);
    }
  }
  return !0;
}
function ne(n, e) {
  return n.channels.flatMap((t) => {
    const i = e.get(t.channel);
    if (!i || !We(t, i)) return [];
    const s = n.catalog.presets.find((o) => o.model_id === i.modelId), r = { channel: t.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (r.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (r.custom_label = i.customLabel.trim()), r.burden_output_acknowledged = i.burdenAcknowledged) : s?.requires_burden_jumper_cut && (r.burden_output_acknowledged = i.burdenAcknowledged), [r];
  });
}
function We(n, e) {
  return e.name !== n.name || e.modelId !== (n.selected_model_id ?? "") || e.multiplier !== n.reporting_multiplier || e.modelId === "custom" && (Pt(void 0, e.multiplier, e.customGainCt) !== n.raw_gain_ct || (e.customLabel?.trim() ?? "") !== (n.display_label ?? ""));
}
function rs(n, e) {
  if (!e.name.trim() || !e.modelId || ![1, 2, 4, 8].includes(e.multiplier)) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const t = n.catalog.presets.find((i) => i.model_id === e.modelId);
  return !!t && (!t?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function os(n, e, t = !1) {
  if (t) return [...e].every(([i, s]) => {
    const r = n.channels.find((o) => o.channel === i);
    return !!r && !!s.name.trim() && s.modelId === (r.selected_model_id ?? "") && s.multiplier === r.reporting_multiplier;
  });
  for (const i of n.channels) {
    const s = e.get(i.channel);
    if (!s || We(i, s) && !rs(n, s))
      return !1;
  }
  return !0;
}
const W = (n) => n.toFixed(2);
function Dt(n, e, t) {
  const i = [n, !!e?.stable, !!t, !!t?.gain_evidence, !!t], s = i.findIndex((o) => !o);
  return h`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((o, a) => h`<li
    class=${i[a] ? "complete" : a === s ? "active" : "pending"}><span
      class="progress-number">${a + 1}</span><span>${o}</span></li>`)}</ol>`;
}
function Nt(n, e, t, i) {
  const s = Object.entries(n?.calibration_sources ?? {}).filter(([r]) => e.includes(r));
  return h`<section class="measurement-evidence calibration-source" aria-label=${`${t} calibration source`}>
    <h3>Active gain source</h3>
    ${s.length ? h`<table><thead><tr><th>Chip</th><th>Active gain source</th><th>${t} calibrated this session</th></tr></thead><tbody>
      ${s.map(([r, o]) => h`<tr><td>${r}</td><td>${o === "flash" ? "Saved flash" : o === "configuration" ? "Configuration" : "Unknown"}</td><td>${i.has(r) ? "Yes" : "No"}</td></tr>`)}
    </tbody></table><p>ATM90E32 stores voltage and current gains in one table. The active source does not mean this calibration step was completed.</p>` : h`<p>Calibration source is not available.</p>`}
  </section>`;
}
function Ke(n, e) {
  if (!n) return R;
  const t = n.target === "voltage" ? "V" : "A";
  return h`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((i, s) => h`<dl>
      <div><dt>${e?.[s] ?? (n.target === "voltage" ? `V${s % 3 + 1}` : `A${s + 1}`)}</dt>
        <dd>${i.samples.map((r) => `${W(r)} ${t}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}
function Ye(n) {
  return n ? h`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${n.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${n.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${n.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${n.before_values.map(W).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${n.after_values.map(W).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${n.error_percent_values.map((e) => `${W(e)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${n.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${n.gain_evidence ? h`<h4>Gain evidence · ${n.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${n.gain_evidence.phases?.map((e) => h`<tr><td>${e.phase}</td><td>${W(e.measured_voltage)}</td><td>${W(e.measured_current)}</td><td>${W(e.reference_voltage)}</td><td>${W(e.reference_current)}</td><td>${e.old_voltage_gain} → ${e.new_voltage_gain}</td><td>${e.old_current_gain} → ${e.new_current_gain}</td></tr>`) ?? R}
      </tbody></table><p>Saved in flash: ${n.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : h`<p>Gain evidence unavailable.</p>`}
  </section>` : R;
}
function as(n, e, t, i, s, r, o, a, c, l, f, p, _, y, d, u) {
  const g = n?.ct_count ?? e?.channels.length ?? 6, k = Math.floor((i - 1) / 6), v = Math.floor((i - 1) / 3) * 3 + 1, m = Array.from({ length: 3 }, (S, M) => v + M).filter((S) => S <= g), U = m.filter((S) => (s.get(S) ?? 0) > 0), T = k === 0 ? ["meter_main1", "meter_main2"] : [`addon${k}_1`, `addon${k}_2`], $ = e === null, w = r !== null && [1, 2, 4, 8].includes(r), O = U.length > 0 && (!$ || w);
  return h`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Dt(O, o, a)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(g / 6) }, (S, M) => h`<button role="tab"
          id=${`current-board-tab-${M}`} aria-controls="current-board-panel"
          aria-selected=${M === k} tabindex=${M === k ? "0" : "-1"}
          @keydown=${(I) => xe(I, M)}
          @click=${() => l(M * 6 + 1)}>${M === 0 ? "Main Board" : `Add-on ${M}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${k}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((S) => {
    const M = k * 6 + S * 3 + 1;
    return h`<button
          aria-pressed=${M === v} @click=${() => l(M)}>Group ${k * 2 + S + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${v}–CT${v + 2}</h2>
      ${Nt(t, T, "Current", c)}
      <div class="reference-block">
        ${m.map((S) => h`<label>CT${S} reference
          <input data-current-reference=${S} aria-label=${`CT${S} reference`} type="number" min="0.01" step="0.01"
            .value=${s.has(S) ? String(s.get(S)) : ""}
            @input=${(M) => {
    const I = M.target;
    f(S, I.value === "" ? null : Number(I.value));
  }} /></label>`)}
      ${$ ? h`<label>Reporting multiplier <select data-role="reporting-multiplier" required @change=${(S) => {
    const M = Number(S.target.value);
    p(M || null);
  }}><option value="" ?selected=${r === null}>Choose multiplier</option>${[1, 2, 4, 8].map((S) => h`<option value=${S} ?selected=${r === S}>${S}</option>`)}</select></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${_} ?disabled=${!O}>Check stability</button>
        <button class="primary" @click=${y} ?disabled=${!O || !o?.stable || (a?.iteration ?? 0) >= 3 || !!(a && !a.retry_allowed && a.iteration > 0)}>${a?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button></div>
      ${o ? h`<div class=${o.stable ? "success-band" : "warning-band"} role="status">${o.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${Ke(o, U.map((S) => `CT${S}`))}
      ${a?.state === "applied_pending_restart_verification" ? h`<div class="success-band" role="status">Current calibration complete for CT${v}–CT${v + 2}.</div>` : ""}
      ${Ye(a)}
      ${a?.state.includes("indeterminate") ? h`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${d}>Reconnect and inspect</button><button class="danger" @click=${u}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const cs = [
  ["split_phase_120_240", "Split phase 120/240 V"],
  ["single_phase_230", "Single phase 230 V"],
  ["three_phase", "Three phase"],
  ["custom", "Custom"]
], ls = [1, 2, 5, 10, 30, 60], ds = (n) => n <= 5 ? "1–5 seconds: high traffic." : n === 10 ? "10 seconds: standard." : n >= 30 ? "30–60 seconds: lower traffic; guided calibration takes longer." : "This interval affects update traffic and guided calibration time.";
function hs(n, e, t, i, s, r, o, a, c, l) {
  const f = n.voltage_references.length > 1, p = !!n.friendly_name.trim() && n.voltage_references.every((d) => d.label.trim() && d.phase_label.trim() && Number.isFinite(d.nominal_voltage_v) && d.nominal_voltage_v >= 1 && d.nominal_voltage_v <= 600 && Number.isInteger(d.gain_voltage) && d.gain_voltage >= 1 && d.gain_voltage <= 65535 && d.group_keys.length) && (!f || t), _ = (d) => i({ ...n, ...d }), y = (d, u) => {
    const g = n.voltage_references.find((v) => v.group_keys.includes(d)), k = n.voltage_references.find((v) => v.reference_id === u);
    if (!g || !k || g === k) return;
    const x = g.group_keys.length === 1 ? k.group_keys[0] : void 0;
    _({ voltage_references: n.voltage_references.map((v) => ({
      ...v,
      group_keys: v === g ? x ? [x] : v.group_keys.filter((m) => m !== d) : v === k ? [...v.group_keys.filter((m) => m !== x), d] : v.group_keys
    })) });
  };
  return h`
    <section class="step-content meter-settings-step" aria-labelledby="step-heading">
      <h2>Meter settings</h2>
      <p>These values are written to the meter configuration. Setup Device choices remain onboarding suggestions.</p>
      <div class="meter-settings-grid">
        <label>Friendly name <input aria-label="Friendly name" maxlength="64" .value=${n.friendly_name}
          @input=${(d) => _({ friendly_name: d.target.value })} /></label>
        <label>Electrical system <select aria-label="Electrical system" .value=${n.electrical_system}
          @change=${(d) => s(d.target.value)}>${cs.map(([d, u]) => h`<option value=${d}>${u}</option>`)}</select></label>
        <label>Line frequency <select aria-label="Line frequency" .value=${String(n.line_frequency_hz)}
          @change=${(d) => r(Number(d.target.value))}>${[50, 60].map((d) => h`<option value=${d}>${d} Hz</option>`)}</select></label>
        <label>Reporting interval <select aria-label="Reporting interval" .value=${String(n.update_interval_s)}
          @change=${(d) => _({ update_interval_s: Number(d.target.value) })}>${ls.map((d) => h`<option value=${d}>${d} seconds</option>`)}</select></label>
      </div>
      <p class="info-band" role="status">${ds(n.update_interval_s)}</p>
      <h3>Voltage references</h3>
      <div class="voltage-reference-cards">${n.voltage_references.map((d) => h`
        <section class="voltage-reference-card" aria-label=${`${d.label} voltage reference`}>
          <label>Label <input aria-label=${`${d.reference_id} label`} maxlength="64" .value=${d.label}
            @input=${(u) => _({ voltage_references: n.voltage_references.map((g) => g.reference_id === d.reference_id ? { ...g, label: u.target.value } : g) })} /></label>
          <label>Phase label <input aria-label=${`${d.reference_id} phase label`} maxlength="64" .value=${d.phase_label}
            @input=${(u) => _({ voltage_references: n.voltage_references.map((g) => g.reference_id === d.reference_id ? { ...g, phase_label: u.target.value } : g) })} /></label>
          <label>Transformer <select aria-label=${`${d.reference_id} transformer`} .value=${d.transformer_model_id}
            @change=${(u) => {
    const g = u.target.value, k = e.presets.find((x) => x.model_id === g);
    _({ voltage_references: n.voltage_references.map((x) => x.reference_id === d.reference_id ? { ...x, transformer_model_id: g, gain_voltage: k?.default_gain_voltage ?? x.gain_voltage } : x) });
  }}>
            ${e.presets.map((u) => h`<option value=${u.model_id}>${u.label}</option>`)}
            <option value="custom">Custom starting gain</option>
            ${d.transformer_model_id !== "custom" && !e.presets.some((u) => u.model_id === d.transformer_model_id) ? h`<option value=${d.transformer_model_id}>${d.transformer_model_id}</option>` : ""}</select></label>
          <label>Custom voltage gain <input aria-label=${`${d.reference_id} custom voltage gain`} type="number" min="1" max="65535" step="1" .value=${String(d.gain_voltage)}
            @input=${(u) => _({ voltage_references: n.voltage_references.map((g) => g.reference_id === d.reference_id ? { ...g, gain_voltage: Number(u.target.value) } : g) })} /></label>
          <label>Nominal voltage <input aria-label=${`${d.reference_id} nominal voltage`} type="number" min="1" max="600" step="0.1" .value=${String(d.nominal_voltage_v)}
            @input=${(u) => o(d.reference_id, Number(u.target.value))} /></label>
        </section>`)}
      </div>
      <h3>Voltage group assignment</h3>
      <div class="meter-settings-grid">${n.voltage_references.flatMap((d) => d.group_keys).sort().map((d) => h`<label>${d}<select aria-label=${`${d} voltage reference`} .value=${n.voltage_references.find((u) => u.group_keys.includes(d))?.reference_id ?? ""}
        @change=${(u) => y(d, u.target.value)}>${n.voltage_references.map((u) => h`<option value=${u.reference_id}>${u.label || u.reference_id}</option>`)}</select></label>`)}</div>
      ${f ? h`<label class="check-row"><input type="checkbox" aria-label="Multi-reference preparation acknowledgement" .checked=${t}
        @change=${(d) => a(d.target.checked)} />I prepared the separate voltage references.</label>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${c}>Back</button><button class="primary" data-action="continue-meter-settings" ?disabled=${!p} @click=${l}>Continue to Circuits & CTs</button></footer>
    </section>
  `;
}
const ps = (n) => n === null || typeof n != "object" && typeof n != "function", us = (n) => n.strings === void 0;
const fs = { CHILD: 2 }, gs = (n) => (...e) => ({ _$litDirective$: n, values: e });
let _s = class {
  constructor(e) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(e, t, i) {
    this._$Ct = e, this._$AM = t, this._$Ci = i;
  }
  _$AS(e, t) {
    return this.update(e, t);
  }
  update(e, t) {
    return this.render(...t);
  }
};
const pe = (n, e) => {
  const t = n._$AN;
  if (t === void 0) return !1;
  for (const i of t) i._$AO?.(e, !1), pe(i, e);
  return !0;
}, ke = (n) => {
  let e, t;
  do {
    if ((e = n._$AM) === void 0) break;
    t = e._$AN, t.delete(n), n = e;
  } while (t?.size === 0);
}, Bt = (n) => {
  for (let e; e = n._$AM; n = e) {
    let t = e._$AN;
    if (t === void 0) e._$AN = t = /* @__PURE__ */ new Set();
    else if (t.has(n)) break;
    t.add(n), bs(e);
  }
};
function vs(n) {
  this._$AN !== void 0 ? (ke(this), this._$AM = n, Bt(this)) : this._$AM = n;
}
function ms(n, e = !1, t = 0) {
  const i = this._$AH, s = this._$AN;
  if (s !== void 0 && s.size !== 0) if (e) if (Array.isArray(i)) for (let r = t; r < i.length; r++) pe(i[r], !1), ke(i[r]);
  else i != null && (pe(i, !1), ke(i));
  else pe(this, n);
}
const bs = (n) => {
  n.type == fs.CHILD && (n._$AP ??= ms, n._$AQ ??= vs);
};
class ws extends _s {
  constructor() {
    super(...arguments), this._$AN = void 0;
  }
  _$AT(e, t, i) {
    super._$AT(e, t, i), Bt(this), this.isConnected = e._$AU;
  }
  _$AO(e, t = !0) {
    e !== this.isConnected && (this.isConnected = e, e ? this.reconnected?.() : this.disconnected?.()), t && (pe(this, e), ke(this));
  }
  setValue(e) {
    if (us(this._$Ct)) this._$Ct._$AI(e, this);
    else {
      const t = [...this._$Ct._$AH];
      t[this._$Ci] = e, this._$Ct._$AI(t, this, 0);
    }
  }
  disconnected() {
  }
  reconnected() {
  }
}
class $s {
  constructor(e) {
    this.G = e;
  }
  disconnect() {
    this.G = void 0;
  }
  reconnect(e) {
    this.G = e;
  }
  deref() {
    return this.G;
  }
}
class ys {
  constructor() {
    this.Y = void 0, this.Z = void 0;
  }
  get() {
    return this.Y;
  }
  pause() {
    this.Y ??= new Promise((e) => this.Z = e);
  }
  resume() {
    this.Z?.(), this.Y = this.Z = void 0;
  }
}
const _t = (n) => !ps(n) && typeof n.then == "function", vt = 1073741823;
class Ss extends ws {
  constructor() {
    super(...arguments), this._$Cwt = vt, this._$Cbt = [], this._$CK = new $s(this), this._$CX = new ys();
  }
  render(...e) {
    return e.find((t) => !_t(t)) ?? Y;
  }
  update(e, t) {
    const i = this._$Cbt;
    let s = i.length;
    this._$Cbt = t;
    const r = this._$CK, o = this._$CX;
    this.isConnected || this.disconnected();
    for (let a = 0; a < t.length && !(a > this._$Cwt); a++) {
      const c = t[a];
      if (!_t(c)) return this._$Cwt = a, c;
      a < s && c === i[a] || (this._$Cwt = vt, s = 0, Promise.resolve(c).then(async (l) => {
        for (; o.get(); ) await o.get();
        const f = r.deref();
        if (f !== void 0) {
          const p = f._$Cbt.indexOf(c);
          p > -1 && p < f._$Cwt && (f._$Cwt = p, f.setValue(l));
        }
      }));
    }
    return Y;
  }
  disconnected() {
    this._$CK.disconnect(), this._$CX.pause();
  }
  reconnected() {
    this._$CK.reconnect(this), this._$CX.resume();
  }
}
const ks = gs(Ss), Ft = "https://circuitsetup.github.io/ESPWebInstaller/", Cs = new URL("manifests/firmware_index.json", Ft).href, zt = 256 * 1024, As = 100, Es = 20, Ht = 160, xs = 1e4, Is = /^[a-z0-9][a-z0-9_-]{0,127}$/, Rs = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, Lt = /[\u0000-\u001F\u007F-\u009F]/;
function j(n) {
  throw new Error(`Invalid firmware index: ${n}`);
}
function mt(n) {
  return typeof n == "object" && n !== null && !Array.isArray(n);
}
function Me(n) {
  return typeof n == "string" && n.length <= Ht && !Lt.test(n);
}
function jt(n) {
  if (!Is.test(n)) throw new Error("Invalid firmware product ID");
}
function Vt(n) {
  if (!Rs.test(n) || n.length > Ht || Lt.test(n))
    throw new Error("Invalid firmware version");
}
function Gt(n) {
  return new TextEncoder().encode(n).byteLength;
}
function Ts(n) {
  Array.isArray(n) || j("top level must be an array"), Gt(JSON.stringify(n)) > zt && j("payload is too large"), n.length > As && j("too many products");
  const e = /* @__PURE__ */ new Set();
  return n.map((t) => {
    (!mt(t) || Object.keys(t).length !== 3 || !Object.hasOwn(t, "productId") || !Object.hasOwn(t, "name") || !Object.hasOwn(t, "versions")) && j("invalid product");
    const { productId: i, name: s, versions: r } = t;
    (!Me(i) || !Me(s) || !Array.isArray(r)) && j("invalid product fields"), jt(i), e.has(i) && j("duplicate product ID"), e.add(i), r.length > Es && j("too many versions");
    const o = /* @__PURE__ */ new Set();
    return {
      productId: i,
      name: s,
      versions: r.map((a) => ((!mt(a) || Object.keys(a).length !== 1 || !Object.hasOwn(a, "version") || !Me(a.version)) && j("invalid version"), Vt(a.version), o.has(a.version) && j("duplicate version"), o.add(a.version), { version: a.version }))
    };
  });
}
async function Os(n = globalThis.fetch, e) {
  const t = new AbortController(), i = () => t.abort();
  e?.aborted ? i() : e?.addEventListener("abort", i, { once: !0 });
  const s = setTimeout(i, xs);
  try {
    const r = await n(Cs, { cache: "no-cache", mode: "cors", signal: t.signal });
    if (!r.ok) throw new Error(`Firmware index request failed (${r.status})`);
    const o = await r.text();
    return Gt(o) > zt && j("payload is too large"), Ts(JSON.parse(o));
  } finally {
    clearTimeout(s), e?.removeEventListener("abort", i);
  }
}
function Ms(n, e) {
  if (!Number.isInteger(n) || n < 0 || n > 6) return [];
  const t = n === 0 ? "6chan_energy_meter_main" : n === 1 ? "6chan_energy_meter_1-addon" : `6chan_energy_meter_${n}-addons`;
  return e === "wifi" ? [n === 0 ? `${t}_board` : t] : e === "ethernet_lilygo" ? [`${t}_ethernet`] : n === 0 ? [`${t}_ethernet_waveshare`, `${t}_ethernet_ws`] : [`${t}_ethernet_waveshare`];
}
function Us(n, e) {
  const t = (r) => r.split(/[-.]/).map((o) => Number.isNaN(Number(o)) ? o : Number.parseInt(o, 10)), i = t(n), s = t(e);
  for (let r = 0; r < Math.max(i.length, s.length); r += 1) {
    const o = i[r], a = s[r];
    if (o === void 0) return -1;
    if (a === void 0) return 1;
    if (o > a) return -1;
    if (o < a) return 1;
  }
  return 0;
}
function qs(n, e, t) {
  const i = /* @__PURE__ */ new Map();
  for (const s of Ms(e, t)) {
    const r = n.find((o) => o.productId === s);
    for (const o of r?.versions ?? [])
      i.has(o.version) || i.set(o.version, { productId: s, version: o.version });
  }
  return [...i.values()].sort((s, r) => Us(s.version, r.version));
}
function Ps(n, e) {
  return n.find((t) => t.version === e)?.version ?? n[0]?.version ?? null;
}
function Ds(n, e) {
  jt(n), Vt(e);
  const t = new URL(`manifests/manifest_${n}-${e}.json`, Ft);
  if (t.origin !== "https://circuitsetup.github.io" || !t.pathname.startsWith("/ESPWebInstaller/manifests/"))
    throw new Error("Invalid firmware manifest URL");
  return t.href;
}
let Ns;
const Bs = () => Ns ??= import("./circuitsetup-energy-meter-helper-install-button-DpSoc-pA.js"), bt = (n, e) => h`
  <p class="firmware-summary">${n.productId} · ESPHome ${n.version}</p>
  <esp-web-install-button class="esp-web-installer" .manifest=${e}>
    <button slot="activate" aria-label="Install firmware">Install firmware</button>
    <p slot="unsupported">Use a supported Chromium browser with Web Serial to install firmware.</p>
    <p slot="not-allowed">Open this helper on HTTPS or localhost to install firmware.</p>
  </esp-web-install-button>
`;
function Fs(n) {
  if (!n) return R;
  try {
    const e = Ds(n.productId, n.version);
    return customElements.get("esp-web-install-button") ? bt(n, e) : ks(
      Bs().then(
        () => bt(n, e),
        () => h`<p role="alert">ESP Web Tools failed to load. Reload Home Assistant and try again.</p>`
      ),
      h`<p role="status">Loading installer…</p>`
    );
  } catch {
    return R;
  }
}
const wt = (n) => n === 0 ? "Main Board" : `Add-on ${n}`, zs = (n) => n === 0 ? ["main_1", "main_2"] : [`addon${n}_1`, `addon${n}_2`];
function Hs(n, e, t, i, s, r, o, a, c, l, f, p, _, y, d, u, g, k, x) {
  const v = e?.offset_capability, m = e?.offset_boards ?? [], U = e?.offset_disposition === "completed" || e?.offset_disposition === "skipped" || e?.offset_disposition === "partial" && e.state === "applied_pending_restart_verification", T = m.length > 0 && m.every((I) => I.stages[0]?.state === "completed"), $ = m[t]?.stages[i - 1]?.state ?? "not_started", w = !!a?.retry_allowed || $ === "partial" || $ === "indeterminate", O = v?.status !== "available", S = zs(t), M = new Map(a?.expected_tables ?? []);
  return h`
    <section class="step-content offset-step" aria-labelledby="step-heading">
      ${O ? h`
        <div class="warning-band" role="status">
          <strong>Offset calibration is ${v?.status === "invalid" ? "not safely available" : "not available on this firmware"}.</strong>
          ${v?.status === "invalid" ? h`<p>Repair reason: ${v.repair_reason}</p>` : R}
          <p>Skip preserves the offset values already saved in flash. No clear control is invoked.</p>
        </div>
      ` : h`
        <ol class="offset-stage-stepper" aria-label="Offset calibration stages">
          <li class=${i === 1 ? "active" : T ? "complete" : "pending"}>
            <button data-offset-stage="1" aria-current=${i === 1 ? "step" : R} @click=${() => f(1)}>1. Voltage/current zero offset</button>
          </li>
          <li class=${i === 2 ? "active" : U ? "complete" : "pending"}>
            <button data-offset-stage="2" aria-current=${i === 2 ? "step" : R} ?disabled=${!T}
              @click=${() => f(2)}>2. Active/reactive power offset</button>
          </li>
        </ol>
        <div class="board-tabs" role="tablist" aria-label="Offset calibration boards">
          ${Array.from({ length: n?.board_count ?? m.length }, (I, B) => h`
            <button role="tab" data-offset-board id=${`offset-board-tab-${B}`} aria-controls="offset-board-panel"
              aria-selected=${B === t} tabindex=${B === t ? "0" : "-1"}
              @keydown=${(F) => xe(F, B)} @click=${() => l(B)}>
              ${wt(B)}
            </button>
          `)}
        </div>
        <div id="offset-board-panel" role="tabpanel" aria-labelledby=${`offset-board-tab-${t}`}>
          <h2>Stage ${i} · ${wt(t)}</h2>
          <div class="warning-band"><strong>Warning:</strong> An open-circuit current-output CT on a live conductor can be hazardous. De-energize conductors before unplugging any CT.</div>
          ${i === 1 ? h`
            <p>First, de-energize all conductors. Then unplug the voltage transformer/AC voltage input and CT inputs, power the meter from USB only, then check that every voltage/current phase reads near zero.</p>
          ` : h`
            <p>Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors, connect/enclose/energize only the voltage reference, then check that voltage is present on both chips and every current phase reads near zero.</p>
          `}
          <p>Measurements cannot prove that a transformer or CT is physically unplugged. Physical acknowledgement never substitutes for measured readiness.</p>
          <label class="check-row"><input type="checkbox" .checked=${s} @change=${(I) => p(I.target.checked)}>
            ${i === 1 ? "I completed the USB-only, de-energized preparation." : "I powered down for rewiring and safely enclosed and energized only the voltage reference."}
          </label>
          <div class="offset-actions">
            <button class="secondary" data-action="check-offset" ?disabled=${c || !s || $ === "completed"} @click=${y}>
              ${c ? "Checking measured readiness…" : "Check measured readiness"}
            </button>
            <button class="primary" data-action="calibrate-offset"
              ?disabled=${c || !s || !o?.ready || $ === "completed" || w && !r}
              @click=${d}>${a?.retry_allowed ? "Retry unfinished chip" : `Run Stage ${i} calibration`}</button>
          </div>
          ${o ? h`
            <section class="measurement-evidence" aria-label="Offset readiness evidence">
              <h3>Measured readiness</h3>
              <div class=${o.ready ? "success-band" : "warning-band"} role="status" aria-live="polite">
                ${o.ready ? "Measured readiness passed." : "Measured readiness did not pass. Physical acknowledgement is not enough."}
              </div>
              ${o.reasons.length ? h`<ul>${o.reasons.map((I) => h`<li>${I}</li>`)}</ul>` : R}
              <dl class="threshold-grid">
                <div><dt>Samples per phase</dt><dd>${o.thresholds.sample_count}</dd></div>
                <div><dt>Zero voltage peak</dt><dd>${o.thresholds.zero_voltage_peak_volts} V</dd></div>
                <div><dt>Zero voltage spread</dt><dd>${o.thresholds.zero_voltage_spread_volts} V</dd></div>
                <div><dt>Zero current peak</dt><dd>${o.thresholds.zero_current_peak_amps} A</dd></div>
                <div><dt>Zero current spread</dt><dd>${o.thresholds.zero_current_spread_amps} A</dd></div>
                <div><dt>Voltage present minimum</dt><dd>${o.thresholds.voltage_present_minimum_volts} V</dd></div>
                <div><dt>Voltage present spread</dt><dd>${o.thresholds.voltage_present_spread_volts} V</dd></div>
              </dl>
              <table class="evidence-table"><thead><tr><th>Phase role</th><th>Quantity</th><th>Status</th><th>Mean</th><th>Peak</th><th>Spread</th></tr></thead><tbody>
                ${o.entities.map((I) => h`<tr><td>${I.role}</td><td>${I.quantity}</td><td>${I.ready ? "Ready" : I.reasons.join("; ")}</td>
                  <td>${I.window?.mean ?? "—"}</td><td>${I.window?.absolute_peak ?? "—"}</td><td>${I.window?.absolute_spread ?? "—"}</td></tr>`)}
              </tbody></table>
            </section>
          ` : R}
          <section class="measurement-evidence" aria-label="Per-chip offset progress" aria-live="polite">
            <h3>Per-chip progress</h3>
            <table><thead><tr><th>Chip</th><th>State</th><th>Backend evidence</th></tr></thead><tbody>
              ${S.map((I) => h`<tr><td>${I}</td><td>${M.has(I) || $ === "completed" ? "Saved; restart verification required." : a?.unfinished_group_keys.includes(I) ? "Unfinished" : $.replaceAll("_", " ")}</td>
                <td>${M.has(I) ? M.get(I).map(([B, F]) => `${B}/${F}`).join(", ") : "—"}</td></tr>`)}
            </tbody></table>
          </section>
          ${w ? h`<aside class="recovery-panel" role="status" aria-live="assertive">
            <strong>${a ? a.state === "partial" ? "One chip finished; recovery is required" : "Calibration outcome is indeterminate" : "Recovery is required"}</strong>
            <p>${a?.error ?? "The prior operation did not finish cleanly"}. Reconnect and inspect before retrying only the unfinished chip.</p>
            <label class="check-row"><input type="checkbox" .checked=${r} @change=${(I) => _(I.target.checked)}> I reviewed the evidence and confirm this retry.</label>
            <button class="secondary" @click=${u}>Reconnect and inspect</button>
          </aside>` : R}
        </div>
      `}
      <footer class="action-footer offset-footer">
        <button class="secondary" @click=${k}>Back</button>
        <button class="secondary" data-action="skip-offset" ?disabled=${c || U} @click=${g}>Skip offset calibration</button>
        <button class="primary" ?disabled=${c || !U} @click=${x}>Continue</button>
      </footer>
    </section>
  `;
}
const Ls = [
  ["power_quality", "Power quality sensors"],
  ["status_fields", "Status fields"]
], J = (n) => ({
  power_quality: Array(n + 1).fill(!1),
  status_fields: [!0, ...Array(n).fill(!1)]
}), js = (n, e) => {
  const t = J(e);
  return {
    power_quality: t.power_quality.map((i, s) => n.power_quality[s] ?? i),
    status_fields: t.status_fields.map((i, s) => n.status_fields[s] ?? i)
  };
};
function Wt(n, e) {
  return h`<section class="package-options" aria-labelledby="package-options-heading">
    <h2 id="package-options-heading">Optional meter fields</h2>
    <p>Choose which meter boards expose additional power quality and status entities.</p>
    ${Ls.map(([t, i]) => {
    const s = n[t], r = s.every(Boolean), o = s.some(Boolean) && !r;
    return h`<fieldset class="choice-field feature-options">
        <legend>${i}</legend>
        <label>
          <input type="checkbox" data-all-feature=${t}
            .checked=${r} .indeterminate=${o}
            @change=${(a) => e({
      ...n,
      [t]: s.map(() => a.currentTarget.checked)
    })} />
          <span>All boards</span>
        </label>
        ${s.map((a, c) => h`<label>
          <input type="checkbox" data-feature=${t} data-board=${c}
            .checked=${a}
            @change=${(l) => e({
      ...n,
      [t]: s.map((f, p) => p === c ? l.currentTarget.checked : f)
    })} />
          <span>${c === 0 ? "Main board" : `Add-on ${c}`}</span>
        </label>`)}
      </fieldset>`;
  })}
  </section>`;
}
function Vs(n, e, t, i, s, r, o) {
  const a = n.includes("failed") || n.includes("indeterminate"), c = !!(e?.offset_groups?.length || e?.power_offset_groups?.length), l = e?.source_handoff_available ? e.config_filename : c ? "Unavailable; offset calibration remains saved in flash" : "Unavailable in runtime-only mode";
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, voltage/current offsets, power offsets, and entity bindings.</p>
      <div class="status-band" role="status">${i ? "Restarting and verifying…" : n || "Ready for restart verification"}</div>
      ${e ? h`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${l}</dd></div></dl>` : ""}
      ${n === "cancelled" ? h`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${a ? h`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${t ? h`<button class="danger" data-action="rollback" @click=${r}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${o} ?disabled=${i}>Back</button><button class="primary" @click=${s} ?disabled=${i || n === "cancelled" || !!e}>${i ? "Restarting and verifying…" : n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Gs(n) {
  return n ? n.preflight.issues.length ? h`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((e) => h`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : h`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : h`<p>Starting a calibration session…</p>`;
}
function Ws(n, e, t, i, s, r, o = !1) {
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      ${Gs(n)}
      ${n?.state === "cancelled" ? h`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
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
        <label class="check-row"><input type="checkbox" .checked=${e} @change=${(a) => t(a.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${s}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" @click=${i} ?disabled=${o || n?.state === "cancelled" || !e || !!n?.preflight.issues.length}>${o ? "Loading calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const $t = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Ks = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"], Ys = [
  ["split_phase_120_240", "Split phase 120/240 V"],
  ["single_phase_230", "Single phase 230 V"],
  ["three_phase", "Three phase"],
  ["custom", "Custom"]
], yt = (n) => n === "split_phase_120_240" ? 60 : n === "single_phase_230" ? 50 : null;
function Zs(n, e, t, i, s, r, o, a, c = "", l = !1, f = h``, p = null, _ = J(e), y = () => {
}, d = "split_phase_120_240", u = 60, g = !1, k = () => {
}, x = () => {
}, v = () => {
}) {
  return h`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Configure an existing device</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        ${n?.devices.length ? h`<div class="meter-list">
          ${n.devices.map((m) => h`
            <div class="meter-row">
              <span><strong>${m.title}</strong><small>${m.project_name} · ${m.project_version ?? "version unavailable"}</small></span>
              <span>Device Builder: ${m.configuration ? "Yes" : m.importable ? "Yes — import available" : "No"}</span>
              ${m.importable && !m.configuration ? h`<button class="secondary" ?disabled=${!!c}
                @click=${() => a(m.entry_id)}>${p === m.entry_id ? "Retry import" : "Import"}</button>` : ""}
              <button class="primary" data-action="configure-device" ?disabled=${!!c}
                @click=${() => o(m.entry_id)}>${c === `topology:${m.entry_id}` ? "Loading topology…" : "Configure"}</button>
            </div>
          `)}
        </div>` : h`<div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>`}
      </section>
      ${l ? "" : h`<hr />
      <h2>Set up a new device</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (m, U) => h`
            <label class=${U === e ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(U)}
                .checked=${U === e} @change=${() => i(U)} />
              <span>${U}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Electrical system</legend>
        <p id="electrical-profile-help">Confirm the line frequency before it is saved with this installation.</p>
        <div class="connection-options">
          ${Ys.map(([m, U]) => h`
            <label class=${m === d ? "selected" : ""}>
              <input name="electrical-system" type="radio" .value=${m}
                .checked=${m === d} @change=${() => k(m)} />
              <span>${U}</span>
            </label>
          `)}
        </div>
        <div class="connection-options" role="group" aria-describedby="electrical-profile-help">
          ${[50, 60].map((m) => h`<label class=${m === u ? "selected" : ""}>
            <input name="line-frequency" type="radio" .value=${String(m)} .checked=${m === u}
              @change=${() => x(m)} /> <span>${m} Hz</span>
          </label>`)}
        </div>
        <p>${yt(d) ? `${yt(d)} Hz is suggested; confirm it after checking your supply.` : "Choose the line frequency for this electrical system."}</p>
        <button class="secondary" data-action="confirm-electrical-profile" ?disabled=${u === null} @click=${v}>
          ${g ? "Electrical profile confirmed" : "Confirm electrical profile"}
        </button>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${$t.map(([m, U]) => h`
            <label class=${m === t ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${m}
                .checked=${m === t} @change=${() => s(m)} />
              <span>${U}</span>
            </label>
          `)}
        </div>
      </fieldset>
      ${Wt(_, y)}
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>Add-on boards</dt><dd>${e}</dd></div>
          <div><dt>Connection</dt><dd>${$t.find(([m]) => m === t)?.[1]}</dd></div>
          ${Ks.slice(0, e).map((m, U) => h`<div><dt>Add-on ${U + 1}</dt><dd>${m}</dd></div>`)}
        </dl>
      </section>
      ${f}
      <section class="next-steps" aria-labelledby="next-steps-heading">
        <h2 id="next-steps-heading">What happens next</h2>
        <ol>
          <li>Install the selected firmware and select <strong>Next</strong> in ESP Web Tools.</li>
          <li>Select <strong>Add to Home Assistant</strong> and approve the discovered ESPHome device.</li>
          <li>Return here. The helper will import it into ESPHome Builder and continue.</li>
        </ol>
      </section>
      <p class="info-band">${t === "wifi" ? "Use a USB data cable. ESP Web Tools asks for your Wi-Fi network and password and sends them directly to your meter. This helper does not store or send those credentials to Home Assistant." : "Use a USB data cable, connect Ethernet and power, then wait for an address from DHCP."}</p>
      `}
      <button class="rescan" data-action="rescan" ?disabled=${!!c} @click=${r}>${c === "rescan" ? "Rescanning…" : "Rescan for device"}</button>
    </section>
  `;
}
function Kt(n, e, t, i, s, r = null, o = !1) {
  return h`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((a) => h`<li>${a.source}: ${a.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([a, c]) => h`<div data-target=${a}>${Ke(c)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([a, c]) => h`<div data-target=${a}>${Ye(c)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${t?.evidence.join(", ") || "No build evidence."}</p><p>${t?.progress.join(", ") || "No transaction progress."}</p>
          ${t?.validation_detail ? h`<p>Validation code ${t.validation_detail.code ?? "unavailable"}; ${t.validation_detail.error_record_count} error records; ${t.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${t?.upload_progress?.length ? h`<ul>${t.upload_progress.map((a) => h`<li>${a.stage}: ${a.percentage ?? "in progress"}${a.percentage != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Calibration completion record</h3><p>${r ? `Restart-verified ${r.source_authority.replaceAll("_", " ")} calibration record` : o ? "No-change completion; no restart-verified record was created" : "Not yet established"}</p><p>${r ? `Verification ${r.verification_id}, generation ${r.connection_generation}; ${r.offset_groups?.length ?? 0} voltage/current offset tables; ${r.power_offset_groups?.length ?? 0} power-offset tables.` : o ? "The server confirmed there were no pending gain or offset changes." : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function Xs(n, e, t, i, s, r, o, a, c, l) {
  const f = !!(r?.offset_groups?.length || r?.power_offset_groups?.length), p = r?.source_authority === "saved_flash" && r.config_filename && !f && (r.source_handoff_available || r.source_handoff_firmware_installed);
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      ${r && f ? h`<div class="success-band" role="status">Setup and exact restart verification are complete. Offset calibration remains saved in flash; YAML handoff and flash clearing are unavailable.</div>` : r?.source_authority === "configuration" ? h`<div class="success-band" role="status">Calibration saved to YAML; flash values cleared.</div>` : r ? h`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : o ? h`<div class="success-band" role="status">Completed without calibration changes. No restart or restart-verified calibration record was required.</div>` : h`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${a ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${r?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${r?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${Kt(n, e, t, i, s, r, o)}
      <footer class="action-footer"><button class="secondary" @click=${l}>Back</button>
        ${p ? h`<button class="primary" data-action="save-calibration" @click=${c}>${r?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : ""}
      </footer>
    </section>
  `;
}
function Yt(n) {
  const e = n.addon_count, t = n.evidence.map((i) => i.source);
  return e < 0 || e > 6 || n.board_count !== e + 1 || n.ct_count !== 6 * (e + 1) || n.group_count !== 2 * (e + 1) || n.evidence.length < 1 || n.evidence.length > 5 || new Set(t).size !== t.length || !t.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || n.evidence.some((i) => i.addon_count !== e);
}
function Js(n, e, t, i, s = !1, r = !1, o = null, a = () => {
}) {
  const c = s || Yt(n);
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="identity-strip">
        <strong>${n.project_name}</strong>
        <span>Version ${e ?? "unavailable"}</span>
        <span>${n.board_count} boards</span><span>${n.ct_count} CTs</span>
        <span>${n.group_count} groups</span><span>${n.connection_type}</span>
      </div>
      <h2>Topology evidence</h2>
      <table class="evidence-table">
        <thead><tr><th>Source</th><th>Add-ons</th><th>Evidence</th></tr></thead>
        <tbody>${n.evidence.map((l) => h`
          <tr><td>${l.source.replaceAll("_", " ")}</td><td>${l.addon_count}</td><td>${l.detail}</td></tr>
        `)}</tbody>
      </table>
      ${o ? Wt(o, a) : ""}
      ${c ? h`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : h`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${t}>Back</button>
        ${c ? "" : h`<button class="primary" data-action="continue" ?disabled=${r} @click=${i}>${r ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
function Qs(n, e, t, i, s = [], r, o, a, c, l, f, p, _, y) {
  const d = i.length, u = i.slice(0, d).every((T) => Number.isFinite(T) && T > 0), g = t === 0 ? ["meter_main1", "meter_main2"] : [`addon${t}_1`, `addon${t}_2`], k = new Set(o.flatMap((T) => T.state === "applied_pending_restart_verification" && T.gain_evidence?.flash_saved ? [T.gain_evidence.instance_id] : [])), x = k.size === g.length && g.every((T) => k.has(T)), v = o.find((T) => T.retry_allowed) ?? null, m = o.some((T) => T.state !== "applied_pending_restart_verification" && !T.retry_allowed), U = t === 0 ? "Main Board" : `Add-on ${t}`;
  return h`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Dt(u, r, x ? o[0] ?? null : null)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: n?.board_count ?? 1 }, (T, $) => h`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${$}`} aria-controls="voltage-board-panel"
          aria-selected=${$ === t} tabindex=${$ === t ? "0" : "-1"}
          @keydown=${(w) => xe(w, $)}
          @click=${() => c($)}>${$ === 0 ? "Main Board" : `Add-on ${$}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${t}`}>
      <h2>Calibrate Voltage</h2>
      ${Nt(e, g, "Voltage", k)}
      <div class="reference-block">
        ${Array.from({ length: d }, (T, $) => h`<label>${s[$] ?? (d === 1 ? "Trusted instrument" : `Voltage ${$ + 1}`)} trusted reference
          <input type="number" min="0.01" step="0.01" .value=${i[$] ? String(i[$]) : ""}
            @input=${(w) => l($, Number(w.target.value))} /></label>`)}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${f} ?disabled=${a}>${a ? "Loading live voltage data…" : "Check stability"}</button>
        <button class="primary" @click=${p} ?disabled=${a || !u || !r?.stable || m || x && !v}>${v ? "Retry voltage calibration" : "Calibrate voltage"}</button></div>
      ${r ? h`<div class=${r.stable ? "success-band" : "warning-band"} role="status">${r.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${Ke(r)}
      ${x ? h`<div class="success-band" role="status">Voltage calibration complete for ${U}.</div>` : ""}
      ${o.map((T) => Ye(T))}
      ${o.some((T) => T.state === "indeterminate") ? h`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${_}>Reconnect and inspect</button><button class="danger" @click=${y}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const en = ei`
  :host {
    --accent: var(--primary-color, #00639b);
    --on-accent: var(--text-primary-color, #fff);
    --surface: var(--ha-card-background, var(--card-background-color, #fff));
    --surface-alt: var(--secondary-background-color, #f1f3f4);
    --text: var(--primary-text-color, #212121);
    --muted: var(--secondary-text-color, #727272);
    --border: var(--divider-color, #e0e0e0);
    --success: var(--success-color, #0f7b55);
    --danger: var(--error-color, #b3261e);
    --focus: var(--primary-color, #00639b);
    --radius: var(--ha-card-border-radius, var(--ha-border-radius-lg, 12px));
    --radius-small: var(--ha-border-radius-md, 8px);
    display: block;
    min-height: 100vh;
    color: var(--text);
    background: var(--primary-background-color, #fafafa);
    font-family: var(--ha-font-family-body, Roboto, Noto, sans-serif);
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-normal, 400);
    line-height: var(--ha-line-height-normal, 1.6);
    -webkit-font-smoothing: var(--ha-font-smoothing, antialiased);
    -moz-osx-font-smoothing: var(--ha-moz-osx-font-smoothing, grayscale);
    overflow-x: hidden;
  }
  * { box-sizing: border-box; }
  button, input, select { font: inherit; color: inherit; }
  button, input, select, summary { min-height: 44px; }
  button { border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius-small); padding: 0.65rem 1rem; cursor: pointer; font-weight: var(--ha-font-weight-action, 500); }
  button:hover:not(:disabled) { border-color: var(--accent); background: var(--surface-alt); }
  button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  input:not([type="radio"]):not([type="checkbox"]), select { background: var(--surface); border-color: var(--border); border-radius: var(--radius-small); }
  input[type="radio"], input[type="checkbox"] { accent-color: var(--accent); }
  .primary, .rescan { color: var(--on-accent); background: var(--accent); border-color: var(--accent); }
  .primary:hover:not(:disabled), .rescan:hover:not(:disabled) { background: var(--accent); }
  .secondary { color: var(--accent); background: var(--surface); border-color: var(--accent); }
  .danger { color: var(--danger); border-color: var(--danger); background: var(--surface); }
  .app { display: grid; grid-template-columns: 232px minmax(0, 1fr); min-height: 100vh; }
  aside.workflow { background: var(--surface); color: var(--text); padding: 24px 16px; border-right: 1px solid var(--border); }
  .brand { color: var(--text); font-size: var(--ha-font-size-xl, 20px); font-weight: var(--ha-font-weight-medium, 500); margin: 0 8px 28px; }
  nav ol { list-style: none; margin: 0; padding: 0; }
  nav li { position: relative; min-height: 60px; }
  nav li:not(:last-child)::after { content: ""; position: absolute; left: 25px; top: 42px; width: 1px; height: 20px; background: var(--border); }
  .step-button { display: grid; grid-template-columns: 36px 1fr; gap: 10px; align-items: center; width: 100%; padding: 4px 8px; border: 0; background: transparent; color: inherit; text-align: left; font-weight: var(--ha-font-weight-medium, 500); }
  .step-button .number { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--border); border-radius: 50%; }
  li.current .step-button { color: var(--accent); background: var(--surface-alt); font-weight: var(--ha-font-weight-bold, 700); }
  li.current .number { color: var(--on-accent); background: var(--accent); border-color: var(--accent); }
  main { min-width: 0; padding: 32px 40px 88px; }
  .mobile-progress { display: none; }
  .product-title { font-size: var(--ha-font-size-3xl, 28px); line-height: var(--ha-line-height-condensed, 1.2); font-weight: var(--ha-font-weight-normal, 400); margin: 0 0 24px; }
  h1 { margin: 0 0 20px; font-size: var(--ha-font-size-2xl, 24px); line-height: var(--ha-line-height-condensed, 1.2); font-weight: var(--ha-font-weight-normal, 400); }
  h2 { margin: 24px 0 8px; font-size: var(--ha-font-size-xl, 20px); font-weight: var(--ha-font-weight-medium, 500); }
  h3 { font-size: var(--ha-font-size-l, 16px); font-weight: var(--ha-font-weight-medium, 500); }
  p { color: var(--muted); }
  .step-content { max-width: 1320px; }
  fieldset { border: 0; margin: 0 0 26px; padding: 0; }
  legend { font-size: var(--ha-font-size-xl, 20px); font-weight: var(--ha-font-weight-medium, 500); }
  .name-mode { display: grid; gap: 8px; }
  .name-mode label { display: flex; align-items: center; gap: 8px; }
  .name-mode input { margin: 0; }
  .choice-field > p { margin: 3px 0 12px; }
  .addon-options { display: grid; grid-template-columns: repeat(7, minmax(52px, 1fr)); gap: 12px; max-width: 760px; }
  .addon-options label, .connection-options label { display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-small); background: var(--surface); cursor: pointer; }
  .addon-options label:focus-within, .connection-options label:focus-within, .meter-row:focus-within { outline: 2px solid var(--focus); outline-offset: 2px; }
  .addon-options label { justify-content: center; min-height: 56px; font-size: var(--ha-font-size-l, 16px); font-weight: var(--ha-font-weight-medium, 500); }
  .addon-options input, .connection-options input, .meter-row input { position: absolute; opacity: 0; pointer-events: none; }
  .addon-options .selected { color: var(--on-accent); background: var(--accent); border-color: var(--accent); }
  .connection-options { display: grid; gap: 10px; max-width: 760px; }
  .connection-options label { min-height: 58px; padding: 0 20px; font-size: var(--ha-font-size-l, 16px); font-weight: var(--ha-font-weight-medium, 500); }
  .connection-options label::before { content: ""; width: 22px; height: 22px; margin-right: 22px; border: 2px solid var(--border); border-radius: 50%; }
  .connection-options .selected { border-color: var(--accent); }
  .connection-options .selected::before { border: 6px solid var(--accent); }
  .summary-band, .info-band, .success-band, .warning-band, .status-band { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; }
  dl { margin: 0; }
  dl div { display: flex; gap: 12px; }
  dt { font-weight: var(--ha-font-weight-bold, 700); }
  dd { margin: 0; }
  .summary-band strong, .success-band { color: var(--success); }
  .esp-web-installer {
    --esp-tools-button-color: var(--accent);
    --esp-tools-button-text-color: var(--on-accent);
    --esp-tools-button-border-radius: var(--radius-small);
  }
  .esp-web-installer [slot="activate"] { min-height: 44px; color: var(--on-accent); background: var(--accent); border-color: var(--accent); }
  .esp-web-installer [slot="activate"]:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
  .error-panel, .recovery-panel { display: grid; gap: 6px; margin-top: 16px; padding: 16px; border: 1px solid var(--danger); border-radius: var(--radius); color: var(--danger); background: var(--surface); }
  .error-panel span, .error-panel li, .recovery-panel p { color: var(--text); }
  .meter-list { display: grid; gap: 10px; }
  .meter-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); cursor: pointer; }
  .meter-row.selected { border-color: var(--accent); background: var(--surface-alt); }
  .meter-row small { display: block; color: var(--muted); }
  .identity-strip { display: flex; flex-wrap: wrap; gap: 16px 28px; padding: 14px 18px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 12px; border-bottom: 1px solid var(--border); text-align: left; }
  .board-tabs, .target-tabs { display: flex; gap: 18px; overflow-x: auto; border-bottom: 1px solid var(--border); }
  .board-tabs button, .target-tabs button { flex: 0 0 auto; border: 0; border-radius: 0; background: transparent; }
  .board-tabs button[aria-selected="true"], .target-tabs button[aria-pressed="true"] { color: var(--accent); border-bottom: 2px solid var(--accent); }
  .ct-table { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); overflow: hidden; }
  .ct-header, .ct-row { display: grid; grid-template-columns: .45fr 1.45fr 1.4fr .8fr .8fr .9fr .7fr .9fr; align-items: center; gap: 14px; padding: 11px 16px; }
  .ct-header { font-weight: var(--ha-font-weight-bold, 700); background: var(--surface-alt); }
  .ct-row { min-height: 66px; border-top: 1px solid var(--border); }
  .ct-index { font-weight: var(--ha-font-weight-bold, 700); }
  .ct-row input, .ct-row select { width: 100%; min-width: 0; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-small); }
  .row-toggle { color: var(--accent); border: 0; padding: 4px; }
  .mobile-label { display: none; }
  .ct-detail { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 32px; padding: 16px 30px; background: var(--surface-alt); border-top: 1px solid var(--border); }
  .row-count { color: var(--muted); padding-left: 12px; }
  pre { max-height: 260px; overflow: auto; padding: 16px; color: var(--text); background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-small); white-space: pre-wrap; }
  .config-diff { white-space: pre; font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace; }
  .diff-line { display: block; min-width: max-content; }
  .diff-line.added { background: color-mix(in srgb, var(--success) 14%, var(--surface)); }
  .diff-line.removed { background: color-mix(in srgb, var(--danger) 14%, var(--surface)); }
  .status-list, .summary-list { display: grid; gap: 8px; }
  .confirmation-actions { display: flex; gap: 12px; margin-top: 20px; }
  .check-row { display: flex; align-items: center; gap: 10px; }
  .meter-settings-grid, .voltage-reference-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; max-width: 860px; }
  .meter-settings-grid label, .voltage-reference-card label { display: grid; gap: 6px; font-weight: var(--ha-font-weight-bold, 700); }
  .meter-settings-grid input, .meter-settings-grid select, .voltage-reference-card input, .voltage-reference-card select { width: 100%; padding: 10px; border: 1px solid var(--border); }
  .voltage-reference-card { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding: 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
  .reference-block { display: grid; max-width: 420px; gap: 12px; }
  .reference-block label { display: grid; gap: 6px; font-weight: var(--ha-font-weight-bold, 700); }
  .calibration-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 18px 0 10px; }
  .calibration-step input { padding: 10px; border: 1px solid var(--border); }
  .group-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
  .group-grid section { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); overflow: hidden; }
  .group-grid h2 { margin: 0; padding: 10px; border-bottom: 1px solid var(--border); }
  .group-grid button { width: 33.333%; border-width: 0 1px 0 0; border-radius: 0; }
  .group-grid button.selected { color: var(--accent); border-color: var(--accent); }
  .progress-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; margin: 20px 0; padding: 18px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); list-style: none; }
  .progress-steps li { display: flex; gap: 6px; padding: 8px; }
  .progress-steps .complete { color: var(--muted); background: var(--surface-alt); }
  .progress-steps .active { color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); font-weight: var(--ha-font-weight-bold, 700); }
  .progress-steps .pending { color: var(--text); }
  .offset-stage-stepper { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 0 0 20px; padding: 0; list-style: none; }
  .offset-stage-stepper button { width: 100%; text-align: left; }
  .offset-stage-stepper .active button { color: var(--on-accent); background: var(--accent); border-color: var(--accent); }
  .offset-stage-stepper .complete button { color: var(--success); border-color: var(--success); }
  .offset-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 18px 0; }
  .action-footer.offset-footer { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; }
  .offset-footer > :first-child { justify-self: start; }
  .offset-footer > :last-child { justify-self: end; }
  .threshold-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 24px; margin: 12px 0; }
  .measurement-evidence { margin: 14px 0; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-alt); }
  .measurement-evidence h3 { margin-top: 0; }
  .measurement-evidence dl, .evidence-list, .upload-progress { display: grid; gap: 6px; }
  details { margin-top: 18px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); overflow: hidden; }
  summary { display: flex; align-items: center; padding: 12px 16px; cursor: pointer; font-weight: var(--ha-font-weight-bold, 700); }
  .technical-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 28px; padding: 0 16px 16px; }
  .action-footer { position: fixed; z-index: 2; right: 0; bottom: 0; left: 232px; display: flex; justify-content: space-between; padding: 14px 34px; background: var(--surface); border-top: 1px solid var(--border); box-shadow: 0 -2px 8px rgb(0 0 0 / 8%); }
  .action-footer.single { justify-content: flex-end; }
  .sr-status { position: fixed; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; } }
  @media (max-width: 720px) {
    .app { display: block; }
    aside.workflow { display: none; }
    aside.workflow.mobile-open { display: block; position: fixed; z-index: 5; inset: 0 18% 0 0; overflow-y: auto; box-shadow: 10px 0 24px rgb(0 0 0 / 28%); }
    main { padding: 22px 18px 92px; }
    .product-title { font-size: 23px; text-align: center; padding-bottom: 18px; border-bottom: 1px solid var(--border); }
    .mobile-progress { display: flex; justify-content: space-between; align-items: center; margin: 0 -18px 24px; padding: 12px 18px; background: var(--surface); border-bottom: 1px solid var(--border); }
    h1 { font-size: 22px; }
    .addon-options { grid-template-columns: repeat(7, minmax(42px, 1fr)); gap: 6px; }
    .addon-options label { min-height: 52px; }
    .ct-header { display: none; }
    .ct-row { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .ct-row > * { min-width: 0; }
    .mobile-label { display: block; color: var(--muted); font-size: 12px; font-weight: 700; }
    .ct-detail, .technical-grid, .group-grid, .offset-stage-stepper, .threshold-grid, .meter-settings-grid, .voltage-reference-cards, .voltage-reference-card { grid-template-columns: 1fr; }
    .progress-steps { grid-template-columns: 1fr; gap: 8px; }
    .action-footer { left: 0; padding: 12px 18px; }
    .offset-step { padding-bottom: 84px; }
    .identity-strip, .confirmation-actions, .group-nav { align-items: stretch; flex-direction: column; }
    .evidence-table { display: block; overflow-x: auto; }
  }
`, le = [
  ["setup", "Setup Device"],
  ["meter", "Meter Settings"],
  ["ct", "Circuits & CTs"],
  ["safety", "Safety"],
  ["offset", "Offset"],
  ["voltage", "Voltage"],
  ["current", "Current"],
  ["restart", "Restart"],
  ["build", "Flash & Verify"],
  ["summary", "Summary"]
], tn = "circuitsetup.6c-energy-meter", sn = 1e4, nn = 250, St = (n) => new Promise((e) => setTimeout(e, n));
class rn extends he {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.addonCount = 0, this.packageOptions = J(0), this.sourcePackageOptions = J(0), this.connection = "wifi", this.electricalSystem = "split_phase_120_240", this.lineFrequencyHz = 60, this.electricalProfileConfirmed = !1, this.meterSettingsDraft = null, this.meterConfiguration = null, this.multiReferencePreparationAcknowledged = !1, this.meterFrequencyTouched = !1, this.meterNominalVoltageTouched = /* @__PURE__ */ new Set(), this.board = 0, this.group = 0, this.channel = 1, this.voltageReferences = /* @__PURE__ */ new Map(), this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.firmwareIndex = null, this.firmwareCatalogState = "idle", this.firmwareCatalogError = "", this.selectedEspHomeVersion = null, this.resolvedFirmwareOptions = [], this.firmwareFetchController = null, this.setupDeviceIds = /* @__PURE__ */ new Set(), this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.setupUnsub = null, this.sessionStarting = !1, this.pendingAction = "", this.importFailedDeviceId = null, this.newInstallDeviceId = null, this.voltageBusy = !1, this.offsetBusy = !1, this.finishBusy = !1, this.restartBusy = !1, this.voltageSkipped = !1, this.currentSkipped = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = en;
  }
  static {
    this.properties = {
      hass: { attribute: !1 },
      panel: { attribute: !1 }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    const e = ++this.connectionGeneration;
    this.loadFirmwareIndex(), this.ensureApi(e);
  }
  disconnectedCallback() {
    ++this.connectionGeneration, ++this.operationGeneration, ++this.transactionSubscriptionScope, ++this.sessionSubscriptionScope;
    for (const e of this.unsubs.splice(0))
      try {
        e();
      } catch {
      }
    this.transactionUnsub = null, this.sessionUnsub = null, this.setupUnsub = null, this.api = null, this.firmwareFetchController?.abort(), this.firmwareFetchController = null, this.firmwareIndex = null, this.firmwareCatalogState = "idle", this.firmwareCatalogError = "", this.resolvedFirmwareOptions = [], this.setupDeviceIds = /* @__PURE__ */ new Set(), this.newInstallDeviceId = null, this.pendingAction = "", super.disconnectedCallback();
  }
  updated(e) {
    (e.has("hass") || e.has("panel")) && this.isConnected && this.ensureApi(this.connectionGeneration), this.error ? this.shadowRoot?.querySelector("[role=alert]")?.focus() : this.focusHeading && (this.focusHeading = !1, this.shadowRoot?.querySelector("#step-heading")?.focus());
  }
  async ensureApi(e) {
    if (this.api || !this.isConnected || !this.hass || !this.panel?.config.entry_id) return;
    const t = new Se(this.hass, this.panel.config.entry_id);
    this.api = t;
    try {
      const i = await t.setupStatus();
      if (!this.owns(e, t)) return;
      this.setup = i, this.setupDeviceIds = new Set(i.devices.map((r) => r.entry_id));
      const s = this.setup.installer_intent;
      s && (this.addonCount = s.addon_count, this.connection = s.connection_type, this.packageOptions = s.power_quality && s.status_fields ? { power_quality: [...s.power_quality], status_fields: [...s.status_fields] } : J(s.addon_count), this.sourcePackageOptions = J(s.addon_count), s.electrical_system !== void 0 && s.line_frequency_hz !== void 0 ? (this.electricalSystem = s.electrical_system, this.lineFrequencyHz = s.line_frequency_hz, this.electricalProfileConfirmed = !0) : (this.electricalSystem = "split_phase_120_240", this.lineFrequencyHz = 60, this.electricalProfileConfirmed = !1), this.refreshFirmwareOptions()), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.firstDeviceId(this.setup.devices)), await this.subscribeSetup(e, t), this.transaction && await this.subscribeTransaction(e), this.session && this.session.state !== "cancelled" && await this.subscribeSession(e);
    } catch (i) {
      this.owns(e, t) && this.fail(i, "Setup status could not be loaded.");
    }
    this.requestUpdate();
  }
  owns(e, t) {
    return this.isConnected && e === this.connectionGeneration && t === this.api;
  }
  ownsFirmwareCatalog(e, t) {
    return this.isConnected && e === this.connectionGeneration && t === this.firmwareFetchController;
  }
  async subscribeSetup(e, t) {
    await this.ownSubscription(t.subscribeSetup((i) => {
      this.owns(e, t) && this.receiveSetupSnapshot(i, !0);
    }), e, t, () => this.setupUnsub === null, (i) => {
      this.setupUnsub = i;
    });
  }
  receiveSetupSnapshot(e, t) {
    const s = e.devices.filter((r) => !this.setupDeviceIds.has(r.entry_id)).sort((r, o) => r.entry_id.localeCompare(o.entry_id)).filter((r) => r.project_name.startsWith(tn));
    if (this.setup = e, this.setupDeviceIds = new Set(e.devices.map((r) => r.entry_id)), this.pendingAction) {
      this.requestUpdate();
      return;
    }
    if (this.step !== "setup" || this.topology || !s.length) return this.requestUpdate();
    if (t && s.length === 1 && !this.pendingAction) {
      const r = s[0].entry_id;
      this.newInstallDeviceId = r, this.selectDevice(r), this.announcement = "Device added to Home Assistant. Importing into ESPHome Builder…", this.adopt(r);
      return;
    }
    this.selectDevice(s.length === 1 ? s[0].entry_id : null), this.announcement = s.length > 1 ? "Multiple CircuitSetup meters were discovered. Choose one to import." : "CircuitSetup energy meter discovered.", this.requestUpdate();
  }
  loadFirmwareIndex() {
    if (this.firmwareCatalogState === "loading" || this.firmwareIndex) return;
    const e = this.connectionGeneration, t = new AbortController();
    this.firmwareFetchController?.abort(), this.firmwareFetchController = t, this.firmwareCatalogState = "loading", this.firmwareCatalogError = "", this.requestUpdate(), Os(globalThis.fetch, t.signal).then((i) => {
      this.ownsFirmwareCatalog(e, t) && (this.firmwareIndex = i, this.firmwareFetchController = null, this.firmwareCatalogState = "ready", this.refreshFirmwareOptions());
    }).catch(() => {
      this.ownsFirmwareCatalog(e, t) && (this.firmwareFetchController = null, this.firmwareCatalogState = "error", this.firmwareCatalogError = "Firmware catalog could not be loaded.", this.requestUpdate());
    });
  }
  refreshFirmwareOptions() {
    const e = this.firmwareIndex ? qs(this.firmwareIndex, this.addonCount, this.connection) : [], t = this.selectedEspHomeVersion, i = Ps(e, t);
    this.resolvedFirmwareOptions = e, this.selectedEspHomeVersion = i, t && i !== t && (this.announcement = i ? `Firmware version changed to ${i}.` : "No firmware version is available for this hardware."), this.requestUpdate();
  }
  selectFirmwareVersion(e) {
    this.resolvedFirmwareOptions.some((t) => t.version === e) && (this.selectedEspHomeVersion = e, this.requestUpdate());
  }
  retryFirmwareIndex() {
    this.firmwareCatalogError = "", this.firmwareCatalogState = "idle", this.requestUpdate(), this.loadFirmwareIndex();
  }
  selectedFirmware() {
    return this.resolvedFirmwareOptions.find((e) => e.version === this.selectedEspHomeVersion) ?? null;
  }
  ownsOperation(e, t, i) {
    return e === this.operationGeneration && t === this.api && i === this.selectedDeviceId;
  }
  async ownSubscription(e, t, i, s = () => !0, r = () => {
  }) {
    const o = await e;
    if (!this.owns(t, i) || !s()) {
      try {
        o();
      } catch {
      }
      return;
    }
    this.unsubs.push(o), r(o);
  }
  clearSubscription(e) {
    e === "transaction" ? ++this.transactionSubscriptionScope : ++this.sessionSubscriptionScope;
    const t = e === "transaction" ? this.transactionUnsub : this.sessionUnsub;
    if (e === "transaction" ? this.transactionUnsub = null : this.sessionUnsub = null, !t) return;
    const i = this.unsubs.indexOf(t);
    i >= 0 && this.unsubs.splice(i, 1);
    try {
      t();
    } catch {
    }
  }
  clearSetupSubscription() {
    const e = this.setupUnsub;
    if (this.setupUnsub = null, !e) return;
    const t = this.unsubs.indexOf(e);
    t >= 0 && this.unsubs.splice(t, 1);
    try {
      e();
    } catch {
    }
  }
  resetCalibrationRun() {
    this.safetyAcknowledged = !1, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.group = 0, this.channel = 1, this.voltageReferences = /* @__PURE__ */ new Map(), this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.finishBusy = !1, this.restartBusy = !1, this.voltageSkipped = !1, this.currentSkipped = !1;
  }
  selectDevice(e) {
    ++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = e, e !== this.newInstallDeviceId && (this.newInstallDeviceId = null), this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.meterSettingsDraft = null, this.meterConfiguration = null, this.multiReferencePreparationAcknowledged = !1, this.meterFrequencyTouched = !1, this.meterNominalVoltageTouched = /* @__PURE__ */ new Set(), this.board = 0, this.resetCalibrationRun();
  }
  firstDeviceId(e) {
    return e.map((t) => t.entry_id).sort((t, i) => t.localeCompare(i))[0] ?? null;
  }
  showTopology(e) {
    this.topology = e, this.error = Yt(e) || e.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
  }
  showTopologyResult(e) {
    "topology" in e && e.topology ? (e.package_options && (this.selectedDeviceId !== this.newInstallDeviceId && (this.packageOptions = {
      power_quality: [...e.package_options.power_quality],
      status_fields: [...e.package_options.status_fields]
    }), this.sourcePackageOptions = {
      power_quality: [...e.package_options.power_quality],
      status_fields: [...e.package_options.status_fields]
    }), this.showTopology(e.topology)) : (this.sourcePackageOptions = null, this.showTopology(e));
  }
  setAddonCount(e) {
    this.addonCount = e, this.packageOptions = js(this.packageOptions, e), this.sourcePackageOptions = J(e), this.refreshFirmwareOptions();
  }
  setElectricalSystem(e) {
    this.electricalSystem = e;
    const t = e === "split_phase_120_240" ? 60 : e === "single_phase_230" ? 50 : null;
    this.lineFrequencyHz = t, this.electricalProfileConfirmed = !1, this.requestUpdate();
  }
  setLineFrequency(e) {
    this.lineFrequencyHz = e, this.electricalProfileConfirmed = !1, this.requestUpdate();
  }
  confirmElectricalProfile() {
    this.lineFrequencyHz !== null && (this.electricalProfileConfirmed = !0, this.announcement = `Electrical profile confirmed: ${this.electricalSystem.replaceAll("_", " ")}, ${this.lineFrequencyHz} Hz.`, this.requestUpdate());
  }
  showInventory(e) {
    this.inventory = e, this.drafts = new Map(e.channels.map((t) => {
      const i = t.selected_model_id ?? "", s = e.catalog.presets.find((r) => r.model_id === i);
      return [t.channel, {
        name: t.name,
        modelId: i,
        multiplier: t.reporting_multiplier,
        customGainCt: i === "custom" || t.selected_model_id === null ? t.raw_gain_ct * t.reporting_multiplier : void 0,
        customLabel: t.display_label ?? void 0,
        burdenAcknowledged: t.selection_verified_against_config && (i === "custom" || s?.requires_burden_jumper_cut === !0),
        expanded: t.selected_model_id === null && t.raw_gain_ct === 27518
      }];
    })), this.navigate("ct"), this.error = "", this.requestUpdate();
  }
  showState(e) {
    this.navigate(e);
  }
  navigate(e) {
    this.step = e, this.error = "", this.mobileStepsOpen = !1, this.focusHeading = !0, this.requestUpdate();
  }
  back() {
    this.step === "meter" ? this.navigate("setup") : this.step === "ct" ? this.navigate("meter") : this.step === "safety" ? this.cancelSession("ct") : this.step === "offset" ? this.navigate("safety") : this.step === "voltage" ? this.navigate("offset") : this.step === "current" ? this.navigate("voltage") : this.step === "restart" ? this.navigate("current") : this.step === "build" ? this.navigate(this.calibrationHandoff ? "restart" : "ct") : this.step === "summary" && this.navigate("build");
  }
  returnToSetup() {
    this.session && this.session.state !== "cancelled" ? this.cancelSession("setup") : (this.selectDevice(null), this.navigate("setup"));
  }
  async configureDevice(e) {
    if (!this.pendingAction) {
      this.newInstallDeviceId = null, this.selectDevice(e), this.pendingAction = `topology:${e}`, this.requestUpdate();
      try {
        await this.loadTopology();
      } finally {
        this.pendingAction = "", this.requestUpdate();
      }
    }
  }
  selectedProjectVersion() {
    return this.setup?.devices.find((e) => e.entry_id === this.selectedDeviceId)?.project_version ?? null;
  }
  selectedProjectName() {
    return this.setup?.devices.find((e) => e.entry_id === this.selectedDeviceId)?.project_name ?? null;
  }
  showRecovery(e) {
    e === "calibration_outcome_indeterminate" ? (this.navigate("current"), this.calibrationByTarget = new Map(this.calibrationByTarget).set(`current:${this.channel}`, {
      state: e,
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
    })) : (this.navigate("restart"), this.session ? this.session = { ...this.session, state: e } : this.error = "Restart verification failed; review rollback and recovery evidence."), this.requestUpdate();
  }
  async rescan() {
    if (!this.api || this.pendingAction) return;
    this.pendingAction = "rescan", this.requestUpdate();
    const e = this.api, t = this.selectedDeviceId, i = new Set(this.setupDeviceIds), s = ++this.operationGeneration;
    await this.run(async () => {
      if (await e.setInstallerIntent(
        this.addonCount,
        this.connection,
        this.selectedFirmware(),
        this.packageOptions,
        this.electricalProfileConfirmed ? this.electricalSystem : null,
        this.electricalProfileConfirmed && this.lineFrequencyHz !== null ? this.lineFrequencyHz : null
      ), !this.ownsOperation(s, e, t)) return;
      const r = await e.rescan();
      this.ownsOperation(s, e, t) && (this.pendingAction = "", this.setupDeviceIds = i, this.receiveSetupSnapshot(r, !0), r.devices.length || (this.announcement = "No compatible meter found. Check the network and rescan."));
    }, "Rescan failed.", () => this.ownsOperation(s, e, t)), this.pendingAction === "rescan" && (this.pendingAction = ""), this.requestUpdate();
  }
  async adopt(e = this.selectedDeviceId) {
    if (!this.api || !e || this.pendingAction) return;
    e !== this.selectedDeviceId && this.selectDevice(e);
    const t = this.api, i = ++this.operationGeneration, s = this.connectionGeneration;
    this.pendingAction = `adopt:${e}`, this.importFailedDeviceId = null, this.error = "", this.requestUpdate();
    try {
      if (await t.adoptDevice(e), !this.ownsOperation(i, t, e)) return;
      this.clearSetupSubscription();
      const r = await this.waitForBinding(t, e, i);
      if (!this.ownsOperation(i, t, e) || (this.setup = r, this.setupDeviceIds = new Set(r.devices.map((c) => c.entry_id)), await this.subscribeSetup(s, t), !this.ownsOperation(i, t, e))) return;
      const o = await t.getMeterConfiguration(e);
      if (!this.ownsOperation(i, t, e)) return;
      this.setMeterConfiguration(o);
      const a = await t.getTopology(e);
      if (!this.ownsOperation(i, t, e)) return;
      this.importFailedDeviceId = null, this.announcement = "Meter imported into ESPHome Builder.", this.showTopologyResult(a);
    } catch (r) {
      if (!this.ownsOperation(i, t, e)) return;
      this.importFailedDeviceId = e;
      const o = r.code === "device_busy" ? "Finish or cancel current work before importing another meter." : r instanceof Error && r.message === "helper rebind timed out" ? "Import completed, but Home Assistant is still reconnecting. Retry import or reload the helper." : this.safeErrorMessage(r, "Adoption is unavailable for this meter.");
      this.fail(r, o);
    } finally {
      this.ownsOperation(i, t, e) && (this.pendingAction = "", this.requestUpdate());
    }
  }
  async waitForBinding(e, t, i) {
    const s = Date.now() + sn;
    for (; this.ownsOperation(i, e, t); ) {
      const r = s - Date.now();
      if (r <= 0) break;
      try {
        const o = await Promise.race([
          e.setupStatus(),
          St(r).then(() => {
            throw new Error("helper rebind timed out");
          })
        ]);
        if (o.bound_device_id === t) return o;
      } catch (o) {
        if (o.code !== "capability_unavailable") throw o;
      }
      if (Date.now() >= s) break;
      await St(Math.min(nn, s - Date.now()));
    }
    throw new Error("helper rebind timed out");
  }
  async loadTopology() {
    if (!this.api || !this.selectedDeviceId) return;
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      const s = await e.getTopology(t);
      this.ownsOperation(i, e, t) && this.showTopologyResult(s);
    }, "Topology evidence could not be loaded.", () => this.ownsOperation(i, e, t));
  }
  async loadInventory() {
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    this.pendingAction = "inventory", this.requestUpdate();
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    try {
      await this.run(async () => {
        if (!this.meterConfiguration) {
          const s = await e.getMeterConfiguration(t);
          this.setMeterConfiguration(s);
        }
        this.ownsOperation(i, e, t) && this.navigate("meter");
      }, "Meter settings could not be loaded.", () => this.ownsOperation(i, e, t));
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
  }
  setMeterConfiguration(e) {
    this.meterConfiguration = e, this.meterSettingsDraft = {
      ...e.configuration.meter,
      authoritative: e.capabilities.configuration_authoritative,
      warnings: e.warnings
    }, this.multiReferencePreparationAcknowledged = e.configuration.multi_reference_preparation_acknowledged === !0, this.meterFrequencyTouched = !1, this.meterNominalVoltageTouched = /* @__PURE__ */ new Set();
  }
  setMeterProfile(e) {
    if (!this.meterSettingsDraft) return;
    const t = e === "split_phase_120_240" ? { frequency: 60, voltage: 120 } : e === "single_phase_230" ? { frequency: 50, voltage: 230 } : null;
    this.meterSettingsDraft = {
      ...this.meterSettingsDraft,
      electrical_system: e,
      ...t && !this.meterFrequencyTouched ? { line_frequency_hz: t.frequency } : {},
      ...t ? { voltage_references: this.meterSettingsDraft.voltage_references.map((i) => this.meterNominalVoltageTouched.has(i.reference_id) ? i : { ...i, nominal_voltage_v: t.voltage }) } : {}
    }, this.requestUpdate();
  }
  setMeterFrequency(e) {
    this.meterSettingsDraft && (this.meterFrequencyTouched = !0, this.meterSettingsDraft = { ...this.meterSettingsDraft, line_frequency_hz: e }, this.requestUpdate());
  }
  setMeterNominalVoltage(e, t) {
    this.meterSettingsDraft && (this.meterNominalVoltageTouched = new Set(this.meterNominalVoltageTouched).add(e), this.meterSettingsDraft = { ...this.meterSettingsDraft, voltage_references: this.meterSettingsDraft.voltage_references.map((i) => i.reference_id === e ? { ...i, nominal_voltage_v: t } : i) }, this.requestUpdate());
  }
  async continueFromMeterSettings() {
    if (!this.api || !this.selectedDeviceId || !this.meterSettingsDraft || this.pendingAction) return;
    this.pendingAction = "inventory", this.requestUpdate();
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    try {
      await this.run(async () => {
        const s = await e.getCtInventory(t);
        this.ownsOperation(i, e, t) && this.showInventory(s);
      }, "CT inventory could not be loaded.", () => this.ownsOperation(i, e, t));
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
  }
  async recoverCtInventory(e, t, i, s) {
    const r = await e.getCtInventory(t);
    this.ownsOperation(i, e, t) && (this.clearSubscription("transaction"), this.transaction = null, this.showInventory(r), this.drafts = new Map(Array.from(this.drafts, ([o, a]) => [o, s.get(o) ?? a])), this.announcement = "Live CT data reloaded. Review the preserved changes again.");
  }
  updateDraft(e, t) {
    const i = this.drafts.get(e);
    i && (this.drafts = new Map(this.drafts).set(e, { ...i, ...t }), this.requestUpdate());
  }
  updateCircuitConfiguration(e) {
    this.meterConfiguration && (this.meterConfiguration = { ...this.meterConfiguration, configuration: e }, this.requestUpdate());
  }
  disableCircuit(e) {
    if (!this.meterConfiguration) return;
    const t = this.meterConfiguration.configuration.aggregates.filter((i) => !i.channels.includes(e));
    t.length !== this.meterConfiguration.configuration.aggregates.length && !window.confirm(`Marking CT${e} unused removes it from aggregate totals. Continue?`) || this.updateCircuitConfiguration({
      ...this.meterConfiguration.configuration,
      channels: this.meterConfiguration.configuration.channels.map((i) => i.channel === e ? { ...i, enabled: !1, role: "unused" } : i),
      aggregates: t
    });
  }
  hasPackageChanges() {
    return !!(this.sourcePackageOptions && ["power_quality", "status_fields"].some((e) => this.packageOptions[e].some((t, i) => t !== this.sourcePackageOptions?.[e][i])));
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    let e = ne(this.inventory, this.drafts);
    if (!e.length && !this.hasPackageChanges())
      return this.fail(new Error(), "Select at least one configuration change before review.");
    const t = this.api, i = this.selectedDeviceId, s = this.inventory, r = ++this.operationGeneration;
    if (this.clearSubscription("transaction"), this.transaction = null, this.labelOnly && e.length) {
      const o = e.filter((a) => a.name !== this.inventory.channels.find((c) => c.channel === a.channel)?.name).map(({ channel: a, name: c }) => ({ channel: a, name: c }));
      if (!o.length || e.some((a) => {
        const c = this.inventory.channels.find((l) => l.channel === a.channel);
        return !c || a.model_id !== (c.selected_model_id ?? "") || (a.reporting_multiplier ?? 1) !== c.reporting_multiplier;
      }))
        return this.fail(new Error(), "Home Assistant label mode only permits display-name edits.");
      if (await this.run(
        async () => {
          await t.setHaLabels(i, s.plan_id, s.source_sha256, o), this.announcement = "Home Assistant labels saved.";
        },
        "Home Assistant labels could not be saved.",
        () => this.ownsOperation(r, t, i)
      ), this.error || !this.hasPackageChanges()) return;
      e = [];
    }
    await this.run(
      async () => {
        let o;
        try {
          const a = await t.getCtInventory(i);
          if (!this.ownsOperation(r, t, i)) return;
          o = await t.previewCtConfig(
            i,
            a.plan_id,
            a.source_sha256,
            e,
            this.sourcePackageOptions ? this.packageOptions : void 0
          );
        } catch (a) {
          if (a.code !== "stale_confirmation") throw a;
          await this.recoverCtInventory(t, i, r, this.drafts);
          return;
        }
        this.ownsOperation(r, t, i) && (this.transaction = o, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "The configuration preview is stale. Reload the CT inventory and review again.",
      () => this.ownsOperation(r, t, i)
    );
  }
  async subscribeTransaction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const t = this.api;
    this.clearSubscription("transaction");
    const i = this.transactionSubscriptionScope, s = this.selectedDeviceId, r = this.transaction.transaction_id, o = this.transaction.source_sha256;
    await this.ownSubscription(
      t.subscribeConfigTransaction(
        s,
        r,
        o,
        (a) => {
          this.owns(e, t) && i === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === r && this.transaction.source_sha256 === o && a.transaction_id === r && a.source_sha256 === o && (this.transaction = a, this.requestUpdate());
        }
      ),
      e,
      t,
      () => i === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === r && this.transaction.source_sha256 === o,
      (a) => {
        this.transactionUnsub = a;
      }
    );
  }
  async continueFromCt() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || this.pendingAction) return;
    if (this.meterConfiguration && !this.labelOnly) {
      const t = this.meterConfiguration.configuration;
      if (!ns(t, this.inventory.channels.length))
        return this.fail(new Error(), "Complete the circuit and aggregate assignments before review.");
      this.pendingAction = "session";
      const i = this.api, s = this.selectedDeviceId, r = this.meterConfiguration, o = ++this.operationGeneration;
      await this.run(async () => {
        this.transaction = await i.previewMeterConfiguration(s, r.plan_id, r.source_sha256, t), this.ownsOperation(o, i, s) && (this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      }, "Circuit configuration could not be reviewed.", () => this.ownsOperation(o, i, s)), this.pendingAction = "", this.requestUpdate();
      return;
    }
    const e = ne(this.inventory, this.drafts);
    if (this.labelOnly && e.length) {
      const t = e.map(({ channel: a, name: c }) => ({ channel: a, name: c })), i = this.api, s = this.selectedDeviceId, r = this.inventory, o = ++this.operationGeneration;
      if (this.pendingAction = "session", this.requestUpdate(), await this.run(async () => {
        await i.setHaLabels(s, r.plan_id, r.source_sha256, t), this.ownsOperation(o, i, s) && (this.inventory = { ...r, channels: r.channels.map((a) => {
          const c = t.find((l) => l.channel === a.channel);
          return c ? { ...a, name: c.name } : a;
        }) }, this.announcement = "Home Assistant labels saved.");
      }, "Home Assistant labels could not be saved.", () => this.ownsOperation(o, i, s)), this.pendingAction = "", this.error) return;
    }
    await this.startSession();
  }
  async reviewCalibrationHandoff() {
    if (!this.api || !this.session || !this.restartResult?.source_handoff_available) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.restartResult.verification_id, r = ++this.operationGeneration;
    this.clearSubscription("transaction"), this.transaction = null, await this.run(
      async () => {
        const o = this.inventory && !this.labelOnly ? ne(this.inventory, this.drafts) : [], a = await e.previewCalibratedGains(
          i,
          s,
          o,
          this.sourcePackageOptions ? this.packageOptions : void 0
        );
        !this.ownsOperation(r, e, t) || this.session?.session_id !== i || this.restartResult?.verification_id !== s || (this.calibrationHandoff = !0, this.transaction = a, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "Calibration gains could not be prepared for YAML review.",
      () => this.ownsOperation(r, e, t)
    );
  }
  async clearCalibrationHandoff() {
    const e = this.restartResult;
    if (!this.api || !this.session || !this.topology || !e?.source_handoff_firmware_installed || !e.source_handoff_transaction_id) return;
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, r = ++this.operationGeneration;
    await this.run(
      async () => {
        const o = await t.clearCalibrationFlash(
          s,
          e.verification_id,
          e.source_handoff_transaction_id,
          this.topology
        );
        !this.ownsOperation(r, t, i) || this.session?.session_id !== s || (this.restartResult = o, this.announcement = "Calibration saved to YAML; flash values cleared.", this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash."));
      },
      "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values.",
      () => this.ownsOperation(r, t, i)
    );
  }
  async transactionAction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const t = this.api, i = this.selectedDeviceId, s = this.transaction, r = ++this.operationGeneration;
    await this.run(
      async () => {
        const o = [i, s.transaction_id, s.source_sha256];
        let a;
        try {
          a = e === "apply" ? await t.applyCtConfig(...o) : e === "compile" ? await t.compileCtConfig(...o) : e === "install" ? await t.installCtConfig(...o) : await t.rollbackCtConfig(...o);
        } catch (c) {
          if (c.code !== "stale_confirmation") throw c;
          await this.recoverCtInventory(t, i, r, this.drafts);
          return;
        }
        if (!(!this.ownsOperation(r, t, i) || this.transaction?.transaction_id !== s.transaction_id || this.transaction.source_sha256 !== s.source_sha256)) {
          if (this.transaction = a, this.announcement = `Configuration ${this.transaction.state}.`, e === "apply" && a.state === "validated" && this.sourcePackageOptions)
            this.sourcePackageOptions = {
              power_quality: [...this.packageOptions.power_quality],
              status_fields: [...this.packageOptions.status_fields]
            };
          else if (e === "rollback" && a.state === "rolled_back" && this.sourcePackageOptions) {
            const c = {
              power_quality: [...this.sourcePackageOptions.power_quality],
              status_fields: [...this.sourcePackageOptions.status_fields]
            };
            for (const l of a.changes) {
              const f = /^package\.(main|addon([1-6]))\.(power_quality|status_fields)$/.exec(l.key);
              if (!f || !["enabled", "disabled"].includes(l.old_value ?? "")) continue;
              const p = f[1] === "main" ? 0 : Number(f[2]), _ = f[3];
              c[_][p] = l.old_value === "enabled";
            }
            this.sourcePackageOptions = c;
          }
          if (e === "install" && this.calibrationHandoff && a.state === "verified" && this.session && this.topology && this.restartResult) {
            this.restartResult = {
              ...this.restartResult,
              source_handoff_available: !1,
              source_handoff_transaction_id: a.transaction_id,
              source_handoff_firmware_installed: !0
            }, this.navigate("summary");
            const c = await t.clearCalibrationFlash(
              this.session.session_id,
              this.restartResult.verification_id,
              a.transaction_id,
              this.topology
            );
            if (!this.ownsOperation(r, t, i)) return;
            this.restartResult = c, this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash.");
          } else e === "install" && a.state === "verified" && this.finishFlow("Configuration changes were installed and verified.");
        }
      },
      e === "install" && this.calibrationHandoff ? "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values." : "This confirmation is stale. Reload the CT inventory before making another change.",
      () => this.ownsOperation(r, t, i)
    );
  }
  async startSession() {
    if (!(!this.api || !this.selectedDeviceId || this.sessionStarting || this.pendingAction)) {
      this.sessionStarting = !0, this.pendingAction = "session", this.requestUpdate();
      try {
        const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
        this.clearSubscription("session"), this.session = null, this.resetCalibrationRun(), await this.run(async () => {
          if (!this.topology) throw new Error("Topology is required before calibration");
          const s = await e.getActiveWork(t, this.topology);
          if (!this.ownsOperation(i, e, t)) return;
          if (this.session = s.session?.state === "cancelled" ? null : s.session, this.transaction = s.transaction, this.safetyAcknowledged = this.session?.safety_acknowledged ?? !1, this.calibrationHandoff = !!(this.transaction && s.verified_calibration && s.verified_calibration.source_handoff_transaction_id === this.transaction.transaction_id), this.restartResult = this.calibrationHandoff || this.session?.state === "verified" ? s.verified_calibration : null, this.transaction) {
            this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration), this.session && await this.subscribeSession(this.connectionGeneration);
            return;
          }
          if (this.session) {
            this.navigate(this.session.state === "safety_required" || this.session.state === "preflight_failed" ? "safety" : this.session.state === "applied_pending_restart_verification" ? "restart" : this.session.state === "verified" && this.restartResult ? "summary" : ["completed", "skipped"].includes(this.session.offset_disposition ?? "") ? "voltage" : "offset"), await this.subscribeSession(this.connectionGeneration);
            return;
          }
          const r = await e.startSession(t);
          !this.ownsOperation(i, e, t) || r.device_id !== t || (this.session = r, this.navigate("safety"), await this.subscribeSession(this.connectionGeneration));
        }, "Calibration session could not be started.", () => this.ownsOperation(i, e, t));
      } finally {
        this.sessionStarting = !1, this.pendingAction = "", this.requestUpdate();
      }
    }
  }
  finishFlow(e) {
    this.selectDevice(null), this.navigate("setup"), this.announcement = e;
  }
  async subscribeSession(e) {
    if (!this.api || !this.session) return;
    const t = this.api;
    this.clearSubscription("session");
    const i = this.sessionSubscriptionScope, s = this.session.session_id, r = this.session.device_id;
    await this.ownSubscription(
      t.subscribeSession(s, (o) => {
        this.owns(e, t) && i === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === r && o.session_id === s && o.device_id === r && (this.session = o, this.requestUpdate());
      }),
      e,
      t,
      () => i === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === r,
      (o) => {
        this.sessionUnsub = o;
      }
    );
  }
  async acknowledgeSafety() {
    if (!this.api || !this.session || this.pendingAction) return;
    this.pendingAction = "safety", this.requestUpdate();
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    await this.run(async () => {
      const r = await e.acknowledgeSafety(i);
      !this.ownsOperation(s, e, t) || r.session_id !== i || (this.session = r, this.navigate("offset"));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(s, e, t)), this.pendingAction = "", this.requestUpdate();
  }
  offsetKey(e = this.board, t = this.offsetStage) {
    return `${e}:${t}`;
  }
  async checkOffsetReadiness() {
    if (!this.api || !this.session || this.offsetBusy || !this.offsetAcknowledged[this.offsetStage - 1]) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.board, r = this.offsetStage, o = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const a = await e.checkOffsetReadiness(i, s, r);
          !this.ownsOperation(o, e, t) || this.session?.session_id !== i || (this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget).set(this.offsetKey(s, r), a), this.announcement = a.ready ? `Board ${s + 1} Stage ${r} measured readiness passed.` : `Board ${s + 1} Stage ${r} measured readiness did not pass.`);
        },
        "Measured offset readiness could not be collected. Reconnect and inspect the meter.",
        () => this.ownsOperation(o, e, t)
      );
    } finally {
      this.offsetBusy = !1, this.requestUpdate();
    }
  }
  async calibrateOffset() {
    if (!this.api || !this.session || this.offsetBusy) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.board, r = this.offsetStage, o = this.offsetKey(s, r), a = this.offsetResultByTarget.get(o), c = this.session.offset_boards?.[s]?.stages[r - 1]?.state, l = !!a?.retry_allowed || c === "partial" || c === "indeterminate";
    if (this.offsetAcknowledged[r - 1] !== !0 || l && !this.offsetRetryConfirmed) return;
    const f = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const p = await e.calibrateOffset(i, s, r, !0, l);
          if (!this.ownsOperation(f, e, t) || this.session?.session_id !== i) return;
          this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(o, p);
          const _ = (this.session.offset_boards ?? []).map((u) => u.board_index !== s ? u : {
            ...u,
            stages: u.stages.map((g) => g.stage !== r ? g : {
              ...g,
              state: p.state === "applied_pending_restart_verification" ? "completed" : p.state
            })
          }), y = _.flatMap((u) => u.stages.map((g) => g.state)), d = y.every((u) => u === "completed") ? "completed" : y.some((u) => u === "partial" || u === "indeterminate") ? "partial" : "in_progress";
          this.session = {
            ...this.session,
            offset_boards: _,
            offset_disposition: d,
            has_pending_calibration: this.session.has_pending_calibration || p.expected_tables.length > 0
          }, this.offsetAcknowledged = this.offsetAcknowledged.map((u, g) => g === r - 1 ? !1 : u), this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget), this.offsetReadinessByTarget.delete(o), this.offsetRetryConfirmed = !1, this.announcement = p.state === "applied_pending_restart_verification" ? `Board ${s + 1} Stage ${r} saved; restart verification required.` : `Board ${s + 1} Stage ${r} requires recovery before retry.`;
        },
        "Offset calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(f, e, t)
      );
    } finally {
      this.offsetBusy = !1, this.requestUpdate();
    }
  }
  async skipOffset() {
    if (!this.api || !this.session || this.offsetBusy) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(async () => {
        const r = await e.skipOffsetCalibration(i);
        !this.ownsOperation(s, e, t) || this.session?.session_id !== i || (this.session = r, this.announcement = "Offset calibration skipped; existing flash values were preserved.");
      }, "Offset calibration could not be skipped.", () => this.ownsOperation(s, e, t));
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
    if (this.inventory && !this.labelOnly && ne(this.inventory, this.drafts).length) {
      await this.finishWithoutCalibration();
      return;
    }
    if (!this.api) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    this.finishBusy = !0, this.requestUpdate();
    try {
      await this.run(async () => {
        const r = await e.completeCalibrationWithoutChanges(i);
        if (!(!this.ownsOperation(s, e, t) || this.session?.session_id !== i)) {
          if (r.session_id !== i || r.state !== "verified" || r.has_pending_calibration !== !1)
            throw new Error("No-change completion response is not authoritative");
          this.session = r, this.completedWithoutChanges = !0, this.navigate("summary"), this.announcement = "Completed without calibration changes; no restart was required.";
        }
      }, "Calibration completion could not be confirmed.", () => this.ownsOperation(s, e, t));
    } finally {
      this.finishBusy = !1, this.requestUpdate();
    }
  }
  async checkStability(e) {
    if (!this.api || !this.session || e === "voltage" && this.voltageBusy) return;
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, r = ++this.operationGeneration, o = e === "voltage" ? this.voltageReferenceIds() : this.currentReferenceEntries().map((a) => String(a.channel));
    if (o.length) {
      e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
      try {
        await this.run(async () => {
          if (e === "voltage") {
            const a = new Map(this.stabilityByTarget);
            for (const c of o) {
              const l = await t.checkStability(s, "voltage", c);
              if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
              a.set(`voltage:${c}`, l);
            }
            this.stabilityByTarget = a, this.announcement = "Loaded voltage data for the selected reference.";
            return;
          }
          for (const [a, c] of o.entries()) {
            const l = await t.checkStability(s, e, c);
            if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${c}`, l), a < o.length - 1 && this.requestUpdate();
          }
        }, "Stable samples could not be collected.", () => this.ownsOperation(r, t, i));
      } finally {
        e === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
      }
    }
  }
  async calibrate(e) {
    if (!this.api || !this.session || e === "voltage" && this.voltageBusy) return;
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, r = ++this.operationGeneration;
    e === "voltage" ? this.voltageReferenceIds() : this.currentReferenceEntries().map((a) => String(a.channel));
    const o = this.currentReferenceEntries();
    if (e === "current" && !o.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      return;
    }
    e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
    try {
      await this.run(
        async () => {
          if (e === "voltage") {
            if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
            const l = new Map(this.calibrationByTarget), f = this.voltageReferenceIds().map((p, _) => ({ referenceId: p, value: this.voltageReferences instanceof Map ? this.voltageReferences.get(p) ?? 0 : this.voltageReferences[_] ?? 0 })).filter(({ referenceId: p }) => !this.voltageReferenceComplete(p));
            if (f.some(({ value: p }) => !Number.isFinite(p) || p < 1 || p > 600) || f.some(({ referenceId: p }) => !this.stabilityByTarget.get(`voltage:${p}`)?.stable))
              throw new Error("Voltage references must be valid and stable before calibration.");
            for (const { referenceId: p, value: _ } of f) {
              const y = await t.calibrateVoltage(s, p, _, !0);
              if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
              y.forEach((d) => l.set(`voltage:${d.group_key}`, d)), this.calibrationByTarget = new Map(l), this.requestUpdate();
            }
            this.calibrationByTarget = l, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = "Calibrated the selected voltage reference.";
            return;
          }
          const a = await t.calibrateCurrent(
            s,
            o,
            !0,
            this.inventory && !this.labelOnly ? ne(this.inventory, this.drafts).map((l) => ({
              channel: l.channel,
              reporting_multiplier: l.reporting_multiplier ?? 1
            })) : []
          );
          if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
          const c = new Map(this.calibrationByTarget);
          o.forEach((l) => c.set(`current:${l.channel}`, a)), this.calibrationByTarget = c, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = `Calibration iteration ${a.iteration} finished with state ${a.state}.`;
        },
        "Calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(r, t, i)
      );
    } finally {
      e === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
    }
  }
  groupKey(e) {
    const t = Math.floor(e / 2), i = e % 2 + 1;
    return t === 0 ? `main_${i}` : `addon${t}_${i}`;
  }
  voltageReferenceIds() {
    const e = this.voltageGroupKeys(), t = this.meterSettingsDraft?.voltage_references.filter((i) => i.group_keys.some((s) => e.includes(s))) ?? [];
    return t.length ? t.map((i) => i.reference_id) : this.topology?.voltage_layout === "two_voltages" ? e : [this.board === 0 ? "main" : `addon${this.board}`];
  }
  voltageReferenceLabel(e) {
    return this.meterSettingsDraft?.voltage_references.find((t) => t.reference_id === e)?.label ?? e;
  }
  voltageReferenceComplete(e) {
    return (this.meterSettingsDraft?.voltage_references.find((i) => i.reference_id === e)?.group_keys ?? [e]).every((i) => this.calibrationByTarget.get(`voltage:${i}`)?.state === "applied_pending_restart_verification");
  }
  voltageGroupKeys() {
    return this.topology ? [this.groupKey(this.board * 2), this.groupKey(this.board * 2 + 1)] : [this.groupKey(this.group)];
  }
  currentReferenceEntries() {
    const e = Math.floor((this.channel - 1) / 3) * 3 + 1;
    return Array.from({ length: 3 }, (t, i) => e + i).flatMap((t) => {
      const i = this.currentReferences.get(t), s = this.drafts.get(t)?.multiplier ?? this.inventory?.channels[t - 1]?.reporting_multiplier ?? this.reportingMultiplier;
      return i && i > 0 && s !== null ? [{ channel: t, reference: i, reporting_multiplier: s }] : [];
    });
  }
  async restart() {
    if (!this.api || !this.session || !this.topology || this.restartBusy) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.topology, r = ++this.operationGeneration;
    this.restartResult = null, this.restartBusy = !0, this.announcement = "Restarting the meter and verifying restored calibration values.", this.requestUpdate();
    try {
      await this.run(
        async () => {
          let a;
          try {
            a = await e.restartAndVerify(i, s);
          } catch (c) {
            throw this.ownsOperation(r, e, t) && this.session?.session_id === i && this.topology === s && (this.restartResult = null, this.session = { ...this.session, state: "restart_failed" }), c;
          }
          !this.ownsOperation(r, e, t) || this.session?.session_id !== i || this.topology !== s || (this.restartResult = a, this.completedWithoutChanges = !1, this.session = { ...this.session, state: "verified" });
        },
        "Restart verification failed; review recovery evidence before rollback.",
        () => this.ownsOperation(r, e, t)
      );
    } finally {
      this.restartBusy = !1, this.requestUpdate();
    }
    this.restartResult?.source_handoff_available && await this.reviewCalibrationHandoff();
  }
  async cancelSession(e = "safety") {
    if (!this.api || !this.session) return;
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, r = ++this.operationGeneration;
    await this.run(async () => {
      const o = await t.cancelSession(s);
      !this.ownsOperation(r, t, i) || this.session?.session_id !== s || (this.clearSubscription("session"), this.session = o, this.restartResult = null, e && this.navigate(e), this.announcement = e === "setup" ? "No changes were made. Select another device to configure." : e === "ct" ? "Calibration session closed. Review CT names and types before continuing." : "Calibration session cancelled; cleanup completed without restart verification.");
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(r, t, i));
  }
  async finishWithoutCalibration() {
    if (this.pendingAction) return;
    this.pendingAction = "finish", this.requestUpdate();
    const e = this.inventory && !this.labelOnly ? ne(this.inventory, this.drafts) : [];
    try {
      if (await this.cancelSession(null), this.error) return;
      e.length || this.hasPackageChanges() ? await this.reviewChanges() : this.finishFlow("No changes were made. Select another device to configure.");
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
  }
  async reconnectSession() {
    if (!this.api || !this.session) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    await this.run(
      async () => {
        const r = await e.getSession(i);
        !this.ownsOperation(s, e, t) || this.session?.session_id !== i || (this.session = r, this.announcement = `Session reconnected with state ${this.session.state}.`);
      },
      "Session reconnection failed. Retry only after checking the meter connection.",
      () => this.ownsOperation(s, e, t)
    );
  }
  resultFor(e) {
    const t = this.currentReferenceEntries().map((r) => String(r.channel)), i = Math.floor((this.channel - 1) / 3) * 3 + 1, s = e === "voltage" ? this.voltageGroupKeys() : t.length ? t : Array.from({ length: 3 }, (r, o) => String(i + o));
    for (const r of [...s].reverse()) {
      const o = this.calibrationByTarget.get(`${e}:${r}`);
      if (o) return o;
    }
    return null;
  }
  voltageResultsForBoard() {
    return this.voltageGroupKeys().flatMap((e) => {
      const t = this.calibrationByTarget.get(`voltage:${e}`);
      return t ? [t] : [];
    });
  }
  calibratedInstances(e) {
    return new Set([...this.calibrationByTarget.entries()].flatMap(([t, i]) => t.startsWith(`${e}:`) && i.state === "applied_pending_restart_verification" && i.gain_evidence?.flash_saved ? [i.gain_evidence.instance_id] : []));
  }
  hasCompletedCalibration(e) {
    return e === "voltage" ? this.voltageGroupKeys().every((t) => this.calibrationByTarget.get(`voltage:${t}`)?.state === "applied_pending_restart_verification") : [...this.calibrationByTarget.entries()].some(([t, i]) => t.startsWith(`${e}:`) && i.state === "applied_pending_restart_verification");
  }
  stabilityFor(e) {
    const t = e === "voltage" ? this.voltageReferenceIds() : this.currentReferenceEntries().map((s) => String(s.channel)), i = t.flatMap((s) => {
      const r = this.stabilityByTarget.get(`${e}:${s}`);
      return r ? [r] : [];
    });
    return i.length ? {
      target: e,
      target_id: e === "voltage" ? `Board ${this.board + 1}` : `Current group ${Math.floor((this.channel - 1) / 3) + 1}`,
      stable: i.length === t.length && i.every((s) => s.stable),
      windows: i.flatMap((s) => s.windows)
    } : null;
  }
  async run(e, t, i = () => !0) {
    this.error = "";
    try {
      await e();
    } catch (s) {
      if (!i()) return;
      const r = s.code, o = r === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : r === "stale_handle" ? "The selected device changed or is no longer available. Rescan and try again." : t;
      this.fail(s, o);
    }
    i() && this.requestUpdate();
  }
  safeErrorMessage(e, t) {
    const i = e.code;
    return i === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : i === "stale_handle" ? "The selected device changed or is no longer available. Rescan and try again." : t;
  }
  fail(e, t) {
    this.error = t, this.announcement = t, this.requestUpdate();
  }
  stepBody() {
    return this.step === "setup" ? h`${Zs(
      this.setup,
      this.addonCount,
      this.connection,
      (e) => this.setAddonCount(e),
      (e) => {
        this.connection = e, this.refreshFirmwareOptions();
      },
      () => {
        this.rescan();
      },
      (e) => {
        this.configureDevice(e);
      },
      (e) => {
        this.adopt(e);
      },
      this.pendingAction,
      !!this.topology,
      this.firmwareCatalog(),
      this.importFailedDeviceId,
      this.packageOptions,
      (e) => {
        this.packageOptions = e, this.requestUpdate();
      },
      this.electricalSystem,
      this.lineFrequencyHz,
      this.electricalProfileConfirmed,
      (e) => this.setElectricalSystem(e),
      (e) => this.setLineFrequency(e),
      () => this.confirmElectricalProfile()
    )}
      ${this.topology ? Js(
      this.topology,
      this.selectedProjectVersion(),
      () => {
        this.selectDevice(null), this.navigate("setup");
      },
      () => {
        this.setup?.devices.find((e) => e.entry_id === this.selectedDeviceId)?.configuration ? this.loadInventory() : this.startSession();
      },
      this.error === "Topology mismatch",
      this.pendingAction === "inventory" || this.pendingAction === "session",
      this.sourcePackageOptions ? this.packageOptions : null,
      (e) => {
        this.packageOptions = e, this.requestUpdate();
      }
    ) : R}` : this.step === "meter" && this.meterSettingsDraft && this.meterConfiguration ? hs(
      this.meterSettingsDraft,
      this.meterConfiguration.voltage_transformer_catalog,
      this.multiReferencePreparationAcknowledged,
      (e) => {
        this.meterSettingsDraft = e, this.requestUpdate();
      },
      (e) => this.setMeterProfile(e),
      (e) => this.setMeterFrequency(e),
      (e, t) => this.setMeterNominalVoltage(e, t),
      (e) => {
        this.multiReferencePreparationAcknowledged = e, this.requestUpdate();
      },
      () => this.back(),
      () => {
        this.continueFromMeterSettings();
      }
    ) : this.step === "ct" && this.inventory ? h`<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
      this.labelOnly = !1, this.requestUpdate();
    }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
      this.labelOnly = !0, this.requestUpdate();
    }}>Home Assistant labels only</label></fieldset>${es(
      this.inventory,
      this.board,
      this.drafts,
      (e) => {
        this.board = e, this.requestUpdate();
      },
      (e, t) => this.updateDraft(e, t),
      () => this.back(),
      () => {
        this.continueFromCt();
      },
      this.labelOnly,
      this.pendingAction === "session",
      this.labelOnly ? null : this.meterConfiguration?.configuration ?? null,
      (e) => this.updateCircuitConfiguration(e),
      (e) => this.disableCircuit(e)
    )}` : this.step === "build" ? Qi(
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
    ) : this.step === "safety" ? Ws(
      this.session,
      this.safetyAcknowledged,
      (e) => {
        this.safetyAcknowledged = e, this.requestUpdate();
      },
      () => {
        this.acknowledgeSafety();
      },
      () => {
        this.cancelSession();
      },
      () => this.back(),
      this.pendingAction === "safety"
    ) : this.step === "offset" ? Hs(
      this.topology,
      this.session,
      this.board,
      this.offsetStage,
      this.offsetAcknowledged[this.offsetStage - 1] ?? !1,
      this.offsetRetryConfirmed,
      this.offsetReadinessByTarget.get(this.offsetKey()) ?? null,
      this.offsetResultByTarget.get(this.offsetKey()) ?? null,
      this.offsetBusy,
      (e) => {
        this.board = e, this.offsetRetryConfirmed = !1, this.requestUpdate();
      },
      (e) => {
        (e === 1 || this.session?.offset_boards?.every((t) => t.stages[0]?.state === "completed")) && (this.offsetStage = e, this.board = 0, this.offsetRetryConfirmed = !1, this.requestUpdate());
      },
      (e) => {
        this.offsetAcknowledged = this.offsetAcknowledged.map((t, i) => i === this.offsetStage - 1 ? e : t), this.requestUpdate();
      },
      (e) => {
        this.offsetRetryConfirmed = e, this.requestUpdate();
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
    ) : this.step === "voltage" ? h`${this.meterSettingsDraft?.warnings.includes("slow_interval_extends_calibration") ? h`<div class="warning-band" role="status">This meter uses a ${this.meterSettingsDraft.update_interval_s}-second update interval. Calibration takes longer; keep the reference stable until each check finishes.</div>` : R}${Qs(
      this.topology,
      this.session,
      this.board,
      this.voltageReferenceIds().map((e, t) => this.voltageReferences instanceof Map ? this.voltageReferences.get(e) ?? 0 : this.voltageReferences[t] ?? 0),
      this.voltageReferenceIds().map((e) => this.voltageReferenceLabel(e)),
      this.stabilityFor("voltage"),
      this.voltageResultsForBoard(),
      this.voltageBusy,
      (e) => {
        this.board = e, this.requestUpdate();
      },
      (e, t) => {
        const i = this.voltageReferenceIds()[e];
        i && (this.voltageReferences = new Map(this.voltageReferences).set(i, t)), this.requestUpdate();
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
      <footer class="action-footer offset-footer"><button class="secondary" @click=${() => this.back()}>Back</button>
        <button class="secondary" ?disabled=${this.voltageBusy || this.voltageSkipped} @click=${() => {
      this.voltageSkipped = !0, this.announcement = "Remaining voltage calibration was skipped; completed gains were preserved.", this.requestUpdate();
    }}>Skip voltage calibration</button>
        <button class="primary" ?disabled=${this.voltageBusy || !this.voltageSkipped && !this.hasCompletedCalibration("voltage")} @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? h`${as(
      this.topology,
      this.inventory,
      this.session,
      this.channel,
      this.currentReferences,
      this.reportingMultiplier,
      this.stabilityFor("current"),
      this.resultFor("current"),
      this.calibratedInstances("current"),
      (e) => {
        this.channel = e, this.requestUpdate();
      },
      (e, t) => {
        const i = new Map(this.currentReferences);
        t === null || !Number.isFinite(t) || t <= 0 ? i.delete(e) : i.set(e, t), this.currentReferences = i, this.requestUpdate();
      },
      (e) => {
        this.reportingMultiplier = e, this.requestUpdate();
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
      <footer class="action-footer offset-footer"><button class="secondary" @click=${() => this.back()}>Back</button>
        <button class="secondary" ?disabled=${this.finishBusy || this.currentSkipped} @click=${() => {
      this.currentSkipped = !0, this.announcement = "Remaining current calibration was skipped; completed gains were preserved.", this.requestUpdate();
    }}>Skip current calibration</button>
        <button class="primary" ?disabled=${this.finishBusy || !this.currentSkipped && !this.hasCompletedCalibration("current")} @click=${() => {
      this.finishCurrent();
    }}>${this.finishBusy ? "Finishing…" : "Continue"}</button></footer>` : this.step === "restart" ? Vs(
      this.session?.state ?? this.error,
      this.restartResult,
      !!this.transaction?.rollback_available,
      this.restartBusy,
      () => {
        this.restart();
      },
      () => {
        this.transactionAction("rollback");
      },
      () => this.back()
    ) : this.step === "summary" ? Xs(
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
    ) : h`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct" ? "CT settings are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }
  firmwareCatalog() {
    const e = this.firmwareCatalogState === "loading";
    return h`<section class="step-content" aria-labelledby="firmware-heading">
      <h2 id="firmware-heading">Install firmware</h2>
      <label>ESPHome firmware version
        <select data-action="firmware-version" ?disabled=${e || this.firmwareCatalogState !== "ready" || !this.resolvedFirmwareOptions.length}
          @change=${(t) => this.selectFirmwareVersion(t.target.value)}>
          ${this.resolvedFirmwareOptions.map((t, i) => h`<option value=${t.version} ?selected=${t.version === this.selectedEspHomeVersion}>${t.version}${i === 0 ? " (newest)" : ""}</option>`)}
        </select>
      </label>
      ${this.firmwareCatalogState === "error" ? h`<div class="error-panel" role="status">
        <strong>${this.firmwareCatalogError}</strong>
        <button class="secondary" data-action="firmware-retry" @click=${() => this.retryFirmwareIndex()}>Retry</button>
      </div>` : R}
      ${e ? h`<p role="status">Loading firmware versions…</p>` : R}
      ${this.firmwareCatalogState === "ready" && !this.resolvedFirmwareOptions.length ? h`<p role="status">No firmware version is available for this hardware.</p>` : R}
      ${this.firmwareCatalogState === "ready" ? Fs(this.selectedFirmware()) : R}
    </section>`;
  }
  render() {
    const e = le.findIndex(([t]) => t === this.step);
    return h`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${le.map(([t, i], s) => h`
            <li class=${s === e ? "current" : ""}>
              <button class="step-button" aria-current=${s === e ? "step" : R}
                ?disabled=${s > e || s < e && t !== "setup"}
                @click=${() => t === "setup" && s < e ? this.returnToSetup() : void 0}><span class="number">${s + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${e + 1} of ${le.length} — ${le[e]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${le[e]?.[1]}</h1>
          ${this.error ? h`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : R}
          ${this.stepBody()}
          ${e >= 2 && !["voltage", "current", "summary"].includes(this.step) ? Kt(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : R}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", rn);
export {
  rn as CircuitSetupPanel
};
