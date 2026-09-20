import { useState, useEffect } from "react";
import { fetchProviderSettings } from "../services/api";

export function isZoomAutoFromSettings(data) {
  const z = data?.zoom ?? data?.data?.zoom ?? {};
  return z.mode === "api" && z.api_configured === true;
}

export default function useZoomAuto() {
  const [autoZoom, setAutoZoom] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let on = true;
    fetchProviderSettings()
      .then(res => {
        if (!on) return;
        setAutoZoom(isZoomAutoFromSettings(res?.data ?? res));
      })
      .catch(() => {
        if (!on) return;
        setAutoZoom(false);
      })
      .finally(() => {
        if (on) setReady(true);
      });
    return () => { on = false; };
  }, []);

  return { autoZoom, ready };
}
