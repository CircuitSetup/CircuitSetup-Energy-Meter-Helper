const F = globalThis, it = F.ShadowRoot && (F.ShadyCSS === void 0 || F.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, st = /* @__PURE__ */ Symbol(), pt = /* @__PURE__ */ new WeakMap();
let Et = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== st) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (it && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = pt.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && pt.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const jt = (n) => new Et(typeof n == "string" ? n : n + "", void 0, st), Bt = (n, ...t) => {
  const e = n.length === 1 ? n[0] : t.reduce((i, s, o) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + n[o + 1], n[0]);
  return new Et(e, n, st);
}, Gt = (n, t) => {
  if (it) n.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), s = F.litNonce;
    s !== void 0 && i.setAttribute("nonce", s), i.textContent = e.cssText, n.appendChild(i);
  }
}, ht = it ? (n) => n : (n) => n instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return jt(e);
})(n) : n;
const { is: qt, defineProperty: Ht, getOwnPropertyDescriptor: zt, getOwnPropertyNames: Vt, getOwnPropertySymbols: Lt, getPrototypeOf: Ft } = Object, Z = globalThis, ut = Z.trustedTypes, Wt = ut ? ut.emptyScript : "", Kt = Z.reactiveElementPolyfillSupport, B = (n, t) => n, tt = { toAttribute(n, t) {
  switch (t) {
    case Boolean:
      n = n ? Wt : null;
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
} }, It = (n, t) => !qt(n, t), gt = { attribute: !0, type: String, converter: tt, reflect: !1, useDefault: !1, hasChanged: It };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), Z.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let N = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = gt) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(t, i, e);
      s !== void 0 && Ht(this.prototype, t, s);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: s, set: o } = zt(this.prototype, t) ?? { get() {
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
    return this.elementProperties.get(t) ?? gt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(B("elementProperties"))) return;
    const t = Ft(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(B("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(B("properties"))) {
      const e = this.properties, i = [...Vt(e), ...Lt(e)];
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
      for (const s of i) e.unshift(ht(s));
    } else t !== void 0 && e.push(ht(t));
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
    return Gt(t, this.constructor.elementStyles), t;
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
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : tt).toAttribute(e, i.type);
      this._$Em = t, o == null ? this.removeAttribute(s) : this.setAttribute(s, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, s = i._$Eh.get(t);
    if (s !== void 0 && this._$Em !== s) {
      const o = i.getPropertyOptions(s), r = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : tt;
      this._$Em = s;
      const a = r.fromAttribute(e, o.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, s = !1, o) {
    if (t !== void 0) {
      const r = this.constructor;
      if (s === !1 && (o = this[t]), i ??= r.getPropertyOptions(t), !((i.hasChanged ?? It)(o, e) || i.useDefault && i.reflect && o === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, i)))) return;
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
N.elementStyles = [], N.shadowRootOptions = { mode: "open" }, N[B("elementProperties")] = /* @__PURE__ */ new Map(), N[B("finalized")] = /* @__PURE__ */ new Map(), Kt?.({ ReactiveElement: N }), (Z.reactiveElementVersions ??= []).push("2.1.2");
const nt = globalThis, ft = (n) => n, K = nt.trustedTypes, _t = K ? K.createPolicy("lit-html", { createHTML: (n) => n }) : void 0, Tt = "$lit$", E = `lit$${Math.random().toFixed(9).slice(2)}$`, Ot = "?" + E, Jt = `<${Ot}>`, O = document, q = () => O.createComment(""), H = (n) => n === null || typeof n != "object" && typeof n != "function", ot = Array.isArray, Zt = (n) => ot(n) || typeof n?.[Symbol.iterator] == "function", X = `[\x20\t
\f\r]`, D = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, vt = /-->/g, mt = />/g, I = RegExp(`>|${X}(?:([^\\s"'>=/]+)(${X}*=${X}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), bt = /'/g, $t = /"/g, Rt = /^(?:script|style|textarea|title)$/i, Yt = (n) => (t, ...e) => ({ _$litType$: n, strings: t, values: e }), l = Yt(1), U = /* @__PURE__ */ Symbol.for("lit-noChange"), m = /* @__PURE__ */ Symbol.for("lit-nothing"), yt = /* @__PURE__ */ new WeakMap(), T = O.createTreeWalker(O, 129);
function Nt(n, t) {
  if (!ot(n) || !n.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return _t !== void 0 ? _t.createHTML(t) : t;
}
const Xt = (n, t) => {
  const e = n.length - 1, i = [];
  let s, o = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = D;
  for (let a = 0; a < e; a++) {
    const d = n[a];
    let u, h, c = -1, p = 0;
    for (; p < d.length && (r.lastIndex = p, h = r.exec(d), h !== null); ) p = r.lastIndex, r === D ? h[1] === "!--" ? r = vt : h[1] !== void 0 ? r = mt : h[2] !== void 0 ? (Rt.test(h[2]) && (s = RegExp("</" + h[2], "g")), r = I) : h[3] !== void 0 && (r = I) : r === I ? h[0] === ">" ? (r = s ?? D, c = -1) : h[1] === void 0 ? c = -2 : (c = r.lastIndex - h[2].length, u = h[1], r = h[3] === void 0 ? I : h[3] === '"' ? $t : bt) : r === $t || r === bt ? r = I : r === vt || r === mt ? r = D : (r = I, s = void 0);
    const g = r === I && n[a + 1].startsWith("/>") ? " " : "";
    o += r === D ? d + Jt : c >= 0 ? (i.push(u), d.slice(0, c) + Tt + d.slice(c) + E + g) : d + E + (c === -2 ? a : g);
  }
  return [Nt(n, o + (n[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class z {
  constructor({ strings: t, _$litType$: e }, i) {
    let s;
    this.parts = [];
    let o = 0, r = 0;
    const a = t.length - 1, d = this.parts, [u, h] = Xt(t, e);
    if (this.el = z.createElement(u, i), T.currentNode = this.el.content, e === 2 || e === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (s = T.nextNode()) !== null && d.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const c of s.getAttributeNames()) if (c.endsWith(Tt)) {
          const p = h[r++], g = s.getAttribute(c).split(E), v = /([.?@])?(.*)/.exec(p);
          d.push({ type: 1, index: o, name: v[2], strings: g, ctor: v[1] === "." ? te : v[1] === "?" ? ee : v[1] === "@" ? ie : Y }), s.removeAttribute(c);
        } else c.startsWith(E) && (d.push({ type: 6, index: o }), s.removeAttribute(c));
        if (Rt.test(s.tagName)) {
          const c = s.textContent.split(E), p = c.length - 1;
          if (p > 0) {
            s.textContent = K ? K.emptyScript : "";
            for (let g = 0; g < p; g++) s.append(c[g], q()), T.nextNode(), d.push({ type: 2, index: ++o });
            s.append(c[p], q());
          }
        }
      } else if (s.nodeType === 8) if (s.data === Ot) d.push({ type: 2, index: o });
      else {
        let c = -1;
        for (; (c = s.data.indexOf(E, c + 1)) !== -1; ) d.push({ type: 7, index: o }), c += E.length - 1;
      }
      o++;
    }
  }
  static createElement(t, e) {
    const i = O.createElement("template");
    return i.innerHTML = t, i;
  }
}
function P(n, t, e = n, i) {
  if (t === U) return t;
  let s = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const o = H(t) ? void 0 : t._$litDirective$;
  return s?.constructor !== o && (s?._$AO?.(!1), o === void 0 ? s = void 0 : (s = new o(n), s._$AT(n, e, i)), i !== void 0 ? (e._$Co ??= [])[i] = s : e._$Cl = s), s !== void 0 && (t = P(n, s._$AS(n, t.values), s, i)), t;
}
class Qt {
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
    const { el: { content: e }, parts: i } = this._$AD, s = (t?.creationScope ?? O).importNode(e, !0);
    T.currentNode = s;
    let o = T.nextNode(), r = 0, a = 0, d = i[0];
    for (; d !== void 0; ) {
      if (r === d.index) {
        let u;
        d.type === 2 ? u = new V(o, o.nextSibling, this, t) : d.type === 1 ? u = new d.ctor(o, d.name, d.strings, this, t) : d.type === 6 && (u = new se(o, this, t)), this._$AV.push(u), d = i[++a];
      }
      r !== d?.index && (o = T.nextNode(), r++);
    }
    return T.currentNode = O, s;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class V {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, i, s) {
    this.type = 2, this._$AH = m, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = s, this._$Cv = s?.isConnected ?? !0;
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
    t = P(this, t, e), H(t) ? t === m || t == null || t === "" ? (this._$AH !== m && this._$AR(), this._$AH = m) : t !== this._$AH && t !== U && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Zt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== m && H(this._$AH) ? this._$AA.nextSibling.data = t : this.T(O.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, s = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = z.createElement(Nt(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === s) this._$AH.p(e);
    else {
      const o = new Qt(s, this), r = o.u(this.options);
      o.p(e), this.T(r), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = yt.get(t.strings);
    return e === void 0 && yt.set(t.strings, e = new z(t)), e;
  }
  k(t) {
    ot(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, s = 0;
    for (const o of t) s === e.length ? e.push(i = new V(this.O(q()), this.O(q()), this, this.options)) : i = e[s], i._$AI(o), s++;
    s < e.length && (this._$AR(i && i._$AB.nextSibling, s), e.length = s);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = ft(t).nextSibling;
      ft(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class Y {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, s, o) {
    this.type = 1, this._$AH = m, this._$AN = void 0, this.element = t, this.name = e, this._$AM = s, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = m;
  }
  _$AI(t, e = this, i, s) {
    const o = this.strings;
    let r = !1;
    if (o === void 0) t = P(this, t, e, 0), r = !H(t) || t !== this._$AH && t !== U, r && (this._$AH = t);
    else {
      const a = t;
      let d, u;
      for (t = o[0], d = 0; d < o.length - 1; d++) u = P(this, a[i + d], e, d), u === U && (u = this._$AH[d]), r ||= !H(u) || u !== this._$AH[d], u === m ? t = m : t !== m && (t += (u ?? "") + o[d + 1]), this._$AH[d] = u;
    }
    r && !s && this.j(t);
  }
  j(t) {
    t === m ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class te extends Y {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === m ? void 0 : t;
  }
}
class ee extends Y {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== m);
  }
}
class ie extends Y {
  constructor(t, e, i, s, o) {
    super(t, e, i, s, o), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = P(this, t, e, 0) ?? m) === U) return;
    const i = this._$AH, s = t === m && i !== m || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, o = t !== m && (i === m || s);
    s && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class se {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    P(this, t);
  }
}
const ne = nt.litHtmlPolyfillSupport;
ne?.(z, V), (nt.litHtmlVersions ??= []).push("3.3.3");
const oe = (n, t, e) => {
  const i = e?.renderBefore ?? t;
  let s = i._$litPart$;
  if (s === void 0) {
    const o = e?.renderBefore ?? null;
    i._$litPart$ = s = new V(t.insertBefore(q(), o), o, void 0, e ?? {});
  }
  return s._$AI(n), s;
};
const rt = globalThis;
class G extends N {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = oe(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return U;
  }
}
G._$litElement$ = !0, G.finalized = !0, rt.litElementHydrateSupport?.({ LitElement: G });
const re = rt.litElementPolyfillSupport;
re?.({ LitElement: G });
(rt.litElementVersions ??= []).push("4.2.2");
const wt = "circuitsetup_energy_meter_helper/", ae = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, ce = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, de = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, le = /[\u0000-\u001f\u007f-\u009f]/, pe = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), he = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), ue = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "indeterminate", "verified", "cancelled"]), at = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), St = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), Ut = /* @__PURE__ */ new Set(["A", "B", "C"]), ge = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), fe = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), _e = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), ve = /* @__PURE__ */ new Set(["invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), me = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), be = /^(?:ct(?:[1-9]|[1-3][0-9]|4[0-2])_name|current_cal_ct(?:[1-9]|[1-3][0-9]|4[0-2])|voltage_cal[12])$/, $e = /^[0-9a-f]{12}$/, ye = /^[0-9a-f]{64}$/, xt = /^[0-9a-f]{32}$/, we = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/;
function b(n, t) {
  if (n === null || typeof n != "object" || Array.isArray(n)) throw new Error(`${t} response is invalid`);
  return n;
}
function w(n, t, e = 100) {
  if (!Array.isArray(n) || n.length > e) throw new Error(`${t} response is invalid`);
  return n;
}
function f(n, t, e = !1) {
  if (e && n === null) return null;
  if (typeof n != "string" || n.length === 0) throw new Error(`${t} response is invalid`);
  return n;
}
function C(n, t) {
  if (typeof n != "number" || !Number.isFinite(n)) throw new Error(`${t} response is invalid`);
  return n;
}
function y(n, t) {
  const e = C(n, t);
  if (!Number.isInteger(e)) throw new Error(`${t} response is invalid`);
  return e;
}
function A(n, t, e = !1) {
  if (e && n === null) return null;
  if (typeof n != "boolean") throw new Error(`${t} response is invalid`);
  return n;
}
function S(n, t, e) {
  const i = f(n, e);
  if (!t.has(i)) throw new Error(`${e} response is invalid`);
  return i;
}
function et(n, t) {
  n !== void 0 && f(n, t, !0);
}
function W(n, t) {
  return Math.abs(n - t) <= 1e-9 * Math.max(1, Math.abs(n), Math.abs(t));
}
function Pt(n, t) {
  const e = b(n, t);
  f(e.entry_id, t), f(e.title, t), f(e.project_name, t), f(e.project_version, t, !0), A(e.importable, t, !0), f(e.configuration, t, !0);
}
function L(n, t) {
  const e = b(n, t);
  if (S(e.state, pe, t), w(e.devices, t).forEach((i) => Pt(i, t)), e.configuration_authoritative !== void 0 && A(e.configuration_authoritative, t), e.installer_intent !== void 0) {
    const i = b(e.installer_intent, t), s = y(i.addon_count, t);
    if (s < 0 || s > 6) throw new Error(`${t} response is invalid`);
    if (S(i.connection_type, at, t) === "unknown") throw new Error(`${t} response is invalid`);
  }
  return n;
}
function Ct(n, t) {
  const e = b(n, t), i = y(e.addon_count, t), s = y(e.board_count, t), o = y(e.ct_count, t), r = y(e.group_count, t);
  if (i < 0 || i > 6 || s < 1 || s > 7 || o < 6 || o > 42 || r < 2 || r > 14 || s !== i + 1 || o !== 6 * s || r !== 2 * s) throw new Error(`${t} response is invalid`);
  S(e.connection_type, at, t), f(e.voltage_layout, t), f(e.project_name, t);
  const a = w(e.evidence, t);
  if (a.length < 1 || a.length > St.size) throw new Error(`${t} response is invalid`);
  const d = a.map((u) => {
    const h = b(u, t), c = S(h.source, St, t), p = y(h.addon_count, t);
    if (p < 0 || p > 6) throw new Error(`${t} response is invalid`);
    return f(h.detail, t), c;
  });
  if (new Set(d).size !== d.length || !d.some((u) => me.has(u))) throw new Error(`${t} response is invalid`);
  return n;
}
function Se(n, t) {
  const e = b(n, t);
  return "topology" in e ? (Ct(e.topology, t), e.configuration_authoritative !== void 0 && A(e.configuration_authoritative, t), n) : Ct(n, t);
}
function xe(n, t) {
  const e = b(n, t);
  f(e.plan_id, t), f(e.source_sha256, t);
  const i = w(e.channels, t);
  if (i.length < 6 || i.length > 42 || i.length % 6 !== 0) throw new Error(`${t} response is invalid`);
  i.forEach((r, a) => {
    const d = b(r, t), u = y(d.channel, t);
    f(d.name, t), y(d.raw_gain_ct, t), C(d.reporting_multiplier, t), et(d.selected_model_id, t), A(d.selection_verified_against_config, t), et(d.display_label, t);
    const h = b(d.address, t), c = y(h.channel, t), p = y(h.board_index, t), g = y(h.group_index, t), v = S(h.phase, Ut, t), $ = a + 1;
    if (u !== $ || c !== $ || p !== Math.floor(a / 6) || g !== Math.floor(a % 6 / 3) + 1 || v !== ["A", "B", "C"][a % 3]) throw new Error(`${t} response is invalid`);
  });
  const s = b(e.catalog, t);
  f(s.source_repository, t), f(s.source_ref, t), y(s.schema_version, t);
  const o = w(s.presets, t);
  if (o.length > 64) throw new Error(`${t} response is invalid`);
  return o.forEach((r) => {
    const a = b(r, t);
    f(a.model_id, t), f(a.label, t), C(a.rated_current_a, t), f(a.secondary, t), a.default_gain_ct !== null && y(a.default_gain_ct, t), A(a.requires_burden_jumper_cut, t), f(a.notes, t);
  }), n;
}
function Q(n, t) {
  const e = b(n, t);
  if (f(e.transaction_id, t), S(e.state, he, t), f(e.source_sha256, t), A(e.rollback_available, t), f(e.redacted_diff, t), w(e.changes, t).forEach((i) => {
    const s = b(i, t), o = f(s.key, t);
    if (!be.test(o)) throw new Error(`${t} response is invalid`);
    s.old_value !== null && f(s.old_value, t), f(s.new_value, t);
  }), w(e.evidence, t).forEach((i) => S(i, fe, t)), w(e.progress, t).forEach((i) => S(i, _e, t)), e.validation_detail != null) {
    const i = b(e.validation_detail, t);
    for (const s of ["reported_error_count", "reported_warning_count"]) i[s] !== null && y(i[s], t);
    i.code !== null && y(i.code, t), y(i.error_record_count, t), y(i.warning_record_count, t);
  }
  return e.upload_progress !== void 0 && w(e.upload_progress, t).forEach((i) => {
    const s = b(i, t);
    if (S(s.stage, ge, t), s.progress !== null && s.percentage !== null && s.progress !== void 0 && s.percentage !== void 0) throw new Error(`${t} response is invalid`);
    const o = s.progress ?? s.percentage;
    if (o != null) {
      const r = y(o, t);
      if (r < 0 || r > 100) throw new Error(`${t} response is invalid`);
    }
  }), n;
}
function j(n, t) {
  const e = b(n, t);
  f(e.session_id, t), f(e.device_id, t), S(e.state, ue, t), A(e.safety_acknowledged, t);
  const i = b(e.preflight, t);
  return w(i.issues, t).forEach((s) => {
    const o = b(s, t);
    S(o.code, ve, t), f(o.role, t), f(o.detail, t);
  }), w(i.zeroed_roles, t).forEach((s) => f(s, t)), n;
}
function Ce(n, t, e, i) {
  const s = b(n, t), o = S(s.target, /* @__PURE__ */ new Set(["voltage", "current"]), t);
  f(s.target_id, t);
  const r = A(s.stable, t);
  if (o !== e || s.target_id !== i) throw new Error(`${t} response is invalid`);
  const a = w(s.windows, t, o === "voltage" ? 3 : 1);
  if (a.length !== (o === "voltage" ? 3 : 1)) throw new Error(`${t} response is invalid`);
  const d = a.map((u) => {
    const h = b(u, t), c = w(h.samples, t, 3).map((x) => C(x, t));
    if (c.length !== 3) throw new Error(`${t} response is invalid`);
    const p = C(h.mean, t), g = C(h.standard_deviation, t), v = C(h.range_percent, t), $ = c.reduce((x, M) => x + M, 0) / c.length, _ = Math.sqrt(c.reduce((x, M) => x + (M - $) ** 2, 0) / c.length), k = 100 * (Math.max(...c) - Math.min(...c)) / Math.abs($);
    if (!W(p, $) || !W(g, _) || !W(v, k)) throw new Error(`${t} response is invalid`);
    return v;
  });
  if (r !== d.every((u) => u <= 1)) throw new Error(`${t} response is invalid`);
  return n;
}
function kt(n, t, e) {
  const i = b(n, t), s = S(i.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), t);
  f(i.group_key, t), i.phase !== null && S(i.phase, Ut, t);
  const o = y(i.iteration, t), r = w(i.changed_channels, t, 3).map((v) => y(v, t)), a = w(i.before_values, t, 3), d = w(i.after_values, t, 3), u = w(i.error_percent_values, t, 3);
  for (const v of [a, d, u]) v.forEach(($) => C($, t));
  const h = e.target === "voltage" ? e.groupKey : ke(e.channel), c = e.target === "voltage" ? Ae(e.groupKey) : [e.channel], p = e.target === "current" ? ["A", "B", "C"][(e.channel - 1) % 3] : null, g = A(i.retry_allowed, t);
  if (!Number.isFinite(e.reference) || e.reference <= 0 || ![1, 3].includes(r.length) || a.length !== r.length || new Set(r).size !== r.length || r.some((v) => v < 1 || v > 42) || o < 1 || o > 3 || i.group_key !== h || i.phase !== p || r.length !== c.length || r.some((v, $) => v !== c[$]) || (s === "indeterminate" ? d.length !== 0 || u.length !== 0 : d.length !== r.length || u.length !== r.length)) throw new Error(`${t} response is invalid`);
  if (s === "indeterminate") {
    if (i.gain_evidence !== null || g) throw new Error(`${t} response is invalid`);
    i.restore_evidence != null && b(i.restore_evidence, t);
  } else {
    if (i.gain_evidence == null || i.restore_evidence !== null) throw new Error(`${t} response is invalid`);
    b(i.gain_evidence, t);
    const v = d.map((_) => 100 * Math.abs(C(_, t) - e.reference) / e.reference);
    if (u.some((_, k) => C(_, t) < 0 || !W(C(_, t), v[k]))) throw new Error(`${t} response is invalid`);
    const $ = Math.max(...v) > 1;
    if (s === "result_outside_tolerance" !== $ || g !== ($ && o < 3)) throw new Error(`${t} response is invalid`);
  }
  return n;
}
function ke(n) {
  const t = Math.floor((n - 1) / 6), e = Math.floor((n - 1) % 6 / 3) + 1;
  return t === 0 ? `main_${e}` : `addon${t}_${e}`;
}
function Ae(n) {
  const t = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(n);
  if (!t) return [];
  const e = t[2] === void 0 ? 0 : Number(t[2]), i = Number(t[1] ?? t[3]), s = e * 6 + (i - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}
function Ee(n, t, e) {
  const i = b(n, t);
  for (const u of ["mac", "config_filename", "config_sha256", "topology_project_name", "topology_voltage_layout", "verification_id"]) f(i[u], t);
  const s = y(i.topology_addon_count, t);
  S(i.topology_connection_type, at, t);
  const o = y(i.connection_generation, t);
  if (S(i.source_authority, /* @__PURE__ */ new Set(["saved_flash"]), t), A(i.source_handoff_available, t), et(i.source_handoff_transaction_id, t), !$e.test(i.mac) || !we.test(i.config_filename) || !ye.test(i.config_sha256) || !xt.test(i.verification_id) || o < 1 || i.source_handoff_transaction_id !== null && !xt.test(i.source_handoff_transaction_id) || s !== e.addon_count || i.topology_project_name !== e.project_name || i.topology_connection_type !== e.connection_type || i.topology_voltage_layout !== e.voltage_layout) throw new Error(`${t} response is invalid`);
  const r = w(i.groups, t, 14), a = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: s }, (u, h) => [`addon${h + 1}_1`, `addon${h + 1}_2`]).flat()]), d = /* @__PURE__ */ new Set();
  if (r.length < 1) throw new Error(`${t} response is invalid`);
  return r.forEach((u) => {
    const h = b(u, t), c = f(h.instance_id, t);
    if (!a.has(c) || d.has(c)) throw new Error(`${t} response is invalid`);
    d.add(c);
    const p = w(h.phase_gains, t, 3);
    if (p.length !== 3) throw new Error(`${t} response is invalid`);
    p.forEach((g) => {
      const v = w(g, t, 2);
      if (v.length !== 2) throw new Error(`${t} response is invalid`);
      v.forEach(($) => {
        const _ = y($, t);
        if (_ < 1 || _ > 65535) throw new Error(`${t} response is invalid`);
      });
    });
  }), n;
}
class J {
  constructor(t, e) {
    this.hass = t, this.entryId = e, this.setupStatus = () => this.call("setup_status", (i) => L(i, "setup_status")), this.listMeters = () => this.call("list_meters", (i) => (w(i, "list_meters").forEach((s) => Pt(s, "list_meters")), i)), this.getTopology = (i) => this.call("get_topology", (s) => Se(s, "get_topology"), { device_id: i }), this.getCtInventory = (i) => this.call("get_ct_inventory", (s) => xe(s, "get_ct_inventory"), { device_id: i }), this.getSession = (i) => this.call("get_session", (s) => j(s, "get_session"), { session_id: i }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (i) => b(i, "get_diagnostics_summary")), this.setInstallerIntent = (i, s) => this.call("set_installer_intent", (o) => L(o, "set_installer_intent"), { addon_count: i, connection_type: s }), this.rescan = () => this.call("rescan", (i) => L(i, "rescan")), this.adoptDevice = (i) => this.call("adopt_device", (s) => {
      const o = b(s, "adopt_device");
      return f(o.device_id, "adopt_device"), f(o.configuration, "adopt_device"), s;
    }, { device_id: i }), this.previewCtConfig = (i, s, o, r) => this.call("preview_ct_config", (a) => Q(a, "preview_ct_config"), {
      device_id: i,
      plan_id: s,
      source_sha256: o,
      changes: r
    }), this.transaction = (i, s, o, r) => this.call(i, (a) => Q(a, i), {
      device_id: s,
      transaction_id: o,
      source_sha256: r
    }), this.applyCtConfig = (i, s, o) => this.transaction("apply_ct_config", i, s, o), this.compileCtConfig = (i, s, o) => this.transaction("compile_ct_config", i, s, o), this.installCtConfig = (i, s, o) => this.transaction("install_ct_config", i, s, o), this.rollbackCtConfig = (i, s, o) => this.transaction("rollback_ct_config", i, s, o), this.startSession = (i) => this.call("start_session", (s) => j(s, "start_session"), { device_id: i }), this.acknowledgeSafety = (i) => this.call("acknowledge_safety", (s) => j(s, "acknowledge_safety"), { session_id: i, acknowledged: !0 }), this.checkStability = (i, s, o) => this.call("check_stability", (r) => Ce(r, "check_stability", s, o), { session_id: i, target: s, target_id: o }), this.calibrateVoltage = (i, s, o, r) => this.call("calibrate_voltage", (a) => kt(a, "calibrate_voltage", { target: "voltage", groupKey: s, reference: o }), {
      session_id: i,
      group_key: s,
      reference: o,
      confirm_iteration: r
    }), this.calibrateCurrent = (i, s, o, r) => this.call("calibrate_current", (a) => kt(a, "calibrate_current", { target: "current", channel: s, reference: o }), {
      session_id: i,
      channel: s,
      reference: o,
      confirm_iteration: r
    }), this.restartAndVerify = (i, s) => this.call("restart_and_verify", (o) => Ee(o, "restart_and_verify", s), { session_id: i }), this.cancelSession = (i) => this.call("cancel_session", (s) => j(s, "cancel_session"), { session_id: i }), this.subscribeSetup = (i) => this.subscribe("subscribe_setup", {}, (s) => L(s, "subscribe_setup"), i), this.subscribeConfigTransaction = (i, s, o, r) => this.subscribe("subscribe_config_transaction", {
      device_id: i,
      transaction_id: s,
      source_sha256: o
    }, (a) => Q(a, "subscribe_config_transaction"), r), this.subscribeSession = (i, s) => this.subscribe("subscribe_session", { session_id: i }, (o) => j(o, "subscribe_session"), s);
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
      if (t.length > o || de.test(t) || ce.test(t) || s && i !== "redacted_diff" || i === "redacted_diff" && t.includes("\r"))
        throw new Error(`unsafe string ${i || "value"} refused`);
      return;
    }
    if (!(t === null || typeof t != "object"))
      for (const [s, o] of Object.entries(t)) {
        if (s.length > 256 || le.test(s)) throw new Error("unsafe property name refused");
        if (s.toLowerCase() === "key" && i !== "changes") throw new Error(`private field ${s} refused`);
        if (s.toLowerCase() !== "raw_gain_ct" && ae.test(s))
          throw new Error(`private field ${s} refused`);
        this.assertPublicPayload(o, e + 1, s.toLowerCase());
      }
  }
  async call(t, e, i = {}) {
    const s = await this.hass.callWS({
      type: `${wt}${t}`,
      entry_id: this.entryId,
      ...i
    });
    return J.assertPublicPayload(s), e(s);
  }
  subscribe(t, e, i, s) {
    return this.hass.connection.subscribeMessage((o) => {
      J.assertPublicPayload(o), s(i(o));
    }, { type: `${wt}${t}`, entry_id: this.entryId, ...e });
  }
}
function Ie(n, t, e, i, s, o) {
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Select the compatible meter discovered on your network.</p>
      <div class="meter-list">
        ${n.map((r) => l`
          <label class=${r.entry_id === t ? "meter-row selected" : "meter-row"}>
            <input type="radio" name="meter" .checked=${r.entry_id === t}
              @change=${() => e(r.entry_id)} />
            <span><strong>${r.title}</strong><small>${r.project_name} · ${r.project_version ?? "version unavailable"}</small></span>
            <span>Device Builder: ${r.configuration ? "Configured" : r.importable ? "Importable" : r.importable === null ? "Unavailable" : "Not importable"}</span>
          </label>
        `)}
      </div>
      ${n.some((r) => r.entry_id === t && r.importable) ? l`
        <button class="secondary" @click=${i}>Adopt</button>
      ` : ""}
      <footer class="action-footer">
        <button class="secondary" data-action="back" @click=${s}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${!t} @click=${o}>Continue</button>
      </footer>
    </section>
  `;
}
function Te(n) {
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
function Oe(n, t, e, i, s, o, r) {
  const a = n?.state ?? "previewed";
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${Te(n)}
      ${a === "failed" ? l`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${n?.evidence.join(", ") || "The operation did not complete."}</p>
          ${n?.rollback_available ? l`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${t} ?disabled=${a !== "previewed"}>Apply</button>
        <button class="secondary" @click=${e} ?disabled=${a !== "validated"}>Compile</button>
        <button class="primary" @click=${i} ?disabled=${a !== "install_confirmation_required"}>Install</button>
      </div>
      ${n?.validation_detail ? l`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${n.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${n.validation_detail.error_record_count} records (${n.validation_detail.reported_error_count ?? "unreported"} reported)</dd></div>
        <div><dt>Warnings</dt><dd>${n.validation_detail.warning_record_count} records (${n.validation_detail.reported_warning_count ?? "unreported"} reported)</dd></div>
      </dl>` : ""}
      ${n?.upload_progress?.length ? l`<ul class="upload-progress">${n.upload_progress.map((d) => l`
        <li>${d.stage}: ${d.percentage ?? d.progress ?? "in progress"}${d.percentage != null || d.progress != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${o}>Back</button>
        <button class="primary" data-action="continue" @click=${r} ?disabled=${a !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const Re = (n, t, e) => (n?.default_gain_ct ?? e) == null || !Number.isFinite(t) || t <= 0 ? null : Math.round((n?.default_gain_ct ?? e) / t);
function Ne(n, t, e, i, s, o, r, a, d) {
  const u = Math.ceil(n.channels.length / 6), h = n.channels.filter((c) => c.address.board_index === t).slice(0, 8);
  return l`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards">
        ${Array.from({ length: u }, (c, p) => l`
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
          ${h.map((c) => {
    const p = i.get(c.channel) ?? {
      name: c.name,
      modelId: c.selected_model_id ?? "",
      multiplier: c.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, g = n.catalog.presets.find((_) => _.model_id === p.modelId), v = Re(g, p.multiplier, p.modelId === "custom" ? p.customGainCt : void 0), $ = ct(c, p);
    return l`
              <div class="ct-row" data-ct-row data-ct-group=${c.address.group_index - 1} role="row" aria-label=${`CT${c.channel}`}>
                <label><span class="mobile-label">Name</span><input aria-label=${`CT${c.channel} name`} .value=${p.name}
                  @input=${(_) => r(c.channel, { name: _.target.value })} /></label>
                <label><span class="mobile-label">Model</span><select aria-label=${`CT${c.channel} model`}
                  @change=${(_) => {
      const k = _.target.value, x = n.catalog.presets.find((M) => M.model_id === k);
      r(c.channel, {
        modelId: k,
        burdenAcknowledged: c.selection_verified_against_config && k === c.selected_model_id && (k === "custom" || x?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${p.modelId === ""}>Choose model</option>
                  ${n.catalog.presets.map((_) => l`<option value=${_.model_id} ?selected=${p.modelId === _.model_id}>${_.label}</option>`)}
                  <option value="custom" ?selected=${p.modelId === "custom"}>Custom</option>
                </select></label>
                <span><span class="mobile-label">Current gain</span>${c.raw_gain_ct}</span>
                <label><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${c.channel} multiplier`}
                  .value=${String(p.multiplier)} @input=${(_) => r(c.channel, { multiplier: Number(_.target.value) })} /></label>
                <span><span class="mobile-label">Resulting gain</span>${v ?? "—"}</span>
                <span><span class="mobile-label">Burden</span>${g?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button class="row-toggle" aria-expanded=${p.expanded} @click=${() => r(c.channel, { expanded: !p.expanded })}>
                  ${p.modelId ? $ ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${p.modelId === "custom" ? l`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${c.channel} custom gain`}
                  .value=${p.customGainCt === void 0 ? "" : String(p.customGainCt)}
                  @input=${(_) => r(c.channel, { customGainCt: Number(_.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${c.channel} custom label`} .value=${p.customLabel ?? ""}
                  @input=${(_) => r(c.channel, { customLabel: _.target.value })} /></label>
              </div>` : m}
              ${p.modelId === "custom" || g?.requires_burden_jumper_cut ? l`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${c.channel} burden output acknowledgement`}
                  .checked=${p.burdenAcknowledged}
                  @change=${(_) => r(c.channel, { burdenAcknowledged: _.target.checked })} />
                  I checked the burden-output requirement for CT${c.channel}</label>
              </div>` : m}
              ${g && g.rated_current_a > 65.535 && p.multiplier === 1 ? l`<div class="warning-band" role="status">CT${c.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : m}
              ${p.expanded && g ? l`
                <dl class="ct-detail">
                  <div><dt>Rated current</dt><dd>${g.rated_current_a} A</dd></div>
                  <div><dt>Output</dt><dd>${g.secondary}</dd></div>
                  <div><dt>Official default gain</dt><dd>${g.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${g.notes || (g.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              ` : m}
            `;
  })}
        </div>
      </div>
      <p class="row-count">Showing ${h.length} of ${n.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${a}>Back</button>
        <button class="primary" ?disabled=${!Me(n, i)} @click=${d}>Review changes</button>
      </footer>
    </section>
  `;
}
function Ue(n, t) {
  return n.channels.flatMap((e) => {
    const i = t.get(e.channel);
    if (!i || !ct(e, i)) return [];
    const s = n.catalog.presets.find((r) => r.model_id === i.modelId), o = { channel: e.channel, name: i.name.trim(), model_id: i.modelId, reporting_multiplier: i.multiplier };
    return i.modelId === "custom" ? (i.customGainCt !== void 0 && (o.custom_gain_ct = i.customGainCt), i.customLabel !== void 0 && (o.custom_label = i.customLabel.trim()), o.burden_output_acknowledged = i.burdenAcknowledged) : s?.requires_burden_jumper_cut && (o.burden_output_acknowledged = i.burdenAcknowledged), [o];
  });
}
function ct(n, t) {
  return t.name !== n.name || t.modelId !== (n.selected_model_id ?? "") || t.multiplier !== n.reporting_multiplier || t.modelId === "custom" && (t.customGainCt !== n.raw_gain_ct || (t.customLabel?.trim() ?? "") !== (n.display_label ?? ""));
}
function Pe(n, t) {
  if (!t.name.trim() || !t.modelId || !Number.isFinite(t.multiplier) || t.multiplier <= 0) return !1;
  if (t.modelId === "custom") return Number.isInteger(t.customGainCt) && t.customGainCt >= 1 && t.customGainCt <= 65535 && !!t.customLabel?.trim() && !/[\r\n]/.test(t.customLabel) && t.burdenAcknowledged;
  const e = n.catalog.presets.find((i) => i.model_id === t.modelId);
  return !!e && (!e?.requires_burden_jumper_cut || t.burdenAcknowledged);
}
function Me(n, t) {
  let e = !1;
  for (const i of n.channels) {
    const s = t.get(i.channel);
    if (!s || ct(i, s) && (e = !0, !Pe(n, s)))
      return !1;
  }
  return e;
}
function dt(n) {
  return n ? l`<section class="measurement-evidence" aria-label=${`${n.target} ${n.target_id} stability evidence`}>
    <h3>Stability evidence · ${n.target_id}</h3>
    ${n.windows.map((t, e) => l`<dl>
      <div><dt>Window ${e + 1} samples</dt><dd>${t.samples.join(", ")}</dd></div>
      <div><dt>Mean</dt><dd>${t.mean}</dd></div>
      <div><dt>Standard deviation</dt><dd>${t.standard_deviation}</dd></div>
      <div><dt>Range</dt><dd>${t.range_percent}%</dd></div>
    </dl>`)}
  </section>` : m;
}
function lt(n) {
  return n ? l`<section class="measurement-evidence" aria-label="Calibration evidence">
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
  </section>` : m;
}
function De(n, t, e, i, s, o, r, a, d, u, h, c) {
  const p = n?.ct_count ?? t?.channels.length ?? 6, g = Math.floor((e - 1) / 6), v = g * 6 + 1;
  return l`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(p / 6) }, ($, _) => l`<button role="tab" aria-selected=${_ === g} @click=${() => r(_ * 6 + 1)}>${_ === 0 ? "Main Board" : `Add-on ${_}`}</button>`)}
      </div>
      <div class="group-grid">
        ${[0, 3].map(($) => l`<section><h2>Group ${g * 2 + $ / 3 + 1}</h2>${Array.from({ length: 3 }, (_, k) => {
    const x = v + $ + k;
    return l`<button class=${x === e ? "selected" : ""} @click=${() => r(x)}>CT${x}</button>`;
  })}</section>`)}
      </div>
      <h2>Calibrate CT${e}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(i)} @input=${($) => a(Number($.target.value))} /></label>
      <button class="secondary" @click=${d}>Check stability</button>
      ${s ? l`<div class=${s.stable ? "success-band" : "warning-band"} role="status">${s.stable ? "Stable" : "Retake samples"}</div>` : ""}
      ${dt(s)}
      ${lt(o)}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration ${o?.iteration ?? 1} of 3</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${u} ?disabled=${!s?.stable || (o?.iteration ?? 0) >= 3 || !!(o && !o.retry_allowed && o.iteration > 0)}>${o?.retry_allowed ? "Retry calibration" : "Calibrate"} CT${e}</button>
      ${o?.state.includes("indeterminate") ? l`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${h}>Reconnect and inspect</button><button class="danger" @click=${c}>Cancel session</button></aside>` : ""}
    </section>
  `;
}
function je(n, t, e, i, s) {
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, and entity bindings.</p>
      <div class="status-band" role="status">${n || "Ready for restart verification"}</div>
      ${t ? l`<dl class="status-list"><div><dt>Verification</dt><dd>${t.verification_id}</dd></div><div><dt>Authority</dt><dd>${t.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${t.connection_generation}</dd></div></dl>` : ""}
      ${n === "cancelled" ? l`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${n.includes("failed") || n.includes("indeterminate") ? l`<div class="recovery-panel"><strong>Recovery required</strong><button class="danger" @click=${i}>Review rollback</button></div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${s}>Back</button><button class="primary" @click=${e} ?disabled=${n === "cancelled" || !!t}>${n.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Be(n) {
  return n ? n.preflight.issues.length ? l`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${n.preflight.issues.map((t) => l`<li>${t.role}: ${t.detail}</li>`)}</ul></div>` : l`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : l`<p>Starting a calibration session…</p>`;
}
function Ge(n, t, e, i, s, o) {
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${Be(n)}
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
const At = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], qe = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function He(n, t, e, i, s, o) {
  return l`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (r, a) => l`
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
          ${At.map(([r, a]) => l`
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
          <div><dt>Connection</dt><dd>${At.find(([r]) => r === e)?.[1]}</dd></div>
          ${qe.slice(0, t).map((r, a) => l`<div><dt>Add-on ${a + 1}</dt><dd>${r}</dd></div>`)}
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
function Mt(n, t, e, i, s, o = null) {
  return l`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${n?.evidence.map((r) => l`<li>${r.source}: ${r.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${t?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...i.entries()].map(([r, a]) => l`<div data-target=${r}>${dt(a)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([r, a]) => l`<div data-target=${r}>${lt(a)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${e?.evidence.join(", ") || "No build evidence."}</p><p>${e?.progress.join(", ") || "No transaction progress."}</p>
          ${e?.validation_detail ? l`<p>Validation code ${e.validation_detail.code ?? "unavailable"}; ${e.validation_detail.error_record_count} error records; ${e.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${e?.upload_progress?.length ? l`<ul>${e.upload_progress.map((r) => l`<li>${r.stage}: ${r.percentage ?? r.progress ?? "in progress"}${r.percentage != null || r.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Authority source</h3><p>${o?.source_authority.replaceAll("_", " ") ?? "Not yet established"}</p><p>${o ? `Verification ${o.verification_id}, generation ${o.connection_generation}` : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function ze(n, t, e, i, s, o, r, a) {
  return l`
    <section class="step-content" aria-labelledby="step-heading">
      ${o ? l`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : l`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${n?.ct_count ?? "—"} CTs in ${n?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${r ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${o?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${o?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${Mt(n, t, e, i, s, o)}
      <footer class="action-footer"><button class="secondary" @click=${a}>Back</button></footer>
    </section>
  `;
}
function Dt(n) {
  const t = n.addon_count, e = n.evidence.map((i) => i.source);
  return t < 0 || t > 6 || n.board_count !== t + 1 || n.ct_count !== 6 * (t + 1) || n.group_count !== 2 * (t + 1) || n.evidence.length < 1 || n.evidence.length > 5 || new Set(e).size !== e.length || !e.some((i) => ["config_project", "config_packages", "native_project"].includes(i)) || n.evidence.some((i) => i.addon_count !== t);
}
function Ve(n, t, e, i, s = !1) {
  const o = s || Dt(n);
  return l`
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
        <button class="secondary" @click=${e}>Back</button>
        ${o ? "" : l`<button class="primary" data-action="continue" @click=${i}>Continue</button>`}
      </footer>
    </section>
  `;
}
function Le(n, t, e, i, s, o, r, a, d, u, h) {
  const c = n?.group_count ?? 2;
  return l`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      <div class="target-tabs" role="tablist" aria-label="Voltage groups">
        ${Array.from({ length: c }, (p, g) => l`<button role="tab" aria-selected=${g === t} @click=${() => o(g)}>Group ${g + 1}</button>`)}
      </div>
      <h2>Calibrate voltage group ${t + 1}</h2>
      <label>Trusted instrument reference <input type="number" .value=${String(e)} @input=${(p) => r(Number(p.target.value))} /></label>
      <button class="secondary" @click=${a}>Check stability</button>
      ${i ? l`<div class=${i.stable ? "success-band" : "warning-band"} role="status">${i.stable ? "Stable sample window" : "Samples are not stable yet"}</div>` : ""}
      ${dt(i)}
      ${lt(s)}
      <ol class="progress-steps"><li>Set reference</li><li>Verify acknowledgement</li><li>Run iteration</li><li>Verify gain</li><li>Zero reference</li></ol>
      <button class="primary" @click=${d} ?disabled=${!i?.stable || !!(s && !s.retry_allowed && s.iteration > 0)}> ${s?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      ${s?.state === "indeterminate" ? l`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${u}>Reconnect and inspect</button><button class="danger" @click=${h}>Cancel session</button></aside>` : ""}
    </section>
  `;
}
const Fe = Bt`
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
`, R = [
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
class We extends G {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.ctGroup = 0, this.group = 0, this.channel = 1, this.reference = 0, this.safetyAcknowledged = !1, this.drafts = /* @__PURE__ */ new Map(), this.error = "", this.announcement = "", this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.mobileStepsOpen = !1, this.focusHeading = !1;
  }
  static {
    this.styles = Fe;
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
    const e = new J(this.hass, this.panel.config.entry_id);
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
    this.topology = t, this.navigate("topology"), this.error = Dt(t) || t.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
  }
  showInventory(t) {
    this.inventory = t, this.drafts = new Map(t.channels.map((e) => {
      const i = e.selected_model_id ?? "", s = t.catalog.presets.find((o) => o.model_id === i);
      return [e.channel, {
        name: e.name,
        modelId: i,
        multiplier: e.reporting_multiplier,
        customGainCt: i === "custom" || e.selected_model_id === null ? e.raw_gain_ct : void 0,
        customLabel: e.display_label ?? void 0,
        burdenAcknowledged: e.selection_verified_against_config && (i === "custom" || s?.requires_burden_jumper_cut === !0),
        expanded: e.selected_model_id === null && e.raw_gain_ct === 27518
      }];
    })), this.navigate("ct"), this.error = "", this.requestUpdate();
  }
  showState(t) {
    this.navigate(t);
  }
  navigate(t) {
    this.step = t, this.error = "", this.mobileStepsOpen = !1, this.focusHeading = !0, this.requestUpdate();
  }
  back() {
    const t = R.findIndex(([e]) => e === this.step);
    t > 0 && this.navigate(R[t - 1][0]);
  }
  selectedProjectVersion() {
    return this.setup?.devices.find((t) => t.entry_id === this.selectedDeviceId)?.project_version ?? null;
  }
  selectedProjectName() {
    return this.setup?.devices.find((t) => t.entry_id === this.selectedDeviceId)?.project_name ?? null;
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
    const t = Ue(this.inventory, this.drafts);
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
    const e = this.api, i = this.selectedDeviceId, s = this.session.session_id, o = ++this.operationGeneration, r = t === "voltage" ? this.groupKey(this.group) : String(this.channel), a = this.groupKey(this.group), d = this.channel, u = this.reference;
    await this.run(
      async () => {
        const h = t === "voltage" ? await e.calibrateVoltage(s, a, u, !0) : await e.calibrateCurrent(s, d, u, !0);
        !this.ownsOperation(o, e, i) || this.session?.session_id !== s || (this.calibrationByTarget = new Map(this.calibrationByTarget).set(`${t}:${r}`, h), this.announcement = `Calibration iteration ${h.iteration} finished with state ${h.state}.`);
      },
      "Calibration did not complete. Reconnect and inspect before another attempt.",
      () => this.ownsOperation(o, e, i)
    );
  }
  groupKey(t) {
    const e = Math.floor(t / 2), i = t % 2 + 1;
    return e === 0 ? `main_${i}` : `addon${e}_${i}`;
  }
  async restart() {
    if (!this.api || !this.session || !this.topology) return;
    const t = this.api, e = this.selectedDeviceId, i = this.session.session_id, s = this.topology, o = ++this.operationGeneration;
    await this.run(
      async () => {
        const r = await t.restartAndVerify(i, s);
        !this.ownsOperation(o, t, e) || this.session?.session_id !== i || this.topology !== s || (this.restartResult = r, this.session = { ...this.session, state: "verified" }, this.navigate("summary"));
      },
      "Restart verification failed; review recovery evidence before rollback.",
      () => this.ownsOperation(o, t, e)
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
    return this.step === "setup" ? He(
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
    ) : this.step === "discover" ? Ie(
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
    ) : this.step === "topology" && this.topology ? Ve(
      this.topology,
      this.selectedProjectVersion(),
      () => this.back(),
      () => {
        this.loadInventory();
      },
      !!this.error
    ) : this.step === "ct" && this.inventory ? Ne(
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
    ) : this.step === "build" ? Oe(
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
    ) : this.step === "safety" ? Ge(
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
    ) : this.step === "voltage" ? l`${Le(
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("current")}>Continue</button></footer>` : this.step === "current" ? l`${De(
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" @click=${() => this.navigate("restart")}>Continue</button></footer>` : this.step === "restart" ? je(this.session?.state ?? this.error, this.restartResult, () => {
      this.restart();
    }, () => {
      this.transactionAction("rollback");
    }, () => this.back()) : ze(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.selectedProjectVersion(), () => this.back());
  }
  render() {
    const t = R.findIndex(([e]) => e === this.step);
    return l`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${R.map(([e, i], s) => l`
            <li class=${s === t ? "current" : ""}>
              <button class="step-button" aria-current=${s === t ? "step" : m} ?disabled=${s > t}
                @click=${() => s <= t && this.navigate(e)}><span class="number">${s + 1}</span><span>${i}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${t + 1} of 10 — ${R[t]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${R[t]?.[1]}</h1>
          ${this.error ? l`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : m}
          ${this.stepBody()}
          ${t >= 4 && this.step !== "summary" ? Mt(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult) : m}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
customElements.get("circuitsetup-energy-meter-helper-panel") || customElements.define("circuitsetup-energy-meter-helper-panel", We);
export {
  We as CircuitSetupPanel
};
