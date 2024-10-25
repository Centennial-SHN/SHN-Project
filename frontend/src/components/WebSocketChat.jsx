import React, { useState, useEffect } from 'react';

const WebSocketChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection to your Django server
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/openai/');

    ws.onopen = () => {
      console.log('WebSocket connection opened');
      setMessages((prevMessages) => [...prevMessages, 'Connected to server']);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Message from server:', data);

      // Check if the message contains any delta or text
      if (data.message) {
        setMessages((prevMessages) => [...prevMessages, data.message]);
      } else {
        setMessages((prevMessages) => [...prevMessages, JSON.stringify(data)]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessages((prevMessages) => [...prevMessages, 'WebSocket error occurred.']);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setMessages((prevMessages) => [...prevMessages, 'WebSocket connection closed.']);
    };

    // Set WebSocket instance
    setSocket(ws);

    // Cleanup WebSocket connection when component unmounts
    return () => {
      ws.close();
    };
  }, []);

  // Function to send message to WebSocket server
  const sendMessage = () => {
    if (socket && inputMessage) {
      socket.send(JSON.stringify({ message: inputMessage }));
      setMessages((prevMessages) => [...prevMessages, `You: ${inputMessage}`]);
      setInputMessage('');  // Clear input after sending
    }
  };

  return (
    <div>
      <h1>WebSocket Chat</h1>
      <div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        <h2>Messages:</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketChat;







// import React, { useEffect, useState } from 'react';

// const WebSocketChat = () => {
//   const [messages, setMessages] = useState([]);
//   const [socket, setSocket] = useState(null);

//   useEffect(() => {
//     // Use the same WebSocket URL that worked with `wscat`
//     const ws = new WebSocket('ws://127.0.0.1:8000/ws/openai/');

//     ws.onopen = () => {
//       console.log('WebSocket connection opened');
//     };

//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       setMessages((prevMessages) => [...prevMessages, data.message]);
//     };

//     ws.onerror = (error) => {
//       console.log('WebSocket error:', error);
//     };

//     ws.onclose = () => {
//       console.log('WebSocket connection closed');
//     };

//     setSocket(ws);

//     // Cleanup WebSocket connection on component unmount
//     return () => {
//       ws.close();
//     };
//   }, []);

//   const sendMessage = (msg) => {
//     if (socket) {
//       socket.send(JSON.stringify({ message: msg }));
//     }
//   };

//   return (
//     <div>
//       <h2>WebSocket Chat</h2>
//       <ul>
//         {messages.map((msg, index) => (
//           <li key={index}>{msg}</li>
//         ))}
//       </ul>
//       <button onClick={() => sendMessage('Hello WebSocket!')}>Send Message</button>
//     </div>
//   );
// };

// export default WebSocketChat;
