import RequireAuth from "@/components/RequireAuth";
import RequireAdmin from "@/components/RequireAdmin";
import Navigation from "@/components/Navigation";
import Billing from "@/pages/billing";
import BillingSuccess from "@/pages/billing-success";
import Chat from "@/pages/chat";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import AgentsPage from "@/pages/agents";
import AgentChatPage from "@/pages/agents/chat";
import Session from "@/pages/session";
import SignIn from "@/pages/sign-in";
import SignUp from "@/pages/sign-up";
import AgentsPage from "@/pages/agents";
import AgentChatPage from "@/pages/agents/chat";
import Session from "@/pages/session";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Authentication routes */}
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />

            {/* Billing routes */}
            <Route
              path="/billing"
              element={
                <RequireAuth>
                  <Billing />
                </RequireAuth>
              }
            />
            <Route
              path="/billing/success"
              element={
                <RequireAuth>
                  <BillingSuccess />
                </RequireAuth>
              }
            />

            {/* Chat routes */}
            <Route
              path="/chat"
              element={
                <RequireAuth>
                  <Chat />
                </RequireAuth>
              }
            />

            {/* Agents */}
            <Route
              path="/agents"
              element={
                <RequireAuth>
                  <AgentsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/agents/:agentType"
              element={
                <RequireAuth>
                  <AgentChatPage />
                </RequireAuth>
              }
            />

        {/* Agents */}
        <Route
          path="/agents"
          element={
            <RequireAuth>
              <AgentsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/agents/:agentType"
          element={
            <RequireAuth>
              <AgentChatPage />
            </RequireAuth>
          }
        />

        {/* Session route */}
        <Route
          path="/new/:sessionId"
          element={
            <RequireAuth>
              <Session />
            </RequireAuth>
          }
        />
            {/* Session route */}
            <Route
              path="/new/:sessionId"
              element={
                <RequireAuth>
                  <Session />
                </RequireAuth>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <Dashboard />
                </RequireAdmin>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
