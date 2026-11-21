"""Runs all the laboratory scripts in sequence.

Regenerates: data (data/*.csv) and, in FIG = volumes/lecture_notes/lecture_notes_1_nlp_modelling/figure/,
the data for the pgfplots figures (FIG/dat/*.csv), TikZ diagrams (FIG/*.tex), matplotlib
previews (FIG/*.pdf); then the chapter notebooks (notebooks/*.ipynb).

Usage:  python3 run_all.py
"""
import subprocess
import sys
import time
from pathlib import Path

SCRIPT = [
    "lab04_production_quadratic.py",
    "lab05_supplychain.py",
    "lab06_markowitz.py",
    "lab07_pricing.py",
    "lab08_budget.py",
    "lab09_location.py",
    "lab10_ev_charging_quadratic.py",
    "lab11_queues.py",
    "lab12_svm.py",
    "lab13_least_squares.py",
]

base = Path(__file__).resolve().parent
inizio = time.time()
for s in SCRIPT:
    print(f"\n{'#' * 72}\n# {s}\n{'#' * 72}")
    esito = subprocess.run([sys.executable, str(base / s)], cwd=base)
    if esito.returncode != 0:
        print(f"ERROR in {s}: stopping.")
        sys.exit(1)
print(f"\n{'#' * 72}\n# make_notebooks.py\n{'#' * 72}")
esito = subprocess.run([sys.executable, str(base / "make_notebooks.py")], cwd=base)
if esito.returncode != 0:
    print("ERROR while generating the notebooks: stopping.")
    sys.exit(1)

print(f"\nAll scripts completed in {time.time() - inizio:.1f} s.")
