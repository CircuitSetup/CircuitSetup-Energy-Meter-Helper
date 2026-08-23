const Q = globalThis, he = Q.ShadowRoot && (Q.ShadyCSS === void 0 || Q.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, pe = /* @__PURE__ */ Symbol(), we = /* @__PURE__ */ new WeakMap();
let qe = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== pe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (he && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = we.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && we.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Ze = (s) => new qe(typeof s == "string" ? s : s + "", void 0, pe), Xe = (s, ...e) => {
  const t = s.length === 1 ? s[0] : e.reduce((i, n, r) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + s[r + 1], s[0]);
  return new qe(t, s, pe);
}, Qe = (s, e) => {
  if (he) s.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), n = Q.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = t.cssText, s.appendChild(i);
  }
}, Se = he ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return Ze(t);
})(s) : s;
const { is: et, defineProperty: tt, getOwnPropertyDescriptor: it, getOwnPropertyNames: nt, getOwnPropertySymbols: st, getPrototypeOf: ot } = Object, se = globalThis, Ce = se.trustedTypes, rt = Ce ? Ce.emptyScript : "", at = se.reactiveElementPolyfillSupport, V = (s, e) => s, de = { toAttribute(s, e) {
  switch (e) {
    case Boolean:
      s = s ? rt : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, e) {
  let t = s;
  switch (e) {
    case Boolean:
      t = s !== null;
      break;
    case Number:
      t = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(s);
      } catch {
        t = null;
      }
  }
  return t;
} }, Ge = (s, e) => !et(s, e), xe = { attribute: !0, type: String, converter: de, reflect: !1, useDefault: !1, hasChanged: Ge };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), se.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let q = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = xe) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), n = this.getPropertyDescriptor(e, i, t);
      n !== void 0 && tt(this.prototype, e, n);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: n, set: r } = it(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: n, set(o) {
      const a = n?.call(this);
      r?.call(this, o), this.requestUpdate(e, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? xe;
  }
  static _$Ei() {
    if (this.hasOwnProperty(V("elementProperties"))) return;
    const e = ot(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(V("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(V("properties"))) {
      const t = this.properties, i = [...nt(t), ...st(t)];
      for (const n of i) this.createProperty(n, t[n]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, n] of t) this.elementProperties.set(i, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const n = this._$Eu(t, i);
      n !== void 0 && this._$Eh.set(n, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const n of i) t.unshift(Se(n));
    } else e !== void 0 && t.push(Se(e));
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
    return Qe(e, this.constructor.elementStyles), e;
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
    const i = this.constructor.elementProperties.get(e), n = this.constructor._$Eu(e, i);
    if (n !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : de).toAttribute(t, i.type);
      this._$Em = e, r == null ? this.removeAttribute(n) : this.setAttribute(n, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, n = i._$Eh.get(e);
    if (n !== void 0 && this._$Em !== n) {
      const r = i.getPropertyOptions(n), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : de;
      this._$Em = n;
      const a = o.fromAttribute(t, r.type);
      this[n] = a ?? this._$Ej?.get(n) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, n = !1, r) {
    if (e !== void 0) {
      const o = this.constructor;
      if (n === !1 && (r = this[e]), i ??= o.getPropertyOptions(e), !((i.hasChanged ?? Ge)(r, t) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: n, wrapped: r }, o) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), r !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), n === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [n, r] of this._$Ep) this[n] = r;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [n, r] of i) {
        const { wrapped: o } = r, a = this[n];
        o !== !0 || this._$AL.has(n) || a === void 0 || this.C(n, void 0, r, a);
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
q.elementStyles = [], q.shadowRootOptions = { mode: "open" }, q[V("elementProperties")] = /* @__PURE__ */ new Map(), q[V("finalized")] = /* @__PURE__ */ new Map(), at?.({ ReactiveElement: q }), (se.reactiveElementVersions ??= []).push("2.1.2");
const ue = globalThis, ke = (s) => s, te = ue.trustedTypes, Ae = te ? te.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, He = "$lit$", M = `lit$${Math.random().toFixed(9).slice(2)}$`, ze = "?" + M, ct = `<${ze}>`, D = document, K = () => D.createComment(""), W = (s) => s === null || typeof s != "object" && typeof s != "function", ge = Array.isArray, dt = (s) => ge(s) || typeof s?.[Symbol.iterator] == "function", ae = `[\x20\t
\f\r]`, z = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ee = /-->/g, Ie = />/g, U = RegExp(`>|${ae}(?:([^\\s"'>=/]+)(${ae}*=${ae}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), Re = /'/g, Te = /"/g, Le = /^(?:script|style|textarea|title)$/i, lt = (s) => (e, ...t) => ({ _$litType$: s, strings: e, values: t }), d = lt(1), G = /* @__PURE__ */ Symbol.for("lit-noChange"), w = /* @__PURE__ */ Symbol.for("lit-nothing"), Oe = /* @__PURE__ */ new WeakMap(), P = D.createTreeWalker(D, 129);
function Ve(s, e) {
  if (!ge(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ae !== void 0 ? Ae.createHTML(e) : e;
}
const ht = (s, e) => {
  const t = s.length - 1, i = [];
  let n, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = z;
  for (let a = 0; a < t; a++) {
    const c = s[a];
    let g, f, u = -1, l = 0;
    for (; l < c.length && (o.lastIndex = l, f = o.exec(c), f !== null); ) l = o.lastIndex, o === z ? f[1] === "!--" ? o = Ee : f[1] !== void 0 ? o = Ie : f[2] !== void 0 ? (Le.test(f[2]) && (n = RegExp("</" + f[2], "g")), o = U) : f[3] !== void 0 && (o = U) : o === U ? f[0] === ">" ? (o = n ?? z, u = -1) : f[1] === void 0 ? u = -2 : (u = o.lastIndex - f[2].length, g = f[1], o = f[3] === void 0 ? U : f[3] === '"' ? Te : Re) : o === Te || o === Re ? o = U : o === Ee || o === Ie ? o = z : (o = U, n = void 0);
    const p = o === U && s[a + 1].startsWith("/>") ? " " : "";
    r += o === z ? c + ct : u >= 0 ? (i.push(g), c.slice(0, u) + He + c.slice(u) + M + p) : c + M + (u === -2 ? a : p);
  }
  return [Ve(s, r + (s[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class J {
  constructor({ strings: e, _$litType$: t }, i) {
    let n;
    this.parts = [];
    let r = 0, o = 0;
    const a = e.length - 1, c = this.parts, [g, f] = ht(e, t);
    if (this.el = J.createElement(g, i), P.currentNode = this.el.content, t === 2 || t === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (n = P.nextNode()) !== null && c.length < a; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const u of n.getAttributeNames()) if (u.endsWith(He)) {
          const l = f[o++], p = n.getAttribute(u).split(M), h = /([.?@])?(.*)/.exec(l);
          c.push({ type: 1, index: r, name: h[2], strings: p, ctor: h[1] === "." ? ut : h[1] === "?" ? gt : h[1] === "@" ? ft : oe }), n.removeAttribute(u);
        } else u.startsWith(M) && (c.push({ type: 6, index: r }), n.removeAttribute(u));
        if (Le.test(n.tagName)) {
          const u = n.textContent.split(M), l = u.length - 1;
          if (l > 0) {
            n.textContent = te ? te.emptyScript : "";
            for (let p = 0; p < l; p++) n.append(u[p], K()), P.nextNode(), c.push({ type: 2, index: ++r });
            n.append(u[l], K());
          }
        }
      } else if (n.nodeType === 8) if (n.data === ze) c.push({ type: 2, index: r });
      else {
        let u = -1;
        for (; (u = n.data.indexOf(M, u + 1)) !== -1; ) c.push({ type: 7, index: r }), u += M.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const i = D.createElement("template");
    return i.innerHTML = e, i;
  }
}
function H(s, e, t = s, i) {
  if (e === G) return e;
  let n = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const r = W(e) ? void 0 : e._$litDirective$;
  return n?.constructor !== r && (n?._$AO?.(!1), r === void 0 ? n = void 0 : (n = new r(s), n._$AT(s, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = n : t._$Cl = n), n !== void 0 && (e = H(s, n._$AS(s, e.values), n, i)), e;
}
class pt {
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
    const { el: { content: t }, parts: i } = this._$AD, n = (e?.creationScope ?? D).importNode(t, !0);
    P.currentNode = n;
    let r = P.nextNode(), o = 0, a = 0, c = i[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let g;
        c.type === 2 ? g = new Y(r, r.nextSibling, this, e) : c.type === 1 ? g = new c.ctor(r, c.name, c.strings, this, e) : c.type === 6 && (g = new vt(r, this, e)), this._$AV.push(g), c = i[++a];
      }
      o !== c?.index && (r = P.nextNode(), o++);
    }
    return P.currentNode = D, n;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class Y {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, n) {
    this.type = 2, this._$AH = w, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = n, this._$Cv = n?.isConnected ?? !0;
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
    e = H(this, e, t), W(e) ? e === w || e == null || e === "" ? (this._$AH !== w && this._$AR(), this._$AH = w) : e !== this._$AH && e !== G && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : dt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== w && W(this._$AH) ? this._$AA.nextSibling.data = e : this.T(D.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, n = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = J.createElement(Ve(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === n) this._$AH.p(t);
    else {
      const r = new pt(n, this), o = r.u(this.options);
      r.p(t), this.T(o), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = Oe.get(e.strings);
    return t === void 0 && Oe.set(e.strings, t = new J(e)), t;
  }
  k(e) {
    ge(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, n = 0;
    for (const r of e) n === t.length ? t.push(i = new Y(this.O(K()), this.O(K()), this, this.options)) : i = t[n], i._$AI(r), n++;
    n < t.length && (this._$AR(i && i._$AB.nextSibling, n), t.length = n);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = ke(e).nextSibling;
      ke(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class oe {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, n, r) {
    this.type = 1, this._$AH = w, this._$AN = void 0, this.element = e, this.name = t, this._$AM = n, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = w;
  }
  _$AI(e, t = this, i, n) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) e = H(this, e, t, 0), o = !W(e) || e !== this._$AH && e !== G, o && (this._$AH = e);
    else {
      const a = e;
      let c, g;
      for (e = r[0], c = 0; c < r.length - 1; c++) g = H(this, a[i + c], t, c), g === G && (g = this._$AH[c]), o ||= !W(g) || g !== this._$AH[c], g === w ? e = w : e !== w && (e += (g ?? "") + r[c + 1]), this._$AH[c] = g;
    }
    o && !n && this.j(e);
  }
  j(e) {
    e === w ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ut extends oe {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === w ? void 0 : e;
  }
}
class gt extends oe {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== w);
  }
}
class ft extends oe {
  constructor(e, t, i, n, r) {
    super(e, t, i, n, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = H(this, e, t, 0) ?? w) === G) return;
    const i = this._$AH, n = e === w && i !== w || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== w && (i === w || n);
    n && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class vt {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    H(this, e);
  }
}
const _t = ue.litHtmlPolyfillSupport;
_t?.(J, Y), (ue.litHtmlVersions ??= []).push("3.3.3");
const mt = (s, e, t) => {
  const i = t?.renderBefore ?? e;
  let n = i._$litPart$;
  if (n === void 0) {
    const r = t?.renderBefore ?? null;
    i._$litPart$ = n = new Y(e.insertBefore(K(), r), r, void 0, t ?? {});
  }
  return n._$AI(s), n;
};
const fe = globalThis;
class F extends q {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = mt(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return G;
  }
}
F._$litElement$ = !0, F.finalized = !0, fe.litElementHydrateSupport?.({ LitElement: F });
const bt = fe.litElementPolyfillSupport;
bt?.({ LitElement: F });
(fe.litElementVersions ??= []).push("4.2.2");
const Me = "circuitsetup_energy_meter_helper/", $t = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, yt = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, wt = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, St = /[\u0000-\u001f\u007f-\u009f]/, Ct = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), xt = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), kt = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "indeterminate", "verified", "cancelled"]), ve = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), Ne = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), ie = /* @__PURE__ */ new Set(["A", "B", "C"]), At = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), Et = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), It = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), Rt = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), Tt = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), Ot = /^(?:ct(?:[1-9]|[1-3][0-9]|4[0-2])_name|current_cal_ct(?:[1-9]|[1-3][0-9]|4[0-2])|voltage_cal[12])$/, Mt = /^[0-9a-f]{12}$/, Nt = /^[0-9a-f]{64}$/, Ue = /^[0-9a-f]{32}$/, Ut = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, Pe = /* @__PURE__ */ new Set(["preview_ct_config", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]);
function y(s, e) {
  if (s === null || typeof s != "object" || Array.isArray(s)) throw new Error(`${e} response is invalid`);
  return s;
}
function C(s, e, t = 100) {
  if (!Array.isArray(s) || s.length > t) throw new Error(`${e} response is invalid`);
  return s;
}
function _(s, e, t = !1) {
  if (t && s === null) return null;
  if (typeof s != "string" || s.length === 0) throw new Error(`${e} response is invalid`);
  return s;
}
function E(s, e) {
  if (typeof s != "number" || !Number.isFinite(s)) throw new Error(`${e} response is invalid`);
  return s;
}
function $(s, e) {
  const t = E(s, e);
  if (!Number.isInteger(t)) throw new Error(`${e} response is invalid`);
  return t;
}
function I(s, e, t = !1) {
  if (t && s === null) return null;
  if (typeof s != "boolean") throw new Error(`${e} response is invalid`);
  return s;
}
function k(s, e, t) {
  const i = _(s, t);
  if (!e.has(i)) throw new Error(`${t} response is invalid`);
  return i;
}
function le(s, e) {
  s !== void 0 && _(s, e, !0);
}
function ee(s, e) {
  return Math.abs(s - e) <= 1e-9 * Math.max(1, Math.abs(s), Math.abs(e));
}
function Fe(s, e) {
  const t = y(s, e);
  _(t.entry_id, e), _(t.title, e), _(t.project_name, e), _(t.project_version, e, !0), I(t.importable, e, !0), _(t.configuration, e, !0);
}
function X(s, e) {
  const t = y(s, e);
  if (k(t.state, Ct, e), C(t.devices, e).forEach((i) => Fe(i, e)), t.configuration_authoritative !== void 0 && I(t.configuration_authoritative, e), t.installer_intent !== void 0) {
    const i = y(t.installer_intent, e), n = $(i.addon_count, e);
    if (n < 0 || n > 6) throw new Error(`${e} response is invalid`);
    if (k(i.connection_type, ve, e) === "unknown") throw new Error(`${e} response is invalid`);
  }
  return s;
}
function De(s, e) {
  const t = y(s, e), i = $(t.addon_count, e), n = $(t.board_count, e), r = $(t.ct_count, e), o = $(t.group_count, e);
  if (i < 0 || i > 6 || n < 1 || n > 7 || r < 6 || r > 42 || o < 2 || o > 14 || n !== i + 1 || r !== 6 * n || o !== 2 * n) throw new Error(`${e} response is invalid`);
  k(t.connection_type, ve, e), _(t.voltage_layout, e), _(t.project_name, e);
  const a = C(t.evidence, e);
  if (a.length < 1 || a.length > Ne.size) throw new Error(`${e} response is invalid`);
  const c = a.map((g) => {
    const f = y(g, e), u = k(f.source, Ne, e), l = $(f.addon_count, e);
    if (l < 0 || l > 6) throw new Error(`${e} response is invalid`);
    return _(f.detail, e), u;
  });
  if (new Set(c).size !== c.length || !c.some((g) => Tt.has(g))) throw new Error(`${e} response is invalid`);
  return s;
}
function Pt(s, e) {
  const t = y(s, e);
  return "topology" in t ? (De(t.topology, e), t.configuration_authoritative !== void 0 && I(t.configuration_authoritative, e), s) : De(s, e);
}
function Dt(s, e) {
  const t = y(s, e);
  _(t.plan_id, e), _(t.source_sha256, e);
  const i = C(t.channels, e);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${e} response is invalid`);
  i.forEach((o, a) => {
    const c = y(o, e), g = $(c.channel, e);
    _(c.name, e), $(c.raw_gain_ct, e), E(c.reporting_multiplier, e), le(c.selected_model_id, e), I(c.selection_verified_against_config, e), le(c.display_label, e);
    const f = y(c.address, e), u = $(f.channel, e), l = $(f.board_index, e), p = $(f.group_index, e), h = k(f.phase, ie, e), b = a + 1;
    if (g !== b || u !== b || l !== Math.floor(a / 6) || p !== Math.floor(a % 6 / 3) + 1 || h !== ["A", "B", "C"][a % 3]) throw new Error(`${e} response is invalid`);
  });
  const n = y(t.catalog, e);
  _(n.source_repository, e), _(n.source_ref, e), $(n.schema_version, e);
  const r = C(n.presets, e);
  if (r.length > 64) throw new Error(`${e} response is invalid`);
  return r.forEach((o) => {
    const a = y(o, e);
    _(a.model_id, e), _(a.label, e), E(a.rated_current_a, e), _(a.secondary, e), a.default_gain_ct !== null && $(a.default_gain_ct, e), I(a.requires_burden_jumper_cut, e), _(a.notes, e);
  }), s;
}
function ce(s, e) {
  const t = y(s, e);
  if (_(t.transaction_id, e), k(t.state, xt, e), _(t.source_sha256, e), I(t.rollback_available, e), _(t.redacted_diff, e), C(t.changes, e).forEach((i) => {
    const n = y(i, e), r = _(n.key, e);
    if (!Ot.test(r)) throw new Error(`${e} response is invalid`);
    n.old_value !== null && _(n.old_value, e), _(n.new_value, e);
  }), C(t.evidence, e).forEach((i) => k(i, Et, e)), C(t.progress, e).forEach((i) => k(i, It, e)), t.validation_detail != null) {
    const i = y(t.validation_detail, e);
    for (const n of ["reported_error_count", "reported_warning_count"]) i[n] !== null && $(i[n], e);
    i.code !== null && $(i.code, e), $(i.error_record_count, e), $(i.warning_record_count, e);
  }
  return t.upload_progress !== void 0 && C(t.upload_progress, e).forEach((i) => {
    const n = y(i, e);
    if (k(n.stage, At, e), n.progress !== null && n.percentage !== null && n.progress !== void 0 && n.percentage !== void 0) throw new Error(`${e} response is invalid`);
    const r = n.progress ?? n.percentage;
    if (r != null) {
      const o = $(r, e);
      if (o < 0 || o > 100) throw new Error(`${e} response is invalid`);
    }
  }), s;
}
function L(s, e) {
  const t = y(s, e);
  _(t.session_id, e), _(t.device_id, e), k(t.state, kt, e), I(t.safety_acknowledged, e);
  const i = y(t.preflight, e);
  return C(i.issues, e).forEach((n) => {
    const r = y(n, e);
    k(r.code, Rt, e), _(r.role, e), _(r.detail, e);
  }), C(i.zeroed_roles, e).forEach((n) => _(n, e)), t.calibration_sources !== void 0 && Object.values(y(t.calibration_sources, e)).forEach((n) => k(n, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), e)), s;
}
function Bt(s, e, t, i) {
  const n = y(s, e), r = k(n.target, /* @__PURE__ */ new Set(["voltage", "current"]), e);
  _(n.target_id, e);
  const o = I(n.stable, e);
  if (r !== t || n.target_id !== i) throw new Error(`${e} response is invalid`);
  const a = C(n.windows, e, r === "voltage" ? 3 : 1);
  if (a.length !== (r === "voltage" ? 3 : 1)) throw new Error(`${e} response is invalid`);
  const c = a.map((g) => {
    const f = y(g, e), u = C(f.samples, e, 1).map((S) => E(S, e));
    if (u.length !== 1) throw new Error(`${e} response is invalid`);
    const l = E(f.mean, e), p = E(f.standard_deviation, e), h = E(f.range_percent, e), b = u.reduce((S, R) => S + R, 0) / u.length, m = Math.sqrt(u.reduce((S, R) => S + (R - b) ** 2, 0) / u.length), v = 100 * (Math.max(...u) - Math.min(...u)) / Math.abs(b);
    if (!ee(l, b) || !ee(p, m) || !ee(h, v)) throw new Error(`${e} response is invalid`);
    return h;
  });
  if (o !== c.every((g) => g <= 1)) throw new Error(`${e} response is invalid`);
  return s;
}
function Be(s, e, t) {
  const i = y(s, e), n = k(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e);
  _(i.group_key, e), i.phase !== null && k(i.phase, ie, e);
  const r = $(i.iteration, e), o = C(i.changed_channels, e, 3).map((h) => $(h, e)), a = C(i.before_values, e, 3), c = C(i.after_values, e, 3), g = C(i.error_percent_values, e, 3);
  for (const h of [a, c, g]) h.forEach((b) => E(b, e));
  const f = t.target === "voltage" ? t.groupKey : _e(t.references[0].channel), u = t.target === "voltage" ? qt(t.groupKey) : t.references.map((h) => h.channel), l = t.target === "current" && t.references.length === 1 ? ["A", "B", "C"][(t.references[0].channel - 1) % 3] : null, p = I(i.retry_allowed, e);
  if (t.target === "voltage" && (!Number.isFinite(t.reference) || t.reference <= 0) || t.target === "current" && t.references.some((h) => !Number.isFinite(h.reference) || h.reference <= 0 || !Number.isFinite(h.rawReference) || h.rawReference <= 0) || ![1, 2, 3].includes(o.length) || n !== "indeterminate" && a.length !== o.length || new Set(o).size !== o.length || o.some((h) => h < 1 || h > 42) || r < 1 || r > 3 || i.group_key !== f || i.phase !== l || o.length !== u.length || o.some((h, b) => h !== u[b]) || (n === "indeterminate" ? c.length !== 0 || g.length !== 0 : c.length !== o.length || g.length !== o.length)) throw new Error(`${e} response is invalid`);
  if (n === "indeterminate") {
    if (i.gain_evidence !== null || p) throw new Error(`${e} response is invalid`);
    i.restore_evidence != null && y(i.restore_evidence, e);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${e} response is invalid`);
    jt(i.gain_evidence, e, t);
    const h = t.target === "voltage" ? c.map(() => t.reference) : t.references.map((v) => v.reference), b = c.map((v, S) => 100 * Math.abs(E(v, e) - h[S]) / h[S]);
    if (g.some((v, S) => E(v, e) < 0 || !ee(E(v, e), b[S]))) throw new Error(`${e} response is invalid`);
    const m = Math.max(...b) > 1;
    if (n === "result_outside_tolerance" !== m || p !== (m && r < 3)) throw new Error(`${e} response is invalid`);
  }
  return s;
}
function _e(s) {
  const e = Math.floor((s - 1) / 6), t = Math.floor((s - 1) % 6 / 3) + 1;
  return e === 0 ? `main_${t}` : `addon${e}_${t}`;
}
function jt(s, e, t) {
  const i = y(s, e), n = $(i.connection_generation, e), r = $(i.operation_sequence, e), o = t.target === "voltage" ? t.groupKey : _e(t.references[0].channel), a = o.startsWith("main_") ? `meter_main${o.slice(-1)}` : o;
  if (n < 1 || r < 1 || _(i.instance_id, e) !== a) throw new Error(`${e} response is invalid`);
  const c = t.target === "current" ? new Map(t.references.map((l) => [["A", "B", "C"][(l.channel - 1) % 3], l.rawReference])) : /* @__PURE__ */ new Map(), g = C(i.phases, e, 3);
  if (g.length !== 3) throw new Error(`${e} response is invalid`);
  g.forEach((l, p) => {
    const h = y(l, e), b = k(h.phase, ie, e);
    if (b !== ["A", "B", "C"][p]) throw new Error(`${e} response is invalid`);
    E(h.measured_voltage, e), E(h.measured_current, e);
    const m = E(h.reference_voltage, e), v = E(h.reference_current, e), S = $(h.old_voltage_gain, e), R = $(h.new_voltage_gain, e), N = $(h.old_current_gain, e), B = $(h.new_current_gain, e);
    if ([S, R, N, B].some((O) => O < 1 || O > 65535)) throw new Error(`${e} response is invalid`);
    if (t.target === "voltage") {
      if (Math.abs(m - t.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(m), t.reference)) || Math.abs(v) > 1e-6 || N !== B) throw new Error(`${e} response is invalid`);
    } else {
      const O = c.get(b);
      if (Math.abs(m) > 1e-6 || (O === void 0 ? Math.abs(v) > 1e-6 : Math.abs(v - O) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(v), O))) || S !== R || O === void 0 && N !== B) throw new Error(`${e} response is invalid`);
    }
  });
  const f = C(i.register_mismatch_phases, e, 3);
  f.forEach((l) => k(l, ie, e));
  const u = C(i.matching_lines, e, 100);
  if (u.length === 0 || u.some((l) => typeof l != "string") || I(i.flash_saved, e) !== !0 || f.length !== 0 || I(i.calibration_disabled, e) !== !1) throw new Error(`${e} response is invalid`);
}
function qt(s) {
  const e = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(s);
  if (!e) return [];
  const t = e[2] === void 0 ? 0 : Number(e[2]), i = Number(e[1] ?? e[3]), n = t * 6 + (i - 1) * 3 + 1;
  return [n, n + 1, n + 2];
}
function Gt(s, e, t) {
  const i = y(s, e);
  for (const f of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) _(i[f], e);
  const n = $(i.topology_addon_count, e);
  k(i.topology_connection_type, ve, e);
  const r = $(i.connection_generation, e);
  k(i.source_authority, /* @__PURE__ */ new Set(["saved_flash"]), e);
  const o = I(i.source_handoff_available, e);
  if (le(i.source_handoff_transaction_id, e), o) {
    if (_(i.config_filename, e), _(i.config_sha256, e), !Ut.test(i.config_filename) || !Nt.test(i.config_sha256)) throw new Error(`${e} response is invalid`);
  } else if (i.config_filename !== null || i.config_sha256 !== null) throw new Error(`${e} response is invalid`);
  if (!Mt.test(i.mac) || !Ue.test(i.verification_id) || r < 1 || i.source_handoff_transaction_id !== null && !Ue.test(i.source_handoff_transaction_id) || n !== t.addon_count || i.topology_project_name !== t.project_name || i.topology_connection_type !== t.connection_type || i.topology_voltage_layout !== t.voltage_layout) throw new Error(`${e} response is invalid`);
  const a = C(i.groups, e, 14), c = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: n }, (f, u) => [`addon${u + 1}_1`, `addon${u + 1}_2`]).flat()]), g = /* @__PURE__ */ new Set();
  if (a.length < 1) throw new Error(`${e} response is invalid`);
  return a.forEach((f) => {
    const u = y(f, e), l = _(u.instance_id, e);
    if (!c.has(l) || g.has(l)) throw new Error(`${e} response is invalid`);
    g.add(l);
    const p = C(u.phase_gains, e, 3);
    if (p.length !== 3) throw new Error(`${e} response is invalid`);
    p.forEach((h) => {
      const b = C(h, e, 2);
      if (b.length !== 2) throw new Error(`${e} response is invalid`);
      b.forEach((m) => {
        const v = $(m, e);
        if (v < 1 || v > 65535) throw new Error(`${e} response is invalid`);
      });
    });
  }), s;
}
class ne {
  constructor(e, t) {
    this.hass = e, this.entryId = t, this.setupStatus = () => this.call("setup_status", (i) => X(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (C(i, "list_meters").forEach((n) => Fe(n, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (n) => Pt(n, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (n) => Dt(n, "get_ct_inventory"), { device_id: i }), this.getSession = (i) => this.call("get_session", (n) => L(n, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => y(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, n) => this.call("set_installer_intent", (r) => X(r, "set_installer_intent"), { addon_count: i, connection_type: n }), this.rescan = () => this.call("rescan", (i) => X(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (n) => {
      const r = y(n, "adopt_device");
      return _(r.device_id, "adopt_device"), _(r.configuration, "adopt_device"), n;
    }, { device_id: i }), this.previewCtConfig = (i, n, r, o) => this.call("preview_ct_config", (a) => ce(a, "preview_ct_config"), {
      device_id: i,
      plan_id: n,
      source_sha256: r,
      changes: o
    }), this.setHaLabels = (i, n, r, o) => this.call("set_ha_labels", (a) => a, {
      device_id: i,
      plan_id: n,
      source_sha256: r,
      changes: o
    }), this.transaction = (i, n, r, o) => this.call(i, (a) => ce(a, i), {
      device_id: n,
      transaction_id: r,
      source_sha256: o
    }), this.applyCtConfig = (i, n, r) => this.transaction("apply_ct_config", i, n, r), this.compileCtConfig = (i, n, r) => this.transaction("compile_ct_config", i, n, r), this.installCtConfig = (i, n, r) => this.transaction("install_ct_config", i, n, r), this.rollbackCtConfig = (i, n, r) => this.transaction("rollback_ct_config", i, n, r), this.startSession = (i) => this.call("start_session", (n) => L(n, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (n) => L(n, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, n, r) => this.call("check_stability", (o) => Bt(o, "check_stability", n, r), { session_id: i, target: n, target_id: r }), this.calibrateVoltage = (i, n, r, o) => this.call("calibrate_voltage", (a) => Be(a, "calibrate_voltage", { target: "voltage", groupKey: n, reference: r }), {
      session_id: i,
      group_key: n,
      reference: r,
      confirm_iteration: o
    }), this.calibrateCurrent = (i, n, r) => n.length < 1 || n.length > 3 || new Set(n.map((o) => o.channel)).size !== n.length || new Set(n.map((o) => _e(o.channel))).size !== 1 || n.some((o) => !Number.isInteger(o.channel) || o.channel < 1 || o.channel > 42 || !Number.isFinite(o.reference) || o.reference <= 0 || !Number.isFinite(o.reporting_multiplier) || o.reporting_multiplier < 1e-3 || o.reporting_multiplier > 1e3) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (o) => Be(o, "calibrate_current", {
      target: "current",
      references: n.map((a) => ({ channel: a.channel, reference: a.reference, rawReference: a.reference / a.reporting_multiplier }))
    }), {
      session_id: i,
      references: n,
      confirm_iteration: r
    }), this.restartAndVerify = (i, n) => this.call("restart_and_verify", (r) => Gt(r, "restart_and_verify", n), { session_id: i }), this.cancelSession = (i) => this.call("cancel_session", (n) => L(n, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (n) => X(n, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, n, r, o) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: n,
      source_sha256: r
    }, (a) => ce(a, "subscribe_config_transaction"), o), this.subscribeSession = (i, n) => this.subscribe("subscribe_session", { session_id: i }, (r) => L(r, "subscribe_session"), n);
  }
  static assertPublicPayload(e, t = !1, i = 0, n = "", r = !1) {
    if (i > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(e)) {
      if (e.length > 100) throw new Error(`unsafe collection ${n || "value"} refused`);
      for (const o of e) this.assertPublicPayload(o, !1, i + 1, n);
      return;
    }
    if (typeof e == "string") {
      const o = e.includes(`
`) || e.includes("\r"), a = n === "redacted_diff" ? 32768 : 4096;
      if (e.length > a || wt.test(e) || yt.test(e) || o && n !== "redacted_diff" || n === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${n || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [o, a] of Object.entries(e)) {
        if (o.length > 256 || St.test(o)) throw new Error("unsafe property name refused");
        if (o.toLowerCase() === "key" && !r) throw new Error(`private field ${o} refused`);
        if (o.toLowerCase() !== "raw_gain_ct" && $t.test(o))
          throw new Error(`private field ${o} refused`);
        if (t && i === 0 && o === "changes" && Array.isArray(a)) {
          if (a.length > 100) throw new Error("unsafe collection changes refused");
          for (const c of a) this.assertPublicPayload(c, !1, i + 2, "", !0);
        } else
          this.assertPublicPayload(a, !1, i + 1, o.toLowerCase());
      }
  }
  async call(e, t, i = {}) {
    const n = await this.hass.callWS({
      type: `${Me}${e}`,
      entry_id: this.entryId,
      ...i
    });
    return ne.assertPublicPayload(n, Pe.has(e)), t(n);
  }
  subscribe(e, t, i, n) {
    return this.hass.connection.subscribeMessage((r) => {
      ne.assertPublicPayload(r, Pe.has(e)), n(i(r));
    }, { type: `${Me}${e}`, entry_id: this.entryId, ...t });
  }
}
function Ht(s, e, t, i, n, r) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Select the compatible meter discovered on your network.</p>
      <div class="meter-list">
        ${s.map((o) => d`
          <label class=${o.entry_id === e ? "meter-row selected" : "meter-row"}>
            <input type="radio" name="meter" .checked=${o.entry_id === e}
              @change=${() => t(o.entry_id)} />
            <span><strong>${o.title}</strong><small>${o.project_name} · ${o.project_version ?? "version unavailable"}</small></span>
            <span>Device Builder: ${o.configuration ? "Configured" : o.importable ? "Importable" : o.importable === null ? "Unavailable" : "Not importable"}</span>
          </label>
        `)}
      </div>
      ${s.some((o) => o.entry_id === e && o.importable) ? d`
        <button class="secondary" @click=${i}>Adopt</button>
      ` : ""}
      <footer class="action-footer">
        <button class="secondary" data-action="back" @click=${n}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${!e} @click=${r}>Continue</button>
      </footer>
    </section>
  `;
}
function zt(s) {
  return d`
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
function Lt(s, e, t, i, n, r, o) {
  const a = s?.state ?? "previewed";
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${zt(s)}
      ${a === "failed" ? d`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${s?.evidence.join(", ") || "The operation did not complete."}</p>
          ${s?.rollback_available ? d`<button class="danger" @click=${n}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${e} ?disabled=${a !== "previewed"}>Apply</button>
        <button class="secondary" @click=${t} ?disabled=${a !== "validated"}>Compile</button>
        <button class="primary" @click=${i} ?disabled=${a !== "install_confirmation_required"}>Install</button>
      </div>
      ${s?.validation_detail ? d`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${s.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${s.validation_detail.error_record_count} records (${s.validation_detail.reported_error_count ?? "unreported"} reported)</dd></div>
        <div><dt>Warnings</dt><dd>${s.validation_detail.warning_record_count} records (${s.validation_detail.reported_warning_count ?? "unreported"} reported)</dd></div>
      </dl>` : ""}
      ${s?.upload_progress?.length ? d`<ul class="upload-progress">${s.upload_progress.map((c) => d`
        <li>${c.stage}: ${c.percentage ?? c.progress ?? "in progress"}${c.percentage != null || c.progress != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" data-action="continue" @click=${o} ?disabled=${a !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const me = (s, e) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(s.key)) return;
  s.preventDefault();
  const i = [...s.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], n = s.key === "ArrowRight" || s.key === "ArrowDown", r = s.key === "Home" ? 0 : s.key === "End" ? i.length - 1 : (e + (n ? 1 : i.length - 1)) % i.length;
  i[r]?.click(), i[r]?.focus();
}, Vt = (s, e, t) => (s?.default_gain_ct ?? t) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((s?.default_gain_ct ?? t) / e);
function Ft(s, e, t, i, n, r, o, a, c, g = !1) {
  const f = Math.ceil(s.channels.length / 6), u = s.channels.filter((l) => l.address.board_index === e).slice(0, 8);
  return d`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: f }, (l, p) => d`
          <button role="tab" id=${`board-tab-${p}`} data-board-tab=${p} aria-selected=${p === e}
            aria-controls="board-panel" tabindex=${p === e ? "0" : "-1"}
            @keydown=${(h) => me(h, p)}
            @click=${() => n(p)}>${p === 0 ? "Main Board" : `Add-on ${p}`}</button>
        `)}
      </div>
      <div class="group-nav" aria-label="Three-channel groups">
        <button data-group-nav aria-current=${t === 0} @click=${() => r(0)}>Group 1 · CT${e * 6 + 1}–${e * 6 + 3}</button>
        <button data-group-nav aria-current=${t === 1} @click=${() => r(1)}>Group 2 · CT${e * 6 + 4}–${e * 6 + 6}</button>
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <div id="board-panel" role="tabpanel" aria-labelledby=${`board-tab-${e}`}>
      <div class="ct-table" role="table" aria-rowcount=${s.channels.length + 1}>
        <div class="ct-header" role="row" aria-rowindex="1">
          <span role="columnheader">Name</span><span role="columnheader">Model</span><span role="columnheader">Current gain</span><span role="columnheader">Multiplier</span><span role="columnheader">Resulting gain</span><span role="columnheader">Burden</span><span role="columnheader">Status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${u.map((l) => {
    const p = i.get(l.channel) ?? {
      name: l.name,
      modelId: l.selected_model_id ?? "",
      multiplier: l.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, h = s.catalog.presets.find((v) => v.model_id === p.modelId), b = Vt(h, p.multiplier, p.modelId === "custom" ? p.customGainCt : void 0), m = be(l, p);
    return d`
              <div class="ct-row" data-ct-row data-ct-group=${l.address.group_index - 1} role="row" aria-rowindex=${l.channel + 1} aria-label=${`CT${l.channel}`}>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${l.channel} name`} .value=${p.name}
                  @input=${(v) => o(l.channel, { name: v.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${l.channel} model`} ?disabled=${g}
                  @change=${(v) => {
      const S = v.target.value, R = s.catalog.presets.find((N) => N.model_id === S);
      o(l.channel, {
        modelId: S,
        burdenAcknowledged: l.selection_verified_against_config && S === l.selected_model_id && (S === "custom" || R?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${p.modelId === ""}>Choose model</option>
                  ${s.catalog.presets.map((v) => d`<option value=${v.model_id} ?selected=${p.modelId === v.model_id}>${v.label}</option>`)}
                  <option value="custom" ?selected=${p.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${l.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${l.channel} multiplier`} ?disabled=${g}
                  .value=${String(p.multiplier)} @input=${(v) => o(l.channel, { multiplier: Number(v.target.value) })} /></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${b ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${h?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${p.expanded} @click=${() => o(l.channel, { expanded: !p.expanded })}>
                  ${p.modelId ? m ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${p.modelId === "custom" ? d`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${l.channel} custom gain`}
                  ?disabled=${g}
                  .value=${p.customGainCt === void 0 ? "" : String(p.customGainCt)}
                  @input=${(v) => o(l.channel, { customGainCt: Number(v.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${l.channel} custom label`} ?disabled=${g} .value=${p.customLabel ?? ""}
                  @input=${(v) => o(l.channel, { customLabel: v.target.value })} /></label>
              </div>` : w}
              ${p.modelId === "custom" || h?.requires_burden_jumper_cut ? d`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${l.channel} burden output acknowledgement`}
                  ?disabled=${g}
                  .checked=${p.burdenAcknowledged}
                  @change=${(v) => o(l.channel, { burdenAcknowledged: v.target.checked })} />
                  I checked the burden-output requirement for CT${l.channel}</label>
              </div>` : w}
              ${h && h.rated_current_a > 65.535 && p.multiplier === 1 ? d`<div class="warning-band" role="status">CT${l.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : w}
              ${p.expanded && h ? d`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${h.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${h.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${h.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${h.notes || (h.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : w}
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${u.length} of ${s.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${a}>Back</button>
        <button class="primary" ?disabled=${g ? ![...i].some(([l, p]) => p.name !== s.channels.find((h) => h.channel === l)?.name) : !Jt(s, i)} @click=${c}>${g ? "Save Home Assistant labels" : "Review changes"}</button>
      </footer>
    </section>
  `;
}
function Kt(s, e) {
  return s.channels.flatMap((t) => {
    const i = e.get(t.channel);
    if (!i || !be(t, i)) return [];
    const n = s.catalog.presets.find((o) => o.model_id === i.modelId), r = { channel: t.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (r.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (r.custom_label = i.customLabel.trim()), r.burden_output_acknowledged = i.burdenAcknowledged) : n?.requires_burden_jumper_cut && (r.burden_output_acknowledged = i.burdenAcknowledged), [r];
  });
}
function be(s, e) {
  return e.name !== s.name || e.modelId !== (s.selected_model_id ?? "") || e.multiplier !== s.reporting_multiplier || e.modelId === "custom" && (e.customGainCt !== s.raw_gain_ct || (e.customLabel?.trim() ?? "") !== (s.display_label ?? ""));
}
function Wt(s, e) {
  if (!e.name.trim() || !e.modelId || !Number.isFinite(e.multiplier) || e.multiplier <= 0) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const t = s.catalog.presets.find((i) => i.model_id === e.modelId);
  return !!t && (!t?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function Jt(s, e) {
  let t = !1;
  for (const i of s.channels) {
    const n = e.get(i.channel);
    if (!n || be(i, n) && (t = !0, !Wt(s, n)))
      return !1;
  }
  return t;
}
const T = (s) => s.toFixed(2);
function Ke(s, e, t) {
  const i = [s, !!e?.stable, !!t, !!t?.gain_evidence, !!t], n = i.findIndex((o) => !o);
  return d`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((o, a) => d`<li
    class=${i[a] ? "complete" : a === n ? "active" : "pending"}>${o}</li>`)}</ol>`;
}
function We(s) {
  const e = Object.entries(s?.calibration_sources ?? {});
  return d`<section class="measurement-evidence calibration-source" aria-label="Current calibration source">
    <h3>Current calibration source</h3>
    ${e.length ? d`<table><thead><tr><th>Chip</th><th>Source</th><th>Saved in flash</th></tr></thead><tbody>
      ${e.map(([t, i]) => d`<tr><td>${t}</td><td>${i === "configuration" ? "Configuration" : i === "flash" ? "Saved flash" : "Unknown"}</td><td>${i === "flash" ? "Yes" : i === "configuration" ? "No" : "Unknown"}</td></tr>`)}
    </tbody></table>` : d`<p>Calibration source is not available.</p>`}
  </section>`;
}
function $e(s) {
  return s ? d`<section class="measurement-evidence" aria-label=${`${s.target} ${s.target_id} stability evidence`}>
    <h3>Stability evidence · ${s.target_id}</h3>
    ${s.windows.map((e, t) => d`<dl>
      <div><dt>Live values</dt><dd>${e.samples.map(T).join(", ")}</dd></div>
      <div><dt>Mean</dt><dd>${T(e.mean)}</dd></div>
      <div><dt>Standard deviation</dt><dd>${T(e.standard_deviation)}</dd></div>
      <div><dt>Range</dt><dd>${T(e.range_percent)}%</dd></div>
    </dl>`)}
  </section>` : w;
}
function ye(s) {
  return s ? d`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${s.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${s.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${s.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${s.before_values.map(T).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${s.after_values.map(T).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${s.error_percent_values.map((e) => `${T(e)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${s.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${s.gain_evidence ? d`<h4>Gain evidence · ${s.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${s.gain_evidence.phases?.map((e) => d`<tr><td>${e.phase}</td><td>${T(e.measured_voltage)}</td><td>${T(e.measured_current)}</td><td>${T(e.reference_voltage)}</td><td>${T(e.reference_current)}</td><td>${e.old_voltage_gain} → ${e.new_voltage_gain}</td><td>${e.old_current_gain} → ${e.new_current_gain}</td></tr>`) ?? w}
      </tbody></table><p>Saved in flash: ${s.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : d`<p>Gain evidence unavailable.</p>`}
  </section>` : w;
}
function Yt(s, e, t, i, n, r, o, a, c, g, f, u, l, p, h) {
  const b = s?.ct_count ?? e?.channels.length ?? 6, m = Math.floor((i - 1) / 6), S = Math.floor((i - 1) / 3) * 3 + 1, R = Array.from({ length: 3 }, (A, x) => S + x).filter((A) => A <= b), N = R.filter((A) => (n.get(A) ?? 0) > 0), B = e === null, O = r !== null && Number.isFinite(r) && r >= 1e-3 && r <= 1e3, re = N.length > 0 && (!B || O);
  return d`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Ke(re, o, a)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(b / 6) }, (A, x) => d`<button role="tab"
          id=${`current-board-tab-${x}`} aria-controls="current-board-panel"
          aria-selected=${x === m} tabindex=${x === m ? "0" : "-1"}
          @keydown=${(Z) => me(Z, x)}
          @click=${() => c(x * 6 + 1)}>${x === 0 ? "Main Board" : `Add-on ${x}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${m}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((A) => {
    const x = m * 6 + A * 3 + 1;
    return d`<button
          aria-pressed=${x === S} @click=${() => c(x)}>Group ${m * 2 + A + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${S}–CT${S + 2}</h2>
      ${We(t)}
      <div class="reference-block">
        ${R.map((A) => d`<label>CT${A} reference
          <input data-current-reference=${A} aria-label=${`CT${A} reference`} type="number" min="0.01" step="0.01"
            .value=${n.has(A) ? String(n.get(A)) : ""}
            @input=${(x) => {
    const Z = x.target;
    g(A, Z.value === "" ? null : Number(Z.value));
  }} /></label>`)}
      ${B ? d`<label>Reporting multiplier <input data-role="reporting-multiplier" type="number" min="0.001" max="1000" step="0.001" required .value=${r === null ? "" : String(r)} @input=${(A) => {
    const x = Number(A.target.value);
    f(Number.isFinite(x) && x >= 1e-3 && x <= 1e3 ? x : null);
  }} /></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
        <button class="primary" @click=${l} ?disabled=${!re || !o?.stable || (a?.iteration ?? 0) >= 3 || !!(a && !a.retry_allowed && a.iteration > 0)}>${a?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${u} ?disabled=${!re}>Check stability</button></div>
      ${o ? d`<div class=${o.stable ? "success-band" : "warning-band"} role="status">${o.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${$e(o)}
      ${ye(a)}
      ${a?.state.includes("indeterminate") ? d`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${p}>Reconnect and inspect</button><button class="danger" @click=${h}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
function Zt(s, e, t, i, n, r) {
  const o = s.includes("failed") || s.includes("indeterminate");
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, and entity bindings.</p>
      <div class="status-band" role="status">${s || "Ready for restart verification"}</div>
      ${e ? d`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${e.source_handoff_available ? e.config_filename : "Unavailable in runtime-only mode"}</dd></div></dl>` : ""}
      ${s === "cancelled" ? d`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${o ? d`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${t ? d`<button class="danger" data-action="rollback" @click=${n}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${r}>Back</button><button class="primary" @click=${i} ?disabled=${s === "cancelled" || !!e}>${s.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Xt(s) {
  return s ? s.preflight.issues.length ? d`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${s.preflight.issues.map((e) => d`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : d`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : d`<p>Starting a calibration session…</p>`;
}
function Qt(s, e, t, i, n, r) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${Xt(s)}
      ${s?.state === "cancelled" ? d`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
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
        <label class="check-row"><input type="checkbox" .checked=${e} @change=${(o) => t(o.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${n}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" @click=${i} ?disabled=${s?.state === "cancelled" || !e || !!s?.preflight.issues.length}>Continue</button>
      </footer>
    </section>
  `;
}
const je = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], ei = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function ti(s, e, t, i, n, r) {
  return d`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (o, a) => d`
            <label class=${a === e ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(a)}
                .checked=${a === e} @change=${() => i(a)} />
              <span>${a}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${je.map(([o, a]) => d`
            <label class=${o === t ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${o}
                .checked=${o === t} @change=${() => n(o)} />
              <span>${a}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>IO0</dt><dd><strong>OPEN</strong> (not connected)</dd></div>
          <div><dt>Add-on boards</dt><dd>${e}</dd></div>
          <div><dt>Connection</dt><dd>${je.find(([o]) => o === t)?.[1]}</dd></div>
          ${ei.slice(0, e).map((o, a) => d`<div><dt>Add-on ${a + 1}</dt><dd>${o}</dd></div>`)}
        </dl>
      </section>
      <p class="info-band">Use Web Serial in a supported Chromium browser and a USB data cable to flash the firmware.</p>
      <section class="io-guidance" aria-labelledby="io-heading">
        <h2 id="io-heading">IO0 guidance</h2>
        <p>Keep IO0 OPEN (not connected) while flashing. Do not connect IO0 to GND.</p>
      </section>
      <p class="info-band">${t === "wifi" ? "The external installer collects Wi-Fi provisioning details; this helper does not." : "Connect Ethernet after flashing, then wait for the meter to appear on your network."}</p>
      <section aria-labelledby="installer-heading">
        <h2 id="installer-heading">Flash in external installer</h2>
        <p>Flashing happens in the external installer. This helper continues only after your device is on the network and discovered.</p>
        <button class="primary installer" @click=${() => window.open(
    "https://circuitsetup.github.io/ESPWebInstaller/",
    "_blank",
    "noopener,noreferrer"
  )}>Open CircuitSetup Web Installer</button>
      </section>
      ${s?.devices.length ? "" : d`
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
function Je(s, e, t, i, n, r = null) {
  return d`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${s?.evidence.map((o) => d`<li>${o.source}: ${o.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([o, a]) => d`<div data-target=${o}>${$e(a)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...n.entries()].map(([o, a]) => d`<div data-target=${o}>${ye(a)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${t?.evidence.join(", ") || "No build evidence."}</p><p>${t?.progress.join(", ") || "No transaction progress."}</p>
          ${t?.validation_detail ? d`<p>Validation code ${t.validation_detail.code ?? "unavailable"}; ${t.validation_detail.error_record_count} error records; ${t.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${t?.upload_progress?.length ? d`<ul>${t.upload_progress.map((o) => d`<li>${o.stage}: ${o.percentage ?? o.progress ?? "in progress"}${o.percentage != null || o.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Authority source</h3><p>${r?.source_authority.replaceAll("_", " ") ?? "Not yet established"}</p><p>${r ? `Verification ${r.verification_id}, generation ${r.connection_generation}` : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function ii(s, e, t, i, n, r, o, a) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${r ? d`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : d`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${s?.ct_count ?? "—"} CTs in ${s?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${o ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${r?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${r?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${Je(s, e, t, i, n, r)}
      <footer class="action-footer"><button class="secondary" @click=${a}>Back</button></footer>
    </section>
  `;
}
function Ye(s) {
  const e = s.addon_count, t = s.evidence.map((i) => i.source);
  return e < 0 || e > 6 || s.board_count !== e + 1 || s.ct_count !== 6 * (e + 1) || s.group_count !== 2 * (e + 1) || s.evidence.length < 1 || s.evidence.length > 5 || new Set(t).size !== t.length || !t.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || s.evidence.some((i) => i.addon_count !== e);
}
function ni(s, e, t, i, n = !1) {
  const r = n || Ye(s);
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="identity-strip">
        <strong>${s.project_name}</strong>
        <span>Version ${e ?? "unavailable"}</span>
        <span>${s.board_count} boards</span><span>${s.ct_count} CTs</span>
        <span>${s.group_count} groups</span><span>${s.connection_type}</span>
      </div>
      <h2>Topology evidence</h2>
      <table class="evidence-table">
        <thead><tr><th>Source</th><th>Add-ons</th><th>Evidence</th></tr></thead>
        <tbody>${s.evidence.map((o) => d`
          <tr><td>${o.source.replaceAll("_", " ")}</td><td>${o.addon_count}</td><td>${o.detail}</td></tr>
        `)}</tbody>
      </table>
      ${r ? d`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : d`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${t}>Back</button>
        ${r ? "" : d`<button class="primary" data-action="continue" @click=${i}>Continue</button>`}
      </footer>
    </section>
  `;
}
function si(s, e, t, i, n, r, o, a, c, g, f, u, l) {
  const p = s?.voltage_layout === "two_voltages" ? 2 : 1, h = i.slice(0, p).every((b) => Number.isFinite(b) && b > 0);
  return d`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Ke(h, n, r)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: s?.board_count ?? 1 }, (b, m) => d`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${m}`} aria-controls="voltage-board-panel"
          aria-selected=${m === t} tabindex=${m === t ? "0" : "-1"}
          @keydown=${(v) => me(v, m)}
          @click=${() => a(m)}>${m === 0 ? "Main Board" : `Add-on ${m}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${t}`}>
      <h2>${p === 1 ? "Calibrate shared voltage" : "Calibrate both board voltages"}</h2>
      ${We(e)}
      <div class="reference-block">
        ${Array.from({ length: p }, (b, m) => d`<label>${p === 1 ? "Trusted instrument reference" : `Voltage ${m + 1} trusted reference`}
          <input type="number" min="0.01" step="0.01" .value=${i[m] ? String(i[m]) : ""}
            @input=${(v) => c(m, Number(v.target.value))} /></label>`)}
        <button class="primary" @click=${f} ?disabled=${o || !h || !n?.stable || !!(r && !r.retry_allowed && r.iteration > 0)}>${r?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${g} ?disabled=${o}>${o ? "Loading live voltage data…" : "Check stability"}</button></div>
      ${n ? d`<div class=${n.stable ? "success-band" : "warning-band"} role="status">${n.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${$e(n)}
      ${ye(r)}
      ${r?.state === "indeterminate" ? d`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${u}>Reconnect and inspect</button><button class="danger" @click=${l}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const oi = Xe`
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
  .progress-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; margin: 20px 0; padding: 18px 18px 18px 42px; border: 1px solid var(--border); }
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
    .identity-strip, .confirmation-actions, .group-nav { align-items: stretch; flex-direction: column; }
    .evidence-table { display: block; overflow-x: auto; }
  }
`, j = [
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
class ri extends F {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.ctGroup = 0, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.sessionStarting = !1, this.voltageBusy = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = oi;
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
    const t = new ne(this.hass, this.panel.config.entry_id);
    this.api = t;
    try {
      const i = await t.setupStatus();
      if (!this.owns(e, t)) return;
      this.setup = i;
      const n = this.setup.installer_intent;
      n && (this.addonCount = n.addon_count, this.connection = n.connection_type), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.setup.devices[0]?.entry_id ?? null), await this.ownSubscription(t.subscribeSetup((r) => {
        this.owns(e, t) && (this.setup = r, !this.selectedDeviceId && r.devices.length && this.selectDevice(r.devices[0]?.entry_id ?? null), this.requestUpdate());
      }), e, t), this.transaction && await this.subscribeTransaction(e), this.session && this.session.state !== "cancelled" && await this.subscribeSession(e);
    } catch (i) {
      this.owns(e, t) && this.fail(i, "Setup status could not be loaded.");
    }
    this.requestUpdate();
  }
  owns(e, t) {
    return this.isConnected && e === this.connectionGeneration && t === this.api;
  }
  ownsOperation(e, t, i) {
    return e === this.operationGeneration && t === this.api && i === this.selectedDeviceId;
  }
  async ownSubscription(e, t, i, n = () => !0, r = () => {
  }) {
    const o = await e;
    if (!this.owns(t, i) || !n()) {
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
  resetCalibrationRun() {
    this.safetyAcknowledged = !1, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null;
  }
  selectDevice(e) {
    e !== this.selectedDeviceId && (++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = e, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.board = 0, this.ctGroup = 0, this.resetCalibrationRun());
  }
  showTopology(e) {
    this.topology = e, this.navigate("topology"), this.error = Ye(e) || e.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
  }
  showInventory(e) {
    this.inventory = e, this.drafts = new Map(e.channels.map((t) => {
      const i = t.selected_model_id ?? "", n = e.catalog.presets.find((r) => r.model_id === i);
      return [t.channel, {
        name: t.name,
        modelId: i,
        multiplier: t.reporting_multiplier,
        customGainCt: i === "custom" || t.selected_model_id === null ? t.raw_gain_ct : void 0,
        customLabel: t.display_label ?? void 0,
        burdenAcknowledged: t.selection_verified_against_config && (i === "custom" || n?.requires_burden_jumper_cut === !0),
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
    const e = j.findIndex(([t]) => t === this.step);
    e > 0 && this.navigate(j[e - 1][0]);
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
    if (!this.api) return;
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      if (await e.setInstallerIntent(this.addonCount, this.connection), !this.ownsOperation(i, e, t)) return;
      const n = await e.rescan();
      this.ownsOperation(i, e, t) && (this.setup = n, n.devices.length ? (this.selectDevice(n.devices[0]?.entry_id ?? null), this.navigate("discover"), this.announcement = "Compatible meter discovered.") : this.announcement = "No compatible meter found. Check the network and rescan.");
    }, "Rescan failed.", () => this.ownsOperation(i, e, t));
  }
  async adopt() {
    if (!this.api || !this.selectedDeviceId) return;
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      await e.adoptDevice(t), this.ownsOperation(i, e, t) && (this.announcement = "Meter adopted in Device Builder.");
    }, "Adoption is unavailable for this meter.", () => this.ownsOperation(i, e, t));
  }
  async loadTopology() {
    if (!this.api || !this.selectedDeviceId) return;
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      const n = await e.getTopology(t);
      this.ownsOperation(i, e, t) && this.showTopology("topology" in n ? n.topology : n);
    }, "Topology evidence could not be loaded.", () => this.ownsOperation(i, e, t));
  }
  async loadInventory() {
    if (!this.api || !this.selectedDeviceId) return;
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      const n = await e.getCtInventory(t);
      this.ownsOperation(i, e, t) && this.showInventory(n);
    }, "CT inventory could not be loaded.", () => this.ownsOperation(i, e, t));
  }
  async recoverCtInventory(e, t, i, n) {
    const r = await e.getCtInventory(t);
    this.ownsOperation(i, e, t) && (this.clearSubscription("transaction"), this.transaction = null, this.showInventory(r), this.drafts = new Map(Array.from(this.drafts, ([o, a]) => [o, n.get(o) ?? a])), this.announcement = "Live CT data reloaded. Review the preserved changes again.");
  }
  updateDraft(e, t) {
    const i = this.drafts.get(e);
    i && (this.drafts = new Map(this.drafts).set(e, { ...i, ...t }), this.requestUpdate());
  }
  selectCtGroup(e) {
    this.ctGroup = e, this.requestUpdate(), this.updateComplete.then(() => {
      this.shadowRoot?.querySelector(`[data-ct-group="${e}"] input`)?.focus();
    });
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    const e = Kt(this.inventory, this.drafts);
    if (!e.length) return this.fail(new Error(), "Select at least one CT change before review.");
    const t = this.api, i = this.selectedDeviceId, n = this.inventory, r = ++this.operationGeneration;
    if (this.clearSubscription("transaction"), this.transaction = null, this.labelOnly) {
      const o = e.filter((a) => a.name !== this.inventory.channels.find((c) => c.channel === a.channel)?.name).map(({ channel: a, name: c }) => ({ channel: a, name: c }));
      if (!o.length || e.some((a) => {
        const c = this.inventory.channels.find((g) => g.channel === a.channel);
        return !c || a.model_id !== (c.selected_model_id ?? "") || (a.reporting_multiplier ?? 1) !== c.reporting_multiplier;
      }))
        return this.fail(new Error(), "Home Assistant label mode only permits display-name edits.");
      await this.run(
        async () => {
          await t.setHaLabels(i, n.plan_id, n.source_sha256, o), this.announcement = "Home Assistant labels saved.";
        },
        "Home Assistant labels could not be saved.",
        () => this.ownsOperation(r, t, i)
      );
      return;
    }
    await this.run(
      async () => {
        let o;
        try {
          o = await t.previewCtConfig(
            i,
            n.plan_id,
            n.source_sha256,
            e
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
    const i = this.transactionSubscriptionScope, n = this.selectedDeviceId, r = this.transaction.transaction_id, o = this.transaction.source_sha256;
    await this.ownSubscription(
      t.subscribeConfigTransaction(
        n,
        r,
        o,
        (a) => {
          this.owns(e, t) && i === this.transactionSubscriptionScope && this.selectedDeviceId === n && this.transaction?.transaction_id === r && this.transaction.source_sha256 === o && a.transaction_id === r && a.source_sha256 === o && (this.transaction = a, this.requestUpdate());
        }
      ),
      e,
      t,
      () => i === this.transactionSubscriptionScope && this.selectedDeviceId === n && this.transaction?.transaction_id === r && this.transaction.source_sha256 === o,
      (a) => {
        this.transactionUnsub = a;
      }
    );
  }
  async transactionAction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const t = this.api, i = this.selectedDeviceId, n = this.transaction, r = ++this.operationGeneration;
    await this.run(
      async () => {
        const o = [i, n.transaction_id, n.source_sha256];
        let a;
        try {
          a = e === "apply" ? await t.applyCtConfig(...o) : e === "compile" ? await t.compileCtConfig(...o) : e === "install" ? await t.installCtConfig(...o) : await t.rollbackCtConfig(...o);
        } catch (c) {
          if (c.code !== "stale_confirmation") throw c;
          await this.recoverCtInventory(t, i, r, this.drafts);
          return;
        }
        !this.ownsOperation(r, t, i) || this.transaction?.transaction_id !== n.transaction_id || this.transaction.source_sha256 !== n.source_sha256 || (this.transaction = a, this.announcement = `Configuration ${this.transaction.state}.`);
      },
      "This confirmation is stale. Reload the CT inventory before making another change.",
      () => this.ownsOperation(r, t, i)
    );
  }
  async startSession() {
    if (!(!this.api || !this.selectedDeviceId || this.sessionStarting)) {
      this.sessionStarting = !0;
      try {
        const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
        this.clearSubscription("session"), this.session = null, this.resetCalibrationRun(), await this.run(async () => {
          const n = await e.startSession(t);
          !this.ownsOperation(i, e, t) || n.device_id !== t || (this.session = n, this.navigate("safety"), await this.subscribeSession(this.connectionGeneration));
        }, "Calibration session could not be started.", () => this.ownsOperation(i, e, t));
      } finally {
        this.sessionStarting = !1;
      }
    }
  }
  async subscribeSession(e) {
    if (!this.api || !this.session) return;
    const t = this.api;
    this.clearSubscription("session");
    const i = this.sessionSubscriptionScope, n = this.session.session_id, r = this.session.device_id;
    await this.ownSubscription(
      t.subscribeSession(n, (o) => {
        this.owns(e, t) && i === this.sessionSubscriptionScope && this.session?.session_id === n && this.session.device_id === r && o.session_id === n && o.device_id === r && (this.session = o, this.requestUpdate());
      }),
      e,
      t,
      () => i === this.sessionSubscriptionScope && this.session?.session_id === n && this.session.device_id === r,
      (o) => {
        this.sessionUnsub = o;
      }
    );
  }
  async acknowledgeSafety() {
    if (!this.api || !this.session) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, n = ++this.operationGeneration;
    await this.run(async () => {
      const r = await e.acknowledgeSafety(i);
      !this.ownsOperation(n, e, t) || r.session_id !== i || (this.session = r, this.navigate("voltage"));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(n, e, t));
  }
  async checkStability(e) {
    if (!this.api || !this.session || e === "voltage" && this.voltageBusy) return;
    const t = this.api, i = this.selectedDeviceId, n = this.session.session_id, r = ++this.operationGeneration, o = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((a) => String(a.channel));
    if (o.length) {
      e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
      try {
        await this.run(async () => {
          for (const [a, c] of o.entries()) {
            const g = await t.checkStability(n, e, c);
            if (!this.ownsOperation(r, t, i) || this.session?.session_id !== n) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${c}`, g), e === "voltage" && (this.announcement = `Loaded voltage data from chip ${a + 1} of ${o.length}.`, this.requestUpdate());
          }
        }, "Stable samples could not be collected.", () => this.ownsOperation(r, t, i));
      } finally {
        e === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
      }
    }
  }
  async calibrate(e) {
    if (!this.api || !this.session || e === "voltage" && this.voltageBusy) return;
    const t = this.api, i = this.selectedDeviceId, n = this.session.session_id, r = ++this.operationGeneration, o = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((c) => String(c.channel)), a = this.currentReferenceEntries();
    if (e === "current" && !a.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      return;
    }
    e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
    try {
      await this.run(
        async () => {
          for (const [c, g] of o.entries()) {
            const f = e === "voltage" ? await t.calibrateVoltage(
              n,
              g,
              this.voltageReferences[this.topology?.voltage_layout === "two_voltages" ? c : 0],
              !0
            ) : await t.calibrateCurrent(n, a, !0);
            if (!this.ownsOperation(r, t, i) || this.session?.session_id !== n) return;
            const u = new Map(this.calibrationByTarget);
            if (e === "current" ? a.forEach((l) => u.set(`current:${l.channel}`, f)) : u.set(`${e}:${g}`, f), this.calibrationByTarget = u, this.announcement = e === "voltage" ? `Calibrated voltage chip ${c + 1} of ${o.length}.` : `Calibration iteration ${f.iteration} finished with state ${f.state}.`, this.requestUpdate(), e === "current") break;
          }
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
  voltageGroupKeys() {
    return this.topology ? [this.groupKey(this.board * 2), this.groupKey(this.board * 2 + 1)] : [this.groupKey(this.group)];
  }
  currentReferenceEntries() {
    const e = Math.floor((this.channel - 1) / 3) * 3 + 1;
    return Array.from({ length: 3 }, (t, i) => e + i).flatMap((t) => {
      const i = this.currentReferences.get(t), n = this.inventory?.channels[t - 1]?.reporting_multiplier ?? this.reportingMultiplier;
      return i && i > 0 && n !== null ? [{ channel: t, reference: i, reporting_multiplier: n }] : [];
    });
  }
  async restart() {
    if (!this.api || !this.session || !this.topology) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, n = this.topology, r = ++this.operationGeneration;
    await this.run(
      async () => {
        let o;
        try {
          o = await e.restartAndVerify(i, n);
        } catch (a) {
          throw this.ownsOperation(r, e, t) && this.session?.session_id === i && this.topology === n && (this.restartResult = null, this.session = { ...this.session, state: "restart_failed" }), a;
        }
        !this.ownsOperation(r, e, t) || this.session?.session_id !== i || this.topology !== n || (this.restartResult = o, this.session = { ...this.session, state: "verified" }, this.navigate("summary"));
      },
      "Restart verification failed; review recovery evidence before rollback.",
      () => this.ownsOperation(r, e, t)
    );
  }
  async cancelSession() {
    if (!this.api || !this.session) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, n = ++this.operationGeneration;
    await this.run(async () => {
      const r = await e.cancelSession(i);
      !this.ownsOperation(n, e, t) || this.session?.session_id !== i || (this.clearSubscription("session"), this.session = r, this.restartResult = null, this.navigate("safety"), this.announcement = "Calibration session cancelled; cleanup completed without restart verification.");
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(n, e, t));
  }
  async reconnectSession() {
    if (!this.api || !this.session) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, n = ++this.operationGeneration;
    await this.run(
      async () => {
        const r = await e.getSession(i);
        !this.ownsOperation(n, e, t) || this.session?.session_id !== i || (this.session = r, this.announcement = `Session reconnected with state ${this.session.state}.`);
      },
      "Session reconnection failed. Retry only after checking the meter connection.",
      () => this.ownsOperation(n, e, t)
    );
  }
  resultFor(e) {
    const t = this.currentReferenceEntries().map((r) => String(r.channel)), i = Math.floor((this.channel - 1) / 3) * 3 + 1, n = e === "voltage" ? this.voltageGroupKeys() : t.length ? t : Array.from({ length: 3 }, (r, o) => String(i + o));
    for (const r of [...n].reverse()) {
      const o = this.calibrationByTarget.get(`${e}:${r}`);
      if (o) return o;
    }
    return null;
  }
  stabilityFor(e) {
    const t = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((n) => String(n.channel)), i = t.flatMap((n) => {
      const r = this.stabilityByTarget.get(`${e}:${n}`);
      return r ? [r] : [];
    });
    return i.length ? {
      target: e,
      target_id: e === "voltage" ? `Board ${this.board + 1}` : `Current group ${Math.floor((this.channel - 1) / 3) + 1}`,
      stable: i.length === t.length && i.every((n) => n.stable),
      windows: i.flatMap((n) => n.windows)
    } : null;
  }
  async run(e, t, i = () => !0) {
    this.error = "";
    try {
      await e();
    } catch (n) {
      if (!i()) return;
      const r = n.code;
      this.fail(n, r === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : t);
    }
    i() && this.requestUpdate();
  }
  fail(e, t) {
    this.error = t, this.announcement = t, this.requestUpdate();
  }
  stepBody() {
    return this.step === "setup" ? ti(
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
      }
    ) : this.step === "discover" ? Ht(
      this.setup?.devices ?? [],
      this.selectedDeviceId,
      (e) => {
        this.selectDevice(e), this.requestUpdate();
      },
      () => {
        this.adopt();
      },
      () => this.back(),
      () => {
        this.loadTopology();
      }
    ) : this.step === "topology" && this.topology ? ni(
      this.topology,
      this.selectedProjectVersion(),
      () => this.back(),
      () => {
        this.setup?.configuration_authoritative === !1 ? this.startSession() : this.loadInventory();
      },
      !!this.error
    ) : this.step === "ct" && this.inventory ? d`<fieldset><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
      this.labelOnly = !1, this.requestUpdate();
    }}> ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
      this.labelOnly = !0, this.requestUpdate();
    }}> Home Assistant labels only</label></fieldset>${Ft(
      this.inventory,
      this.board,
      this.ctGroup,
      this.drafts,
      (e) => {
        this.board = e, this.ctGroup = 0, this.requestUpdate();
      },
      (e) => this.selectCtGroup(e),
      (e, t) => this.updateDraft(e, t),
      () => this.back(),
      () => {
        this.reviewChanges();
      },
      this.labelOnly
    )}` : this.step === "build" ? Lt(
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
    ) : this.step === "safety" ? Qt(
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
      () => this.back()
    ) : this.step === "voltage" ? d`${si(
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
      (e, t) => {
        this.voltageReferences = this.voltageReferences.map((i, n) => n === e ? t : i), this.requestUpdate();
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" ?disabled=${this.voltageBusy} @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? d`${Yt(
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("restart")}>Continue</button></footer>` : this.step === "restart" ? Zt(
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
    ) : ii(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.selectedProjectVersion(), () => this.back());
  }
  render() {
    const e = j.findIndex(([t]) => t === this.step);
    return d`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${j.map(([t, i], n) => d`
            <li class=${n === e ? "current" : ""}>
              <button class="step-button" aria-current=${n === e ? "step" : w} ?disabled=${n > e}
                @click=${() => n <= e && this.navigate(t)}><span class="number">${n + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${e + 1} of 10 — ${j[e]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${j[e]?.[1]}</h1>
          ${this.error ? d`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : w}
          ${this.stepBody()}
          ${e >= 4 && this.step !== "summary" ? Je(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult) : w}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", ri);
export {
  ri as CircuitSetupPanel
};
