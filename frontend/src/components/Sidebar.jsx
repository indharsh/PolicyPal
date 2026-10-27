import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useDocuments } from "../DocumentsContext";
import { mockChats } from "../mockData";
import Icon from "./Icon";

const navClass = ({ isActive }) => "nav-row" + (isActive ? " active" : "");

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const { documents } = useDocuments();
  const navigate = useNavigate();
  const [chatsOpen, setChatsOpen] = useState(true);
  const name = user.first_name || user.username;

  if (collapsed) {
    return (
      <aside className="sidebar rail">
        <button className="icon-btn" aria-label="Open sidebar" title="Open sidebar" onClick={onToggle}>
          <Icon name="panel" />
        </button>
        <button className="icon-btn new" aria-label="New chat" title="New chat" onClick={() => navigate("/")}>
          <Icon name="plus" />
        </button>
        <NavLink to="/" end className={({ isActive }) => "icon-btn" + (isActive ? " active" : "")} aria-label="Home" title="Home">
          <Icon name="home" />
        </NavLink>
        <NavLink to="/documents" className={({ isActive }) => "icon-btn" + (isActive ? " active" : "")} aria-label="Documents" title="Documents">
          <Icon name="file" />
        </NavLink>
        <div className="grow" />
        <NavLink to="/profile" aria-label="Your profile" title="Your profile">
          <span className="avatar">{name[0].toUpperCase()}</span>
        </NavLink>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-dot" />
        <span className="brand-word grow">PolicyPal</span>
        <button className="icon-btn" aria-label="Close sidebar" title="Close sidebar" onClick={onToggle}>
          <Icon name="panel" />
        </button>
      </div>

      <button className="btn-new" onClick={() => navigate("/")}>
        <Icon name="plus" /> New chat
      </button>

      <div className="search">
        <Icon name="search" size={16} />
        <input aria-label="Search chats" placeholder="Search chats" />
      </div>

      {/* "end" makes Home active only on exactly "/", not on every path that starts with it */}
      <NavLink to="/" end className={navClass}>
        <Icon name="home" />
        <span className="grow">Home</span>
      </NavLink>

      <NavLink to="/documents" className={navClass}>
        <Icon name="file" />
        <span className="grow">Documents</span>
        <span className="count-badge">{documents.length}</span>
      </NavLink>

      <div className="chats">
        <button
          className="section-toggle"
          onClick={() => setChatsOpen(!chatsOpen)}
          aria-expanded={chatsOpen}
        >
          <Icon name={chatsOpen ? "chevronDown" : "chevronRight"} size={16} />
          <span className="grow">Recent chats</span>
          <span className="section-count">{mockChats.length}</span>
        </button>

        {chatsOpen && (
          <div className="chat-list">
            {mockChats.map((c) => (
              <button key={c.id} className="chat-row">{c.title}</button>
            ))}
            <button className="chat-row more">Show all chats</button>
          </div>
        )}
      </div>

      <div className="grow" />

      <div className="account-row">
        <NavLink
          to="/profile"
          className={({ isActive }) => "account-link" + (isActive ? " active" : "")}
          aria-label="Your profile"
        >
          <span className="avatar">{name[0].toUpperCase()}</span>
          <span className="grow account-name">{name}</span>
        </NavLink>
        <button className="icon-btn" aria-label="Sign out" onClick={logout}>
          <Icon name="logout" />
        </button>
      </div>
    </aside>
  );
}
