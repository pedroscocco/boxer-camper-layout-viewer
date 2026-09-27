# Boxer camper layout viewer

Live site: <https://pedroscocco.github.io/boxer-camper-layout-viewer/>

This is a shareable, simplified 3D view of the owner's 2017 Peugeot Boxer L1H1 planning dimensions and the selected 1650 × 1900 mm sofa-bed surface. Rotate, zoom, and switch between flat bed and sofa in a browser. The solid panels and generic support bars depict space and pose only.

The site intentionally excludes the purchased bed plan, its drawings, and the detailed local Blender reconstruction. It is not a cut list, folding simulation, or load-bearing design.

Open `index.html` through a local static server. In the main CAD project, publish updates to the same URL with `python3 scripts/publish_viewer.py`; that script pushes only reviewed viewer files to this separate repository. The page uses Three.js 0.180.0 from jsDelivr and requires an internet connection to load that library.

Measurements are in millimetres: cargo floor length 2520, maximum width 1850, rear width 1620 with schematic full-height 45° corners, arch clear gap 1410, arch height 360, deck 1650 × 1900 at 420 above floor. Exact arch X positions, door openings and trim remain schematic.
