import { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import "./VideoChat.css";
import {
  FiSend,
  FiPhoneCall,
  FiVideoOff,
  FiVideo,
  FiMicOff,
  FiMic,
  FiMessageCircle
} from "react-icons/fi";
import {
  MdOutlineScreenShare,
  MdOutlineStopScreenShare,
  MdCallEnd,
} from "react-icons/md";
import { BsFullscreen, BsFullscreenExit } from "react-icons/bs";
import { IoIosCloseCircle } from "react-icons/io";

const server_uri = import.meta.env.VITE_APP_SERVER_URI;

const VideoChat = () => {
  const { roomId } = useParams();
  const navi = useNavigate();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef();
  const socket = useRef();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    // if (!roomId) {
    //   const newRoomId = Math.random().toString(36).substring(2, 7);
    //   navi(`/room/${newRoomId}`);
    // }

    socket.current = io.connect(server_uri);
    socket.current.emit("join-room", roomId);

    const constraints = { video: true, audio: true };
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      localVideoRef.current.srcObject = stream;
      peerConnection.current = new RTCPeerConnection();

      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));

      peerConnection.current.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit("candidate", {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      socket.current.on("offer", async (offer) => {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(
          new RTCSessionDescription(answer)
        );
        socket.current.emit("answer", { roomId, answer });
        setInCall(true);
      });

      socket.current.on("answer", async (answer) => {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        setInCall(true);
      });

      socket.current.on("candidate", (candidate) => {
        peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.current.on("message", (data) => {
        // console.log("the other message::", data);
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "to", content: data },
        ]);
      });

      socket.current.emit("ready");
    });

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [roomId, navi]);

  const createOffer = async () => {
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(
      new RTCSessionDescription(offer)
    );
    socket.current.emit("offer", { roomId, offer });
    setInCall(true);
  };

  const hangUp = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    socket.current.emit("end-call");
    setInCall(false);
    navi("/room");
  };

  const toggleMic = () => {
    localVideoRef.current.srcObject.getAudioTracks()[0].enabled = !micOn;
    setMicOn(!micOn);
  };

  const toggleVideo = () => {
    localVideoRef.current.srcObject.getVideoTracks()[0].enabled = !videoOn;
    setVideoOn(!videoOn);
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.current.emit("message", { roomId, message });
      //   console.log("the from message::", message);

      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "from", content: message },
      ]);
      setMessage("");
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = stream.getTracks()[0];

      // Replace the video track with the screen track
      const sender = peerConnection.current
        .getSenders()
        .find((s) => s.track.kind === "video");
      sender.replaceTrack(screenTrack);

      setIsScreenSharing(true);
      setIsFullScreen(true);

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Error sharing screen:", err);
    }
  };

  const stopScreenShare = () => {
    const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];

    // Replace the screen track back with the camera video track
    const sender = peerConnection.current
      .getSenders()
      .find((s) => s.track.kind === "video");
    sender.replaceTrack(videoTrack);

    setIsScreenSharing(false);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleChatToggle = () => {
    setChatOpen(!chatOpen);
  };

  return (
    <div className="container">
      <div className="video-container">
        <button className="chatIcon" onClick={handleChatToggle}>
          <FiMessageCircle />
        </button>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className={`video ${isFullScreen ? "small-video" : ""}`}
        ></video>
        <video
          ref={remoteVideoRef}
          autoPlay
          className={`video ${isFullScreen ? "big-video" : ""}`}
        ></video>

        <div className="controls">
          {inCall ? (
            <button onClick={hangUp} className="btn hangup">
              <MdCallEnd />
            </button>
          ) : (
            <button onClick={createOffer} className="btn call">
              <FiPhoneCall />
            </button>
          )}
          <button
            title={micOn ? "Mute" : "Unmute"}
            onClick={toggleMic}
            className="btn"
          >
            {micOn ? <FiMicOff /> : <FiMic />}
          </button>
          <button
            title={videoOn ? "Video Off" : "Video On"}
            onClick={toggleVideo}
            className="btn"
          >
            {videoOn ? <FiVideoOff /> : <FiVideo />}
          </button>
          {!isScreenSharing ? (
            <button
              title="Start Screen Share"
              onClick={startScreenShare}
              className="btn"
            >
              <MdOutlineScreenShare />
            </button>
          ) : (
            <button
              title="Stop Screen Sharing"
              onClick={stopScreenShare}
              className="btn"
            >
              <MdOutlineStopScreenShare />
            </button>
          )}
          <button
            title="Toggle Full Screen"
            onClick={toggleFullScreen}
            className="btn"
          >
            {isFullScreen ? <BsFullscreenExit /> : <BsFullscreen />}
          </button>
        </div>
      </div>

      <div className={`chat-container ${chatOpen ? "active" : ""}`}>
        <div className="closeIcon" onClick={handleChatToggle} >
          <IoIosCloseCircle/>
        </div>
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <strong>{msg.type === "from" ? "You" : "Other"}: </strong>
              {msg.content}
            </div>
          ))}
        </div>
        <div className="messageForm">
          <textarea
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="chat-input"
          />
          <button onClick={sendMessage} className="btn send">
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;
