import matplotlib.pyplot as plt
import numpy as np

# Datensatz
data = [
    10,
    0,
    268,
    535,
    0,
    0,
    563,
    367,
    703,
    432,
    636,
    109,
    432,
    352,
    458,
    0,
    0,
    620,
    0,
    472,
    510,
    479,
    0,
    214,
    305,
    0,
    0,
    0,
    698,
    0,
    108,
]

# Berechnung des Mittelwerts und der Standardabweichung
mean = np.mean(data)
std_dev = np.std(data)

# Berechnung der Grenzen für die zweite Standardabweichung
lower_bound = mean - 2 * std_dev
upper_bound = mean + 2 * std_dev

# Erstellen des Plots
plt.figure(figsize=(10, 6))
plt.hist(data, bins=20, color="blue", alpha=0.7, edgecolor="black")
plt.axvline(mean, color="red", linestyle="dashed", linewidth=2)
plt.axvline(lower_bound, color="green", linestyle="dashed", linewidth=2)
plt.axvline(upper_bound, color="green", linestyle="dashed", linewidth=2)
plt.title("Verteilung der Datenpunkte")
plt.xlabel("Werte")
plt.ylabel("Häufigkeit")
plt.grid(True)
plt.show()
