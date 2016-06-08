// TODO:
// - nevie hladat bez diakritiky a malymi pismenami
//
var socket = io('http://localhost:3000');
//var socket = io('http://81.2.244.134');
var topKontakty = [];
var tableKontakty = [];
var historiaKontakty = [];
var univerzity = [];
var fakulty = [];
var pracoviska = [];
var cookieValue = "";
var nastavujem = false;

$(document).ready(function () {
    console.log("jquery ready");
    cookieValue = $('#cookie').text();
    console.log("cookie value: [" + cookieValue + "]");
    $('#hladatButton').click(function () {
        getKontaktyFromHladanePriezviskoInputText()
    });
    $('#hladanePriezviskoInputText').keyup(function (event) {
        console.log('keyup');
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
            if (!nastavujem) {
                socket.emit("najdiPriezviska", {
                    hladane: searchWord,
                    cookie: cookieValue
                });
            }
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
function nastavInputText(val) {
    nastavujem = true;
    document.getElementById("hladanePriezviskoInputText").value = val;
    nastavujem = false;
    //document.getElementById("hladanePriezviskoInputText").value += "";
}
socket.on("priezviskaReceived", function (data) {
    if (data.statusText === "OK") {
        $("#searchFormGroup").addClass("has-success");
        console.log('priezviskaReceived ziskane priezviska: ');//+ JSON.stringify(data.message));
        displayTooltip(data.message);
        nastavInputText(data.upravene);
    } else {
        if (data.showAlert == true) {
            alert(data.message);
        }
        //document.getElementById("hladanePriezviskoInputText").value = data.upravene;
        nastavInputText(data.upravene);
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
        //document.getElementById("hladanePriezviskoInputText").value = data.upravene;
        nastavInputText(data.upravene);
    } else {
        if (data.showAlert == true) {
            alert(data.message);
        }
        //document.getElementById("hladanePriezviskoInputText").value = data.upravene;
        nastavInputText(data.upravene);
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
// TATO METODA SA NEPOUZIVA SERVER NEMITUJE TENTO EVENT
// POUZIVA SA LEN NA ZVYSOVANIE NAVSTEVNOSTI
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
    return '<a onclick="pracoviskoClicked(' + pracovisko.idPracoviska + ')" href="#pracoviskoInfo">' + pracovisko.nazov + '</a>';
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
    document.getElementById('idID').innerHTML = '<span class="label label-success"style="margin-right: 10px;">ID</span>' + kontakt.id;
    document.getElementById('idUniverzita').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Univerzita</span>' + getUniverzitaLink(kontakt.univerzita);
    document.getElementById('idFakulta').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Fakulta</span>' + getFakultaLink(kontakt.fakulta);
    document.getElementById('idPracovisko').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Pracovisko</span>' + getPracoviskoLink(kontakt.pracovisko);
    document.getElementById('idMeno').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Meno</span>' + kontakt.meno;
    document.getElementById('idPriezvisko').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Priezvisko</span>' + kontakt.priezvisko;
    document.getElementById('idEmail').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Email</span>' + kontakt.email;
    document.getElementById('idTelefon').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Telefon</span>' + kontakt.telefon;
    document.getElementById('idOsobna').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Osobna prezentácia</span>' + kontakt.osobnaReprezentacia;
    document.getElementById('zamestnanecHeader').innerHTML = getPrveTituly(kontakt.tituly) + ' ' + kontakt.meno + ' ' + kontakt.priezvisko + ' ' + getPosledneTituly(kontakt.tituly);
    refreshHistoriaKontakty(historiaKontakty);
}

function getPrveTituly(tituly) {
    var tits = 'Bc._doc._Doc._Ing._JUDr._Mgr._mim.prof._MUDr._MVDr._PaedDr._PhDr._RNDr._Dr._Dr.h.c._prof._JCLic._MDDr._PD.Dr.phil.habil._PharmDr._ThDr.';
    var split1 = tits.split('_');
    console.log("tits split: " + split1);
    var titulySplit = tituly[0].trim().replace(',', '').split(' ');
    console.log("kontakt tituly split: " + titulySplit);
    var vysledok = '';
    for (var i = 0; i < titulySplit.length; i++) {
        var titul = titulySplit[i];
        for (var j = 0; j < split1.length; j++) {
            if (titul == split1[j]) {
                vysledok += split1[j] + ' ';
                break;
            }
        }
    }
    return vysledok;
}

function getPosledneTituly(tituly) {
    var tits = 'CSc._PhD._Ph.D_LL.M._MPH_DrSc._Phd._Dr. rer. nat._MBA';
    var split1 = tits.split('_');
    console.log("tits split: " + split1);
    var titulySplit = tituly[0].trim().replace(',', '').split(' ');
    console.log("kontakt tituly split: " + titulySplit);
    var vysledok = '';
    for (var i = 0; i < titulySplit.length; i++) {
        var titul = titulySplit[i];
        for (var j = 0; j < split1.length; j++) {
            if (titul == split1[j]) {
                vysledok += split1[j] + ' ';
                break;
            }
        }
    }
    if (tituly.indexOf('Dr. rer. nat.') > -1) {
        vysledok += ' Dr. rer. nat.';
    }
    return vysledok;
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
    document.getElementById('pracoviskoHeader').innerHTML = pracovisko.nazov;
    switch (pracovisko.idFakulty) {
        case 1:
            $("#pracoviskoImg").attr("src", "Logo__PF_UPJS_farebne.png");
            $("#pracoviskoFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=prirodovedecka+upjs");
            break;
        case 2:
            $("#pracoviskoImg").attr("src", "Logo-LF-UPJS-farebne.png");
            $("#pracoviskoFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=lekarska+fakulta+upjs");
            break;
        case 3:
            $("#pracoviskoImg").attr("src", "logo-ff-upjs-f.jpg");
            $("#pracoviskoFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=filozoficka+upjs");
            break;
        case 4:
            $("#pracoviskoImg").attr("src", "logo-pravf-upjs-f.jpg");
            $("#pracoviskoFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=pravnicka+upjs");
            break;
        case 5:
            $("#pracoviskoImg").attr("src", "logo_upjs.jpg");
            $("#pracoviskoFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=verejnej+spravy+upjs");
            break;
        case 6:
            $("#pracoviskoImg").attr("src", "logo_UPJS_mobil.png");
            $("#pracoviskoFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=rektorat+upjs");
            break;
        default:
            $("#pracoviskoImg").attr("src", "logo_UPJS_mobil.png");
            $("#pracoviskoFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=rektorat+upjs");
            break;
    }
    document.getElementById('pracoviskoID').innerHTML = '<span class="label label-success"style="margin-right: 10px;">ID</span>' + pracovisko.idPracoviska;
    document.getElementById('pracoviskoUniverzita').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Univerzita</span>' + getUniverzitaLink(pracovisko.idUniverzity);
    document.getElementById('pracoviskoFakulta').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Fakulta</span>' + getFakultaLink(pracovisko.idFakulty);
    document.getElementById('pracoviskoNazov').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Nazov</span>' + pracovisko.nazov;
    document.getElementById('pracoviskoAdresa').innerHTML = '<span class="label label-success"style="margin-right: 10px;">Adresa</span>' + pracovisko.adresa;

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
    switch (val) {
        case 1:
            $("#fakultaImg").attr("src", "Logo__PF_UPJS_farebne.png");
            document.getElementById('fakultaInfoTitle').innerHTML = fakulty[0].nazov;
            document.getElementById('fakultaHtmlInfo').innerHTML = fakultyHtml[0];
            $("#fakultaFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=prirodovedecka+upjs");
            break;
        case 2:
            $("#fakultaImg").attr("src", "Logo-LF-UPJS-farebne.png");
            document.getElementById('fakultaHtmlInfo').innerHTML = fakultyHtml[1];
            document.getElementById('fakultaInfoTitle').innerHTML = fakulty[1].nazov;
            $("#fakultaFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=lekarska+fakulta+upjs");
            break;
        case 3:
            $("#fakultaImg").attr("src", "logo-ff-upjs-f.jpg");
            document.getElementById('fakultaInfoTitle').innerHTML = fakulty[2].nazov;
            document.getElementById('fakultaHtmlInfo').innerHTML = fakultyHtml[2];
            $("#fakultaFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=filozoficka+upjs");
            break;
        case 4:
            $("#fakultaImg").attr("src", "logo-pravf-upjs-f.jpg");
            document.getElementById('fakultaInfoTitle').innerHTML = fakulty[3].nazov;
            document.getElementById('fakultaHtmlInfo').innerHTML = fakultyHtml[3];
            $("#fakultaFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=pravnicka+upjs");
            break;
        case 5:
            $("#fakultaImg").attr("src", "logo_upjs.jpg");
            document.getElementById('fakultaInfoTitle').innerHTML = fakulty[4].nazov;
            document.getElementById('fakultaHtmlInfo').innerHTML = fakultyHtml[4];
            $("#fakultaFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=verejnej+spravy+upjs");
            break;
        case 6:
            $("#fakultaImg").attr("src", "logo_UPJS_mobil.png");
            document.getElementById('fakultaInfoTitle').innerHTML = 'Univerzita Pavla Jozefa Šafárika v Košiciach';
            document.getElementById('fakultaHtmlInfo').innerHTML = fakultyHtml[5];
            $("#fakultaFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=rektorat+upjs");
            break;
        default:
            $("#fakultaImg").attr("src", "logo_UPJS_mobil.png");
            document.getElementById('fakultaInfoTitle').innerHTML = 'Univerzita Pavla Jozefa Šafárika v Košiciach';
            document.getElementById('fakultaHtmlInfo').innerHTML = fakultyHtml[5];
            $("#fakultaFrame").attr("src", "https://www.google.com/maps/embed/v1/place?key=AIzaSyAXVBlkoqH_sDXljxh3dFcWW3it6k3lbPA&q=rektorat+upjs");
            break;
    }
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
    //socket.emit("getPoslednaHistoria", {cookie: cookieValue});
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
    if (searchWord.length > 2) {
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
    //var caption = document.createElement("caption");
    //caption.appendChild(document.createTextNode('Nájdené kontakty:'));
    //table.appendChild(caption);
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
        a.setAttribute('href', "#kontaktDetail");
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
var fakultyHtml = [];
fakultyHtml.push('<strong>Adresa:</strong><br>Šrobárova 2<br>041&nbsp;54 Košice<br>Slovenská republika<p><span style="font-size: 12px">Fax: (+421 55) 62 221 24</span></p><p><a href="http://www.upjs.sk/prirodovedecka-fakulta/fakulta/sekretariat/"><span style="color: rgb(51,153,102)"><strong>Sekretariát dekana:</strong></span></a><br><span style="font-size: 12px">Telefón: (+421 55) 234 2181<br>e-mail: <a href="mailto:pfsekret@upjs.sk">pfsekret@upjs.sk</a></span></p><p><a href="http://www.upjs.sk/prirodovedecka-fakulta/studium/so/"><span style="color: rgb(51,153,102)"><strong><span>Študijné oddelenie</span></strong></span></a></p><h5><strong>►&nbsp;</strong><span style="color: rgb(51,153,102)"><a href="http://www.upjs.sk/prirodovedecka-fakulta/fakulta/6056/">Kde nás nájdete</a></span></h5><h5>►&nbsp;<a target="_blank" href="MAPKA_MHD.pdf">Mapa MHD 1</a>&nbsp;&nbsp; ► <a target="_blank"href="http://www.cassovia.sk/dpmk/trace/">Mapa MHD 2</a></h5><p>&nbsp;<small><a href="mailto:webmaster@science.upjs.sk"><font size="1">webmaster@science.upjs.sk</font></a></small></p>');
fakultyHtml.push('<strong>Adresa:</strong><br>Trieda SNP 1<br>040&nbsp;11 Košice<br>Slovenská republika<p><strong style="font-weight:bold"><br>Dekanát:</strong><br>Telefón/Fax: (+421 55) 642 81 51<br>e-mail: <a href="mailto:tajomnik@lf.upjs.sk">tajomnik@lf.upjs.sk</a><br><br><strong style="font-weight:bold">Študijné oddelenie:</strong><br>e-mail: <a href="mailto:studijne@lf.upjs.sk">studijne@lf.upjs.sk</a><br/><br/><span style="font-weight: bold">PR manažér:</span><br/>Telefón: (+421 55) 234 3220<br/>Mobil: 0905 344 299<br/>e-mail: <a href="mailto:jaroslava.oravcova@upjs.sk">jaroslava.oravcova@upjs.sk</a></p>');
fakultyHtml.push('<strong>Adresa:</strong><br>Šrobárova 2<br>040&nbsp;59 Košice<br>Slovenská republika<p><strong><a target="_blank" href="http://www.upjs.sk/filozoficka-fakulta/dekanat/sekretariat/"><font color="#f1a400">Sekretariát dekana</font></a></strong><br>Telefón: (+421&nbsp;55) 234&nbsp;7142<br>e-mail: <a href="mailto:ffupjs@upjs.sk"><font color="#f1a400">ffupjs@upjs.sk</font></a><br><br><a target="_blank" href="http://www.upjs.sk/filozoficka-fakulta/info-pre-studentov/studijne-oddelenie/"><strong><font color="#f1a400">Študijné oddelenie</font></strong></a><br>e-mail:&nbsp;<a href="mailto:studijneff@upjs.sk"><font color="#f1a400">studijneff@upjs.sk</font></a><br><br><a target="_blank" href="http://www.upjs.sk/public/media/7315/planFF-moyzesova9-petzvalova-2013.pdf"><strong><font color="#f1a400">Plán budov FF</font></strong></a></p><p><span style="font-size:10px;"><a href="mailto:webmasterff@upjs.sk">webmasterff@upjs.sk</a></span></p>');
fakultyHtml.push('<strong>Adresa:</strong><br>Kováčska 26<br>P.O.BOX A-45<br>040 75 Košice<br>Slovenská republika<br><br><span style="font-weight: bold;">Sekretariát dekana:</span></p><table width="230" cellspacing="1" cellpadding="1" border="0" height="70"><tbody><tr><td>Telefón:</td><td>(+421 55) 6227104</td></tr><tr><td>&nbsp;</td><td>(+421 55) 2344101</td></tr><tr><td>Fax:</td><td>(+421 55) 6225365</td></tr></tbody></table><p>e-mail: <a href="mailto:maria.stierankova@upjs.sk">maria.stierankova@upjs.sk</a><br><br><strong>Informátor:</strong><br>Kováčska 26: (+421 55) 2344111<br>Kováčska 30: (+421 55) 2344100<br><strong><a href="http://voip.upjs.sk/?find=4&amp;amp;dt_order=last_name">Informácie o ostatných tel. číslach</a></strong></p><p><strong><a href="mailto:web_master@pravo.upjs.sk?subject=Web_stranka_PravF">webmaster</a></strong></p>');
fakultyHtml.push('<strong>Adresa:</strong><br>Popradská 66<br>P.O. BOX C-2<br>04132 Košice 1&nbsp;<p><br><strong>Dekanát:</strong><br>Telefón: +421 55 788 36 11<br>e-mail: sekrfvs@upjs.sk</p><p>&nbsp;</p><p><span style="font-size: x-small"><strong><font color="#0084cb"><img style="width: 50px; height: 50px" src="http://www.upjs.sk/public/media/0090/FVS_QRcode.jpg" alt=""></font></strong></span></p><p><span style="color:#3399cc;"><strong><a href="http://www.upjs.sk/fakulta-verejnej-spravy/fakulta/kontakty/ako-sa-k-nam-dostanete/">Ako&nbsp;sa k nám&nbsp;dostanete ...</a></strong></span></p>');
fakultyHtml.push('<strong>Adresa:</strong><br>Šrobárova 2<br>041 80 Košice<br>Slovenská republika<table><tbody><tr><td style="vertical-align: top;">Telefón:</td><td>+421(0)55 /&nbsp;234 1100<br>+421(0)55 / 62&nbsp;226 08</td></tr><tr><td valign="top">Fax:</td><td>+421(0)55 / 678 69 59<br>+421(0)55 / 622 81 09</td></tr><tr><td valign="top">e-mail:</td><td><a href="mailto:rektor@upjs.sk">rektor@upjs.sk</a></td></tr><tr><td valign="top" colspan="2">&nbsp;</td></tr><tr><td valign="top" colspan="2">Mgr. Mária Hrehová, PhD.<br>Tlačový referent a hovorca<br>e-mail: <a href="mailto:maria.hrehova@upjs.sk">maria.hrehova@upjs.sk</a><br>Tel.: +421 55 234 1112<br>Mob.: 0905 385 911<br>&nbsp;</td></tr></tbody></table><p><span style="font-size:10px;"><a href="mailto:webmaster@upjs.sk">webmaster@upjs.sk</a></span></p>');

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
