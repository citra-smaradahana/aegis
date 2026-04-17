import React from "react";
import "./Inspeksi5RPrint.css";

const Inspeksi5RPrint = ({ laporan, items, catatan }) => {
  if (!laporan) return null;

  const isOffice = laporan.area_type === "office";
  const docRef = laporan.doc_ref || (isOffice ? "BSI-OHS-FO-180" : "BSI-OHS-FO-179");

  // Reusable Page Header Component
  const PageHeader = ({ pageNum, totalPages }) => (
    <>
      <table className="i5r-print-header">
        <tbody>
          <tr>
            <td className="i5r-p-logo" rowSpan={2}>
              <img src="/bsi-logo.png" alt="Logo" />
            </td>
            <td className="i5r-p-title" rowSpan={2}>
              <div className="title-id">
                FORMULIR INSPEKSI 5R – {isOffice ? "RUANG PERKANTORAN" : "NON OFFICE"}
              </div>
              <div className="title-en">
                {isOffice ? "Organization Context Form" : "5R INSPECTION FORM – NON OFFICE"}
              </div>
            </td>
            <td className="i5r-p-dept">OHS</td>
          </tr>
        </tbody>
      </table>

      <table className="i5r-print-meta">
        <tbody>
          <tr>
            <td className="center-text">
              <strong>No. Dokumen:</strong>
              <br />
              {docRef}
            </td>
            <td className="center-text">
              <strong>Tanggal Peninjauan Berikutnya:</strong>
              <br />
              20 November 2025
            </td>
            <td className="center-text">
              <strong>No. Revisi:</strong>
              <br />
              0.0
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const kategoriNames = {
    S1: { id: "RINGKAS - SORTIR", en: "SORT" },
    S2: { id: "RAPI - SUSUN", en: "SET IN ORDER" },
    S3: { id: "RESIK - SAPU", en: "SHINE" },
    S4: { id: "RAWAT - STANDARDIZASE", en: "STANDARDIZE" },
    S5: { id: "RAJIN - SWA-DISIPLIN", en: "SUSTAIN" },
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.kategori_kode]) acc[item.kategori_kode] = [];
    acc[item.kategori_kode].push(item);
    return acc;
  }, {});

  const p1Codes = ["S1", "S2", "S3"];
  const p2Codes = ["S4", "S5"];

  const renderTableContent = (codes) => (
    <table className="i5r-print-table">
      <thead>
        <tr>
          <th style={{ width: "40px" }}>No</th>
          <th>
            Kategori & Deskripsi Item / <span className="en-sub">Category & Item Description</span>
          </th>
          <th style={{ width: "90px" }}>Result</th>
        </tr>
      </thead>
      <tbody>
        {codes.map((kode) => (
          <React.Fragment key={kode}>
            <tr className="kategori-row">
              <td style={{ textAlign: "center", fontWeight: "bold" }}>{kode}</td>
              <td colSpan={2} style={{ fontWeight: "bold" }}>
                {kategoriNames[kode]?.id} - {kategoriNames[kode]?.en}
              </td>
            </tr>
            {groupedItems[kode]
              ? groupedItems[kode]
                  .sort((a, b) => a.item_index - b.item_index)
                  .map((item, idx) => (
                    <tr key={item.id}>
                      <td className="cell-center">
                        <div className="cell-inner">{idx + 1}</div>
                      </td>
                      <td className="cell-desc">
                        <div className="cell-inner-desc">
                          <div className="item-txt">{item.item_text}</div>
                          <div className="item-en">{item.item_en || ""}</div>
                        </div>
                      </td>
                      <td className="cell-center">
                        <div className="cell-inner">
                          <div className={`score-box ${item.score}`}>
                            {item.score.toUpperCase()}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
              : null}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="i5r-print-wrapper">
      {/* ─── PAGE 1 ───────────────────────────────────────────────────────── */}
      <div className="print-page">
        <PageHeader />

        <div className="i5r-print-identity">
          <div className="identity-row">
            <div className="identity-item">
              <span className="label">Work Area:</span> {laporan.work_area || "...................."}
            </div>
            <div className="identity-item">
              <span className="label">Date:</span> {laporan.tanggal || "...................."}
            </div>
          </div>
          <div className="identity-row">
            <div className="identity-item">
              <span className="label">5S Leader:</span> {laporan.leader_name || "...................."}
            </div>
            <div className="identity-item">
              <span className="label">5S Inspector:</span>{" "}
              {laporan.inspector_name || laporan.submitted_by_nama || "...................."}
            </div>
          </div>
        </div>

        {renderTableContent(p1Codes)}

        <div className="page-footer-mini">
          DOKUMEN INI TIDAK TERKENDALI JIKA DICETAK (Page 1 of 2)
        </div>
      </div>

      <div className="page-break" />

      {/* ─── PAGE 2 ───────────────────────────────────────────────────────── */}
      <div className="print-page">
        <PageHeader />

        {renderTableContent(p2Codes)}

        <div className="i5r-print-comments">
          <strong>Comments:</strong>
          <div className="comments-box">
            {catatan && catatan.length > 0 ? (
              catatan.map((c, i) => (
                <div key={i} style={{ marginBottom: "5px" }}>
                  <strong>{c.kategori_kode}:</strong> {c.catatan}
                </div>
              ))
            ) : (
              <div className="dotted-line">
                ............................................................................................................................
              </div>
            )}
          </div>
        </div>



        <div className="page-footer-mini">
          DOKUMEN INI TIDAK TERKENDALI JIKA DICETAK (Page 2 of 2)
        </div>
      </div>
    </div>
  );
};

export default Inspeksi5RPrint;
