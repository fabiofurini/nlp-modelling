# Theory: nonlinear optimization

[:material-file-pdf-box: Lecture notes (PDF)](pdf/nlp-modelling-notes.pdf) · [:material-presentation: Chapter slides (PDF)](pdf/slides-02-background.pdf)

!!! nota "Prerequisites"

    - From the module *Convex Optimization*, [Chapter 3 «Convex and concave functions»](https://fabiofurini.github.io/convex-optimization/preliminaries/03-convex-concave-functions/): convex and concave functions and their second-order characterisation.

    - From the module *Convex Optimization*, [Chapter 4 «Quadratic functions»](https://fabiofurini.github.io/convex-optimization/preliminaries/04-quadratic-functions/): quadratic functions and positive semidefinite matrices.

    - From the module *LP Modelling*, [Chapter 2 «Background: linear programming and sensitivity analysis»](https://fabiofurini.github.io/lp-modelling/theory-lp/): LP duality, complementary slackness and shadow prices.

!!! chiave "Objectives"

    At the end of this chapter you will be able to:

    - recognise a convex problem and use the fact that every local minimum is global;

    - decide whether a QP is convex from the matrix $\boldsymbol Q$;

    - write the KKT conditions of a problem and use them to check a solution;

    - read the multipliers as shadow prices and estimate them by perturbation.

The theory background of the course: convexity, quadratic programming and KKT
conditions — the nonlinear extension of LP theory, recalled in
[LP Modelling](https://fabiofurini.github.io/lp-modelling/theory-lp/) together with the
sensitivity protocol. Convex sets and functions are covered in the course
[Convex Optimization](https://fabiofurini.github.io/convex-optimization/).

## Convexity and quadratic programming

A **QP** has objective $\tfrac12 \boldsymbol x' \boldsymbol Q\, \boldsymbol x +
\boldsymbol c' \boldsymbol x$ and linear constraints; it is convex if and only if
$\boldsymbol Q \succeq 0$. In a convex problem every local minimum is global:
optimality can be *certified*.

!!! example "A 2×2 QP, worked out in full"
    Separable quadratic objective and a threshold constraint on the sum:

    $$
    \begin{array}{r r@{\;}c@{\;}r c r l}
    \min & x_1^2 & + & 2\,x_2^2 & & & \\
    \text{subject to} & x_1 & + & x_2 & \ge & 6 & \\
     & x_1, & & x_2 & \ge & 0 &
    \end{array}
    $$

    $\boldsymbol Q = \mathrm{diag}(2, 4) \succ 0$: convex, global optimum.
    **Solving we obtain**: $\tilde x_1 = 4$, $\tilde x_2 = 2$,
    $\tilde f = 24$, $\lambda = 8$.
    **Check**: the constraint is active ($4 + 2 = 6$) and partial derivatives coincide:

    $$
    2\tilde x_1 = 8 = 4\tilde x_2 = \lambda . \quad ✓
    $$

    **By perturbation**: with right-hand side 7, $\tilde f = 32.67 \approx 24 + 8$
    (plus the curvature term).

## The nonlinear optimality conditions: the KKT conditions

For $\min f(x_1, \dots, x_n)$ subject to $g_i(x_1, \dots, x_n) \le 0$ and
$h_j(x_1, \dots, x_n) = 0$, the Lagrangian is

$$
L(x_1, \dots, x_n) = f(x_1, \dots, x_n)
+ \sum_{i=1}^{m} \lambda_i g_i(x_1, \dots, x_n)
+ \sum_{j=1}^{q} \nu_j h_j(x_1, \dots, x_n),
\qquad \lambda_i \ge 0 ;
$$

at a regular optimal point $(\tilde x_1, \dots, \tilde x_n)$ there exist
$\lambda_i \ge 0$, $\nu_j$ such that:

$$
\frac{\partial L}{\partial x_k}(\tilde x_1, \dots, \tilde x_n) = 0 \;\;
\forall k \in \{1, 2, \dots, n\},
\qquad \lambda_i\, g_i(\tilde x_1, \dots, \tilde x_n) = 0 \;\;
\forall i \in \{1, 2, \dots, m\} .
$$

If the problem is convex the KKT conditions are also sufficient. **In the linear
case the KKT conditions are exactly complementary slackness** for the pair
(P)–(D): stationarity is the feasibility of the dual (multipliers = $\pi_i$, and
the multipliers of the sign constraints are the reduced costs), complementarity is
$\bar\pi_i \cdot \bar s_i = 0$. The multipliers generalize the shadow prices;
when the duals are not available, they are estimated **by perturbation** (increase
the right-hand side by $\varepsilon$, re-optimize, incremental ratio).

!!! example "The KKT conditions on the QP of the example"
    On the model $\min x_1^2 + 2x_2^2$ subject to $x_1 + x_2 \ge 6$:
    stationarity $2x_1 = \lambda$, $4x_2 = \lambda$; the constraint must be active
    (otherwise $x_1 = x_2 = 0$, which violates it): $\lambda = 8$, $\tilde x_1 = 4$,
    $\tilde x_2 = 2$, $\tilde f = 24$ — the same numbers as before, now obtained
    with the general procedure. With right-hand side $6 + \varepsilon$ the optimal
    value grows by $\approx 8\varepsilon$ (exactly: $\tilde f(d) = \tfrac{2}{3}d^2$,
    hence $24 + 8\varepsilon + \tfrac{2}{3}\varepsilon^2$).

## In summary

!!! chiave "In summary"

    - In a convex problem every local minimum is global; a QP is convex if and only if $\boldsymbol Q \succeq 0$.

    - The KKT conditions are stationarity of the Lagrangian, feasibility and complementarity; in convex problems they are sufficient.

    - In the linear case the KKT conditions reduce to complementary slackness.

    - The multipliers are shadow prices, and they can also be estimated by perturbation.
