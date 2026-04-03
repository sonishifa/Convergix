export default function Toolbar({ editor }) {
  const btn = (label, action, isActive) => (
    <button
      key={label}
      onClick={action}
      className={`toolbar-btn${isActive ? ' active' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="toolbar">
      {btn('B', () => editor.chain().focus().toggleBold().run(),      editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(),    editor.isActive('italic'))}
      {btn('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
    </div>
  );
}