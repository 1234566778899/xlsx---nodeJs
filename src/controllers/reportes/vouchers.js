
const Voucher = require('../../db/models/Voucher');
const XLSX = require('xlsx');
const path = require('path');

const voucherSendTwice = async (req, res) => {
    try {

        let vouchers = await Voucher.aggregate([
            {
                $match: {
                    created_at: {
                        $lt: new Date('2023-01-01')
                    }
                }
            },
            {
                $lookup: {
                    from: "operations",
                    localField: "operation",
                    foreignField: "_id",
                    as: "operation"
                }
            },
            {
                $unwind: "$operation"
            },
            {
                $project: {
                    "code": "$operation.code",
                    "status": "$operation.status",
                    "created_at": "$created_at",
                    "validate_sunat_status": "$validate_sunat_status",
                    "description": "$description",
                    "serie": "$serie",
                    "doc_factura": "$doc_factura",
                    "customer_number": "$customer_number",
                    "customer_name": "$customer_name",
                    "change": "$change",
                    "amount": "$amount",
                }
            }
        ]);

        let validos = new Map();

        vouchers.forEach(element => {
            if (!validos.has(element.serie)) {
                validos.set(element.serie, []);
            }
            validos.get(element.serie).push(element);
        });

        let arr = [];
        const estados = ['NO EXISTE', 'ACEPTADO', 'NO EXISTE'];
        const estadosOperacion = ['FIRMADO', 'EMITIDO'];
        validos.forEach((voucherList) => {
            if (voucherList.length > 1) {
                voucherList.forEach(element => {
                    arr.push({
                        serie: element.serie,
                        repetidos: voucherList.length,
                        tipo_documento: element.doc_type == 'B' ? 'BOLETA' : 'FACTURA',
                        estado_comprobante: estados[Number(element.validate_sunat_status)],
                        estado_operacion: estadosOperacion[Number(element.status) - 4],
                        codigo: element.code,
                        cliente: element.customer_name,
                        documento_cliente: element.customer_number,
                        fecha_creacion: element.created_at
                    });
                })
            }
        })

        const _workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(arr);
        XLSX.utils.book_append_sheet(_workbook, worksheet, 'MINDTEC');
        const buffer = XLSX.write(_workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename=vouchers.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.status(200).send(buffer);

    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Error on server' });
    }
}


const validateSendTwice = async (req, res) => {
    try {
        let vouchers = await Voucher.aggregate([
            {
                $match: {
                    created_at: {
                        $lt: new Date('2023-01-01')
                    }
                }
            },
            {
                $lookup: {
                    from: "operations",
                    localField: "operation",
                    foreignField: "_id",
                    as: "operation"
                }
            },
            {
                $unwind: "$operation"
            },
            {
                $project: {
                    "code": "$operation.code",
                    "status": "$operation.status",
                    "created_at": "$created_at",
                    "validate_sunat_status": "$validate_sunat_status",
                    "description": "$description",
                    "serie": "$serie",
                    "doc_factura": "$doc_factura",
                    "customer_number": "$customer_number",
                    "customer_name": "$customer_name",
                    "change": "$change",
                    "amount": "$amount",
                }
            }
        ]);

        let validos = new Map();

        vouchers.forEach(element => {
            if (!validos.has(element.serie)) {
                validos.set(element.serie, []);
            }
            validos.get(element.serie).push(element);
        });

        let arr = [];
        const estados = ['NO EXISTE', 'ACEPTADO', 'NO EXISTE'];
        const estadosOperacion = ['FIRMADO', 'EMITIDO'];
        validos.forEach((voucherList) => {
            if (voucherList.length > 1) {
                voucherList.forEach(element => {
                    arr.push({
                        serie: element.serie,
                        repetidos: voucherList.length,
                        tipo_documento: element.doc_type == 'B' ? 'BOLETA' : 'FACTURA',
                        estado_comprobante: estados[Number(element.validate_sunat_status)],
                        estado_operacion: estadosOperacion[Number(element.status) - 4],
                        codigo: element.code,
                        cliente: element.customer_name,
                        documento_cliente: element.customer_number,
                        fecha_creacion: element.created_at
                    });
                })
            }
        })

        const pathFile = path.join(__dirname, '../../assets/enviados.xlsx');
        const workbook = XLSX.readFile(pathFile);
        const sheet = workbook.SheetNames[0];
        let dataSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

        arr.forEach(element => {
            const d = dataSheet.find(current => current.SERIE == element.serie);
            if (!d) {
                console.log(element.serie);
            }
        });
        res.status(200).send({ ok: 'Successful' });

    } catch (error) {
        console.log(error);
        return res.status(500).send({ error: 'Error on server' });
    }
}
module.exports = {
    voucherSendTwice,
    validateSendTwice
}