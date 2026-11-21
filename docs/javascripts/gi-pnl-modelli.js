/* Laboratorio di «Modellazione PNL / NLP Modelling»: i modelli dei capitoli, PURI (niente DOM).
 * Usano GI_OTT (gi-ott.js, comune con Modellazione PL) e i dati di GI_DATI_PNL (gi-pnl-dati.js, scritto da
 * genera_laboratorio.py dai CSV di dati/ e, per la panetteria, rigenerati con lo stesso seme dello script).
 * Si caricano anche in node per il test (python/test_laboratorio.py), che confronta i numeri con Gurobi.
 *
 *   markowitz(rbar, u, muMod)    cap. 6: QP min x'Qx, mu'x >= rbar, sum x = 1, 0 <= x <= u (insieme attivo)
 *   frontiera(u, muMod, k)       cap. 6: k punti della frontiera efficiente
 *   pricing(tipo, K, c)          cap. 7: prezzo ottimo con domanda lineare, a elasticità costante o logistica
 *   localizza(D, pesi)           cap. 9: min sum w_k d_k con d_k <= D (Weber con tetto; D grande = Weber)
 *   svm(X, y, C)                 cap. 12: SVM lineare a margine morbido (SMO sul duale)
 *   rette(t, y)                  cap. 13: minimi quadrati (QP) e scarti assoluti (LP)
 */
