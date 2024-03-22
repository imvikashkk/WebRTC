/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../services/peer";
import { useSocket } from "../context/SocketProvider";
import { useParams, useLocation, useNavigate} from "react-router-dom";

function Room() {
  const socket = useSocket();
  const { email, roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate()

  const [remoteEmail, setRemoteEmail] = useState(null);
  const [remoteSocketId, setRemoteSocketId] = useState(null);

  const [isSentStream, setIsSentStream] = useState(false);
  const [isCalled, setIsCalled] = useState(false);

  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();


  useEffect(()=>{
    if(location.state.other ){
      setRemoteEmail(location.state.other.email)
      setRemoteSocketId(location.state.other.id)
    }
  },[])

  // if screen loading (not recommendable)
  window.onload = () =>{
    navigate("/", {replace:true} ) 
  }

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    console.log("calling to " + remoteEmail + "from: " + email);
    socket.emit("user:call", { to: remoteSocketId, offer, email: email });
    setMyStream(stream);
  }, [email, remoteEmail, remoteSocketId, socket]);

  // mai pahle se join hu to mere liye remote
  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
    setRemoteEmail(email);
  }, []);

  const handleIncommingCall = useCallback(
    async ({ from, offer, email }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call from: ` + email);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  /////////////////////////////////////////////////////////////////////

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleDisconnectedUser = useCallback((data) => {
    console.log("disconnected ", data);
    setRemoteSocketId(null);
    setRemoteEmail(null);
    setMyStream(null);
    setRemoteStream(null);
    setIsSentStream(false);
    setIsCalled(false);
  }, []);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(()=>{
      if(!location.state.you.email){
        navigate("/", {replace:true})
      }
  },[])

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("user:disconnected", handleDisconnectedUser);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("user:disconnected", handleDisconnectedUser);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    handleCallAccepted,
    handleDisconnectedUser,
    handleIncommingCall,
    handleNegoNeedFinal,
    handleNegoNeedIncomming,
    handleUserJoined,
    socket,
  ]);

  return (
    <div className="flex w-[100vw] justify-center">
      <div className="p-2 w-[320px] max-w-[320px] flex flex-col items-center">
        <h1 className="text-2xl font-semibold">VideoCall</h1>
        <h3>you: {email}</h3>
        <h3>connection: {remoteEmail ? remoteEmail : "waiting...."}</h3>

        {remoteSocketId && !remoteStream && !isCalled && <button onClick={()=>{
          handleCallUser()
          setIsCalled(true)
        }}
        className="border-2 px-2 py-1 bg-blue-700 text-white rounded-md select-none cursor-pointer"
        >CALL</button>}
        { !isSentStream && remoteStream && !isCalled && (<button onClick={()=>{
          sendStreams()
          setIsSentStream(true)
          
        }}
        className="border-2 px-2 py-1 bg-blue-700 text-white rounded-md select-none cursor-pointer"
        >Accept</button>)}

        {myStream && (
          <>
            <h1>My Stream</h1>
            <ReactPlayer
              playing
              muted
              height="100px"
              width="200px"
              url={myStream}
            />
          </>
        )}
        {remoteStream && (
          <>
            <h1>Remote Stream</h1>
            <ReactPlayer
              playing
              height="250px"
              width="540px"
              url={remoteStream}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Room;
