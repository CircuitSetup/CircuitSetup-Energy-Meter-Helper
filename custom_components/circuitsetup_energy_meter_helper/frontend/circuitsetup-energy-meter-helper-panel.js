const _e = globalThis, Te = _e.ShadowRoot && (_e.ShadyCSS === void 0 || _e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Ie = /* @__PURE__ */ Symbol(), He = /* @__PURE__ */ new WeakMap();
let ct = class {
  constructor(e, i, t) {
    if (this._$cssResult$ = !0, t !== Ie) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (Te && e === void 0) {
      const t = i !== void 0 && i.length === 1;
      t && (e = He.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), t && He.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Ct = (o) => new ct(typeof o == "string" ? o : o + "", void 0, Ie), At = (o, ...e) => {
  const i = o.length === 1 ? o[0] : e.reduce((t, s, n) => t + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s) + o[n + 1], o[0]);
  return new ct(i, o, Ie);
}, xt = (o, e) => {
  if (Te) o.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const t = document.createElement("style"), s = _e.litNonce;
    s !== void 0 && t.setAttribute("nonce", s), t.textContent = i.cssText, o.appendChild(t);
  }
}, Ge = Te ? (o) => o : (o) => o instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const t of e.cssRules) i += t.cssText;
  return Ct(i);
})(o) : o;
const { is: Et, defineProperty: Rt, getOwnPropertyDescriptor: Tt, getOwnPropertyNames: It, getOwnPropertySymbols: Ot, getPrototypeOf: Mt } = Object, ye = globalThis, Le = ye.trustedTypes, Ut = Le ? Le.emptyScript : "", Bt = ye.reactiveElementPolyfillSupport, re = (o, e) => o, xe = { toAttribute(o, e) {
  switch (e) {
    case Boolean:
      o = o ? Ut : null;
      break;
    case Object:
    case Array:
      o = o == null ? o : JSON.stringify(o);
  }
  return o;
}, fromAttribute(o, e) {
  let i = o;
  switch (e) {
    case Boolean:
      i = o !== null;
      break;
    case Number:
      i = o === null ? null : Number(o);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(o);
      } catch {
        i = null;
      }
  }
  return i;
} }, dt = (o, e) => !Et(o, e), Ve = { attribute: !0, type: String, converter: xe, reflect: !1, useDefault: !1, hasChanged: dt };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), ye.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let ee = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = Ve) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const t = /* @__PURE__ */ Symbol(), s = this.getPropertyDescriptor(e, t, i);
      s !== void 0 && Rt(this.prototype, e, s);
    }
  }
  static getPropertyDescriptor(e, i, t) {
    const { get: s, set: n } = Tt(this.prototype, e) ?? { get() {
      return this[i];
    }, set(r) {
      this[i] = r;
    } };
    return { get: s, set(r) {
      const a = s?.call(this);
      n?.call(this, r), this.requestUpdate(e, a, t);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Ve;
  }
  static _$Ei() {
    if (this.hasOwnProperty(re("elementProperties"))) return;
    const e = Mt(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(re("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(re("properties"))) {
      const i = this.properties, t = [...It(i), ...Ot(i)];
      for (const s of t) this.createProperty(s, i[s]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [t, s] of i) this.elementProperties.set(t, s);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, t] of this.elementProperties) {
      const s = this._$Eu(i, t);
      s !== void 0 && this._$Eh.set(s, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const t = new Set(e.flat(1 / 0).reverse());
      for (const s of t) i.unshift(Ge(s));
    } else e !== void 0 && i.push(Ge(e));
    return i;
  }
  static _$Eu(e, i) {
    const t = i.attribute;
    return t === !1 ? void 0 : typeof t == "string" ? t : typeof e == "string" ? e.toLowerCase() : void 0;
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
    const e = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const t of i.keys()) this.hasOwnProperty(t) && (e.set(t, this[t]), delete this[t]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return xt(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, i, t) {
    this._$AK(e, t);
  }
  _$ET(e, i) {
    const t = this.constructor.elementProperties.get(e), s = this.constructor._$Eu(e, t);
    if (s !== void 0 && t.reflect === !0) {
      const n = (t.converter?.toAttribute !== void 0 ? t.converter : xe).toAttribute(i, t.type);
      this._$Em = e, n == null ? this.removeAttribute(s) : this.setAttribute(s, n), this._$Em = null;
    }
  }
  _$AK(e, i) {
    const t = this.constructor, s = t._$Eh.get(e);
    if (s !== void 0 && this._$Em !== s) {
      const n = t.getPropertyOptions(s), r = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : xe;
      this._$Em = s;
      const a = r.fromAttribute(i, n.type);
      this[s] = a ?? this._$Ej?.get(s) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, i, t, s = !1, n) {
    if (e !== void 0) {
      const r = this.constructor;
      if (s === !1 && (n = this[e]), t ??= r.getPropertyOptions(e), !((t.hasChanged ?? dt)(n, i) || t.useDefault && t.reflect && n === this._$Ej?.get(e) && !this.hasAttribute(r._$Eu(e, t)))) return;
      this.C(e, i, t);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: t, reflect: s, wrapped: n }, r) {
    t && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, r ?? i ?? this[e]), n !== !0 || r !== void 0) || (this._$AL.has(e) || (this.hasUpdated || t || (i = void 0), this._$AL.set(e, i)), s === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
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
        for (const [s, n] of this._$Ep) this[s] = n;
        this._$Ep = void 0;
      }
      const t = this.constructor.elementProperties;
      if (t.size > 0) for (const [s, n] of t) {
        const { wrapped: r } = n, a = this[s];
        r !== !0 || this._$AL.has(s) || a === void 0 || this.C(s, void 0, n, a);
      }
    }
    let e = !1;
    const i = this._$AL;
    try {
      e = this.shouldUpdate(i), e ? (this.willUpdate(i), this._$EO?.forEach((t) => t.hostUpdate?.()), this.update(i)) : this._$EM();
    } catch (t) {
      throw e = !1, this._$EM(), t;
    }
    e && this._$AE(i);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((i) => i.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
    this._$Eq &&= this._$Eq.forEach((i) => this._$ET(i, this[i])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
ee.elementStyles = [], ee.shadowRootOptions = { mode: "open" }, ee[re("elementProperties")] = /* @__PURE__ */ new Map(), ee[re("finalized")] = /* @__PURE__ */ new Map(), Bt?.({ ReactiveElement: ee }), (ye.reactiveElementVersions ??= []).push("2.1.2");
const Oe = globalThis, Fe = (o) => o, ve = Oe.trustedTypes, We = ve ? ve.createPolicy("lit-html", { createHTML: (o) => o }) : void 0, lt = "$lit$", V = `lit$${Math.random().toFixed(9).slice(2)}$`, ht = "?" + V, Nt = `<${ht}>`, Y = document, ce = () => Y.createComment(""), de = (o) => o === null || typeof o != "object" && typeof o != "function", Me = Array.isArray, Pt = (o) => Me(o) || typeof o?.[Symbol.iterator] == "function", Ae = `[\x20\t
\f\r]`, se = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ke = /-->/g, Ye = />/g, W = RegExp(`>|${Ae}(?:([^\\s"'>=/]+)(${Ae}*=${Ae}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ze = /'/g, Je = /"/g, pt = /^(?:script|style|textarea|title)$/i, Dt = (o) => (e, ...i) => ({ _$litType$: o, strings: e, values: i }), h = Dt(1), te = /* @__PURE__ */ Symbol.for("lit-noChange"), S = /* @__PURE__ */ Symbol.for("lit-nothing"), Qe = /* @__PURE__ */ new WeakMap(), K = Y.createTreeWalker(Y, 129);
function ut(o, e) {
  if (!Me(o) || !o.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return We !== void 0 ? We.createHTML(e) : e;
}
const qt = (o, e) => {
  const i = o.length - 1, t = [];
  let s, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = se;
  for (let a = 0; a < i; a++) {
    const c = o[a];
    let l, u, d = -1, p = 0;
    for (; p < c.length && (r.lastIndex = p, u = r.exec(c), u !== null); ) p = r.lastIndex, r === se ? u[1] === "!--" ? r = Ke : u[1] !== void 0 ? r = Ye : u[2] !== void 0 ? (pt.test(u[2]) && (s = RegExp("</" + u[2], "g")), r = W) : u[3] !== void 0 && (r = W) : r === W ? u[0] === ">" ? (r = s ?? se, d = -1) : u[1] === void 0 ? d = -2 : (d = r.lastIndex - u[2].length, l = u[1], r = u[3] === void 0 ? W : u[3] === '"' ? Je : Ze) : r === Je || r === Ze ? r = W : r === Ke || r === Ye ? r = se : (r = W, s = void 0);
    const g = r === W && o[a + 1].startsWith("/>") ? " " : "";
    n += r === se ? c + Nt : d >= 0 ? (t.push(l), c.slice(0, d) + lt + c.slice(d) + V + g) : c + V + (d === -2 ? a : g);
  }
  return [ut(o, n + (o[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), t];
};
class le {
  constructor({ strings: e, _$litType$: i }, t) {
    let s;
    this.parts = [];
    let n = 0, r = 0;
    const a = e.length - 1, c = this.parts, [l, u] = qt(e, i);
    if (this.el = le.createElement(l, t), K.currentNode = this.el.content, i === 2 || i === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (s = K.nextNode()) !== null && c.length < a; ) {
      if (s.nodeType === 1) {
        if (s.hasAttributes()) for (const d of s.getAttributeNames()) if (d.endsWith(lt)) {
          const p = u[r++], g = s.getAttribute(d).split(V), f = /([.?@])?(.*)/.exec(p);
          c.push({ type: 1, index: n, name: f[2], strings: g, ctor: f[1] === "." ? jt : f[1] === "?" ? Ht : f[1] === "@" ? Gt : we }), s.removeAttribute(d);
        } else d.startsWith(V) && (c.push({ type: 6, index: n }), s.removeAttribute(d));
        if (pt.test(s.tagName)) {
          const d = s.textContent.split(V), p = d.length - 1;
          if (p > 0) {
            s.textContent = ve ? ve.emptyScript : "";
            for (let g = 0; g < p; g++) s.append(d[g], ce()), K.nextNode(), c.push({ type: 2, index: ++n });
            s.append(d[p], ce());
          }
        }
      } else if (s.nodeType === 8) if (s.data === ht) c.push({ type: 2, index: n });
      else {
        let d = -1;
        for (; (d = s.data.indexOf(V, d + 1)) !== -1; ) c.push({ type: 7, index: n }), d += V.length - 1;
      }
      n++;
    }
  }
  static createElement(e, i) {
    const t = Y.createElement("template");
    return t.innerHTML = e, t;
  }
}
function ie(o, e, i = o, t) {
  if (e === te) return e;
  let s = t !== void 0 ? i._$Co?.[t] : i._$Cl;
  const n = de(e) ? void 0 : e._$litDirective$;
  return s?.constructor !== n && (s?._$AO?.(!1), n === void 0 ? s = void 0 : (s = new n(o), s._$AT(o, i, t)), t !== void 0 ? (i._$Co ??= [])[t] = s : i._$Cl = s), s !== void 0 && (e = ie(o, s._$AS(o, e.values), s, t)), e;
}
class zt {
  constructor(e, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: i }, parts: t } = this._$AD, s = (e?.creationScope ?? Y).importNode(i, !0);
    K.currentNode = s;
    let n = K.nextNode(), r = 0, a = 0, c = t[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let l;
        c.type === 2 ? l = new he(n, n.nextSibling, this, e) : c.type === 1 ? l = new c.ctor(n, c.name, c.strings, this, e) : c.type === 6 && (l = new Lt(n, this, e)), this._$AV.push(l), c = t[++a];
      }
      r !== c?.index && (n = K.nextNode(), r++);
    }
    return K.currentNode = Y, s;
  }
  p(e) {
    let i = 0;
    for (const t of this._$AV) t !== void 0 && (t.strings !== void 0 ? (t._$AI(e, t, i), i += t.strings.length - 2) : t._$AI(e[i])), i++;
  }
}
class he {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, i, t, s) {
    this.type = 2, this._$AH = S, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = t, this.options = s, this._$Cv = s?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && e?.nodeType === 11 && (e = i.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, i = this) {
    e = ie(this, e, i), de(e) ? e === S || e == null || e === "" ? (this._$AH !== S && this._$AR(), this._$AH = S) : e !== this._$AH && e !== te && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Pt(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== S && de(this._$AH) ? this._$AA.nextSibling.data = e : this.T(Y.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: i, _$litType$: t } = e, s = typeof t == "number" ? this._$AC(e) : (t.el === void 0 && (t.el = le.createElement(ut(t.h, t.h[0]), this.options)), t);
    if (this._$AH?._$AD === s) this._$AH.p(i);
    else {
      const n = new zt(s, this), r = n.u(this.options);
      n.p(i), this.T(r), this._$AH = n;
    }
  }
  _$AC(e) {
    let i = Qe.get(e.strings);
    return i === void 0 && Qe.set(e.strings, i = new le(e)), i;
  }
  k(e) {
    Me(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let t, s = 0;
    for (const n of e) s === i.length ? i.push(t = new he(this.O(ce()), this.O(ce()), this, this.options)) : t = i[s], t._$AI(n), s++;
    s < i.length && (this._$AR(t && t._$AB.nextSibling, s), i.length = s);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); e !== this._$AB; ) {
      const t = Fe(e).nextSibling;
      Fe(e).remove(), e = t;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class we {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, i, t, s, n) {
    this.type = 1, this._$AH = S, this._$AN = void 0, this.element = e, this.name = i, this._$AM = s, this.options = n, t.length > 2 || t[0] !== "" || t[1] !== "" ? (this._$AH = Array(t.length - 1).fill(new String()), this.strings = t) : this._$AH = S;
  }
  _$AI(e, i = this, t, s) {
    const n = this.strings;
    let r = !1;
    if (n === void 0) e = ie(this, e, i, 0), r = !de(e) || e !== this._$AH && e !== te, r && (this._$AH = e);
    else {
      const a = e;
      let c, l;
      for (e = n[0], c = 0; c < n.length - 1; c++) l = ie(this, a[t + c], i, c), l === te && (l = this._$AH[c]), r ||= !de(l) || l !== this._$AH[c], l === S ? e = S : e !== S && (e += (l ?? "") + n[c + 1]), this._$AH[c] = l;
    }
    r && !s && this.j(e);
  }
  j(e) {
    e === S ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class jt extends we {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === S ? void 0 : e;
  }
}
class Ht extends we {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== S);
  }
}
class Gt extends we {
  constructor(e, i, t, s, n) {
    super(e, i, t, s, n), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = ie(this, e, i, 0) ?? S) === te) return;
    const t = this._$AH, s = e === S && t !== S || e.capture !== t.capture || e.once !== t.once || e.passive !== t.passive, n = e !== S && (t === S || s);
    s && this.element.removeEventListener(this.name, this, t), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Lt {
  constructor(e, i, t) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = t;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    ie(this, e);
  }
}
const Vt = Oe.litHtmlPolyfillSupport;
Vt?.(le, he), (Oe.litHtmlVersions ??= []).push("3.3.3");
const Ft = (o, e, i) => {
  const t = i?.renderBefore ?? e;
  let s = t._$litPart$;
  if (s === void 0) {
    const n = i?.renderBefore ?? null;
    t._$litPart$ = s = new he(e.insertBefore(ce(), n), n, void 0, i ?? {});
  }
  return s._$AI(o), s;
};
const Ue = globalThis;
class ae extends ee {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ft(i, this.renderRoot, this.renderOptions);
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
ae._$litElement$ = !0, ae.finalized = !0, Ue.litElementHydrateSupport?.({ LitElement: ae });
const Wt = Ue.litElementPolyfillSupport;
Wt?.({ LitElement: ae });
(Ue.litElementVersions ??= []).push("4.2.2");
const Xe = "circuitsetup_energy_meter_helper/", Kt = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i, Yt = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i, Zt = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/, Jt = /[\u0000-\u001f\u007f-\u009f]/, Qt = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]), Xt = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]), ei = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "partial", "indeterminate", "verified", "cancelled"]), Be = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]), et = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]), me = /* @__PURE__ */ new Set(["A", "B", "C"]), ti = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]), ii = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]), si = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]), ni = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]), oi = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]), ri = /^(?:ct(?:[1-9]|[1-3][0-9]|4[0-2])_name|current_cal_ct(?:[1-9]|[1-3][0-9]|4[0-2])|voltage_cal[12])$/, ai = /^[0-9a-f]{12}$/, ci = /^[0-9a-f]{64}$/, tt = /^[0-9a-f]{32}$/, di = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/, it = /* @__PURE__ */ new Set(["preview_ct_config", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "rollback_ct_config", "subscribe_config_transaction"]), li = /* @__PURE__ */ new Set(["available", "unavailable", "invalid"]), hi = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial"]), pi = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial", "indeterminate"]), ui = /* @__PURE__ */ new Set(["applied_pending_restart_verification", "partial", "indeterminate"]);
function y(o, e) {
  if (o === null || typeof o != "object" || Array.isArray(o)) throw new Error(`${e} response is invalid`);
  return o;
}
function $(o, e, i = 100) {
  if (!Array.isArray(o) || o.length > i) throw new Error(`${e} response is invalid`);
  return o;
}
function b(o, e, i = !1) {
  if (i && o === null) return null;
  if (typeof o != "string" || o.length === 0) throw new Error(`${e} response is invalid`);
  return o;
}
function A(o, e) {
  if (typeof o != "number" || !Number.isFinite(o)) throw new Error(`${e} response is invalid`);
  return o;
}
function w(o, e) {
  const i = A(o, e);
  if (!Number.isInteger(i)) throw new Error(`${e} response is invalid`);
  return i;
}
function B(o, e, i = !1) {
  if (i && o === null) return null;
  if (typeof o != "boolean") throw new Error(`${e} response is invalid`);
  return o;
}
function R(o, e, i) {
  const t = b(o, i);
  if (!e.has(t)) throw new Error(`${i} response is invalid`);
  return t;
}
function Ee(o, e) {
  o !== void 0 && b(o, e, !0);
}
function j(o, e) {
  return Math.abs(o - e) <= 1e-9 * Math.max(1, Math.abs(o), Math.abs(e));
}
function H(o, e, i) {
  const t = Object.keys(o);
  if (t.length !== e.length || t.some((s) => !e.includes(s))) throw new Error(`${i} response is invalid`);
}
function fe(o, e) {
  return o.length === e.length && o.every((i, t) => i === e[t]);
}
function ft(o, e) {
  const i = y(o, e);
  b(i.entry_id, e), b(i.title, e), b(i.project_name, e), b(i.project_version, e, !0), B(i.importable, e, !0), b(i.configuration, e, !0);
}
function ge(o, e) {
  const i = y(o, e);
  if (R(i.state, Qt, e), $(i.devices, e).forEach((t) => ft(t, e)), i.configuration_authoritative !== void 0 && B(i.configuration_authoritative, e), i.installer_intent !== void 0) {
    const t = y(i.installer_intent, e), s = w(t.addon_count, e);
    if (s < 0 || s > 6) throw new Error(`${e} response is invalid`);
    if (R(t.connection_type, Be, e) === "unknown") throw new Error(`${e} response is invalid`);
  }
  return o;
}
function st(o, e) {
  const i = y(o, e), t = w(i.addon_count, e), s = w(i.board_count, e), n = w(i.ct_count, e), r = w(i.group_count, e);
  if (t < 0 || t > 6 || s < 1 || s > 7 || n < 6 || n > 42 || r < 2 || r > 14 || s !== t + 1 || n !== 6 * s || r !== 2 * s) throw new Error(`${e} response is invalid`);
  R(i.connection_type, Be, e), b(i.voltage_layout, e), b(i.project_name, e);
  const a = $(i.evidence, e);
  if (a.length < 1 || a.length > et.size) throw new Error(`${e} response is invalid`);
  const c = a.map((l) => {
    const u = y(l, e), d = R(u.source, et, e), p = w(u.addon_count, e);
    if (p < 0 || p > 6) throw new Error(`${e} response is invalid`);
    return b(u.detail, e), d;
  });
  if (new Set(c).size !== c.length || !c.some((l) => oi.has(l))) throw new Error(`${e} response is invalid`);
  return o;
}
function fi(o, e) {
  const i = y(o, e);
  return "topology" in i ? (st(i.topology, e), i.configuration_authoritative !== void 0 && B(i.configuration_authoritative, e), o) : st(o, e);
}
function gi(o, e) {
  const i = y(o, e);
  b(i.plan_id, e), b(i.source_sha256, e);
  const t = $(i.channels, e);
  if (t.length < 6 || t.length > 42 || t.length % 6 !== 0) throw new Error(`${e} response is invalid`);
  t.forEach((r, a) => {
    const c = y(r, e), l = w(c.channel, e);
    b(c.name, e), w(c.raw_gain_ct, e), A(c.reporting_multiplier, e), Ee(c.selected_model_id, e), B(c.selection_verified_against_config, e), Ee(c.display_label, e);
    const u = y(c.address, e), d = w(u.channel, e), p = w(u.board_index, e), g = w(u.group_index, e), f = R(u.phase, me, e), v = a + 1;
    if (l !== v || d !== v || p !== Math.floor(a / 6) || g !== Math.floor(a % 6 / 3) || f !== ["A", "B", "C"][a % 3]) throw new Error(`${e} response is invalid`);
  });
  const s = y(i.catalog, e);
  b(s.source_repository, e), b(s.source_ref, e), w(s.schema_version, e);
  const n = $(s.presets, e);
  if (n.length > 64) throw new Error(`${e} response is invalid`);
  return n.forEach((r) => {
    const a = y(r, e);
    b(a.model_id, e), b(a.label, e), A(a.rated_current_a, e), b(a.secondary, e), a.default_gain_ct !== null && w(a.default_gain_ct, e), B(a.requires_burden_jumper_cut, e), b(a.notes, e);
  }), o;
}
function oe(o, e) {
  const i = y(o, e);
  if (b(i.transaction_id, e), R(i.state, Xt, e), b(i.source_sha256, e), B(i.rollback_available, e), b(i.redacted_diff, e), $(i.changes, e).forEach((t) => {
    const s = y(t, e), n = b(s.key, e);
    if (!ri.test(n)) throw new Error(`${e} response is invalid`);
    s.old_value !== null && b(s.old_value, e), b(s.new_value, e);
  }), $(i.evidence, e).forEach((t) => R(t, ii, e)), $(i.progress, e).forEach((t) => R(t, si, e)), i.validation_detail != null) {
    const t = y(i.validation_detail, e);
    for (const s of ["reported_error_count", "reported_warning_count"]) t[s] !== null && w(t[s], e);
    t.code !== null && w(t.code, e), w(t.error_record_count, e), w(t.warning_record_count, e);
  }
  return i.upload_progress !== void 0 && $(i.upload_progress, e).forEach((t) => {
    const s = y(t, e);
    if (R(s.stage, ti, e), s.progress !== null && s.percentage !== null && s.progress !== void 0 && s.percentage !== void 0) throw new Error(`${e} response is invalid`);
    const n = s.progress ?? s.percentage;
    if (n != null) {
      const r = w(n, e);
      if (r < 0 || r > 100) throw new Error(`${e} response is invalid`);
    }
  }), o;
}
function G(o, e) {
  const i = y(o, e);
  b(i.session_id, e), b(i.device_id, e), R(i.state, ei, e), B(i.safety_acknowledged, e);
  const t = y(i.preflight, e);
  $(t.issues, e).forEach((d) => {
    const p = y(d, e);
    R(p.code, ni, e), b(p.role, e), b(p.detail, e);
  }), $(t.zeroed_roles, e).forEach((d) => b(d, e)), i.entity_role_counts !== void 0 && Object.values(y(i.entity_role_counts, e)).forEach((d) => {
    if (w(d, e) < 0) throw new Error(`${e} response is invalid`);
  }), i.calibration_sources !== void 0 && Object.values(y(i.calibration_sources, e)).forEach((d) => R(d, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), e));
  const s = [i.offset_capability, i.offset_disposition, i.offset_boards, i.has_pending_calibration];
  if (s.every((d) => d === void 0)) return o;
  if (s.some((d) => d === void 0)) throw new Error(`${e} response is invalid`);
  const n = y(i.offset_capability, e);
  if (H(n, ["status", "repair_reason"], e), R(n.status, li, e) === "invalid") b(n.repair_reason, e);
  else if (n.repair_reason !== null) throw new Error(`${e} response is invalid`);
  const a = R(i.offset_disposition, hi, e), c = $(i.offset_boards, e, 7);
  if (c.length < 1) throw new Error(`${e} response is invalid`);
  const l = [];
  c.forEach((d, p) => {
    const g = y(d, e);
    if (H(g, ["board_index", "stages"], e), w(g.board_index, e) !== p) throw new Error(`${e} response is invalid`);
    const f = $(g.stages, e, 2);
    if (f.length !== 2) throw new Error(`${e} response is invalid`);
    f.forEach((v, _) => {
      const m = y(v, e);
      if (H(m, ["stage", "state"], e), w(m.stage, e) !== _ + 1) throw new Error(`${e} response is invalid`);
      l.push(R(m.state, pi, e));
    });
  });
  const u = l.every((d) => d === "skipped") ? "skipped" : l.every((d) => d === "completed") ? "completed" : l.every((d) => d === "not_started") ? "not_started" : l.some((d) => d === "partial" || d === "indeterminate") || l.some((d) => d === "skipped") ? "partial" : "in_progress";
  if (a !== u) throw new Error(`${e} response is invalid`);
  return B(i.has_pending_calibration, e), o;
}
function _i(o, e, i, t) {
  const s = y(o, e);
  if (H(s, ["stage", "ready", "connection_generation", "entities", "reasons", "thresholds"], e), w(s.stage, e) !== t || i < 0 || i > 6) throw new Error(`${e} response is invalid`);
  const n = B(s.ready, e), r = w(s.connection_generation, e);
  if (r < 1) throw new Error(`${e} response is invalid`);
  const a = y(s.thresholds, e);
  H(a, ["sample_count", "zero_voltage_peak_volts", "zero_voltage_spread_volts", "zero_current_peak_amps", "zero_current_spread_amps", "voltage_present_minimum_volts", "voltage_present_spread_volts"], e);
  const c = w(a.sample_count, e), l = A(a.zero_voltage_peak_volts, e), u = A(a.zero_voltage_spread_volts, e), d = A(a.zero_current_peak_amps, e), p = A(a.zero_current_spread_amps, e), g = A(a.voltage_present_minimum_volts, e), f = A(a.voltage_present_spread_volts, e), v = [
    l,
    u,
    d,
    p,
    g,
    f
  ];
  if (c < 3 || c > 100 || v.some((U) => U < 0) || v[4] === 0) throw new Error(`${e} response is invalid`);
  const _ = $(s.entities, e, 12);
  if (_.length !== 12) throw new Error(`${e} response is invalid`);
  const m = /* @__PURE__ */ new Map();
  for (const U of [0, 1]) {
    const k = i === 0 ? `main_${U + 1}` : `addon${i}_${U + 1}`;
    for (const M of ["a", "b", "c"]) m.set(`${k}.voltage_${M}`, "voltage");
    for (let M = 1; M <= 3; ++M) m.set(`ct${i * 6 + U * 3 + M}.current_sensor`, "current");
  }
  const C = "entity binding is not on the active connection generation", E = "fresh window unavailable: ", I = /* @__PURE__ */ new Set(), N = [];
  let O = 0;
  _.forEach((U) => {
    const k = y(U, e);
    H(k, ["role", "quantity", "ready", "reasons", "window"], e);
    const M = b(k.role, e), Z = R(k.quantity, /* @__PURE__ */ new Set(["voltage", "current"]), e);
    if (I.has(M) || m.get(M) !== Z) throw new Error(`${e} response is invalid`);
    I.add(M);
    const ze = B(k.ready, e), J = $(k.reasons, e, 12).map((D) => b(D, e));
    let q;
    if (k.window === null) {
      if (ze || J.length !== 1) throw new Error(`${e} response is invalid`);
      if (J[0] === C) ++O;
      else if (!J[0].startsWith(E) || J[0].slice(E.length).trim().length === 0)
        throw new Error(`${e} response is invalid`);
      q = J;
    } else {
      const D = y(k.window, e);
      H(D, ["values", "received_at", "connection_generation", "mean", "minimum", "maximum", "absolute_peak", "absolute_spread"], e);
      const Q = $(D.values, e, c).map((F) => A(F, e)), Se = $(D.received_at, e, c).map((F) => A(F, e)), $t = A(D.mean, e), ke = A(D.minimum, e), je = A(D.maximum, e), Ce = A(D.absolute_peak, e), pe = A(D.absolute_spread, e), St = Q.reduce((F, ue) => F + ue, 0) / Q.length, kt = w(D.connection_generation, e);
      if (Q.length !== c || Se.length !== c || Se.some((F, ue) => ue > 0 && F <= Se[ue - 1]) || !j($t, St) || !j(ke, Math.min(...Q)) || !j(je, Math.max(...Q)) || !j(Ce, Math.max(...Q.map(Math.abs))) || !j(pe, je - ke)) throw new Error(`${e} response is invalid`);
      q = [], kt !== r ? q.push("window is from another connection generation") : Z === "current" ? (Ce > d && q.push("absolute peak exceeds zero_current_peak_amps"), pe > p && q.push("absolute spread exceeds zero_current_spread_amps")) : t === 1 ? (Ce > l && q.push("absolute peak exceeds zero_voltage_peak_volts"), pe > u && q.push("absolute spread exceeds zero_voltage_spread_volts")) : (ke < g && q.push("minimum is below voltage_present_minimum_volts"), pe > f && q.push("absolute spread exceeds voltage_present_spread_volts"));
    }
    if (!fe(J, q) || ze !== (q.length === 0)) throw new Error(`${e} response is invalid`);
    N.push(...q.map((D) => `${M}: ${D}`));
  });
  const P = $(s.reasons, e, 100).map((U) => b(U, e)), z = [...N, "connection generation changed while collecting readiness"], T = O === _.length && fe(P, [C]) || O === 0 && (fe(P, N) || fe(P, z));
  if (I.size !== m.size || !T || n !== (P.length === 0)) throw new Error(`${e} response is invalid`);
  return o;
}
function gt(o, e) {
  const i = $(o, e, 3);
  if (i.length !== 3) throw new Error(`${e} response is invalid`);
  return i.forEach((t) => {
    const s = $(t, e, 2);
    if (s.length !== 2 || s.some((n) => {
      const r = w(n, e);
      return r < -32768 || r > 32767;
    })) throw new Error(`${e} response is invalid`);
  }), o;
}
function vi(o, e, i, t) {
  const s = y(o, e);
  H(s, ["state", "board_index", "stage", "expected_tables", "unfinished_group_keys", "retry_allowed", "error"], e);
  const n = R(s.state, ui, e);
  if (w(s.board_index, e) !== i || w(s.stage, e) !== t) throw new Error(`${e} response is invalid`);
  const r = i === 0 ? ["main_1", "main_2"] : [`addon${i}_1`, `addon${i}_2`], a = $(s.expected_tables, e, 2).map((d) => {
    const p = $(d, e, 2);
    if (p.length !== 2) throw new Error(`${e} response is invalid`);
    const g = b(p[0], e);
    if (!r.includes(g)) throw new Error(`${e} response is invalid`);
    return gt(p[1], e), g;
  }), c = $(s.unfinished_group_keys, e, 2).map((d) => b(d, e)), l = [...a, ...c], u = B(s.retry_allowed, e);
  if (l.length !== 2 || new Set(l).size !== 2 || l.some((d) => !r.includes(d))) throw new Error(`${e} response is invalid`);
  if (n === "applied_pending_restart_verification") {
    if (a.length !== 2 || c.length !== 0 || u || s.error !== null) throw new Error(`${e} response is invalid`);
  } else if (b(s.error, e), !u || a.length !== (n === "partial" ? 1 : 0)) throw new Error(`${e} response is invalid`);
  return o;
}
function nt(o, e, i, t) {
  const s = y(o, e), n = R(s.target, /* @__PURE__ */ new Set(["voltage", "current"]), e);
  b(s.target_id, e);
  const r = B(s.stable, e);
  if (n !== i || s.target_id !== t) throw new Error(`${e} response is invalid`);
  const a = $(s.windows, e, n === "voltage" ? 3 : 1);
  if (a.length !== (n === "voltage" ? 3 : 1)) throw new Error(`${e} response is invalid`);
  const c = a.map((l) => {
    const u = y(l, e), d = $(u.samples, e, 1).map((C) => A(C, e));
    if (d.length !== 1) throw new Error(`${e} response is invalid`);
    const p = A(u.mean, e), g = A(u.standard_deviation, e), f = A(u.range_percent, e), v = d.reduce((C, E) => C + E, 0) / d.length, _ = Math.sqrt(d.reduce((C, E) => C + (E - v) ** 2, 0) / d.length), m = 100 * (Math.max(...d) - Math.min(...d)) / Math.abs(v);
    if (!j(p, v) || !j(g, _) || !j(f, m)) throw new Error(`${e} response is invalid`);
    return f;
  });
  if (r !== c.every((l) => l <= 1)) throw new Error(`${e} response is invalid`);
  return o;
}
function ot(o, e, i) {
  const t = y(o, e), s = R(t.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), e);
  b(t.group_key, e), t.phase !== null && R(t.phase, me, e);
  const n = w(t.iteration, e), r = $(t.changed_channels, e, 3).map((f) => w(f, e)), a = $(t.before_values, e, 3), c = $(t.after_values, e, 3), l = $(t.error_percent_values, e, 3);
  for (const f of [a, c, l]) f.forEach((v) => A(v, e));
  const u = i.target === "voltage" ? i.groupKey : Ne(i.references[0].channel), d = i.target === "voltage" ? _t(i.groupKey) : i.references.map((f) => f.channel), p = i.target === "current" && i.references.length === 1 ? ["A", "B", "C"][(i.references[0].channel - 1) % 3] : null, g = B(t.retry_allowed, e);
  if (i.target === "voltage" && (!Number.isFinite(i.reference) || i.reference <= 0) || i.target === "current" && i.references.some((f) => !Number.isFinite(f.reference) || f.reference <= 0 || !Number.isFinite(f.rawReference) || f.rawReference <= 0) || ![1, 2, 3].includes(r.length) || s !== "indeterminate" && a.length !== r.length || new Set(r).size !== r.length || r.some((f) => f < 1 || f > 42) || n < 1 || n > 3 || t.group_key !== u || t.phase !== p || r.length !== d.length || r.some((f, v) => f !== d[v]) || (s === "indeterminate" ? c.length !== 0 || l.length !== 0 : c.length !== r.length || l.length !== r.length)) throw new Error(`${e} response is invalid`);
  if (s === "indeterminate") {
    if (t.gain_evidence !== null || g) throw new Error(`${e} response is invalid`);
    t.restore_evidence != null && y(t.restore_evidence, e);
  } else {
    if (t.gain_evidence == null || t.restore_evidence !== null) throw new Error(`${e} response is invalid`);
    mi(t.gain_evidence, e, i);
    const f = i.target === "voltage" ? c.map(() => i.reference) : i.references.map((m) => m.reference), v = c.map((m, C) => 100 * Math.abs(A(m, e) - f[C]) / f[C]);
    if (l.some((m, C) => A(m, e) < 0 || !j(A(m, e), v[C]))) throw new Error(`${e} response is invalid`);
    const _ = Math.max(...v) > 1;
    if (s === "result_outside_tolerance" !== _ || g !== (_ && n < 3)) throw new Error(`${e} response is invalid`);
  }
  return o;
}
function Ne(o) {
  const e = Math.floor((o - 1) / 6), i = Math.floor((o - 1) % 6 / 3) + 1;
  return e === 0 ? `main_${i}` : `addon${e}_${i}`;
}
function mi(o, e, i) {
  const t = y(o, e), s = w(t.connection_generation, e), n = w(t.operation_sequence, e), r = i.target === "voltage" ? i.groupKey : Ne(i.references[0].channel), a = r.startsWith("main_") ? `meter_main${r.slice(-1)}` : r;
  if (s < 1 || n < 1 || b(t.instance_id, e) !== a) throw new Error(`${e} response is invalid`);
  const c = i.target === "current" ? new Map(i.references.map((p) => [["A", "B", "C"][(p.channel - 1) % 3], p.rawReference])) : /* @__PURE__ */ new Map(), l = $(t.phases, e, 3);
  if (l.length !== 3) throw new Error(`${e} response is invalid`);
  l.forEach((p, g) => {
    const f = y(p, e), v = R(f.phase, me, e);
    if (v !== ["A", "B", "C"][g]) throw new Error(`${e} response is invalid`);
    A(f.measured_voltage, e), A(f.measured_current, e);
    const _ = A(f.reference_voltage, e), m = A(f.reference_current, e), C = w(f.old_voltage_gain, e), E = w(f.new_voltage_gain, e), I = w(f.old_current_gain, e), N = w(f.new_current_gain, e);
    if ([C, E, I, N].some((O) => O < 1 || O > 65535)) throw new Error(`${e} response is invalid`);
    if (i.target === "voltage") {
      if (Math.abs(_ - i.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(_), i.reference)) || Math.abs(m) > 1e-6 || I !== N) throw new Error(`${e} response is invalid`);
    } else {
      const O = c.get(v);
      if (Math.abs(_) > 1e-6 || (O === void 0 ? Math.abs(m) > 1e-6 : Math.abs(m - O) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(m), O))) || C !== E || O === void 0 && I !== N) throw new Error(`${e} response is invalid`);
    }
  });
  const u = $(t.register_mismatch_phases, e, 3);
  u.forEach((p) => R(p, me, e));
  const d = $(t.matching_lines, e, 100);
  if (d.length === 0 || d.some((p) => typeof p != "string") || B(t.flash_saved, e) !== !0 || u.length !== 0 || B(t.calibration_disabled, e) !== !1) throw new Error(`${e} response is invalid`);
}
function _t(o) {
  const e = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(o);
  if (!e) return [];
  const i = e[2] === void 0 ? 0 : Number(e[2]), t = Number(e[1] ?? e[3]), s = i * 6 + (t - 1) * 3 + 1;
  return [s, s + 1, s + 2];
}
function Re(o, e, i) {
  const t = y(o, e);
  for (const g of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) b(t[g], e);
  const s = w(t.topology_addon_count, e);
  R(t.topology_connection_type, Be, e);
  const n = w(t.connection_generation, e), r = R(t.source_authority, /* @__PURE__ */ new Set(["saved_flash", "configuration"]), e), a = B(t.source_handoff_available, e), c = B(t.source_handoff_firmware_installed, e);
  Ee(t.source_handoff_transaction_id, e);
  const l = t.config_filename !== null || t.config_sha256 !== null;
  if (l && (b(t.config_filename, e), b(t.config_sha256, e), !di.test(t.config_filename) || !ci.test(t.config_sha256)))
    throw new Error(`${e} response is invalid`);
  if (t.config_filename === null != (t.config_sha256 === null) || a && (!l || c || t.source_handoff_transaction_id !== null || r !== "saved_flash") || !a && l && t.source_handoff_transaction_id === null || c && (!l || t.source_handoff_transaction_id === null) || r === "configuration" && (!c || a)) throw new Error(`${e} response is invalid`);
  if (!ai.test(t.mac) || !tt.test(t.verification_id) || n < 1 || t.source_handoff_transaction_id !== null && !tt.test(t.source_handoff_transaction_id) || s !== i.addon_count || t.topology_project_name !== i.project_name || t.topology_connection_type !== i.connection_type || t.topology_voltage_layout !== i.voltage_layout) throw new Error(`${e} response is invalid`);
  const u = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: s }, (g, f) => [`addon${f + 1}_1`, `addon${f + 1}_2`]).flat()]), d = (g, f, v) => {
    const _ = $(t[g] ?? [], e, 14), m = /* @__PURE__ */ new Set();
    return _.forEach((C) => {
      const E = y(C, e);
      H(E, ["instance_id", f], e);
      const I = b(E.instance_id, e);
      if (!u.has(I) || m.has(I)) throw new Error(`${e} response is invalid`);
      if (m.add(I), v) gt(E[f], e);
      else {
        const N = $(E[f], e, 3);
        if (N.length !== 3) throw new Error(`${e} response is invalid`);
        N.forEach((O) => {
          const P = $(O, e, 2);
          if (P.length !== 2 || P.some((z) => {
            const x = w(z, e);
            return x < 1 || x > 65535;
          })) throw new Error(`${e} response is invalid`);
        });
      }
    }), _.length;
  };
  if (d("groups", "phase_gains", !1) + d("offset_groups", "phase_offsets", !0) + d("power_offset_groups", "phase_power_offsets", !0) < 1) throw new Error(`${e} response is invalid`);
  return o;
}
function bi(o, e, i) {
  const t = y(o, e);
  return t.session !== null && G(t.session, e), t.transaction !== null && oe(t.transaction, e), t.verified_calibration !== null && Re(t.verified_calibration, e, i), o;
}
class be {
  constructor(e, i) {
    this.hass = e, this.entryId = i, this.setupStatus = () => this.call("setup_status", (t) => ge(t, "setup_status")), this.listMeters = () => this.call("list_meters", (t) => ($(t, "list_meters").forEach((s) => ft(s, "list_meters")), t)), this.getTopology = (t) => this.call("get_topology", (s) => fi(s, "get_topology"), { device_id: t }), this.getCtInventory = (t) => this.call("get_ct_inventory", (s) => gi(s, "get_ct_inventory"), { device_id: t }), this.getActiveWork = (t, s) => this.call("get_active_work", (n) => bi(n, "get_active_work", s), { device_id: t }), this.getSession = (t) => this.call("get_session", (s) => G(s, "get_session"), { session_id: t }), this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (t) => y(t, "get_diagnostics_summary")), this.setInstallerIntent = (t, s) => this.call("set_installer_intent", (n) => ge(n, "set_installer_intent"), { addon_count: t, connection_type: s }), this.rescan = () => this.call("rescan", (t) => ge(t, "rescan")), this.adoptDevice = (t) => this.call("adopt_device", (s) => {
      const n = y(s, "adopt_device");
      return b(n.device_id, "adopt_device"), b(n.configuration, "adopt_device"), s;
    }, { device_id: t }), this.previewCtConfig = (t, s, n, r) => this.call("preview_ct_config", (a) => oe(a, "preview_ct_config"), {
      device_id: t,
      plan_id: s,
      source_sha256: n,
      changes: r
    }), this.setHaLabels = (t, s, n, r) => this.call("set_ha_labels", (a) => a, {
      device_id: t,
      plan_id: s,
      source_sha256: n,
      changes: r
    }), this.transaction = (t, s, n, r) => this.call(t, (a) => oe(a, t), {
      device_id: s,
      transaction_id: n,
      source_sha256: r
    }), this.applyCtConfig = (t, s, n) => this.transaction("apply_ct_config", t, s, n), this.compileCtConfig = (t, s, n) => this.transaction("compile_ct_config", t, s, n), this.installCtConfig = (t, s, n) => this.transaction("install_ct_config", t, s, n), this.rollbackCtConfig = (t, s, n) => this.transaction("rollback_ct_config", t, s, n), this.startSession = (t) => this.call("start_session", (s) => G(s, "start_session"), { device_id: t }), this.acknowledgeSafety = (t) => this.call("acknowledge_safety", (s) => G(s, "acknowledge_safety"), { session_id: t, acknowledged: !0 }), this.checkStability = (t, s, n) => this.call("check_stability", (r) => nt(r, "check_stability", s, n), { session_id: t, target: s, target_id: n }), this.checkOffsetReadiness = (t, s, n) => this.call("check_offset_readiness", (r) => _i(r, "check_offset_readiness", s, n), {
      session_id: t,
      board_index: s,
      stage: n
    }), this.calibrateOffset = (t, s, n, r, a) => this.call("calibrate_offset", (c) => vi(c, "calibrate_offset", s, n), {
      session_id: t,
      board_index: s,
      stage: n,
      preparation_acknowledged: r,
      confirm_retry: a
    }), this.skipOffsetCalibration = (t) => this.call("skip_offset_calibration", (s) => G(s, "skip_offset_calibration"), { session_id: t }), this.checkVoltageStability = (t, s) => s.length !== 2 || new Set(s).size !== 2 ? Promise.reject(new Error("check_stability board is invalid")) : this.call("check_stability", (n) => {
      const r = $(n, "check_stability", 2);
      if (r.length !== 2) throw new Error("check_stability response is invalid");
      return r.map((a, c) => nt(a, "check_stability", "voltage", s[c]));
    }, { session_id: t, target: "voltage", target_ids: s }), this.calibrateVoltage = (t, s, n) => {
      const r = s.map((a) => _t(a.group_key));
      return s.length !== 2 || new Set(s.map((a) => a.group_key)).size !== 2 || r.some((a) => a.length !== 3) || new Set(r.map((a) => Math.floor((a[0] - 1) / 6))).size !== 1 || s.some((a) => !Number.isFinite(a.reference) || a.reference <= 0) ? Promise.reject(new Error("calibrate_voltage board is invalid")) : this.call("calibrate_voltage", (a) => {
        const c = $(a, "calibrate_voltage", 2);
        if (c.length !== 2) throw new Error("calibrate_voltage response is invalid");
        return c.map((l, u) => ot(l, "calibrate_voltage", {
          target: "voltage",
          groupKey: s[u].group_key,
          reference: s[u].reference
        }));
      }, { session_id: t, references: s, confirm_iteration: n });
    }, this.calibrateCurrent = (t, s, n, r = []) => s.length < 1 || s.length > 3 || new Set(s.map((a) => a.channel)).size !== s.length || new Set(s.map((a) => Ne(a.channel))).size !== 1 || s.some((a) => !Number.isInteger(a.channel) || a.channel < 1 || a.channel > 42 || !Number.isFinite(a.reference) || a.reference <= 0 || !Number.isFinite(a.reporting_multiplier) || a.reporting_multiplier < 1e-3 || a.reporting_multiplier > 1e3) ? Promise.reject(new Error("calibrate_current references are invalid")) : this.call("calibrate_current", (a) => ot(a, "calibrate_current", {
      target: "current",
      references: s.map((c) => ({ channel: c.channel, reference: c.reference, rawReference: c.reference / c.reporting_multiplier }))
    }), {
      session_id: t,
      references: s,
      confirm_iteration: n,
      pending_multipliers: r
    }), this.restartAndVerify = (t, s) => this.call("restart_and_verify", (n) => Re(n, "restart_and_verify", s), { session_id: t }), this.completeCalibrationWithoutChanges = (t) => this.call("complete_calibration_without_changes", (s) => {
      const n = G(s, "complete_calibration_without_changes");
      if (n.session_id !== t || n.state !== "verified" || n.has_pending_calibration !== !1)
        throw new Error("complete_calibration_without_changes response is invalid");
      return n;
    }, { session_id: t }), this.previewCalibratedGains = (t, s, n = []) => this.call("preview_calibrated_gains", (r) => oe(r, "preview_calibrated_gains"), {
      session_id: t,
      verification_id: s,
      changes: n
    }), this.clearCalibrationFlash = (t, s, n, r) => this.call("clear_calibration_flash", (a) => Re(a, "clear_calibration_flash", r), {
      session_id: t,
      verification_id: s,
      transaction_id: n
    }), this.cancelSession = (t) => this.call("cancel_session", (s) => G(s, "cancel_session"), { session_id: t }), this.subscribeSetup = (t) => this.subscribe("subscribe_setup", {}, (s) => ge(s, "subscribe_setup"), t), this.subscribeConfigTransaction = (t, s, n, r) => this.subscribe("subscribe_config_transaction", {
      device_id: t,
      transaction_id: s,
      source_sha256: n
    }, (a) => oe(a, "subscribe_config_transaction"), r), this.subscribeSession = (t, s) => this.subscribe("subscribe_session", { session_id: t }, (n) => G(n, "subscribe_session"), s);
  }
  static assertPublicPayload(e, i = !1, t = 0, s = "", n = !1) {
    if (t > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(e)) {
      if (e.length > 100) throw new Error(`unsafe collection ${s || "value"} refused`);
      for (const r of e) this.assertPublicPayload(r, !1, t + 1, s);
      return;
    }
    if (typeof e == "string") {
      const r = e.includes(`
`) || e.includes("\r"), a = s === "redacted_diff" ? 32768 : 4096;
      if (e.length > a || Zt.test(e) || Yt.test(e) || r && s !== "redacted_diff" || s === "redacted_diff" && e.includes("\r"))
        throw new Error(`unsafe string ${s || "value"} refused`);
      return;
    }
    if (!(e === null || typeof e != "object"))
      for (const [r, a] of Object.entries(e)) {
        if (r.length > 256 || Jt.test(r)) throw new Error("unsafe property name refused");
        if (r.toLowerCase() === "key" && !n) throw new Error(`private field ${r} refused`);
        if (r.toLowerCase() !== "raw_gain_ct" && Kt.test(r))
          throw new Error(`private field ${r} refused`);
        if (i && t === 0 && r === "changes" && Array.isArray(a)) {
          if (a.length > 100) throw new Error("unsafe collection changes refused");
          for (const c of a) this.assertPublicPayload(c, !1, t + 2, "", !0);
        } else
          this.assertPublicPayload(a, !1, t + 1, r.toLowerCase());
      }
  }
  async call(e, i, t = {}) {
    const s = await this.hass.callWS({
      type: `${Xe}${e}`,
      entry_id: this.entryId,
      ...t
    });
    return be.assertPublicPayload(s, it.has(e)), i(s);
  }
  subscribe(e, i, t, s) {
    return this.hass.connection.subscribeMessage((n) => {
      be.assertPublicPayload(n, it.has(e)), s(t(n));
    }, { type: `${Xe}${e}`, entry_id: this.entryId, ...i });
  }
}
function yi(o) {
  return h`
    <section class="review-region" aria-labelledby="review-heading">
      <h2 id="review-heading">Review changes</h2>
      <p class="warning-band">Changing a firmware name can also change its Home Assistant rename/entity-key binding. Review every substitution before Apply.</p>
      <pre aria-label="Redacted substitution diff">${o?.redacted_diff || "No reviewed substitutions yet."}</pre>
      <dl class="status-list">
        <div><dt>Validation</dt><dd>${o?.state === "validated" || o?.progress.includes("config_validated") ? "Validated" : "Pending"}</dd></div>
        <div><dt>Compile</dt><dd>${o?.state === "compiled" || o?.progress.includes("firmware_compiled") ? "Compiled" : "Pending"}</dd></div>
        <div><dt>Install</dt><dd>${o?.state === "install_confirmation_required" ? "Confirmation required" : o?.state ?? "Pending"}</dd></div>
      </dl>
    </section>
  `;
}
function wi(o, e, i, t, s, n, r) {
  const a = o?.state ?? "previewed";
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      ${yi(o)}
      ${a === "failed" ? h`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${o?.evidence.join(", ") || "The operation did not complete."}</p>
          ${o?.rollback_available ? h`<button class="danger" @click=${s}>Rollback</button>` : ""}
        </div>
      ` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${e} ?disabled=${a !== "previewed"}>Apply</button>
        <button class="secondary" @click=${i} ?disabled=${a !== "validated"}>Compile</button>
        <button class="primary" @click=${t} ?disabled=${a !== "install_confirmation_required"}>Install</button>
      </div>
      ${o?.validation_detail ? h`<dl class="status-list evidence-list">
        <div><dt>Validation code</dt><dd>${o.validation_detail.code ?? "unavailable"}</dd></div>
        <div><dt>Errors</dt><dd>${o.validation_detail.error_record_count} records (${o.validation_detail.reported_error_count ?? "unreported"} reported)</dd></div>
        <div><dt>Warnings</dt><dd>${o.validation_detail.warning_record_count} records (${o.validation_detail.reported_warning_count ?? "unreported"} reported)</dd></div>
      </dl>` : ""}
      ${o?.upload_progress?.length ? h`<ul class="upload-progress">${o.upload_progress.map((c) => h`
        <li>${c.stage}: ${c.percentage ?? c.progress ?? "in progress"}${c.percentage != null || c.progress != null ? "%" : ""}</li>
      `)}</ul>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${n}>Back</button>
        <button class="primary" data-action="continue" @click=${r} ?disabled=${a !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
const $e = (o, e) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(o.key)) return;
  o.preventDefault();
  const t = [...o.currentTarget.parentElement?.querySelectorAll('[role="tab"]') ?? []], s = o.key === "ArrowRight" || o.key === "ArrowDown", n = o.key === "Home" ? 0 : o.key === "End" ? t.length - 1 : (e + (s ? 1 : t.length - 1)) % t.length;
  t[n]?.click(), t[n]?.focus();
}, vt = (o, e, i) => (o?.default_gain_ct ?? i) == null || !Number.isFinite(e) || e <= 0 ? null : Math.round((o?.default_gain_ct ?? i) / e);
function $i(o, e, i, t, s, n, r, a = !1, c = !1) {
  const l = Math.ceil(o.channels.length / 6), u = o.channels.filter((d) => d.address.board_index === e).slice(0, 8);
  return h`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: l }, (d, p) => h`
          <button role="tab" id=${`board-tab-${p}`} data-board-tab=${p} aria-selected=${p === e}
            aria-controls="board-panel" tabindex=${p === e ? "0" : "-1"}
            @keydown=${(g) => $e(g, p)}
            @click=${() => t(p)}>${p === 0 ? "Main Board" : `Add-on ${p}`}</button>
        `)}
      </div>
      <p>Configure each CT on this board. Select its model, adjust the multiplier, and review the resulting gain.</p>
      <p class="info-band">If you expect to measure more than 65.535 A on a CT, use a multiplier of 2 for a 120 A CT or 4 for a 200 A CT. The multiplier divides the gain and multiplies current and power output by the same amount.</p>
      <div id="board-panel" role="tabpanel" aria-labelledby=${`board-tab-${e}`}>
      <div class="ct-table" role="table" aria-rowcount=${o.channels.length + 1}>
        <div class="ct-header" role="row" aria-rowindex="1">
          <span role="columnheader">CT</span><span role="columnheader">Name</span><span role="columnheader">Model</span><span role="columnheader">Current gain</span><span role="columnheader">Multiplier</span><span role="columnheader">Resulting gain</span><span role="columnheader">Burden</span><span role="columnheader">Status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${u.map((d) => {
    const p = i.get(d.channel) ?? {
      name: d.name,
      modelId: d.selected_model_id ?? "",
      multiplier: d.reporting_multiplier,
      burdenAcknowledged: !1,
      expanded: !1
    }, g = o.catalog.presets.find((_) => _.model_id === p.modelId), f = vt(g, p.multiplier, p.modelId === "custom" ? p.customGainCt : void 0), v = Pe(d, p);
    return h`
              <div class="ct-row" data-ct-row data-ct-group=${d.address.group_index} role="row" aria-rowindex=${d.channel + 1} aria-label=${`CT${d.channel}`}>
                <strong class="ct-index" role="cell">CT${d.channel}</strong>
                <label role="cell"><span class="mobile-label">Name</span><input aria-label=${`CT${d.channel} name`} .value=${p.name}
                  @input=${(_) => s(d.channel, { name: _.target.value })} /></label>
                <label role="cell"><span class="mobile-label">Model</span><select aria-label=${`CT${d.channel} model`} ?disabled=${a}
                  @change=${(_) => {
      const m = _.target.value, C = o.catalog.presets.find((E) => E.model_id === m);
      s(d.channel, {
        modelId: m,
        burdenAcknowledged: d.selection_verified_against_config && m === d.selected_model_id && (m === "custom" || C?.requires_burden_jumper_cut === !0),
        expanded: !0
      });
    }}>
                  <option value="" ?selected=${p.modelId === ""}>Choose model</option>
                  ${o.catalog.presets.map((_) => h`<option value=${_.model_id} ?selected=${p.modelId === _.model_id}>${_.label}</option>`)}
                  <option value="custom" ?selected=${p.modelId === "custom"}>Custom</option>
                </select></label>
                <span role="cell"><span class="mobile-label">Current gain</span>${d.raw_gain_ct}</span>
                <label role="cell"><span class="mobile-label">Multiplier</span><input type="number" min="0.001" step="0.001" aria-label=${`CT${d.channel} multiplier`} ?disabled=${a}
                  .value=${String(p.multiplier)} @input=${(_) => s(d.channel, { multiplier: Number(_.target.value) })} /></label>
                <span role="cell"><span class="mobile-label">Resulting gain</span>${f ?? "—"}</span>
                <span role="cell"><span class="mobile-label">Burden</span>${g?.requires_burden_jumper_cut ? "Check jumper" : "—"}</span>
                <button role="cell" class="row-toggle" aria-expanded=${p.expanded} @click=${() => s(d.channel, { expanded: !p.expanded })}>
                  ${p.modelId ? v ? "Changed" : "OK" : "Choose model"}
                </button>
              </div>
              ${p.modelId === "custom" ? h`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${d.channel} custom gain`}
                  ?disabled=${a}
                  .value=${p.customGainCt === void 0 ? "" : String(p.customGainCt)}
                  @input=${(_) => s(d.channel, { customGainCt: Number(_.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${d.channel} custom label`} ?disabled=${a} .value=${p.customLabel ?? ""}
                  @input=${(_) => s(d.channel, { customLabel: _.target.value })} /></label>
              </div>` : S}
              ${p.modelId === "custom" || g?.requires_burden_jumper_cut ? h`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${d.channel} burden output acknowledgement`}
                  ?disabled=${a}
                  .checked=${p.burdenAcknowledged}
                  @change=${(_) => s(d.channel, { burdenAcknowledged: _.target.checked })} />
                  I checked the burden-output requirement for CT${d.channel}</label>
              </div>` : S}
              ${g && g.rated_current_a > 65.535 && p.multiplier === 1 ? h`<div class="warning-band" role="status">CT${d.channel}: rated current exceeds the unscaled 65.535 A register range.</div>` : S}
              ${p.expanded && g ? h`
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
      <p class="row-count">Showing ${u[0]?.channel ?? 0}–${u.at(-1)?.channel ?? 0} of ${o.channels.length} CTs</p>
      <footer class="action-footer">
        <button class="secondary" @click=${n}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${c || !ki(o, i, a)} @click=${r}>${c ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
function X(o, e) {
  return o.channels.flatMap((i) => {
    const t = e.get(i.channel);
    if (!t || !Pe(i, t)) return [];
    const s = o.catalog.presets.find((r) => r.model_id === t.modelId), n = { channel: i.channel, name: t.name.trim(), model_id: t.modelId, reporting_multiplier: t.multiplier };
    return t.modelId === "custom" ? (t.customGainCt !== void 0 && (n.custom_gain_ct = t.customGainCt), t.customLabel !== void 0 && (n.custom_label = t.customLabel.trim()), n.burden_output_acknowledged = t.burdenAcknowledged) : s?.requires_burden_jumper_cut && (n.burden_output_acknowledged = t.burdenAcknowledged), [n];
  });
}
function Pe(o, e) {
  return e.name !== o.name || e.modelId !== (o.selected_model_id ?? "") || e.multiplier !== o.reporting_multiplier || e.modelId === "custom" && (vt(void 0, e.multiplier, e.customGainCt) !== o.raw_gain_ct || (e.customLabel?.trim() ?? "") !== (o.display_label ?? ""));
}
function Si(o, e) {
  if (!e.name.trim() || !e.modelId || !Number.isFinite(e.multiplier) || e.multiplier <= 0) return !1;
  if (e.modelId === "custom") return Number.isInteger(e.customGainCt) && e.customGainCt >= 1 && e.customGainCt <= 65535 && !!e.customLabel?.trim() && !/[\r\n]/.test(e.customLabel) && e.burdenAcknowledged;
  const i = o.catalog.presets.find((t) => t.model_id === e.modelId);
  return !!i && (!i?.requires_burden_jumper_cut || e.burdenAcknowledged);
}
function ki(o, e, i = !1) {
  if (i) return [...e].every(([t, s]) => {
    const n = o.channels.find((r) => r.channel === t);
    return !!n && !!s.name.trim() && s.modelId === (n.selected_model_id ?? "") && s.multiplier === n.reporting_multiplier;
  });
  for (const t of o.channels) {
    const s = e.get(t.channel);
    if (!s || Pe(t, s) && !Si(o, s))
      return !1;
  }
  return !0;
}
const L = (o) => o.toFixed(2);
function mt(o, e, i) {
  const t = [o, !!e?.stable, !!i, !!i?.gain_evidence, !!i], s = t.findIndex((r) => !r);
  return h`<ol class="progress-steps">${["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"].map((r, a) => h`<li
    class=${t[a] ? "complete" : a === s ? "active" : "pending"}><span
      class="progress-number">${a + 1}</span><span>${r}</span></li>`)}</ol>`;
}
function bt(o, e) {
  const i = Object.entries(o?.calibration_sources ?? {}).filter(([t]) => e === void 0 || e.includes(t));
  return h`<section class="measurement-evidence calibration-source" aria-label="Current calibration source">
    <h3>Current calibration source</h3>
    ${i.length ? h`<table><thead><tr><th>Chip</th><th>Source</th><th>Saved in flash</th></tr></thead><tbody>
      ${i.map(([t, s]) => h`<tr><td>${t}</td><td>${s === "configuration" ? "Configuration" : s === "flash" ? "Saved flash" : "Unknown"}</td><td>${s === "flash" ? "Yes" : s === "configuration" ? "No" : "Unknown"}</td></tr>`)}
    </tbody></table>` : h`<p>Calibration source is not available.</p>`}
  </section>`;
}
function De(o, e) {
  if (!o) return S;
  const i = o.target === "voltage" ? "V" : "A";
  return h`<section class="measurement-evidence" aria-label=${`${o.target} ${o.target_id} stability evidence`}>
    <h3>Stability evidence · ${o.target_id}</h3>
    ${o.windows.map((t, s) => h`<dl>
      <div><dt>${e?.[s] ?? (o.target === "voltage" ? `V${s % 3 + 1}` : `A${s + 1}`)}</dt>
        <dd>${t.samples.map((n) => `${L(n)} ${i}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}
function qe(o) {
  return o ? h`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${o.iteration}</h3>
    <dl>
      <div><dt>State</dt><dd>${o.state}</dd></div>
      <div><dt>Changed channels</dt><dd>${o.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${o.before_values.map(L).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${o.after_values.map(L).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${o.error_percent_values.map((e) => `${L(e)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${o.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${o.gain_evidence ? h`<h4>Gain evidence · ${o.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${o.gain_evidence.phases?.map((e) => h`<tr><td>${e.phase}</td><td>${L(e.measured_voltage)}</td><td>${L(e.measured_current)}</td><td>${L(e.reference_voltage)}</td><td>${L(e.reference_current)}</td><td>${e.old_voltage_gain} → ${e.new_voltage_gain}</td><td>${e.old_current_gain} → ${e.new_current_gain}</td></tr>`) ?? S}
      </tbody></table><p>Saved in flash: ${o.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : h`<p>Gain evidence unavailable.</p>`}
  </section>` : S;
}
function Ci(o, e, i, t, s, n, r, a, c, l, u, d, p, g, f) {
  const v = o?.ct_count ?? e?.channels.length ?? 6, _ = Math.floor((t - 1) / 6), C = Math.floor((t - 1) / 3) * 3 + 1, E = Array.from({ length: 3 }, (x, T) => C + T).filter((x) => x <= v), I = E.filter((x) => (s.get(x) ?? 0) > 0), N = _ === 0 ? ["meter_main1", "meter_main2"] : [`addon${_}_1`, `addon${_}_2`], O = e === null, P = n !== null && Number.isFinite(n) && n >= 1e-3 && n <= 1e3, z = I.length > 0 && (!O || P);
  return h`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${mt(z, r, a)}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(v / 6) }, (x, T) => h`<button role="tab"
          id=${`current-board-tab-${T}`} aria-controls="current-board-panel"
          aria-selected=${T === _} tabindex=${T === _ ? "0" : "-1"}
          @keydown=${(U) => $e(U, T)}
          @click=${() => c(T * 6 + 1)}>${T === 0 ? "Main Board" : `Add-on ${T}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${_}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((x) => {
    const T = _ * 6 + x * 3 + 1;
    return h`<button
          aria-pressed=${T === C} @click=${() => c(T)}>Group ${_ * 2 + x + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${C}–CT${C + 2}</h2>
      ${bt(i, N)}
      <div class="reference-block">
        ${E.map((x) => h`<label>CT${x} reference
          <input data-current-reference=${x} aria-label=${`CT${x} reference`} type="number" min="0.01" step="0.01"
            .value=${s.has(x) ? String(s.get(x)) : ""}
            @input=${(T) => {
    const U = T.target;
    l(x, U.value === "" ? null : Number(U.value));
  }} /></label>`)}
      ${O ? h`<label>Reporting multiplier <input data-role="reporting-multiplier" type="number" min="0.001" max="1000" step="0.001" required .value=${n === null ? "" : String(n)} @input=${(x) => {
    const T = Number(x.target.value);
    u(Number.isFinite(T) && T >= 1e-3 && T <= 1e3 ? T : null);
  }} /></label><p>Confirm the meter's reporting multiplier before runtime-only current calibration.</p>` : ""}
        <button class="primary" @click=${p} ?disabled=${!z || !r?.stable || (a?.iteration ?? 0) >= 3 || !!(a && !a.retry_allowed && a.iteration > 0)}>${a?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${d} ?disabled=${!z}>Check stability</button></div>
      ${r ? h`<div class=${r.stable ? "success-band" : "warning-band"} role="status">${r.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${De(r, I.map((x) => `CT${x}`))}
      ${qe(a)}
      ${a?.state.includes("indeterminate") ? h`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${g}>Reconnect and inspect</button><button class="danger" @click=${f}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const rt = (o) => o === 0 ? "Main Board" : `Add-on ${o}`, Ai = (o) => o === 0 ? ["main_1", "main_2"] : [`addon${o}_1`, `addon${o}_2`];
function xi(o, e, i, t, s, n, r, a, c, l, u, d, p, g, f, v, _, m, C) {
  const E = e?.offset_capability, I = e?.offset_boards ?? [], N = e?.offset_disposition === "completed" || e?.offset_disposition === "skipped" || e?.offset_disposition === "partial" && e.state === "applied_pending_restart_verification", O = I.length > 0 && I.every((k) => k.stages[0]?.state === "completed"), P = I[i]?.stages[t - 1]?.state ?? "not_started", z = !!a?.retry_allowed || P === "partial" || P === "indeterminate", x = E?.status !== "available", T = Ai(i), U = new Map(a?.expected_tables ?? []);
  return h`
    <section class="step-content offset-step" aria-labelledby="step-heading">
      ${x ? h`
        <div class="warning-band" role="status">
          <strong>Offset calibration is ${E?.status === "invalid" ? "not safely available" : "not available on this firmware"}.</strong>
          ${E?.status === "invalid" ? h`<p>Repair reason: ${E.repair_reason}</p>` : S}
          <p>Skip preserves the offset values already saved in flash. No clear control is invoked.</p>
        </div>
      ` : h`
        <ol class="offset-stage-stepper" aria-label="Offset calibration stages">
          <li class=${t === 1 ? "active" : O ? "complete" : "pending"}>
            <button data-offset-stage="1" aria-current=${t === 1 ? "step" : S} @click=${() => u(1)}>1. Voltage/current zero offset</button>
          </li>
          <li class=${t === 2 ? "active" : N ? "complete" : "pending"}>
            <button data-offset-stage="2" aria-current=${t === 2 ? "step" : S} ?disabled=${!O}
              @click=${() => u(2)}>2. Active/reactive power offset</button>
          </li>
        </ol>
        <div class="board-tabs" role="tablist" aria-label="Offset calibration boards">
          ${Array.from({ length: o?.board_count ?? I.length }, (k, M) => h`
            <button role="tab" data-offset-board id=${`offset-board-tab-${M}`} aria-controls="offset-board-panel"
              aria-selected=${M === i} tabindex=${M === i ? "0" : "-1"}
              @keydown=${(Z) => $e(Z, M)} @click=${() => l(M)}>
              ${rt(M)}
            </button>
          `)}
        </div>
        <div id="offset-board-panel" role="tabpanel" aria-labelledby=${`offset-board-tab-${i}`}>
          <h2>Stage ${t} · ${rt(i)}</h2>
          <div class="warning-band"><strong>Warning:</strong> An open-circuit current-output CT on a live conductor can be hazardous. De-energize conductors before unplugging any CT.</div>
          ${t === 1 ? h`
            <p>First, de-energize all conductors. Then unplug the voltage transformer/AC voltage input and CT inputs, power the meter from USB only, then check that every voltage/current phase reads near zero.</p>
          ` : h`
            <p>Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors, connect/enclose/energize only the voltage reference, then check that voltage is present on both chips and every current phase reads near zero.</p>
          `}
          <p>Measurements cannot prove that a transformer or CT is physically unplugged. Physical acknowledgement never substitutes for measured readiness.</p>
          <label class="check-row"><input type="checkbox" .checked=${s} @change=${(k) => d(k.target.checked)}>
            ${t === 1 ? "I completed the USB-only, de-energized preparation." : "I powered down for rewiring and safely enclosed and energized only the voltage reference."}
          </label>
          <div class="offset-actions">
            <button class="secondary" data-action="check-offset" ?disabled=${c || !s || P === "completed"} @click=${g}>
              ${c ? "Checking measured readiness…" : "Check measured readiness"}
            </button>
            <button class="primary" data-action="calibrate-offset"
              ?disabled=${c || !s || !r?.ready || P === "completed" || z && !n}
              @click=${f}>${a?.retry_allowed ? "Retry unfinished chip" : `Run Stage ${t} calibration`}</button>
          </div>
          ${r ? h`
            <section class="measurement-evidence" aria-label="Offset readiness evidence">
              <h3>Measured readiness</h3>
              <div class=${r.ready ? "success-band" : "warning-band"} role="status" aria-live="polite">
                ${r.ready ? "Measured readiness passed." : "Measured readiness did not pass. Physical acknowledgement is not enough."}
              </div>
              ${r.reasons.length ? h`<ul>${r.reasons.map((k) => h`<li>${k}</li>`)}</ul>` : S}
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
                ${r.entities.map((k) => h`<tr><td>${k.role}</td><td>${k.quantity}</td><td>${k.ready ? "Ready" : k.reasons.join("; ")}</td>
                  <td>${k.window?.mean ?? "—"}</td><td>${k.window?.absolute_peak ?? "—"}</td><td>${k.window?.absolute_spread ?? "—"}</td></tr>`)}
              </tbody></table>
            </section>
          ` : S}
          <section class="measurement-evidence" aria-label="Per-chip offset progress" aria-live="polite">
            <h3>Per-chip progress</h3>
            <table><thead><tr><th>Chip</th><th>State</th><th>Backend evidence</th></tr></thead><tbody>
              ${T.map((k) => h`<tr><td>${k}</td><td>${U.has(k) || P === "completed" ? "Saved; restart verification required." : a?.unfinished_group_keys.includes(k) ? "Unfinished" : P.replaceAll("_", " ")}</td>
                <td>${U.has(k) ? U.get(k).map(([M, Z]) => `${M}/${Z}`).join(", ") : "—"}</td></tr>`)}
            </tbody></table>
          </section>
          ${z ? h`<aside class="recovery-panel" role="status" aria-live="assertive">
            <strong>${a ? a.state === "partial" ? "One chip finished; recovery is required" : "Calibration outcome is indeterminate" : "Recovery is required"}</strong>
            <p>${a?.error ?? "The prior operation did not finish cleanly"}. Reconnect and inspect before retrying only the unfinished chip.</p>
            <label class="check-row"><input type="checkbox" .checked=${n} @change=${(k) => p(k.target.checked)}> I reviewed the evidence and confirm this retry.</label>
            <button class="secondary" @click=${v}>Reconnect and inspect</button>
          </aside>` : S}
        </div>
      `}
      <footer class="action-footer offset-footer">
        <button class="secondary" @click=${m}>Back</button>
        <button class="secondary" data-action="skip-offset" ?disabled=${c || N} @click=${_}>Skip offset calibration</button>
        <button class="primary" ?disabled=${c || !N} @click=${C}>Continue</button>
      </footer>
    </section>
  `;
}
function Ei(o, e, i, t, s, n) {
  const r = o.includes("failed") || o.includes("indeterminate");
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, voltage/current offsets, power offsets, and entity bindings.</p>
      <div class="status-band" role="status">${o || "Ready for restart verification"}</div>
      ${e ? h`<dl class="status-list"><div><dt>Verification</dt><dd>${e.verification_id}</dd></div><div><dt>Authority</dt><dd>${e.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${e.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${e.source_handoff_available ? e.config_filename : "Unavailable in runtime-only mode"}</dd></div></dl>` : ""}
      ${o === "cancelled" ? h`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${r ? h`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${i ? h`<button class="danger" data-action="rollback" @click=${s}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${n}>Back</button><button class="primary" @click=${t} ?disabled=${o === "cancelled" || !!e}>${o.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function Ri(o) {
  return o ? o.preflight.issues.length ? h`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${o.preflight.issues.map((e) => h`<li>${e.role}: ${e.detail}</li>`)}</ul></div>` : h`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>` : h`<p>Starting a calibration session…</p>`;
}
function Ti(o, e, i, t, s, n, r = !1) {
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      ${Ri(o)}
      ${o?.state === "cancelled" ? h`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
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
        <label class="check-row"><input type="checkbox" .checked=${e} @change=${(a) => i(a.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${s}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${n}>Back</button>
        <button class="primary" @click=${t} ?disabled=${r || o?.state === "cancelled" || !e || !!o?.preflight.issues.length}>${r ? "Loading calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const at = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
], Ii = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function Oi(o, e, i, t, s, n, r, a, c = "") {
  return h`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      <section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Configure an existing device</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        ${o?.devices.length ? h`<div class="meter-list">
          ${o.devices.map((l) => h`
            <div class="meter-row">
              <span><strong>${l.title}</strong><small>${l.project_name} · ${l.project_version ?? "version unavailable"}</small></span>
              <span>Device Builder: ${l.configuration ? "Yes" : l.importable ? "Yes — import available" : "No"}</span>
              ${l.importable && !l.configuration ? h`<button class="secondary" ?disabled=${!!c}
                @click=${() => a(l.entry_id)}>Import</button>` : ""}
              <button class="primary" data-action="configure-device" ?disabled=${!!c}
                @click=${() => r(l.entry_id)}>${c === `topology:${l.entry_id}` ? "Loading topology…" : "Configure"}</button>
            </div>
          `)}
        </div>` : h`<div class="error-panel passive" role="status">
          <strong>No compatible device found</strong>
          <span>Check power and connection, then try again.</span>
        </div>`}
        <button class="rescan" data-action="rescan" ?disabled=${!!c} @click=${n}>${c === "rescan" ? "Rescanning…" : "Rescan"}</button>
      </section>
      <hr />
      <h2>Set up a new device</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (l, u) => h`
            <label class=${u === e ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(u)}
                .checked=${u === e} @change=${() => t(u)} />
              <span>${u}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${at.map(([l, u]) => h`
            <label class=${l === i ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${l}
                .checked=${l === i} @change=${() => s(l)} />
              <span>${u}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Jumper summary</h2>
        <dl class="summary-band">
          <div><dt>IO0</dt><dd><strong>OPEN</strong> (not connected)</dd></div>
          <div><dt>Add-on boards</dt><dd>${e}</dd></div>
          <div><dt>Connection</dt><dd>${at.find(([l]) => l === i)?.[1]}</dd></div>
          ${Ii.slice(0, e).map((l, u) => h`<div><dt>Add-on ${u + 1}</dt><dd>${l}</dd></div>`)}
        </dl>
      </section>
      <p class="info-band">Use Web Serial in a supported Chromium browser and a USB data cable to flash the firmware.</p>
      <section class="io-guidance" aria-labelledby="io-heading">
        <h2 id="io-heading">IO0 guidance</h2>
        <p>Keep IO0 OPEN (not connected) while flashing. Do not connect IO0 to GND.</p>
      </section>
      <p class="info-band">${i === "wifi" ? "The external installer collects Wi-Fi provisioning details; this helper does not." : "Connect Ethernet after flashing, then wait for the meter to appear on your network."}</p>
      <section aria-labelledby="installer-heading">
        <h2 id="installer-heading">Flash in external installer</h2>
        <p>Flashing happens in the external installer. This helper continues only after your device is on the network and discovered.</p>
        <button class="primary installer" @click=${() => window.open(
    "https://circuitsetup.github.io/ESPWebInstaller/",
    "_blank",
    "noopener,noreferrer"
  )}>Open CircuitSetup Web Installer</button>
      </section>
    </section>
  `;
}
function yt(o, e, i, t, s, n = null, r = !1) {
  return h`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${o?.evidence.map((a) => h`<li>${a.source}: ${a.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${e?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...t.entries()].map(([a, c]) => h`<div data-target=${a}>${De(c)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...s.entries()].map(([a, c]) => h`<div data-target=${a}>${qe(c)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${i?.evidence.join(", ") || "No build evidence."}</p><p>${i?.progress.join(", ") || "No transaction progress."}</p>
          ${i?.validation_detail ? h`<p>Validation code ${i.validation_detail.code ?? "unavailable"}; ${i.validation_detail.error_record_count} error records; ${i.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${i?.upload_progress?.length ? h`<ul>${i.upload_progress.map((a) => h`<li>${a.stage}: ${a.percentage ?? a.progress ?? "in progress"}${a.percentage != null || a.progress != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Calibration completion record</h3><p>${n ? `Restart-verified ${n.source_authority.replaceAll("_", " ")} calibration record` : r ? "No-change completion; no restart-verified record was created" : "Not yet established"}</p><p>${n ? `Verification ${n.verification_id}, generation ${n.connection_generation}; ${n.offset_groups?.length ?? 0} voltage/current offset tables; ${n.power_offset_groups?.length ?? 0} power-offset tables.` : r ? "The server confirmed there were no pending gain or offset changes." : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function Mi(o, e, i, t, s, n, r, a, c, l) {
  const u = n?.source_authority === "saved_flash" && n.config_filename && (n.source_handoff_available || n.source_handoff_firmware_installed);
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      ${n?.source_authority === "configuration" ? h`<div class="success-band" role="status">Calibration saved to YAML; flash values cleared.</div>` : n ? h`<div class="success-band" role="status">Setup and exact restart verification are complete.</div>` : r ? h`<div class="success-band" role="status">Completed without calibration changes. No restart or restart-verified calibration record was required.</div>` : h`<div class="recovery-panel" role="status"><strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p></div>`}
      <dl class="summary-list"><div><dt>Meter topology</dt><dd>${o?.ct_count ?? "—"} CTs in ${o?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${a ?? "Unavailable"}</dd></div><div><dt>Authority source</dt><dd>${n?.source_authority.replaceAll("_", " ") ?? "Not verified"}</dd></div><div><dt>Verification ID</dt><dd>${n?.verification_id ?? "Unavailable"}</dd></div></dl>
      ${yt(o, e, i, t, s, n, r)}
      <footer class="action-footer"><button class="secondary" @click=${l}>Back</button>
        ${u ? h`<button class="primary" data-action="save-calibration" @click=${c}>${n?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : ""}
      </footer>
    </section>
  `;
}
function wt(o) {
  const e = o.addon_count, i = o.evidence.map((t) => t.source);
  return e < 0 || e > 6 || o.board_count !== e + 1 || o.ct_count !== 6 * (e + 1) || o.group_count !== 2 * (e + 1) || o.evidence.length < 1 || o.evidence.length > 5 || new Set(i).size !== i.length || !i.some((t) => ["config_project", "config_packages", "native_project"].includes(t)) || o.evidence.some((t) => t.addon_count !== e);
}
function Ui(o, e, i, t, s = !1, n = !1) {
  const r = s || wt(o);
  return h`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="identity-strip">
        <strong>${o.project_name}</strong>
        <span>Version ${e ?? "unavailable"}</span>
        <span>${o.board_count} boards</span><span>${o.ct_count} CTs</span>
        <span>${o.group_count} groups</span><span>${o.connection_type}</span>
      </div>
      <h2>Topology evidence</h2>
      <table class="evidence-table">
        <thead><tr><th>Source</th><th>Add-ons</th><th>Evidence</th></tr></thead>
        <tbody>${o.evidence.map((a) => h`
          <tr><td>${a.source.replaceAll("_", " ")}</td><td>${a.addon_count}</td><td>${a.detail}</td></tr>
        `)}</tbody>
      </table>
      ${r ? h`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : h`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${i}>Back</button>
        ${r ? "" : h`<button class="primary" data-action="continue" ?disabled=${n} @click=${t}>${n ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
function Bi(o, e, i, t, s, n, r, a, c, l, u, d, p) {
  const g = o?.voltage_layout === "two_voltages" ? 2 : 1, f = t.slice(0, g).every((_) => Number.isFinite(_) && _ > 0), v = i === 0 ? ["meter_main1", "meter_main2"] : [`addon${i}_1`, `addon${i}_2`];
  return h`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${mt(f, s, n)}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: o?.board_count ?? 1 }, (_, m) => h`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${m}`} aria-controls="voltage-board-panel"
          aria-selected=${m === i} tabindex=${m === i ? "0" : "-1"}
          @keydown=${(C) => $e(C, m)}
          @click=${() => a(m)}>${m === 0 ? "Main Board" : `Add-on ${m}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${i}`}>
      <h2>Calibrate Voltage</h2>
      ${bt(e, v)}
      <div class="reference-block">
        ${Array.from({ length: g }, (_, m) => h`<label>${g === 1 ? "Trusted instrument reference" : `Voltage ${m + 1} trusted reference`}
          <input type="number" min="0.01" step="0.01" .value=${t[m] ? String(t[m]) : ""}
            @input=${(C) => c(m, Number(C.target.value))} /></label>`)}
        <button class="primary" @click=${u} ?disabled=${r || !f || !s?.stable || !!(n && !n.retry_allowed && n.iteration > 0)}>${n?.retry_allowed ? "Retry voltage calibration" : "Calibrate voltage"}</button>
      </div>
      <div class="stability-line"><button class="secondary" @click=${l} ?disabled=${r}>${r ? "Loading live voltage data…" : "Check stability"}</button></div>
      ${s ? h`<div class=${s.stable ? "success-band" : "warning-band"} role="status">${s.stable ? "Live data loaded" : "Live data is unavailable"}</div>` : ""}
      ${De(s)}
      ${qe(n)}
      ${n?.state === "indeterminate" ? h`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${d}>Reconnect and inspect</button><button class="danger" @click=${p}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const Ni = At`
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
  .reference-block .primary { justify-self: start; }
  .stability-line { display: block; margin: 18px 0 10px; }
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
`, ne = [
  ["setup", "Setup Device"],
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
class Pi extends ae {
  constructor() {
    super(...arguments), this.hass = null, this.panel = null, this.api = null, this.setup = null, this.step = "setup", this.selectedDeviceId = null, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.addonCount = 0, this.connection = "wifi", this.board = 0, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.safetyAcknowledged = !1, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.drafts = /* @__PURE__ */ new Map(), this.labelOnly = !1, this.error = "", this.announcement = "", this.unsubs = [], this.connectionGeneration = 0, this.operationGeneration = 0, this.transactionSubscriptionScope = 0, this.sessionSubscriptionScope = 0, this.transactionUnsub = null, this.sessionUnsub = null, this.sessionStarting = !1, this.pendingAction = "", this.voltageBusy = !1, this.offsetBusy = !1, this.finishBusy = !1, this.mobileStepsOpen = !1, this.focusHeading = !1;
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
    const i = new be(this.hass, this.panel.config.entry_id);
    this.api = i;
    try {
      const t = await i.setupStatus();
      if (!this.owns(e, i)) return;
      this.setup = t;
      const s = this.setup.installer_intent;
      s && (this.addonCount = s.addon_count, this.connection = s.connection_type), this.setup.devices.length && !this.selectedDeviceId && this.selectDevice(this.setup.devices[0]?.entry_id ?? null), await this.ownSubscription(i.subscribeSetup((n) => {
        this.owns(e, i) && (this.setup = n, !this.selectedDeviceId && n.devices.length && this.selectDevice(n.devices[0]?.entry_id ?? null), this.requestUpdate());
      }), e, i), this.transaction && await this.subscribeTransaction(e), this.session && this.session.state !== "cancelled" && await this.subscribeSession(e);
    } catch (t) {
      this.owns(e, i) && this.fail(t, "Setup status could not be loaded.");
    }
    this.requestUpdate();
  }
  owns(e, i) {
    return this.isConnected && e === this.connectionGeneration && i === this.api;
  }
  ownsOperation(e, i, t) {
    return e === this.operationGeneration && i === this.api && t === this.selectedDeviceId;
  }
  async ownSubscription(e, i, t, s = () => !0, n = () => {
  }) {
    const r = await e;
    if (!this.owns(i, t) || !s()) {
      try {
        r();
      } catch {
      }
      return;
    }
    this.unsubs.push(r), n(r);
  }
  clearSubscription(e) {
    e === "transaction" ? ++this.transactionSubscriptionScope : ++this.sessionSubscriptionScope;
    const i = e === "transaction" ? this.transactionUnsub : this.sessionUnsub;
    if (e === "transaction" ? this.transactionUnsub = null : this.sessionUnsub = null, !i) return;
    const t = this.unsubs.indexOf(i);
    t >= 0 && this.unsubs.splice(t, 1);
    try {
      i();
    } catch {
    }
  }
  resetCalibrationRun() {
    this.safetyAcknowledged = !1, this.stabilityByTarget = /* @__PURE__ */ new Map(), this.calibrationByTarget = /* @__PURE__ */ new Map(), this.restartResult = null, this.completedWithoutChanges = !1, this.offsetReadinessByTarget = /* @__PURE__ */ new Map(), this.offsetResultByTarget = /* @__PURE__ */ new Map(), this.calibrationHandoff = !1, this.group = 0, this.channel = 1, this.voltageReferences = [0, 0], this.currentReferences = /* @__PURE__ */ new Map(), this.reportingMultiplier = null, this.offsetStage = 1, this.offsetAcknowledged = [!1, !1], this.offsetRetryConfirmed = !1, this.finishBusy = !1;
  }
  selectDevice(e) {
    ++this.operationGeneration, this.clearSubscription("transaction"), this.clearSubscription("session"), this.selectedDeviceId = e, this.topology = null, this.inventory = null, this.transaction = null, this.session = null, this.drafts = /* @__PURE__ */ new Map(), this.board = 0, this.resetCalibrationRun();
  }
  showTopology(e) {
    this.topology = e, this.navigate("topology"), this.error = wt(e) || e.project_name !== this.selectedProjectName() ? "Topology mismatch" : "", this.requestUpdate();
  }
  showInventory(e) {
    this.inventory = e, this.drafts = new Map(e.channels.map((i) => {
      const t = i.selected_model_id ?? "", s = e.catalog.presets.find((n) => n.model_id === t);
      return [i.channel, {
        name: i.name,
        modelId: t,
        multiplier: i.reporting_multiplier,
        customGainCt: t === "custom" || i.selected_model_id === null ? i.raw_gain_ct * i.reporting_multiplier : void 0,
        customLabel: i.display_label ?? void 0,
        burdenAcknowledged: i.selection_verified_against_config && (t === "custom" || s?.requires_burden_jumper_cut === !0),
        expanded: i.selected_model_id === null && i.raw_gain_ct === 27518
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
    const e = this.api, i = this.selectedDeviceId, t = ++this.operationGeneration;
    await this.run(async () => {
      if (await e.setInstallerIntent(this.addonCount, this.connection), !this.ownsOperation(t, e, i)) return;
      const s = await e.rescan();
      this.ownsOperation(t, e, i) && (this.setup = s, s.devices.length ? this.announcement = "Compatible meter discovered. Select it above to configure it." : this.announcement = "No compatible meter found. Check the network and rescan.");
    }, "Rescan failed.", () => this.ownsOperation(t, e, i)), this.pendingAction = "", this.requestUpdate();
  }
  async adopt(e = this.selectedDeviceId) {
    if (!this.api || !e) return;
    e !== this.selectedDeviceId && this.selectDevice(e);
    const i = this.api, t = ++this.operationGeneration;
    await this.run(async () => {
      await i.adoptDevice(e), this.ownsOperation(t, i, e) && (this.announcement = "Meter adopted in Device Builder.");
    }, "Adoption is unavailable for this meter.", () => this.ownsOperation(t, i, e));
  }
  async loadTopology() {
    if (!this.api || !this.selectedDeviceId) return;
    const e = this.api, i = this.selectedDeviceId, t = ++this.operationGeneration;
    await this.run(async () => {
      const s = await e.getTopology(i);
      this.ownsOperation(t, e, i) && this.showTopology("topology" in s ? s.topology : s);
    }, "Topology evidence could not be loaded.", () => this.ownsOperation(t, e, i));
  }
  async loadInventory() {
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    this.pendingAction = "inventory", this.requestUpdate();
    const e = this.api, i = this.selectedDeviceId, t = ++this.operationGeneration;
    try {
      await this.run(async () => {
        const s = await e.getCtInventory(i);
        this.ownsOperation(t, e, i) && this.showInventory(s);
      }, "CT inventory could not be loaded.", () => this.ownsOperation(t, e, i));
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
  }
  async recoverCtInventory(e, i, t, s) {
    const n = await e.getCtInventory(i);
    this.ownsOperation(t, e, i) && (this.clearSubscription("transaction"), this.transaction = null, this.showInventory(n), this.drafts = new Map(Array.from(this.drafts, ([r, a]) => [r, s.get(r) ?? a])), this.announcement = "Live CT data reloaded. Review the preserved changes again.");
  }
  updateDraft(e, i) {
    const t = this.drafts.get(e);
    t && (this.drafts = new Map(this.drafts).set(e, { ...t, ...i }), this.requestUpdate());
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    const e = X(this.inventory, this.drafts);
    if (!e.length) return this.fail(new Error(), "Select at least one CT change before review.");
    const i = this.api, t = this.selectedDeviceId, s = this.inventory, n = ++this.operationGeneration;
    if (this.clearSubscription("transaction"), this.transaction = null, this.labelOnly) {
      const r = e.filter((a) => a.name !== this.inventory.channels.find((c) => c.channel === a.channel)?.name).map(({ channel: a, name: c }) => ({ channel: a, name: c }));
      if (!r.length || e.some((a) => {
        const c = this.inventory.channels.find((l) => l.channel === a.channel);
        return !c || a.model_id !== (c.selected_model_id ?? "") || (a.reporting_multiplier ?? 1) !== c.reporting_multiplier;
      }))
        return this.fail(new Error(), "Home Assistant label mode only permits display-name edits.");
      await this.run(
        async () => {
          await i.setHaLabels(t, s.plan_id, s.source_sha256, r), this.announcement = "Home Assistant labels saved.";
        },
        "Home Assistant labels could not be saved.",
        () => this.ownsOperation(n, i, t)
      );
      return;
    }
    await this.run(
      async () => {
        let r;
        try {
          const a = await i.getCtInventory(t);
          if (!this.ownsOperation(n, i, t)) return;
          r = await i.previewCtConfig(
            t,
            a.plan_id,
            a.source_sha256,
            e
          );
        } catch (a) {
          if (a.code !== "stale_confirmation") throw a;
          await this.recoverCtInventory(i, t, n, this.drafts);
          return;
        }
        this.ownsOperation(n, i, t) && (this.transaction = r, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "The configuration preview is stale. Reload the CT inventory and review again.",
      () => this.ownsOperation(n, i, t)
    );
  }
  async subscribeTransaction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const i = this.api;
    this.clearSubscription("transaction");
    const t = this.transactionSubscriptionScope, s = this.selectedDeviceId, n = this.transaction.transaction_id, r = this.transaction.source_sha256;
    await this.ownSubscription(
      i.subscribeConfigTransaction(
        s,
        n,
        r,
        (a) => {
          this.owns(e, i) && t === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === n && this.transaction.source_sha256 === r && a.transaction_id === n && a.source_sha256 === r && (this.transaction = a, this.requestUpdate());
        }
      ),
      e,
      i,
      () => t === this.transactionSubscriptionScope && this.selectedDeviceId === s && this.transaction?.transaction_id === n && this.transaction.source_sha256 === r,
      (a) => {
        this.transactionUnsub = a;
      }
    );
  }
  async continueFromCt() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || this.pendingAction) return;
    const e = X(this.inventory, this.drafts);
    if (this.labelOnly && e.length) {
      const i = e.map(({ channel: a, name: c }) => ({ channel: a, name: c })), t = this.api, s = this.selectedDeviceId, n = this.inventory, r = ++this.operationGeneration;
      if (this.pendingAction = "session", this.requestUpdate(), await this.run(async () => {
        await t.setHaLabels(s, n.plan_id, n.source_sha256, i), this.ownsOperation(r, t, s) && (this.inventory = { ...n, channels: n.channels.map((a) => {
          const c = i.find((l) => l.channel === a.channel);
          return c ? { ...a, name: c.name } : a;
        }) }, this.announcement = "Home Assistant labels saved.");
      }, "Home Assistant labels could not be saved.", () => this.ownsOperation(r, t, s)), this.pendingAction = "", this.error) return;
    }
    await this.startSession();
  }
  async reviewCalibrationHandoff() {
    if (!this.api || !this.session || !this.restartResult?.source_handoff_available) return;
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = this.restartResult.verification_id, n = ++this.operationGeneration;
    this.clearSubscription("transaction"), this.transaction = null, await this.run(
      async () => {
        const r = this.inventory && !this.labelOnly ? X(this.inventory, this.drafts) : [], a = await e.previewCalibratedGains(t, s, r);
        !this.ownsOperation(n, e, i) || this.session?.session_id !== t || this.restartResult?.verification_id !== s || (this.calibrationHandoff = !0, this.transaction = a, this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration));
      },
      "Calibration gains could not be prepared for YAML review.",
      () => this.ownsOperation(n, e, i)
    );
  }
  async clearCalibrationHandoff() {
    const e = this.restartResult;
    if (!this.api || !this.session || !this.topology || !e?.source_handoff_firmware_installed || !e.source_handoff_transaction_id) return;
    const i = this.api, t = this.selectedDeviceId, s = this.session.session_id, n = ++this.operationGeneration;
    await this.run(
      async () => {
        const r = await i.clearCalibrationFlash(
          s,
          e.verification_id,
          e.source_handoff_transaction_id,
          this.topology
        );
        !this.ownsOperation(n, i, t) || this.session?.session_id !== s || (this.restartResult = r, this.announcement = "Calibration saved to YAML; flash values cleared.", this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash."));
      },
      "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values.",
      () => this.ownsOperation(n, i, t)
    );
  }
  async transactionAction(e) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const i = this.api, t = this.selectedDeviceId, s = this.transaction, n = ++this.operationGeneration;
    await this.run(
      async () => {
        const r = [t, s.transaction_id, s.source_sha256];
        let a;
        try {
          a = e === "apply" ? await i.applyCtConfig(...r) : e === "compile" ? await i.compileCtConfig(...r) : e === "install" ? await i.installCtConfig(...r) : await i.rollbackCtConfig(...r);
        } catch (c) {
          if (c.code !== "stale_confirmation") throw c;
          await this.recoverCtInventory(i, t, n, this.drafts);
          return;
        }
        if (!(!this.ownsOperation(n, i, t) || this.transaction?.transaction_id !== s.transaction_id || this.transaction.source_sha256 !== s.source_sha256))
          if (this.transaction = a, this.announcement = `Configuration ${this.transaction.state}.`, e === "install" && this.calibrationHandoff && a.state === "verified" && this.session && this.topology && this.restartResult) {
            this.restartResult = {
              ...this.restartResult,
              source_handoff_available: !1,
              source_handoff_transaction_id: a.transaction_id,
              source_handoff_firmware_installed: !0
            }, this.navigate("summary");
            const c = await i.clearCalibrationFlash(
              this.session.session_id,
              this.restartResult.verification_id,
              a.transaction_id,
              this.topology
            );
            if (!this.ownsOperation(n, i, t)) return;
            this.restartResult = c, this.finishFlow("Calibration was saved to YAML, installed, verified, and cleared from flash.");
          } else e === "install" && a.state === "verified" && this.finishFlow("Configuration changes were installed and verified.");
      },
      e === "install" && this.calibrationHandoff ? "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values." : "This confirmation is stale. Reload the CT inventory before making another change.",
      () => this.ownsOperation(n, i, t)
    );
  }
  async startSession() {
    if (!(!this.api || !this.selectedDeviceId || this.sessionStarting || this.pendingAction)) {
      this.sessionStarting = !0, this.pendingAction = "session", this.requestUpdate();
      try {
        const e = this.api, i = this.selectedDeviceId, t = ++this.operationGeneration;
        this.clearSubscription("session"), this.session = null, this.resetCalibrationRun(), await this.run(async () => {
          if (!this.topology) throw new Error("Topology is required before calibration");
          const s = await e.getActiveWork(i, this.topology);
          if (!this.ownsOperation(t, e, i)) return;
          if (this.session = s.session?.state === "cancelled" ? null : s.session, this.transaction = s.transaction, this.safetyAcknowledged = this.session?.safety_acknowledged ?? !1, this.calibrationHandoff = !!(this.transaction && s.verified_calibration && s.verified_calibration.source_handoff_transaction_id === this.transaction.transaction_id), this.restartResult = this.calibrationHandoff || this.session?.state === "verified" ? s.verified_calibration : null, this.transaction) {
            this.navigate("build"), await this.subscribeTransaction(this.connectionGeneration), this.session && await this.subscribeSession(this.connectionGeneration);
            return;
          }
          if (this.session) {
            this.navigate(this.session.state === "safety_required" || this.session.state === "preflight_failed" ? "safety" : this.session.state === "applied_pending_restart_verification" ? "restart" : this.session.state === "verified" && this.restartResult ? "summary" : ["completed", "skipped"].includes(this.session.offset_disposition ?? "") ? "voltage" : "offset"), await this.subscribeSession(this.connectionGeneration);
            return;
          }
          const n = await e.startSession(i);
          !this.ownsOperation(t, e, i) || n.device_id !== i || (this.session = n, this.navigate("safety"), await this.subscribeSession(this.connectionGeneration));
        }, "Calibration session could not be started.", () => this.ownsOperation(t, e, i));
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
    const i = this.api;
    this.clearSubscription("session");
    const t = this.sessionSubscriptionScope, s = this.session.session_id, n = this.session.device_id;
    await this.ownSubscription(
      i.subscribeSession(s, (r) => {
        this.owns(e, i) && t === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === n && r.session_id === s && r.device_id === n && (this.session = r, this.requestUpdate());
      }),
      e,
      i,
      () => t === this.sessionSubscriptionScope && this.session?.session_id === s && this.session.device_id === n,
      (r) => {
        this.sessionUnsub = r;
      }
    );
  }
  async acknowledgeSafety() {
    if (!this.api || !this.session || this.pendingAction) return;
    this.pendingAction = "safety", this.requestUpdate();
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = ++this.operationGeneration;
    await this.run(async () => {
      const n = await e.acknowledgeSafety(t);
      !this.ownsOperation(s, e, i) || n.session_id !== t || (this.session = n, this.navigate("offset"));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(s, e, i)), this.pendingAction = "", this.requestUpdate();
  }
  offsetKey(e = this.board, i = this.offsetStage) {
    return `${e}:${i}`;
  }
  async checkOffsetReadiness() {
    if (!this.api || !this.session || this.offsetBusy || !this.offsetAcknowledged[this.offsetStage - 1]) return;
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = this.board, n = this.offsetStage, r = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const a = await e.checkOffsetReadiness(t, s, n);
          !this.ownsOperation(r, e, i) || this.session?.session_id !== t || (this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget).set(this.offsetKey(s, n), a), this.announcement = a.ready ? `Board ${s + 1} Stage ${n} measured readiness passed.` : `Board ${s + 1} Stage ${n} measured readiness did not pass.`);
        },
        "Measured offset readiness could not be collected. Reconnect and inspect the meter.",
        () => this.ownsOperation(r, e, i)
      );
    } finally {
      this.offsetBusy = !1, this.requestUpdate();
    }
  }
  async calibrateOffset() {
    if (!this.api || !this.session || this.offsetBusy) return;
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = this.board, n = this.offsetStage, r = this.offsetKey(s, n), a = this.offsetResultByTarget.get(r), c = this.session.offset_boards?.[s]?.stages[n - 1]?.state, l = !!a?.retry_allowed || c === "partial" || c === "indeterminate";
    if (this.offsetAcknowledged[n - 1] !== !0 || l && !this.offsetRetryConfirmed) return;
    const u = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(
        async () => {
          const d = await e.calibrateOffset(t, s, n, !0, l);
          if (!this.ownsOperation(u, e, i) || this.session?.session_id !== t) return;
          this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(r, d);
          const p = (this.session.offset_boards ?? []).map((v) => v.board_index !== s ? v : {
            ...v,
            stages: v.stages.map((_) => _.stage !== n ? _ : {
              ..._,
              state: d.state === "applied_pending_restart_verification" ? "completed" : d.state
            })
          }), g = p.flatMap((v) => v.stages.map((_) => _.state)), f = g.every((v) => v === "completed") ? "completed" : g.some((v) => v === "partial" || v === "indeterminate") ? "partial" : "in_progress";
          this.session = {
            ...this.session,
            offset_boards: p,
            offset_disposition: f,
            has_pending_calibration: this.session.has_pending_calibration || d.expected_tables.length > 0
          }, this.offsetAcknowledged = this.offsetAcknowledged.map((v, _) => _ === n - 1 ? !1 : v), this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget), this.offsetReadinessByTarget.delete(r), this.offsetRetryConfirmed = !1, this.announcement = d.state === "applied_pending_restart_verification" ? `Board ${s + 1} Stage ${n} saved; restart verification required.` : `Board ${s + 1} Stage ${n} requires recovery before retry.`;
        },
        "Offset calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(u, e, i)
      );
    } finally {
      this.offsetBusy = !1, this.requestUpdate();
    }
  }
  async skipOffset() {
    if (!this.api || !this.session || this.offsetBusy) return;
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = ++this.operationGeneration;
    this.offsetBusy = !0, this.requestUpdate();
    try {
      await this.run(async () => {
        const n = await e.skipOffsetCalibration(t);
        !this.ownsOperation(s, e, i) || this.session?.session_id !== t || (this.session = n, this.announcement = "Offset calibration skipped; existing flash values were preserved.");
      }, "Offset calibration could not be skipped.", () => this.ownsOperation(s, e, i));
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
    if (this.inventory && !this.labelOnly && X(this.inventory, this.drafts).length) {
      await this.finishWithoutCalibration();
      return;
    }
    if (!this.api) return;
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = ++this.operationGeneration;
    this.finishBusy = !0, this.requestUpdate();
    try {
      await this.run(async () => {
        const n = await e.completeCalibrationWithoutChanges(t);
        if (!(!this.ownsOperation(s, e, i) || this.session?.session_id !== t)) {
          if (n.session_id !== t || n.state !== "verified" || n.has_pending_calibration !== !1)
            throw new Error("No-change completion response is not authoritative");
          this.session = n, this.completedWithoutChanges = !0, this.navigate("summary"), this.announcement = "Completed without calibration changes; no restart was required.";
        }
      }, "Calibration completion could not be confirmed.", () => this.ownsOperation(s, e, i));
    } finally {
      this.finishBusy = !1, this.requestUpdate();
    }
  }
  async checkStability(e) {
    if (!this.api || !this.session || e === "voltage" && this.voltageBusy) return;
    const i = this.api, t = this.selectedDeviceId, s = this.session.session_id, n = ++this.operationGeneration, r = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((a) => String(a.channel));
    if (r.length) {
      e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
      try {
        await this.run(async () => {
          if (e === "voltage") {
            const a = await i.checkVoltageStability(s, r);
            if (!this.ownsOperation(n, i, t) || this.session?.session_id !== s) return;
            const c = new Map(this.stabilityByTarget);
            a.forEach((l) => c.set(`voltage:${l.target_id}`, l)), this.stabilityByTarget = c, this.announcement = "Loaded voltage data from both chips on this board.";
            return;
          }
          for (const [a, c] of r.entries()) {
            const l = await i.checkStability(s, e, c);
            if (!this.ownsOperation(n, i, t) || this.session?.session_id !== s) return;
            this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${e}:${c}`, l), a < r.length - 1 && this.requestUpdate();
          }
        }, "Stable samples could not be collected.", () => this.ownsOperation(n, i, t));
      } finally {
        e === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
      }
    }
  }
  async calibrate(e) {
    if (!this.api || !this.session || e === "voltage" && this.voltageBusy) return;
    const i = this.api, t = this.selectedDeviceId, s = this.session.session_id, n = ++this.operationGeneration, r = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((c) => String(c.channel)), a = this.currentReferenceEntries();
    if (e === "current" && !a.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      return;
    }
    e === "voltage" && (this.voltageBusy = !0, this.requestUpdate());
    try {
      await this.run(
        async () => {
          if (e === "voltage") {
            const u = await i.calibrateVoltage(s, r.map((p, g) => ({
              group_key: p,
              reference: this.voltageReferences[this.topology?.voltage_layout === "two_voltages" ? g : 0]
            })), !0);
            if (!this.ownsOperation(n, i, t) || this.session?.session_id !== s) return;
            const d = new Map(this.calibrationByTarget);
            u.forEach((p) => d.set(`voltage:${p.group_key}`, p)), this.calibrationByTarget = d, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = "Calibrated both voltage chips on this board.";
            return;
          }
          const c = await i.calibrateCurrent(
            s,
            a,
            !0,
            this.inventory && !this.labelOnly ? X(this.inventory, this.drafts).map((u) => ({
              channel: u.channel,
              reporting_multiplier: u.reporting_multiplier ?? 1
            })) : []
          );
          if (!this.ownsOperation(n, i, t) || this.session?.session_id !== s) return;
          const l = new Map(this.calibrationByTarget);
          a.forEach((u) => l.set(`current:${u.channel}`, c)), this.calibrationByTarget = l, this.session = { ...this.session, has_pending_calibration: !0 }, this.announcement = `Calibration iteration ${c.iteration} finished with state ${c.state}.`;
        },
        "Calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(n, i, t)
      );
    } finally {
      e === "voltage" && (this.voltageBusy = !1, this.requestUpdate());
    }
  }
  groupKey(e) {
    const i = Math.floor(e / 2), t = e % 2 + 1;
    return i === 0 ? `main_${t}` : `addon${i}_${t}`;
  }
  voltageGroupKeys() {
    return this.topology ? [this.groupKey(this.board * 2), this.groupKey(this.board * 2 + 1)] : [this.groupKey(this.group)];
  }
  currentReferenceEntries() {
    const e = Math.floor((this.channel - 1) / 3) * 3 + 1;
    return Array.from({ length: 3 }, (i, t) => e + t).flatMap((i) => {
      const t = this.currentReferences.get(i), s = this.drafts.get(i)?.multiplier ?? this.inventory?.channels[i - 1]?.reporting_multiplier ?? this.reportingMultiplier;
      return t && t > 0 && s !== null ? [{ channel: i, reference: t, reporting_multiplier: s }] : [];
    });
  }
  async restart() {
    if (!this.api || !this.session || !this.topology) return;
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = this.topology, n = ++this.operationGeneration;
    this.restartResult = null, await this.run(
      async () => {
        let a;
        try {
          a = await e.restartAndVerify(t, s);
        } catch (c) {
          throw this.ownsOperation(n, e, i) && this.session?.session_id === t && this.topology === s && (this.restartResult = null, this.session = { ...this.session, state: "restart_failed" }), c;
        }
        !this.ownsOperation(n, e, i) || this.session?.session_id !== t || this.topology !== s || (this.restartResult = a, this.completedWithoutChanges = !1, this.session = { ...this.session, state: "verified" });
      },
      "Restart verification failed; review recovery evidence before rollback.",
      () => this.ownsOperation(n, e, i)
    ), this.restartResult?.source_handoff_available && await this.reviewCalibrationHandoff();
  }
  async cancelSession(e = "safety") {
    if (!this.api || !this.session) return;
    const i = this.api, t = this.selectedDeviceId, s = this.session.session_id, n = ++this.operationGeneration;
    await this.run(async () => {
      const r = await i.cancelSession(s);
      !this.ownsOperation(n, i, t) || this.session?.session_id !== s || (this.clearSubscription("session"), this.session = r, this.restartResult = null, e && this.navigate(e), this.announcement = e === "setup" ? "No changes were made. Select another device to configure." : e === "ct" ? "Calibration session closed. Review CT names and types before continuing." : "Calibration session cancelled; cleanup completed without restart verification.");
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(n, i, t));
  }
  async finishWithoutCalibration() {
    if (this.pendingAction) return;
    this.pendingAction = "finish", this.requestUpdate();
    const e = this.inventory && !this.labelOnly ? X(this.inventory, this.drafts) : [];
    try {
      if (await this.cancelSession(null), this.error) return;
      e.length ? await this.reviewChanges() : this.finishFlow("No changes were made. Select another device to configure.");
    } finally {
      this.pendingAction = "", this.requestUpdate();
    }
  }
  async reconnectSession() {
    if (!this.api || !this.session) return;
    const e = this.api, i = this.selectedDeviceId, t = this.session.session_id, s = ++this.operationGeneration;
    await this.run(
      async () => {
        const n = await e.getSession(t);
        !this.ownsOperation(s, e, i) || this.session?.session_id !== t || (this.session = n, this.announcement = `Session reconnected with state ${this.session.state}.`);
      },
      "Session reconnection failed. Retry only after checking the meter connection.",
      () => this.ownsOperation(s, e, i)
    );
  }
  resultFor(e) {
    const i = this.currentReferenceEntries().map((n) => String(n.channel)), t = Math.floor((this.channel - 1) / 3) * 3 + 1, s = e === "voltage" ? this.voltageGroupKeys() : i.length ? i : Array.from({ length: 3 }, (n, r) => String(t + r));
    for (const n of [...s].reverse()) {
      const r = this.calibrationByTarget.get(`${e}:${n}`);
      if (r) return r;
    }
    return null;
  }
  stabilityFor(e) {
    const i = e === "voltage" ? this.voltageGroupKeys() : this.currentReferenceEntries().map((s) => String(s.channel)), t = i.flatMap((s) => {
      const n = this.stabilityByTarget.get(`${e}:${s}`);
      return n ? [n] : [];
    });
    return t.length ? {
      target: e,
      target_id: e === "voltage" ? `Board ${this.board + 1}` : `Current group ${Math.floor((this.channel - 1) / 3) + 1}`,
      stable: t.length === i.length && t.every((s) => s.stable),
      windows: t.flatMap((s) => s.windows)
    } : null;
  }
  async run(e, i, t = () => !0) {
    this.error = "";
    try {
      await e();
    } catch (s) {
      if (!t()) return;
      const n = s.code;
      this.fail(s, n === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : i);
    }
    t() && this.requestUpdate();
  }
  fail(e, i) {
    this.error = i, this.announcement = i, this.requestUpdate();
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
      },
      (e) => {
        this.configureDevice(e);
      },
      (e) => {
        this.adopt(e);
      },
      this.pendingAction
    ) : this.step === "topology" && this.topology ? Ui(
      this.topology,
      this.selectedProjectVersion(),
      () => this.back(),
      () => {
        this.setup?.devices.find((e) => e.entry_id === this.selectedDeviceId)?.configuration ? this.loadInventory() : this.startSession();
      },
      this.error === "Topology mismatch",
      this.pendingAction === "inventory" || this.pendingAction === "session"
    ) : this.step === "ct" && this.inventory ? h`<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
      this.labelOnly = !1, this.requestUpdate();
    }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
      this.labelOnly = !0, this.requestUpdate();
    }}>Home Assistant labels only</label></fieldset>${$i(
      this.inventory,
      this.board,
      this.drafts,
      (e) => {
        this.board = e, this.requestUpdate();
      },
      (e, i) => this.updateDraft(e, i),
      () => this.back(),
      () => {
        this.continueFromCt();
      },
      this.labelOnly,
      this.pendingAction === "session"
    )}` : this.step === "build" ? wi(
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
    ) : this.step === "safety" ? Ti(
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
    ) : this.step === "offset" ? xi(
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
        (e === 1 || this.session?.offset_boards?.every((i) => i.stages[0]?.state === "completed")) && (this.offsetStage = e, this.board = 0, this.offsetRetryConfirmed = !1, this.requestUpdate());
      },
      (e) => {
        this.offsetAcknowledged = this.offsetAcknowledged.map((i, t) => t === this.offsetStage - 1 ? e : i), this.requestUpdate();
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
    ) : this.step === "voltage" ? h`${Bi(
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
      (e, i) => {
        this.voltageReferences = this.voltageReferences.map((t, s) => s === e ? i : t), this.requestUpdate();
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
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button><button class="primary" ?disabled=${this.voltageBusy} @click=${() => this.navigate("current")}>${this.resultFor("voltage") ? "Continue" : "Skip voltage calibration"}</button></footer>` : this.step === "current" ? h`${Ci(
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
      (e, i) => {
        const t = new Map(this.currentReferences);
        i === null || !Number.isFinite(i) || i <= 0 ? t.delete(e) : t.set(e, i), this.currentReferences = t, this.requestUpdate();
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
    }}>${this.finishBusy ? "Finishing…" : this.session?.has_pending_calibration ? "Continue to Restart" : "Finish without calibration"}</button></footer>` : this.step === "restart" ? Ei(
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
    ) : this.step === "summary" ? Mi(
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
    ) : h`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct" ? "CT settings are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }
  render() {
    const e = ne.findIndex(([i]) => i === this.step);
    return h`
      <div class="app">
        <aside class=${this.mobileStepsOpen ? "workflow mobile-open" : "workflow"}>
          <div class="brand">CircuitSetup</div>
          <nav aria-label="Setup progress"><ol>${ne.map(([i, t], s) => h`
            <li class=${s === e ? "current" : ""}>
              <button class="step-button" aria-current=${s === e ? "step" : S}
                ?disabled=${s > e || s < e && i !== "setup"}
                @click=${() => i === "setup" && s < e ? this.returnToSetup() : void 0}><span class="number">${s + 1}</span><span>${t}</span></button>
            </li>
          `)}</ol></nav>
        </aside>
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <div class="mobile-progress"><span>${e + 1} of ${ne.length} — ${ne[e]?.[1]}</span><button aria-label="Show setup steps" aria-expanded=${this.mobileStepsOpen} @click=${() => {
      this.mobileStepsOpen = !this.mobileStepsOpen, this.requestUpdate();
    }}>Steps</button></div>
          <h1 id="step-heading" tabindex="-1">${ne[e]?.[1]}</h1>
          ${this.error ? h`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : S}
          ${this.stepBody()}
          ${e >= 4 && this.step !== "summary" ? yt(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : S}
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
