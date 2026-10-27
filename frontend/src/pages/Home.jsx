import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Icon from "../components/Icon";
import { useDocuments } from "../DocumentsContext";
import { suggestions } from "../mockData";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const name = user.first_name || user.username;
  const { documents } = useDocuments();
  const ready = documents.filter((d) => d.status === "ready").length;

  function submit() {
    if (!draft.trim()) return;
    setNotice("Chat arrives in a later step, so this question was not sent anywhere yet.");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="home">
      <div className="home-inner">
        <div className="hero">
          <span className="hero-dot" />
          <h1>{greeting()}, {name}</h1>
          <p>Ask anything about the policies you have uploaded.</p>
        </div>

        <div className="composer">
          <label htmlFor="composer" className="sr-only">Ask a question</label>
          <textarea
            id="composer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your policy, for example: what is the waiting period for pre-existing conditions?"
          />
          <div className="composer-bar">
            <button className="round-btn" aria-label="Attach a document">
              <Icon name="paperclip" />
            </button>
            <button className="pill-btn">
              All documents <Icon name="chevronDown" size={16} />
            </button>
            <div className="grow" />
            <button
              className="send-btn"
              aria-label="Send question"
              disabled={!draft.trim()}
              onClick={submit}
            >
              <Icon name="arrowUp" size={20} />
            </button>
          </div>
        </div>

        {notice && <div className="notice" role="status">{notice}</div>}

        <div className="suggestions">
          {suggestions.map((s) => (
            <button key={s} className="pill-btn" onClick={() => setDraft(s)}>{s}</button>
          ))}
        </div>

        <div className="home-foot">
          <Link to="/documents" className="home-link">
            {ready} of {documents.length} documents ready · Manage documents
          </Link>
          <p>
            PolicyPal answers from your documents and cites the clause it used. 
          </p>
          <p>
            For important decisions, confirm with the issuer of the policy.
          </p>
        </div>
      </div>
    </div>
  );
}
