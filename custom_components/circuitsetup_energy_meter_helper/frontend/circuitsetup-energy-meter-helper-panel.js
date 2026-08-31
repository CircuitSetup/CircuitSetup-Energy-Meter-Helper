const t$2 = globalThis, e$3 = t$2.ShadowRoot && (void 0 === t$2.ShadyCSS || t$2.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, s$4 = /* @__PURE__ */ Symbol(), o$4 = /* @__PURE__ */ new WeakMap();
let n$5 = class n {
  constructor(t2, e2, o2) {
    if (this._$cssResult$ = true, o2 !== s$4) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t2, this.t = e2;
  }
  get styleSheet() {
    let t2 = this.o;
    const s2 = this.t;
    if (e$3 && void 0 === t2) {
      const e2 = void 0 !== s2 && 1 === s2.length;
      e2 && (t2 = o$4.get(s2)), void 0 === t2 && ((this.o = t2 = new CSSStyleSheet()).replaceSync(this.cssText), e2 && o$4.set(s2, t2));
    }
    return t2;
  }
  toString() {
    return this.cssText;
  }
};
const r$4 = (t2) => new n$5("string" == typeof t2 ? t2 : t2 + "", void 0, s$4), i$5 = (t2, ...e2) => {
  const o2 = 1 === t2.length ? t2[0] : e2.reduce((e3, s2, o3) => e3 + ((t3) => {
    if (true === t3._$cssResult$) return t3.cssText;
    if ("number" == typeof t3) return t3;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t3 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s2) + t2[o3 + 1], t2[0]);
  return new n$5(o2, t2, s$4);
}, S$1 = (s2, o2) => {
  if (e$3) s2.adoptedStyleSheets = o2.map((t2) => t2 instanceof CSSStyleSheet ? t2 : t2.styleSheet);
  else for (const e2 of o2) {
    const o3 = document.createElement("style"), n3 = t$2.litNonce;
    void 0 !== n3 && o3.setAttribute("nonce", n3), o3.textContent = e2.cssText, s2.appendChild(o3);
  }
}, c$4 = e$3 ? (t2) => t2 : (t2) => t2 instanceof CSSStyleSheet ? ((t3) => {
  let e2 = "";
  for (const s2 of t3.cssRules) e2 += s2.cssText;
  return r$4(e2);
})(t2) : t2;
const { is: i$4, defineProperty: e$2, getOwnPropertyDescriptor: h$3, getOwnPropertyNames: r$3, getOwnPropertySymbols: o$3, getPrototypeOf: n$4 } = Object, a$1 = globalThis, c$3 = a$1.trustedTypes, l$1 = c$3 ? c$3.emptyScript : "", p$1 = a$1.reactiveElementPolyfillSupport, d$1 = (t2, s2) => t2, u$1 = { toAttribute(t2, s2) {
  switch (s2) {
    case Boolean:
      t2 = t2 ? l$1 : null;
      break;
    case Object:
    case Array:
      t2 = null == t2 ? t2 : JSON.stringify(t2);
  }
  return t2;
}, fromAttribute(t2, s2) {
  let i4 = t2;
  switch (s2) {
    case Boolean:
      i4 = null !== t2;
      break;
    case Number:
      i4 = null === t2 ? null : Number(t2);
      break;
    case Object:
    case Array:
      try {
        i4 = JSON.parse(t2);
      } catch (t3) {
        i4 = null;
      }
  }
  return i4;
} }, f$2 = (t2, s2) => !i$4(t2, s2), b$1 = { attribute: true, type: String, converter: u$1, reflect: false, useDefault: false, hasChanged: f$2 };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), a$1.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let y$1 = class y extends HTMLElement {
  static addInitializer(t2) {
    this._$Ei(), (this.l ??= []).push(t2);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t2, s2 = b$1) {
    if (s2.state && (s2.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t2) && ((s2 = Object.create(s2)).wrapped = true), this.elementProperties.set(t2, s2), !s2.noAccessor) {
      const i4 = /* @__PURE__ */ Symbol(), h2 = this.getPropertyDescriptor(t2, i4, s2);
      void 0 !== h2 && e$2(this.prototype, t2, h2);
    }
  }
  static getPropertyDescriptor(t2, s2, i4) {
    const { get: e2, set: r2 } = h$3(this.prototype, t2) ?? { get() {
      return this[s2];
    }, set(t3) {
      this[s2] = t3;
    } };
    return { get: e2, set(s3) {
      const h2 = e2?.call(this);
      r2?.call(this, s3), this.requestUpdate(t2, h2, i4);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t2) {
    return this.elementProperties.get(t2) ?? b$1;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d$1("elementProperties"))) return;
    const t2 = n$4(this);
    t2.finalize(), void 0 !== t2.l && (this.l = [...t2.l]), this.elementProperties = new Map(t2.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d$1("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d$1("properties"))) {
      const t3 = this.properties, s2 = [...r$3(t3), ...o$3(t3)];
      for (const i4 of s2) this.createProperty(i4, t3[i4]);
    }
    const t2 = this[Symbol.metadata];
    if (null !== t2) {
      const s2 = litPropertyMetadata.get(t2);
      if (void 0 !== s2) for (const [t3, i4] of s2) this.elementProperties.set(t3, i4);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t3, s2] of this.elementProperties) {
      const i4 = this._$Eu(t3, s2);
      void 0 !== i4 && this._$Eh.set(i4, t3);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s2) {
    const i4 = [];
    if (Array.isArray(s2)) {
      const e2 = new Set(s2.flat(1 / 0).reverse());
      for (const s3 of e2) i4.unshift(c$4(s3));
    } else void 0 !== s2 && i4.push(c$4(s2));
    return i4;
  }
  static _$Eu(t2, s2) {
    const i4 = s2.attribute;
    return false === i4 ? void 0 : "string" == typeof i4 ? i4 : "string" == typeof t2 ? t2.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t2) => this.enableUpdating = t2), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t2) => t2(this));
  }
  addController(t2) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t2), void 0 !== this.renderRoot && this.isConnected && t2.hostConnected?.();
  }
  removeController(t2) {
    this._$EO?.delete(t2);
  }
  _$E_() {
    const t2 = /* @__PURE__ */ new Map(), s2 = this.constructor.elementProperties;
    for (const i4 of s2.keys()) this.hasOwnProperty(i4) && (t2.set(i4, this[i4]), delete this[i4]);
    t2.size > 0 && (this._$Ep = t2);
  }
  createRenderRoot() {
    const t2 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S$1(t2, this.constructor.elementStyles), t2;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t2) => t2.hostConnected?.());
  }
  enableUpdating(t2) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t2) => t2.hostDisconnected?.());
  }
  attributeChangedCallback(t2, s2, i4) {
    this._$AK(t2, i4);
  }
  _$ET(t2, s2) {
    const i4 = this.constructor.elementProperties.get(t2), e2 = this.constructor._$Eu(t2, i4);
    if (void 0 !== e2 && true === i4.reflect) {
      const h2 = (void 0 !== i4.converter?.toAttribute ? i4.converter : u$1).toAttribute(s2, i4.type);
      this._$Em = t2, null == h2 ? this.removeAttribute(e2) : this.setAttribute(e2, h2), this._$Em = null;
    }
  }
  _$AK(t2, s2) {
    const i4 = this.constructor, e2 = i4._$Eh.get(t2);
    if (void 0 !== e2 && this._$Em !== e2) {
      const t3 = i4.getPropertyOptions(e2), h2 = "function" == typeof t3.converter ? { fromAttribute: t3.converter } : void 0 !== t3.converter?.fromAttribute ? t3.converter : u$1;
      this._$Em = e2;
      const r2 = h2.fromAttribute(s2, t3.type);
      this[e2] = r2 ?? this._$Ej?.get(e2) ?? r2, this._$Em = null;
    }
  }
  requestUpdate(t2, s2, i4, e2 = false, h2) {
    if (void 0 !== t2) {
      const r2 = this.constructor;
      if (false === e2 && (h2 = this[t2]), i4 ??= r2.getPropertyOptions(t2), !((i4.hasChanged ?? f$2)(h2, s2) || i4.useDefault && i4.reflect && h2 === this._$Ej?.get(t2) && !this.hasAttribute(r2._$Eu(t2, i4)))) return;
      this.C(t2, s2, i4);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t2, s2, { useDefault: i4, reflect: e2, wrapped: h2 }, r2) {
    i4 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t2) && (this._$Ej.set(t2, r2 ?? s2 ?? this[t2]), true !== h2 || void 0 !== r2) || (this._$AL.has(t2) || (this.hasUpdated || i4 || (s2 = void 0), this._$AL.set(t2, s2)), true === e2 && this._$Em !== t2 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t2));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t3) {
      Promise.reject(t3);
    }
    const t2 = this.scheduleUpdate();
    return null != t2 && await t2, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t4, s3] of this._$Ep) this[t4] = s3;
        this._$Ep = void 0;
      }
      const t3 = this.constructor.elementProperties;
      if (t3.size > 0) for (const [s3, i4] of t3) {
        const { wrapped: t4 } = i4, e2 = this[s3];
        true !== t4 || this._$AL.has(s3) || void 0 === e2 || this.C(s3, void 0, i4, e2);
      }
    }
    let t2 = false;
    const s2 = this._$AL;
    try {
      t2 = this.shouldUpdate(s2), t2 ? (this.willUpdate(s2), this._$EO?.forEach((t3) => t3.hostUpdate?.()), this.update(s2)) : this._$EM();
    } catch (s3) {
      throw t2 = false, this._$EM(), s3;
    }
    t2 && this._$AE(s2);
  }
  willUpdate(t2) {
  }
  _$AE(t2) {
    this._$EO?.forEach((t3) => t3.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t2)), this.updated(t2);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t2) {
    return true;
  }
  update(t2) {
    this._$Eq &&= this._$Eq.forEach((t3) => this._$ET(t3, this[t3])), this._$EM();
  }
  updated(t2) {
  }
  firstUpdated(t2) {
  }
};
y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$1("elementProperties")] = /* @__PURE__ */ new Map(), y$1[d$1("finalized")] = /* @__PURE__ */ new Map(), p$1?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.2");
const t$1 = globalThis, i$3 = (t2) => t2, s$3 = t$1.trustedTypes, e$1 = s$3 ? s$3.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0, h$2 = "$lit$", o$2 = `lit$${Math.random().toFixed(9).slice(2)}$`, n$3 = "?" + o$2, r$2 = `<${n$3}>`, l = document, c$2 = () => l.createComment(""), a = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2, u = Array.isArray, d = (t2) => u(t2) || "function" == typeof t2?.[Symbol.iterator], f$1 = "[ 	\n\f\r]", v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _ = /-->/g, m$1 = />/g, p = RegExp(`>|${f$1}(?:([^\\s"'>=/]+)(${f$1}*=${f$1}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), g = /'/g, $ = /"/g, y2 = /^(?:script|style|textarea|title)$/i, x = (t2) => (i4, ...s2) => ({ _$litType$: t2, strings: i4, values: s2 }), b = x(1), E = /* @__PURE__ */ Symbol.for("lit-noChange"), A = /* @__PURE__ */ Symbol.for("lit-nothing"), C = /* @__PURE__ */ new WeakMap(), P = l.createTreeWalker(l, 129);
function V(t2, i4) {
  if (!u(t2) || !t2.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e$1 ? e$1.createHTML(i4) : i4;
}
const N = (t2, i4) => {
  const s2 = t2.length - 1, e2 = [];
  let n3, l2 = 2 === i4 ? "<svg>" : 3 === i4 ? "<math>" : "", c2 = v;
  for (let i5 = 0; i5 < s2; i5++) {
    const s3 = t2[i5];
    let a2, u2, d2 = -1, f2 = 0;
    for (; f2 < s3.length && (c2.lastIndex = f2, u2 = c2.exec(s3), null !== u2); ) f2 = c2.lastIndex, c2 === v ? "!--" === u2[1] ? c2 = _ : void 0 !== u2[1] ? c2 = m$1 : void 0 !== u2[2] ? (y2.test(u2[2]) && (n3 = RegExp("</" + u2[2], "g")), c2 = p) : void 0 !== u2[3] && (c2 = p) : c2 === p ? ">" === u2[0] ? (c2 = n3 ?? v, d2 = -1) : void 0 === u2[1] ? d2 = -2 : (d2 = c2.lastIndex - u2[2].length, a2 = u2[1], c2 = void 0 === u2[3] ? p : '"' === u2[3] ? $ : g) : c2 === $ || c2 === g ? c2 = p : c2 === _ || c2 === m$1 ? c2 = v : (c2 = p, n3 = void 0);
    const x2 = c2 === p && t2[i5 + 1].startsWith("/>") ? " " : "";
    l2 += c2 === v ? s3 + r$2 : d2 >= 0 ? (e2.push(a2), s3.slice(0, d2) + h$2 + s3.slice(d2) + o$2 + x2) : s3 + o$2 + (-2 === d2 ? i5 : x2);
  }
  return [V(t2, l2 + (t2[s2] || "<?>") + (2 === i4 ? "</svg>" : 3 === i4 ? "</math>" : "")), e2];
};
class S {
  constructor({ strings: t2, _$litType$: i4 }, e2) {
    let r2;
    this.parts = [];
    let l2 = 0, a2 = 0;
    const u2 = t2.length - 1, d2 = this.parts, [f2, v2] = N(t2, i4);
    if (this.el = S.createElement(f2, e2), P.currentNode = this.el.content, 2 === i4 || 3 === i4) {
      const t3 = this.el.content.firstChild;
      t3.replaceWith(...t3.childNodes);
    }
    for (; null !== (r2 = P.nextNode()) && d2.length < u2; ) {
      if (1 === r2.nodeType) {
        if (r2.hasAttributes()) for (const t3 of r2.getAttributeNames()) if (t3.endsWith(h$2)) {
          const i5 = v2[a2++], s2 = r2.getAttribute(t3).split(o$2), e3 = /([.?@])?(.*)/.exec(i5);
          d2.push({ type: 1, index: l2, name: e3[2], strings: s2, ctor: "." === e3[1] ? I : "?" === e3[1] ? L : "@" === e3[1] ? z : H }), r2.removeAttribute(t3);
        } else t3.startsWith(o$2) && (d2.push({ type: 6, index: l2 }), r2.removeAttribute(t3));
        if (y2.test(r2.tagName)) {
          const t3 = r2.textContent.split(o$2), i5 = t3.length - 1;
          if (i5 > 0) {
            r2.textContent = s$3 ? s$3.emptyScript : "";
            for (let s2 = 0; s2 < i5; s2++) r2.append(t3[s2], c$2()), P.nextNode(), d2.push({ type: 2, index: ++l2 });
            r2.append(t3[i5], c$2());
          }
        }
      } else if (8 === r2.nodeType) if (r2.data === n$3) d2.push({ type: 2, index: l2 });
      else {
        let t3 = -1;
        for (; -1 !== (t3 = r2.data.indexOf(o$2, t3 + 1)); ) d2.push({ type: 7, index: l2 }), t3 += o$2.length - 1;
      }
      l2++;
    }
  }
  static createElement(t2, i4) {
    const s2 = l.createElement("template");
    return s2.innerHTML = t2, s2;
  }
}
function M(t2, i4, s2 = t2, e2) {
  if (i4 === E) return i4;
  let h2 = void 0 !== e2 ? s2._$Co?.[e2] : s2._$Cl;
  const o2 = a(i4) ? void 0 : i4._$litDirective$;
  return h2?.constructor !== o2 && (h2?._$AO?.(false), void 0 === o2 ? h2 = void 0 : (h2 = new o2(t2), h2._$AT(t2, s2, e2)), void 0 !== e2 ? (s2._$Co ??= [])[e2] = h2 : s2._$Cl = h2), void 0 !== h2 && (i4 = M(t2, h2._$AS(t2, i4.values), h2, e2)), i4;
}
class R {
  constructor(t2, i4) {
    this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i4;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t2) {
    const { el: { content: i4 }, parts: s2 } = this._$AD, e2 = (t2?.creationScope ?? l).importNode(i4, true);
    P.currentNode = e2;
    let h2 = P.nextNode(), o2 = 0, n3 = 0, r2 = s2[0];
    for (; void 0 !== r2; ) {
      if (o2 === r2.index) {
        let i5;
        2 === r2.type ? i5 = new k(h2, h2.nextSibling, this, t2) : 1 === r2.type ? i5 = new r2.ctor(h2, r2.name, r2.strings, this, t2) : 6 === r2.type && (i5 = new Z(h2, this, t2)), this._$AV.push(i5), r2 = s2[++n3];
      }
      o2 !== r2?.index && (h2 = P.nextNode(), o2++);
    }
    return P.currentNode = l, e2;
  }
  p(t2) {
    let i4 = 0;
    for (const s2 of this._$AV) void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t2, s2, i4), i4 += s2.strings.length - 2) : s2._$AI(t2[i4])), i4++;
  }
}
class k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t2, i4, s2, e2) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t2, this._$AB = i4, this._$AM = s2, this.options = e2, this._$Cv = e2?.isConnected ?? true;
  }
  get parentNode() {
    let t2 = this._$AA.parentNode;
    const i4 = this._$AM;
    return void 0 !== i4 && 11 === t2?.nodeType && (t2 = i4.parentNode), t2;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t2, i4 = this) {
    t2 = M(this, t2, i4), a(t2) ? t2 === A || null == t2 || "" === t2 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t2 !== this._$AH && t2 !== E && this._(t2) : void 0 !== t2._$litType$ ? this.$(t2) : void 0 !== t2.nodeType ? this.T(t2) : d(t2) ? this.k(t2) : this._(t2);
  }
  O(t2) {
    return this._$AA.parentNode.insertBefore(t2, this._$AB);
  }
  T(t2) {
    this._$AH !== t2 && (this._$AR(), this._$AH = this.O(t2));
  }
  _(t2) {
    this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t2 : this.T(l.createTextNode(t2)), this._$AH = t2;
  }
  $(t2) {
    const { values: i4, _$litType$: s2 } = t2, e2 = "number" == typeof s2 ? this._$AC(t2) : (void 0 === s2.el && (s2.el = S.createElement(V(s2.h, s2.h[0]), this.options)), s2);
    if (this._$AH?._$AD === e2) this._$AH.p(i4);
    else {
      const t3 = new R(e2, this), s3 = t3.u(this.options);
      t3.p(i4), this.T(s3), this._$AH = t3;
    }
  }
  _$AC(t2) {
    let i4 = C.get(t2.strings);
    return void 0 === i4 && C.set(t2.strings, i4 = new S(t2)), i4;
  }
  k(t2) {
    u(this._$AH) || (this._$AH = [], this._$AR());
    const i4 = this._$AH;
    let s2, e2 = 0;
    for (const h2 of t2) e2 === i4.length ? i4.push(s2 = new k(this.O(c$2()), this.O(c$2()), this, this.options)) : s2 = i4[e2], s2._$AI(h2), e2++;
    e2 < i4.length && (this._$AR(s2 && s2._$AB.nextSibling, e2), i4.length = e2);
  }
  _$AR(t2 = this._$AA.nextSibling, s2) {
    for (this._$AP?.(false, true, s2); t2 !== this._$AB; ) {
      const s3 = i$3(t2).nextSibling;
      i$3(t2).remove(), t2 = s3;
    }
  }
  setConnected(t2) {
    void 0 === this._$AM && (this._$Cv = t2, this._$AP?.(t2));
  }
}
class H {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t2, i4, s2, e2, h2) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t2, this.name = i4, this._$AM = e2, this.options = h2, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = A;
  }
  _$AI(t2, i4 = this, s2, e2) {
    const h2 = this.strings;
    let o2 = false;
    if (void 0 === h2) t2 = M(this, t2, i4, 0), o2 = !a(t2) || t2 !== this._$AH && t2 !== E, o2 && (this._$AH = t2);
    else {
      const e3 = t2;
      let n3, r2;
      for (t2 = h2[0], n3 = 0; n3 < h2.length - 1; n3++) r2 = M(this, e3[s2 + n3], i4, n3), r2 === E && (r2 = this._$AH[n3]), o2 ||= !a(r2) || r2 !== this._$AH[n3], r2 === A ? t2 = A : t2 !== A && (t2 += (r2 ?? "") + h2[n3 + 1]), this._$AH[n3] = r2;
    }
    o2 && !e2 && this.j(t2);
  }
  j(t2) {
    t2 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t2 ?? "");
  }
}
class I extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t2) {
    this.element[this.name] = t2 === A ? void 0 : t2;
  }
}
class L extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t2) {
    this.element.toggleAttribute(this.name, !!t2 && t2 !== A);
  }
}
class z extends H {
  constructor(t2, i4, s2, e2, h2) {
    super(t2, i4, s2, e2, h2), this.type = 5;
  }
  _$AI(t2, i4 = this) {
    if ((t2 = M(this, t2, i4, 0) ?? A) === E) return;
    const s2 = this._$AH, e2 = t2 === A && s2 !== A || t2.capture !== s2.capture || t2.once !== s2.once || t2.passive !== s2.passive, h2 = t2 !== A && (s2 === A || e2);
    e2 && this.element.removeEventListener(this.name, this, s2), h2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
  }
  handleEvent(t2) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t2) : this._$AH.handleEvent(t2);
  }
}
class Z {
  constructor(t2, i4, s2) {
    this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i4, this.options = s2;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2) {
    M(this, t2);
  }
}
const B = t$1.litHtmlPolyfillSupport;
B?.(S, k), (t$1.litHtmlVersions ??= []).push("3.3.3");
const D = (t2, i4, s2) => {
  const e2 = s2?.renderBefore ?? i4;
  let h2 = e2._$litPart$;
  if (void 0 === h2) {
    const t3 = s2?.renderBefore ?? null;
    e2._$litPart$ = h2 = new k(i4.insertBefore(c$2(), t3), t3, void 0, s2 ?? {});
  }
  return h2._$AI(t2), h2;
};
const s$2 = globalThis;
let i$2 = class i extends y$1 {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t2 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t2.firstChild, t2;
  }
  update(t2) {
    const r2 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t2), this._$Do = D(r2, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i$2._$litElement$ = true, i$2["finalized"] = true, s$2.litElementHydrateSupport?.({ LitElement: i$2 });
const o$1 = s$2.litElementPolyfillSupport;
o$1?.({ LitElement: i$2 });
(s$2.litElementVersions ??= []).push("4.2.2");
const PREFIX = "circuitsetup_energy_meter_helper/";
const PRIVATE_FIELD = /(?:^|_)(?:api_?key|contents?|credentials?|encryption(?:_key)?|logs?|noise_?psk|output_tail|password|prior(?:_content)?|proposed_content|raw(?:_logs?)?|secrets?|ssid|tokens?|yaml)(?:$|_)/i;
const SECRET_VALUE = /(?:api[_ -]?key|password|secret|ssid|token)\s*[:=]/i;
const CONTROL$1 = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/;
const PROPERTY_CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
const SETUP_STATES = /* @__PURE__ */ new Set(["no_device", "installer_guide", "waiting_for_discovery", "device_discovered", "waiting_for_adoption", "reading_config", "topology_review", "ct_configuration", "config_review", "config_writing", "config_validating", "config_compiling", "waiting_for_install_confirmation", "config_installing", "waiting_for_reconnect", "ready_for_calibration", "failed"]);
const TRANSACTION_STATES = /* @__PURE__ */ new Set(["previewed", "write_confirmed", "written", "validated", "compiled", "install_confirmation_required", "installing", "reconnecting", "verified", "rolled_back", "failed"]);
const SESSION_STATES = /* @__PURE__ */ new Set(["safety_required", "preflight_failed", "ready", "stable", "unstable", "applied_pending_restart_verification", "result_outside_tolerance", "partial", "indeterminate", "verified", "cancelled"]);
const CONNECTIONS$1 = /* @__PURE__ */ new Set(["wifi", "ethernet_lilygo", "ethernet_waveshare", "unknown"]);
const ELECTRICAL_SYSTEMS = /* @__PURE__ */ new Set(["split_phase_120_240", "single_phase_230", "three_phase", "custom"]);
const VOLTAGE_LAYOUTS = /* @__PURE__ */ new Set(["standard", "multi_reference", "custom"]);
const CIRCUIT_ROLES = /* @__PURE__ */ new Set(["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"]);
const MEASUREMENT_METHODS = /* @__PURE__ */ new Set(["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"]);
const ENERGY_MODES = /* @__PURE__ */ new Set(["none", "consumption", "bidirectional", "generation"]);
const UPDATE_INTERVALS = /* @__PURE__ */ new Set([1, 2, 5, 10, 30, 60]);
const EVIDENCE_SOURCES = /* @__PURE__ */ new Set(["config_project", "config_packages", "dashboard_import", "native_project", "native_entity_counts"]);
const PHASES = /* @__PURE__ */ new Set(["A", "B", "C"]);
const JOB_STAGES = /* @__PURE__ */ new Set(["connecting", "uploading", "writing", "verifying", "completed", "transfer"]);
const TRANSACTION_EVIDENCE = /* @__PURE__ */ new Set(["write_failed", "write_not_applied", "write_recovery_required", "source_changed", "validation_failed", "validation_unavailable", "compile_failed", "upload_failed", "reconnect_unavailable", "identity_mismatch", "topology_mismatch", "entity_mismatch", "sensor_count_mismatch", "persistence_failed", "rollback_failed", "cancelled"]);
const TRANSACTION_PROGRESS = /* @__PURE__ */ new Set(["config_written", "config_validated", "firmware_compiled", "ota_uploaded", "device_verified", "metadata_persisted", "config_restored"]);
const PREFLIGHT_CODES = /* @__PURE__ */ new Set(["count_mismatch", "invalid_kind", "invalid_unit", "invalid_range", "invalid_step", "unavailable", "zero_ack", "device_busy"]);
const AUTHORITATIVE_EVIDENCE = /* @__PURE__ */ new Set(["config_project", "config_packages", "native_project"]);
const CHANGE_KEY = /^(?:meter|voltage_reference|channel|aggregate|package)\.[a-z0-9_.-]+$/;
const MAC = /^[0-9a-f]{12}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const SERVER_ID = /^[0-9a-f]{32}$/;
const CONFIGURATION = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?\.yaml$/;
const FIRMWARE_PRODUCT_ID = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const ESPHOME_VERSION = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/;
const TRANSACTION_OPERATIONS = /* @__PURE__ */ new Set(["preview_ct_config", "preview_meter_configuration", "preview_calibrated_gains", "apply_ct_config", "compile_ct_config", "install_ct_config", "abandon_ct_config", "rollback_ct_config", "subscribe_config_transaction"]);
const OFFSET_CAPABILITIES = /* @__PURE__ */ new Set(["available", "unavailable", "invalid"]);
const OFFSET_DISPOSITIONS = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial"]);
const OFFSET_STAGE_STATES = /* @__PURE__ */ new Set(["not_started", "in_progress", "completed", "skipped", "partial", "indeterminate"]);
const OFFSET_RESULT_STATES = /* @__PURE__ */ new Set(["applied_pending_restart_verification", "partial", "indeterminate"]);
function record(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} response is invalid`);
  return value;
}
function array(value, label, limit = 100) {
  if (!Array.isArray(value) || value.length > limit) throw new Error(`${label} response is invalid`);
  return value;
}
function string(value, label, nullable = false) {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} response is invalid`);
  return value;
}
function id(value, label) {
  const result = string(value, label);
  if (result.length > 128) throw new Error(`${label} response is invalid`);
  return result;
}
function number(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} response is invalid`);
  return value;
}
function integer(value, label) {
  const result = number(value, label);
  if (!Number.isInteger(result)) throw new Error(`${label} response is invalid`);
  return result;
}
function boolean(value, label, nullable = false) {
  if (nullable && value === null) return null;
  if (typeof value !== "boolean") throw new Error(`${label} response is invalid`);
  return value;
}
function enumeration(value, values, label) {
  const result = string(value, label);
  if (!values.has(result)) throw new Error(`${label} response is invalid`);
  return result;
}
function optionalString(value, label) {
  if (value !== void 0) string(value, label, true);
}
function close(actual, expected) {
  return Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(actual), Math.abs(expected));
}
function exactKeys(item, keys, label) {
  const actual = Object.keys(item);
  if (actual.length !== keys.length || actual.some((key) => !keys.includes(key))) throw new Error(`${label} response is invalid`);
}
function exactStrings(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}
function device(value, label) {
  const item = record(value, label);
  string(item.entry_id, label);
  string(item.title, label);
  string(item.project_name, label);
  string(item.project_version, label, true);
  boolean(item.importable, label, true);
  string(item.configuration, label, true);
}
function setup(value, label) {
  const item = record(value, label);
  enumeration(item.state, SETUP_STATES, label);
  array(item.devices, label).forEach((entry) => device(entry, label));
  if (item.configuration_authoritative !== void 0) boolean(item.configuration_authoritative, label);
  if (item.bound_device_id !== void 0 && item.bound_device_id !== null) string(item.bound_device_id, label);
  if (item.installer_intent !== void 0) {
    const intent = record(item.installer_intent, label);
    const count = integer(intent.addon_count, label);
    if (count < 0 || count > 6) throw new Error(`${label} response is invalid`);
    const connection = enumeration(intent.connection_type, CONNECTIONS$1, label);
    if (connection === "unknown") throw new Error(`${label} response is invalid`);
    if (intent.power_quality === void 0 !== (intent.status_fields === void 0)) {
      throw new Error(`${label} response is invalid`);
    }
    if (intent.power_quality !== void 0) packageOptions$1(intent, label, count + 1);
    const productId = intent.firmware_product_id;
    const version = intent.esphome_version;
    if (productId === void 0 !== (version === void 0) || productId !== void 0 && (typeof productId !== "string" || productId.length > 160 || !FIRMWARE_PRODUCT_ID.test(productId)) || version !== void 0 && (typeof version !== "string" || version.length > 160 || !ESPHOME_VERSION.test(version))) {
      throw new Error(`${label} response is invalid`);
    }
    if (intent.electrical_system === void 0 !== (intent.line_frequency_hz === void 0) || intent.electrical_system !== void 0 && (!ELECTRICAL_SYSTEMS.has(intent.electrical_system) || ![50, 60].includes(integer(intent.line_frequency_hz, label)))) {
      throw new Error(`${label} response is invalid`);
    }
  }
  return value;
}
function topology(value, label) {
  const item = record(value, label);
  exactKeys(item, ["addon_count", "board_count", "ct_count", "group_count", "connection_type", "voltage_layout", "project_name", "evidence"], label);
  const addonCount = integer(item.addon_count, label);
  const boardCount = integer(item.board_count, label);
  const ctCount = integer(item.ct_count, label);
  const groupCount = integer(item.group_count, label);
  if (addonCount < 0 || addonCount > 6 || boardCount < 1 || boardCount > 7 || ctCount < 6 || ctCount > 42 || groupCount < 2 || groupCount > 14 || boardCount !== addonCount + 1 || ctCount !== 6 * boardCount || groupCount !== 2 * boardCount) throw new Error(`${label} response is invalid`);
  enumeration(item.connection_type, CONNECTIONS$1, label);
  string(item.voltage_layout, label);
  string(item.project_name, label);
  const evidenceItems = array(item.evidence, label);
  if (evidenceItems.length < 1 || evidenceItems.length > EVIDENCE_SOURCES.size) throw new Error(`${label} response is invalid`);
  const sources = evidenceItems.map((entry) => {
    const evidence = record(entry, label);
    exactKeys(evidence, ["source", "addon_count", "detail"], label);
    const source = enumeration(evidence.source, EVIDENCE_SOURCES, label);
    const evidenceAddons = integer(evidence.addon_count, label);
    if (evidenceAddons < 0 || evidenceAddons > 6) throw new Error(`${label} response is invalid`);
    string(evidence.detail, label);
    return source;
  });
  if (new Set(sources).size !== sources.length || !sources.some((source) => AUTHORITATIVE_EVIDENCE.has(source))) throw new Error(`${label} response is invalid`);
  return value;
}
function topologyResponse(value, label) {
  const item = record(value, label);
  if ("topology" in item) {
    const parsed = topology(item.topology, label);
    if (item.configuration_authoritative !== void 0) boolean(item.configuration_authoritative, label);
    if (item.package_options !== void 0) packageOptions$1(item.package_options, label, parsed.board_count);
    return value;
  }
  return topology(value, label);
}
function totalOutputs(value, label) {
  const item = record(value, label);
  exactKeys(item, ["watts", "amps", "kwh"], label);
  for (const key of ["watts", "amps", "kwh"]) boolean(item[key], label);
}
function configurationImpact(value, label, updateInterval) {
  const impact = record(value, label);
  const counts = ["enabled_channel_count", "numeric_entity_count", "text_entity_count", "energy_entity_count", "public_total_entity_count", "internal_total_sensor_count"];
  exactKeys(impact, [...counts, "approximate_publications_per_second"], label);
  for (const key of counts) if (integer(impact[key], label) < 0) throw new Error(`${label} response is invalid`);
  const publications = number(impact.approximate_publications_per_second, label);
  const expected = (Number(impact.numeric_entity_count) + Number(impact.text_entity_count)) / updateInterval;
  if (publications < 0 || Math.abs(publications - expected) > Number.EPSILON * Math.max(1, publications, expected) * 8 || Number(impact.energy_entity_count) > Number(impact.numeric_entity_count) || Number(impact.public_total_entity_count) > Number(impact.numeric_entity_count)) throw new Error(`${label} response is invalid`);
  return value;
}
function leafChannels(value, label, count = 42) {
  const channels = array(value, label, 42).map((entry) => integer(entry, label));
  if (new Set(channels).size !== channels.length || channels.some((entry) => entry < 1 || entry > count)) throw new Error(`${label} response is invalid`);
  return channels;
}
function totalSources(value, label, count = 42) {
  const sources = array(value, label, 82).map((entry) => {
    const item = record(entry, label);
    if (item.kind === "channel") {
      exactKeys(item, ["kind", "channel"], label);
      leafChannels([item.channel], label, count);
    } else if (item.kind === "native_total") {
      exactKeys(item, ["kind", "source_id"], label);
      id(item.source_id, label);
    } else if (item.kind === "aggregate") {
      exactKeys(item, ["kind", "aggregate_id"], label);
      id(item.aggregate_id, label);
    } else throw new Error(`${label} response is invalid`);
    return item;
  });
  if (!sources.length || new Set(sources.map((item) => `${String(item.kind)}:${String(item.channel ?? item.source_id ?? item.aggregate_id)}`)).size !== sources.length) throw new Error(`${label} response is invalid`);
  return sources;
}
function advancedTotal(value, label, count = 42) {
  const item = record(value, label);
  exactKeys(item, ["aggregate_id", "name", "role", "sources", "measurement_method", "energy_mode", "outputs", "origin"], label);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id(item.aggregate_id, label))) throw new Error(`${label} response is invalid`);
  string(item.name, label);
  enumeration(item.role, CIRCUIT_ROLES, label);
  const sources = totalSources(item.sources, label, count);
  const method = enumeration(item.measurement_method, MEASUREMENT_METHODS, label);
  const cardinality = method === "two_ct_sum" ? 2 : method === "direct" ? void 0 : 1;
  if (cardinality !== void 0 && (sources.length !== cardinality || sources.some((source) => source.kind !== "channel"))) throw new Error(`${label} response is invalid`);
  const energy = enumeration(item.energy_mode, ENERGY_MODES, label);
  totalOutputs(item.outputs, label);
  if (energy === "none" && record(item.outputs, label).kwh) throw new Error(`${label} response is invalid`);
  enumeration(item.origin, /* @__PURE__ */ new Set(["advanced", "migrated"]), label);
  return item;
}
function automaticSettings(value, label) {
  const settings = array(value, label, 100).map((entry) => {
    const item = record(entry, label);
    exactKeys(item, ["candidate_id", "enabled", "outputs"], label);
    id(item.candidate_id, label);
    boolean(item.enabled, label);
    totalOutputs(item.outputs, label);
    return item;
  });
  if (new Set(settings.map((item) => item.candidate_id)).size !== settings.length) throw new Error(`${label} response is invalid`);
  return settings;
}
function automaticCandidate(value, label, count = 42) {
  const item = record(value, label);
  exactKeys(item, ["candidate_id", "aggregate_id", "name", "role", "sources", "measurement_method", "energy_mode", "recommended_outputs"], label);
  id(item.candidate_id, label);
  id(item.aggregate_id, label);
  string(item.name, label);
  enumeration(item.role, CIRCUIT_ROLES, label);
  const sources = totalSources(item.sources, label, count);
  if (sources.length !== 2 || sources.some((source) => source.kind !== "channel") || item.measurement_method !== "two_ct_sum") throw new Error(`${label} response is invalid`);
  enumeration(item.energy_mode, ENERGY_MODES, label);
  totalOutputs(item.recommended_outputs, label);
  return item;
}
function automaticPreview(item, label, count = 42) {
  const candidates = array(item.automatic_candidates, label, 4).map((entry) => automaticCandidate(entry, label, count));
  if (new Set(candidates.map((entry) => entry.candidate_id)).size !== candidates.length) throw new Error(`${label} response is invalid`);
  const resolved = array(item.automatic_totals, label, 4);
  if (resolved.length !== candidates.length) throw new Error(`${label} response is invalid`);
  resolved.forEach((entry, index) => {
    const total = record(entry, label);
    exactKeys(total, ["candidate", "enabled", "outputs"], label);
    const candidate = automaticCandidate(total.candidate, label, count);
    if (candidate.candidate_id !== candidates[index].candidate_id) throw new Error(`${label} response is invalid`);
    boolean(total.enabled, label);
    totalOutputs(total.outputs, label);
  });
  automaticSettings(item.stale_automatic_total_settings, label);
}
function totalsInventory(value, label, count) {
  const item = record(value, label);
  exactKeys(item, ["native_sources", "automatic_candidates", "automatic_totals", "stale_automatic_total_settings", "migration"], label);
  const native = array(item.native_sources, label, 8).map((entry) => {
    const source = record(entry, label);
    exactKeys(source, ["source_id", "label", "leaf_channels", "power_id", "current_id", "existing_energy_id", "upstream_defaults"], label);
    id(source.source_id, label);
    string(source.label, label);
    id(source.power_id, label);
    id(source.current_id, label);
    if (source.existing_energy_id !== null) id(source.existing_energy_id, label);
    if (!leafChannels(source.leaf_channels, label, count).length) throw new Error(`${label} response is invalid`);
    totalOutputs(source.upstream_defaults, label);
    return source;
  });
  if (new Set(native.map((entry) => entry.source_id)).size !== native.length || !native.some((entry) => entry.source_id === "overall")) throw new Error(`${label} response is invalid`);
  automaticPreview(item, label, count);
  const migration = record(item.migration, label);
  exactKeys(migration, ["parent_review_required", "legacy_parent_links", "native_visibility_confirmation_required", "native_visibility_resolved"], label);
  boolean(migration.parent_review_required, label);
  boolean(migration.native_visibility_confirmation_required, label);
  boolean(migration.native_visibility_resolved, label);
  array(migration.legacy_parent_links, label, 32).forEach((entry) => {
    const link = record(entry, label);
    exactKeys(link, ["child_id", "proposed_parent_id"], label);
    id(link.child_id, label);
    id(link.proposed_parent_id, label);
  });
  return item;
}
function totalsSummary(value, label, count) {
  const keys = /* @__PURE__ */ new Set();
  for (const entry of array(value, label, 44)) {
    const row = record(entry, label);
    exactKeys(row, ["total_id", "kind", "name", "ownership", "public_outputs", "internal_outputs", "unverified_outputs", "sources", "formula", "leaf_channels", "parents"], label);
    const key = `${enumeration(row.kind, /* @__PURE__ */ new Set(["native_total", "aggregate"]), label)}:${id(row.total_id, label)}`;
    if (keys.has(key)) throw new Error(`${label} response is invalid`);
    keys.add(key);
    string(row.name, label);
    string(row.formula, label);
    enumeration(row.ownership, /* @__PURE__ */ new Set(["helper_managed", "source_owned"]), label);
    for (const field of ["public_outputs", "internal_outputs", "unverified_outputs"]) {
      const outputs = array(row[field], label, 6);
      outputs.forEach((output) => enumeration(output, /* @__PURE__ */ new Set(["Watts", "Amps", "kWh", "Net Watts", "Import Watts", "Return-to-grid Watts", "Import kWh", "Return-to-grid kWh", "external custom kWh"]), label));
      if (new Set(outputs).size !== outputs.length) throw new Error(`${label} response is invalid`);
    }
    array(row.sources, label, 82).forEach((source) => string(source, label));
    array(row.parents, label, 36).forEach((parent) => string(parent, label));
    if (!leafChannels(row.leaf_channels, label, count).length) throw new Error(`${label} response is invalid`);
  }
}
function totalGraphPreview(value, label, planId, sourceSha256, configuration) {
  const item = record(value, label);
  exactKeys(item, ["plan_id", "source_sha256", "automatic_candidates", "automatic_totals", "stale_automatic_total_settings", "graph", "configuration_impact", "total_details"], label);
  totalsSummary(item.total_details, label, configuration.channels.length);
  configurationImpact(item.configuration_impact, label, configuration.meter.update_interval_s);
  if (item.plan_id !== planId || item.source_sha256 !== sourceSha256) throw new Error(`${label} response is invalid`);
  automaticPreview(item, label);
  const graph = record(item.graph, label);
  exactKeys(graph, ["native_visibility", "ordered_nodes", "leaf_channels", "independent_overlap_warnings"], label);
  array(graph.native_visibility, label, 24).forEach((entry) => {
    const override = record(entry, label);
    exactKeys(override, ["sensor_id", "internal"], label);
    id(override.sensor_id, label);
    boolean(override.internal, label);
  });
  array(graph.ordered_nodes, label, 36).forEach((entry) => {
    const node = record(entry, label);
    exactKeys(node, ["aggregate", "power_id", "current_id", "sources", "power_required", "current_required", "energy_required"], label);
    advancedTotal(node.aggregate, label);
    id(node.power_id, label);
    id(node.current_id, label);
    for (const key of ["power_required", "current_required", "energy_required"]) boolean(node[key], label);
    array(node.sources, label, 82).forEach((entry2) => {
      const source = record(entry2, label);
      exactKeys(source, ["label", "power_id", "current_id", "leaf_channels"], label);
      string(source.label, label);
      id(source.power_id, label);
      id(source.current_id, label);
      leafChannels(source.leaf_channels, label);
    });
  });
  Object.values(record(graph.leaf_channels, label)).forEach((entry) => leafChannels(entry, label));
  array(graph.independent_overlap_warnings, label, 630).forEach((entry) => {
    const warning = record(entry, label);
    exactKeys(warning, ["first_id", "second_id", "leaf_channels"], label);
    id(warning.first_id, label);
    id(warning.second_id, label);
    leafChannels(warning.leaf_channels, label);
  });
  return value;
}
function meterConfiguration(value, label) {
  const response = record(value, label);
  exactKeys(response, ["plan_id", "source_sha256", "topology", "configuration", "capabilities", "totals", "voltage_topology", "voltage_transformer_catalog", "ct_catalog", "warnings", "configuration_impact", "total_details", "channels", "catalog"], label);
  const planId = string(response.plan_id, label);
  if (!SERVER_ID.test(planId) || !SHA256.test(string(response.source_sha256, label))) throw new Error(`${label} response is invalid`);
  const planTopology = topology(response.topology, label);
  totalsSummary(response.total_details, label, planTopology.ct_count);
  const configuration = record(response.configuration, label);
  exactKeys(configuration, ["meter", "channels", "default_totals", "automatic_totals", "aggregates", "power_quality", "status_fields", "multi_reference_preparation_acknowledged", "totals_change_intent"], label);
  const meter = record(configuration.meter, label);
  exactKeys(meter, ["friendly_name", "electrical_system", "line_frequency_hz", "update_interval_s", "voltage_layout", "voltage_references"], label);
  string(meter.friendly_name, label);
  enumeration(meter.electrical_system, ELECTRICAL_SYSTEMS, label);
  const lineFrequency = integer(meter.line_frequency_hz, label);
  if (lineFrequency !== 50 && lineFrequency !== 60) throw new Error(`${label} response is invalid`);
  const updateInterval = integer(meter.update_interval_s, label);
  if (!UPDATE_INTERVALS.has(updateInterval) || !VOLTAGE_LAYOUTS.has(enumeration(meter.voltage_layout, VOLTAGE_LAYOUTS, label))) throw new Error(`${label} response is invalid`);
  const voltageReferences = array(meter.voltage_references, label, 8).map((entry) => {
    const reference = record(entry, label);
    exactKeys(reference, ["reference_id", "label", "phase_label", "nominal_voltage_v", "transformer_model_id", "gain_voltage", "group_keys"], label);
    const referenceId = id(reference.reference_id, label);
    const referenceLabel = string(reference.label, label);
    string(reference.phase_label, label);
    const nominalVoltage = number(reference.nominal_voltage_v, label);
    if (nominalVoltage < 1 || nominalVoltage > 600) throw new Error(`${label} response is invalid`);
    id(reference.transformer_model_id, label);
    const gain = integer(reference.gain_voltage, label);
    if (gain < 1 || gain > 65535) throw new Error(`${label} response is invalid`);
    const groupKeys2 = array(reference.group_keys, label, 14).map((key) => id(key, label));
    if (!groupKeys2.length) throw new Error(`${label} response is invalid`);
    return { reference_id: referenceId, label: referenceLabel, group_keys: groupKeys2 };
  });
  if (!voltageReferences.length || new Set(voltageReferences.map((reference) => reference.reference_id)).size !== voltageReferences.length) {
    throw new Error(`${label} response is invalid`);
  }
  const expectedGroups = Array.from({ length: planTopology.board_count }, (_2, board) => board === 0 ? ["main_1", "main_2"] : [`addon${board}_1`, `addon${board}_2`]).flat();
  const referenceGroups = voltageReferences.flatMap((reference) => reference.group_keys);
  if (referenceGroups.length !== planTopology.group_count || new Set(referenceGroups).size !== referenceGroups.length || !exactStrings([...referenceGroups].sort(), [...expectedGroups].sort())) throw new Error(`${label} response is invalid`);
  const channels = array(configuration.channels, label, 42);
  if (channels.length !== planTopology.ct_count) throw new Error(`${label} response is invalid`);
  channels.forEach((entry, index) => {
    const channel = record(entry, label);
    exactKeys(channel, ["channel", "enabled", "name", "model_id", "reporting_multiplier", "role", "voltage_reference_id", "custom_gain_ct", "custom_label", "burden_output_acknowledged"], label);
    const referenceId = id(channel.voltage_reference_id, label);
    const board = Math.floor(index / 6);
    const group = Math.floor(index % 6 / 3) + 1;
    const groupKey = board === 0 ? `main_${group}` : `addon${board}_${group}`;
    const owner = voltageReferences.find((reference) => reference.group_keys.includes(groupKey))?.reference_id;
    if (integer(channel.channel, label) !== index + 1 || ![1, 2, 4, 8].includes(number(channel.reporting_multiplier, label)) || referenceId !== owner) throw new Error(`${label} response is invalid`);
    const enabled = boolean(channel.enabled, label);
    string(channel.name, label);
    id(channel.model_id, label);
    const role = enumeration(channel.role, CIRCUIT_ROLES, label);
    if (enabled && role === "unused" || !enabled && role !== "unused") throw new Error(`${label} response is invalid`);
    if (channel.custom_gain_ct !== null && (integer(channel.custom_gain_ct, label) < 1 || integer(channel.custom_gain_ct, label) > 65535)) throw new Error(`${label} response is invalid`);
    if (channel.custom_label !== null) string(channel.custom_label, label);
    boolean(channel.burden_output_acknowledged, label);
  });
  const totals = totalsInventory(response.totals, label, planTopology.ct_count);
  const defaults = record(configuration.default_totals, label);
  exactKeys(defaults, ["overall", "boards"], label);
  totalOutputs(defaults.overall, label);
  const boards = array(defaults.boards, label, 7);
  if (boards.length !== (planTopology.board_count === 1 ? 0 : planTopology.board_count)) throw new Error(`${label} response is invalid`);
  boards.forEach((entry, index) => {
    const board = record(entry, label);
    exactKeys(board, ["board_index", "outputs"], label);
    if (integer(board.board_index, label) !== index) throw new Error(`${label} response is invalid`);
    totalOutputs(board.outputs, label);
  });
  const automatic = automaticSettings(configuration.automatic_totals, label);
  const candidates = array(totals.automatic_candidates, label, 4).map((entry) => record(entry, label));
  if (automatic.some((entry) => !candidates.some((candidate) => candidate.candidate_id === entry.candidate_id))) throw new Error(`${label} response is invalid`);
  const aggregates = array(configuration.aggregates, label, 32).map((entry) => advancedTotal(entry, label, planTopology.ct_count));
  const aggregateIds = new Set(aggregates.map((entry) => entry.aggregate_id));
  if (aggregateIds.size !== aggregates.length) throw new Error(`${label} response is invalid`);
  const knownAggregates = /* @__PURE__ */ new Set([...aggregateIds, ...candidates.map((entry) => entry.aggregate_id)]);
  const nativeIds = new Set(array(totals.native_sources, label, 8).map((entry) => record(entry, label).source_id));
  for (const aggregate of aggregates) for (const source of array(aggregate.sources, label, 82).map((entry) => record(entry, label))) {
    if (source.kind === "channel" && !boolean(record(channels[Number(source.channel) - 1], label).enabled, label) || source.kind === "native_total" && !nativeIds.has(source.source_id) || source.kind === "aggregate" && !knownAggregates.has(source.aggregate_id)) throw new Error(`${label} response is invalid`);
  }
  const intent = record(configuration.totals_change_intent, label);
  exactKeys(intent, ["adopt_managed_totals", "legacy_parent_decisions"], label);
  boolean(intent.adopt_managed_totals, label);
  const reviewed = /* @__PURE__ */ new Set();
  array(intent.legacy_parent_decisions, label, 32).forEach((entry) => {
    const decision = record(entry, label);
    exactKeys(decision, ["child_id", "proposed_parent_id", "accepted"], label);
    const child = id(decision.child_id, label);
    id(decision.proposed_parent_id, label);
    boolean(decision.accepted, label);
    if (reviewed.has(child)) throw new Error(`${label} response is invalid`);
    reviewed.add(child);
  });
  for (const key of ["power_quality", "status_fields"]) {
    const values = array(configuration[key], label, 7);
    if (values.length !== planTopology.board_count) throw new Error(`${label} response is invalid`);
    values.forEach((entry) => boolean(entry, label));
  }
  boolean(configuration.multi_reference_preparation_acknowledged, label);
  const capabilities = record(response.capabilities, label);
  exactKeys(capabilities, ["configuration_authoritative", "native_totals_readable", "native_totals_writable", "managed_automatic_totals", "managed_advanced_totals", "multi_reference", "semantic_source", "reason_codes"], label);
  for (const key of ["configuration_authoritative", "native_totals_readable", "native_totals_writable", "managed_automatic_totals", "managed_advanced_totals", "multi_reference"]) boolean(capabilities[key], label);
  enumeration(capabilities.semantic_source, /* @__PURE__ */ new Set(["helper_managed", "legacy_inferred"]), label);
  array(capabilities.reason_codes, label, 8).forEach((reason) => string(reason, label));
  const voltageTopology = record(response.voltage_topology, label);
  exactKeys(voltageTopology, ["references", "source"], label);
  enumeration(voltageTopology.source, /* @__PURE__ */ new Set(["helper", "legacy"]), label);
  const topologyReferences = array(voltageTopology.references, label, 8).map((entry) => {
    const reference = array(entry, label, 2);
    if (reference.length !== 2) throw new Error(`${label} response is invalid`);
    const referenceId = id(reference[0], label);
    const groups = array(reference[1], label, 14).map((group) => id(group, label));
    if (!groups.length) throw new Error(`${label} response is invalid`);
    return [referenceId, groups];
  });
  if (topologyReferences.length !== voltageReferences.length || !exactStrings(topologyReferences.map(([reference]) => reference), voltageReferences.map((reference) => reference.reference_id)) || !topologyReferences.every(([reference, groups], index) => exactStrings(groups, voltageReferences[index].group_keys))) throw new Error(`${label} response is invalid`);
  const voltageCatalog = record(response.voltage_transformer_catalog, label);
  exactKeys(voltageCatalog, ["presets", "source_repository", "source_ref", "schema_version"], label);
  string(voltageCatalog.source_repository, label);
  if (!/^[0-9a-f]{40}$/.test(string(voltageCatalog.source_ref, label)) || integer(voltageCatalog.schema_version, label) !== 1) throw new Error(`${label} response is invalid`);
  const voltagePresets = array(voltageCatalog.presets, label, 64);
  if (!voltagePresets.length) throw new Error(`${label} response is invalid`);
  const voltageModelIds = /* @__PURE__ */ new Set();
  voltagePresets.forEach((entry) => {
    const preset = record(entry, label);
    exactKeys(preset, ["model_id", "label", "primary_nominal_v", "secondary_nominal_v", "default_gain_voltage", "notes"], label);
    const model = id(preset.model_id, label);
    if (voltageModelIds.has(model)) throw new Error(`${label} response is invalid`);
    voltageModelIds.add(model);
    string(preset.label, label);
    if (number(preset.primary_nominal_v, label) <= 0 || number(preset.secondary_nominal_v, label) <= 0) throw new Error(`${label} response is invalid`);
    const gain = integer(preset.default_gain_voltage, label);
    if (gain < 1 || gain > 65535) throw new Error(`${label} response is invalid`);
    string(preset.notes, label);
  });
  ctInventory({ plan_id: response.plan_id, source_sha256: response.source_sha256, channels: response.channels, catalog: response.catalog }, label);
  const ctCatalog = record(response.ct_catalog, label);
  exactKeys(ctCatalog, ["presets", "source_repository", "source_ref", "schema_version"], label);
  ctInventory({ plan_id: response.plan_id, source_sha256: response.source_sha256, channels: response.channels, catalog: response.ct_catalog }, label);
  array(response.warnings, label, 32).map((warning) => string(warning, label));
  const impact = configurationImpact(response.configuration_impact, label, updateInterval);
  const enabledChannels = channels.map((entry) => record(entry, label)).filter((entry) => entry.enabled);
  const statusFields = array(configuration.status_fields, label, 7);
  const textCount = enabledChannels.filter((entry) => statusFields[Math.floor((Number(entry.channel) - 1) / 6)]).length;
  if (impact.enabled_channel_count !== enabledChannels.length || impact.text_entity_count !== textCount || Number(impact.energy_entity_count) > Number(impact.numeric_entity_count)) throw new Error(`${label} response is invalid`);
  return value;
}
function packageOptions$1(value, label, boardCount) {
  const item = record(value, label);
  for (const key of ["power_quality", "status_fields"]) {
    const states = array(item[key], label, 7);
    if (states.length !== boardCount) throw new Error(`${label} response is invalid`);
    states.forEach((state) => boolean(state, label));
  }
  return value;
}
function ctInventory(value, label) {
  const item = record(value, label);
  exactKeys(item, ["plan_id", "source_sha256", "channels", "catalog"], label);
  string(item.plan_id, label);
  if (!SHA256.test(string(item.source_sha256, label))) throw new Error(`${label} response is invalid`);
  const channels = array(item.channels, label);
  if (channels.length < 6 || channels.length > 42 || channels.length % 6 !== 0) throw new Error(`${label} response is invalid`);
  channels.forEach((entry, index) => {
    const channel = record(entry, label);
    exactKeys(channel, ["channel", "name", "raw_gain_ct", "reporting_multiplier", "selected_model_id", "selection_verified_against_config", "address", "display_label", "stored_selection_present"], label);
    const channelNumber = integer(channel.channel, label);
    string(channel.name, label);
    integer(channel.raw_gain_ct, label);
    number(channel.reporting_multiplier, label);
    optionalString(channel.selected_model_id, label);
    boolean(channel.selection_verified_against_config, label);
    optionalString(channel.display_label, label);
    boolean(channel.stored_selection_present, label);
    const address = record(channel.address, label);
    exactKeys(address, ["channel", "board_index", "group_index", "phase"], label);
    const addressChannel = integer(address.channel, label);
    const boardIndex = integer(address.board_index, label);
    const groupIndex = integer(address.group_index, label);
    const phase = enumeration(address.phase, PHASES, label);
    const expectedChannel = index + 1;
    if (channelNumber !== expectedChannel || addressChannel !== expectedChannel || boardIndex !== Math.floor(index / 6) || groupIndex !== Math.floor(index % 6 / 3) || phase !== ["A", "B", "C"][index % 3]) throw new Error(`${label} response is invalid`);
  });
  const catalog = record(item.catalog, label);
  exactKeys(catalog, ["presets", "source_repository", "source_ref", "schema_version"], label);
  string(catalog.source_repository, label);
  string(catalog.source_ref, label);
  integer(catalog.schema_version, label);
  const presets = array(catalog.presets, label);
  if (presets.length > 64) throw new Error(`${label} response is invalid`);
  presets.forEach((entry) => {
    const preset = record(entry, label);
    exactKeys(preset, ["model_id", "label", "rated_current_a", "secondary", "default_gain_ct", "requires_burden_jumper_cut", "notes"], label);
    string(preset.model_id, label);
    string(preset.label, label);
    number(preset.rated_current_a, label);
    string(preset.secondary, label);
    if (preset.default_gain_ct !== null) integer(preset.default_gain_ct, label);
    boolean(preset.requires_burden_jumper_cut, label);
    string(preset.notes, label);
  });
  return value;
}
function transaction(value, label) {
  const item = record(value, label);
  exactKeys(item, ["transaction_id", "state", "source_sha256", "changes", "redacted_diff", "rollback_available", "evidence", "progress", "validation_detail", "upload_progress", "aggregate_entity_mismatch", "full_meter_configuration_verified"], label);
  string(item.transaction_id, label);
  enumeration(item.state, TRANSACTION_STATES, label);
  if (!SHA256.test(string(item.source_sha256, label))) throw new Error(`${label} response is invalid`);
  boolean(item.rollback_available, label);
  if (typeof item.redacted_diff !== "string") throw new Error(`${label} response is invalid`);
  array(item.changes, label).forEach((entry) => {
    const change = record(entry, label);
    exactKeys(change, ["key", "old_value", "new_value"], label);
    const key = string(change.key, label);
    if (!CHANGE_KEY.test(key)) throw new Error(`${label} response is invalid`);
    if (change.old_value !== null) string(change.old_value, label);
    string(change.new_value, label);
  });
  array(item.evidence, label).forEach((entry) => enumeration(entry, TRANSACTION_EVIDENCE, label));
  array(item.progress, label).forEach((entry) => enumeration(entry, TRANSACTION_PROGRESS, label));
  if (item.validation_detail !== null) {
    const detail = record(item.validation_detail, label);
    exactKeys(detail, ["code", "reported_error_count", "reported_warning_count", "error_record_count", "warning_record_count"], label);
    for (const key of ["reported_error_count", "reported_warning_count"]) if (detail[key] !== null) integer(detail[key], label);
    if (detail.code !== null) integer(detail.code, label);
    integer(detail.error_record_count, label);
    integer(detail.warning_record_count, label);
  }
  array(item.upload_progress, label).forEach((entry) => {
    const progress = record(entry, label);
    exactKeys(progress, ["stage", "percentage"], label);
    enumeration(progress.stage, JOB_STAGES, label);
    if (progress.percentage !== null) {
      const percent = integer(progress.percentage, label);
      if (percent < 0 || percent > 100) throw new Error(`${label} response is invalid`);
    }
  });
  boolean(item.aggregate_entity_mismatch, label);
  boolean(item.full_meter_configuration_verified, label);
  return value;
}
function session(value, label) {
  const item = record(value, label);
  string(item.session_id, label);
  string(item.device_id, label);
  enumeration(item.state, SESSION_STATES, label);
  boolean(item.safety_acknowledged, label);
  const preflight = record(item.preflight, label);
  array(preflight.issues, label).forEach((entry) => {
    const issue = record(entry, label);
    enumeration(issue.code, PREFLIGHT_CODES, label);
    string(issue.role, label);
    string(issue.detail, label);
  });
  array(preflight.zeroed_roles, label).forEach((entry) => string(entry, label));
  if (item.entity_role_counts !== void 0) Object.values(record(item.entity_role_counts, label)).forEach((count) => {
    if (integer(count, label) < 0) throw new Error(`${label} response is invalid`);
  });
  if (item.calibration_sources !== void 0) Object.values(record(item.calibration_sources, label)).forEach((source) => enumeration(source, /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), label));
  if (item.calibration_plan !== void 0) enumeration(item.calibration_plan, /* @__PURE__ */ new Set(["standard", "full"]), label);
  const offsetFields = [item.offset_capability, item.offset_disposition, item.offset_boards, item.has_pending_calibration];
  if (offsetFields.every((field) => field === void 0)) return value;
  if (offsetFields.some((field) => field === void 0)) throw new Error(`${label} response is invalid`);
  const capability = record(item.offset_capability, label);
  exactKeys(capability, ["status", "repair_reason"], label);
  const capabilityStatus = enumeration(capability.status, OFFSET_CAPABILITIES, label);
  if (capabilityStatus === "invalid") string(capability.repair_reason, label);
  else if (capability.repair_reason !== null) throw new Error(`${label} response is invalid`);
  const disposition = enumeration(item.offset_disposition, OFFSET_DISPOSITIONS, label);
  const boards = array(item.offset_boards, label, 7);
  if (boards.length < 1) throw new Error(`${label} response is invalid`);
  const stageStates = [];
  boards.forEach((entry, boardIndex) => {
    const board = record(entry, label);
    exactKeys(board, ["board_index", "stages"], label);
    if (integer(board.board_index, label) !== boardIndex) throw new Error(`${label} response is invalid`);
    const stages = array(board.stages, label, 2);
    if (stages.length !== 2) throw new Error(`${label} response is invalid`);
    stages.forEach((entry2, index) => {
      const stage = record(entry2, label);
      exactKeys(stage, ["stage", "state"], label);
      if (integer(stage.stage, label) !== index + 1) throw new Error(`${label} response is invalid`);
      stageStates.push(enumeration(stage.state, OFFSET_STAGE_STATES, label));
    });
  });
  const expectedDisposition = stageStates.every((state) => state === "skipped") ? "skipped" : stageStates.every((state) => state === "completed") ? "completed" : stageStates.every((state) => state === "not_started") ? "not_started" : stageStates.some((state) => state === "partial" || state === "indeterminate") || stageStates.some((state) => state === "skipped") ? "partial" : "in_progress";
  if (disposition !== expectedDisposition) throw new Error(`${label} response is invalid`);
  boolean(item.has_pending_calibration, label);
  return value;
}
function offsetReadiness(value, label, expectedBoard, expectedStage) {
  const item = record(value, label);
  exactKeys(item, ["stage", "ready", "connection_generation", "entities", "reasons", "thresholds", "saved_offset_sources"], label);
  if (integer(item.stage, label) !== expectedStage || expectedBoard < 0 || expectedBoard > 6) throw new Error(`${label} response is invalid`);
  const ready = boolean(item.ready, label);
  const generation = integer(item.connection_generation, label);
  if (generation < 1) throw new Error(`${label} response is invalid`);
  const sourceGroups = expectedBoard === 0 ? ["main_1", "main_2"] : [`addon${expectedBoard}_1`, `addon${expectedBoard}_2`];
  const sources = array(item.saved_offset_sources, label, 2);
  if (sources.length !== 2) throw new Error(`${label} response is invalid`);
  sources.forEach((entry, index) => {
    const pair = array(entry, label, 2);
    if (pair.length !== 2 || pair[0] !== sourceGroups[index]) throw new Error(`${label} response is invalid`);
    enumeration(pair[1], /* @__PURE__ */ new Set(["flash", "configuration", "unknown"]), label);
  });
  const thresholds = record(item.thresholds, label);
  exactKeys(thresholds, ["sample_count", "zero_voltage_peak_volts", "zero_voltage_spread_volts", "zero_current_peak_amps", "zero_current_spread_amps", "voltage_present_minimum_volts", "voltage_present_spread_volts"], label);
  const sampleCount = integer(thresholds.sample_count, label);
  const zeroVoltagePeak = number(thresholds.zero_voltage_peak_volts, label);
  const zeroVoltageSpread = number(thresholds.zero_voltage_spread_volts, label);
  const zeroCurrentPeak = number(thresholds.zero_current_peak_amps, label);
  const zeroCurrentSpread = number(thresholds.zero_current_spread_amps, label);
  const voltagePresentMinimum = number(thresholds.voltage_present_minimum_volts, label);
  const voltagePresentSpread = number(thresholds.voltage_present_spread_volts, label);
  const thresholdValues = [
    zeroVoltagePeak,
    zeroVoltageSpread,
    zeroCurrentPeak,
    zeroCurrentSpread,
    voltagePresentMinimum,
    voltagePresentSpread
  ];
  if (sampleCount < 3 || sampleCount > 100 || thresholdValues.some((entry) => entry < 0) || thresholdValues[4] === 0) throw new Error(`${label} response is invalid`);
  const entities = array(item.entities, label, 12);
  if (entities.length !== 12) throw new Error(`${label} response is invalid`);
  const expectedRoles = /* @__PURE__ */ new Map();
  for (const groupOffset of [0, 1]) {
    const group = expectedBoard === 0 ? `main_${groupOffset + 1}` : `addon${expectedBoard}_${groupOffset + 1}`;
    for (const phase of ["a", "b", "c"]) expectedRoles.set(`${group}.voltage_${phase}`, "voltage");
    for (let offset = 1; offset <= 3; ++offset) expectedRoles.set(`ct${expectedBoard * 6 + groupOffset * 3 + offset}.current_sensor`, "current");
  }
  const disconnectedReason = "entity binding is not on the active connection generation";
  const unavailablePrefix = "fresh window unavailable: ";
  const roles2 = /* @__PURE__ */ new Set();
  const topLevelReasons = [];
  let disconnectedEntities = 0;
  entities.forEach((entry) => {
    const entity = record(entry, label);
    exactKeys(entity, ["role", "quantity", "ready", "reasons", "window"], label);
    const role = string(entity.role, label);
    const quantity = enumeration(entity.quantity, /* @__PURE__ */ new Set(["voltage", "current"]), label);
    if (roles2.has(role) || expectedRoles.get(role) !== quantity) throw new Error(`${label} response is invalid`);
    roles2.add(role);
    const entityReady = boolean(entity.ready, label);
    const reasons2 = array(entity.reasons, label, 12).map((reason) => string(reason, label));
    let expectedReasons;
    if (entity.window === null) {
      if (entityReady || reasons2.length !== 1) throw new Error(`${label} response is invalid`);
      if (reasons2[0] === disconnectedReason) ++disconnectedEntities;
      else if (!reasons2[0].startsWith(unavailablePrefix) || reasons2[0].slice(unavailablePrefix.length).trim().length === 0) {
        throw new Error(`${label} response is invalid`);
      }
      expectedReasons = reasons2;
    } else {
      const window2 = record(entity.window, label);
      exactKeys(window2, ["values", "received_at", "connection_generation", "mean", "minimum", "maximum", "absolute_peak", "absolute_spread"], label);
      const values = array(window2.values, label, sampleCount).map((entry2) => number(entry2, label));
      const receivedAt = array(window2.received_at, label, sampleCount).map((entry2) => number(entry2, label));
      const mean = number(window2.mean, label);
      const minimum = number(window2.minimum, label);
      const maximum = number(window2.maximum, label);
      const peak = number(window2.absolute_peak, label);
      const spread = number(window2.absolute_spread, label);
      const calculatedMean = values.reduce((sum, entry2) => sum + entry2, 0) / values.length;
      const windowGeneration = integer(window2.connection_generation, label);
      if (values.length !== sampleCount || receivedAt.length !== sampleCount || receivedAt.some((entry2, index) => index > 0 && entry2 <= receivedAt[index - 1]) || !close(mean, calculatedMean) || !close(minimum, Math.min(...values)) || !close(maximum, Math.max(...values)) || !close(peak, Math.max(...values.map(Math.abs))) || !close(spread, maximum - minimum)) throw new Error(`${label} response is invalid`);
      expectedReasons = [];
      if (windowGeneration !== generation) expectedReasons.push("window is from another connection generation");
      else if (quantity === "current") {
        if (peak > zeroCurrentPeak) expectedReasons.push("absolute peak exceeds zero_current_peak_amps");
        if (spread > zeroCurrentSpread) expectedReasons.push("absolute spread exceeds zero_current_spread_amps");
      } else if (expectedStage === 1) {
        if (peak > zeroVoltagePeak) expectedReasons.push("absolute peak exceeds zero_voltage_peak_volts");
        if (spread > zeroVoltageSpread) expectedReasons.push("absolute spread exceeds zero_voltage_spread_volts");
      } else {
        if (minimum < voltagePresentMinimum) expectedReasons.push("minimum is below voltage_present_minimum_volts");
        if (spread > voltagePresentSpread) expectedReasons.push("absolute spread exceeds voltage_present_spread_volts");
      }
    }
    if (!exactStrings(reasons2, expectedReasons) || entityReady !== (expectedReasons.length === 0)) throw new Error(`${label} response is invalid`);
    topLevelReasons.push(...expectedReasons.map((reason) => `${role}: ${reason}`));
  });
  const reasons = array(item.reasons, label, 100).map((reason) => string(reason, label));
  const connectionChangedReasons = [...topLevelReasons, "connection generation changed while collecting readiness"];
  const disconnected = disconnectedEntities === entities.length && exactStrings(reasons, [disconnectedReason]);
  const reasonsMatch = disconnected || disconnectedEntities === 0 && (exactStrings(reasons, topLevelReasons) || exactStrings(reasons, connectionChangedReasons));
  if (roles2.size !== expectedRoles.size || !reasonsMatch || ready !== (reasons.length === 0)) throw new Error(`${label} response is invalid`);
  return value;
}
function signedTable(value, label) {
  const phases = array(value, label, 3);
  if (phases.length !== 3) throw new Error(`${label} response is invalid`);
  phases.forEach((entry) => {
    const pair = array(entry, label, 2);
    if (pair.length !== 2 || pair.some((value2) => {
      const result = integer(value2, label);
      return result < -32768 || result > 32767;
    })) throw new Error(`${label} response is invalid`);
  });
  return value;
}
function offsetCalibration(value, label, expectedBoard, expectedStage) {
  const item = record(value, label);
  exactKeys(item, ["state", "board_index", "stage", "expected_tables", "unfinished_group_keys", "retry_allowed", "error"], label);
  const state = enumeration(item.state, OFFSET_RESULT_STATES, label);
  if (integer(item.board_index, label) !== expectedBoard || integer(item.stage, label) !== expectedStage) throw new Error(`${label} response is invalid`);
  const groupKeys2 = expectedBoard === 0 ? ["main_1", "main_2"] : [`addon${expectedBoard}_1`, `addon${expectedBoard}_2`];
  const completed = array(item.expected_tables, label, 2).map((entry) => {
    const table = array(entry, label, 2);
    if (table.length !== 2) throw new Error(`${label} response is invalid`);
    const key = string(table[0], label);
    if (!groupKeys2.includes(key)) throw new Error(`${label} response is invalid`);
    signedTable(table[1], label);
    return key;
  });
  const unfinished = array(item.unfinished_group_keys, label, 2).map((entry) => string(entry, label));
  const all = [...completed, ...unfinished];
  const retryAllowed = boolean(item.retry_allowed, label);
  if (all.length !== 2 || new Set(all).size !== 2 || all.some((key) => !groupKeys2.includes(key))) throw new Error(`${label} response is invalid`);
  if (state === "applied_pending_restart_verification") {
    if (completed.length !== 2 || unfinished.length !== 0 || retryAllowed || item.error !== null) throw new Error(`${label} response is invalid`);
  } else {
    string(item.error, label);
    if (!retryAllowed || completed.length !== (state === "partial" ? 1 : 0)) throw new Error(`${label} response is invalid`);
  }
  return value;
}
function stability(value, label, expectedTarget, expectedTargetId) {
  const item = record(value, label);
  const target = enumeration(item.target, /* @__PURE__ */ new Set(["voltage", "current"]), label);
  string(item.target_id, label);
  const stable = boolean(item.stable, label);
  if (target !== expectedTarget || item.target_id !== expectedTargetId) throw new Error(`${label} response is invalid`);
  const windows = array(item.windows, label, target === "voltage" ? 42 : 1);
  if (target === "voltage" ? windows.length < 3 || windows.length % 3 !== 0 : windows.length !== 1) throw new Error(`${label} response is invalid`);
  const ranges = windows.map((entry) => {
    const window2 = record(entry, label);
    const samples = array(window2.samples, label, 1).map((sample) => number(sample, label));
    if (samples.length !== 1) throw new Error(`${label} response is invalid`);
    const mean = number(window2.mean, label);
    const standardDeviation = number(window2.standard_deviation, label);
    const rangePercent = number(window2.range_percent, label);
    const expectedMean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
    const expectedDeviation = Math.sqrt(samples.reduce((sum, sample) => sum + (sample - expectedMean) ** 2, 0) / samples.length);
    const expectedRange = 100 * (Math.max(...samples) - Math.min(...samples)) / Math.abs(expectedMean);
    if (!close(mean, expectedMean) || !close(standardDeviation, expectedDeviation) || !close(rangePercent, expectedRange)) throw new Error(`${label} response is invalid`);
    return rangePercent;
  });
  if (stable !== ranges.every((range2) => range2 <= 1)) throw new Error(`${label} response is invalid`);
  return value;
}
function calibration(value, label, expected) {
  const item = record(value, label);
  const state = enumeration(item.state, /* @__PURE__ */ new Set(["applied_pending_restart_verification", "result_outside_tolerance", "indeterminate"]), label);
  string(item.group_key, label);
  if (item.phase !== null) enumeration(item.phase, PHASES, label);
  const iteration = integer(item.iteration, label);
  const changed = array(item.changed_channels, label, 3).map((entry) => integer(entry, label));
  const before = array(item.before_values, label, 3);
  const after = array(item.after_values, label, 3);
  const errors = array(item.error_percent_values, label, 3);
  for (const values of [before, after, errors]) values.forEach((entry) => number(entry, label));
  const expectedGroup = expected.target === "voltage" ? expected.groupKey : channelGroup(expected.references[0].channel);
  const expectedChannels = expected.target === "voltage" ? groupChannels(expected.groupKey) : expected.references.map((item2) => item2.channel);
  const expectedPhase = expected.target === "current" && expected.references.length === 1 ? ["A", "B", "C"][(expected.references[0].channel - 1) % 3] : null;
  const retryAllowed = boolean(item.retry_allowed, label);
  if (expected.target === "voltage" && (!Number.isFinite(expected.reference) || expected.reference <= 0) || expected.target === "current" && expected.references.some((reference) => !Number.isFinite(reference.reference) || reference.reference <= 0 || !Number.isFinite(reference.rawReference) || reference.rawReference <= 0) || ![1, 2, 3].includes(changed.length) || state !== "indeterminate" && before.length !== changed.length || new Set(changed).size !== changed.length || changed.some((channel) => channel < 1 || channel > 42) || iteration < 1 || iteration > 3 || item.group_key !== expectedGroup || item.phase !== expectedPhase || changed.length !== expectedChannels.length || changed.some((channel, index) => channel !== expectedChannels[index]) || (state === "indeterminate" ? after.length !== 0 || errors.length !== 0 : after.length !== changed.length || errors.length !== changed.length)) throw new Error(`${label} response is invalid`);
  if (state === "indeterminate") {
    if (item.gain_evidence !== null || retryAllowed) throw new Error(`${label} response is invalid`);
    if (item.restore_evidence != null) record(item.restore_evidence, label);
  } else {
    if (item.gain_evidence == null || item.restore_evidence !== null) throw new Error(`${label} response is invalid`);
    gainEvidence(item.gain_evidence, label, expected);
    const references = expected.target === "voltage" ? after.map(() => expected.reference) : expected.references.map((item2) => item2.reference);
    const expectedErrors = after.map((result, index) => 100 * Math.abs(number(result, label) - references[index]) / references[index]);
    if (errors.some((error, index) => number(error, label) < 0 || !close(number(error, label), expectedErrors[index]))) throw new Error(`${label} response is invalid`);
    const outside = Math.max(...expectedErrors) > 1;
    if (state === "result_outside_tolerance" !== outside || retryAllowed !== (outside && iteration < 3)) throw new Error(`${label} response is invalid`);
  }
  return value;
}
function channelGroup(channel) {
  const board = Math.floor((channel - 1) / 6);
  const group = Math.floor((channel - 1) % 6 / 3) + 1;
  return board === 0 ? `main_${group}` : `addon${board}_${group}`;
}
function gainEvidence(value, label, expected) {
  const evidence = record(value, label);
  const generation = integer(evidence.connection_generation, label);
  const sequence = integer(evidence.operation_sequence, label);
  const groupKey = expected.target === "voltage" ? expected.groupKey : channelGroup(expected.references[0].channel);
  const instanceId = groupKey.startsWith("main_") ? `meter_main${groupKey.slice(-1)}` : groupKey;
  if (generation < 1 || sequence < 1 || string(evidence.instance_id, label) !== instanceId) throw new Error(`${label} response is invalid`);
  const currentByPhase = expected.target === "current" ? new Map(expected.references.map((reference) => [["A", "B", "C"][(reference.channel - 1) % 3], reference.rawReference])) : /* @__PURE__ */ new Map();
  const phases = array(evidence.phases, label, 3);
  if (phases.length !== 3) throw new Error(`${label} response is invalid`);
  phases.forEach((entry, index) => {
    const phase = record(entry, label);
    const phaseName = enumeration(phase.phase, PHASES, label);
    if (phaseName !== ["A", "B", "C"][index]) throw new Error(`${label} response is invalid`);
    number(phase.measured_voltage, label);
    number(phase.measured_current, label);
    const referenceVoltage = number(phase.reference_voltage, label);
    const referenceCurrent = number(phase.reference_current, label);
    const oldVoltage = integer(phase.old_voltage_gain, label);
    const newVoltage = integer(phase.new_voltage_gain, label);
    const oldCurrent = integer(phase.old_current_gain, label);
    const newCurrent = integer(phase.new_current_gain, label);
    if ([oldVoltage, newVoltage, oldCurrent, newCurrent].some((gain) => gain < 1 || gain > 65535)) throw new Error(`${label} response is invalid`);
    if (expected.target === "voltage") {
      if (Math.abs(referenceVoltage - expected.reference) > Math.max(0.01, 1e-6 * Math.max(Math.abs(referenceVoltage), expected.reference)) || Math.abs(referenceCurrent) > 1e-6 || oldCurrent !== newCurrent) throw new Error(`${label} response is invalid`);
    } else {
      const expectedCurrent = currentByPhase.get(phaseName);
      if (Math.abs(referenceVoltage) > 1e-6 || (expectedCurrent === void 0 ? Math.abs(referenceCurrent) > 1e-6 : Math.abs(referenceCurrent - expectedCurrent) > Math.max(1e-4, 1e-6 * Math.max(Math.abs(referenceCurrent), expectedCurrent))) || oldVoltage !== newVoltage || expectedCurrent === void 0 && oldCurrent !== newCurrent) throw new Error(`${label} response is invalid`);
    }
  });
  const mismatches = array(evidence.register_mismatch_phases, label, 3);
  mismatches.forEach((phase) => enumeration(phase, PHASES, label));
  const lines = array(evidence.matching_lines, label, 100);
  if (lines.length === 0 || lines.some((line) => typeof line !== "string") || boolean(evidence.flash_saved, label) !== true || mismatches.length !== 0 || boolean(evidence.calibration_disabled, label) !== false) throw new Error(`${label} response is invalid`);
}
function groupChannels(groupKey) {
  const match = /^(?:main_([12])|addon([1-6])_([12]))$/.exec(groupKey);
  if (!match) return [];
  const board = match[2] === void 0 ? 0 : Number(match[2]);
  const group = Number(match[1] ?? match[3]);
  const first = board * 6 + (group - 1) * 3 + 1;
  return [first, first + 1, first + 2];
}
function restart(value, label, expected) {
  const item = record(value, label);
  for (const key of ["mac", "topology_project_name", "topology_voltage_layout", "verification_id"]) string(item[key], label);
  const addonCount = integer(item.topology_addon_count, label);
  enumeration(item.topology_connection_type, CONNECTIONS$1, label);
  const generation = integer(item.connection_generation, label);
  const authority = enumeration(item.source_authority, /* @__PURE__ */ new Set(["saved_flash", "configuration"]), label);
  const sourceHandoff = boolean(item.source_handoff_available, label);
  const installed = boolean(item.source_handoff_firmware_installed, label);
  optionalString(item.source_handoff_transaction_id, label);
  const hasConfig = item.config_filename !== null || item.config_sha256 !== null;
  if (hasConfig) {
    string(item.config_filename, label);
    string(item.config_sha256, label);
    if (!CONFIGURATION.test(item.config_filename) || !SHA256.test(item.config_sha256)) throw new Error(`${label} response is invalid`);
  }
  if (item.config_filename === null !== (item.config_sha256 === null)) throw new Error(`${label} response is invalid`);
  if (!MAC.test(item.mac) || !SERVER_ID.test(item.verification_id) || generation < 1 || item.source_handoff_transaction_id !== null && !SERVER_ID.test(item.source_handoff_transaction_id) || addonCount !== expected.addon_count || item.topology_project_name !== expected.project_name || item.topology_connection_type !== expected.connection_type || item.topology_voltage_layout !== expected.voltage_layout) throw new Error(`${label} response is invalid`);
  const allowedIds = /* @__PURE__ */ new Set(["meter_main1", "meter_main2", ...Array.from({ length: addonCount }, (_2, index) => [`addon${index + 1}_1`, `addon${index + 1}_2`]).flat()]);
  const validateGroups = (field, tableField, signed) => {
    const groups = array(item[field] ?? [], label, 14);
    const seenIds = /* @__PURE__ */ new Set();
    groups.forEach((entry) => {
      const group = record(entry, label);
      exactKeys(group, ["instance_id", tableField], label);
      const instanceId = string(group.instance_id, label);
      if (!allowedIds.has(instanceId) || seenIds.has(instanceId)) throw new Error(`${label} response is invalid`);
      seenIds.add(instanceId);
      if (signed) signedTable(group[tableField], label);
      else {
        const phases = array(group[tableField], label, 3);
        if (phases.length !== 3) throw new Error(`${label} response is invalid`);
        phases.forEach((phase) => {
          const gains = array(phase, label, 2);
          if (gains.length !== 2 || gains.some((gain) => {
            const amount = integer(gain, label);
            return amount < 1 || amount > 65535;
          })) throw new Error(`${label} response is invalid`);
        });
      }
    });
    return groups.length;
  };
  const gainCount = validateGroups("groups", "phase_gains", false);
  const offsetCount = validateGroups("offset_groups", "phase_offsets", true) + validateGroups("power_offset_groups", "phase_power_offsets", true);
  if (gainCount + offsetCount < 1 || sourceHandoff && (!hasConfig || installed || item.source_handoff_transaction_id !== null || authority !== "saved_flash" || offsetCount > 0) || !sourceHandoff && hasConfig && item.source_handoff_transaction_id === null && offsetCount === 0 || installed && (!hasConfig || item.source_handoff_transaction_id === null || offsetCount > 0) || authority === "configuration" && (!installed || sourceHandoff || offsetCount > 0)) throw new Error(`${label} response is invalid`);
  return value;
}
function activeWork(value, label, expected) {
  const item = record(value, label);
  if (item.session !== null) session(item.session, label);
  if (item.transaction !== null) transaction(item.transaction, label);
  if (item.verified_calibration !== null) restart(item.verified_calibration, label, expected);
  return value;
}
class HelperApi {
  constructor(hass, entryId) {
    this.hass = hass;
    this.entryId = entryId;
    this.setupStatus = () => this.call("setup_status", (value) => setup(value, "setup_status"));
    this.listMeters = () => this.call("list_meters", (value) => {
      array(value, "list_meters").forEach((item) => device(item, "list_meters"));
      return value;
    });
    this.getTopology = (deviceId) => this.call("get_topology", (value) => topologyResponse(value, "get_topology"), { device_id: deviceId });
    this.getCtInventory = (deviceId) => this.call("get_ct_inventory", (value) => ctInventory(value, "get_ct_inventory"), { device_id: deviceId });
    this.getMeterConfiguration = (deviceId) => this.call("get_meter_configuration", (value) => meterConfiguration(value, "get_meter_configuration"), { device_id: deviceId });
    this.getActiveWork = (deviceId, expectedTopology) => this.call("get_active_work", (value) => activeWork(value, "get_active_work", expectedTopology), { device_id: deviceId });
    this.getSession = (sessionId) => this.call("get_session", (value) => session(value, "get_session"), { session_id: sessionId });
    this.getDiagnosticsSummary = () => this.call("get_diagnostics_summary", (value) => record(value, "get_diagnostics_summary"));
    this.setInstallerIntent = (addonCount, connectionType, firmware, packageOptions2, electricalSystem, lineFrequencyHz) => this.call("set_installer_intent", (value) => setup(value, "set_installer_intent"), {
      addon_count: addonCount,
      connection_type: connectionType,
      ...packageOptions2 ?? {},
      ...firmware && firmware.productId.length <= 160 && firmware.version.length <= 160 && FIRMWARE_PRODUCT_ID.test(firmware.productId) && ESPHOME_VERSION.test(firmware.version) ? { firmware_product_id: firmware.productId, esphome_version: firmware.version } : {},
      ...electricalSystem !== null && electricalSystem !== void 0 && lineFrequencyHz !== null && lineFrequencyHz !== void 0 ? { electrical_system: electricalSystem, line_frequency_hz: lineFrequencyHz } : {}
    });
    this.rescan = () => this.call("rescan", (value) => setup(value, "rescan"));
    this.adoptDevice = (deviceId) => this.call("adopt_device", (value) => {
      const item = record(value, "adopt_device");
      string(item.device_id, "adopt_device");
      string(item.configuration, "adopt_device");
      return value;
    }, { device_id: deviceId });
    this.previewCtConfig = (deviceId, planId, sourceSha256, changes, packageOptions2) => this.call("preview_ct_config", (value) => transaction(value, "preview_ct_config"), {
      device_id: deviceId,
      plan_id: planId,
      source_sha256: sourceSha256,
      changes,
      ...packageOptions2 ? { package_options: packageOptions2 } : {}
    });
    this.previewMeterConfiguration = (deviceId, planId, sourceSha256, configuration) => this.call("preview_meter_configuration", (value) => transaction(value, "preview_meter_configuration"), {
      device_id: deviceId,
      plan_id: planId,
      source_sha256: sourceSha256,
      configuration
    });
    this.previewTotalGraph = (deviceId, planId, sourceSha256, configuration) => this.call("preview_total_graph", (value) => totalGraphPreview(value, "preview_total_graph", planId, sourceSha256, configuration), {
      device_id: deviceId,
      plan_id: planId,
      source_sha256: sourceSha256,
      configuration
    });
    this.setHaLabels = (deviceId, planId, sourceSha256, changes) => this.call("set_ha_labels", (value) => value, {
      device_id: deviceId,
      plan_id: planId,
      source_sha256: sourceSha256,
      changes
    });
    this.transaction = (operation, deviceId, transactionId, sourceSha256) => this.call(operation, (value) => transaction(value, operation), {
      device_id: deviceId,
      transaction_id: transactionId,
      source_sha256: sourceSha256
    });
    this.applyCtConfig = (deviceId, transactionId, sourceSha256) => this.transaction("apply_ct_config", deviceId, transactionId, sourceSha256);
    this.compileCtConfig = (deviceId, transactionId, sourceSha256) => this.transaction("compile_ct_config", deviceId, transactionId, sourceSha256);
    this.installCtConfig = (deviceId, transactionId, sourceSha256) => this.transaction("install_ct_config", deviceId, transactionId, sourceSha256);
    this.abandonCtConfig = (deviceId, transactionId, sourceSha256) => this.transaction("abandon_ct_config", deviceId, transactionId, sourceSha256);
    this.rollbackCtConfig = (deviceId, transactionId, sourceSha256) => this.transaction("rollback_ct_config", deviceId, transactionId, sourceSha256);
    this.startSession = (deviceId, calibrationPlan = "full") => this.call("start_session", (value) => session(value, "start_session"), { device_id: deviceId, calibration_plan: calibrationPlan });
    this.acknowledgeSafety = (sessionId) => this.call("acknowledge_safety", (value) => session(value, "acknowledge_safety"), { session_id: sessionId, acknowledged: true });
    this.checkStability = (sessionId, target, targetId) => this.call("check_stability", (value) => stability(value, "check_stability", target, targetId), { session_id: sessionId, target, target_id: targetId });
    this.checkOffsetReadiness = (sessionId, boardIndex, stage) => this.call("check_offset_readiness", (value) => offsetReadiness(value, "check_offset_readiness", boardIndex, stage), {
      session_id: sessionId,
      board_index: boardIndex,
      stage
    });
    this.calibrateOffset = (sessionId, boardIndex, stage, preparationAcknowledged, confirmRetry) => this.call("calibrate_offset", (value) => offsetCalibration(value, "calibrate_offset", boardIndex, stage), {
      session_id: sessionId,
      board_index: boardIndex,
      stage,
      preparation_acknowledged: preparationAcknowledged,
      confirm_retry: confirmRetry
    });
    this.skipOffsetCalibration = (sessionId) => this.call("skip_offset_calibration", (value) => session(value, "skip_offset_calibration"), { session_id: sessionId });
    this.calibrateVoltage = (sessionId, referenceId, referenceVoltage, confirmIteration) => {
      if (!referenceId || !Number.isFinite(referenceVoltage) || referenceVoltage < 1 || referenceVoltage > 600) return Promise.reject(new Error("calibrate_voltage reference is invalid"));
      return this.call("calibrate_voltage", (value) => {
        return array(value, "calibrate_voltage", 14).map((item) => calibration(item, "calibrate_voltage", {
          target: "voltage",
          groupKey: string(record(item, "calibrate_voltage").group_key, "calibrate_voltage"),
          reference: referenceVoltage
        }));
      }, { session_id: sessionId, reference_id: referenceId, reference_voltage: referenceVoltage, confirm_iteration: confirmIteration });
    };
    this.calibrateCurrent = (sessionId, references, confirmIteration, pendingMultipliers = []) => {
      if (references.length < 1 || references.length > 3 || new Set(references.map((item) => item.channel)).size !== references.length || new Set(references.map((item) => channelGroup(item.channel))).size !== 1 || references.some((item) => !Number.isInteger(item.channel) || item.channel < 1 || item.channel > 42 || !Number.isFinite(item.reference) || item.reference <= 0 || ![1, 2, 4, 8].includes(item.reporting_multiplier)) || pendingMultipliers.some((item) => ![1, 2, 4, 8].includes(item.reporting_multiplier))) {
        return Promise.reject(new Error("calibrate_current references are invalid"));
      }
      return this.call("calibrate_current", (value) => calibration(value, "calibrate_current", {
        target: "current",
        references: references.map((item) => ({ channel: item.channel, reference: item.reference, rawReference: item.reference / item.reporting_multiplier }))
      }), {
        session_id: sessionId,
        references,
        confirm_iteration: confirmIteration,
        pending_multipliers: pendingMultipliers
      });
    };
    this.restartAndVerify = (sessionId, expectedTopology) => this.call("restart_and_verify", (value) => restart(value, "restart_and_verify", expectedTopology), { session_id: sessionId });
    this.completeCalibrationWithoutChanges = (sessionId) => this.call("complete_calibration_without_changes", (value) => {
      const result = session(value, "complete_calibration_without_changes");
      if (result.session_id !== sessionId || result.state !== "verified" || result.has_pending_calibration !== false) {
        throw new Error("complete_calibration_without_changes response is invalid");
      }
      return result;
    }, { session_id: sessionId });
    this.previewCalibratedGains = (sessionId, verificationId, changes = [], packageOptions2) => this.call("preview_calibrated_gains", (value) => transaction(value, "preview_calibrated_gains"), {
      session_id: sessionId,
      verification_id: verificationId,
      changes,
      ...packageOptions2 ? { package_options: packageOptions2 } : {}
    });
    this.clearCalibrationFlash = (sessionId, verificationId, transactionId, expectedTopology) => this.call("clear_calibration_flash", (value) => restart(value, "clear_calibration_flash", expectedTopology), {
      session_id: sessionId,
      verification_id: verificationId,
      transaction_id: transactionId
    });
    this.cancelSession = (sessionId) => this.call("cancel_session", (value) => session(value, "cancel_session"), { session_id: sessionId });
    this.subscribeSetup = (callback) => this.subscribe("subscribe_setup", {}, (value) => setup(value, "subscribe_setup"), callback);
    this.subscribeConfigTransaction = (deviceId, transactionId, sourceSha256, callback) => this.subscribe("subscribe_config_transaction", {
      device_id: deviceId,
      transaction_id: transactionId,
      source_sha256: sourceSha256
    }, (value) => transaction(value, "subscribe_config_transaction"), callback);
    this.subscribeSession = (sessionId, callback) => this.subscribe("subscribe_session", { session_id: sessionId }, (value) => session(value, "subscribe_session"), callback);
  }
  static assertPublicPayload(value, transactionStatus = false, depth = 0, field = "", allowChangeKey = false, activeWork2 = false) {
    if (depth > 8) throw new Error("payload nesting is too deep");
    if (Array.isArray(value)) {
      if (value.length > 100) throw new Error(`unsafe collection ${field || "value"} refused`);
      for (const item of value) this.assertPublicPayload(item, false, depth + 1, field);
      return;
    }
    if (typeof value === "string") {
      const multiline = value.includes("\n") || value.includes("\r");
      const limit = field === "redacted_diff" ? 32768 : 4096;
      if (value.length > limit || CONTROL$1.test(value) || SECRET_VALUE.test(value) || multiline && field !== "redacted_diff" || field === "redacted_diff" && value.includes("\r")) {
        throw new Error(`unsafe string ${field || "value"} refused`);
      }
      return;
    }
    if (value === null || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value)) {
      if (key.length > 256 || PROPERTY_CONTROL.test(key)) throw new Error(`unsafe property name refused`);
      if (key.toLowerCase() === "key" && !allowChangeKey) throw new Error(`private field ${key} refused`);
      if (key.toLowerCase() !== "raw_gain_ct" && PRIVATE_FIELD.test(key)) {
        throw new Error(`private field ${key} refused`);
      }
      if (transactionStatus && key === "changes" && Array.isArray(item)) {
        if (item.length > 100) throw new Error("unsafe collection changes refused");
        for (const change of item) this.assertPublicPayload(change, false, depth + 2, "", true);
      } else {
        this.assertPublicPayload(
          item,
          activeWork2 && depth === 0 && key === "transaction",
          depth + 1,
          key.toLowerCase()
        );
      }
    }
  }
  async call(operation, validator, data = {}) {
    const result = await this.hass.callWS({
      type: `${PREFIX}${operation}`,
      entry_id: this.entryId,
      ...data
    });
    HelperApi.assertPublicPayload(
      result,
      TRANSACTION_OPERATIONS.has(operation),
      0,
      "",
      false,
      operation === "get_active_work"
    );
    return validator(result);
  }
  subscribe(operation, data, validator, callback) {
    return this.hass.connection.subscribeMessage((message) => {
      HelperApi.assertPublicPayload(message, TRANSACTION_OPERATIONS.has(operation));
      callback(validator(message));
    }, { type: `${PREFIX}${operation}`, entry_id: this.entryId, ...data });
  }
}
function derivedParentId(aggregateId, aggregates) {
  const parents = aggregates.filter((item) => item.sources.some((source) => source.kind === "aggregate" && source.aggregate_id === aggregateId));
  if (parents.length > 1) throw new Error("A total cannot have multiple parents.");
  return parents[0]?.aggregate_id ?? null;
}
function reparentAggregate(aggregateId, parentId, aggregates) {
  if (!aggregates.some((item) => item.aggregate_id === aggregateId)) throw new Error("Unknown child total.");
  derivedParentId(aggregateId, aggregates);
  if (parentId !== null) {
    const parent = aggregates.find((item) => item.aggregate_id === parentId);
    if (!parent || parentId === aggregateId) throw new Error("Invalid parent total.");
    if (parent.measurement_method !== "direct" || parent.sources.some((source) => source.kind === "channel")) throw new Error("A parent cannot mix CTs with nested totals.");
    const seen = /* @__PURE__ */ new Set([aggregateId]);
    for (let current = parentId; current !== null; current = derivedParentId(current, aggregates)) {
      if (seen.has(current)) throw new Error("Totals cannot form a cycle.");
      seen.add(current);
    }
  }
  return aggregates.map((item) => {
    const sources = item.sources.filter((source) => source.kind !== "aggregate" || source.aggregate_id !== aggregateId);
    if (item.aggregate_id === parentId) sources.push({ kind: "aggregate", aggregate_id: aggregateId });
    return { ...item, sources };
  });
}
function sourceFormula(sources, inventory, aggregates) {
  return sources.map((source) => {
    if (source.kind === "channel") return `CT${source.channel}`;
    const label = source.kind === "native_total" ? inventory.native_sources.find((item) => item.source_id === source.source_id)?.label : aggregates.find((item) => item.aggregate_id === source.aggregate_id)?.name ?? inventory.automatic_candidates.find((item) => item.aggregate_id === source.aggregate_id)?.name;
    if (!label) throw new Error("Unknown total source.");
    return label;
  }).join(" + ");
}
function sourceLeaves(sources, inventory, aggregates, path = [], editingId = null) {
  const leaves = sources.flatMap((source) => {
    if (source.kind === "channel") return [source.channel];
    if (source.kind === "native_total") {
      const native = inventory.native_sources.find((item) => item.source_id === source.source_id);
      if (!native) throw new Error("Unknown native source; remove or replace it.");
      return native.leaf_channels;
    }
    if (path.includes(source.aggregate_id)) throw new Error("Totals cannot form a cycle.");
    const child = aggregates.find((item) => item.aggregate_id === source.aggregate_id) ?? inventory.automatic_candidates.find((item) => item.aggregate_id === source.aggregate_id);
    if (!child) throw new Error("Unknown total source; remove or replace it.");
    const channels = child.sources.filter((item) => item.kind === "channel");
    const needed = child.measurement_method === "direct" ? null : child.measurement_method === "two_ct_sum" ? 2 : 1;
    if (child.aggregate_id !== editingId && (!child.sources.length || channels.length && channels.length !== child.sources.length || needed !== null && (channels.length !== needed || channels.length !== child.sources.length))) {
      throw new Error(`Complete ${child.name}'s measurement method and sources first.`);
    }
    return sourceLeaves(child.sources, inventory, aggregates, [...path, source.aggregate_id], editingId);
  });
  if (new Set(leaves).size !== leaves.length) throw new Error("Overlapping sources count the same CT more than once.");
  return leaves;
}
const emptyTotals = {
  native_sources: [],
  automatic_candidates: [],
  automatic_totals: [],
  stale_automatic_total_settings: [],
  migration: { parent_review_required: false, legacy_parent_links: [], native_visibility_confirmation_required: false, native_visibility_resolved: false }
};
function configReview(status, configuration = null, impact = null, totals = null) {
  const diff = (status?.redacted_diff || "No reviewed configuration changes yet.").split("\n");
  const channels = configuration?.channels ?? [];
  const pqBoards = configuration?.power_quality.flatMap((enabled, board) => enabled ? [board + 1] : []) ?? [];
  const statusBoards = configuration?.status_fields.flatMap((enabled, board) => enabled ? [board + 1] : []) ?? [];
  const formula = (aggregate) => {
    let value;
    try {
      value = sourceFormula(aggregate.sources, totals ?? emptyTotals, configuration?.aggregates ?? []);
    } catch {
      return "Source labels unavailable; refresh the configuration review.";
    }
    return aggregate.measurement_method === "one_ct_double_power" ? `2 × ${value}` : aggregate.measurement_method === "both_conductors_one_ct" ? `${value} (both conductors)` : value;
  };
  const outputs = (value) => `${value.watts ? "Public" : "Hidden"} Watts; ${value.amps ? "public" : "hidden"} Amps; ${value.kwh ? "public" : "hidden"} kWh`;
  return b`
    <section class="review-region" aria-labelledby="review-heading">
      <h2 id="review-heading">Review changes</h2>
      <p class="warning-band">Firmware configuration changes can alter Home Assistant rename/entity-key bindings. Review every change before Apply.</p>
      ${configuration ? b`
        <h3>Meter</h3>
        <dl class="status-list"><div><dt>Electrical profile</dt><dd>${configuration.meter.electrical_system.replaceAll("_", " ")} · ${configuration.meter.line_frequency_hz} Hz</dd></div><div><dt>Reporting interval</dt><dd>${configuration.meter.update_interval_s} seconds</dd></div><div><dt>Friendly name</dt><dd>${configuration.meter.friendly_name}</dd></div></dl>
        <h3>Voltage references</h3>
        <ul class="status-list">${configuration.meter.voltage_references.map((reference) => b`<li>${reference.label} (${reference.phase_label}): ${reference.nominal_voltage_v} V · ${reference.transformer_model_id} · ${reference.group_keys.join(", ")}</li>`)}</ul>
        ${configuration.meter.voltage_references.length > 1 ? b`<p class=${configuration.multi_reference_preparation_acknowledged ? "info-band" : "warning-band"}>Multi-reference hardware preparation: ${configuration.multi_reference_preparation_acknowledged ? "acknowledged" : "not acknowledged"}.</p>` : ""}
        <h3>Channels</h3>
        <ul class="status-list">${channels.map((channel) => b`<li>CT${channel.channel} ${channel.name}: ${channel.enabled ? `${channel.role.replaceAll("_", " ")} on ${channel.voltage_reference_id}; ${channel.model_id || "no model"} × ${channel.reporting_multiplier}; burden ${channel.burden_output_acknowledged ? "acknowledged" : "not acknowledged"}` : "unused"}</li>`)}</ul>
        <h3>Default meter totals</h3>
        <ul><li>Overall meter total: ${outputs(configuration.default_totals.overall)}</li>${configuration.default_totals.boards.map((board) => b`<li>${board.board_index === 0 ? "Main Board" : `Add-on ${board.board_index}`} total: ${outputs(board.outputs)}</li>`)}</ul>
        <h3>Suggested circuit totals</h3>
        <ul>${totals?.automatic_totals.map((item) => b`<li>${item.candidate.name}: ${item.enabled ? outputs(item.outputs) : "Disabled"}</li>`)}</ul>
        <h3>Advanced total hierarchy</h3>
        ${configuration.aggregates.length ? b`<ul class="status-list">${configuration.aggregates.map((aggregate) => b`<li>${aggregate.name} = ${formula(aggregate)} · ${aggregate.measurement_method.replaceAll("_", " ")} · ${aggregate.energy_mode} energy · ${outputs(aggregate.outputs)}</li>`)}</ul>` : b`<p class="info-band">No aggregate totals are configured.</p>`}
        <h3>Legacy relationship migration</h3>
        <ul>${configuration.totals_change_intent?.legacy_parent_decisions.map((decision) => b`<li>${configuration.aggregates.find((item) => item.aggregate_id === decision.child_id)?.name ?? decision.child_id} → ${configuration.aggregates.find((item) => item.aggregate_id === decision.proposed_parent_id)?.name ?? decision.proposed_parent_id}: ${decision.accepted ? "Use this parent relationship" : "Keep totals independent"}; awaiting successful commit.</li>`)}</ul>
        ${impact ? b`<p>${impact.public_total_entity_count} public total entities; ${impact.internal_total_sensor_count} internal total sensors. Hidden outputs can remain internal dependencies.</p>` : b`<p>Current total counts are unavailable.</p>`}
        <h3>Package and entity impact</h3>
        <dl class="status-list"><div><dt>Power quality</dt><dd>${pqBoards.length ? `Boards ${pqBoards.join(", ")}` : "Not selected"}</dd></div><div><dt>Phase status</dt><dd>${statusBoards.length ? `Boards ${statusBoards.join(", ")}` : "Not selected"}</dd></div>${impact ? b`<div><dt>Entity impact</dt><dd>${impact.numeric_entity_count} numeric, ${impact.text_entity_count} text, ${impact.energy_entity_count} energy; ~${impact.approximate_publications_per_second.toFixed(1)} publications/sec</dd></div>` : ""}</dl>
      ` : ""}
      <dl class="status-list">
        <div><dt>Validation</dt><dd>${status?.state === "validated" || status?.progress.includes("config_validated") ? "Validated" : "Pending"}</dd></div>
        <div><dt>Compile</dt><dd>${status?.state === "compiled" || status?.progress.includes("firmware_compiled") ? "Compiled" : "Pending"}</dd></div>
        <div><dt>Install</dt><dd>${status?.state === "install_confirmation_required" ? "Confirmation required" : status?.state ?? "Pending"}</dd></div>
      </dl>
      <details>
        <summary>Technical details</summary>
        <dl class="status-list evidence-list">
          <div><dt>Transaction ID</dt><dd>${status?.transaction_id ?? "Unavailable"}</dd></div>
          <div><dt>Validation records</dt><dd>${status?.validation_detail ? `${status.validation_detail.error_record_count} errors; ${status.validation_detail.warning_record_count} warnings` : "Not available"}</dd></div>
          <div><dt>Evidence</dt><dd>${status?.evidence.join(", ") || "No evidence recorded."}</dd></div>
          <div><dt>Upload trace</dt><dd>${status?.upload_progress.map((item) => `${item.stage}: ${item.percentage ?? "in progress"}`).join(", ") || "No upload trace."}</dd></div>
        </dl>
        <pre class="config-diff" aria-label="Redacted substitution diff"><code>${diff.map((line, index) => b`<span class=${`diff-line ${line.startsWith("+") ? "added" : line.startsWith("-") ? "removed" : "context"}`}>${line}</span>${index < diff.length - 1 ? "\n" : ""}`)}</code></pre>
      </details>
    </section>
  `;
}
function canAdoptTotals(meter) {
  return meter.capabilities.configuration_authoritative && meter.totals.migration.native_visibility_resolved && !meter.capabilities.reason_codes.includes("config_contract_upgrade_required");
}
function totalsEditable(meter, capability) {
  return meter.capabilities.configuration_authoritative && (meter.capabilities[capability] || meter.configuration.totals_change_intent?.adopt_managed_totals === true && canAdoptTotals(meter));
}
function legacyTotalsNotice(capabilities) {
  return b`${capabilities.reason_codes.includes("legacy_custom_totals_unmanaged") || capabilities.reason_codes.includes("legacy_generic_totals_unmanaged") ? b`<p class="warning-band">Arbitrary unmanaged custom totals remain outside helper control. Unchanged custom Watts/Amps retain their source visibility and names. Editing a detected custom total or using it in a changed hierarchy selects a managed replacement: its original Watts/Amps are hidden and the requested helper outputs replace them. Preserved unsupported external custom energy is unchanged and outside the computed entity count.</p>` : A}`;
}
function totalsMigrationReview(meter, update, preview = null, fresh = true, readOnly = false, transaction2 = null) {
  const { configuration, totals, capabilities } = meter;
  const intent = configuration.totals_change_intent ?? { adopt_managed_totals: false, legacy_parent_decisions: [] };
  const adoptionRequired = capabilities.reason_codes.includes("totals_adoption_required");
  const writable = !readOnly && totalsEditable(meter, "managed_advanced_totals");
  const name = (id2) => configuration.aggregates.find((item) => item.aggregate_id === id2)?.name ?? totals.automatic_candidates.find((item) => item.aggregate_id === id2)?.name ?? id2;
  const available = { ...totals, automatic_candidates: totals.automatic_totals.filter((item) => item.enabled).map((item) => item.candidate) };
  return b`
    ${adoptionRequired ? b`<section class="totals-migration" aria-labelledby="totals-adoption-heading">
      <h2 id="totals-adoption-heading">Legacy read-only totals</h2>
      <p>Detected official native totals are read-only until explicit adoption. Opening this page does not change their formulas, visibility or ownership.</p>
      ${canAdoptTotals(meter) && !readOnly ? b`<button class="secondary" ?disabled=${intent.adopt_managed_totals}
        @click=${() => {
    if (canAdoptTotals(meter) && !intent.adopt_managed_totals) update({ ...configuration, totals_change_intent: { ...intent, adopt_managed_totals: true } });
  }}>Adopt managed totals</button>` : !canAdoptTotals(meter) ? b`<p role="status">Adoption requires authoritative editable YAML, confirmed native visibility and supported contract.</p>` : A}
      ${intent.adopt_managed_totals ? b`<p role="status">Adoption selected; awaiting successful commit. Review the exact native visibility overrides and helper blocks before Save and validate.</p>
        ${fresh && preview ? b`<h3>Requested visibility changes versus firmware defaults</h3><p>These are requested outputs, not the source-aware overrides to be added. The server transaction diff below is authoritative for actual YAML changes.</p><ul>${preview.graph.native_visibility.map((item) => {
    const native = totals.native_sources.find((source) => source.power_id === item.sensor_id || source.current_id === item.sensor_id || source.existing_energy_id === item.sensor_id);
    const output = native?.power_id === item.sensor_id ? "Watts" : native?.current_id === item.sensor_id ? "Amps" : "kWh";
    return b`<li>${native?.label ?? "Native total"} ${output}: ${item.internal ? "internal dependency" : "public output"}</li>`;
  })}</ul><h3>Requested helper totals</h3><ul>${preview.graph.ordered_nodes.map((node) => b`<li>${node.aggregate.name}: ${[node.power_required ? "Watts" : "", node.current_required ? "Amps" : "", node.energy_required ? "kWh" : ""].filter(Boolean).join(", ")}</li>`)}
          ${totals.native_sources.filter((source) => source.source_id !== "overall").map((source, index) => source.existing_energy_id === null && configuration.default_totals.boards.find((board) => board.board_index === index)?.outputs.kwh ? b`<li>${source.label}: kWh</li>` : A)}</ul>` : b`<p role="status">Current validated total preview is required to list requested visibility and helper blocks.</p>`}
        ${transaction2 ? b`<details><summary>Exact source-aware additions and helper blocks (server transaction diff)</summary><pre class="config-diff" aria-label="Exact adoption transaction diff">${transaction2.redacted_diff}</pre></details>` : b`<p>Continue to configuration review for the exact source-aware additions and helper blocks in the server transaction diff.</p>`}` : A}
    </section>` : A}
    ${legacyTotalsNotice(capabilities)}
    ${totals.migration.legacy_parent_links.length ? b`<section class="totals-migration" aria-labelledby="legacy-parent-heading">
      <h2 id="legacy-parent-heading">Legacy relationship migration</h2>
      <p>Existing totals continue using their direct CT formulas. Old parent links were metadata only; review each proposed relationship separately.</p>
      ${totals.migration.legacy_parent_links.map((link, index) => {
    const decision = intent.legacy_parent_decisions.find((item) => item.child_id === link.child_id && item.proposed_parent_id === link.proposed_parent_id);
    let aggregates = configuration.aggregates;
    let error = "";
    try {
      if (!configuration.aggregates.some((item) => item.aggregate_id === link.proposed_parent_id)) throw new Error("Automatic totals retain fixed CT sources. Edit a custom total hierarchy explicitly before accepting this relationship.");
      aggregates = reparentAggregate(link.child_id, link.proposed_parent_id, configuration.aggregates);
      for (const aggregate of aggregates) {
        derivedParentId(aggregate.aggregate_id, aggregates);
        sourceLeaves([{ kind: "aggregate", aggregate_id: aggregate.aggregate_id }], available, aggregates);
      }
    } catch (failure) {
      error = failure.message;
    }
    const choose = (accepted) => {
      if (!writable || accepted && (!fresh || error)) return;
      update({
        ...configuration,
        aggregates: accepted ? aggregates : configuration.aggregates.map((aggregate) => aggregate.aggregate_id === link.proposed_parent_id ? { ...aggregate, sources: aggregate.sources.filter((source) => source.kind !== "aggregate" || source.aggregate_id !== link.child_id) } : aggregate),
        totals_change_intent: { ...intent, legacy_parent_decisions: [...intent.legacy_parent_decisions.filter((item) => item.child_id !== link.child_id || item.proposed_parent_id !== link.proposed_parent_id), { ...link, accepted }] }
      });
    };
    return b`<fieldset><legend>${name(link.child_id)} → ${name(link.proposed_parent_id)}</legend>
          <p role="status">${decision ? `${decision.accepted ? "Relationship selected" : "Keep independent selected"}; awaiting successful commit.` : "Pending review"}</p>
          ${error ? b`<p id=${`legacy-link-error-${index}`}>${error}</p>` : A}
          <div class="migration-actions"><button class="secondary" ?disabled=${!writable} @click=${() => choose(false)}>Keep totals independent</button>
          <button class="secondary" ?disabled=${!writable || !fresh || Boolean(error)} aria-describedby=${error ? `legacy-link-error-${index}` : A} @click=${() => choose(true)}>Use this parent relationship</button></div>
        </fieldset>`;
  })}
    </section>` : A}`;
}
function buildInstallStep(purpose, status, apply, compile, install, rollback, back, continueFlow, configuration = null, impact = null, reviewBackBusy = false, correctionPending = false, pendingAction = "", legacyMigration = false, meterInventory = null, totalPreview = null) {
  if (!status) return b`
    <section class="step-content" aria-labelledby="step-heading">
      <div class="recovery-panel" role="status"><strong>No active review</strong><p>Return to the previous step and review the current configuration before continuing.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${back}>Back</button></footer>
    </section>
  `;
  const labels = purpose === "save_calibration" ? { heading: "Save verified calibration", apply: "Write verified gains to ESPHome", compile: "Build firmware", install: "Install calibrated firmware" } : { heading: legacyMigration ? "Install reviewed helper configuration" : "Install meter configuration", apply: "Save and validate configuration", compile: "Build firmware", install: "Install on meter" };
  const state = status.state;
  const retryClear = purpose === "save_calibration" && state === "verified";
  const busy = Boolean(pendingAction);
  const retryableInstall = state === "install_confirmation_required" && status?.evidence.some((code) => ["reconnect_unavailable", "entity_mismatch", "sensor_count_mismatch"].includes(code)) === true;
  const waitingForStartup = state === "reconnecting";
  const latestProgress = status?.upload_progress.slice().reverse().find((item) => item.percentage !== null) ?? status?.upload_progress.at(-1) ?? null;
  const jobProgress = pendingAction === "install" && state === "install_confirmation_required" ? null : latestProgress;
  const progressAction = waitingForStartup ? null : pendingAction === "compile" ? "Compile" : pendingAction === "install" ? "Install" : status?.upload_progress.length ? status.progress.includes("firmware_compiled") ? "Install" : "Compile" : null;
  const percentage = jobProgress?.percentage ?? null;
  const validationFailed = state === "rolled_back" && status?.evidence.includes("validation_failed");
  return b`
    <section class="step-content" aria-labelledby="step-heading">
      <h2>${labels.heading}</h2>
      ${configReview(status, configuration, impact, meterInventory?.totals)}
      ${meterInventory ? totalsMigrationReview(meterInventory, () => void 0, totalPreview, impact !== null, true, status) : ""}
      ${state === "failed" || retryableInstall ? b`
        <div class="recovery-panel" role="status">
          <strong>Build or install needs attention</strong>
          <p>${status?.evidence.join(", ") || "The operation did not complete."}</p>
          ${status?.rollback_available ? b`<button class="danger" @click=${rollback} ?disabled=${busy}>${pendingAction === "rollback" ? "Rolling back…" : "Rollback"}</button>` : ""}
        </div>
      ` : ""}
      ${validationFailed ? b`<div class="recovery-panel" role="status"><strong>ESPHome rejected the config (code ${status?.validation_detail?.code ?? "unavailable"})</strong><p>The original config was restored. Review the config changes and open ESPHome Device Builder logs for the exact validation error.</p></div>` : ""}
      ${waitingForStartup ? b`<div class="job-progress" role="status" aria-live="polite">
        <span>Meter is rebooting. Waiting for startup verification.</span>
        <progress max="100" aria-label="Waiting for meter startup"></progress>
      </div>` : ""}
      <div class="confirmation-actions">
        <button class="primary" @click=${apply} ?disabled=${busy || reviewBackBusy || correctionPending || state !== "previewed"}>${pendingAction === "apply" ? "Applying…" : labels.apply}</button>
        <button class="secondary" @click=${compile} ?disabled=${busy || reviewBackBusy || correctionPending || state !== "validated"}>${pendingAction === "compile" ? "Compiling…" : labels.compile}</button>
        <button class="primary" @click=${install} ?disabled=${busy || reviewBackBusy || correctionPending || state !== "install_confirmation_required" && !retryClear}>${pendingAction === "install" ? "Installing…" : retryClear ? "Retry clearing saved flash values" : retryableInstall ? "Retry Install" : labels.install}</button>
      </div>
      ${progressAction ? b`<div class="job-progress" role="status" aria-live="polite">
        <span>${progressAction} progress: ${percentage === null ? "in progress" : `${percentage}%`}</span>
        ${percentage === null ? b`<progress max="100" aria-label="${progressAction} progress: in progress"></progress>` : b`<progress max="100" value=${percentage} aria-label="${progressAction} progress: ${percentage}%"></progress>`}
      </div>` : ""}
      <footer class="action-footer">
        <button class="secondary" @click=${back} ?disabled=${busy || reviewBackBusy}>${reviewBackBusy ? "Loading…" : "Back"}</button>
        <button class="primary" data-action="continue" @click=${continueFlow} ?disabled=${busy || reviewBackBusy || correctionPending || state !== "verified"}>Continue</button>
      </footer>
    </section>
  `;
}
function calibrationPlanStep(selected, choose, back, runtimeOnly, busy) {
  return b`<section class="step-content" aria-labelledby="calibration-plan-heading" aria-busy=${busy ? "true" : "false"}>
    <h2 id="calibration-plan-heading">Choose calibration</h2>
    <p>Calibration values stay in meter flash until a verified ESPHome handoff is available.</p>
    ${runtimeOnly ? b`<section class="info-band" aria-label="Runtime-only capabilities">
      <strong>The meter is connected to Home Assistant.</strong>
      <p>ESPHome source editing is unavailable.</p>
      <p>Circuit names, CT models, roles, multipliers, entities, and totals cannot be changed by this helper in this mode.</p>
      <p>Supported calibration is saved in meter flash. Installing firmware later may replace flash-only calibration.</p>
      <p>Importing the meter into ESPHome Device Builder, when available, is the path to editable configuration.</p>
      <p>Current calibration requires confirmation of the reporting multiplier because no authoritative CT inventory is available.</p>
    </section>` : ""}
    <fieldset class="name-mode" ?disabled=${busy}><legend>Calibration plan</legend>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "keep_existing"} @change=${() => choose("keep_existing")}> Keep existing calibration — no live session or safety acknowledgement.</label>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "standard"} @change=${() => choose("standard")}> Standard calibration — preserve existing offset values, then calibrate voltage and current.</label>
      <label><input type="radio" name="calibration-plan" .checked=${selected === "full"} @change=${() => choose("full")}> Full calibration — includes optional offset calibration before voltage and current.</label>
    </fieldset>
    ${busy ? b`<p role="status">Loading calibration…</p>` : ""}
    <footer class="action-footer"><button class="secondary" ?disabled=${busy} @click=${back}>Back</button></footer>
  </section>`;
}
const moveTab = (event, index) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const tab = event.currentTarget;
  const tabs = [...tab.parentElement?.querySelectorAll('[role="tab"]') ?? []];
  const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (forward ? 1 : tabs.length - 1)) % tabs.length;
  tabs[next]?.click();
  tabs[next]?.focus();
};
const range = (channels) => channels.length ? `CT${channels[0]}–CT${channels.at(-1)}` : "No CTs";
function defaultTotalsSection(configuration, totals, readable, writable, update, preview = null, graphState = "ready") {
  if (!readable) return b`<section class="default-totals" aria-labelledby="default-totals-heading"><h2 id="default-totals-heading">Default meter totals</h2><p class="info-band" role="status">Native default totals are unavailable for this configuration.</p></section>`;
  const overall = totals.native_sources.find((source) => source.source_id === "overall");
  const boards = totals.native_sources.filter((source) => source.source_id !== "overall");
  const patch = (outputs, boardIndex) => update({
    ...configuration,
    default_totals: boardIndex === void 0 ? { ...configuration.default_totals, overall: outputs } : { ...configuration.default_totals, boards: configuration.default_totals.boards.map((board) => board.board_index === boardIndex ? { ...board, outputs } : board) }
  });
  const consumers = (sourceId, output) => {
    const names = /* @__PURE__ */ new Set();
    if (sourceId !== "overall" && (output === "watts" || output === "amps")) names.add("Overall meter total");
    const native = totals.native_sources.find((source) => source.source_id === sourceId);
    const settings = sourceId === "overall" ? configuration.default_totals.overall : configuration.default_totals.boards.find((board) => board.board_index === boards.findIndex((source) => source.source_id === sourceId))?.outputs;
    if (output === "watts" && native && settings?.kwh) names.add(`${native.label} kWh`);
    configuration.aggregates.filter((aggregate) => aggregate.sources.some((source) => source.kind === "native_total" && source.source_id === sourceId)).forEach((aggregate) => {
      if (output === "watts" && (aggregate.outputs.watts || aggregate.outputs.kwh)) names.add(aggregate.outputs.kwh ? `${aggregate.name} kWh` : `${aggregate.name} Watts`);
      if (output === "amps" && aggregate.outputs.amps) names.add(`${aggregate.name} Amps`);
    });
    if (native && preview) preview.graph.ordered_nodes.forEach((node) => {
      const used = node.sources.some((source) => source.power_id === native.power_id || source.current_id === native.current_id);
      if (!used) return;
      if (output === "watts" && (node.power_required || node.energy_required)) names.add(`${node.aggregate.name} Watts`);
      if (output === "amps" && node.current_required) names.add(`${node.aggregate.name} Amps`);
    });
    return [...names];
  };
  const outputStatus = (sourceId, output, enabled) => {
    const dependency = consumers(sourceId, output);
    const visibility = !totals.migration.native_visibility_resolved ? `${enabled ? "Requested for Home Assistant" : "Hidden from Home Assistant"}; source visibility is unconfirmed.` : enabled ? "Requested for Home Assistant." : "Hidden from Home Assistant.";
    if (!dependency.length) return visibility;
    return enabled ? `${visibility} Retained internally for ${dependency.join(" and ")}.` : `${visibility.replace(/\.$/, "")}; retained internally for ${dependency.join(" and ")}.`;
  };
  const control = (label, checked, onChange) => b`<label class="default-total-control"><input type="checkbox" role="switch" aria-label=${label} .checked=${checked} ?disabled=${!writable}
    @change=${(event) => onChange(event.target.checked)} />${label.replace(/.* (Watts|Amps|kWh)$/, "$1")}</label>`;
  const boardFormula = boards.map((source) => source.label).join(" + ");
  const boardRanges = boards.map((source) => range(source.leaf_channels)).join(" + ");
  const visibilityUnresolved = !totals.migration.native_visibility_resolved;
  return b`<section class="default-totals" aria-labelledby="default-totals-heading">
    <h2 id="default-totals-heading">Default meter totals</h2>
    ${visibilityUnresolved ? b`<p class="info-band" role="status">Native source visibility is unconfirmed; these controls show requested outputs, not confirmed installed publications.</p>` : A}
    ${graphState === "pending" ? b`<p class="info-band" role="status">Updating total graph; current native cards remain available.</p>` : graphState === "invalid" ? b`<p class="warning-band" role="status">Total graph unavailable; native cards show saved draft status and not current dependency results.</p>` : A}
    ${overall ? b`<fieldset class="default-total-card"><legend>Overall meter total (all monitored channels)</legend>
      <p>${boardFormula || "All monitored channels"}. Downstream circuit CTs can double-count the service mains, so this native total is not relabeled Mains.</p>
      <p>Covers: ${boardRanges || range(overall.leaf_channels)}.</p>
      <div class="default-total-controls">
        ${control("Overall meter total Watts", configuration.default_totals.overall.watts, (watts) => patch({ ...configuration.default_totals.overall, watts }))}
        ${control("Overall meter total Amps", configuration.default_totals.overall.amps, (amps) => patch({ ...configuration.default_totals.overall, amps }))}
        ${control("Overall meter total kWh", configuration.default_totals.overall.kwh, (kwh) => patch({ ...configuration.default_totals.overall, kwh }))}
      </div>
      <ul class="native-total-status" role="status"><li>Watts: ${outputStatus("overall", "watts", configuration.default_totals.overall.watts)}</li><li>Amps: ${outputStatus("overall", "amps", configuration.default_totals.overall.amps)}</li><li>kWh: ${outputStatus("overall", "kwh", configuration.default_totals.overall.kwh)}</li></ul>
    </fieldset>` : A}
    ${boards.map((source, boardIndex) => {
    const settings = configuration.default_totals.boards.find((board) => board.board_index === boardIndex)?.outputs;
    if (!settings) return A;
    return b`<fieldset class="default-total-card"><legend>${source.label}</legend><p>${range(source.leaf_channels)}</p>
        <div class="default-total-controls">
          ${control(`${source.label} Watts`, settings.watts, (watts) => patch({ ...settings, watts }, boardIndex))}
          ${control(`${source.label} Amps`, settings.amps, (amps) => patch({ ...settings, amps }, boardIndex))}
          ${control(`${source.label} kWh`, settings.kwh, (kwh) => patch({ ...settings, kwh }, boardIndex))}
        </div>
        <ul class="native-total-status" role="status"><li>Watts: ${outputStatus(source.source_id, "watts", settings.watts)}</li><li>Amps: ${outputStatus(source.source_id, "amps", settings.amps)}</li><li>kWh: ${outputStatus(source.source_id, "kwh", settings.kwh)}</li></ul>
      </fieldset>`;
  })}
  </section>`;
}
const automaticRoleLabels = [
  ["grid", "Mains"],
  ["solar", "Solar"],
  ["subpanel", "Subpanel"],
  ["two_pole", "Two-pole circuit"]
];
function automaticTotalsSection(configuration, totals, writable, update) {
  if (!totals) return b`<section class="automatic-totals" aria-labelledby="automatic-totals-heading"><h2 id="automatic-totals-heading">Suggested circuit totals</h2><p class="info-band" role="status">Suggested totals are unavailable until the total graph is ready.</p></section>`;
  const patch = (candidateId, current, change, aggregates = configuration.aggregates) => update({
    ...configuration,
    automatic_totals: configuration.automatic_totals.some((item) => item.candidate_id === candidateId) ? configuration.automatic_totals.map((item) => item.candidate_id === candidateId ? { ...item, ...change } : item) : [...configuration.automatic_totals, { ...current, ...change }],
    aggregates
  });
  const ambiguousRoles = automaticRoleLabels.filter(([role]) => configuration.channels.filter((channel) => channel.enabled && channel.role === role).length > 2);
  return b`<section class="automatic-totals" aria-labelledby="automatic-totals-heading">
    <h2 id="automatic-totals-heading">Suggested circuit totals</h2>
    ${ambiguousRoles.map(([, label]) => b`<p class="info-band" role="status">Multiple ${label} CTs cannot be paired automatically. Create the totals under Advanced totals.</p>`)}
    ${totals.automatic_totals.length ? totals.automatic_totals.map((resolved) => {
    const saved = configuration.automatic_totals.find((item) => item.candidate_id === resolved.candidate.candidate_id);
    const current = saved ?? { candidate_id: resolved.candidate.candidate_id, enabled: resolved.enabled, outputs: resolved.outputs };
    const parents = configuration.aggregates.filter((aggregate) => aggregate.sources.some((source) => source.kind === "aggregate" && source.aggregate_id === resolved.candidate.aggregate_id));
    const sources = resolved.candidate.sources.map((source) => `CT${source.channel} · ${configuration.channels.find((channel) => channel.channel === source.channel)?.name ?? "Unnamed"}`).join(", ");
    const changeOutput = (key, checked) => patch(resolved.candidate.candidate_id, current, { outputs: { ...current.outputs, [key]: checked } });
    const changeEnabled = (event) => {
      const input = event.target;
      if (input.checked || !parents.length) return patch(resolved.candidate.candidate_id, current, { enabled: input.checked });
      const names = parents.map((parent) => parent.name).join(" and ");
      if (!window.confirm(`${names} uses ${resolved.candidate.name}. Remove it from ${names}?`)) {
        input.checked = true;
        return;
      }
      patch(resolved.candidate.candidate_id, current, { enabled: false }, configuration.aggregates.map((aggregate) => ({
        ...aggregate,
        sources: aggregate.sources.filter((source) => source.kind !== "aggregate" || source.aggregate_id !== resolved.candidate.aggregate_id)
      })));
    };
    const control = (key, label, disabled = false) => b`<label class="automatic-total-control"><input type="checkbox" role="switch" aria-label=${`${resolved.candidate.name} ${label}`} .checked=${current.outputs[key]} ?disabled=${!writable || disabled}
        @change=${(event) => changeOutput(key, event.target.checked)} />${label}</label>`;
    return b`<fieldset class="automatic-total-card"><legend>${resolved.candidate.name}</legend>
        <p>Sources: ${sources}</p><p>Formula: ${sourceFormula(resolved.candidate.sources, totals, configuration.aggregates)} · ${resolved.candidate.role.replaceAll("_", " ")} · ${resolved.candidate.measurement_method.replaceAll("_", " ")}</p>
        ${parents.length ? b`<p>Feeds into: ${parents.map((parent) => parent.name).join(" and ")}</p>` : ""}
        <label class="automatic-total-control"><input type="checkbox" role="switch" aria-label=${`Create ${resolved.candidate.name} total`} .checked=${current.enabled} ?disabled=${!writable} @change=${changeEnabled} />Create this total</label>
        <div class="automatic-total-controls">${control("watts", "Watts")}${control("amps", "Amps")}${control("kwh", "kWh", resolved.candidate.energy_mode === "none")}</div>
      </fieldset>`;
  }) : b`<p class="info-band" role="status">No server-suggested totals are available for this circuit configuration.</p>`}
  </section>`;
}
const methods = ["direct", "two_ct_sum", "one_ct_double_power", "both_conductors_one_ct"];
const energyModes = ["none", "consumption", "bidirectional", "generation"];
const roles = ["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom"];
const sameSource = (a2, b2) => a2.kind === "channel" && b2.kind === "channel" ? a2.channel === b2.channel : a2.kind === "native_total" && b2.kind === "native_total" ? a2.source_id === b2.source_id : a2.kind === "aggregate" && b2.kind === "aggregate" && a2.aggregate_id === b2.aggregate_id;
const errorText = (error) => error instanceof Error ? error.message : "Invalid total sources.";
const coverageLabel = (leaves) => {
  const sorted = [...new Set(leaves)].sort((a2, b2) => a2 - b2);
  return sorted.length > 1 && sorted.at(-1) - sorted[0] === sorted.length - 1 ? `CT${sorted[0]}–CT${sorted.at(-1)}` : sorted.map((channel) => `CT${channel}`).join(", ");
};
function advancedTotalsEditor(configuration, drafts, update, writable, reason, totals, preview = null, fresh = true, automaticSourcesFresh = fresh) {
  const catalog = totals ?? {
    native_sources: [],
    automatic_candidates: [],
    automatic_totals: [],
    stale_automatic_total_settings: [],
    migration: {
      parent_review_required: false,
      legacy_parent_links: [],
      native_visibility_confirmation_required: true,
      native_visibility_resolved: false
    }
  };
  const enabledAutomatic = (automaticSourcesFresh ? catalog.automatic_totals : []).filter((item) => configuration.automatic_totals.find((setting) => setting.candidate_id === item.candidate.candidate_id)?.enabled ?? item.enabled);
  const available = { ...catalog, automatic_candidates: enabledAutomatic.map((item) => item.candidate) };
  const patch = (aggregate, change) => {
    if (writable) update({ ...configuration, aggregates: configuration.aggregates.map((item) => item === aggregate ? { ...item, ...change } : item) });
  };
  const parentOf = (id2) => derivedParentId(id2, configuration.aggregates);
  const label = (source) => {
    try {
      return sourceFormula([source], catalog, configuration.aggregates);
    } catch {
      return "Unknown source";
    }
  };
  const rootOf = (id2, aggregates) => {
    const seen = /* @__PURE__ */ new Set();
    for (let next = derivedParentId(id2, aggregates); next !== null; next = derivedParentId(id2, aggregates)) {
      if (seen.has(id2)) throw new Error("Totals cannot form a cycle.");
      seen.add(id2);
      id2 = next;
    }
    return aggregates.find((item) => item.aggregate_id === id2);
  };
  const validateAddition = (aggregate, aggregates) => {
    for (const item of aggregates) {
      derivedParentId(item.aggregate_id, aggregates);
      for (const source of item.sources) if (source.kind === "aggregate") derivedParentId(source.aggregate_id, aggregates);
    }
    const root = rootOf(aggregate.aggregate_id, aggregates);
    sourceLeaves(root.sources, available, aggregates, [root.aggregate_id], aggregate.aggregate_id);
  };
  const sourceReason = (aggregate, source) => {
    if (aggregate.sources.some((item) => item.kind === "channel" !== (source.kind === "channel"))) return "Remove current sources before changing between CTs and totals.";
    if (source.kind !== "channel" && aggregate.measurement_method !== "direct") return "Nested totals require the Direct measurement method.";
    const max = aggregate.measurement_method === "direct" ? Infinity : aggregate.measurement_method === "two_ct_sum" ? 2 : 1;
    if (aggregate.sources.length >= max) return `This measurement method accepts ${max} CT${max === 1 ? "" : "s"}.`;
    try {
      if (source.kind === "aggregate") {
        const parent = parentOf(source.aggregate_id);
        if (parent && parent !== aggregate.aggregate_id) return "Already used by another total. Move it with Feeds into.";
        const candidate = configuration.aggregates.find((item) => item.aggregate_id === source.aggregate_id) ?? enabledAutomatic.find((item) => item.candidate.aggregate_id === source.aggregate_id)?.candidate;
        if (!candidate?.sources.length) return "Complete this child total's sources first.";
      }
      const changed = { ...aggregate, sources: [...aggregate.sources, source] };
      validateAddition(changed, configuration.aggregates.map((item) => item === aggregate ? changed : item));
      return "";
    } catch (error) {
      return errorText(error);
    }
  };
  const parentReason = (aggregate, parentId) => {
    if (parentId === null) return "";
    try {
      const moved = reparentAggregate(aggregate.aggregate_id, parentId, configuration.aggregates);
      validateAddition(moved.find((item) => item.aggregate_id === parentId), moved);
      return "";
    } catch (error) {
      return errorText(error);
    }
  };
  const add = () => {
    if (!writable) return;
    const ids = /* @__PURE__ */ new Set([...configuration.aggregates.map((item) => item.aggregate_id), ...catalog.automatic_candidates.map((item) => item.aggregate_id)]);
    let number2 = 1;
    while (ids.has(`aggregate-${number2}`)) number2++;
    update({ ...configuration, aggregates: [...configuration.aggregates, {
      aggregate_id: `aggregate-${number2}`,
      name: `Aggregate total ${number2}`,
      role: "branch",
      sources: [],
      measurement_method: "two_ct_sum",
      energy_mode: "consumption",
      outputs: { watts: true, amps: false, kwh: true },
      origin: "advanced"
    }] });
  };
  return b`<section aria-labelledby="advanced-totals-heading"><details class="advanced-totals"><summary id="advanced-totals-heading">Advanced totals</summary>
    ${!writable ? b`<p class="info-band" role="status">Aggregate editing unavailable: ${reason === "unmanaged_total_present" ? "This meter has legacy unmanaged totals." : "This meter does not expose managed totals."} Upgrade the meter configuration before editing aggregate totals. Existing aggregates remain reviewable.</p>` : A}
    ${!fresh ? b`<p class="info-band" role="status">Total graph unavailable or updating. You can still edit or remove draft sources; complete the graph before continuing.</p>` : A}
    ${fresh && catalog.stale_automatic_total_settings.length ? b`<p class="info-band" role="status">${catalog.stale_automatic_total_settings.length} inactive automatic settings are retained for this plan, not included in the active configuration.</p>` : A}
    <div class="aggregate-list">${configuration.aggregates.map((aggregate) => {
    let parent = "", problem = "", leaves = [], overlaps = false;
    try {
      parent = parentOf(aggregate.aggregate_id) ?? "";
      if (!aggregate.sources.length) throw new Error("Incomplete total: select at least one source.");
      const channels = aggregate.sources.filter((source) => source.kind === "channel");
      const needed = aggregate.measurement_method === "direct" ? null : aggregate.measurement_method === "two_ct_sum" ? 2 : 1;
      if (channels.length && channels.length !== aggregate.sources.length || needed !== null && (channels.length !== needed || channels.length !== aggregate.sources.length)) throw new Error("Incomplete total: check the measurement method and source class.");
      if (fresh) {
        leaves = sourceLeaves(aggregate.sources, available, configuration.aggregates, [aggregate.aggregate_id]);
        validateAddition(aggregate, configuration.aggregates);
        leaves = preview?.graph.leaf_channels[aggregate.aggregate_id] ?? leaves;
        overlaps = preview?.graph.independent_overlap_warnings.some((item) => item.first_id === aggregate.aggregate_id || item.second_id === aggregate.aggregate_id) ?? false;
        if (!preview && !parent) {
          const roots = [
            ...configuration.aggregates.filter((item) => item !== aggregate && !parentOf(item.aggregate_id)),
            ...enabledAutomatic.filter((item) => !parentOf(item.candidate.aggregate_id)).map((item) => item.candidate)
          ];
          overlaps = roots.some((item) => {
            try {
              return sourceLeaves(item.sources, available, configuration.aggregates, [item.aggregate_id]).some((channel) => leaves.includes(channel));
            } catch {
              return false;
            }
          });
        }
      }
    } catch (error) {
      problem = errorText(error);
    }
    const option = (source, text, accessibleLabel = text) => {
      const checked = aggregate.sources.some((item) => sameSource(item, source));
      const blocked = checked ? "" : sourceReason(aggregate, source);
      return b`<label class=${`aggregate-channel-option${checked ? " selected" : ""}`}><input type="checkbox" aria-label=${`${aggregate.name}: ${accessibleLabel}`} .checked=${checked} ?disabled=${!writable || Boolean(blocked)}
          @change=${(event) => {
        const input = event.target;
        if (!writable || input.checked && sourceReason(aggregate, source)) {
          input.checked = checked;
          return;
        }
        if (!input.checked && source.kind !== "channel" && !window.confirm(`Remove ${label(source)} from ${aggregate.name}?${source.kind === "aggregate" ? " It becomes an independent report." : ""}`)) {
          input.checked = checked;
          return;
        }
        patch(aggregate, { sources: input.checked ? [...aggregate.sources, source] : aggregate.sources.filter((item) => !sameSource(item, source)) });
      }} /><span>${text}${blocked ? b`<small class="source-explanation">${blocked}</small>` : A}</span></label>`;
    };
    const output = (key, text) => b`<label class="check-row"><input type="checkbox" aria-label=${`${aggregate.name} ${text}`} .checked=${aggregate.outputs[key]} ?disabled=${!writable || key === "kwh" && aggregate.energy_mode === "none"}
        @change=${(event) => {
      const input = event.target;
      if (!writable || key === "kwh" && aggregate.energy_mode === "none") {
        input.checked = aggregate.outputs[key];
        return;
      }
      patch(aggregate, { outputs: { ...aggregate.outputs, [key]: input.checked } });
    }} />${text}</label>`;
    const existing = [...enabledAutomatic.map((item) => item.candidate), ...configuration.aggregates.filter((item) => item !== aggregate)];
    const known = [
      ...catalog.native_sources.map((item) => ({ kind: "native_total", source_id: item.source_id })),
      ...existing.map((item) => ({ kind: "aggregate", aggregate_id: item.aggregate_id })),
      ...configuration.channels.filter((item) => item.enabled).map((item) => ({ kind: "channel", channel: item.channel }))
    ];
    return b`<fieldset class="aggregate-card" aria-label=${`${aggregate.name} aggregate`} ?disabled=${!writable}><legend>${aggregate.name}</legend>
        <div class="aggregate-fields">
          <label>Name <input aria-label=${`${aggregate.aggregate_id} aggregate name`} maxlength="64" .value=${aggregate.name}
            @input=${(event) => {
      const input = event.target;
      if (!writable) {
        input.value = aggregate.name;
        return;
      }
      patch(aggregate, { name: input.value });
    }} /></label>
          <label>Role <select aria-label=${`${aggregate.aggregate_id} aggregate role`} .value=${aggregate.role}
            @change=${(event) => {
      const input = event.target;
      if (!writable || !roles.includes(input.value)) {
        input.value = aggregate.role;
        return;
      }
      patch(aggregate, { role: input.value });
    }}>
            ${roles.map((role) => b`<option value=${role} ?selected=${role === aggregate.role}>${role === "grid" ? "Mains" : role === "branch" ? "Branch circuit" : role.replaceAll("_", " ")}</option>`)}</select></label>
          <label>Measurement method <select aria-label=${`${aggregate.aggregate_id} aggregate method`} .value=${aggregate.measurement_method}
            @change=${(event) => {
      const input = event.target;
      if (!writable || !methods.includes(input.value) || input.value !== "direct" && aggregate.sources.some((source) => source.kind !== "channel")) {
        input.value = aggregate.measurement_method;
        return;
      }
      patch(aggregate, { measurement_method: input.value });
    }}>${methods.map((method) => b`<option value=${method} ?selected=${method === aggregate.measurement_method} ?disabled=${method !== "direct" && aggregate.sources.some((source) => source.kind !== "channel")}>${method === "two_ct_sum" ? "Two CT Sum" : method.replaceAll("_", " ")}</option>`)}</select><small>Two CT Sum adds exactly two CTs. Nested totals use Direct.</small></label>
          <label>Energy behavior <select aria-label=${`${aggregate.aggregate_id} aggregate energy`} .value=${aggregate.energy_mode}
            @change=${(event) => {
      const input = event.target;
      if (!writable || !energyModes.includes(input.value)) {
        input.value = aggregate.energy_mode;
        return;
      }
      patch(aggregate, { energy_mode: input.value, outputs: { ...aggregate.outputs, kwh: input.value === "none" ? false : aggregate.outputs.kwh } });
    }}>${energyModes.map((mode) => b`<option value=${mode} ?selected=${mode === aggregate.energy_mode}>${mode[0].toUpperCase()}${mode.slice(1)}</option>`)}</select><small>kWh uses ESPHome platform: total_daily_energy, integrating this total's Watts rather than adding child kWh.</small></label>
          <label>Feeds into <select aria-label=${`${aggregate.name} Feeds into`} .value=${parent}
            @change=${(event) => {
      const input = event.target;
      try {
        if (!writable || parentReason(aggregate, input.value || null)) {
          input.value = parent;
          return;
        }
        if (parent && input.value === "" && !window.confirm(`Remove ${aggregate.name} from ${configuration.aggregates.find((item) => item.aggregate_id === parent)?.name}? It becomes an independent report.`)) {
          input.value = parent;
          return;
        }
        update({ ...configuration, aggregates: reparentAggregate(aggregate.aggregate_id, input.value || null, configuration.aggregates) });
      } catch {
        input.value = parent;
      }
    }}><option value="" ?selected=${!parent}>Independent report</option>${configuration.aggregates.filter((item) => item !== aggregate).map((item) => {
      const blocked = item.aggregate_id === parent ? "" : parentReason(aggregate, item.aggregate_id);
      return b`<option value=${item.aggregate_id} ?selected=${item.aggregate_id === parent} ?disabled=${Boolean(blocked)}>${item.name}${blocked ? ` — ${blocked}` : ""}</option>`;
    })}</select></label>
        </div>
        <p class="aggregate-formula">Formula: ${aggregate.sources.length ? aggregate.sources.map(label).join(" + ") : "Select sources"}</p>
        ${fresh && !problem ? b`<p>Coverage: ${coverageLabel(leaves)}</p>` : A}
        ${problem ? b`<p class="warning-band" role="status">${problem} Complete the total before continuing.</p>` : A}
        ${overlaps ? b`<p class="warning-band" role="note">This total overlaps another report. They are valid independently but must not be added together.</p>` : A}
        <p>Select CTs or totals, not both. Remove current sources before changing source class.</p>
        <fieldset class="aggregate-sources"><legend>Native totals</legend><div class="aggregate-source-options">${catalog.native_sources.map((item) => option({ kind: "native_total", source_id: item.source_id }, item.label))}</div></fieldset>
        <fieldset class="aggregate-sources"><legend>Existing totals</legend><div class="aggregate-source-options">${existing.map((item) => option({ kind: "aggregate", aggregate_id: item.aggregate_id }, item.name))}</div></fieldset>
        <fieldset class="aggregate-sources aggregate-channels"><legend>CTs</legend><div class="aggregate-channel-groups">${Array.from({ length: Math.ceil(configuration.channels.length / 6) }, (_2, board) => {
      const channels = configuration.channels.filter((item) => item.enabled && Math.floor((item.channel - 1) / 6) === board);
      return channels.length ? b`<section class="aggregate-channel-group" aria-label=${board ? `Add-on ${board} channels` : "Main Board channels"}><h4>${board ? `Add-on ${board}` : "Main Board"}</h4><div>${channels.map((item) => option({ kind: "channel", channel: item.channel }, `CT${item.channel} · ${drafts.get(item.channel)?.name ?? item.name}`, `CT${item.channel}`))}</div></section>` : A;
    })}</div></fieldset>
        ${aggregate.sources.filter((source) => !known.some((item) => sameSource(item, source))).map((source) => option(source, label(source)))}
        <div class="aggregate-actions">${output("watts", "Watts")}${output("amps", "Amps")}${output("kwh", "kWh")}
          <button class="secondary" data-action="delete-aggregate" @click=${() => {
      if (!writable) return;
      const parents = configuration.aggregates.filter((item) => item.sources.some((source) => source.kind === "aggregate" && source.aggregate_id === aggregate.aggregate_id));
      const children = aggregate.sources.filter((source) => source.kind === "aggregate").map(label);
      const message = `Delete ${aggregate.name}?${parents.length ? ` Remove it from ${parents.map((item) => item.name).join(" and ")}.` : ""}${children.length ? ` ${children.join(" and ")} will become independent reports.` : ""}`;
      if (!window.confirm(message)) return;
      update({ ...configuration, aggregates: configuration.aggregates.filter((item) => item !== aggregate).map((item) => ({
        ...item,
        sources: item.sources.filter((source) => source.kind !== "aggregate" || source.aggregate_id !== aggregate.aggregate_id)
      })) });
    }}>Delete total</button>
        </div>
        <details><summary>Advanced details</summary><p>Stable aggregate ID: <code>${aggregate.aggregate_id}</code></p></details>
      </fieldset>`;
  })}</div>
    ${writable ? b`<button class="secondary" data-action="add-aggregate" @click=${add}>Create aggregate total</button>` : A}
  </details></section>`;
}
function recommendedReportingMultiplier(ratedCurrentA) {
  if (!Number.isFinite(ratedCurrentA) || ratedCurrentA < 0) return null;
  return ratedCurrentA <= 65.535 ? 1 : ratedCurrentA <= 131.07 ? 2 : ratedCurrentA <= 262.14 ? 4 : ratedCurrentA <= 524.28 ? 8 : null;
}
const resultingGain = (preset, multiplier, customGain) => (preset?.default_gain_ct ?? customGain) == null || !Number.isFinite(multiplier) || multiplier <= 0 ? null : Math.round((preset?.default_gain_ct ?? customGain) / multiplier);
function ctInventoryStep(inventory, board, drafts, setBoard, update, back, review, labelOnly = false, busy = false, configuration = null, updateConfiguration = () => void 0, disableChannel = () => void 0, managedTotals = true, managedTotalsReason = "", allowPreserveExistingGain = false, continueAllowed = true, totals = null, nativeTotalsReadable = false, nativeTotalsWritable = false, nativePreview = null, freshTotals = true, nativeGraphState = "ready", automaticTotalsWritable = false, meterInventory = null, automaticSourcesFresh = freshTotals) {
  const boardCount = Math.ceil(inventory.channels.length / 6);
  const rows = inventory.channels.filter((channel) => channel.address.board_index === board).slice(0, 8);
  const referenceByGroup = new Map(configuration?.meter.voltage_references.flatMap((reference) => reference.group_keys.map((group) => [group, reference])) ?? []);
  const patchChannel = (channel, patch) => configuration && updateConfiguration({
    ...configuration,
    channels: configuration.channels.map((item) => item.channel === channel ? { ...item, ...patch } : item)
  });
  return b`
    <section class="step-content ct-step" aria-labelledby="step-heading">
      <p class="info-band">CT numbering starts at the top-left connector on each board and continues counterclockwise, then continues upward through the board stack. A circuit's voltage reference is determined by the physical voltage setup and cannot be changed in software.</p>
      <p class="warning-band" role="note"><strong>Physical work required:</strong> CT wiring and panel changes must be performed safely; the helper cannot verify them.</p>
      <div class="board-tabs" role="tablist" aria-label="Meter boards" aria-orientation="horizontal">
        ${Array.from({ length: boardCount }, (_2, index) => b`
          <button role="tab" id=${`board-tab-${index}`} data-board-tab=${index} aria-selected=${index === board}
            aria-controls="board-panel" tabindex=${index === board ? "0" : "-1"}
            @keydown=${(event) => moveTab(event, index)}
            @click=${() => setBoard(index)}>${index === 0 ? "Main Board" : `Add-on ${index}`}</button>
        `)}
      </div>
      <p>Choose the CT model and confirm each circuit. The helper selects the smallest safe reporting range automatically.</p>
      <div id="board-panel" role="tabpanel" aria-labelledby=${`board-tab-${board}`}>
      <div class="ct-table" role="table" aria-rowcount=${inventory.channels.length + 1}>
        <div class="ct-header" role="row" aria-rowindex="1">
          <span role="columnheader">CT</span><span role="columnheader">Used</span><span role="columnheader">Circuit name</span><span role="columnheader">Circuit type</span><span role="columnheader">CT model / rating</span><span role="columnheader">Range status</span>
        </div>
        <div class="ct-window" aria-label="Current transformers">
          ${rows.map((channel) => {
    const draft = drafts.get(channel.channel) ?? {
      name: channel.name,
      modelId: channel.selected_model_id ?? "",
      multiplier: channel.reporting_multiplier,
      burdenAcknowledged: false,
      expanded: false
    };
    const preset = inventory.catalog.presets.find((item) => item.model_id === draft.modelId);
    const gain = resultingGain(preset, draft.multiplier, draft.modelId === "custom" ? draft.customGainCt : void 0);
    const dirty = isDirty(channel, draft);
    const recommendation = preset ? recommendedReportingMultiplier(preset.rated_current_a) : null;
    const effectiveRange = draft.multiplier * 65.535;
    const circuit = configuration?.channels.find((item) => item.channel === channel.channel);
    const reference = referenceByGroup.get(`${channel.address.board_index === 0 ? "main" : `addon${channel.address.board_index}`}_${channel.address.group_index + 1}`);
    return b`
              <div class="ct-row" data-ct-row data-ct-group=${channel.address.group_index} role="row" aria-rowindex=${channel.channel + 1} aria-label=${`CT${channel.channel}`}>
                <strong class="ct-index" role="cell">CT${channel.channel}</strong>
                ${circuit ? b`<label role="cell" class="check-row"><span class="mobile-label">Used</span><input type="checkbox" aria-label=${`CT${channel.channel} used`} .checked=${circuit.enabled}
                  @change=${(event) => event.target.checked ? patchChannel(channel.channel, { enabled: true, role: circuit.role === "unused" ? "branch" : circuit.role }) : disableChannel(channel.channel)} /></label>` : b`<span role="cell"><span class="mobile-label">Used</span>—</span>`}
                <label role="cell"><span class="mobile-label">Circuit name</span><input aria-label=${`CT${channel.channel} name`} .value=${draft.name}
                  @input=${(event) => update(channel.channel, { name: event.target.value })} /></label>
                ${circuit ? b`<label role="cell"><span class="mobile-label">Circuit type</span><select aria-label=${`CT${channel.channel} role`} .value=${circuit.role} ?disabled=${!circuit.enabled}
                  @change=${(event) => patchChannel(channel.channel, { role: event.target.value })}>
                  ${ROLES.filter((role) => role !== "unused").map((role) => b`<option value=${role} ?selected=${role === circuit.role}>${roleLabel(role)}</option>`)}</select></label>` : b`<span role="cell"><span class="mobile-label">Role</span>—</span>`}
                <label role="cell"><span class="mobile-label">CT model / rating</span><select aria-label=${`CT${channel.channel} model`} .value=${draft.modelId} ?disabled=${labelOnly || draft.preserveExistingGain}
                  @change=${(event) => {
      const modelId = event.target.value;
      const selectedPreset = inventory.catalog.presets.find((item) => item.model_id === modelId);
      update(channel.channel, {
        modelId,
        preserveExistingGain: false,
        multiplier: draft.multiplierMode === "manual" ? draft.multiplier : selectedPreset ? recommendedReportingMultiplier(selectedPreset.rated_current_a) ?? draft.multiplier : draft.multiplier,
        multiplierMode: draft.multiplierMode ?? "automatic",
        burdenAcknowledged: channel.selection_verified_against_config && modelId === channel.selected_model_id && (modelId === "custom" || selectedPreset?.requires_burden_jumper_cut === true),
        expanded: true
      });
    }}>
                  <option value="" ?selected=${draft.modelId === ""}>Choose model</option>
                  ${inventory.catalog.presets.map((item) => b`<option value=${item.model_id} ?selected=${draft.modelId === item.model_id}>${item.label}</option>`)}
                  <option value="custom" ?selected=${draft.modelId === "custom"}>Custom</option>
                </select>${preset ? b`<small>${preset.rated_current_a} A</small>` : A}<button class="row-toggle" aria-label=${`CT${channel.channel} technical details`} aria-expanded=${draft.expanded} @click=${() => update(channel.channel, { expanded: !draft.expanded })}>${draft.modelId ? dirty ? "Changed" : "OK" : "Choose model"}</button><span class="sr-status" data-voltage-reference>${reference?.label || reference?.reference_id || circuit?.voltage_reference_id || "—"}</span></label>
                <span role="cell"><span class="mobile-label">Range status</span>${draft.preserveExistingGain ? "Existing gain kept" : recommendation === null && preset ? "Rating exceeds ×8 range" : effectiveRange < (preset?.rated_current_a ?? 0) ? `Too small: ${effectiveRange} A` : `Up to ${effectiveRange} A`}</span>
              </div>
              ${allowPreserveExistingGain && !channel.selection_verified_against_config && channel.raw_gain_ct > 0 ? b`<label class="check-row preserve-gain"><input type="checkbox" aria-label=${`CT${channel.channel} keep existing gain`} ?disabled=${labelOnly} .checked=${draft.preserveExistingGain === true}
                @change=${(event) => update(channel.channel, { preserveExistingGain: event.target.checked, expanded: true })} />Keep existing gain; CT model not recorded.</label>` : A}
              ${draft.modelId === "custom" && draft.expanded ? b`<div class="ct-detail custom-fields">
                <label>Custom gain <input type="number" min="1" max="65535" step="1" aria-label=${`CT${channel.channel} custom gain`}
                  ?disabled=${labelOnly}
                  .value=${draft.customGainCt === void 0 ? "" : String(draft.customGainCt)}
                  @input=${(event) => update(channel.channel, { customGainCt: Number(event.target.value) })} /></label>
                <label>Custom label <input maxlength="64" aria-label=${`CT${channel.channel} custom label`} ?disabled=${labelOnly} .value=${draft.customLabel ?? ""}
                  @input=${(event) => update(channel.channel, { customLabel: event.target.value })} /></label>
              </div>` : A}
              ${draft.expanded && (draft.modelId === "custom" || preset?.requires_burden_jumper_cut) ? b`<div class="warning-band">
                <label class="check-row"><input type="checkbox" aria-label=${`CT${channel.channel} burden output acknowledgement`}
                  ?disabled=${labelOnly}
                  .checked=${draft.burdenAcknowledged}
                  @change=${(event) => update(channel.channel, { burdenAcknowledged: event.target.checked })} />
                  I checked the burden-output requirement for CT${channel.channel}</label>
              </div>` : A}
              ${!draft.preserveExistingGain && preset && (recommendation === null || effectiveRange < preset.rated_current_a) ? b`<div class="warning-band" role="status">CT${channel.channel}: this selection needs a range of at least ${preset.rated_current_a} A. Continue is blocked.</div>` : A}
              <details class="technical-details" ?open=${draft.expanded}><summary>Technical details</summary>
                <dl class="ct-detail">
                  <div><dt>Raw gain</dt><dd>${channel.raw_gain_ct}</dd></div>
                  <div><dt>Divided gain</dt><dd>${gain ?? "—"}</dd></div>
                  <div><dt>Voltage reference</dt><dd data-voltage-reference>${reference?.label || reference?.reference_id || circuit?.voltage_reference_id || "—"}</dd></div>
                  <div><dt>Reporting multiplier</dt><dd><label><input type="checkbox" aria-label=${`CT${channel.channel} manual multiplier`} ?checked=${draft.multiplierMode === "manual"} ?disabled=${labelOnly || draft.preserveExistingGain}
                    @change=${(event) => update(channel.channel, { multiplierMode: event.target.checked ? "manual" : "automatic", multiplier: event.target.checked ? draft.multiplier : recommendation ?? draft.multiplier })} /> Manual override</label>
                    <select aria-label=${`CT${channel.channel} multiplier`} .value=${String(draft.multiplier)} ?disabled=${labelOnly || draft.preserveExistingGain || draft.multiplierMode !== "manual"}
                      @change=${(event) => update(channel.channel, { multiplier: Number(event.target.value), multiplierMode: "manual" })}>${[1, 2, 4, 8].map((value) => b`<option value=${value} ?selected=${draft.multiplier === value}>×${value}</option>`)}</select></dd></div>
                  <div><dt>Rated current</dt><dd>${preset?.rated_current_a ?? "Custom"}${preset ? " A" : ""}</dd></div>
                  <div><dt>Output</dt><dd>${preset?.secondary ?? "Custom"}</dd></div>
                  <div><dt>Official default gain</dt><dd>${preset?.default_gain_ct ?? "Custom"}</dd></div>
                  <div><dt>Burden note</dt><dd>${preset?.notes || (preset?.requires_burden_jumper_cut ? "Review burden jumper." : "No special burden change.")}</dd></div>
                </dl>
              </details>
            `;
  })}
        </div>
      </div>
      </div>
      <p class="row-count">Showing ${rows[0]?.channel ?? 0}–${rows.at(-1)?.channel ?? 0} of ${inventory.channels.length} CTs</p>
      ${configuration && meterInventory ? totalsMigrationReview(meterInventory, updateConfiguration, nativePreview, freshTotals) : A}
      ${configuration && totals ? defaultTotalsSection(configuration, totals, nativeTotalsReadable, nativeTotalsWritable, updateConfiguration, nativePreview, nativeGraphState) : A}
      ${configuration && totals ? automaticTotalsSection(configuration, freshTotals ? totals : null, automaticTotalsWritable, updateConfiguration) : A}
      ${configuration ? advancedTotalsEditor(configuration, drafts, updateConfiguration, managedTotals, managedTotalsReason, totals, nativePreview, freshTotals, automaticSourcesFresh) : A}
      <footer class="action-footer">
        <button class="secondary" @click=${back}>Back</button>
        <button class="primary" data-action="continue" ?disabled=${busy || !continueAllowed || !draftsAreValid(inventory, drafts, labelOnly)} @click=${review}>${busy ? "Starting calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const ROLES = ["grid", "solar", "generator", "subpanel", "branch", "two_pole", "custom", "unused"];
function roleLabel(role) {
  return role === "grid" ? "Mains" : role === "branch" ? "Branch circuit" : role.replaceAll("_", " ");
}
const channelSources = (aggregate) => aggregate.sources.flatMap((source) => source.kind === "channel" ? [source.channel] : []);
function circuitConfigurationIsValid(configuration, ctCount) {
  const references = new Set(configuration.meter.voltage_references.map((reference) => reference.reference_id));
  const referenceByGroup = new Map(configuration.meter.voltage_references.flatMap((reference) => reference.group_keys.map((group) => [group, reference.reference_id])));
  if (configuration.channels.length !== ctCount || new Set(configuration.channels.map((channel) => channel.channel)).size !== ctCount || configuration.channels.some((channel) => channel.channel < 1 || channel.channel > ctCount || !channel.name.trim() || !references.has(channel.voltage_reference_id) || channel.enabled === (channel.role === "unused") || referenceByGroup.get(`${channel.channel <= 6 ? "main" : `addon${Math.floor((channel.channel - 1) / 6)}`}_${Math.floor((channel.channel - 1) % 6 / 3) + 1}`) !== channel.voltage_reference_id)) return false;
  const ids = /* @__PURE__ */ new Set();
  try {
    for (const aggregate of configuration.aggregates) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(aggregate.aggregate_id) || ids.has(aggregate.aggregate_id) || !aggregate.name.trim() || !aggregate.sources.length || new Set(aggregate.sources.map((source) => JSON.stringify(source))).size !== aggregate.sources.length) return false;
      ids.add(aggregate.aggregate_id);
      const needed = aggregate.measurement_method === "two_ct_sum" ? 2 : aggregate.measurement_method === "direct" ? void 0 : 1;
      const channels = channelSources(aggregate);
      if (channels.length && channels.length !== aggregate.sources.length || needed !== void 0 && (channels.length !== needed || channels.length !== aggregate.sources.length) || aggregate.energy_mode === "none" && aggregate.outputs.kwh || channels.some((channel) => channel < 1 || channel > ctCount || !configuration.channels[channel - 1]?.enabled)) return false;
      const parent = derivedParentId(aggregate.aggregate_id, configuration.aggregates);
      reparentAggregate(aggregate.aggregate_id, parent, configuration.aggregates);
    }
  } catch {
    return false;
  }
  return true;
}
function changesFromDrafts(inventory, drafts) {
  return inventory.channels.flatMap((channel) => {
    const draft = drafts.get(channel.channel);
    if (!draft || !isDirty(channel, draft)) return [];
    if (draft.preserveExistingGain) return [{
      channel: channel.channel,
      name: draft.name.trim(),
      model_id: channel.selected_model_id ?? "",
      reporting_multiplier: channel.reporting_multiplier
    }];
    const preset = inventory.catalog.presets.find((item) => item.model_id === draft.modelId);
    const change = { channel: channel.channel, name: draft.name.trim(), model_id: draft.modelId, reporting_multiplier: draft.multiplier };
    if (draft.modelId === "custom") {
      if (draft.customGainCt !== void 0) change.custom_gain_ct = draft.customGainCt;
      if (draft.customLabel !== void 0) change.custom_label = draft.customLabel.trim();
      change.burden_output_acknowledged = draft.burdenAcknowledged;
    } else if (preset?.requires_burden_jumper_cut) {
      change.burden_output_acknowledged = draft.burdenAcknowledged;
    }
    return [change];
  });
}
function isDirty(channel, draft) {
  if (draft.preserveExistingGain) return draft.name !== channel.name;
  return draft.name !== channel.name || draft.modelId !== (channel.selected_model_id ?? "") || draft.multiplier !== channel.reporting_multiplier || draft.modelId === "custom" && (resultingGain(void 0, draft.multiplier, draft.customGainCt) !== channel.raw_gain_ct || (draft.customLabel?.trim() ?? "") !== (channel.display_label ?? ""));
}
function validDraft(inventory, draft) {
  if (draft.preserveExistingGain) return true;
  if (!draft.name.trim() || !draft.modelId || ![1, 2, 4, 8].includes(draft.multiplier)) return false;
  if (draft.modelId === "custom") return Number.isInteger(draft.customGainCt) && draft.customGainCt >= 1 && draft.customGainCt <= 65535 && Boolean(draft.customLabel?.trim()) && !/[\r\n]/.test(draft.customLabel) && draft.burdenAcknowledged;
  const preset = inventory.catalog.presets.find((item) => item.model_id === draft.modelId);
  return Boolean(preset) && effectiveRangeIsSafe(preset, draft.multiplier) && (!preset?.requires_burden_jumper_cut || draft.burdenAcknowledged);
}
function effectiveRangeIsSafe(preset, multiplier) {
  return multiplier * 65.535 >= preset.rated_current_a;
}
function draftsAreValid(inventory, drafts, labelOnly = false) {
  if (labelOnly) return [...drafts].every(([channel, draft]) => {
    const current = inventory.channels.find((item) => item.channel === channel);
    return Boolean(current) && Boolean(draft.name.trim());
  });
  for (const channel of inventory.channels) {
    const draft = drafts.get(channel.channel);
    if (!draft) return false;
    if (!validDraft(inventory, draft)) return false;
  }
  return true;
}
const formatNumber = (value) => value.toFixed(2);
function calibrationProgress(referenceReady, stability2, result, plan = "full") {
  const labels = plan === "standard" ? ["Set reference", "Check stability", "Run calibration", "Verify gain"] : ["Set reference", "Check stability", "Run calibration", "Verify gain", "Zero reference"];
  const complete = labels.map((_2, index) => index < 4 ? [referenceReady, Boolean(stability2?.stable), Boolean(result), Boolean(result?.gain_evidence)][index] : Boolean(result));
  const active = complete.findIndex((value) => !value);
  return b`<ol class="progress-steps">${labels.map((label, index) => b`<li
    class=${complete[index] ? "complete" : index === active ? "active" : "pending"}><span
      class="progress-number">${index + 1}</span><span>${label}</span></li>`)}</ol>`;
}
function calibrationSourceEvidence(session2, instanceIds, target, completedInstanceIds) {
  const sources = Object.entries(session2?.calibration_sources ?? {}).filter(([instance]) => instanceIds.includes(instance));
  return b`<section class="measurement-evidence calibration-source" aria-label=${`${target} calibration source`}>
    <h3>Active gain source</h3>
    ${sources.length ? b`<table><thead><tr><th>Chip</th><th>Active gain source</th><th>${target} calibrated this session</th></tr></thead><tbody>
      ${sources.map(([instance, source]) => b`<tr><td>${instance}</td><td>${source === "flash" ? "Saved flash" : source === "configuration" ? "Configuration" : "Unknown"}</td><td>${completedInstanceIds.has(instance) ? "Yes" : "No"}</td></tr>`)}
    </tbody></table><p>ATM90E32 stores voltage and current gains in one table. The active source does not mean this calibration step was completed.</p>` : b`<p>Calibration source is not available.</p>`}
  </section>`;
}
function stabilityEvidence(result, labels) {
  if (!result) return A;
  const unit = result.target === "voltage" ? "V" : "A";
  return b`<section class="measurement-evidence" aria-label=${`${result.target} ${result.target_id} stability evidence`}>
    <h3>Stability evidence · ${result.target_id}</h3>
    ${result.windows.map((window2, index) => b`<dl>
      <div><dt>${labels?.[index] ?? (result.target === "voltage" ? `V${index % 3 + 1}` : `A${index + 1}`)}</dt>
        <dd>${window2.samples.map((value) => `${formatNumber(value)} ${unit}`).join(", ")}</dd></div>
    </dl>`)}
  </section>`;
}
function calibrationEvidence(result) {
  if (!result) return A;
  return b`<section class="measurement-evidence" aria-label="Calibration evidence">
    <h3>Calibration iteration ${result.iteration}</h3>
    <dl>
        <details><summary>Technical details</summary><div><dt>Backend state</dt><dd>${result.state}</dd></div></details>
      <div><dt>Changed channels</dt><dd>${result.changed_channels.join(", ") || "None"}</dd></div>
      <div><dt>Before</dt><dd>${result.before_values.map(formatNumber).join(", ") || "Unavailable"}</dd></div>
      <div><dt>After</dt><dd>${result.after_values.map(formatNumber).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Error</dt><dd>${result.error_percent_values.map((value) => `${formatNumber(value)}%`).join(", ") || "Unavailable"}</dd></div>
      <div><dt>Restore evidence</dt><dd>${result.restore_evidence ? "Available" : "Unavailable"}</dd></div>
    </dl>
    ${result.gain_evidence ? b`<h4>Gain evidence · ${result.gain_evidence.instance_id ?? "Unknown chip"}</h4>
      <table class="gain-evidence"><thead><tr><th>Phase</th><th>Measured V</th><th>Measured A</th><th>Reference V</th><th>Reference A</th><th>Voltage gain</th><th>Current gain</th></tr></thead><tbody>
        ${result.gain_evidence.phases?.map((phase) => b`<tr><td>${phase.phase}</td><td>${formatNumber(phase.measured_voltage)}</td><td>${formatNumber(phase.measured_current)}</td><td>${formatNumber(phase.reference_voltage)}</td><td>${formatNumber(phase.reference_current)}</td><td>${phase.old_voltage_gain} → ${phase.new_voltage_gain}</td><td>${phase.old_current_gain} → ${phase.new_current_gain}</td></tr>`) ?? A}
      </tbody></table><p>Saved in flash: ${result.gain_evidence.flash_saved ? "Yes" : "No"}</p>` : b`<p>Gain evidence unavailable.</p>`}
  </section>`;
}
function currentStep(topology2, inventory, session2, channel, references, reportingMultiplier, stability2, result, completedInstanceIds, select, setReference, setReportingMultiplier, check, calibrate, reconnect, cancel, busy = false) {
  const ctCount = topology2?.ct_count ?? inventory?.channels.length ?? 6;
  const board = Math.floor((channel - 1) / 6);
  const group = Math.floor((channel - 1) / 3);
  const first = group * 3 + 1;
  const channels = Array.from({ length: 3 }, (_2, index) => first + index).filter((value) => value <= ctCount);
  const selected = channels.filter((value) => (references.get(value) ?? 0) > 0);
  const sourceIds = board === 0 ? ["meter_main1", "meter_main2"] : [`addon${board}_1`, `addon${board}_2`];
  const multiplierRequired = inventory === null;
  const multiplierValid = reportingMultiplier !== null && [1, 2, 4, 8].includes(reportingMultiplier);
  const referenceReady = selected.length > 0 && (!multiplierRequired || multiplierValid);
  return b`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${calibrationProgress(referenceReady, stability2, result, session2?.calibration_plan ?? "full")}
      <div class="board-tabs" role="tablist" aria-label="Calibration boards">
        ${Array.from({ length: Math.ceil(ctCount / 6) }, (_2, index) => b`<button role="tab"
          id=${`current-board-tab-${index}`} aria-controls="current-board-panel"
          aria-selected=${index === board} tabindex=${index === board ? "0" : "-1"}
          @keydown=${(event) => moveTab(event, index)}
          @click=${() => select(index * 6 + 1)}>${index === 0 ? "Main Board" : `Add-on ${index}`}</button>`)}
      </div>
      <div id="current-board-panel" role="tabpanel" aria-labelledby=${`current-board-tab-${board}`}>
      <div class="target-tabs" aria-label="Current calibration groups">
        ${[0, 1].map((offset) => {
    const value = board * 6 + offset * 3 + 1;
    return b`<button
          aria-pressed=${value === first} @click=${() => select(value)}>Group ${board * 2 + offset + 1}</button>`;
  })}
      </div>
      <h2>Calibrate CT${first}–CT${first + 2}</h2>
      <p>Blank entries keep the existing gains. Select a reference only for channels you want to calibrate.</p>
      ${calibrationSourceEvidence(session2, sourceIds, "Current", completedInstanceIds)}
      <div class="reference-block">
        ${channels.map((value) => b`<label>CT${value} · ${inventory?.channels.find((item) => item.channel === value)?.name ?? "Unnamed circuit"} reference (A)
          <input data-current-reference=${value} aria-label=${`CT${value} reference`} type="number" min="0.01" step="0.01"
            .value=${references.has(value) ? String(references.get(value)) : ""}
            @input=${(event) => {
    const input = event.target;
    setReference(value, input.value === "" ? null : Number(input.value));
  }} /></label>`)}
      ${multiplierRequired ? b`<label>Reporting multiplier <select data-role="reporting-multiplier" required @change=${(event) => {
    const value = Number(event.target.value);
    setReportingMultiplier(value || null);
  }}><option value="" ?selected=${reportingMultiplier === null}>Choose multiplier</option>${[1, 2, 4, 8].map((value) => b`<option value=${value} ?selected=${reportingMultiplier === value}>${value}</option>`)}</select></label><p>ESPHome source editing is unavailable, so the multiplier cannot be read from authoritative configuration. Choose it explicitly.</p>` : ""}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${check} ?disabled=${busy || !referenceReady}>${busy ? "Loading live current data…" : "Check stability"}</button>
        <button class="primary" @click=${calibrate} ?disabled=${busy || !referenceReady || !stability2?.stable || (result?.iteration ?? 0) >= 3 || Boolean(result && !result.retry_allowed && result.iteration > 0)}>${result?.retry_allowed ? "Retry current calibration" : "Calibrate current"}</button></div>
      ${stability2 ? b`<div class=${stability2.stable ? "success-band" : "warning-band"} role="status">${stability2.stable ? "Stable and ready for calibration." : stability2.windows.length ? "Data is changing too much; keep the load steady." : "Waiting for live data…"}</div>` : ""}
      ${stabilityEvidence(stability2, selected.map((value) => `CT${value}`))}
      ${result?.state === "applied_pending_restart_verification" ? b`<div class="success-band" role="status">Current calibration complete for CT${first}–CT${first + 2}.</div>` : ""}
      ${calibrationEvidence(result)}
      ${result?.state.includes("indeterminate") ? b`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${reconnect}>Reconnect and inspect</button><button class="danger" @click=${cancel}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const FEATURES = [
  ["power_quality", "Power quality sensors"],
  ["status_fields", "Status fields"]
];
const newInstallPackageOptions = (addonCount) => ({
  power_quality: Array(addonCount + 1).fill(false),
  status_fields: [true, ...Array(addonCount).fill(false)]
});
const resizePackageOptions = (options, addonCount) => {
  const defaults = newInstallPackageOptions(addonCount);
  return {
    power_quality: defaults.power_quality.map((value, index) => options.power_quality[index] ?? value),
    status_fields: defaults.status_fields.map((value, index) => options.status_fields[index] ?? value)
  };
};
function packageOptions(options, change) {
  return b`<section class="package-options" aria-labelledby="package-options-heading">
    <h2 id="package-options-heading">Optional meter fields</h2>
    <p>Choose which meter boards expose additional power quality and status entities.</p>
    <table class="package-options-table">
      <thead><tr><th scope="col">Board</th>${FEATURES.map(([_feature, label]) => b`<th scope="col">${label}</th>`)}</tr></thead>
      <tbody>
        <tr><th scope="row">All boards</th>${FEATURES.map(([feature, label]) => {
    const states = options[feature];
    const all = states.every(Boolean);
    return b`<td><input type="checkbox" data-all-feature=${feature} aria-label=${`All boards ${label}`}
            .checked=${all} .indeterminate=${states.some(Boolean) && !all}
            @change=${(event) => change({
      ...options,
      [feature]: states.map(() => event.currentTarget.checked)
    })} /></td>`;
  })}</tr>
        ${options.power_quality.map((_enabled, board) => b`<tr>
          <th scope="row">${board === 0 ? "Main board" : `Add-on ${board}`}</th>
          ${FEATURES.map(([feature, label]) => b`<td><input type="checkbox" data-feature=${feature} data-board=${board}
            aria-label=${`${board === 0 ? "Main board" : `Add-on ${board}`} ${label}`} .checked=${options[feature][board] ?? false}
            @change=${(event) => change({
    ...options,
    [feature]: options[feature].map((value, index) => index === board ? event.currentTarget.checked : value)
  })} /></td>`)}
        </tr>`)}
      </tbody>
    </table>
  </section>`;
}
const SYSTEMS = [
  ["split_phase_120_240", "Split phase 120/240 V"],
  ["single_phase_230", "Single phase 230 V"],
  ["three_phase", "Three phase"],
  ["custom", "Custom"]
];
const INTERVALS = [1, 2, 5, 10, 30, 60];
const intervalImpact = (interval) => interval <= 5 ? "1–5 seconds: high traffic." : interval === 10 ? null : interval >= 30 ? "30–60 seconds: lower traffic; guided calibration takes longer." : "This interval affects update traffic and guided calibration time.";
function meterSettingsStep(draft, catalog, acknowledged, update, setProfile, setFrequency, setNominalVoltage, setAcknowledged, back, continueToCircuits, boardPackages = null, setBoardPackages = () => void 0, profileConfirmed = true, setProfileConfirmed = () => void 0, mode = "helper_managed") {
  const multiReference = draft.voltage_references.length > 1;
  const primaryReference = draft.voltage_references[0];
  const valid = profileConfirmed && Boolean(draft.friendly_name.trim()) && draft.voltage_references.every((reference) => reference.label.trim() && reference.phase_label.trim() && Number.isFinite(reference.nominal_voltage_v) && reference.nominal_voltage_v >= 1 && reference.nominal_voltage_v <= 600 && Number.isInteger(reference.gain_voltage) && reference.gain_voltage >= 1 && reference.gain_voltage <= 65535 && reference.group_keys.length) && (!multiReference || acknowledged);
  const patch = (change) => {
    setAcknowledged(false);
    update({ ...draft, ...change });
  };
  const setTransformer = (referenceId, model) => {
    const preset = catalog.presets.find((item) => item.model_id === model);
    patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === referenceId ? { ...item, transformer_model_id: model, gain_voltage: preset?.default_gain_voltage ?? item.gain_voltage } : item) });
  };
  const moveGroup = (group, referenceId, select) => {
    const source = draft.voltage_references.find((reference) => reference.group_keys.includes(group));
    const target = draft.voltage_references.find((reference) => reference.reference_id === referenceId);
    if (!source || !target || source === target) return;
    const replacement = source.group_keys.length === 1 ? target.group_keys[0] : void 0;
    if (replacement && !window.confirm(`Moving ${group} would empty ${source.label || source.reference_id}. Confirm the disclosed swap with ${replacement}.`)) {
      select.value = source.reference_id;
      return;
    }
    patch({ voltage_references: draft.voltage_references.map((reference) => ({
      ...reference,
      group_keys: reference === source ? replacement ? [replacement] : reference.group_keys.filter((key) => key !== group) : reference === target ? [...reference.group_keys.filter((key) => key !== replacement), group] : reference.group_keys
    })) });
  };
  const addableGroups = draft.voltage_references.flatMap((reference) => reference.group_keys.length > 1 ? reference.group_keys : []);
  const addReference = (event) => {
    const select = event.currentTarget.parentElement?.querySelector("[data-new-reference-group]");
    const group = select?.value;
    const source = draft.voltage_references.find((reference) => group && reference.group_keys.includes(group));
    if (!group || !source || source.group_keys.length < 2) return;
    const ids = new Set(draft.voltage_references.map((reference) => reference.reference_id));
    let suffix = 2;
    while (ids.has(`reference-${suffix}`)) suffix++;
    const referenceId = `reference-${suffix}`;
    patch({ voltage_layout: "multi_reference", voltage_references: [
      ...draft.voltage_references.map((reference) => reference === source ? { ...reference, group_keys: reference.group_keys.filter((key) => key !== group) } : reference),
      { ...source, reference_id: referenceId, label: `Reference ${suffix}`, phase_label: String(suffix), group_keys: [group] }
    ] });
  };
  const removeReference = (referenceId) => {
    const source = draft.voltage_references.find((reference) => reference.reference_id === referenceId);
    const target = draft.voltage_references.find((reference) => reference.reference_id !== referenceId);
    if (!source || !target || !window.confirm(`Remove ${source.label || source.reference_id} and reassign ${source.group_keys.join(", ")} to ${target.label || target.reference_id}?`)) return;
    const references = draft.voltage_references.filter((reference) => reference !== source).map((reference) => reference === target ? { ...reference, group_keys: [...reference.group_keys, ...source.group_keys].sort() } : reference);
    patch({ voltage_layout: references.length === 1 ? "standard" : "multi_reference", voltage_references: references });
  };
  return b`
    <section class="step-content meter-settings-step" aria-labelledby="step-heading">
      <h2>Meter settings</h2>
      <p>These authoritative values will be installed on the meter configuration.</p>
      ${mode === "legacy_editable" ? b`<p class="warning-band" role="status">The existing profile identity was not recorded. Confirm it before continuing.</p>` : A}
      <div class="meter-settings-grid">
        <label>Friendly name <input aria-label="Friendly name" maxlength="64" .value=${draft.friendly_name}
          @input=${(event) => patch({ friendly_name: event.target.value })} /></label>
        <label>Electrical system <select aria-label="Electrical system" .value=${draft.electrical_system}
          @change=${(event) => setProfile(event.target.value)}>${SYSTEMS.map(([value, label]) => b`<option value=${value}>${label}</option>`)}</select></label>
        <label>Line frequency (N. America: 60Hz) <select aria-label="Line frequency" .value=${String(draft.line_frequency_hz)}
          @change=${(event) => setFrequency(Number(event.target.value))}>${[50, 60].map((value) => b`<option value=${value} ?selected=${draft.line_frequency_hz === value}>${value} Hz</option>`)}</select></label>
        <label>Reporting interval (default: 10 seconds) <select aria-label="Reporting interval" .value=${String(draft.update_interval_s)}
          @change=${(event) => patch({ update_interval_s: Number(event.target.value) })}>${INTERVALS.map((value) => b`<option value=${value} ?selected=${draft.update_interval_s === value}>${value} seconds</option>`)}</select></label>
        <label>Transformer <select aria-label=${`${primaryReference.reference_id} transformer`} .value=${primaryReference.transformer_model_id}
          @change=${(event) => setTransformer(primaryReference.reference_id, event.target.value)}>
          ${catalog.presets.map((preset) => b`<option value=${preset.model_id}>${preset.label}</option>`)}
          <option value="custom">Custom starting gain</option>
          ${primaryReference.transformer_model_id !== "custom" && !catalog.presets.some((preset) => preset.model_id === primaryReference.transformer_model_id) ? b`<option value=${primaryReference.transformer_model_id}>${primaryReference.transformer_model_id}</option>` : ""}</select></label>
      </div>
      ${intervalImpact(draft.update_interval_s) ? b`<p class="info-band" role="status">${intervalImpact(draft.update_interval_s)}</p>` : A}
      <h3>Voltage references</h3>
      <p class="info-band">The configured voltage-reference setup must match the meter's physical voltage wiring. By default, the main-board voltage reference applies to every board.</p>
      <details data-section="advanced-voltage-options"><summary>Advanced voltage options</summary><div class="voltage-reference-cards">${draft.voltage_references.map((reference) => b`
        <section class="voltage-reference-card" aria-label=${`${reference.label} voltage reference`}>
          <label>Label <input aria-label=${`${reference.reference_id} label`} maxlength="64" .value=${reference.label}
            @input=${(event) => patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, label: event.target.value } : item) })} /></label>
          ${reference !== primaryReference ? b`<label>Transformer <select aria-label=${`${reference.reference_id} transformer`} .value=${reference.transformer_model_id}
            @change=${(event) => setTransformer(reference.reference_id, event.target.value)}>
            ${catalog.presets.map((preset) => b`<option value=${preset.model_id}>${preset.label}</option>`)}
            <option value="custom">Custom starting gain</option>
            ${reference.transformer_model_id !== "custom" && !catalog.presets.some((preset) => preset.model_id === reference.transformer_model_id) ? b`<option value=${reference.transformer_model_id}>${reference.transformer_model_id}</option>` : ""}</select></label>` : A}
          ${reference.transformer_model_id !== "custom" ? b`<p>Starting gain: ${reference.gain_voltage}</p>` : b`<label>Custom voltage gain <input aria-label=${`${reference.reference_id} custom voltage gain`} type="number" min="1" max="65535" step="1" .value=${String(reference.gain_voltage)}
            @input=${(event) => patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, gain_voltage: Number(event.target.value) } : item) })} /></label>
          `}
          ${["three_phase", "custom"].includes(draft.electrical_system) ? b`<label>Nominal voltage <input aria-label=${`${reference.reference_id} nominal voltage`} type="number" min="1" max="600" step="0.1" .value=${String(reference.nominal_voltage_v)}
            @input=${(event) => setNominalVoltage(reference.reference_id, Number(event.target.value))} /></label>` : A}
          ${draft.voltage_references.length > 1 ? b`<button class="secondary" aria-label=${`Remove ${reference.reference_id} voltage reference`} @click=${() => removeReference(reference.reference_id)}>Remove reference</button>` : ""}
        </section>`)}
      </div></details>
      <details data-section="advanced-meter-settings"><summary>Advanced meter settings</summary>
      ${boardPackages ? packageOptions(boardPackages, setBoardPackages) : ""}
      ${draft.voltage_references.map((reference) => b`<label>Phase label <input aria-label=${`${reference.reference_id} phase label`} maxlength="64" .value=${reference.phase_label}
            @input=${(event) => patch({ voltage_references: draft.voltage_references.map((item) => item.reference_id === reference.reference_id ? { ...item, phase_label: event.target.value } : item) })} /></label>`)}
      ${addableGroups.length ? b`<div class="reference-block"><label>Group transferred to new reference <select data-new-reference-group aria-label="Group transferred to new reference">${addableGroups.map((group) => b`<option value=${group}>${group}</option>`)}</select></label><button class="secondary" data-action="add-voltage-reference" @click=${addReference}>Add voltage reference</button></div>` : ""}
      <h3>Voltage group assignment</h3>
      <div class="meter-settings-grid">${draft.voltage_references.flatMap((reference) => reference.group_keys).sort().map((group) => b`<label>${group}<select aria-label=${`${group} voltage reference`} .value=${draft.voltage_references.find((reference) => reference.group_keys.includes(group))?.reference_id ?? ""}
        @change=${(event) => moveGroup(group, event.target.value, event.target)}>${draft.voltage_references.map((reference) => b`<option value=${reference.reference_id}>${reference.label || reference.reference_id}</option>`)}</select></label>`)}</div>
      ${multiReference ? b`<label class="check-row"><input type="checkbox" aria-label="Multi-reference preparation acknowledgement" .checked=${acknowledged}
        @change=${(event) => setAcknowledged(event.target.checked)} />I prepared the separate voltage references.</label>` : ""}
      </details>
      <label class="check-row"><input type="checkbox" aria-label="Confirm electrical profile" .checked=${profileConfirmed}
        @change=${(event) => setProfileConfirmed(event.target.checked)} />I confirm the electrical profile and frequency.</label>
      <footer class="action-footer"><button class="secondary" @click=${back}>Back</button><button class="primary" data-action="continue-meter-settings" ?disabled=${!valid} @click=${continueToCircuits}>Continue to Circuits & CTs</button></footer>
    </section>
  `;
}
const n$2 = (o2) => null === o2 || "object" != typeof o2 && "function" != typeof o2, r$1 = (o2) => void 0 === o2.strings;
const t = { CHILD: 2 }, e = (t2) => (...e2) => ({ _$litDirective$: t2, values: e2 });
let i$1 = class i2 {
  constructor(t2) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t2, e2, i4) {
    this._$Ct = t2, this._$AM = e2, this._$Ci = i4;
  }
  _$AS(t2, e2) {
    return this.update(t2, e2);
  }
  update(t2, e2) {
    return this.render(...e2);
  }
};
const s$1 = (i4, t2) => {
  const e2 = i4._$AN;
  if (void 0 === e2) return false;
  for (const i5 of e2) i5._$AO?.(t2, false), s$1(i5, t2);
  return true;
}, o = (i4) => {
  let t2, e2;
  do {
    if (void 0 === (t2 = i4._$AM)) break;
    e2 = t2._$AN, e2.delete(i4), i4 = t2;
  } while (0 === e2?.size);
}, r = (i4) => {
  for (let t2; t2 = i4._$AM; i4 = t2) {
    let e2 = t2._$AN;
    if (void 0 === e2) t2._$AN = e2 = /* @__PURE__ */ new Set();
    else if (e2.has(i4)) break;
    e2.add(i4), c$1(t2);
  }
};
function h$1(i4) {
  void 0 !== this._$AN ? (o(this), this._$AM = i4, r(this)) : this._$AM = i4;
}
function n$1(i4, t2 = false, e2 = 0) {
  const r2 = this._$AH, h2 = this._$AN;
  if (void 0 !== h2 && 0 !== h2.size) if (t2) if (Array.isArray(r2)) for (let i5 = e2; i5 < r2.length; i5++) s$1(r2[i5], false), o(r2[i5]);
  else null != r2 && (s$1(r2, false), o(r2));
  else s$1(this, i4);
}
const c$1 = (i4) => {
  i4.type == t.CHILD && (i4._$AP ??= n$1, i4._$AQ ??= h$1);
};
class f extends i$1 {
  constructor() {
    super(...arguments), this._$AN = void 0;
  }
  _$AT(i4, t2, e2) {
    super._$AT(i4, t2, e2), r(this), this.isConnected = i4._$AU;
  }
  _$AO(i4, t2 = true) {
    i4 !== this.isConnected && (this.isConnected = i4, i4 ? this.reconnected?.() : this.disconnected?.()), t2 && (s$1(this, i4), o(this));
  }
  setValue(t2) {
    if (r$1(this._$Ct)) this._$Ct._$AI(t2, this);
    else {
      const i4 = [...this._$Ct._$AH];
      i4[this._$Ci] = t2, this._$Ct._$AI(i4, this, 0);
    }
  }
  disconnected() {
  }
  reconnected() {
  }
}
class s {
  constructor(t2) {
    this.G = t2;
  }
  disconnect() {
    this.G = void 0;
  }
  reconnect(t2) {
    this.G = t2;
  }
  deref() {
    return this.G;
  }
}
class i3 {
  constructor() {
    this.Y = void 0, this.Z = void 0;
  }
  get() {
    return this.Y;
  }
  pause() {
    this.Y ??= new Promise((t2) => this.Z = t2);
  }
  resume() {
    this.Z?.(), this.Y = this.Z = void 0;
  }
}
const n2 = (t2) => !n$2(t2) && "function" == typeof t2.then, h = 1073741823;
class c extends f {
  constructor() {
    super(...arguments), this._$Cwt = h, this._$Cbt = [], this._$CK = new s(this), this._$CX = new i3();
  }
  render(...s2) {
    return s2.find((t2) => !n2(t2)) ?? E;
  }
  update(s2, i4) {
    const e2 = this._$Cbt;
    let r2 = e2.length;
    this._$Cbt = i4;
    const o2 = this._$CK, c2 = this._$CX;
    this.isConnected || this.disconnected();
    for (let t2 = 0; t2 < i4.length && !(t2 > this._$Cwt); t2++) {
      const s3 = i4[t2];
      if (!n2(s3)) return this._$Cwt = t2, s3;
      t2 < r2 && s3 === e2[t2] || (this._$Cwt = h, r2 = 0, Promise.resolve(s3).then(async (t3) => {
        for (; c2.get(); ) await c2.get();
        const i5 = o2.deref();
        if (void 0 !== i5) {
          const e3 = i5._$Cbt.indexOf(s3);
          e3 > -1 && e3 < i5._$Cwt && (i5._$Cwt = e3, i5.setValue(t3));
        }
      }));
    }
    return E;
  }
  disconnected() {
    this._$CK.disconnect(), this._$CX.pause();
  }
  reconnected() {
    this._$CK.reconnect(this), this._$CX.resume();
  }
}
const m = e(c);
const ESP_WEB_INSTALLER_BASE_URL = "https://circuitsetup.github.io/ESPWebInstaller/";
const INDEX_URL = new URL("manifests/firmware_index.json", ESP_WEB_INSTALLER_BASE_URL).href;
const MAX_PAYLOAD_BYTES = 256 * 1024;
const MAX_PRODUCTS = 100;
const MAX_VERSIONS = 20;
const MAX_STRING_LENGTH = 160;
const FETCH_TIMEOUT_MS = 1e4;
const PRODUCT_ID = /^[a-z0-9][a-z0-9_-]{0,127}$/;
const VERSION = /^[0-9]{4}\.[0-9]{1,2}\.[0-9]{1,2}(?:-[A-Za-z0-9.-]+)?$/;
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/;
function fail(message) {
  throw new Error(`Invalid firmware index: ${message}`);
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isSafeText(value) {
  return typeof value === "string" && value.length <= MAX_STRING_LENGTH && !CONTROL.test(value);
}
function assertProductId(productId) {
  if (!PRODUCT_ID.test(productId)) throw new Error("Invalid firmware product ID");
}
function assertVersion(version) {
  if (!VERSION.test(version) || version.length > MAX_STRING_LENGTH || CONTROL.test(version)) {
    throw new Error("Invalid firmware version");
  }
}
function encodedLength(value) {
  return new TextEncoder().encode(value).byteLength;
}
function parseFirmwareIndex(value) {
  if (!Array.isArray(value)) fail("top level must be an array");
  if (encodedLength(JSON.stringify(value)) > MAX_PAYLOAD_BYTES) fail("payload is too large");
  if (value.length > MAX_PRODUCTS) fail("too many products");
  const productIds = /* @__PURE__ */ new Set();
  return value.map((candidate) => {
    if (!isRecord(candidate) || Object.keys(candidate).length !== 3 || !Object.hasOwn(candidate, "productId") || !Object.hasOwn(candidate, "name") || !Object.hasOwn(candidate, "versions")) {
      fail("invalid product");
    }
    const { productId, name, versions } = candidate;
    if (!isSafeText(productId) || !isSafeText(name) || !Array.isArray(versions)) fail("invalid product fields");
    assertProductId(productId);
    if (productIds.has(productId)) fail("duplicate product ID");
    productIds.add(productId);
    if (versions.length > MAX_VERSIONS) fail("too many versions");
    const seenVersions = /* @__PURE__ */ new Set();
    return {
      productId,
      name,
      versions: versions.map((versionEntry) => {
        if (!isRecord(versionEntry) || Object.keys(versionEntry).length !== 1 || !Object.hasOwn(versionEntry, "version") || !isSafeText(versionEntry.version)) {
          fail("invalid version");
        }
        assertVersion(versionEntry.version);
        if (seenVersions.has(versionEntry.version)) fail("duplicate version");
        seenVersions.add(versionEntry.version);
        return { version: versionEntry.version };
      })
    };
  });
}
async function fetchFirmwareIndex(fetchImpl = globalThis.fetch, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, FETCH_TIMEOUT_MS);
  try {
    const response = await fetchImpl(INDEX_URL, { cache: "no-cache", mode: "cors", signal: controller.signal });
    if (!response.ok) throw new Error(`Firmware index request failed (${response.status})`);
    const body = await response.text();
    if (encodedLength(body) > MAX_PAYLOAD_BYTES) fail("payload is too large");
    return parseFirmwareIndex(JSON.parse(body));
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
function resolveMeterProductIds(addonCount, connectionType) {
  if (!Number.isInteger(addonCount) || addonCount < 0 || addonCount > 6) return [];
  const base = addonCount === 0 ? "6chan_energy_meter_main" : addonCount === 1 ? "6chan_energy_meter_1-addon" : `6chan_energy_meter_${addonCount}-addons`;
  if (connectionType === "wifi") return [addonCount === 0 ? `${base}_board` : base];
  if (connectionType === "ethernet_lilygo") return [`${base}_ethernet`];
  if (addonCount === 0) return [`${base}_ethernet_waveshare`, `${base}_ethernet_ws`];
  return [`${base}_ethernet_waveshare`];
}
function compareVersions(a2, b2) {
  const parse = (version) => version.split(/[-.]/).map((part) => Number.isNaN(Number(part)) ? part : Number.parseInt(part, 10));
  const left = parse(a2);
  const right = parse(b2);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const aPart = left[index];
    const bPart = right[index];
    if (aPart === void 0) return -1;
    if (bPart === void 0) return 1;
    if (aPart > bPart) return -1;
    if (aPart < bPart) return 1;
  }
  return 0;
}
function resolveFirmwareOptions(index, addonCount, connectionType) {
  const options = /* @__PURE__ */ new Map();
  for (const productId of resolveMeterProductIds(addonCount, connectionType)) {
    const product = index.find((entry) => entry.productId === productId);
    for (const entry of product?.versions ?? []) {
      if (!options.has(entry.version)) options.set(entry.version, { productId, version: entry.version });
    }
  }
  return [...options.values()].sort((a2, b2) => compareVersions(a2.version, b2.version));
}
function chooseFirmwareVersion(options, selectedVersion) {
  return options.find((option) => option.version === selectedVersion)?.version ?? options[0]?.version ?? null;
}
function manifestUrlFor(productId, version) {
  assertProductId(productId);
  assertVersion(version);
  const url = new URL(`manifests/manifest_${productId}-${version}.json`, ESP_WEB_INSTALLER_BASE_URL);
  if (url.origin !== "https://circuitsetup.github.io" || !url.pathname.startsWith("/ESPWebInstaller/manifests/")) {
    throw new Error("Invalid firmware manifest URL");
  }
  return url.href;
}
let loader;
const loadEspWebTools = () => loader ??= import("./circuitsetup-energy-meter-helper-install-button-QXOknnqv.js");
const installer = (option, manifestUrl) => b`
  <p class="firmware-summary">${option.productId} · ESPHome ${option.version}</p>
  <esp-web-install-button class="esp-web-installer" .manifest=${manifestUrl}>
    <button slot="activate" aria-label="Install firmware">Install firmware</button>
    <p slot="unsupported">Use a supported Chromium browser with Web Serial to install firmware.</p>
    <p slot="not-allowed">Open this helper on HTTPS or localhost to install firmware.</p>
  </esp-web-install-button>
`;
function espWebInstaller(option) {
  if (!option) return A;
  try {
    const manifestUrl = manifestUrlFor(option.productId, option.version);
    if (customElements.get("esp-web-install-button")) return installer(option, manifestUrl);
    return m(
      loadEspWebTools().then(
        () => installer(option, manifestUrl),
        () => b`<p role="alert">ESP Web Tools failed to load. Reload Home Assistant and try again.</p>`
      ),
      b`<p role="status">Loading installer…</p>`
    );
  } catch {
    return A;
  }
}
const warningCopy = {
  electrical_profile_requires_confirmation: "The electrical profile was inferred and must be reviewed before migration.",
  legacy_generic_totals_unmanaged: "Existing generic totals will be preserved unless the reviewed migration explicitly replaces them.",
  stored_semantics_stale: "The ESPHome source changed after the last helper save, so the live source was read again.",
  config_contract_upgrade_required: "This configuration uses an older helper contract and requires reviewed migration."
};
function existingConfigurationStep(configuration, metadata, onManage, onCalibrateOnly, onBack) {
  if (!configuration.capabilities.configuration_authoritative || configuration.capabilities.semantic_source !== "legacy_inferred") return b``;
  const warnings = [.../* @__PURE__ */ new Set([...configuration.warnings, ...configuration.capabilities.reason_codes])];
  return b`<section class="existing-configuration" aria-label="Review Existing Setup">
    <p>This meter already has an ESPHome configuration. Choose whether to manage its configuration with this helper or leave it unchanged.</p>
    <dl class="status-list">
      <div><dt>ESPHome configuration</dt><dd>${metadata.configurationFilename}</dd></div>
      <div><dt>Project</dt><dd>${metadata.projectName} · ${metadata.projectVersion}</dd></div>
      <div><dt>Detected hardware</dt><dd>${metadata.boardCount} ${metadata.boardCount === 1 ? "board" : "boards"} · ${metadata.ctCount} CT inputs</dd></div>
    </dl>
    <dl class="status-list">
      <div><dt>Read directly</dt><dd>Names, substitutions, current gains, line frequency, reporting interval, package state, and physical topology.</dd></div>
      <div><dt>Inferred or not recorded</dt><dd>Electrical profile, transformer and CT identity, used channels, circuit roles, and aggregate intent.</dd></div>
      <div><dt>Preserved if you do not migrate</dt><dd>The existing ESPHome configuration and unowned YAML remain unchanged.</dd></div>
    </dl>
    <dl class="status-list">
      <div><dt>What migration changes</dt><dd>The reviewed meter profile, circuit settings, helper-owned totals, and package options become helper-managed.</dd></div>
      <div><dt>What migration preserves</dt><dd>Unowned YAML and unmanaged totals remain intact unless the reviewed migration explicitly replaces them.</dd></div>
    </dl>
    ${warnings.length ? b`<div class="warning-band" role="note"><strong>Review notes</strong><ul>${warnings.map((warning) => b`<li>${warningCopy[warning] ?? "Some legacy settings could not be identified and must be reviewed."}</li>`)}</ul><details><summary>Technical details</summary><code>${warnings.join(", ")}</code></details></div>` : A}
    <div class="action-footer"><button class="secondary" @click=${onBack}>Back</button><button class="secondary" @click=${onCalibrateOnly}>Keep ESPHome configuration and calibrate only</button><button class="primary" @click=${onManage}>Review and manage with helper</button></div>
  </section>`;
}
const boardLabel = (index) => index === 0 ? "Main Board" : `Add-on ${index}`;
const groupKeys = (board) => board === 0 ? ["main_1", "main_2"] : [`addon${board}_1`, `addon${board}_2`];
function offsetStep(topology2, session2, board, stage, acknowledged, retryConfirmed, readiness, result, busy, selectBoard, selectStage, setAcknowledged, setRetryConfirmed, check, calibrate, reconnect, skip, back, continueToVoltage) {
  const capability = session2?.offset_capability;
  const boards = session2?.offset_boards ?? [];
  const finalized = session2?.offset_disposition === "completed" || session2?.offset_disposition === "skipped" || session2?.offset_disposition === "partial" && session2.state === "applied_pending_restart_verification";
  const stageTwoReady = boards.length > 0 && boards.every((item) => item.stages[0]?.state === "completed");
  const stageState = boards[board]?.stages[stage - 1]?.state ?? "not_started";
  const recovery = Boolean(result?.retry_allowed) || stageState === "partial" || stageState === "indeterminate";
  const unavailable = capability?.status !== "available";
  const keys = groupKeys(board);
  const tableByGroup = new Map(result?.expected_tables ?? []);
  const savedSources = new Map(readiness?.saved_offset_sources ?? []);
  return b`
    <section class="step-content offset-step" aria-labelledby="step-heading">
      ${unavailable ? b`
        <div class="warning-band" role="status">
          <strong>Offset calibration is ${capability?.status === "invalid" ? "not safely available" : "not available on this firmware"}.</strong>
          ${capability?.status === "invalid" ? b`<p>Repair reason: ${capability.repair_reason}</p>` : A}
          <p>Skip preserves the offset values already saved in flash. No clear control is invoked.</p>
        </div>
      ` : b`
        <ol class="offset-stage-stepper" aria-label="Offset calibration stages">
          <li class=${stage === 1 ? "active" : stageTwoReady ? "complete" : "pending"}>
            <button data-offset-stage="1" aria-current=${stage === 1 ? "step" : A} @click=${() => selectStage(1)}>1. Voltage/current zero offset</button>
          </li>
          <li class=${stage === 2 ? "active" : finalized ? "complete" : "pending"}>
            <button data-offset-stage="2" aria-current=${stage === 2 ? "step" : A} ?disabled=${!stageTwoReady}
              @click=${() => selectStage(2)}>2. Active/reactive power offset</button>
          </li>
        </ol>
        <div class="board-tabs" role="tablist" aria-label="Offset calibration boards">
          ${Array.from({ length: topology2?.board_count ?? boards.length }, (_2, index) => b`
            <button role="tab" data-offset-board id=${`offset-board-tab-${index}`} aria-controls="offset-board-panel"
              aria-selected=${index === board} tabindex=${index === board ? "0" : "-1"}
              @keydown=${(event) => moveTab(event, index)} @click=${() => selectBoard(index)}>
              ${boardLabel(index)}
            </button>
          `)}
        </div>
        <div id="offset-board-panel" role="tabpanel" aria-labelledby=${`offset-board-tab-${board}`}>
          <h2>Optional offset calibration · Stage ${stage} · ${boardLabel(board)}</h2>
          <p>Offset calibration is optional and requires changing the power and wiring state as described below. Offset values remain stored in meter flash.</p>
          <div class="warning-band"><strong>Warning:</strong> An open-circuit current-output CT on a live conductor can be hazardous. De-energize conductors before unplugging any CT.</div>
          ${stage === 1 ? b`
            <p>First, de-energize all conductors. Then unplug the voltage transformer/AC voltage input and CT inputs, power the meter from USB only, then check that every voltage/current phase reads near zero.</p>
          ` : b`
            <p>Power down before rewiring, keep CT inputs unplugged and CTs off current-carrying conductors, connect/enclose/energize only the voltage reference, then check that voltage is present on both chips and every current phase reads near zero.</p>
          `}
          <p>Measurements cannot prove that a transformer or CT is physically unplugged. Physical acknowledgement never substitutes for measured readiness.</p>
          <label class="check-row"><input type="checkbox" .checked=${acknowledged} @change=${(event) => setAcknowledged(event.target.checked)}>
            ${stage === 1 ? "I completed the USB-only, de-energized preparation." : "I powered down for rewiring and safely enclosed and energized only the voltage reference."}
          </label>
          <div class="offset-actions">
            <button class="secondary" data-action="check-offset" ?disabled=${busy || !acknowledged || stageState === "completed"} @click=${check}>
              ${busy ? "Checking measured readiness…" : "Check measured readiness"}
            </button>
            <button class="primary" data-action="calibrate-offset"
              ?disabled=${busy || !acknowledged || !readiness?.ready || stageState === "completed" || recovery && !retryConfirmed}
              @click=${calibrate}>${result?.retry_allowed ? "Retry unfinished chip" : `Run Stage ${stage} calibration`}</button>
          </div>
          ${readiness ? b`
            <section class="measurement-evidence" aria-label="Offset readiness evidence">
              <h3>Measured readiness</h3>
              <div class=${readiness.ready ? "success-band" : "warning-band"} role="status" aria-live="polite">
                ${readiness.ready ? "Measured readiness passed." : "Measured readiness did not pass. Physical acknowledgement is not enough."}
              </div>
              ${readiness.reasons.length ? b`<ul>${readiness.reasons.map((reason) => b`<li>${reason}</li>`)}</ul>` : A}
              <dl class="threshold-grid">
                <div><dt>Samples per phase</dt><dd>${readiness.thresholds.sample_count}</dd></div>
                <div><dt>Zero voltage peak</dt><dd>${readiness.thresholds.zero_voltage_peak_volts} V</dd></div>
                <div><dt>Zero voltage spread</dt><dd>${readiness.thresholds.zero_voltage_spread_volts} V</dd></div>
                <div><dt>Zero current peak</dt><dd>${readiness.thresholds.zero_current_peak_amps} A</dd></div>
                <div><dt>Zero current spread</dt><dd>${readiness.thresholds.zero_current_spread_amps} A</dd></div>
                <div><dt>Voltage present minimum</dt><dd>${readiness.thresholds.voltage_present_minimum_volts} V</dd></div>
                <div><dt>Voltage present spread</dt><dd>${readiness.thresholds.voltage_present_spread_volts} V</dd></div>
              </dl>
              <table class="evidence-table"><thead><tr><th>Phase role</th><th>Quantity</th><th>Status</th><th>Mean</th><th>Peak</th><th>Spread</th></tr></thead><tbody>
                ${readiness.entities.map((entity) => b`<tr><td>${entity.role}</td><td>${entity.quantity}</td><td>${entity.ready ? "Ready" : entity.reasons.join("; ")}</td>
                  <td>${entity.window?.mean ?? "—"}</td><td>${entity.window?.absolute_peak ?? "—"}</td><td>${entity.window?.absolute_spread ?? "—"}</td></tr>`)}
              </tbody></table>
            </section>
          ` : A}
          <section class="measurement-evidence" aria-label="Per-chip offset progress" aria-live="polite">
            <h3>Per-chip progress</h3>
            <table><thead><tr><th>Chip</th><th>Previously saved offsets</th><th>This run</th><th>Backend evidence</th></tr></thead><tbody>
              ${keys.map((key) => b`<tr><td>${key}</td>
                <td>${!readiness ? "Check measured readiness to inspect saved offsets." : tableByGroup.has(key) || stageState === "completed" ? "Fresh calibration saved during this session." : savedSources.get(key) === "flash" ? "Saved offsets detected; this run will recalibrate this chip." : savedSources.get(key) === "configuration" ? "Configuration offsets reported; this run will calibrate this chip." : "Saved-offset status unknown; this run still requires fresh calibration."}</td>
                <td>${tableByGroup.has(key) || stageState === "completed" ? "Saved; restart verification required." : result?.unfinished_group_keys.includes(key) ? "Unfinished" : stageState.replaceAll("_", " ")}</td>
                <td>${tableByGroup.has(key) ? tableByGroup.get(key).map(([first, second]) => `${first}/${second}`).join(", ") : "—"}</td></tr>`)}
            </tbody></table>
          </section>
          ${recovery ? b`<aside class="recovery-panel" role="status" aria-live="assertive">
            <strong>${result ? result.state === "partial" ? "One chip finished; recovery is required" : "Calibration outcome is indeterminate" : "Recovery is required"}</strong>
            <p>${result?.error ?? "The prior operation did not finish cleanly"}. Reconnect and inspect before retrying only the unfinished chip.</p>
            <label class="check-row"><input type="checkbox" .checked=${retryConfirmed} @change=${(event) => setRetryConfirmed(event.target.checked)}> I reviewed the evidence and confirm this retry.</label>
            <button class="secondary" @click=${reconnect}>Reconnect and inspect</button>
          </aside>` : A}
        </div>
      `}
      <footer class="action-footer offset-footer">
        <button class="secondary" @click=${back}>Back</button>
        <button class="secondary" data-action="skip-offset" ?disabled=${busy || finalized} @click=${skip}>Skip offset calibration</button>
        <button class="primary" ?disabled=${busy || !finalized} @click=${continueToVoltage}>Continue</button>
      </footer>
    </section>
  `;
}
function restartStep(state, result, rollbackAvailable, busy, restart2, rollback, back) {
  const recovery = state.includes("failed") || state.includes("indeterminate");
  const hasOffsets = Boolean(result?.offset_groups?.length || result?.power_offset_groups?.length);
  const handoffStatus = result?.source_handoff_available ? result.config_filename : hasOffsets ? "Unavailable; offset calibration remains saved in flash" : "Unavailable in runtime-only mode";
  return b`
    <section class="step-content" aria-labelledby="step-heading">
      <p>Restart verification checks the exact meter identity, topology, restored references, gains, voltage/current offsets, power offsets, and entity bindings.</p>
      <div class="status-band" role="status">${busy ? "Restarting and verifying…" : state || "Ready for restart verification"}</div>
      ${result ? b`<dl class="status-list"><div><dt>Verification</dt><dd>${result.verification_id}</dd></div><div><dt>Authority</dt><dd>${result.source_authority.replaceAll("_", " ")}</dd></div><div><dt>Connection generation</dt><dd>${result.connection_generation}</dd></div><div><dt>Source handoff</dt><dd>${handoffStatus}</dd></div></dl>` : ""}
      ${state === "cancelled" ? b`<div class="recovery-panel"><strong>Session cancelled</strong><p>Cleanup completed without claiming restart verification.</p></div>` : ""}
      ${recovery ? b`<div class="recovery-panel"><strong>Recovery required</strong><p>Reconnect to the meter and inspect live session evidence before retrying. Use rollback only when the current transaction makes it available.</p>${rollbackAvailable ? b`<button class="danger" data-action="rollback" @click=${rollback}>Review rollback</button>` : ""}</div>` : ""}
      <footer class="action-footer"><button class="secondary" @click=${back} ?disabled=${busy}>Back</button><button class="primary" @click=${restart2} ?disabled=${busy || state === "cancelled" || Boolean(result)}>${busy ? "Restarting and verifying…" : state.includes("failed") ? "Retry restart verification" : "Restart and verify"}</button></footer>
    </section>
  `;
}
function preflightStatus(session2) {
  if (!session2) return b`<p>Starting a calibration session…</p>`;
  return session2.preflight.issues.length ? b`<div class="error-panel" role="alert" tabindex="-1"><strong>Calibration preflight failed</strong><ul>${session2.preflight.issues.map((issue) => b`<li>${issue.role}: ${issue.detail}</li>`)}</ul></div>` : b`<div class="success-band" role="status">Calibration controls and reference ranges passed preflight.</div>`;
}
function safetyStep(session2, acknowledged, setAcknowledged, confirm, cancel, back, busy = false) {
  return b`
    <section class="step-content" aria-labelledby="step-heading">
      ${preflightStatus(session2)}
      <section class="info-band" aria-label="Calibration roadmap"><strong>What you will do</strong><p>Confirm the safe setup, then calibrate ${session2?.calibration_plan === "full" ? "offsets, voltage, and current" : "voltage and current"}, verify the restart, and review the result.</p></section>
      ${session2?.state === "cancelled" ? b`<div class="status-band" role="status">Calibration session cancelled. No restart verification was claimed.</div>` : ""}
      <ul class="safety-list">
        <li>Mains voltage is hazardous.</li>
        <li>Use a properly rated true-RMS reference instrument.</li>
        <li>Clamp the same conductor represented by the selected CT and keep the load stable.</li>
        <li>Do not work inside an energized panel unless qualified.</li>
        <li>The helper cannot electrically verify a burden-jumper change.</li>
      </ul>
      <p class="warning-band" role="note"><strong>Physical work required:</strong> Follow the wiring and de-energized preparation instructions on each calibration screen. The helper cannot verify changes inside the panel.</p>
      <section class="warning-band" aria-labelledby="safety-heading">
        <h2 id="safety-heading">Safety acknowledgement</h2>
        <p>Confirm the test setup is safe, isolated, and accessible before calibration.</p>
        <label class="check-row"><input type="checkbox" .checked=${acknowledged} @change=${(event) => setAcknowledged(event.target.checked)} /> I acknowledge and accept responsibility</label>
      </section>
      <button class="danger" @click=${cancel}>Cancel session</button>
      <footer class="action-footer">
        <button class="secondary" @click=${back}>Back</button>
        <button class="primary" @click=${confirm} ?disabled=${busy || session2?.state === "cancelled" || !acknowledged || Boolean(session2?.preflight.issues.length)}>${busy ? "Loading calibration…" : "Continue"}</button>
      </footer>
    </section>
  `;
}
const CONNECTIONS = [
  ["wifi", "Wi-Fi"],
  ["ethernet_lilygo", "LilyGO Ethernet"],
  ["ethernet_waveshare", "Waveshare Ethernet"]
];
const ADDON_PINS = ["(0, 16)", "(27, 17)", "(2, 21)", "(13, 22)", "(14, 25)", "(15, 26)"];
function setupDeviceStep(snapshot, addonCount, connection, setAddon, setConnection, rescan, configure, adopt, busyAction = "", discoverOnly = false, firmwareCatalog = b``, importFailedDeviceId = null) {
  return b`
    <section class="step-content setup-step" aria-labelledby="step-heading">
      ${snapshot?.devices.length ? b`<section aria-labelledby="existing-device-heading">
        <h2 id="existing-device-heading">Existing meters</h2>
        <p>Select a compatible meter already connected to Home Assistant.</p>
        <div class="meter-list">
          ${snapshot.devices.map((device2) => b`
            <div class="meter-row">
              <span><strong>${device2.title}</strong><small>${device2.project_name} · ${device2.project_version ?? "version unavailable"}</small></span>
              <span>${device2.configuration ? "Managed in ESPHome Device Builder" : device2.importable ? "Import available" : "Calibration only — no editable source."}</span>
              ${!device2.configuration && !device2.importable ? b`<small>The meter is connected, but ESPHome source editing is unavailable. Calibration remains in meter flash and may be replaced by a future firmware install.</small>` : ""}
              ${device2.importable && !device2.configuration ? b`<button class="primary" data-action="import-device" ?disabled=${Boolean(busyAction)}
                    @click=${() => adopt(device2.entry_id)}>${busyAction === `adopt:${device2.entry_id}` ? "Importing configuration…" : importFailedDeviceId === device2.entry_id ? "Retry import" : "Import configuration"}</button>` : b`<button class="primary" data-action="configure-device" ?disabled=${Boolean(busyAction)}
                    @click=${() => configure(device2.entry_id)}>${busyAction === `topology:${device2.entry_id}` ? "Loading meter…" : device2.configuration ? "Open setup" : "Open calibration"}</button>`}
            </div>
          `)}
        </div>
      </section>` : b``}
      ${discoverOnly ? "" : b`<hr />
      <h2>Set up a new meter</h2>
      <fieldset class="choice-field">
        <legend>Add-on boards</legend>
        <p>Select how many add-on boards are attached to your energy meter.</p>
        <div class="addon-options">
          ${Array.from({ length: 7 }, (_2, value) => b`
            <label class=${value === addonCount ? "selected" : ""}>
              <input name="addon-count" type="radio" .value=${String(value)}
                .checked=${value === addonCount} @change=${() => setAddon(value)} />
              <span>${value}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <fieldset class="choice-field">
        <legend>Connection</legend>
        <p>Choose how your device will connect to your network.</p>
        <div class="connection-options">
          ${CONNECTIONS.map(([value, label]) => b`
            <label class=${value === connection ? "selected" : ""}>
              <input name="connection-type" type="radio" .value=${value}
                .checked=${value === connection} @change=${() => setConnection(value)} />
              <span>${label}</span>
            </label>
          `)}
        </div>
      </fieldset>
      <section aria-labelledby="jumper-heading">
        <h2 id="jumper-heading">Add-on address jumper settings</h2>
        <dl class="summary-band">
          <div><dt>Add-on boards</dt><dd>${addonCount}</dd></div>
          <div><dt>Connection</dt><dd>${CONNECTIONS.find(([value]) => value === connection)?.[1]}</dd></div>
          ${ADDON_PINS.slice(0, addonCount).map((pins, index) => b`<div><dt>Add-on ${index + 1}</dt><dd>${pins}</dd></div>`)}
        </dl>
      </section>
      ${firmwareCatalog}
      <section class="next-steps" aria-labelledby="next-steps-heading">
        <h2 id="next-steps-heading">What happens next</h2>
        <ol>
          <li>Install the selected firmware and select <strong>Next</strong> in ESP Web Tools.</li>
          <li>Select <strong>Add to Home Assistant</strong> and approve the discovered ESPHome device.</li>
          <li>Return here. The helper will import it into ESPHome Builder and continue.</li>
        </ol>
      </section>
      <p class="info-band">${connection === "wifi" ? "Use a USB data cable. ESP Web Tools asks for your Wi-Fi network and password and sends them directly to your meter. This helper does not store or send those credentials to Home Assistant." : "Use a USB data cable, connect Ethernet and power, then wait for an address from DHCP."}</p>
      `}
      <button class="rescan" data-action="rescan" ?disabled=${Boolean(busyAction)} @click=${rescan}>${busyAction === "rescan" ? "Rescanning…" : "Rescan for device"}</button>
    </section>
  `;
}
function technicalDetails(topology2, session2, transaction2, stability2, calibration2, restart2 = null, completedWithoutChanges = false) {
  return b`
    <details>
      <summary>Technical details</summary>
      <div class="technical-grid">
        <section><h3>Configuration and project evidence</h3><ul>${topology2?.evidence.map((item) => b`<li>${item.source}: ${item.detail}</li>`) ?? "No evidence loaded."}</ul></section>
        <section><h3>Semantic API mapping</h3><p>${session2?.preflight.zeroed_roles.length ?? 0} reference roles verified and zeroed.</p></section>
        <section><h3>Sample windows by target</h3>${[...stability2.entries()].map(([target, result]) => b`<div data-target=${target}>${stabilityEvidence(result)}</div>`) || "No sample evidence."}</section>
        <section><h3>Calibration results by target</h3>${[...calibration2.entries()].map(([target, result]) => b`<div data-target=${target}>${calibrationEvidence(result)}</div>`) || "No calibration evidence."}</section>
        <section><h3>Build evidence</h3><p>${transaction2?.evidence.join(", ") || "No build evidence."}</p><p>${transaction2?.progress.join(", ") || "No transaction progress."}</p>
          <p>Transaction ID: ${transaction2?.transaction_id ?? "Unavailable"}; source hash: ${transaction2?.source_sha256 ?? "Unavailable"}.</p>
          ${transaction2?.validation_detail ? b`<p>Validation code ${transaction2.validation_detail.code ?? "unavailable"}; ${transaction2.validation_detail.error_record_count} error records; ${transaction2.validation_detail.warning_record_count} warning records.</p>` : ""}
          ${transaction2?.upload_progress?.length ? b`<ul>${transaction2.upload_progress.map((item) => b`<li>${item.stage}: ${item.percentage ?? "in progress"}${item.percentage != null ? "%" : ""}</li>`)}</ul>` : ""}
        </section>
        <section><h3>Calibration completion record</h3><p>${restart2 ? `Restart-verified ${restart2.source_authority.replaceAll("_", " ")} calibration record` : completedWithoutChanges ? "No-change completion; no restart-verified record was created" : "Not yet established"}</p><p>${restart2 ? `Verification ${restart2.verification_id}, source hash ${restart2.config_sha256 ?? "Unavailable"}, generation ${restart2.connection_generation}; ${restart2.offset_groups?.length ?? 0} voltage/current offset tables; ${restart2.power_offset_groups?.length ?? 0} power-offset tables.` : completedWithoutChanges ? "The server confirmed there were no pending gain or offset changes." : "No authoritative restart result."}</p></section>
      </div>
    </details>
  `;
}
function summaryOutcome(input) {
  const offset = Boolean(input.restart?.offset_groups?.length || input.restart?.power_offset_groups?.length);
  const calibrationOnly = input.configurationMode === "legacy_editable" && input.legacyChoice === "calibrate_only";
  const migrated = input.legacyChoice === "manage_with_helper" && input.verifiedConfiguration;
  const warnings = input.unmanagedLegacyItems?.length ? [`Unmanaged legacy items: ${input.unmanagedLegacyItems.join(", ")}.`] : [];
  const heading = input.legacyChoice !== null ? "Review complete" : "Setup complete";
  if (offset) return { heading, configurationStatus: calibrationOnly ? "ESPHome configuration was left untouched." : "Configuration authority is unchanged.", migrationStatus: migrated ? "Migration installed." : null, calibrationStatus: "Offset calibration remains stored in meter flash by design.", authorityMessage: "Offset calibration remains stored in meter flash by design.", warnings: [...warnings, "Offset calibration remains stored in meter flash by design."] };
  if (input.completedWithoutChanges) return { heading, configurationStatus: input.configurationInstalled ? "Configuration installed in ESPHome." : input.configurationMode === "runtime_only" ? "ESPHome source was not changed because no authoritative configuration was available." : calibrationOnly ? "ESPHome configuration was left untouched." : input.verifiedConfiguration ? "Helper-managed configuration was left unchanged." : "Configuration was left unchanged.", migrationStatus: migrated ? "Migration installed." : null, calibrationStatus: "Existing calibration was kept unchanged.", authorityMessage: "No restart-verified calibration record was required.", warnings };
  if (input.configurationMode === "runtime_only") return { heading: "Setup complete", configurationStatus: "ESPHome source was not changed because no authoritative configuration was available.", migrationStatus: null, calibrationStatus: "Calibration is stored in meter flash. Installing firmware may replace it.", authorityMessage: "No authoritative ESPHome source is available.", warnings: [...warnings, "Calibration is stored in meter flash. Installing firmware may replace it."] };
  if (calibrationOnly && input.restart?.source_authority === "configuration") return { heading, configurationStatus: "ESPHome configuration was left untouched.", migrationStatus: null, calibrationStatus: "Calibration gains were saved; the remaining legacy configuration was not migrated.", authorityMessage: "Calibration gains are installed in ESPHome.", warnings };
  if (calibrationOnly) return { heading, configurationStatus: "ESPHome configuration was left untouched.", migrationStatus: null, calibrationStatus: "ESPHome configuration was left untouched.", authorityMessage: "Calibration is stored in meter flash.", warnings: [...warnings, "Calibration is stored in meter flash. Installing firmware may replace it."] };
  if (input.restart?.source_authority === "configuration") return { heading, configurationStatus: "Configuration installed in ESPHome.", migrationStatus: migrated ? "Migration installed." : null, calibrationStatus: "Configuration and calibration are installed in ESPHome.", authorityMessage: "Calibration is stored in ESPHome.", warnings };
  return { heading, configurationStatus: input.verifiedConfiguration ? "Configuration authority is available." : "Configuration authority is unavailable.", migrationStatus: migrated ? "Migration installed." : null, calibrationStatus: "Calibration is stored in meter flash. Installing firmware may replace it.", authorityMessage: "Calibration is stored in meter flash.", warnings: [...warnings, "Calibration is stored in meter flash. Installing firmware may replace it."] };
}
function summaryStep(topology2, session2, transaction2, stability2, calibration2, restart2, completedWithoutChanges, projectVersion, saveCalibration, back, meterConfiguration2 = null, impact = null, finish = () => void 0, keepCalibrationInFlash = () => void 0, configurationMode = "helper_managed", legacyChoice = null, configurationInstalled = false, handoffDeclined = false, sourceConfiguration = null) {
  const hasOffsets = Boolean(restart2?.offset_groups?.length || restart2?.power_offset_groups?.length);
  const handoffAction = !handoffDeclined && restart2?.source_authority === "saved_flash" && restart2.config_filename && !hasOffsets && (restart2.source_handoff_available || restart2.source_handoff_firmware_installed);
  const totalsEvidence = meterConfiguration2 ?? (configurationMode !== "runtime_only" && sourceConfiguration?.capabilities.configuration_authoritative ? sourceConfiguration : null);
  const totalsImpact = meterConfiguration2 ? impact : totalsEvidence?.configuration_impact ?? null;
  const totalName = (id2) => totalsEvidence?.total_details.find((total) => total.kind === "aggregate" && total.total_id === id2)?.name ?? id2;
  const unmanagedLegacyItems = totalsEvidence?.warnings.filter((warning) => warning.includes("unmanaged"));
  const outcome = summaryOutcome({
    configurationMode,
    legacyChoice,
    completedWithoutChanges,
    configurationInstalled,
    restart: restart2,
    verifiedConfiguration: meterConfiguration2 !== null,
    ...unmanagedLegacyItems ? { unmanagedLegacyItems } : {}
  });
  const boards = (values) => values.flatMap((enabled, board) => enabled ? [board === 0 ? "Main board" : `Add-on ${board}`] : []);
  return b`<section class="step-content" aria-labelledby="step-heading">
    <div class=${restart2 || completedWithoutChanges ? "success-band" : "recovery-panel"} role="status">${restart2 || completedWithoutChanges ? outcome.calibrationStatus : b`<strong>Restart verification is not complete</strong><p>Summary remains unverified until the server returns authoritative restart evidence.</p>`}</div>
    <dl class="summary-list"><div><dt>Meter topology</dt><dd>${topology2?.ct_count ?? "—"} CTs in ${topology2?.group_count ?? "—"} groups</dd></div><div><dt>Project version</dt><dd>${projectVersion ?? "Unavailable"}</dd></div><div><dt>Configuration status</dt><dd>${outcome.configurationStatus}</dd></div>${outcome.migrationStatus ? b`<div><dt>Migration</dt><dd>${outcome.migrationStatus}</dd></div>` : ""}<div><dt>Calibration outcome</dt><dd>${outcome.calibrationStatus}</dd></div><div><dt>Calibration authority</dt><dd>${outcome.authorityMessage}</dd></div>${meterConfiguration2 ? b`<div><dt>Installed electrical profile</dt><dd>${meterConfiguration2.configuration.meter.electrical_system.replaceAll("_", " ")} · ${meterConfiguration2.configuration.meter.line_frequency_hz} Hz</dd></div><div><dt>Voltage references</dt><dd>${meterConfiguration2.configuration.meter.voltage_references.length}</dd></div><div><dt>Used channels</dt><dd>${meterConfiguration2.configuration.channels.filter((channel) => channel.enabled).length}</dd></div><div><dt>Installed package scope</dt><dd>PQ: ${boards(meterConfiguration2.configuration.power_quality).join(", ") || "none"}; status: ${boards(meterConfiguration2.configuration.status_fields).join(", ") || "none"}</dd></div><div><dt>Reporting and entities</dt><dd>${meterConfiguration2.configuration.meter.update_interval_s} seconds${impact ? `; ${impact.numeric_entity_count + impact.text_entity_count} public entities, ~${impact.approximate_publications_per_second.toFixed(1)} publications/sec` : ""}</dd></div>` : ""}</dl>
    ${totalsEvidence ? b`<section aria-labelledby="summary-totals-heading"><h2 id="summary-totals-heading">${!meterConfiguration2 || totalsEvidence.capabilities.reason_codes.includes("totals_adoption_required") ? "Legacy read-only totals" : "Helper-managed totals"}</h2>
      ${!meterConfiguration2 ? b`<p>Authoritative source snapshot: these totals have not been adopted or verified as installed by this workflow.</p>` : ""}
      ${totalsImpact ? b`<p>${totalsImpact.public_total_entity_count} public total entities; ${totalsImpact.internal_total_sensor_count} internal total sensors; ${totalsImpact.energy_entity_count} public energy entities.</p>` : b`<p>Current total counts are unavailable.</p>`}
      ${!totalsEvidence.totals.migration.native_visibility_resolved ? b`<p>Counts are confirmed but incomplete: native visibility is unresolved.</p>` : ""}
      <p>Public outputs are exposed to Home Assistant. Internal dependencies remain in firmware for other totals or energy integration.</p>
      ${totalsEvidence.total_details.map((total) => b`<article class="total-summary" aria-label=${total.name}>
        <h3>${total.name}</h3>
        <p>${total.ownership === "helper_managed" ? "Helper-managed" : "Read-only source YAML"}</p>
        <p>Public outputs: ${total.public_outputs.join(", ") || "none"}</p>
        ${total.internal_outputs.length ? b`<p>Internal outputs: ${total.internal_outputs.join(", ")}</p>` : ""}
        ${total.unverified_outputs.length ? b`<p>Unverified outputs: ${total.unverified_outputs.join(", ")}</p>` : ""}
        <p>Formula: ${total.formula}</p><p>Coverage: ${total.leaf_channels.map((channel) => `CT${channel}`).join(", ")}</p>
        ${total.parents.length ? b`<p>Feeds into: ${total.parents.join(", ")}</p>` : ""}
      </article>`)}
      <h3>Totals migration</h3>
      ${totalsEvidence.totals.migration.legacy_parent_links.length ? b`<ul>${totalsEvidence.totals.migration.legacy_parent_links.map((link) => b`<li>${totalName(link.child_id)} → ${totalName(link.proposed_parent_id)}: pending review</li>`)}</ul>` : b`<p>No pending legacy relationships.</p>`}
      ${totalsEvidence.totals.migration.native_visibility_confirmation_required ? b`<p>Native visibility confirmation is pending a verified save.</p>` : ""}
      ${legacyTotalsNotice(totalsEvidence.capabilities)}</section>` : ""}
    ${outcome.warnings.map((warning) => b`<p class="warning-band" role="status">${warning}</p>`)}
    ${technicalDetails(topology2, session2, transaction2, stability2, calibration2, restart2, completedWithoutChanges)}
    <footer class="action-footer"><button class="secondary" @click=${back}>Back</button>${handoffAction ? b`${!restart2?.source_handoff_firmware_installed ? b`<button class="secondary" data-action="keep-calibration-flash" @click=${keepCalibrationInFlash}>Keep calibration in meter flash</button>` : ""}<button class="primary" data-action="save-calibration" @click=${saveCalibration}>${restart2?.source_handoff_firmware_installed ? "Retry clearing saved flash values" : "Save calibration to YAML"}</button>` : b`<button class="primary" data-action="finish" @click=${finish}>Finish</button>`}</footer>
  </section>`;
}
function topologyMismatch(topology2) {
  const expected = topology2.addon_count;
  const sources = topology2.evidence.map((item) => item.source);
  return expected < 0 || expected > 6 || topology2.board_count !== expected + 1 || topology2.ct_count !== 6 * (expected + 1) || topology2.group_count !== 2 * (expected + 1) || topology2.evidence.length < 1 || topology2.evidence.length > 5 || new Set(sources).size !== sources.length || !sources.some((source) => ["config_project", "config_packages", "native_project"].includes(source)) || topology2.evidence.some((item) => item.addon_count !== expected);
}
function topologyStep(topology2, projectVersion, back, continueFlow, forceMismatch = false, busy = false) {
  const mismatch = forceMismatch || topologyMismatch(topology2);
  return b`
    <section class="step-content" aria-labelledby="step-heading">
      <p class="info-band">Detected ${topology2.board_count} boards with ${topology2.ct_count} CTs on a ${topology2.connection_type} connection. ${mismatch ? "The detected hardware does not agree." : "The detected hardware agrees."}</p>
      <details>
        <summary>Technical details</summary>
        <dl>
          <div><dt>Project</dt><dd>${topology2.project_name}</dd></div>
          <div><dt>Version</dt><dd>${projectVersion ?? "unavailable"}</dd></div>
          <div><dt>Measurement groups</dt><dd>${topology2.group_count}</dd></div>
        </dl>
        <table class="evidence-table">
          <thead><tr><th>Source</th><th>Add-ons</th><th>Evidence</th></tr></thead>
          <tbody>${topology2.evidence.map((item) => b`
            <tr><td>${item.source.replaceAll("_", " ")}</td><td>${item.addon_count}</td><td>${item.detail}</td></tr>
          `)}</tbody>
        </table>
      </details>
      ${mismatch ? b`
        <div class="error-panel" role="alert" tabindex="-1">
          <strong>Topology mismatch</strong>
          <span>Configuration and runtime evidence disagree. Resolve the mismatch before continuing.</span>
        </div>
      ` : b`<div class="success-band" role="status">All topology evidence agrees.</div>`}
      <footer class="action-footer">
        <button class="secondary" @click=${back}>Back</button>
        ${mismatch ? "" : b`<button class="primary" data-action="continue" ?disabled=${busy} @click=${continueFlow}>${busy ? "Loading CTs…" : "Continue"}</button>`}
      </footer>
    </section>
  `;
}
function voltageStep(topology2, session2, board, references, referenceLabels = [], stability2, results, busy, selectBoard, setReference, check, calibrate, reconnect, cancel) {
  const count = references.length;
  const referenceReady = references.slice(0, count).every((value) => Number.isFinite(value) && value > 0);
  const sourceIds = board === 0 ? ["meter_main1", "meter_main2"] : [`addon${board}_1`, `addon${board}_2`];
  const completedInstanceIds = new Set(results.flatMap((result) => result.state === "applied_pending_restart_verification" && result.gain_evidence?.flash_saved ? [result.gain_evidence.instance_id] : []));
  const complete = completedInstanceIds.size === sourceIds.length && sourceIds.every((instance) => completedInstanceIds.has(instance));
  const retry = results.find((result) => result.retry_allowed) ?? null;
  const terminal = results.some((result) => result.state !== "applied_pending_restart_verification" && !result.retry_allowed);
  const boardLabel2 = board === 0 ? "Main Board" : `Add-on ${board}`;
  return b`
    <section class="step-content calibration-step" aria-labelledby="step-heading">
      ${calibrationProgress(referenceReady, stability2, complete ? results[0] ?? null : null, session2?.calibration_plan ?? "full")}
      <div class="board-tabs" role="tablist" aria-label="Voltage calibration boards">
        ${Array.from({ length: topology2?.board_count ?? 1 }, (_2, index) => b`<button role="tab" data-voltage-board
          id=${`voltage-board-tab-${index}`} aria-controls="voltage-board-panel"
          aria-selected=${index === board} tabindex=${index === board ? "0" : "-1"}
          @keydown=${(event) => moveTab(event, index)}
          @click=${() => selectBoard(index)}>${index === 0 ? "Main Board" : `Add-on ${index}`}</button>`)}
      </div>
      <div id="voltage-board-panel" role="tabpanel" aria-labelledby=${`voltage-board-tab-${board}`}>
      <h2>Calibrate Voltage</h2>
      ${calibrationSourceEvidence(session2, sourceIds, "Voltage", completedInstanceIds)}
      <div class="reference-block">
        ${Array.from({ length: count }, (_2, index) => b`<label>${referenceLabels[index] ?? (count === 1 ? "Trusted instrument" : `Voltage ${index + 1}`)} trusted reference
          <span>V</span><input aria-label=${`${referenceLabels[index] ?? "Voltage"} reference (V)`} type="number" min="0.01" step="0.01" .value=${references[index] ? String(references[index]) : ""}
            @input=${(event) => setReference(index, Number(event.target.value))} /></label>`)}
      </div>
      <div class="calibration-actions"><button class="secondary" @click=${check} ?disabled=${busy}>${busy ? "Loading live voltage data…" : "Check stability"}</button>
        <button class="primary" @click=${calibrate} ?disabled=${busy || !referenceReady || !stability2?.stable || terminal || complete && !retry}>${retry ? "Retry voltage calibration" : "Calibrate voltage"}</button></div>
      ${stability2 ? b`<div class=${stability2.stable ? "success-band" : "warning-band"} role="status">${stability2.stable ? "Stable and ready for calibration." : stability2.windows.length ? "Data is changing too much; keep the load and reference steady." : "Waiting for live data…"}</div>` : ""}
      ${stabilityEvidence(stability2)}
      ${complete ? b`<div class="success-band" role="status">Voltage calibration complete for ${boardLabel2}.</div>` : ""}
      ${results.map((result) => calibrationEvidence(result))}
      ${results.some((result) => result.state === "indeterminate") ? b`<aside class="recovery-panel" role="status"><strong>Calibration outcome indeterminate</strong><p>No automatic retry will be made.</p><button class="secondary" @click=${reconnect}>Reconnect and inspect</button><button class="danger" @click=${cancel}>Cancel session</button></aside>` : ""}
      </div>
    </section>
  `;
}
const LABELS = {
  device: "Device",
  "legacy-review": "Review Existing Setup",
  meter: "Meter",
  ct: "Circuits & CTs",
  "install-configuration": "Install Configuration",
  calibration: "Calibration",
  "save-calibration": "Save Calibration",
  complete: "Complete"
};
function workflowProgress(phases, mobileOpen, toggle, navigateToSetup, busy) {
  const current = phases.find((phase) => phase.status === "current");
  return b`
    <aside class=${mobileOpen ? "workflow mobile-open" : "workflow"}>
      <div class="brand">CircuitSetup</div>
      <nav aria-label="Setup progress">
        <ol>${phases.map((phase) => b`
          <li class=${phase.status}>
            ${phase.id === "device" && phase.status === "completed" ? b`<button class="step-button" ?disabled=${busy} @click=${navigateToSetup}>
                  <span class="number">${phase.index + 1}</span><span>${LABELS[phase.id]}</span>
                </button>` : b`<div class="step-button" aria-current=${phase.status === "current" ? "step" : A}>
                  <span class="number">${phase.index + 1}</span><span>${LABELS[phase.id]}</span>
                </div>`}
          </li>
        `)}</ol>
      </nav>
    </aside>
    <div class="mobile-progress">
      <span>${current ? `Phase ${current.index + 1} of ${phases.length} — ${LABELS[current.id]}` : "Workflow complete"}</span>
      <button aria-label="Show setup steps" aria-expanded=${mobileOpen} @click=${toggle}>Steps</button>
    </div>
  `;
}
const panelStyles = i$5`
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
  aside.workflow nav ol { list-style: none; margin: 0; padding: 0; }
  aside.workflow nav li { position: relative; min-height: 60px; }
  aside.workflow nav li:not(:last-child)::after { content: ""; position: absolute; left: 25px; top: 42px; width: 1px; height: 20px; background: var(--border); }
  .step-button { display: grid; grid-template-columns: 36px 1fr; gap: 10px; align-items: center; width: 100%; padding: 4px 8px; border: 0; background: transparent; color: inherit; text-align: left; font-weight: var(--ha-font-weight-medium, 500); }
  .step-button .number { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--border); border-radius: 50%; }
  li.current .step-button { color: var(--accent); background: var(--surface-alt); font-weight: var(--ha-font-weight-bold, 700); }
  li.current .number { color: var(--on-accent); background: var(--accent); border-color: var(--accent); }
  li.completed .step-button { color: var(--muted); }
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
  .existing-configuration .status-list > div { display: grid; grid-template-columns: minmax(190px, 240px) minmax(0, 1fr); gap: 12px; }
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
  .ct-header, .ct-row { display: grid; grid-template-columns: .45fr .45fr 1.35fr 1fr 1.45fr 1fr; align-items: center; gap: 10px; padding: 11px 12px; }
  .ct-header { font-weight: var(--ha-font-weight-bold, 700); background: var(--surface-alt); }
  .ct-row { min-height: 66px; border-top: 1px solid var(--border); }
  .ct-index { font-weight: var(--ha-font-weight-bold, 700); }
  .ct-row input, .ct-row select { width: 100%; min-width: 0; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-small); }
  .ct-row input[type="checkbox"] { width: auto; }
  .row-toggle { color: var(--accent); border: 0; padding: 4px; }
  .preserve-gain { margin: 10px 12px; }
  .technical-details { margin: 0; border-radius: 0; border-width: 1px 0 0; }
  .mobile-label { display: none; }
  .ct-detail { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 32px; padding: 16px 30px; background: var(--surface-alt); border-top: 1px solid var(--border); }
  .aggregate-list { display: grid; gap: 16px; margin: 14px 0; }
  .default-totals { display: grid; gap: 12px; margin: 24px 0; }
  .default-totals h2, .default-totals p { margin: 0; }
  .automatic-totals { display: grid; gap: 12px; margin: 24px 0; }
  .automatic-totals h2, .automatic-totals p { margin: 0; }
  .automatic-total-card { margin: 0; padding: 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
  .automatic-total-card > legend { padding: 0 8px; }
  .automatic-total-controls { display: flex; flex-wrap: wrap; gap: 10px 18px; }
  .automatic-total-control { display: flex; align-items: center; gap: 8px; min-height: 44px; font-weight: var(--ha-font-weight-bold, 700); }
  .default-total-card { margin: 0; padding: 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
  .default-total-card > legend { padding: 0 8px; }
  .default-total-controls { display: flex; flex-wrap: wrap; gap: 10px 18px; }
  .totals-migration fieldset { margin-block: 12px; min-width: 0; }
  .migration-actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .default-total-control { display: flex; align-items: center; gap: 8px; min-height: 44px; font-weight: var(--ha-font-weight-bold, 700); }
  .native-total-status { color: var(--muted); }
  .aggregate-card { padding: 18px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
  .aggregate-card > legend { padding: 0 8px; }
  .aggregate-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 22px; }
  .aggregate-fields label { display: grid; align-content: start; gap: 6px; font-weight: var(--ha-font-weight-bold, 700); }
  .aggregate-fields input, .aggregate-fields select { width: 100%; padding: 10px; border: 1px solid var(--border); }
  .aggregate-fields small { color: var(--muted); font-weight: var(--ha-font-weight-normal, 400); }
  .aggregate-channels { margin: 18px 0 14px; }
  .aggregate-sources { margin: 18px 0; min-width: 0; }
  .aggregate-source-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .source-explanation { display: block; color: var(--muted); }
  .advanced-totals > .aggregate-list, .advanced-totals > p { margin: 14px; }
  .aggregate-channels > legend { font-size: var(--ha-font-size-l, 16px); }
  .aggregate-channel-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .aggregate-channel-group { padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-small); background: var(--surface-alt); }
  .aggregate-channel-group h4 { margin: 0 0 8px; }
  .aggregate-channel-group > div { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
  .aggregate-channel-option { display: flex; align-items: center; min-width: 0; min-height: 44px; gap: 7px; padding: 5px 8px; border: 1px solid var(--border); border-radius: var(--radius-small); background: var(--surface); cursor: pointer; overflow-wrap: anywhere; }
  .aggregate-channel-option input { flex: 0 0 auto; min-height: auto; margin: 0; }
  .aggregate-channel-option.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }
  .aggregate-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
  .aggregate-actions button { margin-left: auto; }
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
  .package-options-table { max-width: 760px; }
  .package-options-table th:not(:first-child), .package-options-table td { text-align: center; }
  .package-options-table input { width: 18px; height: 18px; }
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
  .calibration-subprogress { max-width: 900px; margin: 0 0 20px; }
  .calibration-subprogress ol { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
  .calibration-subprogress li { min-height: auto; padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--radius-small); }
  .calibration-subprogress li.current { color: var(--on-accent); background: var(--accent); border-color: var(--accent); }
  .calibration-subprogress li.completed { color: var(--success); border-color: var(--success); }
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
  .job-progress { display: grid; gap: 6px; margin-top: 12px; }
  .job-progress progress { width: 100%; }
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
    .ct-detail, .technical-grid, .group-grid, .offset-stage-stepper, .threshold-grid, .meter-settings-grid, .voltage-reference-cards, .voltage-reference-card, .aggregate-fields, .aggregate-channel-groups { grid-template-columns: 1fr; }
    .default-total-controls { align-items: stretch; flex-direction: column; }
    .automatic-total-controls { align-items: stretch; flex-direction: column; }
    .aggregate-channel-group > div { grid-template-columns: 1fr; }
    .aggregate-source-options { grid-template-columns: 1fr; }
    .existing-configuration .status-list > div { grid-template-columns: 1fr; gap: 2px; }
    .aggregate-actions button { width: 100%; margin-left: 0; }
    .progress-steps { grid-template-columns: 1fr; gap: 8px; }
    .action-footer { left: 0; padding: 12px 18px; }
    .offset-step { padding-bottom: 84px; }
    .identity-strip, .confirmation-actions, .group-nav { align-items: stretch; flex-direction: column; }
    .evidence-table { display: block; overflow-x: auto; }
  }
`;
function configurationModeFor(input) {
  if (input.runtimeOnly) return "runtime_only";
  if (input.semanticSource === "helper_managed" || input.journeyOrigin === "new_install") {
    return "helper_managed";
  }
  return "legacy_editable";
}
function workflowRoutes(context) {
  const routes = ["setup"];
  const legacy = context.configurationMode === "legacy_editable";
  if (legacy) routes.push("legacy-review");
  if (legacy && context.legacyChoice === null) return routes;
  const configurationEnabled = context.configurationMode !== "runtime_only" && (!legacy || context.legacyChoice === "manage_with_helper");
  if (configurationEnabled) {
    routes.push("meter", "ct");
    if (context.normalTransactionRequired || context.normalTransactionActive || context.normalTransactionVerified) {
      routes.push("install-configuration");
    }
  }
  routes.push("calibration-plan");
  if (context.calibrationPlan === "standard" || context.calibrationPlan === "full") {
    routes.push("safety");
    if (context.calibrationPlan === "full") routes.push("offset");
    routes.push("voltage", "current");
    if (restartRequired(context)) routes.push("restart");
    if (context.configurationMode !== "runtime_only" && saveCalibrationRequired(context)) {
      routes.push("save-calibration");
    }
  }
  if (context.calibrationPlan !== null) routes.push("summary");
  return routes;
}
function workflowPhases(context, activeRoute) {
  const routes = workflowRoutes(context);
  if (!routes.includes(activeRoute)) throw new Error(`invalid workflow route: ${activeRoute}`);
  const ids = [...new Set(routes.map(phaseIdForRoute))];
  const current = ids.indexOf(phaseIdForRoute(activeRoute));
  return ids.map((id2, index) => ({ id: id2, index, status: statusFor(index, current) }));
}
function calibrationSubsteps(context, activeRoute) {
  const ids = ["calibration-plan"];
  if (context.calibrationPlan === "standard" || context.calibrationPlan === "full") {
    ids.push("safety");
    if (context.calibrationPlan === "full") ids.push("offset");
    ids.push("voltage", "current");
    if (restartRequired(context)) ids.push("restart");
  }
  const current = ids.indexOf(activeRoute);
  const completed = phaseIdForRoute(activeRoute) === "save-calibration" || activeRoute === "summary";
  return ids.map((id2, index) => ({
    id: id2,
    status: completed ? "completed" : statusFor(index, current)
  }));
}
function previousWorkflowRoute(context, activeRoute) {
  const routes = workflowRoutes(context);
  const index = routes.indexOf(activeRoute);
  return index > 0 ? routes[index - 1] : null;
}
function resumeWorkflowRoute(context) {
  if (context.transactionPurpose === "save_calibration" && (context.handoffAvailable || context.handoffInstalled)) {
    return "save-calibration";
  }
  if (context.normalTransactionActive) return "install-configuration";
  if (context.sessionState === "applied_pending_restart_verification") return "restart";
  if (context.sessionState === "verified" || context.restartVerification) {
    return context.handoffAvailable ? "save-calibration" : "summary";
  }
  if (context.sessionState === "safety_required" || context.sessionState === "preflight_failed") {
    return "safety";
  }
  if (context.sessionState !== null) {
    if (context.calibrationPlan === "full" && !["completed", "skipped"].includes(context.offsetDisposition ?? "")) {
      return "offset";
    }
    return "voltage";
  }
  const routes = workflowRoutes(context);
  return routes.at(-1) === "summary" ? routes.at(-2) ?? "summary" : routes.at(-1) ?? "setup";
}
function restartRequired(context) {
  return !context.completedWithoutCalibration && (context.pendingCalibration || context.restartVerification || context.sessionState === "applied_pending_restart_verification" || context.sessionState === "verified");
}
function saveCalibrationRequired(context) {
  return context.handoffAvailable || context.handoffInstalled || context.transactionPurpose === "save_calibration";
}
function statusFor(index, current) {
  if (current < 0 || index > current) return "upcoming";
  return index < current ? "completed" : "current";
}
function phaseIdForRoute(route) {
  switch (route) {
    case "setup":
      return "device";
    case "legacy-review":
      return "legacy-review";
    case "meter":
      return "meter";
    case "ct":
      return "ct";
    case "install-configuration":
      return "install-configuration";
    case "calibration-plan":
    case "safety":
    case "offset":
    case "voltage":
    case "current":
    case "restart":
      return "calibration";
    case "save-calibration":
      return "save-calibration";
    case "summary":
      return "complete";
    default:
      return assertNever(route);
  }
}
function assertNever(value) {
  throw new Error(`unhandled workflow value: ${String(value)}`);
}
const ROUTE_LABELS = {
  setup: "Setup Device",
  "legacy-review": "Review Existing Setup",
  meter: "Meter Settings",
  ct: "Circuits & CTs",
  "install-configuration": "Install Configuration",
  "calibration-plan": "Calibration Plan",
  safety: "Safety",
  offset: "Offset",
  voltage: "Voltage",
  current: "Current",
  restart: "Restart",
  "save-calibration": "Save Calibration",
  summary: "Summary"
};
const CALIBRATION_LABELS = {
  "calibration-plan": "Plan",
  safety: "Safety",
  offset: "Offset",
  voltage: "Voltage",
  current: "Current",
  restart: "Restart & verify"
};
const CIRCUITSETUP_PROJECT_PREFIX = "circuitsetup.6c-energy-meter";
const REBIND_TIMEOUT_MS = 1e4;
const REBIND_RETRY_MS = 250;
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const meterSettings = ({ authoritative: _authoritative, warnings: _warnings, ...meter }) => meter;
const profileNominalVoltage = (system) => system === "split_phase_120_240" ? 120 : system === "single_phase_230" ? 230 : null;
const ENTITY_COUNT_WARNING_THRESHOLD = 100;
class CircuitSetupPanel extends i$2 {
  constructor() {
    super(...arguments);
    this.hass = null;
    this.panel = null;
    this.api = null;
    this.setup = null;
    this.step = "setup";
    this.journeyOrigin = "existing_meter";
    this.configurationMode = null;
    this.existingConfigurationChoice = null;
    this.calibrationPlan = null;
    this.transactionPurpose = null;
    this.selectedDeviceId = null;
    this.topology = null;
    this.inventory = null;
    this.transaction = null;
    this.session = null;
    this.stabilityByTarget = /* @__PURE__ */ new Map();
    this.calibrationByTarget = /* @__PURE__ */ new Map();
    this.restartResult = null;
    this.completedWithoutChanges = false;
    this.configurationInstalled = false;
    this.offsetReadinessByTarget = /* @__PURE__ */ new Map();
    this.offsetResultByTarget = /* @__PURE__ */ new Map();
    this.calibrationHandoff = false;
    this.handoffDeclined = false;
    this.addonCount = 0;
    this.packageOptions = newInstallPackageOptions(0);
    this.sourcePackageOptions = newInstallPackageOptions(0);
    this.packageOptionsTouched = false;
    this.connection = "wifi";
    this.meterSettingsDraft = null;
    this.meterConfiguration = null;
    this.verifiedMeterConfiguration = null;
    this.sourceMeterConfiguration = null;
    this.multiReferencePreparationAcknowledged = false;
    this.meterProfileConfirmed = false;
    this.meterFrequencyTouched = false;
    this.meterNominalVoltageTouched = /* @__PURE__ */ new Set();
    this.canonicalConfigurationChanged = false;
    this.legacyCircuitSemanticsConfirmed = false;
    this.totalGraphPreview = null;
    this.totalGraphState = "ready";
    this.issuedAutomaticSettings = [];
    this.acceptedAutomaticInputs = null;
    this.board = 0;
    this.group = 0;
    this.channel = 1;
    this.voltageReferences = /* @__PURE__ */ new Map();
    this.currentReferences = /* @__PURE__ */ new Map();
    this.reportingMultiplier = null;
    this.safetyAcknowledged = false;
    this.offsetStage = 1;
    this.offsetAcknowledged = [false, false];
    this.offsetRetryConfirmed = false;
    this.drafts = /* @__PURE__ */ new Map();
    this.reviewCorrection = null;
    this.labelOnly = false;
    this.error = "";
    this.announcement = "";
    this.firmwareIndex = null;
    this.firmwareCatalogState = "idle";
    this.firmwareCatalogError = "";
    this.selectedEspHomeVersion = null;
    this.resolvedFirmwareOptions = [];
    this.firmwareFetchController = null;
    this.setupDeviceIds = /* @__PURE__ */ new Set();
    this.unsubs = [];
    this.connectionGeneration = 0;
    this.operationGeneration = 0;
    this.transactionSubscriptionScope = 0;
    this.sessionSubscriptionScope = 0;
    this.transactionUnsub = null;
    this.sessionUnsub = null;
    this.setupUnsub = null;
    this.sessionStarting = false;
    this.pendingAction = "";
    this.importFailedDeviceId = null;
    this.newInstallDeviceId = null;
    this.voltageBusy = false;
    this.offsetBusy = false;
    this.finishBusy = false;
    this.restartBusy = false;
    this.voltageSkipped = false;
    this.currentSkipped = false;
    this.mobileStepsOpen = false;
    this.focusHeading = false;
    this.lastFocusedError = "";
  }
  static {
    this.styles = panelStyles;
  }
  static {
    this.properties = {
      hass: { attribute: false },
      panel: { attribute: false }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    const generation = ++this.connectionGeneration;
    this.loadFirmwareIndex();
    void this.ensureApi(generation);
  }
  disconnectedCallback() {
    ++this.connectionGeneration;
    ++this.operationGeneration;
    ++this.transactionSubscriptionScope;
    ++this.sessionSubscriptionScope;
    for (const unsub of this.unsubs.splice(0)) {
      try {
        unsub();
      } catch {
      }
    }
    this.transactionUnsub = null;
    this.sessionUnsub = null;
    this.setupUnsub = null;
    this.api = null;
    this.firmwareFetchController?.abort();
    this.firmwareFetchController = null;
    this.firmwareIndex = null;
    this.firmwareCatalogState = "idle";
    this.firmwareCatalogError = "";
    this.resolvedFirmwareOptions = [];
    this.setupDeviceIds = /* @__PURE__ */ new Set();
    this.newInstallDeviceId = null;
    this.pendingAction = "";
    super.disconnectedCallback();
  }
  updated(changed) {
    if ((changed.has("hass") || changed.has("panel")) && this.isConnected) void this.ensureApi(this.connectionGeneration);
    if (!this.error) this.lastFocusedError = "";
    if (this.error && this.error !== this.lastFocusedError) {
      this.lastFocusedError = this.error;
      this.shadowRoot?.querySelector("[role=alert]")?.focus();
    } else if (this.focusHeading) {
      this.focusHeading = false;
      this.shadowRoot?.querySelector("#step-heading")?.focus();
    }
  }
  async ensureApi(generation) {
    if (this.api || !this.isConnected || !this.hass || !this.panel?.config.entry_id) return;
    const api = new HelperApi(this.hass, this.panel.config.entry_id);
    this.api = api;
    try {
      const setup2 = await api.setupStatus();
      if (!this.owns(generation, api)) return;
      this.setup = setup2;
      this.setupDeviceIds = new Set(setup2.devices.map((device2) => device2.entry_id));
      const intent = this.setup.installer_intent;
      if (intent) {
        this.addonCount = intent.addon_count;
        this.connection = intent.connection_type;
        this.packageOptions = intent.power_quality && intent.status_fields ? { power_quality: [...intent.power_quality], status_fields: [...intent.status_fields] } : newInstallPackageOptions(intent.addon_count);
        this.sourcePackageOptions = newInstallPackageOptions(intent.addon_count);
        this.refreshFirmwareOptions();
      }
      if (this.setup.devices.length && !this.selectedDeviceId) this.selectDevice(this.firstDeviceId(this.setup.devices));
      await this.subscribeSetup(generation, api);
      if (this.transaction) await this.subscribeTransaction(generation);
      if (this.session && this.session.state !== "cancelled") await this.subscribeSession(generation);
    } catch (error) {
      if (this.owns(generation, api)) this.fail(error, "Setup status could not be loaded.");
    }
    this.requestUpdate();
  }
  owns(generation, api) {
    return this.isConnected && generation === this.connectionGeneration && api === this.api;
  }
  ownsFirmwareCatalog(generation, controller) {
    return this.isConnected && generation === this.connectionGeneration && controller === this.firmwareFetchController;
  }
  async subscribeSetup(generation, api) {
    await this.ownSubscription(api.subscribeSetup((snapshot) => {
      if (!this.owns(generation, api)) return;
      this.receiveSetupSnapshot(snapshot, true);
    }), generation, api, () => this.setupUnsub === null, (unsubscribe) => {
      this.setupUnsub = unsubscribe;
    });
  }
  receiveSetupSnapshot(snapshot, allowAutomaticImport) {
    const discovered = snapshot.devices.filter((device2) => !this.setupDeviceIds.has(device2.entry_id)).sort((first, second) => first.entry_id.localeCompare(second.entry_id));
    const eligible = discovered.filter((device2) => device2.project_name.startsWith(CIRCUITSETUP_PROJECT_PREFIX));
    this.setup = snapshot;
    this.setupDeviceIds = new Set(snapshot.devices.map((device2) => device2.entry_id));
    if (this.pendingAction) {
      this.requestUpdate();
      return;
    }
    if (this.step !== "setup" || this.topology || !eligible.length) return this.requestUpdate();
    if (allowAutomaticImport && eligible.length === 1 && !this.pendingAction) {
      const deviceId = eligible[0].entry_id;
      this.newInstallDeviceId = deviceId;
      this.selectDevice(deviceId);
      this.announcement = "Device added to Home Assistant. Importing into ESPHome Builder…";
      void this.adopt(deviceId);
      return;
    }
    this.selectDevice(eligible.length === 1 ? eligible[0].entry_id : null);
    this.announcement = eligible.length > 1 ? "Multiple CircuitSetup meters were discovered. Choose one to import." : "CircuitSetup energy meter discovered.";
    this.requestUpdate();
  }
  loadFirmwareIndex() {
    if (this.firmwareCatalogState === "loading" || this.firmwareIndex) return;
    const generation = this.connectionGeneration;
    const controller = new AbortController();
    this.firmwareFetchController?.abort();
    this.firmwareFetchController = controller;
    this.firmwareCatalogState = "loading";
    this.firmwareCatalogError = "";
    this.requestUpdate();
    void fetchFirmwareIndex(globalThis.fetch, controller.signal).then((index) => {
      if (!this.ownsFirmwareCatalog(generation, controller)) return;
      this.firmwareIndex = index;
      this.firmwareFetchController = null;
      this.firmwareCatalogState = "ready";
      this.refreshFirmwareOptions();
    }).catch(() => {
      if (!this.ownsFirmwareCatalog(generation, controller)) return;
      this.firmwareFetchController = null;
      this.firmwareCatalogState = "error";
      this.firmwareCatalogError = "Firmware catalog could not be loaded.";
      this.requestUpdate();
    });
  }
  refreshFirmwareOptions() {
    const options = this.firmwareIndex ? resolveFirmwareOptions(this.firmwareIndex, this.addonCount, this.connection) : [];
    const previous = this.selectedEspHomeVersion;
    const selected = chooseFirmwareVersion(options, previous);
    this.resolvedFirmwareOptions = options;
    this.selectedEspHomeVersion = selected;
    if (previous && selected !== previous) this.announcement = selected ? `Firmware version changed to ${selected}.` : "No firmware version is available for this hardware.";
    this.requestUpdate();
  }
  selectFirmwareVersion(version) {
    if (!this.resolvedFirmwareOptions.some((option) => option.version === version)) return;
    this.selectedEspHomeVersion = version;
    this.requestUpdate();
  }
  retryFirmwareIndex() {
    this.firmwareCatalogError = "";
    this.firmwareCatalogState = "idle";
    this.requestUpdate();
    this.loadFirmwareIndex();
  }
  selectedFirmware() {
    return this.resolvedFirmwareOptions.find((option) => option.version === this.selectedEspHomeVersion) ?? null;
  }
  ownsOperation(generation, api, deviceId) {
    return generation === this.operationGeneration && api === this.api && deviceId === this.selectedDeviceId;
  }
  async ownSubscription(pending, generation, api, isCurrent = () => true, onOwned = () => void 0) {
    const unsubscribe = await pending;
    if (!this.owns(generation, api) || !isCurrent()) {
      try {
        unsubscribe();
      } catch {
      }
      return;
    }
    this.unsubs.push(unsubscribe);
    onOwned(unsubscribe);
  }
  clearSubscription(kind) {
    if (kind === "transaction") ++this.transactionSubscriptionScope;
    else ++this.sessionSubscriptionScope;
    const unsubscribe = kind === "transaction" ? this.transactionUnsub : this.sessionUnsub;
    if (kind === "transaction") this.transactionUnsub = null;
    else this.sessionUnsub = null;
    if (!unsubscribe) return;
    const index = this.unsubs.indexOf(unsubscribe);
    if (index >= 0) this.unsubs.splice(index, 1);
    try {
      unsubscribe();
    } catch {
    }
  }
  clearSetupSubscription() {
    const unsubscribe = this.setupUnsub;
    this.setupUnsub = null;
    if (!unsubscribe) return;
    const index = this.unsubs.indexOf(unsubscribe);
    if (index >= 0) this.unsubs.splice(index, 1);
    try {
      unsubscribe();
    } catch {
    }
  }
  resetCalibrationRun() {
    this.safetyAcknowledged = false;
    this.stabilityByTarget = /* @__PURE__ */ new Map();
    this.calibrationByTarget = /* @__PURE__ */ new Map();
    this.restartResult = null;
    this.completedWithoutChanges = false;
    this.offsetReadinessByTarget = /* @__PURE__ */ new Map();
    this.offsetResultByTarget = /* @__PURE__ */ new Map();
    this.calibrationHandoff = false;
    this.handoffDeclined = false;
    this.group = 0;
    this.channel = 1;
    this.voltageReferences = /* @__PURE__ */ new Map();
    this.currentReferences = /* @__PURE__ */ new Map();
    this.reportingMultiplier = null;
    this.offsetStage = 1;
    this.offsetAcknowledged = [false, false];
    this.offsetRetryConfirmed = false;
    this.finishBusy = false;
    this.restartBusy = false;
    this.voltageSkipped = false;
    this.currentSkipped = false;
  }
  selectDevice(deviceId) {
    ++this.operationGeneration;
    this.clearSubscription("transaction");
    this.clearSubscription("session");
    const isNewInstall = deviceId !== null && deviceId === this.newInstallDeviceId;
    this.selectedDeviceId = deviceId;
    if (deviceId !== this.newInstallDeviceId) this.newInstallDeviceId = null;
    this.journeyOrigin = isNewInstall ? "new_install" : "existing_meter";
    this.configurationMode = null;
    this.existingConfigurationChoice = null;
    this.calibrationPlan = null;
    this.transactionPurpose = null;
    this.topology = null;
    this.inventory = null;
    this.transaction = null;
    this.reviewCorrection = null;
    this.session = null;
    this.drafts = /* @__PURE__ */ new Map();
    this.meterSettingsDraft = null;
    this.meterConfiguration = null;
    this.verifiedMeterConfiguration = null;
    this.sourceMeterConfiguration = null;
    this.packageOptionsTouched = false;
    this.multiReferencePreparationAcknowledged = false;
    this.meterProfileConfirmed = this.configurationMode === "helper_managed";
    this.meterFrequencyTouched = false;
    this.meterNominalVoltageTouched = /* @__PURE__ */ new Set();
    this.canonicalConfigurationChanged = false;
    this.configurationInstalled = false;
    this.totalGraphPreview = null;
    this.totalGraphState = "ready";
    this.issuedAutomaticSettings = [];
    this.acceptedAutomaticInputs = null;
    this.board = 0;
    this.resetCalibrationRun();
  }
  firstDeviceId(devices) {
    return devices.map((device2) => device2.entry_id).sort((first, second) => first.localeCompare(second))[0] ?? null;
  }
  showTopology(topology2) {
    this.topology = topology2;
    this.error = topologyMismatch(topology2) || topology2.project_name !== this.selectedProjectName() ? "Topology mismatch" : "";
    this.requestUpdate();
  }
  showTopologyResult(result) {
    if ("topology" in result && result.topology) {
      if (result.package_options) {
        if (this.selectedDeviceId !== this.newInstallDeviceId) {
          this.packageOptions = {
            power_quality: [...result.package_options.power_quality],
            status_fields: [...result.package_options.status_fields]
          };
        }
        this.sourcePackageOptions = {
          power_quality: [...result.package_options.power_quality],
          status_fields: [...result.package_options.status_fields]
        };
      }
      this.showTopology(result.topology);
    } else {
      this.sourcePackageOptions = null;
      this.showTopology(result);
    }
  }
  setAddonCount(value) {
    this.addonCount = value;
    this.packageOptions = resizePackageOptions(this.packageOptions, value);
    this.sourcePackageOptions = newInstallPackageOptions(value);
    this.refreshFirmwareOptions();
  }
  initializeInventory(inventory) {
    const configured = new Map(this.meterConfiguration?.configuration.channels.map((channel) => [channel.channel, channel]) ?? []);
    this.inventory = { ...inventory, channels: inventory.channels.map((channel) => {
      const settings = configured.get(channel.channel);
      return settings && this.configurationMode !== "legacy_editable" ? {
        ...channel,
        name: settings.name,
        selected_model_id: settings.model_id,
        reporting_multiplier: settings.reporting_multiplier,
        display_label: settings.custom_label,
        selection_verified_against_config: true,
        stored_selection_present: true
      } : channel;
    }) };
    this.drafts = new Map(this.inventory.channels.map((channel) => {
      const settings = configured.get(channel.channel);
      const modelId = channel.selected_model_id ?? "";
      const preset = inventory.catalog.presets.find((item) => item.model_id === modelId);
      return [channel.channel, {
        name: channel.name,
        modelId,
        multiplier: channel.reporting_multiplier,
        customGainCt: modelId === "custom" ? settings?.custom_gain_ct ?? channel.raw_gain_ct * channel.reporting_multiplier : void 0,
        customLabel: channel.display_label ?? void 0,
        burdenAcknowledged: settings?.burden_output_acknowledged ?? (channel.selection_verified_against_config && (modelId === "custom" || preset?.requires_burden_jumper_cut === true)),
        expanded: channel.selected_model_id === null && channel.raw_gain_ct === 27518,
        preserveExistingGain: this.configurationMode === "legacy_editable" && !channel.selection_verified_against_config && channel.raw_gain_ct > 0,
        multiplierMode: "automatic"
      }];
    }));
    this.error = "";
    this.requestUpdate();
  }
  showInventory(inventory) {
    this.initializeInventory(inventory);
    const routes = workflowRoutes(this.workflowContext());
    this.navigate(routes.includes("ct") ? "ct" : this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === null ? "legacy-review" : "calibration-plan");
  }
  acceptInstalledDrafts() {
    if (!this.inventory) return;
    this.inventory = { ...this.inventory, channels: this.inventory.channels.map((channel) => {
      const draft = this.drafts.get(channel.channel);
      if (!draft) return channel;
      if (draft.preserveExistingGain) return { ...channel, name: draft.name.trim() };
      const preset = this.inventory.catalog.presets.find((item) => item.model_id === draft.modelId);
      const gain = preset?.default_gain_ct ?? draft.customGainCt;
      return {
        ...channel,
        name: draft.name.trim(),
        selected_model_id: draft.modelId,
        reporting_multiplier: draft.multiplier,
        raw_gain_ct: gain === void 0 ? channel.raw_gain_ct : Math.round(gain / draft.multiplier),
        display_label: draft.modelId === "custom" ? draft.customLabel?.trim() || null : null,
        selection_verified_against_config: true,
        stored_selection_present: true
      };
    }) };
  }
  workflowContext() {
    const runtimeOnly = this.configurationMode === "runtime_only" || this.configurationMode === null && !this.selectedConfigurationAvailable() && this.meterConfiguration === null;
    const mode = this.configurationMode ?? configurationModeFor({
      journeyOrigin: this.journeyOrigin,
      semanticSource: this.meterConfiguration?.capabilities.semantic_source ?? null,
      runtimeOnly
    });
    const purpose = this.transactionPurpose ?? (this.transaction ? this.calibrationHandoff ? "save_calibration" : "install_configuration" : null);
    const normalTransaction = purpose === "install_configuration" ? this.transaction : null;
    return {
      journeyOrigin: this.journeyOrigin,
      configurationMode: mode,
      legacyChoice: this.existingConfigurationChoice ?? (this.configurationMode === null && mode === "legacy_editable" ? "manage_with_helper" : null),
      calibrationPlan: this.session?.calibration_plan ?? this.calibrationPlan ?? "full",
      canonicalConfigurationChanged: this.hasCanonicalChanges(),
      normalTransactionRequired: this.hasCanonicalChanges() || normalTransaction !== null,
      normalTransactionActive: normalTransaction !== null && !["verified", "rolled_back"].includes(normalTransaction.state),
      normalTransactionVerified: normalTransaction?.state === "verified",
      transactionPurpose: purpose,
      sessionState: this.session?.state ?? null,
      offsetDisposition: this.session?.offset_disposition ?? null,
      pendingCalibration: this.session?.has_pending_calibration ?? false,
      restartVerification: this.restartResult !== null,
      handoffAvailable: this.restartResult?.source_handoff_available ?? false,
      handoffInstalled: this.restartResult?.source_handoff_firmware_installed ?? false,
      completedWithoutCalibration: this.completedWithoutChanges
    };
  }
  progressContext() {
    const context = this.workflowContext();
    if (workflowRoutes(context).includes(this.step)) return context;
    return {
      ...context,
      legacyChoice: context.legacyChoice ?? "manage_with_helper",
      calibrationPlan: context.calibrationPlan ?? "full",
      normalTransactionRequired: context.normalTransactionRequired || this.step === "install-configuration",
      transactionPurpose: this.step === "save-calibration" ? "save_calibration" : context.transactionPurpose,
      pendingCalibration: context.pendingCalibration || this.step === "restart",
      handoffAvailable: context.handoffAvailable || this.step === "save-calibration"
    };
  }
  showState(step) {
    this.navigate(step, true);
  }
  navigate(step, controlledRecovery = false) {
    if (!controlledRecovery && !workflowRoutes(this.workflowContext()).includes(step)) {
      this.fail(new Error(), "That workflow step is not available for the selected meter.");
      return;
    }
    this.step = step;
    this.error = "";
    this.mobileStepsOpen = false;
    this.focusHeading = true;
    this.requestUpdate();
  }
  back() {
    if ((this.step === "install-configuration" || this.step === "save-calibration") && !this.transaction) {
      this.navigate(this.step === "save-calibration" ? "restart" : "ct", true);
      return;
    }
    const previous = previousWorkflowRoute(this.workflowContext(), this.step);
    if (previous === null) return;
    if (this.step === "safety") void this.cancelSession(previous);
    else if (this.step === "install-configuration" || this.step === "save-calibration") {
      void this.backFromBuild();
    } else this.navigate(previous);
  }
  returnToSetup() {
    if (this.pendingAction === "session") return;
    if (this.session && this.session.state !== "cancelled") void this.cancelSession("setup");
    else {
      this.selectDevice(null);
      this.navigate("setup");
    }
  }
  async configureDevice(deviceId) {
    if (this.pendingAction) return;
    if (this.setup?.bound_device_id !== void 0 && this.setup.bound_device_id !== deviceId) {
      await this.adopt(deviceId);
      return;
    }
    this.newInstallDeviceId = null;
    this.selectDevice(deviceId);
    this.pendingAction = `topology:${deviceId}`;
    this.requestUpdate();
    try {
      await this.loadTopology();
    } finally {
      this.pendingAction = "";
      this.requestUpdate();
    }
  }
  selectedProjectVersion() {
    return this.setup?.devices.find((device2) => device2.entry_id === this.selectedDeviceId)?.project_version ?? null;
  }
  selectedProjectName() {
    return this.setup?.devices.find((device2) => device2.entry_id === this.selectedDeviceId)?.project_name ?? null;
  }
  selectedConfiguration() {
    return this.setup?.devices.find((device2) => device2.entry_id === this.selectedDeviceId)?.configuration ?? null;
  }
  selectedConfigurationAvailable() {
    return this.selectedConfiguration() !== null || this.setup?.configuration_authoritative !== false;
  }
  showRecovery(state) {
    if (state === "calibration_outcome_indeterminate") {
      this.navigate("current", true);
      this.calibrationByTarget = new Map(this.calibrationByTarget).set(`current:${this.channel}`, {
        state,
        group_key: "",
        phase: null,
        changed_channels: [],
        iteration: 1,
        before_values: [],
        after_values: [],
        error_percent_values: [],
        gain_evidence: null,
        restore_evidence: null,
        retry_allowed: false
      });
    } else {
      this.navigate("restart", true);
      if (this.session) this.session = { ...this.session, state };
      else this.error = "Restart verification failed; review rollback and recovery evidence.";
    }
    this.requestUpdate();
  }
  async rescan() {
    if (!this.api || this.pendingAction) return;
    this.pendingAction = "rescan";
    this.requestUpdate();
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const setupDeviceIds = new Set(this.setupDeviceIds);
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      await api.setInstallerIntent(
        this.addonCount,
        this.connection,
        this.selectedFirmware(),
        this.packageOptions,
        null,
        null
      );
      if (!this.ownsOperation(generation, api, deviceId)) return;
      const setup2 = await api.rescan();
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.pendingAction = "";
      this.setupDeviceIds = setupDeviceIds;
      this.receiveSetupSnapshot(setup2, true);
      if (!setup2.devices.length) {
        this.announcement = "No compatible meter found. Check the network and rescan.";
      }
    }, "Rescan failed.", () => this.ownsOperation(generation, api, deviceId));
    if (this.pendingAction === "rescan") this.pendingAction = "";
    this.requestUpdate();
  }
  async adopt(deviceId = this.selectedDeviceId) {
    if (!this.api || !deviceId || this.pendingAction) return;
    if (deviceId !== this.selectedDeviceId) this.selectDevice(deviceId);
    const api = this.api;
    const generation = ++this.operationGeneration;
    const connectionGeneration = this.connectionGeneration;
    this.pendingAction = `adopt:${deviceId}`;
    this.importFailedDeviceId = null;
    this.error = "";
    this.requestUpdate();
    try {
      await api.adoptDevice(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.clearSetupSubscription();
      const setup2 = await this.waitForBinding(api, deviceId, generation);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.setup = setup2;
      this.setupDeviceIds = new Set(setup2.devices.map((device2) => device2.entry_id));
      await this.subscribeSetup(connectionGeneration, api);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      const importedConfiguration = await api.getMeterConfiguration(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.setMeterConfiguration(importedConfiguration);
      const result = await api.getTopology(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.importFailedDeviceId = null;
      this.announcement = "Meter imported into ESPHome Builder.";
      this.showTopologyResult(result);
      await this.restoreActiveWork(api, deviceId, generation);
    } catch (error) {
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.importFailedDeviceId = deviceId;
      const message = error.code === "device_busy" ? "Finish or cancel current work before importing another meter." : error instanceof Error && error.message === "helper rebind timed out" ? "Import completed, but Home Assistant is still reconnecting. Retry import or reload the helper." : this.safeErrorMessage(error, "Adoption is unavailable for this meter.");
      this.fail(error, message);
    } finally {
      if (this.ownsOperation(generation, api, deviceId)) {
        this.pendingAction = "";
        this.requestUpdate();
      }
    }
  }
  async waitForBinding(api, deviceId, generation) {
    const deadline = Date.now() + REBIND_TIMEOUT_MS;
    while (this.ownsOperation(generation, api, deviceId)) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      try {
        const snapshot = await Promise.race([
          api.setupStatus(),
          wait(remaining).then(() => {
            throw new Error("helper rebind timed out");
          })
        ]);
        if (snapshot.bound_device_id === deviceId) return snapshot;
      } catch (error) {
        if (error.code !== "capability_unavailable") throw error;
      }
      if (Date.now() >= deadline) break;
      await wait(Math.min(REBIND_RETRY_MS, deadline - Date.now()));
    }
    throw new Error("helper rebind timed out");
  }
  async loadTopology() {
    if (!this.api || !this.selectedDeviceId) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      const result = await api.getTopology(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.showTopologyResult(result);
      if (!this.selectedConfigurationAvailable()) {
        this.configurationMode = "runtime_only";
      } else {
        const configuration = await api.getMeterConfiguration(deviceId);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.setMeterConfiguration(configuration);
      }
      await this.restoreActiveWork(api, deviceId, generation);
    }, "Topology evidence could not be loaded.", () => this.ownsOperation(generation, api, deviceId));
  }
  async restoreActiveWork(api, deviceId, generation) {
    if (!this.topology) return;
    const active = await api.getActiveWork(deviceId, this.topology);
    if (!this.ownsOperation(generation, api, deviceId)) return;
    this.session = active.session?.state === "cancelled" ? null : active.session;
    this.transaction = active.transaction;
    this.safetyAcknowledged = this.session?.safety_acknowledged ?? false;
    this.calibrationHandoff = Boolean(this.transaction && active.verified_calibration && active.verified_calibration.source_handoff_transaction_id === this.transaction.transaction_id);
    this.transactionPurpose = this.transaction ? this.calibrationHandoff ? "save_calibration" : "install_configuration" : null;
    if (this.transactionPurpose === "install_configuration" && this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === null) this.existingConfigurationChoice = "manage_with_helper";
    this.restartResult = this.calibrationHandoff || this.session?.state === "verified" ? active.verified_calibration : null;
    if (this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === null && (this.session || this.calibrationHandoff || this.restartResult)) this.existingConfigurationChoice = "calibrate_only";
    if (!this.transaction && !this.session && !this.restartResult) return;
    this.navigate(resumeWorkflowRoute(this.workflowContext()));
    if (this.transaction) await this.subscribeTransaction(this.connectionGeneration);
    if (this.session) await this.subscribeSession(this.connectionGeneration);
  }
  async loadInventory() {
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    this.pendingAction = "inventory";
    this.requestUpdate();
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const generation = ++this.operationGeneration;
    try {
      await this.run(async () => {
        if (!this.meterConfiguration) {
          const configuration = await api.getMeterConfiguration(deviceId);
          if (!this.ownsOperation(generation, api, deviceId)) return;
          this.setMeterConfiguration(configuration);
        }
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.initializeInventory(this.meterConfiguration);
        this.navigate(this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === null ? "legacy-review" : "meter");
      }, "Meter settings could not be loaded.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.pendingAction = "";
      this.requestUpdate();
    }
  }
  async backFromBuild() {
    if (!this.api || !this.selectedDeviceId || this.pendingAction) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const current = this.transaction;
    if (current && current.state !== "previewed") {
      this.fail(new Error(), "This review has already advanced. Roll it back before changing the configuration.");
      return;
    }
    const correction = this.reviewCorrection ?? (this.meterConfiguration ? {
      sourceSha256: this.meterConfiguration.source_sha256,
      configuration: {
        ...this.meterConfiguration.configuration,
        multi_reference_preparation_acknowledged: false
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
    if (!this.calibrationHandoff && !correction) {
      this.fail(new Error(), "The edited configuration is unavailable. Return to setup and reload the meter.");
      return;
    }
    this.pendingAction = "review-back";
    this.error = "";
    this.requestUpdate();
    const generation = ++this.operationGeneration;
    let abandoned = current === null;
    try {
      if (current) {
        await api.abandonCtConfig(deviceId, current.transaction_id, current.source_sha256);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.clearSubscription("transaction");
        this.transaction = null;
        abandoned = true;
      }
      if (this.calibrationHandoff) {
        this.calibrationHandoff = false;
        this.navigate("restart");
        return;
      }
      this.reviewCorrection = correction;
      const fresh = await api.getMeterConfiguration(deviceId);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      if (fresh.source_sha256 !== correction.sourceSha256) {
        this.packageOptionsTouched = false;
        this.meterFrequencyTouched = false;
        this.meterNominalVoltageTouched = /* @__PURE__ */ new Set();
        this.setMeterConfiguration(fresh);
        this.showInventory(this.meterConfiguration);
        this.reviewCorrection = null;
        this.error = "The meter source changed while this review was open. Preserved drafts were not restored to avoid overwriting external edits; review the live configuration and reapply changes.";
        this.announcement = this.error;
        return;
      }
      this.setMeterConfiguration(fresh);
      const restoredConfiguration = {
        ...correction.configuration,
        multi_reference_preparation_acknowledged: false
      };
      this.packageOptions = {
        power_quality: [...correction.packageOptions.power_quality],
        status_fields: [...correction.packageOptions.status_fields]
      };
      this.packageOptionsTouched = correction.packageOptionsTouched;
      this.meterFrequencyTouched = correction.meterFrequencyTouched;
      this.meterNominalVoltageTouched = new Set(correction.meterNominalVoltageTouched);
      this.updateCircuitConfiguration(restoredConfiguration);
      this.meterSettingsDraft = {
        ...restoredConfiguration.meter,
        authoritative: fresh.capabilities.configuration_authoritative,
        warnings: fresh.warnings
      };
      this.multiReferencePreparationAcknowledged = false;
      this.canonicalConfigurationChanged = true;
      this.showInventory(this.meterConfiguration);
      this.drafts = new Map(correction.drafts);
      this.reviewCorrection = null;
      this.announcement = "Review cancelled. Live meter data was reloaded and your edits were preserved.";
    } catch (error) {
      if (!this.ownsOperation(generation, api, deviceId)) return;
      if (abandoned) this.reviewCorrection = correction;
      this.fail(error, abandoned ? "The review was cancelled, but fresh meter data could not be loaded. Retry Back to preserve your edits." : "The review could not be cancelled. Retry Back before editing the configuration.");
    } finally {
      if (this.ownsOperation(generation, api, deviceId)) {
        this.pendingAction = "";
        this.requestUpdate();
      }
    }
  }
  setMeterConfiguration(configuration) {
    this.sourceMeterConfiguration = this.selectedDeviceId && configuration.capabilities.configuration_authoritative ? { deviceId: this.selectedDeviceId, meter: structuredClone(configuration) } : null;
    this.configurationMode = configurationModeFor({
      journeyOrigin: this.journeyOrigin,
      semanticSource: configuration.capabilities.semantic_source,
      runtimeOnly: !configuration.capabilities.configuration_authoritative
    });
    this.legacyCircuitSemanticsConfirmed = false;
    this.meterProfileConfirmed = this.journeyOrigin === "existing_meter" && this.configurationMode === "helper_managed";
    const normalized = { ...configuration, configuration: {
      ...configuration.configuration,
      multi_reference_preparation_acknowledged: false
    } };
    const importedMeter = normalized.configuration.meter;
    const fixedVoltage = profileNominalVoltage(importedMeter.electrical_system);
    const voltageMismatch = fixedVoltage !== null && importedMeter.voltage_references.some((reference) => reference.nominal_voltage_v !== fixedVoltage);
    const existingReadOnly = this.journeyOrigin === "existing_meter";
    const resolvedMeter = !existingReadOnly && voltageMismatch ? { ...importedMeter, voltage_references: importedMeter.voltage_references.map((reference) => ({ ...reference, nominal_voltage_v: fixedVoltage })) } : importedMeter;
    const seeded = { ...normalized, configuration: { ...normalized.configuration, meter: resolvedMeter } };
    this.verifiedMeterConfiguration = existingReadOnly && this.configurationMode === "helper_managed" && configuration.capabilities.configuration_authoritative ? configuration : null;
    this.sourcePackageOptions = {
      power_quality: [...normalized.configuration.power_quality],
      status_fields: [...normalized.configuration.status_fields]
    };
    const editable = this.configurationMode === "legacy_editable" ? normalized : seeded;
    this.meterConfiguration = this.packageOptionsTouched ? {
      ...editable,
      configuration: { ...editable.configuration, ...this.packageOptions }
    } : editable;
    this.totalGraphPreview = null;
    this.totalGraphState = "ready";
    this.issuedAutomaticSettings = [...this.meterConfiguration.configuration.automatic_totals];
    this.acceptedAutomaticInputs = this.automaticCandidateInputs();
    if (!this.packageOptionsTouched) this.packageOptions = {
      power_quality: [...normalized.configuration.power_quality],
      status_fields: [...normalized.configuration.status_fields]
    };
    this.canonicalConfigurationChanged = !existingReadOnly && (this.packageOptionsTouched || this.configurationMode !== "legacy_editable" && resolvedMeter !== importedMeter);
    this.meterSettingsDraft = {
      ...this.meterConfiguration.configuration.meter,
      authoritative: configuration.capabilities.configuration_authoritative,
      warnings: configuration.warnings
    };
    this.multiReferencePreparationAcknowledged = false;
    this.meterFrequencyTouched = false;
    this.meterNominalVoltageTouched = /* @__PURE__ */ new Set();
    this.initializeInventory(this.meterConfiguration);
    if (JSON.stringify(this.meterConfiguration.configuration) !== JSON.stringify(configuration.configuration)) {
      this.totalGraphState = "pending";
      void this.refreshTotalGraph(this.meterConfiguration.configuration);
    }
  }
  chooseExistingConfiguration(choice) {
    this.existingConfigurationChoice = choice;
    this.canonicalConfigurationChanged = false;
    this.configurationInstalled = false;
    if (choice === "manage_with_helper") this.navigate("meter");
    else if (choice === "calibrate_only") {
      this.labelOnly = false;
      this.navigate("calibration-plan");
    }
  }
  calibrationDraftChanges() {
    return this.existingConfigurationChoice === "calibrate_only" || !this.inventory || this.labelOnly ? [] : changesFromDrafts(this.inventory, this.drafts);
  }
  setMeterProfile(electricalSystem) {
    if (!this.meterSettingsDraft) return;
    this.meterProfileConfirmed = false;
    const defaults = electricalSystem === "split_phase_120_240" ? { frequency: 60, voltage: 120 } : electricalSystem === "single_phase_230" ? { frequency: 50, voltage: 230 } : null;
    this.meterSettingsDraft = {
      ...this.meterSettingsDraft,
      electrical_system: electricalSystem,
      ...defaults && !this.meterFrequencyTouched ? { line_frequency_hz: defaults.frequency } : {},
      ...defaults ? { voltage_references: this.meterSettingsDraft.voltage_references.map((reference) => ({ ...reference, nominal_voltage_v: defaults.voltage })) } : {}
    };
    this.updateMeterSettings(this.meterSettingsDraft);
    this.requestUpdate();
  }
  setMeterFrequency(lineFrequencyHz) {
    if (!this.meterSettingsDraft) return;
    this.meterProfileConfirmed = false;
    this.meterFrequencyTouched = true;
    this.meterSettingsDraft = { ...this.meterSettingsDraft, line_frequency_hz: lineFrequencyHz };
    this.updateMeterSettings(this.meterSettingsDraft);
    this.requestUpdate();
  }
  setMeterNominalVoltage(referenceId, nominalVoltage) {
    if (!this.meterSettingsDraft) return;
    this.meterProfileConfirmed = false;
    this.meterNominalVoltageTouched = new Set(this.meterNominalVoltageTouched).add(referenceId);
    this.meterSettingsDraft = { ...this.meterSettingsDraft, voltage_references: this.meterSettingsDraft.voltage_references.map((reference) => reference.reference_id === referenceId ? { ...reference, nominal_voltage_v: nominalVoltage } : reference) };
    this.updateMeterSettings(this.meterSettingsDraft);
    this.requestUpdate();
  }
  async continueFromMeterSettings() {
    if (!this.api || !this.selectedDeviceId || !this.meterSettingsDraft || this.pendingAction || !this.meterProfileConfirmed) return;
    this.pendingAction = "inventory";
    this.requestUpdate();
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const generation = this.operationGeneration;
    try {
      await this.run(async () => {
        this.updateCircuitConfiguration({
          ...this.meterConfiguration.configuration,
          meter: meterSettings(this.meterSettingsDraft),
          multi_reference_preparation_acknowledged: this.multiReferencePreparationAcknowledged
        }, false);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.showInventory(this.meterConfiguration);
      }, "CT inventory could not be loaded.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.pendingAction = "";
      this.requestUpdate();
    }
  }
  async recoverCtInventory(api, deviceId, generation, drafts) {
    const inventory = await api.getCtInventory(deviceId);
    if (!this.ownsOperation(generation, api, deviceId)) return;
    this.clearSubscription("transaction");
    this.transaction = null;
    this.showInventory(inventory);
    this.drafts = new Map(Array.from(this.drafts, ([channel, fresh]) => [channel, drafts.get(channel) ?? fresh]));
    this.announcement = "Live CT data reloaded. Review the preserved changes again.";
  }
  updateDraft(channel, patch) {
    const current = this.drafts.get(channel);
    if (!current) return;
    this.drafts = new Map(this.drafts).set(channel, { ...current, ...patch });
    if (this.meterConfiguration && !this.labelOnly) {
      const draft = { ...current, ...patch };
      if (draft.preserveExistingGain && this.meterConfiguration.configuration.channels.find((item) => item.channel === channel)?.name === draft.name) return this.requestUpdate();
      this.updateCircuitConfiguration({
        ...this.meterConfiguration.configuration,
        channels: this.meterConfiguration.configuration.channels.map((item) => item.channel === channel ? draft.preserveExistingGain ? { ...item, name: draft.name } : {
          ...item,
          name: draft.name,
          model_id: draft.modelId,
          reporting_multiplier: draft.multiplier,
          custom_gain_ct: draft.modelId === "custom" ? draft.customGainCt ?? null : null,
          custom_label: draft.modelId === "custom" ? draft.customLabel?.trim() || null : null,
          burden_output_acknowledged: draft.burdenAcknowledged
        } : item)
      });
    }
    this.requestUpdate();
  }
  updateCircuitConfiguration(configuration, changed = true) {
    if (!this.meterConfiguration) return;
    const unchanged = JSON.stringify(configuration) === JSON.stringify(this.meterConfiguration.configuration);
    this.canonicalConfigurationChanged ||= changed;
    if (unchanged) {
      this.requestUpdate();
      return;
    }
    this.meterConfiguration = { ...this.meterConfiguration, configuration };
    this.totalGraphPreview = null;
    this.totalGraphState = "pending";
    void this.refreshTotalGraph(configuration);
    this.requestUpdate();
  }
  automaticCandidateInputs() {
    const meter = this.meterConfiguration;
    if (!this.api || !this.selectedDeviceId || !meter?.capabilities.configuration_authoritative) return null;
    const issuedIds = new Set(meter.totals.automatic_candidates.map((item) => item.aggregate_id));
    return JSON.stringify({
      connection: this.connectionGeneration,
      device: this.selectedDeviceId,
      plan: meter.plan_id,
      hash: meter.source_sha256,
      channels: meter.configuration.channels.map(({ channel, enabled, role }) => ({ channel, enabled, role })),
      collisions: meter.configuration.aggregates.map((item) => item.aggregate_id).filter((id2) => issuedIds.has(id2)).sort()
    });
  }
  automaticSourcesFresh() {
    return this.acceptedAutomaticInputs !== null && this.acceptedAutomaticInputs === this.automaticCandidateInputs();
  }
  hasCanonicalChanges() {
    const intent = this.meterConfiguration?.configuration.totals_change_intent;
    return Boolean(intent?.adopt_managed_totals || intent?.legacy_parent_decisions.length || this.existingConfigurationChoice !== "calibrate_only" && !this.labelOnly && this.canonicalConfigurationChanged);
  }
  hasUnsupportedCalibrationChanges() {
    const meter = this.meterConfiguration;
    if (!meter) return false;
    const intent = meter.configuration.totals_change_intent;
    if (intent?.adopt_managed_totals || intent?.legacy_parent_decisions.length) return true;
    const source = this.sourceMeterConfiguration?.meter;
    if (!source) return this.canonicalConfigurationChanged;
    const unsupported = (configuration) => ({
      meter: configuration.meter,
      channels: configuration.channels.map(({ channel, enabled, role, voltage_reference_id }) => ({ channel, enabled, role, voltage_reference_id })),
      default_totals: configuration.default_totals,
      automatic_totals: configuration.automatic_totals,
      aggregates: configuration.aggregates
    });
    return JSON.stringify(unsupported(meter.configuration)) !== JSON.stringify(unsupported(source.configuration));
  }
  totalsIntentNeedsResolution() {
    return this.hasCanonicalChanges() && (this.labelOnly || this.existingConfigurationChoice === "calibrate_only");
  }
  explainTotalsModeConflict() {
    this.fail(new Error(), "Pending totals choices are outside the selected calibration-only or labels-only mode. No configuration or calibration was changed. Explicitly discard the local choices, or return to configuration editing before reviewing them.");
  }
  explainCalibrationConfigurationConflict() {
    this.fail(new Error(), "Local configuration choices cannot be included in calibration-only saving. Keep your gains and either cancel this action or explicitly discard those local choices to continue calibration. Stored legacy proposals remain pending for a later totals review.");
  }
  discardUnsupportedCalibrationChanges() {
    const baseline = this.sourceMeterConfiguration;
    if (!baseline || baseline.deviceId !== this.selectedDeviceId || baseline.meter.source_sha256 !== this.meterConfiguration?.source_sha256) {
      this.fail(new Error(), "The source baseline no longer matches this meter. No choices or calibration were discarded. Reload the selected meter before reviewing local choices.");
      return;
    }
    if (!window.confirm("Discard uncommitted meter, circuit-role and totals choices to continue calibration? Calibration gains, CT names/models/multipliers and package choices are kept. Stored legacy proposals are not resolved.")) return;
    const source = structuredClone(baseline.meter.configuration);
    const current = this.meterConfiguration.configuration;
    this.canonicalConfigurationChanged = false;
    this.updateCircuitConfiguration({
      ...source,
      channels: source.channels.map((channel) => ({
        ...current.channels.find((item) => item.channel === channel.channel) ?? channel,
        enabled: channel.enabled,
        role: channel.role,
        voltage_reference_id: channel.voltage_reference_id
      })),
      power_quality: [...this.packageOptions.power_quality],
      status_fields: [...this.packageOptions.status_fields]
    }, false);
    this.meterSettingsDraft = { ...source.meter, authoritative: true, warnings: baseline.meter.warnings };
    this.error = "";
    this.announcement = "Unsupported local configuration choices discarded. Calibration gains, CT changes and package choices were kept; stored legacy proposals remain pending.";
  }
  async refreshTotalGraph(configuration) {
    if (!this.api || !this.selectedDeviceId || !this.meterConfiguration?.capabilities.configuration_authoritative || this.configurationMode === "runtime_only") {
      this.totalGraphState = "invalid";
      return;
    }
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const generation = this.operationGeneration;
    const meter = this.meterConfiguration;
    const settings = new Map(this.issuedAutomaticSettings.map((item) => [item.candidate_id, item]));
    configuration.automatic_totals.forEach((item) => settings.set(item.candidate_id, item));
    this.issuedAutomaticSettings = [...settings.values()];
    const current = () => this.ownsOperation(generation, api, deviceId) && this.meterConfiguration?.configuration === configuration && this.meterConfiguration.plan_id === meter.plan_id && this.meterConfiguration.source_sha256 === meter.source_sha256;
    try {
      const preview = await api.previewTotalGraph(
        deviceId,
        meter.plan_id,
        meter.source_sha256,
        { ...configuration, automatic_totals: this.issuedAutomaticSettings }
      );
      if (!current()) return;
      const automatic = preview.automatic_totals.map((item) => ({ candidate_id: item.candidate.candidate_id, enabled: item.enabled, outputs: item.outputs }));
      automatic.forEach((item) => settings.set(item.candidate_id, item));
      this.issuedAutomaticSettings = [...settings.values()];
      this.meterConfiguration = {
        ...meter,
        configuration: { ...configuration, automatic_totals: automatic },
        totals: {
          ...meter.totals,
          automatic_candidates: preview.automatic_candidates,
          automatic_totals: preview.automatic_totals,
          stale_automatic_total_settings: preview.stale_automatic_total_settings
        },
        configuration_impact: preview.configuration_impact,
        total_details: preview.total_details
      };
      this.totalGraphPreview = preview;
      this.totalGraphState = "ready";
      this.acceptedAutomaticInputs = this.automaticCandidateInputs();
    } catch {
      if (!current()) return;
      this.totalGraphPreview = null;
      this.totalGraphState = "invalid";
    }
    this.requestUpdate();
  }
  setPackageOptions(options) {
    const packageOptions2 = {
      power_quality: [...options.power_quality],
      status_fields: [...options.status_fields]
    };
    this.packageOptionsTouched = true;
    this.packageOptions = packageOptions2;
    if (this.meterConfiguration) this.updateCircuitConfiguration({
      ...this.meterConfiguration.configuration,
      ...packageOptions2
    });
    else this.requestUpdate();
  }
  updateMeterSettings(draft) {
    this.meterSettingsDraft = draft;
    this.multiReferencePreparationAcknowledged = false;
    if (this.meterConfiguration) {
      const referenceByGroup = new Map(draft.voltage_references.flatMap((reference) => reference.group_keys.map((group) => [group, reference.reference_id])));
      this.updateCircuitConfiguration({
        ...this.meterConfiguration.configuration,
        meter: meterSettings(draft),
        channels: this.meterConfiguration.configuration.channels.map((channel) => {
          const address = this.meterConfiguration.channels.find((item) => item.channel === channel.channel)?.address;
          const group = address ? `${address.board_index === 0 ? "main" : `addon${address.board_index}`}_${address.group_index + 1}` : `${channel.channel <= 6 ? "main" : `addon${Math.floor((channel.channel - 1) / 6)}`}_${Math.floor((channel.channel - 1) % 6 / 3) + 1}`;
          return { ...channel, voltage_reference_id: referenceByGroup.get(group) ?? channel.voltage_reference_id };
        }),
        multi_reference_preparation_acknowledged: false
      });
    }
  }
  disableCircuit(channel) {
    if (!this.meterConfiguration) return;
    const configuration = this.meterConfiguration.configuration;
    const removedIds = /* @__PURE__ */ new Set();
    const changedIds = new Set(configuration.aggregates.filter((aggregate) => aggregate.sources.some((source) => source.kind === "channel" && source.channel === channel)).map((aggregate) => aggregate.aggregate_id));
    let aggregates = configuration.aggregates.map((aggregate) => ({
      ...aggregate,
      sources: aggregate.sources.filter((source) => source.kind !== "channel" || source.channel !== channel)
    }));
    let removed;
    do {
      removed = false;
      aggregates = aggregates.filter((aggregate) => {
        const needed = aggregate.measurement_method === "two_ct_sum" ? 2 : aggregate.measurement_method === "direct" ? void 0 : 1;
        if (changedIds.has(aggregate.aggregate_id) && (!aggregate.sources.length || needed !== void 0 && aggregate.sources.length !== needed)) {
          removedIds.add(aggregate.aggregate_id);
          removed = true;
          return false;
        }
        return true;
      }).map((aggregate) => {
        const sources = aggregate.sources.filter((source) => source.kind !== "aggregate" || !removedIds.has(source.aggregate_id));
        if (sources.length !== aggregate.sources.length) changedIds.add(aggregate.aggregate_id);
        return { ...aggregate, sources };
      });
    } while (removed);
    const affected = configuration.aggregates.filter((aggregate) => removedIds.has(aggregate.aggregate_id) || aggregate.sources.some((source) => source.kind === "channel" && source.channel === channel || source.kind === "aggregate" && removedIds.has(source.aggregate_id)));
    if (affected.length && !window.confirm(`Marking CT${channel} unused changes ${affected.map((aggregate) => aggregate.name).join(", ")}${removedIds.size ? " and deletes totals with invalid sources" : ""}. Continue?`)) {
      this.requestUpdate();
      return;
    }
    this.updateCircuitConfiguration({
      ...configuration,
      aggregates,
      channels: configuration.channels.map((item) => item.channel === channel ? { ...item, enabled: false, role: "unused" } : item)
    });
  }
  hasPackageChanges() {
    return Boolean(this.sourcePackageOptions && ["power_quality", "status_fields"].some((feature) => this.packageOptions[feature].some((enabled, board) => enabled !== this.sourcePackageOptions?.[feature][board])));
  }
  async reviewChanges() {
    if (!this.api || !this.inventory || !this.selectedDeviceId) return;
    let changes = changesFromDrafts(this.inventory, this.drafts);
    if (!changes.length && !this.hasPackageChanges()) {
      return this.fail(new Error(), "Select at least one configuration change before review.");
    }
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const inventory = this.inventory;
    const generation = ++this.operationGeneration;
    this.clearSubscription("transaction");
    this.transaction = null;
    this.transactionPurpose = "install_configuration";
    if (this.labelOnly && changes.length) {
      const labels = changes.filter((change) => change.name !== this.inventory.channels.find((item) => item.channel === change.channel)?.name).map(({ channel, name }) => ({ channel, name }));
      if (!labels.length || changes.some((change) => {
        const current = this.inventory.channels.find((item) => item.channel === change.channel);
        return !current || change.model_id !== (current.selected_model_id ?? "") || (change.reporting_multiplier ?? 1) !== current.reporting_multiplier;
      })) {
        return this.fail(new Error(), "Home Assistant label mode only permits display-name edits.");
      }
      await this.run(
        async () => {
          await api.setHaLabels(deviceId, inventory.plan_id, inventory.source_sha256, labels);
          this.announcement = "Home Assistant labels saved.";
        },
        "Home Assistant labels could not be saved.",
        () => this.ownsOperation(generation, api, deviceId)
      );
      if (this.error) return;
      if (!this.hasPackageChanges()) {
        this.navigate("calibration-plan");
        return;
      }
      changes = [];
    }
    await this.run(
      async () => {
        let transaction2;
        try {
          const liveInventory = await api.getCtInventory(deviceId);
          if (!this.ownsOperation(generation, api, deviceId)) return;
          transaction2 = await api.previewCtConfig(
            deviceId,
            liveInventory.plan_id,
            liveInventory.source_sha256,
            changes,
            this.sourcePackageOptions ? this.packageOptions : void 0
          );
        } catch (error) {
          if (error.code !== "stale_confirmation") throw error;
          await this.recoverCtInventory(api, deviceId, generation, this.drafts);
          return;
        }
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.transaction = transaction2;
        this.navigate("install-configuration");
        await this.subscribeTransaction(this.connectionGeneration);
      },
      "The configuration preview is stale. Reload the CT inventory and review again.",
      () => this.ownsOperation(generation, api, deviceId)
    );
  }
  async subscribeTransaction(generation) {
    if (!this.api || !this.transaction || !this.selectedDeviceId) return;
    const api = this.api;
    this.clearSubscription("transaction");
    const scope = this.transactionSubscriptionScope;
    const deviceId = this.selectedDeviceId;
    const transactionId = this.transaction.transaction_id;
    const sourceSha256 = this.transaction.source_sha256;
    await this.ownSubscription(
      api.subscribeConfigTransaction(
        deviceId,
        transactionId,
        sourceSha256,
        (status) => {
          if (this.owns(generation, api) && scope === this.transactionSubscriptionScope && this.selectedDeviceId === deviceId && this.transaction?.transaction_id === transactionId && this.transaction.source_sha256 === sourceSha256 && status.transaction_id === transactionId && status.source_sha256 === sourceSha256) {
            this.transaction = status;
            this.requestUpdate();
          }
        }
      ),
      generation,
      api,
      () => scope === this.transactionSubscriptionScope && this.selectedDeviceId === deviceId && this.transaction?.transaction_id === transactionId && this.transaction.source_sha256 === sourceSha256,
      (unsubscribe) => {
        this.transactionUnsub = unsubscribe;
      }
    );
  }
  async continueFromCt() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || this.pendingAction) return;
    if (this.meterConfiguration && this.totalGraphState !== "ready") return;
    if (!this.labelOnly && this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === "manage_with_helper" && !this.legacyCircuitSemanticsConfirmed) {
      return this.fail(new Error(), "Confirm that you reviewed used and unused channels and circuit roles before continuing.");
    }
    if (this.meterConfiguration && this.hasCanonicalChanges()) return this.previewCanonicalConfiguration();
    const changes = changesFromDrafts(this.inventory, this.drafts);
    if (this.labelOnly && changes.length) {
      const labels = changes.map(({ channel, name }) => ({ channel, name }));
      const api = this.api;
      const deviceId = this.selectedDeviceId;
      const inventory = this.inventory;
      const generation = ++this.operationGeneration;
      this.pendingAction = "session";
      this.requestUpdate();
      await this.run(async () => {
        await api.setHaLabels(deviceId, inventory.plan_id, inventory.source_sha256, labels);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.inventory = { ...inventory, channels: inventory.channels.map((channel) => {
          const changed = labels.find((item) => item.channel === channel.channel);
          return changed ? { ...channel, name: changed.name } : channel;
        }) };
        this.announcement = "Home Assistant labels saved.";
      }, "Home Assistant labels could not be saved.", () => this.ownsOperation(generation, api, deviceId));
      this.pendingAction = "";
      if (this.error) return;
    }
    if (this.meterConfiguration && this.hasCanonicalChanges()) return this.previewCanonicalConfiguration();
    this.navigate("calibration-plan");
  }
  async previewCanonicalConfiguration() {
    if (!this.api || !this.inventory || !this.selectedDeviceId || !this.meterConfiguration) return;
    if (this.totalsIntentNeedsResolution()) {
      this.explainTotalsModeConflict();
      return;
    }
    const configuration = this.meterConfiguration.configuration;
    if (!circuitConfigurationIsValid(configuration, this.inventory.channels.length)) return this.fail(new Error(), "Complete the circuit and aggregate assignments before review.");
    this.pendingAction = "session";
    this.transactionPurpose = "install_configuration";
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const meter = this.meterConfiguration;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      this.transaction = await api.previewMeterConfiguration(deviceId, meter.plan_id, meter.source_sha256, configuration);
      if (!this.ownsOperation(generation, api, deviceId)) return;
      this.navigate("install-configuration");
      await this.subscribeTransaction(this.connectionGeneration);
    }, "Circuit configuration could not be reviewed.", () => this.ownsOperation(generation, api, deviceId));
    this.pendingAction = "";
    this.requestUpdate();
  }
  async reviewCalibrationHandoff() {
    if (!this.api || !this.session || !this.restartResult?.source_handoff_available || this.pendingAction) return;
    if (this.hasUnsupportedCalibrationChanges()) {
      this.explainCalibrationConfigurationConflict();
      return;
    }
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const verificationId = this.restartResult.verification_id;
    const generation = ++this.operationGeneration;
    this.clearSubscription("transaction");
    this.transaction = null;
    this.transactionPurpose = "save_calibration";
    this.pendingAction = "calibration-handoff";
    this.requestUpdate();
    try {
      await this.run(
        async () => {
          const changes = this.calibrationDraftChanges();
          const transaction2 = await api.previewCalibratedGains(
            sessionId,
            verificationId,
            changes,
            this.sourcePackageOptions ? this.packageOptions : void 0
          );
          if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId || this.restartResult?.verification_id !== verificationId) return;
          this.calibrationHandoff = true;
          this.transaction = transaction2;
          this.navigate("save-calibration");
          await this.subscribeTransaction(this.connectionGeneration);
        },
        "Calibration gains could not be prepared for YAML review.",
        () => this.ownsOperation(generation, api, deviceId)
      );
    } finally {
      if (this.pendingAction === "calibration-handoff") {
        this.pendingAction = "";
        this.requestUpdate();
      }
    }
  }
  async clearCalibrationHandoff() {
    const restart2 = this.restartResult;
    if (!this.api || !this.session || !this.topology || !restart2?.source_handoff_firmware_installed || !restart2.source_handoff_transaction_id) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    await this.run(
      async () => {
        const result = await api.clearCalibrationFlash(
          sessionId,
          restart2.verification_id,
          restart2.source_handoff_transaction_id,
          this.topology
        );
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        this.restartResult = result;
        this.announcement = "Calibration was saved to YAML, installed, verified, and cleared from flash.";
        this.navigate("summary");
      },
      "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values.",
      () => this.ownsOperation(generation, api, deviceId)
    );
  }
  async transactionAction(action) {
    if (!this.api || !this.transaction || !this.selectedDeviceId || this.pendingAction) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const current = this.transaction;
    const generation = ++this.operationGeneration;
    this.pendingAction = action;
    this.requestUpdate();
    await this.run(
      async () => {
        const args = [deviceId, current.transaction_id, current.source_sha256];
        let transaction2;
        try {
          transaction2 = action === "apply" ? await api.applyCtConfig(...args) : action === "compile" ? await api.compileCtConfig(...args) : action === "install" ? await api.installCtConfig(...args) : await api.rollbackCtConfig(...args);
        } catch (error) {
          if (error.code !== "stale_confirmation") throw error;
          await this.recoverCtInventory(api, deviceId, generation, this.drafts);
          return;
        }
        if (!this.ownsOperation(generation, api, deviceId) || this.transaction?.transaction_id !== current.transaction_id || this.transaction.source_sha256 !== current.source_sha256) return;
        this.transaction = transaction2;
        this.announcement = `Configuration ${this.transaction.state}.`;
        if (action === "apply" && transaction2.state === "validated" && this.sourcePackageOptions) {
          this.sourcePackageOptions = {
            power_quality: [...this.packageOptions.power_quality],
            status_fields: [...this.packageOptions.status_fields]
          };
        } else if (action === "rollback" && transaction2.state === "rolled_back" && this.sourcePackageOptions) {
          const restored = {
            power_quality: [...this.sourcePackageOptions.power_quality],
            status_fields: [...this.sourcePackageOptions.status_fields]
          };
          for (const change of transaction2.changes) {
            const match = /^package\.(main|addon([1-6]))\.(power_quality|status_fields)$/.exec(change.key);
            if (!match || !["enabled", "disabled"].includes(change.old_value ?? "")) continue;
            const board = match[1] === "main" ? 0 : Number(match[2]);
            const feature = match[3];
            restored[feature][board] = change.old_value === "enabled";
          }
          this.sourcePackageOptions = restored;
        }
        if (action === "install" && this.calibrationHandoff && transaction2.state === "verified" && this.session && this.topology && this.restartResult) {
          this.restartResult = {
            ...this.restartResult,
            source_handoff_available: false,
            source_handoff_transaction_id: transaction2.transaction_id,
            source_handoff_firmware_installed: true
          };
          const result = await api.clearCalibrationFlash(
            this.session.session_id,
            this.restartResult.verification_id,
            transaction2.transaction_id,
            this.topology
          );
          if (!this.ownsOperation(generation, api, deviceId)) return;
          this.restartResult = result;
          this.announcement = "Calibration was saved to YAML, installed, verified, and cleared from flash.";
          this.navigate("summary");
        } else if (action === "install" && transaction2.state === "verified") {
          this.configurationInstalled = true;
          this.verifiedMeterConfiguration = null;
          this.sourceMeterConfiguration = null;
          this.acceptInstalledDrafts();
          this.canonicalConfigurationChanged = false;
          if (transaction2.full_meter_configuration_verified && this.meterConfiguration) {
            const meter = this.meterConfiguration;
            const decisions = meter.configuration.totals_change_intent?.legacy_parent_decisions ?? [];
            const links = meter.totals.migration.legacy_parent_links.filter((link) => !decisions.some((decision) => decision.child_id === link.child_id && decision.proposed_parent_id === link.proposed_parent_id));
            this.meterConfiguration = {
              ...meter,
              configuration: { ...meter.configuration, totals_change_intent: { adopt_managed_totals: false, legacy_parent_decisions: [] } },
              totals: { ...meter.totals, migration: { ...meter.totals.migration, legacy_parent_links: links, parent_review_required: links.length > 0 } }
            };
          }
          this.announcement = "Configuration changes were installed and verified. Continue to safety and calibration.";
          if (this.meterConfiguration?.capabilities.configuration_authoritative && transaction2.full_meter_configuration_verified) {
            await this.refreshInstalledConfiguration();
          }
        }
      },
      action === "install" && this.calibrationHandoff ? "Firmware is installed, but flash clearing could not be verified. Retry clearing saved flash values." : "This confirmation is stale. Reload the CT inventory before making another change.",
      () => this.ownsOperation(generation, api, deviceId)
    );
    if (this.pendingAction === action) this.pendingAction = "";
    this.requestUpdate();
  }
  async refreshInstalledConfiguration() {
    if (!this.api || !this.selectedDeviceId || !this.configurationInstalled || this.transaction?.state !== "verified" || !this.transaction.full_meter_configuration_verified || this.configurationMode === "runtime_only") return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const generation = this.operationGeneration;
    const transaction2 = this.transaction;
    const current = () => this.ownsOperation(generation, api, deviceId) && this.transaction?.state === "verified" && this.transaction.transaction_id === transaction2.transaction_id && this.transaction.source_sha256 === transaction2.source_sha256;
    this.totalGraphState = "pending";
    this.requestUpdate();
    try {
      const fresh = await api.getMeterConfiguration(deviceId);
      if (!current()) return;
      if (!fresh.capabilities.configuration_authoritative) throw new Error("Fresh configuration is not authoritative");
      this.packageOptionsTouched = false;
      this.setMeterConfiguration(fresh);
      this.verifiedMeterConfiguration = fresh;
      this.canonicalConfigurationChanged = false;
      this.error = "";
      this.announcement = "Installed configuration and totals inventory are verified.";
    } catch {
      if (!current()) return;
      this.verifiedMeterConfiguration = null;
      this.totalGraphState = "invalid";
      this.error = "Installed configuration is verified, but fresh totals inventory could not be loaded. Retry inventory refresh; do not reinstall.";
    }
    this.requestUpdate();
  }
  async startSession(plan) {
    if (!this.api || !this.selectedDeviceId || this.sessionStarting || this.pendingAction) return;
    this.sessionStarting = true;
    this.pendingAction = "session";
    this.requestUpdate();
    try {
      const api = this.api;
      const deviceId = this.selectedDeviceId;
      const generation = ++this.operationGeneration;
      this.clearSubscription("session");
      this.session = null;
      this.resetCalibrationRun();
      await this.run(async () => {
        if (!this.topology) throw new Error("Topology is required before calibration");
        const active = await api.getActiveWork(deviceId, this.topology);
        if (!this.ownsOperation(generation, api, deviceId)) return;
        this.session = active.session?.state === "cancelled" ? null : active.session;
        this.transaction = active.transaction;
        this.safetyAcknowledged = this.session?.safety_acknowledged ?? false;
        this.calibrationHandoff = Boolean(this.transaction && active.verified_calibration && active.verified_calibration.source_handoff_transaction_id === this.transaction.transaction_id);
        this.transactionPurpose = this.transaction ? this.calibrationHandoff ? "save_calibration" : "install_configuration" : null;
        this.restartResult = this.calibrationHandoff || this.session?.state === "verified" ? active.verified_calibration : null;
        if (this.transaction) {
          this.navigate(resumeWorkflowRoute(this.workflowContext()));
          await this.subscribeTransaction(this.connectionGeneration);
          if (this.session) await this.subscribeSession(this.connectionGeneration);
          return;
        }
        if (this.session) {
          this.navigate(resumeWorkflowRoute(this.workflowContext()));
          await this.subscribeSession(this.connectionGeneration);
          return;
        }
        const session2 = await api.startSession(deviceId, plan);
        if (!this.ownsOperation(generation, api, deviceId) || session2.device_id !== deviceId) return;
        this.session = session2;
        this.calibrationPlan = session2.calibration_plan ?? plan;
        this.navigate(resumeWorkflowRoute(this.workflowContext()));
        await this.subscribeSession(this.connectionGeneration);
      }, "Calibration session could not be started.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.sessionStarting = false;
      this.pendingAction = "";
      this.requestUpdate();
    }
  }
  finishFlow(message) {
    if (this.hasUnsupportedCalibrationChanges()) {
      this.explainCalibrationConfigurationConflict();
      return;
    }
    this.selectDevice(null);
    this.navigate("setup");
    this.announcement = message;
  }
  async subscribeSession(generation) {
    if (!this.api || !this.session) return;
    const api = this.api;
    this.clearSubscription("session");
    const scope = this.sessionSubscriptionScope;
    const sessionId = this.session.session_id;
    const deviceId = this.session.device_id;
    await this.ownSubscription(
      api.subscribeSession(sessionId, (session2) => {
        if (this.owns(generation, api) && scope === this.sessionSubscriptionScope && this.session?.session_id === sessionId && this.session.device_id === deviceId && session2.session_id === sessionId && session2.device_id === deviceId) {
          this.session = session2;
          this.requestUpdate();
        }
      }),
      generation,
      api,
      () => scope === this.sessionSubscriptionScope && this.session?.session_id === sessionId && this.session.device_id === deviceId,
      (unsubscribe) => {
        this.sessionUnsub = unsubscribe;
      }
    );
  }
  async acknowledgeSafety() {
    if (!this.api || !this.session || this.pendingAction) return;
    this.pendingAction = "safety";
    this.requestUpdate();
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      const session2 = await api.acknowledgeSafety(sessionId);
      if (!this.ownsOperation(generation, api, deviceId) || session2.session_id !== sessionId) return;
      this.session = session2;
      this.calibrationPlan = session2.calibration_plan ?? this.calibrationPlan;
      this.navigate(resumeWorkflowRoute(this.workflowContext()));
    }, "Safety acknowledgement could not be accepted.", () => this.ownsOperation(generation, api, deviceId));
    this.pendingAction = "";
    this.requestUpdate();
  }
  offsetKey(board = this.board, stage = this.offsetStage) {
    return `${board}:${stage}`;
  }
  async checkOffsetReadiness() {
    if (!this.api || !this.session || this.offsetBusy || !this.offsetAcknowledged[this.offsetStage - 1]) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const board = this.board;
    const stage = this.offsetStage;
    const generation = ++this.operationGeneration;
    this.offsetBusy = true;
    this.requestUpdate();
    try {
      await this.run(
        async () => {
          const result = await api.checkOffsetReadiness(sessionId, board, stage);
          if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
          this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget).set(this.offsetKey(board, stage), result);
          this.announcement = result.ready ? `Board ${board + 1} Stage ${stage} measured readiness passed.` : `Board ${board + 1} Stage ${stage} measured readiness did not pass.`;
        },
        "Measured offset readiness could not be collected. Reconnect and inspect the meter.",
        () => this.ownsOperation(generation, api, deviceId)
      );
    } finally {
      this.offsetBusy = false;
      this.requestUpdate();
    }
  }
  async calibrateOffset() {
    if (!this.api || !this.session || this.offsetBusy) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const board = this.board;
    const stage = this.offsetStage;
    const key = this.offsetKey(board, stage);
    const prior = this.offsetResultByTarget.get(key);
    const stageState = this.session.offset_boards?.[board]?.stages[stage - 1]?.state;
    const retryRequired = Boolean(prior?.retry_allowed) || stageState === "partial" || stageState === "indeterminate";
    if (this.offsetAcknowledged[stage - 1] !== true || retryRequired && !this.offsetRetryConfirmed) return;
    const generation = ++this.operationGeneration;
    this.offsetBusy = true;
    this.requestUpdate();
    try {
      await this.run(
        async () => {
          const result = await api.calibrateOffset(sessionId, board, stage, true, retryRequired);
          if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
          this.offsetResultByTarget = new Map(this.offsetResultByTarget).set(key, result);
          const boards = (this.session.offset_boards ?? []).map((item) => item.board_index !== board ? item : {
            ...item,
            stages: item.stages.map((entry) => entry.stage !== stage ? entry : {
              ...entry,
              state: result.state === "applied_pending_restart_verification" ? "completed" : result.state
            })
          });
          const states = boards.flatMap((item) => item.stages.map((entry) => entry.state));
          const disposition = states.every((state) => state === "completed") ? "completed" : states.some((state) => state === "partial" || state === "indeterminate") ? "partial" : "in_progress";
          this.session = {
            ...this.session,
            offset_boards: boards,
            offset_disposition: disposition,
            has_pending_calibration: this.session.has_pending_calibration || result.expected_tables.length > 0
          };
          this.offsetAcknowledged = this.offsetAcknowledged.map((value, index) => index === stage - 1 ? false : value);
          this.offsetReadinessByTarget = new Map(this.offsetReadinessByTarget);
          this.offsetReadinessByTarget.delete(key);
          this.offsetRetryConfirmed = false;
          this.announcement = result.state === "applied_pending_restart_verification" ? `Board ${board + 1} Stage ${stage} saved; restart verification required.` : `Board ${board + 1} Stage ${stage} requires recovery before retry.`;
        },
        "Offset calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(generation, api, deviceId)
      );
    } finally {
      this.offsetBusy = false;
      this.requestUpdate();
    }
  }
  async skipOffset() {
    if (!this.api || !this.session || this.offsetBusy) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    this.offsetBusy = true;
    this.requestUpdate();
    try {
      await this.run(async () => {
        const session2 = await api.skipOffsetCalibration(sessionId);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        this.session = session2;
        this.announcement = "Offset calibration skipped; existing flash values were preserved.";
      }, "Offset calibration could not be skipped.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.offsetBusy = false;
      this.requestUpdate();
    }
  }
  async finishCurrent() {
    if (!this.session || this.finishBusy) return;
    if (this.totalsIntentNeedsResolution()) {
      this.explainTotalsModeConflict();
      return;
    }
    if (this.session.has_pending_calibration) {
      this.navigate("restart");
      if (this.hasUnsupportedCalibrationChanges()) this.explainCalibrationConfigurationConflict();
      return;
    }
    if (this.calibrationDraftChanges().length || this.hasCanonicalChanges() || this.hasPackageChanges()) {
      await this.finishWithoutCalibration();
      return;
    }
    if (!this.api) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    this.finishBusy = true;
    this.requestUpdate();
    try {
      await this.run(async () => {
        const session2 = await api.completeCalibrationWithoutChanges(sessionId);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        if (session2.session_id !== sessionId || session2.state !== "verified" || session2.has_pending_calibration !== false) {
          throw new Error("No-change completion response is not authoritative");
        }
        this.session = session2;
        this.completedWithoutChanges = true;
        this.navigate("summary");
        this.announcement = "Completed without calibration changes; no restart was required.";
      }, "Calibration completion could not be confirmed.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      this.finishBusy = false;
      this.requestUpdate();
    }
  }
  async checkStability(target) {
    if (!this.api || !this.session || this.pendingAction === "session" || target === "voltage" && this.voltageBusy) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    const targetIds = target === "voltage" ? this.voltageReferenceIds() : this.currentReferenceEntries().map((item) => String(item.channel));
    if (!targetIds.length) return;
    this.pendingAction = "session";
    if (target === "voltage") this.voltageBusy = true;
    this.requestUpdate();
    try {
      await this.run(async () => {
        if (target === "voltage") {
          const updated = new Map(this.stabilityByTarget);
          for (const referenceId of targetIds) {
            const result = await api.checkStability(sessionId, "voltage", referenceId);
            if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
            updated.set(`voltage:${referenceId}`, result);
          }
          this.stabilityByTarget = updated;
          this.announcement = "Loaded voltage data for the selected reference.";
          return;
        }
        for (const [index, targetId] of targetIds.entries()) {
          const result = await api.checkStability(sessionId, target, targetId);
          if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
          this.stabilityByTarget = new Map(this.stabilityByTarget).set(`${target}:${targetId}`, result);
          if (index < targetIds.length - 1) this.requestUpdate();
        }
      }, "Stable samples could not be collected.", () => this.ownsOperation(generation, api, deviceId));
    } finally {
      if (target === "voltage") this.voltageBusy = false;
      this.pendingAction = "";
      this.requestUpdate();
    }
  }
  async calibrate(target) {
    if (!this.api || !this.session || this.pendingAction === "session" || target === "voltage" && this.voltageBusy) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    this.pendingAction = "session";
    this.requestUpdate();
    const generation = ++this.operationGeneration;
    target === "voltage" ? this.voltageReferenceIds() : this.currentReferenceEntries().map((item) => String(item.channel));
    const currentReferences = this.currentReferenceEntries();
    if (target === "current" && !currentReferences.length) {
      this.fail(new Error(), "Confirm the reporting multiplier before calibration.");
      this.pendingAction = "";
      return;
    }
    if (target === "voltage") {
      this.voltageBusy = true;
      this.requestUpdate();
    }
    try {
      await this.run(
        async () => {
          if (target === "voltage") {
            if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
            const updated2 = new Map(this.calibrationByTarget);
            const references = this.voltageReferenceIds().map((referenceId, index) => ({ referenceId, value: this.voltageReferences instanceof Map ? this.voltageReferences.get(referenceId) ?? 0 : this.voltageReferences[index] ?? 0 })).filter(({ referenceId }) => !this.voltageReferenceComplete(referenceId));
            if (references.some(({ value }) => !Number.isFinite(value) || value < 1 || value > 600) || references.some(({ referenceId }) => !this.stabilityByTarget.get(`voltage:${referenceId}`)?.stable)) {
              throw new Error("Voltage references must be valid and stable before calibration.");
            }
            for (const { referenceId, value } of references) {
              const results = await api.calibrateVoltage(sessionId, referenceId, value, true);
              if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
              results.forEach((result2) => updated2.set(`voltage:${result2.group_key}`, result2));
              this.calibrationByTarget = new Map(updated2);
              this.requestUpdate();
            }
            this.calibrationByTarget = updated2;
            this.session = { ...this.session, has_pending_calibration: true };
            this.announcement = "Calibrated the selected voltage reference.";
            return;
          }
          const result = await api.calibrateCurrent(
            sessionId,
            currentReferences,
            true,
            this.calibrationDraftChanges().map((change) => ({
              channel: change.channel,
              reporting_multiplier: change.reporting_multiplier ?? 1
            }))
          );
          if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
          const updated = new Map(this.calibrationByTarget);
          currentReferences.forEach((item) => updated.set(`current:${item.channel}`, result));
          this.calibrationByTarget = updated;
          this.session = { ...this.session, has_pending_calibration: true };
          this.announcement = `Current calibration iteration ${result.iteration} finished. Review the result before continuing.`;
        },
        "Calibration did not complete. Reconnect and inspect before another attempt.",
        () => this.ownsOperation(generation, api, deviceId)
      );
    } finally {
      if (target === "voltage") {
        this.voltageBusy = false;
        this.requestUpdate();
      }
      this.pendingAction = "";
      this.requestUpdate();
    }
  }
  keepCalibrationInFlash() {
    if (this.hasUnsupportedCalibrationChanges()) {
      this.explainCalibrationConfigurationConflict();
      return;
    }
    ++this.operationGeneration;
    if (this.pendingAction === "calibration-handoff") this.pendingAction = "";
    this.clearSubscription("transaction");
    this.transaction = null;
    this.handoffDeclined = true;
    this.announcement = "Calibration remains in meter flash. Installing firmware may replace it.";
    this.navigate("summary");
  }
  groupKey(index) {
    const board = Math.floor(index / 2);
    const group = index % 2 + 1;
    return board === 0 ? `main_${group}` : `addon${board}_${group}`;
  }
  voltageReferenceIds() {
    const groups = this.voltageGroupKeys();
    const references = this.meterSettingsDraft?.voltage_references.filter((reference) => reference.group_keys.some((key) => groups.includes(key))) ?? [];
    if (references.length) return references.map((reference) => reference.reference_id);
    return this.topology?.voltage_layout === "two_voltages" ? groups : [this.board === 0 ? "main" : `addon${this.board}`];
  }
  voltageReferenceLabel(referenceId) {
    return this.meterSettingsDraft?.voltage_references.find((reference) => reference.reference_id === referenceId)?.label ?? referenceId;
  }
  voltageReferenceComplete(referenceId) {
    const groups = this.meterSettingsDraft?.voltage_references.find((reference) => reference.reference_id === referenceId)?.group_keys ?? [referenceId];
    return groups.every((group) => this.calibrationByTarget.get(`voltage:${group}`)?.state === "applied_pending_restart_verification");
  }
  voltageGroupKeys() {
    if (!this.topology) return [this.groupKey(this.group)];
    return [this.groupKey(this.board * 2), this.groupKey(this.board * 2 + 1)];
  }
  currentReferenceEntries() {
    const first = Math.floor((this.channel - 1) / 3) * 3 + 1;
    return Array.from({ length: 3 }, (_2, index) => first + index).flatMap((channel) => {
      const reference = this.currentReferences.get(channel);
      const multiplier = this.drafts.get(channel)?.multiplier ?? this.inventory?.channels[channel - 1]?.reporting_multiplier ?? this.reportingMultiplier;
      return reference && reference > 0 && multiplier !== null ? [{ channel, reference, reporting_multiplier: multiplier }] : [];
    });
  }
  async restart() {
    if (!this.api || !this.session || !this.topology || this.restartBusy) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const topology2 = this.topology;
    const generation = ++this.operationGeneration;
    this.restartResult = null;
    this.restartBusy = true;
    this.announcement = "Restarting the meter and verifying restored calibration values.";
    this.requestUpdate();
    try {
      await this.run(
        async () => {
          let result;
          try {
            result = await api.restartAndVerify(sessionId, topology2);
          } catch (error) {
            if (this.ownsOperation(generation, api, deviceId) && this.session?.session_id === sessionId && this.topology === topology2) {
              this.restartResult = null;
              this.session = { ...this.session, state: "restart_failed" };
            }
            throw error;
          }
          if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId || this.topology !== topology2) return;
          this.restartResult = result;
          this.completedWithoutChanges = false;
          this.session = { ...this.session, state: "verified" };
        },
        "Restart verification failed; review recovery evidence before rollback.",
        () => this.ownsOperation(generation, api, deviceId)
      );
    } finally {
      this.restartBusy = false;
      this.requestUpdate();
    }
    const restartResult = this.restartResult;
    if (restartResult?.source_handoff_available) {
      this.navigate("save-calibration");
    } else if (restartResult) {
      this.navigate("summary");
    }
  }
  async cancelSession(destination = "safety") {
    if (!this.api || !this.session) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    await this.run(async () => {
      const cancelled = await api.cancelSession(sessionId);
      if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
      this.clearSubscription("session");
      this.session = cancelled;
      this.restartResult = null;
      if (destination) this.navigate(destination);
      this.announcement = destination === "setup" ? "No changes were made. Select another device to configure." : destination === "ct" ? "Calibration session closed. Review CT names and types before continuing." : "Calibration session cancelled; cleanup completed without restart verification.";
    }, "The session cleanup could not be confirmed.", () => this.ownsOperation(generation, api, deviceId));
  }
  async finishWithoutCalibration() {
    if (this.pendingAction) return;
    if (this.totalsIntentNeedsResolution()) {
      this.explainTotalsModeConflict();
      return;
    }
    this.pendingAction = "finish";
    this.requestUpdate();
    const changes = this.calibrationDraftChanges();
    try {
      await this.cancelSession(null);
      if (this.error) return;
      if (this.meterConfiguration && this.hasCanonicalChanges()) await this.previewCanonicalConfiguration();
      else if (changes.length || this.hasPackageChanges()) await this.reviewChanges();
      else this.finishFlow("No changes were made. Select another device to configure.");
    } finally {
      this.pendingAction = "";
      this.requestUpdate();
    }
  }
  async reconnectSession() {
    if (!this.api || !this.session) return;
    const api = this.api;
    const deviceId = this.selectedDeviceId;
    const sessionId = this.session.session_id;
    const generation = ++this.operationGeneration;
    await this.run(
      async () => {
        const session2 = await api.getSession(sessionId);
        if (!this.ownsOperation(generation, api, deviceId) || this.session?.session_id !== sessionId) return;
        this.session = session2;
        this.announcement = `Session reconnected with state ${this.session.state}.`;
      },
      "Session reconnection failed. Retry only after checking the meter connection.",
      () => this.ownsOperation(generation, api, deviceId)
    );
  }
  resultFor(target) {
    const currentIds = this.currentReferenceEntries().map((item) => String(item.channel));
    const first = Math.floor((this.channel - 1) / 3) * 3 + 1;
    const targetIds = target === "voltage" ? this.voltageGroupKeys() : currentIds.length ? currentIds : Array.from({ length: 3 }, (_2, index) => String(first + index));
    for (const targetId of [...targetIds].reverse()) {
      const result = this.calibrationByTarget.get(`${target}:${targetId}`);
      if (result) return result;
    }
    return null;
  }
  voltageResultsForBoard() {
    return this.voltageGroupKeys().flatMap((targetId) => {
      const result = this.calibrationByTarget.get(`voltage:${targetId}`);
      return result ? [result] : [];
    });
  }
  calibratedInstances(target) {
    return new Set([...this.calibrationByTarget.entries()].flatMap(([key, result]) => key.startsWith(`${target}:`) && result.state === "applied_pending_restart_verification" && result.gain_evidence?.flash_saved ? [result.gain_evidence.instance_id] : []));
  }
  hasCompletedCalibration(target) {
    if (target === "voltage") return this.voltageGroupKeys().every((targetId) => this.calibrationByTarget.get(`voltage:${targetId}`)?.state === "applied_pending_restart_verification");
    const channels = this.meterConfiguration?.configuration.channels.filter((channel) => channel.enabled).map((channel) => channel.channel) ?? this.inventory?.channels.map((channel) => channel.channel) ?? [];
    return channels.length > 0 && channels.every((channel) => this.calibrationByTarget.get(`current:${channel}`)?.state === "applied_pending_restart_verification");
  }
  stabilityFor(target) {
    const targetIds = target === "voltage" ? this.voltageReferenceIds() : this.currentReferenceEntries().map((item) => String(item.channel));
    const results = targetIds.flatMap((targetId) => {
      const result = this.stabilityByTarget.get(`${target}:${targetId}`);
      return result ? [result] : [];
    });
    if (!results.length) return null;
    return {
      target,
      target_id: target === "voltage" ? `Board ${this.board + 1}` : `Current group ${Math.floor((this.channel - 1) / 3) + 1}`,
      stable: results.length === targetIds.length && results.every((result) => result.stable),
      windows: results.flatMap((result) => result.windows)
    };
  }
  async run(operation, fallback, isCurrent = () => true) {
    this.error = "";
    try {
      await operation();
    } catch (error) {
      if (!isCurrent()) return;
      const code = error.code;
      const message = code === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : code === "stale_handle" ? "The selected device changed or is no longer available. Rescan and try again." : fallback;
      this.fail(error, message);
    }
    if (isCurrent()) this.requestUpdate();
  }
  safeErrorMessage(error, fallback) {
    const code = error.code;
    return code === "stale_confirmation" ? "This confirmation expired. Reload live data and review again." : code === "stale_handle" ? "The selected device changed or is no longer available. Rescan and try again." : fallback;
  }
  fail(_error, safeMessage) {
    this.error = safeMessage;
    this.announcement = safeMessage;
    this.requestUpdate();
  }
  stepBody() {
    if (this.step === "setup") return b`${setupDeviceStep(
      this.setup,
      this.addonCount,
      this.connection,
      (value) => this.setAddonCount(value),
      (value) => {
        this.connection = value;
        this.refreshFirmwareOptions();
      },
      () => void this.rescan(),
      (id2) => void this.configureDevice(id2),
      (id2) => void this.adopt(id2),
      this.pendingAction,
      Boolean(this.topology),
      this.firmwareCatalog(),
      this.importFailedDeviceId
    )}
      ${this.topology ? topologyStep(
      this.topology,
      this.selectedProjectVersion(),
      () => {
        this.selectDevice(null);
        this.navigate("setup");
      },
      () => void (this.selectedConfigurationAvailable() ? this.loadInventory() : this.navigate("calibration-plan")),
      this.error === "Topology mismatch",
      this.pendingAction.startsWith("topology:") || this.pendingAction === "inventory" || this.pendingAction === "session"
    ) : A}`;
    if (this.step === "legacy-review" && this.meterConfiguration) return existingConfigurationStep(
      this.meterConfiguration,
      {
        configurationFilename: this.selectedConfiguration() ?? "Unavailable",
        projectName: this.selectedProjectName() ?? this.meterConfiguration.topology.project_name,
        projectVersion: this.selectedProjectVersion() ?? "Unavailable",
        boardCount: this.meterConfiguration.topology.board_count,
        ctCount: this.meterConfiguration.topology.ct_count
      },
      () => this.chooseExistingConfiguration("manage_with_helper"),
      () => this.chooseExistingConfiguration("calibrate_only"),
      () => this.back()
    );
    if (this.step === "meter" && this.meterSettingsDraft && this.meterConfiguration) return meterSettingsStep(
      this.meterSettingsDraft,
      this.meterConfiguration.voltage_transformer_catalog,
      this.multiReferencePreparationAcknowledged,
      (draft) => this.updateMeterSettings(draft),
      (value) => this.setMeterProfile(value),
      (value) => this.setMeterFrequency(value),
      (referenceId, value) => this.setMeterNominalVoltage(referenceId, value),
      (value) => {
        this.multiReferencePreparationAcknowledged = value;
        if (this.meterConfiguration) this.updateCircuitConfiguration({
          ...this.meterConfiguration.configuration,
          multi_reference_preparation_acknowledged: value
        }, false);
        this.requestUpdate();
      },
      () => this.back(),
      () => void this.continueFromMeterSettings(),
      this.packageOptions,
      (options) => this.setPackageOptions(options),
      this.meterProfileConfirmed,
      (value) => {
        this.meterProfileConfirmed = value;
        this.requestUpdate();
      },
      this.configurationMode ?? "helper_managed"
    );
    if (this.step === "ct" && this.inventory) {
      const impact = this.totalGraphState === "ready" ? this.meterConfiguration?.configuration_impact ?? null : null;
      const total = impact ? impact.numeric_entity_count + impact.text_entity_count : 0;
      return b`${impact ? b`<div class=${total >= ENTITY_COUNT_WARNING_THRESHOLD ? "warning-band" : "info-band"} role="status">${total >= ENTITY_COUNT_WARNING_THRESHOLD ? b`<strong>Warning: high entity count. </strong>` : A}${impact.enabled_channel_count} enabled channels; ${total} ${this.meterConfiguration?.totals.migration.native_visibility_resolved ? "public entities" : "confirmed public entities (incomplete: native visibility unresolved)"} (${impact.numeric_entity_count} numeric, ${impact.text_entity_count} text), ${impact.energy_entity_count} energy; ${impact.public_total_entity_count} public total entities; ${impact.internal_total_sensor_count} internal total sensors; approximately ${impact.approximate_publications_per_second.toFixed(1)} publications/sec.</div>` : this.meterConfiguration ? b`<p role="status">${this.totalGraphState === "pending" ? "Updating total graph and counts…" : "Total graph unavailable: correct the draft before reviewing counts."}</p>` : A}<fieldset class="name-mode"><legend>Edit target</legend><label><input type="radio" name="name-mode" .checked=${!this.labelOnly} @change=${() => {
        this.labelOnly = false;
        this.requestUpdate();
      }}>ESPHome / firmware names</label><label><input type="radio" name="name-mode" .checked=${this.labelOnly} @change=${() => {
        this.labelOnly = true;
        this.requestUpdate();
      }}>Home Assistant labels only</label></fieldset>${ctInventoryStep(
        this.inventory,
        this.board,
        this.drafts,
        (board) => {
          this.board = board;
          this.requestUpdate();
        },
        (channel, patch) => this.updateDraft(channel, patch),
        () => this.back(),
        () => void this.continueFromCt(),
        this.labelOnly,
        this.pendingAction === "session",
        this.labelOnly ? null : this.meterConfiguration?.configuration ?? null,
        (configuration) => this.updateCircuitConfiguration(configuration),
        (channel) => this.disableCircuit(channel),
        this.configurationMode !== "runtime_only" && this.meterConfiguration?.capabilities.configuration_authoritative === true && totalsEditable(this.meterConfiguration, "managed_advanced_totals"),
        this.meterConfiguration?.capabilities.reason_codes.join(", ") ?? "",
        this.configurationMode === "legacy_editable",
        (!this.meterConfiguration || this.totalGraphState === "ready") && (this.configurationMode !== "legacy_editable" || this.existingConfigurationChoice !== "manage_with_helper" || this.labelOnly || this.legacyCircuitSemanticsConfirmed),
        this.meterConfiguration?.totals ?? null,
        this.meterConfiguration?.capabilities.native_totals_readable === true,
        Boolean(this.meterConfiguration && totalsEditable(this.meterConfiguration, "native_totals_writable")),
        this.totalGraphState === "ready" ? this.totalGraphPreview : null,
        this.totalGraphState === "ready",
        this.totalGraphState,
        this.configurationMode !== "runtime_only" && this.meterConfiguration?.capabilities.configuration_authoritative === true && totalsEditable(this.meterConfiguration, "managed_automatic_totals"),
        this.meterConfiguration,
        this.automaticSourcesFresh()
      )}${this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === "manage_with_helper" && !this.labelOnly ? b`<label class="check-row legacy-semantics"><input type="checkbox" aria-label="I reviewed used/unused channels and circuit roles" .checked=${this.legacyCircuitSemanticsConfirmed} @change=${(event) => {
        this.legacyCircuitSemanticsConfirmed = event.target.checked;
        if (this.legacyCircuitSemanticsConfirmed && this.meterConfiguration) this.updateCircuitConfiguration(this.meterConfiguration.configuration);
        else this.requestUpdate();
      }} />I reviewed used/unused channels and circuit roles.</label>${this.meterConfiguration?.warnings.includes("legacy_generic_totals_unmanaged") ? b`<p class="warning-band" role="status">Existing generic totals are unmanaged and will remain unchanged unless this reviewed migration replaces them.</p>` : A}` : A}`;
    }
    if (this.step === "save-calibration" && !this.transaction && this.restartResult?.source_handoff_available) return b`<section class="step-content" aria-labelledby="save-calibration-choice-heading">
      <h2 id="save-calibration-choice-heading">Save calibration or keep it in flash</h2>
      <p>The verified gains are currently stored in meter flash. Installing firmware later may replace them.</p>
      <footer class="action-footer"><button class="secondary" data-action="keep-calibration-flash" ?disabled=${this.pendingAction === "calibration-handoff"} @click=${() => this.keepCalibrationInFlash()}>Keep calibration in meter flash</button><button class="primary" data-action="review-calibration-handoff" ?disabled=${this.pendingAction === "calibration-handoff"} @click=${() => void this.reviewCalibrationHandoff()}>${this.pendingAction === "calibration-handoff" ? "Preparing YAML review…" : "Review and save calibration to YAML"}</button></footer>
    </section>`;
    if (this.step === "install-configuration" || this.step === "save-calibration") return buildInstallStep(
      this.step === "save-calibration" ? "save_calibration" : "install_configuration",
      this.transaction,
      () => void this.transactionAction("apply"),
      () => void this.transactionAction("compile"),
      () => void (this.calibrationHandoff && this.transaction?.state === "verified" && this.restartResult?.source_handoff_firmware_installed ? this.clearCalibrationHandoff() : this.transactionAction("install")),
      () => void this.transactionAction("rollback"),
      () => this.back(),
      () => this.navigate(this.step === "save-calibration" ? "summary" : "calibration-plan"),
      this.meterConfiguration?.configuration ?? null,
      this.totalGraphState === "ready" ? this.meterConfiguration?.configuration_impact ?? null : null,
      this.pendingAction === "review-back",
      this.reviewCorrection !== null,
      this.pendingAction,
      this.configurationMode === "legacy_editable" && this.existingConfigurationChoice === "manage_with_helper",
      this.meterConfiguration,
      this.totalGraphState === "ready" ? this.totalGraphPreview : null
    );
    if (this.step === "safety") return safetyStep(
      this.session,
      this.safetyAcknowledged,
      (value) => {
        this.safetyAcknowledged = value;
        this.requestUpdate();
      },
      () => void this.acknowledgeSafety(),
      () => void this.cancelSession(),
      () => this.back(),
      this.pendingAction === "safety"
    );
    if (this.step === "calibration-plan") return calibrationPlanStep(this.calibrationPlan, (plan) => {
      this.calibrationPlan = plan;
      if (plan === "keep_existing") {
        if (this.hasCanonicalChanges()) {
          void this.previewCanonicalConfiguration();
          return;
        }
        this.completedWithoutChanges = true;
        this.navigate("summary");
      } else void this.startSession(plan);
      this.requestUpdate();
    }, () => this.back(), this.workflowContext().configurationMode === "runtime_only", this.pendingAction === "session");
    if (this.step === "offset") return offsetStep(
      this.topology,
      this.session,
      this.board,
      this.offsetStage,
      this.offsetAcknowledged[this.offsetStage - 1] ?? false,
      this.offsetRetryConfirmed,
      this.offsetReadinessByTarget.get(this.offsetKey()) ?? null,
      this.offsetResultByTarget.get(this.offsetKey()) ?? null,
      this.offsetBusy,
      (value) => {
        this.board = value;
        this.offsetRetryConfirmed = false;
        this.requestUpdate();
      },
      (value) => {
        if (value === 1 || this.session?.offset_boards?.every((item) => item.stages[0]?.state === "completed")) {
          this.offsetStage = value;
          this.board = 0;
          this.offsetRetryConfirmed = false;
          this.requestUpdate();
        }
      },
      (value) => {
        this.offsetAcknowledged = this.offsetAcknowledged.map((current, index) => index === this.offsetStage - 1 ? value : current);
        this.requestUpdate();
      },
      (value) => {
        this.offsetRetryConfirmed = value;
        this.requestUpdate();
      },
      () => void this.checkOffsetReadiness(),
      () => void this.calibrateOffset(),
      () => void this.reconnectSession(),
      () => void this.skipOffset(),
      () => this.back(),
      () => this.navigate("voltage")
    );
    if (this.step === "voltage") return b`${this.meterSettingsDraft?.warnings.includes("slow_interval_extends_calibration") ? b`<div class="warning-band" role="status">This meter uses a ${this.meterSettingsDraft.update_interval_s}-second update interval. Calibration takes longer; keep the reference stable until each check finishes.</div>` : A}${voltageStep(
      this.topology,
      this.session,
      this.board,
      this.voltageReferenceIds().map((id2, index) => this.voltageReferences instanceof Map ? this.voltageReferences.get(id2) ?? 0 : this.voltageReferences[index] ?? 0),
      this.voltageReferenceIds().map((id2) => this.voltageReferenceLabel(id2)),
      this.stabilityFor("voltage"),
      this.voltageResultsForBoard(),
      this.voltageBusy,
      (value) => {
        this.board = value;
        this.requestUpdate();
      },
      (index, value) => {
        const id2 = this.voltageReferenceIds()[index];
        if (id2) this.voltageReferences = new Map(this.voltageReferences).set(id2, value);
        this.requestUpdate();
      },
      () => void this.checkStability("voltage"),
      () => void this.calibrate("voltage"),
      () => void this.reconnectSession(),
      () => void this.cancelSession()
    )}
      <footer class="action-footer offset-footer"><button class="secondary" @click=${() => this.back()}>Back</button>
        <button class="secondary" ?disabled=${this.voltageBusy || this.voltageSkipped} @click=${() => {
      this.voltageSkipped = true;
      this.announcement = "Remaining voltage calibration was skipped; completed gains were preserved.";
      this.requestUpdate();
    }}>Skip voltage calibration</button>
        <button class="primary" ?disabled=${this.voltageBusy || !this.voltageSkipped && !this.hasCompletedCalibration("voltage")} @click=${() => this.navigate("current")}>Continue</button></footer>`;
    if (this.step === "current") return b`${currentStep(
      this.topology,
      this.inventory,
      this.session,
      this.channel,
      this.currentReferences,
      this.reportingMultiplier,
      this.stabilityFor("current"),
      this.resultFor("current"),
      this.calibratedInstances("current"),
      (value) => {
        this.channel = value;
        this.requestUpdate();
      },
      (channel, value) => {
        const references = new Map(this.currentReferences);
        if (value === null || !Number.isFinite(value) || value <= 0) references.delete(channel);
        else references.set(channel, value);
        this.currentReferences = references;
        this.requestUpdate();
      },
      (value) => {
        this.reportingMultiplier = value;
        this.requestUpdate();
      },
      () => void this.checkStability("current"),
      () => void this.calibrate("current"),
      () => void this.reconnectSession(),
      () => void this.cancelSession(),
      this.finishBusy || this.pendingAction === "session"
    )}
      <footer class="action-footer offset-footer"><button class="secondary" @click=${() => this.back()}>Back</button>
        <button class="secondary" ?disabled=${this.finishBusy || this.currentSkipped} @click=${() => {
      this.currentSkipped = true;
      this.announcement = "Remaining current calibration was skipped; completed gains were preserved.";
      this.requestUpdate();
    }}>Skip current calibration</button>
        <button class="primary" ?disabled=${this.finishBusy || !this.currentSkipped && !this.hasCompletedCalibration("current")} @click=${() => void this.finishCurrent()}>${this.finishBusy ? "Finishing…" : "Continue"}</button></footer>`;
    if (this.step === "restart") return restartStep(
      this.session?.state ?? this.error,
      this.restartResult,
      Boolean(this.transaction?.rollback_available),
      this.restartBusy,
      () => void this.restart(),
      () => void this.transactionAction("rollback"),
      () => this.back()
    );
    if (this.step === "summary") return summaryStep(
      this.topology,
      this.session,
      this.transaction,
      this.stabilityByTarget,
      this.calibrationByTarget,
      this.restartResult,
      this.completedWithoutChanges,
      this.selectedProjectVersion(),
      () => void (this.restartResult?.source_handoff_firmware_installed ? this.clearCalibrationHandoff() : this.reviewCalibrationHandoff()),
      () => this.back(),
      this.verifiedMeterConfiguration,
      this.verifiedMeterConfiguration?.configuration_impact ?? null,
      () => this.finishFlow("Meter configuration and calibration are complete."),
      () => this.keepCalibrationInFlash(),
      this.workflowContext().configurationMode,
      this.existingConfigurationChoice,
      this.configurationInstalled,
      this.handoffDeclined,
      this.configurationMode === "legacy_editable" && this.sourceMeterConfiguration?.deviceId === this.selectedDeviceId && this.sourceMeterConfiguration?.meter.source_sha256 === this.meterConfiguration?.source_sha256 ? this.sourceMeterConfiguration?.meter ?? null : null
    );
    return b`<section class="step-content"><div class="info-band" role="status"><strong>${this.step === "ct" ? "Circuits & CTs are not loaded" : "Live step data is not loaded"}</strong><p>Go back and reload the live device data.</p></div>
      <footer class="action-footer"><button class="secondary" @click=${() => this.back()}>Back</button></footer></section>`;
  }
  firmwareCatalog() {
    const loading = this.firmwareCatalogState === "loading";
    return b`<section class="step-content" aria-labelledby="firmware-heading">
      <h2 id="firmware-heading">Install firmware</h2>
      <label>ESPHome firmware version
        <select data-action="firmware-version" ?disabled=${loading || this.firmwareCatalogState !== "ready" || !this.resolvedFirmwareOptions.length}
          @change=${(event) => this.selectFirmwareVersion(event.target.value)}>
          ${this.resolvedFirmwareOptions.map((option, index) => b`<option value=${option.version} ?selected=${option.version === this.selectedEspHomeVersion}>${option.version}${index === 0 ? " (newest)" : ""}</option>`)}
        </select>
      </label>
      ${this.firmwareCatalogState === "error" ? b`<div class="error-panel" role="status">
        <strong>${this.firmwareCatalogError}</strong>
        <button class="secondary" data-action="firmware-retry" @click=${() => this.retryFirmwareIndex()}>Retry</button>
      </div>` : A}
      ${loading ? b`<p role="status">Loading firmware versions…</p>` : A}
      ${this.firmwareCatalogState === "ready" && !this.resolvedFirmwareOptions.length ? b`<p role="status">No firmware version is available for this hardware.</p>` : A}
      ${this.firmwareCatalogState === "ready" ? espWebInstaller(this.selectedFirmware()) : A}
    </section>`;
  }
  render() {
    const context = this.progressContext();
    const phases = workflowPhases(context, this.step);
    const activePhase = phases.find((phase) => phase.status === "current");
    const substeps = activePhase?.id === "calibration" ? calibrationSubsteps(context, this.step) : [];
    return b`
      <div class="app">
        ${workflowProgress(
      phases,
      this.mobileStepsOpen,
      () => {
        this.mobileStepsOpen = !this.mobileStepsOpen;
        this.requestUpdate();
      },
      () => this.returnToSetup(),
      this.pendingAction === "session"
    )}
        <main>
          <div class="product-title">CircuitSetup Energy Meter Helper</div>
          <h1 id="step-heading" tabindex="-1">${this.step === "summary" ? summaryOutcome({
      configurationMode: this.workflowContext().configurationMode,
      legacyChoice: this.existingConfigurationChoice,
      completedWithoutChanges: this.completedWithoutChanges,
      configurationInstalled: this.configurationInstalled,
      restart: this.restartResult,
      verifiedConfiguration: this.verifiedMeterConfiguration !== null
    }).heading : ROUTE_LABELS[this.step]}</h1>
          ${substeps.length ? b`<nav class="calibration-subprogress" aria-label="Calibration progress"><ol>
            ${substeps.map((substep, index) => b`<li class=${substep.status}
              aria-current=${substep.status === "current" ? "step" : A}>
              <span>${index + 1}</span> ${CALIBRATION_LABELS[substep.id]}
            </li>`)}
          </ol></nav>` : A}
          ${this.error ? b`<div class="error-panel" role="alert" tabindex="-1"><strong>${this.error}</strong></div>` : A}
          ${this.totalsIntentNeedsResolution() || this.hasUnsupportedCalibrationChanges() && (this.session?.has_pending_calibration || this.restartResult) && ["restart", "save-calibration", "summary"].includes(this.step) ? b`<button class="secondary"
              ?disabled=${Boolean(this.pendingAction)} @click=${() => this.discardUnsupportedCalibrationChanges()}>Discard local configuration choices and continue calibration</button>` : A}
          ${this.configurationInstalled && this.transaction?.state === "verified" && this.transaction.full_meter_configuration_verified && !this.verifiedMeterConfiguration && this.configurationMode !== "runtime_only" ? b`<button class="secondary"
              ?disabled=${this.totalGraphState === "pending"} @click=${() => void this.refreshInstalledConfiguration()}>Retry totals inventory refresh</button>` : A}
          ${this.stepBody()}
          ${!["setup", "legacy-review", "meter", "voltage", "current", "summary"].includes(this.step) ? technicalDetails(this.topology, this.session, this.transaction, this.stabilityByTarget, this.calibrationByTarget, this.restartResult, this.completedWithoutChanges) : A}
          <div class="sr-status" role="status" aria-live="polite">${this.announcement}</div>
        </main>
      </div>
    `;
  }
}
if (!customElements.get("circuitsetup-energy-meter-helper-panel")) {
  customElements.define("circuitsetup-energy-meter-helper-panel", CircuitSetupPanel);
}
export {
  CircuitSetupPanel
};
