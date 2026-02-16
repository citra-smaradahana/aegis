import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchSitesFTWStatusMap } from "../utils/masterDataHelpers";
import { getTodayWITA, getDateWITARelative, getMonthBoundaryWITA } from "../utils/dateTimeHelpers";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CUSTOM_INPUT_SITES } from "../config/siteLocations";

const TABLE_OPTIONS = [
  { value: "fit_to_work", label: "Fit To Work" },
  { value: "fit_to_work_stats", label: "Statistik Fit To Work" },
  { value: "take_5", label: "Take 5" },
  { value: "tasklist", label: "Hazard Report" },
];

function MonitoringPage({ user, subMenu = "Statistik Fit To Work" }) {
  const [selectedTable, setSelectedTable] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateFromPreset, setDateFromPreset] = useState("");
  const [dateToPreset, setDateToPreset] = useState("");
  const [showCustomDateFrom, setShowCustomDateFrom] = useState(false);
  const [showCustomDateTo, setShowCustomDateTo] = useState(false);
  const [site, setSite] = useState("");
  const [nama, setNama] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fit To Work Statistics State
  const [fitToWorkStats, setFitToWorkStats] = useState({
    totalSubmissions: 0,
    fitToWork: 0,
    notFitToWork: 0,
    fitToWorkPercentage: 0,
    initialNotFitToWork: 0,
    improvedToFit: 0,
    summaryDate: "",
    listData: [],
    improvementCount: 0,
    totalImprovements: 0,
    siteStats: {},
    dailyStats: [],
    statusChanges: [],
    recentReports: [],
  });

  // Take 5 Statistics State
  const [take5Stats, setTake5Stats] = useState({
    totalReports: 0,
    openReports: 0,
    doneReports: 0,
    closedReports: 0,
    completionRate: 0,
    siteStats: [],
    dailyStats: [],
    recentReports: [],
    listData: [],
  });

  // Hazard Statistics State
  const [hazardStats, setHazardStats] = useState({
    totalReports: 0,
    submitReports: 0,
    openReports: 0,
    progressReports: 0,
    doneReports: 0,
    rejectOpenReports: 0,
    rejectDoneReports: 0,
    closedReports: 0,
    completionRate: 0,
    closedOnTime: 0,
    overdueReports: 0,
    closedOverdue: 0,
    siteStats: [],
    dailyStats: [],
    recentReports: [],
    listData: [],
  });

  // PTO Statistics State
  const [ptoStats, setPtoStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    closedReports: 0,
    completionRate: 0,
    siteStats: {},
    dailyStats: [],
    recentReports: [],
    listData: [],
  });

  // Individual Statistics State
  const [individualStats, setIndividualStats] = useState({
    fitToWork: [],
    take5: [],
    hazard: [],
    pto: [],
  });

  // Pagination untuk tabel Data Pengisian Fit To Work
  const [fitToWorkTablePage, setFitToWorkTablePage] = useState(0);
  const [fitToWorkTablePageSize, setFitToWorkTablePageSize] = useState(10);

  // Detect mobile untuk posisi filter fixed (sidebar 240px di desktop)
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Chart view mode untuk grafik batang: daily | weekly | monthly | yearly
  const [chartViewMode, setChartViewMode] = useState("daily");
  const [chartAggregatedData, setChartAggregatedData] = useState([]);
  const [take5ChartAggregatedData, setTake5ChartAggregatedData] = useState([]);
  const [ptoChartAggregatedData, setPtoChartAggregatedData] = useState([]);

  // Initialize based on subMenu
  useEffect(() => {
    if (subMenu === "Statistik Fit To Work") {
      setSelectedTable("fit_to_work_stats");
      fetchFitToWorkStats();
    } else if (subMenu === "Take 5") {
      setSelectedTable("take_5_stats");
      fetchTake5Stats();
    } else if (subMenu === "Hazard") {
      setSelectedTable("hazard_stats");
      fetchHazardStats();
    } else if (subMenu === "PTO") {
      setSelectedTable("pto_stats");
      fetchPtoStats();
    }
  }, [subMenu]);

  // Reset pagination saat data berubah
  useEffect(() => {
    if (selectedTable === "fit_to_work_stats") {
      setFitToWorkTablePage(0);
    }
  }, [fitToWorkStats.listData?.length, selectedTable]);

  // Fetch data when filters change
  useEffect(() => {
    if (selectedTable === "fit_to_work_stats") {
      fetchFitToWorkStats();
    } else if (selectedTable === "take_5_stats") {
      fetchTake5Stats();
    } else if (selectedTable === "hazard_stats") {
      fetchHazardStats();
    } else if (selectedTable === "pto_stats") {
      fetchPtoStats();
    }
  }, [dateFrom, dateTo, site]);

  // Helper function untuk generate date dari preset (WITA)
  const getDateFromPreset = (preset) => {
    switch (preset) {
      case "today":
        return getTodayWITA();
      case "yesterday":
        return getDateWITARelative(-1);
      case "7daysAgo":
        return getDateWITARelative(-6);
      case "30daysAgo":
        return getDateWITARelative(-29);
      case "thisMonthStart":
        return getMonthBoundaryWITA("firstDayThisMonth");
      case "lastMonthStart":
        return getMonthBoundaryWITA("firstDayLastMonth");
      case "lastMonthEnd":
        return getMonthBoundaryWITA("lastDayLastMonth");
      case "custom":
        return "";
      default:
        return "";
    }
  };

  // Handle date from preset change
  const handleDateFromPresetChange = (preset) => {
    setDateFromPreset(preset);
    if (preset === "custom") {
      setShowCustomDateFrom(true);
      setDateFrom("");
    } else {
      setShowCustomDateFrom(false);
      const date = getDateFromPreset(preset);
      setDateFrom(date);
    }
  };

  // Handle date to preset change
  const handleDateToPresetChange = (preset) => {
    setDateToPreset(preset);
    if (preset === "custom") {
      setShowCustomDateTo(true);
      setDateTo("");
    } else {
      setShowCustomDateTo(false);
      const date = getDateFromPreset(preset);
      setDateTo(date);
    }
  };

  // Dummy data untuk dropdown site/nama/status (nanti diganti fetch dari supabase)
  const siteOptions = [
    "Head Office",
    "Balikpapan",
    "ADRO",
    "AMMP",
    "BSIB",
    "GAMR",
    "HRSB",
    "HRSE",
    "PABB",
    "PBRB",
    "PKJA",
    "PPAB",
    "PSMM",
    "REBH",
    "RMTU",
    "PMTU",
  ];
  const namaOptions = site
    ? ["Nama 1", "Nama 2", "Nama 3"].filter((n) => n.includes(site[0]))
    : ["Nama 1", "Nama 2", "Nama 3"];
  const statusOptions =
    selectedTable === "fit_to_work"
      ? ["Fit To Work", "Not Fit To Work", "Pending"]
      : selectedTable === "take_5"
        ? ["open", "done", "closed"]
        : [
            "submit",
            "open",
            "progress",
            "done",
            "reject at open",
            "reject at done",
            "closed",
          ];

  // Fetch Fit To Work Statistics (limit 50000 agar semua data terambil untuk analisa lengkap)
  const fetchFitToWorkStats = async () => {
    setLoading(true);
    try {
      let query = supabase.from("fit_to_work").select("*");
      if (dateFrom) query = query.gte("tanggal", dateFrom);
      if (dateTo) query = query.lte("tanggal", dateTo);
      if (site) query = query.eq("site", site);
      query = query.limit(50000);

      const startDt = dateFrom || getDateWITARelative(-6);
      const endDt = dateTo || getTodayWITA();

      const [fitRes, usersRes, absentRes, ftwStatusMap] = await Promise.all([
        query,
        supabase.from("users").select("id, site").not("site", "is", null),
        supabase.from("fit_to_work_absent").select("user_id, tanggal").gte("tanggal", startDt).lte("tanggal", endDt),
        fetchSitesFTWStatusMap(),
      ]);

      const { data: fitToWorkData, error } = fitRes;
      if (error) {
        console.error("Error fetching Fit To Work data:", error);
        setLoading(false);
        return;
      }

      const users = (usersRes.data || []).filter((u) => u.site);
      const absentList = absentRes.data || [];

      // Hanya hitung kewajiban untuk site dengan FTW enabled
      let usersBySite = {};
      users.forEach((u) => {
        if (ftwStatusMap[u.site] === false) return;
        if (site && u.site !== site) return;
        usersBySite[u.site] = (usersBySite[u.site] || 0) + 1;
      });

      const userIdToSite = {};
      users.forEach((u) => { userIdToSite[u.id] = u.site; });

      let absentByDateSite = {};
      absentList.forEach((a) => {
        const s = userIdToSite[a.user_id];
        if (!s || ftwStatusMap[s] === false || (site && s !== site)) return;
        if (!absentByDateSite[a.tanggal]) absentByDateSite[a.tanggal] = {};
        absentByDateSite[a.tanggal][s] = (absentByDateSite[a.tanggal][s] || 0) + 1;
      });

      const stats = calculateFitToWorkStats(fitToWorkData || [], {
        usersBySite,
        absentByDateSite,
      });
      setFitToWorkStats(stats);

      const individualData = calculateIndividualStats(
        fitToWorkData || [],
        "fit_to_work"
      );
      setIndividualStats((prev) => ({ ...prev, fitToWork: individualData }));
    } catch (error) {
      console.error("Error in fetchFitToWorkStats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch aggregated chart data for Weekly/Monthly/Yearly views
  useEffect(() => {
    if (selectedTable !== "fit_to_work_stats" || chartViewMode === "daily") {
      setChartAggregatedData([]);
      return;
    }
    const run = async () => {
      let rangeFromStr, rangeToStr;
      if (chartViewMode === "monthly") {
        rangeToStr = getTodayWITA();
        const todayStr = getTodayWITA();
        const [y, m] = todayStr.split("-").map(Number);
        const start = new Date(Date.UTC(y, m - 1 - 11, 1));
        rangeFromStr = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-01`;
      } else if (chartViewMode === "yearly") {
        rangeToStr = getTodayWITA();
        const todayStr = getTodayWITA();
        const y = parseInt(todayStr.split("-")[0], 10);
        rangeFromStr = `${y - 4}-01-01`;
      } else {
        return;
      }

      try {
        let query = supabase.from("fit_to_work").select("*").gte("tanggal", rangeFromStr).lte("tanggal", rangeToStr);
        if (site) query = query.eq("site", site);

        const [fitRes, usersRes, absentRes, ftwStatusMap] = await Promise.all([
          query,
          supabase.from("users").select("id, site").not("site", "is", null),
          supabase.from("fit_to_work_absent").select("user_id, tanggal").gte("tanggal", rangeFromStr).lte("tanggal", rangeToStr),
          fetchSitesFTWStatusMap(),
        ]);

        if (fitRes.error) throw fitRes.error;
        const fitData = fitRes.data || [];
        const users = (usersRes.data || []).filter((u) => u.site && (!site || u.site === site));
        const absentList = absentRes.data || [];

        let usersBySite = {};
        users.forEach((u) => {
          if (ftwStatusMap[u.site] === false) return;
          usersBySite[u.site] = (usersBySite[u.site] || 0) + 1;
        });
        const userIdToSite = {};
        users.forEach((u) => { userIdToSite[u.id] = u.site; });
        let absentByDateSite = {};
        absentList.forEach((a) => {
          const s = userIdToSite[a.user_id];
          if (!s || ftwStatusMap[s] === false) return;
          if (!absentByDateSite[a.tanggal]) absentByDateSite[a.tanggal] = {};
          absentByDateSite[a.tanggal][s] = (absentByDateSite[a.tanggal][s] || 0) + 1;
        });

        // Build daily stats for chart range manually (WITA)
        const daily = [];
        let cur = new Date(rangeFromStr + "T12:00:00+08:00");
        const endD = new Date(rangeToStr + "T12:00:00+08:00");
        while (cur <= endD) {
          const dateStr = cur.toISOString().slice(0, 10);
          const dayData = fitData.filter((item) => item.tanggal === dateStr);
          let total = 0, absent = 0;
          Object.entries(usersBySite).forEach(([s, n]) => {
            total += n;
            absent += (absentByDateSite[dateStr] || {})[s] || 0;
          });
          const kewajiban = Math.max(0, total - absent);
          const pengisian = dayData.length;
          const fitToWork = dayData.filter((item) => item.status_fatigue === "Fit To Work").length;
          const notFitToWork = dayData.filter((item) => item.status_fatigue === "Not Fit To Work").length;
          daily.push({ date: dateStr, kewajiban, pengisian, total: pengisian, fitToWork, notFitToWork });
          cur.setTime(cur.getTime() + 24 * 60 * 60 * 1000);
        }

        if (chartViewMode === "monthly") {
          const byMonth = {};
          daily.forEach((d) => {
            const dt = new Date(d.date);
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
            if (!byMonth[key]) byMonth[key] = { label: "", kewajiban: 0, pengisian: 0, fitToWork: 0, notFitToWork: 0 };
            byMonth[key].kewajiban += d.kewajiban ?? 0;
            byMonth[key].pengisian += d.pengisian ?? d.total ?? 0;
            byMonth[key].fitToWork += d.fitToWork ?? 0;
            byMonth[key].notFitToWork += d.notFitToWork ?? 0;
            const names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            byMonth[key].label = `${names[dt.getMonth()]} ${dt.getFullYear()}`;
          });
          setChartAggregatedData(Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v));
        } else if (chartViewMode === "yearly") {
          const byYear = {};
          daily.forEach((d) => {
            const y = new Date(d.date).getFullYear();
            if (!byYear[y]) byYear[y] = { label: String(y), kewajiban: 0, pengisian: 0, fitToWork: 0, notFitToWork: 0 };
            byYear[y].kewajiban += d.kewajiban ?? 0;
            byYear[y].pengisian += d.pengisian ?? d.total ?? 0;
            byYear[y].fitToWork += d.fitToWork ?? 0;
            byYear[y].notFitToWork += d.notFitToWork ?? 0;
          });
          setChartAggregatedData(Object.entries(byYear).sort((a, b) => a[0] - b[0]).map(([, v]) => v));
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setChartAggregatedData([]);
      }
    };
    run();
  }, [selectedTable, chartViewMode, site]);

  // Fetch Take 5 chart aggregated data (monthly/yearly)
  useEffect(() => {
    if (selectedTable !== "take_5_stats" || chartViewMode === "daily") {
      setTake5ChartAggregatedData([]);
      return;
    }
    const run = async () => {
      let rangeFromStr, rangeToStr;
      if (chartViewMode === "monthly") {
        rangeToStr = getTodayWITA();
        const todayStr = getTodayWITA();
        const [y, m] = todayStr.split("-").map(Number);
        const start = new Date(Date.UTC(y, m - 1 - 11, 1));
        rangeFromStr = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-01`;
      } else if (chartViewMode === "yearly") {
        rangeToStr = getTodayWITA();
        const y = parseInt(getTodayWITA().split("-")[0], 10);
        rangeFromStr = `${y - 4}-01-01`;
      } else return;

      try {
        let query = supabase.from("take_5").select("*").gte("created_at", rangeFromStr).lte("created_at", rangeToStr);
        if (site) query = query.eq("site", site);
        query = query.limit(50000);
        const { data, error } = await query;
        if (error) throw error;
        const list = data || [];

        const daily = [];
        let cur = new Date(rangeFromStr + "T12:00:00+08:00");
        const endD = new Date(rangeToStr + "T12:00:00+08:00");
        while (cur <= endD) {
          const dateStr = cur.toISOString().slice(0, 10);
          const dayData = list.filter((item) => (item.created_at || "").slice(0, 10) === dateStr);
          daily.push({
            date: dateStr,
            total: dayData.length,
            open: dayData.filter((i) => (i.status || "").toLowerCase() === "open").length,
            done: dayData.filter((i) => (i.status || "").toLowerCase() === "done").length,
            closed: dayData.filter((i) => (i.status || "").toLowerCase() === "closed").length,
          });
          cur.setTime(cur.getTime() + 24 * 60 * 60 * 1000);
        }

        if (chartViewMode === "monthly") {
          const byMonth = {};
          daily.forEach((d) => {
            const dt = new Date(d.date + "T12:00:00");
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
            if (!byMonth[key]) byMonth[key] = { label: "", total: 0, open: 0, done: 0, closed: 0 };
            byMonth[key].total += d.total ?? 0;
            byMonth[key].open += d.open ?? 0;
            byMonth[key].done += d.done ?? 0;
            byMonth[key].closed += d.closed ?? 0;
            const names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            byMonth[key].label = `${names[dt.getMonth()]} ${dt.getFullYear()}`;
          });
          setTake5ChartAggregatedData(Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v));
        } else if (chartViewMode === "yearly") {
          const byYear = {};
          daily.forEach((d) => {
            const y = new Date(d.date + "T12:00:00").getFullYear();
            if (!byYear[y]) byYear[y] = { label: String(y), total: 0, open: 0, done: 0, closed: 0 };
            byYear[y].total += d.total ?? 0;
            byYear[y].open += d.open ?? 0;
            byYear[y].done += d.done ?? 0;
            byYear[y].closed += d.closed ?? 0;
          });
          setTake5ChartAggregatedData(Object.entries(byYear).sort((a, b) => a[0] - b[0]).map(([, v]) => v));
        }
      } catch (err) {
        console.error("Error fetching Take 5 chart data:", err);
        setTake5ChartAggregatedData([]);
      }
    };
    run();
  }, [selectedTable, chartViewMode, site]);

  // Fetch PTO chart aggregated data (monthly/yearly)
  useEffect(() => {
    if (selectedTable !== "pto_stats" || chartViewMode === "daily") {
      setPtoChartAggregatedData([]);
      return;
    }
    const run = async () => {
      let rangeFromStr, rangeToStr;
      if (chartViewMode === "monthly") {
        rangeToStr = getTodayWITA();
        const todayStr = getTodayWITA();
        const [y, m] = todayStr.split("-").map(Number);
        const start = new Date(Date.UTC(y, m - 1 - 11, 1));
        rangeFromStr = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-01`;
      } else if (chartViewMode === "yearly") {
        rangeToStr = getTodayWITA();
        const y = parseInt(getTodayWITA().split("-")[0], 10);
        rangeFromStr = `${y - 4}-01-01`;
      } else return;

      try {
        let query = supabase.from("planned_task_observation").select("*").gte("tanggal", rangeFromStr).lte("tanggal", rangeToStr);
        if (site) query = query.eq("site", site);
        query = query.limit(50000);
        const { data, error } = await query;
        if (error) throw error;
        const list = data || [];

        const daily = [];
        let cur = new Date(rangeFromStr + "T12:00:00+08:00");
        const endD = new Date(rangeToStr + "T12:00:00+08:00");
        while (cur <= endD) {
          const dateStr = cur.toISOString().slice(0, 10);
          const dayData = list.filter((item) => (item.tanggal || "") === dateStr);
          daily.push({
            date: dateStr,
            total: dayData.length,
            pending: dayData.filter((i) => (i.status || "").toLowerCase() === "pending").length,
            closed: dayData.filter((i) => (i.status || "").toLowerCase() === "closed").length,
          });
          cur.setTime(cur.getTime() + 24 * 60 * 60 * 1000);
        }

        if (chartViewMode === "monthly") {
          const byMonth = {};
          daily.forEach((d) => {
            const dt = new Date(d.date + "T12:00:00");
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
            if (!byMonth[key]) byMonth[key] = { label: "", total: 0, pending: 0, closed: 0 };
            byMonth[key].total += d.total ?? 0;
            byMonth[key].pending += d.pending ?? 0;
            byMonth[key].closed += d.closed ?? 0;
            const names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            byMonth[key].label = `${names[dt.getMonth()]} ${dt.getFullYear()}`;
          });
          setPtoChartAggregatedData(Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v));
        } else if (chartViewMode === "yearly") {
          const byYear = {};
          daily.forEach((d) => {
            const y = new Date(d.date + "T12:00:00").getFullYear();
            if (!byYear[y]) byYear[y] = { label: String(y), total: 0, pending: 0, closed: 0 };
            byYear[y].total += d.total ?? 0;
            byYear[y].pending += d.pending ?? 0;
            byYear[y].closed += d.closed ?? 0;
          });
          setPtoChartAggregatedData(Object.entries(byYear).sort((a, b) => a[0] - b[0]).map(([, v]) => v));
        }
      } catch (err) {
        console.error("Error fetching PTO chart data:", err);
        setPtoChartAggregatedData([]);
      }
    };
    run();
  }, [selectedTable, chartViewMode, site]);

  // Fetch Take 5 Statistics (limit 50000 agar semua data terambil untuk analisa lengkap)
  const fetchTake5Stats = async () => {
    setLoading(true);
    try {
      let query = supabase.from("take_5").select("*");
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);
      if (site) query = query.eq("site", site);
      query = query.limit(50000);

      console.log("=== TAKE 5 QUERY DEBUG ===");
      console.log("Site filter:", site);
      console.log("Date filter:", { dateFrom, dateTo });

      const { data: take5Data, error } = await query;

      if (error) {
        console.error("Error fetching Take 5 data:", error);
        return;
      }

      console.log("=== TAKE 5 DATA DEBUG ===");
      console.log("Take 5 data length:", take5Data?.length || 0);
      if (take5Data && take5Data.length > 0) {
        console.log("First Take 5 record:", take5Data[0]);
        console.log("All detail_lokasi values:", [
          ...new Set(take5Data.map((item) => item.detail_lokasi)),
        ]);
        console.log("All site values:", [
          ...new Set(take5Data.map((item) => item.site)),
        ]);
        console.log("All lokasi values:", [
          ...new Set(take5Data.map((item) => item.lokasi)),
        ]);
        console.log("Site statistics will use 'site' field primarily");
        console.log("Sample records with site info:");
        take5Data.slice(0, 3).forEach((item, index) => {
          console.log(`Record ${index + 1}:`, {
            detail_lokasi: item.detail_lokasi,
            site: item.site,
            lokasi: item.lokasi,
            status: item.status,
            user_id: item.user_id,
            pelapor_nama: item.pelapor_nama,
          });
        });
      }
      console.log("=== END TAKE 5 DATA DEBUG ===");

      // Calculate statistics
      const stats = calculateTake5Stats(take5Data || []);
      setTake5Stats(stats);

      // Calculate individual statistics
      const individualData = calculateIndividualStats(
        take5Data || [],
        "take_5"
      );
      setIndividualStats((prev) => ({ ...prev, take5: individualData }));
    } catch (error) {
      console.error("Error in fetchTake5Stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Hazard Statistics (limit 50000 agar semua data terambil untuk analisa lengkap)
  const fetchHazardStats = async () => {
    setLoading(true);
    try {
      // Fetch dari tabel tasklist (Hazard)
      let query = supabase.from("tasklist").select("*");
      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);
      if (site) query = query.eq("lokasi", site);
      query = query.limit(50000);

      const { data: tasklistData, error: tasklistError } = await query;

      if (tasklistError) {
        console.error("Error fetching tasklist data:", tasklistError);
      }

      console.log("=== TASKLIST TABLE DEBUG ===");
      console.log("Tasklist query result:", {
        data: tasklistData,
        error: tasklistError,
      });
      console.log("Tasklist data length:", tasklistData?.length || 0);
      if (tasklistData && tasklistData.length > 0) {
        console.log("First tasklist record:", tasklistData[0]);
        console.log("All tasklist statuses:", [
          ...new Set(tasklistData.map((item) => item.status)),
        ]);
      }
      console.log("=== END TASKLIST DEBUG ===");

      // Fetch dari tabel hazard_report (bukan hazard)
      let hazardQuery = supabase.from("hazard_report").select("*");
      if (dateFrom) hazardQuery = hazardQuery.gte("created_at", dateFrom);
      if (dateTo) hazardQuery = hazardQuery.lte("created_at", dateTo);
      if (site) hazardQuery = hazardQuery.eq("lokasi", site);
      hazardQuery = hazardQuery.limit(50000);

      const { data: hazardData, error: hazardError } = await hazardQuery;

      if (hazardError) {
        console.error("Error fetching hazard data:", hazardError);
      }

      console.log("=== HAZARD TABLE DEBUG ===");
      console.log("Hazard query result:", {
        data: hazardData,
        error: hazardError,
      });
      console.log("Hazard data length:", hazardData?.length || 0);
      if (hazardData && hazardData.length > 0) {
        console.log("First hazard record:", hazardData[0]);
        console.log("All hazard statuses:", [
          ...new Set(hazardData.map((item) => item.status)),
        ]);
      }
      console.log("=== END HAZARD DEBUG ===");

      // Normalize data structure untuk konsistensi field names
      const normalizedTasklistData = (tasklistData || []).map((item) => ({
        ...item,
        lokasi: item.lokasi || item.site || item.user_perusahaan || "Unknown",
        created_at: item.created_at || item.tanggal,
        due_date: item.due_date || item.target_date,
      }));

      const normalizedHazardData = (hazardData || []).map((item) => ({
        ...item,
        status: item.status,
        lokasi: item.lokasi, // hazard_report sudah punya field lokasi
        created_at: item.created_at, // hazard_report sudah punya field created_at
        due_date: item.due_date,
      }));

      // Gabungkan data dari kedua tabel
      const combinedData = [...normalizedTasklistData, ...normalizedHazardData];

      console.log("=== FINAL DATA SUMMARY ===");
      console.log("Tasklist records:", tasklistData?.length || 0);
      console.log("Hazard_report records:", hazardData?.length || 0);
      console.log("Combined records:", combinedData.length);
      console.log("Combined statuses:", [
        ...new Set(combinedData.map((item) => item.status)),
      ]);
      console.log("Combined sites:", [
        ...new Set(combinedData.map((item) => item.lokasi)),
      ]);
      console.log("=== END SUMMARY ===");

      // Debug: Cek struktur data dari masing-masing tabel
      if (tasklistData && tasklistData.length > 0) {
        console.log("Tasklist sample data:", tasklistData[0]);
        console.log("Tasklist status values:", [
          ...new Set(tasklistData.map((item) => item.status)),
        ]);
        console.log("Tasklist field names:", Object.keys(tasklistData[0]));
      }

      if (hazardData && hazardData.length > 0) {
        console.log("Hazard sample data:", hazardData[0]);
        console.log("Hazard status values:", [
          ...new Set(hazardData.map((item) => item.status)),
        ]);
        console.log("Hazard field names:", Object.keys(hazardData[0]));
      }

      // Calculate statistics
      const stats = calculateHazardStats(combinedData);
      setHazardStats(stats);

      // Calculate individual statistics
      const individualData = calculateIndividualStats(combinedData, "hazard");
      setIndividualStats((prev) => ({ ...prev, hazard: individualData }));
    } catch (error) {
      console.error("Error in fetchHazardStats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch PTO Statistics (limit 50000 agar semua data terambil untuk analisa lengkap)
  const fetchPtoStats = async () => {
    setLoading(true);
    try {
      let query = supabase.from("planned_task_observation").select("*");
      if (dateFrom) query = query.gte("tanggal", dateFrom);
      if (dateTo) query = query.lte("tanggal", dateTo);
      if (site) query = query.eq("site", site);
      query = query.limit(50000);

      const { data: ptoData, error } = await query;

      if (error) {
        console.error("Error fetching PTO data:", error);
        setLoading(false);
        return;
      }

      const stats = calculatePtoStats(ptoData || []);
      setPtoStats(stats);

      const individualData = calculateIndividualStats(ptoData || [], "pto");
      setIndividualStats((prev) => ({ ...prev, pto: individualData }));
    } catch (error) {
      console.error("Error in fetchPtoStats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Fit To Work Statistics
  const calculateFitToWorkStats = (data, extra = {}) => {
    const { usersBySite = {}, absentByDateSite = {} } = extra;
    // Filter data berdasarkan date range dan site
    let filteredData = [...data];

    if (dateFrom) {
      filteredData = filteredData.filter((item) => item.tanggal >= dateFrom);
    }
    if (dateTo) {
      filteredData = filteredData.filter((item) => item.tanggal <= dateTo);
    }
    if (site) {
      filteredData = filteredData.filter((item) => item.site === site);
    }

    // Summary = data pengisian pada hari tersebut saja (tidak menggabungkan hari lain)
    let summaryDateStr;
    if (dateFrom && dateTo) {
      summaryDateStr = dateTo;
    } else if (dateFrom) {
      summaryDateStr = dateFrom;
    } else if (dateTo) {
      summaryDateStr = dateTo;
    } else {
      summaryDateStr = getTodayWITA();
    }
    const summaryData = filteredData.filter(
      (item) => item.tanggal === summaryDateStr
    );

    const totalSubmissions = summaryData.length;
    // Status saat ini (setelah validasi)
    const fitToWork = summaryData.filter(
      (item) => item.status_fatigue === "Fit To Work"
    ).length;
    const notFitToWork = summaryData.filter(
      (item) => item.status_fatigue === "Not Fit To Work"
    ).length;
    // Berdasarkan initial_status_fatigue (saat pengisian pertama, sebelum validasi)
    const initialNotFitToWork = summaryData.filter(
      (item) =>
        (item.initial_status_fatigue || item.status_fatigue) === "Not Fit To Work"
    ).length;
    const improvedToFit = summaryData.filter(
      (item) =>
        (item.initial_status_fatigue || item.status_fatigue) === "Not Fit To Work" &&
        item.status_fatigue === "Fit To Work"
    ).length;

    // Calculate percentage of Fit To Work employees
    const fitToWorkPercentage =
      totalSubmissions > 0
        ? parseFloat(((fitToWork / totalSubmissions) * 100).toFixed(1))
        : 0;

    // Site statistics untuk hari tersebut
    const siteStats = {};
    summaryData.forEach((item) => {
      if (!siteStats[item.site]) {
        siteStats[item.site] = {
          total: 0,
          fitToWork: 0,
          notFitToWork: 0,
          initialNotFit: 0,
          improvedToFit: 0,
        };
      }
      siteStats[item.site].total++;
      if (item.status_fatigue === "Fit To Work") {
        siteStats[item.site].fitToWork++;
      } else if (item.status_fatigue === "Not Fit To Work") {
        siteStats[item.site].notFitToWork++;
      }
      if ((item.initial_status_fatigue || item.status_fatigue) === "Not Fit To Work") {
        siteStats[item.site].initialNotFit++;
      }
      if (
        (item.initial_status_fatigue || item.status_fatigue) === "Not Fit To Work" &&
        item.status_fatigue === "Fit To Work"
      ) {
        siteStats[item.site].improvedToFit++;
      }
    });

    // Daily statistics (last 7 days atau sesuai filter, WITA)
    const dailyStats = [];
    const startDateStr = dateFrom || getDateWITARelative(-6);
    const endDateStr = dateTo || getTodayWITA();

    if (!dateFrom && !dateTo) {
      // Default: last 7 days
      for (let i = 6; i >= 0; i--) {
        const dateStr = getDateWITARelative(-i);

        const dayData = filteredData.filter((item) => item.tanggal === dateStr);
        const pengisian = dayData.length;
        const kewajiban = (() => {
          let total = 0;
          let absent = 0;
          Object.entries(usersBySite).forEach(([s, n]) => {
            total += n;
            absent += (absentByDateSite[dateStr] || {})[s] || 0;
          });
          return Math.max(0, total - absent);
        })();
        dailyStats.push({
          date: dateStr,
          total: pengisian,
          pengisian,
          kewajiban,
          persentasePengisian: kewajiban > 0 ? parseFloat(((pengisian / kewajiban) * 100).toFixed(1)) : 0,
          fitToWork: dayData.filter(
            (item) => item.status_fatigue === "Fit To Work"
          ).length,
          notFitToWork: dayData.filter(
            (item) => item.status_fatigue === "Not Fit To Work"
          ).length,
          initialNotFit: dayData.filter(
            (item) =>
              (item.initial_status_fatigue || item.status_fatigue) === "Not Fit To Work"
          ).length,
          improvedToFit: dayData.filter(
            (item) =>
              (item.initial_status_fatigue || item.status_fatigue) === "Not Fit To Work" &&
              item.status_fatigue === "Fit To Work"
          ).length,
        });
      }
    } else {
      // Custom date range
      let currentDate = new Date(startDateStr + "T12:00:00+08:00");
      const endDate = new Date(endDateStr + "T12:00:00+08:00");
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().slice(0, 10);

        const dayData = filteredData.filter((item) => item.tanggal === dateStr);
        const pengisian = dayData.length;
        const kewajiban = (() => {
          let total = 0;
          let absent = 0;
          Object.entries(usersBySite).forEach(([s, n]) => {
            total += n;
            absent += (absentByDateSite[dateStr] || {})[s] || 0;
          });
          return Math.max(0, total - absent);
        })();
        dailyStats.push({
          date: dateStr,
          total: pengisian,
          pengisian,
          kewajiban,
          persentasePengisian: kewajiban > 0 ? parseFloat(((pengisian / kewajiban) * 100).toFixed(1)) : 0,
          fitToWork: dayData.filter(
            (item) => item.status_fatigue === "Fit To Work"
          ).length,
          notFitToWork: dayData.filter(
            (item) => item.status_fatigue === "Not Fit To Work"
          ).length,
          initialNotFit: dayData.filter(
            (item) =>
              (item.initial_status_fatigue || item.status_fatigue) === "Not Fit To Work"
          ).length,
          improvedToFit: dayData.filter(
            (item) =>
              (item.initial_status_fatigue || item.status_fatigue) === "Not Fit To Work" &&
              item.status_fatigue === "Fit To Work"
          ).length,
        });

        currentDate.setTime(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Status changes tracking - seluruh data dalam rentang filter (untuk download lengkap)
    const statusChanges = filteredData
      .filter((item) => item.workflow_status === "Closed")
      .map((item) => ({
        nama: item.nama,
        site: item.site,
        tanggal: item.tanggal,
        finalStatus: item.status_fatigue,
        initialStatus: item.initial_status_fatigue || item.status_fatigue,
        status:
          item.status_fatigue === "Fit To Work"
            ? "Fit To Work"
            : "Not Fit To Work",
      }))
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    return {
      totalSubmissions,
      fitToWork,
      notFitToWork,
      fitToWorkPercentage,
      initialNotFitToWork,
      improvedToFit,
      improvementCount: 0, // Keep for backward compatibility
      totalImprovements: 0, // Keep for backward compatibility
      summaryDate: summaryDateStr, // Tanggal untuk summary (hari tersebut)
      siteStats,
      dailyStats,
      statusChanges,
      recentReports: summaryData.slice(0, 10),
      listData: [...filteredData].sort(
        (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
      ), // All-time data, sorted terbaru dulu
    };
  };

  // Calculate Take 5 Statistics
  const calculateTake5Stats = (data) => {
    let filteredData = [...data];

    if (dateFrom) {
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.created_at).toISOString().split("T")[0];
        return itemDate >= dateFrom;
      });
    }
    if (dateTo) {
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.created_at).toISOString().split("T")[0];
        return itemDate <= dateTo;
      });
    }
    if (site) {
      filteredData = filteredData.filter((item) => {
        // Use site field for filtering, fallback to detail_lokasi
        const itemSite = item.site || item.detail_lokasi || item.lokasi;
        return itemSite === site;
      });
    }

    const totalReports = filteredData.length;
    const openReports = filteredData.filter(
      (item) => item.status?.toLowerCase() === "open"
    ).length;
    const doneReports = filteredData.filter(
      (item) => item.status?.toLowerCase() === "done"
    ).length;
    const closedReports = filteredData.filter(
      (item) => item.status?.toLowerCase() === "closed"
    ).length;

    const completionRate =
      totalReports > 0 ? ((closedReports / totalReports) * 100).toFixed(1) : 0;

    console.log("=== TAKE 5 CALCULATION DEBUG ===");
    console.log("Filtered data length:", filteredData.length);
    console.log("totalReports:", totalReports);
    console.log("openReports:", openReports);
    console.log("doneReports:", doneReports);
    console.log("closedReports:", closedReports);
    console.log("completionRate:", completionRate);
    console.log("Site filter:", site);
    console.log("Date filter:", { dateFrom, dateTo });
    console.log("=== END TAKE 5 DEBUG ===");

    // Site statistics
    const siteStats = {};
    filteredData.forEach((item) => {
      // Use the site field for site name (BSIB, Balikpapan, etc.)
      // detail_lokasi contains specific location details
      const siteName =
        item.site || item.detail_lokasi || item.lokasi || "Unknown";

      if (!siteStats[siteName]) {
        siteStats[siteName] = {
          total: 0,
          open: 0,
          done: 0,
          closed: 0,
        };
      }
      siteStats[siteName].total++;
      if (item.status?.toLowerCase() === "open") siteStats[siteName].open++;
      if (item.status?.toLowerCase() === "done") siteStats[siteName].done++;
      if (item.status?.toLowerCase() === "closed") siteStats[siteName].closed++;
    });

    // Daily statistics (last 7 days atau sesuai filter, WITA)
    const dailyStats = [];
    const startDateStr = dateFrom || getDateWITARelative(-6);
    const endDateStr = dateTo || getTodayWITA();

    if (!dateFrom && !dateTo) {
      // Default: last 7 days
      for (let i = 6; i >= 0; i--) {
        const dateStr = getDateWITARelative(-i);

        const dayData = filteredData.filter((item) => {
          const itemDate = new Date(item.created_at)
            .toISOString()
            .split("T")[0];
          return itemDate === dateStr;
        });
        dailyStats.push({
          date: dateStr,
          total: dayData.length,
          submit: dayData.filter(
            (item) => item.status?.toLowerCase() === "submit"
          ).length,
          open: dayData.filter((item) => item.status?.toLowerCase() === "open")
            .length,
          progress: dayData.filter(
            (item) => item.status?.toLowerCase() === "progress"
          ).length,
          done: dayData.filter((item) => item.status?.toLowerCase() === "done")
            .length,
          rejectOpen: dayData.filter(
            (item) => item.status?.toLowerCase() === "reject at open"
          ).length,
          rejectDone: dayData.filter(
            (item) => item.status?.toLowerCase() === "reject at done"
          ).length,
          closed: dayData.filter(
            (item) => item.status?.toLowerCase() === "closed"
          ).length,
        });
      }
    } else {
      // Custom date range
      let currentDate = new Date(startDateStr + "T12:00:00+08:00");
      const endDate = new Date(endDateStr + "T12:00:00+08:00");
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().slice(0, 10);

        const dayData = filteredData.filter((item) => {
          const itemDate = new Date(item.created_at)
            .toISOString()
            .split("T")[0];
          return itemDate === dateStr;
        });
        dailyStats.push({
          date: dateStr,
          total: dayData.length,
          submit: dayData.filter(
            (item) => item.status?.toLowerCase() === "submit"
          ).length,
          open: dayData.filter((item) => item.status?.toLowerCase() === "open")
            .length,
          progress: dayData.filter(
            (item) => item.status?.toLowerCase() === "progress"
          ).length,
          done: dayData.filter((item) => item.status?.toLowerCase() === "done")
            .length,
          rejectOpen: dayData.filter(
            (item) => item.status?.toLowerCase() === "reject at open"
          ).length,
          rejectDone: dayData.filter(
            (item) => item.status?.toLowerCase() === "reject at done"
          ).length,
          closed: dayData.filter(
            (item) => item.status?.toLowerCase() === "closed"
          ).length,
        });

        currentDate.setTime(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Recent reports (last 10)
    const recentReports = filteredData
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    // Semua data (untuk download/analisa lengkap)
    const listData = [...filteredData].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return {
      totalReports,
      openReports,
      doneReports,
      closedReports,
      completionRate,
      siteStats,
      dailyStats,
      recentReports,
      listData,
    };
  };

  // Calculate Hazard Statistics
  const calculateHazardStats = (data) => {
    console.log("calculateHazardStats - Raw data:", data);

    let filteredData = [...data];

    if (dateFrom) {
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.created_at).toISOString().split("T")[0];
        return itemDate >= dateFrom;
      });
    }
    if (dateTo) {
      filteredData = filteredData.filter((item) => {
        const itemDate = new Date(item.created_at).toISOString().split("T")[0];
        return itemDate <= dateTo;
      });
    }
    if (site) {
      filteredData = filteredData.filter((item) => item.lokasi === site);
    }

    console.log("calculateHazardStats - Filtered data:", filteredData);
    console.log("calculateHazardStats - Sample item:", filteredData[0]);

    const totalReports = filteredData.length;
    const submitReports = filteredData.filter(
      (item) => item.status?.toLowerCase() === "submit"
    ).length;
    const openReports = filteredData.filter(
      (item) => item.status?.toLowerCase() === "open"
    ).length;
    const progressReports = filteredData.filter(
      (item) => item.status?.toLowerCase() === "progress"
    ).length;
    const doneReports = filteredData.filter(
      (item) => item.status?.toLowerCase() === "done"
    ).length;
    const rejectOpenReports = filteredData.filter(
      (item) => item.status?.toLowerCase() === "reject at open"
    ).length;
    const rejectDoneReports = filteredData.filter(
      (item) => item.status?.toLowerCase() === "reject at done"
    ).length;
    const closedReports = filteredData.filter(
      (item) => item.status?.toLowerCase() === "closed"
    ).length;

    console.log("calculateHazardStats - Status counts:", {
      total: totalReports,
      submit: submitReports,
      open: openReports,
      progress: progressReports,
      done: doneReports,
      rejectOpen: rejectOpenReports,
      rejectDone: rejectDoneReports,
      closed: closedReports,
    });

    // Calculate completion rate based on closed status
    const completionRate =
      totalReports > 0 ? ((closedReports / totalReports) * 100).toFixed(1) : 0;

    // Calculate on-time and overdue statistics
    const today = new Date();
    let closedOnTime = 0;
    let overdueReports = 0;
    let closedOverdue = 0;

    filteredData.forEach((item) => {
      if (item.due_date) {
        const dueDate = new Date(item.due_date);
        const dueEndOfDay = new Date(dueDate);
        dueEndOfDay.setHours(23, 59, 59, 999);

        if (item.status?.toLowerCase() === "closed") {
          // Gunakan updated_at sebagai tanggal penutupan; fallback ke created_at
          const closedAt = item.updated_at
            ? new Date(item.updated_at)
            : new Date(item.created_at);
          if (closedAt > dueEndOfDay) {
            closedOverdue++;
          } else {
            closedOnTime++;
          }
        } else {
          // Belum closed: cek apakah sudah melewati due date
          if (today > dueEndOfDay) {
            overdueReports++;
          }
        }
      }
    });

    console.log("calculateHazardStats - Completion stats:", {
      totalActiveReports:
        submitReports +
        openReports +
        progressReports +
        doneReports +
        rejectOpenReports +
        rejectDoneReports,
      closedReports,
      completionRate,
      closedOnTime,
      overdueReports,
      closedOverdue,
    });

    // Site statistics
    const siteStats = {};
    filteredData.forEach((item) => {
      const siteName = item.lokasi || "Unknown";
      if (!siteStats[siteName]) {
        siteStats[siteName] = {
          total: 0,
          submit: 0,
          open: 0,
          progress: 0,
          done: 0,
          rejectOpen: 0,
          rejectDone: 0,
          closed: 0,
        };
      }
      siteStats[siteName].total++;
      if (item.status?.toLowerCase() === "submit") siteStats[siteName].submit++;
      if (item.status?.toLowerCase() === "open") siteStats[siteName].open++;
      if (item.status?.toLowerCase() === "progress")
        siteStats[siteName].progress++;
      if (item.status?.toLowerCase() === "done") siteStats[siteName].done++;
      if (item.status?.toLowerCase() === "reject at open")
        siteStats[siteName].rejectOpen++;
      if (item.status?.toLowerCase() === "reject at done")
        siteStats[siteName].rejectDone++;
      if (item.status?.toLowerCase() === "closed") siteStats[siteName].closed++;
    });

    console.log("calculateHazardStats - Site stats:", siteStats);

    // Daily statistics (last 7 days atau sesuai filter, WITA)
    const dailyStats = [];
    const startDateStr = dateFrom || getDateWITARelative(-6);
    const endDateStr = dateTo || getTodayWITA();

    if (!dateFrom && !dateTo) {
      // Default: last 7 days
      for (let i = 6; i >= 0; i--) {
        const dateStr = getDateWITARelative(-i);

        const dayData = filteredData.filter((item) => {
          const itemDate = new Date(item.created_at)
            .toISOString()
            .split("T")[0];
          return itemDate === dateStr;
        });
        dailyStats.push({
          date: dateStr,
          total: dayData.length,
          submit: dayData.filter(
            (item) => item.status?.toLowerCase() === "submit"
          ).length,
          open: dayData.filter((item) => item.status?.toLowerCase() === "open")
            .length,
          progress: dayData.filter(
            (item) => item.status?.toLowerCase() === "progress"
          ).length,
          done: dayData.filter((item) => item.status?.toLowerCase() === "done")
            .length,
          rejectOpen: dayData.filter(
            (item) => item.status?.toLowerCase() === "reject at open"
          ).length,
          rejectDone: dayData.filter(
            (item) => item.status?.toLowerCase() === "reject at done"
          ).length,
          closed: dayData.filter(
            (item) => item.status?.toLowerCase() === "closed"
          ).length,
        });
      }
    } else {
      // Custom date range
      let currentDate = new Date(startDateStr + "T12:00:00+08:00");
      const endDate = new Date(endDateStr + "T12:00:00+08:00");
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().slice(0, 10);

        const dayData = filteredData.filter((item) => {
          const itemDate = new Date(item.created_at)
            .toISOString()
            .split("T")[0];
          return itemDate === dateStr;
        });
        dailyStats.push({
          date: dateStr,
          total: dayData.length,
          submit: dayData.filter(
            (item) => item.status?.toLowerCase() === "submit"
          ).length,
          open: dayData.filter((item) => item.status?.toLowerCase() === "open")
            .length,
          progress: dayData.filter(
            (item) => item.status?.toLowerCase() === "progress"
          ).length,
          done: dayData.filter((item) => item.status?.toLowerCase() === "done")
            .length,
          rejectOpen: dayData.filter(
            (item) => item.status?.toLowerCase() === "reject at open"
          ).length,
          rejectDone: dayData.filter(
            (item) => item.status?.toLowerCase() === "reject at done"
          ).length,
          closed: dayData.filter(
            (item) => item.status?.toLowerCase() === "closed"
          ).length,
        });

        currentDate.setTime(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    console.log("calculateHazardStats - Daily stats:", dailyStats);

    // Recent reports (last 10)
    const recentReports = filteredData
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    // Semua data (untuk download/analisa lengkap)
    const listData = [...filteredData].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    console.log("calculateHazardStats - Recent reports:", recentReports);

    const result = {
      totalReports,
      submitReports,
      openReports,
      progressReports,
      doneReports,
      rejectOpenReports,
      rejectDoneReports,
      closedReports,
      completionRate,
      closedOnTime,
      overdueReports,
      closedOverdue,
      siteStats,
      dailyStats,
      recentReports,
      listData,
    };

    console.log("calculateHazardStats - Final result:", result);
    return result;
  };

  // Calculate PTO Statistics
  const calculatePtoStats = (data) => {
    let filteredData = [...data];

    if (dateFrom) {
      filteredData = filteredData.filter((item) => item.tanggal >= dateFrom);
    }
    if (dateTo) {
      filteredData = filteredData.filter((item) => item.tanggal <= dateTo);
    }
    if (site) {
      filteredData = filteredData.filter((item) => item.site === site);
    }

    const totalReports = filteredData.length;
    const pendingReports = filteredData.filter(
      (item) => (item.status || "").toLowerCase() === "pending"
    ).length;
    const closedReports = filteredData.filter(
      (item) => (item.status || "").toLowerCase() === "closed"
    ).length;
    const completionRate =
      totalReports > 0 ? ((closedReports / totalReports) * 100).toFixed(1) : 0;

    // Site statistics
    const siteStats = {};
    filteredData.forEach((item) => {
      const siteName = item.site || "Unknown";
      if (!siteStats[siteName]) {
        siteStats[siteName] = { total: 0, pending: 0, closed: 0 };
      }
      siteStats[siteName].total++;
      if ((item.status || "").toLowerCase() === "pending")
        siteStats[siteName].pending++;
      if ((item.status || "").toLowerCase() === "closed")
        siteStats[siteName].closed++;
    });

    // Daily statistics
    const dailyStats = [];
    const startDateStr = dateFrom || getDateWITARelative(-6);
    const endDateStr = dateTo || getTodayWITA();

    if (!dateFrom && !dateTo) {
      for (let i = 6; i >= 0; i--) {
        const dateStr = getDateWITARelative(-i);
        const dayData = filteredData.filter((item) => item.tanggal === dateStr);
        dailyStats.push({
          date: dateStr,
          total: dayData.length,
          pending: dayData.filter(
            (item) => (item.status || "").toLowerCase() === "pending"
          ).length,
          closed: dayData.filter(
            (item) => (item.status || "").toLowerCase() === "closed"
          ).length,
        });
      }
    } else {
      let currentDate = new Date(startDateStr + "T12:00:00+08:00");
      const endDate = new Date(endDateStr + "T12:00:00+08:00");
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        const dayData = filteredData.filter((item) => item.tanggal === dateStr);
        dailyStats.push({
          date: dateStr,
          total: dayData.length,
          pending: dayData.filter(
            (item) => (item.status || "").toLowerCase() === "pending"
          ).length,
          closed: dayData.filter(
            (item) => (item.status || "").toLowerCase() === "closed"
          ).length,
        });
        currentDate.setTime(currentDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    const recentReports = filteredData
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 10);

    const listData = [...filteredData].sort(
      (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
    );

    return {
      totalReports,
      pendingReports,
      closedReports,
      completionRate,
      siteStats,
      dailyStats,
      recentReports,
      listData,
    };
  };

  // Set default table and fetch data based on subMenu
  useEffect(() => {
    console.log("MonitoringPage - subMenu:", subMenu);
    if (subMenu === "Statistik Fit To Work") {
      console.log(
        "MonitoringPage - Setting selectedTable to fit_to_work_stats"
      );
      setSelectedTable("fit_to_work_stats");
      // Fetch data immediately with delay to ensure state is set
      setTimeout(() => {
        fetchFitToWorkStats();
      }, 100);
    } else if (subMenu === "Take 5") {
      console.log("MonitoringPage - Setting selectedTable to take_5_stats");
      setSelectedTable("take_5_stats");
      // Fetch data immediately with delay to ensure state is set
      setTimeout(() => {
        fetchTake5Stats();
      }, 100);
    } else if (subMenu === "Hazard") {
      console.log("MonitoringPage - Setting selectedTable to hazard_stats");
      setSelectedTable("hazard_stats");
      // Fetch data immediately with delay to ensure state is set
      setTimeout(() => {
        fetchHazardStats();
      }, 100);
    } else if (subMenu === "PTO") {
      console.log("MonitoringPage - Setting selectedTable to pto_stats");
      setSelectedTable("pto_stats");
      setTimeout(() => {
        fetchPtoStats();
      }, 100);
    }
  }, [subMenu]);

  // Fetch data dari Supabase sesuai filter (for other tables)
  useEffect(() => {
    console.log("MonitoringPage - selectedTable:", selectedTable);
    if (!selectedTable || selectedTable === "fit_to_work_stats" || selectedTable === "take_5_stats" || selectedTable === "hazard_stats" || selectedTable === "pto_stats") {
      return; // Skip for stats dashboards - they have their own fetch
    }

    setLoading(true);
    let query = supabase.from(selectedTable).select("*");
    if (dateFrom) query = query.gte("tanggal", dateFrom);
    if (dateTo) query = query.lte("tanggal", dateTo);
    if (site) query = query.eq("site", site).or(`lokasi.eq.${site}`); // support site/lokasi
    if (nama) {
      if (selectedTable === "tasklist") {
        query = query.or(
          `pic_nama.eq.${nama},pelapor_nama.eq.${nama},evaluator_nama.eq.${nama}`
        );
      } else if (selectedTable === "fit_to_work") {
        query = query.eq("nama", nama);
      } else if (selectedTable === "take_5") {
        query = query.eq("pic", nama);
      }
    }
    if (status) query = query.eq("status", status);
    query.then(({ data, error }) => {
      setLoading(false);
      if (error) {
        setData([]);
        return;
      }
      setData(data || []);
    });
  }, [selectedTable, dateFrom, dateTo, site, nama, status]);

  // Kolom tabel per jenis data
  const columns =
    selectedTable === "fit_to_work"
      ? ["tanggal", "site", "nama", "status_fatigue", "workflow_status"]
      : selectedTable === "take_5"
        ? ["tanggal", "site", "pic", "status"]
        : [
            "tanggal",
            "site",
            "pic_nama",
            "pelapor_nama",
            "evaluator_nama",
            "status",
          ];

  // Handler download Excel
  function handleDownloadExcel() {
    if (!selectedTable || !data || data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedTable);
    XLSX.writeFile(
      workbook,
      `${selectedTable}_${getTodayWITA()}.xlsx`
    );
  }

  // Download Fit To Work Statistics as Excel
  function handleDownloadFitToWorkExcel() {
    if (!fitToWorkStats) return;

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      { Metric: "Total Submissions", Value: fitToWorkStats.totalSubmissions },
      { Metric: "Fit To Work", Value: fitToWorkStats.fitToWork },
      { Metric: "Not Fit To Work (saat ini)", Value: fitToWorkStats.notFitToWork },
      { Metric: "Awalnya Not Fit To Work", Value: fitToWorkStats.initialNotFitToWork ?? 0 },
      { Metric: "Berubah jadi Fit To Work", Value: fitToWorkStats.improvedToFit ?? 0 },
      {
        Metric: "Persentase Karyawan Fit",
        Value: `${fitToWorkStats.fitToWorkPercentage}%`,
      },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Site Statistics sheet
    if (fitToWorkStats.siteStats && fitToWorkStats.siteStats.length > 0) {
      const siteSheet = XLSX.utils.json_to_sheet(fitToWorkStats.siteStats);
      XLSX.utils.book_append_sheet(workbook, siteSheet, "Site Statistics");
    }

    // Daily Statistics sheet
    if (fitToWorkStats.dailyStats && fitToWorkStats.dailyStats.length > 0) {
      const dailySheet = XLSX.utils.json_to_sheet(fitToWorkStats.dailyStats);
      XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Statistics");
    }

    // Status Changes sheet
    if (
      fitToWorkStats.statusChanges &&
      fitToWorkStats.statusChanges.length > 0
    ) {
      const changesData = fitToWorkStats.statusChanges.map((change) => ({
        Nama: change.nama,
        Site: change.site,
        Tanggal: new Date(change.tanggal).toLocaleDateString("id-ID"),
        "Status Awal": change.initialStatus || change.finalStatus,
        "Status Saat ini": change.finalStatus,
      }));
      const changesSheet = XLSX.utils.json_to_sheet(changesData);
      XLSX.utils.book_append_sheet(workbook, changesSheet, "Status Changes");
    }

    // Data Lengkap - Semua data mentah untuk analisa mendalam (tanpa id, user_id)
    if (fitToWorkStats.listData && fitToWorkStats.listData.length > 0) {
      const rawData = fitToWorkStats.listData.map(({ id, user_id, ...rest }) => rest);
      const rawSheet = XLSX.utils.json_to_sheet(rawData);
      XLSX.utils.book_append_sheet(workbook, rawSheet, "Data Lengkap");
    }

    XLSX.writeFile(
      workbook,
      `Fit_To_Work_Statistics_${getTodayWITA()}.xlsx`
    );
  }

  // Download Fit To Work Statistics as PDF
  function handleDownloadFitToWorkPDF() {
    if (!fitToWorkStats) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Dashboard Statistik Fit To Work", 20, yPos);
    yPos += 20;

    // Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan:", 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Submissions: ${fitToWorkStats.totalSubmissions}`, 20, yPos);
    yPos += 8;
    doc.text(`Fit To Work: ${fitToWorkStats.fitToWork}`, 20, yPos);
    yPos += 8;
    doc.text(`Not Fit To Work (saat ini): ${fitToWorkStats.notFitToWork}`, 20, yPos);
    yPos += 8;
    doc.text(`Awalnya Not Fit To Work: ${fitToWorkStats.initialNotFitToWork ?? 0}`, 20, yPos);
    yPos += 8;
    doc.text(`Berubah jadi Fit To Work: ${fitToWorkStats.improvedToFit ?? 0}`, 20, yPos);
    yPos += 8;
    doc.text(
      `Persentase Karyawan Fit: ${fitToWorkStats.fitToWorkPercentage}%`,
      20,
      yPos
    );
    yPos += 15;

    // Site Statistics Table
    if (Object.keys(fitToWorkStats.siteStats).length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistik per Site:", 20, yPos);
      yPos += 10;

      const siteData = Object.entries(fitToWorkStats.siteStats).map(
        ([site, stats]) => [
          site,
          stats.total.toString(),
          stats.fitToWork.toString(),
          stats.notFitToWork.toString(),
          `${
            stats.total > 0
              ? ((stats.fitToWork / stats.total) * 100).toFixed(1)
              : 0
          }%`,
        ]
      );

      autoTable(doc, {
        startY: yPos,
        head: [
          ["Site", "Total", "Fit To Work", "Not Fit To Work", "Persentase Fit"],
        ],
        body: siteData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Daily Statistics Table
    if (fitToWorkStats.dailyStats.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistik Harian:", 20, yPos);
      yPos += 10;

      const dailyData = fitToWorkStats.dailyStats.map((day) => [
        new Date(day.date).toLocaleDateString("id-ID"),
        day.total.toString(),
        day.fitToWork.toString(),
        day.notFitToWork.toString(),
        `${
          day.total > 0 ? ((day.fitToWork / day.total) * 100).toFixed(1) : 0
        }%`,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [
          [
            "Tanggal",
            "Total",
            "Fit To Work",
            "Not Fit To Work",
            "Persentase Fit",
          ],
        ],
        body: dailyData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Status Changes Table
    if (fitToWorkStats.statusChanges.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Perubahan Status:", 20, yPos);
      yPos += 10;

      const statusData = fitToWorkStats.statusChanges.map((change) => [
        change.nama,
        change.site,
        new Date(change.tanggal).toLocaleDateString("id-ID"),
        change.initialStatus && change.initialStatus !== change.finalStatus
          ? `${change.initialStatus} → ${change.finalStatus}`
          : change.finalStatus,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Nama", "Site", "Tanggal", "Status (Awal → Saat ini)"]],
        body: statusData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save("statistik-fit-to-work.pdf");
  }

  // Download Take 5 Excel
  function handleDownloadTake5Excel() {
    if (!take5Stats) return;

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Metrik", "Nilai"],
      ["Total Laporan", take5Stats.totalReports],
      ["Laporan Terbuka", take5Stats.openReports],
      ["Laporan Selesai", take5Stats.doneReports],
      ["Laporan Tertutup", take5Stats.closedReports],
      ["Tingkat Penyelesaian", `${take5Stats.completionRate}%`],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Site Statistics sheet
    if (Object.keys(take5Stats.siteStats).length > 0) {
      const siteData = [
        ["Site", "Total", "Terbuka", "Selesai", "Tertutup"],
        ...Object.entries(take5Stats.siteStats).map(([site, stats]) => [
          site,
          stats.total,
          stats.open,
          stats.done,
          stats.closed,
        ]),
      ];
      const siteSheet = XLSX.utils.aoa_to_sheet(siteData);
      XLSX.utils.book_append_sheet(workbook, siteSheet, "Site Statistics");
    }

    // Daily Statistics sheet
    if (take5Stats.dailyStats.length > 0) {
      const dailyData = [
        ["Tanggal", "Total", "Terbuka", "Selesai", "Tertutup"],
        ...take5Stats.dailyStats.map((day) => [
          new Date(day.date).toLocaleDateString("id-ID"),
          day.total,
          day.open,
          day.done,
          day.closed,
        ]),
      ];
      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Statistics");
    }

    // Data Lengkap - Semua data mentah untuk analisa mendalam (tanpa id, user_id)
    if (take5Stats.listData && take5Stats.listData.length > 0) {
      const rawData = take5Stats.listData.map(({ id, user_id, ...rest }) => rest);
      const rawSheet = XLSX.utils.json_to_sheet(rawData);
      XLSX.utils.book_append_sheet(workbook, rawSheet, "Data Lengkap");
    }

    XLSX.writeFile(workbook, "statistik-take5.xlsx");
  }

  // Download Take 5 PDF
  function handleDownloadTake5PDF() {
    if (!take5Stats) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Dashboard Statistik Take 5", 20, yPos);
    yPos += 20;

    // Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan:", 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Laporan: ${take5Stats.totalReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Laporan Terbuka: ${take5Stats.openReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Laporan Selesai: ${take5Stats.doneReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Laporan Tertutup: ${take5Stats.closedReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Tingkat Penyelesaian: ${take5Stats.completionRate}%`, 20, yPos);
    yPos += 15;

    // Site Statistics Table
    if (Object.keys(take5Stats.siteStats).length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistik per Site:", 20, yPos);
      yPos += 10;

      const siteData = Object.entries(take5Stats.siteStats).map(
        ([site, stats]) => [
          site,
          stats.total.toString(),
          stats.open.toString(),
          stats.done.toString(),
          stats.closed.toString(),
        ]
      );

      autoTable(doc, {
        startY: yPos,
        head: [["Site", "Total", "Terbuka", "Selesai", "Tertutup"]],
        body: siteData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Daily Statistics Table
    if (take5Stats.dailyStats.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistik Harian:", 20, yPos);
      yPos += 10;

      const dailyData = take5Stats.dailyStats.map((day) => [
        new Date(day.date).toLocaleDateString("id-ID"),
        day.total.toString(),
        day.open.toString(),
        day.done.toString(),
        day.closed.toString(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Tanggal", "Total", "Terbuka", "Selesai", "Tertutup"]],
        body: dailyData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save("statistik-take5.pdf");
  }

  // Download PTO Excel
  function handleDownloadPtoExcel() {
    if (!ptoStats) return;

    const workbook = XLSX.utils.book_new();

    const summaryData = [
      ["Metrik", "Nilai"],
      ["Total Laporan", ptoStats.totalReports],
      ["Pending", ptoStats.pendingReports],
      ["Closed", ptoStats.closedReports],
      ["Tingkat Penyelesaian", `${ptoStats.completionRate}%`],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    if (Object.keys(ptoStats.siteStats || {}).length > 0) {
      const siteData = [
        ["Site", "Total", "Pending", "Closed"],
        ...Object.entries(ptoStats.siteStats).map(([s, st]) => [
          s,
          st.total,
          st.pending,
          st.closed,
        ]),
      ];
      const siteSheet = XLSX.utils.aoa_to_sheet(siteData);
      XLSX.utils.book_append_sheet(workbook, siteSheet, "Site Statistics");
    }

    if ((ptoStats.dailyStats || []).length > 0) {
      const dailyData = [
        ["Tanggal", "Total", "Pending", "Closed"],
        ...ptoStats.dailyStats.map((d) => [
          new Date(d.date).toLocaleDateString("id-ID"),
          d.total,
          d.pending,
          d.closed,
        ]),
      ];
      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Statistics");
    }

    if (ptoStats.listData && ptoStats.listData.length > 0) {
      const rawData = ptoStats.listData.map(({ id, observer_id, observee_id, observer_tambahan_id, pic_tindak_lanjut_id, created_by, prosedur_id, ...rest }) => rest);
      const rawSheet = XLSX.utils.json_to_sheet(rawData);
      XLSX.utils.book_append_sheet(workbook, rawSheet, "Data Lengkap");
    }

    XLSX.writeFile(workbook, `statistik-pto_${getTodayWITA()}.xlsx`);
  }

  // Download PTO PDF
  function handleDownloadPtoPdf() {
    if (!ptoStats) return;

    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Dashboard Statistik PTO", 20, yPos);
    yPos += 20;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan:", 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Laporan: ${ptoStats.totalReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Pending: ${ptoStats.pendingReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Closed: ${ptoStats.closedReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Tingkat Penyelesaian: ${ptoStats.completionRate}%`, 20, yPos);
    yPos += 15;

    if (Object.keys(ptoStats.siteStats || {}).length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistik per Site:", 20, yPos);
      yPos += 10;

      const siteData = Object.entries(ptoStats.siteStats).map(([s, st]) => [
        s,
        st.total.toString(),
        st.pending.toString(),
        st.closed.toString(),
      ]);
      autoTable(doc, {
        startY: yPos,
        head: [["Site", "Total", "Pending", "Closed"]],
        body: siteData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    if ((ptoStats.dailyStats || []).length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistik Harian:", 20, yPos);
      yPos += 10;

      const dailyData = ptoStats.dailyStats.map((d) => [
        new Date(d.date).toLocaleDateString("id-ID"),
        d.total.toString(),
        d.pending.toString(),
        d.closed.toString(),
      ]);
      autoTable(doc, {
        startY: yPos,
        head: [["Tanggal", "Total", "Pending", "Closed"]],
        body: dailyData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    doc.save("statistik-pto.pdf");
  }

  // Download Hazard Excel
  function handleDownloadHazardExcel() {
    if (!hazardStats) return;

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ["Metrik", "Nilai"],
      ["Total Laporan", hazardStats.totalReports],
      ["Submit", hazardStats.submitReports],
      ["Open", hazardStats.openReports],
      ["Progress", hazardStats.progressReports],
      ["Done", hazardStats.doneReports],
      ["Reject at Open", hazardStats.rejectOpenReports],
      ["Reject at Done", hazardStats.rejectDoneReports],
      ["Closed", hazardStats.closedReports],
      ["Tingkat Penyelesaian", `${hazardStats.completionRate}%`],
      ["", ""],
      ["STATISTIK KETEPATAN PENYELESAIAN", ""],
      ["Closed On Time", hazardStats.closedOnTime || 0],
      ["Overdue Reports", hazardStats.overdueReports || 0],
      ["Closed Overdue", hazardStats.closedOverdue || 0],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Site Statistics sheet
    if (Object.keys(hazardStats.siteStats).length > 0) {
      const siteData = [
        [
          "Site",
          "Total",
          "Submit",
          "Open",
          "Progress",
          "Done",
          "Reject Open",
          "Reject Done",
          "Closed",
        ],
        ...Object.entries(hazardStats.siteStats).map(([site, stats]) => [
          site,
          stats.total,
          stats.submit,
          stats.open,
          stats.progress,
          stats.done,
          stats.rejectOpen,
          stats.rejectDone,
          stats.closed,
        ]),
      ];
      const siteSheet = XLSX.utils.aoa_to_sheet(siteData);
      XLSX.utils.book_append_sheet(workbook, siteSheet, "Site Statistics");
    }

    // Daily Statistics sheet
    if (hazardStats.dailyStats.length > 0) {
      const dailyData = [
        [
          "Tanggal",
          "Total",
          "Submit",
          "Open",
          "Progress",
          "Done",
          "Reject Open",
          "Reject Done",
          "Closed",
        ],
        ...hazardStats.dailyStats.map((day) => [
          new Date(day.date).toLocaleDateString("id-ID"),
          day.total,
          day.submit,
          day.open,
          day.progress,
          day.done,
          day.rejectOpen,
          day.rejectDone,
          day.closed,
        ]),
      ];
      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Statistics");
    }

    // Data Lengkap - Semua data mentah untuk analisa mendalam (tanpa id, user_id)
    if (hazardStats.listData && hazardStats.listData.length > 0) {
      const rawData = hazardStats.listData.map(({ id, user_id, ...rest }) => rest);
      const rawSheet = XLSX.utils.json_to_sheet(rawData);
      XLSX.utils.book_append_sheet(workbook, rawSheet, "Data Lengkap");
    }

    XLSX.writeFile(workbook, "statistik-hazard.xlsx");
  }

  // Download Hazard PDF
  // Function to get image from Supabase storage
  const getImageFromStorage = async (imagePath) => {
    try {
      if (!imagePath) return null;

      const { data, error } = await supabase.storage
        .from("img-test")
        .download(imagePath);

      if (error) {
        console.error("Error downloading image:", error);
        return null;
      }

      return URL.createObjectURL(data);
    } catch (error) {
      console.error("Error getting image:", error);
      return null;
    }
  };

  async function handleDownloadHazardPDF(includeImages = false) {
    if (!hazardStats) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Dashboard Statistik Hazard", 20, yPos);
    yPos += 20;

    // Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan:", 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Laporan: ${hazardStats.totalReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Submit: ${hazardStats.submitReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Open: ${hazardStats.openReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Progress: ${hazardStats.progressReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Done: ${hazardStats.doneReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Reject at Open: ${hazardStats.rejectOpenReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Reject at Done: ${hazardStats.rejectDoneReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Closed: ${hazardStats.closedReports}`, 20, yPos);
    yPos += 8;
    doc.text(`Tingkat Penyelesaian: ${hazardStats.completionRate}%`, 20, yPos);
    yPos += 15;

    // Completion Accuracy Statistics
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Statistik Ketepatan Penyelesaian:", 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Closed On Time: ${hazardStats.closedOnTime || 0}`, 20, yPos);
    yPos += 8;
    doc.text(`Overdue Reports: ${hazardStats.overdueReports || 0}`, 20, yPos);
    yPos += 8;
    doc.text(`Closed Overdue: ${hazardStats.closedOverdue || 0}`, 20, yPos);
    yPos += 15;

    // Site Statistics Table
    if (Object.keys(hazardStats.siteStats).length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistik per Site:", 20, yPos);
      yPos += 10;

      const siteData = Object.entries(hazardStats.siteStats).map(
        ([site, stats]) => [
          site,
          stats.total.toString(),
          stats.submit.toString(),
          stats.open.toString(),
          stats.progress.toString(),
          stats.done.toString(),
          stats.rejectOpen.toString(),
          stats.rejectDone.toString(),
          stats.closed.toString(),
        ]
      );

      autoTable(doc, {
        startY: yPos,
        head: [
          [
            "Site",
            "Total",
            "Submit",
            "Open",
            "Progress",
            "Done",
            "Reject Open",
            "Reject Done",
            "Closed",
          ],
        ],
        body: siteData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Daily Statistics Table
    if (hazardStats.dailyStats.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistik Harian:", 20, yPos);
      yPos += 10;

      const dailyData = hazardStats.dailyStats.map((day) => [
        new Date(day.date).toLocaleDateString("id-ID"),
        day.total.toString(),
        day.submit.toString(),
        day.open.toString(),
        day.progress.toString(),
        day.done.toString(),
        day.rejectOpen.toString(),
        day.rejectDone.toString(),
        day.closed.toString(),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [
          [
            "Tanggal",
            "Total",
            "Submit",
            "Open",
            "Progress",
            "Done",
            "Reject Open",
            "Reject Done",
            "Closed",
          ],
        ],
        body: dailyData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    // Add section for attached images if available
    if (
      includeImages &&
      hazardStats.recentReports &&
      hazardStats.recentReports.length > 0
    ) {
      yPos = doc.lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Laporan Terbaru dengan Bukti:", 20, yPos);
      yPos += 10;

      let imageCount = 0;
      const maxImagesPerPage = 2; // Maximum images per page to avoid overcrowding

      for (const report of hazardStats.recentReports) {
        if (imageCount >= maxImagesPerPage) break;

        if (report.bukti_url || report.evidence_url) {
          try {
            const imageUrl = await getImageFromStorage(
              report.bukti_url || report.evidence_url
            );
            if (imageUrl) {
              // Add report info
              doc.setFontSize(10);
              doc.setFont("helvetica", "normal");
              doc.text(
                `Laporan: ${
                  report.deskripsi_temuan || report.deskripsi || "N/A"
                }`,
                20,
                yPos
              );
              yPos += 5;
              doc.text(`Site: ${report.lokasi || "N/A"}`, 20, yPos);
              yPos += 5;
              doc.text(`Status: ${report.status || "N/A"}`, 20, yPos);
              yPos += 8;

              // Add image (resize to fit)
              const img = new Image();
              img.src = imageUrl;

              await new Promise((resolve) => {
                img.onload = () => {
                  const imgWidth = 80;
                  const imgHeight = (img.height * imgWidth) / img.width;

                  // Check if we need a new page
                  if (yPos + imgHeight > 250) {
                    doc.addPage();
                    yPos = 20;
                  }

                  doc.addImage(img, "JPEG", 20, yPos, imgWidth, imgHeight);
                  yPos += imgHeight + 10;
                  imageCount++;
                  resolve();
                };
                img.onerror = () => {
                  doc.text("Gambar tidak dapat dimuat", 20, yPos);
                  yPos += 10;
                  resolve();
                };
              });
            }
          } catch (error) {
            console.error("Error adding image to PDF:", error);
            doc.text("Error loading image", 20, yPos);
            yPos += 10;
          }
        }
      }
    }

    doc.save("statistik-hazard.pdf");
  }

  // Tambahkan fungsi pewarnaan status
  function getStatusColor(status) {
    switch ((status || "").toLowerCase()) {
      case "fit to work":
        return "#22c55e"; // Hijau
      case "not fit to work":
        return "#ef4444"; // Merah
      case "pending":
        return "#f59e0b"; // Orange
      case "submit":
        return "#2563eb"; // Biru
      case "open":
        return "#dc2626"; // Merah
      case "progress":
        return "#facc15"; // Kuning
      case "done":
        return "#4ade80"; // Hijau Muda
      case "reject at open":
        return "#fb923c"; // Orange
      case "reject at done":
        return "#a16207"; // Coklat
      case "closed":
        return "#166534"; // Hijau Tua
      default:
        return "#232946";
    }
  }

  // Helper function for case-insensitive status matching
  const matchStatus = (itemStatus, targetStatus) => {
    return itemStatus?.toLowerCase() === targetStatus.toLowerCase();
  };

  // Calculate Individual Statistics
  const calculateIndividualStats = (data, type) => {
    const userStats = {};

    data.forEach((item) => {
      let userName = "Unknown";

      // Get user name based on dashboard type
      if (type === "fit_to_work") {
        userName = item.nama || "Unknown";
      } else if (type === "take_5") {
        userName = item.pelapor_nama || item.pic || "Unknown";
      } else if (type === "hazard") {
        userName = item.pelapor_nama || item.pic || "Unknown";
      } else if (type === "pto") {
        userName = item.nama_observer || "Unknown";
      }

      if (!userStats[userName]) {
        userStats[userName] = {
          name: userName,
          total: 0,
          // Hazard & Take 5 statuses
          submit: 0,
          open: 0,
          progress: 0,
          done: 0,
          closed: 0,
          rejectOpen: 0,
          rejectDone: 0,
          // Fit To Work specific
          fitToWork: 0,
          notFitToWork: 0,
          // PTO specific
          pending: 0,
          // Completion rate
          completionRate: 0,
        };
      }

      userStats[userName].total++;

      // Count by status based on dashboard type
      if (type === "fit_to_work") {
        if (item.status_fatigue === "Fit To Work")
          userStats[userName].fitToWork++;
        if (item.status_fatigue === "Not Fit To Work")
          userStats[userName].notFitToWork++;
      } else if (type === "pto") {
        const status = (item.status || "").toLowerCase();
        if (status === "pending") userStats[userName].pending++;
        if (status === "closed") userStats[userName].closed++;
      } else {
        // Hazard & Take 5 statuses
        const status = item.status?.toLowerCase();
        if (status === "submit") userStats[userName].submit++;
        if (status === "open") userStats[userName].open++;
        if (status === "progress") userStats[userName].progress++;
        if (status === "done") userStats[userName].done++;
        if (status === "closed") userStats[userName].closed++;
        if (status === "reject at open") userStats[userName].rejectOpen++;
        if (status === "reject at done") userStats[userName].rejectDone++;
      }
    });

    // Calculate completion rate per user
    Object.values(userStats).forEach((user) => {
      if (type === "fit_to_work") {
        user.completionRate =
          user.total > 0 ? ((user.fitToWork / user.total) * 100).toFixed(1) : 0;
      } else if (type === "pto") {
        user.completionRate =
          user.total > 0 ? ((user.closed / user.total) * 100).toFixed(1) : 0;
      } else {
        user.completionRate =
          user.total > 0 ? ((user.closed / user.total) * 100).toFixed(1) : 0;
      }
    });

    return Object.values(userStats).sort((a, b) => b.total - a.total);
  };

  // Render Fit To Work Statistics Dashboard
  const renderFitToWorkStats = () => {
    console.log("renderFitToWorkStats - called");
    console.log("renderFitToWorkStats - loading:", loading);
    console.log("renderFitToWorkStats - fitToWorkStats:", fitToWorkStats);

    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Memuat statistik Fit To Work...
        </div>
      );
    }

    return (
      <div style={{ padding: "0" }}>
        {/* Content Container - Centered */}
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Filter Panel - Fixed di atas layar browser, centered di area konten */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: isMobile ? 0 : 240,
              right: 0,
              zIndex: 100,
              background: "linear-gradient(135deg, #181c2f 0%, #232946 100%)",
              padding: "20px 0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "0 20px",
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#e5e7eb",
                  }}
                >
                  Dari:
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    height: 38,
                    boxSizing: "border-box",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    minWidth: "180px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#e5e7eb",
                  }}
                >
                  Sampai:
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    height: 38,
                    boxSizing: "border-box",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    minWidth: "180px",
                  }}
                />
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#e5e7eb",
                  }}
                >
                  Site:
                </label>
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    height: 38,
                    boxSizing: "border-box",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                    minWidth: "150px",
                  }}
                >
                  <option value="">Semua Site</option>
                  {CUSTOM_INPUT_SITES.map((siteOption) => (
                    <option key={siteOption} value={siteOption}>
                      {siteOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset & Download Buttons */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setSite("");
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  background: "#f8f9fa",
                  color: "#374151",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Reset Filter
              </button>
              <button
                onClick={handleDownloadFitToWorkExcel}
                disabled={!fitToWorkStats}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#10b981",
                  color: "#fff",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                📊 Excel
              </button>
              <button
                onClick={handleDownloadFitToWorkPDF}
                disabled={!fitToWorkStats}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                📄 PDF
              </button>
            </div>
            </div>
          </div>
          {/* Spacer agar konten tidak tertutup filter fixed */}
          <div style={{ height: 100 }} />
          {/* Header */}
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ color: "#ffffff", marginBottom: "10px" }}>
              📊 Dashboard Statistik Fit To Work
            </h2>
            <p style={{ color: "#ffffff", fontSize: "14px", opacity: 0.9 }}>
              Monitoring perbaikan status dari Not Fit To Work menjadi Fit To
              Work
              {fitToWorkStats.summaryDate && (
                <span style={{ display: "block", marginTop: 4, fontSize: 13 }}>
                  Data untuk {new Date(fitToWorkStats.summaryDate + "T12:00:00").toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </p>
          </div>

          {/* Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "30px",
            }}
          >
            {/* Total Submissions */}
            <div
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              }}
            >
              <div style={{ fontSize: "14px", opacity: 0.9 }}>
                Total Submissions
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  marginTop: "8px",
                }}
              >
                {fitToWorkStats.totalSubmissions}
              </div>
            </div>

            {/* Fit To Work */}
            <div
              style={{
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                color: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
              }}
            >
              <div style={{ fontSize: "14px", opacity: 0.9 }}>Fit To Work</div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  marginTop: "8px",
                }}
              >
                {fitToWorkStats.fitToWork}
              </div>
            </div>

            {/* Not Fit To Work (saat ini masih) */}
            <div
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
              }}
            >
              <div style={{ fontSize: "14px", opacity: 0.9 }}>
                Not Fit To Work (saat ini)
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  marginTop: "8px",
                }}
              >
                {fitToWorkStats.notFitToWork}
              </div>
            </div>

            {/* Awalnya Not Fit To Work */}
            <div
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
              }}
            >
              <div style={{ fontSize: "14px", opacity: 0.9 }}>
                Awalnya Not Fit To Work
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  marginTop: "8px",
                }}
              >
                {fitToWorkStats.initialNotFitToWork ?? 0}
              </div>
            </div>

            {/* Berubah jadi Fit To Work */}
            <div
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                color: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
              }}
            >
              <div style={{ fontSize: "14px", opacity: 0.9 }}>
                Berubah jadi Fit To Work
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  marginTop: "8px",
                }}
              >
                {fitToWorkStats.improvedToFit ?? 0}
              </div>
            </div>

            {/* Persentase Karyawan Fit */}
            <div
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                color: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
              }}
            >
              <div style={{ fontSize: "14px", opacity: 0.9 }}>
                Persentase Karyawan Fit
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  marginTop: "8px",
                }}
              >
                {fitToWorkStats.fitToWorkPercentage}%
              </div>
              <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
                {fitToWorkStats.fitToWork} dari{" "}
                {fitToWorkStats.totalSubmissions} karyawan
              </div>
            </div>
          </div>

          {/* Site Statistics */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ color: "#ffffff", marginBottom: "20px" }}>
              📈 Statistik per Site {site && `- ${site}`}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              {Object.entries(fitToWorkStats.siteStats).map(
                ([siteName, stats]) => (
                  <div
                    key={siteName}
                    style={{
                      background: "white",
                      padding: "20px",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <h4 style={{ color: "#1a1a1a", marginBottom: "15px" }}>
                      {siteName}
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "12px", color: "#333" }}>
                          Total
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#1a1a1a",
                          }}
                        >
                          {stats.total}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#333" }}>
                          Fit To Work
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#22c55e",
                          }}
                        >
                          {stats.fitToWork}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#333" }}>
                          Not Fit (saat ini)
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#ef4444",
                          }}
                        >
                          {stats.notFitToWork}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#333" }}>
                          Awal Not Fit
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#f59e0b",
                          }}
                        >
                          {stats.initialNotFit ?? 0}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#333" }}>
                          Jadi Fit
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#06b6d4",
                          }}
                        >
                          {stats.improvedToFit ?? 0}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#333" }}>
                          Persentase Fit
                        </div>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#8b5cf6",
                          }}
                        >
                          {stats.total > 0
                            ? ((stats.fitToWork / stats.total) * 100).toFixed(1)
                            : 0}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Daily Statistics */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ color: "#ffffff", marginBottom: "20px" }}>
              📅 Statistik{" "}
              {dateFrom && dateTo
                ? `${dateFrom} s/d ${dateTo}`
                : "7 Hari Terakhir"}
            </h3>
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        color: "#1a1a1a",
                        fontWeight: "bold",
                      }}
                    >
                      Tanggal
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#1a1a1a",
                        fontWeight: "bold",
                      }}
                    >
                      Kewajiban
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#3b82f6",
                        fontWeight: "bold",
                      }}
                    >
                      Pengisian
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#0ea5e9",
                        fontWeight: "bold",
                      }}
                    >
                      % Pengisian
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#22c55e",
                        fontWeight: "bold",
                      }}
                    >
                      Fit To Work
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#ef4444",
                        fontWeight: "bold",
                      }}
                    >
                      Not Fit (saat ini)
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#f59e0b",
                        fontWeight: "bold",
                      }}
                    >
                      Awal Not Fit
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#06b6d4",
                        fontWeight: "bold",
                      }}
                    >
                      Jadi Fit
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#8b5cf6",
                        fontWeight: "bold",
                      }}
                    >
                      Persentase Fit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fitToWorkStats.dailyStats.map((day, index) => (
                    <tr
                      key={day.date}
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                    >
                      <td style={{ padding: "12px", color: "#1a1a1a" }}>
                        {new Date(day.date).toLocaleDateString("id-ID", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color: "#1a1a1a",
                          fontWeight: "bold",
                        }}
                      >
                        {day.kewajiban ?? "-"}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color: "#3b82f6",
                          fontWeight: "bold",
                        }}
                      >
                        {day.pengisian ?? day.total ?? 0}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color: "#0ea5e9",
                          fontWeight: "bold",
                        }}
                      >
                        {day.persentasePengisian != null ? `${day.persentasePengisian}%` : "-"}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color: "#22c55e",
                          fontWeight: "bold",
                        }}
                      >
                        {day.fitToWork}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color: "#ef4444",
                          fontWeight: "bold",
                        }}
                      >
                        {day.notFitToWork}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color: "#f59e0b",
                          fontWeight: "bold",
                        }}
                      >
                        {day.initialNotFit ?? 0}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color: "#06b6d4",
                          fontWeight: "bold",
                        }}
                      >
                        {day.improvedToFit ?? 0}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color: "#8b5cf6",
                          fontWeight: "bold",
                        }}
                      >
                        {(day.pengisian ?? day.total) > 0
                          ? ((day.fitToWork / (day.pengisian ?? day.total)) * 100).toFixed(1)
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pie Chart & Bar Chart - Bersebelahan (filter mempengaruhi keduanya) */}
              {fitToWorkStats.dailyStats.length > 0 && (
                <div style={{ marginTop: "24px", display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
                  {/* Pie Chart - mengikuti filter Harian/Bulanan/Tahunan */}
                  {(() => {
                    let totalFit = 0, totalNotFit = 0;
                    if (chartViewMode === "daily" || chartAggregatedData.length === 0) {
                      totalFit = fitToWorkStats.dailyStats.reduce((s, d) => s + (d.fitToWork ?? 0), 0);
                      totalNotFit = fitToWorkStats.dailyStats.reduce((s, d) => s + (d.notFitToWork ?? 0), 0);
                    } else {
                      totalFit = chartAggregatedData.reduce((s, d) => s + (d.fitToWork ?? 0), 0);
                      totalNotFit = chartAggregatedData.reduce((s, d) => s + (d.notFitToWork ?? 0), 0);
                    }
                    const pieData = [
                      { name: "Fit To Work", value: totalFit, color: "#22c55e" },
                      { name: "Not Fit To Work", value: totalNotFit, color: "#ef4444" },
                    ].filter((d) => d.value > 0);
                    return pieData.length > 0 ? (
                      <div style={{ flex: "1 1 280px", minWidth: 280, maxWidth: 400, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <h4 style={{ marginBottom: "4px", color: "#1a1a1a", fontSize: "14px" }}>
                          Perbandingan Fit To Work vs Not Fit To Work
                        </h4>
                        <span style={{ marginBottom: "12px", color: "#6b7280", fontSize: "12px" }}>
                          {chartViewMode === "daily" && "(7 Hari)"}
                          {chartViewMode === "monthly" && chartAggregatedData.length > 0 && "(12 Bulan)"}
                          {chartViewMode === "yearly" && chartAggregatedData.length > 0 && "(5 Tahun)"}
                        </span>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {pieData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => [v, ""]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : null;
                  })()}

                  {/* Bar Chart - Kewajiban vs Pengisian */}
                  <div style={{ flex: "1 1 400px", minWidth: 400, height: "360px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <h4 style={{ margin: 0, color: "#1a1a1a", fontSize: "14px" }}>
                      Grafik Kewajiban vs Pengisian
                      {chartViewMode === "daily" && " (7 Hari)"}
                      {chartViewMode === "monthly" && " (12 Bulan)"}
                      {chartViewMode === "yearly" && " (5 Tahun)"}
                    </h4>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {["daily", "monthly", "yearly"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setChartViewMode(m)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: chartViewMode === m ? "2px solid #3b82f6" : "1px solid #d1d5db",
                            background: chartViewMode === m ? "#eff6ff" : "#fff",
                            color: chartViewMode === m ? "#1d4ed8" : "#374151",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          {m === "daily" && "Harian"}
                          {m === "monthly" && "Bulanan"}
                          {m === "yearly" && "Tahunan"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={
                        chartViewMode === "daily"
                          ? fitToWorkStats.dailyStats.map((d) => ({
                              tanggal: new Date(d.date + "T12:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
                              Kewajiban: d.kewajiban ?? 0,
                              Pengisian: d.pengisian ?? d.total ?? 0,
                            }))
                          : chartAggregatedData.map((d) => ({
                              tanggal: d.label ?? "-",
                              Kewajiban: d.kewajiban ?? 0,
                              Pengisian: d.pengisian ?? 0,
                            }))
                      }
                      margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="tanggal" tick={{ fontSize: 12 }} height={40} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Kewajiban" fill="#6b7280" name="Kewajiban" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pengisian" fill="#3b82f6" name="Pengisian" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {chartViewMode !== "daily" && chartAggregatedData.length === 0 && (
                    <div style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", marginTop: "8px" }}>
                      Memuat data...
                    </div>
                  )}
                </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabel Data Fit To Work - All-time, pagination, Status Awal & Akhir */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ color: "#ffffff", marginBottom: "20px" }}>
              📋 Data Pengisian Fit To Work
            </h3>
            <div
              style={{
                background: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
                overflowX: "auto",
              }}
            >
              {(fitToWorkStats.listData || []).length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#666",
                    padding: "40px",
                  }}
                >
                  Belum ada data pengisian Fit To Work
                </div>
              ) : (
                <>
                  {/* Pagination controls - atas */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", color: "#374151" }}>
                        Tampilkan
                      </span>
                      <select
                        value={fitToWorkTablePageSize}
                        onChange={(e) => {
                          setFitToWorkTablePageSize(Number(e.target.value));
                          setFitToWorkTablePage(0);
                        }}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          fontSize: "13px",
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span style={{ fontSize: "13px", color: "#374151" }}>
                        data
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      {fitToWorkStats.listData.length} total data
                    </div>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                        <th style={{ textAlign: "left", padding: "12px", color: "#1a1a1a", fontWeight: "bold" }}>
                          Tanggal Input
                        </th>
                        <th style={{ textAlign: "left", padding: "12px", color: "#1a1a1a", fontWeight: "bold" }}>
                          Nama Pekerja
                        </th>
                        <th style={{ textAlign: "left", padding: "12px", color: "#1a1a1a", fontWeight: "bold" }}>
                          NRP Pekerja
                        </th>
                        <th style={{ textAlign: "left", padding: "12px", color: "#1a1a1a", fontWeight: "bold" }}>
                          Jabatan
                        </th>
                        <th style={{ textAlign: "left", padding: "12px", color: "#1a1a1a", fontWeight: "bold" }}>
                          Site
                        </th>
                        <th style={{ textAlign: "left", padding: "12px", color: "#1a1a1a", fontWeight: "bold" }}>
                          Jumlah Jam Tidur
                        </th>
                        <th style={{ textAlign: "center", padding: "12px", color: "#1a1a1a", fontWeight: "bold" }}>
                          Status Awal
                        </th>
                        <th style={{ textAlign: "center", padding: "12px", color: "#1a1a1a", fontWeight: "bold" }}>
                          Status Akhir
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(fitToWorkStats.listData || [])
                        .slice(
                          fitToWorkTablePage * fitToWorkTablePageSize,
                          fitToWorkTablePage * fitToWorkTablePageSize + fitToWorkTablePageSize
                        )
                        .map((row, index) => {
                          const statusAwal = row.initial_status_fatigue || row.status_fatigue || "-";
                          const statusAkhir = row.status_fatigue || "-";
                          return (
                            <tr
                              key={row.id || index}
                              style={{ borderBottom: "1px solid #e5e7eb" }}
                            >
                              <td style={{ padding: "12px", color: "#1a1a1a" }}>
                                {row.tanggal
                                  ? new Date(row.tanggal + "T12:00:00").toLocaleDateString("id-ID")
                                  : "-"}
                              </td>
                              <td style={{ padding: "12px", color: "#1a1a1a" }}>{row.nama || "-"}</td>
                              <td style={{ padding: "12px", color: "#1a1a1a" }}>{row.nrp || "-"}</td>
                              <td style={{ padding: "12px", color: "#1a1a1a" }}>{row.jabatan || "-"}</td>
                              <td style={{ padding: "12px", color: "#1a1a1a" }}>{row.site || "-"}</td>
                              <td style={{ padding: "12px", color: "#1a1a1a" }}>
                                {row.total_jam_tidur != null
                                  ? `${Math.floor(row.total_jam_tidur)} jam`
                                  : row.jam_tidur || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "12px",
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  color: statusAwal === "Fit To Work" ? "#166534" : "#dc2626",
                                }}
                              >
                                {statusAwal}
                              </td>
                              <td
                                style={{
                                  padding: "12px",
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  color: statusAkhir === "Fit To Work" ? "#166534" : "#dc2626",
                                }}
                              >
                                {statusAkhir}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {/* Pagination - next/prev */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "16px",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      Menampilkan{" "}
                      {fitToWorkStats.listData.length === 0
                        ? 0
                        : fitToWorkTablePage * fitToWorkTablePageSize + 1}{" "}
                      -{" "}
                      {Math.min(
                        (fitToWorkTablePage + 1) * fitToWorkTablePageSize,
                        fitToWorkStats.listData.length
                      )}{" "}
                      dari {fitToWorkStats.listData.length}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => setFitToWorkTablePage((p) => Math.max(0, p - 1))}
                        disabled={fitToWorkTablePage === 0}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background: fitToWorkTablePage === 0 ? "#f3f4f6" : "#fff",
                          color: fitToWorkTablePage === 0 ? "#9ca3af" : "#374151",
                          cursor: fitToWorkTablePage === 0 ? "not-allowed" : "pointer",
                          fontSize: "13px",
                        }}
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFitToWorkTablePage((p) =>
                            p + 1 < Math.ceil(fitToWorkStats.listData.length / fitToWorkTablePageSize)
                              ? p + 1
                              : p
                          )
                        }
                        disabled={
                          fitToWorkTablePage + 1 >=
                          Math.ceil(fitToWorkStats.listData.length / fitToWorkTablePageSize)
                        }
                        style={{
                          padding: "6px 14px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          background:
                            fitToWorkTablePage + 1 >=
                            Math.ceil(fitToWorkStats.listData.length / fitToWorkTablePageSize)
                              ? "#f3f4f6"
                              : "#fff",
                          color:
                            fitToWorkTablePage + 1 >=
                            Math.ceil(fitToWorkStats.listData.length / fitToWorkTablePageSize)
                              ? "#9ca3af"
                              : "#374151",
                          cursor:
                            fitToWorkTablePage + 1 >=
                            Math.ceil(fitToWorkStats.listData.length / fitToWorkTablePageSize)
                              ? "not-allowed"
                              : "pointer",
                          fontSize: "13px",
                        }}
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Take 5 Statistics Dashboard
  const renderTake5Stats = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Memuat statistik Take 5...
        </div>
      );
    }

    return (
      <div style={{ padding: "0" }}>
        {/* Content Container - Centered (lebar sama dengan Fit To Work) */}
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Filter Panel - Fixed di atas layar browser, centered di area konten */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: isMobile ? 0 : 240,
              right: 0,
              zIndex: 100,
              background: "linear-gradient(135deg, #181c2f 0%, #232946 100%)",
              padding: "20px 0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "0 20px",
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#e5e7eb",
                }}
              >
                Dari:
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: "8px 12px",
                  height: 38,
                  boxSizing: "border-box",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  minWidth: "180px",
                }}
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#e5e7eb",
                }}
              >
                Sampai:
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: "8px 12px",
                  height: 38,
                  boxSizing: "border-box",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  minWidth: "180px",
                }}
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#e5e7eb",
                }}
              >
                Site:
              </label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                style={{
                  padding: "8px 12px",
                  height: 38,
                  boxSizing: "border-box",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  minWidth: "150px",
                }}
              >
                <option value="">Semua Site</option>
                {CUSTOM_INPUT_SITES.map((siteOption) => (
                  <option key={siteOption} value={siteOption}>
                    {siteOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset & Download Buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setSite("");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                background: "#f8f9fa",
                color: "#374151",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Reset Filter
            </button>
            <button
              onClick={handleDownloadTake5Excel}
              disabled={!take5Stats}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "#10b981",
                color: "#fff",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📊 Excel
            </button>
            <button
              onClick={handleDownloadTake5PDF}
              disabled={!take5Stats}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "#ef4444",
                color: "#fff",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📄 PDF
            </button>
          </div>
          </div>
        </div>
        {/* Spacer agar konten tidak tertutup filter fixed */}
        <div style={{ height: 100 }} />
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#ffffff", marginBottom: "10px" }}>
            📊 Dashboard Statistik Take 5
          </h2>
          <p style={{ color: "#ffffff", fontSize: "14px", opacity: 0.9 }}>
            Monitoring pelaporan Take 5 dan status penyelesaian
          </p>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          {/* Total Reports */}
          <div
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Total Laporan</div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {take5Stats.totalReports}
            </div>
          </div>

          {/* Open Reports */}
          <div
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              Laporan Terbuka
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {take5Stats.openReports}
            </div>
          </div>

          {/* Done Reports */}
          <div
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              Laporan Selesai
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {take5Stats.doneReports}
            </div>
          </div>

          {/* Completion Rate */}
          <div
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              Tingkat Penyelesaian
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {take5Stats.completionRate}%
            </div>
          </div>
        </div>

        {/* Site Statistics */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#ffffff", marginBottom: "20px", fontWeight: "600" }}>
            📈 Statistik per Site {site && `- ${site}`}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            {Object.entries(take5Stats.siteStats).map(([siteName, stats]) => (
              <div
                key={siteName}
                style={{
                  background: "white",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h4 style={{ color: "#232946", marginBottom: "15px" }}>
                  {siteName}
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total</div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#232946",
                      }}
                    >
                      {stats.total}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Terbuka
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#f59e0b",
                      }}
                    >
                      {stats.open}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Selesai
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#10b981",
                      }}
                    >
                      {stats.done}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Tertutup
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#6b7280",
                      }}
                    >
                      {stats.closed}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Statistics */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#ffffff", marginBottom: "20px", fontWeight: "600" }}>
            📅 Statistik{" "}
            {dateFrom && dateTo
              ? `${dateFrom} s/d ${dateTo}`
              : "7 Hari Terakhir"}
          </h3>
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      color: "#232946",
                      fontWeight: "bold",
                    }}
                  >
                    Tanggal
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#232946",
                      fontWeight: "bold",
                    }}
                  >
                    Total
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#f59e0b",
                      fontWeight: "bold",
                    }}
                  >
                    Terbuka
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#10b981",
                      fontWeight: "bold",
                    }}
                  >
                    Selesai
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#6b7280",
                      fontWeight: "bold",
                    }}
                  >
                    Tertutup
                  </th>
                </tr>
              </thead>
              <tbody>
                {take5Stats.dailyStats.map((day, index) => (
                  <tr
                    key={day.date}
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    <td style={{ padding: "12px", color: "#232946" }}>
                      {new Date(day.date).toLocaleDateString("id-ID", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#232946",
                        fontWeight: "bold",
                      }}
                    >
                      {day.total}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#f59e0b",
                        fontWeight: "bold",
                      }}
                    >
                      {day.open}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#10b981",
                        fontWeight: "bold",
                      }}
                    >
                      {day.done}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#6b7280",
                        fontWeight: "bold",
                      }}
                    >
                      {day.closed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribusi Laporan - Satu container, pie + bar kiri kanan, filter Harian/Bulanan/Tahunan */}
        {(() => {
          const isDaily = chartViewMode === "daily";
          const agg = take5ChartAggregatedData;
          let totalOpen = 0, totalDone = 0, totalClosed = 0;
          if (isDaily || agg.length === 0) {
            (take5Stats.dailyStats || []).forEach((d) => {
              totalOpen += d.open ?? 0;
              totalDone += d.done ?? 0;
              totalClosed += d.closed ?? 0;
            });
          } else {
            agg.forEach((d) => {
              totalOpen += d.open ?? 0;
              totalDone += d.done ?? 0;
              totalClosed += d.closed ?? 0;
            });
          }
          const pieData = [
            { name: "Terbuka", value: totalOpen, color: "#f59e0b" },
            { name: "Selesai", value: totalDone, color: "#10b981" },
            { name: "Tertutup", value: totalClosed, color: "#6b7280" },
          ].filter((d) => d.value > 0);
          const barData = isDaily || agg.length === 0
            ? (take5Stats.dailyStats || []).map((d) => ({
                tanggal: new Date(d.date + "T12:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }),
                Total: d.total ?? 0,
                Terbuka: d.open ?? 0,
                Selesai: d.done ?? 0,
                Tertutup: d.closed ?? 0,
              }))
            : agg.map((d) => ({
                tanggal: d.label ?? "-",
                Total: d.total ?? 0,
                Terbuka: d.open ?? 0,
                Selesai: d.done ?? 0,
                Tertutup: d.closed ?? 0,
              }));
          const hasCharts = pieData.length > 0 || barData.length > 0;
          if (!hasCharts && isDaily) return null;
          return (
            <div
              style={{
                marginBottom: "30px",
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <h3 style={{ color: "#1a1a1a", margin: 0, fontWeight: "600" }}>
                  📊 Distribusi Laporan
                </h3>
                <div style={{ display: "flex", gap: "4px" }}>
                  {["daily", "monthly", "yearly"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setChartViewMode(m)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: chartViewMode === m ? "2px solid #3b82f6" : "1px solid #d1d5db",
                        background: chartViewMode === m ? "#eff6ff" : "#fff",
                        color: chartViewMode === m ? "#1d4ed8" : "#374151",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {m === "daily" && "Harian"}
                      {m === "monthly" && "Bulanan"}
                      {m === "yearly" && "Tahunan"}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                {pieData.length > 0 && (
                  <div>
                    <h4 style={{ color: "#374151", marginBottom: "12px", fontSize: "15px", fontWeight: "600" }}>
                      Distribusi Status Laporan
                      {chartViewMode === "daily" && " (7 Hari)"}
                      {chartViewMode === "monthly" && agg.length > 0 && " (12 Bulan)"}
                      {chartViewMode === "yearly" && agg.length > 0 && " (5 Tahun)"}
                    </h4>
                    <div style={{ width: "100%", maxWidth: 380, height: 300, margin: "0 auto" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [v, ""]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {(barData.length > 0 || (!isDaily && agg.length === 0)) && (
                  <div>
                    <h4 style={{ color: "#374151", marginBottom: "12px", fontSize: "15px", fontWeight: "600" }}>
                      Statistik {chartViewMode === "daily" ? "Harian" : chartViewMode === "monthly" ? "Bulanan" : "Tahunan"}
                      {chartViewMode === "daily" && " (7 Hari)"}
                      {chartViewMode === "monthly" && agg.length > 0 && " (12 Bulan)"}
                      {chartViewMode === "yearly" && agg.length > 0 && " (5 Tahun)"}
                    </h4>
                    <div style={{ width: "100%", height: 300 }}>
                      {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} height={40} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Terbuka" fill="#f59e0b" name="Terbuka" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Selesai" fill="#10b981" name="Selesai" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Tertutup" fill="#6b7280" name="Tertutup" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", paddingTop: "80px" }}>
                          Memuat data...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Individual Statistics */}
        {renderIndividualStatsTable(individualStats.take5, "take_5")}
        </div>
      </div>
    );
  };

  // Render Hazard Statistics Dashboard
  const renderHazardStats = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Memuat statistik Hazard...
        </div>
      );
    }

    return (
      <div style={{ padding: "0" }}>
        {/* Content Container - Centered (lebar sama dengan Fit To Work) */}
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Filter Panel - Fixed di atas layar browser, centered di area konten */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: isMobile ? 0 : 240,
              right: 0,
              zIndex: 100,
              background: "linear-gradient(135deg, #181c2f 0%, #232946 100%)",
              padding: "20px 0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "0 20px",
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#e5e7eb",
                }}
              >
                Dari:
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: "8px 12px",
                  height: 38,
                  boxSizing: "border-box",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  minWidth: "180px",
                }}
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#e5e7eb",
                }}
              >
                Sampai:
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: "8px 12px",
                  height: 38,
                  boxSizing: "border-box",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  minWidth: "180px",
                }}
              />
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#e5e7eb",
                }}
              >
                Site:
              </label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                style={{
                  padding: "8px 12px",
                  height: 38,
                  boxSizing: "border-box",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  minWidth: "150px",
                }}
              >
                <option value="">Semua Site</option>
                {CUSTOM_INPUT_SITES.map((siteOption) => (
                  <option key={siteOption} value={siteOption}>
                    {siteOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset & Download Buttons */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setSite("");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                background: "#f8f9fa",
                color: "#374151",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Reset Filter
            </button>
            <button
              onClick={handleDownloadHazardExcel}
              disabled={!hazardStats}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "#10b981",
                color: "#fff",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📊 Excel
            </button>
            <button
              onClick={handleDownloadHazardPDF}
              disabled={!hazardStats}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                background: "#ef4444",
                color: "#fff",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📄 PDF
            </button>
          </div>
          </div>
        </div>
        {/* Spacer agar konten tidak tertutup filter fixed */}
        <div style={{ height: 100 }} />
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#ffffff", marginBottom: "10px" }}>
            📊 Dashboard Statistik Hazard
          </h2>
          <p style={{ color: "#ffffff", fontSize: "14px", opacity: 0.9 }}>
            Monitoring pelaporan Hazard dan status penyelesaian
          </p>
        </div>

        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          {/* Total Reports */}
          <div
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Total Laporan</div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {hazardStats.totalReports}
            </div>
          </div>

          {/* Submit Reports */}
          <div
            style={{
              background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(107, 114, 128, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Submit</div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {hazardStats.submitReports}
            </div>
          </div>

          {/* Open Reports */}
          <div
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Open</div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {hazardStats.openReports}
            </div>
          </div>

          {/* Progress Reports */}
          <div
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Progress</div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {hazardStats.progressReports}
            </div>
          </div>

          {/* Done Reports */}
          <div
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Done</div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {hazardStats.doneReports}
            </div>
          </div>

          {/* Completion Rate */}
          <div
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              Tingkat Penyelesaian
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {hazardStats.completionRate}%
            </div>
          </div>
        </div>

        {/* Completion Accuracy Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          <h3
            style={{
              color: "#ffffff",
              marginBottom: "20px",
              gridColumn: "1 / -1",
              fontWeight: "600",
            }}
          >
            ⏰ Statistik Ketepatan Penyelesaian
          </h3>

          {/* Closed On Time */}
          <div
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Closed On Time</div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {hazardStats.closedOnTime || 0}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
              Selesai tepat waktu
            </div>
          </div>

          {/* Overdue Reports */}
          <div
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              Overdue Reports
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {hazardStats.overdueReports || 0}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
              Melewati due date
            </div>
          </div>

          {/* Closed Overdue */}
          <div
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Closed Overdue</div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {hazardStats.closedOverdue || 0}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
              Selesai terlambat
            </div>
          </div>
        </div>

        {/* Site Statistics */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#ffffff", marginBottom: "20px", fontWeight: "600" }}>
            📈 Statistik per Site {site && `- ${site}`}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {Object.entries(hazardStats.siteStats).map(([siteName, stats]) => (
              <div
                key={siteName}
                style={{
                  background: "white",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h4 style={{ color: "#232946", marginBottom: "15px" }}>
                  {siteName}
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total</div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#232946",
                      }}
                    >
                      {stats.total}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Submit
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#6b7280",
                      }}
                    >
                      {stats.submit}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Open</div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#f59e0b",
                      }}
                    >
                      {stats.open}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Progress
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#8b5cf6",
                      }}
                    >
                      {stats.progress}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Done</div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#10b981",
                      }}
                    >
                      {stats.done}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Closed
                    </div>
                    <div
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#6b7280",
                      }}
                    >
                      {stats.closed}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Statistics */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#ffffff", marginBottom: "20px", fontWeight: "600" }}>
            📅 Statistik{" "}
            {dateFrom && dateTo
              ? `${dateFrom} s/d ${dateTo}`
              : "7 Hari Terakhir"}
          </h3>
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              border: "1px solid #e5e7eb",
              overflow: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "800px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      color: "#232946",
                      fontWeight: "bold",
                    }}
                  >
                    Tanggal
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#232946",
                      fontWeight: "bold",
                    }}
                  >
                    Total
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#6b7280",
                      fontWeight: "bold",
                    }}
                  >
                    Submit
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#f59e0b",
                      fontWeight: "bold",
                    }}
                  >
                    Open
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#8b5cf6",
                      fontWeight: "bold",
                    }}
                  >
                    Progress
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#10b981",
                      fontWeight: "bold",
                    }}
                  >
                    Done
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#ef4444",
                      fontWeight: "bold",
                    }}
                  >
                    Reject
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      color: "#6b7280",
                      fontWeight: "bold",
                    }}
                  >
                    Closed
                  </th>
                </tr>
              </thead>
              <tbody>
                {hazardStats.dailyStats.map((day, index) => (
                  <tr
                    key={day.date}
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    <td style={{ padding: "12px", color: "#232946" }}>
                      {new Date(day.date).toLocaleDateString("id-ID", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#232946",
                        fontWeight: "bold",
                      }}
                    >
                      {day.total}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#6b7280",
                        fontWeight: "bold",
                      }}
                    >
                      {day.submit}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#f59e0b",
                        fontWeight: "bold",
                      }}
                    >
                      {day.open}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#8b5cf6",
                        fontWeight: "bold",
                      }}
                    >
                      {day.progress}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#10b981",
                        fontWeight: "bold",
                      }}
                    >
                      {day.done}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#ef4444",
                        fontWeight: "bold",
                      }}
                    >
                      {day.rejectOpen + day.rejectDone}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#6b7280",
                        fontWeight: "bold",
                      }}
                    >
                      {day.closed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribusi Laporan - Satu container, dua chart kiri kanan */}
        {(() => {
          const pieData = [
            { name: "Submit", value: hazardStats.submitReports || 0, color: "#6b7280" },
            { name: "Open", value: hazardStats.openReports || 0, color: "#f59e0b" },
            { name: "Progress", value: hazardStats.progressReports || 0, color: "#8b5cf6" },
            { name: "Done", value: hazardStats.doneReports || 0, color: "#10b981" },
            { name: "Reject Open", value: hazardStats.rejectOpenReports || 0, color: "#ef4444" },
            { name: "Reject Done", value: hazardStats.rejectDoneReports || 0, color: "#f97316" },
            { name: "Closed", value: hazardStats.closedReports || 0, color: "#3b82f6" },
          ].filter((d) => d.value > 0);
          const timelinessData = [
            { name: "Closed On Time", value: hazardStats.closedOnTime || 0, color: "#10b981" },
            { name: "Overdue", value: hazardStats.overdueReports || 0, color: "#f59e0b" },
            { name: "Closed Over Due", value: hazardStats.closedOverdue || 0, color: "#ef4444" },
          ].filter((d) => d.value > 0);
          const hasCharts = pieData.length > 0 || timelinessData.length > 0;
          if (!hasCharts) return null;
          return (
            <div
              style={{
                marginBottom: "30px",
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3 style={{ color: "#1a1a1a", marginBottom: "20px", fontWeight: "600" }}>
                📊 Distribusi Laporan
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                {pieData.length > 0 && (
                  <div>
                    <h4 style={{ color: "#374151", marginBottom: "12px", fontSize: "15px", fontWeight: "600" }}>
                      Distribusi Status Laporan
                    </h4>
                    <div style={{ width: "100%", maxWidth: 420, height: 300, margin: "0 auto" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [v, ""]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {timelinessData.length > 0 && (
                  <div>
                    <h4 style={{ color: "#374151", marginBottom: "12px", fontSize: "15px", fontWeight: "600" }}>
                      Ketepatan Penyelesaian
                    </h4>
                    <div style={{ width: "100%", maxWidth: 420, height: 300, margin: "0 auto" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={timelinessData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {timelinessData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [v, ""]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Individual Statistics */}
        {renderIndividualStatsTable(individualStats.hazard, "hazard")}
        </div>
      </div>
    );
  };

  // Render PTO Statistics Dashboard
  const renderPtoStats = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Memuat statistik PTO...
        </div>
      );
    }

    return (
      <div style={{ padding: "0" }}>
        {/* Content Container - Centered (lebar sama dengan Fit To Work) */}
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Filter Panel */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: isMobile ? 0 : 240,
              right: 0,
              zIndex: 100,
              background: "linear-gradient(135deg, #181c2f 0%, #232946 100%)",
              padding: "20px 0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                maxWidth: "1400px",
                margin: "0 auto",
                padding: "0 20px",
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#e5e7eb" }}>Dari:</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                style={{ padding: "8px 12px", height: 38, boxSizing: "border-box", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", minWidth: "180px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#e5e7eb" }}>Sampai:</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                style={{ padding: "8px 12px", height: 38, boxSizing: "border-box", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", minWidth: "180px" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#e5e7eb" }}>Site:</label>
              <select value={site} onChange={(e) => setSite(e.target.value)}
                style={{ padding: "8px 12px", height: 38, boxSizing: "border-box", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", minWidth: "150px" }}>
                <option value="">Semua Site</option>
                {CUSTOM_INPUT_SITES.map((siteOption) => (
                  <option key={siteOption} value={siteOption}>{siteOption}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => { setDateFrom(""); setDateTo(""); setSite(""); }}
              style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ddd", background: "#f8f9fa", color: "#374151", fontSize: "14px", cursor: "pointer", fontWeight: "500" }}>
              Reset Filter
            </button>
            <button onClick={handleDownloadPtoExcel} disabled={!ptoStats}
              style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#10b981", color: "#fff", fontSize: "14px", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
              📊 Excel
            </button>
            <button onClick={handleDownloadPtoPdf} disabled={!ptoStats}
              style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#ef4444", color: "#fff", fontSize: "14px", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
              📄 PDF
            </button>
          </div>
            </div>
          </div>
        <div style={{ height: 100 }} />
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#ffffff", marginBottom: "10px" }}>📊 Dashboard Statistik PTO</h2>
          <p style={{ color: "#ffffff", fontSize: "14px", opacity: 0.9 }}>Monitoring Planned Task Observation (PTO) dan status penyelesaian</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "30px" }}>
          <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Total Laporan</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}>{ptoStats.totalReports}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)" }}>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Pending</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}>{ptoStats.pendingReports}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" }}>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Closed</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}>{ptoStats.closedReports}</div>
          </div>
          <div style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)" }}>
            <div style={{ fontSize: "14px", opacity: 0.9 }}>Tingkat Penyelesaian</div>
            <div style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}>{ptoStats.completionRate}%</div>
          </div>
        </div>
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#ffffff", marginBottom: "20px", fontWeight: "600" }}>📈 Statistik per Site {site && `- ${site}`}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
            {Object.entries(ptoStats.siteStats || {}).map(([siteName, stats]) => (
              <div key={siteName} style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
                <h4 style={{ color: "#232946", marginBottom: "15px" }}>{siteName}</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Total</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#232946" }}>{stats.total}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Pending</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#f59e0b" }}>{stats.pending}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Closed</div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#10b981" }}>{stats.closed}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#ffffff", marginBottom: "20px", fontWeight: "600" }}>📅 Statistik {dateFrom && dateTo ? `${dateFrom} s/d ${dateTo}` : "7 Hari Terakhir"}</h3>
          <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "12px", color: "#232946", fontWeight: "bold" }}>Tanggal</th>
                  <th style={{ textAlign: "center", padding: "12px", color: "#232946", fontWeight: "bold" }}>Total</th>
                  <th style={{ textAlign: "center", padding: "12px", color: "#f59e0b", fontWeight: "bold" }}>Pending</th>
                  <th style={{ textAlign: "center", padding: "12px", color: "#10b981", fontWeight: "bold" }}>Closed</th>
                </tr>
              </thead>
              <tbody>
                {(ptoStats.dailyStats || []).map((day) => (
                  <tr key={day.date} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px", color: "#232946" }}>{new Date(day.date).toLocaleDateString("id-ID", { weekday: "short", month: "short", day: "numeric" })}</td>
                    <td style={{ textAlign: "center", padding: "12px", color: "#232946", fontWeight: "bold" }}>{day.total}</td>
                    <td style={{ textAlign: "center", padding: "12px", color: "#f59e0b", fontWeight: "bold" }}>{day.pending}</td>
                    <td style={{ textAlign: "center", padding: "12px", color: "#10b981", fontWeight: "bold" }}>{day.closed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribusi Laporan - Satu container, pie + bar kiri kanan, filter Harian/Bulanan/Tahunan */}
        {(() => {
          const isDaily = chartViewMode === "daily";
          const agg = ptoChartAggregatedData;
          let totalPending = 0, totalClosed = 0;
          if (isDaily || agg.length === 0) {
            (ptoStats.dailyStats || []).forEach((d) => {
              totalPending += d.pending ?? 0;
              totalClosed += d.closed ?? 0;
            });
          } else {
            agg.forEach((d) => {
              totalPending += d.pending ?? 0;
              totalClosed += d.closed ?? 0;
            });
          }
          const pieData = [
            { name: "Pending", value: totalPending, color: "#f59e0b" },
            { name: "Closed", value: totalClosed, color: "#10b981" },
          ].filter((d) => d.value > 0);
          const barData = isDaily || agg.length === 0
            ? (ptoStats.dailyStats || []).map((d) => ({
                tanggal: new Date(d.date + "T12:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }),
                Total: d.total ?? 0,
                Pending: d.pending ?? 0,
                Closed: d.closed ?? 0,
              }))
            : agg.map((d) => ({
                tanggal: d.label ?? "-",
                Total: d.total ?? 0,
                Pending: d.pending ?? 0,
                Closed: d.closed ?? 0,
              }));
          const hasCharts = pieData.length > 0 || barData.length > 0;
          if (!hasCharts && isDaily) return null;
          return (
            <div
              style={{
                marginBottom: "30px",
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <h3 style={{ color: "#1a1a1a", margin: 0, fontWeight: "600" }}>
                  📊 Distribusi Laporan
                </h3>
                <div style={{ display: "flex", gap: "4px" }}>
                  {["daily", "monthly", "yearly"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setChartViewMode(m)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: chartViewMode === m ? "2px solid #3b82f6" : "1px solid #d1d5db",
                        background: chartViewMode === m ? "#eff6ff" : "#fff",
                        color: chartViewMode === m ? "#1d4ed8" : "#374151",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {m === "daily" && "Harian"}
                      {m === "monthly" && "Bulanan"}
                      {m === "yearly" && "Tahunan"}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                {pieData.length > 0 && (
                  <div>
                    <h4 style={{ color: "#374151", marginBottom: "12px", fontSize: "15px", fontWeight: "600" }}>
                      Distribusi Status Laporan
                      {chartViewMode === "daily" && " (7 Hari)"}
                      {chartViewMode === "monthly" && agg.length > 0 && " (12 Bulan)"}
                      {chartViewMode === "yearly" && agg.length > 0 && " (5 Tahun)"}
                    </h4>
                    <div style={{ width: "100%", maxWidth: 380, height: 300, margin: "0 auto" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [v, ""]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {(barData.length > 0 || (!isDaily && agg.length === 0)) && (
                  <div>
                    <h4 style={{ color: "#374151", marginBottom: "12px", fontSize: "15px", fontWeight: "600" }}>
                      Statistik {chartViewMode === "daily" ? "Harian" : chartViewMode === "monthly" ? "Bulanan" : "Tahunan"}
                      {chartViewMode === "daily" && " (7 Hari)"}
                      {chartViewMode === "monthly" && agg.length > 0 && " (12 Bulan)"}
                      {chartViewMode === "yearly" && agg.length > 0 && " (5 Tahun)"}
                    </h4>
                    <div style={{ width: "100%", height: 300 }}>
                      {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} height={40} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Total" fill="#3b82f6" name="Total" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Closed" fill="#10b981" name="Closed" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", paddingTop: "80px" }}>
                          Memuat data...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {renderIndividualStatsTable(individualStats.pto, "pto")}
        </div>
      </div>
    );
  };

  // Render Individual Statistics Table
  const renderIndividualStatsTable = (data, type) => {
    if (!data || data.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "20px", color: "#ffffff" }}>
          Tidak ada data statistik per individu
        </div>
      );
    }

    const getColumns = () => {
      if (type === "pto") {
        return [
          { key: "name", label: "Nama Observer", width: "25%" },
          { key: "total", label: "Total", width: "15%" },
          { key: "pending", label: "Pending", width: "15%" },
          { key: "closed", label: "Closed", width: "15%" },
          { key: "completionRate", label: "Tingkat Penyelesaian (%)", width: "20%" },
        ];
      }
      if (type === "fit_to_work") {
        return [
          { key: "name", label: "Nama", width: "25%" },
          { key: "total", label: "Total", width: "10%" },
          { key: "fitToWork", label: "Fit To Work", width: "15%" },
          { key: "notFitToWork", label: "Not Fit To Work", width: "15%" },
          { key: "completionRate", label: "Tingkat Kepatuhan", width: "15%" },
        ];
      } else {
        return [
          {
            key: "name",
            label: "Nama Pelapor",
            width: "20%",
          },
          { key: "total", label: "Total", width: "10%" },
          { key: "submit", label: "Submit", width: "10%" },
          { key: "open", label: "Open", width: "10%" },
          { key: "progress", label: "Progress", width: "10%" },
          { key: "done", label: "Done", width: "10%" },
          { key: "closed", label: "Closed", width: "10%" },
          {
            key: "completionRate",
            label: "Tingkat Penyelesaian",
            width: "10%",
          },
        ];
      }
    };

    const columns = getColumns();

    return (
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ color: "#ffffff", margin: 0, fontWeight: "600" }}>
            👥 Statistik Per Individu
          </h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() =>
                handleDownloadIndividualExcel(
                  type === "fit_to_work"
                    ? "fitToWork"
                    : type === "take_5"
                      ? "take5"
                      : type === "pto"
                        ? "pto"
                        : "hazard"
                )
              }
              style={{
                padding: "8px 12px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              📊 Excel
            </button>
            <button
              onClick={() =>
                handleDownloadIndividualPDF(
                  type === "fit_to_work"
                    ? "fitToWork"
                    : type === "take_5"
                      ? "take5"
                      : type === "pto"
                        ? "pto"
                        : "hazard"
                )
              }
              style={{
                padding: "8px 12px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              📄 PDF
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {columns.map((col, index) => (
                  <th
                    key={index}
                    style={{
                      padding: "12px 8px",
                      textAlign: "left",
                      border: "1px solid #e2e8f0",
                      fontWeight: "bold",
                      fontSize: "12px",
                      width: col.width,
                      color: "#000000",
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((user, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                  }}
                >
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      style={{
                        padding: "12px 8px",
                        border: "1px solid #e2e8f0",
                        textAlign: col.key === "name" ? "left" : "center",
                        fontSize: "12px",
                        color: "#000000",
                      }}
                    >
                      {col.key === "completionRate"
                        ? `${user[col.key]}%`
                        : user[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Download Individual Statistics Excel
  function handleDownloadIndividualExcel(type) {
    const data = individualStats[type] || [];
    if (data.length === 0) return;

    const workbook = XLSX.utils.book_new();

    // Get column headers based on type
    const getHeaders = () => {
      if (type === "fitToWork") {
        return [
          "Nama",
          "Total",
          "Fit To Work",
          "Not Fit To Work",
          "Tingkat Kepatuhan (%)",
        ];
      } else if (type === "pto") {
        return [
          "Nama Observer",
          "Total",
          "Pending",
          "Closed",
          "Tingkat Penyelesaian (%)",
        ];
      } else {
        return [
          "Nama",
          "Total",
          "Submit",
          "Open",
          "Progress",
          "Done",
          "Closed",
          "Tingkat Penyelesaian (%)",
        ];
      }
    };

    const headers = getHeaders();
    const sheetData = [headers];

    // Add data rows
    data.forEach((user) => {
      if (type === "fitToWork") {
        sheetData.push([
          user.name,
          user.total,
          user.fitToWork,
          user.notFitToWork,
          user.completionRate,
        ]);
      } else if (type === "pto") {
        sheetData.push([
          user.name,
          user.total,
          user.pending || 0,
          user.closed || 0,
          user.completionRate,
        ]);
      } else {
        sheetData.push([
          user.name,
          user.total,
          user.submit,
          user.open,
          user.progress,
          user.done,
          user.closed,
          user.completionRate,
        ]);
      }
    });

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    const sheetName =
      type === "fitToWork"
        ? "Statistik Per Individu FTW"
        : type === "take5"
          ? "Statistik Per Individu Take5"
          : type === "pto"
            ? "Statistik Per Individu PTO"
            : "Statistik Per Individu Hazard";

    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    XLSX.writeFile(workbook, `statistik-per-individu-${type}.xlsx`);
  }

  // Download Individual Statistics PDF
  function handleDownloadIndividualPDF(type) {
    const data = individualStats[type] || [];
    if (data.length === 0) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const title =
      type === "fitToWork"
        ? "Statistik Per Individu - Fit To Work"
        : type === "take5"
          ? "Statistik Per Individu - Take 5"
          : type === "pto"
            ? "Statistik Per Individu - PTO"
            : "Statistik Per Individu - Hazard";
    doc.text(title, 20, yPos);
    yPos += 20;

    // Get column headers
    const getHeaders = () => {
      if (type === "fitToWork") {
        return [
          "Nama",
          "Total",
          "Fit To Work",
          "Not Fit To Work",
          "Tingkat Kepatuhan",
        ];
      } else if (type === "pto") {
        return [
          "Nama Observer",
          "Total",
          "Pending",
          "Closed",
          "Tingkat Penyelesaian",
        ];
      } else {
        return [
          "Nama",
          "Total",
          "Submit",
          "Open",
          "Progress",
          "Done",
          "Closed",
          "Tingkat Penyelesaian",
        ];
      }
    };

    const headers = getHeaders();
    const tableData = data.map((user) => {
      if (type === "fitToWork") {
        return [
          user.name,
          user.total.toString(),
          user.fitToWork.toString(),
          user.notFitToWork.toString(),
          `${user.completionRate}%`,
        ];
      } else if (type === "pto") {
        return [
          user.name,
          user.total.toString(),
          (user.pending || 0).toString(),
          (user.closed || 0).toString(),
          `${user.completionRate}%`,
        ];
      } else {
        return [
          user.name,
          user.total.toString(),
          user.submit.toString(),
          user.open.toString(),
          user.progress.toString(),
          user.done.toString(),
          user.closed.toString(),
          `${user.completionRate}%`,
        ];
      }
    });

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
    });

    const fileName = `statistik-per-individu-${type}.pdf`;
    doc.save(fileName);
  }

  return (
    <div
      style={{
        padding: "0 20px 20px 20px",
        overflow: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0,0,0,0.3) transparent",
        height: "100vh",
      }}
    >
      {selectedTable === "fit_to_work_stats" && renderFitToWorkStats()}
      {selectedTable === "take_5_stats" && renderTake5Stats()}
      {selectedTable === "hazard_stats" && renderHazardStats()}
      {selectedTable === "pto_stats" && renderPtoStats()}
    </div>
  );
}

export default MonitoringPage;
