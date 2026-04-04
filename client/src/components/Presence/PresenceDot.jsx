export default function PresenceDot({ user, isMe = false }) {
  const initial = user.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div
      className={`presence-dot${isMe ? ' presence-dot--me' : ''}`}
      style={{ '--dot-color': user.color }}
      title={isMe ? `${user.name} (you)` : user.name}
      aria-label={isMe ? `${user.name} (you)` : user.name}
    >
      <span className="presence-dot__initial">{initial}</span>
      <span className="presence-dot__pulse" />
    </div>
  );
}