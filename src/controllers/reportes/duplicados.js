const Voucher = require('../../db/models/Voucher');
const XLSX = require('xlsx');
const path = require('path');

const validateCodeDuplicated = async (req, res) => {
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

        const voucherMap = new Map(vouchers.map(voucher => [voucher.code, voucher]));

        let arr = [];
        vouchers.forEach(element => {
            const splitCode = element.code.split('-')[1];
            if (!splitCode) {
                let code = `${element.code}-1`;
                if (voucherMap.has(code)) {
                    const found = voucherMap.get(code);
                    arr.push(element);
                    arr.push(found);
                }
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
    validateCodeDuplicated
}