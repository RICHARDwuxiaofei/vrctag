# vrctag

Generate printable VRC-style name tags with custom text and multicolor 3MF export. No name is preset.

## Attribution and license

Adapted from **[VRC名牌吊牌 by WiseWolf](https://makerworld.com.cn/zh/models/203011-vrcming-pai-diao-pai)** under **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)**. Credit the original creator, use noncommercially, and distribute model adaptations under the same license. This version changes the rim, text relief and dot placement and adds automated text, multicolor export and display options. See [ATTRIBUTION.md](ATTRIBUTION.md) and [LICENSE](LICENSE). WiseWolf does not endorse this project.

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

**3MF only** is enabled by default and creates only the printable 3MF in the result folder. Turn it off for five STL files, an editable Blender file, mesh validation and printing instructions. STL has no colors: import all five together as parts of one object and assign filaments.

The status dot aligns with the left edge of the name and sits immediately before the status text. Text relief is 0.5 mm (half the original 1 mm). The rim has a flat top and vertical sides, without a rounded vertical profile.

Status text and dot color can be selected independently. Choose automatic matching, a status color, or a custom color with the picker / `#RRGGBB` field. VRChat-style colors from [VRCX's official status palette](https://github.com/vrcx-team/VRCX/blob/master/src/styles/globals.css): online `#2ED319`, join me `#00B8FF`, ask me `#E97C03`, busy `#C80928`.

For display use, disable **3MF only**, enable **Avatar image**, and choose a PNG, JPG, JPEG, WebP or BMP. The image is center-cropped into the circular avatar area and packed into the Blender file. View it using Material Preview. It is not converted into printable geometry or included in 3MF/STL. Transparent images are supported. The original image file is no longer needed to open the saved Blender file.

Size: approximately 109.05 × 43.84 × 3.6 mm. Designed for multicolor printing, without snap-fit joints for separate assembly. Long text shrinks automatically; inspect thin strokes in the slicing preview.

## Command line

After configuring Blender in the GUI:

```powershell
python name_tag_generator.py --name "Your name" --status online --output "D:\Tags"
```

Optional flags: `--status-color "join me"` (or `#RRGGBB`), `--full-export`, and `--icon "avatar.png"` (requires `--full-export`).

The template contains only the base, rim and dot, with a packed font supporting Chinese and Latin text. Names and status text are generated from input.

`upgrade_existing.py` creates multicolor copies of old 3MF files in model folders under the repository's parent directory, preserving originals.
