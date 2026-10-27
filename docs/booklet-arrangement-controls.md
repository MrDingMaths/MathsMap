# Adjusting question layouts in Booklet Studio

Select a question's text or diagram, then choose **Arrange question** in the main editing toolbar. This opens the existing arrangement editor with its **Question structure**, preview and **Selection properties** panels. The same controls work in all projects.

- **Reduce a horizontal diagram/text gap:** select their **Row** (a named row such as **Diagram beside question parts**) in Question structure and change **Gap (mm)**. If the blank area comes from an oversized diagram column, drag the column divider in the preview, or select the column and change **Column proportion**. Diagram width is separate from column width.
- **Reduce vertical spacing:** select the item and change **Space above (mm)** or **Space below (mm)**. Select its containing group to change the **Gap (mm)** between stacked items.
- **Put a diagram after the parts:** select the diagram and use **Move after** until it follows the parts group. If it is nested inside another column, first use **Move out of column**. You can also drag it below an item or into a group. The parts keep their own order and response spaces.
- **Edit the text or drawing:** select **Edit selected content**. **Apply to question** returns to the layout controls. **Discard content draft** returns without applying that draft. Use the dialog's **Save** to apply the whole arrangement; **Cancel** leaves the project unchanged.

**Question spacing** in the main toolbar still changes answer-space height or vertical gaps throughout a whole question. Use the arrangement editor for a particular gap, column or item.

## Layout panel controls (28 October 2026)

The toolbar's **Layout** button (formerly Spacing) opens the Layout panel. On its Spacing tab:

- **Fit** (Alt+Shift+F; replaces Tighten to fit) has three goals: **Fit this block on its page**, **Bring a following block onto this page** and **Start on the next page**. **May change** chooses spacing and gaps, working space (to its floor), diagram size (to its kind minimum), other blocks on the page, and going below recommended minimums (off by default). Fit scales every allowed reduction together and finds the smallest amount that works with the real paginator in the current edition; a continued question is fitted as one unit. **Preview fit** shows the result and any new layout checks before **Apply preview**; a failure says which options could free more space.
- **Diagrams in question** sizes all diagrams of the question or selection (see Diagrams in the document editing guide).

The Block tab no longer repeats **Part layout**, the arrangement editor no longer has a Tables tab (it repeated Spacing), and quick layout actions appear only on the Spacing tab.

## Table formatting

With the cursor in a table, the toolbar shows a **Table format** group: scope (**Cell**, **Row**, **Column**, **Table**), border presets **All**, **Outside**, **Inside** and **None**, **Colours** (border colour and fill from the house palette) and **Rows & cells**. Presets write the existing border fields; **None** also clears cell-level overrides and the facing side of neighbouring cells, so a removed edge disappears. Each action is one undo step. Ctrl+K also offers the four border presets and each palette text colour.

## Acceptance, 12 September 2026

The layout inspector no longer immediately switches back into content editing. Selecting a diagram uses its actual saved arrangement item ID, including imported custom IDs. The toolbar opens the selected diagram or question prompt at the containing question's width.

`scripts/booklet/check-arrangement-controls.mjs` exercises selection, movement/undo, Apply/Discard, spacing, save/reopen and preview zoom using isolated project copies. It covers native trigonometry diagrams, a custom source arrangement, a Linear Relationships raster diagram and Index Laws native text. It never writes to the user's projects or bank.
