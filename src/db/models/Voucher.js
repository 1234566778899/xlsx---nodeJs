const { Schema, model } = require('mongoose');

const VoucherSchema = Schema({
    operation: { type: Schema.Types.ObjectId, ref: "operation" },
    doc_type: String,
    serie: String,
    doc_factura: String,
    currency: String,
    customer_number: String,
    customer_doc_type: String,
    customer_name: String,
    code: String,
    description: String,
    amount: Number,
    change: Number,
    hash: String,
    qr: String,
    number_to_letter: String,
    external_id: String,
    cancel: {
        link_cdr: String,
        link_xml: String,
        cancelled_at: Date,
    },
    link_pdf: String,
    link_xml: String,
    link_cdr: String,
    link_logs: String,
    emitDate: String,
    status: { type: String, default: "0" },
    count_send_email: Number,
    statusCPE: String,
    msgStatusCPE: String,
    isNote: Boolean,
    id_note: { type: Schema.Types.ObjectId, ref: "voucher" },
    created_at: { type: Date, default: Date.now },
    validate_sunat_count_consult: { type: Number, default: 0 },
    validate_sunat_status: { type: String, default: "" },
    validate_sunat_time: { type: Date, default: null },
    validate_sunat_msg: String,
    validate_sunat_observer: String,
});
module.exports = model('voucher', VoucherSchema);