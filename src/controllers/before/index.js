const { default: axios } = require('axios');
const Voucher = require('../../db/models/Voucher');
const moment = require('moment');

const updateStateVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [{ $year: "$created_at" }, 2023]
                    },
                    // doc_type: 'F',
                    validate_sunat_status: ''
                },
            },
            {
                $sort: {
                    created_at: 1
                }
            },
            {
                $limit: 900*3
            }
        ]);

        for (let i = 0; i < vouchers.length; i++) {

            try {
                const data = {
                    token: '8esC32roDlDbSEYDTii0A2h3cv4mZeHEsdi2zwUvSHeZOaqNOVgKNqfu2MSU',
                    ruc_emisor: '20604536261',
                    tipo_comprobante: vouchers[i].doc_factura,
                    serie: vouchers[i].serie.split('-')[0],
                    numero: vouchers[i].serie.split('-')[1],
                    fecha_emision: moment(vouchers[i].created_at).format('DD/MM/YYYY'),
                    monto: `${(vouchers[i].amount * vouchers[i].change + 0.00001).toFixed(2)}`
                };

                const response = await axios.post('https://api.migo.pe/api/v1/cpe', data);

                if (response.data.estado_comprobante != '') {
                    await Voucher.findByIdAndUpdate(vouchers[i]._id, { validate_sunat_status: response.data.estado_comprobante });
                    console.log((i + 1) + ': ' + vouchers[i].serie + ' : ' + response.data.estado_comprobante);
                } else {
                    console.log((i + 1) + ': vacio');
                }
            } catch (error) {
                console.log('Esperando 2min: ');
                await new Promise(resolve => setTimeout(() => {
                    i--;
                    resolve();
                }, 1000 * 60 * 2));
            }
        }
        return res.status(200).send({ ok: "Succesfull" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error on server' });
    }
}

module.exports = {
    updateStateVouchers
}