import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { OVERLAY_LIST } from './app.constant';

declare var L: any
declare var Control: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  layers: any = {};
  map: any;
  drawnItems: any;

  ngOnInit(): void {

    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    var map = L.map('map', {
      center: [39.73, -104.99],
      zoom: 3,
      layers: [osm]
    });
    this.map = map

    this.drawnItems = new L.FeatureGroup();
    map.addLayer(this.drawnItems);

    var polyLayers = [];

    var polygon1 = L.polygon([
      [51.509, -0.08],
      [51.503, -0.06],
      [51.51, -0.047]
    ]);
    polyLayers.push(polygon1)

    var polygon2 = L.polygon([
      [51.512642, -0.099993],
      [51.520387, -0.087633],
      [51.509116, -0.082483]
    ]);
    polyLayers.push(polygon2)
    console.log(polyLayers);

    // Add the layers to the drawnItems feature group 
    for (let layer of polyLayers) {
      this.drawnItems.addLayer(layer);
    }


    // Set the title to show on the polygon button
    L.drawLocal.draw.toolbar.buttons.polygon = 'Draw a polygon!';

    var drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polyline: {
          metric: true
        },
        polygon: {
          allowIntersection: false,
          showArea: true,
          drawError: {
            color: '#b00b00',
            timeout: 1000
          },
          shapeOptions: {
            color: '#bada55'
          }
        },
        circle: {
          shapeOptions: {
            color: '#662d91'
          }
        },
        marker: false
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: false
      }
    });
    map.addControl(drawControl);

    map.on('draw:created', (e: { layerType: any; layer: any; }) => {
      var type = e.layerType,
        layer = e.layer;
      // console.log(layer)
      if (type === 'marker') {
        layer.bindPopup('A popup!');
      }

      this.drawnItems.addLayer(layer);
    });

    map.on('draw:edited',  (e: { layers: any; }) => {
      console.log(this.drawnItems)
      
      Object.keys(this.layers).forEach((layerName: string) => {
        // this.changeLayer(layerName);
        this.map.removeLayer(this.layers[layerName]);
        this.layers[layerName] = null;
      })

      const coords: any[] = [];
      e.layers.eachLayer( (l: any) => {
        const changeedCoords = l._latlngs.map((_l: any) => _l.map((__l: any) => [__l.lng, __l.lat]));
        coords.push({
          featureID: l.feature.id,
          coordinates: changeedCoords
        });
        this.drawnItems.removeLayer(l);
      });

      console.log(coords);

        var settings = {
          "url": `http://localhost:4044/updateGeom?workspace=ne&datasetNme=ne_10m_roads`,
          "method": "POST",
          "timeout": 0,
          "data": JSON.stringify({
            "changedFeature": coords
          }),
          "headers": {
            "Content-Type": "application/json"
          }
        };
        $.ajax(settings).done( response => {
          Object.keys(this.layers).forEach((layerName: string) => {
            this.changeLayer(layerName);
          })
          
        });

      // console.log("Edited " + countOfEditedLayers + " layers");
    });

  }

  public changeLayer(layerName: string): void {
    console.log(layerName)
    if (this.layers[layerName]) {
      this.map.removeLayer(this.layers[layerName]);
      delete this.layers[layerName];
      return;
    }
    this.layers[layerName] = L.tileLayer.wms("http://localhost:8080/geoserver/ne/wms?", {
      layers: 'ne_10m_roads',
      format: 'image/png',
      version: '1.1.1',
      styles: OVERLAY_LIST[layerName],
      transparent: 'true',
      random: Date.now()
    }).addTo(this.map);
    var that_map = this.map
    var layername = this.layers[layerName] 
    var selectedPolygonId = -1;
    var ms_url="http://localhost:8080/geoserver/ne/wms?";
    this.map.addEventListener('click', Identify.bind(this));
    function Identify(this: any, e: { layerPoint: any; latlng: any; }) 
    {
      // console.log(that_map)
       // set parameters needed for GetFeatureInfo WMS request
       var BBOX = that_map.getBounds().toBBoxString();
       var WIDTH = that_map.getSize().x;
       var HEIGHT = that_map.getSize().y;
       var X = parseInt(that_map.layerPointToContainerPoint(e.layerPoint).x);
       var Y = parseInt(that_map.layerPointToContainerPoint(e.layerPoint).y);
       // compose the URL for the request
       var URL = ms_url + 'SERVICE=WMS&VERSION=1.1.0&REQUEST=GetFeatureInfo&LAYERS=ne:ne_10m_roads&QUERY_LAYERS=ne:ne_10m_roads&BBOX='+BBOX+'&FEATURE_COUNT=1&HEIGHT='+HEIGHT+'&WIDTH='+WIDTH+'&INFO_FORMAT=application/json&SRS=EPSG%3A4326&X='+X+'&Y='+Y + '&random=' + Math.random();
  
  
       //send the asynchronous HTTP request using jQuery $.ajax
       $.ajax({
         url: URL,
         dataType: "html",
         type: "GET",
         success: (data: any) => {
          var popup_data
          data = JSON.parse(data)
          // console.log(data)
         
          if(data.numberReturned==0){
            popup_data = 'No data found'
          }
          else{
          //   L.geoJSON(data).addTo(that_map)
          //   var drawControl = new L.Control.Draw({
          //     edit: {
          //         featureGroup: data
          //     }
          // });
          // that_map.addControl(drawControl);
          // var layer = L.GeoJSON.geometryToLayer(data);
          // console.log(layer._layers);
          
          // layer.addTo(that_map);
          // this.drawnItems.addLayer(layer);
          
          L.geoJson(data, {
            onEachFeature: (_feature: any, layer: any) => {
              this.drawnItems.addLayer(layer);
            }
          });
      
      
          // function onEachFeature(feature, layer) {
          //   drawnItems.addLayer(layer);
          // }

          // layer.enableEdit();
          // layer.getLayers().forEach((l: { enableEdit: () => any; }) => l.enableEdit())


            popup_data = JSON.stringify(data.features[0].properties)
            
            
          }
           var popup = new L.Popup
          ({
             maxWidth: 300
           });
   
          popup.setContent(popup_data);
           popup.setLatLng(e.latlng);
           that_map.openPopup(popup);
         }
       });
      }
// this.map.on('click', function(e: { latlng: any; }) {
  // console.log(layername)
    // The 'wmsLayer' variable contains the reference to the WMS layer already loaded on the map, from which it is possible to make the subsequent call to 'GetFeatureInfo'
    // layername.getFeatureInfo({
    //     latlng: e.latlng,
    //     done: function(featureCollection: { features: string | any[]; }) {
    //       console.log('getFeatureInfosucceed: ', featureCollection);
    //     },
    //     fail: function(errorThrown: any) {
    //       console.log('getFeatureInfo failed: ', errorThrown);
    //     },
    //     always: function() {
    //         console.log('getFeatureInfo finished');
    //     }
    //     });
      // });
            
            // Check for previous selected polygon layer and possibly remove it
//             if (selectedPolygonId > -1)    {
//                 this.map.removeLayer(this.map._layers[selectedPolygonId]);
//                 selectedPolygonId = -1;
//             }

//             // Create the newly selected polygon layer using WFS
//             if (featureCollection.features.length > 0) {
//                 let selectedPolygon = L.Geoserver.wfs("http://localhost:8080/geoserver/wfs", {
//                     layers: "ne:ne_10m_roads",
//                     CQL_FILTER: `ID='${featureCollection.features[0].properties.ID}'`,
//                     style: OVERLAY_LIST[layerName],
//                     fitLayer: false,
//                 });

//                 selectedPolygonId = L.stamp(selectedPolygon);
//                 selectedPolygon.addTo(this.map);
//             }

//             // Info popup
//             let content = getMyData(); // HTML content with geometry related attributes values already formatted
//             L.popup({ maxWidth: 800})
//                 .setLatLng(e.latlng)
//                 .setContent(content)
//                 .openOn(this.map);
//         },
//         fail: function(errorThrown: any) {
//             console.log('getFeatureInfo failed: ', errorThrown);
//         },
//         always: function() {
//             console.log('getFeatureInfo finished');
//         }
    // });
// });
    return;
  }





  
}


