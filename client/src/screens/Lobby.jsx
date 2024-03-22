/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

function Lobby() {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const [error, setError] = useState(null)

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email:email.toLowerCase(), room });
    },
    [email, room, socket]
  );
  const handleJoinRoom = useCallback(
    (data) => {
      console.log(data)
      const { you, other } = data;
      navigate(`/room/${you.room}/${you.email}`, {state:data});
    },
    [navigate]
  );

  const handleRoomFull = useCallback((room) => {
     setError("Room is full, peer to peer connetion...")
  }, []);

  const handleAlreadyJoined = useCallback((data) => {
      setError("this user already joined a room !")
  },[]);

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    socket.on("room:full", handleRoomFull);
    socket.on("already:joined", handleAlreadyJoined);
    return () => {
      socket.off("room:join", handleJoinRoom);
      socket.off("room:full", handleRoomFull);
      socket.off("already:joined", handleAlreadyJoined);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          className="mx-auto h-20 w-auto"
          src="https://t4.ftcdn.net/jpg/02/55/94/55/360_F_255945532_gXYb4gPaatBY39i9KIte3K38KH3lJYIq.jpg"
          alt="videocall"
        />
        <h2 className="mt-5 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Join a Room
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmitForm}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-gray-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="room"
              className="block text-sm font-medium leading-6 text-gray-900">
              Room Id
            </label>
            <div className="mt-2">
              <input
                id="room"
                name="room"
                type="text"
                required
                autoComplete="room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          {error && (
            <div>
              <p className=" text-red-900 ">*{error}</p>
            </div>
          )}
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Join Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Lobby;
