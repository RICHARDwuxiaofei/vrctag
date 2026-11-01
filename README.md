# vrctag

Generate printable VRC-style name tags with custom text and multicolor 3MF export. No name is preset.

## Setup

Requires Windows, Python 3 with tkinter, and Blender 4.2 or newer.

Download the repository and keep `nametag_template.blend` beside the script. Run `start.cmd` or `python name_tag_generator.py`. Select your Blender executable and output folder, enter a name and status, then click **Generate**.

Blender runs in the background without MCP. Local preferences are saved in the ignored `settings.json`. Previous exports are preserved using revision numbers.

## Multicolor printing

Open the generated **3MF as a project** in Creality Print and load filament colors. Five parts retain assembly positions and filament assignments:

| Slot | Parts | Color |
| --- | --- | --- |
| 1 | Rim and status text | White |
| 2 | Base | Black |
| 3 | Name | Yellow |
| 4 | Status dot | Based on status |

Select printer and material settings, slice and inspect the preview, then map colors to actual CFS filaments before printing. The 3MF is an unsliced project.

Statuses: `online` (green), `offline` (gray), `busy` / `dnd` (red), `away` (orange). Custom status text is supported.

Each run also exports five STL files, an editable Blender file, mesh validation and printing instructions. STL has no colors: import all five together as parts of one object and assign filaments.

Size: approximately 109.05 × 43.84 × 3.6 mm. Designed for multicolor printing, without snap-fit joints for separate assembly. Long text shrinks automatically; inspect thin strokes in the slicing preview.

## Command line

After configuring Blender in the GUI:

```powershell
python name_tag_generator.py --name "Your name" --status online --output "D:\Tags"
```

The template contains only the base, rim and dot, with a packed font supporting Chinese and Latin text. Names and status text are generated from input.

`upgrade_existing.py` creates multicolor copies of old 3MF files in model folders under the repository's parent directory, preserving originals.
