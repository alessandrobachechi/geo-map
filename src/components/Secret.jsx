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
import { AuthInvalidCredentialsError } from "@supabase/supabase-js";

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
    const fetchLocations = async () => {
      try {
        const { data } = await supabase.from("locations").select();

        setMarkers(data);
      } catch (error) {}
    };

    fetchLocations();
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
    const formattedNewMarker = {
      name: "Lorem Ipsum",
      lon: newMarker.geocode[0],
      lat: newMarker.geocode[1],
    };

    const { data, status, error } = await supabase
      .from("locations")
      .insert(formattedNewMarker)
      .select();

    if (status === 201) {
      setMarkers((currentMarkers) => [
        ...currentMarkers,
        { ...formattedNewMarker, id: data[0].id },
      ]);
    }
  };

  const handleUpdateMarkerName = async (index, newName, selectedMarker) => {
    console.log(newName, selectedMarker);
    const { error } = await supabase
      .from("locations")
      .update({ name: newName })
      .eq("id", selectedMarker.id);

    setMarkers((currentMarkers) =>
      currentMarkers.map((marker, i) =>
        i === index ? { ...marker, name: newName } : marker
      )
    );
  };

  const handleDeleteMarker = async (index, selectedMarker) => {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", selectedMarker.id);

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
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=e2439d1c-7006-427a-8f66-9d904f1ad639"
        />
        <Marker position={userPosition} icon={userLocationIcon}></Marker>
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
        >
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={[marker.lon, marker.lat]}
              icon={customIcon}
            >
              <Popup>
                <div>
                  <p>{marker.name}</p>
                  <form
                    className="popup-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const newName = e.target.elements.name.value;
                      handleUpdateMarkerName(index, newName, marker);
                    }}
                  >
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter name"
                      defaultValue={marker.name}
                    />
                    <button type="submit">Update</button>
                  </form>
                  <button
                    onClick={() => handleDeleteMarker(index, marker)}
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
