-- Menambahkan kolom resiko_tinggi dan kontrol_bahaya pada tabel take_5
ALTER TABLE public.take_5
ADD COLUMN IF NOT EXISTS resiko_tinggi BOOLEAN DEFAULT false;

ALTER TABLE public.take_5
ADD COLUMN IF NOT EXISTS kontrol_bahaya TEXT;
