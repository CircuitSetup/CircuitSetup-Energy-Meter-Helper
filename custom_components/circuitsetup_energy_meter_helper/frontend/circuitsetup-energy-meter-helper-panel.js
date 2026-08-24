const me = globalThis, Ue = me.ShadowRoot && (me.ShadyCSS === void 0 || me.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Be = /* @__PURE__ */ Symbol(), Ve = /* @__PURE__ */ new WeakMap();
let vt = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== Be) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Ue && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = Ve.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Ve.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Gt = (n) => new vt(typeof n == "string" ? n : n + "", void 0, Be), Lt = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, s, o) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[o + 1], n[0]);
  return new vt(t, n, Be);
}, Vt = (n, e) => {
  if (Ue) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = me.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, n.appendChild(i);
  }
}, We = Ue ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return Gt(t);
})(n) : n;
const { is: Wt, defineProperty: Kt, getOwnPropertyDescriptor: Yt, getOwnPropertyNames: Zt, getOwnPropertySymbols: Xt, getPrototypeOf: Jt } = Object, Se = globalThis, Ke = Se.trustedTypes, Qt = Ke ? Ke.emptyScript : "", ei = Se.reactiveElementPolyfillSupport, ae = (n, e) => n, Te = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? Qt : null;
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
} }, mt = (n, e) => !Wt(n, e), Ye = { attribute: !0, type: String, converter: Te, reflect: !1, useDefault: !1, hasChanged: mt };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), Se.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let ie = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Ye) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && Kt(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: o } = Yt(this.prototype, e) ?? { get() {
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
    return this.elementProperties.get(e) ?? Ye;
  }
  static _$Ei() {
    if (this.hasOwnProperty(ae("elementProperties"))) return;
    const e = Jt(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(ae("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(ae("properties"))) {
      const t = this.properties, i = [...Zt(t), ...Xt(t)];
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
      for (const s of i) t.unshift(We(s));
    } else e !== void 0 && t.push(We(e));
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
    return Vt(e, this.constructor.elementStyles), e;
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
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : Te).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const o = i.getPropertyOptions(s), r = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : Te;
      this._$Em = s;
      const a = r.fromAttribute(t, o.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, o) {
    if (e !== void 0) {
      const r = this.constructor;
      if (s === !1 && (o = this[e]), i ??= r.getPropertyOptions(e), !((i.hasChanged ?? mt)(o, t) || i.useDefault && i.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(r._$Eu(e, i)))) return;
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
ie.elementStyles = [], ie.shadowRootOptions = { mode: "open" }, ie[ae("elementProperties")] = /* @__PURE__ */ new Map(), ie[ae("finalized")] = /* @__PURE__ */ new Map(), ei?.({ ReactiveElement: ie }), (Se.reactiveElementVersions ??= []).push("2.1.2");
const Ne = globalThis, Ze = (n) => n, be = Ne.trustedTypes, Xe = be ? be.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, bt = "$lit$", V = `lit$${Math.random().toFixed(9).slice(2)}$`, wt = "?" + V, ti = `<${wt}>`, X = document, le = () => X.createComment(""), he = (n) => n === null || typeof n != "object" && typeof n != "function", Pe = Array.isArray, ii = (n) => Pe(n) || typeof n?.[Symbol.iterator] == "function", Ie = `[\x20\t
\f\r]`, ne = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Je = /-->/g, Qe = />/g, Y = RegExp(`>|${Ie}(?:([^\\s"'>=/]+)(${Ie}*=${Ie}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), et = /'/g, tt = /"/g, yt = /^(?:script|style|textarea|title)$/i, si = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), l = si(1), W = /* @__PURE__ */ Symbol.for("lit-noChange"), w = /* @__PURE__ */ Symbol.for("lit-nothing"), it = /* @__PURE__ */ new WeakMap(), Z = X.createTreeWalker(X, 129);
function $t(n, e) {
  if (!Pe(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Xe !== void 0 ? Xe.createHTML(e) : e;
}
const ni = (n, e) => {
  const t = n.length - 1, i = [];
  let s, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = ne;
  for (let a = 0; a < t; a++) {
    const c = n[a];
    let p, u, d = -1, h = 0;
    for (; h < c.length && (r.lastIndex = h, u = r.exec(c), u !== null); ) h = r.lastIndex, r === ne ? u[1] === "!--" ? r = Je : u[1] !== void 0 ? r = Qe : u[2] !== void 0 ? (yt.test(u[2]) && (s = RegExp("</" + u[2], "g")), r = Y) : u[3] !== void 0 && (r = Y) : r === Y ? u[0] === ">" ? (r = s ?? ne, d = -1) : u[1] === void 0 ? d = -2 : (d = r.lastIndex - u[2].length, p = u[1], r = u[3] === void 0 ? Y : u[3] === '"' ? tt : et) : r === tt || r === et ? r = Y : r === Je || r === Qe ? r = ne : (r = Y, s = void 0);
    const f = r === Y && n[a + 1].startsWith("/>") ? " " : "";
    o += r === ne ? c + ti : d >= 0 ? (i.push(p), c.slice(0, d) + bt + c.slice(d) + V + f) : c + V + (d === -2 ? a : f);
  }
  return [$t(n, o + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class pe {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let o = 0, r = 0;
    const a = e.length - 1, c = this.parts, [p, u] = ni(e, t);
    if (this.el = pe.createElement(p, i), Z.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = Z.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(bt)) {
          const h = u[r++], f = s.getAttribute(d).split(V), g = /([.?@])?(.*)/.exec(h);
          c.push({ type: 1, index: o, name: g[2], strings: f, ctor: g[1] === "." ? ri : g[1] === "?" ? ai : g[1] === "@" ? ci : Ce }), s.removeAttribute(d);
        } else d.startsWith(V) && (c.push({ type: 6, index: o }), s.removeAttribute(d));
        if (yt.test(s.tagName)) {
          const d = s.textContent.split(V), h = d.length - 1;
          if (h > 0) {
            s.textContent = be ? be.emptyScript : "";
            for (let f = 0; f < h; f++) s.append(d[f], le()), Z.nextNode(), c.push({ type: 2, index: ++o });
            s.append(d[h], le());
          }
        }
      } else if (s.nodeType === 8) if (s.data === wt) c.push({ type: 2, index: o });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(V, d + 1)) !== -1; ) c.push({ type: 7, index: o }), d += V.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const i = X.createElement("template");
    return i.innerHTML = e, i;
  }
}
function se(n, e, t = n, i) {
  if (e === W) return e;
  let s = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const o = he(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== o && (s?._$AO?.(!1), o === void 0 ? s = void 0 : (s = new o(n), s._$AT(n, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = s : t._$Cl = s), s !== void 0 && (e = se(n, s._$AS(n, e.values), s, i)), e;
}
class oi {
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
    const { el: { content: t }, parts: i } = this._$AD, s = (e?.creationScope ?? X).importNode(t, !0);
    Z.currentNode = s;
    let o = Z.nextNode(), r = 0, a = 0, c = i[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let p;
        c.type === 2 ? p = new ue(o, o.nextSibling, this, e) : c.type === 1 ? p = new c.ctor(o, c.name, c.strings, this, e) : c.type === 6 && (p = new di(o, this, e)), this._$AV.push(p), c = i[++a];
      }
      r !== c?.index && (o = Z.nextNode(), r++);
    }
    return Z.currentNode = X, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class ue {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = w, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    e = se(this, e, t), he(e) ? e === w || e == null || e === "" ? (this._$AH !== w && this._$AR(), this._$AH = w) : e !== this._$AH && e !== W && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ii(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== w && he(this._$AH) ? this._$AA.nextSibling.data = e : this.T(X.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = pe.createElement($t(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const o = new oi(s, this), r = o.u(this.options);
      o.p(t), this.T(r), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = it.get(e.strings);
    return t === void 0 && it.set(e.strings, t = new pe(e)), t;
  }
  k(e) {
    Pe(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const o of e) s === t.length ? t.push(i = new ue(this.O(le()), this.O(le()), this, this.options)) : i = t[s], i._$AI(o), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = Ze(e).nextSibling;
      Ze(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class Ce {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, o) {
    this.type = 1, this._$AH = w, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = w;
  }
  _$AI(e, t = this, i, s) {
    const o = this.strings;
    let r = !1;
    if (o === void 0) e = se(this, e, t, 0), r = !he(e) || e !== this._$AH && e !== W, r && (this._$AH = e);
    else {
      const a = e;
      let c, p;
      for (e = o[0], c = 0; c < o.length - 1; c++) p = se(this, a[i + c], t, c), p === W && (p = this._$AH[c]), r ||= !he(p) || p !== this._$AH[c], p === w ? e = w : e !== w && (e += (p ?? "") + o[c + 1]), this._$AH[c] = p;
    }
    r && !s && this.j(e);
  }
  j(e) {
    e === w ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ri extends Ce {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === w ? void 0 : e;
  }
}
class ai extends Ce {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== w);
  }
}
class ci extends Ce {
  constructor(e, t, i, s, o) {
    super(e, t, i, s, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = se(this, e, t, 0) ?? w) === W) return;
    const i = this._$AH, s = e === w && i !== w || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, o = e !== w && (i === w || s);
    s && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class di {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    se(this, e);
  }
}
const li = Ne.litHtmlPolyfillSupport;
li?.(pe, ue), (Ne.litHtmlVersions ??= []).push("3.3.3");
const hi = (n, e, t) => {
  const i = t?.renderBefore ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const o = t?.renderBefore ?? null;
    i._$litPart$ = s = new ue(e.insertBefore(le(), o), o, void 0, t ?? {});
  }
  return s._$AI(n), s;
};
const De = globalThis;
let ce = class extends ie {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = hi(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return W;
  }
};
ce._$litElement$ = !0, ce.finalized = !0, De.litElementHydrateSupport?.({ LitElement: ce });
const pi = De.litElementPolyfillSupport;
pi?.({ LitElement: ce });
(De.litElementVersions ??= []).push("4.2.2");
const st = "circuitsetup_energy_meter_helper/", ui = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, fi = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, gi = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, _i = /[\u0000-\u001f\u007f-\u009f]/, vi = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), mi = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), bi = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "partial", "indeterminate", "verified", "cancelled"]), qe = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), nt = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), we = /* @__PURE__ */ new Set(["A", "B", "C"]), wi = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), yi = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), $i = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), Si = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), Ci = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), Ai = /^(?:ct(?:[1-9]|[1-3][0-9]|4[0-2])_name|current_cal_ct(?:[1-9]|[1-3][0-9]|4[0-2])|voltage_cal[12])$/, ki = /^[0-9a-f]{12}$/, Ei = /^[0-9a-f]{64}$/, ot = /^[0-9a-f]{32}$/, xi = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, St = /^[a-z0-9][a-z0-9_-]{0,127}$/, Ct = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, rt = /* @__PURE__ */ new Set(["preview_ct_config", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]), Ii = /* @__PURE__ */ new Set(["available", "unavailable", "invalid"]), Ri = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial"]), Ti = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial", "indeterminate"]), Oi = /* @__PURE__ */ new Set(["applied_pending_restart_verification", "partial", "indeterminate"]);
function y(n, e) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function A(n, e, t = 100) {
  if (!Array.isArray(n) || n.length > t) throw new Error(`${e} response is invalid`);
  return n;
}
function m(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${e} response is invalid`);
  return n;
}
function x(n, e) {
  if (typeof n != "number" || !Number.isFinite(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function $(n, e) {
  const t = x(n, e);
  if (!Number.isInteger(t)) throw new Error(`${e} response is invalid`);
  return t;
}
function B(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "boolean") throw new Error(`${e} response is invalid`);
  return n;
}
function O(n, e, t) {
  const i = m(n, t);
  if (!e.has(i)) throw new Error(`${t} response is invalid`);
  return i;
}
function Oe(n, e) {
  n !== void 0 && m(n, e, !0);
}
function H(n, e) {
  return Math.abs(n - e) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(e));
}
function z(n, e, t) {
  const i = Object.keys(n);
  if (i.length !== e.length || i.some((s) => !e.includes(s))) throw new Error(`${t} response is invalid`);
}
function _e(n, e) {
  return n.length === e.length && n.every((t, i) => t === e[i]);
}
function At(n, e) {
  const t = y(n, e);
  m(t.entry_id, e), m(t.title, e), m(t.project_name, e), m(t.project_version, e, !0), B(t.importable, e, !0), m(t.configuration, e, !0);
}
function ve(n, e) {
  const t = y(n, e);
  if (O(t.state, vi, e), A(t.devices, e).forEach((i) => At(i, e)), t.configuration_authoritative !== void 0 && B(t.configuration_authoritative, e), t.installer_intent !== void 0) {
    const i = y(t.installer_intent, e), s = $(i.addon_count, e);
    if (s < 0 || s > 6) throw new Error(`${e} response is invalid`);
    if (O(i.connection_type, qe, e) === "unknown") throw new Error(`${e} response is invalid`);
    const r = i.firmware_product_id, a = i.esphome_version;
    if (r === void 0 != (a === void 0) || r !== void 0 && (typeof r != "string" || r.length > 160 || !St.test(r)) || a !== void 0 && (typeof a != "string" || a.length > 160 || !Ct.test(a)))
      throw new Error(`${e} response is invalid`);
  }
  return n;
}
function at(n, e) {
  const t = y(n, e), i = $(t.addon_count, e), s = $(t.board_count, e), o = $(t.ct_count, e), r = $(t.group_count, e);
  if (i < 0 || i > 6 || s < 1 || s > 7 || o < 6 || o > 42 || r < 2 || r > 14 || s !== i + 1 || o !== 6 * s || r !== 2 * s) throw new Error(`${e} response is invalid`);
  O(t.connection_type, qe, e), m(t.voltage_layout, e), m(t.project_name, e);
  const a = A(t.evidence, e);
  if (a.length < 1 || a.length > nt.size) throw new Error(`${e} response is invalid`);
  const c = a.map((p) => {
    const u = y(p, e), d = O(u.source, nt, e), h = $(u.addon_count, e);
    if (h < 0 || h > 6) throw new Error(`${e} response is invalid`);
    return m(u.detail, e), d;
  });
  if (new Set(c).size !== c.length || !c.some((p) => Ci.has(p))) throw new Error(`${e} response is invalid`);
  return n;
}
function Mi(n, e) {
  const t = y(n, e);
  return "topology" in t ? (at(t.topology, e), t.configuration_authoritative !== void 0 && B(t.configuration_authoritative, e), n) : at(n, e);
}
function Ui(n, e) {
  const t = y(n, e);
  m(t.plan_id, e), m(t.source_sha256, e);
  const i = A(t.channels, e);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${e} response is invalid`);
  i.forEach((r, a) => {
    const c = y(r, e), p = $(c.channel, e);
    m(c.name, e), $(c.raw_gain_ct, e), x(c.reporting_multiplier, e), Oe(c.selected_model_id, e), B(c.selection_verified_against_config, e), Oe(c.display_label, e);
    const u = y(c.address, e), d = $(u.channel, e), h = $(u.board_index, e), f = $(u.group_index, e), g = O(u.phase, we, e), _ = a + 1;
    if (p !== _ || d !== _ || h !== Math.floor(a / 6) || f !== Math.floor(a % 6 / 3) || g !== ["A", "B", "C"][a % 3]) throw new Error(`${e} response is invalid`);
  });
  const s = y(t.catalog, e);
  m(s.source_repository, e), m(s.source_ref, e), $(s.schema_version, e);
  const o = A(s.presets, e);
  if (o.length > 64) throw new Error(`${e} response is invalid`);
  return o.forEach((r) => {
    const a = y(r, e);
    m(a.model_id, e), m(a.label, e), x(a.rated_current_a, e), m(a.secondary, e), a.default_gain_ct !== null && $(a.default_gain_ct, e), B(a.requires_burden_jumper_cut, e), m(a.notes, e);
  }), n;
}
function re(n, e) {
  const t = y(n, e);
  if (m(t.transaction_id, e), O(t.state, mi, e), m(t.source_sha256, e), B(t.rollback_available, e), m(t.redacted_diff, e), A(t.changes, e).forEach((i) => {
    const s = y(i, e), o = m(s.key, e);
    if (!Ai.test(o)) throw new Error(`${e} response is invalid`);
    s.old_value !== null && m(s.old_value, e), m(s.new_value, e);
  }), A(t.evidence, e).forEach((i) => O(i, yi, e)), A(t.progress, e).forEach((i) => O(i, $i, e)), t.validation_detail != null) {
    const i = y(t.validation_detail, e);
    for (const s of ["reported_error_count", "reported_warning_count"]) i[s] !== null && $(i[s], e);
    i.code !== null && $(i.code, e), $(i.error_record_count, e), $(i.warning_record_count, e);
  }
  return t.upload_progress !== void 0 && A(t.upload_progress, e).forEach((i) => {
    const s = y(i, e);
    if (O(s.stage, wi, e), s.progress !== null && s.percentage !== null && s.progress !== void 0 && s.percentage !== void 0) throw new Error(`${e} response is invalid`);
    const o = s.progress ?? s.percentage;
    if (o != null) {
      const r = $(o, e);
      if (r < 0 || r > 100) throw new Error(`${e} response is invalid`);
    }
  }), n;
}
function G(n, e) {
  const t = y(n, e);
  m(t.session_id, e), m(t.device_id, e), O(t.state, bi, e), B(t.safety_acknowledged, e);
  const i = y(t.preflight, e);
  A(i.issues, e).forEach((d) => {
    const h = y(d, e);
    O(h.code, Si, e), m(h.role, e), m(h.detail, e);
  }), A(i.zeroed_roles, e).forEach((d) => m(d, e)), t.entity_role_counts !== void 0 && Object.values(y(t.entity_role_counts, e)).forEach((d) => {
    if ($(d, e) < 0) throw new Error(`${e} response is invalid`);
  }), t.calibration_sources !== void 0 && Object.values(y(t.calibration_sources, e)).forEach((d) => O(d, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), e));
  const s = [t.offset_capability, t.offset_disposition, t.offset_boards, t.has_pending_calibration];
  if (s.every((d) => d === void 0)) return n;
  if (s.some((d) => d === void 0)) throw new Error(`${e} response is invalid`);
  const o = y(t.offset_capability, e);
  if (z(o, ["status", "repair_reason"], e), O(o.status, Ii, e) === "invalid") m(o.repair_reason, e);
  else if (o.repair_reason !== null) throw new Error(`${e} response is invalid`);
  const a = O(t.offset_disposition, Ri, e), c = A(t.offset_boards, e, 7);
  if (c.length < 1) throw new Error(`${e} response is invalid`);
  const p = [];
  c.forEach((d, h) => {
    const f = y(d, e);
    if (z(f, ["board_index", "stages"], e), $(f.board_index, e) !== h) throw new Error(`${e} response is invalid`);
    const g = A(f.stages, e, 2);
    if (g.length !== 2) throw new Error(`${e} response is invalid`);
    g.forEach((_, v) => {
      const b = y(_, e);
      if (z(b, ["stage", "state"], e), $(b.stage, e) !== v + 1) throw new Error(`${e} response is invalid`);
      p.push(O(b.state, Ti, e));
    });
  });
  const u = p.every((d) => d === "skipped") ? "skipped" : p.every((d) => d === "completed") ? "completed" : p.every((d) => d === "not_started") ? "not_started" : p.some((d) => d === "partial" || d === "indeterminate") || p.some((d) => d === "skipped") ? "partial" : "in_progress";
  if (a !== u) throw new Error(`${e} response is invalid`);
  return B(t.has_pending_calibration, e), n;
}
function Bi(n, e, t, i) {
  const s = y(n, e);
  if (z(s, ["stage", "ready", "connection_generation", "entities", "reasons", "thresholds"], e), $(s.stage, e) !== i || t < 0 || t > 6) throw new Error(`${e} response is invalid`);
  const o = B(s.ready, e), r = $(s.connection_generation, e);
  if (r < 1) throw new Error(`${e} response is invalid`);
  const a = y(s.thresholds, e);
  z(a, ["sample_count", "zero_voltage_peak_volts", "zero_voltage_spread_volts", "zero_current_peak_amps", "zero_current_spread_amps", "voltage_present_minimum_volts", "voltage_present_spread_volts"], e);
  const c = $(a.sample_count, e), p = x(a.zero_voltage_peak_volts, e), u = x(a.zero_voltage_spread_volts, e), d = x(a.zero_current_peak_amps, e), h = x(a.zero_current_spread_amps, e), f = x(a.voltage_present_minimum_volts, e), g = x(a.voltage_present_spread_volts, e), _ = [
    p,
    u,
    d,
    h,
    f,
    g
  ];
  if (c < 3 || c > 100 || _.some((k) => k < 0) || _[4] === 0) throw new Error(`${e} response is invalid`);
  const v = A(s.entities, e, 12);
  if (v.length !== 12) throw new Error(`${e} response is invalid`);
  const b = /* @__PURE__ */ new Map();
  for (const k of [0, 1]) {
    const C = t === 0 ? `main_${k + 1}` : `addon${t}_${k + 1}`;
    for (const U of ["a", "b", "c"]) b.set(`${C}.voltage_${U}`, "voltage");
    for (let U = 1; U <= 3; ++U) b.set(`ct${t * 6 + k * 3 + U}.current_sensor`, "current");
  }
  const I = "entity binding is not on the active connection generation", R = "fresh window unavailable: ", S = /* @__PURE__ */ new Set(), E = [];
  let M = 0;
  v.forEach((k) => {
    const C = y(k, e);
    z(C, ["role", "quantity", "ready", "reasons", "window"], e);
    const U = m(C.role, e), J = O(C.quantity, /* @__PURE__ */ new Set(["voltage", "current"]), e);
    if (S.has(U) || b.get(U) !== J) throw new Error(`${e} response is invalid`);
    S.add(U);
    const Ge = B(C.ready, e), Q = A(C.reasons, e, 12).map((P) => m(P, e));
    let D;
    if (C.window === null) {
      if (Ge || Q.length !== 1) throw new Error(`${e} response is invalid`);
      if (Q[0] === I) ++M;
      else if (!Q[0].startsWith(R) || Q[0].slice(R.length).trim().length === 0)
        throw new Error(`${e} response is invalid`);
      D = Q;
    } else {
      const P = y(C.window, e);
      z(P, ["values", "received_at", "connection_generation", "mean", "minimum", "maximum", "absolute_peak", "absolute_spread"], e);
      const ee = A(P.values, e, c).map((K) => x(K, e)), ke = A(P.received_at, e, c).map((K) => x(K, e)), Ht = x(P.mean, e), Ee = x(P.minimum, e), Le = x(P.maximum, e), xe = x(P.absolute_peak, e), fe = x(P.absolute_spread, e), zt = ee.reduce((K, ge) => K + ge, 0) / ee.length, jt = $(P.connection_generation, e);
      if (ee.length !== c || ke.length !== c || ke.some((K, ge) => ge > 0 && K <= ke[ge - 1]) || !H(Ht, zt) || !H(Ee, Math.min(...ee)) || !H(Le, Math.max(...ee)) || !H(xe, Math.max(...ee.map(Math.abs))) || !H(fe, Le - Ee)) throw new Error(`${e} response is invalid`);
      D = [], jt !== r ? D.push("window is from another connection generation") : J === "current" ? (xe > d && D.push("absolute peak exceeds zero_current_peak_amps"), fe > h && D.push("absolute spread exceeds zero_current_spread_amps")) : i === 1 ? (xe > p && D.push("absolute peak exceeds zero_voltage_peak_volts"), fe > u && D.push("absolute spread exceeds zero_voltage_spread_volts")) : (Ee < f && D.push("minimum is below voltage_present_minimum_volts"), fe > g && D.push("absolute spread exceeds voltage_present_spread_volts"));
    }
    if (!_e(Q, D) || Ge !== (D.length === 0)) throw new Error(`${e} response is invalid`);
    E.push(...D.map((P) => `${U}: ${P}`));
  });
  const N = A(s.reasons, e, 100).map((k) => m(k, e)), F = [...E, "connection generation changed while collecting readiness"], T = M === v.length && _e(N, [I]) || M === 0 && (_e(N, E) || _e(N, F));
  if (S.size !== b.size || !T || o !== (N.length === 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function kt(n, e) {
  const t = A(n, e, 3);
  if (t.length !== 3) throw new Error(`${e} response is invalid`);
  return t.forEach((i) => {
    const s = A(i, e, 2);
    if (s.length !== 2 || s.some((o) => {
      const r = $(o, e);
      return r < -32768 || r > 32767;
    })) throw new Error(`${e} response is invalid`);
  }), n;
}
function Ni(n, e, t, i) {
  const s = y(n, e);
  z(s, ["state", "board_index", "stage", "expected_tables", "unfinished_group_keys", "retry_allowed", "error"], e);
  const o = O(s.state, Oi, e);
  if ($(s.board_index, e) !== t || $(s.stage, e) !== i) throw new Error(`${e} response is invalid`);
  const r = t === 0 ? ["main_1", "main_2"] : [`addon${t}_1`, `addon${t}_2`], a = A(s.expected_tables, e, 2).map((d) => {
    const h = A(d, e, 2);
    if (h.length !== 2) throw new Error(`${e} response is invalid`);
    const f = m(h[0], e);
    if (!r.includes(f)) throw new Error(`${e} response is invalid`);
    return kt(h[1], e), f;
  }), c = A(s.unfinished_group_keys, e, 2).map((d) => m(d, e)), p = [...a, ...c], u = B(s.retry_allowed, e);
  if (p.length !== 2 || new Set(p).size !== 2 || p.some((d) => !r.includes(d))) throw new Error(`${e} response is invalid`);
  if (o === "applied_pending_restart_verification") {
    if (a.length !== 2 || c.length !== 0 || u || s.error !== null) throw new Error(`${e} response is invalid`);
  } else if (m(s.error, e), !u || a.length !== (o === "partial" ? 1 : 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function ct(n, e, t, i) {
  const s = y(n, e), o = O(s.target, /* @__PURE__ */ new Set(["voltage", "current"]), e);
  m(s.target_id, e);
  const r = B(s.stable, e);
  if (o !== t || s.target_id !== i) throw new Error(`${e} response is invalid`);
  const a = A(s.windows, e, o === "voltage" ? 3 : 1);
  if (a.length !== (o === "voltage" ? 3 : 1)) throw new Error(`${e} response is invalid`);
  const c = a.map((p) => {
    const u = y(p, e), d = A(u.samples, e, 1).map((I) => x(I, e));
    if (d.length !== 1) throw new Error(`${e} response is invalid`);
    const h = x(u.mean, e), f = x(u.standard_deviation, e), g = x(u.range_percent, e), _ = d.reduce((I, R) => I + R, 0) / d.length, v = Math.sqrt(d.reduce((I, R) => I + (R - _) ** 2, 0) / d.length), b = 100 * (Math.max(...d) - Math.min(...d)) / Math.abs(_);
    if (!H(h, _) || !H(f, v) || !H(g, b)) throw new Error(`${e} response is invalid`);
    return g;
  });
  if (r !== c.every((p) => p <= 1)) throw new Error(`${e} response is invalid`);
  return n;
}
function dt(n, e, t) {
  const i = y(n, e), s = O(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e);
  m(i.group_key, e), i.phase !== null && O(i.phase, we, e);
  const o = $(i.iteration, e), r = A(i.changed_channels, e, 3).map((g) => $(g, e)), a = A(i.before_values, e, 3), c = A(i.after_values, e, 3), p = A(i.error_percent_values, e, 3);
  for (const g of [a, c, p]) g.forEach((_) => x(_, e));
  const u = t.target === "voltage" ? t.groupKey : Fe(t.references[0].channel), d = t.target === "voltage" ? Et(t.groupKey) : t.references.map((g) => g.channel), h = t.target === "current" && t.references.length === 1 ? ["A", "B", "C"][(t.references[0].channel - 1) % 3] : null, f = B(i.retry_allowed, e);
  if (t.target === "voltage" && (!Number.isFinite(t.reference) || t.reference <= 0) || t.target === "current" && t.references.some((g) => !Number.isFinite(g.reference) || g.reference <= 0 || !Number.isFinite(g.rawReference) || g.rawReference <= 0) || ![1, 2, 3].includes(r.length) || s !== "indeterminate" && a.length !== r.length || new Set(r).size !== r.length || r.some((g) => g < 1 || g > 42) || o < 1 || o > 3 || i.group_key !== u || i.phase !== h || r.length !== d.length || r.some((g, _) => g !== d[_]) || (s === "indeterminate" ? c.length !== 0 || p.length !== 0 : c.length !== r.length || p.length !== r.length)) throw new Error(`${e} response is invalid`);
  if (s === "indeterminate") {
    if (i.gain_evidence !== null || f) throw new Error(`${e} response is invalid`);
    i.restore_evidence != null && y(i.restore_evidence, e);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${e} response is invalid`);
    Pi(i.gain_evidence, e, t);
    const g = t.target === "voltage" ? c.map(() => t.reference) : t.references.map((b) => b.reference), _ = c.map((b, I) => 100 * Math.abs(x(b, e) - g[I]) / g[I]);
    if (p.some((b, I) => x(b, e) < 0 || !H(x(b, e), _[I]))) throw new Error(`${e} response is invalid`);
    const v = Math.max(..._) > 1;
    if (s === "result_outside_tolerance" !== v || f !== (v && o < 3)) throw new Error(`${e} response is invalid`);
  }
  return n;
}
function Fe(n) {
  const e = Math.floor((n - 1) / 6), t = Math.floor((n - 1) % 6 / 3) + 1;
  return e === 0 ? `main_${t}` : `addon${e}_${t}`;
}
function Pi(n, e, t) {
  const i = y(n, e), s = $(i.connection_generation, e), o = $(i.operation_sequence, e), r = t.target === "voltage" ? t.groupKey : Fe(t.references[0].channel), a = r.startsWith("main_") ? `meter_main${r.slice(-1)}` : r;
  if (s < 1 || o < 1 || m(i.instance_id, e) !== a) throw new Error(`${e} response is invalid`);
  const c = t.target === "current" ? new Map(t.references.map((h) => [["A", "B", "C"][(h.channel - 1) % 3], h.rawReference])) : /* @__PURE__ */ new Map(), p = A(i.phases, e, 3);
  if (p.length !== 3) throw new Error(`${e} response is invalid`);
  p.forEach((h, f) => {
    const g = y(h, e), _ = O(g.phase, we, e);
    if (_ !== ["A", "B", "C"][f]) throw new Error(`${e} response is invalid`);
    x(g.measured_voltage, e), x(g.measured_current, e);
    const v = x(g.reference_voltage, e), b = x(g.reference_current, e), I = $(g.old_voltage_gain, e), R = $(g.new_voltage_gain, e), S = $(g.old_current_gain, e), E = $(g.new_current_gain, e);
    if ([I, R, S, E].some((M) => M < 1 || M > 65535)) throw new Error(`${e} response is invalid`);
    if (t.target === "voltage") {
      if (Math.abs(v - t.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(v), t.reference)) || Math.abs(b) > 1e-6 || S !== E) throw new Error(`${e} response is invalid`);
    } else {
      const M = c.get(_);
      if (Math.abs(v) > 1e-6 || (M === void 0 ? Math.abs(b) > 1e-6 : Math.abs(b - M) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(b), M))) || I !== R || M === void 0 && S !== E) throw new Error(`${e} response is invalid`);
    }
  });
  const u = A(i.register_mismatch_phases, e, 3);
  u.forEach((h) => O(h, we, e));
  const d = A(i.matching_lines, e, 100);
  if (d.length === 0 || d.some((h) => typeof h != "string") || B(i.flash_saved, e) !== !0 || u.length !== 0 || B(i.calibration_disabled, e) !== !1) throw new Error(`${e} response is invalid`);
}
function Et(n) {
  const e = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(n);
  if (!e) return [];
  const t = e[2] === void 0 ? 0 : Number(e[2]), i = Number(e[1] ?? e[3]), s = t * 6 + (i - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}
function Me(n, e, t) {
  const i = y(n, e);
  for (const g of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) m(i[g], e);
  const s = $(i.topology_addon_count, e);
  O(i.topology_connection_type, qe, e);
  const o = $(i.connection_generation, e), r = O(i.source_authority, /* @__PURE__ */ new Set(["saved_flash", "configuration"]), e), a = B(i.source_handoff_available, e), c = B(i.source_handoff_firmware_installed, e);
  Oe(i.source_handoff_transaction_id, e);
  const p = i.config_filename !== null || i.config_sha256 !== null;
  if (p && (m(i.config_filename, e), m(i.config_sha256, e), !xi.test(i.config_filename) || !Ei.test(i.config_sha256)))
    throw new Error(`${e} response is invalid`);
  if (i.config_filename === null != (i.config_sha256 === null)) throw new Error(`${e} response is invalid`);
  if (!ki.test(i.mac) || !ot.test(i.verification_id) || o < 1 || i.source_handoff_transaction_id !== null && !ot.test(i.source_handoff_transaction_id) || s !== t.addon_count || i.topology_project_name !== t.project_name || i.topology_connection_type !== t.connection_type || i.topology_voltage_layout !== t.voltage_layout) throw new Error(`${e} response is invalid`);
  const u = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: s }, (g, _) => [`addon${_ + 1}_1`, `addon${_ + 1}_2`]).flat()]), d = (g, _, v) => {
    const b = A(i[g] ?? [], e, 14), I = /* @__PURE__ */ new Set();
    return b.forEach((R) => {
      const S = y(R, e);
      z(S, ["instance_id", _], e);
      const E = m(S.instance_id, e);
      if (!u.has(E) || I.has(E)) throw new Error(`${e} response is invalid`);
      if (I.add(E), v) kt(S[_], e);
      else {
        const M = A(S[_], e, 3);
        if (M.length !== 3) throw new Error(`${e} response is invalid`);
        M.forEach((N) => {
          const F = A(N, e, 2);
          if (F.length !== 2 || F.some((j) => {
            const T = $(j, e);
            return T < 1 || T > 65535;
          })) throw new Error(`${e} response is invalid`);
        });
      }
    }), b.length;
  }, h = d("groups", "phase_gains", !1), f = d("offset_groups", "phase_offsets", !0) + d("power_offset_groups", "phase_power_offsets", !0);
  if (h + f < 1 || a && (!p || c || i.source_handoff_transaction_id !== null || r !== "saved_flash" || f > 0) || !a && p && i.source_handoff_transaction_id === null && f === 0 || c && (!p || i.source_handoff_transaction_id === null || f > 0) || r === "configuration" && (!c || a || f > 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function Di(n, e, t) {
  const i = y(n, e);
  return i.session !== null && G(i.session, e), i.transaction !== null && re(i.transaction, e), i.verified_calibration !== null && Me(i.verified_calibration, e, t), n;
}
class ye {
  constructor(e, t) {
    this.hass = e, this.entryId = t, this.setupStatus = () => this.call("setup_status", (i) => ve(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (A(i, "list_meters").forEach((s) => At(s, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (s) => Mi(s, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (s) => Ui(s, "get_ct_inventory"), { device_id: i }), this.getActiveWork = (i, s) => this.call("get_active_work", (o) => Di(o, "get_active_work", s), { device_id: i }), this.getSession = (i) => this.call("get_session", (s) => G(s, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => y(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, s, o) => this.call("set_installer_intent", (r) => ve(r, "set_installer_intent"), {
      addon_count: i,
      connection_type: s,
      ...o && o.productId.length <= 160 && o.version.length <= 160 && St.test(o.productId) && Ct.test(o.version) ? { firmware_product_id: o.productId, esphome_version: o.version } : {}
    }), this.rescan = () => this.call("rescan", (i) => ve(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (s) => {
      const o = y(s, "adopt_device");
      return m(o.device_id, "adopt_device"), m(o.configuration, "adopt_device"), s;
    }, { device_id: i }), this.previewCtConfig = (i, s, o, r) => this.call("preview_ct_config", (a) => re(a, "preview_ct_config"), {
      device_id: i,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.setHaLabels = (i, s, o, r) => this.call("set_ha_labels", (a) => a, {
      device_id: i,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.transaction = (i, s, o, r) => this.call(i, (a) => re(a, i), {
      device_id: s,
      transaction_id: o,
      source_sha256: r
    }), this.applyCtConfig = (i, s, o) => this.transaction("apply_ct_config", i, s, o), this.compileCtConfig = (i, s, o) => this.transaction("compile_ct_config", i, s, o), this.installCtConfig = (i, s, o) => this.transaction("install_ct_config", i, s, o), this.rollbackCtConfig = (i, s, o) => this.transaction("rollback_ct_config", i, s, o), this.startSession = (i) => this.call("start_session", (s) => G(s, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (s) => G(s, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, o) => this.call("check_stability", (r) => ct(r, "check_stability", s, o), { session_id: i, target: s, target_id: o }), this.checkOffsetReadiness = (i, s, o) => this.call("check_offset_readiness", (r) => Bi(r, "check_offset_readiness", s, o), {
      session_id: i,
      board_index: s,
      stage: o
    }), this.calibrateOffset = (i, s, o, r, a) => this.call("calibrate_offset", (c) => Ni(c, "calibrate_offset", s, o), {
      session_id: i,
      board_index: s,
      stage: o,
      preparation_acknowledged: r,
      confirm_retry: a
    }), this.skipOffsetCalibration = (i) => this.call("skip_offset_calibration", (s) => G(s, "skip_offset_calibration"), { session_id: i }), this.checkVoltageStability = (i, s) => s.length !== 2 || new Set(s).size !== 2 ? Promise.reject(new Error("check_stability board is invalid")) : this.call("check_stability", (o) => {
      const r = A(o, "check_stability", 2);
      if (r.length !== 2) throw new Error("check_stability response is invalid");
      return r.map((a, c) => ct(a, "check_stability", "voltage", s[c]));
    }, { session_id: i, target: "voltage", target_ids: s }), this.calibrateVoltage = (i, s, o) => {
      const r = s.map((a) => Et(a.group_key));
      return s.length !== 2 || new Set(s.map((a) => a.group_key)).size !== 2 || r.some((a) => a.length !== 3) || new Set(r.map((a) => Math.floor((a[0] - 1) / 6))).size !== 1 || s.some((a) => !Number.isFinite(a.reference) || a.reference <= 0) ? Promise.reject(new Error("calibrate_voltage board is invalid")) : this.call("calibrate_voltage", (a) => {
        const c = A(a, "calibrate_voltage", 2);
        if (c.length !== 2) throw new Error("calibrate_voltage response is invalid");
        return c.map((p, u) => dt(p, "calibrate_voltage", {
          target: "voltage",
          groupKey: s[u].group_key,
          reference: s[u].reference
        }));
      }, { session_id: i, references: s, confirm_iteration: o });
    }, this.calibrateCurrent = (i, s, o, r = []) => s.length < 1 || s.length > 3 || new Set(s.map((a) => a.channel)).size !== s.length || new Set(s.map((a) => Fe(a.channel))).size !== 1 || s.some((a) => !Number.isInteger(a.channel) || a.channel < 1 || a.channel > 42 || !Number.isFinite(a.reference) || a.reference <= 0 || !Number.isFinite(a.reporting_multiplier) || a.reporting_multiplier < 1e-3 || a.reporting_multiplier > 1e3) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (a) => dt(a, "calibrate_current", {
      target: "current",
      references: s.map((c) => ({ channel: c.channel, reference: c.reference, rawReference: c.reference / c.reporting_multiplier }))
    }), {
      session_id: i,
      references: s,
      confirm_iteration: o,
      pending_multipliers: r
    }), this.restartAndVerify = (i, s) => this.call("restart_and_verify", (o) => Me(o, "restart_and_verify", s), { session_id: i }), this.completeCalibrationWithoutChanges = (i) => this.call("complete_calibration_without_changes", (s) => {
      const o = G(s, "complete_calibration_without_changes");
      if (o.session_id !== i || o.state !== "verified" || o.has_pending_calibration !== !1)
        throw new Error("complete_calibration_without_changes response is invalid");
      return o;
    }, { session_id: i }), this.previewCalibratedGains = (i, s, o = []) => this.call("preview_calibrated_gains", (r) => re(r, "preview_calibrated_gains"), {
      session_id: i,
      verification_id: s,
      changes: o
    }), this.clearCalibrationFlash = (i, s, o, r) => this.call("clear_calibration_flash", (a) => Me(a, "clear_calibration_flash", r), {
      session_id: i,
      verification_id: s,
      transaction_id: o
    }), this.cancelSession = (i) => this.call("cancel_session", (s) => G(s, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (s) => ve(s, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, s, o, r) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: s,
      source_sha256: o
    }, (a) => re(a, "subscribe_config_transaction"), r), this.subscribeSession = (i, s) => this.subscribe("subscribe_session", { session_id: i }, (o) => G(o, "subscribe_session"), s);
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
      if (e.length > a || gi.test(e) || fi.test(e) || r && s !== "redacted_diff" || s === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${s || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [r, a] of Object.entries(e)) {
        if (r.length > 256 || _i.test(r)) throw new Error("unsafe property name refused");
        if (r.toLowerCase() === "key" && !o) throw new Error(`private field ${r} refused`);
        if (r.toLowerCase() !== "raw_gain_ct" && ui.test(r))
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
      type: `${st}${e}`,
      entry_id: this.entryId,
      ...i
    });
    return ye.assertPublicPayload(s, rt.has(e)), t(s);
  }
  subscribe(e, t, i, s) {
    return this.hass.connection.subscribeMessage((o) => {
      ye.assertPublicPayload(o, rt.has(e)), s(i(o));
    }, { type: `${st}${e}`, entry_id: this.entryId, ...t });
  }
}
function qi(n) {
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
function Fi(n, e, t, i, s, o, r) {
  const a = n?.state ?? "previewed";
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${qi(n)}
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
        <div><dt>Errors</dt><dd>${n.validation_detail.error_record_count} records (${n.validation_detail.reported_error_count === null ? "unreported" : `${n.validation_detail.reported_error_count} reported`})</dd></div>
        <div><dt>Warnings</dt><dd>${n.validation_detail.warning_record_count} records (${n.validation_detail.reported_warning_count === null ? "unreported" : `${n.validation_detail.reported_warning_count} reported`})</dd></div>
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
const Ae = (n, e) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(n.key)) return;
  n.preventDefault();
  const i = [...n.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], s = n.key === "ArrowRight" || n.key === "ArrowDown", o = n.key === "Home" ? 0 : n.key === "End" ? i.length - 1 : (e + (s ? 1 : i.length - 1)) % i.length;
  i[o]?.click(), i[o]?.focus();
}, xt = (n, e, t) => (n?.default_gain_ct ?? t) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((n?.default_gain_ct ?? t) / e);
function Hi(n, e, t, i, s, o, r, a = !1, c = !1) {
  const p = Math.ceil(n.channels.length / 6), u = n.channels.filter((d) => d.address.board_index === e).slice(0, 8);
  return l`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: p }, (d, h) => l`
          <button role="tab" id=${`board-tab-${h}`} data-board-tab=${h} aria-selected=${h === e}
            aria-controls="board-panel" tabindex=${h === e ? "0" : "-1"}
            @keydown=${(f) => Ae(f, h)}
            @click=${() => i(h)}>${h === 0 ? "Main Board" : `Add-on ${h}`}</button>
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
    const h = t.get(d.channel) ?? {
      name: d.name,
      modelId: d.selected_model_id ?? "",
      multiplier: d.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, f = n.catalog.presets.find((v) => v.model_id === h.modelId), g = xt(f, h.multiplier, h.modelId === "custom" ? h.customGainCt : void 0), _ = He(d, h);
    return l`
              <div class="ct-row" data-ct-row data-ct-group=${d.address.group_index} role="row" aria-rowindex=${d.channel + 1} aria-label=${`CT${d.channel}`}>
                <strong class="ct-index" role="cell">CT${d.channel}</strong>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${d.channel} name`} .value=${h.name}
                  @input=${(v) => s(d.channel, { name: v.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${d.channel} model`} ?disabled=${a}
                  @change=${(v) => {
      const b = v.target.value, I = n.catalog.presets.find((R) => R.model_id === b);
      s(d.channel, {
        modelId: b,
        burdenAcknowledged: d.selection_verified_against_config && b === d.selected_model_id && (b === "custom" || I?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${h.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((v) => l`<option value=${v.model_id} ?selected=${h.modelId === v.model_id}>${v.label}</option>`)}
                  <option value="custom" ?selected=${h.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${d.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${d.channel} multiplier`} ?disabled=${a}
                  .value=${String(h.multiplier)} @input=${(v) => s(d.channel, { multiplier: Number(v.target.value) })} /></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${g ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${f?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${h.expanded} @click=${() => s(d.channel, { expanded: !h.expanded })}>
                  ${h.modelId ? _ ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${h.modelId === "custom" ? l`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${d.channel} custom gain`}
                  ?disabled=${a}
                  .value=${h.customGainCt === void 0 ? "" : String(h.customGainCt)}
                  @input=${(v) => s(d.channel, { customGainCt: Number(v.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${d.channel} custom label`} ?disabled=${a} .value=${h.customLabel ?? ""}
                  @input=${(v) => s(d.channel, { customLabel: v.target.value })} /></label>
              </div>` : w}
              ${h.modelId === "custom" || f?.requires_burden_jumper_cut ? l`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${d.channel} burden output acknowledgement`}
                  ?disabled=${a}
                  .checked=${h.burdenAcknowledged}
                  @change=${(v) => s(d.channel, { burdenAcknowledged: v.target.checked })} />
                  I checked the burden-output requirement for CT${d.channel}</label>
              </div>` : w}
              ${f && f.rated_current_a > 65.535 && h.multiplier === 1 ? l`<div class="warning-band" role="status">CT${d.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : w}
              ${h.expanded && f ? l`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${f.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${f.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${f.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${f.notes || (f.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : w}
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${u[0]?.channel ?? 0}–${u.at(-1)?.channel ?? 0} of ${n.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${c || !ji(n, t, a)} @click=${r}>${c ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
function te(n, e) {
  return n.channels.flatMap((t) => {
    const i = e.get(t.channel);
    if (!i || !He(t, i)) return [];
    const s = n.catalog.presets.find((r) => r.model_id === i.modelId), o = { channel: t.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (o.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (o.custom_label = i.customLabel.trim()), o.burden_output_acknowledged = i.burdenAcknowledged) : s?.requires_burden_jumper_cut && (o.burden_output_acknowledged = i.burdenAcknowledged), [o];
  });
}
function He(n, e) {
  return e.name !== n.name || e.modelId !== (n.selected_model_id ?? "") || e.multiplier !== n.reporting_multiplier || e.modelId === "custom" && (xt(void 0, e.multiplier, e.customGainCt) !== n.raw_gain_ct || (e.customLabel?.trim() ?? "") !== (n.display_label ?? ""));
}
function zi(n, e) {
  if (!e.name.trim() || !e.modelId || !Number.isFinite(e.multiplier) || e.multiplier <= 0) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const t = n.catalog.presets.find((i) => i.model_id === e.modelId);
  return !!t && (!t?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function ji(n, e, t = !1) {
  if (t) return [...e].every(([i, s]) => {
    const o = n.channels.find((r) => r.channel === i);
    return !!o && !!s.name.trim() && s.modelId === (o.selected_model_id ?? "") && s.multiplier === o.reporting_multiplier;
  });
  for (const i of n.channels) {
    const s = e.get(i.channel);
    if (!s || He(i, s) && !zi(n, s))
      return !1;
  }
  return !0;
}
const L = (n) => n.toFixed(2);
function It(n, e, t) {
  const i = [n, !!e?.stable, !!t, !!t?.gain_evidence, !!t], s = i.findIndex((r) => !r);
  return l`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((r, a) => l`<li
    class=${i[a] ? "complete" : a === s ? "active" : "pending"}><span
      class="progress-number">${a + 1}</span><span>${r}</span></li>`)}</ol>`;
}
function Rt(n, e, t, i) {
  const s = Object.entries(n?.calibration_sources ?? {}).filter(([o]) => e.includes(o));
  return l`<section class="measurement-evidence calibration-source" aria-label=${`${t} calibration source`}>
    <h3>Active gain source</h3>
    ${s.length ? l`<table><thead><tr><th>Chip</th><th>Active gain source</th><th>${t} calibrated this session</th></tr></thead><tbody>
      ${s.map(([o, r]) => l`<tr><td>${o}</td><td>${r === "flash" ? "Saved flash" : r === "configuration" ? "Configuration" : "Unknown"}</td><td>${i.has(o) ? "Yes" : "No"}</td></tr>`)}
    </tbody></table><p>ATM90E32 stores voltage and current gains in one table. The active source does not mean this calibration step was completed.</p>` : l`<p>Calibration source is not available.</p>`}
  </section>`;
}
function ze(n, e) {
  if (!n) return w;
  const t = n.target === "voltage" ? "V" : "A";
  return l`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((i, s) => l`<dl>
      <div><dt>${e?.[s] ?? (n.target === "voltage" ? `V${s % 3 + 1}` : `A${s + 1}`)}</dt>
        <dd>${i.samples.map((o) => `${L(o)} ${t}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}
function je(n) {
  return n ? l`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${n.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${n.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${n.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${n.before_values.map(L).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${n.after_values.map(L).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${n.error_percent_values.map((e) => `${L(e)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${n.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${n.gain_evidence ? l`<h4>Gain evidence · ${n.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${n.gain_evidence.phases?.map((e) => l`<tr><td>${e.phase}</td><td>${L(e.measured_voltage)}</td><td>${L(e.measured_current)}</td><td>${L(e.reference_voltage)}</td><td>${L(e.reference_current)}</td><td>${e.old_voltage_gain} → ${e.new_voltage_gain}</td><td>${e.old_current_gain} → ${e.new_current_gain}</td></tr>`) ?? w}
      </tbody></table><p>Saved in flash: ${n.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : l`<p>Gain evidence unavailable.</p>`}
  </section>` : w;
}
function Gi(n, e, t, i, s, o, r, a, c, p, u, d, h, f, g, _) {
  const v = n?.ct_count ?? e?.channels.length ?? 6, b = Math.floor((i - 1) / 6), R = Math.floor((i - 1) / 3) * 3 + 1, S = Array.from({ length: 3 }, (T, k) => R + k).filter((T) => T <= v), E = S.filter((T) => (s.get(T) ?? 0) > 0), M = b === 0 ? ["meter_main1", "meter_main2"] : [`addon${b}_1`, `addon${b}_2`], N = e === null, F = o !== null && Number.isFinite(o) && o >= 1e-3 && o <= 1e3, j = E.length > 0 && (!N || F);
  return l`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${It(j, r, a)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(v / 6) }, (T, k) => l`<button role="tab"
          id=${`current-board-tab-${k}`} aria-controls="current-board-panel"
          aria-selected=${k === b} tabindex=${k === b ? "0" : "-1"}
          @keydown=${(C) => Ae(C, k)}
          @click=${() => p(k * 6 + 1)}>${k === 0 ? "Main Board" : `Add-on ${k}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${b}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((T) => {
    const k = b * 6 + T * 3 + 1;
    return l`<button
          aria-pressed=${k === R} @click=${() => p(k)}>Group ${b * 2 + T + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${R}–CT${R + 2}</h2>
      ${Rt(t, M, "Current", c)}
      <div class="reference-block">
        ${S.map((T) => l`<label>CT${T} reference
          <input data-current-reference=${T} aria-label=${`CT${T} reference`} type="number" min="0.01" step="0.01"
            .value=${s.has(T) ? String(s.get(T)) : ""}
            @input=${(k) => {
    const C = k.target;
    u(T, C.value === "" ? null : Number(C.value));
  }} /></label>`)}
      ${N ? l`<label>Reporting multiplier <input data-role="reporting-multiplier" type="number" min="0.001" max="1000" step="0.001" required .value=${o === null ? "" : String(o)} @input=${(T) => {
    const k = Number(T.target.value);
    d(Number.isFinite(k) && k >= 1e-3 && k <= 1e3 ? k : null);
  }} /></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${h} ?disabled=${!j}>Check stability</button>
        <button class="primary" @click=${f} ?disabled=${!j || !r?.stable || (a?.iteration ?? 0) >= 3 || !!(a && !a.retry_allowed && a.iteration > 0)}>${a?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button></div>
      ${r ? l`<div class=${r.stable ? "success-band" : "warning-band"} role="status">${r.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${ze(r, E.map((T) => `CT${T}`))}
      ${a?.state === "applied_pending_restart_verification" ? l`<div class="success-band" role="status">Current calibration complete for CT${R}–CT${R + 2}.</div>` : ""}
      ${je(a)}
      ${a?.state.includes("indeterminate") ? l`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${g}>Reconnect and inspect</button><button class="danger" @click=${_}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Li = (n) => n === null || typeof n != "object" && typeof n != "function", Vi = (n) => n.strings === void 0;
const Wi = { CHILD: 2 }, Ki = (n) => (...e) => ({ _$litDirective$: n, values: e });
let Yi = class {
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
const de = (n, e) => {
  const t = n._$AN;
  if (t === void 0) return !1;
  for (const i of t) i._$AO?.(e, !1), de(i, e);
  return !0;
}, $e = (n) => {
  let e, t;
  do {
    if ((e = n._$AM) === void 0) break;
    t = e._$AN, t.delete(n), n = e;
  } while (t?.size === 0);
}, Tt = (n) => {
  for (let e; e = n._$AM; n = e) {
    let t = e._$AN;
    if (t === void 0) e._$AN = t = /* @__PURE__ */ new Set();
    else if (t.has(n)) break;
    t.add(n), Ji(e);
  }
};
function Zi(n) {
  this._$AN !== void 0 ? ($e(this), this._$AM = n, Tt(this)) : this._$AM = n;
}
function Xi(n, e = !1, t = 0) {
  const i = this._$AH, s = this._$AN;
  if (s !== void 0 && s.size !== 0) if (e) if (Array.isArray(i)) for (let o = t; o < i.length; o++) de(i[o], !1), $e(i[o]);
  else i != null && (de(i, !1), $e(i));
  else de(this, n);
}
const Ji = (n) => {
  n.type == Wi.CHILD && (n._$AP ??= Xi, n._$AQ ??= Zi);
};
class Qi extends Yi {
  constructor() {
    super(...arguments), this._$AN = void 0;
  }
  _$AT(e, t, i) {
    super._$AT(e, t, i), Tt(this), this.isConnected = e._$AU;
  }
  _$AO(e, t = !0) {
    e !== this.isConnected && (this.isConnected = e, e ? this.reconnected?.() : this.disconnected?.()), t && (de(this, e), $e(this));
  }
  setValue(e) {
    if (Vi(this._$Ct)) this._$Ct._$AI(e, this);
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
class es {
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
class ts {
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
const lt = (n) => !Li(n) && typeof n.then == "function", ht = 1073741823;
class is extends Qi {
  constructor() {
    super(...arguments), this._$Cwt = ht, this._$Cbt = [], this._$CK = new es(this), this._$CX = new ts();
  }
  render(...e) {
    return e.find((t) => !lt(t)) ?? W;
  }
  update(e, t) {
    const i = this._$Cbt;
    let s = i.length;
    this._$Cbt = t;
    const o = this._$CK, r = this._$CX;
    this.isConnected || this.disconnected();
    for (let a = 0; a < t.length && !(a > this._$Cwt); a++) {
      const c = t[a];
      if (!lt(c)) return this._$Cwt = a, c;
      a < s && c === i[a] || (this._$Cwt = ht, s = 0, Promise.resolve(c).then(async (p) => {
        for (; r.get(); ) await r.get();
        const u = o.deref();
        if (u !== void 0) {
          const d = u._$Cbt.indexOf(c);
          d > -1 && d < u._$Cwt && (u._$Cwt = d, u.setValue(p));
        }
      }));
    }
    return W;
  }
  disconnected() {
    this._$CK.disconnect(), this._$CX.pause();
  }
  reconnected() {
    this._$CK.reconnect(this), this._$CX.resume();
  }
}
const ss = Ki(is), Ot = "https://circuitsetup.github.io/ESPWebInstaller/", ns = new URL("manifests/firmware_index.json", Ot).href, Mt = 256 * 1024, os = 100, rs = 20, Ut = 160, as = 1e4, cs = /^[a-z0-9][a-z0-9_-]{0,127}$/, ds = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, Bt = /[\u0000-\u001F\u007F-\u009F]/;
function q(n) {
  throw new Error(`Invalid firmware index: ${n}`);
}
function pt(n) {
  return typeof n == "object" && n !== null && !Array.isArray(n);
}
function Re(n) {
  return typeof n == "string" && n.length <= Ut && !Bt.test(n);
}
function Nt(n) {
  if (!cs.test(n)) throw new Error("Invalid firmware product ID");
}
function Pt(n) {
  if (!ds.test(n) || n.length > Ut || Bt.test(n))
    throw new Error("Invalid firmware version");
}
function Dt(n) {
  return new TextEncoder().encode(n).byteLength;
}
function ls(n) {
  Array.isArray(n) || q("top level must be an array"), Dt(JSON.stringify(n)) > Mt && q("payload is too large"), n.length > os && q("too many products");
  const e = /* @__PURE__ */ new Set();
  return n.map((t) => {
    (!pt(t) || Object.keys(t).length !== 3 || !Object.hasOwn(t, "productId") || !Object.hasOwn(t, "name") || !Object.hasOwn(t, "versions")) && q("invalid product");
    const { productId: i, name: s, versions: o } = t;
    (!Re(i) || !Re(s) || !Array.isArray(o)) && q("invalid product fields"), Nt(i), e.has(i) && q("duplicate product ID"), e.add(i), o.length > rs && q("too many versions");
    const r = /* @__PURE__ */ new Set();
    return {
      productId: i,
      name: s,
      versions: o.map((a) => ((!pt(a) || Object.keys(a).length !== 1 || !Object.hasOwn(a, "version") || !Re(a.version)) && q("invalid version"), Pt(a.version), r.has(a.version) && q("duplicate version"), r.add(a.version), { version: a.version }))
    };
  });
}
async function hs(n = globalThis.fetch, e) {
  const t = new AbortController(), i = () => t.abort();
  e?.aborted ? i() : e?.addEventListener("abort", i, { once: !0 });
  const s = setTimeout(i, as);
  try {
    const o = await n(ns, { cache: "no-cache", mode: "cors", signal: t.signal });
    if (!o.ok) throw new Error(`Firmware index request failed (${o.status})`);
    const r = await o.text();
    return Dt(r) > Mt && q("payload is too large"), ls(JSON.parse(r));
  } finally {
    clearTimeout(s), e?.removeEventListener("abort", i);
  }
}
function ps(n, e) {
  if (!Number.isInteger(n) || n < 0 || n > 6) return [];
  const t = n === 0 ? "6chan_energy_meter_main" : n === 1 ? "6chan_energy_meter_1-addon" : `6chan_energy_meter_${n}-addons`;
  return e === "wifi" ? [n === 0 ? `${t}_board` : t] : e === "ethernet_lilygo" ? [`${t}_ethernet`] : n === 0 ? [`${t}_ethernet_waveshare`, `${t}_ethernet_ws`] : [`${t}_ethernet_waveshare`];
}
function us(n, e) {
  const t = (o) => o.split(/[-.]/).map((r) => Number.isNaN(Number(r)) ? r : Number.parseInt(r, 10)), i = t(n), s = t(e);
  for (let o = 0; o < Math.max(i.length, s.length); o += 1) {
    const r = i[o], a = s[o];
    if (r === void 0) return -1;
    if (a === void 0) return 1;
    if (r > a) return -1;
    if (r < a) return 1;
  }
  return 0;
}
function fs(n, e, t) {
  const i = /* @__PURE__ */ new Map();
  for (const s of ps(e, t)) {
    const o = n.find((r) => r.productId === s);
    for (const r of o?.versions ?? [])
      i.has(r.version) || i.set(r.version, { productId: s, version: r.version });
  }
  return [...i.values()].sort((s, o) => us(s.version, o.version));
}
function gs(n, e) {
  return n.find((t) => t.version === e)?.version ?? n[0]?.version ?? null;
}
function _s(n, e) {
  Nt(n), Pt(e);
  const t = new URL(`manifests/manifest_${n}-${e}.json`, Ot);
  if (t.origin !== "https://circuitsetup.github.io" || !t.pathname.startsWith("/ESPWebInstaller/manifests/"))
    throw new Error("Invalid firmware manifest URL");
  return t.href;
}
let vs;
const ms = () => vs ??= import("./circuitsetup-energy-meter-helper-install-button-DpSoc-pA.js"), ut = (n, e) => l`
  <p class="firmware-summary">${n.productId} · ESPHome ${n.version}</p>
  <esp-web-install-button class="esp-web-installer" .manifest=${e}>
    <button slot="activate" aria-label="Install firmware">Install firmware</button>
    <p slot="unsupported">Use a supported Chromium browser with Web Serial to install firmware.</p>
    <p slot="not-allowed">Open this helper on HTTPS or localhost to install firmware.</p>
  </esp-web-install-button>
`;
function bs(n) {
  if (!n) return w;
  try {
    const e = _s(n.productId, n.version);
    return customElements.get("esp-web-install-button") ? ut(n, e) : ss(
      ms().then(
        () => ut(n, e),
        () => l`<p role="alert">ESP Web Tools failed to load. Reload Home Assistant and try again.</p>`
      ),
      l`<p role="status">Loading installer…</p>`
    );
  } catch {
    return w;
  }
}
const ft = (n) => n === 0 ? "Main Board" : `Add-on ${n}`, ws = (n) => n === 0 ? ["main_1", "main_2"] : [`addon${n}_1`, `addon${n}_2`];
function ys(n, e, t, i, s, o, r, a, c, p, u, d, h, f, g, _, v, b, I) {
  const R = e?.offset_capability, S = e?.offset_boards ?? [], E = e?.offset_disposition === "completed" || e?.offset_disposition === "skipped" || e?.offset_disposition === "partial" && e.state === "applied_pending_restart_verification", M = S.length > 0 && S.every((C) => C.stages[0]?.state === "completed"), N = S[t]?.stages[i - 1]?.state ?? "not_started", F = !!a?.retry_allowed || N === "partial" || N === "indeterminate", j = R?.status !== "available", T = ws(t), k = new Map(a?.expected_tables ?? []);
  return l`
    <section class="step-content offset-step" aria-labelledby="step-heading">
      ${j ? l`
        <div class="warning-band" role="status">
          <strong>Offset calibration is ${R?.status === "invalid" ? "not safely available" : "not available on this firmware"}.</strong>
          ${R?.status === "invalid" ? l`<p>Repair reason: ${R.repair_reason}</p>` : w}
          <p>Skip preserves the offset values already saved in flash. No clear control is invoked.</p>
        </div>
      ` : l`
        <ol class="offset-stage-stepper" aria-label="Offset calibration stages">
          <li class=${i === 1 ? "active" : M ? "complete" : "pending"}>
            <button data-offset-stage="1" aria-current=${i === 1 ? "step" : w} @click=${() => u(1)}>1. Voltage/current zero offset</button>
          </li>
          <li class=${i === 2 ? "active" : E ? "complete" : "pending"}>
            <button data-offset-stage="2" aria-current=${i === 2 ? "step" : w} ?disabled=${!M}
              @click=${() => u(2)}>2. Active/reactive power offset</button>
          </li>
        </ol>
        <div class="board-tabs" role="tablist" aria-label="Offset calibration boards">
          ${Array.from({ length: n?.board_count ?? S.length }, (C, U) => l`
            <button role="tab" data-offset-board id=${`offset-board-tab-${U}`} aria-controls="offset-board-panel"
              aria-selected=${U === t} tabindex=${U === t ? "0" : "-1"}
              @keydown=${(J) => Ae(J, U)} @click=${() => p(U)}>
              ${ft(U)}
            </button>
          `)}
        </div>
        <div id="offset-board-panel" role="tabpanel" aria-labelledby=${`offset-board-tab-${t}`}>
          <h2>Stage ${i} · ${ft(t)}</h2>
          <div class="warning-band"><strong>Warning:</strong> An open-circuit current-output CT on a live conductor can be hazardous. De-energize conductors before unplugging any CT.</div>
          ${i === 1 ? l`
            <p>First, de-energize all conductors. Then unplug the voltage transformer/AC voltage input and CT inputs, power the meter from USB only, then check that every voltage/current phase reads near zero.</p>
          ` : l`
            <p>Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors, connect/enclose/energize only the voltage reference, then check that voltage is present on both chips and every current phase reads near zero.</p>
          `}
          <p>Measurements cannot prove that a transformer or CT is physically unplugged. Physical acknowledgement never substitutes for measured readiness.</p>
          <label class="check-row"><input type="checkbox" .checked=${s} @change=${(C) => d(C.target.checked)}>
            ${i === 1 ? "I completed the USB-only, de-energized preparation." : "I powered down for rewiring and safely enclosed and energized only the voltage reference."}
          </label>
          <div class="offset-actions">
            <button class="secondary" data-action="check-offset" ?disabled=${c || !s || N === "completed"} @click=${f}>
              ${c ? "Checking measured readiness…" : "Check measured readiness"}
            </button>
            <button class="primary" data-action="calibrate-offset"
              ?disabled=${c || !s || !r?.ready || N === "completed" || F && !o}
              @click=${g}>${a?.retry_allowed ? "Retry unfinished chip" : `Run Stage ${i} calibration`}</button>
          </div>
          ${r ? l`
            <section class="measurement-evidence" aria-label="Offset readiness evidence">
              <h3>Measured readiness</h3>
              <div class=${r.ready ? "success-band" : "warning-band"} role="status" aria-live="polite">
                ${r.ready ? "Measured readiness passed." : "Measured readiness did not pass. Physical acknowledgement is not enough."}
              </div>
              ${r.reasons.length ? l`<ul>${r.reasons.map((C) => l`<li>${C}</li>`)}</ul>` : w}
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
                ${r.entities.map((C) => l`<tr><td>${C.role}</td><td>${C.quantity}</td><td>${C.ready ? "Ready" : C.reasons.join("; ")}</td>
                  <td>${C.window?.mean ?? "—"}</td><td>${C.window?.absolute_peak ?? "—"}</td><td>${C.window?.absolute_spread ?? "—"}</td></tr>`)}
              </tbody></table>
            </section>
          ` : w}
          <section class="measurement-evidence" aria-label="Per-chip offset progress" aria-live="polite">
            <h3>Per-chip progress</h3>
            <table><thead><tr><th>Chip</th><th>State</th><th>Backend evidence</th></tr></thead><tbody>
              ${T.map((C) => l`<tr><td>${C}</td><td>${k.has(C) || N === "completed" ? "Saved; restart verification required." : a?.unfinished_group_keys.includes(C) ? "Unfinished" : N.replaceAll("_", " ")}</td>
                <td>${k.has(C) ? k.get(C).map(([U, J]) => `${U}/${J}`).join(", ") : "—"}</td></tr>`)}
            </tbody></table>
          </section>
          ${F ? l`<aside class="recovery-panel" role="status" aria-live="assertive">
            <strong>${a ? a.state === "partial" ? "One chip finished; recovery is required" : "Calibration outcome is indeterminate" : "Recovery is required"}</strong>
            <p>${a?.error ?? "The prior operation did not finish cleanly"}. Reconnect and inspect before retrying only the unfinished chip.</p>
            <label class="check-row"><input type="checkbox" .checked=${o} @change=${(C) => h(C.target.checked)}> I reviewed the evidence and confirm this retry.</label>
            <button class="secondary" @click=${_}>Reconnect and inspect</button>
          </aside>` : w}
        </div>
      `}
      <footer class="action-footer offset-footer">
        <button class="secondary" @click=${b}>Back</button>
        <button class="secondary" data-action="skip-offset" ?disabled=${c || E} @click=${v}>Skip offset calibration</button>
        <button class="primary" ?disabled=${c || !E} @click=${I}>Continue</button>
      </footer>
    </section>
  `;
}
function $s(n, e, t, i, s, o, r) {
  const a = n.includes("failed") || n.includes("indeterminate"), c = !!(e?.offset_groups?.length || e?.power_offset_groups?.length), p = e?.source_handoff_available ? e.config_filename : c ? "Unavailable; offset calibration remains saved in flash" : "Unavailable in runtime-only mode";
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, voltage/current offsets, power offsets, and entity bindings.</p>
      <div class="status-band" role="status">${i ? "Restarting and verifying…" : n || "Ready for restart verification"}</div>
      ${e ? l`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${p}</dd></div></dl>` : ""}
      ${n === "cancelled" ? l`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${a ? l`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${t ? l`<button class="danger" data-action="rollback" @click=${o}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${r} ?disabled=${i}>Back</button><button class="primary" @click=${s} ?disabled=${i || n === "cancelled" || !!e}>${i ? "Restarting and verifying…" : n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Ss(n) {
  return n ? n.preflight.issues.length ? l`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((e) => l`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : l`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : l`<p>Starting a calibration session…</p>`;
}
function Cs(n, e, t, i, s, o, r = !1) {
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${Ss(n)}
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
        <label class="check-row"><input type="checkbox" .checked=${e} @change=${(a) => t(a.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${s}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" @click=${i} ?disabled=${r || n?.state === "cancelled" || !e || !!n?.preflight.issues.length}>${r ? "Loading calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const gt = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], As = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function _t(n, e, t, i, s, o, r, a, c = "", p = !1, u = l``) {
  return l`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Configure an existing device</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        ${n?.devices.length ? l`<div class="meter-list">
          ${n.devices.map((d) => l`
            <div class="meter-row">
              <span><strong>${d.title}</strong><small>${d.project_name} · ${d.project_version ?? "version unavailable"}</small></span>
              <span>Device Builder: ${d.configuration ? "Yes" : d.importable ? "Yes — import available" : "No"}</span>
              ${d.importable && !d.configuration ? l`<button class="secondary" ?disabled=${!!c}
                @click=${() => a(d.entry_id)}>Import</button>` : ""}
              <button class="primary" data-action="configure-device" ?disabled=${!!c}
                @click=${() => r(d.entry_id)}>${c === `topology:${d.entry_id}` ? "Loading topology…" : "Configure"}</button>
            </div>
          `)}
        </div>` : l`<div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>`}
      </section>
      ${p ? "" : l`<hr />
      <h2>Set up a new device</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (d, h) => l`
            <label class=${h === e ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(h)}
                .checked=${h === e} @change=${() => i(h)} />
              <span>${h}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${gt.map(([d, h]) => l`
            <label class=${d === t ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${d}
                .checked=${d === t} @change=${() => s(d)} />
              <span>${h}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>Add-on boards</dt><dd>${e}</dd></div>
          <div><dt>Connection</dt><dd>${gt.find(([d]) => d === t)?.[1]}</dd></div>
          ${As.slice(0, e).map((d, h) => l`<div><dt>Add-on ${h + 1}</dt><dd>${d}</dd></div>`)}
        </dl>
      </section>
      ${u}
      <p class="info-band">${t === "wifi" ? "Use a USB data cable. ESP Web Tools asks for your Wi-Fi network and password and sends them directly to your meter. This helper does not store or send those credentials to Home Assistant. Complete the ESP Web Tools network setup and Add to Home Assistant when offered." : "Use a USB data cable to install firmware, connect Ethernet and power, wait for an address, complete Add to Home Assistant, then return here. This helper continues when discovery reports your meter."}</p>
      `}
      <button class="rescan" data-action="rescan" ?disabled=${!!c} @click=${o}>${c === "rescan" ? "Rescanning…" : "Rescan for device"}</button>
    </section>
  `;
}
function qt(n, e, t, i, s, o = null, r = !1) {
  return l`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((a) => l`<li>${a.source}: ${a.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([a, c]) => l`<div data-target=${a}>${ze(c)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([a, c]) => l`<div data-target=${a}>${je(c)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${t?.evidence.join(", ") || "No build evidence."}</p><p>${t?.progress.join(", ") || "No transaction progress."}</p>
          ${t?.validation_detail ? l`<p>Validation code ${t.validation_detail.code ?? "unavailable"}; ${t.validation_detail.error_record_count} error records; ${t.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${t?.upload_progress?.length ? l`<ul>${t.upload_progress.map((a) => l`<li>${a.stage}: ${a.percentage ?? a.progress ?? "in progress"}${a.percentage != null || a.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Calibration completion record</h3><p>${o ? `Restart-verified ${o.source_authority.replaceAll("_", " ")} calibration record` : r ? "No-change completion; no restart-verified record was created" : "Not yet established"}</p><p>${o ? `Verification ${o.verification_id}, generation ${o.connection_generation}; ${o.offset_groups?.length ?? 0} voltage/current offset tables; ${o.power_offset_groups?.length ?? 0} power-offset tables.` : r ? "The server confirmed there were no pending gain or offset changes." : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function ks(n, e, t, i, s, o, r, a, c, p) {
  const u = !!(o?.offset_groups?.length || o?.power_offset_groups?.length), d = o?.source_authority === "saved_flash" && o.config_filename && !u && (o.source_handoff_available || o.source_handoff_firmware_installed);
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${o && u ? l`<div class="success-band" role="status">Setup and exact restart verification are complete. Offset calibration remains saved in flash; YAML handoff and flash clearing are unavailable.</div>` : o?.source_authority === "configuration" ? l`<div class="success-band" role="status">Calibration saved to YAML; flash values cleared.</div>` : o ? l`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : r ? l`<div class="success-band" role="status">Completed without calibration changes. No restart or restart-verified calibration record was required.</div>` : l`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${a ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${o?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${o?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${qt(n, e, t, i, s, o, r)}
      <footer class="action-footer"><button class="secondary" @click=${p}>Back</button>
        ${d ? l`<button class="primary" data-action="save-calibration" @click=${c}>${o?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : ""}
      </footer>
    </section>
  `;
}
function Ft(n) {
  const e = n.addon_count, t = n.evidence.map((i) => i.source);
  return e < 0 || e > 6 || n.board_count !== e + 1 || n.ct_count !== 6 * (e + 1) || n.group_count !== 2 * (e + 1) || n.evidence.length < 1 || n.evidence.length > 5 || new Set(t).size !== t.length || !t.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || n.evidence.some((i) => i.addon_count !== e);
}
function Es(n, e, t, i, s = !1, o = !1) {
  const r = s || Ft(n);
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
        <tbody>${n.evidence.map((a) => l`
          <tr><td>${a.source.replaceAll("_", " ")}</td><td>${a.addon_count}</td><td>${a.detail}</td></tr>
        `)}</tbody>
      </table>
      ${r ? l`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : l`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${t}>Back</button>
        ${r ? "" : l`<button class="primary" data-action="continue" ?disabled=${o} @click=${i}>${o ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
function xs(n, e, t, i, s, o, r, a, c, p, u, d, h) {
  const f = n?.voltage_layout === "two_voltages" ? 2 : 1, g = i.slice(0, f).every((S) => Number.isFinite(S) && S > 0), _ = t === 0 ? ["meter_main1", "meter_main2"] : [`addon${t}_1`, `addon${t}_2`], v = new Set(o.flatMap((S) => S.state === "applied_pending_restart_verification" && S.gain_evidence?.flash_saved ? [S.gain_evidence.instance_id] : [])), b = v.size === _.length && _.every((S) => v.has(S)), I = o.find((S) => S.retry_allowed) ?? null, R = t === 0 ? "Main Board" : `Add-on ${t}`;
  return l`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${It(g, s, b ? o[0] ?? null : null)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: n?.board_count ?? 1 }, (S, E) => l`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${E}`} aria-controls="voltage-board-panel"
          aria-selected=${E === t} tabindex=${E === t ? "0" : "-1"}
          @keydown=${(M) => Ae(M, E)}
          @click=${() => a(E)}>${E === 0 ? "Main Board" : `Add-on ${E}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${t}`}>
      <h2>Calibrate Voltage</h2>
      ${Rt(e, _, "Voltage", v)}
      <div class="reference-block">
        ${Array.from({ length: f }, (S, E) => l`<label>${f === 1 ? "Trusted instrument reference" : `Voltage ${E + 1} trusted reference`}
          <input type="number" min="0.01" step="0.01" .value=${i[E] ? String(i[E]) : ""}
            @input=${(M) => c(E, Number(M.target.value))} /></label>`)}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${p} ?disabled=${r}>${r ? "Loading live voltage data…" : "Check stability"}</button>
        <button class="primary" @click=${u} ?disabled=${r || !g || !s?.stable || b || !!(o.length && !I)}>${I ? "Retry voltage calibration" : "Calibrate voltage"}</button></div>
      ${s ? l`<div class=${s.stable ? "success-band" : "warning-band"} role="status">${s.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${ze(s)}
      ${b ? l`<div class="success-band" role="status">Voltage calibration complete for ${R}.</div>` : ""}
      ${o.map((S) => je(S))}
      ${o.some((S) => S.state === "indeterminate") ? l`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${d}>Reconnect and inspect</button><button class="danger" @click=${h}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Is = Lt`
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
  .calibration-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: 18px 0 10px; }
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
  .action-footer.offset-footer { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; }
  .offset-footer > :first-child { justify-self: start; }
  .offset-footer > :last-child { justify-self: end; }
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
    .offset-step { padding-bottom: 84px; }
    .identity-strip, .confirmation-actions, .group-nav { align-items: stretch; flex-direction: column; }
    .evidence-table { display: block; overflow-x: auto; }
  }
`, oe = [
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
class Rs extends ce {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.firmwareIndex = null, this.firmwareCatalogState = "idle", this.firmwareCatalogError = "", this.selectedEspHomeVersion = null, this.resolvedFirmwareOptions = [], this.firmwareFetchController = null, this.setupDeviceIds = /* @__PURE__ */ new Set(), this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.sessionStarting = !1, this.pendingAction = "", this.voltageBusy = !1, this.offsetBusy = !1, this.finishBusy = !1, this.restartBusy = !1, this.voltageSkipped = !1, this.currentSkipped = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = Is;
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
    this.transactionUnsub = null, this.sessionUnsub = null, this.api = null, this.firmwareFetchController?.abort(), this.firmwareFetchController = null, this.firmwareIndex = null, this.firmwareCatalogState = "idle", this.firmwareCatalogError = "", this.resolvedFirmwareOptions = [], this.setupDeviceIds = /* @__PURE__ */ new Set(), super.disconnectedCallback();
  }
  updated(e) {
    (e.has("hass") || e.has("panel")) && this.isConnected && this.ensureApi(this.connectionGeneration), this.error ? this.shadowRoot?.querySelector("[role=alert]")?.focus() : this.focusHeading && (this.focusHeading = !1, this.shadowRoot?.querySelector("#step-heading")?.focus());
  }
  async ensureApi(e) {
    if (this.api || !this.isConnected || !this.hass || !this.panel?.config.entry_id) return;
    const t = new ye(this.hass, this.panel.config.entry_id);
    this.api = t;
    try {
      const i = await t.setupStatus();
      if (!this.owns(e, t)) return;
      this.setup = i, this.setupDeviceIds = new Set(i.devices.map((o) => o.entry_id));
      const s = this.setup.installer_intent;
      s && (this.addonCount = s.addon_count, this.connection = s.connection_type, this.refreshFirmwareOptions()), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.firstDeviceId(this.setup.devices)), await this.ownSubscription(t.subscribeSetup((o) => {
        if (!this.owns(e, t)) return;
        const r = o.devices.filter((a) => !this.setupDeviceIds.has(a.entry_id)).sort((a, c) => a.entry_id.localeCompare(c.entry_id));
        this.setup = o, this.setupDeviceIds = new Set(o.devices.map((a) => a.entry_id)), this.step === "setup" && r.length && (this.selectDevice(r[0].entry_id), this.navigate("discover"), this.announcement = "CircuitSetup energy meter discovered."), this.requestUpdate();
      }), e, t), this.transaction && await this.subscribeTransaction(e), this.session && this.session.state !== "cancelled" && await this.subscribeSession(e);
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
  loadFirmwareIndex() {
    if (this.firmwareCatalogState === "loading" || this.firmwareIndex) return;
    const e = this.connectionGeneration, t = new AbortController();
    this.firmwareFetchController?.abort(), this.firmwareFetchController = t, this.firmwareCatalogState = "loading", this.firmwareCatalogError = "", this.requestUpdate(), hs(globalThis.fetch, t.signal).then((i) => {
      this.ownsFirmwareCatalog(e, t) && (this.firmwareIndex = i, this.firmwareFetchController = null, this.firmwareCatalogState = "ready", this.refreshFirmwareOptions());
    }).catch(() => {
      this.ownsFirmwareCatalog(e, t) && (this.firmwareFetchController = null, this.firmwareCatalogState = "error", this.firmwareCatalogError = "Firmware catalog could not be loaded.", this.requestUpdate());
    });
  }
  refreshFirmwareOptions() {
    const e = this.firmwareIndex ? fs(this.firmwareIndex, this.addonCount, this.connection) : [], t = this.selectedEspHomeVersion, i = gs(e, t);
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
    this.safetyAcknowledged = !1, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.finishBusy = !1, this.restartBusy = !1, this.voltageSkipped = !1, this.currentSkipped = !1;
  }
  selectDevice(e) {
    ++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = e, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.board = 0, this.resetCalibrationRun();
  }
  firstDeviceId(e) {
    return e.map((t) => t.entry_id).sort((t, i) => t.localeCompare(i))[0] ?? null;
  }
  showTopology(e) {
    this.topology = e, this.navigate("topology"), this.error = Ft(e) || e.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
  }
  showInventory(e) {
    this.inventory = e, this.drafts = new Map(e.channels.map((t) => {
      const i = t.selected_model_id ?? "", s = e.catalog.presets.find((o) => o.model_id === i);
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
    this.step === "topology" ? (this.selectDevice(null), this.navigate("setup")) : this.step === "ct" ? this.navigate("topology") : this.step === "safety" ? this.cancelSession("ct") : this.step === "offset" ? this.navigate("safety") : this.step === "voltage" ? this.navigate("offset") : this.step === "current" ? this.navigate("voltage") : this.step === "restart" ? this.navigate("current") : this.step === "build" ? this.navigate(this.calibrationHandoff ? "restart" : "ct") : this.step === "summary" && this.navigate("build");
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
    const e = this.api, t = this.selectedDeviceId, i = ++this.operationGeneration;
    await this.run(async () => {
      if (await e.setInstallerIntent(this.addonCount, this.connection, this.selectedFirmware()), !this.ownsOperation(i, e, t)) return;
      const s = await e.rescan();
      if (!this.ownsOperation(i, e, t)) return;
      const o = this.step === "discover" && this.selectedDeviceId !== null && s.devices.length === this.setupDeviceIds.size && s.devices.some((r) => r.entry_id === this.selectedDeviceId) && s.devices.every((r) => this.setupDeviceIds.has(r.entry_id));
      this.setup = s, this.setupDeviceIds = new Set(s.devices.map((r) => r.entry_id)), s.devices.length && !o ? (this.selectDevice(this.firstDeviceId(s.devices)), this.navigate("discover"), this.announcement = "CircuitSetup energy meter discovered.") : s.devices.length || (this.announcement = "No compatible meter found. Check the network and rescan.");
    }, "Rescan failed.", () => this.ownsOperation(i, e, t)), this.pendingAction = "", this.requestUpdate();
  }
  async adopt(e = this.selectedDeviceId) {
    if (!this.api || !e) return;
    e !== this.selectedDeviceId && this.selectDevice(e);
    const t = this.api, i = ++this.operationGeneration;
    await this.run(async () => {
      await t.adoptDevice(e), this.ownsOperation(i, t, e) && (this.announcement = "Meter adopted in Device Builder.");
    }, "Adoption is unavailable for this meter.", () => this.ownsOperation(i, t, e));
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
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
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
    const o = await e.getCtInventory(t);
    this.ownsOperation(i, e, t) && (this.clearSubscription("transaction"), this.transaction = null, this.showInventory(o), this.drafts = new Map(Array.from(this.drafts, ([r, a]) => [r, s.get(r) ?? a])), this.announcement = "Live CT data reloaded. Review the preserved changes again.");
  }
  updateDraft(e, t) {
    const i = this.drafts.get(e);
    i && (this.drafts = new Map(this.drafts).set(e, { ...i, ...t }), this.requestUpdate());
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    const e = te(this.inventory, this.drafts);
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
          const a = await t.getCtInventory(i);
          if (!this.ownsOperation(o, t, i)) return;
          r = await t.previewCtConfig(
            i,
            a.plan_id,
            a.source_sha256,
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
  async continueFromCt() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || this.pendingAction) return;
    const e = te(this.inventory, this.drafts);
    if (this.labelOnly && e.length) {
      const t = e.map(({ channel: a, name: c }) => ({ channel: a, name: c })), i = this.api, s = this.selectedDeviceId, o = this.inventory, r = ++this.operationGeneration;
      if (this.pendingAction = "session", this.requestUpdate(), await this.run(async () => {
        await i.setHaLabels(s, o.plan_id, o.source_sha256, t), this.ownsOperation(r, i, s) && (this.inventory = { ...o, channels: o.channels.map((a) => {
          const c = t.find((p) => p.channel === a.channel);
          return c ? { ...a, name: c.name } : a;
        }) }, this.announcement = "Home Assistant labels saved.");
      }, "Home Assistant labels could not be saved.", () => this.ownsOperation(r, i, s)), this.pendingAction = "", this.error) return;
    }
    await this.startSession();
  }
  async reviewCalibrationHandoff() {
    if (!this.api || !this.session || !this.restartResult?.source_handoff_available) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.restartResult.verification_id, o = ++this.operationGeneration;
    this.clearSubscription("transaction"), this.transaction = null, await this.run(
      async () => {
        const r = this.inventory && !this.labelOnly ? te(this.inventory, this.drafts) : [], a = await e.previewCalibratedGains(i, s, r);
        !this.ownsOperation(o, e, t) || this.session?.session_id !== i || this.restartResult?.verification_id !== s || (this.calibrationHandoff = !0, this.transaction = a, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "Calibration gains could not be prepared for YAML review.",
      () => this.ownsOperation(o, e, t)
    );
  }
  async clearCalibrationHandoff() {
    const e = this.restartResult;
    if (!this.api || !this.session || !this.topology || !e?.source_handoff_firmware_installed || !e.source_handoff_transaction_id) return;
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration;
    await this.run(
      async () => {
        const r = await t.clearCalibrationFlash(
          s,
          e.verification_id,
          e.source_handoff_transaction_id,
          this.topology
        );
        !this.ownsOperation(o, t, i) || this.session?.session_id !== s || (this.restartResult = r, this.announcement = "Calibration saved to YAML; flash values cleared.", this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash."));
      },
      "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values.",
      () => this.ownsOperation(o, t, i)
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
        if (!(!this.ownsOperation(o, t, i) || this.transaction?.transaction_id !== s.transaction_id || this.transaction.source_sha256 !== s.source_sha256))
          if (this.transaction = a, this.announcement = `Configuration ${this.transaction.state}.`, e === "install" && this.calibrationHandoff && a.state === "verified" && this.session && this.topology && this.restartResult) {
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
            if (!this.ownsOperation(o, t, i)) return;
            this.restartResult = c, this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash.");
          } else e === "install" && a.state === "verified" && this.finishFlow("Configuration changes were installed and verified.");
      },
      e === "install" && this.calibrationHandoff ? "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values." : "This confirmation is stale. Reload the CT inventory before making another change.",
      () => this.ownsOperation(o, t, i)
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
          const o = await e.startSession(t);
          !this.ownsOperation(i, e, t) || o.device_id !== t || (this.session = o, this.navigate("safety"), await this.subscribeSession(this.connectionGeneration));
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
    if (!this.api || !this.session || this.pendingAction) return;
    this.pendingAction = "safety", this.requestUpdate();
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = ++this.operationGeneration;
    await this.run(async () => {
      const o = await e.acknowledgeSafety(i);
      !this.ownsOperation(s, e, t) || o.session_id !== i || (this.session = o, this.navigate("offset"));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(s, e, t)), this.pendingAction = "", this.requestUpdate();
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
    if (this.offsetAcknowledged[o - 1] !== !0 || p && !this.offsetRetryConfirmed) return;
    const u = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const d = await e.calibrateOffset(i, s, o, !0, p);
          if (!this.ownsOperation(u, e, t) || this.session?.session_id !== i) return;
          this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(r, d);
          const h = (this.session.offset_boards ?? []).map((_) => _.board_index !== s ? _ : {
            ..._,
            stages: _.stages.map((v) => v.stage !== o ? v : {
              ...v,
              state: d.state === "applied_pending_restart_verification" ? "completed" : d.state
            })
          }), f = h.flatMap((_) => _.stages.map((v) => v.state)), g = f.every((_) => _ === "completed") ? "completed" : f.some((_) => _ === "partial" || _ === "indeterminate") ? "partial" : "in_progress";
          this.session = {
            ...this.session,
            offset_boards: h,
            offset_disposition: g,
            has_pending_calibration: this.session.has_pending_calibration || d.expected_tables.length > 0
          }, this.offsetAcknowledged = this.offsetAcknowledged.map((_, v) => v === o - 1 ? !1 : _), this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget), this.offsetReadinessByTarget.delete(r), this.offsetRetryConfirmed = !1, this.announcement = d.state === "applied_pending_restart_verification" ? `Board ${s + 1} Stage ${o} saved; restart verification required.` : `Board ${s + 1} Stage ${o} requires recovery before retry.`;
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
    if (this.inventory && !this.labelOnly && te(this.inventory, this.drafts).length) {
      await this.finishWithoutCalibration();
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
          if (e === "voltage") {
            const a = await t.checkVoltageStability(s, r);
            if (!this.ownsOperation(o, t, i) || this.session?.session_id !== s) return;
            const c = new Map(this.stabilityByTarget);
            a.forEach((p) => c.set(`voltage:${p.target_id}`, p)), this.stabilityByTarget = c, this.announcement = "Loaded voltage data from both chips on this board.";
            return;
          }
          for (const [a, c] of r.entries()) {
            const p = await t.checkStability(s, e, c);
            if (!this.ownsOperation(o, t, i) || this.session?.session_id !== s) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${c}`, p), a < r.length - 1 && this.requestUpdate();
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
          if (e === "voltage") {
            const u = await t.calibrateVoltage(s, r.map((h, f) => ({
              group_key: h,
              reference: this.voltageReferences[this.topology?.voltage_layout === "two_voltages" ? f : 0]
            })), !0);
            if (!this.ownsOperation(o, t, i) || this.session?.session_id !== s) return;
            const d = new Map(this.calibrationByTarget);
            u.forEach((h) => d.set(`voltage:${h.group_key}`, h)), this.calibrationByTarget = d, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = "Calibrated both voltage chips on this board.";
            return;
          }
          const c = await t.calibrateCurrent(
            s,
            a,
            !0,
            this.inventory && !this.labelOnly ? te(this.inventory, this.drafts).map((u) => ({
              channel: u.channel,
              reporting_multiplier: u.reporting_multiplier ?? 1
            })) : []
          );
          if (!this.ownsOperation(o, t, i) || this.session?.session_id !== s) return;
          const p = new Map(this.calibrationByTarget);
          a.forEach((u) => p.set(`current:${u.channel}`, c)), this.calibrationByTarget = p, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = `Calibration iteration ${c.iteration} finished with state ${c.state}.`;
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
      const i = this.currentReferences.get(t), s = this.drafts.get(t)?.multiplier ?? this.inventory?.channels[t - 1]?.reporting_multiplier ?? this.reportingMultiplier;
      return i && i > 0 && s !== null ? [{ channel: t, reference: i, reporting_multiplier: s }] : [];
    });
  }
  async restart() {
    if (!this.api || !this.session || !this.topology || this.restartBusy) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.topology, o = ++this.operationGeneration;
    this.restartResult = null, this.restartBusy = !0, this.announcement = "Restarting the meter and verifying restored calibration values.", this.requestUpdate();
    try {
      await this.run(
        async () => {
          let a;
          try {
            a = await e.restartAndVerify(i, s);
          } catch (c) {
            throw this.ownsOperation(o, e, t) && this.session?.session_id === i && this.topology === s && (this.restartResult = null, this.session = { ...this.session, state: "restart_failed" }), c;
          }
          !this.ownsOperation(o, e, t) || this.session?.session_id !== i || this.topology !== s || (this.restartResult = a, this.completedWithoutChanges = !1, this.session = { ...this.session, state: "verified" });
        },
        "Restart verification failed; review recovery evidence before rollback.",
        () => this.ownsOperation(o, e, t)
      );
    } finally {
      this.restartBusy = !1, this.requestUpdate();
    }
    this.restartResult?.source_handoff_available && await this.reviewCalibrationHandoff();
  }
  async cancelSession(e = "safety") {
    if (!this.api || !this.session) return;
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration;
    await this.run(async () => {
      const r = await t.cancelSession(s);
      !this.ownsOperation(o, t, i) || this.session?.session_id !== s || (this.clearSubscription("session"), this.session = r, this.restartResult = null, e && this.navigate(e), this.announcement = e === "setup" ? "No changes were made. Select another device to configure." : e === "ct" ? "Calibration session closed. Review CT names and types before continuing." : "Calibration session cancelled; cleanup completed without restart verification.");
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(o, t, i));
  }
  async finishWithoutCalibration() {
    if (this.pendingAction) return;
    this.pendingAction = "finish", this.requestUpdate();
    const e = this.inventory && !this.labelOnly ? te(this.inventory, this.drafts) : [];
    try {
      if (await this.cancelSession(null), this.error) return;
      e.length ? await this.reviewChanges() : this.finishFlow("No changes were made. Select another device to configure.");
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
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
    return [...this.calibrationByTarget.entries()].some(([t, i]) => t.startsWith(`${e}:`) && i.state === "applied_pending_restart_verification");
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
    return this.step === "setup" ? _t(
      this.setup,
      this.addonCount,
      this.connection,
      (e) => {
        this.addonCount = e, this.refreshFirmwareOptions();
      },
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
      !1,
      this.firmwareCatalog()
    ) : this.step === "discover" ? _t(
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
      (e) => {
        this.configureDevice(e);
      },
      (e) => {
        this.adopt(e);
      },
      this.pendingAction,
      !0
    ) : this.step === "topology" && this.topology ? Es(
      this.topology,
      this.selectedProjectVersion(),
      () => this.back(),
      () => {
        this.setup?.devices.find((e) => e.entry_id === this.selectedDeviceId)?.configuration ? this.loadInventory() : this.startSession();
      },
      this.error === "Topology mismatch",
      this.pendingAction === "inventory" || this.pendingAction === "session"
    ) : this.step === "ct" && this.inventory ? l`<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
      this.labelOnly = !1, this.requestUpdate();
    }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
      this.labelOnly = !0, this.requestUpdate();
    }}>Home Assistant labels only</label></fieldset>${Hi(
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
      this.pendingAction === "session"
    )}` : this.step === "build" ? Fi(
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
    ) : this.step === "safety" ? Cs(
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
    ) : this.step === "offset" ? ys(
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
    ) : this.step === "voltage" ? l`${xs(
      this.topology,
      this.session,
      this.board,
      this.voltageReferences,
      this.stabilityFor("voltage"),
      this.voltageResultsForBoard(),
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
      <footer class="action-footer offset-footer"><button class="secondary" @click=${() => this.back()}>Back</button>
        <button class="secondary" ?disabled=${this.voltageBusy || this.voltageSkipped} @click=${() => {
      this.voltageSkipped = !0, this.announcement = "Remaining voltage calibration was skipped; completed gains were preserved.", this.requestUpdate();
    }}>Skip voltage calibration</button>
        <button class="primary" ?disabled=${this.voltageBusy || !this.voltageSkipped && !this.hasCompletedCalibration("voltage")} @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? l`${Gi(
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
    }}>${this.finishBusy ? "Finishing…" : "Continue"}</button></footer>` : this.step === "restart" ? $s(
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
    ) : this.step === "summary" ? ks(
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
    ) : l`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct" ? "CT settings are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }
  firmwareCatalog() {
    const e = this.firmwareCatalogState === "loading";
    return l`<section class="step-content" aria-labelledby="firmware-heading">
      <h2 id="firmware-heading">Install firmware</h2>
      <label>ESPHome firmware version
        <select data-action="firmware-version" ?disabled=${e || this.firmwareCatalogState !== "ready" || !this.resolvedFirmwareOptions.length}
          @change=${(t) => this.selectFirmwareVersion(t.target.value)}>
          ${this.resolvedFirmwareOptions.map((t, i) => l`<option value=${t.version} ?selected=${t.version === this.selectedEspHomeVersion}>${t.version}${i === 0 ? " (newest)" : ""}</option>`)}
        </select>
      </label>
      ${this.firmwareCatalogState === "error" ? l`<div class="error-panel" role="status">
        <strong>${this.firmwareCatalogError}</strong>
        <button class="secondary" data-action="firmware-retry" @click=${() => this.retryFirmwareIndex()}>Retry</button>
      </div>` : w}
      ${e ? l`<p role="status">Loading firmware versions…</p>` : w}
      ${this.firmwareCatalogState === "ready" && !this.resolvedFirmwareOptions.length ? l`<p role="status">No firmware version is available for this hardware.</p>` : w}
      ${this.firmwareCatalogState === "ready" ? bs(this.selectedFirmware()) : w}
    </section>`;
  }
  render() {
    const e = oe.findIndex(([t]) => t === this.step);
    return l`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${oe.map(([t, i], s) => l`
            <li class=${s === e ? "current" : ""}>
              <button class="step-button" aria-current=${s === e ? "step" : w}
                ?disabled=${s > e || s < e && t !== "setup"}
                @click=${() => t === "setup" && s < e ? this.returnToSetup() : void 0}><span class="number">${s + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${e + 1} of ${oe.length} — ${oe[e]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${oe[e]?.[1]}</h1>
          ${this.error ? l`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : w}
          ${this.stepBody()}
          ${e >= 4 && !["voltage", "current", "summary"].includes(this.step) ? qt(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : w}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", Rs);
export {
  Rs as CircuitSetupPanel
};
