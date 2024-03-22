import {Routes, Route} from "react-router-dom"
import Lobby from "./screens/Lobby"
import Room from "./screens/Room"
import {Navigate} from "react-router-dom"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby></Lobby>} />
      <Route path="/room/:roomId/:email" element={<Room></Room>}/>
      <Route path="/*" element={<Navigate to="/" replace={true}></Navigate>} />
    </Routes>
  )
}

export default App