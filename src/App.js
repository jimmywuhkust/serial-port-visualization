import React, { useState } from 'react';
import './App.css'; // Import CSS file for styling

function App() {
  const [port, setPort] = useState(null);
  const [data, setData] = useState('');

  const openPort = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setPort(port);
  
      const reader = port.readable.getReader();
      let buffer = '';
  
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }

        // Convert Uint8Array to hexadecimal string
        const hexString = Array.from(new Uint8Array(value))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');

        buffer += hexString;

        // Check if buffer has at least 8 bytes
        while (buffer.length >= 16) {
          const eightBytes = buffer.substring(0, 16);
          const stringValue = hexToString(eightBytes); // Convert hexadecimal string to string
          setData(prevData => prevData + stringValue);
          buffer = buffer.substring(16); // Remove processed bytes from buffer
        }
      }
    } catch (error) {
      console.error('Error opening port:', error);
    }
  };
  
  const closePort = async () => {
    if (port) {
      await port.close();
      setPort(null);
    }
  };
  
  const hexToString = (hex) => {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const charCode = parseInt(hex.substr(i, 2), 16);
      if (charCode !== 0) {
        str += String.fromCharCode(charCode);
      }
    }
    return str;
  };

  return (
    <div className="container">
      <h1>ISDN 2602 IMU Visualization</h1>
      <div className="buttons">
        <button onClick={openPort}>Open Port</button>
        <button onClick={closePort}>Close Port</button>
      </div>
      <div className="data">
        <p>Data Received:</p>
        <pre>{data}</pre> {/* Display data within a <pre> tag to preserve formatting */}
      </div>
    </div>
  );
}

export default App;
