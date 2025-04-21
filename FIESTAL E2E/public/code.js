console.log("Script loaded successfully!");

const socket = io(); // Single socket instance globally

socket.on("connect", () => {
    console.log("Connected to server! Socket ID:", socket.id);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server!");
});

function feistelEncrypt(plainText, key) {
    const rounds = 4;
    let left = plainText.slice(0, Math.floor(plainText.length / 2));
    let right = plainText.slice(Math.floor(plainText.length / 2));

    for (let i = 0; i < rounds; i++) {
        let temp = right;
        right = xor(left, feistelFunction(right, key + i));
        left = temp;
    }
    const encrypted = btoa(left + right);
    console.log(`Encrypting "${plainText}" => ${encrypted}`);
    return encrypted;
}

function feistelDecrypt(cipherText, key) {
    const rounds = 4;
    let decoded = atob(cipherText);
    let left = decoded.slice(0, Math.floor(decoded.length / 2));
    let right = decoded.slice(Math.floor(decoded.length / 2));

    for (let i = rounds - 1; i >= 0; i--) {
        let temp = left;
        left = xor(right, feistelFunction(left, key + i));
        right = temp;
    }
    const decrypted = left + right;
    console.log(`Decrypting "${cipherText}" => ${decrypted}`);
    return decrypted;
}


function feistelFunction(data, key) {
    return xor(data, key);
}

function xor(input, key) {
    let output = "";
    for (let i = 0; i < input.length; i++) {
        output += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return output;
}

document.addEventListener("DOMContentLoaded", function () {
    const app = document.querySelector(".app");
    const encryptionKey = "securekey123";
    let uname = "";

    let usernameInput = document.getElementById("Username");
    let joinButton = document.getElementById("join_user");
    let messageInput = document.getElementById("message-input");
    let sendButton = document.getElementById("send-message");
    let messagesContainer = document.querySelector(".messages");

    // Press Enter to Join
    usernameInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            joinButton.click();
        }
    });

    // Join Chatroom
    joinButton.addEventListener("click", function () {
        let username = usernameInput.value.trim();
        if (username !== "") {
            uname = username;
            socket.emit("newuser", username);
            document.querySelector(".join-screen").classList.remove("active");
            document.querySelector(".chat-screen").classList.add("active");
        }
    });

    // Press Enter to Send
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendButton.click();
        }
    });

    // Send Encrypted Message
    sendButton.addEventListener("click", function () {
        let message = messageInput.value.trim();
        if (message !== "") {
            let encryptedMessage = feistelEncrypt(message, encryptionKey);
            socket.emit("chat", { username: uname, text: encryptedMessage });

            renderMessage("my", { username: uname, text: message });

            messageInput.value = "";
        }
    });

    // Receive Message
    socket.on("chat", function (message) {
        console.log("Received Encrypted:", message.text);
        let decryptedMessage = feistelDecrypt(message.text, encryptionKey);
        renderMessage("other", { username: message.username, text: decryptedMessage });
    });

    // Updates
    socket.on("update", function (update) {
        renderMessage("update", update);
    });

    // Exit Chat
    document.getElementById("exit-chat").addEventListener("click", function () {
        socket.emit("exituser", uname);
        window.location.href = window.location.href;
    });

    function renderMessage(type, message) {
        let messageContainer = app.querySelector(".chat-screen .messages");
        if (type === "my") {
            let el = document.createElement("div");
            el.setAttribute("class", "message my-message");
            el.innerHTML = `<div><div class="name">You</div><div class="text">${message.text}</div></div>`;
            messageContainer.appendChild(el);
        } else if (type === "other") {
            let el = document.createElement("div");
            el.setAttribute("class", "message other-message");
            el.innerHTML = `<div><div class="name">${message.username}</div><div class="text">${message.text}</div></div>`;
            messageContainer.appendChild(el);
        } else if (type === "update") {
            let el = document.createElement("div");
            el.setAttribute("class", "update");
            el.innerText = message;
            messageContainer.appendChild(el);
        }
        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }
});
