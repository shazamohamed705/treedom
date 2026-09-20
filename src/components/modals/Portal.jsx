import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

/** Renders children directly into document.body — prevents overflow:hidden clipping */
export default function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
