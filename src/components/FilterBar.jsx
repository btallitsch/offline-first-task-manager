import { Search, X } from 'lucide-react';

const PRIORITIES = ['all', 'high', 'medium', 'low'];
const STATUSES = ['all', 'todo', 'in-progress', 'done'];

export function FilterBar({ filters, onChange }) {
  return (
    <div className="filter-bar">
      <div className="search-wrapper">
        <Search size={14} className="search-icon" />
        <input
          className="search-input"
          placeholder="Search tasks…"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
        />
        {filters.query && (
          <button className="btn-icon" onClick={() => onChange({ ...filters, query: '' })}>
            <X size={12} />
          </button>
        )}
      </div>

      <div className="filter-group">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`filter-chip ${filters.status === s ? 'active' : ''}`}
            onClick={() => onChange({ ...filters, status: s })}
          >
            {s === 'all' ? 'All' : capitalize(s)}
          </button>
        ))}
      </div>

      <div className="filter-group">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            className={`filter-chip priority-${p} ${filters.priority === p ? 'active' : ''}`}
            onClick={() => onChange({ ...filters, priority: p })}
          >
            {p === 'all' ? 'Any Priority' : capitalize(p)}
          </button>
        ))}
      </div>
    </div>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
