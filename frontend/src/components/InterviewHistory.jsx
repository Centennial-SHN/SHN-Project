import React, { useEffect, useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";

const InterviewHistory = () => {
  const [interviews, setInterviews] = useState([]);
  const { userid } = useParams();
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
  const [menuOpen, setMenuOpen] = useState(false); // State for toggling the menu
  const [iconColor, setIconColor] = useState("black");
  const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';

  const backendUrl = baseUrl;

  const checkIfLoggedIn = () => {
    const storedUserId = sessionStorage.getItem("userId"); // Get userid from sessionStorage
    return storedUserId === userid; // Compare it with the userid from params
  };

  useEffect(() => {
    console.log(checkIfLoggedIn())
    if (!checkIfLoggedIn()) {
      navigate("/"); // Redirect to login page if not authenticated
      return;
    }

    const fetchInterviews = async () => {
      try {
        const response = await fetch(
          `${backendUrl}/api/interview_history/${userid}/`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch interview history");
        }

        const data = await response.json();

        const filteredInterviews = data.filter(
          (interview) => interview.interviewlength !== "0:00:00"
        );
        setInterviews(filteredInterviews);
      } catch (error) {
        console.error("Error fetching interview history:", error);
      }
    };

    fetchInterviews();
  }, [userid, backendUrl]);

  const handleDownloadTranscript = async (interviewId) => {
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
      link.setAttribute("download", `transcript_${interviewId}.csv`); // Updated to .csv
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading transcript:", error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId"); // Clear userId from sessionStorage
    navigate("/"); // Redirect to login page
  };

  const toggleMenu = () => {
    setMenuOpen((prev) =>{
      setIconColor(prev ? "black" : "#4DBDB1");
      return !prev;
    });
  };

  const handleSwitchToAdmin = () => {
    navigate("/admin/module-list"); // Replace with the actual admin route
  };

  return (
    <div className="interview-history">
      <header>
        <nav>
          <div className="hamburger" onClick={toggleMenu}>
            <FontAwesomeIcon icon={faBars} size="2x" color={iconColor} /> {/* Use iconColor state */}
          </div>
          <ul className={`nav-menu ${menuOpen ? "show" : ""}`}>
            {/* <li onClick={() => navigate(`/interview-history/${userid}`)}>Interview History</li> */}
            <li onClick={() => navigate("/module")}>Select Module</li>
            <li onClick={() => navigate("/reset-password")}>Reset Password</li>
            {isAdmin && ( // This line ensures the "Switch to Admin" item is shown only to admin users
                <li onClick={handleSwitchToAdmin}>Switch to Admin</li>
            )}
            <li onClick={handleLogout}>Logout</li>
          </ul>
        </nav>
      </header>
      <h1>{userid} Interview History</h1>
      {interviews.length === 0 ? (
        <p>No interviews found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Module Name</th>
              <th>Interview Length</th>
              <th>Transcript</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((interview, index) => (
              <tr key={index}>
                <td>{interview.dateactive}</td>
                <td>{interview.modulename}</td>
                <td>{interview.interviewlength}</td>
                <td>
                  <button
                    onClick={() =>
                      handleDownloadTranscript(interview.interviewid)
                    }
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
export default InterviewHistory;
