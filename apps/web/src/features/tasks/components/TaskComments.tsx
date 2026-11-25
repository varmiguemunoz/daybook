import { useState } from 'react';
import { Avatar } from '../../../shared/ui/Avatar';
import { useComments, useCreateComment } from '../../comments/queries';
import { useMembers } from '../../members/queries';
import { showToast } from '../../../shared/ui/Toast';

interface Props {
  taskId: string;
}

export function TaskComments({ taskId }: Props) {
  const { data: members = [] } = useMembers();
  const { data: comments = [] } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const [body, setBody] = useState('');

  async function send() {
    if (!body.trim()) return;
    try {
      await createComment.mutateAsync({ taskId, body: body.trim() });
      setBody('');
    } catch {
      showToast('Failed to add comment', 'error');
    }
  }

  return (
    <div className="stack" style={{ marginTop: 16 }}>
      <h3>Comments</h3>
      {comments.map(item => (
        <div key={item.id} className="fitem">
          <Avatar member={members.find(member => member.id === item.authorId)} className="sm" />
          <div className="grow">{item.body}</div>
        </div>
      ))}
      <div className="row" style={{ gap: 8 }}>
        <input className="input" value={body} onChange={event => setBody(event.target.value)} placeholder="Add a comment" aria-label="Comment" />
        <button className="btn btn-primary btn-sm" type="button" onClick={send} disabled={createComment.isPending}>
          Send
        </button>
      </div>
    </div>
  );
}
