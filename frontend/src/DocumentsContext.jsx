import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { deleteDocument, listDocuments, uploadDocument } from "./api";
import { useAuth } from "./AuthContext";

const DocumentsContext = createContext(null);

// Holds the user's documents once, so the sidebar badge, Home and the Documents page never disagree.
export function DocumentsProvider({ children }) {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setDocuments(await listDocuments(token));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  // These throw on failure so the calling page can show the message next to the button.
  async function upload(file, category) {
    const doc = await uploadDocument(token, file, category);
    setDocuments((prev) => [doc, ...prev]);
    return doc;
  }

  async function remove(id) {
    await deleteDocument(token, id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <DocumentsContext.Provider value={{ documents, loading, error, upload, remove, refresh }}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments() {
  return useContext(DocumentsContext);
}
