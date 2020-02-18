const express = require('express');
const axios = require('axios');
const Ain = require('@ainblockchain/ain-js').default;
const get = require('lodash/get');
const PORT = 80;
const ANSWER_REF = '/apps/chatbots/papaya/response';
const chatbotEndpoint = 'https://chatlearner.minho-comcom-ai.endpoint.ainize.ai/chatbot';

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
  // console.log("ref:", ref, "value:", value);
  // res.json({ value, ref: ref.path });
  const result = await ref.setValue({ value });
  res.json(result);
});

app.post('/', async (req, res) => {
  const tx = req.body.transaction;
  const question = get(tx, 'operation.value');
  // console.log("i got a message:", question);
  axios.get(chatbotEndpoint, {
    params: {
      sentence: question,
      previous_session_id: 1
    }
  })
  .then(async (response) => {
    const answer = response.data.answer;
    const ref = ain.db.ref(ANSWER_REF).push();
    const result = await ref.setValue({ value: answer });
    res.json(result);
  })
  .catch((error) => {
    res.json(error.message);
  })
});

app.listen(PORT, () => {
  console.log(`Listening to requests on http://localhost:${PORT}`);
});
