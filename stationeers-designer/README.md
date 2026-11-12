# Stationeers Base Designer

Single-file, offline tool: open `index.html` in a browser. No build step.

- 2D tile planner (1 tile = one 2 m large-grid cell, 8 m³), multiple levels
- Layers: structure, devices, cables, gas/liquid pipes, chutes
- Live analysis: sealed/leaking rooms, airlock check, gas needed to fill each room,
  power generation vs demand vs weakest cable, unplumbed / unpowered devices, parts list
- Save/load JSON, PNG export, undo/redo

## Data accuracy
Part list, wattages and cable ratings are **approximations from general game knowledge**,
not extracted from `Stationeers.exe` / the game's data files. Use **Catalog values** in the app
to correct them; the new numbers are saved with your project. Parts are defined in the `ITEMS`
array near the top of the script.
