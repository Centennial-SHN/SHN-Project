import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import './UserAdmin.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";

const UserAdmin = () => {
  const [users, setUsers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false); // State for toggling the menu
  const [iconColor, setIconColor] = useState("black");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
  const backendUrl = baseUrl;

  const hasCheckedSuperuser = useRef(false);

  const checkSuperuser = () => {
    const storedIsSuperuser = sessionStorage.getItem("isSuperUser");
    const storedUserId = sessionStorage.getItem("userId");

    if (!storedIsSuperuser || storedIsSuperuser !== "true" || !storedUserId) {
      alert('Only admins are allowed to access this page.');
      navigate("/");
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!hasCheckedSuperuser.current) {
      hasCheckedSuperuser.current = true;
      if (checkSuperuser()) return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/admin/users/`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        
        const usersWithInterviews = await Promise.all(
          data.map(async (user) => {
            // Log user data to verify user.id
            console.log("User data:", user);

            if (!user.userid) {
              console.error("Error: user.userid is undefined for user:", user);
              return user;
            }

            // Fetch interviews for each user based on userId
            const interviewsResponse = await fetch(`${backendUrl}/api/interview_history/${user.userid}/`);
            if (!interviewsResponse.ok) {
              throw new Error(`Failed to fetch interviews for user ${user.userid}`);
            }
            const interviews = await interviewsResponse.json();
            const filteredInterviews = interviews.filter(
                (interview) => interview.interviewlength !== "0:00:00" // Assuming interview_length is in seconds
              );
            return { ...user, interviews: filteredInterviews }; // Attach interviews to each user object
          })
        );
        setUsers(usersWithInterviews);
      } catch (error) {
        console.error("Error fetching users or interviews:", error);
      }
    };

    fetchUsers();
  }, [backendUrl]);

  const handleLogout = () => {
    sessionStorage.removeItem("userId"); // Clear userId from sessionStorage
    navigate("/"); // Redirect to login page
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => {
      setIconColor(prev ? "black" : "#4DBDB1");
      return !prev;
    });
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadTranscript = async (interviewId) => {
    console.log("Interview ID:", interviewId);
    try {
      const response = await fetch(
        `${backendUrl}/api/download_transcript/${interviewId}/`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download transcript");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transcript_${interviewId}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading transcript:", error);
    }
  };

  const convertTimeToSeconds = (time) => {
    const parts = time.split(":").map(Number);
    let seconds = 0;

    if (parts.length === 3) {
      // HH:MM:SS
      seconds += parts[0] * 3600;
      seconds += parts[1] * 60;
      seconds += parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      seconds += parts[0] * 60;
      seconds += parts[1];
    }

    return seconds;
  };

  // Format total seconds to "HH:MM:SS"
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleShowAllUsers = () => {
    setSearchTerm("");
  };

  return (
    <div className="user-admin">
      <header>
        <nav>
          <div className="hamburger" onClick={toggleMenu}>
            <FontAwesomeIcon icon={faBars} size="2x" color={iconColor} />
          </div>
          <ul className={`nav-menu ${menuOpen ? "show" : ""}`}>
            <li onClick={() => navigate('/admin/module-list')}>Modules</li>
            <li onClick={() => navigate('/admin/user-logs')}>User Logs</li>
            <li onClick={() => navigate(`/module`)}>Switch to user</li>
            <li onClick={() => navigate("/reset-password")}>Reset Password</li>
            <li onClick={handleLogout}>Logout</li>
          </ul>
        </nav>
      </header>
      <h2>User Admin Page</h2>
      <div className="search-container">
      <input className="search-bar"
        type="text"
        placeholder="Search by email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button className="all" onClick={handleShowAllUsers}>All</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Total Interviews</th>
            <th>Total Interview Time</th>
            <th>Interview Logs</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => {
            const totalInterviews = user.interviews.length;
            const totalTime = user.interviews.reduce((acc, interview) => acc + convertTimeToSeconds(interview.interviewlength), 0);

            return (
              <tr key={user.id}>
                <td>
                    <a href="" onClick={() => navigate(`/admin/manage-user/${user.userid}`)}>
                    {user.email}
                  </a></td>
                <td>{totalInterviews}</td>
                <td>{formatTime(totalTime)}</td>
                <td>
                  <ul>
                    {user.interviews.map((interview, index) => (
                      <li key={index}>
                        <p>Date: {interview.date_active}</p>
                        <p>Module: {interview.module_name}</p>
                        <p>Length: {interview.interview_length}</p>
                        <p>
                          Transcript:{" "}
                          <button onClick={() => handleDownloadTranscript(interview.interviewid)}>
                            Download Transcript
                          </button>
                        </p>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserAdmin;