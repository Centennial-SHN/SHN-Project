import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { VITE_API_BASE_URL_LOCAL, VITE_API_BASE_URL_PROD } from "../constants";
import NavBar from "./NavBar";
import {
  Button,
  Typography,
  Layout,
  Space,
  Card,
  Row,
  Col,
  Divider,
  Drawer,
  Modal,
} from "antd";
import {
  UserOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined,
  PaperClipOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Content } = Layout;

const Interview = () => {
  const { moduleId } = useParams();
  const location = useLocation();
  const [moduleName, setModuleName] = useState("");
  const [caseAbstract, setCaseAbstract] = useState("");
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
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const interviewId = location.state?.interviewId;
  const userId = location.state?.userId;
  const recordingTimeoutRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const isDevelopment = import.meta.env.MODE === "development";
  const isAdmin = sessionStorage.getItem("isSuperUser") === "true";
  const baseUrl = isDevelopment
    ? VITE_API_BASE_URL_LOCAL
    : VITE_API_BASE_URL_PROD;

  const backendUrl = baseUrl;

  const DEBOUNCE_DELAY = 500;

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
      if (
        event.key === " " &&
        !isRecording &&
        !isRecordingTriggered &&
        !(isLoading || isPlaying)
      ) {
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
    setStatus("Processing");
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

    const formData = new FormData();
    formData.append("audio", audioBlob, "user_audio.mp3");
    formData.append("module_id", moduleId);
    formData.append("interview_id", interviewId);
    formData.append("date_active", date_active);

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
    audioRef.current=audio;
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
        audioRef.current = null;
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
      audioRef.current = null;
    }
  };

  const showExitModal = () => {
    setIsExitModalOpen(true);
  };

  const handleExitOk = async () => {
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

      navigate("/interview-complete", { state: { userId: userId } });
    } catch (error) {
      console.error("Error during exit:", error);
    }
  };

  const handleExitCancel = () => {
    setIsExitModalOpen(false);
  };

  const handleExit = () => {
    showExitModal();
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime=0;
      audioRef.current = null;
      setIsPlaying(false);
      setStatus("Idle");
    }

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
      <NavBar
        isAdmin={isAdmin}
        onNavigateAway={(navigateCallback) => showModal(navigateCallback)}
      />
      <Content className="layoutInterviewContent">
        <Card bordered={false}>
          <Row>
            <Col span={24}>
              <Title
                level={5}
                style={{ color: "#A6A8B9", marginBottom: "48px" }}
              >
                Please ensure your microphone is enabled
              </Title>
            </Col>
          </Row>
          <Row>
            <Col xs={24} md={14} className="interviewCol1">
              <div className={`status-border ${status.toLowerCase()}-status`}>
                <UserOutlined className="userIcon" />
              </div>
              <Space
                direction="horizontal"
                size="middle"
                className={`interviewStatus ${status.toLowerCase()}-status`}
              >
                <span className="dot"></span>
                <Text>{status}</Text>
              </Space>
            </Col>

            <Divider type="vertical" className="interviewDiv" />

            <Col xs={24} md={10} className="interviewCol2">
              <Text className="customH6">{moduleName}</Text>
              <Text style={{ marginBottom: "24px" }}>{caseAbstract}</Text>

              {Object.keys(files).length > 0 ? (
                <Space direction="vertical" size="small" className="attachmentsContainer">
                  <Text className="customH6">Attachments:</Text>
                  {Object.entries(files).map(([fileName], index) => (
                    <a key={index} onClick={toggleSidebar}>
                      {fileName}
                    </a>
                  ))}
                </Space>
              ) : (
                <Space direction="vertical" size="small">
                  <Text className="customH6">Attachments:</Text>
                  <Text>N/A</Text>
                </Space>
              )}
            </Col>
          </Row>
        </Card>

        <Space direction="vertical" className="interviewControl" size="middle">
          <Space
            direction="horizontal"
            size="large"
            style={{ width: "min-content" }}
            className="interviewControlButtons"
          >
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              className={`record-button .mobile-record-button ${
                isLoading || isPlaying ? "processing" : ""
              }`}
              onClick={debounceToggleRecording}
              disabled={isLoading || isPlaying}
            >
              {isRecording ? "Stop Speaking" : "Speak"}
            </Button>
            <Button
              type="primary"
              icon={<CloseCircleOutlined />}
              className="exit-button .mobile-exit-button"
              onClick={handleExit}
              disabled={isLoading || isPlaying}
            >
              End Interview
            </Button>
            {Object.keys(files).length > 0 ? (
              <Button
                type="primary"
                icon={<PaperClipOutlined />}
                onClick={toggleSidebar}
                className="attachment-button"
                shape="circle"
              ></Button>
            ) : (
              <Button
                disabled
                icon={<PaperClipOutlined />}
                onClick={toggleSidebar}
                className="attachment-button"
                shape="circle"
              ></Button>
            )}
          </Space>
          <Title level={5} style={{ color: "#A6A8B9", marginBottom: "0px" }}>
            Tips:
            <br />
            You can press or hold the spacebar to start the interview or start
            speaking.
            <br />
            To end the interview and save your transcript, click on the
            &quot;End Interview&quot; button.
          </Title>
        </Space>
        <Drawer
          title="Attachments"
          placement="right"
          onClose={toggleSidebar}
          open={isSidebarOpen}
        >
          {Object.entries(files).map(([fileName, fileUrl], index) => (
            <a key={index} onClick={() => handleDownload(fileUrl, fileName)}>
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
          <p>
            Are you sure you want to navigate away from this page?
            <br />
            Without clicking the Exit Interview button, the interview transcript
            won&#39;t be saved.
          </p>
        </Modal>

        <Modal
          title="End Interview?"
          open={isExitModalOpen}
          onOk={handleExitOk}
          onCancel={handleExitCancel}
          okText="End"
          cancelText="Cancel"
        >
          <p>
            Are you sure you want to end the interview? <br />
            Your transcript will be saved and will be accessible on the
            Interview History page.
          </p>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Interview;
