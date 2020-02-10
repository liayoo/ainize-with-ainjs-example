const express = require('express');
const Ain = require('@ainblockchain/ain-js').default;
const PORT = 80;
const TEST_REF = '/afan/ainize_test';
const app = express();
const ain = new Ain('http://node.ainetwork.ai:8080');
const addr = ain.wallet.add(process.env.PRIVATE_KEY);
ain.wallet.setDefaultAccount(addr);
console.log("Default address set to " + addr);

app.get('/', (req, res) => {
  res.json('Hello Wwwwwwwwwwwwwwwwwwworld');
});

app.get('/set_value', async (req, res) => {
  const value = req.query.value;
  const ref = ain.db.ref(TEST_REF).push();
  // console.log("ref:", ref, "value:", value);
  // res.json({ value, ref: ref.path });
  const result = await ref.setValue({ value });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Listening to requests on http://localhost:${PORT}`);
});