(function () {
  "use strict";
  const W = typeof window !== "undefined" ? window : globalThis;
  const O = () => W.GI_OTT, D = () => W.GI_DATI_PNL;

  // ---------------------------------------------------------------- cap. 6
  function statistiche(muMod) {
    const Mk = D().markowitz, mu = Mk.mu.slice();
    if (muMod) for (const [i, v] of Object.entries(muMod)) mu[+i] = v;
    return { mu, Q: Mk.Q, titoli: Mk.titoli };
  }
  function markowitz(rbar = null, u = 1, muMod = null) {
    const { mu, Q } = statistiche(muMod), n = mu.length;
    const H = Q.map((r) => r.map((v) => 2 * v)), g = new Array(n).fill(0);
    const Ain = [], bin = [];
    if (rbar != null) { Ain.push(mu.slice()); bin.push(rbar); }
    for (let i = 0; i < n; i++) { const a = new Array(n).fill(0); a[i] = 1; Ain.push(a); bin.push(0); }
    for (let i = 0; i < n; i++) { const a = new Array(n).fill(0); a[i] = -1; Ain.push(a); bin.push(-u); }
    const r = O().qp({ H, g, Aeq: [new Array(n).fill(1)], beq: [1], Ain, bin });
    if (r.stato !== "ottimo") return { stato: r.stato };
    const x = r.x.map((v) => (Math.abs(v) < 1e-10 ? 0 : v));
    const varianza = O().dot(x, Q.map((riga) => O().dot(riga, x)));
    return { stato: "ottimo", x, rend: O().dot(mu, x), vol: Math.sqrt(Math.max(0, varianza)), varianza,
      lamRend: rbar != null ? r.lamIn[0] : 0 };
  }
  /** rendimento massimo con 0 <= x <= u, sum x = 1: si riempiono i titoli dal rendimento più alto */
  function rendMax(mu, u) {
    const ord = mu.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    let resto = 1, r = 0;
    for (const [v] of ord) { const q = Math.min(u, resto); r += q * v; resto -= q; if (resto <= 1e-12) break; }
    return resto > 1e-9 ? null : r;
  }
  function frontiera(u = 1, muMod = null, k = 40) {
    const { mu } = statistiche(muMod), mv = markowitz(null, u, muMod), rmax = rendMax(mu, u);
    if (mv.stato !== "ottimo" || rmax == null) return [];
    const pts = [[mv.vol, mv.rend]];
    for (let j = 1; j <= k; j++) {
      const r = mv.rend + ((rmax * 0.999 - mv.rend) * j) / k, p = markowitz(r, u, muMod);
      if (p.stato === "ottimo") pts.push([p.vol, p.rend]);
    }
    return pts;
  }

  // ---------------------------------------------------------------- cap. 7
  function pricing(tipo = "lineare", K = null, c = null) {
    const P = D().pricing, KK = K == null ? P.K : K, cc = c == null ? P.c : c;
    let Dp, pFree, pK, pMax;
    if (tipo === "lineare") {
      Dp = (p) => Math.max(0, P.a - P.b * p); pMax = P.a / P.b;
      pFree = (P.a / P.b + cc) / 2; pK = KK < P.a ? (P.a - KK) / P.b : 0;
    } else if (tipo === "elasticita") {
      Dp = (p) => P.A * Math.pow(p, -P.eps); pMax = 400;
      pFree = (cc * P.eps) / (P.eps - 1); pK = Math.pow(P.A / KK, 1 / P.eps);
    } else {
      Dp = (p) => P.M / (1 + Math.exp(-P.alfa + P.beta * p)); pMax = 400;
      pFree = O().aureo((p) => -(p - cc) * Dp(p), Math.max(cc, 0), 400, 1e-10);
      pK = KK < P.M ? (P.alfa + Math.log(P.M / KK - 1)) / P.beta : 0;
    }
    const lo = tipo === "lineare" ? 0 : cc;
    const p = Math.min(pMax, Math.max(lo, pFree, pK));
    const q = Math.min(Dp(p), KK);
    return { tipo, p, q, profitto: (p - cc) * q, D: Dp, K: KK, c: cc, pFree, pK, vincolata: pK > pFree, pMax };
  }

  // ---------------------------------------------------------------- cap. 9
  function localizza(Dmax = Infinity, pesi = null) {
    const L = D().localizzazione, w = pesi || L.peso, xy = L.coord;
    const dist = (x, y) => xy.map(([a, b]) => Math.hypot(x - a, y - b));
    const f = (x, y) => {
      const d = dist(x, y);
      let s = 0, mx = 0;
      for (let k = 0; k < d.length; k++) { s += w[k] * d[k]; if (d[k] > mx) mx = d[k]; }
      return s + (isFinite(Dmax) ? 1e5 * Math.max(0, mx - Dmax) : 0);
    };
    const minY = (x) => { const y = O().aureo((y) => f(x, y), -2, 12, 1e-10); return [y, f(x, y)]; };
    const x = O().aureo((x) => minY(x)[1], -2, 12, 1e-10), y = minY(x)[0];
    const d = dist(x, y), mx = Math.max(...d);
    const tot = w.reduce((s, v) => s + v, 0);
    return { x, y, costo: d.reduce((s, v, k) => s + w[k] * v, 0), media: d.reduce((s, v, k) => s + w[k] * v, 0) / tot, max: mx, d,
      ammissibile: !isFinite(Dmax) || mx <= Dmax + 1e-4 };
  }
  /** minimax: min max_k d_k (il centro del cerchio minimo che contiene i quartieri) */
  function minimax() {
    const xy = D().localizzazione.coord, g = (x, y) => Math.max(...xy.map(([a, b]) => Math.hypot(x - a, y - b)));
    const minY = (x) => { const y = O().aureo((y) => g(x, y), -2, 12, 1e-11); return [y, g(x, y)]; };
    const x = O().aureo((x) => minY(x)[1], -2, 12, 1e-11), y = minY(x)[0];
    return { x, y, max: g(x, y) };
  }

  // ---------------------------------------------------------------- cap. 12-13
  const svm = (X, y, C) => O().svm(X, y, C);
  function rette(t, y) {
    const ls = O().minimiQuadrati(t, y), lad = O().quantileReg(t, y, 0.5);
    return { ls, lad };
  }

  W.GI_PNL = { markowitz, frontiera, rendMax, statistiche, pricing, localizza, minimax, svm, rette };
  if (typeof module !== "undefined" && module.exports) module.exports = W.GI_PNL;
})();
