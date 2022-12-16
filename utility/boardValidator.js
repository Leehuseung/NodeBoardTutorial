let validator = require('validator');

function boardValid(board){
    let subjectValid = !validator.isLength(board.subject,{ min : 1, max : 255 });
    let contentValid = !validator.isLength(board.content,{ min : 1, max : 2000 });
    let writerValid = !validator.isLength(board.writer,{ min : 1,  max : 30 });
    let videoPathValid = !validator.isLength(board.video_path,{ min : 14, max : 14 });
    let videoNameValid = !validator.isLength(board.video_name,{ min : 1, max : 255});

    return subjectValid || contentValid || writerValid || videoPathValid || videoNameValid;
}


module.exports.valid = boardValid;