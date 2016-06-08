// TODO:
// - nevie hladat bez diakritiky a malymi pismenami
//
var socket = io('http://localhost:9000');
//var socket = io('http://81.2.244.134/node/');
var topKontakty = [];
var historiaKontakty = [];
var cookieValue = "";

$(document).ready(function () {
    console.log("jquery ready");
    cookieValue = $('#cookie').text();
    console.log("cookie value: [" + cookieValue + "]");
    $('#hladatButton').click(function () {
        getKontaktyFromHladanePriezviskoInputText()
    });
    $('#hladanePriezviskoInputText').keyup(function (event) {
        // ak zadame nealfanumericky znak tak nic nerobime
        $("#searchFormGroup").removeClass("has-success");
        $("#searchFormGroup").removeClass("has-error has-feedback");
        if (event.keyCode == 13) {
            // enter pressed, najdeme zadane slovo
            getKontaktyFromHladanePriezviskoInputText();
            return;
        }
        if (event.keyCode == 40 || event.keyCode == 38) {
            // stlacena sipka dole a hore
            return;
        }

        var searchWord = $("#hladanePriezviskoInputText").val();
        console.log("hladanePriezviskoInputText onKeyDown with parameter: " + searchWord);
        // ak mame 3 pismenka tak posielame request
        if (searchWord.length > 2) {
            socket.emit("najdiPriezviska", {
                hladane: searchWord,
                cookie: cookieValue
            });
        }
    });
    getTopHladaneKontakty();
    //getPoslednaHistoria();
    socket.emit("hello", {
        message: "hello message from client",
        cookie: cookieValue
    });
});

socket.on("helloReceived", function (data) {
    console.log('hello received: ' + JSON.stringify(data));
});
socket.on("priezviskaReceived", function (data) {
    if (data.statusText === "OK") {
        $("#searchFormGroup").addClass("has-success");
        console.log('priezviskaReceived ziskane priezviska: ');//+ JSON.stringify(data.message));
        displayTooltip(data.message);
    } else {
        if (data.showAlert == true) {
            alert(data.message);
        }
        // pravdepodobne neexistuje taky kontakt tak upravime input field
        $("#searchFormGroup").addClass("has-error has-feedback");
        console.log("priezviskaReceived STATUS NOT OK: " + JSON.stringify(data));
    }
});
socket.on("kontaktyReceived", function (data) {
    if (data.statusText === "OK") {
        $("#searchFormGroup").addClass("has-success");
        console.log('kontaktyReceived ziskane kontakty: ');//+ JSON.stringify(data.message));
        refreshZoznamTable(data.message);
        zvysNavstevnostKontaktu(data.message[0]);
    } else {
        if (data.showAlert == true) {
            alert(data.message);
        }
        // pravdepodobne neexistuje taky kontakt tak upravime input field
        $("#searchFormGroup").addClass("has-error has-feedback");
        console.log("kontaktyReceived STATUS NOT OK: " + JSON.stringify(data));
    }
});
socket.on("topHladaneKontaktyReceived", function (data) {
    if (data.statusText === "OK") {
        console.log('topHladaneKontaktyReceived ziskane kontakty: '+ JSON.stringify(data.message));
        topKontakty = data.message;
        refreshTopKontakty(data.message);
        getPoslednaHistoria();
    } else {
        topKontakty = [];
        if (data.showAlert == true) {
            alert(data.message);
        }
        // pravdepodobne neexistuje taky kontakt tak upravime input field
        console.log("topHladaneKontaktyReceived STATUS NOT OK: " + JSON.stringify(data));
    }
});
socket.on("poslednaHistoriaReceived", function (data) {
    if (data.statusText === "OK") {
        console.log('poslednaHistoriaReceived ziskane kontakty: ' + JSON.stringify(data.message));
        historiaKontakty = data.message;
        refreshHistoriaKontakty(historiaKontakty);
        // teraz som posielal idcka kontqaktov z poslednej historie ale uz mis erver rovno vrati kontakty
        //socket.emit("dajPoslednuHistoriu", {
        //    message: data.message,
        //    cookie: cookieValue
        //});
    } else {
        if (data.showAlert == true) {
            alert(data.message);
        }
        console.log("poslednaHistoriaReceived STATUS NOT OK: " + JSON.stringify(data));
    }
});
// toto uz netreba lebo mi server rovno vrati kontakty poslednej historie
//socket.on("poslednaHistoriaKontaktyReceived", function (data) {
//    if (data.statusText === "OK") {
//        console.log('poslednaHistoriaKontaktyReceived ziskane kontakty: ' + JSON.stringify(data.message));
//        refreshHistoriaKontakty(data.message)
//    } else {
//        if (data.showAlert == true) {
//            alert(data.message);
//        }
//        console.log("poslednaHistoriaKontaktyReceived STATUS NOT OK: " + JSON.stringify(data));
//    }
//});
socket.on("kontaktReceived", function (data) {
    if (data.statusText === "OK") {
        console.log('kontaktReceived: ');//+ JSON.stringify(data.message));
        refreshKontaktDetail(data.message);
    } else {
        if (data.showAlert == true) {
            alert(data.message);
        }
        // pravdepodobne neexistuje taky kontakt tak upravime input field
        console.log("kontaktReceived STATUS NOT OK: " + JSON.stringify(data));
    }
});

