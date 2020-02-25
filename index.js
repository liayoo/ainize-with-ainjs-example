const express = require('express');
const axios = require('axios');
const Ain = require('@ainblockchain/ain-js').default;
const get = require('lodash/get');
const PORT = 80;
const ANSWER_REF = '/apps/chatbots/';
const TEST_REF = '/apps/test';
const SET_VALUE = 'SET_VALUE';
const papayaEndpoint = 'https://chatlearner.minho-comcom-ai.endpoint.ainize.ai/chatbot';
const qnaEndpoint = 'https://qnabot-gpu.minho-comcom-ai.endpoint.ainize.ai/chat';
const botIdParasite = 'parasite_bongjunho';
const botIdAin = 'ain_all';
const BONG_BOT_NAME = 'bonghive';
const AIN_BOT_NAME = 'ai_network';
const PAPAYA_BOT_NAME = 'papaya';
const SHRUG_BOT_NAME = 'shrug_bot';
const DUNNO = '¯\\_(ツ)_/¯';
const substitutes = [
  "Sorry, I don't know.",
  "Huh?",
  "Pardon?",
  "I'm sorry. I don't understand.",
  "Whaaaat",
  "Hmm.. Let me think about that."
];

const ain = new Ain('http://node.ainetwork.ai:8080');
const addr = ain.wallet.add(process.env.PRIVATE_KEY);
ain.wallet.setDefaultAccount(addr);
console.log("Default address set to " + addr);

const app = express();
app.use(express.json());
app.use(express.urlencoded( {extended : false } ));

app.get('/set_value', async (req, res) => {
  const value = req.query.value;
  const ref = ain.db.ref(TEST_REF).push();
  const result = await ref.setValue({ value });
  res.json(result);
});

app.post('/', async (req, res) => {
  const tx = req.body.transaction;
  const question = get(tx, 'operation.value');
  let ref = get(tx, 'operation.ref');
  const key = getKeyFromRef(ref);
  if (!key) {
    res.json({ success: false, message: `Invalid ref value received: ${ref}` });
  } else {
    try {
      const snapshot = await ain.db.ref(ANSWER_REF).getValue();
      if (get(snapshot, `${BONG_BOT_NAME}.response.${key}`) || get(snapshot, `${AIN_BOT_NAME}.response.${key}`) ||
      get(snapshot, `${PAPAYA_BOT_NAME}.response.${key}`) || get(snapshot, `${SHRUG_BOT_NAME}.response.${key}`)) {
        // Prevent sending multiple requests from multiple triggering events.
        res.json({ success: false, message: 'The request has been already processed' });
      } else {
        let promises = [];
        promises.push(axios.get(qnaEndpoint, {
          params: {
            bot_id: botIdParasite,
            question: question
          }
        })
        .then((response) => {
          return writeResponse(BONG_BOT_NAME, key, response.data);
        })
        .catch((error) => {
          console.log(`Error (bonghive) : ${error}`)
          return writeResponse(BONG_BOT_NAME, key, null);
        }))
        promises.push(axios.get(qnaEndpoint, {
          params: {
            bot_id: botIdAin,
            question: question
          }
        })
        .then((response) => {
          return writeResponse(AIN_BOT_NAME, key, response.data);
        })
        .catch((error) => {
          console.log(`Error (ai_network) : ${error}`)
          return writeResponse(AIN_BOT_NAME, key, null);
        }))
        promises.push(axios.get(papayaEndpoint, {
          params: {
            sentence: question,
            previous_session_id: 1
          }
        })
        .then((response) => {
          return writeResponse(PAPAYA_BOT_NAME, key, response.data);
        })
        .catch((error) => {
          console.log(`Error (papaya) : ${error}`)
          return writeResponse(PAPAYA_BOT_NAME, key, null);
        }))
        await Promise.all(promises)
        .then(async (resultList) => {
          console.log("all promises returned:", resultList)
          await writeResponse(SHRUG_BOT_NAME, key, null);
          res.json({ success: true });
        })
      }
    } catch(error) {
      console.log("Error:", error)
      res.json({ success: false, message: `Error is thrown: ${JSON.stringify(error)}` });
    }
  }
});

function getKeyFromRef(ref) {
  if (!ref) {
    return null;
  }
  const refArr = ref.split('/');
  const len = refArr.length;
  if (refArr[len - 1] === '') {
    if (len < 2) {
      return null;
    }
    return refArr[len - 2];
  }
  return refArr[len - 1];
}

function getBotRef(botName, key) {
  return ANSWER_REF + botName + '/response/' + key;
}

function randomSubForUnknown() {
  return substitutes[Math.floor(Math.random() * substitutes.length)];
}

async function writeResponse(botName, key, response) {
  let answer = '';
  if (botName === SHRUG_BOT_NAME) {
    answer = DUNNO;
  } else if (!response || !response.okay) {
    answer = randomSubForUnknown();
  } else {
    answer = response.answer;
  }
  const ref = ain.db.ref(ANSWER_REF + botName + '/response/' + key);
  console.log('writeResponse:', ref.path, answer);
  const result = await ref.setValue({ value: answer, nonce: -1 });
  return result;
}

app.listen(PORT, () => {
  console.log(`Listening to requests on http://localhost:${PORT}`);
});
