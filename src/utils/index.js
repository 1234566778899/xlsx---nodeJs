const moment = require('moment');

const convertDate = (fechaEmision) => {
    const fechaMoment = moment({
        year: fechaEmision.y,
        month: fechaEmision.m - 1,
        day: fechaEmision.d
    });
    return fechaMoment.format("DD/MM/YYYY");
};

module.exports = {
    convertDate
}