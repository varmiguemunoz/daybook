import { Icon } from './Icon';

export function SearchField({ value, onChange, placeholder = 'Search tasks' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="inwrap">
      <Icon name="search" size={13} />
      <input
        className="input search-sm"
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </div>
  );
}
