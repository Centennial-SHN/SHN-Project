import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const Interview = () => {
  const { moduleId } = useParams();  
  const [moduleName, setModuleName] = useState("");  
  const [caseAbstract, setCaseAbstract] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(""); 
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    const fetchModuleName = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/modules/${moduleId}/`);
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

    try {
      setIsLoading(true);  
      const response = await fetch("http://localhost:8000/api/process_audio/", {
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

  const playAudio = (audioUrl) => {
    const audio = new Audio(audioUrl);
    try {
      audio.play();
    } catch (playError) {
      console.error("Audio playback failed:", playError);
    }
  };

  return (
    <div className="audio-recorder">
      <p>Please ensure your microphone is enabled</p>
      <h1>{moduleName}</h1>
      <p>{caseAbstract}</p>
      <button 
        className="record-button" 
        onClick={toggleRecording}
        disabled={isLoading}  
      >
        {isRecording 
          ? "Stop Speaking" 
          : isLoading 
            ? "Waiting for the response..."  
            : "Speak Now"}
      </button>
    </div>
  );
};

export default Interview;