function zvysNavstevnostKontaktu(kontakt) {
    console.log("zvysujeme navstevnost kontaktu: " + JSON.stringify(kontakt));
    // vysleme spravu aby sa zaznamenalo pozretie kontaktu
    socket.emit("getKontakt", {
        id: kontakt.id,
        returnMessage: false,
        kontaktJson: kontakt,
        cookie: cookieValue // mame kontakt v zozname tak ho nebudeme vyzadovat od servera
    });
}

function refreshKontaktDetail(kontakt) {
    var noveHistoricke = [];
    noveHistoricke.push(kontakt);
    for (var i = 0; i < historiaKontakty.length; i++) {
        noveHistoricke.push(historiaKontakty[i]);
    }
    historiaKontakty = noveHistoricke;
    var data = document.getElementById('kontaktDetail');
    data.innerHTML = "";
    var opt = document.createElement('p');
    opt.appendChild(document.createTextNode(JSON.stringify(kontakt)));
    data.appendChild(opt);
    refreshHistoriaKontakty(historiaKontakty);
}

function topKontaktClicked(val) {
    console.log("topKontaktClicked value: " + val);
    var kontakt = {};
    var najdeny = false;
    for (var i = 0; i < topKontakty.length; i++) {
        if (topKontakty[i].id == val) {
            kontakt = topKontakty[i];
            najdeny = true;
            break;
        }
    }
    // musi vzdy najst inak je problem
    console.log("najdeny kontakt: " + najdeny);
    if (najdeny) {
        refreshKontaktDetail(kontakt);
        zvysNavstevnostKontaktu(kontakt);
    } else {
        throw Error("nenaslo kontakt v top kontaktoch");
    }
}

function getTopHladaneKontakty() {
    socket.emit("getTopHladaneKontakty", {cookie: cookieValue});
}
function getPoslednaHistoria() {
    socket.emit("getPoslednaHistoria", {cookie: cookieValue});
}

function refreshTopKontakty(kontakty) {
    console.log("refreshing top kontakty: ");
    var data = document.getElementById('topHladane');
    data.innerHTML = "";
    var lgth = kontakty.length;
    if (lgth > 5) {
        lgth = 5;
    }
    for (var i = 0; i < lgth; i++) {
        var opt = document.createElement('dt');
        var a = document.createElement('a');
        a.setAttribute('onClick', "topKontaktClicked(" + kontakty[i].id + ")");
        a.appendChild(document.createTextNode(kontakty[i].meno + " " + kontakty[i].priezvisko));
        opt.appendChild(a);
        data.appendChild(opt);
        opt = document.createElement('dd');
        opt.appendChild(document.createTextNode(kontakty[i].tituly + " " + kontakty[i].email + ", " + kontakty[i].telefon + ", " + kontakty[i].osobnaReprezentacia));
        data.appendChild(opt);
        //console.log("appending: " + opt.outerHTML);
    }
}

