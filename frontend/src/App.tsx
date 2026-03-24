import { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { CreateContentModal } from "./components/ContentStudio/CreateContentModal";

export default function App() {
  const [createContentType, setCreateContentType] = useState<string | undefined>();
  const showCreateContent = createContentType !== undefined;

  return (
    <Layout>
      <Dashboard onCreateContent={(type) => setCreateContentType(type || "blog-post")} />
      {showCreateContent && (
        <CreateContentModal initialType={createContentType} onClose={() => setCreateContentType(undefined)} />
      )}
    </Layout>
  );
}
