const WORK_ALARM_NAME = 'workAlarm';
const BREAK_ALARM_NAME = 'breakAlarm';

let quotes = [];

async function loadQuotes() {
    try {
        const response = await fetch('quotes.json');
        quotes = await response.json();
        console.log("Quotes loaded successfully.");
    } catch (error) {
        console.error("Failed to load quotes.json:", error);
    }
}

function startWorkTimer() {
    chrome.storage.sync.get(['workDuration'], (result) => {
        const workDuration = result.workDuration || 20;
        chrome.alarms.create(WORK_ALARM_NAME, {
            delayInMinutes: workDuration
        });
        console.log(`Work timer started for ${workDuration} minutes.`);
    });
}

function showBreakNotification() {
    chrome.storage.sync.get(['breakDuration'], (result) => {
        const breakDuration = result.breakDuration || 5;
        
        let randomQuoteText = "Time to rest your eyes.";

        if (quotes && quotes.length > 0) {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            if (randomQuote && randomQuote.quote) {
                randomQuoteText = randomQuote.quote;
            }
        }

        chrome.notifications.create('break-notification', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Time for a break!',
            message: `Look away from the screen for ${breakDuration} minutes.`,
            contextMessage: randomQuoteText,
            priority: 2
        });

        chrome.alarms.create(BREAK_ALARM_NAME, {
            delayInMinutes: breakDuration
        });
        console.log(`Break started for ${breakDuration} minutes.`);
    });
}

function showWelcomeBackNotification() {
    chrome.notifications.create('welcome-back-notification', {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Break is over!',
        message: 'Welcome back! Starting the next work session.',
        priority: 2
    });
    startWorkTimer();
}


chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Eye Saver extension installed.');
    await loadQuotes();
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

chrome.alarms.onAlarm.addListener((alarm) => {
    chrome.alarms.clear(alarm.name);

    if (alarm.name === WORK_ALARM_NAME) {
        showBreakNotification();
    } else if (alarm.name === BREAK_ALARM_NAME) {
        showWelcomeBackNotification();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === "startTimer") {
        chrome.alarms.clearAll(() => {
            startWorkTimer();
            sendResponse({ status: "Timer restarted" });
        });
        return true;
    }
});

loadQuotes();
