import React, { useState, useEffect } from 'react';
import { Navbar, Nav, NavDropdown, Modal, Button } from 'react-bootstrap';
import { ipcRenderer } from 'electron';

interface MenuBarProps {
  documentName: string | null;
  isDocumentModified: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onRevert: () => void;
  onOpenRecent: (path: string) => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
  documentName,
  isDocumentModified,
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onRevert,
  onOpenRecent
}) => {
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Load recent files
  useEffect(() => {
    const loadRecentFiles = async () => {
      try {
        const recents = await ipcRenderer.invoke('get-recent-files');
        setRecentFiles(recents);
      } catch (error) {
        console.error('Failed to load recent files:', error);
      }
    };

    loadRecentFiles();

    // Listen for window close events to handle unsaved changes
    const handleBeforeUnload = (e: any) => {
      if (isDocumentModified) {
        e.preventDefault();
        setShowUnsavedDialog(true);
        setPendingAction('close');
        return false;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDocumentModified]);

  useEffect(() => {
    // Listen for close requests from main process
    const handleElectronCloseRequest = (_event: any) => {
      console.log("Renderer received app-close-requested from main");
      if (isDocumentModified) {
        setShowUnsavedDialog(true);
        setPendingAction('close');
      } else {
        // No unsaved changes, safe to close immediately
        console.log("No unsaved changes, closing app directly");
        ipcRenderer.send('confirm-close-app');
      }
    };
    
    // Listen for app-close-requested from main process directly
    if (ipcRenderer) {
      ipcRenderer.on('app-close-requested', handleElectronCloseRequest);
      
      return () => {
        ipcRenderer.removeListener('app-close-requested', handleElectronCloseRequest);
      };
    }
    
    return undefined;
  }, [isDocumentModified]);

  const handleAction = (action: string) => {
    if (isDocumentModified) {
      setShowUnsavedDialog(true);
      setPendingAction(action);
    } else {
      executeAction(action);
    }
  };

  const executeAction = (action: string) => {
    console.log(`Executing action: ${action}`);
    switch (action) {
      case 'new':
        onNew();
        break;
      case 'open':
        onOpen();
        break;
      case 'save':
        onSave();
        break;
      case 'saveAs':
        onSaveAs();
        break;
      case 'revert':
        onRevert();
        break;
      case 'close':
        console.log("Sending confirm-close-app from executeAction");
        ipcRenderer.send('confirm-close-app');
        break;
      default:
        break;
    }
  };

  const handleUnsavedDialogAction = (saveAction: string) => {
    setShowUnsavedDialog(false);
    
    if (saveAction === 'save') {
      // Handle save action
      onSave();
      if (pendingAction) {
        // After saving, perform the pending action
        executeAction(pendingAction);
      }
    } else if (saveAction === 'discard') {
      // Handle "Don't Save" action
      console.log("User clicked 'Don't Save', pending action:", pendingAction);
      
      if (pendingAction) {
        executeAction(pendingAction);
      } else {
        // If no specific pending action but we're closing
        console.log("Sending confirm-close-app to main process");
        ipcRenderer.send('confirm-close-app');
      }
    }
    // If saveAction is 'cancel', just close the dialog which we already did
    
    setPendingAction(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Command+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        onSave();
      }
      
      // Ctrl+Shift+S or Command+Shift+S (Save As)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        onSaveAs();
      }
      
      // Ctrl+O or Command+O (Open)
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleAction('open');
      }
      
      // Ctrl+N or Command+N (New)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleAction('new');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSave, onSaveAs, onOpen, isDocumentModified]);

  return (
    <>
      <Navbar bg="light" expand="lg" className="app-menubar py-0 px-2 nav-pills">
        <Navbar.Brand className="ms-2 font-monospace text-secondary py-0">
          {documentName ? (
            <>
              {isDocumentModified && '*'}{documentName}
            </>
          ) : (
            <></>
          )}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown title="File" id="file-dropdown">
              <NavDropdown.Item onClick={() => handleAction('new')}>
                New <span className="shortcut">Ctrl+N</span>
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => handleAction('open')}>
                Open... <span className="shortcut">Ctrl+O</span>
              </NavDropdown.Item>
              
              {recentFiles.length > 0 && (
                <>
                  <NavDropdown.Divider />
                  <NavDropdown title="Recent Files" id="recent-files-dropdown" drop="end" className='nav-item'>
                    {recentFiles.map((file, index) => (
                      <NavDropdown.Item 
                        key={index}
                        onClick={() => onOpenRecent(file)}
                      >
                        {file.split('/').pop()}
                      </NavDropdown.Item>
                    ))}
                    <NavDropdown.Divider />
                    <NavDropdown.Item 
                      onClick={async () => {
                        await ipcRenderer.invoke('clear-recent-files');
                        setRecentFiles([]);
                      }}
                    >
                      Clear Recent Files
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              )}
              
              <NavDropdown.Divider />
              <NavDropdown.Item 
                onClick={() => onSave()}
                disabled={!isDocumentModified && documentName !== null}
              >
                Save <span className="shortcut">Ctrl+S</span>
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => onSaveAs()}>
                Save As... <span className="shortcut">Ctrl+Shift+S</span>
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              <NavDropdown.Item 
                onClick={() => handleAction('revert')}
                disabled={!isDocumentModified || documentName === null}
              >
                Revert to Saved
              </NavDropdown.Item>
              
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={() => handleAction('close')}>
                Exit
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* Unsaved Changes Dialog */}
      <Modal
        show={showUnsavedDialog}
        onHide={() => handleUnsavedDialogAction('cancel')}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Unsaved Changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Do you want to save changes to "{documentName || 'Untitled'}"?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => handleUnsavedDialogAction('cancel')}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleUnsavedDialogAction('discard')}>
            Don't Save
          </Button>
          <Button variant="primary" onClick={() => handleUnsavedDialogAction('save')}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MenuBar;