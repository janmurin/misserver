"use strict"
console.log("starting server...");
var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require("socket.io")(http),
    async = require('async');

app.use(express.static('public'));
app.set('view engine', 'ejs');
var serverUrl = 'http://81.2.246.239:8080';
var http2 = require('http');
var urlencode = require('urlencode');
var session = require('client-sessions');
var mysql = require('mysql');
//var connection = mysql.createConnection({
//    host: 'localhost',
//    user: 'root',
//    password: ''
//});
var connection = mysql.createConnection({
    host: '81.2.244.134',
    user: 'cookieuser',
    password: ''
});
//connection.connect();
//connection.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
//    if (err) throw err;
//    console.log('The solution is: ', rows[0].solution);
//});
//connection.end();

function getTime() {
    var d = new Date();
    //console.log(d.getTime());
    var n = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "." + d.getMilliseconds();
    return n;
}

app.use(session({
    cookieName: 'session',
    secret: 'random_string_goes_here',
    duration: 1000 * 60 * 60 * 24 * 365
}));

app.get('/', function (req, res) {
    try {
        if (req.session && req.session.user) { // Check if session exists
            // spristupnime cookie javascriptu aby sa cez socket.io vedelo s cookie pracovat
            res.locals.user = req.session.user;
            res.render('index3');
        } else {
            // create new cookie
            var user = {};
            var d = new Date;
            user.username = d.getTime();
            req.session.user = user;
            res.locals.user = user;
            res.render('index3');
        }
    }
    catch (err) {
        console.log(getTime() + ': ' + err.message);
    }
});

io.on('connection', function (socket) {
    try {
        var address = 'default';
        address = socket.handshake.address + ':' + socket.handshake.port;
        console.log(getTime() + " new client connected " + address);
        //var client = new Client();

        //var basket = new shop.Basket();
        socket.on("hello", function (data) {
            //basket.addProduct(data.pid);
            console.log(getTime() + " client " + address + " cookie:[" + data.cookie + "] hello message: " + data.message);
            socket.emit("helloReceived", {success: true});
        });
        socket.on("najdiKontakty", function (data) {
            data.hladane = odstranPodozrive(data.hladane);
            var url = serverUrl + "/najdiPriezvisko/" + urlencode(data.hladane);
            console.log(getTime() + " client " + address + "[" + data.cookie + "] GET request to url: " + url);
            var calls = [];
            calls.push(function (callback) {
                console.log(getTime() + ' hladane: ' + data.hladane);
                http2.get(url, function (response) {
                    // Continuously update stream with data
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        // Data reception is done, do whatever with it!
                        var parsed = JSON.parse(body);
                        //console.log("parsed body: " + JSON.stringify(parsed));
                        //console.log("response: " + JSON.stringify(response));
                        if (response.statusCode != 200) {
                            socket.emit("kontaktyReceived",
                                {
                                    statusText: "ERROR",
                                    message: parsed,
                                    showAlert: false,
                                    upravene: data.hladane
                                });
                        } else {
                            socket.emit("kontaktyReceived",
                                {
                                    statusText: "OK",
                                    message: parsed,
                                    showAlert: false,
                                    upravene: data.hladane
                                });
                        }
                    });
                }).on('error', (e) => {
                    console.log(getTime() + ' Got error: ' + e.message);
                });
                callback(null, "najdiKontakty async task finished");
            });
            async.parallel(calls, function (err, result) {
                //console.log(getTime() + ' async request completed');
            });
        });
        socket.on("najdiPriezviska", function (data) {
            data.hladane = odstranPodozrive(data.hladane);
            var url = serverUrl + "/dajPriezviska/" + urlencode(data.hladane);
            console.log(getTime() + " client " + address + "[" + data.cookie + "] GET request to url: " + url);
            var calls = [];
            calls.push(function (callback) {
                console.log(getTime() + ' hladane: ' + data.hladane);
                http2.get(url, function (response) {
                    // Continuously update stream with data
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        // Data reception is done, do whatever with it!
                        var parsed = JSON.parse(body);
                        //console.log("parsed body: " + JSON.stringify(parsed));
                        //console.log("response: " + JSON.stringify(response));
                        if (response.statusCode != 200) {
                            socket.emit("priezviskaReceived",
                                {
                                    statusText: "ERROR",
                                    message: parsed,
                                    showAlert: false,
                                    upravene: data.hladane
                                });
                        } else {
                            socket.emit("priezviskaReceived",
                                {
                                    statusText: "OK",
                                    message: parsed,
                                    showAlert: false,
                                    upravene: data.hladane
                                });
                        }
                    });
                }).on('error', (e) => {
                    console.log(getTime() + ' Got error: ' + e.message);
                });
                callback(null, "najdiPriezviska async task finished");
            });
            async.parallel(calls, function (err, result) {
                // console.log(result);
                //console.log(getTime() + ' async request completed');
            });
        });
        socket.on("getTopHladaneKontakty", function (data) {
            var url = serverUrl + "/top/";
            console.log(getTime() + " client " + address + "[" + data.cookie + "] GET request to url: " + url);
            var calls = [];
            calls.push(function (callback) {
                http2.get(url, function (response) {
                    // Continuously update stream with data
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        // Data reception is done, do whatever with it!
                        var parsed = JSON.parse(body);
                        //console.log("parsed body: " + JSON.stringify(parsed));
                        //console.log("response: " + JSON.stringify(response));
                        if (response.statusCode != 200) {
                            socket.emit("topHladaneKontaktyReceived",
                                {
                                    statusText: "ERROR",
                                    message: parsed,
                                    showAlert: false
                                });
                        } else {
                            socket.emit("topHladaneKontaktyReceived",
                                {
                                    statusText: "OK",
                                    message: parsed,
                                    showAlert: false
                                });
                        }
                    });
                }).on('error', (e) => {
                    console.log(getTime() + ' Got error: ' + e.message);
                });
                callback(null, "getTopHladaneKontakty async task finished");
            });
            async.parallel(calls, function (err, result) {
                // console.log(result);
                //console.log(getTime() + ' async request completed');
            });
        });
        socket.on("getPoslednaHistoria", function (data) {
            console.log(getTime() + " client " + address + "[" + data.cookie + "] getPoslednaHistoria ");
            try {
                var calls = [];
                var kontakty = [];
                var newRows = [];
                //connection.connect();
                //connection.query("SELECT kontakt FROM cookiedb.cookieslog where cookie='" + data.cookie + "' group by kontaktID order by cas desc limit 5", function (err, rows) {
                //        if (rows != undefined) {
                //            for (var i = 0; i < rows.length; i++) {
                //                //console.log("parsing: "+JSON.stringify(rows[i].kontakt));
                //                newRows.push(JSON.parse(rows[i].kontakt));
                //            }
                //        }
                //        //console.log(JSON.stringify(newRows));
                //    }
                //);
                //connection.end();
                console.log("najdenych historia kontaktov: " + newRows.length);
                if (newRows.length > 0) {
                    socket.emit("poslednaHistoriaReceived",
                        {
                            statusText: "OK",
                            message: newRows,
                            showAlert: false
                        });
                } else {
                    socket.emit("poslednaHistoriaReceived",
                        {
                            statusText: "ERROR",
                            message: "no history",
                            showAlert: false
                        });
                }
            }
            catch (er) {
                console.log(getTime() + ': ' + er.message);
            }
        });
