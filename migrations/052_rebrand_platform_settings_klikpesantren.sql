-- Phase 1 rebrand: visible platform settings only.
-- Keep package names, app slugs, credentials, storage keys, and technical IDs unchanged.

DO $$
BEGIN
  IF to_regclass('public.platform_settings') IS NOT NULL THEN
    UPDATE platform_settings
    SET
      settings = jsonb_set(
        jsonb_set(
          settings,
          '{platform_name}',
          to_jsonb('KlikPesantren'::text),
          true
        ),
        '{about_text}',
        to_jsonb(
          REPLACE(
            COALESCE(settings->>'about_text', 'KlikPesantren membantu pesantren mengelola administrasi santri, keuangan, dan komunikasi wali santri.'),
            'KlikSantri',
            'KlikPesantren'
          )
        ),
        true
      ),
      updated_at = NOW()
    WHERE id = 1
      AND (
        settings->>'platform_name' = 'KlikSantri'
        OR settings->>'about_text' LIKE '%KlikSantri%'
      );
  END IF;
END $$;
