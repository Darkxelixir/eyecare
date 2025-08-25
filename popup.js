const workDurationInput = document.getElementById('work-duration');
const breakDurationInput = document.getElementById('break-duration');
const saveButton = document.getElementById('save-button');
const statusMessage = document.getElementById('status-message');

// Load saved settings when the popup is opened
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['workDuration', 'breakDuration'], (result) => {
        workDurationInput.value = result.workDuration || 20;
        breakDurationInput.value = result.breakDuration || 5;
    });
});

// Save settings when the button is clicked
saveButton.addEventListener('click', () => {
    const workDuration = parseInt(workDurationInput.value, 10);
    const breakDuration = parseInt(breakDurationInput.value, 10);

    if (workDuration > 0 && breakDuration > 0) {
        chrome.storage.sync.set({ workDuration, breakDuration }, () => {
            // Send a message to the background script to restart the timer
            chrome.runtime.sendMessage({ command: "startTimer" }, (response) => {
                if (chrome.runtime.lastError) {
                    statusMessage.textContent = "Error starting timer.";
                } else {
                    statusMessage.textContent = 'Settings saved! Your next reminder is set.';
                    setTimeout(() => statusMessage.textContent = '', 3000);
                }
            });
        });
    } else {
        statusMessage.textContent = 'Please enter valid numbers greater than 0.';
        setTimeout(() => statusMessage.textContent = '', 3000);
    }
});
