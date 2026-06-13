import Card from "../ui/Card";
import SectionHeading from "../ui/SectionHeading";
import Button from "../ui/Button";
import {
  FormField,
  Input,
  Select,
  FormGrid,
  FormSection,
  FormActionBar,
} from "../ui/form";

function GenerateTagihanForm({
  modeGenerate,
  setModeGenerate,
  santri,
  kelas,
  selectedSantri,
  setSelectedSantri,
  selectedKelas,
  setSelectedKelas,
  form,
  setForm,
  onSubmit,
}) {
  return (
    <Card padding="md" shadow="card" border={false} radius="xl">
      <SectionHeading variant="eyebrow" spacing="first">
        Tambah Pembayaran
      </SectionHeading>

      <FormSection title="Target Tagihan">
        <div className="form-radio-group-v3">
          <label className="form-radio-option-v3">
            <input
              type="radio"
              checked={modeGenerate === "semua"}
              onChange={() => setModeGenerate("semua")}
            />
            Semua Santri
          </label>
          <label className="form-radio-option-v3">
            <input
              type="radio"
              checked={modeGenerate === "pilih"}
              onChange={() => setModeGenerate("pilih")}
            />
            Pilih Santri
          </label>
          <label className="form-radio-option-v3">
            <input
              type="radio"
              checked={modeGenerate === "kelas"}
              onChange={() => setModeGenerate("kelas")}
            />
            Berdasarkan Kelas
          </label>
        </div>

        {modeGenerate === "pilih" && (
          <FormGrid columns="single">
            <FormField label="Santri" htmlFor="tagihan-santri">
              <Select
                id="tagihan-santri"
                value={form.santri_id}
                onChange={(e) => setForm({ ...form, santri_id: e.target.value })}
              >
                <option value="">Pilih Santri</option>
                {santri.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="form-checkbox-list-v3">
              {santri.map((s) => (
                <label key={s.id} className="form-radio-option-v3">
                  <input
                    type="checkbox"
                    checked={selectedSantri.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSantri([...selectedSantri, s.id]);
                      } else {
                        setSelectedSantri(selectedSantri.filter((id) => id !== s.id));
                      }
                    }}
                  />
                  {s.nama}
                </label>
              ))}
            </div>
          </FormGrid>
        )}

        {modeGenerate === "kelas" && (
          <FormGrid columns="single">
            <FormField label="Kelas" htmlFor="tagihan-kelas">
              <Select
                id="tagihan-kelas"
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
              >
                <option value="">Pilih Kelas</option>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas}
                  </option>
                ))}
              </Select>
            </FormField>
          </FormGrid>
        )}
      </FormSection>

      <FormSection title="Detail Tagihan">
        <FormGrid>
          <FormField label="Nama Tagihan" htmlFor="tagihan-nama" required>
            <Input
              id="tagihan-nama"
              type="text"
              value={form.nama_tagihan}
              onChange={(e) => setForm({ ...form, nama_tagihan: e.target.value })}
            />
          </FormField>
          <FormField label="Bulan" htmlFor="tagihan-bulan">
            <Input
              id="tagihan-bulan"
              type="text"
              value={form.bulan}
              onChange={(e) => setForm({ ...form, bulan: e.target.value })}
            />
          </FormField>
          <FormField label="Tahun" htmlFor="tagihan-tahun">
            <Input
              id="tagihan-tahun"
              type="number"
              value={form.tahun}
              onChange={(e) => setForm({ ...form, tahun: e.target.value })}
            />
          </FormField>
          <FormField label="Nominal Tagihan" htmlFor="tagihan-nominal" required>
            <Input
              id="tagihan-nominal"
              type="number"
              value={form.nominal_tagihan}
              onChange={(e) => setForm({ ...form, nominal_tagihan: e.target.value })}
            />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormActionBar className="form-action-bar-v3--compact">
        <Button onClick={onSubmit}>Generate</Button>
      </FormActionBar>
    </Card>
  );
}

export default GenerateTagihanForm;
