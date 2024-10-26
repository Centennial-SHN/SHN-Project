import React, { useState, useEffect } from 'react';

const WebSocketChat = () => {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [socket, setSocket] = useState(null);

  // This useEffect will handle opening the WebSocket connection
  useEffect(() => {
    // Create a new WebSocket connection
    const ws = new WebSocket(`ws://${window.location.host}/ws/chat/`);

    // Handle incoming WebSocket messages
    ws.onmessage = function (e) {
      const data = JSON.parse(e.data);
      setChatLog((prevLog) => [...prevLog, data.message]);
    };

    // Handle WebSocket closure
    ws.onclose = function (e) {
      console.error('WebSocket closed unexpectedly');
    };

    // Set WebSocket in the state so that we can send messages later
    setSocket(ws);

    // Clean up WebSocket connection on component unmount
    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Function to handle sending a message
  const sendMessage = () => {
    if (socket && message.trim() !== '') {
      socket.send(JSON.stringify({ message }));
      setMessage(''); // Clear the message input after sending
    }
  };

  return (
    <div>
      <h2>WebSocket Chat</h2>
      <div style={{ border: '1px solid black', padding: '10px', height: '200px', overflowY: 'scroll' }}>
        {chatLog.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage();
          }
        }}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default WebSocketChat;
