import type { ReactNode } from 'react';
import type { Folder } from '@daybook/domain';
import { OptionMenu } from '../../core/components/OptionMenu';
import { Icon } from '../../core/components/Icon';
import { pathLabel } from '../lib/folder-tree';

export const ROOT = '';

interface Props {
  label: string;
  folders: Folder[];
  value: string | null;
  exclude?: Set<string>;
  onSelect: (folderId: string | null) => void;
  className?: string;
  children: ReactNode;
}

export function folderOptions(folders: Folder[], exclude?: Set<string>, rootLabel = 'No folder') {
  return [
    { value: ROOT, label: rootLabel, icon: <Icon name="inbox" size={14} /> },
    ...folders
      .filter(folder => !exclude?.has(folder.id))
      .map(folder => ({ value: folder.id, label: pathLabel(folders, folder.id), icon: <Icon name="folder" size={14} /> }))
      .toSorted((a, b) => a.label.localeCompare(b.label)),
  ];
}

export function FolderPicker({ label, folders, value, exclude, onSelect, className, children }: Props) {
  const options = folderOptions(folders, exclude);

  return (
    <OptionMenu label={label} value={value ?? ROOT} options={options} onSelect={next => onSelect(next || null)} className={className}>
      {children}
    </OptionMenu>
  );
}
