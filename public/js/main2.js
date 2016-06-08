// TODO:
// - nevie hladat bez diakritiky a malymi pismenami
//
var socket = io('http://localhost:9000');
//var socket = io('http://81.2.244.134');
var topKontakty = [];
var tableKontakty = [];
var historiaKontakty = [];
var univerzity = [];
var fakulty = [];
var pracoviska = [];
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
            // po kazdom searchi schovame containeri
            schovajContainery();
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
    socket.emit("hello", {
        message: "hello message from client",
        cookie: cookieValue
    });
    socket.emit("getUniverzity", {cookie: cookieValue});
    socket.emit("getFakulty", {cookie: cookieValue});
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
        tableKontakty = data.message;
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
        console.log('topHladaneKontaktyReceived ziskane kontakty: ' + JSON.stringify(data.message));
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
    } else {
        if (data.showAlert == true) {
            alert(data.message);
        }
        console.log("poslednaHistoriaReceived STATUS NOT OK: " + JSON.stringify(data));
    }
});
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
socket.on("univerzityReceived", function (data) {
    if (data.statusText === "OK") {
        console.log('univerzityReceived: ' + JSON.stringify(data.message));
        univerzity = data.message;
        socket.emit("getPracoviska", {cookie: cookieValue, id: data.message[0].id});
    } else {
        if (data.showAlert == true) {
            alert(data.message);
        }
        // pravdepodobne neexistuje taky kontakt tak upravime input field
        console.log("univerzityReceived STATUS NOT OK: " + JSON.stringify(data));
    }
});
socket.on("fakultyReceived", function (data) {
    if (data.statusText === "OK") {
        console.log('fakultyReceived: ' + JSON.stringify(data.message));
        fakulty = data.message;
    } else {
        if (data.showAlert == true) {
            alert(data.message);
        }
        // pravdepodobne neexistuje taky kontakt tak upravime input field
        console.log("fakultyReceived STATUS NOT OK: " + JSON.stringify(data));
    }
});
socket.on("pracoviskaReceived", function (data) {
    if (data.statusText === "OK") {
        console.log('pracoviskaReceived: ' + JSON.stringify(data.message));
        pracoviska = data.message;
    } else {
        if (data.showAlert == true) {
            alert(data.message);
        }
        // pravdepodobne neexistuje taky kontakt tak upravime input field
        console.log("pracoviskaReceived STATUS NOT OK: " + JSON.stringify(data));
    }
});

function schovajContainery() {
    // $("#tableContainer").attr("style", "display:none"); // zrusime display:none
    $("#kontaktDetail").attr("style", "display:none");
    $("#univerzitaInfo").attr("style", "display:none");
    $("#fakultaInfo").attr("style", "display:none");
    $("#pracoviskoInfo").attr("style", "display:none");
}

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

function getPracoviskoLink(idPracoviska) {
    console.log("getPracoviskoLink " + idPracoviska);
    var pracovisko;
    for (var i = 0; i < pracoviska.length; i++) {
        if (pracoviska[i].idPracoviska == idPracoviska) {
            pracovisko = pracoviska[i];
            break;
        }
    }
    return '<a onclick="pracoviskoClicked(' + pracovisko.idPracoviska + ')">' + pracovisko.nazov + '</a>';
}
function getUniverzitaLink(idUniverzity) {
    console.log("getUniverzitaLink " + idUniverzity);
    var univerzita;
    for (var i = 0; i < univerzity.length; i++) {
        if (univerzity[i].id == idUniverzity) {
            univerzita = univerzity[i];
            break;
        }
    }
    return '<a onclick="univerzitaClicked(' + univerzita.id + ')">' + univerzita.nazov + '</a>';
}
function getFakultaLink(idFakulty) {
    console.log("getFakultaLink " + idFakulty);
    var fakulta;
    for (var i = 0; i < fakulty.length; i++) {
        if (fakulty[i].id == idFakulty) {
            fakulta = fakulty[i];
            break;
        }
    }
    return '<a onclick="fakultaClicked(' + fakulta.id + ')">' + fakulta.nazov + '</a>';
}

function refreshKontaktDetail(kontakt) {
    var noveHistoricke = [];
    noveHistoricke.push(kontakt);
    for (var i = 0; i < historiaKontakty.length; i++) {
        noveHistoricke.push(historiaKontakty[i]);
    }
    historiaKontakty = noveHistoricke;
    document.getElementById('idID').innerHTML = '<span class="label label-success">ID</span>' + kontakt.id;
    document.getElementById('idUniverzita').innerHTML = '<span class="label label-success">Univerzita</span>' + getUniverzitaLink(kontakt.univerzita);
    document.getElementById('idFakulta').innerHTML = '<span class="label label-success">Fakulta</span>' + getFakultaLink(kontakt.fakulta);
    document.getElementById('idPracovisko').innerHTML = '<span class="label label-success">Pracovisko</span>' + getPracoviskoLink(kontakt.pracovisko);
    document.getElementById('idMeno').innerHTML = '<span class="label label-success">Meno</span>' + kontakt.meno;
    document.getElementById('idPriezvisko').innerHTML = '<span class="label label-success">Priezvisko</span>' + kontakt.priezvisko;
    document.getElementById('idEmail').innerHTML = '<span class="label label-success">Email</span>' + kontakt.email;
    document.getElementById('idTelefon').innerHTML = '<span class="label label-success">Telefon</span>' + kontakt.telefon;
    document.getElementById('idOsobna').innerHTML = '<span class="label label-success">Osobna prezentácia</span>' + kontakt.osobnaReprezentacia;
    refreshHistoriaKontakty(historiaKontakty);
}

