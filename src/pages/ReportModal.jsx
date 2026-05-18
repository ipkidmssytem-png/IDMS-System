import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DEPARTMENTS = ["ADMIN TSM", "IT", "SAIFER", "KOMUNIKASI"];
const TYPES       = ["MEMO", "SURAT", "UTUSAN", "EMAIL"];
const STATUSES    = ["pending", "viewed", "processed"];

function toMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

function fmtDate(ts) {
  const ms = toMs(ts);
  if (!ms) return "-";
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function capitalize(s) {
  if (!s) return "-";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default function ReportModal({ documents, onClose }) {
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [dept,       setDept]       = useState("All");
  const [type,       setType]       = useState("All");
  const [status,     setStatus]     = useState("All");
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(() => {
    let list = [...documents];

    if (dateFrom) {
      const from = new Date(dateFrom).setHours(0,0,0,0);
      list = list.filter(d => toMs(d.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).setHours(23,59,59,999);
      list = list.filter(d => toMs(d.createdAt) <= to);
    }
    if (dept !== "All") {
      list = list.filter(d => d.departments?.includes(dept));
    }
    if (type !== "All") {
      list = list.filter(d => String(d.type || "").toUpperCase() === type);
    }
    if (status !== "All") {
      list = list.filter(d => String(d.status || "pending").toLowerCase() === status);
    }

    return list;
  }, [documents, dateFrom, dateTo, dept, type, status]);

  const summary = useMemo(() => {
    const byType = {};
    TYPES.forEach(t => { byType[t] = 0; });
    byType["OTHER"] = 0;

    const byDept = {};
    DEPARTMENTS.forEach(d => { byDept[d] = 0; });

    const byStatus = { pending: 0, viewed: 0, processed: 0 };

    filtered.forEach(d => {
      const t = String(d.type || "").toUpperCase();
      if (TYPES.includes(t)) byType[t]++;
      else byType["OTHER"]++;

      (d.departments || []).forEach(dp => {
        if (byDept[dp] !== undefined) byDept[dp]++;
      });

      const s = String(d.status || "pending").toLowerCase();
      if (byStatus[s] !== undefined) byStatus[s]++;
      else byStatus.pending++;
    });

    return { byType, byDept, byStatus };
  }, [filtered]);

  const generatePDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const now   = new Date();
      const nowStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

      // ── Header ──────────────────────────────────────────────────────────
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageW, 36, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("INTEGRATED DOCUMENT MANAGEMENT SYSTEM (IDMS)", pageW / 2, 12, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("POLIS DIRAJA MALAYSIA  ·  IPK PERAK", pageW / 2, 20, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DOCUMENT MANAGEMENT REPORT", pageW / 2, 30, { align: "center" });

      // ── Generated info ──────────────────────────────────────────────────
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${nowStr}`, 14, 44);
      doc.text(`Total records in report: ${filtered.length}`, pageW - 14, 44, { align: "right" });

      // ── Filters Applied ──────────────────────────────────────────────────
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text("FILTERS APPLIED", 14, 54);

      autoTable(doc, {
        startY: 57,
        head: [["Filter", "Value"]],
        body: [
          ["Date Range", dateFrom || dateTo ? `${dateFrom || "—"}  to  ${dateTo || "—"}` : "All dates"],
          ["Department",  dept],
          ["Document Type", type],
          ["Status",      status],
        ],
        theme: "grid",
        headStyles:  { fillColor: [30, 58, 138], fontSize: 9, fontStyle: "bold" },
        bodyStyles:  { fontSize: 9 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
        margin: { left: 14, right: 14 },
      });

      // ── Summary Metrics ──────────────────────────────────────────────────
      let y = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text("SUMMARY METRICS", 14, y);

      y += 3;

      // Status summary
      autoTable(doc, {
        startY: y,
        head: [["Total Documents", "Pending", "Viewed", "Processed"]],
        body: [[
          filtered.length,
          summary.byStatus.pending,
          summary.byStatus.viewed,
          summary.byStatus.processed,
        ]],
        theme: "grid",
        headStyles: { fillColor: [55, 65, 81], fontSize: 9, fontStyle: "bold", halign: "center" },
        bodyStyles: { fontSize: 10, fontStyle: "bold", halign: "center" },
        margin: { left: 14, right: 14 },
      });

      y = doc.lastAutoTable.finalY + 6;

      // By type + by dept side by side using two narrow tables
      const halfW = (pageW - 14 - 14 - 6) / 2;

      autoTable(doc, {
        startY: y,
        head: [["Document Type", "Count", "%"]],
        body: Object.entries(summary.byType)
          .filter(([, v]) => v > 0)
          .map(([t, v]) => [
            t,
            v,
            filtered.length ? `${Math.round((v / filtered.length) * 100)}%` : "0%",
          ]),
        theme: "striped",
        headStyles: { fillColor: [55, 65, 81], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: pageW - 14 - halfW },
      });

      autoTable(doc, {
        startY: y,
        head: [["Department", "Count"]],
        body: Object.entries(summary.byDept)
          .filter(([, v]) => v > 0)
          .map(([d, v]) => [d, v]),
        theme: "striped",
        headStyles: { fillColor: [55, 65, 81], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14 + halfW + 6, right: 14 },
      });

      // ── Document Table ──────────────────────────────────────────────────
      y = Math.max(doc.lastAutoTable.finalY, doc.previousAutoTable?.finalY ?? 0) + 10;

      // Check if we need a new page
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text("DOCUMENT LIST", 14, y);

      autoTable(doc, {
        startY: y + 3,
        head: [["No.", "Ref No.", "Title", "Type", "Department", "Date", "Status"]],
        body: filtered.map((d, i) => [
          i + 1,
          d.refNo || "-",
          (d.title || "-").length > 35 ? d.title.slice(0, 33) + "…" : (d.title || "-"),
          String(d.type || "-").toUpperCase(),
          (d.departments || []).join(", ") || d.department || "-",
          fmtDate(d.createdAt),
          capitalize(d.status || "pending"),
        ]),
        theme: "striped",
        headStyles: { fillColor: [30, 58, 138], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 8,  halign: "center" },
          1: { cellWidth: 28 },
          2: { cellWidth: 55 },
          3: { cellWidth: 18, halign: "center" },
          4: { cellWidth: 32 },
          5: { cellWidth: 20, halign: "center" },
          6: { cellWidth: 22, halign: "center" },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Page number footer
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.setFont("helvetica", "normal");
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageW / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: "center" }
          );
          doc.text(
            "IDMS – IPK Perak  |  CONFIDENTIAL",
            pageW - 14,
            doc.internal.pageSize.getHeight() - 8,
            { align: "right" }
          );
        },
      });

      // ── Save ─────────────────────────────────────────────────────────────
      const fileName = `IDMS_Report_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}_${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}.pdf`;
      doc.save(fileName);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 14,
          width: "100%", maxWidth: 540,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "#1e3a8a", padding: "18px 22px" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
            Generate Report
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#93c5fd" }}>
            Apply filters and export as PDF
          </p>
        </div>

        {/* Filters */}
        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Date range */}
          <div>
            <label style={labelStyle}>Date Range</label>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <span style={subLabelStyle}>From</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={subLabelStyle}>To</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Department */}
          <div>
            <label style={labelStyle}>Department</label>
            <select value={dept} onChange={e => setDept(e.target.value)} style={inputStyle}>
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Type */}
          <div>
            <label style={labelStyle}>Document Type</label>
            <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
              <option value="All">All Types</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              <option value="All">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
            </select>
          </div>

          {/* Preview count */}
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: 8, padding: "10px 14px",
            fontSize: 13, color: "#1e40af", fontWeight: 500,
          }}>
            {filtered.length === 0
              ? "No documents match the selected filters."
              : `${filtered.length} document${filtered.length !== 1 ? "s" : ""} will be included in the report.`}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px 20px",
          display: "flex", gap: 10, justifyContent: "flex-end",
          borderTop: "1px solid #f1f5f9",
        }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button
            onClick={generatePDF}
            disabled={generating || filtered.length === 0}
            style={{
              ...generateBtnStyle,
              opacity: filtered.length === 0 ? 0.5 : 1,
              cursor: filtered.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            {generating ? "Generating…" : "Generate PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 13, fontWeight: 600,
  color: "#374151", marginBottom: 6,
};

const subLabelStyle = {
  display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 3,
};

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 7,
  border: "1px solid #e2e8f0", fontSize: 13, color: "#1e293b",
  background: "#fff", boxSizing: "border-box",
};

const cancelBtnStyle = {
  padding: "9px 20px", borderRadius: 8, fontSize: 14,
  border: "1px solid #e2e8f0", background: "#fff",
  color: "#475569", cursor: "pointer",
};

const generateBtnStyle = {
  padding: "9px 22px", borderRadius: 8, fontSize: 14,
  border: "none", background: "#1e3a8a",
  color: "#fff", fontWeight: 600, cursor: "pointer",
};
