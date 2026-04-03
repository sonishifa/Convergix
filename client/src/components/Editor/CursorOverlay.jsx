// Not a React component — exports a render function consumed by
// CollaborationCursor.configure({ render: buildCursorRender() }).
//
// ProseMirror cursor decorations are raw DOM, not React — this is correct.
// The render fn receives the awareness user object and returns a DOM node.

export function buildCursorRender() {
  return (user) => {
    const wrap = document.createElement('span');
    wrap.classList.add('collab-cursor');
    wrap.style.setProperty('--cursor-color', user.color ?? '#60a5fa');

    const label = document.createElement('span');
    label.classList.add('collab-cursor__label');
    label.textContent = user.name ?? 'Anonymous';
    label.style.background = user.color ?? '#60a5fa';

    wrap.appendChild(label);
    return wrap;
  };
}

