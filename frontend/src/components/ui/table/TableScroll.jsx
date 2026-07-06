import { useEffect, useRef, useState } from "react";

function TableScroll({
  children,
  className = "",
  sticky = false,
  matrix = false,
  stickyScrollbar = false,
}) {
  const scrollRef = useRef(null);
  const stickyRef = useRef(null);
  const syncingRef = useRef(false);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [showStickyScrollbar, setShowStickyScrollbar] = useState(false);

  const classes = [
    "table-scroll-v3",
    sticky ? "table-scroll-v3--sticky" : "",
    matrix ? "table-scroll-v3--matrix" : "",
    stickyScrollbar ? "table-scroll-v3--with-sticky-scrollbar" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!stickyScrollbar || !scrollRef.current) return undefined;

    const scrollEl = scrollRef.current;

    const updateMetrics = () => {
      setScrollWidth(scrollEl.scrollWidth);
      setShowStickyScrollbar(scrollEl.scrollWidth > scrollEl.clientWidth + 1);
      if (stickyRef.current) {
        stickyRef.current.scrollLeft = scrollEl.scrollLeft;
      }
    };

    updateMetrics();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateMetrics)
        : null;

    resizeObserver?.observe(scrollEl);
    if (scrollEl.firstElementChild) {
      resizeObserver?.observe(scrollEl.firstElementChild);
    }

    window.addEventListener("resize", updateMetrics);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateMetrics);
    };
  }, [stickyScrollbar, children]);

  const syncScroll = (source, target) => {
    if (!target || syncingRef.current) return;
    syncingRef.current = true;
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  };

  return (
    <div className="table-scroll-v3__wrap">
      <div
        ref={scrollRef}
        className={classes}
        onScroll={(event) => syncScroll(event.currentTarget, stickyRef.current)}
      >
        {children}
      </div>
      {stickyScrollbar && showStickyScrollbar ? (
        <div
          ref={stickyRef}
          className="table-scroll-v3__sticky-bar"
          aria-hidden="true"
          onScroll={(event) => syncScroll(event.currentTarget, scrollRef.current)}
        >
          <div style={{ width: scrollWidth, height: 1 }} />
        </div>
      ) : null}
    </div>
  );
}

export default TableScroll;
