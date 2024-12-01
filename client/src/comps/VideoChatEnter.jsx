import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const client_domain = import.meta.env.VITE_APP_CLIENT_DOMAIN;

const VideoChatEnter = () => {
  const [roomId, setRoomId] = useState("");
  const navi = useNavigate();

  useEffect(() => {
    const newRoomId = Math.random().toString(36).substring(2, 7);
    setRoomId(newRoomId);
  }, []);

  return (
    <div>
      <h3>Wanna Create a Custom room?</h3>
      <p>or</p>
      <h3>Start an Instant Meeting?</h3>
      <button onClick={() => navi(`/room/${roomId}`)}>
      {`${client_domain}/room/${roomId}`}
      </button>
    </div>
  );
};

export default VideoChatEnter;
