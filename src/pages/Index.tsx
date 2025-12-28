import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventMap from '@/components/EventMap';
import AuthModal from '@/components/AuthModal';
import PaymentModal from '@/components/PaymentModal';
import CreateEventModal from '@/components/CreateEventModal';

const categories = [
  { id: 'concert', name: 'Концерты', icon: 'Music', color: 'bg-primary' },
  { id: 'masterclass', name: 'Мастер-классы', icon: 'Palette', color: 'bg-secondary' },
  { id: 'sport', name: 'Спорт', icon: 'Bike', color: 'bg-accent' },
  { id: 'party', name: 'Вечеринки', icon: 'PartyPopper', color: 'bg-primary' },
  { id: 'lecture', name: 'Лекции', icon: 'GraduationCap', color: 'bg-secondary' },
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedEventForPayment, setSelectedEventForPayment] = useState<any>(null);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [dbEvents, setDbEvents] = useState<any[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    loadEvents();

    // PWA install prompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Request notification permission
    if ('Notification' in window && 'serviceWorker' in navigator) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Разрешение на уведомления получено');
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/6dc8c670-1808-406f-b23c-1b48e5c50bad');
      const data = await response.json();
      if (response.ok) {
        setDbEvents(data.events);
      }
    } catch (err) {
      console.error('Ошибка загрузки мероприятий:', err);
    }
  };

  const handleAuthSuccess = (userData: any, token: string) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleParticipate = (event: any) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedEventForPayment(event);
    setPaymentModalOpen(true);
  };

  const handleCreateEventSuccess = () => {
    loadEvents();
    
    // Send notification about new event
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Мероприятие создано! 🎉', {
          body: 'Ваше мероприятие опубликовано и доступно другим пользователям',
          icon: 'https://cdn.poehali.dev/files/IMG_3049.jpeg',
          badge: 'https://cdn.poehali.dev/files/IMG_3049.jpeg',
          vibrate: [200, 100, 200]
        });
      });
    }
  };

  const handlePaymentSuccess = () => {
    if (selectedEventForPayment) {
      setSavedEvents((prev) => [...prev, selectedEventForPayment.id]);
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('PWA установлено');
      }
      setDeferredPrompt(null);
      setShowQR(false);
    } else {
      setShowQR(!showQR);
    }
  };

  const allEvents = [...mockEvents, ...dbEvents.map(e => ({
    id: e.id,
    title: e.title,
    category: e.category,
    city: e.city,
    date: e.date,
    time: e.time,
    price: e.participant_price === 0 ? 'Бесплатно' : `${e.participant_price} ₽`,
    attendees: 0,
    lat: e.latitude || 55.7558,
    lng: e.longitude || 37.6173,
    description: e.description,
    participant_price: e.participant_price
  }))];

  const filteredEvents = allEvents.filter((event) => {
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
    return allEvents.filter((event) => event.city === city).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8 animate-fade-in">
          <div className="flex justify-end mb-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setCreateEventModalOpen(true)}
                  className="bg-gradient-to-r from-primary via-secondary to-accent rounded-full"
                >
                  <Icon name="Plus" size={18} className="mr-2" />
                  Создать мероприятие
                </Button>
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

          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="https://cdn.poehali.dev/projects/6576c960-0058-4fa0-a117-1b051088e659/files/298aefc8-cd20-4445-a228-b4bf379146c3.jpg" 
              alt="Польза" 
              className="w-20 h-20 rounded-2xl shadow-lg"
            />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Польза
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Найди полезные мероприятия в любом городе России
          </p>
          
          <Button
            onClick={handleInstallApp}
            variant="outline"
            className="mt-4 rounded-full"
          >
            <Icon name="Download" size={18} className="mr-2" />
            {deferredPrompt ? 'Установить приложение' : (showQR ? 'Скрыть QR-код' : 'Скачать приложение')}
          </Button>

          {showQR && (
            <Card className="mt-6 max-w-sm mx-auto animate-scale-in">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <QRCodeSVG 
                    value={window.location.origin}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Установите приложение</h3>
                  <p className="text-sm text-muted-foreground">
                    Отсканируйте QR-код камерой телефона для быстрого доступа
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>📱 iOS: Safari → Поделиться → На экран «Домой»</p>
                  <p>📱 Android: Chrome → Меню → Добавить на главный экран</p>
                </div>
              </CardContent>
            </Card>
          )}
        </header>

        <AuthModal 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen}
          onAuthSuccess={handleAuthSuccess}
        />

        {selectedEventForPayment && (
          <PaymentModal
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            eventId={selectedEventForPayment.id}
            eventTitle={selectedEventForPayment.title}
            eventPrice={selectedEventForPayment.participant_price || 100}
            userId={user?.id}
            onSuccess={handlePaymentSuccess}
          />
        )}

        <CreateEventModal
          open={createEventModalOpen}
          onOpenChange={setCreateEventModalOpen}
          userId={user?.id}
          onSuccess={handleCreateEventSuccess}
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
                        <Button 
                          onClick={() => handleParticipate(event)}
                          className="w-full mt-4 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
                        >
                          {isSaved ? (
                            <>
                              <Icon name="CheckCircle2" size={18} className="mr-2" />
                              Зарегистрирован
                            </>
                          ) : (
                            <>
                              {event.participant_price === 0 || event.price === 'Бесплатно' 
                                ? 'Участвовать бесплатно' 
                                : `Участвовать за ${event.participant_price || event.price}`}
                            </>
                          )}
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

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-muted-foreground">
          <p>© 2025 Польза. Все права защищены.</p>
          <p className="mt-2">Полезные мероприятия по всей России</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;