# Implementation: nonlinear models

[:material-file-pdf-box: Lecture notes (PDF)](pdf/nlp-modelling-notes.pdf) · [:material-presentation: Chapter slides (PDF)](pdf/slides-03-python-gurobi.pdf)

The general `gurobipy` commands (building, running, reading the solution) are in
[LP Modelling, "Implementation: linear models"](https://fabiofurini.github.io/lp-modelling/solver-lp/)
and in the [solver guide](https://github.com/fabiofurini/lp-modelling/blob/main/GUROBI_GUIDE.md).
Here only what is specific to nonlinear models.

**A single solver: general NLPs are solved with Gurobi too** (from version 12
on), with the same syntax and the same checklist as the linear models.
Nonlinear functions as functional constraints on auxiliary variables — `addGenConstrLog`,
`addGenConstrExp`, `addGenConstrPow` with `m.Params.FuncNonlinear = 1` — and bilinear terms
with `m.Params.NonConvex = 2`: the optimum remains **globally certified**. Examples in the
lab: advertising budget (`log`), constant-elasticity pricing (`Pow` + bilinear), M/M/1 queues
(bilinear constraint `w·(mu - lam) = 1`), Weber (conic constraints `dx² + dy² ≤ d²`, a convex
QCP). For marginal analyses tighten `MIPGap`, `FeasibilityTol` and `OptimalityTol`
to `1e-9`; reformulate to avoid tiny quantities (e.g. `q·p^eps ≤ A` instead of
`q ≤ A·p^(-eps)`).


## Quadratic objectives

**Quadratic** objectives (Markowitz, SVM, smoothing, least squares) are written in the
natural way, as products of variables or of linear expressions:

```python
m.setObjective(x @ Q @ x, GRB.MINIMIZE)                  # matrix form (numpy)
m.setObjective(gp.quicksum(q[i,j]*x[i]*x[j] for i in I for j in I), GRB.MINIMIZE)
m.Params.NonConvex = 2      # only for non-convex QPs (e.g. pricing p*q)
```

If $\boldsymbol Q \succeq 0$ the QP is convex and no parameter is needed; with
`NonConvex = 2` Gurobi solves non-convex QPs to global optimality as well. If `Pi` is not
available (quadratic or functional constraints) use `m.Params.QCPDual = 1` for quadratic
constraints, otherwise the check by perturbation.

## How they are written

```python
m.Params.FuncNonlinear = 1     # functions handled exactly (globally)
z = m.addVar(lb=-GRB.INFINITY)
m.addGenConstrLog(g, z)        # z = log(g);  also Exp, Pow, Sin, ...
m.addQConstr(w * v == 1)       # bilinear terms: NonConvex = 2 is required
```

Two practical devices, both used in the scripts of the lab:

- **tolerances**: for accurate marginal analyses (differences between two
  nearby optima) tighten `MIPGap`, `FeasibilityTol` and `OptimalityTol` to `1e-9`;
- **scaling**: reformulate to avoid tiny quantities — for instance
  `q ≤ A·p^(-eps)` is written `q·r ≤ A` with `r = p^eps`, which keeps the numbers in a
  healthy range.

## The multipliers in nonlinear models

For convex QP/NLP the multipliers (`Pi` on the linear constraints, KKT conditions in general)
have the same marginal reading as shadow prices. Numerical check recommended in the
lab: perturb the right-hand side by ε and check again that
`new_optimum ≈ old_optimum + Pi·ε`.


## Multipliers in convex QPs

In convex QPs with linear constraints the attribute `Pi` of each constraint is the KKT
multiplier; quadratic constraints need `m.Params.QCPDual = 1` (attribute `QCPi`).
Unlike in LPs the multiplier is exact only at the margin: the check by perturbation
uses a small $\varepsilon$ (example in the chapter
[Production with quadratic smoothing](production-quadratic.md)).

## Why a single solver

Same syntax, same interpretation checklist and — above all — a **certified
global** optimum even in non-convex problems: with a local solver every result
would have to be accompanied by the question “is it only a local optimum?”.
Convex problems with a purely quadratic or conic structure (constraints such as
`dx² + dy² ≤ d²`) require nothing special.
