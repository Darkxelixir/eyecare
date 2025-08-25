// --- Constants ---
const WORK_ALARM_NAME = 'workAlarm';
const BREAK_ALARM_NAME = 'breakAlarm';

// --- State Management ---
let quotes = [];

// Fetch quotes from the local JSON file
async function loadQuotes() {
    try {
        const response = await fetch('quotes.json');
        quotes = await response.json();
        console.log("Quotes loaded successfully.");
    } catch (error) {
        console.error("Failed to load quotes.json:", error);
        // If quotes fail to load, the array will remain empty, and the fallback will be used.
    }
}

// --- Alarm and Notification Logic ---

// Function to start the main work timer
function startWorkTimer() {
    chrome.storage.sync.get(['workDuration'], (result) => {
        const workDuration = result.workDuration || 20; // Default to 20 minutes
        chrome.alarms.create(WORK_ALARM_NAME, {
            delayInMinutes: workDuration
        });
        console.log(`Work timer started for ${workDuration} minutes.`);
    });
}

// Function to show the break notification and start the break timer
function showBreakNotification() {
    chrome.storage.sync.get(['breakDuration'], (result) => {
        const breakDuration = result.breakDuration || 5; // Default to 5 minutes
        
        // --- FIX STARTS HERE ---
        let randomQuoteText = "Time to rest your eyes."; // A safe fallback quote

        // Check if the quotes array is loaded and has content before trying to access it.
        if (quotes && quotes.length > 0) {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            // Ensure the randomQuote object is valid before accessing its property
            if (randomQuote && randomQuote.quote) {
                randomQuoteText = randomQuote.quote;
            }
        }
        // --- FIX ENDS HERE ---

        chrome.notifications.create('break-notification', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Time for a break!',
            message: `Look away from the screen for ${breakDuration} minutes.`,
            contextMessage: randomQuoteText, // Use the safe quote text
            priority: 2
        });

        // Start the break timer
        chrome.alarms.create(BREAK_ALARM_NAME, {
            delayInMinutes: breakDuration
        });
        console.log(`Break started for ${breakDuration} minutes.`);
    });
}

// Function to show the "welcome back" notification and restart the work timer
function showWelcomeBackNotification() {
    chrome.notifications.create('welcome-back-notification', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Break is over!',
        message: 'Welcome back! Starting the next work session.',
        priority: 2
    });
    // Restart the work timer for the next cycle
    startWorkTimer();
}


// --- Event Listeners ---

// On extension install or update, set default values and start the first timer
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Eye Saver extension installed.');
    await loadQuotes(); // Load quotes into memory
    chrome.storage.sync.get(['workDuration', 'breakDuration'], (result) => {
        if (!result.workDuration || !result.breakDuration) {
            chrome.storage.sync.set({ workDuration: 20, breakDuration: 5 }, () => {
                startWorkTimer();
            });
        } else {
            startWorkTimer();
        }
    });
});

// Listener for when an alarm goes off
chrome.alarms.onAlarm.addListener((alarm) => {
    // Clear the alarm that just fired
    chrome.alarms.clear(alarm.name);

    if (alarm.name === WORK_ALARM_NAME) {
        showBreakNotification();
    } else if (alarm.name === BREAK_ALARM_NAME) {
        showWelcomeBackNotification();
    }
});

// Listener for messages from the popup (e.g., when settings are updated)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === "startTimer") {
        // Clear any existing alarms and start fresh
        chrome.alarms.clearAll(() => {
            startWorkTimer();
            sendResponse({ status: "Timer restarted" });
        });
        return true; // Indicates you will send a response asynchronously
    }
});

// Load quotes when the service worker starts up
loadQuotes();
