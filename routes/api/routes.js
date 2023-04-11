const express = require('express'); //express 
const compression = require('compression');// compression is used to compress the response
const bp = require('body-parser'); //body-parser is a package that parses the request body
const db = require('./database/connection');
const router = express.Router();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');///jwt json web token is used to authenticate the user
const { xss } = require('express-xss-sanitizer');
const { application } = require('express');
require('dotenv').config();///dotenv é um pacote que permite que você armazene informações em um arquivo .env, que é um arquivo de configuração do ambiente.
router.use(compression()); //compression is used to compress the response
router.use(bp.json({ limit: '50mb' })); //limitando o tamanho do request body para evitar overflow
router.use(cookieParser()); //cookie-parser is a middleware that parses cookies from the request and makes them available as req.cookies
router.use(xss()); //middleware para xss

router.post('/login', (req, res, next) => {
     //esse teste abaixo deve ser feito no seu banco de dados
    if(req.body.user == process.env.USER_NAME /*Acessando a variavel de ambiente com process.env.*/ && req.body.password == process.env.USER_SECRET){
        //auth ok
        const id = process.env.USER_ID; //esse id viria do banco de dados
        const token = jwt.sign({ id }, process.env.USER_SECRET, {
          expiresIn: 86400 // expires in 24 hours
        });
        res.status(200).cookie('x-access-token', token, { httpOnly: true, auth: true, maxAge: 360000 }).json({ auth: true, token: token }); ///criano o cookie com o token
      }else{
        res.status(500).json({message: 'Invalid credentials'});
      }
});

router.post('/logout', (req, res, next) => {
    res.clearCookie('x-access-token');// limpa o cookie
    res.status(200).json({ auth: false, token: null });
});

function verifyToken(req, res, next) { //middleware para verificar o token
    const token = req.cookies['x-access-token'] //pegando o token do cookie
    if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, process.env.USER_SECRET, function(err, decoded) {
      if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
      req.userId = decoded.id;
      next();
    });
}

router.post('/find/name=:str', verifyToken, (req, res) => {
    let str = req.params.str;
    const sql = `SELECT av.*, eq.nome_equip, eq.descricao_equip FROM avenger AS av INNER JOIN equipments AS eq ON eq.avenger_id = av.id WHERE av.identidade_atual LIKE upper('%${str}%') OR av.nome LIKE upper('%${str}%')`;
    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            return;
        }
        res.status(200).json(result);
    });
});

router.post('/find/all', verifyToken, (req, res) => {
    const sql = `SELECT av.*, eq.nome_equip, eq.descricao_equip FROM avenger AS av INNER JOIN equipments AS eq ON eq.avenger_id = av.id`; // retorna todos os avengers
    db.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            return;
        }
        res.status(200).json(result);
    });
})

module.exports = router;

