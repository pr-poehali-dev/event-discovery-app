import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import API_URLS from '@/config/api';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  onSuccess: () => void;
}

const categories = [
  { id: 'concert', name: 'Концерты', icon: 'Music' },
  { id: 'masterclass', name: 'Мастер-классы', icon: 'Palette' },
  { id: 'sport', name: 'Спорт', icon: 'Bike' },
  { id: 'party', name: 'Вечеринки', icon: 'PartyPopper' },
  { id: 'lecture', name: 'Лекции', icon: 'GraduationCap' },
];

const cities = [
  'Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород'
].sort();

const CreateEventModal = ({ open, onOpenChange, userId, onSuccess }: CreateEventModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [eventId, setEventId] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'lecture',
    city: 'Москва',
    event_date: '',
    event_time: '',
    participant_price: 0,
    latitude: 55.7558,
    longitude: 37.6173,
    max_participants: 50
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(API_URLS.events, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_event',
          organizer_id: userId,
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEventId(data.event_id);
        await handlePayPublication(data.event_id);
      } else {
        setError(data.error || 'Ошибка создания мероприятия');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPublication = async (evtId: number) => {
    setLoading(true);
    try {
      const response = await fetch(API_URLS.events, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay_publication',
          event_id: evtId,
          organizer_id: userId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentUrl(data.payment_url);
        setStep('payment');
      } else {
        setError(data.error || 'Ошибка создания платежа');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URLS.events, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_publication',
          publication_id: eventId
        })
      });

      if (response.ok) {
        setStep('success');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err) {
      setError('Ошибка подтверждения оплаты');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('form');
      setError('');
      setEventId(null);
      setPaymentUrl('');
      setFormData({
        title: '',
        description: '',
        category: 'lecture',
        city: 'Москва',
        event_date: '',
        event_time: '',
        participant_price: 0,
        latitude: 55.7558,
        longitude: 37.6173,
        max_participants: 50
      });
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Создать мероприятие
          </DialogTitle>
          <DialogDescription>
            Заплатите 150 ₽ за публикацию, участники заплатят цену которую вы укажете
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название мероприятия</Label>
              <Input
                id="title"
                placeholder="Лекция о космических технологиях"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                placeholder="Подробное описание вашего мероприятия..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Категория</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Город</Label>
                <select
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                  required
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Дата</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_time">Время</Label>
                <Input
                  id="event_time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="participant_price">Цена для участников (₽)</Label>
                <Input
                  id="participant_price"
                  type="number"
                  min="0"
                  placeholder="500"
                  value={formData.participant_price}
                  onChange={(e) => setFormData({ ...formData, participant_price: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants">Макс. участников</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  placeholder="50"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 50 })}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
                <Icon name="AlertCircle" size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary via-secondary to-accent"
              disabled={loading}
              size="lg"
            >
              {loading ? 'Создание...' : 'Создать и перейти к оплате 150 ₽'}
            </Button>
          </form>
        )}

        {step === 'payment' && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
              <Icon name="Smartphone" size={32} className="text-primary" />
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2">Оплата публикации 150 ₽</h3>
              <p className="text-sm text-muted-foreground">
                Откройте банковское приложение и отсканируйте QR-код
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg inline-block">
              <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                <Icon name="QrCode" size={64} className="text-gray-400" />
              </div>
            </div>

            <Button
              onClick={handleConfirmPayment}
              className="w-full bg-gradient-to-r from-primary via-secondary to-accent"
              disabled={loading}
              size="lg"
            >
              <Icon name="Check" size={18} className="mr-2" />
              Я оплатил(а)
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center animate-scale-in">
              <Icon name="CheckCircle2" size={48} className="text-green-600" />
            </div>
            
            <div>
              <h3 className="font-bold text-xl mb-2">Мероприятие опубликовано!</h3>
              <p className="text-muted-foreground">
                Ваше мероприятие теперь доступно всем пользователям
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;