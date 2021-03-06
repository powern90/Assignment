var express = require('express');
var router = express.Router();
let mysql = require('mysql'); //mysql 모듈을 로딩.
var pool = mysql.createPool({
    connectionLimit: 5,
    host     : 'assign.bluemango.me',
    user     : 'root',
    password : '1234!',
    database : 'db_project'
});

/* GET users listing. */
router.post('/', function (req, res, next) {
    pool.getConnection(function (err, connection) {
        connection.query(
            'select p1.name, p1.pid from friend as f1, person as p1\n' +
            'where f1.student_a = ? and f1.accept= 1 and f1.student_b = p1.pid\n' +
            'union select p2.name, p2.pid from friend as f2, person as p2\n' +
            'where f2.student_b = ? and f2.accept= 1 and f2.student_a = p2.pid;', [req.body.user, req.body.user],
            function (err, friend_list) {
                if (err) console.log(err)        // 만약 에러값이 존재한다면 로그에 표시합니다.

                connection.query(
                    'select fr.student_a as friend_pid, pr.name\n' +
                    'from person as pr, friend as fr\n' +
                    'where fr.student_b = ? and accept = 0 and fr.student_a = pr.pid;', [req.body.user],
                    function (err, apply_list) {
                        if (err) console.log(err)        // 만약 에러값이 존재한다면 로그에 표시합니다.
                        res.json({apply_list, friend_list});
                    });
            });
        connection.release();
    });
});

router.post('/main', function (req, res, next) {
    pool.getConnection(function (err, connection) {
        connection.query(
            'select sub.* from score as sc, subject as sub where sc.pid = ? and sc.snum=sub.snum and sc.semester=?', [req.body.user, req.body.semes],
            function (err, rows2) {
                if (err) console.log(err)        // 만약 에러값이 존재한다면 로그에 표시합니다.
                connection.query(
                    'select * from score, notice, subject where score.snum = notice.snum and score.pid = ? and score.snum = subject.snum order by date DESC limit 4', [req.body.user],
                    function (err, notice) {
                        if (err) console.log(err)        // 만약 에러값이 존재한다면 로그에 표시합니다.
                        res.json({rows2, notice});
                    });
            });
        connection.release();
    });
});


router.post('/add_friend', function (req, res, next) {
    var result = [];
    if (req.body.user === req.body.friend) {          //자기 자신 친구로 넣은 경우
        result.push('same');
        res.json({result});
        return 0;
    }
    pool.getConnection(function (err, connection) {
        connection.query(
            'select accept from friend as f1 where (f1.student_a=? and f1.student_b=?) \n' +
            '                              or (f1.student_a=? and f1.student_b=?);', [req.body.user, req.body.friend, req.body.friend, req.body.user],
            function (err, exist_friend) {
                if (err) console.log(err)
                if (exist_friend.length !== 0) {
                    console.log(exist_friend);
                    console.log(exist_friend[0].accept);
                    if (exist_friend[0].accept === 0) {
                        result.push('already_apply');
                        res.json({result});
                        return 0;
                    } else {
                        result.push('already');          //이미 친구상태인 경우
                        res.json({result});
                        return 0;
                    }
                }
                connection.query(
                    'insert into friend (student_a, student_b) value (?, ?)', [parseInt(req.body.user), parseInt(req.body.friend)],
                    function (err, add_friend) {
                        if (err) {
                            console.log(err)        // 만약 에러값이 존재한다면 로그에 표시합니다.
                            result.push('error');
                            res.json({result});
                            return 0;
                        }
                        result.push('success');
                        res.json({result});
                        console.log(result);
                    });
            });
        connection.release();
    });
});

router.post('/accept', function (req, res, next) {
    pool.getConnection(function (err, connection) {
        connection.query(
            'update friend set accept = 1 where student_a = ? and student_b = ? and accept = 0', [req.body.friend_pid, req.body.user],
            function (err, friend_list) {
                var result = [];
                if (err) {
                    console.log(err);
                    result.push('error');
                    res.json({result});
                    return 0;
                }
                result.push('successs');
                res.json({result});

            });
        connection.release();
    });
});

router.post('/reject', function (req, res, next) {
    pool.getConnection(function (err, connection) {
        connection.query(
            'delete from friend where student_a = ? and student_b = ? and accept = 0', [req.body.friend_pid, req.body.user],
            function (err, friend_list) {
                if (err) console.log(err)
            });
        connection.release();
    });
});

router.post('/seme', function (req, res, next) {
    pool.getConnection(function (err, connection) {
        connection.query(
            'select sub.* from score as sc, subject as sub where sc.pid = ? and sc.snum=sub.snum and sc.semester=?', [req.body.user, req.body.semes],
            function (err, other_table) {
                if (err) console.log(err)
                res.json(other_table)
            });
        connection.release();
    });
});

router.post('/calltable', function (req, res, next) {
    pool.getConnection(function (err, connection) {
        connection.query(
            'select sub.* from score as sc, subject as sub where sc.pid = ? and sc.snum=sub.snum and sc.semester=?', [req.body.friend_pid, req.body.semes],
            function (err, friend_table) {
                if (err) console.log(err)
                res.json(friend_table)
            });
        connection.release();
    });
});
module.exports = router;
