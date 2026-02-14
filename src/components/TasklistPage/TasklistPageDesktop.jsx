import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import TasklistFormClosed from "../tasklistForms/TasklistFormClosed";
import TasklistFormSubmit from "../tasklistForms/TasklistFormSubmit";
import TasklistFormOpen from "../tasklistForms/TasklistFormOpen";
import TasklistFormRejectAtOpen from "../tasklistForms/TasklistFormRejectAtOpen";
import TasklistFormProgress from "../tasklistForms/TasklistFormProgress";
import TasklistFormDone from "../tasklistForms/TasklistFormDone";
import TasklistFormRejectAtDone from "../tasklistForms/TasklistFormRejectAtDone";

const STATUS_TABS = [];

function Toolbar({ site, setSite, search, setSearch }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <input
        placeholder="Cari judul/PIC..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          flex: 1,
          borderRadius: 8,
          padding: "10px 12px",
          border: "1px solid #334155",
          background: "#0b1220",
          color: "#e5e7eb",
        }}
      />
      <select
        value={site}
        onChange={(e) => setSite(e.target.value)}
        style={{
          width: 220,
          borderRadius: 8,
          padding: "10px 12px",
          border: "1px solid #334155",
          background: "#0b1220",
          color: "#e5e7eb",
        }}
      >
        <option value="">Semua Site</option>
        <option value="BSIB">BSIB</option>
        <option value="ADRO">ADRO</option>
        <option value="AMMP">AMMP</option>
        {/* tambahkan site lain bila perlu */}
      </select>
    </div>
  );
}