// toto uz netreba lebo server rovno vracia kontakty historie
//socket.on("dajPoslednuHistoriu", function (data) {
//    console.log(getTime() + " client " + address + "[" + data.cookie + "] dajPoslednuHistoriu for " + data.message);
//    var calls = [];
//    var url = serverUrl + "/kontakt/" + data.message[0].kontaktID;
//    calls.push(function (callback) {
//        http2.get(url, (res) => {
//            //console.log(res);
//            res.on('data', named);
//            function named(chunk) {
//                try {
//                    //console.log(`BODY: ${chunk}`);
//                    if (res.statusCode != 200) {
//                        socket.emit("poslednaHistoriaKontaktyReceived",
//                            {
//                                statusText: "ERROR",
//                                message: JSON.parse(chunk),
//                                showAlert: false
//                            });
//                    } else {
//                        socket.emit("poslednaHistoriaKontaktyReceived",
//                            {
//                                statusText: "OK",
//                                message: JSON.parse(chunk),
//                                showAlert: false
//                            });
//                    }
//                } catch (err) {
//                    console.log(getTime() + ' ' + err);
//                }
//            }
//
//            // consume response body
//            res.resume();
//        }).on('error', (e) => {
//            console.log(getTime() + ' Got error: ' + e.message);
//        });
//        callback(null, "dajPoslednuHistoriu async task finished");
//    });
//    async.parallel(calls, function (err, result) {
//        // console.log(result);
//        console.log(getTime() + ' dajPoslednuHistoriu async request completed');
//    });
//});
        socket.on("getKontakt", function (data) {
            var url = serverUrl + "/kontakt/" + data.id;
            console.log(getTime() + " client " + address + "[" + data.cookie + "] GET request to url: " + url);
            //connection.connect();
            //connection.query("insert into cookiedb.cookieslog(cookie,kontaktID,cas,kontakt)" +
            //    "values('" + data.cookie + "','" + data.id + "',NOW(),'" + JSON.stringify(data.kontaktJson) + "');", function (err, rows, fields) {
            //    if (err) {
            //        console.log(getTime() + ': ' + err.message);
            //    } //throw err;
            //    console.log(getTime() + ' odpoved databazy: ' + JSON.stringify(rows));
            //});
            //connection.end();

            var calls = [];
            calls.push(function (callback) {
                http2.get(url, function (response) {
                    // Continuously update stream with data
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        // Data reception is done, do whatever with it!
                        var parsed = JSON.parse(body);
                        //console.log("parsed body: " + JSON.stringify(parsed));
                        //console.log("response: " + JSON.stringify(response));
                        if (response.statusCode != 200) {
                            if (data.returnMessage == true) {
                                socket.emit("kontaktReceived",
                                    {
                                        statusText: "ERROR",
                                        message: parsed,
                                        showAlert: false
                                    });
                            }
                        } else {
                            if (data.returnMessage == true) {
                                socket.emit("kontaktReceived",
                                    {
                                        statusText: "OK",
                                        message: parsed,
                                        showAlert: false
                                    });
                            }
                        }
                    });
                }).on('error', (e) => {
                    console.log(getTime() + ' Got error: ' + e.message);
                });
                callback(null, "getKontakt async task finished");
            });
            async.parallel(calls, function (err, result) {
                // console.log(result);
                //console.log(getTime() + ' async request completed');
            });
        });
        socket.on("getUniverzity", function (data) {
            console.log(getTime() + " client " + address + " [" + data.cookie + "] chce vediet vsetky univerzity");
            socket.emit("univerzityReceived",
                {
                    statusText: "OK",
                    message: [{id: 1, nazov: "Univerzita Pavla Jozefa Šafárika v Košiciach"}],
                    showAlert: false
                });
        });
        socket.on("getFakulty", function (data) {
            console.log(getTime() + " client " + address + " [" + data.cookie + "] chce vediet vsetky fakulty");
            var arr = [];
            arr.push({id: 1, idUniverzity: 1, nazov: "Prírodovedecká fakulta"});
            arr.push({id: 2, idUniverzity: 1, nazov: "Lekárska fakulta"});
            arr.push({id: 3, idUniverzity: 1, nazov: "Filozofická fakulta"});
            arr.push({id: 4, idUniverzity: 1, nazov: "Právnická fakulta"});
            arr.push({id: 5, idUniverzity: 1, nazov: "Fakulta verejnej správy"});
            arr.push({id: 6, idUniverzity: 1, nazov: "nezaradené"});
            socket.emit("fakultyReceived",
                {
                    statusText: "OK",
                    message: arr,
                    showAlert: false
                });
        });
        socket.on("getPracoviska", function (data) {
            var url = serverUrl + "/pracoviskaUniverzity/" + data.id;
            console.log(getTime() + " client " + address + " [" + data.cookie + "] chce vediet vsetky pracoviska url: " + url);
            var calls = [];
            calls.push(function (callback) {
                http2.get(url, function (response) {
                    // Continuously update stream with data
                    var body = '';
                    response.on('data', function (d) {
                        body += d;
                    });
                    response.on('end', function () {
                        // Data reception is done, do whatever with it!
                        var parsed = JSON.parse(body);
                        //console.log("parsed body: " + JSON.stringify(parsed));
                        //console.log("response: " + JSON.stringify(response));
                        if (response.statusCode != 200) {
                            socket.emit("pracoviskaReceived",
                                {
                                    statusText: "ERROR",
                                    message: parsed,
                                    showAlert: false
                                });
                        } else {
                            socket.emit("pracoviskaReceived",
                                {
                                    statusText: "OK",
                                    message: parsed,
                                    showAlert: false
                                });
                        }
                    });
                }).on('error', (e) => {
                    console.log(getTime() + ' Got error: ' + e.message);
                });
                callback(null, "getPracoviska async task finished");
            });
            async.parallel(calls, function (err, result) {
            });
        });
    }
    catch
        (err) {
        console.log(getTime() + ': ' + err.message);
    }
})
;

function odstranPodozrive(podozrivy) {
    podozrivy = podozrivy.substring(0, 30);
    var zle = "~!@#$%^&*(){}|;[]'\"/\\.,?*-+=-0123456789";
    var sb = "";
    for (var i = 0; i < podozrivy.length; i++) {
        var ma = false;
        for (var k = 0; k < zle.length; k++) {
            if (zle.charAt(k) == podozrivy.charAt(i)) {
                ma = true;
                break;
            }
        }
        if (!ma) {
            sb += podozrivy.charAt(i);
        }
    }
    console.log("input=[" + podozrivy + "] output=[" + sb + "] ");
    //System.out.println("input=[" + podozrivy + "] output=[" + sb.toString() + "] ");
    return sb;
}


var server = http.listen(3000);
console.log("server started and listening on port 3000");


