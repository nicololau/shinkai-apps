import { buttonVariants } from '@shinkai_network/shinkai-ui';
import { cn } from '@shinkai_network/shinkai-ui/utils';
import { QueryClientProvider } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { OllamaModels } from '../components/shinkai-node-manager/ollama-models';
import { shinkaiNodeQueryClient } from '../lib/shinkai-node-manager/shinkai-node-manager-client';
import { SubpageLayout } from './layout/simple-layout';

const AgentsLocally = () => {
  return (
    <QueryClientProvider client={shinkaiNodeQueryClient}>
      <SubpageLayout
        className="relative flex w-full max-w-6xl flex-col gap-2 px-4"
        title="Install AI Models"
      >
        <p className="text-gray-80 pb-2 text-sm">
          After installing AI models on your local machine, they will become
          available as AI
        </p>
        <OllamaModels />
        <div className="absolute right-4 top-6 flex justify-center pt-3">
          <Link
            className={cn(
              buttonVariants({
                size: 'auto',
              }),
              'min-w-[120px] gap-2 py-2.5',
            )}
            to={{ pathname: '/add-agent' }}
          >
            <Plus className="h-4 w-4" />
            Manually Add AI
          </Link>
        </div>
      </SubpageLayout>
    </QueryClientProvider>
  );
};

export default AgentsLocally;
