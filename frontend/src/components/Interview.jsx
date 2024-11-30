import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
// import "./Interview.css";
import castroImage from '../assets/castro.png';
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";
import NavBar from "./NavBar";
import { Button, Typography, Layout, Space, Card, Row, Col, Divider, Drawer, Modal } from 'antd';
import { UserOutlined, PlayCircleOutlined, CloseCircleOutlined, PaperClipOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Content } = Layout;

const Interview = () => {
  const { moduleId } = useParams();
  const location = useLocation();
  const [moduleName, setModuleName] = useState("");
  const [caseAbstract, setCaseAbstract] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [files, setFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [status, setStatus] = useState("Idle");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const interviewId = location.state?.interviewId;
  const userId = location.state?.userId;
  const recordingTimeoutRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const isDevelopment = import.meta.env.MODE === "development";
  const isAdmin = sessionStorage.getItem('isSuperUser') === 'true';
  const baseUrl = isDevelopment ? VITE_API_BASE_URL_LOCAL : VITE_API_BASE_URL_PROD;

  const backendUrl = baseUrl;

  const DEBOUNCE_DELAY = 500;

  const updateConversationHistory = (newMessage) => {
    setConversationHistory((prevHistory) => [...prevHistory, newMessage]);
  };

  useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  useEffect(() => {
    const fetchModuleName = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/modules/${moduleId}/`);
        const data = await response.json();
        setModuleName(data.modulename);
        setCaseAbstract(data.case_abstract);
        setFiles(data.file || {});
      } catch (error) {
        console.error("Error fetching module name:", error);
      }
    };

    fetchModuleName();
  }, [moduleId]);

  useEffect(() => {
    let holdTimeoutRef = null;
    let isRecordingTriggered = false;

    const handleKeyDown = (event) => {
      if (event.key === " " && !isRecording && !isRecordingTriggered && !(isLoading || isPlaying)) {
        event.preventDefault();

        isRecordingTriggered = true;

        holdTimeoutRef = setTimeout(() => {
          startRecording();
        }, 500);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === " ") {
        event.preventDefault();

        if (holdTimeoutRef) {
          clearTimeout(holdTimeoutRef);
          holdTimeoutRef = null;
        }

        if (isRecording) {
          stopRecording();
        }

        isRecordingTriggered = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (holdTimeoutRef) {
        clearTimeout(holdTimeoutRef);
      }
    };
  }, [isRecording, isLoading, isPlaying]);


  const debounceToggleRecording = () => {
    clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(() => {
      toggleRecording();
    }, DEBOUNCE_DELAY);
  };

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
      }, 600000); // Automatically stop recording after 10 minutes
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
    setStatus("Idle");
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
    const date_active = getLocalTimeInIsoFormat();
    const multiAgentMode = sessionStorage.getItem("isMultipleInterviewees") === "true";

    const formData = new FormData();
    formData.append("audio", audioBlob, "user_audio.mp3");
    formData.append("module_id", moduleId);
    formData.append("interview_id", interviewId);
    formData.append("date_active", date_active);
    formData.append("multi_agent_mode", multiAgentMode);

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
      const updatedConversationHistory = data.conversation_history;

      if (updatedConversationHistory) {
        // Update the conversation history in your component's state
        setConversationHistory(updatedConversationHistory);
      }

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

  const showExitModal = () => {
    setIsExitModalOpen(true);
  };

  const handleExitOk = async () => {
    // const userConfirmed = window.confirm(
    //   "Are you sure you want to exit the interview?"
    // );
    // if (!userConfirmed) return;
    setIsExitModalOpen(false);

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

      navigate('/interview-complete', { state: { userId: userId } });
    } catch (error) {
      console.error("Error during exit:", error);
    }
  };

  const handleExitCancel = () => {
    setIsExitModalOpen(false);
  }

  const handleExit = () => {
    showExitModal();
  }

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

  const showModal = (navigationCallback) => {
    setPendingNavigation(() => navigationCallback);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Layout className="layoutInterview">
      <NavBar isAdmin={isAdmin} onNavigateAway={(navigateCallback) => showModal(navigateCallback)} />
      <Content className="layoutInterviewContent">
        <Card bordered={false}>
          <Row>
            <Col span={24}>
              <Title level={5} style={{ color: "#A6A8B9", marginBottom: "48px" }}>Please ensure your microphone is enabled</Title>
            </Col>
          </Row>
          <Row>
            <Col span={14} className="interviewCol1">
              {/* <img
            src={castroImage} // Replace with actual patient image URL if available
            alt={moduleName}
            className="patient-image"
            style={{ width: '200px' }}
          /> */}
              <div className={`status-border ${status.toLowerCase()}-status`}>
                <UserOutlined className="userIcon" />
              </div>
              <Space direction="horizontal" size="middle" className={`interviewStatus ${status.toLowerCase()}-status`}>
                <span className="dot"></span>
                <Text>{status}</Text>
              </Space>
            </Col>
            <Divider type='vertical' className="interviewDiv"></Divider>
            <Col span={10} className="interviewCol2">
              <Text className="customH6">{moduleName}</Text>
              <Text style={{ marginBottom: "24px" }}>{caseAbstract}</Text>
              {conversationHistory.length > 0 && (
  <Card className="chatbox">
    {conversationHistory.map((message, index) => (
      <div
        key={index}
        className={`chat-message ${message.role === "user" ? "user-message" : "assistant-message"}`}
      >
        <Text>
          <strong>{message.role === "user" ? "You: " : `${moduleName}: `}</strong>
          {message.content}
        </Text>
      </div>
    ))}
  </Card>
)}

              {/* {Object.keys(files).length > 0 ? (
                <Space direction="vertical" size="small">
                  <Text className="customH6">Attachments:</Text>
                  {Object.entries(files).map(([fileName, fileUrl], index) => (
                    <a
                      key={index}
                      onClick={toggleSidebar}
                    // className="attachment-link"
                    >
                      {fileName}
                    </a>
                  ))}
                </Space>
              ) : (
                <Space direction="vertical" size="small">
                  <Text className="customH6">Attachments:</Text>
                  <Text>N/A</Text>
                </Space>
              )} */}
            </Col>
          </Row>
        </Card>
        <Space direction="vertical" className="interviewControl" size="middle">
          <Space direction="horizontal" size="large" style={{ width: "min-content" }}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              className={`record-button ${isLoading || isPlaying ? "processing" : ""
                }`}
              onClick={debounceToggleRecording}
              disabled={isLoading || isPlaying}
            >
              {isRecording ? "Stop Speaking" : isLoading || isPlaying ? "Processing" : "Speak"}
            </Button>
            <Button
              type="primary"
              icon={<CloseCircleOutlined />}
              className="exit-button"
              onClick={handleExit}
              disabled={isLoading || isPlaying}
            >
              End Interview
            </Button>
            {/* attachment button */}
            {Object.keys(files).length > 0 ? (
              <Button
                type="primary"
                icon={<PaperClipOutlined />}
                onClick={toggleSidebar}
                className="attachment-button"
                shape="circle">
              </Button>
            ) : (
              <Button
                disabled
                icon={<PaperClipOutlined />}
                onClick={toggleSidebar}
                className="attachment-button"
                shape="circle">
              </Button>
            )}

          </Space>
          <Title level={5} style={{ color: "#A6A8B9", marginBottom: '0px' }}>
            Tips:<br />
            You can press or hold the spacebar to start the interview or start speaking.<br />
            To end the interview and save your transcript, click on the "End Interview" button.
          </Title>
        </Space>


        {/*-- Code for drawer --*/}
        {/* <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
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
          </div> */}

        <Drawer
          title="Attachments"
          placement="right"
          onClose={toggleSidebar}
          open={isSidebarOpen}
        >
          {Object.entries(files).map(([fileName, fileUrl], index) => (

            <a
              key={index}
              onClick={() => handleDownload(fileUrl, fileName)}
            >
              <Space direction="horizontal" className="attachment-link">
                {fileName}
                <DownloadOutlined />
              </Space>
            </a>

          ))}
        </Drawer>

        <Modal
          title="Warning— your transcript won't be saved"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          okText="Yes, Leave Page"
          cancelText="Cancel"
        >
          <p>Are you sure you want to navigate away from this page?<br />
            Without clicking the Exit Interview button, the interview transcript won't be saved.</p>
        </Modal>

        <Modal
          title="End Interview?"
          open={isExitModalOpen}
          onOk={handleExitOk}
          onCancel={handleExitCancel}
          okText="End"
          cancelText="Cancel"
        >
          <p>Are you sure you want to end the interview? <br/>
            Your transcript will be saved and will be accessible on the Interview History page.</p>
        </Modal>

      </Content>
    </Layout>
  );
};

export default Interview;
