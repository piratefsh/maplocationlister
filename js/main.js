
$(document).ready(function(){
    //################################################ GLOBAL VARS ###################################################
    var globalDoc   //Doc returned by geoXML parser with kml JSON. Check documentation for details.
    var gmap        //Google Map in use


    //################################################ INITIALIZERS ###################################################
    function initializeListScroller(){
        //Set plugin scrollbar
        $(divWithLocationsListSelector).height('400px').mCustomScrollbar({theme: 'dark-thick'})
    }

    // Callback to initialize GMaps with geoXML3
    function initialize() {
        var mapOptions = {
          zoom: 10,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
  
        gmap = new google.maps.Map(document.getElementById("map-canvas"), mapOptions)
        
        var kmlParser = new geoXML3.parser(
            {   map: gmap,
                singleInfoWindow: true,
                afterParse: listLocations
            })  

        kmlParser.parse(kmlSrc)

        return kmlParser
    }

    //Append locations to list from geoXML3 doc and set listeners for markers
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

             //Remove inline styling from placemark description
            var cleanDescriptions = removeStyle($('<span class="loc-desc">' + placemark.description + '</span>'))
            //Create li element with title and description as contents
            
            var liElement = $('<li>').append($('<strong class="title">').attr('id', markerID).append(placemark.name)).append(cleanDescriptions).attr('id', markerID)
            $(locationsList).append(liElement)


            var m = marker

            //Set marker listener to highlight each li onclick
            google.maps.event.addListener(m, 'click', function(){
                var markerID = makeID(this.title)

                //Remove selector class from other li
                var allLis = $('ul#locations li')
                allLis.removeClass('selected')

                //Add selector class to li
                var thisLi = $('li#' + markerID)
                thisLi.addClass('selected')

                //Collapse all other location desc and only show desc for current li
                collapseLocationListDesc()
                showDetails(thisLi, this)

                //Zoom to location and center it
                //have to set center first, for first time click otherwise it'll zoom in some random position even though getPosition() returns 
                //correct latlng values. Some bug.
                gmap.setCenter(this.getPosition())
                gmap.setZoom(15)
                gmap.setCenter(this.getPosition())

                //Scroll to selected position
                $(divWithLocationsListSelector).mCustomScrollbar("scrollTo", "li#" + markerID)

            })
        }

        //Other locations list initializers
        setLocationListOnlick()
        initializeListScroller()
        collapseLocationListDesc()
    }


    //####################################### MARKER/LOCATION LI ONLCLICK FUNCTIONS //#######################################

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

    //Show location descriptions for location li
    function showDetails(obj, marker){
        getAndInsertAddress(obj, marker)
        var animationTime = 300
        var spanToShow = $("span.loc-desc", obj)

        if(spanToShow.css("display").trim() == "none"){
            spanToShow.show(animationTime, "linear")
        }

    }

    //Get address and insert it to obj
    function getAndInsertAddress(obj, marker){
        var addressSpanSelector = "span.loc-desc span.address"
        var addressSpan = $(addressSpanSelector, $(obj))

        //if span for address doesn't already exist
        if(addressSpan == null || addressSpan.size() < 1){
            var newSpan = $("<span>").attr('class', 'address')
            $("span.loc-desc", $(obj)).prepend(newSpan)
            addressSpan = newSpan
        }
        //if address isn't already there
        if(addressSpan.html() == ""){
            getAddress(marker.getPosition(), addressSpan)
        }
    }

    //Collapse all location descriptions for location li
    function collapseLocationListDesc(){
        $('span.loc-desc', $(locationsListSelector)).hide()
    }


    //################################################ FORMATTING FUNCTIONS ###############################################
    
    //Formats text to be suitable for id use
    function makeID(text){
        //removes funky symbols so ids are only alphanumeric
        return text.replace(/[\W]/g, "")
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


    //###################################################### RUN CODE #####################################################
    google.maps.event.addDomListener(window, 'load', initialize);
}