# Deterministic models

Eight chapters where every datum is known: you decide under certainty, and the
value lies in interrogating the solution (how much is one more unit of a
resource worth? where does the plan break?).

Inside you will find QPs, convex NLPs and a non-convex NLP: **the modelling
language changes, the workflow does not** --- build the model, solve it, read the
multipliers, move the data and see what holds.

<div class="grid cards" markdown>

-   :material-factory: **Production with quadratic smoothing**

    ---

    The quadratic variant of the production case: a penalty on the jumps levels
    the plan; QP multipliers and the cost-smoothness frontier.

    [:octicons-arrow-right-24: Convex QP](production-quadratic.md)

-   :material-truck-delivery: **Supply chain and CO₂**

    ---

    Minimum-cost flow, convex congestion and the cost-emissions frontier with an
    internal carbon price.

    [:octicons-arrow-right-24: Convex NLP](supplychain.md)

-   :material-chart-line: **Markowitz portfolio**

    ---

    The most famous QP in history: efficient frontier, diversification and the
    fragility of the estimates.

    [:octicons-arrow-right-24: QP](markowitz.md)

-   :material-currency-eur: **Pricing and revenue management**

    ---

    Endogenous demand, bilinear objective, corner optima and the true value of
    one more seat.

    [:octicons-arrow-right-24: NLP](pricing.md)

-   :material-bullhorn: **Advertising budget**

    ---

    Diminishing returns, the KKT condition «equal marginal return on every active
    channel», value-versus-budget curve.

    [:octicons-arrow-right-24: Convex NLP](budget.md)

-   :material-map-marker: **Continuous location**

    ---

    Centroid, Weber point and minimax on the map: efficiency versus equity, with
    a geographic constraint.

    [:octicons-arrow-right-24: Convex NLP](location.md)

-   :material-ev-station: **EV charging with a smooth profile**

    ---

    The quadratic variant of overnight charging: the total draw is smoothed,
    the multipliers of the vehicles coincide.

    [:octicons-arrow-right-24: Convex QP](ev-charging-quadratic.md)

-   :material-account-clock: **Queues and service capacity**

    ---

    The utilisation wall: optimal capacity, the price of a service promise,
    robustness to uncertain demand.

    [:octicons-arrow-right-24: Convex NLP](queues.md)

</div>
