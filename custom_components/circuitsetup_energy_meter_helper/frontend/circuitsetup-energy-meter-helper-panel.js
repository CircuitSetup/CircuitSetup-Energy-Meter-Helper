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
const ei = (n) => new kt(typeof n == "string" ? n : n + "", void 0, ze), ti = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, s, r) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[r + 1], n[0]);
  return new kt(t, n, ze);
}, ii = (n, e) => {
  if (Fe) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = we.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, n.appendChild(i);
  }
}, Qe = Fe ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return ei(t);
})(n) : n;
const { is: si, defineProperty: ni, getOwnPropertyDescriptor: ri, getOwnPropertyNames: oi, getOwnPropertySymbols: ai, getPrototypeOf: ci } = Object, ke = globalThis, et = ke.trustedTypes, li = et ? et.emptyScript : "", di = ke.reactiveElementPolyfillSupport, de = (n, e) => n, Pe = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? li : null;
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
} }, At = (n, e) => !si(n, e), tt = { attribute: !0, type: String, converter: Pe, reflect: !1, useDefault: !1, hasChanged: At };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), ke.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
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
      s !== void 0 && ni(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: r } = ri(this.prototype, e) ?? { get() {
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
    const e = ci(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(de("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(de("properties"))) {
      const t = this.properties, i = [...oi(t), ...ai(t)];
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
    return ii(e, this.constructor.elementStyles), e;
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
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : Pe).toAttribute(t, i.type);
      this._$Em = e, r == null ? this.removeAttribute(s) : this.setAttribute(s, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const r = i.getPropertyOptions(s), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : Pe;
      this._$Em = s;
      const a = o.fromAttribute(t, r.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, r) {
    if (e !== void 0) {
      const o = this.constructor;
      if (s === !1 && (r = this[e]), i ??= o.getPropertyOptions(e), !((i.hasChanged ?? At)(r, t) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, i)))) return;
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
re.elementStyles = [], re.shadowRootOptions = { mode: "open" }, re[de("elementProperties")] = /* @__PURE__ */ new Map(), re[de("finalized")] = /* @__PURE__ */ new Map(), di?.({ ReactiveElement: re }), (ke.reactiveElementVersions ??= []).push("2.1.2");
const He = globalThis, it = (n) => n, $e = He.trustedTypes, st = $e ? $e.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Et = "$lit$", K = `lit$${Math.random().toFixed(9).slice(2)}$`, xt = "?" + K, hi = `<${xt}>`, te = document, ue = () => te.createComment(""), fe = (n) => n === null || typeof n != "object" && typeof n != "function", Le = Array.isArray, pi = (n) => Le(n) || typeof n?.[Symbol.iterator] == "function", Oe = `[\x20\t
\f\r]`, ce = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, nt = /-->/g, rt = />/g, X = RegExp(`>|${Oe}(?:([^\\s"'>=/]+)(${Oe}*=${Oe}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), ot = /'/g, at = /"/g, It = /^(?:script|style|textarea|title)$/i, ui = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), p = ui(1), Y = /* @__PURE__ */ Symbol.for("lit-noChange"), R = /* @__PURE__ */ Symbol.for("lit-nothing"), ct = /* @__PURE__ */ new WeakMap(), Q = te.createTreeWalker(te, 129);
function Tt(n, e) {
  if (!Le(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return st !== void 0 ? st.createHTML(e) : e;
}
const fi = (n, e) => {
  const t = n.length - 1, i = [];
  let s, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = ce;
  for (let a = 0; a < t; a++) {
    const l = n[a];
    let c, u, d = -1, g = 0;
    for (; g < l.length && (o.lastIndex = g, u = o.exec(l), u !== null); ) g = o.lastIndex, o === ce ? u[1] === "!--" ? o = nt : u[1] !== void 0 ? o = rt : u[2] !== void 0 ? (It.test(u[2]) && (s = RegExp("</" + u[2], "g")), o = X) : u[3] !== void 0 && (o = X) : o === X ? u[0] === ">" ? (o = s ?? ce, d = -1) : u[1] === void 0 ? d = -2 : (d = o.lastIndex - u[2].length, c = u[1], o = u[3] === void 0 ? X : u[3] === '"' ? at : ot) : o === at || o === ot ? o = X : o === nt || o === rt ? o = ce : (o = X, s = void 0);
    const b = o === X && n[a + 1].startsWith("/>") ? " " : "";
    r += o === ce ? l + hi : d >= 0 ? (i.push(c), l.slice(0, d) + Et + l.slice(d) + K + b) : l + K + (d === -2 ? a : b);
  }
  return [Tt(n, r + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class ge {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let r = 0, o = 0;
    const a = e.length - 1, l = this.parts, [c, u] = fi(e, t);
    if (this.el = ge.createElement(c, i), Q.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = Q.nextNode()) !== null && l.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(Et)) {
          const g = u[o++], b = s.getAttribute(d).split(K), h = /([.?@])?(.*)/.exec(g);
          l.push({ type: 1, index: r, name: h[2], strings: b, ctor: h[1] === "." ? _i : h[1] === "?" ? mi : h[1] === "@" ? vi : Ae }), s.removeAttribute(d);
        } else d.startsWith(K) && (l.push({ type: 6, index: r }), s.removeAttribute(d));
        if (It.test(s.tagName)) {
          const d = s.textContent.split(K), g = d.length - 1;
          if (g > 0) {
            s.textContent = $e ? $e.emptyScript : "";
            for (let b = 0; b < g; b++) s.append(d[b], ue()), Q.nextNode(), l.push({ type: 2, index: ++r });
            s.append(d[g], ue());
          }
        }
      } else if (s.nodeType === 8) if (s.data === xt) l.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(K, d + 1)) !== -1; ) l.push({ type: 7, index: r }), d += K.length - 1;
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
class gi {
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
    let r = Q.nextNode(), o = 0, a = 0, l = i[0];
    for (; l !== void 0; ) {
      if (o === l.index) {
        let c;
        l.type === 2 ? c = new _e(r, r.nextSibling, this, e) : l.type === 1 ? c = new l.ctor(r, l.name, l.strings, this, e) : l.type === 6 && (c = new bi(r, this, e)), this._$AV.push(c), l = i[++a];
      }
      o !== l?.index && (r = Q.nextNode(), o++);
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
    e = ae(this, e, t), fe(e) ? e === R || e == null || e === "" ? (this._$AH !== R && this._$AR(), this._$AH = R) : e !== this._$AH && e !== Y && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : pi(e) ? this.k(e) : this._(e);
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
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = ge.createElement(Tt(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const r = new gi(s, this), o = r.u(this.options);
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
      let l, c;
      for (e = r[0], l = 0; l < r.length - 1; l++) c = ae(this, a[i + l], t, l), c === Y && (c = this._$AH[l]), o ||= !fe(c) || c !== this._$AH[l], c === R ? e = R : e !== R && (e += (c ?? "") + r[l + 1]), this._$AH[l] = c;
    }
    o && !s && this.j(e);
  }
  j(e) {
    e === R ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class _i extends Ae {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === R ? void 0 : e;
  }
}
class mi extends Ae {
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
class bi {
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
const wi = He.litHtmlPolyfillSupport;
wi?.(ge, _e), (He.litHtmlVersions ??= []).push("3.3.3");
const $i = (n, e, t) => {
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = $i(t, this.renderRoot, this.renderOptions);
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
const yi = je.litElementPolyfillSupport;
yi?.({ LitElement: he });
(je.litElementVersions ??= []).push("4.2.2");
const lt = "circuitsetup_energy_meter_helper/", Si = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, Ci = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, ki = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, Ai = /[\u0000-\u001f\u007f-\u009f]/, Ei = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), xi = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), Ii = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "partial", "indeterminate", "verified", "cancelled"]), Ve = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), Rt = /* @__PURE__ */ new Set(["split_phase_120_240", "single_phase_230", "three_phase", "custom"]), dt = /* @__PURE__ */ new Set(["standard", "multi_reference", "custom"]), ht = /* @__PURE__ */ new Set(["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"]), Ti = /* @__PURE__ */ new Set(["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"]), Ri = /* @__PURE__ */ new Set(["none", "consumption", "bidirectional", "generation"]), Oi = /* @__PURE__ */ new Set([1, 2, 5, 10, 30, 60]), pt = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), ye = /* @__PURE__ */ new Set(["A", "B", "C"]), Mi = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), Pi = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), qi = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), Ui = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), Di = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), Ni = /^(?:meter|voltage_reference|channel|aggregate|package)\.[a-z0-9_.-]+$/, Bi = /^[0-9a-f]{12}$/, Ee = /^[0-9a-f]{64}$/, qe = /^[0-9a-f]{32}$/, Fi = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, Ot = /^[a-z0-9][a-z0-9_-]{0,127}$/, Mt = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, ut = /* @__PURE__ */ new Set(["preview_ct_config", "preview_meter_configuration", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]), zi = /* @__PURE__ */ new Set(["available", "unavailable", "invalid"]), Hi = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial"]), Li = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial", "indeterminate"]), ji = /* @__PURE__ */ new Set(["applied_pending_restart_verification", "partial", "indeterminate"]);
function k(n, e) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function A(n, e, t = 100) {
  if (!Array.isArray(n) || n.length > t) throw new Error(`${e} response is invalid`);
  return n;
}
function w(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${e} response is invalid`);
  return n;
}
function L(n, e) {
  const t = w(n, e);
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
  const i = w(n, t);
  if (!e.has(i)) throw new Error(`${t} response is invalid`);
  return i;
}
function Ue(n, e) {
  n !== void 0 && w(n, e, !0);
}
function V(n, e) {
  return Math.abs(n - e) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(e));
}
function U(n, e, t) {
  const i = Object.keys(n);
  if (i.length !== e.length || i.some((s) => !e.includes(s))) throw new Error(`${t} response is invalid`);
}
function ee(n, e) {
  return n.length === e.length && n.every((t, i) => t === e[i]);
}
function Pt(n, e) {
  const t = k(n, e);
  w(t.entry_id, e), w(t.title, e), w(t.project_name, e), w(t.project_version, e, !0), D(t.importable, e, !0), w(t.configuration, e, !0);
}
function be(n, e) {
  const t = k(n, e);
  if (N(t.state, Ei, e), A(t.devices, e).forEach((i) => Pt(i, e)), t.configuration_authoritative !== void 0 && D(t.configuration_authoritative, e), t.bound_device_id !== void 0 && t.bound_device_id !== null && w(t.bound_device_id, e), t.installer_intent !== void 0) {
    const i = k(t.installer_intent, e), s = E(i.addon_count, e);
    if (s < 0 || s > 6) throw new Error(`${e} response is invalid`);
    if (N(i.connection_type, Ve, e) === "unknown") throw new Error(`${e} response is invalid`);
    if (i.power_quality === void 0 != (i.status_fields === void 0))
      throw new Error(`${e} response is invalid`);
    i.power_quality !== void 0 && qt(i, e, s + 1);
    const o = i.firmware_product_id, a = i.esphome_version;
    if (o === void 0 != (a === void 0) || o !== void 0 && (typeof o != "string" || o.length > 160 || !Ot.test(o)) || a !== void 0 && (typeof a != "string" || a.length > 160 || !Mt.test(a)))
      throw new Error(`${e} response is invalid`);
    if (i.electrical_system === void 0 != (i.line_frequency_hz === void 0) || i.electrical_system !== void 0 && (!Rt.has(i.electrical_system) || ![50, 60].includes(E(i.line_frequency_hz, e))))
      throw new Error(`${e} response is invalid`);
  }
  return n;
}
function De(n, e) {
  const t = k(n, e);
  U(t, ["addon_count", "board_count", "ct_count", "group_count", "connection_type", "voltage_layout", "project_name", "evidence"], e);
  const i = E(t.addon_count, e), s = E(t.board_count, e), r = E(t.ct_count, e), o = E(t.group_count, e);
  if (i < 0 || i > 6 || s < 1 || s > 7 || r < 6 || r > 42 || o < 2 || o > 14 || s !== i + 1 || r !== 6 * s || o !== 2 * s) throw new Error(`${e} response is invalid`);
  N(t.connection_type, Ve, e), w(t.voltage_layout, e), w(t.project_name, e);
  const a = A(t.evidence, e);
  if (a.length < 1 || a.length > pt.size) throw new Error(`${e} response is invalid`);
  const l = a.map((c) => {
    const u = k(c, e);
    U(u, ["source", "addon_count", "detail"], e);
    const d = N(u.source, pt, e), g = E(u.addon_count, e);
    if (g < 0 || g > 6) throw new Error(`${e} response is invalid`);
    return w(u.detail, e), d;
  });
  if (new Set(l).size !== l.length || !l.some((c) => Di.has(c))) throw new Error(`${e} response is invalid`);
  return n;
}
function Vi(n, e) {
  const t = k(n, e);
  if ("topology" in t) {
    const i = De(t.topology, e);
    return t.configuration_authoritative !== void 0 && D(t.configuration_authoritative, e), t.package_options !== void 0 && qt(t.package_options, e, i.board_count), n;
  }
  return De(n, e);
}
function Gi(n, e) {
  const t = k(n, e);
  U(t, ["plan_id", "source_sha256", "topology", "configuration", "capabilities", "voltage_topology", "voltage_transformer_catalog", "ct_catalog", "warnings", "channels", "catalog"], e);
  const i = w(t.plan_id, e);
  if (!qe.test(i) || !Ee.test(w(t.source_sha256, e))) throw new Error(`${e} response is invalid`);
  const s = De(t.topology, e), r = k(t.configuration, e);
  U(r, ["meter", "channels", "aggregates", "power_quality", "status_fields", "multi_reference_preparation_acknowledged"], e);
  const o = k(r.meter, e);
  U(o, ["friendly_name", "electrical_system", "line_frequency_hz", "update_interval_s", "voltage_layout", "voltage_references"], e), w(o.friendly_name, e), N(o.electrical_system, Rt, e);
  const a = E(o.line_frequency_hz, e);
  if (a !== 50 && a !== 60) throw new Error(`${e} response is invalid`);
  const l = E(o.update_interval_s, e);
  if (!Oi.has(l) || !dt.has(N(o.voltage_layout, dt, e))) throw new Error(`${e} response is invalid`);
  const c = A(o.voltage_references, e, 8).map((y) => {
    const $ = k(y, e);
    U($, ["reference_id", "label", "phase_label", "nominal_voltage_v", "transformer_model_id", "gain_voltage", "group_keys"], e);
    const O = L($.reference_id, e), S = w($.label, e);
    w($.phase_label, e);
    const M = q($.nominal_voltage_v, e);
    if (M < 1 || M > 600) throw new Error(`${e} response is invalid`);
    L($.transformer_model_id, e);
    const I = E($.gain_voltage, e);
    if (I < 1 || I > 65535) throw new Error(`${e} response is invalid`);
    const B = A($.group_keys, e, 14).map((F) => L(F, e));
    if (!B.length) throw new Error(`${e} response is invalid`);
    return { reference_id: O, label: S, group_keys: B };
  });
  if (!c.length || new Set(c.map((y) => y.reference_id)).size !== c.length)
    throw new Error(`${e} response is invalid`);
  const u = Array.from({ length: s.board_count }, (y, $) => $ === 0 ? ["main_1", "main_2"] : [`addon${$}_1`, `addon${$}_2`]).flat(), d = c.flatMap((y) => y.group_keys);
  if (d.length !== s.group_count || new Set(d).size !== d.length || !ee([...d].sort(), [...u].sort())) throw new Error(`${e} response is invalid`);
  const g = A(r.channels, e, 42);
  if (g.length !== s.ct_count) throw new Error(`${e} response is invalid`);
  g.forEach((y, $) => {
    const O = k(y, e);
    if (U(O, ["channel", "enabled", "name", "model_id", "reporting_multiplier", "role", "voltage_reference_id", "custom_gain_ct", "custom_label", "burden_output_acknowledged"], e), E(O.channel, e) !== $ + 1 || ![1, 2, 4, 8].includes(q(O.reporting_multiplier, e)) || !c.some((I) => I.reference_id === L(O.voltage_reference_id, e))) throw new Error(`${e} response is invalid`);
    const S = D(O.enabled, e);
    w(O.name, e), L(O.model_id, e);
    const M = N(O.role, ht, e);
    if (S && M === "unused" || !S && M !== "unused") throw new Error(`${e} response is invalid`);
    if (O.custom_gain_ct !== null && (E(O.custom_gain_ct, e) < 1 || E(O.custom_gain_ct, e) > 65535)) throw new Error(`${e} response is invalid`);
    O.custom_label !== null && w(O.custom_label, e), D(O.burden_output_acknowledged, e);
  });
  const b = /* @__PURE__ */ new Set(), h = /* @__PURE__ */ new Set(), f = /* @__PURE__ */ new Map();
  A(r.aggregates, e, 32).forEach((y) => {
    const $ = k(y, e);
    U($, ["aggregate_id", "name", "role", "channels", "measurement_method", "parent_id", "energy_mode", "expose_power", "expose_current"], e);
    const O = L($.aggregate_id, e);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(O) || b.has(O)) throw new Error(`${e} response is invalid`);
    b.add(O), w($.name, e), N($.role, ht, e);
    const S = A($.channels, e, 42).map((F) => E(F, e)), M = N($.measurement_method, Ti, e), I = M === "two_ct_sum" ? 2 : M === "one_ct_double_power" || M === "both_conductors_one_ct" ? 1 : void 0;
    if (!S.length || new Set(S).size !== S.length || S.some((F) => F < 1 || F > s.ct_count || h.has(F) || !D(k(g[F - 1], e).enabled, e)) || I !== void 0 && S.length !== I) throw new Error(`${e} response is invalid`);
    S.forEach((F) => h.add(F));
    const B = $.parent_id === null ? null : L($.parent_id, e);
    f.set(O, B), N($.energy_mode, Ri, e), D($.expose_power, e), D($.expose_current, e);
  });
  for (const [y, $] of f) {
    const O = /* @__PURE__ */ new Set();
    for (let S = $; S !== null; S = f.get(S) ?? null) {
      if (!b.has(S) || S === y || O.has(S)) throw new Error(`${e} response is invalid`);
      O.add(S);
    }
  }
  for (const y of ["power_quality", "status_fields"]) {
    const $ = A(r[y], e, 7);
    if ($.length !== s.board_count) throw new Error(`${e} response is invalid`);
    $.forEach((O) => D(O, e));
  }
  D(r.multi_reference_preparation_acknowledged, e);
  const _ = k(t.capabilities, e);
  U(_, ["configuration_authoritative", "managed_totals", "multi_reference", "reason_codes"], e), D(_.configuration_authoritative, e), D(_.managed_totals, e), D(_.multi_reference, e), A(_.reason_codes, e, 8).forEach((y) => w(y, e));
  const C = k(t.voltage_topology, e);
  U(C, ["references", "source"], e), N(C.source, /* @__PURE__ */ new Set(["helper", "legacy"]), e);
  const x = A(C.references, e, 8).map((y) => {
    const $ = A(y, e, 2);
    if ($.length !== 2) throw new Error(`${e} response is invalid`);
    const O = L($[0], e), S = A($[1], e, 14).map((M) => L(M, e));
    if (!S.length) throw new Error(`${e} response is invalid`);
    return [O, S];
  });
  if (x.length !== c.length || !ee(x.map(([y]) => y), c.map((y) => y.reference_id)) || !x.every(([y, $], O) => ee($, c[O].group_keys))) throw new Error(`${e} response is invalid`);
  const m = k(t.voltage_transformer_catalog, e);
  if (U(m, ["presets", "source_repository", "source_ref", "schema_version"], e), w(m.source_repository, e), !/^[0-9a-f]{40}$/.test(w(m.source_ref, e)) || E(m.schema_version, e) !== 1) throw new Error(`${e} response is invalid`);
  const v = A(m.presets, e, 64);
  if (!v.length) throw new Error(`${e} response is invalid`);
  const P = /* @__PURE__ */ new Set();
  v.forEach((y) => {
    const $ = k(y, e);
    U($, ["model_id", "label", "primary_nominal_v", "secondary_nominal_v", "default_gain_voltage", "notes"], e);
    const O = L($.model_id, e);
    if (P.has(O)) throw new Error(`${e} response is invalid`);
    if (P.add(O), w($.label, e), q($.primary_nominal_v, e) <= 0 || q($.secondary_nominal_v, e) <= 0) throw new Error(`${e} response is invalid`);
    const S = E($.default_gain_voltage, e);
    if (S < 1 || S > 65535) throw new Error(`${e} response is invalid`);
    w($.notes, e);
  }), Ne({ plan_id: t.plan_id, source_sha256: t.source_sha256, channels: t.channels, catalog: t.catalog }, e);
  const T = k(t.ct_catalog, e);
  return U(T, ["presets", "source_repository", "source_ref", "schema_version"], e), Ne({ plan_id: t.plan_id, source_sha256: t.source_sha256, channels: t.channels, catalog: t.ct_catalog }, e), A(t.warnings, e, 32).map((y) => w(y, e)), n;
}
function qt(n, e, t) {
  const i = k(n, e);
  for (const s of ["power_quality", "status_fields"]) {
    const r = A(i[s], e, 7);
    if (r.length !== t) throw new Error(`${e} response is invalid`);
    r.forEach((o) => D(o, e));
  }
  return n;
}
function Ne(n, e) {
  const t = k(n, e);
  if (U(t, ["plan_id", "source_sha256", "channels", "catalog"], e), w(t.plan_id, e), !Ee.test(w(t.source_sha256, e))) throw new Error(`${e} response is invalid`);
  const i = A(t.channels, e);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${e} response is invalid`);
  i.forEach((o, a) => {
    const l = k(o, e);
    U(l, ["channel", "name", "raw_gain_ct", "reporting_multiplier", "selected_model_id", "selection_verified_against_config", "address", "display_label", "stored_selection_present"], e);
    const c = E(l.channel, e);
    w(l.name, e), E(l.raw_gain_ct, e), q(l.reporting_multiplier, e), Ue(l.selected_model_id, e), D(l.selection_verified_against_config, e), Ue(l.display_label, e), D(l.stored_selection_present, e);
    const u = k(l.address, e);
    U(u, ["channel", "board_index", "group_index", "phase"], e);
    const d = E(u.channel, e), g = E(u.board_index, e), b = E(u.group_index, e), h = N(u.phase, ye, e), f = a + 1;
    if (c !== f || d !== f || g !== Math.floor(a / 6) || b !== Math.floor(a % 6 / 3) || h !== ["A", "B", "C"][a % 3]) throw new Error(`${e} response is invalid`);
  });
  const s = k(t.catalog, e);
  U(s, ["presets", "source_repository", "source_ref", "schema_version"], e), w(s.source_repository, e), w(s.source_ref, e), E(s.schema_version, e);
  const r = A(s.presets, e);
  if (r.length > 64) throw new Error(`${e} response is invalid`);
  return r.forEach((o) => {
    const a = k(o, e);
    U(a, ["model_id", "label", "rated_current_a", "secondary", "default_gain_ct", "requires_burden_jumper_cut", "notes"], e), w(a.model_id, e), w(a.label, e), q(a.rated_current_a, e), w(a.secondary, e), a.default_gain_ct !== null && E(a.default_gain_ct, e), D(a.requires_burden_jumper_cut, e), w(a.notes, e);
  }), n;
}
function oe(n, e) {
  const t = k(n, e);
  if (U(t, ["transaction_id", "state", "source_sha256", "changes", "redacted_diff", "rollback_available", "evidence", "progress", "validation_detail", "upload_progress", "aggregate_entity_mismatch", "full_meter_configuration_verified"], e), w(t.transaction_id, e), N(t.state, xi, e), !Ee.test(w(t.source_sha256, e))) throw new Error(`${e} response is invalid`);
  if (D(t.rollback_available, e), typeof t.redacted_diff != "string") throw new Error(`${e} response is invalid`);
  if (A(t.changes, e).forEach((i) => {
    const s = k(i, e);
    U(s, ["key", "old_value", "new_value"], e);
    const r = w(s.key, e);
    if (!Ni.test(r)) throw new Error(`${e} response is invalid`);
    s.old_value !== null && w(s.old_value, e), w(s.new_value, e);
  }), A(t.evidence, e).forEach((i) => N(i, Pi, e)), A(t.progress, e).forEach((i) => N(i, qi, e)), t.validation_detail !== null) {
    const i = k(t.validation_detail, e);
    U(i, ["code", "reported_error_count", "reported_warning_count", "error_record_count", "warning_record_count"], e);
    for (const s of ["reported_error_count", "reported_warning_count"]) i[s] !== null && E(i[s], e);
    i.code !== null && E(i.code, e), E(i.error_record_count, e), E(i.warning_record_count, e);
  }
  return A(t.upload_progress, e).forEach((i) => {
    const s = k(i, e);
    if (U(s, ["stage", "percentage"], e), N(s.stage, Mi, e), s.percentage !== null) {
      const r = E(s.percentage, e);
      if (r < 0 || r > 100) throw new Error(`${e} response is invalid`);
    }
  }), D(t.aggregate_entity_mismatch, e), D(t.full_meter_configuration_verified, e), n;
}
function G(n, e) {
  const t = k(n, e);
  w(t.session_id, e), w(t.device_id, e), N(t.state, Ii, e), D(t.safety_acknowledged, e);
  const i = k(t.preflight, e);
  A(i.issues, e).forEach((d) => {
    const g = k(d, e);
    N(g.code, Ui, e), w(g.role, e), w(g.detail, e);
  }), A(i.zeroed_roles, e).forEach((d) => w(d, e)), t.entity_role_counts !== void 0 && Object.values(k(t.entity_role_counts, e)).forEach((d) => {
    if (E(d, e) < 0) throw new Error(`${e} response is invalid`);
  }), t.calibration_sources !== void 0 && Object.values(k(t.calibration_sources, e)).forEach((d) => N(d, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), e));
  const s = [t.offset_capability, t.offset_disposition, t.offset_boards, t.has_pending_calibration];
  if (s.every((d) => d === void 0)) return n;
  if (s.some((d) => d === void 0)) throw new Error(`${e} response is invalid`);
  const r = k(t.offset_capability, e);
  if (U(r, ["status", "repair_reason"], e), N(r.status, zi, e) === "invalid") w(r.repair_reason, e);
  else if (r.repair_reason !== null) throw new Error(`${e} response is invalid`);
  const a = N(t.offset_disposition, Hi, e), l = A(t.offset_boards, e, 7);
  if (l.length < 1) throw new Error(`${e} response is invalid`);
  const c = [];
  l.forEach((d, g) => {
    const b = k(d, e);
    if (U(b, ["board_index", "stages"], e), E(b.board_index, e) !== g) throw new Error(`${e} response is invalid`);
    const h = A(b.stages, e, 2);
    if (h.length !== 2) throw new Error(`${e} response is invalid`);
    h.forEach((f, _) => {
      const C = k(f, e);
      if (U(C, ["stage", "state"], e), E(C.stage, e) !== _ + 1) throw new Error(`${e} response is invalid`);
      c.push(N(C.state, Li, e));
    });
  });
  const u = c.every((d) => d === "skipped") ? "skipped" : c.every((d) => d === "completed") ? "completed" : c.every((d) => d === "not_started") ? "not_started" : c.some((d) => d === "partial" || d === "indeterminate") || c.some((d) => d === "skipped") ? "partial" : "in_progress";
  if (a !== u) throw new Error(`${e} response is invalid`);
  return D(t.has_pending_calibration, e), n;
}
function Wi(n, e, t, i) {
  const s = k(n, e);
  if (U(s, ["stage", "ready", "connection_generation", "entities", "reasons", "thresholds"], e), E(s.stage, e) !== i || t < 0 || t > 6) throw new Error(`${e} response is invalid`);
  const r = D(s.ready, e), o = E(s.connection_generation, e);
  if (o < 1) throw new Error(`${e} response is invalid`);
  const a = k(s.thresholds, e);
  U(a, ["sample_count", "zero_voltage_peak_volts", "zero_voltage_spread_volts", "zero_current_peak_amps", "zero_current_spread_amps", "voltage_present_minimum_volts", "voltage_present_spread_volts"], e);
  const l = E(a.sample_count, e), c = q(a.zero_voltage_peak_volts, e), u = q(a.zero_voltage_spread_volts, e), d = q(a.zero_current_peak_amps, e), g = q(a.zero_current_spread_amps, e), b = q(a.voltage_present_minimum_volts, e), h = q(a.voltage_present_spread_volts, e), f = [
    c,
    u,
    d,
    g,
    b,
    h
  ];
  if (l < 3 || l > 100 || f.some((M) => M < 0) || f[4] === 0) throw new Error(`${e} response is invalid`);
  const _ = A(s.entities, e, 12);
  if (_.length !== 12) throw new Error(`${e} response is invalid`);
  const C = /* @__PURE__ */ new Map();
  for (const M of [0, 1]) {
    const I = t === 0 ? `main_${M + 1}` : `addon${t}_${M + 1}`;
    for (const B of ["a", "b", "c"]) C.set(`${I}.voltage_${B}`, "voltage");
    for (let B = 1; B <= 3; ++B) C.set(`ct${t * 6 + M * 3 + B}.current_sensor`, "current");
  }
  const x = "entity binding is not on the active connection generation", m = "fresh window unavailable: ", v = /* @__PURE__ */ new Set(), P = [];
  let T = 0;
  _.forEach((M) => {
    const I = k(M, e);
    U(I, ["role", "quantity", "ready", "reasons", "window"], e);
    const B = w(I.role, e), F = N(I.quantity, /* @__PURE__ */ new Set(["voltage", "current"]), e);
    if (v.has(B) || C.get(B) !== F) throw new Error(`${e} response is invalid`);
    v.add(B);
    const Ze = D(I.ready, e), ie = A(I.reasons, e, 12).map((z) => w(z, e));
    let H;
    if (I.window === null) {
      if (Ze || ie.length !== 1) throw new Error(`${e} response is invalid`);
      if (ie[0] === x) ++T;
      else if (!ie[0].startsWith(m) || ie[0].slice(m.length).trim().length === 0)
        throw new Error(`${e} response is invalid`);
      H = ie;
    } else {
      const z = k(I.window, e);
      U(z, ["values", "received_at", "connection_generation", "mean", "minimum", "maximum", "absolute_peak", "absolute_spread"], e);
      const se = A(z.values, e, l).map((Z) => q(Z, e)), Ie = A(z.received_at, e, l).map((Z) => q(Z, e)), Xt = q(z.mean, e), Te = q(z.minimum, e), Xe = q(z.maximum, e), Re = q(z.absolute_peak, e), me = q(z.absolute_spread, e), Jt = se.reduce((Z, ve) => Z + ve, 0) / se.length, Qt = E(z.connection_generation, e);
      if (se.length !== l || Ie.length !== l || Ie.some((Z, ve) => ve > 0 && Z <= Ie[ve - 1]) || !V(Xt, Jt) || !V(Te, Math.min(...se)) || !V(Xe, Math.max(...se)) || !V(Re, Math.max(...se.map(Math.abs))) || !V(me, Xe - Te)) throw new Error(`${e} response is invalid`);
      H = [], Qt !== o ? H.push("window is from another connection generation") : F === "current" ? (Re > d && H.push("absolute peak exceeds zero_current_peak_amps"), me > g && H.push("absolute spread exceeds zero_current_spread_amps")) : i === 1 ? (Re > c && H.push("absolute peak exceeds zero_voltage_peak_volts"), me > u && H.push("absolute spread exceeds zero_voltage_spread_volts")) : (Te < b && H.push("minimum is below voltage_present_minimum_volts"), me > h && H.push("absolute spread exceeds voltage_present_spread_volts"));
    }
    if (!ee(ie, H) || Ze !== (H.length === 0)) throw new Error(`${e} response is invalid`);
    P.push(...H.map((z) => `${B}: ${z}`));
  });
  const y = A(s.reasons, e, 100).map((M) => w(M, e)), $ = [...P, "connection generation changed while collecting readiness"], S = T === _.length && ee(y, [x]) || T === 0 && (ee(y, P) || ee(y, $));
  if (v.size !== C.size || !S || r !== (y.length === 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function Ut(n, e) {
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
function Ki(n, e, t, i) {
  const s = k(n, e);
  U(s, ["state", "board_index", "stage", "expected_tables", "unfinished_group_keys", "retry_allowed", "error"], e);
  const r = N(s.state, ji, e);
  if (E(s.board_index, e) !== t || E(s.stage, e) !== i) throw new Error(`${e} response is invalid`);
  const o = t === 0 ? ["main_1", "main_2"] : [`addon${t}_1`, `addon${t}_2`], a = A(s.expected_tables, e, 2).map((d) => {
    const g = A(d, e, 2);
    if (g.length !== 2) throw new Error(`${e} response is invalid`);
    const b = w(g[0], e);
    if (!o.includes(b)) throw new Error(`${e} response is invalid`);
    return Ut(g[1], e), b;
  }), l = A(s.unfinished_group_keys, e, 2).map((d) => w(d, e)), c = [...a, ...l], u = D(s.retry_allowed, e);
  if (c.length !== 2 || new Set(c).size !== 2 || c.some((d) => !o.includes(d))) throw new Error(`${e} response is invalid`);
  if (r === "applied_pending_restart_verification") {
    if (a.length !== 2 || l.length !== 0 || u || s.error !== null) throw new Error(`${e} response is invalid`);
  } else if (w(s.error, e), !u || a.length !== (r === "partial" ? 1 : 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function Yi(n, e, t, i) {
  const s = k(n, e), r = N(s.target, /* @__PURE__ */ new Set(["voltage", "current"]), e);
  w(s.target_id, e);
  const o = D(s.stable, e);
  if (r !== t || s.target_id !== i) throw new Error(`${e} response is invalid`);
  const a = A(s.windows, e, r === "voltage" ? 42 : 1);
  if (r === "voltage" ? a.length < 3 || a.length % 3 !== 0 : a.length !== 1) throw new Error(`${e} response is invalid`);
  const l = a.map((c) => {
    const u = k(c, e), d = A(u.samples, e, 1).map((x) => q(x, e));
    if (d.length !== 1) throw new Error(`${e} response is invalid`);
    const g = q(u.mean, e), b = q(u.standard_deviation, e), h = q(u.range_percent, e), f = d.reduce((x, m) => x + m, 0) / d.length, _ = Math.sqrt(d.reduce((x, m) => x + (m - f) ** 2, 0) / d.length), C = 100 * (Math.max(...d) - Math.min(...d)) / Math.abs(f);
    if (!V(g, f) || !V(b, _) || !V(h, C)) throw new Error(`${e} response is invalid`);
    return h;
  });
  if (o !== l.every((c) => c <= 1)) throw new Error(`${e} response is invalid`);
  return n;
}
function ft(n, e, t) {
  const i = k(n, e), s = N(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e);
  w(i.group_key, e), i.phase !== null && N(i.phase, ye, e);
  const r = E(i.iteration, e), o = A(i.changed_channels, e, 3).map((h) => E(h, e)), a = A(i.before_values, e, 3), l = A(i.after_values, e, 3), c = A(i.error_percent_values, e, 3);
  for (const h of [a, l, c]) h.forEach((f) => q(f, e));
  const u = t.target === "voltage" ? t.groupKey : Ge(t.references[0].channel), d = t.target === "voltage" ? Xi(t.groupKey) : t.references.map((h) => h.channel), g = t.target === "current" && t.references.length === 1 ? ["A", "B", "C"][(t.references[0].channel - 1) % 3] : null, b = D(i.retry_allowed, e);
  if (t.target === "voltage" && (!Number.isFinite(t.reference) || t.reference <= 0) || t.target === "current" && t.references.some((h) => !Number.isFinite(h.reference) || h.reference <= 0 || !Number.isFinite(h.rawReference) || h.rawReference <= 0) || ![1, 2, 3].includes(o.length) || s !== "indeterminate" && a.length !== o.length || new Set(o).size !== o.length || o.some((h) => h < 1 || h > 42) || r < 1 || r > 3 || i.group_key !== u || i.phase !== g || o.length !== d.length || o.some((h, f) => h !== d[f]) || (s === "indeterminate" ? l.length !== 0 || c.length !== 0 : l.length !== o.length || c.length !== o.length)) throw new Error(`${e} response is invalid`);
  if (s === "indeterminate") {
    if (i.gain_evidence !== null || b) throw new Error(`${e} response is invalid`);
    i.restore_evidence != null && k(i.restore_evidence, e);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${e} response is invalid`);
    Zi(i.gain_evidence, e, t);
    const h = t.target === "voltage" ? l.map(() => t.reference) : t.references.map((C) => C.reference), f = l.map((C, x) => 100 * Math.abs(q(C, e) - h[x]) / h[x]);
    if (c.some((C, x) => q(C, e) < 0 || !V(q(C, e), f[x]))) throw new Error(`${e} response is invalid`);
    const _ = Math.max(...f) > 1;
    if (s === "result_outside_tolerance" !== _ || b !== (_ && r < 3)) throw new Error(`${e} response is invalid`);
  }
  return n;
}
function Ge(n) {
  const e = Math.floor((n - 1) / 6), t = Math.floor((n - 1) % 6 / 3) + 1;
  return e === 0 ? `main_${t}` : `addon${e}_${t}`;
}
function Zi(n, e, t) {
  const i = k(n, e), s = E(i.connection_generation, e), r = E(i.operation_sequence, e), o = t.target === "voltage" ? t.groupKey : Ge(t.references[0].channel), a = o.startsWith("main_") ? `meter_main${o.slice(-1)}` : o;
  if (s < 1 || r < 1 || w(i.instance_id, e) !== a) throw new Error(`${e} response is invalid`);
  const l = t.target === "current" ? new Map(t.references.map((g) => [["A", "B", "C"][(g.channel - 1) % 3], g.rawReference])) : /* @__PURE__ */ new Map(), c = A(i.phases, e, 3);
  if (c.length !== 3) throw new Error(`${e} response is invalid`);
  c.forEach((g, b) => {
    const h = k(g, e), f = N(h.phase, ye, e);
    if (f !== ["A", "B", "C"][b]) throw new Error(`${e} response is invalid`);
    q(h.measured_voltage, e), q(h.measured_current, e);
    const _ = q(h.reference_voltage, e), C = q(h.reference_current, e), x = E(h.old_voltage_gain, e), m = E(h.new_voltage_gain, e), v = E(h.old_current_gain, e), P = E(h.new_current_gain, e);
    if ([x, m, v, P].some((T) => T < 1 || T > 65535)) throw new Error(`${e} response is invalid`);
    if (t.target === "voltage") {
      if (Math.abs(_ - t.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(_), t.reference)) || Math.abs(C) > 1e-6 || v !== P) throw new Error(`${e} response is invalid`);
    } else {
      const T = l.get(f);
      if (Math.abs(_) > 1e-6 || (T === void 0 ? Math.abs(C) > 1e-6 : Math.abs(C - T) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(C), T))) || x !== m || T === void 0 && v !== P) throw new Error(`${e} response is invalid`);
    }
  });
  const u = A(i.register_mismatch_phases, e, 3);
  u.forEach((g) => N(g, ye, e));
  const d = A(i.matching_lines, e, 100);
  if (d.length === 0 || d.some((g) => typeof g != "string") || D(i.flash_saved, e) !== !0 || u.length !== 0 || D(i.calibration_disabled, e) !== !1) throw new Error(`${e} response is invalid`);
}
function Xi(n) {
  const e = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(n);
  if (!e) return [];
  const t = e[2] === void 0 ? 0 : Number(e[2]), i = Number(e[1] ?? e[3]), s = t * 6 + (i - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}
function Be(n, e, t) {
  const i = k(n, e);
  for (const h of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) w(i[h], e);
  const s = E(i.topology_addon_count, e);
  N(i.topology_connection_type, Ve, e);
  const r = E(i.connection_generation, e), o = N(i.source_authority, /* @__PURE__ */ new Set(["saved_flash", "configuration"]), e), a = D(i.source_handoff_available, e), l = D(i.source_handoff_firmware_installed, e);
  Ue(i.source_handoff_transaction_id, e);
  const c = i.config_filename !== null || i.config_sha256 !== null;
  if (c && (w(i.config_filename, e), w(i.config_sha256, e), !Fi.test(i.config_filename) || !Ee.test(i.config_sha256)))
    throw new Error(`${e} response is invalid`);
  if (i.config_filename === null != (i.config_sha256 === null)) throw new Error(`${e} response is invalid`);
  if (!Bi.test(i.mac) || !qe.test(i.verification_id) || r < 1 || i.source_handoff_transaction_id !== null && !qe.test(i.source_handoff_transaction_id) || s !== t.addon_count || i.topology_project_name !== t.project_name || i.topology_connection_type !== t.connection_type || i.topology_voltage_layout !== t.voltage_layout) throw new Error(`${e} response is invalid`);
  const u = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: s }, (h, f) => [`addon${f + 1}_1`, `addon${f + 1}_2`]).flat()]), d = (h, f, _) => {
    const C = A(i[h] ?? [], e, 14), x = /* @__PURE__ */ new Set();
    return C.forEach((m) => {
      const v = k(m, e);
      U(v, ["instance_id", f], e);
      const P = w(v.instance_id, e);
      if (!u.has(P) || x.has(P)) throw new Error(`${e} response is invalid`);
      if (x.add(P), _) Ut(v[f], e);
      else {
        const T = A(v[f], e, 3);
        if (T.length !== 3) throw new Error(`${e} response is invalid`);
        T.forEach((y) => {
          const $ = A(y, e, 2);
          if ($.length !== 2 || $.some((O) => {
            const S = E(O, e);
            return S < 1 || S > 65535;
          })) throw new Error(`${e} response is invalid`);
        });
      }
    }), C.length;
  }, g = d("groups", "phase_gains", !1), b = d("offset_groups", "phase_offsets", !0) + d("power_offset_groups", "phase_power_offsets", !0);
  if (g + b < 1 || a && (!c || l || i.source_handoff_transaction_id !== null || o !== "saved_flash" || b > 0) || !a && c && i.source_handoff_transaction_id === null && b === 0 || l && (!c || i.source_handoff_transaction_id === null || b > 0) || o === "configuration" && (!l || a || b > 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function Ji(n, e, t) {
  const i = k(n, e);
  return i.session !== null && G(i.session, e), i.transaction !== null && oe(i.transaction, e), i.verified_calibration !== null && Be(i.verified_calibration, e, t), n;
}
class Se {
  constructor(e, t) {
    this.hass = e, this.entryId = t, this.setupStatus = () => this.call("setup_status", (i) => be(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (A(i, "list_meters").forEach((s) => Pt(s, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (s) => Vi(s, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (s) => Ne(s, "get_ct_inventory"), { device_id: i }), this.getMeterConfiguration = (i) => this.call("get_meter_configuration", (s) => Gi(s, "get_meter_configuration"), { device_id: i }), this.getActiveWork = (i, s) => this.call("get_active_work", (r) => Ji(r, "get_active_work", s), { device_id: i }), this.getSession = (i) => this.call("get_session", (s) => G(s, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => k(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, s, r, o, a, l) => this.call("set_installer_intent", (c) => be(c, "set_installer_intent"), {
      addon_count: i,
      connection_type: s,
      ...o ?? {},
      ...r && r.productId.length <= 160 && r.version.length <= 160 && Ot.test(r.productId) && Mt.test(r.version) ? { firmware_product_id: r.productId, esphome_version: r.version } : {},
      ...a != null && l !== null && l !== void 0 ? { electrical_system: a, line_frequency_hz: l } : {}
    }), this.rescan = () => this.call("rescan", (i) => be(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (s) => {
      const r = k(s, "adopt_device");
      return w(r.device_id, "adopt_device"), w(r.configuration, "adopt_device"), s;
    }, { device_id: i }), this.previewCtConfig = (i, s, r, o, a) => this.call("preview_ct_config", (l) => oe(l, "preview_ct_config"), {
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
    }), this.applyCtConfig = (i, s, r) => this.transaction("apply_ct_config", i, s, r), this.compileCtConfig = (i, s, r) => this.transaction("compile_ct_config", i, s, r), this.installCtConfig = (i, s, r) => this.transaction("install_ct_config", i, s, r), this.rollbackCtConfig = (i, s, r) => this.transaction("rollback_ct_config", i, s, r), this.startSession = (i) => this.call("start_session", (s) => G(s, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (s) => G(s, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, r) => this.call("check_stability", (o) => Yi(o, "check_stability", s, r), { session_id: i, target: s, target_id: r }), this.checkOffsetReadiness = (i, s, r) => this.call("check_offset_readiness", (o) => Wi(o, "check_offset_readiness", s, r), {
      session_id: i,
      board_index: s,
      stage: r
    }), this.calibrateOffset = (i, s, r, o, a) => this.call("calibrate_offset", (l) => Ki(l, "calibrate_offset", s, r), {
      session_id: i,
      board_index: s,
      stage: r,
      preparation_acknowledged: o,
      confirm_retry: a
    }), this.skipOffsetCalibration = (i) => this.call("skip_offset_calibration", (s) => G(s, "skip_offset_calibration"), { session_id: i }), this.calibrateVoltage = (i, s, r, o) => !s || !Number.isFinite(r) || r < 1 || r > 600 ? Promise.reject(new Error("calibrate_voltage reference is invalid")) : this.call("calibrate_voltage", (a) => A(a, "calibrate_voltage", 14).map((l) => ft(l, "calibrate_voltage", {
      target: "voltage",
      groupKey: w(k(l, "calibrate_voltage").group_key, "calibrate_voltage"),
      reference: r
    })), { session_id: i, reference_id: s, reference_voltage: r, confirm_iteration: o }), this.calibrateCurrent = (i, s, r, o = []) => s.length < 1 || s.length > 3 || new Set(s.map((a) => a.channel)).size !== s.length || new Set(s.map((a) => Ge(a.channel))).size !== 1 || s.some((a) => !Number.isInteger(a.channel) || a.channel < 1 || a.channel > 42 || !Number.isFinite(a.reference) || a.reference <= 0 || ![1, 2, 4, 8].includes(a.reporting_multiplier)) || o.some((a) => ![1, 2, 4, 8].includes(a.reporting_multiplier)) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (a) => ft(a, "calibrate_current", {
      target: "current",
      references: s.map((l) => ({ channel: l.channel, reference: l.reference, rawReference: l.reference / l.reporting_multiplier }))
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
      if (e.length > a || ki.test(e) || Ci.test(e) || o && s !== "redacted_diff" || s === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${s || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [o, a] of Object.entries(e)) {
        if (o.length > 256 || Ai.test(o)) throw new Error("unsafe property name refused");
        if (o.toLowerCase() === "key" && !r) throw new Error(`private field ${o} refused`);
        if (o.toLowerCase() !== "raw_gain_ct" && Si.test(o))
          throw new Error(`private field ${o} refused`);
        if (t && i === 0 && o === "changes" && Array.isArray(a)) {
          if (a.length > 100) throw new Error("unsafe collection changes refused");
          for (const l of a) this.assertPublicPayload(l, !1, i + 2, "", !0);
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
function Qi(n) {
  const e = (n?.redacted_diff || "No reviewed configuration changes yet.").split(`
`);
  return p`
    <section class="review-region" aria-labelledby="review-heading">
      <h2 id="review-heading">Review changes</h2>
      <p class="warning-band">Firmware configuration changes can alter Home Assistant rename/entity-key bindings. Review every change before Apply.</p>
      <pre class="config-diff" aria-label="Redacted substitution diff"><code>${e.map((t, i) => p`<span class=${`diff-line ${t.startsWith("+") ? "added" : t.startsWith("-") ? "removed" : "context"}`}>${t}</span>${i < e.length - 1 ? `
` : ""}`)}</code></pre>
      <dl class="status-list">
        <div><dt>Validation</dt><dd>${n?.state === "validated" || n?.progress.includes("config_validated") ? "Validated" : "Pending"}</dd></div>
        <div><dt>Compile</dt><dd>${n?.state === "compiled" || n?.progress.includes("firmware_compiled") ? "Compiled" : "Pending"}</dd></div>
        <div><dt>Install</dt><dd>${n?.state === "install_confirmation_required" ? "Confirmation required" : n?.state ?? "Pending"}</dd></div>
      </dl>
    </section>
  `;
}
function es(n, e, t, i, s, r, o) {
  const a = n?.state ?? "previewed", l = a === "rolled_back" && n?.evidence.includes("validation_failed");
  return p`
    <section class="step-content" aria-labelledby="step-heading">
      ${Qi(n)}
      ${a === "failed" ? p`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${n?.evidence.join(", ") || "The operation did not complete."}</p>
          ${n?.rollback_available ? p`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      ${l ? p`<div class="recovery-panel" role="status"><strong>ESPHome rejected the config (code ${n?.validation_detail?.code ?? "unavailable"})</strong><p>The original config was restored. Review the config changes and open ESPHome Device Builder logs for the exact validation error.</p></div>` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${e} ?disabled=${a !== "previewed"}>Apply</button>
        <button class="secondary" @click=${t} ?disabled=${a !== "validated"}>Compile</button>
        <button class="primary" @click=${i} ?disabled=${a !== "install_confirmation_required"}>Install</button>
      </div>
      ${n?.validation_detail ? p`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${n.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${n.validation_detail.error_record_count} records (${n.validation_detail.reported_error_count === null ? "unreported" : `${n.validation_detail.reported_error_count} reported`})</dd></div>
        <div><dt>Warnings</dt><dd>${n.validation_detail.warning_record_count} records (${n.validation_detail.reported_warning_count === null ? "unreported" : `${n.validation_detail.reported_warning_count} reported`})</dd></div>
      </dl>` : ""}
      ${n?.upload_progress?.length ? p`<ul class="upload-progress">${n.upload_progress.map((c) => p`
        <li>${c.stage}: ${c.percentage ?? "in progress"}${c.percentage != null ? "%" : ""}</li>
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
}, Dt = (n, e, t) => (n?.default_gain_ct ?? t) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((n?.default_gain_ct ?? t) / e);
function ts(n, e, t, i, s, r, o, a = !1, l = !1, c = null, u = () => {
}, d = () => {
}) {
  const g = Math.ceil(n.channels.length / 6), b = n.channels.filter((h) => h.address.board_index === e).slice(0, 8);
  return p`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: g }, (h, f) => p`
          <button role="tab" id=${`board-tab-${f}`} data-board-tab=${f} aria-selected=${f === e}
            aria-controls="board-panel" tabindex=${f === e ? "0" : "-1"}
            @keydown=${(_) => xe(_, f)}
            @click=${() => i(f)}>${f === 0 ? "Main Board" : `Add-on ${f}`}</button>
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
          ${b.map((h) => {
    const f = t.get(h.channel) ?? {
      name: h.name,
      modelId: h.selected_model_id ?? "",
      multiplier: h.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, _ = n.catalog.presets.find((m) => m.model_id === f.modelId), C = Dt(_, f.multiplier, f.modelId === "custom" ? f.customGainCt : void 0), x = We(h, f);
    return p`
              <div class="ct-row" data-ct-row data-ct-group=${h.address.group_index} role="row" aria-rowindex=${h.channel + 1} aria-label=${`CT${h.channel}`}>
                <strong class="ct-index" role="cell">CT${h.channel}</strong>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${h.channel} name`} .value=${f.name}
                  @input=${(m) => s(h.channel, { name: m.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${h.channel} model`} ?disabled=${a}
                  @change=${(m) => {
      const v = m.target.value, P = n.catalog.presets.find((T) => T.model_id === v);
      s(h.channel, {
        modelId: v,
        burdenAcknowledged: h.selection_verified_against_config && v === h.selected_model_id && (v === "custom" || P?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${f.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((m) => p`<option value=${m.model_id} ?selected=${f.modelId === m.model_id}>${m.label}</option>`)}
                  <option value="custom" ?selected=${f.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${h.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><select aria-label=${`CT${h.channel} multiplier`} ?disabled=${a}
                  @change=${(m) => s(h.channel, { multiplier: Number(m.target.value) })}>
                  ${[1, 2, 4, 8].map((m) => p`<option value=${m} ?selected=${f.multiplier === m}>${m}</option>`)}
                </select></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${C ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${_?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${f.expanded} @click=${() => s(h.channel, { expanded: !f.expanded })}>
                  ${f.modelId ? x ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${f.modelId === "custom" ? p`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${h.channel} custom gain`}
                  ?disabled=${a}
                  .value=${f.customGainCt === void 0 ? "" : String(f.customGainCt)}
                  @input=${(m) => s(h.channel, { customGainCt: Number(m.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${h.channel} custom label`} ?disabled=${a} .value=${f.customLabel ?? ""}
                  @input=${(m) => s(h.channel, { customLabel: m.target.value })} /></label>
              </div>` : R}
              ${f.modelId === "custom" || _?.requires_burden_jumper_cut ? p`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${h.channel} burden output acknowledgement`}
                  ?disabled=${a}
                  .checked=${f.burdenAcknowledged}
                  @change=${(m) => s(h.channel, { burdenAcknowledged: m.target.checked })} />
                  I checked the burden-output requirement for CT${h.channel}</label>
              </div>` : R}
              ${_ && _.rated_current_a > 65.535 && f.multiplier === 1 ? p`<div class="warning-band" role="status">CT${h.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : R}
              ${f.expanded && _ ? p`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${_.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${_.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${_.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${_.notes || (_.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : R}
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${b[0]?.channel ?? 0}–${b.at(-1)?.channel ?? 0} of ${n.channels.length} CTs</p>
      ${c ? ns(c, u, d) : R}
      <footer class="action-footer">
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${l || !cs(n, t, a)} @click=${o}>${l ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const gt = ["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"], is = ["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"], ss = ["none", "consumption", "bidirectional", "generation"];
function ns(n, e, t) {
  const i = (c, u) => e({
    ...n,
    channels: n.channels.map((d) => d.channel === c ? { ...d, ...u } : d)
  }), s = (c, u) => e({
    ...n,
    aggregates: n.aggregates.map((d, g) => g === c ? { ...d, ...u } : d)
  }), r = (c, u) => {
    const d = n.aggregates[c].aggregate_id;
    e({ ...n, aggregates: n.aggregates.map((g, b) => b === c ? { ...g, aggregate_id: u } : g.parent_id === d ? { ...g, parent_id: u } : g) });
  }, o = n.meter.voltage_references, a = n.channels.filter((c) => c.enabled && !n.aggregates.some((u) => u.channels.includes(c.channel))).map((c) => c.channel), l = n.aggregates.flatMap((c) => [
    c.role === "grid" && c.channels.some((u) => n.channels[u - 1]?.role === "branch") ? `${c.name}: keep branch loads out of the root-grid total.` : "",
    c.measurement_method === "one_ct_double_power" && c.channels.length !== 1 ? `${c.name}: doubled-one-leg measurement requires exactly one CT.` : "",
    c.role === "two_pole" && !["one_ct_double_power", "both_conductors_one_ct", "two_ct_sum"].includes(c.measurement_method) ? `${c.name}: select a two-pole measurement method.` : ""
  ].filter(Boolean));
  return p`<section class="step-content" aria-labelledby="circuits-heading">
    <h2 id="circuits-heading">Circuits & CTs</h2>
    <p>These fields are part of the meter configuration. Calibration values remain internal.</p>
    ${n.channels.map((c) => p`<section class="ct-detail" aria-label=${`CT${c.channel} circuit`}>
      <strong>CT${c.channel}</strong>
      <label class="check-row"><input type="checkbox" aria-label=${`CT${c.channel} used`} .checked=${c.enabled}
        @change=${(u) => u.target.checked ? i(c.channel, { enabled: !0, role: c.role === "unused" ? "branch" : c.role }) : t(c.channel)} />Used</label>
      <label>Role <select aria-label=${`CT${c.channel} role`} .value=${c.role}
        ?disabled=${!c.enabled}
        @change=${(u) => i(c.channel, { role: u.target.value })}>${gt.filter((u) => u !== "unused").map((u) => p`<option value=${u}>${u.replaceAll("_", " ")}</option>`)}</select></label>
      <label>Voltage reference <select aria-label=${`CT${c.channel} voltage reference`} .value=${c.voltage_reference_id}
        @change=${(u) => i(c.channel, { voltage_reference_id: u.target.value })}>${o.map((u) => p`<option value=${u.reference_id}>${u.label || u.reference_id}</option>`)}</select></label>
      <span>${c.enabled ? `${c.model_id || "No CT model"}; ${c.role.replaceAll("_", " ")}` : "Unused"}</span>
    </section>`)}
    <h2>Aggregate totals</h2>
    ${l.map((c) => p`<p class="warning-band" role="status">${c}</p>`)}
    ${n.aggregates.map((c, u) => p`<section class="ct-detail" aria-label=${`${c.name} aggregate`}>
      <label>ID <input aria-label=${`${c.aggregate_id} aggregate id`} maxlength="64" .value=${c.aggregate_id}
        @change=${(d) => r(u, d.target.value.trim())} /></label>
      <label>Name <input aria-label=${`${c.aggregate_id} aggregate name`} maxlength="64" .value=${c.name}
        @input=${(d) => s(u, { name: d.target.value })} /></label>
      <label>Role <select aria-label=${`${c.aggregate_id} aggregate role`} .value=${c.role}
        @change=${(d) => s(u, { role: d.target.value })}>${gt.filter((d) => d !== "unused").map((d) => p`<option value=${d}>${d.replaceAll("_", " ")}</option>`)}</select></label>
      <label>Method <select aria-label=${`${c.aggregate_id} aggregate method`} .value=${c.measurement_method}
        @change=${(d) => s(u, { measurement_method: d.target.value })}>${is.map((d) => p`<option value=${d}>${d.replaceAll("_", " ")}</option>`)}</select></label>
      <label>Energy <select aria-label=${`${c.aggregate_id} aggregate energy`} .value=${c.energy_mode}
        @change=${(d) => s(u, { energy_mode: d.target.value })}>${ss.map((d) => p`<option value=${d}>${d}</option>`)}</select></label>
      <label>Channels <input aria-label=${`${c.aggregate_id} aggregate channels`} .value=${c.channels.join(",")}
        @change=${(d) => s(u, { channels: d.target.value.split(",").map(Number).filter(Number.isInteger) })} /></label>
      <fieldset><legend>Selected channels</legend>${n.channels.filter((d) => d.enabled).map((d) => p`<label class="check-row"><input type="checkbox" aria-label=${`${c.aggregate_id} CT${d.channel}`} .checked=${c.channels.includes(d.channel)}
        @change=${(g) => s(u, { channels: g.target.checked ? [...c.channels, d.channel] : c.channels.filter((b) => b !== d.channel) })} />CT${d.channel}</label>`)}</fieldset>
      <label>Parent <select aria-label=${`${c.aggregate_id} aggregate parent`} .value=${c.parent_id ?? ""}
        @change=${(d) => s(u, { parent_id: d.target.value || null })}><option value="">None</option>${n.aggregates.filter((d) => d.aggregate_id !== c.aggregate_id).map((d) => p`<option value=${d.aggregate_id}>${d.name}</option>`)}</select></label>
      <label class="check-row"><input type="checkbox" aria-label=${`${c.aggregate_id} expose power`} .checked=${c.expose_power}
        @change=${(d) => s(u, { expose_power: d.target.checked })} />Power</label>
      <label class="check-row"><input type="checkbox" aria-label=${`${c.aggregate_id} expose current`} .checked=${c.expose_current}
        @change=${(d) => s(u, { expose_current: d.target.checked })} />Current</label>
      <button class="secondary" @click=${() => e({ ...n, aggregates: n.aggregates.filter((d, g) => g !== u).map((d) => d.parent_id === c.aggregate_id ? { ...d, parent_id: null } : d) })}>Delete aggregate</button>
    </section>`)}
    ${rs(n, a, e)}
  </section>`;
}
function rs(n, e, t) {
  const i = (s, r, o, a, l, c) => {
    const d = [...s.currentTarget.parentElement?.querySelector("[data-preset-channels]")?.selectedOptions ?? []].map((f) => Number(f.value));
    if (d.length !== l) return;
    const g = o.replaceAll("_", "-");
    let b = n.aggregates.length + 1;
    const h = new Set(n.aggregates.map((f) => f.aggregate_id));
    for (; h.has(`${g}-${b}`); ) b++;
    t({ ...n, aggregates: [...n.aggregates, {
      aggregate_id: `${g}-${b}`,
      name: r,
      role: o,
      channels: d,
      measurement_method: a,
      parent_id: null,
      energy_mode: c,
      expose_power: !0,
      expose_current: o === "grid"
    }] });
  };
  return p`<div class="action-footer"><label>Preset channels <select multiple data-preset-channels aria-label="Preset channels">${e.map((s) => p`<option value=${s}>CT${s}</option>`)}</select></label>
    <button class="secondary" @click=${(s) => i(s, "New aggregate", "branch", "direct", 1, "consumption")}>Add aggregate</button>
    <button class="secondary" @click=${(s) => i(s, "Main service", "grid", "two_ct_sum", 2, "bidirectional")}>Main service</button>
    <button class="secondary" @click=${(s) => i(s, "Solar / generator", "solar", "two_ct_sum", 2, "generation")}>Solar / generator</button>
    <button class="secondary" @click=${(s) => i(s, "Two-pole circuit", "two_pole", "one_ct_double_power", 1, "consumption")}>Two-pole</button>
    <button class="secondary" @click=${(s) => i(s, "Subpanel", "subpanel", "two_ct_sum", 2, "consumption")}>Subpanel</button></div>`;
}
function os(n, e) {
  const t = new Set(n.meter.voltage_references.map((o) => o.reference_id));
  if (n.channels.length !== e || new Set(n.channels.map((o) => o.channel)).size !== e || n.channels.some((o) => o.channel < 1 || o.channel > e || !o.name.trim() || !t.has(o.voltage_reference_id) || o.enabled === (o.role === "unused"))) return !1;
  const i = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Map();
  for (const o of n.aggregates) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(o.aggregate_id) || i.has(o.aggregate_id) || !o.name.trim() || !o.channels.length || new Set(o.channels).size !== o.channels.length) return !1;
    i.add(o.aggregate_id), r.set(o.aggregate_id, o.parent_id);
    const a = o.measurement_method === "two_ct_sum" ? 2 : o.measurement_method === "one_ct_double_power" || o.measurement_method === "both_conductors_one_ct" ? 1 : void 0;
    if (a !== void 0 && o.channels.length !== a || o.channels.some((l) => l < 1 || l > e || s.has(l) || !n.channels[l - 1]?.enabled)) return !1;
    o.channels.forEach((l) => s.add(l));
  }
  for (const [o, a] of r) {
    const l = /* @__PURE__ */ new Set();
    for (let c = a; c !== null; c = r.get(c) ?? null) {
      if (!i.has(c) || c === o || l.has(c)) return !1;
      l.add(c);
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
  return e.name !== n.name || e.modelId !== (n.selected_model_id ?? "") || e.multiplier !== n.reporting_multiplier || e.modelId === "custom" && (Dt(void 0, e.multiplier, e.customGainCt) !== n.raw_gain_ct || (e.customLabel?.trim() ?? "") !== (n.display_label ?? ""));
}
function as(n, e) {
  if (!e.name.trim() || !e.modelId || ![1, 2, 4, 8].includes(e.multiplier)) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const t = n.catalog.presets.find((i) => i.model_id === e.modelId);
  return !!t && (!t?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function cs(n, e, t = !1) {
  if (t) return [...e].every(([i, s]) => {
    const r = n.channels.find((o) => o.channel === i);
    return !!r && !!s.name.trim() && s.modelId === (r.selected_model_id ?? "") && s.multiplier === r.reporting_multiplier;
  });
  for (const i of n.channels) {
    const s = e.get(i.channel);
    if (!s || We(i, s) && !as(n, s))
      return !1;
  }
  return !0;
}
const W = (n) => n.toFixed(2);
function Nt(n, e, t) {
  const i = [n, !!e?.stable, !!t, !!t?.gain_evidence, !!t], s = i.findIndex((o) => !o);
  return p`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((o, a) => p`<li
    class=${i[a] ? "complete" : a === s ? "active" : "pending"}><span
      class="progress-number">${a + 1}</span><span>${o}</span></li>`)}</ol>`;
}
function Bt(n, e, t, i) {
  const s = Object.entries(n?.calibration_sources ?? {}).filter(([r]) => e.includes(r));
  return p`<section class="measurement-evidence calibration-source" aria-label=${`${t} calibration source`}>
    <h3>Active gain source</h3>
    ${s.length ? p`<table><thead><tr><th>Chip</th><th>Active gain source</th><th>${t} calibrated this session</th></tr></thead><tbody>
      ${s.map(([r, o]) => p`<tr><td>${r}</td><td>${o === "flash" ? "Saved flash" : o === "configuration" ? "Configuration" : "Unknown"}</td><td>${i.has(r) ? "Yes" : "No"}</td></tr>`)}
    </tbody></table><p>ATM90E32 stores voltage and current gains in one table. The active source does not mean this calibration step was completed.</p>` : p`<p>Calibration source is not available.</p>`}
  </section>`;
}
function Ke(n, e) {
  if (!n) return R;
  const t = n.target === "voltage" ? "V" : "A";
  return p`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((i, s) => p`<dl>
      <div><dt>${e?.[s] ?? (n.target === "voltage" ? `V${s % 3 + 1}` : `A${s + 1}`)}</dt>
        <dd>${i.samples.map((r) => `${W(r)} ${t}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}
function Ye(n) {
  return n ? p`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${n.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${n.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${n.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${n.before_values.map(W).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${n.after_values.map(W).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${n.error_percent_values.map((e) => `${W(e)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${n.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${n.gain_evidence ? p`<h4>Gain evidence · ${n.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${n.gain_evidence.phases?.map((e) => p`<tr><td>${e.phase}</td><td>${W(e.measured_voltage)}</td><td>${W(e.measured_current)}</td><td>${W(e.reference_voltage)}</td><td>${W(e.reference_current)}</td><td>${e.old_voltage_gain} → ${e.new_voltage_gain}</td><td>${e.old_current_gain} → ${e.new_current_gain}</td></tr>`) ?? R}
      </tbody></table><p>Saved in flash: ${n.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : p`<p>Gain evidence unavailable.</p>`}
  </section>` : R;
}
function ls(n, e, t, i, s, r, o, a, l, c, u, d, g, b, h, f) {
  const _ = n?.ct_count ?? e?.channels.length ?? 6, C = Math.floor((i - 1) / 6), m = Math.floor((i - 1) / 3) * 3 + 1, v = Array.from({ length: 3 }, (S, M) => m + M).filter((S) => S <= _), P = v.filter((S) => (s.get(S) ?? 0) > 0), T = C === 0 ? ["meter_main1", "meter_main2"] : [`addon${C}_1`, `addon${C}_2`], y = e === null, $ = r !== null && [1, 2, 4, 8].includes(r), O = P.length > 0 && (!y || $);
  return p`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Nt(O, o, a)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(_ / 6) }, (S, M) => p`<button role="tab"
          id=${`current-board-tab-${M}`} aria-controls="current-board-panel"
          aria-selected=${M === C} tabindex=${M === C ? "0" : "-1"}
          @keydown=${(I) => xe(I, M)}
          @click=${() => c(M * 6 + 1)}>${M === 0 ? "Main Board" : `Add-on ${M}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${C}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((S) => {
    const M = C * 6 + S * 3 + 1;
    return p`<button
          aria-pressed=${M === m} @click=${() => c(M)}>Group ${C * 2 + S + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${m}–CT${m + 2}</h2>
      ${Bt(t, T, "Current", l)}
      <div class="reference-block">
        ${v.map((S) => p`<label>CT${S} reference
          <input data-current-reference=${S} aria-label=${`CT${S} reference`} type="number" min="0.01" step="0.01"
            .value=${s.has(S) ? String(s.get(S)) : ""}
            @input=${(M) => {
    const I = M.target;
    u(S, I.value === "" ? null : Number(I.value));
  }} /></label>`)}
      ${y ? p`<label>Reporting multiplier <select data-role="reporting-multiplier" required @change=${(S) => {
    const M = Number(S.target.value);
    d(M || null);
  }}><option value="" ?selected=${r === null}>Choose multiplier</option>${[1, 2, 4, 8].map((S) => p`<option value=${S} ?selected=${r === S}>${S}</option>`)}</select></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${g} ?disabled=${!O}>Check stability</button>
        <button class="primary" @click=${b} ?disabled=${!O || !o?.stable || (a?.iteration ?? 0) >= 3 || !!(a && !a.retry_allowed && a.iteration > 0)}>${a?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button></div>
      ${o ? p`<div class=${o.stable ? "success-band" : "warning-band"} role="status">${o.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${Ke(o, P.map((S) => `CT${S}`))}
      ${a?.state === "applied_pending_restart_verification" ? p`<div class="success-band" role="status">Current calibration complete for CT${m}–CT${m + 2}.</div>` : ""}
      ${Ye(a)}
      ${a?.state.includes("indeterminate") ? p`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${h}>Reconnect and inspect</button><button class="danger" @click=${f}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const ds = [
  ["split_phase_120_240", "Split phase 120/240 V"],
  ["single_phase_230", "Single phase 230 V"],
  ["three_phase", "Three phase"],
  ["custom", "Custom"]
], hs = [1, 2, 5, 10, 30, 60], ps = (n) => n <= 5 ? "1–5 seconds: high traffic." : n === 10 ? "10 seconds: standard." : n >= 30 ? "30–60 seconds: lower traffic; guided calibration takes longer." : "This interval affects update traffic and guided calibration time.";
function us(n, e, t, i, s, r, o, a, l, c) {
  const u = n.voltage_references.length > 1, d = !!n.friendly_name.trim() && n.voltage_references.every((h) => h.label.trim() && h.phase_label.trim() && Number.isFinite(h.nominal_voltage_v) && h.nominal_voltage_v >= 1 && h.nominal_voltage_v <= 600 && Number.isInteger(h.gain_voltage) && h.gain_voltage >= 1 && h.gain_voltage <= 65535 && h.group_keys.length) && (!u || t), g = (h) => i({ ...n, ...h }), b = (h, f) => {
    const _ = n.voltage_references.find((m) => m.group_keys.includes(h)), C = n.voltage_references.find((m) => m.reference_id === f);
    if (!_ || !C || _ === C) return;
    const x = _.group_keys.length === 1 ? C.group_keys[0] : void 0;
    g({ voltage_references: n.voltage_references.map((m) => ({
      ...m,
      group_keys: m === _ ? x ? [x] : m.group_keys.filter((v) => v !== h) : m === C ? [...m.group_keys.filter((v) => v !== x), h] : m.group_keys
    })) });
  };
  return p`
    <section class="step-content meter-settings-step" aria-labelledby="step-heading">
      <h2>Meter settings</h2>
      <p>These values are written to the meter configuration. Setup Device choices remain onboarding suggestions.</p>
      <div class="meter-settings-grid">
        <label>Friendly name <input aria-label="Friendly name" maxlength="64" .value=${n.friendly_name}
          @input=${(h) => g({ friendly_name: h.target.value })} /></label>
        <label>Electrical system <select aria-label="Electrical system" .value=${n.electrical_system}
          @change=${(h) => s(h.target.value)}>${ds.map(([h, f]) => p`<option value=${h}>${f}</option>`)}</select></label>
        <label>Line frequency <select aria-label="Line frequency" .value=${String(n.line_frequency_hz)}
          @change=${(h) => r(Number(h.target.value))}>${[50, 60].map((h) => p`<option value=${h}>${h} Hz</option>`)}</select></label>
        <label>Reporting interval <select aria-label="Reporting interval" .value=${String(n.update_interval_s)}
          @change=${(h) => g({ update_interval_s: Number(h.target.value) })}>${hs.map((h) => p`<option value=${h}>${h} seconds</option>`)}</select></label>
      </div>
      <p class="info-band" role="status">${ps(n.update_interval_s)}</p>
      <h3>Voltage references</h3>
      <div class="voltage-reference-cards">${n.voltage_references.map((h) => p`
        <section class="voltage-reference-card" aria-label=${`${h.label} voltage reference`}>
          <label>Label <input aria-label=${`${h.reference_id} label`} maxlength="64" .value=${h.label}
            @input=${(f) => g({ voltage_references: n.voltage_references.map((_) => _.reference_id === h.reference_id ? { ..._, label: f.target.value } : _) })} /></label>
          <label>Phase label <input aria-label=${`${h.reference_id} phase label`} maxlength="64" .value=${h.phase_label}
            @input=${(f) => g({ voltage_references: n.voltage_references.map((_) => _.reference_id === h.reference_id ? { ..._, phase_label: f.target.value } : _) })} /></label>
          <label>Transformer <select aria-label=${`${h.reference_id} transformer`} .value=${h.transformer_model_id}
            @change=${(f) => {
    const _ = f.target.value, C = e.presets.find((x) => x.model_id === _);
    g({ voltage_references: n.voltage_references.map((x) => x.reference_id === h.reference_id ? { ...x, transformer_model_id: _, gain_voltage: C?.default_gain_voltage ?? x.gain_voltage } : x) });
  }}>
            ${e.presets.map((f) => p`<option value=${f.model_id}>${f.label}</option>`)}
            <option value="custom">Custom starting gain</option>
            ${h.transformer_model_id !== "custom" && !e.presets.some((f) => f.model_id === h.transformer_model_id) ? p`<option value=${h.transformer_model_id}>${h.transformer_model_id}</option>` : ""}</select></label>
          <label>Custom voltage gain <input aria-label=${`${h.reference_id} custom voltage gain`} type="number" min="1" max="65535" step="1" .value=${String(h.gain_voltage)}
            @input=${(f) => g({ voltage_references: n.voltage_references.map((_) => _.reference_id === h.reference_id ? { ..._, gain_voltage: Number(f.target.value) } : _) })} /></label>
          <label>Nominal voltage <input aria-label=${`${h.reference_id} nominal voltage`} type="number" min="1" max="600" step="0.1" .value=${String(h.nominal_voltage_v)}
            @input=${(f) => o(h.reference_id, Number(f.target.value))} /></label>
        </section>`)}
      </div>
      <h3>Voltage group assignment</h3>
      <div class="meter-settings-grid">${n.voltage_references.flatMap((h) => h.group_keys).sort().map((h) => p`<label>${h}<select aria-label=${`${h} voltage reference`} .value=${n.voltage_references.find((f) => f.group_keys.includes(h))?.reference_id ?? ""}
        @change=${(f) => b(h, f.target.value)}>${n.voltage_references.map((f) => p`<option value=${f.reference_id}>${f.label || f.reference_id}</option>`)}</select></label>`)}</div>
      ${u ? p`<label class="check-row"><input type="checkbox" aria-label="Multi-reference preparation acknowledgement" .checked=${t}
        @change=${(h) => a(h.target.checked)} />I prepared the separate voltage references.</label>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${l}>Back</button><button class="primary" data-action="continue-meter-settings" ?disabled=${!d} @click=${c}>Continue to Circuits & CTs</button></footer>
    </section>
  `;
}
const fs = (n) => n === null || typeof n != "object" && typeof n != "function", gs = (n) => n.strings === void 0;
const _s = { CHILD: 2 }, ms = (n) => (...e) => ({ _$litDirective$: n, values: e });
let vs = class {
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
}, Ce = (n) => {
  let e, t;
  do {
    if ((e = n._$AM) === void 0) break;
    t = e._$AN, t.delete(n), n = e;
  } while (t?.size === 0);
}, Ft = (n) => {
  for (let e; e = n._$AM; n = e) {
    let t = e._$AN;
    if (t === void 0) e._$AN = t = /* @__PURE__ */ new Set();
    else if (t.has(n)) break;
    t.add(n), $s(e);
  }
};
function bs(n) {
  this._$AN !== void 0 ? (Ce(this), this._$AM = n, Ft(this)) : this._$AM = n;
}
function ws(n, e = !1, t = 0) {
  const i = this._$AH, s = this._$AN;
  if (s !== void 0 && s.size !== 0) if (e) if (Array.isArray(i)) for (let r = t; r < i.length; r++) pe(i[r], !1), Ce(i[r]);
  else i != null && (pe(i, !1), Ce(i));
  else pe(this, n);
}
const $s = (n) => {
  n.type == _s.CHILD && (n._$AP ??= ws, n._$AQ ??= bs);
};
class ys extends vs {
  constructor() {
    super(...arguments), this._$AN = void 0;
  }
  _$AT(e, t, i) {
    super._$AT(e, t, i), Ft(this), this.isConnected = e._$AU;
  }
  _$AO(e, t = !0) {
    e !== this.isConnected && (this.isConnected = e, e ? this.reconnected?.() : this.disconnected?.()), t && (pe(this, e), Ce(this));
  }
  setValue(e) {
    if (gs(this._$Ct)) this._$Ct._$AI(e, this);
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
class Ss {
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
class Cs {
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
const _t = (n) => !fs(n) && typeof n.then == "function", mt = 1073741823;
class ks extends ys {
  constructor() {
    super(...arguments), this._$Cwt = mt, this._$Cbt = [], this._$CK = new Ss(this), this._$CX = new Cs();
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
      const l = t[a];
      if (!_t(l)) return this._$Cwt = a, l;
      a < s && l === i[a] || (this._$Cwt = mt, s = 0, Promise.resolve(l).then(async (c) => {
        for (; o.get(); ) await o.get();
        const u = r.deref();
        if (u !== void 0) {
          const d = u._$Cbt.indexOf(l);
          d > -1 && d < u._$Cwt && (u._$Cwt = d, u.setValue(c));
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
const As = ms(ks), zt = "https://circuitsetup.github.io/ESPWebInstaller/", Es = new URL("manifests/firmware_index.json", zt).href, Ht = 256 * 1024, xs = 100, Is = 20, Lt = 160, Ts = 1e4, Rs = /^[a-z0-9][a-z0-9_-]{0,127}$/, Os = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, jt = /[\u0000-\u001F\u007F-\u009F]/;
function j(n) {
  throw new Error(`Invalid firmware index: ${n}`);
}
function vt(n) {
  return typeof n == "object" && n !== null && !Array.isArray(n);
}
function Me(n) {
  return typeof n == "string" && n.length <= Lt && !jt.test(n);
}
function Vt(n) {
  if (!Rs.test(n)) throw new Error("Invalid firmware product ID");
}
function Gt(n) {
  if (!Os.test(n) || n.length > Lt || jt.test(n))
    throw new Error("Invalid firmware version");
}
function Wt(n) {
  return new TextEncoder().encode(n).byteLength;
}
function Ms(n) {
  Array.isArray(n) || j("top level must be an array"), Wt(JSON.stringify(n)) > Ht && j("payload is too large"), n.length > xs && j("too many products");
  const e = /* @__PURE__ */ new Set();
  return n.map((t) => {
    (!vt(t) || Object.keys(t).length !== 3 || !Object.hasOwn(t, "productId") || !Object.hasOwn(t, "name") || !Object.hasOwn(t, "versions")) && j("invalid product");
    const { productId: i, name: s, versions: r } = t;
    (!Me(i) || !Me(s) || !Array.isArray(r)) && j("invalid product fields"), Vt(i), e.has(i) && j("duplicate product ID"), e.add(i), r.length > Is && j("too many versions");
    const o = /* @__PURE__ */ new Set();
    return {
      productId: i,
      name: s,
      versions: r.map((a) => ((!vt(a) || Object.keys(a).length !== 1 || !Object.hasOwn(a, "version") || !Me(a.version)) && j("invalid version"), Gt(a.version), o.has(a.version) && j("duplicate version"), o.add(a.version), { version: a.version }))
    };
  });
}
async function Ps(n = globalThis.fetch, e) {
  const t = new AbortController(), i = () => t.abort();
  e?.aborted ? i() : e?.addEventListener("abort", i, { once: !0 });
  const s = setTimeout(i, Ts);
  try {
    const r = await n(Es, { cache: "no-cache", mode: "cors", signal: t.signal });
    if (!r.ok) throw new Error(`Firmware index request failed (${r.status})`);
    const o = await r.text();
    return Wt(o) > Ht && j("payload is too large"), Ms(JSON.parse(o));
  } finally {
    clearTimeout(s), e?.removeEventListener("abort", i);
  }
}
function qs(n, e) {
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
function Ds(n, e, t) {
  const i = /* @__PURE__ */ new Map();
  for (const s of qs(e, t)) {
    const r = n.find((o) => o.productId === s);
    for (const o of r?.versions ?? [])
      i.has(o.version) || i.set(o.version, { productId: s, version: o.version });
  }
  return [...i.values()].sort((s, r) => Us(s.version, r.version));
}
function Ns(n, e) {
  return n.find((t) => t.version === e)?.version ?? n[0]?.version ?? null;
}
function Bs(n, e) {
  Vt(n), Gt(e);
  const t = new URL(`manifests/manifest_${n}-${e}.json`, zt);
  if (t.origin !== "https://circuitsetup.github.io" || !t.pathname.startsWith("/ESPWebInstaller/manifests/"))
    throw new Error("Invalid firmware manifest URL");
  return t.href;
}
let Fs;
const zs = () => Fs ??= import("./circuitsetup-energy-meter-helper-install-button-DpSoc-pA.js"), bt = (n, e) => p`
  <p class="firmware-summary">${n.productId} · ESPHome ${n.version}</p>
  <esp-web-install-button class="esp-web-installer" .manifest=${e}>
    <button slot="activate" aria-label="Install firmware">Install firmware</button>
    <p slot="unsupported">Use a supported Chromium browser with Web Serial to install firmware.</p>
    <p slot="not-allowed">Open this helper on HTTPS or localhost to install firmware.</p>
  </esp-web-install-button>
`;
function Hs(n) {
  if (!n) return R;
  try {
    const e = Bs(n.productId, n.version);
    return customElements.get("esp-web-install-button") ? bt(n, e) : As(
      zs().then(
        () => bt(n, e),
        () => p`<p role="alert">ESP Web Tools failed to load. Reload Home Assistant and try again.</p>`
      ),
      p`<p role="status">Loading installer…</p>`
    );
  } catch {
    return R;
  }
}
const wt = (n) => n === 0 ? "Main Board" : `Add-on ${n}`, Ls = (n) => n === 0 ? ["main_1", "main_2"] : [`addon${n}_1`, `addon${n}_2`];
function js(n, e, t, i, s, r, o, a, l, c, u, d, g, b, h, f, _, C, x) {
  const m = e?.offset_capability, v = e?.offset_boards ?? [], P = e?.offset_disposition === "completed" || e?.offset_disposition === "skipped" || e?.offset_disposition === "partial" && e.state === "applied_pending_restart_verification", T = v.length > 0 && v.every((I) => I.stages[0]?.state === "completed"), y = v[t]?.stages[i - 1]?.state ?? "not_started", $ = !!a?.retry_allowed || y === "partial" || y === "indeterminate", O = m?.status !== "available", S = Ls(t), M = new Map(a?.expected_tables ?? []);
  return p`
    <section class="step-content offset-step" aria-labelledby="step-heading">
      ${O ? p`
        <div class="warning-band" role="status">
          <strong>Offset calibration is ${m?.status === "invalid" ? "not safely available" : "not available on this firmware"}.</strong>
          ${m?.status === "invalid" ? p`<p>Repair reason: ${m.repair_reason}</p>` : R}
          <p>Skip preserves the offset values already saved in flash. No clear control is invoked.</p>
        </div>
      ` : p`
        <ol class="offset-stage-stepper" aria-label="Offset calibration stages">
          <li class=${i === 1 ? "active" : T ? "complete" : "pending"}>
            <button data-offset-stage="1" aria-current=${i === 1 ? "step" : R} @click=${() => u(1)}>1. Voltage/current zero offset</button>
          </li>
          <li class=${i === 2 ? "active" : P ? "complete" : "pending"}>
            <button data-offset-stage="2" aria-current=${i === 2 ? "step" : R} ?disabled=${!T}
              @click=${() => u(2)}>2. Active/reactive power offset</button>
          </li>
        </ol>
        <div class="board-tabs" role="tablist" aria-label="Offset calibration boards">
          ${Array.from({ length: n?.board_count ?? v.length }, (I, B) => p`
            <button role="tab" data-offset-board id=${`offset-board-tab-${B}`} aria-controls="offset-board-panel"
              aria-selected=${B === t} tabindex=${B === t ? "0" : "-1"}
              @keydown=${(F) => xe(F, B)} @click=${() => c(B)}>
              ${wt(B)}
            </button>
          `)}
        </div>
        <div id="offset-board-panel" role="tabpanel" aria-labelledby=${`offset-board-tab-${t}`}>
          <h2>Stage ${i} · ${wt(t)}</h2>
          <div class="warning-band"><strong>Warning:</strong> An open-circuit current-output CT on a live conductor can be hazardous. De-energize conductors before unplugging any CT.</div>
          ${i === 1 ? p`
            <p>First, de-energize all conductors. Then unplug the voltage transformer/AC voltage input and CT inputs, power the meter from USB only, then check that every voltage/current phase reads near zero.</p>
          ` : p`
            <p>Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors, connect/enclose/energize only the voltage reference, then check that voltage is present on both chips and every current phase reads near zero.</p>
          `}
          <p>Measurements cannot prove that a transformer or CT is physically unplugged. Physical acknowledgement never substitutes for measured readiness.</p>
          <label class="check-row"><input type="checkbox" .checked=${s} @change=${(I) => d(I.target.checked)}>
            ${i === 1 ? "I completed the USB-only, de-energized preparation." : "I powered down for rewiring and safely enclosed and energized only the voltage reference."}
          </label>
          <div class="offset-actions">
            <button class="secondary" data-action="check-offset" ?disabled=${l || !s || y === "completed"} @click=${b}>
              ${l ? "Checking measured readiness…" : "Check measured readiness"}
            </button>
            <button class="primary" data-action="calibrate-offset"
              ?disabled=${l || !s || !o?.ready || y === "completed" || $ && !r}
              @click=${h}>${a?.retry_allowed ? "Retry unfinished chip" : `Run Stage ${i} calibration`}</button>
          </div>
          ${o ? p`
            <section class="measurement-evidence" aria-label="Offset readiness evidence">
              <h3>Measured readiness</h3>
              <div class=${o.ready ? "success-band" : "warning-band"} role="status" aria-live="polite">
                ${o.ready ? "Measured readiness passed." : "Measured readiness did not pass. Physical acknowledgement is not enough."}
              </div>
              ${o.reasons.length ? p`<ul>${o.reasons.map((I) => p`<li>${I}</li>`)}</ul>` : R}
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
                ${o.entities.map((I) => p`<tr><td>${I.role}</td><td>${I.quantity}</td><td>${I.ready ? "Ready" : I.reasons.join("; ")}</td>
                  <td>${I.window?.mean ?? "—"}</td><td>${I.window?.absolute_peak ?? "—"}</td><td>${I.window?.absolute_spread ?? "—"}</td></tr>`)}
              </tbody></table>
            </section>
          ` : R}
          <section class="measurement-evidence" aria-label="Per-chip offset progress" aria-live="polite">
            <h3>Per-chip progress</h3>
            <table><thead><tr><th>Chip</th><th>State</th><th>Backend evidence</th></tr></thead><tbody>
              ${S.map((I) => p`<tr><td>${I}</td><td>${M.has(I) || y === "completed" ? "Saved; restart verification required." : a?.unfinished_group_keys.includes(I) ? "Unfinished" : y.replaceAll("_", " ")}</td>
                <td>${M.has(I) ? M.get(I).map(([B, F]) => `${B}/${F}`).join(", ") : "—"}</td></tr>`)}
            </tbody></table>
          </section>
          ${$ ? p`<aside class="recovery-panel" role="status" aria-live="assertive">
            <strong>${a ? a.state === "partial" ? "One chip finished; recovery is required" : "Calibration outcome is indeterminate" : "Recovery is required"}</strong>
            <p>${a?.error ?? "The prior operation did not finish cleanly"}. Reconnect and inspect before retrying only the unfinished chip.</p>
            <label class="check-row"><input type="checkbox" .checked=${r} @change=${(I) => g(I.target.checked)}> I reviewed the evidence and confirm this retry.</label>
            <button class="secondary" @click=${f}>Reconnect and inspect</button>
          </aside>` : R}
        </div>
      `}
      <footer class="action-footer offset-footer">
        <button class="secondary" @click=${C}>Back</button>
        <button class="secondary" data-action="skip-offset" ?disabled=${l || P} @click=${_}>Skip offset calibration</button>
        <button class="primary" ?disabled=${l || !P} @click=${x}>Continue</button>
      </footer>
    </section>
  `;
}
const Vs = [
  ["power_quality", "Power quality sensors"],
  ["status_fields", "Status fields"]
], J = (n) => ({
  power_quality: Array(n + 1).fill(!1),
  status_fields: [!0, ...Array(n).fill(!1)]
}), Gs = (n, e) => {
  const t = J(e);
  return {
    power_quality: t.power_quality.map((i, s) => n.power_quality[s] ?? i),
    status_fields: t.status_fields.map((i, s) => n.status_fields[s] ?? i)
  };
};
function Kt(n, e) {
  return p`<section class="package-options" aria-labelledby="package-options-heading">
    <h2 id="package-options-heading">Optional meter fields</h2>
    <p>Choose which meter boards expose additional power quality and status entities.</p>
    ${Vs.map(([t, i]) => {
    const s = n[t], r = s.every(Boolean), o = s.some(Boolean) && !r;
    return p`<fieldset class="choice-field feature-options">
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
        ${s.map((a, l) => p`<label>
          <input type="checkbox" data-feature=${t} data-board=${l}
            .checked=${a}
            @change=${(c) => e({
      ...n,
      [t]: s.map((u, d) => d === l ? c.currentTarget.checked : u)
    })} />
          <span>${l === 0 ? "Main board" : `Add-on ${l}`}</span>
        </label>`)}
      </fieldset>`;
  })}
  </section>`;
}
function Ws(n, e, t, i, s, r, o) {
  const a = n.includes("failed") || n.includes("indeterminate"), l = !!(e?.offset_groups?.length || e?.power_offset_groups?.length), c = e?.source_handoff_available ? e.config_filename : l ? "Unavailable; offset calibration remains saved in flash" : "Unavailable in runtime-only mode";
  return p`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, voltage/current offsets, power offsets, and entity bindings.</p>
      <div class="status-band" role="status">${i ? "Restarting and verifying…" : n || "Ready for restart verification"}</div>
      ${e ? p`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${c}</dd></div></dl>` : ""}
      ${n === "cancelled" ? p`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${a ? p`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${t ? p`<button class="danger" data-action="rollback" @click=${r}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${o} ?disabled=${i}>Back</button><button class="primary" @click=${s} ?disabled=${i || n === "cancelled" || !!e}>${i ? "Restarting and verifying…" : n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Ks(n) {
  return n ? n.preflight.issues.length ? p`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((e) => p`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : p`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : p`<p>Starting a calibration session…</p>`;
}
function Ys(n, e, t, i, s, r, o = !1) {
  return p`
    <section class="step-content" aria-labelledby="step-heading">
      ${Ks(n)}
      ${n?.state === "cancelled" ? p`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
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
], Zs = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"], Xs = [
  ["split_phase_120_240", "Split phase 120/240 V"],
  ["single_phase_230", "Single phase 230 V"],
  ["three_phase", "Three phase"],
  ["custom", "Custom"]
], yt = (n) => n === "split_phase_120_240" ? 60 : n === "single_phase_230" ? 50 : null;
function Js(n, e, t, i, s, r, o, a, l = "", c = !1, u = p``, d = null, g = J(e), b = () => {
}, h = "split_phase_120_240", f = 60, _ = !1, C = () => {
}, x = () => {
}, m = () => {
}) {
  return p`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Configure an existing device</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        ${n?.devices.length ? p`<div class="meter-list">
          ${n.devices.map((v) => p`
            <div class="meter-row">
              <span><strong>${v.title}</strong><small>${v.project_name} · ${v.project_version ?? "version unavailable"}</small></span>
              <span>Device Builder: ${v.configuration ? "Yes" : v.importable ? "Yes — import available" : "No"}</span>
              ${v.importable && !v.configuration ? p`<button class="secondary" ?disabled=${!!l}
                @click=${() => a(v.entry_id)}>${d === v.entry_id ? "Retry import" : "Import"}</button>` : ""}
              <button class="primary" data-action="configure-device" ?disabled=${!!l}
                @click=${() => o(v.entry_id)}>${l === `topology:${v.entry_id}` ? "Loading topology…" : "Configure"}</button>
            </div>
          `)}
        </div>` : p`<div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>`}
      </section>
      ${c ? "" : p`<hr />
      <h2>Set up a new device</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (v, P) => p`
            <label class=${P === e ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(P)}
                .checked=${P === e} @change=${() => i(P)} />
              <span>${P}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Electrical system</legend>
        <p id="electrical-profile-help">Confirm the line frequency before it is saved with this installation.</p>
        <div class="connection-options">
          ${Xs.map(([v, P]) => p`
            <label class=${v === h ? "selected" : ""}>
              <input name="electrical-system" type="radio" .value=${v}
                .checked=${v === h} @change=${() => C(v)} />
              <span>${P}</span>
            </label>
          `)}
        </div>
        <div class="connection-options" role="group" aria-describedby="electrical-profile-help">
          ${[50, 60].map((v) => p`<label class=${v === f ? "selected" : ""}>
            <input name="line-frequency" type="radio" .value=${String(v)} .checked=${v === f}
              @change=${() => x(v)} /> <span>${v} Hz</span>
          </label>`)}
        </div>
        <p>${yt(h) ? `${yt(h)} Hz is suggested; confirm it after checking your supply.` : "Choose the line frequency for this electrical system."}</p>
        <button class="secondary" data-action="confirm-electrical-profile" ?disabled=${f === null} @click=${m}>
          ${_ ? "Electrical profile confirmed" : "Confirm electrical profile"}
        </button>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${$t.map(([v, P]) => p`
            <label class=${v === t ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${v}
                .checked=${v === t} @change=${() => s(v)} />
              <span>${P}</span>
            </label>
          `)}
        </div>
      </fieldset>
      ${Kt(g, b)}
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>Add-on boards</dt><dd>${e}</dd></div>
          <div><dt>Connection</dt><dd>${$t.find(([v]) => v === t)?.[1]}</dd></div>
          ${Zs.slice(0, e).map((v, P) => p`<div><dt>Add-on ${P + 1}</dt><dd>${v}</dd></div>`)}
        </dl>
      </section>
      ${u}
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
      <button class="rescan" data-action="rescan" ?disabled=${!!l} @click=${r}>${l === "rescan" ? "Rescanning…" : "Rescan for device"}</button>
    </section>
  `;
}
function Yt(n, e, t, i, s, r = null, o = !1) {
  return p`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((a) => p`<li>${a.source}: ${a.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([a, l]) => p`<div data-target=${a}>${Ke(l)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([a, l]) => p`<div data-target=${a}>${Ye(l)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${t?.evidence.join(", ") || "No build evidence."}</p><p>${t?.progress.join(", ") || "No transaction progress."}</p>
          ${t?.validation_detail ? p`<p>Validation code ${t.validation_detail.code ?? "unavailable"}; ${t.validation_detail.error_record_count} error records; ${t.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${t?.upload_progress?.length ? p`<ul>${t.upload_progress.map((a) => p`<li>${a.stage}: ${a.percentage ?? "in progress"}${a.percentage != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Calibration completion record</h3><p>${r ? `Restart-verified ${r.source_authority.replaceAll("_", " ")} calibration record` : o ? "No-change completion; no restart-verified record was created" : "Not yet established"}</p><p>${r ? `Verification ${r.verification_id}, generation ${r.connection_generation}; ${r.offset_groups?.length ?? 0} voltage/current offset tables; ${r.power_offset_groups?.length ?? 0} power-offset tables.` : o ? "The server confirmed there were no pending gain or offset changes." : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function Qs(n, e, t, i, s, r, o, a, l, c) {
  const u = !!(r?.offset_groups?.length || r?.power_offset_groups?.length), d = r?.source_authority === "saved_flash" && r.config_filename && !u && (r.source_handoff_available || r.source_handoff_firmware_installed);
  return p`
    <section class="step-content" aria-labelledby="step-heading">
      ${r && u ? p`<div class="success-band" role="status">Setup and exact restart verification are complete. Offset calibration remains saved in flash; YAML handoff and flash clearing are unavailable.</div>` : r?.source_authority === "configuration" ? p`<div class="success-band" role="status">Calibration saved to YAML; flash values cleared.</div>` : r ? p`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : o ? p`<div class="success-band" role="status">Completed without calibration changes. No restart or restart-verified calibration record was required.</div>` : p`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${a ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${r?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${r?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${Yt(n, e, t, i, s, r, o)}
      <footer class="action-footer"><button class="secondary" @click=${c}>Back</button>
        ${d ? p`<button class="primary" data-action="save-calibration" @click=${l}>${r?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : ""}
      </footer>
    </section>
  `;
}
function Zt(n) {
  const e = n.addon_count, t = n.evidence.map((i) => i.source);
  return e < 0 || e > 6 || n.board_count !== e + 1 || n.ct_count !== 6 * (e + 1) || n.group_count !== 2 * (e + 1) || n.evidence.length < 1 || n.evidence.length > 5 || new Set(t).size !== t.length || !t.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || n.evidence.some((i) => i.addon_count !== e);
}
function en(n, e, t, i, s = !1, r = !1, o = null, a = () => {
}) {
  const l = s || Zt(n);
  return p`
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
        <tbody>${n.evidence.map((c) => p`
          <tr><td>${c.source.replaceAll("_", " ")}</td><td>${c.addon_count}</td><td>${c.detail}</td></tr>
        `)}</tbody>
      </table>
      ${o ? Kt(o, a) : ""}
      ${l ? p`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : p`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${t}>Back</button>
        ${l ? "" : p`<button class="primary" data-action="continue" ?disabled=${r} @click=${i}>${r ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
function tn(n, e, t, i, s = [], r, o, a, l, c, u, d, g, b) {
  const h = i.length, f = i.slice(0, h).every((T) => Number.isFinite(T) && T > 0), _ = t === 0 ? ["meter_main1", "meter_main2"] : [`addon${t}_1`, `addon${t}_2`], C = new Set(o.flatMap((T) => T.state === "applied_pending_restart_verification" && T.gain_evidence?.flash_saved ? [T.gain_evidence.instance_id] : [])), x = C.size === _.length && _.every((T) => C.has(T)), m = o.find((T) => T.retry_allowed) ?? null, v = o.some((T) => T.state !== "applied_pending_restart_verification" && !T.retry_allowed), P = t === 0 ? "Main Board" : `Add-on ${t}`;
  return p`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Nt(f, r, x ? o[0] ?? null : null)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: n?.board_count ?? 1 }, (T, y) => p`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${y}`} aria-controls="voltage-board-panel"
          aria-selected=${y === t} tabindex=${y === t ? "0" : "-1"}
          @keydown=${($) => xe($, y)}
          @click=${() => l(y)}>${y === 0 ? "Main Board" : `Add-on ${y}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${t}`}>
      <h2>Calibrate Voltage</h2>
      ${Bt(e, _, "Voltage", C)}
      <div class="reference-block">
        ${Array.from({ length: h }, (T, y) => p`<label>${s[y] ?? (h === 1 ? "Trusted instrument" : `Voltage ${y + 1}`)} trusted reference
          <input type="number" min="0.01" step="0.01" .value=${i[y] ? String(i[y]) : ""}
            @input=${($) => c(y, Number($.target.value))} /></label>`)}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${u} ?disabled=${a}>${a ? "Loading live voltage data…" : "Check stability"}</button>
        <button class="primary" @click=${d} ?disabled=${a || !f || !r?.stable || v || x && !m}>${m ? "Retry voltage calibration" : "Calibrate voltage"}</button></div>
      ${r ? p`<div class=${r.stable ? "success-band" : "warning-band"} role="status">${r.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${Ke(r)}
      ${x ? p`<div class="success-band" role="status">Voltage calibration complete for ${P}.</div>` : ""}
      ${o.map((T) => Ye(T))}
      ${o.some((T) => T.state === "indeterminate") ? p`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${g}>Reconnect and inspect</button><button class="danger" @click=${b}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const sn = ti`
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
], nn = "circuitsetup.6c-energy-meter", rn = 1e4, on = 250, St = (n) => new Promise((e) => setTimeout(e, n)), Ct = ({ authoritative: n, warnings: e, ...t }) => t;
class an extends he {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.addonCount = 0, this.packageOptions = J(0), this.sourcePackageOptions = J(0), this.connection = "wifi", this.electricalSystem = "split_phase_120_240", this.lineFrequencyHz = 60, this.electricalProfileConfirmed = !1, this.meterSettingsDraft = null, this.meterConfiguration = null, this.multiReferencePreparationAcknowledged = !1, this.meterFrequencyTouched = !1, this.meterNominalVoltageTouched = /* @__PURE__ */ new Set(), this.canonicalConfigurationChanged = !1, this.board = 0, this.group = 0, this.channel = 1, this.voltageReferences = /* @__PURE__ */ new Map(), this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.firmwareIndex = null, this.firmwareCatalogState = "idle", this.firmwareCatalogError = "", this.selectedEspHomeVersion = null, this.resolvedFirmwareOptions = [], this.firmwareFetchController = null, this.setupDeviceIds = /* @__PURE__ */ new Set(), this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.setupUnsub = null, this.sessionStarting = !1, this.pendingAction = "", this.importFailedDeviceId = null, this.newInstallDeviceId = null, this.voltageBusy = !1, this.offsetBusy = !1, this.finishBusy = !1, this.restartBusy = !1, this.voltageSkipped = !1, this.currentSkipped = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = sn;
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
    const s = e.devices.filter((r) => !this.setupDeviceIds.has(r.entry_id)).sort((r, o) => r.entry_id.localeCompare(o.entry_id)).filter((r) => r.project_name.startsWith(nn));
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
    this.firmwareFetchController?.abort(), this.firmwareFetchController = t, this.firmwareCatalogState = "loading", this.firmwareCatalogError = "", this.requestUpdate(), Ps(globalThis.fetch, t.signal).then((i) => {
      this.ownsFirmwareCatalog(e, t) && (this.firmwareIndex = i, this.firmwareFetchController = null, this.firmwareCatalogState = "ready", this.refreshFirmwareOptions());
    }).catch(() => {
      this.ownsFirmwareCatalog(e, t) && (this.firmwareFetchController = null, this.firmwareCatalogState = "error", this.firmwareCatalogError = "Firmware catalog could not be loaded.", this.requestUpdate());
    });
  }
  refreshFirmwareOptions() {
    const e = this.firmwareIndex ? Ds(this.firmwareIndex, this.addonCount, this.connection) : [], t = this.selectedEspHomeVersion, i = Ns(e, t);
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
    ++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = e, e !== this.newInstallDeviceId && (this.newInstallDeviceId = null), this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.meterSettingsDraft = null, this.meterConfiguration = null, this.multiReferencePreparationAcknowledged = !1, this.meterFrequencyTouched = !1, this.meterNominalVoltageTouched = /* @__PURE__ */ new Set(), this.canonicalConfigurationChanged = !1, this.board = 0, this.resetCalibrationRun();
  }
  firstDeviceId(e) {
    return e.map((t) => t.entry_id).sort((t, i) => t.localeCompare(i))[0] ?? null;
  }
  showTopology(e) {
    this.topology = e, this.error = Zt(e) || e.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
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
    this.addonCount = e, this.packageOptions = Gs(this.packageOptions, e), this.sourcePackageOptions = J(e), this.refreshFirmwareOptions();
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
      if (!this.ownsOperation(i, t, e) || (this.setup = r, this.setupDeviceIds = new Set(r.devices.map((l) => l.entry_id)), await this.subscribeSetup(s, t), !this.ownsOperation(i, t, e))) return;
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
    const s = Date.now() + rn;
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
      await St(Math.min(on, s - Date.now()));
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
    }, this.updateMeterSettings(this.meterSettingsDraft), this.requestUpdate();
  }
  setMeterFrequency(e) {
    this.meterSettingsDraft && (this.meterFrequencyTouched = !0, this.meterSettingsDraft = { ...this.meterSettingsDraft, line_frequency_hz: e }, this.updateMeterSettings(this.meterSettingsDraft), this.requestUpdate());
  }
  setMeterNominalVoltage(e, t) {
    this.meterSettingsDraft && (this.meterNominalVoltageTouched = new Set(this.meterNominalVoltageTouched).add(e), this.meterSettingsDraft = { ...this.meterSettingsDraft, voltage_references: this.meterSettingsDraft.voltage_references.map((i) => i.reference_id === e ? { ...i, nominal_voltage_v: t } : i) }, this.updateMeterSettings(this.meterSettingsDraft), this.requestUpdate());
  }
  async continueFromMeterSettings() {
    if (!this.api || !this.selectedDeviceId || !this.meterSettingsDraft || this.pendingAction) return;
    this.pendingAction = "inventory", this.requestUpdate();
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    try {
      await this.run(async () => {
        this.updateCircuitConfiguration({
          ...this.meterConfiguration.configuration,
          meter: Ct(this.meterSettingsDraft),
          multi_reference_preparation_acknowledged: this.multiReferencePreparationAcknowledged
        }, !1);
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
    if (i) {
      if (this.drafts = new Map(this.drafts).set(e, { ...i, ...t }), this.meterConfiguration && !this.labelOnly) {
        const s = { ...i, ...t };
        this.updateCircuitConfiguration({
          ...this.meterConfiguration.configuration,
          channels: this.meterConfiguration.configuration.channels.map((r) => r.channel === e ? {
            ...r,
            name: s.name,
            model_id: s.modelId,
            reporting_multiplier: s.multiplier,
            custom_gain_ct: s.modelId === "custom" ? s.customGainCt ?? null : null,
            custom_label: s.modelId === "custom" && s.customLabel?.trim() || null,
            burden_output_acknowledged: s.burdenAcknowledged
          } : r)
        });
      }
      this.requestUpdate();
    }
  }
  updateCircuitConfiguration(e, t = !0) {
    this.meterConfiguration && (this.meterConfiguration = { ...this.meterConfiguration, configuration: e }, this.canonicalConfigurationChanged ||= t, this.requestUpdate());
  }
  updateMeterSettings(e) {
    this.meterSettingsDraft = e, this.meterConfiguration && this.updateCircuitConfiguration({
      ...this.meterConfiguration.configuration,
      meter: Ct(e),
      multi_reference_preparation_acknowledged: this.multiReferencePreparationAcknowledged
    });
  }
  disableCircuit(e) {
    if (!this.meterConfiguration) return;
    const t = this.meterConfiguration.configuration.aggregates.filter((r) => r.channels.includes(e)), i = t.filter((r) => {
      const o = r.channels.filter((a) => a !== e).length;
      return !o || r.measurement_method === "two_ct_sum" && o !== 2 || (r.measurement_method === "one_ct_double_power" || r.measurement_method === "both_conductors_one_ct") && o !== 1;
    }), s = i.map((r) => r.name);
    if (t.length && !window.confirm(`Marking CT${e} unused removes it from ${t.map((r) => r.name).join(", ")}${s.length ? ` and deletes invalid aggregate ${s.join(", ")}` : ""}. Continue?`)) {
      this.requestUpdate();
      return;
    }
    this.updateCircuitConfiguration({
      ...this.meterConfiguration.configuration,
      channels: this.meterConfiguration.configuration.channels.map((r) => r.channel === e ? { ...r, enabled: !1, role: "unused" } : r),
      aggregates: this.meterConfiguration.configuration.aggregates.filter((r) => !i.includes(r)).map((r) => ({
        ...r,
        channels: r.channels.filter((o) => o !== e)
      }))
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
      const o = e.filter((a) => a.name !== this.inventory.channels.find((l) => l.channel === a.channel)?.name).map(({ channel: a, name: l }) => ({ channel: a, name: l }));
      if (!o.length || e.some((a) => {
        const l = this.inventory.channels.find((c) => c.channel === a.channel);
        return !l || a.model_id !== (l.selected_model_id ?? "") || (a.reporting_multiplier ?? 1) !== l.reporting_multiplier;
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
    if (this.meterConfiguration && !this.labelOnly && this.canonicalConfigurationChanged) return this.previewCanonicalConfiguration();
    const e = ne(this.inventory, this.drafts);
    if (this.labelOnly && e.length) {
      const t = e.map(({ channel: a, name: l }) => ({ channel: a, name: l })), i = this.api, s = this.selectedDeviceId, r = this.inventory, o = ++this.operationGeneration;
      if (this.pendingAction = "session", this.requestUpdate(), await this.run(async () => {
        await i.setHaLabels(s, r.plan_id, r.source_sha256, t), this.ownsOperation(o, i, s) && (this.inventory = { ...r, channels: r.channels.map((a) => {
          const l = t.find((c) => c.channel === a.channel);
          return l ? { ...a, name: l.name } : a;
        }) }, this.announcement = "Home Assistant labels saved.");
      }, "Home Assistant labels could not be saved.", () => this.ownsOperation(o, i, s)), this.pendingAction = "", this.error) return;
    }
    if (this.meterConfiguration && this.canonicalConfigurationChanged) return this.previewCanonicalConfiguration();
    await this.startSession();
  }
  async previewCanonicalConfiguration() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || !this.meterConfiguration) return;
    const e = this.meterConfiguration.configuration;
    if (!os(e, this.inventory.channels.length)) return this.fail(new Error(), "Complete the circuit and aggregate assignments before review.");
    this.pendingAction = "session";
    const t = this.api, i = this.selectedDeviceId, s = this.meterConfiguration, r = ++this.operationGeneration;
    await this.run(async () => {
      this.transaction = await t.previewMeterConfiguration(i, s.plan_id, s.source_sha256, e), this.ownsOperation(r, t, i) && (this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
    }, "Circuit configuration could not be reviewed.", () => this.ownsOperation(r, t, i)), this.pendingAction = "", this.requestUpdate();
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
        } catch (l) {
          if (l.code !== "stale_confirmation") throw l;
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
            const l = {
              power_quality: [...this.sourcePackageOptions.power_quality],
              status_fields: [...this.sourcePackageOptions.status_fields]
            };
            for (const c of a.changes) {
              const u = /^package\.(main|addon([1-6]))\.(power_quality|status_fields)$/.exec(c.key);
              if (!u || !["enabled", "disabled"].includes(c.old_value ?? "")) continue;
              const d = u[1] === "main" ? 0 : Number(u[2]), g = u[3];
              l[g][d] = c.old_value === "enabled";
            }
            this.sourcePackageOptions = l;
          }
          if (e === "install" && this.calibrationHandoff && a.state === "verified" && this.session && this.topology && this.restartResult) {
            this.restartResult = {
              ...this.restartResult,
              source_handoff_available: !1,
              source_handoff_transaction_id: a.transaction_id,
              source_handoff_firmware_installed: !0
            }, this.navigate("summary");
            const l = await t.clearCalibrationFlash(
              this.session.session_id,
              this.restartResult.verification_id,
              a.transaction_id,
              this.topology
            );
            if (!this.ownsOperation(r, t, i)) return;
            this.restartResult = l, this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash.");
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
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.board, r = this.offsetStage, o = this.offsetKey(s, r), a = this.offsetResultByTarget.get(o), l = this.session.offset_boards?.[s]?.stages[r - 1]?.state, c = !!a?.retry_allowed || l === "partial" || l === "indeterminate";
    if (this.offsetAcknowledged[r - 1] !== !0 || c && !this.offsetRetryConfirmed) return;
    const u = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const d = await e.calibrateOffset(i, s, r, !0, c);
          if (!this.ownsOperation(u, e, t) || this.session?.session_id !== i) return;
          this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(o, d);
          const g = (this.session.offset_boards ?? []).map((f) => f.board_index !== s ? f : {
            ...f,
            stages: f.stages.map((_) => _.stage !== r ? _ : {
              ..._,
              state: d.state === "applied_pending_restart_verification" ? "completed" : d.state
            })
          }), b = g.flatMap((f) => f.stages.map((_) => _.state)), h = b.every((f) => f === "completed") ? "completed" : b.some((f) => f === "partial" || f === "indeterminate") ? "partial" : "in_progress";
          this.session = {
            ...this.session,
            offset_boards: g,
            offset_disposition: h,
            has_pending_calibration: this.session.has_pending_calibration || d.expected_tables.length > 0
          }, this.offsetAcknowledged = this.offsetAcknowledged.map((f, _) => _ === r - 1 ? !1 : f), this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget), this.offsetReadinessByTarget.delete(o), this.offsetRetryConfirmed = !1, this.announcement = d.state === "applied_pending_restart_verification" ? `Board ${s + 1} Stage ${r} saved; restart verification required.` : `Board ${s + 1} Stage ${r} requires recovery before retry.`;
        },
        "Offset calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(u, e, t)
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
            for (const l of o) {
              const c = await t.checkStability(s, "voltage", l);
              if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
              a.set(`voltage:${l}`, c);
            }
            this.stabilityByTarget = a, this.announcement = "Loaded voltage data for the selected reference.";
            return;
          }
          for (const [a, l] of o.entries()) {
            const c = await t.checkStability(s, e, l);
            if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${l}`, c), a < o.length - 1 && this.requestUpdate();
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
            const c = new Map(this.calibrationByTarget), u = this.voltageReferenceIds().map((d, g) => ({ referenceId: d, value: this.voltageReferences instanceof Map ? this.voltageReferences.get(d) ?? 0 : this.voltageReferences[g] ?? 0 })).filter(({ referenceId: d }) => !this.voltageReferenceComplete(d));
            if (u.some(({ value: d }) => !Number.isFinite(d) || d < 1 || d > 600) || u.some(({ referenceId: d }) => !this.stabilityByTarget.get(`voltage:${d}`)?.stable))
              throw new Error("Voltage references must be valid and stable before calibration.");
            for (const { referenceId: d, value: g } of u) {
              const b = await t.calibrateVoltage(s, d, g, !0);
              if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
              b.forEach((h) => c.set(`voltage:${h.group_key}`, h)), this.calibrationByTarget = new Map(c), this.requestUpdate();
            }
            this.calibrationByTarget = c, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = "Calibrated the selected voltage reference.";
            return;
          }
          const a = await t.calibrateCurrent(
            s,
            o,
            !0,
            this.inventory && !this.labelOnly ? ne(this.inventory, this.drafts).map((c) => ({
              channel: c.channel,
              reporting_multiplier: c.reporting_multiplier ?? 1
            })) : []
          );
          if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
          const l = new Map(this.calibrationByTarget);
          o.forEach((c) => l.set(`current:${c.channel}`, a)), this.calibrationByTarget = l, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = `Calibration iteration ${a.iteration} finished with state ${a.state}.`;
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
          } catch (l) {
            throw this.ownsOperation(r, e, t) && this.session?.session_id === i && this.topology === s && (this.restartResult = null, this.session = { ...this.session, state: "restart_failed" }), l;
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
    return this.step === "setup" ? p`${Js(
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
      ${this.topology ? en(
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
    ) : R}` : this.step === "meter" && this.meterSettingsDraft && this.meterConfiguration ? us(
      this.meterSettingsDraft,
      this.meterConfiguration.voltage_transformer_catalog,
      this.multiReferencePreparationAcknowledged,
      (e) => this.updateMeterSettings(e),
      (e) => this.setMeterProfile(e),
      (e) => this.setMeterFrequency(e),
      (e, t) => this.setMeterNominalVoltage(e, t),
      (e) => {
        this.multiReferencePreparationAcknowledged = e, this.meterSettingsDraft && this.updateMeterSettings(this.meterSettingsDraft), this.requestUpdate();
      },
      () => this.back(),
      () => {
        this.continueFromMeterSettings();
      }
    ) : this.step === "ct" && this.inventory ? p`<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
      this.labelOnly = !1, this.requestUpdate();
    }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
      this.labelOnly = !0, this.requestUpdate();
    }}>Home Assistant labels only</label></fieldset>${ts(
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
    )}` : this.step === "build" ? es(
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
    ) : this.step === "safety" ? Ys(
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
    ) : this.step === "offset" ? js(
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
    ) : this.step === "voltage" ? p`${this.meterSettingsDraft?.warnings.includes("slow_interval_extends_calibration") ? p`<div class="warning-band" role="status">This meter uses a ${this.meterSettingsDraft.update_interval_s}-second update interval. Calibration takes longer; keep the reference stable until each check finishes.</div>` : R}${tn(
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
        <button class="primary" ?disabled=${this.voltageBusy || !this.voltageSkipped && !this.hasCompletedCalibration("voltage")} @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? p`${ls(
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
    }}>${this.finishBusy ? "Finishing…" : "Continue"}</button></footer>` : this.step === "restart" ? Ws(
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
    ) : this.step === "summary" ? Qs(
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
    ) : p`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct" ? "CT settings are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }
  firmwareCatalog() {
    const e = this.firmwareCatalogState === "loading";
    return p`<section class="step-content" aria-labelledby="firmware-heading">
      <h2 id="firmware-heading">Install firmware</h2>
      <label>ESPHome firmware version
        <select data-action="firmware-version" ?disabled=${e || this.firmwareCatalogState !== "ready" || !this.resolvedFirmwareOptions.length}
          @change=${(t) => this.selectFirmwareVersion(t.target.value)}>
          ${this.resolvedFirmwareOptions.map((t, i) => p`<option value=${t.version} ?selected=${t.version === this.selectedEspHomeVersion}>${t.version}${i === 0 ? " (newest)" : ""}</option>`)}
        </select>
      </label>
      ${this.firmwareCatalogState === "error" ? p`<div class="error-panel" role="status">
        <strong>${this.firmwareCatalogError}</strong>
        <button class="secondary" data-action="firmware-retry" @click=${() => this.retryFirmwareIndex()}>Retry</button>
      </div>` : R}
      ${e ? p`<p role="status">Loading firmware versions…</p>` : R}
      ${this.firmwareCatalogState === "ready" && !this.resolvedFirmwareOptions.length ? p`<p role="status">No firmware version is available for this hardware.</p>` : R}
      ${this.firmwareCatalogState === "ready" ? Hs(this.selectedFirmware()) : R}
    </section>`;
  }
  render() {
    const e = le.findIndex(([t]) => t === this.step);
    return p`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${le.map(([t, i], s) => p`
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
          ${this.error ? p`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : R}
          ${this.stepBody()}
          ${e >= 2 && !["voltage", "current", "summary"].includes(this.step) ? Yt(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : R}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", an);
export {
  an as CircuitSetupPanel
};
