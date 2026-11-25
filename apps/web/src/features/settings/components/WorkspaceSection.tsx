import { useState } from 'react';
import { useOrganization } from '@clerk/react';
import { WorkspaceLogo } from '../../../shared/ui/Brand';
import { showToast } from '../../../shared/ui/Toast';
import { useCanManageOrganization } from '../../members/queries';

const LOGO_COLOR = '#1D1C1A';

function WorkspaceIdentity({ name }: { name: string }) {
  return (
    <div className="row" style={{ gap: 14, marginBottom: 18 }}>
      <WorkspaceLogo name={name || 'W'} color={LOGO_COLOR} size={52} />
      <div>
        <div className="label" style={{ marginBottom: 6 }}>
          Workspace icon
        </div>
        <div className="faint" style={{ fontSize: 12.5 }}>
          Generated from the workspace name.
        </div>
      </div>
    </div>
  );
}

function WorkspaceRows({ name, slug, editable, onName }: { name: string; slug: string; editable: boolean; onName: (v: string) => void }) {
  return (
    <>
      <div className="srow">
        <div>
          <div className="t">Workspace name</div>
          <div className="d">Shown in the sidebar and invites.</div>
        </div>
        <div className="row">
          <input className="input" value={name} onChange={event => onName(event.target.value)} disabled={!editable} aria-label="Workspace name" />
        </div>
      </div>
      <div className="srow">
        <div>
          <div className="t">Workspace URL</div>
          <div className="d">Used in links shared with your team.</div>
        </div>
        <div className="row">
          <span className="faint num">{slug}</span>
        </div>
      </div>
    </>
  );
}

function useRenameWorkspace() {
  const { organization } = useOrganization();
  const [pending, setPending] = useState(false);

  async function rename(name: string) {
    if (!organization) return;
    setPending(true);
    try {
      await organization.update({ name });
      showToast('Workspace updated', 'success');
    } catch {
      showToast('Failed to update workspace', 'error');
    } finally {
      setPending(false);
    }
  }

  return { rename, pending };
}

export function WorkspaceSection() {
  const { organization } = useOrganization();
  const editable = useCanManageOrganization();
  const [name, setName] = useState(organization?.name ?? '');
  const { rename, pending } = useRenameWorkspace();

  return (
    <>
      <h1>Workspace</h1>
      <p className="lead">Settings that apply to everyone in this workspace.</p>
      <div className="sblock" style={{ marginTop: 0 }}>
        <WorkspaceIdentity name={name} />
        <WorkspaceRows name={name} slug={organization?.slug ?? ''} editable={editable} onName={setName} />
        {editable && (
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn btn-primary" type="button" onClick={() => rename(name.trim())} disabled={pending || !name.trim()}>
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
