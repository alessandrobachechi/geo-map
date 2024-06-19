import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../utils/supabaseClient";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { Icon, divIcon, point } from "leaflet";
import Logout from "./Logout"; // Import the Logout component

const customIcon = new Icon({
  iconUrl: "icons8-pin-mappa-48.png",
  iconSize: [55, 55],
});

const createClusterCustomIcon = function (cluster) {
  return new divIcon({
    html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
    className: "custom-marker-cluster",
    iconSize: point(33, 33, true),
  });
};

const userLocationIcon = new Icon({
  iconUrl: "icons8-puntina-100.png",
  iconSize: [45, 45],
});

function DisableMapInteraction() {
  const map = useMap();

  useEffect(() => {
    const disableInteractions = () => {
      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    };

    const enableInteractions = () => {
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    };

    map.on("popupopen", disableInteractions);
    map.on("popupclose", enableInteractions);

    return () => {
      map.off("popupopen", disableInteractions);
      map.off("popupclose", enableInteractions);
    };
  }, [map]);

  return null;
}

function AddMarkerOnClick({ onAddMarker, clickEnabled }) {
  useMapEvents({
    click: (e) => {
      if (!clickEnabled) return;

      const { lat, lng } = e.latlng;
      onAddMarker({ geocode: [lat, lng] });
    },
  });

  return null;
}

function UpdateMapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  return null;
}

const Secret = () => {
  const [markers, setMarkers] = useState([]);
  const [clickEnabled, setClickEnabled] = useState(true);
  const [userPosition, setUserPosition] = useState([45.4654219, 9.1859243]);
  const [userLocation, setUserLocation] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetch("/data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setMarkers(data))
      .catch((error) => {
        console.error("Error fetching marker data:", error);
      });
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setUserPosition([latitude, longitude]);
        setUserLocation([latitude, longitude]);
      },
      (error) => {
        console.error("Error with geolocation:", error);
      }
    );
  }, []);

  const handleAddMarker = async (newMarker) => {
    console.log(newMarker);

    const { status, error } = await supabase.from("locations").insert({
      name: "ciao",
      lon: newMarker.geocode[0],
      lat: newMarker.geocode[1],
    });

    console.log(status, error);

    setMarkers((currentMarkers) => [...currentMarkers, newMarker]);
  };

  const handleUpdateMarkerName = (index, newName) => {
    setMarkers((currentMarkers) =>
      currentMarkers.map((marker, i) =>
        i === index ? { ...marker, popUp: newName } : marker
      )
    );
  };

  const handleDeleteMarker = (index) => {
    setClickEnabled(false);
    setMarkers((currentMarkers) =>
      currentMarkers.filter((marker, i) => i !== index)
    );
    setTimeout(() => {
      setClickEnabled(true);
    }, 100);
  };

  const handleExportMarkers = () => {
    const markerData = JSON.stringify(markers, null, 2);
    const blob = new Blob([markerData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "markers.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target.result;
        try {
          const newMarkers = JSON.parse(fileContent);
          setMarkers(newMarkers);
        } catch (error) {
          console.error("Error parsing JSON file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <MapContainer center={userPosition} zoom={10}>
        <TileLayer
          attribution="Stadia.AlidadeSmoothDark"
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        <Marker position={userPosition} icon={userLocationIcon}></Marker>
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
        >
          {markers.map((marker, index) => (
            <Marker key={index} position={marker.geocode} icon={customIcon}>
              <Popup>
                <div>
                  <p>{marker.popUp}</p>
                  <form
                    className="popup-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const newName = e.target.elements.name.value;
                      handleUpdateMarkerName(index, newName);
                    }}
                  >
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter name"
                      defaultValue={marker.popUp}
                    />
                    <button type="submit">Update</button>
                  </form>
                  <button
                    onClick={() => handleDeleteMarker(index)}
                    className="popup-delete-button"
                  >
                    Delete
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup>
              <p>You are here</p>
            </Popup>
          </Marker>
        )}

        <UpdateMapCenter position={userLocation} />

        <DisableMapInteraction />
        <AddMarkerOnClick
          onAddMarker={handleAddMarker}
          clickEnabled={clickEnabled}
        />

        {/* Add Logout component */}
        <div className="logout-container">
          <Logout />
        </div>

        <div className="bottom-container">
          <button onClick={handleExportMarkers} className="export-button">
            Export Markers
          </button>
          <input
            type="file"
            onChange={handleFileUpload}
            className="upload-input"
          />
        </div>
      </MapContainer>
    </div>
  );
};

export default Secret;
