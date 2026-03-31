import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home";
import PanelVivo from "./pages/PanelVivo";
import PanelDeposito from "./pages/PanelDeposito";
import PanelPostVivo from "./pages/PanelPostVivo";
import PanelClientas from "./pages/PanelClientas";
import PanelDashboard from "./pages/PanelDashboard";
import HistorialVivo from "./pages/HistorialVivo";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  if (location.pathname === "/") return null;
  return (
    <div
      style={{
        background: "#fff",
        borderBottom: "1px solid #e8dde3",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#A0436A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "Georgia, serif",
          }}
        >
          A
        </div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#A0436A",
            letterSpacing: "-.3px",
          }}
        >
          Ambertap
        </span>
      </div>
      <button
        onClick={() => {
          localStorage.removeItem("ambertap_usuario");
          navigate("/");
        }}
        style={{
          padding: "8px 16px",
          borderRadius: 99,
          border: "1px solid #e8dde3",
          background: "#f7f3f5",
          color: "#6b4d5a",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Inicio
      </button>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <div
        style={{
          width: "100%",
          padding: "20px 40px",
        }}
      >
        {" "}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vivo" element={<PanelVivo />} />
          <Route path="/deposito" element={<PanelDeposito />} />
          <Route path="/post-vivo" element={<PanelPostVivo />} />
          <Route path="/clientas" element={<PanelClientas />} />
          <Route path="/dashboard" element={<PanelDashboard />} />
          <Route path="/historial/:vivoId" element={<HistorialVivo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
