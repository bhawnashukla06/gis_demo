import { Component, OnInit } from '@angular/core';
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

    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

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

    // Add the layers to the drawnItems feature group 
    for (let layer of polyLayers) {
      drawnItems.addLayer(layer);
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
        featureGroup: drawnItems,
        remove: false
      }
    });
    map.addControl(drawControl);

    map.on('draw:created', function (e: { layerType: any; layer: any; }) {
      var type = e.layerType,
        layer = e.layer;

      if (type === 'marker') {
        layer.bindPopup('A popup!');
      }

      drawnItems.addLayer(layer);
    });

    map.on('draw:edited', function (e: { layers: any; }) {
      var layers = e.layers;
      var countOfEditedLayers = 0;
      layers.eachLayer(function () {
        countOfEditedLayers++;
      });
      console.log("Edited " + countOfEditedLayers + " layers");
    });

  }

  public changeLayer(layerName: string): void {
    if (this.layers[layerName]) {
      this.map.removeLayer(this.layers[layerName]);
      delete this.layers[layerName];
      return;
    }
    this.layers[layerName] = L.tileLayer.wms("http://localhost:8080/geoserver/ne/wms?", {
      layers: 'ne_10m_roads',
      format: 'image/png',
      version: '1.3.0',
      styles: OVERLAY_LIST[layerName],
      transparent: 'true'
    }).addTo(this.map);
    return;
  }
}
