import { useState, useEffect } from "react";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function App() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apps, setApps] = useState([]);
  const [filterApp, setFilterApp] = useState("");

  useEffect(() => {
    fetchReports();
  }, [filterApp]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = filterApp
        ? `${API_URL}/api/bug-reports?appName=${encodeURIComponent(filterApp)}`
        : `${API_URL}/api/bug-reports`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch reports");

      const data = await response.json();
      setReports(data);

      // Extract unique apps for filter if we're doing the initial full load
      if (!filterApp && apps.length === 0) {
        const uniqueApps = [...new Set(data.map((r) => r.appName))];
        setApps(uniqueApps);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Bug Reports</h1>

        <div className="filter-group">
          <label htmlFor="app-filter">Filter by App:</label>
          <select
            id="app-filter"
            className="filter-select"
            value={filterApp}
            onChange={(e) => setFilterApp(e.target.value)}
          >
            <option value="">All Applications ({apps.length})</option>
            {apps.map((app) => (
              <option key={app} value={app}>
                {app}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && <div style={{ color: "red", marginBottom: 20 }}>{error}</div>}

      {loading ? (
        <div className="loader"></div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <h3>No bug reports found</h3>
          <p>Reports will appear here once submitted from the plugin.</p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report._id || report.id} className="report-card">
              <div className="video-container">
                <video controls src={report.videoUrl} preload="metadata">
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="card-content">
                <div className="card-top">
                  <span className="app-badge">{report.appName}</span>
                  <span className="timestamp">
                    {new Date(report.reportedAt).toLocaleDateString()}{" "}
                    {new Date(report.reportedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <h3 className="report-title">{report.title}</h3>

                {report.pageUrl && (
                  <a
                    href={report.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="report-url"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    {new URL(report.pageUrl).pathname}
                  </a>
                )}

                {report.notes && (
                  <div className="report-notes">{report.notes}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
