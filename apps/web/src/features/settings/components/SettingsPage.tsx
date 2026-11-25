import { useState } from 'react';
import { SettingsNav } from './SettingsNav';
import { SettingsBody } from './SettingsBody';

export function SettingsPage() {
  const [section, setSection] = useState('workspace');

  return (
    <div className="set">
      <SettingsNav section={section} onSelect={setSection} />
      <div className="set-body" data-keep={`set:${section}`}>
        <div className="set-in">
          <SettingsBody section={section} />
        </div>
      </div>
    </div>
  );
}
