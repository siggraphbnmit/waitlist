// DOM Elements
const nameField = document.getElementById("nameField");
const emailField = document.getElementById("emailField");
const phoneField = document.getElementById("phoneField");
const submitButton = document.getElementById("submitButton");
const popupMessage = document.getElementById("popupMessage");
const popupButton = document.getElementById("popupButton");
const loadingScreen = document.getElementById("loadingScreen");
const progressBar = document.getElementById("progressBar");
const loadingText = document.getElementById("loadingText");
const inputFields = document.getElementById("inputFields");
const initialPrompt = document.getElementById("initialPrompt");
const yesButton = document.getElementById("yesButton");
const contentText=document.getElementById("content");


const loadingMessages = [
    "Preparing your creative journey... 🎨",
    "Reserving your spot in the design universe 🚀",
    "Connecting you with fellow magicians... 🤝",
    "Loading amazing opportunities... ✨",
    "Getting things ready for you... 🌟",
    "Fueling your creative potential... 💫",
    "Making space for innovation... 🎯",
    "Crafting your creative future... 🔮",
    "Adding a sprinkle of design magic... ✨",
    "Preparing for an amazing experience... 🎨",
    "Igniting your creative spark... 💡",
    "Building your pathway to innovation... 🛠️",
    "Unlocking creative possibilities... 🗝️",
    "Setting up your design adventure... 🎭",
    "Creating something special for you... 🎪"
];

const firebaseConfig = {
    apiKey: "AIzaSyBR08BDsS3ny7XQ-N1mezON22wta6QaM3k",
    authDomain: "sigg-waitlist-2024.firebaseapp.com",
    databaseURL: "https://sigg-waitlist-2024-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sigg-waitlist-2024",
    storageBucket: "sigg-waitlist-2024.appspot.com",
    messagingSenderId: "211872816380",
    appId: "1:211872816380:web:e626cd629430cc676a4b79"
  };

let app;
let db;

async function initializeFirebase() {
    try {
        
        if (!firebase.apps.length) {
            app = firebase.initializeApp(firebaseConfig);
        } else {
            app = firebase.app();
        }
        
        db = firebase.database();
        
        
        await db.ref('.info/connected').once('value');
        console.log("Firebase initialized and connected successfully");
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        throw new Error('Firebase initialization failed');
    }
}

window.addEventListener("load", () => {
    setTimeout(() => {
        document.querySelector(".loader").classList.add("slide-up");
    }, 2000);
});


const validateInput = {
    name: (name) => {
        const nameRegex = /^[a-zA-Z\s]{2,50}$/;
        return nameRegex.test(name.trim());
    },
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim()) && email.length <= 100;
    },
    phone: (phone) => {
        const phoneRegex = /^\+?[\d\s-]{10,15}$/;
        return phoneRegex.test(phone.trim());
    }
};

const sanitizeInput = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};


class RateLimiter {
    constructor(maxAttempts = 5, timeWindow = 60000) {
        this.attempts = new Map();
        this.maxAttempts = maxAttempts;
        this.timeWindow = timeWindow;
    }

    checkLimit(identifier) {
        const now = Date.now();
        const userAttempts = this.attempts.get(identifier) || [];
        
        
        const recentAttempts = userAttempts.filter(timestamp => 
            now - timestamp < this.timeWindow
        );
        
        if (recentAttempts.length >= this.maxAttempts) {
            return false;
        }
        
        recentAttempts.push(now);
        this.attempts.set(identifier, recentAttempts);
        return true;
    }
}


const rateLimiter = new RateLimiter();


function getRandomMessage() {
    const randomIndex = Math.floor(Math.random() * loadingMessages.length);
    return loadingMessages[randomIndex];
}


async function simulateLoading() {
    return new Promise((resolve) => {
        let progress = 0;
        loadingScreen.style.display = "flex";
        loadingText.textContent = getRandomMessage();

        const interval = setInterval(() => {
            progress += 0.25;
            progressBar.style.width = `${progress}%`;

            if (progress % 25 === 0) {
                loadingText.textContent = getRandomMessage();
            }

            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.style.display = "none";
                    progressBar.style.width = "0%";
                    resolve();
                }, 2000);
            }
        }, 20);
    });
}


