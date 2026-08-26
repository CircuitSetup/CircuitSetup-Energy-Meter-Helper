function t(t2, e2, i2, o2) {
  var s2, r2 = arguments.length, n2 = r2 < 3 ? e2 : null === o2 ? o2 = Object.getOwnPropertyDescriptor(e2, i2) : o2;
  if ("object" == typeof Reflect && "function" == typeof Reflect.decorate) n2 = Reflect.decorate(t2, e2, i2, o2);
  else for (var a2 = t2.length - 1; a2 >= 0; a2--) (s2 = t2[a2]) && (n2 = (r2 < 3 ? s2(n2) : r2 > 3 ? s2(e2, i2, n2) : s2(e2, i2)) || n2);
  return r2 > 3 && n2 && Object.defineProperty(e2, i2, n2), n2;
}
"function" == typeof SuppressedError && SuppressedError;
const e = globalThis, i = e.ShadowRoot && (void 0 === e.ShadyCSS || e.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, o = /* @__PURE__ */ Symbol(), s = /* @__PURE__ */ new WeakMap();
let r = class {
  constructor(t2, e2, i2) {
    if (this._$cssResult$ = true, i2 !== o) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t2, this.t = e2;
  }
  get styleSheet() {
    let t2 = this.o;
    const e2 = this.t;
    if (i && void 0 === t2) {
      const i2 = void 0 !== e2 && 1 === e2.length;
      i2 && (t2 = s.get(e2)), void 0 === t2 && ((this.o = t2 = new CSSStyleSheet()).replaceSync(this.cssText), i2 && s.set(e2, t2));
    }
    return t2;
  }
  toString() {
    return this.cssText;
  }
};
const n = (t2, ...e2) => {
  const i2 = 1 === t2.length ? t2[0] : e2.reduce(((e3, i3, o2) => e3 + ((t3) => {
    if (true === t3._$cssResult$) return t3.cssText;
    if ("number" == typeof t3) return t3;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t3 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i3) + t2[o2 + 1]), t2[0]);
  return new r(i2, t2, o);
}, a = i ? (t2) => t2 : (t2) => t2 instanceof CSSStyleSheet ? ((t3) => {
  let e2 = "";
  for (const i2 of t3.cssRules) e2 += i2.cssText;
  return ((t4) => new r("string" == typeof t4 ? t4 : t4 + "", void 0, o))(e2);
})(t2) : t2, { is: l, defineProperty: d, getOwnPropertyDescriptor: c, getOwnPropertyNames: h, getOwnPropertySymbols: p, getPrototypeOf: u } = Object, v = globalThis, m = v.trustedTypes, f = m ? m.emptyScript : "", g = v.reactiveElementPolyfillSupport, b = (t2, e2) => t2, y = { toAttribute(t2, e2) {
  switch (e2) {
    case Boolean:
      t2 = t2 ? f : null;
      break;
    case Object:
    case Array:
      t2 = null == t2 ? t2 : JSON.stringify(t2);
  }
  return t2;
}, fromAttribute(t2, e2) {
  let i2 = t2;
  switch (e2) {
    case Boolean:
      i2 = null !== t2;
      break;
    case Number:
      i2 = null === t2 ? null : Number(t2);
      break;
    case Object:
    case Array:
      try {
        i2 = JSON.parse(t2);
      } catch (t3) {
        i2 = null;
      }
  }
  return i2;
} }, x = (t2, e2) => !l(t2, e2), _ = { attribute: true, type: String, converter: y, reflect: false, useDefault: false, hasChanged: x };
Symbol.metadata ?? (Symbol.metadata = /* @__PURE__ */ Symbol("metadata")), v.litPropertyMetadata ?? (v.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let $ = class extends HTMLElement {
  static addInitializer(t2) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t2);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t2, e2 = _) {
    if (e2.state && (e2.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t2) && ((e2 = Object.create(e2)).wrapped = true), this.elementProperties.set(t2, e2), !e2.noAccessor) {
      const i2 = /* @__PURE__ */ Symbol(), o2 = this.getPropertyDescriptor(t2, i2, e2);
      void 0 !== o2 && d(this.prototype, t2, o2);
    }
  }
  static getPropertyDescriptor(t2, e2, i2) {
    const { get: o2, set: s2 } = c(this.prototype, t2) ?? { get() {
      return this[e2];
    }, set(t3) {
      this[e2] = t3;
    } };
    return { get: o2, set(e3) {
      const r2 = null == o2 ? void 0 : o2.call(this);
      null != s2 && s2.call(this, e3), this.requestUpdate(t2, r2, i2);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t2) {
    return this.elementProperties.get(t2) ?? _;
  }
  static _$Ei() {
    if (this.hasOwnProperty(b("elementProperties"))) return;
    const t2 = u(this);
    t2.finalize(), void 0 !== t2.l && (this.l = [...t2.l]), this.elementProperties = new Map(t2.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(b("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(b("properties"))) {
      const t3 = this.properties, e2 = [...h(t3), ...p(t3)];
      for (const i2 of e2) this.createProperty(i2, t3[i2]);
    }
    const t2 = this[Symbol.metadata];
    if (null !== t2) {
      const e2 = litPropertyMetadata.get(t2);
      if (void 0 !== e2) for (const [t3, i2] of e2) this.elementProperties.set(t3, i2);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t3, e2] of this.elementProperties) {
      const i2 = this._$Eu(t3, e2);
      void 0 !== i2 && this._$Eh.set(i2, t3);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t2) {
    const e2 = [];
    if (Array.isArray(t2)) {
      const i2 = new Set(t2.flat(1 / 0).reverse());
      for (const t3 of i2) e2.unshift(a(t3));
    } else void 0 !== t2 && e2.push(a(t2));
    return e2;
  }
  static _$Eu(t2, e2) {
    const i2 = e2.attribute;
    return false === i2 ? void 0 : "string" == typeof i2 ? i2 : "string" == typeof t2 ? t2.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t2;
    this._$ES = new Promise(((t3) => this.enableUpdating = t3)), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), null === (t2 = this.constructor.l) || void 0 === t2 || t2.forEach(((t3) => t3(this)));
  }
  addController(t2) {
    var e2;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t2), void 0 !== this.renderRoot && this.isConnected && (null === (e2 = t2.hostConnected) || void 0 === e2 || e2.call(t2));
  }
  removeController(t2) {
    var e2;
    null === (e2 = this._$EO) || void 0 === e2 || e2.delete(t2);
  }
  _$E_() {
    const t2 = /* @__PURE__ */ new Map(), e2 = this.constructor.elementProperties;
    for (const i2 of e2.keys()) this.hasOwnProperty(i2) && (t2.set(i2, this[i2]), delete this[i2]);
    t2.size > 0 && (this._$Ep = t2);
  }
  createRenderRoot() {
    const t2 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ((t3, o2) => {
      if (i) t3.adoptedStyleSheets = o2.map(((t4) => t4 instanceof CSSStyleSheet ? t4 : t4.styleSheet));
      else for (const i2 of o2) {
        const o3 = document.createElement("style"), s2 = e.litNonce;
        void 0 !== s2 && o3.setAttribute("nonce", s2), o3.textContent = i2.cssText, t3.appendChild(o3);
      }
    })(t2, this.constructor.elementStyles), t2;
  }
  connectedCallback() {
    var t2;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), null === (t2 = this._$EO) || void 0 === t2 || t2.forEach(((t3) => {
      var e2;
      return null === (e2 = t3.hostConnected) || void 0 === e2 ? void 0 : e2.call(t3);
    }));
  }
  enableUpdating(t2) {
  }
  disconnectedCallback() {
    var t2;
    null === (t2 = this._$EO) || void 0 === t2 || t2.forEach(((t3) => {
      var e2;
      return null === (e2 = t3.hostDisconnected) || void 0 === e2 ? void 0 : e2.call(t3);
    }));
  }
  attributeChangedCallback(t2, e2, i2) {
    this._$AK(t2, i2);
  }
  _$ET(t2, e2) {
    const i2 = this.constructor.elementProperties.get(t2), o2 = this.constructor._$Eu(t2, i2);
    if (void 0 !== o2 && true === i2.reflect) {
      var s2;
      const r2 = (void 0 !== (null === (s2 = i2.converter) || void 0 === s2 ? void 0 : s2.toAttribute) ? i2.converter : y).toAttribute(e2, i2.type);
      this._$Em = t2, null == r2 ? this.removeAttribute(o2) : this.setAttribute(o2, r2), this._$Em = null;
    }
  }
  _$AK(t2, e2) {
    const i2 = this.constructor, o2 = i2._$Eh.get(t2);
    if (void 0 !== o2 && this._$Em !== o2) {
      var s2, r2;
      const t3 = i2.getPropertyOptions(o2), n2 = "function" == typeof t3.converter ? { fromAttribute: t3.converter } : void 0 !== (null === (s2 = t3.converter) || void 0 === s2 ? void 0 : s2.fromAttribute) ? t3.converter : y;
      this._$Em = o2, this[o2] = n2.fromAttribute(e2, t3.type) ?? (null === (r2 = this._$Ej) || void 0 === r2 ? void 0 : r2.get(o2)) ?? null, this._$Em = null;
    }
  }
  requestUpdate(t2, e2, i2) {
    if (void 0 !== t2) {
      var o2;
      const s2 = this.constructor, r2 = this[t2];
      if (i2 ?? (i2 = s2.getPropertyOptions(t2)), !((i2.hasChanged ?? x)(r2, e2) || i2.useDefault && i2.reflect && r2 === (null === (o2 = this._$Ej) || void 0 === o2 ? void 0 : o2.get(t2)) && !this.hasAttribute(s2._$Eu(t2, i2)))) return;
      this.C(t2, e2, i2);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t2, e2, { useDefault: i2, reflect: o2, wrapped: s2 }, r2) {
    i2 && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t2) && (this._$Ej.set(t2, r2 ?? e2 ?? this[t2]), true !== s2 || void 0 !== r2) || (this._$AL.has(t2) || (this.hasUpdated || i2 || (e2 = void 0), this._$AL.set(t2, e2)), true === o2 && this._$Em !== t2 && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t2));
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
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [t4, e3] of this._$Ep) this[t4] = e3;
        this._$Ep = void 0;
      }
      const t3 = this.constructor.elementProperties;
      if (t3.size > 0) for (const [e3, i3] of t3) {
        const { wrapped: t4 } = i3, o2 = this[e3];
        true !== t4 || this._$AL.has(e3) || void 0 === o2 || this.C(e3, void 0, i3, o2);
      }
    }
    let t2 = false;
    const e2 = this._$AL;
    try {
      var i2;
      t2 = this.shouldUpdate(e2), t2 ? (this.willUpdate(e2), null !== (i2 = this._$EO) && void 0 !== i2 && i2.forEach(((t3) => {
        var e3;
        return null === (e3 = t3.hostUpdate) || void 0 === e3 ? void 0 : e3.call(t3);
      })), this.update(e2)) : this._$EM();
    } catch (e3) {
      throw t2 = false, this._$EM(), e3;
    }
    t2 && this._$AE(e2);
  }
  willUpdate(t2) {
  }
  _$AE(t2) {
    var e2;
    null !== (e2 = this._$EO) && void 0 !== e2 && e2.forEach(((t3) => {
      var e3;
      return null === (e3 = t3.hostUpdated) || void 0 === e3 ? void 0 : e3.call(t3);
    })), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t2)), this.updated(t2);
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
    this._$Eq && (this._$Eq = this._$Eq.forEach(((t3) => this._$ET(t3, this[t3])))), this._$EM();
  }
  updated(t2) {
  }
  firstUpdated(t2) {
  }
};
$.elementStyles = [], $.shadowRootOptions = { mode: "open" }, $[b("elementProperties")] = /* @__PURE__ */ new Map(), $[b("finalized")] = /* @__PURE__ */ new Map(), null != g && g({ ReactiveElement: $ }), (v.reactiveElementVersions ?? (v.reactiveElementVersions = [])).push("2.1.0");
const A = globalThis, w = A.trustedTypes, C = w ? w.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0, E = "$lit$", S = `lit$${Math.random().toFixed(9).slice(2)}$`, P = "?" + S, T = `<${P}>`, k = document, I = () => k.createComment(""), O = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2, R = Array.isArray, z = "[ 	\n\f\r]", H = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, N = /-->/g, M = />/g, U = RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^\x20\t
\f\r"'\`<>=]|("|')|))|$)`, "g"), D = /'/g, L = /"/g, F = /^(?:script|style|textarea|title)$/i, B = (t2) => (e2, ...i2) => ({ _$litType$: t2, strings: e2, values: i2 }), j = B(1), V = B(2), q = /* @__PURE__ */ Symbol.for("lit-noChange"), W = /* @__PURE__ */ Symbol.for("lit-nothing"), Y = /* @__PURE__ */ new WeakMap(), G = k.createTreeWalker(k, 129);
function K(t2, e2) {
  if (!R(t2) || !t2.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== C ? C.createHTML(e2) : e2;
}
const Z = (t2, e2) => {
  const i2 = t2.length - 1, o2 = [];
  let s2, r2 = 2 === e2 ? "<svg>" : 3 === e2 ? "<math>" : "", n2 = H;
  for (let e3 = 0; e3 < i2; e3++) {
    const i3 = t2[e3];
    let a2, l2, d2 = -1, c2 = 0;
    for (; c2 < i3.length && (n2.lastIndex = c2, l2 = n2.exec(i3), null !== l2); ) c2 = n2.lastIndex, n2 === H ? "!--" === l2[1] ? n2 = N : void 0 !== l2[1] ? n2 = M : void 0 !== l2[2] ? (F.test(l2[2]) && (s2 = RegExp("</" + l2[2], "g")), n2 = U) : void 0 !== l2[3] && (n2 = U) : n2 === U ? ">" === l2[0] ? (n2 = s2 ?? H, d2 = -1) : void 0 === l2[1] ? d2 = -2 : (d2 = n2.lastIndex - l2[2].length, a2 = l2[1], n2 = void 0 === l2[3] ? U : '"' === l2[3] ? L : D) : n2 === L || n2 === D ? n2 = U : n2 === N || n2 === M ? n2 = H : (n2 = U, s2 = void 0);
    const h2 = n2 === U && t2[e3 + 1].startsWith("/>") ? " " : "";
    r2 += n2 === H ? i3 + T : d2 >= 0 ? (o2.push(a2), i3.slice(0, d2) + E + i3.slice(d2) + S + h2) : i3 + S + (-2 === d2 ? e3 : h2);
  }
  return [K(t2, r2 + (t2[i2] || "<?>") + (2 === e2 ? "</svg>" : 3 === e2 ? "</math>" : "")), o2];
};
class J {
  constructor({ strings: t2, _$litType$: e2 }, i2) {
    let o2;
    this.parts = [];
    let s2 = 0, r2 = 0;
    const n2 = t2.length - 1, a2 = this.parts, [l2, d2] = Z(t2, e2);
    if (this.el = J.createElement(l2, i2), G.currentNode = this.el.content, 2 === e2 || 3 === e2) {
      const t3 = this.el.content.firstChild;
      t3.replaceWith(...t3.childNodes);
    }
    for (; null !== (o2 = G.nextNode()) && a2.length < n2; ) {
      if (1 === o2.nodeType) {
        if (o2.hasAttributes()) for (const t3 of o2.getAttributeNames()) if (t3.endsWith(E)) {
          const e3 = d2[r2++], i3 = o2.getAttribute(t3).split(S), n3 = /([.?@])?(.*)/.exec(e3);
          a2.push({ type: 1, index: s2, name: n3[2], strings: i3, ctor: "." === n3[1] ? it : "?" === n3[1] ? ot : "@" === n3[1] ? st : et }), o2.removeAttribute(t3);
        } else t3.startsWith(S) && (a2.push({ type: 6, index: s2 }), o2.removeAttribute(t3));
        if (F.test(o2.tagName)) {
          const t3 = o2.textContent.split(S), e3 = t3.length - 1;
          if (e3 > 0) {
            o2.textContent = w ? w.emptyScript : "";
            for (let i3 = 0; i3 < e3; i3++) o2.append(t3[i3], I()), G.nextNode(), a2.push({ type: 2, index: ++s2 });
            o2.append(t3[e3], I());
          }
        }
      } else if (8 === o2.nodeType) if (o2.data === P) a2.push({ type: 2, index: s2 });
      else {
        let t3 = -1;
        for (; -1 !== (t3 = o2.data.indexOf(S, t3 + 1)); ) a2.push({ type: 7, index: s2 }), t3 += S.length - 1;
      }
      s2++;
    }
  }
  static createElement(t2, e2) {
    const i2 = k.createElement("template");
    return i2.innerHTML = t2, i2;
  }
}
function X(t2, e2, i2 = t2, o2) {
  var s2, r2, n2, a2;
  if (e2 === q) return e2;
  let l2 = void 0 !== o2 ? null === (s2 = i2._$Co) || void 0 === s2 ? void 0 : s2[o2] : i2._$Cl;
  const d2 = O(e2) ? void 0 : e2._$litDirective$;
  return (null === (r2 = l2) || void 0 === r2 ? void 0 : r2.constructor) !== d2 && (null !== (n2 = l2) && void 0 !== n2 && null !== (a2 = n2._$AO) && void 0 !== a2 && a2.call(n2, false), void 0 === d2 ? l2 = void 0 : (l2 = new d2(t2), l2._$AT(t2, i2, o2)), void 0 !== o2 ? (i2._$Co ?? (i2._$Co = []))[o2] = l2 : i2._$Cl = l2), void 0 !== l2 && (e2 = X(t2, l2._$AS(t2, e2.values), l2, o2)), e2;
}
class Q {
  constructor(t2, e2) {
    this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = e2;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t2) {
    const { el: { content: e2 }, parts: i2 } = this._$AD, o2 = ((null == t2 ? void 0 : t2.creationScope) ?? k).importNode(e2, true);
    G.currentNode = o2;
    let s2 = G.nextNode(), r2 = 0, n2 = 0, a2 = i2[0];
    for (; void 0 !== a2; ) {
      var l2;
      if (r2 === a2.index) {
        let e3;
        2 === a2.type ? e3 = new tt(s2, s2.nextSibling, this, t2) : 1 === a2.type ? e3 = new a2.ctor(s2, a2.name, a2.strings, this, t2) : 6 === a2.type && (e3 = new rt(s2, this, t2)), this._$AV.push(e3), a2 = i2[++n2];
      }
      r2 !== (null === (l2 = a2) || void 0 === l2 ? void 0 : l2.index) && (s2 = G.nextNode(), r2++);
    }
    return G.currentNode = k, o2;
  }
  p(t2) {
    let e2 = 0;
    for (const i2 of this._$AV) void 0 !== i2 && (void 0 !== i2.strings ? (i2._$AI(t2, i2, e2), e2 += i2.strings.length - 2) : i2._$AI(t2[e2])), e2++;
  }
}
class tt {
  get _$AU() {
    var t2;
    return (null === (t2 = this._$AM) || void 0 === t2 ? void 0 : t2._$AU) ?? this._$Cv;
  }
  constructor(t2, e2, i2, o2) {
    this.type = 2, this._$AH = W, this._$AN = void 0, this._$AA = t2, this._$AB = e2, this._$AM = i2, this.options = o2, this._$Cv = (null == o2 ? void 0 : o2.isConnected) ?? true;
  }
  get parentNode() {
    var t2;
    let e2 = this._$AA.parentNode;
    const i2 = this._$AM;
    return void 0 !== i2 && 11 === (null === (t2 = e2) || void 0 === t2 ? void 0 : t2.nodeType) && (e2 = i2.parentNode), e2;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t2, e2 = this) {
    t2 = X(this, t2, e2), O(t2) ? t2 === W || null == t2 || "" === t2 ? (this._$AH !== W && this._$AR(), this._$AH = W) : t2 !== this._$AH && t2 !== q && this._(t2) : void 0 !== t2._$litType$ ? this.$(t2) : void 0 !== t2.nodeType ? this.T(t2) : ((t3) => R(t3) || "function" == typeof (null == t3 ? void 0 : t3[Symbol.iterator]))(t2) ? this.k(t2) : this._(t2);
  }
  O(t2) {
    return this._$AA.parentNode.insertBefore(t2, this._$AB);
  }
  T(t2) {
    this._$AH !== t2 && (this._$AR(), this._$AH = this.O(t2));
  }
  _(t2) {
    this._$AH !== W && O(this._$AH) ? this._$AA.nextSibling.data = t2 : this.T(k.createTextNode(t2)), this._$AH = t2;
  }
  $(t2) {
    var e2;
    const { values: i2, _$litType$: o2 } = t2, s2 = "number" == typeof o2 ? this._$AC(t2) : (void 0 === o2.el && (o2.el = J.createElement(K(o2.h, o2.h[0]), this.options)), o2);
    if ((null === (e2 = this._$AH) || void 0 === e2 ? void 0 : e2._$AD) === s2) this._$AH.p(i2);
    else {
      const t3 = new Q(s2, this), e3 = t3.u(this.options);
      t3.p(i2), this.T(e3), this._$AH = t3;
    }
  }
  _$AC(t2) {
    let e2 = Y.get(t2.strings);
    return void 0 === e2 && Y.set(t2.strings, e2 = new J(t2)), e2;
  }
  k(t2) {
    R(this._$AH) || (this._$AH = [], this._$AR());
    const e2 = this._$AH;
    let i2, o2 = 0;
    for (const s2 of t2) o2 === e2.length ? e2.push(i2 = new tt(this.O(I()), this.O(I()), this, this.options)) : i2 = e2[o2], i2._$AI(s2), o2++;
    o2 < e2.length && (this._$AR(i2 && i2._$AB.nextSibling, o2), e2.length = o2);
  }
  _$AR(t2 = this._$AA.nextSibling, e2) {
    for (null === (i2 = this._$AP) || void 0 === i2 || i2.call(this, false, true, e2); t2 && t2 !== this._$AB; ) {
      var i2;
      const e3 = t2.nextSibling;
      t2.remove(), t2 = e3;
    }
  }
  setConnected(t2) {
    var e2;
    void 0 === this._$AM && (this._$Cv = t2, null === (e2 = this._$AP) || void 0 === e2 || e2.call(this, t2));
  }
}
class et {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t2, e2, i2, o2, s2) {
    this.type = 1, this._$AH = W, this._$AN = void 0, this.element = t2, this.name = e2, this._$AM = o2, this.options = s2, i2.length > 2 || "" !== i2[0] || "" !== i2[1] ? (this._$AH = Array(i2.length - 1).fill(new String()), this.strings = i2) : this._$AH = W;
  }
  _$AI(t2, e2 = this, i2, o2) {
    const s2 = this.strings;
    let r2 = false;
    if (void 0 === s2) t2 = X(this, t2, e2, 0), r2 = !O(t2) || t2 !== this._$AH && t2 !== q, r2 && (this._$AH = t2);
    else {
      const o3 = t2;
      let n2, a2;
      for (t2 = s2[0], n2 = 0; n2 < s2.length - 1; n2++) a2 = X(this, o3[i2 + n2], e2, n2), a2 === q && (a2 = this._$AH[n2]), r2 || (r2 = !O(a2) || a2 !== this._$AH[n2]), a2 === W ? t2 = W : t2 !== W && (t2 += (a2 ?? "") + s2[n2 + 1]), this._$AH[n2] = a2;
    }
    r2 && !o2 && this.j(t2);
  }
  j(t2) {
    t2 === W ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t2 ?? "");
  }
}
class it extends et {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t2) {
    this.element[this.name] = t2 === W ? void 0 : t2;
  }
}
class ot extends et {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t2) {
    this.element.toggleAttribute(this.name, !!t2 && t2 !== W);
  }
}
class st extends et {
  constructor(t2, e2, i2, o2, s2) {
    super(t2, e2, i2, o2, s2), this.type = 5;
  }
  _$AI(t2, e2 = this) {
    if ((t2 = X(this, t2, e2, 0) ?? W) === q) return;
    const i2 = this._$AH, o2 = t2 === W && i2 !== W || t2.capture !== i2.capture || t2.once !== i2.once || t2.passive !== i2.passive, s2 = t2 !== W && (i2 === W || o2);
    o2 && this.element.removeEventListener(this.name, this, i2), s2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
  }
  handleEvent(t2) {
    var e2;
    "function" == typeof this._$AH ? this._$AH.call((null === (e2 = this.options) || void 0 === e2 ? void 0 : e2.host) ?? this.element, t2) : this._$AH.handleEvent(t2);
  }
}
class rt {
  constructor(t2, e2, i2) {
    this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = e2, this.options = i2;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2) {
    X(this, t2);
  }
}
const nt = A.litHtmlPolyfillSupport;
null != nt && nt(J, tt), (A.litHtmlVersions ?? (A.litHtmlVersions = [])).push("3.3.0");
const at = (t2, e2, i2) => {
  const o2 = (null == i2 ? void 0 : i2.renderBefore) ?? e2;
  let s2 = o2._$litPart$;
  if (void 0 === s2) {
    const t3 = (null == i2 ? void 0 : i2.renderBefore) ?? null;
    o2._$litPart$ = s2 = new tt(e2.insertBefore(I(), t3), t3, void 0, i2 ?? {});
  }
  return s2._$AI(t2), s2;
};
var lt;
const dt = globalThis;
let ct = class extends $ {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var t2;
    const e2 = super.createRenderRoot();
    return (t2 = this.renderOptions).renderBefore ?? (t2.renderBefore = e2.firstChild), e2;
  }
  update(t2) {
    const e2 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t2), this._$Do = at(e2, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t2;
    super.connectedCallback(), null === (t2 = this._$Do) || void 0 === t2 || t2.setConnected(true);
  }
  disconnectedCallback() {
    var t2;
    super.disconnectedCallback(), null === (t2 = this._$Do) || void 0 === t2 || t2.setConnected(false);
  }
  render() {
    return q;
  }
};
ct._$litElement$ = true, ct.finalized = true, null === (lt = dt.litElementHydrateSupport) || void 0 === lt || lt.call(dt, { LitElement: ct });
const ht = dt.litElementPolyfillSupport;
null == ht || ht({ LitElement: ct }), (dt.litElementVersions ?? (dt.litElementVersions = [])).push("4.2.0");
const pt = (t2) => (e2, i2) => {
  void 0 !== i2 ? i2.addInitializer((() => {
    customElements.define(t2, e2);
  })) : customElements.define(t2, e2);
}, ut = { attribute: true, type: String, converter: y, reflect: false, hasChanged: x }, vt = (t2 = ut, e2, i2) => {
  const { kind: o2, metadata: s2 } = i2;
  let r2 = globalThis.litPropertyMetadata.get(s2);
  if (void 0 === r2 && globalThis.litPropertyMetadata.set(s2, r2 = /* @__PURE__ */ new Map()), "setter" === o2 && ((t2 = Object.create(t2)).wrapped = true), r2.set(i2.name, t2), "accessor" === o2) {
    const { name: o3 } = i2;
    return { set(i3) {
      const s3 = e2.get.call(this);
      e2.set.call(this, i3), this.requestUpdate(o3, s3, t2);
    }, init(e3) {
      return void 0 !== e3 && this.C(o3, void 0, t2, e3), e3;
    } };
  }
  if ("setter" === o2) {
    const { name: o3 } = i2;
    return function(i3) {
      const s3 = this[o3];
      e2.call(this, i3), this.requestUpdate(o3, s3, t2);
    };
  }
  throw Error("Unsupported decorator location: " + o2);
};
function mt(t2) {
  return (e2, i2) => "object" == typeof i2 ? vt(t2, e2, i2) : ((t3, e3, i3) => {
    const o2 = e3.hasOwnProperty(i3);
    return e3.constructor.createProperty(i3, t3), o2 ? Object.getOwnPropertyDescriptor(e3, i3) : void 0;
  })(t2, e2, i2);
}
function ft(t2) {
  return mt({ ...t2, state: true, attribute: false });
}
const gt = (t2, e2, i2) => (i2.configurable = true, i2.enumerable = true, Reflect.decorate && "object" != typeof e2 && Object.defineProperty(t2, e2, i2), i2);
function bt(t2, e2) {
  return (e3, i2, o2) => gt(e3, i2, { get() {
    return ((e4) => {
      var i3;
      return (null === (i3 = e4.renderRoot) || void 0 === i3 ? void 0 : i3.querySelector(t2)) ?? null;
    })(this);
  } });
}
function yt(t2) {
  return (e2, i2) => {
    const { slot: o2, selector: s2 } = t2 ?? {}, r2 = "slot" + (o2 ? `[name=${o2}]` : ":not([name])");
    return gt(e2, i2, { get() {
      var e3;
      const i3 = null === (e3 = this.renderRoot) || void 0 === e3 ? void 0 : e3.querySelector(r2), o3 = (null == i3 ? void 0 : i3.assignedElements(t2)) ?? [];
      return void 0 === s2 ? o3 : o3.filter(((t3) => t3.matches(s2)));
    } });
  };
}
const xt = n`:host{border-start-start-radius:var(--_container-shape-start-start);border-start-end-radius:var(--_container-shape-start-end);border-end-start-radius:var(--_container-shape-end-start);border-end-end-radius:var(--_container-shape-end-end);box-sizing:border-box;cursor:pointer;display:inline-flex;gap:8px;min-height:var(--_container-height);outline:none;padding-block:calc((var(--_container-height) - max(var(--_label-text-line-height),var(--_icon-size)))/2);padding-inline-start:var(--_leading-space);padding-inline-end:var(--_trailing-space);place-content:center;place-items:center;position:relative;font-family:var(--_label-text-font);font-size:var(--_label-text-size);line-height:var(--_label-text-line-height);font-weight:var(--_label-text-weight);text-overflow:ellipsis;text-wrap:nowrap;user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0);vertical-align:top;--md-ripple-hover-color: var(--_hover-state-layer-color);--md-ripple-pressed-color: var(--_pressed-state-layer-color);--md-ripple-hover-opacity: var(--_hover-state-layer-opacity);--md-ripple-pressed-opacity: var(--_pressed-state-layer-opacity)}ewt-focus-ring{--md-focus-ring-shape-start-start: var(--_container-shape-start-start);--md-focus-ring-shape-start-end: var(--_container-shape-start-end);--md-focus-ring-shape-end-end: var(--_container-shape-end-end);--md-focus-ring-shape-end-start: var(--_container-shape-end-start)}:host(:is([disabled],[soft-disabled])){cursor:default;pointer-events:none}.button{border-radius:inherit;cursor:inherit;display:inline-flex;align-items:center;justify-content:center;border:none;outline:none;-webkit-appearance:none;vertical-align:middle;background:rgba(0,0,0,0);text-decoration:none;min-width:calc(64px - var(--_leading-space) - var(--_trailing-space));width:100%;z-index:0;height:100%;font:inherit;color:var(--_label-text-color);padding:0;gap:inherit;text-transform:inherit}.button::-moz-focus-inner{padding:0;border:0}:host(:hover) .button{color:var(--_hover-label-text-color)}:host(:focus-within) .button{color:var(--_focus-label-text-color)}:host(:active) .button{color:var(--_pressed-label-text-color)}.background{background:var(--_container-color);border-radius:inherit;inset:0;position:absolute}.label{overflow:hidden}:is(.button,.label,.label slot),.label ::slotted(*){text-overflow:inherit}:host(:is([disabled],[soft-disabled])) .label{color:var(--_disabled-label-text-color);opacity:var(--_disabled-label-text-opacity)}:host(:is([disabled],[soft-disabled])) .background{background:var(--_disabled-container-color);opacity:var(--_disabled-container-opacity)}@media(forced-colors: active){.background{border:1px solid CanvasText}:host(:is([disabled],[soft-disabled])){--_disabled-icon-color: GrayText;--_disabled-icon-opacity: 1;--_disabled-container-opacity: 1;--_disabled-label-text-color: GrayText;--_disabled-label-text-opacity: 1}}:host([has-icon]:not([trailing-icon])){padding-inline-start:var(--_with-leading-icon-leading-space);padding-inline-end:var(--_with-leading-icon-trailing-space)}:host([has-icon][trailing-icon]){padding-inline-start:var(--_with-trailing-icon-leading-space);padding-inline-end:var(--_with-trailing-icon-trailing-space)}::slotted([slot=icon]){display:inline-flex;position:relative;writing-mode:horizontal-tb;fill:currentColor;flex-shrink:0;color:var(--_icon-color);font-size:var(--_icon-size);inline-size:var(--_icon-size);block-size:var(--_icon-size)}:host(:hover) ::slotted([slot=icon]){color:var(--_hover-icon-color)}:host(:focus-within) ::slotted([slot=icon]){color:var(--_focus-icon-color)}:host(:active) ::slotted([slot=icon]){color:var(--_pressed-icon-color)}:host(:is([disabled],[soft-disabled])) ::slotted([slot=icon]){color:var(--_disabled-icon-color);opacity:var(--_disabled-icon-opacity)}.touch{position:absolute;top:50%;height:48px;left:0;right:0;transform:translateY(-50%)}:host([touch-target=wrapper]){margin:max(0px,(48px - var(--_container-height))/2) 0}:host([touch-target=none]) .touch{display:none}
`, _t = /* @__PURE__ */ Symbol("attachableController");
let $t;
$t = new MutationObserver(((t2) => {
  for (const i2 of t2) {
    var e2;
    null === (e2 = i2.target[_t]) || void 0 === e2 || e2.hostConnected();
  }
}));
class At {
  get htmlFor() {
    return this.host.getAttribute("for");
  }
  set htmlFor(t2) {
    null === t2 ? this.host.removeAttribute("for") : this.host.setAttribute("for", t2);
  }
  get control() {
    return this.host.hasAttribute("for") ? this.htmlFor && this.host.isConnected ? this.host.getRootNode().querySelector(`#${this.htmlFor}`) : null : this.currentControl || this.host.parentElement;
  }
  set control(t2) {
    t2 ? this.attach(t2) : this.detach();
  }
  constructor(t2, e2) {
    var i2;
    this.host = t2, this.onControlChange = e2, this.currentControl = null, t2.addController(this), t2[_t] = this, null === (i2 = $t) || void 0 === i2 || i2.observe(t2, { attributeFilter: ["for"] });
  }
  attach(t2) {
    t2 !== this.currentControl && (this.setCurrentControl(t2), this.host.removeAttribute("for"));
  }
  detach() {
    this.setCurrentControl(null), this.host.setAttribute("for", "");
  }
  hostConnected() {
    this.setCurrentControl(this.control);
  }
  hostDisconnected() {
    this.setCurrentControl(null);
  }
  setCurrentControl(t2) {
    this.onControlChange(this.currentControl, t2), this.currentControl = t2;
  }
}
const wt = ["focusin", "focusout", "pointerdown"];
class Ct extends ct {
  constructor() {
    super(...arguments), this.visible = false, this.inward = false, this.attachableController = new At(this, this.onControlChange.bind(this));
  }
  get htmlFor() {
    return this.attachableController.htmlFor;
  }
  set htmlFor(t2) {
    this.attachableController.htmlFor = t2;
  }
  get control() {
    return this.attachableController.control;
  }
  set control(t2) {
    this.attachableController.control = t2;
  }
  attach(t2) {
    this.attachableController.attach(t2);
  }
  detach() {
    this.attachableController.detach();
  }
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  handleEvent(t2) {
    var e2;
    if (!t2[Et]) {
      switch (t2.type) {
        default:
          return;
        case "focusin":
          this.visible = (null === (e2 = this.control) || void 0 === e2 ? void 0 : e2.matches(":focus-visible")) ?? false;
          break;
        case "focusout":
        case "pointerdown":
          this.visible = false;
      }
      t2[Et] = true;
    }
  }
  onControlChange(t2, e2) {
    for (const i2 of wt) null == t2 || t2.removeEventListener(i2, this), null == e2 || e2.addEventListener(i2, this);
  }
  update(t2) {
    t2.has("visible") && this.dispatchEvent(new Event("visibility-changed")), super.update(t2);
  }
}
t([mt({ type: Boolean, reflect: true })], Ct.prototype, "visible", void 0), t([mt({ type: Boolean, reflect: true })], Ct.prototype, "inward", void 0);
const Et = /* @__PURE__ */ Symbol("handledByFocusRing"), St = n`:host{animation-delay:0s,calc(var(--md-focus-ring-duration, 600ms)*.25);animation-duration:calc(var(--md-focus-ring-duration, 600ms)*.25),calc(var(--md-focus-ring-duration, 600ms)*.75);animation-timing-function:cubic-bezier(0.2, 0, 0, 1);box-sizing:border-box;color:var(--md-focus-ring-color, var(--md-sys-color-secondary, #625b71));display:none;pointer-events:none;position:absolute}:host([visible]){display:flex}:host(:not([inward])){animation-name:outward-grow,outward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) + var(--md-focus-ring-outward-offset, 2px));inset:calc(-1*var(--md-focus-ring-outward-offset, 2px));outline:var(--md-focus-ring-width, 3px) solid currentColor}:host([inward]){animation-name:inward-grow,inward-shrink;border-end-end-radius:calc(var(--md-focus-ring-shape-end-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-end-start-radius:calc(var(--md-focus-ring-shape-end-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-end-radius:calc(var(--md-focus-ring-shape-start-end, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border-start-start-radius:calc(var(--md-focus-ring-shape-start-start, var(--md-focus-ring-shape, var(--md-sys-shape-corner-full, 9999px))) - var(--md-focus-ring-inward-offset, 0px));border:var(--md-focus-ring-width, 3px) solid currentColor;inset:var(--md-focus-ring-inward-offset, 0px)}@keyframes outward-grow{from{outline-width:0}to{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes outward-shrink{from{outline-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-grow{from{border-width:0}to{border-width:var(--md-focus-ring-active-width, 8px)}}@keyframes inward-shrink{from{border-width:var(--md-focus-ring-active-width, 8px)}}@media(prefers-reduced-motion){:host{animation:none}}
`;
let Pt = class extends Ct {
};
Pt.styles = [St], Pt = t([pt("ewt-focus-ring")], Pt);
const Tt = { ATTRIBUTE: 1, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4 }, kt = (t2) => (...e2) => ({ _$litDirective$: t2, values: e2 });
class It {
  constructor(t2) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t2, e2, i2) {
    this._$Ct = t2, this._$AM = e2, this._$Ci = i2;
  }
  _$AS(t2, e2) {
    return this.update(t2, e2);
  }
  update(t2, e2) {
    return this.render(...e2);
  }
}
const Ot = kt(class extends It {
  constructor(t2) {
    var e2;
    if (super(t2), t2.type !== Tt.ATTRIBUTE || "class" !== t2.name || (null === (e2 = t2.strings) || void 0 === e2 ? void 0 : e2.length) > 2) throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.");
  }
  render(t2) {
    return " " + Object.keys(t2).filter(((e2) => t2[e2])).join(" ") + " ";
  }
  update(t2, [e2]) {
    if (void 0 === this.st) {
      this.st = /* @__PURE__ */ new Set(), void 0 !== t2.strings && (this.nt = new Set(t2.strings.join(" ").split(/\s/).filter(((t3) => "" !== t3))));
      for (const t3 in e2) {
        var i2;
        e2[t3] && (null === (i2 = this.nt) || void 0 === i2 || !i2.has(t3)) && this.st.add(t3);
      }
      return this.render(e2);
    }
    const o2 = t2.element.classList;
    for (const t3 of this.st) t3 in e2 || (o2.remove(t3), this.st.delete(t3));
    for (const t3 in e2) {
      var s2;
      const i3 = !!e2[t3];
      i3 === this.st.has(t3) || (null === (s2 = this.nt) || void 0 === s2 ? void 0 : s2.has(t3)) || (i3 ? (o2.add(t3), this.st.add(t3)) : (o2.remove(t3), this.st.delete(t3)));
    }
    return q;
  }
}), Rt = { STANDARD: "cubic-bezier(0.2, 0, 0, 1)", EMPHASIZED: "cubic-bezier(.3,0,0,1)", EMPHASIZED_ACCELERATE: "cubic-bezier(.3,0,.8,.15)" };
function zt() {
  let t2 = null;
  return { start() {
    var e2;
    return null === (e2 = t2) || void 0 === e2 || e2.abort(), t2 = new AbortController(), t2.signal;
  }, finish() {
    t2 = null;
  } };
}
var Ht;
!(function(t2) {
  t2[t2.INACTIVE = 0] = "INACTIVE", t2[t2.TOUCH_DELAY = 1] = "TOUCH_DELAY", t2[t2.HOLDING = 2] = "HOLDING", t2[t2.WAITING_FOR_CLICK = 3] = "WAITING_FOR_CLICK";
})(Ht || (Ht = {}));
const Nt = ["click", "contextmenu", "pointercancel", "pointerdown", "pointerenter", "pointerleave", "pointerup"], Mt = window.matchMedia("(forced-colors: active)");
class Ut extends ct {
  constructor() {
    super(...arguments), this.disabled = false, this.hovered = false, this.pressed = false, this.rippleSize = "", this.rippleScale = "", this.initialSize = 0, this.state = Ht.INACTIVE, this.attachableController = new At(this, this.onControlChange.bind(this));
  }
  get htmlFor() {
    return this.attachableController.htmlFor;
  }
  set htmlFor(t2) {
    this.attachableController.htmlFor = t2;
  }
  get control() {
    return this.attachableController.control;
  }
  set control(t2) {
    this.attachableController.control = t2;
  }
  attach(t2) {
    this.attachableController.attach(t2);
  }
  detach() {
    this.attachableController.detach();
  }
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("aria-hidden", "true");
  }
  render() {
    const t2 = { hovered: this.hovered, pressed: this.pressed };
    return j`<div class="surface ${Ot(t2)}"></div>`;
  }
  update(t2) {
    t2.has("disabled") && this.disabled && (this.hovered = false, this.pressed = false), super.update(t2);
  }
  handlePointerenter(t2) {
    this.shouldReactToEvent(t2) && (this.hovered = true);
  }
  handlePointerleave(t2) {
    this.shouldReactToEvent(t2) && (this.hovered = false, this.state !== Ht.INACTIVE && this.endPressAnimation());
  }
  handlePointerup(t2) {
    if (this.shouldReactToEvent(t2)) {
      if (this.state !== Ht.HOLDING) return this.state === Ht.TOUCH_DELAY ? (this.state = Ht.WAITING_FOR_CLICK, void this.startPressAnimation(this.rippleStartEvent)) : void 0;
      this.state = Ht.WAITING_FOR_CLICK;
    }
  }
  async handlePointerdown(t2) {
    if (this.shouldReactToEvent(t2)) {
      if (this.rippleStartEvent = t2, !this.isTouch(t2)) return this.state = Ht.WAITING_FOR_CLICK, void this.startPressAnimation(t2);
      this.state = Ht.TOUCH_DELAY, await new Promise(((t3) => {
        setTimeout(t3, 150);
      })), this.state === Ht.TOUCH_DELAY && (this.state = Ht.HOLDING, this.startPressAnimation(t2));
    }
  }
  handleClick() {
    this.disabled || (this.state !== Ht.WAITING_FOR_CLICK ? this.state === Ht.INACTIVE && (this.startPressAnimation(), this.endPressAnimation()) : this.endPressAnimation());
  }
  handlePointercancel(t2) {
    this.shouldReactToEvent(t2) && this.endPressAnimation();
  }
  handleContextmenu() {
    this.disabled || this.endPressAnimation();
  }
  determineRippleSize() {
    const { height: t2, width: e2 } = this.getBoundingClientRect(), i2 = Math.max(t2, e2), o2 = Math.max(0.35 * i2, 75), s2 = this.currentCSSZoom ?? 1, r2 = Math.floor(0.2 * i2 / s2), n2 = Math.sqrt(e2 ** 2 + t2 ** 2) + 10;
    this.initialSize = r2;
    const a2 = (n2 + o2) / r2;
    this.rippleScale = "" + a2 / s2, this.rippleSize = `${r2}px`;
  }
  getNormalizedPointerEventCoords(t2) {
    const { scrollX: e2, scrollY: i2 } = window, { left: o2, top: s2 } = this.getBoundingClientRect(), r2 = e2 + o2, n2 = i2 + s2, { pageX: a2, pageY: l2 } = t2, d2 = this.currentCSSZoom ?? 1;
    return { x: (a2 - r2) / d2, y: (l2 - n2) / d2 };
  }
  getTranslationCoordinates(t2) {
    const { height: e2, width: i2 } = this.getBoundingClientRect(), o2 = this.currentCSSZoom ?? 1, s2 = { x: (i2 / o2 - this.initialSize) / 2, y: (e2 / o2 - this.initialSize) / 2 };
    let r2;
    return r2 = t2 instanceof PointerEvent ? this.getNormalizedPointerEventCoords(t2) : { x: i2 / o2 / 2, y: e2 / o2 / 2 }, r2 = { x: r2.x - this.initialSize / 2, y: r2.y - this.initialSize / 2 }, { startPoint: r2, endPoint: s2 };
  }
  startPressAnimation(t2) {
    var e2;
    if (!this.mdRoot) return;
    this.pressed = true, null === (e2 = this.growAnimation) || void 0 === e2 || e2.cancel(), this.determineRippleSize();
    const { startPoint: i2, endPoint: o2 } = this.getTranslationCoordinates(t2), s2 = `${i2.x}px, ${i2.y}px`, r2 = `${o2.x}px, ${o2.y}px`;
    this.growAnimation = this.mdRoot.animate({ top: [0, 0], left: [0, 0], height: [this.rippleSize, this.rippleSize], width: [this.rippleSize, this.rippleSize], transform: [`translate(${s2}) scale(1)`, `translate(${r2}) scale(${this.rippleScale})`] }, { pseudoElement: "::after", duration: 450, easing: Rt.STANDARD, fill: "forwards" });
  }
  async endPressAnimation() {
    this.rippleStartEvent = void 0, this.state = Ht.INACTIVE;
    const t2 = this.growAnimation;
    let e2 = 1 / 0;
    "number" == typeof (null == t2 ? void 0 : t2.currentTime) ? e2 = t2.currentTime : null != t2 && t2.currentTime && (e2 = t2.currentTime.to("ms").value), e2 >= 225 ? this.pressed = false : (await new Promise(((t3) => {
      setTimeout(t3, 225 - e2);
    })), this.growAnimation === t2 && (this.pressed = false));
  }
  shouldReactToEvent(t2) {
    if (this.disabled || !t2.isPrimary) return false;
    if (this.rippleStartEvent && this.rippleStartEvent.pointerId !== t2.pointerId) return false;
    if ("pointerenter" === t2.type || "pointerleave" === t2.type) return !this.isTouch(t2);
    const e2 = 1 === t2.buttons;
    return this.isTouch(t2) || e2;
  }
  isTouch({ pointerType: t2 }) {
    return "touch" === t2;
  }
  async handleEvent(t2) {
    if (null == Mt || !Mt.matches) switch (t2.type) {
      case "click":
        this.handleClick();
        break;
      case "contextmenu":
        this.handleContextmenu();
        break;
      case "pointercancel":
        this.handlePointercancel(t2);
        break;
      case "pointerdown":
        await this.handlePointerdown(t2);
        break;
      case "pointerenter":
        this.handlePointerenter(t2);
        break;
      case "pointerleave":
        this.handlePointerleave(t2);
        break;
      case "pointerup":
        this.handlePointerup(t2);
    }
  }
  onControlChange(t2, e2) {
    for (const i2 of Nt) null == t2 || t2.removeEventListener(i2, this), null == e2 || e2.addEventListener(i2, this);
  }
}
t([mt({ type: Boolean, reflect: true })], Ut.prototype, "disabled", void 0), t([ft()], Ut.prototype, "hovered", void 0), t([ft()], Ut.prototype, "pressed", void 0), t([bt(".surface")], Ut.prototype, "mdRoot", void 0);
const Dt = n`:host{display:flex;margin:auto;pointer-events:none}:host([disabled]){display:none}@media(forced-colors: active){:host{display:none}}:host,.surface{border-radius:inherit;position:absolute;inset:0;overflow:hidden}.surface{-webkit-tap-highlight-color:rgba(0,0,0,0)}.surface::before,.surface::after{content:"";opacity:0;position:absolute}.surface::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));inset:0;transition:opacity 15ms linear,background-color 15ms linear}.surface::after{background:radial-gradient(closest-side, var(--md-ripple-pressed-color, var(--md-sys-color-on-surface, #1d1b20)) max(100% - 70px, 65%), transparent 100%);transform-origin:center center;transition:opacity 375ms linear}.hovered::before{background-color:var(--md-ripple-hover-color, var(--md-sys-color-on-surface, #1d1b20));opacity:var(--md-ripple-hover-opacity, 0.08)}.pressed::after{opacity:var(--md-ripple-pressed-opacity, 0.12);transition-duration:105ms}
`;
let Lt = class extends Ut {
};
Lt.styles = [Dt], Lt = t([pt("ewt-ripple")], Lt);
const Ft = ["role", "ariaAtomic", "ariaAutoComplete", "ariaBusy", "ariaChecked", "ariaColCount", "ariaColIndex", "ariaColSpan", "ariaCurrent", "ariaDisabled", "ariaExpanded", "ariaHasPopup", "ariaHidden", "ariaInvalid", "ariaKeyShortcuts", "ariaLabel", "ariaLevel", "ariaLive", "ariaModal", "ariaMultiLine", "ariaMultiSelectable", "ariaOrientation", "ariaPlaceholder", "ariaPosInSet", "ariaPressed", "ariaReadOnly", "ariaRequired", "ariaRoleDescription", "ariaRowCount", "ariaRowIndex", "ariaRowSpan", "ariaSelected", "ariaSetSize", "ariaSort", "ariaValueMax", "ariaValueMin", "ariaValueNow", "ariaValueText"], Bt = Ft.map(Vt);
function jt(t2) {
  return Bt.includes(t2);
}
function Vt(t2) {
  return t2.replace("aria", "aria-").replace(/Elements?/g, "").toLowerCase();
}
const qt = /* @__PURE__ */ Symbol("privateIgnoreAttributeChangesFor");
function Wt(t2) {
  var e2;
  class i2 extends t2 {
    constructor() {
      super(...arguments), this[e2] = /* @__PURE__ */ new Set();
    }
    attributeChangedCallback(t3, e3, i3) {
      if (!jt(t3)) return void super.attributeChangedCallback(t3, e3, i3);
      if (this[qt].has(t3)) return;
      this[qt].add(t3), this.removeAttribute(t3), this[qt].delete(t3);
      const o2 = Gt(t3);
      null === i3 ? delete this.dataset[o2] : this.dataset[o2] = i3, this.requestUpdate(Gt(t3), e3);
    }
    getAttribute(t3) {
      return jt(t3) ? super.getAttribute(Yt(t3)) : super.getAttribute(t3);
    }
    removeAttribute(t3) {
      super.removeAttribute(t3), jt(t3) && (super.removeAttribute(Yt(t3)), this.requestUpdate());
    }
  }
  return e2 = qt, (function(t3) {
    for (const e3 of Ft) {
      const i3 = Vt(e3), o2 = Yt(i3), s2 = Gt(i3);
      t3.createProperty(e3, { attribute: i3, noAccessor: true }), t3.createProperty(Symbol(o2), { attribute: o2, noAccessor: true }), Object.defineProperty(t3.prototype, e3, { configurable: true, enumerable: true, get() {
        return this.dataset[s2] ?? null;
      }, set(t4) {
        const i4 = this.dataset[s2] ?? null;
        t4 !== i4 && (null === t4 ? delete this.dataset[s2] : this.dataset[s2] = t4, this.requestUpdate(e3, i4));
      } });
    }
  })(i2), i2;
}
function Yt(t2) {
  return `data-${t2}`;
}
function Gt(t2) {
  return t2.replace(/-\w/, ((t3) => t3[1].toUpperCase()));
}
const Kt = /* @__PURE__ */ Symbol("internals"), Zt = /* @__PURE__ */ Symbol("privateInternals");
function Jt(t2) {
  return class extends t2 {
    get [Kt]() {
      return this[Zt] || (this[Zt] = this.attachInternals()), this[Zt];
    }
  };
}
function Xt(t2) {
  t2.addInitializer(((t3) => {
    const e2 = t3;
    e2.addEventListener("click", (async (t4) => {
      const { type: i2, [Kt]: o2 } = e2, { form: s2 } = o2;
      s2 && "button" !== i2 && (await new Promise(((t5) => {
        setTimeout(t5);
      })), t4.defaultPrevented || ("reset" !== i2 ? (s2.addEventListener("submit", ((t5) => {
        Object.defineProperty(t5, "submitter", { configurable: true, enumerable: true, get: () => e2 });
      }), { capture: true, once: true }), o2.setFormValue(e2.value), s2.requestSubmit()) : s2.reset()));
    }));
  }));
}
function Qt(t2) {
  const e2 = new MouseEvent("click", { bubbles: true });
  return t2.dispatchEvent(e2), e2;
}
function te(t2) {
  return t2.currentTarget === t2.target && (t2.composedPath()[0] === t2.target && (!t2.target.disabled && !(function(t3) {
    const e2 = ee;
    e2 && (t3.preventDefault(), t3.stopImmediatePropagation());
    return (async function() {
      ee = true, await null, ee = false;
    })(), e2;
  })(t2)));
}
let ee = false;
const ie = Wt(Jt(ct));
class oe extends ie {
  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(t2) {
    this.setAttribute("name", t2);
  }
  get form() {
    return this[Kt].form;
  }
  constructor() {
    super(), this.disabled = false, this.softDisabled = false, this.href = "", this.download = "", this.target = "", this.trailingIcon = false, this.hasIcon = false, this.type = "submit", this.value = "", this.addEventListener("click", this.handleClick.bind(this));
  }
  focus() {
    var t2;
    null === (t2 = this.buttonElement) || void 0 === t2 || t2.focus();
  }
  blur() {
    var t2;
    null === (t2 = this.buttonElement) || void 0 === t2 || t2.blur();
  }
  render() {
    var t2;
    const e2 = this.disabled || this.softDisabled, i2 = this.href ? this.renderLink() : this.renderButton(), o2 = this.href ? "link" : "button";
    return j`
      ${null === (t2 = this.renderElevationOrOutline) || void 0 === t2 ? void 0 : t2.call(this)}
      <div class="background"></div>
      <ewt-focus-ring part="focus-ring" for=${o2}></ewt-focus-ring>
      <ewt-ripple
        part="ripple"
        for=${o2}
        ?disabled="${e2}"></ewt-ripple>
      ${i2}
    `;
  }
  renderButton() {
    const { ariaLabel: t2, ariaHasPopup: e2, ariaExpanded: i2 } = this;
    return j`<button
      id="button"
      class="button"
      ?disabled=${this.disabled}
      aria-disabled=${this.softDisabled || W}
      aria-label="${t2 || W}"
      aria-haspopup="${e2 || W}"
      aria-expanded="${i2 || W}">
      ${this.renderContent()}
    </button>`;
  }
  renderLink() {
    const { ariaLabel: t2, ariaHasPopup: e2, ariaExpanded: i2 } = this;
    return j`<a
      id="link"
      class="button"
      aria-label="${t2 || W}"
      aria-haspopup="${e2 || W}"
      aria-expanded="${i2 || W}"
      aria-disabled=${this.disabled || this.softDisabled || W}
      tabindex="${this.disabled && !this.softDisabled ? -1 : W}"
      href=${this.href}
      download=${this.download || W}
      target=${this.target || W}
      >${this.renderContent()}
    </a>`;
  }
  renderContent() {
    const t2 = j`<slot
      name="icon"
      @slotchange="${this.handleSlotChange}"></slot>`;
    return j`
      <span class="touch"></span>
      ${this.trailingIcon ? W : t2}
      <span class="label"><slot></slot></span>
      ${this.trailingIcon ? t2 : W}
    `;
  }
  handleClick(t2) {
    if (this.softDisabled || this.disabled && this.href) return t2.stopImmediatePropagation(), void t2.preventDefault();
    te(t2) && this.buttonElement && (this.focus(), Qt(this.buttonElement));
  }
  handleSlotChange() {
    this.hasIcon = this.assignedIcons.length > 0;
  }
}
Xt(oe), oe.formAssociated = true, oe.shadowRootOptions = { mode: "open", delegatesFocus: true }, t([mt({ type: Boolean, reflect: true })], oe.prototype, "disabled", void 0), t([mt({ type: Boolean, attribute: "soft-disabled", reflect: true })], oe.prototype, "softDisabled", void 0), t([mt()], oe.prototype, "href", void 0), t([mt()], oe.prototype, "download", void 0), t([mt()], oe.prototype, "target", void 0), t([mt({ type: Boolean, attribute: "trailing-icon", reflect: true })], oe.prototype, "trailingIcon", void 0), t([mt({ type: Boolean, attribute: "has-icon", reflect: true })], oe.prototype, "hasIcon", void 0), t([mt()], oe.prototype, "type", void 0), t([mt({ reflect: true })], oe.prototype, "value", void 0), t([bt(".button")], oe.prototype, "buttonElement", void 0), t([yt({ slot: "icon", flatten: true })], oe.prototype, "assignedIcons", void 0);
class se extends oe {
}
const re = n`:host{--_container-height: var(--md-text-button-container-height, 40px);--_disabled-label-text-color: var(--md-text-button-disabled-label-text-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-label-text-opacity: var(--md-text-button-disabled-label-text-opacity, 0.38);--_focus-label-text-color: var(--md-text-button-focus-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-label-text-color: var(--md-text-button-hover-label-text-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-color: var(--md-text-button-hover-state-layer-color, var(--md-sys-color-primary, #6750a4));--_hover-state-layer-opacity: var(--md-text-button-hover-state-layer-opacity, 0.08);--_label-text-color: var(--md-text-button-label-text-color, var(--md-sys-color-primary, #6750a4));--_label-text-font: var(--md-text-button-label-text-font, var(--md-sys-typescale-label-large-font, var(--md-ref-typeface-plain, Roboto)));--_label-text-line-height: var(--md-text-button-label-text-line-height, var(--md-sys-typescale-label-large-line-height, 1.25rem));--_label-text-size: var(--md-text-button-label-text-size, var(--md-sys-typescale-label-large-size, 0.875rem));--_label-text-weight: var(--md-text-button-label-text-weight, var(--md-sys-typescale-label-large-weight, var(--md-ref-typeface-weight-medium, 500)));--_pressed-label-text-color: var(--md-text-button-pressed-label-text-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-color: var(--md-text-button-pressed-state-layer-color, var(--md-sys-color-primary, #6750a4));--_pressed-state-layer-opacity: var(--md-text-button-pressed-state-layer-opacity, 0.12);--_disabled-icon-color: var(--md-text-button-disabled-icon-color, var(--md-sys-color-on-surface, #1d1b20));--_disabled-icon-opacity: var(--md-text-button-disabled-icon-opacity, 0.38);--_focus-icon-color: var(--md-text-button-focus-icon-color, var(--md-sys-color-primary, #6750a4));--_hover-icon-color: var(--md-text-button-hover-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-color: var(--md-text-button-icon-color, var(--md-sys-color-primary, #6750a4));--_icon-size: var(--md-text-button-icon-size, 18px);--_pressed-icon-color: var(--md-text-button-pressed-icon-color, var(--md-sys-color-primary, #6750a4));--_container-shape-start-start: var(--md-text-button-container-shape-start-start, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-start-end: var(--md-text-button-container-shape-start-end, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-end: var(--md-text-button-container-shape-end-end, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_container-shape-end-start: var(--md-text-button-container-shape-end-start, var(--md-text-button-container-shape, var(--md-sys-shape-corner-full, 9999px)));--_leading-space: var(--md-text-button-leading-space, 12px);--_trailing-space: var(--md-text-button-trailing-space, 12px);--_with-leading-icon-leading-space: var(--md-text-button-with-leading-icon-leading-space, 12px);--_with-leading-icon-trailing-space: var(--md-text-button-with-leading-icon-trailing-space, 16px);--_with-trailing-icon-leading-space: var(--md-text-button-with-trailing-icon-leading-space, 16px);--_with-trailing-icon-trailing-space: var(--md-text-button-with-trailing-icon-trailing-space, 12px);--_container-color: none;--_disabled-container-color: none;--_disabled-container-opacity: 0}
`;
class ne extends se {
}
ne.styles = [xt, re], customElements.define("ew-text-button", ne);
class ae extends ct {
  constructor() {
    super(...arguments), this.inset = false, this.insetStart = false, this.insetEnd = false;
  }
}
t([mt({ type: Boolean, reflect: true })], ae.prototype, "inset", void 0), t([mt({ type: Boolean, reflect: true, attribute: "inset-start" })], ae.prototype, "insetStart", void 0), t([mt({ type: Boolean, reflect: true, attribute: "inset-end" })], ae.prototype, "insetEnd", void 0);
const le = n`:host{box-sizing:border-box;color:var(--md-divider-color, var(--md-sys-color-outline-variant, #cac4d0));display:flex;height:var(--md-divider-thickness, 1px);width:100%}:host([inset]),:host([inset-start]){padding-inline-start:16px}:host([inset]),:host([inset-end]){padding-inline-end:16px}:host::before{background:currentColor;content:"";height:100%;width:100%}@media(forced-colors: active){:host::before{background:CanvasText}}
`;
function de(t2, e2) {
  !e2.bubbles || t2.shadowRoot && !e2.composed || e2.stopPropagation();
  const i2 = Reflect.construct(e2.constructor, [e2.type, e2]), o2 = t2.dispatchEvent(i2);
  return o2 || e2.preventDefault(), o2;
}
let ce = class extends ae {
};
ce.styles = [le], ce = t([pt("ewt-divider")], ce);
const he = { dialog: [[[{ transform: "translateY(-50px)" }, { transform: "translateY(0)" }], { duration: 500, easing: Rt.EMPHASIZED }]], scrim: [[[{ opacity: 0 }, { opacity: 0.32 }], { duration: 500, easing: "linear" }]], container: [[[{ opacity: 0 }, { opacity: 1 }], { duration: 50, easing: "linear", pseudoElement: "::before" }], [[{ height: "35%" }, { height: "100%" }], { duration: 500, easing: Rt.EMPHASIZED, pseudoElement: "::before" }]], headline: [[[{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }], { duration: 250, easing: "linear", fill: "forwards" }]], content: [[[{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }], { duration: 250, easing: "linear", fill: "forwards" }]], actions: [[[{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 300, easing: "linear", fill: "forwards" }]] }, pe = { dialog: [[[{ transform: "translateY(0)" }, { transform: "translateY(-50px)" }], { duration: 150, easing: Rt.EMPHASIZED_ACCELERATE }]], scrim: [[[{ opacity: 0.32 }, { opacity: 0 }], { duration: 150, easing: "linear" }]], container: [[[{ height: "100%" }, { height: "35%" }], { duration: 150, easing: Rt.EMPHASIZED_ACCELERATE, pseudoElement: "::before" }], [[{ opacity: "1" }, { opacity: "0" }], { delay: 100, duration: 50, easing: "linear", pseudoElement: "::before" }]], headline: [[[{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: "linear", fill: "forwards" }]], content: [[[{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: "linear", fill: "forwards" }]], actions: [[[{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: "linear", fill: "forwards" }]] }, ue = Wt(ct);
class ve extends ue {
  get open() {
    return this.isOpen;
  }
  set open(t2) {
    t2 !== this.isOpen && (this.isOpen = t2, t2 ? (this.setAttribute("open", ""), this.show()) : (this.removeAttribute("open"), this.close()));
  }
  constructor() {
    super(), this.quick = false, this.returnValue = "", this.noFocusTrap = false, this.getOpenAnimation = () => he, this.getCloseAnimation = () => pe, this.isOpen = false, this.isOpening = false, this.isConnectedPromise = this.getIsConnectedPromise(), this.isAtScrollTop = false, this.isAtScrollBottom = false, this.nextClickIsFromContent = false, this.hasHeadline = false, this.hasActions = false, this.hasIcon = false, this.escapePressedWithoutCancel = false, this.treewalker = document.createTreeWalker(this, NodeFilter.SHOW_ELEMENT), this.addEventListener("submit", this.handleSubmit);
  }
  async show() {
    var t2;
    this.isOpening = true, await this.isConnectedPromise, await this.updateComplete;
    const e2 = this.dialog;
    if (e2.open || !this.isOpening) return void (this.isOpening = false);
    if (!this.dispatchEvent(new Event("open", { cancelable: true }))) return this.open = false, void (this.isOpening = false);
    e2.showModal(), this.open = true, this.scroller && (this.scroller.scrollTop = 0), null === (t2 = this.querySelector("[autofocus]")) || void 0 === t2 || t2.focus(), await this.animateDialog(this.getOpenAnimation()), this.dispatchEvent(new Event("opened")), this.isOpening = false;
  }
  async close(t2 = this.returnValue) {
    if (this.isOpening = false, !this.isConnected) return void (this.open = false);
    await this.updateComplete;
    const e2 = this.dialog;
    if (!e2.open || this.isOpening) return void (this.open = false);
    const i2 = this.returnValue;
    this.returnValue = t2;
    this.dispatchEvent(new Event("close", { cancelable: true })) ? (await this.animateDialog(this.getCloseAnimation()), e2.close(t2), this.open = false, this.dispatchEvent(new Event("closed"))) : this.returnValue = i2;
  }
  connectedCallback() {
    super.connectedCallback(), this.isConnectedPromiseResolve();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this.isConnectedPromise = this.getIsConnectedPromise();
  }
  render() {
    const t2 = this.open && !(this.isAtScrollTop && this.isAtScrollBottom), e2 = { "has-headline": this.hasHeadline, "has-actions": this.hasActions, "has-icon": this.hasIcon, scrollable: t2, "show-top-divider": t2 && !this.isAtScrollTop, "show-bottom-divider": t2 && !this.isAtScrollBottom }, i2 = this.open && !this.noFocusTrap, o2 = j`
      <div
        class="focus-trap"
        tabindex="0"
        aria-hidden="true"
        @focus=${this.handleFocusTrapFocus}></div>
    `, { ariaLabel: s2 } = this;
    return j`
      <div class="scrim"></div>
      <dialog
        class=${Ot(e2)}
        aria-label=${s2 || W}
        aria-labelledby=${this.hasHeadline ? "headline" : W}
        role=${"alert" === this.type ? "alertdialog" : W}
        @cancel=${this.handleCancel}
        @click=${this.handleDialogClick}
        @close=${this.handleClose}
        @keydown=${this.handleKeydown}
        .returnValue=${this.returnValue || W}>
        ${i2 ? o2 : W}
        <div class="container" @click=${this.handleContentClick}>
          <div class="headline">
            <div class="icon" aria-hidden="true">
              <slot name="icon" @slotchange=${this.handleIconChange}></slot>
            </div>
            <h2 id="headline" aria-hidden=${!this.hasHeadline || W}>
              <slot
                name="headline"
                @slotchange=${this.handleHeadlineChange}></slot>
            </h2>
            <ewt-divider></ewt-divider>
          </div>
          <div class="scroller">
            <div class="content">
              <div class="top anchor"></div>
              <slot name="content"></slot>
              <div class="bottom anchor"></div>
            </div>
          </div>
          <div class="actions">
            <ewt-divider></ewt-divider>
            <slot name="actions" @slotchange=${this.handleActionsChange}></slot>
          </div>
        </div>
        ${i2 ? o2 : W}
      </dialog>
    `;
  }
  firstUpdated() {
    this.intersectionObserver = new IntersectionObserver(((t2) => {
      for (const e2 of t2) this.handleAnchorIntersection(e2);
    }), { root: this.scroller }), this.intersectionObserver.observe(this.topAnchor), this.intersectionObserver.observe(this.bottomAnchor);
  }
  handleDialogClick() {
    if (this.nextClickIsFromContent) return void (this.nextClickIsFromContent = false);
    !this.dispatchEvent(new Event("cancel", { cancelable: true })) || this.close();
  }
  handleContentClick() {
    this.nextClickIsFromContent = true;
  }
  handleSubmit(t2) {
    const e2 = t2.target, { submitter: i2 } = t2;
    "dialog" === e2.getAttribute("method") && i2 && this.close(i2.getAttribute("value") ?? this.returnValue);
  }
  handleCancel(t2) {
    if (t2.target !== this.dialog) return;
    this.escapePressedWithoutCancel = false;
    const e2 = !de(this, t2);
    t2.preventDefault(), e2 || this.close();
  }
  handleClose() {
    var t2;
    this.escapePressedWithoutCancel && (this.escapePressedWithoutCancel = false, null === (t2 = this.dialog) || void 0 === t2 || t2.dispatchEvent(new Event("cancel", { cancelable: true })));
  }
  handleKeydown(t2) {
    "Escape" === t2.key && (this.escapePressedWithoutCancel = true, setTimeout((() => {
      this.escapePressedWithoutCancel = false;
    })));
  }
  async animateDialog(t2) {
    var e2;
    if (null === (e2 = this.cancelAnimations) || void 0 === e2 || e2.abort(), this.cancelAnimations = new AbortController(), this.quick) return;
    const { dialog: i2, scrim: o2, container: s2, headline: r2, content: n2, actions: a2 } = this;
    if (!(i2 && o2 && s2 && r2 && n2 && a2)) return;
    const { container: l2, dialog: d2, scrim: c2, headline: h2, content: p2, actions: u2 } = t2, v2 = [[i2, d2 ?? []], [o2, c2 ?? []], [s2, l2 ?? []], [r2, h2 ?? []], [n2, p2 ?? []], [a2, u2 ?? []]], m2 = [];
    for (const [t3, e3] of v2) for (const i3 of e3) {
      const e4 = t3.animate(...i3);
      this.cancelAnimations.signal.addEventListener("abort", (() => {
        e4.cancel();
      })), m2.push(e4);
    }
    await Promise.all(m2.map(((t3) => t3.finished.catch((() => {
    })))));
  }
  handleHeadlineChange(t2) {
    const e2 = t2.target;
    this.hasHeadline = e2.assignedElements().length > 0;
  }
  handleActionsChange(t2) {
    const e2 = t2.target;
    this.hasActions = e2.assignedElements().length > 0;
  }
  handleIconChange(t2) {
    const e2 = t2.target;
    this.hasIcon = e2.assignedElements().length > 0;
  }
  handleAnchorIntersection(t2) {
    const { target: e2, isIntersecting: i2 } = t2;
    e2 === this.topAnchor && (this.isAtScrollTop = i2), e2 === this.bottomAnchor && (this.isAtScrollBottom = i2);
  }
  getIsConnectedPromise() {
    return new Promise(((t2) => {
      this.isConnectedPromiseResolve = t2;
    }));
  }
  handleFocusTrapFocus(t2) {
    const [e2, i2] = this.getFirstAndLastFocusableChildren();
    var o2;
    if (!e2 || !i2) return void (null === (o2 = this.dialog) || void 0 === o2 || o2.focus());
    const s2 = t2.target === this.firstFocusTrap, r2 = !s2, n2 = t2.relatedTarget === e2, a2 = t2.relatedTarget === i2, l2 = !n2 && !a2;
    if (r2 && a2 || s2 && l2) return void e2.focus();
    (s2 && n2 || r2 && l2) && i2.focus();
  }
  getFirstAndLastFocusableChildren() {
    if (!this.treewalker) return [null, null];
    let t2 = null, e2 = null;
    for (this.treewalker.currentNode = this.treewalker.root; this.treewalker.nextNode(); ) {
      const i2 = this.treewalker.currentNode;
      me(i2) && (t2 || (t2 = i2), e2 = i2);
    }
    return [t2, e2];
  }
}
function me(t2) {
  var e2;
  const i2 = ":not(:disabled,[disabled])";
  if (t2.matches(":is(button,input,select,textarea,object,:is(a,area)[href],[tabindex],[contenteditable=true])" + i2 + ':not([tabindex^="-"])')) return true;
  return !!t2.localName.includes("-") && (!!t2.matches(i2) && ((null === (e2 = t2.shadowRoot) || void 0 === e2 ? void 0 : e2.delegatesFocus) ?? false));
}
t([mt({ type: Boolean })], ve.prototype, "open", null), t([mt({ type: Boolean })], ve.prototype, "quick", void 0), t([mt({ attribute: false })], ve.prototype, "returnValue", void 0), t([mt()], ve.prototype, "type", void 0), t([mt({ type: Boolean, attribute: "no-focus-trap" })], ve.prototype, "noFocusTrap", void 0), t([bt("dialog")], ve.prototype, "dialog", void 0), t([bt(".scrim")], ve.prototype, "scrim", void 0), t([bt(".container")], ve.prototype, "container", void 0), t([bt(".headline")], ve.prototype, "headline", void 0), t([bt(".content")], ve.prototype, "content", void 0), t([bt(".actions")], ve.prototype, "actions", void 0), t([ft()], ve.prototype, "isAtScrollTop", void 0), t([ft()], ve.prototype, "isAtScrollBottom", void 0), t([bt(".scroller")], ve.prototype, "scroller", void 0), t([bt(".top.anchor")], ve.prototype, "topAnchor", void 0), t([bt(".bottom.anchor")], ve.prototype, "bottomAnchor", void 0), t([bt(".focus-trap")], ve.prototype, "firstFocusTrap", void 0), t([ft()], ve.prototype, "hasHeadline", void 0), t([ft()], ve.prototype, "hasActions", void 0), t([ft()], ve.prototype, "hasIcon", void 0);
const fe = n`:host{border-start-start-radius:var(--md-dialog-container-shape-start-start, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-start-end-radius:var(--md-dialog-container-shape-start-end, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-end-end-radius:var(--md-dialog-container-shape-end-end, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));border-end-start-radius:var(--md-dialog-container-shape-end-start, var(--md-dialog-container-shape, var(--md-sys-shape-corner-extra-large, 28px)));display:contents;margin:auto;max-height:min(560px,100% - 48px);max-width:min(560px,100% - 48px);min-height:140px;min-width:280px;position:fixed;height:fit-content;width:fit-content}dialog{background:rgba(0,0,0,0);border:none;border-radius:inherit;flex-direction:column;height:inherit;margin:inherit;max-height:inherit;max-width:inherit;min-height:inherit;min-width:inherit;outline:none;overflow:visible;padding:0;width:inherit}dialog[open]{display:flex}::backdrop{background:none}.scrim{background:var(--md-sys-color-scrim, #000);display:none;inset:0;opacity:32%;pointer-events:none;position:fixed;z-index:1}:host([open]) .scrim{display:flex}h2{all:unset;align-self:stretch}.headline{align-items:center;color:var(--md-dialog-headline-color, var(--md-sys-color-on-surface, #1d1b20));display:flex;flex-direction:column;font-family:var(--md-dialog-headline-font, var(--md-sys-typescale-headline-small-font, var(--md-ref-typeface-brand, Roboto)));font-size:var(--md-dialog-headline-size, var(--md-sys-typescale-headline-small-size, 1.5rem));line-height:var(--md-dialog-headline-line-height, var(--md-sys-typescale-headline-small-line-height, 2rem));font-weight:var(--md-dialog-headline-weight, var(--md-sys-typescale-headline-small-weight, var(--md-ref-typeface-weight-regular, 400)));position:relative}slot[name=headline]::slotted(*){align-items:center;align-self:stretch;box-sizing:border-box;display:flex;gap:8px;padding:24px 24px 0}.icon{display:flex}slot[name=icon]::slotted(*){color:var(--md-dialog-icon-color, var(--md-sys-color-secondary, #625b71));fill:currentColor;font-size:var(--md-dialog-icon-size, 24px);margin-top:24px;height:var(--md-dialog-icon-size, 24px);width:var(--md-dialog-icon-size, 24px)}.has-icon slot[name=headline]::slotted(*){justify-content:center;padding-top:16px}.scrollable slot[name=headline]::slotted(*){padding-bottom:16px}.scrollable.has-headline slot[name=content]::slotted(*){padding-top:8px}.container{border-radius:inherit;display:flex;flex-direction:column;flex-grow:1;overflow:hidden;position:relative;transform-origin:top}.container::before{background:var(--md-dialog-container-color, var(--md-sys-color-surface-container-high, #ece6f0));border-radius:inherit;content:"";inset:0;position:absolute}.scroller{display:flex;flex:1;flex-direction:column;overflow:hidden;z-index:1}.scrollable .scroller{overflow-y:scroll}.content{color:var(--md-dialog-supporting-text-color, var(--md-sys-color-on-surface-variant, #49454f));font-family:var(--md-dialog-supporting-text-font, var(--md-sys-typescale-body-medium-font, var(--md-ref-typeface-plain, Roboto)));font-size:var(--md-dialog-supporting-text-size, var(--md-sys-typescale-body-medium-size, 0.875rem));line-height:var(--md-dialog-supporting-text-line-height, var(--md-sys-typescale-body-medium-line-height, 1.25rem));flex:1;font-weight:var(--md-dialog-supporting-text-weight, var(--md-sys-typescale-body-medium-weight, var(--md-ref-typeface-weight-regular, 400)));height:min-content;position:relative}slot[name=content]::slotted(*){box-sizing:border-box;padding:24px}.anchor{position:absolute}.top.anchor{top:0}.bottom.anchor{bottom:0}.actions{position:relative}slot[name=actions]::slotted(*){box-sizing:border-box;display:flex;gap:8px;justify-content:flex-end;padding:16px 24px 24px}.has-actions slot[name=content]::slotted(*){padding-bottom:8px}ewt-divider{display:none;position:absolute}.has-headline.show-top-divider .headline ewt-divider,.has-actions.show-bottom-divider .actions ewt-divider{display:flex}.headline ewt-divider{bottom:0}.actions ewt-divider{top:0}@media(forced-colors: active){dialog{outline:2px solid WindowText}}
`;
class ge extends ve {
}
ge.styles = [fe], customElements.define("ew-dialog", ge);
const be = n`
  :host {
    --roboto-font: Roboto, system-ui;
    --text-color: rgba(0, 0, 0, 0.6);
    --danger-color: #db4437;

    --md-sys-color-primary: #03a9f4;
    --md-sys-color-on-primary: #fff;
    --md-ref-typeface-brand: var(--roboto-font);
    --md-ref-typeface-plain: var(--roboto-font);

    --md-sys-color-surface: #fff;
    --md-sys-color-surface-container: #fff;
    --md-sys-color-surface-container-high: #fff;
    --md-sys-color-surface-container-highest: #f5f5f5;
    --md-sys-color-secondary-container: #e0e0e0;

    --md-sys-typescale-headline-font: var(--roboto-font);
    --md-sys-typescale-title-font: var(--roboto-font);
  }

  a {
    color: var(--md-sys-color-primary);
  }
`;
export {
  It as I,
  Jt as J,
  Kt as K,
  Ot as O,
  Qt as Q,
  Rt as R,
  Tt as T,
  V,
  Wt as W,
  Xt as X,
  be as a,
  bt as b,
  ct as c,
  W as d,
  ae as e,
  ft as f,
  gt as g,
  te as h,
  de as i,
  j,
  at as k,
  le as l,
  mt as m,
  n,
  kt as o,
  pt as p,
  q,
  t,
  yt as y,
  zt as z
};
