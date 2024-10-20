import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./Interview.css";
import castroImage from '../assets/castro.png';

const Interview = () => {
  const { moduleId } = useParams();
  const location = useLocation();
  const [moduleName, setModuleName] = useState("");
  const [caseAbstract, setCaseAbstract] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [status, setStatus] = useState("Idle");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const interviewId = location.state?.interviewId;
  const userId = location.state?.userId;
  const recordingTimeoutRef = useRef(null);
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment
    ? import.meta.env.VITE_API_BASE_URL_LOCAL
    : import.meta.env.VITE_API_BASE_URL_PROD;

  const backendUrl = baseUrl;

  useEffect(() => {
    const fetchModuleName = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/modules/${moduleId}/`);
        const data = await response.json();
        setModuleName(data.modulename);
        setCaseAbstract(data.case_abstract);
        setSystemPrompt(data.system_prompt);
        setPrompt(data.prompt);
        setFiles(data.file || {});
      } catch (error) {
        console.error("Error fetching module name:", error);
      }
    };

    fetchModuleName();
  }, [moduleId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === " ") {
        event.preventDefault();
        toggleRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRecording]);

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/mp3",
        });
        handleUpload(audioBlob);
        audioChunksRef.current = [];
        streamRef.current.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus("Listening");

      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 20000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    clearTimeout(recordingTimeoutRef.current);
    setIsRecording(false);
    setStatus("Listening");
  };

  const getLocalTimeInIsoFormat = () => {
    const now = new Date();
    const timezoneOffsetInMinutes = now.getTimezoneOffset();
    const localTime = new Date(
      now.getTime() - timezoneOffsetInMinutes * 60 * 1000
    );
    return localTime.toISOString().slice(0, 19).replace("T", " ");
  };

  const handleUpload = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "user_audio.mp3");
    formData.append("module_id", moduleId);
    formData.append("system_prompt", systemPrompt);
    formData.append("prompt", prompt);
    formData.append("interview_id", interviewId);
    formData.append("user_id", userId);

    const uploadStartTime = getLocalTimeInIsoFormat();
    console.log(uploadStartTime);

    try {
      await fetch(`${backendUrl}/api/add_timestamp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interview_id: interviewId,
          event: "audio_upload_start",
          timestamp: uploadStartTime,
        }),
      });

      setIsLoading(true);

      const response = await fetch(`${backendUrl}/api/process_audio/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload audio");
      }

      const data = await response.json();

      if (data.speech_file_url) {
        playAudio(data.speech_file_url);
      }
    } catch (error) {
      console.error("Error uploading the audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (audioUrl) => {
    const audio = new Audio(audioUrl);
    setIsPlaying(true);
    setStatus("Live");

    try {
      audio.play();
      const playbackEndTime = getLocalTimeInIsoFormat();
      console.log(playbackEndTime);

      await fetch(`${backendUrl}/api/add_timestamp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interview_id: interviewId,
          event: "audio_playback_end",
          timestamp: playbackEndTime,
        }),
      });

      audio.onended = async () => {
        setIsPlaying(false);
        setIsLoading(false);
        setStatus("Idle");
        await fetch(`${backendUrl}/api/delete_tts_file/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio_url: audioUrl,
          }),
        });
      };
    } catch (playError) {
      console.error("Audio playback failed:", playError);
      setIsPlaying(false);
      setIsLoading(false);
      setStatus("Idle");
    }
  };

  const handleExit = async () => {
    const userConfirmed = window.confirm(
      "Are you sure you want to exit the interview?"
    );
    if (!userConfirmed) return;

    console.log("Interview ID:", interviewId);

    try {
      await fetch(`${backendUrl}/api/store_interview_length/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interview_id: interviewId,
        }),
      });

      navigate("/module");
    } catch (error) {
      console.error("Error during exit:", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  const handleDownload = async (fileUrl, fileName) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch the file");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };
  

  return (
    <div className="audio-recorder">
      <p>Please ensure your microphone is enabled</p>
      <h1>{moduleName}</h1>
      <img
        src={castroImage} // Replace with actual patient image URL if available
        alt={moduleName}
        className="patient-image"
      />
      <p>Status: <strong>{status}</strong></p>
      <p>{caseAbstract}</p>

      {Object.keys(files).length > 0 ? (
        <button onClick={toggleSidebar} className="attachment-button">
          {isSidebarOpen ? "Close Attachments" : "See Attachments"}
        </button>
      ) : (
        <p>Attachments: N/A</p>
      )}

<div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      <button className="close-sidebar" onClick={toggleSidebar}>
        X
      </button>
      <h4>Attachments:</h4>
      {Object.entries(files).map(([fileName, fileUrl], index) => (
        <a
          key={index}
          onClick={() => handleDownload(fileUrl, fileName)}
          className="attachment-link"
        >
          {fileName}
        </a>
      ))}
    </div>

      <div className="button-container">
        <button
          className={`record-button ${
            isLoading || isPlaying ? "processing" : ""
          }`}
          onClick={toggleRecording}
          disabled={isLoading || isPlaying}
        >
          {isRecording ? "Click to Stop Speaking" : isLoading || isPlaying ? "Processing..." : "Click to Speak"}
        </button>
        <button
          className="exit-button"
          onClick={handleExit}
          disabled={isLoading || isPlaying}
        >
          End Interview
        </button>
      </div>
      <p>Tip: You can press the spacebar to start the interview or start speaking</p>
    </div>
  );
};

export default Interview;
