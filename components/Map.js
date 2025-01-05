import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";

const CustomMap = ({
    positions = []
}) => {
    useEffect(() => {
        import("leaflet/dist/leaflet.css");
    }, []);

    const FitBounds = ({ positions }) => {
        const map = useMap();

        useEffect(() => {
            if (positions.length > 0) {
                const bounds = L.latLngBounds(positions);
                map.fitBounds(bounds, { padding: [150, 150] });
            }
        }, [map, positions]);

        return null;
    };

    return (
        <MapContainer
            center={[0, 0]}
            zoom={13}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0,
            }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <FitBounds positions={positions.map(p => p.position)} />

            {positions.map((p, index) => {
                const CustomIcon = new L.divIcon({
                    className: "",
                    html: `<div class="w-16 rounded-full aspect-square" style="background-image:url(${p.profilePicture});background-size:cover;"></div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40]
                });

                return (
                    <Marker
                        key={index}
                        position={p.position}
                        icon={CustomIcon}
                    />
                );
            })}
        </MapContainer>
    );
};

export default CustomMap;