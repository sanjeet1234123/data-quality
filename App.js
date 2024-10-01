import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./ui/Layout";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import DataSource from "./components/DataSource/DataSource";
import DataSetFlow from "./components/DataSetFlow/DataSetFlow";
import ProtectedRoute from "./auth/ProtectedRoute";
import { AuthProvider } from "./auth/AuthContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Login />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/chat-bot",
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: "/signup",
        element: <Signup />,
      },
      {
        path: "/data-sources",
        element: (
          <ProtectedRoute>
            <DataSource />
          </ProtectedRoute>
        ),
      },
      {
        path: "/data-set-flow/:connectionName",
        element: (
          <ProtectedRoute>
            <DataSetFlow />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
  // return <Routes />;
}

export default App;
