# The notebooks of the course

Every chapter with a model has its own **notebook**: one click on the badge opens
it in Google Colab, it installs the solver by itself and runs in the browser —
nothing to install on your machine. It is the very same code as the scripts in
`python/`, cell by cell, with the figures appearing below the cells instead of
being written to a file.

!!! tip "The pip licence is enough"
    The licence bundled with `gurobipy` is limited to 2000 variables and 2000
    constraints, and every model of the course fits easily: the largest one —
    electric vehicle charging — uses 144 and 30. For larger models, activate the
    free academic licence at [portal.gurobi.com](https://portal.gurobi.com).

| Chapter | Class | Notebook |
|---|---|---|
| [Production with quadratic smoothing](production-quadratic.md) | convex QP | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fabiofurini/nlp-modelling/blob/main/notebooks/lab04_production_quadratic.ipynb) |
| [Supply chain with congestion and sustainability](supplychain.md) | LP / convex NLP | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fabiofurini/nlp-modelling/blob/main/notebooks/lab05_supplychain.ipynb) |
| [The Markowitz portfolio](markowitz.md) | convex QP | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fabiofurini/nlp-modelling/blob/main/notebooks/lab06_markowitz.ipynb) |
| [Pricing and revenue management](pricing.md) | concave / non-convex NLP | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fabiofurini/nlp-modelling/blob/main/notebooks/lab07_pricing.ipynb) |
| [Advertising budget allocation](budget.md) | convex NLP | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fabiofurini/nlp-modelling/blob/main/notebooks/lab08_budget.ipynb) |
| [Continuous location of a service](location.md) | convex NLP | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fabiofurini/nlp-modelling/blob/main/notebooks/lab09_location.ipynb) |
| [Electric vehicle charging with a smooth profile](ev-charging-quadratic.md) | convex QP | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fabiofurini/nlp-modelling/blob/main/notebooks/lab10_ev_charging_quadratic.ipynb) |
| [Service capacity and waiting times](queues.md) | convex NLP (M/M/1 queue) | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fabiofurini/nlp-modelling/blob/main/notebooks/lab11_queues.ipynb) |
| [Support Vector Machine: optimization for machine learning](svm.md) | convex QP | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fabiofurini/nlp-modelling/blob/main/notebooks/lab12_svm.ipynb) |
| [Least-squares regression](least-squares.md) | convex QP | [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fabiofurini/nlp-modelling/blob/main/notebooks/lab13_least_squares.ipynb) |

## How they are made

The notebooks are not written by hand: they are generated from the scripts with

```bash
python3 python/make_notebooks.py
```

The chapter script remains the single source of the code — the notebook takes its
docstring, sections and comments from it — and whoever prefers the command line
keeps running, from the `python/` folder:

```bash
python3 lab06_markowitz.py
```

## Installation and licence

Working locally needs only `gurobipy`:

```bash
python3 -m pip install gurobipy
```

The pip package ships with a **demo licence** (up to 2000 variables and 2000 constraints):
enough for every model in this lab. At start-up the line
`Restricted license - for non-production use only` appears: this is normal.

**Full academic licence (free of charge):**

1. register at <https://portal.gurobi.com> with your institutional email (`@uniroma1.it`);
2. request a *Named-User Academic License*;
3. run the command `grbgetkey XXXXXXXX-...` shown by the portal (you need the university network or a VPN);
4. the licence is saved in `~/gurobi.lic` and from that moment there are no size limits.

Quick check:

```python
import gurobipy as gp
print(gp.gurobi.version())        # e.g. (13, 0, 3)
```

## Regenerating everything

```bash
python3 -m pip install gurobipy matplotlib pandas scipy   # scipy: statistical functions only
python3 python/run_all.py             # regenerates data, results and figures
```

The [repository](https://github.com/fabiofurini/nlp-modelling)
holds all the **Python scripts** and the case study **data** in CSV format.
