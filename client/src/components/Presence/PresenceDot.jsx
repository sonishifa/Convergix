export default function PresenceDot({ user, isMe = false }) {
  return (
    <div
      className={`presence-dot${isMe ? ' presence-dot--me' : ''}`}
      style={{ background: user.color }}
      title={isMe ? `${user.name} (you)` : user.name}
      aria-label={isMe ? `${user.name} (you)` : user.name}
    >
      {user.name[0].toUpperCase()}
    </div>
  );
}