###  Drag and Drop Position Offset

Read Liveblocks agent skills before implementing this.

When dropping a shape from the shape panel onto the canvas,
the node places below where the cursor actually is.

Check the drop handler in the canvas wrapper. The position
calculation must account for:

- the drag offset from where the user grabbed the shape
  inside the drag element, not just the element's top-left
  corner
- the canvas container's bounding rect
- the current React Flow pan offset and zoom scale via
  screenToFlowPosition or project

The node should appear with its center at the exact cursor
position on drop.