const db = require("../modules");
const {Op} = require("sequelize");
const dateParser = require("../utility/dateParser");
const boardValidator = require("../utility/boardValidator");


module.exports = (app,upload) => {

    let router = require("express").Router();

    //리스트 조회
    router.get('', function (req, res) {
        let boards;
        let page = 1;
        let offset = 0;
        if (typeof req.query.page !== 'undefined') {
            page = req.query.page;
            offset = (page - 1) * 10;
        }

        let searchWord = typeof req.query.searchWord !== 'undefined' ? req.query.searchWord : '';
        let startDate = new Date();
        startDate.setFullYear(2000);
        if (typeof req.query.startDate !== 'undefined' && req.query.startDate !== '') {
            startDate.setFullYear(req.query.startDate.substring(0, 4));
            startDate.setMonth(req.query.startDate.substring(4, 6) - 1);
            startDate.setDate(req.query.startDate.substring(6, 8));
            startDate.setHours(0);
        }
        let endDate = new Date();
        endDate.setFullYear(2999);
        if (typeof req.query.endDate !== 'undefined' && req.query.endDate !== '') {
            endDate.setFullYear(req.query.endDate.substring(0, 4));
            endDate.setMonth(req.query.endDate.substring(4, 6) - 1);
            endDate.setDate(req.query.endDate.substring(6, 8));
            endDate.setHours(24);
        }

        db.board.findAll({
            limit: 10,
            offset: offset,
            order: [['reg_date', 'desc']],
            where: {
                subject: {
                    [Op.like]: "%" + searchWord + "%"
                },
                reg_date: {
                    [Op.and]: {
                        [Op.lt]: endDate,
                        [Op.gt]: startDate,
                    }
                }
            }
        }).then(data => {
            boards = data;
            return db.board.count({
                where: {
                    subject: {
                        [Op.like]: "%" + searchWord + "%"
                    },
                    reg_date: {
                        [Op.and]: {
                            [Op.lt]: endDate,
                            [Op.gt]: startDate,
                        }
                    }
                }
            });
        }).then(data => {
            res.render('list', {
                boardList: boards.map(e => e.toJSON()),
                totalCount: data,
                page: page,
                searchWord: searchWord,
                dateParser: dateParser,
                startDate: req.query.startDate,
                endDate: req.query.endDate
            });
        }).catch(err => {
            console.log(err);
        });
    });


    //글작성 이동 :id
    router.get('/write', function (req, res) {
        res.render('write', {
            'dateParser': dateParser
        });
    });

    //글작성
    router.post('/write', upload.single('video'), function (req, res) {
        let board = {
            'subject': req.body.subject,
            'content': req.body.content,
            'writer': req.body.writer,
            'video_path': req.query.saveVideoName,
            'video_name': req.file.originalname,
            'reg_date': new Date()
        };

        if (boardValidator.valid(board)) {
            console.log('valid fail');
        } else {
            console.log('valid true');
        }

        db.board.create(board).then(data => {
            res.redirect('/board');
        }).catch(err => {
            console.log(err);
        });
    });

    //글수정 페이지 이동
    router.get('/update/:id', function (req, res) {
        db.board.findOne({
            where: {
                id: req.params.id
            }
        }).then(data => {
            res.render('update', {
                'board': data.toJSON(),
                'dateParser': dateParser
            });
        }).catch(err => {
            console.log(err);
        });
    });

    //글 수정
    router.put('/:id', upload.single('video'), function (req, res) {
        db.board.findOne({
            where: {
                id: req.params.id
            }
        }).then(data => {
            data.subject = req.body.subject;
            data.writer = req.body.writer;
            data.content = req.body.content;
            if (typeof req.file !== 'undefined') {
                data.video_path = req.query.saveVideoName;
                data.video_name = req.file.originalname;
            }
            if (boardValidator.valid(data)) {
                console.log('valid fail');
            } else {
                console.log('valid true');
            }
            return data.save();
        }).then(data => {
            res.send(true);
        }).catch(err => {
            console.log(err);
        });
    });

    router.get('/:id', function (req, res) {
        db.board.findOne({
            where: {
                id: req.params.id
            }
        }).then(data => {
            res.render('board', {
                'board': data.toJSON(),
                'dateParser': dateParser
            });
        }).catch(err => {
            console.log(err);
        });
    });

    router.delete('/:id', function (req, res) {
        db.board.destroy({
            where: {
                id: req.params.id
            }
        }).then(() => {
            res.send(true);
        }).catch(err => {
            console.log(err);
        });
    });

    app.use('/board',router);
};