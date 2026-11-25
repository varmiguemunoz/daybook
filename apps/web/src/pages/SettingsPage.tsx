import { useSearchParams } from 'react-router-dom';
import { SettingsNav } from '../modules/settings/components/SettingsNav';
import { SettingsBody } from '../modules/settings/components/SettingsBody';

const WIDE_SECTIONS = new Set(['members', 'teams', 'permissions']);

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const section = params.get('section') ?? 'workspace';

  return (
    <div className="set">
      <SettingsNav section={section} onSelect={key => setParams({ section: key })} />
      <div className="set-body" data-keep={`set:${section}`}>
        <div className={`set-in ${WIDE_SECTIONS.has(section) ? 'wide' : ''}`.trim()}>
          <SettingsBody section={section} />
        </div>
      </div>
    </div>
  );
}
