let express = require('express');
const multer = require('multer')
const bodyParser = require('body-parser');
const morgan = require('morgan');
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
//swagger
const specs = swaggerJsdoc(swaggerConfig);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

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


require('./routes/board.ejs')(app,upload);
require('./routes/board.api')(app,upload);


app.listen(8080);
console.log('Server is listening on port 8080');

