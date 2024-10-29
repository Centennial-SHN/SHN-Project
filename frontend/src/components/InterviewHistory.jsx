import React, { useEffect, useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";
import Cookies from 'js-cookie';
import NavBar from "./NavBar";
import { Typography, Layout, Space } from 'antd';

const { Title } = Typography;
const { Content } = Layout;

const InterviewHistory = () => {
  const [interviews, setInterviews] = useState([]);
  const { userid } = useParams();
  const navigate = useNavigate();
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;
  // const [menuOpen, setMenuOpen] = useState(false); // State for toggling the menu
  // const [iconColor, setIconColor] = useState("black");
  const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';

  // const [isChangePasswordOpen, setChangePasswordOpen] = useState(false);

  const backendUrl = baseUrl;
  const csrfToken = Cookies.get('csrftoken');

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

  // const handleLogout = () => {
  //   sessionStorage.removeItem("userId"); // Clear userId from sessionStorage
  //   navigate("/"); // Redirect to login page
  // };

  // const toggleMenu = () => {
  //   setMenuOpen((prev) =>{
  //     setIconColor(prev ? "black" : "#4DBDB1");
  //     return !prev;
  //   });
  // };

  // const handleSwitchToAdmin = () => {
  //   navigate("/admin/module-list"); // Replace with the actual admin route
  // };

  // const toggleChangePasswordModal = () => {
  //   setChangePasswordOpen(!isChangePasswordOpen);
  // };

  // // Function to handle password change
  // const handleChangePassword = async (currentPassword, newPassword) => {
  //   try {
  //     const response = await fetch(`${backendUrl}/api/change-password/`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         'X-CSRFToken': csrfToken
  //       },
  //       credentials: 'include',
  //       body: JSON.stringify({
  //         current_password: currentPassword,
  //         new_password: newPassword,
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to change password");
  //     }

  //     alert("Password changed successfully!");
  //     setChangePasswordOpen(false);
  //   } catch (error) {
  //     console.error("Error changing password:", error);
  //     alert("Failed to change password. Please try again.");
  //   }
  // };


  return (
    <Layout className="layoutInterviewHist">
      <NavBar isAdmin={isAdmin} />
      <Content className="layoutIntHistContent">
      <h1>Your Interview History</h1>
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
      </Content>
      </Layout>
  );
};
export default InterviewHistory;
