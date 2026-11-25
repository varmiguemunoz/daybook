import { useState } from 'react';
import { useUser } from '@clerk/react';
import type { Member } from '@daybook/domain';
import { ROLE_LABELS } from '@daybook/domain';
import { Avatar } from '../../core/components/Avatar';
import { useUpdateMember } from '../../members/services/queries';
import { showToast } from '../../core/components/Toast';

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

function FieldRow({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="srow">
      <div>
        <div className="t">{label}</div>
        {hint && <div className="d">{hint}</div>}
      </div>
      <div className="row">
        <input className="input" value={value} onChange={event => onChange(event.target.value)} aria-label={label} />
      </div>
    </div>
  );
}

function ProfileFields({
  name,
  title,
  timezone,
  onName,
  onTitle,
  onTimezone,
}: {
  name: string;
  title: string;
  timezone: string;
  onName: (v: string) => void;
  onTitle: (v: string) => void;
  onTimezone: (v: string) => void;
}) {
  return (
    <>
      <FieldRow label="Name" value={name} onChange={onName} />
      <FieldRow label="Title" value={title} onChange={onTitle} />
      <FieldRow label="Timezone" hint="Used for reminders and due dates." value={timezone} onChange={onTimezone} />
    </>
  );
}

function RoleRow({ roleLabel }: { roleLabel: string }) {
  return (
    <div className="srow">
      <div>
        <div className="t">Role</div>
        <div className="d">Ask an admin to change your role.</div>
      </div>
      <div className="row">
        <span className="pillbtn">{roleLabel}</span>
      </div>
    </div>
  );
}

function ProfileBody({
  me,
  name,
  title,
  timezone,
  roleLabel,
  pending,
  onSave,
  onName,
  onTitle,
  onTimezone,
}: {
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
        <RoleRow roleLabel={roleLabel} />
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
  const { user } = useUser();
  const roleLabel = me ? ROLE_LABELS[me.role] : '—';

  async function save() {
    if (!me || !user) return;
    const [firstName = '', ...lastNames] = name.trim().split(/\s+/);
    try {
      await Promise.all([user.update({ firstName, lastName: lastNames.join(' ') }), update.mutateAsync({ title, timezone })]);
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
