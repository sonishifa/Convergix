// Not a React component — exports render functions consumed by
// the safeCursorPlugin ProseMirror plugin.
//
// ProseMirror cursor/selection decorations are raw DOM, not React.

/**
 * Builds a cursor element (the colored line + name label).
 * Used as `cursorBuilder` in safeCursorPlugin.
 */
export function buildCursorRender() {
  return (user) => {
    const color = user.color ?? '#60a5fa';

    const wrap = document.createElement('span');
    wrap.classList.add('collab-cursor');
    wrap.style.borderColor = color;
    wrap.style.setProperty('--cursor-color', color);

    const label = document.createElement('span');
    label.classList.add('collab-cursor__label');
    label.textContent = user.name ?? 'Anonymous';
    label.style.backgroundColor = color;

    wrap.appendChild(label);
    return wrap;
  };
}

/**
 * Builds selection decoration attributes (the colored text highlight).
 * Used as `selectionBuilder` in safeCursorPlugin.
 * Returns an object with `style` and `class` for ProseMirror Decoration.inline.
 */
export function buildSelectionRender() {
  return (user) => {
    const color = user.color ?? '#60a5fa';
    return {
      style: `background-color: ${color}30;`,
      class: 'collab-selection',
    };
  };
}
