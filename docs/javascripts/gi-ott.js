/* Risolutori e disegni comuni ai laboratori di «Modellazione PL / LP Modelling» e
 * «Modellazione PNL / NLP Modelling» (stesso file nei due moduli: l'originale sta in
 * CORSO_MODELLAZIONE_PL/it/docs/javascripts/gi-ott.js, genera_laboratorio.py lo copia).
 *
 * Parte 1, PURA (niente DOM, si carica anche in node per i test):
 *   GI_OTT.lp(problema)        simplesso a due fasi (tableau denso, regola di Bland):
 *                              {c, A, rel ("<=" | ">=" | "="), b, senso ("min" | "max")}, x >= 0;
 *                              restituisce {stato, x, z, y (prezzi ombra, convenzione di Gurobi),
 *                              rhsLo, rhsUp (intervallo del termine noto in cui y resta valido)}
 *   GI_OTT.qp(problema)        insieme attivo primale per un QP strettamente convesso:
 *                              min 1/2 x'Hx + g'x, Aeq x = beq, Ain x >= bin (punto di partenza dal simplesso)
 *   GI_OTT.svm(X, y, C)        SVM lineare a margine morbido, duale con SMO (scelta della coppia di LIBSVM)
 *   GI_OTT.aureo(f, a, b)      minimo di una funzione unimodale (sezione aurea)
 *   GI_OTT.cvar(costi, alfa)   CVaR empirico (Rockafellar-Uryasev) di scenari equiprobabili
 *   GI_OTT.quantileReg(t, y, tau)  regressione quantile con una caratteristica: il vertice ottimo
 *                              (una retta per due punti) per enumerazione, esatto
 * Parte 2, disegno (usa window.GI e GI_MIP, solo quando la si chiama):
 *   GI_OTT.pannello(crea, P, C)  un riquadro con assi, tacche e nomi: P = {X0, X1, Y0, Y1 (coordinate
 *                              della board), xa, xb, ya, yb (intervalli dei dati), nx, ny (nomi)};
 *                              restituisce P con le funzioni X(x), Y(y) dai dati alla board e inverse.
 */
