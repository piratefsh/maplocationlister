
$(document).ready(function(){
    //Google Maps
    var APIkey = "AIzaSyBSPJm_l1q0JWgK6ZhJNzjwmQ4-pFJxkzc"
    // var kmlSrc = "http://cafehopkl.com/maplocationlister/js/chkl.kml"
    var kmlSrc = "js/chkl.kml"
    // var kmlSrc = "http://maps.google.com.my/maps/ms?ie=UTF8&authuser=0&msa=0&output=kml&msid=215254376920118074950.0004c7c0fe5b02177d447"
    
    var globalDoc

    var locationsListSelector = 'ul#locations'
    var divWithLocationsListSelector = 'div#locations-list'


    function initializeListScroller(){
        //Set plugin scrollbar
        $(divWithLocationsListSelector).height('400px').mCustomScrollbar({theme: 'dark-thick'})
    }

    // Callback to initialize GMaps with desired KML layer
    function initialize() {
        var mapOptions = {
          zoom: 10,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
  
        var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions)
        
        var kmlParser = new geoXML3.parser(
            {   map: map,
                singleInfoWindow: true,
                afterParse: listLocations
            })  

        kmlParser.parse(kmlSrc)

        return kmlParser
    }

    //Appends locations to list and set listeners for markers
    function listLocations(doc){
        globalDoc = doc

        //Assume only one doc for now
        //Assume placemarks and markers are synchronized (it is for geoxml3)
        var placemarks = doc[0].placemarks
        var markers = doc[0].markers


        //Sort placemarks and markers
        placemarks = placemarks.sort(function(a, b){
            return (a.name).localeCompare(b.name)
        })
        markers = markers.sort(function(a, b){
            return (a.title).localeCompare(b.title)
        })

        //Add location details to location ul
        var locationsList = $(locationsListSelector)
        for(var i = 0; i < placemarks.length; i++){
            //For each placemark, list title and description free of inline styling
            var placemark = placemarks[i]
            var marker = markers[i]

            var markerID = makeID(marker.title)
            // console.log("Marker: " + markerID)

            var m = marker

            //Set marker to highlight each li onclick
            google.maps.event.addListener(m, 'click', function(){
                var markerID = makeID(this.title)

                //Remove selector class from other li
                $('ul#locations li').removeClass('selected')

                //Add selector class to li
                $('li#' + markerID).addClass('selected')

            })

            //Remove inline styling from placemark description
            var cleanDescriptions = removeStyle($('<span class="loc-desc">' + placemark.description + '</span>'))
            //Create li element with title and description as contents
            $(locationsList).append(
                $('<li>').append($('<strong class="title">').attr('id', markerID).append(placemark.name)).append(cleanDescriptions).attr('id', markerID))
        }

        setLocationListOnlick()

        initializeListScroller()

    }

    //Formats text to be suitable for id use
    function makeID(text){
        return text.replace(/[,;\s()\&+,\.]/g, "")
    }

    //Removes inline styling, breaks and non-breaking spaces, and removes <font> tags
    function removeStyle(element){
        var descendents = $(element).find('*')
        descendents.add($(element))

        //Remove inline styles and dir attributes
        descendents.removeAttr('style').removeAttr('dir')
        
        //Remove all <br>
        $(element).find('br').replaceWith(null)

        //Remove all <font>
        $(element).find('font').replaceWith(replaceElementTagWithSpan)

        //Remove all &nbsp;
        return $(element)[0].outerHTML.replace("&nbsp;", "")
    }

    // Callback for replaceWith for fonts
    var replaceElementTagWithSpan =  function(){
        return $('<span>').append($(this).contents())
    }

    // Make each location <li> clickable to pop up corresponding marker info window
    function setLocationListOnlick(){
        $("ul#locations li").click(function(e){
            var markerTitle = $('.title', this).attr('id')
            var currMarker 
            //Find corresponding marker
            for(var i = 0; i < globalDoc[0].markers.length; i++){
                currMarker = globalDoc[0].markers[i]

                //Open info window for corresponding marker    
                if(makeID(currMarker.title) == markerTitle){
                    google.maps.event.trigger(currMarker, 'click')
                    break
                }
            }
            var addressSpanSelector = "span.loc-desc span.address"
            var addressSpan = $(addressSpanSelector, this)

            //if span for address doesn't already exist
            if(addressSpan == null || addressSpan.size() < 1){
                var newSpan = $("<span>").attr('class', 'address')
                $("span.loc-desc", this).prepend(newSpan)
                addressSpan = newSpan
            }

            getAddress(currMarker.getPosition(), addressSpan)
        })
    }

    //Use Geocoder to get address. takes in a LatLng object and JQuery object to append it to
    function getAddress(latlng, resultContainer) {
        var geocoder = new google.maps.Geocoder()
        var geocoderRequest = {
            location: latlng
        }

        geocoder.geocode(geocoderRequest, function(results, status){
            $(resultContainer).html("Address: " + results[0].formatted_address)

        })
    }

    google.maps.event.addDomListener(window, 'load', initialize);
})