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

  const [loginData, setLoginData] = useState({
    phone: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    phone: '',
    password: '',
    full_name: '',
    passport_series: '',
    passport_number: '',
    passport_issued_by: '',
    passport_issue_date: '',
    date_of_birth: ''
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/ce3d2a67-2077-41d8-abb6-bcb4c43de030', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          ...registerData
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess(data.user, data.token);
        onOpenChange(false);
      } else {
        setError(data.error || 'Ошибка регистрации');
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
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Телефон</Label>
                <Input
                  id="reg-phone"
                  placeholder="+7 999 123-45-67"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Пароль</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-fullname">ФИО полностью</Label>
                <Input
                  id="reg-fullname"
                  placeholder="Иванов Иван Иванович"
                  value={registerData.full_name}
                  onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-passport-series">Серия паспорта</Label>
                  <Input
                    id="reg-passport-series"
                    placeholder="1234"
                    value={registerData.passport_series}
                    onChange={(e) => setRegisterData({ ...registerData, passport_series: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-passport-number">Номер паспорта</Label>
                  <Input
                    id="reg-passport-number"
                    placeholder="567890"
                    value={registerData.passport_number}
                    onChange={(e) => setRegisterData({ ...registerData, passport_number: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-passport-issued">Кем выдан паспорт</Label>
                <Input
                  id="reg-passport-issued"
                  placeholder="ОВД Центрального района"
                  value={registerData.passport_issued_by}
                  onChange={(e) => setRegisterData({ ...registerData, passport_issued_by: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-passport-date">Дата выдачи</Label>
                  <Input
                    id="reg-passport-date"
                    type="date"
                    value={registerData.passport_issue_date}
                    onChange={(e) => setRegisterData({ ...registerData, passport_issue_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-birthdate">Дата рождения</Label>
                  <Input
                    id="reg-birthdate"
                    type="date"
                    value={registerData.date_of_birth}
                    onChange={(e) => setRegisterData({ ...registerData, date_of_birth: e.target.value })}
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
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;