import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation  } from "react-router-dom";

const Interview = () => {
  const { moduleId } = useParams();
  const location = useLocation();  
  const [moduleName, setModuleName] = useState("");  
  const [caseAbstract, setCaseAbstract] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(""); 
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  
  const [isPlaying, setIsPlaying] = useState(false); 
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const navigate = useNavigate();
  const interviewId = location.state?.interviewId;
  const userId = location.state?.userId;
  const isDevelopment = import.meta.env.MODE === "development";
  const baseUrl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

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
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleUpload = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "user_audio.mp3");
    formData.append("module_id", moduleId);  
    formData.append("system_prompt", systemPrompt);  
    formData.append("prompt", prompt);
    formData.append("interview_id", interviewId); 
    formData.append("user_id", userId);

    try {
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
    }
  };

  const playAudio = (audioUrl) => {
    const audio = new Audio(audioUrl);
    setIsPlaying(true);  
    try {
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);  
        setIsLoading(false);  
      };
    } catch (playError) {
      console.error("Audio playback failed:", playError);
      setIsPlaying(false); 
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/download_transcript/${interviewId}/`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to download transcript");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transcript_${interviewId}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading transcript:", error);
    }
  };

  // const handleExit = async () => {
  //   try {
  //     const response = await fetch(`{backendUrl}/api/clear_audio_files/`, {  
  //       method: "POST",
  //     });
  
  //     if (!response.ok) {
  //       throw new Error("Failed to clear audio files");
  //     }
  
  //     navigate("/");
  //   } catch (error) {
  //     console.error("Error during exit:", error);
  //   }
  // };
  

  return (
    <div className="audio-recorder">
      <p>Please ensure your microphone is enabled</p>
      <h1>{moduleName}</h1>
      <p>{caseAbstract}</p>
      <button 
        className={`record-button ${isLoading || isPlaying ? 'processing' : ''}`} 
        onClick={toggleRecording}
        disabled={isLoading || isPlaying}  
      >
        {isRecording 
          ? "Click to Stop Speaking"
          : isLoading || isPlaying 
            ? "Processing..."  
            : "Click to Speak"}
      </button>
      <h6>The button can be controlled with a mouse click or by pressing the space bar.</h6>
      <button className='exit-button' onClick={handleDownload}>
        Download Transcript
      </button>
      {/* <button className='exit-button' onClick={handleExit}>
        Exit
      </button> */}
    </div>
  );
};

export default Interview;
