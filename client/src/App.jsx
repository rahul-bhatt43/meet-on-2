import "./App.css";
import Home from "./comps/Home";
import VideoChat from "./comps/VideoChat";

import { Routes, Route } from "react-router-dom";
import VideoChatEnter from "./comps/VideoChatEnter";

function App() {
  return (
    <>
      <Routes>
        <Route path="/room/:roomId" element={<VideoChat />} />
        <Route path="/room" element={<VideoChatEnter />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
