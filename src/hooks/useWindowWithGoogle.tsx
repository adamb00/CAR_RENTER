import React, { SetStateAction } from 'react';

type WindowWithGoogle = Window &
  typeof globalThis & {
    google?: {
      maps?: {
        places?: unknown;
      };
    };
  };
export function useWindowWithGoogle(
  setPlacesReady: React.Dispatch<SetStateAction<boolean>>
) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectPlacesReady = () => {
      const ready = Boolean((window as WindowWithGoogle)?.google?.maps?.places);
      if (ready) {
        setPlacesReady(true);
      }
      return ready;
    };

    if (detectPlacesReady()) return;

    const interval = window.setInterval(() => {
      if (detectPlacesReady()) {
        window.clearInterval(interval);
      }
    }, 400);

    return () => window.clearInterval(interval);
  }, [setPlacesReady]);
}
