const express = require('express');
const axios = require('axios');
const Ain = require('@ainblockchain/ain-js').default;
const get = require('lodash/get');
const PORT = 80;
const ANSWER_REF = '/apps/chatbots/';
const papayaEndpoint = 'https://chatlearner.minho-comcom-ai.endpoint.ainize.ai/chatbot';
const qnaEndpoint = 'https://qnabot-gpu.minho-comcom-ai.endpoint.ainize.ai/chat';
const botIdParasite = 'parasite_bongjunho';
const botIdDemo = 'demo';
const BONG_BOT_NAME = 'bonghive';
const AIN_BOT_NAME = 'ai_network';
const PAPAYA_BOT_NAME = 'papaya';
const SHRUG_BOT_NAME = 'shrug_bot';
const DUNNO = '¯\\_(ツ)_/¯';

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
    res.json({ error: `Invalid ref value received: ${ref}` });
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
        .catch(() => { return {data: {okay: false}} }))
        promises.push(axios.get(qnaEndpoint, {
          params: {
            bot_id: botIdDemo,
            question: question
          }
        })
        .catch(() => { return {data: {okay: false}} }))
        promises.push(axios.get(papayaEndpoint, {
          params: {
            sentence: question,
            previous_session_id: 1
          }
        })
        .catch(() => { return {data: {okay: false}} }))
        await Promise.all(promises)
        .then((responseList) => {
          const bongRes = responseList[0].data;
          const ainRes = responseList[1].data;
          const papayaRes = responseList[2].data;
          console.log('bonghive:', bongRes, '\nai_network:', ainRes, '\npapaya:', papayaRes);
          if (bongRes.okay === true) {
            sendResponse(BONG_BOT_NAME, key, bongRes.answer, res);
          } else if (ainRes.okay === true) {
            sendResponse(AIN_BOT_NAME, key, ainRes.answer, res);
          } else if (papayaRes.okay === true) {
            sendResponse(PAPAYA_BOT_NAME, key, papayaRes.answer, res);
          } else {
            sendResponse(SHRUG_BOT_NAME, key, DUNNO, res);
          }
        })
      }
    } catch(error) {
      console.log("Error:", error)
      res.json({ error });
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

async function sendResponse(botName, key, answer, res) {
  const ref = ain.db.ref(ANSWER_REF + botName + '/response/' + key);
  const result = await ref.setValue({ value: answer });
  res.json(result);
}

app.listen(PORT, () => {
  console.log(`Listening to requests on http://localhost:${PORT}`);
});