function Table({ rows, onAction, role, onView, formatDateOnly, user }) {
  const headers = [
    "Tanggal Pelaporan",
    "PIC",
    "Site",
    "Due Date",
    "Status",
    "Aksi",
  ];

  const canAct = (status, row) => {
    // Debug: Log user data
    console.log("canAct Debug:", {
      status,
      userNama: user?.nama,
      userUser: user?.user,
      rowPelapor: row.pelapor_nama,
      rowPic: row.pic,
      rowEvaluator: row.evaluator_nama,
    });

    // Role ditentukan berdasarkan nama user di kolom hazard_report
    const currentUserName = (user?.nama || user?.user || "")
      .toLowerCase()
      .trim();
    const rowPelapor = (row.pelapor_nama || "").toLowerCase().trim();
    const rowPic = (row.pic || "").toLowerCase().trim();
    const rowEvaluator = (row.evaluator_nama || "").toLowerCase().trim();

    console.log("Role check:", {
      currentUserName,
      rowPelapor,
      rowPic,
      rowEvaluator,
    });

    // Cek PIC - user adalah PIC dari hazard ini
    if (currentUserName === rowPic) {
      if (
        ["Submit", "Progress", "Reject at Open", "Reject at Done"].includes(
          status
        )
      ) {
        console.log("User is PIC for this hazard");
        return true;
      }
    }

    // Cek Submitter/Pelapor - user adalah pelapor dari hazard ini
    if (currentUserName === rowPelapor) {
      if (status === "Open") {
        console.log("User is Submitter/Pelapor for this hazard");
        return true;
      }
    }

    // Cek Evaluator - user adalah evaluator dari hazard ini
    if (currentUserName === rowEvaluator) {
      if (status === "Done") {
        console.log("User is Evaluator for this hazard");
        return true;
      }
    }

    console.log("No match found - user cannot act on this hazard");
    return false;
  };

  const actionLabel = (status) => {
    return "Action";
  };

  return (
    <div
      style={{
        background: "transparent",
        border: "1px solid #334155",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
          background: "#111827",
          color: "#9ca3af",
          padding: "10px 12px",
          fontWeight: 600,
        }}
      >
        {headers.map((h) => (
          <div key={h}>{h}</div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: 16, color: "#9ca3af" }}>Tidak ada data.</div>
      ) : (
        rows.map((r) => (
          <div
            key={r.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
              padding: "12px",
              borderTop: "1px solid #334155",
              alignItems: "center",
              color: "#e5e7eb",
              background: "#0b1220",
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {formatDateOnly(r.created_at)}
            </div>
            <div>{r.pic}</div>
            <div>{r.site}</div>
            <div>{r.due || "-"}</div>
            <div>
              <span
                style={{
                  background: "#1f2937",
                  padding: "4px 8px",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                {r.status}
              </span>
            </div>
            <div>
              {/* Tombol Action untuk melakukan pekerjaan yang ditugaskan */}
              {canAct(r.status, r) ? (
                <button
                  onClick={() => onAction(r)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #2563eb",
                    background: "#1d4ed8",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {actionLabel(r.status)}
                </button>
              ) : (
                <button
                  onClick={() => onView && onView(r)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #374151",
                    background: "#111827",
                    color: "#9ca3af",
                    cursor: "pointer",
                  }}
                >
                  View only
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function TasklistPageDesktop({ user }) {
  // Debug: Log complete user data
  console.log("TasklistPageDesktop - Complete user data:", user);

  const role = useMemo(() => {
    // Debug: Log user role
    console.log("User role from database:", user?.role);

    // Jika role adalah string dengan multiple roles (comma-separated)
    if (user?.role && typeof user.role === "string") {
      const roles = user.role.split(",").map((r) => r.trim().toLowerCase());
      console.log("Parsed roles:", roles);

      // Return role pertama sebagai primary role untuk UI
      if (roles.includes("evaluator")) return "Evaluator";
      if (roles.includes("submitter")) return "Submitter";
      if (roles.includes("pic")) return "PIC";
    }

    // Fallback untuk single role
    if (user?.role === "evaluator") return "Evaluator";
    if (user?.role === "submitter") return "Submitter";
    if (user?.role === "pic") return "PIC";

    return "PIC"; // default
  }, [user]);

  const formatDateOnly = (value) => {
    if (!value) return "-";
    try {
      if (typeof value === "string" && value.includes("T")) {
        return value.split("T")[0];
      }
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "-";
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    } catch (e) {
      return "-";
    }
  };

  const [activeTab, setActiveTab] = useState("Submit");
  const [rowsTodo, setRowsTodo] = useState([]);
  const [rowsHistory, setRowsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState("tasklist"); // 'tasklist', 'submit-form', 'closed-form', 'view-detail'
  const [selectedRow, setSelectedRow] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isViewOnly, setIsViewOnly] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      console.log("Loading Tasklist data...");
      // To Do = semua status != Closed (case-insensitive), Riwayat = Closed (case-insensitive)
      let qTodo = supabase
        .from("hazard_report")
        .select(
          "id, deskripsi_temuan, pic, pelapor_nama, pelapor_nrp, lokasi, detail_lokasi, keterangan_lokasi, due_date, status, created_at, ketidaksesuaian, sub_ketidaksesuaian, quick_action, evidence, action_plan, evaluator_nama, alasan_penolakan_open, deskripsi_penyelesaian, evidence_perbaikan, alasan_penolakan_done"
        )
        .not("status", "ilike", "closed")
        .order("created_at", { ascending: false });
      let qHistory = supabase
        .from("hazard_report")
        .select(
          "id, deskripsi_temuan, pic, pelapor_nama, pelapor_nrp, lokasi, detail_lokasi, keterangan_lokasi, due_date, status, created_at, ketidaksesuaian, sub_ketidaksesuaian, quick_action, evidence, action_plan, evaluator_nama, alasan_penolakan_open, deskripsi_penyelesaian, evidence_perbaikan, alasan_penolakan_done"
        )
        .ilike("status", "closed")
        .order("created_at", { ascending: false });
      const [{ data: todo }, { data: history }] = await Promise.all([
        qTodo,
        qHistory,
      ]);

      // Debug: cek semua status yang ada
      const { data: allStatuses } = await supabase
        .from("hazard_report")
        .select("id, status, pic, pelapor_nama")
        .order("created_at", { ascending: false });
      console.log("All hazard statuses:", allStatuses);

      console.log("Raw todo data from database:", todo);
      console.log("Raw history data from database:", history);
      console.log("Current user:", user?.nama || user?.user);
      console.log(
        "Todo statuses:",
        todo?.map((t) => ({ id: t.id, status: t.status, pic: t.pic }))
      );
      const normalizeTodo = (o) => ({
        id: o.id,
        title: o.deskripsi_temuan || "",
        pic: o.pic || "",
        site: o.lokasi || "",
        due: o.due_date || "",
        status: o.status || "",
        created_at: o.created_at || null,
        pelapor_nama: o.pelapor_nama || "",
        pelapor_nrp: o.pelapor_nrp || "",
        detail_lokasi: o.detail_lokasi || "",
        keterangan_lokasi: o.keterangan_lokasi || "",
        ketidaksesuaian: o.ketidaksesuaian || "",
        sub_ketidaksesuaian: o.sub_ketidaksesuaian || "",
        quick_action: o.quick_action || "",
        evidence: o.evidence || "",
        action_plan: o.action_plan || "",
        due_date: o.due_date || "",
        evaluator_nama: o.evaluator_nama || "",
        alasan_penolakan_open: o.alasan_penolakan_open || "",
        deskripsi_penyelesaian: o.deskripsi_penyelesaian || "",
        evidence_perbaikan: o.evidence_perbaikan || "",
        alasan_penolakan_done: o.alasan_penolakan_done || "",
      });

      const normalizeHistory = (o) => ({
        id: o.id,
        title: o.deskripsi_temuan || "",
        pic: o.pic || "",
        site: o.lokasi || "",
        due: o.due_date || o.created_at || "",
        status: o.status || "",
        created_at: o.created_at || null,
        pelapor_nama: o.pelapor_nama || "",
        pelapor_nrp: o.pelapor_nrp || "",
        detail_lokasi: o.detail_lokasi || "",
        keterangan_lokasi: o.keterangan_lokasi || "",
        ketidaksesuaian: o.ketidaksesuaian || "",
        sub_ketidaksesuaian: o.sub_ketidaksesuaian || "",
        quick_action: o.quick_action || "",
        evidence: o.evidence || "",
        action_plan: o.action_plan || "",
        due_date: o.due_date || "",
        evaluator_nama: o.evaluator_nama || "",
        alasan_penolakan_open: o.alasan_penolakan_open || "",
        deskripsi_penyelesaian: o.deskripsi_penyelesaian || "",
        evidence_perbaikan: o.evidence_perbaikan || "",
        alasan_penolakan_done: o.alasan_penolakan_done || "",
      });
      const normalizedTodo = (todo || []).map(normalizeTodo);
      console.log(
        "Normalized todo data:",
        normalizedTodo.map((t) => ({ id: t.id, status: t.status, pic: t.pic }))
      );
      setRowsTodo(normalizedTodo);

      // Filter riwayat: hanya milik PIC/Submitter (berkaitan dengan user; case-insensitive)
      const currentName = (user?.nama || user?.user || "")
        .toString()
        .trim()
        .toLowerCase();
      const eqName = (v) =>
        !!v && v.toString().trim().toLowerCase() === currentName;
      const historyFiltered = (history || [])
        .filter((r) => eqName(r.pic) || eqName(r.pelapor_nama))
        .map(normalizeHistory);
      setRowsHistory(historyFiltered);
      setLoading(false);
    }
    load();
  }, [activeTab, reloadKey]);

  const handleAction = async (row) => {
    // Khusus PIC pada status Submit: buka form untuk isi action plan & due date
    const currentUserName = (user?.nama || user?.user || "")
      .toLowerCase()
      .trim();
    const rowPic = (row.pic || "").toLowerCase().trim();

    if (currentUserName === rowPic && row.status === "Submit") {
      setSelectedRow(row);
      setIsViewOnly(false);
      setCurrentPage("submit-form");
      return;
    }

    // Khusus Submitter/Pelapor pada status Open: buka form untuk Terima/Tolak
    if (row.status === "Open") {
      // Cek apakah user adalah pelapor dari hazard ini
      const rowPelapor = (row.pelapor_nama || "").toLowerCase().trim();
      const isPelapor = currentUserName === rowPelapor;

      if (isPelapor) {
        setSelectedRow(row);
        setIsViewOnly(false);
        setCurrentPage("open-form");
        return;
      }
    }

    // Khusus PIC pada status Reject at Open: buka form untuk revisi action plan
    if (row.status === "Reject at Open") {
      const rowPic = (row.pic || "").toLowerCase().trim();
      const isPic = currentUserName === rowPic;

      if (isPic) {
        setSelectedRow(row);
        setIsViewOnly(false);
        setCurrentPage("reject-at-open-form");
        return;
      }
    }

    // Khusus PIC pada status Progress: buka form untuk isi deskripsi penyelesaian dan evidence
    if (row.status === "Progress") {
      const rowPic = (row.pic || "").toLowerCase().trim();
      const isPic = currentUserName === rowPic;

      if (isPic) {
        setSelectedRow(row);
        setIsViewOnly(false);
        setCurrentPage("progress-form");
        return;
      }
    }

    // Khusus Evaluator pada status Done: buka form untuk evaluasi
    if (row.status === "Done") {
      const rowEvaluator = (row.evaluator_nama || "").toLowerCase().trim();
      const isEvaluator = currentUserName === rowEvaluator;

      if (isEvaluator) {
        setSelectedRow(row);
        setIsViewOnly(false);
        setCurrentPage("done-form");
        return;
      }
    }

    // Khusus PIC pada status Reject at Done: buka form reject at done untuk revisi
    if (row.status === "Reject at Done") {
      const rowPic = (row.pic || "").toLowerCase().trim();
      const isPic = currentUserName === rowPic;

      if (isPic) {
        setSelectedRow(row);
        setIsViewOnly(false);
        setCurrentPage("reject-at-done-form");
        return;
      }
    }

    // Untuk status lainnya, langsung update status
    const next = (status) => {
      switch (status) {
        case "Progress":
          return "Done";
        case "Done":
          return "Closed";
        case "Reject at Open":
          return "Submit";
        case "Reject at Done":
          return "Progress";
        default:
          return status;
      }
    };

    const newStatus = next(row.status);
    await supabase
      .from("hazard_report")
      .update({ status: newStatus })
      .eq("id", row.id);
    setRowsTodo((prev) => prev.filter((r) => r.id !== row.id));
    if (newStatus !== "Closed") {
      setRowsTodo((prev) => [{ ...row, status: newStatus }, ...prev]);
    } else {
      setRowsHistory((prev) => [{ ...row, status: newStatus }, ...prev]);
    }
  };

  const handleView = (row) => {
    setSelectedRow(row);
    if (row.status?.toLowerCase() === "closed") {
      setCurrentPage("closed-form");
    } else if (row.status === "Submit") {
      // Untuk status Submit, selalu buka form yang sama dengan Action
      setIsViewOnly(true);
      setCurrentPage("submit-form");
    } else if (row.status === "Open") {
      // Untuk status Open, selalu buka form yang sama dengan Action
      setIsViewOnly(true);
      setCurrentPage("open-form");
    } else if (row.status === "Reject at Open") {
      // Untuk status Reject at Open, selalu buka form yang sama dengan Action
      setIsViewOnly(true);
      setCurrentPage("reject-at-open-form");
    } else if (row.status === "Progress") {
      // Untuk status Progress, selalu buka form yang sama dengan Action
      setIsViewOnly(true);
      setCurrentPage("progress-form");
    } else if (row.status === "Done") {
      // Untuk status Done, selalu buka form yang sama dengan Action
      setIsViewOnly(true);
      setCurrentPage("done-form");
    } else if (row.status === "Reject at Done") {
      // Untuk status Reject at Done, selalu buka form yang sama dengan Action
      setIsViewOnly(true);
      setCurrentPage("reject-at-done-form");
    } else {
      setCurrentPage("view-detail");
    }
  };

  const handleBackToTasklist = () => {
    setCurrentPage("tasklist");
    setSelectedRow(null);
    setIsViewOnly(false);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "transparent",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "0 80px 0 24px",
        overflow: "hidden",
      }}
    >
      {/* Halaman Tasklist */}
      {currentPage === "tasklist" && (
        <div
          style={{
            background: "transparent",
            borderRadius: 18,
            boxShadow: "none",
            padding: 16,
            maxWidth: 1000,
            width: "100%",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: 12,
              color: "#60a5fa",
              textAlign: "center",
              fontWeight: 900,
              fontSize: 28,
            }}
          >
            Tasklist
          </h2>

          {loading ? (
            <div style={{ color: "#9ca3af" }}>Memuat...</div>
          ) : (
            <>
              <h3 style={{ color: "#e5e7eb", margin: "12px 0" }}>To Do</h3>
              <Table
                rows={rowsTodo}
                onAction={handleAction}
                role={role}
                onView={handleView}
                formatDateOnly={formatDateOnly}
                user={user}
              />
              <h3 style={{ color: "#e5e7eb", margin: "16px 0 8px" }}>
                Riwayat
              </h3>
              <Table
                rows={rowsHistory}
                onAction={handleAction}
                role={role}
                onView={handleView}
                formatDateOnly={formatDateOnly}
                user={user}
              />
            </>
          )}
        </div>
      )}

      {/* Halaman Submit Form */}
      {currentPage === "submit-form" && selectedRow && (
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "transparent",
            padding: "0 80px 0 24px",
            overflow: "hidden",
          }}
        >
          <TasklistFormSubmit
            hazard={{
              id: selectedRow.id,
              created_at: selectedRow.created_at,
              lokasi: selectedRow.site,
              pelapor_nama: selectedRow.pelapor_nama,
              pelapor_nrp: selectedRow.pelapor_nrp,
              pic: selectedRow.pic,
              deskripsi_temuan: selectedRow.title,
              detail_lokasi: selectedRow.detail_lokasi,
              keterangan_lokasi: selectedRow.keterangan_lokasi,
              ketidaksesuaian: selectedRow.ketidaksesuaian,
              sub_ketidaksesuaian: selectedRow.sub_ketidaksesuaian,
              quick_action: selectedRow.quick_action,
              evidence: selectedRow.evidence,
              action_plan: selectedRow.action_plan,
              due_date: selectedRow.due_date,
              evaluator_nama: selectedRow.evaluator_nama,
            }}
            readOnly={
              isViewOnly ||
              (() => {
                // Untuk status Submit, readOnly = false jika user adalah PIC dari hazard ini
                const currentUserName = (user?.nama || user?.user || "")
                  .toLowerCase()
                  .trim();
                const rowPic = (selectedRow.pic || "").toLowerCase().trim();
                return currentUserName !== rowPic;
              })()
            }
            onClose={handleBackToTasklist}
            onSuccess={() => {
              handleBackToTasklist();
              setReloadKey((k) => k + 1);
            }}
          />
        </div>
      )}

      {/* Halaman Open Form */}
      {currentPage === "open-form" && selectedRow && (
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "transparent",
            padding: "0 80px 0 24px",
            overflow: "hidden",
          }}
        >
          <TasklistFormOpen
            hazard={{
              id: selectedRow.id,
              created_at: selectedRow.created_at,
              lokasi: selectedRow.site,
              pelapor_nama: selectedRow.pelapor_nama,
              pelapor_nrp: selectedRow.pelapor_nrp,
              pic: selectedRow.pic,
              deskripsi_temuan: selectedRow.title,
              detail_lokasi: selectedRow.detail_lokasi,
              keterangan_lokasi: selectedRow.keterangan_lokasi,
              ketidaksesuaian: selectedRow.ketidaksesuaian,
              sub_ketidaksesuaian: selectedRow.sub_ketidaksesuaian,
              quick_action: selectedRow.quick_action,
              evidence: selectedRow.evidence,
              action_plan: selectedRow.action_plan,
              due_date: selectedRow.due_date,
              evaluator_nama: selectedRow.evaluator_nama,
            }}
            readOnly={(() => {
              // Untuk status Open, readOnly = false jika user adalah pelapor dari hazard ini
              const currentUserName = (user?.nama || user?.user || "")
                .toLowerCase()
                .trim();
              const rowPelapor = (selectedRow.pelapor_nama || "")
                .toLowerCase()
                .trim();
              return currentUserName !== rowPelapor;
            })()}
            onClose={handleBackToTasklist}
            onProgress={() => {
              handleBackToTasklist();
              setReloadKey((k) => k + 1);
            }}
            onReject={() => {
              handleBackToTasklist();
              setReloadKey((k) => k + 1);
            }}
          />
        </div>
      )}

      {/* Halaman Reject at Open Form */}
      {currentPage === "reject-at-open-form" && selectedRow && (
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "transparent",
            padding: "0 80px 0 24px",
            overflow: "hidden",
          }}
        >
          <TasklistFormRejectAtOpen
            hazard={{
              id: selectedRow.id,
              created_at: selectedRow.created_at,
              lokasi: selectedRow.site,
              pelapor_nama: selectedRow.pelapor_nama,
              pelapor_nrp: selectedRow.pelapor_nrp,
              pic: selectedRow.pic,
              deskripsi_temuan: selectedRow.title,
              detail_lokasi: selectedRow.detail_lokasi,
              keterangan_lokasi: selectedRow.keterangan_lokasi,
              ketidaksesuaian: selectedRow.ketidaksesuaian,
              sub_ketidaksesuaian: selectedRow.sub_ketidaksesuaian,
              quick_action: selectedRow.quick_action,
              evidence: selectedRow.evidence,
              action_plan: selectedRow.action_plan,
              due_date: selectedRow.due_date,
              evaluator_nama: selectedRow.evaluator_nama,
              alasan_penolakan_open: selectedRow.alasan_penolakan_open,
            }}
            readOnly={
              isViewOnly ||
              (() => {
                // Untuk status Reject at Open, readOnly = false jika user adalah PIC dari hazard ini
                const currentUserName = (user?.nama || user?.user || "")
                  .toLowerCase()
                  .trim();
                const rowPic = (selectedRow.pic || "").toLowerCase().trim();
                return currentUserName !== rowPic;
              })()
            }
            onClose={handleBackToTasklist}
            onSuccess={() => {
              handleBackToTasklist();
              setReloadKey((k) => k + 1);
            }}
          />
        </div>
      )}

      {/* Halaman Progress Form */}
      {currentPage === "progress-form" && selectedRow && (
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "transparent",
            padding: "0 80px 0 24px",
            overflow: "hidden",
          }}
        >
          <TasklistFormProgress
            hazard={{
              id: selectedRow.id,
              created_at: selectedRow.created_at,
              lokasi: selectedRow.site,
              pelapor_nama: selectedRow.pelapor_nama,
              pelapor_nrp: selectedRow.pelapor_nrp,
              pic: selectedRow.pic,
              deskripsi_temuan: selectedRow.title,
              detail_lokasi: selectedRow.detail_lokasi,
              keterangan_lokasi: selectedRow.keterangan_lokasi,
              ketidaksesuaian: selectedRow.ketidaksesuaian,
              sub_ketidaksesuaian: selectedRow.sub_ketidaksesuaian,
              quick_action: selectedRow.quick_action,
              evidence: selectedRow.evidence,
              action_plan: selectedRow.action_plan,
              due_date: selectedRow.due_date,
              evaluator_nama: selectedRow.evaluator_nama,
              alasan_penolakan_open: selectedRow.alasan_penolakan_open,
              deskripsi_penyelesaian: selectedRow.deskripsi_penyelesaian,
              evidence_perbaikan: selectedRow.evidence_perbaikan,
            }}
            readOnly={
              isViewOnly ||
              (() => {
                // Untuk status Progress, readOnly = false jika user adalah PIC dari hazard ini
                const currentUserName = (user?.nama || user?.user || "")
                  .toLowerCase()
                  .trim();
                const rowPic = (selectedRow.pic || "").toLowerCase().trim();
                return currentUserName !== rowPic;
              })()
            }
            onClose={handleBackToTasklist}
            onSuccess={() => {
              handleBackToTasklist();
              setReloadKey((k) => k + 1);
            }}
          />
        </div>
      )}

      {/* Halaman Done Form */}
      {currentPage === "done-form" && selectedRow && (
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "transparent",
            padding: "0 80px 0 24px",
            overflow: "hidden",
          }}
        >
          <TasklistFormDone
            hazard={{
              id: selectedRow.id,
              created_at: selectedRow.created_at,
              lokasi: selectedRow.site,
              pelapor_nama: selectedRow.pelapor_nama,
              pelapor_nrp: selectedRow.pelapor_nrp,
              pic: selectedRow.pic,
              deskripsi_temuan: selectedRow.title,
              detail_lokasi: selectedRow.detail_lokasi,
              keterangan_lokasi: selectedRow.keterangan_lokasi,
              ketidaksesuaian: selectedRow.ketidaksesuaian,
              sub_ketidaksesuaian: selectedRow.sub_ketidaksesuaian,
              quick_action: selectedRow.quick_action,
              evidence: selectedRow.evidence,
              action_plan: selectedRow.action_plan,
              due_date: selectedRow.due_date,
              evaluator_nama: selectedRow.evaluator_nama,
              alasan_penolakan_open: selectedRow.alasan_penolakan_open,
              deskripsi_penyelesaian: selectedRow.deskripsi_penyelesaian,
              evidence_perbaikan: selectedRow.evidence_perbaikan,
              alasan_penolakan_done: selectedRow.alasan_penolakan_done,
            }}
            readOnly={
              isViewOnly ||
              (() => {
                // Untuk status Done, readOnly = false jika user adalah Evaluator dari hazard ini
                const currentUserName = (user?.nama || user?.user || "")
                  .toLowerCase()
                  .trim();
                const rowEvaluator = (selectedRow.evaluator_nama || "")
                  .toLowerCase()
                  .trim();
                return currentUserName !== rowEvaluator;
              })()
            }
            onClose={handleBackToTasklist}
            onSuccess={() => {
              handleBackToTasklist();
              setReloadKey((k) => k + 1);
            }}
          />
        </div>
      )}

      {/* Halaman Reject at Done Form */}
      {currentPage === "reject-at-done-form" && selectedRow && (
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "transparent",
            padding: "0 80px 0 24px",
            overflow: "hidden",
          }}
        >
          <TasklistFormRejectAtDone
            hazard={{
              id: selectedRow.id,
              created_at: selectedRow.created_at,
              lokasi: selectedRow.site,
              pelapor_nama: selectedRow.pelapor_nama,
              pelapor_nrp: selectedRow.pelapor_nrp,
              pic: selectedRow.pic,
              deskripsi_temuan: selectedRow.title,
              detail_lokasi: selectedRow.detail_lokasi,
              keterangan_lokasi: selectedRow.keterangan_lokasi,
              ketidaksesuaian: selectedRow.ketidaksesuaian,
              sub_ketidaksesuaian: selectedRow.sub_ketidaksesuaian,
              quick_action: selectedRow.quick_action,
              evidence: selectedRow.evidence,
              action_plan: selectedRow.action_plan,
              due_date: selectedRow.due_date,
              evaluator_nama: selectedRow.evaluator_nama,
              alasan_penolakan_open: selectedRow.alasan_penolakan_open,
              deskripsi_penyelesaian: selectedRow.deskripsi_penyelesaian,
              evidence_perbaikan: selectedRow.evidence_perbaikan,
              alasan_penolakan_done: selectedRow.alasan_penolakan_done,
            }}
            readOnly={
              isViewOnly ||
              (() => {
                // Untuk status Reject at Done, readOnly = false jika user adalah PIC dari hazard ini
                const currentUserName = (user?.nama || user?.user || "")
                  .toLowerCase()
                  .trim();
                const rowPic = (selectedRow.pic || "").toLowerCase().trim();
                return currentUserName !== rowPic;
              })()
            }
            onClose={handleBackToTasklist}
            onSuccess={() => {
              handleBackToTasklist();
              setReloadKey((k) => k + 1);
            }}
          />
        </div>
      )}

      {/* Halaman Closed Form */}
      {currentPage === "closed-form" && selectedRow && (
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "transparent",
            padding: "0 80px 0 24px",
            overflow: "hidden",
          }}
        >
          <TasklistFormClosed
            hazard={{
              id: selectedRow.id,
              created_at: selectedRow.created_at,
              site: selectedRow.site,
              pelapor_nama: selectedRow.pelapor_nama,
              pelapor_nrp: selectedRow.pelapor_nrp,
              pic: selectedRow.pic,
              evaluator_nama: selectedRow.evaluator_nama,
              deskripsi_temuan: selectedRow.title,
              detail_lokasi: selectedRow.detail_lokasi,
              keterangan_lokasi: selectedRow.keterangan_lokasi,
              ketidaksesuaian: selectedRow.ketidaksesuaian,
              sub_ketidaksesuaian: selectedRow.sub_ketidaksesuaian,
              quick_action: selectedRow.quick_action,
              evidence: selectedRow.evidence,
              action_plan: selectedRow.action_plan,
              due_date: selectedRow.due_date,
              deskripsi_penyelesaian: selectedRow.deskripsi_penyelesaian,
              evidence_perbaikan: selectedRow.evidence_perbaikan,
              alasan_penolakan_done: selectedRow.alasan_penolakan_done,
            }}
            onClose={handleBackToTasklist}
          />
        </div>
      )}

      {/* Halaman View Detail */}
      {currentPage === "view-detail" && selectedRow && (
        <div
          style={{
            width: "100%",
            height: "100vh",
            background: "transparent",
            padding: "0 80px 0 24px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "transparent",
              borderRadius: 18,
              boxShadow: "none",
              padding: 16,
              maxWidth: 1200,
              width: "100%",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#60a5fa",
                  fontWeight: 900,
                  fontSize: 28,
                }}
              >
                Detail Hazard Report
              </h2>
              <button
                onClick={handleBackToTasklist}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: 24,
                  cursor: "pointer",
                  padding: 0,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                background: "transparent",
                border: "none",
                borderRadius: 12,
                padding: 24,
                color: "#e5e7eb",
              }}
            >
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Status
                  </label>
                  <div style={{ color: "#e5e7eb", marginTop: 4 }}>
                    <span
                      style={{
                        background: "#1f2937",
                        padding: "4px 8px",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    >
                      {selectedRow.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Tanggal Pelaporan
                  </label>
                  <div style={{ color: "#e5e7eb", marginTop: 4 }}>
                    {formatDateOnly(selectedRow.created_at)}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Pelapor
                  </label>
                  <div style={{ color: "#e5e7eb", marginTop: 4 }}>
                    {selectedRow.pelapor_nama}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    PIC
                  </label>
                  <div style={{ color: "#e5e7eb", marginTop: 4 }}>
                    {selectedRow.pic}
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Site
                  </label>
                  <div style={{ color: "#e5e7eb", marginTop: 4 }}>
                    {selectedRow.site}
                  </div>
                </div>

                {selectedRow.due && (
                  <div>
                    <label
                      style={{
                        color: "#9ca3af",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      Due Date
                    </label>
                    <div style={{ color: "#e5e7eb", marginTop: 4 }}>
                      {selectedRow.due}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    style={{
                      color: "#9ca3af",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Deskripsi Temuan
                  </label>
                  <div
                    style={{
                      color: "#e5e7eb",
                      marginTop: 4,
                      background: "#1f2937",
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    {selectedRow.title || "Tidak ada deskripsi"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasklistPageDesktop;
