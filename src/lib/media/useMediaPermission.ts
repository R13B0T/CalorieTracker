import { useCallback, useEffect, useState } from 'react';

export type MediaPermissionName = 'camera' | 'microphone';
export type MediaPermissionState = PermissionState | 'unknown' | 'unsupported';

async function getPermissionStatus(name: MediaPermissionName): Promise<PermissionStatus | null> {
  if (!navigator.permissions?.query) return null;
  try {
    // Camera and microphone are implemented by Chromium but are missing from some
    // TypeScript DOM PermissionName unions. Safari currently falls through to null.
    return await navigator.permissions.query({ name } as PermissionDescriptor);
  } catch {
    return null;
  }
}

/**
 * Observe browser-owned media permission state without requesting access. Permission
 * prompts must remain attached to an explicit camera or microphone button press.
 */
export function useMediaPermission(name: MediaPermissionName) {
  const [state, setState] = useState<MediaPermissionState>('unknown');

  const refresh = useCallback(async () => {
    const status = await getPermissionStatus(name);
    setState(status?.state ?? 'unsupported');
  }, [name]);

  useEffect(() => {
    let active = true;
    let status: PermissionStatus | null = null;

    const update = () => {
      if (active && status) setState(status.state);
    };

    void getPermissionStatus(name).then((next) => {
      if (!active) return;
      status = next;
      setState(status?.state ?? 'unsupported');
      if (status) status.addEventListener('change', update);
    });

    return () => {
      active = false;
      status?.removeEventListener('change', update);
    };
  }, [name]);

  return { state, refresh };
}