function pracoviskoClicked(val) {
    console.log("pracoviskoClicked value: " + val);
    schovajContainery();
    $("#pracoviskoInfo").attr("style", "");
    var pracovisko;
    for (var i = 0; i < pracoviska.length; i++) {
        if (pracoviska[i].idPracoviska == val) {
            pracovisko = pracoviska[i];
            break;
        }
    }
    document.getElementById('pracoviskoID').innerHTML = '<span class="label label-success">ID</span>' + pracovisko.idPracoviska;
    document.getElementById('pracoviskoUniverzita').innerHTML = '<span class="label label-success">Univerzita</span>' + getUniverzitaLink(pracovisko.idUniverzity);
    document.getElementById('pracoviskoFakulta').innerHTML = '<span class="label label-success">Fakulta</span>' + getFakultaLink(pracovisko.idFakulty);
    document.getElementById('pracoviskoNazov').innerHTML = '<span class="label label-success">Nazov</span>' + pracovisko.nazov;
    document.getElementById('pracoviskoAdresa').innerHTML = '<span class="label label-success">Adresa</span>' + pracovisko.adresa;
    document.getElementById('pracoviskoGPS').innerHTML = '<span class="label label-success">GPS</span>' + pracovisko.gps;
}

function univerzitaClicked(val) {
    console.log("univerzitaClicked value: " + val);
    schovajContainery();
    $("#univerzitaInfo").attr("style", "");
    document.getElementById('zoznamFakult').innerHTML = '';
    for (var i = 0; i < fakulty.length; i++) {
        if (fakulty[i].idUniverzity == val) {
            document.getElementById('zoznamFakult').innerHTML += '<a onclick="fakultaClicked(' + fakulty[i].id + ')"' +
                ' class="list-group-item">' + fakulty[i].nazov + '</a>';
        }
    }
}

function fakultaClicked(val) {
    console.log("fakultaClicked value: " + val);
    schovajContainery();
    $("#fakultaInfo").attr("style", "");
    document.getElementById('zoznamPracovisk').innerHTML = '';
    for (var i = 0; i < pracoviska.length; i++) {
        if (pracoviska[i].idFakulty == val) {
            document.getElementById('zoznamPracovisk').innerHTML += '<a onclick="pracoviskoClicked(' + pracoviska[i].idPracoviska + ')"' +
                ' class="list-group-item">' + pracoviska[i].nazov + '</a>';
        }
    }
}

function topKontaktClicked(val) {
    console.log("topKontaktClicked value: " + val);
    schovajContainery();
    $("#kontaktDetail").attr("style", "");
    var kontakt = {};
    var najdeny = false;
    for (var i = 0; i < topKontakty.length; i++) {
        if (topKontakty[i].id == val) {
            kontakt = topKontakty[i];
            najdeny = true;
            break;
        }
    }
    if (!najdeny) {
        for (var i = 0; i < tableKontakty.length; i++) {
            if (tableKontakty[i].id == val) {
                kontakt = tableKontakty[i];
                najdeny = true;
                break;
            }
        }
    }
    if (!najdeny) {
        for (var i = 0; i < historiaKontakty.length; i++) {
            if (historiaKontakty[i].id == val) {
                kontakt = historiaKontakty[i];
                najdeny = true;
                break;
            }
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
        //var opt = document.createElement('dt');
        var a = document.createElement('a');
        a.setAttribute('onClick', "topKontaktClicked(" + kontakty[i].id + ")");
        a.setAttribute('class', "list-group-item");
        a.appendChild(document.createTextNode(kontakty[i].meno + " " + kontakty[i].priezvisko));
        data.appendChild(a);
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
        //var opt = document.createElement('dt');
        var a = document.createElement('a');
        a.setAttribute('onClick', "topKontaktClicked(" + kontakty[i].id + ")");
        a.setAttribute('class', "list-group-item");
        a.appendChild(document.createTextNode(kontakty[i].meno + " " + kontakty[i].priezvisko));
        data.appendChild(a);
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
    caption.appendChild(document.createTextNode('Nájdené kontakty:'));
    table.appendChild(caption);
    // head
    var head = document.createElement("thead");
    var tr = document.createElement('tr');
    //var th0 = document.createElement('th');
    //th0.appendChild(document.createTextNode('#'));
    var th1 = document.createElement('th');
    th1.appendChild(document.createTextNode('Meno'));
    var th2 = document.createElement('th');
    th2.appendChild(document.createTextNode('Pracovisko'));
    var th3 = document.createElement('th');
    th3.appendChild(document.createTextNode('Email'));
    var th4 = document.createElement('th');
    th4.appendChild(document.createTextNode('Telefon'));
    //tr.appendChild(th0);
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
        //var td0 = document.createElement('td');
        //td0.appendChild(document.createTextNode(i + '.'));
        var td1 = document.createElement('td');
        //td1.appendChild(document.createTextNode(polozkyTable[i].meno+" "+polozkyTable[i].priezvisko));
        var a = document.createElement('a');
        a.setAttribute('onClick', "topKontaktClicked(" + polozkyTable[i].id + ")");
        a.appendChild(document.createTextNode(polozkyTable[i].meno + " " + polozkyTable[i].priezvisko));
        td1.appendChild(a);
        var td2 = document.createElement('td');
        td2.innerHTML = getPracoviskoLink(polozkyTable[i].pracovisko);
        //td2.appendChild(getPracoviskoLink(polozkyTable[i].pracovisko));
        var td3 = document.createElement('td');
        td3.appendChild(document.createTextNode(polozkyTable[i].email));
        var td4 = document.createElement('td');
        td4.appendChild(document.createTextNode(polozkyTable[i].telefon));
        //tr.appendChild(td0);
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tbdy.appendChild(tr);
    }

    table.appendChild(tbdy);
    $("#tableContainer").attr("style", ""); // zrusime display:none
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
