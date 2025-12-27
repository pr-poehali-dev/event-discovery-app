import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventMap from '@/components/EventMap';
import AuthModal from '@/components/AuthModal';

const categories = [
  { id: 'concert', name: 'Концерты', icon: 'Music', color: 'bg-primary' },
  { id: 'masterclass', name: 'Мастер-классы', icon: 'Palette', color: 'bg-secondary' },
  { id: 'sport', name: 'Спорт', icon: 'Bike', color: 'bg-accent' },
  { id: 'party', name: 'Вечеринки', icon: 'PartyPopper', color: 'bg-primary' },
];

const cities = [
  'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород',
  'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Воронеж', 'Пермь',
  'Волгоград', 'Краснодар', 'Саратов', 'Тюмень', 'Тольятти', 'Ижевск', 'Барнаул', 'Ульяновск',
  'Иркутск', 'Хабаровск', 'Ярославль', 'Владивосток', 'Махачкала', 'Томск', 'Оренбург',
  'Кемерово', 'Новокузнецк', 'Рязань', 'Астрахань', 'Набережные Челны', 'Пенза', 'Липецк',
  'Тула', 'Киров', 'Чебоксары', 'Калининград', 'Брянск', 'Курск', 'Иваново', 'Магнитогорск',
  'Тверь', 'Ставрополь', 'Симферополь', 'Белгород', 'Сочи', 'Нижний Тагил', 'Архангельск',
  'Владимир', 'Калуга', 'Чита', 'Смоленск', 'Волжский', 'Курган', 'Череповец', 'Орёл',
  'Владикавказ', 'Мурманск', 'Саранск', 'Вологда', 'Тамбов', 'Стерлитамак', 'Грозный',
  'Кострома', 'Петрозаводск', 'Нижневартовск', 'Йошкар-Ола', 'Новороссийск', 'Комсомольск-на-Амуре',
  'Таганрог', 'Сыктывкар', 'Братск', 'Дзержинск', 'Орск', 'Нальчик', 'Шахты', 'Якутск',
  'Улан-Удэ', 'Севастополь', 'Ангарск', 'Благовещенск', 'Великий Новгород', 'Псков', 'Энгельс',
  'Бийск', 'Балаково', 'Армавир', 'Северодвинск', 'Королёв', 'Петропавловск-Камчатский', 
  'Сызрань', 'Норильск', 'Южно-Сахалинск', 'Каменск-Уральский', 'Балашиха', 'Подольск',
  'Мытищи', 'Люберцы', 'Химки', 'Керчь', 'Новочеркасск', 'Красногорск', 'Сургут', 'Вольск'
].sort();

