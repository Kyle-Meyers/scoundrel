class Card {
    constructor(suit, num) {
        this.suit = suit; // 0 = Clubs, 1 = Hearts, 2 = Spades, 3 = Diamonds
        this.num = num; // 11 = J, 12 = Q, 13 = K, 14 = A
        this.color = (suit === 0 || suit === 2) ? 1 : 0; // 1 = black, 0 = red
    }

    toString() {
        const suits = ["♣", "♥", "♠", "♦"];
        const values = {11: "J", 12: "Q", 13: "K", 14: "A"};
        const numStr = values[this.num] || this.num.toString();
        return `${numStr}${suits[this.suit]}`;
    }
}

let deck = [];
for (let suit = 0; suit <= 3; suit++) {
    for (let num = 2; num <= 14; num++) {
        if ((suit === 1 || suit === 3) && num > 10) continue; // reds have no face cards
        deck.push(new Card(suit, num));
    }
}

function shuffle(array) {
    let i = array.length;
    while (i != 0) {
        let ri = Math.floor(Math.random() * i);
        i--;
        [array[i], array[ri]] = [array[ri], array[i]];
    }
}

shuffle(deck);

let health = 20;
let weapon = 0;
let stack = [];
let room = deck.splice(0, 4);
let skipped_previous = false;
let heart_played = false;

const roomDiv = document.getElementById("room");
const healthDiv = document.getElementById("health");
const weaponDiv = document.getElementById("weapon");
const stackDiv = document.getElementById("stack");
const skipBtn = document.getElementById("skipBtn");
const discardBtn = document.getElementById("discardBtn");
const logDiv = document.getElementById("log");

function logMessage(msg) {
    const p = document.createElement("p");
    p.textContent = msg;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
}

function updateDisplay() {
    healthDiv.textContent = `❤️ ${health}`;

    stackDiv.innerHTML = "";
    if (weapon !== 0) {
        const weaponDiv = document.createElement("div");
        weaponDiv.className = "stack-card";
        weaponDiv.textContent = weapon;
        weaponDiv.style.position = "absolute";
        weaponDiv.style.top = `0px`;
        weaponDiv.style.left = `0px`;
        stackDiv.appendChild(weaponDiv);
    }

    stack.slice().reverse().forEach((num, i) => {
        const cardDiv = document.createElement("div");
        cardDiv.textContent = num;
        cardDiv.className = "stack-card";
        cardDiv.style.position = "absolute";
        cardDiv.style.top = `${(i + 1) * 30}px`;
        cardDiv.style.left = `${(i + 1) * 20}px`;
        stackDiv.appendChild(cardDiv);
    });

    roomDiv.innerHTML = "";
    room.forEach((card) => {
        const btn = document.createElement("button");
        btn.textContent = card.toString();
        btn.className = "deck";
        btn.onclick = () => playCard(card);
        roomDiv.appendChild(btn);
    });

    skipBtn.disabled = skipped_previous;
}

function skipRoom() {
    if (!skipped_previous) {
        shuffle(room);
        deck.push(...room);
        room = deck.splice(0, 4);
        skipped_previous = true;
        if (deck.length < 4) deck = [];
        logMessage("Room skipped. New room dealt.");
        updateDisplay();
    }
}

function playCard(card) {
    if (!card) return;

    if (card.suit === 1) { // Hearts = heal
        if (!heart_played) {
            health += card.num;
            if (health > 20) health = 20;
            heart_played = true;
            logMessage(`Played ${card.toString()}: healed to ${health}`);
        } else {
            if (!room.some(c => c.suit !== 1)) {
                // Discard the heart since no other options
                const idx = room.indexOf(card);
                if (idx !== -1) room.splice(idx, 1);
                logMessage(`Discarded ${card.toString()} since only hearts left`);
            } else {
                logMessage(`Played ${card.toString()}: already healed this room, card not used`);
                return;
            }
        }
    } else if (card.suit === 3) { // Diamonds = weapon
        if (weapon === 0) {
            weapon = card.num;
            logMessage(`Played ${card.toString()}: equipped weapon ${weapon}`);
        } else {
            logMessage(`Played ${card.toString()}: already have weapon ${weapon}, card not used`);
            return;
        }
    } else { // Clubs or Spades = enemy
        if (weapon !== 0) {
            if (stack.length === 0) {
                stack.unshift(card.num);
                let dmg = Math.max(card.num - weapon, 0);
                health -= dmg;
                logMessage(`Played ${card.toString()}: first attack with weapon ${weapon}, took ${dmg} damage -> health ${health}`);
            } else if (card.num < stack[0]) {
                stack.unshift(card.num);
                logMessage(`Played ${card.toString()}: stacked ${card.num} on ${stack[1]}, no damage`);
            } else {
                health -= card.num;
                logMessage(`Played ${card.toString()}: too high to stack, took ${card.num} damage -> health ${health}`);
            }
        } else {
            health -= card.num;
            logMessage(`Played ${card.toString()}: took ${card.num} damage -> health ${health}`);
        }
    }

    const idx = room.indexOf(card);
    if (idx !== -1) room.splice(idx, 1);

    if (room.length === 1) {
        heart_played = false;
        skipped_previous = false;
        if (deck.length > 0) {
            room.push(...deck.splice(0, 3));
        }
        if (deck.length < 4) deck = [];
    }

    updateDisplay();
    checkGameOver();
}

function discardWeapon() {
    if (weapon === 0) {
        logMessage("No weapon to discard.");
        return;
    }
    logMessage(`Discarded weapon ${weapon}`);
    weapon = 0;
    stack = [];
    updateDisplay();
}

function checkGameOver() {
    if (health < 1) {
        health = 0;
        logMessage("You ran out of health.");
        disableGame();
    } else if (deck.length === 0 && room.length === 0) {
        logMessage(health > 0 ? "No more cards and you are alive. You win!" : "No more cards but you have no health. You lose.");
        disableGame();
    }
    updateDisplay();
}

function disableGame() {
    roomDiv.innerHTML = "";
    skipBtn.disabled = true;
    discardBtn.disabled = true;
}

skipBtn.addEventListener("click", skipRoom);
discardBtn.addEventListener("click", discardWeapon);

updateDisplay();