// App.js (CDN React + Babel setup; no imports/exports)
// Goals: Works on desktop & phone; share via URL hash; rating (0–10) and comments.

function App() {
  // ---------- Helpers
  const uid = () => Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  const LS_KEY = "advent_calendar_v1";

  // base64 helpers that handle unicode
  const encodeB64 = (str) => btoa(unescape(encodeURIComponent(str)));
  const decodeB64 = (b64) => decodeURIComponent(escape(atob(b64)));

  // ---------- State
  const [items, setItems] = React.useState(() => {
    // 1) load from URL hash (share link) if present
    const hash = location.hash.startsWith("#data=") ? location.hash.slice(6) : "";
    if (hash) {
      try {
        const parsed = JSON.parse(decodeB64(hash));
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    // 2) else load from localStorage
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    // 3) default empty
    return [];
  });

  const [text, setText] = React.useState("");
  const [rating, setRating] = React.useState("");
  const [comments, setComments] = React.useState("");
  const [editingId, setEditingId] = React.useState(null);
  const [search, setSearch] = React.useState("");

  // persist to localStorage on change
  React.useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  // ---------- CRUD
  function addItem(e) {
    e.preventDefault();
    const title = text.trim();
    const r = rating === "" ? null : Math.max(0, Math.min(10, parseInt(rating, 10) || 0));
    if (!title) return;
    const item = {
      id: uid(),
      title,
      done: false,
      rating: r,           // int 0–10 or null
      comments: comments.trim(), // string
    };
    setItems((prev) => [item, ...prev]);
    setText("");
    setRating("");
    setComments("");
  }

  function toggleDone(id) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function startEdit(id) {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    setEditingId(id);
    setText(it.title);
    setRating(it.rating ?? "");
    setComments(it.comments || "");
  }

  function saveEdit(e) {
    e.preventDefault();
    const id = editingId;
    if (!id) return;
    const title = text.trim();
    if (!title) return;
    const r = rating === "" ? null : Math.max(0, Math.min(10, parseInt(rating, 10) || 0));
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, title, rating: r, comments: comments.trim() } : it
      )
    );
    cancelEdit();
  }

  function cancelEdit() {
    setEditingId(null);
    setText("");
    setRating("");
    setComments("");
  }

  // ---------- Import / Export / Share
  function exportJSON() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "advent_calendar.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSONFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data)) setItems(data);
      } catch {}
    };
    reader.readAsText(file);
  }

  function shareLink() {
    // encode as base64 in hash: #data=...
    const payload = encodeB64(JSON.stringify(items));
    const url = `${location.origin}${location.pathname}#data=${payload}`;
    navigator.clipboard?.writeText(url);
    alert("Share link copied to clipboard!\n\n" + url);
  }

  // ---------- Filtering / search
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      [it.title, it.comments].some((s) => (s || "").toLowerCase().includes(q))
    );
  }, [items, search]);

  // ---------- UI
  return (
    <div style={{ maxWidth: 760, margin: "2rem auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2.2rem", marginBottom: ".25rem" }}>🎄 Advent Calendar (Prototype)</h1>
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        Build your 25-day movie list. Works on desktop & phone. Share via link.
      </p>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          placeholder="Search title or comments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: ".6rem .7rem", flex: "1 1 280px", minWidth: 200 }}
        />
        <button onClick={exportJSON} style={{ padding: ".6rem .9rem" }}>Export</button>
        <label style={{ padding: ".6rem .9rem", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}>
          Import
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && importJSONFile(e.target.files[0])}
          />
        </label>
        <button onClick={shareLink} style={{ padding: ".6rem .9rem" }}>Share link</button>
      </div>

      {/* Add / Edit form */}
      <form
        onSubmit={editingId ? saveEdit : addItem}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 90px 160px 110px",
          gap: ".5rem",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <input
          placeholder="Add movie title…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ padding: ".6rem .7rem", gridColumn: "1 / span 1" }}
        />
        <input
          type="number"
          min="0" max="10" step="1"
          placeholder="Rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          style={{ padding: ".6rem .7rem" }}
        />
        <input
          placeholder="Comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          style={{ padding: ".6rem .7rem" }}
        />
        <div style={{ display: "flex", gap: ".5rem" }}>
          <button type="submit" style={{ padding: ".6rem .9rem" }}>
            {editingId ? "Save" : "Add"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} style={{ padding: ".6rem .9rem" }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {filtered.map((it) => (
          <li
            key={it.id}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: ".75rem",
              background: "#f7f7f7",
              marginBottom: ".6rem",
              padding: ".7rem 1rem",
              borderRadius: 10,
            }}
          >
            <input
              type="checkbox"
              checked={it.done}
              onChange={() => toggleDone(it.id)}
              aria-label="mark done"
              style={{ width: 20, height: 20 }}
            />
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  textDecoration: it.done ? "line-through" : "none",
                }}
              >
                {it.title}
              </div>
              <div style={{ color: "#666", fontSize: ".9rem", marginTop: 2 }}>
                Rating: {Number.isInteger(it.rating) ? `${it.rating}/10` : "—"}
                {it.comments ? ` • ${it.comments}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: ".5rem" }}>
              <button onClick={() => startEdit(it.id)}>Edit</button>
              <button onClick={() => removeItem(it.id)} title="Delete">🗑</button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li style={{ color: "#777", padding: "1rem" }}>No items yet. Add your first movie above.</li>
        )}
      </ul>
    </div>
  );
}