const mockEvents = [
  {
    id: 1,
    title: 'Рок-концерт "Звёздная ночь"',
    category: 'concert',
    city: 'Москва',
    date: '2025-01-15',
    time: '20:00',
    price: 'от 1500 ₽',
    attendees: 234,
    lat: 55.7558,
    lng: 37.6173,
    description: 'Грандиозное выступление рок-групп',
  },
  {
    id: 2,
    title: 'Мастер-класс по керамике',
    category: 'masterclass',
    city: 'Санкт-Петербург',
    date: '2025-01-20',
    time: '14:00',
    price: '2000 ₽',
    attendees: 15,
    lat: 59.9343,
    lng: 30.3351,
    description: 'Создайте уникальную керамику своими руками',
  },
  {
    id: 3,
    title: 'Утренняя пробежка в парке',
    category: 'sport',
    city: 'Москва',
    date: '2025-01-10',
    time: '08:00',
    price: 'Бесплатно',
    attendees: 48,
    lat: 55.7522,
    lng: 37.6156,
    description: 'Совместная пробежка для всех уровней подготовки',
  },
  {
    id: 4,
    title: 'Танцевальная вечеринка 90-х',
    category: 'party',
    city: 'Казань',
    date: '2025-01-18',
    time: '21:00',
    price: 'от 800 ₽',
    attendees: 156,
    lat: 55.7887,
    lng: 49.1221,
    description: 'Вечеринка в стиле лихих 90-х',
  },
  {
    id: 5,
    title: 'Йога на рассвете',
    category: 'sport',
    city: 'Санкт-Петербург',
    date: '2025-01-12',
    time: '06:30',
    price: '500 ₽',
    attendees: 22,
    lat: 59.9386,
    lng: 30.3141,
    description: 'Встречаем рассвет с практикой йоги',
  },
  {
    id: 6,
    title: 'Джазовый вечер',
    category: 'concert',
    city: 'Екатеринбург',
    date: '2025-01-25',
    time: '19:00',
    price: 'от 1200 ₽',
    attendees: 89,
    lat: 56.8389,
    lng: 60.6057,
    description: 'Импровизация и классика джаза',
  },
];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedEvents, setSavedEvents] = useState<number[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleAuthSuccess = (userData: any, token: string) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const filteredEvents = mockEvents.filter((event) => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesCity = selectedCity === 'all' || event.city === selectedCity;
    const matchesSearch =
      searchQuery === '' ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesCity && matchesSearch;
  });

  const toggleSaveEvent = (eventId: number) => {
    setSavedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const getEventCountByCity = (city: string) => {
    return mockEvents.filter((event) => event.city === city).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8 animate-fade-in">
          <div className="flex justify-end mb-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="rounded-full"
                >
                  <Icon name="LogOut" size={18} className="mr-2" />
                  Выйти
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setAuthModalOpen(true)}
                className="bg-gradient-to-r from-primary via-secondary to-accent rounded-full"
              >
                <Icon name="User" size={18} className="mr-2" />
                Войти
              </Button>
            )}
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            EventHub
          </h1>
          <p className="text-xl text-muted-foreground">
            Найди своё идеальное мероприятие в любом городе России
          </p>
        </header>

        <AuthModal 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen}
          onAuthSuccess={handleAuthSuccess}
        />

        <div className="mb-8 space-y-4 animate-scale-in">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск мероприятий..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-12 px-4 rounded-xl border border-input bg-background text-foreground min-w-[200px]"
            >
              <option value="all">Все города ({cities.length})</option>
              {cities.map((city) => {
                const count = getEventCountByCity(city);
                return (
                  <option key={city} value={city}>
                    {city} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className="rounded-full transition-all hover:scale-105"
            >
              Все
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                className="rounded-full transition-all hover:scale-105"
              >
                <Icon name={cat.icon as any} size={16} className="mr-2" />
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'list' | 'map')} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Icon name="List" size={18} />
              Список
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Icon name="Map" size={18} />
              Карта
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4 mt-6">
            {filteredEvents.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Icon name="SearchX" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl text-muted-foreground">Мероприятия не найдены</p>
                  <p className="text-sm text-muted-foreground mt-2">Попробуйте изменить фильтры</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const category = categories.find((c) => c.id === event.category);
                  const isSaved = savedEvents.includes(event.id);

                  return (
                    <Card
                      key={event.id}
                      className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                    >
                      <CardHeader className={`${category?.color} text-white relative`}>
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="mb-2 bg-white/20 text-white border-0">
                            <Icon name={category?.icon as any} size={14} className="mr-1" />
                            {category?.name}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSaveEvent(event.id)}
                            className="hover:bg-white/20 text-white"
                          >
                            <Icon
                              name={isSaved ? 'Heart' : 'Heart'}
                              size={20}
                              className={isSaved ? 'fill-white' : ''}
                            />
                          </Button>
                        </div>
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription className="text-white/90">{event.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="MapPin" size={16} className="text-primary" />
                          <span>{event.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Calendar" size={16} className="text-secondary" />
                          <span>{new Date(event.date).toLocaleDateString('ru-RU')} в {event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Icon name="Ticket" size={16} className="text-accent" />
                          <span className="font-semibold">{event.price}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Icon name="Users" size={16} />
                          <span>{event.attendees} участников</span>
                        </div>
                        <Button className="w-full mt-4 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity">
                          Участвовать
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            {filteredEvents.length > 0 ? (
              <EventMap 
                events={filteredEvents} 
                categories={categories}
                onEventSelect={(eventId) => console.log('Selected event:', eventId)}
              />
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Icon name="MapOff" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl text-muted-foreground">Нет событий для отображения</p>
                  <p className="text-sm text-muted-foreground mt-2">Выберите другой город или категорию</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {savedEvents.length > 0 && (
          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Heart" size={24} className="text-primary fill-primary" />
                Сохранённые мероприятия ({savedEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {savedEvents.map((eventId) => {
                  const event = mockEvents.find((e) => e.id === eventId);
                  return (
                    <Badge key={eventId} variant="secondary" className="px-3 py-1">
                      {event?.title}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;