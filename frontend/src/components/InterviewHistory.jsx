import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";

const InterviewHistory = () => {
  const [interviews, setInterviews] = useState([]);
  const { userid } = useParams(); 
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;

  const backendUrl = baseUrl;

  useEffect(() => {
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
      link.setAttribute("download", `transcript_${interviewId}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading transcript:", error);
    }
  };

  return (
    <div className="interview-history">
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
