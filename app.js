// App.js
// NO "export default" here — define a global App for the browser setup.

function App() {
  const [tasks, setTasks] = React.useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [text, setText] = React.useState("");

  function addTask(e) {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    setTasks(prev => [{ id: Date.now(), title, done: false }, ...prev]);
    setText("");
  }

  function toggle(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function remove(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  React.useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  return (
    <div style={{ maxWidth: 640, margin: "2rem auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>🎄 Advent Calendar (Prototype)</h1>
      <p style={{color:"#555"}}>Simple CRUD to prove the browser setup works.</p>

      <form onSubmit={addTask} style={{ marginBottom: "1rem" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add item…"
          style={{ padding: ".5rem", width: "70%" }}
        />
        <button style={{ padding: ".5rem", marginLeft: ".5rem" }}>Add</button>
      </form>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map(t => (
          <li key={t.id} style={{
            display:"flex", alignItems:"center", gap: ".5rem",
            background:"#f7f7f7", marginBottom: ".5rem", padding: ".5rem .75rem", borderRadius: 8
          }}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
            <span style={{ textDecoration: t.done ? "line-through" : "none", flex: 1 }}>{t.title}</span>
            <button onClick={() => remove(t.id)}>🗑</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
