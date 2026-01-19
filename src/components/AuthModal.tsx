import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: (user: any, token: string) => void;
}

const AuthModal = ({ open, onOpenChange, onAuthSuccess }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [smsCode, setSmsCode] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const [loginData, setLoginData] = useState({
    phone: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    phone: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/ce3d2a67-2077-41d8-abb6-bcb4c43de030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          ...loginData
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess(data.user, data.token);
        onOpenChange(false);
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/ce3d2a67-2077-41d8-abb6-bcb4c43de030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_sms',
          phone: registerData.phone
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('code');
        setCanResend(false);
        setResendTimer(60);
        
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.error || 'Ошибка отправки SMS');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/ce3d2a67-2077-41d8-abb6-bcb4c43de030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_sms',
          phone: registerData.phone,
          code: smsCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess(data.user, data.token);
        onOpenChange(false);
        setStep('phone');
        setSmsCode('');
      } else {
        setError(data.error || 'Неверный код');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Вход в Польза
          </DialogTitle>
          <DialogDescription>
            Войдите или зарегистрируйтесь для участия в полезных мероприятиях
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-phone">Телефон</Label>
                <Input
                  id="login-phone"
                  placeholder="+7 999 123-45-67"
                  value={loginData.phone}
                  onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Введите пароль"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
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
              >
                {loading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            {step === 'phone' ? (
              <form onSubmit={handleSendSMS} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Номер телефона</Label>
                  <Input
                    id="reg-phone"
                    placeholder="+7 999 123-45-67"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Мы отправим вам SMS с кодом подтверждения
                  </p>
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
                >
                  {loading ? 'Отправка...' : 'Получить код'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifySMS} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-code">Код из SMS</Label>
                  <Input
                    id="sms-code"
                    placeholder="1234"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    required
                    maxLength={4}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    Код отправлен на номер {registerData.phone}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {canResend ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={async () => {
                        setError('');
                        setLoading(true);
                        try {
                          const response = await fetch('https://functions.poehali.dev/ce3d2a67-2077-41d8-abb6-bcb4c43de030', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'send_sms',
                              phone: registerData.phone
                            })
                          });
                          
                          if (response.ok) {
                            setCanResend(false);
                            setResendTimer(60);
                            const timer = setInterval(() => {
                              setResendTimer((prev) => {
                                if (prev <= 1) {
                                  clearInterval(timer);
                                  setCanResend(true);
                                  return 0;
                                }
                                return prev - 1;
                              });
                            }, 1000);
                          } else {
                            const data = await response.json();
                            setError(data.error || 'Ошибка отправки SMS');
                          }
                        } catch (err) {
                          setError('Ошибка соединения с сервером');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="text-primary hover:text-primary/80"
                    >
                      <Icon name="RefreshCw" size={16} className="mr-2" />
                      Отправить код повторно
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Повторная отправка через {resendTimer} сек
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
                    <Icon name="AlertCircle" size={18} />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary via-secondary to-accent"
                    disabled={loading}
                  >
                    {loading ? 'Проверка...' : 'Подтвердить'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setStep('phone');
                      setSmsCode('');
                      setError('');
                    }}
                  >
                    Изменить номер
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;