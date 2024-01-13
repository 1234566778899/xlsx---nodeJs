
const Voucher = require('../../../db/models/Voucher');
const XLSX = require('xlsx');
const path = require('path');
const { convertDate } = require('../../../utils');
const moment = require('moment');


const validBoleta20211 = async (req, res) => {
    try {
        //const doc_type = 'F';
        let vouchers = await Voucher.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $year: "$created_at" }, 2022]
                    },
                    serie: { $regex: 'B001' }
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

        //const voucherMap = new Map(vouchers.map(voucher => [voucher.serie, voucher]));

        const pathFile = path.join(__dirname, '../../../assets/data2022.xlsx');
        const workbook = XLSX.readFile(pathFile);
        const sheet = workbook.SheetNames[0];
        let dataSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

        dataSheet = dataSheet.map(y => ({ ...y, serie: `${y.Serie}-${y['Nro Comprobante']}`, fecha: convertDate(XLSX.SSF.parse_date_code(y['Fecha Emisión'])) }));

        let arr1 = [], arr2 = [], arr3 = [];
        for (const v of vouchers) {
            const data = dataSheet.find(x => x.serie == v.serie);
            const num = v.serie.split('-')[1];
            const corr = dataSheet.find(x => x['__EMPTY'] == num);
            if (!data) {
                arr1.push(v);
                if (!corr) {
                    arr2.push(v);
                } else {
                    arr3.push(v);
                }
            }
        }



        const _workbook = XLSX.utils.book_new();

        const worksheet = XLSX.utils.json_to_sheet(arr1);
        const worksheet1 = XLSX.utils.json_to_sheet(arr2);
        const worksheet2 = XLSX.utils.json_to_sheet(arr3);

        XLSX.utils.book_append_sheet(_workbook, worksheet, 'Not found');
        XLSX.utils.book_append_sheet(_workbook, worksheet1, 'Not found && Not Corr.');
        XLSX.utils.book_append_sheet(_workbook, worksheet2, 'Not found && Corr');

        const buffer = XLSX.write(_workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename=vouchers.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.status(200).send(buffer);


    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error on server' });
    }
}

module.exports = {
    validBoleta20211
}