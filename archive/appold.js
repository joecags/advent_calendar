// app.js
// NOTE: No imports/exports here because we're using React UMD + Babel in index.html
const DAYS = 24;
const STORAGE_KEY = "advent_calendar_v1";

function makeEmptyData() {
  return Array.from({ length: DAYS }, (_, i) => String(i + 1)).reduce(
    (acc, d) => (
      (acc[d] = { title: "", rating: "", notes: "", service: "" }), acc
    ),
    {}
  );
}


function App() {
  const { useEffect, useMemo, useState } = React;

  const [data, setData] = useState(makeEmptyData);
  const [selectedDay, setSelectedDay] = useState(null);

  // Load from localStorage on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const days = useMemo(
    () => Array.from({ length: DAYS }, (_, i) => String(i + 1)),
    []
  );

  const current = selectedDay ? data[selectedDay] : null;

  function updateField(field, value) {
    if (!selectedDay) return;
    setData((prev) => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], [field]: value },
    }));
  }

  function clearDay(day) {
    setData((prev) => ({ ...prev, [day]: { title: "", rating: "", notes: "" } }));
    if (selectedDay === day) setSelectedDay(null);
  }

  function clearAll() {
    if (!confirm("Reset all days? This cannot be undone.")) return;
    const fresh = makeEmptyData();
    setData(fresh);
    setSelectedDay(null);
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>🎄 Advent Calendar</h1>
        <div className="spacer" />
        <button className="ghost" onClick={clearAll} title="Reset all days">
          Reset All
        </button>
      </header>

      <main className="layout">
        {/* Calendar Grid */}
        <section className="calendar">
          {days.map((d) => {
            const filled = data[d]?.title?.trim();
            return (
              <button
                key={d}
                className={`day ${selectedDay === d ? "active" : ""}`}
                onClick={() => setSelectedDay(d)}
                title={`Day ${d}`}
              >
                <div className="day-num">{d}</div>
                <div className="day-meta">
                  {filled ? <span className="pill">{data[d].title}</span> : <span className="muted">empty</span>}
                  {data[d].rating ? <span className="badge">★ {data[d].rating}</span> : null}
                  {data[d].service ? <span className="badge">{data[d].service}</span> : null}
                </div>
              </button>
            );
          })}
        </section>

        {/* Editor Panel */}
        <aside className={`editor ${selectedDay ? "open" : ""}`}>
          {selectedDay ? (
            <>
              <div className="editor-head">
                <h2>Day {selectedDay}</h2>
                <button className="ghost" onClick={() => clearDay(selectedDay)}>Clear</button>
                <button className="primary" onClick={() => setSelectedDay(null)}>Done</button>
              </div>

              <label className="field">
                <span>Movie / Title</span>
                <input
                  type="text"
                  value={current.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g., The Polar Express"
                />
              </label>
              
              <label className="field">
                <span>Service</span>
                <select
                  value={current.service}
                  onChange={(e) => updateField("service", e.target.value)}
                >
                  <option value="">---Select a service---</option>
                  <option value="Netflix">Netflix</option>
                  <option value="Disney+">Disney+</option>
                  <option value="Amazon Prime">Amazon Prime</option>
                  <option value="Paramount">Paramount</option>
                </select>
              </label>

              <label className="field">
                <span>Rating (1–10)</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={current.rating}
                  onChange={(e) => updateField("rating", e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="8"
                />
              </label>

              <label className="field">
                <span>Review</span>
                <textarea
                  rows={3}
                  value={current.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="What did you think of the movie?..."
                />
              </label>
            </>
          ) : (
            <div className="editor-empty">
              <p>Select a day to edit</p>
            </div>
          )}
        </aside>
      </main>

      <footer className="foot">
        <small>Data is saved automatically in your browser.</small>
      </footer>
    </div>
    );
}  // 👈 end of your component

// ✅ Register Service Worker (PWA support)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('✅ Service worker registered'))
    .catch(err => console.error('Service worker registration failed:', err));
}
