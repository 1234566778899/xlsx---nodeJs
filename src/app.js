const express = require('express')
const app = express();
const cors = require('cors')
require('./db/index')
app.use(express.json());
const port = process.env.PORT || 4000;

app.use(cors());

app.get('/', (req, res) => {
    res.send('v.1.0.13')
})

app.use('/voucher', require('./routes/Voucher'));

app.listen(port, () => {
    console.log('server running on port: ' + port);
})