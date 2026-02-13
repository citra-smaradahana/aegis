-- Tabel validation_mandate untuk pemberian mandat validasi Fit To Work
-- Mandat: PLH->FLH, SHERQ->Asst.PJO/PJO, PJO->Asst.PJO
-- Penerima mandat harus dari site yang sama dengan pemberi

CREATE TABLE IF NOT EXISTS validation_mandate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site TEXT NOT NULL,
  mandate_type TEXT NOT NULL CHECK (mandate_type IN ('PLH_TO_FLH', 'SHERQ_TO_ASST_PJO_OR_PJO', 'PJO_TO_ASST_PJO')),
  delegated_by_user_id UUID NOT NULL REFERENCES users(id),
  delegated_to_user_id UUID NOT NULL REFERENCES users(id),
  active_from DATE NOT NULL DEFAULT CURRENT_DATE,
  active_until DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hanya satu mandat aktif per delegator per tipe
CREATE UNIQUE INDEX IF NOT EXISTS idx_validation_mandate_unique_active
  ON validation_mandate(delegated_by_user_id, mandate_type)
  WHERE is_active = true;

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_validation_mandate_site ON validation_mandate(site);
CREATE INDEX IF NOT EXISTS idx_validation_mandate_delegated_to ON validation_mandate(delegated_to_user_id);
CREATE INDEX IF NOT EXISTS idx_validation_mandate_delegated_by ON validation_mandate(delegated_by_user_id);
CREATE INDEX IF NOT EXISTS idx_validation_mandate_active ON validation_mandate(is_active, active_from, active_until);

-- RLS: Allow read/write for authenticated (adjust based on your auth setup)
ALTER TABLE validation_mandate ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all for now (Supabase anon key - adjust if using auth)
CREATE POLICY "Allow all for validation_mandate" ON validation_mandate
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE validation_mandate IS 'Mandat validasi Fit To Work: PLH->FLH, SHERQ->Asst.PJO/PJO, PJO->Asst.PJO';
