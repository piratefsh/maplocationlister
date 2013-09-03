
$(document).ready(function(){
    //Google Maps
    var APIkey = "AIzaSyBSPJm_l1q0JWgK6ZhJNzjwmQ4-pFJxkzc"
    var kmlSrc = "js/chkl.kml"
    // var kmlSrc = "http://maps.google.com.my/maps/ms?ie=UTF8&authuser=0&msa=0&output=kml&msid=215254376920118074950.0004c7c0fe5b02177d447"
    
    var globalDoc

    // Callback to initialize GMaps with desired KML layer
    function initialize() {
        var mapOptions = {
          zoom: 1,
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

    //Appends locations to list
    function listLocations(doc){
        globalDoc = doc

        console.log(globalDoc)
        //Assume only one doc for now
        var placemarks = doc[0].placemarks

        var locationsList = $('ul#locations')
        for(var i = 0; i < placemarks.length; i++){
            //For each placemark, list title and description free of inline styling
            var placemark = placemarks[i]
            var cleanDescriptions = removeStyle($('<span class="loc-desc">' + placemark.description + '</span>'))
            $(locationsList).append(
                $('<li>').append($('<strong class="title">').append(placemark.name)).append(cleanDescriptions))
        }

        setLocationListOnlick()
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
            var markerTitle = $('.title', $(this)).html()

            console.log("Finding marker for: " + markerTitle)

            //Find corresponding marker
            for(var i = 0; i < globalDoc[0].markers.length; i++){
                var currMarker = globalDoc[0].markers[i]

                //Open info window for corresponding marker    
                if(currMarker.title == markerTitle){
                    google.maps.event.trigger(currMarker, 'click')
                }
            }
        })
    }

    google.maps.event.addDomListener(window, 'load', initialize);
})