/* Autovalutazione — Modellazione PNL / NLP Modelling
 * Domande generate: dati nuovi a ogni facsimile (specifica: ../QUIZ_SPEC.md).
 * Ogni generatore restituisce { testo, opzioni, corretta, spiegazione, dati }:
 * "dati" (l'istanza) serve solo ai controlli di quiz/verifica/ e l'app lo ignora.
 * Nessuna dipendenza esterna, niente Math.random: solo rng().
 */
window.QUIZ_GEN = window.QUIZ_GEN || {};
(function () {
  "use strict";
  var MOD = "nlp-modelling";
  var LISTA = (window.QUIZ_GEN[MOD] = window.QUIZ_GEN[MOD] || []);
  var URL_EN = "https://fabiofurini.github.io/nlp-modelling/";
  var URL_IT = "https://fabiofurini.github.io/modellazione-pnl/";

  function link(en, it) { return { it: URL_IT + it, en: URL_EN + en }; }
  function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
  function pk(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  /* numero formattato con d decimali, zeri finali tolti; virgola decimale in italiano */
  function f(x, d, L) {
    var p = Math.pow(10, d);
    var y = Math.round(x * p + (x >= 0 ? 1e-7 : -1e-7)) / p;
    var s = y.toFixed(d);
    if (d > 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    if (s === "-0") s = "0";
    return L === "it" ? s.replace(".", ",") : s;
  }
  /* lo stesso numero, da scrivere dentro $...$ */
  function m(x, d, L) { return f(x, d, L).replace(",", "{,}"); }
  function T(L, en, it) { return L === "it" ? it : en; }
  function pos(x) { return x > 0 ? x : 0; }
  /* vero se x cade (quasi) a metà fra due valori arrotondati a d decimali */
  function quasiMezzo(x, d) { var y = x * Math.pow(10, d); return Math.abs(y - Math.floor(y) - 0.5) < 1e-3; }
  function sortNum(a) { return a.slice().sort(function (u, v) { return u - v; }); }

  /* opzioni: la giusta + le prime 3 sbagliate distinte; mescolate con rng */
  function chiudi(rng, testo, giusta, sbagliate, spiegazione, dati) {
    var opz = [giusta];
    for (var i = 0; i < sbagliate.length && opz.length < 4; i++) {
      if (opz.indexOf(sbagliate[i]) < 0) opz.push(sbagliate[i]);
    }
    if (opz.length < 4) return null;
    var idx = [0, 1, 2, 3];
    for (var k = 3; k > 0; k--) {
      var j = Math.floor(rng() * (k + 1));
      var t = idx[k]; idx[k] = idx[j]; idx[j] = t;
    }
    var out = [], corr = 0;
    for (var h = 0; h < 4; h++) { out.push(opz[idx[h]]); if (idx[h] === 0) corr = h; }
    return { testo: testo, opzioni: out, corretta: corr, spiegazione: spiegazione, dati: dati };
  }

  function gen(def) {
    LISTA.push({
      id: def.id, livello: def.livello, capitolo: def.capitolo, link: def.link,
      genera: function (rng, lingua) {
        var L = lingua === "it" ? "it" : "en";
        for (var t = 0; t < 2000; t++) {
          var r = def.prova(rng, L);
          if (r) return r;
        }
        throw new Error("generatore " + def.id + ": nessuna istanza valida");
      }
    });
  }

  /* ===================== Cap. 2 — teoria LP ===================== */

  function istanzaLP(rng) {
    var p1 = ri(rng, 1, 12), p2 = ri(rng, 1, 12);
    if (p1 === p2) return null;
    var a11 = ri(rng, 1, 4), a12 = ri(rng, 1, 4), a21 = ri(rng, 1, 4), a22 = ri(rng, 1, 4);
    var det = a11 * a22 - a12 * a21;
    if (det === 0) return null;
    var x1 = ri(rng, 5, 30), x2 = ri(rng, 5, 30);
    return {
      pi: [p1, p2], A: [[a11, a12], [a21, a22]], x: [x1, x2],
      c: [a11 * p1 + a21 * p2, a12 * p1 + a22 * p2],
      b: [a11 * x1 + a12 * x2, a21 * x1 + a22 * x2]
    };
  }
  function testoLP(I, L) {
    var A = I.A, c = I.c, b = I.b;
    function k(a) { return a === 1 ? "" : String(a); }
    return T(L, "Consider the LP ", "Si consideri l'LP ") +
      "$\\max\\; " + c[0] + "x_1 + " + c[1] + "x_2$ " + T(L, "subject to ", "soggetto a ") +
      "$" + k(A[0][0]) + "x_1 + " + k(A[0][1]) + "x_2 \\le " + b[0] + "$, $" +
      k(A[1][0]) + "x_1 + " + k(A[1][1]) + "x_2 \\le " + b[1] + "$, $x_1, x_2 \\ge 0$; " +
      T(L, "its dual has one variable $\\pi_i \\ge 0$ per constraint $i$ (the shadow price of the constraint). ",
           "il suo duale ha una variabile $\\pi_i \\ge 0$ per ogni vincolo $i$ (il prezzo ombra del vincolo). ");
  }

  /* ===================== Cap. 4 — produzione ===================== */

  function istanza2mesi(rng, stretto) {
    var b = pk(rng, [60, 70, 80, 90, 100]), de = 5 * ri(rng, 1, 6), d2 = b + de;
    var d1max = b - de - (stretto ? 5 : 0);
    if (Math.floor(d1max / 5) < 4) return null;
    var d1 = 5 * ri(rng, 4, Math.floor(d1max / 5));
    var c = ri(rng, 5, 15), h = ri(rng, 1, 3);
    return { b: b, d1: d1, d2: d2, de: de, c: c, h: h };
  }
  function testo2mesi(I, L) {
    return T(L,
      "Production-inventory LP, one product, two months: $x_t$ = units produced and $s_t$ = inventory at the end of month $t$, balance $s_{t-1} + x_t = d_t + s_t$ ($s_0 = 0$), capacity $x_t \\le b_t$; minimize $\\sum_t (c\\,x_t + h\\,s_t)$. Data: demand $d_1 = " + I.d1 + "$, $d_2 = " + I.d2 + "$; $b_1 = b_2 = " + I.b + "$ units; $c = " + I.c + "$ €/unit, holding cost $h = " + I.h + "$ €/unit/month. ",
      "LP di produzione e scorte, un prodotto, due mesi: $x_t$ = unità prodotte e $s_t$ = scorta a fine mese $t$, bilancio $s_{t-1} + x_t = d_t + s_t$ ($s_0 = 0$), capacità $x_t \\le b_t$; si minimizza $\\sum_t (c\\,x_t + h\\,s_t)$. Dati: domanda $d_1 = " + I.d1 + "$, $d_2 = " + I.d2 + "$; $b_1 = b_2 = " + I.b + "$ unità; $c = " + I.c + "$ €/unità, costo di giacenza $h = " + I.h + "$ €/unità/mese. ");
  }

  /* ===================== Cap. 5 — supply chain ===================== */

  /* ===================== Cap. 6 — Markowitz ===================== */

  /* ===================== Cap. 7 — pricing ===================== */

  function istanzaPricing(rng, soloAttivo) {
    var b = pk(rng, [2, 4, 5, 10]), A = 10 * ri(rng, 10, 30);
    var c = 2 * ri(rng, 5, 40);
    if (c >= A - 20) return null;
    var p0 = (A + c) / 2, q0 = b * (A - p0);
    var attivo = soloAttivo ? true : rng() < 0.6;
    var k;
    if (attivo) { k = q0 - b * 5 * ri(rng, 1, 6); if (k <= 0) return null; }
    else { k = q0 + 10 * ri(rng, 1, 10); }
    var ps = attivo ? (b * A - k) / b : p0;
    return { a: b * A, b: b, A: A, c: c, k: k, p0: p0, q0: q0, ps: ps, attivo: attivo };
  }
  function profitto(I, p) { return (p - I.c) * Math.max(0, Math.min(I.a - I.b * p, I.k)); }

  /* ===================== Cap. 8 — budget ===================== */

  /* ===================== Cap. 9 — localizzazione ===================== */

  /* ===================== Cap. 10 — ricarica EV ===================== */

  /* ===================== Cap. 11 — code ===================== */

  /* ===================== Cap. 12 — DEA ===================== */

  function istanzaDEA1(rng) {
    var n = 5, x = [], y = [];
    for (var j = 0; j < n; j++) { x.push(ri(rng, 2, 12)); y.push(ri(rng, 1, 12)); }
    return { x: x, y: y, n: n };
  }
  function tabellaDEA(I, L) {
    var s = T(L, "DMU $j$: ", "DMU $j$: ");
    var parti = [];
    for (var j = 0; j < I.n; j++) parti.push((j + 1) + " $(x_{1" + (j + 1) + "}, y_{1" + (j + 1) + "}) = (" + I.x[j] + ", " + I.y[j] + ")$");
    return s + parti.join("; ") + ". ";
  }
  function ccr1(I, o) {
    var best = 0;
    for (var j = 0; j < I.n; j++) best = Math.max(best, I.y[j] / I.x[j]);
    return (I.y[o] / I.x[o]) / best;
  }
  function bcc1(I, o, soloSingoli) {
    var best = Infinity;
    for (var j = 0; j < I.n; j++) {
      if (I.y[j] >= I.y[o]) best = Math.min(best, I.x[j]);
      if (soloSingoli) continue;
      for (var k = 0; k < I.n; k++) {
        if (I.y[j] < I.y[o] && I.y[o] < I.y[k]) {
          var a = (I.y[k] - I.y[o]) / (I.y[k] - I.y[j]);
          best = Math.min(best, a * I.x[j] + (1 - a) * I.x[k]);
        }
      }
    }
    return best / I.x[o];
  }

  /* theta CCR con 2 input e output y_j: punti normalizzati z_j = x_j / y_j */
  function theta2(Z, zo) {
    var best = Infinity, single = Infinity;
    function val(p) { return Math.max(p[0] / zo[0], p[1] / zo[1]); }
    for (var j = 0; j < Z.length; j++) {
      single = Math.min(single, val(Z[j]));
      for (var k = j + 1; k < Z.length; k++) {
        var al = [0, 1];
        // intersezione delle due rette p_i(a)/zo_i
        var A0 = (Z[j][0] - Z[k][0]) / zo[0], B0 = Z[k][0] / zo[0];
        var A1 = (Z[j][1] - Z[k][1]) / zo[1], B1 = Z[k][1] / zo[1];
        if (Math.abs(A0 - A1) > 1e-12) { var a = (B1 - B0) / (A0 - A1); if (a > 0 && a < 1) al.push(a); }
        for (var t = 0; t < al.length; t++) {
          var p = [al[t] * Z[j][0] + (1 - al[t]) * Z[k][0], al[t] * Z[j][1] + (1 - al[t]) * Z[k][1]];
          best = Math.min(best, val(p));
        }
      }
    }
    return { theta: Math.min(best, single), single: single };
  }

  /* ===================== Cap. 13 — newsvendor ===================== */

  function istanzaNVd(rng) {
    var k = pk(rng, [4, 5]), d = [];
    while (d.length < k) { var v = 10 * ri(rng, 5, 20); if (d.indexOf(v) < 0) d.push(v); }
    d = sortNum(d);
    var parts = [], rest = 10;
    for (var s = 0; s < k - 1; s++) {
      var mx = rest - (k - 1 - s);
      var t = ri(rng, 1, Math.min(4, mx)); parts.push(t); rest -= t;
    }
    if (rest < 1 || rest > 5) return null;
    parts.push(rest);
    var pr = parts.map(function (u) { return u / 10; });
    var cu = ri(rng, 2, 12), co = ri(rng, 2, 12);
    if (cu === co) return null;
    var al = cu / (cu + co), F = 0;
    for (s = 0; s < k; s++) { F += pr[s]; if (Math.abs(F - al) < 1e-9 || Math.abs(F - (1 - al)) < 1e-9 || Math.abs(F - 0.5) < 1e-9) return null; }
    return { d: d, pr: pr, cu: cu, co: co, al: al, k: k };
  }
  function nvCosto(I, q) {
    var C = 0;
    for (var s = 0; s < I.k; s++) C += I.pr[s] * (I.co * pos(q - I.d[s]) + I.cu * pos(I.d[s] - q));
    return C;
  }
  function nvQuantile(I, a) {
    var F = 0;
    for (var s = 0; s < I.k; s++) { F += I.pr[s]; if (F >= a - 1e-12) return s; }
    return I.k - 1;
  }
  function testoNVd(I, L) {
    var parti = [];
    for (var s = 0; s < I.k; s++) parti.push("$" + I.d[s] + "$ (" + m(I.pr[s], 1, L) + ")");
    return T(L, "Newsvendor: a quantity $q$ is ordered before the demand $D$ is known, to minimize the expected cost $\\mathbb E[c_o(q - D)^+ + c_u(D - q)^+]$, with underage cost $c_u = " + I.cu + "$ per unit of unmet demand and overage cost $c_o = " + I.co + "$ per unsold unit. Demand scenarios (probability in brackets): ",
           "Newsvendor: si ordina una quantità $q$ prima di conoscere la domanda $D$, per minimizzare il costo atteso $\\mathbb E[c_o(q - D)^+ + c_u(D - q)^+]$, con costo di underage $c_u = " + I.cu + "$ per unità di domanda non servita e di overage $c_o = " + I.co + "$ per unità invenduta. Scenari di domanda (probabilità tra parentesi): ") +
      parti.join(", ") + ". ";
  }

  /* ===================== Cap. 14 — VaR e CVaR ===================== */

  function perdite(rng, k) {
    var l = [];
    while (l.length < k) { var v = ri(rng, 1, 40); if (l.indexOf(v) < 0) l.push(v); }
    return l;
  }
  function varcvar(l, pr, a) {
    var idx = l.map(function (_, i) { return i; }).sort(function (u, v) { return l[u] - l[v]; });
    var F = 0, V = null;
    for (var t = 0; t < idx.length; t++) { F += pr[idx[t]]; if (F >= a - 1e-12) { V = l[idx[t]]; break; } }
    var ex = 0;
    for (var i = 0; i < l.length; i++) ex += pr[i] * pos(l[i] - V);
    return { V: V, C: V + ex / (1 - a) };
  }

  /* ===================== Cap. 15 — arbitraggio ===================== */

  function istanzaArb(rng) {
    var R = pk(rng, [1, 1.05, 1.1, 1.25]), s0 = ri(rng, 10, 50);
    var Rs = R * s0, d = ri(rng, Math.max(1, Math.floor(0.5 * s0)), Math.floor(Rs) - 1), u = ri(rng, Math.ceil(Rs) + 1, Math.ceil(1.6 * Rs) + 2);
    if (!(d < Rs && Rs < u)) return null;
    var q1 = (Rs - d) / (u - d);
    if (q1 < 0.05 || q1 > 0.95) return null;
    return { R: R, s0: s0, d: d, u: u, q1: q1 };
  }
  function testoArb(I, L) {
    return T(L,
      "One-period market with two states of the world: a risk-free security costs $1$ today and pays $R = " + m(I.R, 2, L) + "$ in both states; a risky security costs $s^0_1 = " + I.s0 + "$ today and pays $" + I.u + "$ in state 1 and $" + I.d + "$ in state 2. Risk-neutral probabilities are $q_1, q_2 \\ge 0$ with $q_1 + q_2 = 1$ under which every price equals the expected payoff divided by $R$. ",
      "Mercato a un periodo con due stati del mondo: un titolo privo di rischio costa oggi $1$ e paga $R = " + m(I.R, 2, L) + "$ in entrambi gli stati; un titolo rischioso costa oggi $s^0_1 = " + I.s0 + "$ e paga $" + I.u + "$ nello stato 1 e $" + I.d + "$ nello stato 2. Le probabilità neutrali al rischio sono $q_1, q_2 \\ge 0$ con $q_1 + q_2 = 1$ sotto le quali ogni prezzo è il pagamento atteso diviso per $R$. ");
  }

  /* ===================== Cap. 16 — SVM ===================== */

  /* ===================== Cap. 17 — regressione ===================== */

  function perditaQ(y, b, tau) {
    var z = 0;
    for (var i = 0; i < y.length; i++) z += tau * pos(y[i] - b) + (1 - tau) * pos(b - y[i]);
    return z;
  }

  /* ===================== generatori aggiunti (6 novembre 2026): almeno 2 per capitolo con calcoli ===================== */

  /* Cap. 2 — intervallo di validità di b_1 */

  /* Cap. 8 — budget con un tetto attivo */

  /* Cap. 9 — minimax nel piano (cerchio minimo) */
  function cerchio3(P) {
    function d(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); }
    var best = null;
    for (var i = 0; i < 3; i++) for (var j = i + 1; j < 3; j++) {
      var k = 3 - i - j, M = [(P[i][0] + P[j][0]) / 2, (P[i][1] + P[j][1]) / 2], r = d(P[i], P[j]) / 2;
      if (d(M, P[k]) <= r + 1e-9 && (best === null || r < best.r)) best = { c: M, r: r, tipo: "lato", dk: d(M, P[k]) - r };
    }
    var ax = P[0][0], ay = P[0][1], bx = P[1][0], by = P[1][1], cx = P[2][0], cy = P[2][1];
    var D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    var ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
    var uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
    var circ = { c: [ux, uy], r: d([ux, uy], P[0]), tipo: "circo" };
    return { opt: best || circ, circ: circ };
  }

  /* Cap. 10 — un veicolo, tre ore, rendimento eta < 1 */

  /* Cap. 11 — il prezzo di una promessa di servizio */

  /* Cap. 16 — soft margin: slack e obiettivo di un classificatore dato */

  /* Cap. 15 — mercato incompleto: intervallo dei prezzi coerenti */

  /* ===================== generatori aggiunti (7 novembre 2026): copertura dettagliata, parte «Strumenti» ===================== */

  /* ===================== generatori aggiunti (7 novembre 2026): parte «Ottimizzazione e machine learning» ===================== */

  var SVM_E = "SVM for binary classification: observations $\\mathbf x_i$ with labels $y_i \\in \\{-1, +1\\}$, hyperplane $\\mathbf w'\\mathbf x + b = 0$. ";
  var SVM_I = "SVM per la classificazione binaria: osservazioni $\\mathbf x_i$ con etichette $y_i \\in \\{-1, +1\\}$, iperpiano $\\mathbf w'\\mathbf x + b = 0$. ";
  function vec(v, L) { return "(" + v.map(function (u) { return m(u, 3, L); }).join("; ") + ")"; }

  /* ===================== generatori aggiunti (7 novembre 2026): parte «Decisioni sotto incertezza» ===================== */

  /* ===================== generatori aggiunti (7 novembre 2026): equilibrio fra capitoli (meno ripetizioni) ===================== */

  /* ===================== generatori aggiunti (7 novembre 2026): parte «Modelli deterministici» ===================== */

  gen({
    id: "nlpm-g-sc-due-rotte", livello: "facile", capitolo: "supplychain",
    link: link("supplychain/#model", "supplychain/#modello"),
    prova: function (rng, L) {
      var D = 10 * ri(rng, 6, 20), u1 = D - 10 * ri(rng, 1, 5);
      var c1 = ri(rng, 1, 5), c2 = c1 + ri(rng, 1, 6);
      var z = c1 * u1 + c2 * (D - u1);
      function o(a, b) { return T(L, "cost ", "costo ") + a + " €, " + T(L, "marginal cost ", "costo marginale ") + b + " €/" + T(L, "unit", "unità"); }
      var testo = T(L,
        "Minimum-cost flow LP of a supply chain: a market demands $D = " + D + "$ units, sent on two routes with flows $x_1, x_2 \\ge 0$ and demand constraint $x_1 + x_2 \\ge D$. Route 1 costs $c_1 = " + c1 + "$ €/unit with capacity $x_1 \\le " + u1 + "$; route 2 costs $c_2 = " + c2 + "$ €/unit with unlimited capacity. What are the optimal cost and the shadow price of the demand constraint (cost of serving one more unit)?",
        "LP di flusso a costo minimo di una supply chain: un mercato chiede $D = " + D + "$ unità, inviate su due rotte con flussi $x_1, x_2 \\ge 0$ e vincolo di domanda $x_1 + x_2 \\ge D$. La rotta 1 costa $c_1 = " + c1 + "$ €/unità con capacità $x_1 \\le " + u1 + "$; la rotta 2 costa $c_2 = " + c2 + "$ €/unità con capacità illimitata. Quanto valgono il costo ottimo e il prezzo ombra del vincolo di domanda (costo di servire un'unità in più)?");
      var sp = T(L,
        "The cheap route is saturated ($x_1 = " + u1 + "$) and the rest goes on route 2: $" + c1 + "\\cdot " + u1 + " + " + c2 + "\\cdot " + (D - u1) + " = " + z + "$ €. The next unit can only travel on route 2: the shadow price of the demand is $" + c2 + "$.",
        "La rotta economica è satura ($x_1 = " + u1 + "$) e il resto va sulla rotta 2: $" + c1 + "\\cdot " + u1 + " + " + c2 + "\\cdot " + (D - u1) + " = " + z + "$ €. L'unità successiva può viaggiare solo sulla rotta 2: il prezzo ombra della domanda è $" + c2 + "$.");
      return chiudi(rng, testo, o(z, c2), [o(z, c1), o(c1 * D, c1), o(z, c2 - c1), o(c2 * D, c2)], sp,
        { D: D, u1: u1, c1: c1, c2: c2 });
    }
  });

  gen({
    id: "nlpm-g-sc-congestione", livello: "media", capitolo: "supplychain",
    link: link("supplychain/#model", "supplychain/#modello"),
    prova: function (rng, L) {
      var c1 = pk(rng, [1, 2, 4, 5]), al = pk(rng, [0.5, 1, 2]), u1 = 10 * ri(rng, 4, 20), c2 = c1 + ri(rng, 1, 8);
      var x1 = (c2 - c1) * u1 / (2 * al * c1);
      if (Math.abs(x1 - Math.round(x1)) > 1e-9 || x1 < 10) return null;
      var D = Math.round(x1) + 10 * ri(rng, 1, 6);
      var xa = Math.min(u1, D), xb = Math.min((c2 - c1) * u1 / (al * c1), D), xc = D / 2;
      if (Math.abs(xb - Math.round(xb)) > 1e-9) return null;
      function o(a) { return "$(\\tilde x_1; \\tilde x_2) = (" + m(a, 1, L) + "; " + m(D - a, 1, L) + ")$"; }
      var testo = T(L,
        "Supply chain with congestion: $D = " + D + "$ units are split between two routes, $x_1 + x_2 = D$, $x_1, x_2 \\ge 0$. Route 1 (unit cost $c_1 = " + c1 + "$, nominal capacity $u_1 = " + u1 + "$, congestion parameter $\\alpha = " + m(al, 1, L) + "$) costs $c_1x_1 + \\alpha c_1x_1^2/u_1$ €; route 2 costs $c_2 = " + c2 + "$ €/unit with ample capacity. Minimizing the total cost, what is the optimal split $(\\tilde x_1; \\tilde x_2)$?",
        "Supply chain con congestione: $D = " + D + "$ unità si ripartiscono su due rotte, $x_1 + x_2 = D$, $x_1, x_2 \\ge 0$. La rotta 1 (costo unitario $c_1 = " + c1 + "$, capacità nominale $u_1 = " + u1 + "$, parametro di congestione $\\alpha = " + m(al, 1, L) + "$) costa $c_1x_1 + \\alpha c_1x_1^2/u_1$ €; la rotta 2 costa $c_2 = " + c2 + "$ €/unità con capacità ampia. Minimizzando il costo totale, qual è la ripartizione ottima $(\\tilde x_1; \\tilde x_2)$?");
      var sp = T(L,
        "At the optimum the marginal costs are equal: $" + c1 + " + 2\\alpha\\," + c1 + "\\,x_1/" + u1 + " = " + c2 + "$, so $x_1 = " + m(x1, 1, L) + "$ and $x_2 = " + m(D - x1, 1, L) + "$. The pure LP would saturate route 1; forgetting the factor 2 of the derivative doubles $x_1$.",
        "All'ottimo i costi marginali sono uguali: $" + c1 + " + 2\\alpha\\," + c1 + "\\,x_1/" + u1 + " = " + c2 + "$, quindi $x_1 = " + m(x1, 1, L) + "$ e $x_2 = " + m(D - x1, 1, L) + "$. L'LP puro saturerebbe la rotta 1; dimenticare il fattore 2 della derivata raddoppia $x_1$.");
      return chiudi(rng, testo, o(x1), [o(xa), o(xb), o(xc)], sp, { D: D, u1: u1, c1: c1, c2: c2, alpha: al });
    }
  });

  gen({
    id: "nlpm-g-mk-minvar", livello: "facile", capitolo: "markowitz",
    link: link("markowitz/#model", "markowitz/#modello"),
    prova: function (rng, L) {
      var s1 = pk(rng, [10, 15, 20, 25, 30, 40]), s2 = pk(rng, [10, 15, 20, 25, 30, 40]);
      if (s1 === s2) return null;
      var v1 = s1 * s1, v2 = s2 * s2;
      function vol(x) { return Math.sqrt(x * x * v1 + (1 - x) * (1 - x) * v2); }
      function o(x) { return "$\\tilde x_1 = " + m(100 * x, 1, L) + "\\%$, $\\sigma_p = " + m(vol(x), 1, L) + "\\%$"; }
      var x = v2 / (v1 + v2);
      var testo = T(L,
        "Markowitz model with two uncorrelated assets of volatilities (standard deviations of the return) $\\sigma_1 = " + s1 + "\\%$ and $\\sigma_2 = " + s2 + "\\%$. The shares $x_1, x_2$ of capital, with $x_1 + x_2 = 1$, minimize the portfolio variance (no return constraint). What are the optimal share $\\tilde x_1$ and the portfolio volatility $\\sigma_p$ (square root of the variance)?",
        "Modello di Markowitz con due titoli non correlati di volatilità (deviazione standard del rendimento) $\\sigma_1 = " + s1 + "\\%$ e $\\sigma_2 = " + s2 + "\\%$. Le quote $x_1, x_2$ del capitale, con $x_1 + x_2 = 1$, minimizzano la varianza del portafoglio (senza vincolo di rendimento). Quanto valgono la quota ottima $\\tilde x_1$ e la volatilità $\\sigma_p$ del portafoglio (radice della varianza)?");
      var sp = T(L,
        "Setting the derivative of $\\sigma_1^2 x_1^2 + \\sigma_2^2 (1 - x_1)^2$ to zero gives $x_1 = \\sigma_2^2/(\\sigma_1^2 + \\sigma_2^2)$: the weights are inversely proportional to the variances (not to the volatilities). The volatility is below that of both assets.",
        "Annullando la derivata di $\\sigma_1^2 x_1^2 + \\sigma_2^2 (1 - x_1)^2$ si ottiene $x_1 = \\sigma_2^2/(\\sigma_1^2 + \\sigma_2^2)$: i pesi sono inversamente proporzionali alle varianze (non alle volatilità). La volatilità è minore di quella di entrambi i titoli.");
      return chiudi(rng, testo, o(x), [o(s2 / (s1 + s2)), o(v1 / (v1 + v2)), o(0.5)], sp, { s1: s1, s2: s2 });
    }
  });

  gen({
    id: "nlpm-g-mk-portafoglio", livello: "facile", capitolo: "markowitz",
    link: link("markowitz/#model", "markowitz/#modello"),
    prova: function (rng, L) {
      var x1 = ri(rng, 2, 8) / 10, x2 = 1 - x1;
      var s1 = pk(rng, [0.1, 0.15, 0.2, 0.25, 0.3]), s2 = pk(rng, [0.1, 0.15, 0.2, 0.25, 0.3]);
      var rho = pk(rng, [-0.5, -0.25, 0.25, 0.5, 0.75]);
      var mu1 = ri(rng, 4, 14), mu2 = ri(rng, 4, 14);
      var mu = x1 * mu1 + x2 * mu2;
      var base = x1 * x1 * s1 * s1 + x2 * x2 * s2 * s2, cov = x1 * x2 * rho * s1 * s2;
      function o(v) { return T(L, "expected return ", "rendimento atteso ") + f(mu, 2, L) + "%, " + T(L, "variance ", "varianza ") + f(v, 4, L); }
      var testo = T(L,
        "Markowitz model, portfolio of two assets with shares of capital $x_1 = " + m(x1, 1, L) + "$, $x_2 = " + m(x2, 1, L) + "$; expected returns $\\mu_1 = " + mu1 + "\\%$, $\\mu_2 = " + mu2 + "\\%$; volatilities $\\sigma_1 = " + m(s1, 2, L) + "$, $\\sigma_2 = " + m(s2, 2, L) + "$; correlation $\\rho = " + m(rho, 2, L) + "$, so $q_{ii} = \\sigma_i^2$ and $q_{12} = q_{21} = \\rho\\sigma_1\\sigma_2$. What are its expected return and its variance $\\sum_{i}\\sum_{j} q_{ij} x_i x_j$?",
        "Modello di Markowitz, portafoglio di due titoli con quote del capitale $x_1 = " + m(x1, 1, L) + "$, $x_2 = " + m(x2, 1, L) + "$; rendimenti attesi $\\mu_1 = " + mu1 + "\\%$, $\\mu_2 = " + mu2 + "\\%$; volatilità $\\sigma_1 = " + m(s1, 2, L) + "$, $\\sigma_2 = " + m(s2, 2, L) + "$; correlazione $\\rho = " + m(rho, 2, L) + "$, quindi $q_{ii} = \\sigma_i^2$ e $q_{12} = q_{21} = \\rho\\sigma_1\\sigma_2$. Quanto valgono il rendimento atteso e la varianza $\\sum_{i}\\sum_{j} q_{ij} x_i x_j$?");
      var sp = T(L,
        "The return is linear, $\\mu_1 x_1 + \\mu_2 x_2$. The variance has three terms: $x_1^2\\sigma_1^2 + x_2^2\\sigma_2^2 + 2x_1x_2\\rho\\sigma_1\\sigma_2$; the covariance appears twice ($q_{12}$ and $q_{21}$).",
        "Il rendimento è lineare, $\\mu_1 x_1 + \\mu_2 x_2$. La varianza ha tre termini: $x_1^2\\sigma_1^2 + x_2^2\\sigma_2^2 + 2x_1x_2\\rho\\sigma_1\\sigma_2$; la covarianza compare due volte ($q_{12}$ e $q_{21}$).");
      return chiudi(rng, testo, o(base + 2 * cov), [o(base), o(base + cov), o(x1 * s1 * s1 + x2 * s2 * s2), o(base - 2 * cov)], sp,
        { x1: x1, s1: s1, s2: s2, rho: rho, mu1: mu1, mu2: mu2 });
    }
  });

  gen({
    id: "nlpm-g-mk-correlati", livello: "media", capitolo: "markowitz",
    link: link("markowitz/#model", "markowitz/#modello"),
    prova: function (rng, L) {
      var s1 = pk(rng, [0.1, 0.15, 0.2, 0.25, 0.3, 0.4]), s2 = pk(rng, [0.1, 0.15, 0.2, 0.25, 0.3, 0.4]);
      if (s1 === s2) return null;
      var rho = pk(rng, [-0.5, -0.25, 0.25, 0.5]);
      var c = rho * s1 * s2, v1 = s1 * s1, v2 = s2 * s2;
      var x = (v2 - c) / (v1 + v2 - 2 * c);
      if (x <= 0.02 || x >= 0.98) return null;
      function vr(y) { return y * y * v1 + (1 - y) * (1 - y) * v2 + 2 * y * (1 - y) * c; }
      function o(y) { return "$\\tilde x_1 = " + m(100 * y, 1, L) + "\\%$, $\\sigma_p^2 = " + m(vr(y), 4, L) + "$"; }
      var xs = (v2 + c) / (v1 + v2 + 2 * c);
      var testo = T(L,
        "Markowitz model with two assets of volatilities (standard deviations of the return) $\\sigma_1 = " + m(s1, 2, L) + "$, $\\sigma_2 = " + m(s2, 2, L) + "$ and correlation $\\rho = " + m(rho, 2, L) + "$. The shares $x_1 + x_2 = 1$ minimize the portfolio variance $\\sum_i\\sum_j q_{ij}x_ix_j$, with covariance $q_{12} = \\rho\\sigma_1\\sigma_2$ (no return constraint; the optimum has $x_1, x_2 > 0$). What are $\\tilde x_1$ and the minimum variance $\\sigma_p^2$?",
        "Modello di Markowitz con due titoli di volatilità (deviazione standard del rendimento) $\\sigma_1 = " + m(s1, 2, L) + "$, $\\sigma_2 = " + m(s2, 2, L) + "$ e correlazione $\\rho = " + m(rho, 2, L) + "$. Le quote $x_1 + x_2 = 1$ minimizzano la varianza del portafoglio $\\sum_i\\sum_j q_{ij}x_ix_j$, con covarianza $q_{12} = \\rho\\sigma_1\\sigma_2$ (senza vincolo di rendimento; all\'ottimo $x_1, x_2 > 0$). Quanto valgono $\\tilde x_1$ e la varianza minima $\\sigma_p^2$?");
      var sp = T(L,
        "With correlation $x_1 = (\\sigma_2^2 - \\rho\\sigma_1\\sigma_2)/(\\sigma_1^2 + \\sigma_2^2 - 2\\rho\\sigma_1\\sigma_2) = " + m(x, 4, L) + "$; the variance is $x_1^2\\sigma_1^2 + x_2^2\\sigma_2^2 + 2x_1x_2\\rho\\sigma_1\\sigma_2$ at that weight. Ignoring $\\rho$ or flipping its sign gives the wrong weight.",
        "Con la correlazione $x_1 = (\\sigma_2^2 - \\rho\\sigma_1\\sigma_2)/(\\sigma_1^2 + \\sigma_2^2 - 2\\rho\\sigma_1\\sigma_2) = " + m(x, 4, L) + "$; la varianza è $x_1^2\\sigma_1^2 + x_2^2\\sigma_2^2 + 2x_1x_2\\rho\\sigma_1\\sigma_2$ in quel peso. Ignorare $\\rho$ o sbagliarne il segno dà il peso sbagliato.");
      var cand = [v2 / (v1 + v2), xs, 1 - x, 0.5].filter(function (y) { return y >= 0 && y <= 1; }).map(o);
      return chiudi(rng, testo, o(x), cand, sp, { s1: s1, s2: s2, rho: rho });
    }
  });

  gen({
    id: "nlpm-g-pricing-ottimo", livello: "facile", capitolo: "pricing",
    link: link("pricing/#model", "pricing/#modello"),
    prova: function (rng, L) {
      var I = istanzaPricing(rng, false); if (!I) return null;
      function o(p) { return "$p^* = " + m(p, 2, L) + "$ €, " + T(L, "profit ", "profitto ") + f(profitto(I, p), 2, L) + " €"; }
      var testo = T(L,
        "Pricing model: choose the price $p$ and the quantity sold $q$ to maximize the profit $(p - c)\\,q$ subject to $q \\le d(p) = " + I.a + " - " + I.b + "p$ (demand) and $q \\le k$ (capacity), with marginal cost $c = " + I.c + "$ € and $k = " + I.k + "$. What are the optimal price $p^*$ and the optimal profit?",
        "Modello di pricing: si scelgono il prezzo $p$ e la quantità venduta $q$ per massimizzare il profitto $(p - c)\\,q$ soggetto a $q \\le d(p) = " + I.a + " - " + I.b + "p$ (domanda) e $q \\le k$ (capacità), con costo marginale $c = " + I.c + "$ € e $k = " + I.k + "$. Quanto valgono il prezzo ottimo $p^*$ e il profitto ottimo?");
      var sp = I.attivo ? T(L,
        "Without capacity $p^\\circ = (a/b + c)/2 = " + m(I.p0, 2, L) + "$ with $q^\\circ = " + I.q0 + " > k$: capacity bites, and the price that sells exactly $k$ is $p^* = (a - k)/b = " + m(I.ps, 2, L) + "$.",
        "Senza capacità $p^\\circ = (a/b + c)/2 = " + m(I.p0, 2, L) + "$ con $q^\\circ = " + I.q0 + " > k$: la capacità morde, e il prezzo che vende esattamente $k$ è $p^* = (a - k)/b = " + m(I.ps, 2, L) + "$.") : T(L,
        "Without capacity $p^\\circ = (a/b + c)/2 = " + m(I.p0, 2, L) + "$ with $q^\\circ = " + I.q0 + " \\le k$: the capacity constraint is inactive and $p^* = p^\\circ$.",
        "Senza capacità $p^\\circ = (a/b + c)/2 = " + m(I.p0, 2, L) + "$ con $q^\\circ = " + I.q0 + " \\le k$: il vincolo di capacità non è attivo e $p^* = p^\\circ$.");
      var cand = I.attivo ? [I.p0, I.A / 2, I.ps - I.c / 2, I.A - I.c / 2] : [(I.a - I.k) / I.b, I.A / 2, I.A - I.c / 2, I.p0 + 5];
      var sb = [];
      for (var i = 0; i < cand.length; i++) if (cand[i] > I.c) sb.push(o(cand[i]));
      return chiudi(rng, testo, o(I.ps), sb, sp, { a: I.a, b: I.b, c: I.c, k: I.k });
    }
  });

  gen({
    id: "nlpm-g-pricing-posto", livello: "media", capitolo: "pricing",
    link: link("pricing/#model", "pricing/#modello"),
    prova: function (rng, L) {
      var I = istanzaPricing(rng, true); if (!I) return null;
      var v = I.ps - I.c - I.k / I.b;
      function o(x) { return f(x, 2, L) + " €"; }
      var testo = T(L,
        "Pricing model: choose the price $p$ and the quantity sold $q$ to maximize $(p - c)\\,q$ subject to $q \\le d(p) = " + I.a + " - " + I.b + "p$ and $q \\le k$, with $c = " + I.c + "$ € and $k = " + I.k + "$; the capacity constraint is active at the optimum. Let $\\Pi(k)$ be the optimal profit as a function of the capacity. What is $d\\Pi/dk$, the value of one more unit of capacity?",
        "Modello di pricing: si scelgono il prezzo $p$ e la quantità venduta $q$ per massimizzare $(p - c)\\,q$ soggetto a $q \\le d(p) = " + I.a + " - " + I.b + "p$ e $q \\le k$, con $c = " + I.c + "$ € e $k = " + I.k + "$; all'ottimo il vincolo di capacità è attivo. Sia $\\Pi(k)$ il profitto ottimo in funzione della capacità. Quanto vale $d\\Pi/dk$, il valore di un'unità di capacità in più?");
      var sp = T(L,
        "With $p^* = (a - k)/b = " + m(I.ps, 2, L) + "$ the profit is $(p^* - c)\\,k$, and $dp^*/dk = -1/b$: $d\\Pi/dk = (p^* - c) - k/b = " + m(v, 2, L) + "$. The full margin $p^* - c$ forgets that, to fill the extra seat, the price falls for everybody.",
        "Con $p^* = (a - k)/b = " + m(I.ps, 2, L) + "$ il profitto è $(p^* - c)\\,k$, e $dp^*/dk = -1/b$: $d\\Pi/dk = (p^* - c) - k/b = " + m(v, 2, L) + "$. Il margine pieno $p^* - c$ dimentica che, per riempire il posto in più, il prezzo scende per tutti.");
      return chiudi(rng, testo, o(v), [o(I.ps - I.c), o(I.ps - I.c - 2 * I.k / I.b), o(I.ps - I.k / I.b), o(I.ps)], sp,
        { a: I.a, b: I.b, c: I.c, k: I.k });
    }
  });

  gen({
    id: "nlpm-g-budget-due-canali", livello: "media", capitolo: "budget",
    link: link("budget/#model", "budget/#modello"),
    prova: function (rng, L) {
      var k1 = pk(rng, [0.1, 0.2, 0.25, 0.5]), k2 = pk(rng, [0.1, 0.2, 0.25, 0.5]);
      var a1 = 10 * ri(rng, 2, 20), a2 = 10 * ri(rng, 2, 20), B = 10 * ri(rng, 2, 10);
      var x1 = (a1 * k1 * (1 + k2 * B) - a2 * k2) / (k1 * k2 * (a1 + a2));
      if (x1 < 2 || x1 > B - 2) return null;
      function lam1(x) { return a1 * k1 / (1 + k1 * x); }
      if (quasiMezzo(x1, 1) || quasiMezzo(lam1(x1), 2)) return null;
      function o(x, l) { return "$\\tilde x_1 = " + m(x, 1, L) + "$, $\\tilde x_2 = " + m(B - x, 1, L) + "$, $\\lambda = " + m(l, 2, L) + "$"; }
      var xp = B * a1 * k1 / (a1 * k1 + a2 * k2);
      var testo = T(L,
        "Advertising budget: the spends $x_1, x_2 \\ge 0$ (thousands of €) on two channels maximize $r_1(x_1) + r_2(x_2)$ with $r_1(x) = " + a1 + "\\log(1 + " + m(k1, 2, L) + "x)$, $r_2(x) = " + a2 + "\\log(1 + " + m(k2, 2, L) + "x)$ (natural logarithm), subject to $x_1 + x_2 \\le b = " + B + "$, no caps. What are the optimal allocation and the multiplier $\\lambda$ of the budget constraint (extra response per extra thousand €)?",
        "Budget pubblicitario: le spese $x_1, x_2 \\ge 0$ (migliaia di €) su due canali massimizzano $r_1(x_1) + r_2(x_2)$ con $r_1(x) = " + a1 + "\\log(1 + " + m(k1, 2, L) + "x)$, $r_2(x) = " + a2 + "\\log(1 + " + m(k2, 2, L) + "x)$ (logaritmo naturale), soggetto a $x_1 + x_2 \\le b = " + B + "$, senza tetti. Quanto valgono l'allocazione ottima e il moltiplicatore $\\lambda$ del vincolo di budget (risposta in più per mille € in più)?");
      var sp = T(L,
        "At the optimum the marginal returns are equal: $" + m(a1 * k1, 2, L) + "/(1 + " + m(k1, 2, L) + "x_1) = " + m(a2 * k2, 2, L) + "/(1 + " + m(k2, 2, L) + "x_2)$ with $x_1 + x_2 = " + B + "$, so $x_1 = " + m(x1, 1, L) + "$; $\\lambda$ is the common marginal return, $" + m(lam1(x1), 2, L) + "$. Splitting in proportion to $a_i k_i$ ignores the saturation.",
        "All'ottimo i rendimenti marginali sono uguali: $" + m(a1 * k1, 2, L) + "/(1 + " + m(k1, 2, L) + "x_1) = " + m(a2 * k2, 2, L) + "/(1 + " + m(k2, 2, L) + "x_2)$ con $x_1 + x_2 = " + B + "$, quindi $x_1 = " + m(x1, 1, L) + "$; $\\lambda$ è il rendimento marginale comune, $" + m(lam1(x1), 2, L) + "$. Ripartire in proporzione ad $a_i k_i$ ignora la saturazione.");
      return chiudi(rng, testo, o(x1, lam1(x1)), [o(xp, lam1(xp)), o(B / 2, lam1(B / 2)), o(B, lam1(B)), o(0, a1 * k1)], sp,
        { a1: a1, a2: a2, k1: k1, k2: k2, B: B });
    }
  });

  gen({
    id: "nlpm-g-loc-weber-1d", livello: "facile", capitolo: "location",
    link: link("location/#model", "localizzazione/#modello"),
    prova: function (rng, L) {
      var n = pk(rng, [3, 5]), xs = [];
      while (xs.length < n) { var v = ri(rng, 0, 20); if (xs.indexOf(v) < 0) xs.push(v); }
      xs = sortNum(xs);
      var w = [], W = 0;
      for (var i = 0; i < n; i++) { w.push(ri(rng, 1, 5)); W += w[i]; }
      var cum = 0, med = null;
      for (i = 0; i < n; i++) {
        if (2 * (cum + w[i]) === W) return null;
        if (med === null && 2 * (cum + w[i]) > W) med = xs[i];
        cum += w[i];
      }
      var umed = xs[(n - 1) / 2];
      if (umed === med) return null;
      var cen = 0; for (i = 0; i < n; i++) cen += w[i] * xs[i]; cen /= W;
      var mm = (xs[0] + xs[n - 1]) / 2;
      function o(x) { return "$x^* = " + m(x, 1, L) + "$ km"; }
      var pts = [];
      for (i = 0; i < n; i++) pts.push(T(L, "km ", "km ") + xs[i] + " (" + T(L, "weight ", "peso ") + w[i] + ")");
      var testo = T(L,
        "Location on a straight road: customers at positions $a_i$ with weights $w_i$: " + pts.join(", ") + ". A facility at position $x$ (km) minimizes the weighted total distance $\\sum_i w_i |x - a_i|$ (Weber model on a line). Where is the optimal position $x^*$?",
        "Localizzazione su una strada rettilinea: clienti nelle posizioni $a_i$ con pesi $w_i$: " + pts.join(", ") + ". Una struttura nella posizione $x$ (km) minimizza la distanza totale pesata $\\sum_i w_i |x - a_i|$ (modello di Weber su una retta). Dov'è la posizione ottima $x^*$?");
      var sp = T(L,
        "In one dimension Weber is the weighted median: the point that leaves at least half of the total weight ($" + W + "/2$) on each side, here km $" + med + "$. The centroid ($" + m(cen, 1, L) + "$) is the optimum of the squared distances, the midpoint of the extremes ($" + m(mm, 1, L) + "$) that of the minimax.",
        "In una dimensione Weber è la mediana pesata: il punto che lascia almeno metà del peso totale ($" + W + "/2$) da ciascun lato, qui il km $" + med + "$. Il baricentro ($" + m(cen, 1, L) + "$) è l'ottimo delle distanze al quadrato, il punto medio degli estremi ($" + m(mm, 1, L) + "$) quello del minimax.");
      return chiudi(rng, testo, o(med), [o(cen), o(mm), o(umed)], sp, { a: xs, w: w });
    }
  });

  gen({
    id: "nlpm-g-code-ottimo", livello: "facile", capitolo: "queues",
    link: link("queues/#model", "code/#modello"),
    prova: function (rng, L) {
      var s = ri(rng, 2, 8), lam = ri(rng, 4, 40), c = ri(rng, 1, 5);
      var h = s * s * c / lam;
      if (Math.abs(2 * h - Math.round(2 * h)) > 1e-9 || h < 0.5 || h > 20) return null;
      function C(mu) { return c * mu + h * lam / (mu - lam); }
      function o(mu) { return "$\\mu^* = " + m(mu, 2, L) + "$, $C = " + m(C(mu), 2, L) + "$ €/h"; }
      var testo = T(L,
        "Capacity of an M/M/1 queue: arrival rate $\\lambda = " + lam + "$ customers/hour; the service rate $\\mu > \\lambda$ (capacity) minimizes $C(\\mu) = c\\,\\mu + h\\,\\lambda/(\\mu - \\lambda)$, where $c = " + c + "$ €/h per unit of $\\mu$, $h = " + m(h, 1, L) + "$ € per hour a customer spends in the system and $\\lambda/(\\mu - \\lambda)$ is the mean number of customers in the system. What are $\\mu^*$ and $C(\\mu^*)$?",
        "Capacità di una coda M/M/1: tasso di arrivo $\\lambda = " + lam + "$ clienti/ora; il tasso di servizio $\\mu > \\lambda$ (capacità) minimizza $C(\\mu) = c\\,\\mu + h\\,\\lambda/(\\mu - \\lambda)$, dove $c = " + c + "$ €/h per unità di $\\mu$, $h = " + m(h, 1, L) + "$ € per ora passata da un cliente nel sistema e $\\lambda/(\\mu - \\lambda)$ è il numero medio di clienti nel sistema. Quanto valgono $\\mu^*$ e $C(\\mu^*)$?");
      var sp = T(L,
        "From $c - h\\lambda/(\\mu - \\lambda)^2 = 0$: $\\mu^* = \\lambda + \\sqrt{h\\lambda/c} = " + lam + " + " + s + " = " + (lam + s) + "$, with cost $" + c + "\\cdot " + (lam + s) + " + " + m(h, 1, L) + "\\cdot " + lam + "/" + s + " = " + m(C(lam + s), 2, L) + "$.",
        "Da $c - h\\lambda/(\\mu - \\lambda)^2 = 0$: $\\mu^* = \\lambda + \\sqrt{h\\lambda/c} = " + lam + " + " + s + " = " + (lam + s) + "$, con costo $" + c + "\\cdot " + (lam + s) + " + " + m(h, 1, L) + "\\cdot " + lam + "/" + s + " = " + m(C(lam + s), 2, L) + "$.");
      return chiudi(rng, testo, o(lam + s), [o(lam + h * lam / c), o(lam + Math.sqrt(h / c)), o(lam + 1), o(lam + s / 2)], sp,
        { lam: lam, c: c, h: h });
    }
  });

  gen({
    id: "nlpm-g-code-misure", livello: "facile", capitolo: "queues",
    link: link("queues/#model", "code/#modello"),
    prova: function (rng, L) {
      var lam = ri(rng, 2, 30), mu = lam + ri(rng, 1, 10);
      function o(r, w, l) { return "$\\rho = " + m(r, 1, L) + "\\%$, $w = " + m(w, 1, L) + "$ min, $l = " + m(l, 2, L) + "$"; }
      var rho = 100 * lam / mu, w = 60 / (mu - lam), l = lam / (mu - lam);
      var testo = T(L,
        "M/M/1 queue (Poisson arrivals, exponential service, one server) with arrival rate $\\lambda = " + lam + "$ per hour and service rate $\\mu = " + mu + "$ per hour. What are the utilization $\\rho$, the mean time in the system $w$ and the mean number of customers in the system $l$?",
        "Coda M/M/1 (arrivi di Poisson, servizio esponenziale, un servente) con tasso di arrivo $\\lambda = " + lam + "$ all'ora e tasso di servizio $\\mu = " + mu + "$ all'ora. Quanto valgono l'utilizzo $\\rho$, il tempo medio nel sistema $w$ e il numero medio di clienti nel sistema $l$?");
      var sp = T(L,
        "$\\rho = \\lambda/\\mu$, $w = 1/(\\mu - \\lambda)$ hours $= " + m(w, 1, L) + "$ minutes and, by Little's law, $l = \\lambda\\, w = \\lambda/(\\mu - \\lambda) = " + m(l, 2, L) + "$. $1/\\mu$ is only the mean service time.",
        "$\\rho = \\lambda/\\mu$, $w = 1/(\\mu - \\lambda)$ ore $= " + m(w, 1, L) + "$ minuti e, per la legge di Little, $l = \\lambda\\, w = \\lambda/(\\mu - \\lambda) = " + m(l, 2, L) + "$. $1/\\mu$ è solo il tempo medio di servizio.");
      return chiudi(rng, testo, o(rho, w, l), [o(rho, 60 / mu, lam / mu), o(rho, 60 * lam / (mu - lam), 1 / (mu - lam)), o(rho, w, mu / (mu - lam))], sp,
        { lam: lam, mu: mu });
    }
  });

  gen({
    id: "nlpm-g-svm-due-punti", livello: "facile", capitolo: "svm",
    link: link("svm/#hard-margin", "svm/#hard-margin"),
    prova: function (rng, L) {
      var a = ri(rng, 0, 4), b = ri(rng, 0, 4);
      if (a === 0 && b === 0) return null;
      var n2 = a * a + b * b, nr = Math.sqrt(n2);
      function o(w1, w2, mg) { return "$\\mathbf w = (" + m(w1, 3, L) + "; " + m(w2, 3, L) + ")$, " + T(L, "margin ", "margine ") + "$" + m(mg, 3, L) + "$"; }
      var testo = T(L,
        "Hard-margin SVM: $\\min \\tfrac12\\|\\mathbf w\\|^2$ subject to $y_i(\\mathbf w'\\mathbf x_i + b) \\ge 1$, with $\\mathbf w \\in \\mathbb R^2$ and $b$ free. Two observations: $\\mathbf x_1 = (0; 0)$ with label $y_1 = -1$ and $\\mathbf x_2 = (" + a + "; " + b + ")$ with label $y_2 = +1$. What are the optimal $\\tilde{\\mathbf w}$ and the margin $2/\\|\\tilde{\\mathbf w}\\|$?",
        "SVM hard margin: $\\min \\tfrac12\\|\\mathbf w\\|^2$ soggetto a $y_i(\\mathbf w'\\mathbf x_i + b) \\ge 1$, con $\\mathbf w \\in \\mathbb R^2$ e $b$ libero. Due osservazioni: $\\mathbf x_1 = (0; 0)$ con etichetta $y_1 = -1$ e $\\mathbf x_2 = (" + a + "; " + b + ")$ con etichetta $y_2 = +1$. Quanto valgono il $\\tilde{\\mathbf w}$ ottimo e il margine $2/\\|\\tilde{\\mathbf w}\\|$?");
      var sp = T(L,
        "Both constraints are active: $b = -1$ and $\\mathbf w'\\mathbf x_2 + b = 1$; the minimum-norm $\\mathbf w$ is parallel to $\\mathbf x_2$, $\\mathbf w = 2\\mathbf x_2/\\|\\mathbf x_2\\|^2$. The margin $2/\\|\\mathbf w\\| = \\|\\mathbf x_2\\| = " + m(nr, 3, L) + "$ is the distance between the two points.",
        "Entrambi i vincoli sono attivi: $b = -1$ e $\\mathbf w'\\mathbf x_2 + b = 1$; il $\\mathbf w$ di norma minima è parallelo a $\\mathbf x_2$, $\\mathbf w = 2\\mathbf x_2/\\|\\mathbf x_2\\|^2$. Il margine $2/\\|\\mathbf w\\| = \\|\\mathbf x_2\\| = " + m(nr, 3, L) + "$ è la distanza fra i due punti.");
      return chiudi(rng, testo, o(2 * a / n2, 2 * b / n2, nr),
        [o(a / n2, b / n2, 2 * nr), o(a, b, 2 / nr), o(2 * a / n2, 2 * b / n2, nr / 2)], sp, { x2: [a, b] });
    }
  });

  gen({
    id: "nlpm-g-budget-tetto", livello: "complessa", capitolo: "budget",
    link: link("budget/#results-and-verification-of-the-kkt-conditions", "budget/#risultati-e-verifica-delle-kkt"),
    prova: function (rng, L) {
      var k1 = pk(rng, [0.1, 0.2, 0.25, 0.5]), k2 = pk(rng, [0.1, 0.2, 0.25, 0.5]);
      var a1 = 10 * ri(rng, 2, 20), a2 = 10 * ri(rng, 2, 20), B = 10 * ri(rng, 3, 10);
      var xu = (a1 * k1 * (1 + k2 * B) - a2 * k2) / (k1 * k2 * (a1 + a2));
      if (xu < 6 || xu > B - 1) return null;
      var u1 = ri(rng, 2, Math.floor(xu) - 2);
      var x2 = B - u1;
      function d1(x) { return a1 * k1 / (1 + k1 * x); }
      function d2(x) { return a2 * k2 / (1 + k2 * x); }
      var lam = d2(x2), mu = d1(u1) - lam;
      if (mu < 0.05) return null;
      var vals = [lam, mu, d1(u1), d1(xu), d2(B - xu), lam - mu];
      for (var i = 0; i < vals.length; i++) if (quasiMezzo(vals[i], 2)) return null;
      if (quasiMezzo(xu, 2)) return null;
      function o(x, l, mm) {
        return "$\\tilde x_1 = " + m(x, 2, L) + "$, $\\tilde x_2 = " + m(B - x, 2, L) + "$, $\\lambda = " + m(l, 2, L) + "$, $\\mu_1 = " + m(mm, 2, L) + "$";
      }
      var testo = T(L,
        "Advertising budget: the spends $x_1, x_2 \\ge 0$ (thousands of €) maximize $r_1(x_1) + r_2(x_2)$, with $r_1(x) = " + a1 + "\\log(1 + " + m(k1, 2, L) + "x)$ and $r_2(x) = " + a2 + "\\log(1 + " + m(k2, 2, L) + "x)$ (natural logarithm), subject to $x_1 + x_2 \\le b = " + B + "$ (multiplier $\\lambda$) and the cap $x_1 \\le u_1 = " + u1 + "$ (multiplier $\\mu_1$). KKT: $r_i'(\\tilde x_i) = \\lambda + \\mu_i$, with $\\mu_2 = 0$. What are the optimal allocation, $\\lambda$ and $\\mu_1$?",
        "Budget pubblicitario: le spese $x_1, x_2 \\ge 0$ (migliaia di €) massimizzano $r_1(x_1) + r_2(x_2)$, con $r_1(x) = " + a1 + "\\log(1 + " + m(k1, 2, L) + "x)$ e $r_2(x) = " + a2 + "\\log(1 + " + m(k2, 2, L) + "x)$ (logaritmo naturale), soggetto a $x_1 + x_2 \\le b = " + B + "$ (moltiplicatore $\\lambda$) e al tetto $x_1 \\le u_1 = " + u1 + "$ (moltiplicatore $\\mu_1$). KKT: $r_i'(\\tilde x_i) = \\lambda + \\mu_i$, con $\\mu_2 = 0$. Quanto valgono l'allocazione ottima, $\\lambda$ e $\\mu_1$?");
      var sp = T(L,
        "Without the cap the marginal returns would be equal at $x_1 = " + m(xu, 2, L) + " > u_1$: the cap binds, $\\tilde x_1 = " + u1 + "$ and $\\tilde x_2 = " + x2 + "$. Channel 2 is interior, so $\\lambda = r_2'(" + x2 + ") = " + m(a2 * k2, 2, L) + "/(1 + " + m(k2, 2, L) + "\\cdot " + x2 + ") = " + m(lam, 2, L) + "$; channel 1 gives $\\mu_1 = r_1'(" + u1 + ") - \\lambda = " + m(d1(u1), 2, L) + " - " + m(lam, 2, L) + " = " + m(mu, 2, L) + "$, the value of one more thousand € of cap.",
        "Senza tetto i rendimenti marginali sarebbero uguali in $x_1 = " + m(xu, 2, L) + " > u_1$: il tetto è attivo, $\\tilde x_1 = " + u1 + "$ e $\\tilde x_2 = " + x2 + "$. Il canale 2 è interno, quindi $\\lambda = r_2'(" + x2 + ") = " + m(a2 * k2, 2, L) + "/(1 + " + m(k2, 2, L) + "\\cdot " + x2 + ") = " + m(lam, 2, L) + "$; il canale 1 dà $\\mu_1 = r_1'(" + u1 + ") - \\lambda = " + m(d1(u1), 2, L) + " - " + m(lam, 2, L) + " = " + m(mu, 2, L) + "$, il valore di mille € di tetto in più.");
      return chiudi(rng, testo, o(u1, lam, mu),
        [o(xu, d2(B - xu), 0), o(u1, d1(u1), 0), o(u1, lam, d1(u1)), o(u1, lam, -mu)], sp,
        { a1: a1, a2: a2, k1: k1, k2: k2, B: B, u1: u1 });
    }
  });

  gen({
    id: "nlpm-g-loc-minimax-2d", livello: "media", capitolo: "location",
    link: link("location/#model", "localizzazione/#modello"),
    prova: function (rng, L) {
      var P = [];
      while (P.length < 3) {
        var p = [ri(rng, 0, 10), ri(rng, 0, 10)], nuovo = true;
        for (var t = 0; t < P.length; t++) if (P[t][0] === p[0] && P[t][1] === p[1]) nuovo = false;
        if (nuovo) P.push(p);
      }
      var area = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1]);
      if (Math.abs(area) < 6) return null;
      var R = cerchio3(P), opt = R.opt;
      if (opt.tipo === "lato" && Math.abs(opt.dk) < 0.05) return null;       // quasi retto: due risposte vicine
      function d(q, s) { return Math.hypot(q[0] - s[0], q[1] - s[1]); }
      function maxd(c) { return Math.max(d(c, P[0]), d(c, P[1]), d(c, P[2])); }
      var G = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];
      var xs = [P[0][0], P[1][0], P[2][0]], ys = [P[0][1], P[1][1], P[2][1]];
      var BB = [(Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2];
      // lato più lungo
      var li = 0, lj = 1, lmax = d(P[0], P[1]);
      if (d(P[0], P[2]) > lmax) { li = 0; lj = 2; lmax = d(P[0], P[2]); }
      if (d(P[1], P[2]) > lmax) { li = 1; lj = 2; lmax = d(P[1], P[2]); }
      var Ml = [(P[li][0] + P[lj][0]) / 2, (P[li][1] + P[lj][1]) / 2];
      var vals = [opt.c[0], opt.c[1], opt.r, G[0], G[1], maxd(G), BB[0], BB[1], maxd(BB), R.circ.c[0], R.circ.c[1], R.circ.r, lmax / 2];
      for (var i = 0; i < vals.length; i++) if (quasiMezzo(vals[i], 2)) return null;
      function o(c, z) { return "$(x^*; y^*) = (" + m(c[0], 2, L) + "; " + m(c[1], 2, L) + ")$, $z^* = " + m(z, 2, L) + "$"; }
      var pts = P.map(function (q) { return "$(" + q[0] + "; " + q[1] + ")$"; }).join(", ");
      var testo = T(L,
        "Minimax location in the plane: three districts at " + pts + " (km). The facility at $(x, y)$ minimizes $z$, the largest Euclidean distance from it to a district (no weights). What are the optimal point $(x^*; y^*)$ and the optimal value $z^*$?",
        "Localizzazione minimax nel piano: tre quartieri in " + pts + " (km). La struttura in $(x, y)$ minimizza $z$, la massima distanza euclidea da essa a un quartiere (senza pesi). Quanto valgono il punto ottimo $(x^*; y^*)$ e il valore ottimo $z^*$?");
      var sp = opt.tipo === "lato" ? T(L,
        "The optimum is the centre of the smallest circle containing the three points. The triangle is obtuse: the circle having the longest side as diameter already contains the third point, so the centre is the midpoint of that side and $z^*$ is half its length, $" + m(opt.r, 2, L) + "$. The circle through all three points would be larger.",
        "L'ottimo è il centro del più piccolo cerchio che contiene i tre punti. Il triangolo è ottusangolo: il cerchio che ha per diametro il lato più lungo contiene già il terzo punto, quindi il centro è il punto medio di quel lato e $z^*$ è metà della sua lunghezza, $" + m(opt.r, 2, L) + "$. Il cerchio per i tre punti sarebbe più grande.") : T(L,
        "The optimum is the centre of the smallest circle containing the three points. The triangle is acute: no circle built on one side contains the third point, so the optimum is the circumcentre, equidistant from the three districts, with $z^* = " + m(opt.r, 2, L) + "$. The centroid ignores the extreme districts.",
        "L'ottimo è il centro del più piccolo cerchio che contiene i tre punti. Il triangolo è acutangolo: nessun cerchio costruito su un lato contiene il terzo punto, quindi l'ottimo è il circocentro, equidistante dai tre quartieri, con $z^* = " + m(opt.r, 2, L) + "$. Il baricentro ignora i quartieri estremi.");
      var cand = [o(G, maxd(G)), opt.tipo === "lato" ? o(R.circ.c, R.circ.r) : o(Ml, lmax / 2), o(BB, maxd(BB))];
      return chiudi(rng, testo, o(opt.c, opt.r), cand, sp, { P: P });
    }
  });

  gen({
    id: "nlpm-g-code-promessa", livello: "media", capitolo: "queues",
    link: link("queues/#the-price-of-a-service-promise", "code/#il-prezzo-di-una-promessa-di-servizio"),
    prova: function (rng, L) {
      var s = ri(rng, 2, 8), lam = ri(rng, 4, 40), c = ri(rng, 1, 5);
      var h = s * s * c / lam;
      if (Math.abs(2 * h - Math.round(2 * h)) > 1e-9 || h < 0.5 || h > 20) return null;
      var w = pk(rng, [2, 3, 4, 5, 6, 10, 12, 15, 20, 30]), g = 60 / w;
      if (g <= s + 0.5) return null;
      function C(mu) { return c * mu + h * lam / (mu - lam); }
      var mu = lam + g;
      function o(x, z) { return "$\\mu = " + m(x, 2, L) + "$, $C = " + m(z, 2, L) + "$ €/h"; }
      var cand = [o(lam + s, C(lam + s)), o(lam + w, C(lam + w)), o(mu, c * mu + h * w / 60)];
      if (g > lam + 0.5) cand.push(o(g, C(g)));
      cand.push(o(lam + 1 / w, C(lam + 1 / w)));
      var testo = T(L,
        "Capacity of an M/M/1 queue: arrival rate $\\lambda = " + lam + "$ customers/hour; the service rate $\\mu > \\lambda$ minimizes $C(\\mu) = c\\,\\mu + h\\,\\lambda/(\\mu - \\lambda)$ €/h, with $c = " + c + "$ and $h = " + m(h, 1, L) + "$; the mean time in the system is $w = 1/(\\mu - \\lambda)$ hours. Marketing promises $w \\le w_{\\max} = " + w + "$ minutes. What are the optimal capacity under the promise and its cost $C$?",
        "Capacità di una coda M/M/1: tasso di arrivo $\\lambda = " + lam + "$ clienti/ora; il tasso di servizio $\\mu > \\lambda$ minimizza $C(\\mu) = c\\,\\mu + h\\,\\lambda/(\\mu - \\lambda)$ €/h, con $c = " + c + "$ e $h = " + m(h, 1, L) + "$; il tempo medio nel sistema è $w = 1/(\\mu - \\lambda)$ ore. Il marketing promette $w \\le w_{\\max} = " + w + "$ minuti. Quanto valgono la capacità ottima con la promessa e il suo costo $C$?");
      var sp = T(L,
        "Without the promise $\\tilde\\mu = \\lambda + \\sqrt{h\\lambda/c} = " + (lam + s) + "$. The promise requires $\\mu \\ge \\lambda + 1/w_{\\max} = " + lam + " + 60/" + w + " = " + m(mu, 2, L) + "$ (with $w_{\\max}$ in hours), tighter than $\\tilde\\mu$: since $C$ is convex, the optimum is on the constraint, with $C = " + c + "\\cdot " + m(mu, 2, L) + " + " + m(h, 1, L) + "\\cdot " + lam + "\\cdot " + w + "/60 = " + m(C(mu), 2, L) + "$ €/h.",
        "Senza promessa $\\tilde\\mu = \\lambda + \\sqrt{h\\lambda/c} = " + (lam + s) + "$. La promessa richiede $\\mu \\ge \\lambda + 1/w_{\\max} = " + lam + " + 60/" + w + " = " + m(mu, 2, L) + "$ (con $w_{\\max}$ in ore), più stretto di $\\tilde\\mu$: essendo $C$ convessa, l'ottimo sta sul vincolo, con $C = " + c + "\\cdot " + m(mu, 2, L) + " + " + m(h, 1, L) + "\\cdot " + lam + "\\cdot " + w + "/60 = " + m(C(mu), 2, L) + "$ €/h.");
      return chiudi(rng, testo, o(mu, C(mu)), cand, sp, { lam: lam, c: c, h: h, wmin: w });
    }
  });

  gen({
    id: "nlpm-g-svm-soft", livello: "media", capitolo: "svm",
    link: link("svm/#soft-margin-and-the-role-of-c", "svm/#soft-margin-e-il-ruolo-di-c"),
    prova: function (rng, L) {
      var w = [ri(rng, -2, 2), ri(rng, -2, 2)], b = ri(rng, -2, 2), C = pk(rng, [0.5, 1, 2]);
      if (w[0] === 0 && w[1] === 0) return null;
      var X = [], y = [], neg = 0, posi = 0;
      for (var i = 0; i < 4; i++) {
        var xn = [ri(rng, -2, 2), ri(rng, -2, 2)];
        for (var t = 0; t < X.length; t++) if (X[t][0] === xn[0] && X[t][1] === xn[1]) return null;
        X.push(xn); y.push(rng() < 0.5 ? -1 : 1);
        if (y[i] < 0) neg++; else posi++;
      }
      if (neg === 0 || posi === 0) return null;
      var sx = 0, raw = 0, h0 = 0, oltre = 0, mis = 0;
      for (i = 0; i < 4; i++) {
        var fm = y[i] * (w[0] * X[i][0] + w[1] * X[i][1] + b);
        sx += pos(1 - fm); raw += 1 - fm; h0 += pos(-fm); if (fm > 1) oltre++; if (fm < 0) mis += 1 - fm;
      }
      if (sx === 0 || oltre === 0 || h0 === sx) return null;
      var nw = (w[0] * w[0] + w[1] * w[1]) / 2;
      function o(s, z) { return "$\\sum_i \\xi_i = " + m(s, 2, L) + "$, " + T(L, "objective ", "obiettivo ") + "$" + m(z, 2, L) + "$"; }
      var pts = [];
      for (i = 0; i < 4; i++) pts.push("$\\mathbf x_" + (i + 1) + " = (" + X[i][0] + "; " + X[i][1] + ")$, $y_" + (i + 1) + " = " + (y[i] > 0 ? "+1" : "-1") + "$");
      var testo = T(L,
        "Soft-margin SVM: objective $\\tfrac12\\|\\mathbf w\\|^2 + C\\sum_i \\xi_i$, where for given $\\mathbf w, b$ the optimal slacks are $\\xi_i = \\max\\{0,\\ 1 - y_i(\\mathbf w'\\mathbf x_i + b)\\}$. Candidate classifier $\\mathbf w = (" + w[0] + "; " + w[1] + ")$, $b = " + b + "$, with $C = " + m(C, 1, L) + "$; observations " + pts.join("; ") + ". What are $\\sum_i \\xi_i$ and the objective value?",
        "SVM soft margin: obiettivo $\\tfrac12\\|\\mathbf w\\|^2 + C\\sum_i \\xi_i$, dove per $\\mathbf w, b$ dati gli slack ottimi sono $\\xi_i = \\max\\{0,\\ 1 - y_i(\\mathbf w'\\mathbf x_i + b)\\}$. Classificatore candidato $\\mathbf w = (" + w[0] + "; " + w[1] + ")$, $b = " + b + "$, con $C = " + m(C, 1, L) + "$; osservazioni " + pts.join("; ") + ". Quanto valgono $\\sum_i \\xi_i$ e il valore dell'obiettivo?");
      var sp = T(L,
        "Compute $y_i(\\mathbf w'\\mathbf x_i + b)$ for each observation: the points with value $\\ge 1$ are beyond the margin and pay nothing, the others pay $1 - y_i(\\mathbf w'\\mathbf x_i + b)$. The slacks sum to $" + m(sx, 2, L) + "$ and the objective is $\\tfrac12\\cdot " + (2 * nw) + " + " + m(C, 1, L) + "\\cdot " + m(sx, 2, L) + " = " + m(nw + C * sx, 2, L) + "$. Dropping the $\\max$ lets well-classified points subtract.",
        "Si calcola $y_i(\\mathbf w'\\mathbf x_i + b)$ per ogni osservazione: i punti con valore $\\ge 1$ sono oltre il margine e non pagano, gli altri pagano $1 - y_i(\\mathbf w'\\mathbf x_i + b)$. Gli slack sommano $" + m(sx, 2, L) + "$ e l'obiettivo è $\\tfrac12\\cdot " + (2 * nw) + " + " + m(C, 1, L) + "\\cdot " + m(sx, 2, L) + " = " + m(nw + C * sx, 2, L) + "$. Togliere il $\\max$ fa sottrarre i punti ben classificati.");
      return chiudi(rng, testo, o(sx, nw + C * sx),
        [raw >= 0 ? o(raw, nw + C * raw) : "", o(sx, 2 * nw + C * sx), o(h0, nw + C * h0), o(mis, nw + C * mis), o(sx, nw + sx)]
          .filter(function (u) { return u; }), sp,
        { w: w, b: b, C: C, X: X, y: y });
    }
  });

  gen({
    id: "nlpm-g-qp-kkt", livello: "facile", capitolo: "background",
    link: link("theory-nonlinear/#the-nonlinear-optimality-conditions-the-kkt-conditions",
               "teoria-non-lineare/#le-condizioni-di-ottimalita-non-lineari-le-kkt"),
    prova: function (rng, L) {
      var a = ri(rng, 1, 6), bq = ri(rng, 1, 6), d = ri(rng, 3, 24);
      if (a === bq) return null;
      var x1 = bq * d / (a + bq), x2 = a * d / (a + bq), lam = 2 * a * x1;
      var vals = [x1, x2, lam, lam / 2];
      for (var i = 0; i < vals.length; i++) if (quasiMezzo(vals[i], 2)) return null;
      function o(u, v) { return "$\\tilde x_1 = " + m(u, 2, L) + "$, $\\lambda = " + m(v, 2, L) + "$"; }
      function k(c) { return c === 1 ? "" : String(c); }
      var testo = T(L,
        "Convex QP: $\\min\\ " + k(a) + "x_1^2 + " + k(bq) + "x_2^2$ subject to $x_1 + x_2 \\ge " + d + "$, $x_1, x_2 \\ge 0$. At the optimum the constraint is active, the bounds are not, and stationarity of the Lagrangian $L = f + \\lambda(" + d + " - x_1 - x_2)$ holds. What are $\\tilde x_1$ and the multiplier $\\lambda$?",
        "QP convesso: $\\min\\ " + k(a) + "x_1^2 + " + k(bq) + "x_2^2$ soggetto a $x_1 + x_2 \\ge " + d + "$, $x_1, x_2 \\ge 0$. All'ottimo il vincolo è attivo, i limiti no, e vale la stazionarietà della Lagrangiana $L = f + \\lambda(" + d + " - x_1 - x_2)$. Quanto valgono $\\tilde x_1$ e il moltiplicatore $\\lambda$?");
      var sp = T(L,
        "Stationarity: $" + 2 * a + "x_1 = \\lambda$ and $" + 2 * bq + "x_2 = \\lambda$, so $x_1 = \\lambda/" + 2 * a + "$, $x_2 = \\lambda/" + 2 * bq + "$; the active constraint gives $\\lambda = " + m(lam, 2, L) + "$, hence $\\tilde x_1 = " + m(x1, 2, L) + "$, $\\tilde x_2 = " + m(x2, 2, L) + "$. The variable with the smaller quadratic coefficient takes the larger share; $\\lambda$ is the marginal cost of one more unit of $d$.",
        "Stazionarietà: $" + 2 * a + "x_1 = \\lambda$ e $" + 2 * bq + "x_2 = \\lambda$, quindi $x_1 = \\lambda/" + 2 * a + "$, $x_2 = \\lambda/" + 2 * bq + "$; il vincolo attivo dà $\\lambda = " + m(lam, 2, L) + "$, da cui $\\tilde x_1 = " + m(x1, 2, L) + "$, $\\tilde x_2 = " + m(x2, 2, L) + "$. La variabile col coefficiente quadratico minore prende la quota maggiore; $\\lambda$ è il costo marginale di un'unità in più di $d$.");
      return chiudi(rng, testo, o(x1, lam), [o(x2, lam), o(x1, lam / 2), o(d / 2, a * d), o(x1, 2 * lam)], sp,
        { a: a, b: bq, d: d });
    }
  });

  gen({
    id: "nlpm-g-svm-margine", livello: "facile", capitolo: "svm",
    link: link("svm/#hard-margin", "svm/#hard-margin"),
    prova: function (rng, L) {
      var w = [ri(rng, -6, 6), ri(rng, -6, 6)], b = ri(rng, -8, 8), x0 = [ri(rng, -4, 4), ri(rng, -4, 4)];
      if (w[0] === 0 || w[1] === 0) return null;
      var nw = Math.sqrt(w[0] * w[0] + w[1] * w[1]), f0 = w[0] * x0[0] + w[1] * x0[1] + b;
      if (f0 === 0) return null;
      var mg = 2 / nw, dist = Math.abs(f0) / nw;
      var vals = [mg, dist, 1 / nw, Math.abs(f0), 2 / (nw * nw)];
      for (var i = 0; i < vals.length; i++) if (quasiMezzo(vals[i], 3)) return null;
      function o(a, c) { return T(L, "margin $", "margine $") + m(a, 3, L) + T(L, "$, distance $", "$, distanza $") + m(c, 3, L) + "$"; }
      var testo = (L === "it" ? SVM_I : SVM_E) + T(L,
        "A trained SVM has $\\mathbf w = (" + w[0] + "; " + w[1] + ")$ and $b = " + b + "$; its margin lines are $\\mathbf w'\\mathbf x + b = \\pm 1$. What are the margin (the distance between the two margin lines) and the distance of the point $\\mathbf x_0 = (" + x0[0] + "; " + x0[1] + ")$ from the hyperplane?",
        "Una SVM addestrata ha $\\mathbf w = (" + w[0] + "; " + w[1] + ")$ e $b = " + b + "$; le sue rette di margine sono $\\mathbf w'\\mathbf x + b = \\pm 1$. Quanto valgono il margine (la distanza fra le due rette di margine) e la distanza del punto $\\mathbf x_0 = (" + x0[0] + "; " + x0[1] + ")$ dall'iperpiano?");
      var sp = T(L,
        "$\\|\\mathbf w\\| = \\sqrt{" + (w[0] * w[0] + w[1] * w[1]) + "} = " + m(nw, 3, L) + "$: the margin is $2/\\|\\mathbf w\\| = " + m(mg, 3, L) + "$; the distance of $\\mathbf x_0$ is $|\\mathbf w'\\mathbf x_0 + b|/\\|\\mathbf w\\| = " + Math.abs(f0) + "/" + m(nw, 3, L) + " = " + m(dist, 3, L) + "$. Forgetting to divide by $\\|\\mathbf w\\|$ is the typical mistake.",
        "$\\|\\mathbf w\\| = \\sqrt{" + (w[0] * w[0] + w[1] * w[1]) + "} = " + m(nw, 3, L) + "$: il margine è $2/\\|\\mathbf w\\| = " + m(mg, 3, L) + "$; la distanza di $\\mathbf x_0$ è $|\\mathbf w'\\mathbf x_0 + b|/\\|\\mathbf w\\| = " + Math.abs(f0) + "/" + m(nw, 3, L) + " = " + m(dist, 3, L) + "$. Dimenticare di dividere per $\\|\\mathbf w\\|$ è l'errore tipico.");
      return chiudi(rng, testo, o(mg, dist), [o(1 / nw, dist), o(mg, Math.abs(f0)), o(2 / (nw * nw), dist), o(1 / nw, Math.abs(f0))], sp,
        { w: w, b: b, x0: x0 });
    }
  });

  gen({
    id: "nlpm-g-svm-duale-w", livello: "facile", capitolo: "svm",
    link: link("svm/#the-dual-and-the-support-vectors", "svm/#il-duale-e-i-support-vector"),
    prova: function (rng, L) {
      var X = [[ri(rng, -3, 4), ri(rng, -3, 4)], [ri(rng, -3, 4), ri(rng, -3, 4)], [ri(rng, -3, 4), ri(rng, -3, 4)]];
      var a1 = pk(rng, [0.5, 1, 1.5, 2]), a2 = pk(rng, [0.5, 1, 1.5, 2]), al = [a1, a2, a1 + a2], y = [1, 1, -1];
      var w = [0, 1].map(function (k) { return al[0] * X[0][k] + al[1] * X[1][k] - al[2] * X[2][k]; });
      var nos = [0, 1].map(function (k) { return al[0] * X[0][k] + al[1] * X[1][k] + al[2] * X[2][k]; });
      var pos = [0, 1].map(function (k) { return al[0] * X[0][k] + al[1] * X[1][k]; });
      if (w[0] === 0 && w[1] === 0) return null;
      for (var u = 0; u < 3; u++) for (var v = u + 1; v < 3; v++) if (X[u][0] === X[v][0] && X[u][1] === X[v][1]) return null;
      function o(v) { return "$\\tilde{\\mathbf w} = " + vec(v, L) + "$"; }
      var testo = (L === "it" ? SVM_I : SVM_E) + T(L,
        "In the dual of the soft margin ($\\max\\ \\sum_i\\alpha_i - \\tfrac12\\sum_i\\sum_j\\alpha_i\\alpha_jy_iy_j\\mathbf x_i'\\mathbf x_j$, $\\sum_i\\alpha_iy_i = 0$, $0 \\le \\alpha_i \\le C$) only three points have $\\tilde\\alpha_i > 0$: $\\mathbf x_1 = (" + X[0].join("; ") + ")$, $y_1 = +1$, $\\tilde\\alpha_1 = " + m(a1, 1, L) + "$; $\\mathbf x_2 = (" + X[1].join("; ") + ")$, $y_2 = +1$, $\\tilde\\alpha_2 = " + m(a2, 1, L) + "$; $\\mathbf x_3 = (" + X[2].join("; ") + ")$, $y_3 = -1$, $\\tilde\\alpha_3 = " + m(a1 + a2, 1, L) + "$. What is the optimal $\\tilde{\\mathbf w}$ of the primal?",
        "Nel duale del soft margin ($\\max\\ \\sum_i\\alpha_i - \\tfrac12\\sum_i\\sum_j\\alpha_i\\alpha_jy_iy_j\\mathbf x_i'\\mathbf x_j$, $\\sum_i\\alpha_iy_i = 0$, $0 \\le \\alpha_i \\le C$) solo tre punti hanno $\\tilde\\alpha_i > 0$: $\\mathbf x_1 = (" + X[0].join("; ") + ")$, $y_1 = +1$, $\\tilde\\alpha_1 = " + m(a1, 1, L) + "$; $\\mathbf x_2 = (" + X[1].join("; ") + ")$, $y_2 = +1$, $\\tilde\\alpha_2 = " + m(a2, 1, L) + "$; $\\mathbf x_3 = (" + X[2].join("; ") + ")$, $y_3 = -1$, $\\tilde\\alpha_3 = " + m(a1 + a2, 1, L) + "$. Quanto vale il $\\tilde{\\mathbf w}$ ottimo del primale?");
      var sp = T(L,
        "Primal–dual relation: $\\tilde{\\mathbf w} = \\sum_i\\tilde\\alpha_iy_i\\mathbf x_i$, a sum over the support vectors only, with the sign of the labels: $" + m(a1, 1, L) + "\\,\\mathbf x_1 + " + m(a2, 1, L) + "\\,\\mathbf x_2 - " + m(a1 + a2, 1, L) + "\\,\\mathbf x_3 = " + vec(w, L) + "$. Forgetting the labels $y_i$ is the typical mistake.",
        "Relazione primale-duale: $\\tilde{\\mathbf w} = \\sum_i\\tilde\\alpha_iy_i\\mathbf x_i$, una somma sui soli support vector, col segno delle etichette: $" + m(a1, 1, L) + "\\,\\mathbf x_1 + " + m(a2, 1, L) + "\\,\\mathbf x_2 - " + m(a1 + a2, 1, L) + "\\,\\mathbf x_3 = " + vec(w, L) + "$. Dimenticare le etichette $y_i$ è l'errore tipico.");
      return chiudi(rng, testo, o(w), [o(nos), o([-w[0], -w[1]]), o(pos), o([w[1], w[0]])], sp,
        { X: X, y: y, alpha: al });
    }
  });

  gen({
    id: "nlpm-g-svm-rbf-valore", livello: "facile", capitolo: "svm",
    link: link("svm/#rbf-kernel", "svm/#kernel-rbf"),
    prova: function (rng, L) {
      var x = [ri(rng, 0, 4), ri(rng, 0, 4)], z = [ri(rng, 0, 4), ri(rng, 0, 4)], g = pk(rng, [0.1, 0.2, 0.25, 0.5, 1]);
      var d2 = (x[0] - z[0]) * (x[0] - z[0]) + (x[1] - z[1]) * (x[1] - z[1]);
      if (d2 === 0 || d2 > 10) return null;
      var K = Math.exp(-g * d2), w1 = Math.exp(-g * Math.sqrt(d2)), w2 = Math.exp(-d2 / g), w3 = Math.exp(-g * d2 / 2);
      var vals = [K, w1, w2, w3];
      for (var i = 0; i < vals.length; i++) if (quasiMezzo(vals[i], 3) || vals[i] < 0.001) return null;
      function o(v) { return "$K = " + m(v, 3, L) + "$"; }
      var testo = (L === "it" ? SVM_I : SVM_E) + T(L,
        "With the RBF (Gaussian) kernel $K(\\mathbf x, \\mathbf z) = e^{-\\gamma\\|\\mathbf x - \\mathbf z\\|^2}$ and $\\gamma = " + m(g, 2, L) + "$, what is $K(\\mathbf x, \\mathbf z)$ for $\\mathbf x = (" + x.join("; ") + ")$ and $\\mathbf z = (" + z.join("; ") + ")$?",
        "Con il kernel RBF (gaussiano) $K(\\mathbf x, \\mathbf z) = e^{-\\gamma\\|\\mathbf x - \\mathbf z\\|^2}$ e $\\gamma = " + m(g, 2, L) + "$, quanto vale $K(\\mathbf x, \\mathbf z)$ per $\\mathbf x = (" + x.join("; ") + ")$ e $\\mathbf z = (" + z.join("; ") + ")$?");
      var sp = T(L,
        "$\\|\\mathbf x - \\mathbf z\\|^2 = " + d2 + "$ (the squared distance, not the distance), so $K = e^{-" + m(g, 2, L) + "\\cdot " + d2 + "} = " + m(K, 3, L) + "$. Points far apart give $K$ close to 0, coincident points $K = 1$; a larger $\\gamma$ makes the kernel more local.",
        "$\\|\\mathbf x - \\mathbf z\\|^2 = " + d2 + "$ (la distanza al quadrato, non la distanza), quindi $K = e^{-" + m(g, 2, L) + "\\cdot " + d2 + "} = " + m(K, 3, L) + "$. Punti lontani danno $K$ vicino a 0, punti coincidenti $K = 1$; un $\\gamma$ più grande rende il kernel più locale.");
      return chiudi(rng, testo, o(K), [o(w1), o(w2), o(w3)], sp, { x: x, z: z, g: g });
    }
  });

  gen({
    id: "nlpm-g-svr-tubo", livello: "facile", capitolo: "svm",
    link: link("svm/#unbalanced-classes-and-svr", "svm/#classi-sbilanciate-e-svr"),
    prova: function (rng, L) {
      var a = -ri(rng, 2, 12), c0 = 10 * ri(rng, 15, 25), eps = ri(rng, 3, 8);
      var xs = [1, 2, 3, 4, 5].map(function (k) { return k + ri(rng, 0, 2) * 5; });
      xs = sortNum(xs);
      for (var k = 1; k < xs.length; k++) if (xs[k] === xs[k - 1]) return null;
      var r = xs.map(function () { return ri(rng, -2 * eps, 2 * eps); });
      var ys = xs.map(function (x, i) { return a * x + c0 + r[i]; });
      var fuori = 0, pen = 0, assol = 0;
      r.forEach(function (e) { if (Math.abs(e) > eps) { fuori++; pen += Math.abs(e) - eps; assol += Math.abs(e); } });
      if (fuori === 0 || fuori === 5) return null;
      function o(k, p) { return T(L, "$" + k + "$ points outside, penalty $" + p + "$", "$" + k + "$ punti fuori, penalità $" + p + "$"); }
      var pts = xs.map(function (x, i) { return "(" + x + "; " + ys[i] + ")"; }).join(", ");
      var testo = T(L,
        "Support Vector Regression: errors within a tube $|y_i - \\hat y_i| \\le \\varepsilon$ cost nothing, those outside pay $|y_i - \\hat y_i| - \\varepsilon$ (the slacks $\\xi_i$, $\\xi_i^*$). The estimated line is $\\hat y = " + a + "x + " + c0 + "$, with $\\varepsilon = " + eps + "$; the observations $(x_i; y_i)$ are " + pts + ". How many points fall outside the tube, and what is their total penalty $\\sum_i(\\xi_i + \\xi_i^*)$?",
        "Support Vector Regression: gli errori dentro un tubo $|y_i - \\hat y_i| \\le \\varepsilon$ non costano, quelli fuori pagano $|y_i - \\hat y_i| - \\varepsilon$ (gli scarti $\\xi_i$, $\\xi_i^*$). La retta stimata è $\\hat y = " + a + "x + " + c0 + "$, con $\\varepsilon = " + eps + "$; le osservazioni $(x_i; y_i)$ sono " + pts + ". Quanti punti cadono fuori dal tubo, e qual è la loro penalità totale $\\sum_i(\\xi_i + \\xi_i^*)$?");
      var sp = T(L,
        "Residuals $y_i - \\hat y_i$: $" + r.join("$, $") + "$. Those with $|r_i| > " + eps + "$ are " + fuori + "; each pays only the part beyond the tube, $|r_i| - " + eps + "$, for a total of $" + pen + "$. Paying the whole residual gives $" + assol + "$.",
        "Residui $y_i - \\hat y_i$: $" + r.join("$, $") + "$. Quelli con $|r_i| > " + eps + "$ sono " + fuori + "; ciascuno paga solo la parte oltre il tubo, $|r_i| - " + eps + "$, per un totale di $" + pen + "$. Pagare l'intero residuo dà $" + assol + "$.");
      return chiudi(rng, testo, o(fuori, pen), [o(fuori, assol), o(5 - fuori, pen), o(5 - fuori, assol), o(fuori, pen + eps)], sp,
        { xs: xs, ys: ys, a: a, c: c0, eps: eps });
    }
  });

  gen({
    id: "nlpm-g-svm-duale-b", livello: "media", capitolo: "svm",
    link: link("svm/#the-dual-and-the-support-vectors", "svm/#il-duale-e-i-support-vector"),
    prova: function (rng, L) {
      var w = [ri(rng, -3, 3), ri(rng, -3, 3)], xk = [ri(rng, -3, 3), ri(rng, -3, 3)], yk = pk(rng, [-1, 1]);
      var x0 = [ri(rng, -3, 3), ri(rng, -3, 3)];
      if (w[0] === 0 && w[1] === 0) return null;
      var b = yk - (w[0] * xk[0] + w[1] * xk[1]), f0 = w[0] * x0[0] + w[1] * x0[1] + b;
      var bw = -(w[0] * xk[0] + w[1] * xk[1]), b1 = 1 - (w[0] * xk[0] + w[1] * xk[1]);
      if (f0 === 0 || b1 === b) return null;
      function o(bb, ff) { return "$\\tilde b = " + bb + "$, $f(\\mathbf x_0) = " + ff + "$"; }
      function fx(bb) { return w[0] * x0[0] + w[1] * x0[1] + bb; }
      var testo = (L === "it" ? SVM_I : SVM_E) + T(L,
        "A soft-margin SVM (dual multipliers $0 \\le \\alpha_i \\le C$) gives $\\tilde{\\mathbf w} = (" + w.join("; ") + ")$. The point $\\mathbf x_k = (" + xk.join("; ") + ")$ with label $y_k = " + (yk > 0 ? "+1" : "-1") + "$ has $0 < \\tilde\\alpha_k < C$. What are the intercept $\\tilde b$ and the score $f(\\mathbf x_0) = \\tilde{\\mathbf w}'\\mathbf x_0 + \\tilde b$ of $\\mathbf x_0 = (" + x0.join("; ") + ")$?",
        "Una SVM soft margin (moltiplicatori duali $0 \\le \\alpha_i \\le C$) dà $\\tilde{\\mathbf w} = (" + w.join("; ") + ")$. Il punto $\\mathbf x_k = (" + xk.join("; ") + ")$ con etichetta $y_k = " + (yk > 0 ? "+1" : "-1") + "$ ha $0 < \\tilde\\alpha_k < C$. Quanto valgono l'intercetta $\\tilde b$ e il punteggio $f(\\mathbf x_0) = \\tilde{\\mathbf w}'\\mathbf x_0 + \\tilde b$ di $\\mathbf x_0 = (" + x0.join("; ") + ")$?");
      var sp = T(L,
        "$0 < \\tilde\\alpha_k < C$ means $\\mathbf x_k$ lies exactly on its margin line: $y_k(\\tilde{\\mathbf w}'\\mathbf x_k + b) = 1$, so $\\tilde b = y_k - \\tilde{\\mathbf w}'\\mathbf x_k = " + b + "$ (since $1/y_k = y_k$). Then $f(\\mathbf x_0) = " + f0 + "$: $\\mathbf x_0$ is assigned to class $" + (f0 > 0 ? "+1" : "-1") + "$.",
        "$0 < \\tilde\\alpha_k < C$ vuol dire che $\\mathbf x_k$ sta esattamente sulla sua retta di margine: $y_k(\\tilde{\\mathbf w}'\\mathbf x_k + b) = 1$, quindi $\\tilde b = y_k - \\tilde{\\mathbf w}'\\mathbf x_k = " + b + "$ (perché $1/y_k = y_k$). Allora $f(\\mathbf x_0) = " + f0 + "$: $\\mathbf x_0$ va nella classe $" + (f0 > 0 ? "+1" : "-1") + "$.");
      return chiudi(rng, testo, o(b, f0), [o(bw, fx(bw)), o(b1, fx(b1)), o(-b, fx(-b)), o(b, -f0)], sp,
        { w: w, xk: xk, yk: yk, x0: x0 });
    }
  });

  gen({
    id: "nlpm-g-sv-perturbazione-nl", livello: "facile", capitolo: "solver",
    link: link("solver-nonlinear/#the-multipliers-in-nonlinear-models", "solver-non-lineare/#i-moltiplicatori-nei-modelli-non-lineari"),
    prova: function (rng, L) {
      var a = 10 * ri(rng, 2, 9), k = pk(rng, [0.1, 0.2, 0.5, 1]), b = ri(rng, 2, 20), eps = 0.1;
      var z1 = a * Math.log(1 + k * b), z2 = a * Math.log(1 + k * (b + eps));
      var z1r = Math.round(z1 * 1e4) / 1e4, z2r = Math.round(z2 * 1e4) / 1e4;
      var est = (z2r - z1r) / eps, der = a * k / (1 + k * b);
      if (quasiMezzo(est, 2) || quasiMezzo(z2r - z1r, 2) || Math.abs(est - der) < 0.01) return null;
      function o(v) { return "$\\approx " + m(v, 2, L) + "$"; }
      var testo = T(L,
        "A gurobipy model maximizes $" + a + "\\log(1 + " + m(k, 1, L) + "x)$ subject to $0 \\le x \\le b$, with the logarithm written through `addGenConstrLog`, so the solver returns no dual for the bound $x \\le b$. Solving with $b = " + b + "$ gives $" + m(z1r, 4, L) + "$; with $b = " + m(b + eps, 1, L) + "$ it gives $" + m(z2r, 4, L) + "$. What is the perturbation estimate of the multiplier of $x \\le b$?",
        "Un modello gurobipy massimizza $" + a + "\\log(1 + " + m(k, 1, L) + "x)$ soggetto a $0 \\le x \\le b$, con il logaritmo scritto tramite `addGenConstrLog`, quindi il solver non restituisce il duale del limite $x \\le b$. Risolvendo con $b = " + b + "$ si ottiene $" + m(z1r, 4, L) + "$; con $b = " + m(b + eps, 1, L) + "$ si ottiene $" + m(z2r, 4, L) + "$. Qual è la stima per perturbazione del moltiplicatore di $x \\le b$?");
      var sp = T(L,
        "Incremental ratio: $(" + m(z2r, 4, L) + " - " + m(z1r, 4, L) + ")/0.1 = " + m(est, 2, L) + "$, close to the exact derivative $" + a + "\\cdot " + m(k, 1, L) + "/(1 + " + m(k, 1, L) + "\\cdot " + b + ") = " + m(der, 2, L) + "$ (the difference is the curvature). Forgetting to divide by $0.1$ is the typical slip.",
        "Rapporto incrementale: $(" + m(z2r, 4, L) + " - " + m(z1r, 4, L) + ")/0{,}1 = " + m(est, 2, L) + "$, vicino alla derivata esatta $" + a + "\\cdot " + m(k, 1, L) + "/(1 + " + m(k, 1, L) + "\\cdot " + b + ") = " + m(der, 2, L) + "$ (la differenza è la curvatura). Dimenticare di dividere per $0{,}1$ è la svista tipica.");
      return chiudi(rng, testo, o(est), [o(z2r - z1r), o(z1r / b), o(10 * est)], sp,
        { a: a, k: k, b: b, z1: z1r, z2: z2r });
    }
  });

  gen({
    id: "nlpm-g-kkt-proiezione", livello: "media", capitolo: "background",
    link: link("theory-nonlinear/#the-nonlinear-optimality-conditions-the-kkt-conditions",
               "teoria-non-lineare/#le-condizioni-di-ottimalita-non-lineari-le-kkt"),
    prova: function (rng, L) {
      var a = ri(rng, 1, 6), b = ri(rng, 1, 6), c = ri(rng, 2, 8);
      if (a + b <= c) return null;
      // proiezione sulla retta x + y = c
      var t = (a + b - c) / 2, x = a - t, y = b - t, lam = 2 * t;
      if (x <= 0.2 || y <= 0.2) return null;
      var fv = 2 * t * t;
      if (quasiMezzo(x, 2) || quasiMezzo(y, 2) || quasiMezzo(lam, 2) || quasiMezzo(fv, 2)) return null;
      function o(u, v, l) { return "$(" + m(u, 2, L) + "; " + m(v, 2, L) + ")$, $\\lambda = " + m(l, 2, L) + "$"; }
      var testo = T(L,
        "Convex QP: $\\min\\ (x - " + a + ")^2 + (y - " + b + ")^2$ subject to $x + y \\le " + c + "$, $x, y \\ge 0$; $\\lambda \\ge 0$ is the KKT multiplier of $x + y \\le " + c + "$ (Lagrangian $L = f + \\lambda(x + y - " + c + ")$). What are the optimum and $\\lambda$?",
        "QP convesso: $\\min\\ (x - " + a + ")^2 + (y - " + b + ")^2$ soggetto a $x + y \\le " + c + "$, $x, y \\ge 0$; $\\lambda \\ge 0$ è il moltiplicatore KKT di $x + y \\le " + c + "$ (Lagrangiana $L = f + \\lambda(x + y - " + c + ")$). Quanto valgono l'ottimo e $\\lambda$?");
      var sp = T(L,
        "The free minimum $(" + a + ", " + b + ")$ violates $x + y \\le " + c + "$, so the constraint is active. Stationarity: $2(x - " + a + ") + \\lambda = 0$, $2(y - " + b + ") + \\lambda = 0$, so $x = " + a + " - \\lambda/2$, $y = " + b + " - \\lambda/2$; with $x + y = " + c + "$: $\\lambda = " + m(lam, 2, L) + "$, optimum $(" + m(x, 2, L) + "; " + m(y, 2, L) + ")$, both positive (bounds inactive). Convex problem: the KKT point is the global optimum.",
        "Il minimo libero $(" + a + ", " + b + ")$ viola $x + y \\le " + c + "$, quindi il vincolo è attivo. Stazionarietà: $2(x - " + a + ") + \\lambda = 0$, $2(y - " + b + ") + \\lambda = 0$, quindi $x = " + a + " - \\lambda/2$, $y = " + b + " - \\lambda/2$; con $x + y = " + c + "$: $\\lambda = " + m(lam, 2, L) + "$, ottimo $(" + m(x, 2, L) + "; " + m(y, 2, L) + ")$, entrambe positive (limiti inattivi). Problema convesso: il punto KKT è l'ottimo globale.");
      return chiudi(rng, testo, o(x, y, lam), [o(x, y, t), o(a, b, 0), o(y, x, lam), o(x, y, 2 * lam)], sp,
        { a: a, b: b, c: c });
    }
  });

  gen({
    id: "nlpm-g-mk-due-titoli-r", livello: "complessa", capitolo: "markowitz",
    link: link("markowitz/#model", "markowitz/#modello"),
    prova: function (rng, L) {
      var mu1 = ri(rng, 10, 20), mu2 = ri(rng, 3, 8), s1 = ri(rng, 15, 30), s2 = ri(rng, 8, 14), rho = pk(rng, [-0.2, 0, 0.2, 0.4]);
      var v1 = s1 * s1 / 1e4, v2 = s2 * s2 / 1e4, cv = rho * s1 * s2 / 1e4;
      var xmv = (v2 - cv) / (v1 + v2 - 2 * cv);
      if (xmv <= 0.05 || xmv >= 0.95) return null;
      var rmv = xmv * mu1 + (1 - xmv) * mu2;
      var rb = pk(rng, [Math.round(rmv) - 2, Math.round(rmv) + 1, Math.round(rmv) + 2, Math.round(rmv) + 3]);
      if (rb >= mu1 || rb <= mu2 || Math.abs(rb - rmv) < 0.3) return null;
      var xr = (rb - mu2) / (mu1 - mu2);
      var x1 = rb <= rmv ? xmv : xr;
      function vol(x) { return 100 * Math.sqrt(x * x * v1 + (1 - x) * (1 - x) * v2 + 2 * x * (1 - x) * cv); }
      function vol0(x) { return 100 * Math.sqrt(x * x * v1 + (1 - x) * (1 - x) * v2); }
      var alt = rb <= rmv ? xr : xmv;
      var vals = [x1, vol(x1), alt, vol(alt), vol0(x1)];
      for (var i = 0; i < vals.length; i++) if (quasiMezzo(100 * vals[i], 1) || quasiMezzo(vals[i], 2)) return null;
      function o(x, s) { return "$x_1 = " + m(100 * x, 1, L) + "\\%$, " + T(L, "volatility", "volatilità") + " $" + m(s, 2, L) + "\\%$"; }
      var testo = T(L,
        "Markowitz with two assets: expected returns $\\mu_1 = " + mu1 + "\\%$, $\\mu_2 = " + mu2 + "\\%$; volatilities $\\sigma_1 = " + s1 + "\\%$, $\\sigma_2 = " + s2 + "\\%$; correlation $\\rho = " + m(rho, 1, L) + "$. Minimize the portfolio variance $x_1^2\\sigma_1^2 + x_2^2\\sigma_2^2 + 2x_1x_2\\rho\\sigma_1\\sigma_2$ with $x_1 + x_2 = 1$, $x \\ge 0$ and expected return at least $\\bar r = " + rb + "\\%$. What are the optimal share $x_1$ and the portfolio volatility?",
        "Markowitz con due titoli: rendimenti attesi $\\mu_1 = " + mu1 + "\\%$, $\\mu_2 = " + mu2 + "\\%$; volatilità $\\sigma_1 = " + s1 + "\\%$, $\\sigma_2 = " + s2 + "\\%$; correlazione $\\rho = " + m(rho, 1, L) + "$. Si minimizza la varianza del portafoglio $x_1^2\\sigma_1^2 + x_2^2\\sigma_2^2 + 2x_1x_2\\rho\\sigma_1\\sigma_2$ con $x_1 + x_2 = 1$, $x \\ge 0$ e rendimento atteso almeno $\\bar r = " + rb + "\\%$. Quanto valgono la quota ottima $x_1$ e la volatilità del portafoglio?");
      var sp = T(L,
        "Minimum-variance share without the return constraint: $x_1 = (\\sigma_2^2 - \\rho\\sigma_1\\sigma_2)/(\\sigma_1^2 + \\sigma_2^2 - 2\\rho\\sigma_1\\sigma_2) = " + m(100 * xmv, 1, L) + "\\%$, with return $" + m(rmv, 2, L) + "\\%$. " + (rb <= rmv ? "It already meets $\\bar r$: the return constraint is inactive (zero multiplier)." : "It is below $\\bar r$, so the constraint binds: $x_1\\mu_1 + (1 - x_1)\\mu_2 = \\bar r$ gives $x_1 = " + m(100 * xr, 1, L) + "\\%$.") + " Volatility $" + m(vol(x1), 2, L) + "\\%$.",
        "Quota di minima varianza senza il vincolo di rendimento: $x_1 = (\\sigma_2^2 - \\rho\\sigma_1\\sigma_2)/(\\sigma_1^2 + \\sigma_2^2 - 2\\rho\\sigma_1\\sigma_2) = " + m(100 * xmv, 1, L) + "\\%$, con rendimento $" + m(rmv, 2, L) + "\\%$. " + (rb <= rmv ? "Rispetta già $\\bar r$: il vincolo di rendimento è inattivo (moltiplicatore nullo)." : "È sotto $\\bar r$, quindi il vincolo morde: $x_1\\mu_1 + (1 - x_1)\\mu_2 = \\bar r$ dà $x_1 = " + m(100 * xr, 1, L) + "\\%$.") + " Volatilità $" + m(vol(x1), 2, L) + "\\%$.");
      var cand = [o(alt, vol(alt)), o(x1, vol0(x1)), o(x1, x1 * s1 + (1 - x1) * s2), o(1 - x1, vol(1 - x1))];
      return chiudi(rng, testo, o(x1, vol(x1)), cand, sp,
        { mu: [mu1, mu2], s: [s1, s2], rho: rho, rb: rb });
    }
  });

  gen({
    id: "nlpm-g-code-robusto", livello: "complessa", capitolo: "queues",
    link: link("queues/#the-price-of-a-service-promise", "code/#il-prezzo-di-una-promessa-di-servizio"),
    prova: function (rng, L) {
      var lo = ri(rng, 20, 40), hi = lo + ri(rng, 6, 15), c = ri(rng, 1, 5), h = pk(rng, [1, 1.5, 2, 3]);
      var l0 = (lo + hi) / 2;
      function mu(l) { return l + Math.sqrt(h * l / c); }
      function C(m_, l) { return c * m_ + h * l / (m_ - l); }
      var mr = mu(hi), cw = C(mr, hi), cn = C(mu(l0), l0), pr = 100 * (cw / cn - 1);
      var mm = mu(l0), cm = C(mm, l0);
      var vals = [mr, cw, pr, mm];
      for (var i = 0; i < vals.length; i++) if (quasiMezzo(vals[i], 2)) return null;
      function o(a, b, p) { return "$\\mu = " + m(a, 2, L) + "$, " + T(L, "worst-case cost", "costo nel caso peggiore") + " $" + m(b, 2, L) + "$, " + T(L, "premium", "premio") + " $" + m(p, 1, L) + "\\%$"; }
      var testo = T(L,
        "M/M/1 capacity model: choose the capacity $\\mu$ to minimize $C(\\mu, \\lambda) = c\\mu + h\\lambda/(\\mu - \\lambda)$, with $c = " + c + "$ € per unit of capacity and $h = " + m(h, 1, L) + "$ €/h per customer in the system. The arrival rate is uncertain, $\\lambda \\in [" + lo + ", " + hi + "]$ per hour, nominal value $" + m(l0, 1, L) + "$. One sizes $\\mu$ to minimize the worst-case cost over the interval. What are the robust $\\mu$, its worst-case cost and its premium over the nominal optimal cost $C(\\tilde\\mu(" + m(l0, 1, L) + "), " + m(l0, 1, L) + ")$?",
        "Modello di capacità M/M/1: si sceglie la capacità $\\mu$ per minimizzare $C(\\mu, \\lambda) = c\\mu + h\\lambda/(\\mu - \\lambda)$, con $c = " + c + "$ € per unità di capacità e $h = " + m(h, 1, L) + "$ €/h per cliente nel sistema. Il tasso di arrivo è incerto, $\\lambda \\in [" + lo + ", " + hi + "]$ all'ora, valore nominale $" + m(l0, 1, L) + "$. Si dimensiona $\\mu$ minimizzando il costo nel caso peggiore sull'intervallo. Quanto valgono il $\\mu$ robusto, il suo costo nel caso peggiore e il premio rispetto al costo ottimo nominale $C(\\tilde\\mu(" + m(l0, 1, L) + "), " + m(l0, 1, L) + ")$?");
      var sp = T(L,
        "For fixed $\\mu$ the cost grows with $\\lambda$, so the worst case is $\\lambda = " + hi + "$: $\\mu_{\\rm rob} = " + hi + " + \\sqrt{h\\cdot " + hi + "/c} = " + m(mr, 2, L) + "$, worst-case cost $" + m(cw, 2, L) + "$. The nominal optimum costs $" + m(cn, 2, L) + "$: the insurance premium is $" + m(pr, 1, L) + "\\%$. Sizing on the nominal $\\tilde\\mu = " + m(mm, 2, L) + " < " + hi + "$ would make the queue unstable at the top of the interval.",
        "A $\\mu$ fissato il costo cresce con $\\lambda$, quindi il caso peggiore è $\\lambda = " + hi + "$: $\\mu_{\\rm rob} = " + hi + " + \\sqrt{h\\cdot " + hi + "/c} = " + m(mr, 2, L) + "$, costo nel caso peggiore $" + m(cw, 2, L) + "$. L'ottimo nominale costa $" + m(cn, 2, L) + "$: il premio assicurativo è del $" + m(pr, 1, L) + "\\%$. Dimensionare sul $\\tilde\\mu = " + m(mm, 2, L) + " < " + hi + "$ nominale renderebbe instabile la coda in cima all'intervallo.");
      var ml = mu(lo), cl = C(ml, lo);
      return chiudi(rng, testo, o(mr, cw, pr), [o(mm, cm, 0), o(mr, C(mr, l0), 100 * (C(mr, l0) / cn - 1)), o(hi + h * hi / c, C(hi + h * hi / c, hi), 100 * (C(hi + h * hi / c, hi) / cn - 1)), o(ml, cl, 100 * (cl / cn - 1))], sp,
        { lo: lo, hi: hi, c: c, h: h });
    }
  });

  /* ---------------------------------------------------------------- generatori nuovi di Modellazione PNL */
  gen({
    id: "nlpm-g-prodq-scorta", livello: "facile", capitolo: "production-quadratic",
    link: link("production-quadratic/#model", "produzione-quadratica/#modello"),
    prova: function (rng, L) {
      var d1 = 10 * ri(rng, 3, 8), d2 = d1 + 10 * ri(rng, 2, 6), h = pk(rng, [0.5, 1, 1.5, 2]);
      var g = pk(rng, [0.05, 0.1, 0.2, 0.25, 0.5, 1]);
      var D = d2 - d1, s = D / 2 - h / (8 * g);
      if (s <= 1) return null;
      var w1 = D / 2, w2 = D / 2 - h / (4 * g), w3 = D / 2 - h / (2 * g);
      var vals = [s, w1, w2, w3];
      for (var i = 0; i < vals.length; i++) if (quasiMezzo(vals[i], 2)) return null;
      if (w3 < 0) w3 = D - h / (8 * g);
      function o(v) { return "$\\tilde s_1 = " + m(v, 2, L) + "$"; }
      var testo = T(L,
        "Production with quadratic smoothing, one product and two months: demand $d_1 = " + d1 + "$ and $d_2 = " + d2 + "$, holding cost $h = " + m(h, 1, L) + "$ per unit, ample capacity, zero initial stock and weight $\\gamma = " + m(g, 2, L) + "$ on the squared jump $(x_2 - x_1)^2$. With $x_1 = d_1 + s_1$ and $x_2 = d_2 - s_1$, what is the optimal stock $\\tilde s_1$?",
        "Produzione con smoothing quadratico, un prodotto e due mesi: domanda $d_1 = " + d1 + "$ e $d_2 = " + d2 + "$, costo di giacenza $h = " + m(h, 1, L) + "$ per unità, capacità abbondante, scorta iniziale nulla e peso $\\gamma = " + m(g, 2, L) + "$ sul salto al quadrato $(x_2 - x_1)^2$. Con $x_1 = d_1 + s_1$ e $x_2 = d_2 - s_1$, quanto vale la scorta ottima $\\tilde s_1$?");
      var sp = T(L,
        "The jump is $" + D + " - 2s_1$ and the objective (up to constants) is $h s_1 + \\gamma(" + D + " - 2s_1)^2$. Stationarity: $h - 4\\gamma(" + D + " - 2s_1) = 0$, so $\\tilde s_1 = " + D + "/2 - h/(8\\gamma) = " + m(s, 2, L) + "$: stock is built until the marginal saving on the penalty equals the holding cost.",
        "Il salto è $" + D + " - 2s_1$ e l'obiettivo (a meno di costanti) è $h s_1 + \\gamma(" + D + " - 2s_1)^2$. Stazionarietà: $h - 4\\gamma(" + D + " - 2s_1) = 0$, quindi $\\tilde s_1 = " + D + "/2 - h/(8\\gamma) = " + m(s, 2, L) + "$: si accumula scorta finché il risparmio marginale sulla penalità uguaglia la giacenza.");
      return chiudi(rng, testo, o(s), [o(w1), o(w2), o(w3), o(s + 1)], sp, { d1: d1, d2: d2, h: h, g: g });
    }
  });

  gen({
    id: "nlpm-g-evq-due-ore", livello: "media", capitolo: "ev-charging-quadratic",
    link: link("ev-charging-quadratic/#model", "ricarica-ev-quadratica/#modello"),
    prova: function (rng, L) {
      var e = 2 * ri(rng, 4, 15), p1 = pk(rng, [0.06, 0.08, 0.1, 0.12]), p2 = p1 + pk(rng, [0.04, 0.06, 0.08, 0.1]);
      var g = pk(rng, [0.005, 0.01, 0.02, 0.05]);
      var x1 = e / 2 + (p2 - p1) / (8 * g);
      if (x1 >= e - 0.5) return null;
      var lam = (p1 + p2) / 2, x2 = e - x1;
      var vals = [x1, x2, lam * 100];
      for (var i = 0; i < vals.length; i++) if (quasiMezzo(vals[i], 2)) return null;
      function o(a, b) { return "$\\tilde x_1 = " + m(a, 2, L) + "$, $\\lambda = " + m(b, 3, L) + "$"; }
      var testo = T(L,
        "EV charging with a smooth profile, one vehicle and two hours: it needs $e = " + e + "$ kWh ($\\eta = 1$), prices $" + m(p1, 2, L) + "$ and $" + m(p2, 2, L) + "$ €/kWh, power limit large enough, zero base load, objective $\\pi_1 x_1 + \\pi_2 x_2 + \\gamma (x_2 - x_1)^2$ with $\\gamma = " + m(g, 3, L) + "$ and constraint $x_1 + x_2 \\ge " + e + "$. Both hours are used at the optimum. What are $\\tilde x_1$ and the multiplier $\\lambda$ of the energy constraint?",
        "Ricarica EV con profilo regolare, un veicolo e due ore: servono $e = " + e + "$ kWh ($\\eta = 1$), prezzi $" + m(p1, 2, L) + "$ e $" + m(p2, 2, L) + "$ €/kWh, limite di potenza abbastanza grande, carico di base nullo, obiettivo $\\pi_1 x_1 + \\pi_2 x_2 + \\gamma (x_2 - x_1)^2$ con $\\gamma = " + m(g, 3, L) + "$ e vincolo $x_1 + x_2 \\ge " + e + "$. All'ottimo si usano entrambe le ore. Quanto valgono $\\tilde x_1$ e il moltiplicatore $\\lambda$ del vincolo di energia?");
      var sp = T(L,
        "With $x_1 = " + e / 2 + " + d$ the objective is linear in $d$ with slope $" + m(p1 - p2, 2, L) + "$ plus $4\\gamma d^2$: $d = (\\pi_2 - \\pi_1)/(8\\gamma)$, so $\\tilde x_1 = " + m(x1, 2, L) + "$. Stationarity gives $\\pi_1 - 2\\gamma(x_2 - x_1) = \\lambda = \\pi_2 + 2\\gamma(x_2 - x_1)$, hence $\\lambda = (\\pi_1 + \\pi_2)/2 = " + m(lam, 3, L) + "$: the marginal kWh costs the average price.",
        "Con $x_1 = " + m(e / 2, 0, L) + " + d$ l'obiettivo è lineare in $d$ con pendenza $" + m(p1 - p2, 2, L) + "$ più $4\\gamma d^2$: $d = (\\pi_2 - \\pi_1)/(8\\gamma)$, quindi $\\tilde x_1 = " + m(x1, 2, L) + "$. La stazionarietà dà $\\pi_1 - 2\\gamma(x_2 - x_1) = \\lambda = \\pi_2 + 2\\gamma(x_2 - x_1)$, da cui $\\lambda = (\\pi_1 + \\pi_2)/2 = " + m(lam, 3, L) + "$: il kWh marginale costa la media dei prezzi.");
      return chiudi(rng, testo, o(x1, lam), [o(x1, p1), o(e, p1), o(e / 2 + (p2 - p1) / (4 * g), lam), o(x2, lam)], sp,
        { e: e, p1: p1, p2: p2, g: g });
    }
  });

  gen({
    id: "nlpm-g-ls-media", livello: "facile", capitolo: "least-squares",
    link: link("least-squares/#model", "minimi-quadrati/#modello"),
    prova: function (rng, L) {
      var n = 5, y = [];
      for (var i = 0; i < n; i++) y.push(ri(rng, 80, 160));
      var srt = sortNum(y);
      if (srt[0] === srt[1] || srt[3] === srt[4]) return null;
      var med = srt[2], mean = 0;
      for (var k = 0; k < n; k++) mean += y[k] / n;
      var ymax = srt[4], pi = 2 * (ymax - mean);
      if (Math.abs(mean - med) < 0.5 || quasiMezzo(mean, 2) || quasiMezzo(pi, 2)) return null;
      function o(b, p) { return "$\\tilde b = " + m(b, 2, L) + "$, $\\tilde\\pi = " + m(p, 2, L) + "$"; }
      var lista = y.join("; ");
      var testo = T(L,
        "Least squares without features: $\\min \\sum_i r_i^2$ subject to $b + r_i = y_i$, with $b$ and $r_i$ free, on the five observations $y = (" + lista.replace(/; /g, ", ") + ")$. What are the optimal intercept $\\tilde b$ and the multiplier $\\tilde\\pi$ of the constraint of the largest observation ($y = " + ymax + "$)?",
        "Minimi quadrati senza caratteristiche: $\\min \\sum_i r_i^2$ soggetto a $b + r_i = y_i$, con $b$ e $r_i$ liberi, sulle cinque osservazioni $y = (" + lista + ")$. Quanto valgono l'intercetta ottima $\\tilde b$ e il moltiplicatore $\\tilde\\pi$ del vincolo dell'osservazione più grande ($y = " + ymax + "$)?");
      var sp = T(L,
        "Stationarity in $b$ gives $\\sum_i r_i = 0$: $\\tilde b$ is the mean, $" + m(mean, 2, L) + "$. Stationarity in $r_i$ gives $\\pi_i = 2 r_i$: for $y = " + ymax + "$ the residual is $" + m(ymax - mean, 2, L) + "$ and $\\tilde\\pi = " + m(pi, 2, L) + "$. The median $" + med + "$ would be the optimum of absolute deviations.",
        "La stazionarietà rispetto a $b$ dà $\\sum_i r_i = 0$: $\\tilde b$ è la media, $" + m(mean, 2, L) + "$. Quella rispetto a $r_i$ dà $\\pi_i = 2 r_i$: per $y = " + ymax + "$ il residuo è $" + m(ymax - mean, 2, L) + "$ e $\\tilde\\pi = " + m(pi, 2, L) + "$. La mediana $" + med + "$ sarebbe l'ottimo degli scarti assoluti.");
      return chiudi(rng, testo, o(mean, pi), [o(med, 2 * (ymax - med)), o(mean, ymax - mean), o(med, pi), o(mean, 2 * (ymax - med))], sp,
        { y: y });
    }
  });
})();
