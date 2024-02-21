import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Import CSS file for styling
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

function App() {
  const [port, setPort] = useState(null);
  const [data, setData] = useState('');
  const containerRef = useRef(null);
  const renderer = useRef(null);
  const scene = useRef(null);
  const camera = useRef(null);
  const imuText = useRef(null);

  useEffect(() => {
    // Setup Three.js
    renderer.current = new THREE.WebGLRenderer();
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.current.domElement);

    scene.current = new THREE.Scene();
    camera.current = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.current.position.z = 5;
    // Load font
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
      const textGeometry = new TextGeometry('ISDN 2602', {
        font: font,
        size: 1,
        height: 0.2,
      });
      const textMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 }); // Gray color
      imuText.current = new THREE.Mesh(textGeometry, textMaterial);

      // Center the text horizontally and vertically
      textGeometry.computeBoundingBox();
      const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
      const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;

      imuText.current.position.x = -textWidth / 2;
      imuText.current.position.y = -textHeight / 2;

      scene.current.add(imuText.current);
    });



    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.current.render(scene.current, camera.current);
    };
    animate();

    return () => {
      // Cleanup Three.js
      renderer.current.dispose();
    };
  }, []);


  // Inside the useEffect hook where you process data
  useEffect(() => {
    // Update IMU position and rotation based on data
    if (data) {
      const values = data.split(',').map(parseFloat);
      const [accX, accY, accZ, gyroX, gyroY, gyroZ] = values;

      // Update text position and rotation based on accelerometer and gyroscope readings
      imuText.current.rotation.x = gyroY * Math.PI / 180;
      imuText.current.rotation.y = gyroZ * Math.PI / 180;
      imuText.current.rotation.z = gyroX * Math.PI / 180;
      // Optionally, you can also adjust position based on accelerometer data
      // imuText.current.position.x = accX;
      // imuText.current.position.y = accY;
      // imuText.current.position.z = accZ;
    }
  }, [data]);

  const openPort = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setPort(port);

      const reader = port.readable.getReader();
      let buffer = '';
      let temp = ''; // Temporary variable to store accumulated lines
      let line = '';

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
        while (buffer.length >= 2) {
          const eightBytes = buffer.substring(0, 2);
          const stringValue = hexToString(eightBytes); // Convert hexadecimal string to string
          line += stringValue;
          buffer = buffer.substring(2); // Remove processed bytes from buffer

          // Check for newline character
          if (stringValue.includes('\n')) {
            temp += line + '\n'; // Store the line in temp
            setData(line); // Update the data state
            processData(line); // Process the received data
            line = ''; // Reset line
          }
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

  const processData = (line) => {
    const values = line.split(','); // Split the line by comma
    // Assuming values are in the order: AccX, AccY, AccZ, GyroX, GyroY, GyroZ
    const [accX, accY, accZ, gyroX, gyroY, gyroZ] = values.map(parseFloat); // Parse values to float
    // Now you can use accX, accY, accZ, gyroX, gyroY, gyroZ for further processing or display
    console.log('Accelerometer X:', accX);
    console.log('Accelerometer Y:', accY);
    console.log('Accelerometer Z:', accZ);
    console.log('Gyroscope X:', gyroX);
    console.log('Gyroscope Y:', gyroY);
    console.log('Gyroscope Z:', gyroZ);
    // You can set these values in the state or use them as needed
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
      <div ref={containerRef} />
    </div>
  );
}

export default App;
