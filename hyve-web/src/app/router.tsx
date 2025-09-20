import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import Home from "../pages/Home";
import Discover from "../pages/Discover";
import Events from "../pages/Events";
import EventDetail from "../pages/EventDetail";
import Host from "../pages/Host";
import Dashboard from "../pages/Dashboard";
import SignIn from "../pages/SignIn";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "discover", element: <Discover /> },
      { path: "events", element: <Events /> },
      { path: "events/:id", element: <EventDetail /> },
      { path: "host", element: <Host /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "signin", element: <SignIn /> },
    ],
  },
]);
