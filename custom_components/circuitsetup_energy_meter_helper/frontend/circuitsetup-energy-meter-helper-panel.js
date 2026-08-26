const ye = globalThis, He = ye.ShadowRoot && (ye.ShadyCSS === void 0 || ye.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, je = /* @__PURE__ */ Symbol(), Qe = /* @__PURE__ */ new WeakMap();
let At = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== je) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (He && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = Qe.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Qe.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const ii = (n) => new At(typeof n == "string" ? n : n + "", void 0, je), si = (n, ...e) => {
  const t = n.length === 1 ? n[0] : e.reduce((i, s, r) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[r + 1], n[0]);
  return new At(t, n, je);
}, ni = (n, e) => {
  if (He) n.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), s = ye.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = t.cssText, n.appendChild(i);
  }
}, et = He ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return ii(t);
})(n) : n;
const { is: ri, defineProperty: oi, getOwnPropertyDescriptor: ai, getOwnPropertyNames: ci, getOwnPropertySymbols: li, getPrototypeOf: di } = Object, Ee = globalThis, tt = Ee.trustedTypes, hi = tt ? tt.emptyScript : "", ui = Ee.reactiveElementPolyfillSupport, ue = (n, e) => n, Ue = { toAttribute(n, e) {
  switch (e) {
    case Boolean:
      n = n ? hi : null;
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
} }, xt = (n, e) => !ri(n, e), it = { attribute: !0, type: String, converter: Ue, reflect: !1, useDefault: !1, hasChanged: xt };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), Ee.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let oe = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = it) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, i, t);
      s !== void 0 && oi(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: s, set: r } = ai(this.prototype, e) ?? { get() {
      return this[t];
    }, set(a) {
      this[t] = a;
    } };
    return { get: s, set(a) {
      const o = s?.call(this);
      r?.call(this, a), this.requestUpdate(e, o, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? it;
  }
  static _$Ei() {
    if (this.hasOwnProperty(ue("elementProperties"))) return;
    const e = di(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(ue("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(ue("properties"))) {
      const t = this.properties, i = [...ci(t), ...li(t)];
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
      for (const s of i) t.unshift(et(s));
    } else e !== void 0 && t.push(et(e));
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
    return ni(e, this.constructor.elementStyles), e;
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
      const r = i.getPropertyOptions(s), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : Ue;
      this._$Em = s;
      const o = a.fromAttribute(t, r.type);
      this[s] = o ?? this._$Ej?.get(s) ?? o, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, s = !1, r) {
    if (e !== void 0) {
      const a = this.constructor;
      if (s === !1 && (r = this[e]), i ??= a.getPropertyOptions(e), !((i.hasChanged ?? xt)(r, t) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: s, wrapped: r }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), r !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        const { wrapped: a } = r, o = this[s];
        a !== !0 || this._$AL.has(s) || o === void 0 || this.C(s, void 0, r, o);
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
oe.elementStyles = [], oe.shadowRootOptions = { mode: "open" }, oe[ue("elementProperties")] = /* @__PURE__ */ new Map(), oe[ue("finalized")] = /* @__PURE__ */ new Map(), ui?.({ ReactiveElement: oe }), (Ee.reactiveElementVersions ??= []).push("2.1.2");
const Le = globalThis, st = (n) => n, ke = Le.trustedTypes, nt = ke ? ke.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Et = "$lit$", X = `lit$${Math.random().toFixed(9).slice(2)}$`, Tt = "?" + X, pi = `<${Tt}>`, ne = document, ge = () => ne.createComment(""), _e = (n) => n === null || typeof n != "object" && typeof n != "function", Ve = Array.isArray, fi = (n) => Ve(n) || typeof n?.[Symbol.iterator] == "function", qe = `[\x20\t
\f\r]`, de = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, rt = /-->/g, ot = />/g, ee = RegExp(`>|${qe}(?:([^\\s"'>=/]+)(${qe}*=${qe}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), at = /'/g, ct = /"/g, It = /^(?:script|style|textarea|title)$/i, gi = (n) => (e, ...t) => ({ _$litType$: n, strings: e, values: t }), d = gi(1), J = /* @__PURE__ */ Symbol.for("lit-noChange"), M = /* @__PURE__ */ Symbol.for("lit-nothing"), lt = /* @__PURE__ */ new WeakMap(), ie = ne.createTreeWalker(ne, 129);
function Rt(n, e) {
  if (!Ve(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return nt !== void 0 ? nt.createHTML(e) : e;
}
const _i = (n, e) => {
  const t = n.length - 1, i = [];
  let s, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = de;
  for (let o = 0; o < t; o++) {
    const c = n[o];
    let l, h, u = -1, m = 0;
    for (; m < c.length && (a.lastIndex = m, h = a.exec(c), h !== null); ) m = a.lastIndex, a === de ? h[1] === "!--" ? a = rt : h[1] !== void 0 ? a = ot : h[2] !== void 0 ? (It.test(h[2]) && (s = RegExp("</" + h[2], "g")), a = ee) : h[3] !== void 0 && (a = ee) : a === ee ? h[0] === ">" ? (a = s ?? de, u = -1) : h[1] === void 0 ? u = -2 : (u = a.lastIndex - h[2].length, l = h[1], a = h[3] === void 0 ? ee : h[3] === '"' ? ct : at) : a === ct || a === at ? a = ee : a === rt || a === ot ? a = de : (a = ee, s = void 0);
    const y = a === ee && n[o + 1].startsWith("/>") ? " " : "";
    r += a === de ? c + pi : u >= 0 ? (i.push(l), c.slice(0, u) + Et + c.slice(u) + X + y) : c + X + (u === -2 ? o : y);
  }
  return [Rt(n, r + (n[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class me {
  constructor({ strings: e, _$litType$: t }, i) {
    let s;
    this.parts = [];
    let r = 0, a = 0;
    const o = e.length - 1, c = this.parts, [l, h] = _i(e, t);
    if (this.el = me.createElement(l, i), ie.currentNode = this.el.content, t === 2 || t === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (s = ie.nextNode()) !== null && c.length < o; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const u of s.getAttributeNames()) if (u.endsWith(Et)) {
          const m = h[a++], y = s.getAttribute(u).split(X), b = /([.?@])?(.*)/.exec(m);
          c.push({ type: 1, index: r, name: b[2], strings: y, ctor: b[1] === "." ? vi : b[1] === "?" ? bi : b[1] === "@" ? wi : Te }), s.removeAttribute(u);
        } else u.startsWith(X) && (c.push({ type: 6, index: r }), s.removeAttribute(u));
        if (It.test(s.tagName)) {
          const u = s.textContent.split(X), m = u.length - 1;
          if (m > 0) {
            s.textContent = ke ? ke.emptyScript : "";
            for (let y = 0; y < m; y++) s.append(u[y], ge()), ie.nextNode(), c.push({ type: 2, index: ++r });
            s.append(u[m], ge());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Tt) c.push({ type: 2, index: r });
      else {
        let u = -1;
        for (; (u = s.data.indexOf(X, u + 1)) !== -1; ) c.push({ type: 7, index: r }), u += X.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const i = ne.createElement("template");
    return i.innerHTML = e, i;
  }
}
function ce(n, e, t = n, i) {
  if (e === J) return e;
  let s = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const r = _e(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== r && (s?._$AO?.(!1), r === void 0 ? s = void 0 : (s = new r(n), s._$AT(n, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = s : t._$Cl = s), s !== void 0 && (e = ce(n, s._$AS(n, e.values), s, i)), e;
}
class mi {
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
    const { el: { content: t }, parts: i } = this._$AD, s = (e?.creationScope ?? ne).importNode(t, !0);
    ie.currentNode = s;
    let r = ie.nextNode(), a = 0, o = 0, c = i[0];
    for (; c !== void 0; ) {
      if (a === c.index) {
        let l;
        c.type === 2 ? l = new ve(r, r.nextSibling, this, e) : c.type === 1 ? l = new c.ctor(r, c.name, c.strings, this, e) : c.type === 6 && (l = new $i(r, this, e)), this._$AV.push(l), c = i[++o];
      }
      a !== c?.index && (r = ie.nextNode(), a++);
    }
    return ie.currentNode = ne, s;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class ve {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, s) {
    this.type = 2, this._$AH = M, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    e = ce(this, e, t), _e(e) ? e === M || e == null || e === "" ? (this._$AH !== M && this._$AR(), this._$AH = M) : e !== this._$AH && e !== J && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : fi(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== M && _e(this._$AH) ? this._$AA.nextSibling.data = e : this.T(ne.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, s = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = me.createElement(Rt(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(t);
    else {
      const r = new mi(s, this), a = r.u(this.options);
      r.p(t), this.T(a), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = lt.get(e.strings);
    return t === void 0 && lt.set(e.strings, t = new me(e)), t;
  }
  k(e) {
    Ve(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, s = 0;
    for (const r of e) s === t.length ? t.push(i = new ve(this.O(ge()), this.O(ge()), this, this.options)) : i = t[s], i._$AI(r), s++;
    s < t.length && (this._$AR(i && i._$AB.nextSibling, s), t.length = s);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = st(e).nextSibling;
      st(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class Te {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, s, r) {
    this.type = 1, this._$AH = M, this._$AN = void 0, this.element = e, this.name = t, this._$AM = s, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = M;
  }
  _$AI(e, t = this, i, s) {
    const r = this.strings;
    let a = !1;
    if (r === void 0) e = ce(this, e, t, 0), a = !_e(e) || e !== this._$AH && e !== J, a && (this._$AH = e);
    else {
      const o = e;
      let c, l;
      for (e = r[0], c = 0; c < r.length - 1; c++) l = ce(this, o[i + c], t, c), l === J && (l = this._$AH[c]), a ||= !_e(l) || l !== this._$AH[c], l === M ? e = M : e !== M && (e += (l ?? "") + r[c + 1]), this._$AH[c] = l;
    }
    a && !s && this.j(e);
  }
  j(e) {
    e === M ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class vi extends Te {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === M ? void 0 : e;
  }
}
class bi extends Te {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== M);
  }
}
class wi extends Te {
  constructor(e, t, i, s, r) {
    super(e, t, i, s, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = ce(this, e, t, 0) ?? M) === J) return;
    const i = this._$AH, s = e === M && i !== M || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== M && (i === M || s);
    s && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class $i {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    ce(this, e);
  }
}
const yi = Le.litHtmlPolyfillSupport;
yi?.(me, ve), (Le.litHtmlVersions ??= []).push("3.3.3");
const Ci = (n, e, t) => {
  const i = t?.renderBefore ?? e;
  let s = i._$litPart$;
  if (s === void 0) {
    const r = t?.renderBefore ?? null;
    i._$litPart$ = s = new ve(e.insertBefore(ge(), r), r, void 0, t ?? {});
  }
  return s._$AI(n), s;
};
const Ge = globalThis;
let pe = class extends oe {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ci(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return J;
  }
};
pe._$litElement$ = !0, pe.finalized = !0, Ge.litElementHydrateSupport?.({ LitElement: pe });
const ki = Ge.litElementPolyfillSupport;
ki?.({ LitElement: pe });
(Ge.litElementVersions ??= []).push("4.2.2");
function Ce(n, e, t = n) {
  let i = n.meter.voltage_references.length * 2, s = 0, r = 0, a = 0;
  for (const o of n.channels) if (o.enabled) {
    const c = Math.floor((o.channel - 1) / 6);
    if (c >= e.board_count) throw new Error("configuration topology is invalid");
    a += 1, i += 2 + (t.power_quality[c] ? 4 : 0), s += Number(t.status_fields[c]);
  }
  for (const o of n.aggregates)
    i += Number(o.expose_power) + Number(o.expose_current), o.energy_mode === "bidirectional" ? (i += 4, r += 2) : o.energy_mode !== "none" && (i += 1, r += 1);
  return { enabled_channel_count: a, numeric_entity_count: i, text_entity_count: s, energy_entity_count: r, approximate_publications_per_second: (i + s) / n.meter.update_interval_s };
}
const dt = "circuitsetup_energy_meter_helper/", Si = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, Ai = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, xi = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, Ei = /[\u0000-\u001f\u007f-\u009f]/, Ti = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), Ii = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), Ri = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "partial", "indeterminate", "verified", "cancelled"]), We = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), Ot = /* @__PURE__ */ new Set(["split_phase_120_240", "single_phase_230", "three_phase", "custom"]), ht = /* @__PURE__ */ new Set(["standard", "multi_reference", "custom"]), ut = /* @__PURE__ */ new Set(["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"]), Oi = /* @__PURE__ */ new Set(["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"]), Mi = /* @__PURE__ */ new Set(["none", "consumption", "bidirectional", "generation"]), qi = /* @__PURE__ */ new Set([1, 2, 5, 10, 30, 60]), pt = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), Se = /* @__PURE__ */ new Set(["A", "B", "C"]), Pi = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), Ui = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), Di = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), Ni = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), Bi = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), Fi = /^(?:meter|voltage_reference|channel|aggregate|package)\.[a-z0-9_.-]+$/, zi = /^[0-9a-f]{12}$/, Ie = /^[0-9a-f]{64}$/, De = /^[0-9a-f]{32}$/, Hi = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, Mt = /^[a-z0-9][a-z0-9_-]{0,127}$/, qt = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, ft = /* @__PURE__ */ new Set(["preview_ct_config", "preview_meter_configuration", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "abandon_ct_config", "rollback_ct_config", "subscribe_config_transaction"]), ji = /* @__PURE__ */ new Set(["available", "unavailable", "invalid"]), Li = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial"]), Vi = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial", "indeterminate"]), Gi = /* @__PURE__ */ new Set(["applied_pending_restart_verification", "partial", "indeterminate"]);
function E(n, e) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function R(n, e, t = 100) {
  if (!Array.isArray(n) || n.length > t) throw new Error(`${e} response is invalid`);
  return n;
}
function S(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${e} response is invalid`);
  return n;
}
function V(n, e) {
  const t = S(n, e);
  if (t.length > 128) throw new Error(`${e} response is invalid`);
  return t;
}
function U(n, e) {
  if (typeof n != "number" || !Number.isFinite(n)) throw new Error(`${e} response is invalid`);
  return n;
}
function I(n, e) {
  const t = U(n, e);
  if (!Number.isInteger(t)) throw new Error(`${e} response is invalid`);
  return t;
}
function N(n, e, t = !1) {
  if (t && n === null) return null;
  if (typeof n != "boolean") throw new Error(`${e} response is invalid`);
  return n;
}
function B(n, e, t) {
  const i = S(n, t);
  if (!e.has(i)) throw new Error(`${t} response is invalid`);
  return i;
}
function Ne(n, e) {
  n !== void 0 && S(n, e, !0);
}
function K(n, e) {
  return Math.abs(n - e) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(e));
}
function D(n, e, t) {
  const i = Object.keys(n);
  if (i.length !== e.length || i.some((s) => !e.includes(s))) throw new Error(`${t} response is invalid`);
}
function se(n, e) {
  return n.length === e.length && n.every((t, i) => t === e[i]);
}
function Pt(n, e) {
  const t = E(n, e);
  S(t.entry_id, e), S(t.title, e), S(t.project_name, e), S(t.project_version, e, !0), N(t.importable, e, !0), S(t.configuration, e, !0);
}
function $e(n, e) {
  const t = E(n, e);
  if (B(t.state, Ti, e), R(t.devices, e).forEach((i) => Pt(i, e)), t.configuration_authoritative !== void 0 && N(t.configuration_authoritative, e), t.bound_device_id !== void 0 && t.bound_device_id !== null && S(t.bound_device_id, e), t.installer_intent !== void 0) {
    const i = E(t.installer_intent, e), s = I(i.addon_count, e);
    if (s < 0 || s > 6) throw new Error(`${e} response is invalid`);
    if (B(i.connection_type, We, e) === "unknown") throw new Error(`${e} response is invalid`);
    if (i.power_quality === void 0 != (i.status_fields === void 0))
      throw new Error(`${e} response is invalid`);
    i.power_quality !== void 0 && Ut(i, e, s + 1);
    const a = i.firmware_product_id, o = i.esphome_version;
    if (a === void 0 != (o === void 0) || a !== void 0 && (typeof a != "string" || a.length > 160 || !Mt.test(a)) || o !== void 0 && (typeof o != "string" || o.length > 160 || !qt.test(o)))
      throw new Error(`${e} response is invalid`);
    if (i.electrical_system === void 0 != (i.line_frequency_hz === void 0) || i.electrical_system !== void 0 && (!Ot.has(i.electrical_system) || ![50, 60].includes(I(i.line_frequency_hz, e))))
      throw new Error(`${e} response is invalid`);
  }
  return n;
}
function Be(n, e) {
  const t = E(n, e);
  D(t, ["addon_count", "board_count", "ct_count", "group_count", "connection_type", "voltage_layout", "project_name", "evidence"], e);
  const i = I(t.addon_count, e), s = I(t.board_count, e), r = I(t.ct_count, e), a = I(t.group_count, e);
  if (i < 0 || i > 6 || s < 1 || s > 7 || r < 6 || r > 42 || a < 2 || a > 14 || s !== i + 1 || r !== 6 * s || a !== 2 * s) throw new Error(`${e} response is invalid`);
  B(t.connection_type, We, e), S(t.voltage_layout, e), S(t.project_name, e);
  const o = R(t.evidence, e);
  if (o.length < 1 || o.length > pt.size) throw new Error(`${e} response is invalid`);
  const c = o.map((l) => {
    const h = E(l, e);
    D(h, ["source", "addon_count", "detail"], e);
    const u = B(h.source, pt, e), m = I(h.addon_count, e);
    if (m < 0 || m > 6) throw new Error(`${e} response is invalid`);
    return S(h.detail, e), u;
  });
  if (new Set(c).size !== c.length || !c.some((l) => Bi.has(l))) throw new Error(`${e} response is invalid`);
  return n;
}
function Wi(n, e) {
  const t = E(n, e);
  if ("topology" in t) {
    const i = Be(t.topology, e);
    return t.configuration_authoritative !== void 0 && N(t.configuration_authoritative, e), t.package_options !== void 0 && Ut(t.package_options, e, i.board_count), n;
  }
  return Be(n, e);
}
function Ki(n, e) {
  const t = E(n, e);
  D(t, ["plan_id", "source_sha256", "topology", "configuration", "capabilities", "voltage_topology", "voltage_transformer_catalog", "ct_catalog", "warnings", "configuration_impact", "channels", "catalog"], e);
  const i = S(t.plan_id, e);
  if (!De.test(i) || !Ie.test(S(t.source_sha256, e))) throw new Error(`${e} response is invalid`);
  const s = Be(t.topology, e), r = E(t.configuration, e);
  D(r, ["meter", "channels", "aggregates", "power_quality", "status_fields", "multi_reference_preparation_acknowledged"], e);
  const a = E(r.meter, e);
  D(a, ["friendly_name", "electrical_system", "line_frequency_hz", "update_interval_s", "voltage_layout", "voltage_references"], e), S(a.friendly_name, e), B(a.electrical_system, Ot, e);
  const o = I(a.line_frequency_hz, e);
  if (o !== 50 && o !== 60) throw new Error(`${e} response is invalid`);
  const c = I(a.update_interval_s, e);
  if (!qi.has(c) || !ht.has(B(a.voltage_layout, ht, e))) throw new Error(`${e} response is invalid`);
  const l = R(a.voltage_references, e, 8).map((C) => {
    const w = E(C, e);
    D(w, ["reference_id", "label", "phase_label", "nominal_voltage_v", "transformer_model_id", "gain_voltage", "group_keys"], e);
    const $ = V(w.reference_id, e), q = S(w.label, e);
    S(w.phase_label, e);
    const z = U(w.nominal_voltage_v, e);
    if (z < 1 || z > 600) throw new Error(`${e} response is invalid`);
    V(w.transformer_model_id, e);
    const L = I(w.gain_voltage, e);
    if (L < 1 || L > 65535) throw new Error(`${e} response is invalid`);
    const j = R(w.group_keys, e, 14).map((F) => V(F, e));
    if (!j.length) throw new Error(`${e} response is invalid`);
    return { reference_id: $, label: q, group_keys: j };
  });
  if (!l.length || new Set(l.map((C) => C.reference_id)).size !== l.length)
    throw new Error(`${e} response is invalid`);
  const h = Array.from({ length: s.board_count }, (C, w) => w === 0 ? ["main_1", "main_2"] : [`addon${w}_1`, `addon${w}_2`]).flat(), u = l.flatMap((C) => C.group_keys);
  if (u.length !== s.group_count || new Set(u).size !== u.length || !se([...u].sort(), [...h].sort())) throw new Error(`${e} response is invalid`);
  const m = R(r.channels, e, 42);
  if (m.length !== s.ct_count) throw new Error(`${e} response is invalid`);
  m.forEach((C, w) => {
    const $ = E(C, e);
    D($, ["channel", "enabled", "name", "model_id", "reporting_multiplier", "role", "voltage_reference_id", "custom_gain_ct", "custom_label", "burden_output_acknowledged"], e);
    const q = V($.voltage_reference_id, e), z = Math.floor(w / 6), L = Math.floor(w % 6 / 3) + 1, j = z === 0 ? `main_${L}` : `addon${z}_${L}`, F = l.find((le) => le.group_keys.includes(j))?.reference_id;
    if (I($.channel, e) !== w + 1 || ![1, 2, 4, 8].includes(U($.reporting_multiplier, e)) || q !== F) throw new Error(`${e} response is invalid`);
    const H = N($.enabled, e);
    S($.name, e), V($.model_id, e);
    const W = B($.role, ut, e);
    if (H && W === "unused" || !H && W !== "unused") throw new Error(`${e} response is invalid`);
    if ($.custom_gain_ct !== null && (I($.custom_gain_ct, e) < 1 || I($.custom_gain_ct, e) > 65535)) throw new Error(`${e} response is invalid`);
    $.custom_label !== null && S($.custom_label, e), N($.burden_output_acknowledged, e);
  });
  const y = /* @__PURE__ */ new Set(), b = /* @__PURE__ */ new Set(), v = /* @__PURE__ */ new Map();
  R(r.aggregates, e, 32).forEach((C) => {
    const w = E(C, e);
    D(w, ["aggregate_id", "name", "role", "channels", "measurement_method", "parent_id", "energy_mode", "expose_power", "expose_current"], e);
    const $ = V(w.aggregate_id, e);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test($) || y.has($)) throw new Error(`${e} response is invalid`);
    y.add($), S(w.name, e), B(w.role, ut, e);
    const q = R(w.channels, e, 42).map((F) => I(F, e)), z = B(w.measurement_method, Oi, e), L = z === "two_ct_sum" ? 2 : z === "one_ct_double_power" || z === "both_conductors_one_ct" ? 1 : void 0;
    if (!q.length || new Set(q).size !== q.length || q.some((F) => F < 1 || F > s.ct_count || b.has(F) || !N(E(m[F - 1], e).enabled, e)) || L !== void 0 && q.length !== L) throw new Error(`${e} response is invalid`);
    q.forEach((F) => b.add(F));
    const j = w.parent_id === null ? null : V(w.parent_id, e);
    v.set($, j), B(w.energy_mode, Mi, e), N(w.expose_power, e), N(w.expose_current, e);
  });
  for (const [C, w] of v) {
    const $ = /* @__PURE__ */ new Set();
    for (let q = w; q !== null; q = v.get(q) ?? null) {
      if (!y.has(q) || q === C || $.has(q)) throw new Error(`${e} response is invalid`);
      $.add(q);
    }
  }
  for (const C of ["power_quality", "status_fields"]) {
    const w = R(r[C], e, 7);
    if (w.length !== s.board_count) throw new Error(`${e} response is invalid`);
    w.forEach(($) => N($, e));
  }
  N(r.multi_reference_preparation_acknowledged, e);
  const O = E(t.capabilities, e);
  D(O, ["configuration_authoritative", "managed_totals", "multi_reference", "reason_codes"], e), N(O.configuration_authoritative, e), N(O.managed_totals, e), N(O.multi_reference, e), R(O.reason_codes, e, 8).forEach((C) => S(C, e));
  const p = E(t.voltage_topology, e);
  D(p, ["references", "source"], e), B(p.source, /* @__PURE__ */ new Set(["helper", "legacy"]), e);
  const f = R(p.references, e, 8).map((C) => {
    const w = R(C, e, 2);
    if (w.length !== 2) throw new Error(`${e} response is invalid`);
    const $ = V(w[0], e), q = R(w[1], e, 14).map((z) => V(z, e));
    if (!q.length) throw new Error(`${e} response is invalid`);
    return [$, q];
  });
  if (f.length !== l.length || !se(f.map(([C]) => C), l.map((C) => C.reference_id)) || !f.every(([C, w], $) => se(w, l[$].group_keys))) throw new Error(`${e} response is invalid`);
  const g = E(t.voltage_transformer_catalog, e);
  if (D(g, ["presets", "source_repository", "source_ref", "schema_version"], e), S(g.source_repository, e), !/^[0-9a-f]{40}$/.test(S(g.source_ref, e)) || I(g.schema_version, e) !== 1) throw new Error(`${e} response is invalid`);
  const _ = R(g.presets, e, 64);
  if (!_.length) throw new Error(`${e} response is invalid`);
  const k = /* @__PURE__ */ new Set();
  _.forEach((C) => {
    const w = E(C, e);
    D(w, ["model_id", "label", "primary_nominal_v", "secondary_nominal_v", "default_gain_voltage", "notes"], e);
    const $ = V(w.model_id, e);
    if (k.has($)) throw new Error(`${e} response is invalid`);
    if (k.add($), S(w.label, e), U(w.primary_nominal_v, e) <= 0 || U(w.secondary_nominal_v, e) <= 0) throw new Error(`${e} response is invalid`);
    const q = I(w.default_gain_voltage, e);
    if (q < 1 || q > 65535) throw new Error(`${e} response is invalid`);
    S(w.notes, e);
  }), Fe({ plan_id: t.plan_id, source_sha256: t.source_sha256, channels: t.channels, catalog: t.catalog }, e);
  const x = E(t.ct_catalog, e);
  D(x, ["presets", "source_repository", "source_ref", "schema_version"], e), Fe({ plan_id: t.plan_id, source_sha256: t.source_sha256, channels: t.channels, catalog: t.ct_catalog }, e), R(t.warnings, e, 32).map((C) => S(C, e));
  const A = E(t.configuration_impact, e);
  D(A, ["enabled_channel_count", "numeric_entity_count", "text_entity_count", "energy_entity_count", "approximate_publications_per_second"], e);
  for (const C of ["enabled_channel_count", "numeric_entity_count", "text_entity_count", "energy_entity_count"]) if (I(A[C], e) < 0) throw new Error(`${e} response is invalid`);
  const P = U(A.approximate_publications_per_second, e);
  if (P < 0) throw new Error(`${e} response is invalid`);
  const T = Ce(t.configuration, s);
  if (A.enabled_channel_count !== T.enabled_channel_count || A.numeric_entity_count !== T.numeric_entity_count || A.text_entity_count !== T.text_entity_count || A.energy_entity_count !== T.energy_entity_count || Math.abs(P - T.approximate_publications_per_second) > Number.EPSILON * Math.max(1, P, T.approximate_publications_per_second) * 8) throw new Error(`${e} response is invalid`);
  return n;
}
function Ut(n, e, t) {
  const i = E(n, e);
  for (const s of ["power_quality", "status_fields"]) {
    const r = R(i[s], e, 7);
    if (r.length !== t) throw new Error(`${e} response is invalid`);
    r.forEach((a) => N(a, e));
  }
  return n;
}
function Fe(n, e) {
  const t = E(n, e);
  if (D(t, ["plan_id", "source_sha256", "channels", "catalog"], e), S(t.plan_id, e), !Ie.test(S(t.source_sha256, e))) throw new Error(`${e} response is invalid`);
  const i = R(t.channels, e);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${e} response is invalid`);
  i.forEach((a, o) => {
    const c = E(a, e);
    D(c, ["channel", "name", "raw_gain_ct", "reporting_multiplier", "selected_model_id", "selection_verified_against_config", "address", "display_label", "stored_selection_present"], e);
    const l = I(c.channel, e);
    S(c.name, e), I(c.raw_gain_ct, e), U(c.reporting_multiplier, e), Ne(c.selected_model_id, e), N(c.selection_verified_against_config, e), Ne(c.display_label, e), N(c.stored_selection_present, e);
    const h = E(c.address, e);
    D(h, ["channel", "board_index", "group_index", "phase"], e);
    const u = I(h.channel, e), m = I(h.board_index, e), y = I(h.group_index, e), b = B(h.phase, Se, e), v = o + 1;
    if (l !== v || u !== v || m !== Math.floor(o / 6) || y !== Math.floor(o % 6 / 3) || b !== ["A", "B", "C"][o % 3]) throw new Error(`${e} response is invalid`);
  });
  const s = E(t.catalog, e);
  D(s, ["presets", "source_repository", "source_ref", "schema_version"], e), S(s.source_repository, e), S(s.source_ref, e), I(s.schema_version, e);
  const r = R(s.presets, e);
  if (r.length > 64) throw new Error(`${e} response is invalid`);
  return r.forEach((a) => {
    const o = E(a, e);
    D(o, ["model_id", "label", "rated_current_a", "secondary", "default_gain_ct", "requires_burden_jumper_cut", "notes"], e), S(o.model_id, e), S(o.label, e), U(o.rated_current_a, e), S(o.secondary, e), o.default_gain_ct !== null && I(o.default_gain_ct, e), N(o.requires_burden_jumper_cut, e), S(o.notes, e);
  }), n;
}
function ae(n, e) {
  const t = E(n, e);
  if (D(t, ["transaction_id", "state", "source_sha256", "changes", "redacted_diff", "rollback_available", "evidence", "progress", "validation_detail", "upload_progress", "aggregate_entity_mismatch", "full_meter_configuration_verified"], e), S(t.transaction_id, e), B(t.state, Ii, e), !Ie.test(S(t.source_sha256, e))) throw new Error(`${e} response is invalid`);
  if (N(t.rollback_available, e), typeof t.redacted_diff != "string") throw new Error(`${e} response is invalid`);
  if (R(t.changes, e).forEach((i) => {
    const s = E(i, e);
    D(s, ["key", "old_value", "new_value"], e);
    const r = S(s.key, e);
    if (!Fi.test(r)) throw new Error(`${e} response is invalid`);
    s.old_value !== null && S(s.old_value, e), S(s.new_value, e);
  }), R(t.evidence, e).forEach((i) => B(i, Ui, e)), R(t.progress, e).forEach((i) => B(i, Di, e)), t.validation_detail !== null) {
    const i = E(t.validation_detail, e);
    D(i, ["code", "reported_error_count", "reported_warning_count", "error_record_count", "warning_record_count"], e);
    for (const s of ["reported_error_count", "reported_warning_count"]) i[s] !== null && I(i[s], e);
    i.code !== null && I(i.code, e), I(i.error_record_count, e), I(i.warning_record_count, e);
  }
  return R(t.upload_progress, e).forEach((i) => {
    const s = E(i, e);
    if (D(s, ["stage", "percentage"], e), B(s.stage, Pi, e), s.percentage !== null) {
      const r = I(s.percentage, e);
      if (r < 0 || r > 100) throw new Error(`${e} response is invalid`);
    }
  }), N(t.aggregate_entity_mismatch, e), N(t.full_meter_configuration_verified, e), n;
}
function Y(n, e) {
  const t = E(n, e);
  S(t.session_id, e), S(t.device_id, e), B(t.state, Ri, e), N(t.safety_acknowledged, e);
  const i = E(t.preflight, e);
  R(i.issues, e).forEach((u) => {
    const m = E(u, e);
    B(m.code, Ni, e), S(m.role, e), S(m.detail, e);
  }), R(i.zeroed_roles, e).forEach((u) => S(u, e)), t.entity_role_counts !== void 0 && Object.values(E(t.entity_role_counts, e)).forEach((u) => {
    if (I(u, e) < 0) throw new Error(`${e} response is invalid`);
  }), t.calibration_sources !== void 0 && Object.values(E(t.calibration_sources, e)).forEach((u) => B(u, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), e));
  const s = [t.offset_capability, t.offset_disposition, t.offset_boards, t.has_pending_calibration];
  if (s.every((u) => u === void 0)) return n;
  if (s.some((u) => u === void 0)) throw new Error(`${e} response is invalid`);
  const r = E(t.offset_capability, e);
  if (D(r, ["status", "repair_reason"], e), B(r.status, ji, e) === "invalid") S(r.repair_reason, e);
  else if (r.repair_reason !== null) throw new Error(`${e} response is invalid`);
  const o = B(t.offset_disposition, Li, e), c = R(t.offset_boards, e, 7);
  if (c.length < 1) throw new Error(`${e} response is invalid`);
  const l = [];
  c.forEach((u, m) => {
    const y = E(u, e);
    if (D(y, ["board_index", "stages"], e), I(y.board_index, e) !== m) throw new Error(`${e} response is invalid`);
    const b = R(y.stages, e, 2);
    if (b.length !== 2) throw new Error(`${e} response is invalid`);
    b.forEach((v, O) => {
      const p = E(v, e);
      if (D(p, ["stage", "state"], e), I(p.stage, e) !== O + 1) throw new Error(`${e} response is invalid`);
      l.push(B(p.state, Vi, e));
    });
  });
  const h = l.every((u) => u === "skipped") ? "skipped" : l.every((u) => u === "completed") ? "completed" : l.every((u) => u === "not_started") ? "not_started" : l.some((u) => u === "partial" || u === "indeterminate") || l.some((u) => u === "skipped") ? "partial" : "in_progress";
  if (o !== h) throw new Error(`${e} response is invalid`);
  return N(t.has_pending_calibration, e), n;
}
function Yi(n, e, t, i) {
  const s = E(n, e);
  if (D(s, ["stage", "ready", "connection_generation", "entities", "reasons", "thresholds"], e), I(s.stage, e) !== i || t < 0 || t > 6) throw new Error(`${e} response is invalid`);
  const r = N(s.ready, e), a = I(s.connection_generation, e);
  if (a < 1) throw new Error(`${e} response is invalid`);
  const o = E(s.thresholds, e);
  D(o, ["sample_count", "zero_voltage_peak_volts", "zero_voltage_spread_volts", "zero_current_peak_amps", "zero_current_spread_amps", "voltage_present_minimum_volts", "voltage_present_spread_volts"], e);
  const c = I(o.sample_count, e), l = U(o.zero_voltage_peak_volts, e), h = U(o.zero_voltage_spread_volts, e), u = U(o.zero_current_peak_amps, e), m = U(o.zero_current_spread_amps, e), y = U(o.voltage_present_minimum_volts, e), b = U(o.voltage_present_spread_volts, e), v = [
    l,
    h,
    u,
    m,
    y,
    b
  ];
  if (c < 3 || c > 100 || v.some((w) => w < 0) || v[4] === 0) throw new Error(`${e} response is invalid`);
  const O = R(s.entities, e, 12);
  if (O.length !== 12) throw new Error(`${e} response is invalid`);
  const p = /* @__PURE__ */ new Map();
  for (const w of [0, 1]) {
    const $ = t === 0 ? `main_${w + 1}` : `addon${t}_${w + 1}`;
    for (const q of ["a", "b", "c"]) p.set(`${$}.voltage_${q}`, "voltage");
    for (let q = 1; q <= 3; ++q) p.set(`ct${t * 6 + w * 3 + q}.current_sensor`, "current");
  }
  const f = "entity binding is not on the active connection generation", g = "fresh window unavailable: ", _ = /* @__PURE__ */ new Set(), k = [];
  let x = 0;
  O.forEach((w) => {
    const $ = E(w, e);
    D($, ["role", "quantity", "ready", "reasons", "window"], e);
    const q = S($.role, e), z = B($.quantity, /* @__PURE__ */ new Set(["voltage", "current"]), e);
    if (_.has(q) || p.get(q) !== z) throw new Error(`${e} response is invalid`);
    _.add(q);
    const L = N($.ready, e), j = R($.reasons, e, 12).map((H) => S(H, e));
    let F;
    if ($.window === null) {
      if (L || j.length !== 1) throw new Error(`${e} response is invalid`);
      if (j[0] === f) ++x;
      else if (!j[0].startsWith(g) || j[0].slice(g.length).trim().length === 0)
        throw new Error(`${e} response is invalid`);
      F = j;
    } else {
      const H = E($.window, e);
      D(H, ["values", "received_at", "connection_generation", "mean", "minimum", "maximum", "absolute_peak", "absolute_spread"], e);
      const W = R(H.values, e, c).map((Q) => U(Q, e)), le = R(H.received_at, e, c).map((Q) => U(Q, e)), Qt = U(H.mean, e), Oe = U(H.minimum, e), Je = U(H.maximum, e), Me = U(H.absolute_peak, e), be = U(H.absolute_spread, e), ei = W.reduce((Q, we) => Q + we, 0) / W.length, ti = I(H.connection_generation, e);
      if (W.length !== c || le.length !== c || le.some((Q, we) => we > 0 && Q <= le[we - 1]) || !K(Qt, ei) || !K(Oe, Math.min(...W)) || !K(Je, Math.max(...W)) || !K(Me, Math.max(...W.map(Math.abs))) || !K(be, Je - Oe)) throw new Error(`${e} response is invalid`);
      F = [], ti !== a ? F.push("window is from another connection generation") : z === "current" ? (Me > u && F.push("absolute peak exceeds zero_current_peak_amps"), be > m && F.push("absolute spread exceeds zero_current_spread_amps")) : i === 1 ? (Me > l && F.push("absolute peak exceeds zero_voltage_peak_volts"), be > h && F.push("absolute spread exceeds zero_voltage_spread_volts")) : (Oe < y && F.push("minimum is below voltage_present_minimum_volts"), be > b && F.push("absolute spread exceeds voltage_present_spread_volts"));
    }
    if (!se(j, F) || L !== (F.length === 0)) throw new Error(`${e} response is invalid`);
    k.push(...F.map((H) => `${q}: ${H}`));
  });
  const A = R(s.reasons, e, 100).map((w) => S(w, e)), P = [...k, "connection generation changed while collecting readiness"], C = x === O.length && se(A, [f]) || x === 0 && (se(A, k) || se(A, P));
  if (_.size !== p.size || !C || r !== (A.length === 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function Dt(n, e) {
  const t = R(n, e, 3);
  if (t.length !== 3) throw new Error(`${e} response is invalid`);
  return t.forEach((i) => {
    const s = R(i, e, 2);
    if (s.length !== 2 || s.some((r) => {
      const a = I(r, e);
      return a < -32768 || a > 32767;
    })) throw new Error(`${e} response is invalid`);
  }), n;
}
function Zi(n, e, t, i) {
  const s = E(n, e);
  D(s, ["state", "board_index", "stage", "expected_tables", "unfinished_group_keys", "retry_allowed", "error"], e);
  const r = B(s.state, Gi, e);
  if (I(s.board_index, e) !== t || I(s.stage, e) !== i) throw new Error(`${e} response is invalid`);
  const a = t === 0 ? ["main_1", "main_2"] : [`addon${t}_1`, `addon${t}_2`], o = R(s.expected_tables, e, 2).map((u) => {
    const m = R(u, e, 2);
    if (m.length !== 2) throw new Error(`${e} response is invalid`);
    const y = S(m[0], e);
    if (!a.includes(y)) throw new Error(`${e} response is invalid`);
    return Dt(m[1], e), y;
  }), c = R(s.unfinished_group_keys, e, 2).map((u) => S(u, e)), l = [...o, ...c], h = N(s.retry_allowed, e);
  if (l.length !== 2 || new Set(l).size !== 2 || l.some((u) => !a.includes(u))) throw new Error(`${e} response is invalid`);
  if (r === "applied_pending_restart_verification") {
    if (o.length !== 2 || c.length !== 0 || h || s.error !== null) throw new Error(`${e} response is invalid`);
  } else if (S(s.error, e), !h || o.length !== (r === "partial" ? 1 : 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function Xi(n, e, t, i) {
  const s = E(n, e), r = B(s.target, /* @__PURE__ */ new Set(["voltage", "current"]), e);
  S(s.target_id, e);
  const a = N(s.stable, e);
  if (r !== t || s.target_id !== i) throw new Error(`${e} response is invalid`);
  const o = R(s.windows, e, r === "voltage" ? 42 : 1);
  if (r === "voltage" ? o.length < 3 || o.length % 3 !== 0 : o.length !== 1) throw new Error(`${e} response is invalid`);
  const c = o.map((l) => {
    const h = E(l, e), u = R(h.samples, e, 1).map((f) => U(f, e));
    if (u.length !== 1) throw new Error(`${e} response is invalid`);
    const m = U(h.mean, e), y = U(h.standard_deviation, e), b = U(h.range_percent, e), v = u.reduce((f, g) => f + g, 0) / u.length, O = Math.sqrt(u.reduce((f, g) => f + (g - v) ** 2, 0) / u.length), p = 100 * (Math.max(...u) - Math.min(...u)) / Math.abs(v);
    if (!K(m, v) || !K(y, O) || !K(b, p)) throw new Error(`${e} response is invalid`);
    return b;
  });
  if (a !== c.every((l) => l <= 1)) throw new Error(`${e} response is invalid`);
  return n;
}
function gt(n, e, t) {
  const i = E(n, e), s = B(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e);
  S(i.group_key, e), i.phase !== null && B(i.phase, Se, e);
  const r = I(i.iteration, e), a = R(i.changed_channels, e, 3).map((b) => I(b, e)), o = R(i.before_values, e, 3), c = R(i.after_values, e, 3), l = R(i.error_percent_values, e, 3);
  for (const b of [o, c, l]) b.forEach((v) => U(v, e));
  const h = t.target === "voltage" ? t.groupKey : Ke(t.references[0].channel), u = t.target === "voltage" ? Qi(t.groupKey) : t.references.map((b) => b.channel), m = t.target === "current" && t.references.length === 1 ? ["A", "B", "C"][(t.references[0].channel - 1) % 3] : null, y = N(i.retry_allowed, e);
  if (t.target === "voltage" && (!Number.isFinite(t.reference) || t.reference <= 0) || t.target === "current" && t.references.some((b) => !Number.isFinite(b.reference) || b.reference <= 0 || !Number.isFinite(b.rawReference) || b.rawReference <= 0) || ![1, 2, 3].includes(a.length) || s !== "indeterminate" && o.length !== a.length || new Set(a).size !== a.length || a.some((b) => b < 1 || b > 42) || r < 1 || r > 3 || i.group_key !== h || i.phase !== m || a.length !== u.length || a.some((b, v) => b !== u[v]) || (s === "indeterminate" ? c.length !== 0 || l.length !== 0 : c.length !== a.length || l.length !== a.length)) throw new Error(`${e} response is invalid`);
  if (s === "indeterminate") {
    if (i.gain_evidence !== null || y) throw new Error(`${e} response is invalid`);
    i.restore_evidence != null && E(i.restore_evidence, e);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${e} response is invalid`);
    Ji(i.gain_evidence, e, t);
    const b = t.target === "voltage" ? c.map(() => t.reference) : t.references.map((p) => p.reference), v = c.map((p, f) => 100 * Math.abs(U(p, e) - b[f]) / b[f]);
    if (l.some((p, f) => U(p, e) < 0 || !K(U(p, e), v[f]))) throw new Error(`${e} response is invalid`);
    const O = Math.max(...v) > 1;
    if (s === "result_outside_tolerance" !== O || y !== (O && r < 3)) throw new Error(`${e} response is invalid`);
  }
  return n;
}
function Ke(n) {
  const e = Math.floor((n - 1) / 6), t = Math.floor((n - 1) % 6 / 3) + 1;
  return e === 0 ? `main_${t}` : `addon${e}_${t}`;
}
function Ji(n, e, t) {
  const i = E(n, e), s = I(i.connection_generation, e), r = I(i.operation_sequence, e), a = t.target === "voltage" ? t.groupKey : Ke(t.references[0].channel), o = a.startsWith("main_") ? `meter_main${a.slice(-1)}` : a;
  if (s < 1 || r < 1 || S(i.instance_id, e) !== o) throw new Error(`${e} response is invalid`);
  const c = t.target === "current" ? new Map(t.references.map((m) => [["A", "B", "C"][(m.channel - 1) % 3], m.rawReference])) : /* @__PURE__ */ new Map(), l = R(i.phases, e, 3);
  if (l.length !== 3) throw new Error(`${e} response is invalid`);
  l.forEach((m, y) => {
    const b = E(m, e), v = B(b.phase, Se, e);
    if (v !== ["A", "B", "C"][y]) throw new Error(`${e} response is invalid`);
    U(b.measured_voltage, e), U(b.measured_current, e);
    const O = U(b.reference_voltage, e), p = U(b.reference_current, e), f = I(b.old_voltage_gain, e), g = I(b.new_voltage_gain, e), _ = I(b.old_current_gain, e), k = I(b.new_current_gain, e);
    if ([f, g, _, k].some((x) => x < 1 || x > 65535)) throw new Error(`${e} response is invalid`);
    if (t.target === "voltage") {
      if (Math.abs(O - t.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(O), t.reference)) || Math.abs(p) > 1e-6 || _ !== k) throw new Error(`${e} response is invalid`);
    } else {
      const x = c.get(v);
      if (Math.abs(O) > 1e-6 || (x === void 0 ? Math.abs(p) > 1e-6 : Math.abs(p - x) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(p), x))) || f !== g || x === void 0 && _ !== k) throw new Error(`${e} response is invalid`);
    }
  });
  const h = R(i.register_mismatch_phases, e, 3);
  h.forEach((m) => B(m, Se, e));
  const u = R(i.matching_lines, e, 100);
  if (u.length === 0 || u.some((m) => typeof m != "string") || N(i.flash_saved, e) !== !0 || h.length !== 0 || N(i.calibration_disabled, e) !== !1) throw new Error(`${e} response is invalid`);
}
function Qi(n) {
  const e = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(n);
  if (!e) return [];
  const t = e[2] === void 0 ? 0 : Number(e[2]), i = Number(e[1] ?? e[3]), s = t * 6 + (i - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}
function ze(n, e, t) {
  const i = E(n, e);
  for (const b of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) S(i[b], e);
  const s = I(i.topology_addon_count, e);
  B(i.topology_connection_type, We, e);
  const r = I(i.connection_generation, e), a = B(i.source_authority, /* @__PURE__ */ new Set(["saved_flash", "configuration"]), e), o = N(i.source_handoff_available, e), c = N(i.source_handoff_firmware_installed, e);
  Ne(i.source_handoff_transaction_id, e);
  const l = i.config_filename !== null || i.config_sha256 !== null;
  if (l && (S(i.config_filename, e), S(i.config_sha256, e), !Hi.test(i.config_filename) || !Ie.test(i.config_sha256)))
    throw new Error(`${e} response is invalid`);
  if (i.config_filename === null != (i.config_sha256 === null)) throw new Error(`${e} response is invalid`);
  if (!zi.test(i.mac) || !De.test(i.verification_id) || r < 1 || i.source_handoff_transaction_id !== null && !De.test(i.source_handoff_transaction_id) || s !== t.addon_count || i.topology_project_name !== t.project_name || i.topology_connection_type !== t.connection_type || i.topology_voltage_layout !== t.voltage_layout) throw new Error(`${e} response is invalid`);
  const h = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: s }, (b, v) => [`addon${v + 1}_1`, `addon${v + 1}_2`]).flat()]), u = (b, v, O) => {
    const p = R(i[b] ?? [], e, 14), f = /* @__PURE__ */ new Set();
    return p.forEach((g) => {
      const _ = E(g, e);
      D(_, ["instance_id", v], e);
      const k = S(_.instance_id, e);
      if (!h.has(k) || f.has(k)) throw new Error(`${e} response is invalid`);
      if (f.add(k), O) Dt(_[v], e);
      else {
        const x = R(_[v], e, 3);
        if (x.length !== 3) throw new Error(`${e} response is invalid`);
        x.forEach((A) => {
          const P = R(A, e, 2);
          if (P.length !== 2 || P.some((T) => {
            const C = I(T, e);
            return C < 1 || C > 65535;
          })) throw new Error(`${e} response is invalid`);
        });
      }
    }), p.length;
  }, m = u("groups", "phase_gains", !1), y = u("offset_groups", "phase_offsets", !0) + u("power_offset_groups", "phase_power_offsets", !0);
  if (m + y < 1 || o && (!l || c || i.source_handoff_transaction_id !== null || a !== "saved_flash" || y > 0) || !o && l && i.source_handoff_transaction_id === null && y === 0 || c && (!l || i.source_handoff_transaction_id === null || y > 0) || a === "configuration" && (!c || o || y > 0)) throw new Error(`${e} response is invalid`);
  return n;
}
function es(n, e, t) {
  const i = E(n, e);
  return i.session !== null && Y(i.session, e), i.transaction !== null && ae(i.transaction, e), i.verified_calibration !== null && ze(i.verified_calibration, e, t), n;
}
class Ae {
  constructor(e, t) {
    this.hass = e, this.entryId = t, this.setupStatus = () => this.call("setup_status", (i) => $e(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (R(i, "list_meters").forEach((s) => Pt(s, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (s) => Wi(s, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (s) => Fe(s, "get_ct_inventory"), { device_id: i }), this.getMeterConfiguration = (i) => this.call("get_meter_configuration", (s) => Ki(s, "get_meter_configuration"), { device_id: i }), this.getActiveWork = (i, s) => this.call("get_active_work", (r) => es(r, "get_active_work", s), { device_id: i }), this.getSession = (i) => this.call("get_session", (s) => Y(s, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => E(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, s, r, a, o, c) => this.call("set_installer_intent", (l) => $e(l, "set_installer_intent"), {
      addon_count: i,
      connection_type: s,
      ...a ?? {},
      ...r && r.productId.length <= 160 && r.version.length <= 160 && Mt.test(r.productId) && qt.test(r.version) ? { firmware_product_id: r.productId, esphome_version: r.version } : {},
      ...o != null && c !== null && c !== void 0 ? { electrical_system: o, line_frequency_hz: c } : {}
    }), this.rescan = () => this.call("rescan", (i) => $e(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (s) => {
      const r = E(s, "adopt_device");
      return S(r.device_id, "adopt_device"), S(r.configuration, "adopt_device"), s;
    }, { device_id: i }), this.previewCtConfig = (i, s, r, a, o) => this.call("preview_ct_config", (c) => ae(c, "preview_ct_config"), {
      device_id: i,
      plan_id: s,
      source_sha256: r,
      changes: a,
      ...o ? { package_options: o } : {}
    }), this.previewMeterConfiguration = (i, s, r, a) => this.call("preview_meter_configuration", (o) => ae(o, "preview_meter_configuration"), {
      device_id: i,
      plan_id: s,
      source_sha256: r,
      configuration: a
    }), this.setHaLabels = (i, s, r, a) => this.call("set_ha_labels", (o) => o, {
      device_id: i,
      plan_id: s,
      source_sha256: r,
      changes: a
    }), this.transaction = (i, s, r, a) => this.call(i, (o) => ae(o, i), {
      device_id: s,
      transaction_id: r,
      source_sha256: a
    }), this.applyCtConfig = (i, s, r) => this.transaction("apply_ct_config", i, s, r), this.compileCtConfig = (i, s, r) => this.transaction("compile_ct_config", i, s, r), this.installCtConfig = (i, s, r) => this.transaction("install_ct_config", i, s, r), this.abandonCtConfig = (i, s, r) => this.transaction("abandon_ct_config", i, s, r), this.rollbackCtConfig = (i, s, r) => this.transaction("rollback_ct_config", i, s, r), this.startSession = (i) => this.call("start_session", (s) => Y(s, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (s) => Y(s, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, r) => this.call("check_stability", (a) => Xi(a, "check_stability", s, r), { session_id: i, target: s, target_id: r }), this.checkOffsetReadiness = (i, s, r) => this.call("check_offset_readiness", (a) => Yi(a, "check_offset_readiness", s, r), {
      session_id: i,
      board_index: s,
      stage: r
    }), this.calibrateOffset = (i, s, r, a, o) => this.call("calibrate_offset", (c) => Zi(c, "calibrate_offset", s, r), {
      session_id: i,
      board_index: s,
      stage: r,
      preparation_acknowledged: a,
      confirm_retry: o
    }), this.skipOffsetCalibration = (i) => this.call("skip_offset_calibration", (s) => Y(s, "skip_offset_calibration"), { session_id: i }), this.calibrateVoltage = (i, s, r, a) => !s || !Number.isFinite(r) || r < 1 || r > 600 ? Promise.reject(new Error("calibrate_voltage reference is invalid")) : this.call("calibrate_voltage", (o) => R(o, "calibrate_voltage", 14).map((c) => gt(c, "calibrate_voltage", {
      target: "voltage",
      groupKey: S(E(c, "calibrate_voltage").group_key, "calibrate_voltage"),
      reference: r
    })), { session_id: i, reference_id: s, reference_voltage: r, confirm_iteration: a }), this.calibrateCurrent = (i, s, r, a = []) => s.length < 1 || s.length > 3 || new Set(s.map((o) => o.channel)).size !== s.length || new Set(s.map((o) => Ke(o.channel))).size !== 1 || s.some((o) => !Number.isInteger(o.channel) || o.channel < 1 || o.channel > 42 || !Number.isFinite(o.reference) || o.reference <= 0 || ![1, 2, 4, 8].includes(o.reporting_multiplier)) || a.some((o) => ![1, 2, 4, 8].includes(o.reporting_multiplier)) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (o) => gt(o, "calibrate_current", {
      target: "current",
      references: s.map((c) => ({ channel: c.channel, reference: c.reference, rawReference: c.reference / c.reporting_multiplier }))
    }), {
      session_id: i,
      references: s,
      confirm_iteration: r,
      pending_multipliers: a
    }), this.restartAndVerify = (i, s) => this.call("restart_and_verify", (r) => ze(r, "restart_and_verify", s), { session_id: i }), this.completeCalibrationWithoutChanges = (i) => this.call("complete_calibration_without_changes", (s) => {
      const r = Y(s, "complete_calibration_without_changes");
      if (r.session_id !== i || r.state !== "verified" || r.has_pending_calibration !== !1)
        throw new Error("complete_calibration_without_changes response is invalid");
      return r;
    }, { session_id: i }), this.previewCalibratedGains = (i, s, r = [], a) => this.call("preview_calibrated_gains", (o) => ae(o, "preview_calibrated_gains"), {
      session_id: i,
      verification_id: s,
      changes: r,
      ...a ? { package_options: a } : {}
    }), this.clearCalibrationFlash = (i, s, r, a) => this.call("clear_calibration_flash", (o) => ze(o, "clear_calibration_flash", a), {
      session_id: i,
      verification_id: s,
      transaction_id: r
    }), this.cancelSession = (i) => this.call("cancel_session", (s) => Y(s, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (s) => $e(s, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, s, r, a) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: s,
      source_sha256: r
    }, (o) => ae(o, "subscribe_config_transaction"), a), this.subscribeSession = (i, s) => this.subscribe("subscribe_session", { session_id: i }, (r) => Y(r, "subscribe_session"), s);
  }
  static assertPublicPayload(e, t = !1, i = 0, s = "", r = !1) {
    if (i > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(e)) {
      if (e.length > 100) throw new Error(`unsafe collection ${s || "value"} refused`);
      for (const a of e) this.assertPublicPayload(a, !1, i + 1, s);
      return;
    }
    if (typeof e == "string") {
      const a = e.includes(`
`) || e.includes("\r"), o = s === "redacted_diff" ? 32768 : 4096;
      if (e.length > o || xi.test(e) || Ai.test(e) || a && s !== "redacted_diff" || s === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${s || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [a, o] of Object.entries(e)) {
        if (a.length > 256 || Ei.test(a)) throw new Error("unsafe property name refused");
        if (a.toLowerCase() === "key" && !r) throw new Error(`private field ${a} refused`);
        if (a.toLowerCase() !== "raw_gain_ct" && Si.test(a))
          throw new Error(`private field ${a} refused`);
        if (t && i === 0 && a === "changes" && Array.isArray(o)) {
          if (o.length > 100) throw new Error("unsafe collection changes refused");
          for (const c of o) this.assertPublicPayload(c, !1, i + 2, "", !0);
        } else
          this.assertPublicPayload(o, !1, i + 1, a.toLowerCase());
      }
  }
  async call(e, t, i = {}) {
    const s = await this.hass.callWS({
      type: `${dt}${e}`,
      entry_id: this.entryId,
      ...i
    });
    return Ae.assertPublicPayload(s, ft.has(e)), t(s);
  }
  subscribe(e, t, i, s) {
    return this.hass.connection.subscribeMessage((r) => {
      Ae.assertPublicPayload(r, ft.has(e)), s(i(r));
    }, { type: `${dt}${e}`, entry_id: this.entryId, ...t });
  }
}
const ts = (n) => {
  const e = n.channels.map((t) => `CT${t}`);
  return n.measurement_method === "one_ct_double_power" ? `2 × ${e[0] ?? "CT"}` : n.measurement_method === "both_conductors_one_ct" ? `${e[0] ?? "CT"} (both conductors)` : e.join(" + ");
};
function is(n, e = null, t = null) {
  const i = (n?.redacted_diff || "No reviewed configuration changes yet.").split(`
`), s = e?.channels ?? [], r = e?.power_quality.flatMap((o, c) => o ? [c + 1] : []) ?? [], a = e?.status_fields.flatMap((o, c) => o ? [c + 1] : []) ?? [];
  return d`
    <section class="review-region" aria-labelledby="review-heading">
      <h2 id="review-heading">Review changes</h2>
      <p class="warning-band">Firmware configuration changes can alter Home Assistant rename/entity-key bindings. Review every change before Apply.</p>
      ${e ? d`
        <h3>Meter</h3>
        <dl class="status-list"><div><dt>Electrical profile</dt><dd>${e.meter.electrical_system.replaceAll("_", " ")} · ${e.meter.line_frequency_hz} Hz</dd></div><div><dt>Reporting interval</dt><dd>${e.meter.update_interval_s} seconds</dd></div><div><dt>Friendly name</dt><dd>${e.meter.friendly_name}</dd></div></dl>
        <h3>Voltage references</h3>
        <ul class="status-list">${e.meter.voltage_references.map((o) => d`<li>${o.label} (${o.phase_label}): ${o.nominal_voltage_v} V · ${o.transformer_model_id} · ${o.group_keys.join(", ")}</li>`)}</ul>
        ${e.meter.voltage_references.length > 1 ? d`<p class=${e.multi_reference_preparation_acknowledged ? "info-band" : "warning-band"}>Multi-reference hardware preparation: ${e.multi_reference_preparation_acknowledged ? "acknowledged" : "not acknowledged"}.</p>` : ""}
        <h3>Channels</h3>
        <ul class="status-list">${s.map((o) => d`<li>CT${o.channel} ${o.name}: ${o.enabled ? `${o.role.replaceAll("_", " ")} on ${o.voltage_reference_id}; ${o.model_id || "no model"} × ${o.reporting_multiplier}; burden ${o.burden_output_acknowledged ? "acknowledged" : "not acknowledged"}` : "unused"}</li>`)}</ul>
        <h3>Aggregates</h3>
        ${e.aggregates.length ? d`<ul class="status-list">${e.aggregates.map((o) => d`<li>${o.name} = ${ts(o)} · ${o.measurement_method.replaceAll("_", " ")} · ${o.energy_mode} energy${o.parent_id ? ` · parent ${o.parent_id}` : ""}</li>`)}</ul>` : d`<p class="info-band">No aggregate totals are configured.</p>`}
        <h3>Package and entity impact</h3>
        <dl class="status-list"><div><dt>Power quality</dt><dd>${r.length ? `Boards ${r.join(", ")}` : "Not selected"}</dd></div><div><dt>Phase status</dt><dd>${a.length ? `Boards ${a.join(", ")}` : "Not selected"}</dd></div>${t ? d`<div><dt>Entity impact</dt><dd>${t.numeric_entity_count} numeric, ${t.text_entity_count} text, ${t.energy_entity_count} energy; ~${t.approximate_publications_per_second.toFixed(1)} publications/sec</dd></div>` : ""}</dl>
      ` : ""}
      <pre class="config-diff" aria-label="Redacted substitution diff"><code>${i.map((o, c) => d`<span class=${`diff-line ${o.startsWith("+") ? "added" : o.startsWith("-") ? "removed" : "context"}`}>${o}</span>${c < i.length - 1 ? `
` : ""}`)}</code></pre>
      <dl class="status-list">
        <div><dt>Validation</dt><dd>${n?.state === "validated" || n?.progress.includes("config_validated") ? "Validated" : "Pending"}</dd></div>
        <div><dt>Compile</dt><dd>${n?.state === "compiled" || n?.progress.includes("firmware_compiled") ? "Compiled" : "Pending"}</dd></div>
        <div><dt>Install</dt><dd>${n?.state === "install_confirmation_required" ? "Confirmation required" : n?.state ?? "Pending"}</dd></div>
      </dl>
    </section>
  `;
}
function ss(n, e, t, i, s, r, a, o = null, c = null, l = !1, h = !1) {
  const u = n?.state ?? "previewed", m = u === "rolled_back" && n?.evidence.includes("validation_failed");
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${is(n, o, c)}
      ${u === "failed" ? d`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${n?.evidence.join(", ") || "The operation did not complete."}</p>
          ${n?.rollback_available ? d`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      ${m ? d`<div class="recovery-panel" role="status"><strong>ESPHome rejected the config (code ${n?.validation_detail?.code ?? "unavailable"})</strong><p>The original config was restored. Review the config changes and open ESPHome Device Builder logs for the exact validation error.</p></div>` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${e} ?disabled=${l || h || u !== "previewed"}>Apply</button>
        <button class="secondary" @click=${t} ?disabled=${l || h || u !== "validated"}>Compile</button>
        <button class="primary" @click=${i} ?disabled=${l || h || u !== "install_confirmation_required"}>Install</button>
      </div>
      ${n?.validation_detail ? d`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${n.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${n.validation_detail.error_record_count} records (${n.validation_detail.reported_error_count === null ? "unreported" : `${n.validation_detail.reported_error_count} reported`})</dd></div>
        <div><dt>Warnings</dt><dd>${n.validation_detail.warning_record_count} records (${n.validation_detail.reported_warning_count === null ? "unreported" : `${n.validation_detail.reported_warning_count} reported`})</dd></div>
      </dl>` : ""}
      ${n?.upload_progress?.length ? d`<ul class="upload-progress">${n.upload_progress.map((y) => d`
        <li>${y.stage}: ${y.percentage ?? "in progress"}${y.percentage != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${r} ?disabled=${l}>${l ? "Loading…" : "Back"}</button>
        <button class="primary" data-action="continue" @click=${a} ?disabled=${l || h || u !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const Re = (n, e) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(n.key)) return;
  n.preventDefault();
  const i = [...n.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], s = n.key === "ArrowRight" || n.key === "ArrowDown", r = n.key === "Home" ? 0 : n.key === "End" ? i.length - 1 : (e + (s ? 1 : i.length - 1)) % i.length;
  i[r]?.click(), i[r]?.focus();
}, Nt = (n, e, t) => (n?.default_gain_ct ?? t) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((n?.default_gain_ct ?? t) / e);
function ns(n, e, t, i, s, r, a, o = !1, c = !1, l = null, h = () => {
}, u = () => {
}, m = !0, y = "") {
  const b = Math.ceil(n.channels.length / 6), v = n.channels.filter((f) => f.address.board_index === e).slice(0, 8), O = new Map(l?.meter.voltage_references.flatMap((f) => f.group_keys.map((g) => [g, f])) ?? []), p = (f, g) => l && h({
    ...l,
    channels: l.channels.map((_) => _.channel === f ? { ..._, ...g } : _)
  });
  return d`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <p class="info-band">CT numbering starts at the top-left connector on each board and continues counterclockwise, then continues upward through the board stack. A circuit's voltage reference is determined by the physical voltage setup and cannot be changed in software.</p>
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: b }, (f, g) => d`
          <button role="tab" id=${`board-tab-${g}`} data-board-tab=${g} aria-selected=${g === e}
            aria-controls="board-panel" tabindex=${g === e ? "0" : "-1"}
            @keydown=${(_) => Re(_, g)}
            @click=${() => i(g)}>${g === 0 ? "Main Board" : `Add-on ${g}`}</button>
        `)}
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <p class="info-band">If you expect to measure more than 65.535 A on a CT, use a multiplier of 2 for a 120 A CT or 4 for a 200 A CT. The multiplier divides the gain and multiplies current and power output by the same amount.</p>
      <div id="board-panel" role="tabpanel" aria-labelledby=${`board-tab-${e}`}>
      <div class="ct-table" role="table" aria-rowcount=${n.channels.length + 1}>
        <div class="ct-header" role="row" aria-rowindex="1">
          <span role="columnheader">CT</span><span role="columnheader">Used</span><span role="columnheader">Role</span><span role="columnheader">Voltage reference</span><span role="columnheader">Name</span><span role="columnheader">Model</span><span role="columnheader">Current gain</span><span role="columnheader">Multiplier</span><span role="columnheader">Resulting gain</span><span role="columnheader">Burden</span><span role="columnheader">Status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${v.map((f) => {
    const g = t.get(f.channel) ?? {
      name: f.name,
      modelId: f.selected_model_id ?? "",
      multiplier: f.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, _ = n.catalog.presets.find((T) => T.model_id === g.modelId), k = Nt(_, g.multiplier, g.modelId === "custom" ? g.customGainCt : void 0), x = Ye(f, g), A = l?.channels.find((T) => T.channel === f.channel), P = O.get(`${f.address.board_index === 0 ? "main" : `addon${f.address.board_index}`}_${f.address.group_index + 1}`);
    return d`
              <div class="ct-row" data-ct-row data-ct-group=${f.address.group_index} role="row" aria-rowindex=${f.channel + 1} aria-label=${`CT${f.channel}`}>
                <strong class="ct-index" role="cell">CT${f.channel}</strong>
                ${A ? d`<label role="cell" class="check-row"><span class="mobile-label">Used</span><input type="checkbox" aria-label=${`CT${f.channel} used`} .checked=${A.enabled}
                  @change=${(T) => T.target.checked ? p(f.channel, { enabled: !0, role: A.role === "unused" ? "branch" : A.role }) : u(f.channel)} /></label>` : d`<span role="cell"><span class="mobile-label">Used</span>—</span>`}
                ${A ? d`<label role="cell"><span class="mobile-label">Role</span><select aria-label=${`CT${f.channel} role`} .value=${A.role} ?disabled=${!A.enabled}
                  @change=${(T) => p(f.channel, { role: T.target.value })}>
                  ${Bt.filter((T) => T !== "unused").map((T) => d`<option value=${T}>${T.replaceAll("_", " ")}</option>`)}</select></label>` : d`<span role="cell"><span class="mobile-label">Role</span>—</span>`}
                <span role="cell" data-voltage-reference><span class="mobile-label">Voltage reference</span>${P?.label || P?.reference_id || A?.voltage_reference_id || "—"}</span>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${f.channel} name`} .value=${g.name}
                  @input=${(T) => s(f.channel, { name: T.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${f.channel} model`} ?disabled=${o}
                  @change=${(T) => {
      const C = T.target.value, w = n.catalog.presets.find(($) => $.model_id === C);
      s(f.channel, {
        modelId: C,
        burdenAcknowledged: f.selection_verified_against_config && C === f.selected_model_id && (C === "custom" || w?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${g.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((T) => d`<option value=${T.model_id} ?selected=${g.modelId === T.model_id}>${T.label}</option>`)}
                  <option value="custom" ?selected=${g.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${f.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><select aria-label=${`CT${f.channel} multiplier`} ?disabled=${o}
                  @change=${(T) => s(f.channel, { multiplier: Number(T.target.value) })}>
                  ${[1, 2, 4, 8].map((T) => d`<option value=${T} ?selected=${g.multiplier === T}>${T}</option>`)}
                </select></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${k ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${_?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${g.expanded} @click=${() => s(f.channel, { expanded: !g.expanded })}>
                  ${g.modelId ? x ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${g.modelId === "custom" ? d`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${f.channel} custom gain`}
                  ?disabled=${o}
                  .value=${g.customGainCt === void 0 ? "" : String(g.customGainCt)}
                  @input=${(T) => s(f.channel, { customGainCt: Number(T.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${f.channel} custom label`} ?disabled=${o} .value=${g.customLabel ?? ""}
                  @input=${(T) => s(f.channel, { customLabel: T.target.value })} /></label>
              </div>` : M}
              ${g.modelId === "custom" || _?.requires_burden_jumper_cut ? d`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${f.channel} burden output acknowledgement`}
                  ?disabled=${o}
                  .checked=${g.burdenAcknowledged}
                  @change=${(T) => s(f.channel, { burdenAcknowledged: T.target.checked })} />
                  I checked the burden-output requirement for CT${f.channel}</label>
              </div>` : M}
              ${_ && _.rated_current_a > 65.535 && g.multiplier === 1 ? d`<div class="warning-band" role="status">CT${f.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : M}
              ${g.expanded && _ ? d`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${_.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${_.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${_.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${_.notes || (_.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : M}
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${v[0]?.channel ?? 0}–${v.at(-1)?.channel ?? 0} of ${n.channels.length} CTs</p>
      ${l ? as(l, h, m, y) : M}
      <footer class="action-footer">
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${c || !hs(n, t, o)} @click=${a}>${c ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const Bt = ["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"], rs = ["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"], os = ["none", "consumption", "bidirectional", "generation"];
function as(n, e, t, i) {
  const s = (c, l) => e({
    ...n,
    aggregates: n.aggregates.map((h, u) => u === c ? { ...h, ...l } : h)
  }), r = (c, l) => {
    const h = n.aggregates[c].aggregate_id;
    e({ ...n, aggregates: n.aggregates.map((u, m) => m === c ? { ...u, aggregate_id: l } : u.parent_id === h ? { ...u, parent_id: l } : u) });
  }, a = n.channels.filter((c) => c.enabled && !n.aggregates.some((l) => l.channels.includes(c.channel))).map((c) => c.channel), o = n.aggregates.flatMap((c) => [
    c.role === "grid" && c.channels.some((l) => n.channels[l - 1]?.role === "branch") ? `${c.name}: keep branch loads out of the root-grid total.` : "",
    c.measurement_method === "one_ct_double_power" && c.channels.length !== 1 ? `${c.name}: doubled-one-leg measurement requires exactly one CT.` : "",
    c.role === "two_pole" && !["one_ct_double_power", "both_conductors_one_ct", "two_ct_sum"].includes(c.measurement_method) ? `${c.name}: select a two-pole measurement method.` : "",
    c.role === "two_pole" && c.channels.some((l) => n.aggregates.filter((h) => h.role === "two_pole" && h.channels.includes(l)).length > 1) ? `${c.name}: a CT cannot belong to two two-pole aggregates.` : ""
  ].filter(Boolean));
  return d`<section class="step-content" aria-labelledby="aggregates-heading">
    <h2 id="aggregates-heading">Aggregate totals</h2>
    ${t ? M : d`<p class="info-band" role="status">Aggregate editing unavailable: ${i === "unmanaged_total_present" ? "This meter has legacy unmanaged totals." : "This meter does not expose managed totals."} Upgrade the meter configuration before editing aggregate totals. Existing aggregates remain reviewable.</p>`}
    ${o.map((c) => d`<p class="warning-band" role="status">${c}</p>`)}
    ${n.aggregates.map((c, l) => d`<fieldset class="ct-detail" aria-label=${`${c.name} aggregate`} ?disabled=${!t}><legend>${c.name}</legend>
      <label>ID <input aria-label=${`${c.aggregate_id} aggregate id`} maxlength="64" .value=${c.aggregate_id}
        @change=${(h) => r(l, h.target.value.trim())} /></label>
      <label>Name <input aria-label=${`${c.aggregate_id} aggregate name`} maxlength="64" .value=${c.name}
        @input=${(h) => s(l, { name: h.target.value })} /></label>
      <label>Role <select aria-label=${`${c.aggregate_id} aggregate role`} .value=${c.role}
        @change=${(h) => s(l, { role: h.target.value })}>${Bt.filter((h) => h !== "unused").map((h) => d`<option value=${h}>${h.replaceAll("_", " ")}</option>`)}</select></label>
      <label>Method <select aria-label=${`${c.aggregate_id} aggregate method`} .value=${c.measurement_method}
        @change=${(h) => s(l, { measurement_method: h.target.value })}>${rs.map((h) => d`<option value=${h}>${h.replaceAll("_", " ")}</option>`)}</select></label>
      <label>Energy <select aria-label=${`${c.aggregate_id} aggregate energy`} .value=${c.energy_mode}
        @change=${(h) => s(l, { energy_mode: h.target.value })}>${os.map((h) => d`<option value=${h}>${h}</option>`)}</select></label>
      <label>Channels <input aria-label=${`${c.aggregate_id} aggregate channels`} .value=${c.channels.join(",")}
        @change=${(h) => s(l, { channels: h.target.value.split(",").map(Number).filter(Number.isInteger) })} /></label>
      <fieldset><legend>Selected channels</legend>${n.channels.filter((h) => h.enabled).map((h) => d`<label class="check-row"><input type="checkbox" aria-label=${`${c.aggregate_id} CT${h.channel}`} .checked=${c.channels.includes(h.channel)}
        @change=${(u) => s(l, { channels: u.target.checked ? [...c.channels, h.channel] : c.channels.filter((m) => m !== h.channel) })} />CT${h.channel}</label>`)}</fieldset>
      <label>Parent <select aria-label=${`${c.aggregate_id} aggregate parent`} .value=${c.parent_id ?? ""}
        @change=${(h) => s(l, { parent_id: h.target.value || null })}><option value="">None</option>${n.aggregates.filter((h) => h.aggregate_id !== c.aggregate_id).map((h) => d`<option value=${h.aggregate_id}>${h.name}</option>`)}</select></label>
      <label class="check-row"><input type="checkbox" aria-label=${`${c.aggregate_id} expose power`} .checked=${c.expose_power}
        @change=${(h) => s(l, { expose_power: h.target.checked })} />Power</label>
      <label class="check-row"><input type="checkbox" aria-label=${`${c.aggregate_id} expose current`} .checked=${c.expose_current}
        @change=${(h) => s(l, { expose_current: h.target.checked })} />Current</label>
      <button class="secondary" @click=${() => e({ ...n, aggregates: n.aggregates.filter((h, u) => u !== l).map((h) => h.parent_id === c.aggregate_id ? { ...h, parent_id: null } : h) })}>Delete aggregate</button>
    </fieldset>`)}
    ${t ? cs(n, a, e) : M}
  </section>`;
}
function cs(n, e, t) {
  const i = (s, r, a, o, c, l) => {
    const u = [...s.currentTarget.parentElement?.querySelector("[data-preset-channels]")?.selectedOptions ?? []].map((v) => Number(v.value));
    if (u.length !== c) return;
    const m = a.replaceAll("_", "-");
    let y = n.aggregates.length + 1;
    const b = new Set(n.aggregates.map((v) => v.aggregate_id));
    for (; b.has(`${m}-${y}`); ) y++;
    t({
      ...n,
      channels: a === "grid" ? n.channels.map((v) => u.includes(v.channel) ? { ...v, role: "grid" } : v) : n.channels,
      aggregates: [...n.aggregates, {
        aggregate_id: `${m}-${y}`,
        name: r,
        role: a,
        channels: u,
        measurement_method: o,
        parent_id: null,
        energy_mode: l,
        expose_power: !0,
        expose_current: a === "grid"
      }]
    });
  };
  return d`<div class="action-footer"><label>Preset channels <select multiple data-preset-channels aria-label="Preset channels">${e.map((s) => d`<option value=${s}>CT${s}</option>`)}</select></label>
    <button class="secondary" data-action="add-aggregate" @click=${(s) => i(s, "New aggregate", "branch", "direct", 1, "consumption")}>Add aggregate</button>
    <button class="secondary" @click=${(s) => i(s, "Main service", "grid", "two_ct_sum", 2, "bidirectional")}>Main service</button>
    <button class="secondary" @click=${(s) => i(s, "Solar / generator", "solar", "two_ct_sum", 2, "generation")}>Solar / generator</button>
    <button class="secondary" @click=${(s) => i(s, "Two-pole circuit", "two_pole", "one_ct_double_power", 1, "consumption")}>Two-pole</button>
    <button class="secondary" @click=${(s) => i(s, "Subpanel", "subpanel", "two_ct_sum", 2, "consumption")}>Subpanel</button></div>`;
}
function ls(n, e) {
  const t = new Set(n.meter.voltage_references.map((o) => o.reference_id)), i = new Map(n.meter.voltage_references.flatMap((o) => o.group_keys.map((c) => [c, o.reference_id])));
  if (n.channels.length !== e || new Set(n.channels.map((o) => o.channel)).size !== e || n.channels.some((o) => o.channel < 1 || o.channel > e || !o.name.trim() || !t.has(o.voltage_reference_id) || o.enabled === (o.role === "unused") || i.get(`${o.channel <= 6 ? "main" : `addon${Math.floor((o.channel - 1) / 6)}`}_${Math.floor((o.channel - 1) % 6 / 3) + 1}`) !== o.voltage_reference_id)) return !1;
  const s = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), a = /* @__PURE__ */ new Map();
  for (const o of n.aggregates) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(o.aggregate_id) || s.has(o.aggregate_id) || !o.name.trim() || !o.channels.length || new Set(o.channels).size !== o.channels.length) return !1;
    s.add(o.aggregate_id), a.set(o.aggregate_id, o.parent_id);
    const c = o.measurement_method === "two_ct_sum" ? 2 : o.measurement_method === "one_ct_double_power" || o.measurement_method === "both_conductors_one_ct" ? 1 : void 0;
    if (c !== void 0 && o.channels.length !== c || o.channels.some((l) => l < 1 || l > e || r.has(l) || !n.channels[l - 1]?.enabled)) return !1;
    o.channels.forEach((l) => r.add(l));
  }
  for (const [o, c] of a) {
    const l = /* @__PURE__ */ new Set();
    for (let h = c; h !== null; h = a.get(h) ?? null) {
      if (!s.has(h) || h === o || l.has(h)) return !1;
      l.add(h);
    }
  }
  return !0;
}
function re(n, e) {
  return n.channels.flatMap((t) => {
    const i = e.get(t.channel);
    if (!i || !Ye(t, i)) return [];
    const s = n.catalog.presets.find((a) => a.model_id === i.modelId), r = { channel: t.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (r.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (r.custom_label = i.customLabel.trim()), r.burden_output_acknowledged = i.burdenAcknowledged) : s?.requires_burden_jumper_cut && (r.burden_output_acknowledged = i.burdenAcknowledged), [r];
  });
}
function Ye(n, e) {
  return e.name !== n.name || e.modelId !== (n.selected_model_id ?? "") || e.multiplier !== n.reporting_multiplier || e.modelId === "custom" && (Nt(void 0, e.multiplier, e.customGainCt) !== n.raw_gain_ct || (e.customLabel?.trim() ?? "") !== (n.display_label ?? ""));
}
function ds(n, e) {
  if (!e.name.trim() || !e.modelId || ![1, 2, 4, 8].includes(e.multiplier)) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const t = n.catalog.presets.find((i) => i.model_id === e.modelId);
  return !!t && (!t?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function hs(n, e, t = !1) {
  if (t) return [...e].every(([i, s]) => {
    const r = n.channels.find((a) => a.channel === i);
    return !!r && !!s.name.trim() && s.modelId === (r.selected_model_id ?? "") && s.multiplier === r.reporting_multiplier;
  });
  for (const i of n.channels) {
    const s = e.get(i.channel);
    if (!s || Ye(i, s) && !ds(n, s))
      return !1;
  }
  return !0;
}
const Z = (n) => n.toFixed(2);
function Ft(n, e, t) {
  const i = [n, !!e?.stable, !!t, !!t?.gain_evidence, !!t], s = i.findIndex((a) => !a);
  return d`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((a, o) => d`<li
    class=${i[o] ? "complete" : o === s ? "active" : "pending"}><span
      class="progress-number">${o + 1}</span><span>${a}</span></li>`)}</ol>`;
}
function zt(n, e, t, i) {
  const s = Object.entries(n?.calibration_sources ?? {}).filter(([r]) => e.includes(r));
  return d`<section class="measurement-evidence calibration-source" aria-label=${`${t} calibration source`}>
    <h3>Active gain source</h3>
    ${s.length ? d`<table><thead><tr><th>Chip</th><th>Active gain source</th><th>${t} calibrated this session</th></tr></thead><tbody>
      ${s.map(([r, a]) => d`<tr><td>${r}</td><td>${a === "flash" ? "Saved flash" : a === "configuration" ? "Configuration" : "Unknown"}</td><td>${i.has(r) ? "Yes" : "No"}</td></tr>`)}
    </tbody></table><p>ATM90E32 stores voltage and current gains in one table. The active source does not mean this calibration step was completed.</p>` : d`<p>Calibration source is not available.</p>`}
  </section>`;
}
function Ze(n, e) {
  if (!n) return M;
  const t = n.target === "voltage" ? "V" : "A";
  return d`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((i, s) => d`<dl>
      <div><dt>${e?.[s] ?? (n.target === "voltage" ? `V${s % 3 + 1}` : `A${s + 1}`)}</dt>
        <dd>${i.samples.map((r) => `${Z(r)} ${t}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}
function Xe(n) {
  return n ? d`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${n.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${n.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${n.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${n.before_values.map(Z).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${n.after_values.map(Z).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${n.error_percent_values.map((e) => `${Z(e)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${n.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${n.gain_evidence ? d`<h4>Gain evidence · ${n.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${n.gain_evidence.phases?.map((e) => d`<tr><td>${e.phase}</td><td>${Z(e.measured_voltage)}</td><td>${Z(e.measured_current)}</td><td>${Z(e.reference_voltage)}</td><td>${Z(e.reference_current)}</td><td>${e.old_voltage_gain} → ${e.new_voltage_gain}</td><td>${e.old_current_gain} → ${e.new_current_gain}</td></tr>`) ?? M}
      </tbody></table><p>Saved in flash: ${n.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : d`<p>Gain evidence unavailable.</p>`}
  </section>` : M;
}
function us(n, e, t, i, s, r, a, o, c, l, h, u, m, y, b, v) {
  const O = n?.ct_count ?? e?.channels.length ?? 6, p = Math.floor((i - 1) / 6), g = Math.floor((i - 1) / 3) * 3 + 1, _ = Array.from({ length: 3 }, (C, w) => g + w).filter((C) => C <= O), k = _.filter((C) => (s.get(C) ?? 0) > 0), x = p === 0 ? ["meter_main1", "meter_main2"] : [`addon${p}_1`, `addon${p}_2`], A = e === null, P = r !== null && [1, 2, 4, 8].includes(r), T = k.length > 0 && (!A || P);
  return d`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Ft(T, a, o)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(O / 6) }, (C, w) => d`<button role="tab"
          id=${`current-board-tab-${w}`} aria-controls="current-board-panel"
          aria-selected=${w === p} tabindex=${w === p ? "0" : "-1"}
          @keydown=${($) => Re($, w)}
          @click=${() => l(w * 6 + 1)}>${w === 0 ? "Main Board" : `Add-on ${w}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${p}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((C) => {
    const w = p * 6 + C * 3 + 1;
    return d`<button
          aria-pressed=${w === g} @click=${() => l(w)}>Group ${p * 2 + C + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${g}–CT${g + 2}</h2>
      ${zt(t, x, "Current", c)}
      <div class="reference-block">
        ${_.map((C) => d`<label>CT${C} reference
          <input data-current-reference=${C} aria-label=${`CT${C} reference`} type="number" min="0.01" step="0.01"
            .value=${s.has(C) ? String(s.get(C)) : ""}
            @input=${(w) => {
    const $ = w.target;
    h(C, $.value === "" ? null : Number($.value));
  }} /></label>`)}
      ${A ? d`<label>Reporting multiplier <select data-role="reporting-multiplier" required @change=${(C) => {
    const w = Number(C.target.value);
    u(w || null);
  }}><option value="" ?selected=${r === null}>Choose multiplier</option>${[1, 2, 4, 8].map((C) => d`<option value=${C} ?selected=${r === C}>${C}</option>`)}</select></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${m} ?disabled=${!T}>Check stability</button>
        <button class="primary" @click=${y} ?disabled=${!T || !a?.stable || (o?.iteration ?? 0) >= 3 || !!(o && !o.retry_allowed && o.iteration > 0)}>${o?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button></div>
      ${a ? d`<div class=${a.stable ? "success-band" : "warning-band"} role="status">${a.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${Ze(a, k.map((C) => `CT${C}`))}
      ${o?.state === "applied_pending_restart_verification" ? d`<div class="success-band" role="status">Current calibration complete for CT${g}–CT${g + 2}.</div>` : ""}
      ${Xe(o)}
      ${o?.state.includes("indeterminate") ? d`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${b}>Reconnect and inspect</button><button class="danger" @click=${v}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const ps = [
  ["split_phase_120_240", "Split phase 120/240 V"],
  ["single_phase_230", "Single phase 230 V"],
  ["three_phase", "Three phase"],
  ["custom", "Custom"]
], fs = [1, 2, 5, 10, 30, 60], gs = (n) => n <= 5 ? "1–5 seconds: high traffic." : n === 10 ? "10 seconds: standard." : n >= 30 ? "30–60 seconds: lower traffic; guided calibration takes longer." : "This interval affects update traffic and guided calibration time.";
function _s(n, e, t, i, s, r, a, o, c, l) {
  const h = n.voltage_references.length > 1, u = !!n.friendly_name.trim() && n.voltage_references.every((p) => p.label.trim() && p.phase_label.trim() && Number.isFinite(p.nominal_voltage_v) && p.nominal_voltage_v >= 1 && p.nominal_voltage_v <= 600 && Number.isInteger(p.gain_voltage) && p.gain_voltage >= 1 && p.gain_voltage <= 65535 && p.group_keys.length) && (!h || t), m = (p) => {
    o(!1), i({ ...n, ...p });
  }, y = (p, f, g) => {
    const _ = n.voltage_references.find((A) => A.group_keys.includes(p)), k = n.voltage_references.find((A) => A.reference_id === f);
    if (!_ || !k || _ === k) return;
    const x = _.group_keys.length === 1 ? k.group_keys[0] : void 0;
    if (x && !window.confirm(`Moving ${p} would empty ${_.label || _.reference_id}. Confirm the disclosed swap with ${x}.`)) {
      g.value = _.reference_id;
      return;
    }
    m({ voltage_references: n.voltage_references.map((A) => ({
      ...A,
      group_keys: A === _ ? x ? [x] : A.group_keys.filter((P) => P !== p) : A === k ? [...A.group_keys.filter((P) => P !== x), p] : A.group_keys
    })) });
  }, b = n.voltage_references.flatMap((p) => p.group_keys.length > 1 ? p.group_keys : []), v = (p) => {
    const g = p.currentTarget.parentElement?.querySelector("[data-new-reference-group]")?.value, _ = n.voltage_references.find((P) => g && P.group_keys.includes(g));
    if (!g || !_ || _.group_keys.length < 2) return;
    const k = new Set(n.voltage_references.map((P) => P.reference_id));
    let x = 2;
    for (; k.has(`reference-${x}`); ) x++;
    const A = `reference-${x}`;
    m({ voltage_layout: "multi_reference", voltage_references: [
      ...n.voltage_references.map((P) => P === _ ? { ...P, group_keys: P.group_keys.filter((T) => T !== g) } : P),
      { ..._, reference_id: A, label: `Reference ${x}`, phase_label: String(x), group_keys: [g] }
    ] });
  }, O = (p) => {
    const f = n.voltage_references.find((k) => k.reference_id === p), g = n.voltage_references.find((k) => k.reference_id !== p);
    if (!f || !g || !window.confirm(`Remove ${f.label || f.reference_id} and reassign ${f.group_keys.join(", ")} to ${g.label || g.reference_id}?`)) return;
    const _ = n.voltage_references.filter((k) => k !== f).map((k) => k === g ? { ...k, group_keys: [...k.group_keys, ...f.group_keys].sort() } : k);
    m({ voltage_layout: _.length === 1 ? "standard" : "multi_reference", voltage_references: _ });
  };
  return d`
    <section class="step-content meter-settings-step" aria-labelledby="step-heading">
      <h2>Meter settings</h2>
      <p>These values are written to the meter configuration. Setup Device choices remain onboarding suggestions.</p>
      <div class="meter-settings-grid">
        <label>Friendly name <input aria-label="Friendly name" maxlength="64" .value=${n.friendly_name}
          @input=${(p) => m({ friendly_name: p.target.value })} /></label>
        <label>Electrical system <select aria-label="Electrical system" .value=${n.electrical_system}
          @change=${(p) => s(p.target.value)}>${ps.map(([p, f]) => d`<option value=${p}>${f}</option>`)}</select></label>
        <label>Line frequency <select aria-label="Line frequency" .value=${String(n.line_frequency_hz)}
          @change=${(p) => r(Number(p.target.value))}>${[50, 60].map((p) => d`<option value=${p}>${p} Hz</option>`)}</select></label>
        <label>Reporting interval <select aria-label="Reporting interval" .value=${String(n.update_interval_s)}
          @change=${(p) => m({ update_interval_s: Number(p.target.value) })}>${fs.map((p) => d`<option value=${p}>${p} seconds</option>`)}</select></label>
      </div>
      <p class="info-band" role="status">${gs(n.update_interval_s)}</p>
      <h3>Voltage references</h3>
      <p class="info-band">The configured voltage-reference setup must match the meter's physical voltage wiring. By default, the main-board voltage reference applies to every board.</p>
      <div class="voltage-reference-cards">${n.voltage_references.map((p) => d`
        <section class="voltage-reference-card" aria-label=${`${p.label} voltage reference`}>
          <label>Label <input aria-label=${`${p.reference_id} label`} maxlength="64" .value=${p.label}
            @input=${(f) => m({ voltage_references: n.voltage_references.map((g) => g.reference_id === p.reference_id ? { ...g, label: f.target.value } : g) })} /></label>
          <label>Phase label <input aria-label=${`${p.reference_id} phase label`} maxlength="64" .value=${p.phase_label}
            @input=${(f) => m({ voltage_references: n.voltage_references.map((g) => g.reference_id === p.reference_id ? { ...g, phase_label: f.target.value } : g) })} /></label>
          <label>Transformer <select aria-label=${`${p.reference_id} transformer`} .value=${p.transformer_model_id}
            @change=${(f) => {
    const g = f.target.value, _ = e.presets.find((k) => k.model_id === g);
    m({ voltage_references: n.voltage_references.map((k) => k.reference_id === p.reference_id ? { ...k, transformer_model_id: g, gain_voltage: _?.default_gain_voltage ?? k.gain_voltage } : k) });
  }}>
            ${e.presets.map((f) => d`<option value=${f.model_id}>${f.label}</option>`)}
            <option value="custom">Custom starting gain</option>
            ${p.transformer_model_id !== "custom" && !e.presets.some((f) => f.model_id === p.transformer_model_id) ? d`<option value=${p.transformer_model_id}>${p.transformer_model_id}</option>` : ""}</select></label>
          <label>Custom voltage gain <input aria-label=${`${p.reference_id} custom voltage gain`} type="number" min="1" max="65535" step="1" .value=${String(p.gain_voltage)}
            @input=${(f) => m({ voltage_references: n.voltage_references.map((g) => g.reference_id === p.reference_id ? { ...g, gain_voltage: Number(f.target.value) } : g) })} /></label>
          <label>Nominal voltage <input aria-label=${`${p.reference_id} nominal voltage`} type="number" min="1" max="600" step="0.1" .value=${String(p.nominal_voltage_v)}
            @input=${(f) => a(p.reference_id, Number(f.target.value))} /></label>
          ${n.voltage_references.length > 1 ? d`<button class="secondary" aria-label=${`Remove ${p.reference_id} voltage reference`} @click=${() => O(p.reference_id)}>Remove reference</button>` : ""}
        </section>`)}
      </div>
      ${b.length ? d`<div class="reference-block"><label>Group transferred to new reference <select data-new-reference-group aria-label="Group transferred to new reference">${b.map((p) => d`<option value=${p}>${p}</option>`)}</select></label><button class="secondary" data-action="add-voltage-reference" @click=${v}>Add voltage reference</button></div>` : ""}
      <h3>Voltage group assignment</h3>
      <div class="meter-settings-grid">${n.voltage_references.flatMap((p) => p.group_keys).sort().map((p) => d`<label>${p}<select aria-label=${`${p} voltage reference`} .value=${n.voltage_references.find((f) => f.group_keys.includes(p))?.reference_id ?? ""}
        @change=${(f) => y(p, f.target.value, f.target)}>${n.voltage_references.map((f) => d`<option value=${f.reference_id}>${f.label || f.reference_id}</option>`)}</select></label>`)}</div>
      ${h ? d`<label class="check-row"><input type="checkbox" aria-label="Multi-reference preparation acknowledgement" .checked=${t}
        @change=${(p) => o(p.target.checked)} />I prepared the separate voltage references.</label>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${c}>Back</button><button class="primary" data-action="continue-meter-settings" ?disabled=${!u} @click=${l}>Continue to Circuits & CTs</button></footer>
    </section>
  `;
}
const ms = (n) => n === null || typeof n != "object" && typeof n != "function", vs = (n) => n.strings === void 0;
const bs = { CHILD: 2 }, ws = (n) => (...e) => ({ _$litDirective$: n, values: e });
let $s = class {
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
const fe = (n, e) => {
  const t = n._$AN;
  if (t === void 0) return !1;
  for (const i of t) i._$AO?.(e, !1), fe(i, e);
  return !0;
}, xe = (n) => {
  let e, t;
  do {
    if ((e = n._$AM) === void 0) break;
    t = e._$AN, t.delete(n), n = e;
  } while (t?.size === 0);
}, Ht = (n) => {
  for (let e; e = n._$AM; n = e) {
    let t = e._$AN;
    if (t === void 0) e._$AN = t = /* @__PURE__ */ new Set();
    else if (t.has(n)) break;
    t.add(n), ks(e);
  }
};
function ys(n) {
  this._$AN !== void 0 ? (xe(this), this._$AM = n, Ht(this)) : this._$AM = n;
}
function Cs(n, e = !1, t = 0) {
  const i = this._$AH, s = this._$AN;
  if (s !== void 0 && s.size !== 0) if (e) if (Array.isArray(i)) for (let r = t; r < i.length; r++) fe(i[r], !1), xe(i[r]);
  else i != null && (fe(i, !1), xe(i));
  else fe(this, n);
}
const ks = (n) => {
  n.type == bs.CHILD && (n._$AP ??= Cs, n._$AQ ??= ys);
};
class Ss extends $s {
  constructor() {
    super(...arguments), this._$AN = void 0;
  }
  _$AT(e, t, i) {
    super._$AT(e, t, i), Ht(this), this.isConnected = e._$AU;
  }
  _$AO(e, t = !0) {
    e !== this.isConnected && (this.isConnected = e, e ? this.reconnected?.() : this.disconnected?.()), t && (fe(this, e), xe(this));
  }
  setValue(e) {
    if (vs(this._$Ct)) this._$Ct._$AI(e, this);
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
class As {
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
class xs {
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
const _t = (n) => !ms(n) && typeof n.then == "function", mt = 1073741823;
class Es extends Ss {
  constructor() {
    super(...arguments), this._$Cwt = mt, this._$Cbt = [], this._$CK = new As(this), this._$CX = new xs();
  }
  render(...e) {
    return e.find((t) => !_t(t)) ?? J;
  }
  update(e, t) {
    const i = this._$Cbt;
    let s = i.length;
    this._$Cbt = t;
    const r = this._$CK, a = this._$CX;
    this.isConnected || this.disconnected();
    for (let o = 0; o < t.length && !(o > this._$Cwt); o++) {
      const c = t[o];
      if (!_t(c)) return this._$Cwt = o, c;
      o < s && c === i[o] || (this._$Cwt = mt, s = 0, Promise.resolve(c).then(async (l) => {
        for (; a.get(); ) await a.get();
        const h = r.deref();
        if (h !== void 0) {
          const u = h._$Cbt.indexOf(c);
          u > -1 && u < h._$Cwt && (h._$Cwt = u, h.setValue(l));
        }
      }));
    }
    return J;
  }
  disconnected() {
    this._$CK.disconnect(), this._$CX.pause();
  }
  reconnected() {
    this._$CK.reconnect(this), this._$CX.resume();
  }
}
const Ts = ws(Es), jt = "https://circuitsetup.github.io/ESPWebInstaller/", Is = new URL("manifests/firmware_index.json", jt).href, Lt = 256 * 1024, Rs = 100, Os = 20, Vt = 160, Ms = 1e4, qs = /^[a-z0-9][a-z0-9_-]{0,127}$/, Ps = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/, Gt = /[\u0000-\u001F\u007F-\u009F]/;
function G(n) {
  throw new Error(`Invalid firmware index: ${n}`);
}
function vt(n) {
  return typeof n == "object" && n !== null && !Array.isArray(n);
}
function Pe(n) {
  return typeof n == "string" && n.length <= Vt && !Gt.test(n);
}
function Wt(n) {
  if (!qs.test(n)) throw new Error("Invalid firmware product ID");
}
function Kt(n) {
  if (!Ps.test(n) || n.length > Vt || Gt.test(n))
    throw new Error("Invalid firmware version");
}
function Yt(n) {
  return new TextEncoder().encode(n).byteLength;
}
function Us(n) {
  Array.isArray(n) || G("top level must be an array"), Yt(JSON.stringify(n)) > Lt && G("payload is too large"), n.length > Rs && G("too many products");
  const e = /* @__PURE__ */ new Set();
  return n.map((t) => {
    (!vt(t) || Object.keys(t).length !== 3 || !Object.hasOwn(t, "productId") || !Object.hasOwn(t, "name") || !Object.hasOwn(t, "versions")) && G("invalid product");
    const { productId: i, name: s, versions: r } = t;
    (!Pe(i) || !Pe(s) || !Array.isArray(r)) && G("invalid product fields"), Wt(i), e.has(i) && G("duplicate product ID"), e.add(i), r.length > Os && G("too many versions");
    const a = /* @__PURE__ */ new Set();
    return {
      productId: i,
      name: s,
      versions: r.map((o) => ((!vt(o) || Object.keys(o).length !== 1 || !Object.hasOwn(o, "version") || !Pe(o.version)) && G("invalid version"), Kt(o.version), a.has(o.version) && G("duplicate version"), a.add(o.version), { version: o.version }))
    };
  });
}
async function Ds(n = globalThis.fetch, e) {
  const t = new AbortController(), i = () => t.abort();
  e?.aborted ? i() : e?.addEventListener("abort", i, { once: !0 });
  const s = setTimeout(i, Ms);
  try {
    const r = await n(Is, { cache: "no-cache", mode: "cors", signal: t.signal });
    if (!r.ok) throw new Error(`Firmware index request failed (${r.status})`);
    const a = await r.text();
    return Yt(a) > Lt && G("payload is too large"), Us(JSON.parse(a));
  } finally {
    clearTimeout(s), e?.removeEventListener("abort", i);
  }
}
function Ns(n, e) {
  if (!Number.isInteger(n) || n < 0 || n > 6) return [];
  const t = n === 0 ? "6chan_energy_meter_main" : n === 1 ? "6chan_energy_meter_1-addon" : `6chan_energy_meter_${n}-addons`;
  return e === "wifi" ? [n === 0 ? `${t}_board` : t] : e === "ethernet_lilygo" ? [`${t}_ethernet`] : n === 0 ? [`${t}_ethernet_waveshare`, `${t}_ethernet_ws`] : [`${t}_ethernet_waveshare`];
}
function Bs(n, e) {
  const t = (r) => r.split(/[-.]/).map((a) => Number.isNaN(Number(a)) ? a : Number.parseInt(a, 10)), i = t(n), s = t(e);
  for (let r = 0; r < Math.max(i.length, s.length); r += 1) {
    const a = i[r], o = s[r];
    if (a === void 0) return -1;
    if (o === void 0) return 1;
    if (a > o) return -1;
    if (a < o) return 1;
  }
  return 0;
}
function Fs(n, e, t) {
  const i = /* @__PURE__ */ new Map();
  for (const s of Ns(e, t)) {
    const r = n.find((a) => a.productId === s);
    for (const a of r?.versions ?? [])
      i.has(a.version) || i.set(a.version, { productId: s, version: a.version });
  }
  return [...i.values()].sort((s, r) => Bs(s.version, r.version));
}
function zs(n, e) {
  return n.find((t) => t.version === e)?.version ?? n[0]?.version ?? null;
}
function Hs(n, e) {
  Wt(n), Kt(e);
  const t = new URL(`manifests/manifest_${n}-${e}.json`, jt);
  if (t.origin !== "https://circuitsetup.github.io" || !t.pathname.startsWith("/ESPWebInstaller/manifests/"))
    throw new Error("Invalid firmware manifest URL");
  return t.href;
}
let js;
const Ls = () => js ??= import("./circuitsetup-energy-meter-helper-install-button-DpSoc-pA.js"), bt = (n, e) => d`
  <p class="firmware-summary">${n.productId} · ESPHome ${n.version}</p>
  <esp-web-install-button class="esp-web-installer" .manifest=${e}>
    <button slot="activate" aria-label="Install firmware">Install firmware</button>
    <p slot="unsupported">Use a supported Chromium browser with Web Serial to install firmware.</p>
    <p slot="not-allowed">Open this helper on HTTPS or localhost to install firmware.</p>
  </esp-web-install-button>
`;
function Vs(n) {
  if (!n) return M;
  try {
    const e = Hs(n.productId, n.version);
    return customElements.get("esp-web-install-button") ? bt(n, e) : Ts(
      Ls().then(
        () => bt(n, e),
        () => d`<p role="alert">ESP Web Tools failed to load. Reload Home Assistant and try again.</p>`
      ),
      d`<p role="status">Loading installer…</p>`
    );
  } catch {
    return M;
  }
}
const wt = (n) => n === 0 ? "Main Board" : `Add-on ${n}`, Gs = (n) => n === 0 ? ["main_1", "main_2"] : [`addon${n}_1`, `addon${n}_2`];
function Ws(n, e, t, i, s, r, a, o, c, l, h, u, m, y, b, v, O, p, f) {
  const g = e?.offset_capability, _ = e?.offset_boards ?? [], k = e?.offset_disposition === "completed" || e?.offset_disposition === "skipped" || e?.offset_disposition === "partial" && e.state === "applied_pending_restart_verification", x = _.length > 0 && _.every(($) => $.stages[0]?.state === "completed"), A = _[t]?.stages[i - 1]?.state ?? "not_started", P = !!o?.retry_allowed || A === "partial" || A === "indeterminate", T = g?.status !== "available", C = Gs(t), w = new Map(o?.expected_tables ?? []);
  return d`
    <section class="step-content offset-step" aria-labelledby="step-heading">
      ${T ? d`
        <div class="warning-band" role="status">
          <strong>Offset calibration is ${g?.status === "invalid" ? "not safely available" : "not available on this firmware"}.</strong>
          ${g?.status === "invalid" ? d`<p>Repair reason: ${g.repair_reason}</p>` : M}
          <p>Skip preserves the offset values already saved in flash. No clear control is invoked.</p>
        </div>
      ` : d`
        <ol class="offset-stage-stepper" aria-label="Offset calibration stages">
          <li class=${i === 1 ? "active" : x ? "complete" : "pending"}>
            <button data-offset-stage="1" aria-current=${i === 1 ? "step" : M} @click=${() => h(1)}>1. Voltage/current zero offset</button>
          </li>
          <li class=${i === 2 ? "active" : k ? "complete" : "pending"}>
            <button data-offset-stage="2" aria-current=${i === 2 ? "step" : M} ?disabled=${!x}
              @click=${() => h(2)}>2. Active/reactive power offset</button>
          </li>
        </ol>
        <div class="board-tabs" role="tablist" aria-label="Offset calibration boards">
          ${Array.from({ length: n?.board_count ?? _.length }, ($, q) => d`
            <button role="tab" data-offset-board id=${`offset-board-tab-${q}`} aria-controls="offset-board-panel"
              aria-selected=${q === t} tabindex=${q === t ? "0" : "-1"}
              @keydown=${(z) => Re(z, q)} @click=${() => l(q)}>
              ${wt(q)}
            </button>
          `)}
        </div>
        <div id="offset-board-panel" role="tabpanel" aria-labelledby=${`offset-board-tab-${t}`}>
          <h2>Stage ${i} · ${wt(t)}</h2>
          <div class="warning-band"><strong>Warning:</strong> An open-circuit current-output CT on a live conductor can be hazardous. De-energize conductors before unplugging any CT.</div>
          ${i === 1 ? d`
            <p>First, de-energize all conductors. Then unplug the voltage transformer/AC voltage input and CT inputs, power the meter from USB only, then check that every voltage/current phase reads near zero.</p>
          ` : d`
            <p>Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors, connect/enclose/energize only the voltage reference, then check that voltage is present on both chips and every current phase reads near zero.</p>
          `}
          <p>Measurements cannot prove that a transformer or CT is physically unplugged. Physical acknowledgement never substitutes for measured readiness.</p>
          <label class="check-row"><input type="checkbox" .checked=${s} @change=${($) => u($.target.checked)}>
            ${i === 1 ? "I completed the USB-only, de-energized preparation." : "I powered down for rewiring and safely enclosed and energized only the voltage reference."}
          </label>
          <div class="offset-actions">
            <button class="secondary" data-action="check-offset" ?disabled=${c || !s || A === "completed"} @click=${y}>
              ${c ? "Checking measured readiness…" : "Check measured readiness"}
            </button>
            <button class="primary" data-action="calibrate-offset"
              ?disabled=${c || !s || !a?.ready || A === "completed" || P && !r}
              @click=${b}>${o?.retry_allowed ? "Retry unfinished chip" : `Run Stage ${i} calibration`}</button>
          </div>
          ${a ? d`
            <section class="measurement-evidence" aria-label="Offset readiness evidence">
              <h3>Measured readiness</h3>
              <div class=${a.ready ? "success-band" : "warning-band"} role="status" aria-live="polite">
                ${a.ready ? "Measured readiness passed." : "Measured readiness did not pass. Physical acknowledgement is not enough."}
              </div>
              ${a.reasons.length ? d`<ul>${a.reasons.map(($) => d`<li>${$}</li>`)}</ul>` : M}
              <dl class="threshold-grid">
                <div><dt>Samples per phase</dt><dd>${a.thresholds.sample_count}</dd></div>
                <div><dt>Zero voltage peak</dt><dd>${a.thresholds.zero_voltage_peak_volts} V</dd></div>
                <div><dt>Zero voltage spread</dt><dd>${a.thresholds.zero_voltage_spread_volts} V</dd></div>
                <div><dt>Zero current peak</dt><dd>${a.thresholds.zero_current_peak_amps} A</dd></div>
                <div><dt>Zero current spread</dt><dd>${a.thresholds.zero_current_spread_amps} A</dd></div>
                <div><dt>Voltage present minimum</dt><dd>${a.thresholds.voltage_present_minimum_volts} V</dd></div>
                <div><dt>Voltage present spread</dt><dd>${a.thresholds.voltage_present_spread_volts} V</dd></div>
              </dl>
              <table class="evidence-table"><thead><tr><th>Phase role</th><th>Quantity</th><th>Status</th><th>Mean</th><th>Peak</th><th>Spread</th></tr></thead><tbody>
                ${a.entities.map(($) => d`<tr><td>${$.role}</td><td>${$.quantity}</td><td>${$.ready ? "Ready" : $.reasons.join("; ")}</td>
                  <td>${$.window?.mean ?? "—"}</td><td>${$.window?.absolute_peak ?? "—"}</td><td>${$.window?.absolute_spread ?? "—"}</td></tr>`)}
              </tbody></table>
            </section>
          ` : M}
          <section class="measurement-evidence" aria-label="Per-chip offset progress" aria-live="polite">
            <h3>Per-chip progress</h3>
            <table><thead><tr><th>Chip</th><th>State</th><th>Backend evidence</th></tr></thead><tbody>
              ${C.map(($) => d`<tr><td>${$}</td><td>${w.has($) || A === "completed" ? "Saved; restart verification required." : o?.unfinished_group_keys.includes($) ? "Unfinished" : A.replaceAll("_", " ")}</td>
                <td>${w.has($) ? w.get($).map(([q, z]) => `${q}/${z}`).join(", ") : "—"}</td></tr>`)}
            </tbody></table>
          </section>
          ${P ? d`<aside class="recovery-panel" role="status" aria-live="assertive">
            <strong>${o ? o.state === "partial" ? "One chip finished; recovery is required" : "Calibration outcome is indeterminate" : "Recovery is required"}</strong>
            <p>${o?.error ?? "The prior operation did not finish cleanly"}. Reconnect and inspect before retrying only the unfinished chip.</p>
            <label class="check-row"><input type="checkbox" .checked=${r} @change=${($) => m($.target.checked)}> I reviewed the evidence and confirm this retry.</label>
            <button class="secondary" @click=${v}>Reconnect and inspect</button>
          </aside>` : M}
        </div>
      `}
      <footer class="action-footer offset-footer">
        <button class="secondary" @click=${p}>Back</button>
        <button class="secondary" data-action="skip-offset" ?disabled=${c || k} @click=${O}>Skip offset calibration</button>
        <button class="primary" ?disabled=${c || !k} @click=${f}>Continue</button>
      </footer>
    </section>
  `;
}
const Ks = [
  ["power_quality", "Power quality sensors"],
  ["status_fields", "Status fields"]
], te = (n) => ({
  power_quality: Array(n + 1).fill(!1),
  status_fields: [!0, ...Array(n).fill(!1)]
}), Ys = (n, e) => {
  const t = te(e);
  return {
    power_quality: t.power_quality.map((i, s) => n.power_quality[s] ?? i),
    status_fields: t.status_fields.map((i, s) => n.status_fields[s] ?? i)
  };
};
function Zt(n, e) {
  return d`<section class="package-options" aria-labelledby="package-options-heading">
    <h2 id="package-options-heading">Optional meter fields</h2>
    <p>Choose which meter boards expose additional power quality and status entities.</p>
    ${Ks.map(([t, i]) => {
    const s = n[t], r = s.every(Boolean), a = s.some(Boolean) && !r;
    return d`<fieldset class="choice-field feature-options">
        <legend>${i}</legend>
        <label>
          <input type="checkbox" data-all-feature=${t}
            .checked=${r} .indeterminate=${a}
            @change=${(o) => e({
      ...n,
      [t]: s.map(() => o.currentTarget.checked)
    })} />
          <span>All boards</span>
        </label>
        ${s.map((o, c) => d`<label>
          <input type="checkbox" data-feature=${t} data-board=${c}
            .checked=${o}
            @change=${(l) => e({
      ...n,
      [t]: s.map((h, u) => u === c ? l.currentTarget.checked : h)
    })} />
          <span>${c === 0 ? "Main board" : `Add-on ${c}`}</span>
        </label>`)}
      </fieldset>`;
  })}
  </section>`;
}
function Zs(n, e, t, i, s, r, a) {
  const o = n.includes("failed") || n.includes("indeterminate"), c = !!(e?.offset_groups?.length || e?.power_offset_groups?.length), l = e?.source_handoff_available ? e.config_filename : c ? "Unavailable; offset calibration remains saved in flash" : "Unavailable in runtime-only mode";
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, voltage/current offsets, power offsets, and entity bindings.</p>
      <div class="status-band" role="status">${i ? "Restarting and verifying…" : n || "Ready for restart verification"}</div>
      ${e ? d`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${l}</dd></div></dl>` : ""}
      ${n === "cancelled" ? d`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${o ? d`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${t ? d`<button class="danger" data-action="rollback" @click=${r}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${a} ?disabled=${i}>Back</button><button class="primary" @click=${s} ?disabled=${i || n === "cancelled" || !!e}>${i ? "Restarting and verifying…" : n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Xs(n) {
  return n ? n.preflight.issues.length ? d`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((e) => d`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : d`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : d`<p>Starting a calibration session…</p>`;
}
function Js(n, e, t, i, s, r, a = !1) {
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${Xs(n)}
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
        <label class="check-row"><input type="checkbox" .checked=${e} @change=${(o) => t(o.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${s}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${r}>Back</button>
        <button class="primary" @click=${i} ?disabled=${a || n?.state === "cancelled" || !e || !!n?.preflight.issues.length}>${a ? "Loading calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const $t = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Qs = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"], en = [
  ["split_phase_120_240", "Split phase 120/240 V"],
  ["single_phase_230", "Single phase 230 V"],
  ["three_phase", "Three phase"],
  ["custom", "Custom"]
], yt = (n) => n === "split_phase_120_240" ? 60 : n === "single_phase_230" ? 50 : null;
function tn(n, e, t, i, s, r, a, o, c = "", l = !1, h = d``, u = null, m = te(e), y = () => {
}, b = "split_phase_120_240", v = 60, O = !1, p = () => {
}, f = () => {
}, g = () => {
}) {
  return d`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Configure an existing device</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        ${n?.devices.length ? d`<div class="meter-list">
          ${n.devices.map((_) => d`
            <div class="meter-row">
              <span><strong>${_.title}</strong><small>${_.project_name} · ${_.project_version ?? "version unavailable"}</small></span>
              <span>Device Builder: ${_.configuration ? "Yes" : _.importable ? "Yes — import available" : "No"}</span>
              ${_.importable && !_.configuration ? d`<button class="secondary" ?disabled=${!!c}
                @click=${() => o(_.entry_id)}>${u === _.entry_id ? "Retry import" : "Import"}</button>` : ""}
              <button class="primary" data-action="configure-device" ?disabled=${!!c}
                @click=${() => a(_.entry_id)}>${c === `topology:${_.entry_id}` ? "Loading topology…" : "Configure"}</button>
            </div>
          `)}
        </div>` : d`<div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>`}
      </section>
      ${l ? "" : d`<hr />
      <h2>Set up a new device</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (_, k) => d`
            <label class=${k === e ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(k)}
                .checked=${k === e} @change=${() => i(k)} />
              <span>${k}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Electrical system</legend>
        <p id="electrical-profile-help">Confirm the line frequency before it is saved with this installation.</p>
        <div class="connection-options">
          ${en.map(([_, k]) => d`
            <label class=${_ === b ? "selected" : ""}>
              <input name="electrical-system" type="radio" .value=${_}
                .checked=${_ === b} @change=${() => p(_)} />
              <span>${k}</span>
            </label>
          `)}
        </div>
        <div class="connection-options" role="group" aria-describedby="electrical-profile-help">
          ${[50, 60].map((_) => d`<label class=${_ === v ? "selected" : ""}>
            <input name="line-frequency" type="radio" .value=${String(_)} .checked=${_ === v}
              @change=${() => f(_)} /> <span>${_} Hz</span>
          </label>`)}
        </div>
        <p>${yt(b) ? `${yt(b)} Hz is suggested; confirm it after checking your supply.` : "Choose the line frequency for this electrical system."}</p>
        <button class="secondary" data-action="confirm-electrical-profile" ?disabled=${v === null} @click=${g}>
          ${O ? "Electrical profile confirmed" : "Confirm electrical profile"}
        </button>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${$t.map(([_, k]) => d`
            <label class=${_ === t ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${_}
                .checked=${_ === t} @change=${() => s(_)} />
              <span>${k}</span>
            </label>
          `)}
        </div>
      </fieldset>
      ${Zt(m, y)}
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>Add-on boards</dt><dd>${e}</dd></div>
          <div><dt>Connection</dt><dd>${$t.find(([_]) => _ === t)?.[1]}</dd></div>
          ${Qs.slice(0, e).map((_, k) => d`<div><dt>Add-on ${k + 1}</dt><dd>${_}</dd></div>`)}
        </dl>
      </section>
      ${h}
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
function Xt(n, e, t, i, s, r = null, a = !1) {
  return d`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((o) => d`<li>${o.source}: ${o.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([o, c]) => d`<div data-target=${o}>${Ze(c)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([o, c]) => d`<div data-target=${o}>${Xe(c)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${t?.evidence.join(", ") || "No build evidence."}</p><p>${t?.progress.join(", ") || "No transaction progress."}</p>
          ${t?.validation_detail ? d`<p>Validation code ${t.validation_detail.code ?? "unavailable"}; ${t.validation_detail.error_record_count} error records; ${t.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${t?.upload_progress?.length ? d`<ul>${t.upload_progress.map((o) => d`<li>${o.stage}: ${o.percentage ?? "in progress"}${o.percentage != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Calibration completion record</h3><p>${r ? `Restart-verified ${r.source_authority.replaceAll("_", " ")} calibration record` : a ? "No-change completion; no restart-verified record was created" : "Not yet established"}</p><p>${r ? `Verification ${r.verification_id}, generation ${r.connection_generation}; ${r.offset_groups?.length ?? 0} voltage/current offset tables; ${r.power_offset_groups?.length ?? 0} power-offset tables.` : a ? "The server confirmed there were no pending gain or offset changes." : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function sn(n, e, t, i, s, r, a, o, c, l, h = null, u = null, m = () => {
}) {
  const y = !!(r?.offset_groups?.length || r?.power_offset_groups?.length), b = r?.source_authority === "saved_flash" && r.config_filename && !y && (r.source_handoff_available || r.source_handoff_firmware_installed), v = h, O = (p) => p.flatMap((f, g) => f ? [g === 0 ? "Main board" : `Add-on ${g}`] : []);
  return d`
    <section class="step-content" aria-labelledby="step-heading">
      ${r && y ? d`<div class="success-band" role="status">Setup and exact restart verification are complete. Offset calibration remains saved in flash; YAML handoff and flash clearing are unavailable.</div>` : r?.source_authority === "configuration" ? d`<div class="success-band" role="status">Calibration saved to YAML; flash values cleared.</div>` : r ? d`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : a ? d`<div class="success-band" role="status">Completed without calibration changes. No restart or restart-verified calibration record was required.</div>` : d`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${o ?? "Unavailable"}</dd></div><div><dt>Configuration authority</dt><dd>${h?.capabilities.configuration_authoritative ? t?.full_meter_configuration_verified ? "Authoritative configuration verified" : "Authoritative configuration" : "Unavailable"}</dd></div><div><dt>Calibration authority source</dt><dd>${r?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${r?.verification_id ?? "Unavailable"}</dd></div>${v ? d`<div><dt>Installed electrical profile</dt><dd>${v.configuration.meter.electrical_system.replaceAll("_", " ")} · ${v.configuration.meter.line_frequency_hz} Hz</dd></div><div><dt>Voltage references</dt><dd>${v.configuration.meter.voltage_references.length}</dd></div><div><dt>Used channels</dt><dd>${v.configuration.channels.filter((p) => p.enabled).length}</dd></div><div><dt>Aggregate energy</dt><dd>${v.configuration.aggregates.length} aggregates; ${v.configuration.aggregates.filter((p) => p.energy_mode !== "none").length} energy totals</dd></div><div><dt>Installed package scope</dt><dd>PQ: ${O(v.configuration.power_quality).join(", ") || "none"}; status: ${O(v.configuration.status_fields).join(", ") || "none"}</dd></div><div><dt>Reporting and entities</dt><dd>${v.configuration.meter.update_interval_s} seconds${u ? `; ${u.numeric_entity_count + u.text_entity_count} public entities, ~${u.approximate_publications_per_second.toFixed(1)} publications/sec` : ""}</dd></div>` : ""}</dl>
      ${Xt(n, e, t, i, s, r, a)}
      <footer class="action-footer"><button class="secondary" @click=${l}>Back</button>
        ${b ? d`<button class="primary" data-action="save-calibration" @click=${c}>${r?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : ""}
        ${b ? "" : d`<button class="primary" data-action="finish" @click=${m}>Finish</button>`}
      </footer>
    </section>
  `;
}
function Jt(n) {
  const e = n.addon_count, t = n.evidence.map((i) => i.source);
  return e < 0 || e > 6 || n.board_count !== e + 1 || n.ct_count !== 6 * (e + 1) || n.group_count !== 2 * (e + 1) || n.evidence.length < 1 || n.evidence.length > 5 || new Set(t).size !== t.length || !t.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || n.evidence.some((i) => i.addon_count !== e);
}
function nn(n, e, t, i, s = !1, r = !1, a = null, o = () => {
}) {
  const c = s || Jt(n);
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
        <tbody>${n.evidence.map((l) => d`
          <tr><td>${l.source.replaceAll("_", " ")}</td><td>${l.addon_count}</td><td>${l.detail}</td></tr>
        `)}</tbody>
      </table>
      ${a ? Zt(a, o) : ""}
      ${c ? d`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : d`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${t}>Back</button>
        ${c ? "" : d`<button class="primary" data-action="continue" ?disabled=${r} @click=${i}>${r ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
function rn(n, e, t, i, s = [], r, a, o, c, l, h, u, m, y) {
  const b = i.length, v = i.slice(0, b).every((x) => Number.isFinite(x) && x > 0), O = t === 0 ? ["meter_main1", "meter_main2"] : [`addon${t}_1`, `addon${t}_2`], p = new Set(a.flatMap((x) => x.state === "applied_pending_restart_verification" && x.gain_evidence?.flash_saved ? [x.gain_evidence.instance_id] : [])), f = p.size === O.length && O.every((x) => p.has(x)), g = a.find((x) => x.retry_allowed) ?? null, _ = a.some((x) => x.state !== "applied_pending_restart_verification" && !x.retry_allowed), k = t === 0 ? "Main Board" : `Add-on ${t}`;
  return d`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${Ft(v, r, f ? a[0] ?? null : null)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: n?.board_count ?? 1 }, (x, A) => d`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${A}`} aria-controls="voltage-board-panel"
          aria-selected=${A === t} tabindex=${A === t ? "0" : "-1"}
          @keydown=${(P) => Re(P, A)}
          @click=${() => c(A)}>${A === 0 ? "Main Board" : `Add-on ${A}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${t}`}>
      <h2>Calibrate Voltage</h2>
      ${zt(e, O, "Voltage", p)}
      <div class="reference-block">
        ${Array.from({ length: b }, (x, A) => d`<label>${s[A] ?? (b === 1 ? "Trusted instrument" : `Voltage ${A + 1}`)} trusted reference
          <input type="number" min="0.01" step="0.01" .value=${i[A] ? String(i[A]) : ""}
            @input=${(P) => l(A, Number(P.target.value))} /></label>`)}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${h} ?disabled=${o}>${o ? "Loading live voltage data…" : "Check stability"}</button>
        <button class="primary" @click=${u} ?disabled=${o || !v || !r?.stable || _ || f && !g}>${g ? "Retry voltage calibration" : "Calibrate voltage"}</button></div>
      ${r ? d`<div class=${r.stable ? "success-band" : "warning-band"} role="status">${r.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${Ze(r)}
      ${f ? d`<div class="success-band" role="status">Voltage calibration complete for ${k}.</div>` : ""}
      ${a.map((x) => Xe(x))}
      ${a.some((x) => x.state === "indeterminate") ? d`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${m}>Reconnect and inspect</button><button class="danger" @click=${y}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const on = si`
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
  .ct-table { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); overflow-x: auto; overflow-y: hidden; }
  .ct-header, .ct-row { display: grid; grid-template-columns: .45fr .45fr 1fr .9fr 1.35fr 1.25fr .75fr .75fr .85fr .65fr .85fr; align-items: center; gap: 10px; padding: 11px 12px; }
  .ct-header { font-weight: var(--ha-font-weight-bold, 700); background: var(--surface-alt); }
  .ct-row { min-height: 66px; border-top: 1px solid var(--border); }
  .ct-index { font-weight: var(--ha-font-weight-bold, 700); }
  .ct-row input, .ct-row select { width: 100%; min-width: 0; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-small); }
  .ct-row input[type="checkbox"] { width: auto; }
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
`, he = [
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
], an = "circuitsetup.6c-energy-meter", cn = 1e4, ln = 250, Ct = (n) => new Promise((e) => setTimeout(e, n)), kt = ({ authoritative: n, warnings: e, ...t }) => t, St = 100;
class dn extends pe {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.addonCount = 0, this.packageOptions = te(0), this.sourcePackageOptions = te(0), this.packageOptionsTouched = !1, this.connection = "wifi", this.electricalSystem = "split_phase_120_240", this.lineFrequencyHz = 60, this.electricalProfileConfirmed = !1, this.meterSettingsDraft = null, this.meterConfiguration = null, this.verifiedMeterConfiguration = null, this.multiReferencePreparationAcknowledged = !1, this.meterFrequencyTouched = !1, this.meterNominalVoltageTouched = /* @__PURE__ */ new Set(), this.canonicalConfigurationChanged = !1, this.board = 0, this.group = 0, this.channel = 1, this.voltageReferences = /* @__PURE__ */ new Map(), this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.drafts = /* @__PURE__ */ new Map(), this.reviewCorrection = null, this.labelOnly = !1, this.error = "", this.announcement = "", this.firmwareIndex = null, this.firmwareCatalogState = "idle", this.firmwareCatalogError = "", this.selectedEspHomeVersion = null, this.resolvedFirmwareOptions = [], this.firmwareFetchController = null, this.setupDeviceIds = /* @__PURE__ */ new Set(), this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.setupUnsub = null, this.sessionStarting = !1, this.pendingAction = "", this.importFailedDeviceId = null, this.newInstallDeviceId = null, this.voltageBusy = !1, this.offsetBusy = !1, this.finishBusy = !1, this.restartBusy = !1, this.voltageSkipped = !1, this.currentSkipped = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = on;
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
    const t = new Ae(this.hass, this.panel.config.entry_id);
    this.api = t;
    try {
      const i = await t.setupStatus();
      if (!this.owns(e, t)) return;
      this.setup = i, this.setupDeviceIds = new Set(i.devices.map((r) => r.entry_id));
      const s = this.setup.installer_intent;
      s && (this.addonCount = s.addon_count, this.connection = s.connection_type, this.packageOptions = s.power_quality && s.status_fields ? { power_quality: [...s.power_quality], status_fields: [...s.status_fields] } : te(s.addon_count), this.sourcePackageOptions = te(s.addon_count), s.electrical_system !== void 0 && s.line_frequency_hz !== void 0 ? (this.electricalSystem = s.electrical_system, this.lineFrequencyHz = s.line_frequency_hz, this.electricalProfileConfirmed = !0) : (this.electricalSystem = "split_phase_120_240", this.lineFrequencyHz = 60, this.electricalProfileConfirmed = !1), this.refreshFirmwareOptions()), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.firstDeviceId(this.setup.devices)), await this.subscribeSetup(e, t), this.transaction && await this.subscribeTransaction(e), this.session && this.session.state !== "cancelled" && await this.subscribeSession(e);
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
    const s = e.devices.filter((r) => !this.setupDeviceIds.has(r.entry_id)).sort((r, a) => r.entry_id.localeCompare(a.entry_id)).filter((r) => r.project_name.startsWith(an));
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
    this.firmwareFetchController?.abort(), this.firmwareFetchController = t, this.firmwareCatalogState = "loading", this.firmwareCatalogError = "", this.requestUpdate(), Ds(globalThis.fetch, t.signal).then((i) => {
      this.ownsFirmwareCatalog(e, t) && (this.firmwareIndex = i, this.firmwareFetchController = null, this.firmwareCatalogState = "ready", this.refreshFirmwareOptions());
    }).catch(() => {
      this.ownsFirmwareCatalog(e, t) && (this.firmwareFetchController = null, this.firmwareCatalogState = "error", this.firmwareCatalogError = "Firmware catalog could not be loaded.", this.requestUpdate());
    });
  }
  refreshFirmwareOptions() {
    const e = this.firmwareIndex ? Fs(this.firmwareIndex, this.addonCount, this.connection) : [], t = this.selectedEspHomeVersion, i = zs(e, t);
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
    const a = await e;
    if (!this.owns(t, i) || !s()) {
      try {
        a();
      } catch {
      }
      return;
    }
    this.unsubs.push(a), r(a);
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
    ++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = e, e !== this.newInstallDeviceId && (this.newInstallDeviceId = null), this.topology = null, this.inventory = null, this.transaction = null, this.reviewCorrection = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.meterSettingsDraft = null, this.meterConfiguration = null, this.verifiedMeterConfiguration = null, this.packageOptionsTouched = !1, this.multiReferencePreparationAcknowledged = !1, this.meterFrequencyTouched = !1, this.meterNominalVoltageTouched = /* @__PURE__ */ new Set(), this.canonicalConfigurationChanged = !1, this.board = 0, this.resetCalibrationRun();
  }
  firstDeviceId(e) {
    return e.map((t) => t.entry_id).sort((t, i) => t.localeCompare(i))[0] ?? null;
  }
  showTopology(e) {
    this.topology = e, this.error = Jt(e) || e.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
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
    this.addonCount = e, this.packageOptions = Ys(this.packageOptions, e), this.sourcePackageOptions = te(e), this.refreshFirmwareOptions();
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
  acceptInstalledDrafts() {
    this.inventory && (this.inventory = { ...this.inventory, channels: this.inventory.channels.map((e) => {
      const t = this.drafts.get(e.channel);
      if (!t) return e;
      const s = this.inventory.catalog.presets.find((r) => r.model_id === t.modelId)?.default_gain_ct ?? t.customGainCt;
      return {
        ...e,
        name: t.name.trim(),
        selected_model_id: t.modelId,
        reporting_multiplier: t.multiplier,
        raw_gain_ct: s === void 0 ? e.raw_gain_ct : Math.round(s / t.multiplier),
        display_label: t.modelId === "custom" && t.customLabel?.trim() || null,
        selection_verified_against_config: !0,
        stored_selection_present: !0
      };
    }) });
  }
  showState(e) {
    this.navigate(e);
  }
  navigate(e) {
    this.step = e, this.error = "", this.mobileStepsOpen = !1, this.focusHeading = !0, this.requestUpdate();
  }
  back() {
    this.step === "meter" ? this.navigate("setup") : this.step === "ct" ? this.navigate("meter") : this.step === "safety" ? this.cancelSession("ct") : this.step === "offset" ? this.navigate("safety") : this.step === "voltage" ? this.navigate("offset") : this.step === "current" ? this.navigate("voltage") : this.step === "restart" ? this.navigate("current") : this.step === "build" ? this.backFromBuild() : this.step === "summary" && this.navigate("build");
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
      const a = await t.getMeterConfiguration(e);
      if (!this.ownsOperation(i, t, e)) return;
      this.setMeterConfiguration(a);
      const o = await t.getTopology(e);
      if (!this.ownsOperation(i, t, e)) return;
      this.importFailedDeviceId = null, this.announcement = "Meter imported into ESPHome Builder.", this.showTopologyResult(o);
    } catch (r) {
      if (!this.ownsOperation(i, t, e)) return;
      this.importFailedDeviceId = e;
      const a = r.code === "device_busy" ? "Finish or cancel current work before importing another meter." : r instanceof Error && r.message === "helper rebind timed out" ? "Import completed, but Home Assistant is still reconnecting. Retry import or reload the helper." : this.safeErrorMessage(r, "Adoption is unavailable for this meter.");
      this.fail(r, a);
    } finally {
      this.ownsOperation(i, t, e) && (this.pendingAction = "", this.requestUpdate());
    }
  }
  async waitForBinding(e, t, i) {
    const s = Date.now() + cn;
    for (; this.ownsOperation(i, e, t); ) {
      const r = s - Date.now();
      if (r <= 0) break;
      try {
        const a = await Promise.race([
          e.setupStatus(),
          Ct(r).then(() => {
            throw new Error("helper rebind timed out");
          })
        ]);
        if (a.bound_device_id === t) return a;
      } catch (a) {
        if (a.code !== "capability_unavailable") throw a;
      }
      if (Date.now() >= s) break;
      await Ct(Math.min(ln, s - Date.now()));
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
  async backFromBuild() {
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    const e = this.api, t = this.selectedDeviceId, i = this.transaction;
    if (i && i.state !== "previewed") {
      this.fail(new Error(), "This review has already advanced. Roll it back before changing the configuration.");
      return;
    }
    const s = this.reviewCorrection ?? (this.meterConfiguration ? {
      sourceSha256: this.meterConfiguration.source_sha256,
      configuration: {
        ...this.meterConfiguration.configuration,
        multi_reference_preparation_acknowledged: !1
      },
      drafts: new Map(this.drafts),
      packageOptions: {
        power_quality: [...this.packageOptions.power_quality],
        status_fields: [...this.packageOptions.status_fields]
      },
      packageOptionsTouched: this.packageOptionsTouched,
      meterFrequencyTouched: this.meterFrequencyTouched,
      meterNominalVoltageTouched: new Set(this.meterNominalVoltageTouched)
    } : null);
    if (!this.calibrationHandoff && !s) {
      this.fail(new Error(), "The edited configuration is unavailable. Return to setup and reload the meter.");
      return;
    }
    this.pendingAction = "review-back", this.error = "", this.requestUpdate();
    const r = ++this.operationGeneration;
    let a = i === null;
    try {
      if (i) {
        if (await e.abandonCtConfig(t, i.transaction_id, i.source_sha256), !this.ownsOperation(r, e, t)) return;
        this.clearSubscription("transaction"), this.transaction = null, a = !0;
      }
      if (this.calibrationHandoff) {
        this.calibrationHandoff = !1, this.navigate("restart");
        return;
      }
      this.reviewCorrection = s;
      const o = await e.getMeterConfiguration(t);
      if (!this.ownsOperation(r, e, t)) return;
      if (o.source_sha256 !== s.sourceSha256) {
        const l = { ...o, configuration: {
          ...o.configuration,
          multi_reference_preparation_acknowledged: !1
        } };
        this.verifiedMeterConfiguration = o.capabilities.configuration_authoritative ? l : null, this.sourcePackageOptions = {
          power_quality: [...o.configuration.power_quality],
          status_fields: [...o.configuration.status_fields]
        }, this.packageOptions = {
          power_quality: [...o.configuration.power_quality],
          status_fields: [...o.configuration.status_fields]
        }, this.packageOptionsTouched = !1, this.meterConfiguration = l, this.meterSettingsDraft = {
          ...o.configuration.meter,
          authoritative: o.capabilities.configuration_authoritative,
          warnings: o.warnings
        }, this.multiReferencePreparationAcknowledged = !1, this.meterFrequencyTouched = !1, this.meterNominalVoltageTouched = /* @__PURE__ */ new Set(), this.canonicalConfigurationChanged = !1, this.showInventory(l), this.reviewCorrection = null, this.error = "The meter source changed while this review was open. Preserved drafts were not restored to avoid overwriting external edits; review the live configuration and reapply changes.", this.announcement = this.error;
        return;
      }
      this.setMeterConfiguration(o);
      const c = {
        ...s.configuration,
        multi_reference_preparation_acknowledged: !1
      };
      this.packageOptions = {
        power_quality: [...s.packageOptions.power_quality],
        status_fields: [...s.packageOptions.status_fields]
      }, this.packageOptionsTouched = s.packageOptionsTouched, this.meterFrequencyTouched = s.meterFrequencyTouched, this.meterNominalVoltageTouched = new Set(s.meterNominalVoltageTouched), this.meterConfiguration = { ...o, configuration: c }, this.meterSettingsDraft = {
        ...c.meter,
        authoritative: o.capabilities.configuration_authoritative,
        warnings: o.warnings
      }, this.multiReferencePreparationAcknowledged = !1, this.canonicalConfigurationChanged = !0, this.showInventory(this.meterConfiguration), this.drafts = new Map(s.drafts), this.reviewCorrection = null, this.announcement = "Review cancelled. Live meter data was reloaded and your edits were preserved.";
    } catch (o) {
      if (!this.ownsOperation(r, e, t)) return;
      a && (this.reviewCorrection = s), this.fail(o, a ? "The review was cancelled, but fresh meter data could not be loaded. Retry Back to preserve your edits." : "The review could not be cancelled. Retry Back before editing the configuration.");
    } finally {
      this.ownsOperation(r, e, t) && (this.pendingAction = "", this.requestUpdate());
    }
  }
  setMeterConfiguration(e) {
    const t = { ...e, configuration: {
      ...e.configuration,
      multi_reference_preparation_acknowledged: !1
    } }, i = t.configuration.meter, s = this.electricalSystem === "split_phase_120_240" ? 120 : this.electricalSystem === "single_phase_230" ? 230 : null, r = i.voltage_layout === "standard" && i.electrical_system === "split_phase_120_240" && i.line_frequency_hz === 60 && i.voltage_references.every((l) => l.nominal_voltage_v === 120), o = this.electricalProfileConfirmed && this.lineFrequencyHz !== null && r ? {
      ...i,
      electrical_system: this.electricalSystem,
      line_frequency_hz: this.lineFrequencyHz,
      voltage_references: i.voltage_references.map((l) => s !== null && !this.meterNominalVoltageTouched.has(l.reference_id) ? { ...l, nominal_voltage_v: s } : l)
    } : i, c = { ...t, configuration: { ...t.configuration, meter: o } };
    this.verifiedMeterConfiguration = e.capabilities.configuration_authoritative ? t : null, this.sourcePackageOptions = {
      power_quality: [...t.configuration.power_quality],
      status_fields: [...t.configuration.status_fields]
    }, this.meterConfiguration = this.packageOptionsTouched ? {
      ...c,
      configuration: { ...c.configuration, ...this.packageOptions }
    } : c, this.packageOptionsTouched || (this.packageOptions = {
      power_quality: [...t.configuration.power_quality],
      status_fields: [...t.configuration.status_fields]
    }), this.canonicalConfigurationChanged = this.packageOptionsTouched || o !== i, this.meterSettingsDraft = {
      ...o,
      authoritative: e.capabilities.configuration_authoritative,
      warnings: e.warnings
    }, this.multiReferencePreparationAcknowledged = !1, this.meterFrequencyTouched = !1, this.meterNominalVoltageTouched = /* @__PURE__ */ new Set();
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
          meter: kt(this.meterSettingsDraft),
          multi_reference_preparation_acknowledged: this.multiReferencePreparationAcknowledged
        }, !1), this.ownsOperation(i, e, t) && this.showInventory(this.meterConfiguration);
      }, "CT inventory could not be loaded.", () => this.ownsOperation(i, e, t));
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
  }
  async recoverCtInventory(e, t, i, s) {
    const r = await e.getCtInventory(t);
    this.ownsOperation(i, e, t) && (this.clearSubscription("transaction"), this.transaction = null, this.showInventory(r), this.drafts = new Map(Array.from(this.drafts, ([a, o]) => [a, s.get(a) ?? o])), this.announcement = "Live CT data reloaded. Review the preserved changes again.");
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
  setPackageOptions(e) {
    const t = {
      power_quality: [...e.power_quality],
      status_fields: [...e.status_fields]
    };
    this.packageOptionsTouched = !0, this.packageOptions = t, this.meterConfiguration ? this.updateCircuitConfiguration({
      ...this.meterConfiguration.configuration,
      ...t
    }) : this.requestUpdate();
  }
  updateMeterSettings(e) {
    if (this.meterSettingsDraft = e, this.multiReferencePreparationAcknowledged = !1, this.meterConfiguration) {
      const t = new Map(e.voltage_references.flatMap((i) => i.group_keys.map((s) => [s, i.reference_id])));
      this.updateCircuitConfiguration({
        ...this.meterConfiguration.configuration,
        meter: kt(e),
        channels: this.meterConfiguration.configuration.channels.map((i) => {
          const s = this.meterConfiguration.channels.find((a) => a.channel === i.channel)?.address, r = s ? `${s.board_index === 0 ? "main" : `addon${s.board_index}`}_${s.group_index + 1}` : `${i.channel <= 6 ? "main" : `addon${Math.floor((i.channel - 1) / 6)}`}_${Math.floor((i.channel - 1) % 6 / 3) + 1}`;
          return { ...i, voltage_reference_id: t.get(r) ?? i.voltage_reference_id };
        }),
        multi_reference_preparation_acknowledged: !1
      });
    }
  }
  disableCircuit(e) {
    if (!this.meterConfiguration) return;
    const t = this.meterConfiguration.configuration.aggregates.filter((a) => a.channels.includes(e)), i = t.filter((a) => {
      const o = a.channels.filter((c) => c !== e).length;
      return !o || a.measurement_method === "two_ct_sum" && o !== 2 || (a.measurement_method === "one_ct_double_power" || a.measurement_method === "both_conductors_one_ct") && o !== 1;
    }), s = i.map((a) => a.name);
    if (t.length && !window.confirm(`Marking CT${e} unused removes it from ${t.map((a) => a.name).join(", ")}${s.length ? ` and deletes invalid aggregate ${s.join(", ")}` : ""}. Continue?`)) {
      this.requestUpdate();
      return;
    }
    const r = new Set(i.map((a) => a.aggregate_id));
    this.updateCircuitConfiguration({
      ...this.meterConfiguration.configuration,
      channels: this.meterConfiguration.configuration.channels.map((a) => a.channel === e ? { ...a, enabled: !1, role: "unused" } : a),
      aggregates: this.meterConfiguration.configuration.aggregates.filter((a) => !i.includes(a)).map((a) => ({
        ...a,
        parent_id: a.parent_id !== null && r.has(a.parent_id) ? null : a.parent_id,
        channels: a.channels.filter((o) => o !== e)
      }))
    });
  }
  hasPackageChanges() {
    return !!(this.sourcePackageOptions && ["power_quality", "status_fields"].some((e) => this.packageOptions[e].some((t, i) => t !== this.sourcePackageOptions?.[e][i])));
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    let e = re(this.inventory, this.drafts);
    if (!e.length && !this.hasPackageChanges())
      return this.fail(new Error(), "Select at least one configuration change before review.");
    const t = this.api, i = this.selectedDeviceId, s = this.inventory, r = ++this.operationGeneration;
    if (this.clearSubscription("transaction"), this.transaction = null, this.labelOnly && e.length) {
      const a = e.filter((o) => o.name !== this.inventory.channels.find((c) => c.channel === o.channel)?.name).map(({ channel: o, name: c }) => ({ channel: o, name: c }));
      if (!a.length || e.some((o) => {
        const c = this.inventory.channels.find((l) => l.channel === o.channel);
        return !c || o.model_id !== (c.selected_model_id ?? "") || (o.reporting_multiplier ?? 1) !== c.reporting_multiplier;
      }))
        return this.fail(new Error(), "Home Assistant label mode only permits display-name edits.");
      if (await this.run(
        async () => {
          await t.setHaLabels(i, s.plan_id, s.source_sha256, a), this.announcement = "Home Assistant labels saved.";
        },
        "Home Assistant labels could not be saved.",
        () => this.ownsOperation(r, t, i)
      ), this.error || !this.hasPackageChanges()) return;
      e = [];
    }
    await this.run(
      async () => {
        let a;
        try {
          const o = await t.getCtInventory(i);
          if (!this.ownsOperation(r, t, i)) return;
          a = await t.previewCtConfig(
            i,
            o.plan_id,
            o.source_sha256,
            e,
            this.sourcePackageOptions ? this.packageOptions : void 0
          );
        } catch (o) {
          if (o.code !== "stale_confirmation") throw o;
          await this.recoverCtInventory(t, i, r, this.drafts);
          return;
        }
        this.ownsOperation(r, t, i) && (this.transaction = a, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "The configuration preview is stale. Reload the CT inventory and review again.",
      () => this.ownsOperation(r, t, i)
    );
  }
  async subscribeTransaction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const t = this.api;
    this.clearSubscription("transaction");
    const i = this.transactionSubscriptionScope, s = this.selectedDeviceId, r = this.transaction.transaction_id, a = this.transaction.source_sha256;
    await this.ownSubscription(
      t.subscribeConfigTransaction(
        s,
        r,
        a,
        (o) => {
          this.owns(e, t) && i === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === r && this.transaction.source_sha256 === a && o.transaction_id === r && o.source_sha256 === a && (this.transaction = o, this.requestUpdate());
        }
      ),
      e,
      t,
      () => i === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === r && this.transaction.source_sha256 === a,
      (o) => {
        this.transactionUnsub = o;
      }
    );
  }
  async continueFromCt() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || this.pendingAction) return;
    if (this.meterConfiguration && !this.labelOnly && this.canonicalConfigurationChanged) return this.previewCanonicalConfiguration();
    const e = re(this.inventory, this.drafts);
    if (this.labelOnly && e.length) {
      const t = e.map(({ channel: o, name: c }) => ({ channel: o, name: c })), i = this.api, s = this.selectedDeviceId, r = this.inventory, a = ++this.operationGeneration;
      if (this.pendingAction = "session", this.requestUpdate(), await this.run(async () => {
        await i.setHaLabels(s, r.plan_id, r.source_sha256, t), this.ownsOperation(a, i, s) && (this.inventory = { ...r, channels: r.channels.map((o) => {
          const c = t.find((l) => l.channel === o.channel);
          return c ? { ...o, name: c.name } : o;
        }) }, this.announcement = "Home Assistant labels saved.");
      }, "Home Assistant labels could not be saved.", () => this.ownsOperation(a, i, s)), this.pendingAction = "", this.error) return;
    }
    if (this.meterConfiguration && this.canonicalConfigurationChanged) return this.previewCanonicalConfiguration();
    await this.startSession();
  }
  async previewCanonicalConfiguration() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || !this.meterConfiguration) return;
    const e = this.meterConfiguration.configuration;
    if (!ls(e, this.inventory.channels.length)) return this.fail(new Error(), "Complete the circuit and aggregate assignments before review.");
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
        const a = this.inventory && !this.labelOnly ? re(this.inventory, this.drafts) : [], o = await e.previewCalibratedGains(
          i,
          s,
          a,
          this.sourcePackageOptions ? this.packageOptions : void 0
        );
        !this.ownsOperation(r, e, t) || this.session?.session_id !== i || this.restartResult?.verification_id !== s || (this.calibrationHandoff = !0, this.transaction = o, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
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
        const a = await t.clearCalibrationFlash(
          s,
          e.verification_id,
          e.source_handoff_transaction_id,
          this.topology
        );
        !this.ownsOperation(r, t, i) || this.session?.session_id !== s || (this.restartResult = a, this.announcement = "Calibration saved to YAML; flash values cleared.", this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash."));
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
        const a = [i, s.transaction_id, s.source_sha256];
        let o;
        try {
          o = e === "apply" ? await t.applyCtConfig(...a) : e === "compile" ? await t.compileCtConfig(...a) : e === "install" ? await t.installCtConfig(...a) : await t.rollbackCtConfig(...a);
        } catch (c) {
          if (c.code !== "stale_confirmation") throw c;
          await this.recoverCtInventory(t, i, r, this.drafts);
          return;
        }
        if (!(!this.ownsOperation(r, t, i) || this.transaction?.transaction_id !== s.transaction_id || this.transaction.source_sha256 !== s.source_sha256)) {
          if (this.transaction = o, this.announcement = `Configuration ${this.transaction.state}.`, e === "apply" && o.state === "validated" && this.sourcePackageOptions)
            this.sourcePackageOptions = {
              power_quality: [...this.packageOptions.power_quality],
              status_fields: [...this.packageOptions.status_fields]
            };
          else if (e === "rollback" && o.state === "rolled_back" && this.sourcePackageOptions) {
            const c = {
              power_quality: [...this.sourcePackageOptions.power_quality],
              status_fields: [...this.sourcePackageOptions.status_fields]
            };
            for (const l of o.changes) {
              const h = /^package\.(main|addon([1-6]))\.(power_quality|status_fields)$/.exec(l.key);
              if (!h || !["enabled", "disabled"].includes(l.old_value ?? "")) continue;
              const u = h[1] === "main" ? 0 : Number(h[2]), m = h[3];
              c[m][u] = l.old_value === "enabled";
            }
            this.sourcePackageOptions = c;
          }
          if (e === "install" && this.calibrationHandoff && o.state === "verified" && this.session && this.topology && this.restartResult) {
            this.restartResult = {
              ...this.restartResult,
              source_handoff_available: !1,
              source_handoff_transaction_id: o.transaction_id,
              source_handoff_firmware_installed: !0
            }, this.navigate("summary");
            const c = await t.clearCalibrationFlash(
              this.session.session_id,
              this.restartResult.verification_id,
              o.transaction_id,
              this.topology
            );
            if (!this.ownsOperation(r, t, i)) return;
            this.restartResult = c, this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash.");
          } else e === "install" && o.state === "verified" && (this.meterConfiguration && (this.verifiedMeterConfiguration = {
            ...this.meterConfiguration,
            configuration: { ...this.meterConfiguration.configuration, multi_reference_preparation_acknowledged: !1 }
          }), this.acceptInstalledDrafts(), this.canonicalConfigurationChanged = !1, this.announcement = "Configuration changes were installed and verified. Continue to safety and calibration.");
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
      t.subscribeSession(s, (a) => {
        this.owns(e, t) && i === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === r && a.session_id === s && a.device_id === r && (this.session = a, this.requestUpdate());
      }),
      e,
      t,
      () => i === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === r,
      (a) => {
        this.sessionUnsub = a;
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
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.board, r = this.offsetStage, a = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const o = await e.checkOffsetReadiness(i, s, r);
          !this.ownsOperation(a, e, t) || this.session?.session_id !== i || (this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget).set(this.offsetKey(s, r), o), this.announcement = o.ready ? `Board ${s + 1} Stage ${r} measured readiness passed.` : `Board ${s + 1} Stage ${r} measured readiness did not pass.`);
        },
        "Measured offset readiness could not be collected. Reconnect and inspect the meter.",
        () => this.ownsOperation(a, e, t)
      );
    } finally {
      this.offsetBusy = !1, this.requestUpdate();
    }
  }
  async calibrateOffset() {
    if (!this.api || !this.session || this.offsetBusy) return;
    const e = this.api, t = this.selectedDeviceId, i = this.session.session_id, s = this.board, r = this.offsetStage, a = this.offsetKey(s, r), o = this.offsetResultByTarget.get(a), c = this.session.offset_boards?.[s]?.stages[r - 1]?.state, l = !!o?.retry_allowed || c === "partial" || c === "indeterminate";
    if (this.offsetAcknowledged[r - 1] !== !0 || l && !this.offsetRetryConfirmed) return;
    const h = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const u = await e.calibrateOffset(i, s, r, !0, l);
          if (!this.ownsOperation(h, e, t) || this.session?.session_id !== i) return;
          this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(a, u);
          const m = (this.session.offset_boards ?? []).map((v) => v.board_index !== s ? v : {
            ...v,
            stages: v.stages.map((O) => O.stage !== r ? O : {
              ...O,
              state: u.state === "applied_pending_restart_verification" ? "completed" : u.state
            })
          }), y = m.flatMap((v) => v.stages.map((O) => O.state)), b = y.every((v) => v === "completed") ? "completed" : y.some((v) => v === "partial" || v === "indeterminate") ? "partial" : "in_progress";
          this.session = {
            ...this.session,
            offset_boards: m,
            offset_disposition: b,
            has_pending_calibration: this.session.has_pending_calibration || u.expected_tables.length > 0
          }, this.offsetAcknowledged = this.offsetAcknowledged.map((v, O) => O === r - 1 ? !1 : v), this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget), this.offsetReadinessByTarget.delete(a), this.offsetRetryConfirmed = !1, this.announcement = u.state === "applied_pending_restart_verification" ? `Board ${s + 1} Stage ${r} saved; restart verification required.` : `Board ${s + 1} Stage ${r} requires recovery before retry.`;
        },
        "Offset calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(h, e, t)
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
    if (this.inventory && !this.labelOnly && re(this.inventory, this.drafts).length) {
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
    const t = this.api, i = this.selectedDeviceId, s = this.session.session_id, r = ++this.operationGeneration, a = e === "voltage" ? this.voltageReferenceIds() : this.currentReferenceEntries().map((o) => String(o.channel));
    if (a.length) {
      e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
      try {
        await this.run(async () => {
          if (e === "voltage") {
            const o = new Map(this.stabilityByTarget);
            for (const c of a) {
              const l = await t.checkStability(s, "voltage", c);
              if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
              o.set(`voltage:${c}`, l);
            }
            this.stabilityByTarget = o, this.announcement = "Loaded voltage data for the selected reference.";
            return;
          }
          for (const [o, c] of a.entries()) {
            const l = await t.checkStability(s, e, c);
            if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${c}`, l), o < a.length - 1 && this.requestUpdate();
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
    e === "voltage" ? this.voltageReferenceIds() : this.currentReferenceEntries().map((o) => String(o.channel));
    const a = this.currentReferenceEntries();
    if (e === "current" && !a.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      return;
    }
    e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
    try {
      await this.run(
        async () => {
          if (e === "voltage") {
            if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
            const l = new Map(this.calibrationByTarget), h = this.voltageReferenceIds().map((u, m) => ({ referenceId: u, value: this.voltageReferences instanceof Map ? this.voltageReferences.get(u) ?? 0 : this.voltageReferences[m] ?? 0 })).filter(({ referenceId: u }) => !this.voltageReferenceComplete(u));
            if (h.some(({ value: u }) => !Number.isFinite(u) || u < 1 || u > 600) || h.some(({ referenceId: u }) => !this.stabilityByTarget.get(`voltage:${u}`)?.stable))
              throw new Error("Voltage references must be valid and stable before calibration.");
            for (const { referenceId: u, value: m } of h) {
              const y = await t.calibrateVoltage(s, u, m, !0);
              if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
              y.forEach((b) => l.set(`voltage:${b.group_key}`, b)), this.calibrationByTarget = new Map(l), this.requestUpdate();
            }
            this.calibrationByTarget = l, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = "Calibrated the selected voltage reference.";
            return;
          }
          const o = await t.calibrateCurrent(
            s,
            a,
            !0,
            this.inventory && !this.labelOnly ? re(this.inventory, this.drafts).map((l) => ({
              channel: l.channel,
              reporting_multiplier: l.reporting_multiplier ?? 1
            })) : []
          );
          if (!this.ownsOperation(r, t, i) || this.session?.session_id !== s) return;
          const c = new Map(this.calibrationByTarget);
          a.forEach((l) => c.set(`current:${l.channel}`, o)), this.calibrationByTarget = c, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = `Calibration iteration ${o.iteration} finished with state ${o.state}.`;
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
          let o;
          try {
            o = await e.restartAndVerify(i, s);
          } catch (c) {
            throw this.ownsOperation(r, e, t) && this.session?.session_id === i && this.topology === s && (this.restartResult = null, this.session = { ...this.session, state: "restart_failed" }), c;
          }
          !this.ownsOperation(r, e, t) || this.session?.session_id !== i || this.topology !== s || (this.restartResult = o, this.completedWithoutChanges = !1, this.session = { ...this.session, state: "verified" });
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
      const a = await t.cancelSession(s);
      !this.ownsOperation(r, t, i) || this.session?.session_id !== s || (this.clearSubscription("session"), this.session = a, this.restartResult = null, e && this.navigate(e), this.announcement = e === "setup" ? "No changes were made. Select another device to configure." : e === "ct" ? "Calibration session closed. Review CT names and types before continuing." : "Calibration session cancelled; cleanup completed without restart verification.");
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(r, t, i));
  }
  async finishWithoutCalibration() {
    if (this.pendingAction) return;
    this.pendingAction = "finish", this.requestUpdate();
    const e = this.inventory && !this.labelOnly ? re(this.inventory, this.drafts) : [];
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
    const t = this.currentReferenceEntries().map((r) => String(r.channel)), i = Math.floor((this.channel - 1) / 3) * 3 + 1, s = e === "voltage" ? this.voltageGroupKeys() : t.length ? t : Array.from({ length: 3 }, (r, a) => String(i + a));
    for (const r of [...s].reverse()) {
      const a = this.calibrationByTarget.get(`${e}:${r}`);
      if (a) return a;
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
      const r = s.code, a = r === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : r === "stale_handle" ? "The selected device changed or is no longer available. Rescan and try again." : t;
      this.fail(s, a);
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
    if (this.step === "setup") return d`${tn(
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
      (e) => this.setPackageOptions(e),
      this.electricalSystem,
      this.lineFrequencyHz,
      this.electricalProfileConfirmed,
      (e) => this.setElectricalSystem(e),
      (e) => this.setLineFrequency(e),
      () => this.confirmElectricalProfile()
    )}
      ${this.topology ? nn(
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
      (e) => this.setPackageOptions(e)
    ) : M}`;
    if (this.step === "meter" && this.meterSettingsDraft && this.meterConfiguration) return _s(
      this.meterSettingsDraft,
      this.meterConfiguration.voltage_transformer_catalog,
      this.multiReferencePreparationAcknowledged,
      (e) => this.updateMeterSettings(e),
      (e) => this.setMeterProfile(e),
      (e) => this.setMeterFrequency(e),
      (e, t) => this.setMeterNominalVoltage(e, t),
      (e) => {
        this.multiReferencePreparationAcknowledged = e, this.meterConfiguration && this.updateCircuitConfiguration({
          ...this.meterConfiguration.configuration,
          multi_reference_preparation_acknowledged: e
        }, !1), this.requestUpdate();
      },
      () => this.back(),
      () => {
        this.continueFromMeterSettings();
      }
    );
    if (this.step === "ct" && this.inventory) {
      const e = this.meterConfiguration ? Ce(this.meterConfiguration.configuration, this.meterConfiguration.topology) : null, t = e ? e.numeric_entity_count + e.text_entity_count : 0;
      return d`${e ? d`<div class=${t >= St ? "warning-band" : "info-band"} role="status">${t >= St ? d`<strong>Warning: high entity count. </strong>` : M}${e.enabled_channel_count} enabled channels; ${t} public entities (${e.numeric_entity_count} numeric, ${e.text_entity_count} text), ${e.energy_entity_count} energy; approximately ${e.approximate_publications_per_second.toFixed(1)} publications/sec.</div>` : M}<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
        this.labelOnly = !1, this.requestUpdate();
      }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
        this.labelOnly = !0, this.requestUpdate();
      }}>Home Assistant labels only</label></fieldset>${ns(
        this.inventory,
        this.board,
        this.drafts,
        (i) => {
          this.board = i, this.requestUpdate();
        },
        (i, s) => this.updateDraft(i, s),
        () => this.back(),
        () => {
          this.continueFromCt();
        },
        this.labelOnly,
        this.pendingAction === "session",
        this.labelOnly ? null : this.meterConfiguration?.configuration ?? null,
        (i) => this.updateCircuitConfiguration(i),
        (i) => this.disableCircuit(i),
        this.meterConfiguration?.capabilities.managed_totals ?? !0,
        this.meterConfiguration?.capabilities.reason_codes.join(", ") ?? ""
      )}`;
    }
    return this.step === "build" ? ss(
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
      () => {
        this.backFromBuild();
      },
      () => {
        this.startSession();
      },
      this.meterConfiguration?.configuration ?? null,
      this.meterConfiguration ? Ce(this.meterConfiguration.configuration, this.meterConfiguration.topology) : null,
      this.pendingAction === "review-back",
      this.reviewCorrection !== null
    ) : this.step === "safety" ? Js(
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
    ) : this.step === "offset" ? Ws(
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
    ) : this.step === "voltage" ? d`${this.meterSettingsDraft?.warnings.includes("slow_interval_extends_calibration") ? d`<div class="warning-band" role="status">This meter uses a ${this.meterSettingsDraft.update_interval_s}-second update interval. Calibration takes longer; keep the reference stable until each check finishes.</div>` : M}${rn(
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
        <button class="primary" ?disabled=${this.voltageBusy || !this.voltageSkipped && !this.hasCompletedCalibration("voltage")} @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? d`${us(
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
    }}>${this.finishBusy ? "Finishing…" : "Continue"}</button></footer>` : this.step === "restart" ? Zs(
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
    ) : this.step === "summary" ? sn(
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
      () => this.back(),
      this.verifiedMeterConfiguration,
      this.verifiedMeterConfiguration ? Ce(this.verifiedMeterConfiguration.configuration, this.verifiedMeterConfiguration.topology) : null,
      () => this.finishFlow("Meter configuration and calibration are complete.")
    ) : d`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct" ? "Circuits & CTs are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }
  firmwareCatalog() {
    const e = this.firmwareCatalogState === "loading";
    return d`<section class="step-content" aria-labelledby="firmware-heading">
      <h2 id="firmware-heading">Install firmware</h2>
      <label>ESPHome firmware version
        <select data-action="firmware-version" ?disabled=${e || this.firmwareCatalogState !== "ready" || !this.resolvedFirmwareOptions.length}
          @change=${(t) => this.selectFirmwareVersion(t.target.value)}>
          ${this.resolvedFirmwareOptions.map((t, i) => d`<option value=${t.version} ?selected=${t.version === this.selectedEspHomeVersion}>${t.version}${i === 0 ? " (newest)" : ""}</option>`)}
        </select>
      </label>
      ${this.firmwareCatalogState === "error" ? d`<div class="error-panel" role="status">
        <strong>${this.firmwareCatalogError}</strong>
        <button class="secondary" data-action="firmware-retry" @click=${() => this.retryFirmwareIndex()}>Retry</button>
      </div>` : M}
      ${e ? d`<p role="status">Loading firmware versions…</p>` : M}
      ${this.firmwareCatalogState === "ready" && !this.resolvedFirmwareOptions.length ? d`<p role="status">No firmware version is available for this hardware.</p>` : M}
      ${this.firmwareCatalogState === "ready" ? Vs(this.selectedFirmware()) : M}
    </section>`;
  }
  render() {
    const e = he.findIndex(([t]) => t === this.step);
    return d`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${he.map(([t, i], s) => d`
            <li class=${s === e ? "current" : ""}>
              <button class="step-button" aria-current=${s === e ? "step" : M}
                ?disabled=${s > e || s < e && t !== "setup"}
                @click=${() => t === "setup" && s < e ? this.returnToSetup() : void 0}><span class="number">${s + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${e + 1} of ${he.length} — ${he[e]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${he[e]?.[1]}</h1>
          ${this.error ? d`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : M}
          ${this.stepBody()}
          ${e >= 2 && !["voltage", "current", "summary"].includes(this.step) ? Xt(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : M}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", dn);
export {
  dn as CircuitSetupPanel
};
