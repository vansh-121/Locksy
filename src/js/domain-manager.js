// Domain Manager Script

document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.getElementById('backButton');
  const domainPatternInput = document.getElementById('domainPattern');
  const lockDomainBtn = document.getElementById('lockDomain');
  const domainsContainer = document.getElementById('domainsContainer');
  const noDomainsMessage = document.getElementById('noDomainsMessage');
  const domainCount = document.getElementById('domainCount');

  // Back button
  backButton.addEventListener('click', () => {
    window.close();
  });

  // Lock domain button
  lockDomainBtn.addEventListener('click', () => {
    handleLockDomain();
  });

  // Enter key support
  domainPatternInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleLockDomain();
    }
  });

  // Load locked domains on page load
  loadLockedDomains();

  function handleLockDomain() {
    const pattern = domainPatternInput.value.trim();

    if (!pattern) {
      showNotification('Please enter a domain pattern!', 'warning');
      return;
    }

    // Check if extension is active
    chrome.storage.local.get('extensionActive', (data) => {
      if (!data.extensionActive) {
        showNotification('Please activate the extension first!', 'warning');
        return;
      }

      // Check if password is set
      chrome.storage.local.get('lockPassword', (passwordData) => {
        if (!passwordData.lockPassword) {
          showNotification('Please set a master password first!', 'warning');
          return;
        }

        // Send lock domain message to background
        chrome.runtime.sendMessage({
          action: 'lockDomain',
          pattern: pattern
        }, (response) => {
          if (chrome.runtime.lastError) {
            showNotification('Failed to lock domain: ' + chrome.runtime.lastError.message, 'error');
          } else if (response && response.success) {
            showNotification(`Domain "${pattern}" locked successfully!`, 'success');
            domainPatternInput.value = '';
            loadLockedDomains();
          } else if (response && response.error) {
            showNotification(response.error, 'error');
          }
        });
      });
    });
  }

  function loadLockedDomains() {
    chrome.runtime.sendMessage({ action: 'getLockedDomains' }, (response) => {
      if (response && response.success && response.domains) {
        displayLockedDomains(response.domains);
      }
    });
  }

  function displayLockedDomains(domains) {
    // Update count
    domainCount.textContent = domains.length;

    if (domains.length === 0) {
      domainsContainer.innerHTML = `
        <div id="noDomainsMessage" class="no-domains-message">
          <div class="empty-state">
            <span class="empty-icon">🔓</span>
            <p>No domains locked yet</p>
            <small>Add a domain pattern above to get started</small>
          </div>
        </div>
      `;
      return;
    }

    domainsContainer.innerHTML = domains.map(pattern => `
      <div class="domain-item">
        <div class="domain-info">
          <div class="domain-pattern">
            <span class="domain-pattern-icon">🌐</span>${escapeHtml(pattern)}
          </div>
          <div class="domain-meta">
            Locked • All matching tabs protected
          </div>
        </div>
        <div class="domain-actions">
          <button class="btn-unlock" data-pattern="${escapeHtml(pattern)}">
            🗑️ Remove
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners to unlock buttons
    domainsContainer.querySelectorAll('.btn-unlock').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pattern = e.target.getAttribute('data-pattern');
        handleUnlockDomain(pattern);
      });
    });
  }

  function handleUnlockDomain(pattern) {
    if (confirm(`Remove domain lock for "${pattern}"?\n\nThis will unlock all tabs matching this pattern.`)) {
      chrome.runtime.sendMessage({
        action: 'unlockDomain',
        pattern: pattern
      }, (response) => {
        if (response && response.success) {
          showNotification(`Domain "${pattern}" unlocked successfully!`, 'success');
          loadLockedDomains();
        } else {
          showNotification('Failed to unlock domain', 'error');
        }
      });
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
});
