import { useState } from 'react';
import type { Workspace } from '@gr8r/domain';
import { useUpdateWorkspace } from '../../workspace/queries';
import { WorkspaceLogo } from '../../../shared/ui/Brand';
import { showToast } from '../../../shared/ui/Toast';

interface Props {
  workspace?: Workspace;
}

function WorkspaceIdentity({ name, color }: { name: string; color: string }) {
  return (
    <div className="row" style={{ gap: 14, marginBottom: 18 }}>
      <WorkspaceLogo name={name || 'Gr8r'} color={color} brand size={52} />
      <div>
        <div className="label" style={{ marginBottom: 6 }}>
          Workspace icon
        </div>
        <div className="faint" style={{ fontSize: 12.5 }}>
          The Gr8r mark is used for this workspace.
        </div>
      </div>
    </div>
  );
}

function WorkspaceRows({ name, slug, onName }: { name: string; slug: string; onName: (v: string) => void }) {
  return (
    <>
      <div className="srow">
        <div>
          <div className="t">Workspace name</div>
          <div className="d">Shown in the sidebar and invites.</div>
        </div>
        <div className="row">
          <input className="input" value={name} onChange={event => onName(event.target.value)} aria-label="Workspace name" />
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

function WorkspaceBody({ name, slug, color, pending, onSave, onName }: {
  name: string;
  slug: string;
  color: string;
  pending: boolean;
  onSave: () => void;
  onName: (v: string) => void;
}) {
  return (
    <>
      <h1>Workspace</h1>
      <p className="lead">Settings that apply to everyone in this workspace.</p>
      <div className="sblock" style={{ marginTop: 0 }}>
        <WorkspaceIdentity name={name} color={color} />
        <WorkspaceRows name={name} slug={slug} onName={onName} />
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn btn-primary" type="button" onClick={onSave} disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
}

export function WorkspaceSection({ workspace }: Props) {
  const [name, setName] = useState(workspace?.name ?? '');
  const [color] = useState(workspace?.color ?? '#1D1C1A');
  const update = useUpdateWorkspace(workspace?.id ?? '');

  async function save() {
    if (!workspace) return;
    try {
      await update.mutateAsync({ name, color });
      showToast('Workspace updated', 'success');
    } catch {
      showToast('Failed to update workspace', 'error');
    }
  }

  return (
    <WorkspaceBody
      name={name}
      slug={workspace?.slug ?? 'gr8rstudio'}
      color={color}
      pending={update.isPending}
      onSave={save}
      onName={setName}
    />
  );
}
