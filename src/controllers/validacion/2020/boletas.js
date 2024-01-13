const Voucher = require('../../../db/models/Voucher');
const XLSX = require('xlsx');
const path = require('path');
const { convertDate } = require('../../../utils');
const moment = require('moment');
const { default: axios } = require('axios');

const boletasNoEncontradas = async (req, res) => {
    try {
        let vouchers = await Voucher.aggregate([
            {
                $match: {
                    doc_type: 'B',
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

        for (let i = 0; i < vouchers.length - 1; i++) {
            const a = Number(vouchers[i + 1].serie.split('-')[1]);
            const b = Number(vouchers[i].serie.split('-')[1]);
            if (a - b == 2) {
                console.log(b + 1);
            }
        }

        res.status(200).send({ ok: 'Successful' });

    } catch (error) {

        res.status(500).json({ error: 'Error on server' });

    }

}
const validResume = async (req, res) => {
    try {
        let vouchers = await Voucher.aggregate([
            {
                $match: {
                    doc_type: 'B',
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


        const pathFile = path.join(__dirname, '../../../assets/data2020.xlsx');
        const workbook = XLSX.readFile(pathFile);
        const sheet = workbook.SheetNames[0];
        let dataSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

        dataSheet = dataSheet.map(data => ({
            code_operation: data['Codigo de Operción'],
            serie: data['Serie'],
            fecha: convertDate(XLSX.SSF.parse_date_code(data['Fecha de emision'])),
            number: data['Numero de documento'],
            estado: data['Estado Comprobante'],
            correlativo: data['__EMPTY_2'],
            monto: data[' Monto '],
            cambio: data['Cambio']
        }))
        //.slice(0, dataSheet.length - 113).filter(x => x.serie != undefined);
        const estados = ['NO EXISTE', 'ACEPTADO', 'ANULADO'];
        let arr = [];
        for (const v of vouchers) {

            const data = dataSheet.find(current => current.code_operation == v.operation && current.serie == v.serie &&
                current.estado == estados[Number(v.validate_sunat_status)] &&
                current.monto == v.amount &&
                current.cambio == v.change &&
                current.fecha == moment(v.created_at).format('DD/MM/YYYY'));

            if (!data) {
                arr.push(v.serie);
            }
        }
        console.log(arr.length);
        res.status(200).send({ ok: 'Successful' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error on server' });
    }
}

const findNotExistsErrors = async (req, res) => {
    try {
        const doc_type = 'B';

        let vouchers = await Voucher.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $year: "$created_at" }, 2022]
                    },
                    doc_type,
                    validate_sunat_status: '0'
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

        let noRepetidos = new Set();
        for (const v of vouchers) {
            noRepetidos.add(v.serie);
        }

        const arr = [...noRepetidos];

        const states = ['NO EXISTE', 'ACEPTADO', 'ANULADO']
        let validos = [];

        for (let i = 0; i < arr.length; i++) {
            try {
                const v = vouchers.filter(current => current.serie == arr[i]);
                const getData = (_fecha, _monto) => {
                    return {
                        token: '8esC32roDlDbSEYDTii0A2h3cv4mZeHEsdi2zwUvSHeZOaqNOVgKNqfu2MSU',
                        ruc_emisor: '20604536261',
                        tipo_comprobante: v[0].doc_factura,
                        serie: v[0].serie.split('-')[0],
                        numero: v[0].serie.split('-')[1],
                        fecha_emision: _fecha,
                        monto: _monto
                    };
                }

                let fecha = moment(v[0].created_at);
                fecha.add(1, 'days');
                const data = getData(fecha.format('DD/MM/YYYY'), `${(v[0].amount * v[0].change + 0.00001).toFixed(2)}`);
                const response = await axios.post('https://api.migo.pe/api/v1/cpe', data);

                if (response.data.estado_comprobante == '1') {
                    console.log((i + 1) + ' - ' + v[0].serie + ' - ' + fecha.format('DD/MM/YYYY'));
                    validos.push({
                        operacion: v[0].operation,
                        serie: v[0].serie,
                        fecha_original: v[0].created_at,
                        monto_original: (v[0].amount * v[0].change + 0.00001).toFixed(2),
                        estado_actual: states[Number(v[0].validate_sunat_status)],
                        fecha_correcta: fecha.format('DD/MM/YYYY'),
                        monto_corregido: '',
                        estado_corregido: states[Number(response.data.estado_comprobante)]
                    });
                } else {
                    const _data = getData(moment(v[0].created_at).format('DD/MM/YYYY'), `${(v[0].amount * v[0].change).toFixed(2)}`);

                    const _response = await axios.post('https://api.migo.pe/api/v1/cpe', _data);
                    if (_response.data.estado_comprobante == '1') {
                        console.log((i + 1) + ' - ' + v[0].serie + ' - ' + (v[0].amount * v[0].change).toFixed(2));
                        validos.push({
                            operacion: v[0].operation,
                            serie: v[0].serie,
                            fecha_original: v[0].created_at,
                            monto_original: (v[0].amount * v[0].change + 0.00001).toFixed(2),
                            estado_actual: states[Number(v[0].validate_sunat_status)],
                            fecha_correcta: '',
                            monto_corregido: (v[0].amount * v[0].change).toFixed(2),
                            estado_corregido: states[Number(_response.data.estado_comprobante)]
                        });
                    } else {
                        let fecha = moment(v[0].created_at);
                        fecha.add(1, 'days');
                        const d = getData(fecha.format('DD/MM/YYYY'), `${(v[0].amount * v[0].change).toFixed(2)}`);
                        const r = await axios.post('https://api.migo.pe/api/v1/cpe', d);
                        if (r.data.estado_comprobante == '1') {
                            console.log((i + 1) + ' - ' + v[0].serie);
                            validos.push({
                                operacion: v[0].operation,
                                serie: v[0].serie,
                                fecha_original: v[0].created_at,
                                monto_original: (v[0].amount * v[0].change + 0.00001).toFixed(2),
                                estado_actual: states[Number(v[0].validate_sunat_status)],
                                fecha_correcta: fecha.format('DD/MM/YYYY'),
                                monto_corregido: (v[0].amount * v[0].change).toFixed(2),
                                estado_corregido: states[Number(r.data.estado_comprobante)]
                            });
                        }
                    }
                }
            } catch (error) {
                console.log('Esperando 2min..')
                await new Promise(resolve => {
                    setTimeout(() => {
                        i--;
                        resolve();
                    }, 1000 * 60 * 2);
                })
            }
        }
        const _workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(validos);
        XLSX.utils.book_append_sheet(_workbook, worksheet, 'Validos');
        const buffer = XLSX.write(_workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename=vouchers.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.status(200).send(buffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error on server' });
    }
}

const findNoExistenFaltantes = async (req, res) => {
    try {
        const doc_type = 'B';

        let vouchers = await Voucher.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $year: "$created_at" }, 2020]
                    },
                    doc_type
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

        const pathFile = path.join(__dirname, '../../../assets/Boletas2020.xlsx');
        const workbook = XLSX.readFile(pathFile);
        const sheet = workbook.SheetNames[0];
        let dataSheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);

        let noRepetidos = new Set();
        for (const v of vouchers) {
            noRepetidos.add(v.serie);
        }
        let val = [];
        for (const n of noRepetidos) {
            const v = vouchers.filter(current => current.serie == n);
            if (v[0].validate_sunat_status == '0') {
                const d = dataSheet.find(x => x.serie == v[0].serie);
                if (!d) {
                    console.log(v[0].serie);
                    val.push({
                        operacion: v[0].operation,
                        serie: v[0].serie,
                        fecha: v[0].created_at,
                        monto: (v[0].amount * v[0].change + 0.00001).toFixed(2)
                    });
                }

            }

        }

        const _workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(val);
        XLSX.utils.book_append_sheet(_workbook, worksheet, 'Faltantes');
        const buffer = XLSX.write(_workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename=vouchers.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.status(200).send(buffer);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error on server' });
    }
}

const validBoleta2020 = async (req, res) => {
    try {
        const doc_type = 'F';
        let vouchers = await Voucher.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $year: "$created_at" }, 2022]
                    },
                    serie: { $regex: 'F002' }
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

        const states = ['NO EXISTE', 'ACEPTADO', 'ANULADO']

        let op = new Map();
        for (const v of vouchers) {
            if (!op.has(v.operation)) {
                op.set(v.operation, []);
            }
            op.get(v.operation).push(v);
        }
        let operationDuplicado = [];
        let porAnular = [];

        op.forEach((voucherList) => {

            if (voucherList.length > 1) {
                let accepts = [];
                for (const d of voucherList) {
                    operationDuplicado.push({ repetidos: voucherList.length, ...d });
                    if (d.validate_sunat_status == '1') accepts.push(d);
                }
                if (accepts.length > 1) {
                    for (let i = 1; i < accepts.length; i++) {
                        porAnular.push(accepts[i]);
                    }
                }
            }
        });

        operationDuplicado = operationDuplicado.map((x, index) => ({
            'N°': index + 1,
            repetidos: x.repetidos,
            operacion: x.operation,
            serie: x.serie,
            fecha: x.created_at,
            cliente: x.customer_name,
            monto: x.amount,
            cambio: x.change,
            total: (x.amount * x.change + 0.00001).toFixed(2),
            documento: x.customer_number,
            descripcion: x.description,
            tipo_comprobante: x.doc_factura,
            estado: states[Number(x.validate_sunat_status)]
        }))

        let noRepetidos = new Map();
        for (const v of vouchers) {
            if (!noRepetidos.has(v.Serie)) {
                noRepetidos.set(v.serie, []);
            }
            noRepetidos.get(v.serie).push(v);
        }

        let newVouchers = [];
        let repetidos = [];
        let repetidoAmbosNoExisten = [];
        let anulados = vouchers.filter(actual => actual.validate_sunat_status == '2');
        let noEncontrados = [];

        let min = Number(vouchers[0].serie.split('-')[1]);
        let max = Number(vouchers[vouchers.length - 1].serie.split('-')[1]);

        for (let i = min; i <= max; i++) {
            const v = vouchers.find(x => x.serie == `${doc_type}001-${i}`);
            if (!v) {
                noEncontrados.push({ serie: `${doc_type}001-${i}` });
            }
        }

        noEncontrados = noEncontrados.map((x, index) => ({ 'N°': index + 1, ...x }));

        noRepetidos.forEach((voucherList) => {
            if (voucherList.length > 1) {
                repetidos.push(voucherList[0]);
                repetidos.push(voucherList[1]);
                if (voucherList[0].validate_sunat_status == '0' && voucherList[1].validate_sunat_status == '0') {
                    repetidoAmbosNoExisten.push(v[0]);
                    repetidoAmbosNoExisten.push(v[1]);
                }
            }
            newVouchers.push(voucherList[0]);
        })

        const mapearVoucher = (params) => {
            return [...params].map((x, index) => ({
                'N°': index + 1,
                operacion: x.operation,
                serie: x.serie,
                fecha: x.created_at,
                cliente: x.customer_name,
                monto: x.amount,
                cambio: x.change,
                total: (x.amount * x.change + 0.00001).toFixed(2),
                documento: x.customer_number,
                descripcion: x.description,
                tipo_comprobante: x.doc_factura,
                estado: states[Number(x.validate_sunat_status)]
            }))
        }
        vouchers = mapearVoucher(vouchers);
        newVouchers = mapearVoucher(newVouchers);
        repetidos = mapearVoucher(repetidos);
        repetidoAmbosNoExisten = mapearVoucher(repetidoAmbosNoExisten);
        anulados = mapearVoucher(anulados);
        porAnular = mapearVoucher(porAnular);

        const _workbook = XLSX.utils.book_new();

        const worksheet = XLSX.utils.json_to_sheet(vouchers);
        const worksheet1 = XLSX.utils.json_to_sheet(newVouchers);
        const worksheet2 = XLSX.utils.json_to_sheet(repetidos);
        const worksheet3 = XLSX.utils.json_to_sheet(repetidoAmbosNoExisten);
        const worksheet4 = XLSX.utils.json_to_sheet(anulados);
        const worksheet5 = XLSX.utils.json_to_sheet(operationDuplicado);
        const worksheet6 = XLSX.utils.json_to_sheet(porAnular);
        const worksheet7 = XLSX.utils.json_to_sheet(noEncontrados);

        XLSX.utils.book_append_sheet(_workbook, worksheet, 'total');
        XLSX.utils.book_append_sheet(_workbook, worksheet1, 'Válidos');
        XLSX.utils.book_append_sheet(_workbook, worksheet2, 'Repetidos');
        XLSX.utils.book_append_sheet(_workbook, worksheet3, 'Repetidos Ambos No existen');
        XLSX.utils.book_append_sheet(_workbook, worksheet4, 'Anulados');
        XLSX.utils.book_append_sheet(_workbook, worksheet5, 'Mas de una operacion');
        XLSX.utils.book_append_sheet(_workbook, worksheet6, 'Por anular');
        XLSX.utils.book_append_sheet(_workbook, worksheet7, 'No encontrados');

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
    validResume,
    validBoleta2020,
    boletasNoEncontradas,
    findNotExistsErrors,
    findNoExistenFaltantes
}

// {
//     $expr: {
//         $gt: [{ $month: "$created_at" }, 6]
//     }
// }

