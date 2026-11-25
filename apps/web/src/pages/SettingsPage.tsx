import { useState } from 'react';
import { SettingsNav } from '../features/settings/components/SettingsNav';
import { SettingsBody } from '../features/settings/components/SettingsBody';

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
