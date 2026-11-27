/* Laboratorio di «Modellazione PNL / NLP Modelling»: le ricette delle app.
 *
 *   pnl-markowitz       cap. 6: portafoglio ottimo e frontiera efficiente (QP, insieme attivo); anche in home
 *   pnl-pricing         cap. 7: prezzo ottimo con tre funzioni di domanda e la capienza
 *   pnl-localizzazione  cap. 9: Weber con un tetto sulla distanza massima
 *   pnl-svm             cap. 12: SVM lineare, punti trascinabili, margine e vettori di supporto
 *   pnl-minimi-quadrati cap. 13: minimi quadrati (QP) contro scarti assoluti (LP), punti trascinabili
 *
 * Ogni app ha gli stessi riquadri (RIQ, sotto; stessi nomi di classi di Modellazione PL e MIP): «Il problema»,
 * «Dati» (significato dei simboli e valori solo nelle tabelle), «Modello» (richiudibile, aperto in home e chiuso
 * nel laboratorio: variabili e modello simbolico), una figura, a destra cursori (al massimo due), «Soluzione ottima» (prima le variabili, sotto il
 * valore ottimo) e «Prova tu» (richiudibile); in fondo il modello numerico, chiuso. Niente prezzi ombra:
 * stanno nei capitoli. In home (fuori dalle pagine del laboratorio) il riquadro «Dati» va sopra i cursori e
 * l'app sta in una schermata (data-vetrina="compatta", messo qui).
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
  /** numero con il separatore delle migliaia (56.000 / 56,000) */
  const mig = (x, c = 0) => Number(x).toLocaleString(GI.EN ? "en-US" : "it-IT", { minimumFractionDigits: c, maximumFractionDigits: c });
  const euro = (x, c = 0) => mig(x, c) + " €";
  const tx = (s) => `\\(${s}\\)`;
  /** valore di una variabile: «—» se è nullo alle cifre mostrate */
  const z = (x, c = 1) => (Math.abs(x) < 0.5 * Math.pow(10, -c) ? "—" : nt(x, c));
  const SA = () => T("\\text{soggetto a}", "\\text{subject to}");
  const PER = (i, nn) => `\\forall ${i} \\in \\{1, \\dots, ${nn}\\}`;
  const mg = (S, alto = 22, basso = 40) => ({ X0: 58, X1: S.W - 14, alto, basso });

  // ================================================================ riquadri standard (Fabio, 26/11/2026)
  const CAPITOLO = {
    6: ["markowitz/", "markowitz/", "6. Portafoglio di Markowitz", "6. The Markowitz portfolio"],
    7: ["pricing/", "pricing/", "7. Pricing e revenue management", "7. Pricing and revenue management"],
    9: ["localizzazione/", "location/", "9. Localizzazione continua", "9. Continuous location"],
    12: ["svm/", "svm/", "12. Support Vector Machine", "12. Support Vector Machine"],
    13: ["minimi-quadrati/", "least-squares/", "13. Regressione ai minimi quadrati", "13. Least-squares regression"],
  };
  /** la radice del sito: Material la fissa in __md_scope (vale dalla home e dalle pagine del laboratorio) */
  const radice = () => {
    try { if (window.__md_scope) return new URL(window.__md_scope); } catch (e) { /* sotto */ }
    const cfg = document.getElementById("__config");
    try { return new URL(JSON.parse(cfg.textContent).base + "/", location.href); } catch (e) { return new URL("./", location.href); }
  };
  const RIQ = {
    box: (cls, tit, corpo) => `<div class="plm-box ${cls}"><p class="plm-box-tit">${tit}</p>${corpo}</div>`,
    /** una tabella con il suo titolo (stesso formato di DV.tab e SOL.tab di Modellazione PL); con la prima intestazione
     *  vuota la prima colonna è quella delle etichette, altrimenti tutte le colonne sono numeri (centrati) */
    tab: (titolo, intest, righe, etichette = intest[0] === "") => `<div class="plm-sol-t${etichette ? "" : " plm-t-num"}">${titolo ? `<p>${titolo}</p>` : ""}${M.tab(intest, righe)}</div>`,
    /** una scatola richiudibile dentro un riquadro (tabelle grandi) */
    apri: (titolo, corpo) => `<details class="plm-piu"><summary>${titolo}</summary><div class="plm-piu-corpo">${corpo}</div></details>`,
    /** riscrive un elemento solo se l'HTML cambia; i <details> interni restano aperti o chiusi */
    scrivi(el, html) {
      if (!el || el.dataset.html === html) return;
      const aperti = Array.from(el.querySelectorAll("details")).map((d) => d.open);
      el.dataset.html = html;
      el.innerHTML = GI.mj(html);
      const dd = el.querySelectorAll("details");
      if (dd.length === aperti.length) dd.forEach((d, i) => { d.open = aperti[i]; });
      if (/\\\(/.test(html)) GI.typeset(el);
    },
    /** costruisce una volta i riquadri dell'app, poi ne aggiorna il contenuto.
     *  a = { problema, variabili, sig (significato dei dati), tabelle: [html], piu (scatole dei dati),
     *        modello (TeX di un aligned), cap (numero del capitolo), sol (HTML di SOL.blocco), prova, num (HTML) } */
    mostra(st, a) {
      const el = st.el, V = !el.classList.contains("gi-app-intera");
      if (V && !el.dataset.vetrina) el.dataset.vetrina = "compatta";
      const corpo = el.querySelector(".gi-corpo");
      if (!corpo) return;
      const sx = corpo.children[0], dx = corpo.children[1];
      let plm = sx.querySelector(":scope > .plm");
      if (!plm) {
        plm = GI.h("div", { class: "plm" });
        const dati = `<div class="plm-dati plm-box"><p class="plm-dati-tit">${T("Dati", "Data")}</p><div class="plm-dati-corpo"></div></div>`;
        plm.innerHTML = `<div class="plm-box plm-box-problema"><p class="plm-box-tit">${T("Il problema", "The problem")}</p><div class="plm-corpo"></div></div>` +
          (V ? "" : dati) +
          `<details class="plm-box plm-box-mod"${V ? " open" : ""}><summary class="plm-box-tit">${T("Modello", "Model")}</summary><div class="plm-box-corpo"></div></details>`;
        sx.insertBefore(plm, sx.firstChild);
        sx.append(GI.h("div", { class: "plm-cap-fondo" }));
        if (V) {
          const d = GI.h("div", { class: "plm-dati plm-box" });
          d.innerHTML = `<p class="plm-dati-tit">${T("Dati", "Data")}</p><div class="plm-dati-corpo"></div>`;
          dx.insertBefore(d, dx.querySelector(".gi-ctrl"));
        }
        const sol = GI.h("div", { class: "plm-sol plm-box" });
        sol.innerHTML = `<p class="plm-sol-tit">${T("Soluzione ottima", "Optimal solution")}</p><div class="plm-corpo"></div>`;
        dx.insertBefore(sol, dx.querySelector(".gi-letture"));
        const prova = GI.h("details", { class: "plm-box plm-box-prova", open: "" });
        prova.innerHTML = `<summary class="plm-box-tit">${T("Prova tu", "Try it")}</summary><div class="plm-box-corpo"></div>`;
        dx.append(prova);
      }
      const q = (sel) => el.querySelector(sel + " .plm-corpo, " + sel + " .plm-box-corpo");
      RIQ.scrivi(q(".plm-box-problema"), `<p>${a.problema}</p>`);
      RIQ.scrivi(el.querySelector(".plm-dati-corpo"), (a.sig ? `<p class="plm-dati-sig">${a.sig}</p>` : "") +
        `<div class="plm-dati-tabs">${(a.tabelle || []).join("")}</div>` + (a.piu || ""));
      RIQ.scrivi(q(".plm-box-mod"), `<p class="plm-mod-var"><b>${T("Variabili", "Variables")}:</b> ${a.variabili}</p>` +
        `<div class="plm-sim">\\(\\displaystyle \\begin{aligned} ${a.modello} \\end{aligned}\\)</div>`);
      RIQ.scrivi(q(".plm-sol"), a.sol || "");
      RIQ.scrivi(q(".plm-box-prova"), `<p>${a.prova || ""}</p>`);
      RIQ.scrivi(sx.querySelector(":scope > .plm-cap-fondo"), RIQ.capitolo(a.cap));
      RIQ.fondo(st, a.num || "");
    },
    /** «Il modello è spiegato nel capitolo …»: in fondo al riquadro, dopo la figura */
    capitolo(k) {
      const c = CAPITOLO[k];
      if (!c) return "";
      const url = new URL(GI.EN ? c[1] : c[0], radice()).href;
      return `<p class="plm-cap">${T("Il modello è spiegato nel capitolo", "The model is explained in the chapter")} <a href="${url}">${GI.EN ? c[3] : c[2]}</a>.</p>`;
    },
    /** il modello numerico, richiudibile e chiuso, in fondo al riquadro (largo quanto l'app); lo si compone solo
     *  quando è aperto (le app con molti punti lo cambiano a ogni trascinamento) */
    fondo(st, html) {
      let b = st.el.querySelector(":scope > .plm-fondo");
      if (!b) {
        b = GI.h("div", { class: "plm-fondo" });
        b.innerHTML = `<details class="plm-num"><summary>${T("Modello numerico con i dati attuali", "Numerical model with the current data")}</summary><div class="plm-num-corpo"></div></details>`;
        st.el.append(b);
        b.querySelector("details").addEventListener("toggle", () => RIQ.riempi(b));
      }
      b.hidden = !html;
      b.dataset.attesa = html;
      clearTimeout(b._t);
      b._t = setTimeout(() => RIQ.riempi(b), 150);
    },
    riempi(b) {
      const d = b.querySelector("details");
      if (d.open) RIQ.scrivi(b.querySelector(".plm-num-corpo"), b.dataset.attesa || "");
    },
    /** il blocco della soluzione: prima i valori delle variabili, sotto il valore ottimo (Fabio, 26/11/2026) */
    sol: (valore, tabelle = [], nota = "") =>
      (tabelle.length ? `<div class="plm-sol-tabs">${tabelle.join("")}</div>` : "") + (nota ? `<p class="plm-sol-nota">${nota}</p>` : "") +
      `<div class="plm-sol-val">${valore}</div>`,
    /** righe di un modello numerico: i termini a gruppi di «per» */
    righe: (termini, per, sep = " + ") => {
      const out = [];
      for (let k = 0; k < termini.length; k += per) out.push(termini.slice(k, k + per).join(sep));
      return out;
    },
    /** un blocco del modello numerico: titolo e formula (che scorre se è più larga del riquadro) */
    blocco: (titolo, tex) => `<p class="plm-tit">${titolo}</p><div class="plm-riga">\\(\\displaystyle ${tex}\\)</div>`,
  };
  window.GI_PNL_RIQ = RIQ;

  // ================================================================ Markowitz (cap. 6)
  const TITOLO = (C) => [C.a, C.b, C.c, C.d, C.e, C.viola, C.blu, C.grigio];
  const vMarkowitz = {
    etichetta: T("Portafoglio di Markowitz", "Markowitz portfolio"),
    cursori: [
      { nome: "\\bar r", min: 5, max: 20.5, step: 0.1, val: 15, fmt: (x) => nt(x, 1) + "%",
        descr: T("rendimento atteso minimo richiesto (annuo)", "minimum required expected return (annual)") },
      { nome: "u", min: 15, max: 100, step: 5, val: 100, fmt: (x) => nt(x, 0) + "%",
        descr: T("quota massima in un solo titolo", "maximum share in a single asset") },
    ],
    calcola(v) {
      const st = NL().statistiche(null), u = v[1] / 100;
      const port = NL().markowitz(v[0] / 100, u), mv = NL().markowitz(null, u);
      const fr = NL().frontiera(u, null, 40), fr0 = u < 1 ? NL().frontiera(1, null, 40) : null;
      return { port, mv, fr, fr0, st, rmax: NL().rendMax(st.mu, u), u };
    },
    formula(R, v, st) {
      const C = M.COL(st), tit = R.st.titoli, nn = tit.length, col = TITOLO(C);
      const intest = ["", ...tit.map((t, i) => `<span style="color:${col[i]}">${t}</span>`)];
      const sig = T("\\(n\\): numero di titoli; \\(\\mu_i\\): rendimento atteso del titolo \\(i\\); \\(q_{ij}\\): covarianza fra \\(i\\) e \\(j\\); \\(\\bar r\\): rendimento richiesto; \\(u\\): quota massima; con \\(i \\in \\{1, \\dots, n\\}\\) e \\(j \\in \\{1, \\dots, n\\}\\).",
        "\\(n\\): number of assets; \\(\\mu_i\\): expected return of asset \\(i\\); \\(q_{ij}\\): covariance of \\(i\\) and \\(j\\); \\(\\bar r\\): required return; \\(u\\): maximum share; with \\(i \\in \\{1, \\dots, n\\}\\) and \\(j \\in \\{1, \\dots, n\\}\\).");
      const dim = RIQ.tab(T("Dimensioni", "Sizes"), [tx("n")], [[String(nn)]]);
      const sca = RIQ.tab(T("Scalari (%)", "Scalars (%)"), [tx("\\bar r"), tx("u")], [[nt(v[0], 1), nt(v[1], 0)]]);
      // senza titolo (la home sta in una schermata): l'unità nella casella d'angolo
      const tab = RIQ.tab("", [T("% annui", "% annual"), ...intest.slice(1)], [
        [tx("\\mu_i"), ...R.st.mu.map((m) => nt(100 * m, 1))],
        [tx("\\sqrt{q_{ii}}"), ...R.st.Q.map((r, i) => nt(100 * Math.sqrt(r[i]), 1))]], true);
      // la matrice di covarianza, richiudibile, sulla stessa riga delle due tabelline (la home sta in una schermata)
      const piu = RIQ.apri(T("Covarianze \\(q_{ij}\\)", "Covariances \\(q_{ij}\\)"),
        M.tab(["", ...tit], R.st.Q.map((r, i) => [tit[i], ...r.map((x) => nt(x, 4))])));
      const modello = `\\min ~~ \\sum\\nolimits_{i=1}^{n} \\sum\\nolimits_{j=1}^{n} q_{ij}\\, x_i\\, x_j & & \\\\
        ${SA()} \\quad \\sum\\nolimits_{i=1}^{n} \\mu_i\\, x_i &\\ge ${st.col("a", "\\bar r")}, & \\\\
        \\sum\\nolimits_{i=1}^{n} x_i &= 1, & \\\\
        0 \\le x_i &\\le ${st.col("b", "u")}, & ${PER("i", "n")}.`;
      // il modello numerico: Q per intero, poi i vincoli con i numeri
      const Qtex = `\\begin{pmatrix} ${R.st.Q.map((r) => r.map((x) => n(x, 4)).join(" & ")).join(" \\\\ ")} \\end{pmatrix}`;
      const xs = `\\begin{pmatrix} ${tit.map((t, i) => `x_{${i + 1}}`).join(" & ")} \\end{pmatrix}`;
      const rend = RIQ.righe(R.st.mu.map((m, i) => `${n(m, 4)}\\, x_{${i + 1}}`), 4);
      const num = `<p class="plm-tit">${T(`Il QP dell'istanza: ${nn} variabili (${tit.join(", ")}), ${2 * nn + 2} vincoli.`, `The QP of the instance: ${nn} variables (${tit.join(", ")}), ${2 * nn + 2} constraints.`)}</p>` +
        `<div class="plm-riga">\\(\\displaystyle \\min ~~ ${xs}\\, ${Qtex} ${xs}^{\\top}\\)</div>` +
        `<div class="plm-riga">\\(\\displaystyle \\begin{aligned} ${SA()} \\quad & ${rend.join(" \\\\ & + ")} \\ge ${n(v[0] / 100, 3)}, \\\\ ` +
        `& ${tit.map((t, i) => `x_{${i + 1}}`).join(" + ")} = 1, \\\\ & 0 \\le x_i \\le ${n(R.u, 2)}, \\quad ${PER("i", nn)}. \\end{aligned}\\)</div>`;
      let sol;
      if (R.port.stato !== "ottimo") sol = M.tinta(C.rosso, T("Nessun portafoglio ammissibile: ", "No feasible portfolio: ")) +
        T(`con \\(u = ${n(R.u * 100, 0)}\\%\\) il rendimento massimo è ${pc(R.rmax || 0, 2)}.`, `with \\(u = ${n(R.u * 100, 0)}\\%\\) the maximum return is ${pc(R.rmax || 0, 2)}.`);
      else sol = RIQ.sol(`${T("Varianza minima", "Minimum variance")} \\(\\tilde z\\) = <b>${nt(R.port.varianza, 5)}</b> (${T("volatilità", "volatility")} ${pc(R.port.vol, 2)})`,
        [RIQ.tab("", ["%", ...intest.slice(1)], [[tx("\\tilde x_i"), ...R.port.x.map((q) => z(100 * q, 1))]], true)]);
      RIQ.mostra(st, {
        problema: T("Un investitore divide il capitale fra alcuni titoli. Sceglie le quote con la varianza minima del rendimento, " +
          "un rendimento atteso almeno pari a quello richiesto e una quota massima per titolo.",
          "An investor splits the capital among some assets. The shares have the minimum variance of the return, " +
          "an expected return at least equal to the required one and a maximum share per asset."),
        variabili: T("\\(x_i \\ge 0\\): quota del capitale investita nel titolo \\(i\\), con \\(i \\in \\{1, \\dots, n\\}\\).",
          "\\(x_i \\ge 0\\): share of the capital invested in asset \\(i\\), with \\(i \\in \\{1, \\dots, n\\}\\)."),
        sig, tabelle: [dim, sca, piu, tab], modello, cap: 6, num, sol,
        prova: T("Porta \\(\\bar r\\) a 18%: MAT sale al 29,8%, la volatilità al 13,36%. Con \\(\\bar r = 15\\%\\), porta \\(u\\) a 25%: entrano FIN e IND.",
          "Set \\(\\bar r\\) to 18%: MAT rises to 29.8%, the volatility to 13.36%. With \\(\\bar r = 15\\%\\), set \\(u\\) to 25%: FIN and IND enter too."),
      });
      return "";
    },
    disegna(crea, R, v, C, S) {
      const m = mg(S, 22, 44);
      const P = O.pannello(crea, { X0: m.X0, X1: m.X1, Y0: m.basso, Y1: S.H - m.alto, xa: 0, xb: 32, ya: 0, yb: 25,
        ny: T("rendimento atteso annuo (%)", "expected annual return (%)") }, C, { nTx: 8, nTy: 5 });
      M.scritta(crea, (m.X0 + m.X1) / 2, 8, T("volatilità annua (%)", "annual volatility (%)"), { anchorY: "bottom", fontSize: 12, strokeColor: C.muted });
      const linea = (pts, attr) => pts.length > 1 && crea("curve", [pts.map((q) => P.X(100 * q[0])), pts.map((q) => P.Y(100 * q[1]))], Object.assign({ fixed: true, highlight: false }, attr));
      if (R.fr0) linea(R.fr0, { strokeColor: C.grigio, strokeWidth: 1.8, dash: 2 });
      linea(R.fr, { strokeColor: C.blu, strokeWidth: 3 });
      M.linea(crea, P.X(0), P.Y(v[0]), P.X(32), P.Y(v[0]), { strokeColor: C.a, strokeWidth: 1.2, dash: 2 });
      const vol = R.st.Q.map((r, i) => Math.sqrt(r[i]));
      R.st.mu.forEach((mu, i) => {
        M.pallino(crea, P.X(100 * vol[i]), P.Y(100 * mu), { size: 4, fillColor: TITOLO(C)[i], strokeColor: "#ffffff", strokeWidth: 1 });
        M.scritta(crea, P.X(100 * vol[i]) + 6, P.Y(100 * mu), R.st.titoli[i], { anchorX: "left", fontSize: 11, strokeColor: C.muted });
      });
      if (R.mv.stato === "ottimo") M.pallino(crea, P.X(100 * R.mv.vol), P.Y(100 * R.mv.rend), { size: 7, face: "x", strokeColor: C.rosso, strokeWidth: 3 });
      if (R.port.stato === "ottimo") {
        M.pallino(crea, P.X(100 * R.port.vol), P.Y(100 * R.port.rend), { size: 8, fillColor: C.a, strokeColor: "#ffffff", strokeWidth: 2 });
        M.scritta(crea, P.X(100 * R.port.vol) - 10, P.Y(100 * R.port.rend) + 14, T("ottimo", "optimum"), { anchorX: "right", anchorY: "bottom", fontSize: 13, strokeColor: C.a, cssStyle: "font-weight:700" });
      }
    },
    legenda: (C) => [[C.blu, T("frontiera efficiente", "efficient frontier"), ""], [C.grigio, T("frontiera senza limite \\(u\\)", "frontier without the limit \\(u\\)"), "dashed"],
      [C.a, T("portafoglio ottimo", "optimal portfolio"), "punto"], [C.rosso, T("minima varianza", "minimum variance"), "punto"]],
  };

  // ================================================================ pricing (cap. 7)
  const DOMANDE = {
    lineare: [T("lineare", "linear"), "d(p) = a - b\\,p"],
    elasticita: [T("elasticità costante", "constant elasticity"), "d(p) = \\theta\\, p^{-\\varepsilon}"],
    logistica: [T("logistica", "logistic"), "d(p) = m/\\bigl(1 + e^{-\\alpha + \\beta p}\\bigr)"],
  };
  const PROVA_PRICING = {
    lineare: T("Porta \\(k\\) a 300: il prezzo ottimo sale a 180 €. Con \\(c = 20\\), porta \\(k\\) a 600: la capienza non è più piena (550 biglietti a 130 €).",
      "Set \\(k\\) to 300: the optimal price rises to 180 €. With \\(c = 20\\), set \\(k\\) to 600: the theatre is no longer full (550 tickets at 130 €)."),
    elasticita: T("Porta \\(k\\) a 300: il prezzo ottimo sale a 90,16 €. Porta \\(c\\) a 60: il teatro non è più pieno (194 biglietti a 110 €).",
      "Set \\(k\\) to 300: the optimal price rises to 90.16 €. Set \\(c\\) to 60: the theatre is no longer full (194 tickets at 110 €)."),
    logistica: T("Porta \\(k\\) a 300: il prezzo ottimo sale a 148,74 €. Con \\(k = 400\\), porta \\(c\\) a 60: il prezzo non cambia, il profitto scende a 31.317 €.",
      "Set \\(k\\) to 300: the optimal price rises to 148.74 €. With \\(k = 400\\), set \\(c\\) to 60: the price does not change, the profit drops to 31,317 €."),
  };
  const vPricing = (tipo) => ({
    etichetta: DOMANDE[tipo][0],
    cursori: [
      { nome: "k", min: 150, max: 900, step: 10, val: 400, fmt: (x) => nt(x, 0) + T(" posti", " seats"), descr: T("capienza del teatro", "capacity of the theatre") },
      { nome: "c", min: 0, max: 80, step: 1, val: 20, fmt: (x) => euro(x), descr: T("costo per spettatore", "cost per spectator") },
    ],
    calcola(v) {
      const R = NL().pricing(tipo, v[0], v[1]), ps = [];
      for (let k = 0; k <= 220; k++) ps.push(20 + k);
      R.curva = ps.map((p) => [p, (p - R.c) * Math.min(R.D(p), R.K), (p - R.c) * R.D(p)]);
      return R;
    },
    formula(R, v, st) {
      const P = DD().pricing;
      const par = tipo === "lineare" ? [["a", P.a, 0], ["b", P.b, 0]] : tipo === "elasticita" ? [["\\theta", P.A, 0], ["\\varepsilon", P.eps, 1]]
        : [["m", P.M, 0], ["\\alpha", P.alfa, 0], ["\\beta", P.beta, 3]];
      const sigDom = tipo === "lineare" ? T("\\(a, b\\): parametri della domanda", "\\(a, b\\): demand parameters")
        : tipo === "elasticita" ? T("\\(\\theta, \\varepsilon\\): parametri della domanda", "\\(\\theta, \\varepsilon\\): demand parameters")
          : T("\\(m, \\alpha, \\beta\\): parametri della domanda", "\\(m, \\alpha, \\beta\\): demand parameters");
      const sig = T(`\\(${DOMANDE[tipo][1]}\\): biglietti richiesti al prezzo \\(p\\); ${sigDom}; \\(c\\): costo per spettatore (€); \\(k\\): capienza (posti).`,
        `\\(${DOMANDE[tipo][1]}\\): tickets demanded at price \\(p\\); ${sigDom}; \\(c\\): cost per spectator (€); \\(k\\): capacity (seats).`);
      const tab = RIQ.tab(T("Parametri", "Parameters"), [...par.map((q) => tx(q[0])), tx("c"), tx("k")], [[...par.map((q) => mig(q[1], q[2])), mig(v[1]), mig(v[0])]]);
      const modello = `\\max ~~ (p - ${st.col("b", "c")})\\, q & & \\\\
        ${SA()} \\quad q &\\le d(p), & \\\\
        q &\\le ${st.col("a", "k")}, & \\\\
        p,\\ q &\\ge 0. &`;
      const dnum = tipo === "lineare" ? `${n(P.a, 0)} - ${n(P.b, 0)}\\, p` : tipo === "elasticita" ? `${mig(P.A).replace(/[.,]/g, "\\,")}\\, p^{-${n(P.eps, 1)}}`
        : `\\dfrac{${n(P.M, 0)}}{1 + e^{-${n(P.alfa, 0)} + ${n(P.beta, 3)}\\, p}}`;
      const num = `<p class="plm-tit">${T("Il modello dell'istanza: 2 variabili, 2 vincoli.", "The model of the instance: 2 variables, 2 constraints.")}</p>` +
        `<div class="plm-riga">\\(\\displaystyle \\begin{aligned} \\max ~~ (p - ${n(v[1], 0)})\\, q & \\\\ ${SA()} \\quad q &\\le ${dnum}, \\\\ q &\\le ${n(v[0], 0)}, \\\\ p,\\ q &\\ge 0. \\end{aligned}\\)</div>`;
      const sol = RIQ.sol(`${T("Profitto ottimo", "Optimal profit")} \\(\\tilde z\\) = <b>${euro(R.profitto)}</b>`,
        [RIQ.tab("", [tx("\\tilde p") + " (€)", tx("\\tilde q") + T(" (biglietti)", " (tickets)")], [[nt(R.p, 2), nt(R.q, 0)]])],
        R.vincolata ? T("Il teatro è pieno: \\(\\tilde q = k\\).", "The theatre is full: \\(\\tilde q = k\\).") : T("Il teatro non è pieno: \\(\\tilde q < k\\).", "The theatre is not full: \\(\\tilde q < k\\)."));
      RIQ.mostra(st, {
        problema: T("Un teatro fissa il prezzo di un biglietto. La domanda scende al crescere del prezzo e i biglietti venduti non superano la capienza: " +
          "prezzo e biglietti venduti danno il massimo profitto.",
          "A theatre sets the price of a ticket. Demand goes down as the price goes up and the tickets sold do not exceed the capacity: " +
          "price and tickets sold give the maximum profit."),
        variabili: T("\\(p\\): prezzo del biglietto (€); \\(q\\): biglietti venduti.", "\\(p\\): ticket price (€); \\(q\\): tickets sold."),
        sig, tabelle: [tab], modello, cap: 7, num, sol, prova: PROVA_PRICING[tipo],
      });
      return "";
    },
    disegna(crea, R, v, C, S) {
      const m = mg(S, 22, 40);
      const ymax = Math.max(...R.curva.map((r) => r[1]), R.profitto) * 1.25 / 1000;
      const P = O.pannello(crea, { X0: m.X0, X1: m.X1, Y0: m.basso, Y1: S.H - m.alto, xa: 20, xb: 240, ya: 0, yb: Math.max(ymax, 1),
        nx: T("prezzo p (€)", "price p (€)"), ny: T("profitto (migliaia di €)", "profit (thousand €)") }, C, { nTx: 11, nTy: 5 });
      const curva = (k, attr) => crea("curve", [R.curva.map((r) => P.X(r[0])), R.curva.map((r) => (r[k] / 1000 >= P.ya && r[k] / 1000 <= P.yb ? P.Y(r[k] / 1000) : NaN))], Object.assign({ fixed: true, highlight: false }, attr));
      curva(2, { strokeColor: C.grigio, strokeWidth: 1.8, dash: 2 });
      curva(1, { strokeColor: C.b, strokeWidth: 3 });
      M.linea(crea, P.X(R.p), P.Y(0), P.X(R.p), P.Y(R.profitto / 1000), { strokeColor: C.blu, strokeWidth: 1.5, dash: 2 });
      M.pallino(crea, P.X(R.p), P.Y(R.profitto / 1000), { size: 6, fillColor: C.blu, strokeColor: "#ffffff", strokeWidth: 1.5 });
      // il valore in una posizione fissa (angolo in alto a destra del pannello): non salta quando si muove un cursore
      M.scritta(crea, m.X1 - 8, S.H - m.alto - 8, `p̃ = ${euro(R.p, 2)}`, { anchorX: "right", anchorY: "top", fontSize: 13, strokeColor: C.blu, cssStyle: "font-weight:700" });
    },
    legenda: (C) => [[C.b, T("profitto con la capienza \\(k\\)", "profit with capacity \\(k\\)"), ""], [C.grigio, T("profitto senza capienza", "profit without capacity"), "dashed"],
      [C.blu, T("prezzo ottimo", "optimal price"), "punto"]],
  });

  // ================================================================ localizzazione (cap. 9)
  const vLocalizza = {
    etichetta: T("Localizzazione", "Location"),
    cursori: [
      { nome: "D", min: 5.7, max: 7, step: 0.02, val: 6, fmt: (x) => nt(x, 2) + " km",
        descr: T("tetto sulla distanza del quartiere più lontano", "cap on the distance of the farthest district") },
      { nome: "w_9", min: 0, max: 60, step: 1, val: 25, fmt: (x) => nt(x, 0) + T(" mila ab.", "k inh."),
        descr: T("popolazione del quartiere 9 (dai dati: 25 mila)", "population of district 9 (from the data: 25 thousand)") },
    ],
    calcola(v) {
      const L = DD().localizzazione, pesi = L.peso.slice();
      pesi[8] = v[1];
      const mm = NL().minimax();
      if (v[0] < mm.max - 1e-9) return { stato: "inammissibile", mm, pesi };
      return { stato: "ottimo", sol: NL().localizza(v[0], pesi), weber: NL().localizza(Infinity, pesi), mm, pesi };
    },
    formula(R, v, st) {
      const L = DD().localizzazione, nn = L.coord.length;
      const sig = T("\\(n\\): numero di quartieri; \\((a_i, b_i)\\): coordinate del quartiere \\(i\\) (km); \\(w_i\\): abitanti del quartiere \\(i\\) (migliaia); \\(D\\): tetto sulla distanza (km); con \\(i \\in \\{1, \\dots, n\\}\\).",
        "\\(n\\): number of districts; \\((a_i, b_i)\\): coordinates of district \\(i\\) (km); \\(w_i\\): inhabitants of district \\(i\\) (thousands); \\(D\\): cap on the distance (km); with \\(i \\in \\{1, \\dots, n\\}\\).");
      const dim = RIQ.tab(T("Dimensioni", "Sizes"), [tx("n")], [[String(nn)]]);
      const sca = RIQ.tab(T("Tetto (km)", "Cap (km)"), [tx("D")], [[nt(v[0], 2)]]);
      const tab = RIQ.tab(T("Quartieri", "Districts"), [tx("i"), ...L.coord.map((q, i) => String(i + 1))], [
        [tx("a_i"), ...L.coord.map((q) => nt(q[0], 1))], [tx("b_i"), ...L.coord.map((q) => nt(q[1], 1))], [tx("w_i"), ...R.pesi.map((w) => nt(w, 0))]], true);
      const modello = `\\min ~~ \\sum\\nolimits_{i=1}^{n} ${st.col("b", "w_i")} \\sqrt{(x - a_i)^2 + (y - b_i)^2} & & \\\\
        ${SA()} \\quad \\sqrt{(x - a_i)^2 + (y - b_i)^2} &\\le ${st.col("a", "D")}, & ${PER("i", "n")}.`;
      const sq = (i) => `\\sqrt{(x - ${n(L.coord[i][0], 1)})^2 + (y - ${n(L.coord[i][1], 1)})^2}`;
      const ob = RIQ.righe(L.coord.map((q, i) => `${n(R.pesi[i], 0)} ${sq(i)}`), 3);
      const vin = RIQ.righe(L.coord.map((q, i) => `${sq(i)} \\le ${n(v[0], 2)}`), 3, ", \\quad ");
      const num = `<p class="plm-tit">${T(`Il modello dell'istanza: 2 variabili, ${nn} vincoli.`, `The model of the instance: 2 variables, ${nn} constraints.`)}</p>` +
        `<div class="plm-riga">\\(\\displaystyle \\begin{aligned} \\min ~~ & ${ob.join(" \\\\ & + ")} \\\\[1ex] ${SA()} ~~ & ${vin.join(", \\\\ & ")}. \\end{aligned}\\)</div>`;
      let sol;
      if (R.stato !== "ottimo") sol = M.tinta(M.COL(st).rosso, T("Nessun punto ammissibile.", "No feasible point.")) + " " +
        T(`Il tetto più basso possibile è ${nt(R.mm.max, 3)} km.`, `The lowest possible cap is ${nt(R.mm.max, 3)} km.`);
      else {
        const s = R.sol;
        sol = RIQ.sol(`${T("Distanza totale pesata", "Total weighted distance")} \\(\\tilde z\\) = <b>${nt(s.costo, 1)}</b> (${T("media", "mean")} ${nt(s.media, 3)} km)`,
          [RIQ.tab("", [tx("\\tilde x") + " (km)", tx("\\tilde y") + " (km)", T("distanza massima (km)", "maximum distance (km)")], [[nt(s.x, 2), nt(s.y, 2), nt(s.max, 3)]])],
          s.max >= v[0] - 1e-3 ? T("Il tetto \\(D\\) è attivo.", "The cap \\(D\\) is active.") : T("Il tetto \\(D\\) non è attivo: l'ottimo è il punto di Weber.", "The cap \\(D\\) is not active: the optimum is the Weber point."));
      }
      RIQ.mostra(st, {
        problema: T("Un comune sceglie dove mettere una stazione di ricarica. Il punto scelto rende minima la distanza totale dai quartieri, pesata con gli abitanti, " +
          "e nessun quartiere resta più lontano di un tetto fissato.",
          "A town chooses where to put a charging station. The chosen point minimizes the total distance from the districts, weighted by the inhabitants, " +
          "and no district is farther than a given cap."),
        variabili: T("\\((x, y)\\): coordinate della stazione (km), libere.", "\\((x, y)\\): coordinates of the station (km), free."),
        sig, tabelle: [dim, sca, tab], modello, cap: 9, num, sol,
        prova: T("Porta \\(D\\) a 6,4 km: il tetto non conta più e l'ottimo è il punto di Weber (4,89; 5,31). Con \\(D = 6\\) km, porta \\(w_9\\) a 60: la stazione si avvicina al quartiere 9, in (5,25; 4,82).",
          "Set \\(D\\) to 6.4 km: the cap no longer matters and the optimum is the Weber point (4.89, 5.31). With \\(D = 6\\) km, set \\(w_9\\) to 60: the station moves towards district 9, to (5.25, 4.82)."),
      });
      return "";
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
        M.scritta(crea, P.X(a) + 0.11 * Math.sqrt(Math.max(R.pesi[k], 0.5)) * u + 3, P.Y(b), String(k + 1), { anchorX: "left", fontSize: 11, strokeColor: C.muted });
      });
      M.pallino(crea, P.X(R.mm.x), P.Y(R.mm.y), { size: 6, face: "x", strokeColor: C.rosso, strokeWidth: 3 });
      if (R.stato === "ottimo") {
        M.pallino(crea, P.X(R.weber.x), P.Y(R.weber.y), { size: 5, face: "diamond", fillColor: C.viola, strokeColor: C.viola });
        M.pallino(crea, P.X(R.sol.x), P.Y(R.sol.y), { size: 8, fillColor: C.blu, strokeColor: "#ffffff", strokeWidth: 2 });
      } else M.scritta(crea, S.W / 2, S.H - 30, T("Nessun punto sta entro D da tutti i quartieri", "No point is within D of every district"), { fontSize: 14, strokeColor: C.rosso, cssStyle: "font-weight:700" });
    },
    legenda: (C) => [[C.b, T("quartieri (area: abitanti)", "districts (area: inhabitants)"), "punto"], [C.blu, T("stazione ottima", "optimal station"), "punto"],
      [C.viola, T("punto di Weber (senza tetto)", "Weber point (no cap)"), "punto"], [C.rosso, T("centro del cerchio minimo", "centre of the smallest circle"), "punto"], [C.a, T("raggio \\(D\\)", "radius \\(D\\)"), "dashed"]],
  };

  // ================================================================ registrazione
  const R = (nome, opz, voci) => { window.GI_RICETTE[nome] = () => O.ricettaVoci(opz, voci); };
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
    legenda: (st) => { const C = M.COL(st); return [[C.blu, T("affidabili (\\(y_i = +1\\))", "reliable (\\(y_i = +1\\))"), "punto"], [C.rosso, T("insolventi (\\(y_i = -1\\))", "defaulting (\\(y_i = -1\\))"), "punto"],
      [C.muted, T("retta di separazione", "separating line"), ""], [C.grigio, T("margine", "margin"), "dashed"], [C.c, T("vettori di supporto", "support vectors"), ""]]; },
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
      // cerchi dei vettori di supporto: i punti sul margine o dentro (y_i (w'x_i + b) <= 1)
      dati.y.forEach((y, i) => board.create("point", [() => (calcolo().marg[i] < 1 + 1e-6 ? D.pos[i][0] : NaN), () => (calcolo().marg[i] < 1 + 1e-6 ? D.pos[i][1] : NaN)],
        { name: "", fixed: true, size: 7, fillColor: "none", fillOpacity: 0, strokeColor: C.c, strokeWidth: 1.8, highlight: false, showInfobox: false, withLabel: false }));
      board.create("text", [4.1, -0.25, T("solidità x₁", "solidity x₁")], { anchorX: "right", anchorY: "top", fixed: true, fontSize: 12, strokeColor: C.muted, highlight: false });
      board.create("text", [0.1, 3.3, T("puntualità x₂", "punctuality x₂")], { anchorX: "left", anchorY: "top", fixed: true, fontSize: 12, strokeColor: C.muted, highlight: false });
    },
    formula: () => "",
    letture(p, st) {
      const c = st.dati.calcolo ? st.dati.calcolo() : null, dati = DD().svm;
      if (!c) return "";
      const nn = dati.y.length, pos = dati.y.filter((y) => y > 0).length;
      const sv = c.marg.filter((f) => f < 1 + 1e-6).length, err = c.marg.filter((f) => f < 0).length;
      const xi = c.marg.map((f) => Math.max(0, 1 - f));
      const sig = T("\\(n\\): numero di clienti; \\((x_{i1}, x_{i2})\\): solidità e puntualità del cliente \\(i\\) (indicatori standardizzati); \\(y_i = +1\\) affidabile, \\(y_i = -1\\) insolvente; \\(C\\): peso delle violazioni; con \\(i \\in \\{1, \\dots, n\\}\\).",
        "\\(n\\): number of customers; \\((x_{i1}, x_{i2})\\): solidity and punctuality of customer \\(i\\) (standardized indicators); \\(y_i = +1\\) reliable, \\(y_i = -1\\) defaulting; \\(C\\): weight of the violations; with \\(i \\in \\{1, \\dots, n\\}\\).");
      const tab = RIQ.tab(T("Dimensioni", "Sizes"), [tx("n"), T("con \\(y_i = +1\\)", "with \\(y_i = +1\\)"), T("con \\(y_i = -1\\)", "with \\(y_i = -1\\)")], [[String(nn), String(pos), String(nn - pos)]]);
      const sca = RIQ.tab(T("Peso", "Weight"), [tx("C")], [[nt(c.C, 3)]]);
      const piu = RIQ.apri(T(`I ${nn} clienti (posizioni attuali)`, `The ${nn} customers (current positions)`),
        M.tab([tx("i"), tx("x_{i1}"), tx("x_{i2}"), tx("y_i")], c.X.map((q, i) => [String(i + 1), nt(q[0], 2), nt(q[1], 2), dati.y[i] > 0 ? "+1" : "−1"])));
      const modello = `\\min ~~ \\tfrac12 \\bigl(w_1^2 + w_2^2\\bigr) + ${st.col("a", "C")} \\sum\\nolimits_{i=1}^{n} \\xi_i & & \\\\
        ${SA()} \\quad y_i\\, (w_1 x_{i1} + w_2 x_{i2} + b) &\\ge 1 - \\xi_i, & ${PER("i", "n")}, \\\\
        \\xi_i &\\ge 0, & ${PER("i", "n")}.`;
      const sg = (v) => (v < 0 ? "-" : "+");
      const vin = RIQ.righe(c.X.map((q, i) => `${dati.y[i] > 0 ? "" : "-"}(${n(q[0], 2)}\\, w_1 ${sg(q[1])} ${n(Math.abs(q[1]), 2)}\\, w_2 + b) \\ge 1 - \\xi_{${i + 1}}`), 3, ", \\quad ");
      const num = `<p class="plm-tit">${T(`Il QP dell'istanza: ${nn + 3} variabili, ${nn} vincoli (più \\(\\xi_i \\ge 0\\)).`, `The QP of the instance: ${nn + 3} variables, ${nn} constraints (plus \\(\\xi_i \\ge 0\\)).`)}</p>` +
        `<div class="plm-riga plm-lungo">\\(\\displaystyle \\begin{aligned} \\min ~~ & \\tfrac12 (w_1^2 + w_2^2) + ${n(c.C, 3)}\\, (\\xi_1 + \\xi_2 + \\dots + \\xi_{${nn}}) \\\\[1ex] ${SA()} ~~ & ${vin.join(", \\\\ & ")}, \\\\ & \\xi_i \\ge 0, \\quad ${PER("i", nn)}. \\end{aligned}\\)</div>`;
      const sol = RIQ.sol(`${T("Valore ottimo", "Optimal value")} \\(\\tilde z\\) = <b>${nt(c.obj, 3)}</b>`,
        [RIQ.tab("", [tx("\\tilde w_1"), tx("\\tilde w_2"), tx("\\tilde b"), tx("\\sum_i \\tilde\\xi_i"), T("margine \\(2/\\|\\tilde w\\|\\)", "margin \\(2/\\|\\tilde w\\|\\)")],
          [[nt(c.w[0], 3), nt(c.w[1], 3), nt(c.b, 3), nt(xi.reduce((s, v) => s + v, 0), 3), nt(2 / Math.hypot(c.w[0], c.w[1]), 3)]])],
        T(`Vettori di supporto (sul margine o dentro): ${sv}; classificati male: ${err}.`, `Support vectors (on the margin or inside it): ${sv}; misclassified: ${err}.`));
      RIQ.mostra(st, {
        problema: T("Una banca classifica i clienti come affidabili o insolventi a partire da due indicatori. Cerca la retta che separa le due classi con il margine più ampio, " +
          "pagando con il peso \\(C\\) i punti che violano il margine.",
          "A bank classifies customers as reliable or defaulting from two indicators. It looks for the line that separates the two classes with the widest margin, " +
          "paying with the weight \\(C\\) for the points that violate the margin."),
        variabili: T("\\(w_1, w_2, b\\): coefficienti e intercetta della retta \\(w_1 x_1 + w_2 x_2 + b = 0\\), liberi; \\(\\xi_i \\ge 0\\): violazione del margine del cliente \\(i\\), con \\(i \\in \\{1, \\dots, n\\}\\).",
          "\\(w_1, w_2, b\\): coefficients and intercept of the line \\(w_1 x_1 + w_2 x_2 + b = 0\\), free; \\(\\xi_i \\ge 0\\): margin violation of customer \\(i\\), with \\(i \\in \\{1, \\dots, n\\}\\)."),
        sig, tabelle: [tab, sca], piu, modello, cap: 12, num, sol,
        prova: T("Porta \\(\\log_{10} C\\) a 1: il margine si stringe a 0,41 e nessun cliente è classificato male. Trascina un punto lontano dal margine: la retta non si muove.",
          "Set \\(\\log_{10} C\\) to 1: the margin shrinks to 0.41 and no customer is misclassified. Drag a point far from the margin: the line does not move."),
      });
      return "";
    },
    domanda: " ",
  };

  // ================================================================ minimi quadrati (cap. 13)
  window.GI_RICETTE["pnl-minimi-quadrati"] = () => { let stCorr = null; return Object.assign(O.ricettaRetta({
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
    formula: (p, st) => { stCorr = st; return ""; },   // ricettaRetta non passa st alle letture
    letture(rette, p, dati, C) {
      const st = stCorr;
      if (!st) return "";
      const [ls, lad] = rette, nn = dati.t.length, sc = dati.info.sciopero.filter(Boolean).length;
      const ss = dati.y.reduce((s, v, i) => s + (v - ls.w * dati.t[i] - ls.b) ** 2, 0);
      const sa = dati.y.reduce((s, v, i) => s + Math.abs(v - lad.w * dati.t[i] - lad.b), 0);
      const sig = T("\\(n\\): numero di giorni; \\(t_i\\): temperatura del giorno \\(i\\) (°C); \\(y_i\\): pezzi venduti il giorno \\(i\\); \\(\\delta\\): spostamento della domanda del giorno normale più caldo; con \\(i \\in \\{1, \\dots, n\\}\\).",
        "\\(n\\): number of days; \\(t_i\\): temperature of day \\(i\\) (°C); \\(y_i\\): pieces sold on day \\(i\\); \\(\\delta\\): shift of the demand of the hottest normal day; with \\(i \\in \\{1, \\dots, n\\}\\).");
      const tab = RIQ.tab(T("Dimensioni", "Sizes"), [tx("n"), T("di sciopero", "strike days")], [[String(nn), String(sc)]]);
      const sca = RIQ.tab(T("Spostamento", "Shift"), [tx("\\delta")], [[nt(p.delta, 0)]]);
      const piu = RIQ.apri(T(`I ${nn} giorni (valori attuali)`, `The ${nn} days (current values)`),
        M.tab([tx("i"), tx("t_i"), tx("y_i"), T("sciopero", "strike")], dati.t.map((t, i) => [String(i + 1), nt(t, 1), nt(dati.y[i], 0), dati.info.sciopero[i] ? T("sì", "yes") : ""])));
      const modello = `\\min ~~ \\sum\\nolimits_{i=1}^{n} r_i^2 ~~ (\\text{QP}) \\quad \\text{${T("oppure", "or")}} \\quad \\min ~~ \\sum\\nolimits_{i=1}^{n} |r_i| ~~ (\\text{LP}) & & \\\\
        ${SA()} \\quad w\\, t_i + b + r_i &= y_i, & ${PER("i", "n")}.`;
      const vin = RIQ.righe(dati.t.map((t, i) => `${n(t, 1)}\\, w + b + r_{${i + 1}} = ${n(dati.y[i], 0)}`), 3, ", \\quad ");
      const num = `<p class="plm-tit">${T(`I due modelli dell'istanza: ${nn + 2} variabili, ${nn} vincoli.`, `The two models of the instance: ${nn + 2} variables, ${nn} constraints.`)}</p>` +
        `<div class="plm-riga plm-lungo">\\(\\displaystyle \\begin{aligned} \\min ~~ & r_1^2 + r_2^2 + \\dots + r_{${nn}}^2 ~~ (\\text{QP}) \\quad \\text{${T("oppure", "or")}} \\quad |r_1| + |r_2| + \\dots + |r_{${nn}}| ~~ (\\text{LP}) \\\\[1ex] ` +
        `${SA()} ~~ & ${vin.join(", \\\\ & ")}. \\end{aligned}\\)</div>` +
        `<p class="plm-nota">${T("Nel modello LP \\(|r_i|\\) si scrive con \\(r_i = r_i^+ - r_i^-\\), \\(r_i^+, r_i^- \\ge 0\\), e si minimizza \\(\\sum_i (r_i^+ + r_i^-)\\).",
          "In the LP model \\(|r_i|\\) is written with \\(r_i = r_i^+ - r_i^-\\), \\(r_i^+, r_i^- \\ge 0\\), and \\(\\sum_i (r_i^+ + r_i^-)\\) is minimized.")}</p>`;
      const sol = RIQ.sol(`${T("Valore ottimo", "Optimal value")} \\(\\tilde z(\\text{QP})\\) = <b>${mig(ss)}</b><br>${T("Valore ottimo", "Optimal value")} \\(\\tilde z(\\text{LP})\\) = <b>${mig(sa, 1)}</b>`,
        [RIQ.tab("", ["", tx("\\tilde w"), tx("\\tilde b")], [
          [M.tinta(C.a, T("minimi quadrati (QP)", "least squares (QP)")), nt(ls.w, 3), nt(ls.b, 2)],
          [M.tinta(C.blu, T("scarti assoluti (LP)", "least abs. deviations (LP)")), nt(lad.w, 3), nt(lad.b, 2)]])]);
      RIQ.mostra(st, {
        problema: T("Una panetteria stima con una retta i pezzi venduti in funzione della temperatura. Si confrontano due criteri: la somma dei quadrati dei residui (QP) " +
          "e la somma dei loro valori assoluti (LP), con alcuni giorni di sciopero anomali.",
          "A bakery estimates the pieces sold as a function of the temperature with a line. Two criteria are compared: the sum of the squared residuals (QP) " +
          "and the sum of their absolute values (LP), with some anomalous strike days."),
        variabili: T("\\(w, b\\): pendenza e intercetta della retta, libere; \\(r_i\\): residuo del giorno \\(i\\), libero, con \\(i \\in \\{1, \\dots, n\\}\\).",
          "\\(w, b\\): slope and intercept of the line, free; \\(r_i\\): residual of day \\(i\\), free, with \\(i \\in \\{1, \\dots, n\\}\\)."),
        sig, tabelle: [tab, sca], piu, modello, cap: 13, num, sol,
        prova: T("Porta \\(\\delta\\) a −200: \\(\\tilde w\\) del QP passa da −3,61 a −4,32, quello del LP solo a −3,74. Con \\(\\delta = 0\\), scegli «55 giorni normali»: \\(\\tilde b\\) del QP sale da 202,34 a 213,58.",
          "Set \\(\\delta\\) to −200: \\(\\tilde w\\) of the QP goes from −3.61 to −4.32, that of the LP only to −3.74. With \\(\\delta = 0\\), choose «55 normal days»: \\(\\tilde b\\) of the QP rises from 202.34 to 213.58."),
      });
      return "";
    },
    domanda: " ",
  }), { etichettaFunzioni: T("Giorni", "Days") }); };   // «Dati» è il nome del riquadro
})();
