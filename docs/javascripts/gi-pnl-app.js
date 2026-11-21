/* Laboratorio di «Modellazione PNL / NLP Modelling»: le ricette delle app.
 *
 *   pnl-modelli         (home) tre modelli a voci: Markowitz, pricing, localizzazione
 *   pnl-markowitz       cap. 6: portafoglio ottimo e frontiera efficiente (QP, insieme attivo)
 *   pnl-pricing         cap. 7: prezzo ottimo con tre funzioni di domanda e la capienza
 *   pnl-localizzazione  cap. 9: Weber con un tetto sulla distanza massima
 *   pnl-svm             cap. 12: SVM lineare, punti trascinabili, margine e vettori di supporto
 *   pnl-minimi-quadrati cap. 13: minimi quadrati (QP) contro scarti assoluti (LP), punti trascinabili
 *
 * Modelli puri in gi-pnl-modelli.js; risolutori e ricette «a voci» in gi-ott.js (comune con Modellazione PL).
 * python/test_laboratorio.py confronta i numeri con Gurobi.
 */
(function () {
  "use strict";
  const GI = window.GI, M = window.GI_MIP, O = window.GI_OTT, NL = () => window.GI_PNL, DD = () => window.GI_DATI_PNL;
  const T = GI.T;
  window.GI_RICETTE = window.GI_RICETTE || {};
  const n = (x, c = 1) => GI.num(x, c), nt = (x, c = 1) => GI.numTxt(x, c);
  const pc = (x, c = 1) => nt(100 * x, c) + "%";
  const euro = (x, c = 0) => nt(x, c) + " €";
  const mg = (S, alto = 22, basso = 40) => ({ X0: 58, X1: S.W - 14, alto, basso });

  // ================================================================ Markowitz (cap. 6)
  const TITOLO = (C) => [C.a, C.b, C.c, C.d, C.e, C.viola, C.blu, C.grigio];
  const iENE = 0;
  const vMarkowitz = {
    etichetta: T("Portafoglio di Markowitz", "Markowitz portfolio"),
    cursori: [
      { nome: "\\bar r", min: 5, max: 20.5, step: 0.1, val: 15, fmt: (x) => nt(x, 1) + "%",
        descr: T("rendimento atteso minimo richiesto (annuo)", "minimum required expected return (annual)") },
      { nome: "u", min: 15, max: 100, step: 5, val: 100, fmt: (x) => nt(x, 0) + "%",
        descr: T("quota massima in un solo titolo", "maximum share in a single asset") },
      { nome: "\\mu_{\\mathrm{ENE}}", min: 5, max: 25, step: 0.5, val: 19, fmt: (x) => nt(x, 1) + "%",
        descr: T("rendimento atteso del titolo ENE (dai dati: 19,1%)", "expected return of ENE (from the data: 19.1%)") },
    ],
    calcola(v) {
      const muMod = Math.abs(v[2] - 19) < 1e-9 ? null : { [iENE]: v[2] / 100 };
      const st = NL().statistiche(muMod), u = v[1] / 100;
      const port = NL().markowitz(v[0] / 100, u, muMod), mv = NL().markowitz(null, u, muMod);
      const fr = NL().frontiera(u, muMod, 40), fr0 = u < 1 ? NL().frontiera(1, muMod, 40) : null;
      const eq = st.mu.map(() => 1 / st.mu.length);
      const veq = Math.sqrt(O.dot(eq, st.Q.map((r) => O.dot(r, eq))));
      return { port, mv, fr, fr0, st, eq: { vol: veq, rend: O.dot(st.mu, eq) }, rmax: NL().rendMax(st.mu, u), u };
    },
    formula(R, v, st) {
      return `\\min\\ x^\\top Q\\, x\\quad \\mu^\\top x \\ge ${st.col("a", "\\bar r")},\\ \\ \\sum_i x_i = 1,\\ \\ 0 \\le x_i \\le ${st.col("b", "u")}`;
    },
    disegna(crea, R, v, C, S) {
      const m = mg(S);
      const P = O.pannello(crea, { X0: m.X0, X1: m.X1, Y0: m.basso, Y1: S.H - m.alto, xa: 0, xb: 32, ya: 0, yb: 25,
        nx: T("volatilità annua (%)", "annual volatility (%)"), ny: T("rendimento atteso annuo (%)", "expected annual return (%)") }, C, { nTx: 8, nTy: 5 });
      const linea = (pts, attr) => pts.length > 1 && crea("curve", [pts.map((q) => P.X(100 * q[0])), pts.map((q) => P.Y(100 * q[1]))], Object.assign({ fixed: true, highlight: false }, attr));
      if (R.fr0) linea(R.fr0, { strokeColor: C.grigio, strokeWidth: 1.8, dash: 2 });
      linea(R.fr, { strokeColor: C.blu, strokeWidth: 3 });
      // rendimento richiesto
      M.linea(crea, P.X(0), P.Y(v[0]), P.X(32), P.Y(v[0]), { strokeColor: C.a, strokeWidth: 1.2, dash: 1 });
      const vol = R.st.Q.map((r, i) => Math.sqrt(r[i]));
      R.st.mu.forEach((mu, i) => {
        M.pallino(crea, P.X(100 * vol[i]), P.Y(100 * mu), { size: 4, fillColor: TITOLO(C)[i], strokeColor: "#ffffff", strokeWidth: 1 });
        M.scritta(crea, P.X(100 * vol[i]) + 6, P.Y(100 * mu), R.st.titoli[i], { anchorX: "left", fontSize: 11, strokeColor: C.muted });
      });
      M.pallino(crea, P.X(100 * R.eq.vol), P.Y(100 * R.eq.rend), { size: 5, face: "diamond", fillColor: C.viola, strokeColor: C.viola });
      if (R.mv.stato === "ottimo") M.pallino(crea, P.X(100 * R.mv.vol), P.Y(100 * R.mv.rend), { size: 7, face: "x", strokeColor: C.rosso, strokeWidth: 3 });
      if (R.port.stato === "ottimo") {
        M.pallino(crea, P.X(100 * R.port.vol), P.Y(100 * R.port.rend), { size: 8, fillColor: C.a, strokeColor: "#ffffff", strokeWidth: 2 });
        M.scritta(crea, P.X(100 * R.port.vol) - 10, P.Y(100 * R.port.rend) + 14, T("ottimo", "optimum"), { anchorX: "right", anchorY: "bottom", fontSize: 13, strokeColor: C.a, cssStyle: "font-weight:700" });
      }
    },
    legenda: (C) => [[C.blu, T("frontiera efficiente", "efficient frontier"), ""], [C.grigio, T("frontiera senza limite \\(u\\)", "frontier without the limit \\(u\\)"), "dashed"],
      [C.a, T("portafoglio ottimo", "optimal portfolio"), "punto"], [C.rosso, T("minima varianza", "minimum variance"), "punto"], [C.viola, T("equipesato \\(1/n\\)", "equally weighted \\(1/n\\)"), "punto"]],
    letture(R, v, st, C) {
      if (R.port.stato !== "ottimo") return M.tinta(C.rosso, T("Inammissibile: ", "Infeasible: ")) +
        T(`con \\(u = ${n(R.u * 100, 0)}\\%\\) il rendimento massimo è ${pc(R.rmax || 0, 2)}.`, `with \\(u = ${n(R.u * 100, 0)}\\%\\) the maximum return is ${pc(R.rmax || 0, 2)}.`);
      const x = R.port.x, col = TITOLO(C);
      const barra = `<div style="display:flex;height:16px;border-radius:4px;overflow:hidden;margin:.3em 0">` +
        x.map((q, i) => (q > 1e-4 ? `<span title="${R.st.titoli[i]}" style="width:${100 * q}%;background:${col[i]}"></span>` : "")).join("") + `</div>`;
      const attivo = R.port.rend <= v[0] / 100 + 1e-7;
      return `<div>${T("Rendimento", "Return")} <b>${pc(R.port.rend, 2)}</b> · ${T("volatilità", "volatility")} <b>${pc(R.port.vol, 2)}</b></div>` + barra +
        `<div style="font-size:.92em">${x.map((q, i) => (q > 1e-4 ? `<span style="color:${col[i]};font-weight:700">${R.st.titoli[i]}</span> ${pc(q, 1)}` : "")).filter(Boolean).join(" · ")}</div>` +
        `<div style="margin-top:.3em">${attivo ? T(`Il vincolo di rendimento è attivo: il moltiplicatore \\(${n(R.port.lamRend, 3)}\\) misura quanta varianza costa un punto di rendimento in più.`,
          `The return constraint is active: the multiplier \\(${n(R.port.lamRend, 3)}\\) measures how much variance one more unit of return costs.`)
          : T("Il vincolo di rendimento non è attivo: il portafoglio a minima varianza rende già abbastanza.", "The return constraint is not active: the minimum-variance portfolio already returns enough.")}</div>`;
    },
    domanda: T("Porta \\(\\bar r\\) da 5% a 20% con ▶: dove il vincolo di rendimento comincia a contare? Con \\(u = 30\\%\\) la frontiera si accorcia e si sposta a destra: perché? Abbassa \\(\\mu_{\\mathrm{ENE}}\\): che fine fa ENE nel portafoglio?",
      "Take \\(\\bar r\\) from 5% to 20% with ▶: where does the return constraint start to matter? With \\(u = 30\\%\\) the frontier gets shorter and moves right: why? Lower \\(\\mu_{\\mathrm{ENE}}\\): what happens to ENE in the portfolio?"),
  };

  // ================================================================ pricing (cap. 7)
  const DOMANDE = {
    lineare: [T("lineare", "linear"), "D(p) = a - b\\,p"],
    elasticita: [T("elasticità costante", "constant elasticity"), "D(p) = A\\,p^{-\\varepsilon}"],
    logistica: [T("logistica", "logistic"), "D(p) = M/(1 + e^{-\\alpha + \\beta p})"],
  };
  const vPricing = (tipo, etichetta) => ({
    etichetta: etichetta || DOMANDE[tipo][0],
    cursori: [
      { nome: "K", min: 150, max: 900, step: 10, val: 400, fmt: (x) => nt(x, 0) + T(" posti", " seats"), descr: T("capienza del teatro", "capacity of the theatre") },
      { nome: "c", min: 0, max: 80, step: 1, val: 20, fmt: (x) => euro(x), descr: T("costo per spettatore", "cost per spectator") },
    ],
    calcola(v) {
      const R = NL().pricing(tipo, v[0], v[1]), ps = [];
      for (let k = 0; k <= 220; k++) ps.push(20 + k);
      R.curva = ps.map((p) => [p, (p - R.c) * Math.min(R.D(p), R.K), (p - R.c) * R.D(p), R.D(p)]);
      return R;
    },
    formula(R, v, st) {
      return `\\max_{p,\\,q}\\ (p - ${st.col("b", "c")})\\, q\\quad q \\le ${DOMANDE[tipo][1]},\\ \\ q \\le ${st.col("a", "K")},\\ \\ p, q \\ge 0`;
    },
    disegna(crea, R, v, C, S) {
      const m = mg(S, 22, 38), hTop = (S.H - m.alto - m.basso) * 0.6, gap = 38;
      const vis = R.curva.map((r) => r[1]);
      const ymax = Math.max(...vis, R.profitto) * 1.18 / 1000;
      const top = O.pannello(crea, { X0: m.X0, X1: m.X1, Y0: S.H - m.alto - hTop, Y1: S.H - m.alto, xa: 20, xb: 240, ya: 0, yb: Math.max(ymax, 1),
        ny: T("profitto (migliaia di €)", "profit (thousand €)") }, C, { nTx: 0, nTy: 4 });
      const curva = (P, k, scala, attr) => crea("curve", [R.curva.map((r) => P.X(r[0])), R.curva.map((r) => (r[k] / scala >= P.ya && r[k] / scala <= P.yb ? P.Y(r[k] / scala) : NaN))], Object.assign({ fixed: true, highlight: false }, attr));
      curva(top, 2, 1000, { strokeColor: C.grigio, strokeWidth: 1.8, dash: 2 });
      curva(top, 1, 1000, { strokeColor: C.b, strokeWidth: 3 });
      M.linea(crea, top.X(R.p), top.Y(0), top.X(R.p), top.Y(R.profitto / 1000), { strokeColor: C.blu, strokeWidth: 1.5, dash: 1 });
      M.pallino(crea, top.X(R.p), top.Y(R.profitto / 1000), { size: 6, fillColor: C.blu, strokeColor: "#ffffff", strokeWidth: 1.5 });
      M.scritta(crea, top.X(R.p) + 8, top.Y(R.profitto / 1000) + 8, `p* = ${euro(R.p, 2)}`, { anchorX: "left", anchorY: "bottom", fontSize: 13, strokeColor: C.blu, cssStyle: "font-weight:700" });
      const dmax = Math.max(R.K, ...R.curva.map((r) => Math.min(r[3], 1500))) * 1.1;
      const bot = O.pannello(crea, { X0: m.X0, X1: m.X1, Y0: m.basso, Y1: S.H - m.alto - hTop - gap, xa: 20, xb: 240, ya: 0, yb: Math.min(dmax, 1500),
        nx: T("prezzo p (€)", "price p (€)"), ny: T("domanda (biglietti)", "demand (tickets)") }, C, { nTx: 11, nTy: 3 });
      curva(bot, 3, 1, { strokeColor: C.c, strokeWidth: 2.5 });
      M.linea(crea, bot.X(20), bot.Y(R.K), bot.X(240), bot.Y(R.K), { strokeColor: C.rosso, strokeWidth: 2, dash: 2 });
      M.scritta(crea, bot.X(238), bot.Y(R.K) + 4, `K = ${nt(R.K, 0)}`, { anchorX: "right", anchorY: "bottom", fontSize: 11, strokeColor: C.rosso });
      M.pallino(crea, bot.X(R.p), bot.Y(R.q), { size: 5, fillColor: C.blu, strokeColor: "#ffffff", strokeWidth: 1.5 });
    },
    legenda: (C) => [[C.b, T("profitto con la capienza", "profit with capacity"), ""], [C.grigio, T("senza capienza", "without capacity"), "dashed"],
      [C.c, T("domanda \\(D(p)\\)", "demand \\(D(p)\\)"), ""], [C.rosso, T("capienza \\(K\\)", "capacity \\(K\\)"), "dashed"]],
    letture(R, v, st, C) {
      return `<div>${T("Prezzo ottimo", "Optimal price")} <b>${euro(R.p, 2)}</b> · ${T("biglietti", "tickets")} <b>${nt(R.q, 0)}</b> · ${T("profitto", "profit")} <b>${euro(R.profitto)}</b></div>` +
        `<div style="margin-top:.3em">${R.vincolata
          ? T(`La capienza è vincolante: senza, il prezzo ottimo sarebbe ${euro(R.pFree, 2)}; si alza il prezzo fino a vendere esattamente \\(K\\) biglietti.`,
            `Capacity is binding: without it, the optimal price would be ${euro(R.pFree, 2)}; the price goes up until exactly \\(K\\) tickets are sold.`)
          : T("La capienza non è vincolante: il prezzo ottimo è quello senza capienza, e un posto in più non vale nulla.",
            "Capacity is not binding: the optimal price is the one without capacity, and one more seat is worth nothing.")}</div>`;
    },
    domanda: T("Allarga la capienza con ▶: da quale \\(K\\) il prezzo ottimo smette di scendere? Che cosa vale un posto in più prima e dopo quel punto? Con le tre domande, cambia la risposta?",
      "Widen the capacity with ▶: from which \\(K\\) does the optimal price stop going down? What is one more seat worth before and after that point? With the three demands, does the answer change?"),
  });

  // ================================================================ localizzazione (cap. 9)
  const vLocalizza = {
    etichetta: T("Localizzazione", "Location"),
    cursori: [
      { nome: "D", min: 5.7, max: 7, step: 0.02, val: 6, fmt: (x) => nt(x, 2) + " km",
        descr: T("tetto sulla distanza del quartiere più lontano", "cap on the distance of the farthest district") },
      { nome: "w_9", min: 0, max: 60, step: 1, val: 25, fmt: (x) => nt(x, 0) + T(" mila ab.", "k inh."),
        descr: T("popolazione del quartiere Q9 (dai dati: 25 mila)", "population of district Q9 (from the data: 25 thousand)") },
    ],
    calcola(v) {
      const L = DD().localizzazione, pesi = L.peso.slice();
      pesi[8] = v[1];
      const mm = NL().minimax();
      if (v[0] < mm.max - 1e-9) return { stato: "inammissibile", mm, pesi };
      return { stato: "ottimo", sol: NL().localizza(v[0], pesi), weber: NL().localizza(Infinity, pesi), mm, pesi };
    },
    formula(R, v, st) {
      return `\\min_{(x,y)}\\ \\sum_k ${st.col("b", "w_k")}\\, d_k\\quad d_k = \\|(x, y) - (a_k, b_k)\\| \\le ${st.col("a", "D")}`;
    },
    disegna(crea, R, v, C, S) {
      const L = DD().localizzazione, m = mg(S, 18, 34);
      // stessa unità sui due assi
      const lx = m.X1 - m.X0, ly = S.H - m.alto - m.basso, u = Math.min(lx / 11, ly / 11);
      const X0 = m.X0 + (lx - 11 * u) / 2, Y0 = m.basso + (ly - 11 * u) / 2;
      const P = O.pannello(crea, { X0, X1: X0 + 11 * u, Y0, Y1: Y0 + 11 * u, xa: 0, xb: 11, ya: 0, yb: 11, nx: "km", ny: "km" }, C, { nTx: 6, nTy: 6 });
      const cerchio = (x, y, r, attr) => crea("circle", [[P.X(x), P.Y(y)], r * u], Object.assign({ fixed: true, highlight: false, strokeWidth: 1.5 }, attr));
      if (R.stato === "ottimo") {
        const s = R.sol;
        cerchio(s.x, s.y, v[0], { strokeColor: C.a, dash: 2, fillColor: C.a, fillOpacity: 0.05 });
        L.coord.forEach(([a, b], k) => M.linea(crea, P.X(s.x), P.Y(s.y), P.X(a), P.Y(b), { strokeColor: Math.abs(s.d[k] - s.max) < 1e-3 ? C.a : C.line, strokeWidth: Math.abs(s.d[k] - s.max) < 1e-3 ? 2 : 1 }));
      }
      L.coord.forEach(([a, b], k) => {
        cerchio(a, b, 0.11 * Math.sqrt(Math.max(R.pesi[k], 0.5)), { strokeColor: C.b, fillColor: C.b, fillOpacity: 0.45, strokeWidth: 1 });
        M.scritta(crea, P.X(a) + 0.11 * Math.sqrt(Math.max(R.pesi[k], 0.5)) * u + 3, P.Y(b), L.nomi[k], { anchorX: "left", fontSize: 10, strokeColor: C.muted });
      });
      M.pallino(crea, P.X(R.mm.x), P.Y(R.mm.y), { size: 6, face: "x", strokeColor: C.rosso, strokeWidth: 3 });
      if (R.stato === "ottimo") {
        M.pallino(crea, P.X(R.weber.x), P.Y(R.weber.y), { size: 5, face: "diamond", fillColor: C.viola, strokeColor: C.viola });
        M.pallino(crea, P.X(R.sol.x), P.Y(R.sol.y), { size: 8, fillColor: C.blu, strokeColor: "#ffffff", strokeWidth: 2 });
      } else M.scritta(crea, S.W / 2, S.H - 30, T("Inammissibile: nessun punto sta entro D da tutti i quartieri", "Infeasible: no point is within D of every district"), { fontSize: 14, strokeColor: C.rosso, cssStyle: "font-weight:700" });
    },
    legenda: (C) => [[C.b, T("quartieri (area: popolazione)", "districts (area: population)"), "punto"], [C.blu, T("ottimo con il tetto", "optimum with the cap"), "punto"],
      [C.viola, T("punto di Weber (senza tetto)", "Weber point (no cap)"), "punto"], [C.rosso, "minimax", "punto"], [C.a, T("raggio \\(D\\)", "radius \\(D\\)"), "dashed"]],
    letture(R, v, st, C) {
      if (R.stato !== "ottimo") return M.tinta(C.rosso, T("Inammissibile.", "Infeasible.")) + " " + T(`Il tetto più basso possibile è il valore del minimax, ${nt(R.mm.max, 3)} km.`, `The lowest possible cap is the minimax value, ${nt(R.mm.max, 3)} km.`);
      const s = R.sol, w = R.weber, tot = R.pesi.reduce((a, b) => a + b, 0);
      return M.tab(["", T("posizione", "position"), T("media", "mean"), "max"], [
        [M.tinta(C.blu, T("ottimo", "optimum")), `(${nt(s.x, 2)}; ${nt(s.y, 2)})`.replace(";", GI.EN ? "," : ";"), nt(s.media, 3), nt(s.max, 3)],
        [T("Weber", "Weber"), `(${nt(w.x, 2)}; ${nt(w.y, 2)})`.replace(";", GI.EN ? "," : ";"), nt(w.media, 3), nt(w.max, 3)],
        ["minimax", `(${nt(R.mm.x, 2)}; ${nt(R.mm.y, 2)})`.replace(";", GI.EN ? "," : ";"), nt(R.pesi.reduce((a, q, k) => a + q * Math.hypot(R.mm.x - DD().localizzazione.coord[k][0], R.mm.y - DD().localizzazione.coord[k][1]), 0) / tot, 3), nt(R.mm.max, 3)],
      ]) + `<div style="margin-top:.3em">${s.max >= v[0] - 1e-3 ? T("Il tetto è attivo: per proteggere il quartiere più lontano si allunga la distanza media.", "The cap is active: protecting the farthest district lengthens the average distance.")
        : T("Il tetto non è attivo: l'ottimo è il punto di Weber.", "The cap is not active: the optimum is the Weber point.")}</div>`;
    },
    domanda: T("Abbassa il tetto \\(D\\) da 7 km verso il minimo: da quando diventa attivo, e quanto cresce la distanza media per ogni metro tolto alla massima? Poi aumenta la popolazione di Q9: dove si sposta il punto di Weber?",
      "Lower the cap \\(D\\) from 7 km towards the minimum: from when is it active, and how much does the mean distance grow for every metre taken off the maximum? Then increase the population of Q9: where does the Weber point move?"),
  };

  // ================================================================ registrazione
  const R = (nome, opz, voci) => { window.GI_RICETTE[nome] = () => O.ricettaVoci(opz, voci); };
  R("pnl-modelli", { titolo: T("Tre modelli non lineari", "Three nonlinear models"), etichetta: T("Modello", "Model") },
    { markowitz: vMarkowitz, pricing: vPricing("lineare", T("Pricing con capienza", "Pricing with capacity")), localizzazione: vLocalizza });
  R("pnl-markowitz", { titolo: T("Portafoglio di Markowitz", "Markowitz portfolio") }, { markowitz: vMarkowitz });
  R("pnl-pricing", { titolo: T("Prezzo ottimo", "Optimal price"), etichetta: T("Domanda", "Demand") },
    { lineare: vPricing("lineare"), elasticita: vPricing("elasticita"), logistica: vPricing("logistica") });
  R("pnl-localizzazione", { titolo: T("Localizzazione continua", "Continuous location") }, { localizzazione: vLocalizza });

  // ================================================================ SVM (cap. 12)
  window.GI_RICETTE["pnl-svm"] = {
    titolo: "Support Vector Machine",
    parametri: [{ k: "lc", nome: "\\log_{10} C", min: -1.5, max: 1.5, step: 0.05, val: 0, colore: "a", cifre: 2,
      descr: T("\\(C\\) pesa le violazioni del margine: da 0,03 a 30", "\\(C\\) weighs the margin violations: from 0.03 to 30") }],
    vista: [-3.6, 3.4, 4.2, -4.2],
    stessaScala: true,
    legenda: (st) => { const C = M.COL(st); return [[C.blu, T("affidabili (\\(y = +1\\))", "reliable (\\(y = +1\\))"), "punto"], [C.rosso, T("insolventi (\\(y = -1\\))", "defaulting (\\(y = -1\\))"), "punto"],
      [C.muted, T("retta di separazione", "separating line"), ""], [C.grigio, T("margine \\(w^\\top x + b = \\pm 1\\)", "margin \\(w^\\top x + b = \\pm 1\\)"), "dashed"], [C.c, T("vettori di supporto", "support vectors"), ""]]; },
    monta(board, st) {
      const D = st.dati, tema = M.scuro(), C = M.COL(st), dati = DD().svm;
      const cambioTema = D.tema !== undefined && D.tema !== tema;
      D.tema = tema;
      if (!cambioTema || !D.pos) D.pos = dati.X.map((p) => p.slice());
      D.calc = null;
      const calcolo = () => {
        const X = D.pos.map((q) => q.slice()), C1 = Math.pow(10, st.p().lc), firma = X.join(";") + "|" + C1;
        if (D.calc && D.calc.firma === firma) return D.calc;
        D.calc = Object.assign(NL().svm(X, dati.y, C1), { firma, C: C1, X });
        return D.calc;
      };
      D.calcolo = calcolo;
      const retta = (k, attr) => board.create("line", [() => calcolo().b - k, () => calcolo().w[0], () => calcolo().w[1]],
        Object.assign({ fixed: true, highlight: false, withLabel: false }, attr));
      D.P = [];
      retta(1, { strokeColor: C.grigio, strokeWidth: 1.6, dash: 2 });
      retta(-1, { strokeColor: C.grigio, strokeWidth: 1.6, dash: 2 });
      retta(0, { strokeColor: C.testo, strokeWidth: 2.6 });
      dati.y.forEach((y, i) => {
        const P = board.create("point", D.pos[i], { name: "", size: 3, face: y > 0 ? "o" : "x", strokeColor: y > 0 ? C.blu : C.rosso, fillColor: y > 0 ? C.blu : C.rosso,
          strokeWidth: y > 0 ? 1 : 2.5, showInfobox: false, withLabel: false, highlightStrokeColor: C.a, highlightFillColor: C.a });
        P.on("drag", () => { D.pos[i] = [P.X(), P.Y()]; });
        D.P.push(P);
      });
      // cerchi dei vettori di supporto (alpha > 0)
      dati.y.forEach((y, i) => board.create("point", [() => (calcolo().alpha[i] > 1e-7 ? D.pos[i][0] : NaN), () => (calcolo().alpha[i] > 1e-7 ? D.pos[i][1] : NaN)],
        { name: "", fixed: true, size: 7, fillColor: "none", fillOpacity: 0, strokeColor: C.c, strokeWidth: 1.8, highlight: false, showInfobox: false, withLabel: false }));
      board.create("text", [4.1, -0.25, T("solidità x₁", "solidity x₁")], { anchorX: "right", anchorY: "top", fixed: true, fontSize: 12, strokeColor: C.muted, highlight: false });
      board.create("text", [0.1, 3.3, T("puntualità x₂", "punctuality x₂")], { anchorX: "left", anchorY: "top", fixed: true, fontSize: 12, strokeColor: C.muted, highlight: false });
    },
    formula: (p, st) => `\\min\\ \\tfrac12 \\|w\\|^2 + ${st.col("a", "C")} \\sum_i \\xi_i\\quad y_i\\,(w^\\top x_i + b) \\ge 1 - \\xi_i,\\ \\ \\xi \\ge 0`,
    letture(p, st) {
      const c = st.dati.calcolo ? st.dati.calcolo() : null, C = M.COL(st);
      if (!c) return "";
      const sv = c.alpha.filter((a) => a > 1e-7).length, sul = c.alpha.filter((a) => a > 1e-7 && a < c.C * (1 - 1e-7)).length;
      const err = c.marg.filter((f) => f < 0).length, dentro = c.marg.filter((f) => f < 1 - 1e-6).length;
      return `<div>\\(C = ${n(c.C, 3)}\\): \\(w = (${n(c.w[0], 3)}${GI.EN ? ",\\ " : ";\\ "}${n(c.w[1], 3)})\\), \\(b = ${n(c.b, 3)}\\)</div>` +
        `<div>${T("Margine", "Margin")} \\(2/\\|w\\| = ${n(2 / Math.hypot(c.w[0], c.w[1]), 3)}\\) · ${T("obiettivo", "objective")} \\(${n(c.obj, 3)}\\)</div>` +
        M.tab(["", T("punti", "points")], [
          [M.tinta(C.c, T("vettori di supporto (\\(\\alpha_i > 0\\))", "support vectors (\\(\\alpha_i > 0\\))")), String(sv)],
          [T("sul margine (\\(0 < \\alpha_i < C\\))", "on the margin (\\(0 < \\alpha_i < C\\))"), String(sul)],
          [T("dentro il margine (\\(\\xi_i > 0\\))", "inside the margin (\\(\\xi_i > 0\\))"), String(dentro)],
          [M.tinta(C.rosso, T("classificati male", "misclassified")), String(err)],
        ]) + `<div style="margin-top:.3em">${T("Gli altri punti hanno \\(\\alpha_i = 0\\): spostali lontano dal margine e la retta non cambia.", "The other points have \\(\\alpha_i = 0\\): move them away from the margin and the line does not change.")}</div>`;
    },
    domanda: T("Trascina un punto lontano dal margine: la retta si muove? Ora trascina un vettore di supporto. Poi porta \\(\\log_{10} C\\) da −1,5 a 1,5: che cosa succede al margine e al numero di vettori di supporto?",
      "Drag a point far from the margin: does the line move? Now drag a support vector. Then take \\(\\log_{10} C\\) from −1.5 to 1.5: what happens to the margin and to the number of support vectors?"),
  };

  // ================================================================ minimi quadrati (cap. 13)
  window.GI_RICETTE["pnl-minimi-quadrati"] = () => O.ricettaRetta({
    titolo: T("Minimi quadrati contro scarti assoluti", "Least squares versus least absolute deviations"),
    dati: () => DD().panetteria,
    parametri: [{ k: "delta", nome: "\\delta", min: -200, max: 0, step: 10, val: 0, colore: "a", cifre: 0,
      descr: T("sposta la domanda del giorno normale più caldo (pezzi)", "shifts the demand of the hottest normal day (pieces)") }],
    modifica(y, p, info, t) {
      let k = -1;
      t.forEach((v, i) => { if (!info.sciopero[i] && (k < 0 || v > t[k])) k = i; });
      if (k >= 0) y[k] += p.delta;
      info.caldo = k;
    },
    rette(t, y, p, C) {
      const r = NL().rette(t, y);
      return [
        { ...r.ls, colore: C.a, nome: T("minimi quadrati (QP)", "least squares (QP)"), stile: { strokeWidth: 3 } },
        { ...r.lad, colore: C.blu, nome: T("scarti assoluti (LP)", "least absolute deviations (LP)"), stile: { strokeWidth: 3, dash: 2 } },
      ];
    },
    formula: (p, st) => `\\min_{w,\\,b}\\ \\sum_i r_i^2\\quad w\\, t_i + b + r_i = y_i\\qquad \\text{(${T("LP", "LP")}: } \\min \\textstyle\\sum_i |r_i|\\text{)}`,
    letture(rette, p, dati, C) {
      const [ls, lad] = rette, m = dati.t.length;
      const res = dati.y.map((v, i) => v - ls.w * dati.t[i] - ls.b);
      const ss = res.reduce((s, r) => s + r * r, 0), ssA = res.reduce((s, r, i) => s + (dati.info.sciopero[i] ? r * r : 0), 0);
      const eq = (r) => `\\(y = ${n(r.b, 2)} ${r.w < 0 ? "-" : "+"} ${n(Math.abs(r.w), 2)}\\, t\\)`;
      return `<div>${M.tinta(C.a, T("Minimi quadrati", "Least squares"))}: ${eq(ls)}</div>` +
        `<div>${M.tinta(C.blu, T("Scarti assoluti", "Least abs. dev."))}: ${eq(lad)}</div>` +
        `<div>\\(\\sum_i r_i^2 = ${n(ss, 0)}\\), ${T("radice dell'errore quadratico medio", "root mean square error")} \\(${n(Math.sqrt(ss / m), 2)}\\)</div>` +
        (ssA > 0 ? `<div>${T("Quota dei quadrati dovuta agli scioperi", "Share of the squares due to the strikes")}: ${nt(100 * ssA / ss, 1)}%</div>` : "") +
        `<div style="margin-top:.3em">KKT: \\(\\sum_i r_i = ${n(res.reduce((s, r) => s + r, 0), 4)}\\), \\(\\sum_i r_i t_i = ${n(res.reduce((s, r, i) => s + r * dati.t[i], 0), 4)}\\) ${T("(equazioni normali)", "(normal equations)")}</div>`;
    },
    domanda: T("Porta \\(\\delta\\) a −200 con ▶: quanto ruota la retta dei minimi quadrati, quanto quella degli scarti assoluti? Con i 5 scioperi, quale quota della somma dei quadrati pesa sugli anomali?",
      "Take \\(\\delta\\) to −200 with ▶: how much does the least-squares line turn, and the least absolute deviations line? With the 5 strikes, what share of the sum of squares falls on the outliers?"),
  });
})();
