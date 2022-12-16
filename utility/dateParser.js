module.exports.dateToFilename = function (date) {
    let yyyy = date.getFullYear().toString();
    let MM = pad(date.getMonth() + 1, 2);
    let dd = pad(date.getDate(), 2);
    let hh = pad(date.getHours(), 2);
    let mm = pad(date.getMinutes(), 2)
    let ss = pad(date.getSeconds(), 2)
    let fileName = yyyy + MM + dd + hh + mm + ss;
    return fileName;
};

module.exports.dateToBoardFormat = function (date) {
    let yyyy = date.getFullYear().toString();
    let MM = pad(date.getMonth() + 1, 2);
    let dd = pad(date.getDate(), 2);
    let boardDateFormat = yyyy + '/' + MM + '/' + dd;
    return boardDateFormat;
};

function pad(number, length) {
    let str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

