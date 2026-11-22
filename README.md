<h3 align="center">Teaching material by
<a href="https://fabiofurini.github.io/">Fabio Furini</a></h3>
<p align="center">
  Associate professor of Operations Research ·
  <a href="https://www.diag.uniroma1.it/">DIAG</a>, Sapienza University of Rome ·
  <a href="https://fabiofurini.github.io/">personal website</a>
</p>

# NLP Modelling

> **The author.** Since September 2021 Fabio Furini has been an associate
> professor at DIAG, Sapienza University of Rome. Ph.D. in Control Engineering
> and Operations Research at the University of Bologna (2011), research fellow
> there until 2012; postdoc at Université Paris-13 (2012–2013); from 2013 to 2019
> *Maître de Conférences* at Université Paris-Dauphine. *Habilitation à Diriger
> des Recherches* in France in 2017 and Italian National Scientific
> Qualification for Full Professor in Operations Research in 2019. In 2020 CNR
> researcher at IASI-CNR in Rome.
> Personal website: <https://fabiofurini.github.io/>

Nonlinear programming models — the online version of the course lecture notes, with
Python/Gurobi code and reproducible case studies. Prerequisites:
[LP Modelling](https://fabiofurini.github.io/lp-modelling/) and
[Convex Optimization](https://fabiofurini.github.io/convex-optimization/).

**📖 Online lecture notes: [fabiofurini.github.io/nlp-modelling](https://fabiofurini.github.io/nlp-modelling/)**

**▶️ Notebooks runnable in Colab: [the list of chapters](https://fabiofurini.github.io/nlp-modelling/notebooks/)** — they run in the browser, with nothing to install.

## Download as PDF

- [Full lecture notes](https://fabiofurini.github.io/nlp-modelling/pdf/nlp-modelling-notes.pdf)
- [Lecture slides](https://fabiofurini.github.io/nlp-modelling/downloads/), one deck per chapter, on the downloads page

## Contents

**Tools**

- [Theory: nonlinear optimization](https://fabiofurini.github.io/nlp-modelling/theory-nonlinear/) — convexity, QP, KKT conditions
- [Solver: nonlinear models](https://fabiofurini.github.io/nlp-modelling/solver-nonlinear/) — quadratic objectives, functional and bilinear constraints, multipliers

**Deterministic models**

- [Production with quadratic smoothing](https://fabiofurini.github.io/nlp-modelling/production-quadratic/) — convex QP
- [Supply chain with congestion and CO₂](https://fabiofurini.github.io/nlp-modelling/supplychain/) — convex NLP
- [Markowitz portfolio](https://fabiofurini.github.io/nlp-modelling/markowitz/) — convex QP
- [Pricing and revenue management](https://fabiofurini.github.io/nlp-modelling/pricing/) — NLP
- [Advertising budget](https://fabiofurini.github.io/nlp-modelling/budget/) — convex NLP
- [Continuous location](https://fabiofurini.github.io/nlp-modelling/location/) — convex NLP
- [Electric vehicle charging with a smooth profile](https://fabiofurini.github.io/nlp-modelling/ev-charging-quadratic/) — convex QP
- [Queues and service capacity](https://fabiofurini.github.io/nlp-modelling/queues/) — convex NLP

**Optimization and machine learning**

- [Support Vector Machine](https://fabiofurini.github.io/nlp-modelling/svm/) — convex QP
- [Least-squares regression](https://fabiofurini.github.io/nlp-modelling/least-squares/) — convex QP

**The course**

- [Organization of the course](https://fabiofurini.github.io/nlp-modelling/organization/) — sessions and mistakes to avoid

## Running the models

Every chapter has its script in [`python/`](python/) (`lab04`–`lab13`):

```bash
python3 -m pip install gurobipy matplotlib pandas
python3 python/lab06_markowitz.py   # every script runs on its own
```

With nothing to install, every chapter has its notebook in [`notebooks/`](notebooks/): it opens in
Colab from the badge at the top of the chapter page and runs in the browser; it contains the same
code as the script. The
data of the cases taken from LP Modelling (production, EV charging, bakery) live in the
[LP Modelling](https://github.com/fabiofurini/lp-modelling) repository: the scripts here write them
again with the same values.

## Licence

- **Text, figures and data** (`docs/`, `data/`): [CC BY 4.0](LICENSE) — anyone may
  reuse, adapt and redistribute them, in other courses too, with attribution.
- **Python code** (`python/`): [MIT](LICENSE-CODE), the usual licence for software,
  so that reusing the scripts raises no ambiguity.

To cite the material see [`CITATION.cff`](CITATION.cff): GitHub turns it into the
*Cite this repository* entry. Exercise solutions are not
published: they are distributed in class.

## Versione italiana

The whole course is also available in Italian:
**[fabiofurini.github.io/modellazione-pnl](https://fabiofurini.github.io/modellazione-pnl/)**
([repository](https://github.com/fabiofurini/modellazione-pnl)).

## Same series

- [LP Modelling](https://fabiofurini.github.io/lp-modelling/)
- [MIP Modelling](https://fabiofurini.github.io/mip-modelling/)
- [Mathematical Analysis 1](https://fabiofurini.github.io/mathematical-analysis-1/)
- [Linear Algebra](https://fabiofurini.github.io/linear-algebra/)
- [Linear Programming](https://fabiofurini.github.io/linear-programming/)
- [Convex Optimization](https://fabiofurini.github.io/convex-optimization/)
- [Algorithms](https://fabiofurini.github.io/algorithms/)

---

Teaching material by **[Fabio Furini](https://fabiofurini.github.io/)** — [DIAG](https://www.diag.uniroma1.it/), Sapienza University of Rome.
Exercise solutions are distributed in class.
