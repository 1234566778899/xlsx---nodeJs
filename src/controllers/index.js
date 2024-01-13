const Voucher = require('../db/models/Voucher');
const XLSX = require('xlsx');
const XLSXStyle = require('xlsx-style')
const path = require('path');

const { default: axios } = require('axios');

const getSheet = async (req, res) => {
    try {
        const pathFile = path.join(__dirname, '../assets/data2020.xlsx');
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
        })).slice(0, dataSheet.length - 113).filter(x => x.serie != undefined);

        const c1 = {
            fill: { fgColor: { rgb: 'FFFF00' } }
        };
        const c2 = {
            fill: { fgColor: { rgb: 'FF0000' } }
        };
        const worksheet = XLSX.utils.json_to_sheet(dataSheet);

        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        for (let i = 0; i < dataSheet.length; i++) {
            if (dataSheet[i].estado == 'ANULADO') {
                for (const l of letters) {
                    worksheet[`${l}${i + 2}`].s = c1;
                }
            } else if (dataSheet[i].estado == 'NO EXISTE') {
                for (const l of letters) {
                    worksheet[`${l}${i + 2}`].s = c2;
                }
            }
        }

        const _workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(_workbook, worksheet, 'Vouchers');
        const buffer = XLSXStyle.write(_workbook, { bookType: 'xlsx', type: 'buffer' });
        res.setHeader('Content-Disposition', 'attachment; filename=vouchers.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.status(200).send(buffer);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error on server' });
    }
}


const updateStateVoucherProd = async (req, res) => {
    try {
        const vouchers = await Voucher.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $year: "$created_at" }, 2022]
                    }
                },
            }
        ]);

        for (let i = 0; i < vouchers.length; i++) {
            const voucher = vouchers[i];
            await axios.post('http://localhost:5000/voucher/update/state', { id: voucher._id, state: voucher.validate_sunat_status });
            console.log(i + 1);
        }
        res.status(200).send({ ok: 'Successful' });

    } catch (error) {
        console.log(error);
        res.status(500).send({ error: 'Error on server' });
    }
}
module.exports = {
    getSheet,
    updateStateVoucherProd,

}

