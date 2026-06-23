function PlatformModeBannerStyles() {

  return (

    <style>{`

      .platform-mode-banner {

        display: flex;

        align-items: center;

        gap: 10px;

        flex-wrap: wrap;

        min-width: 0;

      }



      .platform-mode-banner__badge {

        display: inline-flex;

        align-items: center;

        padding: 3px 8px;

        border-radius: 999px;

        font-size: 10px;

        font-weight: 800;

        letter-spacing: 0.06em;

        text-transform: uppercase;

        color: #BBF7D0;

        background: rgba(22, 101, 52, 0.22);

        border: 1px solid rgba(34, 197, 94, 0.28);

        flex-shrink: 0;

      }



      .platform-mode-banner__text {

        display: flex;

        flex-direction: column;

        gap: 1px;

        min-width: 0;

      }



      .platform-mode-banner__title {

        margin: 0;

        font-size: 13px;

        font-weight: 800;

        color: var(--text-primary);

        line-height: 1.2;

      }



      .platform-mode-banner__subtitle {

        margin: 0;

        font-size: 11px;

        font-weight: 600;

        color: var(--text-muted);

        line-height: 1.3;

      }



      .platform-mode-banner--compact .platform-mode-banner__title {

        font-size: 12px;

      }



      .platform-mode-banner--dark .platform-mode-banner__badge {

        color: #BBF7D0;

        background: rgba(22, 101, 52, 0.22);

        border-color: rgba(34, 197, 94, 0.28);

      }



      .platform-mode-banner--dark .platform-mode-banner__title {

        color: #F8FAFC;

      }



      .platform-mode-banner--dark .platform-mode-banner__subtitle {

        color: #94A3B8;

      }

    `}</style>

  );

}



function PlatformModeBanner({ compact = false, variant = "light" }) {

  const className = [

    "platform-mode-banner",

    compact ? "platform-mode-banner--compact" : "",

    variant === "dark" ? "platform-mode-banner--dark" : "",

  ]

    .filter(Boolean)

    .join(" ");



  return (

    <>

      <PlatformModeBannerStyles />

      <div className={className} role="status" aria-label="Mode platform KlikSantri">

        <span className="platform-mode-banner__badge">Platform</span>

        <div className="platform-mode-banner__text">

          <p className="platform-mode-banner__title">KlikSantri Platform</p>

          {!compact ? (

            <p className="platform-mode-banner__subtitle">Kelola tenant dan layanan</p>

          ) : null}

        </div>

      </div>

    </>

  );

}



export default PlatformModeBanner;

