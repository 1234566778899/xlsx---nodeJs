const { Schema, model } = require('mongoose');

const OperatorLogSchema = new Schema({
    operator: { type: Schema.Types.ObjectId, ref: "user" },
    operation: { type: Schema.Types.ObjectId, ref: "operation" },
    status_to: String,
    status_from: String,
    created_at: { type: Date, default: Date.now },
});

module.exports = model('operator_log', OperatorLogSchema);