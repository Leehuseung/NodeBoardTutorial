let express = require('express');
const multer = require('multer')
const bodyParser = require('body-parser');
const morgan = require('morgan');
const dateParser = require('./utility/dateParser');
const {Op} = require('sequelize');
const boardValidator = require('./utility/boardValidator');
const swaggerConfig = require('./swaggerConfig.json');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const db = require('./modules/index');

let app = express();
//morgan
app.use(morgan('combined'))

//static
app.use('/video', express.static('uploads'));
//EJS
app.set('view engine', 'ejs');
//bodyParser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, req.query.saveVideoName);
    }
});
let upload = multer({storage: storage});


//sync, dummy insert
db.sequelize.sync({force: true}).then(() => {
    let boards = [];

    for (let i = 1; i <= 25; i++) {
        let date = new Date();
        date.setDate(date.getDate()-(25-i));

        boards.push({
            'subject': `제목${i}`,
            'content': `내용${i}`,
            'writer': `작성자${i}`,
            'reg_date' : date,
            'video_path': '20221213110704',
            'video_name': 'video1.mp4'
        })
    }
    return db.board.bulkCreate(boards);
}).then(data => {
    console.log('dummy insert success!!!');
}).catch(err => {
    console.log(err);
});

//swagger
const specs = swaggerJsdoc(swaggerConfig);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/', function (req, res) {
    res.send('abcd');
});

//리스트 조회
app.get('/board', function (req, res) {
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

/**
 * @swagger
 * tags:
 *   name: Boards
 *   description: 게시글 추가 수정 삭제 조회
 */


/**
 * @swagger
 * /api/board/list?page={page}:
 *  get:
 *    summary: "게시글 리스트 조회"
 *    description: "페이지,날짜,검색어를 이용해 게시글 리스트 조회"
 *    tags: [Boards]
 *    parameters:
 *      - in: query
 *        name: page
 *        required: true
 *        description: 페이지
 *        schema:
 *          type: integer
 *      - in: query
 *        name: searchWord
 *        required: false
 *        description: 검색 제목
 *        schema:
 *          type: string
 *      - in: query
 *        name: startDate
 *        required: false
 *        description: 검색 시작날짜 (yyyymmdd)
 *        schema:
 *          type: integer
 *      - in: query
 *        name: endDate
 *        required: false
 *        description: 검색 종료날짜 (yyyymmdd)
 *        schema:
 *          type: integer
 *    responses:
 *      "200":
 *        description:  총 게시글의 수를 리스트와 반환합니다.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                count:
 *                  type: integer
 *                  example: 1
 *                boards:
 *                  type: object
 *                  example: [{
 *                            "id": 1,
 *                            "subject": "제목",
 *                            "content": "내용",
 *                            "writer": "작성자",
 *                            "video_path": "20220101010101",
 *                            "video_name": "video.mp4",
 *                            "reg_date": "2022-01-01T00:00:00.000Z",
 *                            "updatedAt": "2022-01-01T00:00:00.000Z"
 *                           }]
 */
app.get('/api/board/list', function (req, res) {
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
        res.send({
            boards: boards.map(e => e.toJSON()),
            count: data
        });
    }).catch(err => {
        console.log(err);
    });
});

//글작성 이동 :id
app.get('/board/write', function (req, res) {
    res.render('write', {
        'dateParser': dateParser
    });
});


/**
 * @swagger
 * /api/board?saveVideoName={saveVideoName}:
 *  post:
 *    summary: "게시글 작성"
 *    description: "게시글 작성"
 *    tags: [Boards]
 *    parameters:
 *      - in: query
 *        name: saveVideoName
 *        required: true
 *        description: 영상저장이름 (20221213110704)
 *        schema:
 *          type: integer
 *    requestBody:
 *      description: 게시글 작성
 *      required: true
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              writer:
 *                type: string
 *                description: "작성자"
 *              subject:
 *                type: string
 *                description: "제목"
 *              content:
 *                type: string
 *                description: "내용"
 *              video:
 *                type: file
 *                description: "영상"
 *    responses:
 *      "200":
 *        description:  게시글을 작성합니다.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *              example: {
 *                        "id": 1,
 *                        "subject": "제목",
 *                        "content": "내용",
 *                        "writer": "작성자",
 *                        "video_path": "20220101010101",
 *                        "video_name": "video.mp4",
 *                        "reg_date": "2022-01-01T00:00:00.000Z",
 *                        "updatedAt": "2022-01-01T00:00:00.000Z"
 *                       }
 *      "400":
 *         description: "요청 오류"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 메시지
 *                   example: "Parameter error"
 */
