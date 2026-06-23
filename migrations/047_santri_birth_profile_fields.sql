ALTER TABLE public.santri
ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100);

ALTER TABLE public.santri
ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;

ALTER TABLE public.santri
ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20);

ALTER TABLE public.santri
ALTER COLUMN jenis_kelamin TYPE VARCHAR(20);

ALTER TABLE public.santri
ADD COLUMN IF NOT EXISTS alamat TEXT;

ALTER TABLE public.santri
ADD COLUMN IF NOT EXISTS tanggal_masuk_pesantren DATE;
