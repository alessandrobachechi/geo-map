import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import "./App.css";
import Home from "./components/Home";
import Login from "./components/Login";
import Secret from "./components/Secret";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import Register from "./components/Register";
import "./Layout.css";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/login/" element={<Login />} />
          <Route path="/register/" element={<Register />} />
          <Route
            path="/secret"
            element={<Secret />}
            /* element={
              <ProtectedRoute>
                <Secret />
              </ProtectedRoute>
            } */
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
