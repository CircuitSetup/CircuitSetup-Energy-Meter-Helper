const fe = globalThis, Ae = fe.ShadowRoot && (fe.ShadyCSS === void 0 || fe.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Re = /* @__PURE__ */ Symbol(), ze = /* @__PURE__ */ new WeakMap();
let ot = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== Re) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Ae && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = ze.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && ze.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const yt = (n) => new ot(typeof n == "string" ? n : n + "", void 0, Re), $t = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, s, o) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[o + 1], n[0]);
  return new ot(t, n, Re);
}, wt = (n, e) => {
  if (Ae) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = fe.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, n.appendChild(i);
  }
}, je = Ae ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return yt(t);
})(n) : n;
const { is: St, defineProperty: kt, getOwnPropertyDescriptor: Ct, getOwnPropertyNames: xt, getOwnPropertySymbols: Et, getPrototypeOf: At } = Object, me = globalThis, Ge = me.trustedTypes, Rt = Ge ? Ge.emptyScript : "", It = me.reactiveElementPolyfillSupport, ne = (n, e) => n, xe = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? Rt : null;
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
} }, rt = (n, e) => !St(n, e), He = { attribute: !0, type: String, converter: xe, reflect: !1, useDefault: !1, hasChanged: rt };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), me.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let ee = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = He) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && kt(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: o } = Ct(this.prototype, e) ?? { get() {
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
    return this.elementProperties.get(e) ?? He;
  }
  static _$Ei() {
    if (this.hasOwnProperty(ne("elementProperties"))) return;
    const e = At(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(ne("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(ne("properties"))) {
      const t = this.properties, i = [...xt(t), ...Et(t)];
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
      for (const s of i) t.unshift(je(s));
    } else e !== void 0 && t.push(je(e));
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
    return wt(e, this.constructor.elementStyles), e;
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
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : xe).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const o = i.getPropertyOptions(s), r = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : xe;
      this._$Em = s;
      const a = r.fromAttribute(t, o.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, o) {
    if (e !== void 0) {
      const r = this.constructor;
      if (s === !1 && (o = this[e]), i ??= r.getPropertyOptions(e), !((i.hasChanged ?? rt)(o, t) || i.useDefault && i.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(r._$Eu(e, i)))) return;
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
ee.elementStyles = [], ee.shadowRootOptions = { mode: "open" }, ee[ne("elementProperties")] = /* @__PURE__ */ new Map(), ee[ne("finalized")] = /* @__PURE__ */ new Map(), It?.({ ReactiveElement: ee }), (me.reactiveElementVersions ??= []).push("2.1.2");
const Ie = globalThis, Ve = (n) => n, ge = Ie.trustedTypes, Le = ge ? ge.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, at = "$lit$", V = `lit$${Math.random().toFixed(9).slice(2)}$`, ct = "?" + V, Tt = `<${ct}>`, J = document, re = () => J.createComment(""), ae = (n) => n === null || typeof n != "object" && typeof n != "function", Te = Array.isArray, Ot = (n) => Te(n) || typeof n?.[Symbol.iterator] == "function", ke = `[\x20\t
\f\r]`, se = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Fe = /-->/g, Ke = />/g, F = RegExp(`>|${ke}(?:([^\\s"'>=/]+)(${ke}*=${ke}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), We = /'/g, Ze = /"/g, dt = /^(?:script|style|textarea|title)$/i, Mt = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), l = Mt(1), te = /* @__PURE__ */ Symbol.for("lit-noChange"), S = /* @__PURE__ */ Symbol.for("lit-nothing"), Je = /* @__PURE__ */ new WeakMap(), Z = J.createTreeWalker(J, 129);
function lt(n, e) {
  if (!Te(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Le !== void 0 ? Le.createHTML(e) : e;
}
const Ut = (n, e) => {
  const t = n.length - 1, i = [];
  let s, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = se;
  for (let a = 0; a < t; a++) {
    const c = n[a];
    let p, g, d = -1, h = 0;
    for (; h < c.length && (r.lastIndex = h, g = r.exec(c), g !== null); ) h = r.lastIndex, r === se ? g[1] === "!--" ? r = Fe : g[1] !== void 0 ? r = Ke : g[2] !== void 0 ? (dt.test(g[2]) && (s = RegExp("</" + g[2], "g")), r = F) : g[3] !== void 0 && (r = F) : r === F ? g[0] === ">" ? (r = s ?? se, d = -1) : g[1] === void 0 ? d = -2 : (d = r.lastIndex - g[2].length, p = g[1], r = g[3] === void 0 ? F : g[3] === '"' ? Ze : We) : r === Ze || r === We ? r = F : r === Fe || r === Ke ? r = se : (r = F, s = void 0);
    const u = r === F && n[a + 1].startsWith("/>") ? " " : "";
    o += r === se ? c + Tt : d >= 0 ? (i.push(p), c.slice(0, d) + at + c.slice(d) + V + u) : c + V + (d === -2 ? a : u);
  }
  return [lt(n, o + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class ce {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let o = 0, r = 0;
    const a = e.length - 1, c = this.parts, [p, g] = Ut(e, t);
    if (this.el = ce.createElement(p, i), Z.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = Z.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(at)) {
          const h = g[r++], u = s.getAttribute(d).split(V), f = /([.?@])?(.*)/.exec(h);
          c.push({ type: 1, index: o, name: f[2], strings: u, ctor: f[1] === "." ? Nt : f[1] === "?" ? Pt : f[1] === "@" ? Dt : be }), s.removeAttribute(d);
        } else d.startsWith(V) && (c.push({ type: 6, index: o }), s.removeAttribute(d));
        if (dt.test(s.tagName)) {
          const d = s.textContent.split(V), h = d.length - 1;
          if (h > 0) {
            s.textContent = ge ? ge.emptyScript : "";
            for (let u = 0; u < h; u++) s.append(d[u], re()), Z.nextNode(), c.push({ type: 2, index: ++o });
            s.append(d[h], re());
          }
        }
      } else if (s.nodeType === 8) if (s.data === ct) c.push({ type: 2, index: o });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(V, d + 1)) !== -1; ) c.push({ type: 7, index: o }), d += V.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const i = J.createElement("template");
    return i.innerHTML = e, i;
  }
}
function ie(n, e, t = n, i) {
  if (e === te) return e;
  let s = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const o = ae(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== o && (s?._$AO?.(!1), o === void 0 ? s = void 0 : (s = new o(n), s._$AT(n, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = s : t._$Cl = s), s !== void 0 && (e = ie(n, s._$AS(n, e.values), s, i)), e;
}
class Bt {
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
    const { el: { content: t }, parts: i } = this._$AD, s = (e?.creationScope ?? J).importNode(t, !0);
    Z.currentNode = s;
    let o = Z.nextNode(), r = 0, a = 0, c = i[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let p;
        c.type === 2 ? p = new de(o, o.nextSibling, this, e) : c.type === 1 ? p = new c.ctor(o, c.name, c.strings, this, e) : c.type === 6 && (p = new qt(o, this, e)), this._$AV.push(p), c = i[++a];
      }
      r !== c?.index && (o = Z.nextNode(), r++);
    }
    return Z.currentNode = J, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class de {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = S, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    e = ie(this, e, t), ae(e) ? e === S || e == null || e === "" ? (this._$AH !== S && this._$AR(), this._$AH = S) : e !== this._$AH && e !== te && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Ot(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== S && ae(this._$AH) ? this._$AA.nextSibling.data = e : this.T(J.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = ce.createElement(lt(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const o = new Bt(s, this), r = o.u(this.options);
      o.p(t), this.T(r), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Je.get(e.strings);
    return t === void 0 && Je.set(e.strings, t = new ce(e)), t;
  }
  k(e) {
    Te(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const o of e) s === t.length ? t.push(i = new de(this.O(re()), this.O(re()), this, this.options)) : i = t[s], i._$AI(o), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = Ve(e).nextSibling;
      Ve(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class be {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, o) {
    this.type = 1, this._$AH = S, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = S;
  }
  _$AI(e, t = this, i, s) {
    const o = this.strings;
    let r = !1;
    if (o === void 0) e = ie(this, e, t, 0), r = !ae(e) || e !== this._$AH && e !== te, r && (this._$AH = e);
    else {
      const a = e;
      let c, p;
      for (e = o[0], c = 0; c < o.length - 1; c++) p = ie(this, a[i + c], t, c), p === te && (p = this._$AH[c]), r ||= !ae(p) || p !== this._$AH[c], p === S ? e = S : e !== S && (e += (p ?? "") + o[c + 1]), this._$AH[c] = p;
    }
    r && !s && this.j(e);
  }
  j(e) {
    e === S ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Nt extends be {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === S ? void 0 : e;
  }
}
class Pt extends be {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== S);
  }
}
class Dt extends be {
  constructor(e, t, i, s, o) {
    super(e, t, i, s, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = ie(this, e, t, 0) ?? S) === te) return;
    const i = this._$AH, s = e === S && i !== S || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, o = e !== S && (i === S || s);
    s && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class qt {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    ie(this, e);
  }
}
const zt = Ie.litHtmlPolyfillSupport;
zt?.(ce, de), (Ie.litHtmlVersions ??= []).push("3.3.3");
const jt = (n, e, t) => {
  const i = t?.renderBefore ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const o = t?.renderBefore ?? null;
    i._$litPart$ = s = new de(e.insertBefore(re(), o), o, void 0, t ?? {});
  }
  return s._$AI(n), s;
};
const Oe = globalThis;
class oe extends ee {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = jt(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return te;
  }
}
oe._$litElement$ = !0, oe.finalized = !0, Oe.litElementHydrateSupport?.({ LitElement: oe });
const Gt = Oe.litElementPolyfillSupport;
Gt?.({ LitElement: oe });
(Oe.litElementVersions ??= []).push("4.2.2");
const Ye = "circuitsetup_energy_meter_helper/", Ht = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, Vt = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, Lt = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, Ft = /[\u0000-\u001f\u007f-\u009f]/, Kt = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), Wt = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), Zt = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "partial", "indeterminate", "verified", "cancelled"]), Me = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), Qe = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), _e = /* @__PURE__ */ new Set(["A", "B", "C"]), Jt = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), Yt = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), Qt = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), Xt = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), ei = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), ti = /^(?:ct(?:[1-9]|[1-3][0-9]|4[0-2])_name|current_cal_ct(?:[1-9]|[1-3][0-9]|4[0-2])|voltage_cal[12])$/, ii = /^[0-9a-f]{12}$/, si = /^[0-9a-f]{64}$/, Xe = /^[0-9a-f]{32}$/, ni = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, et = /* @__PURE__ */ new Set(["preview_ct_config", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]), oi = /* @__PURE__ */ new Set(["available", "unavailable", "invalid"]), ri = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial"]), ai = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial", "indeterminate"]), ci = /* @__PURE__ */ new Set(["applied_pending_restart_verification", "partial", "indeterminate"]);
function $(n, e) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function w(n, e, t = 100) {
  if (!Array.isArray(n) || n.length > t) throw new Error(`${e} response is invalid`);
  return n;
}
function b(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${e} response is invalid`);
  return n;
}
function x(n, e) {
  if (typeof n != "number" || !Number.isFinite(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function y(n, e) {
  const t = x(n, e);
  if (!Number.isInteger(t)) throw new Error(`${e} response is invalid`);
  return t;
}
function B(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "boolean") throw new Error(`${e} response is invalid`);
  return n;
}
function E(n, e, t) {
  const i = b(n, t);
  if (!e.has(i)) throw new Error(`${t} response is invalid`);
  return i;
}
function Ee(n, e) {
  n !== void 0 && b(n, e, !0);
}
function j(n, e) {
  return Math.abs(n - e) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(e));
}
function G(n, e, t) {
  const i = Object.keys(n);
  if (i.length !== e.length || i.some((s) => !e.includes(s))) throw new Error(`${t} response is invalid`);
}
function pe(n, e) {
  return n.length === e.length && n.every((t, i) => t === e[i]);
}
function ht(n, e) {
  const t = $(n, e);
  b(t.entry_id, e), b(t.title, e), b(t.project_name, e), b(t.project_version, e, !0), B(t.importable, e, !0), b(t.configuration, e, !0);
}
function ue(n, e) {
  const t = $(n, e);
  if (E(t.state, Kt, e), w(t.devices, e).forEach((i) => ht(i, e)), t.configuration_authoritative !== void 0 && B(t.configuration_authoritative, e), t.installer_intent !== void 0) {
    const i = $(t.installer_intent, e), s = y(i.addon_count, e);
    if (s < 0 || s > 6) throw new Error(`${e} response is invalid`);
    if (E(i.connection_type, Me, e) === "unknown") throw new Error(`${e} response is invalid`);
  }
  return n;
}
function tt(n, e) {
  const t = $(n, e), i = y(t.addon_count, e), s = y(t.board_count, e), o = y(t.ct_count, e), r = y(t.group_count, e);
  if (i < 0 || i > 6 || s < 1 || s > 7 || o < 6 || o > 42 || r < 2 || r > 14 || s !== i + 1 || o !== 6 * s || r !== 2 * s) throw new Error(`${e} response is invalid`);
  E(t.connection_type, Me, e), b(t.voltage_layout, e), b(t.project_name, e);
  const a = w(t.evidence, e);
  if (a.length < 1 || a.length > Qe.size) throw new Error(`${e} response is invalid`);
  const c = a.map((p) => {
    const g = $(p, e), d = E(g.source, Qe, e), h = y(g.addon_count, e);
    if (h < 0 || h > 6) throw new Error(`${e} response is invalid`);
    return b(g.detail, e), d;
  });
  if (new Set(c).size !== c.length || !c.some((p) => ei.has(p))) throw new Error(`${e} response is invalid`);
  return n;
}
function di(n, e) {
  const t = $(n, e);
  return "topology" in t ? (tt(t.topology, e), t.configuration_authoritative !== void 0 && B(t.configuration_authoritative, e), n) : tt(n, e);
}
function li(n, e) {
  const t = $(n, e);
  b(t.plan_id, e), b(t.source_sha256, e);
  const i = w(t.channels, e);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${e} response is invalid`);
  i.forEach((r, a) => {
    const c = $(r, e), p = y(c.channel, e);
    b(c.name, e), y(c.raw_gain_ct, e), x(c.reporting_multiplier, e), Ee(c.selected_model_id, e), B(c.selection_verified_against_config, e), Ee(c.display_label, e);
    const g = $(c.address, e), d = y(g.channel, e), h = y(g.board_index, e), u = y(g.group_index, e), f = E(g.phase, _e, e), m = a + 1;
    if (p !== m || d !== m || h !== Math.floor(a / 6) || u !== Math.floor(a % 6 / 3) + 1 || f !== ["A", "B", "C"][a % 3]) throw new Error(`${e} response is invalid`);
  });
  const s = $(t.catalog, e);
  b(s.source_repository, e), b(s.source_ref, e), y(s.schema_version, e);
  const o = w(s.presets, e);
  if (o.length > 64) throw new Error(`${e} response is invalid`);
  return o.forEach((r) => {
    const a = $(r, e);
    b(a.model_id, e), b(a.label, e), x(a.rated_current_a, e), b(a.secondary, e), a.default_gain_ct !== null && y(a.default_gain_ct, e), B(a.requires_burden_jumper_cut, e), b(a.notes, e);
  }), n;
}
function Ce(n, e) {
  const t = $(n, e);
  if (b(t.transaction_id, e), E(t.state, Wt, e), b(t.source_sha256, e), B(t.rollback_available, e), b(t.redacted_diff, e), w(t.changes, e).forEach((i) => {
    const s = $(i, e), o = b(s.key, e);
    if (!ti.test(o)) throw new Error(`${e} response is invalid`);
    s.old_value !== null && b(s.old_value, e), b(s.new_value, e);
  }), w(t.evidence, e).forEach((i) => E(i, Yt, e)), w(t.progress, e).forEach((i) => E(i, Qt, e)), t.validation_detail != null) {
    const i = $(t.validation_detail, e);
    for (const s of ["reported_error_count", "reported_warning_count"]) i[s] !== null && y(i[s], e);
    i.code !== null && y(i.code, e), y(i.error_record_count, e), y(i.warning_record_count, e);
  }
  return t.upload_progress !== void 0 && w(t.upload_progress, e).forEach((i) => {
    const s = $(i, e);
    if (E(s.stage, Jt, e), s.progress !== null && s.percentage !== null && s.progress !== void 0 && s.percentage !== void 0) throw new Error(`${e} response is invalid`);
    const o = s.progress ?? s.percentage;
    if (o != null) {
      const r = y(o, e);
      if (r < 0 || r > 100) throw new Error(`${e} response is invalid`);
    }
  }), n;
}
function K(n, e) {
  const t = $(n, e);
  b(t.session_id, e), b(t.device_id, e), E(t.state, Zt, e), B(t.safety_acknowledged, e);
  const i = $(t.preflight, e);
  w(i.issues, e).forEach((d) => {
    const h = $(d, e);
    E(h.code, Xt, e), b(h.role, e), b(h.detail, e);
  }), w(i.zeroed_roles, e).forEach((d) => b(d, e)), t.entity_role_counts !== void 0 && Object.values($(t.entity_role_counts, e)).forEach((d) => {
    if (y(d, e) < 0) throw new Error(`${e} response is invalid`);
  }), t.calibration_sources !== void 0 && Object.values($(t.calibration_sources, e)).forEach((d) => E(d, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), e));
  const s = [t.offset_capability, t.offset_disposition, t.offset_boards, t.has_pending_calibration];
  if (s.every((d) => d === void 0)) return n;
  if (s.some((d) => d === void 0)) throw new Error(`${e} response is invalid`);
  const o = $(t.offset_capability, e);
  if (G(o, ["status", "repair_reason"], e), E(o.status, oi, e) === "invalid") b(o.repair_reason, e);
  else if (o.repair_reason !== null) throw new Error(`${e} response is invalid`);
  const a = E(t.offset_disposition, ri, e), c = w(t.offset_boards, e, 7);
  if (c.length < 1) throw new Error(`${e} response is invalid`);
  const p = [];
  c.forEach((d, h) => {
    const u = $(d, e);
    if (G(u, ["board_index", "stages"], e), y(u.board_index, e) !== h) throw new Error(`${e} response is invalid`);
    const f = w(u.stages, e, 2);
    if (f.length !== 2) throw new Error(`${e} response is invalid`);
    f.forEach((m, v) => {
      const _ = $(m, e);
      if (G(_, ["stage", "state"], e), y(_.stage, e) !== v + 1) throw new Error(`${e} response is invalid`);
      p.push(E(_.state, ai, e));
    });
  });
  const g = p.every((d) => d === "skipped") ? "skipped" : p.every((d) => d === "completed") ? "completed" : p.every((d) => d === "not_started") ? "not_started" : p.some((d) => d === "partial" || d === "indeterminate") || p.some((d) => d === "skipped") ? "partial" : "in_progress";
  if (a !== g) throw new Error(`${e} response is invalid`);
  return B(t.has_pending_calibration, e), n;
}
function hi(n, e, t, i) {
  const s = $(n, e);
  if (G(s, ["stage", "ready", "connection_generation", "entities", "reasons", "thresholds"], e), y(s.stage, e) !== i || t < 0 || t > 6) throw new Error(`${e} response is invalid`);
  const o = B(s.ready, e), r = y(s.connection_generation, e);
  if (r < 1) throw new Error(`${e} response is invalid`);
  const a = $(s.thresholds, e);
  G(a, ["sample_count", "zero_voltage_peak_volts", "zero_voltage_spread_volts", "zero_current_peak_amps", "zero_current_spread_amps", "voltage_present_minimum_volts", "voltage_present_spread_volts"], e);
  const c = y(a.sample_count, e), p = x(a.zero_voltage_peak_volts, e), g = x(a.zero_voltage_spread_volts, e), d = x(a.zero_current_peak_amps, e), h = x(a.zero_current_spread_amps, e), u = x(a.voltage_present_minimum_volts, e), f = x(a.voltage_present_spread_volts, e), m = [
    p,
    g,
    d,
    h,
    u,
    f
  ];
  if (c < 3 || c > 100 || m.some((P) => P < 0) || m[4] === 0) throw new Error(`${e} response is invalid`);
  const v = w(s.entities, e, 12);
  if (v.length !== 12) throw new Error(`${e} response is invalid`);
  const _ = /* @__PURE__ */ new Map();
  for (const P of [0, 1]) {
    const k = t === 0 ? `main_${P + 1}` : `addon${t}_${P + 1}`;
    for (const M of ["a", "b", "c"]) _.set(`${k}.voltage_${M}`, "voltage");
    for (let M = 1; M <= 3; ++M) _.set(`ct${t * 6 + P * 3 + M}.current_sensor`, "current");
  }
  const C = "entity binding is not on the active connection generation", I = "fresh window unavailable: ", T = /* @__PURE__ */ new Set(), U = [];
  let O = 0;
  v.forEach((P) => {
    const k = $(P, e);
    G(k, ["role", "quantity", "ready", "reasons", "window"], e);
    const M = b(k.role, e), Y = E(k.quantity, /* @__PURE__ */ new Set(["voltage", "current"]), e);
    if (T.has(M) || _.get(M) !== Y) throw new Error(`${e} response is invalid`);
    T.add(M);
    const De = B(k.ready, e), Q = w(k.reasons, e, 12).map((D) => b(D, e));
    let q;
    if (k.window === null) {
      if (De || Q.length !== 1) throw new Error(`${e} response is invalid`);
      if (Q[0] === C) ++O;
      else if (!Q[0].startsWith(I) || Q[0].slice(I.length).trim().length === 0)
        throw new Error(`${e} response is invalid`);
      q = Q;
    } else {
      const D = $(k.window, e);
      G(D, ["values", "received_at", "connection_generation", "mean", "minimum", "maximum", "absolute_peak", "absolute_spread"], e);
      const X = w(D.values, e, c).map((L) => x(L, e)), $e = w(D.received_at, e, c).map((L) => x(L, e)), vt = x(D.mean, e), we = x(D.minimum, e), qe = x(D.maximum, e), Se = x(D.absolute_peak, e), le = x(D.absolute_spread, e), mt = X.reduce((L, he) => L + he, 0) / X.length, bt = y(D.connection_generation, e);
      if (X.length !== c || $e.length !== c || $e.some((L, he) => he > 0 && L <= $e[he - 1]) || !j(vt, mt) || !j(we, Math.min(...X)) || !j(qe, Math.max(...X)) || !j(Se, Math.max(...X.map(Math.abs))) || !j(le, qe - we)) throw new Error(`${e} response is invalid`);
      q = [], bt !== r ? q.push("window is from another connection generation") : Y === "current" ? (Se > d && q.push("absolute peak exceeds zero_current_peak_amps"), le > h && q.push("absolute spread exceeds zero_current_spread_amps")) : i === 1 ? (Se > p && q.push("absolute peak exceeds zero_voltage_peak_volts"), le > g && q.push("absolute spread exceeds zero_voltage_spread_volts")) : (we < u && q.push("minimum is below voltage_present_minimum_volts"), le > f && q.push("absolute spread exceeds voltage_present_spread_volts"));
    }
    if (!pe(Q, q) || De !== (q.length === 0)) throw new Error(`${e} response is invalid`);
    U.push(...q.map((D) => `${M}: ${D}`));
  });
  const N = w(s.reasons, e, 100).map((P) => b(P, e)), A = [...U, "connection generation changed while collecting readiness"], H = O === v.length && pe(N, [C]) || O === 0 && (pe(N, U) || pe(N, A));
  if (T.size !== _.size || !H || o !== (N.length === 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function pt(n, e) {
  const t = w(n, e, 3);
  if (t.length !== 3) throw new Error(`${e} response is invalid`);
  return t.forEach((i) => {
    const s = w(i, e, 2);
    if (s.length !== 2 || s.some((o) => {
      const r = y(o, e);
      return r < -32768 || r > 32767;
    })) throw new Error(`${e} response is invalid`);
  }), n;
}
function pi(n, e, t, i) {
  const s = $(n, e);
  G(s, ["state", "board_index", "stage", "expected_tables", "unfinished_group_keys", "retry_allowed", "error"], e);
  const o = E(s.state, ci, e);
  if (y(s.board_index, e) !== t || y(s.stage, e) !== i) throw new Error(`${e} response is invalid`);
  const r = t === 0 ? ["main_1", "main_2"] : [`addon${t}_1`, `addon${t}_2`], a = w(s.expected_tables, e, 2).map((d) => {
    const h = w(d, e, 2);
    if (h.length !== 2) throw new Error(`${e} response is invalid`);
    const u = b(h[0], e);
    if (!r.includes(u)) throw new Error(`${e} response is invalid`);
    return pt(h[1], e), u;
  }), c = w(s.unfinished_group_keys, e, 2).map((d) => b(d, e)), p = [...a, ...c], g = B(s.retry_allowed, e);
  if (p.length !== 2 || new Set(p).size !== 2 || p.some((d) => !r.includes(d))) throw new Error(`${e} response is invalid`);
  if (o === "applied_pending_restart_verification") {
    if (a.length !== 2 || c.length !== 0 || g || s.error !== null) throw new Error(`${e} response is invalid`);
  } else if (b(s.error, e), !g || a.length !== (o === "partial" ? 1 : 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function ui(n, e, t, i) {
  const s = $(n, e), o = E(s.target, /* @__PURE__ */ new Set(["voltage", "current"]), e);
  b(s.target_id, e);
  const r = B(s.stable, e);
  if (o !== t || s.target_id !== i) throw new Error(`${e} response is invalid`);
  const a = w(s.windows, e, o === "voltage" ? 3 : 1);
  if (a.length !== (o === "voltage" ? 3 : 1)) throw new Error(`${e} response is invalid`);
  const c = a.map((p) => {
    const g = $(p, e), d = w(g.samples, e, 1).map((C) => x(C, e));
    if (d.length !== 1) throw new Error(`${e} response is invalid`);
    const h = x(g.mean, e), u = x(g.standard_deviation, e), f = x(g.range_percent, e), m = d.reduce((C, I) => C + I, 0) / d.length, v = Math.sqrt(d.reduce((C, I) => C + (I - m) ** 2, 0) / d.length), _ = 100 * (Math.max(...d) - Math.min(...d)) / Math.abs(m);
    if (!j(h, m) || !j(u, v) || !j(f, _)) throw new Error(`${e} response is invalid`);
    return f;
  });
  if (r !== c.every((p) => p <= 1)) throw new Error(`${e} response is invalid`);
  return n;
}
function it(n, e, t) {
  const i = $(n, e), s = E(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e);
  b(i.group_key, e), i.phase !== null && E(i.phase, _e, e);
  const o = y(i.iteration, e), r = w(i.changed_channels, e, 3).map((f) => y(f, e)), a = w(i.before_values, e, 3), c = w(i.after_values, e, 3), p = w(i.error_percent_values, e, 3);
  for (const f of [a, c, p]) f.forEach((m) => x(m, e));
  const g = t.target === "voltage" ? t.groupKey : Ue(t.references[0].channel), d = t.target === "voltage" ? gi(t.groupKey) : t.references.map((f) => f.channel), h = t.target === "current" && t.references.length === 1 ? ["A", "B", "C"][(t.references[0].channel - 1) % 3] : null, u = B(i.retry_allowed, e);
  if (t.target === "voltage" && (!Number.isFinite(t.reference) || t.reference <= 0) || t.target === "current" && t.references.some((f) => !Number.isFinite(f.reference) || f.reference <= 0 || !Number.isFinite(f.rawReference) || f.rawReference <= 0) || ![1, 2, 3].includes(r.length) || s !== "indeterminate" && a.length !== r.length || new Set(r).size !== r.length || r.some((f) => f < 1 || f > 42) || o < 1 || o > 3 || i.group_key !== g || i.phase !== h || r.length !== d.length || r.some((f, m) => f !== d[m]) || (s === "indeterminate" ? c.length !== 0 || p.length !== 0 : c.length !== r.length || p.length !== r.length)) throw new Error(`${e} response is invalid`);
  if (s === "indeterminate") {
    if (i.gain_evidence !== null || u) throw new Error(`${e} response is invalid`);
    i.restore_evidence != null && $(i.restore_evidence, e);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${e} response is invalid`);
    fi(i.gain_evidence, e, t);
    const f = t.target === "voltage" ? c.map(() => t.reference) : t.references.map((_) => _.reference), m = c.map((_, C) => 100 * Math.abs(x(_, e) - f[C]) / f[C]);
    if (p.some((_, C) => x(_, e) < 0 || !j(x(_, e), m[C]))) throw new Error(`${e} response is invalid`);
    const v = Math.max(...m) > 1;
    if (s === "result_outside_tolerance" !== v || u !== (v && o < 3)) throw new Error(`${e} response is invalid`);
  }
  return n;
}
function Ue(n) {
  const e = Math.floor((n - 1) / 6), t = Math.floor((n - 1) % 6 / 3) + 1;
  return e === 0 ? `main_${t}` : `addon${e}_${t}`;
}
function fi(n, e, t) {
  const i = $(n, e), s = y(i.connection_generation, e), o = y(i.operation_sequence, e), r = t.target === "voltage" ? t.groupKey : Ue(t.references[0].channel), a = r.startsWith("main_") ? `meter_main${r.slice(-1)}` : r;
  if (s < 1 || o < 1 || b(i.instance_id, e) !== a) throw new Error(`${e} response is invalid`);
  const c = t.target === "current" ? new Map(t.references.map((h) => [["A", "B", "C"][(h.channel - 1) % 3], h.rawReference])) : /* @__PURE__ */ new Map(), p = w(i.phases, e, 3);
  if (p.length !== 3) throw new Error(`${e} response is invalid`);
  p.forEach((h, u) => {
    const f = $(h, e), m = E(f.phase, _e, e);
    if (m !== ["A", "B", "C"][u]) throw new Error(`${e} response is invalid`);
    x(f.measured_voltage, e), x(f.measured_current, e);
    const v = x(f.reference_voltage, e), _ = x(f.reference_current, e), C = y(f.old_voltage_gain, e), I = y(f.new_voltage_gain, e), T = y(f.old_current_gain, e), U = y(f.new_current_gain, e);
    if ([C, I, T, U].some((O) => O < 1 || O > 65535)) throw new Error(`${e} response is invalid`);
    if (t.target === "voltage") {
      if (Math.abs(v - t.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(v), t.reference)) || Math.abs(_) > 1e-6 || T !== U) throw new Error(`${e} response is invalid`);
    } else {
      const O = c.get(m);
      if (Math.abs(v) > 1e-6 || (O === void 0 ? Math.abs(_) > 1e-6 : Math.abs(_ - O) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(_), O))) || C !== I || O === void 0 && T !== U) throw new Error(`${e} response is invalid`);
    }
  });
  const g = w(i.register_mismatch_phases, e, 3);
  g.forEach((h) => E(h, _e, e));
  const d = w(i.matching_lines, e, 100);
  if (d.length === 0 || d.some((h) => typeof h != "string") || B(i.flash_saved, e) !== !0 || g.length !== 0 || B(i.calibration_disabled, e) !== !1) throw new Error(`${e} response is invalid`);
}
function gi(n) {
  const e = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(n);
  if (!e) return [];
  const t = e[2] === void 0 ? 0 : Number(e[2]), i = Number(e[1] ?? e[3]), s = t * 6 + (i - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}
function _i(n, e, t) {
  const i = $(n, e);
  for (const g of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) b(i[g], e);
  const s = y(i.topology_addon_count, e);
  E(i.topology_connection_type, Me, e);
  const o = y(i.connection_generation, e);
  E(i.source_authority, /* @__PURE__ */ new Set(["saved_flash"]), e);
  const r = B(i.source_handoff_available, e);
  if (Ee(i.source_handoff_transaction_id, e), r) {
    if (b(i.config_filename, e), b(i.config_sha256, e), !ni.test(i.config_filename) || !si.test(i.config_sha256)) throw new Error(`${e} response is invalid`);
  } else if (i.config_filename !== null || i.config_sha256 !== null) throw new Error(`${e} response is invalid`);
  if (!ii.test(i.mac) || !Xe.test(i.verification_id) || o < 1 || i.source_handoff_transaction_id !== null && !Xe.test(i.source_handoff_transaction_id) || s !== t.addon_count || i.topology_project_name !== t.project_name || i.topology_connection_type !== t.connection_type || i.topology_voltage_layout !== t.voltage_layout) throw new Error(`${e} response is invalid`);
  const a = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: s }, (g, d) => [`addon${d + 1}_1`, `addon${d + 1}_2`]).flat()]), c = (g, d, h) => {
    const u = w(i[g] ?? [], e, 14), f = /* @__PURE__ */ new Set();
    return u.forEach((m) => {
      const v = $(m, e);
      G(v, ["instance_id", d], e);
      const _ = b(v.instance_id, e);
      if (!a.has(_) || f.has(_)) throw new Error(`${e} response is invalid`);
      if (f.add(_), h) pt(v[d], e);
      else {
        const C = w(v[d], e, 3);
        if (C.length !== 3) throw new Error(`${e} response is invalid`);
        C.forEach((I) => {
          const T = w(I, e, 2);
          if (T.length !== 2 || T.some((U) => {
            const O = y(U, e);
            return O < 1 || O > 65535;
          })) throw new Error(`${e} response is invalid`);
        });
      }
    }), u.length;
  };
  if (c("groups", "phase_gains", !1) + c("offset_groups", "phase_offsets", !0) + c("power_offset_groups", "phase_power_offsets", !0) < 1) throw new Error(`${e} response is invalid`);
  return n;
}
class ve {
  constructor(e, t) {
    this.hass = e, this.entryId = t, this.setupStatus = () => this.call("setup_status", (i) => ue(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (w(i, "list_meters").forEach((s) => ht(s, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (s) => di(s, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (s) => li(s, "get_ct_inventory"), { device_id: i }), this.getSession = (i) => this.call("get_session", (s) => K(s, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => $(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, s) => this.call("set_installer_intent", (o) => ue(o, "set_installer_intent"), { addon_count: i, connection_type: s }), this.rescan = () => this.call("rescan", (i) => ue(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (s) => {
      const o = $(s, "adopt_device");
      return b(o.device_id, "adopt_device"), b(o.configuration, "adopt_device"), s;
    }, { device_id: i }), this.previewCtConfig = (i, s, o, r) => this.call("preview_ct_config", (a) => Ce(a, "preview_ct_config"), {
      device_id: i,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.setHaLabels = (i, s, o, r) => this.call("set_ha_labels", (a) => a, {
      device_id: i,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.transaction = (i, s, o, r) => this.call(i, (a) => Ce(a, i), {
      device_id: s,
      transaction_id: o,
      source_sha256: r
    }), this.applyCtConfig = (i, s, o) => this.transaction("apply_ct_config", i, s, o), this.compileCtConfig = (i, s, o) => this.transaction("compile_ct_config", i, s, o), this.installCtConfig = (i, s, o) => this.transaction("install_ct_config", i, s, o), this.rollbackCtConfig = (i, s, o) => this.transaction("rollback_ct_config", i, s, o), this.startSession = (i) => this.call("start_session", (s) => K(s, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (s) => K(s, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, o) => this.call("check_stability", (r) => ui(r, "check_stability", s, o), { session_id: i, target: s, target_id: o }), this.checkOffsetReadiness = (i, s, o) => this.call("check_offset_readiness", (r) => hi(r, "check_offset_readiness", s, o), {
      session_id: i,
      board_index: s,
      stage: o
    }), this.calibrateOffset = (i, s, o, r) => this.call("calibrate_offset", (a) => pi(a, "calibrate_offset", s, o), {
      session_id: i,
      board_index: s,
      stage: o,
      confirm_retry: r
    }), this.skipOffsetCalibration = (i) => this.call("skip_offset_calibration", (s) => K(s, "skip_offset_calibration"), { session_id: i }), this.calibrateVoltage = (i, s, o, r) => this.call("calibrate_voltage", (a) => it(a, "calibrate_voltage", { target: "voltage", groupKey: s, reference: o }), {
      session_id: i,
      group_key: s,
      reference: o,
      confirm_iteration: r
    }), this.calibrateCurrent = (i, s, o) => s.length < 1 || s.length > 3 || new Set(s.map((r) => r.channel)).size !== s.length || new Set(s.map((r) => Ue(r.channel))).size !== 1 || s.some((r) => !Number.isInteger(r.channel) || r.channel < 1 || r.channel > 42 || !Number.isFinite(r.reference) || r.reference <= 0 || !Number.isFinite(r.reporting_multiplier) || r.reporting_multiplier < 1e-3 || r.reporting_multiplier > 1e3) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (r) => it(r, "calibrate_current", {
      target: "current",
      references: s.map((a) => ({ channel: a.channel, reference: a.reference, rawReference: a.reference / a.reporting_multiplier }))
    }), {
      session_id: i,
      references: s,
      confirm_iteration: o
    }), this.restartAndVerify = (i, s) => this.call("restart_and_verify", (o) => _i(o, "restart_and_verify", s), { session_id: i }), this.completeCalibrationWithoutChanges = (i) => this.call("complete_calibration_without_changes", (s) => {
      const o = K(s, "complete_calibration_without_changes");
      if (o.session_id !== i || o.state !== "verified" || o.has_pending_calibration !== !1)
        throw new Error("complete_calibration_without_changes response is invalid");
      return o;
    }, { session_id: i }), this.cancelSession = (i) => this.call("cancel_session", (s) => K(s, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (s) => ue(s, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, s, o, r) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: s,
      source_sha256: o
    }, (a) => Ce(a, "subscribe_config_transaction"), r), this.subscribeSession = (i, s) => this.subscribe("subscribe_session", { session_id: i }, (o) => K(o, "subscribe_session"), s);
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
      if (e.length > a || Lt.test(e) || Vt.test(e) || r && s !== "redacted_diff" || s === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${s || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [r, a] of Object.entries(e)) {
        if (r.length > 256 || Ft.test(r)) throw new Error("unsafe property name refused");
        if (r.toLowerCase() === "key" && !o) throw new Error(`private field ${r} refused`);
        if (r.toLowerCase() !== "raw_gain_ct" && Ht.test(r))
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
      type: `${Ye}${e}`,
      entry_id: this.entryId,
      ...i
    });
    return ve.assertPublicPayload(s, et.has(e)), t(s);
  }
  subscribe(e, t, i, s) {
    return this.hass.connection.subscribeMessage((o) => {
      ve.assertPublicPayload(o, et.has(e)), s(i(o));
    }, { type: `${Ye}${e}`, entry_id: this.entryId, ...t });
  }
}
function vi(n, e, t, i, s, o) {
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Select the compatible meter discovered on your network.</p>
      <div class="meter-list">
        ${n.map((r) => l`
          <label class=${r.entry_id === e ? "meter-row selected" : "meter-row"}>
            <input type="radio" name="meter" .checked=${r.entry_id === e}
              @change=${() => t(r.entry_id)} />
            <span><strong>${r.title}</strong><small>${r.project_name} · ${r.project_version ?? "version unavailable"}</small></span>
            <span>Device Builder: ${r.configuration ? "Configured" : r.importable ? "Importable" : r.importable === null ? "Unavailable" : "Not importable"}</span>
          </label>
        `)}
      </div>
      ${n.some((r) => r.entry_id === e && r.importable) ? l`
        <button class="secondary" @click=${i}>Adopt</button>
      ` : ""}
      <footer class="action-footer">
        <button class="secondary" data-action="back" @click=${s}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${!e} @click=${o}>Continue</button>
      </footer>
    </section>
  `;
}
function mi(n) {
  return l`
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
function bi(n, e, t, i, s, o, r) {
  const a = n?.state ?? "previewed";
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${mi(n)}
      ${a === "failed" ? l`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${n?.evidence.join(", ") || "The operation did not complete."}</p>
          ${n?.rollback_available ? l`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${e} ?disabled=${a !== "previewed"}>Apply</button>
        <button class="secondary" @click=${t} ?disabled=${a !== "validated"}>Compile</button>
        <button class="primary" @click=${i} ?disabled=${a !== "install_confirmation_required"}>Install</button>
      </div>
      ${n?.validation_detail ? l`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${n.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${n.validation_detail.error_record_count} records (${n.validation_detail.reported_error_count ?? "unreported"} reported)</dd></div>
        <div><dt>Warnings</dt><dd>${n.validation_detail.warning_record_count} records (${n.validation_detail.reported_warning_count ?? "unreported"} reported)</dd></div>
      </dl>` : ""}
      ${n?.upload_progress?.length ? l`<ul class="upload-progress">${n.upload_progress.map((c) => l`
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
  const i = [...n.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], s = n.key === "ArrowRight" || n.key === "ArrowDown", o = n.key === "Home" ? 0 : n.key === "End" ? i.length - 1 : (e + (s ? 1 : i.length - 1)) % i.length;
  i[o]?.click(), i[o]?.focus();
}, yi = (n, e, t) => (n?.default_gain_ct ?? t) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((n?.default_gain_ct ?? t) / e);
function $i(n, e, t, i, s, o, r, a, c, p = !1) {
  const g = Math.ceil(n.channels.length / 6), d = n.channels.filter((h) => h.address.board_index === e).slice(0, 8);
  return l`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: g }, (h, u) => l`
          <button role="tab" id=${`board-tab-${u}`} data-board-tab=${u} aria-selected=${u === e}
            aria-controls="board-panel" tabindex=${u === e ? "0" : "-1"}
            @keydown=${(f) => ye(f, u)}
            @click=${() => s(u)}>${u === 0 ? "Main Board" : `Add-on ${u}`}</button>
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
          ${d.map((h) => {
    const u = i.get(h.channel) ?? {
      name: h.name,
      modelId: h.selected_model_id ?? "",
      multiplier: h.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, f = n.catalog.presets.find((_) => _.model_id === u.modelId), m = yi(f, u.multiplier, u.modelId === "custom" ? u.customGainCt : void 0), v = Be(h, u);
    return l`
              <div class="ct-row" data-ct-row data-ct-group=${h.address.group_index - 1} role="row" aria-rowindex=${h.channel + 1} aria-label=${`CT${h.channel}`}>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${h.channel} name`} .value=${u.name}
                  @input=${(_) => r(h.channel, { name: _.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${h.channel} model`} ?disabled=${p}
                  @change=${(_) => {
      const C = _.target.value, I = n.catalog.presets.find((T) => T.model_id === C);
      r(h.channel, {
        modelId: C,
        burdenAcknowledged: h.selection_verified_against_config && C === h.selected_model_id && (C === "custom" || I?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${u.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((_) => l`<option value=${_.model_id} ?selected=${u.modelId === _.model_id}>${_.label}</option>`)}
                  <option value="custom" ?selected=${u.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${h.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${h.channel} multiplier`} ?disabled=${p}
                  .value=${String(u.multiplier)} @input=${(_) => r(h.channel, { multiplier: Number(_.target.value) })} /></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${m ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${f?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${u.expanded} @click=${() => r(h.channel, { expanded: !u.expanded })}>
                  ${u.modelId ? v ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${u.modelId === "custom" ? l`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${h.channel} custom gain`}
                  ?disabled=${p}
                  .value=${u.customGainCt === void 0 ? "" : String(u.customGainCt)}
                  @input=${(_) => r(h.channel, { customGainCt: Number(_.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${h.channel} custom label`} ?disabled=${p} .value=${u.customLabel ?? ""}
                  @input=${(_) => r(h.channel, { customLabel: _.target.value })} /></label>
              </div>` : S}
              ${u.modelId === "custom" || f?.requires_burden_jumper_cut ? l`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${h.channel} burden output acknowledgement`}
                  ?disabled=${p}
                  .checked=${u.burdenAcknowledged}
                  @change=${(_) => r(h.channel, { burdenAcknowledged: _.target.checked })} />
                  I checked the burden-output requirement for CT${h.channel}</label>
              </div>` : S}
              ${f && f.rated_current_a > 65.535 && u.multiplier === 1 ? l`<div class="warning-band" role="status">CT${h.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : S}
              ${u.expanded && f ? l`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${f.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${f.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${f.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${f.notes || (f.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : S}
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${d.length} of ${n.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${a}>Back</button>
        <button class="primary" ?disabled=${p ? ![...i].some(([h, u]) => u.name !== n.channels.find((f) => f.channel === h)?.name) : !ki(n, i)} @click=${c}>${p ? "Save Home Assistant labels" : "Review changes"}</button>
      </footer>
    </section>
  `;
}
function wi(n, e) {
  return n.channels.flatMap((t) => {
    const i = e.get(t.channel);
    if (!i || !Be(t, i)) return [];
    const s = n.catalog.presets.find((r) => r.model_id === i.modelId), o = { channel: t.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (o.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (o.custom_label = i.customLabel.trim()), o.burden_output_acknowledged = i.burdenAcknowledged) : s?.requires_burden_jumper_cut && (o.burden_output_acknowledged = i.burdenAcknowledged), [o];
  });
}
function Be(n, e) {
  return e.name !== n.name || e.modelId !== (n.selected_model_id ?? "") || e.multiplier !== n.reporting_multiplier || e.modelId === "custom" && (e.customGainCt !== n.raw_gain_ct || (e.customLabel?.trim() ?? "") !== (n.display_label ?? ""));
}
function Si(n, e) {
  if (!e.name.trim() || !e.modelId || !Number.isFinite(e.multiplier) || e.multiplier <= 0) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const t = n.catalog.presets.find((i) => i.model_id === e.modelId);
  return !!t && (!t?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function ki(n, e) {
  let t = !1;
  for (const i of n.channels) {
    const s = e.get(i.channel);
    if (!s || Be(i, s) && (t = !0, !Si(n, s)))
      return !1;
  }
  return t;
}
const z = (n) => n.toFixed(2);
function ut(n, e, t) {
  const i = [n, !!e?.stable, !!t, !!t?.gain_evidence, !!t], s = i.findIndex((r) => !r);
  return l`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((r, a) => l`<li
    class=${i[a] ? "complete" : a === s ? "active" : "pending"}>${r}</li>`)}</ol>`;
}
function ft(n) {
  const e = Object.entries(n?.calibration_sources ?? {});
  return l`<section class="measurement-evidence calibration-source" aria-label="Current calibration source">
    <h3>Current calibration source</h3>
    ${e.length ? l`<table><thead><tr><th>Chip</th><th>Source</th><th>Saved in flash</th></tr></thead><tbody>
      ${e.map(([t, i]) => l`<tr><td>${t}</td><td>${i === "configuration" ? "Configuration" : i === "flash" ? "Saved flash" : "Unknown"}</td><td>${i === "flash" ? "Yes" : i === "configuration" ? "No" : "Unknown"}</td></tr>`)}
    </tbody></table>` : l`<p>Calibration source is not available.</p>`}
  </section>`;
}
function Ne(n) {
  return n ? l`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((e, t) => l`<dl>
      <div><dt>Live values</dt><dd>${e.samples.map(z).join(", ")}</dd></div>
      <div><dt>Mean</dt><dd>${z(e.mean)}</dd></div>
      <div><dt>Standard deviation</dt><dd>${z(e.standard_deviation)}</dd></div>
      <div><dt>Range</dt><dd>${z(e.range_percent)}%</dd></div>
    </dl>`)}
  </section>` : S;
}
function Pe(n) {
  return n ? l`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${n.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${n.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${n.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${n.before_values.map(z).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${n.after_values.map(z).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${n.error_percent_values.map((e) => `${z(e)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${n.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${n.gain_evidence ? l`<h4>Gain evidence · ${n.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${n.gain_evidence.phases?.map((e) => l`<tr><td>${e.phase}</td><td>${z(e.measured_voltage)}</td><td>${z(e.measured_current)}</td><td>${z(e.reference_voltage)}</td><td>${z(e.reference_current)}</td><td>${e.old_voltage_gain} → ${e.new_voltage_gain}</td><td>${e.old_current_gain} → ${e.new_current_gain}</td></tr>`) ?? S}
      </tbody></table><p>Saved in flash: ${n.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : l`<p>Gain evidence unavailable.</p>`}
  </section>` : S;
}
function Ci(n, e, t, i, s, o, r, a, c, p, g, d, h, u, f) {
  const m = n?.ct_count ?? e?.channels.length ?? 6, v = Math.floor((i - 1) / 6), C = Math.floor((i - 1) / 3) * 3 + 1, I = Array.from({ length: 3 }, (A, R) => C + R).filter((A) => A <= m), T = I.filter((A) => (s.get(A) ?? 0) > 0), U = e === null, O = o !== null && Number.isFinite(o) && o >= 1e-3 && o <= 1e3, N = T.length > 0 && (!U || O);
  return l`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${ut(N, r, a)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(m / 6) }, (A, R) => l`<button role="tab"
          id=${`current-board-tab-${R}`} aria-controls="current-board-panel"
          aria-selected=${R === v} tabindex=${R === v ? "0" : "-1"}
          @keydown=${(H) => ye(H, R)}
          @click=${() => c(R * 6 + 1)}>${R === 0 ? "Main Board" : `Add-on ${R}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${v}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((A) => {
    const R = v * 6 + A * 3 + 1;
    return l`<button
          aria-pressed=${R === C} @click=${() => c(R)}>Group ${v * 2 + A + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${C}–CT${C + 2}</h2>
      ${ft(t)}
      <div class="reference-block">
        ${I.map((A) => l`<label>CT${A} reference
          <input data-current-reference=${A} aria-label=${`CT${A} reference`} type="number" min="0.01" step="0.01"
            .value=${s.has(A) ? String(s.get(A)) : ""}
            @input=${(R) => {
    const H = R.target;
    p(A, H.value === "" ? null : Number(H.value));
  }} /></label>`)}
      ${U ? l`<label>Reporting multiplier <input data-role="reporting-multiplier" type="number" min="0.001" max="1000" step="0.001" required .value=${o === null ? "" : String(o)} @input=${(A) => {
    const R = Number(A.target.value);
    g(Number.isFinite(R) && R >= 1e-3 && R <= 1e3 ? R : null);
  }} /></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
        <button class="primary" @click=${h} ?disabled=${!N || !r?.stable || (a?.iteration ?? 0) >= 3 || !!(a && !a.retry_allowed && a.iteration > 0)}>${a?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${d} ?disabled=${!N}>Check stability</button></div>
      ${r ? l`<div class=${r.stable ? "success-band" : "warning-band"} role="status">${r.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${Ne(r)}
      ${Pe(a)}
      ${a?.state.includes("indeterminate") ? l`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${u}>Reconnect and inspect</button><button class="danger" @click=${f}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const st = (n) => n === 0 ? "Main Board" : `Add-on ${n}`, xi = (n) => n === 0 ? ["main_1", "main_2"] : [`addon${n}_1`, `addon${n}_2`];
function Ei(n, e, t, i, s, o, r, a, c, p, g, d, h, u, f, m, v, _, C) {
  const I = e?.offset_capability, T = e?.offset_boards ?? [], U = e?.offset_disposition === "completed" || e?.offset_disposition === "skipped" || e?.offset_disposition === "partial" && e.state === "applied_pending_restart_verification", O = T.length > 0 && T.every((k) => k.stages[0]?.state === "completed"), N = T[t]?.stages[i - 1]?.state ?? "not_started", A = !!a?.retry_allowed || N === "partial" || N === "indeterminate", R = I?.status !== "available", H = xi(t), P = new Map(a?.expected_tables ?? []);
  return l`
    <section class="step-content offset-step" aria-labelledby="step-heading">
      ${R ? l`
        <div class="warning-band" role="status">
          <strong>Offset calibration is ${I?.status === "invalid" ? "not safely available" : "not available on this firmware"}.</strong>
          ${I?.status === "invalid" ? l`<p>Repair reason: ${I.repair_reason}</p>` : S}
          <p>Skip preserves the offset values already saved in flash. No clear control is invoked.</p>
        </div>
      ` : l`
        <ol class="offset-stage-stepper" aria-label="Offset calibration stages">
          <li class=${i === 1 ? "active" : O ? "complete" : "pending"}>
            <button data-offset-stage="1" aria-current=${i === 1 ? "step" : S} @click=${() => g(1)}>1. Voltage/current zero offset</button>
          </li>
          <li class=${i === 2 ? "active" : U ? "complete" : "pending"}>
            <button data-offset-stage="2" aria-current=${i === 2 ? "step" : S} ?disabled=${!O}
              @click=${() => g(2)}>2. Active/reactive power offset</button>
          </li>
        </ol>
        <div class="board-tabs" role="tablist" aria-label="Offset calibration boards">
          ${Array.from({ length: n?.board_count ?? T.length }, (k, M) => l`
            <button role="tab" data-offset-board id=${`offset-board-tab-${M}`} aria-controls="offset-board-panel"
              aria-selected=${M === t} tabindex=${M === t ? "0" : "-1"}
              @keydown=${(Y) => ye(Y, M)} @click=${() => p(M)}>
              ${st(M)}
            </button>
          `)}
        </div>
        <div id="offset-board-panel" role="tabpanel" aria-labelledby=${`offset-board-tab-${t}`}>
          <h2>Stage ${i} · ${st(t)}</h2>
          <div class="warning-band"><strong>Warning:</strong> An open-circuit current-output CT on a live conductor can be hazardous. De-energize conductors before unplugging any CT.</div>
          ${i === 1 ? l`
            <p>First, de-energize all conductors. Then unplug the voltage transformer/AC voltage input and CT inputs, power the meter from USB only, then check that every voltage/current phase reads near zero.</p>
          ` : l`
            <p>Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors, connect/enclose/energize only the voltage reference, then check that voltage is present on both chips and every current phase reads near zero.</p>
          `}
          <p>Measurements cannot prove that a transformer or CT is physically unplugged. Physical acknowledgement never substitutes for measured readiness.</p>
          <label class="check-row"><input type="checkbox" .checked=${s} @change=${(k) => d(k.target.checked)}>
            ${i === 1 ? "I completed the USB-only, de-energized preparation." : "I powered down for rewiring and safely enclosed and energized only the voltage reference."}
          </label>
          <div class="offset-actions">
            <button class="secondary" data-action="check-offset" ?disabled=${c || !s || N === "completed"} @click=${u}>
              ${c ? "Checking measured readiness…" : "Check measured readiness"}
            </button>
            <button class="primary" data-action="calibrate-offset"
              ?disabled=${c || !s || !r?.ready || N === "completed" || A && !o}
              @click=${f}>${a?.retry_allowed ? "Retry unfinished chip" : `Run Stage ${i} calibration`}</button>
          </div>
          ${r ? l`
            <section class="measurement-evidence" aria-label="Offset readiness evidence">
              <h3>Measured readiness</h3>
              <div class=${r.ready ? "success-band" : "warning-band"} role="status" aria-live="polite">
                ${r.ready ? "Measured readiness passed." : "Measured readiness did not pass. Physical acknowledgement is not enough."}
              </div>
              ${r.reasons.length ? l`<ul>${r.reasons.map((k) => l`<li>${k}</li>`)}</ul>` : S}
              <dl class="threshold-grid">
                <div><dt>Samples per phase</dt><dd>${r.thresholds.sample_count}</dd></div>
                <div><dt>Zero voltage peak</dt><dd>${r.thresholds.zero_voltage_peak_volts} V</dd></div>
                <div><dt>Zero voltage spread</dt><dd>${r.thresholds.zero_voltage_spread_volts} V</dd></div>
                <div><dt>Zero current peak</dt><dd>${r.thresholds.zero_current_peak_amps} A</dd></div>
                <div><dt>Zero current spread</dt><dd>${r.thresholds.zero_current_spread_amps} A</dd></div>
                <div><dt>Voltage present minimum</dt><dd>${r.thresholds.voltage_present_minimum_volts} V</dd></div>
                <div><dt>Voltage present spread</dt><dd>${r.thresholds.voltage_present_spread_volts} V</dd></div>
              </dl>
              <table class="evidence-table"><thead><tr><th>Phase role</th><th>Quantity</th><th>Status</th><th>Mean</th><th>Peak</th><th>Spread</th></tr></thead><tbody>
                ${r.entities.map((k) => l`<tr><td>${k.role}</td><td>${k.quantity}</td><td>${k.ready ? "Ready" : k.reasons.join("; ")}</td>
                  <td>${k.window?.mean ?? "—"}</td><td>${k.window?.absolute_peak ?? "—"}</td><td>${k.window?.absolute_spread ?? "—"}</td></tr>`)}
              </tbody></table>
            </section>
          ` : S}
          <section class="measurement-evidence" aria-label="Per-chip offset progress" aria-live="polite">
            <h3>Per-chip progress</h3>
            <table><thead><tr><th>Chip</th><th>State</th><th>Backend evidence</th></tr></thead><tbody>
              ${H.map((k) => l`<tr><td>${k}</td><td>${P.has(k) || N === "completed" ? "Saved; restart verification required." : a?.unfinished_group_keys.includes(k) ? "Unfinished" : N.replaceAll("_", " ")}</td>
                <td>${P.has(k) ? P.get(k).map(([M, Y]) => `${M}/${Y}`).join(", ") : "—"}</td></tr>`)}
            </tbody></table>
          </section>
          ${A ? l`<aside class="recovery-panel" role="status" aria-live="assertive">
            <strong>${a ? a.state === "partial" ? "One chip finished; recovery is required" : "Calibration outcome is indeterminate" : "Recovery is required"}</strong>
            <p>${a?.error ?? "The prior operation did not finish cleanly"}. Reconnect and inspect before retrying only the unfinished chip.</p>
            <label class="check-row"><input type="checkbox" .checked=${o} @change=${(k) => h(k.target.checked)}> I reviewed the evidence and confirm this retry.</label>
            <button class="secondary" @click=${m}>Reconnect and inspect</button>
          </aside>` : S}
        </div>
      `}
      <footer class="action-footer offset-footer">
        <button class="secondary" @click=${_}>Back</button>
        <button class="secondary" data-action="skip-offset" ?disabled=${c || U} @click=${v}>Skip offset calibration</button>
        <button class="primary" ?disabled=${c || !U} @click=${C}>Continue</button>
      </footer>
    </section>
  `;
}
function Ai(n, e, t, i, s, o) {
  const r = n.includes("failed") || n.includes("indeterminate");
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, voltage/current offsets, power offsets, and entity bindings.</p>
      <div class="status-band" role="status">${n || "Ready for restart verification"}</div>
      ${e ? l`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${e.source_handoff_available ? e.config_filename : "Unavailable in runtime-only mode"}</dd></div></dl>` : ""}
      ${n === "cancelled" ? l`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${r ? l`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${t ? l`<button class="danger" data-action="rollback" @click=${s}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${o}>Back</button><button class="primary" @click=${i} ?disabled=${n === "cancelled" || !!e}>${n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Ri(n) {
  return n ? n.preflight.issues.length ? l`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((e) => l`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : l`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : l`<p>Starting a calibration session…</p>`;
}
function Ii(n, e, t, i, s, o) {
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${Ri(n)}
      ${n?.state === "cancelled" ? l`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
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
const nt = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Ti = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function Oi(n, e, t, i, s, o) {
  return l`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (r, a) => l`
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
          ${nt.map(([r, a]) => l`
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
          <div><dt>Connection</dt><dd>${nt.find(([r]) => r === t)?.[1]}</dd></div>
          ${Ti.slice(0, e).map((r, a) => l`<div><dt>Add-on ${a + 1}</dt><dd>${r}</dd></div>`)}
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
      ${n?.devices.length ? "" : l`
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
function gt(n, e, t, i, s, o = null, r = !1) {
  return l`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((a) => l`<li>${a.source}: ${a.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([a, c]) => l`<div data-target=${a}>${Ne(c)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([a, c]) => l`<div data-target=${a}>${Pe(c)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${t?.evidence.join(", ") || "No build evidence."}</p><p>${t?.progress.join(", ") || "No transaction progress."}</p>
          ${t?.validation_detail ? l`<p>Validation code ${t.validation_detail.code ?? "unavailable"}; ${t.validation_detail.error_record_count} error records; ${t.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${t?.upload_progress?.length ? l`<ul>${t.upload_progress.map((a) => l`<li>${a.stage}: ${a.percentage ?? a.progress ?? "in progress"}${a.percentage != null || a.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Calibration completion record</h3><p>${o ? "Restart-verified saved calibration record" : r ? "No-change completion; no restart-verified record was created" : "Not yet established"}</p><p>${o ? `Verification ${o.verification_id}, generation ${o.connection_generation}; ${o.offset_groups?.length ?? 0} voltage/current offset tables; ${o.power_offset_groups?.length ?? 0} power-offset tables.` : r ? "The server confirmed there were no pending gain or offset changes." : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function Mi(n, e, t, i, s, o, r, a, c) {
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${o ? l`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : r ? l`<div class="success-band" role="status">Completed without calibration changes. No restart or restart-verified calibration record was required.</div>` : l`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${a ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${o?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${o?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${gt(n, e, t, i, s, o, r)}
      <footer class="action-footer"><button class="secondary" @click=${c}>Back</button></footer>
    </section>
  `;
}
function _t(n) {
  const e = n.addon_count, t = n.evidence.map((i) => i.source);
  return e < 0 || e > 6 || n.board_count !== e + 1 || n.ct_count !== 6 * (e + 1) || n.group_count !== 2 * (e + 1) || n.evidence.length < 1 || n.evidence.length > 5 || new Set(t).size !== t.length || !t.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || n.evidence.some((i) => i.addon_count !== e);
}
function Ui(n, e, t, i, s = !1) {
  const o = s || _t(n);
  return l`
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
        <tbody>${n.evidence.map((r) => l`
          <tr><td>${r.source.replaceAll("_", " ")}</td><td>${r.addon_count}</td><td>${r.detail}</td></tr>
        `)}</tbody>
      </table>
      ${o ? l`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : l`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${t}>Back</button>
        ${o ? "" : l`<button class="primary" data-action="continue" @click=${i}>Continue</button>`}
      </footer>
    </section>
  `;
}
function Bi(n, e, t, i, s, o, r, a, c, p, g, d, h) {
  const u = n?.voltage_layout === "two_voltages" ? 2 : 1, f = i.slice(0, u).every((m) => Number.isFinite(m) && m > 0);
  return l`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${ut(f, s, o)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: n?.board_count ?? 1 }, (m, v) => l`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${v}`} aria-controls="voltage-board-panel"
          aria-selected=${v === t} tabindex=${v === t ? "0" : "-1"}
          @keydown=${(_) => ye(_, v)}
          @click=${() => a(v)}>${v === 0 ? "Main Board" : `Add-on ${v}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${t}`}>
      <h2>${u === 1 ? "Calibrate shared voltage" : "Calibrate both board voltages"}</h2>
      ${ft(e)}
      <div class="reference-block">
        ${Array.from({ length: u }, (m, v) => l`<label>${u === 1 ? "Trusted instrument reference" : `Voltage ${v + 1} trusted reference`}
          <input type="number" min="0.01" step="0.01" .value=${i[v] ? String(i[v]) : ""}
            @input=${(_) => c(v, Number(_.target.value))} /></label>`)}
        <button class="primary" @click=${g} ?disabled=${r || !f || !s?.stable || !!(o && !o.retry_allowed && o.iteration > 0)}>${o?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${p} ?disabled=${r}>${r ? "Loading live voltage data…" : "Check stability"}</button></div>
      ${s ? l`<div class=${s.stable ? "success-band" : "warning-band"} role="status">${s.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${Ne(s)}
      ${Pe(o)}
      ${o?.state === "indeterminate" ? l`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${d}>Reconnect and inspect</button><button class="danger" @click=${h}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Ni = $t`
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
`, W = [
  ["setup", "Setup Device"],
  ["discover", "Discover"],
  ["topology", "Topology"],
  ["ct", "CT Configuration"],
  ["build", "Build & Install"],
  ["safety", "Safety"],
  ["offset", "Offset"],
  ["voltage", "Voltage"],
  ["current", "Current"],
  ["restart", "Restart"],
  ["summary", "Summary"]
];
class Pi extends oe {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.addonCount = 0, this.connection = "wifi", this.board = 0, this.ctGroup = 0, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.sessionStarting = !1, this.voltageBusy = !1, this.offsetBusy = !1, this.finishBusy = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = Ni;
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
    const t = new ve(this.hass, this.panel.config.entry_id);
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
    this.safetyAcknowledged = !1, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.finishBusy = !1;
  }
  selectDevice(e) {
    e !== this.selectedDeviceId && (++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = e, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.board = 0, this.ctGroup = 0, this.resetCalibrationRun());
  }
  showTopology(e) {
    this.topology = e, this.navigate("topology"), this.error = _t(e) || e.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
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
    const e = W.findIndex(([t]) => t === this.step);
    e > 0 && this.navigate(W[e - 1][0]);
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
  async recoverCtInventory(e, t, i, s) {
    const o = await e.getCtInventory(t);
    this.ownsOperation(i, e, t) && (this.clearSubscription("transaction"), this.transaction = null, this.showInventory(o), this.drafts = new Map(Array.from(this.drafts, ([r, a]) => [r, s.get(r) ?? a])), this.announcement = "Live CT data reloaded. Review the preserved changes again.");
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
    const e = wi(this.inventory, this.drafts);
    if (!e.length) return this.fail(new Error(), "Select at least one CT change before review.");
    const t = this.api, i = this.selectedDeviceId, s = this.inventory, o = ++this.operationGeneration;
    if (this.clearSubscription("transaction"), this.transaction = null, this.labelOnly) {
      const r = e.filter((a) => a.name !== this.inventory.channels.find((c) => c.channel === a.channel)?.name).map(({ channel: a, name: c }) => ({ channel: a, name: c }));
      if (!r.length || e.some((a) => {
        const c = this.inventory.channels.find((p) => p.channel === a.channel);
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
        let r;
        try {
          r = await t.previewCtConfig(
            i,
            s.plan_id,
            s.source_sha256,
            e
          );
        } catch (a) {
          if (a.code !== "stale_confirmation") throw a;
          await this.recoverCtInventory(t, i, o, this.drafts);
          return;
        }
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
        const r = [i, s.transaction_id, s.source_sha256];
        let a;
        try {
          a = e === "apply" ? await t.applyCtConfig(...r) : e === "compile" ? await t.compileCtConfig(...r) : e === "install" ? await t.installCtConfig(...r) : await t.rollbackCtConfig(...r);
        } catch (c) {
          if (c.code !== "stale_confirmation") throw c;
          await this.recoverCtInventory(t, i, o, this.drafts);
          return;
        }
        !this.ownsOperation(o, t, i) || this.transaction?.transaction_id !== s.transaction_id || this.transaction.source_sha256 !== s.source_sha256 || (this.transaction = a, this.announcement = `Configuration ${this.transaction.state}.`);
      },
      "This confirmation is stale. Reload the CT inventory before making another change.",
      () => this.ownsOperation(o, t, i)
    );
  }
  async startSession() {
    if (!(!this.api || !this.selectedDeviceId || this.sessionStarting)) {
      this.sessionStarting = !0;
      try {
        const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
        this.clearSubscription("session"), this.session = null, this.resetCalibrationRun(), await this.run(async () => {
          const s = await e.startSession(t);
          !this.ownsOperation(i, e, t) || s.device_id !== t || (this.session = s, this.navigate("safety"), await this.subscribeSession(this.connectionGeneration));
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
      !this.ownsOperation(s, e, t) || o.session_id !== i || (this.session = o, this.navigate("offset"));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(s, e, t));
  }
  offsetKey(e = this.board, t = this.offsetStage) {
    return `${e}:${t}`;
  }
  async checkOffsetReadiness() {
    if (!this.api || !this.session || this.offsetBusy || !this.offsetAcknowledged[this.offsetStage - 1]) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.board, o = this.offsetStage, r = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const a = await e.checkOffsetReadiness(i, s, o);
          !this.ownsOperation(r, e, t) || this.session?.session_id !== i || (this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget).set(this.offsetKey(s, o), a), this.announcement = a.ready ? `Board ${s + 1} Stage ${o} measured readiness passed.` : `Board ${s + 1} Stage ${o} measured readiness did not pass.`);
        },
        "Measured offset readiness could not be collected. Reconnect and inspect the meter.",
        () => this.ownsOperation(r, e, t)
      );
    } finally {
      this.offsetBusy = !1, this.requestUpdate();
    }
  }
  async calibrateOffset() {
    if (!this.api || !this.session || this.offsetBusy) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.board, o = this.offsetStage, r = this.offsetKey(s, o), a = this.offsetResultByTarget.get(r), c = this.session.offset_boards?.[s]?.stages[o - 1]?.state, p = !!a?.retry_allowed || c === "partial" || c === "indeterminate";
    if (p && !this.offsetRetryConfirmed) return;
    const g = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const d = await e.calibrateOffset(i, s, o, p);
          if (!this.ownsOperation(g, e, t) || this.session?.session_id !== i) return;
          this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(r, d);
          const h = (this.session.offset_boards ?? []).map((m) => m.board_index !== s ? m : {
            ...m,
            stages: m.stages.map((v) => v.stage !== o ? v : {
              ...v,
              state: d.state === "applied_pending_restart_verification" ? "completed" : d.state
            })
          }), u = h.flatMap((m) => m.stages.map((v) => v.state)), f = u.every((m) => m === "completed") ? "completed" : u.some((m) => m === "partial" || m === "indeterminate") ? "partial" : "in_progress";
          this.session = {
            ...this.session,
            offset_boards: h,
            offset_disposition: f,
            has_pending_calibration: this.session.has_pending_calibration || d.expected_tables.length > 0
          }, this.offsetRetryConfirmed = !1, this.announcement = d.state === "applied_pending_restart_verification" ? `Board ${s + 1} Stage ${o} saved; restart verification required.` : `Board ${s + 1} Stage ${o} requires recovery before retry.`;
        },
        "Offset calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(g, e, t)
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
        const o = await e.skipOffsetCalibration(i);
        !this.ownsOperation(s, e, t) || this.session?.session_id !== i || (this.session = o, this.announcement = "Offset calibration skipped; existing flash values were preserved.");
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
    if (!this.api) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    this.finishBusy = !0, this.requestUpdate();
    try {
      await this.run(async () => {
        const o = await e.completeCalibrationWithoutChanges(i);
        if (!(!this.ownsOperation(s, e, t) || this.session?.session_id !== i)) {
          if (o.session_id !== i || o.state !== "verified" || o.has_pending_calibration !== !1)
            throw new Error("No-change completion response is not authoritative");
          this.session = o, this.completedWithoutChanges = !0, this.navigate("summary"), this.announcement = "Completed without calibration changes; no restart was required.";
        }
      }, "Calibration completion could not be confirmed.", () => this.ownsOperation(s, e, t));
    } finally {
      this.finishBusy = !1, this.requestUpdate();
    }
  }
  async checkStability(e) {
    if (!this.api || !this.session || e === "voltage" && this.voltageBusy) return;
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration, r = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((a) => String(a.channel));
    if (r.length) {
      e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
      try {
        await this.run(async () => {
          for (const [a, c] of r.entries()) {
            const p = await t.checkStability(s, e, c);
            if (!this.ownsOperation(o, t, i) || this.session?.session_id !== s) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${c}`, p), e === "voltage" && (this.announcement = `Loaded voltage data from chip ${a + 1} of ${r.length}.`, this.requestUpdate());
          }
        }, "Stable samples could not be collected.", () => this.ownsOperation(o, t, i));
      } finally {
        e === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
      }
    }
  }
  async calibrate(e) {
    if (!this.api || !this.session || e === "voltage" && this.voltageBusy) return;
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration, r = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((c) => String(c.channel)), a = this.currentReferenceEntries();
    if (e === "current" && !a.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      return;
    }
    e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
    try {
      await this.run(
        async () => {
          for (const [c, p] of r.entries()) {
            const g = e === "voltage" ? await t.calibrateVoltage(
              s,
              p,
              this.voltageReferences[this.topology?.voltage_layout === "two_voltages" ? c : 0],
              !0
            ) : await t.calibrateCurrent(s, a, !0);
            if (!this.ownsOperation(o, t, i) || this.session?.session_id !== s) return;
            const d = new Map(this.calibrationByTarget);
            if (e === "current" ? a.forEach((h) => d.set(`current:${h.channel}`, g)) : d.set(`${e}:${p}`, g), this.calibrationByTarget = d, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = e === "voltage" ? `Calibrated voltage chip ${c + 1} of ${r.length}.` : `Calibration iteration ${g.iteration} finished with state ${g.state}.`, this.requestUpdate(), e === "current") break;
          }
        },
        "Calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(o, t, i)
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
      const i = this.currentReferences.get(t), s = this.inventory?.channels[t - 1]?.reporting_multiplier ?? this.reportingMultiplier;
      return i && i > 0 && s !== null ? [{ channel: t, reference: i, reporting_multiplier: s }] : [];
    });
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
        !this.ownsOperation(o, e, t) || this.session?.session_id !== i || this.topology !== s || (this.restartResult = r, this.completedWithoutChanges = !1, this.session = { ...this.session, state: "verified" }, this.navigate("summary"));
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
    const t = this.currentReferenceEntries().map((o) => String(o.channel)), i = Math.floor((this.channel - 1) / 3) * 3 + 1, s = e === "voltage" ? this.voltageGroupKeys() : t.length ? t : Array.from({ length: 3 }, (o, r) => String(i + r));
    for (const o of [...s].reverse()) {
      const r = this.calibrationByTarget.get(`${e}:${o}`);
      if (r) return r;
    }
    return null;
  }
  stabilityFor(e) {
    const t = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((s) => String(s.channel)), i = t.flatMap((s) => {
      const o = this.stabilityByTarget.get(`${e}:${s}`);
      return o ? [o] : [];
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
      const o = s.code;
      this.fail(s, o === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : t);
    }
    i() && this.requestUpdate();
  }
  fail(e, t) {
    this.error = t, this.announcement = t, this.requestUpdate();
  }
  stepBody() {
    return this.step === "setup" ? Oi(
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
    ) : this.step === "discover" ? vi(
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
    ) : this.step === "topology" && this.topology ? Ui(
      this.topology,
      this.selectedProjectVersion(),
      () => this.back(),
      () => {
        this.setup?.configuration_authoritative === !1 ? this.startSession() : this.loadInventory();
      },
      !!this.error
    ) : this.step === "ct" && this.inventory ? l`<fieldset><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
      this.labelOnly = !1, this.requestUpdate();
    }}> ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
      this.labelOnly = !0, this.requestUpdate();
    }}> Home Assistant labels only</label></fieldset>${$i(
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
    )}` : this.step === "build" ? bi(
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
    ) : this.step === "safety" ? Ii(
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
    ) : this.step === "offset" ? Ei(
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
    ) : this.step === "voltage" ? l`${Bi(
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
        this.voltageReferences = this.voltageReferences.map((i, s) => s === e ? t : i), this.requestUpdate();
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" ?disabled=${this.voltageBusy} @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? l`${Ci(
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" ?disabled=${this.finishBusy} @click=${() => {
      this.finishCurrent();
    }}>${this.finishBusy ? "Finishing…" : this.session?.has_pending_calibration ? "Continue to Restart" : "Finish without calibration"}</button></footer>` : this.step === "restart" ? Ai(
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
    ) : Mi(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges, this.selectedProjectVersion(), () => this.back());
  }
  render() {
    const e = W.findIndex(([t]) => t === this.step);
    return l`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${W.map(([t, i], s) => l`
            <li class=${s === e ? "current" : ""}>
              <button class="step-button" aria-current=${s === e ? "step" : S} ?disabled=${s > e}
                @click=${() => s <= e && this.navigate(t)}><span class="number">${s + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${e + 1} of ${W.length} — ${W[e]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${W[e]?.[1]}</h1>
          ${this.error ? l`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : S}
          ${this.stepBody()}
          ${e >= 4 && this.step !== "summary" ? gt(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : S}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", Pi);
export {
  Pi as CircuitSetupPanel
};
