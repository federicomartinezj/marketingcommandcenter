import { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { CreateContentModal } from "./components/ContentStudio/CreateContentModal";

export default function App() {
  const [showCreateContent, setShowCreateContent] = useState(false);

  return (
    <Layout>
      <Dashboard onCreateContent={() => setShowCreateContent(true)} />
      {showCreateContent && (
        <CreateContentModal onClose={() => setShowCreateContent(false)} />
      )}
    </Layout>
  );
}