async function checkIfExists(email, phone) {
    try {
        if (!db) {
            await initializeFirebase();
        }

        const sanitizedEmail = sanitizeInput(email.toLowerCase());
        const sanitizedPhone = sanitizeInput(phone);


        const [emailSnapshot, phoneSnapshot] = await Promise.all([
            db.ref("waitlist").orderByChild("email").equalTo(sanitizedEmail).once('value'),
            db.ref("waitlist").orderByChild("phone").equalTo(sanitizedPhone).once('value')
        ]);

        return emailSnapshot.exists() || phoneSnapshot.exists();
    } catch (error) {
        console.error("Database check error:", error);
        if (error.code === 'PERMISSION_DENIED') {
            throw new Error("Access to database denied. Please check your Firebase rules.");
        } else if (error.code === 'NETWORK_ERROR') {
            throw new Error("Network error. Please check your connection.");
        } else {
            throw new Error("Unable to verify registration status. Please try again.");
        }
    }
}





function handleError(error) {
    console.error("Operation failed:", error);
    alert(error.message || "An error occurred. Please try again later.");
}


function showSuccessMessage() {
    popupMessage.style.display = "block";
    inputFields.style.display = "none"; 
    initialPrompt.style.display = "none"; 
    contentText.style.display="none";
    confetti({
        particleCount: 800,
        spread: 800,
        startVelocity: 10,
        decay: 1,
        gravity: 0.2,
        origin: { y: -0.5 },
        ticks: 600
    });
}


function resetForm() {
    nameField.value = "";
    emailField.value = "";
    phoneField.value = "";
}


async function handleEmailSubmit() {
    try {
        const name = nameField.value.trim();
        const email = emailField.value.trim().toLowerCase();
        const phone = phoneField.value.trim();

        
        if (!db) {
            await initializeFirebase();
        }

        
        if (!rateLimiter.checkLimit(email)) {
            throw new Error("Too many attempts. Please try again later.");
        }

        
        if (!validateInput.name(name)) {
            throw new Error("Invalid name format. Please use only letters and spaces (2-50 characters).");
        }
        if (!validateInput.email(email)) {
            throw new Error("Invalid email format. Please check your email address.");
        }
        if (!validateInput.phone(phone)) {
            throw new Error("Invalid phone number format. Please use 10-15 digits.");
        }

        submitButton.disabled = true;
        inputFields.style.display = "none";

        
        const userExists = await checkIfExists(email, phone);
        if (userExists) {
            throw new Error("This email or phone number is already registered.");
        }

        
        

        
        const userRef = db.ref("waitlist").push();
        await userRef.set({
            name: sanitizeInput(name),
            email: email,
            phone: phone,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            userAgent: navigator.userAgent,
            registrationDate: new Date().toISOString()
        });

        await simulateLoading();
        showSuccessMessage();
        resetForm();

    } catch (error) {
        handleError(error);
        inputFields.style.display = "flex";
    } finally {
        submitButton.disabled = false;
    }
}


const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};


yesButton.addEventListener("click", debounce(() => {
    initialPrompt.style.display = "none";
    inputFields.style.display = "flex";
}, 300));

submitButton.addEventListener("click", debounce(handleEmailSubmit, 300));

popupButton.addEventListener("click", debounce(() => {
    popupMessage.style.display = "none";
    popupMessage.style.display = "none";
}, 300));


nameField.addEventListener('input', debounce((e) => {
    const isValid = validateInput.name(e.target.value);
    e.target.style.borderColor = isValid ? '#DDDDDD' : '#ff4444';
}, 300));

emailField.addEventListener('input', debounce((e) => {
    const isValid = validateInput.email(e.target.value);
    e.target.style.borderColor = isValid ? '#DDDDDD' : '#ff4444';
}, 300));

phoneField.addEventListener('input', debounce((e) => {
    const isValid = validateInput.phone(e.target.value);
    e.target.style.borderColor = isValid ? '#DDDDDD' : '#ff4444';
}, 300));


document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
    }
});


window.addEventListener('load', () => {
    console.clear();
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    
    initializeFirebase();
});


let sessionTimeout;
function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        resetForm();
        inputFields.style.display = "none";
        initialPrompt.style.display = "block";
    }, 1800000); 
}
document.addEventListener('mousemove', resetSessionTimeout);
document.addEventListener('keypress', resetSessionTimeout);
