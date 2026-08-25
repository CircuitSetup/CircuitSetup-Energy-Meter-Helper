const be = globalThis, Ue = be.ShadowRoot && (be.ShadyCSS === void 0 || be.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, qe = /* @__PURE__ */ Symbol(), We = /* @__PURE__ */ new WeakMap();
let mt = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== qe) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Ue && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = We.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && We.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Wt = (n) => new mt(typeof n == "string" ? n : n + "", void 0, qe), Kt = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, s, r) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[r + 1], n[0]);
  return new mt(t, n, qe);
}, Yt = (n, e) => {
  if (Ue) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = be.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, n.appendChild(i);
  }
}, Ke = Ue ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return Wt(t);
})(n) : n;
const { is: Zt, defineProperty: Xt, getOwnPropertyDescriptor: Jt, getOwnPropertyNames: Qt, getOwnPropertySymbols: ei, getPrototypeOf: ti } = Object, ke = globalThis, Ye = ke.trustedTypes, ii = Ye ? Ye.emptyScript : "", si = ke.reactiveElementPolyfillSupport, ce = (n, e) => n, Te = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? ii : null;
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
} }, bt = (n, e) => !Zt(n, e), Ze = { attribute: !0, type: String, converter: Te, reflect: !1, useDefault: !1, hasChanged: bt };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), ke.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let se = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Ze) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && Xt(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: r } = Jt(this.prototype, e) ?? { get() {
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
    return this.elementProperties.get(e) ?? Ze;
  }
  static _$Ei() {
    if (this.hasOwnProperty(ce("elementProperties"))) return;
    const e = ti(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(ce("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(ce("properties"))) {
      const t = this.properties, i = [...Qt(t), ...ei(t)];
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
      for (const s of i) t.unshift(Ke(s));
    } else e !== void 0 && t.push(Ke(e));
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
    return Yt(e, this.constructor.elementStyles), e;
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
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : Te).toAttribute(t, i.type);
      this._$Em = e, r == null ? this.removeAttribute(s) : this.setAttribute(s, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, s = i._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const r = i.getPropertyOptions(s), o = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : Te;
      this._$Em = s;
      const a = o.fromAttribute(t, r.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, r) {
    if (e !== void 0) {
      const o = this.constructor;
      if (s === !1 && (r = this[e]), i ??= o.getPropertyOptions(e), !((i.hasChanged ?? bt)(r, t) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, i)))) return;
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
se.elementStyles = [], se.shadowRootOptions = { mode: "open" }, se[ce("elementProperties")] = /* @__PURE__ */ new Map(), se[ce("finalized")] = /* @__PURE__ */ new Map(), si?.({ ReactiveElement: se }), (ke.reactiveElementVersions ??= []).push("2.1.2");
const Be = globalThis, Xe = (n) => n, we = Be.trustedTypes, Je = we ? we.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, wt = "$lit$", V = `lit$${Math.random().toFixed(9).slice(2)}$`, yt = "?" + V, ni = `<${yt}>`, J = document, he = () => J.createComment(""), pe = (n) => n === null || typeof n != "object" && typeof n != "function", De = Array.isArray, ri = (n) => De(n) || typeof n?.[Symbol.iterator] == "function", Re = `[\x20\t
\f\r]`, re = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Qe = /-->/g, et = />/g, Y = RegExp(`>|${Re}(?:([^\\s"'>=/]+)(${Re}*=${Re}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), tt = /'/g, it = /"/g, $t = /^(?:script|style|textarea|title)$/i, oi = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), l = oi(1), W = /* @__PURE__ */ Symbol.for("lit-noChange"), S = /* @__PURE__ */ Symbol.for("lit-nothing"), st = /* @__PURE__ */ new WeakMap(), X = J.createTreeWalker(J, 129);
function St(n, e) {
  if (!De(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Je !== void 0 ? Je.createHTML(e) : e;
}
const ai = (n, e) => {
  const t = n.length - 1, i = [];
  let s, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = re;
  for (let a = 0; a < t; a++) {
    const c = n[a];
    let h, u, d = -1, p = 0;
    for (; p < c.length && (o.lastIndex = p, u = o.exec(c), u !== null); ) p = o.lastIndex, o === re ? u[1] === "!--" ? o = Qe : u[1] !== void 0 ? o = et : u[2] !== void 0 ? ($t.test(u[2]) && (s = RegExp("</" + u[2], "g")), o = Y) : u[3] !== void 0 && (o = Y) : o === Y ? u[0] === ">" ? (o = s ?? re, d = -1) : u[1] === void 0 ? d = -2 : (d = o.lastIndex - u[2].length, h = u[1], o = u[3] === void 0 ? Y : u[3] === '"' ? it : tt) : o === it || o === tt ? o = Y : o === Qe || o === et ? o = re : (o = Y, s = void 0);
    const g = o === Y && n[a + 1].startsWith("/>") ? " " : "";
    r += o === re ? c + ni : d >= 0 ? (i.push(h), c.slice(0, d) + wt + c.slice(d) + V + g) : c + V + (d === -2 ? a : g);
  }
  return [St(n, r + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class ue {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let r = 0, o = 0;
    const a = e.length - 1, c = this.parts, [h, u] = ai(e, t);
    if (this.el = ue.createElement(h, i), X.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = X.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(wt)) {
          const p = u[o++], g = s.getAttribute(d).split(V), f = /([.?@])?(.*)/.exec(p);
          c.push({ type: 1, index: r, name: f[2], strings: g, ctor: f[1] === "." ? di : f[1] === "?" ? li : f[1] === "@" ? hi : Ce }), s.removeAttribute(d);
        } else d.startsWith(V) && (c.push({ type: 6, index: r }), s.removeAttribute(d));
        if ($t.test(s.tagName)) {
          const d = s.textContent.split(V), p = d.length - 1;
          if (p > 0) {
            s.textContent = we ? we.emptyScript : "";
            for (let g = 0; g < p; g++) s.append(d[g], he()), X.nextNode(), c.push({ type: 2, index: ++r });
            s.append(d[p], he());
          }
        }
      } else if (s.nodeType === 8) if (s.data === yt) c.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(V, d + 1)) !== -1; ) c.push({ type: 7, index: r }), d += V.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const i = J.createElement("template");
    return i.innerHTML = e, i;
  }
}
function ne(n, e, t = n, i) {
  if (e === W) return e;
  let s = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const r = pe(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== r && (s?._$AO?.(!1), r === void 0 ? s = void 0 : (s = new r(n), s._$AT(n, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = s : t._$Cl = s), s !== void 0 && (e = ne(n, s._$AS(n, e.values), s, i)), e;
}
class ci {
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
    X.currentNode = s;
    let r = X.nextNode(), o = 0, a = 0, c = i[0];
    for (; c !== void 0; ) {
      if (o === c.index) {
        let h;
        c.type === 2 ? h = new fe(r, r.nextSibling, this, e) : c.type === 1 ? h = new c.ctor(r, c.name, c.strings, this, e) : c.type === 6 && (h = new pi(r, this, e)), this._$AV.push(h), c = i[++a];
      }
      o !== c?.index && (r = X.nextNode(), o++);
    }
    return X.currentNode = J, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class fe {
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
    e = ne(this, e, t), pe(e) ? e === S || e == null || e === "" ? (this._$AH !== S && this._$AR(), this._$AH = S) : e !== this._$AH && e !== W && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ri(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== S && pe(this._$AH) ? this._$AA.nextSibling.data = e : this.T(J.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = ue.createElement(St(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const r = new ci(s, this), o = r.u(this.options);
      r.p(t), this.T(o), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = st.get(e.strings);
    return t === void 0 && st.set(e.strings, t = new ue(e)), t;
  }
  k(e) {
    De(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const r of e) s === t.length ? t.push(i = new fe(this.O(he()), this.O(he()), this, this.options)) : i = t[s], i._$AI(r), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = Xe(e).nextSibling;
      Xe(e).remove(), e = i;
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
  constructor(e, t, i, s, r) {
    this.type = 1, this._$AH = S, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = S;
  }
  _$AI(e, t = this, i, s) {
    const r = this.strings;
    let o = !1;
    if (r === void 0) e = ne(this, e, t, 0), o = !pe(e) || e !== this._$AH && e !== W, o && (this._$AH = e);
    else {
      const a = e;
      let c, h;
      for (e = r[0], c = 0; c < r.length - 1; c++) h = ne(this, a[i + c], t, c), h === W && (h = this._$AH[c]), o ||= !pe(h) || h !== this._$AH[c], h === S ? e = S : e !== S && (e += (h ?? "") + r[c + 1]), this._$AH[c] = h;
    }
    o && !s && this.j(e);
  }
  j(e) {
    e === S ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class di extends Ce {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === S ? void 0 : e;
  }
}
class li extends Ce {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== S);
  }
}
class hi extends Ce {
  constructor(e, t, i, s, r) {
    super(e, t, i, s, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = ne(this, e, t, 0) ?? S) === W) return;
    const i = this._$AH, s = e === S && i !== S || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== S && (i === S || s);
    s && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class pi {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    ne(this, e);
  }
}
const ui = Be.litHtmlPolyfillSupport;
ui?.(ue, fe), (Be.litHtmlVersions ??= []).push("3.3.3");
const fi = (n, e, t) => {
  const i = t?.renderBefore ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const r = t?.renderBefore ?? null;
    i._$litPart$ = s = new fe(e.insertBefore(he(), r), r, void 0, t ?? {});
  }
  return s._$AI(n), s;
};
const Ne = globalThis;
let de = class extends se {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = fi(t, this.renderRoot, this.renderOptions);
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
de._$litElement$ = !0, de.finalized = !0, Ne.litElementHydrateSupport?.({ LitElement: de });
const gi = Ne.litElementPolyfillSupport;
gi?.({ LitElement: de });
(Ne.litElementVersions ??= []).push("4.2.2");
const nt = "circuitsetup_energy_meter_helper/", vi = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, _i = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, mi = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, bi = /[\u0000-\u001f\u007f-\u009f]/, wi = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), yi = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), $i = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "partial", "indeterminate", "verified", "cancelled"]), ze = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), kt = /* @__PURE__ */ new Set(["split_phase_120_240", "single_phase_230", "three_phase", "custom"]), rt = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), ye = /* @__PURE__ */ new Set(["A", "B", "C"]), Si = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), ki = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), Ci = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), Ai = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), xi = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), Ei = /^(?:meter|voltage_reference|channel|aggregate|package)\.[a-z0-9_.-]+$/, Ii = /^[0-9a-f]{12}$/, Ri = /^[0-9a-f]{64}$/, ot = /^[0-9a-f]{32}$/, Oi = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, Ct = /^[a-z0-9][a-z0-9_-]{0,127}$/, At = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, at = /* @__PURE__ */ new Set(["preview_ct_config", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]), Ti = /* @__PURE__ */ new Set(["available", "unavailable", "invalid"]), Mi = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial"]), Pi = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial", "indeterminate"]), Ui = /* @__PURE__ */ new Set(["applied_pending_restart_verification", "partial", "indeterminate"]);
function $(n, e) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function C(n, e, t = 100) {
  if (!Array.isArray(n) || n.length > t) throw new Error(`${e} response is invalid`);
  return n;
}
function b(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${e} response is invalid`);
  return n;
}
function T(n, e) {
  if (typeof n != "number" || !Number.isFinite(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function k(n, e) {
  const t = T(n, e);
  if (!Number.isInteger(t)) throw new Error(`${e} response is invalid`);
  return t;
}
function q(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "boolean") throw new Error(`${e} response is invalid`);
  return n;
}
function M(n, e, t) {
  const i = b(n, t);
  if (!e.has(i)) throw new Error(`${t} response is invalid`);
  return i;
}
function Me(n, e) {
  n !== void 0 && b(n, e, !0);
}
function F(n, e) {
  return Math.abs(n - e) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(e));
}
function H(n, e, t) {
  const i = Object.keys(n);
  if (i.length !== e.length || i.some((s) => !e.includes(s))) throw new Error(`${t} response is invalid`);
}
function _e(n, e) {
  return n.length === e.length && n.every((t, i) => t === e[i]);
}
function xt(n, e) {
  const t = $(n, e);
  b(t.entry_id, e), b(t.title, e), b(t.project_name, e), b(t.project_version, e, !0), q(t.importable, e, !0), b(t.configuration, e, !0);
}
function me(n, e) {
  const t = $(n, e);
  if (M(t.state, wi, e), C(t.devices, e).forEach((i) => xt(i, e)), t.configuration_authoritative !== void 0 && q(t.configuration_authoritative, e), t.bound_device_id !== void 0 && t.bound_device_id !== null && b(t.bound_device_id, e), t.installer_intent !== void 0) {
    const i = $(t.installer_intent, e), s = k(i.addon_count, e);
    if (s < 0 || s > 6) throw new Error(`${e} response is invalid`);
    if (M(i.connection_type, ze, e) === "unknown") throw new Error(`${e} response is invalid`);
    if (i.power_quality === void 0 != (i.status_fields === void 0))
      throw new Error(`${e} response is invalid`);
    i.power_quality !== void 0 && Et(i, e, s + 1);
    const o = i.firmware_product_id, a = i.esphome_version;
    if (o === void 0 != (a === void 0) || o !== void 0 && (typeof o != "string" || o.length > 160 || !Ct.test(o)) || a !== void 0 && (typeof a != "string" || a.length > 160 || !At.test(a)))
      throw new Error(`${e} response is invalid`);
    if (i.electrical_system === void 0 != (i.line_frequency_hz === void 0) || i.electrical_system !== void 0 && (!kt.has(i.electrical_system) || ![50, 60].includes(k(i.line_frequency_hz, e))))
      throw new Error(`${e} response is invalid`);
  }
  return n;
}
function ct(n, e) {
  const t = $(n, e), i = k(t.addon_count, e), s = k(t.board_count, e), r = k(t.ct_count, e), o = k(t.group_count, e);
  if (i < 0 || i > 6 || s < 1 || s > 7 || r < 6 || r > 42 || o < 2 || o > 14 || s !== i + 1 || r !== 6 * s || o !== 2 * s) throw new Error(`${e} response is invalid`);
  M(t.connection_type, ze, e), b(t.voltage_layout, e), b(t.project_name, e);
  const a = C(t.evidence, e);
  if (a.length < 1 || a.length > rt.size) throw new Error(`${e} response is invalid`);
  const c = a.map((h) => {
    const u = $(h, e), d = M(u.source, rt, e), p = k(u.addon_count, e);
    if (p < 0 || p > 6) throw new Error(`${e} response is invalid`);
    return b(u.detail, e), d;
  });
  if (new Set(c).size !== c.length || !c.some((h) => xi.has(h))) throw new Error(`${e} response is invalid`);
  return n;
}
function qi(n, e) {
  const t = $(n, e);
  if ("topology" in t) {
    const i = ct(t.topology, e);
    return t.configuration_authoritative !== void 0 && q(t.configuration_authoritative, e), t.package_options !== void 0 && Et(t.package_options, e, i.board_count), n;
  }
  return ct(n, e);
}
function Bi(n, e) {
  const t = $(n, e), i = $(t.configuration, e), s = $(i.meter, e), r = M(s.electrical_system, kt, e), o = k(s.line_frequency_hz, e);
  if (o !== 50 && o !== 60) throw new Error(`${e} response is invalid`);
  const a = k(s.update_interval_s, e), c = C(s.voltage_references, e, 14).map((u) => {
    const d = $(u, e), p = b(d.reference_id, e), g = d.label === void 0 ? p : b(d.label, e), f = C(d.group_keys, e, 14).map((v) => b(v, e));
    if (!f.length) throw new Error(`${e} response is invalid`);
    return { reference_id: p, label: g, group_keys: f };
  });
  if (!c.length || new Set(c.map((u) => u.reference_id)).size !== c.length)
    throw new Error(`${e} response is invalid`);
  const h = C(t.warnings, e, 32).map((u) => b(u, e));
  return {
    electrical_system: r,
    line_frequency_hz: o,
    authoritative: !0,
    update_interval_s: a,
    voltage_references: c,
    warnings: h
  };
}
function Et(n, e, t) {
  const i = $(n, e);
  for (const s of ["power_quality", "status_fields"]) {
    const r = C(i[s], e, 7);
    if (r.length !== t) throw new Error(`${e} response is invalid`);
    r.forEach((o) => q(o, e));
  }
  return n;
}
function Di(n, e) {
  const t = $(n, e);
  b(t.plan_id, e), b(t.source_sha256, e);
  const i = C(t.channels, e);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${e} response is invalid`);
  i.forEach((o, a) => {
    const c = $(o, e), h = k(c.channel, e);
    b(c.name, e), k(c.raw_gain_ct, e), T(c.reporting_multiplier, e), Me(c.selected_model_id, e), q(c.selection_verified_against_config, e), Me(c.display_label, e);
    const u = $(c.address, e), d = k(u.channel, e), p = k(u.board_index, e), g = k(u.group_index, e), f = M(u.phase, ye, e), v = a + 1;
    if (h !== v || d !== v || p !== Math.floor(a / 6) || g !== Math.floor(a % 6 / 3) || f !== ["A", "B", "C"][a % 3]) throw new Error(`${e} response is invalid`);
  });
  const s = $(t.catalog, e);
  b(s.source_repository, e), b(s.source_ref, e), k(s.schema_version, e);
  const r = C(s.presets, e);
  if (r.length > 64) throw new Error(`${e} response is invalid`);
  return r.forEach((o) => {
    const a = $(o, e);
    b(a.model_id, e), b(a.label, e), T(a.rated_current_a, e), b(a.secondary, e), a.default_gain_ct !== null && k(a.default_gain_ct, e), q(a.requires_burden_jumper_cut, e), b(a.notes, e);
  }), n;
}
function ae(n, e) {
  const t = $(n, e);
  if (b(t.transaction_id, e), M(t.state, yi, e), b(t.source_sha256, e), q(t.rollback_available, e), b(t.redacted_diff, e), C(t.changes, e).forEach((i) => {
    const s = $(i, e), r = b(s.key, e);
    if (!Ei.test(r)) throw new Error(`${e} response is invalid`);
    s.old_value !== null && b(s.old_value, e), b(s.new_value, e);
  }), C(t.evidence, e).forEach((i) => M(i, ki, e)), C(t.progress, e).forEach((i) => M(i, Ci, e)), t.validation_detail != null) {
    const i = $(t.validation_detail, e);
    for (const s of ["reported_error_count", "reported_warning_count"]) i[s] !== null && k(i[s], e);
    i.code !== null && k(i.code, e), k(i.error_record_count, e), k(i.warning_record_count, e);
  }
  return t.upload_progress !== void 0 && C(t.upload_progress, e).forEach((i) => {
    const s = $(i, e);
    if (M(s.stage, Si, e), s.progress !== null && s.percentage !== null && s.progress !== void 0 && s.percentage !== void 0) throw new Error(`${e} response is invalid`);
    const r = s.progress ?? s.percentage;
    if (r != null) {
      const o = k(r, e);
      if (o < 0 || o > 100) throw new Error(`${e} response is invalid`);
    }
  }), n;
}
function L(n, e) {
  const t = $(n, e);
  b(t.session_id, e), b(t.device_id, e), M(t.state, $i, e), q(t.safety_acknowledged, e);
  const i = $(t.preflight, e);
  C(i.issues, e).forEach((d) => {
    const p = $(d, e);
    M(p.code, Ai, e), b(p.role, e), b(p.detail, e);
  }), C(i.zeroed_roles, e).forEach((d) => b(d, e)), t.entity_role_counts !== void 0 && Object.values($(t.entity_role_counts, e)).forEach((d) => {
    if (k(d, e) < 0) throw new Error(`${e} response is invalid`);
  }), t.calibration_sources !== void 0 && Object.values($(t.calibration_sources, e)).forEach((d) => M(d, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), e));
  const s = [t.offset_capability, t.offset_disposition, t.offset_boards, t.has_pending_calibration];
  if (s.every((d) => d === void 0)) return n;
  if (s.some((d) => d === void 0)) throw new Error(`${e} response is invalid`);
  const r = $(t.offset_capability, e);
  if (H(r, ["status", "repair_reason"], e), M(r.status, Ti, e) === "invalid") b(r.repair_reason, e);
  else if (r.repair_reason !== null) throw new Error(`${e} response is invalid`);
  const a = M(t.offset_disposition, Mi, e), c = C(t.offset_boards, e, 7);
  if (c.length < 1) throw new Error(`${e} response is invalid`);
  const h = [];
  c.forEach((d, p) => {
    const g = $(d, e);
    if (H(g, ["board_index", "stages"], e), k(g.board_index, e) !== p) throw new Error(`${e} response is invalid`);
    const f = C(g.stages, e, 2);
    if (f.length !== 2) throw new Error(`${e} response is invalid`);
    f.forEach((v, _) => {
      const w = $(v, e);
      if (H(w, ["stage", "state"], e), k(w.stage, e) !== _ + 1) throw new Error(`${e} response is invalid`);
      h.push(M(w.state, Pi, e));
    });
  });
  const u = h.every((d) => d === "skipped") ? "skipped" : h.every((d) => d === "completed") ? "completed" : h.every((d) => d === "not_started") ? "not_started" : h.some((d) => d === "partial" || d === "indeterminate") || h.some((d) => d === "skipped") ? "partial" : "in_progress";
  if (a !== u) throw new Error(`${e} response is invalid`);
  return q(t.has_pending_calibration, e), n;
}
function Ni(n, e, t, i) {
  const s = $(n, e);
  if (H(s, ["stage", "ready", "connection_generation", "entities", "reasons", "thresholds"], e), k(s.stage, e) !== i || t < 0 || t > 6) throw new Error(`${e} response is invalid`);
  const r = q(s.ready, e), o = k(s.connection_generation, e);
  if (o < 1) throw new Error(`${e} response is invalid`);
  const a = $(s.thresholds, e);
  H(a, ["sample_count", "zero_voltage_peak_volts", "zero_voltage_spread_volts", "zero_current_peak_amps", "zero_current_spread_amps", "voltage_present_minimum_volts", "voltage_present_spread_volts"], e);
  const c = k(a.sample_count, e), h = T(a.zero_voltage_peak_volts, e), u = T(a.zero_voltage_spread_volts, e), d = T(a.zero_current_peak_amps, e), p = T(a.zero_current_spread_amps, e), g = T(a.voltage_present_minimum_volts, e), f = T(a.voltage_present_spread_volts, e), v = [
    h,
    u,
    d,
    p,
    g,
    f
  ];
  if (c < 3 || c > 100 || v.some((O) => O < 0) || v[4] === 0) throw new Error(`${e} response is invalid`);
  const _ = C(s.entities, e, 12);
  if (_.length !== 12) throw new Error(`${e} response is invalid`);
  const w = /* @__PURE__ */ new Map();
  for (const O of [0, 1]) {
    const A = t === 0 ? `main_${O + 1}` : `addon${t}_${O + 1}`;
    for (const U of ["a", "b", "c"]) w.set(`${A}.voltage_${U}`, "voltage");
    for (let U = 1; U <= 3; ++U) w.set(`ct${t * 6 + O * 3 + U}.current_sensor`, "current");
  }
  const E = "entity binding is not on the active connection generation", I = "fresh window unavailable: ", m = /* @__PURE__ */ new Set(), y = [];
  let x = 0;
  _.forEach((O) => {
    const A = $(O, e);
    H(A, ["role", "quantity", "ready", "reasons", "window"], e);
    const U = b(A.role, e), Q = M(A.quantity, /* @__PURE__ */ new Set(["voltage", "current"]), e);
    if (m.has(U) || w.get(U) !== Q) throw new Error(`${e} response is invalid`);
    m.add(U);
    const Ge = q(A.ready, e), ee = C(A.reasons, e, 12).map((B) => b(B, e));
    let D;
    if (A.window === null) {
      if (Ge || ee.length !== 1) throw new Error(`${e} response is invalid`);
      if (ee[0] === E) ++x;
      else if (!ee[0].startsWith(I) || ee[0].slice(I.length).trim().length === 0)
        throw new Error(`${e} response is invalid`);
      D = ee;
    } else {
      const B = $(A.window, e);
      H(B, ["values", "received_at", "connection_generation", "mean", "minimum", "maximum", "absolute_peak", "absolute_spread"], e);
      const te = C(B.values, e, c).map((K) => T(K, e)), xe = C(B.received_at, e, c).map((K) => T(K, e)), Lt = T(B.mean, e), Ee = T(B.minimum, e), Ve = T(B.maximum, e), Ie = T(B.absolute_peak, e), ge = T(B.absolute_spread, e), Gt = te.reduce((K, ve) => K + ve, 0) / te.length, Vt = k(B.connection_generation, e);
      if (te.length !== c || xe.length !== c || xe.some((K, ve) => ve > 0 && K <= xe[ve - 1]) || !F(Lt, Gt) || !F(Ee, Math.min(...te)) || !F(Ve, Math.max(...te)) || !F(Ie, Math.max(...te.map(Math.abs))) || !F(ge, Ve - Ee)) throw new Error(`${e} response is invalid`);
      D = [], Vt !== o ? D.push("window is from another connection generation") : Q === "current" ? (Ie > d && D.push("absolute peak exceeds zero_current_peak_amps"), ge > p && D.push("absolute spread exceeds zero_current_spread_amps")) : i === 1 ? (Ie > h && D.push("absolute peak exceeds zero_voltage_peak_volts"), ge > u && D.push("absolute spread exceeds zero_voltage_spread_volts")) : (Ee < g && D.push("minimum is below voltage_present_minimum_volts"), ge > f && D.push("absolute spread exceeds voltage_present_spread_volts"));
    }
    if (!_e(ee, D) || Ge !== (D.length === 0)) throw new Error(`${e} response is invalid`);
    y.push(...D.map((B) => `${U}: ${B}`));
  });
  const P = C(s.reasons, e, 100).map((O) => b(O, e)), z = [...y, "connection generation changed while collecting readiness"], R = x === _.length && _e(P, [E]) || x === 0 && (_e(P, y) || _e(P, z));
  if (m.size !== w.size || !R || r !== (P.length === 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function It(n, e) {
  const t = C(n, e, 3);
  if (t.length !== 3) throw new Error(`${e} response is invalid`);
  return t.forEach((i) => {
    const s = C(i, e, 2);
    if (s.length !== 2 || s.some((r) => {
      const o = k(r, e);
      return o < -32768 || o > 32767;
    })) throw new Error(`${e} response is invalid`);
  }), n;
}
function zi(n, e, t, i) {
  const s = $(n, e);
  H(s, ["state", "board_index", "stage", "expected_tables", "unfinished_group_keys", "retry_allowed", "error"], e);
  const r = M(s.state, Ui, e);
  if (k(s.board_index, e) !== t || k(s.stage, e) !== i) throw new Error(`${e} response is invalid`);
  const o = t === 0 ? ["main_1", "main_2"] : [`addon${t}_1`, `addon${t}_2`], a = C(s.expected_tables, e, 2).map((d) => {
    const p = C(d, e, 2);
    if (p.length !== 2) throw new Error(`${e} response is invalid`);
    const g = b(p[0], e);
    if (!o.includes(g)) throw new Error(`${e} response is invalid`);
    return It(p[1], e), g;
  }), c = C(s.unfinished_group_keys, e, 2).map((d) => b(d, e)), h = [...a, ...c], u = q(s.retry_allowed, e);
  if (h.length !== 2 || new Set(h).size !== 2 || h.some((d) => !o.includes(d))) throw new Error(`${e} response is invalid`);
  if (r === "applied_pending_restart_verification") {
    if (a.length !== 2 || c.length !== 0 || u || s.error !== null) throw new Error(`${e} response is invalid`);
  } else if (b(s.error, e), !u || a.length !== (r === "partial" ? 1 : 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function Fi(n, e, t, i) {
  const s = $(n, e), r = M(s.target, /* @__PURE__ */ new Set(["voltage", "current"]), e);
  b(s.target_id, e);
  const o = q(s.stable, e);
  if (r !== t || s.target_id !== i) throw new Error(`${e} response is invalid`);
  const a = C(s.windows, e, r === "voltage" ? 42 : 1);
  if (r === "voltage" ? a.length < 3 || a.length % 3 !== 0 : a.length !== 1) throw new Error(`${e} response is invalid`);
  const c = a.map((h) => {
    const u = $(h, e), d = C(u.samples, e, 1).map((E) => T(E, e));
    if (d.length !== 1) throw new Error(`${e} response is invalid`);
    const p = T(u.mean, e), g = T(u.standard_deviation, e), f = T(u.range_percent, e), v = d.reduce((E, I) => E + I, 0) / d.length, _ = Math.sqrt(d.reduce((E, I) => E + (I - v) ** 2, 0) / d.length), w = 100 * (Math.max(...d) - Math.min(...d)) / Math.abs(v);
    if (!F(p, v) || !F(g, _) || !F(f, w)) throw new Error(`${e} response is invalid`);
    return f;
  });
  if (o !== c.every((h) => h <= 1)) throw new Error(`${e} response is invalid`);
  return n;
}
function dt(n, e, t) {
  const i = $(n, e), s = M(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e);
  b(i.group_key, e), i.phase !== null && M(i.phase, ye, e);
  const r = k(i.iteration, e), o = C(i.changed_channels, e, 3).map((f) => k(f, e)), a = C(i.before_values, e, 3), c = C(i.after_values, e, 3), h = C(i.error_percent_values, e, 3);
  for (const f of [a, c, h]) f.forEach((v) => T(v, e));
  const u = t.target === "voltage" ? t.groupKey : Fe(t.references[0].channel), d = t.target === "voltage" ? ji(t.groupKey) : t.references.map((f) => f.channel), p = t.target === "current" && t.references.length === 1 ? ["A", "B", "C"][(t.references[0].channel - 1) % 3] : null, g = q(i.retry_allowed, e);
  if (t.target === "voltage" && (!Number.isFinite(t.reference) || t.reference <= 0) || t.target === "current" && t.references.some((f) => !Number.isFinite(f.reference) || f.reference <= 0 || !Number.isFinite(f.rawReference) || f.rawReference <= 0) || ![1, 2, 3].includes(o.length) || s !== "indeterminate" && a.length !== o.length || new Set(o).size !== o.length || o.some((f) => f < 1 || f > 42) || r < 1 || r > 3 || i.group_key !== u || i.phase !== p || o.length !== d.length || o.some((f, v) => f !== d[v]) || (s === "indeterminate" ? c.length !== 0 || h.length !== 0 : c.length !== o.length || h.length !== o.length)) throw new Error(`${e} response is invalid`);
  if (s === "indeterminate") {
    if (i.gain_evidence !== null || g) throw new Error(`${e} response is invalid`);
    i.restore_evidence != null && $(i.restore_evidence, e);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${e} response is invalid`);
    Hi(i.gain_evidence, e, t);
    const f = t.target === "voltage" ? c.map(() => t.reference) : t.references.map((w) => w.reference), v = c.map((w, E) => 100 * Math.abs(T(w, e) - f[E]) / f[E]);
    if (h.some((w, E) => T(w, e) < 0 || !F(T(w, e), v[E]))) throw new Error(`${e} response is invalid`);
    const _ = Math.max(...v) > 1;
    if (s === "result_outside_tolerance" !== _ || g !== (_ && r < 3)) throw new Error(`${e} response is invalid`);
  }
  return n;
}
function Fe(n) {
  const e = Math.floor((n - 1) / 6), t = Math.floor((n - 1) % 6 / 3) + 1;
  return e === 0 ? `main_${t}` : `addon${e}_${t}`;
}
function Hi(n, e, t) {
  const i = $(n, e), s = k(i.connection_generation, e), r = k(i.operation_sequence, e), o = t.target === "voltage" ? t.groupKey : Fe(t.references[0].channel), a = o.startsWith("main_") ? `meter_main${o.slice(-1)}` : o;
  if (s < 1 || r < 1 || b(i.instance_id, e) !== a) throw new Error(`${e} response is invalid`);
  const c = t.target === "current" ? new Map(t.references.map((p) => [["A", "B", "C"][(p.channel - 1) % 3], p.rawReference])) : /* @__PURE__ */ new Map(), h = C(i.phases, e, 3);
  if (h.length !== 3) throw new Error(`${e} response is invalid`);
  h.forEach((p, g) => {
    const f = $(p, e), v = M(f.phase, ye, e);
    if (v !== ["A", "B", "C"][g]) throw new Error(`${e} response is invalid`);
    T(f.measured_voltage, e), T(f.measured_current, e);
    const _ = T(f.reference_voltage, e), w = T(f.reference_current, e), E = k(f.old_voltage_gain, e), I = k(f.new_voltage_gain, e), m = k(f.old_current_gain, e), y = k(f.new_current_gain, e);
    if ([E, I, m, y].some((x) => x < 1 || x > 65535)) throw new Error(`${e} response is invalid`);
    if (t.target === "voltage") {
      if (Math.abs(_ - t.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(_), t.reference)) || Math.abs(w) > 1e-6 || m !== y) throw new Error(`${e} response is invalid`);
    } else {
      const x = c.get(v);
      if (Math.abs(_) > 1e-6 || (x === void 0 ? Math.abs(w) > 1e-6 : Math.abs(w - x) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(w), x))) || E !== I || x === void 0 && m !== y) throw new Error(`${e} response is invalid`);
    }
  });
  const u = C(i.register_mismatch_phases, e, 3);
  u.forEach((p) => M(p, ye, e));
  const d = C(i.matching_lines, e, 100);
  if (d.length === 0 || d.some((p) => typeof p != "string") || q(i.flash_saved, e) !== !0 || u.length !== 0 || q(i.calibration_disabled, e) !== !1) throw new Error(`${e} response is invalid`);
}
function ji(n) {
  const e = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(n);
  if (!e) return [];
  const t = e[2] === void 0 ? 0 : Number(e[2]), i = Number(e[1] ?? e[3]), s = t * 6 + (i - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}
function Pe(n, e, t) {
  const i = $(n, e);
  for (const f of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) b(i[f], e);
  const s = k(i.topology_addon_count, e);
  M(i.topology_connection_type, ze, e);
  const r = k(i.connection_generation, e), o = M(i.source_authority, /* @__PURE__ */ new Set(["saved_flash", "configuration"]), e), a = q(i.source_handoff_available, e), c = q(i.source_handoff_firmware_installed, e);
  Me(i.source_handoff_transaction_id, e);
  const h = i.config_filename !== null || i.config_sha256 !== null;
  if (h && (b(i.config_filename, e), b(i.config_sha256, e), !Oi.test(i.config_filename) || !Ri.test(i.config_sha256)))
    throw new Error(`${e} response is invalid`);
  if (i.config_filename === null != (i.config_sha256 === null)) throw new Error(`${e} response is invalid`);
  if (!Ii.test(i.mac) || !ot.test(i.verification_id) || r < 1 || i.source_handoff_transaction_id !== null && !ot.test(i.source_handoff_transaction_id) || s !== t.addon_count || i.topology_project_name !== t.project_name || i.topology_connection_type !== t.connection_type || i.topology_voltage_layout !== t.voltage_layout) throw new Error(`${e} response is invalid`);
  const u = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: s }, (f, v) => [`addon${v + 1}_1`, `addon${v + 1}_2`]).flat()]), d = (f, v, _) => {
    const w = C(i[f] ?? [], e, 14), E = /* @__PURE__ */ new Set();
    return w.forEach((I) => {
      const m = $(I, e);
      H(m, ["instance_id", v], e);
      const y = b(m.instance_id, e);
      if (!u.has(y) || E.has(y)) throw new Error(`${e} response is invalid`);
      if (E.add(y), _) It(m[v], e);
      else {
        const x = C(m[v], e, 3);
        if (x.length !== 3) throw new Error(`${e} response is invalid`);
        x.forEach((P) => {
          const z = C(P, e, 2);
          if (z.length !== 2 || z.some((j) => {
            const R = k(j, e);
            return R < 1 || R > 65535;
          })) throw new Error(`${e} response is invalid`);
        });
      }
    }), w.length;
  }, p = d("groups", "phase_gains", !1), g = d("offset_groups", "phase_offsets", !0) + d("power_offset_groups", "phase_power_offsets", !0);
  if (p + g < 1 || a && (!h || c || i.source_handoff_transaction_id !== null || o !== "saved_flash" || g > 0) || !a && h && i.source_handoff_transaction_id === null && g === 0 || c && (!h || i.source_handoff_transaction_id === null || g > 0) || o === "configuration" && (!c || a || g > 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function Li(n, e, t) {
  const i = $(n, e);
  return i.session !== null && L(i.session, e), i.transaction !== null && ae(i.transaction, e), i.verified_calibration !== null && Pe(i.verified_calibration, e, t), n;
}
class $e {
  constructor(e, t) {
    this.hass = e, this.entryId = t, this.setupStatus = () => this.call("setup_status", (i) => me(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (C(i, "list_meters").forEach((s) => xt(s, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (s) => qi(s, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (s) => Di(s, "get_ct_inventory"), { device_id: i }), this.getMeterConfiguration = (i) => this.call("get_meter_configuration", (s) => Bi(s, "get_meter_configuration"), { device_id: i }), this.getActiveWork = (i, s) => this.call("get_active_work", (r) => Li(r, "get_active_work", s), { device_id: i }), this.getSession = (i) => this.call("get_session", (s) => L(s, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => $(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, s, r, o, a, c) => this.call("set_installer_intent", (h) => me(h, "set_installer_intent"), {
      addon_count: i,
      connection_type: s,
      ...o ?? {},
      ...r && r.productId.length <= 160 && r.version.length <= 160 && Ct.test(r.productId) && At.test(r.version) ? { firmware_product_id: r.productId, esphome_version: r.version } : {},
      ...a != null && c !== null && c !== void 0 ? { electrical_system: a, line_frequency_hz: c } : {}
    }), this.rescan = () => this.call("rescan", (i) => me(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (s) => {
      const r = $(s, "adopt_device");
      return b(r.device_id, "adopt_device"), b(r.configuration, "adopt_device"), s;
    }, { device_id: i }), this.previewCtConfig = (i, s, r, o, a) => this.call("preview_ct_config", (c) => ae(c, "preview_ct_config"), {
      device_id: i,
      plan_id: s,
      source_sha256: r,
      changes: o,
      ...a ? { package_options: a } : {}
    }), this.setHaLabels = (i, s, r, o) => this.call("set_ha_labels", (a) => a, {
      device_id: i,
      plan_id: s,
      source_sha256: r,
      changes: o
    }), this.transaction = (i, s, r, o) => this.call(i, (a) => ae(a, i), {
      device_id: s,
      transaction_id: r,
      source_sha256: o
    }), this.applyCtConfig = (i, s, r) => this.transaction("apply_ct_config", i, s, r), this.compileCtConfig = (i, s, r) => this.transaction("compile_ct_config", i, s, r), this.installCtConfig = (i, s, r) => this.transaction("install_ct_config", i, s, r), this.rollbackCtConfig = (i, s, r) => this.transaction("rollback_ct_config", i, s, r), this.startSession = (i) => this.call("start_session", (s) => L(s, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (s) => L(s, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, r) => this.call("check_stability", (o) => Fi(o, "check_stability", s, r), { session_id: i, target: s, target_id: r }), this.checkOffsetReadiness = (i, s, r) => this.call("check_offset_readiness", (o) => Ni(o, "check_offset_readiness", s, r), {
      session_id: i,
      board_index: s,
      stage: r
    }), this.calibrateOffset = (i, s, r, o, a) => this.call("calibrate_offset", (c) => zi(c, "calibrate_offset", s, r), {
      session_id: i,
      board_index: s,
      stage: r,
      preparation_acknowledged: o,
      confirm_retry: a
    }), this.skipOffsetCalibration = (i) => this.call("skip_offset_calibration", (s) => L(s, "skip_offset_calibration"), { session_id: i }), this.calibrateVoltage = (i, s, r, o) => !s || !Number.isFinite(r) || r < 1 || r > 600 ? Promise.reject(new Error("calibrate_voltage reference is invalid")) : this.call("calibrate_voltage", (a) => C(a, "calibrate_voltage", 14).map((c) => dt(c, "calibrate_voltage", {
      target: "voltage",
      groupKey: b($(c, "calibrate_voltage").group_key, "calibrate_voltage"),
      reference: r
    })), { session_id: i, reference_id: s, reference_voltage: r, confirm_iteration: o }), this.calibrateCurrent = (i, s, r, o = []) => s.length < 1 || s.length > 3 || new Set(s.map((a) => a.channel)).size !== s.length || new Set(s.map((a) => Fe(a.channel))).size !== 1 || s.some((a) => !Number.isInteger(a.channel) || a.channel < 1 || a.channel > 42 || !Number.isFinite(a.reference) || a.reference <= 0 || ![1, 2, 4, 8].includes(a.reporting_multiplier)) || o.some((a) => ![1, 2, 4, 8].includes(a.reporting_multiplier)) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (a) => dt(a, "calibrate_current", {
      target: "current",
      references: s.map((c) => ({ channel: c.channel, reference: c.reference, rawReference: c.reference / c.reporting_multiplier }))
    }), {
      session_id: i,
      references: s,
      confirm_iteration: r,
      pending_multipliers: o
    }), this.restartAndVerify = (i, s) => this.call("restart_and_verify", (r) => Pe(r, "restart_and_verify", s), { session_id: i }), this.completeCalibrationWithoutChanges = (i) => this.call("complete_calibration_without_changes", (s) => {
      const r = L(s, "complete_calibration_without_changes");
      if (r.session_id !== i || r.state !== "verified" || r.has_pending_calibration !== !1)
        throw new Error("complete_calibration_without_changes response is invalid");
      return r;
    }, { session_id: i }), this.previewCalibratedGains = (i, s, r = [], o) => this.call("preview_calibrated_gains", (a) => ae(a, "preview_calibrated_gains"), {
      session_id: i,
      verification_id: s,
      changes: r,
      ...o ? { package_options: o } : {}
    }), this.clearCalibrationFlash = (i, s, r, o) => this.call("clear_calibration_flash", (a) => Pe(a, "clear_calibration_flash", o), {
      session_id: i,
      verification_id: s,
      transaction_id: r
    }), this.cancelSession = (i) => this.call("cancel_session", (s) => L(s, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (s) => me(s, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, s, r, o) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: s,
      source_sha256: r
    }, (a) => ae(a, "subscribe_config_transaction"), o), this.subscribeSession = (i, s) => this.subscribe("subscribe_session", { session_id: i }, (r) => L(r, "subscribe_session"), s);
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
      if (e.length > a || mi.test(e) || _i.test(e) || o && s !== "redacted_diff" || s === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${s || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [o, a] of Object.entries(e)) {
        if (o.length > 256 || bi.test(o)) throw new Error("unsafe property name refused");
        if (o.toLowerCase() === "key" && !r) throw new Error(`private field ${o} refused`);
        if (o.toLowerCase() !== "raw_gain_ct" && vi.test(o))
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
      type: `${nt}${e}`,
      entry_id: this.entryId,
      ...i
    });
    return $e.assertPublicPayload(s, at.has(e)), t(s);
  }
  subscribe(e, t, i, s) {
    return this.hass.connection.subscribeMessage((r) => {
      $e.assertPublicPayload(r, at.has(e)), s(i(r));
    }, { type: `${nt}${e}`, entry_id: this.entryId, ...t });
  }
}
function Gi(n) {
  const e = (n?.redacted_diff || "No reviewed configuration changes yet.").split(`
`);
  return l`
    <section class="review-region" aria-labelledby="review-heading">
      <h2 id="review-heading">Review changes</h2>
      <p class="warning-band">Firmware configuration changes can alter Home Assistant rename/entity-key bindings. Review every change before Apply.</p>
      <pre class="config-diff" aria-label="Redacted substitution diff"><code>${e.map((t, i) => l`<span class=${`diff-line ${t.startsWith("+") ? "added" : t.startsWith("-") ? "removed" : "context"}`}>${t}</span>${i < e.length - 1 ? `
` : ""}`)}</code></pre>
      <dl class="status-list">
        <div><dt>Validation</dt><dd>${n?.state === "validated" || n?.progress.includes("config_validated") ? "Validated" : "Pending"}</dd></div>
        <div><dt>Compile</dt><dd>${n?.state === "compiled" || n?.progress.includes("firmware_compiled") ? "Compiled" : "Pending"}</dd></div>
        <div><dt>Install</dt><dd>${n?.state === "install_confirmation_required" ? "Confirmation required" : n?.state ?? "Pending"}</dd></div>
      </dl>
    </section>
  `;
}
function Vi(n, e, t, i, s, r, o) {
  const a = n?.state ?? "previewed", c = a === "rolled_back" && n?.evidence.includes("validation_failed");
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${Gi(n)}
      ${a === "failed" ? l`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${n?.evidence.join(", ") || "The operation did not complete."}</p>
          ${n?.rollback_available ? l`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      ${c ? l`<div class="recovery-panel" role="status"><strong>ESPHome rejected the config (code ${n?.validation_detail?.code ?? "unavailable"})</strong><p>The original config was restored. Review the config changes and open ESPHome Device Builder logs for the exact validation error.</p></div>` : ""}
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
      ${n?.upload_progress?.length ? l`<ul class="upload-progress">${n.upload_progress.map((h) => l`
        <li>${h.stage}: ${h.percentage ?? h.progress ?? "in progress"}${h.percentage != null || h.progress != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" data-action="continue" @click=${o} ?disabled=${a !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const Ae = (n, e) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(n.key)) return;
  n.preventDefault();
  const i = [...n.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], s = n.key === "ArrowRight" || n.key === "ArrowDown", r = n.key === "Home" ? 0 : n.key === "End" ? i.length - 1 : (e + (s ? 1 : i.length - 1)) % i.length;
  i[r]?.click(), i[r]?.focus();
}, Rt = (n, e, t) => (n?.default_gain_ct ?? t) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((n?.default_gain_ct ?? t) / e);
function Wi(n, e, t, i, s, r, o, a = !1, c = !1) {
  const h = Math.ceil(n.channels.length / 6), u = n.channels.filter((d) => d.address.board_index === e).slice(0, 8);
  return l`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: h }, (d, p) => l`
          <button role="tab" id=${`board-tab-${p}`} data-board-tab=${p} aria-selected=${p === e}
            aria-controls="board-panel" tabindex=${p === e ? "0" : "-1"}
            @keydown=${(g) => Ae(g, p)}
            @click=${() => i(p)}>${p === 0 ? "Main Board" : `Add-on ${p}`}</button>
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
    const p = t.get(d.channel) ?? {
      name: d.name,
      modelId: d.selected_model_id ?? "",
      multiplier: d.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, g = n.catalog.presets.find((_) => _.model_id === p.modelId), f = Rt(g, p.multiplier, p.modelId === "custom" ? p.customGainCt : void 0), v = He(d, p);
    return l`
              <div class="ct-row" data-ct-row data-ct-group=${d.address.group_index} role="row" aria-rowindex=${d.channel + 1} aria-label=${`CT${d.channel}`}>
                <strong class="ct-index" role="cell">CT${d.channel}</strong>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${d.channel} name`} .value=${p.name}
                  @input=${(_) => s(d.channel, { name: _.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${d.channel} model`} ?disabled=${a}
                  @change=${(_) => {
      const w = _.target.value, E = n.catalog.presets.find((I) => I.model_id === w);
      s(d.channel, {
        modelId: w,
        burdenAcknowledged: d.selection_verified_against_config && w === d.selected_model_id && (w === "custom" || E?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${p.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((_) => l`<option value=${_.model_id} ?selected=${p.modelId === _.model_id}>${_.label}</option>`)}
                  <option value="custom" ?selected=${p.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${d.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><select aria-label=${`CT${d.channel} multiplier`} ?disabled=${a}
                  @change=${(_) => s(d.channel, { multiplier: Number(_.target.value) })}>
                  ${[1, 2, 4, 8].map((_) => l`<option value=${_} ?selected=${p.multiplier === _}>${_}</option>`)}
                </select></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${f ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${g?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${p.expanded} @click=${() => s(d.channel, { expanded: !p.expanded })}>
                  ${p.modelId ? v ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${p.modelId === "custom" ? l`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${d.channel} custom gain`}
                  ?disabled=${a}
                  .value=${p.customGainCt === void 0 ? "" : String(p.customGainCt)}
                  @input=${(_) => s(d.channel, { customGainCt: Number(_.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${d.channel} custom label`} ?disabled=${a} .value=${p.customLabel ?? ""}
                  @input=${(_) => s(d.channel, { customLabel: _.target.value })} /></label>
              </div>` : S}
              ${p.modelId === "custom" || g?.requires_burden_jumper_cut ? l`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${d.channel} burden output acknowledgement`}
                  ?disabled=${a}
                  .checked=${p.burdenAcknowledged}
                  @change=${(_) => s(d.channel, { burdenAcknowledged: _.target.checked })} />
                  I checked the burden-output requirement for CT${d.channel}</label>
              </div>` : S}
              ${g && g.rated_current_a > 65.535 && p.multiplier === 1 ? l`<div class="warning-band" role="status">CT${d.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : S}
              ${p.expanded && g ? l`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${g.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${g.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${g.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${g.notes || (g.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : S}
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${u[0]?.channel ?? 0}–${u.at(-1)?.channel ?? 0} of ${n.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${c || !Yi(n, t, a)} @click=${o}>${c ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
function ie(n, e) {
  return n.channels.flatMap((t) => {
    const i = e.get(t.channel);
    if (!i || !He(t, i)) return [];
    const s = n.catalog.presets.find((o) => o.model_id === i.modelId), r = { channel: t.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (r.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (r.custom_label = i.customLabel.trim()), r.burden_output_acknowledged = i.burdenAcknowledged) : s?.requires_burden_jumper_cut && (r.burden_output_acknowledged = i.burdenAcknowledged), [r];
  });
}
function He(n, e) {
  return e.name !== n.name || e.modelId !== (n.selected_model_id ?? "") || e.multiplier !== n.reporting_multiplier || e.modelId === "custom" && (Rt(void 0, e.multiplier, e.customGainCt) !== n.raw_gain_ct || (e.customLabel?.trim() ?? "") !== (n.display_label ?? ""));
}
function Ki(n, e) {
  if (!e.name.trim() || !e.modelId || ![1, 2, 4, 8].includes(e.multiplier)) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const t = n.catalog.presets.find((i) => i.model_id === e.modelId);
  return !!t && (!t?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function Yi(n, e, t = !1) {
  if (t) return [...e].every(([i, s]) => {
    const r = n.channels.find((o) => o.channel === i);
    return !!r && !!s.name.trim() && s.modelId === (r.selected_model_id ?? "") && s.multiplier === r.reporting_multiplier;
  });
  for (const i of n.channels) {
    const s = e.get(i.channel);
    if (!s || He(i, s) && !Ki(n, s))
      return !1;
  }
  return !0;
}
const G = (n) => n.toFixed(2);
function Ot(n, e, t) {
  const i = [n, !!e?.stable, !!t, !!t?.gain_evidence, !!t], s = i.findIndex((o) => !o);
  return l`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((o, a) => l`<li
    class=${i[a] ? "complete" : a === s ? "active" : "pending"}><span
      class="progress-number">${a + 1}</span><span>${o}</span></li>`)}</ol>`;
}
function Tt(n, e, t, i) {
  const s = Object.entries(n?.calibration_sources ?? {}).filter(([r]) => e.includes(r));
  return l`<section class="measurement-evidence calibration-source" aria-label=${`${t} calibration source`}>
    <h3>Active gain source</h3>
    ${s.length ? l`<table><thead><tr><th>Chip</th><th>Active gain source</th><th>${t} calibrated this session</th></tr></thead><tbody>
      ${s.map(([r, o]) => l`<tr><td>${r}</td><td>${o === "flash" ? "Saved flash" : o === "configuration" ? "Configuration" : "Unknown"}</td><td>${i.has(r) ? "Yes" : "No"}</td></tr>`)}
    </tbody></table><p>ATM90E32 stores voltage and current gains in one table. The active source does not mean this calibration step was completed.</p>` : l`<p>Calibration source is not available.</p>`}
  </section>`;
}
function je(n, e) {
  if (!n) return S;
  const t = n.target === "voltage" ? "V" : "A";
  return l`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((i, s) => l`<dl>
      <div><dt>${e?.[s] ?? (n.target === "voltage" ? `V${s % 3 + 1}` : `A${s + 1}`)}</dt>
        <dd>${i.samples.map((r) => `${G(r)} ${t}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}
function Le(n) {
  return n ? l`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${n.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${n.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${n.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${n.before_values.map(G).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${n.after_values.map(G).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${n.error_percent_values.map((e) => `${G(e)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${n.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${n.gain_evidence ? l`<h4>Gain evidence · ${n.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${n.gain_evidence.phases?.map((e) => l`<tr><td>${e.phase}</td><td>${G(e.measured_voltage)}</td><td>${G(e.measured_current)}</td><td>${G(e.reference_voltage)}</td><td>${G(e.reference_current)}</td><td>${e.old_voltage_gain} → ${e.new_voltage_gain}</td><td>${e.old_current_gain} → ${e.new_current_gain}</td></tr>`) ?? S}
      </tbody></table><p>Saved in flash: ${n.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : l`<p>Gain evidence unavailable.</p>`}
  </section>` : S;
}
function Zi(n, e, t, i, s, r, o, a, c, h, u, d, p, g, f, v) {
  const _ = n?.ct_count ?? e?.channels.length ?? 6, w = Math.floor((i - 1) / 6), I = Math.floor((i - 1) / 3) * 3 + 1, m = Array.from({ length: 3 }, (R, O) => I + O).filter((R) => R <= _), y = m.filter((R) => (s.get(R) ?? 0) > 0), x = w === 0 ? ["meter_main1", "meter_main2"] : [`addon${w}_1`, `addon${w}_2`], P = e === null, z = r !== null && [1, 2, 4, 8].includes(r), j = y.length > 0 && (!P || z);
  return l`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Ot(j, o, a)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(_ / 6) }, (R, O) => l`<button role="tab"
          id=${`current-board-tab-${O}`} aria-controls="current-board-panel"
          aria-selected=${O === w} tabindex=${O === w ? "0" : "-1"}
          @keydown=${(A) => Ae(A, O)}
          @click=${() => h(O * 6 + 1)}>${O === 0 ? "Main Board" : `Add-on ${O}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${w}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((R) => {
    const O = w * 6 + R * 3 + 1;
    return l`<button
          aria-pressed=${O === I} @click=${() => h(O)}>Group ${w * 2 + R + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${I}–CT${I + 2}</h2>
      ${Tt(t, x, "Current", c)}
      <div class="reference-block">
        ${m.map((R) => l`<label>CT${R} reference
          <input data-current-reference=${R} aria-label=${`CT${R} reference`} type="number" min="0.01" step="0.01"
            .value=${s.has(R) ? String(s.get(R)) : ""}
            @input=${(O) => {
    const A = O.target;
    u(R, A.value === "" ? null : Number(A.value));
  }} /></label>`)}
      ${P ? l`<label>Reporting multiplier <select data-role="reporting-multiplier" required @change=${(R) => {
    const O = Number(R.target.value);
    d(O || null);
  }}><option value="" ?selected=${r === null}>Choose multiplier</option>${[1, 2, 4, 8].map((R) => l`<option value=${R} ?selected=${r === R}>${R}</option>`)}</select></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${p} ?disabled=${!j}>Check stability</button>
        <button class="primary" @click=${g} ?disabled=${!j || !o?.stable || (a?.iteration ?? 0) >= 3 || !!(a && !a.retry_allowed && a.iteration > 0)}>${a?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button></div>
      ${o ? l`<div class=${o.stable ? "success-band" : "warning-band"} role="status">${o.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${je(o, y.map((R) => `CT${R}`))}
      ${a?.state === "applied_pending_restart_verification" ? l`<div class="success-band" role="status">Current calibration complete for CT${I}–CT${I + 2}.</div>` : ""}
      ${Le(a)}
      ${a?.state.includes("indeterminate") ? l`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${f}>Reconnect and inspect</button><button class="danger" @click=${v}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Xi = (n) => n === null || typeof n != "object" && typeof n != "function", Ji = (n) => n.strings === void 0;
const Qi = { CHILD: 2 }, es = (n) => (...e) => ({ _$litDirective$: n, values: e });
let ts = class {
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
const le = (n, e) => {
  const t = n._$AN;
  if (t === void 0) return !1;
  for (const i of t) i._$AO?.(e, !1), le(i, e);
  return !0;
}, Se = (n) => {
  let e, t;
  do {
    if ((e = n._$AM) === void 0) break;
    t = e._$AN, t.delete(n), n = e;
  } while (t?.size === 0);
}, Mt = (n) => {
  for (let e; e = n._$AM; n = e) {
    let t = e._$AN;
    if (t === void 0) e._$AN = t = /* @__PURE__ */ new Set();
    else if (t.has(n)) break;
    t.add(n), ns(e);
  }
};
function is(n) {
  this._$AN !== void 0 ? (Se(this), this._$AM = n, Mt(this)) : this._$AM = n;
}
function ss(n, e = !1, t = 0) {
  const i = this._$AH, s = this._$AN;
  if (s !== void 0 && s.size !== 0) if (e) if (Array.isArray(i)) for (let r = t; r < i.length; r++) le(i[r], !1), Se(i[r]);
  else i != null && (le(i, !1), Se(i));
  else le(this, n);
}
const ns = (n) => {
  n.type == Qi.CHILD && (n._$AP ??= ss, n._$AQ ??= is);
};
class rs extends ts {
  constructor() {
    super(...arguments), this._$AN = void 0;
  }
  _$AT(e, t, i) {
    super._$AT(e, t, i), Mt(this), this.isConnected = e._$AU;
  }
  _$AO(e, t = !0) {
    e !== this.isConnected && (this.isConnected = e, e ? this.reconnected?.() : this.disconnected?.()), t && (le(this, e), Se(this));
  }
  setValue(e) {
    if (Ji(this._$Ct)) this._$Ct._$AI(e, this);
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
class os {
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
class as {
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
const lt = (n) => !Xi(n) && typeof n.then == "function", ht = 1073741823;
class cs extends rs {
  constructor() {
    super(...arguments), this._$Cwt = ht, this._$Cbt = [], this._$CK = new os(this), this._$CX = new as();
  }
  render(...e) {
    return e.find((t) => !lt(t)) ?? W;
  }
  update(e, t) {
    const i = this._$Cbt;
    let s = i.length;
    this._$Cbt = t;
    const r = this._$CK, o = this._$CX;
    this.isConnected || this.disconnected();
    for (let a = 0; a < t.length && !(a > this._$Cwt); a++) {
      const c = t[a];
      if (!lt(c)) return this._$Cwt = a, c;
      a < s && c === i[a] || (this._$Cwt = ht, s = 0, Promise.resolve(c).then(async (h) => {
        for (; o.get(); ) await o.get();
        const u = r.deref();
        if (u !== void 0) {
          const d = u._$Cbt.indexOf(c);
          d > -1 && d < u._$Cwt && (u._$Cwt = d, u.setValue(h));
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
const ds = es(cs), Pt = "https://circuitsetup.github.io/ESPWebInstaller/", ls = new URL("manifests/firmware_index.json", Pt).href, Ut = 256 * 1024, hs = 100, ps = 20, qt = 160, us = 1e4, fs = /^[a-z0-9][a-z0-9_-]{0,127}$/, gs = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, Bt = /[\u0000-\u001F\u007F-\u009F]/;
function N(n) {
  throw new Error(`Invalid firmware index: ${n}`);
}
function pt(n) {
  return typeof n == "object" && n !== null && !Array.isArray(n);
}
function Oe(n) {
  return typeof n == "string" && n.length <= qt && !Bt.test(n);
}
function Dt(n) {
  if (!fs.test(n)) throw new Error("Invalid firmware product ID");
}
function Nt(n) {
  if (!gs.test(n) || n.length > qt || Bt.test(n))
    throw new Error("Invalid firmware version");
}
function zt(n) {
  return new TextEncoder().encode(n).byteLength;
}
function vs(n) {
  Array.isArray(n) || N("top level must be an array"), zt(JSON.stringify(n)) > Ut && N("payload is too large"), n.length > hs && N("too many products");
  const e = /* @__PURE__ */ new Set();
  return n.map((t) => {
    (!pt(t) || Object.keys(t).length !== 3 || !Object.hasOwn(t, "productId") || !Object.hasOwn(t, "name") || !Object.hasOwn(t, "versions")) && N("invalid product");
    const { productId: i, name: s, versions: r } = t;
    (!Oe(i) || !Oe(s) || !Array.isArray(r)) && N("invalid product fields"), Dt(i), e.has(i) && N("duplicate product ID"), e.add(i), r.length > ps && N("too many versions");
    const o = /* @__PURE__ */ new Set();
    return {
      productId: i,
      name: s,
      versions: r.map((a) => ((!pt(a) || Object.keys(a).length !== 1 || !Object.hasOwn(a, "version") || !Oe(a.version)) && N("invalid version"), Nt(a.version), o.has(a.version) && N("duplicate version"), o.add(a.version), { version: a.version }))
    };
  });
}
async function _s(n = globalThis.fetch, e) {
  const t = new AbortController(), i = () => t.abort();
  e?.aborted ? i() : e?.addEventListener("abort", i, { once: !0 });
  const s = setTimeout(i, us);
  try {
    const r = await n(ls, { cache: "no-cache", mode: "cors", signal: t.signal });
    if (!r.ok) throw new Error(`Firmware index request failed (${r.status})`);
    const o = await r.text();
    return zt(o) > Ut && N("payload is too large"), vs(JSON.parse(o));
  } finally {
    clearTimeout(s), e?.removeEventListener("abort", i);
  }
}
function ms(n, e) {
  if (!Number.isInteger(n) || n < 0 || n > 6) return [];
  const t = n === 0 ? "6chan_energy_meter_main" : n === 1 ? "6chan_energy_meter_1-addon" : `6chan_energy_meter_${n}-addons`;
  return e === "wifi" ? [n === 0 ? `${t}_board` : t] : e === "ethernet_lilygo" ? [`${t}_ethernet`] : n === 0 ? [`${t}_ethernet_waveshare`, `${t}_ethernet_ws`] : [`${t}_ethernet_waveshare`];
}
function bs(n, e) {
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
function ws(n, e, t) {
  const i = /* @__PURE__ */ new Map();
  for (const s of ms(e, t)) {
    const r = n.find((o) => o.productId === s);
    for (const o of r?.versions ?? [])
      i.has(o.version) || i.set(o.version, { productId: s, version: o.version });
  }
  return [...i.values()].sort((s, r) => bs(s.version, r.version));
}
function ys(n, e) {
  return n.find((t) => t.version === e)?.version ?? n[0]?.version ?? null;
}
function $s(n, e) {
  Dt(n), Nt(e);
  const t = new URL(`manifests/manifest_${n}-${e}.json`, Pt);
  if (t.origin !== "https://circuitsetup.github.io" || !t.pathname.startsWith("/ESPWebInstaller/manifests/"))
    throw new Error("Invalid firmware manifest URL");
  return t.href;
}
let Ss;
const ks = () => Ss ??= import("./circuitsetup-energy-meter-helper-install-button-DpSoc-pA.js"), ut = (n, e) => l`
  <p class="firmware-summary">${n.productId} · ESPHome ${n.version}</p>
  <esp-web-install-button class="esp-web-installer" .manifest=${e}>
    <button slot="activate" aria-label="Install firmware">Install firmware</button>
    <p slot="unsupported">Use a supported Chromium browser with Web Serial to install firmware.</p>
    <p slot="not-allowed">Open this helper on HTTPS or localhost to install firmware.</p>
  </esp-web-install-button>
`;
function Cs(n) {
  if (!n) return S;
  try {
    const e = $s(n.productId, n.version);
    return customElements.get("esp-web-install-button") ? ut(n, e) : ds(
      ks().then(
        () => ut(n, e),
        () => l`<p role="alert">ESP Web Tools failed to load. Reload Home Assistant and try again.</p>`
      ),
      l`<p role="status">Loading installer…</p>`
    );
  } catch {
    return S;
  }
}
const ft = (n) => n === 0 ? "Main Board" : `Add-on ${n}`, As = (n) => n === 0 ? ["main_1", "main_2"] : [`addon${n}_1`, `addon${n}_2`];
function xs(n, e, t, i, s, r, o, a, c, h, u, d, p, g, f, v, _, w, E) {
  const I = e?.offset_capability, m = e?.offset_boards ?? [], y = e?.offset_disposition === "completed" || e?.offset_disposition === "skipped" || e?.offset_disposition === "partial" && e.state === "applied_pending_restart_verification", x = m.length > 0 && m.every((A) => A.stages[0]?.state === "completed"), P = m[t]?.stages[i - 1]?.state ?? "not_started", z = !!a?.retry_allowed || P === "partial" || P === "indeterminate", j = I?.status !== "available", R = As(t), O = new Map(a?.expected_tables ?? []);
  return l`
    <section class="step-content offset-step" aria-labelledby="step-heading">
      ${j ? l`
        <div class="warning-band" role="status">
          <strong>Offset calibration is ${I?.status === "invalid" ? "not safely available" : "not available on this firmware"}.</strong>
          ${I?.status === "invalid" ? l`<p>Repair reason: ${I.repair_reason}</p>` : S}
          <p>Skip preserves the offset values already saved in flash. No clear control is invoked.</p>
        </div>
      ` : l`
        <ol class="offset-stage-stepper" aria-label="Offset calibration stages">
          <li class=${i === 1 ? "active" : x ? "complete" : "pending"}>
            <button data-offset-stage="1" aria-current=${i === 1 ? "step" : S} @click=${() => u(1)}>1. Voltage/current zero offset</button>
          </li>
          <li class=${i === 2 ? "active" : y ? "complete" : "pending"}>
            <button data-offset-stage="2" aria-current=${i === 2 ? "step" : S} ?disabled=${!x}
              @click=${() => u(2)}>2. Active/reactive power offset</button>
          </li>
        </ol>
        <div class="board-tabs" role="tablist" aria-label="Offset calibration boards">
          ${Array.from({ length: n?.board_count ?? m.length }, (A, U) => l`
            <button role="tab" data-offset-board id=${`offset-board-tab-${U}`} aria-controls="offset-board-panel"
              aria-selected=${U === t} tabindex=${U === t ? "0" : "-1"}
              @keydown=${(Q) => Ae(Q, U)} @click=${() => h(U)}>
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
          <label class="check-row"><input type="checkbox" .checked=${s} @change=${(A) => d(A.target.checked)}>
            ${i === 1 ? "I completed the USB-only, de-energized preparation." : "I powered down for rewiring and safely enclosed and energized only the voltage reference."}
          </label>
          <div class="offset-actions">
            <button class="secondary" data-action="check-offset" ?disabled=${c || !s || P === "completed"} @click=${g}>
              ${c ? "Checking measured readiness…" : "Check measured readiness"}
            </button>
            <button class="primary" data-action="calibrate-offset"
              ?disabled=${c || !s || !o?.ready || P === "completed" || z && !r}
              @click=${f}>${a?.retry_allowed ? "Retry unfinished chip" : `Run Stage ${i} calibration`}</button>
          </div>
          ${o ? l`
            <section class="measurement-evidence" aria-label="Offset readiness evidence">
              <h3>Measured readiness</h3>
              <div class=${o.ready ? "success-band" : "warning-band"} role="status" aria-live="polite">
                ${o.ready ? "Measured readiness passed." : "Measured readiness did not pass. Physical acknowledgement is not enough."}
              </div>
              ${o.reasons.length ? l`<ul>${o.reasons.map((A) => l`<li>${A}</li>`)}</ul>` : S}
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
                ${o.entities.map((A) => l`<tr><td>${A.role}</td><td>${A.quantity}</td><td>${A.ready ? "Ready" : A.reasons.join("; ")}</td>
                  <td>${A.window?.mean ?? "—"}</td><td>${A.window?.absolute_peak ?? "—"}</td><td>${A.window?.absolute_spread ?? "—"}</td></tr>`)}
              </tbody></table>
            </section>
          ` : S}
          <section class="measurement-evidence" aria-label="Per-chip offset progress" aria-live="polite">
            <h3>Per-chip progress</h3>
            <table><thead><tr><th>Chip</th><th>State</th><th>Backend evidence</th></tr></thead><tbody>
              ${R.map((A) => l`<tr><td>${A}</td><td>${O.has(A) || P === "completed" ? "Saved; restart verification required." : a?.unfinished_group_keys.includes(A) ? "Unfinished" : P.replaceAll("_", " ")}</td>
                <td>${O.has(A) ? O.get(A).map(([U, Q]) => `${U}/${Q}`).join(", ") : "—"}</td></tr>`)}
            </tbody></table>
          </section>
          ${z ? l`<aside class="recovery-panel" role="status" aria-live="assertive">
            <strong>${a ? a.state === "partial" ? "One chip finished; recovery is required" : "Calibration outcome is indeterminate" : "Recovery is required"}</strong>
            <p>${a?.error ?? "The prior operation did not finish cleanly"}. Reconnect and inspect before retrying only the unfinished chip.</p>
            <label class="check-row"><input type="checkbox" .checked=${r} @change=${(A) => p(A.target.checked)}> I reviewed the evidence and confirm this retry.</label>
            <button class="secondary" @click=${v}>Reconnect and inspect</button>
          </aside>` : S}
        </div>
      `}
      <footer class="action-footer offset-footer">
        <button class="secondary" @click=${w}>Back</button>
        <button class="secondary" data-action="skip-offset" ?disabled=${c || y} @click=${_}>Skip offset calibration</button>
        <button class="primary" ?disabled=${c || !y} @click=${E}>Continue</button>
      </footer>
    </section>
  `;
}
const Es = [
  ["power_quality", "Power quality sensors"],
  ["status_fields", "Status fields"]
], Z = (n) => ({
  power_quality: Array(n + 1).fill(!1),
  status_fields: [!0, ...Array(n).fill(!1)]
}), Is = (n, e) => {
  const t = Z(e);
  return {
    power_quality: t.power_quality.map((i, s) => n.power_quality[s] ?? i),
    status_fields: t.status_fields.map((i, s) => n.status_fields[s] ?? i)
  };
};
function Ft(n, e) {
  return l`<section class="package-options" aria-labelledby="package-options-heading">
    <h2 id="package-options-heading">Optional meter fields</h2>
    <p>Choose which meter boards expose additional power quality and status entities.</p>
    ${Es.map(([t, i]) => {
    const s = n[t], r = s.every(Boolean), o = s.some(Boolean) && !r;
    return l`<fieldset class="choice-field feature-options">
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
        ${s.map((a, c) => l`<label>
          <input type="checkbox" data-feature=${t} data-board=${c}
            .checked=${a}
            @change=${(h) => e({
      ...n,
      [t]: s.map((u, d) => d === c ? h.currentTarget.checked : u)
    })} />
          <span>${c === 0 ? "Main board" : `Add-on ${c}`}</span>
        </label>`)}
      </fieldset>`;
  })}
  </section>`;
}
function Rs(n, e, t, i, s, r, o) {
  const a = n.includes("failed") || n.includes("indeterminate"), c = !!(e?.offset_groups?.length || e?.power_offset_groups?.length), h = e?.source_handoff_available ? e.config_filename : c ? "Unavailable; offset calibration remains saved in flash" : "Unavailable in runtime-only mode";
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, voltage/current offsets, power offsets, and entity bindings.</p>
      <div class="status-band" role="status">${i ? "Restarting and verifying…" : n || "Ready for restart verification"}</div>
      ${e ? l`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${h}</dd></div></dl>` : ""}
      ${n === "cancelled" ? l`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${a ? l`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${t ? l`<button class="danger" data-action="rollback" @click=${r}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${o} ?disabled=${i}>Back</button><button class="primary" @click=${s} ?disabled=${i || n === "cancelled" || !!e}>${i ? "Restarting and verifying…" : n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Os(n) {
  return n ? n.preflight.issues.length ? l`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((e) => l`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : l`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : l`<p>Starting a calibration session…</p>`;
}
function Ts(n, e, t, i, s, r, o = !1) {
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${Os(n)}
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
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" @click=${i} ?disabled=${o || n?.state === "cancelled" || !e || !!n?.preflight.issues.length}>${o ? "Loading calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const gt = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Ms = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"], Ps = [
  ["split_phase_120_240", "Split phase 120/240 V"],
  ["single_phase_230", "Single phase 230 V"],
  ["three_phase", "Three phase"],
  ["custom", "Custom"]
], vt = (n) => n === "split_phase_120_240" ? 60 : n === "single_phase_230" ? 50 : null;
function Us(n, e, t, i, s, r, o, a, c = "", h = !1, u = l``, d = null, p = Z(e), g = () => {
}, f = "split_phase_120_240", v = 60, _ = !1, w = () => {
}, E = () => {
}, I = () => {
}) {
  return l`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Configure an existing device</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        ${n?.devices.length ? l`<div class="meter-list">
          ${n.devices.map((m) => l`
            <div class="meter-row">
              <span><strong>${m.title}</strong><small>${m.project_name} · ${m.project_version ?? "version unavailable"}</small></span>
              <span>Device Builder: ${m.configuration ? "Yes" : m.importable ? "Yes — import available" : "No"}</span>
              ${m.importable && !m.configuration ? l`<button class="secondary" ?disabled=${!!c}
                @click=${() => a(m.entry_id)}>${d === m.entry_id ? "Retry import" : "Import"}</button>` : ""}
              <button class="primary" data-action="configure-device" ?disabled=${!!c}
                @click=${() => o(m.entry_id)}>${c === `topology:${m.entry_id}` ? "Loading topology…" : "Configure"}</button>
            </div>
          `)}
        </div>` : l`<div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>`}
      </section>
      ${h ? "" : l`<hr />
      <h2>Set up a new device</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (m, y) => l`
            <label class=${y === e ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(y)}
                .checked=${y === e} @change=${() => i(y)} />
              <span>${y}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Electrical system</legend>
        <p id="electrical-profile-help">Confirm the line frequency before it is saved with this installation.</p>
        <div class="connection-options">
          ${Ps.map(([m, y]) => l`
            <label class=${m === f ? "selected" : ""}>
              <input name="electrical-system" type="radio" .value=${m}
                .checked=${m === f} @change=${() => w(m)} />
              <span>${y}</span>
            </label>
          `)}
        </div>
        <div class="connection-options" role="group" aria-describedby="electrical-profile-help">
          ${[50, 60].map((m) => l`<label class=${m === v ? "selected" : ""}>
            <input name="line-frequency" type="radio" .value=${String(m)} .checked=${m === v}
              @change=${() => E(m)} /> <span>${m} Hz</span>
          </label>`)}
        </div>
        <p>${vt(f) ? `${vt(f)} Hz is suggested; confirm it after checking your supply.` : "Choose the line frequency for this electrical system."}</p>
        <button class="secondary" data-action="confirm-electrical-profile" ?disabled=${v === null} @click=${I}>
          ${_ ? "Electrical profile confirmed" : "Confirm electrical profile"}
        </button>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${gt.map(([m, y]) => l`
            <label class=${m === t ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${m}
                .checked=${m === t} @change=${() => s(m)} />
              <span>${y}</span>
            </label>
          `)}
        </div>
      </fieldset>
      ${Ft(p, g)}
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>Add-on boards</dt><dd>${e}</dd></div>
          <div><dt>Connection</dt><dd>${gt.find(([m]) => m === t)?.[1]}</dd></div>
          ${Ms.slice(0, e).map((m, y) => l`<div><dt>Add-on ${y + 1}</dt><dd>${m}</dd></div>`)}
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
      <button class="rescan" data-action="rescan" ?disabled=${!!c} @click=${r}>${c === "rescan" ? "Rescanning…" : "Rescan for device"}</button>
    </section>
  `;
}
function Ht(n, e, t, i, s, r = null, o = !1) {
  return l`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((a) => l`<li>${a.source}: ${a.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([a, c]) => l`<div data-target=${a}>${je(c)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([a, c]) => l`<div data-target=${a}>${Le(c)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${t?.evidence.join(", ") || "No build evidence."}</p><p>${t?.progress.join(", ") || "No transaction progress."}</p>
          ${t?.validation_detail ? l`<p>Validation code ${t.validation_detail.code ?? "unavailable"}; ${t.validation_detail.error_record_count} error records; ${t.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${t?.upload_progress?.length ? l`<ul>${t.upload_progress.map((a) => l`<li>${a.stage}: ${a.percentage ?? a.progress ?? "in progress"}${a.percentage != null || a.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Calibration completion record</h3><p>${r ? `Restart-verified ${r.source_authority.replaceAll("_", " ")} calibration record` : o ? "No-change completion; no restart-verified record was created" : "Not yet established"}</p><p>${r ? `Verification ${r.verification_id}, generation ${r.connection_generation}; ${r.offset_groups?.length ?? 0} voltage/current offset tables; ${r.power_offset_groups?.length ?? 0} power-offset tables.` : o ? "The server confirmed there were no pending gain or offset changes." : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function qs(n, e, t, i, s, r, o, a, c, h) {
  const u = !!(r?.offset_groups?.length || r?.power_offset_groups?.length), d = r?.source_authority === "saved_flash" && r.config_filename && !u && (r.source_handoff_available || r.source_handoff_firmware_installed);
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${r && u ? l`<div class="success-band" role="status">Setup and exact restart verification are complete. Offset calibration remains saved in flash; YAML handoff and flash clearing are unavailable.</div>` : r?.source_authority === "configuration" ? l`<div class="success-band" role="status">Calibration saved to YAML; flash values cleared.</div>` : r ? l`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : o ? l`<div class="success-band" role="status">Completed without calibration changes. No restart or restart-verified calibration record was required.</div>` : l`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${a ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${r?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${r?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${Ht(n, e, t, i, s, r, o)}
      <footer class="action-footer"><button class="secondary" @click=${h}>Back</button>
        ${d ? l`<button class="primary" data-action="save-calibration" @click=${c}>${r?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : ""}
      </footer>
    </section>
  `;
}
function jt(n) {
  const e = n.addon_count, t = n.evidence.map((i) => i.source);
  return e < 0 || e > 6 || n.board_count !== e + 1 || n.ct_count !== 6 * (e + 1) || n.group_count !== 2 * (e + 1) || n.evidence.length < 1 || n.evidence.length > 5 || new Set(t).size !== t.length || !t.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || n.evidence.some((i) => i.addon_count !== e);
}
function Bs(n, e, t, i, s = !1, r = !1, o = null, a = () => {
}) {
  const c = s || jt(n);
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
        <tbody>${n.evidence.map((h) => l`
          <tr><td>${h.source.replaceAll("_", " ")}</td><td>${h.addon_count}</td><td>${h.detail}</td></tr>
        `)}</tbody>
      </table>
      ${o ? Ft(o, a) : ""}
      ${c ? l`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : l`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${t}>Back</button>
        ${c ? "" : l`<button class="primary" data-action="continue" ?disabled=${r} @click=${i}>${r ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
function Ds(n, e, t, i, s = [], r, o, a, c, h, u, d, p, g) {
  const f = i.length, v = i.slice(0, f).every((y) => Number.isFinite(y) && y > 0), _ = t === 0 ? ["meter_main1", "meter_main2"] : [`addon${t}_1`, `addon${t}_2`], w = new Set(o.flatMap((y) => y.state === "applied_pending_restart_verification" && y.gain_evidence?.flash_saved ? [y.gain_evidence.instance_id] : [])), E = w.size === _.length && _.every((y) => w.has(y)), I = o.find((y) => y.retry_allowed) ?? null, m = t === 0 ? "Main Board" : `Add-on ${t}`;
  return l`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Ot(v, r, E ? o[0] ?? null : null)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: n?.board_count ?? 1 }, (y, x) => l`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${x}`} aria-controls="voltage-board-panel"
          aria-selected=${x === t} tabindex=${x === t ? "0" : "-1"}
          @keydown=${(P) => Ae(P, x)}
          @click=${() => c(x)}>${x === 0 ? "Main Board" : `Add-on ${x}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${t}`}>
      <h2>Calibrate Voltage</h2>
      ${Tt(e, _, "Voltage", w)}
      <div class="reference-block">
        ${Array.from({ length: f }, (y, x) => l`<label>${s[x] ?? (f === 1 ? "Trusted instrument" : `Voltage ${x + 1}`)} trusted reference
          <input type="number" min="0.01" step="0.01" .value=${i[x] ? String(i[x]) : ""}
            @input=${(P) => h(x, Number(P.target.value))} /></label>`)}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${u} ?disabled=${a}>${a ? "Loading live voltage data…" : "Check stability"}</button>
        <button class="primary" @click=${d} ?disabled=${a || !v || !r?.stable || E && !I}>${I ? "Retry voltage calibration" : "Calibrate voltage"}</button></div>
      ${r ? l`<div class=${r.stable ? "success-band" : "warning-band"} role="status">${r.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${je(r)}
      ${E ? l`<div class="success-band" role="status">Voltage calibration complete for ${m}.</div>` : ""}
      ${o.map((y) => Le(y))}
      ${o.some((y) => y.state === "indeterminate") ? l`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${p}>Reconnect and inspect</button><button class="danger" @click=${g}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Ns = Kt`
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
    .ct-detail, .technical-grid, .group-grid, .offset-stage-stepper, .threshold-grid { grid-template-columns: 1fr; }
    .progress-steps { grid-template-columns: 1fr; gap: 8px; }
    .action-footer { left: 0; padding: 12px 18px; }
    .offset-step { padding-bottom: 84px; }
    .identity-strip, .confirmation-actions, .group-nav { align-items: stretch; flex-direction: column; }
    .evidence-table { display: block; overflow-x: auto; }
  }
`, oe = [
  ["setup", "Setup Device"],
  ["ct", "CT Settings"],
  ["safety", "Safety"],
  ["offset", "Offset"],
  ["voltage", "Voltage"],
  ["current", "Current"],
  ["restart", "Restart"],
  ["build", "Flash & Verify"],
  ["summary", "Summary"]
], zs = "circuitsetup.6c-energy-meter", Fs = 1e4, Hs = 250, _t = (n) => new Promise((e) => setTimeout(e, n));
class js extends de {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.addonCount = 0, this.packageOptions = Z(0), this.sourcePackageOptions = Z(0), this.connection = "wifi", this.electricalSystem = "split_phase_120_240", this.lineFrequencyHz = 60, this.electricalProfileConfirmed = !1, this.meterSettingsDraft = null, this.board = 0, this.group = 0, this.channel = 1, this.voltageReferences = /* @__PURE__ */ new Map(), this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.firmwareIndex = null, this.firmwareCatalogState = "idle", this.firmwareCatalogError = "", this.selectedEspHomeVersion = null, this.resolvedFirmwareOptions = [], this.firmwareFetchController = null, this.setupDeviceIds = /* @__PURE__ */ new Set(), this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.setupUnsub = null, this.sessionStarting = !1, this.pendingAction = "", this.importFailedDeviceId = null, this.newInstallDeviceId = null, this.voltageBusy = !1, this.offsetBusy = !1, this.finishBusy = !1, this.restartBusy = !1, this.voltageSkipped = !1, this.currentSkipped = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = Ns;
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
    const t = new $e(this.hass, this.panel.config.entry_id);
    this.api = t;
    try {
      const i = await t.setupStatus();
      if (!this.owns(e, t)) return;
      this.setup = i, this.setupDeviceIds = new Set(i.devices.map((r) => r.entry_id));
      const s = this.setup.installer_intent;
      s && (this.addonCount = s.addon_count, this.connection = s.connection_type, this.packageOptions = s.power_quality && s.status_fields ? { power_quality: [...s.power_quality], status_fields: [...s.status_fields] } : Z(s.addon_count), this.sourcePackageOptions = Z(s.addon_count), s.electrical_system !== void 0 && s.line_frequency_hz !== void 0 ? (this.electricalSystem = s.electrical_system, this.lineFrequencyHz = s.line_frequency_hz, this.electricalProfileConfirmed = !0) : (this.electricalSystem = "split_phase_120_240", this.lineFrequencyHz = 60, this.electricalProfileConfirmed = !1), this.refreshFirmwareOptions()), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.firstDeviceId(this.setup.devices)), await this.subscribeSetup(e, t), this.transaction && await this.subscribeTransaction(e), this.session && this.session.state !== "cancelled" && await this.subscribeSession(e);
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
    const s = e.devices.filter((r) => !this.setupDeviceIds.has(r.entry_id)).sort((r, o) => r.entry_id.localeCompare(o.entry_id)).filter((r) => r.project_name.startsWith(zs));
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
    this.firmwareFetchController?.abort(), this.firmwareFetchController = t, this.firmwareCatalogState = "loading", this.firmwareCatalogError = "", this.requestUpdate(), _s(globalThis.fetch, t.signal).then((i) => {
      this.ownsFirmwareCatalog(e, t) && (this.firmwareIndex = i, this.firmwareFetchController = null, this.firmwareCatalogState = "ready", this.refreshFirmwareOptions());
    }).catch(() => {
      this.ownsFirmwareCatalog(e, t) && (this.firmwareFetchController = null, this.firmwareCatalogState = "error", this.firmwareCatalogError = "Firmware catalog could not be loaded.", this.requestUpdate());
    });
  }
  refreshFirmwareOptions() {
    const e = this.firmwareIndex ? ws(this.firmwareIndex, this.addonCount, this.connection) : [], t = this.selectedEspHomeVersion, i = ys(e, t);
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
    ++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = e, e !== this.newInstallDeviceId && (this.newInstallDeviceId = null), this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.meterSettingsDraft = null, this.board = 0, this.resetCalibrationRun();
  }
  firstDeviceId(e) {
    return e.map((t) => t.entry_id).sort((t, i) => t.localeCompare(i))[0] ?? null;
  }
  showTopology(e) {
    this.topology = e, this.error = jt(e) || e.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
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
    this.addonCount = e, this.packageOptions = Is(this.packageOptions, e), this.sourcePackageOptions = Z(e), this.refreshFirmwareOptions();
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
    this.step === "ct" ? this.navigate("setup") : this.step === "safety" ? this.cancelSession("ct") : this.step === "offset" ? this.navigate("safety") : this.step === "voltage" ? this.navigate("offset") : this.step === "current" ? this.navigate("voltage") : this.step === "restart" ? this.navigate("current") : this.step === "build" ? this.navigate(this.calibrationHandoff ? "restart" : "ct") : this.step === "summary" && this.navigate("build");
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
      this.electricalProfileConfirmed && this.lineFrequencyHz !== null && (this.meterSettingsDraft = {
        electrical_system: this.electricalSystem,
        line_frequency_hz: this.lineFrequencyHz,
        authoritative: !1,
        update_interval_s: 5,
        voltage_references: [],
        warnings: []
      });
      const o = await t.getMeterConfiguration(e);
      if (!this.ownsOperation(i, t, e)) return;
      this.meterSettingsDraft = o;
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
    const s = Date.now() + Fs;
    for (; this.ownsOperation(i, e, t); ) {
      const r = s - Date.now();
      if (r <= 0) break;
      try {
        const o = await Promise.race([
          e.setupStatus(),
          _t(r).then(() => {
            throw new Error("helper rebind timed out");
          })
        ]);
        if (o.bound_device_id === t) return o;
      } catch (o) {
        if (o.code !== "capability_unavailable") throw o;
      }
      if (Date.now() >= s) break;
      await _t(Math.min(Hs, s - Date.now()));
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
        if (this.meterSettingsDraft || (this.meterSettingsDraft = await e.getMeterConfiguration(t)), !this.ownsOperation(i, e, t)) return;
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
  hasPackageChanges() {
    return !!(this.sourcePackageOptions && ["power_quality", "status_fields"].some((e) => this.packageOptions[e].some((t, i) => t !== this.sourcePackageOptions?.[e][i])));
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    let e = ie(this.inventory, this.drafts);
    if (!e.length && !this.hasPackageChanges())
      return this.fail(new Error(), "Select at least one configuration change before review.");
    const t = this.api, i = this.selectedDeviceId, s = this.inventory, r = ++this.operationGeneration;
    if (this.clearSubscription("transaction"), this.transaction = null, this.labelOnly && e.length) {
      const o = e.filter((a) => a.name !== this.inventory.channels.find((c) => c.channel === a.channel)?.name).map(({ channel: a, name: c }) => ({ channel: a, name: c }));
      if (!o.length || e.some((a) => {
        const c = this.inventory.channels.find((h) => h.channel === a.channel);
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
    const e = ie(this.inventory, this.drafts);
    if (this.labelOnly && e.length) {
      const t = e.map(({ channel: a, name: c }) => ({ channel: a, name: c })), i = this.api, s = this.selectedDeviceId, r = this.inventory, o = ++this.operationGeneration;
      if (this.pendingAction = "session", this.requestUpdate(), await this.run(async () => {
        await i.setHaLabels(s, r.plan_id, r.source_sha256, t), this.ownsOperation(o, i, s) && (this.inventory = { ...r, channels: r.channels.map((a) => {
          const c = t.find((h) => h.channel === a.channel);
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
        const o = this.inventory && !this.labelOnly ? ie(this.inventory, this.drafts) : [], a = await e.previewCalibratedGains(
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
            for (const h of a.changes) {
              const u = /^package\.(main|addon([1-6]))\.(power_quality|status_fields)$/.exec(h.key);
              if (!u || !["enabled", "disabled"].includes(h.old_value ?? "")) continue;
              const d = u[1] === "main" ? 0 : Number(u[2]), p = u[3];
              c[p][d] = h.old_value === "enabled";
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
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.board, r = this.offsetStage, o = this.offsetKey(s, r), a = this.offsetResultByTarget.get(o), c = this.session.offset_boards?.[s]?.stages[r - 1]?.state, h = !!a?.retry_allowed || c === "partial" || c === "indeterminate";
    if (this.offsetAcknowledged[r - 1] !== !0 || h && !this.offsetRetryConfirmed) return;
    const u = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const d = await e.calibrateOffset(i, s, r, !0, h);
          if (!this.ownsOperation(u, e, t) || this.session?.session_id !== i) return;
          this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(o, d);
          const p = (this.session.offset_boards ?? []).map((v) => v.board_index !== s ? v : {
            ...v,
            stages: v.stages.map((_) => _.stage !== r ? _ : {
              ..._,
              state: d.state === "applied_pending_restart_verification" ? "completed" : d.state
            })
          }), g = p.flatMap((v) => v.stages.map((_) => _.state)), f = g.every((v) => v === "completed") ? "completed" : g.some((v) => v === "partial" || v === "indeterminate") ? "partial" : "in_progress";
          this.session = {
            ...this.session,
            offset_boards: p,
            offset_disposition: f,
            has_pending_calibration: this.session.has_pending_calibration || d.expected_tables.length > 0
          }, this.offsetAcknowledged = this.offsetAcknowledged.map((v, _) => _ === r - 1 ? !1 : v), this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget), this.offsetReadinessByTarget.delete(o), this.offsetRetryConfirmed = !1, this.announcement = d.state === "applied_pending_restart_verification" ? `Board ${s + 1} Stage ${r} saved; restart verification required.` : `Board ${s + 1} Stage ${r} requires recovery before retry.`;
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
    if (this.inventory && !this.labelOnly && ie(this.inventory, this.drafts).length) {
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
              const h = await t.checkStability(s, "voltage", c);
              if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
              a.set(`voltage:${c}`, h);
            }
            this.stabilityByTarget = a, this.announcement = "Loaded voltage data for the selected reference.";
            return;
          }
          for (const [a, c] of o.entries()) {
            const h = await t.checkStability(s, e, c);
            if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${c}`, h), a < o.length - 1 && this.requestUpdate();
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
            const h = new Map(this.calibrationByTarget), u = this.voltageReferenceIds().map((d, p) => ({ referenceId: d, value: this.voltageReferences instanceof Map ? this.voltageReferences.get(d) ?? 0 : this.voltageReferences[p] ?? 0 })).filter(({ referenceId: d }) => !this.voltageReferenceComplete(d));
            if (u.some(({ value: d }) => !Number.isFinite(d) || d < 1 || d > 600) || u.some(({ referenceId: d }) => !this.stabilityByTarget.get(`voltage:${d}`)?.stable))
              throw new Error("Voltage references must be valid and stable before calibration.");
            for (const { referenceId: d, value: p } of u) {
              const g = await t.calibrateVoltage(s, d, p, !0);
              if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
              g.forEach((f) => h.set(`voltage:${f.group_key}`, f)), this.calibrationByTarget = new Map(h), this.requestUpdate();
            }
            this.calibrationByTarget = h, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = "Calibrated the selected voltage reference.";
            return;
          }
          const a = await t.calibrateCurrent(
            s,
            o,
            !0,
            this.inventory && !this.labelOnly ? ie(this.inventory, this.drafts).map((h) => ({
              channel: h.channel,
              reporting_multiplier: h.reporting_multiplier ?? 1
            })) : []
          );
          if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
          const c = new Map(this.calibrationByTarget);
          o.forEach((h) => c.set(`current:${h.channel}`, a)), this.calibrationByTarget = c, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = `Calibration iteration ${a.iteration} finished with state ${a.state}.`;
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
    const e = this.inventory && !this.labelOnly ? ie(this.inventory, this.drafts) : [];
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
    return this.step === "setup" ? l`${Us(
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
      ${this.topology ? Bs(
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
    ) : S}` : this.step === "ct" && this.inventory ? l`<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
      this.labelOnly = !1, this.requestUpdate();
    }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
      this.labelOnly = !0, this.requestUpdate();
    }}>Home Assistant labels only</label></fieldset>${Wi(
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
    )}` : this.step === "build" ? Vi(
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
    ) : this.step === "safety" ? Ts(
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
    ) : this.step === "offset" ? xs(
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
    ) : this.step === "voltage" ? l`${this.meterSettingsDraft?.warnings.includes("slow_interval_extends_calibration") ? l`<div class="warning-band" role="status">This meter uses a ${this.meterSettingsDraft.update_interval_s}-second update interval. Calibration takes longer; keep the reference stable until each check finishes.</div>` : S}${Ds(
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
        <button class="primary" ?disabled=${this.voltageBusy || !this.voltageSkipped && !this.hasCompletedCalibration("voltage")} @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? l`${Zi(
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
    }}>${this.finishBusy ? "Finishing…" : "Continue"}</button></footer>` : this.step === "restart" ? Rs(
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
    ) : this.step === "summary" ? qs(
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
      </div>` : S}
      ${e ? l`<p role="status">Loading firmware versions…</p>` : S}
      ${this.firmwareCatalogState === "ready" && !this.resolvedFirmwareOptions.length ? l`<p role="status">No firmware version is available for this hardware.</p>` : S}
      ${this.firmwareCatalogState === "ready" ? Cs(this.selectedFirmware()) : S}
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
              <button class="step-button" aria-current=${s === e ? "step" : S}
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
          ${this.error ? l`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : S}
          ${this.stepBody()}
          ${e >= 2 && !["voltage", "current", "summary"].includes(this.step) ? Ht(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : S}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", js);
export {
  js as CircuitSetupPanel
};
