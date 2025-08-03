import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
  });

  // Individual Statistics State
  const [individualStats, setIndividualStats] = useState({
    fitToWork: [],
    take5: [],
    hazard: [],
  });

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
    }
  }, [subMenu]);

  // Fetch data when filters change
  useEffect(() => {
    if (selectedTable === "fit_to_work_stats") {
      fetchFitToWorkStats();
    } else if (selectedTable === "take_5_stats") {
      fetchTake5Stats();
    } else if (selectedTable === "hazard_stats") {
      fetchHazardStats();
    }
  }, [dateFrom, dateTo, site]);

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

  // Fetch Fit To Work Statistics
  const fetchFitToWorkStats = async () => {
    setLoading(true);
    try {
      let query = supabase.from("fit_to_work").select("*");

      if (dateFrom) query = query.gte("tanggal", dateFrom);
      if (dateTo) query = query.lte("tanggal", dateTo);
      if (site) query = query.eq("site", site);

      const { data: fitToWorkData, error } = await query;

      if (error) {
        console.error("Error fetching Fit To Work data:", error);
        return;
      }

      // Calculate statistics
      const stats = calculateFitToWorkStats(fitToWorkData || []);
      setFitToWorkStats(stats);

      // Calculate individual statistics
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

  // Fetch Take 5 Statistics
  const fetchTake5Stats = async () => {
    setLoading(true);
    try {
      let query = supabase.from("take_5").select("*");

      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);
      // Use site field for filtering, as it contains the correct site names
      if (site) query = query.eq("site", site);

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

  // Fetch Hazard Statistics
  const fetchHazardStats = async () => {
    setLoading(true);
    try {
      // Fetch dari tabel tasklist (Hazard)
      let query = supabase.from("tasklist").select("*");

      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);
      if (site) query = query.eq("lokasi", site);

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

  // Calculate Fit To Work Statistics
  const calculateFitToWorkStats = (data) => {
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

    const totalSubmissions = filteredData.length;
    const fitToWork = filteredData.filter(
      (item) => item.status_fatigue === "Fit To Work"
    ).length;
    const notFitToWork = filteredData.filter(
      (item) => item.status_fatigue === "Not Fit To Work"
    ).length;

    // Calculate percentage of Fit To Work employees
    const fitToWorkPercentage =
      totalSubmissions > 0
        ? parseFloat(((fitToWork / totalSubmissions) * 100).toFixed(1))
        : 0;

    // Site statistics (hanya tampilkan site yang dipilih jika ada filter)
    const siteStats = {};
    filteredData.forEach((item) => {
      if (!siteStats[item.site]) {
        siteStats[item.site] = {
          total: 0,
          fitToWork: 0,
          notFitToWork: 0,
        };
      }
      siteStats[item.site].total++;
      if (item.status_fatigue === "Fit To Work") {
        siteStats[item.site].fitToWork++;
      } else if (item.status_fatigue === "Not Fit To Work") {
        siteStats[item.site].notFitToWork++;
      }
    });

    // Daily statistics (last 7 days atau sesuai filter)
    const dailyStats = [];
    const startDate = dateFrom ? new Date(dateFrom) : new Date();
    const endDate = dateTo ? new Date(dateTo) : new Date();

    if (!dateFrom && !dateTo) {
      // Default: last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const dayData = filteredData.filter((item) => item.tanggal === dateStr);
        dailyStats.push({
          date: dateStr,
          total: dayData.length,
          fitToWork: dayData.filter(
            (item) => item.status_fatigue === "Fit To Work"
          ).length,
          notFitToWork: dayData.filter(
            (item) => item.status_fatigue === "Not Fit To Work"
          ).length,
        });
      }
    } else {
      // Custom date range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];

        const dayData = filteredData.filter((item) => item.tanggal === dateStr);
        dailyStats.push({
          date: dateStr,
          total: dayData.length,
          fitToWork: dayData.filter(
            (item) => item.status_fatigue === "Fit To Work"
          ).length,
          notFitToWork: dayData.filter(
            (item) => item.status_fatigue === "Not Fit To Work"
          ).length,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Status changes tracking
    const statusChanges = filteredData
      .filter((item) => item.workflow_status === "Closed")
      .map((item) => ({
        nama: item.nama,
        site: item.site,
        tanggal: item.tanggal,
        finalStatus: item.status_fatigue,
        status: item.status_fatigue === "Fit To Work" ? "Fit" : "Not Fit",
      }))
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 10); // Last 10 status changes

    return {
      totalSubmissions,
      fitToWork,
      notFitToWork,
      fitToWorkPercentage,
      improvementCount: 0, // Keep for backward compatibility
      totalImprovements: 0, // Keep for backward compatibility
      siteStats,
      dailyStats,
      statusChanges,
      recentReports: filteredData.slice(0, 10),
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

    // Daily statistics (last 7 days atau sesuai filter)
    const dailyStats = [];
    const startDate = dateFrom ? new Date(dateFrom) : new Date();
    const endDate = dateTo ? new Date(dateTo) : new Date();

    if (!dateFrom && !dateTo) {
      // Default: last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

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
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];

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

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Recent reports (last 10)
    const recentReports = filteredData
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    return {
      totalReports,
      openReports,
      doneReports,
      closedReports,
      completionRate,
      siteStats,
      dailyStats,
      recentReports,
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

    // Pendekatan sederhana: Semua hazard closed dianggap selesai tepat waktu
    // Karena jika sudah closed, berarti sudah selesai sebelum atau pada due date
    filteredData.forEach((item) => {
      if (item.due_date) {
        if (item.status?.toLowerCase() === "closed") {
          // Semua hazard yang closed dianggap selesai tepat waktu
          closedOnTime++;
          console.log(
            `Hazard ${item.id} - Status: ${item.status}, Due: ${item.due_date} -> Closed On Time ✅`
          );
        } else {
          // Untuk status lain, cek apakah sudah melewati due date
          const dueDate = new Date(item.due_date);
          const isOverdue = today > dueDate;
          if (isOverdue) {
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

    // Daily statistics (last 7 days atau sesuai filter)
    const dailyStats = [];
    const startDate = dateFrom ? new Date(dateFrom) : new Date();
    const endDate = dateTo ? new Date(dateTo) : new Date();

    if (!dateFrom && !dateTo) {
      // Default: last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

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
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];

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

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    console.log("calculateHazardStats - Daily stats:", dailyStats);

    // Recent reports (last 10)
    const recentReports = filteredData
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

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
    };

    console.log("calculateHazardStats - Final result:", result);
    return result;
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
    }
  }, [subMenu]);

  // Fetch data dari Supabase sesuai filter (for other tables)
  useEffect(() => {
    console.log("MonitoringPage - selectedTable:", selectedTable);
    if (!selectedTable || selectedTable === "fit_to_work_stats") {
      return; // Skip for fit_to_work_stats as it's handled above
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
      `${selectedTable}_${new Date().toISOString().split("T")[0]}.xlsx`
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
      { Metric: "Not Fit To Work", Value: fitToWorkStats.notFitToWork },
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
        "Status Akhir": change.finalStatus,
        Status: change.status,
      }));
      const changesSheet = XLSX.utils.json_to_sheet(changesData);
      XLSX.utils.book_append_sheet(workbook, changesSheet, "Status Changes");
    }

    XLSX.writeFile(
      workbook,
      `Fit_To_Work_Statistics_${new Date().toISOString().split("T")[0]}.xlsx`
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
    doc.text(`Not Fit To Work: ${fitToWorkStats.notFitToWork}`, 20, yPos);
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
        change.finalStatus,
        change.status,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Nama", "Site", "Tanggal", "Status Akhir", "Status"]],
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

    XLSX.writeFile(workbook, "statistik-hazard.xlsx");
  }

  // Download Hazard PDF
  function handleDownloadHazardPDF() {
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
        {/* Filter Panel untuk Dashboard Statistik */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "20px",
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
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#666",
                }}
              >
                Tanggal Dari:
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
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
                  color: "#666",
                }}
              >
                Tanggal Sampai:
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
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
                  color: "#666",
                }}
              >
                Site:
              </label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                style={{
                  padding: "8px 12px",
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
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#666",
                }}
              >
                &nbsp;
              </label>
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
                  color: "#666",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Download Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
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
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#232946", marginBottom: "10px" }}>
            📊 Dashboard Statistik Fit To Work
          </h2>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Monitoring perbaikan status dari Not Fit To Work menjadi Fit To Work
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
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
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
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {fitToWorkStats.fitToWork}
            </div>
          </div>

          {/* Not Fit To Work */}
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
              Not Fit To Work
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {fitToWorkStats.notFitToWork}
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
              style={{ fontSize: "32px", fontWeight: "bold", marginTop: "8px" }}
            >
              {fitToWorkStats.fitToWorkPercentage}%
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
              {fitToWorkStats.fitToWork} dari {fitToWorkStats.totalSubmissions}{" "}
              karyawan
            </div>
          </div>
        </div>

        {/* Site Statistics */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#232946", marginBottom: "20px" }}>
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
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Total
                      </div>
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
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Not Fit To Work
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
                      <div style={{ fontSize: "12px", color: "#666" }}>
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
          <h3 style={{ color: "#232946", marginBottom: "20px" }}>
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
                    Not Fit To Work
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
                        color: "#8b5cf6",
                        fontWeight: "bold",
                      }}
                    >
                      {day.total > 0
                        ? ((day.fitToWork / day.total) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Changes */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#232946", marginBottom: "20px" }}>
            📋 Perubahan Status
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
            {fitToWorkStats.statusChanges.length === 0 ? (
              <div
                style={{ textAlign: "center", color: "#666", padding: "40px" }}
              >
                Belum ada perubahan status yang tercatat
              </div>
            ) : (
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
                      Nama
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        color: "#232946",
                        fontWeight: "bold",
                      }}
                    >
                      Site
                    </th>
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
                      Status Akhir
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "#232946",
                        fontWeight: "bold",
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fitToWorkStats.statusChanges.map((change, index) => (
                    <tr
                      key={index}
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                    >
                      <td style={{ padding: "12px", color: "#232946" }}>
                        {change.nama}
                      </td>
                      <td style={{ padding: "12px", color: "#232946" }}>
                        {change.site}
                      </td>
                      <td style={{ padding: "12px", color: "#232946" }}>
                        {new Date(change.tanggal).toLocaleDateString("id-ID")}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color: getStatusColor(change.finalStatus),
                          fontWeight: "bold",
                        }}
                      >
                        {change.finalStatus}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color:
                            change.status === "Fit" ? "#22c55e" : "#ef4444",
                          fontWeight: "bold",
                        }}
                      >
                        {change.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Individual Statistics */}
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ color: "#232946" }}>📊 Statistik per Individu</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleDownloadIndividualExcel("fit_to_work")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  background: "#10b981",
                  color: "#fff",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                📊 Excel
              </button>
              <button
                onClick={() => handleDownloadIndividualPDF("fit_to_work")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                📄 PDF
              </button>
            </div>
          </div>
          {renderIndividualStatsTable(individualStats.fitToWork, "fit_to_work")}
        </div>

        {/* Recent Reports */}
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ color: "#232946", marginBottom: "20px" }}>
            📋 Laporan Terbaru
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {fitToWorkStats.recentReports.slice(0, 6).map((report, index) => (
              <div
                key={index}
                style={{
                  background: "white",
                  padding: "16px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#232946",
                    }}
                  >
                    {report.nama}
                  </span>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor:
                        report.status_fatigue === "Fit To Work"
                          ? "#dcfce7"
                          : "#fef2f2",
                      color:
                        report.status_fatigue === "Fit To Work"
                          ? "#166534"
                          : "#dc2626",
                    }}
                  >
                    {report.status_fatigue}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Site: {report.site}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Tanggal:{" "}
                  {new Date(report.tanggal).toLocaleDateString("id-ID")}
                </div>
              </div>
            ))}
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
        {/* Filter Panel untuk Dashboard Statistik */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "20px",
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
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#666",
                }}
              >
                Tanggal Dari:
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
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
                  color: "#666",
                }}
              >
                Tanggal Sampai:
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
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
                  color: "#666",
                }}
              >
                Site:
              </label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  minWidth: "150px",
                }}
              >
                <option value="">Semua Site</option>
                <option value="Head Office">Head Office</option>
                <option value="Balikpapan">Balikpapan</option>
                <option value="ADRO">ADRO</option>
                <option value="AMMP">AMMP</option>
                <option value="BSIB">BSIB</option>
                <option value="GAMR">GAMR</option>
                <option value="HRSB">HRSB</option>
                <option value="HRSE">HRSE</option>
                <option value="PABB">PABB</option>
                <option value="PBRB">PBRB</option>
                <option value="PKJA">PKJA</option>
                <option value="PPAB">PPAB</option>
                <option value="PSMM">PSMM</option>
                <option value="REBH">REBH</option>
                <option value="RMTU">RMTU</option>
                <option value="PMTU">PMTU</option>
              </select>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#666",
                }}
              >
                &nbsp;
              </label>
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
                  color: "#666",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Download Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
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
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#232946", marginBottom: "10px" }}>
            📊 Dashboard Statistik Take 5
          </h2>
          <p style={{ color: "#666", fontSize: "14px" }}>
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
          <h3 style={{ color: "#232946", marginBottom: "20px" }}>
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
          <h3 style={{ color: "#232946", marginBottom: "20px" }}>
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

        {/* Individual Statistics */}
        {renderIndividualStatsTable(individualStats.take5, "take_5")}
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
        {/* Filter Panel untuk Dashboard Statistik */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "20px",
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
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#666",
                }}
              >
                Tanggal Dari:
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
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
                  color: "#666",
                }}
              >
                Tanggal Sampai:
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
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
                  color: "#666",
                }}
              >
                Site:
              </label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  minWidth: "150px",
                }}
              >
                <option value="">Semua Site</option>
                <option value="Head Office">Head Office</option>
                <option value="Balikpapan">Balikpapan</option>
                <option value="ADRO">ADRO</option>
                <option value="AMMP">AMMP</option>
                <option value="BSIB">BSIB</option>
                <option value="GAMR">GAMR</option>
                <option value="HRSB">HRSB</option>
                <option value="HRSE">HRSE</option>
                <option value="PABB">PABB</option>
                <option value="PBRB">PBRB</option>
                <option value="PKJA">PKJA</option>
                <option value="PPAB">PPAB</option>
                <option value="PSMM">PSMM</option>
                <option value="REBH">REBH</option>
                <option value="RMTU">RMTU</option>
                <option value="PMTU">PMTU</option>
              </select>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#666",
                }}
              >
                &nbsp;
              </label>
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
                  color: "#666",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Download Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
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

        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "#232946", marginBottom: "10px" }}>
            📊 Dashboard Statistik Hazard
          </h2>
          <p style={{ color: "#666", fontSize: "14px" }}>
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
              color: "#232946",
              marginBottom: "20px",
              gridColumn: "1 / -1",
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
          <h3 style={{ color: "#232946", marginBottom: "20px" }}>
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
          <h3 style={{ color: "#232946", marginBottom: "20px" }}>
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

        {/* Individual Statistics */}
        {renderIndividualStatsTable(individualStats.hazard, "hazard")}
      </div>
    );
  };

  // Render Individual Statistics Table
  const renderIndividualStatsTable = (data, type) => {
    if (!data || data.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "20px", color: "#000000" }}>
          Tidak ada data statistik per individu
        </div>
      );
    }

    const getColumns = () => {
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
          <h3 style={{ color: "#000000", margin: 0 }}>
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
        padding: "20px",
        overflow: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0,0,0,0.3) transparent",
        height: "100vh",
      }}
    >
      {selectedTable === "fit_to_work_stats" && renderFitToWorkStats()}
      {selectedTable === "take_5_stats" && renderTake5Stats()}
      {selectedTable === "hazard_stats" && renderHazardStats()}
    </div>
  );
}

export default MonitoringPage;
