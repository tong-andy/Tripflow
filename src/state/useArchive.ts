import { useContext } from 'react';
import { ArchiveContext } from './archiveContextValue';
export function useArchive() {
  const value = useContext(ArchiveContext);
  if (!value) throw new Error('useArchive must be used inside ArchiveProvider.');
  return value;
}
