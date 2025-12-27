import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Event {
  id: number;
  title: string;
  category: string;
  city: string;
  date: string;
  time: string;
  price: string;
  attendees: number;
  lat: number;
  lng: number;
  description: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface EventMapProps {
  events: Event[];
  categories: Category[];
  onEventSelect?: (eventId: number) => void;
}

const createCustomIcon = (color: string) => {
  const colorMap: Record<string, string> = {
    'bg-primary': '#8B5CF6',
    'bg-secondary': '#D946EF',
    'bg-accent': '#F97316',
  };

  const svgIcon = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" 
            fill="${colorMap[color] || '#8B5CF6'}" 
            stroke="white" 
            stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

const MapBoundsUpdater = ({ events }: { events: Event[] }) => {
  const map = useMap();

  useEffect(() => {
    if (events.length > 0) {
      const bounds = L.latLngBounds(events.map((event) => [event.lat, event.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [events, map]);

  return null;
};

const EventMap = ({ events, categories, onEventSelect }: EventMapProps) => {
  const defaultCenter: [number, number] = events.length > 0 
    ? [events[0].lat, events[0].lng] 
    : [55.7558, 37.6173];

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden shadow-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsUpdater events={events} />
        {events.map((event) => {
          const category = categories.find((c) => c.id === event.category);
          return (
            <Marker
              key={event.id}
              position={[event.lat, event.lng]}
              icon={createCustomIcon(category?.color || 'bg-primary')}
            >
              <Popup>
                <div className="min-w-[250px] p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${category?.color}`} />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {category?.name}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="MapPin" size={14} className="text-primary" />
                      <span>{event.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Calendar" size={14} className="text-secondary" />
                      <span>{new Date(event.date).toLocaleDateString('ru-RU')} в {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Ticket" size={14} className="text-accent" />
                      <span className="font-semibold">{event.price}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Users" size={14} />
                      <span>{event.attendees} участников</span>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-primary via-secondary to-accent"
                    onClick={() => onEventSelect?.(event.id)}
                  >
                    Участвовать
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default EventMap;
