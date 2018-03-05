window.onload = init;

var address;
var routeList;
var waypoints = [];
var addresses = [];

var map;
var geocoder;
var newBound;
var directionsService;
var directionsDisplay;
var placesService;


function init() {
    let centerpos = new google.maps.LatLng(54.312486, 59.380464);
    let optionsGmaps = {
        center: centerpos,
        navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoom: 15
    }
    map = new google.maps.Map(document.getElementById('map'), optionsGmaps);
    placesService = new google.maps.places.PlacesService(map);
    geocoder = new google.maps.Geocoder();
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();


    //добавляет обработчик событий для directionsDisplay
    directionChange();

    // область поиска адресов на карте
    let swLatLng = new google.maps.LatLng(54.2743250, 59.3640530);
    let neLatLng = new google.maps.LatLng(54.3367680, 59.4715199);
    newBound = new google.maps.LatLngBounds(swLatLng, neLatLng);

    routeList = document.getElementById('routeList');
    routeList.style.cursor = 'pointer';
    address = document.getElementById('address');
    address.addEventListener('keydown', function (evt) {
        if (evt.code == 'Enter') {
            findLocation();
        }
    });
}

/*Определяет координаты места по введенному адресу. 
Затем добавляет адрес и координаты в соответствующие массивы и 
вызывает функцию createRoute() для построения маршрута*/

function findLocation() {
    if (address.value == '') {
        window.alert('Введите адрес');
    } else {
        geocoder.geocode({
            address: address.value,
            bounds: newBound
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                waypoints.push({
                    location: {
                        placeId: results[0].place_id
                    }
                });
                addresses.push(address.value);
                addItem();
                createRoute();
            } else {
                window.alert('Адрес не найден');
                address.value = "";
            }
        });
    }
}

/**Создает список из элементов */

//Добавляет новый элемент в список
function addItem() {
    let item = createListItem();
    routeList.appendChild(item);
    listDragDrop();
    address.value = "";
}

//создает кнопку для удаления элемента из списка и из карты
function createButton(item) {
    let btn = document.createElement('button');
    btn.style.height = "20px";
    btn.style.width = "20px";
    btn.style.backgroundImage = "url('kapat.png')";
    btn.parentNode = item;
    btn.addEventListener('click', function () {
        var deletedItem = this.parentNode.textContent;
        var i = addresses.indexOf(deletedItem); addresses.splice(i, 1);
        waypoints.splice(i, 1);
        routeList.removeChild(item);
        directionsDisplay.setMap(null);
        createRoute();
    });
    return btn;
}

//создает элемент списка с кнопкой
function createListItem() {
    let item = document.createElement('li');
    item.textContent = address.value;
    item.style.fontSize = '20px';
    let btn = createButton(item);
    item.appendChild(btn);
    return item;
}

// меняет местами элементы в списке и перерисовывает карту 
function listDragDrop() {
    let selected = null;
    let newPosition;
    let itemPosition;
    let elemTop;
    routeList.addEventListener('mousedown', function (evt) {
        selected = evt.target;
        itemPosition = addresses.indexOf(selected.textContent);
    });
    routeList.addEventListener('mouseup', function (evt) {
        selected = null;
    })
    routeList.addEventListener('mousemove', function (evt) {
        if (selected !== null) {
            newPosition = evt.clientY;
            elemTop = selected.offsetTop;
            let distance = newPosition - elemTop;
            let firstPosition;

            if (distance > 23) {
                routeList.insertBefore(selected, routeList.children[itemPosition + 2]);
                firstPosition = itemPosition;
                itemPosition++;
                addresses = changeArray(addresses, firstPosition, itemPosition);
                waypoints = changeArray(waypoints, firstPosition, itemPosition);
                createRoute();
            }
            else if (distance < 0) {
                routeList.insertBefore(selected, routeList.children[itemPosition - 1]);
                firstPosition = itemPosition;
                itemPosition--;
                addresses = changeArray(addresses, firstPosition, itemPosition);
                waypoints = changeArray(waypoints, firstPosition, itemPosition);
                createRoute();
            }
        }
    });
}

//меняет местами элементы массивов
function changeArray(arr, first, second) {
    let begin = arr[first];
    let end = arr[second];
    arr[first] = end;
    arr[second] = begin;
    return arr;
}

/**Создает маршрут из координат в массиве waypoints*/

function createRoute() {
    directionsService.route({
        origin: waypoints[0].location,
        waypoints: waypoints.slice(1, waypoints.length - 1),
        destination: waypoints[waypoints.length - 1].location,
        travelMode: google.maps.TravelMode.WALKING
    }, function (response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setOptions({
                map: map,
                directions: response,
                draggable: true,
                polylineOptions: {
                    strokeColor: 'green'
                }
            });
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

//перерисовывает маршрут и меняет список
function directionChange() {
    directionsDisplay.addListener('directions_changed', function () {
        let newDirections = directionsDisplay.getDirections();
        let newAddresses = [];
        let newWaypoints = [];
        if (waypoints.length > 1) {
            for (let i = 0; i < newDirections.geocoded_waypoints.length; i++) {
                let newPlaceId = newDirections.geocoded_waypoints[i].place_id;
                newWaypoints.push({
                    location: {
                        placeId: newPlaceId
                    }
                });
                setTimeout(function () {
                    placesService.getDetails({
                        placeId: newPlaceId
                    }, function (results, status) {
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            let n = results.address_components;
                            newAddresses.push(results.name);
                            addresses = newAddresses;
                            waypoints = newWaypoints;
                            createNewRouteList();
                        }
                        else {
                            window.alert('Places request failed due to ' + status);
                        }
                    });
                }, i * 500);
            }
        }
    })
}


//создает новый список при изменении маршрута на карте
function createNewRouteList() {
    routeList.innerHTML = '';
    for (let i = 0; i < addresses.length; i++) {
        let item = document.createElement('li');
        item.textContent = addresses[i];
        item.style.fontSize = '20px';
        let btn = createButton(item);
        item.appendChild(btn);
        routeList.appendChild(item);
    }
}







