const Voucher = require('../../../db/models/Voucher');
const XLSX = require('xlsx');
const path = require('path');
const { convertDate } = require('../../../utils');
const moment = require('moment');

const validFactura2020 = async (req, res) => {
    try {
        const vouchers = await Voucher.aggregate([
            {
                $match: {
                    doc_type: 'F',
                    $expr: {
                        $eq: [{ $year: "$created_at" }, 2020]
                    },
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
                    "operation": "$operation.code",
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

        const pathFile = path.join(__dirname, '../../../assets/data2020Factura.xlsx');
        const workbook = XLSX.readFile(pathFile);
        const sheet = workbook.SheetNames[0];
        let dataSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
        dataSheet = dataSheet.map(y => ({ ...y, fecha: convertDate(XLSX.SSF.parse_date_code(y.fecha)) })).filter(x => x.serie != undefined);

        let voucherMap = new Map();
        vouchers.forEach(element => {
            if (!voucherMap.has(element.serie)) {
                voucherMap.set(element.serie, []);
            }
            voucherMap.get(element.serie).push(element);
        });

        const STATES = ['NO EXISTE', 'ACEPTADO', 'ANULADO'];
        voucherMap.forEach(voucherList => {
            const v = voucherList[0];
            const d = dataSheet.find(data => data.serie == v.serie && data.codigo == v.operation && data.estado == STATES[Number(v.validate_sunat_status)] && data.cliente == v.customer_name && data.fecha == moment(v.created_at).format('DD/MM/YYYY'));
            if (!d) {
                console.log(v.serie);
            }
        });

        res.status(200).send({ ok: 'Successful' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error on server' });
    }
}


module.exports = {
    validFactura2020
}