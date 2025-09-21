import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/Layout";
import Home from "../pages/Home";
import Events from "../pages/Events";
import EventDetail from "../pages/EventDetail";
import Host from "../pages/Host";
import Dashboard from "../pages/Dashboard";
import MyRSVPs from "../pages/MyRSVPs";
import MyHostedEvents from "../pages/MyHostedEvents";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import AuthCallback from "../pages/AuthCallback";
import OnboardingInterests from "../pages/OnboardingInterests";
// import RequireAuth from "../components/RequireAuth";
import AuthDebug from "../pages/AuthDebug";
import Connections from "../pages/Connections";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "events", element: <Events /> },
      { path: "events/:slug", element: <EventDetail /> },
      { path: "host", element: <Host /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "my/rsvps", element: <MyRSVPs /> },
      { path: "my/hosted", element: <MyHostedEvents /> },
      { path: "signin", element: <SignIn /> },
      { path: "signup", element: <SignUp /> },
      { path: "auth/callback", element: <AuthCallback /> },
      { path: "onboarding/interests", element: <OnboardingInterests /> },
      { path: "authdebug", element: <AuthDebug/>},
      { path: "connections", element: <Connections /> },

    ],
  },
]);
