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
  const [stickyBarStyle, setStickyBarStyle] = useState({});
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
      const rect = scrollEl.getBoundingClientRect();
      const hasHorizontalScroll = scrollEl.scrollWidth > scrollEl.clientWidth + 1;
      const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;

      setScrollWidth(scrollEl.scrollWidth);
      setStickyBarStyle({
        left: `${Math.max(rect.left, 0)}px`,
        width: `${Math.min(rect.width, window.innerWidth - Math.max(rect.left, 0))}px`,
      });
      setShowStickyScrollbar(hasHorizontalScroll && isVisible);
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

    const handleWindowScroll = (event) => {
      if (stickyRef.current && stickyRef.current.contains(event.target)) {
        return;
      }
      updateMetrics();
    };

    window.addEventListener("resize", updateMetrics);
    window.addEventListener("scroll", handleWindowScroll, true);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateMetrics);
      window.removeEventListener("scroll", handleWindowScroll, true);
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
          style={stickyBarStyle}
          onScroll={(event) => syncScroll(event.currentTarget, scrollRef.current)}
        >
          <div style={{ width: scrollWidth, height: 1 }} />
        </div>
      ) : null}
    </div>
  );
}

export default TableScroll;