app.post('/api/board', upload.single('video'), function (req, res) {
    let board = {
        'subject': req.body.subject,
        'content': req.body.content,
        'writer': req.body.writer,
        'video_path': req.query.saveVideoName,
        'video_name': req.file.originalname
    };

    if (boardValidator.valid(board)) {
        res.status(400).send({
            'message': 'Parameter error'
        });
    }

    db.board.create(board).then(data => {
        res.send(data.toJSON());
    }).catch(err => {
        console.log(err);
    });
});

//글작성
app.post('/board/write', upload.single('video'), function (req, res) {
    let board = {
        'subject': req.body.subject,
        'content': req.body.content,
        'writer': req.body.writer,
        'video_path': req.query.saveVideoName,
        'video_name': req.file.originalname
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
app.get('/board/update/:id', function (req, res) {
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
app.put('/board/:id', upload.single('video'), function (req, res) {
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

app.get('/board/:id', function (req, res) {
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


/**
 * @swagger
 * /api/board/{id}:
 *  get:
 *    summary: "게시글 조회"
 *    description: "게시글 조회"
 *    tags: [Boards]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        description: 게시글 아이디
 *        schema:
 *          type: integer
 *    responses:
 *      "200":
 *        description:  게시글을 반환합니다.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *              example: {
 *                        "id": 1,
 *                        "subject": "제목",
 *                        "content": "내용",
 *                        "writer": "작성자",
 *                        "video_path": "20220101010101",
 *                        "video_name": "video.mp4",
 *                        "reg_date": "2022-01-01T00:00:00.000Z",
 *                        "updatedAt": "2022-01-01T00:00:00.000Z"
 *                       }
 */
app.get('/api/board/:id', function (req, res) {
    db.board.findOne({
        where: {
            id: req.params.id
        }
    }).then(data => {
        console.log(data.toJSON());
        res.send(data.toJSON());
    }).catch(err => {
        console.log(err);
    });
});

app.delete('/board/:id', function (req, res) {
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


/**
 * @swagger
 * /api/board/{id}:
 *  put:
 *    summary: "게시글 수정"
 *    description: "게시글 수정"
 *    tags: [Boards]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        description: 게시글 ID
 *        schema:
 *          type: integer
 *      - in: query
 *        name: saveVideoName
 *        required: false
 *        description: 영상저장이름 (20221213110704)
 *        schema:
 *          type: integer
 *    requestBody:
 *      description: 게시글 수정
 *      required: true
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              writer:
 *                type: string
 *                description: "작성자"
 *              subject:
 *                type: string
 *                description: "제목"
 *              content:
 *                type: string
 *                description: "내용"
 *              video:
 *                type: file
 *                description: "영상"
 *    responses:
 *      "200":
 *        description:  게시글을 수정 후 수정된 게시글을 반환합니다.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *              example: {
 *                        "id": 1,
 *                        "subject": "수정된 제목",
 *                        "content": "수정된 내용",
 *                        "writer": "수정된 작성자",
 *                        "video_path": "20220101010101",
 *                        "video_name": "video.mp4",
 *                        "reg_date": "2022-01-01T00:00:00.000Z",
 *                        "updatedAt": "2022-01-01T00:00:00.000Z"
 *                       }
 *      "400":
 *        description: "요청 오류"
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  description: 메시지
 *                  example: "Parameter error"
 */
app.put('/api/board/:id', upload.single('video'), function (req, res) {
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
            res.status(400).send({
                'message': 'Parameter error'
            });
        }
        return data.save();
    }).then(data => {
        res.send(data.toJSON());
    }).catch(err => {
        console.log(err);
    });
});


/**
 * @swagger
 * /api/board/{id}:
 *  delete:
 *    summary: "게시글 삭제"
 *    description: "게시글 삭제"
 *    tags: [Boards]
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        description: 게시글 아이디
 *        schema:
 *          type: integer
 *    responses:
 *      "200":
 *        description:  게시글을 삭제합니다.
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                result:
 *                  type: boolean
 */
app.delete('/api/board/:id', function (req, res) {
    db.board.destroy({
        where: {
            id: req.params.id
        }
    }).then(() => {
        res.send({result: true});
    }).catch(err => {
        console.log(err);
    });
});


app.listen(8080);
console.log('Server is listening on port 8080');

