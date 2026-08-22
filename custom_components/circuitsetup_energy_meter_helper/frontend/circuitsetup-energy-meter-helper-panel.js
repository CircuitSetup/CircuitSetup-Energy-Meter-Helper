const V = globalThis, Y = V.ShadowRoot && (V.ShadyCSS === void 0 || V.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ee = /* @__PURE__ */ Symbol(), ae = /* @__PURE__ */ new WeakMap();
let we = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== ee) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Y && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = ae.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && ae.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Pe = (n) => new we(typeof n == "string" ? n : n + "", void 0, ee), Ue = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, s, o) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[o + 1], n[0]);
  return new we(t, n, ee);
}, Oe = (n, e) => {
  if (Y) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = V.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, n.appendChild(i);
  }
}, ce = Y ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return Pe(t);
})(n) : n;
const { is: Me, defineProperty: De, getOwnPropertyDescriptor: Be, getOwnPropertyNames: je, getOwnPropertySymbols: qe, getPrototypeOf: He } = Object, F = globalThis, de = F.trustedTypes, ze = de ? de.emptyScript : "", Ve = F.reactiveElementPolyfillSupport, M = (n, e) => n, X = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? ze : null;
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
} }, xe = (n, e) => !Me(n, e), le = { attribute: !0, type: String, converter: X, reflect: !1, useDefault: !1, hasChanged: xe };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), F.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let R = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = le) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && De(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: o } = Be(this.prototype, e) ?? { get() {
      return this[t];
    }, set(r) {
      this[t] = r;
    } };
    return { get: s, set(r) {
      const c = s?.call(this);
      o?.call(this, r), this.requestUpdate(e, c, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? le;
  }
  static _$Ei() {
    if (this.hasOwnProperty(M("elementProperties"))) return;
    const e = He(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(M("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(M("properties"))) {
      const t = this.properties, i = [...je(t), ...qe(t)];
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
      for (const s of i) t.unshift(ce(s));
    } else e !== void 0 && t.push(ce(e));
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
    return Oe(e, this.constructor.elementStyles), e;
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
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : X).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const o = i.getPropertyOptions(s), r = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : X;
      this._$Em = s;
      const c = r.fromAttribute(t, o.type);
      this[s] = c ?? this._$Ej?.get(s) ?? c, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, o) {
    if (e !== void 0) {
      const r = this.constructor;
      if (s === !1 && (o = this[e]), i ??= r.getPropertyOptions(e), !((i.hasChanged ?? xe)(o, t) || i.useDefault && i.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(r._$Eu(e, i)))) return;
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
        const { wrapped: r } = o, c = this[s];
        r !== !0 || this._$AL.has(s) || c === void 0 || this.C(s, void 0, o, c);
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
R.elementStyles = [], R.shadowRootOptions = { mode: "open" }, R[M("elementProperties")] = /* @__PURE__ */ new Map(), R[M("finalized")] = /* @__PURE__ */ new Map(), Ve?.({ ReactiveElement: R }), (F.reactiveElementVersions ??= []).push("2.1.2");
const te = globalThis, pe = (n) => n, G = te.trustedTypes, he = G ? G.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Se = "$lit$", S = `lit$${Math.random().toFixed(9).slice(2)}$`, Ce = "?" + S, Ge = `<${Ce}>`, T = document, B = () => T.createComment(""), j = (n) => n === null || typeof n != "object" && typeof n != "function", ie = Array.isArray, Le = (n) => ie(n) || typeof n?.[Symbol.iterator] == "function", J = `[\x20\t
\f\r]`, U = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ue = /-->/g, ge = />/g, A = RegExp(`>|${J}(?:([^\\s"'>=/]+)(${J}*=${J}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), fe = /'/g, be = /"/g, ke = /^(?:script|style|textarea|title)$/i, Fe = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), a = Fe(1), N = /* @__PURE__ */ Symbol.for("lit-noChange"), f = /* @__PURE__ */ Symbol.for("lit-nothing"), _e = /* @__PURE__ */ new WeakMap(), E = T.createTreeWalker(T, 129);
function Ae(n, e) {
  if (!ie(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return he !== void 0 ? he.createHTML(e) : e;
}
const We = (n, e) => {
  const t = n.length - 1, i = [];
  let s, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = U;
  for (let c = 0; c < t; c++) {
    const l = n[c];
    let g, _, d = -1, p = 0;
    for (; p < l.length && (r.lastIndex = p, _ = r.exec(l), _ !== null); ) p = r.lastIndex, r === U ? _[1] === "!--" ? r = ue : _[1] !== void 0 ? r = ge : _[2] !== void 0 ? (ke.test(_[2]) && (s = RegExp("</" + _[2], "g")), r = A) : _[3] !== void 0 && (r = A) : r === A ? _[0] === ">" ? (r = s ?? U, d = -1) : _[1] === void 0 ? d = -2 : (d = r.lastIndex - _[2].length, g = _[1], r = _[3] === void 0 ? A : _[3] === '"' ? be : fe) : r === be || r === fe ? r = A : r === ue || r === ge ? r = U : (r = A, s = void 0);
    const u = r === A && n[c + 1].startsWith("/>") ? " " : "";
    o += r === U ? l + Ge : d >= 0 ? (i.push(g), l.slice(0, d) + Se + l.slice(d) + S + u) : l + S + (d === -2 ? c : u);
  }
  return [Ae(n, o + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class q {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let o = 0, r = 0;
    const c = e.length - 1, l = this.parts, [g, _] = We(e, t);
    if (this.el = q.createElement(g, i), E.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = E.nextNode()) !== null && l.length < c; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(Se)) {
          const p = _[r++], u = s.getAttribute(d).split(S), x = /([.?@])?(.*)/.exec(p);
          l.push({ type: 1, index: o, name: x[2], strings: u, ctor: x[1] === "." ? Je : x[1] === "?" ? Ze : x[1] === "@" ? Xe : W }), s.removeAttribute(d);
        } else d.startsWith(S) && (l.push({ type: 6, index: o }), s.removeAttribute(d));
        if (ke.test(s.tagName)) {
          const d = s.textContent.split(S), p = d.length - 1;
          if (p > 0) {
            s.textContent = G ? G.emptyScript : "";
            for (let u = 0; u < p; u++) s.append(d[u], B()), E.nextNode(), l.push({ type: 2, index: ++o });
            s.append(d[p], B());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Ce) l.push({ type: 2, index: o });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(S, d + 1)) !== -1; ) l.push({ type: 7, index: o }), d += S.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const i = T.createElement("template");
    return i.innerHTML = e, i;
  }
}
function P(n, e, t = n, i) {
  if (e === N) return e;
  let s = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const o = j(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== o && (s?._$AO?.(!1), o === void 0 ? s = void 0 : (s = new o(n), s._$AT(n, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = s : t._$Cl = s), s !== void 0 && (e = P(n, s._$AS(n, e.values), s, i)), e;
}
class Ke {
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
    const { el: { content: t }, parts: i } = this._$AD, s = (e?.creationScope ?? T).importNode(t, !0);
    E.currentNode = s;
    let o = E.nextNode(), r = 0, c = 0, l = i[0];
    for (; l !== void 0; ) {
      if (r === l.index) {
        let g;
        l.type === 2 ? g = new H(o, o.nextSibling, this, e) : l.type === 1 ? g = new l.ctor(o, l.name, l.strings, this, e) : l.type === 6 && (g = new Qe(o, this, e)), this._$AV.push(g), l = i[++c];
      }
      r !== l?.index && (o = E.nextNode(), r++);
    }
    return E.currentNode = T, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class H {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = f, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    e = P(this, e, t), j(e) ? e === f || e == null || e === "" ? (this._$AH !== f && this._$AR(), this._$AH = f) : e !== this._$AH && e !== N && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Le(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== f && j(this._$AH) ? this._$AA.nextSibling.data = e : this.T(T.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = q.createElement(Ae(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const o = new Ke(s, this), r = o.u(this.options);
      o.p(t), this.T(r), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = _e.get(e.strings);
    return t === void 0 && _e.set(e.strings, t = new q(e)), t;
  }
  k(e) {
    ie(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const o of e) s === t.length ? t.push(i = new H(this.O(B()), this.O(B()), this, this.options)) : i = t[s], i._$AI(o), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = pe(e).nextSibling;
      pe(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class W {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, o) {
    this.type = 1, this._$AH = f, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = f;
  }
  _$AI(e, t = this, i, s) {
    const o = this.strings;
    let r = !1;
    if (o === void 0) e = P(this, e, t, 0), r = !j(e) || e !== this._$AH && e !== N, r && (this._$AH = e);
    else {
      const c = e;
      let l, g;
      for (e = o[0], l = 0; l < o.length - 1; l++) g = P(this, c[i + l], t, l), g === N && (g = this._$AH[l]), r ||= !j(g) || g !== this._$AH[l], g === f ? e = f : e !== f && (e += (g ?? "") + o[l + 1]), this._$AH[l] = g;
    }
    r && !s && this.j(e);
  }
  j(e) {
    e === f ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Je extends W {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === f ? void 0 : e;
  }
}
class Ze extends W {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== f);
  }
}
class Xe extends W {
  constructor(e, t, i, s, o) {
    super(e, t, i, s, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = P(this, e, t, 0) ?? f) === N) return;
    const i = this._$AH, s = e === f && i !== f || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, o = e !== f && (i === f || s);
    s && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Qe {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    P(this, e);
  }
}
const Ye = te.litHtmlPolyfillSupport;
Ye?.(q, H), (te.litHtmlVersions ??= []).push("3.3.3");
const et = (n, e, t) => {
  const i = t?.renderBefore ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const o = t?.renderBefore ?? null;
    i._$litPart$ = s = new H(e.insertBefore(B(), o), o, void 0, t ?? {});
  }
  return s._$AI(n), s;
};
const se = globalThis;
class D extends R {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = et(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return N;
  }
}
D._$litElement$ = !0, D.finalized = !0, se.litElementHydrateSupport?.({ LitElement: D });
const tt = se.litElementPolyfillSupport;
tt?.({ LitElement: D });
(se.litElementVersions ??= []).push("4.2.2");
const me = "circuitsetup_energy_meter_helper/", it = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, st = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, nt = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/, ot = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), rt = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), at = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "indeterminate", "verified", "cancelled"]), ne = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), ct = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), Ee = /* @__PURE__ */ new Set(["A", "B", "C"]), dt = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), lt = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), pt = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), ht = /* @__PURE__ */ new Set(["invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]);
function b(n, e) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function $(n, e) {
  if (!Array.isArray(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function h(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${e} response is invalid`);
  return n;
}
function C(n, e) {
  if (typeof n != "number" || !Number.isFinite(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function v(n, e) {
  const t = C(n, e);
  if (!Number.isInteger(t)) throw new Error(`${e} response is invalid`);
  return t;
}
function w(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "boolean") throw new Error(`${e} response is invalid`);
  return n;
}
function y(n, e, t) {
  const i = h(n, t);
  if (!e.has(i)) throw new Error(`${t} response is invalid`);
  return i;
}
function Q(n, e) {
  n !== void 0 && h(n, e, !0);
}
function Te(n, e) {
  const t = b(n, e);
  h(t.entry_id, e), h(t.title, e), h(t.project_name, e), h(t.project_version, e, !0), w(t.importable, e, !0), h(t.configuration, e, !0);
}
function z(n, e) {
  const t = b(n, e);
  if (y(t.state, ot, e), $(t.devices, e).forEach((i) => Te(i, e)), t.configuration_authoritative !== void 0 && w(t.configuration_authoritative, e), t.installer_intent !== void 0) {
    const i = b(t.installer_intent, e), s = v(i.addon_count, e);
    if (s < 0 || s > 6) throw new Error(`${e} response is invalid`);
    if (y(i.connection_type, ne, e) === "unknown") throw new Error(`${e} response is invalid`);
  }
  return n;
}
function ve(n, e) {
  const t = b(n, e);
  for (const i of ["addon_count", "board_count", "ct_count", "group_count"]) v(t[i], e);
  return y(t.connection_type, ne, e), h(t.voltage_layout, e), h(t.project_name, e), $(t.evidence, e).forEach((i) => {
    const s = b(i, e);
    y(s.source, ct, e), v(s.addon_count, e), h(s.detail, e);
  }), n;
}
function ut(n, e) {
  const t = b(n, e);
  return "topology" in t ? (ve(t.topology, e), t.configuration_authoritative !== void 0 && w(t.configuration_authoritative, e), n) : ve(n, e);
}
function gt(n, e) {
  const t = b(n, e);
  h(t.plan_id, e), h(t.source_sha256, e), $(t.channels, e).forEach((s) => {
    const o = b(s, e);
    v(o.channel, e), h(o.name, e), v(o.raw_gain_ct, e), C(o.reporting_multiplier, e), Q(o.selected_model_id, e), w(o.selection_verified_against_config, e), Q(o.display_label, e);
    const r = b(o.address, e);
    v(r.channel, e), v(r.board_index, e), v(r.group_index, e), y(r.phase, Ee, e);
  });
  const i = b(t.catalog, e);
  return h(i.source_repository, e), h(i.source_ref, e), v(i.schema_version, e), $(i.presets, e).forEach((s) => {
    const o = b(s, e);
    h(o.model_id, e), h(o.label, e), C(o.rated_current_a, e), h(o.secondary, e), o.default_gain_ct !== null && v(o.default_gain_ct, e), w(o.requires_burden_jumper_cut, e), h(o.notes, e);
  }), n;
}
function Z(n, e) {
  const t = b(n, e);
  if (h(t.transaction_id, e), y(t.state, rt, e), h(t.source_sha256, e), w(t.rollback_available, e), h(t.redacted_diff, e), $(t.changes, e).forEach((i) => {
    const s = b(i, e);
    h(s.key, e), s.old_value !== null && h(s.old_value, e), h(s.new_value, e);
  }), $(t.evidence, e).forEach((i) => y(i, lt, e)), $(t.progress, e).forEach((i) => y(i, pt, e)), t.validation_detail != null) {
    const i = b(t.validation_detail, e);
    for (const s of ["reported_error_count", "reported_warning_count"]) i[s] !== null && v(i[s], e);
    i.code !== null && v(i.code, e), v(i.error_record_count, e), v(i.warning_record_count, e);
  }
  return t.upload_progress !== void 0 && $(t.upload_progress, e).forEach((i) => {
    const s = b(i, e);
    if (y(s.stage, dt, e), s.progress !== null && s.percentage !== null && s.progress !== void 0 && s.percentage !== void 0) throw new Error(`${e} response is invalid`);
    const o = s.progress ?? s.percentage;
    if (o != null) {
      const r = v(o, e);
      if (r < 0 || r > 100) throw new Error(`${e} response is invalid`);
    }
  }), n;
}
function O(n, e) {
  const t = b(n, e);
  h(t.session_id, e), h(t.device_id, e), y(t.state, at, e), w(t.safety_acknowledged, e);
  const i = b(t.preflight, e);
  return $(i.issues, e).forEach((s) => {
    const o = b(s, e);
    y(o.code, ht, e), h(o.role, e), h(o.detail, e);
  }), $(i.zeroed_roles, e).forEach((s) => h(s, e)), n;
}
function ft(n, e) {
  const t = b(n, e);
  return y(t.target, /* @__PURE__ */ new Set(["voltage", "current"]), e), h(t.target_id, e), w(t.stable, e), $(t.windows, e).forEach((i) => {
    const s = b(i, e);
    $(s.samples, e).forEach((o) => C(o, e)), C(s.mean, e), C(s.standard_deviation, e), C(s.range_percent, e);
  }), n;
}
function $e(n, e) {
  const t = b(n, e);
  y(t.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e), h(t.group_key, e), t.phase !== null && y(t.phase, Ee, e), v(t.iteration, e), w(t.retry_allowed, e);
  for (const i of ["changed_channels", "before_values", "after_values", "error_percent_values"]) $(t[i], e).forEach((s) => C(s, e));
  return t.gain_evidence != null && b(t.gain_evidence, e), t.restore_evidence != null && b(t.restore_evidence, e), n;
}
function bt(n, e) {
  const t = b(n, e);
  for (const i of ["mac", "config_filename", "config_sha256", "topology_project_name", "topology_voltage_layout", "verification_id"]) h(t[i], e);
  return v(t.topology_addon_count, e), y(t.topology_connection_type, ne, e), v(t.connection_generation, e), y(t.source_authority, /* @__PURE__ */ new Set(["saved_flash"]), e), w(t.source_handoff_available, e), Q(t.source_handoff_transaction_id, e), $(t.groups, e).forEach((i) => {
    const s = b(i, e);
    h(s.instance_id, e);
    const o = $(s.phase_gains, e);
    if (o.length !== 3) throw new Error(`${e} response is invalid`);
    o.forEach((r) => {
      const c = $(r, e);
      if (c.length !== 2) throw new Error(`${e} response is invalid`);
      c.forEach((l) => {
        const g = v(l, e);
        if (g < 1 || g > 65535) throw new Error(`${e} response is invalid`);
      });
    });
  }), n;
}
class L {
  constructor(e, t) {
    this.hass = e, this.entryId = t, this.setupStatus = () => this.call("setup_status", (i) => z(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => ($(i, "list_meters").forEach((s) => Te(s, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (s) => ut(s, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (s) => gt(s, "get_ct_inventory"), { device_id: i }), this.getSession = (i) => this.call("get_session", (s) => O(s, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => b(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, s) => this.call("set_installer_intent", (o) => z(o, "set_installer_intent"), { addon_count: i, connection_type: s }), this.rescan = () => this.call("rescan", (i) => z(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (s) => {
      const o = b(s, "adopt_device");
      return h(o.device_id, "adopt_device"), h(o.configuration, "adopt_device"), s;
    }, { device_id: i }), this.previewCtConfig = (i, s, o, r) => this.call("preview_ct_config", (c) => Z(c, "preview_ct_config"), {
      device_id: i,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.transaction = (i, s, o, r) => this.call(i, (c) => Z(c, i), {
      device_id: s,
      transaction_id: o,
      source_sha256: r
    }), this.applyCtConfig = (i, s, o) => this.transaction("apply_ct_config", i, s, o), this.compileCtConfig = (i, s, o) => this.transaction("compile_ct_config", i, s, o), this.installCtConfig = (i, s, o) => this.transaction("install_ct_config", i, s, o), this.rollbackCtConfig = (i, s, o) => this.transaction("rollback_ct_config", i, s, o), this.startSession = (i) => this.call("start_session", (s) => O(s, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (s) => O(s, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, o) => this.call("check_stability", (r) => ft(r, "check_stability"), { session_id: i, target: s, target_id: o }), this.calibrateVoltage = (i, s, o, r) => this.call("calibrate_voltage", (c) => $e(c, "calibrate_voltage"), {
      session_id: i,
      group_key: s,
      reference: o,
      confirm_iteration: r
    }), this.calibrateCurrent = (i, s, o, r) => this.call("calibrate_current", (c) => $e(c, "calibrate_current"), {
      session_id: i,
      channel: s,
      reference: o,
      confirm_iteration: r
    }), this.restartAndVerify = (i) => this.call("restart_and_verify", (s) => bt(s, "restart_and_verify"), { session_id: i }), this.cancelSession = (i) => this.call("cancel_session", (s) => O(s, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (s) => z(s, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, s, o, r) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: s,
      source_sha256: o
    }, (c) => Z(c, "subscribe_config_transaction"), r), this.subscribeSession = (i, s) => this.subscribe("subscribe_session", { session_id: i }, (o) => O(o, "subscribe_session"), s);
  }
  static assertPublicPayload(e, t = 0, i = "") {
    if (t > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(e)) {
      for (const s of e) this.assertPublicPayload(s, t + 1, i);
      return;
    }
    if (typeof e == "string") {
      const s = e.includes(`
`) || e.includes("\r"), o = i === "redacted_diff" ? 32768 : 4096;
      if (e.length > o || nt.test(e) || st.test(e) || s && i !== "redacted_diff" || i === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${i || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [s, o] of Object.entries(e)) {
        if (s.toLowerCase() !== "raw_gain_ct" && it.test(s))
          throw new Error(`private field ${s} refused`);
        this.assertPublicPayload(o, t + 1, s.toLowerCase());
      }
  }
  async call(e, t, i = {}) {
    const s = await this.hass.callWS({
      type: `${me}${e}`,
      entry_id: this.entryId,
      ...i
    });
    return L.assertPublicPayload(s), t(s);
  }
  subscribe(e, t, i, s) {
    return this.hass.connection.subscribeMessage((o) => {
      L.assertPublicPayload(o), s(i(o));
    }, { type: `${me}${e}`, entry_id: this.entryId, ...t });
  }
}
function _t(n, e, t, i, s, o) {
  return a`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Select the compatible meter discovered on your network.</p>
      <div class="meter-list">
        ${n.map((r) => a`
          <label class=${r.entry_id === e ? "meter-row selected" : "meter-row"}>
            <input type="radio" name="meter" .checked=${r.entry_id === e}
              @change=${() => t(r.entry_id)} />
            <span><strong>${r.title}</strong><small>${r.project_name} · ${r.project_version ?? "version unavailable"}</small></span>
            <span>Device Builder: ${r.configuration ? "Configured" : r.importable ? "Importable" : r.importable === null ? "Unavailable" : "Not importable"}</span>
          </label>
        `)}
      </div>
      ${n.some((r) => r.entry_id === e && r.importable) ? a`
        <button class="secondary" @click=${i}>Adopt</button>
      ` : ""}
      <footer class="action-footer">
        <button class="secondary" data-action="back" @click=${s}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${!e} @click=${o}>Continue</button>
      </footer>
    </section>
  `;
}
function mt(n) {
  return a`
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
function vt(n, e, t, i, s, o, r) {
  const c = n?.state ?? "previewed";
  return a`
    <section class="step-content" aria-labelledby="step-heading">
      ${mt(n)}
      ${c === "failed" ? a`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${n?.evidence.join(", ") || "The operation did not complete."}</p>
          ${n?.rollback_available ? a`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${e} ?disabled=${c !== "previewed"}>Apply</button>
        <button class="secondary" @click=${t} ?disabled=${c !== "validated"}>Compile</button>
        <button class="primary" @click=${i} ?disabled=${c !== "install_confirmation_required"}>Install</button>
      </div>
      ${n?.validation_detail ? a`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${n.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${n.validation_detail.error_record_count} records (${n.validation_detail.reported_error_count ?? "unreported"} reported)</dd></div>
        <div><dt>Warnings</dt><dd>${n.validation_detail.warning_record_count} records (${n.validation_detail.reported_warning_count ?? "unreported"} reported)</dd></div>
      </dl>` : ""}
      ${n?.upload_progress?.length ? a`<ul class="upload-progress">${n.upload_progress.map((l) => a`
        <li>${l.stage}: ${l.percentage ?? l.progress ?? "in progress"}${l.percentage != null || l.progress != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" data-action="continue" @click=${r} ?disabled=${c !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const $t = (n, e, t) => (n?.default_gain_ct ?? t) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((n?.default_gain_ct ?? t) / e);
function yt(n, e, t, i, s, o, r, c, l) {
  const g = Math.ceil(n.channels.length / 6), _ = n.channels.filter((d) => d.address.board_index === e).slice(0, 8);
  return a`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards">
        ${Array.from({ length: g }, (d, p) => a`
          <button role="tab" data-board-tab=${p} aria-selected=${p === e}
            @click=${() => s(p)}>${p === 0 ? "Main Board" : `Add-on ${p}`}</button>
        `)}
      </div>
      <div class="group-nav" aria-label="Three-channel groups">
        <button data-group-nav aria-current=${t === 0} @click=${() => o(0)}>Group 1 · CT${e * 6 + 1}–${e * 6 + 3}</button>
        <button data-group-nav aria-current=${t === 1} @click=${() => o(1)}>Group 2 · CT${e * 6 + 4}–${e * 6 + 6}</button>
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <div class="ct-table" role="table" aria-rowcount=${n.channels.length}>
        <div class="ct-header" role="row">
          <span>Name</span><span>Model</span><span>Current gain</span><span>Multiplier</span><span>Resulting gain</span><span>Burden</span><span>Status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${_.map((d) => {
    const p = i.get(d.channel) ?? {
      name: d.name,
      modelId: d.selected_model_id ?? "",
      multiplier: d.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, u = n.catalog.presets.find((m) => m.model_id === p.modelId), x = $t(u, p.multiplier, p.modelId === "custom" ? p.customGainCt : void 0), k = p.name !== d.name || p.modelId !== (d.selected_model_id ?? "") || p.multiplier !== d.reporting_multiplier;
    return a`
              <div class="ct-row" data-ct-row data-ct-group=${d.address.group_index - 1} role="row" aria-label=${`CT${d.channel}`}>
                <label><span class="mobile-label">Name</span><input aria-label=${`CT${d.channel} name`} .value=${p.name}
                  @input=${(m) => r(d.channel, { name: m.target.value })} /></label>
                <label><span class="mobile-label">Model</span><select aria-label=${`CT${d.channel} model`}
                  @change=${(m) => r(d.channel, { modelId: m.target.value, expanded: !0 })}>
                  <option value="" ?selected=${p.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((m) => a`<option value=${m.model_id} ?selected=${p.modelId === m.model_id}>${m.label}</option>`)}
                  <option value="custom" ?selected=${p.modelId === "custom"}>Custom</option>
                </select></label>
                <span><span class="mobile-label">Current gain</span>${d.raw_gain_ct}</span>
                <label><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${d.channel} multiplier`}
                  .value=${String(p.multiplier)} @input=${(m) => r(d.channel, { multiplier: Number(m.target.value) })} /></label>
                <span><span class="mobile-label">Resulting gain</span>${x ?? "—"}</span>
                <span><span class="mobile-label">Burden</span>${u?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button class="row-toggle" aria-expanded=${p.expanded} @click=${() => r(d.channel, { expanded: !p.expanded })}>
                  ${p.modelId ? k ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${p.modelId === "custom" ? a`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${d.channel} custom gain`}
                  .value=${p.customGainCt === void 0 ? "" : String(p.customGainCt)}
                  @input=${(m) => r(d.channel, { customGainCt: Number(m.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${d.channel} custom label`} .value=${p.customLabel ?? ""}
                  @input=${(m) => r(d.channel, { customLabel: m.target.value })} /></label>
              </div>` : f}
              ${p.modelId === "custom" || u?.requires_burden_jumper_cut ? a`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${d.channel} burden output acknowledgement`}
                  .checked=${p.burdenAcknowledged}
                  @change=${(m) => r(d.channel, { burdenAcknowledged: m.target.checked })} />
                  I checked the burden-output requirement for CT${d.channel}</label>
              </div>` : f}
              ${u && u.rated_current_a > 65.535 && p.multiplier === 1 ? a`<div class="warning-band" role="status">CT${d.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : f}
              ${p.expanded && u ? a`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${u.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${u.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${u.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${u.notes || (u.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : f}
            `;
  })}
        </div>
      </div>
      <p class="row-count">Showing ${_.length} of ${n.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${c}>Back</button>
        <button class="primary" ?disabled=${!St(n, i)} @click=${l}>Review changes</button>
      </footer>
    </section>
  `;
}
function wt(n, e) {
  return n.channels.flatMap((t) => {
    const i = e.get(t.channel);
    if (!i || !Ie(t, i)) return [];
    const s = n.catalog.presets.find((r) => r.model_id === i.modelId), o = { channel: t.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (o.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (o.custom_label = i.customLabel.trim()), o.burden_output_acknowledged = i.burdenAcknowledged) : s?.requires_burden_jumper_cut && (o.burden_output_acknowledged = i.burdenAcknowledged), [o];
  });
}
function Ie(n, e) {
  return e.name !== n.name || e.modelId !== (n.selected_model_id ?? "") || e.multiplier !== n.reporting_multiplier || e.modelId === "custom" && (e.customGainCt !== n.raw_gain_ct || e.customLabel?.trim() !== (n.display_label ?? ""));
}
function xt(n, e) {
  if (!e.name.trim() || !e.modelId || !Number.isFinite(e.multiplier) || e.multiplier <= 0) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const t = n.catalog.presets.find((i) => i.model_id === e.modelId);
  return !!t && (!t?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function St(n, e) {
  let t = !1;
  for (const i of n.channels) {
    const s = e.get(i.channel);
    if (!s || Ie(i, s) && (t = !0, !xt(n, s)))
      return !1;
  }
  return t;
}
function oe(n) {
  return n ? a`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((e, t) => a`<dl>
      <div><dt>Window ${t + 1} samples</dt><dd>${e.samples.join(", ")}</dd></div>
      <div><dt>Mean</dt><dd>${e.mean}</dd></div>
      <div><dt>Standard deviation</dt><dd>${e.standard_deviation}</dd></div>
      <div><dt>Range</dt><dd>${e.range_percent}%</dd></div>
    </dl>`)}
  </section>` : f;
}
function re(n) {
  return n ? a`<section class="measurement-evidence" aria-label="Calibration evidence">
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
  </section>` : f;
}
function Ct(n, e, t, i, s, o, r, c, l, g, _, d) {
  const p = n?.ct_count ?? e?.channels.length ?? 6, u = Math.floor((t - 1) / 6), x = u * 6 + 1;
  return a`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(p / 6) }, (k, m) => a`<button role="tab" aria-selected=${m === u} @click=${() => r(m * 6 + 1)}>${m === 0 ? "Main Board" : `Add-on ${m}`}</button>`)}
      </div>
      <div class="group-grid">
        ${[0, 3].map((k) => a`<section><h2>Group ${u * 2 + k / 3 + 1}</h2>${Array.from({ length: 3 }, (m, Ne) => {
    const K = x + k + Ne;
    return a`<button class=${K === t ? "selected" : ""} @click=${() => r(K)}>CT${K}</button>`;
  })}</section>`)}
      </div>
      <h2>Calibrate CT${t}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(i)} @input=${(k) => c(Number(k.target.value))} /></label>
      <button class="secondary" @click=${l}>Check stability</button>
      ${s ? a`<div class=${s.stable ? "success-band" : "warning-band"} role="status">${s.stable ? "Stable" : "Retake samples"}</div>` : ""}
      ${oe(s)}
      ${re(o)}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration ${o?.iteration ?? 1} of 3</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${g} ?disabled=${!s?.stable || (o?.iteration ?? 0) >= 3 || !!(o && !o.retry_allowed && o.iteration > 0)}>${o?.retry_allowed ? "Retry calibration" : "Calibrate"} CT${t}</button>
      ${o?.state.includes("indeterminate") ? a`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${_}>Reconnect and inspect</button><button class="danger" @click=${d}>Cancel session</button></aside>` : ""}
    </section>
  `;
}
function kt(n, e, t, i, s) {
  return a`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, and entity bindings.</p>
      <div class="status-band" role="status">${n || "Ready for restart verification"}</div>
      ${e ? a`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div></dl>` : ""}
      ${n === "cancelled" ? a`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${n.includes("failed") || n.includes("indeterminate") ? a`<div class="recovery-panel"><strong>Recovery required</strong><button class="danger" @click=${i}>Review rollback</button></div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${s}>Back</button><button class="primary" @click=${t} ?disabled=${n === "cancelled" || !!e}>${n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function At(n) {
  return n ? n.preflight.issues.length ? a`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((e) => a`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : a`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : a`<p>Starting a calibration session…</p>`;
}
function Et(n, e, t, i, s, o) {
  return a`
    <section class="step-content" aria-labelledby="step-heading">
      ${At(n)}
      ${n?.state === "cancelled" ? a`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
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
const ye = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Tt = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function It(n, e, t, i, s, o) {
  return a`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (r, c) => a`
            <label class=${c === e ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(c)}
                .checked=${c === e} @change=${() => i(c)} />
              <span>${c}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${ye.map(([r, c]) => a`
            <label class=${r === t ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${r}
                .checked=${r === t} @change=${() => s(r)} />
              <span>${c}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>IO0</dt><dd><strong>OPEN</strong> (not connected)</dd></div>
          <div><dt>Add-on boards</dt><dd>${e}</dd></div>
          <div><dt>Connection</dt><dd>${ye.find(([r]) => r === t)?.[1]}</dd></div>
          ${Tt.slice(0, e).map((r, c) => a`<div><dt>Add-on ${c + 1}</dt><dd>${r}</dd></div>`)}
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
      ${n?.devices.length ? "" : a`
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
function Re(n, e, t, i, s, o = null) {
  return a`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((r) => a`<li>${r.source}: ${r.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([r, c]) => a`<div data-target=${r}>${oe(c)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([r, c]) => a`<div data-target=${r}>${re(c)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${t?.evidence.join(", ") || "No build evidence."}</p><p>${t?.progress.join(", ") || "No transaction progress."}</p>
          ${t?.validation_detail ? a`<p>Validation code ${t.validation_detail.code ?? "unavailable"}; ${t.validation_detail.error_record_count} error records; ${t.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${t?.upload_progress?.length ? a`<ul>${t.upload_progress.map((r) => a`<li>${r.stage}: ${r.percentage ?? r.progress ?? "in progress"}${r.percentage != null || r.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Authority source</h3><p>${o?.source_authority.replaceAll("_", " ") ?? "Not yet established"}</p><p>${o ? `Verification ${o.verification_id}, generation ${o.connection_generation}` : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function Rt(n, e, t, i, s, o, r, c) {
  return a`
    <section class="step-content" aria-labelledby="step-heading">
      ${o ? a`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : a`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${r ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${o?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${o?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${Re(n, e, t, i, s, o)}
      <footer class="action-footer"><button class="secondary" @click=${c}>Back</button></footer>
    </section>
  `;
}
function Nt(n) {
  const e = n.addon_count;
  return n.board_count !== e + 1 || n.ct_count !== 6 * (e + 1) || n.group_count !== 2 * (e + 1) || n.evidence.some((t) => t.addon_count !== e);
}
function Pt(n, e, t, i) {
  const s = Nt(n);
  return a`
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
        <tbody>${n.evidence.map((o) => a`
          <tr><td>${o.source.replaceAll("_", " ")}</td><td>${o.addon_count}</td><td>${o.detail}</td></tr>
        `)}</tbody>
      </table>
      ${s ? a`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : a`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${t}>Back</button>
        ${s ? "" : a`<button class="primary" data-action="continue" @click=${i}>Continue</button>`}
      </footer>
    </section>
  `;
}
function Ut(n, e, t, i, s, o, r, c, l, g, _) {
  const d = n?.group_count ?? 2;
  return a`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="target-tabs" role="tablist" aria-label="Voltage groups">
        ${Array.from({ length: d }, (p, u) => a`<button role="tab" aria-selected=${u === e} @click=${() => o(u)}>Group ${u + 1}</button>`)}
      </div>
      <h2>Calibrate voltage group ${e + 1}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(t)} @input=${(p) => r(Number(p.target.value))} /></label>
      <button class="secondary" @click=${c}>Check stability</button>
      ${i ? a`<div class=${i.stable ? "success-band" : "warning-band"} role="status">${i.stable ? "Stable sample window" : "Samples are not stable yet"}</div>` : ""}
      ${oe(i)}
      ${re(s)}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${l} ?disabled=${!i?.stable || !!(s && !s.retry_allowed && s.iteration > 0)}> ${s?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      ${s?.state === "indeterminate" ? a`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${g}>Reconnect and inspect</button><button class="danger" @click=${_}>Cancel session</button></aside>` : ""}
    </section>
  `;
}
const Ot = Ue`
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
`, I = [
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
class Mt extends D {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.ctGroup = 0, this.group = 0, this.channel = 1, this.reference = 0, this.safetyAcknowledged = !1, this.drafts = /* @__PURE__ */ new Map(), this.error = "", this.announcement = "", this.unsubs = [], this.connectionGeneration = 0, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = Ot;
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
    ++this.connectionGeneration;
    for (const e of this.unsubs.splice(0))
      try {
        e();
      } catch {
      }
    this.api = null, super.disconnectedCallback();
  }
  updated(e) {
    (e.has("hass") || e.has("panel")) && this.isConnected && this.ensureApi(this.connectionGeneration), this.error ? this.shadowRoot?.querySelector("[role=alert]")?.focus() : this.focusHeading && (this.focusHeading = !1, this.shadowRoot?.querySelector("#step-heading")?.focus());
  }
  async ensureApi(e) {
    if (this.api || !this.isConnected || !this.hass || !this.panel?.config.entry_id) return;
    const t = new L(this.hass, this.panel.config.entry_id);
    this.api = t;
    try {
      const i = await t.setupStatus();
      if (!this.owns(e, t)) return;
      this.setup = i;
      const s = this.setup.installer_intent;
      s && (this.addonCount = s.addon_count, this.connection = s.connection_type), this.setup.devices.length && (this.selectedDeviceId = this.setup.devices[0]?.entry_id ?? null), await this.ownSubscription(t.subscribeSetup((o) => {
        this.owns(e, t) && (this.setup = o, !this.selectedDeviceId && o.devices.length && (this.selectedDeviceId = o.devices[0]?.entry_id ?? null), this.requestUpdate());
      }), e, t), this.transaction && await this.subscribeTransaction(e), this.session && this.session.state !== "cancelled" && await this.subscribeSession(e);
    } catch (i) {
      this.owns(e, t) && this.fail(i, "Setup status could not be loaded.");
    }
    this.requestUpdate();
  }
  owns(e, t) {
    return this.isConnected && e === this.connectionGeneration && t === this.api;
  }
  async ownSubscription(e, t, i) {
    const s = await e;
    if (!this.owns(t, i)) {
      try {
        s();
      } catch {
      }
      return;
    }
    this.unsubs.push(s);
  }
  showTopology(e) {
    this.topology = e, this.navigate("topology"), this.error = e.evidence.some((t) => t.addon_count !== e.addon_count) || e.ct_count !== 6 * e.board_count || e.group_count !== 2 * e.board_count ? "Topology mismatch" : "", this.requestUpdate();
  }
  showInventory(e) {
    this.inventory = e, this.drafts = new Map(e.channels.map((t) => [t.channel, {
      name: t.name,
      modelId: t.selected_model_id ?? "",
      multiplier: t.reporting_multiplier,
      customGainCt: t.selected_model_id === null ? t.raw_gain_ct : void 0,
      customLabel: t.display_label ?? void 0,
      burdenAcknowledged: !1,
      expanded: t.selected_model_id === null && t.raw_gain_ct === 27518
    }])), this.navigate("ct"), this.error = "", this.requestUpdate();
  }
  showState(e) {
    this.navigate(e);
  }
  navigate(e) {
    this.step = e, this.error = "", this.mobileStepsOpen = !1, this.focusHeading = !0, this.requestUpdate();
  }
  back() {
    const e = I.findIndex(([t]) => t === this.step);
    e > 0 && this.navigate(I[e - 1][0]);
  }
  selectedProjectVersion() {
    return this.setup?.devices.find((e) => e.entry_id === this.selectedDeviceId)?.project_version ?? null;
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
      retry_allowed: !1
    })) : (this.navigate("restart"), this.session ? this.session = { ...this.session, state: e } : this.error = "Restart verification failed; review rollback and recovery evidence."), this.requestUpdate();
  }
  async rescan() {
    if (!this.api) return;
    const e = this.api;
    await this.run(async () => {
      await e.setInstallerIntent(this.addonCount, this.connection);
      const t = await e.rescan();
      this.setup = t, t.devices.length ? (this.selectedDeviceId = t.devices[0]?.entry_id ?? null, this.navigate("discover"), this.announcement = "Compatible meter discovered.") : this.announcement = "No compatible meter found. Check the network and rescan.";
    }, "Rescan failed.");
  }
  async adopt() {
    !this.api || !this.selectedDeviceId || await this.run(async () => {
      await this.api?.adoptDevice(this.selectedDeviceId), this.announcement = "Meter adopted in Device Builder.";
    }, "Adoption is unavailable for this meter.");
  }
  async loadTopology() {
    !this.api || !this.selectedDeviceId || await this.run(async () => {
      const e = await this.api?.getTopology(this.selectedDeviceId);
      e && this.showTopology("topology" in e ? e.topology : e);
    }, "Topology evidence could not be loaded.");
  }
  async loadInventory() {
    !this.api || !this.selectedDeviceId || await this.run(async () => {
      const e = await this.api?.getCtInventory(this.selectedDeviceId);
      e && this.showInventory(e);
    }, "CT inventory could not be loaded.");
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
    const e = wt(this.inventory, this.drafts);
    if (!e.length) return this.fail(new Error(), "Select at least one CT change before review.");
    await this.run(async () => {
      this.transaction = await this.api?.previewCtConfig(
        this.selectedDeviceId,
        this.inventory.plan_id,
        this.inventory.source_sha256,
        e
      ) ?? null, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration);
    }, "The configuration preview is stale. Reload the CT inventory and review again.");
  }
  async subscribeTransaction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const t = this.api;
    await this.ownSubscription(t.subscribeConfigTransaction(
      this.selectedDeviceId,
      this.transaction.transaction_id,
      this.transaction.source_sha256,
      (i) => {
        this.owns(e, t) && (this.transaction = i, this.requestUpdate());
      }
    ), e, t);
  }
  async transactionAction(e) {
    !this.api || !this.transaction || !this.selectedDeviceId || await this.run(async () => {
      const t = [this.selectedDeviceId, this.transaction.transaction_id, this.transaction.source_sha256];
      this.transaction = e === "apply" ? await this.api.applyCtConfig(...t) : e === "compile" ? await this.api.compileCtConfig(...t) : e === "install" ? await this.api.installCtConfig(...t) : await this.api.rollbackCtConfig(...t), this.announcement = `Configuration ${this.transaction.state}.`;
    }, "This confirmation is stale. Reload the CT inventory before making another change.");
  }
  async startSession() {
    !this.api || !this.selectedDeviceId || await this.run(async () => {
      this.session = await this.api.startSession(this.selectedDeviceId), this.navigate("safety"), await this.subscribeSession(this.connectionGeneration);
    }, "Calibration session could not be started.");
  }
  async subscribeSession(e) {
    if (!this.api || !this.session) return;
    const t = this.api;
    await this.ownSubscription(t.subscribeSession(this.session.session_id, (i) => {
      this.owns(e, t) && (this.session = i, this.requestUpdate());
    }), e, t);
  }
  async acknowledgeSafety() {
    !this.api || !this.session || await this.run(async () => {
      this.session = await this.api.acknowledgeSafety(this.session.session_id), this.navigate("voltage");
    }, "Safety acknowledgement could not be accepted.");
  }
  async checkStability(e) {
    if (!this.api || !this.session) return;
    const t = e === "voltage" ? this.groupKey(this.group) : String(this.channel);
    await this.run(async () => {
      const i = await this.api.checkStability(this.session.session_id, e, t);
      this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${t}`, i);
    }, "Stable samples could not be collected.");
  }
  async calibrate(e) {
    if (!this.api || !this.session) return;
    const t = e === "voltage" ? this.groupKey(this.group) : String(this.channel);
    await this.run(async () => {
      const i = e === "voltage" ? await this.api.calibrateVoltage(this.session.session_id, this.groupKey(this.group), this.reference, !0) : await this.api.calibrateCurrent(this.session.session_id, this.channel, this.reference, !0);
      this.calibrationByTarget = new Map(this.calibrationByTarget).set(`${e}:${t}`, i), this.announcement = `Calibration iteration ${i.iteration} finished with state ${i.state}.`;
    }, "Calibration did not complete. Reconnect and inspect before another attempt.");
  }
  groupKey(e) {
    const t = Math.floor(e / 2), i = e % 2 + 1;
    return t === 0 ? `meter_main${i}` : `addon${t}_${i}`;
  }
  async restart() {
    !this.api || !this.session || await this.run(async () => {
      this.restartResult = await this.api.restartAndVerify(this.session.session_id), this.session = { ...this.session, state: "verified" }, this.navigate("summary");
    }, "Restart verification failed; review recovery evidence before rollback.");
  }
  async cancelSession() {
    !this.api || !this.session || await this.run(async () => {
      this.session = await this.api.cancelSession(this.session.session_id), this.restartResult = null, this.navigate("safety"), this.announcement = "Calibration session cancelled; cleanup completed without restart verification.";
    }, "The session cleanup could not be confirmed.");
  }
  async reconnectSession() {
    !this.api || !this.session || await this.run(async () => {
      this.session = await this.api.getSession(this.session.session_id), this.announcement = `Session reconnected with state ${this.session.state}.`;
    }, "Session reconnection failed. Retry only after checking the meter connection.");
  }
  resultFor(e) {
    const t = e === "voltage" ? this.groupKey(this.group) : String(this.channel);
    return this.calibrationByTarget.get(`${e}:${t}`) ?? null;
  }
  stabilityFor(e) {
    const t = e === "voltage" ? this.groupKey(this.group) : String(this.channel);
    return this.stabilityByTarget.get(`${e}:${t}`) ?? null;
  }
  async run(e, t) {
    this.error = "";
    try {
      await e();
    } catch (i) {
      const s = i.code;
      this.fail(i, s === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : t);
    }
    this.requestUpdate();
  }
  fail(e, t) {
    this.error = t, this.announcement = t, this.requestUpdate();
  }
  stepBody() {
    return this.step === "setup" ? It(
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
    ) : this.step === "discover" ? _t(
      this.setup?.devices ?? [],
      this.selectedDeviceId,
      (e) => {
        this.selectedDeviceId = e, this.requestUpdate();
      },
      () => {
        this.adopt();
      },
      () => this.back(),
      () => {
        this.loadTopology();
      }
    ) : this.step === "topology" && this.topology ? Pt(this.topology, this.selectedProjectVersion(), () => this.back(), () => {
      this.loadInventory();
    }) : this.step === "ct" && this.inventory ? yt(
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
      }
    ) : this.step === "build" ? vt(
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
    ) : this.step === "safety" ? Et(
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
    ) : this.step === "voltage" ? a`${Ut(
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? a`${Ct(
      this.topology,
      this.inventory,
      this.channel,
      this.reference,
      this.stabilityFor("current"),
      this.resultFor("current"),
      (e) => {
        this.channel = e, this.requestUpdate();
      },
      (e) => {
        this.reference = e, this.requestUpdate();
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("restart")}>Continue</button></footer>` : this.step === "restart" ? kt(this.session?.state ?? this.error, this.restartResult, () => {
      this.restart();
    }, () => {
      this.transactionAction("rollback");
    }, () => this.back()) : Rt(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.selectedProjectVersion(), () => this.back());
  }
  render() {
    const e = I.findIndex(([t]) => t === this.step);
    return a`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${I.map(([t, i], s) => a`
            <li class=${s === e ? "current" : ""}>
              <button class="step-button" aria-current=${s === e ? "step" : f} ?disabled=${s > e}
                @click=${() => s <= e && this.navigate(t)}><span class="number">${s + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${e + 1} of 10 — ${I[e]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${I[e]?.[1]}</h1>
          ${this.error ? a`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : f}
          ${this.stepBody()}
          ${e >= 4 && this.step !== "summary" ? Re(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult) : f}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", Mt);
export {
  Mt as CircuitSetupPanel
};
