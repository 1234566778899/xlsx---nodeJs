
const Voucher = require('../../db/models/Voucher');
const XLSX = require('xlsx');
const path = require('path');

const validateEmitMultiple = async (req, res) => {
    try {

        let vouchers = await Voucher.aggregate([
            {
                $match: {
                    $or: [
                        {
                            serie: { $regex: 'B002' },

                        },
                        {
                            serie: { $regex: 'F002' }
                        }
                    ],
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
            },
            {
                $sort: {
                    "created_at": 1
                }
            }
        ]);

        const voucherMap = new Map();
        vouchers.forEach(voucher => {
            if (!voucherMap.has(voucher.code)) {
                voucherMap.set(voucher.code, []);
            }
            voucherMap.get(voucher.code).push(voucher);
        });

        const arr = [];
        const statesVoucher = ['NO EXISTE', 'ACEPTADO', 'ANULADO'];
        const statesOperation = ['FIRMADO', 'EMITIDO'];

        voucherMap.forEach((voucherList, code) => {
            if (voucherList.length > 1) {
                voucherList.forEach(v => {
                    arr.push({
                        repetidos: voucherList.length,
                        serie: v.serie,
                        estado_operacion: statesOperation[Number(v.status) - 4],
                        estado_comprobante: statesVoucher[Number(v.validate_sunat_status)],
                        fecha_emision: v.created_at,
                        codigo: code,
                        estado_plataforma: v.validate_sunat_status == '1' ? 'ACTIVO' : 'DUPLICADO',
                        cliente: v.customer_name,
                        documento_cliente: v.customer_number,
                        monto: (v.amount * v.change + 0.00001).toFixed(2)
                    });
                });
            }
        });

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

module.exports = {
    validateEmitMultiple
}
