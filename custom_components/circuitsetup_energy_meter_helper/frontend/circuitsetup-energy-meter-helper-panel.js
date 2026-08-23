const te = globalThis, ue = te.ShadowRoot && (te.ShadyCSS === void 0 || te.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, fe = /* @__PURE__ */ Symbol(), Ce = /* @__PURE__ */ new WeakMap();
let Le = class {
  constructor(e, i, t) {
    if (this._$cssResult$ = !0, t !== fe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (ue && e === void 0) {
      const t = i !== void 0 && i.length === 1;
      t && (e = Ce.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && Ce.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const st = (n) => new Le(typeof n == "string" ? n : n + "", void 0, fe), nt = (n, ...e) => {
  const i = n.length === 1 ? n[0] : e.reduce((t, s, o) => t + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[o + 1], n[0]);
  return new Le(i, n, fe);
}, ot = (n, e) => {
  if (ue) n.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const t = document.createElement("style"), s = te.litNonce;
    s !== void 0 && t.setAttribute("nonce", s), t.textContent = i.cssText, n.appendChild(t);
  }
}, Ae = ue ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const t of e.cssRules) i += t.cssText;
  return st(i);
})(n) : n;
const { is: rt, defineProperty: at, getOwnPropertyDescriptor: ct, getOwnPropertyNames: lt, getOwnPropertySymbols: dt, getPrototypeOf: ht } = Object, re = globalThis, ke = re.trustedTypes, pt = ke ? ke.emptyScript : "", ut = re.reactiveElementPolyfillSupport, W = (n, e) => n, de = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? pt : null;
      break;
    case Object:
    case Array:
      n = n == null ? n : JSON.stringify(n);
  }
  return n;
}, fromAttribute(n, e) {
  let i = n;
  switch (e) {
    case Boolean:
      i = n !== null;
      break;
    case Number:
      i = n === null ? null : Number(n);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(n);
      } catch {
        i = null;
      }
  }
  return i;
} }, ze = (n, e) => !rt(n, e), xe = { attribute: !0, type: String, converter: de, reflect: !1, useDefault: !1, hasChanged: ze };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), re.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let D = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = xe) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const t = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, t, i);
      s !== void 0 && at(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, i, t) {
    const { get: s, set: o } = ct(this.prototype, e) ?? { get() {
      return this[i];
    }, set(r) {
      this[i] = r;
    } };
    return { get: s, set(r) {
      const a = s?.call(this);
      o?.call(this, r), this.requestUpdate(e, a, t);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? xe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(W("elementProperties"))) return;
    const e = ht(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(W("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(W("properties"))) {
      const i = this.properties, t = [...lt(i), ...dt(i)];
      for (const s of t) this.createProperty(s, i[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [t, s] of i) this.elementProperties.set(t, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, t] of this.elementProperties) {
      const s = this._$Eu(i, t);
      s !== void 0 && this._$Eh.set(s, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const t = new Set(e.flat(1 / 0).reverse());
      for (const s of t) i.unshift(Ae(s));
    } else e !== void 0 && i.push(Ae(e));
    return i;
  }
  static _$Eu(e, i) {
    const t = i.attribute;
    return t === !1 ? void 0 : typeof t == "string" ? t : typeof e == "string" ? e.toLowerCase() : void 0;
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
    const e = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const t of i.keys()) this.hasOwnProperty(t) && (e.set(t, this[t]), delete this[t]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ot(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, i, t) {
    this._$AK(e, t);
  }
  _$ET(e, i) {
    const t = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, t);
    if (s !== void 0 && t.reflect === !0) {
      const o = (t.converter?.toAttribute !== void 0 ? t.converter : de).toAttribute(i, t.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, i) {
    const t = this.constructor, s = t._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const o = t.getPropertyOptions(s), r = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : de;
      this._$Em = s;
      const a = r.fromAttribute(i, o.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, i, t, s = !1, o) {
    if (e !== void 0) {
      const r = this.constructor;
      if (s === !1 && (o = this[e]), t ??= r.getPropertyOptions(e), !((t.hasChanged ?? ze)(o, i) || t.useDefault && t.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(r._$Eu(e, t)))) return;
      this.C(e, i, t);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: t, reflect: s, wrapped: o }, r) {
    t && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, r ?? i ?? this[e]), o !== !0 || r !== void 0) || (this._$AL.has(e) || (this.hasUpdated || t || (i = void 0), this._$AL.set(e, i)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
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
        for (const [s, o] of this._$Ep) this[s] = o;
        this._$Ep = void 0;
      }
      const t = this.constructor.elementProperties;
      if (t.size > 0) for (const [s, o] of t) {
        const { wrapped: r } = o, a = this[s];
        r !== !0 || this._$AL.has(s) || a === void 0 || this.C(s, void 0, o, a);
      }
    }
    let e = !1;
    const i = this._$AL;
    try {
      e = this.shouldUpdate(i), e ? (this.willUpdate(i), this._$EO?.forEach((t) => t.hostUpdate?.()), this.update(i)) : this._$EM();
    } catch (t) {
      throw e = !1, this._$EM(), t;
    }
    e && this._$AE(i);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((i) => i.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
    this._$Eq &&= this._$Eq.forEach((i) => this._$ET(i, this[i])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
D.elementStyles = [], D.shadowRootOptions = { mode: "open" }, D[W("elementProperties")] = /* @__PURE__ */ new Map(), D[W("finalized")] = /* @__PURE__ */ new Map(), ut?.({ ReactiveElement: D }), (re.reactiveElementVersions ??= []).push("2.1.2");
const ge = globalThis, Ee = (n) => n, se = ge.trustedTypes, Ie = se ? se.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Fe = "$lit$", U = `lit$${Math.random().toFixed(9).slice(2)}$`, Ve = "?" + U, ft = `<${Ve}>`, B = document, Y = () => B.createComment(""), J = (n) => n === null || typeof n != "object" && typeof n != "function", ve = Array.isArray, gt = (n) => ve(n) || typeof n?.[Symbol.iterator] == "function", le = `[\x20\t
\f\r]`, L = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Re = /-->/g, Te = />/g, N = RegExp(`>|${le}(?:([^\\s"'>=/]+)(${le}*=${le}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), Oe = /'/g, Me = /"/g, We = /^(?:script|style|textarea|title)$/i, vt = (n) => (e, ...i) => ({ _$litType$: n, strings: e, values: i }), h = vt(1), q = /* @__PURE__ */ Symbol.for("lit-noChange"), $ = /* @__PURE__ */ Symbol.for("lit-nothing"), Ue = /* @__PURE__ */ new WeakMap(), P = B.createTreeWalker(B, 129);
function Ke(n, e) {
  if (!ve(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ie !== void 0 ? Ie.createHTML(e) : e;
}
const _t = (n, e) => {
  const i = n.length - 1, t = [];
  let s, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = L;
  for (let a = 0; a < i; a++) {
    const c = n[a];
    let l, u, d = -1, p = 0;
    for (; p < c.length && (r.lastIndex = p, u = r.exec(c), u !== null); ) p = r.lastIndex, r === L ? u[1] === "!--" ? r = Re : u[1] !== void 0 ? r = Te : u[2] !== void 0 ? (We.test(u[2]) && (s = RegExp("</" + u[2], "g")), r = N) : u[3] !== void 0 && (r = N) : r === N ? u[0] === ">" ? (r = s ?? L, d = -1) : u[1] === void 0 ? d = -2 : (d = r.lastIndex - u[2].length, l = u[1], r = u[3] === void 0 ? N : u[3] === '"' ? Me : Oe) : r === Me || r === Oe ? r = N : r === Re || r === Te ? r = L : (r = N, s = void 0);
    const g = r === N && n[a + 1].startsWith("/>") ? " " : "";
    o += r === L ? c + ft : d >= 0 ? (t.push(l), c.slice(0, d) + Fe + c.slice(d) + U + g) : c + U + (d === -2 ? a : g);
  }
  return [Ke(n, o + (n[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), t];
};
class Z {
  constructor({ strings: e, _$litType$: i }, t) {
    let s;
    this.parts = [];
    let o = 0, r = 0;
    const a = e.length - 1, c = this.parts, [l, u] = _t(e, i);
    if (this.el = Z.createElement(l, t), P.currentNode = this.el.content, i === 2 || i === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = P.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(Fe)) {
          const p = u[r++], g = s.getAttribute(d).split(U), f = /([.?@])?(.*)/.exec(p);
          c.push({ type: 1, index: o, name: f[2], strings: g, ctor: f[1] === "." ? mt : f[1] === "?" ? yt : f[1] === "@" ? $t : ae }), s.removeAttribute(d);
        } else d.startsWith(U) && (c.push({ type: 6, index: o }), s.removeAttribute(d));
        if (We.test(s.tagName)) {
          const d = s.textContent.split(U), p = d.length - 1;
          if (p > 0) {
            s.textContent = se ? se.emptyScript : "";
            for (let g = 0; g < p; g++) s.append(d[g], Y()), P.nextNode(), c.push({ type: 2, index: ++o });
            s.append(d[p], Y());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Ve) c.push({ type: 2, index: o });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(U, d + 1)) !== -1; ) c.push({ type: 7, index: o }), d += U.length - 1;
      }
      o++;
    }
  }
  static createElement(e, i) {
    const t = B.createElement("template");
    return t.innerHTML = e, t;
  }
}
function H(n, e, i = n, t) {
  if (e === q) return e;
  let s = t !== void 0 ? i._$Co?.[t] : i._$Cl;
  const o = J(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== o && (s?._$AO?.(!1), o === void 0 ? s = void 0 : (s = new o(n), s._$AT(n, i, t)), t !== void 0 ? (i._$Co ??= [])[t] = s : i._$Cl = s), s !== void 0 && (e = H(n, s._$AS(n, e.values), s, t)), e;
}
class bt {
  constructor(e, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: i }, parts: t } = this._$AD, s = (e?.creationScope ?? B).importNode(i, !0);
    P.currentNode = s;
    let o = P.nextNode(), r = 0, a = 0, c = t[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let l;
        c.type === 2 ? l = new X(o, o.nextSibling, this, e) : c.type === 1 ? l = new c.ctor(o, c.name, c.strings, this, e) : c.type === 6 && (l = new wt(o, this, e)), this._$AV.push(l), c = t[++a];
      }
      r !== c?.index && (o = P.nextNode(), r++);
    }
    return P.currentNode = B, s;
  }
  p(e) {
    let i = 0;
    for (const t of this._$AV) t !== void 0 && (t.strings !== void 0 ? (t._$AI(e, t, i), i += t.strings.length - 2) : t._$AI(e[i])), i++;
  }
}
class X {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, i, t, s) {
    this.type = 2, this._$AH = $, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = t, this.options = s, this._$Cv = s?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && e?.nodeType === 11 && (e = i.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, i = this) {
    e = H(this, e, i), J(e) ? e === $ || e == null || e === "" ? (this._$AH !== $ && this._$AR(), this._$AH = $) : e !== this._$AH && e !== q && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : gt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== $ && J(this._$AH) ? this._$AA.nextSibling.data = e : this.T(B.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: i, _$litType$: t } = e, s = typeof t == "number" ? this._$AC(e) : (t.el === void 0 && (t.el = Z.createElement(Ke(t.h, t.h[0]), this.options)), t);
    if (this._$AH?._$AD === s) this._$AH.p(i);
    else {
      const o = new bt(s, this), r = o.u(this.options);
      o.p(i), this.T(r), this._$AH = o;
    }
  }
  _$AC(e) {
    let i = Ue.get(e.strings);
    return i === void 0 && Ue.set(e.strings, i = new Z(e)), i;
  }
  k(e) {
    ve(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let t, s = 0;
    for (const o of e) s === i.length ? i.push(t = new X(this.O(Y()), this.O(Y()), this, this.options)) : t = i[s], t._$AI(o), s++;
    s < i.length && (this._$AR(t && t._$AB.nextSibling, s), i.length = s);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); e !== this._$AB; ) {
      const t = Ee(e).nextSibling;
      Ee(e).remove(), e = t;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class ae {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, i, t, s, o) {
    this.type = 1, this._$AH = $, this._$AN = void 0, this.element = e, this.name = i, this._$AM = s, this.options = o, t.length > 2 || t[0] !== "" || t[1] !== "" ? (this._$AH = Array(t.length - 1).fill(new String()), this.strings = t) : this._$AH = $;
  }
  _$AI(e, i = this, t, s) {
    const o = this.strings;
    let r = !1;
    if (o === void 0) e = H(this, e, i, 0), r = !J(e) || e !== this._$AH && e !== q, r && (this._$AH = e);
    else {
      const a = e;
      let c, l;
      for (e = o[0], c = 0; c < o.length - 1; c++) l = H(this, a[t + c], i, c), l === q && (l = this._$AH[c]), r ||= !J(l) || l !== this._$AH[c], l === $ ? e = $ : e !== $ && (e += (l ?? "") + o[c + 1]), this._$AH[c] = l;
    }
    r && !s && this.j(e);
  }
  j(e) {
    e === $ ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class mt extends ae {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === $ ? void 0 : e;
  }
}
class yt extends ae {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== $);
  }
}
class $t extends ae {
  constructor(e, i, t, s, o) {
    super(e, i, t, s, o), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = H(this, e, i, 0) ?? $) === q) return;
    const t = this._$AH, s = e === $ && t !== $ || e.capture !== t.capture || e.once !== t.once || e.passive !== t.passive, o = e !== $ && (t === $ || s);
    s && this.element.removeEventListener(this.name, this, t), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class wt {
  constructor(e, i, t) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = t;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    H(this, e);
  }
}
const St = ge.litHtmlPolyfillSupport;
St?.(Z, X), (ge.litHtmlVersions ??= []).push("3.3.3");
const Ct = (n, e, i) => {
  const t = i?.renderBefore ?? e;
  let s = t._$litPart$;
  if (s === void 0) {
    const o = i?.renderBefore ?? null;
    t._$litPart$ = s = new X(e.insertBefore(Y(), o), o, void 0, i ?? {});
  }
  return s._$AI(n), s;
};
const _e = globalThis;
class K extends D {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ct(i, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return q;
  }
}
K._$litElement$ = !0, K.finalized = !0, _e.litElementHydrateSupport?.({ LitElement: K });
const At = _e.litElementPolyfillSupport;
At?.({ LitElement: K });
(_e.litElementVersions ??= []).push("4.2.2");
const Ne = "circuitsetup_energy_meter_helper/", kt = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, xt = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, Et = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, It = /[\u0000-\u001f\u007f-\u009f]/, Rt = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), Tt = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), Ot = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "indeterminate", "verified", "cancelled"]), be = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), Pe = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), ne = /* @__PURE__ */ new Set(["A", "B", "C"]), Mt = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), Ut = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), Nt = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), Pt = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), Bt = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), Dt = /^(?:ct(?:[1-9]|[1-3][0-9]|4[0-2])_name|current_cal_ct(?:[1-9]|[1-3][0-9]|4[0-2])|voltage_cal[12])$/, jt = /^[0-9a-f]{12}$/, qt = /^[0-9a-f]{64}$/, Be = /^[0-9a-f]{32}$/, Ht = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, De = /* @__PURE__ */ new Set(["preview_ct_config", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]);
function m(n, e) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function C(n, e, i = 100) {
  if (!Array.isArray(n) || n.length > i) throw new Error(`${e} response is invalid`);
  return n;
}
function _(n, e, i = !1) {
  if (i && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${e} response is invalid`);
  return n;
}
function E(n, e) {
  if (typeof n != "number" || !Number.isFinite(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function y(n, e) {
  const i = E(n, e);
  if (!Number.isInteger(i)) throw new Error(`${e} response is invalid`);
  return i;
}
function R(n, e, i = !1) {
  if (i && n === null) return null;
  if (typeof n != "boolean") throw new Error(`${e} response is invalid`);
  return n;
}
function x(n, e, i) {
  const t = _(n, i);
  if (!e.has(t)) throw new Error(`${i} response is invalid`);
  return t;
}
function he(n, e) {
  n !== void 0 && _(n, e, !0);
}
function ie(n, e) {
  return Math.abs(n - e) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(e));
}
function Ye(n, e) {
  const i = m(n, e);
  _(i.entry_id, e), _(i.title, e), _(i.project_name, e), _(i.project_version, e, !0), R(i.importable, e, !0), _(i.configuration, e, !0);
}
function ee(n, e) {
  const i = m(n, e);
  if (x(i.state, Rt, e), C(i.devices, e).forEach((t) => Ye(t, e)), i.configuration_authoritative !== void 0 && R(i.configuration_authoritative, e), i.installer_intent !== void 0) {
    const t = m(i.installer_intent, e), s = y(t.addon_count, e);
    if (s < 0 || s > 6) throw new Error(`${e} response is invalid`);
    if (x(t.connection_type, be, e) === "unknown") throw new Error(`${e} response is invalid`);
  }
  return n;
}
function je(n, e) {
  const i = m(n, e), t = y(i.addon_count, e), s = y(i.board_count, e), o = y(i.ct_count, e), r = y(i.group_count, e);
  if (t < 0 || t > 6 || s < 1 || s > 7 || o < 6 || o > 42 || r < 2 || r > 14 || s !== t + 1 || o !== 6 * s || r !== 2 * s) throw new Error(`${e} response is invalid`);
  x(i.connection_type, be, e), _(i.voltage_layout, e), _(i.project_name, e);
  const a = C(i.evidence, e);
  if (a.length < 1 || a.length > Pe.size) throw new Error(`${e} response is invalid`);
  const c = a.map((l) => {
    const u = m(l, e), d = x(u.source, Pe, e), p = y(u.addon_count, e);
    if (p < 0 || p > 6) throw new Error(`${e} response is invalid`);
    return _(u.detail, e), d;
  });
  if (new Set(c).size !== c.length || !c.some((l) => Bt.has(l))) throw new Error(`${e} response is invalid`);
  return n;
}
function Gt(n, e) {
  const i = m(n, e);
  return "topology" in i ? (je(i.topology, e), i.configuration_authoritative !== void 0 && R(i.configuration_authoritative, e), n) : je(n, e);
}
function Lt(n, e) {
  const i = m(n, e);
  _(i.plan_id, e), _(i.source_sha256, e);
  const t = C(i.channels, e);
  if (t.length < 6 || t.length > 42 || t.length % 6 !== 0) throw new Error(`${e} response is invalid`);
  t.forEach((r, a) => {
    const c = m(r, e), l = y(c.channel, e);
    _(c.name, e), y(c.raw_gain_ct, e), E(c.reporting_multiplier, e), he(c.selected_model_id, e), R(c.selection_verified_against_config, e), he(c.display_label, e);
    const u = m(c.address, e), d = y(u.channel, e), p = y(u.board_index, e), g = y(u.group_index, e), f = x(u.phase, ne, e), w = a + 1;
    if (l !== w || d !== w || p !== Math.floor(a / 6) || g !== Math.floor(a % 6 / 3) || f !== ["A", "B", "C"][a % 3]) throw new Error(`${e} response is invalid`);
  });
  const s = m(i.catalog, e);
  _(s.source_repository, e), _(s.source_ref, e), y(s.schema_version, e);
  const o = C(s.presets, e);
  if (o.length > 64) throw new Error(`${e} response is invalid`);
  return o.forEach((r) => {
    const a = m(r, e);
    _(a.model_id, e), _(a.label, e), E(a.rated_current_a, e), _(a.secondary, e), a.default_gain_ct !== null && y(a.default_gain_ct, e), R(a.requires_burden_jumper_cut, e), _(a.notes, e);
  }), n;
}
function V(n, e) {
  const i = m(n, e);
  if (_(i.transaction_id, e), x(i.state, Tt, e), _(i.source_sha256, e), R(i.rollback_available, e), _(i.redacted_diff, e), C(i.changes, e).forEach((t) => {
    const s = m(t, e), o = _(s.key, e);
    if (!Dt.test(o)) throw new Error(`${e} response is invalid`);
    s.old_value !== null && _(s.old_value, e), _(s.new_value, e);
  }), C(i.evidence, e).forEach((t) => x(t, Ut, e)), C(i.progress, e).forEach((t) => x(t, Nt, e)), i.validation_detail != null) {
    const t = m(i.validation_detail, e);
    for (const s of ["reported_error_count", "reported_warning_count"]) t[s] !== null && y(t[s], e);
    t.code !== null && y(t.code, e), y(t.error_record_count, e), y(t.warning_record_count, e);
  }
  return i.upload_progress !== void 0 && C(i.upload_progress, e).forEach((t) => {
    const s = m(t, e);
    if (x(s.stage, Mt, e), s.progress !== null && s.percentage !== null && s.progress !== void 0 && s.percentage !== void 0) throw new Error(`${e} response is invalid`);
    const o = s.progress ?? s.percentage;
    if (o != null) {
      const r = y(o, e);
      if (r < 0 || r > 100) throw new Error(`${e} response is invalid`);
    }
  }), n;
}
function j(n, e) {
  const i = m(n, e);
  _(i.session_id, e), _(i.device_id, e), x(i.state, Ot, e), R(i.safety_acknowledged, e);
  const t = m(i.preflight, e);
  return C(t.issues, e).forEach((s) => {
    const o = m(s, e);
    x(o.code, Pt, e), _(o.role, e), _(o.detail, e);
  }), C(t.zeroed_roles, e).forEach((s) => _(s, e)), i.calibration_sources !== void 0 && Object.values(m(i.calibration_sources, e)).forEach((s) => x(s, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), e)), n;
}
function qe(n, e, i, t) {
  const s = m(n, e), o = x(s.target, /* @__PURE__ */ new Set(["voltage", "current"]), e);
  _(s.target_id, e);
  const r = R(s.stable, e);
  if (o !== i || s.target_id !== t) throw new Error(`${e} response is invalid`);
  const a = C(s.windows, e, o === "voltage" ? 3 : 1);
  if (a.length !== (o === "voltage" ? 3 : 1)) throw new Error(`${e} response is invalid`);
  const c = a.map((l) => {
    const u = m(l, e), d = C(u.samples, e, 1).map((S) => E(S, e));
    if (d.length !== 1) throw new Error(`${e} response is invalid`);
    const p = E(u.mean, e), g = E(u.standard_deviation, e), f = E(u.range_percent, e), w = d.reduce((S, I) => S + I, 0) / d.length, v = Math.sqrt(d.reduce((S, I) => S + (I - w) ** 2, 0) / d.length), b = 100 * (Math.max(...d) - Math.min(...d)) / Math.abs(w);
    if (!ie(p, w) || !ie(g, v) || !ie(f, b)) throw new Error(`${e} response is invalid`);
    return f;
  });
  if (r !== c.every((l) => l <= 1)) throw new Error(`${e} response is invalid`);
  return n;
}
function He(n, e, i) {
  const t = m(n, e), s = x(t.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e);
  _(t.group_key, e), t.phase !== null && x(t.phase, ne, e);
  const o = y(t.iteration, e), r = C(t.changed_channels, e, 3).map((f) => y(f, e)), a = C(t.before_values, e, 3), c = C(t.after_values, e, 3), l = C(t.error_percent_values, e, 3);
  for (const f of [a, c, l]) f.forEach((w) => E(w, e));
  const u = i.target === "voltage" ? i.groupKey : me(i.references[0].channel), d = i.target === "voltage" ? Je(i.groupKey) : i.references.map((f) => f.channel), p = i.target === "current" && i.references.length === 1 ? ["A", "B", "C"][(i.references[0].channel - 1) % 3] : null, g = R(t.retry_allowed, e);
  if (i.target === "voltage" && (!Number.isFinite(i.reference) || i.reference <= 0) || i.target === "current" && i.references.some((f) => !Number.isFinite(f.reference) || f.reference <= 0 || !Number.isFinite(f.rawReference) || f.rawReference <= 0) || ![1, 2, 3].includes(r.length) || s !== "indeterminate" && a.length !== r.length || new Set(r).size !== r.length || r.some((f) => f < 1 || f > 42) || o < 1 || o > 3 || t.group_key !== u || t.phase !== p || r.length !== d.length || r.some((f, w) => f !== d[w]) || (s === "indeterminate" ? c.length !== 0 || l.length !== 0 : c.length !== r.length || l.length !== r.length)) throw new Error(`${e} response is invalid`);
  if (s === "indeterminate") {
    if (t.gain_evidence !== null || g) throw new Error(`${e} response is invalid`);
    t.restore_evidence != null && m(t.restore_evidence, e);
  } else {
    if (t.gain_evidence == null || t.restore_evidence !== null) throw new Error(`${e} response is invalid`);
    zt(t.gain_evidence, e, i);
    const f = i.target === "voltage" ? c.map(() => i.reference) : i.references.map((b) => b.reference), w = c.map((b, S) => 100 * Math.abs(E(b, e) - f[S]) / f[S]);
    if (l.some((b, S) => E(b, e) < 0 || !ie(E(b, e), w[S]))) throw new Error(`${e} response is invalid`);
    const v = Math.max(...w) > 1;
    if (s === "result_outside_tolerance" !== v || g !== (v && o < 3)) throw new Error(`${e} response is invalid`);
  }
  return n;
}
function me(n) {
  const e = Math.floor((n - 1) / 6), i = Math.floor((n - 1) % 6 / 3) + 1;
  return e === 0 ? `main_${i}` : `addon${e}_${i}`;
}
function zt(n, e, i) {
  const t = m(n, e), s = y(t.connection_generation, e), o = y(t.operation_sequence, e), r = i.target === "voltage" ? i.groupKey : me(i.references[0].channel), a = r.startsWith("main_") ? `meter_main${r.slice(-1)}` : r;
  if (s < 1 || o < 1 || _(t.instance_id, e) !== a) throw new Error(`${e} response is invalid`);
  const c = i.target === "current" ? new Map(i.references.map((p) => [["A", "B", "C"][(p.channel - 1) % 3], p.rawReference])) : /* @__PURE__ */ new Map(), l = C(t.phases, e, 3);
  if (l.length !== 3) throw new Error(`${e} response is invalid`);
  l.forEach((p, g) => {
    const f = m(p, e), w = x(f.phase, ne, e);
    if (w !== ["A", "B", "C"][g]) throw new Error(`${e} response is invalid`);
    E(f.measured_voltage, e), E(f.measured_current, e);
    const v = E(f.reference_voltage, e), b = E(f.reference_current, e), S = y(f.old_voltage_gain, e), I = y(f.new_voltage_gain, e), O = y(f.old_current_gain, e), G = y(f.new_current_gain, e);
    if ([S, I, O, G].some((T) => T < 1 || T > 65535)) throw new Error(`${e} response is invalid`);
    if (i.target === "voltage") {
      if (Math.abs(v - i.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(v), i.reference)) || Math.abs(b) > 1e-6 || O !== G) throw new Error(`${e} response is invalid`);
    } else {
      const T = c.get(w);
      if (Math.abs(v) > 1e-6 || (T === void 0 ? Math.abs(b) > 1e-6 : Math.abs(b - T) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(b), T))) || S !== I || T === void 0 && O !== G) throw new Error(`${e} response is invalid`);
    }
  });
  const u = C(t.register_mismatch_phases, e, 3);
  u.forEach((p) => x(p, ne, e));
  const d = C(t.matching_lines, e, 100);
  if (d.length === 0 || d.some((p) => typeof p != "string") || R(t.flash_saved, e) !== !0 || u.length !== 0 || R(t.calibration_disabled, e) !== !1) throw new Error(`${e} response is invalid`);
}
function Je(n) {
  const e = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(n);
  if (!e) return [];
  const i = e[2] === void 0 ? 0 : Number(e[2]), t = Number(e[1] ?? e[3]), s = i * 6 + (t - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}
function pe(n, e, i) {
  const t = m(n, e);
  for (const g of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) _(t[g], e);
  const s = y(t.topology_addon_count, e);
  x(t.topology_connection_type, be, e);
  const o = y(t.connection_generation, e), r = x(t.source_authority, /* @__PURE__ */ new Set(["saved_flash", "configuration"]), e), a = R(t.source_handoff_available, e), c = R(t.source_handoff_firmware_installed, e);
  he(t.source_handoff_transaction_id, e);
  const l = t.config_filename !== null || t.config_sha256 !== null;
  if (l && (_(t.config_filename, e), _(t.config_sha256, e), !Ht.test(t.config_filename) || !qt.test(t.config_sha256)))
    throw new Error(`${e} response is invalid`);
  if (t.config_filename === null != (t.config_sha256 === null) || a && (!l || c || t.source_handoff_transaction_id !== null || r !== "saved_flash") || !a && l && t.source_handoff_transaction_id === null || c && (!l || t.source_handoff_transaction_id === null) || r === "configuration" && (!c || a)) throw new Error(`${e} response is invalid`);
  if (!jt.test(t.mac) || !Be.test(t.verification_id) || o < 1 || t.source_handoff_transaction_id !== null && !Be.test(t.source_handoff_transaction_id) || s !== i.addon_count || t.topology_project_name !== i.project_name || t.topology_connection_type !== i.connection_type || t.topology_voltage_layout !== i.voltage_layout) throw new Error(`${e} response is invalid`);
  const u = C(t.groups, e, 14), d = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: s }, (g, f) => [`addon${f + 1}_1`, `addon${f + 1}_2`]).flat()]), p = /* @__PURE__ */ new Set();
  if (u.length < 1) throw new Error(`${e} response is invalid`);
  return u.forEach((g) => {
    const f = m(g, e), w = _(f.instance_id, e);
    if (!d.has(w) || p.has(w)) throw new Error(`${e} response is invalid`);
    p.add(w);
    const v = C(f.phase_gains, e, 3);
    if (v.length !== 3) throw new Error(`${e} response is invalid`);
    v.forEach((b) => {
      const S = C(b, e, 2);
      if (S.length !== 2) throw new Error(`${e} response is invalid`);
      S.forEach((I) => {
        const O = y(I, e);
        if (O < 1 || O > 65535) throw new Error(`${e} response is invalid`);
      });
    });
  }), n;
}
function Ft(n, e, i) {
  const t = m(n, e);
  return t.session !== null && j(t.session, e), t.transaction !== null && V(t.transaction, e), t.verified_calibration !== null && pe(t.verified_calibration, e, i), n;
}
class oe {
  constructor(e, i) {
    this.hass = e, this.entryId = i, this.setupStatus = () => this.call("setup_status", (t) => ee(t, "setup_status")), this.listMeters = () => this.call("list_meters", (t) => (C(t, "list_meters").forEach((s) => Ye(s, "list_meters")), t)), this.getTopology = (t) => this.call("get_topology", (s) => Gt(s, "get_topology"), { device_id: t }), this.getCtInventory = (t) => this.call("get_ct_inventory", (s) => Lt(s, "get_ct_inventory"), { device_id: t }), this.getActiveWork = (t, s) => this.call("get_active_work", (o) => Ft(o, "get_active_work", s), { device_id: t }), this.getSession = (t) => this.call("get_session", (s) => j(s, "get_session"), { session_id: t }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (t) => m(t, "get_diagnostics_summary")), this.setInstallerIntent = (t, s) => this.call("set_installer_intent", (o) => ee(o, "set_installer_intent"), { addon_count: t, connection_type: s }), this.rescan = () => this.call("rescan", (t) => ee(t, "rescan")), this.adoptDevice = (t) => this.call("adopt_device", (s) => {
      const o = m(s, "adopt_device");
      return _(o.device_id, "adopt_device"), _(o.configuration, "adopt_device"), s;
    }, { device_id: t }), this.previewCtConfig = (t, s, o, r) => this.call("preview_ct_config", (a) => V(a, "preview_ct_config"), {
      device_id: t,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.setHaLabels = (t, s, o, r) => this.call("set_ha_labels", (a) => a, {
      device_id: t,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.transaction = (t, s, o, r) => this.call(t, (a) => V(a, t), {
      device_id: s,
      transaction_id: o,
      source_sha256: r
    }), this.applyCtConfig = (t, s, o) => this.transaction("apply_ct_config", t, s, o), this.compileCtConfig = (t, s, o) => this.transaction("compile_ct_config", t, s, o), this.installCtConfig = (t, s, o) => this.transaction("install_ct_config", t, s, o), this.rollbackCtConfig = (t, s, o) => this.transaction("rollback_ct_config", t, s, o), this.startSession = (t) => this.call("start_session", (s) => j(s, "start_session"), { device_id: t }), this.acknowledgeSafety = (t) => this.call("acknowledge_safety", (s) => j(s, "acknowledge_safety"), { session_id: t, acknowledged: !0 }), this.checkStability = (t, s, o) => this.call("check_stability", (r) => qe(r, "check_stability", s, o), { session_id: t, target: s, target_id: o }), this.checkVoltageStability = (t, s) => s.length !== 2 || new Set(s).size !== 2 ? Promise.reject(new Error("check_stability board is invalid")) : this.call("check_stability", (o) => {
      const r = C(o, "check_stability", 2);
      if (r.length !== 2) throw new Error("check_stability response is invalid");
      return r.map((a, c) => qe(a, "check_stability", "voltage", s[c]));
    }, { session_id: t, target: "voltage", target_ids: s }), this.calibrateVoltage = (t, s, o) => {
      const r = s.map((a) => Je(a.group_key));
      return s.length !== 2 || new Set(s.map((a) => a.group_key)).size !== 2 || r.some((a) => a.length !== 3) || new Set(r.map((a) => Math.floor((a[0] - 1) / 6))).size !== 1 || s.some((a) => !Number.isFinite(a.reference) || a.reference <= 0) ? Promise.reject(new Error("calibrate_voltage board is invalid")) : this.call("calibrate_voltage", (a) => {
        const c = C(a, "calibrate_voltage", 2);
        if (c.length !== 2) throw new Error("calibrate_voltage response is invalid");
        return c.map((l, u) => He(l, "calibrate_voltage", {
          target: "voltage",
          groupKey: s[u].group_key,
          reference: s[u].reference
        }));
      }, { session_id: t, references: s, confirm_iteration: o });
    }, this.calibrateCurrent = (t, s, o, r = []) => s.length < 1 || s.length > 3 || new Set(s.map((a) => a.channel)).size !== s.length || new Set(s.map((a) => me(a.channel))).size !== 1 || s.some((a) => !Number.isInteger(a.channel) || a.channel < 1 || a.channel > 42 || !Number.isFinite(a.reference) || a.reference <= 0 || !Number.isFinite(a.reporting_multiplier) || a.reporting_multiplier < 1e-3 || a.reporting_multiplier > 1e3) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (a) => He(a, "calibrate_current", {
      target: "current",
      references: s.map((c) => ({ channel: c.channel, reference: c.reference, rawReference: c.reference / c.reporting_multiplier }))
    }), {
      session_id: t,
      references: s,
      confirm_iteration: o,
      pending_multipliers: r
    }), this.restartAndVerify = (t, s) => this.call("restart_and_verify", (o) => pe(o, "restart_and_verify", s), { session_id: t }), this.previewCalibratedGains = (t, s, o = []) => this.call("preview_calibrated_gains", (r) => V(r, "preview_calibrated_gains"), {
      session_id: t,
      verification_id: s,
      changes: o
    }), this.clearCalibrationFlash = (t, s, o, r) => this.call("clear_calibration_flash", (a) => pe(a, "clear_calibration_flash", r), {
      session_id: t,
      verification_id: s,
      transaction_id: o
    }), this.cancelSession = (t) => this.call("cancel_session", (s) => j(s, "cancel_session"), { session_id: t }), this.subscribeSetup = (t) => this.subscribe("subscribe_setup", {}, (s) => ee(s, "subscribe_setup"), t), this.subscribeConfigTransaction = (t, s, o, r) => this.subscribe("subscribe_config_transaction", {
      device_id: t,
      transaction_id: s,
      source_sha256: o
    }, (a) => V(a, "subscribe_config_transaction"), r), this.subscribeSession = (t, s) => this.subscribe("subscribe_session", { session_id: t }, (o) => j(o, "subscribe_session"), s);
  }
  static assertPublicPayload(e, i = !1, t = 0, s = "", o = !1) {
    if (t > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(e)) {
      if (e.length > 100) throw new Error(`unsafe collection ${s || "value"} refused`);
      for (const r of e) this.assertPublicPayload(r, !1, t + 1, s);
      return;
    }
    if (typeof e == "string") {
      const r = e.includes(`
`) || e.includes("\r"), a = s === "redacted_diff" ? 32768 : 4096;
      if (e.length > a || Et.test(e) || xt.test(e) || r && s !== "redacted_diff" || s === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${s || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [r, a] of Object.entries(e)) {
        if (r.length > 256 || It.test(r)) throw new Error("unsafe property name refused");
        if (r.toLowerCase() === "key" && !o) throw new Error(`private field ${r} refused`);
        if (r.toLowerCase() !== "raw_gain_ct" && kt.test(r))
          throw new Error(`private field ${r} refused`);
        if (i && t === 0 && r === "changes" && Array.isArray(a)) {
          if (a.length > 100) throw new Error("unsafe collection changes refused");
          for (const c of a) this.assertPublicPayload(c, !1, t + 2, "", !0);
        } else
          this.assertPublicPayload(a, !1, t + 1, r.toLowerCase());
      }
  }
  async call(e, i, t = {}) {
    const s = await this.hass.callWS({
      type: `${Ne}${e}`,
      entry_id: this.entryId,
      ...t
    });
    return oe.assertPublicPayload(s, De.has(e)), i(s);
  }
  subscribe(e, i, t, s) {
    return this.hass.connection.subscribeMessage((o) => {
      oe.assertPublicPayload(o, De.has(e)), s(t(o));
    }, { type: `${Ne}${e}`, entry_id: this.entryId, ...i });
  }
}
function Vt(n) {
  return h`
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
function Wt(n, e, i, t, s, o, r) {
  const a = n?.state ?? "previewed";
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      ${Vt(n)}
      ${a === "failed" ? h`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${n?.evidence.join(", ") || "The operation did not complete."}</p>
          ${n?.rollback_available ? h`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${e} ?disabled=${a !== "previewed"}>Apply</button>
        <button class="secondary" @click=${i} ?disabled=${a !== "validated"}>Compile</button>
        <button class="primary" @click=${t} ?disabled=${a !== "install_confirmation_required"}>Install</button>
      </div>
      ${n?.validation_detail ? h`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${n.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${n.validation_detail.error_record_count} records (${n.validation_detail.reported_error_count ?? "unreported"} reported)</dd></div>
        <div><dt>Warnings</dt><dd>${n.validation_detail.warning_record_count} records (${n.validation_detail.reported_warning_count ?? "unreported"} reported)</dd></div>
      </dl>` : ""}
      ${n?.upload_progress?.length ? h`<ul class="upload-progress">${n.upload_progress.map((c) => h`
        <li>${c.stage}: ${c.percentage ?? c.progress ?? "in progress"}${c.percentage != null || c.progress != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" data-action="continue" @click=${r} ?disabled=${a !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const ye = (n, e) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(n.key)) return;
  n.preventDefault();
  const t = [...n.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], s = n.key === "ArrowRight" || n.key === "ArrowDown", o = n.key === "Home" ? 0 : n.key === "End" ? t.length - 1 : (e + (s ? 1 : t.length - 1)) % t.length;
  t[o]?.click(), t[o]?.focus();
}, Ze = (n, e, i) => (n?.default_gain_ct ?? i) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((n?.default_gain_ct ?? i) / e);
function Kt(n, e, i, t, s, o, r, a = !1, c = !1) {
  const l = Math.ceil(n.channels.length / 6), u = n.channels.filter((d) => d.address.board_index === e).slice(0, 8);
  return h`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: l }, (d, p) => h`
          <button role="tab" id=${`board-tab-${p}`} data-board-tab=${p} aria-selected=${p === e}
            aria-controls="board-panel" tabindex=${p === e ? "0" : "-1"}
            @keydown=${(g) => ye(g, p)}
            @click=${() => t(p)}>${p === 0 ? "Main Board" : `Add-on ${p}`}</button>
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
          ${u.map((d) => {
    const p = i.get(d.channel) ?? {
      name: d.name,
      modelId: d.selected_model_id ?? "",
      multiplier: d.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, g = n.catalog.presets.find((v) => v.model_id === p.modelId), f = Ze(g, p.multiplier, p.modelId === "custom" ? p.customGainCt : void 0), w = $e(d, p);
    return h`
              <div class="ct-row" data-ct-row data-ct-group=${d.address.group_index} role="row" aria-rowindex=${d.channel + 1} aria-label=${`CT${d.channel}`}>
                <strong class="ct-index" role="cell">CT${d.channel}</strong>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${d.channel} name`} .value=${p.name}
                  @input=${(v) => s(d.channel, { name: v.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${d.channel} model`} ?disabled=${a}
                  @change=${(v) => {
      const b = v.target.value, S = n.catalog.presets.find((I) => I.model_id === b);
      s(d.channel, {
        modelId: b,
        burdenAcknowledged: d.selection_verified_against_config && b === d.selected_model_id && (b === "custom" || S?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${p.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((v) => h`<option value=${v.model_id} ?selected=${p.modelId === v.model_id}>${v.label}</option>`)}
                  <option value="custom" ?selected=${p.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${d.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${d.channel} multiplier`} ?disabled=${a}
                  .value=${String(p.multiplier)} @input=${(v) => s(d.channel, { multiplier: Number(v.target.value) })} /></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${f ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${g?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${p.expanded} @click=${() => s(d.channel, { expanded: !p.expanded })}>
                  ${p.modelId ? w ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${p.modelId === "custom" ? h`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${d.channel} custom gain`}
                  ?disabled=${a}
                  .value=${p.customGainCt === void 0 ? "" : String(p.customGainCt)}
                  @input=${(v) => s(d.channel, { customGainCt: Number(v.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${d.channel} custom label`} ?disabled=${a} .value=${p.customLabel ?? ""}
                  @input=${(v) => s(d.channel, { customLabel: v.target.value })} /></label>
              </div>` : $}
              ${p.modelId === "custom" || g?.requires_burden_jumper_cut ? h`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${d.channel} burden output acknowledgement`}
                  ?disabled=${a}
                  .checked=${p.burdenAcknowledged}
                  @change=${(v) => s(d.channel, { burdenAcknowledged: v.target.checked })} />
                  I checked the burden-output requirement for CT${d.channel}</label>
              </div>` : $}
              ${g && g.rated_current_a > 65.535 && p.multiplier === 1 ? h`<div class="warning-band" role="status">CT${d.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : $}
              ${p.expanded && g ? h`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${g.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${g.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${g.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${g.notes || (g.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : $}
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${u[0]?.channel ?? 0}–${u.at(-1)?.channel ?? 0} of ${n.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${c || !Jt(n, i, a)} @click=${r}>${c ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
function z(n, e) {
  return n.channels.flatMap((i) => {
    const t = e.get(i.channel);
    if (!t || !$e(i, t)) return [];
    const s = n.catalog.presets.find((r) => r.model_id === t.modelId), o = { channel: i.channel, name: t.name.trim(), model_id: t.modelId, reporting_multiplier: t.multiplier };
    return t.modelId === "custom" ? (t.customGainCt !== void 0 && (o.custom_gain_ct = t.customGainCt), t.customLabel !== void 0 && (o.custom_label = t.customLabel.trim()), o.burden_output_acknowledged = t.burdenAcknowledged) : s?.requires_burden_jumper_cut && (o.burden_output_acknowledged = t.burdenAcknowledged), [o];
  });
}
function $e(n, e) {
  return e.name !== n.name || e.modelId !== (n.selected_model_id ?? "") || e.multiplier !== n.reporting_multiplier || e.modelId === "custom" && (Ze(void 0, e.multiplier, e.customGainCt) !== n.raw_gain_ct || (e.customLabel?.trim() ?? "") !== (n.display_label ?? ""));
}
function Yt(n, e) {
  if (!e.name.trim() || !e.modelId || !Number.isFinite(e.multiplier) || e.multiplier <= 0) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const i = n.catalog.presets.find((t) => t.model_id === e.modelId);
  return !!i && (!i?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function Jt(n, e, i = !1) {
  if (i) return [...e].every(([t, s]) => {
    const o = n.channels.find((r) => r.channel === t);
    return !!o && !!s.name.trim() && s.modelId === (o.selected_model_id ?? "") && s.multiplier === o.reporting_multiplier;
  });
  for (const t of n.channels) {
    const s = e.get(t.channel);
    if (!s || $e(t, s) && !Yt(n, s))
      return !1;
  }
  return !0;
}
const M = (n) => n.toFixed(2);
function Xe(n, e, i) {
  const t = [n, !!e?.stable, !!i, !!i?.gain_evidence, !!i], s = t.findIndex((r) => !r);
  return h`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((r, a) => h`<li
    class=${t[a] ? "complete" : a === s ? "active" : "pending"}><span
      class="progress-number">${a + 1}</span><span>${r}</span></li>`)}</ol>`;
}
function Qe(n, e) {
  const i = Object.entries(n?.calibration_sources ?? {}).filter(([t]) => e === void 0 || e.includes(t));
  return h`<section class="measurement-evidence calibration-source" aria-label="Current calibration source">
    <h3>Current calibration source</h3>
    ${i.length ? h`<table><thead><tr><th>Chip</th><th>Source</th><th>Saved in flash</th></tr></thead><tbody>
      ${i.map(([t, s]) => h`<tr><td>${t}</td><td>${s === "configuration" ? "Configuration" : s === "flash" ? "Saved flash" : "Unknown"}</td><td>${s === "flash" ? "Yes" : s === "configuration" ? "No" : "Unknown"}</td></tr>`)}
    </tbody></table>` : h`<p>Calibration source is not available.</p>`}
  </section>`;
}
function we(n, e) {
  if (!n) return $;
  const i = n.target === "voltage" ? "V" : "A";
  return h`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((t, s) => h`<dl>
      <div><dt>${e?.[s] ?? (n.target === "voltage" ? `V${s % 3 + 1}` : `A${s + 1}`)}</dt>
        <dd>${t.samples.map((o) => `${M(o)} ${i}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}
function Se(n) {
  return n ? h`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${n.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${n.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${n.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${n.before_values.map(M).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${n.after_values.map(M).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${n.error_percent_values.map((e) => `${M(e)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${n.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${n.gain_evidence ? h`<h4>Gain evidence · ${n.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${n.gain_evidence.phases?.map((e) => h`<tr><td>${e.phase}</td><td>${M(e.measured_voltage)}</td><td>${M(e.measured_current)}</td><td>${M(e.reference_voltage)}</td><td>${M(e.reference_current)}</td><td>${e.old_voltage_gain} → ${e.new_voltage_gain}</td><td>${e.old_current_gain} → ${e.new_current_gain}</td></tr>`) ?? $}
      </tbody></table><p>Saved in flash: ${n.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : h`<p>Gain evidence unavailable.</p>`}
  </section>` : $;
}
function Zt(n, e, i, t, s, o, r, a, c, l, u, d, p, g, f) {
  const w = n?.ct_count ?? e?.channels.length ?? 6, v = Math.floor((t - 1) / 6), S = Math.floor((t - 1) / 3) * 3 + 1, I = Array.from({ length: 3 }, (A, k) => S + k).filter((A) => A <= w), O = I.filter((A) => (s.get(A) ?? 0) > 0), G = v === 0 ? ["meter_main1", "meter_main2"] : [`addon${v}_1`, `addon${v}_2`], T = e === null, it = o !== null && Number.isFinite(o) && o >= 1e-3 && o <= 1e3, ce = O.length > 0 && (!T || it);
  return h`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Xe(ce, r, a)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(w / 6) }, (A, k) => h`<button role="tab"
          id=${`current-board-tab-${k}`} aria-controls="current-board-panel"
          aria-selected=${k === v} tabindex=${k === v ? "0" : "-1"}
          @keydown=${(Q) => ye(Q, k)}
          @click=${() => c(k * 6 + 1)}>${k === 0 ? "Main Board" : `Add-on ${k}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${v}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((A) => {
    const k = v * 6 + A * 3 + 1;
    return h`<button
          aria-pressed=${k === S} @click=${() => c(k)}>Group ${v * 2 + A + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${S}–CT${S + 2}</h2>
      ${Qe(i, G)}
      <div class="reference-block">
        ${I.map((A) => h`<label>CT${A} reference
          <input data-current-reference=${A} aria-label=${`CT${A} reference`} type="number" min="0.01" step="0.01"
            .value=${s.has(A) ? String(s.get(A)) : ""}
            @input=${(k) => {
    const Q = k.target;
    l(A, Q.value === "" ? null : Number(Q.value));
  }} /></label>`)}
      ${T ? h`<label>Reporting multiplier <input data-role="reporting-multiplier" type="number" min="0.001" max="1000" step="0.001" required .value=${o === null ? "" : String(o)} @input=${(A) => {
    const k = Number(A.target.value);
    u(Number.isFinite(k) && k >= 1e-3 && k <= 1e3 ? k : null);
  }} /></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
        <button class="primary" @click=${p} ?disabled=${!ce || !r?.stable || (a?.iteration ?? 0) >= 3 || !!(a && !a.retry_allowed && a.iteration > 0)}>${a?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${d} ?disabled=${!ce}>Check stability</button></div>
      ${r ? h`<div class=${r.stable ? "success-band" : "warning-band"} role="status">${r.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${we(r, O.map((A) => `CT${A}`))}
      ${Se(a)}
      ${a?.state.includes("indeterminate") ? h`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${g}>Reconnect and inspect</button><button class="danger" @click=${f}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
function Xt(n, e, i, t, s, o) {
  const r = n.includes("failed") || n.includes("indeterminate");
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, and entity bindings.</p>
      <div class="status-band" role="status">${n || "Ready for restart verification"}</div>
      ${e ? h`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${e.source_handoff_available ? e.config_filename : "Unavailable in runtime-only mode"}</dd></div></dl>` : ""}
      ${n === "cancelled" ? h`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${r ? h`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${i ? h`<button class="danger" data-action="rollback" @click=${s}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${o}>Back</button><button class="primary" @click=${t} ?disabled=${n === "cancelled" || !!e}>${n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Qt(n) {
  return n ? n.preflight.issues.length ? h`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((e) => h`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : h`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : h`<p>Starting a calibration session…</p>`;
}
function ei(n, e, i, t, s, o, r = !1) {
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      ${Qt(n)}
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
        <label class="check-row"><input type="checkbox" .checked=${e} @change=${(a) => i(a.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${s}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" @click=${t} ?disabled=${r || n?.state === "cancelled" || !e || !!n?.preflight.issues.length}>${r ? "Loading calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const Ge = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], ti = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function ii(n, e, i, t, s, o, r, a, c = "") {
  return h`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Configure an existing device</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        ${n?.devices.length ? h`<div class="meter-list">
          ${n.devices.map((l) => h`
            <div class="meter-row">
              <span><strong>${l.title}</strong><small>${l.project_name} · ${l.project_version ?? "version unavailable"}</small></span>
              <span>Device Builder: ${l.configuration ? "Yes" : l.importable ? "Yes — import available" : "No"}</span>
              ${l.importable && !l.configuration ? h`<button class="secondary" ?disabled=${!!c}
                @click=${() => a(l.entry_id)}>Import</button>` : ""}
              <button class="primary" data-action="configure-device" ?disabled=${!!c}
                @click=${() => r(l.entry_id)}>${c === `topology:${l.entry_id}` ? "Loading topology…" : "Configure"}</button>
            </div>
          `)}
        </div>` : h`<div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>`}
        <button class="rescan" data-action="rescan" ?disabled=${!!c} @click=${o}>${c === "rescan" ? "Rescanning…" : "Rescan"}</button>
      </section>
      <hr />
      <h2>Set up a new device</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (l, u) => h`
            <label class=${u === e ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(u)}
                .checked=${u === e} @change=${() => t(u)} />
              <span>${u}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${Ge.map(([l, u]) => h`
            <label class=${l === i ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${l}
                .checked=${l === i} @change=${() => s(l)} />
              <span>${u}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>IO0</dt><dd><strong>OPEN</strong> (not connected)</dd></div>
          <div><dt>Add-on boards</dt><dd>${e}</dd></div>
          <div><dt>Connection</dt><dd>${Ge.find(([l]) => l === i)?.[1]}</dd></div>
          ${ti.slice(0, e).map((l, u) => h`<div><dt>Add-on ${u + 1}</dt><dd>${l}</dd></div>`)}
        </dl>
      </section>
      <p class="info-band">Use Web Serial in a supported Chromium browser and a USB data cable to flash the firmware.</p>
      <section class="io-guidance" aria-labelledby="io-heading">
        <h2 id="io-heading">IO0 guidance</h2>
        <p>Keep IO0 OPEN (not connected) while flashing. Do not connect IO0 to GND.</p>
      </section>
      <p class="info-band">${i === "wifi" ? "The external installer collects Wi-Fi provisioning details; this helper does not." : "Connect Ethernet after flashing, then wait for the meter to appear on your network."}</p>
      <section aria-labelledby="installer-heading">
        <h2 id="installer-heading">Flash in external installer</h2>
        <p>Flashing happens in the external installer. This helper continues only after your device is on the network and discovered.</p>
        <button class="primary installer" @click=${() => window.open(
    "https://circuitsetup.github.io/ESPWebInstaller/",
    "_blank",
    "noopener,noreferrer"
  )}>Open CircuitSetup Web Installer</button>
      </section>
    </section>
  `;
}
function et(n, e, i, t, s, o = null) {
  return h`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((r) => h`<li>${r.source}: ${r.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...t.entries()].map(([r, a]) => h`<div data-target=${r}>${we(a)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([r, a]) => h`<div data-target=${r}>${Se(a)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${i?.evidence.join(", ") || "No build evidence."}</p><p>${i?.progress.join(", ") || "No transaction progress."}</p>
          ${i?.validation_detail ? h`<p>Validation code ${i.validation_detail.code ?? "unavailable"}; ${i.validation_detail.error_record_count} error records; ${i.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${i?.upload_progress?.length ? h`<ul>${i.upload_progress.map((r) => h`<li>${r.stage}: ${r.percentage ?? r.progress ?? "in progress"}${r.percentage != null || r.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Authority source</h3><p>${o?.source_authority.replaceAll("_", " ") ?? "Not yet established"}</p><p>${o ? `Verification ${o.verification_id}, generation ${o.connection_generation}` : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function si(n, e, i, t, s, o, r, a, c) {
  const l = o?.source_authority === "saved_flash" && o.config_filename && (o.source_handoff_available || o.source_handoff_firmware_installed);
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      ${o?.source_authority === "configuration" ? h`<div class="success-band" role="status">Calibration saved to YAML; flash values cleared.</div>` : o ? h`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : h`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${r ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${o?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${o?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${et(n, e, i, t, s, o)}
      <footer class="action-footer"><button class="secondary" @click=${c}>Back</button>
        ${l ? h`<button class="primary" data-action="save-calibration" @click=${a}>${o?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : ""}
      </footer>
    </section>
  `;
}
function tt(n) {
  const e = n.addon_count, i = n.evidence.map((t) => t.source);
  return e < 0 || e > 6 || n.board_count !== e + 1 || n.ct_count !== 6 * (e + 1) || n.group_count !== 2 * (e + 1) || n.evidence.length < 1 || n.evidence.length > 5 || new Set(i).size !== i.length || !i.some((t) => ["config_project", "config_packages", "native_project"].includes(t)) || n.evidence.some((t) => t.addon_count !== e);
}
function ni(n, e, i, t, s = !1, o = !1) {
  const r = s || tt(n);
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
        <tbody>${n.evidence.map((a) => h`
          <tr><td>${a.source.replaceAll("_", " ")}</td><td>${a.addon_count}</td><td>${a.detail}</td></tr>
        `)}</tbody>
      </table>
      ${r ? h`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : h`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${i}>Back</button>
        ${r ? "" : h`<button class="primary" data-action="continue" ?disabled=${o} @click=${t}>${o ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
function oi(n, e, i, t, s, o, r, a, c, l, u, d, p) {
  const g = n?.voltage_layout === "two_voltages" ? 2 : 1, f = t.slice(0, g).every((v) => Number.isFinite(v) && v > 0), w = i === 0 ? ["meter_main1", "meter_main2"] : [`addon${i}_1`, `addon${i}_2`];
  return h`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Xe(f, s, o)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: n?.board_count ?? 1 }, (v, b) => h`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${b}`} aria-controls="voltage-board-panel"
          aria-selected=${b === i} tabindex=${b === i ? "0" : "-1"}
          @keydown=${(S) => ye(S, b)}
          @click=${() => a(b)}>${b === 0 ? "Main Board" : `Add-on ${b}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${i}`}>
      <h2>Calibrate Voltage</h2>
      ${Qe(e, w)}
      <div class="reference-block">
        ${Array.from({ length: g }, (v, b) => h`<label>${g === 1 ? "Trusted instrument reference" : `Voltage ${b + 1} trusted reference`}
          <input type="number" min="0.01" step="0.01" .value=${t[b] ? String(t[b]) : ""}
            @input=${(S) => c(b, Number(S.target.value))} /></label>`)}
        <button class="primary" @click=${u} ?disabled=${r || !f || !s?.stable || !!(o && !o.retry_allowed && o.iteration > 0)}>${o?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${l} ?disabled=${r}>${r ? "Loading live voltage data…" : "Check stability"}</button></div>
      ${s ? h`<div class=${s.stable ? "success-band" : "warning-band"} role="status">${s.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${we(s)}
      ${Se(o)}
      ${o?.state === "indeterminate" ? h`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${d}>Reconnect and inspect</button><button class="danger" @click=${p}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const ri = nt`
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
`, F = [
  ["setup", "Setup Device"],
  ["topology", "Topology"],
  ["ct", "CT Settings"],
  ["safety", "Safety"],
  ["voltage", "Voltage"],
  ["current", "Current"],
  ["restart", "Restart"],
  ["build", "Flash & Verify"],
  ["summary", "Summary"]
];
class ai extends K {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.calibrationHandoff = !1, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.sessionStarting = !1, this.pendingAction = "", this.voltageBusy = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = ri;
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
    this.ensureApi(e);
  }
  disconnectedCallback() {
    ++this.connectionGeneration, ++this.operationGeneration, ++this.transactionSubscriptionScope, ++this.sessionSubscriptionScope;
    for (const e of this.unsubs.splice(0))
      try {
        e();
      } catch {
      }
    this.transactionUnsub = null, this.sessionUnsub = null, this.api = null, super.disconnectedCallback();
  }
  updated(e) {
    (e.has("hass") || e.has("panel")) && this.isConnected && this.ensureApi(this.connectionGeneration), this.error ? this.shadowRoot?.querySelector("[role=alert]")?.focus() : this.focusHeading && (this.focusHeading = !1, this.shadowRoot?.querySelector("#step-heading")?.focus());
  }
  async ensureApi(e) {
    if (this.api || !this.isConnected || !this.hass || !this.panel?.config.entry_id) return;
    const i = new oe(this.hass, this.panel.config.entry_id);
    this.api = i;
    try {
      const t = await i.setupStatus();
      if (!this.owns(e, i)) return;
      this.setup = t;
      const s = this.setup.installer_intent;
      s && (this.addonCount = s.addon_count, this.connection = s.connection_type), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.setup.devices[0]?.entry_id ?? null), await this.ownSubscription(i.subscribeSetup((o) => {
        this.owns(e, i) && (this.setup = o, !this.selectedDeviceId && o.devices.length && this.selectDevice(o.devices[0]?.entry_id ?? null), this.requestUpdate());
      }), e, i), this.transaction && await this.subscribeTransaction(e), this.session && this.session.state !== "cancelled" && await this.subscribeSession(e);
    } catch (t) {
      this.owns(e, i) && this.fail(t, "Setup status could not be loaded.");
    }
    this.requestUpdate();
  }
  owns(e, i) {
    return this.isConnected && e === this.connectionGeneration && i === this.api;
  }
  ownsOperation(e, i, t) {
    return e === this.operationGeneration && i === this.api && t === this.selectedDeviceId;
  }
  async ownSubscription(e, i, t, s = () => !0, o = () => {
  }) {
    const r = await e;
    if (!this.owns(i, t) || !s()) {
      try {
        r();
      } catch {
      }
      return;
    }
    this.unsubs.push(r), o(r);
  }
  clearSubscription(e) {
    e === "transaction" ? ++this.transactionSubscriptionScope : ++this.sessionSubscriptionScope;
    const i = e === "transaction" ? this.transactionUnsub : this.sessionUnsub;
    if (e === "transaction" ? this.transactionUnsub = null : this.sessionUnsub = null, !i) return;
    const t = this.unsubs.indexOf(i);
    t >= 0 && this.unsubs.splice(t, 1);
    try {
      i();
    } catch {
    }
  }
  resetCalibrationRun() {
    this.safetyAcknowledged = !1, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.calibrationHandoff = !1, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null;
  }
  selectDevice(e) {
    ++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = e, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.board = 0, this.resetCalibrationRun();
  }
  showTopology(e) {
    this.topology = e, this.navigate("topology"), this.error = tt(e) || e.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
  }
  showInventory(e) {
    this.inventory = e, this.drafts = new Map(e.channels.map((i) => {
      const t = i.selected_model_id ?? "", s = e.catalog.presets.find((o) => o.model_id === t);
      return [i.channel, {
        name: i.name,
        modelId: t,
        multiplier: i.reporting_multiplier,
        customGainCt: t === "custom" || i.selected_model_id === null ? i.raw_gain_ct * i.reporting_multiplier : void 0,
        customLabel: i.display_label ?? void 0,
        burdenAcknowledged: i.selection_verified_against_config && (t === "custom" || s?.requires_burden_jumper_cut === !0),
        expanded: i.selected_model_id === null && i.raw_gain_ct === 27518
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
    this.step === "topology" ? (this.selectDevice(null), this.navigate("setup")) : this.step === "ct" ? this.navigate("topology") : this.step === "safety" ? this.cancelSession("ct") : this.step === "voltage" ? this.navigate("safety") : this.step === "current" ? this.navigate("voltage") : this.step === "restart" ? this.navigate("current") : this.step === "build" ? this.navigate(this.calibrationHandoff ? "restart" : "ct") : this.step === "summary" && this.navigate("build");
  }
  returnToSetup() {
    this.session && this.session.state !== "cancelled" ? this.cancelSession("setup") : (this.selectDevice(null), this.navigate("setup"));
  }
  async configureDevice(e) {
    if (!this.pendingAction) {
      this.selectDevice(e), this.pendingAction = `topology:${e}`, this.requestUpdate();
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
    const e = this.api, i = this.selectedDeviceId, t = ++this.operationGeneration;
    await this.run(async () => {
      if (await e.setInstallerIntent(this.addonCount, this.connection), !this.ownsOperation(t, e, i)) return;
      const s = await e.rescan();
      this.ownsOperation(t, e, i) && (this.setup = s, s.devices.length ? this.announcement = "Compatible meter discovered. Select it above to configure it." : this.announcement = "No compatible meter found. Check the network and rescan.");
    }, "Rescan failed.", () => this.ownsOperation(t, e, i)), this.pendingAction = "", this.requestUpdate();
  }
  async adopt(e = this.selectedDeviceId) {
    if (!this.api || !e) return;
    e !== this.selectedDeviceId && this.selectDevice(e);
    const i = this.api, t = ++this.operationGeneration;
    await this.run(async () => {
      await i.adoptDevice(e), this.ownsOperation(t, i, e) && (this.announcement = "Meter adopted in Device Builder.");
    }, "Adoption is unavailable for this meter.", () => this.ownsOperation(t, i, e));
  }
  async loadTopology() {
    if (!this.api || !this.selectedDeviceId) return;
    const e = this.api, i = this.selectedDeviceId, t = ++this.operationGeneration;
    await this.run(async () => {
      const s = await e.getTopology(i);
      this.ownsOperation(t, e, i) && this.showTopology("topology" in s ? s.topology : s);
    }, "Topology evidence could not be loaded.", () => this.ownsOperation(t, e, i));
  }
  async loadInventory() {
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    this.pendingAction = "inventory", this.requestUpdate();
    const e = this.api, i = this.selectedDeviceId, t = ++this.operationGeneration;
    try {
      await this.run(async () => {
        const s = await e.getCtInventory(i);
        this.ownsOperation(t, e, i) && this.showInventory(s);
      }, "CT inventory could not be loaded.", () => this.ownsOperation(t, e, i));
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
  }
  async recoverCtInventory(e, i, t, s) {
    const o = await e.getCtInventory(i);
    this.ownsOperation(t, e, i) && (this.clearSubscription("transaction"), this.transaction = null, this.showInventory(o), this.drafts = new Map(Array.from(this.drafts, ([r, a]) => [r, s.get(r) ?? a])), this.announcement = "Live CT data reloaded. Review the preserved changes again.");
  }
  updateDraft(e, i) {
    const t = this.drafts.get(e);
    t && (this.drafts = new Map(this.drafts).set(e, { ...t, ...i }), this.requestUpdate());
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    const e = z(this.inventory, this.drafts);
    if (!e.length) return this.fail(new Error(), "Select at least one CT change before review.");
    const i = this.api, t = this.selectedDeviceId, s = this.inventory, o = ++this.operationGeneration;
    if (this.clearSubscription("transaction"), this.transaction = null, this.labelOnly) {
      const r = e.filter((a) => a.name !== this.inventory.channels.find((c) => c.channel === a.channel)?.name).map(({ channel: a, name: c }) => ({ channel: a, name: c }));
      if (!r.length || e.some((a) => {
        const c = this.inventory.channels.find((l) => l.channel === a.channel);
        return !c || a.model_id !== (c.selected_model_id ?? "") || (a.reporting_multiplier ?? 1) !== c.reporting_multiplier;
      }))
        return this.fail(new Error(), "Home Assistant label mode only permits display-name edits.");
      await this.run(
        async () => {
          await i.setHaLabels(t, s.plan_id, s.source_sha256, r), this.announcement = "Home Assistant labels saved.";
        },
        "Home Assistant labels could not be saved.",
        () => this.ownsOperation(o, i, t)
      );
      return;
    }
    await this.run(
      async () => {
        let r;
        try {
          const a = await i.getCtInventory(t);
          if (!this.ownsOperation(o, i, t)) return;
          r = await i.previewCtConfig(
            t,
            a.plan_id,
            a.source_sha256,
            e
          );
        } catch (a) {
          if (a.code !== "stale_confirmation") throw a;
          await this.recoverCtInventory(i, t, o, this.drafts);
          return;
        }
        this.ownsOperation(o, i, t) && (this.transaction = r, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "The configuration preview is stale. Reload the CT inventory and review again.",
      () => this.ownsOperation(o, i, t)
    );
  }
  async subscribeTransaction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const i = this.api;
    this.clearSubscription("transaction");
    const t = this.transactionSubscriptionScope, s = this.selectedDeviceId, o = this.transaction.transaction_id, r = this.transaction.source_sha256;
    await this.ownSubscription(
      i.subscribeConfigTransaction(
        s,
        o,
        r,
        (a) => {
          this.owns(e, i) && t === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === o && this.transaction.source_sha256 === r && a.transaction_id === o && a.source_sha256 === r && (this.transaction = a, this.requestUpdate());
        }
      ),
      e,
      i,
      () => t === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === o && this.transaction.source_sha256 === r,
      (a) => {
        this.transactionUnsub = a;
      }
    );
  }
  async continueFromCt() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || this.pendingAction) return;
    const e = z(this.inventory, this.drafts);
    if (this.labelOnly && e.length) {
      const i = e.map(({ channel: a, name: c }) => ({ channel: a, name: c })), t = this.api, s = this.selectedDeviceId, o = this.inventory, r = ++this.operationGeneration;
      if (this.pendingAction = "session", this.requestUpdate(), await this.run(async () => {
        await t.setHaLabels(s, o.plan_id, o.source_sha256, i), this.ownsOperation(r, t, s) && (this.inventory = { ...o, channels: o.channels.map((a) => {
          const c = i.find((l) => l.channel === a.channel);
          return c ? { ...a, name: c.name } : a;
        }) }, this.announcement = "Home Assistant labels saved.");
      }, "Home Assistant labels could not be saved.", () => this.ownsOperation(r, t, s)), this.pendingAction = "", this.error) return;
    }
    await this.startSession();
  }
  async reviewCalibrationHandoff() {
    if (!this.api || !this.session || !this.restartResult?.source_handoff_available) return;
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = this.restartResult.verification_id, o = ++this.operationGeneration;
    this.clearSubscription("transaction"), this.transaction = null, await this.run(
      async () => {
        const r = this.inventory && !this.labelOnly ? z(this.inventory, this.drafts) : [], a = await e.previewCalibratedGains(t, s, r);
        !this.ownsOperation(o, e, i) || this.session?.session_id !== t || this.restartResult?.verification_id !== s || (this.calibrationHandoff = !0, this.transaction = a, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "Calibration gains could not be prepared for YAML review.",
      () => this.ownsOperation(o, e, i)
    );
  }
  async clearCalibrationHandoff() {
    const e = this.restartResult;
    if (!this.api || !this.session || !this.topology || !e?.source_handoff_firmware_installed || !e.source_handoff_transaction_id) return;
    const i = this.api, t = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration;
    await this.run(
      async () => {
        const r = await i.clearCalibrationFlash(
          s,
          e.verification_id,
          e.source_handoff_transaction_id,
          this.topology
        );
        !this.ownsOperation(o, i, t) || this.session?.session_id !== s || (this.restartResult = r, this.announcement = "Calibration saved to YAML; flash values cleared.", this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash."));
      },
      "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values.",
      () => this.ownsOperation(o, i, t)
    );
  }
  async transactionAction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const i = this.api, t = this.selectedDeviceId, s = this.transaction, o = ++this.operationGeneration;
    await this.run(
      async () => {
        const r = [t, s.transaction_id, s.source_sha256];
        let a;
        try {
          a = e === "apply" ? await i.applyCtConfig(...r) : e === "compile" ? await i.compileCtConfig(...r) : e === "install" ? await i.installCtConfig(...r) : await i.rollbackCtConfig(...r);
        } catch (c) {
          if (c.code !== "stale_confirmation") throw c;
          await this.recoverCtInventory(i, t, o, this.drafts);
          return;
        }
        if (!(!this.ownsOperation(o, i, t) || this.transaction?.transaction_id !== s.transaction_id || this.transaction.source_sha256 !== s.source_sha256))
          if (this.transaction = a, this.announcement = `Configuration ${this.transaction.state}.`, e === "install" && this.calibrationHandoff && a.state === "verified" && this.session && this.topology && this.restartResult) {
            this.restartResult = {
              ...this.restartResult,
              source_handoff_available: !1,
              source_handoff_transaction_id: a.transaction_id,
              source_handoff_firmware_installed: !0
            }, this.navigate("summary");
            const c = await i.clearCalibrationFlash(
              this.session.session_id,
              this.restartResult.verification_id,
              a.transaction_id,
              this.topology
            );
            if (!this.ownsOperation(o, i, t)) return;
            this.restartResult = c, this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash.");
          } else e === "install" && a.state === "verified" && this.finishFlow("Configuration changes were installed and verified.");
      },
      e === "install" && this.calibrationHandoff ? "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values." : "This confirmation is stale. Reload the CT inventory before making another change.",
      () => this.ownsOperation(o, i, t)
    );
  }
  async startSession() {
    if (!(!this.api || !this.selectedDeviceId || this.sessionStarting || this.pendingAction)) {
      this.sessionStarting = !0, this.pendingAction = "session", this.requestUpdate();
      try {
        const e = this.api, i = this.selectedDeviceId, t = ++this.operationGeneration;
        this.clearSubscription("session"), this.session = null, this.resetCalibrationRun(), await this.run(async () => {
          if (!this.topology) throw new Error("Topology is required before calibration");
          const s = await e.getActiveWork(i, this.topology);
          if (!this.ownsOperation(t, e, i)) return;
          if (this.session = s.session?.state === "cancelled" ? null : s.session, this.transaction = s.transaction, this.safetyAcknowledged = this.session?.safety_acknowledged ?? !1, this.calibrationHandoff = !!(this.transaction && s.verified_calibration && s.verified_calibration.source_handoff_transaction_id === this.transaction.transaction_id), this.restartResult = this.calibrationHandoff || this.session?.state === "verified" ? s.verified_calibration : null, this.transaction) {
            this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration), this.session && await this.subscribeSession(this.connectionGeneration);
            return;
          }
          if (this.session) {
            this.navigate(this.session.state === "safety_required" || this.session.state === "preflight_failed" ? "safety" : this.session.state === "applied_pending_restart_verification" ? "restart" : this.session.state === "verified" && this.restartResult ? "summary" : "voltage"), await this.subscribeSession(this.connectionGeneration);
            return;
          }
          const o = await e.startSession(i);
          !this.ownsOperation(t, e, i) || o.device_id !== i || (this.session = o, this.navigate("safety"), await this.subscribeSession(this.connectionGeneration));
        }, "Calibration session could not be started.", () => this.ownsOperation(t, e, i));
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
    const i = this.api;
    this.clearSubscription("session");
    const t = this.sessionSubscriptionScope, s = this.session.session_id, o = this.session.device_id;
    await this.ownSubscription(
      i.subscribeSession(s, (r) => {
        this.owns(e, i) && t === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === o && r.session_id === s && r.device_id === o && (this.session = r, this.requestUpdate());
      }),
      e,
      i,
      () => t === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === o,
      (r) => {
        this.sessionUnsub = r;
      }
    );
  }
  async acknowledgeSafety() {
    if (!this.api || !this.session || this.pendingAction) return;
    this.pendingAction = "safety", this.requestUpdate();
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = ++this.operationGeneration;
    await this.run(async () => {
      const o = await e.acknowledgeSafety(t);
      !this.ownsOperation(s, e, i) || o.session_id !== t || (this.session = o, this.navigate("voltage"));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(s, e, i)), this.pendingAction = "", this.requestUpdate();
  }
  async checkStability(e) {
    if (!this.api || !this.session || e === "voltage" && this.voltageBusy) return;
    const i = this.api, t = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration, r = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((a) => String(a.channel));
    if (r.length) {
      e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
      try {
        await this.run(async () => {
          if (e === "voltage") {
            const a = await i.checkVoltageStability(s, r);
            if (!this.ownsOperation(o, i, t) || this.session?.session_id !== s) return;
            const c = new Map(this.stabilityByTarget);
            a.forEach((l) => c.set(`voltage:${l.target_id}`, l)), this.stabilityByTarget = c, this.announcement = "Loaded voltage data from both chips on this board.";
            return;
          }
          for (const [a, c] of r.entries()) {
            const l = await i.checkStability(s, e, c);
            if (!this.ownsOperation(o, i, t) || this.session?.session_id !== s) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${c}`, l), a < r.length - 1 && this.requestUpdate();
          }
        }, "Stable samples could not be collected.", () => this.ownsOperation(o, i, t));
      } finally {
        e === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
      }
    }
  }
  async calibrate(e) {
    if (!this.api || !this.session || e === "voltage" && this.voltageBusy) return;
    const i = this.api, t = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration, r = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((c) => String(c.channel)), a = this.currentReferenceEntries();
    if (e === "current" && !a.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      return;
    }
    e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
    try {
      await this.run(
        async () => {
          if (e === "voltage") {
            const u = await i.calibrateVoltage(s, r.map((p, g) => ({
              group_key: p,
              reference: this.voltageReferences[this.topology?.voltage_layout === "two_voltages" ? g : 0]
            })), !0);
            if (!this.ownsOperation(o, i, t) || this.session?.session_id !== s) return;
            const d = new Map(this.calibrationByTarget);
            u.forEach((p) => d.set(`voltage:${p.group_key}`, p)), this.calibrationByTarget = d, this.announcement = "Calibrated both voltage chips on this board.";
            return;
          }
          const c = await i.calibrateCurrent(
            s,
            a,
            !0,
            this.inventory && !this.labelOnly ? z(this.inventory, this.drafts).map((u) => ({
              channel: u.channel,
              reporting_multiplier: u.reporting_multiplier ?? 1
            })) : []
          );
          if (!this.ownsOperation(o, i, t) || this.session?.session_id !== s) return;
          const l = new Map(this.calibrationByTarget);
          a.forEach((u) => l.set(`current:${u.channel}`, c)), this.calibrationByTarget = l, this.announcement = `Calibration iteration ${c.iteration} finished with state ${c.state}.`;
        },
        "Calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(o, i, t)
      );
    } finally {
      e === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
    }
  }
  groupKey(e) {
    const i = Math.floor(e / 2), t = e % 2 + 1;
    return i === 0 ? `main_${t}` : `addon${i}_${t}`;
  }
  voltageGroupKeys() {
    return this.topology ? [this.groupKey(this.board * 2), this.groupKey(this.board * 2 + 1)] : [this.groupKey(this.group)];
  }
  currentReferenceEntries() {
    const e = Math.floor((this.channel - 1) / 3) * 3 + 1;
    return Array.from({ length: 3 }, (i, t) => e + t).flatMap((i) => {
      const t = this.currentReferences.get(i), s = this.drafts.get(i)?.multiplier ?? this.inventory?.channels[i - 1]?.reporting_multiplier ?? this.reportingMultiplier;
      return t && t > 0 && s !== null ? [{ channel: i, reference: t, reporting_multiplier: s }] : [];
    });
  }
  async restart() {
    if (!this.api || !this.session || !this.topology) return;
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = this.topology, o = ++this.operationGeneration;
    this.restartResult = null, await this.run(
      async () => {
        let a;
        try {
          a = await e.restartAndVerify(t, s);
        } catch (c) {
          throw this.ownsOperation(o, e, i) && this.session?.session_id === t && this.topology === s && (this.restartResult = null, this.session = { ...this.session, state: "restart_failed" }), c;
        }
        !this.ownsOperation(o, e, i) || this.session?.session_id !== t || this.topology !== s || (this.restartResult = a, this.session = { ...this.session, state: "verified" });
      },
      "Restart verification failed; review recovery evidence before rollback.",
      () => this.ownsOperation(o, e, i)
    ), this.restartResult?.source_handoff_available && await this.reviewCalibrationHandoff();
  }
  async cancelSession(e = "safety") {
    if (!this.api || !this.session) return;
    const i = this.api, t = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration;
    await this.run(async () => {
      const r = await i.cancelSession(s);
      !this.ownsOperation(o, i, t) || this.session?.session_id !== s || (this.clearSubscription("session"), this.session = r, this.restartResult = null, e && this.navigate(e), this.announcement = e === "setup" ? "No changes were made. Select another device to configure." : e === "ct" ? "Calibration session closed. Review CT names and types before continuing." : "Calibration session cancelled; cleanup completed without restart verification.");
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(o, i, t));
  }
  async finishWithoutCalibration() {
    if (this.pendingAction) return;
    this.pendingAction = "finish", this.requestUpdate();
    const e = this.inventory && !this.labelOnly ? z(this.inventory, this.drafts) : [];
    try {
      if (await this.cancelSession(null), this.error) return;
      e.length ? await this.reviewChanges() : this.finishFlow("No changes were made. Select another device to configure.");
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
  }
  async reconnectSession() {
    if (!this.api || !this.session) return;
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = ++this.operationGeneration;
    await this.run(
      async () => {
        const o = await e.getSession(t);
        !this.ownsOperation(s, e, i) || this.session?.session_id !== t || (this.session = o, this.announcement = `Session reconnected with state ${this.session.state}.`);
      },
      "Session reconnection failed. Retry only after checking the meter connection.",
      () => this.ownsOperation(s, e, i)
    );
  }
  resultFor(e) {
    const i = this.currentReferenceEntries().map((o) => String(o.channel)), t = Math.floor((this.channel - 1) / 3) * 3 + 1, s = e === "voltage" ? this.voltageGroupKeys() : i.length ? i : Array.from({ length: 3 }, (o, r) => String(t + r));
    for (const o of [...s].reverse()) {
      const r = this.calibrationByTarget.get(`${e}:${o}`);
      if (r) return r;
    }
    return null;
  }
  stabilityFor(e) {
    const i = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((s) => String(s.channel)), t = i.flatMap((s) => {
      const o = this.stabilityByTarget.get(`${e}:${s}`);
      return o ? [o] : [];
    });
    return t.length ? {
      target: e,
      target_id: e === "voltage" ? `Board ${this.board + 1}` : `Current group ${Math.floor((this.channel - 1) / 3) + 1}`,
      stable: t.length === i.length && t.every((s) => s.stable),
      windows: t.flatMap((s) => s.windows)
    } : null;
  }
  async run(e, i, t = () => !0) {
    this.error = "";
    try {
      await e();
    } catch (s) {
      if (!t()) return;
      const o = s.code;
      this.fail(s, o === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : i);
    }
    t() && this.requestUpdate();
  }
  fail(e, i) {
    this.error = i, this.announcement = i, this.requestUpdate();
  }
  stepBody() {
    return this.step === "setup" ? ii(
      this.setup,
      this.addonCount,
      this.connection,
      (e) => {
        this.addonCount = e, this.requestUpdate();
      },
      (e) => {
        this.connection = e, this.requestUpdate();
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
      this.pendingAction
    ) : this.step === "topology" && this.topology ? ni(
      this.topology,
      this.selectedProjectVersion(),
      () => this.back(),
      () => {
        this.setup?.devices.find((e) => e.entry_id === this.selectedDeviceId)?.configuration ? this.loadInventory() : this.startSession();
      },
      this.error === "Topology mismatch",
      this.pendingAction === "inventory" || this.pendingAction === "session"
    ) : this.step === "ct" && this.inventory ? h`<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
      this.labelOnly = !1, this.requestUpdate();
    }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
      this.labelOnly = !0, this.requestUpdate();
    }}>Home Assistant labels only</label></fieldset>${Kt(
      this.inventory,
      this.board,
      this.drafts,
      (e) => {
        this.board = e, this.requestUpdate();
      },
      (e, i) => this.updateDraft(e, i),
      () => this.back(),
      () => {
        this.continueFromCt();
      },
      this.labelOnly,
      this.pendingAction === "session"
    )}` : this.step === "build" ? Wt(
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
    ) : this.step === "safety" ? ei(
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
    ) : this.step === "voltage" ? h`${oi(
      this.topology,
      this.session,
      this.board,
      this.voltageReferences,
      this.stabilityFor("voltage"),
      this.resultFor("voltage"),
      this.voltageBusy,
      (e) => {
        this.board = e, this.requestUpdate();
      },
      (e, i) => {
        this.voltageReferences = this.voltageReferences.map((t, s) => s === e ? i : t), this.requestUpdate();
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" ?disabled=${this.voltageBusy} @click=${() => this.navigate("current")}>${this.resultFor("voltage") ? "Continue" : "Skip voltage calibration"}</button></footer>` : this.step === "current" ? h`${Zt(
      this.topology,
      this.inventory,
      this.session,
      this.channel,
      this.currentReferences,
      this.reportingMultiplier,
      this.stabilityFor("current"),
      this.resultFor("current"),
      (e) => {
        this.channel = e, this.requestUpdate();
      },
      (e, i) => {
        const t = new Map(this.currentReferences);
        i === null || !Number.isFinite(i) || i <= 0 ? t.delete(e) : t.set(e, i), this.currentReferences = t, this.requestUpdate();
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" ?disabled=${this.pendingAction === "finish"} @click=${() => this.calibrationByTarget.size ? this.navigate("restart") : void this.finishWithoutCalibration()}>${this.pendingAction === "finish" ? "Finishing…" : this.resultFor("current") ? "Continue" : "Skip current calibration"}</button></footer>` : this.step === "restart" ? Xt(
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
    ) : this.step === "summary" ? si(
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
    ) : h`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct" ? "CT settings are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }
  render() {
    const e = F.findIndex(([i]) => i === this.step);
    return h`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${F.map(([i, t], s) => h`
            <li class=${s === e ? "current" : ""}>
              <button class="step-button" aria-current=${s === e ? "step" : $}
                ?disabled=${s > e || s < e && i !== "setup"}
                @click=${() => i === "setup" && s < e ? this.returnToSetup() : void 0}><span class="number">${s + 1}</span><span>${t}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${e + 1} of ${F.length} — ${F[e]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${F[e]?.[1]}</h1>
          ${this.error ? h`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : $}
          ${this.stepBody()}
          ${e >= 4 && this.step !== "summary" ? et(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult) : $}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", ai);
export {
  ai as CircuitSetupPanel
};
