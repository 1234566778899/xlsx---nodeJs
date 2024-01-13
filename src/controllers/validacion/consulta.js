const Voucher = require('../../db/models/Voucher');
const OperatorLog = require('../../db/models/OperatorLog');
const moment = require('moment');

const validateVoucher = async (req, res) => {
    try {
        let vouchers = await Voucher.aggregate(
            [
                {
                    $match: {
                        $or: [
                            {
                                serie: 'F002-00018654'
                            },
                            {
                                serie: 'F002-00018655'
                            },
                            {
                                serie: 'F002-00012135'
                            }
                        ]
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
            ]
        );
        let status = new Map();
        status.set('26', 'PRE_CREATED');
        status.set('0', 'CREATED');
        status.set('1', 'CONFIRMED');
        status.set('22', 'IN_PROCESS');
        status.set('23', 'PROCESSED');
        status.set('26', 'PRE_CREATED');
        status.set('4', 'SIGNED');
        status.set('5', 'EMITTED');
        status.set('7', 'EMITTEDSENDEMAILVOUCHER');

        for (const voucher of vouchers) {
            const logs = await OperatorLog.find({ operation: voucher.operation });
            console.log(voucher.serie + ' - ' + voucher.operation.code + ' - ' + voucher.customer_name + ' - ' + moment(voucher.created_at).format('DD-MM-YYYY HH:mm:ss'));
            console.log('-----------------------');
            for (const log of logs) {
                console.log((status.has(log.status_from) ? status.get(log.status_from) + ' -> ' : '') + status.get(log.status_to) + ' (' + moment(log.created_at).format('DD-MM-YYYY HH:mm:ss') + ' )');
            }
            console.log('**********************');
        }


        res.status(200).send({ ok: 'Successful' });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Error on server' });
    }
}

const findDupliteDiferentCustomer = async (req, res) => {
    try {
        let vouchers = await Voucher.aggregate(
            [
                {
                    $match: {
                        $expr: {
                            $eq: [{ $year: "$created_at" }, 2024]
                        },
                    }
                }
            ]
        );

        let voucherMap = new Map();

        vouchers.forEach(element => {
            if (!voucherMap.has(element.serie)) {
                voucherMap.set(element.serie, []);
            }
            voucherMap.get(element.serie).push(element);
        });


        voucherMap.forEach(voucherList => {
            if (voucherList.length > 1) {
                for (let i = 0; i < voucherList.length; i++) {
                    const found = voucherList.find(current => current.customer_number != voucherList[i].customer_number);
                    if (found) {
                        console.log(voucherList[0].serie);
                        break;
                    }
                }
            }
        });

        res.status(200).send({ ok: 'Successful' });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Error on server' });
    }
}

const validateLogs = async (req, res) => {
    try {
        let vouchers = await Voucher.aggregate(
            [
                {
                    $match: {
                        $expr: {
                            $eq: [{ $year: "$created_at" }, 2023]
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
            ]
        );

        for (const voucher of vouchers) {
            const logs = await OperatorLog.find({ operation: voucher.operation });
            let val1 = logs.find(current => current.status_to == '0');
            let val2 = logs.find(current => current.status_to == '7');
            if (!val1 || !val2) {
                console.log(voucher.serie);
            }
        }
        console.log(vouchers.length);
        res.status(200).send({ ok: 'Successful' });
    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Error on server' });
    }
}
module.exports = {
    validateVoucher,
    findDupliteDiferentCustomer,
    validateLogs
}