function refreshHistoriaKontakty(kontakty) {
    console.log("refreshing historia kontakty: ");
    var data = document.getElementById('poslednaHistoria');
    if (kontakty.length == 0) {
        console.log("ziadne kontakty historie nemame, nerefreshujem poslednu historiu");
        return;
    }
    data.innerHTML = "";
    var lgth = kontakty.length;
    if (lgth > 5) {
        lgth = 5
    }
    for (var i = 0; i < lgth; i++) {
        var opt = document.createElement('dt');
        var a = document.createElement('a');
        a.setAttribute('onClick', "topKontaktClicked(" + kontakty[i].id + ")");
        a.appendChild(document.createTextNode(kontakty[i].meno + " " + kontakty[i].priezvisko));
        opt.appendChild(a);
        data.appendChild(opt);
        opt = document.createElement('dd');
        opt.appendChild(document.createTextNode(kontakty[i].tituly + " " + kontakty[i].email + ", " + kontakty[i].telefon + ", " + kontakty[i].osobnaReprezentacia));
        data.appendChild(opt);
        //console.log("appending: " + opt.outerHTML);
    }
}

// ziska kontakty obsahujuce zadany string so servera a refreshne tabulku
function getKontaktyFromHladanePriezviskoInputText() {
    var searchWord = $("#hladanePriezviskoInputText").val();
    console.log("hladatButton clicked with parameter: " + searchWord);
    if (searchWord.length > 0) {
        socket.emit("najdiKontakty", {
            hladane: searchWord,
            cookie: cookieValue
        });
    }
}

function refreshZoznamTable(polozkyTable) {
    console.log("refreshZoznamTable: with polozky size: " + polozkyTable.length);
    var table = document.getElementById('zoznamTable');
    table.innerHTML = "";
    // caption
    var caption = document.createElement("caption");
    caption.appendChild(document.createTextNode('Nájdené kontakty.'));
    table.appendChild(caption);
    // head
    var head = document.createElement("thead");
    var tr = document.createElement('tr');
    var th0 = document.createElement('th');
    th0.appendChild(document.createTextNode('#'));
    var th1 = document.createElement('th');
    th1.appendChild(document.createTextNode('Meno'));
    var th2 = document.createElement('th');
    th2.appendChild(document.createTextNode('priezvisko'));
    var th3 = document.createElement('th');
    th3.appendChild(document.createTextNode('povodne'));
    var th4 = document.createElement('th');
    th4.appendChild(document.createTextNode('Telefon'));
    tr.appendChild(th0);
    tr.appendChild(th1);
    tr.appendChild(th2);
    tr.appendChild(th3);
    tr.appendChild(th4);
    head.appendChild(tr);
    table.appendChild(head);
    // body
    var tbdy = document.createElement('tbody');
    for (var i = 0; i < polozkyTable.length; i++) {
        //console.log("spracuvam polozku: "+polozkyTable[i]);
        var tr = document.createElement('tr');
        var td0 = document.createElement('td');
        td0.appendChild(document.createTextNode(i + '.'));
        var td1 = document.createElement('td');
        td1.appendChild(document.createTextNode(polozkyTable[i].meno));
        var td2 = document.createElement('td');
        td2.appendChild(document.createTextNode(polozkyTable[i].priezvisko));
        var td3 = document.createElement('td');
        td3.appendChild(document.createTextNode(polozkyTable[i].povodnePriezvisko));
        var td4 = document.createElement('td');
        td4.appendChild(document.createTextNode(polozkyTable[i].telefon));
        tr.appendChild(td0);
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tbdy.appendChild(tr);
    }

    table.appendChild(tbdy);
    $("#tableRow").attr("style", "");
}

function displayTooltip(kontakty) {
    console.log("displayTooltip: hladam mena v kontakty length: " + kontakty.length);
    var podobne = {}; // nasa mnozina
    var priezviska = kontakty;
    // prechadzame vsetky kontakty a ukladame do setu vsetky priezviska pre nasepkanie
    // TODO nasepkavanie podla poctu vyskytov
    //for (var i = 0; i < kontakty.length; i++) {
    //    var priez = kontakty[i].priezvisko;
    //    if (priez in podobne) { // workaround pre funkcionalitu Setu
    //        // uz take priezvisko v mnozine mame
    //    } else {
    //        podobne[priez] = true;
    //        priezviska.push(priez);
    //    }
    //}
    //console.log("najdene priezviska: " + priezviska);
    var pocet = 4;
    if (priezviska.length < 4) {
        pocet = priezviska.length;
    }
    var data = document.getElementById('priezviska');
    data.innerHTML = "";
    for (var i = 0; i < pocet; i++) {
        var opt = document.createElement('option');
        opt.setAttribute("value", priezviska[i]);
        data.appendChild(opt);
        //console.log("appending: " + opt.outerHTML);
    }

    //console.log("novy nasepkavac: " + $("#priezviska").html());
}
