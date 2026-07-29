import React from 'react';
import { useStorage } from '../context/StorageContext';
import { ChevronRight, Folder, Home, Sparkles, CheckSquare } from 'lucide-react';

export function Breadcrumbs() {
  const {
    folderPath,
    navigateToFolder,
    activeCategory,
    displayedFolders,
    displayedFiles,
    selectedItems,
    selectAllDisplayedItems
  } = useStorage();

  const totalItems = displayedFolders.length + displayedFiles.length;

  const categoryTitles = {
    all: null,
    image: 'Photos & Media',
    document: 'Documents & PDF Reports',
    video: 'Video Vault',
    audio: 'Audio Files',
    code: 'Code & Development Scripts',
    starred: 'Starred / Favorite Items',
    trash: 'Trash / Recycled Bin'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    }}>
      {/* Trail Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {activeCategory !== 'all' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {categoryTitles[activeCategory] || 'Vault Category'}
            </span>
          </div>
        ) : (
          (folderPath || []).map((item, index) => {
            const isLast = index === (folderPath || []).length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight size={16} color="var(--text-muted)" />}
                <button
                  onClick={() => navigateToFolder(item.id, item.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: isLast ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    border: isLast ? '1px solid var(--border-strong)' : 'none',
                    padding: isLast ? '6px 12px' : '4px 8px',
                    borderRadius: 'var(--radius-md)',
                    color: isLast ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: isLast ? '700' : '500',
                    fontSize: isLast ? '1.05rem' : '0.9rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {index === 0 ? <Home size={16} /> : <Folder size={16} />}
                  <span>{item.name}</span>
                </button>
              </React.Fragment>
            );
          })
        )}
      </nav>

      {/* Right Controls: Select All & Item Counter Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {displayedFiles.length > 0 && (
          <button
            className="btn btn-secondary"
            onClick={selectAllDisplayedItems}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem',
              fontWeight: 700, gap: '6px',
              border: selectedItems.length > 0 ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              color: selectedItems.length > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)'
            }}
          >
            <CheckSquare size={14} />
            <span>{selectedItems.length === displayedFiles.length ? 'Deselect All' : `Select All (${displayedFiles.length})`}</span>
          </button>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-surface)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)'
        }}>
          <Sparkles size={14} color="var(--accent-primary)" />
          <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
