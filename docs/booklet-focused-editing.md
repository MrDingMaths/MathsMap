# Focused booklet editing

Ordinary writing now happens directly on the page; see [Document-first Booklet Studio](booklet-document-editing.md). Select a question and open its block properties to access the specialist arrangement editor described below. **Save** applies that specialist draft as one booklet change; **Cancel** discards it. TikZ code editing is available directly from a selected diagram.

## Rearrange a question

- Select a **Part** or **Group** in the left panel to move everything belonging to it.
- **Move before / Move after** reorders siblings. **Move out of column** moves a selection up one level. **Full width** places it after its containing row, outside the columns.
- Select several sibling items using their checkboxes, then **Group**. Give the group a useful name. **Ungroup** retains its contents.
- Choose **Side by side** to make a row, or **Stack** to put items vertically. Drag a row's boundary handles, or use **Column proportion**. The handles also accept arrow keys.
- Choose a destination group and **Move into column / group**, or drag an item onto its destination. Drop near the top or bottom of another item to place it before or after that item.
- **Graph and table beside responses** creates an editable starting arrangement from the selected group's existing items.

For the P11 Q14 pattern, select each final unlabelled part and choose **Full width**. For P39, place the graph and table in one stacked group and the equation responses in another, then put those groups side by side. These are saved arrangements, not special page templates.

## Spacing, tables and diagrams

**Space above / below** and **Indent** apply to the selected arrangement item. Paragraph and table spacing are listed separately beneath them so an internal margin is distinguishable from the gap around its group. **Reset spacing** clears the arrangement spacing. **Remove empty paragraph / space** removes an empty paragraph or collapses response space; **Restore answer space** brings response space back.

Select a table or diagram and drag its width handle, or enter **Width**. **Edit selected content** opens only that item's MathsEditor or diagram controls. Apply it to the question, then Save the question. Short and worked answers remain available under **Answers and solutions** in the structure panel.

Image controls show the full original with a crop rectangle as well as the rendered result. Drag the rectangle or its edges; numeric crop fields remain available. Arrow keys move the rectangle; Shift changes the step to ten pixels. Escape cancels a drag. Grayscale, crop, width and manually edited TikZ all save directly. Diagram controls have local undo/redo.

## Tabs and proposals

Tab inserts the next 1 cm tab in prose, navigates table cells, and indents lists. Shift+Tab reverses table/list navigation; Alt+= inserts maths. Escape then Tab leaves the writing area. Existing custom stops retain their layout until **Reset to 1 cm tabs** is chosen. Custom-stop authoring controls are retired from booklet editing.

AI corrections are requested through document comments and **Copy feedback prompt**. Studio does not run models or use proposal/approval gates. Specialist arrangement edits apply directly and can be undone in the document.

Source pagination, stable content IDs, original diagram evidence and answer associations remain in the project. Existing arrangements change when explicitly edited; loading a project does not convert all its pages. Retained source images still carry their existing review flags.
