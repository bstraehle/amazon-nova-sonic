import { useEffect, useState } from 'react';

export type MicrophonePermission = PermissionState | 'unknown';

export const useMicrophonePermission = () => {
  const [permission, setPermission] = useState<MicrophonePermission>('unknown');

  useEffect(() => {
    let status: PermissionStatus | null = null;
    let cancelled = false;
    const update = () => {
      if (status) setPermission(status.state);
    };

    navigator.permissions
      ?.query({ name: 'microphone' as PermissionName })
      .then((result) => {
        if (cancelled) return;
        status = result;
        update();
        result.addEventListener('change', update);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      status?.removeEventListener('change', update);
    };
  }, []);

  return permission;
};
