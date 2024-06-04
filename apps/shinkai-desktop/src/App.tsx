import { QueryProvider } from '@shinkai_network/shinkai-node-state';
import { Toaster } from '@shinkai_network/shinkai-ui';
import { BrowserRouter as Router } from 'react-router-dom';

import AppRoutes from './routes';
import { initSyncStorage } from './store/sync-utils';

initSyncStorage();
function App() {
  return (
    <QueryProvider>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster />
    </QueryProvider>
  );
}

export default App;