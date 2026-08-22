const J = globalThis, re = J.ShadowRoot && (J.ShadyCSS === void 0 || J.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ae = /* @__PURE__ */ Symbol(), _e = /* @__PURE__ */ new WeakMap();
let Ue = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== ae) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (re && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = _e.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && _e.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Ve = (n) => new Ue(typeof n == "string" ? n : n + "", void 0, ae), Le = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, s, o) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[o + 1], n[0]);
  return new Ue(t, n, ae);
}, Fe = (n, e) => {
  if (re) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = J.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, n.appendChild(i);
  }
}, ve = re ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return Ve(t);
})(n) : n;
const { is: We, defineProperty: Ke, getOwnPropertyDescriptor: Je, getOwnPropertyNames: Ze, getOwnPropertySymbols: Ye, getPrototypeOf: Xe } = Object, ee = globalThis, me = ee.trustedTypes, Qe = me ? me.emptyScript : "", et = ee.reactiveElementPolyfillSupport, G = (n, e) => n, ne = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? Qe : null;
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
} }, Pe = (n, e) => !We(n, e), be = { attribute: !0, type: String, converter: ne, reflect: !1, useDefault: !1, hasChanged: Pe };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), ee.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let D = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = be) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && Ke(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: o } = Je(this.prototype, e) ?? { get() {
      return this[t];
    }, set(r) {
      this[t] = r;
    } };
    return { get: s, set(r) {
      const a = s?.call(this);
      o?.call(this, r), this.requestUpdate(e, a, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? be;
  }
  static _$Ei() {
    if (this.hasOwnProperty(G("elementProperties"))) return;
    const e = Xe(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(G("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(G("properties"))) {
      const t = this.properties, i = [...Ze(t), ...Ye(t)];
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
      for (const s of i) t.unshift(ve(s));
    } else e !== void 0 && t.push(ve(e));
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
    return Fe(e, this.constructor.elementStyles), e;
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
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : ne).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const o = i.getPropertyOptions(s), r = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : ne;
      this._$Em = s;
      const a = r.fromAttribute(t, o.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, o) {
    if (e !== void 0) {
      const r = this.constructor;
      if (s === !1 && (o = this[e]), i ??= r.getPropertyOptions(e), !((i.hasChanged ?? Pe)(o, t) || i.useDefault && i.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(r._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: o }, r) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, r ?? t ?? this[e]), o !== !0 || r !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [s, o] of this._$Ep) this[s] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [s, o] of i) {
        const { wrapped: r } = o, a = this[s];
        r !== !0 || this._$AL.has(s) || a === void 0 || this.C(s, void 0, o, a);
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
D.elementStyles = [], D.shadowRootOptions = { mode: "open" }, D[G("elementProperties")] = /* @__PURE__ */ new Map(), D[G("finalized")] = /* @__PURE__ */ new Map(), et?.({ ReactiveElement: D }), (ee.reactiveElementVersions ??= []).push("2.1.2");
const ce = globalThis, $e = (n) => n, Y = ce.trustedTypes, ye = Y ? Y.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Me = "$lit$", T = `lit$${Math.random().toFixed(9).slice(2)}$`, De = "?" + T, tt = `<${De}>`, U = document, V = () => U.createComment(""), L = (n) => n === null || typeof n != "object" && typeof n != "function", de = Array.isArray, it = (n) => de(n) || typeof n?.[Symbol.iterator] == "function", ie = `[\x20\t
\f\r]`, q = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, we = /-->/g, Se = />/g, O = RegExp(`>|${ie}(?:([^\\s"'>=/]+)(${ie}*=${ie}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), xe = /'/g, Ce = /"/g, je = /^(?:script|style|textarea|title)$/i, st = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), d = st(1), j = /* @__PURE__ */ Symbol.for("lit-noChange"), y = /* @__PURE__ */ Symbol.for("lit-nothing"), Ae = /* @__PURE__ */ new WeakMap(), N = U.createTreeWalker(U, 129);
function Be(n, e) {
  if (!de(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ye !== void 0 ? ye.createHTML(e) : e;
}
const nt = (n, e) => {
  const t = n.length - 1, i = [];
  let s, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = q;
  for (let a = 0; a < t; a++) {
    const c = n[a];
    let u, f, p = -1, l = 0;
    for (; l < c.length && (r.lastIndex = l, f = r.exec(c), f !== null); ) l = r.lastIndex, r === q ? f[1] === "!--" ? r = we : f[1] !== void 0 ? r = Se : f[2] !== void 0 ? (je.test(f[2]) && (s = RegExp("</" + f[2], "g")), r = O) : f[3] !== void 0 && (r = O) : r === O ? f[0] === ">" ? (r = s ?? q, p = -1) : f[1] === void 0 ? p = -2 : (p = r.lastIndex - f[2].length, u = f[1], r = f[3] === void 0 ? O : f[3] === '"' ? Ce : xe) : r === Ce || r === xe ? r = O : r === we || r === Se ? r = q : (r = O, s = void 0);
    const h = r === O && n[a + 1].startsWith("/>") ? " " : "";
    o += r === q ? c + tt : p >= 0 ? (i.push(u), c.slice(0, p) + Me + c.slice(p) + T + h) : c + T + (p === -2 ? a : h);
  }
  return [Be(n, o + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class F {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let o = 0, r = 0;
    const a = e.length - 1, c = this.parts, [u, f] = nt(e, t);
    if (this.el = F.createElement(u, i), N.currentNode = this.el.content, t === 2 || t === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (s = N.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const p of s.getAttributeNames()) if (p.endsWith(Me)) {
          const l = f[r++], h = s.getAttribute(p).split(T), g = /([.?@])?(.*)/.exec(l);
          c.push({ type: 1, index: o, name: g[2], strings: h, ctor: g[1] === "." ? rt : g[1] === "?" ? at : g[1] === "@" ? ct : te }), s.removeAttribute(p);
        } else p.startsWith(T) && (c.push({ type: 6, index: o }), s.removeAttribute(p));
        if (je.test(s.tagName)) {
          const p = s.textContent.split(T), l = p.length - 1;
          if (l > 0) {
            s.textContent = Y ? Y.emptyScript : "";
            for (let h = 0; h < l; h++) s.append(p[h], V()), N.nextNode(), c.push({ type: 2, index: ++o });
            s.append(p[l], V());
          }
        }
      } else if (s.nodeType === 8) if (s.data === De) c.push({ type: 2, index: o });
      else {
        let p = -1;
        for (; (p = s.data.indexOf(T, p + 1)) !== -1; ) c.push({ type: 7, index: o }), p += T.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const i = U.createElement("template");
    return i.innerHTML = e, i;
  }
}
function B(n, e, t = n, i) {
  if (e === j) return e;
  let s = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const o = L(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== o && (s?._$AO?.(!1), o === void 0 ? s = void 0 : (s = new o(n), s._$AT(n, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = s : t._$Cl = s), s !== void 0 && (e = B(n, s._$AS(n, e.values), s, i)), e;
}
class ot {
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
    const { el: { content: t }, parts: i } = this._$AD, s = (e?.creationScope ?? U).importNode(t, !0);
    N.currentNode = s;
    let o = N.nextNode(), r = 0, a = 0, c = i[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let u;
        c.type === 2 ? u = new W(o, o.nextSibling, this, e) : c.type === 1 ? u = new c.ctor(o, c.name, c.strings, this, e) : c.type === 6 && (u = new dt(o, this, e)), this._$AV.push(u), c = i[++a];
      }
      r !== c?.index && (o = N.nextNode(), r++);
    }
    return N.currentNode = U, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class W {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = y, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    e = B(this, e, t), L(e) ? e === y || e == null || e === "" ? (this._$AH !== y && this._$AR(), this._$AH = y) : e !== this._$AH && e !== j && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : it(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== y && L(this._$AH) ? this._$AA.nextSibling.data = e : this.T(U.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = F.createElement(Be(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const o = new ot(s, this), r = o.u(this.options);
      o.p(t), this.T(r), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Ae.get(e.strings);
    return t === void 0 && Ae.set(e.strings, t = new F(e)), t;
  }
  k(e) {
    de(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const o of e) s === t.length ? t.push(i = new W(this.O(V()), this.O(V()), this, this.options)) : i = t[s], i._$AI(o), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = $e(e).nextSibling;
      $e(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class te {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, o) {
    this.type = 1, this._$AH = y, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = y;
  }
  _$AI(e, t = this, i, s) {
    const o = this.strings;
    let r = !1;
    if (o === void 0) e = B(this, e, t, 0), r = !L(e) || e !== this._$AH && e !== j, r && (this._$AH = e);
    else {
      const a = e;
      let c, u;
      for (e = o[0], c = 0; c < o.length - 1; c++) u = B(this, a[i + c], t, c), u === j && (u = this._$AH[c]), r ||= !L(u) || u !== this._$AH[c], u === y ? e = y : e !== y && (e += (u ?? "") + o[c + 1]), this._$AH[c] = u;
    }
    r && !s && this.j(e);
  }
  j(e) {
    e === y ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class rt extends te {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === y ? void 0 : e;
  }
}
class at extends te {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== y);
  }
}
class ct extends te {
  constructor(e, t, i, s, o) {
    super(e, t, i, s, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = B(this, e, t, 0) ?? y) === j) return;
    const i = this._$AH, s = e === y && i !== y || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, o = e !== y && (i === y || s);
    s && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class dt {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    B(this, e);
  }
}
const lt = ce.litHtmlPolyfillSupport;
lt?.(F, W), (ce.litHtmlVersions ??= []).push("3.3.3");
const ht = (n, e, t) => {
  const i = t?.renderBefore ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const o = t?.renderBefore ?? null;
    i._$litPart$ = s = new W(e.insertBefore(V(), o), o, void 0, t ?? {});
  }
  return s._$AI(n), s;
};
const le = globalThis;
class z extends D {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = ht(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return j;
  }
}
z._$litElement$ = !0, z.finalized = !0, le.litElementHydrateSupport?.({ LitElement: z });
const pt = le.litElementPolyfillSupport;
pt?.({ LitElement: z });
(le.litElementVersions ??= []).push("4.2.2");
const ke = "circuitsetup_energy_meter_helper/", ut = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, gt = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, ft = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, _t = /[\u0000-\u001f\u007f-\u009f]/, vt = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), mt = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), bt = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "indeterminate", "verified", "cancelled"]), he = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), Ee = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), X = /* @__PURE__ */ new Set(["A", "B", "C"]), $t = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), yt = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), wt = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), St = /* @__PURE__ */ new Set(["invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), xt = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), Ct = /^(?:ct(?:[1-9]|[1-3][0-9]|4[0-2])_name|current_cal_ct(?:[1-9]|[1-3][0-9]|4[0-2])|voltage_cal[12])$/, At = /^[0-9a-f]{12}$/, kt = /^[0-9a-f]{64}$/, Ie = /^[0-9a-f]{32}$/, Et = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, Te = /* @__PURE__ */ new Set(["preview_ct_config", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]);
function $(n, e) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function w(n, e, t = 100) {
  if (!Array.isArray(n) || n.length > t) throw new Error(`${e} response is invalid`);
  return n;
}
function _(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${e} response is invalid`);
  return n;
}
function E(n, e) {
  if (typeof n != "number" || !Number.isFinite(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function m(n, e) {
  const t = E(n, e);
  if (!Number.isInteger(t)) throw new Error(`${e} response is invalid`);
  return t;
}
function I(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "boolean") throw new Error(`${e} response is invalid`);
  return n;
}
function x(n, e, t) {
  const i = _(n, t);
  if (!e.has(i)) throw new Error(`${t} response is invalid`);
  return i;
}
function oe(n, e) {
  n !== void 0 && _(n, e, !0);
}
function Z(n, e) {
  return Math.abs(n - e) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(e));
}
function qe(n, e) {
  const t = $(n, e);
  _(t.entry_id, e), _(t.title, e), _(t.project_name, e), _(t.project_version, e, !0), I(t.importable, e, !0), _(t.configuration, e, !0);
}
function K(n, e) {
  const t = $(n, e);
  if (x(t.state, vt, e), w(t.devices, e).forEach((i) => qe(i, e)), t.configuration_authoritative !== void 0 && I(t.configuration_authoritative, e), t.installer_intent !== void 0) {
    const i = $(t.installer_intent, e), s = m(i.addon_count, e);
    if (s < 0 || s > 6) throw new Error(`${e} response is invalid`);
    if (x(i.connection_type, he, e) === "unknown") throw new Error(`${e} response is invalid`);
  }
  return n;
}
function Re(n, e) {
  const t = $(n, e), i = m(t.addon_count, e), s = m(t.board_count, e), o = m(t.ct_count, e), r = m(t.group_count, e);
  if (i < 0 || i > 6 || s < 1 || s > 7 || o < 6 || o > 42 || r < 2 || r > 14 || s !== i + 1 || o !== 6 * s || r !== 2 * s) throw new Error(`${e} response is invalid`);
  x(t.connection_type, he, e), _(t.voltage_layout, e), _(t.project_name, e);
  const a = w(t.evidence, e);
  if (a.length < 1 || a.length > Ee.size) throw new Error(`${e} response is invalid`);
  const c = a.map((u) => {
    const f = $(u, e), p = x(f.source, Ee, e), l = m(f.addon_count, e);
    if (l < 0 || l > 6) throw new Error(`${e} response is invalid`);
    return _(f.detail, e), p;
  });
  if (new Set(c).size !== c.length || !c.some((u) => xt.has(u))) throw new Error(`${e} response is invalid`);
  return n;
}
function It(n, e) {
  const t = $(n, e);
  return "topology" in t ? (Re(t.topology, e), t.configuration_authoritative !== void 0 && I(t.configuration_authoritative, e), n) : Re(n, e);
}
function Tt(n, e) {
  const t = $(n, e);
  _(t.plan_id, e), _(t.source_sha256, e);
  const i = w(t.channels, e);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${e} response is invalid`);
  i.forEach((r, a) => {
    const c = $(r, e), u = m(c.channel, e);
    _(c.name, e), m(c.raw_gain_ct, e), E(c.reporting_multiplier, e), oe(c.selected_model_id, e), I(c.selection_verified_against_config, e), oe(c.display_label, e);
    const f = $(c.address, e), p = m(f.channel, e), l = m(f.board_index, e), h = m(f.group_index, e), g = x(f.phase, X, e), b = a + 1;
    if (u !== b || p !== b || l !== Math.floor(a / 6) || h !== Math.floor(a % 6 / 3) + 1 || g !== ["A", "B", "C"][a % 3]) throw new Error(`${e} response is invalid`);
  });
  const s = $(t.catalog, e);
  _(s.source_repository, e), _(s.source_ref, e), m(s.schema_version, e);
  const o = w(s.presets, e);
  if (o.length > 64) throw new Error(`${e} response is invalid`);
  return o.forEach((r) => {
    const a = $(r, e);
    _(a.model_id, e), _(a.label, e), E(a.rated_current_a, e), _(a.secondary, e), a.default_gain_ct !== null && m(a.default_gain_ct, e), I(a.requires_burden_jumper_cut, e), _(a.notes, e);
  }), n;
}
function se(n, e) {
  const t = $(n, e);
  if (_(t.transaction_id, e), x(t.state, mt, e), _(t.source_sha256, e), I(t.rollback_available, e), _(t.redacted_diff, e), w(t.changes, e).forEach((i) => {
    const s = $(i, e), o = _(s.key, e);
    if (!Ct.test(o)) throw new Error(`${e} response is invalid`);
    s.old_value !== null && _(s.old_value, e), _(s.new_value, e);
  }), w(t.evidence, e).forEach((i) => x(i, yt, e)), w(t.progress, e).forEach((i) => x(i, wt, e)), t.validation_detail != null) {
    const i = $(t.validation_detail, e);
    for (const s of ["reported_error_count", "reported_warning_count"]) i[s] !== null && m(i[s], e);
    i.code !== null && m(i.code, e), m(i.error_record_count, e), m(i.warning_record_count, e);
  }
  return t.upload_progress !== void 0 && w(t.upload_progress, e).forEach((i) => {
    const s = $(i, e);
    if (x(s.stage, $t, e), s.progress !== null && s.percentage !== null && s.progress !== void 0 && s.percentage !== void 0) throw new Error(`${e} response is invalid`);
    const o = s.progress ?? s.percentage;
    if (o != null) {
      const r = m(o, e);
      if (r < 0 || r > 100) throw new Error(`${e} response is invalid`);
    }
  }), n;
}
function H(n, e) {
  const t = $(n, e);
  _(t.session_id, e), _(t.device_id, e), x(t.state, bt, e), I(t.safety_acknowledged, e);
  const i = $(t.preflight, e);
  return w(i.issues, e).forEach((s) => {
    const o = $(s, e);
    x(o.code, St, e), _(o.role, e), _(o.detail, e);
  }), w(i.zeroed_roles, e).forEach((s) => _(s, e)), n;
}
function Rt(n, e, t, i) {
  const s = $(n, e), o = x(s.target, /* @__PURE__ */ new Set(["voltage", "current"]), e);
  _(s.target_id, e);
  const r = I(s.stable, e);
  if (o !== t || s.target_id !== i) throw new Error(`${e} response is invalid`);
  const a = w(s.windows, e, o === "voltage" ? 3 : 1);
  if (a.length !== (o === "voltage" ? 3 : 1)) throw new Error(`${e} response is invalid`);
  const c = a.map((u) => {
    const f = $(u, e), p = w(f.samples, e, 3).map((k) => E(k, e));
    if (p.length !== 3) throw new Error(`${e} response is invalid`);
    const l = E(f.mean, e), h = E(f.standard_deviation, e), g = E(f.range_percent, e), b = p.reduce((k, A) => k + A, 0) / p.length, C = Math.sqrt(p.reduce((k, A) => k + (A - b) ** 2, 0) / p.length), v = 100 * (Math.max(...p) - Math.min(...p)) / Math.abs(b);
    if (!Z(l, b) || !Z(h, C) || !Z(g, v)) throw new Error(`${e} response is invalid`);
    return g;
  });
  if (r !== c.every((u) => u <= 1)) throw new Error(`${e} response is invalid`);
  return n;
}
function Oe(n, e, t) {
  const i = $(n, e), s = x(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e);
  _(i.group_key, e), i.phase !== null && x(i.phase, X, e);
  const o = m(i.iteration, e), r = w(i.changed_channels, e, 3).map((g) => m(g, e)), a = w(i.before_values, e, 3), c = w(i.after_values, e, 3), u = w(i.error_percent_values, e, 3);
  for (const g of [a, c, u]) g.forEach((b) => E(b, e));
  const f = t.target === "voltage" ? t.groupKey : He(t.channel), p = t.target === "voltage" ? Nt(t.groupKey) : [t.channel], l = t.target === "current" ? ["A", "B", "C"][(t.channel - 1) % 3] : null, h = I(i.retry_allowed, e);
  if (!Number.isFinite(t.reference) || t.reference <= 0 || t.target === "current" && (!Number.isFinite(t.rawReference) || t.rawReference <= 0) || ![1, 3].includes(r.length) || a.length !== r.length || new Set(r).size !== r.length || r.some((g) => g < 1 || g > 42) || o < 1 || o > 3 || i.group_key !== f || i.phase !== l || r.length !== p.length || r.some((g, b) => g !== p[b]) || (s === "indeterminate" ? c.length !== 0 || u.length !== 0 : c.length !== r.length || u.length !== r.length)) throw new Error(`${e} response is invalid`);
  if (s === "indeterminate") {
    if (i.gain_evidence !== null || h) throw new Error(`${e} response is invalid`);
    i.restore_evidence != null && $(i.restore_evidence, e);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${e} response is invalid`);
    Ot(i.gain_evidence, e, t);
    const g = c.map((C) => 100 * Math.abs(E(C, e) - t.reference) / t.reference);
    if (u.some((C, v) => E(C, e) < 0 || !Z(E(C, e), g[v]))) throw new Error(`${e} response is invalid`);
    const b = Math.max(...g) > 1;
    if (s === "result_outside_tolerance" !== b || h !== (b && o < 3)) throw new Error(`${e} response is invalid`);
  }
  return n;
}
function He(n) {
  const e = Math.floor((n - 1) / 6), t = Math.floor((n - 1) % 6 / 3) + 1;
  return e === 0 ? `main_${t}` : `addon${e}_${t}`;
}
function Ot(n, e, t) {
  const i = $(n, e), s = m(i.connection_generation, e), o = m(i.operation_sequence, e), r = t.target === "voltage" ? t.groupKey : He(t.channel), a = r.startsWith("main_") ? `meter_main${r.slice(-1)}` : r;
  if (s < 1 || o < 1 || _(i.instance_id, e) !== a) throw new Error(`${e} response is invalid`);
  const c = t.target === "current" ? ["A", "B", "C"][(t.channel - 1) % 3] : null, u = w(i.phases, e, 3);
  if (u.length !== 3) throw new Error(`${e} response is invalid`);
  u.forEach((l, h) => {
    const g = $(l, e), b = x(g.phase, X, e);
    if (b !== ["A", "B", "C"][h]) throw new Error(`${e} response is invalid`);
    E(g.measured_voltage, e), E(g.measured_current, e);
    const C = E(g.reference_voltage, e), v = E(g.reference_current, e), k = m(g.old_voltage_gain, e), A = m(g.new_voltage_gain, e), S = m(g.old_current_gain, e), R = m(g.new_current_gain, e);
    if ([k, A, S, R].some((P) => P < 1 || P > 65535)) throw new Error(`${e} response is invalid`);
    if (t.target === "voltage") {
      if (Math.abs(C - t.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(C), t.reference)) || Math.abs(v) > 1e-6 || S !== R) throw new Error(`${e} response is invalid`);
    } else if (Math.abs(C) > 1e-6 || (b === c ? Math.abs(v - t.rawReference) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(v), t.rawReference)) : Math.abs(v) > 1e-6) || k !== A || b !== c && S !== R) throw new Error(`${e} response is invalid`);
  });
  const f = w(i.register_mismatch_phases, e, 3);
  f.forEach((l) => x(l, X, e));
  const p = w(i.matching_lines, e, 100);
  if (p.length === 0 || p.some((l) => typeof l != "string") || I(i.flash_saved, e) !== !0 || f.length !== 0 || I(i.calibration_disabled, e) !== !1) throw new Error(`${e} response is invalid`);
}
function Nt(n) {
  const e = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(n);
  if (!e) return [];
  const t = e[2] === void 0 ? 0 : Number(e[2]), i = Number(e[1] ?? e[3]), s = t * 6 + (i - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}
function Ut(n, e, t) {
  const i = $(n, e);
  for (const f of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) _(i[f], e);
  const s = m(i.topology_addon_count, e);
  x(i.topology_connection_type, he, e);
  const o = m(i.connection_generation, e);
  x(i.source_authority, /* @__PURE__ */ new Set(["saved_flash"]), e);
  const r = I(i.source_handoff_available, e);
  if (oe(i.source_handoff_transaction_id, e), r) {
    if (_(i.config_filename, e), _(i.config_sha256, e), !Et.test(i.config_filename) || !kt.test(i.config_sha256)) throw new Error(`${e} response is invalid`);
  } else if (i.config_filename !== null || i.config_sha256 !== null) throw new Error(`${e} response is invalid`);
  if (!At.test(i.mac) || !Ie.test(i.verification_id) || o < 1 || i.source_handoff_transaction_id !== null && !Ie.test(i.source_handoff_transaction_id) || s !== t.addon_count || i.topology_project_name !== t.project_name || i.topology_connection_type !== t.connection_type || i.topology_voltage_layout !== t.voltage_layout) throw new Error(`${e} response is invalid`);
  const a = w(i.groups, e, 14), c = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: s }, (f, p) => [`addon${p + 1}_1`, `addon${p + 1}_2`]).flat()]), u = /* @__PURE__ */ new Set();
  if (a.length < 1) throw new Error(`${e} response is invalid`);
  return a.forEach((f) => {
    const p = $(f, e), l = _(p.instance_id, e);
    if (!c.has(l) || u.has(l)) throw new Error(`${e} response is invalid`);
    u.add(l);
    const h = w(p.phase_gains, e, 3);
    if (h.length !== 3) throw new Error(`${e} response is invalid`);
    h.forEach((g) => {
      const b = w(g, e, 2);
      if (b.length !== 2) throw new Error(`${e} response is invalid`);
      b.forEach((C) => {
        const v = m(C, e);
        if (v < 1 || v > 65535) throw new Error(`${e} response is invalid`);
      });
    });
  }), n;
}
class Q {
  constructor(e, t) {
    this.hass = e, this.entryId = t, this.setupStatus = () => this.call("setup_status", (i) => K(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (w(i, "list_meters").forEach((s) => qe(s, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (s) => It(s, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (s) => Tt(s, "get_ct_inventory"), { device_id: i }), this.getSession = (i) => this.call("get_session", (s) => H(s, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => $(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, s) => this.call("set_installer_intent", (o) => K(o, "set_installer_intent"), { addon_count: i, connection_type: s }), this.rescan = () => this.call("rescan", (i) => K(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (s) => {
      const o = $(s, "adopt_device");
      return _(o.device_id, "adopt_device"), _(o.configuration, "adopt_device"), s;
    }, { device_id: i }), this.previewCtConfig = (i, s, o, r) => this.call("preview_ct_config", (a) => se(a, "preview_ct_config"), {
      device_id: i,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.setHaLabels = (i, s, o, r) => this.call("set_ha_labels", (a) => a, {
      device_id: i,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.transaction = (i, s, o, r) => this.call(i, (a) => se(a, i), {
      device_id: s,
      transaction_id: o,
      source_sha256: r
    }), this.applyCtConfig = (i, s, o) => this.transaction("apply_ct_config", i, s, o), this.compileCtConfig = (i, s, o) => this.transaction("compile_ct_config", i, s, o), this.installCtConfig = (i, s, o) => this.transaction("install_ct_config", i, s, o), this.rollbackCtConfig = (i, s, o) => this.transaction("rollback_ct_config", i, s, o), this.startSession = (i) => this.call("start_session", (s) => H(s, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (s) => H(s, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, o) => this.call("check_stability", (r) => Rt(r, "check_stability", s, o), { session_id: i, target: s, target_id: o }), this.calibrateVoltage = (i, s, o, r) => this.call("calibrate_voltage", (a) => Oe(a, "calibrate_voltage", { target: "voltage", groupKey: s, reference: o }), {
      session_id: i,
      group_key: s,
      reference: o,
      confirm_iteration: r
    }), this.calibrateCurrent = (i, s, o, r, a) => !Number.isFinite(a) || a < 1e-3 || a > 1e3 ? Promise.reject(new Error("calibrate_current reporting multiplier is invalid")) : this.call("calibrate_current", (c) => Oe(c, "calibrate_current", { target: "current", channel: s, reference: o, rawReference: o / a }), {
      session_id: i,
      channel: s,
      reference: o,
      reporting_multiplier: a,
      confirm_iteration: r
    }), this.restartAndVerify = (i, s) => this.call("restart_and_verify", (o) => Ut(o, "restart_and_verify", s), { session_id: i }), this.cancelSession = (i) => this.call("cancel_session", (s) => H(s, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (s) => K(s, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, s, o, r) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: s,
      source_sha256: o
    }, (a) => se(a, "subscribe_config_transaction"), r), this.subscribeSession = (i, s) => this.subscribe("subscribe_session", { session_id: i }, (o) => H(o, "subscribe_session"), s);
  }
  static assertPublicPayload(e, t = !1, i = 0, s = "", o = !1) {
    if (i > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(e)) {
      if (e.length > 100) throw new Error(`unsafe collection ${s || "value"} refused`);
      for (const r of e) this.assertPublicPayload(r, !1, i + 1, s);
      return;
    }
    if (typeof e == "string") {
      const r = e.includes(`
`) || e.includes("\r"), a = s === "redacted_diff" ? 32768 : 4096;
      if (e.length > a || ft.test(e) || gt.test(e) || r && s !== "redacted_diff" || s === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${s || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [r, a] of Object.entries(e)) {
        if (r.length > 256 || _t.test(r)) throw new Error("unsafe property name refused");
        if (r.toLowerCase() === "key" && !o) throw new Error(`private field ${r} refused`);
        if (r.toLowerCase() !== "raw_gain_ct" && ut.test(r))
          throw new Error(`private field ${r} refused`);
        if (t && i === 0 && r === "changes" && Array.isArray(a)) {
          if (a.length > 100) throw new Error("unsafe collection changes refused");
          for (const c of a) this.assertPublicPayload(c, !1, i + 2, "", !0);
        } else
          this.assertPublicPayload(a, !1, i + 1, r.toLowerCase());
      }
  }
  async call(e, t, i = {}) {
    const s = await this.hass.callWS({
      type: `${ke}${e}`,
      entry_id: this.entryId,
      ...i
    });
    return Q.assertPublicPayload(s, Te.has(e)), t(s);
  }
  subscribe(e, t, i, s) {
    return this.hass.connection.subscribeMessage((o) => {
      Q.assertPublicPayload(o, Te.has(e)), s(i(o));
    }, { type: `${ke}${e}`, entry_id: this.entryId, ...t });
  }
}
function Pt(n, e, t, i, s, o) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Select the compatible meter discovered on your network.</p>
      <div class="meter-list">
        ${n.map((r) => d`
          <label class=${r.entry_id === e ? "meter-row selected" : "meter-row"}>
            <input type="radio" name="meter" .checked=${r.entry_id === e}
              @change=${() => t(r.entry_id)} />
            <span><strong>${r.title}</strong><small>${r.project_name} · ${r.project_version ?? "version unavailable"}</small></span>
            <span>Device Builder: ${r.configuration ? "Configured" : r.importable ? "Importable" : r.importable === null ? "Unavailable" : "Not importable"}</span>
          </label>
        `)}
      </div>
      ${n.some((r) => r.entry_id === e && r.importable) ? d`
        <button class="secondary" @click=${i}>Adopt</button>
      ` : ""}
      <footer class="action-footer">
        <button class="secondary" data-action="back" @click=${s}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${!e} @click=${o}>Continue</button>
      </footer>
    </section>
  `;
}
function Mt(n) {
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
function Dt(n, e, t, i, s, o, r) {
  const a = n?.state ?? "previewed";
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${Mt(n)}
      ${a === "failed" ? d`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${n?.evidence.join(", ") || "The operation did not complete."}</p>
          ${n?.rollback_available ? d`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${e} ?disabled=${a !== "previewed"}>Apply</button>
        <button class="secondary" @click=${t} ?disabled=${a !== "validated"}>Compile</button>
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
const pe = (n, e) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(n.key)) return;
  n.preventDefault();
  const i = [...n.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], s = n.key === "ArrowRight" || n.key === "ArrowDown", o = n.key === "Home" ? 0 : n.key === "End" ? i.length - 1 : (e + (s ? 1 : i.length - 1)) % i.length;
  i[o]?.click(), i[o]?.focus();
}, jt = (n, e, t) => (n?.default_gain_ct ?? t) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((n?.default_gain_ct ?? t) / e);
function Bt(n, e, t, i, s, o, r, a, c, u = !1) {
  const f = Math.ceil(n.channels.length / 6), p = n.channels.filter((l) => l.address.board_index === e).slice(0, 8);
  return d`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: f }, (l, h) => d`
          <button role="tab" id=${`board-tab-${h}`} data-board-tab=${h} aria-selected=${h === e}
            aria-controls="board-panel" tabindex=${h === e ? "0" : "-1"}
            @keydown=${(g) => pe(g, h)}
            @click=${() => s(h)}>${h === 0 ? "Main Board" : `Add-on ${h}`}</button>
        `)}
      </div>
      <div class="group-nav" aria-label="Three-channel groups">
        <button data-group-nav aria-current=${t === 0} @click=${() => o(0)}>Group 1 · CT${e * 6 + 1}–${e * 6 + 3}</button>
        <button data-group-nav aria-current=${t === 1} @click=${() => o(1)}>Group 2 · CT${e * 6 + 4}–${e * 6 + 6}</button>
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <div id="board-panel" role="tabpanel" aria-labelledby=${`board-tab-${e}`}>
      <div class="ct-table" role="table" aria-rowcount=${n.channels.length + 1}>
        <div class="ct-header" role="row" aria-rowindex="1">
          <span role="columnheader">Name</span><span role="columnheader">Model</span><span role="columnheader">Current gain</span><span role="columnheader">Multiplier</span><span role="columnheader">Resulting gain</span><span role="columnheader">Burden</span><span role="columnheader">Status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${p.map((l) => {
    const h = i.get(l.channel) ?? {
      name: l.name,
      modelId: l.selected_model_id ?? "",
      multiplier: l.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, g = n.catalog.presets.find((v) => v.model_id === h.modelId), b = jt(g, h.multiplier, h.modelId === "custom" ? h.customGainCt : void 0), C = ue(l, h);
    return d`
              <div class="ct-row" data-ct-row data-ct-group=${l.address.group_index - 1} role="row" aria-rowindex=${l.channel + 1} aria-label=${`CT${l.channel}`}>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${l.channel} name`} .value=${h.name}
                  @input=${(v) => r(l.channel, { name: v.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${l.channel} model`} ?disabled=${u}
                  @change=${(v) => {
      const k = v.target.value, A = n.catalog.presets.find((S) => S.model_id === k);
      r(l.channel, {
        modelId: k,
        burdenAcknowledged: l.selection_verified_against_config && k === l.selected_model_id && (k === "custom" || A?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${h.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((v) => d`<option value=${v.model_id} ?selected=${h.modelId === v.model_id}>${v.label}</option>`)}
                  <option value="custom" ?selected=${h.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${l.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${l.channel} multiplier`} ?disabled=${u}
                  .value=${String(h.multiplier)} @input=${(v) => r(l.channel, { multiplier: Number(v.target.value) })} /></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${b ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${g?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${h.expanded} @click=${() => r(l.channel, { expanded: !h.expanded })}>
                  ${h.modelId ? C ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${h.modelId === "custom" ? d`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${l.channel} custom gain`}
                  ?disabled=${u}
                  .value=${h.customGainCt === void 0 ? "" : String(h.customGainCt)}
                  @input=${(v) => r(l.channel, { customGainCt: Number(v.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${l.channel} custom label`} ?disabled=${u} .value=${h.customLabel ?? ""}
                  @input=${(v) => r(l.channel, { customLabel: v.target.value })} /></label>
              </div>` : y}
              ${h.modelId === "custom" || g?.requires_burden_jumper_cut ? d`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${l.channel} burden output acknowledgement`}
                  ?disabled=${u}
                  .checked=${h.burdenAcknowledged}
                  @change=${(v) => r(l.channel, { burdenAcknowledged: v.target.checked })} />
                  I checked the burden-output requirement for CT${l.channel}</label>
              </div>` : y}
              ${g && g.rated_current_a > 65.535 && h.multiplier === 1 ? d`<div class="warning-band" role="status">CT${l.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : y}
              ${h.expanded && g ? d`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${g.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${g.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${g.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${g.notes || (g.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : y}
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${p.length} of ${n.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${a}>Back</button>
        <button class="primary" ?disabled=${u ? ![...i].some(([l, h]) => h.name !== n.channels.find((g) => g.channel === l)?.name) : !Gt(n, i)} @click=${c}>${u ? "Save Home Assistant labels" : "Review changes"}</button>
      </footer>
    </section>
  `;
}
function qt(n, e) {
  return n.channels.flatMap((t) => {
    const i = e.get(t.channel);
    if (!i || !ue(t, i)) return [];
    const s = n.catalog.presets.find((r) => r.model_id === i.modelId), o = { channel: t.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (o.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (o.custom_label = i.customLabel.trim()), o.burden_output_acknowledged = i.burdenAcknowledged) : s?.requires_burden_jumper_cut && (o.burden_output_acknowledged = i.burdenAcknowledged), [o];
  });
}
function ue(n, e) {
  return e.name !== n.name || e.modelId !== (n.selected_model_id ?? "") || e.multiplier !== n.reporting_multiplier || e.modelId === "custom" && (e.customGainCt !== n.raw_gain_ct || (e.customLabel?.trim() ?? "") !== (n.display_label ?? ""));
}
function Ht(n, e) {
  if (!e.name.trim() || !e.modelId || !Number.isFinite(e.multiplier) || e.multiplier <= 0) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const t = n.catalog.presets.find((i) => i.model_id === e.modelId);
  return !!t && (!t?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function Gt(n, e) {
  let t = !1;
  for (const i of n.channels) {
    const s = e.get(i.channel);
    if (!s || ue(i, s) && (t = !0, !Ht(n, s)))
      return !1;
  }
  return t;
}
function ge(n) {
  return n ? d`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((e, t) => d`<dl>
      <div><dt>Window ${t + 1} samples</dt><dd>${e.samples.join(", ")}</dd></div>
      <div><dt>Mean</dt><dd>${e.mean}</dd></div>
      <div><dt>Standard deviation</dt><dd>${e.standard_deviation}</dd></div>
      <div><dt>Range</dt><dd>${e.range_percent}%</dd></div>
    </dl>`)}
  </section>` : y;
}
function fe(n) {
  return n ? d`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${n.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${n.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${n.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${n.before_values.join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${n.after_values.join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${n.error_percent_values.map((e) => `${e}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Gain evidence</dt><dd>${n.gain_evidence ? JSON.stringify(n.gain_evidence) : "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${n.restore_evidence ? JSON.stringify(n.restore_evidence) : "Unavailable"}</dd></div>
    </dl>
  </section>` : y;
}
function zt(n, e, t, i, s, o, r, a, c, u, f, p, l, h) {
  const g = n?.ct_count ?? e?.channels.length ?? 6, b = Math.floor((t - 1) / 6), C = b * 6 + 1, v = e === null, k = s !== null && Number.isFinite(s) && s >= 1e-3 && s <= 1e3;
  return d`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(g / 6) }, (A, S) => d`<button role="tab"
          id=${`current-board-tab-${S}`} aria-controls="current-board-panel"
          aria-selected=${S === b} tabindex=${S === b ? "0" : "-1"}
          @keydown=${(R) => pe(R, S)}
          @click=${() => a(S * 6 + 1)}>${S === 0 ? "Main Board" : `Add-on ${S}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${b}`}>
      <div class="group-grid">
        ${[0, 3].map((A) => d`<section><h2>Group ${b * 2 + A / 3 + 1}</h2>${Array.from({ length: 3 }, (S, R) => {
    const P = C + A + R;
    return d`<button class=${P === t ? "selected" : ""} @click=${() => a(P)}>CT${P}</button>`;
  })}</section>`)}
      </div>
      <h2>Calibrate CT${t}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(i)} @input=${(A) => c(Number(A.target.value))} /></label>
      ${v ? d`<label>Reporting multiplier <input data-role="reporting-multiplier" type="number" min="0.001" max="1000" step="0.001" required .value=${s === null ? "" : String(s)} @input=${(A) => {
    const S = Number(A.target.value);
    u(Number.isFinite(S) && S >= 1e-3 && S <= 1e3 ? S : null);
  }} /></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
      <button class="secondary" @click=${f}>Check stability</button>
      ${o ? d`<div class=${o.stable ? "success-band" : "warning-band"} role="status">${o.stable ? "Stable" : "Retake samples"}</div>` : ""}
      ${ge(o)}
      ${fe(r)}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration ${r?.iteration ?? 1} of 3</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${p} ?disabled=${!o?.stable || v && !k || (r?.iteration ?? 0) >= 3 || !!(r && !r.retry_allowed && r.iteration > 0)}>${r?.retry_allowed ? "Retry calibration" : "Calibrate"} CT${t}</button>
      ${r?.state.includes("indeterminate") ? d`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${l}>Reconnect and inspect</button><button class="danger" @click=${h}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
function Vt(n, e, t, i, s, o) {
  const r = n.includes("failed") || n.includes("indeterminate");
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, and entity bindings.</p>
      <div class="status-band" role="status">${n || "Ready for restart verification"}</div>
      ${e ? d`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${e.source_handoff_available ? e.config_filename : "Unavailable in runtime-only mode"}</dd></div></dl>` : ""}
      ${n === "cancelled" ? d`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${r ? d`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${t ? d`<button class="danger" data-action="rollback" @click=${s}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${o}>Back</button><button class="primary" @click=${i} ?disabled=${n === "cancelled" || !!e}>${n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Lt(n) {
  return n ? n.preflight.issues.length ? d`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((e) => d`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : d`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : d`<p>Starting a calibration session…</p>`;
}
function Ft(n, e, t, i, s, o) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${Lt(n)}
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
        <label class="check-row"><input type="checkbox" .checked=${e} @change=${(r) => t(r.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${s}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" @click=${i} ?disabled=${n?.state === "cancelled" || !e || !!n?.preflight.issues.length}>Continue</button>
      </footer>
    </section>
  `;
}
const Ne = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Wt = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function Kt(n, e, t, i, s, o) {
  return d`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (r, a) => d`
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
          ${Ne.map(([r, a]) => d`
            <label class=${r === t ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${r}
                .checked=${r === t} @change=${() => s(r)} />
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
          <div><dt>Connection</dt><dd>${Ne.find(([r]) => r === t)?.[1]}</dd></div>
          ${Wt.slice(0, e).map((r, a) => d`<div><dt>Add-on ${a + 1}</dt><dd>${r}</dd></div>`)}
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
function Ge(n, e, t, i, s, o = null) {
  return d`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((r) => d`<li>${r.source}: ${r.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([r, a]) => d`<div data-target=${r}>${ge(a)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([r, a]) => d`<div data-target=${r}>${fe(a)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${t?.evidence.join(", ") || "No build evidence."}</p><p>${t?.progress.join(", ") || "No transaction progress."}</p>
          ${t?.validation_detail ? d`<p>Validation code ${t.validation_detail.code ?? "unavailable"}; ${t.validation_detail.error_record_count} error records; ${t.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${t?.upload_progress?.length ? d`<ul>${t.upload_progress.map((r) => d`<li>${r.stage}: ${r.percentage ?? r.progress ?? "in progress"}${r.percentage != null || r.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Authority source</h3><p>${o?.source_authority.replaceAll("_", " ") ?? "Not yet established"}</p><p>${o ? `Verification ${o.verification_id}, generation ${o.connection_generation}` : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function Jt(n, e, t, i, s, o, r, a) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${o ? d`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : d`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${r ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${o?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${o?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${Ge(n, e, t, i, s, o)}
      <footer class="action-footer"><button class="secondary" @click=${a}>Back</button></footer>
    </section>
  `;
}
function ze(n) {
  const e = n.addon_count, t = n.evidence.map((i) => i.source);
  return e < 0 || e > 6 || n.board_count !== e + 1 || n.ct_count !== 6 * (e + 1) || n.group_count !== 2 * (e + 1) || n.evidence.length < 1 || n.evidence.length > 5 || new Set(t).size !== t.length || !t.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || n.evidence.some((i) => i.addon_count !== e);
}
function Zt(n, e, t, i, s = !1) {
  const o = s || ze(n);
  return d`
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
        <tbody>${n.evidence.map((r) => d`
          <tr><td>${r.source.replaceAll("_", " ")}</td><td>${r.addon_count}</td><td>${r.detail}</td></tr>
        `)}</tbody>
      </table>
      ${o ? d`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : d`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${t}>Back</button>
        ${o ? "" : d`<button class="primary" data-action="continue" @click=${i}>Continue</button>`}
      </footer>
    </section>
  `;
}
function Yt(n, e, t, i, s, o, r, a, c, u, f) {
  const p = n?.group_count ?? 2;
  return d`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="target-tabs" role="tablist" aria-label="Voltage groups">
        ${Array.from({ length: p }, (l, h) => d`<button role="tab"
          id=${`voltage-group-tab-${h}`} aria-controls="voltage-group-panel"
          aria-selected=${h === e} tabindex=${h === e ? "0" : "-1"}
          @keydown=${(g) => pe(g, h)}
          @click=${() => o(h)}>Group ${h + 1}</button>`)}
      </div>
      <div id="voltage-group-panel" role="tabpanel" aria-labelledby=${`voltage-group-tab-${e}`}>
      <h2>Calibrate voltage group ${e + 1}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(t)} @input=${(l) => r(Number(l.target.value))} /></label>
      <button class="secondary" @click=${a}>Check stability</button>
      ${i ? d`<div class=${i.stable ? "success-band" : "warning-band"} role="status">${i.stable ? "Stable sample window" : "Samples are not stable yet"}</div>` : ""}
      ${ge(i)}
      ${fe(s)}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${c} ?disabled=${!i?.stable || !!(s && !s.retry_allowed && s.iteration > 0)}> ${s?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      ${s?.state === "indeterminate" ? d`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${u}>Reconnect and inspect</button><button class="danger" @click=${f}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Xt = Le`
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
`, M = [
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
class Qt extends z {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.ctGroup = 0, this.group = 0, this.channel = 1, this.reference = 0, this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = Xt;
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
    const t = new Q(this.hass, this.panel.config.entry_id);
    this.api = t;
    try {
      const i = await t.setupStatus();
      if (!this.owns(e, t)) return;
      this.setup = i;
      const s = this.setup.installer_intent;
      s && (this.addonCount = s.addon_count, this.connection = s.connection_type), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.setup.devices[0]?.entry_id ?? null), await this.ownSubscription(t.subscribeSetup((o) => {
        this.owns(e, t) && (this.setup = o, !this.selectedDeviceId && o.devices.length && this.selectDevice(o.devices[0]?.entry_id ?? null), this.requestUpdate());
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
  async ownSubscription(e, t, i, s = () => !0, o = () => {
  }) {
    const r = await e;
    if (!this.owns(t, i) || !s()) {
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
    this.safetyAcknowledged = !1, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.group = 0, this.channel = 1, this.reference = 0, this.reportingMultiplier = null;
  }
  selectDevice(e) {
    e !== this.selectedDeviceId && (++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = e, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.board = 0, this.ctGroup = 0, this.resetCalibrationRun());
  }
  showTopology(e) {
    this.topology = e, this.navigate("topology"), this.error = ze(e) || e.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
  }
  showInventory(e) {
    this.inventory = e, this.drafts = new Map(e.channels.map((t) => {
      const i = t.selected_model_id ?? "", s = e.catalog.presets.find((o) => o.model_id === i);
      return [t.channel, {
        name: t.name,
        modelId: i,
        multiplier: t.reporting_multiplier,
        customGainCt: i === "custom" || t.selected_model_id === null ? t.raw_gain_ct : void 0,
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
    const e = M.findIndex(([t]) => t === this.step);
    e > 0 && this.navigate(M[e - 1][0]);
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
      const s = await e.rescan();
      this.ownsOperation(i, e, t) && (this.setup = s, s.devices.length ? (this.selectDevice(s.devices[0]?.entry_id ?? null), this.navigate("discover"), this.announcement = "Compatible meter discovered.") : this.announcement = "No compatible meter found. Check the network and rescan.");
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
      const s = await e.getTopology(t);
      this.ownsOperation(i, e, t) && this.showTopology("topology" in s ? s.topology : s);
    }, "Topology evidence could not be loaded.", () => this.ownsOperation(i, e, t));
  }
  async loadInventory() {
    if (!this.api || !this.selectedDeviceId) return;
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      const s = await e.getCtInventory(t);
      this.ownsOperation(i, e, t) && this.showInventory(s);
    }, "CT inventory could not be loaded.", () => this.ownsOperation(i, e, t));
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
    const e = qt(this.inventory, this.drafts);
    if (!e.length) return this.fail(new Error(), "Select at least one CT change before review.");
    const t = this.api, i = this.selectedDeviceId, s = this.inventory, o = ++this.operationGeneration;
    if (this.clearSubscription("transaction"), this.transaction = null, this.labelOnly) {
      const r = e.filter((a) => a.name !== this.inventory.channels.find((c) => c.channel === a.channel)?.name).map(({ channel: a, name: c }) => ({ channel: a, name: c }));
      if (!r.length || e.some((a) => {
        const c = this.inventory.channels.find((u) => u.channel === a.channel);
        return !c || a.model_id !== (c.selected_model_id ?? "") || (a.reporting_multiplier ?? 1) !== c.reporting_multiplier;
      }))
        return this.fail(new Error(), "Home Assistant label mode only permits display-name edits.");
      await this.run(
        async () => {
          await t.setHaLabels(i, s.plan_id, s.source_sha256, r), this.announcement = "Home Assistant labels saved.";
        },
        "Home Assistant labels could not be saved.",
        () => this.ownsOperation(o, t, i)
      );
      return;
    }
    await this.run(
      async () => {
        const r = await t.previewCtConfig(
          i,
          s.plan_id,
          s.source_sha256,
          e
        );
        this.ownsOperation(o, t, i) && (this.transaction = r, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "The configuration preview is stale. Reload the CT inventory and review again.",
      () => this.ownsOperation(o, t, i)
    );
  }
  async subscribeTransaction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const t = this.api;
    this.clearSubscription("transaction");
    const i = this.transactionSubscriptionScope, s = this.selectedDeviceId, o = this.transaction.transaction_id, r = this.transaction.source_sha256;
    await this.ownSubscription(
      t.subscribeConfigTransaction(
        s,
        o,
        r,
        (a) => {
          this.owns(e, t) && i === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === o && this.transaction.source_sha256 === r && a.transaction_id === o && a.source_sha256 === r && (this.transaction = a, this.requestUpdate());
        }
      ),
      e,
      t,
      () => i === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === o && this.transaction.source_sha256 === r,
      (a) => {
        this.transactionUnsub = a;
      }
    );
  }
  async transactionAction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const t = this.api, i = this.selectedDeviceId, s = this.transaction, o = ++this.operationGeneration;
    await this.run(
      async () => {
        const r = [i, s.transaction_id, s.source_sha256], a = e === "apply" ? await t.applyCtConfig(...r) : e === "compile" ? await t.compileCtConfig(...r) : e === "install" ? await t.installCtConfig(...r) : await t.rollbackCtConfig(...r);
        !this.ownsOperation(o, t, i) || this.transaction?.transaction_id !== s.transaction_id || this.transaction.source_sha256 !== s.source_sha256 || (this.transaction = a, this.announcement = `Configuration ${this.transaction.state}.`);
      },
      "This confirmation is stale. Reload the CT inventory before making another change.",
      () => this.ownsOperation(o, t, i)
    );
  }
  async startSession() {
    if (!this.api || !this.selectedDeviceId) return;
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    this.clearSubscription("session"), this.session = null, this.resetCalibrationRun(), await this.run(async () => {
      const s = await e.startSession(t);
      !this.ownsOperation(i, e, t) || s.device_id !== t || (this.session = s, this.navigate("safety"), await this.subscribeSession(this.connectionGeneration));
    }, "Calibration session could not be started.", () => this.ownsOperation(i, e, t));
  }
  async subscribeSession(e) {
    if (!this.api || !this.session) return;
    const t = this.api;
    this.clearSubscription("session");
    const i = this.sessionSubscriptionScope, s = this.session.session_id, o = this.session.device_id;
    await this.ownSubscription(
      t.subscribeSession(s, (r) => {
        this.owns(e, t) && i === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === o && r.session_id === s && r.device_id === o && (this.session = r, this.requestUpdate());
      }),
      e,
      t,
      () => i === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === o,
      (r) => {
        this.sessionUnsub = r;
      }
    );
  }
  async acknowledgeSafety() {
    if (!this.api || !this.session) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    await this.run(async () => {
      const o = await e.acknowledgeSafety(i);
      !this.ownsOperation(s, e, t) || o.session_id !== i || (this.session = o, this.navigate("voltage"));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(s, e, t));
  }
  async checkStability(e) {
    if (!this.api || !this.session) return;
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration, r = e === "voltage" ? this.groupKey(this.group) : String(this.channel);
    await this.run(async () => {
      const a = await t.checkStability(s, e, r);
      !this.ownsOperation(o, t, i) || this.session?.session_id !== s || (this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${r}`, a));
    }, "Stable samples could not be collected.", () => this.ownsOperation(o, t, i));
  }
  async calibrate(e) {
    if (!this.api || !this.session) return;
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration, r = e === "voltage" ? this.groupKey(this.group) : String(this.channel), a = this.groupKey(this.group), c = this.channel, u = this.reference, f = this.inventory?.channels[c - 1]?.reporting_multiplier ?? this.reportingMultiplier;
    if (e === "current" && f === null) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      return;
    }
    await this.run(
      async () => {
        const p = e === "voltage" ? await t.calibrateVoltage(s, a, u, !0) : await t.calibrateCurrent(
          s,
          c,
          u,
          !0,
          f
        );
        !this.ownsOperation(o, t, i) || this.session?.session_id !== s || (this.calibrationByTarget = new Map(this.calibrationByTarget).set(`${e}:${r}`, p), this.announcement = `Calibration iteration ${p.iteration} finished with state ${p.state}.`);
      },
      "Calibration did not complete. Reconnect and inspect before another attempt.",
      () => this.ownsOperation(o, t, i)
    );
  }
  groupKey(e) {
    const t = Math.floor(e / 2), i = e % 2 + 1;
    return t === 0 ? `main_${i}` : `addon${t}_${i}`;
  }
  async restart() {
    if (!this.api || !this.session || !this.topology) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.topology, o = ++this.operationGeneration;
    await this.run(
      async () => {
        let r;
        try {
          r = await e.restartAndVerify(i, s);
        } catch (a) {
          throw this.ownsOperation(o, e, t) && this.session?.session_id === i && this.topology === s && (this.restartResult = null, this.session = { ...this.session, state: "restart_failed" }), a;
        }
        !this.ownsOperation(o, e, t) || this.session?.session_id !== i || this.topology !== s || (this.restartResult = r, this.session = { ...this.session, state: "verified" }, this.navigate("summary"));
      },
      "Restart verification failed; review recovery evidence before rollback.",
      () => this.ownsOperation(o, e, t)
    );
  }
  async cancelSession() {
    if (!this.api || !this.session) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    await this.run(async () => {
      const o = await e.cancelSession(i);
      !this.ownsOperation(s, e, t) || this.session?.session_id !== i || (this.clearSubscription("session"), this.session = o, this.restartResult = null, this.navigate("safety"), this.announcement = "Calibration session cancelled; cleanup completed without restart verification.");
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(s, e, t));
  }
  async reconnectSession() {
    if (!this.api || !this.session) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    await this.run(
      async () => {
        const o = await e.getSession(i);
        !this.ownsOperation(s, e, t) || this.session?.session_id !== i || (this.session = o, this.announcement = `Session reconnected with state ${this.session.state}.`);
      },
      "Session reconnection failed. Retry only after checking the meter connection.",
      () => this.ownsOperation(s, e, t)
    );
  }
  resultFor(e) {
    const t = e === "voltage" ? this.groupKey(this.group) : String(this.channel);
    return this.calibrationByTarget.get(`${e}:${t}`) ?? null;
  }
  stabilityFor(e) {
    const t = e === "voltage" ? this.groupKey(this.group) : String(this.channel);
    return this.stabilityByTarget.get(`${e}:${t}`) ?? null;
  }
  async run(e, t, i = () => !0) {
    this.error = "";
    try {
      await e();
    } catch (s) {
      if (!i()) return;
      const o = s.code;
      this.fail(s, o === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : t);
    }
    i() && this.requestUpdate();
  }
  fail(e, t) {
    this.error = t, this.announcement = t, this.requestUpdate();
  }
  stepBody() {
    return this.step === "setup" ? Kt(
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
    ) : this.step === "discover" ? Pt(
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
    ) : this.step === "topology" && this.topology ? Zt(
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
    }}> Home Assistant labels only</label></fieldset>${Bt(
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
    )}` : this.step === "build" ? Dt(
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
    ) : this.step === "safety" ? Ft(
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
    ) : this.step === "voltage" ? d`${Yt(
      this.topology,
      this.group,
      this.reference,
      this.stabilityFor("voltage"),
      this.resultFor("voltage"),
      (e) => {
        this.group = e, this.requestUpdate();
      },
      (e) => {
        this.reference = e, this.requestUpdate();
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? d`${zt(
      this.topology,
      this.inventory,
      this.channel,
      this.reference,
      this.reportingMultiplier,
      this.stabilityFor("current"),
      this.resultFor("current"),
      (e) => {
        this.channel = e, this.requestUpdate();
      },
      (e) => {
        this.reference = e, this.requestUpdate();
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("restart")}>Continue</button></footer>` : this.step === "restart" ? Vt(
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
    ) : Jt(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.selectedProjectVersion(), () => this.back());
  }
  render() {
    const e = M.findIndex(([t]) => t === this.step);
    return d`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${M.map(([t, i], s) => d`
            <li class=${s === e ? "current" : ""}>
              <button class="step-button" aria-current=${s === e ? "step" : y} ?disabled=${s > e}
                @click=${() => s <= e && this.navigate(t)}><span class="number">${s + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${e + 1} of 10 — ${M[e]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${M[e]?.[1]}</h1>
          ${this.error ? d`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : y}
          ${this.stepBody()}
          ${e >= 4 && this.step !== "summary" ? Ge(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult) : y}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", Qt);
export {
  Qt as CircuitSetupPanel
};
