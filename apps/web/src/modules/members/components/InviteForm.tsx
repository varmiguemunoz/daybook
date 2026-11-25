import { useState } from 'react';
import type { Role } from '@daybook/domain';
import { useInviteMember } from '../services/queries';
import { showToast } from '../../core/components/Toast';

export function InviteForm() {
  const create = useInviteMember();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('member');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    try {
      await create.mutateAsync({ email: email.trim(), role });
      setEmail('');
      showToast('Invitation sent', 'success');
    } catch {
      showToast('Failed to send invitation', 'error');
    }
  }

  return (
    <form className="col" style={{ gap: 10 }} onSubmit={submit}>
      <input className="input" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" aria-label="Email" />
      <select className="select" value={role} onChange={event => setRole(event.target.value as typeof role)} aria-label="Role">
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button className="btn btn-primary" type="submit" disabled={create.isPending}>
        {create.isPending ? 'Inviting…' : 'Send invitation'}
      </button>
    </form>
  );
}
