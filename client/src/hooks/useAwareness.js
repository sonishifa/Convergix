import { useEffect, useState } from 'react';

export function useAwareness(provider, user) {
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    if (!provider || !user) return;

    provider.setAwarenessField('user', {
      id:    user.id,
      name:  user.name,
      color: user.color,
    });

    const update = () => {
      const states = [...provider.awareness.getStates().values()];
      setPeers(states.filter(s => s.user?.id && s.user.id !== user.id).map(s => s.user));
    };

    provider.awareness.on('change', update);
    update();

    return () => provider.awareness.off('change', update);
  }, [provider, user]);

  return peers;
}