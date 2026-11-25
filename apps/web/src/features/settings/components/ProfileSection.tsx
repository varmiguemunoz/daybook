import { useState } from 'react';
import type { Member } from '@gr8r/domain';
import { ROLE_LABELS } from '@gr8r/domain';
import { Avatar } from '../../../shared/ui/Avatar';
import { useUpdateMember } from '../../members/queries';
import { showToast } from '../../../shared/ui/Toast';

interface Props {
  me?: Member;
}

function ProfileIdentity({ me }: { me?: Member }) {
  return (
    <div className="row" style={{ gap: 14, marginBottom: 18 }}>
      <Avatar member={me} className="md" tip={false} />
      <div>
        <div className="t" style={{ fontWeight: 600 }}>
          {me?.name}
        </div>
        <div className="d">{me?.email}</div>
      </div>
    </div>
  );
}

function ProfileFields({ name, title, timezone, onName, onTitle, onTimezone }: {
  name: string;
  title: string;
  timezone: string;
  onName: (v: string) => void;
  onTitle: (v: string) => void;
  onTimezone: (v: string) => void;
}) {
  return (
    <>
      <div className="srow">
        <div>
          <div className="t">Name</div>
        </div>
        <div className="row">
          <input className="input" value={name} onChange={event => onName(event.target.value)} aria-label="Name" />
        </div>
      </div>
      <div className="srow">
        <div>
          <div className="t">Title</div>
        </div>
        <div className="row">
          <input className="input" value={title} onChange={event => onTitle(event.target.value)} aria-label="Title" />
        </div>
      </div>
      <div className="srow">
        <div>
          <div className="t">Timezone</div>
          <div className="d">Used for reminders and due dates.</div>
        </div>
        <div className="row">
          <input className="input" value={timezone} onChange={event => onTimezone(event.target.value)} aria-label="Timezone" />
        </div>
      </div>
    </>
  );
}

function ProfileBody({ me, name, title, timezone, roleLabel, pending, onSave, onName, onTitle, onTimezone }: {
  me?: Member;
  name: string;
  title: string;
  timezone: string;
  roleLabel: string;
  pending: boolean;
  onSave: () => void;
  onName: (v: string) => void;
  onTitle: (v: string) => void;
  onTimezone: (v: string) => void;
}) {
  return (
    <>
      <h1>Profile</h1>
      <p className="lead">Your personal details across the workspace.</p>
      <div className="sblock" style={{ marginTop: 0 }}>
        <ProfileIdentity me={me} />
        <ProfileFields name={name} title={title} timezone={timezone} onName={onName} onTitle={onTitle} onTimezone={onTimezone} />
        <div className="srow">
          <div>
            <div className="t">Role</div>
            <div className="d">Ask an owner to change your role.</div>
          </div>
          <div className="row">
            <span className="pillbtn">{roleLabel}</span>
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn-primary" type="button" onClick={onSave} disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}

export function ProfileSection({ me }: Props) {
  const [name, setName] = useState(me?.name ?? '');
  const [title, setTitle] = useState(me?.title ?? '');
  const [timezone, setTimezone] = useState(me?.timezone ?? 'UTC');
  const update = useUpdateMember(me?.id ?? '');
  const roleLabel = me ? ROLE_LABELS[me.role] : '—';

  async function save() {
    if (!me) return;
    try {
      await update.mutateAsync({ name, title, timezone });
      showToast('Profile updated', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    }
  }

  return (
    <ProfileBody
      me={me}
      name={name}
      title={title}
      timezone={timezone}
      roleLabel={roleLabel}
      pending={update.isPending}
      onSave={save}
      onName={setName}
      onTitle={setTitle}
      onTimezone={setTimezone}
    />
  );
}
