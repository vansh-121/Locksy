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

    // Load preferences
    chrome.storage.local.get("domainUnlockPreferences", (data) => {
      const preferences = data.domainUnlockPreferences || {};

      // Clear container
      domainsContainer.textContent = '';

      // Create domain items
      domains.forEach(pattern => {
        const domainItem = document.createElement('div');
        domainItem.className = 'domain-item';

        // Domain info section
        const domainInfo = document.createElement('div');
        domainInfo.className = 'domain-info';

        const domainPattern = document.createElement('div');
        domainPattern.className = 'domain-pattern';
        const patternIcon = document.createElement('span');
        patternIcon.className = 'domain-pattern-icon';
        patternIcon.textContent = '🌐';
        domainPattern.appendChild(patternIcon);
        domainPattern.appendChild(document.createTextNode(pattern));
        domainInfo.appendChild(domainPattern);

        const domainMeta = document.createElement('div');
        domainMeta.className = 'domain-meta';
        domainMeta.textContent = 'Locked • All matching tabs protected';
        domainInfo.appendChild(domainMeta);

        domainItem.appendChild(domainInfo);

        // Domain actions section
        const domainActions = document.createElement('div');
        domainActions.className = 'domain-actions';

        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'btn-settings';
        settingsBtn.setAttribute('data-pattern', pattern);
        settingsBtn.title = 'Settings';
        settingsBtn.textContent = '⚙️ Settings';
        domainActions.appendChild(settingsBtn);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.setAttribute('data-pattern', pattern);
        removeBtn.textContent = '🗑️ Remove';
        domainActions.appendChild(removeBtn);

        domainItem.appendChild(domainActions);

        // Domain settings section
        const domainSettings = document.createElement('div');
        domainSettings.className = 'domain-settings';
        domainSettings.id = `settings-${pattern}`;
        domainSettings.style.display = 'none';

        const settingsContent = document.createElement('div');
        settingsContent.className = 'settings-content';

        const settingsTitle = document.createElement('h4');
        settingsTitle.textContent = 'Unlock Preferences';
        settingsContent.appendChild(settingsTitle);

        const prefLabel = document.createElement('p');
        prefLabel.className = 'preference-label';
        prefLabel.textContent = 'Default unlock behavior when password is entered:';
        settingsContent.appendChild(prefLabel);

        const prefOptions = document.createElement('div');
        prefOptions.className = 'preference-options';

        // Option 1: Ask me every time
        const option1 = document.createElement('label');
        option1.className = 'preference-option';
        const radio1 = document.createElement('input');
        radio1.type = 'radio';
        radio1.name = `pref-${pattern}`;
        radio1.value = 'none';
        radio1.className = 'pref-radio';
        if (!preferences[pattern]) radio1.checked = true;
        option1.appendChild(radio1);
        const span1 = document.createElement('span');
        span1.className = 'pref-text';
        span1.textContent = 'Ask me every time (default)';
        option1.appendChild(span1);
        prefOptions.appendChild(option1);

        // Option 2: This tab only
        const option2 = document.createElement('label');
        option2.className = 'preference-option';
        const radio2 = document.createElement('input');
        radio2.type = 'radio';
        radio2.name = `pref-${pattern}`;
        radio2.value = 'tab-only';
        radio2.className = 'pref-radio';
        if (preferences[pattern] === 'tab-only') radio2.checked = true;
        option2.appendChild(radio2);
        const span2 = document.createElement('span');
        span2.className = 'pref-text';
        span2.textContent = 'Always unlock this tab only';
        option2.appendChild(span2);
        prefOptions.appendChild(option2);

        // Option 3: All domain tabs
        const option3 = document.createElement('label');
        option3.className = 'preference-option';
        const radio3 = document.createElement('input');
        radio3.type = 'radio';
        radio3.name = `pref-${pattern}`;
        radio3.value = 'all-domain-tabs';
        radio3.className = 'pref-radio';
        if (preferences[pattern] === 'all-domain-tabs') radio3.checked = true;
        option3.appendChild(radio3);
        const span3 = document.createElement('span');
        span3.className = 'pref-text';
        span3.textContent = 'Always unlock all tabs for this domain';
        option3.appendChild(span3);
        prefOptions.appendChild(option3);

        settingsContent.appendChild(prefOptions);

        const savePrefBtn = document.createElement('button');
        savePrefBtn.className = 'btn-save-pref';
        savePrefBtn.setAttribute('data-pattern', pattern);
        savePrefBtn.textContent = 'Save Preference';
        settingsContent.appendChild(savePrefBtn);

        domainSettings.appendChild(settingsContent);
        domainItem.appendChild(domainSettings);

        domainsContainer.appendChild(domainItem);
      });

      // Add event listeners
      domainsContainer.querySelectorAll('.btn-settings').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const pattern = e.target.getAttribute('data-pattern');
          const settingsDiv = document.getElementById(`settings-${pattern}`);
          const isVisible = settingsDiv.style.display !== 'none';
          settingsDiv.style.display = isVisible ? 'none' : 'block';
        });
      });

      domainsContainer.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const pattern = e.target.getAttribute('data-pattern');
          handleUnlockDomain(pattern);
        });
      });

      domainsContainer.querySelectorAll('.btn-save-pref').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const pattern = e.target.getAttribute('data-pattern');
          const selectedRadio = document.querySelector(`input[name="pref-${pattern}"]:checked`);
          if (selectedRadio) {
            const value = selectedRadio.value;
            chrome.storage.local.get("domainUnlockPreferences", (data) => {
              const prefs = data.domainUnlockPreferences || {};
              if (value === 'none') {
                delete prefs[pattern];
              } else {
                prefs[pattern] = value;
              }
              chrome.storage.local.set({ domainUnlockPreferences: prefs }, () => {
                showNotification(`Preference saved for "${pattern}"!`, 'success');
              });
            });
          }
        });
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
