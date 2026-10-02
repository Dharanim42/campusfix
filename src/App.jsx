import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [page, setPage] = useState("home");

  const [form, setForm] = useState({
    name: "",
    email: "",
    problemType: "",
    block: "",
    floor: "",
    roomNumber: "",
    location: "",
    description: "",
    priority: "Medium",
    photo: null,
  });

  const [complaintId, setComplaintId] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [trackingId, setTrackingId] = useState("");

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);

  const [complaints, setComplaints] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [problemFilter, setProblemFilter] = useState("All");
  const [blockFilter, setBlockFilter] = useState("All");

  const [message, setMessage] = useState("");

  // ---------------- STUDENT FORM ----------------

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photo") {
      setForm({
        ...form,
        photo: files[0],
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.problemType ||
      !form.block ||
      !form.floor ||
      !form.roomNumber ||
      !form.location ||
      !form.description
    ) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("problemType", form.problemType);
      formData.append("block", form.block);
      formData.append("floor", form.floor);
      formData.append("roomNumber", form.roomNumber);
      formData.append("location", form.location);
      formData.append("description", form.description);
      formData.append("priority", form.priority);

      if (form.photo) {
        formData.append("photo", form.photo);
      }

      const response = await fetch(API_URL + "/complaints", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Complaint submission failed");
      }

      setComplaintId(data.complaint?._id || data._id || "");

      setForm({
        name: "",
        email: "",
        problemType: "",
        block: "",
        floor: "",
        roomNumber: "",
        location: "",
        description: "",
        priority: "Medium",
        photo: null,
      });

      setPage("success");
    } catch (error) {
      console.error(error);
      alert("Complaint submission failed. Please check server.");
    }
  };

  // ---------------- TRACK COMPLAINT ----------------

  const trackComplaint = async () => {
    if (!trackingId.trim()) {
      alert("Please enter Complaint ID.");
      return;
    }

    try {
      const response = await fetch(
        API_URL + "/complaints/" + trackingId.trim()
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Complaint not found");
        return;
      }

      setTrackingData(data);
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  // ---------------- ADMIN LOGIN ----------------

  const adminLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(API_URL + "/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid admin credentials");
        return;
      }

      setAdminLoggedIn(true);
      setAdminEmail("");
      setAdminPassword("");
      setPage("admin");
      loadComplaints();
    } catch (error) {
      console.error(error);
      alert("Unable to connect to server.");
    }
  };

  // ---------------- LOAD COMPLAINTS ----------------

  const loadComplaints = async () => {
    try {
      const response = await fetch(API_URL + "/complaints");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load complaints");
      }

      setComplaints(data);
    } catch (error) {
      console.error(error);
      alert("Unable to load complaints.");
    }
  };

  useEffect(() => {
    if (adminLoggedIn) {
      loadComplaints();
    }
  }, [adminLoggedIn]);

  // ---------------- STATUS UPDATE ----------------

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(API_URL + "/complaints/" + id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Status update failed");
        return;
      }

      loadComplaints();
    } catch (error) {
      console.error(error);
      alert("Unable to update status.");
    }
  };

  // ---------------- PRIORITY UPDATE ----------------

  const updatePriority = async (id, priority) => {
    try {
      const response = await fetch(
        API_URL + "/complaints/" + id + "/priority",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priority: priority,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Priority update failed");
        return;
      }

      loadComplaints();
    } catch (error) {
      console.error(error);
      alert("Unable to update priority.");
    }
  };

  // ---------------- FILTER DATA ----------------

  const uniqueProblems = [
    ...new Set(
      complaints
        .map((item) => item.problemType)
        .filter((item) => item)
    ),
  ];

  const uniqueBlocks = [
    ...new Set(
      complaints
        .map((item) => item.block)
        .filter((item) => item)
    ),
  ];

  const filteredComplaints = complaints.filter((complaint) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      complaint.name?.toLowerCase().includes(searchText) ||
      complaint.email?.toLowerCase().includes(searchText) ||
      complaint.problemType?.toLowerCase().includes(searchText) ||
      complaint.block?.toLowerCase().includes(searchText) ||
      complaint.roomNumber?.toLowerCase().includes(searchText) ||
      complaint.location?.toLowerCase().includes(searchText) ||
      complaint._id?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      complaint.status === statusFilter;

    const matchesProblem =
      problemFilter === "All" ||
      complaint.problemType === problemFilter;

    const matchesBlock =
      blockFilter === "All" ||
      complaint.block === blockFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProblem &&
      matchesBlock
    );
  });

  // ---------------- COUNTS ----------------

  const totalComplaints = complaints.length;

  const pendingCount = complaints.filter(
    (item) => item.status === "Pending"
  ).length;

  const progressCount = complaints.filter(
    (item) => item.status === "In Progress"
  ).length;

  const resolvedCount = complaints.filter(
    (item) => item.status === "Resolved"
  ).length;

  // ---------------- HOME PAGE ----------------

  if (page === "home") {
    return (
      <div className="app-container">
        <header className="navbar">
          <div className="logo">CampusFix</div>

          <button
            className="nav-button"
            onClick={() => setPage("track")}
          >
            Track Complaint
          </button>
        </header>

        <main className="home-page">
          <div className="hero-section">
            <p className="small-title">SMART CAMPUS SUPPORT</p>

            <h1>
              Report. Track.
              <br />
              <span>Fix.</span>
            </h1>

            <p className="hero-text">
              CampusFix helps students report campus issues
              and lets maintenance teams manage them easily.
            </p>
          </div>

          <div className="role-container">
            <div className="role-card">
              <div className="role-icon">🎓</div>

              <h2>Student</h2>

              <p>
                Report classroom, lab, hostel and campus
                maintenance issues.
              </p>

              <button
                className="primary-button"
                onClick={() => setPage("student")}
              >
                Report an Issue
              </button>

              <button
                className="secondary-button"
                onClick={() => setPage("track")}
              >
                Track My Complaint
              </button>
            </div>

            <div className="role-card">
              <div className="role-icon">🛠️</div>

              <h2>Maintenance</h2>

              <p>
                View complaints, update priority and manage
                issue status.
              </p>

              <button
                className="primary-button"
                onClick={() => setPage("login")}
              >
                Maintenance Login
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------------- STUDENT PAGE ----------------

  if (page === "student") {
    return (
      <div className="app-container">
        <header className="navbar">
          <div className="logo">CampusFix</div>

          <button
            className="nav-button"
            onClick={() => setPage("home")}
          >
            Home
          </button>
        </header>

        <main className="form-page">
          <div className="form-header">
            <p className="small-title">STUDENT PORTAL</p>

            <h1>Report an Issue</h1>

            <p>
              Tell us about the problem and our maintenance
              team will take care of it.
            </p>
          </div>

          <form
            className="complaint-form"
            onSubmit={submitComplaint}
          >
            <div className="form-section">
              <h3>Student Information</h3>

              <div className="form-grid">
                <div className="input-group">
                  <label>Name *</label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="input-group">
                  <label>Email *</label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Issue Details</h3>

              <div className="form-grid">
                <div className="input-group">
                  <label>Problem Type *</label>

                  <select
                    name="problemType"
                    value={form.problemType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select problem type</option>
                    <option value="Light Problem">
                      Light Problem
                    </option>
                    <option value="Fan Problem">
                      Fan Problem
                    </option>
                    <option value="Projector Problem">
                      Projector Problem
                    </option>
                    <option value="Computer Problem">
                      Computer Problem
                    </option>
                    <option value="Wi-Fi Problem">
                      Wi-Fi Problem
                    </option>
                    <option value="Bench Problem">
                      Bench Problem
                    </option>
                    <option value="Water Problem">
                      Water Problem
                    </option>
                    <option value="Electrical Problem">
                      Electrical Problem
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Priority</label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleInputChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Location</h3>

              <div className="form-grid">
                <div className="input-group">
                  <label>Block *</label>

                  <input
                    type="text"
                    name="block"
                    value={form.block}
                    onChange={handleInputChange}
                    placeholder="Example: Block A"
                  />
                </div>

                <div className="input-group">
                  <label>Floor *</label>

                  <input
                    type="text"
                    name="floor"
                    value={form.floor}
                    onChange={handleInputChange}
                    placeholder="Example: 2nd Floor"
                  />
                </div>

                <div className="input-group">
                  <label>Room / Class No. *</label>

                  <input
                    type="text"
                    name="roomNumber"
                    value={form.roomNumber}
                    onChange={handleInputChange}
                    placeholder="Example: CSE Lab 2"
                  />
                </div>

                <div className="input-group">
                  <label>Area / Location *</label>

                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    placeholder="Example: Sports Ground"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Description</h3>

              <div className="input-group">
                <label>Describe the Problem *</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Explain what happened..."
                  rows="5"
                ></textarea>
              </div>

              <div className="input-group">
                <label>Upload Photo</label>

                <input
                  type="file"
                  id="photo"
                  name="photo"
                  accept="image/*"
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <button
              type="submit"
              className="submit-button"
            >
              Submit Complaint
            </button>
          </form>
        </main>
      </div>
    );
  }

  // ---------------- SUCCESS PAGE ----------------

  if (page === "success") {
    return (
      <div className="app-container">
        <main className="success-page">
          <div className="success-card">
            <div className="success-icon">✓</div>

            <h1>Complaint Submitted!</h1>

            <p>
              Your complaint has been successfully submitted
              to the maintenance team.
            </p>

            <div className="complaint-id-box">
              <span>Complaint ID</span>

              <strong>{complaintId}</strong>
            </div>

            <p className="small-note">
              Save this ID to track your complaint.
            </p>

            <button
              className="primary-button"
              onClick={() => {
                setTrackingId(complaintId);
                setTrackingData(null);
                setPage("track");
              }}
            >
              Track Complaint
            </button>

            <button
              className="secondary-button"
              onClick={() => setPage("home")}
            >
              Back to Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ---------------- TRACK PAGE ----------------

  if (page === "track") {
    return (
      <div className="app-container">
        <header className="navbar">
          <div className="logo">CampusFix</div>

          <button
            className="nav-button"
            onClick={() => setPage("home")}
          >
            Home
          </button>
        </header>

        <main className="track-page">
          <div className="track-card">
            <p className="small-title">STUDENT PORTAL</p>

            <h1>Track Complaint</h1>

            <p>
              Enter your complaint ID to check the current
              status.
            </p>

            <div className="input-group">
              <label>Complaint ID</label>

              <input
                type="text"
                value={trackingId}
                onChange={(e) =>
                  setTrackingId(e.target.value)
                }
                placeholder="Enter Complaint ID"
              />
            </div>

            <button
              className="primary-button full-width"
              onClick={trackComplaint}
            >
              Track Complaint
            </button>

            {trackingData && (
              <div className="tracking-result">
                <div className="tracking-header">
                  <h3>Complaint Details</h3>

                  <span
                    className={
                      "status-badge " +
                      trackingData.status
                        ?.toLowerCase()
                        .replace(" ", "-")
                    }
                  >
                    {trackingData.status}
                  </span>
                </div>

                <div className="detail-row">
                  <span>Complaint ID</span>
                  <strong>{trackingData._id}</strong>
                </div>

                <div className="detail-row">
                  <span>Problem</span>
                  <strong>
                    {trackingData.problemType}
                  </strong>
                </div>

                <div className="detail-row">
                  <span>Block</span>
                  <strong>{trackingData.block}</strong>
                </div>

                <div className="detail-row">
                  <span>Floor</span>
                  <strong>{trackingData.floor}</strong>
                </div>

                <div className="detail-row">
                  <span>Room / Class</span>
                  <strong>
                    {trackingData.roomNumber}
                  </strong>
                </div>

                <div className="detail-row">
                  <span>Location</span>
                  <strong>{trackingData.location}</strong>
                </div>

                <div className="detail-row">
                  <span>Priority</span>
                  <strong>{trackingData.priority}</strong>
                </div>

                <div className="detail-row">
                  <span>Description</span>
                  <strong>
                    {trackingData.description}
                  </strong>
                </div>

                {trackingData.photoUrl && (
                  <div className="photo-preview">
                    <p>Complaint Photo</p>

                    <img
                      src={trackingData.photoUrl}
                      alt="Complaint"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ---------------- ADMIN LOGIN ----------------

  if (page === "login") {
    return (
      <div className="app-container">
        <header className="navbar">
          <div className="logo">CampusFix</div>

          <button
            className="nav-button"
            onClick={() => setPage("home")}
          >
            Home
          </button>
        </header>

        <main className="login-page">
          <div className="login-card">
            <div className="role-icon">🛠️</div>

            <p className="small-title">
              MAINTENANCE PORTAL
            </p>

            <h1>Maintenance Login</h1>

            <p>
              Login to manage campus complaints.
            </p>

            <form onSubmit={adminLogin}>
              <div className="input-group">
                <label>Email</label>

                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) =>
                    setAdminEmail(e.target.value)
                  }
                  placeholder="admin@campusfix.com"
                />
              </div>

              <div className="input-group">
                <label>Password</label>

                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) =>
                    setAdminPassword(e.target.value)
                  }
                  placeholder="Enter password"
                />
              </div>

              <button
                type="submit"
                className="primary-button full-width"
              >
                Login
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ---------------- ADMIN DASHBOARD ----------------

  if (page === "admin") {
    return (
      <div className="admin-page">
        <header className="admin-navbar">
          <div>
            <div className="logo">CampusFix</div>

            <span>Maintenance Dashboard</span>
          </div>

          <button
            className="logout-button"
            onClick={() => {
              setAdminLoggedIn(false);
              setPage("home");
            }}
          >
            Logout
          </button>
        </header>

        <main className="dashboard">
          <div className="dashboard-heading">
            <div>
              <p className="small-title">
                MAINTENANCE PORTAL
              </p>

              <h1>Complaint Dashboard</h1>

              <p>
                Manage and track all campus maintenance
                complaints.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={loadComplaints}
            >
              ↻ Refresh
            </button>
          </div>

          {/* STATS */}

          <div className="stats-grid">
            <div className="stat-card">
              <span>Total Complaints</span>

              <strong>{totalComplaints}</strong>
            </div>

            <div className="stat-card">
              <span>Pending</span>

              <strong>{pendingCount}</strong>
            </div>

            <div className="stat-card">
              <span>In Progress</span>

              <strong>{progressCount}</strong>
            </div>

            <div className="stat-card">
              <span>Resolved</span>

              <strong>{resolvedCount}</strong>
            </div>
          </div>

          {/* FILTERS */}

          <div className="filter-panel">
            <div className="search-box">
              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search complaints..."
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">
                In Progress
              </option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={problemFilter}
              onChange={(e) =>
                setProblemFilter(e.target.value)
              }
            >
              <option value="All">
                All Problem Types
              </option>

              {uniqueProblems.map((problem) => (
                <option key={problem} value={problem}>
                  {problem}
                </option>
              ))}
            </select>

            <select
              value={blockFilter}
              onChange={(e) =>
                setBlockFilter(e.target.value)
              }
            >
              <option value="All">All Blocks</option>

              {uniqueBlocks.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </select>
          </div>

          {/* COMPLAINT LIST */}

          <div className="complaints-section">
            <div className="section-heading">
              <h2>Complaints</h2>

              <span>
                {filteredComplaints.length} result(s)
              </span>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="empty-state">
                <div>📋</div>

                <h3>No complaints found</h3>

                <p>
                  Try changing the search or filters.
                </p>
              </div>
            ) : (
              <div className="complaints-list">
                {filteredComplaints.map((complaint) => (
                  <div
                    className="complaint-card"
                    key={complaint._id}
                  >
                    <div className="complaint-top">
                      <div>
                        <span className="complaint-number">
                          Complaint #
                          {complaint._id.slice(-6)}
                        </span>

                        <h3>
                          {complaint.problemType}
                        </h3>
                      </div>

                      <span
                        className={
                          "status-badge " +
                          complaint.status
                            ?.toLowerCase()
                            .replace(" ", "-")
                        }
                      >
                        {complaint.status}
                      </span>
                    </div>

                    <div className="complaint-info-grid">
                      <div>
                        <span>Student</span>

                        <strong>
                          {complaint.name}
                        </strong>
                      </div>

                      <div>
                        <span>Email</span>

                        <strong>
                          {complaint.email}
                        </strong>
                      </div>

                      <div>
                        <span>Block</span>

                        <strong>
                          {complaint.block || "-"}
                        </strong>
                      </div>

                      <div>
                        <span>Floor</span>

                        <strong>
                          {complaint.floor || "-"}
                        </strong>
                      </div>

                      <div>
                        <span>Room / Class</span>

                        <strong>
                          {complaint.roomNumber || "-"}
                        </strong>
                      </div>

                      <div>
                        <span>Location</span>

                        <strong>
                          {complaint.location || "-"}
                        </strong>
                      </div>
                    </div>

                    <div className="description-box">
                      <span>Description</span>

                      <p>{complaint.description}</p>
                    </div>

                    <div className="complaint-actions">
                      <div className="action-group">
                        <label>Priority</label>

                        <select
                          value={
                            complaint.priority || "Medium"
                          }
                          onChange={(e) =>
                            updatePriority(
                              complaint._id,
                              e.target.value
                            )
                          }
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">
                            Medium
                          </option>
                          <option value="High">High</option>
                        </select>
                      </div>

                      <div className="action-group">
                        <label>Status</label>

                        <select
                          value={
                            complaint.status || "Pending"
                          }
                          onChange={(e) =>
                            updateStatus(
                              complaint._id,
                              e.target.value
                            )
                          }
                        >
                          <option value="Pending">
                            Pending
                          </option>

                          <option value="In Progress">
                            In Progress
                          </option>

                          <option value="Resolved">
                            Resolved
                          </option>
                        </select>
                      </div>
                    </div>

                    {complaint.photoUrl && (
                      <div className="admin-photo">
                        <span>Complaint Photo</span>

                        <img
                          src={complaint.photoUrl}
                          alt="Complaint"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return null;
}

export default App;