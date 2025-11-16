// app.js — React 18, 24-day grid with RIGHT-SIDE editor panel + localStorage

// ---------- config ----------
const DEFAULT_DAYS = 24;
const STORAGE_KEY = "advent_calendar_v3";
// ---------- import JSON file ---------- 

// ---------- helpers ----------
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function makeEmptyData(n = DEFAULT_DAYS) {
  return Array.from({ length: n }, (_, i) => String(i + 1)).reduce((acc, d) => {
    acc[d] = { title: "", rating: "", notes: "", service: "" };
    return acc;
  }, {});
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1);

  return rows
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const values = line.split(",");
      const record = {};
      headers.forEach((h, idx) => {
        record[h] = (values[idx] || "").trim();
      });
      return record;
    });
}

function useLocalStorage(key, initialValue) {
  const [value, setValue] = React.useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  React.useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

// ---------- UI ----------
function Header({ days, setDays, onReset, onImport, onImportCsv}) {
  const [tmp, setTmp] = React.useState(String(days));
  React.useEffect(() => setTmp(String(days)), [days]);

  return (
    <div className="header">
      <h1 className="title">🎄 Advent Calendar</h1>
      <div className="controls">
        <input
          type="number"
          min="1"
          max="31"
          value={tmp}
          onChange={(e) => setTmp(e.target.value)}
          onBlur={() => setDays(clamp(parseInt(tmp || days, 10), 1, 31))}
          title="Number of days"
          style={{ width: 72 }}
        />
        <button className="button ghost" onClick={onReset}>Reset</button>
        <button className="button ghost" onClick={onImport}>Import JSON</button>
        <button className="button ghost" onClick={onImportCsv}>Import CSV</button>

      </div>
    </div>
  );
}

function DayCard({ d, value, onOpen }) {
  const filled = value && (value.title || value.rating || value.notes || value.service);
  return (
    <div className="card" onClick={() => onOpen(d)}>
      <div className="day">{d}</div>

      {/* chips when filled */}
      {filled ? (
        <div className="chips">
          {value.title ? <span className="chip">{value.title}</span> : null}
          {value.rating !== "" ? <span className="chip chip-star">★{value.rating}</span> : null}
          {value.service ? <span className="chip chip-service">{value.service}</span> : null}
        </div>
      ) : (
        <div className="empty">empty</div>
      )}
    </div>
  );
}

function Grid({ days, data, onOpen }) {
  const items = React.useMemo(() => Array.from({ length: days }, (_, i) => String(i + 1)), [days]);
  return (
    <div className="grid">
      {items.map((d) => (
        <DayCard key={d} d={d} value={data[d]} onOpen={onOpen} />
      ))}
    </div>
  );
}

function EditorPanel({ day, value, onChange, onClear, onDone }) {
  if (!day) {
    // No day selected = no panel at all
    return null;
  }

  const current = value || { title: "", rating: "", notes: "", service: "" };
  const update = (k, v) => onChange({ ...current, [k]: v });
  const services = ["", "Netflix", "Disney+", "Amazon Prime", "Paramount", "Stan", "Binge", "Apple TV+", "YouTube"];

  return (
    <aside className="panel">
      <div className="panel-inner">
        <div className="panel-header">
          <h2>Day {day}</h2>
          <div className="panel-actions">
            <button className="button ghost" onClick={onClear}>Clear</button>
            <button className="button primary" onClick={onDone}>Done</button>
          </div>
        </div>

        <label className="field">
          <span>Movie / Title</span>
          <input
            value={current.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g., A Castle for Christmas"
          />
        </label>

        <label className="field">
          <span>Service</span>
          <select value={current.service} onChange={(e) => update("service", e.target.value)}>
            {services.map((s) => (
              <option key={s} value={s}>
                {s || "— Select —"}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Rating (1–10)</span>
          <input
            type="number"
            min="1"
            max="10"
            value={current.rating}
            onChange={(e) => {
              const v = e.target.value;
              update("rating", v === "" ? "" : String(clamp(parseInt(v || 0, 10), 1, 10)));
            }}
            placeholder="8"
          />
        </label>

        <label className="field">
          <span>Notes</span>
          <textarea
            value={current.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="What did you think of the movie?…"
          />
        </label>
      </div>
    </aside>
  );
}


function AppRoot() {
  const [days, setDays] = React.useState(DEFAULT_DAYS);
  const [data, setData] = useLocalStorage(STORAGE_KEY, makeEmptyData(DEFAULT_DAYS));
  const [selected, setSelected] = React.useState(null);

  // ensure data keys match when days changes
  React.useEffect(() => {
    setData((prev) => {
      const base = makeEmptyData(days);
      const next = { ...base, ...prev };
      for (const k of Object.keys(next)) {
        if (parseInt(k, 10) > days) delete next[k];
      }
      return next;
    });
  }, [days]);
      const onChangeDay = (val) => setData((prev) => ({ ...prev, [selected]: val }));
      const onClearDay = () => setData((prev) => ({ ...prev, [selected]: { title: "", rating: "", notes: "", service: "" } }));
      const onReset = () => {
          if (confirm("Reset all entries?")) setData(makeEmptyData(days))
        };

  // ---------- Import JSON ----------
      const onImport = async () => {
        try {
          const res = await fetch("./movies.json");
          if (!res.ok) throw new Error("HTTP " + res.status);
          const json = await res.json();

          setData((prev) => ({
            ...prev,
            ...json,
          }));
          alert("JSON imported successfully!");
        } catch (err) {
          console.error("JSON import error:", err);
          alert("Failed to load movies.json");
        }
      };
  // ---------- Import CSV (day, title, service only) ----------
      const onImportCsv = async () => {
        try {
          const res = await fetch("./movies.csv");
          if (!res.ok) throw new Error("HTTP " + res.status);

        const text = await res.text();
        const records = parseCsv(text);
        
        setData((prev) => {
          const next = { ...prev };
          
          for (const row of records) {
            const dayKey = String(row.day || "").trim();
            if (!dayKey) continue;

            next[dayKey] = {
              title: row.title || "",
              service: row.service || "",
              rating: row.rating || "",
              notes: row.notes || "",
            };
          }

          return next;
        });

        alert("CSV imported successfully!");
      } catch (err) {
        console.error("CSV import error:", err);
        alert("Failed to load movies.csv");
      }
    };

// ---------------------------checkInHere-----------------------------------------------------------


  return (
    <div className="layout">
      {/* top bar */}
      <Header 
        days={days}
        setDays={setDays}
        onReset={onReset} 
        onImport={onImport}
        onImportCsv={onImportCsv}
      />

      {/* content area: grid + right panel */}
      <div className="content">
        <Grid days={days} data={data} onOpen={(d) => setSelected(d)} />
        <EditorPanel
          day={selected}
          value={selected ? data[selected] : null}
          onChange={onChangeDay}
          onClear={onClearDay}
          onDone={() => setSelected(null)}
        />
      </div>

      <div className="footer muted">Data is saved automatically in your browser.</div>
    </div>
  );
}

// ---------- React 18 mount ----------
const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(<AppRoot />);
