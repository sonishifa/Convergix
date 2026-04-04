import PresenceDot from './PresenceDot';

export default function UserList({ me, peers }) {
  const total = 1 + peers.length;

  return (
    <div className="user-list" aria-label="Active users">
      <PresenceDot key={me.id} user={me} isMe />
      {peers.map(p => <PresenceDot key={p.id} user={p} />)}
      <span className="user-count">{total} online</span>
    </div>
  );
}