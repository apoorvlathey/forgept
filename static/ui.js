// Original UI Code from
//
//  https://codepen.io/sajadhsm/pen/odaBdd
//

const SERVER_URL = window.location.href;
const ANSWERS_URL = SERVER_URL + "api/answers";

const BOT_WELCOME = [
  "Hi, I am ForGePT 👋",
  "Go ahead and ask me any question related to foundry!",
  "I'll seek the answer within my knowledge base. 😄",
];

const BOT_IMG = "/static/bot.png";
const PERSON_IMG = "/static/you.svg";

const BOT_NAME = "ForGePT";
const PERSON_NAME = "You";

const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

msgerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Get msgText
  const msgText = msgerInput.value;
  if (!msgText) return;
  appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
  msgerInput.value = "";

  // Submit question
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(200);
  toggleBotLoading();
  postQuestion(msgText).then((response) => {
    console.log(response); // JSON data parsed by `data.json()` call
    const answer = response.answer;
    toggleBotLoading();
    botResponse(answer);
  });
});

// Example POST method implementation:
async function postQuestion(question) {
  const data = { question: question };
  const response = await fetch(ANSWERS_URL, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer",
    body: JSON.stringify(data),
  });
  return response.json();
}

botIsLoading = false;
function toggleBotLoading() {
  if (botIsLoading) {
    msg = get(".left-loading-msg");
    msg.remove();
    botIsLoading = false;
  } else {
    botIsLoading = true;
    appendMessage(BOT_NAME, BOT_IMG, "left-loading", "...");
  }
}

function appendMessage(name, img, side, text) {
  //   Simple solution for small apps
  const id = "c" + Date.now();
  const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-img" style="background-image: url(${img})"></div>

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${formatDate(new Date())}</div>
        </div>
        <div class="msg-text" id="${id}">${side === "left" ? "" : text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;

  if (side === "left") {
    new TypeIt(`#${id}`, {
      strings: text,
      speed: 30,
      cursor: true,
      afterStep: async () => {
        msgerChat.scrollTop += 500; // this helps to scroll when a new line is added
      },
      afterComplete: async (instance) => {
        instance.destroy(); //remove cursor when done
      },
    }).go();
  }
}

function botResponse(msgText) {
  appendMessage(BOT_NAME, BOT_IMG, "left", msgText);
}

// Utils
function get(selector, root = document) {
  return root.querySelector(selector);
}

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}

//Add welcome message
appendMessage(BOT_NAME, BOT_IMG, "left", BOT_WELCOME);
