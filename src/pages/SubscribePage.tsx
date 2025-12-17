import { SubscriptionTab } from './Settings/SubscriptionTab';
import { PageHeader } from '@/components/PageHeader';

const SubscribePage = () => {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        <PageHeader
          title="Suscripción"
          subtitle="Gestiona tu plan para restaurar el acceso completo a la plataforma."
        />
      <SubscriptionTab />
    </div>
  );
};

export default SubscribePage;
