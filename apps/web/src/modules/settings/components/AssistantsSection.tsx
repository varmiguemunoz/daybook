import type { ReactNode } from 'react';
import { Icon } from '../../core/components/Icon';
import { showToast } from '../../core/components/Toast';
import { MCP_URL } from '../../core/services/api-client';

async function copy(value: string, what: string) {
  try {
    await navigator.clipboard.writeText(value);
    showToast(`${what} copied`, 'success');
  } catch {
    showToast('Could not copy. Select the text and copy it instead.', 'error');
  }
}

function CopyField({ value, what }: { value: string; what: string }) {
  return (
    <div className="ai-copy">
      <code>{value}</code>
      <button className="btn btn-secondary btn-sm" type="button" onClick={() => void copy(value, what)} aria-label={`Copy ${what.toLowerCase()}`}>
        <Icon name="copy" size={13} />
        Copy
      </button>
    </div>
  );
}

function Client({ name, steps, note }: { name: string; steps: ReactNode[]; note: string }) {
  return (
    <section className="sblock">
      <h2>{name}</h2>
      <ol className="ai-steps">
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      <p className="ai-note">{note}</p>
    </section>
  );
}

const CLIENTS: Array<{ name: string; steps: ReactNode[]; note: string }> = [
  {
    name: 'Claude',
    steps: [
      <>
        Open <b>Customize → Connectors</b> and choose <b>Add custom connector</b>.
      </>,
      <>
        Name it <b>Daybook</b>, paste the server URL and select <b>Add</b>.
      </>,
      <>
        Select <b>Connect</b> and sign in.
      </>,
    ],
    note: 'Works in Claude, Claude Desktop and Cowork. The Free plan allows one custom connector; on Team and Enterprise plans an owner adds it first.',
  },
  {
    name: 'ChatGPT',
    steps: [
      <>
        Turn on <b>Developer mode</b> in <b>Settings → Apps → Advanced settings</b>.
      </>,
      <>
        Select <b>Create app</b>, name it <b>Daybook</b>, paste the server URL and choose <b>OAuth</b>.
      </>,
      <>Sign in when ChatGPT asks.</>,
    ],
    note: 'Developer mode is available on Plus, Pro, Business, Enterprise and Edu, on the web.',
  },
  {
    name: 'Codex',
    steps: [
      <>
        Add the server from a terminal:
        <CopyField value={`codex mcp add daybook --url ${MCP_URL}`} what="Command" />
      </>,
      <>
        Sign in:
        <CopyField value="codex mcp login daybook" what="Command" />
      </>,
    ],
    note: 'The ChatGPT desktop app and the Codex IDE extension share this setup.',
  },
];

export function AssistantsSection() {
  return (
    <>
      <h1>AI assistants</h1>
      <p className="lead">
        Connect Claude, ChatGPT or Codex to work with your tasks and notes from a chat. They sign in as you and only reach the workspaces you belong to.
      </p>
      <section className="sblock" style={{ marginTop: 0 }}>
        <h2>Server URL</h2>
        <CopyField value={MCP_URL} what="Server URL" />
        <p className="ai-note">The first time, the assistant opens Daybook so you can sign in and approve access.</p>
      </section>
      {CLIENTS.map(client => (
        <Client key={client.name} {...client} />
      ))}
      <section className="sblock">
        <h2>What they can do</h2>
        <p className="ai-body">
          Everything you can do in the app with your role: tasks, comments, notes, folders, teams and notifications, and inviting or removing people if you are
          an admin. Changes appear live for your team and show <b>via AI assistant</b> in Activity. To disconnect, remove Daybook from the assistant&apos;s
          connectors.
        </p>
      </section>
    </>
  );
}
