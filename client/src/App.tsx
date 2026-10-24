import { AppProvider, useApp } from '@/context/AppContext';
import { Layout } from '@/components/Layout';
import { OverviewPage } from '@/pages/OverviewPage';
import { BrandProfilePage } from '@/pages/BrandProfilePage';
import { SocialMonitoringPage } from '@/pages/SocialMonitoringPage';
import { AppMonitoringPage } from '@/pages/AppMonitoringPage';
import { ThreatIntelligencePage } from '@/pages/ThreatIntelligencePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AboutPage } from '@/pages/AboutPage';
import { LoginScreen } from '@/pages/LoginScreen';
import { LoadingScreen } from '@/pages/LoadingScreen';

function AppContent() {
  const { activeSection } = useApp();

  switch (activeSection) {
    case 'Overview':
      return <OverviewPage />;
    case 'Brand Profile':
      return <BrandProfilePage />;
    case 'Social Monitoring':
      return <SocialMonitoringPage />;
    case 'App Monitoring':
      return <AppMonitoringPage />;
    case 'Threat Intelligence':
      return <ThreatIntelligencePage />;
    case 'Reports':
      return <ReportsPage />;
    case 'About':
      return <AboutPage />;
    case 'Settings':
      return <SettingsPage />;
    default:
      return <OverviewPage />;
  }
}

function AppInner() {
  const { isLoading, isAuthenticated } = useApp();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginScreen />;

  return (
    <Layout>
      <AppContent />
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
