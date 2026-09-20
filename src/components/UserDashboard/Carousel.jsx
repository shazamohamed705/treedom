import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function Carousel({ children, gap = "12px", onApi }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align:         "start",
    dragFree:      true,
    containScroll: "trimSnaps",
    direction:     "rtl",
    watchDrag:     true,
  });

  useEffect(() => {
    if (emblaApi) onApi?.(emblaApi);
  }, [emblaApi, onApi]);

  return (
    <div
      style={{ overflow: "hidden", cursor: "grab", paddingBottom: "12px", marginBottom: "-12px" }}
      ref={emblaRef}
      onMouseDown={e => (e.currentTarget.style.cursor = "grabbing")}
      onMouseUp={e => (e.currentTarget.style.cursor = "grab")}
    >
      <div className="flex select-none" style={{ gap, paddingBottom: "4px" }}>
        {children}
      </div>
    </div>
  );
}
