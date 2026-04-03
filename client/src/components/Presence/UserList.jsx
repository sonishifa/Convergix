import PresenceDot from './PresenceDot';

export default function UserList({ me, peers }) {
  return (
    <div className="user-list" aria-label="Active users">
      <PresenceDot key={me.id} user={me} isMe />
      {peers.map(p => <PresenceDot key={p.id} user={p} />)}
    </div>
  );
}