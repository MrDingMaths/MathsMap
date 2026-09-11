# Adjusting question layouts in Booklet Studio

Select a question's text or diagram, then choose **Arrange question** in the main editing toolbar. This opens the existing arrangement editor with its **Question structure**, preview and **Selection properties** panels. The same controls work in all projects.

- **Reduce a horizontal diagram/text gap:** select their **Row** (a named row such as **Diagram beside question parts**) in Question structure and change **Gap (mm)**. If the blank area comes from an oversized diagram column, drag the column divider in the preview, or select the column and change **Column proportion**. Diagram width is separate from column width.
- **Reduce vertical spacing:** select the item and change **Space above (mm)** or **Space below (mm)**. Select its containing group to change the **Gap (mm)** between stacked items.
- **Put a diagram after the parts:** select the diagram and use **Move after** until it follows the parts group. If it is nested inside another column, first use **Move out of column**. You can also drag it below an item or into a group. The parts keep their own order and response spaces.
- **Edit the text or drawing:** select **Edit selected content**. **Apply to question** returns to the layout controls. **Discard content draft** returns without applying that draft. Use the dialog's **Save** to apply the whole arrangement; **Cancel** leaves the project unchanged.

**Question spacing** in the main toolbar still changes answer-space height or vertical gaps throughout a whole question. Use the arrangement editor for a particular gap, column or item.

## Acceptance, 12 September 2026

The layout inspector no longer immediately switches back into content editing. Selecting a diagram uses its actual saved arrangement item ID, including imported custom IDs. The toolbar opens the selected diagram or question prompt at the containing question's width.

`scripts/booklet/check-arrangement-controls.mjs` exercises selection, movement/undo, Apply/Discard, spacing, save/reopen and preview zoom using isolated project copies. It covers native trigonometry diagrams, a custom source arrangement, a Linear Relationships raster diagram and Index Laws native text. It never writes to the user's projects or bank.
