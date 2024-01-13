const express = require('express');
const { validResume, validBoleta2020, boletasNoEncontradas, findNotExistsErrors, findNoExistenFaltantes } = require('../controllers/validacion/2020/boletas');
const { validFactura2020 } = require('../controllers/validacion/2020/facturas');
const { updateStateVouchers } = require('../controllers/before');
const { validateEmitMultiple } = require('../controllers/reportes/mutiples');
const { validateCodeDuplicated } = require('../controllers/reportes/duplicados');
const { voucherSendTwice, validateSendTwice } = require('../controllers/reportes/vouchers');
const { validateVoucher, findDupliteDiferentCustomer, validateLogs } = require('../controllers/validacion/consulta');
const { updateStateVoucherProd } = require('../controllers');
const { validBoleta20211 } = require('../controllers/validacion/2021/boletas1');

const router = express.Router();

router.get('/update/state', updateStateVouchers);

router.get('/2020/resume', validResume);
router.get('/2020/not-found', boletasNoEncontradas);
router.get('/2020/factura', validFactura2020);
router.get('/2020/boleta', validBoleta2020);
router.get('/2020/not-exists', findNotExistsErrors);
router.get('/2020/faltantes', findNoExistenFaltantes);

router.get('/2021/boleta1', validBoleta20211);

router.get('/code-duplicate', validateCodeDuplicated);
router.get('/emit-multiple', validateEmitMultiple);
router.get('/send-twice', voucherSendTwice);
router.get('/send-twice/validate', validateSendTwice);

router.get('/consulta', validateVoucher);
router.get('/diferent-customer', findDupliteDiferentCustomer);
router.get('/validate-logs', validateLogs);

router.get('/update/state/prod', updateStateVoucherProd);

module.exports = router;