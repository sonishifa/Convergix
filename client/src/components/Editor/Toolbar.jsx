export default function Toolbar({ editor }) {
  const btn = (label, icon, action, isActive) => (
    <button
      key={label}
      onClick={action}
      className={`toolbar-btn${isActive ? ' toolbar-btn--active' : ''}`}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="toolbar" role="toolbar" aria-label="Text formatting">
      {btn('Bold (⌘B)',
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5h4.5a3 3 0 011.93 5.3A3.25 3.25 0 019 13.5H4a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5zm1 4.5h3.5a1.5 1.5 0 000-3H5v3zm0 1.5v3.5h4a1.75 1.75 0 000-3.5H5z"/></svg>,
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive('bold')
      )}
      {btn('Italic (⌘I)',
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2.75A.75.75 0 016.75 2h6a.75.75 0 010 1.5h-2.4l-3.2 9h2.15a.75.75 0 010 1.5h-6a.75.75 0 010-1.5h2.4l3.2-9H6.75A.75.75 0 016 2.75z"/></svg>,
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive('italic')
      )}
      {btn('Underline (⌘U)',
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.75 2a.75.75 0 01.75.75v5.5a2.5 2.5 0 005 0v-5.5a.75.75 0 011.5 0v5.5a4 4 0 01-8 0v-5.5A.75.75 0 014.75 2zM3 14.25a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5a.75.75 0 01-.75-.75z"/></svg>,
        () => editor.chain().focus().toggleUnderline().run(),
        editor.isActive('underline')
      )}
    </div>
  );
}