# Organization of the course

<!-- collana-dalla-home -->
## The course at a glance

**10 application chapters · 3 tools chapters · QP and NLP · one Colab notebook per
chapter · reproducible Python/Gurobi code.** The full list is in the
[syllabus](syllabus.md). The course follows
[LP Modelling](https://fabiofurini.github.io/lp-modelling/), from which it takes the
notation, the general solver commands and the sensitivity protocol.

## Download as PDF

- 📘 **[Full lecture notes](pdf/nlp-modelling-notes.pdf)** — models, worked examples, case studies, sensitivity analysis
- 📊 **[Lecture slides](downloads.md)** — one deck per chapter, on the [downloads](downloads.md) page

## Getting started

Nothing to install: every chapter has its
[notebook that opens in Colab](notebooks.md) and runs in the browser.
<!-- /collana-dalla-home -->

## Essential path in four sessions

| | Content | Learning objectives |
|---|---|---|
| **Lab 1** | Markowitz | build a convex QP; trace a frontier; discuss the fragility of the estimates |
| **Lab 2** | Production with smoothing | add a quadratic term to a linear model; read and verify the multipliers of a QP |
| **Lab 3** | Pricing *or* budget | model nonlinear functions; study concavity; verify the KKT conditions numerically |
| **Lab 4** | Project of your choice | supply chain, location, EV charging, queues, SVM or least squares; management presentation |

## The most common mistakes

1. Reading `.X` or `.Pi` without checking `m.Status`.
2. Forgetting `lb=-GRB.INFINITY` on free variables ($b$ of the SVM, the residuals of least squares).
3. Using the multiplier of a QP for a large increment: it is exact only at the margin.
4. Forgetting `NonConvex = 2` with bilinear terms, or believing a problem convex when it is not.
5. Updating the RHS of a constraint with constants on the left.
6. Optimizing a single objective when there are two.
7. Choosing the hyperparameters by looking at the test set.
8. Reporting six decimal digits of estimates that wobble at the second.

## Reproducibility

```bash
python3 -m pip install gurobipy matplotlib pandas
python3 python/lab06_markowitz.py    # every script runs on its own
```

The solutions of the exercises are handed out in class.
