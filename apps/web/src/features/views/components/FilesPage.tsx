import { useState } from 'react';
import { Icon } from '../../../shared/ui/Icon';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { useFiles, usePresignUpload, useConfirmUpload } from '../../files/queries';
import type { FileRecord } from '@gr8r/domain';
import { showToast } from '../../../shared/ui/Toast';

function FilesBody({ files, uploading, onPick }: { files: FileRecord[]; uploading: boolean; onPick: (list: FileList | null) => void }) {
  return (
    <div className="page wide" style={{ paddingTop: 16 }}>
      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
          <Icon name="upload" size={13} />
          {uploading ? 'Uploading…' : 'Upload'}
          <input type="file" multiple hidden onChange={event => onPick(event.target.files)} />
        </label>
      </div>
      <label className="dropzone" style={{ marginBottom: 16 }}>
        <Icon name="upload-cloud" size={18} />
        <span>
          Drop files here or <span className="link">browse</span> — up to 250 MB each
        </span>
        <input type="file" multiple hidden onChange={event => onPick(event.target.files)} />
      </label>
      {!files.length ? (
        <EmptyState icon="folder-open" title="No files yet" text="Upload designs, documents, and assets to share them with the project." />
      ) : (
        <div className="fgrid">
          {files.map(file => (
            <div key={file.id} className="fcard">
              <div className="fi">
                <span className="fn trunc">{file.name}</span>
                <span className="fm">
                  {file.size} · {file.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilesPage() {
  const { data: files = [] } = useFiles();
  const presign = usePresignUpload();
  const confirm = useConfirmUpload();
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const presigned = await presign.mutateAsync({ projectId: undefined, name: file.name, mimeType: file.type || 'application/octet-stream' });
        await fetch(presigned.uploadUrl, { method: 'PUT', body: file, headers: { 'content-type': file.type || 'application/octet-stream' } });
        await confirm.mutateAsync({ projectId: undefined, fileId: presigned.fileId, key: presigned.key, name: file.name, sizeBytes: file.size, mimeType: file.type || 'application/octet-stream' });
      }
      showToast('Upload complete', 'success');
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="page flush">
      <PageHeader title="Files" subtitle="Designs, documents, and assets shared across projects." />
      <FilesBody files={files} uploading={uploading} onPick={handleFiles} />
    </div>
  );
}
