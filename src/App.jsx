// App.js

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Messages from "./pages/Messages";
import Connections from "./pages/Connections";

// inside your <Routes>


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path='/messages' element={<Messages />} />
        <Route path="/connections" element={<Connections />} />

      </Routes>
    </BrowserRouter>
  );
}