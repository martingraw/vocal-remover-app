document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  
  // App state
  let currentModel = localStorage.getItem('spleeterModel') || '5stems';
  
  // DOM Elements - Main UI
  const audioFileInput = document.getElementById('audioFile');
  const fileDropArea = document.getElementById('dropArea');
  const fileNameDisplay = document.getElementById('fileName');
  const uploadBtn = document.getElementById('uploadBtn');
  const statusSection = document.getElementById('status');
  const resultsSection = document.getElementById('results');
  const errorSection = document.getElementById('error');
  const waveformContainer = document.querySelector('.waveform-container');
  const audioPlayersContainer = document.getElementById('audioPlayersContainer');
  
  // DOM Elements - Navigation
  const navHome = document.querySelector('.nav-item:nth-child(1)');
  const navHowItWorks = document.querySelector('.nav-item:nth-child(2)');
  const navSettings = document.querySelector('.nav-item:nth-child(3)');
  
  // DOM Elements - Modals
  const howItWorksModal = document.getElementById('howItWorksModal');
  const settingsModal = document.getElementById('settingsModal');
  const modelSelect = document.getElementById('modelSelect');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const closeModalBtns = document.querySelectorAll('[data-close-modal]');

  // File Drop Area Functionality
  fileDropArea.addEventListener('click', () => {
    audioFileInput.click();
  });

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    fileDropArea.addEventListener(eventName, unhighlight, false);
  });

  // Handle dropped files
  fileDropArea.addEventListener('drop', handleDrop, false);

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    fileDropArea.classList.add('highlight');
  }

  function unhighlight() {
    fileDropArea.classList.remove('highlight');
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
      audioFileInput.files = files;
      updateFileName(files[0]);
    }
  }

  // Handle file selection via input
  audioFileInput.addEventListener('change', () => {
    if (audioFileInput.files.length > 0) {
      updateFileName(audioFileInput.files[0]);
    } else {
      resetFileSelection();
    }
  });

  function updateFileName(file) {
    fileNameDisplay.textContent = file.name;
    uploadBtn.disabled = false;
  }

  function resetFileSelection() {
    fileNameDisplay.textContent = '';
    uploadBtn.disabled = true;
  }

  // Initialize settings
  modelSelect.value = currentModel;
  
  // Navigation event listeners
  navHome.addEventListener('click', (e) => {
    e.preventDefault();
    resetApp();
    setActiveNavItem(navHome);
  });
  
  navHowItWorks.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(howItWorksModal);
    setActiveNavItem(navHowItWorks);
  });
  
  navSettings.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(settingsModal);
    setActiveNavItem(navSettings);
  });
  
  // Modal event listeners
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      closeAllModals();
    });
  });
  
  saveSettingsBtn.addEventListener('click', () => {
    currentModel = modelSelect.value;
    localStorage.setItem('spleeterModel', currentModel);
    closeAllModals();
    setActiveNavItem(navHome);
  });
  
  // Close modals when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeAllModals();
    }
  });
  
  // Process Audio Button Click
  uploadBtn.addEventListener('click', async () => {
    if (!audioFileInput.files.length) {
      alert('Please select an audio file first.');
      return;
    }

    const file = audioFileInput.files[0];
    
    // Check file size (limit to 10MB for serverless function)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    // Show processing status
    statusSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    waveformContainer.classList.add('hidden');
    uploadBtn.disabled = true;

    try {
      // Read the file as base64
      const base64File = await readFileAsBase64(file);
      const modelName = "5stems"; // Hardcode to 5stems
      
      // Send to serverless function
      const response = await fetch('https://p01--vocal-remover-api--tdhrgr9lvps2.code.run/process/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: base64File, modelName: currentModel }),
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json(); // { stems: { /* ... */ }, modelUsed: "..." }
      
      audioPlayersContainer.innerHTML = ''; // Clear previous results

      for (const stemName in data.stems) {
        if (data.stems.hasOwnProperty(stemName)) {
          const base64Data = data.stems[stemName];
          const audioUrl = `data:audio/wav;base64,${base64Data}`;
          const originalFileName = file.name.replace(/\.[^/.]+$/, "");
          
          const playerCard = document.createElement('div');
          playerCard.classList.add('audio-player-card', stemName.toLowerCase()); // e.g., 'vocals', 'drums'

          const header = document.createElement('div');
          header.classList.add('audio-player-header');
          
          const icon = document.createElement('div');
          icon.classList.add('track-icon');
          header.appendChild(icon);
          
          const title = document.createElement('h3');
          title.textContent = stemName.charAt(0).toUpperCase() + stemName.slice(1);
          header.appendChild(title);
          playerCard.appendChild(header);
          
          const body = document.createElement('div');
          body.classList.add('audio-player-body');
          
          const audioPlayer = document.createElement('audio');
          audioPlayer.controls = true;
          audioPlayer.src = audioUrl;
          body.appendChild(audioPlayer);
          
          const downloadLink = document.createElement('a');
          downloadLink.classList.add('download-btn');
          downloadLink.href = audioUrl;
          downloadLink.download = `${originalFileName}_${stemName}.wav`;
          downloadLink.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
            </svg>
            Download ${stemName.charAt(0).toUpperCase() + stemName.slice(1)}
          `;
          body.appendChild(downloadLink);
          playerCard.appendChild(body);
          
          audioPlayersContainer.appendChild(playerCard);
        }
      }
      
      // Show results
      resultsSection.classList.remove('hidden');
    } catch (error) {
      console.error('Error:', error);
      errorSection.classList.remove('hidden');
    } finally {
      statusSection.classList.add('hidden');
    }
  });

  // Helper function to read file as base64
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Add highlight style for file drop area
  document.head.insertAdjacentHTML('beforeend', `
    <style>
      .file-drop-area.highlight {
        border-color: var(--accent-pink);
        background-color: rgba(231, 59, 112, 0.05);
      }
    </style>
  `);
  
  // Helper functions
  function resetApp() {
    // Clear file input
    audioFileInput.value = '';
    fileNameDisplay.textContent = '';
    uploadBtn.disabled = true;
    
    // Reset audio players container
    audioPlayersContainer.innerHTML = '';
    
    // Hide results and error sections
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    
    // Show waveform visualization
    waveformContainer.classList.remove('hidden');
  }
  
  function setActiveNavItem(navItem) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to clicked nav item
    navItem.classList.add('active');
  }
  
  function openModal(modal) {
    // Close any open modals first
    closeAllModals();
    
    // Open the specified modal
    const modalContent = modal.querySelector('.modal'); // Get the actual modal content div
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling of iframe body

    // Scroll the modal content into view
    if (modalContent) {
      // A slight delay can sometimes help ensure the modal is fully rendered and positioned
      // before scrolling, especially if there are CSS transitions.
      setTimeout(() => {
        modalContent.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
      }, 50); // 50ms delay, adjust if needed
    }
  }
  
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = ''; // Restore scrolling
  }
});
