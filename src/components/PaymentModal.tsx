import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventTitle: string;
  eventPrice: number;
  userId: number;
  onSuccess: () => void;
}

const PaymentModal = ({ open, onOpenChange, eventId, eventTitle, eventPrice, userId, onSuccess }: PaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [step, setStep] = useState<'init' | 'payment' | 'success'>('init');

  const handleCreatePayment = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/1bf6286a-7e9f-4479-8bb0-23483e1220c4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_payment',
          user_id: userId,
          event_id: eventId,
          event_title: eventTitle,
          event_price: eventPrice
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentUrl(data.payment_url);
        setRegistrationId(data.registration_id);
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

  const handleConfirmPayment = () => {
    setStep('success');
    setTimeout(() => {
      onSuccess();
      onOpenChange(false);
      setStep('init');
    }, 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('init');
    setError('');
    setPaymentUrl('');
    setRegistrationId(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Регистрация на мероприятие
          </DialogTitle>
          <DialogDescription>
            {eventTitle}
          </DialogDescription>
        </DialogHeader>

        {step === 'init' && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Стоимость регистрации</p>
                    <p className="text-3xl font-bold">{eventPrice} ₽</p>
                  </div>
                  <Icon name="Ticket" size={48} className="text-primary" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="Check" size={16} className="text-green-600" />
                <span>Гарантированное место на мероприятии</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="Check" size={16} className="text-green-600" />
                <span>Уведомление о начале мероприятия</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="Check" size={16} className="text-green-600" />
                <span>Контакты других участников</span>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
                <Icon name="AlertCircle" size={18} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              onClick={handleCreatePayment}
              className="w-full bg-gradient-to-r from-primary via-secondary to-accent"
              disabled={loading}
              size="lg"
            >
              {loading ? 'Создание платежа...' : `Оплатить ${eventPrice} ₽`}
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="pt-6 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                  <Icon name="Smartphone" size={32} className="text-primary" />
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-2">Оплата через СБП</h3>
                  <p className="text-sm text-muted-foreground">
                    Откройте банковское приложение и отсканируйте QR-код для оплаты {eventPrice} ₽
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg inline-block">
                  <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                    <Icon name="QrCode" size={64} className="text-gray-400" />
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Регистрация #{registrationId}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button
                onClick={handleConfirmPayment}
                className="w-full bg-gradient-to-r from-primary via-secondary to-accent"
                size="lg"
              >
                <Icon name="Check" size={18} className="mr-2" />
                Я оплатил(а)
              </Button>
              
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full"
              >
                Отменить
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              После оплаты нажмите кнопку "Я оплатил(а)"
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center animate-scale-in">
              <Icon name="CheckCircle2" size={48} className="text-green-600" />
            </div>
            
            <div>
              <h3 className="font-bold text-xl mb-2">Регистрация успешна!</h3>
              <p className="text-muted-foreground">
                Вы зарегистрированы на мероприятие. Ждём вас!
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;