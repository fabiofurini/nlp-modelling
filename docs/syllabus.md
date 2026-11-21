# Syllabus

<!-- collana-dalla-fascia -->
Every chapter starts from a concrete management problem — how much risk to accept,
which price to set, where to locate a service, how smooth a plan should be — turns it
into a **nonlinear** model, solves it with Gurobi called from Python and *questions*
it: how much is one more unit of a resource worth? how much does a smoother plan cost?

Every model can be run **right away in the browser**: each chapter has its
[notebook that opens in Colab](notebooks.md), with nothing to install.
Prerequisites: [LP Modelling](https://fabiofurini.github.io/lp-modelling/) and
[Convex Optimization](https://fabiofurini.github.io/convex-optimization/).
<!-- /collana-dalla-fascia -->

The full list of chapters, in the order in which they are covered.

**[Tools](tools.md)**

1. Introduction to the course — this page and the [home page](index.md)
2. [Theory: nonlinear optimization](theory-nonlinear.md) — convexity, QP, KKT
3. [Solver: nonlinear models](solver-nonlinear.md) — functional and bilinear constraints, multipliers

**[Deterministic models](deterministic-models.md)**

4. [Production with quadratic smoothing](production-quadratic.md) — convex QP
5. [Supply chain with congestion and CO₂](supplychain.md) — convex NLP
6. [Markowitz portfolio](markowitz.md) — convex QP
7. [Pricing and revenue management](pricing.md) — NLP
8. [Advertising budget](budget.md) — convex NLP
9. [Continuous location](location.md) — convex NLP
10. [EV charging with a smooth profile](ev-charging-quadratic.md) — convex QP
11. [Queues and service capacity](queues.md) — convex NLP

**[Optimization and machine learning](optimization-ml.md)**

12. [Support Vector Machine](svm.md) — convex QP
13. [Least-squares regression](least-squares.md) — convex QP

**The course**

14. [Organization of the course](organization.md) — sessions and mistakes to avoid