(function () {
  "use strict";
  const W = typeof window !== "undefined" ? window : globalThis;
  const EPS = 1e-9;

  // ================================================================ simplesso
  function lp(pb) {
    const senso = pb.senso || "min";
    const n = pb.c.length, m = pb.b.length;
    const cmin = pb.c.map((v) => (senso === "max" ? -v : v));
    const rel = [], b = [], A = [], seg = [];
    for (let i = 0; i < m; i++) {
      let r = pb.rel[i], bi = pb.b[i], ai = pb.A[i].slice(), s = 1;
      if (bi < 0) { bi = -bi; ai = ai.map((v) => -v); s = -1; r = r === "<=" ? ">=" : r === ">=" ? "<=" : "="; }
      rel.push(r); b.push(bi); A.push(ai); seg.push(s);
    }
    // colonne: originali, poi scarto/surplus, poi artificiali
    let N = n;
    const colSc = new Array(m).fill(-1), colAr = new Array(m).fill(-1);
    for (let i = 0; i < m; i++) if (rel[i] !== "=") colSc[i] = N++;
    for (let i = 0; i < m; i++) if (rel[i] !== "<=") colAr[i] = N++;
    const T = [];
    const base = new Array(m);
    const ident = new Array(m);       // colonna dell'identità iniziale di ogni riga
    for (let i = 0; i < m; i++) {
      const riga = new Float64Array(N + 1);
      for (let j = 0; j < n; j++) riga[j] = A[i][j];
      if (colSc[i] >= 0) riga[colSc[i]] = rel[i] === "<=" ? 1 : -1;
      if (colAr[i] >= 0) riga[colAr[i]] = 1;
      riga[N] = b[i];
      T.push(riga);
      base[i] = rel[i] === "<=" ? colSc[i] : colAr[i];
      ident[i] = base[i];
    }
    const artif = (j) => j >= n && colAr.indexOf(j) >= 0;
    const vietate = new Uint8Array(N);
    function pivota(r, k) {
      const pr = T[r], v = pr[k];
      for (let j = 0; j <= N; j++) pr[j] /= v;
      for (let i = 0; i < m; i++) {
        if (i === r) continue;
        const f = T[i][k];
        if (f !== 0) { const ri = T[i]; for (let j = 0; j <= N; j++) ri[j] -= f * pr[j]; }
      }
      base[r] = k;
    }
    function ottimizza(costo) {
      for (let it = 0; it < 50000; it++) {
        // costi ridotti
        let k = -1;
        for (let j = 0; j < N; j++) {
          if (vietate[j] || base.indexOf(j) >= 0) continue;
          let d = costo[j];
          for (let i = 0; i < m; i++) d -= costo[base[i]] * T[i][j];
          if (d < -1e-10) { k = j; break; }   // Bland: il primo indice
        }
        if (k < 0) return "ottimo";
        let r = -1, best = Infinity;
        for (let i = 0; i < m; i++) {
          const a = T[i][k];
          if (a > 1e-11) {
            const q = T[i][N] / a;
            if (q < best - 1e-12 || (Math.abs(q - best) <= 1e-12 && base[i] < base[r])) { best = q; r = i; }
          }
        }
        if (r < 0) return "illimitato";
        pivota(r, k);
      }
      return "iterazioni";
    }
    // fase 1
    if (colAr.some((j) => j >= 0)) {
      const c1 = new Float64Array(N);
      for (let i = 0; i < m; i++) if (colAr[i] >= 0) c1[colAr[i]] = 1;
      ottimizza(c1);
      let w = 0;
      for (let i = 0; i < m; i++) w += c1[base[i]] * T[i][N];
      if (w > 1e-7 * (1 + b.reduce((s, v) => s + Math.abs(v), 0))) return { stato: "inammissibile" };
      // le artificiali escono dalla base dove possibile
      for (let i = 0; i < m; i++) {
        if (!artif(base[i])) continue;
        let k = -1;
        for (let j = 0; j < N; j++) if (!artif(j) && Math.abs(T[i][j]) > 1e-9) { k = j; break; }
        if (k >= 0) pivota(i, k);
      }
      for (let j = 0; j < N; j++) if (artif(j)) vietate[j] = 1;
    }
    // fase 2
    const c2 = new Float64Array(N);
    for (let j = 0; j < n; j++) c2[j] = cmin[j];
    const st = ottimizza(c2);
    if (st !== "ottimo") return { stato: st };
    const x = new Array(n).fill(0);
    for (let i = 0; i < m; i++) if (base[i] < n) x[base[i]] = T[i][N];
    let z = 0;
    for (let j = 0; j < n; j++) z += pb.c[j] * x[j];
    // prezzi ombra: y = c_B B^-1 (colonne dell'identità iniziale), poi segni
    const y = [], rhsLo = [], rhsUp = [];
    for (let r = 0; r < m; r++) {
      const col = ident[r];
      let s = 0;
      for (let i = 0; i < m; i++) s += c2[base[i]] * T[i][col];
      // la colonna di un surplus (>=) ha -1 nell'identità: qui si usa l'artificiale, che ha +1
      let yr = s * seg[r];
      if (senso === "max") yr = -yr;
      y.push(Math.abs(yr) < 1e-12 ? 0 : yr);
      // intervallo del termine noto (originale): x_B + delta * seg * B^-1 e_r >= 0
      let lo = -Infinity, up = Infinity;
      for (let i = 0; i < m; i++) {
        const d = T[i][col] * seg[r], xb = T[i][N];
        if (d > 1e-12) lo = Math.max(lo, -xb / d);
        else if (d < -1e-12) up = Math.min(up, -xb / d);
      }
      rhsLo.push(pb.b[r] + lo); rhsUp.push(pb.b[r] + up);
    }
    return { stato: "ottimo", x, z, y, rhsLo, rhsUp };
  }

  // ================================================================ algebra lineare
  /** risolve M v = r (eliminazione di Gauss con pivot parziale); null se singolare */
  function risolvi(M, r) {
    const n = r.length, A = M.map((riga, i) => [...riga, r[i]]);
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[p][k])) p = i;
      if (Math.abs(A[p][k]) < 1e-14) return null;
      [A[k], A[p]] = [A[p], A[k]];
      for (let i = k + 1; i < n; i++) {
        const f = A[i][k] / A[k][k];
        if (f) for (let j = k; j <= n; j++) A[i][j] -= f * A[k][j];
      }
    }
    const v = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let s = A[i][n];
      for (let j = i + 1; j < n; j++) s -= A[i][j] * v[j];
      v[i] = s / A[i][i];
    }
    return v;
  }
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

  // ================================================================ QP (insieme attivo)
  /** min 1/2 x'Hx + g'x  s.t.  Aeq x = beq,  Ain x >= bin  (H definita positiva).
   *  Restituisce {stato, x, f, lamEq, lamIn} (moltiplicatori: Hx + g = Aeq' lamEq + Ain' lamIn, lamIn >= 0). */
  function qp(pb) {
    const n = pb.H.length, Aeq = pb.Aeq || [], beq = pb.beq || [], Ain = pb.Ain || [], bin = pb.bin || [];
    // punto ammissibile: simplesso sulle variabili libere x = x+ - x-
    const A = [], rel = [], b = [];
    Aeq.forEach((a, i) => { A.push([...a, ...a.map((v) => -v)]); rel.push("="); b.push(beq[i]); });
    Ain.forEach((a, i) => { A.push([...a, ...a.map((v) => -v)]); rel.push(">="); b.push(bin[i]); });
    const f0 = lp({ c: new Array(2 * n).fill(0), A, rel, b, senso: "min" });
    if (f0.stato !== "ottimo") return { stato: "inammissibile" };
    let x = f0.x.slice(0, n).map((v, i) => v - f0.x[n + i]);
    const Wk = [];                     // indici dei vincoli >= attivi nel working set
    const grad = (x) => pb.H.map((riga, i) => dot(riga, x) + pb.g[i]);
    for (let it = 0; it < 500; it++) {
      const righe = [...Aeq, ...Wk.map((k) => Ain[k])], q = righe.length;
      const K = [];
      for (let i = 0; i < n; i++) K.push([...pb.H[i], ...righe.map((a) => -a[i])]);
      for (let r = 0; r < q; r++) K.push([...righe[r], ...new Array(q).fill(0)]);
      const gx = grad(x);
      const sol = risolvi(K, [...gx.map((v) => -v), ...new Array(q).fill(0)]);
      if (!sol) return { stato: "singolare" };
      const p = sol.slice(0, n), lam = sol.slice(n);
      if (Math.max(...p.map(Math.abs)) < 1e-11) {
        let peggio = -1, vmin = -1e-10;
        for (let r = Aeq.length; r < q; r++) if (lam[r] < vmin) { vmin = lam[r]; peggio = r - Aeq.length; }
        if (peggio < 0) {
          const lamIn = new Array(Ain.length).fill(0);
          Wk.forEach((k, r) => { lamIn[k] = lam[Aeq.length + r]; });
          const f = 0.5 * dot(x, pb.H.map((riga) => dot(riga, x))) + dot(pb.g, x);
          return { stato: "ottimo", x, f, lamEq: lam.slice(0, Aeq.length), lamIn };
        }
        Wk.splice(peggio, 1);
        continue;
      }
      let alfa = 1, blocca = -1;
      for (let k = 0; k < Ain.length; k++) {
        if (Wk.includes(k)) continue;
        const ap = dot(Ain[k], p);
        if (ap < -1e-13) {
          const t = (bin[k] - dot(Ain[k], x)) / ap;
          if (t < alfa) { alfa = Math.max(0, t); blocca = k; }
        }
      }
      x = x.map((v, i) => v + alfa * p[i]);
      if (blocca >= 0) Wk.push(blocca);
    }
    return { stato: "iterazioni" };
  }

  // ================================================================ SVM (SMO)
  /** SVM lineare a margine morbido: duale min 1/2 a'Qa - e'a, 0 <= a <= C, y'a = 0 (C scalare o vettore).
   *  Coppia di lavoro di LIBSVM (massima violazione); b come nello script: media su 0 < a < C. */
  function svm(X, y, C, tol = 1e-10) {
    const n = y.length, Ci = Array.isArray(C) ? C : new Array(n).fill(C);
    const K = (i, j) => X[i][0] * X[j][0] + X[i][1] * X[j][1];
    const a = new Float64Array(n), G = new Float64Array(n).fill(-1);
    const su = (t) => (y[t] > 0 ? a[t] < Ci[t] : a[t] > 0);
    const giu = (t) => (y[t] > 0 ? a[t] > 0 : a[t] < Ci[t]);
    let it = 0;
    for (; it < 200000; it++) {
      let i = -1, gmax = -Infinity, j = -1, gmin = Infinity;
      for (let t = 0; t < n; t++) {
        const v = -y[t] * G[t];
        if (su(t) && v > gmax) { gmax = v; i = t; }
        if (giu(t) && v < gmin) { gmin = v; j = t; }
      }
      if (i < 0 || j < 0 || gmax - gmin < tol) break;
      // aggiornamento analitico sulla coppia (i, j), come in LIBSVM
      const Qij = y[i] * y[j] * K(i, j);
      let quad = K(i, i) + K(j, j) - 2 * K(i, j);
      if (quad <= 0) quad = 1e-12;
      const ai0 = a[i], aj0 = a[j];
      if (y[i] !== y[j]) {
        const delta = (-G[i] - G[j]) / quad, diff = a[i] - a[j];
        a[i] += delta; a[j] += delta;
        if (diff > 0) { if (a[j] < 0) { a[j] = 0; a[i] = diff; } }
        else if (a[i] < 0) { a[i] = 0; a[j] = -diff; }
        if (diff > Ci[i] - Ci[j]) { if (a[i] > Ci[i]) { a[i] = Ci[i]; a[j] = Ci[i] - diff; } }
        else if (a[j] > Ci[j]) { a[j] = Ci[j]; a[i] = Ci[j] + diff; }
      } else {
        const delta = (G[i] - G[j]) / quad, sum = a[i] + a[j];
        a[i] -= delta; a[j] += delta;
        if (sum > Ci[i]) { if (a[i] > Ci[i]) { a[i] = Ci[i]; a[j] = sum - Ci[i]; } }
        else if (a[j] < 0) { a[j] = 0; a[i] = sum; }
        if (sum > Ci[j]) { if (a[j] > Ci[j]) { a[j] = Ci[j]; a[i] = sum - Ci[j]; } }
        else if (a[i] < 0) { a[i] = 0; a[j] = sum; }
      }
      const di = a[i] - ai0, dj = a[j] - aj0;
      for (let t = 0; t < n; t++) G[t] += y[t] * (y[i] * K(t, i) * di + y[j] * K(t, j) * dj);
      void Qij;
    }
    const w = [0, 0];
    for (let t = 0; t < n; t++) { w[0] += a[t] * y[t] * X[t][0]; w[1] += a[t] * y[t] * X[t][1]; }
    const tolA = 1e-7;
    const liberi = [];
    for (let t = 0; t < n; t++) if (a[t] > tolA * Ci[t] && a[t] < Ci[t] * (1 - tolA)) liberi.push(t);
    let b;
    if (liberi.length) b = liberi.reduce((s, t) => s + y[t] - (w[0] * X[t][0] + w[1] * X[t][1]), 0) / liberi.length;
    else {
      let lo = -Infinity, up = Infinity;
      for (let t = 0; t < n; t++) {
        const v = y[t] - (w[0] * X[t][0] + w[1] * X[t][1]);
        if (su(t)) (y[t] > 0 ? (lo = Math.max(lo, v)) : (up = Math.min(up, v)));
        if (giu(t)) (y[t] > 0 ? (up = Math.min(up, v)) : (lo = Math.max(lo, v)));
      }
      b = isFinite(lo) && isFinite(up) ? (lo + up) / 2 : isFinite(lo) ? lo : up;
    }
    const xi = [], marg = [];
    let obj = 0.5 * (w[0] * w[0] + w[1] * w[1]);
    for (let t = 0; t < n; t++) {
      const f = y[t] * (w[0] * X[t][0] + w[1] * X[t][1] + b);
      marg.push(f);
      xi.push(Math.max(0, 1 - f));
      obj += Ci[t] * Math.max(0, 1 - f);
    }
    return { w, b, alpha: Array.from(a), xi, marg, obj, iter: it };
  }

  // ================================================================ varie
  function aureo(f, a, b, tol = 1e-9) {
    const g = (Math.sqrt(5) - 1) / 2;
    let x1 = b - g * (b - a), x2 = a + g * (b - a), f1 = f(x1), f2 = f(x2);
    while (b - a > tol) {
      if (f1 <= f2) { b = x2; x2 = x1; f2 = f1; x1 = b - g * (b - a); f1 = f(x1); }
      else { a = x1; x1 = x2; f1 = f2; x2 = a + g * (b - a); f2 = f(x2); }
    }
    return (a + b) / 2;
  }
  /** CVaR_alfa di scenari equiprobabili: min_eta eta + E[(c - eta)^+]/(1 - alfa) */
  function cvar(costi, alfa) {
    const s = costi.slice().sort((u, v) => v - u), n = s.length;
    let coda = (1 - alfa) * n, tot = 0, k = 0;
    while (coda > 1e-12 && k < n) { const w = Math.min(1, coda); tot += w * s[k]; coda -= w; k++; }
    return tot / ((1 - alfa) * n);
  }
  /** VaR_alfa: il valore eta che realizza il minimo nella formula di Rockafellar-Uryasev */
  function vaR(costi, alfa) {
    const s = costi.slice().sort((u, v) => u - v);
    return s[Math.min(s.length - 1, Math.ceil(alfa * s.length - 1e-9) - 1)];
  }
  /** regressione quantile con una caratteristica: min sum rho_tau(y_i - w t_i - b).
   *  L'ottimo è un vertice: una retta per due punti con t diverso; si enumerano le coppie. */
  function quantileReg(t, y, tau) {
    const n = t.length;
    const perdita = (w, b) => {
      let s = 0;
      for (let i = 0; i < n; i++) { const r = y[i] - w * t[i] - b; s += r > 0 ? tau * r : (tau - 1) * r; }
      return s;
    };
    let best = null;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (Math.abs(t[i] - t[j]) < 1e-12) continue;
      const w = (y[j] - y[i]) / (t[j] - t[i]), b = y[i] - w * t[i], f = perdita(w, b);
      if (!best || f < best.f - 1e-9) best = { w, b, f, i, j };
    }
    if (!best) { const yy = y.slice().sort((u, v) => u - v); best = { w: 0, b: yy[Math.floor(tau * n)], f: perdita(0, yy[Math.floor(tau * n)]) }; }
    return best;
  }
  /** minimi quadrati con una caratteristica (equazioni normali) */
  function minimiQuadrati(t, y) {
    const n = t.length, mt = t.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n;
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (t[i] - mt) * (y[i] - my); sxx += (t[i] - mt) ** 2; }
    const w = sxy / sxx, b = my - w * mt;
    let f = 0;
    for (let i = 0; i < n; i++) f += (y[i] - w * t[i] - b) ** 2;
    return { w, b, f };
  }

  // ================================================================ disegno
  /** tacche «belle» per l'intervallo [a, b] */
  function tacche(a, b, quante = 5) {
    const grezzo = (b - a) / quante, e = Math.pow(10, Math.floor(Math.log10(grezzo)));
    const f = grezzo / e, passo = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * e;
    const out = [];
    for (let v = Math.ceil(a / passo - 1e-9) * passo; v <= b + 1e-9 * passo; v += passo) out.push(Math.abs(v) < passo * 1e-9 ? 0 : v);
    return { valori: out, passo };
  }
  function pannello(crea, P, C, opz = {}) {
    const GI = W.GI, M = W.GI_MIP;
    const X = (x) => P.X0 + ((x - P.xa) / (P.xb - P.xa)) * (P.X1 - P.X0);
    const Y = (y) => P.Y0 + ((y - P.ya) / (P.yb - P.ya)) * (P.Y1 - P.Y0);
    const iX = (u) => P.xa + ((u - P.X0) / (P.X1 - P.X0)) * (P.xb - P.xa);
    const iY = (v) => P.ya + ((v - P.Y0) / (P.Y1 - P.Y0)) * (P.yb - P.ya);
    if (crea) {
      const fs = opz.fontSize || 11, cifre = (p) => Math.max(0, -Math.floor(Math.log10(p) + 1e-9));
      const tx = tacche(P.xa, P.xb, opz.nTx || 6), ty = tacche(P.ya, P.yb, opz.nTy || 4);
      const dx = (P.X1 - P.X0) * 0.012, dy = (P.Y1 - P.Y0) * 0.03;
      for (const v of ty.valori) {
        M.linea(crea, P.X0, Y(v), P.X1, Y(v), { strokeColor: C.line, strokeWidth: 1 });
        M.scritta(crea, P.X0 - dx, Y(v), (opz.fy || ((u) => GI.numTxt(u, cifre(ty.passo))))(v), { anchorX: "right", fontSize: fs, strokeColor: C.muted });
      }
      for (const v of (opz.nTx === 0 ? [] : tx.valori)) {
        M.linea(crea, X(v), P.Y0, X(v), P.Y0 - dy * 0.6, { strokeColor: C.muted, strokeWidth: 1 });
        M.scritta(crea, X(v), P.Y0 - dy * 1.1, (opz.fx || ((u) => GI.numTxt(u, cifre(tx.passo))))(v), { anchorY: "top", fontSize: fs, strokeColor: C.muted });
      }
      M.linea(crea, P.X0, P.Y0, P.X1, P.Y0, { strokeColor: C.muted, strokeWidth: 1.2 });
      M.linea(crea, P.X0, P.Y0, P.X0, P.Y1, { strokeColor: C.muted, strokeWidth: 1.2 });
      if (P.nx) M.scritta(crea, P.X1, P.Y0 + 5, P.nx, { anchorX: "right", anchorY: "bottom", fontSize: fs + 1, strokeColor: C.muted });
      if (P.ny) M.scritta(crea, P.X0 + dx, P.Y1, P.ny, { anchorX: "left", anchorY: "top", fontSize: fs + 1, strokeColor: C.muted });
    }
    return Object.assign({}, P, { X, Y, iX, iY });
  }

  // ================================================================ ricette «a voci»
  /** Una ricetta del motore costruita da una o più VOCI (modelli diversi), con i pulsanti delle voci
   *  in alto a destra e cursori propri di ogni voce (il motore ha cursori fissi: qui si riconfigurano).
   *  voce = { etichetta (HTML del pulsante), cursori: [{nome (TeX), min, max, step, val, fmt(v) -> testo,
   *           descr}], calcola(v, st) -> R (v = valori dei cursori), disegna(crea, R, v, C, S, st)
   *           (S = {W, H} pixel della board: le coordinate della board SONO pixel, y verso l'alto),
   *           formula(R, v, st), letture(R, v, st, C), legenda(C, st), domanda }
   *  opz = { titolo, etichetta (sopra i pulsanti), domanda (se la voce non ne ha una), iniziale } */
  function ricettaVoci(opz, voci) {
    const GI = W.GI, M = W.GI_MIP;
    const nC = Math.max(...Object.values(voci).map((v) => v.cursori.length));
    const parametri = [];
    for (let i = 0; i < nC; i++) parametri.push({ k: "s" + i, nome: "s_" + i, min: 0, max: 100, step: 1, val: 50, colore: "abcde"[i] });
    const voce = (st) => voci[st.chiave()] || Object.values(voci)[0];
    const valori = (st) => { const p = st.p(); return voce(st).cursori.map((c, i) => p["s" + i]); };
    function configura(st) {
      const D = st.dati, tema = M.scuro(), vc = voce(st);
      const cambioTema = D.tema !== undefined && D.tema !== tema && D.chiave === st.chiave();
      D.tema = tema;
      const nuovo = !cambioTema;
      D.chiave = st.chiave();
      // fuori dalle pagine del laboratorio (home), su telefono la board è più alta
      const bEl = st.el.querySelector(".gi-board");
      if (bEl && !st.el.classList.contains("gi-app-intera")) bEl.style.aspectRatio = W.innerWidth < 600 ? "4 / 5" : "";
      st.el.querySelectorAll(".gi-ctrl").forEach((ctrl, i) => {
        const c = vc.cursori[i];
        if (!c) { ctrl.hidden = true; return; }
        ctrl.hidden = false;
        const inp = ctrl.querySelector("input");
        inp.min = c.min; inp.max = c.max; inp.step = c.step;
        if (nuovo) inp.value = c.val;
        const nome = ctrl.querySelector(".gi-nome");
        if (nome.dataset.tex !== c.nome) { nome.dataset.tex = c.nome; nome.innerHTML = GI.mj(`\\(${c.nome}\\)`); GI.typeset(nome); }
        const val = ctrl.querySelector(".gi-val");
        if (val) val.style.display = "none";
        let mio = ctrl.querySelector(".gi-val-voce");
        if (!mio) { mio = GI.h("span", { class: "gi-val gi-val-voce" }); ctrl.querySelector(".gi-riga > span:last-child").append(mio); }
        let sm = ctrl.querySelector("small");
        if (!sm) { sm = GI.h("small"); ctrl.append(sm); }
        if (sm.dataset.testo !== (c.descr || "")) { sm.dataset.testo = c.descr || ""; sm.innerHTML = GI.mj(c.descr || ""); GI.typeset(sm); }
      });
      if (!D.ro && W.ResizeObserver) {
        const el = st.el.querySelector(".gi-board");
        D.ro = new ResizeObserver(() => {
          clearTimeout(D.roT);
          D.roT = setTimeout(() => { if (document.body.contains(st.el)) st.aggiorna(); else D.ro.disconnect(); }, 120);
        });
        D.ro.observe(el);
      }
    }
    function risultato(st) {
      const v = valori(st), firma = st.chiave() + "|" + v.join(",");
      if (st.dati.R && st.dati.Rf === firma) return st.dati.R;
      st.dati.Rf = firma;
      st.dati.R = voce(st).calcola(v, st);
      return st.dati.R;
    }
    function misura(board) {
      const cont = board.containerObj;
      if (cont && cont.clientWidth > 0 && cont.clientHeight > 0 &&
        (Math.abs(cont.clientWidth - board.canvasWidth) > 1 || Math.abs(cont.clientHeight - board.canvasHeight) > 1)) {
        board.resizeContainer(cont.clientWidth, cont.clientHeight, true, true);
      }
      const Wp = board.canvasWidth || 600, Hp = board.canvasHeight || 400;
      const bb = board.getBoundingBox();
      if (Math.abs(bb[0]) > 1e-9 || Math.abs(bb[1] - Hp) > 1e-6 || Math.abs(bb[2] - Wp) > 1e-6 || Math.abs(bb[3]) > 1e-9) board.setBoundingBox([0, Hp, Wp, 0], false);
      return { W: Wp, H: Hp };
    }
    const R = {
      titolo: opz.titolo,
      parametri,
      vista: [0, 300, 400, 0],
      assi: false,
      opzioniBoard: M.OPZ,
      monta(board, st) { st.dati.R = null; configura(st); },
      aggiorna(board, st) {
        const vc = voce(st), v = valori(st), Rr = risultato(st), C = M.COL(st), S = misura(board);
        st.el.querySelectorAll(".gi-ctrl").forEach((ctrl, i) => {
          const c = vc.cursori[i], mio = ctrl.querySelector(".gi-val-voce");
          if (c && mio) mio.textContent = c.fmt ? c.fmt(v[i]) : GI.numTxt(v[i], 2);
        });
        M.ridisegna(board, st, [st.chiave(), v.join(","), M.scuro(), S.W, S.H, st.dati.extra || ""].join("|"),
          (crea) => vc.disegna(crea, Rr, v, C, S, st, board));
      },
      formula(p, st) { const vc = voce(st); return vc.formula ? vc.formula(risultato(st), valori(st), st) : ""; },
      letture(p, st) { const vc = voce(st); return vc.letture ? vc.letture(risultato(st), valori(st), st, M.COL(st)) : ""; },
      legenda(st) { const vc = voce(st); return vc.legenda ? vc.legenda(M.COL(st), st) : []; },
      domanda: opz.domanda || "",
    };
    if (Object.keys(voci).length > 1) {
      R.funzioni = voci;
      R.etichettaFunzioni = opz.etichetta || GI.T("Modello", "Model");
      if (opz.iniziale) R.iniziale = opz.iniziale;
    } else {
      // una voce sola: niente pulsanti
      const k = Object.keys(voci)[0];
      R.funzioni = null;
      const vc = voci[k];
      voce.unico = vc;
    }
    // la domanda «Prova tu» della voce scelta (il motore ne mostra una per ricetta: si riscrive)
    const vecchiaLettura = R.letture;
    R.letture = (p, st) => {
      const vc = voce(st), box = st.el.querySelector(".gi-domanda");
      if (box && vc.domanda && box.dataset.voce !== st.chiave() + "") {
        box.dataset.voce = st.chiave() + "";
        box.innerHTML = GI.mj(`<strong>${GI.T("Prova tu.", "Try it.")}</strong> ${vc.domanda}`);
        GI.typeset(box);
      }
      return vecchiaLettura(p, st);
    };
    if (!R.domanda) R.domanda = " ";
    return R;
  }

  /** barre impilate: per ogni gruppo una colonna di segmenti [valore, colore] a partire da 0 */
  function barre(crea, P, gruppi, larg, attr = {}) {
    const M = W.GI_MIP;
    gruppi.forEach(({ x, pezzi }) => {
      let y0 = 0;
      for (const [v, col] of pezzi) {
        if (v > 1e-9) M.rett(crea, P.X(x - larg / 2), P.Y(y0), P.X(x + larg / 2), P.Y(y0 + v),
          Object.assign({ fillColor: col, fillOpacity: 0.8, strokeColor: col, strokeWidth: 0.5 }, attr));
        y0 += v;
      }
    });
  }

  /** Ricetta «retta sui dati della panetteria» con i punti trascinabili (regressione LP e minimi quadrati).
   *  opz = { titolo, dati() -> {temperatura, domanda, sciopero}, parametri, rette(t, y, p, C) -> [{w, b, colore,
   *          nome, stile}], appoggio(rette) -> indici da cerchiare, modifica(y, p, info) (facoltativa: cambia i dati
   *          prima del calcolo, es. sposta un giorno), formula(p, st), letture(rette, p, {t, y, info}, C), domanda } */
  function ricettaRetta(opz) {
    const GI = W.GI, M = W.GI_MIP, T = GI.T;
    const voci = {
      tutti: { etichetta: T("60 giorni (con 5 scioperi)", "60 days (with 5 strikes)") },
      normali: { etichetta: T("55 giorni normali", "55 normal days") },
    };
    function iniziali(st) {
      const d = opz.dati(), tieni = d.sciopero.map((s) => st.chiave() === "tutti" || !s);
      return d.temperatura.map((t, i) => ({ t, y: d.domanda[i], sciopero: !!d.sciopero[i], i })).filter((q, i) => tieni[i]);
    }
    function calcolo(st) {
      const D = st.dati, p = st.p(), C = M.COL(st);
      const t = D.punti.map((q) => q.P ? q.P.X() : q.t), y = D.punti.map((q) => q.P ? q.P.Y() : q.y);
      const info = { sciopero: D.punti.map((q) => q.sciopero) };
      if (opz.modifica) opz.modifica(y, p, info, t);
      const firma = t.join(",") + "|" + y.join(",") + "|" + JSON.stringify(p) + "|" + M.scuro();
      if (D.calc && D.calc.firma === firma) return D.calc;
      D.calc = { firma, t, y, info, rette: opz.rette(t, y, p, C) };
      return D.calc;
    }
    return {
      titolo: opz.titolo,
      funzioni: voci,
      etichettaFunzioni: T("Dati", "Data"),
      parametri: opz.parametri,
      vista: [5.6, 248, 37, -22],
      assi: false,
      legenda: (st) => {
        const C = M.COL(st), r = calcolo(st).rette;
        return [[C.b, T("giorni normali", "normal days"), "punto"], ...(st.chiave() === "tutti" ? [[C.rosso, T("giorni di sciopero", "strike days"), "punto"]] : []),
          ...r.map((q) => [q.colore, q.nome, q.stile && q.stile.dash ? "dashed" : ""])];
      },
      monta(board, st) {
        const D = st.dati, tema = M.scuro(), C = M.COL(st);
        const cambioTema = D.tema !== undefined && D.tema !== tema && D.chiave === st.chiave();
        D.tema = tema;
        if (!cambioTema || !D.punti) { D.punti = iniziali(st); D.chiave = st.chiave(); }
        D.calc = null;
        const ax = { strokeColor: C.muted, highlight: false, ticks: { strokeColor: C.line, majorHeight: -1, insertTicks: false, ticksDistance: 0, label: { strokeColor: C.muted } } };
        board.create("axis", [[7.5, 0], [8.5, 0]], Object.assign({}, ax, { ticks: Object.assign({}, ax.ticks, { ticksDistance: 2, minorTicks: 0 }) }));
        board.create("axis", [[7.5, 0], [7.5, 1]], Object.assign({}, ax, { ticks: Object.assign({}, ax.ticks, { ticksDistance: 50, minorTicks: 0 }) }));
        board.create("text", [36.6, -4, T("temperatura (°C)", "temperature (°C)")], { anchorX: "right", anchorY: "top", fixed: true, highlight: false, fontSize: 12, strokeColor: C.muted });
        board.create("text", [7.8, 244, T("domanda (pezzi)", "demand (pieces)")], { anchorX: "left", anchorY: "top", fixed: true, highlight: false, fontSize: 12, strokeColor: C.muted });
        const prima = calcolo(st).rette;
        prima.forEach((r, k) => board.create("functiongraph", [(x) => { const q = calcolo(st).rette[k]; return q.w * x + q.b; }],
          Object.assign({ strokeColor: r.colore, strokeWidth: 3, highlight: false, fixed: true }, r.stile || {})));
        // punti di appoggio (cerchiati)
        for (let k = 0; k < 4; k++) board.create("point", [
          () => { const c = calcolo(st), a = opz.appoggio ? opz.appoggio(c.rette) : []; return a[k] != null ? c.t[a[k]] : NaN; },
          () => { const c = calcolo(st), a = opz.appoggio ? opz.appoggio(c.rette) : []; return a[k] != null ? c.y[a[k]] : NaN; }],
          { name: "", fixed: true, size: 9, fillColor: "none", fillOpacity: 0, strokeColor: C.c, strokeWidth: 2.5, highlight: false, showInfobox: false, withLabel: false });
        D.punti.forEach((q) => {
          q.P = board.create("point", [q.t, q.y], {
            name: "", size: q.sciopero ? 4 : 3, face: q.sciopero ? "x" : "o", strokeColor: q.sciopero ? C.rosso : C.b, fillColor: q.sciopero ? C.rosso : C.b,
            strokeWidth: q.sciopero ? 3 : 1, showInfobox: false, withLabel: false, highlightStrokeColor: C.a, highlightFillColor: C.a,
          });
          q.P.on("drag", () => { q.t = q.P.X(); q.y = q.P.Y(); });
        });
      },
      formula: (p, st) => opz.formula(p, st),
      letture: (p, st) => { const c = calcolo(st); return opz.letture(c.rette, p, c, M.COL(st)); },
      domanda: opz.domanda,
    };
  }

  W.GI_OTT = { lp, qp, svm, aureo, cvar, vaR, quantileReg, minimiQuadrati, risolvi, dot, tacche, pannello, ricettaVoci, ricettaRetta, barre, EPS };
  if (typeof module !== "undefined" && module.exports) module.exports = W.GI_OTT;
})();
