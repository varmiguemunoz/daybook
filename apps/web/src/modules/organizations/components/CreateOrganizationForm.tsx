import { useState, type FormEvent } from 'react';
import { useOrganizationList } from '@clerk/react';
import { isClerkAPIResponseError } from '@clerk/react/errors';

const FALLBACK_ERROR = 'Could not create the organization. Try again.';

function useCreateOrganization(onCreated?: () => void) {
  const { createOrganization, setActive } = useOrganizationList();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function create(name: string) {
    if (!createOrganization || !setActive) return;
    setPending(true);
    setError('');
    try {
      const organization = await createOrganization({ name });
      await setActive({ organization: organization.id });
      onCreated?.();
    } catch (cause) {
      setError(isClerkAPIResponseError(cause) ? (cause.errors[0]?.longMessage ?? FALLBACK_ERROR) : FALLBACK_ERROR);
    } finally {
      setPending(false);
    }
  }

  return { create, pending, error };
}

export function CreateOrganizationForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const { create, pending, error } = useCreateOrganization(onCreated);

  function submit(event: FormEvent) {
    event.preventDefault();
    void create(name.trim());
  }

  return (
    <form className="col" style={{ gap: 14 }} onSubmit={submit}>
      <div className="field">
        <label className="label" htmlFor="organization-name">
          Organization name
        </label>
        <input
          id="organization-name"
          className="input input-lg"
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Acme Studio"
          maxLength={64}
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby="organization-name-note"
        />
        <p id="organization-name-note" className={error ? 'err' : 'hint'} role={error ? 'alert' : undefined}>
          {error || 'You can rename it and invite people later.'}
        </p>
      </div>
      <button className="btn btn-primary" type="submit" disabled={pending || !name.trim()}>
        {pending ? 'Creating…' : 'Create organization'}
      </button>
    </form>
  );
}
