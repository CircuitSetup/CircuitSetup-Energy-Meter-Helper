const V = globalThis, et = V.ShadowRoot && (V.ShadyCSS === void 0 || V.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, it = /* @__PURE__ */ Symbol(), dt = /* @__PURE__ */ new WeakMap();
let Ct = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== it) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (et && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = dt.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && dt.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const Pt = (n) => new Ct(typeof n == "string" ? n : n + "", void 0, it), Dt = (n, ...t) => {
  const e = n.length === 1 ? n[0] : t.reduce((i, s, o) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[o + 1], n[0]);
  return new Ct(e, n, it);
}, Mt = (n, t) => {
  if (et) n.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), s = V.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = e.cssText, n.appendChild(i);
  }
}, lt = et ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return Pt(e);
})(n) : n;
const { is: Bt, defineProperty: jt, getOwnPropertyDescriptor: Gt, getOwnPropertyNames: qt, getOwnPropertySymbols: Ht, getPrototypeOf: zt } = Object, W = globalThis, pt = W.trustedTypes, Vt = pt ? pt.emptyScript : "", Lt = W.reactiveElementPolyfillSupport, M = (n, t) => n, Q = { toAttribute(n, t) {
  switch (t) {
    case Boolean:
      n = n ? Vt : null;
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
} }, kt = (n, t) => !Bt(n, t), ht = { attribute: !0, type: String, converter: Q, reflect: !1, useDefault: !1, hasChanged: kt };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), W.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let O = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = ht) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(t, i, e);
      s !== void 0 && jt(this.prototype, t, s);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: s, set: o } = Gt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(r) {
      this[e] = r;
    } };
    return { get: s, set(r) {
      const a = s?.call(this);
      o?.call(this, r), this.requestUpdate(t, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? ht;
  }
  static _$Ei() {
    if (this.hasOwnProperty(M("elementProperties"))) return;
    const t = zt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(M("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(M("properties"))) {
      const e = this.properties, i = [...qt(e), ...Ht(e)];
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
      for (const s of i) e.unshift(lt(s));
    } else t !== void 0 && e.push(lt(t));
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
    return Mt(t, this.constructor.elementStyles), t;
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
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : Q).toAttribute(e, i.type);
      this._$Em = t, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, s = i._$Eh.get(t);
    if (s !== void 0 && this._$Em !== s) {
      const o = i.getPropertyOptions(s), r = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : Q;
      this._$Em = s;
      const a = r.fromAttribute(e, o.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, s = !1, o) {
    if (t !== void 0) {
      const r = this.constructor;
      if (s === !1 && (o = this[t]), i ??= r.getPropertyOptions(t), !((i.hasChanged ?? kt)(o, e) || i.useDefault && i.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: s, wrapped: o }, r) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, r ?? e ?? this[t]), o !== !0 || r !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), s === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        for (const [s, o] of this._$Ep) this[s] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [s, o] of i) {
        const { wrapped: r } = o, a = this[s];
        r !== !0 || this._$AL.has(s) || a === void 0 || this.C(s, void 0, o, a);
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
O.elementStyles = [], O.shadowRootOptions = { mode: "open" }, O[M("elementProperties")] = /* @__PURE__ */ new Map(), O[M("finalized")] = /* @__PURE__ */ new Map(), Lt?.({ ReactiveElement: O }), (W.reactiveElementVersions ??= []).push("2.1.2");
const st = globalThis, ut = (n) => n, L = st.trustedTypes, gt = L ? L.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, At = "$lit$", C = `lit$${Math.random().toFixed(9).slice(2)}$`, Et = "?" + C, Ft = `<${Et}>`, I = document, j = () => I.createComment(""), G = (n) => n === null || typeof n != "object" && typeof n != "function", nt = Array.isArray, Wt = (n) => nt(n) || typeof n?.[Symbol.iterator] == "function", Z = `[\x20\t
\f\r]`, P = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ft = /-->/g, vt = />/g, A = RegExp(`>|${Z}(?:([^\\s"'>=/]+)(${Z}*=${Z}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), bt = /'/g, _t = /"/g, It = /^(?:script|style|textarea|title)$/i, Kt = (n) => (t, ...e) => ({ _$litType$: n, strings: t, values: e }), d = Kt(1), R = /* @__PURE__ */ Symbol.for("lit-noChange"), b = /* @__PURE__ */ Symbol.for("lit-nothing"), mt = /* @__PURE__ */ new WeakMap(), E = I.createTreeWalker(I, 129);
function Tt(n, t) {
  if (!nt(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return gt !== void 0 ? gt.createHTML(t) : t;
}
const Jt = (n, t) => {
  const e = n.length - 1, i = [];
  let s, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = P;
  for (let a = 0; a < e; a++) {
    const c = n[a];
    let h, u, l = -1, p = 0;
    for (; p < c.length && (r.lastIndex = p, u = r.exec(c), u !== null); ) p = r.lastIndex, r === P ? u[1] === "!--" ? r = ft : u[1] !== void 0 ? r = vt : u[2] !== void 0 ? (It.test(u[2]) && (s = RegExp("</" + u[2], "g")), r = A) : u[3] !== void 0 && (r = A) : r === A ? u[0] === ">" ? (r = s ?? P, l = -1) : u[1] === void 0 ? l = -2 : (l = r.lastIndex - u[2].length, h = u[1], r = u[3] === void 0 ? A : u[3] === '"' ? _t : bt) : r === _t || r === bt ? r = A : r === ft || r === vt ? r = P : (r = A, s = void 0);
    const g = r === A && n[a + 1].startsWith("/>") ? " " : "";
    o += r === P ? c + Ft : l >= 0 ? (i.push(h), c.slice(0, l) + At + c.slice(l) + C + g) : c + C + (l === -2 ? a : g);
  }
  return [Tt(n, o + (n[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class q {
  constructor({ strings: t, _$litType$: e }, i) {
    let s;
    this.parts = [];
    let o = 0, r = 0;
    const a = t.length - 1, c = this.parts, [h, u] = Jt(t, e);
    if (this.el = q.createElement(h, i), E.currentNode = this.el.content, e === 2 || e === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (s = E.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const l of s.getAttributeNames()) if (l.endsWith(At)) {
          const p = u[r++], g = s.getAttribute(l).split(C), w = /([.?@])?(.*)/.exec(p);
          c.push({ type: 1, index: o, name: w[2], strings: g, ctor: w[1] === "." ? Xt : w[1] === "?" ? Yt : w[1] === "@" ? Qt : K }), s.removeAttribute(l);
        } else l.startsWith(C) && (c.push({ type: 6, index: o }), s.removeAttribute(l));
        if (It.test(s.tagName)) {
          const l = s.textContent.split(C), p = l.length - 1;
          if (p > 0) {
            s.textContent = L ? L.emptyScript : "";
            for (let g = 0; g < p; g++) s.append(l[g], j()), E.nextNode(), c.push({ type: 2, index: ++o });
            s.append(l[p], j());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Et) c.push({ type: 2, index: o });
      else {
        let l = -1;
        for (; (l = s.data.indexOf(C, l + 1)) !== -1; ) c.push({ type: 7, index: o }), l += C.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = I.createElement("template");
    return i.innerHTML = t, i;
  }
}
function U(n, t, e = n, i) {
  if (t === R) return t;
  let s = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const o = G(t) ? void 0 : t._$litDirective$;
  return s?.constructor !== o && (s?._$AO?.(!1), o === void 0 ? s = void 0 : (s = new o(n), s._$AT(n, e, i)), i !== void 0 ? (e._$Co ??= [])[i] = s : e._$Cl = s), s !== void 0 && (t = U(n, s._$AS(n, t.values), s, i)), t;
}
class Zt {
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
    const { el: { content: e }, parts: i } = this._$AD, s = (t?.creationScope ?? I).importNode(e, !0);
    E.currentNode = s;
    let o = E.nextNode(), r = 0, a = 0, c = i[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let h;
        c.type === 2 ? h = new H(o, o.nextSibling, this, t) : c.type === 1 ? h = new c.ctor(o, c.name, c.strings, this, t) : c.type === 6 && (h = new te(o, this, t)), this._$AV.push(h), c = i[++a];
      }
      r !== c?.index && (o = E.nextNode(), r++);
    }
    return E.currentNode = I, s;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class H {
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
    t = U(this, t, e), G(t) ? t === b || t == null || t === "" ? (this._$AH !== b && this._$AR(), this._$AH = b) : t !== this._$AH && t !== R && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Wt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== b && G(this._$AH) ? this._$AA.nextSibling.data = t : this.T(I.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, s = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = q.createElement(Tt(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(e);
    else {
      const o = new Zt(s, this), r = o.u(this.options);
      o.p(e), this.T(r), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = mt.get(t.strings);
    return e === void 0 && mt.set(t.strings, e = new q(t)), e;
  }
  k(t) {
    nt(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, s = 0;
    for (const o of t) s === e.length ? e.push(i = new H(this.O(j()), this.O(j()), this, this.options)) : i = e[s], i._$AI(o), s++;
    s < e.length && (this._$AR(i && i._$AB.nextSibling, s), e.length = s);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = ut(t).nextSibling;
      ut(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class K {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, s, o) {
    this.type = 1, this._$AH = b, this._$AN = void 0, this.element = t, this.name = e, this._$AM = s, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = b;
  }
  _$AI(t, e = this, i, s) {
    const o = this.strings;
    let r = !1;
    if (o === void 0) t = U(this, t, e, 0), r = !G(t) || t !== this._$AH && t !== R, r && (this._$AH = t);
    else {
      const a = t;
      let c, h;
      for (t = o[0], c = 0; c < o.length - 1; c++) h = U(this, a[i + c], e, c), h === R && (h = this._$AH[c]), r ||= !G(h) || h !== this._$AH[c], h === b ? t = b : t !== b && (t += (h ?? "") + o[c + 1]), this._$AH[c] = h;
    }
    r && !s && this.j(t);
  }
  j(t) {
    t === b ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Xt extends K {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === b ? void 0 : t;
  }
}
class Yt extends K {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== b);
  }
}
class Qt extends K {
  constructor(t, e, i, s, o) {
    super(t, e, i, s, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = U(this, t, e, 0) ?? b) === R) return;
    const i = this._$AH, s = t === b && i !== b || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== b && (i === b || s);
    s && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class te {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    U(this, t);
  }
}
const ee = st.litHtmlPolyfillSupport;
ee?.(q, H), (st.litHtmlVersions ??= []).push("3.3.3");
const ie = (n, t, e) => {
  const i = e?.renderBefore ?? t;
  let s = i._$litPart$;
  if (s === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = s = new H(t.insertBefore(j(), o), o, void 0, e ?? {});
  }
  return s._$AI(n), s;
};
const ot = globalThis;
class B extends O {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = ie(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return R;
  }
}
B._$litElement$ = !0, B.finalized = !0, ot.litElementHydrateSupport?.({ LitElement: B });
const se = ot.litElementPolyfillSupport;
se?.({ LitElement: B });
(ot.litElementVersions ??= []).push("4.2.2");
const $t = "circuitsetup_energy_meter_helper/", ne = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, oe = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, re = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, ae = /[\u0000-\u001f\u007f-\u009f]/, ce = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), de = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), le = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "indeterminate", "verified", "cancelled"]), rt = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), yt = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), Ot = /* @__PURE__ */ new Set(["A", "B", "C"]), pe = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), he = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), ue = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), ge = /* @__PURE__ */ new Set(["invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]);
function _(n, t) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${t} response is invalid`);
  return n;
}
function $(n, t, e = 100) {
  if (!Array.isArray(n) || n.length > e) throw new Error(`${t} response is invalid`);
  return n;
}
function f(n, t, e = !1) {
  if (e && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${t} response is invalid`);
  return n;
}
function k(n, t) {
  if (typeof n != "number" || !Number.isFinite(n)) throw new Error(`${t} response is invalid`);
  return n;
}
function m(n, t) {
  const e = k(n, t);
  if (!Number.isInteger(e)) throw new Error(`${t} response is invalid`);
  return e;
}
function S(n, t, e = !1) {
  if (e && n === null) return null;
  if (typeof n != "boolean") throw new Error(`${t} response is invalid`);
  return n;
}
function y(n, t, e) {
  const i = f(n, e);
  if (!t.has(i)) throw new Error(`${e} response is invalid`);
  return i;
}
function tt(n, t) {
  n !== void 0 && f(n, t, !0);
}
function X(n, t) {
  return Math.abs(n - t) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(t));
}
function Rt(n, t) {
  const e = _(n, t);
  f(e.entry_id, t), f(e.title, t), f(e.project_name, t), f(e.project_version, t, !0), S(e.importable, t, !0), f(e.configuration, t, !0);
}
function z(n, t) {
  const e = _(n, t);
  if (y(e.state, ce, t), $(e.devices, t).forEach((i) => Rt(i, t)), e.configuration_authoritative !== void 0 && S(e.configuration_authoritative, t), e.installer_intent !== void 0) {
    const i = _(e.installer_intent, t), s = m(i.addon_count, t);
    if (s < 0 || s > 6) throw new Error(`${t} response is invalid`);
    if (y(i.connection_type, rt, t) === "unknown") throw new Error(`${t} response is invalid`);
  }
  return n;
}
function wt(n, t) {
  const e = _(n, t), i = m(e.addon_count, t), s = m(e.board_count, t), o = m(e.ct_count, t), r = m(e.group_count, t);
  if (i < 0 || i > 6 || s < 1 || s > 7 || o < 6 || o > 42 || r < 2 || r > 14 || s !== i + 1 || o !== 6 * s || r !== 2 * s) throw new Error(`${t} response is invalid`);
  y(e.connection_type, rt, t), f(e.voltage_layout, t), f(e.project_name, t);
  const a = $(e.evidence, t);
  if (a.length > yt.size) throw new Error(`${t} response is invalid`);
  return a.forEach((c) => {
    const h = _(c, t);
    y(h.source, yt, t);
    const u = m(h.addon_count, t);
    if (u < 0 || u > 6) throw new Error(`${t} response is invalid`);
    f(h.detail, t);
  }), n;
}
function fe(n, t) {
  const e = _(n, t);
  return "topology" in e ? (wt(e.topology, t), e.configuration_authoritative !== void 0 && S(e.configuration_authoritative, t), n) : wt(n, t);
}
function ve(n, t) {
  const e = _(n, t);
  f(e.plan_id, t), f(e.source_sha256, t);
  const i = $(e.channels, t);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${t} response is invalid`);
  i.forEach((r, a) => {
    const c = _(r, t), h = m(c.channel, t);
    f(c.name, t), m(c.raw_gain_ct, t), k(c.reporting_multiplier, t), tt(c.selected_model_id, t), S(c.selection_verified_against_config, t), tt(c.display_label, t);
    const u = _(c.address, t), l = m(u.channel, t), p = m(u.board_index, t), g = m(u.group_index, t), w = y(u.phase, Ot, t), x = a + 1;
    if (h !== x || l !== x || p !== Math.floor(a / 6) || g !== Math.floor(a % 6 / 3) + 1 || w !== ["A", "B", "C"][a % 3]) throw new Error(`${t} response is invalid`);
  });
  const s = _(e.catalog, t);
  f(s.source_repository, t), f(s.source_ref, t), m(s.schema_version, t);
  const o = $(s.presets, t);
  if (o.length > 64) throw new Error(`${t} response is invalid`);
  return o.forEach((r) => {
    const a = _(r, t);
    f(a.model_id, t), f(a.label, t), k(a.rated_current_a, t), f(a.secondary, t), a.default_gain_ct !== null && m(a.default_gain_ct, t), S(a.requires_burden_jumper_cut, t), f(a.notes, t);
  }), n;
}
function Y(n, t) {
  const e = _(n, t);
  if (f(e.transaction_id, t), y(e.state, de, t), f(e.source_sha256, t), S(e.rollback_available, t), f(e.redacted_diff, t), $(e.changes, t).forEach((i) => {
    const s = _(i, t);
    f(s.key, t), s.old_value !== null && f(s.old_value, t), f(s.new_value, t);
  }), $(e.evidence, t).forEach((i) => y(i, he, t)), $(e.progress, t).forEach((i) => y(i, ue, t)), e.validation_detail != null) {
    const i = _(e.validation_detail, t);
    for (const s of ["reported_error_count", "reported_warning_count"]) i[s] !== null && m(i[s], t);
    i.code !== null && m(i.code, t), m(i.error_record_count, t), m(i.warning_record_count, t);
  }
  return e.upload_progress !== void 0 && $(e.upload_progress, t).forEach((i) => {
    const s = _(i, t);
    if (y(s.stage, pe, t), s.progress !== null && s.percentage !== null && s.progress !== void 0 && s.percentage !== void 0) throw new Error(`${t} response is invalid`);
    const o = s.progress ?? s.percentage;
    if (o != null) {
      const r = m(o, t);
      if (r < 0 || r > 100) throw new Error(`${t} response is invalid`);
    }
  }), n;
}
function D(n, t) {
  const e = _(n, t);
  f(e.session_id, t), f(e.device_id, t), y(e.state, le, t), S(e.safety_acknowledged, t);
  const i = _(e.preflight, t);
  return $(i.issues, t).forEach((s) => {
    const o = _(s, t);
    y(o.code, ge, t), f(o.role, t), f(o.detail, t);
  }), $(i.zeroed_roles, t).forEach((s) => f(s, t)), n;
}
function be(n, t) {
  const e = _(n, t), i = y(e.target, /* @__PURE__ */ new Set(["voltage", "current"]), t);
  f(e.target_id, t);
  const s = S(e.stable, t), o = $(e.windows, t, i === "voltage" ? 3 : 1);
  if (o.length !== (i === "voltage" ? 3 : 1)) throw new Error(`${t} response is invalid`);
  const r = o.map((a) => {
    const c = _(a, t), h = $(c.samples, t, 3).map((v) => k(v, t));
    if (h.length !== 3) throw new Error(`${t} response is invalid`);
    const u = k(c.mean, t), l = k(c.standard_deviation, t), p = k(c.range_percent, t), g = h.reduce((v, N) => v + N, 0) / h.length, w = Math.sqrt(h.reduce((v, N) => v + (N - g) ** 2, 0) / h.length), x = 100 * (Math.max(...h) - Math.min(...h)) / Math.abs(g);
    if (!X(u, g) || !X(l, w) || !X(p, x)) throw new Error(`${t} response is invalid`);
    return p;
  });
  if (s !== r.every((a) => a <= 1)) throw new Error(`${t} response is invalid`);
  return n;
}
function xt(n, t) {
  const e = _(n, t), i = y(e.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), t);
  f(e.group_key, t), e.phase !== null && y(e.phase, Ot, t);
  const s = m(e.iteration, t);
  S(e.retry_allowed, t);
  const o = $(e.changed_channels, t, 3).map((h) => m(h, t)), r = $(e.before_values, t, 3), a = $(e.after_values, t, 3), c = $(e.error_percent_values, t, 3);
  for (const h of [r, a, c]) h.forEach((u) => k(u, t));
  if (![1, 3].includes(o.length) || r.length !== o.length || new Set(o).size !== o.length || o.some((h) => h < 1 || h > 42) || s < 1 || s > 3 || o.length === 1 != (e.phase !== null) || (i === "indeterminate" ? a.length !== 0 || c.length !== 0 : a.length !== o.length || c.length !== o.length)) throw new Error(`${t} response is invalid`);
  return e.gain_evidence != null && _(e.gain_evidence, t), e.restore_evidence != null && _(e.restore_evidence, t), n;
}
function _e(n, t) {
  const e = _(n, t);
  for (const a of ["mac", "config_filename", "config_sha256", "topology_project_name", "topology_voltage_layout", "verification_id"]) f(e[a], t);
  const i = m(e.topology_addon_count, t);
  y(e.topology_connection_type, rt, t);
  const s = m(e.connection_generation, t);
  if (y(e.source_authority, /* @__PURE__ */ new Set(["saved_flash"]), t), S(e.source_handoff_available, t), tt(e.source_handoff_transaction_id, t), i < 0 || i > 6 || s < 1) throw new Error(`${t} response is invalid`);
  const o = $(e.groups, t, 14), r = ["meter_main1", "meter_main2", ...Array.from({ length: i }, (a, c) => [`addon${c + 1}_1`, `addon${c + 1}_2`]).flat()];
  if (o.length !== r.length) throw new Error(`${t} response is invalid`);
  return o.forEach((a, c) => {
    const h = _(a, t);
    if (f(h.instance_id, t) !== r[c]) throw new Error(`${t} response is invalid`);
    const u = $(h.phase_gains, t, 3);
    if (u.length !== 3) throw new Error(`${t} response is invalid`);
    u.forEach((l) => {
      const p = $(l, t, 2);
      if (p.length !== 2) throw new Error(`${t} response is invalid`);
      p.forEach((g) => {
        const w = m(g, t);
        if (w < 1 || w > 65535) throw new Error(`${t} response is invalid`);
      });
    });
  }), n;
}
class F {
  constructor(t, e) {
    this.hass = t, this.entryId = e, this.setupStatus = () => this.call("setup_status", (i) => z(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => ($(i, "list_meters").forEach((s) => Rt(s, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (s) => fe(s, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (s) => ve(s, "get_ct_inventory"), { device_id: i }), this.getSession = (i) => this.call("get_session", (s) => D(s, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => _(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, s) => this.call("set_installer_intent", (o) => z(o, "set_installer_intent"), { addon_count: i, connection_type: s }), this.rescan = () => this.call("rescan", (i) => z(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (s) => {
      const o = _(s, "adopt_device");
      return f(o.device_id, "adopt_device"), f(o.configuration, "adopt_device"), s;
    }, { device_id: i }), this.previewCtConfig = (i, s, o, r) => this.call("preview_ct_config", (a) => Y(a, "preview_ct_config"), {
      device_id: i,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.transaction = (i, s, o, r) => this.call(i, (a) => Y(a, i), {
      device_id: s,
      transaction_id: o,
      source_sha256: r
    }), this.applyCtConfig = (i, s, o) => this.transaction("apply_ct_config", i, s, o), this.compileCtConfig = (i, s, o) => this.transaction("compile_ct_config", i, s, o), this.installCtConfig = (i, s, o) => this.transaction("install_ct_config", i, s, o), this.rollbackCtConfig = (i, s, o) => this.transaction("rollback_ct_config", i, s, o), this.startSession = (i) => this.call("start_session", (s) => D(s, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (s) => D(s, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, o) => this.call("check_stability", (r) => be(r, "check_stability"), { session_id: i, target: s, target_id: o }), this.calibrateVoltage = (i, s, o, r) => this.call("calibrate_voltage", (a) => xt(a, "calibrate_voltage"), {
      session_id: i,
      group_key: s,
      reference: o,
      confirm_iteration: r
    }), this.calibrateCurrent = (i, s, o, r) => this.call("calibrate_current", (a) => xt(a, "calibrate_current"), {
      session_id: i,
      channel: s,
      reference: o,
      confirm_iteration: r
    }), this.restartAndVerify = (i) => this.call("restart_and_verify", (s) => _e(s, "restart_and_verify"), { session_id: i }), this.cancelSession = (i) => this.call("cancel_session", (s) => D(s, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (s) => z(s, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, s, o, r) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: s,
      source_sha256: o
    }, (a) => Y(a, "subscribe_config_transaction"), r), this.subscribeSession = (i, s) => this.subscribe("subscribe_session", { session_id: i }, (o) => D(o, "subscribe_session"), s);
  }
  static assertPublicPayload(t, e = 0, i = "") {
    if (e > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(t)) {
      if (t.length > 100) throw new Error(`unsafe collection ${i || "value"} refused`);
      for (const s of t) this.assertPublicPayload(s, e + 1, i);
      return;
    }
    if (typeof t == "string") {
      const s = t.includes(`
`) || t.includes("\r"), o = i === "redacted_diff" ? 32768 : 4096;
      if (t.length > o || re.test(t) || oe.test(t) || s && i !== "redacted_diff" || i === "redacted_diff" && t.includes("\r"))
        throw new Error(`unsafe string ${i || "value"} refused`);
      return;
    }
    if (!(t === null || typeof t != "object"))
      for (const [s, o] of Object.entries(t)) {
        if (s.length > 256 || ae.test(s)) throw new Error("unsafe property name refused");
        if (s.toLowerCase() !== "raw_gain_ct" && ne.test(s))
          throw new Error(`private field ${s} refused`);
        this.assertPublicPayload(o, e + 1, s.toLowerCase());
      }
  }
  async call(t, e, i = {}) {
    const s = await this.hass.callWS({
      type: `${$t}${t}`,
      entry_id: this.entryId,
      ...i
    });
    return F.assertPublicPayload(s), e(s);
  }
  subscribe(t, e, i, s) {
    return this.hass.connection.subscribeMessage((o) => {
      F.assertPublicPayload(o), s(i(o));
    }, { type: `${$t}${t}`, entry_id: this.entryId, ...e });
  }
}
function me(n, t, e, i, s, o) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Select the compatible meter discovered on your network.</p>
      <div class="meter-list">
        ${n.map((r) => d`
          <label class=${r.entry_id === t ? "meter-row selected" : "meter-row"}>
            <input type="radio" name="meter" .checked=${r.entry_id === t}
              @change=${() => e(r.entry_id)} />
            <span><strong>${r.title}</strong><small>${r.project_name} · ${r.project_version ?? "version unavailable"}</small></span>
            <span>Device Builder: ${r.configuration ? "Configured" : r.importable ? "Importable" : r.importable === null ? "Unavailable" : "Not importable"}</span>
          </label>
        `)}
      </div>
      ${n.some((r) => r.entry_id === t && r.importable) ? d`
        <button class="secondary" @click=${i}>Adopt</button>
      ` : ""}
      <footer class="action-footer">
        <button class="secondary" data-action="back" @click=${s}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${!t} @click=${o}>Continue</button>
      </footer>
    </section>
  `;
}
function $e(n) {
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
function ye(n, t, e, i, s, o, r) {
  const a = n?.state ?? "previewed";
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${$e(n)}
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
      ${n?.validation_detail ? d`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${n.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${n.validation_detail.error_record_count} records (${n.validation_detail.reported_error_count ?? "unreported"} reported)</dd></div>
        <div><dt>Warnings</dt><dd>${n.validation_detail.warning_record_count} records (${n.validation_detail.reported_warning_count ?? "unreported"} reported)</dd></div>
      </dl>` : ""}
      ${n?.upload_progress?.length ? d`<ul class="upload-progress">${n.upload_progress.map((c) => d`
        <li>${c.stage}: ${c.percentage ?? c.progress ?? "in progress"}${c.percentage != null || c.progress != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" data-action="continue" @click=${r} ?disabled=${a !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const we = (n, t, e) => (n?.default_gain_ct ?? e) == null || !Number.isFinite(t) || t <= 0 ? null : Math.round((n?.default_gain_ct ?? e) / t);
function xe(n, t, e, i, s, o, r, a, c) {
  const h = Math.ceil(n.channels.length / 6), u = n.channels.filter((l) => l.address.board_index === t).slice(0, 8);
  return d`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards">
        ${Array.from({ length: h }, (l, p) => d`
          <button role="tab" data-board-tab=${p} aria-selected=${p === t}
            @click=${() => s(p)}>${p === 0 ? "Main Board" : `Add-on ${p}`}</button>
        `)}
      </div>
      <div class="group-nav" aria-label="Three-channel groups">
        <button data-group-nav aria-current=${e === 0} @click=${() => o(0)}>Group 1 · CT${t * 6 + 1}–${t * 6 + 3}</button>
        <button data-group-nav aria-current=${e === 1} @click=${() => o(1)}>Group 2 · CT${t * 6 + 4}–${t * 6 + 6}</button>
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <div class="ct-table" role="table" aria-rowcount=${n.channels.length}>
        <div class="ct-header" role="row">
          <span>Name</span><span>Model</span><span>Current gain</span><span>Multiplier</span><span>Resulting gain</span><span>Burden</span><span>Status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${u.map((l) => {
    const p = i.get(l.channel) ?? {
      name: l.name,
      modelId: l.selected_model_id ?? "",
      multiplier: l.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, g = n.catalog.presets.find((v) => v.model_id === p.modelId), w = we(g, p.multiplier, p.modelId === "custom" ? p.customGainCt : void 0), x = p.name !== l.name || p.modelId !== (l.selected_model_id ?? "") || p.multiplier !== l.reporting_multiplier;
    return d`
              <div class="ct-row" data-ct-row data-ct-group=${l.address.group_index - 1} role="row" aria-label=${`CT${l.channel}`}>
                <label><span class="mobile-label">Name</span><input aria-label=${`CT${l.channel} name`} .value=${p.name}
                  @input=${(v) => r(l.channel, { name: v.target.value })} /></label>
                <label><span class="mobile-label">Model</span><select aria-label=${`CT${l.channel} model`}
                  @change=${(v) => r(l.channel, { modelId: v.target.value, expanded: !0 })}>
                  <option value="" ?selected=${p.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((v) => d`<option value=${v.model_id} ?selected=${p.modelId === v.model_id}>${v.label}</option>`)}
                  <option value="custom" ?selected=${p.modelId === "custom"}>Custom</option>
                </select></label>
                <span><span class="mobile-label">Current gain</span>${l.raw_gain_ct}</span>
                <label><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${l.channel} multiplier`}
                  .value=${String(p.multiplier)} @input=${(v) => r(l.channel, { multiplier: Number(v.target.value) })} /></label>
                <span><span class="mobile-label">Resulting gain</span>${w ?? "—"}</span>
                <span><span class="mobile-label">Burden</span>${g?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button class="row-toggle" aria-expanded=${p.expanded} @click=${() => r(l.channel, { expanded: !p.expanded })}>
                  ${p.modelId ? x ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${p.modelId === "custom" ? d`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${l.channel} custom gain`}
                  .value=${p.customGainCt === void 0 ? "" : String(p.customGainCt)}
                  @input=${(v) => r(l.channel, { customGainCt: Number(v.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${l.channel} custom label`} .value=${p.customLabel ?? ""}
                  @input=${(v) => r(l.channel, { customLabel: v.target.value })} /></label>
              </div>` : b}
              ${p.modelId === "custom" || g?.requires_burden_jumper_cut ? d`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${l.channel} burden output acknowledgement`}
                  .checked=${p.burdenAcknowledged}
                  @change=${(v) => r(l.channel, { burdenAcknowledged: v.target.checked })} />
                  I checked the burden-output requirement for CT${l.channel}</label>
              </div>` : b}
              ${g && g.rated_current_a > 65.535 && p.multiplier === 1 ? d`<div class="warning-band" role="status">CT${l.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : b}
              ${p.expanded && g ? d`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${g.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${g.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${g.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${g.notes || (g.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : b}
            `;
  })}
        </div>
      </div>
      <p class="row-count">Showing ${u.length} of ${n.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${a}>Back</button>
        <button class="primary" ?disabled=${!ke(n, i)} @click=${c}>Review changes</button>
      </footer>
    </section>
  `;
}
function Se(n, t) {
  return n.channels.flatMap((e) => {
    const i = t.get(e.channel);
    if (!i || !Ut(e, i)) return [];
    const s = n.catalog.presets.find((r) => r.model_id === i.modelId), o = { channel: e.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (o.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (o.custom_label = i.customLabel.trim()), o.burden_output_acknowledged = i.burdenAcknowledged) : s?.requires_burden_jumper_cut && (o.burden_output_acknowledged = i.burdenAcknowledged), [o];
  });
}
function Ut(n, t) {
  return t.name !== n.name || t.modelId !== (n.selected_model_id ?? "") || t.multiplier !== n.reporting_multiplier || t.modelId === "custom" && (t.customGainCt !== n.raw_gain_ct || t.customLabel?.trim() !== (n.display_label ?? ""));
}
function Ce(n, t) {
  if (!t.name.trim() || !t.modelId || !Number.isFinite(t.multiplier) || t.multiplier <= 0) return !1;
  if (t.modelId === "custom") return Number.isInteger(t.customGainCt) && t.customGainCt >= 1 && t.customGainCt <= 65535 && !!t.customLabel?.trim() && !/[\r\n]/.test(t.customLabel) && t.burdenAcknowledged;
  const e = n.catalog.presets.find((i) => i.model_id === t.modelId);
  return !!e && (!e?.requires_burden_jumper_cut || t.burdenAcknowledged);
}
function ke(n, t) {
  let e = !1;
  for (const i of n.channels) {
    const s = t.get(i.channel);
    if (!s || Ut(i, s) && (e = !0, !Ce(n, s)))
      return !1;
  }
  return e;
}
function at(n) {
  return n ? d`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((t, e) => d`<dl>
      <div><dt>Window ${e + 1} samples</dt><dd>${t.samples.join(", ")}</dd></div>
      <div><dt>Mean</dt><dd>${t.mean}</dd></div>
      <div><dt>Standard deviation</dt><dd>${t.standard_deviation}</dd></div>
      <div><dt>Range</dt><dd>${t.range_percent}%</dd></div>
    </dl>`)}
  </section>` : b;
}
function ct(n) {
  return n ? d`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${n.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${n.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${n.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${n.before_values.join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${n.after_values.join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${n.error_percent_values.map((t) => `${t}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Gain evidence</dt><dd>${n.gain_evidence ? JSON.stringify(n.gain_evidence) : "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${n.restore_evidence ? JSON.stringify(n.restore_evidence) : "Unavailable"}</dd></div>
    </dl>
  </section>` : b;
}
function Ae(n, t, e, i, s, o, r, a, c, h, u, l) {
  const p = n?.ct_count ?? t?.channels.length ?? 6, g = Math.floor((e - 1) / 6), w = g * 6 + 1;
  return d`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(p / 6) }, (x, v) => d`<button role="tab" aria-selected=${v === g} @click=${() => r(v * 6 + 1)}>${v === 0 ? "Main Board" : `Add-on ${v}`}</button>`)}
      </div>
      <div class="group-grid">
        ${[0, 3].map((x) => d`<section><h2>Group ${g * 2 + x / 3 + 1}</h2>${Array.from({ length: 3 }, (v, N) => {
    const J = w + x + N;
    return d`<button class=${J === e ? "selected" : ""} @click=${() => r(J)}>CT${J}</button>`;
  })}</section>`)}
      </div>
      <h2>Calibrate CT${e}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(i)} @input=${(x) => a(Number(x.target.value))} /></label>
      <button class="secondary" @click=${c}>Check stability</button>
      ${s ? d`<div class=${s.stable ? "success-band" : "warning-band"} role="status">${s.stable ? "Stable" : "Retake samples"}</div>` : ""}
      ${at(s)}
      ${ct(o)}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration ${o?.iteration ?? 1} of 3</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${h} ?disabled=${!s?.stable || (o?.iteration ?? 0) >= 3 || !!(o && !o.retry_allowed && o.iteration > 0)}>${o?.retry_allowed ? "Retry calibration" : "Calibrate"} CT${e}</button>
      ${o?.state.includes("indeterminate") ? d`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${u}>Reconnect and inspect</button><button class="danger" @click=${l}>Cancel session</button></aside>` : ""}
    </section>
  `;
}
function Ee(n, t, e, i, s) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, and entity bindings.</p>
      <div class="status-band" role="status">${n || "Ready for restart verification"}</div>
      ${t ? d`<dl class="status-list"><div><dt>Verification</dt><dd>${t.verification_id}</dd></div><div><dt>Authority</dt><dd>${t.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${t.connection_generation}</dd></div></dl>` : ""}
      ${n === "cancelled" ? d`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${n.includes("failed") || n.includes("indeterminate") ? d`<div class="recovery-panel"><strong>Recovery required</strong><button class="danger" @click=${i}>Review rollback</button></div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${s}>Back</button><button class="primary" @click=${e} ?disabled=${n === "cancelled" || !!t}>${n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Ie(n) {
  return n ? n.preflight.issues.length ? d`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((t) => d`<li>${t.role}: ${t.detail}</li>`)}</ul></div>` : d`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : d`<p>Starting a calibration session…</p>`;
}
function Te(n, t, e, i, s, o) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${Ie(n)}
      ${n?.state === "cancelled" ? d`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
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
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" @click=${i} ?disabled=${n?.state === "cancelled" || !t || !!n?.preflight.issues.length}>Continue</button>
      </footer>
    </section>
  `;
}
const St = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Oe = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function Re(n, t, e, i, s, o) {
  return d`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (r, a) => d`
            <label class=${a === t ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(a)}
                .checked=${a === t} @change=${() => i(a)} />
              <span>${a}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${St.map(([r, a]) => d`
            <label class=${r === e ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${r}
                .checked=${r === e} @change=${() => s(r)} />
              <span>${a}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>IO0</dt><dd><strong>OPEN</strong> (not connected)</dd></div>
          <div><dt>Add-on boards</dt><dd>${t}</dd></div>
          <div><dt>Connection</dt><dd>${St.find(([r]) => r === e)?.[1]}</dd></div>
          ${Oe.slice(0, t).map((r, a) => d`<div><dt>Add-on ${a + 1}</dt><dd>${r}</dd></div>`)}
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
        <button class="rescan" data-action="rescan" @click=${o}>Rescan</button>
      </footer>
    </section>
  `;
}
function Nt(n, t, e, i, s, o = null) {
  return d`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((r) => d`<li>${r.source}: ${r.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${t?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([r, a]) => d`<div data-target=${r}>${at(a)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([r, a]) => d`<div data-target=${r}>${ct(a)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${e?.evidence.join(", ") || "No build evidence."}</p><p>${e?.progress.join(", ") || "No transaction progress."}</p>
          ${e?.validation_detail ? d`<p>Validation code ${e.validation_detail.code ?? "unavailable"}; ${e.validation_detail.error_record_count} error records; ${e.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${e?.upload_progress?.length ? d`<ul>${e.upload_progress.map((r) => d`<li>${r.stage}: ${r.percentage ?? r.progress ?? "in progress"}${r.percentage != null || r.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Authority source</h3><p>${o?.source_authority.replaceAll("_", " ") ?? "Not yet established"}</p><p>${o ? `Verification ${o.verification_id}, generation ${o.connection_generation}` : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function Ue(n, t, e, i, s, o, r, a) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${o ? d`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : d`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${r ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${o?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${o?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${Nt(n, t, e, i, s, o)}
      <footer class="action-footer"><button class="secondary" @click=${a}>Back</button></footer>
    </section>
  `;
}
function Ne(n) {
  const t = n.addon_count;
  return n.board_count !== t + 1 || n.ct_count !== 6 * (t + 1) || n.group_count !== 2 * (t + 1) || n.evidence.some((e) => e.addon_count !== t);
}
function Pe(n, t, e, i) {
  const s = Ne(n);
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="identity-strip">
        <strong>${n.project_name}</strong>
        <span>Version ${t ?? "unavailable"}</span>
        <span>${n.board_count} boards</span><span>${n.ct_count} CTs</span>
        <span>${n.group_count} groups</span><span>${n.connection_type}</span>
      </div>
      <h2>Topology evidence</h2>
      <table class="evidence-table">
        <thead><tr><th>Source</th><th>Add-ons</th><th>Evidence</th></tr></thead>
        <tbody>${n.evidence.map((o) => d`
          <tr><td>${o.source.replaceAll("_", " ")}</td><td>${o.addon_count}</td><td>${o.detail}</td></tr>
        `)}</tbody>
      </table>
      ${s ? d`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : d`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${e}>Back</button>
        ${s ? "" : d`<button class="primary" data-action="continue" @click=${i}>Continue</button>`}
      </footer>
    </section>
  `;
}
function De(n, t, e, i, s, o, r, a, c, h, u) {
  const l = n?.group_count ?? 2;
  return d`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="target-tabs" role="tablist" aria-label="Voltage groups">
        ${Array.from({ length: l }, (p, g) => d`<button role="tab" aria-selected=${g === t} @click=${() => o(g)}>Group ${g + 1}</button>`)}
      </div>
      <h2>Calibrate voltage group ${t + 1}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(e)} @input=${(p) => r(Number(p.target.value))} /></label>
      <button class="secondary" @click=${a}>Check stability</button>
      ${i ? d`<div class=${i.stable ? "success-band" : "warning-band"} role="status">${i.stable ? "Stable sample window" : "Samples are not stable yet"}</div>` : ""}
      ${at(i)}
      ${ct(s)}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${c} ?disabled=${!i?.stable || !!(s && !s.retry_allowed && s.iteration > 0)}> ${s?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      ${s?.state === "indeterminate" ? d`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${h}>Reconnect and inspect</button><button class="danger" @click=${u}>Cancel session</button></aside>` : ""}
    </section>
  `;
}
const Me = Dt`
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
  .addon-options label:focus-within, .connection-options label:focus-within, .meter-row:focus-within { outline: 3px solid #1769d3; outline-offset: 2px; }
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
    .identity-strip, .confirmation-actions, .group-nav { align-items: stretch; flex-direction: column; }
    .evidence-table { display: block; overflow-x: auto; }
  }
`, T = [
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
class Be extends B {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.ctGroup = 0, this.group = 0, this.channel = 1, this.reference = 0, this.safetyAcknowledged = !1, this.drafts = /* @__PURE__ */ new Map(), this.error = "", this.announcement = "", this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = Me;
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
    this.ensureApi(t);
  }
  disconnectedCallback() {
    ++this.connectionGeneration, ++this.operationGeneration, ++this.transactionSubscriptionScope, ++this.sessionSubscriptionScope;
    for (const t of this.unsubs.splice(0))
      try {
        t();
      } catch {
      }
    this.transactionUnsub = null, this.sessionUnsub = null, this.api = null, super.disconnectedCallback();
  }
  updated(t) {
    (t.has("hass") || t.has("panel")) && this.isConnected && this.ensureApi(this.connectionGeneration), this.error ? this.shadowRoot?.querySelector("[role=alert]")?.focus() : this.focusHeading && (this.focusHeading = !1, this.shadowRoot?.querySelector("#step-heading")?.focus());
  }
  async ensureApi(t) {
    if (this.api || !this.isConnected || !this.hass || !this.panel?.config.entry_id) return;
    const e = new F(this.hass, this.panel.config.entry_id);
    this.api = e;
    try {
      const i = await e.setupStatus();
      if (!this.owns(t, e)) return;
      this.setup = i;
      const s = this.setup.installer_intent;
      s && (this.addonCount = s.addon_count, this.connection = s.connection_type), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.setup.devices[0]?.entry_id ?? null), await this.ownSubscription(e.subscribeSetup((o) => {
        this.owns(t, e) && (this.setup = o, !this.selectedDeviceId && o.devices.length && this.selectDevice(o.devices[0]?.entry_id ?? null), this.requestUpdate());
      }), t, e), this.transaction && await this.subscribeTransaction(t), this.session && this.session.state !== "cancelled" && await this.subscribeSession(t);
    } catch (i) {
      this.owns(t, e) && this.fail(i, "Setup status could not be loaded.");
    }
    this.requestUpdate();
  }
  owns(t, e) {
    return this.isConnected && t === this.connectionGeneration && e === this.api;
  }
  ownsOperation(t, e, i) {
    return t === this.operationGeneration && e === this.api && i === this.selectedDeviceId;
  }
  async ownSubscription(t, e, i, s = () => !0, o = () => {
  }) {
    const r = await t;
    if (!this.owns(e, i) || !s()) {
      try {
        r();
      } catch {
      }
      return;
    }
    this.unsubs.push(r), o(r);
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
    this.safetyAcknowledged = !1, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.group = 0, this.channel = 1, this.reference = 0;
  }
  selectDevice(t) {
    t !== this.selectedDeviceId && (++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = t, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.board = 0, this.ctGroup = 0, this.resetCalibrationRun());
  }
  showTopology(t) {
    this.topology = t, this.navigate("topology"), this.error = t.evidence.some((e) => e.addon_count !== t.addon_count) || t.ct_count !== 6 * t.board_count || t.group_count !== 2 * t.board_count ? "Topology mismatch" : "", this.requestUpdate();
  }
  showInventory(t) {
    this.inventory = t, this.drafts = new Map(t.channels.map((e) => [e.channel, {
      name: e.name,
      modelId: e.selected_model_id ?? "",
      multiplier: e.reporting_multiplier,
      customGainCt: e.selected_model_id === null ? e.raw_gain_ct : void 0,
      customLabel: e.display_label ?? void 0,
      burdenAcknowledged: !1,
      expanded: e.selected_model_id === null && e.raw_gain_ct === 27518
    }])), this.navigate("ct"), this.error = "", this.requestUpdate();
  }
  showState(t) {
    this.navigate(t);
  }
  navigate(t) {
    this.step = t, this.error = "", this.mobileStepsOpen = !1, this.focusHeading = !0, this.requestUpdate();
  }
  back() {
    const t = T.findIndex(([e]) => e === this.step);
    t > 0 && this.navigate(T[t - 1][0]);
  }
  selectedProjectVersion() {
    return this.setup?.devices.find((t) => t.entry_id === this.selectedDeviceId)?.project_version ?? null;
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
      retry_allowed: !1
    })) : (this.navigate("restart"), this.session ? this.session = { ...this.session, state: t } : this.error = "Restart verification failed; review rollback and recovery evidence."), this.requestUpdate();
  }
  async rescan() {
    if (!this.api) return;
    const t = this.api, e = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      if (await t.setInstallerIntent(this.addonCount, this.connection), !this.ownsOperation(i, t, e)) return;
      const s = await t.rescan();
      this.ownsOperation(i, t, e) && (this.setup = s, s.devices.length ? (this.selectDevice(s.devices[0]?.entry_id ?? null), this.navigate("discover"), this.announcement = "Compatible meter discovered.") : this.announcement = "No compatible meter found. Check the network and rescan.");
    }, "Rescan failed.", () => this.ownsOperation(i, t, e));
  }
  async adopt() {
    if (!this.api || !this.selectedDeviceId) return;
    const t = this.api, e = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      await t.adoptDevice(e), this.ownsOperation(i, t, e) && (this.announcement = "Meter adopted in Device Builder.");
    }, "Adoption is unavailable for this meter.", () => this.ownsOperation(i, t, e));
  }
  async loadTopology() {
    if (!this.api || !this.selectedDeviceId) return;
    const t = this.api, e = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      const s = await t.getTopology(e);
      this.ownsOperation(i, t, e) && this.showTopology("topology" in s ? s.topology : s);
    }, "Topology evidence could not be loaded.", () => this.ownsOperation(i, t, e));
  }
  async loadInventory() {
    if (!this.api || !this.selectedDeviceId) return;
    const t = this.api, e = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      const s = await t.getCtInventory(e);
      this.ownsOperation(i, t, e) && this.showInventory(s);
    }, "CT inventory could not be loaded.", () => this.ownsOperation(i, t, e));
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
    const t = Se(this.inventory, this.drafts);
    if (!t.length) return this.fail(new Error(), "Select at least one CT change before review.");
    const e = this.api, i = this.selectedDeviceId, s = this.inventory, o = ++this.operationGeneration;
    this.clearSubscription("transaction"), this.transaction = null, await this.run(
      async () => {
        const r = await e.previewCtConfig(
          i,
          s.plan_id,
          s.source_sha256,
          t
        );
        this.ownsOperation(o, e, i) && (this.transaction = r, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "The configuration preview is stale. Reload the CT inventory and review again.",
      () => this.ownsOperation(o, e, i)
    );
  }
  async subscribeTransaction(t) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const e = this.api;
    this.clearSubscription("transaction");
    const i = this.transactionSubscriptionScope, s = this.selectedDeviceId, o = this.transaction.transaction_id, r = this.transaction.source_sha256;
    await this.ownSubscription(
      e.subscribeConfigTransaction(
        s,
        o,
        r,
        (a) => {
          this.owns(t, e) && i === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === o && this.transaction.source_sha256 === r && a.transaction_id === o && a.source_sha256 === r && (this.transaction = a, this.requestUpdate());
        }
      ),
      t,
      e,
      () => i === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === o && this.transaction.source_sha256 === r,
      (a) => {
        this.transactionUnsub = a;
      }
    );
  }
  async transactionAction(t) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const e = this.api, i = this.selectedDeviceId, s = this.transaction, o = ++this.operationGeneration;
    await this.run(
      async () => {
        const r = [i, s.transaction_id, s.source_sha256], a = t === "apply" ? await e.applyCtConfig(...r) : t === "compile" ? await e.compileCtConfig(...r) : t === "install" ? await e.installCtConfig(...r) : await e.rollbackCtConfig(...r);
        !this.ownsOperation(o, e, i) || this.transaction?.transaction_id !== s.transaction_id || this.transaction.source_sha256 !== s.source_sha256 || (this.transaction = a, this.announcement = `Configuration ${this.transaction.state}.`);
      },
      "This confirmation is stale. Reload the CT inventory before making another change.",
      () => this.ownsOperation(o, e, i)
    );
  }
  async startSession() {
    if (!this.api || !this.selectedDeviceId) return;
    const t = this.api, e = this.selectedDeviceId, i = ++this.operationGeneration;
    this.clearSubscription("session"), this.session = null, this.resetCalibrationRun(), await this.run(async () => {
      const s = await t.startSession(e);
      !this.ownsOperation(i, t, e) || s.device_id !== e || (this.session = s, this.navigate("safety"), await this.subscribeSession(this.connectionGeneration));
    }, "Calibration session could not be started.", () => this.ownsOperation(i, t, e));
  }
  async subscribeSession(t) {
    if (!this.api || !this.session) return;
    const e = this.api;
    this.clearSubscription("session");
    const i = this.sessionSubscriptionScope, s = this.session.session_id, o = this.session.device_id;
    await this.ownSubscription(
      e.subscribeSession(s, (r) => {
        this.owns(t, e) && i === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === o && r.session_id === s && r.device_id === o && (this.session = r, this.requestUpdate());
      }),
      t,
      e,
      () => i === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === o,
      (r) => {
        this.sessionUnsub = r;
      }
    );
  }
  async acknowledgeSafety() {
    if (!this.api || !this.session) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    await this.run(async () => {
      const o = await t.acknowledgeSafety(i);
      !this.ownsOperation(s, t, e) || o.session_id !== i || (this.session = o, this.navigate("voltage"));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(s, t, e));
  }
  async checkStability(t) {
    if (!this.api || !this.session) return;
    const e = this.api, i = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration, r = t === "voltage" ? this.groupKey(this.group) : String(this.channel);
    await this.run(async () => {
      const a = await e.checkStability(s, t, r);
      !this.ownsOperation(o, e, i) || this.session?.session_id !== s || (this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${t}:${r}`, a));
    }, "Stable samples could not be collected.", () => this.ownsOperation(o, e, i));
  }
  async calibrate(t) {
    if (!this.api || !this.session) return;
    const e = this.api, i = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration, r = t === "voltage" ? this.groupKey(this.group) : String(this.channel), a = this.groupKey(this.group), c = this.channel, h = this.reference;
    await this.run(
      async () => {
        const u = t === "voltage" ? await e.calibrateVoltage(s, a, h, !0) : await e.calibrateCurrent(s, c, h, !0);
        !this.ownsOperation(o, e, i) || this.session?.session_id !== s || (this.calibrationByTarget = new Map(this.calibrationByTarget).set(`${t}:${r}`, u), this.announcement = `Calibration iteration ${u.iteration} finished with state ${u.state}.`);
      },
      "Calibration did not complete. Reconnect and inspect before another attempt.",
      () => this.ownsOperation(o, e, i)
    );
  }
  groupKey(t) {
    const e = Math.floor(t / 2), i = t % 2 + 1;
    return e === 0 ? `meter_main${i}` : `addon${e}_${i}`;
  }
  async restart() {
    if (!this.api || !this.session) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    await this.run(
      async () => {
        const o = await t.restartAndVerify(i);
        !this.ownsOperation(s, t, e) || this.session?.session_id !== i || (this.restartResult = o, this.session = { ...this.session, state: "verified" }, this.navigate("summary"));
      },
      "Restart verification failed; review recovery evidence before rollback.",
      () => this.ownsOperation(s, t, e)
    );
  }
  async cancelSession() {
    if (!this.api || !this.session) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    await this.run(async () => {
      const o = await t.cancelSession(i);
      !this.ownsOperation(s, t, e) || this.session?.session_id !== i || (this.clearSubscription("session"), this.session = o, this.restartResult = null, this.navigate("safety"), this.announcement = "Calibration session cancelled; cleanup completed without restart verification.");
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(s, t, e));
  }
  async reconnectSession() {
    if (!this.api || !this.session) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    await this.run(
      async () => {
        const o = await t.getSession(i);
        !this.ownsOperation(s, t, e) || this.session?.session_id !== i || (this.session = o, this.announcement = `Session reconnected with state ${this.session.state}.`);
      },
      "Session reconnection failed. Retry only after checking the meter connection.",
      () => this.ownsOperation(s, t, e)
    );
  }
  resultFor(t) {
    const e = t === "voltage" ? this.groupKey(this.group) : String(this.channel);
    return this.calibrationByTarget.get(`${t}:${e}`) ?? null;
  }
  stabilityFor(t) {
    const e = t === "voltage" ? this.groupKey(this.group) : String(this.channel);
    return this.stabilityByTarget.get(`${t}:${e}`) ?? null;
  }
  async run(t, e, i = () => !0) {
    this.error = "";
    try {
      await t();
    } catch (s) {
      if (!i()) return;
      const o = s.code;
      this.fail(s, o === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : e);
    }
    i() && this.requestUpdate();
  }
  fail(t, e) {
    this.error = e, this.announcement = e, this.requestUpdate();
  }
  stepBody() {
    return this.step === "setup" ? Re(
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
    ) : this.step === "discover" ? me(
      this.setup?.devices ?? [],
      this.selectedDeviceId,
      (t) => {
        this.selectDevice(t), this.requestUpdate();
      },
      () => {
        this.adopt();
      },
      () => this.back(),
      () => {
        this.loadTopology();
      }
    ) : this.step === "topology" && this.topology ? Pe(this.topology, this.selectedProjectVersion(), () => this.back(), () => {
      this.loadInventory();
    }) : this.step === "ct" && this.inventory ? xe(
      this.inventory,
      this.board,
      this.ctGroup,
      this.drafts,
      (t) => {
        this.board = t, this.ctGroup = 0, this.requestUpdate();
      },
      (t) => this.selectCtGroup(t),
      (t, e) => this.updateDraft(t, e),
      () => this.back(),
      () => {
        this.reviewChanges();
      }
    ) : this.step === "build" ? ye(
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
      () => {
        this.startSession();
      }
    ) : this.step === "safety" ? Te(
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
      () => this.back()
    ) : this.step === "voltage" ? d`${De(
      this.topology,
      this.group,
      this.reference,
      this.stabilityFor("voltage"),
      this.resultFor("voltage"),
      (t) => {
        this.group = t, this.requestUpdate();
      },
      (t) => {
        this.reference = t, this.requestUpdate();
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? d`${Ae(
      this.topology,
      this.inventory,
      this.channel,
      this.reference,
      this.stabilityFor("current"),
      this.resultFor("current"),
      (t) => {
        this.channel = t, this.requestUpdate();
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
        this.reconnectSession();
      },
      () => {
        this.cancelSession();
      }
    )}
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("restart")}>Continue</button></footer>` : this.step === "restart" ? Ee(this.session?.state ?? this.error, this.restartResult, () => {
      this.restart();
    }, () => {
      this.transactionAction("rollback");
    }, () => this.back()) : Ue(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.selectedProjectVersion(), () => this.back());
  }
  render() {
    const t = T.findIndex(([e]) => e === this.step);
    return d`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${T.map(([e, i], s) => d`
            <li class=${s === t ? "current" : ""}>
              <button class="step-button" aria-current=${s === t ? "step" : b} ?disabled=${s > t}
                @click=${() => s <= t && this.navigate(e)}><span class="number">${s + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${t + 1} of 10 — ${T[t]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${T[t]?.[1]}</h1>
          ${this.error ? d`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : b}
          ${this.stepBody()}
          ${t >= 4 && this.step !== "summary" ? Nt(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult) : b}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", Be);
export {
  Be as CircuitSetupPanel
};
