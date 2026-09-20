import { useState } from "react";

export default function TrainerAvatar({ img, letter, size = 36 }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (img && !imgFailed) {
    return (
      <img
        src={img}
        alt={letter}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.33, background: "#31AFEA" }}>
      {letter ?? "م"}
    </div>
  );
}
