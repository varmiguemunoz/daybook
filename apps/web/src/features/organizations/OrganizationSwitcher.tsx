import { useState } from 'react';
import { useOrganization, useOrganizationList } from '@clerk/react';
import { Icon } from '../../shared/ui/Icon';
import { Modal } from '../../shared/ui/Modal';
import { Popover } from '../../shared/ui/Popover';
import { WorkspaceLogo } from '../../shared/ui/Brand';
import { CreateOrganizationForm } from './CreateOrganizationForm';

const LOGO_COLOR = '#1D1C1A';

function OrganizationMenu({ onSelect, onCreate }: { onSelect: (id: string) => void; onCreate: () => void }) {
  const { organization: active } = useOrganization();
  const { userMemberships } = useOrganizationList({ userMemberships: true });

  return (
    <div role="menu" aria-label="Organizations">
      {userMemberships.data?.map(({ organization }) => (
        <button
          key={organization.id}
          className="mi"
          type="button"
          role="menuitemradio"
          aria-checked={organization.id === active?.id}
          onClick={() => onSelect(organization.id)}
        >
          <WorkspaceLogo name={organization.name} color={LOGO_COLOR} size={18} />
          <span className="trunc">{organization.name}</span>
          {organization.id === active?.id && <Icon name="check" size={14} className="ck" />}
        </button>
      ))}
      <div className="msep" />
      <button className="mi" type="button" role="menuitem" onClick={onCreate}>
        <Icon name="plus" size={14} />
        New organization
      </button>
    </div>
  );
}

export function OrganizationSwitcher() {
  const { organization } = useOrganization();
  const { setActive } = useOrganizationList();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [creating, setCreating] = useState(false);
  const name = organization?.name ?? '';

  function select(id: string) {
    setAnchor(null);
    if (id !== organization?.id) void setActive?.({ organization: id });
  }

  function openCreate() {
    setAnchor(null);
    setCreating(true);
  }

  return (
    <>
      <button
        className="ws grow"
        type="button"
        aria-label="Switch organization"
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={event => setAnchor(anchor ? null : event.currentTarget)}
      >
        <WorkspaceLogo name={name} color={LOGO_COLOR} size={22} />
        <span className="ws-name trunc">{name}</span>
        <span className="chev-d faint">
          <Icon name="chevrons-up-down" size={13} />
        </span>
      </button>
      <Popover open={Boolean(anchor)} anchor={anchor} onClose={() => setAnchor(null)} className="pop enter">
        <OrganizationMenu onSelect={select} onCreate={openCreate} />
      </Popover>
      <Modal open={creating} onClose={() => setCreating(false)} title="New organization">
        <CreateOrganizationForm onCreated={() => setCreating(false)} />
      </Modal>
    </>
  );
}
